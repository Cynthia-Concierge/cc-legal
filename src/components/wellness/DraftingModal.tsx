import React, { useState, useRef, useEffect } from 'react';
import { X, Copy, Check, Loader2, Scale, AlertTriangle } from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { UserAnswers, DocumentItem } from '../../types/wellness';

interface DraftingModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentItem: DocumentItem;
  userAnswers: UserAnswers;
}

export const DraftingModal: React.FC<DraftingModalProps> = ({
  isOpen,
  onClose,
  documentItem,
  userAnswers
}) => {
  const [businessName, setBusinessName] = useState(userAnswers.businessName || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [content, setContent] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const contentEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom as content streams
  useEffect(() => {
    if (contentEndRef.current) {
      contentEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [content]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!businessName.trim()) {
      setError("Please enter your business name first.");
      return;
    }
    
    setError(null);
    setIsGenerating(true);
    setContent('');

    try {
      // Get OpenAI API key from environment
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
      if (!apiKey) {
        throw new Error('OpenAI API key not configured. Please set VITE_OPENAI_API_KEY in your .env file.');
      }
      
      const servicesList = userAnswers.services.join(', ');
      const riskProfile = `
        - Has Physical Movement: ${userAnswers.hasPhysicalMovement ? 'Yes' : 'No'}
        - Collects Online Payments: ${userAnswers.collectsOnline ? 'Yes' : 'No'}
        - Hires Staff: ${userAnswers.hiresStaff ? 'Yes' : 'No'}
        - Offsite/International: ${userAnswers.isOffsiteOrInternational ? 'Yes' : 'No'}
        - Uses Photos/Video: ${userAnswers.usesPhotos ? 'Yes' : 'No'}
        - Business Type: ${userAnswers.businessType || 'Wellness Business'}
        - Location Scale: ${userAnswers.clientCount || 'Unknown'}
      `.trim();

      const prompt = `
        Act as an expert lawyer specializing in wellness and fitness law.
        Draft a comprehensive "${documentItem.title}" for a business named "${businessName}".
        
        Business Profile:
        - Services Offered: ${servicesList}
        ${riskProfile}

        The document should be professional, clear, and legally robust. 
        Include standard clauses relevant to the specific document type (e.g., indemnification, risk assumption, jurisdiction, cancellation terms).
        If this is a waiver, ensure it covers negligence where applicable.
        
        Format the output in clean Markdown.
      `;

      // Use OpenAI API with streaming
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are an expert lawyer specializing in wellness and fitness law. Generate professional, legally robust documents in clean Markdown format.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          stream: true,
          temperature: 0.7,
          max_tokens: 4000
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Failed to get response stream');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              continue;
            }

            try {
              const json = JSON.parse(data);
              const delta = json.choices?.[0]?.delta?.content;
              if (delta) {
                setContent(prev => prev + delta);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (err: any) {
      console.error('[DraftingModal] Error:', err);
      let errorMessage = err?.message || "Failed to generate draft. Please check your connection and try again.";
      
      // Provide helpful error messages
      if (errorMessage.includes('API key') || errorMessage.includes('API_KEY') || errorMessage.includes('not configured')) {
        errorMessage = `API Key Error: ${errorMessage}\n\nPlease check your .env file and ensure:\n1. VITE_OPENAI_API_KEY is set correctly\n2. The API key is valid and not expired\n3. You've restarted your dev server after adding the key`;
      }
      
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <Card className="w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl bg-white border-0 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="bg-brand-100 p-2 rounded-lg text-brand-600">
              <Scale size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Drafting Assistant</h3>
              <p className="text-xs text-slate-500">{documentItem.title}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 relative">
          
          {content ? (
             <div className="prose prose-sm max-w-none prose-headings:text-slate-800 prose-p:text-slate-600">
               <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm min-h-[400px]">
                 <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-700">
                   {content}
                 </pre>
                 <div ref={contentEndRef} />
               </div>
             </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center space-y-4">
              <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-2">
                <Scale size={32} />
              </div>
              <h4 className="text-lg font-medium text-slate-900">Let's draft your {documentItem.title}</h4>
              <p className="text-slate-500 max-w-sm">
                Our AI will use your risk assessment profile to generate a starting draft for this document.
              </p>
              
              <div className="w-full max-w-xs space-y-2 pt-4 text-left">
                <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Business Name</label>
                <input
                  type="text"
                  placeholder="e.g. Zen Yoga Studio"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  disabled={isGenerating}
                />
                {error && <p className="text-red-500 text-xs">{error}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-white flex justify-between items-center gap-4">
          
          {content ? (
             <div className="flex gap-3 w-full">
               <Button variant="outline" onClick={() => setContent('')} disabled={isGenerating}>
                 Start Over
               </Button>
               <div className="flex-1 text-xs text-slate-400 flex items-center gap-1.5 px-2 leading-tight">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>AI-generated draft. Review with legal counsel.</span>
               </div>
               <Button onClick={handleCopy} disabled={isGenerating} className="gap-2">
                 {copied ? <Check size={16} /> : <Copy size={16} />}
                 {copied ? 'Copied' : 'Copy Text'}
               </Button>
             </div>
          ) : (
             <Button 
               fullWidth 
               onClick={handleGenerate} 
               disabled={isGenerating || !businessName}
               className="bg-brand-600 hover:bg-brand-700 text-white"
             >
               {isGenerating ? (
                 <>
                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                   Drafting your document...
                 </>
               ) : (
                 'Generate Draft'
               )}
             </Button>
          )}
        </div>
      </Card>
    </div>
  );
};
