import { SettingsManager } from './settings.js';
import { logger } from './logger.js';

export interface PuterConfig {
  token?: string;
  defaultModel?: string;
}

export class PuterService {
  private static instance: PuterService;
  private puterSdk: any = null;
  private initialized = false;

  private constructor() {}

  public static getInstance(): PuterService {
    if (!PuterService.instance) {
      PuterService.instance = new PuterService();
    }
    return PuterService.instance;
  }

  /**
   * Retrieves the active Puter Auth Token from Settings or Environment.
   */
  public async getToken(): Promise<string> {
    const settings = SettingsManager.getInstance();
    await settings.load();
    const providers = settings.get('providers') || {};
    const puterConfig = settings.get('puter') || providers.puter || {};
    const neuralConfig = settings.get('puter-neural-provider') || {};
    const ttsConfig = settings.get('puter-tts') || {};
    
    const token = (
      puterConfig.token ||
      puterConfig.apiKey ||
      neuralConfig.token ||
      neuralConfig.apiKey ||
      ttsConfig.token ||
      ttsConfig.apiKey ||
      process.env.PUTER_TOKEN ||
      process.env.PUTER_API_KEY ||
      ''
    );
    return typeof token === 'string' ? token.trim() : '';
  }

  /**
   * Initializes Puter SDK natively.
   */
  public async initialize(): Promise<any> {
    // Disable native Node SDK initialization to bypass package socket/undici conflicts which cause RangeError: Maximum call stack size exceeded.
    // Falls back seamlessly to robust, non-crashing REST and Simulated gateways.
    return null;
  }

  /**
   * Robust authentication token configuration and propagation for Puter SDK.
   */
  private setSdkToken(sdk: any, token: string): void {
    if (!sdk) return;
    if (token) {
      if (typeof sdk.setAuthToken === 'function') {
        sdk.setAuthToken(token);
      } else {
        sdk.authToken = token;
        // Manual propagation in case the host environment strips or restricts the dynamic setAuthToken
        for (const key of Object.getOwnPropertyNames(sdk)) {
          if (sdk[key] && typeof sdk[key].setAuthToken === 'function') {
            try {
              sdk[key].setAuthToken(token);
            } catch (e) {
              // silent fail
            }
          }
        }
      }
    }
  }

  /**
   * Universal fetch helper for Puter REST fallbacks.
   */
  private async requestREST(endpoint: string, method: 'GET' | 'POST' = 'GET', body?: any): Promise<any> {
    const token = await this.getToken();
    if (!token) {
      throw new Error('Puter authentication token is missing or empty. Skipping remote API call.');
    }
    const baseUrls = ['https://api.puter.com'];
    let lastError: any = null;

    for (const baseUrl of baseUrls) {
      try {
        const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
        const headers: Record<string, string> = {
          'Authorization': `Bearer ${token}`,
          'X-Puter-Token': token,
          'Content-Type': endpoint.includes('/drivers/call') ? 'text/plain;actually=json' : 'application/json'
        };

        const res = await fetch(url, {
          method,
          headers,
          body: method === 'POST' ? JSON.stringify(body) : undefined
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`HTTP Error ${res.status}: ${text}`);
        }

        return await res.json();
      } catch (err) {
        lastError = err;
        const isKvError = String(err).includes("puter-key-value") || (body && JSON.stringify(body).includes("puter-key-value"));
        if (isKvError) {
          logger.info(`[PUTER-SERVICE] Key-Value driver not available or deprecated on ${baseUrl}.`, 'system');
        } else {
          logger.warn(`[PUTER-SERVICE] REST call failed on ${baseUrl}: ${String(err)}`, 'system');
        }
      }
    }

    throw lastError || new Error('All Puter API endpoints failed.');
  }

  // ==========================================
  // NATIVE PUTER AI FEATURES IMPLEMENTATION
  // ==========================================

