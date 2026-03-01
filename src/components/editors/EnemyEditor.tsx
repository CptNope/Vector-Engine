import { useState } from 'react';
import { useGameStore } from '../../store';
import { EnemyDef } from '../../types';
import { Plus, Trash2 } from 'lucide-react';
import VectorPathEditor from './VectorPathEditor';
import ParticleConfigEditor from './ParticleConfigEditor';

export default function EnemyEditor() {
  const { gameData, updateEnemy, addEnemy, deleteEnemy } = useGameStore();
  const [selectedId, setSelectedId] = useState<string | null>(gameData.enemies[0]?.id || null);

  const selectedEnemy = gameData.enemies.find(e => e.id === selectedId);

  const handleAdd = () => {
    const newEnemy: EnemyDef = {
      id: `e_${Date.now()}`,
      name: 'New Enemy',
      health: 20,
      speed: 40,
      color: '#ff0000',
      shape: 'square',
      size: 15,
      weaponId: null,
      aiType: 'chase',
      scoreValue: 100,
    };
    addEnemy(newEnemy);
    setSelectedId(newEnemy.id);
  };

  return (
    <div className="flex h-full">
      {/* List */}
      <div className="w-64 border-r border-zinc-800 bg-zinc-900/50 flex flex-col">
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
          <h2 className="font-semibold text-zinc-200">Enemies</h2>
          <button onClick={handleAdd} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-emerald-400">
            <Plus size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {gameData.enemies.map(e => (
            <button
              key={e.id}
              onClick={() => setSelectedId(e.id)}
              className={`w-full text-left px-3 py-2 rounded text-sm ${selectedId === e.id ? 'bg-zinc-800 text-emerald-400' : 'text-zinc-400 hover:bg-zinc-800/50'}`}
            >
              {e.name}
            </button>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 p-8 overflow-y-auto">
        {selectedEnemy ? (
          <div className="max-w-2xl space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-zinc-100">Edit Enemy</h2>
              <button 
                onClick={() => { deleteEnemy(selectedEnemy.id); setSelectedId(null); }}
                className="p-2 text-red-400 hover:bg-red-400/10 rounded"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs text-zinc-500 uppercase font-semibold">Name</label>
                <input 
                  type="text" 
                  value={selectedEnemy.name}
                  onChange={e => updateEnemy({ ...selectedEnemy, name: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-zinc-500 uppercase font-semibold">Color</label>
                <div className="flex gap-2">
                  <input 
                    type="color" 
                    value={selectedEnemy.color}
                    onChange={e => updateEnemy({ ...selectedEnemy, color: e.target.value })}
                    className="h-9 w-9 bg-zinc-900 border border-zinc-800 rounded cursor-pointer"
                  />
                  <input 
                    type="text" 
                    value={selectedEnemy.color}
                    onChange={e => updateEnemy({ ...selectedEnemy, color: e.target.value })}
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-zinc-500 uppercase font-semibold">Health</label>
                <input 
                  type="number" 
                  value={selectedEnemy.health}
                  onChange={e => updateEnemy({ ...selectedEnemy, health: Number(e.target.value) })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-zinc-500 uppercase font-semibold">Speed</label>
                <input 
                  type="number" 
                  value={selectedEnemy.speed}
                  onChange={e => updateEnemy({ ...selectedEnemy, speed: Number(e.target.value) })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-zinc-500 uppercase font-semibold">Shape</label>
                <select 
                  value={selectedEnemy.shape}
                  onChange={e => updateEnemy({ ...selectedEnemy, shape: e.target.value as any })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="square">Square</option>
                  <option value="circle">Circle</option>
                  <option value="triangle">Triangle</option>
                  <option value="custom">Custom Vector</option>
                </select>
              </div>

              {selectedEnemy.shape === 'custom' && (
                <div className="col-span-2">
                  <VectorPathEditor 
                    paths={selectedEnemy.customPaths || (selectedEnemy.customPath ? [{path: selectedEnemy.customPath, color: selectedEnemy.color}] : [])}
                    onChange={paths => updateEnemy({ ...selectedEnemy, customPaths: paths, customPath: paths[0]?.path || '' })}
                    defaultColor={selectedEnemy.color}
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs text-zinc-500 uppercase font-semibold">Size</label>
                <input 
                  type="number" 
                  value={selectedEnemy.size}
                  onChange={e => updateEnemy({ ...selectedEnemy, size: Number(e.target.value) })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-zinc-500 uppercase font-semibold">Weapon</label>
                <select 
                  value={selectedEnemy.weaponId || ''}
                  onChange={e => updateEnemy({ ...selectedEnemy, weaponId: e.target.value || null })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="">None</option>
                  {gameData.weapons.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-zinc-500 uppercase font-semibold">AI Type</label>
                <select 
                  value={selectedEnemy.aiType}
                  onChange={e => updateEnemy({ ...selectedEnemy, aiType: e.target.value as any })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="chase">Chase Player</option>
                  <option value="patrol">Patrol Horizontal</option>
                  <option value="stationary">Stationary</option>
                  <option value="sine">Sine Wave</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-zinc-500 uppercase font-semibold">Score Value</label>
                <input 
                  type="number" 
                  value={selectedEnemy.scoreValue}
                  onChange={e => updateEnemy({ ...selectedEnemy, scoreValue: Number(e.target.value) })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="col-span-2">
                <ParticleConfigEditor 
                  label="Death Particles"
                  config={selectedEnemy.deathParticles}
                  onChange={config => updateEnemy({ ...selectedEnemy, deathParticles: config })}
                  defaultColor={selectedEnemy.color}
                />
              </div>
            </div>
            
            {/* Preview */}
            {selectedEnemy.shape !== 'custom' && (
              <div className="mt-8 p-4 border border-zinc-800 rounded-lg bg-zinc-900/50">
                <h3 className="text-sm font-semibold text-zinc-400 mb-4">Preview</h3>
                <div className="h-32 bg-zinc-950 rounded flex items-center justify-center">
                  <div 
                    style={{
                      width: selectedEnemy.shape === 'circle' ? selectedEnemy.size * 2 : selectedEnemy.shape === 'triangle' ? 0 : selectedEnemy.size * 2,
                      height: selectedEnemy.shape === 'circle' ? selectedEnemy.size * 2 : selectedEnemy.shape === 'triangle' ? 0 : selectedEnemy.size * 2,
                      backgroundColor: selectedEnemy.shape === 'triangle' ? 'transparent' : selectedEnemy.color,
                      borderRadius: selectedEnemy.shape === 'circle' ? '50%' : '0',
                      borderLeft: selectedEnemy.shape === 'triangle' ? `${selectedEnemy.size}px solid transparent` : 'none',
                      borderRight: selectedEnemy.shape === 'triangle' ? `${selectedEnemy.size}px solid transparent` : 'none',
                      borderBottom: selectedEnemy.shape === 'triangle' ? `${selectedEnemy.size * 2}px solid ${selectedEnemy.color}` : 'none',
                    }}
                  />
                </div>
              </div>
            )}

          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-500">
            Select or create an enemy to edit
          </div>
        )}
      </div>
    </div>
  );
}
