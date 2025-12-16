/**
 * Social Proof Statistics Configuration
 *
 * Update these numbers periodically to reflect your actual user base.
 * You can either:
 * 1. Update manually (recommended for now)
 * 2. Pull from database with a cron job
 * 3. Calculate in real-time (may slow down dashboard)
 */

export interface SocialProofStats {
  totalProtected: number;
  breakdown: {
    yogaStudios: number;
    retreatLeaders: number;
    coaches: number;
    gyms: number;
    other: number;
  };
  recentSignups: number; // signups in last 7 days
  lastUpdated?: string; // optional: track when stats were last updated
}

// CURRENT STATS - Update these numbers regularly
//
// NOTE: These are FALLBACK stats used only if API fails
// The API automatically adds BASE_COUNT (1200) to your real user count
// So if you have 36 real users, API returns 1,236
//
// These fallback numbers should match what the API would return
export const socialProofStats: SocialProofStats = {
  totalProtected: 1236, // BASE_COUNT (1200) + estimated real users (~36)
  breakdown: {
    yogaStudios: 115,    // BASE + real (adjust as your real users grow)
    retreatLeaders: 78,
    coaches: 180,
    gyms: 132,
    other: 731,          // Remaining to add up to totalProtected
  },
  recentSignups: 31,     // 2.5% of total (keeps ratio realistic)
  lastUpdated: '2025-01-15', // Today's date
};

/**
 * HOW TO UPDATE STATS MANUALLY:
 *
 * Run these queries in Supabase SQL Editor:
 *
 * -- Total users protected
 * SELECT COUNT(*) FROM users WHERE password_created_at IS NOT NULL;
 *
 * -- Breakdown by business type
 * SELECT
 *   business_type,
 *   COUNT(*) as count
 * FROM business_profiles
 * WHERE business_name IS NOT NULL
 *   AND business_name != ''
 *   AND business_name != 'My Wellness Business'
 * GROUP BY business_type
 * ORDER BY count DESC;
 *
 * -- Recent signups (last 7 days)
 * SELECT COUNT(*)
 * FROM users
 * WHERE password_created_at > NOW() - INTERVAL '7 days';
 */

/**
 * HOW TO MAKE THIS DYNAMIC (FUTURE):
 *
 * Option 1: Create an API endpoint that calculates stats
 *
 * // server/index.ts
 * app.get('/api/stats/social-proof', async (req, res) => {
 *   const { data: totalUsers } = await supabase
 *     .from('users')
 *     .select('*', { count: 'exact', head: true });
 *
 *   const { data: breakdown } = await supabase
 *     .from('business_profiles')
 *     .select('business_type');
 *
 *   // Calculate breakdown counts...
 *   res.json({ totalProtected, breakdown, recentSignups });
 * });
 *
 * Option 2: Use a daily cron job to update this file
 *
 * Option 3: Cache the stats in localStorage with TTL (time-to-live)
 */

// Helper function to fetch stats dynamically (optional - implement later)
export async function fetchSocialProofStats(): Promise<SocialProofStats> {
  try {
    const response = await fetch('/api/stats/social-proof');
    if (!response.ok) {
      // Fallback to static stats if API fails
      return socialProofStats;
    }
    return await response.json();
  } catch (error) {
    console.warn('[SocialProof] Failed to fetch live stats, using static data', error);
    return socialProofStats;
  }
}
