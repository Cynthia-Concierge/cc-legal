import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { Card } from './ui/Card';
import { supabase } from '../../lib/supabase';

interface CalendlyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

declare global {
  interface Window {
    Calendly: any;
  }
}

export const CalendlyModal: React.FC<CalendlyModalProps> = ({ isOpen, onClose }) => {
  const widgetRef = useRef<HTMLDivElement>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Load Calendly script
  useEffect(() => {
    // Check if immediately available
    if (window.Calendly) {
      setScriptLoaded(true);
      return;
    }

    const scriptId = 'calendly-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    const onScriptLoad = () => {
      setScriptLoaded(true);
    };

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      script.addEventListener('load', onScriptLoad);
      document.body.appendChild(script);
    } else {
      // If script exists but not loaded, listen for load
      script.addEventListener('load', onScriptLoad);
    }

    // Fallback: poll for window.Calendly in case onload missed or script already loaded
    const intervalId = setInterval(() => {
      if (window.Calendly) {
        setScriptLoaded(true);
        clearInterval(intervalId);
      }
    }, 500);

    return () => {
      script?.removeEventListener('load', onScriptLoad);
      clearInterval(intervalId);
    };
  }, []);

  // Initialize widget when modal opens and script is loaded
  useEffect(() => {
    if (!isOpen || !scriptLoaded || !widgetRef.current) return;

    // Clear any existing widget content
    widgetRef.current.innerHTML = '';

    // Create container for widget
    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'calendly-inline-widget';
    widgetDiv.style.minWidth = '320px';
    widgetDiv.style.height = '100%';
    widgetDiv.style.width = '100%'; // Ensure full width

    widgetRef.current.appendChild(widgetDiv);

    // Initialize Calendly
    try {
      window.Calendly.initInlineWidget({
        url: 'https://calendly.com/chad-consciouscounsel/connection-call-with-chad',
        parentElement: widgetDiv,
      });
    } catch (error) {
      console.error('Error initializing Calendly widget:', error);
    }

    return () => {
      if (widgetRef.current) {
        widgetRef.current.innerHTML = '';
      }
    };
  }, [isOpen, scriptLoaded]);

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
              // Try to get email from multiple sources:
              // 1. Authenticated user's email (most reliable)
              // 2. Calendly event payload (fallback if user not logged in)
              let userEmail: string | undefined;
              
              if (supabase) {
                const { data: { user } } = await supabase.auth.getUser();
                userEmail = user?.email || undefined;
              }
              
              // Fallback: Try to get email from Calendly event payload
              if (!userEmail && e.data.payload?.invitee?.email) {
                userEmail = e.data.payload.invitee.email;
                console.log('[Calendly] Using email from Calendly event payload:', userEmail);
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
                console.warn('[Calendly] No email available to update contact record (user may not be logged in and email not in payload)');
              }
            } catch (err) {
              console.error('[Calendly] Error updating contact booking:', err);
              // Don't block the flow if this fails
            }
          };
          
          // Update database (fire and forget)
          updateContactBooking();
        }
      }
    };

    // Add event listener
    window.addEventListener("message", handleCalendlyMessage);

    // Cleanup
    return () => {
      window.removeEventListener("message", handleCalendlyMessage);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl bg-white border-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-semibold text-slate-900">Schedule a Call</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Calendly Widget */}
        <div className="flex-1 overflow-y-auto bg-white relative">
          {!scriptLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto mb-4"></div>
                <p className="text-slate-600">Loading calendar...</p>
              </div>
            </div>
          )}
          <div
            ref={widgetRef}
            className="w-full h-[700px] min-h-[500px]"
          />
        </div>
      </Card>
    </div>
  );
};
