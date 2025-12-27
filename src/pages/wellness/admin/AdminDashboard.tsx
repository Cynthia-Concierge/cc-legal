import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/wellness/ui/Card';
import { Button } from '@/components/wellness/ui/Button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Shield, Users, FileText, Search, UserCheck, Contact, ChevronDown, ChevronRight, Check, X, LogIn, Calendar, TrendingDown, BarChart3, ArrowRight, Mail, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface UserData {
    id: string;
    email: string;
    name: string | null;
    subscription_status: string;
    role: string;
    created_at: string;
    last_login_at: string | null;
    user_id: string;
    business_profiles?: {
        business_name: string;
        website_url: string;
    }[];
}

interface ContactData {
    id: string;
    email: string;
    name: string;
    phone: string | null;
    website: string | null;
    user_id: string | null;
    created_at: string;
    calendly_booked_at: string | null;
}

interface BusinessProfileData {
    id: string;
    user_id: string;
    business_name: string | null;
    website_url: string | null;
    instagram: string | null;
    business_type: string | null;
    team_size: string | null;
    monthly_clients: string | null;
    uses_photos: boolean | null;
    primary_concern: string | null;
    hosts_retreats: boolean | null;
    offers_online_courses: boolean | null;
    has_w2_employees: boolean | null;
    sells_products: boolean | null;
    services: string[] | null;
    has_physical_movement: boolean | null;
    collects_online: boolean | null;
    hires_staff: boolean | null;
    is_offsite_or_international: boolean | null;
    legal_entity_name: string | null;
    entity_type: string | null;
    state: string | null;
    business_address: string | null;
    owner_name: string | null;
    phone: string | null;
    has_scanned_website: boolean | null;
    website_scan_completed_at: string | null;
    created_at: string;
    updated_at: string;
}

type FilterType = 'users' | 'contacts' | 'business_profiles';

interface DocumentData {
    user_id: string;
    count: number;
}

interface TrademarkRequestData {
    user_id: string;
    created_at: string;
}

interface FunnelStep {
    step_number: number;
    step_name: string;
    started_count: number;
    completed_count: number;
    abandoned_count: number;
    completion_rate_percent: number | null;
    avg_time_seconds: number | null;
}

interface DropoffPoint {
    step_number: number;
    step_name: string;
    abandoned_count: number;
    started_count: number;
    dropoff_rate_percent: number | null;
}

interface CompletionBySource {
    entry_point: string | null;
    source: string | null;
    total_sessions: number;
    completed_onboarding: number;
    completion_rate_percent: number | null;
}

