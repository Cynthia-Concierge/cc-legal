import { useState, useEffect, useRef } from "react";
import { CheckCircle, Download, FolderDown, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import DynamicBackground from "@/components/DynamicBackground";
import { useNavigate } from "react-router-dom";
import JSZip from "jszip";

// Declare fbq for TypeScript
declare global {
  interface Window {
    fbq: (action: string, eventName: string, data?: any, options?: any) => void;
  }
}

const TEMPLATES_DRIVE_LINK = "https://drive.google.com/drive/folders/1zMJGH7KLXguT_yl86hT0Qccx-UT9Bcyi?usp=sharing";

const TEMPLATE_FILES = [
  { url: "/wellness-legal-templates/Employment-Agreement.docx", name: "Employment Agreement.docx" },
  { url: "/wellness-legal-templates/Independent-Contractor-Agreement.docx", name: "Independent Contractor Agreement.docx" },
  { url: "/wellness-legal-templates/Service-Agreement-Membership-Contract.docx", name: "Service Agreement & Membership Contract.docx" },
  { url: "/wellness-legal-templates/Terms-Conditions-Privacy-Policy-Disclaimer.docx", name: "Terms & Conditions, Privacy Policy, Disclaimer (Website + Services).docx" },
];

const GHL_BOOKING_URL = "https://api.leadconnectorhq.com/widget/booking/XAdTLy6ZSKzcQ2VcszVh";

const ThankYou = () => {
  const navigate = useNavigate();
  const [isDownloading, setIsDownloading] = useState(false);
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

  // Listen for GHL booking widget events
  useEffect(() => {
    const handleMessage = async (e: MessageEvent) => {
      // GHL widget sends messages with action field
      const data = typeof e.data === 'string' ? (() => { try { return JSON.parse(e.data); } catch { return null; } })() : e.data;
      if (!data) return;

      // Detect GHL booking confirmation
      // GHL form_embed.js fires "set-sticky-contacts" when a form/booking is submitted
      const isBookingEvent =
        data.action === 'set-sticky-contacts' ||
        // Also detect if GHL sends a direct booking confirmation
        (typeof e.data === 'string' && e.data.includes('booked')) ||
        (data.type === 'booked') ||
        (data.event === 'booked');

      if (!isBookingEvent || hasTrackedBooking.current) return;
      hasTrackedBooking.current = true;

      console.log('[ThankYou] GHL appointment booked:', data);
      setAppointmentScheduled(true);

      // Generate dedup event ID
      const eventId = `schedule_${crypto.randomUUID()}`;

      // Read stored form data from sessionStorage
      let email: string | null = null;
      let phone: string | null = null;
      let firstName = '';
      let lastName = '';
      let fbc: string | null = null;
      let fbp: string | null = null;

      const formDataStr = sessionStorage.getItem('cc_form_data');
      if (formDataStr) {
        try {
          const formData = JSON.parse(formDataStr);
          email = formData.email || null;
          phone = formData.phone || null;
          fbc = formData.fbc || null;
          fbp = formData.fbp || null;
          if (formData.name) {
            const parts = formData.name.split(' ');
            firstName = parts[0] || '';
            lastName = parts.slice(1).join(' ') || '';
          }
        } catch (e) {
          console.warn('[ThankYou] Could not parse cc_form_data from sessionStorage');
        }
      }

      // Try to get email from GHL sticky contacts data
      if (!email && data.data?.email) {
        email = data.data.email;
      }

      // Fire client-side pixel: Schedule event with dedup ID
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
          console.log('[ThankYou] Schedule pixel event fired with ID:', eventId);
        }
      } catch (error) {
        console.error('[ThankYou] Error firing Schedule pixel:', error);
      }

      // Fire server-side CAPI: Schedule event for deduplication
      if (email) {
        try {
          const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : '');
          const metaResponse = await fetch(`${API_BASE_URL}/api/track-meta-schedule`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
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
          });

          if (!metaResponse.ok) {
            console.error('[ThankYou] Failed to track Schedule via CAPI');
          } else {
            console.log('[ThankYou] Schedule event tracked via CAPI successfully');
          }
        } catch (metaError) {
          console.error('[ThankYou] Error tracking Schedule via CAPI:', metaError);
        }
      } else {
        console.warn('[ThankYou] No email available for CAPI Schedule event');
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  const handleOpenDriveFolder = () => {
    window.open(TEMPLATES_DRIVE_LINK, "_blank", "noopener,noreferrer");
  };

  const handleDownloadFolder = async () => {
    setIsDownloading(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder("Wellness Legal Templates");
      if (!folder) throw new Error("Could not create zip folder");

      for (const file of TEMPLATE_FILES) {
        const res = await fetch(file.url);
        if (!res.ok) throw new Error(`Failed to fetch ${file.name}`);
        const blob = await res.blob();
        folder.file(file.name, blob);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(zipBlob);
      link.download = "Wellness Legal Templates.zip";
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black">
      <DynamicBackground />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-gradient-to-r from-teal-500 to-emerald-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-teal-500 to-emerald-600 bg-clip-text text-transparent">
            Thank you — you're in!
          </h1>
          <p className="text-xl mb-8 text-gray-700">
            Your free legal templates are ready. Download the folder with all agreements or open them in Google Drive.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
            <Button
              onClick={handleDownloadFolder}
              disabled={isDownloading}
              className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold py-4 px-8 text-lg hover:from-teal-400 hover:to-emerald-500 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              <FolderDown className="h-6 w-6" />
              {isDownloading ? "Preparing zip..." : "Download folder (all agreements)"}
            </Button>
            <Button
              variant="outline"
              onClick={handleOpenDriveFolder}
              className="border-teal-500 text-teal-700 font-semibold py-4 px-8 text-lg hover:bg-teal-50 flex items-center justify-center gap-2"
            >
              <Download className="h-6 w-6" />
              Open in Google Drive
            </Button>
          </div>

          <p className="text-sm text-gray-500 mb-8">
            Employment Agreement, Independent Contractor Agreement, Service Agreement, Terms &amp; Conditions, Privacy Policy, and more.
          </p>

          {/* Book a call - GHL Calendar widget */}
          <div className="mt-12 mb-10 relative">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Book a free call</h2>
            <p className="text-gray-600 text-sm mb-4 max-w-md mx-auto">
              Want a lawyer to review your specific agreements and business? Schedule a call now.
            </p>
            {appointmentScheduled && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/95 z-30 backdrop-blur-sm rounded-xl">
                <div className="text-center p-6">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar size={32} />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    Appointment Scheduled!
                  </h3>
                  <p className="text-slate-600">
                    You'll receive a confirmation email shortly.
                  </p>
                </div>
              </div>
            )}
            <div className="rounded-xl overflow-hidden border border-gray-200 shadow-lg bg-white" style={{ minHeight: '700px' }}>
              <iframe
                title="Book a call with CC Legal"
                src={GHL_BOOKING_URL}
                width="100%"
                style={{ width: '100%', border: 'none', overflow: 'hidden', minHeight: '700px' }}
                scrolling="no"
                id="XAdTLy6ZSKzcQ2VcszVh_1773945607822"
              />
            </div>
          </div>

          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-gray-600 hover:text-gray-900"
          >
            Return to home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ThankYou;
