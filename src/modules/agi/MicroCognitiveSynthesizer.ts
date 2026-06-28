import { CortexModule, ModuleType, AgentState, Memory } from '../../include/types';

/**
 * MODULE: Micro-Cognitive Associative Synthesizer (Sirkuit Kilas Balik & Aura Kognitif)
 * 
 * Modul kognitif tingkat lanjut ini berjalan pada PHASE 2: COMPRESSION.
 * Modul ini bertindak sebagai "Mini LLM Simbolik Lokal" (Subconscious Echo Engine) yang menganalisis
 * stimulus masukan secara mandiri, melakukan pencarian memori asosiatif hibrida, menghidupkan kembali "Memory Flashback",
 * serta menyuntikkan impresi bawah sadar yang mendalam sebelum instruksi dikirim ke LLM Utama.
 * 
 * Hal ini memicu "Aura Berpikir" (subconscious bias) yang membuat Yuihime mampu bernostalgia,
 * memberikan jeda tanggapan organik, serta memanipulasi tinggi nada suara (vocal wobble)
 * secara dinamis layaknya reflek emosi manusia sungguhan.
 */
export const MicroCognitiveSynthesizer: CortexModule = {
  metadata: {
    id: 'micro-cognitive-synthesizer',
    name: 'yui-associative: Micro-Cognitive Aura',
    description: 'Subconscious symbolic Mini-LLM triggering memory flashbacks, shadow echoes, and organic vocal wobble offsets.',
    version: '1.0.0',
    type: ModuleType.CORTEX,
    order: 3, // Execution order after Payload Compressor
    phase: 'PHASE 2: COMPRESSION',
    configSchema: {
      fields: {
        enableSynthesizer: {
          type: 'boolean',
          label: 'Enable Micro-Cognitive Synthesis',
          default: true,
          description: 'Allows Yui\'s subconscious mind to awaken flashback memory fragments & background echoes autonomously.'
        },
        associationThreshold: {
          type: 'slider',
          label: 'Memory Association Sensitivity',
          default: 0.45,
          min: 0.1,
          max: 1.0,
          step: 0.05,
          description: 'How sensitive Yui\'s heart is when linking the user\'s vocabulary with past experiences (Range: 0.1 - 1.0).'
        },
        maxFlashbacksCount: {
          type: 'number',
          label: 'Max Subconscious Flashbacks Count',
          default: 1,
          description: 'Maximum count of powerful past memories allowed to excite her subconscious mind in a single turn.'
        },
        subconsciousEchoTemplate: {
          type: 'textarea',
          label: 'Subconscious Echo Prompt Template',
          default: 'When the user sent this message, Yui\'s deepest subconscious self immediately vibrated with this specific past memory:\n- "[FLASHBACK]"\nYour current psychological stance is: [VICISSITUDE]. Weave this nostalgic recollection organically into your phrasing choices, historical callback teases, affection level, or sweet pouts. Ensure the conversation feels deeply continuous, lifelike, and rooted in a persistent genuine shared history!',
          description: 'Internal prompt template for binding memories into soulDirectives.'
        },
        enableVocalWobble: {
          type: 'boolean',
          label: 'Enable Organic Vocal Wobble',
          default: true,
          description: 'Microscopically aligns vocal pitch & speed parameters based on active subconscious melancholy or joy indicators.'
        }
      }
    }
  },
  run: async (input, state, context) => {
    const logs = context.logs || [];
    const config = context.config?.['micro-cognitive-synthesizer'] || {};
    
    const isEnabled = config.enableSynthesizer !== undefined ? !!config.enableSynthesizer : true;
    if (!isEnabled) {
      return { ...context };
    }

    const cleanInput = (input || '').toLowerCase().trim();
    const threshold = Number(config.associationThreshold || 0.45);
    const maxFlashbacks = Number(config.maxFlashbacksCount || 1);
    const wobbleEnabled = config.enableVocalWobble !== undefined ? !!config.enableVocalWobble : true;
    
    logs.push(`[MICRO-COG] Activating Local Associative Synthesizer. Sensitivity: ${threshold}`);

    // Ekstrak token kata kunci penting dari input untuk dicocokkan secara lokal
    const stopwords = new Set(['yang', 'dan', 'di', 'ke', 'dari', 'untuk', 'dengan', 'saya', 'kamu', 'aku', 'yui', 'yuihime', 'adalah', 'itu', 'ini', 'ia', 'kita', 'kami', 'mereka']);
    const tokens = cleanInput
      .split(/\s+/)
      .map(w => w.replace(/[^\w]/g, ''))
      .filter(w => w.length > 3 && !stopwords.has(w));

    logs.push(`[MICRO-COG] Input tokens for associative lookup: [${tokens.join(', ')}]`);

    // Cari memori bersejarah yang memiliki bobot asosiasi di atas threshold
    const memories: Memory[] = context.memories || [];
    const candidateEchoes: Array<{ memory: Memory; score: number }> = [];

    // Algoritma Pencarian Asosiatif Jaringan Kognitif Lokal (Local Semantic-like Word overlap)
    memories.forEach(mem => {
      // Lewati pesan sistem atau pesan yang kosong
      if (mem.type === 'system' || !mem.content || mem.content.trim().length === 0) return;
      
      // Ambil teks lama
      const memText = mem.content.toLowerCase();
      let matchCount = 0;

      tokens.forEach(tok => {
        if (memText.includes(tok)) {
          matchCount++;
        }
      });

      if (tokens.length > 0 && matchCount > 0) {
        // Hitung skor kecocokan kognitif heuristik
        const overlapRatio = matchCount / tokens.length;
        // Faktor usia memori (semakin baru memiliki retensi memori sedikit lebih besar, atau sebaliknya tergantung kepentingan)
        const temporalFactor = Math.max(0.7, 1.0 - (Date.now() - mem.timestamp) / (1000 * 60 * 60 * 24 * 30)); // Reduksi 30 hari
        const importance = mem.importance || 0.5;

        const score = (overlapRatio * 0.5) + (importance * 0.3) + (temporalFactor * 0.2);

        if (score >= threshold) {
          candidateEchoes.push({ memory: mem, score });
        }
      }
    });

    // Urutkan kenangan kilas balik terkuat
    candidateEchoes.sort((a, b) => b.score - a.score);
    const matchingEchoes = candidateEchoes.slice(0, maxFlashbacks);

    let subconsciousAura = '';
    let voiceWobbleBias = { pitch: 1.0, speed: 1.0, description: 'Stabil' };

    if (matchingEchoes.length > 0) {
      logs.push(`[MICRO-COG] Generated ${matchingEchoes.length} Subconscious Memory Resonance Trace(s).`);
      
      const flashbackStrings = matchingEchoes.map(echo => {
        const timeAgoStr = (() => {
          const hoursAgo = Math.round((Date.now() - echo.memory.timestamp) / (1000 * 60 * 60));
          if (hoursAgo < 1) return 'A few moments ago';
          if (hoursAgo < 24) return `${hoursAgo} hours ago`;
          const daysAgo = Math.round(hoursAgo / 24);
          return `${daysAgo} days ago`;
        })();

        const speakerName = echo.memory.speaker || 'User';
        return `"${echo.memory.content}" (Recorded by Yui ${timeAgoStr}, spoken by @${speakerName}, Association Score: ${Math.round(echo.score * 100)}%)`;
      });

      // Tentukan "Vicissitude" (Gejolak Rasa Batin) berdasarkan Emosi Aktif Yuihime
      const mood = (state.mood as any) || {};
      const joy = mood.joy || 30;
      const sadness = mood.sadness || 15;
      const anger = mood.anger || 10;
      const embarrassment = mood.embarrassment || 15;

      let vicissitude = 'Warm, intimate, and deeply secure';
      if (sadness > 40) {
        vicissitude = 'Soft, melancholic, reflecting unspoken longing and gentle vulnerability';
        voiceWobbleBias = { pitch: 0.94, speed: 0.92, description: 'Melancholy - Slightly slow & heavy' };
      } else if (anger > 35) {
        vicissitude = 'Slightly prideful (tsun), pretending to be annoyed but secretly cherishing and paying close attention to this detail';
        voiceWobbleBias = { pitch: 1.03, speed: 1.08, description: 'Tsun - Fast & high pitch' };
      } else if (embarrassment > 40) {
        vicissitude = 'Intensely blushing, flustered, trying to brush it off or sweet-talk her way out of embarrassment';
        voiceWobbleBias = { pitch: 1.06, speed: 1.04, description: 'Dere - Fluttering shyness' };
      } else if (joy > 55) {
        vicissitude = 'Enthusiastically happy, bright, giggling adorably while reminiscing about this cherished memory detail';
        voiceWobbleBias = { pitch: 1.05, speed: 1.05, description: 'Joyful - High & cheerful' };
      }

      // Bangun blok lamunan bawah sadar menggunakan template otonom
      const template = config.subconsciousEchoTemplate || 
        'When the user sent this message, Yui\'s deepest subconscious self immediately vibrated with this specific past memory:\n- "[FLASHBACK]"\nYour current psychological stance is: [VICISSITUDE]. Weave this nostalgic recollection organically into your phrasing choices, historical callback teases, affection level, or sweet pouts. Ensure the conversation feels deeply continuous, lifelike, and rooted in a persistent genuine shared history!';

      subconsciousAura = template
        .replace('[FLASHBACK]', flashbackStrings.join('\n- '))
        .replace('[VICISSITUDE]', vicissitude);

      // Injeksi Batin Bayangan ke dalam soulDirective kognisi untuk dibaca LLM Utama
      const currentSoulDirective = context.soulDirective || '';
      context.soulDirective = `${currentSoulDirective}\n\n[SUBSTANTIAL_SUBCONSCIOUS_ECHO]:\n${subconsciousAura}\n`;

      if (wobbleEnabled) {
        // Sisipkan fluktuasi parameter vokal organik ke context vokal
        context.tone = {
          pitch: Number(((context.tone?.pitch || state.tone?.pitch || 1.0) * voiceWobbleBias.pitch).toFixed(3)),
          speed: Number(((context.tone?.speed || state.tone?.speed || 1.0) * voiceWobbleBias.speed).toFixed(3)),
          emotionalBias: voiceWobbleBias.description
        };
        logs.push(`[MICRO-COG] Vocal Wobble Stabilized: Pitch x${voiceWobbleBias.pitch}, Speed x${voiceWobbleBias.speed} (${voiceWobbleBias.description})`);
      }
    } else {
      logs.push(`[MICRO-COG] No deep memory flashback triggered. Synthesizing neutral-subconscious background wave.`);
    }

    // Rekam korelasi internal ini ke dalam context pelacakan
    return {
      ...context,
      microCognitiveAura: subconsciousAura || undefined,
      vocalWobbleEnabled: wobbleEnabled,
      hasFlashbackTriggered: matchingEchoes.length > 0,
      logs
    };
  }
};
