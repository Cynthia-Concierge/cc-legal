
import { useState } from 'react';
import { Play, ExternalLink } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface YouTubeVideoProps {
  videoId: string;
  title: string;
}

const YouTubeVideo = ({ videoId, title }: YouTubeVideoProps) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  const videoUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-900 border border-yellow-400/20">
        {!isPlaying ? (
          <>
            <img 
              src={thumbnailUrl} 
              alt={title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center group cursor-pointer"
                 onClick={() => setIsPlaying(true)}>
              <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 w-20 h-20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-2xl">
                <Play className="h-8 w-8 text-black ml-1" fill="black" />
              </div>
            </div>
            <div className="absolute top-4 right-4">
              <Button 
                variant="outline" 
                size="sm"
                className="border-yellow-400/50 text-yellow-400 hover:bg-yellow-400 hover:text-black"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
                }}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Watch on YouTube
              </Button>
            </div>
          </>
        ) : (
          <iframe
            src={videoUrl}
            title={title}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}
      </div>
    </div>
  );
};

export default YouTubeVideo;
