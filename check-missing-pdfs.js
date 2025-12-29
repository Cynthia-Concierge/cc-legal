import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Templates needed from DOCUMENT_TEMPLATE_MAP
const neededTemplates = [
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
  'travel_excursion_agreement'
];

const pdfsDir = path.join(__dirname, 'public/pdfs');
const existingPdfs = fs.readdirSync(pdfsDir)
  .filter(f => f.endsWith('.pdf'))
  .map(f => f.replace('.pdf', ''));

console.log('📋 PDF Template Status:\n');
console.log('='.repeat(60));

const missing = [];
const existing = [];

neededTemplates.forEach(template => {
  if (existingPdfs.includes(template)) {
    existing.push(template);
    console.log(`✅ ${template}`);
  } else {
    missing.push(template);
    console.log(`❌ ${template} - MISSING`);
  }
});

console.log('='.repeat(60));
console.log(`\n📊 Summary:`);
console.log(`   ✅ Existing: ${existing.length}/${neededTemplates.length}`);
console.log(`   ❌ Missing: ${missing.length}/${neededTemplates.length}`);

if (missing.length > 0) {
  console.log(`\n🔍 Missing PDFs:`);
  missing.forEach(m => console.log(`   - ${m}.pdf`));
  
  console.log(`\n💡 Recommendation:`);
  console.log(`   You have ${missing.length} missing PDFs. Since you have HTML templates for all of them,`);
  console.log(`   the Playwright fallback I just added will handle these automatically.`);
  console.log(`   However, if you want faster generation, you could pre-generate these PDFs from HTML.`);
}
