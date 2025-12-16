import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { FileText, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { DocumentItem } from '../../../types/wellness';
import confetti from 'canvas-confetti';

interface RecommendationSummaryProps {
    recommendations: DocumentItem[];
    onContinue: () => void;
}

export const RecommendationSummary: React.FC<RecommendationSummaryProps> = ({
    recommendations,
    onContinue
}) => {
    // Fire confetti once on mount
    React.useEffect(() => {
        const duration = 2000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => {
            return Math.random() * (max - min) + min;
        }

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            // since particles fall down, start a bit higher than random
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
            });
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
            });
        }, 250);

        return () => clearInterval(interval);
    }, []);

    return (
        <Card className="w-full max-w-lg mx-auto shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardHeader className="text-center space-y-2 pb-2">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <ShieldCheck size={28} />
                </div>
                <CardTitle className="text-xl md:text-2xl text-slate-900 font-bold leading-tight">
                    Here’s What Your Business Needs to Be Protected
                </CardTitle>
                <p className="text-slate-600">
                    Based on the answers you just gave us:
                </p>
            </CardHeader>

            <CardContent className="space-y-6">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                    {recommendations.length > 0 ? (
                        recommendations.map((doc) => (
                            <div key={doc.id} className="flex items-start gap-3">
                                <div className="mt-0.5 min-w-[20px] text-emerald-600">
                                    <CheckCircle2 size={20} />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-slate-800 text-sm leading-snug">
                                        {doc.title}
                                    </h4>
                                    <p className="text-xs text-slate-500 leading-snug mt-0.5">
                                        {doc.description}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-slate-500 text-center italic">
                            Your standard protection package is ready.
                        </p>
                    )}
                </div>

                <Button
                    fullWidth
                    size="lg"
                    onClick={onContinue}
                    className="bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-200"
                >
                    Generate My Custom Documents <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
            </CardContent>
        </Card>
    );
};
