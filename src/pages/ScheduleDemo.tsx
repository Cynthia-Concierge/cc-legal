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

const ScheduleDemo = () => {
  const navigate = useNavigate();
  const [appointmentScheduled, setAppointmentScheduled] = useState(false);
  const [calendarLoaded, setCalendarLoaded] = useState(false);
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

  // Set body and html background to white on mount
  useEffect(() => {
    const originalBodyBackground = document.body.style.backgroundColor;
    const originalHtmlBackground = document.documentElement.style.backgroundColor;
    document.body.style.backgroundColor = '#ffffff';
    document.documentElement.style.backgroundColor = '#ffffff';
    document.body.classList.add('!bg-white');

    const loadTimer = setTimeout(() => {
      setCalendarLoaded(true);
    }, 30000);

    return () => {
      document.body.style.backgroundColor = originalBodyBackground;
      document.documentElement.style.backgroundColor = originalHtmlBackground;
      document.body.classList.remove('!bg-white');
      clearTimeout(loadTimer);
    };
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

      console.log('[ScheduleDemo] GHL appointment booked:', data);
      setAppointmentScheduled(true);

      const eventId = `schedule_${crypto.randomUUID()}`;
      try {
        if (typeof window !== 'undefined' && window.fbq) {
          window.fbq('track', 'Schedule', {
            content_name: 'Demo Scheduled',
            content_category: 'GHL Appointment Confirmed',
            value: 0,
            currency: 'USD'
          }, {
            eventID: eventId
          });
          console.log('[ScheduleDemo] Schedule event tracked with ID:', eventId);
        }
      } catch (error) {
        console.error('[ScheduleDemo] Error tracking Schedule event:', error);
      }

      // Update booking record
      try {
        const formDataStr = sessionStorage.getItem('book_call_form_data');
        let email: string | null = null;
        if (formDataStr) {
          try {
            email = JSON.parse(formDataStr).email;
          } catch (e) {
            console.warn('[ScheduleDemo] Could not parse form data');
          }
        }
        if (!email && data.data?.email) email = data.data.email;

        if (email) {
          const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : '');
          fetch(`${API_BASE_URL}/api/book-call-funnel/update-booking`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, meta_schedule_event_id: eventId }),
          }).catch(err => console.error('[ScheduleDemo] Error updating booking:', err));
        }
      } catch (error) {
        console.error('[ScheduleDemo] Error processing booking:', error);
      }

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
      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight mb-4">
            Step 2: Schedule a Demo
          </h1>
        </div>

        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-6 mb-8 md:mb-12 text-center shadow-sm">
          <p className="text-lg md:text-xl font-bold text-slate-900 mb-2">
            Please allow 30 seconds for the calendar to load.
          </p>
          {!calendarLoaded && (
            <p className="text-sm md:text-base text-slate-700">
              If the calendar has still not loaded after 30 seconds,{' '}
              <a
                href="https://api.leadconnectorhq.com/widget/bookings/chadconnectioncall"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 hover:text-emerald-700 underline font-semibold"
              >
                click here
              </a>
            </p>
          )}
        </div>

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
            title="Schedule a demo"
            id="XAdTLy6ZSKzcQ2VcszVh_schedule"
            onLoad={() => setCalendarLoaded(true)}
          />
        </div>
      </div>
    </div>
  );
};

export default ScheduleDemo;