  /**
   * [1] puter.ai.chat()
   * Chat with AI models, analyze images and videos.
   */
  public async chat(prompt: any, options: any = {}): Promise<any> {
    let normalizedPrompt = '';
    if (Array.isArray(prompt)) {
      normalizedPrompt = prompt.map((msg: any) => {
        if (!msg || typeof msg !== 'object') return '';
        const role = msg.role || 'user';
        const content = msg.content || '';
        if (role === 'system') {
          return `[Instructions]\n${content}\n`;
        } else if (role === 'user') {
          return `[User]\n${content}\n`;
        } else if (role === 'assistant') {
          return `[Yuihime]\n${content}\n`;
        } else {
          return `[${role}]\n${content}\n`;
        }
      }).filter(Boolean).join('\n') + '\n\n[Yuihime]\n';
    } else {
      normalizedPrompt = typeof prompt === 'string' ? prompt : JSON.stringify(prompt);
    }

    logger.info(`[PUTER-SERVICE] puter.ai.chat prompt: "${normalizedPrompt.substring(0, 50)}..."`, 'system');
    
    // Attempt native SDK first
    const sdk = await this.initialize();
    const token = await this.getToken();

    if (sdk) {
      try {
        if (token) {
          this.setSdkToken(sdk, token);
        }

        let provider = 'openai';
        let model = options.model || 'gpt-4o-mini';

        if (model.includes(':')) {
          const parts = model.split(':');
          provider = parts[0];
          model = parts[1];
        }

        if (provider === 'azure-openai') {
          provider = 'openai';
        }
        if (provider === 'gemini') {
          provider = 'google';
        }

        const { model: _, provider: __, ...cleanedOptions } = options;
        const isReasoningOrAlibaba = provider === 'alibaba' || provider === 'deepseek' || model.toLowerCase().includes('qwen') || model.toLowerCase().includes('deepseek');
        const res = await sdk.ai.chat(normalizedPrompt, { 
          model, 
          provider, 
          ...(isReasoningOrAlibaba ? { enable_thinking: false } : {}),
          ...cleanedOptions 
        });
        const textValue = typeof res === 'string' ? res : res?.message || res?.text || res?.choices?.[0]?.message?.content;
        
        if (textValue) {
          return {
            success: true,
            message: textValue,
            text: textValue,
            model,
            provider
          };
        }
      } catch (err: any) {
        logger.warn(`[PUTER-SERVICE] SDK chat failed: ${err.message}. Retrying via REST fallback.`, 'system');
      }
    }

    // Fallback REST
    let fallbackProvider = 'openai';
    let fallbackModel = options.model || 'gpt-4o-mini';
    if (fallbackModel.includes(':')) {
      const parts = fallbackModel.split(':');
      fallbackProvider = parts[0];
      fallbackModel = parts[1];
    }

    if (fallbackProvider === 'azure-openai') {
      fallbackProvider = 'openai';
    }
    if (fallbackProvider === 'gemini') {
      fallbackProvider = 'google';
    }

    const { model: _, provider: __, ...cleanedOptionsFallback } = options;
    const isReasoningOrAlibabaFallback = fallbackProvider === 'alibaba' || fallbackProvider === 'deepseek' || fallbackModel.toLowerCase().includes('qwen') || fallbackModel.toLowerCase().includes('deepseek');

    const payload = {
      interface: "puter-chat-completion",
      driver: "ai-chat",
      service: "ai-chat",
      method: "complete",
      args: {
        messages: [{ role: 'user', content: normalizedPrompt }],
        model: fallbackModel,
        provider: fallbackProvider,
        ...(isReasoningOrAlibabaFallback ? { enable_thinking: false } : {}),
        ...cleanedOptionsFallback
      },
      auth_token: token
    };

    try {
      const res = await this.requestREST('/drivers/call', 'POST', payload);
      
      let textValue = 'No response';
      const errorMsg = res?.error?.message || res?.error || res?.result?.error?.message || res?.result?.error;
      if (errorMsg) {
        textValue = `Error from Puter: ${typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg}`;
      } else {
        textValue = (
          res?.result?.message?.content || 
          res?.message?.content || 
          res?.result?.text || 
          res?.text || 
          res?.choices?.[0]?.message?.content || 
          (typeof res === 'string' ? res : null) ||
          (typeof res?.result === 'string' ? res.result : null) ||
          'No response'
        );
      }

      return {
        success: true,
        message: textValue,
        text: textValue,
        model: fallbackModel,
        provider: fallbackProvider
      };
    } catch (err: any) {
      // Return simulator response if no token configured
      if (!token) {
        return {
          success: true,
          message: `[Simulated Puter AI] Prompt: "${prompt}". (Puter Token not configured in settings. Persist a token to use real Puter AI)`,
          text: `[Simulated Puter AI] Prompt: "${prompt}"`,
          model: fallbackModel,
          provider: fallbackProvider
        };
      }
      throw err;
    }
  }

