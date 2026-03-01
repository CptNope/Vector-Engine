import { create } from 'zustand';
import { GameData, WeaponDef, EnemyDef, LevelDef, StoryNode } from './types';

interface GameStore {
  gameData: GameData;
  setGameData: (data: GameData) => void;
  updateWeapon: (weapon: WeaponDef) => void;
  addWeapon: (weapon: WeaponDef) => void;
  deleteWeapon: (id: string) => void;
  updateEnemy: (enemy: EnemyDef) => void;
  addEnemy: (enemy: EnemyDef) => void;
  deleteEnemy: (id: string) => void;
  updateObstacle: (obstacle: ObstacleDef) => void;
  addObstacle: (obstacle: ObstacleDef) => void;
  deleteObstacle: (id: string) => void;
  updateLevel: (level: LevelDef) => void;
  addLevel: (level: LevelDef) => void;
  deleteLevel: (id: string) => void;
  updateStoryNode: (node: StoryNode) => void;
  addStoryNode: (node: StoryNode) => void;
  deleteStoryNode: (id: string) => void;
  updatePlayerStats: (stats: Partial<GameData['playerBaseStats']>) => void;
  setStartNode: (id: string | null) => void;
  setStartLevel: (id: string | null) => void;
}

const initialGameData: GameData = {
  weapons: [
    {
      id: 'w_default',
      name: 'Pea Shooter',
      fireRate: 5,
      damage: 10,
      speed: 400,
      color: '#00ff00',
      projectileCount: 1,
      spreadAngle: 0,
      shape: 'line',
      size: 4,
    },
    {
      id: 'w_spread',
      name: 'Spread Shot',
      fireRate: 3,
      damage: 8,
      speed: 350,
      color: '#ffaa00',
      projectileCount: 3,
      spreadAngle: 30,
      shape: 'circle',
      size: 3,
    },
    {
      id: 'w_laser',
      name: 'Laser Beam',
      fireRate: 10,
      damage: 5,
      speed: 800,
      color: '#00ffff',
      projectileCount: 1,
      spreadAngle: 0,
      shape: 'line',
      size: 8,
    },
    {
      id: 'w_enemy_basic',
      name: 'Enemy Blaster',
      fireRate: 1,
      damage: 10,
      speed: 200,
      color: '#ff0000',
      projectileCount: 1,
      spreadAngle: 0,
      shape: 'circle',
      size: 4,
    }
  ],
  enemies: [
    {
      id: 'e_grunt',
      name: 'Grunt',
      health: 30,
      speed: 50,
      color: '#ff4444',
      shape: 'square',
      size: 15,
      weaponId: null,
      aiType: 'chase',
      scoreValue: 100,
    },
    {
      id: 'e_shooter',
      name: 'Shooter',
      health: 50,
      speed: 30,
      color: '#ff00ff',
      shape: 'triangle',
      size: 20,
      weaponId: 'w_enemy_basic',
      aiType: 'sine',
      scoreValue: 250,
    },
    {
      id: 'e_tank',
      name: 'Tank',
      health: 200,
      speed: 20,
      color: '#ffaa00',
      shape: 'square',
      size: 30,
      weaponId: 'w_spread',
      aiType: 'patrol',
      scoreValue: 500,
    }
  ],
  obstacles: [],
  levels: [
    {
      id: 'l_1',
      name: 'Level 1: The Asteroid Belt',
      scrollDirection: 'vertical',
      length: 4000,
      backgroundColor: '#050510',
      entities: [
        // Wave 1
        { id: 'ent_1', enemyDefId: 'e_grunt', x: 200, y: 3500 },
        { id: 'ent_2', enemyDefId: 'e_grunt', x: 600, y: 3500 },
        { id: 'ent_3', enemyDefId: 'e_grunt', x: 400, y: 3400 },
        
        // Wave 2
        { id: 'ent_4', enemyDefId: 'e_shooter', x: 200, y: 2800 },
        { id: 'ent_5', enemyDefId: 'e_shooter', x: 600, y: 2800 },
        { id: 'ent_6', enemyDefId: 'e_grunt', x: 400, y: 2700 },
        
        // Wave 3
        { id: 'ent_7', enemyDefId: 'e_grunt', x: 100, y: 2000 },
        { id: 'ent_8', enemyDefId: 'e_grunt', x: 200, y: 1900 },
        { id: 'ent_9', enemyDefId: 'e_grunt', x: 700, y: 2000 },
        { id: 'ent_10', enemyDefId: 'e_grunt', x: 600, y: 1900 },
        { id: 'ent_11', enemyDefId: 'e_tank', x: 400, y: 1800 },

        // Wave 4
        { id: 'ent_12', enemyDefId: 'e_shooter', x: 300, y: 1000 },
        { id: 'ent_13', enemyDefId: 'e_shooter', x: 500, y: 1000 },
        { id: 'ent_14', enemyDefId: 'e_tank', x: 200, y: 800 },
        { id: 'ent_15', enemyDefId: 'e_tank', x: 600, y: 800 },

        // Boss Wave
        { id: 'ent_16', enemyDefId: 'e_tank', x: 400, y: 300 },
        { id: 'ent_17', enemyDefId: 'e_shooter', x: 200, y: 200 },
        { id: 'ent_18', enemyDefId: 'e_shooter', x: 600, y: 200 },
      ],
      obstacles: [],
      nextLevelId: null,
      nextStoryNodeId: 's_2',
    }
  ],
  storyNodes: [
    {
      id: 's_1',
      title: 'Prologue',
      text: 'The galaxy is under attack by the Vector Armada. You are our last hope. Will you take the mission?',
      choices: [
        { id: 'c_1', text: 'Yes, I will fight!', nextLevelId: 'l_1', nextStoryNodeId: null },
        { id: 'c_2', text: 'No, it is too dangerous.', nextLevelId: null, nextStoryNodeId: 's_coward' }
      ]
    },
    {
      id: 's_2',
      title: 'Victory',
      text: 'You survived the first wave. But the war is just beginning...',
      choices: [
        { id: 'c_3', text: 'Continue', nextLevelId: null, nextStoryNodeId: null }
      ]
    },
    {
      id: 's_coward',
      title: 'Game Over',
      text: 'You refused the call. The galaxy was consumed.',
      choices: []
    }
  ],
  playerBaseStats: {
    health: 100,
    speed: 250,
    color: '#00ffff',
    startingWeaponId: 'w_default',
    shape: 'ship',
    size: 15,
  },
  startStoryNodeId: 's_1',
  startLevelId: null,
};

