import React from 'react';
import { NoteDef } from '../../types';

interface StepSequencerProps {
  notes: NoteDef[];
  onChange: (notes: NoteDef[]) => void;
  duration: number; // in beats
  playheadTime?: number | null;
  pixelsPerUnit?: number;
}

const DRUM_MAP = [
  { pitch: 46, name: 'Open HH' },
  { pitch: 42, name: 'Closed HH' },
  { pitch: 50, name: 'High Tom' },
  { pitch: 45, name: 'Low Tom' },
  { pitch: 38, name: 'Snare' },
  { pitch: 36, name: 'Kick' },
];

export function StepSequencer({ notes, onChange, duration, playheadTime, pixelsPerUnit = 50 }: StepSequencerProps) {
  const steps = Math.ceil(duration * 4); // 16th notes
  const stepWidth = pixelsPerUnit * 0.25; // width of one 16th note
  
  const toggleNote = (pitch: number, step: number) => {
    const time = step * 0.25;
    const existingIndex = notes.findIndex(n => n.pitch === pitch && Math.abs(n.time - time) < 0.01);
    
    if (existingIndex >= 0) {
      const newNotes = [...notes];
      newNotes.splice(existingIndex, 1);
      onChange(newNotes);
    } else {
      onChange([...notes, { pitch, time, duration: 0.25, velocity: 1 }]);
    }
  };

  return (
    <div className="border border-zinc-800 rounded bg-zinc-950 overflow-x-auto relative select-none custom-scrollbar">
      <div className="min-w-max flex">
        {/* Labels */}
        <div className="w-24 flex-shrink-0 border-r border-zinc-800 bg-zinc-900/50 sticky left-0 z-20">
          {DRUM_MAP.map((drum, i) => (
            <div 
              key={drum.pitch} 
              className={`h-8 flex items-center px-2 text-[10px] text-zinc-400 font-semibold uppercase ${i !== DRUM_MAP.length - 1 ? 'border-b border-zinc-800/50' : ''}`}
            >
              {drum.name}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="relative flex-1 flex">
          {Array.from({ length: steps }).map((_, step) => {
            const isBeat = step % 4 === 0;
            return (
              <div 
                key={step} 
                className={`flex-shrink-0 flex flex-col border-r ${isBeat ? 'border-zinc-700/50' : 'border-zinc-800/30'}`}
                style={{ width: `${stepWidth}px` }}
              >
                {DRUM_MAP.map((drum, i) => {
                  const time = step * 0.25;
                  const isActive = notes.some(n => n.pitch === drum.pitch && Math.abs(n.time - time) < 0.01);
                  
                  return (
                    <div 
                      key={`${drum.pitch}-${step}`}
                      className={`h-8 flex items-center justify-center cursor-pointer hover:bg-zinc-800/50 transition-colors ${i !== DRUM_MAP.length - 1 ? 'border-b border-zinc-800/50' : ''}`}
                      onClick={() => toggleNote(drum.pitch, step)}
                    >
                      {isActive && (
                        <div 
                          className="h-6 rounded-sm bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" 
                          style={{ width: `${Math.max(4, stepWidth - 4)}px` }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
          
          {/* Playhead */}
          {playheadTime !== null && (
            <div 
              className="absolute top-0 bottom-0 w-px bg-red-500 pointer-events-none z-10"
              style={{ left: `${playheadTime * pixelsPerUnit}px` }}
            >
              <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-red-500 rounded-full" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
