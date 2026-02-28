/**
 * Supabase Service
 * Handles saving contacts to Supabase database
 */
import { SupabaseClient } from "@supabase/supabase-js";
export interface ContactData {
    name: string;
    email: string;
    phone: string;
    website: string;
    instagram_handle?: string;
    first_name?: string;
    last_name?: string;
    source?: string;
    utm_source?: string | null;
    utm_medium?: string | null;
    utm_campaign?: string | null;
}
export declare class SupabaseService {
    private supabase;
    client: SupabaseClient;
    constructor(supabaseUrl: string, supabaseKey: string);
    /**
     * Save a contact to the Supabase database
     */
    saveContact(contactData: ContactData): Promise<any>;
    /**
     * Check if a contact with the given email already exists
     */
    contactExists(email: string): Promise<boolean>;
    /**
     * Save a lead to the book_a_call_funnel table
     * Allows multiple submissions per email (tracks each submission separately)
     */
    saveBookCallFunnelLead(leadData: {
        name: string;
        email: string;
        phone: string;
        meta_lead_event_id?: string;
        utm_source?: string;
        utm_medium?: string;
        utm_campaign?: string;
        referrer?: string;
    }): Promise<any>;
    /**
     * Update a book_a_call_funnel lead when Calendly booking is completed
     * Updates the most recent record for this email that hasn't been scheduled yet
     */
    updateBookCallFunnelBooking(email: string, bookingData: {
        calendly_event_uri?: string;
        meta_schedule_event_id?: string;
    }): Promise<any>;
}
