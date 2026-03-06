import React, { useState } from 'react';
import { BackgroundLayer } from '../../types';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import VectorPathEditor from './VectorPathEditor';

interface BackgroundLayerEditorProps {
  layers: BackgroundLayer[];
  onChange: (layers: BackgroundLayer[]) => void;
}

export default function BackgroundLayerEditor({ layers, onChange }: BackgroundLayerEditorProps) {
  const [expandedLayerId, setExpandedLayerId] = useState<string | null>(null);

  const handleAddLayer = () => {
    const newLayer: BackgroundLayer = {
      id: `bg_${Date.now()}`,
      speed: 0.5,
      color: '#ffffff',
      density: 50,
      size: 2,
      shape: 'circle',
      customPaths: []
    };
    onChange([...layers, newLayer]);
    setExpandedLayerId(newLayer.id);
  };

  const updateLayer = (id: string, updates: Partial<BackgroundLayer>) => {
    onChange(layers.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const deleteLayer = (id: string) => {
    onChange(layers.filter(l => l.id !== id));
  };

  const moveLayer = (index: number, direction: -1 | 1) => {
    const newLayers = [...layers];
    const temp = newLayers[index];
    newLayers[index] = newLayers[index + direction];
    newLayers[index + direction] = temp;
    onChange(newLayers);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-zinc-100">Background Layers</h2>
        <button
          onClick={handleAddLayer}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium"
        >
          <Plus size={18} /> Add Layer
        </button>
      </div>

      <div className="space-y-4">
        {layers.map((layer, index) => (
          <div key={layer.id} className="bg-zinc-900 border border-zinc-800 rounded overflow-hidden">
            <div 
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-800/50"
              onClick={() => setExpandedLayerId(expandedLayerId === layer.id ? null : layer.id)}
            >
              <div className="flex items-center gap-4">
                <div 
                  className="w-8 h-8 rounded border border-zinc-700 flex items-center justify-center"
                  style={{ backgroundColor: layer.color }}
                >
                  {layer.shape === 'circle' && <div className="w-3 h-3 rounded-full bg-white/50" />}
                  {layer.shape === 'square' && <div className="w-3 h-3 bg-white/50" />}
                  {layer.shape === 'line' && <div className="w-4 h-0.5 bg-white/50" />}
                  {layer.shape === 'custom' && <div className="text-[10px] text-white/50">C</div>}
                </div>
                <div>
                  <div className="font-medium text-zinc-200">Layer {index + 1} ({layer.shape})</div>
                  <div className="text-xs text-zinc-500">Speed: {layer.speed}x | Density: {layer.density}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); moveLayer(index, -1); }}
                  disabled={index === 0}
                  className="p-1 text-zinc-500 hover:text-zinc-300 disabled:opacity-30"
                >
                  <ChevronUp size={18} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); moveLayer(index, 1); }}
                  disabled={index === layers.length - 1}
                  className="p-1 text-zinc-500 hover:text-zinc-300 disabled:opacity-30"
                >
                  <ChevronDown size={18} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteLayer(layer.id); }}
                  className="p-1 text-red-500 hover:text-red-400 ml-2"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            {expandedLayerId === layer.id && (
              <div className="p-4 border-t border-zinc-800 space-y-6 bg-zinc-950/50">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs text-zinc-500 uppercase font-semibold">Shape</label>
                      <select
                        value={layer.shape}
                        onChange={(e) => updateLayer(layer.id, { shape: e.target.value as any })}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 text-zinc-200"
                      >
                        <option value="circle">Circle</option>
                        <option value="square">Square</option>
                        <option value="line">Line</option>
                        <option value="custom">Custom Vector</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-zinc-500 uppercase font-semibold">Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={layer.color}
                          onChange={(e) => updateLayer(layer.id, { color: e.target.value })}
                          className="h-9 w-9 bg-zinc-900 border border-zinc-800 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={layer.color}
                          onChange={(e) => updateLayer(layer.id, { color: e.target.value })}
                          className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 text-zinc-200"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs text-zinc-500 uppercase font-semibold">Parallax Speed</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="2"
                          step="0.1"
                          value={layer.speed}
                          onChange={(e) => updateLayer(layer.id, { speed: parseFloat(e.target.value) })}
                          className="flex-1"
                        />
                        <span className="text-sm text-zinc-400 w-8">{layer.speed}x</span>
                      </div>
                      <div className="text-[10px] text-zinc-600">0 = static, 1 = moves with camera, >1 = foreground</div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-zinc-500 uppercase font-semibold">Density</label>
                      <input
                        type="number"
                        value={layer.density}
                        onChange={(e) => updateLayer(layer.id, { density: parseInt(e.target.value) || 0 })}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 text-zinc-200"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-zinc-500 uppercase font-semibold">Size</label>
                      <input
                        type="number"
                        value={layer.size}
                        onChange={(e) => updateLayer(layer.id, { size: parseFloat(e.target.value) || 1 })}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 text-zinc-200"
                      />
                    </div>
                  </div>
                </div>

                {layer.shape === 'custom' && (
                  <div className="pt-4 border-t border-zinc-800">
                    <label className="text-xs text-zinc-500 uppercase font-semibold mb-2 block">Custom Vector Shape</label>
                    <VectorPathEditor
                      paths={layer.customPaths || []}
                      onChange={(paths) => updateLayer(layer.id, { customPaths: paths })}
                      defaultColor={layer.color}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {layers.length === 0 && (
          <div className="text-center py-12 text-zinc-500 border border-dashed border-zinc-800 rounded">
            No background layers yet. Add one to create a parallax effect.
          </div>
        )}
      </div>
    </div>
  );
}
