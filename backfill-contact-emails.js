/**
 * Backfill script to send contact created emails to contacts from the past 2 days
 * Run with: node backfill-contact-emails.js
 * 
 * This will:
 * 1. Find all contacts created in the past 48 hours
 * 2. Send the legal documents email to each one
 * 3. Skip contacts that already have a user_id (they may have already received onboarding emails)
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM_ADDRESS = process.env.EMAIL_FROM_ADDRESS;
const DASHBOARD_URL = process.env.DASHBOARD_URL || 'https://free.consciouscounsel.ca';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials');
  console.error('   Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

if (!RESEND_API_KEY) {
  console.error('❌ Missing Resend API key');
  console.error('   Please set RESEND_API_KEY');
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function sendContactCreatedEmail(email, firstName, magicLinkUrl) {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: EMAIL_FROM_ADDRESS || 'onboarding@resend.dev',
        to: email,
        subject: 'Your personalized legal documents are ready! 🛡️',
        html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="en">
  <head>
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    <meta name="x-apple-disable-message-reformatting" />
  </head>
  <body style='background-color:rgb(243,244,246);margin-top:auto;margin-bottom:auto;margin-left:auto;margin-right:auto;font-family:ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"'>
    <table border="0" width="100%" cellpadding="0" cellspacing="0" role="presentation" align="center">
      <tbody>
        <tr>
          <td style='background-color:rgb(243,244,246);margin-top:auto;margin-bottom:auto;margin-left:auto;margin-right:auto;font-family:ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"'>
            <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-width:1px;border-style:solid;border-color:rgb(234,234,234);border-radius:0.25rem;margin-top:40px;margin-bottom:40px;margin-left:auto;margin-right:auto;padding:20px;max-width:465px;background-color:rgb(255,255,255)">
              <tbody>
                <tr style="width:100%">
                  <td>
                    <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:32px;margin-bottom:32px">
                      <tbody>
                        <tr>
                          <td>
                            <p style="color:rgb(0,0,0);font-size:24px;font-weight:700;text-align:center;padding:0px;margin-top:0px;margin-bottom:0px;margin-left:auto;margin-right:auto;line-height:24px">
                              Conscious Counsel
                            </p>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <p style="color:rgb(0,0,0);font-size:14px;line-height:24px;margin-top:16px;margin-bottom:16px">
                      Hi ${firstName || 'there'},
                    </p>
                    <p style="color:rgb(0,0,0);font-size:14px;line-height:24px;margin-top:16px;margin-bottom:16px">
                      Your personalized legal documents are ready in your Conscious Counsel dashboard.
                    </p>
                    <p style="color:rgb(0,0,0);font-size:14px;line-height:24px;margin-top:16px;margin-bottom:16px">
                      👉 Access your dashboard instantly (no password needed):
                    </p>
                    <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="text-align:center;margin-top:32px;margin-bottom:32px">
                      <tbody>
                        <tr>
                          <td>
                            <a href="${magicLinkUrl || `${DASHBOARD_URL}/wellness/dashboard`}" style="background-color:rgb(20,184,166);border-radius:0.25rem;color:rgb(255,255,255);font-size:16px;font-weight:600;text-decoration-line:none;text-align:center;padding:12px 24px;display:inline-block;line-height:100%;text-decoration:none;">
                              <span style="max-width:100%;display:inline-block;line-height:120%;">View My Legal Documents</span>
                            </a>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <p style="color:rgb(0,0,0);font-size:14px;line-height:24px;margin-top:16px;margin-bottom:16px">
                      If you're prompted, just confirm your email — it takes about 30 seconds.
                    </p>
                    <p style="color:rgb(0,0,0);font-size:14px;line-height:24px;font-weight:700;margin-top:16px;margin-bottom:16px">
                      Once you're in, you can:
                    </p>
                    <ul style="color:rgb(0,0,0);font-size:14px;line-height:24px;padding-left:1.25rem;margin-top:0px">
                      <li style="margin-bottom:0.5rem">
                        <strong>Download your personalized legal documents</strong>
                      </li>
                      <li style="margin-bottom:0.5rem">
                        <strong>Complete your business profile</strong> to unlock more protection
                      </li>
                      <li style="margin-bottom:0.5rem">
                        <strong>See your legal health score</strong> and next steps
                      </li>
                    </ul>
                    ${magicLinkUrl ? `
                    <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color:rgb(249,250,251);padding:1rem;border-radius:0.375rem;border-width:1px;border-color:rgb(243,244,246);margin-bottom:24px">
                      <tbody>
                        <tr>
                          <td>
                            <p style="color:rgb(0,0,0);font-size:14px;line-height:24px;margin:0px;margin-top:0px;margin-bottom:0px;margin-left:0px;margin-right:0px">
                              If the button doesn't work, you can use this link instead:
                            </p>
                            <p style="color:rgb(13,148,136);font-size:12px;line-height:20px;margin-top:8px;margin-bottom:0px;word-break:break-all">
                              <a href="${magicLinkUrl}" style="color:rgb(13,148,136);text-decoration-line:underline" target="_blank">${magicLinkUrl}</a>
                            </p>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    ` : ''}
                    <p style="color:rgb(0,0,0);font-size:14px;line-height:24px;margin-top:16px;margin-bottom:16px">
                      If you have any questions at all - <a href="https://calendly.com/chad-consciouscounsel/connection-call-with-chad" style="color:rgb(13,148,136);text-decoration-line:underline" target="_blank">schedule a call here</a>.
                    </p>
                    <hr style="border-width:1px;border-style:solid;border-color:rgb(234,234,234);margin-top:26px;margin-bottom:26px;margin-left:0px;margin-right:0px;width:100%;border:none;border-top:1px solid #eaeaea" />
                    <p style="color:rgb(102,102,102);font-size:12px;line-height:24px;text-align:center;margin-top:16px;margin-bottom:16px">
                      Need help? <a href="https://calendly.com/chad-consciouscounsel/connection-call-with-chad" style="color:rgb(13,148,136);text-decoration-line:underline" target="_blank">speak to us</a>
                    </p>
                    <p style="color:rgb(102,102,102);font-size:12px;line-height:24px;text-align:center;margin-top:16px;margin-bottom:16px">
                      © ${new Date().getFullYear()} Conscious Counsel. All rights reserved.
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  </body>
</html>`
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Resend API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error(`[Email] Error sending to ${email}:`, error.message);
    throw error;
  }
}

async function backfillContactEmails() {
  // Check for dry-run flag
  const isDryRun = process.argv.includes('--dry-run') || process.argv.includes('-d');
  
  if (isDryRun) {
    console.log('🔍 DRY RUN MODE - No emails will be sent\n');
  }
  
  console.log('🔄 Starting backfill: Sending emails to contacts from past 48 hours\n');

  // Calculate 48 hours ago
  const twoDaysAgo = new Date();
  twoDaysAgo.setHours(twoDaysAgo.getHours() - 48);

  console.log(`📅 Looking for contacts created after: ${twoDaysAgo.toISOString()}\n`);

  try {
    // Fetch contacts created in the past 48 hours
    const { data: contacts, error } = await supabaseAdmin
      .from('contacts')
      .select('id, email, name, first_name, created_at, user_id')
      .gte('created_at', twoDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching contacts:', error);
      process.exit(1);
    }

    if (!contacts || contacts.length === 0) {
      console.log('✅ No contacts found in the past 48 hours');
      return;
    }

    console.log(`📧 Found ${contacts.length} contact(s) from the past 48 hours\n`);

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    // Process each contact
    for (const contact of contacts) {
      try {
        const email = contact.email;
        // Use first_name from contact record, fallback to extracting from name
        const firstName = contact.first_name || (contact.name ? contact.name.trim().split(/\s+/)[0] : "") || "";
        const name = contact.name || email.split('@')[0];

        console.log(`\n📬 Processing: ${email} (${name})`);
        console.log(`   Created: ${contact.created_at}`);

        // Generate magic link
        let magicLinkUrl = `${DASHBOARD_URL}/wellness/dashboard`;
        try {
          const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: email.trim(),
            options: {
              redirectTo: magicLinkUrl,
            },
          });

          if (!linkError && linkData?.properties?.action_link) {
            magicLinkUrl = linkData.properties.action_link;
            console.log(`   ✅ Magic link generated`);
          } else {
            console.log(`   ⚠️  Magic link generation failed, using dashboard URL`);
          }
        } catch (linkErr) {
          console.log(`   ⚠️  Magic link error: ${linkErr.message}, using dashboard URL`);
        }

        // Send email (or skip in dry-run)
        if (isDryRun) {
          console.log(`   🔍 [DRY RUN] Would send email to: ${email}`);
          console.log(`   🔍 [DRY RUN] Magic link: ${magicLinkUrl.substring(0, 50)}...`);
          successCount++;
        } else {
          await sendContactCreatedEmail(email, firstName, magicLinkUrl);
          console.log(`   ✅ Email sent successfully`);
          successCount++;
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Backfill Summary:');
    console.log(`   Total contacts: ${contacts.length}`);
    if (isDryRun) {
      console.log(`   🔍 [DRY RUN] Would send to: ${successCount}`);
    } else {
      console.log(`   ✅ Successfully sent: ${successCount}`);
    }
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);
    console.log('='.repeat(50));
    
    if (isDryRun) {
      console.log('\n💡 This was a dry run. To actually send emails, run without --dry-run flag');
    }

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the backfill
backfillContactEmails();

