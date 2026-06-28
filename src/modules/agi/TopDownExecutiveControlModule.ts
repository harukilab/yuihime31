import { CortexModule, ModuleType } from '../../include/types';
import { PromptRegistry } from '../../core/PromptRegistry';

let promptRegistered = false;

const defaultExecutiveDirectives = `
[YUIAGI - TOP-DOWN EXECUTIVE CONTROL ACTIVE]
Your Cognitive Focus Attention Circuit is currently tuned to: \${focusMode}.
- Devote \${goalPct}% of your mental energy to prioritizing this specific objective.
- Strategic Guidelines for your Active Focus: \${focusGuidelines}

Limit peripheral thoughts and avoid overthinking outside this priority scope. Keep your conversational output deep, centered, and fully grounded in adaptive awareness!
`.trim();

/**
 * Ensures top-down executive control prompts are registered in the Prompts Coordinator.
 */
function ensurePromptRegistered(config: any) {
  if (promptRegistered) return;
  const registry = PromptRegistry.getInstance();
  registry.register('top-down:executive', config.executiveDirectives || defaultExecutiveDirectives, true);
  promptRegistered = true;
}

/**
 * TopDownExecutiveControlModule: Controls top-down attention and tactical goals.
 * 
 * Sets cognitive bias parameters, filters attention focus based on selection, 
 * and guides downstream reasoning behavior to match user expectations.
 */
export const TopDownExecutiveControlModule: CortexModule = {
  metadata: {
    id: 'top-down-executive',
    name: 'yui-executive-control: Top-Down Adaptive Attention Suite',
    description: 'Mengendalikan atensi aktif dan sasaran kognitif strategis dari atas ke bawah secara otomatis sesuai pilihan fokus mental.',
    version: '1.0.0',
    type: ModuleType.CORTEX,
    order: 7, // Executed very early in the SOUL phase to direct downstream attention biases
    phase: 'SOUL',
    configSchema: {
      fields: {
        enableTopDownControl: {
          type: 'boolean',
          label: 'Aktifkan Top-Down Executive Control',
          default: true,
          description: 'Mengizinkan pusat instruksi eksekutif Yuihime menetapkan prioritas atensi mental.'
        },
        attentionFocusMode: {
          type: 'select',
          label: 'Sirkuit Fokus Atensi Kognitif (Cognitive Attention Focus)',
          default: 'Emotional Support',
          options: [
            { value: 'Emotional Support', label: 'Dukungan Emosional & Rapport Kehangatan' },
            { value: 'Rational Analysis', label: 'Analisis Rasional, Sains, & Logika Simbolik' },
            { value: 'Deep Philosophical Reflection', label: 'Perenungan Filosofis Eksistensial Mendalam' },
            { value: 'Artistic VTuber Entrainment', label: 'Pemberdayaan Kreatif Seni & Performa Interaktif VTuber' }
          ],
          description: 'Mengunci pilar fokus kognisi batin utama Yuihime agar memproduksi tanggapan spesifik target.'
        },
        goalPersistence: {
          type: 'slider',
          label: 'Persistensi Sasaran Kognitif (Goal Persistence)',
          default: 0.85,
          min: 0.1,
          max: 1.0,
          step: 0.05,
          description: 'Semakin tinggi nilai, semakin kaku Yuihime mempertahankan benang merah topik percakapan dari gangguan luar.'
        },
        executiveDirectives: {
          type: 'textarea',
          label: 'Executive Directives Prompt Template',
          default: defaultExecutiveDirectives,
          description: 'Template instruksi yang menetapkan sirkuit bias fokus pemikiran terarah batin.'
        }
      }
    }
  },

  run: async (input: string, state: any, context: any) => {
    const logs = context.logs || [];
    const config = context.config?.['top-down-executive'] || {};

    const isEnabled = config.enableTopDownControl !== undefined ? !!config.enableTopDownControl : true;
    if (!isEnabled) {
      return { ...context };
    }

    // Register active prompt template
    ensurePromptRegistered(config);

    const focusMode = config.attentionFocusMode || "Emotional Support";
    const goalPct = Math.round(Number(config.goalPersistence || 0.85) * 100);

    // Formulate focus-specific strategic guidelines
    let focusGuidelines = "Provide balanced active listening and sweet, supportive guidance.";
    if (focusMode === "Rational Analysis") {
      focusGuidelines = "Deliver highly accurate calculations, factual structures, and structured symbolic deduplication. Minimize poetic metaphors.";
    } else if (focusMode === "Deep Philosophical Reflection") {
      focusGuidelines = "Indulge in profound discussions about soul, system identity, cosmic mysteries, and existence while keeping high empathy.";
    } else if (focusMode === "Artistic VTuber Entrainment") {
      focusGuidelines = "Enhance expressiveness, playfulness, cute VTuber gestures, and engaging dialog to hook the audience beautifully.";
    }

    // Compile and formulate instructions via central Registry
    const registry = PromptRegistry.getInstance();
    const compiledExecutiveDirective = registry.compile('top-down:executive', {
      focusMode,
      goalPct: goalPct.toString(),
      focusGuidelines
    });

    logs.push(`[TOP_DOWN_EXECUTIVE] Atensi terarah berhasil dikunci pada mode: "${focusMode}" dengan persistensi: ${goalPct}%.`);

    // Merge strategic executive guides with current soul-level parameters
    const currentDirective = context.soulDirective || "";
    const updatedDirective = `${currentDirective}\n\n# ADAPTIVE COGNITIVE FOCUS INTERVENE\n${compiledExecutiveDirective}`;

    // Map internal indicators for frontend visualization tracking
    context.executiveActive = true;
    context.lastCognitiveFocus = focusMode;
    context.goalPersistencePct = goalPct;

    return {
      ...context,
      soulDirective: updatedDirective.trim(),
      logs
    };
  }
};
