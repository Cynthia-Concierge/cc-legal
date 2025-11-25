import { useEffect, useState } from 'react';

const DocumentAnimation = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);

  const templates = [
    {
      title: "Waiver / Release of Liability",
      category: "⚖️ Core Legal",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      )
    },
    {
      title: "Service Agreement",
      category: "⚖️ Core Legal",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
      )
    },
    {
      title: "Employment Agreement",
      category: "⚖️ Core Legal",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="8.5" cy="7" r="4"/>
          <line x1="20" y1="8" x2="20" y2="14"/>
          <line x1="23" y1="11" x2="17" y2="11"/>
        </svg>
      )
    },
    {
      title: "Independent Contractor Agreement",
      category: "⚖️ Core Legal",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
        </svg>
      )
    },
    {
      title: "Terms & Conditions",
      category: "⚖️ Core Legal",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      )
    },
    {
      title: "Media Release Form",
      category: "📸 Marketing & Media",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
      )
    },
    {
      title: "Social Media Disclaimer",
      category: "📸 Marketing & Media",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
        </svg>
      )
    },
    {
      title: "Influencer Agreement",
      category: "📸 Marketing & Media",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      )
    },
    {
      title: "Testimonial Consent Agreement",
      category: "📸 Marketing & Media",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      )
    },
    {
      title: "Trademark & IP Protection",
      category: "💡 Brand Protection",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M14.31 8l5.74 9.94M9.69 8h11.48M7.38 12l5.74-9.94M9.69 16L3.95 6.06M14.31 16H2.83M16.62 12l-5.74 9.94"/>
        </svg>
      )
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setIsShuffling(true);
      
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % templates.length);
        setIsAnimating(false);
        
        setTimeout(() => {
          setIsShuffling(false);
        }, 100);
      }, 400);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const currentTemplate = templates[currentIndex];

  return (
    <div className="w-full max-w-md mx-auto">
      <div 
        className="relative"
        style={{
          transform: 'perspective(1000px) rotateY(-5deg) rotateX(5deg)',
          transformStyle: 'preserve-3d'
        }}
      >
        {/* Back layers for depth */}
        <div 
          className={`absolute top-10 -left-4 -right-4 -bottom-10 bg-gray-100 border border-gray-200 rounded-2xl transition-all duration-500`}
          style={{
            transform: isShuffling ? 'translateZ(-40px) translateY(-12px) translateX(8px)' : 'translateZ(-40px)'
          }}
        />
        <div 
          className={`absolute top-5 -left-2 -right-2 -bottom-5 bg-gray-50 border border-gray-200 rounded-2xl transition-all duration-500`}
          style={{
            transform: isShuffling ? 'translateZ(-20px) translateY(-8px) translateX(5px)' : 'translateZ(-20px)'
          }}
        />
        
        {/* Main document */}
        <div className="relative bg-white border border-gray-200 rounded-2xl p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6 pb-5 border-b border-gray-200">
            <div 
              className={`w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                isAnimating ? 'scale-90' : 'scale-100'
              }`}
            >
              <div 
                className={`text-teal-600 w-6 h-6 transition-opacity duration-300 ${
                  isAnimating ? 'opacity-0' : 'opacity-100'
                }`}
              >
                {currentTemplate.icon}
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="font-serif text-xl font-semibold text-gray-900 mb-1 h-7 overflow-hidden">
                <div 
                  className={`transition-all duration-500 ease-in-out ${
                    isAnimating ? 'opacity-0 -translate-y-full' : 'opacity-100 translate-y-0'
                  }`}
                >
                  {currentTemplate.title}
                </div>
              </div>
              <div className="text-xs text-gray-500 uppercase tracking-wide h-4 overflow-hidden">
                <div 
                  className={`transition-all duration-500 ease-in-out delay-100 ${
                    isAnimating ? 'opacity-0 -translate-y-full' : 'opacity-100 translate-y-0'
                  }`}
                >
                  {currentTemplate.category}
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-3 mb-6">
            <div 
              className={`h-2.5 bg-gray-100 rounded-full transition-all duration-500 origin-left ${
                isAnimating ? 'scale-x-0 opacity-0' : 'scale-x-100 opacity-100'
              }`}
              style={{ transitionDelay: '50ms' }}
            ></div>
            <div 
              className={`h-2.5 bg-gray-100 rounded-full w-[85%] transition-all duration-500 origin-left ${
                isAnimating ? 'scale-x-0 opacity-0' : 'scale-x-100 opacity-100'
              }`}
              style={{ transitionDelay: '100ms' }}
            ></div>
            <div 
              className={`h-2.5 bg-gray-100 rounded-full w-[92%] transition-all duration-500 origin-left ${
                isAnimating ? 'scale-x-0 opacity-0' : 'scale-x-100 opacity-100'
              }`}
              style={{ transitionDelay: '150ms' }}
            ></div>
            <div 
              className={`h-2.5 bg-gray-100 rounded-full w-[78%] transition-all duration-500 origin-left ${
                isAnimating ? 'scale-x-0 opacity-0' : 'scale-x-100 opacity-100'
              }`}
              style={{ transitionDelay: '200ms' }}
            ></div>
            <div 
              className={`h-2.5 bg-gray-100 rounded-full w-[88%] transition-all duration-500 origin-left ${
                isAnimating ? 'scale-x-0 opacity-0' : 'scale-x-100 opacity-100'
              }`}
              style={{ transitionDelay: '250ms' }}
            ></div>
          </div>
          
          <div className="flex items-center justify-between pt-5 border-t border-gray-200">
            <div>
              <div 
                className={`w-28 h-0.5 bg-emerald-500 mb-1 transition-all duration-500 origin-left ${
                  isAnimating ? 'scale-x-0' : 'scale-x-100'
                }`}
                style={{ transitionDelay: '300ms' }}
              ></div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">Signature</div>
            </div>
            <div 
              className={`w-14 h-14 border-2 border-emerald-500 rounded-full flex items-center justify-center transition-all duration-500 ${
                isAnimating ? 'scale-75 -rotate-12 opacity-0' : 'scale-100 rotate-0 opacity-100'
              }`}
              style={{ transitionDelay: '200ms' }}
            >
              <span className="text-[9px] text-emerald-600 font-semibold uppercase tracking-tight text-center leading-[1.1] px-1">
                Legally<br/>Verified
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentAnimation;