export const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState<UserData[]>([]);
    const [contacts, setContacts] = useState<ContactData[]>([]);
    const [businessProfiles, setBusinessProfiles] = useState<BusinessProfileData[]>([]);
    const [documentCounts, setDocumentCounts] = useState<Map<string, number>>(new Map());
    const [trademarkRequests, setTrademarkRequests] = useState<Map<string, boolean>>(new Map());
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [activeFilter, setActiveFilter] = useState<FilterType>('users');
    const [searchQuery, setSearchQuery] = useState('');
    const [updatingRoles, setUpdatingRoles] = useState<Set<string>>(new Set());
    const [expandedProfiles, setExpandedProfiles] = useState<Set<string>>(new Set());
    const [impersonating, setImpersonating] = useState<Set<string>>(new Set());
    const [funnelData, setFunnelData] = useState<FunnelStep[]>([]);
    const [dropoffData, setDropoffData] = useState<DropoffPoint[]>([]);
    const [completionBySource, setCompletionBySource] = useState<CompletionBySource[]>([]);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [showUserListModal, setShowUserListModal] = useState(false);
    const [userListModalType, setUserListModalType] = useState<'started' | 'completed' | null>(null);
    const [userListData, setUserListData] = useState<Array<{ email: string | null; user_id: string | null; session_id: string; created_at: string }>>([]);
    const [userListLoading, setUserListLoading] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ type: 'user' | 'contact' | 'business_profile' | 'onboarding_event'; id: string; email?: string; name?: string } | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        checkAdminAndLoadData();
    }, []);

    useEffect(() => {
        if (showAnalytics && isAdmin) {
            loadAnalyticsData();
        }
    }, [showAnalytics, isAdmin]);

    const checkAdminAndLoadData = async () => {
        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) {
                console.error('Auth error:', authError);
                setLoading(false);
                return;
            }

            console.log('Checking admin status for user:', user.id, user.email);

            // Check if current user is admin
            // Try RPC first for better performance/reliability
            const { data: isAdminRpc, error: rpcError } = await supabase.rpc('is_admin');

            if (!rpcError && isAdminRpc === true) {
                console.log('Admin confirmed via RPC');
                setIsAdmin(true);
                await loadAllData();
                return;
            }

            if (rpcError) {
                console.warn('RPC error (may not exist):', rpcError);
            }

            // Fallback to table check
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('role')
                .eq('user_id', user.id)
                .single();

            if (userError) {
                console.error('Error checking user role:', userError);
                setLoading(false);
                return;
            }

            console.log('User role from table:', userData?.role);

            if (userData?.role !== 'admin') {
                console.log('User is not admin');
                setLoading(false);
                return;
            }

            console.log('Admin confirmed via table check');
            setIsAdmin(true);
            await loadAllData();
        } catch (error: any) {
            console.error('Error checking admin status:', error);
            toast.error(`Admin check failed: ${error?.message || 'Unknown error'}`);
            setLoading(false);
        }
    };

    const loadAllData = async () => {
        try {
            setLoading(true);
            console.log('Loading all data...');
            
            // Fetch users
            const { data: usersData, error: usersError } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });

            if (usersError) {
                console.error('Error loading users:', usersError);
                toast.error(`Failed to load users: ${usersError.message}`);
                setUsers([]);
            } else {
                console.log(`Loaded ${usersData?.length || 0} users`);
                setUsers(usersData || []);
            }

            // Fetch contacts
            const { data: contactsData, error: contactsError } = await supabase
                .from('contacts')
                .select('*')
                .order('created_at', { ascending: false });

            if (contactsError) {
                console.error('Error loading contacts:', contactsError);
                toast.error(`Failed to load contacts: ${contactsError.message}`);
                setContacts([]);
            } else {
                console.log(`Loaded ${contactsData?.length || 0} contacts`);
                setContacts(contactsData || []);
            }

            // Fetch business profiles with all fields
            const { data: profilesData, error: profilesError } = await supabase
                .from('business_profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (profilesError) {
                console.error('Error loading business profiles:', profilesError);
                toast.error(`Failed to load business profiles: ${profilesError.message}`);
                setBusinessProfiles([]);
            } else {
                console.log(`Loaded ${profilesData?.length || 0} business profiles`);
                setBusinessProfiles(profilesData || []);
            }

            // Fetch document counts per user
            const { data: documentsData, error: documentsError } = await supabase
                .from('user_documents')
                .select('user_id')
                .order('created_at', { ascending: false });

            if (documentsError) {
                console.warn('Error loading documents (non-critical):', documentsError);
            } else {
                // Count documents per user
                const docCountMap = new Map<string, number>();
                (documentsData || []).forEach((doc: any) => {
                    const count = docCountMap.get(doc.user_id) || 0;
                    docCountMap.set(doc.user_id, count + 1);
                });
                setDocumentCounts(docCountMap);
                console.log(`Loaded document counts for ${docCountMap.size} users`);
            }

            // Fetch trademark requests
            const { data: trademarkData, error: trademarkError } = await supabase
                .from('trademark_requests')
                .select('user_id')
                .order('created_at', { ascending: false });

            if (trademarkError) {
                console.warn('Error loading trademark requests (non-critical):', trademarkError);
            } else {
                // Map user_id to boolean (has done trademark search)
                const trademarkMap = new Map<string, boolean>();
                (trademarkData || []).forEach((req: any) => {
                    trademarkMap.set(req.user_id, true);
                });
                setTrademarkRequests(trademarkMap);
                console.log(`Loaded trademark requests for ${trademarkMap.size} users`);
            }

            // Combine users with their business profiles for display
            if (usersData && profilesData) {
                const profilesMap = new Map();
                profilesData.forEach((profile: any) => {
                    profilesMap.set(profile.user_id, {
                        business_name: profile.business_name,
                        website_url: profile.website_url
                    });
                });

                const usersWithProfiles = usersData.map((user: any) => {
                    const profile = profilesMap.get(user.user_id);
                    return {
                        ...user,
                        business_profiles: profile ? [profile] : []
                    };
                });
                setUsers(usersWithProfiles);
            }
        } catch (error: any) {
            console.error('Error loading data:', error);
            toast.error(`Failed to load data: ${error?.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    const loadUsers = loadAllData; // Keep for backward compatibility with refresh button

    const loadAnalyticsData = async () => {
        try {
            setAnalyticsLoading(true);

            // Fetch funnel summary
            const { data: funnelData, error: funnelError } = await supabase
                .from('onboarding_funnel_summary')
                .select('*')
                .order('step_number', { ascending: true });

            if (funnelError) {
                console.error('Error loading funnel data:', funnelError);
                toast.error(`Failed to load funnel data: ${funnelError.message}`);
            } else {
                setFunnelData(funnelData || []);
            }

            // Fetch drop-off points
            const { data: dropoffData, error: dropoffError } = await supabase
                .from('onboarding_dropoff_points')
                .select('*')
                .order('abandoned_count', { ascending: false });

            if (dropoffError) {
                console.error('Error loading dropoff data:', dropoffError);
                toast.error(`Failed to load dropoff data: ${dropoffError.message}`);
            } else {
                setDropoffData(dropoffData || []);
            }

            // Fetch completion by source
            const { data: sourceData, error: sourceError } = await supabase
                .from('onboarding_completion_by_source')
                .select('*');

            if (sourceError) {
                console.error('Error loading source data:', sourceError);
                toast.error(`Failed to load source data: ${sourceError.message}`);
            } else {
                setCompletionBySource(sourceData || []);
            }
        } catch (error: any) {
            console.error('Error loading analytics:', error);
            toast.error(`Failed to load analytics: ${error?.message || 'Unknown error'}`);
        } finally {
            setAnalyticsLoading(false);
        }
    };

    const handleDeleteClick = (type: 'user' | 'contact' | 'business_profile' | 'onboarding_event', id: string, email?: string, name?: string) => {
        setDeleteTarget({ type, id, email, name });
        setDeleteConfirmOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;

        try {
            setDeleting(true);
            let error: any = null;

            switch (deleteTarget.type) {
                case 'user': {
                    // Delete from users table
                    const { error: userError } = await supabase
                        .from('users')
                        .delete()
                        .eq('id', deleteTarget.id);

                    if (userError) {
                        error = userError;
                    } else {
                        // Also try to delete from auth.users if we have the user_id
                        const user = users.find(u => u.id === deleteTarget.id);
                        if (user?.user_id) {
                            // Note: Deleting from auth.users requires admin API, which we can't do from client
                            // This would need to be done via a server endpoint with service role
                            console.log('[Delete] User deleted from users table. Note: auth.users deletion requires server endpoint.');
                        }
                    }
                    break;
                }
                case 'contact': {
                    const { error: contactError } = await supabase
                        .from('contacts')
                        .delete()
                        .eq('id', deleteTarget.id);
                    error = contactError;
                    break;
                }
                case 'business_profile': {
                    const { error: profileError } = await supabase
                        .from('business_profiles')
                        .delete()
                        .eq('id', deleteTarget.id);
                    error = profileError;
                    break;
                }
                case 'onboarding_event': {
                    // For onboarding events, we need to delete by session_id or email
                    // Since we only have session_id in the modal, we'll delete all events for that session
                    const user = userListData.find(u => u.session_id === deleteTarget.id);
                    if (user?.session_id) {
                        const { error: eventError } = await supabase
                            .from('onboarding_events')
                            .delete()
                            .eq('session_id', user.session_id);
                        error = eventError;
                    } else if (user?.email) {
                        // Delete by email if no session_id
                        const { error: eventError } = await supabase
                            .from('onboarding_events')
                            .delete()
                            .eq('email', user.email);
                        error = eventError;
                    }
                    break;
                }
            }

            if (error) {
                console.error(`[Delete] Error deleting ${deleteTarget.type}:`, error);
                toast.error(`Failed to delete: ${error.message}`);
            } else {
                toast.success(`${deleteTarget.type === 'user' ? 'User' : deleteTarget.type === 'contact' ? 'Contact' : deleteTarget.type === 'business_profile' ? 'Business profile' : 'Onboarding event'} deleted successfully`);
                
                // Refresh data
                await loadAllData();
                
                // If deleting from user list modal, refresh that too
                if (deleteTarget.type === 'onboarding_event' && showUserListModal) {
                    await loadUserList(userListModalType!);
                }
                
                // If deleting from analytics, refresh analytics
                if (showAnalytics && (deleteTarget.type === 'user' || deleteTarget.type === 'contact')) {
                    await loadAnalyticsData();
                }
            }
        } catch (error: any) {
            console.error('[Delete] Error:', error);
            toast.error(`Failed to delete: ${error?.message || 'Unknown error'}`);
        } finally {
            setDeleting(false);
            setDeleteConfirmOpen(false);
            setDeleteTarget(null);
        }
    };

    const loadUserList = async (type: 'started' | 'completed') => {
        try {
            setUserListLoading(true);
            setUserListModalType(type);
            setShowUserListModal(true);

            let query;
            if (type === 'started') {
                // Get users who started onboarding (step 1, event_type = 'started')
                query = supabase
                    .from('onboarding_events')
                    .select('email, user_id, session_id, created_at')
                    .eq('step_number', 1)
                    .eq('event_type', 'started')
                    .order('created_at', { ascending: false });
            } else {
                // Get users who completed onboarding (step 19, event_type = 'completed')
                query = supabase
                    .from('onboarding_events')
                    .select('email, user_id, session_id, created_at')
                    .eq('step_number', 19)
                    .eq('event_type', 'completed')
                    .order('created_at', { ascending: false });
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error loading user list:', error);
                toast.error(`Failed to load user list: ${error.message}`);
                setUserListData([]);
            } else {
                // Get unique users by email (preferring entries with user_id)
                const uniqueUsers = new Map<string, { email: string | null; user_id: string | null; session_id: string; created_at: string }>();
                
                (data || []).forEach((event: any) => {
                    const key = event.email || event.session_id;
                    if (key && !uniqueUsers.has(key)) {
                        uniqueUsers.set(key, {
                            email: event.email,
                            user_id: event.user_id,
                            session_id: event.session_id,
                            created_at: event.created_at
                        });
                    } else if (key && uniqueUsers.has(key) && event.user_id && !uniqueUsers.get(key)?.user_id) {
                        // Update if we found a user_id for this email
                        uniqueUsers.set(key, {
                            email: event.email,
                            user_id: event.user_id,
                            session_id: event.session_id,
                            created_at: event.created_at
                        });
                    }
                });

                setUserListData(Array.from(uniqueUsers.values()));
            }
        } catch (error: any) {
            console.error('Error loading user list:', error);
            toast.error(`Failed to load user list: ${error?.message || 'Unknown error'}`);
            setUserListData([]);
        } finally {
            setUserListLoading(false);
        }
    };

    const updateUserRole = async (userId: string, newRole: string) => {
        try {
            setUpdatingRoles(prev => new Set(prev).add(userId));
            
            const { error } = await supabase
                .from('users')
                .update({ role: newRole })
                .eq('id', userId);

            if (error) {
                console.error('Error updating user role:', error);
                toast.error(`Failed to update role: ${error.message}`);
                return;
            }

            // Update local state
            setUsers(prevUsers => 
                prevUsers.map(user => 
                    user.id === userId ? { ...user, role: newRole } : user
                )
            );

            toast.success(`User role updated to ${newRole}`);
        } catch (error: any) {
            console.error('Error updating user role:', error);
            toast.error(`Failed to update role: ${error?.message || 'Unknown error'}`);
        } finally {
            setUpdatingRoles(prev => {
                const next = new Set(prev);
                next.delete(userId);
                return next;
            });
        }
    };

    const impersonateUser = async (targetUserId: string) => {
        try {
            setImpersonating(prev => new Set(prev).add(targetUserId));
            
            // Get current admin session token and user info BEFORE making the API call
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                toast.error('You must be logged in as an admin');
                return;
            }

            const { data: { user: adminUser } } = await supabase.auth.getUser();
            if (!adminUser) {
                toast.error('Could not get admin user info');
                return;
            }

            // Call the server endpoint to get impersonation token
            // Determine the API base URL (local dev vs production)
            const apiBaseUrl = import.meta.env.VITE_API_URL || 
                              (window.location.hostname === 'localhost' ? 'http://localhost:3001' : '');
            
            const response = await fetch(`${apiBaseUrl}/api/admin/impersonate-user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    adminToken: session.access_token,
                    targetUserId: targetUserId,
                }),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Failed to impersonate user');
            }

            const targetUserEmail = result.data.email || result.data.impersonatedUserEmail || 'Unknown';

            // Store admin session info BEFORE signing out (so we can restore it later)
            // This must be done before signOut() to preserve the admin session
            const adminSessionData = {
                access_token: session.access_token,
                refresh_token: session.refresh_token,
                expires_at: session.expires_at,
                expires_in: session.expires_in,
                token_type: session.token_type,
                user: {
                    id: adminUser.id,
                    email: adminUser.email,
                    // Store minimal user data needed
                }
            };

            localStorage.setItem('admin_impersonation', JSON.stringify({
                adminEmail: adminUser.email || 'Unknown',
                adminId: adminUser.id,
                impersonatedUserId: targetUserId,
                impersonatedUserEmail: targetUserEmail,
                timestamp: Date.now(),
                adminSession: adminSessionData, // Store the full session to restore later
            }));

            console.log('[Impersonation] Stored impersonation info with admin session:', {
                adminEmail: adminUser.email,
                impersonatedUserId: targetUserId,
                impersonatedUserEmail: targetUserEmail,
            });

            // Sign out current admin session
            await supabase.auth.signOut();

            // Check if we got a direct action link (fallback case)
            if (result.data.useDirectLink && result.data.actionLink) {
                // Impersonation info is already stored above
                // Navigate directly to the magic link
                window.location.href = result.data.actionLink;
                return;
            }

            const { token, tokenHash, type, email } = result.data;

            // Use the token to sign in as the target user
            // For magic link tokens, we need to verify the OTP
            const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
                token_hash: tokenHash,
                type: type as any,
            });

            if (verifyError) {
                console.error('OTP verification failed:', verifyError);
                // Try alternative: use the token directly in the URL
                // Supabase magic links work by redirecting with the token in the URL
                const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
                const redirectUrl = `${window.location.origin}/wellness/dashboard`;
                const magicLink = `${supabaseUrl}/auth/v1/verify?token=${token}&type=${type}&redirect_to=${encodeURIComponent(redirectUrl)}`;
                
                // Navigate to the magic link which will handle the session creation
                window.location.href = magicLink;
                return;
            }

            if (verifyData.session) {
                // Successfully signed in as the user
                toast.success(`Logged in as ${email}`);
                
                // Ensure impersonation info is still set (in case it was cleared)
                const stored = localStorage.getItem('admin_impersonation');
                if (!stored && adminUser) {
                    localStorage.setItem('admin_impersonation', JSON.stringify({
                        adminEmail: adminUser.email,
                        adminId: adminUser.id,
                        impersonatedUserId: targetUserId,
                        impersonatedUserEmail: email,
                        timestamp: Date.now(),
                    }));
                }
                
                // Redirect to dashboard
                navigate('/wellness/dashboard');
            } else {
                throw new Error('Session not created after token verification');
            }
        } catch (error: any) {
            console.error('Error impersonating user:', error);
            toast.error(`Failed to log in as user: ${error?.message || 'Unknown error'}`);
        } finally {
            setImpersonating(prev => {
                const next = new Set(prev);
                next.delete(targetUserId);
                return next;
            });
        }
    };

    // Filter data based on search query
    const getFilteredData = useMemo(() => {
        let data: any[] = [];
        
        switch (activeFilter) {
            case 'users':
                data = users;
                break;
            case 'contacts':
                data = contacts;
                break;
            case 'business_profiles':
                data = businessProfiles;
                break;
            default:
                data = users;
        }

        if (!searchQuery.trim()) {
            return data;
        }

        const query = searchQuery.toLowerCase().trim();
        
        if (activeFilter === 'users') {
            return (data as UserData[]).filter(user => 
                user.email.toLowerCase().includes(query) ||
                (user.name && user.name.toLowerCase().includes(query))
            );
        } else if (activeFilter === 'contacts') {
            let filtered = data as ContactData[];
            
            // Special filter for "booked" - show only contacts who booked a call
            if (query === 'booked') {
                filtered = filtered.filter(contact => contact.calendly_booked_at !== null);
            } else if (query.trim()) {
                // Regular search filter
                filtered = filtered.filter(contact => 
                    contact.email.toLowerCase().includes(query) ||
                    contact.name.toLowerCase().includes(query)
                );
            }
            
            return filtered;
        } else if (activeFilter === 'business_profiles') {
            return (data as BusinessProfileData[]).filter(profile => 
                (profile.business_name && profile.business_name.toLowerCase().includes(query)) ||
                (profile.website_url && profile.website_url.toLowerCase().includes(query))
            );
        }

        return data;
    }, [activeFilter, searchQuery, users, contacts, businessProfiles]);

    // Create maps for quick lookups (MUST be before early returns to follow React hooks rules)
    const usersByUserId = useMemo(() => {
        const map = new Map();
        users.forEach(user => {
            map.set(user.user_id, user);
        });
        return map;
    }, [users]);

    const profilesByUserId = useMemo(() => {
        const map = new Map();
        businessProfiles.forEach(profile => {
            map.set(profile.user_id, profile);
        });
        return map;
    }, [businessProfiles]);

    // Helper function to check if contact has user account
    const contactHasUser = (contact: ContactData): boolean => {
        if (contact.user_id) {
            return usersByUserId.has(contact.user_id);
        }
        // Fallback: check by email
        return users.some(u => u.email.toLowerCase() === contact.email.toLowerCase());
    };

    // Helper function to check if contact has completed business profile
    const contactHasProfile = (contact: ContactData): boolean => {
        if (contact.user_id) {
            const profile = profilesByUserId.get(contact.user_id);
            return profile !== undefined && profile.business_name !== null && profile.business_name.trim() !== '';
        }
        // Fallback: check by email -> user_id -> profile
        const user = users.find(u => u.email.toLowerCase() === contact.email.toLowerCase());
        if (user) {
            const profile = profilesByUserId.get(user.user_id);
            return profile !== undefined && profile.business_name !== null && profile.business_name.trim() !== '';
        }
        return false;
    };

    // Helper function to check if contact has scanned website
    const contactHasScannedWebsite = (contact: ContactData): boolean => {
        if (contact.user_id) {
            const profile = profilesByUserId.get(contact.user_id);
            return profile !== undefined && profile.has_scanned_website === true;
        }
        // Fallback: check by email -> user_id -> profile
        const user = users.find(u => u.email.toLowerCase() === contact.email.toLowerCase());
        if (user) {
            const profile = profilesByUserId.get(user.user_id);
            return profile !== undefined && profile.has_scanned_website === true;
        }
        return false;
    };

    // Helper function to get document count for contact
    const getContactDocumentCount = (contact: ContactData): number => {
        if (contact.user_id) {
            return documentCounts.get(contact.user_id) || 0;
        }
        // Fallback: check by email -> user_id
        const user = users.find(u => u.email.toLowerCase() === contact.email.toLowerCase());
        if (user) {
            return documentCounts.get(user.user_id) || 0;
        }
        return 0;
    };

    // Helper function to check if contact has done trademark search
    const contactHasTrademarkSearch = (contact: ContactData): boolean => {
        if (contact.user_id) {
            return trademarkRequests.get(contact.user_id) === true;
        }
        // Fallback: check by email -> user_id
        const user = users.find(u => u.email.toLowerCase() === contact.email.toLowerCase());
        if (user) {
            return trademarkRequests.get(user.user_id) === true;
        }
        return false;
    };

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Loading admin dashboard...</div>;
    }

    if (!isAdmin) {
        return (
            <div className="p-8 text-center">
                <Shield className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <h2 className="text-xl font-bold text-slate-900">Access Denied</h2>
                <p className="text-slate-500 mt-2">You do not have permission to view this page.</p>
            </div>
        );
    }

    const totalUsers = users.length;
    const totalContacts = contacts.length;
    const completedBusinessProfiles = businessProfiles.length;
    const bookedCalls = contacts.filter(c => c.calendly_booked_at !== null).length;
    const recentSignups = users.filter(u => new Date(u.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length;

    const filteredData = getFilteredData;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">God Mode</h1>
                    <p className="text-slate-600">Admin dashboard and user management.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={loadUsers}>
                        Refresh Data
                    </Button>
                </div>
            </div>

            {/* Analytics Toggle Button */}
            <div className="flex items-center justify-between">
                <Button
                    variant="outline"
                    onClick={() => {
                        setShowAnalytics(!showAnalytics);
                        if (!showAnalytics) {
                            loadAnalyticsData();
                        }
                    }}
                    className="flex items-center gap-2"
                >
                    <BarChart3 size={18} />
                    {showAnalytics ? 'Hide' : 'Show'} Onboarding Analytics
                </Button>
            </div>

            {/* Onboarding Analytics Section */}
            {showAnalytics && (
                <div className="space-y-6">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900">Onboarding Analytics</h2>
                                    <p className="text-slate-600 mt-1">Step-by-step funnel analysis and drop-off tracking</p>
                                </div>
                                <Button variant="outline" size="sm" onClick={loadAnalyticsData} disabled={analyticsLoading}>
                                    {analyticsLoading ? 'Loading...' : 'Refresh'}
                                </Button>
                            </div>

                            {analyticsLoading ? (
                                <div className="text-center py-12">
                                    <div className="text-slate-500">Loading analytics data...</div>
                                </div>
                            ) : (
                                <>
                                    {/* Summary Stats */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                        <button
                                            onClick={() => loadUserList('started')}
                                            className="bg-blue-50 p-4 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer text-left border-2 border-transparent hover:border-blue-300"
                                        >
                                            <div className="text-sm font-medium text-blue-600">Total Started</div>
                                            <div className="text-2xl font-bold text-blue-900 mt-1">
                                                {funnelData.length > 0 ? funnelData[0]?.started_count || 0 : 0}
                                            </div>
                                            <div className="text-xs text-blue-600 mt-1 underline">Users who began onboarding (click to view)</div>
                                        </button>
                                        <button
                                            onClick={() => loadUserList('completed')}
                                            className="bg-emerald-50 p-4 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer text-left border-2 border-transparent hover:border-emerald-300"
                                        >
                                            <div className="text-sm font-medium text-emerald-600">Total Completed</div>
                                            <div className="text-2xl font-bold text-emerald-900 mt-1">
                                                {funnelData.length > 0 
                                                    ? funnelData.find(s => s.step_number === 19)?.completed_count || 0 
                                                    : 0}
                                            </div>
                                            <div className="text-xs text-emerald-600 mt-1 underline">Users who finished onboarding (click to view)</div>
                                        </button>
                                        <div className="bg-orange-50 p-4 rounded-lg">
                                            <div className="text-sm font-medium text-orange-600">Overall Completion Rate</div>
                                            <div className="text-2xl font-bold text-orange-900 mt-1">
                                                {funnelData.length > 0 && funnelData[0]?.started_count > 0
                                                    ? Math.round(
                                                        ((funnelData.find(s => s.step_number === 19)?.completed_count || 0) / 
                                                         funnelData[0].started_count) * 100
                                                    )
                                                    : 0}%
                                            </div>
                                            <div className="text-xs text-orange-600 mt-1">From start to finish</div>
                                        </div>
                                    </div>

                                    {/* Funnel Visualization */}
                                    <div className="mb-8">
                                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Onboarding Funnel</h3>
                                        <div className="space-y-3 max-h-[600px] overflow-y-auto">
                                            {funnelData.length === 0 ? (
                                                <div className="text-center py-8 text-slate-500">
                                                    No funnel data available. Make sure onboarding tracking is enabled.
                                                </div>
                                            ) : (
                                                funnelData.map((step, index) => {
                                                    const prevStep = index > 0 ? funnelData[index - 1] : null;
                                                    const currentCount = step.completed_count || 0;
                                                    const prevCount = prevStep?.completed_count || step.started_count || 0;
                                                    const dropoffCount = prevCount - currentCount;
                                                    const conversionRate = prevCount > 0 
                                                        ? Math.round((currentCount / prevCount) * 100) 
                                                        : 0;

                                                    // Calculate width percentage for visual bar
                                                    const maxCount = funnelData[0]?.started_count || 1;
                                                    const widthPercent = Math.max((currentCount / maxCount) * 100, 2);

                                                    return (
                                                        <div key={step.step_number} className="relative">
                                                            {/* Step Card */}
                                                            <div className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                                                <div className="flex items-start justify-between mb-3">
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-3 mb-2">
                                                                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-semibold text-sm">
                                                                                {step.step_number}
                                                                            </div>
                                                                            <div>
                                                                                <h4 className="font-semibold text-slate-900">{step.step_name}</h4>
                                                                                {step.avg_time_seconds && (
                                                                                    <div className="text-xs text-slate-500 mt-0.5">
                                                                                        Avg time: {Math.round(step.avg_time_seconds)}s
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        
                                                                        {/* Visual Progress Bar */}
                                                                        <div className="ml-11 mb-2">
                                                                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                                                <div 
                                                                                    className="h-full bg-brand-600 transition-all duration-500"
                                                                                    style={{ width: `${widthPercent}%` }}
                                                                                />
                                                                            </div>
                                                                        </div>

                                                                        {/* Stats */}
                                                                        <div className="ml-11 grid grid-cols-3 gap-4 text-sm">
                                                                            <div>
                                                                                <div className="text-slate-500 text-xs">Started</div>
                                                                                <div className="font-semibold text-slate-900">{step.started_count}</div>
                                                                            </div>
                                                                            <div>
                                                                                <div className="text-slate-500 text-xs">Completed</div>
                                                                                <div className="font-semibold text-emerald-600">{step.completed_count}</div>
                                                                            </div>
                                                                            <div>
                                                                                <div className="text-slate-500 text-xs">Completion Rate</div>
                                                                                <div className="font-semibold text-slate-900">
                                                                                    {step.completion_rate_percent !== null 
                                                                                        ? `${Math.round(step.completion_rate_percent)}%`
                                                                                        : 'N/A'}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Conversion Arrow */}
                                                                    {index > 0 && (
                                                                        <div className="flex-shrink-0 ml-4 flex flex-col items-center">
                                                                            <ArrowRight className="text-slate-400 mb-1" size={20} />
                                                                            <div className="text-xs font-medium text-slate-600">
                                                                                {conversionRate}%
                                                                            </div>
                                                                            {dropoffCount > 0 && (
                                                                                <div className="text-xs text-red-600 mt-1">
                                                                                    -{dropoffCount}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>

                                    {/* Drop-off Analysis */}
                                    {dropoffData.length > 0 && (
                                        <div className="mb-8">
                                            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                                <TrendingDown className="text-red-500" size={20} />
                                                Top Drop-off Points
                                            </h3>
                                            <div className="space-y-3">
                                                {dropoffData.slice(0, 10).map((dropoff) => {
                                                    const maxDropoff = dropoffData[0]?.abandoned_count || 1;
                                                    const widthPercent = (dropoff.abandoned_count / maxDropoff) * 100;

                                                    return (
                                                        <div key={dropoff.step_number} className="bg-white border border-red-100 rounded-lg p-4">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-semibold text-sm">
                                                                        {dropoff.step_number}
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="font-semibold text-slate-900">{dropoff.step_name}</h4>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="text-lg font-bold text-red-600">{dropoff.abandoned_count}</div>
                                                                    <div className="text-xs text-slate-500">abandoned</div>
                                                                </div>
                                                            </div>
                                                            <div className="ml-11">
                                                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                                    <div 
                                                                        className="h-full bg-red-500 transition-all duration-500"
                                                                        style={{ width: `${widthPercent}%` }}
                                                                    />
                                                                </div>
                                                                <div className="flex items-center justify-between mt-2 text-xs text-slate-600">
                                                                    <span>
                                                                        {dropoff.dropoff_rate_percent !== null 
                                                                            ? `${Math.round(dropoff.dropoff_rate_percent)}% drop-off rate`
                                                                            : 'N/A'}
                                                                    </span>
                                                                    <span>
                                                                        {dropoff.started_count} started this step
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Completion by Source */}
                                    {completionBySource.length > 0 && (
                                        <div>
                                            <h3 className="text-lg font-semibold text-slate-900 mb-4">Completion by Entry Point</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {completionBySource.map((source, index) => (
                                                    <div key={index} className="bg-white border border-slate-200 rounded-lg p-4">
                                                        <div className="font-semibold text-slate-900 mb-3">
                                                            {source.entry_point === 'landing_page' ? 'Landing Page' : 
                                                             source.entry_point === 'onboarding_direct' ? 'Direct Onboarding' : 
                                                             source.entry_point || 'Unknown'}
                                                        </div>
                                                        <div className="space-y-2">
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-slate-600">Total Sessions:</span>
                                                                <span className="font-semibold text-slate-900">{source.total_sessions}</span>
                                                            </div>
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-slate-600">Completed:</span>
                                                                <span className="font-semibold text-emerald-600">{source.completed_onboarding}</span>
                                                            </div>
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-slate-600">Completion Rate:</span>
                                                                <span className="font-semibold text-slate-900">
                                                                    {source.completion_rate_percent !== null 
                                                                        ? `${Math.round(source.completion_rate_percent)}%`
                                                                        : 'N/A'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card 
                    className={`cursor-pointer transition-all hover:shadow-md ${activeFilter === 'contacts' ? 'ring-2 ring-emerald-500' : ''}`}
                    onClick={() => {
                        console.log('Clicked Total Contacts');
                        setActiveFilter('contacts');
                        setSearchQuery(''); // Clear search when switching filters
                    }}
                >
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                            <Contact size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Total Contacts</p>
                            <p className="text-2xl font-bold text-slate-900">{totalContacts}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card 
                    className={`cursor-pointer transition-all hover:shadow-md ${activeFilter === 'users' ? 'ring-2 ring-blue-500' : ''}`}
                    onClick={() => {
                        console.log('Clicked Total Users');
                        setActiveFilter('users');
                        setSearchQuery(''); // Clear search when switching filters
                    }}
                >
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Total Users</p>
                            <p className="text-2xl font-bold text-slate-900">{totalUsers}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card 
                    className={`cursor-pointer transition-all hover:shadow-md ${activeFilter === 'business_profiles' ? 'ring-2 ring-purple-500' : ''}`}
                    onClick={() => {
                        console.log('Clicked Completed Business Profiles');
                        setActiveFilter('business_profiles');
                        setSearchQuery(''); // Clear search when switching filters
                    }}
                >
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                            <FileText size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Completed Business Profiles</p>
                            <p className="text-2xl font-bold text-slate-900">{completedBusinessProfiles}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card 
                    className={`cursor-pointer transition-all hover:shadow-md ${activeFilter === 'contacts' && searchQuery === 'booked' ? 'ring-2 ring-orange-500' : ''}`}
                    onClick={() => {
                        console.log('Clicked Booked a Call');
                        setActiveFilter('contacts');
                        setSearchQuery('booked'); // Filter to show only booked contacts
                    }}
                >
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
                            <Calendar size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Booked a Call</p>
                            <p className="text-2xl font-bold text-slate-900">{bookedCalls}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Data Table */}
            <Card>
                <div className="p-6 border-b border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-slate-900">
                            {activeFilter === 'users' && 'All Users'}
                            {activeFilter === 'contacts' && 'All Contacts'}
                            {activeFilter === 'business_profiles' && 'Completed Business Profiles'}
                        </h2>
                    </div>
                    {/* Search Bar */}
                    <div className="relative flex items-center gap-2">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <Input
                                type="text"
                                placeholder={
                                    activeFilter === 'users' 
                                        ? 'Search by name or email...' 
                                        : activeFilter === 'contacts'
                                        ? 'Search contacts by name or email...'
                                        : 'Search business profiles...'
                                }
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-10"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <span className="text-lg">×</span>
                                </button>
                            )}
                        </div>
                        {searchQuery && (
                            <span className="text-sm text-slate-500">
                                {filteredData.length} {filteredData.length === 1 ? 'result' : 'results'}
                            </span>
                        )}
                    </div>
                </div>
                <div className="overflow-x-auto">
                    {activeFilter === 'users' && (
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-3">User</th>
                                    <th className="px-6 py-3">Business Info</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Role</th>
                                    <th className="px-6 py-3">Joined</th>
                                    <th className="px-6 py-3">Actions</th>
                                    <th className="px-6 py-3">Delete</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredData.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <Users className="w-12 h-12 text-slate-300" />
                                                <p className="text-slate-500 font-medium">No users found</p>
                                                <p className="text-slate-400 text-sm">Users will appear here once they sign up</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    (filteredData as UserData[]).map((user) => (
                                        <tr key={user.id} data-user-id={user.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-900">{user.email}</div>
                                                {user.name && <div className="text-slate-500 text-xs">{user.name}</div>}
                                            </td>
                                            <td className="px-6 py-4">
                                                {user.business_profiles?.[0] ? (
                                                    <>
                                                        <div className="font-medium text-slate-900">{user.business_profiles[0].business_name}</div>
                                                        {user.business_profiles[0].website_url && (
                                                            <a
                                                                href={user.business_profiles[0].website_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-brand-600 hover:underline text-xs"
                                                            >
                                                                {user.business_profiles[0].website_url}
                                                            </a>
                                                        )}
                                                    </>
                                                ) : (
                                                    <span className="text-slate-400 italic">No profile</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.subscription_status === 'active'
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                    {user.subscription_status || 'free'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <select
                                                        value={user.role || 'user'}
                                                        onChange={(e) => updateUserRole(user.id, e.target.value)}
                                                        disabled={updatingRoles.has(user.id)}
                                                        className={`
                                                            px-3 py-1.5 rounded-md text-xs font-medium border border-slate-200 
                                                            bg-white outline-none cursor-pointer transition-colors
                                                            ${user.role === 'admin'
                                                                ? 'text-purple-700 hover:bg-purple-50'
                                                                : 'text-slate-700 hover:bg-slate-50'
                                                            }
                                                            ${updatingRoles.has(user.id) ? 'opacity-50 cursor-not-allowed' : ''}
                                                            focus:ring-2 focus:ring-brand-500 focus:border-brand-500
                                                        `}
                                                    >
                                                        <option value="user">user</option>
                                                        <option value="admin">admin</option>
                                                    </select>
                                                    {updatingRoles.has(user.id) && (
                                                        <span className="text-xs text-slate-400 animate-pulse">Updating...</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => impersonateUser(user.user_id)}
                                                    disabled={impersonating.has(user.user_id)}
                                                    className="flex items-center gap-2"
                                                >
                                                    <LogIn size={14} />
                                                    {impersonating.has(user.user_id) ? 'Logging in...' : 'Login as User'}
                                                </Button>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDeleteClick('user', user.id, user.email, user.name || undefined)}
                                                    disabled={deleting}
                                                    className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 size={14} />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}

                    {activeFilter === 'contacts' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left min-w-[1000px]">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-4 py-3 whitespace-nowrap">Contact</th>
                                        <th className="px-4 py-3 whitespace-nowrap">Email</th>
                                        <th className="px-4 py-3 whitespace-nowrap">Phone</th>
                                        <th className="px-4 py-3 whitespace-nowrap">Website</th>
                                        <th className="px-4 py-3 whitespace-nowrap">User</th>
                                        <th className="px-4 py-3 whitespace-nowrap">Profile</th>
                                        <th className="px-4 py-3 whitespace-nowrap">Docs</th>
                                        <th className="px-4 py-3 whitespace-nowrap">Website Scan</th>
                                        <th className="px-4 py-3 whitespace-nowrap">Trademark</th>
                                        <th className="px-4 py-3 whitespace-nowrap">Call</th>
                                        <th className="px-4 py-3 whitespace-nowrap">Created</th>
                                        <th className="px-4 py-3 whitespace-nowrap">Delete</th>
                                    </tr>
                                </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredData.length === 0 ? (
                                    <tr>
                                        <td colSpan={12} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <Contact className="w-12 h-12 text-slate-300" />
                                                <p className="text-slate-500 font-medium">
                                                    {searchQuery === 'booked' ? 'No contacts have booked a call yet' : 'No contacts found'}
                                                </p>
                                                <p className="text-slate-400 text-sm">
                                                    {searchQuery === 'booked' 
                                                        ? 'Contacts who schedule a call during onboarding will appear here' 
                                                        : 'Contacts will appear here once forms are submitted'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    (filteredData as ContactData[]).map((contact) => {
                                        const docCount = getContactDocumentCount(contact);
                                        const hasScanned = contactHasScannedWebsite(contact);
                                        const hasTrademark = contactHasTrademarkSearch(contact);
                                        
                                        return (
                                        <tr key={contact.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-4">
                                                <div className="font-medium text-slate-900">{contact.name}</div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="text-slate-900 text-xs">{contact.email}</div>
                                            </td>
                                            <td className="px-4 py-4">
                                                {contact.phone ? (
                                                    <span className="text-slate-900 text-xs">{contact.phone}</span>
                                                ) : (
                                                    <span className="text-slate-400 italic text-xs">No phone</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                {contact.website ? (
                                                    <a
                                                        href={contact.website}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-brand-600 hover:underline text-xs truncate block max-w-[150px]"
                                                        title={contact.website}
                                                    >
                                                        {contact.website}
                                                    </a>
                                                ) : (
                                                    <span className="text-slate-400 italic text-xs">No website</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                {contactHasUser(contact) ? (
                                                    <span className="flex items-center gap-1 text-emerald-600">
                                                        <Check size={16} />
                                                        <span className="text-xs">Yes</span>
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-slate-400">
                                                        <X size={16} />
                                                        <span className="text-xs">No</span>
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                {contactHasProfile(contact) ? (
                                                    <span className="flex items-center gap-1 text-emerald-600">
                                                        <Check size={16} />
                                                        <span className="text-xs">Yes</span>
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-slate-400">
                                                        <X size={16} />
                                                        <span className="text-xs">No</span>
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                {docCount > 0 ? (
                                                    <span className="text-slate-900 font-medium text-xs">{docCount}</span>
                                                ) : (
                                                    <span className="text-slate-400 text-xs">0</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                {hasScanned ? (
                                                    <span className="flex items-center gap-1 text-emerald-600">
                                                        <Check size={16} />
                                                        <span className="text-xs">Yes</span>
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-slate-400">
                                                        <X size={16} />
                                                        <span className="text-xs">No</span>
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                {hasTrademark ? (
                                                    <span className="flex items-center gap-1 text-emerald-600">
                                                        <Check size={16} />
                                                        <span className="text-xs">Yes</span>
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-slate-400">
                                                        <X size={16} />
                                                        <span className="text-xs">No</span>
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                {contact.calendly_booked_at ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="flex items-center gap-1 text-emerald-600">
                                                            <Check size={16} />
                                                            <span className="text-xs">Yes</span>
                                                        </span>
                                                        <span className="text-xs text-slate-400">
                                                            {new Date(contact.calendly_booked_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-slate-400">
                                                        <X size={16} />
                                                        <span className="text-xs">No</span>
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-slate-500 text-xs">
                                                {new Date(contact.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-4">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDeleteClick('contact', contact.id, contact.email, contact.name)}
                                                    disabled={deleting}
                                                    className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 size={14} />
                                                </Button>
                                            </td>
                                        </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                        </div>
                    )}

                    {activeFilter === 'business_profiles' && (
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-3 w-8"></th>
                                    <th className="px-6 py-3">Business Name</th>
                                    <th className="px-6 py-3">Website</th>
                                    <th className="px-6 py-3">User Email</th>
                                    <th className="px-6 py-3">Created</th>
                                    <th className="px-6 py-3">Delete</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredData.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <FileText className="w-12 h-12 text-slate-300" />
                                                <p className="text-slate-500 font-medium">No business profiles found</p>
                                                <p className="text-slate-400 text-sm">Business profiles will appear here once users complete their profile</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    (filteredData as BusinessProfileData[]).map((profile) => {
                                        const user = users.find(u => u.user_id === profile.user_id);
                                        const isExpanded = expandedProfiles.has(profile.id);
                                        
                                        const toggleExpand = () => {
                                            setExpandedProfiles(prev => {
                                                const next = new Set(prev);
                                                if (next.has(profile.id)) {
                                                    next.delete(profile.id);
                                                } else {
                                                    next.add(profile.id);
                                                }
                                                return next;
                                            });
                                        };

                                        return (
                                            <React.Fragment key={profile.id}>
                                                <tr 
                                                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                                                    onClick={toggleExpand}
                                                >
                                                    <td className="px-6 py-4">
                                                        {isExpanded ? (
                                                            <ChevronDown className="text-slate-400" size={20} />
                                                        ) : (
                                                            <ChevronRight className="text-slate-400" size={20} />
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-medium text-slate-900">{profile.business_name || 'Unnamed Business'}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {profile.website_url ? (
                                                            <a
                                                                href={profile.website_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-brand-600 hover:underline text-xs"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                {profile.website_url}
                                                            </a>
                                                        ) : (
                                                            <span className="text-slate-400 italic">No website</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {user ? (
                                                            <div className="text-slate-900">{user.email}</div>
                                                        ) : (
                                                            <span className="text-slate-400 italic">No user linked</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-500">
                                                        {new Date(profile.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDeleteClick('business_profile', profile.id, user?.email, profile.business_name || undefined)}
                                                            disabled={deleting}
                                                            className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        >
                                                            <Trash2 size={14} />
                                                        </Button>
                                                    </td>
                                                </tr>
                                                {isExpanded && (
                                                    <tr>
                                                        <td colSpan={6} className="px-6 py-6 bg-slate-50">
                                                            <div className="space-y-6">
                                                                <h3 className="text-lg font-semibold text-slate-900 mb-4">Complete Business Profile Details</h3>
                                                                
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                    {/* Basic Information */}
                                                                    <div className="space-y-4">
                                                                        <h4 className="font-semibold text-slate-700 border-b border-slate-200 pb-2">Basic Information</h4>
                                                                        <DetailRow label="Business Name" value={profile.business_name} />
                                                                        <DetailRow label="Website" value={profile.website_url} isLink />
                                                                        <DetailRow label="Instagram" value={profile.instagram} />
                                                                        <DetailRow label="Business Type" value={profile.business_type} />
                                                                        <DetailRow label="Team Size" value={profile.team_size} />
                                                                        <DetailRow label="Monthly Clients" value={profile.monthly_clients} />
                                                                        <DetailRow label="Primary Concern" value={profile.primary_concern} />
                                                                        <DetailRow label="Uses Photos" value={profile.uses_photos} isBoolean />
                                                                    </div>

                                                                    {/* Legal Entity Information */}
                                                                    <div className="space-y-4">
                                                                        <h4 className="font-semibold text-slate-700 border-b border-slate-200 pb-2">Legal Entity</h4>
                                                                        <DetailRow label="Legal Entity Name" value={profile.legal_entity_name} />
                                                                        <DetailRow label="Entity Type" value={profile.entity_type} />
                                                                        <DetailRow label="State" value={profile.state} />
                                                                        <DetailRow label="Business Address" value={profile.business_address} />
                                                                        <DetailRow label="Owner Name" value={profile.owner_name} />
                                                                        <DetailRow label="Phone" value={profile.phone} />
                                                                    </div>

                                                                    {/* Business Activities */}
                                                                    <div className="space-y-4">
                                                                        <h4 className="font-semibold text-slate-700 border-b border-slate-200 pb-2">Business Activities</h4>
                                                                        <DetailRow label="Hosts Retreats" value={profile.hosts_retreats} isBoolean />
                                                                        <DetailRow label="Offers Online Courses" value={profile.offers_online_courses} isBoolean />
                                                                        <DetailRow label="Has W-2 Employees" value={profile.has_w2_employees} isBoolean />
                                                                        <DetailRow label="Sells Products" value={profile.sells_products} isBoolean />
                                                                        <DetailRow label="Has Physical Movement" value={profile.has_physical_movement} isBoolean />
                                                                        <DetailRow label="Collects Online" value={profile.collects_online} isBoolean />
                                                                        <DetailRow label="Hires Staff" value={profile.hires_staff} isBoolean />
                                                                        <DetailRow label="Offsite/International" value={profile.is_offsite_or_international} isBoolean />
                                                                    </div>

                                                                    {/* Services & Metadata */}
                                                                    <div className="space-y-4">
                                                                        <h4 className="font-semibold text-slate-700 border-b border-slate-200 pb-2">Services & Metadata</h4>
                                                                        <div>
                                                                            <label className="text-sm font-medium text-slate-600">Services</label>
                                                                            {profile.services && profile.services.length > 0 ? (
                                                                                <div className="mt-1 flex flex-wrap gap-2">
                                                                                    {profile.services.map((service, idx) => (
                                                                                        <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                                                                                            {service}
                                                                                        </span>
                                                                                    ))}
                                                                                </div>
                                                                            ) : (
                                                                                <p className="text-slate-400 italic text-sm mt-1">No services listed</p>
                                                                            )}
                                                                        </div>
                                                                        <DetailRow label="Created" value={new Date(profile.created_at).toLocaleString()} />
                                                                        <DetailRow label="Last Updated" value={new Date(profile.updated_at).toLocaleString()} />
                                                                        {user && (
                                                                            <DetailRow label="Linked User" value={user.email} />
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </Card>

            {/* User List Modal */}
            <Dialog open={showUserListModal} onOpenChange={setShowUserListModal}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>
                            {userListModalType === 'started' 
                                ? 'Users Who Started Onboarding' 
                                : 'Users Who Completed Onboarding'}
                        </DialogTitle>
                        <DialogDescription>
                            {userListModalType === 'started'
                                ? `Showing ${userListData.length} user${userListData.length !== 1 ? 's' : ''} who began the onboarding process`
                                : `Showing ${userListData.length} user${userListData.length !== 1 ? 's' : ''} who completed the onboarding process`}
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="flex-1 overflow-y-auto mt-4">
                        {userListLoading ? (
                            <div className="text-center py-8 text-slate-500">Loading user list...</div>
                        ) : userListData.length === 0 ? (
                            <div className="text-center py-8 text-slate-500">No users found</div>
                        ) : (
                            <div className="space-y-2">
                                {userListData.map((user, index) => {
                                    const matchedUser = user.user_id 
                                        ? users.find(u => u.user_id === user.user_id)
                                        : user.email 
                                        ? users.find(u => u.email.toLowerCase() === user.email?.toLowerCase())
                                        : null;

                                    return (
                                        <div
                                            key={user.session_id || index}
                                            className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <div className="flex-shrink-0">
                                                        <Mail className="text-slate-400" size={18} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium text-slate-900 truncate">
                                                            {user.email || `Session ${user.session_id.substring(0, 8)}...`}
                                                        </div>
                                                        {matchedUser && (
                                                            <div className="text-xs text-slate-500 mt-0.5">
                                                                User ID: {matchedUser.user_id.substring(0, 8)}...
                                                                {matchedUser.name && ` • ${matchedUser.name}`}
                                                            </div>
                                                        )}
                                                        {!matchedUser && user.user_id && (
                                                            <div className="text-xs text-slate-500 mt-0.5">
                                                                User ID: {user.user_id.substring(0, 8)}...
                                                            </div>
                                                        )}
                                                        <div className="text-xs text-slate-400 mt-0.5">
                                                            {new Date(user.created_at).toLocaleString()}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                                                    {matchedUser && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                setShowUserListModal(false);
                                                                setActiveFilter('users');
                                                                setSearchQuery(matchedUser.email);
                                                                // Scroll to the user in the table
                                                                setTimeout(() => {
                                                                    const element = document.querySelector(`[data-user-id="${matchedUser.id}"]`);
                                                                    if (element) {
                                                                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                                        (element as HTMLElement).classList.add('ring-2', 'ring-brand-500');
                                                                        setTimeout(() => {
                                                                            (element as HTMLElement).classList.remove('ring-2', 'ring-brand-500');
                                                                        }, 3000);
                                                                    }
                                                                }, 100);
                                                            }}
                                                        >
                                                            View User
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            if (matchedUser) {
                                                                handleDeleteClick('user', matchedUser.id, matchedUser.email, matchedUser.name || undefined);
                                                            } else {
                                                                // Delete onboarding events for this session
                                                                handleDeleteClick('onboarding_event', user.session_id, user.email || undefined);
                                                            }
                                                        }}
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        <Trash2 size={14} />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {deleteTarget && (
                                <>
                                    This will permanently delete this {deleteTarget.type === 'user' ? 'user' : deleteTarget.type === 'contact' ? 'contact' : deleteTarget.type === 'business_profile' ? 'business profile' : 'onboarding event'}.
                                    {deleteTarget.email && (
                                        <div className="mt-2 font-semibold text-slate-900">
                                            {deleteTarget.email}
                                        </div>
                                    )}
                                    {deleteTarget.name && (
                                        <div className="mt-1 text-slate-600">
                                            {deleteTarget.name}
                                        </div>
                                    )}
                                    <div className="mt-3 text-red-600 font-medium">
                                        This action cannot be undone.
                                    </div>
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            disabled={deleting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {deleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

// Helper component for displaying detail rows
const DetailRow: React.FC<{ 
    label: string; 
    value: string | boolean | null | undefined;
    isBoolean?: boolean;
    isLink?: boolean;
}> = ({ label, value, isBoolean = false, isLink = false }) => {
    const displayValue = () => {
        if (isBoolean) {
            return value === true ? (
                <span className="flex items-center gap-1 text-emerald-600">
                    <Check size={16} />
                    <span>Yes</span>
                </span>
            ) : value === false ? (
                <span className="flex items-center gap-1 text-slate-400">
                    <X size={16} />
                    <span>No</span>
                </span>
            ) : (
                <span className="text-slate-400 italic">Not set</span>
            );
        }
        
        if (value === null || value === undefined || value === '') {
            return <span className="text-slate-400 italic">Not provided</span>;
        }
        
        if (isLink && typeof value === 'string') {
            return (
                <a
                    href={value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-600 hover:underline"
                >
                    {value}
                </a>
            );
        }
        
        return <span className="text-slate-900">{String(value)}</span>;
    };

    return (
        <div className="flex items-start gap-2">
            <label className="text-sm font-medium text-slate-600 min-w-[140px]">{label}:</label>
            <div className="flex-1 text-sm">
                {displayValue()}
            </div>
        </div>
    );
};
