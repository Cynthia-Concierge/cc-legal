import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-800">
      <div className="container mx-auto px-4 text-center">
        <div className="flex flex-col items-center mb-8">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600 mb-2">
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
          </svg>
          <span className="text-lg font-serif text-slate-300 tracking-widest uppercase">Conscious Counsel</span>
        </div>
        
        <div className="flex justify-center gap-6 mb-8 text-sm">
          <a 
            href="https://consciouscounsel.kartra.com/page/IYO43" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-emerald-400 transition-colors"
          >
            Privacy Policy
          </a>
          <a 
            href="https://consciouscounsel.kartra.com/page/nkS45" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-emerald-400 transition-colors"
          >
            Terms of Service
          </a>
        </div>

        <p className="text-xs text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Disclaimer: The information provided on this website does not, and is not intended to, constitute legal advice; instead, all information, content, and materials available on this site are for general informational purposes only. Information on this website may not constitute the most up-to-date legal or other information.
        </p>
        
        <div className="mt-8 text-xs text-slate-700">
          © {new Date().getFullYear()} Conscious Counsel. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;

