import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Target,
  Brain,
  FileText,
  BookOpen,
  Bell,
  Send,
  TrendingUp,
  Users,
  Gift,
  Calendar,
  GraduationCap,
  MapPin,
  Wrench,
  MessageCircle,
  Star,
  Shield,
  Download,
  Play,
  ChevronDown,
  ChevronUp,
  Zap,
  Briefcase,
  Clock,
  Award,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import DynamicBackground from "@/components/DynamicBackground";
import InteractiveCard from "@/components/InteractiveCard";
import YouTubeVideo from "@/components/YouTubeVideo";
import WhatsAppChat from "@/components/WhatsAppChat";

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
const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(9 * 60); // 9 minutes in seconds
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

  // Track purchase when payment is successful
  useEffect(() => {
    if (showPaymentSuccess) {
      trackPurchase();
    }
  }, [showPaymentSuccess]);

  // Dynamic Career Pro URL based on fetched plan data
  const getCareerProURL = () => {
    const planId = monthlyPlan?._id || "676eb0ead78c5964d23592fe";
    return `https://www.eventbeep.com/career-pro/plans/monthly?id=${planId}&utm_source=monthlyprolp_eventbeep&utm_medium=landing_page&utm_campaign=career_pro_monthly&utm_content=cta_button&utm_term=career_pro&referrer=https://monthlyprolp.eventbeep.com/`;
  };

  // Facebook Pixel tracking functions
  const trackInitiateCheckout = () => {
    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq("track", "InitiateCheckout");
    }
  };

  const trackPurchase = () => {
    if (typeof window !== "undefined" && (window as any).fbq) {
      const purchaseValue = monthlyPlan?.initialAmount || 3;
      (window as any).fbq("track", "Purchase", {
        value: purchaseValue,
        currency: "INR",
      });
    }
  };

  // Helper functions for dynamic pricing
  const getInitialPrice = () => monthlyPlan?.initialAmount || 3;
  const getActualPrice = () => monthlyPlan?.actualPrice || 499;
  const getMonthlyPrice = () => monthlyPlan?.finalPrice?.android || 99;
  const getTrialDays = () => monthlyPlan?.trialDays || 3;
  const getSubTitle = () =>
    monthlyPlan?.subTitle || "₹3 for 3 days then ₹99/month";

  // Handle CTA click with tracking
  const handleCTAClick = () => {
    trackInitiateCheckout();
    window.open(getCareerProURL(), "_blank");
  };

  // Handle download clicks with tracking
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

  // Job title mapping
  const jobTitleMapping: {
    [key: string]: string;
  } = {
    generic: "Dream Job",
    "product-management": "Product Management Role",
    "digital-marketing": "Digital Marketing Position",
    "ui-ux": "UI/UX Design Role",
    sales: "Sales Position",
    "data-analyst": "Data Analyst Role",
    hr: "HR Position",
    "work-from-home": "Work From Home Job",
  };

  // Get dynamic job title from query params
  const getDynamicJobTitle = () => {
    const jobType = searchParams.get("job");
    return jobType && jobTitleMapping[jobType]
      ? jobTitleMapping[jobType]
      : jobTitleMapping.generic;
  };

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Simulate payment success for demo
  const handlePayment = () => {
    setShowPaymentSuccess(true);
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };
  const benefits = [
    {
      icon: Target,
      title: "Shortlist Predictor",
      description:
        "Know your chances before you apply with AI-powered predictions",
    },
    {
      icon: Brain,
      title: "AI Mock Interview",
      description:
        "Practice & get feedback like a real interview with personalized coaching",
    },
    {
      icon: FileText,
      title: "Create ATS Friendly Resume",
      description:
        "ATS & recruiter friendly resumes in seconds with AI optimization",
    },
    {
      icon: BookOpen,
      title: "Premium Micro Courses",
      description:
        "Upskill with certified courses and exclusive internship opportunities",
    },
    {
      icon: Bell,
      title: "Live Application Tracking",
      description: "Get updates on your application within 8 hours of applying",
    },
    {
      icon: Send,
      title: "1-Click Apply to 1200+ Recruiters",
      description: "Apply to verified openings with top companies instantly",
    },
    {
      icon: TrendingUp,
      title: "Weekly Career Insights",
      description: "Expert analysis and trends delivered directly to your app",
    },
    {
      icon: MessageCircle,
      title: "Premium WhatsApp Communities",
      description:
        "Join exclusive groups with job tips, referrals & career guidance from experts",
    },
  ];

  // Dynamic job listings based on query params
  const jobListingsMap: {
    [key: string]: any[];
  } = {
    generic: [
      {
        title: "Software Engineer",
        company: "Accenture",
        location: "Bangalore",
        salary: "₹8-12 LPA",
      },
      {
        title: "Marketing Associate",
        company: "Boat",
        location: "Mumbai",
        salary: "₹6-9 LPA",
      },
      {
        title: "Business Analyst",
        company: "EY",
        location: "Hyderabad",
        salary: "₹10-15 LPA",
      },
      {
        title: "Data Scientist",
        company: "HDFC",
        location: "Pune",
        salary: "₹12-18 LPA",
      },
      {
        title: "Product Manager",
        company: "Cult.fit",
        location: "Delhi",
        salary: "₹15-25 LPA",
      },
    ],
    "product-management": [
      {
        title: "Product Manager",
        company: "Cult.fit",
        location: "Delhi",
        salary: "₹15-25 LPA",
      },
      {
        title: "Senior Product Manager",
        company: "Flipkart",
        location: "Bangalore",
        salary: "₹20-30 LPA",
      },
      {
        title: "Product Owner",
        company: "Zomato",
        location: "Gurgaon",
        salary: "₹18-25 LPA",
      },
      {
        title: "Associate Product Manager",
        company: "Paytm",
        location: "Noida",
        salary: "₹12-18 LPA",
      },
      {
        title: "Product Strategy Lead",
        company: "Swiggy",
        location: "Bangalore",
        salary: "₹25-35 LPA",
      },
    ],
    "digital-marketing": [
      {
        title: "Marketing Associate",
        company: "Boat",
        location: "Mumbai",
        salary: "₹6-9 LPA",
      },
      {
        title: "Digital Marketing Manager",
        company: "Myntra",
        location: "Bangalore",
        salary: "₹12-18 LPA",
      },
      {
        title: "Social Media Manager",
        company: "Nykaa",
        location: "Mumbai",
        salary: "₹8-12 LPA",
      },
      {
        title: "Performance Marketing Lead",
        company: "CRED",
        location: "Bangalore",
        salary: "₹15-22 LPA",
      },
      {
        title: "Content Marketing Specialist",
        company: "Byju's",
        location: "Bangalore",
        salary: "₹10-15 LPA",
      },
    ],
    "ui-ux": [
      {
        title: "UI/UX Designer",
        company: "Figma",
        location: "Bangalore",
        salary: "₹12-18 LPA",
      },
      {
        title: "Senior UX Designer",
        company: "PhonePe",
        location: "Bangalore",
        salary: "₹18-25 LPA",
      },
      {
        title: "Product Designer",
        company: "Razorpay",
        location: "Bangalore",
        salary: "₹15-22 LPA",
      },
      {
        title: "Visual Designer",
        company: "Ola",
        location: "Bangalore",
        salary: "₹10-15 LPA",
      },
      {
        title: "UX Researcher",
        company: "Flipkart",
        location: "Bangalore",
        salary: "₹14-20 LPA",
      },
    ],
    sales: [
      {
        title: "Sales Executive",
        company: "HDFC Bank",
        location: "Mumbai",
        salary: "₹5-8 LPA",
      },
      {
        title: "Business Development Manager",
        company: "Byju's",
        location: "Bangalore",
        salary: "₹8-12 LPA",
      },
      {
        title: "Sales Manager",
        company: "Zomato",
        location: "Delhi",
        salary: "₹12-18 LPA",
      },
      {
        title: "Account Manager",
        company: "Salesforce",
        location: "Hyderabad",
        salary: "₹10-15 LPA",
      },
      {
        title: "Enterprise Sales",
        company: "Freshworks",
        location: "Chennai",
        salary: "₹15-25 LPA",
      },
    ],
    "data-analyst": [
      {
        title: "Data Scientist",
        company: "HDFC",
        location: "Pune",
        salary: "₹12-18 LPA",
      },
      {
        title: "Data Analyst",
        company: "Flipkart",
        location: "Bangalore",
        salary: "₹8-12 LPA",
      },
      {
        title: "Business Intelligence Analyst",
        company: "Ola",
        location: "Bangalore",
        salary: "₹10-15 LPA",
      },
      {
        title: "Senior Data Scientist",
        company: "PhonePe",
        location: "Bangalore",
        salary: "₹18-25 LPA",
      },
      {
        title: "ML Engineer",
        company: "Razorpay",
        location: "Bangalore",
        salary: "₹15-22 LPA",
      },
    ],
    hr: [
      {
        title: "HR Executive",
        company: "TCS",
        location: "Mumbai",
        salary: "₹4-7 LPA",
      },
      {
        title: "HR Business Partner",
        company: "Accenture",
        location: "Bangalore",
        salary: "₹8-12 LPA",
      },
      {
        title: "Talent Acquisition Specialist",
        company: "Wipro",
        location: "Hyderabad",
        salary: "₹6-10 LPA",
      },
      {
        title: "HR Manager",
        company: "Infosys",
        location: "Pune",
        salary: "₹12-18 LPA",
      },
      {
        title: "People Operations Lead",
        company: "Swiggy",
        location: "Bangalore",
        salary: "₹15-22 LPA",
      },
    ],
    "work-from-home": [
      {
        title: "Remote Software Developer",
        company: "GitLab",
        location: "Remote",
        salary: "₹15-25 LPA",
      },
      {
        title: "Virtual Assistant",
        company: "Time Doctor",
        location: "Remote",
        salary: "₹3-6 LPA",
      },
      {
        title: "Content Writer (Remote)",
        company: "ContentKing",
        location: "Remote",
        salary: "₹5-8 LPA",
      },
      {
        title: "Online Tutor",
        company: "Vedantu",
        location: "Remote",
        salary: "₹4-8 LPA",
      },
      {
        title: "Customer Support (WFH)",
        company: "Freshworks",
        location: "Remote",
        salary: "₹3-6 LPA",
      },
    ],
  };

  // Get dynamic job listings based on query params
  const getDynamicJobListings = () => {
    const jobType = searchParams.get("job");
    return jobType && jobListingsMap[jobType]
      ? jobListingsMap[jobType]
      : jobListingsMap.generic;
  };
  const jobListings = getDynamicJobListings();
  const freebies = [
    {
      icon: Briefcase,
      title: "Ultimate Job Seeker Toolkit",
      description:
        "Interview questions, resume templates, LinkedIn optimization hacks",
      value: "₹599",
      bgColor: "bg-gradient-to-r from-blue-500 to-blue-600",
    },
    {
      icon: Calendar,
      title: "30-Day Job Application Planner",
      description:
        "Strategic planning guide to organize and track your applications",
      value: "₹499",
      bgColor: "bg-gradient-to-r from-green-500 to-green-600",
    },
    {
      icon: GraduationCap,
      title: "Expert Masterclass Replays",
      description:
        "3+ sessions on Resume, Interview & LinkedIn from industry experts",
      value: "₹899",
      bgColor: "bg-gradient-to-r from-purple-500 to-purple-600",
    },
    {
      icon: MapPin,
      title: "Career Roadmap for Freshers",
      description:
        "Complete guide on what to learn, when to apply, how to grow",
      value: "₹599",
      bgColor: "bg-gradient-to-r from-orange-500 to-orange-600",
    },
    {
      icon: Award,
      title: "Free Portfolio Builder Access",
      description:
        "Create your professional career website with premium templates",
      value: "₹799",
      bgColor: "bg-gradient-to-r from-cyan-500 to-cyan-600",
    },
    {
      icon: Users,
      title: "Exclusive Community Access",
      description:
        "Join Telegram + WhatsApp groups with mentors and successful peers",
      value: "₹699",
      bgColor: "bg-gradient-to-r from-pink-500 to-pink-600",
    },
  ];
  const testimonials = [
    {
      name: "Priya Sharma",
      role: "Software Engineer at Accenture",
      content:
        "Beep Career Pro helped me crack 3 interviews in 2 weeks! The AI simulator was game-changing.",
      rating: 5,
      image:
        "https://images.unsplash.com/photo-1494790108755-2616b612b192?w=150&h=150&fit=crop&crop=face",
    },
    {
      name: "Rohit Kumar",
      role: "Marketing Associate at Boat",
      content:
        "From 0 to 5 interview calls in a month. The resume optimizer is incredible!",
      rating: 5,
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    },
    {
      name: "Sneha Patel",
      role: "Business Analyst at EY",
      content:
        "The shortlist predictor saved me so much time. Only applied where I had real chances.",
      rating: 5,
      image:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face",
    },
  ];
  const whatsappChats = [
    {
      name: "Rahul Sharma",
      avatar: "RS",
      bgColor: "bg-blue-500",
      messages: [
        {
          type: "received",
          text: "Bro, I just got selected for Accenture SDE role! 🎉",
          time: "2:45 PM",
        },
        {
          type: "sent",
          text: "Congratulations! How did you prepare?",
          time: "2:46 PM",
        },
        {
          type: "received",
          text: "Beep Career Pro was a game changer. The AI mock interviews helped me practice system design questions",
          time: "2:47 PM",
        },
        {
          type: "received",
          text: "Plus the shortlist predictor told me I had 85% chance at Accenture",
          time: "2:47 PM",
        },
        {
          type: "sent",
          text: "That's amazing! 🚀",
          time: "2:48 PM",
        },
      ],
    },
    {
      name: "Priya Patel",
      avatar: "PP",
      bgColor: "bg-pink-500",
      messages: [
        {
          type: "received",
          text: "Update: Got the marketing internship at Boat! 🎯",
          time: "11:20 AM",
        },
        {
          type: "sent",
          text: "Wow! That's your dream company",
          time: "11:22 AM",
        },
        {
          type: "received",
          text: "Yes! The ATS resume builder made my profile stand out",
          time: "11:23 AM",
        },
        {
          type: "received",
          text: "Got interview call within 3 days of applying through Beep",
          time: "11:23 AM",
        },
        {
          type: "received",
          text: "Worth every penny of the ₹3 trial! 😊",
          time: "11:24 AM",
        },
      ],
    },
    {
      name: "Arjun Kumar",
      avatar: "AK",
      bgColor: "bg-green-500",
      messages: [
        {
          type: "received",
          text: "Placed at EY as Business Analyst! Package: 12 LPA 💰",
          time: "4:15 PM",
        },
        {
          type: "sent",
          text: "Congratulations! How was the interview?",
          time: "4:16 PM",
        },
        {
          type: "received",
          text: "The AI interview practice on Beep was exactly like the real one",
          time: "4:17 PM",
        },
        {
          type: "received",
          text: "They asked the same behavioral questions I practiced",
          time: "4:17 PM",
        },
        {
          type: "sent",
          text: "Beep Career Pro really works! 🔥",
          time: "4:18 PM",
        },
        {
          type: "received",
          text: "100%! Best investment for job seekers",
          time: "4:18 PM",
        },
      ],
    },
  ];
  // Dynamic FAQ based on pricing data
  const getFAQs = () => [
    {
      question: `What happens after I pay ₹${getInitialPrice()}?`,
      answer: `Instantly after payment, you'll get access instructions and download links for the Beep app. All Pro features will be activated within 5 minutes for your ${getTrialDays()}-day trial.`,
    },
    {
      question: `What happens after the ${getTrialDays()}-day trial?`,
      answer: `After ${getTrialDays()} days, your subscription continues at ₹${getMonthlyPrice()}/month. You can cancel anytime before the trial ends to avoid charges. No hidden fees!`,
    },
    {
      question: "Can I access Pro on mobile and web?",
      answer:
        "Yes! Beep Career Pro works seamlessly across mobile app, web dashboard, and desktop. Your progress syncs across all devices.",
    },
    {
      question: "How is this different from the free version?",
      answer:
        "Free version has basic job search. Pro unlocks AI tools, premium courses, priority alerts, 1-click apply, expert insights, and exclusive community access.",
    },
    {
      question: "What if I don't like it — is it refundable?",
      answer:
        "100% yes! We offer a 7-day full refund policy. If you're not satisfied during your trial, we'll refund every penny, no questions asked.",
    },
  ];
  const companyLogos = [
    "Accenture",
    "Boat",
    "NoBroker",
    "HDFC",
    "EY",
    "Cult.fit",
    "Capgemini",
    "Wipro",
  ];
  if (showPaymentSuccess) {
    return (
      <div className="min-h-screen bg-white text-black">
        <DynamicBackground />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-black" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
              Welcome to Beep Career Pro! 🎉
            </h1>
            <p className="text-xl mb-6 text-gray-700">
              Your payment was successful! You now have access to all premium
              features.
            </p>
            <div className="bg-gray-100 p-6 rounded-lg mb-8 border">
              <h3 className="text-lg font-semibold mb-4 text-yellow-600">
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
                    Check your email for bonus materials worth ₹3,999
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
                className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-semibold py-3 px-8 text-lg hover:from-yellow-300 hover:to-yellow-500"
              >
                <Download className="mr-2 h-5 w-5" />
                Download for Android
              </Button>
              <Button
                onClick={() => handleDownloadClick("ios")}
                variant="outline"
                className="border-yellow-400 text-yellow-600 hover:bg-yellow-400 hover:text-black py-3 px-8 text-lg"
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
  return (
    <div className="min-h-screen text-black overflow-hidden relative">
      <DynamicBackground />

      {/* Sticky CTA Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-yellow-400 to-yellow-600 p-4 z-50 md:hidden">
        <Button
          onClick={handleCTAClick}
          disabled={isLoadingPricing}
          className="w-full bg-black text-yellow-400 font-bold py-3 text-lg hover:bg-gray-900 disabled:opacity-50"
        >
          {isLoadingPricing
            ? "Loading..."
            : `Get Career Pro for ₹${getInitialPrice()} (${getTrialDays()} days)`}
        </Button>
      </div>

      {/* Countdown Timer Bar */}
      <div className="fixed top-0 left-0 right-0 bg-red-600 text-white p-2 z-50 text-center">
        <div className="flex items-center justify-center gap-2">
          <Clock className="h-4 w-4" />
          <span className="font-semibold">
            Limited Time Offer Expires in: {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      {/* Header with Logo */}
      <header className="bg-transparent z-40 text-gray-900 inset-0 bg-gradient-to-r from-yellow-400/5 to-yellow-600/5">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-center mt-8">
            <img
              src="https://www.eventbeep.com/assets/beepLogoWhite.svg"
              alt="Beep"
              className="h-20 w-auto"
            />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-white/95 via-gray-50/95 to-white/95 min-h-screen flex items-center pt-6">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/5 to-yellow-600/5"></div>
        <div className="container mx-auto px-4 pt-4 pb-20 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-semibold mb-6 text-sm px-4 py-2">
              As Seen on Shark Tank India 🦈
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight text-gray-900">
              Land Your{" "}
              <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                {getDynamicJobTitle()}
              </span>{" "}
              with AI-Powered Career Tools
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 mb-8 leading-relaxed">
              Join 16,000+ students who've cracked interviews at top companies
              using our premium career acceleration platform
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-yellow-600">
                  1M+
                </div>
                <div className="text-sm text-gray-600">Students</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-yellow-600">
                  1200+
                </div>
                <div className="text-sm text-gray-600">Recruiters</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-yellow-600">
                  89%
                </div>
                <div className="text-sm text-gray-600">Success Rate</div>
              </div>
            </div>

            {/* Company Logos */}
            <div className="mb-8">
              <p className="text-gray-600 mb-4">Trusted by students at</p>
              <div className="flex flex-wrap justify-center gap-4 opacity-60">
                {companyLogos.map((company, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="border-gray-400 text-gray-600"
                  >
                    {company}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Main CTA */}
            <div className="bg-white/80 backdrop-blur p-8 rounded-2xl border border-yellow-400/20 max-w-lg mx-auto shadow-lg mb-8">
              {isLoadingPricing ? (
                <div className="mb-4 animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                </div>
              ) : (
                <div className="mb-4">
                  <div className="text-3xl font-bold text-yellow-600">
                    ₹{getInitialPrice()}
                  </div>
                  <div className="text-gray-500 line-through">
                    ₹{getActualPrice()}
                  </div>
                  <div className="text-green-600 font-semibold text-sm">
                    {getSubTitle()}
                  </div>
                  <div className="text-red-600 font-semibold">
                    Limited Time Offer!
                  </div>
                </div>
              )}
              <Button
                onClick={handleCTAClick}
                disabled={isLoadingPricing}
                className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold py-4 text-lg hover:from-yellow-300 hover:to-yellow-500 mb-4 disabled:opacity-50"
              >
                <Zap className="mr-2 h-5 w-5" />
                {isLoadingPricing
                  ? "Loading..."
                  : `Start Trial for ₹${getInitialPrice()}`}
              </Button>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <Shield className="h-4 w-4" />
                <span>100% Secure Payment</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Job Listings Section */}
      <section className="py-16 bg-white/90">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
              Get Priority Review on{" "}
              <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                Your Applications
              </span>
            </h2>
            <p className="text-xl text-gray-700">
              Latest job openings from top companies
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {jobListings.map((job, index) => (
              <Card
                key={index}
                className="bg-white border-gray-200 hover:border-yellow-400/50 transition-all shadow-lg"
              >
                <CardHeader>
                  <CardTitle className="text-gray-900 text-lg">
                    {job.title}
                  </CardTitle>
                  <CardDescription className="text-yellow-600 font-semibold">
                    {job.company}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{job.location}</span>
                    </div>
                    <div className="text-green-600 font-semibold">
                      {job.salary}
                    </div>
                  </div>
                  <Button
                    onClick={handleCTAClick}
                    className="w-full mt-4 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black hover:from-yellow-300 hover:to-yellow-500"
                  >
                    Apply with Priority
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Shark Tank Video Section */}
      <section className="py-20 relative z-10 bg-white/90">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold mb-4 text-sm px-4 py-2">
              As Seen on Shark Tank India 🦈
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
              Watch Our{" "}
              <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                Shark Tank Pitch
              </span>
            </h2>
            <p className="text-xl text-gray-700 mb-8">
              See how Beep Career impressed the sharks and secured investment
            </p>
          </div>

          <YouTubeVideo
            videoId="yMN3OgWNHAA"
            title="Beep Career Shark Tank India Pitch"
          />
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 relative z-10 bg-gradient-to-b from-white/90 to-gray-50/90">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
              Everything You Need to{" "}
              <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                Accelerate Your Career
              </span>
            </h2>
            <p className="text-xl text-gray-700">
              8 powerful tools to transform your job search
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <InteractiveCard
                key={index}
                icon={benefit.icon}
                title={benefit.title}
                description={benefit.description}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Freebies Section */}
      <section className="py-20 bg-gray-50/90">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold mb-4 text-sm px-4 py-2">
              Limited Time Bonuses
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
              <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                FREE Bonuses Worth ₹3,999
              </span>
            </h2>
            <p className="text-xl text-gray-700">
              Exclusive resources included with your Career Pro subscription
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {freebies.map((freebie, index) => (
              <Card
                key={index}
                className="bg-white/80 border-yellow-400/30 hover:border-yellow-400 transition-all shadow-lg"
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`${freebie.bgColor} w-10 h-10 rounded-lg flex items-center justify-center`}
                    >
                      <freebie.icon className="h-5 w-5 text-white" />
                    </div>
                    <Badge className="bg-green-600 text-white">
                      {freebie.value}
                    </Badge>
                  </div>
                  <CardTitle className="text-gray-900 text-lg">
                    {freebie.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-700">
                    {freebie.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button
              onClick={handleCTAClick}
              disabled={isLoadingPricing}
              className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold py-4 px-8 text-lg hover:from-yellow-300 hover:to-yellow-500 disabled:opacity-50"
            >
              <Gift className="mr-2 h-5 w-5" />
              {isLoadingPricing
                ? "Loading..."
                : `Claim All Bonuses for ₹${getInitialPrice()}`}
            </Button>
          </div>
        </div>
      </section>

      {/* WhatsApp Screenshots Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50/90 to-white/90">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
              Real Success Stories from{" "}
              <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                Our Community
              </span>
            </h2>
            <p className="text-xl text-gray-700">
              Live updates from our Career Pro members
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {whatsappChats.map((chat, index) => (
              <WhatsAppChat
                key={index}
                chats={[
                  {
                    name: chat.name,
                    avatar: chat.avatar,
                    bgColor: chat.bgColor,
                    isOnline: true,
                    messages: chat.messages.map((msg) => ({
                      type: msg.type as "sent" | "received",
                      text: msg.text,
                      time: msg.time,
                      isRead: msg.type === "sent" ? true : undefined,
                    })),
                  },
                ]}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50/90 to-white/90">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
              Success Stories from{" "}
              <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                Real Students
              </span>
            </h2>
            <p className="text-xl text-gray-700">
              See how Beep Career Pro transformed their careers
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card
                key={index}
                className="bg-white/80 border-gray-200 shadow-lg"
              >
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <CardTitle className="text-gray-900 text-lg">
                        {testimonial.name}
                      </CardTitle>
                      <CardDescription className="text-yellow-600">
                        {testimonial.role}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 italic">
                    "{testimonial.content}"
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Certificate Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="text-center md:text-left">
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">
                  Get your
                  <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                    {" "}
                    Certificate!
                  </span>
                </h2>
                <p className="text-lg text-gray-700 leading-relaxed">
                  Yes! You will be certified by Eventbeep which brings a lot of
                  credibility to your certificate &amp; resume.
                </p>
              </div>
              <div className="flex justify-center">
                <img
                  src="/lovable-uploads/cd314f75-00c8-4360-b16d-3de8582e8604.png"
                  alt="Certificate of Excellence"
                  className="max-w-full h-auto rounded-lg shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
                Frequently Asked{" "}
                <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                  Questions
                </span>
              </h2>
              <p className="text-lg text-gray-600">
                Everything you need to know about Career Pro
              </p>
            </div>

            <div className="space-y-4">
              {getFAQs().map((faq, index) => (
                <Collapsible
                  key={index}
                  open={openFaq === index}
                  onOpenChange={() =>
                    setOpenFaq(openFaq === index ? null : index)
                  }
                >
                  <CollapsibleTrigger className="w-full">
                    <Card className="bg-white border border-gray-200 hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow-md">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium text-gray-900 text-left pr-4">
                            {faq.question}
                          </h3>
                          <ChevronDown
                            className={`h-5 w-5 text-yellow-500 transition-transform duration-200 flex-shrink-0 ${
                              openFaq === index ? "transform rotate-180" : ""
                            }`}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-6 pb-6">
                      <p className="text-gray-600 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-br from-yellow-400/10 to-yellow-600/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-gray-900">
              Ready to Land Your{" "}
              <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                {getDynamicJobTitle()}?
              </span>
            </h2>
            <p className="text-xl text-gray-700 mb-8">
              Join thousands of successful students. Start your career
              transformation today.
            </p>

            <div className="bg-white/90 backdrop-blur p-8 rounded-2xl border border-yellow-400/20 max-w-lg mx-auto mb-8 shadow-lg">
              {isLoadingPricing ? (
                <div className="mb-6 animate-pulse">
                  <div className="h-10 bg-gray-200 rounded w-20 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-40"></div>
                </div>
              ) : (
                <div className="mb-6">
                  <div className="text-4xl font-bold text-yellow-600">
                    ₹{getInitialPrice()}
                  </div>
                  <div className="text-gray-500 line-through text-lg">
                    ₹{getActualPrice()}
                  </div>
                  <div className="text-green-600 font-semibold text-sm">
                    {getSubTitle()}
                  </div>
                  <div className="text-red-600 font-semibold">
                    Limited Time Offer!
                  </div>
                </div>
              )}
              <Button
                onClick={handleCTAClick}
                disabled={isLoadingPricing}
                className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold py-4 text-xl hover:from-yellow-300 hover:to-yellow-500 mb-4 disabled:opacity-50"
              >
                <Award className="mr-2 h-6 w-6" />
                {isLoadingPricing ? "Loading..." : "Start Your Success Journey"}
              </Button>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center justify-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span>100% Secure Payment</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>7-day Money Back Guarantee</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Briefcase className="h-4 w-4 text-yellow-600" />
                  <span>Built by Career Experts & Hiring Managers</span>
                </div>
              </div>
            </div>

            <p className="text-gray-600 text-sm">
              {isLoadingPricing ? (
                <span className="animate-pulse">
                  Loading pricing details...
                </span>
              ) : (
                `* Limited time offer. After trial, continue at ₹${getMonthlyPrice()}/month or cancel anytime.`
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Mobile bottom padding for sticky CTA */}
      <div className="h-20 md:h-0"></div>
    </div>
  );
};
export default Index;
