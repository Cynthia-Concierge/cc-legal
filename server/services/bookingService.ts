/**
 * Booking Service
 * Handles mock and real booking logic
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

export interface Appointment {
  id: string;
  business_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  service: string;
  date: string;
  time: string;
  status: "pending" | "confirmed" | "cancelled";
  notes?: string;
  created_at: string;
}

export interface CreateAppointmentInput {
  business_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  service: string;
  date: string;
  time: string;
  notes?: string;
}

export interface BookingSystemConfig {
  type: "mock" | "calendly" | "squarespace" | "aestheticpro" | "custom";
  apiKey?: string;
  calendarId?: string;
  webhookUrl?: string;
  [key: string]: any;
}

export class BookingService {
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Create a mock appointment (stores in database)
   */
  async createMockAppointment(
    input: CreateAppointmentInput
  ): Promise<Appointment> {
    try {
      const { data, error } = await this.supabase
        .from("appointments")
        .insert([
          {
            business_id: input.business_id,
            customer_name: input.customer_name,
            customer_email: input.customer_email,
            customer_phone: input.customer_phone || null,
            service: input.service,
            date: input.date,
            time: input.time,
            status: "pending",
            notes: input.notes || null,
          },
        ])
        .select()
        .single();

      if (error) {
        // If appointments table doesn't exist, create it on the fly
        if (error.code === "42P01") {
          await this.createAppointmentsTable();
          // Retry insert
          const { data: retryData, error: retryError } = await this.supabase
            .from("appointments")
            .insert([
              {
                business_id: input.business_id,
                customer_name: input.customer_name,
                customer_email: input.customer_email,
                customer_phone: input.customer_phone || null,
                service: input.service,
                date: input.date,
                time: input.time,
                status: "pending",
                notes: input.notes || null,
              },
            ])
            .select()
            .single();

          if (retryError) {
            throw retryError;
          }
          return retryData;
        }
        throw error;
      }

      return data;
    } catch (error: any) {
      console.error("Error creating mock appointment:", error);
      throw error;
    }
  }

  /**
   * Create appointment via real booking system
   */
  async createRealAppointment(
    input: CreateAppointmentInput,
    config: BookingSystemConfig
  ): Promise<Appointment> {
    try {
      switch (config.type) {
        case "calendly":
          return await this.createCalendlyAppointment(input, config);
        case "squarespace":
          return await this.createSquarespaceAppointment(input, config);
        case "aestheticpro":
          return await this.createAestheticProAppointment(input, config);
        case "custom":
          return await this.createCustomAppointment(input, config);
        default:
          // Fallback to mock
          return await this.createMockAppointment(input);
      }
    } catch (error: any) {
      console.error("Error creating real appointment:", error);
      throw error;
    }
  }

  /**
   * Create appointment via Calendly API
   */
  private async createCalendlyAppointment(
    input: CreateAppointmentInput,
    config: BookingSystemConfig
  ): Promise<Appointment> {
    // TODO: Implement Calendly API integration
    // For now, fallback to mock
    console.log("Calendly integration not yet implemented, using mock");
    return await this.createMockAppointment(input);
  }

  /**
   * Create appointment via Squarespace Scheduling API
   */
  private async createSquarespaceAppointment(
    input: CreateAppointmentInput,
    config: BookingSystemConfig
  ): Promise<Appointment> {
    // TODO: Implement Squarespace API integration
    console.log("Squarespace integration not yet implemented, using mock");
    return await this.createMockAppointment(input);
  }

  /**
   * Create appointment via AestheticPro API
   */
  private async createAestheticProAppointment(
    input: CreateAppointmentInput,
    config: BookingSystemConfig
  ): Promise<Appointment> {
    // TODO: Implement AestheticPro API integration
    console.log("AestheticPro integration not yet implemented, using mock");
    return await this.createMockAppointment(input);
  }

  /**
   * Create appointment via custom webhook
   */
  private async createCustomAppointment(
    input: CreateAppointmentInput,
    config: BookingSystemConfig
  ): Promise<Appointment> {
    if (config.webhookUrl) {
      try {
        const response = await fetch(config.webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(input),
        });

        if (!response.ok) {
          throw new Error(`Webhook returned ${response.status}`);
        }

        const result = await response.json();
        
        // Store in database as well
        return await this.createMockAppointment(input);
      } catch (error) {
        console.error("Custom webhook failed, using mock:", error);
        return await this.createMockAppointment(input);
      }
    }

    return await this.createMockAppointment(input);
  }

  /**
   * Get appointments for a business
   */
  async getAppointments(businessId: string): Promise<Appointment[]> {
    try {
      const { data, error } = await this.supabase
        .from("appointments")
        .select("*")
        .eq("business_id", businessId)
        .order("date", { ascending: true })
        .order("time", { ascending: true });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error: any) {
      console.error("Error getting appointments:", error);
      return [];
    }
  }

  /**
   * Create appointments table if it doesn't exist (helper method)
   * Note: In production, this should be done via migration
   */
  private async createAppointmentsTable(): Promise<void> {
    // This is a helper - in production, use proper migrations
    console.warn("Appointments table doesn't exist. Please run the migration SQL.");
  }
}

