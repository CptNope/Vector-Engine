import React from 'react';
import { ParticleConfig } from '../../types';

interface ParticleConfigEditorProps {
  label: string;
  config?: ParticleConfig;
  onChange: (config: ParticleConfig | undefined) => void;
  defaultColor: string;
}

export default function ParticleConfigEditor({ label, config, onChange, defaultColor }: ParticleConfigEditorProps) {
  const isEnabled = !!config;

  const handleToggle = () => {
    if (isEnabled) {
      onChange(undefined);
    } else {
      onChange({
        count: 20,
        speed: 100,
        size: 3,
        life: 0.5,
        color: defaultColor,
      });
    }
  };

  const updateField = (field: keyof ParticleConfig, value: any) => {
    if (!config) return;
    onChange({ ...config, [field]: value });
  };

  return (
    <div className="space-y-3 p-3 border border-zinc-800 rounded bg-zinc-900/50">
      <div className="flex items-center justify-between">
        <label className="text-xs text-zinc-400 uppercase font-semibold">{label}</label>
        <button
          onClick={handleToggle}
          className={`text-xs px-2 py-1 rounded ${isEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'}`}
        >
          {isEnabled ? 'Enabled' : 'Disabled'}
        </button>
      </div>

      {isEnabled && config && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] text-zinc-500 uppercase">Count</label>
            <input
              type="number"
              value={config.count}
              onChange={e => updateField('count', Number(e.target.value))}
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-zinc-500 uppercase">Speed</label>
            <input
              type="number"
              value={config.speed}
              onChange={e => updateField('speed', Number(e.target.value))}
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-zinc-500 uppercase">Size</label>
            <input
              type="number"
              value={config.size}
              onChange={e => updateField('size', Number(e.target.value))}
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-zinc-500 uppercase">Life (sec)</label>
            <input
              type="number"
              step="0.1"
              value={config.life}
              onChange={e => updateField('life', Number(e.target.value))}
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="col-span-2 space-y-1">
            <label className="text-[10px] text-zinc-500 uppercase">Color Override (Optional)</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={config.color || defaultColor}
                onChange={e => updateField('color', e.target.value)}
                className="w-6 h-6 rounded cursor-pointer shrink-0 border border-zinc-700 bg-zinc-950"
              />
              <input
                type="text"
                value={config.color || ''}
                placeholder="Inherit from entity"
                onChange={e => updateField('color', e.target.value || undefined)}
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
