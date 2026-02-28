import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar } from 'lucide-react';

// Declare fbq for TypeScript
declare global {
  interface Window {
    fbq: (action: string, eventName: string, data?: any, options?: any) => void;
  }
}

const ScheduleDemo = () => {
  const navigate = useNavigate();
  const [appointmentScheduled, setAppointmentScheduled] = useState(false);
  const [calendarLoaded, setCalendarLoaded] = useState(false);

  // Calendly URL - using iframe method which is 100% reliable
  // background_color=ffffff sets the widget background to white
  const calendlyUrl = 'https://calendly.com/chad-consciouscounsel/connection-call-with-chad?primary_color=7da69f&background_color=ffffff';

  // Set body and html background to white on mount
  useEffect(() => {
    // Store original backgrounds
    const originalBodyBackground = document.body.style.backgroundColor;
    const originalHtmlBackground = document.documentElement.style.backgroundColor;

    // Force white background on both html and body
    document.body.style.backgroundColor = '#ffffff';
    document.documentElement.style.backgroundColor = '#ffffff';

    // Also add to body classes to override Tailwind
    document.body.classList.add('!bg-white');

    // Track calendar load time
    const loadTimer = setTimeout(() => {
      setCalendarLoaded(true);
    }, 30000); // 30 seconds

    // Cleanup: restore original backgrounds on unmount
    return () => {
      document.body.style.backgroundColor = originalBodyBackground;
      document.documentElement.style.backgroundColor = originalHtmlBackground;
      document.body.classList.remove('!bg-white');
      clearTimeout(loadTimer);
    };
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
    const handleCalendlyMessage = async (e: MessageEvent) => {
      if (isCalendlyEvent(e)) {
        // Detect when an event is scheduled
        if (e.data.event === "calendly.event_scheduled") {
          console.log('[ScheduleDemo] Appointment scheduled:', e.data.payload);
          setAppointmentScheduled(true);

          // Track "Schedule" event in Meta Pixel when appointment is confirmed
          const eventId = `schedule_${crypto.randomUUID()}`;
          try {
            if (typeof window !== 'undefined' && window.fbq) {
              window.fbq('track', 'Schedule', {
                content_name: 'Demo Scheduled',
                content_category: 'Calendly Appointment Confirmed',
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

          // Update book_a_call_funnel record with booking information
          try {
            // Get email from form data stored in sessionStorage
            const formDataStr = sessionStorage.getItem('book_call_form_data');
            let email = null;
            
            if (formDataStr) {
              try {
                const formData = JSON.parse(formDataStr);
                email = formData.email;
              } catch (e) {
                console.warn('[ScheduleDemo] Could not parse form data from sessionStorage');
              }
            }

            // Also try to get email from Calendly payload
            if (!email && e.data.payload?.invitee?.email) {
              email = e.data.payload.invitee.email;
            }

            if (email) {
              const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : '');
              const calendlyEventUri = e.data.payload?.event?.uri || null;

              const response = await fetch(`${API_BASE_URL}/api/book-call-funnel/update-booking`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  email: email,
                  calendly_event_uri: calendlyEventUri,
                  meta_schedule_event_id: eventId,
                }),
              });

              if (!response.ok) {
                const errorText = await response.text();
                console.error('[ScheduleDemo] Failed to update booking in book_a_call_funnel:', errorText);
              } else {
                const result = await response.json();
                console.log('[ScheduleDemo] Booking updated in book_a_call_funnel:', result);
              }
            } else {
              console.warn('[ScheduleDemo] No email found to update book_a_call_funnel record');
            }
          } catch (error) {
            console.error('[ScheduleDemo] Error updating booking in book_a_call_funnel:', error);
            // Don't block navigation if update fails
          }

          // Redirect to thank you page after 2 seconds
          setTimeout(() => {
            navigate('/book-thank-you');
          }, 2000);
        }
      }
    };

    // Add event listener
    window.addEventListener("message", handleCalendlyMessage);

    // Cleanup
    return () => {
      window.removeEventListener("message", handleCalendlyMessage);
    };
  }, [navigate]);

  return (
    <div className="bg-white min-h-screen w-full" style={{ backgroundColor: '#ffffff' }}>
      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        {/* Main Title */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight mb-4">
            Step 2: Schedule a Demo
          </h1>
        </div>

        {/* Instructions Banner - Similar to guarantee banner */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-6 mb-8 md:mb-12 text-center shadow-sm">
          <p className="text-lg md:text-xl font-bold text-slate-900 mb-2">
            Please allow 30 seconds for the calendar to load.
          </p>
          {!calendarLoaded && (
            <p className="text-sm md:text-base text-slate-700">
              If the calendar has still not loaded after 30 seconds,{' '}
              <a 
                href={calendlyUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-emerald-600 hover:text-emerald-700 underline font-semibold"
              >
                click here
              </a>
            </p>
          )}
        </div>

        {/* Calendly Widget */}
        <div className="relative w-full bg-white" style={{ backgroundColor: '#ffffff' }}>
          {appointmentScheduled && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/95 z-30 backdrop-blur-sm">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar size={32} />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  Appointment Scheduled! 🎉
                </h3>
                <p className="text-slate-600 mb-4">
                  Redirecting you to thank you page...
                </p>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600 mx-auto"></div>
              </div>
            </div>
          )}
          
          {/* Use iframe - most reliable method, works 100% of the time */}
          <iframe
            src={calendlyUrl}
            width="100%"
            height="1000"
            frameBorder="0"
            className="w-full border-0"
            title="Schedule a demo"
            allow="camera; microphone; geolocation"
            style={{ display: 'block', minHeight: '1000px', backgroundColor: '#ffffff' }}
            onLoad={() => setCalendarLoaded(true)}
          />
        </div>
      </div>
    </div>
  );
};

export default ScheduleDemo;

