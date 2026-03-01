import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Undo2 } from 'lucide-react';

interface VectorPathEditorProps {
  path: string;
  onChange: (path: string) => void;
  color: string;
}

// Helper to parse simple M x y L x y Z paths into points [-1, 1]
const parsePath = (path: string): {x: number, y: number}[] => {
  if (!path) return [];
  const points: {x: number, y: number}[] = [];
  const commands = path.split(' ').filter(Boolean);
  let i = 0;
  while (i < commands.length) {
    const cmd = commands[i];
    if (cmd === 'M' || cmd === 'L') {
      points.push({ x: parseFloat(commands[i+1]), y: parseFloat(commands[i+2]) });
      i += 3;
    } else if (cmd === 'Z') {
      i += 1;
    } else {
      i += 1; // fallback
    }
  }
  return points;
};

// Helper to serialize points to path
const serializePath = (points: {x: number, y: number}[]): string => {
  if (points.length === 0) return '';
  let path = `M ${points[0].x.toFixed(3)} ${points[0].y.toFixed(3)}`;
  for (let i = 1; i < points.length; i++) {
    path += ` L ${points[i].x.toFixed(3)} ${points[i].y.toFixed(3)}`;
  }
  path += ' Z';
  return path;
};

export default function VectorPathEditor({ path, onChange, color }: VectorPathEditorProps) {
  const [points, setPoints] = useState<{x: number, y: number}[]>(parsePath(path));
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const size = 200;
  const center = size / 2;

  useEffect(() => {
    setPoints(parsePath(path));
  }, [path]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, size, size);

    // Draw grid
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(center, 0); ctx.lineTo(center, size);
    ctx.moveTo(0, center); ctx.lineTo(size, center);
    ctx.stroke();
    
    ctx.strokeStyle = '#222';
    ctx.beginPath();
    ctx.arc(center, center, center - 10, 0, Math.PI * 2);
    ctx.stroke();

    if (points.length === 0) return;

    // Draw lines
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(center + points[0].x * (center - 10), center + points[0].y * (center - 10));
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(center + points[i].x * (center - 10), center + points[i].y * (center - 10));
    }
    if (points.length > 2) {
      ctx.closePath();
    }
    ctx.stroke();
    
    // Fill if closed
    if (points.length > 2) {
      ctx.fillStyle = color + '40'; // 25% opacity
      ctx.fill();
    }

    // Draw points
    ctx.fillStyle = '#fff';
    points.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(center + p.x * (center - 10), center + p.y * (center - 10), 4, 0, Math.PI * 2);
      ctx.fill();
      if (i === 0) {
        ctx.strokeStyle = '#0f0';
        ctx.stroke();
      }
    });

  }, [points, color]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert to normalized coordinates [-1, 1]
    const nx = (x - center) / (center - 10);
    const ny = (y - center) / (center - 10);

    // Clamp to [-1, 1]
    const cx = Math.max(-1, Math.min(1, nx));
    const cy = Math.max(-1, Math.min(1, ny));

    const newPoints = [...points, { x: cx, y: cy }];
    setPoints(newPoints);
    onChange(serializePath(newPoints));
  };

  const handleUndo = () => {
    const newPoints = points.slice(0, -1);
    setPoints(newPoints);
    onChange(serializePath(newPoints));
  };

  const handleClear = () => {
    setPoints([]);
    onChange('');
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-xs text-zinc-500 uppercase font-semibold">Vector Shape Editor</label>
        <div className="flex gap-2">
          <button 
            onClick={handleUndo}
            disabled={points.length === 0}
            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 rounded text-zinc-300"
            title="Undo last point"
          >
            <Undo2 size={14} />
          </button>
          <button 
            onClick={handleClear}
            disabled={points.length === 0}
            className="p-1.5 bg-zinc-800 hover:bg-red-900/50 text-red-400 disabled:opacity-50 rounded"
            title="Clear all points"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 flex justify-center">
        <canvas 
          ref={canvasRef}
          width={size}
          height={size}
          onClick={handleCanvasClick}
          className="cursor-crosshair bg-black rounded"
        />
      </div>
      <p className="text-xs text-zinc-500 text-center">Click to add points. Shape auto-closes.</p>
    </div>
  );
}
