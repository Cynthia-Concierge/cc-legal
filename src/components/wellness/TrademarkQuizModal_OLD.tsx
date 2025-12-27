import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { X, ShieldAlert, CheckCircle2, ArrowRight, Search, Phone, ChevronRight, ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from '../ui/sonner';

interface TrademarkQuizModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (score: number, risk: string, quizData?: { answers: number[], answerDetails: any[] }) => void;
    businessName?: string;
    onBookCall?: () => void;
}

const questions = [
    {
        id: 1,
        text: "Have you officially registered your business name as a Trademark?",
        options: [
            { text: "Yes, I have a registration certificate", score: 0 },
            { text: "No, but I registered my LLC/DBA", score: 5 },
            { text: "No, I haven't done anything yet", score: 5 }
        ]
    },
    {
        id: 2,
        text: "Have you checked if anyone else is using a similar name in your industry?",
        options: [
            { text: "Yes, I did a full federal search", score: 0 },
            { text: "I googled it and it looked clear", score: 3 },
            { text: "No, I haven't checked", score: 5 }
        ]
    },
    {
        id: 3,
        text: "Do you own the .com domain for your business name?",
        options: [
            { text: "Yes, I own it", score: 0 },
            { text: "No, someone else owns it", score: 3 },
            { text: "I haven't checked", score: 2 }
        ]
    },
    {
        id: 4,
        text: "Are you planning to expand your business to other states or online?",
        options: [
            { text: "Yes, definitely", score: 3 },
            { text: "Maybe in the future", score: 1 },
            { text: "No, staying local only", score: 0 }
        ]
    },
    {
        id: 5,
        text: "How did you come up with your brand name?",
        options: [
            { text: "Completely invented word", score: 0 },
            { text: "Combination of words", score: 1 },
            { text: "Common dictionary word", score: 2 },
            { text: "Describes the service directly", score: 3 }
        ]
    },
    {
        id: 6,
        text: "Does your brand name include a city, location, or region?",
        options: [
            { text: "Yes", score: 2 },
            { text: "No", score: 0 }
        ]
    },
    {
        id: 7,
        text: "How long have you been using this brand name?",
        options: [
            { text: "Less than 6 months", score: 2 },
            { text: "6–24 months", score: 1 },
            { text: "Over 2 years", score: 0 }
        ]
    },
    {
        id: 8,
        text: "Where is your brand currently used? (Select all that apply)",
        options: [
            { text: "Website", score: 0, multiSelect: true },
            { text: "Social media", score: 0, multiSelect: true },
            { text: "Physical location", score: 0, multiSelect: true },
            { text: "Paid ads", score: 0, multiSelect: true },
            { text: "Merchandise", score: 0, multiSelect: true }
        ],
        isMultiSelect: true
    },
    {
        id: 9,
        text: "Do you plan to expand your business?",
        options: [
            { text: "Stay local only", score: 0 },
            { text: "Expand to other states", score: 2 },
            { text: "Sell online nationwide", score: 3 },
            { text: "Franchise or license", score: 4 }
        ]
    },
    {
        id: 10,
        text: "Have you invested (or plan to invest) in branding?",
        options: [
            { text: "Logo design", score: 0, multiSelect: true },
            { text: "Website", score: 0, multiSelect: true },
            { text: "Advertising", score: 0, multiSelect: true },
            { text: "Rebrand", score: 0, multiSelect: true },
            { text: "Not yet", score: 1, multiSelect: true }
        ],
        isMultiSelect: true
    },
    {
        id: 11,
        text: "Have you ever received confusion, complaints, or questions about your brand name?",
        options: [
            { text: "Yes", score: 3 },
            { text: "No", score: 0 }
        ]
    },
    {
        id: 12,
        text: "Is your brand name different from your legal business name?",
        options: [
            { text: "Yes", score: 1 },
            { text: "No", score: 0 },
            { text: "Not sure", score: 2 }
        ]
    },
    {
        id: 13,
        text: "Have you worked with a lawyer on your brand before?",
        options: [
            { text: "Yes", score: 0 },
            { text: "No", score: 1 }
        ],
        optional: true
    }
];

