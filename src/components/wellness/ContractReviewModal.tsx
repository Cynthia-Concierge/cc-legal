import React, { useState, useRef, useEffect } from 'react';
import { X, UploadCloud, FileText, AlertTriangle, Loader2, Search, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import * as pdfjsLib from 'pdfjs-dist';
import { vaultService } from '../../lib/wellness/vaultService';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';

// Configure PDF.js worker - use CDN for reliability
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

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

  // Input mode state
  const [inputMode, setInputMode] = useState<'upload' | 'paste'>('upload');
  const [pastedText, setPastedText] = useState('');
  const [documentName, setDocumentName] = useState('');

  // Vault saving state
  const [isSaving, setIsSaving] = useState(false);
  const [savedToVault, setSavedToVault] = useState(false);

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

  const convertPDFToImages = async (file: File): Promise<string[]> => {
    // Convert PDF pages to images using pdf.js
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsArrayBuffer(file);
      reader.onload = async () => {
        try {
          const arrayBuffer = reader.result as ArrayBuffer;
          const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;

          const imagePromises: Promise<string>[] = [];
          const maxPages = Math.min(pdf.numPages, 5); // Limit to first 5 pages for performance

          for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better quality
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');

            if (!context) {
              throw new Error('Failed to get canvas context');
            }

            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const renderContext = {
              canvasContext: context,
              viewport: viewport
            };

            await page.render(renderContext).promise;

            // Convert canvas to base64 image
            const imageDataUrl = canvas.toDataURL('image/png');
            imagePromises.push(Promise.resolve(imageDataUrl));
          }

          const images = await Promise.all(imagePromises);
          resolve(images);
        } catch (error: any) {
          console.error('[ContractReview] PDF conversion error:', error);
          reject(new Error(`Failed to process PDF: ${error.message}. Please try converting to images or text format.`));
        }
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const analyzeWithOpenAI = async (prompt: string, currentFile: File = file!) => {
    // Determine file type
    const isImage = currentFile.type.startsWith('image/');
    const isPDF = currentFile.type === 'application/pdf';
    const isText = currentFile.type === 'text/plain' || currentFile.name.endsWith('.txt');

    // Start with the prompt
    let content: any[] = [{ type: 'text', text: prompt }];

    if (isImage) {
      // For images, convert to base64 and use vision API
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(currentFile);
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
      // For PDFs, convert pages to images and use vision API
      try {
        const pdfImages = await convertPDFToImages(currentFile);

        // Update the prompt to include PDF context
        content[0] = {
          type: 'text',
          text: `${prompt}\n\nAnalyzing PDF document (${pdfImages.length} page${pdfImages.length > 1 ? 's' : ''} converted to images):`
        };

        // Add each page as an image to the content
        for (const imageDataUrl of pdfImages) {
          content.push({
            type: 'image_url',
            image_url: {
              url: imageDataUrl
            }
          });
        }
      } catch (error: any) {
        throw new Error(`Failed to process PDF: ${error.message}. Please try converting PDF pages to images (PNG/JPG) for better analysis.`);
      }
    } else if (isText) {
      // For text files
      const text = await currentFile.text();
      content.push({
        type: 'text',
        text: `Document content:\n\n${text}`
      });
    } else {
      // For other file types, try to read as text
      try {
        const text = await currentFile.text();
        content.push({
          type: 'text',
          text: `Document content:\n\n${text.substring(0, 10000)}` // Limit to 10k chars
        });
      } catch (error) {
        throw new Error('Unsupported file type. Please upload PDF, TXT, or image files.');
      }
    }

    // Send to backend proxy
    const response = await fetch('/api/analyze-contract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: content
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Server error: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.analysis) {
      setAnalysis(data.analysis);
      onComplete?.();
    } else {
      throw new Error("No analysis returned from server");
    }
  };

  const handleAnalyze = async () => {
    // Auth Check
    if (supabase) { // Guard against null in some envs
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please complete your business profile and create a password so your document can save.", {
          duration: 6000,
        });
        return;
      }
    }

    let fileToAnalyze = file;

    // Handle Pasted Text
    if (inputMode === 'paste') {
      if (!pastedText.trim() || !documentName.trim()) {
        setError("Please provide both a document name and content.");
        return;
      }
      // Create a file from text
      fileToAnalyze = new File([pastedText], `${documentName}.txt`, { type: 'text/plain' });
      setFile(fileToAnalyze);
    }

    if (!fileToAnalyze) return;

    setIsAnalyzing(true);
    setError(null);
    setAnalysis('');

    // Reset save state
    setIsSaving(true);
    setSavedToVault(false);

    // Auto-save to Vault in background
    try {
      const docType = fileToAnalyze.name.toLowerCase().includes('waiver') ? 'Waiver' :
        fileToAnalyze.name.toLowerCase().includes('contract') ? 'Contract' : 'Document';
      const cleanName = fileToAnalyze.name.replace(/\.[^/.]+$/, ""); // remove extension
      const title = `Analyzed ${docType} - ${cleanName}`;

      console.log('Auto-saving to vault:', title);

      // We don't await this to avoid blocking the analysis, but we track its completion
      vaultService.uploadDocument(fileToAnalyze, 'other', title, 'Uploaded for AI Risk Analysis')
        .then((doc) => {
          if (doc) {
            console.log('Successfully saved to vault:', doc.id);
            setSavedToVault(true);
            toast.success("Document saved to your Vault");
          } else {
            console.warn('Failed to save to vault (returned null)');
            toast.error("Could not save to Vault. Please check storage permissions.");
          }
        })
        .catch(err => {
          console.error('Error saving to vault:', err);
          toast.error(`Failed to save: ${err.message || 'Unknown error'}`);
        })
        .finally(() => setIsSaving(false));

    } catch (e) {
      console.error('Error initiating vault save:', e);
      setIsSaving(false);
    }

    try {
      const prompt = `
        You are a strict legal auditor specializing in liability for wellness businesses (yoga studios, gyms, retreats).
        
        Analyze the attached document. It is likely a waiver, contract, or membership agreement.
        
        Perform a "Deep Dive Risk Audit" looking for:
        1. **Negligence Waivers**: Does it explicitly cover "ordinary negligence"? (Crucial for wellness).
        2. **Jurisdiction/Venue**: Is a specific state/country named for disputes?
        3. **Communicable Disease**: Are there outdated or missing COVID/health clauses?
        4. **Media Release**: Is there permission to use photos/video?
        5. **Arbitration**: Is there a mandatory arbitration clause?
        
        Output a structured report in Markdown:
        
        ## 🛡️ Risk Score: [0-10]/10
        (10 = Ironclad/Perfect, 0 = Dangerous/Missing Critical Items)
        *Be strict. Most DIY templates should score 4-6.*

        ### 🚩 Critical Red Flags
        - List dangerous omissions or vague language here.
        - If the document is missing "negligence" language, flag it immediately.
        
        ### ⚠️ Potential Weaknesses
        - Even if technically legal, what could be stronger?
        - Mention if layout is hard to read or language is too complex.
        
        ### ✅ Strengths
        - What does this document do well?
        
        ### 💡 Actionable Recommendations
        - Specific clauses to add or change immediately.
        
        Tone: Protective, critical, and direct. Do not say "0 issues" unless it's a perfect lawyer-drafted document.
      `;

      // Use OpenAI only
      await analyzeWithOpenAI(prompt, fileToAnalyze);

    } catch (err: any) {
      console.error('[ContractReview] Final error:', err);

      // Parse nested JSON error if present
      let errorMessage = err?.message || "Failed to analyze the document. The file might be corrupted or the format is unsupported. Try converting to PDF or text.";

      // Check for specific "Failed to fetch" (Network Error)
      if (errorMessage === 'Failed to fetch') {
        errorMessage = 'Network Error: Could not connect to OpenAI. Please check your internet connection or try again. If using an ad-blocker, try disabling it.';
      }

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
            <div className="flex flex-col items-center justify-center h-full space-y-6 py-6">

              {/* Input Toggle */}
              <div className="bg-slate-100 p-1 rounded-lg flex gap-1">
                <button
                  onClick={() => setInputMode('upload')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${inputMode === 'upload'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                  Upload File
                </button>
                <button
                  onClick={() => setInputMode('paste')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${inputMode === 'paste'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                  Paste Text
                </button>
              </div>

              {inputMode === 'upload' ? (
                // File Upload Area
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`w-full max-w-md border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all group ${isDragging
                    ? 'border-indigo-500 bg-indigo-100 scale-105'
                    : 'border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/30'
                    }`}
                >
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-transform ${isDragging
                    ? 'bg-indigo-200 scale-110'
                    : 'bg-slate-100 group-hover:scale-110'
                    }`}>
                    <UploadCloud className={`transition-colors ${isDragging
                      ? 'text-indigo-600'
                      : 'text-slate-400 group-hover:text-indigo-500'
                      }`} size={28} />
                  </div>
                  <p className="text-lg font-medium text-slate-700 text-center">
                    {isDragging ? 'Drop your document here' : 'Click to upload or drag & drop'}
                  </p>
                  <p className="text-sm text-slate-400 mt-2 text-center">PDF, TXT, or Image (Max 5MB)</p>
                  {file && (
                    <div className="mt-4 flex items-center gap-2 bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full text-sm font-medium break-all">
                      <FileText size={14} className="flex-shrink-0" />
                      <span className="truncate max-w-[200px]">{file.name}</span>
                    </div>
                  )}
                </div>
              ) : (
                // Paste Text Area
                <div className="w-full max-w-md space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Document Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Liability Waiver 2024"
                      value={documentName}
                      onChange={(e) => setDocumentName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Content
                    </label>
                    <textarea
                      placeholder="Paste your contract text here..."
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      className="w-full h-48 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm resize-none"
                    />
                  </div>
                </div>
              )}

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.txt,.doc,.docx,image/*"
              />

              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg text-sm max-w-md">
                  <AlertTriangle size={16} className="flex-shrink-0" />
                  {error}
                </div>
              )}

              <Button
                onClick={handleAnalyze}
                disabled={inputMode === 'upload' ? !file : (!pastedText.trim() || !documentName.trim())}
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
            <Button variant="outline" onClick={() => {
              setAnalysis('');
              setFile(null);
              setSavedToVault(false);
              setIsSaving(false);
              setPastedText('');
              setDocumentName('');
            }}>
              Analyze Another
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 hidden sm:inline">AI analysis is for informational purposes only.</span>

              {/* Vault Save Status */}
              {savedToVault && (
                <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium animate-in fade-in slide-in-from-bottom-2">
                  <CheckCircle2 size={14} />
                  Saved to Vault
                </div>
              )}
              {isSaving && (
                <div className="flex items-center gap-1.5 text-slate-500 bg-slate-50 px-3 py-1 rounded-full text-xs font-medium">
                  <Loader2 size={12} className="animate-spin" />
                  Saving copy...
                </div>
              )}

              <Button onClick={onClose}>Done</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
