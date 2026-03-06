import React, { useState, useRef, useEffect } from 'react';
import { NoteDef } from '../../types';

interface PianoRollProps {
  notes: NoteDef[];
  onChange: (notes: NoteDef[]) => void;
  duration: number; // Total duration in units
  maxPitch?: number;
  minPitch?: number;
  pixelsPerUnit?: number;
  snapStep?: number;
  playheadTime?: number | null;
  height?: number | string;
}

export function PianoRoll({ 
  notes, 
  onChange, 
  duration, 
  maxPitch = 84, 
  minPitch = 48,
  pixelsPerUnit = 100,
  snapStep = 0.05,
  playheadTime = null,
  height = 400
}: PianoRollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragNoteIndex, setDragNoteIndex] = useState<number | null>(null);
  const [dragType, setDragType] = useState<'move' | 'resize' | null>(null);

  const pitchRange = maxPitch - minPitch + 1;
  const rowHeight = 20;

  // Scroll to middle C (pitch 60) on mount
  useEffect(() => {
    if (scrollRef.current) {
      const middleCY = (maxPitch - 60) * rowHeight;
      scrollRef.current.scrollTop = middleCY - (typeof height === 'number' ? height / 2 : 200);
    }
  }, []);

  const handleMouseDown = (e: React.MouseEvent, index: number, type: 'move' | 'resize') => {
    e.stopPropagation();
    setIsDragging(true);
    setDragNoteIndex(index);
    setDragType(type);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || dragNoteIndex === null || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newTime = Math.max(0, x / pixelsPerUnit);
    const newPitch = Math.max(minPitch, Math.min(maxPitch, maxPitch - Math.floor(y / rowHeight)));

    const newNotes = [...notes];
    const note = { ...newNotes[dragNoteIndex] };

    if (dragType === 'move') {
      note.time = Math.max(0, Math.round(newTime / snapStep) * snapStep);
      note.pitch = newPitch;
    } else if (dragType === 'resize') {
      const newDuration = Math.max(snapStep, newTime - note.time);
      note.duration = Math.round(newDuration / snapStep) * snapStep;
    }

    newNotes[dragNoteIndex] = note;
    onChange(newNotes);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragNoteIndex(null);
    setDragType(null);
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const time = Math.max(0, Math.round((x / pixelsPerUnit) / snapStep) * snapStep);
    const pitch = Math.max(minPitch, Math.min(maxPitch, maxPitch - Math.floor(y / rowHeight)));

    onChange([...notes, { pitch, time, duration: snapStep * 4, velocity: 1 }]);
  };

  const handleContextMenu = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    const newNotes = notes.filter((_, i) => i !== index);
    onChange(newNotes);
  };

  return (
    <div 
      ref={scrollRef}
      className="border border-zinc-800 rounded bg-zinc-950 overflow-auto relative select-none custom-scrollbar"
      style={{ height }}
    >
      <div 
        ref={containerRef}
        className="relative"
        style={{ 
          height: pitchRange * rowHeight, 
          width: Math.max(duration * pixelsPerUnit, 800),
          minWidth: '100%'
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleBackgroundClick}
      >
        {/* Grid lines */}
        {Array.from({ length: pitchRange }).map((_, i) => {
          const pitch = maxPitch - i;
          const isBlackKey = [1, 3, 6, 8, 10].includes(pitch % 12);
          return (
            <div 
              key={i} 
              className={`absolute w-full border-b border-zinc-800/50 flex items-center`}
              style={{ 
                top: i * rowHeight, 
                height: rowHeight,
                backgroundColor: isBlackKey ? 'rgba(24, 24, 27, 0.8)' : 'rgba(39, 39, 42, 0.3)'
              }}
            >
              <span className="text-[10px] text-zinc-600 ml-1 select-none pointer-events-none w-6 inline-block">
                {pitch}
              </span>
            </div>
          );
        })}

        {/* Time grid lines */}
        {Array.from({ length: Math.ceil(duration / snapStep) }).map((_, i) => (
          <div 
            key={i}
            className={`absolute h-full border-l pointer-events-none ${i % 4 === 0 ? 'border-zinc-700/50' : 'border-zinc-800/30'}`}
            style={{ left: i * snapStep * pixelsPerUnit }}
          />
        ))}

        {/* Notes */}
        {notes.map((note, i) => (
          <div
            key={i}
            className="absolute bg-emerald-500 rounded-sm border border-emerald-400 cursor-move hover:bg-emerald-400 transition-colors group"
            style={{
              left: note.time * pixelsPerUnit,
              top: (maxPitch - note.pitch) * rowHeight,
              width: note.duration * pixelsPerUnit,
              height: rowHeight - 2,
              marginTop: 1
            }}
            onMouseDown={(e) => handleMouseDown(e, i, 'move')}
            onContextMenu={(e) => handleContextMenu(e, i)}
          >
            {/* Resize handle */}
            <div 
              className="absolute right-0 top-0 w-2 h-full cursor-e-resize opacity-0 group-hover:opacity-100 bg-white/20"
              onMouseDown={(e) => handleMouseDown(e, i, 'resize')}
            />
          </div>
        ))}

        {/* Playhead */}
        {playheadTime !== null && (
          <div 
            className="absolute top-0 h-full w-px bg-red-500 pointer-events-none z-10"
            style={{ left: playheadTime * pixelsPerUnit }}
          >
            <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-red-500 rounded-full" />
          </div>
        )}
      </div>
    </div>
  );
}