export const TrademarkQuizModal: React.FC<TrademarkQuizModalProps> = ({
    isOpen,
    onClose,
    onComplete,
    businessName = '',
    onBookCall
}) => {
    // Steps: 'intro' | 'quiz' | 'calculating' | 'results' | 'search-form' | 'success'
    const [step, setStep] = useState<'intro' | 'quiz' | 'calculating' | 'results' | 'search-form' | 'success'>('intro');
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<number[]>([]);
    const [answerDetails, setAnswerDetails] = useState<Array<{ questionId: number, answerText: string | string[], score: number }>>([]);
    const [multiSelectAnswers, setMultiSelectAnswers] = useState<Record<number, string[]>>({});
    const [searchName, setSearchName] = useState(businessName);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Derived state
    const currentQuestion = questions[currentQuestionIndex];
    const totalScore = answers.reduce((a, b) => a + b, 0);
    const maxScore = 40; // Updated max score based on new questions

    const getRiskLevel = (score: number) => {
        // Updated thresholds for new max score of 40 (proportional to old 16)
        // Old: 10+ = HIGH, 5+ = MODERATE, <5 = LOW
        // New: 25+ = HIGH (62.5%), 12+ = MODERATE (30%), <12 = LOW
        if (score >= 25) return 'HIGH RISK';
        if (score >= 12) return 'MODERATE RISK';
        return 'LOW RISK';
    };

    const handleAnswer = (score: number, answerText: string) => {
        const question = questions[currentQuestionIndex];

        // Handle multi-select questions
        if (question.isMultiSelect) {
            const currentSelections = multiSelectAnswers[currentQuestion.id] || [];
            let newSelections: string[];

            // Special handling for question 10: "Not yet" is mutually exclusive
            if (question.id === 10) {
                if (answerText === 'Not yet') {
                    // If "Not yet" is clicked, only select "Not yet"
                    newSelections = currentSelections.includes('Not yet') ? [] : ['Not yet'];
                } else {
                    // If other option is clicked, remove "Not yet" if present
                    newSelections = currentSelections.includes(answerText)
                        ? currentSelections.filter(a => a !== answerText && a !== 'Not yet')
                        : [...currentSelections.filter(a => a !== 'Not yet'), answerText];
                }
            } else {
                // Normal multi-select behavior
                newSelections = currentSelections.includes(answerText)
                    ? currentSelections.filter(a => a !== answerText)
                    : [...currentSelections, answerText];
            }

            setMultiSelectAnswers({ ...multiSelectAnswers, [currentQuestion.id]: newSelections });

            // For multi-select, only move forward when user clicks "Next" (handled separately)
            return;
        }

        // Single-select question
        const newAnswers = [...answers, score];
        const newAnswerDetails = [...answerDetails, {
            questionId: currentQuestion.id,
            answerText: answerText,
            score: score
        }];

        setAnswers(newAnswers);
        setAnswerDetails(newAnswerDetails);

        // Skip optional question 13 if user wants to skip
        const nextIndex = currentQuestionIndex + 1;
        if (nextIndex < questions.length) {
            const nextQuestion = questions[nextIndex];
            if (nextQuestion.optional) {
                // Show skip option, but for now just continue
                setCurrentQuestionIndex(nextIndex);
            } else {
                setCurrentQuestionIndex(nextIndex);
            }
        } else {
            setStep('calculating');
            // Simulate calculation delay for effect
            setTimeout(() => {
                setStep('results');
                const finalScore = newAnswers.reduce((a, b) => a + b, 0);
                const finalRisk = getRiskLevel(finalScore);
                // Pass quiz data when completing
                onComplete(finalScore, finalRisk, {
                    answers: newAnswers,
                    answerDetails: newAnswerDetails
                });
            }, 1500);
        }
    };

    const handleMultiSelectNext = () => {
        const question = questions[currentQuestionIndex];
        const selections = multiSelectAnswers[question.id] || [];

        // Calculate score for multi-select
        // For question 10, if "Not yet" is selected, use that score (1), otherwise sum selected scores
        let multiScore = 0;
        if (question.id === 10 && selections.includes('Not yet')) {
            multiScore = 1; // "Not yet" has score 1
        } else if (selections.length > 0) {
            // Sum scores of selected options
            multiScore = question.options
                .filter(opt => selections.includes(opt.text))
                .reduce((sum, opt) => sum + opt.score, 0);
        } else {
            // If nothing selected, use highest score (worst case)
            multiScore = Math.max(...question.options.map(opt => opt.score));
        }

        const newAnswers = [...answers, multiScore];
        const newAnswerDetails = [...answerDetails, {
            questionId: question.id,
            answerText: selections.length > 0 ? selections : ['None selected'],
            score: multiScore
        }];

        setAnswers(newAnswers);
        setAnswerDetails(newAnswerDetails);

        const nextIndex = currentQuestionIndex + 1;
        if (nextIndex < questions.length) {
            setCurrentQuestionIndex(nextIndex);
        } else {
            setStep('calculating');
            setTimeout(() => {
                const finalScore = newAnswers.reduce((a, b) => a + b, 0);
                const finalRisk = getRiskLevel(finalScore);
                // Pass quiz data when completing
                onComplete(finalScore, finalRisk, {
                    answers: newAnswers,
                    answerDetails: newAnswerDetails
                });
            }, 1500);
        }
    };

    const handleBack = () => {
        // If we're in quiz step and not on the first question, go back one question
        if (step === 'quiz') {
            if (currentQuestionIndex > 0) {
                setCurrentQuestionIndex(currentQuestionIndex - 1);
                // Remove last recorded answer / details so they can be replaced
                if (answers.length > 0) {
                    setAnswers(answers.slice(0, -1));
                }
                if (answerDetails.length > 0) {
                    setAnswerDetails(answerDetails.slice(0, -1));
                }
            } else {
                // On first question, go back to intro
                setStep('intro');
                setCurrentQuestionIndex(0);
                setAnswers([]);
                setAnswerDetails([]);
                setMultiSelectAnswers({});
            }
        }
    };
    const handleSearchSubmit = async () => {
        if (!searchName || searchName.trim() === '') {
            toast.error('Please enter a business name');
            return;
        }
        
        setIsSubmitting(true);

        try {
            console.log('[Trademark Quiz] Starting submission...');
            console.log('[Trademark Quiz] Business name:', searchName);
            console.log('[Trademark Quiz] Answers:', answers);
            console.log('[Trademark Quiz] Answer details:', answerDetails);
            
            const { data: { user }, error: authError } = await supabase.auth.getUser();

            if (authError) {
                console.error('[Trademark Quiz] Auth error:', authError);
                toast.error('Authentication error. Please log in again.');
                setIsSubmitting(false);
                return;
            }

            if (!user || !user.email) {
                console.error("[Trademark Quiz] User not logged in or email missing");
                toast.error('You must be logged in to submit a trademark request. Please log in and try again.');
                setIsSubmitting(false);
                return;
            }
            
            console.log('[Trademark Quiz] User authenticated:', user.email);

            const requestBody = {
                user_id: user.id,
                email: user.email,
                name: user.user_metadata?.name || user.email.split('@')[0],
                businessName: searchName,
                score: totalScore,
                riskLevel: getRiskLevel(totalScore),
                answers: answers, // Pass quiz answers for risk factor generation
                answerDetails: answerDetails // Pass detailed answers for PDF
            };

            console.log('[Trademark Quiz] Submitting request:', {
                user_id: user.id,
                email: user.email,
                businessName: searchName,
                score: totalScore,
                riskLevel: getRiskLevel(totalScore)
            });

            console.log('[Trademark Quiz] Sending request to /api/trademarks/request...');
            
            const response = await fetch('/api/trademarks/request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            console.log('[Trademark Quiz] Response status:', response.status, response.statusText);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('[Trademark Quiz] Request failed:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorData
                });
                const errorMessage = errorData.error || errorData.message || `Server error: ${response.status} ${response.statusText}`;
                toast.error(`Failed to submit request: ${errorMessage}`);
                throw new Error(errorMessage);
            }

            const result = await response.json();
            console.log('[Trademark Quiz] Request successful:', result);

            // Check if database save succeeded
            if (result.dbSaved === false) {
                console.error('[Trademark Quiz] ⚠️ Database save failed!', result.dbError);
                console.error('[Trademark Quiz] The quiz was submitted but not saved to the database.');
                console.error('[Trademark Quiz] Error:', result.dbError);
                toast.warning('Report sent, but there was an issue saving to database. Check console for details.');
            } else if (result.dbSaved === true) {
                console.log('[Trademark Quiz] ✅ Database save successful!');
                toast.success('Trademark request submitted successfully!');
            } else {
                console.warn('[Trademark Quiz] ⚠️ Database save status unknown (response missing dbSaved field)');
                toast.success('Request submitted! Check your email for the report.');
            }

            // Store quiz data for PDF download
            const quizDataToStore = {
                answers: answers,
                answerDetails: answerDetails
            };
            localStorage.setItem('wellness_trademark_quiz_data', JSON.stringify(quizDataToStore));
            console.log('[Trademark Quiz] Stored quiz data in localStorage:', quizDataToStore);

            // Call onComplete with quiz data
            onComplete(totalScore, getRiskLevel(totalScore), quizDataToStore);

            setStep('success');
            setIsSubmitting(false);
        } catch (e: any) {
            console.error("[Trademark Quiz] Error submitting trademark request:", e);
            console.error("[Trademark Quiz] Error details:", e.message, e.stack);
            setIsSubmitting(false);
            
            // Show user-friendly error message
            const errorMessage = e.message || 'Unknown error occurred. Please try again.';
            toast.error(`Failed to submit request: ${errorMessage}`);
            
            // Also log to console for debugging
            console.error("[Trademark Quiz] Full error object:", e);
        }
    };

    const handleClose = () => {
        setStep('intro');
        setCurrentQuestionIndex(0);
        setAnswers([]);
        setAnswerDetails([]);
        setMultiSelectAnswers({});
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <Card className="w-full max-w-lg shadow-2xl border-none max-h-[90vh] overflow-y-auto">
                <div className="absolute top-4 right-4 z-10">
                    <button onClick={handleClose} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                        <X size={16} />
                    </button>
                </div>

                {step === 'intro' && (
                    <div className="p-8 text-center space-y-6">
                        <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ShieldAlert size={40} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900">Is Your Business Name Clear to Use?</h2>
                        <p className="text-slate-600 text-lg">
                            Registering an LLC doesn’t always protect your business name. We’ll take a quick look to see whether your name could conflict with existing trademarks — and flag anything you should be aware of.
                        </p>
                        <Button
                            className="w-full text-lg py-6 bg-brand-600 hover:bg-brand-700 text-white mt-4 shadow-lg shadow-brand-500/20"
                            onClick={() => setStep('quiz')}
                        >
                            👉 Check My Business Name
                        </Button>
                    </div>
                )}

                {step === 'quiz' && (
                    <div className="p-8">
                        <div className="mb-4 flex items-center justify-between">
                            <button
                                type="button"
                                onClick={handleBack}
                                className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-slate-800"
                            >
                                <ArrowLeft className="mr-1 h-3 w-3" />
                                {currentQuestionIndex === 0 ? 'Back to intro' : 'Back'}
                            </button>
                            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                                <span className="ml-3">
                                    {Math.round(((currentQuestionIndex) / questions.length) * 100)}% Complete
                                </span>
                            </div>
                        </div>

                        <h3 className="text-xl font-bold text-slate-900 mb-6 leading-relaxed">
                            {currentQuestion.text}
                        </h3>

                        <div className="space-y-3 mt-4">
                            {currentQuestion.options.map((option, idx) => {
                                const isMultiSelect = currentQuestion.isMultiSelect;
                                const isSelected = isMultiSelect
                                    ? (multiSelectAnswers[currentQuestion.id] || []).includes(option.text)
                                    : false;

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleAnswer(option.score, option.text)}
                                        className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center justify-between group ${isMultiSelect
                                            ? isSelected
                                                ? 'border-brand-500 bg-brand-50 text-brand-700'
                                                : 'border-slate-200 hover:border-brand-500 hover:bg-brand-50 text-slate-700'
                                            : 'border-slate-200 hover:border-brand-500 hover:bg-brand-50 text-slate-700 group-hover:text-brand-700'
                                            }`}
                                    >
                                        <span className="font-medium">{option.text}</span>
                                        {isMultiSelect ? (
                                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${isSelected ? 'bg-brand-600 border-brand-600' : 'border-slate-300'
                                                }`}>
                                                {isSelected && <CheckCircle2 size={14} className="text-white" />}
                                            </div>
                                        ) : (
                                            <ChevronRight className="text-slate-300 group-hover:text-brand-500 opacity-0 group-hover:opacity-100 transition-opacity" size={20} />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        {currentQuestion.isMultiSelect && (
                            <Button
                                className="w-full mt-4"
                                onClick={handleMultiSelectNext}
                                disabled={false} // Allow proceeding even if nothing selected (user can skip)
                            >
                                Continue
                            </Button>
                        )}
                        {currentQuestion.optional && (
                            <button
                                onClick={() => {
                                    // Skip optional question
                                    const nextIndex = currentQuestionIndex + 1;
                                    if (nextIndex < questions.length) {
                                        setCurrentQuestionIndex(nextIndex);
                                    } else {
                                        setStep('calculating');
                                        setTimeout(() => {
                                            setStep('results');
                                            const finalScore = answers.reduce((a, b) => a + b, 0);
                                            const finalRisk = getRiskLevel(finalScore);
                                            onComplete(finalScore, finalRisk, {
                                                answers: answers,
                                                answerDetails: answerDetails
                                            });
                                        }, 1500);
                                    }
                                }}
                                className="w-full text-center text-sm text-slate-500 hover:text-slate-700 mt-2"
                            >
                                Skip this question
                            </button>
                        )}
                    </div>
                )}

                {step === 'calculating' && (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-6"></div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Analyzing Risk Profile...</h3>
                        <p className="text-slate-500">Comparing against common legal pitfalls...</p>
                    </div>
                )}

                {step === 'results' && (
                    <div className="p-0 overflow-hidden">
                        <div className={`p-8 text-center ${getRiskLevel(totalScore) === 'HIGH RISK' ? 'bg-red-50' :
                            getRiskLevel(totalScore) === 'MODERATE RISK' ? 'bg-orange-50' : 'bg-emerald-50'
                            }`}>
                            <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold tracking-wider mb-4 ${getRiskLevel(totalScore) === 'HIGH RISK' ? 'bg-red-200 text-red-800' :
                                getRiskLevel(totalScore) === 'MODERATE RISK' ? 'bg-orange-200 text-orange-800' : 'bg-emerald-200 text-emerald-800'
                                }`}>
                                {getRiskLevel(totalScore)} DETECTED
                            </span>
                            <h2 className="text-3xl font-bold text-slate-900 mb-4">
                                Score: {totalScore}/{maxScore}
                            </h2>
                            <p className="text-slate-700 max-w-sm mx-auto leading-relaxed">
                                {getRiskLevel(totalScore) === 'HIGH RISK'
                                    ? "Your business name is highly vulnerable. Without a trademark, you could be forced to rebrand at any time."
                                    : "You have some protection, but there are still gaps that could leave you exposed to copycats."
                                }
                            </p>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                                    <Search className="text-brand-600" size={18} />
                                    Recommended Action
                                </h4>
                                <p className="text-sm text-slate-600">
                                    Get a preliminary trademark risk assessment based on your answers. Not a legal opinion.
                                </p>
                            </div>
                            <Button
                                className="w-full text-lg py-6 bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-500/20 group"
                                onClick={() => setStep('search-form')}
                            >
                                Get My Trademark Risk Report <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                            <p className="text-center text-xs text-slate-400">
                                Based on your answers. Not a legal opinion.
                            </p>
                        </div>
                    </div>
                )}

                {step === 'search-form' && (
                    <div className="p-8">
                        <div className="text-center mb-6">
                            <div className="w-12 h-12 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Search size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">Get Your Trademark Risk Report</h3>
                            <p className="text-slate-500 text-sm mt-1">
                                We'll create a preliminary risk assessment based on your quiz answers and send you a detailed report.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Business Name to Check
                                </label>
                                <input
                                    type="text"
                                    value={searchName}
                                    onChange={(e) => setSearchName(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 outline-none"
                                    placeholder="e.g. Zen Yoga Studio"
                                />
                            </div>

                            <Button
                                className="w-full py-6 mt-2"
                                onClick={(e) => {
                                    e.preventDefault();
                                    console.log('[Trademark Quiz] Button clicked!');
                                    console.log('[Trademark Quiz] searchName:', searchName);
                                    console.log('[Trademark Quiz] isSubmitting:', isSubmitting);
                                    handleSearchSubmit();
                                }}
                                disabled={!searchName || isSubmitting}
                            >
                                {isSubmitting ? 'Submitting Request...' : 'Send Me The Report'}
                            </Button>
                        </div>
                    </div>
                )}

                {step === 'success' && (
                    <div className="p-8 text-center space-y-6">
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto animate-in zoom-in duration-300">
                            <CheckCircle2 size={40} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900">Request Received!</h2>
                        <p className="text-slate-600">
                            We've created your preliminary trademark risk report. You'll receive your customized PDF report and risk analysis via email shortly.
                        </p>

                        <div className="bg-brand-50 p-6 rounded-xl border border-brand-100 mt-6">
                            <h4 className="font-bold text-brand-900 mb-2">Want faster results?</h4>
                            <p className="text-sm text-brand-700 mb-4">
                                Speak directly with our legal team to interpret your results and secure your name immediately.
                            </p>
                            <Button
                                variant="outline"
                                className="w-full bg-white hover:bg-brand-50 text-brand-700 border-brand-200"
                                onClick={() => {
                                    handleClose();
                                    if (onBookCall) {
                                        onBookCall();
                                    }
                                }}
                            >
                                <Phone size={16} className="mr-2" />
                                Book Priority Review Call
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};
