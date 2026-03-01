import { useGameStore } from '../../store';
import VectorPathEditor from './VectorPathEditor';

export default function PlayerEditor() {
  const { gameData, updatePlayerStats } = useGameStore();
  const stats = gameData.playerBaseStats;

  return (
    <div className="flex h-full p-8 overflow-y-auto">
      <div className="max-w-2xl w-full space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100">Player Base Stats</h2>
          <p className="text-sm text-zinc-500 mt-1">Configure the starting attributes for the player character.</p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-xs text-zinc-500 uppercase font-semibold">Base Health</label>
            <input 
              type="number" 
              value={stats.health}
              onChange={e => updatePlayerStats({ health: Number(e.target.value) })}
              className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-zinc-500 uppercase font-semibold">Base Speed</label>
            <input 
              type="number" 
              value={stats.speed}
              onChange={e => updatePlayerStats({ speed: Number(e.target.value) })}
              className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-zinc-500 uppercase font-semibold">Ship Color</label>
            <div className="flex gap-2">
              <input 
                type="color" 
                value={stats.color}
                onChange={e => updatePlayerStats({ color: e.target.value })}
                className="h-9 w-9 bg-zinc-900 border border-zinc-800 rounded cursor-pointer"
              />
              <input 
                type="text" 
                value={stats.color}
                onChange={e => updatePlayerStats({ color: e.target.value })}
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-zinc-500 uppercase font-semibold">Starting Weapon</label>
            <select 
              value={stats.startingWeaponId || ''}
              onChange={e => updatePlayerStats({ startingWeaponId: e.target.value || null })}
              className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="">None</option>
              {gameData.weapons.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-zinc-500 uppercase font-semibold">Ship Shape</label>
            <select 
              value={stats.shape}
              onChange={e => updatePlayerStats({ shape: e.target.value as any })}
              className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="triangle">Triangle</option>
              <option value="ship">Fighter Ship</option>
              <option value="custom">Custom Vector</option>
            </select>
          </div>

          {stats.shape === 'custom' && (
            <div className="col-span-2">
              <VectorPathEditor 
                paths={stats.customPaths || (stats.customPath ? [{path: stats.customPath, color: stats.color}] : [])}
                onChange={paths => updatePlayerStats({ customPaths: paths, customPath: paths[0]?.path || '' })}
                defaultColor={stats.color}
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs text-zinc-500 uppercase font-semibold">Ship Size</label>
            <input 
              type="number" 
              value={stats.size}
              onChange={e => updatePlayerStats({ size: Number(e.target.value) })}
              className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Preview */}
        {stats.shape !== 'custom' && (
          <div className="mt-8 p-4 border border-zinc-800 rounded-lg bg-zinc-900/50">
            <h3 className="text-sm font-semibold text-zinc-400 mb-4">Preview</h3>
            <div className="h-48 bg-zinc-950 rounded flex items-center justify-center">
              {stats.shape === 'triangle' ? (
                <div 
                  style={{
                    width: 0,
                    height: 0,
                    borderLeft: `${stats.size}px solid transparent`,
                    borderRight: `${stats.size}px solid transparent`,
                    borderBottom: `${stats.size * 2}px solid ${stats.color}`,
                  }}
                />
              ) : (
                <div className="relative" style={{ width: stats.size * 2, height: stats.size * 2 }}>
                  {/* Custom ship shape */}
                  <div 
                    className="absolute bottom-0 left-1/2 -translate-x-1/2"
                    style={{
                      width: 0,
                      height: 0,
                      borderLeft: `${stats.size / 2}px solid transparent`,
                      borderRight: `${stats.size / 2}px solid transparent`,
                      borderBottom: `${stats.size * 1.5}px solid ${stats.color}`,
                    }}
                  />
                  <div 
                    className="absolute bottom-0 left-1/2 -translate-x-1/2"
                    style={{
                      width: stats.size * 2,
                      height: stats.size / 2,
                      backgroundColor: stats.color,
                      borderRadius: '4px',
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
