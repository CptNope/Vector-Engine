import { SynthConfig, NoteDef } from '../types';

export function createAudioContext() {
  return new (window.AudioContext || (window as any).webkitAudioContext)();
}

// Helper to create a simple reverb impulse response
function createReverbBuffer(ctx: AudioContext, duration: number): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * duration;
  const impulse = ctx.createBuffer(2, length, sampleRate);
  const left = impulse.getChannelData(0);
  const right = impulse.getChannelData(1);
  for (let i = 0; i < length; i++) {
    const decay = Math.exp(-i / (sampleRate * (duration / 3)));
    left[i] = (Math.random() * 2 - 1) * decay;
    right[i] = (Math.random() * 2 - 1) * decay;
  }
  return impulse;
}

export function applyEffects(ctx: AudioContext, synthConfig: SynthConfig, inputNode: AudioNode, outputNode: AudioNode) {
  let currentNode = inputNode;

  // Distortion
  if (synthConfig.distortion && synthConfig.distortion.amount > 0) {
    const waveShaper = ctx.createWaveShaper();
    waveShaper.curve = makeDistortionCurve(synthConfig.distortion.amount);
    waveShaper.oversample = '4x';
    currentNode.connect(waveShaper);
    currentNode = waveShaper;
  }

  // Delay
  if (synthConfig.delay && synthConfig.delay.mix > 0) {
    const delayNode = ctx.createDelay();
    delayNode.delayTime.value = synthConfig.delay.time;
    
    const feedbackNode = ctx.createGain();
    feedbackNode.gain.value = synthConfig.delay.feedback;
    
    const delayMixNode = ctx.createGain();
    delayMixNode.gain.value = synthConfig.delay.mix;
    
    const dryMixNode = ctx.createGain();
    dryMixNode.gain.value = 1 - synthConfig.delay.mix;

    // Dry path
    currentNode.connect(dryMixNode);
    dryMixNode.connect(outputNode);

    // Wet path
    currentNode.connect(delayNode);
    delayNode.connect(feedbackNode);
    feedbackNode.connect(delayNode);
    delayNode.connect(delayMixNode);
    delayMixNode.connect(outputNode);

    // We don't want to chain delay into reverb directly unless we want to, but for simplicity, 
    // we'll just connect both dry and wet to the next stage.
    // Actually, it's easier to use a master wet/dry for each effect.
    
    // To chain properly:
    const nextStage = ctx.createGain();
    dryMixNode.disconnect();
    delayMixNode.disconnect();
    dryMixNode.connect(nextStage);
    delayMixNode.connect(nextStage);
    currentNode = nextStage;
  }

  // Reverb (Simple implementation using multiple delays or convolver)
  if (synthConfig.reverb && synthConfig.reverb.mix > 0) {
    // A real reverb needs an impulse response. We'll use a simple convolver with generated noise.
    const convolver = ctx.createConvolver();
    convolver.buffer = createReverbBuffer(ctx, synthConfig.reverb.decay);
    
    const reverbMixNode = ctx.createGain();
    reverbMixNode.gain.value = synthConfig.reverb.mix;
    
    const dryMixNode = ctx.createGain();
    dryMixNode.gain.value = 1 - synthConfig.reverb.mix;

    currentNode.connect(dryMixNode);
    currentNode.connect(convolver);
    convolver.connect(reverbMixNode);

    const nextStage = ctx.createGain();
    dryMixNode.connect(nextStage);
    reverbMixNode.connect(nextStage);
    currentNode = nextStage;
  }

  // Flanger
  if (synthConfig.flanger && synthConfig.flanger.mix > 0) {
    const flangerDelay = ctx.createDelay();
    flangerDelay.delayTime.value = 0.005; // Base delay 5ms
    
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = synthConfig.flanger.speed;
    
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = synthConfig.flanger.depth * 0.005;
    
    lfo.connect(lfoGain);
    lfoGain.connect(flangerDelay.delayTime);
    lfo.start();
    
    const feedback = ctx.createGain();
    feedback.gain.value = 0.5;
    
    const wetGain = ctx.createGain();
    wetGain.gain.value = synthConfig.flanger.mix;
    
    const dryGain = ctx.createGain();
    dryGain.gain.value = 1 - synthConfig.flanger.mix;
    
    currentNode.connect(dryGain);
    currentNode.connect(flangerDelay);
    flangerDelay.connect(feedback);
    feedback.connect(flangerDelay);
    flangerDelay.connect(wetGain);
    
    const nextStage = ctx.createGain();
    dryGain.connect(nextStage);
    wetGain.connect(nextStage);
    currentNode = nextStage;
  }

  currentNode.connect(outputNode);
}

