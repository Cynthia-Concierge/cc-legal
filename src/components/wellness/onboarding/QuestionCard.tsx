import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Check, ArrowRight } from 'lucide-react';

interface QuestionProps {
  question: string;
  type: 'single' | 'multi';
  options: string[];
  selected: string | string[] | boolean | null;
  onAnswer: (val: any) => void;
  onNext: () => void;
  isLast?: boolean;
}

export const QuestionCard: React.FC<QuestionProps> = ({ 
  question, 
  type, 
  options, 
  selected, 
  onAnswer, 
  onNext,
  isLast = false
}) => {
  
  const handleSelect = (option: string) => {
    if (type === 'single') {
      // Map Yes/No to boolean if applicable
      const val = option === 'Yes' ? true : option === 'No' ? false : option;
      onAnswer(val);
      // Auto advance for single select often feels better, but explicit next is safer for touch
    } else {
      const current = Array.isArray(selected) ? selected : [];
      if (current.includes(option)) {
        onAnswer(current.filter(item => item !== option));
      } else {
        if (option === 'None') {
            onAnswer(['None']);
        } else {
            // Remove 'None' if selecting others
            const withoutNone = current.filter(i => i !== 'None');
            onAnswer([...withoutNone, option]);
        }
      }
    }
  };

  const isSelected = (option: string) => {
    if (type === 'single') {
       const val = option === 'Yes' ? true : option === 'No' ? false : option;
       return selected === val;
    }
    return Array.isArray(selected) && selected.includes(option);
  };

  const canProceed = selected !== null && (Array.isArray(selected) ? selected.length > 0 : true);

  return (
    <Card className="w-full max-w-lg mx-auto shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardHeader>
        <CardTitle className="text-xl md:text-2xl text-slate-900 text-center font-normal leading-relaxed">
          {question}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3">
          {options.map((option) => (
            <button
              key={option}
              onClick={() => handleSelect(option)}
              className={`
                relative flex items-center w-full min-h-[56px] p-4 text-left border rounded-xl transition-all duration-200
                ${isSelected(option) 
                  ? 'border-brand-500 bg-brand-50 text-brand-900 ring-1 ring-brand-500' 
                  : 'border-slate-200 hover:border-brand-300 hover:bg-slate-50 text-slate-700'}
              `}
            >
              <span className="flex-1 font-medium">{option}</span>
              {isSelected(option) && (
                <div className="h-5 w-5 bg-brand-500 rounded-full flex items-center justify-center text-white flex-shrink-0">
                  <Check size={12} strokeWidth={3} />
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="pt-6">
          <Button 
            fullWidth 
            size="lg" 
            onClick={onNext} 
            disabled={!canProceed}
            className="group"
          >
            {isLast ? 'Complete Assessment' : 'Next Step'}
            {!isLast && <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
