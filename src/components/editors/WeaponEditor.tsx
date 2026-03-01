import { useState } from 'react';
import { useGameStore } from '../../store';
import { WeaponDef } from '../../types';
import { Plus, Trash2 } from 'lucide-react';
import VectorPathEditor from './VectorPathEditor';

export default function WeaponEditor() {
  const { gameData, updateWeapon, addWeapon, deleteWeapon } = useGameStore();
  const [selectedId, setSelectedId] = useState<string | null>(gameData.weapons[0]?.id || null);

  const selectedWeapon = gameData.weapons.find(w => w.id === selectedId);

  const handleAdd = () => {
    const newWeapon: WeaponDef = {
      id: `w_${Date.now()}`,
      name: 'New Weapon',
      fireRate: 5,
      damage: 10,
      speed: 300,
      color: '#ffffff',
      projectileCount: 1,
      spreadAngle: 0,
      shape: 'line',
      size: 4,
    };
    addWeapon(newWeapon);
    setSelectedId(newWeapon.id);
  };

  return (
    <div className="flex h-full">
      {/* List */}
      <div className="w-64 border-r border-zinc-800 bg-zinc-900/50 flex flex-col">
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
          <h2 className="font-semibold text-zinc-200">Weapons</h2>
          <button onClick={handleAdd} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-emerald-400">
            <Plus size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {gameData.weapons.map(w => (
            <button
              key={w.id}
              onClick={() => setSelectedId(w.id)}
              className={`w-full text-left px-3 py-2 rounded text-sm ${selectedId === w.id ? 'bg-zinc-800 text-emerald-400' : 'text-zinc-400 hover:bg-zinc-800/50'}`}
            >
              {w.name}
            </button>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 p-8 overflow-y-auto">
        {selectedWeapon ? (
          <div className="max-w-2xl space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-zinc-100">Edit Weapon</h2>
              <button 
                onClick={() => { deleteWeapon(selectedWeapon.id); setSelectedId(null); }}
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
                  value={selectedWeapon.name}
                  onChange={e => updateWeapon({ ...selectedWeapon, name: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-zinc-500 uppercase font-semibold">Color</label>
                <div className="flex gap-2">
                  <input 
                    type="color" 
                    value={selectedWeapon.color}
                    onChange={e => updateWeapon({ ...selectedWeapon, color: e.target.value })}
                    className="h-9 w-9 bg-zinc-900 border border-zinc-800 rounded cursor-pointer"
                  />
                  <input 
                    type="text" 
                    value={selectedWeapon.color}
                    onChange={e => updateWeapon({ ...selectedWeapon, color: e.target.value })}
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-zinc-500 uppercase font-semibold">Fire Rate (shots/sec)</label>
                <input 
                  type="number" 
                  value={selectedWeapon.fireRate}
                  onChange={e => updateWeapon({ ...selectedWeapon, fireRate: Number(e.target.value) })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-zinc-500 uppercase font-semibold">Damage</label>
                <input 
                  type="number" 
                  value={selectedWeapon.damage}
                  onChange={e => updateWeapon({ ...selectedWeapon, damage: Number(e.target.value) })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-zinc-500 uppercase font-semibold">Projectile Speed</label>
                <input 
                  type="number" 
                  value={selectedWeapon.speed}
                  onChange={e => updateWeapon({ ...selectedWeapon, speed: Number(e.target.value) })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-zinc-500 uppercase font-semibold">Projectile Count</label>
                <input 
                  type="number" 
                  value={selectedWeapon.projectileCount}
                  onChange={e => updateWeapon({ ...selectedWeapon, projectileCount: Number(e.target.value) })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-zinc-500 uppercase font-semibold">Spread Angle (degrees)</label>
                <input 
                  type="number" 
                  value={selectedWeapon.spreadAngle}
                  onChange={e => updateWeapon({ ...selectedWeapon, spreadAngle: Number(e.target.value) })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-zinc-500 uppercase font-semibold">Shape</label>
                <select 
                  value={selectedWeapon.shape}
                  onChange={e => updateWeapon({ ...selectedWeapon, shape: e.target.value as any })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="line">Line</option>
                  <option value="circle">Circle</option>
                  <option value="square">Square</option>
                  <option value="custom">Custom Vector</option>
                </select>
              </div>

              {selectedWeapon.shape === 'custom' && (
                <div className="col-span-2">
                  <VectorPathEditor 
                    paths={selectedWeapon.customPaths || (selectedWeapon.customPath ? [{path: selectedWeapon.customPath, color: selectedWeapon.color}] : [])}
                    onChange={paths => updateWeapon({ ...selectedWeapon, customPaths: paths, customPath: paths[0]?.path || '' })}
                    defaultColor={selectedWeapon.color}
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs text-zinc-500 uppercase font-semibold">Size</label>
                <input 
                  type="number" 
                  value={selectedWeapon.size}
                  onChange={e => updateWeapon({ ...selectedWeapon, size: Number(e.target.value) })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
            
            {/* Preview Canvas */}
            {selectedWeapon.shape !== 'custom' && (
              <div className="mt-8 p-4 border border-zinc-800 rounded-lg bg-zinc-900/50">
                <h3 className="text-sm font-semibold text-zinc-400 mb-4">Preview</h3>
                <div className="h-32 bg-zinc-950 rounded flex items-center justify-center relative overflow-hidden">
                  {/* Simple CSS preview of the projectile spread */}
                  <div className="absolute bottom-4 w-4 h-4 bg-emerald-500 rounded-sm"></div>
                  {Array.from({ length: selectedWeapon.projectileCount }).map((_, i) => {
                    const angle = selectedWeapon.projectileCount > 1 
                      ? (i / (selectedWeapon.projectileCount - 1)) * selectedWeapon.spreadAngle - selectedWeapon.spreadAngle / 2
                      : 0;
                    return (
                      <div 
                        key={i}
                        className="absolute bottom-12"
                        style={{
                          width: selectedWeapon.shape === 'circle' ? selectedWeapon.size * 2 : selectedWeapon.shape === 'line' ? 2 : selectedWeapon.size * 2,
                          height: selectedWeapon.shape === 'line' ? selectedWeapon.size * 4 : selectedWeapon.size * 2,
                          backgroundColor: selectedWeapon.color,
                          borderRadius: selectedWeapon.shape === 'circle' ? '50%' : '0',
                          transform: `rotate(${angle}deg) translateY(-20px)`,
                          transformOrigin: '50% 100px'
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-500">
            Select or create a weapon to edit
          </div>
        )}
      </div>
    </div>
  );
}
