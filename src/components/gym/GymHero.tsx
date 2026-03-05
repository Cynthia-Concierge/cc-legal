import React, { useState, useEffect } from 'react';
import GymLeadForm from './GymLeadForm';
import { ShieldCheck, Dumbbell, FileSignature, CheckCircle } from 'lucide-react';

interface GymHeroProps {
    onFormSubmit: (formData: {
        name: string;
        email: string;
        phone: string;
        website: string;
        consentSms: boolean;
        consentEmail: boolean;
    }) => void;
}

const GymHero: React.FC<GymHeroProps> = ({ onFormSubmit }) => {
    return (
        <section className="relative pt-12 pb-16 lg:pt-24 lg:pb-32 overflow-hidden bg-[#05060A]">
            {/* Background Gradients */}
            <div className="absolute top-0 right-0 w-2/3 h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/10 via-[#05060A] to-[#05060A] z-0"></div>

            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.05] pointer-events-none"></div>

            <div className="container mx-auto px-4 lg:px-8 relative z-10">
                <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-center lg:items-start">

                    {/* Left Content */}
                    <div className="w-full lg:w-3/5 space-y-8 text-center lg:text-left pt-4">
                        <div className="inline-flex items-center gap-2 bg-[#1e293b]/50 border border-blue-900/30 text-blue-400 px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest mb-2">
                            <ShieldCheck className="w-3 h-3" />
                            For Gym Owners & Facility Managers
                        </div>

                        <h1 className="text-4xl lg:text-7xl font-black text-white leading-[0.95] tracking-tighter uppercase font-sans">
                            The Essential Legal<br />
                            Defense For <span className="text-blue-500">Gym Owners.</span>
                        </h1>

                        <p className="text-lg lg:text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-light">
                            Don't let one injury lawsuit bankrupt your facility. Get the exact <span className="text-white font-medium">liability waivers, membership contracts, and staff agreements</span> used by 1,000+ rugged gyms and fitness centers.
                        </p>

                        {/* Visual Document Representation - Dark Mode */}
                        <div className="hidden lg:flex relative mt-16 pl-4 h-80 items-center">
                            <div className="relative w-full max-w-md h-64 mx-auto lg:mx-0 perspective-1000 group">
                                {/* Paper Stack Effect */}
                                <div className="absolute top-3 left-3 w-full h-full bg-slate-800 rounded-lg opacity-40 transform rotate-2"></div>
                                <div className="absolute top-1.5 left-1.5 w-full h-full bg-slate-700/80 rounded-lg opacity-60 transform rotate-1"></div>

                                {/* Active Dynamic Card */}
                                <div className="absolute top-0 left-0 w-full h-full bg-[#0f172a] rounded-lg shadow-2xl border border-blue-500/30 p-8 flex flex-col justify-between z-10">
                                    {/* Header */}
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-[#0f172a] border border-blue-500/20 rounded-lg flex items-center justify-center text-blue-500 shrink-0">
                                            <Dumbbell className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-extrabold text-white text-xl uppercase tracking-tight">Gym Liability Waiver</h3>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Injury & Equipment Protection</p>
                                        </div>
                                    </div>

                                    {/* Abstract Lines */}
                                    <div className="space-y-3 mt-4 opacity-30">
                                        <div className="h-1.5 bg-slate-600 rounded-full w-full"></div>
                                        <div className="h-1.5 bg-slate-600 rounded-full w-[92%]"></div>
                                        <div className="h-1.5 bg-slate-600 rounded-full w-[96%]"></div>
                                        <div className="h-1.5 bg-slate-600 rounded-full w-[80%]"></div>
                                    </div>

                                    {/* Footer */}
                                    <div className="flex justify-between items-end mt-4 pt-4 border-t border-slate-800/50">
                                        <div className="relative">
                                            <div className="h-px w-32 bg-slate-600 mt-6 mb-1"></div>
                                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Authorized Signature</span>
                                        </div>
                                        {/* Ironclad Badge */}
                                        <div className="w-16 h-16 -mb-6 -mr-4 rounded-full border-2 border-blue-600 flex items-center justify-center transform -rotate-12 bg-[#0f172a] shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                                            <div className="text-[8px] font-black text-blue-500 uppercase text-center leading-none tracking-tighter">
                                                Ironclad<br />Approved
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Form */}
                    <div className="w-full lg:w-2/5 lg:sticky lg:top-8 z-20">
                        <GymLeadForm onSubmit={onFormSubmit} />
                    </div>

                </div>
            </div>
        </section>
    );
};

export default GymHero;
