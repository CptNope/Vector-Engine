import React, { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../../store';
import { MusicTrackDef, MusicChannelDef, SynthConfig, NoteDef } from '../../types';
import { Plus, Trash2, Play, Square, ChevronDown, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { Knob } from '../ui/Knob';
import { Slider } from '../ui/Slider';
import { PianoRoll } from '../ui/PianoRoll';
import { StepSequencer } from '../ui/StepSequencer';
import { applyEffects, playSynthNote, playDrumNote } from '../../utils/audio';

const DEFAULT_SYNTH: SynthConfig = {
  oscillatorType: 'square',
  envelope: { attack: 0.01, decay: 0.1, sustain: 0.2, release: 0.1 },
  volume: 0.3,
  filterType: 'lowpass',
  filterCutoff: 2000,
  filterResonance: 1,
  delay: { time: 0.3, feedback: 0.3, mix: 0 },
  reverb: { decay: 2, mix: 0 },
  distortion: { amount: 0 }
};

export default function MusicEditor() {
  const { gameData, addMusicTrack, updateMusicTrack, deleteMusicTrack } = useGameStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedChannels, setExpandedChannels] = useState<Record<string, boolean>>({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);
  
  const [playheadTime, setPlayheadTime] = useState<number | null>(null);
  const [zoom, setZoom] = useState(50); // pixels per beat
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  
  const musicTracks = gameData.musicTracks || [];
  const selectedTrack = musicTracks.find(t => t.id === selectedId);

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
    const newTrack: MusicTrackDef = {
      id: `music_${Date.now()}`,
      name: 'New Track',
      bpm: 120,
      channels: [
        {
          id: `ch_${Date.now()}`,
          name: 'Lead',
          synthConfig: { ...DEFAULT_SYNTH },
          notes: []
        }
      ]
    };
    addMusicTrack(newTrack);
    setSelectedId(newTrack.id);
  };

  const playTrack = (track: MusicTrackDef) => {
    if (audioCtx && audioCtx.state !== 'closed') {
      audioCtx.close().catch(() => {});
    }
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    setAudioCtx(ctx);
    setIsPlaying(true);
    
    const beatDuration = 60 / track.bpm;
    
    let maxTime = 0;

    track.channels.forEach(channel => {
      const masterGain = ctx.createGain();
      masterGain.gain.value = 1;
      applyEffects(ctx, channel.synthConfig, masterGain, ctx.destination);

      channel.notes.forEach(note => {
        if (channel.type === 'drum') {
          playDrumNote(ctx, note, masterGain, beatDuration);
        } else {
          playSynthNote(ctx, note, channel.synthConfig, masterGain, beatDuration);
        }

        if (note.time + note.duration > maxTime) {
          maxTime = note.time + note.duration;
        }
      });
    });
    
    startTimeRef.current = ctx.currentTime;
    const updatePlayhead = () => {
      if (ctx.state === 'closed') return;
      const currentBeat = (ctx.currentTime - startTimeRef.current!) / beatDuration;
      if (currentBeat > maxTime + 1) {
        setPlayheadTime(null);
        return;
      }
      setPlayheadTime(currentBeat);
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
    }, (maxTime * beatDuration + 2) * 1000); // 2 seconds padding
  };

  const stopTrack = () => {
    if (audioCtx && audioCtx.state !== 'closed') {
      audioCtx.close().catch(() => {});
      setAudioCtx(null);
    }
    setIsPlaying(false);
    setPlayheadTime(null);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  };

  const addChannel = (type: 'synth' | 'drum' = 'synth') => {
    if (!selectedTrack) return;
    const newChannel: MusicChannelDef = {
      id: `ch_${Date.now()}`,
      name: type === 'drum' ? `Drums ${selectedTrack.channels.length + 1}` : `Synth ${selectedTrack.channels.length + 1}`,
      type,
      synthConfig: { ...DEFAULT_SYNTH },
      notes: []
    };
    updateMusicTrack({
      ...selectedTrack,
      channels: [...selectedTrack.channels, newChannel]
    });
    setExpandedChannels(prev => ({ ...prev, [newChannel.id]: true }));
  };

  const updateChannel = (channelId: string, updates: Partial<MusicChannelDef>) => {
    if (!selectedTrack) return;
    updateMusicTrack({
      ...selectedTrack,
      channels: selectedTrack.channels.map(ch => ch.id === channelId ? { ...ch, ...updates } : ch)
    });
  };

  const deleteChannel = (channelId: string) => {
    if (!selectedTrack) return;
    updateMusicTrack({
      ...selectedTrack,
      channels: selectedTrack.channels.filter(ch => ch.id !== channelId)
    });
  };

  const toggleChannel = (channelId: string) => {
    setExpandedChannels(prev => ({ ...prev, [channelId]: !prev[channelId] }));
  };

  return (
    <div className="flex h-full bg-zinc-950 text-zinc-100">
      {/* Sidebar */}
      <div className="w-64 border-r border-zinc-800 flex flex-col bg-zinc-900/50">
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
          <h2 className="font-semibold text-zinc-100">Music Tracks</h2>
          <button onClick={handleAdd} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-emerald-400">
            <Plus size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {musicTracks.map(track => (
            <button
              key={track.id}
              onClick={() => setSelectedId(track.id)}
              className={`w-full text-left px-3 py-2 rounded text-sm ${selectedId === track.id ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
            >
              {track.name}
            </button>
          ))}
          {musicTracks.length === 0 && (
            <div className="text-center text-zinc-600 text-sm p-4">No tracks yet</div>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto p-8">
        {selectedTrack ? (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <input 
                  type="text" 
                  value={selectedTrack.name}
                  onChange={e => updateMusicTrack({ ...selectedTrack, name: e.target.value })}
                  className="bg-transparent text-2xl font-bold text-zinc-100 focus:outline-none border-b border-transparent focus:border-emerald-500"
                />
                <p className="text-sm text-zinc-500 font-mono">{selectedTrack.id}</p>
              </div>
              <div className="flex gap-4 items-center">
                <div className="flex items-center gap-2 bg-zinc-900/50 p-1 rounded border border-zinc-800">
                  <button onClick={() => setZoom(Math.max(20, zoom - 10))} className="p-1 text-zinc-400 hover:text-zinc-200"><ZoomOut size={16} /></button>
                  <span className="text-xs text-zinc-500 w-12 text-center">{zoom}px</span>
                  <button onClick={() => setZoom(Math.min(200, zoom + 10))} className="p-1 text-zinc-400 hover:text-zinc-200"><ZoomIn size={16} /></button>
                </div>
                <div className="flex gap-2">
                  {!isPlaying ? (
                    <button 
                      onClick={() => playTrack(selectedTrack)}
                      className="p-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded flex items-center gap-2"
                    >
                      <Play size={20} /> Play
                    </button>
                  ) : (
                    <button 
                      onClick={stopTrack}
                      className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded flex items-center gap-2"
                    >
                      <Square size={20} /> Stop
                    </button>
                  )}
                  <button 
                    onClick={() => { deleteMusicTrack(selectedTrack.id); setSelectedId(null); }}
                    className="p-2 text-red-400 hover:bg-red-400/10 rounded"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 border border-zinc-800 rounded bg-zinc-900/50">
              <div className="space-y-1">
                <label className="text-xs text-zinc-500 uppercase font-semibold">BPM (Beats Per Minute)</label>
                <input 
                  type="number" 
                  value={selectedTrack.bpm}
                  onChange={e => updateMusicTrack({ ...selectedTrack, bpm: Number(e.target.value) })}
                  className="w-32 bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-zinc-100">Channels</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => addChannel('synth')}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-sm flex items-center gap-2"
                  >
                    <Plus size={16} /> Add Synth
                  </button>
                  <button 
                    onClick={() => addChannel('drum')}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-sm flex items-center gap-2"
                  >
                    <Plus size={16} /> Add Drums
                  </button>
                </div>
              </div>

              {selectedTrack.channels.map(channel => (
                <div key={channel.id} className="border border-zinc-800 rounded bg-zinc-900/30 overflow-hidden">
                  <div 
                    className="flex items-center justify-between p-3 bg-zinc-900/80 cursor-pointer hover:bg-zinc-800 transition-colors"
                    onClick={() => toggleChannel(channel.id)}
                  >
                    <div className="flex items-center gap-2">
                      {expandedChannels[channel.id] ? <ChevronDown size={18} className="text-zinc-500" /> : <ChevronRight size={18} className="text-zinc-500" />}
                      <input 
                        type="text" 
                        value={channel.name}
                        onChange={e => updateChannel(channel.id, { name: e.target.value })}
                        onClick={e => e.stopPropagation()}
                        className="bg-transparent font-medium text-zinc-200 focus:outline-none border-b border-transparent focus:border-emerald-500"
                      />
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteChannel(channel.id); }}
                      className="p-1.5 text-zinc-500 hover:text-red-400 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {expandedChannels[channel.id] && (
                    <div className="p-4 border-t border-zinc-800 space-y-6">
                      {channel.type !== 'drum' && (
                        <div className="grid grid-cols-3 gap-6">
                          {/* Synth Config */}
                          <div className="space-y-4">
                            <h4 className="text-xs font-semibold text-zinc-500 uppercase">Synthesizer</h4>
                          
                          <div className="space-y-1">
                            <label className="text-[10px] text-zinc-500 uppercase">Oscillator Type</label>
                            <select 
                              value={channel.synthConfig.oscillatorType}
                              onChange={e => updateChannel(channel.id, { synthConfig: { ...channel.synthConfig, oscillatorType: e.target.value as any } })}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs focus:outline-none focus:border-emerald-500"
                            >
                              <option value="sine">Sine</option>
                              <option value="square">Square</option>
                              <option value="sawtooth">Sawtooth</option>
                              <option value="triangle">Triangle</option>
                            </select>
                          </div>

                          <div className="pt-2">
                            <Slider label="Volume" value={channel.synthConfig.volume} min={0} max={1} step={0.01} onChange={v => updateChannel(channel.id, { synthConfig: { ...channel.synthConfig, volume: v } })} />
                          </div>

                          <div className="grid grid-cols-2 gap-4 pt-2">
                            <Knob size={40} label="Attack" value={channel.synthConfig.envelope.attack} min={0} max={2} step={0.01} unit="s" onChange={v => updateChannel(channel.id, { synthConfig: { ...channel.synthConfig, envelope: { ...channel.synthConfig.envelope, attack: v } } })} />
                            <Knob size={40} label="Decay" value={channel.synthConfig.envelope.decay} min={0} max={2} step={0.01} unit="s" onChange={v => updateChannel(channel.id, { synthConfig: { ...channel.synthConfig, envelope: { ...channel.synthConfig.envelope, decay: v } } })} />
                            <Knob size={40} label="Sustain" value={channel.synthConfig.envelope.sustain} min={0} max={1} step={0.01} onChange={v => updateChannel(channel.id, { synthConfig: { ...channel.synthConfig, envelope: { ...channel.synthConfig.envelope, sustain: v } } })} />
                            <Knob size={40} label="Release" value={channel.synthConfig.envelope.release} min={0} max={5} step={0.01} unit="s" onChange={v => updateChannel(channel.id, { synthConfig: { ...channel.synthConfig, envelope: { ...channel.synthConfig.envelope, release: v } } })} />
                          </div>
                        </div>

                        {/* Filter Config */}
                        <div className="space-y-4">
                          <h4 className="text-xs font-semibold text-zinc-500 uppercase">Filter</h4>
                          
                          <div className="space-y-1">
                            <label className="text-[10px] text-zinc-500 uppercase">Filter Type</label>
                            <select 
                              value={channel.synthConfig.filterType}
                              onChange={e => updateChannel(channel.id, { synthConfig: { ...channel.synthConfig, filterType: e.target.value as any } })}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs focus:outline-none focus:border-emerald-500"
                            >
                              <option value="lowpass">Lowpass</option>
                              <option value="highpass">Highpass</option>
                              <option value="bandpass">Bandpass</option>
                            </select>
                          </div>

                          <div className="pt-2 space-y-4">
                            <Slider label="Cutoff" value={channel.synthConfig.filterCutoff} min={20} max={20000} step={1} unit="Hz" onChange={v => updateChannel(channel.id, { synthConfig: { ...channel.synthConfig, filterCutoff: v } })} />
                            <Slider label="Resonance" value={channel.synthConfig.filterResonance} min={0} max={20} step={0.1} onChange={v => updateChannel(channel.id, { synthConfig: { ...channel.synthConfig, filterResonance: v } })} />
                          </div>
                        </div>

                        {/* Effects Config */}
                        <div className="space-y-4">
                          <h4 className="text-xs font-semibold text-zinc-500 uppercase">Effects</h4>
                          
                          <div className="space-y-2">
                            <div className="border-b border-zinc-800/50 pb-2">
                              <div className="text-[10px] text-zinc-500 uppercase font-semibold mb-1">Delay</div>
                              <div className="grid grid-cols-3 gap-1">
                                <Knob size={32} label="Time" value={channel.synthConfig.delay?.time || 0} min={0} max={1} step={0.01} unit="s" onChange={v => updateChannel(channel.id, { synthConfig: { ...channel.synthConfig, delay: { ...(channel.synthConfig.delay || { feedback: 0, mix: 0 }), time: v } } })} />
                                <Knob size={32} label="F.Back" value={channel.synthConfig.delay?.feedback || 0} min={0} max={0.9} step={0.01} onChange={v => updateChannel(channel.id, { synthConfig: { ...channel.synthConfig, delay: { ...(channel.synthConfig.delay || { time: 0, mix: 0 }), feedback: v } } })} />
                                <Knob size={32} label="Mix" value={channel.synthConfig.delay?.mix || 0} min={0} max={1} step={0.01} onChange={v => updateChannel(channel.id, { synthConfig: { ...channel.synthConfig, delay: { ...(channel.synthConfig.delay || { time: 0, feedback: 0 }), mix: v } } })} />
                              </div>
                            </div>

                            <div className="border-b border-zinc-800/50 pb-2">
                              <div className="text-[10px] text-zinc-500 uppercase font-semibold mb-1">Reverb</div>
                              <div className="grid grid-cols-2 gap-1">
                                <Knob size={32} label="Decay" value={channel.synthConfig.reverb?.decay || 0} min={0.1} max={10} step={0.1} unit="s" onChange={v => updateChannel(channel.id, { synthConfig: { ...channel.synthConfig, reverb: { ...(channel.synthConfig.reverb || { mix: 0 }), decay: v } } })} />
                                <Knob size={32} label="Mix" value={channel.synthConfig.reverb?.mix || 0} min={0} max={1} step={0.01} onChange={v => updateChannel(channel.id, { synthConfig: { ...channel.synthConfig, reverb: { ...(channel.synthConfig.reverb || { decay: 2 }), mix: v } } })} />
                              </div>
                            </div>

                            <div className="border-b border-zinc-800/50 pb-2">
                              <div className="text-[10px] text-zinc-500 uppercase font-semibold mb-1">Distortion</div>
                              <Slider label="Amount" value={channel.synthConfig.distortion?.amount || 0} min={0} max={100} step={1} onChange={v => updateChannel(channel.id, { synthConfig: { ...channel.synthConfig, distortion: { amount: v } } })} />
                            </div>

                            <div>
                              <div className="text-[10px] text-zinc-500 uppercase font-semibold mb-1">Flanger</div>
                              <div className="grid grid-cols-3 gap-1">
                                <Knob size={32} label="Speed" value={channel.synthConfig.flanger?.speed || 0} min={0.1} max={10} step={0.1} unit="Hz" onChange={v => updateChannel(channel.id, { synthConfig: { ...channel.synthConfig, flanger: { ...(channel.synthConfig.flanger || { depth: 0, mix: 0 }), speed: v } } })} />
                                <Knob size={32} label="Depth" value={channel.synthConfig.flanger?.depth || 0} min={0} max={1} step={0.01} onChange={v => updateChannel(channel.id, { synthConfig: { ...channel.synthConfig, flanger: { ...(channel.synthConfig.flanger || { speed: 0.1, mix: 0 }), depth: v } } })} />
                                <Knob size={32} label="Mix" value={channel.synthConfig.flanger?.mix || 0} min={0} max={1} step={0.01} onChange={v => updateChannel(channel.id, { synthConfig: { ...channel.synthConfig, flanger: { ...(channel.synthConfig.flanger || { speed: 0.1, depth: 0 }), mix: v } } })} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                      {/* Notes */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-semibold text-zinc-500 uppercase">{channel.type === 'drum' ? 'Step Sequencer' : 'Piano Roll (Beats)'}</h4>
                        </div>
                        
                        <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                          {channel.type === 'drum' ? (
                            <StepSequencer 
                              notes={channel.notes} 
                              onChange={notes => updateChannel(channel.id, { notes })} 
                              duration={Math.max(16, Math.ceil(Math.max(...channel.notes.map(n => n.time + n.duration), 0)) + 4)} 
                              playheadTime={playheadTime}
                              pixelsPerUnit={zoom}
                            />
                          ) : (
                            <PianoRoll 
                              notes={channel.notes} 
                              onChange={notes => updateChannel(channel.id, { notes })} 
                              duration={Math.max(16, Math.ceil(Math.max(...channel.notes.map(n => n.time + n.duration), 0)) + 4)} 
                              minPitch={24}
                              maxPitch={96}
                              pixelsPerUnit={zoom} // Dynamic zoom
                              snapStep={0.25} // Snap to 16th notes (0.25 beats)
                              playheadTime={playheadTime}
                              height={300}
                            />
                          )}
                        </div>
                        <div className="text-[10px] text-zinc-500">
                          {channel.type === 'drum' 
                            ? 'Click to toggle drum hits.' 
                            : 'Click to add note. Drag to move. Drag right edge to resize. Right-click to delete.'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-500">
            Select or create a music track to edit
          </div>
        )}
      </div>
    </div>
  );
}
