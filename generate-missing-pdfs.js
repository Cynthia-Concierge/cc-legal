/**
 * Generate Missing PDFs from HTML Templates
 * 
 * This script converts all HTML templates to PDFs for faster document generation.
 * Uses Playwright to convert HTML to PDF.
 */

import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const missingPdfs = [
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

const htmlTemplatesDir = path.join(__dirname, 'server/templates/html');
const pdfsDir = path.join(__dirname, 'public/pdfs');

async function generatePdfFromHtml(templateName) {
  const htmlPath = path.join(htmlTemplatesDir, `${templateName}.html`);
  const pdfPath = path.join(pdfsDir, `${templateName}.pdf`);

  try {
    // Check if HTML template exists
    await fs.access(htmlPath);
    console.log(`\n📄 Processing: ${templateName}...`);

    // Read HTML template
    const htmlContent = await fs.readFile(htmlPath, 'utf-8');

    // Launch browser
    console.log(`   Launching browser...`);
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle' });
      
      console.log(`   Converting to PDF...`);
      const pdfBuffer = await page.pdf({
        format: 'Letter',
        printBackground: true,
        margin: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' }
      });

      // Save PDF
      await fs.writeFile(pdfPath, pdfBuffer);
      console.log(`   ✅ Saved: ${pdfPath}`);
      return true;
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error(`   ❌ Error generating ${templateName}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🔄 Generating Missing PDFs from HTML Templates\n');
  console.log(`📋 Found ${missingPdfs.length} missing PDFs to generate\n`);
  console.log('='.repeat(60));

  let successCount = 0;
  let failCount = 0;

  for (const template of missingPdfs) {
    const success = await generatePdfFromHtml(template);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`   ✅ Successfully generated: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📋 Total: ${missingPdfs.length}`);
  console.log('='.repeat(60));

  if (successCount === missingPdfs.length) {
    console.log('\n🎉 All PDFs generated successfully!');
    console.log('   Document generation will now be faster using PDF templates.');
  } else if (successCount > 0) {
    console.log('\n⚠️  Some PDFs failed to generate.');
    console.log('   The Playwright fallback will handle missing PDFs automatically.');
  }
}

main().catch(console.error);

