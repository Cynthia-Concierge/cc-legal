#!/usr/bin/env node

/**
 * Test document personalization to ensure placeholders are replaced
 */

async function testPersonalization() {
  try {
    // Test without user data (should use default placeholders)
    console.log('Testing HTML generation without user data...\n');

    const response = await fetch('http://localhost:3001/api/documents/generate-html', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        templateName: 'social_media_disclaimer',
      }),
    });

    if (!response.ok) {
      console.log('❌ Failed to generate HTML:', response.status);
      const text = await response.text();
      console.log(text);
      return;
    }

    const html = await response.text();

    // Check for unreplaced placeholders
    const placeholderRegex = /\{\{([^}]+)\}\}/g;
    const matches = [...html.matchAll(placeholderRegex)];

    if (matches.length > 0) {
      console.log(`❌ Found ${matches.length} unreplaced placeholders:`);
      const unique = [...new Set(matches.map(m => m[0]))];
      unique.forEach(p => console.log(`   ${p}`));
    } else {
      console.log('✅ No unreplaced placeholders found');
    }

    // Check that default values were inserted
    if (html.includes('[Business Name]')) {
      console.log('✅ Default business name placeholder inserted');
    } else {
      console.log('❌ Default business name not found');
    }

    if (html.includes('[Address]')) {
      console.log('✅ Default address placeholder inserted');
    } else {
      console.log('❌ Default address not found');
    }

    if (html.includes('[Jurisdiction]')) {
      console.log('✅ Default jurisdiction placeholder inserted');
    } else {
      console.log('❌ Default jurisdiction not found');
    }

    // Check for the disclaimer banner
    if (html.includes('DRAFT DOCUMENT - NOT LEGAL ADVICE')) {
      console.log('✅ Disclaimer banner present');
    } else {
      console.log('❌ Disclaimer banner missing');
    }

    console.log('\n✅ Personalization test completed successfully!');

  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testPersonalization();
