import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BookHero from '@/components/BookHero';
import Testimonials from '@/components/Testimonials';
import { toast } from 'sonner';

// Declare fbq for TypeScript
declare global {
  interface Window {
    fbq: (action: string, eventName: string, data?: any, options?: any) => void;
  }
}

const Book = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Track PageView when user visits /book page
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'PageView', {
          content_name: 'Book Call Page',
          content_category: 'Legal Protection Call Booking'
        });
        console.log('[Book] PageView tracked');
      }
    } catch (error) {
      console.error('[Book] Error tracking PageView:', error);
    }
  }, []);

  const handleFormSubmit = async (formData: {
    name: string;
    email: string;
    phone: string;
  }) => {
    if (isSubmitting) return; // Prevent double submission
    setIsSubmitting(true);

    // Store form data in sessionStorage for the booking page
    sessionStorage.setItem('book_call_form_data', JSON.stringify(formData));

    // Generate unique event ID for deduplication
    const eventId = `lead_book_${crypto.randomUUID()}`;

    // Track Lead event in Meta Pixel when user clicks "Schedule My Call" (client-side)
    try {
      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'Lead', {
          content_name: 'Book Call Form Submission',
          content_category: 'Legal Protection Call Booking',
          value: 0,
          currency: 'USD'
        }, {
          eventID: eventId
        });
        console.log('[Book] Lead event tracked with ID:', eventId);
      }
    } catch (error) {
      console.error('[Book] Error tracking Lead event:', error);
      // Continue even if tracking fails
    }

    // Track Lead event via Meta Conversions API (server-side) for deduplication
    // This is non-blocking - we don't wait for it
    const metaTrackingPromise = (async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : '');
        const nameParts = formData.name.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const metaResponse = await fetch(`${API_BASE_URL}/api/track-meta-lead`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            phone: formData.phone,
            firstName: firstName,
            lastName: lastName,
            eventSourceUrl: window.location.href,
            eventId: eventId, // Same event_id for deduplication
          }),
        });

        if (!metaResponse.ok) {
          console.error('[Book] Failed to track lead in Meta Conversions API');
        } else {
          console.log('[Book] Lead tracked in Meta Conversions API successfully');
        }
      } catch (metaError) {
        console.error('[Book] Error tracking lead in Meta Conversions API:', metaError);
      }
    })();

    // Capture UTM parameters from URL
    const urlParams = new URLSearchParams(window.location.search);
    const utm_source = urlParams.get('utm_source');
    const utm_medium = urlParams.get('utm_medium');
    const utm_campaign = urlParams.get('utm_campaign');

    // Save lead to contacts table
    let saveSuccess = false;
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : '');

      console.log('[Book] Attempting to save lead to contacts...', {
        apiUrl: `${API_BASE_URL}/api/save-contact`,
        email: formData.email,
        name: formData.name,
        phone: formData.phone,
        utm_source,
        utm_medium,
        utm_campaign
      });

      const response = await fetch(`${API_BASE_URL}/api/save-contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          website: '',
          source: 'book_call',
          utm_source: utm_source || null,
          utm_medium: utm_medium || null,
          utm_campaign: utm_campaign || null,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }
        console.error('[Book] Failed to save lead to contacts:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        toast.error('Unable to save your information', {
          description: 'Please try again or contact support if the issue persists.',
          duration: 5000,
        });
        setIsSubmitting(false);
        return;
      } else {
        const result = await response.json();
        console.log('[Book] Lead saved to contacts successfully:', result);
        saveSuccess = true;
      }
    } catch (error) {
      console.error('[Book] Error saving lead to contacts:', error);
      toast.error('Unable to save your information', {
        description: 'Please check your connection and try again.',
        duration: 5000,
      });
      setIsSubmitting(false);
      return;
    }

    // Only navigate if save was successful
    if (saveSuccess) {
      // Navigate to booking page with Calendly widget
      navigate('/book-call');
    }

    // Continue Meta tracking in background (non-blocking)
    metaTrackingPromise.catch(err => {
      console.error('[Book] Background Meta tracking error:', err);
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 overflow-visible">
      <div className="relative z-0 overflow-visible">
        <BookHero onFormSubmit={handleFormSubmit} isSubmitting={isSubmitting} />
      </div>
      <div className="relative -mt-16 sm:-mt-20 md:-mt-24 lg:-mt-28 xl:-mt-32 2xl:-mt-36 z-0">
        <Testimonials />
      </div>
    </div>
  );
};

export default Book;

