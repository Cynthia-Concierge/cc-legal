import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function searchSimilarEmails(searchTerm) {
  console.log(`🔍 SEARCHING FOR EMAILS SIMILAR TO: ${searchTerm}\n`);

  try {
    // Get all auth users
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('❌ Error fetching auth users:', authError);
      return;
    }

    // Search for similar emails
    const similar = authData.users.filter(u =>
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes('ricki') ||
      u.email?.toLowerCase().includes('bodner')
    );

    if (similar.length === 0) {
      console.log('❌ No similar emails found in auth.users\n');

      // Check contacts table
      console.log('Checking contacts table...\n');
      const { data: contacts } = await supabase
        .from('contacts')
        .select('*')
        .or(`email.ilike.%${searchTerm}%,email.ilike.%ricki%,email.ilike.%bodner%`);

      if (contacts && contacts.length > 0) {
        console.log(`📧 Found ${contacts.length} similar email(s) in CONTACTS table:\n`);
        contacts.forEach((c, i) => {
          console.log(`${i + 1}. ${c.email}`);
          console.log(`   Name: ${c.name}`);
          console.log(`   User ID: ${c.user_id || 'Not linked to auth user'}`);
          console.log(`   Created: ${new Date(c.created_at).toLocaleString()}\n`);
        });
      } else {
        console.log('❌ No similar emails found in contacts table either\n');
      }

      return;
    }

    console.log(`✅ Found ${similar.length} similar email(s) in AUTH.USERS:\n`);
    console.log('═'.repeat(80));

    similar.forEach((u, i) => {
      const isTempPassword = u.user_metadata?.temp_password === true;
      console.log(`\n${i + 1}. ${u.email}`);
      console.log(`   ID: ${u.id.substring(0, 8)}...`);
      console.log(`   Created: ${new Date(u.created_at).toLocaleString()}`);
      console.log(`   Last Sign In: ${u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString() : 'Never'}`);
      console.log(`   Email Confirmed: ${u.email_confirmed_at ? '✅ Yes' : '❌ No'}`);
      console.log(`   Password: ${isTempPassword ? '❌ Temp' : '✅ Real'}`);
      console.log(`   Can Log In: ${u.email_confirmed_at && !isTempPassword ? '✅ YES' : '❌ NO'}`);
    });

    console.log('\n' + '═'.repeat(80) + '\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

const searchTerm = process.argv[2] || 'ricki';
searchSimilarEmails(searchTerm);
