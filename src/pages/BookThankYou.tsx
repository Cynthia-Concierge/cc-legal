import { CheckCircle, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const BookThankYou = () => {
  const navigate = useNavigate();
  
  // Get form data from sessionStorage if available
  const formData = (() => {
    try {
      const stored = sessionStorage.getItem('book_call_form_data');
      if (stored) {
        const data = JSON.parse(stored);
        sessionStorage.removeItem('book_call_form_data'); // Clean up
        return data;
      }
    } catch (e) {
      console.error('Error reading form data:', e);
    }
    return null;
  })();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <CheckCircle className="h-10 w-10 text-white" />
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">
            🎉 Thank You! Your Call is Scheduled
          </h1>
          
          <p className="text-xl mb-6 text-slate-600">
            We're excited to speak with you about protecting your wellness business.
          </p>

          {formData && (
            <div className="bg-white rounded-lg p-6 mb-8 shadow-md border border-slate-200">
              <p className="text-slate-700 mb-2">
                <span className="font-semibold">Name:</span> {formData.name}
              </p>
              <p className="text-slate-700 mb-2">
                <span className="font-semibold">Email:</span> {formData.email}
              </p>
              <p className="text-slate-700">
                <span className="font-semibold">Phone:</span> {formData.phone}
              </p>
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-lg p-8 mb-8 text-left shadow-sm">
            <h3 className="font-bold text-slate-900 mb-6 text-xl text-center">What Happens Next?</h3>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Check Your Email</h4>
                  <p className="text-slate-600 text-sm">
                    You'll receive a confirmation email with your calendar invite and Zoom link for the call.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Prepare for the Call (Optional)</h4>
                  <p className="text-slate-600 text-sm">
                    Think about any legal concerns or "what if" scenarios you've been worried about. We'll discuss your specific business, current protections, and potential risks.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Join the Call</h4>
                  <p className="text-slate-600 text-sm">
                    We'll spend 15 minutes reviewing your business, identifying legal gaps, and discussing whether we're the right fit to help protect you.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold">
                    4
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Get Peace of Mind</h4>
                  <p className="text-slate-600 text-sm">
                    If it's a fit, we'll create a plan to get you legally protected. If not, you'll walk away with clarity on what you need.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Button
              onClick={() => navigate('/')}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold py-3 px-8 text-lg hover:from-emerald-500 hover:to-teal-500"
            >
              Return to Home
            </Button>
            <p className="text-sm text-slate-500">
              We look forward to speaking with you soon!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookThankYou;

