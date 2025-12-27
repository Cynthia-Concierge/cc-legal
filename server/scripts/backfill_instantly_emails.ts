
/**
 * Backfill Instantly.ai Emails Script
 * 
 * This script connects to Supabase, fetches all completed workflow results that have email content,
 * and updates the corresponding leads in Instantly.ai with the subject and body.
 * 
 * Usage:
 * npx tsx server/scripts/backfill_instantly_emails.ts
 */

import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { InstantlyService } from "../services/instantlyService.js";

// Load environment variables
dotenv.config();

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const INSTANTLY_API_KEY = process.env.INSTANTLY_AI_API_KEY;
const INSTANTLY_CAMPAIGN_ID = process.env.INSTANTLY_CAMPAIGN_ID || "7f93b98c-f8c6-4c2b-b707-3ea4d0df6934";

async function main() {
    console.log("🚀 Starting Instantly.ai Email Backfill...");

    // Validate config
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
        console.error("❌ Missing Supabase configuration");
        return;
    }
    if (!INSTANTLY_API_KEY) {
        console.error("❌ Missing Instantly.ai configuration (INSTANTLY_AI_API_KEY)");
        return;
    }

    // Initialize services
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const instantlyService = new InstantlyService(INSTANTLY_API_KEY);

    console.log(`📡 Connected to Supabase: ${SUPABASE_URL}`);
    console.log(`📧 Target Instantly Campaign ID: ${INSTANTLY_CAMPAIGN_ID}`);

    try {
        // 1. Fetch completed workflow results with emails
        console.log("🔍 Fetching completed workflow results...");

        // We want all results where status is completed AND email_subject and email_body are not null
        const { data: results, error } = await supabase
            .from('workflow_results')
            .select('*')
            .eq('status', 'completed')
            .not('email_subject', 'is', null)
            .order('created_at', { ascending: false });

        if (error) {
            throw new Error(`Supabase query error: ${error.message}`);
        }

        if (!results || results.length === 0) {
            console.log("⚠️ No completed workflow results found to process.");
            return;
        }

        console.log(`✅ Found ${results.length} results to process.`);

        // 2. Process each result
        let successCount = 0;
        let errorCount = 0;
        let skipCount = 0;

        for (const result of results) {
            const email = result.lead_email || result.leadInfo?.email || extractEmailFromData(result);

            if (!email) {
                console.warn(`⚠️ Skipping result ID ${result.id}: No email address found in record.`);
                skipCount++;
                continue;
            }

            // Check if email content exists
            if (!result.email_subject || !result.email_body) {
                console.warn(`⚠️ Skipping result ID ${result.id} (${email}): Incomplete email content.`);
                skipCount++;
                continue;
            }

            console.log(`\n🔄 Processing: ${email}`);

            try {
                // Clean up email body just like in the server handler
                const cleanEmailBody = result.email_body
                    .replace(/style="[^"]*line-height:\s*[^;"]*[^"]*"/g, "")
                    .replace(/style="[^"]*margin[^"]*"/g, "")
                    .replace(/style="[^"]*"/g, "")
                    .replace(/\n{3,}/g, "\n\n")
                    .trim();

                const leadData = {
                    // We only need to send the custom variables we want to update
                    // Instantly identifies the lead by email
                    custom_variables: {
                        // Lowercase standard
                        email_subject: result.email_subject,
                        email_body_html: result.email_body,
                        email_body: cleanEmailBody,

                        // Uppercase to match UI screenshot columns explicitly
                        EMAIL_SUBJECT: result.email_subject,
                        EMAIL_BODY_HTML: result.email_body,
                        EMAIL_BODY: cleanEmailBody
                    }
                };

                // Update lead in Instantly
                await instantlyService.addLeadToCampaign(
                    email.trim().toLowerCase(),
                    INSTANTLY_CAMPAIGN_ID,
                    leadData,
                    true // updateIfExists = true
                );

                console.log(`✅ Successfully updated ${email}`);
                successCount++;

                // Add a small delay to respect API rate limits
                await new Promise(resolve => setTimeout(resolve, 200));

            } catch (err: any) {
                console.error(`❌ Failed to update ${email}:`, err.message);
                errorCount++;
            }
        }

        console.log("\n===========================================");
        console.log("🎉 Backfill Complete!");
        console.log(`✅ Success: ${successCount}`);
        console.log(`❌ Failed: ${errorCount}`);
        console.log(`⚠️ Skipped: ${skipCount}`);
        console.log("===========================================");

    } catch (error: any) {
        console.error("❌ Fatal Script Error:", error);
    }
}

// Helper to try and find email in various places
function extractEmailFromData(result: any): string | null {
    if (result.lead_email) return result.lead_email;
    // Try to parse leadInfo if it's stored as JSON string but defined as object in type
    // Postgres returns JSONB as object automatically.
    if (result.leadInfo?.email) return result.leadInfo.email;
    if (result.contactInfo?.emails && result.contactInfo.emails.length > 0) return result.contactInfo.emails[0];
    return null;
}

// Execute
main();
