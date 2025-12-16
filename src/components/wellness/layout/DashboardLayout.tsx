import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Home, FileText, Calendar, User, Menu, X, LogOut, Settings, Globe, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/wellness/ui/Button';

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        if (supabase) {
            await supabase.auth.signOut();
        }
        localStorage.removeItem('wellness_onboarding_answers');
        navigate('/wellness/login');
    };

    const menuItems = [
        { icon: <Home size={20} />, label: 'Overview', path: '/wellness/dashboard' },
        { icon: <FileText size={20} />, label: 'Your Documents', path: '/wellness/dashboard/documents' },
        { icon: <Globe size={20} />, label: 'Website Compliance', path: '/wellness/dashboard/website-compliance' },
        { icon: <Search size={20} />, label: 'Trademark Scan', path: '/wellness/dashboard/trademark-scan' },
        // { icon: <Calendar size={20} />, label: 'Compliance', path: '/wellness/dashboard/compliance' },
        { icon: <User size={20} />, label: 'My Business Profile', path: '/wellness/dashboard/profile' },
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
        fixed top-0 left-0 h-screen bg-white border-r border-slate-200 w-64 z-50 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
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
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            {/* Mobile Header - Simplified */}
            <div className="md:hidden h-14 bg-white border-b border-slate-200 flex items-center justify-center px-4 sticky top-0 z-30">
                <div className="flex items-center gap-2 text-brand-700">
                    <Shield className="fill-current" size={20} />
                    <span className="font-bold text-lg tracking-tight">Conscious Counsel</span>
                </div>
                {/* Optional: Add settings or logout here if needed, keeping it clean for now */}
            </div>

            {/* Main Content */}
            <div className="md:ml-64 min-h-screen transition-all duration-300">
                <main className="p-4 md:p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
                    {children}
                </main>
            </div>

            <MobileBottomNav />
        </div>
    );
};
