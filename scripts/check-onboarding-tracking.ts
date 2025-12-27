/**
 * Diagnostic script to check if onboarding events are being tracked
 * Run this to see what's happening with your onboarding analytics
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkOnboardingTracking() {
  console.log('🔍 Checking Onboarding Event Tracking...\n');

  // 1. Check if table exists and has data
  const { data: events, error: eventsError } = await supabase
    .from('onboarding_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (eventsError) {
    console.error('❌ Error querying onboarding_events:', eventsError);
    return;
  }

  console.log(`📊 Total events found: ${events?.length || 0}\n`);

  if (!events || events.length === 0) {
    console.log('⚠️  No events found! Tracking may not be working.\n');
    return;
  }

  // 2. Check most recent events
  console.log('📅 Most Recent Events (last 10):');
  events.slice(0, 10).forEach((event, i) => {
    console.log(
      `${i + 1}. [${event.created_at}] Step ${event.step_number} (${event.step_name}) - ${event.event_type} - Entry: ${event.entry_point}`
    );
  });
  console.log('');

  // 3. Check entry points
  const { data: entryPoints } = await supabase
    .from('onboarding_events')
    .select('entry_point')
    .eq('step_number', 1)
    .eq('event_type', 'started');

  const directCount = entryPoints?.filter((e) => e.entry_point === 'onboarding_direct').length || 0;
  const landingCount = entryPoints?.filter((e) => e.entry_point === 'landing_page').length || 0;

  console.log(`🚪 Entry Points (Step 1 Started):`);
  console.log(`   - Direct: ${directCount}`);
  console.log(`   - Landing Page: ${landingCount}`);
  console.log('');

  // 4. Check opt-in rate (Step 1 completed)
  const { data: started } = await supabase
    .from('onboarding_events')
    .select('session_id')
    .eq('step_number', 1)
    .eq('event_type', 'started')
    .eq('entry_point', 'onboarding_direct');

  const { data: completed } = await supabase
    .from('onboarding_events')
    .select('session_id')
    .eq('step_number', 1)
    .eq('event_type', 'completed')
    .eq('entry_point', 'onboarding_direct');

  const uniqueStarted = new Set(started?.map((e) => e.session_id) || []);
  const uniqueCompleted = new Set(completed?.map((e) => e.session_id) || []);

  console.log(`📈 Opt-In Rate (Direct Entry):`);
  console.log(`   - Landed on Step 1: ${uniqueStarted.size}`);
  console.log(`   - Completed Step 1 (opted in): ${uniqueCompleted.size}`);
  console.log(`   - Opt-in Rate: ${uniqueStarted.size > 0 ? ((uniqueCompleted.size / uniqueStarted.size) * 100).toFixed(1) : 0}%`);
  console.log('');

  // 5. Check for errors in recent events
  const { data: recentEvents } = await supabase
    .from('onboarding_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  const eventsWithEmail = recentEvents?.filter((e) => e.email) || [];
  const eventsWithoutEmail = recentEvents?.filter((e) => !e.email) || [];

  console.log(`📧 Email Tracking:`);
  console.log(`   - Events with email: ${eventsWithEmail.length}`);
  console.log(`   - Events without email: ${eventsWithoutEmail.length}`);
  console.log('');

  // 6. Check step distribution
  const { data: stepDistribution } = await supabase
    .from('onboarding_events')
    .select('step_number, event_type')
    .order('step_number', { ascending: true });

  const stepCounts: Record<number, { started: number; completed: number }> = {};
  stepDistribution?.forEach((e) => {
    if (!stepCounts[e.step_number]) {
      stepCounts[e.step_number] = { started: 0, completed: 0 };
    }
    if (e.event_type === 'started') stepCounts[e.step_number].started++;
    if (e.event_type === 'completed') stepCounts[e.step_number].completed++;
  });

  console.log(`📊 Step Distribution (Top 10):`);
  Object.entries(stepCounts)
    .slice(0, 10)
    .forEach(([step, counts]) => {
      const completionRate = counts.started > 0 ? ((counts.completed / counts.started) * 100).toFixed(1) : '0';
      console.log(`   Step ${step}: ${counts.started} started, ${counts.completed} completed (${completionRate}%)`);
    });
  console.log('');

  // 7. Check RLS policies
  console.log('🔒 Checking RLS Policies...');
  const { data: policies, error: policiesError } = await supabase.rpc('get_table_policies', {
    table_name: 'onboarding_events',
  });

  if (policiesError) {
    console.log('   (Could not check policies - this is normal if function doesn\'t exist)');
  } else {
    console.log(`   Policies found: ${policies?.length || 0}`);
  }
  console.log('');

  // 8. Summary
  console.log('✅ Diagnostic Complete!\n');
  console.log('💡 If you see low opt-in rates, check:');
  console.log('   1. Browser console for tracking errors');
  console.log('   2. RLS policies allow anonymous inserts');
  console.log('   3. Supabase client is properly initialized');
  console.log('   4. Network tab for failed API calls');
}

checkOnboardingTracking().catch(console.error);
