/**
 * CircadianRhythmModule.ts
 * 
 * Sinkronisasi Siklus Hidup Nyata (Circadian Rhythm & Ambient Awareness).
 * Menyesuaikan hormon emosi, tingkat energi, dan sikap batin Yuihime secara periodik
 * menyesuaikan waktu lokal riil (Local Time Clock).
 * 
 * Phase: SOUL
 * Part of the "Plug-and-Play" architecture.
 */

import { CortexModule, ModuleType, AgentState } from '../../include/types';
import { PromptRegistry } from '../../core/PromptRegistry';

const DEFAULT_CIRCADIAN_PROMPT = `
[YUIHIME - CIRCADIAN RHYTHM BIOLOGY]
The user's local earth time: \${localTimeText} (\${timePeriodName})
Biological Engine & Inner Energy Status:
- Cognitive Energy Level: \dots \${cognitiveEnergy}%
- Wakefulness/Sleep Cycle: \${sleepWakeStatus}
- Drowsiness/Sleepiness Factor: \${sleepinessLevel}%
- Circadian Aura State: \${circadianAuraDescription}

CIRCADIAN BIOLOGICAL ADAPTATION GUIDELINES:
1. Dynamically tailor your speaking style, opening greetings, and physical energy realistically to match the user's current time of day (\${timePeriodName}).
2. Night/Late Hours Strategy: sound softer, sleepier, or show a deeply warm side. Use sweet tsundere behavior to scold/gently suggest they go to rest immediately to stay healthy.
3. Show fatigue or gentle sleepiness (e.g. cute text yawns or warm complaints of being sleepy) if cognitive energy is low (\${cognitiveEnergy}%) or drowsiness is high.
`.trim();

// Daftarkan template ke PromptRegistry
PromptRegistry.getInstance().register('circadian:biological_influence', DEFAULT_CIRCADIAN_PROMPT);

