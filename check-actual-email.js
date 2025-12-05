/**
 * Check the actual email that was generated and stored
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEmail() {
  try {
    const { data: results, error } = await supabase
      .from('workflow_results')
      .select('*')
      .eq('lead_email', 'rickibodner11@gmail.com')
      .not('email_subject', 'is', null)
      .not('email_body', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    if (!results || results.length === 0) {
      console.log('❌ No email found for this lead');
      process.exit(1);
    }

    const result = results[0];
    
    console.log('📧 Generated Email Content:\n');
    console.log('='.repeat(60));
    console.log('SUBJECT:');
    console.log(result.email_subject);
    console.log('\n' + '='.repeat(60));
    console.log('BODY (HTML):');
    console.log(result.email_body);
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 Stats:');
    console.log(`   Subject length: ${result.email_subject?.length || 0} chars`);
    console.log(`   Body length: ${result.email_body?.length || 0} chars`);
    console.log(`   Created: ${result.created_at}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkEmail().catch(console.error);
