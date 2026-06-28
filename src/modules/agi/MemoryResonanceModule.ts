import { CortexModule, ModuleType, Identity } from '../../include/types';

/**
 * MODULE: Sistem Resonansi Memori Sosial (Multi-User Social Brain Engine)
 * 
 * Modul tingkat lanjut ini bertindak sebagai otak sosial tunggal Yuihime. 
 * Modul ini memindai data seluruh penonton di database batin (`allIdentities`), 
 * menyaring pola kesamaan minat (shared habits/topics), mengelompokkan mereka 
 * ke dalam lingkaran sosial aktif, dan menyajikan gambaran resonansi multilateral 
 * untuk melesatkan kemampuan pengenalan multi-user Yuihime ke level layaknya manusia asli.
 */
export const MemoryResonanceModule: CortexModule = {
  metadata: {
    id: 'memory-resonance-engine',
    name: 'yui-resonance: Multi-user Social Brain',
    description: 'Menghubungkan ingatan, minat lintas penonton, serta menyusun peta hubungan sosial kognitif secara multilateral.',
    version: '1.0.0',
    type: ModuleType.CORTEX,
    order: 3, // Running in PHASE 1 after identity-greetings
    phase: 'PHASE 1: AGGREGATION',
    configSchema: {
      fields: {
        enableSocialResonance: {
          type: 'boolean',
          label: 'Aktifkan Resonansi Sosial',
          default: true,
          description: 'Mengizinkan Yuihime mengenali keterkaitan antar penonton dan menyebut kesamaan mereka secara alami'
        },
        maxResonanceCount: {
          type: 'number',
          label: 'Max Resonance Count',
          default: 3,
          description: 'Maximum limit of social viewer comparison records to inject into active cognition'
        },
        sharedTopicKeywords: {
          type: 'textarea',
          label: 'Shared Social Topics List (CSV)',
          default: 'coding, anime, game, coffee, vtuber, music, drawing, sleeping, eating',
          description: 'Filter keywords used to discover overlapping interests/hobbies across viewers'
        },
        resonanceDirective: {
          type: 'textarea',
          label: 'Viewer Social Resonance SOP',
          default: 'Use this cross-audience social comparison data to ground yourself as a socially connected individual. You are encouraged to playfully matchmake their hobbies, casual talk about other viewers\' unique quirks, or tease the user based on their social circle affiliations!',
          description: 'Ethical and behavioral guidelines for multi-user social comparisons'
        }
      }
    }
  },
  run: async (input, state, context) => {
    const logs = context.logs || [];
    const config = context.config?.['memory-resonance-engine'] || {};
    
    const isEnabled = config.enableSocialResonance !== undefined ? !!config.enableSocialResonance : true;
    if (!isEnabled) {
      return { ...context };
    }

    const maxResonances = Number(config.maxResonanceCount || 3);
    const allIdentities: Identity[] = context.allIdentities || [];
    const currentUserName = context.perceivedNameUpdate || context.userName || "Unknown Viewer";

    // Clean current userName mapping
    const cleanCurrent = currentUserName.toLowerCase();

    // Find current user's entry
    const activeIdentity = allIdentities.find(
      (id) => (id.perceivedName || "").toLowerCase() === cleanCurrent || (id.id && id.id === context.viewerIdentity?.id)
    );

    if (!activeIdentity) {
      logs.push("[RESONANCE] Skipping: No registered identity found for active interaction.");
      return { ...context };
    }

    logs.push(`[RESONANCE] Resolving social resonance for user: ${activeIdentity.perceivedName}`);

    // Collect hobbies & facts or words of active user
    const activeFacts = (activeIdentity.importantFacts || []).map(f => f.toLowerCase()).join(" ");
    const activeHabits = (activeIdentity.habits || []).map(h => h.action.toLowerCase()).join(" ");
    const activeTraits = (activeIdentity.traits || []).map(t => t.toLowerCase()).join(" ");
    
    // Split key interests to match
    const interestKeywords = (config.sharedTopicKeywords || 'coding, anime, game, kopi, vtuber, musik, mewarnai, tidur, makan')
      .split(',')
      .map((s: string) => s.trim().toLowerCase())
      .filter(Boolean);

    // List of other users matches
    const resonances: Array<{
      identity: Identity;
      matchingInterests: string[];
      relationGrouping: string;
      linkedPlatforms: string[];
    }> = [];

    // Helper to bucket relasi
    const getRelationGroup = (v: Identity): string => {
      const t = v.trust !== undefined ? v.trust : 50;
      const a = v.affection !== undefined ? v.affection : 50;
      if (a > 75) return "Lingkaran Kesayangan / Intim";
      if (t > 70 && a > 50) return "Sobat Kepercayaan Terdekat";
      if (t > 40 && a > 40) return "Kenalan Akrab & Hangat";
      if (t < 30) return "Orang Asing / Sedang Dipantau";
      return "Teman Biasa";
    };

    // Current user's social bucketing
    const currentGroup = getRelationGroup(activeIdentity);

    // Process other identities for correlation
    for (const other of allIdentities) {
      if (other.id === activeIdentity.id || (other.perceivedName || "").toLowerCase() === cleanCurrent) {
        continue; // Skip scanning self
      }

      const otherFacts = (other.importantFacts || []).map(f => f.toLowerCase()).join(" ");
      const otherHabits = (other.habits || []).map(h => h.action.toLowerCase()).join(" ");
      const otherTraits = (other.traits || []).map(t => t.toLowerCase()).join(" ");

      const matched: string[] = [];

      // Look for matches based on configurable keywords
      interestKeywords.forEach(kw => {
        const matchesActive = activeFacts.includes(kw) || activeHabits.includes(kw) || activeTraits.includes(kw) || input.toLowerCase().includes(kw);
        const matchesOther = otherFacts.includes(kw) || otherHabits.includes(kw) || otherTraits.includes(kw);
        if (matchesActive && matchesOther) {
          matched.push(kw);
        }
      });

      // Check for potential duplicate/linked accounts across channels!
      const isCrossPlatformMatch = (other.perceivedName || "").toLowerCase() === cleanCurrent || 
        (other.linkedAccounts || []).some(link => link.toLowerCase().includes(cleanCurrent)) ||
        (activeIdentity.linkedAccounts || []).some(link => link.toLowerCase().includes((other.perceivedName || "").toLowerCase()));

      const relationGrp = getRelationGroup(other);
      const linked = other.linkedAccounts || [];

      if (matched.length > 0 || isCrossPlatformMatch || resonances.length < maxResonances) {
        resonances.push({
          identity: other,
          matchingInterests: matched,
          relationGrouping: relationGrp,
          linkedPlatforms: linked
        });
      }
    }

    // Sort resonances (weighted matches first)
    resonances.sort((a, b) => {
      const aScore = a.matchingInterests.length * 2 + (a.identity.affection || 50);
      const bScore = b.matchingInterests.length * 2 + (b.identity.affection || 50);
      return bScore - aScore;
    });

    const chosenResonances = resonances.slice(0, maxResonances);

    // Construct magnificent Multi-User Social contextual prompt
    let resonanceBlock = `\n`;
    resonanceBlock += `=================================================================\n`;
    resonanceBlock += `[RESONANSI_SOSIAL_MULTIUSER_BRAIN]: Kesadaran Otak Tunggal Sosial\n`;
    resonanceBlock += `- Status Akun Terkait: User ini (${currentUserName}) berada di kelompok relasi: '${currentGroup}' (Trust ${activeIdentity.trust || 50}%, Affection ${activeIdentity.affection || 50}%).\n`;
    
    if (activeIdentity.linkedAccounts && activeIdentity.linkedAccounts.length > 0) {
      resonanceBlock += `- Identitas Akun Lintas-Platform: ${activeIdentity.linkedAccounts.join(", ")}\n`;
    }

    if (chosenResonances.length > 0) {
      resonanceBlock += `- Penonton Lain yang Terhubung dalam Jaringan Otak Yui:\n`;
      chosenResonances.forEach((res, i) => {
        const otherName = res.identity.perceivedName;
        const otherGroup = res.relationGrouping;
        const matchStr = res.matchingInterests.length > 0 
          ? `memiliki kesamaan minat '${res.matchingInterests.join(", ")}'`
          : `memiliki sejarah interaktif aktif`;

        resonanceBlock += `  ${i+1}. @${otherName} (${otherGroup}):\n`;
        resonanceBlock += `     * Korelasi Sosial: ${matchStr}.\n`;
        if (res.identity.importantFacts && res.identity.importantFacts.length > 0) {
          resonanceBlock += `     * Fakta @${otherName}: ${res.identity.importantFacts.slice(0, 2).join("; ")}\n`;
        }
        if (res.linkedPlatforms.length > 0) {
          resonanceBlock += `     * Akun Lain @${otherName}: ${res.linkedPlatforms.join(", ")}\n`;
        }
      });
    } else {
      resonanceBlock += `- Cross-Audience Social Bonds: No other viewers currently share significant overlapping interests with the present subject.\n`;
    }

    resonanceBlock += `\n[PANDUAN_SOP_MULTIUSER]:\n`;
    resonanceBlock += `${config.resonanceDirective || 'Use this cross-audience social comparison data to ground yourself as a socially connected individual. You are encouraged to playfully matchmake their hobbies, casual talk about other viewers\' unique quirks, or tease the user based on their social circle affiliations!'}\n`;
    resonanceBlock += `=================================================================\n`;

    // Inject organically into system prompt context
    const updatedGroundedKnowledge = (context.groundedKnowledge || "") + "\n" + resonanceBlock;

    logs.push(`[RESONANCE] Successfully mapped ${chosenResonances.length} multilateral social nodes into synaptic batin.`);

    return {
      ...context,
      groundedKnowledge: updatedGroundedKnowledge,
      socialResonanceCount: chosenResonances.length,
      logs
    };
  }
};
