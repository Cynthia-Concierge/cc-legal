/**
 * Calendly Service
 * Handles Calendly webhook events and appointment tracking
 */

import crypto from 'crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy initialization of Supabase admin client
let supabaseAdmin: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdmin) {
    supabaseAdmin = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
  }
  return supabaseAdmin;
}

export interface CalendlyAppointment {
  calendly_event_id: string;
  event_type: string;
  event_name?: string;
  start_time: string;
  end_time: string;
  status: string;
  location?: string;
  invitee_email: string;
  invitee_name?: string;
  invitee_phone?: string;
  canceled_at?: string;
  cancellation_reason?: string;
  rescheduled_from_event_id?: string;
  questions_answers?: any;
  utm_parameters?: any;
  raw_payload?: any;
}

export class CalendlyService {
  private webhookSigningKey?: string;

  constructor(webhookSigningKey?: string) {
    this.webhookSigningKey = webhookSigningKey;
  }

  /**
   * Verify Calendly webhook signature
   * https://developer.calendly.com/api-docs/ZG9jOjM2MzE2MDM4-webhook-signatures
   */
  verifyWebhookSignature(
    payload: string,
    signature: string,
    tolerance: number = 180000 // 3 minutes in milliseconds
  ): boolean {
    if (!this.webhookSigningKey) {
      console.warn('[CalendlyService] ⚠️ No webhook signing key configured - skipping signature verification');
      return true; // Allow in dev mode without key
    }

    try {
      // Calendly uses HMAC SHA256
      const hmac = crypto.createHmac('sha256', this.webhookSigningKey);
      hmac.update(payload);
      const expectedSignature = hmac.digest('hex');

      // Compare signatures using timing-safe comparison
      const isValid = crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );

      if (!isValid) {
        console.error('[CalendlyService] ❌ Invalid webhook signature');
      }

      return isValid;
    } catch (error) {
      console.error('[CalendlyService] ❌ Error verifying webhook signature:', error);
      return false;
    }
  }

  /**
   * Process Calendly webhook event
   */
  async processWebhookEvent(event: any): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const eventType = event.event;
      console.log(`[CalendlyService] Processing webhook event: ${eventType}`);

      switch (eventType) {
        case 'invitee.created':
          return await this.handleInviteeCreated(event);

        case 'invitee.canceled':
          return await this.handleInviteeCanceled(event);

        default:
          console.log(`[CalendlyService] ℹ️ Unhandled event type: ${eventType}`);
          return {
            success: true,
            message: `Event type ${eventType} received but not processed`
          };
      }
    } catch (error) {
      console.error('[CalendlyService] ❌ Error processing webhook event:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error processing webhook'
      };
    }
  }

  /**
   * Handle invitee.created event
   * Triggered when someone books an appointment
   */
  private async handleInviteeCreated(event: any): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const payload = event.payload;
      const invitee = payload.invitee;
      const eventData = payload.event;

      // Extract invitee email
      const inviteeEmail = invitee.email;
      if (!inviteeEmail) {
        throw new Error('No invitee email in webhook payload');
      }

      // Extract questions and answers
      const questionsAnswers = invitee.questions_and_answers || [];

      // Extract phone number from questions if available
      let phoneNumber = null;
      const phoneQuestion = questionsAnswers.find((qa: any) =>
        qa.question?.toLowerCase().includes('phone')
      );
      if (phoneQuestion) {
        phoneNumber = phoneQuestion.answer;
      }

      // Build appointment record
      const appointment: CalendlyAppointment = {
        calendly_event_id: eventData.uri.split('/').pop() || eventData.uri,
        event_type: 'invitee.created',
        event_name: payload.event_type?.name,
        start_time: eventData.start_time,
        end_time: eventData.end_time,
        status: 'active',
        location: eventData.location?.join_url || eventData.location?.location,
        invitee_email: inviteeEmail,
        invitee_name: invitee.name,
        invitee_phone: phoneNumber,
        questions_answers: questionsAnswers,
        utm_parameters: invitee.tracking,
        raw_payload: payload
      };

      // Save to database
      const { data, error } = await getSupabaseAdmin()
        .from('calendly_appointments')
        .insert(appointment)
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log(`[CalendlyService] ✅ Appointment created for ${inviteeEmail}`);

      // Also update the legacy calendly_booked_at field in contacts/users tables
      await this.updateLegacyBookingStatus(inviteeEmail);

      return {
        success: true,
        message: 'Appointment created successfully',
        data
      };
    } catch (error) {
      console.error('[CalendlyService] ❌ Error handling invitee.created:', error);
      throw error;
    }
  }

  /**
   * Handle invitee.canceled event
   * Triggered when someone cancels an appointment
   */
  private async handleInviteeCanceled(event: any): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const payload = event.payload;
      const invitee = payload.invitee;
      const eventData = payload.event;

      const eventId = eventData.uri.split('/').pop() || eventData.uri;
      const canceledAt = payload.canceled_at || new Date().toISOString();
      const cancellationReason = invitee.cancellation?.reason;

      // Update appointment status to canceled
      const { data, error } = await getSupabaseAdmin()
        .from('calendly_appointments')
        .update({
          status: 'canceled',
          canceled_at: canceledAt,
          cancellation_reason: cancellationReason,
          updated_at: new Date().toISOString()
        })
        .eq('calendly_event_id', eventId)
        .select()
        .single();

      if (error) {
        // If appointment doesn't exist, create a canceled record
        if (error.code === 'PGRST116') {
          const appointment: CalendlyAppointment = {
            calendly_event_id: eventId,
            event_type: 'invitee.canceled',
            event_name: payload.event_type?.name,
            start_time: eventData.start_time,
            end_time: eventData.end_time,
            status: 'canceled',
            invitee_email: invitee.email,
            invitee_name: invitee.name,
            canceled_at: canceledAt,
            cancellation_reason: cancellationReason,
            raw_payload: payload
          };

          const { data: newData, error: insertError } = await getSupabaseAdmin()
            .from('calendly_appointments')
            .insert(appointment)
            .select()
            .single();

          if (insertError) throw insertError;

          console.log(`[CalendlyService] ✅ Canceled appointment record created for ${invitee.email}`);
          return {
            success: true,
            message: 'Canceled appointment recorded',
            data: newData
          };
        }
        throw error;
      }

      console.log(`[CalendlyService] ✅ Appointment ${eventId} marked as canceled`);

      return {
        success: true,
        message: 'Appointment canceled successfully',
        data
      };
    } catch (error) {
      console.error('[CalendlyService] ❌ Error handling invitee.canceled:', error);
      throw error;
    }
  }

  /**
   * Update legacy calendly_booked_at field in contacts/users tables
   * This maintains backward compatibility with the existing tracking
   */
  private async updateLegacyBookingStatus(email: string): Promise<void> {
    try {
      const timestamp = new Date().toISOString();

      // Update contacts table
      const { error: contactError } = await getSupabaseAdmin()
        .from('contacts')
        .update({ calendly_booked_at: timestamp })
        .eq('email', email);

      if (contactError) {
        console.warn(`[CalendlyService] ⚠️ Could not update contact for ${email}:`, contactError.message);
      }

      // Update users table
      const { error: userError } = await getSupabaseAdmin()
        .from('users')
        .update({ calendly_booked_at: timestamp })
        .eq('email', email);

      if (userError) {
        console.warn(`[CalendlyService] ⚠️ Could not update user for ${email}:`, userError.message);
      }

      console.log(`[CalendlyService] ✅ Updated legacy booking status for ${email}`);
    } catch (error) {
      console.warn('[CalendlyService] ⚠️ Error updating legacy booking status:', error);
      // Don't throw - this is a non-critical operation
    }
  }

  /**
   * Get appointments for a specific email
   */
  async getAppointmentsByEmail(email: string): Promise<CalendlyAppointment[]> {
    try {
      const { data, error } = await getSupabaseAdmin()
        .from('calendly_appointments')
        .select('*')
        .eq('invitee_email', email)
        .order('start_time', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('[CalendlyService] ❌ Error fetching appointments:', error);
      throw error;
    }
  }

  /**
   * Get upcoming appointments
   */
  async getUpcomingAppointments(limit: number = 50): Promise<CalendlyAppointment[]> {
    try {
      const now = new Date().toISOString();

      const { data, error } = await getSupabaseAdmin()
        .from('calendly_appointments')
        .select('*')
        .eq('status', 'active')
        .gte('start_time', now)
        .order('start_time', { ascending: true })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('[CalendlyService] ❌ Error fetching upcoming appointments:', error);
      throw error;
    }
  }
}