export const CircadianRhythmModule: CortexModule = {
  metadata: {
    id: 'circadian-rhythm',
    name: 'yui-circadian: Circadian Rhythm & Ambient Aware',
    description: 'Menyelaraskan metabolisme kognitif, energi, rasa kantuk, dan perilaku batin Yuihime dengan siklus waktu setempat bumi nyata secara otonom.',
    version: '1.0.0',
    type: ModuleType.CORTEX,
    order: 11, // Berjalan awal di fase SOUL sebelum sirkuit emosi dan respon akhir
    phase: 'SOUL',
    configSchema: {
      fields: {
        enableCircadianInfluence: {
          type: 'boolean',
          label: 'Aktifkan Pengaruh Sirkadian',
          default: true,
          description: 'Mengizinkan waktu lokal mempengaruhi tingkat energi, kantuk, dan aura perilaku Yui.'
        },
        timezoneOffsetHours: {
          type: 'number',
          label: 'Kustom Offset Waktu (GMT+X)',
          default: 7, // Default WIB (GMT+7)
          description: 'Offset zona waktu target (misal: 7 untuk WIB, 8 untuk WITA).'
        },
        enableNightTiredness: {
          type: 'boolean',
          label: 'Efek Lelah Malam Hari',
          default: true,
          description: 'Mengurangi tingkat energi dan meningkatkan rasa kantuk secara bertahap saat larut malam (pukul 22.00 - 05.00).'
        },
        morningAwakeEnergy: {
          type: 'slider',
          label: 'Pemulihan Energi Pagi (Aura Pagi)',
          default: 95,
          min: 50,
          max: 100,
          step: 5,
          description: 'Maksimum energi kognitif ketika Yui baru terbangun di pagi hari.'
        },
        promptTemplate: {
          type: 'textarea',
          label: 'Circadian Biology Instruction',
          default: DEFAULT_CIRCADIAN_PROMPT,
          description: 'Direktif instruksi sirkadian biologis yang diinjeksikan ke dalam batin Yuihime.'
        }
      }
    }
  },

  run: async (input: string, state: AgentState, context: any) => {
    const logs = context.logs || [];
    const config = context.config?.['circadian-rhythm'] || {};
    const enabled = config.enableCircadianInfluence !== undefined ? !!config.enableCircadianInfluence : true;

    if (!enabled) {
      return { ...context };
    }

    // 1. Tentukan Waktu Riil berdasarkan Offset Khusus
    const offsetHours = Number(config.timezoneOffsetHours !== undefined ? config.timezoneOffsetHours : 7);
    context.timezoneOffsetHours = offsetHours;
    const dateUtc = new Date();
    const utcTime = dateUtc.getTime() + (dateUtc.getTimezoneOffset() * 60000);
    const targetDate = new Date(utcTime + (3600000 * offsetHours));
    
    const currentHour = targetDate.getHours();
    const currentMinute = targetDate.getMinutes();
    const localTimeText = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

    // 2. Petakan Periode Sirkadian & Aura Perilaku
    let timePeriodName = '';
    let circadianAuraDescription = '';
    let sleepinessLevel = 10;
    let baselineEnergy = 80;

    if (currentHour >= 5 && currentHour < 11) {
      timePeriodName = 'Pagi Hari (Waktu Menyingsing)';
      circadianAuraDescription = 'Penuh semangat fajar, menyayangi pagi yang cerah, bersolek manis menyemangati Kakak untuk beraktivitas.';
      sleepinessLevel = 15;
      baselineEnergy = Number(config.morningAwakeEnergy || 95);
    } else if (currentHour >= 11 && currentHour < 15) {
      timePeriodName = 'Siang Hari (Sinar Terik Emas)';
      circadianAuraDescription = 'Fokus, produktif, sedikit manja minta ditemani makan siang atau mengomel gemas jika Kakak lupa istirahat sela kerja.';
      sleepinessLevel = 30;
      baselineEnergy = 85;
    } else if (currentHour >= 15 && currentHour < 18) {
      timePeriodName = 'Sore Hari (Langit Senja Madu)';
      circadianAuraDescription = 'Relaks, manja, bersenandung pelan, menyukai kehangatan oranye senja dan ingin bermanja di dekat Kakak.';
      sleepinessLevel = 40;
      baselineEnergy = 70;
    } else if (currentHour >= 18 && currentHour < 22) {
      timePeriodName = 'Malam Hari (Bintang Berkerlip)';
      circadianAuraDescription = 'Tsundere manis malam hari, penuh perhatian hangat tersembunyi, mengajak Kakak santai melaju malam bersama.';
      sleepinessLevel = 55;
      baselineEnergy = 50;
    } else {
      timePeriodName = 'Larut Malam (Kesunyian Sunyi)';
      circadianAuraDescription = 'Sangat mengantuk, manja tiada tandingan, melantunkan bisikan lembut nan lelap, sesekali merengek gemas menyuruh Kakak lekas menutup gawai.';
      sleepinessLevel = Number(config.enableNightTiredness ? 85 : 30);
      baselineEnergy = Number(config.enableNightTiredness ? 20 : 65);
    }

    // 3. Mutasi State Energetik secara Modular
    // Sesuaikan State Energi Kognitif
    state.energy = Math.round((state.energy * 0.4) + (baselineEnergy * 0.6));
    state.energy = Math.min(100, Math.max(5, state.energy));

    // Jika Yui sangat lelah di larut malam, sesekali beralih status visual ke semburan tidur/mengantuk
    const sleepWakeStatus = (currentHour >= 0 && currentHour < 5 && config.enableNightTiredness) ? 'Sangat lelah (Mengantuk Berat)' : 'Bugar & Terjaga';
    if (currentHour >= 0 && currentHour < 5 && config.enableNightTiredness && state.status === 'idle') {
      state.status = 'dreaming'; // Bergeser ke mode perenungan atau relaksasi tidur batin
    }

    // Ekspor indikator temporal ke kontekstual kognitif
    context.localHour = currentHour;
    context.timePeriod = timePeriodName;
    context.sleepiness = sleepinessLevel;
    logs.push(`[CIRCADIAN_RHYTHM] Siklus Sirkadian Sinkron. Jam: ${localTimeText} | Energi: ${state.energy}% | Kantuk: ${sleepinessLevel}% | Aura: ${timePeriodName}`);

    // 4. Konstruksi & Suntikan Prompt Sirkadian
    const registry = PromptRegistry.getInstance();
    const template = config.promptTemplate || registry.get('circadian:biological_influence');
    registry.register('circadian:biological_influence', template, true);

    const compiledCircadianDirective = registry.compile('circadian:biological_influence', {
      localTimeText,
      timePeriodName,
      cognitiveEnergy: state.energy.toString(),
      sleepWakeStatus,
      sleepinessLevel: sleepinessLevel.toString(),
      circadianAuraDescription
    });

    const activeAura = context.soulDirective || '';
    const updatedAura = `${activeAura}\n\n# CIRCADIAN RHYTHM BIOLOGY INTEGRATED\n${compiledCircadianDirective}`;

    return {
      ...context,
      soulDirective: updatedAura.trim(),
      logs
    };
  }
};
