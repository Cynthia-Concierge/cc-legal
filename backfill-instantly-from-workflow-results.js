// backfill-instantly-from-workflow-results.js
//
// One-time script to backfill completed workflow_results into a NEW Instantly.ai campaign.
// Uses the same InstantlyService logic as the rest of the app.
//
// Usage:
//   1. Ensure you have Node installed and dependencies installed (npm install).
//   2. Ensure these env vars are set in your shell or .env loaded by node:
//        SUPABASE_URL
//        SUPABASE_SERVICE_ROLE_KEY   (service role key, NOT the anon key)
//        INSTANTLY_AI_API_KEY
//   3. Run:
//        node backfill-instantly-from-workflow-results.js
//
// The script will:
//   - Query workflow_results for rows with:
//       status = 'completed'
//       email_subject IS NOT NULL
//       email_body IS NOT NULL
//       lead_email IS NOT NULL
//   - For each row, add the lead to the NEW Instantly campaign with
//     email_subject + email_body_html + cleaned email_body as custom variables.
//

require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const { InstantlyService } = require("./server/services/instantlyService.js");

// 🔐 Required env vars
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const instantlyApiKey = process.env.INSTANTLY_AI_API_KEY;

// 🎯 NEW backfill campaign ID (hardcoded as requested)
const BACKFILL_CAMPAIGN_ID = "bae9536f-1583-4732-8dca-9bb0611c2140";

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.");
  process.exit(1);
}

if (!instantlyApiKey) {
  console.error("❌ Missing INSTANTLY_AI_API_KEY in environment.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const instantlyService = new InstantlyService(instantlyApiKey);

async function backfill() {
  console.log("🔍 Loading workflow_results with completed status + generated email...\n");

  // NOTE: Adjust limit or implement pagination if you have more than 1000 results.
  const { data: results, error } = await supabase
    .from("workflow_results")
    .select("*")
    .eq("status", "completed")
    .not("email_subject", "is", null)
    .not("email_body", "is", null)
    .not("lead_email", "is", null)
    .order("created_at", { ascending: true })
    .limit(1000);

  if (error) {
    console.error("❌ Error querying workflow_results:", error);
    process.exit(1);
  }

  if (!results || results.length === 0) {
    console.log(
      "❌ No matching workflow_results found (status=completed with email_subject, email_body, and lead_email)."
    );
    return;
  }

  console.log(`✅ Found ${results.length} leads to send to Instantly (campaign ${BACKFILL_CAMPAIGN_ID}).\n`);

  let successCount = 0;
  let failCount = 0;

  for (const workflowResult of results) {
    const rawEmail = (workflowResult.lead_email || "").trim().toLowerCase();
    if (!rawEmail) {
      console.warn("⚠️ Skipping row with empty lead_email:", workflowResult.id);
      continue;
    }

    try {
      // Clean up the email body HTML similar to test-send-lead-to-instantly.js
      const cleanEmailBody = workflowResult.email_body
        .replace(/style="[^"]*line-height:\s*[^;"]*[^"]*"/g, "")
        .replace(/style="[^"]*margin[^"]*"/g, "")
        .replace(/style="[^"]*"/g, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

      // Split name into first and last
      const nameParts = (workflowResult.lead_name || "").trim().split(/\s+/);
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      const leadData = {
        first_name: firstName,
        last_name: lastName,
        website: workflowResult.website_url,
        custom_variables: {
          email_subject: workflowResult.email_subject,
          email_body_html: workflowResult.email_body, // full HTML
          email_body: cleanEmailBody, // cleaned text
        },
      };

      console.log(`📤 Sending to Instantly backfill campaign: ${rawEmail}`);

      // updateIfExists = false because this is a dedicated backfill campaign
      await instantlyService.addLeadToCampaign(
        rawEmail,
        BACKFILL_CAMPAIGN_ID,
        leadData,
        false
      );

      successCount++;
    } catch (err) {
      failCount++;
      console.error(
        `❌ Failed to send lead ${workflowResult.lead_email} (id=${workflowResult.id}):`,
        err?.message || err
      );
    }
  }

  console.log("\n🎯 Backfill complete.");
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
}

backfill().catch((err) => {
  console.error("Unexpected error in backfill script:", err);
  process.exit(1);
});




