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
  const widgetRef = useRef<HTMLDivElement>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [widgetKey, setWidgetKey] = useState(0);

  // Load Calendly script
  useEffect(() => {
    const scriptId = 'calendly-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;
    
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      
      script.onload = () => {
        setScriptLoaded(true);
      };
      
      document.body.appendChild(script);
    } else {
      // Script already exists, check if Calendly is available
      if (window.Calendly) {
        setScriptLoaded(true);
      } else {
        // Wait for script to load
        script.onload = () => {
          setScriptLoaded(true);
        };
      }
    }
  }, []);

  // Initialize widget when modal opens and script is loaded
  useEffect(() => {
    if (isOpen && scriptLoaded && widgetRef.current) {
      // Increment key to force React to recreate the widget div
      setWidgetKey(prev => prev + 1);
      
      // Clear any existing widget content first
      if (widgetRef.current) {
        widgetRef.current.innerHTML = '';
      }
      
      // Wait a bit for DOM to be ready, then initialize
      const timer = setTimeout(() => {
        if (widgetRef.current) {
          // Create a fresh div element for the widget
          const widgetDiv = document.createElement('div');
          widgetDiv.className = 'calendly-inline-widget';
          widgetDiv.setAttribute('data-url', 'https://calendly.com/chad-consciouscounsel/connection-call-with-chad');
          widgetDiv.style.minWidth = '320px';
          widgetDiv.style.height = '700px';
          
          // Clear and append the new widget
          widgetRef.current.innerHTML = '';
          widgetRef.current.appendChild(widgetDiv);
          
          // Initialize Calendly widget if available
          if (window.Calendly && window.Calendly.initInlineWidget) {
            try {
              window.Calendly.initInlineWidget({
                url: 'https://calendly.com/chad-consciouscounsel/connection-call-with-chad',
                parentElement: widgetDiv,
              });
            } catch (error) {
              console.error('Error initializing Calendly widget:', error);
            }
          }
        }
      }, 150);

      return () => {
        clearTimeout(timer);
        // Clean up widget when modal closes
        if (widgetRef.current) {
          widgetRef.current.innerHTML = '';
        }
      };
    }
  }, [isOpen, scriptLoaded]);

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
          {!scriptLoaded && (
            <div className="flex items-center justify-center h-[700px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto mb-4"></div>
                <p className="text-slate-600">Loading calendar...</p>
              </div>
            </div>
          )}
          <div 
            key={widgetKey}
            ref={widgetRef}
            style={{ minWidth: '320px', height: '700px' }}
          />
        </div>
      </Card>
    </div>
  );
};
