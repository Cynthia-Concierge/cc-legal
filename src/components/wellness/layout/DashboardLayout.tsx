import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Home, FileText, Calendar, User, Menu, X, LogOut, Settings, Globe, Search, Phone, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/wellness/ui/Button';
import { CalendlyModal } from '@/components/wellness/CalendlyModal';

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    onBookCall: () => void;
    hasImpersonationBanner?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, onBookCall, hasImpersonationBanner = false }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        // Clear impersonation info if present
        localStorage.removeItem('admin_impersonation');
        if (supabase) {
            await supabase.auth.signOut();
        }
        localStorage.removeItem('wellness_onboarding_answers');
        navigate('/wellness/login');
    };

    const [isAdmin, setIsAdmin] = useState(false);

    const checkAdmin = async () => {
        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) {
                console.log('No authenticated user');
                setIsAdmin(false);
                return;
            }

            console.log('Checking admin status for:', user.email);

            // Method 1: Check via RPC (best if function exists)
            const { data: isAdminRpc, error: rpcError } = await supabase.rpc('is_admin');
            if (!rpcError && isAdminRpc === true) {
                console.log('Admin confirmed via RPC');
                setIsAdmin(true);
                return;
            }

            if (rpcError) {
                console.warn('RPC error (function may not exist):', rpcError);
            }

            // Method 2: Fallback to table query
            const { data, error } = await supabase
                .from('users')
                .select('role')
                .eq('user_id', user.id)
                .single();

            if (error) {
                console.error('Error checking admin role:', error);
                setIsAdmin(false);
                return;
            }

            if (data?.role === 'admin') {
                console.log('Admin confirmed via table');
                setIsAdmin(true);
            } else {
                console.log('User is not admin, role:', data?.role || 'none');
                setIsAdmin(false);
            }
        } catch (err) {
            console.error('Admin check failed:', err);
            setIsAdmin(false);
        }
    };

    useEffect(() => {
        checkAdmin();

        // Listen for auth state changes to re-check admin status
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('[Sidebar] Auth state changed:', event, session?.user?.email);
            // Re-check admin status when auth state changes (e.g., after exiting impersonation)
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
                // Small delay to ensure session is fully restored
                setTimeout(() => {
                    checkAdmin();
                }, 500);
            }
        });

        // Also listen for custom event when admin session is restored
        const handleAdminSessionRestored = () => {
            console.log('[Sidebar] Admin session restored event received, re-checking admin status...');
            setTimeout(() => {
                checkAdmin();
            }, 500);
        };

        window.addEventListener('admin-session-restored', handleAdminSessionRestored);

        return () => {
            subscription.unsubscribe();
            window.removeEventListener('admin-session-restored', handleAdminSessionRestored);
        };
    }, []);

    const menuItems = [
        { icon: <Home size={20} />, label: 'Overview', path: '/wellness/dashboard' },
        { icon: <FileText size={20} />, label: 'Your Documents', path: '/wellness/dashboard/documents' },
        { icon: <Globe size={20} />, label: 'Website Compliance', path: '/wellness/dashboard/website-compliance' },
        { icon: <Search size={20} />, label: 'Trademark Scan', path: '/wellness/dashboard/trademark-scan' },
        // { icon: <Calendar size={20} />, label: 'Compliance', path: '/wellness/dashboard/compliance' },
        { icon: <User size={20} />, label: 'My Business Profile', path: '/wellness/dashboard/profile' },
        ...(isAdmin ? [{ icon: <Shield size={20} />, label: 'God Mode', path: '/wellness/admin' }] : []),
    ];

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 z-40 md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`
        fixed ${hasImpersonationBanner ? 'top-[60px] md:top-[70px]' : 'top-0'} left-0 h-screen bg-white border-r border-slate-200 w-64 z-50 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}
      style={{ height: hasImpersonationBanner ? 'calc(100vh - 60px)' : '100vh' }}
      >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="h-16 flex items-center px-6 border-b border-slate-100">
                        <div className="flex items-center gap-2 text-brand-700">
                            <Shield className="fill-current" size={24} />
                            <span className="font-bold text-lg tracking-tight">Conscious Counsel</span>
                        </div>
                        <button
                            className="ml-auto md:hidden text-slate-400"
                            onClick={() => setIsOpen(false)}
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                        {menuItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <button
                                    key={item.path}
                                    onClick={() => {
                                        navigate(item.path);
                                        setIsOpen(false);
                                    }}
                                    className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                    ${isActive
                                            ? 'bg-brand-50 text-brand-700'
                                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                  `}
                                >
                                    {item.icon}
                                    {item.label}
                                </button>
                            );
                        })}
                    </nav>

                    {/* Footer */}
                    <div className="p-4 border-t border-slate-100 space-y-2">
                        <button
                            onClick={onBookCall}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 transition-colors mb-2"
                        >
                            <Phone size={20} />
                            Book Strategy Call
                        </button>

                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                            <LogOut size={20} />
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

