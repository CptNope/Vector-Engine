import React, { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../../store';
import { SoundEffectDef, SynthConfig, NoteDef } from '../../types';
import { Plus, Trash2, Play, Square } from 'lucide-react';

const DEFAULT_SYNTH: SynthConfig = {
  oscillatorType: 'square',
  envelope: { attack: 0.01, decay: 0.1, sustain: 0.2, release: 0.1 },
  volume: 0.5,
  filterType: 'lowpass',
  filterCutoff: 2000,
  filterResonance: 1
};

export default function SoundEditor() {
  const { gameData, addSoundEffect, updateSoundEffect, deleteSoundEffect } = useGameStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  const soundEffects = gameData.soundEffects || [];
  const selectedSound = soundEffects.find(s => s.id === selectedId);

  const handleAdd = () => {
    const newSound: SoundEffectDef = {
      id: `sfx_${Date.now()}`,
      name: 'New Sound',
      synthConfig: { ...DEFAULT_SYNTH },
      notes: [{ pitch: 60, time: 0, duration: 0.2, velocity: 1 }],
      duration: 0.5
    };
    addSoundEffect(newSound);
    setSelectedId(newSound.id);
  };

  const playSound = (sound: SoundEffectDef) => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    sound.notes.forEach(note => {
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
      gain.gain.linearRampToValueAtTime(sound.synthConfig.volume * note.velocity, t + env.attack);
      gain.gain.linearRampToValueAtTime(sound.synthConfig.volume * note.velocity * env.sustain, t + env.attack + env.decay);
      gain.gain.setValueAtTime(sound.synthConfig.volume * note.velocity * env.sustain, t + note.duration);
      gain.gain.linearRampToValueAtTime(0, t + note.duration + env.release);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(t);
      osc.stop(t + note.duration + env.release);
    });
    
    setTimeout(() => {
      if (ctx.state !== 'closed') {
        ctx.close().catch(() => {});
      }
    }, (sound.duration + sound.synthConfig.envelope.release) * 1000 + 500);
  };

  return (
    <div className="flex h-full bg-zinc-950 text-zinc-100">
      {/* Sidebar */}
      <div className="w-64 border-r border-zinc-800 flex flex-col bg-zinc-900/50">
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
          <h2 className="font-semibold text-zinc-100">Sound Effects</h2>
          <button onClick={handleAdd} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-emerald-400">
            <Plus size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {soundEffects.map(sfx => (
            <button
              key={sfx.id}
              onClick={() => setSelectedId(sfx.id)}
              className={`w-full text-left px-3 py-2 rounded text-sm ${selectedId === sfx.id ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
            >
              {sfx.name}
            </button>
          ))}
          {soundEffects.length === 0 && (
            <div className="text-center text-zinc-600 text-sm p-4">No sounds yet</div>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto p-8">
        {selectedSound ? (
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <input 
                  type="text" 
                  value={selectedSound.name}
                  onChange={e => updateSoundEffect({ ...selectedSound, name: e.target.value })}
                  className="bg-transparent text-2xl font-bold text-zinc-100 focus:outline-none border-b border-transparent focus:border-emerald-500"
                />
                <p className="text-sm text-zinc-500 font-mono">{selectedSound.id}</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => playSound(selectedSound)}
                  className="p-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded flex items-center gap-2"
                >
                  <Play size={20} /> Play
                </button>
                <button 
                  onClick={() => { deleteSoundEffect(selectedSound.id); setSelectedId(null); }}
                  className="p-2 text-red-400 hover:bg-red-400/10 rounded"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Synth Config */}
              <div className="space-y-4 p-4 border border-zinc-800 rounded bg-zinc-900/50">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase">Synthesizer</h3>
                
                <div className="space-y-1">
                  <label className="text-xs text-zinc-500 uppercase">Oscillator Type</label>
                  <select 
                    value={selectedSound.synthConfig.oscillatorType}
                    onChange={e => updateSoundEffect({ ...selectedSound, synthConfig: { ...selectedSound.synthConfig, oscillatorType: e.target.value as any } })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="sine">Sine</option>
                    <option value="square">Square</option>
                    <option value="sawtooth">Sawtooth</option>
                    <option value="triangle">Triangle</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs text-zinc-500 uppercase">Attack (s)</label>
                    <input type="number" step="0.01" value={selectedSound.synthConfig.envelope.attack} onChange={e => updateSoundEffect({ ...selectedSound, synthConfig: { ...selectedSound.synthConfig, envelope: { ...selectedSound.synthConfig.envelope, attack: Number(e.target.value) } } })} className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-zinc-500 uppercase">Decay (s)</label>
                    <input type="number" step="0.01" value={selectedSound.synthConfig.envelope.decay} onChange={e => updateSoundEffect({ ...selectedSound, synthConfig: { ...selectedSound.synthConfig, envelope: { ...selectedSound.synthConfig.envelope, decay: Number(e.target.value) } } })} className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-zinc-500 uppercase">Sustain (0-1)</label>
                    <input type="number" step="0.1" value={selectedSound.synthConfig.envelope.sustain} onChange={e => updateSoundEffect({ ...selectedSound, synthConfig: { ...selectedSound.synthConfig, envelope: { ...selectedSound.synthConfig.envelope, sustain: Number(e.target.value) } } })} className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-zinc-500 uppercase">Release (s)</label>
                    <input type="number" step="0.01" value={selectedSound.synthConfig.envelope.release} onChange={e => updateSoundEffect({ ...selectedSound, synthConfig: { ...selectedSound.synthConfig, envelope: { ...selectedSound.synthConfig.envelope, release: Number(e.target.value) } } })} className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-sm" />
                  </div>
                </div>
              </div>

              {/* Filter Config */}
              <div className="space-y-4 p-4 border border-zinc-800 rounded bg-zinc-900/50">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase">Filter</h3>
                
                <div className="space-y-1">
                  <label className="text-xs text-zinc-500 uppercase">Filter Type</label>
                  <select 
                    value={selectedSound.synthConfig.filterType}
                    onChange={e => updateSoundEffect({ ...selectedSound, synthConfig: { ...selectedSound.synthConfig, filterType: e.target.value as any } })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="lowpass">Lowpass</option>
                    <option value="highpass">Highpass</option>
                    <option value="bandpass">Bandpass</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-zinc-500 uppercase">Cutoff (Hz)</label>
                  <input type="range" min="20" max="20000" value={selectedSound.synthConfig.filterCutoff} onChange={e => updateSoundEffect({ ...selectedSound, synthConfig: { ...selectedSound.synthConfig, filterCutoff: Number(e.target.value) } })} className="w-full" />
                  <div className="text-xs text-zinc-400 text-right">{selectedSound.synthConfig.filterCutoff} Hz</div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-zinc-500 uppercase">Resonance (Q)</label>
                  <input type="range" min="0" max="20" step="0.1" value={selectedSound.synthConfig.filterResonance} onChange={e => updateSoundEffect({ ...selectedSound, synthConfig: { ...selectedSound.synthConfig, filterResonance: Number(e.target.value) } })} className="w-full" />
                  <div className="text-xs text-zinc-400 text-right">{selectedSound.synthConfig.filterResonance}</div>
                </div>
              </div>
            </div>

            {/* Piano Roll / Notes */}
            <div className="space-y-4 p-4 border border-zinc-800 rounded bg-zinc-900/50">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase">Notes (Piano Roll)</h3>
                <button 
                  onClick={() => {
                    const newNotes = [...selectedSound.notes, { pitch: 60, time: selectedSound.duration, duration: 0.1, velocity: 1 }];
                    updateSoundEffect({ ...selectedSound, notes: newNotes, duration: selectedSound.duration + 0.1 });
                  }}
                  className="text-xs bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded text-zinc-300"
                >
                  + Add Note
                </button>
              </div>
              
              <div className="space-y-2">
                {selectedSound.notes.map((note, idx) => (
                  <div key={idx} className="flex gap-2 items-center bg-zinc-950 p-2 rounded border border-zinc-800">
                    <div className="w-8 text-xs text-zinc-500 text-center">#{idx+1}</div>
                    <div className="flex-1 space-y-1">
                      <label className="text-[10px] text-zinc-500 uppercase">Pitch (MIDI)</label>
                      <input type="number" value={note.pitch} onChange={e => {
                        const newNotes = [...selectedSound.notes];
                        newNotes[idx].pitch = Number(e.target.value);
                        updateSoundEffect({ ...selectedSound, notes: newNotes });
                      }} className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <label className="text-[10px] text-zinc-500 uppercase">Time (s)</label>
                      <input type="number" step="0.05" value={note.time} onChange={e => {
                        const newNotes = [...selectedSound.notes];
                        newNotes[idx].time = Number(e.target.value);
                        updateSoundEffect({ ...selectedSound, notes: newNotes });
                      }} className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <label className="text-[10px] text-zinc-500 uppercase">Duration (s)</label>
                      <input type="number" step="0.05" value={note.duration} onChange={e => {
                        const newNotes = [...selectedSound.notes];
                        newNotes[idx].duration = Number(e.target.value);
                        updateSoundEffect({ ...selectedSound, notes: newNotes });
                      }} className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs" />
                    </div>
                    <button 
                      onClick={() => {
                        const newNotes = selectedSound.notes.filter((_, i) => i !== idx);
                        updateSoundEffect({ ...selectedSound, notes: newNotes });
                      }}
                      className="p-1.5 text-zinc-500 hover:text-red-400 mt-4"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-500">
            Select or create a sound effect to edit
          </div>
        )}
      </div>
    </div>
  );
}
