import React from 'react';
import { CheckCircle2, Check, Bell, BookOpen, Clock, Gift } from 'lucide-react';

interface ValueStackProps {
  onGetDocumentsClick?: () => void;
}

const ValueStack: React.FC<ValueStackProps> = ({ onGetDocumentsClick }) => {
  const handleScrollToForm = () => {
    if (onGetDocumentsClick) {
      onGetDocumentsClick();
    } else {
      const formElement = document.getElementById('enter-your-info-form');
      if (formElement) {
        const yOffset = -20; // Small offset from top
        const y = formElement.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }
  };

  return (
    <section className="py-24 bg-white border-t border-slate-200 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-slate-50 skew-x-12 transform translate-x-1/4 z-0"></div>
      
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        
        <div className="text-center max-w-4xl mx-auto mb-16">
          <span className="inline-block py-1 px-3 rounded-full bg-slate-900 text-white text-xs font-bold uppercase tracking-widest mb-4">Total Value: $3,999+</span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900">
            HERE'S EVERYTHING THAT YOU WILL BE GETTING
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-20">
          
          {/* Left: Core Benefits */}
          <div className="bg-white p-8 md:p-10 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50">
            <div className="flex items-center gap-3 mb-8 pb-8 border-b border-slate-100">
              <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center text-rose-500 text-xl">🔥</div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">
                  Legal Protection Suite
                </h3>
                <p className="text-slate-500 text-sm">Everything you need to sleep at night</p>
              </div>
            </div>
            
            <ul className="space-y-5">
              {[
                "Protection From Injury & Lawsuit Claims",
                "Bulletproof Membership & Payment Terms",
                "Clarity With Staff, Trainers & Contractors",
                "Safe, Legal Use of Client Photos & Testimonials",
                "A Fully Compliant Website & Online Business",
                "Clear Policies That Actually Protect You",
                "Full IP & Brand Protection",
                "Zero Guesswork Around 'What Form Do I Need?'",
                "Peace of Mind Knowing You're Fully Covered"
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-4 group">
                  <div className="mt-1 bg-emerald-100 rounded-full p-1 group-hover:bg-emerald-500 transition-colors duration-300">
                     <CheckCircle2 className="w-4 h-4 text-emerald-600 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <span className="text-base text-slate-700 font-medium group-hover:text-slate-900 transition-colors">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: Bonuses */}
          <div className="flex flex-col gap-6">
            <div className="bg-slate-900 p-8 rounded-3xl text-white relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
               <div className="flex items-center gap-3 mb-6">
                 <Gift className="w-6 h-6 text-emerald-400" />
                 <h3 className="text-2xl font-bold">Exclusive Bonuses Included</h3>
               </div>
               <p className="text-slate-400 mb-0">We don't just give you documents. We give you the strategy and implementation support to use them correctly.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border-2 border-emerald-50 hover:border-emerald-200 transition-colors shadow-lg shadow-emerald-500/5 flex gap-5 items-start">
              <div className="bg-emerald-100 p-3 rounded-xl shrink-0">
                <Clock className="w-6 h-6 text-emerald-700" />
              </div>
              <div>
                <h4 className="font-bold text-lg text-slate-900 mb-1">Free Legal Audit & Consultation Call</h4>
                <p className="text-slate-600 text-sm leading-relaxed">A 15-minute expert review to identify gaps, answer questions, and show you exactly what to fix first.</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border-2 border-emerald-50 hover:border-emerald-200 transition-colors shadow-lg shadow-emerald-500/5 flex gap-5 items-start">
              <div className="bg-emerald-100 p-3 rounded-xl shrink-0">
                <BookOpen className="w-6 h-6 text-emerald-700" />
              </div>
              <div>
                <h4 className="font-bold text-lg text-slate-900 mb-1">Done-For-You Implementation Checklist</h4>
                <p className="text-slate-600 text-sm leading-relaxed">A simple step-by-step guide showing you how to roll out all your legal documents in under 10 minutes.</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border-2 border-emerald-50 hover:border-emerald-200 transition-colors shadow-lg shadow-emerald-500/5 flex gap-5 items-start">
              <div className="bg-emerald-100 p-3 rounded-xl shrink-0">
                <Bell className="w-6 h-6 text-emerald-700" />
              </div>
              <div>
                <h4 className="font-bold text-lg text-slate-900 mb-1">Automatic Annual Legal Update Alerts</h4>
                <p className="text-slate-600 text-sm leading-relaxed">Stay protected with yearly notifications about important changes in gym and fitness industry law.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Final CTA Box */}
        <div className="max-w-5xl mx-auto bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 md:p-16 shadow-2xl relative overflow-hidden text-center md:text-left flex flex-col md:flex-row items-center gap-8 md:gap-16">
           {/* Abstract pattern */}
           <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
           
           <div className="relative z-10 flex-1">
             <h3 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
               Secure Your Gym's <span className="text-emerald-400">Future</span> Today
             </h3>
             <p className="text-slate-300 text-lg mb-8 max-w-xl">
               Don't wait for a lawsuit to happen. Join 1,000+ wellness professionals who are fully protected.
             </p>
             <button 
               onClick={handleScrollToForm}
               className="w-full md:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-4 px-10 rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.3)] transform hover:-translate-y-1 transition-all flex items-center justify-center gap-2 text-lg"
             >
               <Check className="w-6 h-6" />
               GET ALL LEGAL DOCUMENTS NOW
             </button>
           </div>

           {/* Visual */}
           <div className="relative z-10 hidden md:block w-64 shrink-0 transform rotate-6 hover:rotate-0 transition-transform duration-500">
              <div className="bg-white p-6 rounded-2xl shadow-xl border-t-8 border-emerald-500">
                 <div className="flex justify-between items-center mb-6">
                    <div className="w-8 h-8 rounded-full bg-slate-100"></div>
                    <div className="w-16 h-2 bg-slate-100 rounded-full"></div>
                 </div>
                 <div className="space-y-3 mb-8">
                    <div className="h-2 w-full bg-slate-100 rounded-full"></div>
                    <div className="h-2 w-full bg-slate-100 rounded-full"></div>
                    <div className="h-2 w-3/4 bg-slate-100 rounded-full"></div>
                    <div className="h-2 w-full bg-slate-100 rounded-full"></div>
                 </div>
                 <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Authorized</div>
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                 </div>
              </div>
           </div>
        </div>

      </div>
    </section>
  );
};

export default ValueStack;