export const useGameStore = create<GameStore>((set) => ({
  gameData: initialGameData,
  setGameData: (data) => set({ gameData: data }),
  updateWeapon: (weapon) => set((state) => ({ gameData: { ...state.gameData, weapons: state.gameData.weapons.map(w => w.id === weapon.id ? weapon : w) } })),
  addWeapon: (weapon) => set((state) => ({ gameData: { ...state.gameData, weapons: [...state.gameData.weapons, weapon] } })),
  deleteWeapon: (id) => set((state) => ({ gameData: { ...state.gameData, weapons: state.gameData.weapons.filter(w => w.id !== id) } })),
  updateEnemy: (enemy) => set((state) => ({ gameData: { ...state.gameData, enemies: state.gameData.enemies.map(e => e.id === enemy.id ? enemy : e) } })),
  addEnemy: (enemy) => set((state) => ({ gameData: { ...state.gameData, enemies: [...state.gameData.enemies, enemy] } })),
  deleteEnemy: (id) => set((state) => ({ gameData: { ...state.gameData, enemies: state.gameData.enemies.filter(e => e.id !== id) } })),
  updateObstacle: (obstacle) => set((state) => ({ gameData: { ...state.gameData, obstacles: state.gameData.obstacles.map(o => o.id === obstacle.id ? obstacle : o) } })),
  addObstacle: (obstacle) => set((state) => ({ gameData: { ...state.gameData, obstacles: [...state.gameData.obstacles, obstacle] } })),
  deleteObstacle: (id) => set((state) => ({ gameData: { ...state.gameData, obstacles: state.gameData.obstacles.filter(o => o.id !== id) } })),
  updateLevel: (level) => set((state) => ({ gameData: { ...state.gameData, levels: state.gameData.levels.map(l => l.id === level.id ? level : l) } })),
  addLevel: (level) => set((state) => ({ gameData: { ...state.gameData, levels: [...state.gameData.levels, level] } })),
  deleteLevel: (id) => set((state) => ({ gameData: { ...state.gameData, levels: state.gameData.levels.filter(l => l.id !== id) } })),
  updateStoryNode: (node) => set((state) => ({ gameData: { ...state.gameData, storyNodes: state.gameData.storyNodes.map(n => n.id === node.id ? node : n) } })),
  addStoryNode: (node) => set((state) => ({ gameData: { ...state.gameData, storyNodes: [...state.gameData.storyNodes, node] } })),
  deleteStoryNode: (id) => set((state) => ({ gameData: { ...state.gameData, storyNodes: state.gameData.storyNodes.filter(n => n.id !== id) } })),
  updatePlayerStats: (stats) => set((state) => ({ gameData: { ...state.gameData, playerBaseStats: { ...state.gameData.playerBaseStats, ...stats } } })),
  setStartNode: (id) => set((state) => ({ gameData: { ...state.gameData, startStoryNodeId: id } })),
  setStartLevel: (id) => set((state) => ({ gameData: { ...state.gameData, startLevelId: id } })),
}));
