import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Undo2, Grid, FlipHorizontal, FlipVertical, RotateCw, AlignCenter, Plus, Layers } from 'lucide-react';
import { VectorPath } from '../../types';

interface VectorPathEditorProps {
  paths: VectorPath[];
  onChange: (paths: VectorPath[]) => void;
  defaultColor: string;
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

export default function VectorPathEditor({ paths, onChange, defaultColor }: VectorPathEditorProps) {
  const [activeLayer, setActiveLayer] = useState(0);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const size = 200;
  const center = size / 2;
  const radius = center - 10;

  // Initialize if empty
  useEffect(() => {
    if (paths.length === 0) {
      onChange([{ path: '', color: defaultColor }]);
    }
  }, []);

  const currentPaths = paths.length > 0 ? paths : [{ path: '', color: defaultColor }];
  // Ensure activeLayer is valid
  const safeActiveLayer = Math.min(activeLayer, currentPaths.length - 1);
  const activePoints = parsePath(currentPaths[safeActiveLayer]?.path || '');

  const updateActivePath = (newPoints: {x: number, y: number}[]) => {
    const newPaths = [...currentPaths];
    newPaths[safeActiveLayer] = { ...newPaths[safeActiveLayer], path: serializePath(newPoints) };
    onChange(newPaths);
  };

  const updateActiveColor = (color: string) => {
    const newPaths = [...currentPaths];
    newPaths[safeActiveLayer] = { ...newPaths[safeActiveLayer], color };
    onChange(newPaths);
  };

  const addLayer = () => {
    const newPaths = [...currentPaths, { path: '', color: defaultColor }];
    onChange(newPaths);
    setActiveLayer(newPaths.length - 1);
  };

  const removeLayer = (idx: number) => {
    if (currentPaths.length <= 1) return;
    const newPaths = currentPaths.filter((_, i) => i !== idx);
    onChange(newPaths);
    setActiveLayer(Math.min(safeActiveLayer, newPaths.length - 1));
  };

  useEffect(() => {
    let animationFrameId: number;

    const render = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;

      ctx.clearRect(0, 0, size, size);

      // Draw grid
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      
      if (snapToGrid) {
        ctx.beginPath();
        for (let i = -1; i <= 1; i += 0.2) {
          const pos = center + i * radius;
          ctx.moveTo(pos, 0); ctx.lineTo(pos, size);
          ctx.moveTo(0, pos); ctx.lineTo(size, pos);
        }
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(center, 0); ctx.lineTo(center, size);
        ctx.moveTo(0, center); ctx.lineTo(size, center);
        ctx.stroke();
      }
      
      ctx.strokeStyle = '#222';
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, Math.PI * 2);
      ctx.stroke();

      const now = performance.now() / 1000;

      // Draw all layers
      currentPaths.forEach((layer, layerIdx) => {
        const pts = parsePath(layer.path);
        if (pts.length === 0) return;

        ctx.save();
        ctx.translate(center, center);

        // Apply animations
        if (layer.rotationSpeed) {
          ctx.rotate(layer.rotationSpeed * now * (Math.PI / 180));
        }
        
        if (layer.pulseSpeed && layer.pulseMin !== undefined && layer.pulseMax !== undefined) {
          const range = layer.pulseMax - layer.pulseMin;
          const scale = layer.pulseMin + (Math.sin(now * layer.pulseSpeed * Math.PI * 2) * 0.5 + 0.5) * range;
          ctx.scale(scale, scale);
        }

        ctx.strokeStyle = layer.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(pts[0].x * radius, pts[0].y * radius);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x * radius, pts[i].y * radius);
        }
        if (pts.length > 2) {
          ctx.closePath();
        }
        ctx.stroke();
        
        // Fill if closed
        if (pts.length > 2) {
          ctx.fillStyle = layer.color + '40'; // 25% opacity
          ctx.fill();
        }

        // Draw points only for active layer
        if (layerIdx === safeActiveLayer) {
          // Reset transform so points don't rotate/scale, making them easier to click/drag
          ctx.restore();
          ctx.save();
          ctx.translate(center, center);
          
          pts.forEach((p, i) => {
            ctx.fillStyle = i === hoverIdx ? '#ff0' : (i === draggingIdx ? '#0f0' : '#fff');
            ctx.beginPath();
            ctx.arc(p.x * radius, p.y * radius, i === hoverIdx ? 6 : 4, 0, Math.PI * 2);
            ctx.fill();
            if (i === 0) {
              ctx.strokeStyle = '#0f0';
              ctx.lineWidth = 2;
              ctx.stroke();
            }
          });
        }

        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [currentPaths, safeActiveLayer, snapToGrid, hoverIdx, draggingIdx]);

  const getMouseCoords = (e: React.MouseEvent | MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let nx = (x - center) / radius;
    let ny = (y - center) / radius;

    if (snapToGrid) {
      nx = Math.round(nx * 10) / 10;
      ny = Math.round(ny * 10) / 10;
    }

    return {
      x: Math.max(-1, Math.min(1, nx)),
      y: Math.max(-1, Math.min(1, ny))
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const coords = getMouseCoords(e);
    
    // Check if clicking an existing point
    const clickedIdx = activePoints.findIndex(p => {
      const dx = p.x - coords.x;
      const dy = p.y - coords.y;
      return Math.sqrt(dx*dx + dy*dy) < 0.1; // threshold
    });

    if (clickedIdx !== -1) {
      setDraggingIdx(clickedIdx);
      return;
    }

    // Check if clicking on a line segment to insert a point
    if (activePoints.length >= 2) {
      let insertIdx = -1;
      let minDistSq = 0.01; // threshold squared (0.1^2)
      
      for (let i = 0; i < activePoints.length; i++) {
        const p1 = activePoints[i];
        const p2 = activePoints[(i + 1) % activePoints.length];
        
        // Only check closing segment if there are > 2 points
        if (i === activePoints.length - 1 && activePoints.length <= 2) continue;

        const l2 = (p2.x - p1.x)**2 + (p2.y - p1.y)**2;
        let distSq;
        if (l2 === 0) {
          distSq = (coords.x - p1.x)**2 + (coords.y - p1.y)**2;
        } else {
          let t = ((coords.x - p1.x) * (p2.x - p1.x) + (coords.y - p1.y) * (p2.y - p1.y)) / l2;
          t = Math.max(0, Math.min(1, t));
          const projX = p1.x + t * (p2.x - p1.x);
          const projY = p1.y + t * (p2.y - p1.y);
          distSq = (coords.x - projX)**2 + (coords.y - projY)**2;
        }

        if (distSq < minDistSq) {
          minDistSq = distSq;
          insertIdx = i + 1;
        }
      }

      if (insertIdx !== -1) {
        const newPoints = [...activePoints];
        newPoints.splice(insertIdx, 0, coords);
        updateActivePath(newPoints);
        setDraggingIdx(insertIdx);
        return;
      }
    }

    // Append new point
    const newPoints = [...activePoints, coords];
    updateActivePath(newPoints);
    setDraggingIdx(newPoints.length - 1);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const coords = getMouseCoords(e);

    if (draggingIdx !== null) {
      const newPoints = [...activePoints];
      newPoints[draggingIdx] = coords;
      updateActivePath(newPoints);
    } else {
      // Hover detection
      const hIdx = activePoints.findIndex(p => {
        const dx = p.x - coords.x;
        const dy = p.y - coords.y;
        return Math.sqrt(dx*dx + dy*dy) < 0.1;
      });
      setHoverIdx(hIdx !== -1 ? hIdx : null);
    }
  };

  const handleMouseUp = () => {
    setDraggingIdx(null);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (hoverIdx !== null) {
      const newPoints = activePoints.filter((_, i) => i !== hoverIdx);
      updateActivePath(newPoints);
      setHoverIdx(null);
    }
  };

  const handleFlipX = () => {
    const newPoints = activePoints.map(p => ({ x: -p.x, y: p.y }));
    updateActivePath(newPoints);
  };

  const handleFlipY = () => {
    const newPoints = activePoints.map(p => ({ x: p.x, y: -p.y }));
    updateActivePath(newPoints);
  };

  const handleRotate = () => {
    const newPoints = activePoints.map(p => ({ x: -p.y, y: p.x }));
    updateActivePath(newPoints);
  };

  const handleCenter = () => {
    if (activePoints.length === 0) return;
    const minX = Math.min(...activePoints.map(p => p.x));
    const maxX = Math.max(...activePoints.map(p => p.x));
    const minY = Math.min(...activePoints.map(p => p.y));
    const maxY = Math.max(...activePoints.map(p => p.y));
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const newPoints = activePoints.map(p => ({ x: p.x - cx, y: p.y - cy }));
    updateActivePath(newPoints);
  };

  const handleUndo = () => {
    const newPoints = activePoints.slice(0, -1);
    updateActivePath(newPoints);
  };

  const handleClear = () => {
    updateActivePath([]);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className="text-xs text-zinc-500 uppercase font-semibold">Vector Shape Editor</label>
        <div className="flex gap-1">
          <button onClick={handleFlipX} className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300" title="Flip Horizontal"><FlipHorizontal size={14} /></button>
          <button onClick={handleFlipY} className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300" title="Flip Vertical"><FlipVertical size={14} /></button>
          <button onClick={handleRotate} className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300" title="Rotate 90°"><RotateCw size={14} /></button>
          <button onClick={handleCenter} className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300" title="Center Shape"><AlignCenter size={14} /></button>
          <div className="w-px h-4 bg-zinc-700 mx-1 self-center" />
          <button 
            onClick={() => setSnapToGrid(!snapToGrid)}
            className={`p-1.5 rounded transition-colors ${snapToGrid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400'}`}
            title="Toggle Grid Snapping"
          >
            <Grid size={14} />
          </button>
          <button 
            onClick={handleUndo}
            disabled={activePoints.length === 0}
            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 rounded text-zinc-300"
            title="Undo last point"
          >
            <Undo2 size={14} />
          </button>
          <button 
            onClick={handleClear}
            disabled={activePoints.length === 0}
            className="p-1.5 bg-zinc-800 hover:bg-red-900/50 text-red-400 disabled:opacity-50 rounded"
            title="Clear all points"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      
      <div className="flex gap-4">
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 flex justify-center">
          <canvas 
            ref={canvasRef}
            width={size}
            height={size}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDoubleClick={handleDoubleClick}
            className="cursor-crosshair bg-black rounded touch-none"
          />
        </div>

        {/* Layers Panel */}
        <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg p-3 flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase flex items-center gap-1">
              <Layers size={12} /> Layers
            </h3>
            <button onClick={addLayer} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-emerald-400">
              <Plus size={14} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2">
            {currentPaths.map((layer, idx) => (
              <div 
                key={idx} 
                className={`flex flex-col gap-2 p-2 rounded border ${idx === safeActiveLayer ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-zinc-800 bg-zinc-950'}`}
              >
                <div className="flex items-center gap-2">
                  <input 
                    type="color" 
                    value={layer.color}
                    onChange={e => {
                      const newPaths = [...currentPaths];
                      newPaths[idx] = { ...newPaths[idx], color: e.target.value };
                      onChange(newPaths);
                    }}
                    className="w-6 h-6 rounded cursor-pointer shrink-0 border border-zinc-700"
                  />
                  <button 
                    className="flex-1 text-left text-sm text-zinc-300 truncate"
                    onClick={() => setActiveLayer(idx)}
                  >
                    Layer {idx + 1} {idx === safeActiveLayer && '(Active)'}
                  </button>
                  <button 
                    onClick={() => removeLayer(idx)}
                    disabled={currentPaths.length <= 1}
                    className="p-1 text-zinc-500 hover:text-red-400 disabled:opacity-30"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                {idx === safeActiveLayer && (
                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-zinc-800/50">
                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase">Rotation (deg/s)</label>
                      <input 
                        type="number" 
                        value={layer.rotationSpeed || 0}
                        onChange={e => {
                          const newPaths = [...currentPaths];
                          newPaths[idx] = { ...newPaths[idx], rotationSpeed: Number(e.target.value) };
                          onChange(newPaths);
                        }}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase">Pulse Speed (Hz)</label>
                      <input 
                        type="number" 
                        value={layer.pulseSpeed || 0}
                        onChange={e => {
                          const newPaths = [...currentPaths];
                          newPaths[idx] = { ...newPaths[idx], pulseSpeed: Number(e.target.value) };
                          onChange(newPaths);
                        }}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase">Pulse Min</label>
                      <input 
                        type="number" 
                        step="0.1"
                        value={layer.pulseMin ?? 1}
                        onChange={e => {
                          const newPaths = [...currentPaths];
                          newPaths[idx] = { ...newPaths[idx], pulseMin: Number(e.target.value) };
                          onChange(newPaths);
                        }}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase">Pulse Max</label>
                      <input 
                        type="number" 
                        step="0.1"
                        value={layer.pulseMax ?? 1}
                        onChange={e => {
                          const newPaths = [...currentPaths];
                          newPaths[idx] = { ...newPaths[idx], pulseMax: Number(e.target.value) };
                          onChange(newPaths);
                        }}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="text-xs text-zinc-500 text-center">
        Click to add. Click line to insert. Drag to move. Double-click to delete.
      </p>
    </div>
  );
}
