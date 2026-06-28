import { TTSModule, ModuleType } from '../../include/types';
import { PuterService } from '../kernel/PuterService';

/**
 * PuterTTS: Text-to-Speech via Puter.js Infrastructure.
 */
export const PuterTTS: TTSModule = {
  metadata: {
    id: 'puter-tts',
    name: 'Puter TTS (Cloud)',
    description: 'Cloud-based TTS provided by Puter.js Infrastructure.',
    version: '1.2.0',
    type: ModuleType.TTS,
    order: 5,
    configSchema: {
      fields: {
        provider: {
          type: 'select',
          label: 'Voice Provider Filter (Puter)',
          default: 'all',
          dynamicOptions: true,
          options: [
            { label: 'All Providers', value: 'all' }
          ]
        },
        voice: {
          type: 'select',
          label: 'Voice Pattern',
          default: 'en-US-1',
          dynamicOptions: true,
          options: [
            { label: 'English (US) - 1', value: 'en-US-1' },
            { label: 'English (US) - 2', value: 'en-US-2' },
            { label: 'English (UK) - 1', value: 'en-GB-1' },
            { label: 'Japanese - 1', value: 'ja-JP-1' },
            { label: 'Indonesian - 1', value: 'id-ID-1' }
          ]
        },
        animeMode: {
          type: 'boolean',
          label: 'Cute Anime Mode (High Pitch)',
          default: true,
          description: 'Makin imut ala anime girl dengan meningkatkan tinggi pitch & keceriaan.'
        },
        speedBoost: {
          type: 'slider',
          label: 'Anime Speed & Pitch Boost',
          default: 1.15,
          min: 1.0,
          max: 1.45,
          step: 0.05,
          description: 'Tingkatkan kecepatan dan ketinggian vokal agar terdengar lebih imut.'
        },
        token: {
          type: 'password',
          label: 'Puter Auth Token (Optional)',
          description: 'Uses global token if empty.'
        }
      }
    }
  },

  speak: async (text: string, config: any) => {
    try {
      let audioUrl = '';
      const voice = config.voice || 'en-US-1';
      const animeMode = config.animeMode !== false; // default to true
      const speedBoost = parseFloat(config.speedBoost) || 1.15;

      if (typeof window !== 'undefined') {
        const res = await fetch('/api/puter/txt2speech', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, voice, options: config })
        });
        if (res.ok) {
          const json = await res.json();
          if (json && json.success && json.url) {
            audioUrl = json.url;
          }
        }
      }

      // Server-side/dynamic fallback
      if (!audioUrl) {
        const puterService = PuterService.getInstance();
        const result = await puterService.txt2speech(text, voice, config);
        if (result && result.success && result.url) {
          audioUrl = result.url;
        }
      }

      if (audioUrl) {
        const audio = new Audio(audioUrl);
        
        if (animeMode) {
          // Disable default browser pitch preservation to let pitch naturally rise with playbackRate
          (audio as any).preservesPitch = false;
          (audio as any).mozPreservesPitch = false;
          (audio as any).webkitPreservesPitch = false;
          audio.playbackRate = speedBoost;
        }

        // Hook up real-time audio analysis
        try {
          const { SpeechService } = await import('../speech');
          SpeechService.analyzeAudioStream(audio);
        } catch (err) {
          console.warn('[PUTER-TTS] Audio analysis binding failed:', err);
        }
 
        await audio.play();
        return new Promise<void>((resolve) => {
          audio.onended = () => resolve();
          audio.onerror = () => resolve();
        });
      }
    } catch (e) {
      console.error('[PUTER-TTS] Error native speak:', e);
      // Fallback
    }
  },

  getDynamicOptions: async (fieldName: string, config: any) => {
    if (fieldName === 'provider') {
      try {
        if (typeof window !== 'undefined') {
          const res = await fetch('/api/puter/speech/engines');
          if (res.ok) {
            const engines = await res.json();
            if (engines && engines.length > 0) {
              const formatted = engines.map((e: any) => ({
                label: e.name || e.id || '',
                value: e.id || ''
              }));
              return [{ label: 'All Providers', value: 'all' }, ...formatted];
            }
          }
        }
        return [
          { label: 'All Providers', value: 'all' },
          { label: 'OpenAI TTS', value: 'openai' },
          { label: 'ElevenLabs', value: 'elevenlabs' }
        ];
      } catch (err) {
        return [
          { label: 'All Providers', value: 'all' },
          { label: 'OpenAI TTS', value: 'openai' },
          { label: 'ElevenLabs', value: 'elevenlabs' }
        ];
      }
    }
    if (fieldName === 'voice') {
      try {
        const selectedProvider = config?.provider === 'all' ? undefined : (config?.provider || undefined);
        if (typeof window !== 'undefined') {
          const query = selectedProvider ? `?provider=${encodeURIComponent(selectedProvider)}` : '';
          const res = await fetch(`/api/puter/speech/voices${query}`);
          if (res.ok) {
            const voices = await res.json();
            if (voices && voices.length > 0) {
              return voices.map((v: any) => ({
                label: `${v.provider ? v.provider.toUpperCase() + ': ' : ''}${v.name || v.id} (${v.gender || 'unknown'})`,
                value: v.id || v.name
              }));
            }
          }
        }
        const staticVoices = [
          { label: 'English (US) - 1', value: 'en-US-1' },
          { label: 'English (US) - 2', value: 'en-US-2' },
          { label: 'English (UK) - 1', value: 'en-GB-1' },
          { label: 'Japanese - 1', value: 'ja-JP-1' },
          { label: 'Indonesian - 1', value: 'id-ID-1' }
        ];
        return staticVoices;
      } catch (err) {
        return [
          { label: 'English (US) - 1', value: 'en-US-1' },
          { label: 'English (US) - 2', value: 'en-US-2' },
          { label: 'English (UK) - 1', value: 'en-GB-1' },
          { label: 'Japanese - 1', value: 'ja-JP-1' },
          { label: 'Indonesian - 1', value: 'id-ID-1' }
        ];
      }
    }
    return [];
  }
};
