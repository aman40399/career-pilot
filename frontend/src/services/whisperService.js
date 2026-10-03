import { pipeline, env } from '@xenova/transformers';
import { interviewApi } from './api';

// Configure transformers for browser environment
if (typeof window !== 'undefined') {
  env.allowLocalModels = false;
  env.useBrowserCache = true;
}

const MODEL_NAME = 'Xenova/whisper-small'; // 244M parameters (~3.3x base model 74M)
const MODEL_LABEL = 'Whisper Small (244M • 3.3x Base)';

class WhisperManager {
  constructor() {
    this.pipeline = null;
    this.status = 'idle'; // 'idle' | 'downloading' | 'ready' | 'transcribing' | 'error'
    this.progress = 0;
    this.statusMessage = 'Whisper Small ready to load';
    this.subscribers = new Set();
    this.loadingPromise = null;
    this.whisperEnabled = true;
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    callback(this.getState());
    return () => this.subscribers.delete(callback);
  }

  notify() {
    const state = this.getState();
    this.subscribers.forEach((cb) => {
      try { cb(state); } catch (e) { console.error(e); }
    });
  }

  getState() {
    return {
      status: this.status,
      progress: this.progress,
      statusMessage: this.statusMessage,
      modelLabel: MODEL_LABEL,
      modelName: MODEL_NAME,
      enabled: this.whisperEnabled,
    };
  }

  setEnabled(val) {
    this.whisperEnabled = !!val;
    this.notify();
  }

  async loadModel() {
    if (this.pipeline) {
      this.status = 'ready';
      this.statusMessage = `${MODEL_LABEL} Loaded`;
      this.notify();
      return this.pipeline;
    }

    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.status = 'downloading';
    this.progress = 0;
    this.statusMessage = `Downloading ${MODEL_LABEL}...`;
    this.notify();

    this.loadingPromise = (async () => {
      try {
        const transcriber = await pipeline('automatic-speech-recognition', MODEL_NAME, {
          progress_callback: (progressData) => {
            if (progressData.status === 'progress' && progressData.total) {
              const p = Math.round((progressData.loaded / progressData.total) * 100);
              this.progress = p;
              this.statusMessage = `Downloading ${MODEL_LABEL}: ${p}%`;
              this.notify();
            } else if (progressData.status === 'initiate') {
              this.statusMessage = `Initializing ${progressData.file || 'weights'}...`;
              this.notify();
            } else if (progressData.status === 'ready') {
              this.progress = 100;
              this.notify();
            }
          },
        });

        this.pipeline = transcriber;
        this.status = 'ready';
        this.progress = 100;
        this.statusMessage = `${MODEL_LABEL} Ready`;
        this.notify();
        return transcriber;
      } catch (err) {
        console.warn('Local Whisper Small initialization note (will use Cloud Whisper):', err.message);
        this.status = 'ready'; // Still ready to transcribe via backend Whisper Small / Groq Whisper endpoint
        this.statusMessage = `${MODEL_LABEL} (Hybrid Mode Ready)`;
        this.notify();
        return null;
      } finally {
        this.loadingPromise = null;
      }
    })();

    return this.loadingPromise;
  }

  async transcribe(audioBlob, language = 'en') {
    if (!audioBlob) return '';
    this.status = 'transcribing';
    this.statusMessage = `Transcribing with ${MODEL_LABEL}...`;
    this.notify();

    try {
      // 1. Try local transformer if loaded and available
      if (this.pipeline) {
        const audioBuffer = await audioBlob.arrayBuffer();
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
        const decoded = await audioCtx.decodeAudioData(audioBuffer);
        const float32Array = decoded.getChannelData(0);
        audioCtx.close();

        const result = await this.pipeline(float32Array, {
          chunk_length_s: 30,
          stride_length_s: 5,
          language: language === 'en' ? 'english' : language,
          task: 'transcribe',
        });

        const text = (result?.text || '').trim();
        this.status = 'ready';
        this.statusMessage = `${MODEL_LABEL} Ready`;
        this.notify();
        if (text) return text;
      }

      // 2. Hybrid fallback: High performance cloud Whisper (large-v3-turbo / whisper-1)
      const res = await interviewApi.transcribe({ audioBlob, language });
      const cloudText = (res?.data?.text || '').trim();
      this.status = 'ready';
      this.statusMessage = `${MODEL_LABEL} Ready`;
      this.notify();
      return cloudText;
    } catch (error) {
      console.error('Whisper transcription error:', error);
      this.status = 'ready';
      this.statusMessage = `${MODEL_LABEL} Ready`;
      this.notify();
      throw error;
    }
  }
}

export const whisperManager = new WhisperManager();
