import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { parsePhoneNumber } from 'libphonenumber-js';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkData() {
  console.log('=== Checking Contacts Table ===');
  const { data: contacts, error: contactsError } = await supabase
    .from('contacts')
    .select('id, email, name, phone, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (contactsError) {
    console.error('Error fetching contacts:', contactsError);
  } else {
    console.log(`Found ${contacts.length} recent contacts:`);
    contacts.forEach((c, i) => {
      console.log(`${i + 1}. ${c.name} (${c.email}) - Phone: ${c.phone || 'none'} - Created: ${c.created_at}`);
    });
  }

  console.log('\n=== Checking Business Profiles Table ===');
  const { data: profiles, error: profilesError } = await supabase
    .from('business_profiles')
    .select('id, user_id, owner_name, phone, business_address, updated_at')
    .order('updated_at', { ascending: false })
    .limit(5);

  if (profilesError) {
    console.error('Error fetching business profiles:', profilesError);
  } else {
    console.log(`Found ${profiles.length} recent business profiles:`);
    profiles.forEach((p, i) => {
      console.log(`${i + 1}. ${p.owner_name || 'no name'} - Phone: ${p.phone || 'none'} - Address: ${p.business_address || 'none'} - Updated: ${p.updated_at}`);
    });
  }

  console.log('\n=== Testing Phone Normalization ===');
  const testPhone = '+1 216-644-7650';
  console.log(`Input phone: ${testPhone}`);

  try {
    const parsed = parsePhoneNumber(testPhone, 'US');
    console.log(`Normalized to: ${parsed.number}`);
    console.log(`Is valid: ${parsed.isValid()}`);
  } catch (err) {
    console.error('Error parsing phone:', err.message);
  }
}

checkData().then(() => {
  console.log('\n✅ Check complete');
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