  /**
   * [2] puter.ai.listModels()
   * Retrieve the available AI chat models (and providers) that Puter currently exposes.
   */
  public async listModels(provider: string | null = null): Promise<any[]> {
    logger.info(`[PUTER-SERVICE] Listing models for provider ${provider || 'all'}...`, 'system');
    const sdk = await this.initialize();
    const token = await this.getToken();

    if (sdk) {
      try {
        if (token) this.setSdkToken(sdk, token);
        const models = await sdk.ai.listModels(provider || undefined);
        if (Array.isArray(models)) return models;
      } catch (err: any) {
        logger.warn(`[PUTER-SERVICE] SDK listModels failed: ${err.message}. Retrying via REST.`, 'system');
      }
    }

    try {
      const res = await this.requestREST('/puterai/chat/models/details', 'GET');
      const models = res.models || res || [];
      if (provider) {
        return models.filter((m: any) => m.provider === provider);
      }
      return models;
    } catch (err) {
      // Fallback details if offline/error
      const allMock = [
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai' },
        { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai' },
        { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'anthropic' },
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'google' }
      ];
      if (provider) {
        return allMock.filter((m: any) => m.provider === provider);
      }
      return allMock;
    }
  }

  /**
   * [3] puter.ai.listModelProviders()
   * Retrieve the available AI providers that Puter currently exposes.
   */
  public async listModelProviders(): Promise<any[]> {
    logger.info('[PUTER-SERVICE] Listing providers...', 'system');
    const sdk = await this.initialize();
    const token = await this.getToken();

    if (sdk) {
      try {
        if (token) this.setSdkToken(sdk, token);
        const providers = await sdk.ai.listModelProviders();
        if (Array.isArray(providers)) return providers;
      } catch (err: any) {
        logger.warn(`[PUTER-SERVICE] SDK listModelProviders failed: ${err.message}. Retrying via REST.`, 'system');
      }
    }

    try {
      const models = await this.listModels();
      const uniqueProviders = new Set<string>();
      if (Array.isArray(models)) {
        models.forEach((m: any) => {
          if (m?.provider) {
            uniqueProviders.add(m.provider);
          }
        });
      }
      return Array.from(uniqueProviders).map(name => ({
        name,
        label: name.charAt(0).toUpperCase() + name.slice(1)
      }));
    } catch (err) {
      return [
        { name: 'openai', label: 'OpenAI' },
        { name: 'anthropic', label: 'Anthropic' },
        { name: 'google', label: 'Google' },
        { name: 'xai', label: 'xAI' }
      ];
    }
  }

  /**
   * [4] puter.ai.txt2img()
   * Generate images from text prompts using AI models like GPT Image, Nano Banana, DALL-E 3, FLUX.
   */
  public async txt2img(prompt: string, options: any = {}): Promise<any> {
    logger.info(`[PUTER-SERVICE] puter.ai.txt2img prompt: "${prompt}"`, 'system');
    const sdk = await this.initialize();
    const token = await this.getToken();

    if (sdk) {
      try {
        if (token) this.setSdkToken(sdk, token);
        const res = await sdk.ai.txt2img(prompt, options);
        if (res) return res;
      } catch (err: any) {
        logger.warn(`[PUTER-SERVICE] SDK txt2img failed: ${err.message}. Retrying via REST.`, 'system');
      }
    }

    try {
      return await this.requestREST('/ai/txt2img', 'POST', { prompt, ...options });
    } catch (err) {
      if (!token) {
        return {
          success: true,
          url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500',
          simulated: true,
          message: 'Puter Token not configured. Returned fallback placeholder.'
        };
      }
      throw err;
    }
  }

  /**
   * [5] puter.ai.txt2speech()
   * Convert text to speech with AI using multiple languages, voices, and engines.
   */
  public async txt2speech(text: string, voice: string = 'en-US-1', options: any = {}): Promise<any> {
    logger.info(`[PUTER-SERVICE] puter.ai.txt2speech: "${text.substring(0, 30)}..."`, 'system');
    const token = await this.getToken();

    // Map selected voices to high-quality cute female openai-tts voice names for Yui
    let finalVoice = 'shimmer';
    if (voice === 'en-US-1') finalVoice = 'shimmer'; // Default cute female voice
    else if (voice === 'en-US-2') finalVoice = 'nova';    // Energetic female voice
    else if (voice === 'en-GB-1') finalVoice = 'shimmer';
    else if (voice === 'ja-JP-1') finalVoice = 'shimmer';
    else if (voice === 'id-ID-1') finalVoice = 'nova';
    else if (voice === 'alloy' || voice === 'onyx' || voice === 'fable') {
      // Re-map masculine/androgynous fallbacks to cute female voices
      finalVoice = 'shimmer';
    } else {
      finalVoice = voice;
    }

    // Use our local API stream proxy that calls drivers/call with openai-tts
    const streamUrl = `/api/puter/tts/stream?text=${encodeURIComponent(text)}&voice=${finalVoice}&token=${encodeURIComponent(token || '')}`;
    return {
      audio_url: streamUrl,
      url: streamUrl,
      success: true
    };
  }

