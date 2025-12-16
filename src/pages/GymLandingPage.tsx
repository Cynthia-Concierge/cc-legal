import { useNavigate } from "react-router-dom";
import GymHero from "@/components/gym/GymHero";
import GymFeatures from "@/components/gym/GymFeatures";
import GymValueStack from "@/components/gym/GymValueStack";
import GymTestimonials from "@/components/gym/GymTestimonials";
import GymFooter from "@/components/gym/GymFooter";

// Declare Facebook Pixel function (same as Index.tsx)
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

const GymLandingPage = () => {
    const navigate = useNavigate();

    // Handle form submission (Duplicate logic from Index.tsx to maintain functionality)
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

        // Generate a unique event_id for deduplication
        const eventId = `lead_${crypto.randomUUID()}`;

        try {
            const API_BASE_URL =
                import.meta.env.VITE_API_URL ||
                (import.meta.env.DEV ? "" : "");



            // Save to Supabase contacts table
            try {
                console.log("Attempting to save contact to Supabase (Gym Funnel)...", {
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    website: normalizedWebsite,
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
                        source: 'gym'
                    }),
                });

                if (!supabaseResponse.ok) {
                    console.error("Failed to save contact to Supabase");
                } else {
                    console.log("Contact saved to Supabase successfully");
                }
            } catch (supabaseError) {
                console.error("Error saving contact to Supabase:", supabaseError);
            }


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
                        eventId: eventId,
                    }),
                });

                if (!metaResponse.ok) {
                    console.error("Failed to track lead in Meta Conversions API");
                }
            } catch (metaError) {
                console.error("Error tracking lead in Meta:", metaError);
            }

            // Track Lead event immediately on form submission (client-side pixel)
            if (typeof window !== 'undefined' && window.fbq) {
                window.fbq('track', 'Lead', {
                    content_name: 'Gym Legal Pack Form Submission',
                    content_category: 'Lead Generation'
                }, {
                    eventID: eventId
                });
            }
        } catch (error) {
            console.error("Error submitting form:", error);
        }

        // Redirect to onboarding (Skip Thank You page)
        const params = new URLSearchParams({
            skipWelcome: 'true',
            email: formData.email,
            eventId: eventId
        });
        navigate(`/wellness/onboarding?${params.toString()}`);
    };

    const handleScrollToForm = () => {
        const formElement = document.getElementById('enter-your-info-form');
        if (formElement) {
            const yOffset = -20;
            const y = formElement.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    };

    return (
        <div className="min-h-screen bg-[#05060A]">
            <GymHero onFormSubmit={handleFormSubmit} />
            <GymFeatures />
            <GymValueStack onGetDocumentsClick={handleScrollToForm} />
            <GymTestimonials />
            <GymFooter />

            {/* Sticky Mobile Button - gym styled */}
            <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden p-4 bg-[#0B0F19] border-t border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
                <button
                    onClick={handleScrollToForm}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-6 rounded shadow-lg shadow-blue-500/30 transform active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 uppercase tracking-wide"
                >
                    <span className="tracking-wide">Get Your Free Documents Now</span>
                </button>
            </div>
        </div>
    );
};

export default GymLandingPage;
