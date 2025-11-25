
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from 'lucide-react';

interface InteractiveCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  index: number;
}

const InteractiveCard = ({ icon: Icon, title, description, index }: InteractiveCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card 
      className="bg-white border-gray-300 hover:border-teal-400/50 transition-all duration-300 group cursor-pointer relative overflow-hidden shadow-lg"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        transform: isHovered ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
        boxShadow: isHovered ? '0 20px 40px rgba(20, 184, 166, 0.2)' : '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}
    >
      <div 
        className="absolute inset-0 bg-gradient-to-br from-teal-400/10 to-transparent opacity-0 transition-opacity duration-300"
        style={{ opacity: isHovered ? 1 : 0 }}
      />
      <CardHeader className="relative z-10">
        <div 
          className="bg-gradient-to-r from-teal-500 to-emerald-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-all duration-300"
          style={{
            transform: isHovered ? 'scale(1.1) rotate(5deg)' : 'scale(1) rotate(0deg)',
            boxShadow: isHovered ? '0 8px 20px rgba(20, 184, 166, 0.4)' : 'none'
          }}
        >
          <Icon className="h-6 w-6 text-white" />
        </div>
        <CardTitle className="text-gray-900 text-lg transition-colors duration-300">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        <CardDescription 
          className="text-gray-700 transition-colors duration-300"
          style={{ color: isHovered ? '#374151' : '#6b7280' }}
        >
          {description}
        </CardDescription>
      </CardContent>
      <div 
        className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-teal-500 to-emerald-600 transition-all duration-500"
        style={{ 
          width: isHovered ? '100%' : '0%',
          opacity: isHovered ? 1 : 0 
        }}
      />
    </Card>
  );
};

export default InteractiveCard;
