/**
 * Script to import cold leads from CSV file
 * Usage: tsx scripts/import-cold-leads.js path/to/leads.csv
 * Or: node scripts/import-cold-leads.js path/to/leads.csv (if compiled)
 */

import dotenv from 'dotenv';
import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

function normalizeLinkedInUrl(linkedin) {
  if (!linkedin || linkedin === 'Skipped' || linkedin.trim() === '') {
    return null;
  }
  
  // If it's already a full URL, return it
  if (linkedin.startsWith('http://') || linkedin.startsWith('https://')) {
    return linkedin;
  }
  
  // If it starts with linkedin.com, add https://
  if (linkedin.startsWith('linkedin.com')) {
    return `https://${linkedin}`;
  }
  
  // If it's just a path, construct full URL
  if (linkedin.startsWith('/in/') || linkedin.startsWith('in/')) {
    return `https://www.linkedin.com${linkedin.startsWith('/') ? '' : '/'}${linkedin}`;
  }
  
  return linkedin;
}

function normalizeWebsite(website) {
  if (!website || website === 'No data found' || website === 'Skipped' || website.trim() === '') {
    return null;
  }
  
  // If it's already a full URL, return it
  if (website.startsWith('http://') || website.startsWith('https://')) {
    return website;
  }
  
  // Add https:// if missing
  return `https://${website}`;
}

function normalizeLocation(location) {
  if (!location || location === 'Skipped' || location.trim() === '') {
    return null;
  }
  return location.trim();
}

function normalizeCompany(company) {
  if (!company || company === 'Skipped' || company.trim() === '') {
    return null;
  }
  return company.trim();
}

function extractEmails(email) {
  const emails = [];
  
  // Primary email from Email column
  if (email && email.trim() !== '' && email !== 'Skipped' && email !== 'Processing in queue') {
    const trimmed = email.trim();
    // Basic email validation
    if (trimmed.includes('@') && trimmed.includes('.')) {
      emails.push(trimmed);
    }
  }
  
  return emails.slice(0, 2); // Return max 2 emails
}

async function importLeadsFromCSV(csvPath) {
  console.log('📊 Importing cold leads from CSV...\n');

  // Check if file exists
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ File not found: ${csvPath}`);
    process.exit(1);
  }

  // Read and parse CSV
  console.log('📖 Reading CSV file...');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`✅ Found ${records.length} records in CSV\n`);

  // Check environment variables
  const supabaseUrl = process.env.SUPABASE_URL;
  // Try service role key first (for bulk imports), fall back to anon key
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables!');
    console.log('\nPlease make sure your .env file contains:');
    console.log('SUPABASE_URL=your-supabase-url');
    console.log('SUPABASE_ANON_KEY=your-supabase-anon-key');
    console.log('\nOr for bulk imports (recommended):');
    console.log('SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
    console.log('\nNote: Service role key bypasses RLS and is better for bulk imports.\n');
    process.exit(1);
  }

  // Initialize Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('✅ Using service role key (bypasses RLS)\n');
  } else {
    console.log('⚠️  Using anon key - if RLS blocks, use SUPABASE_SERVICE_ROLE_KEY instead\n');
  }

  // Normalize and prepare leads
  console.log('🔄 Normalizing lead data...');
  const normalizedLeads = [];

  for (const record of records) {
    // Skip if no name data at all
    if (!record['First Name'] && !record['Last Name'] && !record.Email) {
      continue;
    }

    const firstName = record['First Name']?.trim() || null;
    const lastName = record['Last Name']?.trim() || null;
    const company = normalizeCompany(record['companyName'] || record['Company'] || '');
    const location = normalizeLocation(record['location'] || '');
    const linkedinUrl = normalizeLinkedInUrl(record['linkedIn'] || '');
    const companyWebsite = normalizeWebsite(record['companyWebsite'] || record['companyDomain'] || '');
    
    // Extract emails
    const emails = extractEmails(record['Email'] || '');

    // Only add if we have at least a name or email
    if (firstName || lastName || emails.length > 0) {
      normalizedLeads.push({
        firstName: firstName || null,
        lastName: lastName || null,
        company: company,
        location: location,
        linkedinUrl: linkedinUrl,
        email1: emails[0] || null,
        email2: emails[1] || null,
        companyWebsite: companyWebsite,
        source: 'instantly',
      });
    }
  }

  console.log(`✅ Normalized ${normalizedLeads.length} leads\n`);

  // Import to Supabase
  console.log('💾 Importing to Supabase...');
  let success = 0;
  let failed = 0;
  const errors = [];

  // Process in batches of 100
  const batchSize = 100;
  for (let i = 0; i < normalizedLeads.length; i += batchSize) {
    const batch = normalizedLeads.slice(i, i + batchSize);
    
    const batchData = batch.map((lead) => ({
      first_name: lead.firstName || null,
      last_name: lead.lastName || null,
      company: lead.company || null,
      location: lead.location || null,
      linkedin_url: lead.linkedinUrl || null,
      email_1: lead.email1 || null,
      email_2: lead.email2 || null,
      company_website: lead.companyWebsite || null,
      source: lead.source || 'instantly',
      imported_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    try {
      const { data, error } = await supabase
        .from('cold_leads')
        .insert(batchData)
        .select();

      if (error) {
        throw error;
      }

      success += data?.length || 0;
      console.log(`   Imported batch ${Math.floor(i / batchSize) + 1}: ${data?.length || 0} leads`);
    } catch (error) {
      console.error(`   Error importing batch ${Math.floor(i / batchSize) + 1}:`, error.message);
      failed += batch.length;
      errors.push({
        batch: Math.floor(i / batchSize) + 1,
        error: error.message,
      });
    }
  }

  console.log('\n✅ Import complete!');
  console.log(`   Successfully imported: ${success}`);
  console.log(`   Failed: ${failed}`);
  
  if (errors.length > 0) {
    console.log(`\n⚠️  Errors encountered:`);
    errors.forEach((err) => {
      console.log(`   Batch ${err.batch}: ${err.error}`);
    });
  }
  
  console.log('\n');
}

// Run the import
const csvPath = process.argv[2] || '/Users/rickybodner/Downloads/leads.csv';

if (!csvPath) {
  console.error('❌ Please provide a CSV file path');
  console.log('\nUsage: node scripts/import-cold-leads.js path/to/leads.csv\n');
  process.exit(1);
}

importLeadsFromCSV(csvPath).catch(console.error);

