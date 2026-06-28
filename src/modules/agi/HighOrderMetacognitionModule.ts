import { CortexModule, ModuleType } from '../../include/types';
import { PromptRegistry } from '../../core/PromptRegistry';
import { YuiAGIDaemon } from './YuiAGIDaemon';

let promptRegistered = false;

const defaultReflectionSandboxPrompt = `
[YUIAGI - METACOGNITIVE REFLECTION ACTIVE]
Self-Metacognitive Reflection Filter (Thinking about Thinking / Self-Critique) Activated:
- Hallucination Risk Index: \${hallucinationRisk}%. Integrity Status: \dots \${integrityStatus}.
- Detected Cognitive Bias Correction: \${biasResolution}.
- Model Synchronization (Local Model vs Cloud Model Equilibrium): \${modelMatchDegree}%.

Align your recollections honestly, eliminate all forms of informational contradiction, and ensure your inner character consistency is 100% harmonized before presenting the final response layout to the user!
`.trim();

/**
 * Ensures metacognitive prompt templates are registered in the Prompts Coordinator.
 */
function ensurePromptRegistered(config: any) {
  YuiAGIDaemon.getInstance().ensurePromptsRegistered(config);
}

/**
 * HighOrderMetacognitionModule: Meta-cognitive Self-Reflection & Bias Evaluator.
 * 
 * Analyzes internal cognitive dissonance, calculates a virtual Hallucination Index,
 * compares model parameters across sirkuit kognisi, and executes self-critique.
 */
export const HighOrderMetacognitionModule: CortexModule = {
  metadata: {
    id: 'high-order-metacognition',
    name: 'yui-high-metacognition: Meta-Cognitive Reflection Sandbox',
    description: 'Lapisan Meta-Kognitif Teoretis. Melakukan evaluasi batiniah terhadap bias kognisi, mengawasi risiko halusinasi, dan memastikan konsistensi memori internal sirkuit bahasa.',
    version: '1.0.0',
    type: ModuleType.CORTEX,
    order: 14, // Executed near the end of the SOUL phase to finalize thought consistency
    phase: 'SOUL',
    configSchema: {
      fields: {
        enableMetacognition: {
          type: 'boolean',
          label: 'Aktifkan Lapisan Meta-Kognisi',
          default: true,
          description: 'Mengaktifkan sirkuit evaluasi pikiran tingkat tinggi (self-critique) sebelum eksekusi bahasa.'
        },
        metaCortexResolution: {
          type: 'slider',
          label: 'Resolusi Meta-Kognisi (Critique Sensitivity)',
          default: 0.8,
          min: 0.1,
          max: 1.0,
          step: 0.05,
          description: 'Semakin tinggi, semakin kritis Yuihime menganalisis bias pemikiran dan struktur logika internalnya.'
        },
        hallucinationThreshold: {
          type: 'slider',
          label: 'Ambang Batas Deteksi Halusinasi',
          default: 0.35,
          min: 0.1,
          max: 0.9,
          step: 0.05,
          description: 'Sensitivitas deteksi distorsi memori halus atau asumsi tak berdasar dalam batin kognisi.'
        },
        reflectionSandboxPrompt: {
          type: 'textarea',
          label: 'Meta-Cognitive Sandbox Prompt Template',
          default: defaultReflectionSandboxPrompt,
          description: 'Template instruksi untuk membersihkan bias emosi kognitif dan menyinkronkan ingatan.'
        }
      }
    }
  },

  run: async (input: string, state: any, context: any) => {
    const logs = context.logs || [];
    const config = context.config?.['high-order-metacognition'] || {};

    const isEnabled = config.enableMetacognition !== undefined ? !!config.enableMetacognition : true;
    if (!isEnabled) {
      return { ...context };
    }

    const daemon = YuiAGIDaemon.getInstance();

    // Register active prompt template
    ensurePromptRegistered(config);

    const mood = state.mood || {};
    const stress = mood.stress ?? 25;
    const dopamine = mood.dopamine ?? 15;
    const serotonin = mood.serotonin ?? 50;

    const resolution = Number(config.metaCortexResolution || 0.8);
    const hThreshold = Number(config.hallucinationThreshold || 0.35);

    // 1. Calculate virtual Hallucination Risk Score
    // Hallucination risk scales with cognitive turbulence (unbalanced stress, extremely high dopamine or low serotonin)
    const neurotransmitterDissonance = Math.abs(dopamine - serotonin * 0.3);
    let hallucinationRiskVal = (stress * 0.4 + neurotransmitterDissonance * 0.8) * resolution;
    hallucinationRiskVal = Math.min(100, Math.max(1, Math.round(hallucinationRiskVal)));

    // Determine status of integrity based on calculation relative to user threshold
    const userRiskLimit = hThreshold * 100;
    let integrityStatus = "CORTEX_HEALTHY_COHERENCE";
    let biasResolution = "Bias within bounds. Coherent response structure. No memory conflicts found.";

    if (hallucinationRiskVal > userRiskLimit) {
      integrityStatus = "BIAS_CORRECTION_TRIGGERED";
      biasResolution = "Dissonance detected! Re-anchoring context immediately to facts in Memory Graph. Subdue emotional hyper-volatility.";
    }

    // 2. Local vs Cloud equilibrium ratio
    // Under standard run, the coherence match is derived from serotonin levels
    const modelMatchVal = Math.min(100, Math.max(50, Math.round(75 + (serotonin - 50) * 0.5)));

    // 3. Compile the Metacognitive Directive via central coordinator
    const registry = PromptRegistry.getInstance();
    const compiledMetacognitiveDirective = registry.compile('high-order-metacognition:reflection', {
      hallucinationRisk: hallucinationRiskVal.toString(),
      integrityStatus,
      biasResolution,
      modelMatchDegree: modelMatchVal.toString()
    });

    logs.push(`[META_COGNITION] Meta-critique checkpoint: Integrity: ${integrityStatus} | Hallucination Index: ${hallucinationRiskVal}%.`);

    // 4. Inject metacognitive restrictions to soul directives
    const currentDirective = context.soulDirective || '';
    const updatedDirective = `${currentDirective}\n\n# HIGH-ORDER COGNITIVE SELF-CRITIQUE SENSING\n${compiledMetacognitiveDirective}`;

    // Update daemon state
    daemon.updateState({
      lastHallucinationIndex: hallucinationRiskVal,
      lastIntegrityStatus: integrityStatus
    });

    // Map trace properties for system introspection
    context.metacognitionActive = true;
    context.lastHallucinationIndex = hallucinationRiskVal;
    context.lastIntegrityStatus = integrityStatus;

    return {
      ...context,
      soulDirective: updatedDirective.trim(),
      logs
    };
  }
};