function makeDistortionCurve(amount: number) {
  const k = typeof amount === 'number' ? amount : 50;
  const n_samples = 44100;
  const curve = new Float32Array(n_samples);
  const deg = Math.PI / 180;
  let x;
  for (let i = 0; i < n_samples; ++i) {
    x = (i * 2) / n_samples - 1;
    curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
  }
  return curve;
}

export function playSynthNote(ctx: AudioContext, note: NoteDef, synthConfig: SynthConfig, destination: AudioNode, timeScale: number = 1) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  
  osc.type = synthConfig.oscillatorType;
  osc.frequency.value = 440 * Math.pow(2, (note.pitch - 69) / 12);
  
  filter.type = synthConfig.filterType;
  filter.frequency.value = synthConfig.filterCutoff;
  filter.Q.value = synthConfig.filterResonance;
  
  const t = ctx.currentTime + (note.time * timeScale);
  const duration = note.duration * timeScale;
  const env = synthConfig.envelope;
  
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(synthConfig.volume * note.velocity, t + env.attack);
  gain.gain.linearRampToValueAtTime(synthConfig.volume * note.velocity * env.sustain, t + env.attack + env.decay);
  gain.gain.setValueAtTime(synthConfig.volume * note.velocity * env.sustain, t + duration);
  gain.gain.linearRampToValueAtTime(0, t + duration + env.release);
  
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(destination);
  
  osc.start(t);
  osc.stop(t + duration + env.release);
  
  return osc;
}

export function playDrumNote(ctx: AudioContext, note: NoteDef, destination: AudioNode, timeScale: number = 1) {
  const t = ctx.currentTime + (note.time * timeScale);
  const vol = note.velocity;
  const oscs: AudioScheduledSourceNode[] = [];

  if (note.pitch === 36) {
    // Kick
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(0.01, t + 0.5);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
    osc.connect(gain);
    gain.connect(destination);
    osc.start(t);
    osc.stop(t + 0.5);
    oscs.push(osc);
  } else if (note.pitch === 38) {
    // Snare
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(250, t);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
    
    const noise = createNoise(ctx);
    const noiseFilter = ctx.createBiquadFilter();
    const noiseGain = ctx.createGain();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1000;
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.gain.setValueAtTime(vol, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
    
    osc.connect(gain);
    gain.connect(destination);
    noiseGain.connect(destination);
    
    osc.start(t);
    noise.start(t);
    osc.stop(t + 0.2);
    noise.stop(t + 0.2);
    oscs.push(osc, noise);
  } else if (note.pitch === 42 || note.pitch === 46) {
    // Hi-hat (42 = closed, 46 = open)
    const isClosed = note.pitch === 42;
    const duration = isClosed ? 0.1 : 0.3;
    const noise = createNoise(ctx);
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    
    filter.type = 'highpass';
    filter.frequency.value = 7000;
    
    gain.gain.setValueAtTime(vol * 0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + duration);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(destination);
    
    noise.start(t);
    noise.stop(t + duration);
    oscs.push(noise);
  } else if (note.pitch === 45 || note.pitch === 50) {
    // Tom
    const isHigh = note.pitch === 50;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(isHigh ? 200 : 100, t);
    osc.frequency.exponentialRampToValueAtTime(0.01, t + 0.4);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
    osc.connect(gain);
    gain.connect(destination);
    osc.start(t);
    osc.stop(t + 0.4);
    oscs.push(osc);
  } else {
    // Fallback synth blip
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = 440 * Math.pow(2, (note.pitch - 69) / 12);
    gain.gain.setValueAtTime(vol * 0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
    osc.connect(gain);
    gain.connect(destination);
    osc.start(t);
    osc.stop(t + 0.1);
    oscs.push(osc);
  }
  
  return oscs;
}

function createNoise(ctx: AudioContext) {
  const bufferSize = ctx.sampleRate * 2; // 2 seconds
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  return noise;
}
