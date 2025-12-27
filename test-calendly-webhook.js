/**
 * Test script for Calendly webhook endpoint
 * Simulates a Calendly webhook event to verify the integration works
 */

// Sample Calendly webhook payload for invitee.created event
const testPayload = {
  event: "invitee.created",
  time: new Date().toISOString(),
  payload: {
    event: {
      uri: "https://api.calendly.com/scheduled_events/AAAAAAAAAAAAAAAA",
      name: "Connection Call with Chad",
      start_time: "2025-12-23T15:00:00.000000Z",
      end_time: "2025-12-23T15:30:00.000000Z",
      status: "active",
      location: {
        type: "zoom",
        join_url: "https://zoom.us/j/123456789",
        location: "Zoom"
      }
    },
    event_type: {
      uri: "https://api.calendly.com/event_types/BBBBBBBBBBBBBBBB",
      name: "Connection Call with Chad",
      slug: "connection-call-with-chad",
      duration: 30
    },
    invitee: {
      uri: "https://api.calendly.com/scheduled_events/AAAAAAAAAAAAAAAA/invitees/CCCCCCCCCCCCCCCC",
      name: "Test User",
      email: "test@example.com",
      timezone: "America/New_York",
      created_at: new Date().toISOString(),
      questions_and_answers: [
        {
          question: "Phone Number",
          answer: "+1 (555) 123-4567"
        },
        {
          question: "What would you like to discuss?",
          answer: "I need help with trademark protection for my business"
        }
      ],
      tracking: {
        utm_source: "website",
        utm_medium: "onboarding",
        utm_campaign: "wellness_flow"
      }
    }
  }
};

// Sample cancellation payload
const cancellationPayload = {
  event: "invitee.canceled",
  time: new Date().toISOString(),
  payload: {
    event: {
      uri: "https://api.calendly.com/scheduled_events/AAAAAAAAAAAAAAAA",
      name: "Connection Call with Chad",
      start_time: "2025-12-23T15:00:00.000000Z",
      end_time: "2025-12-23T15:30:00.000000Z",
      status: "canceled"
    },
    event_type: {
      uri: "https://api.calendly.com/event_types/BBBBBBBBBBBBBBBB",
      name: "Connection Call with Chad"
    },
    invitee: {
      uri: "https://api.calendly.com/scheduled_events/AAAAAAAAAAAAAAAA/invitees/CCCCCCCCCCCCCCCC",
      name: "Test User",
      email: "test@example.com",
      cancellation: {
        canceled_by: "Test User",
        reason: "Schedule conflict"
      }
    },
    canceled_at: new Date().toISOString()
  }
};

async function testWebhook(eventType = 'created') {
  const payload = eventType === 'created' ? testPayload : cancellationPayload;
  const serverUrl = process.env.VITE_SERVER_URL || 'http://localhost:3001';
  const webhookUrl = `${serverUrl}/api/webhooks/calendly`;

  console.log(`\n=== Testing Calendly Webhook (${eventType}) ===`);
  console.log(`Webhook URL: ${webhookUrl}`);
  console.log(`Event type: ${payload.event}`);
  console.log(`Test email: ${payload.payload.invitee.email}\n`);

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const responseData = await response.json();

    if (response.ok) {
      console.log('✅ Webhook test successful!');
      console.log('Response:', JSON.stringify(responseData, null, 2));
      console.log('\n📝 Next steps:');
      console.log('1. Check server logs for processing messages');
      console.log('2. Query database to verify record was created:');
      console.log(`   SELECT * FROM calendly_appointments WHERE invitee_email = '${payload.payload.invitee.email}';`);
      console.log('3. Check legacy fields were updated:');
      console.log(`   SELECT email, calendly_booked_at FROM contacts WHERE email = '${payload.payload.invitee.email}';`);
    } else {
      console.error('❌ Webhook test failed!');
      console.error('Status:', response.status);
      console.error('Response:', JSON.stringify(responseData, null, 2));
    }
  } catch (error) {
    console.error('❌ Error testing webhook:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('1. Make sure your backend server is running: npm run server');
    console.error('2. Check VITE_SERVER_URL in .env file');
    console.error('3. Verify the server is accessible at:', serverUrl);
  }
}

// Run tests
async function runTests() {
  console.log('🧪 Starting Calendly webhook tests...\n');

  // Load .env file
  try {
    const dotenv = await import('dotenv');
    dotenv.config();
  } catch (e) {
    console.warn('⚠️  Could not load dotenv, using process.env directly');
  }

  // Test event creation
  await testWebhook('created');

  // Wait a moment
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test cancellation
  await testWebhook('canceled');

  console.log('\n✨ Tests complete!\n');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { testWebhook, testPayload, cancellationPayload };
