import React, { useEffect, useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { Button } from '../ui/Button';

interface CopyableDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  htmlContent: string;
}

export const CopyableDocumentModal: React.FC<CopyableDocumentModalProps> = ({
  isOpen,
  onClose,
  title,
  htmlContent,
}) => {
  const [copied, setCopied] = useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyText = async () => {
    if (!contentRef.current) return;

    try {
      // Get the rendered text content (without HTML tags)
      const textContent = contentRef.current.innerText;

      await navigator.clipboard.writeText(textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleCopyFormatted = async () => {
    if (!contentRef.current) return;

    try {
      // Create a ClipboardItem with both HTML and plain text
      const html = contentRef.current.innerHTML;
      const text = contentRef.current.innerText;

      const blob = new Blob([html], { type: 'text/html' });
      const textBlob = new Blob([text], { type: 'text/plain' });

      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': blob,
          'text/plain': textBlob,
        }),
      ]);

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy formatted text:', err);
      // Fallback to plain text
      handleCopyText();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{title}</h2>
            <p className="text-sm text-slate-500 mt-1">Copy and paste this text wherever you need it</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content - Google Doc-like styling */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
          <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-lg">
            <div
              ref={contentRef}
              className="p-12 prose prose-slate max-w-none"
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: '14px',
                lineHeight: '1.8',
                color: '#1e293b',
              }}
              dangerouslySetInnerHTML={{ __html: cleanHtmlForDisplay(htmlContent) }}
            />
          </div>
        </div>

        {/* Footer with Copy Button */}
        <div className="p-4 border-t border-slate-200 bg-gradient-to-r from-slate-50 to-white flex justify-between items-center gap-3">
          <div className="text-sm text-slate-600">
            💡 <strong>Tip:</strong> The text will preserve formatting when pasted into most editors
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="primary"
              onClick={handleCopyFormatted}
              className="bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-700 hover:to-purple-700"
            >
              {copied ? (
                <>
                  <Check size={16} className="mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy size={16} className="mr-2" />
                  Copy Text
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Clean HTML to make it display-friendly while preserving formatting
 * Removes script tags, styles, and other non-content elements
 */
function cleanHtmlForDisplay(html: string): string {
  // Create a temporary div to parse HTML
  const temp = document.createElement('div');
  temp.innerHTML = html;

  // Remove disclaimer banners and footer (we don't want users copying those)
  const disclaimerBanners = temp.querySelectorAll('.disclaimer-banner, .footer-disclaimer');
  disclaimerBanners.forEach(el => el.remove());

  // Remove script tags
  const scripts = temp.querySelectorAll('script');
  scripts.forEach(el => el.remove());

  // Remove style tags (inline styles are okay)
  const styles = temp.querySelectorAll('style');
  styles.forEach(el => el.remove());

  // Get the body content if it exists
  const body = temp.querySelector('body');
  const content = body || temp;

  // Apply clean styling classes
  return content.innerHTML;
}
