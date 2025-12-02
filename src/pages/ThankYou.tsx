import { CheckCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import DynamicBackground from "@/components/DynamicBackground";

const ThankYou = () => {
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
            Your information has been received. You now have access to all the essential legal documents your fitness or wellness business needs.
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
};

export default ThankYou;

