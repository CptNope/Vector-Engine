import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store';
import { GameData, LevelDef, StoryNode, WeaponDef, EnemyDef } from '../types';

type GameState = 'menu' | 'story' | 'playing' | 'gameover' | 'victory';

// Basic physics and entity types
type Entity = {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  type: 'player' | 'enemy' | 'player_projectile' | 'enemy_projectile';
  color: string;
  shape: string;
  weaponId?: string | null;
  aiType?: string;
  scoreValue?: number;
  createdAt: number;
};

export default function GamePlayer() {
  const { gameData } = useGameStore();
  
  const [gameState, setGameState] = useState<GameState>('menu');
  const [currentStoryNodeId, setCurrentStoryNodeId] = useState<string | null>(null);
  const [currentLevelId, setCurrentLevelId] = useState<string | null>(null);
  
  const [score, setScore] = useState(0);
  const [playerHealth, setPlayerHealth] = useState(100);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  
  // Game State Refs (to avoid dependency cycles in requestAnimationFrame)
  const stateRef = useRef({
    entities: [] as Entity[],
    keys: {} as Record<string, boolean>,
    lastTime: 0,
    cameraY: 0,
    cameraX: 0,
    lastFireTime: 0,
    level: null as LevelDef | null,
    score: 0,
    playerHealth: 100,
  });

  // Start Game
  const startGame = () => {
    setScore(0);
    setPlayerHealth(gameData.playerBaseStats.health);
    stateRef.current.score = 0;
    stateRef.current.playerHealth = gameData.playerBaseStats.health;
    
    if (gameData.startStoryNodeId) {
      setCurrentStoryNodeId(gameData.startStoryNodeId);
      setGameState('story');
    } else if (gameData.startLevelId || gameData.levels.length > 0) {
      startLevel(gameData.startLevelId || gameData.levels[0].id);
    } else {
      alert("No start node or level defined!");
    }
  };

  const startLevel = (levelId: string) => {
    const level = gameData.levels.find(l => l.id === levelId);
    if (!level) {
      setGameState('victory');
      return;
    }
    
    setCurrentLevelId(levelId);
    setGameState('playing');
    
    // Initialize level state
    stateRef.current.level = level;
    stateRef.current.cameraY = level.scrollDirection === 'vertical' ? level.length - 600 : 0;
    stateRef.current.cameraX = 0;
    
    // Spawn Player
    const player: Entity = {
      id: 'player',
      x: level.scrollDirection === 'vertical' ? 400 : 100,
      y: level.scrollDirection === 'vertical' ? level.length - 100 : 300,
      vx: 0, vy: 0,
      width: gameData.playerBaseStats.size * 2,
      height: gameData.playerBaseStats.size * 2,
      health: stateRef.current.playerHealth,
      maxHealth: gameData.playerBaseStats.health,
      type: 'player',
      color: gameData.playerBaseStats.color,
      shape: gameData.playerBaseStats.shape,
      weaponId: gameData.playerBaseStats.startingWeaponId,
      createdAt: Date.now()
    };

    // Spawn Enemies
    const enemies: Entity[] = level.entities.map(ent => {
      const def = gameData.enemies.find(e => e.id === ent.enemyDefId);
      if (!def) return null;
      return {
        id: ent.id,
        x: ent.x,
        y: ent.y,
        vx: 0, vy: 0,
        width: def.size * 2,
        height: def.size * 2,
        health: def.health,
        maxHealth: def.health,
        type: 'enemy',
        color: def.color,
        shape: def.shape,
        weaponId: def.weaponId,
        aiType: def.aiType,
        scoreValue: def.scoreValue,
        createdAt: Date.now()
      };
    }).filter(Boolean) as Entity[];

    stateRef.current.entities = [player, ...enemies];
    stateRef.current.lastTime = performance.now();
    
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    requestRef.current = requestAnimationFrame(gameLoop);
  };

  // Input Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { stateRef.current.keys[e.code] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { stateRef.current.keys[e.code] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Game Loop
  const gameLoop = (time: number) => {
    if (gameState !== 'playing') return;
    
    const dt = (time - stateRef.current.lastTime) / 1000;
    stateRef.current.lastTime = time;
    
    update(dt);
    draw();
    
    if (stateRef.current.playerHealth <= 0) {
      setGameState('gameover');
      return;
    }
    
    // Check level complete
    const level = stateRef.current.level;
    if (level) {
      if (level.scrollDirection === 'vertical' && stateRef.current.cameraY <= 0) {
        completeLevel();
        return;
      }
      if (level.scrollDirection === 'horizontal' && stateRef.current.cameraX >= level.length - 800) {
        completeLevel();
        return;
      }
    }

    requestRef.current = requestAnimationFrame(gameLoop);
  };

  const completeLevel = () => {
    const level = stateRef.current.level;
    if (!level) return;
    
    if (level.nextStoryNodeId) {
      setCurrentStoryNodeId(level.nextStoryNodeId);
      setGameState('story');
    } else if (level.nextLevelId) {
      startLevel(level.nextLevelId);
    } else {
      setGameState('victory');
    }
  };

  const fireWeapon = (entity: Entity, weaponDef: WeaponDef, isPlayer: boolean) => {
    const now = performance.now();
    // Simple cooldown check (only for player for now, or add to entity state)
    if (isPlayer && now - stateRef.current.lastFireTime < (1000 / weaponDef.fireRate)) return;
    if (isPlayer) stateRef.current.lastFireTime = now;

    const dirY = isPlayer ? -1 : 1;
    const dirX = isPlayer && stateRef.current.level?.scrollDirection === 'horizontal' ? 1 : 0;
    
    // If horizontal scroll, player shoots right. If vertical, player shoots up.
    let baseAngle = 0;
    if (stateRef.current.level?.scrollDirection === 'horizontal') {
      baseAngle = isPlayer ? 0 : Math.PI;
    } else {
      baseAngle = isPlayer ? -Math.PI/2 : Math.PI/2;
    }

    for (let i = 0; i < weaponDef.projectileCount; i++) {
      let angle = baseAngle;
      if (weaponDef.projectileCount > 1) {
        const spreadRad = (weaponDef.spreadAngle * Math.PI) / 180;
        angle += (i / (weaponDef.projectileCount - 1)) * spreadRad - spreadRad / 2;
      }

      stateRef.current.entities.push({
        id: `proj_${Math.random()}`,
        x: entity.x,
        y: entity.y,
        vx: Math.cos(angle) * weaponDef.speed,
        vy: Math.sin(angle) * weaponDef.speed,
        width: weaponDef.size * 2,
        height: weaponDef.size * 2,
        health: 1,
        maxHealth: 1,
        type: isPlayer ? 'player_projectile' : 'enemy_projectile',
        color: weaponDef.color,
        shape: weaponDef.shape,
        createdAt: now
      });
    }
  };

  const update = (dt: number) => {
    const state = stateRef.current;
    const level = state.level;
    if (!level) return;

    // Camera scroll
    const scrollSpeed = 50;
    if (level.scrollDirection === 'vertical') {
      state.cameraY -= scrollSpeed * dt;
    } else {
      state.cameraX += scrollSpeed * dt;
    }

    const player = state.entities.find(e => e.type === 'player');
    if (player) {
      // Player Movement
      player.vx = 0;
      player.vy = 0;
      const speed = gameData.playerBaseStats.speed;
      
      if (state.keys['ArrowLeft'] || state.keys['KeyA']) player.vx = -speed;
      if (state.keys['ArrowRight'] || state.keys['KeyD']) player.vx = speed;
      if (state.keys['ArrowUp'] || state.keys['KeyW']) player.vy = -speed;
      if (state.keys['ArrowDown'] || state.keys['KeyS']) player.vy = speed;

      player.x += player.vx * dt;
      player.y += player.vy * dt;

      // Keep player in camera bounds
      if (level.scrollDirection === 'vertical') {
        player.y += -scrollSpeed * dt; // Move with camera
        player.x = Math.max(player.width/2, Math.min(800 - player.width/2, player.x));
        player.y = Math.max(state.cameraY + player.height/2, Math.min(state.cameraY + 600 - player.height/2, player.y));
      } else {
        player.x += scrollSpeed * dt; // Move with camera
        player.x = Math.max(state.cameraX + player.width/2, Math.min(state.cameraX + 800 - player.width/2, player.x));
        player.y = Math.max(player.height/2, Math.min(600 - player.height/2, player.y));
      }

      // Player Fire
      if (state.keys['Space'] && player.weaponId) {
        const weapon = gameData.weapons.find(w => w.id === player.weaponId);
        if (weapon) fireWeapon(player, weapon, true);
      }
    }

    // Update other entities
    state.entities.forEach(ent => {
      if (ent.type === 'player') return;

      ent.x += ent.vx * dt;
      ent.y += ent.vy * dt;

      // Enemy AI
      if (ent.type === 'enemy') {
        if (ent.aiType === 'chase' && player) {
          const dx = player.x - ent.x;
          const dy = player.y - ent.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist > 0) {
            ent.vx = (dx / dist) * 50;
            ent.vy = (dy / dist) * 50;
          }
        } else if (ent.aiType === 'sine') {
          ent.x += Math.sin(performance.now() / 500) * 2;
          ent.y += 20 * dt; // move down slowly
        }

        // Enemy Fire
        if (ent.weaponId && Math.random() < 0.01) {
          const weapon = gameData.weapons.find(w => w.id === ent.weaponId);
          if (weapon) fireWeapon(ent, weapon, false);
        }
      }
    });

    // Collision Detection (AABB)
    for (let i = 0; i < state.entities.length; i++) {
      for (let j = i + 1; j < state.entities.length; j++) {
        const a = state.entities[i];
        const b = state.entities[j];

        // Skip same type collisions
        if ((a.type.includes('player') && b.type.includes('player')) ||
            (a.type.includes('enemy') && b.type.includes('enemy'))) continue;

        const hit = Math.abs(a.x - b.x) < (a.width + b.width) / 2 &&
                    Math.abs(a.y - b.y) < (a.height + b.height) / 2;

        if (hit) {
          // Simple damage
          const dmgA = b.type.includes('projectile') ? 10 : 20;
          const dmgB = a.type.includes('projectile') ? 10 : 20;
          
          a.health -= dmgA;
          b.health -= dmgB;
        }
      }
    }

    // Cleanup dead entities and out of bounds
    state.entities = state.entities.filter(ent => {
      if (ent.health <= 0) {
        if (ent.type === 'enemy' && ent.scoreValue) {
          state.score += ent.scoreValue;
          setScore(state.score);
        }
        if (ent.type === 'player') {
          setPlayerHealth(0);
        }
        return false;
      }
      
      // Out of bounds
      if (ent.type.includes('projectile')) {
        if (ent.x < state.cameraX - 100 || ent.x > state.cameraX + 900 ||
            ent.y < state.cameraY - 100 || ent.y > state.cameraY + 700) {
          return false;
        }
      }
      return true;
    });

    if (player) setPlayerHealth(player.health);
  };

  const draw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const state = stateRef.current;
    if (!canvas || !ctx || !state.level) return;

    // Clear
    ctx.fillStyle = state.level.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    // Apply camera
    ctx.translate(-state.cameraX, -state.cameraY);

    // Draw grid/stars background effect
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    const startX = Math.floor(state.cameraX / 100) * 100;
    const startY = Math.floor(state.cameraY / 100) * 100;
    for (let x = startX; x < startX + 900; x += 100) {
      ctx.beginPath(); ctx.moveTo(x, state.cameraY); ctx.lineTo(x, state.cameraY + 600); ctx.stroke();
    }
    for (let y = startY; y < startY + 700; y += 100) {
      ctx.beginPath(); ctx.moveTo(state.cameraX, y); ctx.lineTo(state.cameraX + 800, y); ctx.stroke();
    }

    // Draw Entities
    state.entities.forEach(ent => {
      ctx.save();
      ctx.translate(ent.x, ent.y);
      ctx.fillStyle = ent.color;
      ctx.strokeStyle = ent.color;
      ctx.lineWidth = 2;

      const halfW = ent.width / 2;
      const halfH = ent.height / 2;

      if (ent.shape === 'square') {
        ctx.fillRect(-halfW, -halfH, ent.width, ent.height);
      } else if (ent.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, halfW, 0, Math.PI * 2);
        ctx.fill();
      } else if (ent.shape === 'triangle') {
        ctx.beginPath();
        ctx.moveTo(0, -halfH);
        ctx.lineTo(halfW, halfH);
        ctx.lineTo(-halfW, halfH);
        ctx.fill();
      } else if (ent.shape === 'ship') {
        // Custom player ship
        ctx.beginPath();
        ctx.moveTo(0, -halfH);
        ctx.lineTo(halfW, halfH);
        ctx.lineTo(-halfW, halfH);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.fillRect(-halfW, halfH - 4, ent.width, 4);
      } else if (ent.shape === 'line') {
        ctx.beginPath();
        ctx.moveTo(0, -halfH);
        ctx.lineTo(0, halfH);
        ctx.stroke();
      }

      // Health bar for enemies
      if (ent.type === 'enemy' && ent.health > 0) {
        ctx.fillStyle = 'red';
        ctx.fillRect(-halfW, -halfH - 10, ent.width, 4);
        ctx.fillStyle = 'green';
        ctx.fillRect(-halfW, -halfH - 10, ent.width * (ent.health / ent.maxHealth), 4);
      }

      ctx.restore();
    });

    ctx.restore();
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  // UI Renderers
  if (gameState === 'menu') {
    return (
      <div className="flex h-full items-center justify-center bg-zinc-950">
        <div className="text-center space-y-6">
          <h1 className="text-5xl font-bold text-emerald-400 tracking-tighter">VECTOR ENGINE</h1>
          <button 
            onClick={startGame}
            className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-full text-lg transition-transform hover:scale-105"
          >
            START GAME
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'story') {
    const node = gameData.storyNodes.find(n => n.id === currentStoryNodeId);
    if (!node) return <div>Story node not found</div>;

    return (
      <div className="flex h-full items-center justify-center bg-zinc-950 p-8">
        <div className="max-w-2xl w-full bg-zinc-900 border border-zinc-800 p-8 rounded-xl shadow-2xl space-y-8">
          <h2 className="text-3xl font-bold text-emerald-400">{node.title}</h2>
          <p className="text-lg text-zinc-300 font-serif leading-relaxed">{node.text}</p>
          
          <div className="space-y-3 pt-8">
            {node.choices.map(choice => (
              <button
                key={choice.id}
                onClick={() => {
                  if (choice.nextStoryNodeId) {
                    setCurrentStoryNodeId(choice.nextStoryNodeId);
                  } else if (choice.nextLevelId) {
                    startLevel(choice.nextLevelId);
                  } else {
                    setGameState('menu');
                  }
                }}
                className="w-full text-left px-6 py-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-200 transition-colors border border-zinc-700 hover:border-emerald-500"
              >
                {choice.text}
              </button>
            ))}
            {node.choices.length === 0 && (
              <button
                onClick={() => setGameState('menu')}
                className="w-full text-center px-6 py-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-lg transition-colors"
              >
                End
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'gameover' || gameState === 'victory') {
    return (
      <div className="flex h-full items-center justify-center bg-zinc-950">
        <div className="text-center space-y-6">
          <h1 className={`text-5xl font-bold ${gameState === 'victory' ? 'text-emerald-400' : 'text-red-500'}`}>
            {gameState === 'victory' ? 'VICTORY' : 'GAME OVER'}
          </h1>
          <p className="text-xl text-zinc-400">Final Score: {score}</p>
          <button 
            onClick={() => setGameState('menu')}
            className="px-8 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold rounded-full transition-colors"
          >
            Return to Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-zinc-950 relative">
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center pointer-events-none z-10">
        <div className="text-emerald-400 font-mono text-xl font-bold">SCORE: {score}</div>
        <div className="flex items-center gap-2">
          <div className="w-48 h-4 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700">
            <div 
              className="h-full bg-emerald-500 transition-all"
              style={{ width: `${Math.max(0, (playerHealth / gameData.playerBaseStats.health) * 100)}%` }}
            />
          </div>
          <span className="text-emerald-400 font-mono text-sm">{Math.max(0, playerHealth)} HP</span>
        </div>
      </div>
      
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        <canvas 
          ref={canvasRef}
          width={800}
          height={600}
          className="bg-black shadow-2xl shadow-black/50 border border-zinc-800"
        />
      </div>
      
      <div className="absolute bottom-4 left-4 text-xs text-zinc-500 pointer-events-none">
        WASD/Arrows to move • Space to shoot
      </div>
    </div>
  );
}
