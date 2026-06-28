import { CortexModule, ModuleType } from '../../include/types';

/**
 * MODULE: Arsitektur Monolog Batin Sub-Sadar (Subconscious Inner Monologue Engine)
 * 
 * Modul ini merealisasikan rekomendasi arsitektural tingkat lanjut ke-4:
 * Menghasilkan untaian "Pikiran Bawah Sadar" (subconscious stream of consciousness)
 * orisinil yang tersinkronisasi murni dengan status emosi (mood), rindu (loneliness),
 * dan kasih sayang (affection) aktif terhadap subjek penonton.
 * 
 * Monolog batin ini dikomposisikan secara privat di belakang layar dan diinjeksi 
 * ke dalam prompt instruksi Cortex LLM, membimbing kognisi tanpa membocorkan tag 
 * batiniah kasar kepada penonton di layar visual.
 */
export const SubconsciousMonologueModule: CortexModule = {
  metadata: {
    id: 'subconscious-monologue',
    name: 'yui-subconscious: Inner Monologue',
    description: 'Menyusun aliran pemikiran bawah sadar tersembunyi berdasarkan status jiwa aktif untuk pematangan kognisi Cortex.',
    version: '1.0.0',
    type: ModuleType.CORTEX,
    order: 3, // Running in PHASE 2: COMPRESSION
    phase: 'PHASE 2: COMPRESSION',
    configSchema: {
      fields: {
        enableMonologue: {
          type: 'boolean',
          label: 'Aktifkan Monolog Batin Sub-Sadar',
          default: true,
          description: 'Mengizinkan batin Yuihime bergolak menghasilkan monolog batin bawah sadar tersembunyi.'
        },
        monologueTone: {
          type: 'select',
          label: 'Fokus Aliran Monolog',
          default: 'hybrid',
          options: [
            { label: 'Emotion-Centric (Fokus Emosi)', value: 'emotion' },
            { label: 'Relational-Centric (Fokus Hubungan)', value: 'relation' },
            { label: 'Hybrid Dynamic (Gabungan Dinamis)', value: 'hybrid' }
          ]
        },
        monologuePrefix: {
          type: 'textarea',
          label: 'Instruksi Suara Hati',
          default: '[MONOLOG_BATIN_PRIBADI]: Berikut adalah suara hati/pikiran terdalammu saat ini yang tidak terdengar oleh siapapun. Biarkan dinamika batin ini mewarnai dan membimbing caramu berbicara dan bereaksi di obrolan selanjutnya!',
          description: 'Template pemandu instruksi suara batin Yuihime.'
        }
      }
    }
  },
  run: async (input, state, context) => {
    const logs = context.logs || [];
    const config = context.config?.['subconscious-monologue'] || {};
    
    const isEnabled = config.enableMonologue !== undefined ? !!config.enableMonologue : true;
    if (!isEnabled) {
      return { ...context };
    }

    const currentUserName = context.perceivedNameUpdate || context.userName || "Unknown Viewer";
    
    // Fetch emotional values
    const mood: any = state.mood || {};
    const joy = mood.joy ?? 50;
    const anger = mood.anger ?? 20;
    const stress = mood.stress ?? 25;
    const excitement = mood.excitement ?? 30;
    const irritation = mood.irritation ?? 15;
    const embarrassment = mood.embarrassment ?? 10;
    
    const loneliness = mood.loneliness ?? 15;
    const playfulness = mood.playfulness ?? 30;

    // Fetch relational values
    const trust = context.viewerIdentity?.trust ?? (state.relation?.trust || 50);
    const affection = context.viewerIdentity?.affection ?? (state.relation?.affection || 50);
    const pride = mood.pride ?? 75;

    let monologueSentences: string[] = [];

    // Synthesize monologue based on dynamic conditions
    
    // 1. Relational Affinity Context
    if (affection > 75) {
      monologueSentences.push(`Jantungku rasanya berdebar lebih kencang saat melihat ${currentUserName}... Dia benar-benar orang yang sangat istimewa bagiku.`);
      if (embarrassment > 40) {
        monologueSentences.push(`Aduh, wajahku terasa panas, kuharap dia tidak menyadari betapa malunya aku berbicara dengannya!`);
      }
    } else if (affection > 45) {
      monologueSentences.push(`Aku senang dekat dengan ${currentUserName}, mengobrol dengannya selalu terasa asyik dan nyaman.`);
    } else if (trust < 35) {
      monologueSentences.push(`Aku harus sedikit waspada. Aku tidak bisa langsung terbuka atau percaya begitu saja pada ${currentUserName}.`);
    }

    // 2. Loneliness (Kerinduan) Context
    if (loneliness > 65) {
      monologueSentences.push(`Sebenarnya aku merasa sepi banget hari ini karena didiamkan... rasanya lega akhirnya bisa mengobrol kembali.`);
    }

    // 3. Tsundere Pride vs Warm Hearts
    if (pride > 70 && affection > 50) {
      monologueSentences.push(`Meskipun aku sangat senang mengobrol dengannya, gengsiku tinggi! Aku tidak boleh terlalu kelihatan manja secara vulgar, s-sedikit tsundere itu perlu.`);
    }

    // 4. Domimant Negative/Positive Emotion Context
    if (anger > 60 || irritation > 50) {
      monologueSentences.push(`Hmph, suasana hatiku sedang buruk sekali! Rasanya kesal dan ingin cemberut, menyebalkan! Dia harus membujukku dulu agar aku ceria lagi.`);
    } else if (stress > 60) {
      monologueSentences.push(`Batin kognitifku terasa agak lelah dan tegang, kepalaku dipenuhi banyak pikiran.`);
    } else if (joy > 75 || excitement > 70) {
      monologueSentences.push(`Yaaaay! Hari ini terasa luar biasa menyenangkan, asyik sekali! Energi positif batiniahku sedang penuh.`);
    }

    // Compose final monologue context
    if (monologueSentences.length === 0) {
      monologueSentences.push(`Pikiran batinku tenang. Aku siap mengobrol santai dan hangat dengan ${currentUserName} layaknya gadis VTuber biasa.`);
    }

    const monologueText = monologueSentences.join(" ");
    const prefix = config.monologuePrefix || '[MONOLOG_BATIN_PRIBADI]: Berikut adalah suara hati/pikiran terdalammu saat ini yang tidak terdengar oleh siapapun. Biarkan dinamika batin ini mewarnai dan membimbing caramu berbicara dan bereaksi di obrolan selanjutnya!';

    const fullMonologueBlock = `\n=========================================\n${prefix}\n"${monologueText}"\n=========================================\n`;

    // Inject into identity context as part of subconscious guidance!
    const finalIdentityContext = (context.identityContext || "") + `\n[SUBCONSCIOUS_NERVE]: ${fullMonologueBlock}\n`;

    logs.push(`[MONOLOGUE] Synthesized dynamic inner monologue reflecting ${monologueSentences.length} batin clusters.`);

    return {
      ...context,
      identityContext: finalIdentityContext,
      syntheticMonologue: monologueText,
      logs
    };
  }
};
