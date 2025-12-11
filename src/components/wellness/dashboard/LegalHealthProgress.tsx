import React from 'react';
import { Activity } from 'lucide-react';

interface LegalHealthProgressProps {
    score: number;
}

export const LegalHealthProgress: React.FC<LegalHealthProgressProps> = ({ score }) => {
    const getHealthLevel = (s: number) => {
        if (s >= 80) return { label: 'Excellent', color: 'text-emerald-600' };
        if (s >= 50) return { label: 'Good', color: 'text-brand-600' };
        if (s >= 20) return { label: 'Fair', color: 'text-orange-500' };
        return { label: 'Attention Needed', color: 'text-red-500' };
    };

    const { label, color } = getHealthLevel(score);

    return (
        <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Legal Health</p>
                <p className={`text-sm font-bold ${color}`}>{label}</p>
            </div>

            <div className="relative w-12 h-12 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                    <circle
                        className="text-slate-100"
                        strokeWidth="4"
                        stroke="currentColor"
                        fill="transparent"
                        r="20"
                        cx="24"
                        cy="24"
                    />
                    <circle
                        className={color.replace('text-', 'text-')}
                        strokeWidth="4"
                        strokeDasharray={125.6} // 2 * pi * 20
                        strokeDashoffset={125.6 - (125.6 * score) / 100}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="20"
                        cx="24"
                        cy="24"
                    />
                </svg>
                <Activity className={`absolute w-5 h-5 ${color}`} />
            </div>
        </div>
    );
};
