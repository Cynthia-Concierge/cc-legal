import React, { useState, useRef, useEffect } from 'react';
import { X, UploadCloud, FileText, AlertTriangle, Loader2, Search } from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

interface ContractReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export const ContractReviewModal: React.FC<ContractReviewModalProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentEndRef.current) {
      contentEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [analysis]);

  if (!isOpen) return null;

  const validateAndSetFile = (selectedFile: File) => {
    // Basic validation
    if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
      setError("File is too large. Please upload a document under 5MB.");
      return;
    }
    setFile(selectedFile);
    setError(null);
    setAnalysis('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      const droppedFile = droppedFiles[0];
      validateAndSetFile(droppedFile);
    }
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    // For PDFs, we'll use a simple approach: try to extract text
    // Note: This is a basic implementation. For production, you might want to use a PDF parsing library
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsArrayBuffer(file);
      reader.onload = async () => {
        try {
          // Try to extract text from PDF using a simple approach
          // For now, we'll inform the user that PDF text extraction is limited
          // In production, you could use pdf.js or similar library
          const arrayBuffer = reader.result as ArrayBuffer;
          const uint8Array = new Uint8Array(arrayBuffer);
          
          // Simple PDF text extraction (basic - works for text-based PDFs)
          let text = '';
          const decoder = new TextDecoder('utf-8', { fatal: false });
          const chunkSize = 1024;
          
          for (let i = 0; i < uint8Array.length; i += chunkSize) {
            const chunk = uint8Array.slice(i, i + chunkSize);
            try {
              const decoded = decoder.decode(chunk);
              // Extract readable text (basic filtering)
              const readableText = decoded.replace(/[^\x20-\x7E\n\r]/g, '');
              if (readableText.length > 10) {
                text += readableText;
              }
            } catch (e) {
              // Skip invalid chunks
            }
          }
          
          // If we got meaningful text, return it
          if (text.length > 100) {
            resolve(text.substring(0, 10000)); // Limit to 10k chars
          } else {
            // If extraction failed, return a message
            resolve('PDF text extraction limited. For best results, please convert PDF pages to images (PNG/JPG) or provide a text file.');
          }
        } catch (error) {
          reject(new Error('Failed to extract text from PDF. Please convert to images or text format.'));
        }
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const analyzeWithOpenAI = async (prompt: string) => {
    const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not found. Please set VITE_OPENAI_API_KEY in your .env file.');
    }

    // Determine file type
    const isImage = file!.type.startsWith('image/');
    const isPDF = file!.type === 'application/pdf';
    const isText = file!.type === 'text/plain' || file!.name.endsWith('.txt');

    let content: any[] = [{ type: 'text', text: prompt }];

    if (isImage) {
      // For images, convert to base64 and use vision API
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file!);
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result); // Keep full data URL for OpenAI
        };
        reader.onerror = reject;
      });

      content.push({
        type: 'image_url',
        image_url: {
          url: base64Data
        }
      });
    } else if (isPDF) {
      // For PDFs, extract text content
      try {
        const pdfText = await extractTextFromPDF(file!);
        content.push({
          type: 'text',
          text: `Document content (extracted from PDF):\n\n${pdfText}`
        });
      } catch (error: any) {
        throw new Error(`Failed to process PDF: ${error.message}. Please convert PDF pages to images (PNG/JPG) for better analysis.`);
      }
    } else if (isText) {
      // For text files
      const text = await file!.text();
      content.push({
        type: 'text',
        text: `Document content:\n\n${text}`
      });
    } else {
      // For other file types, try to read as text
      try {
        const text = await file!.text();
        content.push({
          type: 'text',
          text: `Document content:\n\n${text.substring(0, 10000)}` // Limit to 10k chars
        });
      } catch (error) {
        throw new Error('Unsupported file type. Please upload PDF, TXT, or image files.');
      }
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Using gpt-4o for vision support
        messages: [
          {
            role: 'user',
            content: content
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
            // Analysis complete
            onComplete?.();
            continue;
          }

          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              setAnalysis(prev => prev + delta);
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setIsAnalyzing(true);
    setError(null);
    setAnalysis('');

    try {
      const prompt = `
        You are a senior legal expert specializing in liability for wellness businesses (yoga studios, gyms, retreats).
        
        Analyze the attached document. It is likely a waiver, contract, or membership agreement.
        
        Perform a "Red Flag Review" looking for:
        1. **Negligence Waivers**: Does it explicitly cover "ordinary negligence"? (Crucial for wellness).
        2. **Jurisdiction/Venue**: Is a specific state/country named for disputes?
        3. **Communicable Disease**: Are there outdated or missing COVID/health clauses?
        4. **Media Release**: Is there permission to use photos/video?
        5. **Arbitration**: Is there a mandatory arbitration clause?
        
        Output a structured report in Markdown:
        
        ## 🛡️ Risk Score: [0-10]/10
        (10 = Very Safe, 0 = High Liability Risk)
        
        ### 🚩 Critical Red Flags
        - List dangerous omissions or vague language here.
        
        ### ✅ Strengths
        - What does this document do well?
        
        ### 💡 Actionable Recommendations
        - Specific clauses to add or change immediately.
        
        Tone: Professional, direct, and protective of the business owner.
      `;

      // Use OpenAI only
      await analyzeWithOpenAI(prompt);

    } catch (err: any) {
      console.error('[ContractReview] Final error:', err);
      
      // Parse nested JSON error if present
      let errorMessage = err?.message || "Failed to analyze the document. The file might be corrupted or the format is unsupported. Try converting to PDF or text.";
      
      try {
        if (typeof errorMessage === 'string' && errorMessage.includes('{')) {
          const parsed = JSON.parse(errorMessage);
          if (parsed.error?.message) {
            errorMessage = parsed.error.message;
          } else if (parsed.message) {
            errorMessage = parsed.message;
          }
        }
      } catch (parseError) {
        // Use original message if parsing fails
      }

      // Provide helpful error messages
      if (errorMessage.includes('API Key') || errorMessage.includes('API_KEY') || errorMessage.includes('not found')) {
        errorMessage = `API Key Error: ${errorMessage}\n\nPlease check your .env file and ensure:\n1. VITE_OPENAI_API_KEY is set correctly\n2. The API key is valid and not expired\n3. You've restarted your dev server after adding the key`;
      }

      setError(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl bg-white border-0 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
              <Search size={22} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">AI Contract Review</h3>
              <p className="text-sm text-slate-500">Upload your existing waiver or contract for a safety check.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
          
          {!analysis && !isAnalyzing ? (
            <div className="flex flex-col items-center justify-center h-full space-y-6 py-10">
              <div 
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`w-full max-w-md border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all group ${
                  isDragging 
                    ? 'border-indigo-500 bg-indigo-100 scale-105' 
                    : 'border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/30'
                }`}
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-transform ${
                  isDragging 
                    ? 'bg-indigo-200 scale-110' 
                    : 'bg-slate-100 group-hover:scale-110'
                }`}>
                  <UploadCloud className={`transition-colors ${
                    isDragging 
                      ? 'text-indigo-600' 
                      : 'text-slate-400 group-hover:text-indigo-500'
                  }`} size={32} />
                </div>
                <p className="text-lg font-medium text-slate-700">
                  {isDragging ? 'Drop your document here' : 'Click to upload or drag and drop'}
                </p>
                <p className="text-sm text-slate-400 mt-2">PDF, TXT, or Image (Max 5MB)</p>
                {file && (
                  <div className="mt-4 flex items-center gap-2 bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full text-sm font-medium">
                    <FileText size={14} />
                    {file.name}
                  </div>
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".pdf,.txt,.doc,.docx,image/*"
              />
              
              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg text-sm">
                  <AlertTriangle size={16} />
                  {error}
                </div>
              )}

              <Button 
                onClick={handleAnalyze} 
                disabled={!file} 
                size="lg"
                className="w-full max-w-xs"
              >
                Analyze Document
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {isAnalyzing && !analysis && (
                <div className="flex flex-col items-center justify-center py-20 space-y-4 text-slate-500">
                  <Loader2 size={40} className="animate-spin text-indigo-600" />
                  <p>Scanning for liability loopholes...</p>
                </div>
              )}
              
              {(analysis || isAnalyzing) && (
                 <div className="prose prose-sm max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-p:text-slate-600 prose-li:text-slate-600">
                   <div className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm">
                     {analysis ? (
                       <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{analysis}</pre>
                     ) : null}
                     <div ref={contentEndRef} />
                   </div>
                 </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {analysis && (
          <div className="p-4 border-t border-slate-100 bg-white flex justify-between items-center">
            <Button variant="outline" onClick={() => { setAnalysis(''); setFile(null); }}>
              Analyze Another
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 hidden sm:inline">AI analysis is for informational purposes only.</span>
              <Button onClick={onClose}>Done</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
