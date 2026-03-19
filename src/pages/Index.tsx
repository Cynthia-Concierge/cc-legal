import { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { CheckCircle, Download } from 'lucide-react';
import { Button } from "@/components/ui/button";
import DynamicBackground from "@/components/DynamicBackground"; // Assuming this exists or I'll create a dummy one if it fails, or search for it first.
import { supabase } from "@/lib/supabase";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import DashboardShowcase from "@/components/DashboardShowcase";
import ValueStack from "@/components/ValueStack";
import Testimonials from "@/components/Testimonials";
import Footer from "@/components/Footer";

// Pricing Plan Interface
interface PricingPlan {
  _id: string;
  name: string;
  type: string;
  actualPrice: number;
  finalPrice: {
    android: number;
    ios: number;
  };
  subTitle: string;
  description: string;
  initialAmount?: number;
  trialDays?: number;
  platforms: string[];
}

// Declare Facebook Pixel function with support for eventID
declare global {
  interface Window {
    fbq: (
      action: string,
      event: string,
      params?: Record<string, any>,
      ...args: any[]
    ) => void;
  }
}

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [monthlyPlan, setMonthlyPlan] = useState<PricingPlan | null>(null);
  const [isLoadingPricing, setIsLoadingPricing] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Capture UTM parameters from URL for ad attribution
  const [utmParams] = useState(() => ({
    utm_source: searchParams.get('utm_source') || null,
    utm_medium: searchParams.get('utm_medium') || null,
    utm_campaign: searchParams.get('utm_campaign') || null,
    utm_content: searchParams.get('utm_content') || null,
    utm_term: searchParams.get('utm_term') || null,
  }));

  // Check if user is already logged in -> Redirect to Dashboard
  useEffect(() => {
    const checkAuth = async () => {
      if (!supabase) return;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log('[Index] User already authenticated - redirecting to dashboard');
          navigate('/wellness/dashboard', { replace: true });
        }
      } catch (err) {
        console.error('Error checking auth in Index:', err);
      }
    };

    checkAuth();
  }, [navigate]);

  // Fetch pricing plans from API
  const fetchPricingPlans = async () => {
    try {
      setIsLoadingPricing(true);
      const response = await fetch(
        "https://student-api.eventbeep.com/api/v1/pro-plan/plans/getAll"
      );
      const data = await response.json();

      if (data.status === 1 && data.data) {
        // Find the monthly plan
        const monthly = data.data.find(
          (plan: PricingPlan) => plan.type === "monthly"
        );
        if (monthly) {
          setMonthlyPlan(monthly);
        }
      }
    } catch (error) {
      console.error("Error fetching pricing plans:", error);
      // Set fallback pricing if API fails
      setMonthlyPlan({
        _id: "676eb0ead78c5964d23592fe",
        name: "Monthly Plan",
        type: "monthly",
        actualPrice: 499,
        finalPrice: { android: 99, ios: 99 },
        subTitle: "₹3 for 3 days then ₹99/month",
        description: "Career Pro Monthly Subscription",
        initialAmount: 3,
        trialDays: 3,
        platforms: ["ios", "android", "web"],
      });
    } finally {
      setIsLoadingPricing(false);
    }
  };

  // Load pricing data on component mount
  useEffect(() => {
    fetchPricingPlans();
  }, []);


  // Check for payment success query param and remove it
  useEffect(() => {
    if (searchParams.get("payment") === "success") {
      setShowPaymentSuccess(true);
      // Remove the payment query param from URL
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete("payment");
      setSearchParams(newSearchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Handle form submission
  const handleFormSubmit = async (formData: {
    name: string;
    email: string;
    phone: string;
    instagram_handle: string;
    consentSms: boolean;
    consentEmail: boolean;
  }) => {
    if (isSubmitting) return; // Prevent double-submit
    setIsSubmitting(true);

    // Store email in sessionStorage for autofill in onboarding
    if (formData.email) {
      sessionStorage.setItem('wellness_form_email', formData.email.trim().toLowerCase());
    }

    // Capture fbc/fbp cookies for Meta CAPI attribution
    const getCookie = (name: string): string | null => {
      const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
      return match ? decodeURIComponent(match[1]) : null;
    };

    let fbc = getCookie('_fbc');
    const fbp = getCookie('_fbp');

    // If _fbc cookie doesn't exist but fbclid is in URL, construct fbc value
    const urlParams = new URLSearchParams(window.location.search);
    const fbclid = urlParams.get('fbclid');
    if (!fbc && fbclid) {
      fbc = `fb.1.${Date.now()}.${fbclid}`;
    }

    // Persist full form data + fbc/fbp to sessionStorage for ThankYou page tracking
    sessionStorage.setItem('cc_form_data', JSON.stringify({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      fbc: fbc || null,
      fbp: fbp || null,
    }));

    // Use Instagram handle as-is (no URL normalization)
    const instagramHandle = formData.instagram_handle.trim();

    // Generate a unique event_id for deduplication
    const eventId = `lead_${crypto.randomUUID()}`;

    // Capture UTM parameters from URL
    const utm_source = urlParams.get('utm_source');
    const utm_medium = urlParams.get('utm_medium');
    const utm_campaign = urlParams.get('utm_campaign');

    // Fire client-side pixel immediately (instant, no network wait)
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'Lead', {
        content_name: 'Legal Documents Form Submission',
        content_category: 'Lead Generation'
      }, {
        eventID: eventId
      });
    }

    const API_BASE_URL =
      import.meta.env.VITE_API_URL ||
      (import.meta.env.DEV ? "" : "");

    // Navigate to thank you page immediately — don't wait for API calls
    navigate('/thank-you');

    // Fire all API calls in background (non-blocking)
    // Save contact to Supabase
    fetch(`${API_BASE_URL}/api/save-contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        instagram_handle: instagramHandle,
        source: 'wellness',
        utm_source: utm_source || null,
        utm_medium: utm_medium || null,
        utm_campaign: utm_campaign || null,
        utm_content: urlParams.get('utm_content') || null,
        utm_term: urlParams.get('utm_term') || null,
      }),
    }).then(r => {
      if (!r.ok) console.error("Failed to save contact:", r.status);
      else console.log("Contact saved successfully");
    }).catch(err => console.error("Error saving contact:", err));

    // Track Lead event via Meta CAPI (server-side)
    fetch(`${API_BASE_URL}/api/track-meta-lead`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: formData.email,
        phone: formData.phone,
        firstName: formData.name?.split(" ")[0] || "",
        lastName: formData.name?.split(" ").slice(1).join(" ") || "",
        website: instagramHandle,
        eventSourceUrl: window.location.href,
        eventId: eventId,
        fbc: fbc || undefined,
        fbp: fbp || undefined,
      }),
    }).then(r => {
      if (!r.ok) console.error("Failed to track lead in Meta CAPI");
      else console.log("Lead tracked in Meta CAPI successfully");
    }).catch(err => console.error("Error tracking lead in Meta:", err));
  };

  // Handle scroll to form
  const handleScrollToForm = () => {
    const formElement = document.getElementById('enter-your-info-form');
    if (formElement) {
      const yOffset = -20; // Small offset from top
      const y = formElement.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // Handle download clicks
  const handleDownloadClick = (platform: "android" | "ios") => {
    const utmParams = new URLSearchParams({
      utm_source: "career_pro_ad",
      utm_medium: "download_button",
      utm_campaign: "app_download",
      utm_content: `${platform}_download`,
      utm_term: "career_pro_app",
    });

    const downloadUrl = `https://beep.sng.link/Dmzf3/jnec/kx1j?${utmParams.toString()}`;
    window.open(downloadUrl, "_blank");
  };

  // Payment success page
  if (showPaymentSuccess) {
    return (
      <div className="min-h-screen bg-white text-black">
        <DynamicBackground />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-gradient-to-r from-teal-500 to-emerald-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-teal-500 to-emerald-600 bg-clip-text text-transparent">
              Welcome to Beep Career Pro! 🎉
            </h1>
            <p className="text-xl mb-6 text-gray-700">
              Your payment was successful! You now have access to all premium
              features.
            </p>
            <div className="bg-gray-100 p-6 rounded-lg mb-8 border">
              <h3 className="text-lg font-semibold mb-4 text-teal-600">
                Next Steps:
              </h3>
              <div className="space-y-3 text-left">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-gray-800">
                    Download the Beep app to activate your Pro features
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-gray-800">
                    Check your email for bonus materials worth $3,999
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-gray-800">
                    Join our exclusive Career Pro community
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => handleDownloadClick("android")}
                className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold py-3 px-8 text-lg hover:from-teal-400 hover:to-emerald-500"
              >
                <Download className="mr-2 h-5 w-5" />
                Download for Android
              </Button>
              <Button
                onClick={() => handleDownloadClick("ios")}
                variant="outline"
                className="border-teal-500 text-teal-600 hover:bg-teal-500 hover:text-white py-3 px-8 text-lg"
              >
                <Download className="mr-2 h-5 w-5" />
                Download for iOS
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main landing page with new design
  return (
    <div className="min-h-screen bg-white">
      <Hero onFormSubmit={handleFormSubmit} isSubmitting={isSubmitting} />
      <Features />
      <DashboardShowcase />
      <ValueStack onGetDocumentsClick={handleScrollToForm} />
      <Testimonials />
      <Footer />

      {/* Sticky Mobile Button */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden p-4 bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
        <button
          onClick={handleScrollToForm}
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-emerald-500/30 transform active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
        >
          <span className="tracking-wide">Get Your Free Documents Now</span>
        </button>
      </div>
    </div>
  );
};

export default Index;