const MobileBottomNav: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { icon: <Home size={24} />, label: 'Home', path: '/wellness/dashboard' },
        { icon: <FileText size={24} />, label: 'Docs', path: '/wellness/dashboard/documents' },
        { icon: <Search size={24} />, label: 'Scan', path: '/wellness/dashboard/trademark-scan' },
        { icon: <User size={24} />, label: 'Profile', path: '/wellness/dashboard/profile' },
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-2 pb-safe z-50 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                    <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={`
                            flex flex-col items-center justify-center gap-1 min-w-[64px] transition-colors
                            ${isActive ? 'text-brand-600' : 'text-slate-400 hover:text-slate-600'}
                        `}
                    >
                        {item.icon}
                        <span className="text-[10px] font-medium">{item.label}</span>
                    </button>
                );
            })}
        </div>
    );
};

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isCalendlyOpen, setIsCalendlyOpen] = useState(false);
    const [impersonationInfo, setImpersonationInfo] = useState<{
        adminEmail: string;
        adminId: string;
        impersonatedUserId: string;
        impersonatedUserEmail: string;
        timestamp: number;
        adminSession?: any;
    } | null>(null);

    useEffect(() => {
        // Check for impersonation info - do a quick synchronous check first
        const stored = localStorage.getItem('admin_impersonation');
        if (stored) {
            try {
                const info = JSON.parse(stored);
                // Set immediately so banner shows up right away
                setImpersonationInfo(info);
                console.log('[Impersonation] Found impersonation info:', info);
            } catch (e) {
                console.error('Error parsing impersonation info:', e);
                localStorage.removeItem('admin_impersonation');
                setImpersonationInfo(null);
            }
        }

        // Then verify the user matches (async check)
        const checkImpersonation = async () => {
            const stored = localStorage.getItem('admin_impersonation');
            if (stored) {
                try {
                    const info = JSON.parse(stored);
                    // Verify the current user matches the impersonated user
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user && user.id === info.impersonatedUserId) {
                        // User matches, keep the banner
                        setImpersonationInfo(info);
                        console.log('[Impersonation] User verified, banner should be visible');
                    } else {
                        // User doesn't match, clear impersonation
                        console.log('[Impersonation] User mismatch, clearing impersonation', {
                            currentUserId: user?.id,
                            expectedUserId: info.impersonatedUserId,
                        });
                        localStorage.removeItem('admin_impersonation');
                        setImpersonationInfo(null);
                    }
                } catch (e) {
                    console.error('Error verifying impersonation:', e);
                    // Don't clear on error - might be a temporary auth issue
                }
            } else {
                setImpersonationInfo(null);
            }
        };

        // Run async check after a short delay to allow auth to settle
        const timeoutId = setTimeout(() => {
            checkImpersonation();
        }, 500);
        
        // Check on location change (when navigating between pages)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
            checkImpersonation();
        });

        return () => {
            clearTimeout(timeoutId);
            subscription.unsubscribe();
        };
    }, [location.pathname]);

    const handleExitImpersonation = async () => {
        if (!impersonationInfo) return;

        try {
            // Sign out the impersonated user
            await supabase.auth.signOut();

            // Restore admin session if we have it stored
            if (impersonationInfo.adminSession) {
                console.log('[Impersonation] Restoring admin session...');
                
                // Set the session using Supabase's setSession method
                const { data, error } = await supabase.auth.setSession({
                    access_token: impersonationInfo.adminSession.access_token,
                    refresh_token: impersonationInfo.adminSession.refresh_token,
                });

                if (error) {
                    console.error('[Impersonation] Error restoring admin session:', error);
                    // If session restore fails, redirect to login
                    localStorage.removeItem('admin_impersonation');
                    setImpersonationInfo(null);
                    navigate('/wellness/login');
                    return;
                }

                console.log('[Impersonation] Admin session restored successfully');
            }

            // Clear impersonation info
            localStorage.removeItem('admin_impersonation');
            setImpersonationInfo(null);
            
            // Redirect to admin dashboard
            navigate('/wellness/admin');
        } catch (error: any) {
            console.error('[Impersonation] Error exiting impersonation:', error);
            // On error, clear and redirect to login
            localStorage.removeItem('admin_impersonation');
            setImpersonationInfo(null);
            navigate('/wellness/login');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
            {/* Impersonation Banner */}
            {impersonationInfo && (
                <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-amber-500 to-amber-600 text-white z-[100] shadow-lg border-b-2 border-amber-700">
                    <div className="max-w-7xl mx-auto px-4 py-3 md:py-4">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4">
                            <div className="flex items-start md:items-center gap-3 flex-1 min-w-0">
                                <AlertTriangle className="flex-shrink-0 mt-0.5 md:mt-0 animate-pulse" size={22} />
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm md:text-base mb-1">
                                        🔒 IMPERSONATION MODE ACTIVE
                                    </p>
                                    <p className="text-xs md:text-sm text-amber-50 break-words">
                                        <span className="font-semibold">Viewing as:</span> {impersonationInfo.impersonatedUserEmail}
                                        {' • '}
                                        <span className="font-semibold">Admin:</span> {impersonationInfo.adminEmail}
                                    </p>
                                </div>
                            </div>
                            <Button
                                onClick={handleExitImpersonation}
                                variant="outline"
                                size="sm"
                                className="bg-white text-amber-700 border-white hover:bg-amber-50 hover:text-amber-800 font-semibold flex-shrink-0 w-full md:w-auto"
                            >
                                Exit Impersonation
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <Sidebar
                isOpen={isSidebarOpen}
                setIsOpen={setIsSidebarOpen}
                onBookCall={() => setIsCalendlyOpen(true)}
                hasImpersonationBanner={!!impersonationInfo}
            />

            {/* Mobile Header - With Call Button */}
            <div className={`md:hidden h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 sticky z-30 ${impersonationInfo ? 'top-[60px]' : 'top-0'}`}>
                <div className="flex items-center gap-2 text-brand-700">
                    <Shield className="fill-current" size={20} />
                    <span className="font-bold text-lg tracking-tight">Conscious Counsel</span>
                </div>

                <button
                    onClick={() => setIsCalendlyOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 text-brand-700 rounded-full text-xs font-semibold hover:bg-brand-100 transition-colors"
                >
                    <Phone size={14} />
                    Book Call
                </button>
            </div>

            {/* Main Content */}
            <div className={`md:ml-64 min-h-screen transition-all duration-300 ${impersonationInfo ? 'pt-[60px]' : ''}`}>
                <main className="p-4 md:p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
                    {children}
                </main>
            </div>

            <MobileBottomNav />

            {/* Global Calendly Modal */}
            <CalendlyModal
                isOpen={isCalendlyOpen}
                onClose={() => setIsCalendlyOpen(false)}
            />
        </div>
    );
};