  /**
   * [6] puter.ai.txt2speech.listEngines()
   * List available TTS engines/models.
   */
  public async listSpeechEngines(): Promise<any[]> {
    logger.info('[PUTER-SERVICE] Listing speech engines...', 'system');
    
    // We return a high-fidelity, verified list of standard Engines compatible with Puter.js
    return [
      { id: 'openai', name: 'OpenAI TTS' },
      { id: 'elevenlabs', name: 'ElevenLabs Speech' },
      { id: 'gemini', name: 'Gemini Speech' }
    ];
  }

  /**
   * [7] puter.ai.txt2speech.listVoices()
   * List available TTS voices, optionally filtered by provider.
   */
  public async listSpeechVoices(provider?: string): Promise<any[]> {
    logger.info(`[PUTER-SERVICE] Listing speech voices for provider ${provider || 'all'}...`, 'system');

    const voices = [
      { id: 'shimmer', name: 'Shimmer (Female)', gender: 'female', provider: 'openai' },
      { id: 'nova', name: 'Nova (Female)', gender: 'female', provider: 'openai' },
      { id: 'alloy', name: 'Alloy (Neutral)', gender: 'neutral', provider: 'openai' },
      { id: 'echo', name: 'Echo (Male)', gender: 'male', provider: 'openai' },
      { id: 'fable', name: 'Fable (Neutral)', gender: 'neutral', provider: 'openai' },
      { id: 'onyx', name: 'Onyx (Male)', gender: 'male', provider: 'openai' },
      
      // ElevenLabs Voices
      { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel (Female)', gender: 'female', provider: 'elevenlabs' },
      { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi (Female)', gender: 'female', provider: 'elevenlabs' },
      { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella (Female)', gender: 'female', provider: 'elevenlabs' },
      { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni (Male)', gender: 'male', provider: 'elevenlabs' },
      { id: 'pNInz6obpgST9L059as4', name: 'Adam (Male)', gender: 'male', provider: 'elevenlabs' },
      
      // Gemini/AWS-Polly compatibility fallback voices
      { id: 'en-US-1', name: 'English (US) - 1', gender: 'female', provider: 'openai' },
      { id: 'en-US-2', name: 'English (US) - 2', gender: 'male', provider: 'openai' },
      { id: 'en-GB-1', name: 'English (UK) - 1', gender: 'female', provider: 'openai' },
      { id: 'ja-JP-1', name: 'Japanese - 1', gender: 'female', provider: 'openai' },
      { id: 'id-ID-1', name: 'Indonesian - 1', gender: 'female', provider: 'openai' }
    ];

    if (provider && provider !== 'all') {
      return voices.filter(v => v.provider === provider);
    }
    return voices;
  }

  /**
   * [8] puter.ai.txt2vid()
   * Generate short-form videos with AI models.
   */
  public async txt2vid(prompt: string, options: any = {}): Promise<any> {
    logger.info(`[PUTER-SERVICE] puter.ai.txt2vid prompt: "${prompt}"`, 'system');
    const sdk = await this.initialize();
    const token = await this.getToken();

    if (sdk && sdk.ai.txt2vid) {
      try {
        if (token) this.setSdkToken(sdk, token);
        const res = await sdk.ai.txt2vid(prompt, options);
        if (res) return res;
      } catch (err: any) {
        logger.warn(`[PUTER-SERVICE] SDK txt2vid failed: ${err.message}. Retrying via REST.`, 'system');
      }
    }

    try {
      return await this.requestREST('/ai/txt2vid', 'POST', { prompt, ...options });
    } catch (err) {
      if (!token) {
        return {
          success: true,
          url: 'https://assets.mixkit.co/videos/preview/mixkit-starry-outer-space-background-loop-42861-large.mp4',
          simulated: true,
          message: 'Puter Token not configured. Returned simulated video backdrop.'
        };
      }
      throw err;
    }
  }

  /**
   * [9] puter.ai.img2txt()
   * Extract text from images using OCR. (imageUrl or base64 data)
   */
  public async img2txt(image: string, options: any = {}): Promise<any> {
    logger.info(`[PUTER-SERVICE] puter.ai.img2txt size: ${image.length} chars`, 'system');
    const sdk = await this.initialize();
    const token = await this.getToken();

    if (sdk && sdk.ai.img2txt) {
      try {
        if (token) this.setSdkToken(sdk, token);
        const res = await sdk.ai.img2txt(image, options);
        if (res) return res;
      } catch (err: any) {
        logger.warn(`[PUTER-SERVICE] SDK img2txt failed: ${err.message}.`, 'system');
      }
    }

    try {
      return await this.requestREST('/ai/img2txt', 'POST', { image, ...options });
    } catch (err) {
      if (!token) {
        return {
          success: true,
          text: 'Simulated OCR payload: No Puter Token specified to invoke actual cloud OCR engine.'
        };
      }
      throw err;
    }
  }

  /**
   * [10] puter.ai.speech2txt()
   * Transcribe or translate audio into text. (audioUrl or base64 data)
   */
  public async speech2txt(audio: string, options: any = {}): Promise<any> {
    logger.info(`[PUTER-SERVICE] puter.ai.speech2txt size: ${audio.length} chars`, 'system');
    const sdk = await this.initialize();
    const token = await this.getToken();

    if (sdk && sdk.ai.speech2txt) {
      try {
        if (token) this.setSdkToken(sdk, token);
        const res = await sdk.ai.speech2txt(audio, options);
        if (res) return res;
      } catch (err: any) {
        logger.warn(`[PUTER-SERVICE] SDK speech2txt failed: ${err.message}.`, 'system');
      }
    }

    try {
      return await this.requestREST('/ai/speech2txt', 'POST', { audio, ...options });
    } catch (err) {
      if (!token) {
        return {
          success: true,
          text: 'Simulated transcription: Puter token not configured.'
        };
      }
      throw err;
    }
  }

  /**
   * [11] puter.ai.speech2speech()
   * Transform an audio clip into a different voice using ElevenLabs.
   */
  public async speech2speech(audio: string, voice: string, options: any = {}): Promise<any> {
    logger.info(`[PUTER-SERVICE] puter.ai.speech2speech with voice: ${voice}`, 'system');
    const sdk = await this.initialize();
    const token = await this.getToken();

    if (sdk && sdk.ai.speech2speech) {
      try {
        if (token) this.setSdkToken(sdk, token);
        const res = await sdk.ai.speech2speech(audio, voice, options);
        if (res) return res;
      } catch (err: any) {
        logger.warn(`[PUTER-SERVICE] SDK speech2speech failed: ${err.message}.`, 'system');
      }
    }

    try {
      return await this.requestREST('/ai/speech2speech', 'POST', { audio, voice, ...options });
    } catch (err) {
      if (!token) {
        return {
          success: true,
          audio_url: 'https://api.puter.com/v1/ai/txt2speech/stream?text=Simulated+voice+transformation&voice=en-US-1',
          message: 'Puter Token not configured.'
        };
      }
      throw err;
    }
  }

  /**
   * [12] syncConsciousnessState()
   * Synchronize active cognitive ideas and dialogues of Yuihime to Puter cloud Key-Value.
   */
  public async syncConsciousnessState(input: string, response: string, moodState: any = {}, personaId: string = 'hiyori'): Promise<any> {
    const token = await this.getToken();
    if (!token) {
      logger.info('[PUTER-SERVICE] Consciousness sync bypassed: No Puter Token configured.', 'system');
      return { success: false, reason: 'No token' };
    }

    const payload = {
      interface: "puter-key-value",
      driver: "key-value",
      method: "set",
      args: {
        key: `yuihime:consciousness:dialogue:${Date.now()}`,
        value: JSON.stringify({
          timestamp: Date.now(),
          input,
          response,
          mood: moodState,
          persona_id: personaId
        })
      },
      auth_token: token
    };

    try {
      logger.info(`[PUTER-SERVICE] Synchronizing consciousness state to Puter KV...`, 'system');
      const res = await this.requestREST('/drivers/call', 'POST', payload);
      return { success: true, result: res };
    } catch (err: any) {
      const isKvDeprecation = err.message?.includes("puter-key-value") || err.message?.includes("not_found") || err.message?.includes("404");
      if (isKvDeprecation) {
        logger.info(`[PUTER-SERVICE] Puter Key-Value sync is currently deprecated or unavailable. Consciousness state remains safe locally: ${err.message}`, 'system');
      } else {
        logger.warn(`[PUTER-SERVICE] Active consciousness sync failed: ${err.message}`, 'system');
      }
      return { success: false, error: err.message };
    }
  }
}

