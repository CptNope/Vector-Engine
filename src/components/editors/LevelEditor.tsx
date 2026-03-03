import React, { useState, useRef, useEffect } from "react";
import { useGameStore } from "../../store";
import { LevelDef } from "../../types";
import { Plus, Trash2, MousePointer2 } from "lucide-react";

export default function LevelEditor() {
  const { gameData, updateLevel, addLevel, deleteLevel } = useGameStore();
  const [selectedId, setSelectedId] = useState<string | null>(
    gameData.levels[0]?.id || null,
  );
  const [selectedEnemyDefId, setSelectedEnemyDefId] = useState<string>(
    gameData.enemies[0]?.id || "",
  );
  const [selectedObstacleDefId, setSelectedObstacleDefId] = useState<string>(
    gameData.obstacles[0]?.id || "",
  );
  const [selectedPowerupDefId, setSelectedPowerupDefId] = useState<string>(
    gameData.powerups?.[0]?.id || "",
  );
  const [mode, setMode] = useState<
    "select" | "place_enemy" | "place_obstacle" | "place_powerup"
  >("select");
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [selectedObstacleId, setSelectedObstacleId] = useState<string | null>(
    null,
  );
  const [selectedPowerupId, setSelectedPowerupId] = useState<string | null>(
    null,
  );

  const selectedLevel = gameData.levels.find((l) => l.id === selectedId);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleAdd = () => {
    const newLevel: LevelDef = {
      id: `l_${Date.now()}`,
      name: "New Level",
      scrollDirection: "vertical",
      length: 2000,
      backgroundColor: "#050510",
      entities: [],
      obstacles: [],
      powerups: [],
      nextLevelId: null,
      nextStoryNodeId: null,
    };
    addLevel(newLevel);
    setSelectedId(newLevel.id);
  };

  useEffect(() => {
    if (!selectedLevel || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    // Clear
    ctx.fillStyle = selectedLevel.backgroundColor;
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    // Draw grid
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1;
    for (let i = 0; i < canvasRef.current.width; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvasRef.current.height);
      ctx.stroke();
    }
    for (let i = 0; i < canvasRef.current.height; i += 50) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvasRef.current.width, i);
      ctx.stroke();
    }

    // Draw entities
    selectedLevel.entities.forEach((ent) => {
      const def = gameData.enemies.find((e) => e.id === ent.enemyDefId);
      if (!def) return;

      ctx.save();
      ctx.translate(ent.x, ent.y);

      const baseRotation =
        selectedLevel.scrollDirection === "horizontal" ? -Math.PI / 2 : Math.PI;
      ctx.rotate(baseRotation);

      if (selectedEntityId === ent.id) {
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.strokeRect(
          -def.size - 2,
          -def.size - 2,
          def.size * 2 + 4,
          def.size * 2 + 4,
        );
      }

      ctx.fillStyle = def.color;
      if (def.shape === "square") {
        ctx.fillRect(-def.size, -def.size, def.size * 2, def.size * 2);
      } else if (def.shape === "circle") {
        ctx.beginPath();
        ctx.arc(0, 0, def.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (def.shape === "triangle") {
        ctx.beginPath();
        ctx.moveTo(0, -def.size);
        ctx.lineTo(def.size, def.size);
        ctx.lineTo(-def.size, def.size);
        ctx.fill();
      } else if (def.shape === "custom") {
        const pathsToDraw = def.customPaths?.length
          ? def.customPaths
          : def.customPath
            ? [{ path: def.customPath, color: def.color }]
            : [];

        pathsToDraw.forEach((layer) => {
          if (!layer.path) return;

          ctx.save();

          const now = performance.now() / 1000;

          if (layer.rotationSpeed) {
            ctx.rotate(layer.rotationSpeed * now * (Math.PI / 180));
          }

          if (
            layer.pulseSpeed &&
            layer.pulseMin !== undefined &&
            layer.pulseMax !== undefined
          ) {
            const range = layer.pulseMax - layer.pulseMin;
            const scale =
              layer.pulseMin +
              (Math.sin(now * layer.pulseSpeed * Math.PI * 2) * 0.5 + 0.5) *
                range;
            ctx.scale(scale, scale);
          }

          const commands = layer.path.split(" ").filter(Boolean);
          ctx.beginPath();
          let i = 0;
          while (i < commands.length) {
            const cmd = commands[i];
            if (cmd === "M") {
              ctx.moveTo(
                parseFloat(commands[i + 1]) * def.size,
                parseFloat(commands[i + 2]) * def.size,
              );
              i += 3;
            } else if (cmd === "L") {
              ctx.lineTo(
                parseFloat(commands[i + 1]) * def.size,
                parseFloat(commands[i + 2]) * def.size,
              );
              i += 3;
            } else if (cmd === "Z") {
              ctx.closePath();
              i += 1;
            } else {
              i += 1;
            }
          }
          ctx.fillStyle = layer.color + "40";
          ctx.fill();
          ctx.strokeStyle = layer.color;
          ctx.stroke();

          ctx.restore();
        });
      }
      ctx.restore();
    });

    // Draw obstacles
    selectedLevel.obstacles?.forEach((obs) => {
      const def = gameData.obstacles.find((o) => o.id === obs.obstacleDefId);
      if (!def) return;

      ctx.save();
      ctx.translate(obs.x, obs.y);

      if (selectedObstacleId === obs.id) {
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.strokeRect(
          -def.size - 2,
          -def.size - 2,
          def.size * 2 + 4,
          def.size * 2 + 4,
        );
      }

      ctx.fillStyle = def.color;
      if (def.shape === "square") {
        ctx.fillRect(-def.size, -def.size, def.size * 2, def.size * 2);
      } else if (def.shape === "circle") {
        ctx.beginPath();
        ctx.arc(0, 0, def.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (def.shape === "custom") {
        const pathsToDraw = def.customPaths?.length
          ? def.customPaths
          : def.customPath
            ? [{ path: def.customPath, color: def.color }]
            : [];

        pathsToDraw.forEach((layer) => {
          if (!layer.path) return;

          ctx.save();

          const now = performance.now() / 1000;

          if (layer.rotationSpeed) {
            ctx.rotate(layer.rotationSpeed * now * (Math.PI / 180));
          }

          if (
            layer.pulseSpeed &&
            layer.pulseMin !== undefined &&
            layer.pulseMax !== undefined
          ) {
            const range = layer.pulseMax - layer.pulseMin;
            const scale =
              layer.pulseMin +
              (Math.sin(now * layer.pulseSpeed * Math.PI * 2) * 0.5 + 0.5) *
                range;
            ctx.scale(scale, scale);
          }

          const commands = layer.path.split(" ").filter(Boolean);
          ctx.beginPath();
          let i = 0;
          while (i < commands.length) {
            const cmd = commands[i];
            if (cmd === "M") {
              ctx.moveTo(
                parseFloat(commands[i + 1]) * def.size,
                parseFloat(commands[i + 2]) * def.size,
              );
              i += 3;
            } else if (cmd === "L") {
              ctx.lineTo(
                parseFloat(commands[i + 1]) * def.size,
                parseFloat(commands[i + 2]) * def.size,
              );
              i += 3;
            } else if (cmd === "Z") {
              ctx.closePath();
              i += 1;
            } else {
              i += 1;
            }
          }
          ctx.fillStyle = layer.color + "40";
          ctx.fill();
          ctx.strokeStyle = layer.color;
          ctx.stroke();

          ctx.restore();
        });
      }
      ctx.restore();
    });

    // Draw powerups
    (selectedLevel.powerups || []).forEach((p) => {
      const def = gameData.powerups?.find((pd) => pd.id === p.powerupDefId);
      if (!def) return;

      ctx.save();
      ctx.translate(p.x, p.y);

      if (selectedPowerupId === p.id) {
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.strokeRect(
          -def.size - 2,
          -def.size - 2,
          def.size * 2 + 4,
          def.size * 2 + 4,
        );
      }

      ctx.fillStyle = def.color;
      if (def.shape === "square") {
        ctx.fillRect(-def.size, -def.size, def.size * 2, def.size * 2);
      } else if (def.shape === "circle") {
        ctx.beginPath();
        ctx.arc(0, 0, def.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (def.shape === "custom") {
        const pathsToDraw = def.customPaths?.length
          ? def.customPaths
          : def.customPath
            ? [{ path: def.customPath, color: def.color }]
            : [];

        pathsToDraw.forEach((layer) => {
          if (!layer.path) return;

          ctx.save();

          const now = performance.now() / 1000;

          if (layer.rotationSpeed) {
            ctx.rotate(layer.rotationSpeed * now * (Math.PI / 180));
          }

          if (
            layer.pulseSpeed &&
            layer.pulseMin !== undefined &&
            layer.pulseMax !== undefined
          ) {
            const range = layer.pulseMax - layer.pulseMin;
            const scale =
              layer.pulseMin +
              (Math.sin(now * layer.pulseSpeed * Math.PI * 2) * 0.5 + 0.5) *
                range;
            ctx.scale(scale, scale);
          }

          const commands = layer.path.split(" ").filter(Boolean);
          ctx.beginPath();
          let i = 0;
          while (i < commands.length) {
            const cmd = commands[i];
            if (cmd === "M") {
              ctx.moveTo(
                parseFloat(commands[i + 1]) * def.size,
                parseFloat(commands[i + 2]) * def.size,
              );
              i += 3;
            } else if (cmd === "L") {
              ctx.lineTo(
                parseFloat(commands[i + 1]) * def.size,
                parseFloat(commands[i + 2]) * def.size,
              );
              i += 3;
            } else if (cmd === "Z") {
              ctx.closePath();
              i += 1;
            } else {
              i += 1;
            }
          }
          ctx.fillStyle = layer.color + "40";
          ctx.fill();
          ctx.strokeStyle = layer.color;
          ctx.stroke();

          ctx.restore();
        });
      }
      ctx.restore();
    });
  }, [
    selectedLevel,
    gameData.enemies,
    gameData.obstacles,
    gameData.powerups,
    selectedEntityId,
    selectedObstacleId,
    selectedPowerupId,
  ]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedLevel) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (mode === "place_enemy") {
      if (!selectedEnemyDefId) return;
      const newEntity = {
        id: `ent_${Date.now()}`,
        enemyDefId: selectedEnemyDefId,
        x,
        y,
      };
      updateLevel({
        ...selectedLevel,
        entities: [...selectedLevel.entities, newEntity],
      });
    } else if (mode === "place_obstacle") {
      if (!selectedObstacleDefId) return;
      const newObstacle = {
        id: `obs_${Date.now()}`,
        obstacleDefId: selectedObstacleDefId,
        x,
        y,
      };
      updateLevel({
        ...selectedLevel,
        obstacles: [...(selectedLevel.obstacles || []), newObstacle],
      });
    } else if (mode === "place_powerup") {
      if (!selectedPowerupDefId) return;
      const newPowerup = {
        id: `pw_${Date.now()}`,
        powerupDefId: selectedPowerupDefId,
        x,
        y,
      };
      updateLevel({
        ...selectedLevel,
        powerups: [...(selectedLevel.powerups || []), newPowerup],
      });
    } else if (mode === "select") {
      // Find clicked entity
      const clickedEnt = selectedLevel.entities
        .slice()
        .reverse()
        .find((ent) => {
          const def = gameData.enemies.find((e) => e.id === ent.enemyDefId);
          if (!def) return false;
          return (
            Math.abs(ent.x - x) < def.size && Math.abs(ent.y - y) < def.size
          );
        });
      if (clickedEnt) {
        setSelectedEntityId(clickedEnt.id);
        setSelectedObstacleId(null);
        return;
      }

      // Find clicked obstacle
      const clickedObs = selectedLevel.obstacles
        ?.slice()
        .reverse()
        .find((obs) => {
          const def = gameData.obstacles.find(
            (o) => o.id === obs.obstacleDefId,
          );
          if (!def) return false;
          return (
            Math.abs(obs.x - x) < def.size && Math.abs(obs.y - y) < def.size
          );
        });
      if (clickedObs) {
        setSelectedObstacleId(clickedObs.id);
        setSelectedEntityId(null);
        setSelectedPowerupId(null);
        return;
      }

      // Find clicked powerup
      const clickedPw = selectedLevel.powerups
        ?.slice()
        .reverse()
        .find((pw) => {
          const def = gameData.powerups?.find((p) => p.id === pw.powerupDefId);
          if (!def) return false;
          return Math.abs(pw.x - x) < def.size && Math.abs(pw.y - y) < def.size;
        });
      if (clickedPw) {
        setSelectedPowerupId(clickedPw.id);
        setSelectedEntityId(null);
        setSelectedObstacleId(null);
        return;
      }

      setSelectedEntityId(null);
      setSelectedObstacleId(null);
      setSelectedPowerupId(null);
    }
  };

  const handleDeleteSelected = () => {
    if (!selectedLevel) return;
    if (selectedEntityId) {
      updateLevel({
        ...selectedLevel,
        entities: selectedLevel.entities.filter(
          (e) => e.id !== selectedEntityId,
        ),
      });
      setSelectedEntityId(null);
    } else if (selectedObstacleId) {
      updateLevel({
        ...selectedLevel,
        obstacles: selectedLevel.obstacles.filter(
          (o) => o.id !== selectedObstacleId,
        ),
      });
      setSelectedObstacleId(null);
    } else if (selectedPowerupId) {
      updateLevel({
        ...selectedLevel,
        powerups:
          selectedLevel.powerups?.filter((p) => p.id !== selectedPowerupId) ||
          [],
      });
      setSelectedPowerupId(null);
    }
  };

  return (
    <div className="flex h-full">
      {/* List */}
      <div className="w-64 border-r border-zinc-800 bg-zinc-900/50 flex flex-col">
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
          <h2 className="font-semibold text-zinc-200">Levels</h2>
          <button
            onClick={handleAdd}
            className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-emerald-400"
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {gameData.levels.map((l) => (
            <button
              key={l.id}
              onClick={() => setSelectedId(l.id)}
              className={`w-full text-left px-3 py-2 rounded text-sm ${selectedId === l.id ? "bg-zinc-800 text-emerald-400" : "text-zinc-400 hover:bg-zinc-800/50"}`}
            >
              {l.name}
            </button>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col">
        {selectedLevel ? (
          <>
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900">
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  value={selectedLevel.name}
                  onChange={(e) =>
                    updateLevel({ ...selectedLevel, name: e.target.value })
                  }
                  className="bg-transparent text-xl font-bold text-zinc-100 focus:outline-none border-b border-transparent focus:border-emerald-500"
                />
                <select
                  value={selectedLevel.scrollDirection}
                  onChange={(e) =>
                    updateLevel({
                      ...selectedLevel,
                      scrollDirection: e.target.value as any,
                    })
                  }
                  className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-zinc-300"
                >
                  <option value="vertical">Vertical Scroll</option>
                  <option value="horizontal">Horizontal Scroll</option>
                </select>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-zinc-400">Length:</span>
                  <input
                    type="number"
                    value={selectedLevel.length}
                    onChange={(e) =>
                      updateLevel({
                        ...selectedLevel,
                        length: Number(e.target.value),
                      })
                    }
                    className="w-20 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-zinc-300"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-zinc-400">Music:</span>
                  <select
                    value={selectedLevel.musicTrackId || ""}
                    onChange={(e) =>
                      updateLevel({
                        ...selectedLevel,
                        musicTrackId: e.target.value || undefined,
                      })
                    }
                    className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-zinc-300"
                  >
                    <option value="">None</option>
                    {gameData.musicTracks?.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                onClick={() => {
                  deleteLevel(selectedLevel.id);
                  setSelectedId(null);
                }}
                className="p-2 text-red-400 hover:bg-red-400/10 rounded"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Toolbar */}
              <div className="w-48 bg-zinc-900 border-r border-zinc-800 p-4 flex flex-col gap-4">
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase">
                    Tools
                  </h3>
                  <button
                    onClick={() => setMode("select")}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm ${mode === "select" ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-800 text-zinc-300"}`}
                  >
                    <MousePointer2 size={16} /> Select
                  </button>
                  <button
                    onClick={() => setMode("place_enemy")}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm ${mode === "place_enemy" ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-800 text-zinc-300"}`}
                  >
                    <Plus size={16} /> Place Enemy
                  </button>
                  <button
                    onClick={() => setMode("place_obstacle")}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm ${mode === "place_obstacle" ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-800 text-zinc-300"}`}
                  >
                    <Plus size={16} /> Place Obstacle
                  </button>
                  <button
                    onClick={() => setMode("place_powerup")}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm ${mode === "place_powerup" ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-800 text-zinc-300"}`}
                  >
                    <Plus size={16} /> Place Powerup
                  </button>
                </div>

                {mode === "place_enemy" && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-zinc-500 uppercase">
                      Select Enemy
                    </h3>
                    <select
                      value={selectedEnemyDefId}
                      onChange={(e) => setSelectedEnemyDefId(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-2 text-sm text-zinc-300"
                    >
                      {gameData.enemies.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {mode === "place_obstacle" && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-zinc-500 uppercase">
                      Select Obstacle
                    </h3>
                    <select
                      value={selectedObstacleDefId}
                      onChange={(e) => setSelectedObstacleDefId(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-2 text-sm text-zinc-300"
                    >
                      {gameData.obstacles.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {mode === "place_powerup" && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-zinc-500 uppercase">
                      Select Powerup
                    </h3>
                    <select
                      value={selectedPowerupDefId}
                      onChange={(e) => setSelectedPowerupDefId(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-2 text-sm text-zinc-300"
                    >
                      {gameData.powerups?.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {mode === "select" &&
                  (selectedEntityId ||
                    selectedObstacleId ||
                    selectedPowerupId) && (
                    <div className="space-y-2 mt-auto">
                      <button
                        onClick={handleDeleteSelected}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded text-sm bg-red-500/10 text-red-400 hover:bg-red-500/20"
                      >
                        <Trash2 size={16} /> Delete Selected
                      </button>
                    </div>
                  )}

                <div className="space-y-2 mt-auto border-t border-zinc-800 pt-4">
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase">
                    Level Transitions
                  </h3>
                  <div className="space-y-1">
                    <label className="text-xs text-zinc-400">Next Level</label>
                    <select
                      value={selectedLevel.nextLevelId || ""}
                      onChange={(e) =>
                        updateLevel({
                          ...selectedLevel,
                          nextLevelId: e.target.value || null,
                        })
                      }
                      className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-300"
                    >
                      <option value="">None</option>
                      {gameData.levels
                        .filter((l) => l.id !== selectedLevel.id)
                        .map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.name}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-zinc-400">
                      Next Story Node
                    </label>
                    <select
                      value={selectedLevel.nextStoryNodeId || ""}
                      onChange={(e) =>
                        updateLevel({
                          ...selectedLevel,
                          nextStoryNodeId: e.target.value || null,
                        })
                      }
                      className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-300"
                    >
                      <option value="">None</option>
                      {gameData.storyNodes.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Canvas Area */}
              <div className="flex-1 overflow-auto bg-zinc-950 p-8 flex justify-center">
                <div className="relative shadow-2xl shadow-black">
                  <canvas
                    ref={canvasRef}
                    width={
                      selectedLevel.scrollDirection === "vertical"
                        ? 800
                        : selectedLevel.length
                    }
                    height={
                      selectedLevel.scrollDirection === "vertical"
                        ? selectedLevel.length
                        : 600
                    }
                    onClick={handleCanvasClick}
                    className="cursor-crosshair"
                  />
                  <div className="absolute top-2 left-2 text-xs text-zinc-500 pointer-events-none">
                    {selectedLevel.scrollDirection === "vertical"
                      ? "Start (Bottom) -> End (Top)"
                      : "Start (Left) -> End (Right)"}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-500">
            Select or create a level to edit
          </div>
        )}
      </div>
    </div>
  );
}
