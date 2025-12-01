import React from 'react';

interface VisualizerProps {
  isActive: boolean;
  color?: string;
}

const Visualizer: React.FC<VisualizerProps> = ({ isActive, color = '#1e293b' }) => {
  if (!isActive) {
    return (
      <div className="flex items-center justify-center space-x-1 h-8">
        <div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
        <div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
        <div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
      </div>
    );
  }

  // Use inline style for dynamic color prop
  const barStyle = { backgroundColor: color };

  return (
    <div className="flex items-center justify-center space-x-1 h-8">
      <div className="w-1 h-3 rounded-full animate-[bounce_1s_infinite_100ms]" style={barStyle}></div>
      <div className="w-1 h-5 rounded-full animate-[bounce_1s_infinite_200ms]" style={barStyle}></div>
      <div className="w-1 h-8 rounded-full animate-[bounce_1s_infinite_300ms]" style={barStyle}></div>
      <div className="w-1 h-5 rounded-full animate-[bounce_1s_infinite_200ms]" style={barStyle}></div>
      <div className="w-1 h-3 rounded-full animate-[bounce_1s_infinite_100ms]" style={barStyle}></div>
    </div>
  );
};

export default Visualizer;

