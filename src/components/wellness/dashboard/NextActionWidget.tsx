import React from 'react';
import { ArrowRight, CheckCircle2, AlertTriangle, Scan, Search, FileText, Phone } from 'lucide-react';
import { NextAction } from '../../../lib/wellness/dashboardLogic';
import { Button } from '../ui/Button';

interface NextActionWidgetProps {
    action: NextAction;
    onActionClick: (action: NextAction) => void;
}

export const NextActionWidget: React.FC<NextActionWidgetProps> = ({ action, onActionClick }) => {
    const getIcon = () => {
        switch (action.actionType) {
            case 'profile': return <CheckCircle2 className="w-6 h-6 text-brand-600" />;
            case 'scan': return <Scan className="w-6 h-6 text-brand-600" />;
            case 'review': return <Search className="w-6 h-6 text-brand-600" />;
            case 'draft': return <FileText className="w-6 h-6 text-brand-600" />;
            case 'call': return <Phone className="w-6 h-6 text-brand-600" />;
            default: return <ArrowRight className="w-6 h-6 text-brand-600" />;
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border-l-4 border-brand-500 overflow-hidden transform hover:-translate-y-1 transition-all duration-300">
            <div className="p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="p-4 bg-brand-50 rounded-full flex-shrink-0 animate-pulse-slow">
                    {getIcon()}
                </div>

                <div className="flex-grow space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-100 px-2 py-0.5 rounded-full">
                            Recommended Next Step
                        </span>
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-slate-900">
                        {action.title}
                    </h3>
                    <p className="text-slate-600 md:text-lg max-w-2xl">
                        {action.description}
                    </p>
                </div>

                <div className="flex-shrink-0 w-full md:w-auto mt-4 md:mt-0">
                    <Button
                        size="lg"
                        variant="primary"
                        className="w-full md:w-auto shadow-md hover:shadow-xl transition-all"
                        onClick={() => onActionClick(action)}
                    >
                        {action.actionLabel}
                        <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                </div>
            </div>
        </div>
    );
};
