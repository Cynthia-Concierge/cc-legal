import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import VideoModal from '@/components/VideoModal';
import { ShieldCheck } from 'lucide-react';

const Booking = () => {
  const navigate = useNavigate();

  const handleScheduleDemo = () => {
    // Navigate to the schedule demo page
    navigate('/schedule-demo');
  };

  // Replace with your actual video URL
  // For now using a placeholder - you can use any video URL (MP4, WebM, etc.)
  const videoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        {/* Main Headline Section */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight mb-4">
            Give Us <span className="text-emerald-600">7 Days</span>, And We'll Give You <span className="text-emerald-600">Complete Legal Protection</span> For Your <span className="text-emerald-600">Wellness Business</span>.
          </h1>
        </div>

        {/* Guarantee Banner */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-6 mb-8 md:mb-12 text-center shadow-sm">
          <p className="text-lg md:text-xl font-bold text-slate-900">
            Every legal document you need to protect your business from lawsuits*
          </p>
          <p className="text-xs text-slate-600 mt-2">*This call is 100% free.</p>
        </div>

        {/* Video Modal Section */}
        <div className="mb-8 md:mb-12">
          <div className="bg-slate-900 rounded-2xl p-4 md:p-8 relative overflow-hidden">
            {/* Grid pattern overlay */}
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: `
                linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px'
            }}></div>
            
            {/* Sparkle effect */}
            <div className="absolute inset-0">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-emerald-400 rounded-full animate-pulse"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${2 + Math.random() * 2}s`
                  }}
                ></div>
              ))}
            </div>

            {/* Video Content */}
            <div className="relative z-10">
              <VideoModal videoUrl={videoUrl} title="See How We Protect Your Wellness Business" />
            </div>
          </div>
        </div>

        {/* Target Markets Section */}
        <div className="bg-slate-900 rounded-2xl p-6 md:p-12 mb-8 md:mb-12 text-center relative overflow-hidden">
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}></div>
          
          {/* Sparkle effect */}
          <div className="absolute inset-0">
            {[...Array(15)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-teal-400 rounded-full animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`
                }}
              ></div>
            ))}
          </div>

          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 mb-2" style={{
              textShadow: '0 0 20px rgba(255, 255, 0, 0.3)',
              filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5))'
            }}>
              GYMS, STUDIOS, <span className="text-white">&</span> WELLNESS BUSINESSES
            </h2>
            <p className="text-emerald-300 text-lg md:text-xl font-semibold mt-4">
              Trusted by 1,000+ studios and retreat leaders
            </p>
          </div>
        </div>

        {/* Schedule Demo Button */}
        <div className="text-center">
          <style>{`
            @keyframes pulse-glow {
              0%, 100% {
                box-shadow: 0 0 25px rgba(239, 68, 68, 0.6), 0 0 50px rgba(220, 38, 38, 0.4), 0 0 75px rgba(239, 68, 68, 0.3), 0 10px 30px rgba(0, 0, 0, 0.3);
              }
              50% {
                box-shadow: 0 0 35px rgba(239, 68, 68, 0.8), 0 0 70px rgba(220, 38, 38, 0.6), 0 0 100px rgba(239, 68, 68, 0.4), 0 15px 40px rgba(0, 0, 0, 0.4);
              }
            }
            @keyframes float {
              0%, 100% {
                transform: translateY(0px);
              }
              50% {
                transform: translateY(-10px);
              }
            }
            @keyframes shimmer {
              0% {
                background-position: -200% center;
              }
              100% {
                background-position: 200% center;
              }
            }
            .schedule-demo-btn {
              animation: pulse-glow 2s ease-in-out infinite, float 3s ease-in-out infinite;
              cursor: pointer;
              position: relative;
              overflow: visible;
              background-size: 200% auto;
            }
            .schedule-demo-btn:hover {
              animation: pulse-glow 1s ease-in-out infinite, float 2s ease-in-out infinite;
            }
            .schedule-demo-btn::after {
              content: '';
              position: absolute;
              inset: -2px;
              border-radius: inherit;
              padding: 2px;
              background: linear-gradient(45deg, rgba(239, 68, 68, 0.8), rgba(220, 38, 38, 0.8), rgba(239, 68, 68, 0.8));
              background-size: 200% auto;
              -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
              -webkit-mask-composite: xor;
              mask-composite: exclude;
              animation: shimmer 3s linear infinite;
              pointer-events: none;
              z-index: -1;
            }
          `}</style>
          <Button
            onClick={handleScheduleDemo}
            className="schedule-demo-btn bg-gradient-to-r from-red-600 via-red-500 to-red-600 hover:from-red-500 hover:via-red-400 hover:to-red-500 text-white text-lg md:text-xl font-extrabold px-12 md:px-16 py-6 md:py-8 rounded-xl shadow-2xl transition-all duration-300 transform hover:scale-110 w-full sm:w-auto border-2 border-red-300/70 relative z-10 uppercase tracking-wide"
            size="lg"
          >
            <ShieldCheck className="mr-2 h-6 w-6 animate-pulse" />
            <span className="relative z-10 drop-shadow-lg">Schedule Demo</span>
            <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-400/30 via-red-300/30 to-red-400/30 opacity-0 hover:opacity-100 transition-opacity duration-300"></span>
          </Button>
          <p className="mt-4 text-sm text-slate-600 font-medium animate-pulse">👍 Click to schedule your free consultation</p>
        </div>
      </div>
    </div>
  );
};

export default Booking;

