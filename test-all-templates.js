#!/usr/bin/env node

/**
 * Test all 18 document templates for generation
 */

const templates = [
  'social_media_disclaimer',
  'media_release_form',
  'client_intake_form',
  'waiver_release_of_liability',
  'service_agreement_membership_contract',
  'testimonial_consent_agreement',
  'independent_contractor_agreement',
  'employment_agreement',
  'membership_agreement',
  'studio_policies',
  'class_terms_conditions',
  'privacy_policy',
  'website_terms_conditions',
  'refund_cancellation_policy',
  'website_disclaimer',
  'cookie_policy',
  'retreat_liability_waiver',
  'travel_excursion_agreement',
];

async function testTemplate(templateName) {
  try {
    const response = await fetch('http://localhost:3001/api/documents/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        templateName,
      }),
    });

    if (!response.ok) {
      console.log(`❌ ${templateName}: HTTP ${response.status}`);
      const text = await response.text();
      console.log(`   Error: ${text.substring(0, 200)}`);
      return false;
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/pdf')) {
      console.log(`❌ ${templateName}: Wrong content type (${contentType})`);
      return false;
    }

    const buffer = await response.arrayBuffer();
    const size = buffer.byteLength;

    if (size < 1000) {
      console.log(`❌ ${templateName}: PDF too small (${size} bytes)`);
      return false;
    }

    console.log(`✅ ${templateName}: ${(size / 1024).toFixed(1)}KB`);
    return true;
  } catch (error) {
    console.log(`❌ ${templateName}: ${error.message}`);
    return false;
  }
}

async function testAll() {
  console.log('Testing all 18 document templates...\n');

  let passed = 0;
  let failed = 0;

  for (const template of templates) {
    const result = await testTemplate(template);
    if (result) {
      passed++;
    } else {
      failed++;
    }
    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`${'='.repeat(50)}`);

  process.exit(failed > 0 ? 1 : 0);
}

testAll();
