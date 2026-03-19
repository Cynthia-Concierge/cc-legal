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

      // Track "Schedule" event in Meta Pixel (client-side)
      const eventId = `schedule_${crypto.randomUUID()}`;
      try {
        if (typeof window !== 'undefined' && window.fbq) {
          window.fbq('track', 'Schedule', {
            content_name: 'Legal Protection Call Scheduled',
            content_category: 'GHL Appointment Confirmed',
            value: 0,
            currency: 'USD'
          }, {
            eventID: eventId
          });
          console.log('[BookCall] Schedule event tracked with ID:', eventId);
        }
      } catch (error) {
        console.error('[BookCall] Error tracking Schedule event:', error);
      }

      // Track Schedule event via Meta CAPI (server-side)
      try {
        const formDataStr = sessionStorage.getItem('book_call_form_data');
        let email: string | null = null;
        let phone: string | null = null;
        let name: string | null = null;

        if (formDataStr) {
          try {
            const formData = JSON.parse(formDataStr);
            email = formData.email;
            phone = formData.phone;
            name = formData.name;
          } catch (e) {
            console.warn('[BookCall] Could not parse form data from sessionStorage');
          }
        }

        // Try GHL sticky contacts data for email
        if (!email && data.data?.email) {
          email = data.data.email;
        }

        if (email) {
          const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : '');

          // Update booking in database
          fetch(`${API_BASE_URL}/api/book-call-funnel/update-booking`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email,
              meta_schedule_event_id: eventId,
            }),
          }).then(r => {
            if (!r.ok) console.error('[BookCall] Failed to update booking');
            else console.log('[BookCall] Booking updated successfully');
          }).catch(err => console.error('[BookCall] Error updating booking:', err));

          // Track Schedule event via Meta CAPI
          if (name && phone) {
            const nameParts = name.split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';

            // Read fbc/fbp cookies for attribution
            const getCookie = (n: string): string | null => {
              const match = document.cookie.match(new RegExp('(?:^|; )' + n + '=([^;]*)'));
              return match ? decodeURIComponent(match[1]) : null;
            };
            const fbc = getCookie('_fbc');
            const fbp = getCookie('_fbp');

            fetch(`${API_BASE_URL}/api/track-meta-schedule`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email,
                phone,
                firstName,
                lastName,
                eventSourceUrl: window.location.href,
                eventId,
                fbc: fbc || undefined,
                fbp: fbp || undefined,
              }),
            }).then(r => {
              if (!r.ok) console.error('[BookCall] Failed to track schedule in Meta CAPI');
              else console.log('[BookCall] Schedule tracked in Meta CAPI successfully');
            }).catch(err => console.error('[BookCall] Error tracking schedule in Meta CAPI:', err));
          }
        }
      } catch (error) {
        console.error('[BookCall] Error processing booking:', error);
      }

      // Redirect to thank you page after 2 seconds
      setTimeout(() => {
        navigate('/book-thank-you');
      }, 2000);
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [navigate]);

  return (
    <div className="bg-white min-h-screen w-full" style={{ backgroundColor: '#ffffff' }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 lg:p-8">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl lg:text-3xl font-bold mb-2 text-center">Schedule Your Free Legal Protection Call</h1>
          <p className="text-emerald-50 text-center">Choose a time that works for you. No pressure - 15 minutes - See if this is a fit</p>
        </div>
      </div>

      {/* GHL Booking Widget */}
      <div className="relative w-full bg-white" style={{ backgroundColor: '#ffffff' }}>
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
                Redirecting you to thank you page...
              </p>
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600 mx-auto"></div>
            </div>
          </div>
        )}

        <iframe
          src={GHL_BOOKING_URL}
          width="100%"
          style={{ width: '100%', border: 'none', overflow: 'hidden', display: 'block', minHeight: '1000px', backgroundColor: '#ffffff' }}
          scrolling="no"
          title="Schedule a call"
          id="XAdTLy6ZSKzcQ2VcszVh_1773945607822"
        />
      </div>
    </div>
  );
};

export default BookCall;
