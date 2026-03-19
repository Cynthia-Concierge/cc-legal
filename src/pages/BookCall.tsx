import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar } from 'lucide-react';

// Declare fbq for TypeScript
declare global {
  interface Window {
    fbq: (action: string, eventName: string, data?: any, options?: any) => void;
  }
}

const GHL_BOOKING_URL = 'https://api.leadconnectorhq.com/widget/booking/XAdTLy6ZSKzcQ2VcszVh';

const BookCall = () => {
  const navigate = useNavigate();
  const [appointmentScheduled, setAppointmentScheduled] = useState(false);
  const hasTrackedBooking = useRef(false);

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

  // Set body and html background to white on mount + Track page view
  useEffect(() => {
    const originalBodyBackground = document.body.style.backgroundColor;
    const originalHtmlBackground = document.documentElement.style.backgroundColor;
    document.body.style.backgroundColor = '#ffffff';
    document.documentElement.style.backgroundColor = '#ffffff';
    document.body.classList.add('!bg-white');

    try {
      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'PageView', {
          content_name: 'GHL Booking Page',
          content_category: 'GHL Booking Flow'
        });
        console.log('[BookCall] PageView tracked');
      }
    } catch (error) {
      console.error('[BookCall] Error tracking PageView:', error);
    }

    return () => {
      document.body.style.backgroundColor = originalBodyBackground;
      document.documentElement.style.backgroundColor = originalHtmlBackground;
      document.body.classList.remove('!bg-white');
    };
  }, []);

  // Listen for GHL booking widget events
  useEffect(() => {
    const handleMessage = async (e: MessageEvent) => {
      const data = typeof e.data === 'string' ? (() => { try { return JSON.parse(e.data); } catch { return null; } })() : e.data;
      if (!data) return;

      // Detect GHL booking confirmation
      const isBookingEvent =
        data.action === 'set-sticky-contacts' ||
        (typeof e.data === 'string' && e.data.includes('booked')) ||
        (data.type === 'booked') ||
        (data.event === 'booked');

      if (!isBookingEvent || hasTrackedBooking.current) return;
      hasTrackedBooking.current = true;

      console.log('[BookCall] GHL appointment booked:', data);
      setAppointmentScheduled(true);

      // Save any GHL contact data for the thank you page tracking
      const ghlContact: Record<string, string> = {};
      if (data.data?.email) ghlContact.email = data.data.email;
      if (data.data?.phone) ghlContact.phone = data.data.phone;
      if (data.data?.first_name) ghlContact.firstName = data.data.first_name;
      if (data.data?.last_name) ghlContact.lastName = data.data.last_name;
      if (data.data?.name) ghlContact.name = data.data.name;
      if (Object.keys(ghlContact).length > 0) {
        sessionStorage.setItem('ghl_booking_contact', JSON.stringify(ghlContact));
      }

      // Redirect to thank you page (tracking fires there)
      setTimeout(() => {
        navigate('/book-thank-you');
      }, 1500);
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [navigate]);

  return (
    <div className="bg-slate-50 min-h-screen w-full">
      <div className="max-w-2xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-2">Schedule Your Free Call</h1>
          <p className="text-slate-600">No pressure &middot; 15 minutes &middot; See if this is a fit</p>
        </div>

        {/* GHL Booking Widget */}
        <div className="relative bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          {appointmentScheduled && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/95 z-30 backdrop-blur-sm rounded-2xl">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar size={32} />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  Appointment Scheduled!
                </h3>
                <p className="text-slate-600 mb-4">
                  Redirecting you to thank you page...
                </p>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600 mx-auto"></div>
              </div>
            </div>
          )}

          <iframe
            src={GHL_BOOKING_URL}
            width="100%"
            style={{ width: '100%', border: 'none', overflow: 'hidden', display: 'block', minHeight: '700px', backgroundColor: '#ffffff' }}
            scrolling="no"
            title="Schedule a call"
            id="XAdTLy6ZSKzcQ2VcszVh_1773945607822"
          />
        </div>
      </div>
    </div>
  );
};

export default BookCall;
