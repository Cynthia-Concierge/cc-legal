#!/usr/bin/env node

/**
 * Verify template ID to filename mapping is consistent
 */

// Frontend mapping (from LegalInventoryChecklist.tsx)
const frontendMapping = {
  'template-6': 'social_media_disclaimer',
  'template-4': 'media_release_form',
  'template-intake': 'client_intake_form',
  'template-1': 'waiver_release_of_liability',
  'template-2': 'service_agreement_membership_contract',
  'template-5': 'testimonial_consent_agreement',
  'template-7': 'independent_contractor_agreement',
  'template-8': 'employment_agreement',
  'template-membership': 'membership_agreement',
  'template-studio': 'studio_policies',
  'template-class': 'class_terms_conditions',
  'template-privacy': 'privacy_policy',
  'template-website': 'website_terms_conditions',
  'template-refund': 'refund_cancellation_policy',
  'template-disclaimer': 'website_disclaimer',
  'template-cookie': 'cookie_policy',
  'template-retreat-waiver': 'retreat_liability_waiver',
  'template-travel': 'travel_excursion_agreement',
};

// DocumentVault.tsx also has same mapping
const vaultMapping = {
  'template-6': 'social_media_disclaimer',
  'template-4': 'media_release_form',
  'template-intake': 'client_intake_form',
  'template-1': 'waiver_release_of_liability',
  'template-2': 'service_agreement_membership_contract',
  'template-3': 'terms_privacy_disclaimer',
  'template-5': 'testimonial_consent_agreement',
  'template-7': 'independent_contractor_agreement',
  'template-8': 'employment_agreement',
  'template-9': 'influencer_collaboration_agreement',
  'template-10': 'trademark_ip_protection_guide',
  'template-membership': 'membership_agreement',
  'template-studio': 'studio_policies',
  'template-class': 'class_terms_conditions',
  'template-privacy': 'privacy_policy',
  'template-website': 'website_terms_conditions',
  'template-refund': 'refund_cancellation_policy',
  'template-disclaimer': 'website_disclaimer',
  'template-cookie': 'cookie_policy',
  'template-retreat-waiver': 'retreat_liability_waiver',
  'template-travel': 'travel_excursion_agreement',
};

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Verifying template ID to filename mapping...\n');

// Check all frontend mappings have corresponding HTML files
let allGood = true;

console.log('Checking frontend mapping (LegalInventoryChecklist)...');
for (const [templateId, fileName] of Object.entries(frontendMapping)) {
  const filePath = path.join(__dirname, 'server', 'templates', 'html', `${fileName}.html`);
  const exists = fs.existsSync(filePath);

  if (exists) {
    console.log(`✅ ${templateId} → ${fileName}.html`);
  } else {
    console.log(`❌ ${templateId} → ${fileName}.html (MISSING)`);
    allGood = false;
  }
}

console.log('\nChecking vault mapping (DocumentVault)...');
for (const [templateId, fileName] of Object.entries(vaultMapping)) {
  const filePath = path.join(__dirname, 'server', 'templates', 'html', `${fileName}.html`);
  const exists = fs.existsSync(filePath);

  if (exists) {
    console.log(`✅ ${templateId} → ${fileName}.html`);
  } else {
    console.log(`⚠️  ${templateId} → ${fileName}.html (MISSING - may be deprecated)`);
  }
}

// Check for discrepancies between the two mappings
console.log('\nChecking for discrepancies...');
const frontendKeys = new Set(Object.keys(frontendMapping));
const vaultKeys = new Set(Object.keys(vaultMapping));

const onlyInVault = [...vaultKeys].filter(k => !frontendKeys.has(k));
if (onlyInVault.length > 0) {
  console.log('⚠️  Templates only in vault mapping:', onlyInVault.join(', '));
  console.log('   (These are likely deprecated templates)');
}

const onlyInFrontend = [...frontendKeys].filter(k => !vaultKeys.has(k));
if (onlyInFrontend.length > 0) {
  console.log('❌ Templates only in frontend mapping:', onlyInFrontend.join(', '));
  allGood = false;
}

// Summary
console.log('\n' + '='.repeat(50));
if (allGood) {
  console.log('✅ All mappings are consistent!');
} else {
  console.log('❌ Some issues found. Please fix the mappings.');
}
console.log('='.repeat(50));
