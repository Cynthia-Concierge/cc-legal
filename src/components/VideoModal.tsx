import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause } from 'lucide-react';

interface VideoModalProps {
  videoUrl: string;
  title?: string;
  progressSpeedMultiplier?: number; // How much faster the progress bar moves (default 2.5x)
}

const VideoModal: React.FC<VideoModalProps> = ({ 
  videoUrl, 
  title,
  progressSpeedMultiplier = 2.5 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      // Calculate faster progress for display
      if (duration > 0) {
        const actualProgress = (video.currentTime / duration) * 100;
        // Make progress bar move faster by multiplying the progress
        const fastProgress = Math.min(actualProgress * progressSpeedMultiplier, 100);
        setDisplayProgress(fastProgress);
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    // Auto-play with muted first (required by most browsers), then unmute
    const playVideo = async () => {
      try {
        video.muted = true;
        await video.play();
        // Unmute after a short delay
        setTimeout(() => {
          video.muted = false;
        }, 500);
      } catch (error) {
        console.error('Auto-play failed:', error);
        // Try unmuted play as fallback
        try {
          video.muted = false;
          await video.play();
        } catch (e) {
          console.error('Unmuted play also failed:', e);
        }
      }
    };

    // Try to play when video can play
    if (video.readyState >= 2) {
      playVideo();
    } else {
      video.addEventListener('canplay', playVideo, { once: true });
    }

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('canplay', playVideo);
    };
  }, [videoUrl, progressSpeedMultiplier, duration]);

  const handleClick = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-cover"
        playsInline
        autoPlay
        loop={false}
        controls={false}
        preload="auto"
      />
      
      {/* Play/Pause Overlay - Only visible on hover */}
      {isHovered && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity duration-200">
          <div className="bg-white/20 backdrop-blur-md rounded-full p-4">
            {isPlaying ? (
              <Pause className="w-12 h-12 text-white" fill="white" />
            ) : (
              <Play className="w-12 h-12 text-white ml-1" fill="white" />
            )}
          </div>
        </div>
      )}
      
      {/* Progress Bar Overlay - Fast moving, always visible */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-16 pb-4 px-4">
        {/* Progress Bar */}
        <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden shadow-lg">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 transition-all duration-75 ease-linear shadow-lg"
            style={{ width: `${displayProgress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default VideoModal;

