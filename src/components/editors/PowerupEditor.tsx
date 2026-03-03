import React, { useState } from "react";
import { useGameStore } from "../../store";
import { PowerupDef } from "../../types";
import { Plus, Trash2 } from "lucide-react";
import VectorPathEditor from "./VectorPathEditor";
import ParticleConfigEditor from "./ParticleConfigEditor";

export default function PowerupEditor() {
  const { gameData, addPowerup, updatePowerup, deletePowerup } = useGameStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const powerups = gameData.powerups || [];
  const selectedPowerup = powerups.find((p) => p.id === selectedId);

  const handleAdd = () => {
    const newPowerup: PowerupDef = {
      id: `p_${Date.now()}`,
      name: "New Powerup",
      type: "health",
      value: 10,
      shape: "circle",
      size: 10,
      color: "#00ff00",
    };
    addPowerup(newPowerup);
    setSelectedId(newPowerup.id);
  };

  return (
    <div className="flex h-full bg-zinc-950 text-zinc-100">
      {/* Sidebar */}
      <div className="w-64 border-r border-zinc-800 flex flex-col bg-zinc-900/50">
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
          <h2 className="font-semibold text-zinc-100">Powerups</h2>
          <button
            onClick={handleAdd}
            className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-emerald-400"
          >
            <Plus size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {powerups.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              className={`w-full text-left px-3 py-2 rounded text-sm flex items-center gap-2 ${selectedId === p.id ? "bg-emerald-500/20 text-emerald-400" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"}`}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: p.color }}
              />
              {p.name}
            </button>
          ))}
          {powerups.length === 0 && (
            <div className="text-center text-zinc-600 text-sm p-4">
              No powerups yet
            </div>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto p-8">
        {selectedPowerup ? (
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <input
                  type="text"
                  value={selectedPowerup.name}
                  onChange={(e) =>
                    updatePowerup({ ...selectedPowerup, name: e.target.value })
                  }
                  className="bg-transparent text-2xl font-bold text-zinc-100 focus:outline-none border-b border-transparent focus:border-emerald-500"
                />
                <p className="text-sm text-zinc-500 font-mono">
                  {selectedPowerup.id}
                </p>
              </div>
              <button
                onClick={() => {
                  deletePowerup(selectedPowerup.id);
                  setSelectedId(null);
                }}
                className="p-2 text-red-400 hover:bg-red-400/10 rounded"
              >
                <Trash2 size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs text-zinc-500 uppercase font-semibold">
                  Type
                </label>
                <select
                  value={selectedPowerup.type}
                  onChange={(e) =>
                    updatePowerup({
                      ...selectedPowerup,
                      type: e.target.value as any,
                    })
                  }
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="health">Health</option>
                  <option value="weapon">Weapon</option>
                  <option value="score">Score</option>
                  <option value="speed">Speed</option>
                </select>
              </div>

              {selectedPowerup.type === "weapon" ? (
                <div className="space-y-1">
                  <label className="text-xs text-zinc-500 uppercase font-semibold">
                    Weapon
                  </label>
                  <select
                    value={selectedPowerup.weaponId || ""}
                    onChange={(e) =>
                      updatePowerup({
                        ...selectedPowerup,
                        weaponId: e.target.value || undefined,
                      })
                    }
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">None</option>
                    {gameData.weapons.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-xs text-zinc-500 uppercase font-semibold">
                    Value
                  </label>
                  <input
                    type="number"
                    value={selectedPowerup.value}
                    onChange={(e) =>
                      updatePowerup({
                        ...selectedPowerup,
                        value: Number(e.target.value),
                      })
                    }
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs text-zinc-500 uppercase font-semibold">
                  Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={selectedPowerup.color}
                    onChange={(e) =>
                      updatePowerup({
                        ...selectedPowerup,
                        color: e.target.value,
                      })
                    }
                    className="h-9 w-9 rounded bg-zinc-900 border border-zinc-800 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={selectedPowerup.color}
                    onChange={(e) =>
                      updatePowerup({
                        ...selectedPowerup,
                        color: e.target.value,
                      })
                    }
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-zinc-500 uppercase font-semibold">
                  Shape
                </label>
                <select
                  value={selectedPowerup.shape}
                  onChange={(e) =>
                    updatePowerup({
                      ...selectedPowerup,
                      shape: e.target.value as any,
                    })
                  }
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="circle">Circle</option>
                  <option value="square">Square</option>
                  <option value="custom">Custom Vector</option>
                </select>
              </div>

              {selectedPowerup.shape === "custom" && (
                <div className="col-span-2">
                  <VectorPathEditor
                    paths={
                      selectedPowerup.customPaths ||
                      (selectedPowerup.customPath
                        ? [
                            {
                              path: selectedPowerup.customPath,
                              color: selectedPowerup.color,
                            },
                          ]
                        : [])
                    }
                    onChange={(paths) =>
                      updatePowerup({
                        ...selectedPowerup,
                        customPaths: paths,
                        customPath: paths[0]?.path || "",
                      })
                    }
                    defaultColor={selectedPowerup.color}
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs text-zinc-500 uppercase font-semibold">
                  Size
                </label>
                <input
                  type="number"
                  value={selectedPowerup.size}
                  onChange={(e) =>
                    updatePowerup({
                      ...selectedPowerup,
                      size: Number(e.target.value),
                    })
                  }
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-zinc-500 uppercase font-semibold">
                  Pickup Sound
                </label>
                <select
                  value={selectedPowerup.pickupSoundId || ""}
                  onChange={(e) =>
                    updatePowerup({
                      ...selectedPowerup,
                      pickupSoundId: e.target.value || undefined,
                    })
                  }
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="">None</option>
                  {gameData.soundEffects?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <ParticleConfigEditor
                  label="Pickup Particles"
                  config={selectedPowerup.pickupParticles}
                  onChange={(config) =>
                    updatePowerup({
                      ...selectedPowerup,
                      pickupParticles: config,
                    })
                  }
                  defaultColor={selectedPowerup.color}
                />
              </div>
            </div>

            {/* Preview */}
            {selectedPowerup.shape !== "custom" && (
              <div className="mt-8 p-4 border border-zinc-800 rounded-lg bg-zinc-900/50">
                <h3 className="text-sm font-semibold text-zinc-400 mb-4">
                  Preview
                </h3>
                <div className="h-32 bg-zinc-950 rounded flex items-center justify-center">
                  <div
                    style={{
                      width: selectedPowerup.size * 2,
                      height: selectedPowerup.size * 2,
                      backgroundColor: selectedPowerup.color,
                      borderRadius:
                        selectedPowerup.shape === "circle" ? "50%" : "0",
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-500">
            Select or create a powerup to edit
          </div>
        )}
      </div>
    </div>
  );
}
