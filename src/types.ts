export type Vector2 = { x: number; y: number };

export type WeaponDef = {
  id: string;
  name: string;
  fireRate: number; // shots per second
  damage: number;
  speed: number;
  color: string;
  projectileCount: number;
  spreadAngle: number;
  shape: 'circle' | 'line' | 'square' | 'custom';
  customPath?: string;
  size: number;
};

export type EnemyDef = {
  id: string;
  name: string;
  health: number;
  speed: number;
  color: string;
  shape: 'circle' | 'square' | 'triangle' | 'custom';
  customPath?: string;
  size: number;
  weaponId: string | null;
  aiType: 'chase' | 'patrol' | 'stationary' | 'sine';
  scoreValue: number;
};

export type ObstacleDef = {
  id: string;
  name: string;
  shape: 'square' | 'circle' | 'custom';
  customPath?: string;
  size: number;
  color: string;
};

export type LevelDef = {
  id: string;
  name: string;
  scrollDirection: 'horizontal' | 'vertical';
  length: number; // in pixels
  backgroundColor: string;
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
  nextLevelId: string | null; // Default next level
  nextStoryNodeId: string | null; // Or next story node
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

export type GameData = {
  weapons: WeaponDef[];
  enemies: EnemyDef[];
  obstacles: ObstacleDef[];
  levels: LevelDef[];
  storyNodes: StoryNode[];
  playerBaseStats: {
    health: number;
    speed: number;
    color: string;
    startingWeaponId: string | null;
    shape: 'triangle' | 'ship' | 'custom';
    customPath?: string;
    size: number;
  };
  startStoryNodeId: string | null;
  startLevelId: string | null;
};
