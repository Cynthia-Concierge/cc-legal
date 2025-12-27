import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { BadgeCheck, AlertTriangle, ShieldCheck, Clock, Search, ChevronDown, CheckCircle2 } from 'lucide-react';

interface IpProtectionWidgetProps {
    onStartQuiz: () => void;
    hasTakenQuiz: boolean;
    score?: number;
    riskLevel?: string;
    onBookCall?: () => void;
}

export const IpProtectionWidget: React.FC<IpProtectionWidgetProps> = ({
    onStartQuiz,
    hasTakenQuiz,
    score = 0,
    riskLevel = 'High',
    onBookCall
}) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Card className="border-none shadow-md overflow-hidden bg-white transition-all duration-300">
            <div
                className="p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center justify-between gap-2">
                    <CardTitle className="flex items-center gap-2 text-slate-900 text-sm font-semibold">
                        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-xs font-bold">3</div>
                        Business Name & Trademark Check
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        {hasTakenQuiz ? (
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1">
                                <CheckCircle2 size={12} /> Report Ready
                            </span>
                        ) : (
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                Not Started
                            </span>
                        )}
                        <ChevronDown
                            className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                            size={18}
                        />
                    </div>
                </div>
                <p className="text-xs text-slate-500 mt-1 pl-7">
                    Check whether your business name is clear to use or could conflict with existing trademarks.
                </p>
            </div>

            {isOpen && (
                <CardContent className="p-4 animate-in slide-in-from-top-2 duration-300">
                    {hasTakenQuiz ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <div className={`p-2 rounded-full ${riskLevel.includes('HIGH') ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                    {riskLevel.includes('HIGH') ? <AlertTriangle size={20} /> : <ShieldCheck size={20} />}
                                </div>
                                <div>
                                    <div className="text-xs font-bold uppercase text-slate-500 mb-0.5">Risk Level</div>
                                    <div className={`font-bold ${riskLevel.includes('HIGH') ? 'text-red-700' : 'text-emerald-700'}`}>
                                        {riskLevel} Risk Detected
                                    </div>
                                </div>
                                <div className="ml-auto text-right">
                                    <div className="text-xs font-bold uppercase text-slate-500 mb-0.5">Score</div>
                                    <div className="font-bold text-slate-900">{score}/40</div>
                                </div>
                            </div>

                            <p className="text-sm text-slate-600">
                                Your preliminary trademark risk report has been sent to your email.
                            </p>

                            <div className="flex flex-col gap-2 sm:flex-row">
                                <Button
                                    onClick={onBookCall}
                                    variant="primary"
                                    size="sm"
                                    className="w-full bg-brand-600 hover:bg-brand-700 text-white"
                                >
                                    Book Strategy Call
                                </Button>
                                <Button
                                    onClick={onStartQuiz}
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                >
                                    Retake Quiz
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <h4 className="font-medium text-slate-900 mb-1 text-sm">Is your business name clear to use?</h4>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    We’ll take a quick look at your business name to see whether it could conflict with existing trademarks — and flag any potential concerns.
                                </p>
                            </div>

                            <Button
                                onClick={onStartQuiz}
                                variant="primary"
                                size="sm"
                                className="w-full bg-brand-600 hover:bg-brand-700 text-white"
                            >
                                👉 Check My Business Name
                            </Button>
                        </div>
                    )}
                </CardContent>
            )}
        </Card >
    );
};
