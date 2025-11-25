
import { useState, useEffect } from 'react';

const DynamicBackground = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const paperOffset = scrollY * 0.05;
  const shadowIntensity = Math.min(0.15, scrollY * 0.0003);

  return (
    <div 
      className="fixed inset-0 -z-10 transition-all duration-300"
      style={{
        background: `
          radial-gradient(circle at ${20 + paperOffset}% ${30 + paperOffset * 0.3}%, 
            rgba(245, 245, 245, 0.8) 0%, 
            transparent 40%),
          radial-gradient(circle at ${80 - paperOffset * 0.4}% ${70 + paperOffset * 0.2}%, 
            rgba(235, 235, 235, 0.6) 0%, 
            transparent 50%),
          radial-gradient(circle at ${50 + paperOffset * 0.2}% ${20 - paperOffset * 0.1}%, 
            rgba(250, 250, 250, 0.9) 0%, 
            transparent 35%),
          radial-gradient(circle at ${30 - paperOffset * 0.3}% ${80 + paperOffset * 0.4}%, 
            rgba(240, 240, 240, 0.7) 0%, 
            transparent 45%),
          linear-gradient(135deg, 
            #ffffff 0%, 
            #f8f8f8 ${20 + paperOffset * 0.1}%, 
            #f5f5f5 ${40 + paperOffset * 0.2}%,
            #f0f0f0 ${60 + paperOffset * 0.1}%,
            #f8f8f8 100%)
        `,
        boxShadow: `
          inset 0 0 100px rgba(0, 0, 0, ${shadowIntensity}),
          inset 0 0 200px rgba(0, 0, 0, ${shadowIntensity * 0.5})
        `,
        backgroundSize: '150% 150%, 120% 120%, 180% 180%, 160% 160%, 100% 100%',
        backgroundPosition: `
          ${-paperOffset * 0.5}px ${paperOffset * 0.3}px,
          ${paperOffset * 0.7}px ${-paperOffset * 0.4}px,
          ${-paperOffset * 0.3}px ${-paperOffset * 0.6}px,
          ${paperOffset * 0.4}px ${paperOffset * 0.5}px,
          center
        `
      }}
    >
      {/* Paper texture overlay */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 2px,
              rgba(0, 0, 0, 0.02) 2px,
              rgba(0, 0, 0, 0.02) 4px
            ),
            repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 3px,
              rgba(0, 0, 0, 0.01) 3px,
              rgba(0, 0, 0, 0.01) 6px
            )
          `,
          transform: `translateY(${scrollY * 0.1}px) rotate(${scrollY * 0.01}deg)`
        }}
      />
      
      {/* Crease shadows */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          background: `
            radial-gradient(ellipse at ${40 + paperOffset * 0.3}% ${60 + paperOffset * 0.2}%, 
              rgba(0, 0, 0, 0.1) 0%, 
              transparent 30%),
            radial-gradient(ellipse at ${70 - paperOffset * 0.2}% ${30 + paperOffset * 0.4}%, 
              rgba(0, 0, 0, 0.08) 0%, 
              transparent 25%),
            radial-gradient(ellipse at ${25 + paperOffset * 0.4}% ${80 - paperOffset * 0.3}%, 
              rgba(0, 0, 0, 0.06) 0%, 
              transparent 35%)
          `,
          transform: `translateY(${scrollY * -0.02}px)`
        }}
      />
    </div>
  );
};

export default DynamicBackground;
