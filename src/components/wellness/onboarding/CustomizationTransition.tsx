import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { ArrowRight, CheckCircle } from 'lucide-react';

import confetti from 'canvas-confetti';

interface CustomizationTransitionProps {
    onNext: () => void;
}

export const CustomizationTransition: React.FC<CustomizationTransitionProps> = ({
    onNext
}) => {
    // Fire confetti once on mount
    useEffect(() => {
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
            <CardHeader className="text-center pb-2">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in duration-500">
                    <CheckCircle size={32} />
                </div>
                <CardTitle className="text-xl md:text-2xl text-slate-900 font-bold leading-tight">
                    That’s it — we’re customizing your documents now
                </CardTitle>
                <p className="text-slate-600 mt-2">
                    Next, we’ll review your website and finalize everything.
                </p>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                <Button
                    fullWidth
                    size="lg"
                    onClick={onNext}
                    className="bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-200"
                >
                    Review Website <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
            </CardContent>
        </Card>
    );
};
