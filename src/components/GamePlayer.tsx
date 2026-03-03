import { useState, useEffect, useRef } from "react";
import { useGameStore } from "../store";
import {
  GameData,
  LevelDef,
  StoryNode,
  WeaponDef,
  EnemyDef,
  ParticleConfig,
  VectorPath,
} from "../types";

type GameState = "menu" | "story" | "playing" | "gameover" | "victory";

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
  type:
    | "player"
    | "enemy"
    | "player_projectile"
    | "enemy_projectile"
    | "obstacle"
    | "powerup";
  color: string;
  shape: string;
  customPath?: string;
  customPaths?: VectorPath[];
  weaponId?: string | null;
  aiType?: string;
  scoreValue?: number;
  powerupId?: string;
  createdAt: number;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
};

export default function GamePlayer() {
  const { gameData } = useGameStore();

  const [gameState, setGameState] = useState<GameState>("menu");
  const [currentStoryNodeId, setCurrentStoryNodeId] = useState<string | null>(
    null,
  );
  const [currentLevelId, setCurrentLevelId] = useState<string | null>(null);

  const [score, setScore] = useState(0);
  const [playerHealth, setPlayerHealth] = useState(100);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const activeOscillatorsRef = useRef<OscillatorNode[]>([]);

  // Game State Refs (to avoid dependency cycles in requestAnimationFrame)
  const stateRef = useRef({
    gameState: "menu" as GameState,
    entities: [] as Entity[],
    particles: [] as Particle[],
    keys: {} as Record<string, boolean>,
    lastTime: 0,
    cameraY: 0,
    cameraX: 0,
    lastFireTime: 0,
    level: null as LevelDef | null,
    score: 0,
    playerHealth: 100,
  });

  const createParticles = (
    x: number,
    y: number,
    config: ParticleConfig,
    defaultColor: string,
  ) => {
    const color = config.color || defaultColor;
    for (let i = 0; i < config.count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * config.speed + config.speed * 0.2;
      stateRef.current.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: Math.random() * (config.life * 0.5) + config.life * 0.5,
        color,
        size: Math.random() * config.size + config.size * 0.5,
      });
    }
  };

  const createThruster = (
    x: number,
    y: number,
    config: ParticleConfig,
    defaultColor: string,
    isHorizontal: boolean = false,
  ) => {
    const color = config.color || defaultColor;
    for (let i = 0; i < config.count; i++) {
      let vx = (Math.random() - 0.5) * 20;
      let vy = Math.random() * config.speed + config.speed * 0.5;

      if (isHorizontal) {
        vx = -(Math.random() * config.speed + config.speed * 0.5);
        vy = (Math.random() - 0.5) * 20;
      }

      stateRef.current.particles.push({
        x: x + (isHorizontal ? 0 : (Math.random() - 0.5) * 10),
        y: y + (isHorizontal ? (Math.random() - 0.5) * 10 : 10),
        vx,
        vy,
        life: 1,
        maxLife: Math.random() * (config.life * 0.5) + config.life * 0.5,
        color,
        size: Math.random() * config.size + config.size * 0.5,
      });
    }
  };

  const setGameStateSafe = (newState: GameState) => {
    stateRef.current.gameState = newState;
    setGameState(newState);

    // Stop all audio if leaving playing state
    if (newState !== "playing") {
      stopAllAudio();
    }
  };

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
  };

  const stopAllAudio = () => {
    activeOscillatorsRef.current.forEach((osc) => {
      try {
        osc.stop();
      } catch (e) {}
    });
    activeOscillatorsRef.current = [];
  };

  const playSoundEffect = (soundId?: string) => {
    if (!soundId || !audioCtxRef.current) return;
    const sound = gameData.soundEffects?.find((s) => s.id === soundId);
    if (!sound) return;

    const ctx = audioCtxRef.current;

    sound.notes.forEach((note) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = sound.synthConfig.oscillatorType;
      osc.frequency.value = 440 * Math.pow(2, (note.pitch - 69) / 12);

      filter.type = sound.synthConfig.filterType;
      filter.frequency.value = sound.synthConfig.filterCutoff;
      filter.Q.value = sound.synthConfig.filterResonance;

      const t = ctx.currentTime + note.time;
      const env = sound.synthConfig.envelope;

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(
        sound.synthConfig.volume * note.velocity,
        t + env.attack,
      );
      gain.gain.linearRampToValueAtTime(
        sound.synthConfig.volume * note.velocity * env.sustain,
        t + env.attack + env.decay,
      );
      gain.gain.setValueAtTime(
        sound.synthConfig.volume * note.velocity * env.sustain,
        t + note.duration,
      );
      gain.gain.linearRampToValueAtTime(0, t + note.duration + env.release);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + note.duration + env.release);

      activeOscillatorsRef.current.push(osc);

      // Cleanup ref
      osc.onended = () => {
        activeOscillatorsRef.current = activeOscillatorsRef.current.filter(
          (o) => o !== osc,
        );
      };
    });
  };

  const playMusicTrack = (trackId?: string) => {
    if (!trackId || !audioCtxRef.current) return;
    const track = gameData.musicTracks?.find((t) => t.id === trackId);
    if (!track) return;

    const ctx = audioCtxRef.current;
    const beatDuration = 60 / track.bpm;

    // Loop the track by scheduling it multiple times or just a long sequence
    // For a simple implementation, we'll schedule it once, but a real engine would loop it.
    // Let's schedule it to loop 10 times for now as a hack.
    for (let loop = 0; loop < 10; loop++) {
      let trackDuration = 0;
      track.channels.forEach((ch) => {
        ch.notes.forEach((n) => {
          if (n.time + n.duration > trackDuration)
            trackDuration = n.time + n.duration;
        });
      });

      const loopOffset = loop * trackDuration * beatDuration;

      track.channels.forEach((channel) => {
        channel.notes.forEach((note) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const filter = ctx.createBiquadFilter();

          osc.type = channel.synthConfig.oscillatorType;
          osc.frequency.value = 440 * Math.pow(2, (note.pitch - 69) / 12);

          filter.type = channel.synthConfig.filterType;
          filter.frequency.value = channel.synthConfig.filterCutoff;
          filter.Q.value = channel.synthConfig.filterResonance;

          const startTime =
            ctx.currentTime + loopOffset + note.time * beatDuration;
          const duration = note.duration * beatDuration;
          const env = channel.synthConfig.envelope;

          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(
            channel.synthConfig.volume * note.velocity,
            startTime + env.attack,
          );
          gain.gain.linearRampToValueAtTime(
            channel.synthConfig.volume * note.velocity * env.sustain,
            startTime + env.attack + env.decay,
          );
          gain.gain.setValueAtTime(
            channel.synthConfig.volume * note.velocity * env.sustain,
            startTime + duration,
          );
          gain.gain.linearRampToValueAtTime(
            0,
            startTime + duration + env.release,
          );

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);

          osc.start(startTime);
          osc.stop(startTime + duration + env.release);

          activeOscillatorsRef.current.push(osc);

          osc.onended = () => {
            activeOscillatorsRef.current = activeOscillatorsRef.current.filter(
              (o) => o !== osc,
            );
          };
        });
      });
    }
  };

  // Start Game
  const startGame = () => {
    setScore(0);
    setPlayerHealth(gameData.playerBaseStats.health);
    stateRef.current.score = 0;
    stateRef.current.playerHealth = gameData.playerBaseStats.health;

    if (gameData.startStoryNodeId) {
      setCurrentStoryNodeId(gameData.startStoryNodeId);
      setGameStateSafe("story");
    } else if (gameData.startLevelId || gameData.levels.length > 0) {
      startLevel(gameData.startLevelId || gameData.levels[0].id);
    } else {
      alert("No start node or level defined!");
    }
  };

  const startLevel = (levelId: string) => {
    initAudio();
    const level = gameData.levels.find((l) => l.id === levelId);
    if (!level) {
      setGameStateSafe("victory");
      return;
    }

    setCurrentLevelId(levelId);
    setGameStateSafe("playing");

    // Play music
    if (level.musicTrackId) {
      playMusicTrack(level.musicTrackId);
    }

    // Initialize level state
    stateRef.current.level = level;
    stateRef.current.cameraY =
      level.scrollDirection === "vertical" ? level.length - 600 : 0;
    stateRef.current.cameraX = 0;
    stateRef.current.particles = [];

    // Spawn Player
    const player: Entity = {
      id: "player",
      x: level.scrollDirection === "vertical" ? 400 : 100,
      y: level.scrollDirection === "vertical" ? level.length - 100 : 300,
      vx: 0,
      vy: 0,
      width: gameData.playerBaseStats.size * 2,
      height: gameData.playerBaseStats.size * 2,
      health: stateRef.current.playerHealth,
      maxHealth: gameData.playerBaseStats.health,
      type: "player",
      color: gameData.playerBaseStats.color,
      shape: gameData.playerBaseStats.shape,
      customPath: gameData.playerBaseStats.customPath,
      customPaths: gameData.playerBaseStats.customPaths,
      weaponId: gameData.playerBaseStats.startingWeaponId,
      createdAt: performance.now(),
    };

    // Spawn Enemies
    const enemies: Entity[] = level.entities
      .map((ent) => {
        const def = gameData.enemies.find((e) => e.id === ent.enemyDefId);
        if (!def) return null;
        return {
          id: ent.id,
          x: ent.x,
          y: ent.y,
          vx: 0,
          vy: 0,
          width: def.size * 2,
          height: def.size * 2,
          health: def.health,
          maxHealth: def.health,
          type: "enemy",
          color: def.color,
          shape: def.shape,
          customPath: def.customPath,
          customPaths: def.customPaths,
          weaponId: def.weaponId,
          aiType: def.aiType,
          scoreValue: def.scoreValue,
          createdAt: performance.now(),
        };
      })
      .filter(Boolean) as Entity[];

    // Spawn Obstacles
    const obstacles: Entity[] = (level.obstacles || [])
      .map((obs) => {
        const def = gameData.obstacles.find((o) => o.id === obs.obstacleDefId);
        if (!def) return null;
        return {
          id: obs.id,
          x: obs.x,
          y: obs.y,
          vx: 0,
          vy: 0,
          width: def.size * 2,
          height: def.size * 2,
          health: 999999, // indestructible
          maxHealth: 999999,
          type: "obstacle",
          color: def.color,
          shape: def.shape,
          customPath: def.customPath,
          customPaths: def.customPaths,
          createdAt: performance.now(),
        };
      })
      .filter(Boolean) as Entity[];

    // Spawn Powerups
    const powerups: Entity[] = (level.powerups || [])
      .map((pw) => {
        const def = gameData.powerups?.find((p) => p.id === pw.powerupDefId);
        if (!def) return null;
        return {
          id: pw.id,
          x: pw.x,
          y: pw.y,
          vx: 0,
          vy: 0,
          width: def.size * 2,
          height: def.size * 2,
          health: 1,
          maxHealth: 1,
          type: "powerup",
          color: def.color,
          shape: def.shape,
          customPath: def.customPath,
          customPaths: def.customPaths,
          powerupId: def.id,
          createdAt: performance.now(),
        };
      })
      .filter(Boolean) as Entity[];

    stateRef.current.entities = [player, ...enemies, ...obstacles, ...powerups];
    stateRef.current.lastTime = performance.now();

    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    requestRef.current = requestAnimationFrame(gameLoop);
  };

  // Input Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      stateRef.current.keys[e.code] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      stateRef.current.keys[e.code] = false;
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Game Loop
  const gameLoop = (time: number) => {
    if (stateRef.current.gameState !== "playing") return;

    const dt = (time - stateRef.current.lastTime) / 1000;
    stateRef.current.lastTime = time;

    update(dt);
    draw();

    if (stateRef.current.playerHealth <= 0) {
      setGameStateSafe("gameover");
      return;
    }

    // Check level complete
    const level = stateRef.current.level;
    if (level) {
      if (
        level.scrollDirection === "vertical" &&
        stateRef.current.cameraY <= 0
      ) {
        completeLevel();
        return;
      }
      if (
        level.scrollDirection === "horizontal" &&
        stateRef.current.cameraX >= level.length - 800
      ) {
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
      setGameStateSafe("story");
    } else if (level.nextLevelId) {
      startLevel(level.nextLevelId);
    } else {
      setGameStateSafe("victory");
    }
  };

  const fireWeapon = (
    entity: Entity,
    weaponDef: WeaponDef,
    isPlayer: boolean,
  ) => {
    const now = performance.now();
    // Simple cooldown check (only for player for now, or add to entity state)
    if (
      isPlayer &&
      now - stateRef.current.lastFireTime < 1000 / weaponDef.fireRate
    )
      return;
    if (isPlayer) stateRef.current.lastFireTime = now;

    const dirY = isPlayer ? -1 : 1;
    const dirX =
      isPlayer && stateRef.current.level?.scrollDirection === "horizontal"
        ? 1
        : 0;

    // If horizontal scroll, player shoots right. If vertical, player shoots up.
    let baseAngle = 0;
    if (stateRef.current.level?.scrollDirection === "horizontal") {
      baseAngle = isPlayer ? 0 : Math.PI;
    } else {
      baseAngle = isPlayer ? -Math.PI / 2 : Math.PI / 2;
    }

    for (let i = 0; i < weaponDef.projectileCount; i++) {
      let angle = baseAngle;
      if (weaponDef.projectileCount > 1) {
        const spreadRad = (weaponDef.spreadAngle * Math.PI) / 180;
        angle +=
          (i / (weaponDef.projectileCount - 1)) * spreadRad - spreadRad / 2;
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
        type: isPlayer ? "player_projectile" : "enemy_projectile",
        color: weaponDef.color,
        shape: weaponDef.shape,
        customPath: weaponDef.customPath,
        customPaths: weaponDef.customPaths,
        weaponId: weaponDef.id,
        createdAt: now,
      });
    }

    if (weaponDef.fireSoundId) {
      playSoundEffect(weaponDef.fireSoundId);
    }
  };

  const update = (dt: number) => {
    const state = stateRef.current;
    const level = state.level;
    if (!level) return;

    // Camera scroll
    const scrollSpeed = 50;
    if (level.scrollDirection === "vertical") {
      state.cameraY -= scrollSpeed * dt;
    } else {
      state.cameraX += scrollSpeed * dt;
    }

    // Update Particles
    state.particles = state.particles.filter((p) => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt / p.maxLife;
      return p.life > 0;
    });

    const player = state.entities.find((e) => e.type === "player");
    if (player) {
      // Player Movement
      player.vx = 0;
      player.vy = 0;
      const speed = gameData.playerBaseStats.speed;

      if (state.keys["ArrowLeft"] || state.keys["KeyA"]) player.vx = -speed;
      if (state.keys["ArrowRight"] || state.keys["KeyD"]) player.vx = speed;
      if (state.keys["ArrowUp"] || state.keys["KeyW"]) player.vy = -speed;
      if (state.keys["ArrowDown"] || state.keys["KeyS"]) player.vy = speed;

      player.x += player.vx * dt;
      player.y += player.vy * dt;

      // Thruster particles
      if (player.vy < 0 || player.vx !== 0) {
        const config = gameData.playerBaseStats.thrusterParticles || {
          count: 1,
          speed: 50,
          size: 3,
          life: 0.2,
          color: "#ffaa00",
        };

        let thrustX = player.x;
        let thrustY = player.y;
        if (state.level?.scrollDirection === "horizontal") {
          thrustX = player.x - player.width / 2;
        } else {
          thrustY = player.y + player.height / 2;
        }

        createThruster(
          thrustX,
          thrustY,
          config,
          "#ffaa00",
          state.level?.scrollDirection === "horizontal",
        );
      }

      // Keep player in camera bounds
      if (level.scrollDirection === "vertical") {
        player.y += -scrollSpeed * dt; // Move with camera
        player.x = Math.max(
          player.width / 2,
          Math.min(800 - player.width / 2, player.x),
        );
        player.y = Math.max(
          state.cameraY + player.height / 2,
          Math.min(state.cameraY + 600 - player.height / 2, player.y),
        );
      } else {
        player.x += scrollSpeed * dt; // Move with camera
        player.x = Math.max(
          state.cameraX + player.width / 2,
          Math.min(state.cameraX + 800 - player.width / 2, player.x),
        );
        player.y = Math.max(
          player.height / 2,
          Math.min(600 - player.height / 2, player.y),
        );
      }

      // Player Fire
      if (state.keys["Space"] && player.weaponId) {
        const weapon = gameData.weapons.find((w) => w.id === player.weaponId);
        if (weapon) fireWeapon(player, weapon, true);
      }
    }

    // Update other entities
    state.entities.forEach((ent) => {
      if (ent.type === "player") return;

      ent.x += ent.vx * dt;
      ent.y += ent.vy * dt;

      // Enemy AI
      if (ent.type === "enemy") {
        if (ent.aiType === "chase" && player) {
          const dx = player.x - ent.x;
          const dy = player.y - ent.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0) {
            ent.vx = (dx / dist) * 50;
            ent.vy = (dy / dist) * 50;
          }
        } else if (ent.aiType === "sine") {
          ent.x += Math.sin(performance.now() / 500) * 2;
          ent.y += 20 * dt; // move down slowly
        } else if (ent.aiType === "patrol") {
          // simple patrol left and right
          if (ent.vx === 0) ent.vx = 50;
          if (ent.x > state.cameraX + 700) ent.vx = -50;
          if (ent.x < state.cameraX + 100) ent.vx = 50;
          ent.y += 10 * dt; // move down very slowly
        }

        // Enemy Fire
        if (ent.weaponId) {
          // only fire if on screen
          if (
            ent.y > state.cameraY &&
            ent.y < state.cameraY + 600 &&
            ent.x > state.cameraX &&
            ent.x < state.cameraX + 800
          ) {
            if (Math.random() < 0.01) {
              const weapon = gameData.weapons.find(
                (w) => w.id === ent.weaponId,
              );
              if (weapon) fireWeapon(ent, weapon, false);
            }
          }
        }
      }
    });

    // Collision Detection (AABB)
    for (let i = 0; i < state.entities.length; i++) {
      for (let j = i + 1; j < state.entities.length; j++) {
        const a = state.entities[i];
        const b = state.entities[j];

        // Skip same type collisions
        if (
          (a.type.includes("player") && b.type.includes("player")) ||
          (a.type.includes("enemy") && b.type.includes("enemy")) ||
          (a.type === "powerup" && b.type === "powerup")
        )
          continue;

        // Skip obstacle-obstacle collisions
        if (a.type === "obstacle" && b.type === "obstacle") continue;

        // Skip powerup collisions with non-player
        if (
          (a.type === "powerup" && b.type !== "player") ||
          (b.type === "powerup" && a.type !== "player")
        )
          continue;

        const hit =
          Math.abs(a.x - b.x) < (a.width + b.width) / 2 &&
          Math.abs(a.y - b.y) < (a.height + b.height) / 2;

        if (hit) {
          // Powerup collision
          if (a.type === "powerup" || b.type === "powerup") {
            const powerupEnt = a.type === "powerup" ? a : b;
            const playerEnt = a.type === "player" ? a : b;

            const pDef = gameData.powerups?.find(
              (p) => p.id === powerupEnt.powerupId,
            );
            if (pDef) {
              if (pDef.type === "health") {
                playerEnt.health = Math.min(
                  playerEnt.maxHealth,
                  playerEnt.health + pDef.value,
                );
              } else if (pDef.type === "score") {
                state.score += pDef.value;
                setScore(state.score);
              } else if (pDef.type === "weapon") {
                playerEnt.weaponId = pDef.weaponId || playerEnt.weaponId;
              }
              if (pDef.pickupSoundId) playSoundEffect(pDef.pickupSoundId);

              const config = pDef.pickupParticles || {
                count: 20,
                speed: 100,
                size: 3,
                life: 0.5,
                color: pDef.color,
              };
              createParticles(powerupEnt.x, powerupEnt.y, config, pDef.color);
            }
            powerupEnt.health = 0; // Mark for deletion
            continue;
          }

          // Obstacles block projectiles and damage players/enemies
          if (a.type === "obstacle" || b.type === "obstacle") {
            if (a.type.includes("projectile")) {
              a.health = 0;
              const wDef = gameData.weapons.find((w) => w.id === a.weaponId);
              const config = wDef?.hitParticles || {
                count: 5,
                speed: 100,
                size: 3,
                life: 0.5,
              };
              createParticles(a.x, a.y, config, a.color);
            }
            if (b.type.includes("projectile")) {
              b.health = 0;
              const wDef = gameData.weapons.find((w) => w.id === b.weaponId);
              const config = wDef?.hitParticles || {
                count: 5,
                speed: 100,
                size: 3,
                life: 0.5,
              };
              createParticles(b.x, b.y, config, b.color);
            }

            if (a.type === "player" || a.type === "enemy") a.health -= 1; // Continuous damage
            if (b.type === "player" || b.type === "enemy") b.health -= 1;
          } else {
            // Simple damage
            const dmgA = b.type.includes("projectile") ? 10 : 20;
            const dmgB = a.type.includes("projectile") ? 10 : 20;

            a.health -= dmgA;
            b.health -= dmgB;

            if (a.type.includes("projectile")) {
              const wDef = gameData.weapons.find((w) => w.id === a.weaponId);
              const config = wDef?.hitParticles || {
                count: 5,
                speed: 100,
                size: 3,
                life: 0.5,
              };
              createParticles(a.x, a.y, config, a.color);
            }
            if (b.type.includes("projectile")) {
              const wDef = gameData.weapons.find((w) => w.id === b.weaponId);
              const config = wDef?.hitParticles || {
                count: 5,
                speed: 100,
                size: 3,
                life: 0.5,
              };
              createParticles(b.x, b.y, config, b.color);
            }
          }
        }
      }
    }

    // Cleanup dead entities and out of bounds
    state.entities = state.entities.filter((ent) => {
      if (ent.health <= 0) {
        if (ent.type === "enemy") {
          if (ent.scoreValue) {
            state.score += ent.scoreValue;
            setScore(state.score);
          }
          // Find enemy definition
          const eDef =
            gameData.enemies.find(
              (e) => e.id === ent.id.split("_")[0] + "_" + ent.id.split("_")[1],
            ) || gameData.enemies.find((e) => ent.id.startsWith(e.id));

          const config = eDef?.deathParticles || {
            count: 30,
            speed: 150,
            size: 4,
            life: 0.5,
          };
          createParticles(ent.x, ent.y, config, ent.color);
          if (eDef?.deathSoundId) playSoundEffect(eDef.deathSoundId);

          // Powerup Drops
          if (eDef?.powerupDrops && eDef.powerupDrops.length > 0) {
            eDef.powerupDrops.forEach((drop) => {
              if (Math.random() < drop.dropChance) {
                const pDef = gameData.powerups?.find(
                  (p) => p.id === drop.powerupId,
                );
                if (pDef) {
                  state.entities.push({
                    id: `pw_drop_${Math.random()}`,
                    x: ent.x + (Math.random() - 0.5) * 20,
                    y: ent.y + (Math.random() - 0.5) * 20,
                    vx: (Math.random() - 0.5) * 50,
                    vy: (Math.random() - 0.5) * 50,
                    width: pDef.size * 2,
                    height: pDef.size * 2,
                    health: 1,
                    maxHealth: 1,
                    type: "powerup",
                    color: pDef.color,
                    shape: pDef.shape,
                    customPath: pDef.customPath,
                    customPaths: pDef.customPaths,
                    powerupId: pDef.id,
                    createdAt: performance.now(),
                  });
                }
              }
            });
          }
        }
        if (ent.type === "player") {
          setPlayerHealth(0);
          const config = gameData.playerBaseStats.deathParticles || {
            count: 50,
            speed: 200,
            size: 5,
            life: 1,
          };
          createParticles(ent.x, ent.y, config, ent.color);
          if (gameData.playerBaseStats.deathSoundId)
            playSoundEffect(gameData.playerBaseStats.deathSoundId);
          setTimeout(() => {
            setGameStateSafe("gameover");
          }, 1000);
        }
        if (ent.type === "obstacle") {
          // Hack to find obstacle def
          const oDef = gameData.obstacles.find(
            (o) => o.id === ent.id.split("_")[0] + "_" + ent.id.split("_")[1],
          );
          const config = oDef?.deathParticles || {
            count: 20,
            speed: 100,
            size: 4,
            life: 0.5,
          };
          createParticles(ent.x, ent.y, config, ent.color);
          if (oDef?.deathSoundId) playSoundEffect(oDef.deathSoundId);
        }
        return false;
      }

      // Out of bounds
      if (ent.type.includes("projectile")) {
        if (
          ent.x < state.cameraX - 100 ||
          ent.x > state.cameraX + 900 ||
          ent.y < state.cameraY - 100 ||
          ent.y > state.cameraY + 700
        ) {
          return false;
        }
      }
      return true;
    });

    if (player) setPlayerHealth(player.health);
  };

  const draw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const state = stateRef.current;
    if (!canvas || !ctx || !state.level) return;

    // Clear
    ctx.fillStyle = state.level.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    // Apply camera
    ctx.translate(-state.cameraX, -state.cameraY);

    // Draw grid/stars background effect (default fallback)
    if (
      !state.level.backgroundLayers ||
      state.level.backgroundLayers.length === 0
    ) {
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 1;
      const startX = Math.floor(state.cameraX / 100) * 100;
      const startY = Math.floor(state.cameraY / 100) * 100;
      for (let x = startX; x < startX + 900; x += 100) {
        ctx.beginPath();
        ctx.moveTo(x, state.cameraY);
        ctx.lineTo(x, state.cameraY + 600);
        ctx.stroke();
      }
      for (let y = startY; y < startY + 700; y += 100) {
        ctx.beginPath();
        ctx.moveTo(state.cameraX, y);
        ctx.lineTo(state.cameraX + 800, y);
        ctx.stroke();
      }
    } else {
      // Draw parallax layers
      state.level.backgroundLayers.forEach((layer) => {
        ctx.fillStyle = layer.color;

        // Calculate parallax offset
        const px = state.cameraX * layer.speed;
        const py = state.cameraY * layer.speed;

        // We need to draw the layer elements. Since we don't store individual star positions,
        // we can use a pseudo-random number generator based on coordinates to draw them deterministically.
        // A simple grid-based approach with random offsets within cells.
        const cellSize = 100;
        const startX = Math.floor(px / cellSize) * cellSize;
        const startY = Math.floor(py / cellSize) * cellSize;

        for (let x = startX; x < startX + 800 + cellSize; x += cellSize) {
          for (let y = startY; y < startY + 600 + cellSize; y += cellSize) {
            // Pseudo-random based on grid cell and layer id
            const seed =
              (x * 13.37 + y * 42.1 + layer.id.charCodeAt(0) * 100) % 1000;
            const randX = (Math.sin(seed) * 0.5 + 0.5) * cellSize;
            const randY = (Math.cos(seed) * 0.5 + 0.5) * cellSize;

            // Draw multiple items per cell based on density
            for (let i = 0; i < layer.density; i++) {
              const itemSeed = seed + i * 10;
              const ix = x + (Math.sin(itemSeed) * 0.5 + 0.5) * cellSize;
              const iy = y + (Math.cos(itemSeed) * 0.5 + 0.5) * cellSize;

              // Apply parallax shift to get screen coordinates
              const screenX = ix + (state.cameraX - px);
              const screenY = iy + (state.cameraY - py);

              if (layer.shape === "circle") {
                ctx.beginPath();
                ctx.arc(screenX, screenY, layer.size, 0, Math.PI * 2);
                ctx.fill();
              } else if (layer.shape === "square") {
                ctx.fillRect(
                  screenX - layer.size,
                  screenY - layer.size,
                  layer.size * 2,
                  layer.size * 2,
                );
              } else if (layer.shape === "line") {
                ctx.strokeStyle = layer.color;
                ctx.lineWidth = layer.size;
                ctx.beginPath();
                ctx.moveTo(screenX, screenY);
                ctx.lineTo(screenX, screenY + layer.size * 4);
                ctx.stroke();
              }
            }
          }
        }
      });
    }

    // Draw Particles
    state.particles.forEach((p) => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // Draw Entities
    state.entities.forEach((ent) => {
      ctx.save();
      ctx.translate(ent.x, ent.y);

      let baseRotation = 0;
      if (ent.type === "player") {
        baseRotation =
          state.level?.scrollDirection === "horizontal" ? Math.PI / 2 : 0;
      } else if (ent.type === "enemy") {
        baseRotation =
          state.level?.scrollDirection === "horizontal"
            ? -Math.PI / 2
            : Math.PI;
      } else if (ent.type.includes("projectile")) {
        baseRotation = Math.atan2(ent.vy, ent.vx) + Math.PI / 2;
      }
      ctx.rotate(baseRotation);

      ctx.fillStyle = ent.color;
      ctx.strokeStyle = ent.color;
      ctx.lineWidth = 2;

      const halfW = ent.width / 2;
      const halfH = ent.height / 2;

      if (ent.shape === "square") {
        ctx.fillRect(-halfW, -halfH, ent.width, ent.height);
      } else if (ent.shape === "circle") {
        ctx.beginPath();
        ctx.arc(0, 0, halfW, 0, Math.PI * 2);
        ctx.fill();
      } else if (ent.shape === "triangle") {
        ctx.beginPath();
        ctx.moveTo(0, -halfH);
        ctx.lineTo(halfW, halfH);
        ctx.lineTo(-halfW, halfH);
        ctx.fill();
      } else if (ent.shape === "ship") {
        // Custom player ship
        ctx.beginPath();
        ctx.moveTo(0, -halfH);
        ctx.lineTo(halfW, halfH);
        ctx.lineTo(-halfW, halfH);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.fillRect(-halfW, halfH - 4, ent.width, 4);
      } else if (ent.shape === "line") {
        ctx.beginPath();
        ctx.moveTo(0, -halfH);
        ctx.lineTo(0, halfH);
        ctx.stroke();
      } else if (ent.shape === "custom") {
        const pathsToDraw = ent.customPaths?.length
          ? ent.customPaths
          : ent.customPath
            ? [{ path: ent.customPath, color: ent.color }]
            : [];

        pathsToDraw.forEach((layer) => {
          if (!layer.path) return;

          ctx.save();

          const now = performance.now() / 1000;
          const age = now - ent.createdAt / 1000;

          if (layer.rotationSpeed) {
            ctx.rotate(layer.rotationSpeed * age * (Math.PI / 180));
          }

          if (
            layer.pulseSpeed &&
            layer.pulseMin !== undefined &&
            layer.pulseMax !== undefined
          ) {
            const range = layer.pulseMax - layer.pulseMin;
            const scale =
              layer.pulseMin +
              (Math.sin(age * layer.pulseSpeed * Math.PI * 2) * 0.5 + 0.5) *
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
                parseFloat(commands[i + 1]) * halfW,
                parseFloat(commands[i + 2]) * halfH,
              );
              i += 3;
            } else if (cmd === "L") {
              ctx.lineTo(
                parseFloat(commands[i + 1]) * halfW,
                parseFloat(commands[i + 2]) * halfH,
              );
              i += 3;
            } else if (cmd === "Z") {
              ctx.closePath();
              i += 1;
            } else {
              i += 1;
            }
          }
          ctx.fillStyle = layer.color + "40"; // 25% opacity fill
          ctx.fill();
          ctx.strokeStyle = layer.color;
          ctx.stroke();

          ctx.restore();
        });
      }

      // Health bar for enemies
      if (ent.type === "enemy" && ent.health > 0) {
        ctx.fillStyle = "red";
        ctx.fillRect(-halfW, -halfH - 10, ent.width, 4);
        ctx.fillStyle = "green";
        ctx.fillRect(
          -halfW,
          -halfH - 10,
          ent.width * (ent.health / ent.maxHealth),
          4,
        );
      }

      ctx.restore();
    });

    ctx.restore();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      stopAllAudio();
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  // UI Renderers
  if (gameState === "menu") {
    return (
      <div className="flex h-full items-center justify-center bg-zinc-950">
        <div className="text-center space-y-6">
          <h1 className="text-5xl font-bold text-emerald-400 tracking-tighter">
            VECTOR ENGINE
          </h1>
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

  if (gameState === "story") {
    const node = gameData.storyNodes.find((n) => n.id === currentStoryNodeId);
    if (!node) return <div>Story node not found</div>;

    return (
      <div className="flex h-full items-center justify-center bg-zinc-950 p-8">
        <div className="max-w-2xl w-full bg-zinc-900 border border-zinc-800 p-8 rounded-xl shadow-2xl space-y-8">
          <h2 className="text-3xl font-bold text-emerald-400">{node.title}</h2>
          <p className="text-lg text-zinc-300 font-serif leading-relaxed">
            {node.text}
          </p>

          <div className="space-y-3 pt-8">
            {node.choices.map((choice) => (
              <button
                key={choice.id}
                onClick={() => {
                  if (choice.nextStoryNodeId) {
                    setCurrentStoryNodeId(choice.nextStoryNodeId);
                  } else if (choice.nextLevelId) {
                    startLevel(choice.nextLevelId);
                  } else {
                    setGameStateSafe("menu");
                  }
                }}
                className="w-full text-left px-6 py-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-200 transition-colors border border-zinc-700 hover:border-emerald-500"
              >
                {choice.text}
              </button>
            ))}
            {node.choices.length === 0 && (
              <button
                onClick={() => setGameStateSafe("menu")}
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

  if (gameState === "gameover" || gameState === "victory") {
    return (
      <div className="flex h-full items-center justify-center bg-zinc-950">
        <div className="text-center space-y-6">
          <h1
            className={`text-5xl font-bold ${gameState === "victory" ? "text-emerald-400" : "text-red-500"}`}
          >
            {gameState === "victory" ? "VICTORY" : "GAME OVER"}
          </h1>
          <p className="text-xl text-zinc-400">Final Score: {score}</p>
          <button
            onClick={() => setGameStateSafe("menu")}
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
        <div className="text-emerald-400 font-mono text-xl font-bold">
          SCORE: {score}
        </div>
        <div className="flex items-center gap-2">
          <div className="w-48 h-4 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700">
            <div
              className="h-full bg-emerald-500 transition-all"
              style={{
                width: `${Math.max(0, (playerHealth / gameData.playerBaseStats.health) * 100)}%`,
              }}
            />
          </div>
          <span className="text-emerald-400 font-mono text-sm">
            {Math.max(0, playerHealth)} HP
          </span>
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
