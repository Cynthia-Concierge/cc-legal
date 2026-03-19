import React, { useEffect, useRef } from 'react';
import { CheckCircle, Mail, Clock, Video, Shield } from 'lucide-react';

// Declare fbq for TypeScript
declare global {
  interface Window {
    fbq: (action: string, eventName: string, data?: any, options?: any) => void;
  }
}

const BookThankYou = () => {
  const hasTracked = useRef(false);

  // Fire Meta Pixel + CAPI Schedule event on page load
  useEffect(() => {
    if (hasTracked.current) return;
    hasTracked.current = true;

    const eventId = `schedule_${crypto.randomUUID()}`;

    // 1. Client-side Meta Pixel
    try {
      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'Schedule', {
          content_name: 'Call Scheduled',
          content_category: 'GHL Appointment Confirmed',
          value: 0,
          currency: 'USD'
        }, {
          eventID: eventId
        });
        console.log('[BookThankYou] Schedule pixel fired, eventId:', eventId);
      }
    } catch (err) {
      console.error('[BookThankYou] Pixel error:', err);
    }

    // 2. Server-side Meta CAPI
    try {
      // Gather contact info from sessionStorage (form data or GHL contact)
      let email: string | null = null;
      let phone: string | null = null;
      let firstName: string | null = null;
      let lastName: string | null = null;

      // Try form data first (from /book step)
      const formDataStr = sessionStorage.getItem('book_call_form_data');
      if (formDataStr) {
        try {
          const fd = JSON.parse(formDataStr);
          email = fd.email || null;
          phone = fd.phone || null;
          if (fd.name) {
            const parts = fd.name.split(' ');
            firstName = parts[0] || null;
            lastName = parts.slice(1).join(' ') || null;
          }
        } catch { /* ignore */ }
      }

      // Try GHL contact data (from widget postMessage)
      const ghlStr = sessionStorage.getItem('ghl_booking_contact');
      if (ghlStr) {
        try {
          const ghl = JSON.parse(ghlStr);
          if (!email && ghl.email) email = ghl.email;
          if (!phone && ghl.phone) phone = ghl.phone;
          if (!firstName && ghl.firstName) firstName = ghl.firstName;
          if (!lastName && ghl.lastName) lastName = ghl.lastName;
          if (!firstName && ghl.name) {
            const parts = ghl.name.split(' ');
            firstName = parts[0] || null;
            lastName = parts.slice(1).join(' ') || null;
          }
        } catch { /* ignore */ }
      }

      // Try cc_form_data (from main funnel Index page)
      const ccStr = sessionStorage.getItem('cc_form_data');
      if (ccStr) {
        try {
          const cc = JSON.parse(ccStr);
          if (!email && cc.email) email = cc.email;
          if (!phone && cc.phone) phone = cc.phone;
          if (!firstName && cc.name) {
            const parts = cc.name.split(' ');
            firstName = parts[0] || null;
            lastName = parts.slice(1).join(' ') || null;
          }
        } catch { /* ignore */ }
      }

      // Read fbc/fbp cookies
      const getCookie = (n: string): string | null => {
        const match = document.cookie.match(new RegExp('(?:^|; )' + n + '=([^;]*)'));
        return match ? decodeURIComponent(match[1]) : null;
      };
      let fbc = getCookie('_fbc');
      const fbp = getCookie('_fbp');

      // Construct fbc from fbclid if cookie missing
      const urlParams = new URLSearchParams(window.location.search);
      const fbclid = urlParams.get('fbclid');
      if (!fbc && fbclid) {
        fbc = `fb.1.${Date.now()}.${fbclid}`;
      }

      // Also try stored fbc/fbp from form submission
      if (ccStr) {
        try {
          const cc = JSON.parse(ccStr);
          if (!fbc && cc.fbc) fbc = cc.fbc;
          if (!fbp && cc.fbp) {
            // fbp already declared as const, skip
          }
        } catch { /* ignore */ }
      }

      if (email) {
        const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : '');

        // Update booking record
        fetch(`${API_BASE_URL}/api/book-call-funnel/update-booking`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, meta_schedule_event_id: eventId }),
        }).catch(err => console.error('[BookThankYou] Booking update error:', err));

        // CAPI Schedule event
        fetch(`${API_BASE_URL}/api/track-meta-schedule`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            phone: phone || undefined,
            firstName: firstName || undefined,
            lastName: lastName || undefined,
            eventSourceUrl: window.location.href,
            eventId,
            fbc: fbc || undefined,
            fbp: fbp || undefined,
          }),
        }).then(r => {
          if (r.ok) console.log('[BookThankYou] CAPI Schedule tracked');
          else console.error('[BookThankYou] CAPI failed');
        }).catch(err => console.error('[BookThankYou] CAPI error:', err));
      } else {
        console.warn('[BookThankYou] No email found — CAPI skipped, pixel-only tracking');
      }
    } catch (error) {
      console.error('[BookThankYou] Tracking error:', error);
    }

    // Clean up sessionStorage
    sessionStorage.removeItem('ghl_booking_contact');
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-12 md:py-20">
        {/* Success icon */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-emerald-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
            You're All Set!
          </h1>
          <p className="text-lg text-slate-600 max-w-md mx-auto">
            Your call has been scheduled. We're looking forward to speaking with you.
          </p>
        </div>

        {/* What happens next */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 mb-6">
          <h2 className="font-semibold text-slate-900 text-lg mb-6 text-center">What Happens Next</h2>
          <div className="space-y-5">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-medium text-slate-900 mb-0.5">Check your inbox</h3>
                <p className="text-sm text-slate-500">You'll get a confirmation email with a calendar invite and meeting link.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-slate-900 mb-0.5">15-minute call</h3>
                <p className="text-sm text-slate-500">Quick, focused conversation about your business and where you might have gaps.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Video className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <h3 className="font-medium text-slate-900 mb-0.5">No pressure</h3>
                <p className="text-sm text-slate-500">We'll review your situation and see if we're the right fit. Zero obligation.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-medium text-slate-900 mb-0.5">Walk away with clarity</h3>
                <p className="text-sm text-slate-500">Whether we work together or not, you'll know exactly what you need to protect your business.</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-sm text-slate-400">
            Questions before the call? Email us at{' '}
            <a href="mailto:hello@consciouscounsel.ca" className="text-emerald-600 hover:underline">
              hello@consciouscounsel.ca
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default BookThankYou;
