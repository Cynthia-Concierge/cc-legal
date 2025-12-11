/**
 * ONE-TIME MIGRATION SCRIPT
 * Tags all existing business profile users in GoHighLevel with "created business profile" tag
 *
 * Usage: node migrate-business-profile-tags.js
 */

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3001';

async function runMigration() {
  console.log('🚀 Starting migration to tag existing business profile users...');
  console.log(`📡 Server URL: ${SERVER_URL}`);
  console.log('');

  try {
    const response = await fetch(`${SERVER_URL}/api/migrate-business-profile-tags`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }

    const result = await response.json();

    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   Total business profiles: ${result.summary.total}`);
    console.log(`   ✅ Successfully tagged: ${result.summary.success}`);
    console.log(`   ❌ Errors: ${result.summary.errors}`);
    console.log('');

    if (result.results && result.results.length > 0) {
      console.log('📋 Detailed Results:');
      console.log('');

      result.results.forEach((item, index) => {
        const status = item.success ? '✅' : '❌';
        const email = item.email || 'Unknown';
        const businessName = item.businessName || 'No name';

        if (item.success) {
          if (item.created) {
            console.log(`${index + 1}. ${status} ${email} (${businessName}) - CREATED NEW contact in GHL`);
            console.log(`   Tags: ${item.tags.join(', ')}`);
          } else if (item.updated) {
            console.log(`${index + 1}. ${status} ${email} (${businessName}) - UPDATED existing contact`);
            if (item.previousTags && item.previousTags.length > 0) {
              console.log(`   Previous tags: ${item.previousTags.join(', ')}`);
            }
            if (item.newTags && item.newTags.length > 0) {
              console.log(`   New tags: ${item.newTags.join(', ')}`);
            }
          } else if (item.alreadyTagged) {
            console.log(`${index + 1}. ${status} ${email} (${businessName}) - Already tagged`);
          } else {
            console.log(`${index + 1}. ${status} ${email} (${businessName}) - Tagged successfully`);
            if (item.previousTags && item.previousTags.length > 0) {
              console.log(`   Previous tags: ${item.previousTags.join(', ')}`);
            }
            if (item.newTags && item.newTags.length > 0) {
              console.log(`   New tags: ${item.newTags.join(', ')}`);
            }
          }
        } else {
          console.log(`${index + 1}. ${status} ${email} (${businessName}) - ERROR: ${item.error}`);
        }
        console.log('');
      });
    }

    console.log('🎉 Migration complete!');

  } catch (error) {
    console.error('❌ Error running migration:', error.message);
    process.exit(1);
  }
}

runMigration();
