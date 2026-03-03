import React, { useState } from 'react';
import { Play, PenTool, Crosshair, Skull, User, BookOpen, Save, Upload } from 'lucide-react';
import { useGameStore } from './store';
import WeaponEditor from './components/editors/WeaponEditor';
import EnemyEditor from './components/editors/EnemyEditor';
import LevelEditor from './components/editors/LevelEditor';
import StoryEditor from './components/editors/StoryEditor';
import PlayerEditor from './components/editors/PlayerEditor';
import ObstacleEditor from './components/editors/ObstacleEditor';
import PowerupEditor from './components/editors/PowerupEditor';
import SoundEditor from './components/editors/SoundEditor';
import MusicEditor from './components/editors/MusicEditor';
import GamePlayer from './components/GamePlayer';

type ViewMode = 'play' | 'weapons' | 'enemies' | 'levels' | 'story' | 'player' | 'obstacles' | 'powerups' | 'sounds' | 'music';

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('play');
  const { gameData, setGameData } = useGameStore();

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(gameData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "game_data.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          setGameData(data);
        } catch (err) {
          alert("Invalid JSON file");
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
        <div className="p-4 border-b border-zinc-800">
          <h1 className="text-xl font-bold text-emerald-400 tracking-tight">Vector Engine</h1>
          <p className="text-xs text-zinc-500 mt-1">v0.1.0-alpha</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <NavItem icon={<Play size={18} />} label="Play Game" active={viewMode === 'play'} onClick={() => setViewMode('play')} />
          <div className="pt-4 pb-2">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Editors</p>
          </div>
          <NavItem icon={<BookOpen size={18} />} label="Story / Branches" active={viewMode === 'story'} onClick={() => setViewMode('story')} />
          <NavItem icon={<PenTool size={18} />} label="Levels" active={viewMode === 'levels'} onClick={() => setViewMode('levels')} />
          <NavItem icon={<Skull size={18} />} label="Enemies" active={viewMode === 'enemies'} onClick={() => setViewMode('enemies')} />
          <NavItem icon={<Crosshair size={18} />} label="Weapons" active={viewMode === 'weapons'} onClick={() => setViewMode('weapons')} />
          <NavItem icon={<PenTool size={18} />} label="Obstacles" active={viewMode === 'obstacles'} onClick={() => setViewMode('obstacles')} />
          <NavItem icon={<PenTool size={18} />} label="Powerups" active={viewMode === 'powerups'} onClick={() => setViewMode('powerups')} />
          <NavItem icon={<Play size={18} />} label="Sound Effects" active={viewMode === 'sounds'} onClick={() => setViewMode('sounds')} />
          <NavItem icon={<Play size={18} />} label="Music Tracks" active={viewMode === 'music'} onClick={() => setViewMode('music')} />
          <NavItem icon={<User size={18} />} label="Player Stats" active={viewMode === 'player'} onClick={() => setViewMode('player')} />
        </nav>

        <div className="p-4 border-t border-zinc-800 space-y-2">
          <button onClick={handleExport} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-md text-sm transition-colors">
            <Save size={16} /> Export JSON
          </button>
          <label className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-md text-sm transition-colors cursor-pointer">
            <Upload size={16} /> Import JSON
            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
          </label>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative">
        {viewMode === 'play' && <GamePlayer />}
        {viewMode === 'weapons' && <WeaponEditor />}
        {viewMode === 'enemies' && <EnemyEditor />}
        {viewMode === 'levels' && <LevelEditor />}
        {viewMode === 'story' && <StoryEditor />}
        {viewMode === 'player' && <PlayerEditor />}
        {viewMode === 'obstacles' && <ObstacleEditor />}
        {viewMode === 'powerups' && <PowerupEditor />}
        {viewMode === 'sounds' && <SoundEditor />}
        {viewMode === 'music' && <MusicEditor />}
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
        active ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
