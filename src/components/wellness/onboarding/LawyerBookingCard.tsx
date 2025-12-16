import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Calendar, ArrowRight } from 'lucide-react';

interface LawyerBookingCardProps {
    onComplete: () => void;
}

declare global {
    interface Window {
        Calendly: any;
    }
}

export const LawyerBookingCard: React.FC<LawyerBookingCardProps> = ({
    onComplete
}) => {
    const widgetRef = useRef<HTMLDivElement>(null);
    const [scriptLoaded, setScriptLoaded] = useState(false);

    // Load Calendly script
    useEffect(() => {
        const scriptId = 'calendly-script';
        let script = document.getElementById(scriptId) as HTMLScriptElement;

        if (!script) {
            script = document.createElement('script');
            script.id = scriptId;
            script.src = 'https://assets.calendly.com/assets/external/widget.js';
            script.async = true;
            script.onload = () => setScriptLoaded(true);
            document.body.appendChild(script);
        } else {
            if (window.Calendly) {
                setScriptLoaded(true);
            } else {
                script.onload = () => setScriptLoaded(true);
            }
        }
    }, []);

    // Initialize widget
    useEffect(() => {
        if (scriptLoaded && widgetRef.current) {
            // Clear existing
            widgetRef.current.innerHTML = '';

            const widgetDiv = document.createElement('div');
            widgetDiv.className = 'calendly-inline-widget';
            widgetDiv.setAttribute('data-url', 'https://calendly.com/chad-consciouscounsel/connection-call-with-chad');
            widgetDiv.style.minWidth = '320px';
            widgetDiv.style.height = '600px'; // Slightly shorter for card

            widgetRef.current.appendChild(widgetDiv);

            if (window.Calendly && window.Calendly.initInlineWidget) {
                try {
                    window.Calendly.initInlineWidget({
                        url: 'https://calendly.com/chad-consciouscounsel/connection-call-with-chad',
                        parentElement: widgetDiv,
                    });
                } catch (error) {
                    console.error('Error initializing Calendly widget:', error);
                }
            }
        }
    }, [scriptLoaded]);

    return (
        <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="bg-white shadow-xl border-slate-100 overflow-hidden">
                <div className="bg-brand-50 p-6 border-b border-brand-100 text-center">
                    <div className="w-16 h-16 bg-white text-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-brand-100">
                        <Calendar size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">
                        Schedule Your Lawyer Review Mode
                    </h2>
                    <p className="text-slate-600 mt-2">
                        Finalize your tailored legal protection plan with a quick call.
                    </p>
                </div>

                <CardContent className="p-0">
                    <div className="min-h-[600px] bg-slate-50 relative">
                        {!scriptLoaded && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
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
