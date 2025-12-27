import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Calendar, ArrowRight, Users, Clock, CheckCircle2, Sparkles } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface LawyerBookingCardProps {
    onComplete: () => void;
    email?: string; // Optional email for tracking Calendly bookings
}

interface BookingStats {
    bookingsThisWeek: number;
    averageResponseTime: string;
    nextAvailable: string;
}

declare global {
    interface Window {
        Calendly: any;
    }
}

export const LawyerBookingCard: React.FC<LawyerBookingCardProps> = ({
    onComplete,
    email
}) => {
    const widgetRef = useRef<HTMLDivElement>(null);
    const [scriptLoaded, setScriptLoaded] = useState(false);
    const [appointmentScheduled, setAppointmentScheduled] = useState(false);
    const [showPreBooking, setShowPreBooking] = useState(true);
    const [bookingStats, setBookingStats] = useState<BookingStats>({
        bookingsThisWeek: 127,
        averageResponseTime: '1 hour',
        nextAvailable: 'Tomorrow at 2pm'
    });

    // Load Calendly script
    useEffect(() => {
        // Check if immediately available
        if (window.Calendly && window.Calendly.initInlineWidget) {
            setScriptLoaded(true);
            return;
        }

        const scriptId = 'calendly-script';
        let script = document.getElementById(scriptId) as HTMLScriptElement;

        const onScriptLoad = () => {
            // Wait a bit for Calendly to be fully initialized
            const checkCalendly = setInterval(() => {
                if (window.Calendly && window.Calendly.initInlineWidget) {
                    setScriptLoaded(true);
                    clearInterval(checkCalendly);
                }
            }, 100);

            // Timeout after 5 seconds
            setTimeout(() => {
                clearInterval(checkCalendly);
                if (window.Calendly && window.Calendly.initInlineWidget) {
                    setScriptLoaded(true);
                } else {
                    console.error('[Calendly] Script loaded but Calendly object not available');
                }
            }, 5000);
        };

        if (!script) {
            script = document.createElement('script');
            script.id = scriptId;
            script.src = 'https://assets.calendly.com/assets/external/widget.js';
            script.async = true;
            script.addEventListener('load', onScriptLoad);
            script.addEventListener('error', () => {
                console.error('[Calendly] Failed to load script');
            });
            document.head.appendChild(script);
        } else {
            // If script exists but not loaded, listen for load
            if (script.complete || script.readyState === 'complete') {
                onScriptLoad();
            } else {
                script.addEventListener('load', onScriptLoad);
            }
        }

        // Fallback: poll for window.Calendly in case onload missed or script already loaded
        const intervalId = setInterval(() => {
            if (window.Calendly && window.Calendly.initInlineWidget) {
                setScriptLoaded(true);
                clearInterval(intervalId);
            }
        }, 500);

        // Cleanup after 10 seconds
        const timeoutId = setTimeout(() => {
            clearInterval(intervalId);
        }, 10000);

        return () => {
            script?.removeEventListener('load', onScriptLoad);
            clearInterval(intervalId);
            clearTimeout(timeoutId);
        };
    }, []);

    // Initialize widget
    useEffect(() => {
        if (!scriptLoaded || !widgetRef.current) return;

        // Wait a bit to ensure Calendly is fully ready
        const initWidget = () => {
            if (!window.Calendly || !window.Calendly.initInlineWidget) {
                console.warn('[Calendly] Calendly object not ready, retrying...');
                setTimeout(initWidget, 200);
                return;
            }

            // Clear any existing widget content
            widgetRef.current!.innerHTML = '';

            // Create container for widget
            const widgetDiv = document.createElement('div');
            widgetDiv.className = 'calendly-inline-widget';
            widgetDiv.style.minWidth = '320px';
            widgetDiv.style.height = '700px';
            widgetDiv.style.width = '100%';

            widgetRef.current!.appendChild(widgetDiv);

            // Initialize Calendly with the new URL
            try {
                window.Calendly.initInlineWidget({
                    url: 'https://calendly.com/chad-consciouscounsel/connection-call-with-chad-simpler?primary_color=7da69f',
                    parentElement: widgetDiv,
                });
                console.log('[Calendly] Widget initialized successfully');
            } catch (error) {
                console.error('[Calendly] Error initializing widget:', error);
            }
        };

        // Small delay to ensure script is fully loaded
        const timeoutId = setTimeout(initWidget, 100);

        return () => {
            clearTimeout(timeoutId);
            if (widgetRef.current) {
                widgetRef.current.innerHTML = '';
            }
        };
    }, [scriptLoaded]);

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
                // Use default stats if API fails
            }
        };
        fetchBookingStats();
    }, []);

    // Listen for Calendly events to detect when appointment is scheduled
    useEffect(() => {
        // Function to check if message is from Calendly
        const isCalendlyEvent = (e: MessageEvent) => {
            return e.origin === "https://calendly.com" && 
                   e.data?.event && 
                   e.data.event.startsWith("calendly.");
        };

        // Event handler for Calendly messages
        const handleCalendlyMessage = (e: MessageEvent) => {
            if (isCalendlyEvent(e)) {
                // Detect when an event is scheduled
                if (e.data.event === "calendly.event_scheduled") {
                    console.log('[Calendly] Appointment scheduled:', e.data.payload);
                    
                    // Update contact record in database to track booking
                    const updateContactBooking = async () => {
                        try {
                            // Get user email from prop, or try to get from auth
                            let userEmail = email;
                            
                            if (!userEmail && supabase) {
                                const { data: { user } } = await supabase.auth.getUser();
                                userEmail = user?.email || undefined;
                            }
                            
                            if (userEmail) {
                                // Call server endpoint to update contact booking status
                                // This uses service role key to bypass RLS if needed
                                const serverUrl = import.meta.env.VITE_SERVER_URL || '';
                                const response = await fetch(`${serverUrl}/api/contacts/update-calendly-booking`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ email: userEmail.trim().toLowerCase() })
                                });
                                
                                if (response.ok) {
                                    console.log('[Calendly] ✅ Contact record updated with booking timestamp');
                                } else {
                                    const errorText = await response.text();
                                    console.warn('[Calendly] Failed to update contact booking status:', errorText);
                                }
                            } else {
                                console.warn('[Calendly] No email available to update contact record');
                            }
                        } catch (err) {
                            console.error('[Calendly] Error updating contact booking:', err);
                            // Don't block the flow if this fails
                        }
                    };
                    
                    // Update database (fire and forget)
                    updateContactBooking();
                    
                    // Show success state
                    setAppointmentScheduled(true);
                    
                    // Automatically redirect to dashboard after a short delay
                    // This gives Calendly time to show the confirmation message
                    setTimeout(() => {
                        console.log('[Calendly] Redirecting to dashboard...');
                        onComplete();
                    }, 3000); // 3 second delay to show confirmation
                }
            }
        };

        // Add event listener
        window.addEventListener("message", handleCalendlyMessage);

        // Cleanup
        return () => {
            window.removeEventListener("message", handleCalendlyMessage);
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
                        {/* Social Proof & Scarcity Stats */}
                        <div className="space-y-4 mb-8">
                            <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-6 border border-slate-200 shadow-sm">
                                <div className="flex items-center justify-center gap-2 mb-4">
                                    <Sparkles className="w-5 h-5 text-brand-600" />
                                    <span className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                                        Popular This Week
                                    </span>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Bookings This Week */}
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

                                    {/* Average Response Time */}
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

                                    {/* Next Available */}
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

                            {/* Trust Indicators */}
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

                        {/* CTA Button */}
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
                        {!scriptLoaded && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
                            </div>
                        )}
                        {appointmentScheduled && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/95 z-10 backdrop-blur-sm">
                                <div className="text-center p-6">
                                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Calendar size={32} />
                                    </div>
                                    <h3 className="text-xl font-semibold text-slate-900 mb-2">
                                        Appointment Scheduled! 🎉
                                    </h3>
                                    <p className="text-slate-600 mb-4">
                                        Redirecting you to your dashboard...
                                    </p>
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600 mx-auto"></div>
                                </div>
                            </div>
                        )}
                        <div ref={widgetRef} />
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
