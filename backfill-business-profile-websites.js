/**
 * Backfill Script: Sync Website URLs from Contacts to Business Profiles
 * 
 * This script finds all business_profiles with missing website_url and syncs
 * them from the associated contact record in the contacts table.
 * 
 * Usage: node backfill-business-profile-websites.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - VITE_SUPABASE_URL or SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function backfillWebsiteUrls() {
  console.log('🔄 Starting website URL backfill from contacts to business_profiles...\n');

  try {
    // Step 1: Find all business_profiles with missing website_url
    console.log('📋 Step 1: Finding business_profiles with missing website_url...');
    // Get all profiles, then filter for null/empty in JavaScript (more reliable)
    const { data: allProfiles, error: fetchError } = await supabase
      .from('business_profiles')
      .select('user_id, website_url, business_name');
    
    if (fetchError) {
      console.error('❌ Error fetching business_profiles:', fetchError);
      return;
    }
    
    // Filter for profiles with missing website_url (null or empty string)
    const profilesWithoutWebsite = (allProfiles || []).filter(
      profile => !profile.website_url || profile.website_url.trim() === ''
    );

    if (fetchError) {
      console.error('❌ Error fetching business_profiles:', fetchError);
      return;
    }

    if (!profilesWithoutWebsite || profilesWithoutWebsite.length === 0) {
      console.log('✅ No business_profiles found with missing website_url. All good!');
      return;
    }

    console.log(`   Found ${profilesWithoutWebsite.length} business_profiles without website_url\n`);

    // Step 2: For each profile, find the associated contact and sync website
    console.log('🔄 Step 2: Syncing website URLs from contacts table...\n');
    
    let successCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const profile of profilesWithoutWebsite) {
      try {
        // Find contact by user_id
        const { data: contactData, error: contactError } = await supabase
          .from('contacts')
          .select('website, email, name')
          .eq('user_id', profile.user_id)
          .single();

        if (contactError) {
          // Try finding by email as fallback (in case user_id not linked yet)
          if (profile.user_id) {
            // Get user email from auth.users via admin API
            try {
              const { data: userData, error: userError } = await supabase.auth.admin.getUserById(profile.user_id);
              
              if (!userError && userData?.user?.email) {
                const { data: contactByEmail } = await supabase
                  .from('contacts')
                  .select('website, email, name')
                  .eq('email', userData.user.email.trim().toLowerCase())
                  .single();

                if (contactByEmail?.website && contactByEmail.website.trim()) {
                  // Update business_profile with website from contact
                  const { error: updateError } = await supabase
                    .from('business_profiles')
                    .update({ 
                      website_url: contactByEmail.website.trim(),
                      updated_at: new Date().toISOString()
                    })
                    .eq('user_id', profile.user_id);

                  if (updateError) {
                    console.error(`   ❌ Error updating profile for user ${profile.user_id}:`, updateError.message);
                    errorCount++;
                  } else {
                    console.log(`   ✅ Synced website for ${contactByEmail.name || contactByEmail.email}: ${contactByEmail.website}`);
                    successCount++;
                  }
                  continue;
                }
              }
            } catch (adminError) {
              // Admin API might not be available, continue with normal flow
              console.log(`   ⚠️  Could not use admin API for user ${profile.user_id}, trying email lookup...`);
            }
          }
          
          console.log(`   ⏭️  No contact found for user ${profile.user_id} (${profile.business_name || 'no name'})`);
          skippedCount++;
          continue;
        }

        if (!contactData || !contactData.website || !contactData.website.trim()) {
          console.log(`   ⏭️  No website in contact for user ${profile.user_id} (${contactData?.name || contactData?.email || 'unknown'})`);
          skippedCount++;
          continue;
        }

        // Update business_profile with website from contact
        const { error: updateError } = await supabase
          .from('business_profiles')
          .update({ 
            website_url: contactData.website.trim(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', profile.user_id);

        if (updateError) {
          console.error(`   ❌ Error updating profile for user ${profile.user_id}:`, updateError.message);
          errorCount++;
        } else {
          console.log(`   ✅ Synced website for ${contactData.name || contactData.email}: ${contactData.website}`);
          successCount++;
        }

      } catch (err) {
        console.error(`   ❌ Error processing profile for user ${profile.user_id}:`, err.message);
        errorCount++;
      }
    }

    // Step 3: Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 BACKFILL SUMMARY');
    console.log('='.repeat(60));
    console.log(`   ✅ Successfully synced: ${successCount}`);
    console.log(`   ⏭️  Skipped (no website in contact): ${skippedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📋 Total processed: ${profilesWithoutWebsite.length}`);
    console.log('='.repeat(60) + '\n');

    if (successCount > 0) {
      console.log('✅ Backfill completed successfully!');
    }

  } catch (error) {
    console.error('❌ Fatal error during backfill:', error);
    process.exit(1);
  }
}

// Run the backfill
backfillWebsiteUrls()
  .then(() => {
    console.log('✨ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

