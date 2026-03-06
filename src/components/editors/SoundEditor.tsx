import React, { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../../store';
import { SoundEffectDef, SynthConfig, NoteDef } from '../../types';
import { Plus, Trash2, Play, Square, ZoomIn, ZoomOut } from 'lucide-react';
import { Knob } from '../ui/Knob';
import { Slider } from '../ui/Slider';
import { PianoRoll } from '../ui/PianoRoll';
import { applyEffects } from '../../utils/audio';

const DEFAULT_SYNTH: SynthConfig = {
  oscillatorType: 'square',
  envelope: { attack: 0.01, decay: 0.1, sustain: 0.2, release: 0.1 },
  volume: 0.5,
  filterType: 'lowpass',
  filterCutoff: 2000,
  filterResonance: 1,
  delay: { time: 0.3, feedback: 0.3, mix: 0 },
  reverb: { decay: 2, mix: 0 },
  distortion: { amount: 0 }
};

export default function SoundEditor() {
  const { gameData, addSoundEffect, updateSoundEffect, deleteSoundEffect } = useGameStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);
  
  const [playheadTime, setPlayheadTime] = useState<number | null>(null);
  const [zoom, setZoom] = useState(100); // pixels per second
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  
  const soundEffects = gameData.soundEffects || [];
  const selectedSound = soundEffects.find(s => s.id === selectedId);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close().catch(() => {});
      }
    };
  }, [audioCtx]);

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
    if (audioCtx && audioCtx.state !== 'closed') {
      audioCtx.close().catch(() => {});
    }
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    setAudioCtx(ctx);
    setIsPlaying(true);
    
    const masterGain = ctx.createGain();
    masterGain.gain.value = 1;
    
    applyEffects(ctx, sound.synthConfig, masterGain, ctx.destination);
    
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
      gain.connect(masterGain);
      
      osc.start(t);
      osc.stop(t + note.duration + env.release);
    });
    
    startTimeRef.current = ctx.currentTime;
    const updatePlayhead = () => {
      if (ctx.state === 'closed') return;
      const currentSec = ctx.currentTime - startTimeRef.current!;
      if (currentSec > sound.duration) {
        setPlayheadTime(null);
        return;
      }
      setPlayheadTime(currentSec);
      rafRef.current = requestAnimationFrame(updatePlayhead);
    };
    rafRef.current = requestAnimationFrame(updatePlayhead);

    setTimeout(() => {
      setIsPlaying(false);
      if (ctx.state !== 'closed') {
        ctx.close().catch(() => {});
      }
      setAudioCtx(null);
      setPlayheadTime(null);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    }, (sound.duration + sound.synthConfig.envelope.release + 5) * 1000); // +5s for reverb/delay tail
  };

  const stopSound = () => {
    if (audioCtx && audioCtx.state !== 'closed') {
      audioCtx.close().catch(() => {});
      setAudioCtx(null);
    }
    setIsPlaying(false);
    setPlayheadTime(null);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
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
              <div className="flex gap-4 items-center">
                <div className="flex items-center gap-2 bg-zinc-900/50 p-1 rounded border border-zinc-800">
                  <button onClick={() => setZoom(Math.max(20, zoom - 20))} className="p-1 text-zinc-400 hover:text-zinc-200"><ZoomOut size={16} /></button>
                  <span className="text-xs text-zinc-500 w-12 text-center">{zoom}px</span>
                  <button onClick={() => setZoom(Math.min(400, zoom + 20))} className="p-1 text-zinc-400 hover:text-zinc-200"><ZoomIn size={16} /></button>
                </div>
                <div className="flex gap-2">
                  {!isPlaying ? (
                    <button 
                      onClick={() => playSound(selectedSound)}
                      className="p-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded flex items-center gap-2"
                    >
                      <Play size={20} /> Play
                    </button>
                  ) : (
                    <button 
                      onClick={stopSound}
                      className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded flex items-center gap-2"
                    >
                      <Square size={20} /> Stop
                    </button>
                  )}
                  <button 
                    onClick={() => { deleteSoundEffect(selectedSound.id); setSelectedId(null); }}
                    className="p-2 text-red-400 hover:bg-red-400/10 rounded"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
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

                <div className="pt-4">
                  <Slider label="Volume" value={selectedSound.synthConfig.volume} min={0} max={1} step={0.01} onChange={v => updateSoundEffect({ ...selectedSound, synthConfig: { ...selectedSound.synthConfig, volume: v } })} />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <Knob label="Attack" value={selectedSound.synthConfig.envelope.attack} min={0} max={2} step={0.01} unit="s" onChange={v => updateSoundEffect({ ...selectedSound, synthConfig: { ...selectedSound.synthConfig, envelope: { ...selectedSound.synthConfig.envelope, attack: v } } })} />
                  <Knob label="Decay" value={selectedSound.synthConfig.envelope.decay} min={0} max={2} step={0.01} unit="s" onChange={v => updateSoundEffect({ ...selectedSound, synthConfig: { ...selectedSound.synthConfig, envelope: { ...selectedSound.synthConfig.envelope, decay: v } } })} />
                  <Knob label="Sustain" value={selectedSound.synthConfig.envelope.sustain} min={0} max={1} step={0.01} onChange={v => updateSoundEffect({ ...selectedSound, synthConfig: { ...selectedSound.synthConfig, envelope: { ...selectedSound.synthConfig.envelope, sustain: v } } })} />
                  <Knob label="Release" value={selectedSound.synthConfig.envelope.release} min={0} max={5} step={0.01} unit="s" onChange={v => updateSoundEffect({ ...selectedSound, synthConfig: { ...selectedSound.synthConfig, envelope: { ...selectedSound.synthConfig.envelope, release: v } } })} />
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

                <div className="pt-4 space-y-6">
                  <Slider label="Cutoff" value={selectedSound.synthConfig.filterCutoff} min={20} max={20000} step={1} unit="Hz" onChange={v => updateSoundEffect({ ...selectedSound, synthConfig: { ...selectedSound.synthConfig, filterCutoff: v } })} />
                  <Slider label="Resonance" value={selectedSound.synthConfig.filterResonance} min={0} max={20} step={0.1} onChange={v => updateSoundEffect({ ...selectedSound, synthConfig: { ...selectedSound.synthConfig, filterResonance: v } })} />
                </div>
              </div>

              {/* Effects Config */}
              <div className="space-y-4 p-4 border border-zinc-800 rounded bg-zinc-900/50">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase">Effects</h3>
                
                <div className="space-y-4">
                  <div className="border-b border-zinc-800 pb-4">
                    <div className="text-xs text-zinc-500 uppercase font-semibold mb-2">Delay</div>
                    <div className="grid grid-cols-3 gap-2">
                      <Knob size={40} label="Time" value={selectedSound.synthConfig.delay?.time || 0} min={0} max={1} step={0.01} unit="s" onChange={v => updateSoundEffect({ ...selectedSound, synthConfig: { ...selectedSound.synthConfig, delay: { ...(selectedSound.synthConfig.delay || { feedback: 0, mix: 0 }), time: v } } })} />
                      <Knob size={40} label="F.Back" value={selectedSound.synthConfig.delay?.feedback || 0} min={0} max={0.9} step={0.01} onChange={v => updateSoundEffect({ ...selectedSound, synthConfig: { ...selectedSound.synthConfig, delay: { ...(selectedSound.synthConfig.delay || { time: 0, mix: 0 }), feedback: v } } })} />
                      <Knob size={40} label="Mix" value={selectedSound.synthConfig.delay?.mix || 0} min={0} max={1} step={0.01} onChange={v => updateSoundEffect({ ...selectedSound, synthConfig: { ...selectedSound.synthConfig, delay: { ...(selectedSound.synthConfig.delay || { time: 0, feedback: 0 }), mix: v } } })} />
                    </div>
                  </div>

                  <div className="border-b border-zinc-800 pb-4">
                    <div className="text-xs text-zinc-500 uppercase font-semibold mb-2">Reverb</div>
                    <div className="grid grid-cols-2 gap-2">
                      <Knob size={40} label="Decay" value={selectedSound.synthConfig.reverb?.decay || 0} min={0.1} max={10} step={0.1} unit="s" onChange={v => updateSoundEffect({ ...selectedSound, synthConfig: { ...selectedSound.synthConfig, reverb: { ...(selectedSound.synthConfig.reverb || { mix: 0 }), decay: v } } })} />
                      <Knob size={40} label="Mix" value={selectedSound.synthConfig.reverb?.mix || 0} min={0} max={1} step={0.01} onChange={v => updateSoundEffect({ ...selectedSound, synthConfig: { ...selectedSound.synthConfig, reverb: { ...(selectedSound.synthConfig.reverb || { decay: 2 }), mix: v } } })} />
                    </div>
                  </div>

                  <div className="border-b border-zinc-800 pb-4">
                    <div className="text-xs text-zinc-500 uppercase font-semibold mb-2">Distortion</div>
                    <Slider label="Amount" value={selectedSound.synthConfig.distortion?.amount || 0} min={0} max={100} step={1} onChange={v => updateSoundEffect({ ...selectedSound, synthConfig: { ...selectedSound.synthConfig, distortion: { amount: v } } })} />
                  </div>

                  <div>
                    <div className="text-xs text-zinc-500 uppercase font-semibold mb-2">Flanger</div>
                    <div className="grid grid-cols-3 gap-2">
                      <Knob size={40} label="Speed" value={selectedSound.synthConfig.flanger?.speed || 0} min={0.1} max={10} step={0.1} unit="Hz" onChange={v => updateSoundEffect({ ...selectedSound, synthConfig: { ...selectedSound.synthConfig, flanger: { ...(selectedSound.synthConfig.flanger || { depth: 0, mix: 0 }), speed: v } } })} />
                      <Knob size={40} label="Depth" value={selectedSound.synthConfig.flanger?.depth || 0} min={0} max={1} step={0.01} onChange={v => updateSoundEffect({ ...selectedSound, synthConfig: { ...selectedSound.synthConfig, flanger: { ...(selectedSound.synthConfig.flanger || { speed: 0.1, mix: 0 }), depth: v } } })} />
                      <Knob size={40} label="Mix" value={selectedSound.synthConfig.flanger?.mix || 0} min={0} max={1} step={0.01} onChange={v => updateSoundEffect({ ...selectedSound, synthConfig: { ...selectedSound.synthConfig, flanger: { ...(selectedSound.synthConfig.flanger || { speed: 0.1, depth: 0 }), mix: v } } })} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Piano Roll / Notes */}
            <div className="space-y-4 p-4 border border-zinc-800 rounded bg-zinc-900/50">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase">Piano Roll</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-zinc-500 uppercase">Duration (s)</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      min="0.1" 
                      max="10"
                      value={selectedSound.duration} 
                      onChange={e => updateSoundEffect({ ...selectedSound, duration: Number(e.target.value) })} 
                      className="w-16 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs" 
                    />
                  </div>
                </div>
              </div>
              
              <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                <PianoRoll 
                  notes={selectedSound.notes} 
                  onChange={notes => updateSoundEffect({ ...selectedSound, notes })} 
                  duration={selectedSound.duration} 
                  minPitch={24}
                  maxPitch={96}
                  pixelsPerUnit={zoom} // Dynamic zoom
                  snapStep={0.05} // Snap to 0.05s
                  playheadTime={playheadTime}
                  height={300}
                />
              </div>
              <div className="text-xs text-zinc-500">
                Click to add note. Drag to move. Drag right edge to resize. Right-click to delete.
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
