import { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
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
    website: string;
  }) => {
    // Store email in sessionStorage for autofill in onboarding
    if (formData.email) {
      sessionStorage.setItem('wellness_form_email', formData.email.trim().toLowerCase());
    }

    // Normalize website URL
    let normalizedWebsite = formData.website.trim();
    if (normalizedWebsite && !normalizedWebsite.startsWith("http")) {
      normalizedWebsite = `https://${normalizedWebsite}`;
    }

    try {
      const API_BASE_URL =
        import.meta.env.VITE_API_URL ||
        (import.meta.env.DEV ? "" : "");

      // Save to Supabase contacts table (primary action - must succeed)
      try {
        console.log("Attempting to save contact to Supabase...", {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          website: normalizedWebsite,
          apiUrl: `${API_BASE_URL}/api/save-contact`
        });

        const supabaseResponse = await fetch(`${API_BASE_URL}/api/save-contact`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            website: normalizedWebsite,
          }),
        });

        const responseText = await supabaseResponse.text();
        console.log("Supabase response status:", supabaseResponse.status);
        console.log("Supabase response:", responseText);

        if (!supabaseResponse.ok) {
          let errorData: any = {};
          try {
            errorData = JSON.parse(responseText);
          } catch (e) {
            errorData = { message: responseText || "Unknown error occurred" };
          }
          console.error("Failed to save contact to Supabase:", errorData);
          console.error("Error details:", {
            status: supabaseResponse.status,
            message: errorData.message,
            code: errorData.code,
            details: errorData.details,
            hint: errorData.hint,
          });
          // Still continue to show thank you page, but log the error
        } else {
          const result = JSON.parse(responseText);
          console.log("Contact saved to Supabase successfully:", result);
          
          // Log Instantly.ai result if available
          if (result.instantly) {
            console.log("Lead added to Instantly.ai successfully:", result.instantly);
          } else if (result.instantlyError) {
            console.warn("Instantly.ai error (non-blocking):", result.instantlyError);
          }
        }
      } catch (supabaseError) {
        console.error("Error saving contact to Supabase:", supabaseError);
        // Continue even if Supabase fails - don't block the user experience
      }

      // Note: Instantly.ai integration is now handled server-side in /api/save-contact
      // The lead is automatically added to the Instantly.ai campaign/list when saved to Supabase

      // Generate a unique event_id for deduplication between Pixel and CAPI
      const eventId = `lead_${crypto.randomUUID()}`;

      // Track Lead event via Meta Conversions API (server-side)
      try {
        const metaResponse = await fetch(`${API_BASE_URL}/api/track-meta-lead`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formData.email,
            phone: formData.phone,
            firstName: formData.name?.split(" ")[0] || "",
            lastName: formData.name?.split(" ").slice(1).join(" ") || "",
            website: normalizedWebsite,
            eventSourceUrl: window.location.href,
            eventId: eventId, // Send event_id to backend for deduplication
          }),
        });

        if (!metaResponse.ok) {
          console.error("Failed to track lead in Meta Conversions API");
        } else {
          console.log("Lead tracked in Meta Conversions API successfully");
        }
      } catch (metaError) {
        console.error("Error tracking lead in Meta:", metaError);
        // Continue even if Meta tracking fails
      }

      // Track Lead event immediately on form submission (client-side pixel)
      // Use the same event_id for deduplication
      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'Lead', {
          content_name: 'Legal Documents Form Submission',
          content_category: 'Lead Generation'
        }, {
          eventID: eventId // Pass event_id to Pixel for deduplication
        });
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      // Continue to show thank you page even if services fail
    }
    
    // Redirect to thank you page
    navigate('/thank-you');
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
      <Hero onFormSubmit={handleFormSubmit} />
      <Features />
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
