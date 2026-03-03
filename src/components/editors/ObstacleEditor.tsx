import React, { useState } from 'react';
import { useGameStore } from '../../store';
import { ObstacleDef } from '../../types';
import { Plus, Trash2 } from 'lucide-react';
import VectorPathEditor from './VectorPathEditor';
import ParticleConfigEditor from './ParticleConfigEditor';

export default function ObstacleEditor() {
  const { gameData, updateObstacle, addObstacle, deleteObstacle } = useGameStore();
  const [selectedId, setSelectedId] = useState<string | null>(gameData.obstacles[0]?.id || null);

  const selectedObstacle = gameData.obstacles.find(o => o.id === selectedId);

  const handleAdd = () => {
    const newObstacle: ObstacleDef = {
      id: `o_${Date.now()}`,
      name: 'New Obstacle',
      shape: 'square',
      size: 20,
      color: '#888888',
    };
    addObstacle(newObstacle);
    setSelectedId(newObstacle.id);
  };

  return (
    <div className="flex h-full">
      {/* List */}
      <div className="w-64 border-r border-zinc-800 bg-zinc-900/50 flex flex-col">
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
          <h2 className="font-semibold text-zinc-200">Obstacles</h2>
          <button onClick={handleAdd} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-emerald-400">
            <Plus size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {gameData.obstacles.map(o => (
            <button
              key={o.id}
              onClick={() => setSelectedId(o.id)}
              className={`w-full text-left px-3 py-2 rounded text-sm ${selectedId === o.id ? 'bg-zinc-800 text-emerald-400' : 'text-zinc-400 hover:bg-zinc-800/50'}`}
            >
              {o.name}
            </button>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto p-8">
        {selectedObstacle ? (
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <input 
                  type="text" 
                  value={selectedObstacle.name}
                  onChange={e => updateObstacle({ ...selectedObstacle, name: e.target.value })}
                  className="bg-transparent text-2xl font-bold text-zinc-100 focus:outline-none border-b border-transparent focus:border-emerald-500"
                />
                <p className="text-sm text-zinc-500 font-mono">{selectedObstacle.id}</p>
              </div>
              <button 
                onClick={() => { deleteObstacle(selectedObstacle.id); setSelectedId(null); }}
                className="p-2 text-red-400 hover:bg-red-400/10 rounded"
              >
                <Trash2 size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs text-zinc-500 uppercase font-semibold">Color</label>
                <div className="flex gap-2">
                  <input 
                    type="color" 
                    value={selectedObstacle.color}
                    onChange={e => updateObstacle({ ...selectedObstacle, color: e.target.value })}
                    className="h-9 w-9 rounded bg-zinc-900 border border-zinc-800 cursor-pointer"
                  />
                  <input 
                    type="text" 
                    value={selectedObstacle.color}
                    onChange={e => updateObstacle({ ...selectedObstacle, color: e.target.value })}
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-zinc-500 uppercase font-semibold">Shape</label>
                <select 
                  value={selectedObstacle.shape}
                  onChange={e => updateObstacle({ ...selectedObstacle, shape: e.target.value as any })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="square">Square</option>
                  <option value="circle">Circle</option>
                  <option value="custom">Custom Vector</option>
                </select>
              </div>

              {selectedObstacle.shape === 'custom' && (
                <div className="col-span-2">
                  <VectorPathEditor 
                    paths={selectedObstacle.customPaths || (selectedObstacle.customPath ? [{path: selectedObstacle.customPath, color: selectedObstacle.color}] : [])}
                    onChange={paths => updateObstacle({ ...selectedObstacle, customPaths: paths, customPath: paths[0]?.path || '' })}
                    defaultColor={selectedObstacle.color}
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs text-zinc-500 uppercase font-semibold">Size</label>
                <input 
                  type="number" 
                  value={selectedObstacle.size}
                  onChange={e => updateObstacle({ ...selectedObstacle, size: Number(e.target.value) })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-zinc-500 uppercase font-semibold">Death Sound</label>
                <select 
                  value={selectedObstacle.deathSoundId || ''}
                  onChange={e => updateObstacle({ ...selectedObstacle, deathSoundId: e.target.value || undefined })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="">None</option>
                  {gameData.soundEffects?.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <ParticleConfigEditor 
                  label="Death Particles"
                  config={selectedObstacle.deathParticles}
                  onChange={config => updateObstacle({ ...selectedObstacle, deathParticles: config })}
                  defaultColor={selectedObstacle.color}
                />
              </div>
            </div>
            
            {/* Preview */}
            {selectedObstacle.shape !== 'custom' && (
              <div className="mt-8 p-4 border border-zinc-800 rounded-lg bg-zinc-900/50">
                <h3 className="text-sm font-semibold text-zinc-400 mb-4">Preview</h3>
                <div className="h-32 bg-zinc-950 rounded flex items-center justify-center">
                  <div 
                    style={{
                      width: selectedObstacle.shape === 'circle' ? selectedObstacle.size * 2 : selectedObstacle.size * 2,
                      height: selectedObstacle.shape === 'circle' ? selectedObstacle.size * 2 : selectedObstacle.size * 2,
                      backgroundColor: selectedObstacle.color,
                      borderRadius: selectedObstacle.shape === 'circle' ? '50%' : '0',
                    }}
                  />
                </div>
              </div>
            )}

          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-500">
            Select or create an obstacle to edit
          </div>
        )}
      </div>
    </div>
  );
}
