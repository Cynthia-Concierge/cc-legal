import React, { useState, useEffect } from 'react';
import { Shield, FileText, CheckCircle2, ArrowRight, X } from 'lucide-react';
import { Button } from './ui/Button';

interface WelcomeWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onQuickWin: () => void;
    userName?: string;
}

export const WelcomeWizard: React.FC<WelcomeWizardProps> = ({ isOpen, onClose, onQuickWin, userName }) => {
    const [step, setStep] = useState(1);

    if (!isOpen) return null;

    const nextStep = () => setStep(s => s + 1);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden relative animate-in zoom-in-95 duration-300">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <X size={20} />
                </button>

                {/* Content */}
                <div className="p-8">
                    {/* Step 1: Welcome */}
                    {step === 1 && (
                        <div className="text-center space-y-6">
                            <div className="w-16 h-16 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Shield size={32} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                                    Welcome{userName ? `, ${userName}` : ''}!
                                </h2>
                                <p className="text-slate-600 leading-relaxed">
                                    You've just unlocked your Personal Legal Command Center.
                                    We're here to help you protect your business, one step at a time.
                                </p>
                            </div>
                            <Button fullWidth size="lg" onClick={nextStep}>
                                Take a Quick Tour <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                        </div>
                    )}

                    {/* Step 2: The Tour */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-slate-900 text-center mb-6">
                                Your New Superpowers
                            </h2>

                            <div className="space-y-4">
                                <div className="flex gap-4 items-start">
                                    <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-lg flex-shrink-0 flex items-center justify-center">
                                        <CheckCircle2 size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900">Legal Health Score</h3>
                                        <p className="text-sm text-slate-600">Track your protection level. Aim for 100% to ensure your business is bulletproof.</p>
                                    </div>
                                </div>

                                <div className="flex gap-4 items-start">
                                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex-shrink-0 flex items-center justify-center">
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900">The Vault</h3>
                                        <p className="text-sm text-slate-600">Securely store your signed contracts and insurance policies in one private place.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4">
                                <Button fullWidth size="lg" onClick={nextStep}>
                                    Next <ArrowRight className="ml-2 w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Quick Win */}
                    {step === 3 && (
                        <div className="text-center space-y-6">
                            <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                                <FileText size={32} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                                    Let's Get a Quick Win
                                </h2>
                                <p className="text-slate-600 mb-6">
                                    Don't leave empty-handed. Let's draft your <strong>Social Media Disclaimer</strong> right now. It takes less than 1 minute.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <Button fullWidth size="lg" onClick={onQuickWin} className="bg-purple-600 hover:bg-purple-700">
                                    Draft Now (Free) <ArrowRight className="ml-2 w-4 h-4" />
                                </Button>
                                <button
                                    onClick={onClose}
                                    className="text-sm text-slate-400 hover:text-slate-600 font-medium"
                                >
                                    I'll do this later
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Progress Dots */}
                <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-center gap-2">
                    {[1, 2, 3].map(i => (
                        <div
                            key={i}
                            className={`w-2 h-2 rounded-full transition-colors ${step === i ? 'bg-brand-600' : 'bg-slate-300'}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};
