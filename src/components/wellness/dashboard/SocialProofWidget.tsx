import React, { useEffect, useState } from 'react';
import { Users, TrendingUp, Shield, Sparkles } from 'lucide-react';
import { Card } from '../ui/Card';

interface SocialProofStats {
  totalProtected: number;
  breakdown: {
    yogaStudios: number;
    retreatLeaders: number;
    coaches: number;
    gyms: number;
    other: number;
  };
  recentSignups: number; // signups in last 7 days
  lastUpdated?: string;
}

interface SocialProofWidgetProps {
  stats?: SocialProofStats;
  animated?: boolean;
  autoRefresh?: boolean; // Enable auto-refresh from API
  refreshInterval?: number; // Refresh interval in milliseconds (default: 5 minutes)
}

export const SocialProofWidget: React.FC<SocialProofWidgetProps> = ({
  stats: initialStats = {
    totalProtected: 1247,
    breakdown: {
      yogaStudios: 127,
      retreatLeaders: 89,
      coaches: 203,
      gyms: 156,
      other: 672,
    },
    recentSignups: 34,
  },
  animated = true,
  autoRefresh = true, // Default to auto-refresh
  refreshInterval = 5 * 60 * 1000, // Default: 5 minutes
}) => {
  const [stats, setStats] = useState<SocialProofStats>(initialStats);
  const [displayTotal, setDisplayTotal] = useState(animated ? 0 : stats.totalProtected);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Animated counter effect
  useEffect(() => {
    if (!animated) return;

    // Trigger animation after component mounts
    setIsVisible(true);

    const duration = 2000; // 2 seconds
    const steps = 60;
    const increment = stats.totalProtected / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= stats.totalProtected) {
        setDisplayTotal(stats.totalProtected);
        clearInterval(timer);
      } else {
        setDisplayTotal(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [stats.totalProtected, animated]);

  // Fetch live stats from API
  const fetchLiveStats = async () => {
    if (!autoRefresh) return;

    try {
      setIsLoading(true);
      const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';
      const response = await fetch(`${serverUrl}/api/stats/social-proof`);

      if (response.ok) {
        const liveStats = await response.json();
        console.log('[SocialProof] Fetched live stats:', liveStats);

        // Only update if numbers actually changed
        if (liveStats.totalProtected !== stats.totalProtected) {
          console.log(`[SocialProof] Stats updated: ${stats.totalProtected} → ${liveStats.totalProtected}`);
          setStats(liveStats);
        }
      } else {
        console.warn('[SocialProof] Failed to fetch stats, using fallback');
      }
    } catch (error) {
      console.warn('[SocialProof] Error fetching live stats, using fallback:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch stats on mount and set up auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    // Fetch immediately on mount
    fetchLiveStats();

    // Set up interval to fetch periodically
    const intervalId = setInterval(() => {
      fetchLiveStats();
    }, refreshInterval);

    console.log(`[SocialProof] Auto-refresh enabled (every ${refreshInterval / 1000 / 60} minutes)`);

    // Cleanup interval on unmount
    return () => {
      clearInterval(intervalId);
      console.log('[SocialProof] Auto-refresh stopped');
    };
  }, [autoRefresh, refreshInterval]);

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  return (
    <Card className="border-none shadow-sm bg-gradient-to-br from-teal-50 via-white to-emerald-50 overflow-hidden relative">
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-teal-100 rounded-full blur-3xl opacity-20 -mr-16 -mt-16" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-100 rounded-full blur-2xl opacity-20 -ml-12 -mb-12" />

      <div className="relative p-6">
        {/* Header with icon and trending indicator */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <Shield className="text-white" size={24} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-600 flex items-center gap-1">
                Community Protection
                <Sparkles className="text-yellow-500" size={14} />
              </h3>
              <div className="flex items-center gap-1 text-xs text-emerald-600 font-semibold mt-0.5">
                <TrendingUp size={12} />
                <span>+{stats.recentSignups} this week</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main stat - Total Protected */}
        <div className="mb-6">
          <div className="flex items-baseline gap-2 mb-2">
            <span
              className={`text-4xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent transition-all duration-500 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              {formatNumber(displayTotal)}
            </span>
            <Users className="text-teal-500 mb-1" size={20} />
          </div>
          <p className="text-sm text-slate-600 font-medium">
            wellness professionals protected by Conscious Counsel
          </p>
        </div>

        {/* Breakdown by business type */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Popular with businesses like yours:</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <BusinessTypeBadge
              count={stats.breakdown.yogaStudios}
              label="yoga studios"
              color="teal"
              delay={animated ? 0.1 : 0}
            />
            <BusinessTypeBadge
              count={stats.breakdown.retreatLeaders}
              label="retreat leaders"
              color="emerald"
              delay={animated ? 0.2 : 0}
            />
            <BusinessTypeBadge
              count={stats.breakdown.coaches}
              label="coaches"
              color="cyan"
              delay={animated ? 0.3 : 0}
            />
            <BusinessTypeBadge
              count={stats.breakdown.gyms}
              label="gyms"
              color="teal"
              delay={animated ? 0.4 : 0}
            />
          </div>
        </div>

        {/* Bottom message */}
        <div className="mt-6 pt-4 border-t border-slate-200/50">
          <p className="text-xs text-slate-500 text-center italic mb-2">
            "Join thousands of wellness professionals who chose legal peace of mind"
          </p>
          {autoRefresh && (
            <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400">
              <div className={`w-1.5 h-1.5 rounded-full ${isLoading ? 'bg-yellow-500 animate-pulse' : 'bg-emerald-500'}`} />
              <span>
                {isLoading ? 'Updating...' : 'Live stats • Auto-updates every 5 min'}
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

// Sub-component for business type badges
interface BusinessTypeBadgeProps {
  count: number;
  label: string;
  color: 'teal' | 'emerald' | 'cyan';
  delay?: number;
}

const BusinessTypeBadge: React.FC<BusinessTypeBadgeProps> = ({ count, label, color, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay * 1000);

    return () => clearTimeout(timer);
  }, [delay]);

  const colorClasses = {
    teal: 'bg-teal-100 text-teal-700 border-teal-200',
    emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    cyan: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  };

  return (
    <div
      className={`
        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold
        transition-all duration-500 transform
        ${colorClasses[color]}
        ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}
      `}
    >
      <span className="font-bold">{count}</span>
      <span className="font-normal">{label}</span>
    </div>
  );
};
