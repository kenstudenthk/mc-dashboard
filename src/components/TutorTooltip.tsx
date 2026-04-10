import React from 'react';
import { useTutor } from '../contexts/TutorContext';
import { HelpCircle } from 'lucide-react';

interface TutorTooltipProps {
  children: React.ReactNode;
  text: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  wrapperClass?: string;
}

export const TutorTooltip: React.FC<TutorTooltipProps> = ({ 
  children, 
  text, 
  position = 'top', 
  wrapperClass = 'w-full' 
}) => {
  const { isTutorMode } = useTutor();

  if (!isTutorMode) {
    return <>{children}</>;
  }

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-3',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-3',
    left: 'right-full top-1/2 -translate-y-1/2 mr-3',
    right: 'left-full top-1/2 -translate-y-1/2 ml-3',
  };

  return (
    <div className={`relative group/tutor ${wrapperClass}`}>
      <div className="relative z-0 ring-2 ring-purple-500 ring-dashed rounded-lg transition-all duration-300 bg-purple-50/20">
        {children}
        <div className="absolute -top-2.5 -right-2.5 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center shadow-lg z-20 animate-bounce cursor-help">
          <HelpCircle className="w-4 h-4" />
        </div>
      </div>
      
      <div className={`absolute ${positionClasses[position]} w-64 p-3 bg-purple-900 text-white text-sm rounded-xl shadow-2xl opacity-0 invisible group-hover/tutor:opacity-100 group-hover/tutor:visible transition-all duration-200 z-[100] pointer-events-none`}>
        <div className="font-bold text-purple-300 mb-1 text-xs uppercase tracking-wider">Guideline</div>
        <div className="leading-relaxed">{text}</div>
        <div className={`absolute w-3 h-3 bg-purple-900 transform rotate-45 ${
          position === 'top' ? 'bottom-[-6px] left-1/2 -translate-x-1/2' :
          position === 'bottom' ? 'top-[-6px] left-1/2 -translate-x-1/2' :
          position === 'left' ? 'right-[-6px] top-1/2 -translate-y-1/2' :
          'left-[-6px] top-1/2 -translate-y-1/2'
        }`}></div>
      </div>
    </div>
  );
};
