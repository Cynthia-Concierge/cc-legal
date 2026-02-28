import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar } from 'lucide-react';

// Declare fbq for TypeScript
declare global {
  interface Window {
    fbq: (action: string, eventName: string, data?: any, options?: any) => void;
  }
}

const BookCall = () => {
  const navigate = useNavigate();
  const [appointmentScheduled, setAppointmentScheduled] = useState(false);

  // Calendly URL - using iframe method which is 100% reliable
  // background_color=ffffff sets the widget background to white
  const calendlyUrl = 'https://calendly.com/chad-consciouscounsel/connection-call-with-chad?primary_color=7da69f&background_color=ffffff';

  // Set body and html background to white on mount + Track page view as Lead
  useEffect(() => {
    // Store original backgrounds
    const originalBodyBackground = document.body.style.backgroundColor;
    const originalHtmlBackground = document.documentElement.style.backgroundColor;

    // Force white background on both html and body
    document.body.style.backgroundColor = '#ffffff';
    document.documentElement.style.backgroundColor = '#ffffff';

    // Also add to body classes to override Tailwind
    document.body.classList.add('!bg-white');

    // Track PageView when user lands on booking page
    // Note: They already became a Lead on the previous page when they filled the form
    try {
      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'PageView', {
          content_name: 'Calendly Booking Page',
          content_category: 'Calendly Booking Flow'
        });
        console.log('[BookCall] PageView tracked');
      }
    } catch (error) {
      console.error('[BookCall] Error tracking PageView:', error);
    }

    // Cleanup: restore original backgrounds on unmount
    return () => {
      document.body.style.backgroundColor = originalBodyBackground;
      document.documentElement.style.backgroundColor = originalHtmlBackground;
      document.body.classList.remove('!bg-white');
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
          console.log('[BookCall] Appointment scheduled:', e.data.payload);
          setAppointmentScheduled(true);

          // Track "Schedule" event in Meta Pixel when appointment is confirmed (client-side)
          const eventId = `schedule_${crypto.randomUUID()}`;
          try {
            if (typeof window !== 'undefined' && window.fbq) {
              window.fbq('track', 'Schedule', {
                content_name: 'Legal Protection Call Scheduled',
                content_category: 'Calendly Appointment Confirmed',
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

          // Update book_a_call_funnel record with booking information and track Schedule event server-side
          try {
            // Get form data from sessionStorage
            const formDataStr = sessionStorage.getItem('book_call_form_data');
            let formData = null;
            let email = null;
            let phone = null;
            let name = null;
            
            if (formDataStr) {
              try {
                formData = JSON.parse(formDataStr);
                email = formData.email;
                phone = formData.phone;
                name = formData.name;
              } catch (e) {
                console.warn('[BookCall] Could not parse form data from sessionStorage');
              }
            }

            // Also try to get email from Calendly payload
            if (!email && e.data.payload?.invitee?.email) {
              email = e.data.payload.invitee.email;
            }

            if (email) {
              const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : '');
              const calendlyEventUri = e.data.payload?.event?.uri || null;

              // Update booking in database
              const updateResponse = await fetch(`${API_BASE_URL}/api/book-call-funnel/update-booking`, {
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

              if (!updateResponse.ok) {
                const errorText = await updateResponse.text();
                console.error('[BookCall] Failed to update booking in book_a_call_funnel:', errorText);
              } else {
                const result = await updateResponse.json();
                console.log('[BookCall] Booking updated in book_a_call_funnel:', result);
              }

              // Track Schedule event via Meta Conversions API (server-side) for deduplication
              if (name && phone) {
                try {
                  const nameParts = name.split(' ');
                  const firstName = nameParts[0] || '';
                  const lastName = nameParts.slice(1).join(' ') || '';

                  const metaResponse = await fetch(`${API_BASE_URL}/api/track-meta-schedule`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      email: email,
                      phone: phone,
                      firstName: firstName,
                      lastName: lastName,
                      eventSourceUrl: window.location.href,
                      eventId: eventId, // Same event_id for deduplication
                    }),
                  });

                  if (!metaResponse.ok) {
                    console.error('[BookCall] Failed to track schedule event in Meta Conversions API');
                  } else {
                    console.log('[BookCall] Schedule event tracked in Meta Conversions API successfully');
                  }
                } catch (metaError) {
                  console.error('[BookCall] Error tracking schedule event in Meta Conversions API:', metaError);
                  // Continue even if Meta tracking fails
                }
              }
            } else {
              console.warn('[BookCall] No email found to update book_a_call_funnel record');
            }
          } catch (error) {
            console.error('[BookCall] Error updating booking in book_a_call_funnel:', error);
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
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 lg:p-8">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl lg:text-3xl font-bold mb-2 text-center">Schedule Your Free Legal Protection Call</h1>
          <p className="text-emerald-50 text-center">Choose a time that works for you. No pressure • 15 minutes • See if this is a fit</p>
        </div>
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
          title="Schedule a call"
          allow="camera; microphone; geolocation"
          style={{ display: 'block', minHeight: '1000px', backgroundColor: '#ffffff' }}
        />
      </div>
    </div>
  );
};

export default BookCall;

