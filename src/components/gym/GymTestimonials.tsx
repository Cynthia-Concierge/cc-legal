import React, { useState } from 'react';
import { Star } from 'lucide-react';

// Generate initials from a name
const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
        return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + (parts[parts.length - 1][0] || '')).toUpperCase();
};

const reviews = [
    {
        name: "Daniel Nahmias",
        role: "Gym Owner",
        text: "After completing an incredible week of coaching with Concious Counsel, I truly feel unstoppable.",
        date: "28 Nov, 2024",
    },
    {
        name: "Hoala Wellness",
        role: "Facility Manager",
        text: "Working with the team was a great experience. It has translated to greater confidence and security for my facility.",
        date: "15 Oct, 2024",
    },
    {
        name: "Connor Daly",
        role: "Strength Coach",
        text: "Quickly provided the documents I needed to protect my growing business. They communicated clearly and made the legal language easy.",
        date: "8 Jan, 2025",
    },
    {
        name: "Brian Sipotz",
        role: "Gym Owner",
        text: "In 12 years of owning my gym, I never had proper legal documents. Conscious Counsel made law fun and helped me finally get protected.",
        date: "13 Aug, 2024",
    },
    {
        name: "Shannon Barbaro",
        role: "Studio Owner",
        text: "⭐️⭐️⭐️⭐️⭐️ Highly Recommend Conscious Counsel. As a Pilates studio owner, finding legal support that understands fitness made a huge difference.",
        date: "17 Oct, 2024",
    },
    {
        name: "Sylvain Tremblay",
        role: "Gym Owner",
        text: "Cory Sterling and his team have been an invaluable part of our journey to legally protect our business.",
        date: "29 Jul, 2024",
    },
];

const GymTestimonials: React.FC = () => {
    return (
        <section className="py-20 bg-[#0B0F19] border-t border-slate-900">
            <div className="container mx-auto px-4 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <h2 className="text-3xl md:text-5xl font-black text-white mb-4 whitespace-nowrap uppercase tracking-tight">
                        OVER 500 WELLNESS BUSINESSES' LOVE US
                    </h2>
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="flex text-blue-500">
                            {[...Array(5)].map((_, i) => <Star key={i} fill="currentColor" className="w-6 h-6" />)}
                        </div>
                        <span className="font-bold text-slate-400">455 5-star reviews</span>
                    </div>
                    <p className="text-slate-500 font-light">
                        We have over 455 5-star Google reviews from satisfied gym owners who have protected their businesses with our legal documents.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {reviews.map((review, index) => {
                        const initials = getInitials(review.name);
                        return (
                            <div key={index} className="bg-[#0f172a] p-6 rounded-lg shadow-lg border border-slate-800 flex flex-col h-full hover:border-blue-900/50 transition-colors">
                                <div className="flex items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded bg-slate-800 text-blue-400 border border-slate-700 font-bold flex items-center justify-center text-base`}>
                                            {initials}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white text-sm">{review.name}</h4>
                                            <p className="text-blue-500 text-[10px] uppercase tracking-wider font-bold">{review.role}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex text-blue-500 mb-3">
                                    {[...Array(5)].map((_, i) => <Star key={i} fill="currentColor" className="w-3 h-3" />)}
                                </div>

                                <p className="text-slate-400 text-sm leading-relaxed flex-grow font-light">
                                    "{review.text}"
                                </p>

                                <div className="mt-4 text-[10px] text-slate-600 font-mono">
                                    {review.date}
                                </div>
                            </div>
                        );
                    })}
                </div>

            </div>
        </section>
    );
};

export default GymTestimonials;
