import React from 'react';
import { useGameStore } from '../../store';

export default function UIEditor() {
  const { gameData, updateUIConfig } = useGameStore();
  const uiConfig = gameData.uiConfig || {
    menuTitle: "VECTOR SHMUP STUDIO",
    menuSubtitle: "A Retro Vector Shooter",
    menuBackgroundColor: "#09090b",
    menuTextColor: "#34d399",
    menuButtonColor: "#10b981",
    menuButtonTextColor: "#09090b",
    inGameHudColor: "#34d399",
  };

  const handleChange = (field: keyof typeof uiConfig, value: string) => {
    updateUIConfig({ [field]: value });
  };

  return (
    <div className="h-full flex flex-col bg-zinc-950 text-zinc-100">
      <div className="p-4 border-b border-zinc-800 bg-zinc-900 flex justify-between items-center">
        <h2 className="text-lg font-bold text-emerald-400">Menu & UI Editor</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-8">
          
          {/* Menu Text */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
            <h3 className="text-md font-semibold text-emerald-400 border-b border-zinc-800 pb-2">Menu Text</h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs text-zinc-500 uppercase font-semibold mb-1">Menu Title</label>
                <input 
                  type="text" 
                  value={uiConfig.menuTitle} 
                  onChange={(e) => handleChange('menuTitle', e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 uppercase font-semibold mb-1">Menu Subtitle</label>
                <input 
                  type="text" 
                  value={uiConfig.menuSubtitle} 
                  onChange={(e) => handleChange('menuSubtitle', e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Colors */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
            <h3 className="text-md font-semibold text-emerald-400 border-b border-zinc-800 pb-2">Colors</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-zinc-500 uppercase font-semibold mb-1">Menu Background</label>
                <div className="flex gap-2">
                  <input 
                    type="color" 
                    value={uiConfig.menuBackgroundColor} 
                    onChange={(e) => handleChange('menuBackgroundColor', e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer bg-zinc-950 border border-zinc-800"
                  />
                  <input 
                    type="text" 
                    value={uiConfig.menuBackgroundColor} 
                    onChange={(e) => handleChange('menuBackgroundColor', e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-3 py-1 text-sm focus:outline-none focus:border-emerald-500 uppercase font-mono"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs text-zinc-500 uppercase font-semibold mb-1">Menu Text Color</label>
                <div className="flex gap-2">
                  <input 
                    type="color" 
                    value={uiConfig.menuTextColor} 
                    onChange={(e) => handleChange('menuTextColor', e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer bg-zinc-950 border border-zinc-800"
                  />
                  <input 
                    type="text" 
                    value={uiConfig.menuTextColor} 
                    onChange={(e) => handleChange('menuTextColor', e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-3 py-1 text-sm focus:outline-none focus:border-emerald-500 uppercase font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-zinc-500 uppercase font-semibold mb-1">Menu Button Color</label>
                <div className="flex gap-2">
                  <input 
                    type="color" 
                    value={uiConfig.menuButtonColor} 
                    onChange={(e) => handleChange('menuButtonColor', e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer bg-zinc-950 border border-zinc-800"
                  />
                  <input 
                    type="text" 
                    value={uiConfig.menuButtonColor} 
                    onChange={(e) => handleChange('menuButtonColor', e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-3 py-1 text-sm focus:outline-none focus:border-emerald-500 uppercase font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-zinc-500 uppercase font-semibold mb-1">Button Text Color</label>
                <div className="flex gap-2">
                  <input 
                    type="color" 
                    value={uiConfig.menuButtonTextColor} 
                    onChange={(e) => handleChange('menuButtonTextColor', e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer bg-zinc-950 border border-zinc-800"
                  />
                  <input 
                    type="text" 
                    value={uiConfig.menuButtonTextColor} 
                    onChange={(e) => handleChange('menuButtonTextColor', e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-3 py-1 text-sm focus:outline-none focus:border-emerald-500 uppercase font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-zinc-500 uppercase font-semibold mb-1">In-Game HUD Color</label>
                <div className="flex gap-2">
                  <input 
                    type="color" 
                    value={uiConfig.inGameHudColor} 
                    onChange={(e) => handleChange('inGameHudColor', e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer bg-zinc-950 border border-zinc-800"
                  />
                  <input 
                    type="text" 
                    value={uiConfig.inGameHudColor} 
                    onChange={(e) => handleChange('inGameHudColor', e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-3 py-1 text-sm focus:outline-none focus:border-emerald-500 uppercase font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
            <h3 className="text-md font-semibold text-emerald-400 border-b border-zinc-800 pb-2">Menu Preview</h3>
            
            <div 
              className="w-full aspect-video rounded-lg flex flex-col items-center justify-center border border-zinc-800"
              style={{ backgroundColor: uiConfig.menuBackgroundColor }}
            >
              <div className="text-center space-y-6">
                <div className="space-y-2">
                  <h1 
                    className="text-4xl font-bold tracking-tighter"
                    style={{ color: uiConfig.menuTextColor }}
                  >
                    {uiConfig.menuTitle}
                  </h1>
                  {uiConfig.menuSubtitle && (
                    <p 
                      className="text-lg opacity-80"
                      style={{ color: uiConfig.menuTextColor }}
                    >
                      {uiConfig.menuSubtitle}
                    </p>
                  )}
                </div>
                <button
                  className="px-8 py-3 font-bold rounded-full text-lg transition-transform hover:scale-105"
                  style={{ 
                    backgroundColor: uiConfig.menuButtonColor,
                    color: uiConfig.menuButtonTextColor
                  }}
                >
                  START GAME
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
