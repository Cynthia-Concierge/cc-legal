import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Calendar, ArrowRight, Users, Clock, CheckCircle2, Sparkles } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

const GHL_BOOKING_URL = 'https://api.leadconnectorhq.com/widget/booking/XAdTLy6ZSKzcQ2VcszVh';

interface LawyerBookingCardProps {
    onComplete: () => void;
    email?: string;
}

interface BookingStats {
    bookingsThisWeek: number;
    averageResponseTime: string;
    nextAvailable: string;
}

export const LawyerBookingCard: React.FC<LawyerBookingCardProps> = ({
    onComplete,
    email
}) => {
    const [appointmentScheduled, setAppointmentScheduled] = useState(false);
    const [showPreBooking, setShowPreBooking] = useState(true);
    const hasTrackedBooking = useRef(false);
    const [bookingStats, setBookingStats] = useState<BookingStats>({
        bookingsThisWeek: 127,
        averageResponseTime: '1 hour',
        nextAvailable: 'Tomorrow at 2pm'
    });

    // Load GHL form embed script
    useEffect(() => {
        const existing = document.querySelector('script[src="https://link.msgsndr.com/js/form_embed.js"]');
        if (!existing) {
            const script = document.createElement('script');
            script.src = 'https://link.msgsndr.com/js/form_embed.js';
            script.type = 'text/javascript';
            document.body.appendChild(script);
        }
    }, []);

    // Fetch booking statistics
    useEffect(() => {
        const fetchBookingStats = async () => {
            try {
                const serverUrl = import.meta.env.VITE_SERVER_URL || '';
                const response = await fetch(`${serverUrl}/api/stats/booking-info`);
                if (response.ok) {
                    const data = await response.json();
                    setBookingStats({
                        bookingsThisWeek: data.bookingsThisWeek || 127,
                        averageResponseTime: data.averageResponseTime || '2 hours',
                        nextAvailable: data.nextAvailable || 'Tomorrow at 2pm'
                    });
                }
            } catch (error) {
                console.warn('[Booking Stats] Failed to fetch, using defaults:', error);
            }
        };
        fetchBookingStats();
    }, []);

    // Listen for GHL booking widget events
    useEffect(() => {
        const handleMessage = async (e: MessageEvent) => {
            const data = typeof e.data === 'string' ? (() => { try { return JSON.parse(e.data); } catch { return null; } })() : e.data;
            if (!data) return;

            const isBookingEvent =
                data.action === 'set-sticky-contacts' ||
                (typeof e.data === 'string' && e.data.includes('booked')) ||
                (data.type === 'booked') ||
                (data.event === 'booked');

            if (!isBookingEvent || hasTrackedBooking.current) return;
            hasTrackedBooking.current = true;

            console.log('[GHL Booking] Appointment booked:', data);

            // Update contact record
            const updateContactBooking = async () => {
                try {
                    let userEmail = email;

                    if (!userEmail && supabase) {
                        const { data: { user } } = await supabase.auth.getUser();
                        userEmail = user?.email || undefined;
                    }

                    if (!userEmail && data.data?.email) {
                        userEmail = data.data.email;
                    }

                    if (userEmail) {
                        const serverUrl = import.meta.env.VITE_SERVER_URL || '';
                        const response = await fetch(`${serverUrl}/api/contacts/update-calendly-booking`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email: userEmail.trim().toLowerCase() })
                        });

                        if (response.ok) {
                            console.log('[GHL Booking] Contact record updated with booking timestamp');
                        } else {
                            console.warn('[GHL Booking] Failed to update contact booking status');
                        }
                    }
                } catch (err) {
                    console.error('[GHL Booking] Error updating contact booking:', err);
                }
            };

            updateContactBooking();
            setAppointmentScheduled(true);

            setTimeout(() => {
                console.log('[GHL Booking] Redirecting to dashboard...');
                onComplete();
            }, 3000);
        };

        window.addEventListener("message", handleMessage);
        return () => {
            window.removeEventListener("message", handleMessage);
        };
    }, [onComplete, email]);

    // Pre-booking screen with social proof and scarcity
    if (showPreBooking) {
        return (
            <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Card className="bg-white shadow-xl border-slate-100 overflow-hidden">
                    <div className="bg-gradient-to-br from-brand-50 via-emerald-50 to-teal-50 p-8 border-b border-brand-100 text-center">
                        <div className="w-20 h-20 bg-white text-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg border-2 border-brand-200">
                            <Calendar size={40} />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 mb-3">
                            Review your results with an expert
                        </h2>
                        <p className="text-slate-600 text-lg max-w-md mx-auto">
                            A short call to confirm everything looks right and make final adjustments.
                        </p>
                    </div>

                    <CardContent className="p-8">
                        <div className="space-y-4 mb-8">
                            <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-6 border border-slate-200 shadow-sm">
                                <div className="flex items-center justify-center gap-2 mb-4">
                                    <Sparkles className="w-5 h-5 text-brand-600" />
                                    <span className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                                        Popular This Week
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="flex flex-col items-center p-4 bg-white rounded-lg border border-slate-100 shadow-sm">
                                        <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center mb-3">
                                            <Users className="w-6 h-6 text-brand-600" />
                                        </div>
                                        <div className="text-3xl font-bold text-slate-900 mb-1">
                                            {bookingStats.bookingsThisWeek}
                                        </div>
                                        <div className="text-xs text-slate-600 text-center">
                                            people booked<br />this week
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center p-4 bg-white rounded-lg border border-slate-100 shadow-sm">
                                        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
                                            <Clock className="w-6 h-6 text-emerald-600" />
                                        </div>
                                        <div className="text-3xl font-bold text-slate-900 mb-1">
                                            {bookingStats.averageResponseTime}
                                        </div>
                                        <div className="text-xs text-slate-600 text-center">
                                            average<br />response time
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center p-4 bg-white rounded-lg border border-slate-100 shadow-sm">
                                        <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mb-3">
                                            <CheckCircle2 className="w-6 h-6 text-teal-600" />
                                        </div>
                                        <div className="text-lg font-bold text-slate-900 mb-1 leading-tight">
                                            {bookingStats.nextAvailable.split(' ')[0]}
                                        </div>
                                        <div className="text-xs text-slate-600 text-center">
                                            {bookingStats.nextAvailable.split(' ').slice(1).join(' ')}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-center gap-6 text-sm text-slate-600">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    <span>Free consultation</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    <span>No obligation</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    <span>15-30 minutes</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Button
                                onClick={() => setShowPreBooking(false)}
                                className="w-full bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-700 hover:to-emerald-700 text-white text-lg py-6 shadow-lg shadow-brand-500/30"
                                size="lg"
                            >
                                <Calendar className="mr-2 h-5 w-5" />
                                Book Your Free Call Now
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={onComplete}
                                className="w-full text-slate-500 hover:text-slate-700"
                            >
                                Skip / I'll Book Later <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="bg-white shadow-xl border-slate-100 overflow-hidden">
                <div className="bg-brand-50 p-6 border-b border-brand-100 text-center">
                    <div className="w-16 h-16 bg-white text-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-brand-100">
                        <Calendar size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">
                        Review your results with an expert
                    </h2>
                    <p className="text-slate-600 mt-2">
                        A short call to confirm everything looks right and make final adjustments.
                    </p>
                </div>

                <CardContent className="p-0">
                    <div className="min-h-[700px] bg-slate-50 relative">
                        {appointmentScheduled && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/95 z-30 backdrop-blur-sm">
                                <div className="text-center p-6">
                                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Calendar size={32} />
                                    </div>
                                    <h3 className="text-xl font-semibold text-slate-900 mb-2">
                                        Appointment Scheduled!
                                    </h3>
                                    <p className="text-slate-600 mb-4">
                                        Redirecting you to your dashboard...
                                    </p>
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600 mx-auto"></div>
                                </div>
                            </div>
                        )}
                        <iframe
                            src={GHL_BOOKING_URL}
                            width="100%"
                            style={{ width: '100%', border: 'none', overflow: 'hidden', minHeight: '700px' }}
                            scrolling="no"
                            title="Schedule a call"
                            className="w-full min-h-[700px]"
                        />
                    </div>

                    <div className="p-6 bg-white border-t border-slate-100 flex justify-end">
                        <Button
                            variant="outline"
                            onClick={onComplete}
                            className="text-slate-500 hover:text-slate-700"
                        >
                            Skip / I'll Book Later <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
