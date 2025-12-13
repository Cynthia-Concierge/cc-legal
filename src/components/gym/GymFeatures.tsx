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

const GymFeatures: React.FC = () => {
    return (
        <section className="py-24 bg-[#0B0F19] relative border-t border-slate-800">
            <div className="container mx-auto px-4 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <span className="text-blue-500 font-bold tracking-widest uppercase text-xs mb-3 block">Complete Protection Suite</span>
                    <h2 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight uppercase">
                        Get Every Legal Document You Need to <span className="text-blue-500">Stay Protected</span>
                    </h2>
                    <p className="text-lg text-slate-400 leading-relaxed font-light">
                        Stop copy-pasting from the internet. These documents are attorney-drafted specifically for the fitness and wellness industry to cover your unique risks.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
                    {documents.map((doc, index) => (
                        <div
                            key={index}
                            className="group p-8 rounded-xl bg-[#0f172a] border border-slate-800 hover:border-blue-500/50 shadow-lg hover:shadow-blue-900/20 transition-all duration-300 hover:-translate-y-1"
                        >
                            <div className="w-14 h-14 bg-slate-900 border border-slate-800 text-blue-500 rounded-lg flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-sm group-hover:shadow-blue-500/20">
                                <doc.icon className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">
                                {doc.title}
                            </h3>
                            <p className="text-slate-400 leading-relaxed text-sm font-light">
                                {doc.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default GymFeatures;
