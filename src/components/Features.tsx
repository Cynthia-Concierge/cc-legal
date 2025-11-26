import React from 'react';
import { 
  FileCheck, 
  Handshake, 
  Briefcase, 
  Users, 
  Globe, 
  Camera, 
  Share2, 
  UserCheck,
  Scale
} from 'lucide-react';

const documents = [
  {
    icon: FileCheck,
    title: "Waiver / Release of Liability",
    description: "Ironclad protection covering injuries and accidents during gym workouts, training sessions, and equipment use."
  },
  {
    icon: Handshake,
    title: "Service / Membership Contract",
    description: "Clearly defines membership terms, payment schedules, cancellation policies, and gym rules to avoid disputes."
  },
  {
    icon: Briefcase,
    title: "Employment Agreement",
    description: "For staff who are employees — sets clear job terms, pay, expectations, and conduct standards."
  },
  {
    icon: UserCheck,
    title: "Independent Contractor Agreement",
    description: "Crucial for personal trainers and group instructors to ensure they aren't misclassified as employees."
  },
  {
    icon: Globe,
    title: "Terms & Conditions & Privacy",
    description: "Defines general business terms and protects user data on your website. Essential for online presence."
  },
  {
    icon: Camera,
    title: "Media Release Form",
    description: "Authorizes use of client photos, videos, and testimonials for marketing without legal backlash."
  },
  {
    icon: Share2,
    title: "Social Media Disclaimer",
    description: "Protects you from liability for comments, advice, or third-party content on your social channels."
  },
  {
    icon: Users,
    title: "Influencer Agreement",
    description: "If you partner with ambassadors or local influencers, this secures the terms of promotion."
  },
  {
    icon: Scale,
    title: "Testimonial Consent",
    description: "Covers the use of member transformation photos and success stories legally."
  }
];

const Features: React.FC = () => {
  return (
    <section className="py-24 bg-white relative">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="text-emerald-600 font-bold tracking-wider uppercase text-xs mb-3 block">Complete Protection Suite</span>
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">
            Get Every Legal Document You Need to <span className="text-emerald-600">Stay Protected</span>
          </h2>
          <p className="text-lg text-slate-600 leading-relaxed">
            Stop copy-pasting from the internet. These documents are attorney-drafted specifically for the fitness and wellness industry to cover your unique risks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
          {documents.map((doc, index) => (
            <div 
              key={index} 
              className="group p-8 rounded-2xl bg-white border border-slate-100 hover:border-emerald-200 shadow-sm hover:shadow-xl hover:shadow-emerald-100/40 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-sm group-hover:shadow-emerald-500/20">
                <doc.icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-emerald-700 transition-colors">
                {doc.title}
              </h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                {doc.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;

