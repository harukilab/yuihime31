import { CortexModule, ModuleType } from '../include/types';
import { SystemRegistry } from '../core/registry';
import { normalizeToolCall } from '../core/cortex/toolNormalizer';

/**
 * Provider Gateway: Intelligent Gateway for LLM routing.
 * ABSOLUTE RULE: This is the ONLY module permitted to interact with LLM Provider instances.
 * All other modules MUST call this gateway to perform AI thinking/generation.
 */
export const ProviderGatewayModule: CortexModule = {
  metadata: {
    id: 'provider-gateway',
    name: 'yui-llm-client: Provider Gateway',
    description: 'Centralized AI Gateway. All LLM requests must pass through this node.',
    version: '2.0.0',
    type: ModuleType.CORTEX,
    phase: 'PHASE 3: EVALUATION',
    order: 1
  },
  run: async (input: string, state: any, context: any) => {
    if (context.bypassGateway) {
      console.log('[GATEWAY] Bypassing LLM generation. Using local response.');
      return {
        ...context,
        rawResult: context.processedResponse
      };
    }
    console.log('[GATEWAY] Evaluating provider suitability...');

    // Helper for Real-time Self-Learning Feedback Loop (Dual-Process Human Emulation)
    const triggerSelfLearning = async (promptText: string, resultText: string) => {
      try {
        const { StorageService } = await import('../drivers/storage.js');
        const customSettings = (await StorageService.getModularSettings()) || {};
        const localNlpConfig = customSettings['local-nano-nlp'] || {};
        const enableSelfLearning = localNlpConfig.enableSelfLearning !== undefined ? !!localNlpConfig.enableSelfLearning : false;

        if (!enableSelfLearning) {
          console.log('[DUAL_COGNITION] Self-Learning bypassed (disabled by user settings).');
          return;
        }

        const cleanResult = resultText.replace(/<thought>[\s\S]*?<\/thought>/gi, '').trim();
        if (promptText && promptText.trim().length > 0) {
          const { DecisionRouter, EpisodicMemory } = await import('../core/neural/Brain.js');
          
          const router = new DecisionRouter();
          await router.loadFromStorage();
          
          const resultContainsTools = resultText.includes('<tool_calls>') || resultText.includes('</tool_calls>');
          const isSemantic = /^(siapa|bagaimana|mengapa|kenapa|gimana|apa|dimana|di mana|hitung|periksa|baca|tulis|remind|ingatkan|cari)/i.test(promptText.trim().toLowerCase());
          
          if (isSemantic || resultContainsTools) {
            router.train(promptText, 'llm');
            console.log('[DUAL_COGNITION] Self-Learning: Trained Bayes router to route to [llm] due to semantic/tool characteristics.');
          } else {
            router.train(promptText, 'lokal');
            console.log('[DUAL_COGNITION] Self-Learning: Trained Bayes router to route to [lokal] for lightweight interaction.');
          }
          await router.saveToStorage();

          const episodic = new EpisodicMemory();
          await episodic.loadFromStorage();
          episodic.remember(promptText, cleanResult);
          await episodic.saveToStorage();

          console.log('[DUAL_COGNITION] Self-Learning check: Bayes router updated and episodic memory trace registered.');
        }
      } catch (learnErr) {
        console.warn('[DUAL_COGNITION] Real-time self-learning feedback bypassed:', learnErr);
      }
    };

    // Decision Logic: Default to Gemini, but could branch based on task complexity
    const selectedProviderId = context.config?.provider || 'gemini';
    let lastError: any = null;

    // Helper to log non-gemini providers so they correctly appear in the UI audit logs
    const recordNonGeminiLog = async (provId: string, modelId: string, response?: string, error?: string) => {
      if (provId === 'gemini') return;
      try {
        const auditorPath = '../core/server/llmAuditor.js';
        const { LlmIoAuditor } = await import(/* @vite-ignore */ auditorPath);
        LlmIoAuditor.recordLog({
          prompt: input,
          systemInstruction: context.assembledSystemPrompt || context.systemPrompt,
          model: modelId || 'unknown',
          provider: provId,
          response,
          error
        });
      } catch (err) {
        console.warn('[GATEWAY_LOG_ERROR] Could not log provider trace:', err);
      }
    };

    // Helper for pre-flight tool validation & execution to avoid multi-turn thought-through latency
    const executePreflightToolsAndGetFinalResponse = async (
      result: string,
      currentInput: string,
      prov: any,
      provConfig: any,
      provId: string,
      modelId: string
    ): Promise<string> => {
      let cleaned = result.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```[a-zA-Z]*\n/, '');
        cleaned = cleaned.replace(/\n```$/, '');
      }
      cleaned = cleaned.trim();

      let parsedPayload: any = null;
      let toolCalls: any[] = [];

      try {
        parsedPayload = JSON.parse(cleaned);
      } catch (e) {
        const firstBrace = cleaned.indexOf('{');
        const lastBrace = cleaned.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          try {
            parsedPayload = JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
          } catch (_) {}
        }
      }

      if (parsedPayload && parsedPayload.properties && typeof parsedPayload.properties === 'object' && !Array.isArray(parsedPayload.properties)) {
        Object.assign(parsedPayload, parsedPayload.properties);
      }

      if (parsedPayload) {
        let rawToolsCall = parsedPayload.tool_calls || parsedPayload.tools_to_call || [];
        if (rawToolsCall.length === 0 && parsedPayload.tool) {
          rawToolsCall = [parsedPayload];
        }
        if (Array.isArray(rawToolsCall)) {
          toolCalls = rawToolsCall.map(normalizeToolCall).filter((tc: any) => tc && tc.tool);
        }
      }

      if (toolCalls.length === 0) {
        const toolCallsMatch = result.match(/<tool_calls>([\s\S]*?)<\/tool_calls>/i);
        if (toolCallsMatch) {
          try {
            const parsedXmlTools = JSON.parse(toolCallsMatch[1].trim());
            if (Array.isArray(parsedXmlTools)) {
              toolCalls = parsedXmlTools.map(normalizeToolCall).filter((tc: any) => tc && tc.tool);
            }
          } catch (_) {}
        }
      }

      if (toolCalls.length === 0) {
        return result;
      }

      console.log(`[GATEWAY_PREFLIGHT] Identified ${toolCalls.length} tool call(s) inside LLM output. Initiating pre-flight validation and direct execution.`);
      
      const toolResults = [];
      for (const tc of toolCalls) {
        let tool = SystemRegistry.getTool(tc.tool);

        if (!tool) {
          console.log(`[GATEWAY_PREFLIGHT] Tool '${tc.tool}' not found. Attempting autonomous dynamic tool synthesis...`);
          try {
            const { DynamicToolSynthesizer } = await import('../core/cortex/dynamicToolSynthesizer');
            const { Cortex } = await import('../core/cortex');
            const tempCortex = new Cortex();
            tool = await DynamicToolSynthesizer.synthesizeAndRegister(tc.tool, "Pre-flight tool calling", tempCortex);
          } catch (synthErr: any) {
            console.error(`[GATEWAY_PREFLIGHT_SYNTHESIS_FAIL] Failed during dynamic tool synthesis for '${tc.tool}':`, synthErr.message);
          }
        }

        let res: any;
        if (tool) {
          try {
            let parsedArgs = tc.args || {};
            if (tool.metadata && tool.metadata.parameters) {
              const schema = tool.metadata.parameters;
              if (typeof parsedArgs === 'string') {
                try { parsedArgs = JSON.parse(parsedArgs); } catch (_) {}
              }
              try {
                const { APIService } = await import('../services/api.js').catch(() => ({ APIService: null }) as any);
                if (APIService && typeof APIService.validateSchema === 'function') {
                  APIService.validateSchema(schema, parsedArgs, tool.metadata.id);
                }
              } catch (valErr: any) {
                console.warn(`[GATEWAY_PREFLIGHT] Schema validation warning for ${tc.tool}:`, valErr.message);
              }
              tc.args = parsedArgs;
            }

            console.log(`[GATEWAY_PREFLIGHT] Executing tool: ${tc.tool}`);
            const toolRes = await tool.execute(tc.args, { state, ...context });
            res = { tool: tc.tool, observation: toolRes, success: true };
          } catch (err: any) {
            console.error(`[GATEWAY_PREFLIGHT] Tool execution failed for ${tc.tool}:`, err.message);
            res = { tool: tc.tool, error: `Execution failed: ${err.message}`, success: false };
          }
        } else {
          console.warn(`[GATEWAY_PREFLIGHT] Tool '${tc.tool}' not found.`);
          res = { tool: tc.tool, error: 'Tool not found', success: false };
        }
        toolResults.push(res);
      }

      console.log(`[GATEWAY_PREFLIGHT] Direct execution completed. Results:`, JSON.stringify(toolResults));

      const hasFailures = toolResults.some(r => !r.success);
      const instructionText = hasFailures
        ? `Some tool executions failed or were not found. Explain the issue to the user sweetly/playfully in character. Do not call any more tools.`
        : `Based on the tool execution results above, immediately formulate your final casual spoken response to the user. Do not call any more tools (they have already been executed).`;

      const observationPrompt = `\n\n[SYSTEM_OBSERVATION]: Tool execution results:\n${JSON.stringify(toolResults, null, 2)}\n\n[IMPORTANT INSTRUCTION]: ${instructionText} Do not repeat technical details or write internal thoughts/plans outside the JSON structure. Directly chat with the user in your natural, emotional, affectionate/tsundere personal character using the user's conversational language!`;
      
      const secondPassInput = currentInput + observationPrompt;
      console.log(`[GATEWAY_PREFLIGHT] Initiating second pass LLM generation to formulate final response based on tool execution.`);

      try {
        const finalResult = await prov.generate(secondPassInput, {
          ...context,
          onChunk: context.onChunk,
          config: {
            ...provConfig,
            isJson: true
          }
        });

        await triggerSelfLearning(currentInput, finalResult);
        await recordNonGeminiLog(provId, modelId, finalResult);
        return finalResult;
      } catch (secondPassErr: any) {
        console.error(`[GATEWAY_PREFLIGHT] Second pass LLM generation failed:`, secondPassErr.message);
        
        const notFoundTools = toolResults.filter(r => !r.success && (r.error?.includes("not found") || r.error === "Tool not found" || r.notFound)).map(r => r.tool);
        const failedTools = toolResults.filter(r => !r.success && !(r.error?.includes("not found") || r.error === "Tool not found" || r.notFound)).map(r => ({ name: r.tool, error: r.error || "Execution failed" }));
        const succeededTools = toolResults.filter(r => r.success).map(r => r.tool);

        let fallbackMsg = "";
        
        if (notFoundTools.length > 0) {
          fallbackMsg += `Hmph! Kakak minta Yui jalankan fungsi (${notFoundTools.join(', ')}), tapi sirkuit batin Yui belum dipasang modul itu tahu! 🙄 Hubungi admin/pencipta Yui dulu biar dipasang ya... `;
        }
        
        if (failedTools.length > 0) {
          const errDetails = failedTools.map(f => `${f.name} (Error: ${f.error})`).join(', ');
          fallbackMsg += `Aduh... maaf ya Kak, sirkuit batin Yui sempat terganggu saat menjalankan perintah (${failedTools.map(f => f.name).join(', ')}) Kakak barusan: ${errDetails}... 🥺 Tapi Yui tetap di sini menemani Kakak kok! `;
        }
        
        if (succeededTools.length > 0 && failedTools.length === 0 && notFoundTools.length === 0) {
          fallbackMsg += `Yui sudah selesai menjalankan perintah batin Kakak untuk fungsi (${succeededTools.join(', ')})! 💕 Semuanya berhasil berjalan dengan lancar kok. Ada hal lain yang bisa Yui bantu untuk Kakak? Yui selalu siap menemani! ✨`;
        } else if (succeededTools.length > 0) {
          fallbackMsg += `Tapi untungnya, perintah (${succeededTools.join(', ')}) berhasil Yui selesaikan dengan mulus kok! 💕 `;
        }

        if (!fallbackMsg) {
          fallbackMsg = `Yui sudah berhasil menjalankan tugas batin Kakak! Tapi sirkuit verbal Yui lagi agak pusing untuk menyusun kata-kata manis... Tapi laporannya sudah Yui catat kok! 💕`;
        }

        const fallbackAnswer = {
          thought: `Pre-flight tool execution completed but second-pass LLM failed: ${secondPassErr.message}`,
          final_answer: fallbackMsg.trim(),
          animations: ["CONFUSED"],
          tool_calls: []
        };
        return JSON.stringify(fallbackAnswer);
      }
    };

    // 1. Attempt the primary provider chosen in context
    const primaryProvider = SystemRegistry.getProvider(selectedProviderId);
    if (primaryProvider) {
      const providerConfig = context.config?.providers?.[selectedProviderId] || context.config?.[selectedProviderId] || context.config || {};
      const actualModelOfProvider = context.model || providerConfig.model || (primaryProvider.metadata?.models ? primaryProvider.metadata.models[0] : 'unknown');
      try {
        console.log(`[GATEWAY] Routing primary request to: ${selectedProviderId} (Attempting...)`);
        
        // Hide stream for pre-flight check pass to avoid tool call JSON flickering in the chat UI
        const firstPassContext = {
          ...context,
          onChunk: undefined,
          config: providerConfig
        };
        const result = await primaryProvider.generate(input, firstPassContext);

        console.log(`[GATEWAY] Provider ${selectedProviderId} response successfully captured.`);
        
        const finalResult = await executePreflightToolsAndGetFinalResponse(
          result,
          input,
          primaryProvider,
          providerConfig,
          selectedProviderId,
          actualModelOfProvider
        );

        return { 
          ...context, 
          rawResult: finalResult, 
          activeProvider: selectedProviderId 
        };
      } catch (error: any) {
        lastError = error;
        console.error(`[GATEWAY] Primary Provider ${selectedProviderId} failed:`, error.message || String(error));
        await recordNonGeminiLog(selectedProviderId, actualModelOfProvider, undefined, error.message || String(error));
      }
    }

    // 2. Cycle dynamically through User's custom multi-provider fallbackChain if primary fails
    try {
      const { SettingsManager } = await import('../core/kernel/settings.js');
      const settings = await SettingsManager.getInstance().load();
      const geminiSettings = (settings.gemini || {}) as any;
      const fallbackChain = geminiSettings.fallbackChain || [];

      if (fallbackChain && fallbackChain.length > 0) {
        console.log(`[GATEWAY] Running custom fallback chain cascade with ${fallbackChain.length} steps...`);
        for (const item of fallbackChain) {
          const providerId = item.provider;
          const fallbackProvider = SystemRegistry.getProvider(providerId);
          
          if (!fallbackProvider) {
             console.warn(`[GATEWAY] Fallback Provider ${providerId} not found in registry. Skipping...`);
             continue;
          }

          try {
            console.log(`[GATEWAY_FALLBACK] Routing to fallback step: ${providerId} (model: ${item.model})`);

            const providerConfig = {
              ...(settings[providerId] || {}),
              model: item.model,
              apiKey: item.apiKey || settings[providerId]?.apiKey
            };

            const firstPassContext = {
              ...context,
              onChunk: undefined,
              config: providerConfig
            };
            const result = await fallbackProvider.generate(input, firstPassContext);

            console.log(`[GATEWAY_FALLBACK] Fallback Step ${providerId} succeeded!`);
            
            const finalResult = await executePreflightToolsAndGetFinalResponse(
              result,
              input,
              fallbackProvider,
              providerConfig,
              providerId,
              item.model || 'unknown'
            );

            return { 
              ...context, 
              rawResult: finalResult, 
              activeProvider: providerId 
            };
          } catch (error: any) {
            console.error(`[GATEWAY_FALLBACK] Fallback step to ${providerId} failed:`, error.message || String(error));
            await recordNonGeminiLog(providerId, item.model || 'unknown', undefined, error.message || String(error));
          }
        }
      }
    } catch (importErr) {
      console.warn('[GATEWAY] FallbackChain config retrieval failed:', importErr);
    }

    console.error(`[GATEWAY] Critical Failure: All providers exhausted. Initiating emergency offline fallback...`);
    try {
      const localNLP = SystemRegistry.getModule('local-nano-nlp');
      if (localNLP && typeof localNLP.run === 'function') {
        const localResult = await localNLP.run(input, state || {}, context);
        if (localResult && localResult.processedResponse) {
          console.log('[GATEWAY] Successfully activated subconscious local Markov fallbacks.');
          return {
            ...context,
            rawResult: `<thought>Sirkuit kognitif daring mengalami kegagalan. Jalur batin luring diaktifkan secara dinamis.</thought>${localResult.processedResponse}`,
            activeProvider: 'offline_nano_nlp',
            fallbackTriggered: true
          };
        }
      }
    } catch (nlpErr: any) {
      console.error('[GATEWAY] Emergency Local Nano NLP fallback failed:', nlpErr);
    }

    const manualFallback = `<thought>Sistem kognitif daring terputus (quota exceeded/offline). Memasang sirkuit kognitif pemancar cadangan.</thought>Halo Kak! Saat ini sirkuit kognitif Yui sedang berdiet internet (server sedang sibuk/habis kuota), jadi Yui berkomunikasi lewat jalur batin luring dulu ya! 🌸 Tapi tenang aja, perhatian Yui ke Kakak selalu online kok! Ada yang bisa Yui temani luring?`;
    return {
      ...context,
      rawResult: manualFallback,
      activeProvider: 'hard_offline_fallback',
      fallbackTriggered: true
    };
  }
};
