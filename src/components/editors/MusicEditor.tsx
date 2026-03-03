import React, { useState } from 'react';
import { useGameStore } from '../../store';
import { MusicTrackDef, MusicChannelDef, SynthConfig, NoteDef } from '../../types';
import { Plus, Trash2, Play, Square, ChevronDown, ChevronRight } from 'lucide-react';

const DEFAULT_SYNTH: SynthConfig = {
  oscillatorType: 'square',
  envelope: { attack: 0.01, decay: 0.1, sustain: 0.2, release: 0.1 },
  volume: 0.3,
  filterType: 'lowpass',
  filterCutoff: 2000,
  filterResonance: 1
};

export default function MusicEditor() {
  const { gameData, addMusicTrack, updateMusicTrack, deleteMusicTrack } = useGameStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedChannels, setExpandedChannels] = useState<Record<string, boolean>>({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);
  
  const musicTracks = gameData.musicTracks || [];
  const selectedTrack = musicTracks.find(t => t.id === selectedId);

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
      channel.notes.forEach(note => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        osc.type = channel.synthConfig.oscillatorType;
        osc.frequency.value = 440 * Math.pow(2, (note.pitch - 69) / 12);
        
        filter.type = channel.synthConfig.filterType;
        filter.frequency.value = channel.synthConfig.filterCutoff;
        filter.Q.value = channel.synthConfig.filterResonance;
        
        const startTime = ctx.currentTime + (note.time * beatDuration);
        const duration = note.duration * beatDuration;
        const env = channel.synthConfig.envelope;
        
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(channel.synthConfig.volume * note.velocity, startTime + env.attack);
        gain.gain.linearRampToValueAtTime(channel.synthConfig.volume * note.velocity * env.sustain, startTime + env.attack + env.decay);
        gain.gain.setValueAtTime(channel.synthConfig.volume * note.velocity * env.sustain, startTime + duration);
        gain.gain.linearRampToValueAtTime(0, startTime + duration + env.release);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(startTime);
        osc.stop(startTime + duration + env.release);

        if (note.time + note.duration > maxTime) {
          maxTime = note.time + note.duration;
        }
      });
    });
    
    setTimeout(() => {
      setIsPlaying(false);
      if (ctx.state !== 'closed') {
        ctx.close().catch(() => {});
      }
      setAudioCtx(null);
    }, (maxTime * beatDuration + 2) * 1000); // 2 seconds padding
  };

  const stopTrack = () => {
    if (audioCtx && audioCtx.state !== 'closed') {
      audioCtx.close().catch(() => {});
      setAudioCtx(null);
    }
    setIsPlaying(false);
  };

  const addChannel = () => {
    if (!selectedTrack) return;
    const newChannel: MusicChannelDef = {
      id: `ch_${Date.now()}`,
      name: `Channel ${selectedTrack.channels.length + 1}`,
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
                <button 
                  onClick={addChannel}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-sm flex items-center gap-2"
                >
                  <Plus size={16} /> Add Channel
                </button>
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
                      <div className="grid grid-cols-2 gap-6">
                        {/* Synth Config */}
                        <div className="space-y-4">
                          <h4 className="text-xs font-semibold text-zinc-500 uppercase">Synthesizer</h4>
                          
                          <div className="grid grid-cols-2 gap-4">
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
                            <div className="space-y-1">
                              <label className="text-[10px] text-zinc-500 uppercase">Volume</label>
                              <input type="range" min="0" max="1" step="0.05" value={channel.synthConfig.volume} onChange={e => updateChannel(channel.id, { synthConfig: { ...channel.synthConfig, volume: Number(e.target.value) } })} className="w-full" />
                            </div>
                          </div>

                          <div className="grid grid-cols-4 gap-2">
                            <div className="space-y-1">
                              <label className="text-[10px] text-zinc-500 uppercase">Attack (s)</label>
                              <input type="number" step="0.01" value={channel.synthConfig.envelope.attack} onChange={e => updateChannel(channel.id, { synthConfig: { ...channel.synthConfig, envelope: { ...channel.synthConfig.envelope, attack: Number(e.target.value) } } })} className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-zinc-500 uppercase">Decay (s)</label>
                              <input type="number" step="0.01" value={channel.synthConfig.envelope.decay} onChange={e => updateChannel(channel.id, { synthConfig: { ...channel.synthConfig, envelope: { ...channel.synthConfig.envelope, decay: Number(e.target.value) } } })} className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-zinc-500 uppercase">Sustain</label>
                              <input type="number" step="0.1" value={channel.synthConfig.envelope.sustain} onChange={e => updateChannel(channel.id, { synthConfig: { ...channel.synthConfig, envelope: { ...channel.synthConfig.envelope, sustain: Number(e.target.value) } } })} className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-zinc-500 uppercase">Release (s)</label>
                              <input type="number" step="0.01" value={channel.synthConfig.envelope.release} onChange={e => updateChannel(channel.id, { synthConfig: { ...channel.synthConfig, envelope: { ...channel.synthConfig.envelope, release: Number(e.target.value) } } })} className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs" />
                            </div>
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

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] text-zinc-500 uppercase">Cutoff (Hz)</label>
                              <input type="number" value={channel.synthConfig.filterCutoff} onChange={e => updateChannel(channel.id, { synthConfig: { ...channel.synthConfig, filterCutoff: Number(e.target.value) } })} className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-zinc-500 uppercase">Resonance (Q)</label>
                              <input type="number" step="0.1" value={channel.synthConfig.filterResonance} onChange={e => updateChannel(channel.id, { synthConfig: { ...channel.synthConfig, filterResonance: Number(e.target.value) } })} className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Notes */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-semibold text-zinc-500 uppercase">Notes (Beats)</h4>
                          <button 
                            onClick={() => {
                              const lastNote = channel.notes[channel.notes.length - 1];
                              const newTime = lastNote ? lastNote.time + lastNote.duration : 0;
                              const newNotes = [...channel.notes, { pitch: 60, time: newTime, duration: 1, velocity: 1 }];
                              updateChannel(channel.id, { notes: newNotes });
                            }}
                            className="text-[10px] bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded text-zinc-300"
                          >
                            + Add Note
                          </button>
                        </div>
                        
                        <div className="space-y-1 max-h-64 overflow-y-auto pr-2">
                          {channel.notes.map((note, idx) => (
                            <div key={idx} className="flex gap-2 items-center bg-zinc-950 p-2 rounded border border-zinc-800/50">
                              <div className="w-6 text-[10px] text-zinc-500 text-center">#{idx+1}</div>
                              <div className="flex-1 flex gap-2">
                                <div className="flex-1">
                                  <label className="text-[8px] text-zinc-600 uppercase block mb-0.5">Pitch (MIDI)</label>
                                  <input type="number" value={note.pitch} onChange={e => {
                                    const newNotes = [...channel.notes];
                                    newNotes[idx].pitch = Number(e.target.value);
                                    updateChannel(channel.id, { notes: newNotes });
                                  }} className="w-full bg-zinc-900 border border-zinc-800 rounded px-1.5 py-1 text-xs" />
                                </div>
                                <div className="flex-1">
                                  <label className="text-[8px] text-zinc-600 uppercase block mb-0.5">Start (Beats)</label>
                                  <input type="number" step="0.25" value={note.time} onChange={e => {
                                    const newNotes = [...channel.notes];
                                    newNotes[idx].time = Number(e.target.value);
                                    updateChannel(channel.id, { notes: newNotes });
                                  }} className="w-full bg-zinc-900 border border-zinc-800 rounded px-1.5 py-1 text-xs" />
                                </div>
                                <div className="flex-1">
                                  <label className="text-[8px] text-zinc-600 uppercase block mb-0.5">Duration (Beats)</label>
                                  <input type="number" step="0.25" value={note.duration} onChange={e => {
                                    const newNotes = [...channel.notes];
                                    newNotes[idx].duration = Number(e.target.value);
                                    updateChannel(channel.id, { notes: newNotes });
                                  }} className="w-full bg-zinc-900 border border-zinc-800 rounded px-1.5 py-1 text-xs" />
                                </div>
                              </div>
                              <button 
                                onClick={() => {
                                  const newNotes = channel.notes.filter((_, i) => i !== idx);
                                  updateChannel(channel.id, { notes: newNotes });
                                }}
                                className="p-1 text-zinc-500 hover:text-red-400 mt-3"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                          {channel.notes.length === 0 && (
                            <div className="text-center text-zinc-600 text-xs py-2">No notes in this channel</div>
                          )}
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
