import { CheckCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import DynamicBackground from "@/components/DynamicBackground";
import { useNavigate } from "react-router-dom";

const ThankYou = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-white text-black">
      <DynamicBackground />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-gradient-to-r from-teal-500 to-emerald-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-teal-500 to-emerald-600 bg-clip-text text-transparent">
            🎉 Thank You — Your Legal Templates Are Unlocked!
          </h1>
          <p className="text-xl mb-6 text-gray-700">
            To customize your agreements and generate the documents that fit your business, tell us a little about your studio, wellness brand, or service.
          </p>
          <p className="text-lg mb-6 text-gray-600">
            This takes 20 seconds and ensures your contracts are tailored correctly.
          </p>
          <div className="bg-gray-100 p-6 rounded-lg mb-8 border">
            <h3 className="text-lg font-semibold mb-4 text-teal-600">
              What's Next:
            </h3>
            <div className="space-y-3 text-left">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-gray-800">
                  Personalize your agreements
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-gray-800">
                  Recommend the most important documents for your business
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-gray-800">
                  Unlock the templates best matched to your operations
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-gray-800">
                  Prepare the rest of your legal setup inside your dashboard
                </span>
              </div>
            </div>
          </div>
          <div className="flex justify-center">
            <Button
              onClick={() => navigate("/wellness/onboarding?skipWelcome=true")}
              className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold py-3 px-8 text-lg hover:from-teal-400 hover:to-emerald-500"
            >
              <ShieldCheck className="mr-2 h-5 w-5" />
              Get Your Customized Agreements
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThankYou;



