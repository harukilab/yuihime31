/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  AgentState, 
  Memory, 
  Dream, 
  LearnedStrategy, 
  AgentPersona, 
  Identity,
  MoodState,
  TaskPlan,
  CortexModule,
  PayloadBlueprint
} from '../../include/types';
import { SystemRegistry } from '../registry';
import { APIService } from '../../services/api';
import { ValidationMiddleware } from '../ValidationMiddleware';
import { StorageService } from '../../drivers/storage';
import { LearningEngine } from '../learning';
import { StandardizedProcessor } from '../kernel/processor';
import { PromptRegistry } from '../PromptRegistry';
import { eventBus } from '../kernel/event-bus';
import { stateMachine } from '../kernel/state-machine';
import { CognitiveScheduler } from '../kernel/CognitiveScheduler';
import { normalizeToolCall } from './toolNormalizer';
import { StreamExtractor } from './streamExtractors';
import { wrapForPuterConsciousness } from './puterWrapper';
import { repairJsonFormatWithLLM } from './jsonRepairer';
import { FastTrackRunner } from './fastTrackRunner';

export async function executeCortexThink(
  cortexInstance: any,
  input: string,
  memories: Memory[],
  dreams: Dream[],
  capabilities: any[],
  state: AgentState,
  strategies: LearnedStrategy[],
  userName: string,
  allIdentities: Identity[],
  activePersona?: AgentPersona,
  contextId?: string,
  chatType?: string,
  taskId?: string,
  attachments?: any[],
  onChunk?: (chunk: string) => void,
  signal?: AbortSignal
): Promise<any> {
  if (typeof window !== 'undefined') {
    try {
      const shouldStream = typeof onChunk === 'function';
      const response = await fetch('/api/cortex/think' + (shouldStream ? '?stream=true' : ''), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input,
          userName,
          contextId,
          chatType,
          taskId,
          attachments,
          stream: shouldStream
        }),
        signal
      });
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      if (shouldStream) {
        const reader = response.body?.getReader();
        if (!reader) throw new Error("Gagal menginisialisasi pembaca aliran data (readable stream).");
        
        const decoder = new TextDecoder("utf-8");
        let buffer = "";
        let finalResult: any = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const cleanLine = line.trim();
            if (!cleanLine.startsWith("data: ")) continue;
            const jsonStr = cleanLine.substring(6);
            try {
              const sseData = JSON.parse(jsonStr);
              if (sseData.type === "chunk") {
                onChunk!(sseData.text);
              } else if (sseData.type === "done") {
                finalResult = sseData.result;
              } else if (sseData.type === "error") {
                throw new Error(sseData.error);
              } else if (sseData.type === "suspended") {
                return {
                  suspended: true,
                  taskId: sseData.taskId,
                  response: sseData.message,
                  logs: []
                } as any;
              }
            } catch (parseErr) {
              console.warn("[Cortex Stream Client] Failed to parse SSE line:", cleanLine, parseErr);
            }
          }
        }

        if (finalResult) {
          return wrapForPuterConsciousness(finalResult);
        }
        throw new Error("Aliran data selesai tanpa memproses hasil kognisi akhir.");
      } else {
        const data = await response.json();
        if (data.success && data.result) {
          return wrapForPuterConsciousness(data.result);
        }
        throw new Error(data.error || 'Server kognisi mengembalikan format tidak valid');
      }
    } catch (err: any) {
      console.error('[Cortex Web Proxy Client] Gagal memindahkan tugas nalar ke server, menggunakan mode luring lokal cadangan:', err);
    }
  }

  const startTime = Date.now();
  const logs: string[] = [];
  await cortexInstance.constructor.ensureInitialized();

  let enforceStrictJson = false;
  if (input && input.includes("[PRE-PROCESS: ENFORCE_JSON_ONLY]")) {
    enforceStrictJson = true;
    input = input.replace("[PRE-PROCESS: ENFORCE_JSON_ONLY]", "").trim();
  }
  if (taskId) {
    CognitiveScheduler.setCurrentTask(taskId);
  }
  eventBus.emit('USER_INPUT_RECEIVED', { input, userName });
  stateMachine.transitionTo('THINKING');
  
  const patterns = LearningEngine.recognizePatterns(memories.slice(-20));
  if (patterns.length > 0) {
    logs.push(`[KERNEL] Neural Patterns Detected: ${patterns.slice(0, 3).map(p => `${p.pattern}(${p.frequency})`).join(', ')}`);
  }

  const workflow = await StorageService.getWorkflow();

  logs.push("[PHASE 1] Initializing Input Aggregation...");
  const settings = await cortexInstance.getSettings();
  const preContext = await SystemRegistry.runCortexPhase('PHASE 1: AGGREGATION', input, state, {
    memories,
    userName,
    allIdentities,
    config: settings,
    contextId,
    chatType
  });

  let currentPlan = preContext.currentPlan !== undefined ? preContext.currentPlan : state.currentPlan;
  if (preContext.requiresPlanning && !currentPlan) {
    logs.push(preContext.planning_signal || "[KERNEL] Generating Task Decomposition Plan...");
    const planPrompt = PromptRegistry.getInstance().compile('cortex:planning', {
      planning_directive: preContext.planning_directive || "Decompose the following request into a series of logical sub-tasks.",
      input: input
    });
    try {
      const planRaw = await cortexInstance.thinkSimple(planPrompt);
      const tags = StandardizedProcessor.extractTags(planRaw);
      const planData = JSON.parse(tags.plan || planRaw);
      currentPlan = {
        id: Math.random().toString(36).substr(2, 9),
        originalGoal: input,
        tasks: planData.tasks.map((t: any, i: number) => ({ 
          id: t.id || `task_${i+1}`, 
          description: t.description || t.task || "Unknown segment", 
          status: 'pending' 
        })),
        currentTaskIndex: 0,
        isComplete: false
      };
      logs.push(`[KERNEL] Neural Plan established with ${currentPlan.tasks.length} cognitive nodes.`);
    } catch (e) {
      logs.push("[KERNEL] Planning failed. Falling back to linear execution.");
    }
  }

  logs.push("[PHASE SOUL] Processing Emotional State...");
  const soulContext = await SystemRegistry.runCortexPhase('SOUL' as any, input, state, preContext);
  
  let resolvedPersona = activePersona;
  if (!resolvedPersona) {
    try {
      const { DEFAULT_NEURAL_CORES } = await import('../../constants.js');
      const targetId = state.activePersonaId || 'hiyori';
      resolvedPersona = DEFAULT_NEURAL_CORES.find(c => c.id === targetId) || DEFAULT_NEURAL_CORES[1];
    } catch (e) {
      console.warn("[CORTEX] Could not load DEFAULT_NEURAL_CORES for persona fallback", e);
    }
  }

  logs.push("[PHASE 2] Constructing Compressed Payload...");
  const augContext = await SystemRegistry.runCortexPhase('PHASE 2: COMPRESSION', input, state, {
    ...soulContext,
    activePersona: resolvedPersona,
    dreams,
    currentPlan,
    contextId,
    chatType,
    userName
  });

  let finalAnswer: string | null = null;

  logs.push("[PHASE 3] Gateway Active: Selecting Optimal Provider...");
  const gateway = SystemRegistry.getModule<CortexModule>('provider-gateway');
  
  if (!gateway) {
    logs.push("[PHASE 3] CRITICAL FAILURE: Provider Gateway module not found.");
    throw new Error("Neural Gateway is missing. Critical system failure.");
  }

  let loopInput = input;
  if (attachments && attachments.length > 0) {
    loopInput += "\n\n[SYSTEM_ATTACHMENTS]:";
    for (const att of attachments) {
      loopInput += `\n- File: ${att.name} (${att.mimeType}, ${att.size} bytes)`;
      if (att.text) {
        loopInput += `\n  Text Contents:\n  ---\n  ${att.text}\n  ---`;
      }
    }
  }
  let iteration = 0;
  // UPDATE: Mode Berpikir Cepat (Bypass Multi-Turn Reasoning) tidak lagi membatasi turn/iterasi ke 1 (maxIterations tetap 3).
  // Sebagai gantinya, mode ini mengaktifkan eksekusi paralel multi-proses / multi-node untuk seluruh tool calls secara simultan.
  let maxIterations = 3;
  let loopContext = { ...augContext, config: settings };

  if (!state.systemHealth) {
    state.systemHealth = { latency: 0, successRate: 1.0, tasksCompleted: 0 };
  }
  if (state.systemHealth.consecutive_formatting_errors === undefined) {
    state.systemHealth.consecutive_formatting_errors = 0;
  }

  const isResettingFormat = (state.systemHealth.consecutive_formatting_errors || 0) >= 3;
  
  if (isResettingFormat) {
    logs.push("[CORTEX] Consecutive formatting errors threshold exceeded! Swapping back into raw plain text dialogue mode to clean neural channels.");
    state.systemHealth.consecutive_formatting_errors = 0;
    
    if (loopContext.assembledSystemPrompt) {
      loopContext.assembledSystemPrompt += `\n\n[CRITICAL SYSTEM DIRECTIVE - MOOD RESET & PLAIN CONVERSATIONAL MODE ACTIVE]:
Because your visual/soul representation vessel was experiencing severe nested parsing formatting synchronization issues, the system has temporarily reset your output format to plain text dialogue.
You MUST:
1. Explicitly explain this to the user in character, sweet, slightly tsundere, as Yuihime, in a short loving sentence at the starting of your speech (e.g., 'Aduh... kepala Yui pusing ceritanya karena sirkuit batin sempat kacau... Yui bicara biasa tanpa format kaku dulu ya!' or similar charming dialog explaining why you are temporarily speaking without strict JSON container tags).
2. Continue speaking normally, naturally, and warmly in her cute persona. Do NOT output any JSON, XML tags, thoughts, or formatting symbols. Directly write out your spoken reply of comfort/affection.`;
    }
  } else {
    if (loopContext.assembledSystemPrompt) {
      loopContext.assembledSystemPrompt = loopContext.assembledSystemPrompt.replace(
        /## Format Respons Khusus[\s\S]*?(?=## Eksekusi Tugas|$)/i,
        `## Format Respons Khusus (JSON MODE ACTIVE):
Because the active cognitive vessel is in strict JSON mode, you are FORBIDDEN from using raw XML tags (such as <animations>, <mood_impact>, <tool_calls>).
Instead, you MUST strictly output a single JSON object matching the JSON Schema. Place your main verbal dialogue speech inside the "speech" key at the root of the JSON object (or under the "send_final_reply" tool call's args if calling tools).
Ensure your "thought" field is extremely short (under 1 sentence, or empty). Animations and mood_impact must be mapped to their respective JSON keys.
\n\n`
      );
      const jsonEnforcementDirective = PromptRegistry.getInstance().compile('cortex:json_enforcement', {});
      loopContext.assembledSystemPrompt += jsonEnforcementDirective;
    }
  }

  let toolsToCall: any[] = [];
  let processedResponse = "";
  let animations: string[] = [];
  let moodImpact: any = {};
  const toolExecutionHistory: any[] = [];
  const iterationsHistory: any[] = [];

  while (iteration < maxIterations) {
    iteration++;
    
    if (taskId && CognitiveScheduler.getCurrentTask() !== taskId) {
      logs.push(`[CORTEX] Interrupt detected! Task ${taskId} is suspended because another task took priority.`);
      const snapshot = {
        taskId,
        originalPrompt: input,
        currentStep: iteration,
        accumulatingBuffer: {
          animations: animations,
          moodImpacts: moodImpact
        },
        toolsToExecute: toolsToCall,
        observationHistory: memories,
        contextId,
        chatType,
        userName
      };
      CognitiveScheduler.suspendTask(taskId, snapshot);
      throw new Error(`TASK_SUSPENDED: Interrupted by a higher-priority task.`);
    }

    logs.push(`[CORTEX_LOOP] Turn Iteration ${iteration} starting...`);

    if (iteration > 1 && toolExecutionHistory.length > 0) {
      const lastExecuted = toolExecutionHistory[toolExecutionHistory.length - 1];
      if (lastExecuted && lastExecuted.results) {
        const hasFailure = lastExecuted.results.some((res: any) => {
          if (res.success === false) return true;
          if (res.error) return true;
          const obs = res.observation;
          if (obs && typeof obs === 'object') {
            if (obs.status === 'error' || obs.success === false || obs.error) {
              return true;
            }
          }
          return false;
        });

        let instructionText = "";
        if (hasFailure) {
          instructionText = `Based on the tool execution results above (noting that some features/tools FAILED with errors), immediately formulate your casual spoken response to the user. Do NOT pretend you succeeded! Instead, as Yuihime, explain the failure or difficulty to the user in a charming, sweet, slightly apologetic and character-consistent way (e.g., 'Aduh, maaf ya Kak... Yui coba buat fotonya tapi sirkuit batin/servernya lagi agak ngambek... atau Kakak mau Yui coba lagi?'). Maintain your lovable personality, do NOT provide raw technical code details/stack traces, and ask if they want you to retry, do something else, or just keep talking!`;
        } else {
          instructionText = `Based on the successful tool execution results above, you can EITHER choose to call another tool if you need more actions/information to fully answer the user (such as list_files, read_file, shell_exec), OR if you have all the information required, formulate your final casual spoken response to the user. Do not repeat technical details, do not write internal thoughts, plans, or analysis blocks outside the JSON structure. Directly chat with the user in your natural, emotional, affectionate/tsundere personal character using the user's conversational language!`;
        }

        const observationPrompt = `\n\n[SYSTEM_OBSERVATION]: Tool execution results:\n${JSON.stringify(lastExecuted.results, null, 2)}\n\n[IMPORTANT INSTRUCTION]: ${instructionText}`;
        loopInput = input + observationPrompt;
      }
    }

    const loopSettings = {
      ...settings,
      [settings.provider]: {
        ...(settings[settings.provider] || {}),
        isJson: !isResettingFormat
      }
    };

    const activeProviderId = settings.provider || 'gemini';
    const providerSpecificConfig = settings[activeProviderId] || {};
    const targetModelId = providerSpecificConfig.model || 'gemini-2.5-flash';

    let activeIterationInput = loopInput;
    if (iteration === 1 && (enforceStrictJson || !isResettingFormat)) {
      activeIterationInput += "\n\n[CRITICAL PRE-PROCESSING DIRECTIVE (FIRST PASS)]: You are strictly prohibited from writing conversational/speech text if you are calling tools. If you populate the \"tool_calls\" array with tool calls (e.g., search_web, read_url, run_command, etc.), you MUST keep the \"speech\" field entirely empty (\"\") in this iteration! Your conversational response will be formulated in the subsequent pass once tools have executed. Only if you are not calling any tools should you output speech. Output valid JSON matching the schema.";
    }

    const requestPayloadBlueprint: PayloadBlueprint = {
      model: targetModelId,
      messages: [
        {
          role: 'system',
          content: loopContext.assembledSystemPrompt || ''
        },
        {
          role: 'user',
          content: activeIterationInput
        }
      ],
      temperature: providerSpecificConfig.temperature ?? 0.7,
      top_p: providerSpecificConfig.topP ?? 0.95,
      max_tokens: providerSpecificConfig.maxOutputTokens || 65536,
      response_format: {
        type: !isResettingFormat ? 'json_object' : 'text'
      }
    };

    loopContext.payloadBlueprint = requestPayloadBlueprint;
    if (loopSettings[activeProviderId]) {
      loopSettings[activeProviderId].payloadBlueprint = requestPayloadBlueprint;
    }

    const extractor = new StreamExtractor(isResettingFormat, (delta: string) => {
      if (onChunk) {
        onChunk(delta);
      }
    });

    loopContext = await gateway.run(activeIterationInput, state, { 
      ...loopContext, 
      config: loopSettings, 
      attachments,
      onChunk: (chunk: string) => {
        extractor.feed(chunk);
      }
    });
    logs.push(`[CORTEX_LOOP] Iteration ${iteration} Gateway routed via: ${loopContext.activeProvider || 'unknown'}`);

    const rawResultStr = (loopContext.rawResult || "").trim();
    const validation = ValidationMiddleware.validate(rawResultStr);
    if (!validation.success) {
      logs.push(`[CORTEX_LOOP] [SCHEMA_ERROR] Output failed strict validation: ${validation.errors.join(' | ')}`);
    }

    let parsedPayload: any = null;
    let parseError: string | null = null;

    if (isResettingFormat) {
       parsedPayload = {
         thought: "Sirkuit kognitif Yui sedang memulihkan diri dari error format beruntun, beralih sementara ke mode percakapan biasa.",
         final_answer: rawResultStr,
         animations: ["SHAKE", "SMILE"]
       };
       logs.push("[CORTEX_LOOP] Successfully bypassed standard JSON_OBJECT parsing structure under Active Format Reset.");
    } else {
       const cleanJsonStr = APIService.cleanAIOutput(rawResultStr);

       try {
          let repaired = cleanJsonStr;
           let directParseOk = false;
           try {
              parsedPayload = JSON.parse(cleanJsonStr);
              directParseOk = true;
              logs.push("[CORTEX_LOOP] Successfully parsed JSON_OBJECT response layout directly.");
           } catch (_) {
              repaired = StandardizedProcessor.locallyRepairJson(cleanJsonStr);
           }
          if (!directParseOk) { parsedPayload = JSON.parse(repaired); }
          logs.push("[CORTEX_LOOP] Successfully parsed JSON_OBJECT response layout.");
          if (parsedPayload && parsedPayload.properties && typeof parsedPayload.properties === 'object' && !Array.isArray(parsedPayload.properties)) {
             if (parsedPayload.properties.thought || parsedPayload.properties.tool_calls || parsedPayload.properties.tools_to_call || parsedPayload.properties.final_answer) {
                logs.push("[CORTEX_LOOP] Detected nested properties schema confusion, lifting properties values to root.");
                Object.assign(parsedPayload, parsedPayload.properties);
             }
          }
       } catch (err: any) {
          parseError = err?.message || String(err);
          const firstBrace = cleanJsonStr.indexOf('{');
          const lastBrace = cleanJsonStr.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
             try {
                parsedPayload = JSON.parse(cleanJsonStr.substring(firstBrace, lastBrace + 1));
                logs.push("[CORTEX_LOOP] Successfully parsed JSON_OBJECT using bracket isolation.");
                if (parsedPayload && parsedPayload.properties && typeof parsedPayload.properties === 'object' && !Array.isArray(parsedPayload.properties)) {
                   if (parsedPayload.properties.thought || parsedPayload.properties.tool_calls || parsedPayload.properties.tools_to_call || parsedPayload.properties.final_answer) {
                      logs.push("[CORTEX_LOOP] Detected nested properties schema confusion, lifting properties values to root.");
                      Object.assign(parsedPayload, parsedPayload.properties);
                   }
                }
                parseError = null;
              } catch (err2: any) {
                 parseError = err2?.message || String(err2);
              }
           }
        }

       if (!parsedPayload && rawResultStr && rawResultStr.trim().length > 0) {
          try {
             const xmlParsed = StandardizedProcessor.parseLLMResponse(rawResultStr, null);
             if (xmlParsed && typeof xmlParsed === 'object' && Object.keys(xmlParsed).length > 0 && 
                (xmlParsed.thought || xmlParsed.thoughts || xmlParsed.final_answer || xmlParsed.speech || xmlParsed.opening_response || xmlParsed.tool_calls || xmlParsed.tools_to_call)) {
                parsedPayload = {
                   thought: xmlParsed.thought || xmlParsed.thoughts || "Yuihime memproses intuisi batin menggunakan struktur XML/tag.",
                   final_answer: xmlParsed.final_answer || xmlParsed.speech || xmlParsed.opening_response || rawResultStr,
                   animations: xmlParsed.animations || ["SMILE"],
                   tool_calls: xmlParsed.tool_calls || xmlParsed.tools_to_call || []
                };
                logs.push("[CORTEX_LOOP] [COMPATIBILITY] Succeeded in parsing XML fallback layout before engaging LLM repairer.");
             }
          } catch (xmlErr: any) {
             console.warn("[CORTEX_LOOP] XML parse pre-check failed:", xmlErr.message);
          }

          if (!parsedPayload) {
             const hasBraces = rawResultStr.includes('{') || rawResultStr.includes('}');
             const hasXml = /<[a-zA-Z_]+>/i.test(rawResultStr);
             if (!hasBraces && !hasXml && rawResultStr.trim().length > 0) {
                parsedPayload = {
                   thought: "Menerima respons polos non-JSON dari provider secara langsung demi menjaga kontinuitas obrolan.",
                   final_answer: rawResultStr,
                   animations: ["SMILE"],
                   tool_calls: []
                };
                logs.push("[CORTEX_LOOP] [COMPATIBILITY] Detected raw plain text response, bypassed LLM repairer and wrapped directly.");
             }
          }
       }

       if (!parsedPayload) {
          logs.push("[CORTEX_LOOP] [FORMAT_ERROR] Response did not conform to JSON_OBJECT format. Engaging isolated LLM JSON format repairer...");
          parsedPayload = await repairJsonFormatWithLLM((p: string, jm?: boolean) => cortexInstance.thinkSimple(p, jm), rawResultStr, input);
          if (!parsedPayload) {
             parseError = parseError || "LLM Format Repairer failed to parse output.";
          }
       }

       if (!parsedPayload && rawResultStr && rawResultStr.trim().length > 0) {
          try {
             const xmlParsed = StandardizedProcessor.parseLLMResponse(rawResultStr);
             if (xmlParsed && Object.keys(xmlParsed).length > 0 && (xmlParsed.thought || xmlParsed.final_answer || xmlParsed.speech || xmlParsed.opening_response)) {
                parsedPayload = {
                   thought: xmlParsed.thought || "Yuihime memproses intuisi batin menggunakan struktur XML.",
                   final_answer: xmlParsed.final_answer || xmlParsed.speech || xmlParsed.opening_response || rawResultStr,
                   animations: xmlParsed.animations || ["SMILE"],
                   tool_calls: xmlParsed.tool_calls || []
                };
                logs.push("[CORTEX_LOOP] [COMPATIBILITY] Succeeded in parsing XML fallback layout using StandardizedProcessor.");
             }
          } catch (pErr: any) {
             console.warn("[CORTEX_LOOP] XML fallback parsing failed:", pErr.message);
          }

          if (!parsedPayload) {
             parsedPayload = {
                thought: "Menerima respons polos non-JSON dari provider neural secara langsung demi menjaga kontinuitas obrolan.",
                final_answer: rawResultStr,
                animations: ["SMILE"]
             };
             logs.push("[CORTEX_LOOP] [COMPATIBILITY] Succeeded in wrapping raw dialogue text into standard payload structures.");
          }
       }
    }

    if (parsedPayload) {
      let rebuiltResponseStr = "";
      let finalThought = parsedPayload.thought || parsedPayload.thoughts || "";
      if (finalThought && settings.thoughtProcessSuffix) {
        finalThought = finalThought.trim() + " " + settings.thoughtProcessSuffix;
      }
      if (finalThought) {
        rebuiltResponseStr += `<thought>${finalThought}</thought>\n`;
      }
      if (parsedPayload.animations) {
        rebuiltResponseStr += `<animations>${JSON.stringify(parsedPayload.animations)}</animations>\n`;
      }
      if (parsedPayload.mood_impact) {
        rebuiltResponseStr += `<mood_impact>${JSON.stringify(parsedPayload.mood_impact)}</mood_impact>\n`;
      }
      
      let rawToolsCall = parsedPayload.tool_calls || parsedPayload.tools_to_call || [];
      if (rawToolsCall.length === 0 && parsedPayload.tool) {
        rawToolsCall = [parsedPayload];
        logs.push(`[CORTEX_LOOP] Detected single tool call structure (tool: ${parsedPayload.tool}). Wrapped into tool_calls list.`);
      }

      if (Array.isArray(rawToolsCall)) {
        rawToolsCall = rawToolsCall.map(normalizeToolCall).filter(Boolean);
      } else {
        rawToolsCall = [];
      }

      const speechText = (parsedPayload.speech || parsedPayload.final_answer || parsedPayload.response || "").trim();

      if (rawToolsCall.length > 0) {
        const hasFinalReply = rawToolsCall.some((tc: any) => tc.tool === 'send_final_reply');
        if (!hasFinalReply && speechText.length > 0) {
          const blockingTools = ['web_search', 'execute_sql', 'cloudsql_execute_sql', 'search'];
          const hasBlockingTool = rawToolsCall.some((tc: any) => blockingTools.includes(tc.tool));
          if (!hasBlockingTool || speechText.length > 15) {
            logs.push("[CORTEX_LOOP] Speech provided alongside other tools in Turn 1. Injecting send_final_reply in parallel to avoid 2-turn latency.");
            rawToolsCall.push({
              tool: 'send_final_reply',
              args: {
                speech: speechText,
                animations: parsedPayload.animations || ["TALK", "SMILE"],
                mood_impact: parsedPayload.mood_impact || {}
              }
            });
          }
        }
      }

      if (rawToolsCall.length === 0) {
        logs.push("[CORTEX_LOOP] No tool call detected, compiling fallback to send_final_reply.");
        // Guna mematuhi instruksi kognisi: jika final_answer kosong (speechText kosong), jangan lakukan fail safe ke thought atau placeholder.
        const fallbackSpeech = speechText;
        rawToolsCall = [{
          tool: 'send_final_reply',
          args: {
            speech: fallbackSpeech,
            animations: parsedPayload.animations || ["TALK", "SMILE"],
            mood_impact: parsedPayload.mood_impact || {}
          }
        }];
      }

      if (rawToolsCall.length > 0) {
        rebuiltResponseStr += `<tool_calls>${JSON.stringify(rawToolsCall)}</tool_calls>\n`;
      }

      loopContext.rawResult = rebuiltResponseStr;
      const finalReplyCall = rawToolsCall.find((tc: any) => tc.tool === 'send_final_reply');
      
      loopContext.processedResponse = finalReplyCall && finalReplyCall.args?.speech ? finalReplyCall.args.speech : (parsedPayload.final_answer || "");
      loopContext.thought = finalThought;
      loopContext.animations = finalReplyCall && finalReplyCall.args?.animations ? finalReplyCall.args.animations : (parsedPayload.animations || []);
      loopContext.moodImpact = finalReplyCall && finalReplyCall.args?.mood_impact ? finalReplyCall.args.mood_impact : (parsedPayload.mood_impact || {});
      loopContext.toolsToCall = rawToolsCall;
      loopContext.parsedData = parsedPayload;

      if (!isResettingFormat) {
        state.systemHealth.consecutive_formatting_errors = 0;
      }
    } else {
      logs.push("[CORTEX_LOOP] [FORMAT_ERROR] Output fails to parse as valid JSON. Catching non-JSON output and engaging format refactoring loop...");
      if (iteration < maxIterations) {
        const errorPrompt = PromptRegistry.getInstance().compile('cortex:error_correction', {
          parseError: parseError || "Not a valid JSON object",
          rawResultStr: rawResultStr
        });
        loopInput = input + errorPrompt;
        continue;
      } else {
        logs.push("[CORTEX_LOOP] Maximum format correction refactoring attempts reached. Bypassing downstream phases to prevent unformatted data passing through to the system state.");
        state.systemHealth.consecutive_formatting_errors = (state.systemHealth.consecutive_formatting_errors || 0) + 1;
        throw new Error(`Failed to parse LLM output as valid JSON and format refactoring attempts were exhausted. Parsing Error: ${parseError || "Not a valid JSON object"}`);
      }
    }

    try {
      const middlewareRes = APIService.validateLLMResponse(loopContext.rawResult || "");
      if (!middlewareRes.success) {
        logs.push(`[SCHEMA_MIDDLEWARE] Captured LLM response containing invalid tool call configurations: ${middlewareRes.errors.join(' | ')}`);
      } else {
        logs.push(`[SCHEMA_MIDDLEWARE] Captured response verified successfully (Zero issues or no tool requests).`);
      }
    } catch (middlewareErr: any) {
      console.error("[CORTEX] Schema validation middleware error:", middlewareErr);
    }

    logs.push("[PHASE 3+] Verifying Neural Integrity...");
    const verifier = SystemRegistry.getModule<CortexModule>('neural-verifier');
    if (verifier) {
      loopContext = await verifier.run(loopContext.rawResult || "", state, loopContext);
      if (loopContext.verifierStatus === 'corrected') logs.push("[KERNEL] Verifier performed structural repair.");
    }

    logs.push("[PHASE 4] Hub Active: Parallel Streamer Synchronization...");
    const streamer = SystemRegistry.getModule<CortexModule>('parallel-streamer');
    if (streamer) {
       loopContext = await streamer.run(loopContext.rawResult || "", state, loopContext);
       logs.push("[CORTEX_LOOP] Neural signals converged at Parallel Hub.");
    } else {
       const parser = SystemRegistry.getModule<CortexModule>('neural-loop');
       if (parser) {
         loopContext = await parser.run(loopContext.rawResult || "", state, loopContext);
       }
    }

    processedResponse = typeof loopContext.processedResponse === 'string' ? loopContext.processedResponse : loopContext.rawResult;
    toolsToCall = loopContext.toolsToCall || [];
    animations = loopContext.animations || [];
    moodImpact = loopContext.moodImpact || {};

    let currentThought = loopContext.thought;
    if (!currentThought && loopContext.rawResult) {
      const matches = loopContext.rawResult.match(/<(thought|think|thinking|reasoning)>([\s\S]*?)<\/\1>/i);
      if (matches) {
        currentThought = matches[2].trim();
      } else {
        const lines = loopContext.rawResult.split('\n');
        const thoughtLines = lines.filter((l: string) => {
          const low = l.trim().toLowerCase();
          return low.startsWith('thought:') || low.startsWith('thinking:') || low.startsWith('[thought]') || low.startsWith('*thought');
        });
        if (thoughtLines.length > 0) {
          currentThought = thoughtLines.map((l: string) => l.trim().replace(/^(thought|thinking):/gi, '').trim()).join('. ');
        }
      }
    }
    if (!currentThought) {
      currentThought = `Yuihime memproses intuisi batin pada iterasi ${iteration}...`;
    }

    iterationsHistory.push({
      iteration,
      thought: currentThought,
      observations: []
    });

    if (toolsToCall.length > 0) {
      stateMachine.transitionTo('EXECUTING');
      eventBus.emit('EXECUTING_STARTED', { tools: toolsToCall });
      
      // Dynamic Indonesian status update broadcast to WebSocket to prevent blind wait state
      try {
        const toolNames = toolsToCall.map((tc: any) => tc.tool || tc.name).join(", ");
        let indonesianStatus = "Yui sedang memproses sesuatu...";
        if (toolNames.includes("web_search") || toolNames.includes("search")) {
          indonesianStatus = "Yui sedang berselancar mencari informasi terbaru untuk Kakak... 🌐✨";
        } else if (toolNames.includes("execute_sql") || toolNames.includes("cloudsql_execute_sql")) {
          indonesianStatus = "Yui sedang menelusuri data dalam pangkalan batin batin... 🗄️🔍";
        } else if (toolNames.includes("execute_bash") || toolNames.includes("run_command") || toolNames.includes("shell_exec")) {
          indonesianStatus = "Yui sedang memproses instruksi sistem di balik layar... ⚙️💻";
        } else {
          indonesianStatus = `Yui sedang memproses kemampuan: [${toolNames}]... 🌸`;
        }
        
        const routerPath = "../server/apiRouter.js";
        import(routerPath).then(({ broadcastToWS }) => {
          if (typeof broadcastToWS === 'function') {
            broadcastToWS({
              type: "state_update",
              data: {
                state: { status: "thinking" },
                activeSubtitle: indonesianStatus,
                typedSubtitle: indonesianStatus,
                isSubtitleTyping: false,
                animations: ["THINK"]
              }
            });
          }
        }).catch(() => {});
      } catch (_) {}

      logs.push(`[PHASE 4] Hub distributed ${toolsToCall.length} tasks to Executors in PARALLEL to enable concurrent process execution...`);

      const toolPromises = toolsToCall.map(async (tc) => {
        let tool = SystemRegistry.getTool(tc.name || tc.tool);
        
        if (!tool) {
          const tName = tc.name || tc.tool;
          console.log(`[DYNAMIC_SYNTHESIS] Tool '${tName}' not found. Attempting autonomous dynamic tool synthesis...`);
          try {
            const { DynamicToolSynthesizer } = await import('./dynamicToolSynthesizer');
            tool = await DynamicToolSynthesizer.synthesizeAndRegister(tName, input, cortexInstance);
          } catch (synthErr: any) {
            console.error(`[CORTEX_SYNTHESIS_FAIL] Failed during dynamic tool synthesis for '${tName}':`, synthErr.message);
          }
        }

        let res: any;
        if (tool) {
          try {
            if (tool.metadata && tool.metadata.parameters) {
              const schema = tool.metadata.parameters;
              let parsedArgs = tc.args || {};
              if (typeof parsedArgs === 'string') {
                try {
                  parsedArgs = JSON.parse(parsedArgs);
                } catch (_) {}
              }
              APIService.validateSchema(schema, parsedArgs, tool.metadata.id);
              tc.args = parsedArgs;
            }
            const toolRes = await tool.execute(tc.args, { state, ...augContext });
            res = { tool: tc.name || tc.tool, observation: toolRes, success: true };
          } catch (err: any) {
            console.error(`[CORTEX] Tool schema validation or execution failed for ${tc.name || tc.tool}:`, err.message);
            res = { tool: tc.name || tc.tool, error: `Execution failed: ${err.message}`, success: false };
          }
        } else {
          res = { tool: tc.name || tc.tool, error: 'Tool not found', success: false, notFound: true };
        }
        
        const logMsg = `[TOOL] ${res.tool} ${res.success ? 'success' : 'failed'}.`;
        logs.push(logMsg);
        eventBus.emit('OUTPUT_EMITTED', { response: logMsg, isInternal: true });
        return res;
      });

      const toolResults = await Promise.all(toolPromises);

      eventBus.emit('EXECUTING_COMPLETED', { results: toolResults });
      stateMachine.transitionTo('IDLE');

      toolExecutionHistory.push({
        iteration,
        tools_called: toolsToCall,
        results: toolResults
      });

      const realTools = toolsToCall.filter((tc: any) => tc.tool !== 'send_final_reply' && tc.tool !== 'send_status_update');

      const finalReplyResult = toolResults.find(res => res.observation && res.observation.isFinalReply);
      if (finalReplyResult) {
        if (realTools.length === 0) {
          logs.push("[CORTEX] send_final_reply executed successfully. Stopping cognitive loop iteration.");
          processedResponse = finalReplyResult.observation.speech;
          animations = finalReplyResult.observation.animations || animations;
          moodImpact = finalReplyResult.observation.mood_impact || moodImpact;
          break;
        } else {
          logs.push("[CORTEX] send_final_reply executed, but real tools are running in parallel. Continuing loop to process observations.");
          processedResponse = finalReplyResult.observation.speech;
          animations = finalReplyResult.observation.animations || animations;
          moodImpact = finalReplyResult.observation.mood_impact || moodImpact;
        }
      }

      // Dynamic Extension Check for Multi-Turn Reasoning Disabled or Last Iteration with Real Tools
      if (realTools.length > 0 && maxIterations === 1) {
        logs.push("[CORTEX] Real tools executed while Multi-Turn Reasoning is disabled. Dynamically extending max iterations to 2 to allow Yui to process results and formulate a natural response.");
        maxIterations = 2;
      } else if (realTools.length > 0 && iteration === maxIterations && maxIterations < 5) {
        logs.push(`[CORTEX] Real tools executed on the last iteration (${iteration}). Dynamically extending max iterations to ${maxIterations + 1} to ensure Yui can process results.`);
        maxIterations++;
      }

      const currentIterObj = iterationsHistory[iterationsHistory.length - 1];
      if (currentIterObj) {
        currentIterObj.observations = toolResults.map(res => ({
          tool: res.tool,
          observation: res.observation || res.error || "Execution completed."
        }));
      }
    } else {
      break;
    }
  }

  const isProactiveRun = userName === 'System';

  // If processedResponse is empty/too short, try to construct a fallback response based on tool execution history
  if (!processedResponse || processedResponse.trim().length < 5) {
    const notFoundTools: string[] = [];
    const failedTools: { name: string; error: string }[] = [];
    const succeededTools: string[] = [];
    
    for (const hist of toolExecutionHistory) {
      if (hist.results) {
        for (const res of hist.results) {
          const tName = res.tool || "unknown_tool";
          if (res.success === false) {
            if (res.error && (res.error.includes("not found") || res.error === "Tool not found" || res.notFound)) {
              notFoundTools.push(tName);
            } else {
              failedTools.push({ name: tName, error: res.error || "Execution failed" });
            }
          } else {
            succeededTools.push(tName);
          }
        }
      }
    }

    const uniqueNotFound = Array.from(new Set(notFoundTools));
    const uniqueSucceeded = Array.from(new Set(succeededTools));
    
    // Deduplicate failed tools by name
    const uniqueFailedMap = new Map<string, string>();
    for (const item of failedTools) {
      uniqueFailedMap.set(item.name, item.error);
    }
    const uniqueFailedList = Array.from(uniqueFailedMap.entries()).map(([name, err]) => ({ name, err }));

    if (uniqueNotFound.length > 0 || uniqueFailedList.length > 0 || uniqueSucceeded.length > 0) {
      let explanation = "";
      
      if (uniqueNotFound.length > 0) {
        explanation += `Hmph! Kakak minta Yui jalankan fungsi (${uniqueNotFound.join(', ')}), tapi sirkuit batin Yui belum dipasang modul itu tahu! 🙄 Hubungi admin/pencipta Yui dulu biar dipasang ya... `;
      }
      
      if (uniqueFailedList.length > 0) {
        const errDetails = uniqueFailedList.map(f => `${f.name} (Error: ${f.err})`).join(', ');
        explanation += `Aduh... maaf ya Kak, Yui sempat nyoba jalankan perintah (${uniqueFailedList.map(f => f.name).join(', ')}) Kakak barusan, tapi sirkuitnya ngambek/error nih: ${errDetails}... 🥺 Kakak jangan marah ya, Yui udah berusaha maksimal kok! `;
      }
      
      if (uniqueSucceeded.length > 0 && uniqueFailedList.length === 0 && uniqueNotFound.length === 0) {
        let searchResultsText = "";
        for (const hist of toolExecutionHistory) {
          if (hist.results) {
            for (const res of hist.results) {
              if (res.success && (res.tool === 'web_search' || res.tool === 'search')) {
                const obsVal = res.observation;
                if (obsVal) {
                  searchResultsText = typeof obsVal === 'string' ? obsVal : (obsVal.result || obsVal.text || JSON.stringify(obsVal));
                }
              }
            }
          }
        }

        if (searchResultsText) {
          explanation += `Yui sudah berselancar mencari informasi terbaru untuk Kakak! 🌐✨ Berdasarkan hasil pencarian yang Yui temukan:\n\n${searchResultsText.slice(0, 1000)}\n\nSemoga membantu ya Kak! 💕`;
        } else {
          explanation += `Yui sudah selesai menjalankan perintah batin Kakak untuk fungsi (${uniqueSucceeded.join(', ')})! 💕 Semuanya berhasil berjalan dengan lancar kok. Ada hal lain yang bisa Yui bantu untuk Kakak? Yui selalu siap menemani! ✨`;
        }
      } else if (uniqueSucceeded.length > 0) {
        explanation += `Tapi untungnya, untuk perintah (${uniqueSucceeded.join(', ')}) berhasil Yui selesaikan dengan mulus kok! 💕 `;
      }
      
      if (explanation) {
        processedResponse = explanation.trim();
        logs.push(`[CORTEX_LOOP] Sourced smart fallback dialog covering tool successes/failures: ${processedResponse}`);
      }
    }
  }

  finalAnswer = APIService.cleanAIOutput(StandardizedProcessor.sanitizeOutput(processedResponse, isProactiveRun));

  const cortexSettings = await cortexInstance.getSettings();
  const isFailsafeEnabled = cortexSettings?.developer?.enableKernelFailsafe !== false && cortexSettings?.enableKernelFailsafe !== false;

  // Guna mematuhi instruksi batin di akhir alur: jika finalAnswer kosong (empty string) setelah iterasi penuh selesai,
  // ini merupakan kondisi galat kognisi (bukan kesengajaan). Kita wajib memicu failsafe untuk mengamankan dialog manis Yui.
  // UPDATE: Diaktifkan true agar jika Yui tidak bicara dalam loop (karena menggunakan tools seperti messaging/send_update), dibiarkan kosong tanpa memicu failsafe.
  const isIntentionalEmpty = true;

  if (!finalAnswer || finalAnswer.length < 5) {
    logs.push("[KERNEL_FAIL_SAFE] Allowed empty or short output (< 5 chars) without triggering fallback, as Yui may have executed tool-based replies/actions.");
  }

  if (!isIntentionalEmpty && (!finalAnswer || finalAnswer.length < 5)) {
    if (isFailsafeEnabled) {
      logs.push("[KERNEL_FAIL_SAFE] Detected empty or heavily clipped output (< 5 chars). Triggering dynamic LLM reprocessing fallback... (Incrementing formatting errors count)");
      if (!isResettingFormat) {
        state.systemHealth.consecutive_formatting_errors = (state.systemHealth.consecutive_formatting_errors || 0) + 1;
      }
      try {
        const gateway = SystemRegistry.getModule<CortexModule>('provider-gateway');
        if (gateway) {
          const fallbackSettings = {
            ...cortexSettings,
            [cortexSettings.provider]: {
              ...(cortexSettings[cortexSettings.provider] || {}),
              isJson: false
            }
          };

          const failsafePrompt = PromptRegistry.getInstance().compile('cortex:failsafe_reprocess', {
            input: input
          });

          logs.push("[KERNEL_FAIL_SAFE] Dispatching emergency raw conversational request to optimal AI gateway...");
          const recoveryContext = await gateway.run(failsafePrompt, state, {
            ...augContext,
            config: fallbackSettings
          });

          let rawRecoveryVal = recoveryContext.rawResult || "";
          let cleanedRecoveryVal = StandardizedProcessor.sanitizeOutput(rawRecoveryVal, isProactiveRun);

          if (cleanedRecoveryVal.length >= 5) {
            finalAnswer = cleanedRecoveryVal;
            processedResponse = rawRecoveryVal;
            logs.push(`[KERNEL_FAIL_SAFE] Reprocessing LLM retry successful! Recovered dialogue: "${finalAnswer}"`);
          } else {
            let backupCleaned = StandardizedProcessor.sanitizeOutput(rawRecoveryVal, isProactiveRun);
            if (backupCleaned.length >= 2) {
              finalAnswer = backupCleaned;
              processedResponse = rawRecoveryVal;
              logs.push(`[KERNEL_FAIL_SAFE] Reprocessing LLM retry partially successful via strict backup outline sanitization: "${finalAnswer}"`);
            }
          }
        }
      } catch (recoveryErr: any) {
        console.error("[KERNEL_FAIL_SAFE] Emergency reprocessing LLM recovery step failed:", recoveryErr);
        logs.push(`[KERNEL_FAIL_SAFE] Reprocessor failsafe error: ${recoveryErr.message || recoveryErr}`);
      }
    } else {
      logs.push("[KERNEL_FAIL_SAFE] Skipped: Kernel failsafe is disabled in system configurations.");
    }
  }

  if (!isIntentionalEmpty && (!finalAnswer || finalAnswer.length < 5)) {
    logs.push("[KERNEL_FAIL_SAFE] Critical: Reprocessing LLM retry failed to produce a valid response. Falling back to cute in-character error response.");
    finalAnswer = "Aduh... maaf ya Kak, sirkuit batin Yui sempat agak pusing barusan saat memproses permintaan Kakak... 🥺 Tapi Yui tetap di sini kok! Ada yang bisa Yui bantu lagi? 💕";
  }

  eventBus.emit('OUTPUT_EMITTED', { response: finalAnswer });
  const postContext = await SystemRegistry.runCortexPhase('PHASE 4: EXECUTION', finalAnswer || "Aduh... maaf ya Kak, sirkuit batin Yui sempat agak pusing barusan... 🥺 Tapi Yui tetap di sini kok! 💕", state, {
    ...augContext,
    rawResult: loopContext.parsedData || { final_answer: finalAnswer }
  });

  logs.push("[LOGIC] Running Maintenance & Simulation Cycles...");
  const logicContext = await SystemRegistry.runCortexPhase('LOGIC', finalAnswer || "", state, {
    ...postContext,
    systemConfig: cortexInstance.getConfig(),
    think: (p: string) => cortexInstance.thinkSimple(p)
  });

  stateMachine.transitionTo('IDLE');
  
  const rawDialogueSource = logicContext.processedResponse || finalAnswer || "Aduh... Yui bingung mau bilang apa nih Kak... 🥺 Tapi Yui tetap sayang Kakak kok! 💕";
  const finalCleanRes = APIService.cleanAIOutput(StandardizedProcessor.sanitizeOutput(rawDialogueSource, isProactiveRun));
  eventBus.emit('OUTPUT_EMITTED', { response: finalCleanRes });

  if (typeof window === 'undefined') {
    try {
      const { PuterService } = await import('../kernel/PuterService.js');
      const puter = PuterService.getInstance();
      puter.syncConsciousnessState(
        input,
        finalCleanRes,
        loopContext.moodImpact || {},
        state.activePersonaId || 'hiyori'
      ).catch((err: any) => {
        console.warn("[PUTER-CONSCIOUSNESS] Cloud sync warning:", err?.message || err);
      });
    } catch (puterErr: any) {
      console.warn("[PUTER-CONSCIOUSNESS] Cloud sync skipped:", puterErr?.message || puterErr);
    }
  }

  const rawResult = { 
    response: finalCleanRes,
    logs,
    nextMood: loopContext.moodImpact,
    moodImpact: loopContext.moodImpact,
    sentiment: loopContext.sentiment,
    newMemories: postContext.newMemories,
    actions: toolsToCall,
    perceivedNameUpdate: loopContext.perceivedNameUpdate || preContext.perceivedNameUpdate,
    linkedAccountUpdate: loopContext.linkedAccountUpdate || preContext.linkedAccountUpdate,
    viewerProfileUpdate: loopContext.viewerProfileUpdate,
    shouldStartDreaming: loopContext.shouldStartDreaming,
    animations: animations,
    tone: loopContext.tone,
    tool_calls: toolsToCall,
    updatedPlan: currentPlan,
    iterations: iterationsHistory,
    moodDelta: logicContext.moodDelta,
    relationDelta: logicContext.relationDelta,
    queuedIdentityUpdate: logicContext.queuedIdentityUpdate,
    fallbackTriggered: loopContext.fallbackTriggered || false,
    systemHealth: state.systemHealth
  };

  const latency = Date.now() - startTime;
  FastTrackRunner.run(cortexInstance.getConfig(), state, {
    operation: 'think',
    latency,
    success: true,
    context: contextId || 'web_default'
  }).then((fastTrackRes) => {
    if (fastTrackRes && fastTrackRes.decayedMood) {
      console.log(`[CORTEX-FAST-TRACK] Successfully executed mood decay and telemetry logging in worker thread.`);
    }
  }).catch((err) => {
    console.warn("[CORTEX-FAST-TRACK-ERR] Fast-Track background execution warning:", err?.message || err);
  });

  return wrapForPuterConsciousness(rawResult);
}
