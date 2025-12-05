import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { Card } from './ui/Card';

interface CalendlyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

declare global {
  interface Window {
    Calendly: any;
  }
}

export const CalendlyModal: React.FC<CalendlyModalProps> = ({ isOpen, onClose }) => {
  const [widgetKey, setWidgetKey] = useState(0);

  useEffect(() => {
    if (isOpen) {
      // Increment key to force React to recreate the widget div
      setWidgetKey(prev => prev + 1);
      
      // Load Calendly script if not already loaded
      const scriptId = 'calendly-script';
      let script = document.getElementById(scriptId) as HTMLScriptElement;
      
      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://assets.calendly.com/assets/external/widget.js';
        script.async = true;
        document.body.appendChild(script);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl bg-white border-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-semibold text-slate-900">Schedule a Call</h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Calendly Widget */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          <div 
            key={widgetKey}
            className="calendly-inline-widget" 
            data-url="https://calendly.com/chad-consciouscounsel/connection-call-with-chad" 
            style={{ minWidth: '320px', height: '700px' }}
          />
        </div>
      </Card>
    </div>
  );
};
