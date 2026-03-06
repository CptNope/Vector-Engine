import React, { useState, useRef, useEffect } from 'react';

interface KnobProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (val: number) => void;
  unit?: string;
  size?: number;
}

export function Knob({ label, value, min, max, step = 1, onChange, unit = '', size = 56 }: KnobProps) {
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);
  const startValRef = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    startYRef.current = e.clientY;
    startValRef.current = value;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const deltaY = startYRef.current - e.clientY;
      const range = max - min;
      // 100px drag = full range
      const deltaVal = (deltaY / 100) * range;
      
      let newVal = startValRef.current + deltaVal;
      newVal = Math.max(min, Math.min(max, newVal));
      
      if (step) {
        newVal = Math.round(newVal / step) * step;
      }
      
      onChange(newVal);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, min, max, step, onChange]);

  // Calculate rotation (-135deg to +135deg)
  const percent = (value - min) / (max - min);
  const rotation = -135 + (percent * 270);

  return (
    <div className="flex flex-col items-center space-y-2">
      <div 
        className="relative cursor-ns-resize group"
        style={{ width: size, height: size }}
        onMouseDown={handleMouseDown}
      >
        {/* Track */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full drop-shadow-md">
          <path
            d="M 20 80 A 45 45 0 1 1 80 80"
            fill="none"
            stroke="#27272a" // zinc-800
            strokeWidth="10"
            strokeLinecap="round"
          />
          {/* Value Indicator */}
          <path
            d="M 20 80 A 45 45 0 1 1 80 80"
            fill="none"
            stroke="#10b981" // emerald-500
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray="212" // approx length of arc
            strokeDashoffset={212 - (percent * 212)}
          />
        </svg>
        
        {/* Knob Body */}
        <div 
          className="absolute inset-2 bg-zinc-900 rounded-full border border-zinc-700 shadow-inner flex items-center justify-center group-hover:border-emerald-500/50 transition-colors"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {/* Pointer */}
          <div className="w-1 h-3 bg-emerald-400 rounded-full absolute top-1" />
        </div>
      </div>
      
      <div className="text-center">
        <div className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider">{label}</div>
        <div className="text-xs text-emerald-400 font-mono">
          {value.toFixed(step < 1 ? 2 : 0)}{unit}
        </div>
      </div>
    </div>
  );
}
