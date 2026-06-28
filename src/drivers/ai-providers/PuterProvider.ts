import { ProviderModule, ModuleType } from '../../include/types';
import { NeuralProcessor } from '../../core/kernel/processor';
import { PuterService } from '../../core/kernel/PuterService';

/**
 * PuterProvider: Mengizinkan Yuihime menggunakan Puter.js sebagai mesin pemrosesan neural utama.
 * Sangat berguna untuk menghemat token pada tugas-tugas sederhana.
 */
export const PuterProvider: ProviderModule = {
  metadata: {
    id: 'puter-neural-provider',
    name: 'Puter Cloud Provider',
    description: 'Neural provider menggunakan infrastruktur Puter.js (Gratis & Cepat)',
    version: '1.0.0',
    type: ModuleType.PROVIDER,
    order: 10,
    models: [
      'openai:gpt-4o-mini', 
      'openai:gpt-4o', 
      'anthropic:claude-3-5-sonnet-20240620', 
      'anthropic:claude-3-opus-20240229', 
      'openai:o1-mini', 
      'google:gemini-1.5-flash'
    ],
    configSchema: {
      fields: {
        provider: {
          type: 'select',
          label: 'AI Provider Filter (Puter)',
          default: 'all',
          dynamicOptions: true,
          options: [
            { label: 'All Providers', value: 'all' }
          ]
        },
        model: {
          type: 'select',
          label: 'AI Model (Puter)',
          default: 'openai:gpt-4o-mini',
          dynamicOptions: true,
          options: [
            { label: 'OpenAI: GPT-4o Mini', value: 'openai:gpt-4o-mini' },
            { label: 'OpenAI: GPT-4o', value: 'openai:gpt-4o' },
            { label: 'Anthropic: Claude 3.5 Sonnet', value: 'anthropic:claude-3-5-sonnet-20240620' },
            { label: 'Anthropic: Claude 3 Opus', value: 'anthropic:claude-3-opus-20240229' },
            { label: 'OpenAI: o1-mini', value: 'openai:o1-mini' },
            { label: 'Google: Gemini 1.5 Flash', value: 'google:gemini-1.5-flash' }
          ]
        },
        token: {
          type: 'password',
          label: 'Puter Auth Token (Optional)',
          description: 'Hanya jika Anda menggunakan token kustom.'
        }
      }
    }
  },

  async generate(input: any, options: any = {}) {
    console.log('[PUTER-PROVIDER] Neural Processing via native Puter.js...');
    
    // Robust context and fallback resolution for system instruction and prompt text
    let systemInstruction = options.assembledSystemPrompt || options.systemPrompt || '';
    let promptText = typeof input === 'string' ? input : JSON.stringify(input);

    const blueprint = options.payloadBlueprint || options.config?.payloadBlueprint;
    if (blueprint && blueprint.messages) {
      const sysMsg = blueprint.messages.find((m: any) => m.role === 'system');
      if (sysMsg) {
        systemInstruction = sysMsg.content;
      }
      const usrMsg = blueprint.messages.find((m: any) => m.role === 'user');
      if (usrMsg) {
        promptText = usrMsg.content;
      }
    }

    // Build standard messages array for Puter compatibility
    let promptPayload: any = input;
    if (!Array.isArray(input)) {
      const msgs = [];
      if (systemInstruction) {
        msgs.push({ role: 'system', content: systemInstruction });
      }
      msgs.push({ role: 'user', content: promptText });
      promptPayload = msgs;
    }

    try {
      if (typeof window !== 'undefined') {
        const model = options.model || PuterProvider.metadata.models[0];
        const res = await fetch('/api/puter/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: promptPayload, model, options })
        });
        if (res.ok) {
          const result = await res.json();
          if (result && result.success) {
            return result.message || result.text;
          }
        }
        throw new Error('API route returned error status');
      }

      const puterService = PuterService.getInstance();
      
      const model = options.model || PuterProvider.metadata.models[0];
      const result = await puterService.chat(promptPayload, { model, ...options });

      if (result && result.success) {
        return result.message || result.text;
      }
      throw new Error(result?.error || 'Unknown error during native Puter chat.');
    } catch (e: any) {
      console.error('[PUTER-PROVIDER] Native generate error:', e);
      throw e;
    }
  },

  async getDynamicOptions(fieldName: string, config: any) {
    if (fieldName === 'provider') {
      return fetchProvidersList();
    }
    if (fieldName === 'model') {
      return fetchModelsList(config);
    }
    return [];
  }
};

async function fetchProvidersList() {
  try {
    if (typeof window !== 'undefined') {
      const res = await fetch('/api/puter/providers');
      if (res.ok) {
        const provsArray = await res.json();
        if (provsArray && provsArray.length > 0) {
          const formatted = provsArray.map((p: any) => {
            const name = typeof p === 'string' ? p : (p.name || p.id || '');
            const label = typeof p === 'string' ? p.charAt(0).toUpperCase() + p.slice(1) : (p.label || p.name || '');
            return { label, value: name };
          });
          return [{ label: 'All Providers', value: 'all' }, ...formatted];
        }
      }
      return [{ label: 'All Providers', value: 'all' }];
    }

    const puterService = PuterService.getInstance();
    const provsArray = await puterService.listModelProviders();
    if (provsArray && provsArray.length > 0) {
      const formatted = provsArray.map((p: any) => {
        const name = typeof p === 'string' ? p : (p.name || p.id || '');
        const label = typeof p === 'string' ? p.charAt(0).toUpperCase() + p.slice(1) : (p.label || p.name || '');
        return { label, value: name };
      });
      return [{ label: 'All Providers', value: 'all' }, ...formatted];
    }
    return [{ label: 'All Providers', value: 'all' }];
  } catch (e) {
    console.error('[PUTER-PROVIDER] Failed to fetch providers dynamically:', e);
    return [{ label: 'All Providers', value: 'all' }];
  }
}

async function fetchModelsList(config: any) {
  try {
    const selectedProvider = config?.provider === 'all' ? null : (config?.provider || null);
    if (typeof window !== 'undefined') {
      const query = selectedProvider ? `?provider=${encodeURIComponent(selectedProvider)}` : '';
      const res = await fetch(`/api/puter/models${query}`);
      if (res.ok) {
        const modelsArray = await res.json();
        if (modelsArray && modelsArray.length > 0) {
          return modelsArray.map((m: any) => ({
             label: `${m.provider ? m.provider.toUpperCase() + ': ' : ''}${m.name || m.id || 'Unknown'}`,
             value: m.provider ? `${m.provider}:${m.id || m.name}` : (m.id || m.name)
          }));
        }
      }
      return [];
    }

    const puterService = PuterService.getInstance();
    const modelsArray = await puterService.listModels(selectedProvider);

    if (modelsArray && modelsArray.length > 0) {
      return modelsArray.map((m: any) => ({
         label: `${m.provider ? m.provider.toUpperCase() + ': ' : ''}${m.name || m.id || 'Unknown'}`,
         value: m.provider ? `${m.provider}:${m.id || m.name}` : (m.id || m.name)
      }));
    }
    return [];
  } catch (e) {
    console.error('[PUTER-PROVIDER] Failed to fetch models natively:', e);
    return [];
  }
}
