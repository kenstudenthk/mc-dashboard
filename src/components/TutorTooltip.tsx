import React, { useRef, useState } from "react";
import ReactDOM from "react-dom";
import { useTutor } from "../contexts/TutorContext";
import { HelpCircle } from "lucide-react";

interface TutorTooltipProps {
  children: React.ReactNode;
  text: string;
  position?: "top" | "bottom" | "left" | "right";
  wrapperClass?: string;
}

export const TutorTooltip: React.FC<TutorTooltipProps> = ({
  children,
  text,
  position = "top",
  wrapperClass = "w-full",
}) => {
  const { isTutorMode } = useTutor();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  if (!isTutorMode) {
    return <>{children}</>;
  }

  const getTooltipStyle = (): React.CSSProperties => {
    if (!wrapperRef.current) return { display: "none" };
    const rect = wrapperRef.current.getBoundingClientRect();
    const gap = 12;
    const tooltipWidth = 256;

    switch (position) {
      case "right":
        return {
          position: "fixed",
          top: rect.top + rect.height / 2,
          left: rect.right + gap,
          transform: "translateY(-50%)",
          width: tooltipWidth,
        };
      case "left":
        return {
          position: "fixed",
          top: rect.top + rect.height / 2,
          left: rect.left - gap - tooltipWidth,
          transform: "translateY(-50%)",
          width: tooltipWidth,
        };
      case "bottom":
        return {
          position: "fixed",
          top: rect.bottom + gap,
          left: rect.left + rect.width / 2,
          transform: "translateX(-50%)",
          width: tooltipWidth,
        };
      case "top":
      default:
        return {
          position: "fixed",
          top: rect.top - gap,
          left: rect.left + rect.width / 2,
          transform: "translate(-50%, -100%)",
          width: tooltipWidth,
        };
    }
  };

  const arrowClass = {
    top: "bottom-[-6px] left-1/2 -translate-x-1/2",
    bottom: "top-[-6px] left-1/2 -translate-x-1/2",
    left: "right-[-6px] top-1/2 -translate-y-1/2",
    right: "left-[-6px] top-1/2 -translate-y-1/2",
  };

  return (
    <div
      ref={wrapperRef}
      className={`relative ${wrapperClass}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative z-0 ring-2 ring-purple-500 ring-dashed rounded-lg transition-all duration-300 bg-purple-50/20">
        {children}
        <div className="absolute -top-2.5 -right-2.5 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center shadow-lg z-20 animate-bounce cursor-help">
          <HelpCircle className="w-4 h-4" />
        </div>
      </div>

      {isHovered &&
        ReactDOM.createPortal(
          <div
            style={{ ...getTooltipStyle(), zIndex: 9999 }}
            className="p-3 bg-purple-900 text-white text-sm rounded-xl shadow-2xl pointer-events-none"
          >
            <div className="font-bold text-purple-300 mb-1 text-xs uppercase tracking-wider">
              Guideline
            </div>
            <div className="leading-relaxed">{text}</div>
            <div
              className={`absolute w-3 h-3 bg-purple-900 transform rotate-45 ${arrowClass[position]}`}
            ></div>
          </div>,
          document.body,
        )}
    </div>
  );
};
