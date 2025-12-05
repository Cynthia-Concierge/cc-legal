/**
 * Test script for the simple website compliance scan endpoint
 * Tests: /api/scan-website-compliance
 * 
 * Usage: node test-simple-scan.js [website-url]
 * Example: node test-simple-scan.js example.com
 */

import('dotenv').then(dotenv => {
  dotenv.default.config();
  runTest();
});

async function runTest() {
  const API_URL = process.env.VITE_API_URL || 'http://localhost:3001';

  async function testSimpleScan(websiteUrl) {
    console.log('🧪 Testing Simple Website Compliance Scan\n');
    console.log(`📋 Website: ${websiteUrl}`);
    console.log(`🔗 Endpoint: ${API_URL}/api/scan-website-compliance\n`);

    try {
      const response = await fetch(`${API_URL}/api/scan-website-compliance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          websiteUrl: websiteUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Error:', errorData.message || response.statusText);
        console.error('   Status:', response.status);
        return;
      }

      const data = await response.json();
      
      console.log('✅ Scan completed successfully!\n');
      console.log('📊 Results:');
      console.log('─'.repeat(50));
      
      if (data.analysis) {
        console.log(`\n📝 Summary: ${data.analysis.summary}\n`);
        
        if (data.analysis.missingDocuments && data.analysis.missingDocuments.length > 0) {
          console.log('❌ Missing Documents:');
          data.analysis.missingDocuments.forEach((doc, idx) => {
            console.log(`   ${idx + 1}. ${doc}`);
          });
          console.log('');
        } else {
          console.log('✅ No missing documents found!\n');
        }
        
        if (data.analysis.issues && data.analysis.issues.length > 0) {
          console.log('⚠️  Issues Found:');
          data.analysis.issues.forEach((issue, idx) => {
            console.log(`\n   ${idx + 1}. ${issue.document}`);
            console.log(`      Issue: ${issue.issue}`);
            console.log(`      Severity: ${issue.severity.toUpperCase()}`);
            console.log(`      Why it matters: ${issue.whyItMatters}`);
          });
          console.log('');
        } else {
          console.log('✅ No issues found in existing documents!\n');
        }
      } else {
        console.log('⚠️  No analysis data returned');
        console.log('   Response:', JSON.stringify(data, null, 2));
      }
      
      console.log('─'.repeat(50));
      console.log('\n✅ Test completed successfully!');
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      if (error.stack) {
        console.error('\nStack trace:', error.stack);
      }
    }
  }

  // Test with a sample website
  const testUrl = process.argv[2] || 'example.com';
  await testSimpleScan(testUrl);
}
