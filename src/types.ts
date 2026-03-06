export type Vector2 = { x: number; y: number };

export type ParticleConfig = {
  count: number;
  speed: number;
  size: number;
  life: number;
  color?: string;
};

export type VectorPath = {
  path: string;
  color: string;
  rotationSpeed?: number;
  pulseSpeed?: number;
  pulseMin?: number;
  pulseMax?: number;
};

export type WeaponDef = {
  id: string;
  name: string;
  fireRate: number; // shots per second
  damage: number;
  speed: number;
  color: string;
  projectileCount: number;
  spreadAngle: number;
  shape: "circle" | "line" | "square" | "custom";
  customPath?: string;
  customPaths?: VectorPath[];
  size: number;
  hitParticles?: ParticleConfig;
  fireSoundId?: string;
};

export type EnemyDef = {
  id: string;
  name: string;
  health: number;
  speed: number;
  color: string;
  shape: "circle" | "square" | "triangle" | "custom";
  customPath?: string;
  customPaths?: VectorPath[];
  size: number;
  weaponId: string | null;
  aiType: "chase" | "patrol" | "stationary" | "sine";
  scoreValue: number;
  deathParticles?: ParticleConfig;
  deathSoundId?: string;
  powerupDrops?: { powerupId: string; dropChance: number }[];
};

export type ObstacleDef = {
  id: string;
  name: string;
  shape: "square" | "circle" | "custom";
  customPath?: string;
  customPaths?: VectorPath[];
  size: number;
  color: string;
  deathParticles?: ParticleConfig;
  deathSoundId?: string;
};

export type BackgroundLayer = {
  id: string;
  speed: number; // Parallax speed multiplier (e.g., 0.5 for half speed)
  color: string;
  density: number; // Number of stars/shapes
  size: number;
  shape: "circle" | "square" | "line";
};

export type LevelDef = {
  id: string;
  name: string;
  scrollDirection: "horizontal" | "vertical";
  length: number; // in pixels
  backgroundColor: string;
  backgroundLayers?: BackgroundLayer[];
  entities: {
    id: string;
    enemyDefId: string;
    x: number;
    y: number;
  }[];
  obstacles: {
    id: string;
    obstacleDefId: string;
    x: number;
    y: number;
  }[];
  powerups?: {
    id: string;
    powerupDefId: string;
    x: number;
    y: number;
  }[];
  nextLevelId: string | null; // Default next level
  nextStoryNodeId: string | null; // Or next story node
  musicTrackId?: string;
};

export type StoryNode = {
  id: string;
  title: string;
  text: string;
  choices: {
    id: string;
    text: string;
    nextLevelId: string | null;
    nextStoryNodeId: string | null;
  }[];
};

export type EnvelopeConfig = {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
};

export type SynthConfig = {
  oscillatorType: "sine" | "square" | "sawtooth" | "triangle";
  envelope: EnvelopeConfig;
  volume: number;
  filterType: "lowpass" | "highpass" | "bandpass";
  filterCutoff: number;
  filterResonance: number;
  delay?: { time: number; feedback: number; mix: number };
  reverb?: { decay: number; mix: number };
  distortion?: { amount: number };
  flanger?: { speed: number; depth: number; mix: number };
};

export type NoteDef = {
  pitch: number; // MIDI note number
  time: number; // Start time in beats
  duration: number; // Duration in beats
  velocity: number; // 0-1
};

export type SoundEffectDef = {
  id: string;
  name: string;
  synthConfig: SynthConfig;
  notes: NoteDef[];
  duration: number; // Total duration in beats
};

export type MusicChannelDef = {
  id: string;
  name: string;
  type?: 'synth' | 'drum';
  synthConfig: SynthConfig;
  notes: NoteDef[];
};

export type MusicTrackDef = {
  id: string;
  name: string;
  bpm: number;
  channels: MusicChannelDef[];
};

export type PowerupDef = {
  id: string;
  name: string;
  type: "health" | "weapon" | "score" | "speed";
  value: number; // Amount of health, score, or speed multiplier
  weaponId?: string; // If type is weapon
  shape: "circle" | "square" | "custom";
  customPath?: string;
  customPaths?: VectorPath[];
  size: number;
  color: string;
  pickupSoundId?: string;
  pickupParticles?: ParticleConfig;
};

export type UIConfig = {
  menuTitle: string;
  menuSubtitle: string;
  menuBackgroundColor: string;
  menuTextColor: string;
  menuButtonColor: string;
  menuButtonTextColor: string;
  inGameHudColor: string;
  gameOverTitle: string;
  gameOverSubtitle: string;
  gameOverTextColor: string;
  victoryTitle: string;
  victorySubtitle: string;
  victoryTextColor: string;
  endScreenBackgroundColor: string;
};

export type GameData = {
  weapons: WeaponDef[];
  enemies: EnemyDef[];
  obstacles: ObstacleDef[];
  powerups: PowerupDef[];
  levels: LevelDef[];
  storyNodes: StoryNode[];
  soundEffects: SoundEffectDef[];
  musicTracks: MusicTrackDef[];
  uiConfig?: UIConfig;
  playerBaseStats: {
    health: number;
    speed: number;
    color: string;
    startingWeaponId: string | null;
    shape: "triangle" | "ship" | "custom";
    customPath?: string;
    customPaths?: VectorPath[];
    size: number;
    deathParticles?: ParticleConfig;
    thrusterParticles?: ParticleConfig;
    deathSoundId?: string;
  };
  startStoryNodeId: string | null;
  startLevelId: string | null;
};
