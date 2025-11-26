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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  ChevronUp,
  Zap,
  Briefcase,
  Award,
  FileCheck,
  Handshake,
  FileSignature,
  Globe,
  Camera,
  Share2,
  UserCheck,
  Scale,
} from "lucide-react";
import DynamicBackground from "@/components/DynamicBackground";
import DocumentAnimation from "@/components/DocumentAnimation";

// Mini document animation templates
const miniDocTemplates = [
  {
    title: "Waiver / Release of Liability",
    category: "⚖️ Core Legal",
    icon: "FileCheck"
  },
  {
    title: "Service Agreement",
    category: "⚖️ Core Legal",
    icon: "Handshake"
  },
  {
    title: "Employment Agreement",
    category: "⚖️ Core Legal",
    icon: "Briefcase"
  },
  {
    title: "Independent Contractor",
    category: "⚖️ Core Legal",
    icon: "FileSignature"
  },
  {
    title: "Terms & Conditions",
    category: "⚖️ Core Legal",
    icon: "Globe"
  },
  {
    title: "Media Release Form",
    category: "📸 Marketing",
    icon: "Camera"
  },
];

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
const GymOwners = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [monthlyPlan, setMonthlyPlan] = useState<PricingPlan | null>(null);
  const [isLoadingPricing, setIsLoadingPricing] = useState(true);
  const [showAllTestimonials, setShowAllTestimonials] = useState(false);
  const [miniDocIndex, setMiniDocIndex] = useState(0);
  const [isMiniAnimating, setIsMiniAnimating] = useState(false);
  const [isMiniShuffling, setIsMiniShuffling] = useState(false);

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

  // Mini document icon mapping
  const getMiniDocIcon = (iconName: string) => {
    const iconMap: { [key: string]: JSX.Element } = {
      FileCheck: <FileCheck className="w-4 h-4 text-teal-600" />,
      Handshake: <Handshake className="w-4 h-4 text-emerald-600" />,
      Briefcase: <Briefcase className="w-4 h-4 text-teal-600" />,
      FileSignature: <FileSignature className="w-4 h-4 text-emerald-600" />,
      Globe: <Globe className="w-4 h-4 text-teal-600" />,
      Camera: <Camera className="w-4 h-4 text-emerald-600" />,
    };
    return iconMap[iconName] || <FileCheck className="w-4 h-4 text-teal-600" />;
  };

  // Mini document animation
  useEffect(() => {
    const interval = setInterval(() => {
      setIsMiniAnimating(true);
      setIsMiniShuffling(true);
      
      setTimeout(() => {
        setMiniDocIndex((prev) => (prev + 1) % miniDocTemplates.length);
        setIsMiniAnimating(false);
        
        setTimeout(() => {
          setIsMiniShuffling(false);
        }, 100);
      }, 400);
    }, 3000);
    return () => clearInterval(interval);
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

  // Handle scroll to form section
  const handleScrollToForm = () => {
    const formSection = document.getElementById("enter-your-info-form");
    if (formSection) {
      formSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
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

  // Simulate payment success for demo
  const handlePayment = () => {
    setShowPaymentSuccess(true);
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

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
  const testimonials = [
    {
      name: "Daniel Nahmias",
      handle: "Google Review",
      content:
        "After completing an incredible week of coaching with Cory and Conscious Counsel, I truly feel unstoppable.",
      image: "https://ui-avatars.com/api?name=Daniel+Nahmias&background=random",
      timestamp: "2:15 PM Dec 15, 2024",
    },
    {
      name: "Hoala Wellness Consulting",
      handle: "Google Review",
      content:
        "Working with Cory and the team at Conscious Counsel was a great experience. I'm really happy with my documents and it has translated to greater confidence and security for me in my coaching practice. Everyone is extremely helpful and professional. So glad I found them!",
      image: "https://ui-avatars.com/api?name=Hoala+Wellness&background=random",
      timestamp: "10:30 AM Dec 12, 2024",
    },
    {
      name: "Connor Daly",
      handle: "Google Review",
      content:
        "Cory and the team at Conscious Counsel worked quickly to provide the documents I needed to protect my growing business. They communicated clearly and made the legal language easy to understand, which I really appreciated.",
      image: "https://ui-avatars.com/api?name=Connor+Daly&background=random",
      timestamp: "4:45 PM Dec 10, 2024",
    },
    {
      name: "Parnita",
      handle: "Google Review",
      content:
        "The first word that comes to mind when I reflect on my experience with Conscious Counsel is WOW! One of the best decisions I have ever made. I don't have a background in business or legal things, but they made everything clear, supportive, and easy.",
      image: "https://ui-avatars.com/api?name=Parnita&background=random",
      timestamp: "11:20 AM Dec 8, 2024",
    },
    {
      name: "Philippe Kirouac",
      handle: "Google Review",
      content:
        "The team at Conscious Counsel were so easy to work with. Thank you Cory and team for truly leading with your heart and helping me solve all my legal issues with dignity and respect.",
      image: "https://ui-avatars.com/api?name=Philippe+Kirouac&background=random",
      timestamp: "9:10 AM Dec 5, 2024",
    },
    {
      name: "Muskoka Mermaid",
      handle: "Google Review",
      content:
        "When I reached out to Conscious Counsel, I needed a legal document turned around quickly. Cory and his team connected with me right away to make sure they fully understood what I needed. They taught me so much throughout the process!",
      image: "https://ui-avatars.com/api?name=Muskoka+Mermaid&background=random",
      timestamp: "3:30 PM Dec 3, 2024",
    },
    {
      name: "Jake Cheney",
      handle: "Google Review",
      content:
        "Conscious Counsel has been attentive, positive, and quick to answer any and all questions I've had every step of the way. Tracy and the whole team have been an indispensable resource.",
      image: "https://ui-avatars.com/api?name=Jake+Cheney&background=random",
      timestamp: "1:15 PM Dec 1, 2024",
    },
    {
      name: "Jessica Bartley",
      handle: "Google Review",
      content:
        "We have had a wonderful experience working with Conscious Counsel. The agreements they've created for us are so easy to read and understand and truly capture the essence of what we are trying to communicate.",
      image: "https://ui-avatars.com/api?name=Jessica+Bartley&background=random",
      timestamp: "10:45 AM Nov 28, 2024",
    },
    {
      name: "Michelle Carter",
      handle: "Google Review",
      content:
        "Working with Conscious Counsel was so easy. They provided the documents I needed in a timely manner. The team is fantastic—quick to respond to questions and provide solid advice based on my niche. Highly recommend!",
      image: "https://ui-avatars.com/api?name=Michelle+Carter&background=random",
      timestamp: "2:20 PM Nov 25, 2024",
    },
    {
      name: "Olivia Barata Cavalcanti",
      handle: "Google Review",
      content:
        "Cory has provided well-rounded, informed, and true support every step of the way and made everything more intelligible and achievable.",
      image: "https://ui-avatars.com/api?name=Olivia+Cavalcanti&background=random",
      timestamp: "5:00 PM Nov 22, 2024",
    },
    {
      name: "Karyn Stillwell",
      handle: "Google Review",
      content:
        "Working with Conscious Counsel was a pleasure. They made the arduous and stressful task of creating official documents for my retreat easy. They were understanding and flexible when I needed more time.",
      image: "https://ui-avatars.com/api?name=Karyn+Stillwell&background=random",
      timestamp: "8:30 AM Nov 20, 2024",
    },
    {
      name: "Mahalia A",
      handle: "Google Review",
      content:
        "As a first-time business owner navigating complex dynamics, working with Cory has been such a relief. He's thoughtful, encouraging, and works tirelessly to make sure I feel supported.",
      image: "https://ui-avatars.com/api?name=Mahalia+A&background=random",
      timestamp: "12:10 PM Nov 18, 2024",
    },
    {
      name: "Ashley John",
      handle: "Google Review",
      content:
        "Working with Cory and his team has been grounding and empowering. Cory is sharp, honest, and direct—exactly what you want in a lawyer when navigating something complex and emotionally charged.",
      image: "https://ui-avatars.com/api?name=Ashley+John&background=random",
      timestamp: "3:45 PM Nov 15, 2024",
    },
    {
      name: "Joanna Mansour",
      handle: "Google Review",
      content:
        "Starting a business can be scary. Cory and team have been awesome since our first interaction. I am looking forward to a very bright future working with Conscious Counsel.",
      image: "https://ui-avatars.com/api?name=Joanna+Mansour&background=random",
      timestamp: "11:00 AM Nov 12, 2024",
    },
    {
      name: "Dana Shaked",
      handle: "Google Review",
      content:
        "Opening my own gym was a big step, and I knew I needed an attorney who truly understood the unique needs of the fitness industry. Conscious Counsel protected me and my business with clarity and care.",
      image: "https://ui-avatars.com/api?name=Dana+Shaked&background=random",
      timestamp: "9:25 AM Nov 10, 2024",
    },
    {
      name: "Autumn Enloe",
      handle: "Google Review",
      content:
        "I worked with Conscious Counsel to update my legal documents for my gym. The whole process was smooth, helpful, and quick. They made legal language easy to understand.",
      image: "https://ui-avatars.com/api?name=Autumn+Enloe&background=random",
      timestamp: "4:15 PM Nov 8, 2024",
    },
    {
      name: "Darko Sikman",
      handle: "Google Review",
      content:
        "Cory and his team are amazing. The quality of advice and service is stellar, and what sets them apart is how accessible and human they make the whole process. Clear, actionable guidance delivered with warmth.",
      image: "https://ui-avatars.com/api?name=Darko+Sikman&background=random",
      timestamp: "1:30 PM Nov 5, 2024",
    },
    {
      name: "Zebrina Piper",
      handle: "Google Review",
      content:
        "I'm so grateful nothing went wrong in my business before getting legitimate legal documents. Conscious Counsel made the process easy and enjoyable, and now I feel fully protected.",
      image: "https://ui-avatars.com/api?name=Zebrina+Piper&background=random",
      timestamp: "10:10 AM Nov 3, 2024",
    },
    {
      name: "Tom Clancy",
      handle: "Google Review",
      content:
        "Cory and his team are incredible to work with. Their efficiencies and processes make everything a breeze. Thanks for everything!",
      image: "https://ui-avatars.com/api?name=Tom+Clancy&background=random",
      timestamp: "2:50 PM Nov 1, 2024",
    },
    {
      name: "Eshael Johnson",
      handle: "Google Review",
      content:
        "I have enjoyed working with Cory and his colleagues. They are knowledgeable and kind. It gives me comfort knowing they understand my business and speak my language.",
      image: "https://ui-avatars.com/api?name=Eshael+Johnson&background=random",
      timestamp: "8:20 AM Oct 29, 2024",
    },
    {
      name: "Marya",
      handle: "Google Review",
      content:
        "Obtaining legal documents when starting a business felt overwhelming, but the process was seamless and straightforward with Conscious Counsel. They answered all of my questions promptly and made everything easy.",
      image: "https://ui-avatars.com/api?name=Marya&background=random",
      timestamp: "3:40 PM Oct 27, 2024",
    },
    {
      name: "Holley Crooks",
      handle: "Google Review",
      content:
        "So happy to be working with Conscious Counsel as I open my gym. They are responsive, ready to listen, and made the legal setup incredibly easy. They covered every detail.",
      image: "https://ui-avatars.com/api?name=Holley+Crooks&background=random",
      timestamp: "11:15 AM Oct 25, 2024",
    },
    {
      name: "Stephen Ferrer",
      handle: "Google Review",
      content:
        "Probably the best decision for my business. Nothing like having confidence in conducting business and not second guessing whether you're protected. Conscious Counsel made our documents perfect.",
      image: "https://ui-avatars.com/api?name=Stephen+Ferrer&background=random",
      timestamp: "5:30 PM Oct 22, 2024",
    },
    {
      name: "LeeAna Theberg",
      handle: "Google Review",
      content:
        "Cory and his team are magicians—in a good way! They protect small businesses like mine with heart, clarity, and care. I feel so protected now.",
      image: "https://ui-avatars.com/api?name=LeeAna+Theberg&background=random",
      timestamp: "9:45 AM Oct 20, 2024",
    },
    {
      name: "Jacqueline Lloyd",
      handle: "Google Review",
      content:
        "I needed solid legal documents for my gym. Conscious Counsel truly understands the fitness industry and knew exactly what needed to be included.",
      image: "https://ui-avatars.com/api?name=Jacqueline+Lloyd&background=random",
      timestamp: "1:20 PM Oct 18, 2024",
    },
    {
      name: "Gretchen Wagoner",
      handle: "Google Review",
      content:
        "Conscious Counsel made getting legal documents for my gym and my trainer agreements easy and quick. They always respond promptly to any questions.",
      image: "https://ui-avatars.com/api?name=Gretchen+Wagoner&background=random",
      timestamp: "4:00 PM Oct 15, 2024",
    },
    {
      name: "Tim Wohlberg",
      handle: "Google Review",
      content:
        "Working with Cory and his team was fantastic. The process was seamless, and they made protecting our business easy. Highly recommend.",
      image: "https://ui-avatars.com/api?name=Tim+Wohlberg&background=random",
      timestamp: "10:30 AM Oct 13, 2024",
    },
    {
      name: "HANKS Series",
      handle: "Google Review",
      content:
        "Cory was a great help on this project! Very easy to work with. Highly recommend Conscious Counsel for trademarks.",
      image: "https://ui-avatars.com/api?name=HANKS+Series&background=random",
      timestamp: "2:15 PM Oct 10, 2024",
    },
    {
      name: "Rhonda Yancey",
      handle: "Google Review",
      content:
        "I've been working with Tracy as the editor for my legal documents; she is dependable and efficient. It's a pleasure to have her assist me throughout this project.",
      image: "https://ui-avatars.com/api?name=Rhonda+Yancey&background=random",
      timestamp: "8:50 AM Oct 8, 2024",
    },
    {
      name: "Melissa Kakavas",
      handle: "Google Review",
      content:
        "Working with Cory and his team has been a great experience. They were patient, thorough, and communicated clearly. I have peace of mind knowing they have my back.",
      image: "https://ui-avatars.com/api?name=Melissa+Kakavas&background=random",
      timestamp: "3:25 PM Oct 5, 2024",
    },
    {
      name: "Danielle Kepics",
      handle: "Google Review",
      content:
        "I've been working with Conscious Counsel since day one of my business, when I had no idea what I was doing. They recommended only what I needed and always had my back.",
      image: "https://ui-avatars.com/api?name=Danielle+Kepics&background=random",
      timestamp: "11:40 AM Oct 3, 2024",
    },
    {
      name: "Cadenza Wang",
      handle: "Google Review",
      content:
        "Thank you for helping me put together my legal documents—and for making the process fun!",
      image: "https://ui-avatars.com/api?name=Cadenza+Wang&background=random",
      timestamp: "5:10 PM Oct 1, 2024",
    },
    {
      name: "Annie Rodriguez",
      handle: "Google Review",
      content:
        "Everyone at Conscious Counsel was kind, thorough, and quick to respond. I felt well taken care of every step of the way. I only regret not calling sooner!",
      image: "https://ui-avatars.com/api?name=Annie+Rodriguez&background=random",
      timestamp: "9:20 AM Sep 28, 2024",
    },
    {
      name: "Vince Gabriele",
      handle: "Google Review",
      content:
        "Conscious Counsel are the lawyers I trust. After many projects with them for my own companies, I made them the only law firm I refer my clients to.",
      image: "https://ui-avatars.com/api?name=Vince+Gabriele&background=random",
      timestamp: "1:45 PM Sep 25, 2024",
    },
    {
      name: "Rochelle Blain",
      handle: "Google Review",
      content:
        "Cory's legal presentation was clear, supportive, and informative. I chose to work with him when I started my business, and to this day I still return for support.",
      image: "https://ui-avatars.com/api?name=Rochelle+Blain&background=random",
      timestamp: "7:30 AM Sep 22, 2024",
    },
    {
      name: "Chase Miller",
      handle: "Google Review",
      content:
        "They made the entire legal process feel clear, supportive, and seamless. Truly grateful for their guidance in building the foundation of my business.",
      image: "https://ui-avatars.com/api?name=Chase+Miller&background=random",
      timestamp: "4:20 PM Sep 20, 2024",
    },
    {
      name: "Melissa McNamara",
      handle: "Google Review",
      content:
        "I've had the best experience with Cory. He went above and beyond to help me with my gym. I've recommended him to everyone I know in the fitness industry.",
      image: "https://ui-avatars.com/api?name=Melissa+McNamara&background=random",
      timestamp: "10:55 AM Sep 18, 2024",
    },
    {
      name: "Tami Tomlinson",
      handle: "Google Review",
      content:
        "They expertly guided me through filing a trademark and preparing my legal documents. Their support gave me so much confidence and peace of mind.",
      image: "https://ui-avatars.com/api?name=Tami+Tomlinson&background=random",
      timestamp: "2:30 PM Sep 15, 2024",
    },
    {
      name: "Jason McQuarrie",
      handle: "Google Review",
      content:
        "Choosing Conscious Counsel was the best decision I could've made. Coming from the film world, I had no idea how to begin. They guided me with clarity and support.",
      image: "https://ui-avatars.com/api?name=Jason+McQuarrie&background=random",
      timestamp: "8:15 AM Sep 12, 2024",
    },
    {
      name: "Virginia Martin",
      handle: "Google Review",
      content:
        "I appreciate the attentiveness of the entire team. Each business is unique, and their prompt attention to my specific priorities and concerns is reassuring.",
      image: "https://ui-avatars.com/api?name=Virginia+Martin&background=random",
      timestamp: "3:50 PM Sep 10, 2024",
    },
    {
      name: "Amy de Sa",
      handle: "Google Review",
      content:
        "They provided excellent service and legal documents for my business. They were attentive, detailed, and responded quickly.",
      image: "https://ui-avatars.com/api?name=Amy+de+Sa&background=random",
      timestamp: "11:25 AM Sep 8, 2024",
    },
    {
      name: "Shannon Barbaro",
      handle: "Google Review",
      content:
        "As a gym owner, finding legal support that understands the fitness industry is invaluable. Conscious Counsel made everything easy, fast, and thorough.",
      image: "https://ui-avatars.com/api?name=Shannon+Barbaro&background=random",
      timestamp: "6:00 PM Sep 5, 2024",
    },
    {
      name: "Sylvain Tremblay",
      handle: "Google Review",
      content:
        "Cory Sterling and his team have been invaluable in protecting our business legally. Their guidance has been essential.",
      image: "https://ui-avatars.com/api?name=Sylvain+Tremblay&background=random",
      timestamp: "9:40 AM Sep 3, 2024",
    },
    {
      name: "Julie",
      handle: "Google Review",
      content:
        "I wanted updated legal documents in place so I could focus on helping my clients. Conscious Counsel made the process smooth and supportive.",
      image: "https://ui-avatars.com/api?name=Julie&background=random",
      timestamp: "1:10 PM Sep 1, 2024",
    },
    {
      name: "Becky Keen",
      handle: "Google Review",
      content:
        "I needed contracts written and was so happy I found Cory. He was easy to talk to, worked quickly, and took a huge load off my plate. It's possible to love your lawyer—Cory makes it happen!",
      image: "https://ui-avatars.com/api?name=Becky+Keen&background=random",
      timestamp: "4:45 PM Aug 29, 2024",
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
  if (showThankYou) {
    return (
      <div className="min-h-screen bg-white text-black">
        <DynamicBackground />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-gradient-to-r from-teal-500 to-emerald-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-teal-500 to-emerald-600 bg-clip-text text-transparent">
              Thank You!
            </h1>
            <p className="text-xl mb-6 text-gray-700">
              Your information has been received. You now have access to all the essential legal documents your gym needs.
            </p>
            <div className="bg-gray-100 p-6 rounded-lg mb-8 border">
              <h3 className="text-lg font-semibold mb-4 text-teal-600">
                What's Next:
              </h3>
              <div className="space-y-3 text-left">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-gray-800">
                    Access your free legal document templates below
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-gray-800">
                    Check your email for exclusive bonuses worth $3,999
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-gray-800">
                    No email? Be sure to check your spam folder
                  </span>
                </div>
              </div>
            </div>
            <Button
              onClick={() => window.open("https://docs.google.com/document/d/1QgS6mlBz5UdvaNbY754mM89To3I5IKRm-DFk7G_PJ6o/edit?tab=t.0#heading=h.yo57svpji26v", "_blank")}
              className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold py-3 px-8 text-lg hover:from-teal-400 hover:to-emerald-500"
            >
              <FileText className="mr-2 h-5 w-5" />
              Access Free Templates Now
            </Button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen text-black overflow-hidden relative">
      <DynamicBackground />

      {/* Sticky CTA Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-teal-500/30 to-emerald-600/30 backdrop-blur-md border-t border-white/20 p-3 z-50 md:hidden shadow-lg">
        <Button
          onClick={handleScrollToForm}
          className="w-full bg-black/80 backdrop-blur-sm text-teal-300 font-semibold py-2.5 text-sm uppercase tracking-wide hover:bg-black/90 transition-all"
        >
          Get your free templates now
        </Button>
      </div>

      {/* Header with Logo */}
      <header className="bg-gray-900 z-40 text-gray-900 inset-0">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-center mt-4">
            <img
              src="/redirect_to.png"
              alt="Beep"
              className="h-20 w-auto"
            />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-white/95 via-gray-50/95 to-white/95 pt-12">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-emerald-600/5"></div>
        <div className="max-w-screen-xl mx-auto px-4 pb-12 relative z-10">
          {/* Title Section - Centered at Top */}
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="bg-gradient-to-r from-teal-500 via-teal-600 to-emerald-600 text-white font-semibold mb-2 text-sm px-4 py-2 animate-subtle-pulse animate-gradient inline-block">
              FOR GYM OWNERS ONLY
            </Badge>
            <h1 className="text-[38px] font-bold mb-4 leading-tight text-gray-900 mt-0">
              THE MUST-HAVE LEGAL DOCUMENTS EVERY <span className="bg-gradient-to-r from-teal-500 to-emerald-600 bg-clip-text text-transparent">GYM</span> OWNER
              NEEDS TO AVOID A LAWSUIT
            </h1>
            <p className="text-base md:text-lg text-gray-700 leading-relaxed mt-0 mb-0">
              Get the exact waivers, contracts, and policies Conscious Counsel
              uses to protect 1,000+ gyms and fitness facilities—so you can stop worrying about legal "what ifs" and
              focus on growing your membership base.
            </p>
          </div>

          {/* Two Column Layout */}
          <div className="grid md:grid-cols-2 gap-8 items-center max-w-7xl mx-auto mt-6">
            {/* Left Column - Document Animation */}
            <div className="flex justify-center md:justify-start">
              <DocumentAnimation />
            </div>

            {/* Right Column - Form Capture */}
            <div className="w-full flex justify-center md:justify-end">
              <div id="enter-your-info-form" className="bg-gradient-to-br from-teal-500/40 to-emerald-600/40 backdrop-blur-md p-5 rounded-2xl border border-white/20 shadow-2xl max-w-md w-full scroll-mt-20">
                <h2 className="text-2xl font-bold text-slate-900 mb-1.5">
                  ENTER YOUR INFO
                </h2>
                <p className="text-slate-800 mb-4 text-sm">
                  And we'll send you instant access to all the essential legal documents your gym needs — plus exclusive bonuses worth $3,999.
                </p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setShowThankYou(true);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="space-y-3"
                >
                  <div>
                    <Label className="text-slate-900 text-sm font-medium mb-2 block">
                      Name*
                    </Label>
                    <Input
                      type="text"
                      required
                      className="w-full bg-white/80 border-gray-300/50 text-slate-900 placeholder:text-gray-500 focus:ring-teal-400"
                      placeholder="Enter your name"
                    />
                  </div>

                  <div>
                    <Label className="text-slate-900 text-sm font-medium mb-2 block">
                      Email*
                    </Label>
                    <Input
                      type="email"
                      required
                      className="w-full bg-white/80 border-gray-300/50 text-slate-900 placeholder:text-gray-500 focus:ring-teal-400"
                      placeholder="Enter your email"
                    />
                  </div>

                  <div>
                    <Label className="text-slate-900 text-sm font-medium mb-2 block">
                      Phone Number*
                    </Label>
                    <Input
                      type="tel"
                      required
                      className="w-full bg-white/80 border-gray-300/50 text-slate-900 placeholder:text-gray-500 focus:ring-teal-400"
                      placeholder="Enter your phone number"
                    />
                  </div>

                  <div>
                    <Label className="text-slate-900 text-sm font-medium mb-2 block">
                      Website*
                    </Label>
                    <Input
                      type="url"
                      required
                      className="w-full bg-white/80 border-gray-300/50 text-slate-900 placeholder:text-gray-500 focus:ring-teal-400"
                      placeholder="https://yourwebsite.com"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoadingPricing}
                    className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-bold py-4 text-lg hover:from-teal-400 hover:to-emerald-500 disabled:opacity-50 transition-all"
                  >
                    <Zap className="mr-2 h-5 w-5" />
                    {isLoadingPricing ? "Loading..." : "Yes! Give Me The Documents!"}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Legal Documents Section */}
      <section className="py-10 bg-white/90">
        <div className="container mx-auto px-4">
          <div className="text-center mb-6">
            <h2 className="text-3xl md:text-5xl font-bold mb-3 text-gray-900">
              Get Every Legal Document You Need to{" "}
              <span className="bg-gradient-to-r from-teal-500 to-emerald-600 bg-clip-text text-transparent">
                Stay Protected
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <Card className="bg-white border-gray-300 hover:border-teal-400/50 transition-all duration-300 group cursor-pointer relative overflow-hidden shadow-lg hover:-translate-y-2 hover:scale-[1.02]"
              style={{
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(20, 184, 166, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
              }}
            >
              <div 
                className="absolute inset-0 bg-gradient-to-br from-teal-400/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
              <CardHeader className="relative z-10">
                <div 
                  className="bg-gradient-to-r from-teal-500 to-emerald-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-5 group-hover:[box-shadow:0_8px_20px_rgba(20,184,166,0.4)]"
                >
                  <FileCheck className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-gray-900 text-lg transition-colors duration-300">
                  Waiver / Release of Liability
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <CardDescription className="text-gray-700 transition-colors duration-300">
                  Covers injuries and accidents during gym workouts, training sessions, and equipment use.
                </CardDescription>
              </CardContent>
              <div 
                className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-teal-500 to-emerald-600 transition-all duration-500 w-0 group-hover:w-full"
              />
            </Card>

            <Card className="bg-white border-gray-300 hover:border-teal-400/50 transition-all duration-300 group cursor-pointer relative overflow-hidden shadow-lg hover:-translate-y-2 hover:scale-[1.02]"
              style={{
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(20, 184, 166, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
              }}
            >
              <div 
                className="absolute inset-0 bg-gradient-to-br from-teal-400/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
              <CardHeader className="relative z-10">
                <div 
                  className="bg-gradient-to-r from-teal-500 to-emerald-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-5 group-hover:[box-shadow:0_8px_20px_rgba(20,184,166,0.4)]"
                >
                  <Handshake className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-gray-900 text-lg transition-colors duration-300">
                  Service Agreement / Membership Contract
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <CardDescription className="text-gray-700 transition-colors duration-300">
                  Defines membership terms, payment schedules, cancellation policies, and gym rules.
                </CardDescription>
              </CardContent>
              <div 
                className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-teal-500 to-emerald-600 transition-all duration-500 w-0 group-hover:w-full"
              />
            </Card>

            <Card className="bg-white border-gray-300 hover:border-teal-400/50 transition-all duration-300 group cursor-pointer relative overflow-hidden shadow-lg hover:-translate-y-2 hover:scale-[1.02]"
              style={{
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(20, 184, 166, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
              }}
            >
              <div 
                className="absolute inset-0 bg-gradient-to-br from-teal-400/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
              <CardHeader className="relative z-10">
                <div 
                  className="bg-gradient-to-r from-teal-500 to-emerald-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-5 group-hover:[box-shadow:0_8px_20px_rgba(20,184,166,0.4)]"
                >
                  <Briefcase className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-gray-900 text-lg transition-colors duration-300">
                  Employment Agreement
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <CardDescription className="text-gray-700 transition-colors duration-300">
                  For staff who are employees — sets clear job terms, pay, and conduct.
                </CardDescription>
              </CardContent>
              <div 
                className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-teal-500 to-emerald-600 transition-all duration-500 w-0 group-hover:w-full"
              />
            </Card>

            <Card className="bg-white border-gray-300 hover:border-teal-400/50 transition-all duration-300 group cursor-pointer relative overflow-hidden shadow-lg hover:-translate-y-2 hover:scale-[1.02]"
              style={{
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(20, 184, 166, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
              }}
            >
              <div 
                className="absolute inset-0 bg-gradient-to-br from-teal-400/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
              <CardHeader className="relative z-10">
                <div 
                  className="bg-gradient-to-r from-teal-500 to-emerald-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-5 group-hover:[box-shadow:0_8px_20px_rgba(20,184,166,0.4)]"
                >
                  <FileSignature className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-gray-900 text-lg transition-colors duration-300">
                  Independent Contractor Agreement
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <CardDescription className="text-gray-700 transition-colors duration-300">
                  For personal trainers, group fitness instructors, and independent contractors at your gym.
                </CardDescription>
              </CardContent>
              <div 
                className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-teal-500 to-emerald-600 transition-all duration-500 w-0 group-hover:w-full"
              />
            </Card>

            <Card className="bg-white border-gray-300 hover:border-teal-400/50 transition-all duration-300 group cursor-pointer relative overflow-hidden shadow-lg hover:-translate-y-2 hover:scale-[1.02]"
              style={{
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(20, 184, 166, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
              }}
            >
              <div 
                className="absolute inset-0 bg-gradient-to-br from-teal-400/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
              <CardHeader className="relative z-10">
                <div 
                  className="bg-gradient-to-r from-teal-500 to-emerald-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-5 group-hover:[box-shadow:0_8px_20px_rgba(20,184,166,0.4)]"
                >
                  <Globe className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-gray-900 text-lg transition-colors duration-300">
                  Terms & Conditions, Privacy Policy, Disclaimer
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <CardDescription className="text-gray-700 transition-colors duration-300">
                  Defines general business terms, policies, and user rights.
                </CardDescription>
              </CardContent>
              <div 
                className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-teal-500 to-emerald-600 transition-all duration-500 w-0 group-hover:w-full"
              />
            </Card>

            <Card className="bg-white border-gray-300 hover:border-teal-400/50 transition-all duration-300 group cursor-pointer relative overflow-hidden shadow-lg hover:-translate-y-2 hover:scale-[1.02]"
              style={{
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(20, 184, 166, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
              }}
            >
              <div 
                className="absolute inset-0 bg-gradient-to-br from-teal-400/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
              <CardHeader className="relative z-10">
                <div 
                  className="bg-gradient-to-r from-teal-500 to-emerald-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-5 group-hover:[box-shadow:0_8px_20px_rgba(20,184,166,0.4)]"
                >
                  <Camera className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-gray-900 text-lg transition-colors duration-300">
                  Media Release Form
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <CardDescription className="text-gray-700 transition-colors duration-300">
                  Authorizes use of client photos, videos, and testimonials.
                </CardDescription>
              </CardContent>
              <div 
                className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-teal-500 to-emerald-600 transition-all duration-500 w-0 group-hover:w-full"
              />
            </Card>

            <Card className="bg-white border-gray-300 hover:border-teal-400/50 transition-all duration-300 group cursor-pointer relative overflow-hidden shadow-lg hover:-translate-y-2 hover:scale-[1.02]"
              style={{
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(20, 184, 166, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
              }}
            >
              <div 
                className="absolute inset-0 bg-gradient-to-br from-teal-400/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
              <CardHeader className="relative z-10">
                <div 
                  className="bg-gradient-to-r from-teal-500 to-emerald-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-5 group-hover:[box-shadow:0_8px_20px_rgba(20,184,166,0.4)]"
                >
                  <Share2 className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-gray-900 text-lg transition-colors duration-300">
                  Social Media Disclaimer
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <CardDescription className="text-gray-700 transition-colors duration-300">
                  Protects you from liability for comments, advice, or third-party content online.
                </CardDescription>
              </CardContent>
              <div 
                className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-teal-500 to-emerald-600 transition-all duration-500 w-0 group-hover:w-full"
              />
            </Card>

            <Card className="bg-white border-gray-300 hover:border-teal-400/50 transition-all duration-300 group cursor-pointer relative overflow-hidden shadow-lg hover:-translate-y-2 hover:scale-[1.02]"
              style={{
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(20, 184, 166, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
              }}
            >
              <div 
                className="absolute inset-0 bg-gradient-to-br from-teal-400/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
              <CardHeader className="relative z-10">
                <div 
                  className="bg-gradient-to-r from-teal-500 to-emerald-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-5 group-hover:[box-shadow:0_8px_20px_rgba(20,184,166,0.4)]"
                >
                  <Users className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-gray-900 text-lg transition-colors duration-300">
                  Influencer / Collaboration Agreement
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <CardDescription className="text-gray-700 transition-colors duration-300">
                  If you partner with ambassadors or local influencers for marketing.
                </CardDescription>
              </CardContent>
              <div 
                className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-teal-500 to-emerald-600 transition-all duration-500 w-0 group-hover:w-full"
              />
            </Card>

            <Card className="bg-white border-gray-300 hover:border-teal-400/50 transition-all duration-300 group cursor-pointer relative overflow-hidden shadow-lg hover:-translate-y-2 hover:scale-[1.02]"
              style={{
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(20, 184, 166, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
              }}
            >
              <div 
                className="absolute inset-0 bg-gradient-to-br from-teal-400/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
              <CardHeader className="relative z-10">
                <div 
                  className="bg-gradient-to-r from-teal-500 to-emerald-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-5 group-hover:[box-shadow:0_8px_20px_rgba(20,184,166,0.4)]"
                >
                  <UserCheck className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-gray-900 text-lg transition-colors duration-300">
                  Testimonial Consent & Use Agreement
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <CardDescription className="text-gray-700 transition-colors duration-300">
                  Covers use of member transformation photos, workout videos, and gym success stories.
                </CardDescription>
              </CardContent>
              <div 
                className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-teal-500 to-emerald-600 transition-all duration-500 w-0 group-hover:w-full"
              />
            </Card>

            <Card className="bg-white border-gray-300 hover:border-teal-400/50 transition-all duration-300 group cursor-pointer relative overflow-hidden shadow-lg hover:-translate-y-2 hover:scale-[1.02]"
              style={{
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(20, 184, 166, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
              }}
            >
              <div 
                className="absolute inset-0 bg-gradient-to-br from-teal-400/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
              <CardHeader className="relative z-10">
                <div 
                  className="bg-gradient-to-r from-teal-500 to-emerald-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-5 group-hover:[box-shadow:0_8px_20px_rgba(20,184,166,0.4)]"
                >
                  <Scale className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-gray-900 text-lg transition-colors duration-300">
                  Trademark & IP Protection Guide
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <CardDescription className="text-gray-700 transition-colors duration-300">
                  Explains how to protect your gym logo, brand name, workout programs, and training methodologies.
                </CardDescription>
              </CardContent>
              <div 
                className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-teal-500 to-emerald-600 transition-all duration-500 w-0 group-hover:w-full"
              />
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-3xl md:text-5xl font-bold mb-3 text-gray-900">
                OVER 500 GYM OWNERS LOVE US
              </h2>
              {/* Compact Rating Display */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="h-4 w-4 fill-teal-500 text-teal-500"
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-900 font-medium">
                  455 5-star reviews
                </span>
              </div>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
                We have over 455 5-star Google reviews from satisfied gym owners who have protected their businesses with our legal documents.
              </p>
            </div>

            {/* Testimonials Grid */}
            <div className="grid md:grid-cols-3 gap-4">
              {(showAllTestimonials ? testimonials : testimonials.slice(0, 9)).map((testimonial, index) => (
                <Card
                  key={index}
                  className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative"
                >
                  {/* Google Logo in top right */}
                  <div className="absolute top-4 right-4">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                  </div>

                  <CardContent className="p-6">
                    {/* Profile Section */}
                    <div className="flex items-center gap-3 mb-4">
                      <img
                        src={testimonial.image}
                        alt={testimonial.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <CardTitle className="text-gray-900 text-base font-semibold mb-0">
                          {testimonial.name}
                        </CardTitle>
                        <CardDescription className="text-gray-500 text-sm mt-0">
                          {testimonial.handle}
                        </CardDescription>
                      </div>
                    </div>

                    {/* Testimonial Text */}
                    <p className="text-gray-700 text-sm leading-relaxed mb-4">
                      {testimonial.content}
                    </p>

                    {/* Timestamp */}
                    <p className="text-gray-400 text-xs">
                      {testimonial.timestamp || "10:10 AM Nov 19, 2023"}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* See More/Less Button */}
            {testimonials.length > 9 && (
              <div className="text-center mt-6">
                <Button
                  onClick={() => setShowAllTestimonials(!showAllTestimonials)}
                  variant="outline"
                  className="border-gray-300 text-gray-900 hover:bg-gray-50 font-semibold px-8 py-3 rounded-lg"
                >
                  {showAllTestimonials ? "See less" : "See more"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-12 bg-gradient-to-b from-white/90 to-gray-50/90">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            {/* Top Headline */}
            <div className="text-center mb-6">
              <h2 className="text-3xl md:text-5xl font-bold mb-3 text-gray-900">
                HERE'S EVERYTHING THAT YOU WILL BE GETTING
              </h2>
            </div>

            {/* Main Content Grid */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Left Side - Features List */}
              <div className="bg-white border border-gray-200 shadow-lg p-6 rounded-2xl">
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                  🔥 When You're Legally Protected, You Get All This:
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-700 text-base">
                      Protection From Injury & Lawsuit Claims
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-700 text-base">
                      Bulletproof Membership & Payment Terms
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-700 text-base">
                      Clarity With Staff, Trainers & Contractors
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-700 text-base">
                      Safe, Legal Use of Client Photos & Testimonials
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-700 text-base">
                      A Fully Compliant Website & Online Business
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-700 text-base">
                      Clear Policies That Actually Protect You
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-700 text-base">
                      Full IP & Brand Protection
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-700 text-base">
                      Zero Guesswork Around "What Form Do I Need?"
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-700 text-base">
                      A Professional, Legit Business Clients Trust
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-700 text-base">
                      Peace of Mind Knowing You're Fully Covered
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Side - Pricing & CTA */}
              <div className="flex flex-col">
                <div className="bg-white border border-gray-200 shadow-lg p-6 rounded-2xl mb-4 flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Bonuses Included:
                  </h3>
                  <div className="space-y-4 mb-6">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-gray-900 font-semibold">
                          Free Legal Audit & Consultation Call
                        </p>
                        <p className="text-gray-600 text-sm">
                          A 15-minute expert review to identify gaps, answer questions, and show you exactly what to fix first.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-gray-900 font-semibold">
                          Done-For-You Implementation Checklist
                        </p>
                        <p className="text-gray-600 text-sm">
                          A simple step-by-step guide showing you how to roll out all your legal documents in under 10 minutes.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-gray-900 font-semibold">
                          Automatic Annual Legal Update Alerts
                        </p>
                        <p className="text-gray-600 text-sm">
                          Stay protected with yearly notifications about important changes in gym and fitness industry law — no work required on your part.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pricing Card */}
                <div className="bg-white border border-teal-400/30 shadow-lg p-6 rounded-xl">
                  {isLoadingPricing ? (
                    <div className="animate-pulse space-y-4">
                      <div className="h-8 bg-gray-200 rounded w-32 mx-auto"></div>
                      <div className="h-6 bg-gray-200 rounded w-24 mx-auto"></div>
                      <div className="h-12 bg-gray-200 rounded"></div>
                    </div>
                  ) : (
                    <>
                      {/* Mini Animated Document Card */}
                      <div className="mb-4 relative">
                        <div 
                          className="relative"
                          style={{
                            transform: 'perspective(800px) rotateY(-3deg) rotateX(3deg)',
                            transformStyle: 'preserve-3d'
                          }}
                        >
                          {/* Back layer for depth */}
                          <div 
                            className={`absolute top-1.5 -left-1 -right-1 -bottom-1.5 bg-gray-100 border border-gray-200 rounded-lg transition-all duration-500`}
                            style={{
                              transform: isMiniShuffling ? 'translateZ(-20px) translateY(-4px) translateX(3px)' : 'translateZ(-20px)'
                            }}
                          />
                          
                          {/* Main document */}
                          <div className="relative bg-white border border-gray-200 rounded-lg p-4 shadow-md">
                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                              <div 
                                className={`w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                                  isMiniAnimating ? 'scale-90' : 'scale-100'
                                }`}
                              >
                                <div 
                                  className={`transition-opacity duration-300 ${
                                    isMiniAnimating ? 'opacity-0' : 'opacity-100'
                                  }`}
                                >
                                  {getMiniDocIcon(miniDocTemplates[miniDocIndex].icon)}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0 overflow-hidden">
                                <div className="font-semibold text-sm text-gray-900 h-5 overflow-hidden">
                                  <div 
                                    className={`transition-all duration-500 ease-in-out ${
                                      isMiniAnimating ? 'opacity-0 -translate-y-full' : 'opacity-100 translate-y-0'
                                    }`}
                                  >
                                    {miniDocTemplates[miniDocIndex].title}
                                  </div>
                                </div>
                                <div className="text-[10px] text-gray-500 uppercase tracking-wide h-4 overflow-hidden">
                                  <div 
                                    className={`transition-all duration-500 ease-in-out delay-100 ${
                                      isMiniAnimating ? 'opacity-0 -translate-y-full' : 'opacity-100 translate-y-0'
                                    }`}
                                  >
                                    {miniDocTemplates[miniDocIndex].category}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="space-y-1.5 mb-3">
                              <div 
                                className={`h-1.5 bg-gray-100 rounded-full transition-all duration-500 origin-left ${
                                  isMiniAnimating ? 'scale-x-0 opacity-0' : 'scale-x-100 opacity-100'
                                }`}
                                style={{ transitionDelay: '50ms' }}
                              ></div>
                              <div 
                                className={`h-1.5 bg-gray-100 rounded-full w-[85%] transition-all duration-500 origin-left ${
                                  isMiniAnimating ? 'scale-x-0 opacity-0' : 'scale-x-100 opacity-100'
                                }`}
                                style={{ transitionDelay: '100ms' }}
                              ></div>
                              <div 
                                className={`h-1.5 bg-gray-100 rounded-full w-[92%] transition-all duration-500 origin-left ${
                                  isMiniAnimating ? 'scale-x-0 opacity-0' : 'scale-x-100 opacity-100'
                                }`}
                                style={{ transitionDelay: '150ms' }}
                              ></div>
                            </div>
                            
                            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                              <div>
                                <div 
                                  className={`w-16 h-0.5 bg-emerald-500 mb-0.5 transition-all duration-500 origin-left ${
                                    isMiniAnimating ? 'scale-x-0' : 'scale-x-100'
                                  }`}
                                  style={{ transitionDelay: '200ms' }}
                                ></div>
                                <div className="text-[9px] text-gray-500 uppercase tracking-wider">Signature</div>
                              </div>
                              <div 
                                className={`w-10 h-10 border-2 border-emerald-500 rounded-full flex items-center justify-center transition-all duration-500 ${
                                  isMiniAnimating ? 'scale-75 -rotate-12 opacity-0' : 'scale-100 rotate-0 opacity-100'
                                }`}
                                style={{ transitionDelay: '150ms' }}
                              >
                                <span className="text-[7px] text-emerald-600 font-semibold uppercase tracking-tight text-center leading-[1.1] px-0.5">
                                  Legally<br/>Verified
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        onClick={handleScrollToForm}
                        disabled={isLoadingPricing}
                        className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-bold py-4 text-lg hover:from-teal-400 hover:to-emerald-500 mb-4 disabled:opacity-50"
                      >
                        <Shield className="mr-2 h-5 w-5" />
                        {isLoadingPricing ? "Loading..." : "GET ALL LEGAL DOCUMENTS NOW"}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile bottom padding for sticky CTA */}
      <div className="h-20 md:h-0"></div>
    </div>
  );
};
export default GymOwners;
