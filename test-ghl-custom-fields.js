/**
 * Test Script: GoHighLevel Custom Fields Verification
 *
 * This script verifies that all custom fields from the business profile
 * are being correctly sent to GoHighLevel.
 *
 * Usage: node test-ghl-custom-fields.js
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

const GHL_API_TOKEN = 'pit-4da3a3e7-57b8-406a-abcb-4a661e37efdb';
const GHL_LOCATION_ID = '7HUNbHEuRf1cXZD4hxxr';
const SERVER_URL = process.env.VITE_SERVER_URL || 'http://localhost:3001';

// Test data representing a complete business profile
const testProfileData = {
  businessName: 'Test Wellness Studio',
  website: 'https://testwellness.com',
  instagram: '@testwellness',
  businessType: 'Yoga Studio',
  staffCount: '1-3',
  clientCount: '20-50',
  primaryConcern: 'I want to protect myself from liability',
  usesPhotos: true,
  hostsRetreats: true,
  offersOnlineCourses: false,
  hasEmployees: false,
  sellsProducts: true,
  services: ['Group classes', 'Private sessions', 'Retreats'],
  hasPhysicalMovement: true,
  collectsOnline: true,
  hiresStaff: true,
  isOffsiteOrInternational: true,
};

// Expected custom field mappings based on GOHIGHLEVEL_CUSTOM_FIELDS.md
const expectedCustomFields = {
  business_name: 'Test Wellness Studio',
  website: 'https://testwellness.com',
  instagram_handle: '@testwellness',
  business_type: 'Yoga Studio',
  team_size: '1-3',
  monthly_clients: '20-50',
  primary_concern: 'I want to protect myself from liability',
  uses_client_photos: 'Yes',
  hosts_retreats: 'Yes',
  offers_online_courses: 'No',
  has_w2_employees: 'No',
  sells_products: 'Yes',
  services_offered: 'Group classes, Private sessions, Retreats',
  physical_movement: 'Yes',
  online_payments: 'Yes',
  hires_staff: 'Yes',
  offsite_international: 'Yes',
};

async function testGoHighLevelIntegration() {
  console.log('🧪 Testing GoHighLevel Custom Fields Integration\n');
  console.log('=' .repeat(60));

  // Step 1: Create a test contact via the backend endpoint
  console.log('\n📝 Step 1: Creating test contact via /api/add-ghl-business-profile-tag');

  const testEmail = `test-${Date.now()}@example.com`;

  try {
    const response = await fetch(`${SERVER_URL}/api/add-ghl-business-profile-tag`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
        profileData: testProfileData,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error creating test contact:', errorText);

      // If contact doesn't exist, create it first
      if (response.status === 404) {
        console.log('\n🔄 Contact not found, creating new contact in GoHighLevel...');

        const createResponse = await fetch('https://services.leadconnectorhq.com/contacts/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GHL_API_TOKEN}`,
            'Version': '2021-07-28',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firstName: 'Test',
            lastName: 'User',
            email: testEmail,
            locationId: GHL_LOCATION_ID,
            tags: ['test-contact'],
            source: 'Custom Fields Test',
          }),
        });

        if (!createResponse.ok) {
          const createError = await createResponse.text();
          console.error('❌ Failed to create contact:', createError);
          return;
        }

        console.log('✅ Contact created, retrying tag endpoint...\n');

        // Retry the tag endpoint
        const retryResponse = await fetch(`${SERVER_URL}/api/add-ghl-business-profile-tag`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: testEmail,
            profileData: testProfileData,
          }),
        });

        if (!retryResponse.ok) {
          const retryError = await retryResponse.text();
          console.error('❌ Retry failed:', retryError);
          return;
        }

        response = retryResponse; // Update response reference
      } else {
        return;
      }
    }

    const result = await response.json();
    console.log('✅ Contact created/updated successfully');
    console.log(`📧 Email: ${testEmail}`);
    console.log(`🆔 Contact ID: ${result.contactId}`);
    console.log(`📊 Custom fields synced: ${result.customFieldsUpdated}\n`);

    // Step 2: Retrieve the contact from GoHighLevel to verify custom fields
    console.log('🔍 Step 2: Retrieving contact from GoHighLevel to verify custom fields\n');

    const lookupResponse = await fetch(
      `https://services.leadconnectorhq.com/contacts/lookup?email=${encodeURIComponent(testEmail)}&locationId=${GHL_LOCATION_ID}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${GHL_API_TOKEN}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json',
        },
      }
    );

    if (!lookupResponse.ok) {
      console.error('❌ Failed to retrieve contact from GoHighLevel');
      return;
    }

    const lookupData = await lookupResponse.json();
    const contact = lookupData.contacts?.[0] || lookupData.contact;

    if (!contact) {
      console.error('❌ Contact not found in lookup response');
      return;
    }

    console.log('✅ Contact retrieved successfully\n');

    // Step 3: Verify all custom fields
    console.log('📋 Step 3: Verifying Custom Fields\n');
    console.log('=' .repeat(60));

    const customFields = contact.customField || {};
    let missingFields = [];
    let incorrectFields = [];
    let correctFields = [];

    for (const [fieldName, expectedValue] of Object.entries(expectedCustomFields)) {
      const actualValue = customFields[fieldName];

      if (actualValue === undefined || actualValue === null) {
        missingFields.push(fieldName);
        console.log(`❌ ${fieldName}: MISSING`);
      } else if (actualValue !== expectedValue) {
        incorrectFields.push({ fieldName, expected: expectedValue, actual: actualValue });
        console.log(`⚠️  ${fieldName}: Expected "${expectedValue}", got "${actualValue}"`);
      } else {
        correctFields.push(fieldName);
        console.log(`✅ ${fieldName}: "${actualValue}"`);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Summary');
    console.log('=' .repeat(60));
    console.log(`✅ Correct fields: ${correctFields.length}/${Object.keys(expectedCustomFields).length}`);
    console.log(`❌ Missing fields: ${missingFields.length}`);
    console.log(`⚠️  Incorrect fields: ${incorrectFields.length}`);

    if (missingFields.length > 0) {
      console.log('\n❌ Missing Fields:');
      missingFields.forEach(field => console.log(`   - ${field}`));
      console.log('\n💡 Action Required:');
      console.log('   1. Ensure these custom fields are created in GoHighLevel');
      console.log('   2. Check GOHIGHLEVEL_CUSTOM_FIELDS.md for field names');
      console.log('   3. Verify field names match exactly (case-sensitive)');
    }

    if (incorrectFields.length > 0) {
      console.log('\n⚠️  Incorrect Values:');
      incorrectFields.forEach(({ fieldName, expected, actual }) => {
        console.log(`   - ${fieldName}: Expected "${expected}", got "${actual}"`);
      });
    }

    if (missingFields.length === 0 && incorrectFields.length === 0) {
      console.log('\n🎉 SUCCESS! All custom fields are correctly configured and syncing! 🎉');
    }

    // Step 4: Cleanup (optional - comment out if you want to keep the test contact)
    console.log('\n🧹 Step 4: Cleanup');
    console.log('Test contact created: ' + testEmail);
    console.log('To delete manually, go to GoHighLevel and search for: ' + testEmail);

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error(error);
  }
}

// Run the test
testGoHighLevelIntegration().catch(console.error);
