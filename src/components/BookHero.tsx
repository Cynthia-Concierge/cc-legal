import React, { useState, useEffect } from 'react';
import BookLeadForm from './BookLeadForm';
import { ShieldCheck, FileText, Camera, FileSignature, Lock } from 'lucide-react';

const DOCUMENTS = [
  {
    id: 'waiver',
    title: "Waiver of Liability",
    subtitle: "Safety & Protection",
    icon: ShieldCheck,
    color: "text-rose-600",
    bg: "bg-rose-50",
    iconBg: "bg-rose-100",
    borderColor: "border-rose-100",
    lines: [100, 90, 40, 95, 85, 50]
  },
  {
    id: 'contract',
    title: "Membership Contract",
    subtitle: "Service Agreement",
    icon: FileSignature,
    color: "text-blue-600",
    bg: "bg-blue-50",
    iconBg: "bg-blue-100",
    borderColor: "border-blue-100",
    lines: [95, 100, 80, 90, 40, 90]
  },
  {
    id: 'media',
    title: "Media Release Form",
    subtitle: "Marketing Rights",
    icon: Camera,
    color: "text-purple-600",
    bg: "bg-purple-50",
    iconBg: "bg-purple-100",
    borderColor: "border-purple-100",
    lines: [90, 85, 95, 60, 90, 70]
  },
  {
    id: 'privacy',
    title: "Privacy Policy",
    subtitle: "Data Protection",
    icon: Lock,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    iconBg: "bg-emerald-100",
    borderColor: "border-emerald-100",
    lines: [100, 90, 100, 80, 95, 60]
  }
];

interface BookHeroProps {
  onFormSubmit: (formData: {
    name: string;
    email: string;
    phone: string;
  }) => void;
  isSubmitting?: boolean;
}

const BookHero: React.FC<BookHeroProps> = ({ onFormSubmit, isSubmitting = false }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % DOCUMENTS.length);
    }, 3500); // Change document every 3.5 seconds
    return () => clearInterval(interval);
  }, []);

  const currentDoc = DOCUMENTS[currentIndex];

  return (
    <section className="relative min-h-screen pt-8 pb-24 sm:pb-28 md:pb-32 lg:pt-20 lg:pb-36 xl:pb-40 2xl:pb-44 overflow-visible bg-slate-50 isolate">
      <style>{`
        @keyframes slideUpFade {
          0% { opacity: 0; transform: translateY(20px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-slide-up-fade {
          animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes stamp {
          0% { opacity: 0; transform: scale(2) rotate(12deg); }
          50% { opacity: 1; transform: scale(0.9) rotate(12deg); }
          100% { transform: scale(1) rotate(12deg); }
        }
        .animate-stamp {
          animation: stamp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s backwards;
        }
      `}</style>

      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-50/50 via-slate-50 to-slate-100 z-0"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-96 h-96 bg-emerald-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-40"></div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10 overflow-visible">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-start lg:items-start relative overflow-visible">
          
          {/* Left Content */}
          <div className="w-full lg:w-3/5 space-y-8 text-center lg:text-left relative z-0">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-emerald-100 text-emerald-800 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
              <ShieldCheck className="w-4 h-4" />
              For Gym Owners & Wellness Businesses Only
            </div>

            <h1 className="text-4xl lg:text-6xl font-extrabold text-slate-900 leading-[1.1] tracking-tight font-serif">
              Protect Your Wellness Business <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">Before Something Goes Wrong</span>
            </h1>

            <p className="text-lg lg:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              On a short call, we review how your business operates, identify where you're legally exposed, and explain exactly what protection makes sense for you.
            </p>
            <p className="text-lg lg:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Trusted by <span className="font-semibold text-slate-900">1,000+ studios and retreat leaders</span>. Stop worrying about legal "what ifs" and focus on your community.
            </p>

            {/* Visual Document Representation */}
            <div className="hidden lg:flex flex-col relative mt-12 pl-4 items-center overflow-visible">
              <div className="relative w-full max-w-md h-64 mx-auto lg:mx-0 perspective-1000">
                {/* Paper Stack Effect */}
                <div className="absolute top-4 left-4 w-full h-full bg-slate-200 rounded-xl shadow-sm border border-slate-300 transform rotate-3 transition-transform duration-500"></div>
                <div className="absolute top-2 left-2 w-full h-full bg-slate-100 rounded-xl shadow-md border border-slate-200 transform rotate-1 transition-transform duration-500"></div>
                
                {/* Active Dynamic Card */}
                <div 
                  key={currentDoc.id}
                  className={`absolute top-0 left-0 w-full h-full bg-white rounded-xl shadow-2xl border ${currentDoc.borderColor} p-8 flex flex-col justify-between animate-slide-up-fade z-10`}
                >
                   {/* Header */}
                   <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 ${currentDoc.iconBg} rounded-xl flex items-center justify-center ${currentDoc.color} shrink-0`}>
                        <currentDoc.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-lg font-serif">{currentDoc.title}</h3>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{currentDoc.subtitle}</p>
                      </div>
                   </div>

                   {/* Abstract Lines */}
                   <div className="space-y-3 mt-2">
                      {currentDoc.lines.map((width, i) => (
                        <div 
                          key={i} 
                          className={`h-2 rounded-full ${i % 2 === 0 ? 'bg-slate-100' : 'bg-slate-50'}`} 
                          style={{ width: `${width}%` }}
                        ></div>
                      ))}
                   </div>
                   
                   {/* Footer */}
                   <div className="flex justify-between items-end mt-4 pt-4 border-t border-slate-50">
                      <div className="relative">
                        <div className="h-px w-32 bg-slate-800 mt-6 mb-1"></div>
                        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Authorized Signature</span>
                      </div>
                      <div className="w-20 h-20 -mb-4 -mr-2 rounded-full border-[3px] border-emerald-500/30 flex items-center justify-center animate-stamp bg-white/50 backdrop-blur-sm">
                         <div className="w-16 h-16 rounded-full border-2 border-emerald-600 flex items-center justify-center text-[9px] font-black text-emerald-700 uppercase text-center leading-none tracking-tight">
                            Legally<br/>Verified
                         </div>
                      </div>
                   </div>
                </div>

                {/* Decorative Arrow */}
                <div className="absolute -right-20 top-1/2 -translate-y-1/2 hidden xl:block overflow-visible">
                   <svg width="100" height="40" viewBox="0 0 100 40" fill="none" className="text-emerald-500/50">
                     <path d="M10 20 C 30 10, 70 10, 90 20" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" fill="none" />
                     <path d="M85 15 L 90 20 L 85 25" stroke="currentColor" strokeWidth="2" fill="none" />
                   </svg>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-4 text-center lg:text-left max-w-md">
                Examples of the types of protections we discuss on the call
              </p>
            </div>
          </div>

          {/* Right Form */}
          <div className="w-full lg:w-2/5 lg:sticky lg:top-8 self-start relative z-[100] overflow-visible">
            <BookLeadForm onSubmit={onFormSubmit} isSubmitting={isSubmitting} />
          </div>

        </div>
      </div>
    </section>
  );
};

export default BookHero;

