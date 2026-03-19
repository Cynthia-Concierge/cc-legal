import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { Card } from './ui/Card';
import { supabase } from '../../lib/supabase';

const GHL_BOOKING_URL = 'https://api.leadconnectorhq.com/widget/booking/XAdTLy6ZSKzcQ2VcszVh';

interface CalendlyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CalendlyModal: React.FC<CalendlyModalProps> = ({ isOpen, onClose }) => {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const hasTrackedBooking = useRef(false);

  // Load GHL form embed script
  useEffect(() => {
    const existing = document.querySelector('script[src="https://link.msgsndr.com/js/form_embed.js"]');
    if (existing) {
      setScriptLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://link.msgsndr.com/js/form_embed.js';
    script.type = 'text/javascript';
    script.onload = () => setScriptLoaded(true);
    document.body.appendChild(script);
  }, []);

  // Listen for GHL booking events
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

      console.log('[GHL Modal] Appointment booked:', data);

      // Update contact record
      try {
        let userEmail: string | undefined;

        if (supabase) {
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
            console.log('[GHL Modal] Contact record updated with booking timestamp');
          } else {
            console.warn('[GHL Modal] Failed to update contact booking status');
          }
        }
      } catch (err) {
        console.error('[GHL Modal] Error updating contact booking:', err);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
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

        {/* GHL Booking Widget */}
        <div className="flex-1 overflow-y-auto bg-white relative">
          {!scriptLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto mb-4"></div>
                <p className="text-slate-600">Loading calendar...</p>
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
      </Card>
    </div>
  );
};
