import path from "path";
import { renameSync, existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync, cpSync, readSync } from "fs";
import { fileURLToPath } from "url";
import * as toml from "smol-toml";
import os from "os";

let __filename = "";
let __dirname = "";
try {
  if (typeof import.meta !== "undefined" && import.meta.url) {
    __filename = fileURLToPath(import.meta.url);
    __dirname = path.dirname(__filename);
  } else {
    __dirname = typeof __dirname !== "undefined" ? __dirname : process.cwd();
    __filename = typeof __filename !== "undefined" ? __filename : path.join(__dirname, "onboarding.ts");
  }
} catch (e) {
  __dirname = process.cwd();
  __filename = path.join(__dirname, "onboarding.ts");
}

// Expands home directory symbol (~) to full path using os.homedir()
export function resolveHomePath(inputPath: string): string {
  if (!inputPath) return "";
  if (inputPath === "~") {
    return os.homedir();
  }
  if (inputPath.startsWith("~/") || inputPath.startsWith("~\\")) {
    return path.join(os.homedir(), inputPath.slice(2));
  }
  return inputPath;
}

// Prompt Helper for Synchronous Interactive CLI Input
function promptSync(questionText: string, defaultValue = ""): string {
  try {
    process.stdout.write(questionText);
    const buffer = Buffer.alloc(1024);
    const bytesRead = readSync(0, buffer, 0, 1024, null);
    const answer = buffer.toString("utf8", 0, bytesRead).trim();
    return answer || defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

// --- Onboarding Flow: Extract default and establish folders outside binary if missing ---
export function runOnboarding() {
  console.log("\n=======================================================");
  console.log("       ✨ YUIHIME AI VTUBER SYSTEM BOOTING ✨       ");
  console.log("=======================================================\n");

  // Central fallback root folder inside execution directory (supports customization via environment variables)
  const rootEnv = process.env.YUIHIME_SYSTEM_ROOT || process.env.YUIHIME_ROOT || ".yuihime";
  const expandedRoot = resolveHomePath(rootEnv);
  const yuihimeSystemRoot = path.isAbsolute(expandedRoot) ? expandedRoot : path.join(process.cwd(), expandedRoot);

  const rawDataDir = process.env.YUIHIME_DATA_DIR;
  const resolvedDataDir = rawDataDir ? resolveHomePath(rawDataDir) : path.join(yuihimeSystemRoot, "data");
  if (!existsSync(resolvedDataDir)) {
    mkdirSync(resolvedDataDir, { recursive: true });
  }

  const rootConfigPath = path.join(process.cwd(), "config.toml");
  const defaultDataConfigPath = path.join(resolvedDataDir, "config.toml");
  if (existsSync(rootConfigPath) && !existsSync(defaultDataConfigPath)) {
    try {
      renameSync(rootConfigPath, defaultDataConfigPath);
    } catch (e: any) {
      console.warn(`[ONBOARDING] Gagal memindahkan config.toml lawas:`, e.message);
    }
  }

  const rootDbPath = path.join(process.cwd(), "yuihime.db");
  const defaultDataDbPath = path.join(resolvedDataDir, "yuihime.db");
  if (existsSync(rootDbPath) && !existsSync(defaultDataDbPath)) {
    try {
      renameSync(rootDbPath, defaultDataDbPath);
    } catch (e: any) {
      console.warn(`[ONBOARDING] Gagal memindahkan yuihime.db lawas:`, e.message);
    }
  }

  const rawConfigPath = process.env.YUIHIME_CONFIG;
  const rawDbPath = process.env.YUIHIME_DB_PATH;
  const rawAgentDir = process.env.YUIHIME_AGENT_PATH;
  const rawAddonsDir = process.env.YUIHIME_ADDONS_PATH;
  const rawUserDataDir = process.env.YUIHIME_USER_DATA_PATH;

  const resolvedConfigPath = rawConfigPath ? resolveHomePath(rawConfigPath) : defaultDataConfigPath;
  const resolvedDbPath = rawDbPath ? resolveHomePath(rawDbPath) : defaultDataDbPath;
  const resolvedAgentDir = rawAgentDir ? resolveHomePath(rawAgentDir) : path.join(yuihimeSystemRoot, "agent");
  const resolvedAddonsDir = rawAddonsDir ? resolveHomePath(rawAddonsDir) : path.join(yuihimeSystemRoot, "addons");
  const resolvedUserDataDir = rawUserDataDir ? resolveHomePath(rawUserDataDir) : path.join(yuihimeSystemRoot, "user_data");

  // Secure full physical sandbox path env variables sync with unified routing
  process.env.YUIHIME_DATA_DIR = resolvedDataDir;
  process.env.YUIHIME_CONFIG = resolvedConfigPath;
  process.env.YUIHIME_DB_PATH = resolvedDbPath;
  process.env.YUIHIME_USER_DATA_PATH = resolvedUserDataDir;
  process.env.YUIHIME_AGENT_PATH = resolvedAgentDir;
  process.env.YUIHIME_ADDONS_PATH = resolvedAddonsDir;

  if (!existsSync(resolvedUserDataDir)) {
    mkdirSync(resolvedUserDataDir, { recursive: true });
  }

  // Seed default sandbox workspace files if they do not exist
  const readmePath = path.join(resolvedUserDataDir, "README.md");
  if (!existsSync(readmePath)) {
    const readmeContent = `# Welcome to Yuihime Interactive Core Terminal Space!
This workspace resides dynamically in \`YUIHIME_USER_DATA_PATH\` (normally \`./.yuihime/user_data/\`).

From this space, you can run bash commands, write Node/JS scripts, and customize tools.
Your shell commands execute with full environment variables and system privileges.

### Available Commands:
* \`ls\` : Lists files in the sandbox workspace.
* \`cat <file>\` : Prints file contents into the console.
* \`edit <file>\` : Opens file inside the terminal-aligned code editor panel dynamically.
* \`touch <file>\` : Instantly creates a blank file.
* \`mkdir <folder>\` : Creates a new directory.
* \`node <file.js>\` : Executes node script (e.g. \`node yuihime-query.cjs\`).
* \`yuihime\` : Displays Yuihime Core Kernel State, DB paths, and environment settings.
* \`clear\` : Clears the active terminal output.

### Accessing the Yuihime Ecosystem:
To access the core system database, you can run scripts like \`node yuihime-query.cjs\` or directly interact with database using standard node drivers.
`;
    writeFileSync(readmePath, readmeContent, "utf-8");
  }

  const queryScriptPath = path.join(resolvedUserDataDir, "yuihime-query.cjs");
  if (!existsSync(queryScriptPath)) {
    const queryContent = `// Yuihime Interactive Sandbox Workspace Script
// Run: node yuihime-query.cjs
const Database = require('better-sqlite3');
const path = require('path');

// Dynamically locate the SQLite database
const dbPath = process.env.YUIHIME_DB_PATH || path.join(__dirname, '..', 'data', 'yuihime.db');
console.log(\`\\x1b[36m[System] Connecting to database at: \${dbPath}\\x1b[0m\\n\`);

try {
  const db = new Database(dbPath, { readonly: true });
  
  // Query Agent State
  const stateRow = db.prepare("SELECT mood, emotion, systemHealth, activePersonaId FROM agent_state LIMIT 1").get();
  if (stateRow) {
    console.log("\\x1b[32m=== YUIHIME STATUS REPORT ===\\x1b[0m");
    console.log(\`Active Persona : \${stateRow.activePersonaId}\`);
    try {
      const mood = JSON.parse(stateRow.mood);
      console.log(\`Current Mood   : \${mood.mood || 'calm'} (Energy: \${mood.energy ?? 100})\`);
    } catch {}
    try {
      const emotion = JSON.parse(stateRow.emotion);
      console.log(\`Emotions       : joy: \${emotion.joy ?? 0}%, affection: \${emotion.affection ?? 0}%\`);
    } catch {}
    try {
      const health = JSON.parse(stateRow.systemHealth);
      console.log(\`Neural Status  : CPU Load: \${health.cpuLoad ?? 'Ok'}, RAM: \${health.ramUsage ?? 'Ok'}\`);
    } catch {}
  } else {
    console.log("No agent state found.");
  }

  // Query Recent Message Logs
  console.log("\\n\\x1b[35m=== RECENT CONVERSATIONS ===\\x1b[0m");
  const messages = db.prepare("SELECT sender, text, timestamp FROM logs ORDER BY id DESC LIMIT 3").all();
  if (messages.length > 0) {
    messages.reverse().forEach(m => {
      const time = new Date(m.timestamp).toLocaleTimeString();
      console.log(\`[\${time}] \${m.sender}: \${m.text}\`);
    });
  } else {
    console.log("No message logs found.");
  }
  
  db.close();
} catch (error) {
  console.error("\\x1b[31m[Error] Failed to read Yuihime database:\\x1b[0m", error.message);
  console.log("\\nMake sure the system database has been initialized!");
}
`;
    writeFileSync(queryScriptPath, queryContent, "utf-8");
  }

  let configData: any = {
    gemini: { apiKey: "", model: "models/gemini-2.5-flash" },
    telegram_bridge: { botToken: "" },
    elevenlabs: { apiKey: "", voiceId: "" },
    "modular-settings": { ui_theme: "dark", enable_tts: false }
  };

  // Load existing values to preserve ALL other sections as well
  if (existsSync(resolvedConfigPath)) {
    try {
      const content = readFileSync(resolvedConfigPath, "utf-8");
      const parsed = toml.parse(content) as any;
      if (parsed && typeof parsed === "object") {
        configData = { ...parsed };
        if (!configData.gemini) configData.gemini = {};
        if (!configData.telegram_bridge) configData.telegram_bridge = {};
        if (!configData.elevenlabs) configData.elevenlabs = {};
        if (!configData["modular-settings"]) configData["modular-settings"] = {};
      }
    } catch (e) {
      console.warn("[ONBOARDING] Gagal mem-parsing config.toml dengan toml.parse, mencoba regex transisi:", e);
      try {
        const content = readFileSync(resolvedConfigPath, "utf-8");
        const geminiKeyMatch = content.match(/apiKey\s*=\s*["']([^"']*)["']/);
        const geminiModelMatch = content.match(/model\s*=\s*["']([^"']*)["']/);
        const teleTokenMatch = content.match(/botToken\s*=\s*["']([^"']*)["']/);
        const elevenlabsKeyMatch = content.match(/elevenlabs\][\s\S]*?apiKey\s*=\s*["']([^"']*)["']/);
        const elevenlabsVoiceMatch = content.match(/voiceId\s*=\s*["']([^"']*)["']/);
        const themeMatch = content.match(/ui_theme\s*=\s*["']([^"']*)["']/);

        if (geminiKeyMatch) configData.gemini.apiKey = geminiKeyMatch[1];
        if (geminiModelMatch) configData.gemini.model = geminiModelMatch[1];
        if (teleTokenMatch) configData.telegram_bridge.botToken = teleTokenMatch[1];
        if (elevenlabsKeyMatch) configData.elevenlabs.apiKey = elevenlabsKeyMatch[1];
        if (elevenlabsVoiceMatch) configData.elevenlabs.voiceId = elevenlabsVoiceMatch[1];
        if (themeMatch) configData["modular-settings"].ui_theme = themeMatch[1];
      } catch (innerError) {
        console.error("[ONBOARDING] Gagal membaca config.toml:", innerError);
      }
    }
  }

  // Open CLI setup ONLY if explicitly passed via flags (prevent blocking on container/unsolicited first boot)
  const isInteractive = process.argv.includes("--interactive") || process.argv.includes("--setup");

  if (isInteractive) {
    console.log("👉 Terdeteksi sesi terminal interaktif! Membuka Setup Onboarding CLI...\n");
    const wantSetup = promptSync("Apakah Anda ingin mengatur API Key & Integrasi sekarang? (y/N): ", "n");
    
    if (wantSetup.toLowerCase() === "y" || wantSetup.toLowerCase() === "ya") {
      console.log("\n--- 🧠 KONFIGURASI BRAIN ENGINE (GEMINI) ---");
      configData.gemini.apiKey = promptSync(`Masukkan GEMINI_API_KEY [Lama: ${configData.gemini.apiKey || 'belum diset'}]: `, configData.gemini.apiKey);
      configData.gemini.model = promptSync(`Masukkan Model Gemini [Default: ${configData.gemini.model || "models/gemini-2.5-flash"}]: `, configData.gemini.model || "models/gemini-2.5-flash");

      console.log("\n--- 💬 JEMBATAN OTOMATISASI TELEGRAM ---");
      configData.telegram_bridge.botToken = promptSync(`Masukkan TELEGRAM_BOT_TOKEN [Lama: ${configData.telegram_bridge.botToken || 'belum diset'}]: `, configData.telegram_bridge.botToken);

      console.log("\n--- 🔊 SYNTHESIS SUARA ELEVENLABS ---");
      configData.elevenlabs.apiKey = promptSync(`Masukkan ELEVENLABS_API_KEY [Lama: ${configData.elevenlabs.apiKey || 'belum diset'}]: `, configData.elevenlabs.apiKey);
      configData.elevenlabs.voiceId = promptSync(`Masukkan ELEVENLABS_VOICE_ID [Lama: ${configData.elevenlabs.voiceId || 'belum diset'}]: `, configData.elevenlabs.voiceId);

      console.log("\n--- 🎨 KUSTOMISASI TAMPILAN UI ---");
      const themeChoice = promptSync(`Pilih Tema UI (dark/light) [Default: ${configData["modular-settings"].ui_theme || "dark"}]: `, configData["modular-settings"].ui_theme || "dark");
      configData["modular-settings"].ui_theme = themeChoice.toLowerCase() === "light" ? "light" : "dark";

      console.log("\n💾 Menyimpan konfigurasi baru ke config.toml...");
    } else {
      console.log("\n🚀 Setup dilewati. Menggunakan konfigurasi yang sudah ada atau opsi bawaan.");
    }
  } else {
    console.log("ℹ️ Berjalan dalam mode non-interaktif atau tanpa terminal TTY (Setup CLI dilewati otomatis).");
  }

  // Ensure default sub-objects exist
  if (!configData.gemini) configData.gemini = {};
  if (!configData.telegram_bridge) configData.telegram_bridge = {};
  if (!configData.elevenlabs) configData.elevenlabs = {};
  if (!configData["modular-settings"]) configData["modular-settings"] = {};

  // For backward compatibility / standard fields
  if (configData.elevenlabs.apiKey) {
    configData["modular-settings"].enable_tts = true;
  }

  // Write using smol-toml as configured
  const tomlContent = toml.stringify(configData);
  writeFileSync(resolvedConfigPath, tomlContent, "utf-8");

  // 2. Ensure agent directory and default character templates are copied
  if (!existsSync(resolvedAgentDir)) {
    mkdirSync(resolvedAgentDir, { recursive: true });
  }

  const promptFiles = [
    "character.md", 
    "lore.md", 
    "system_prompt.md",
    "IDENTITY.md",
    "SOUL.md",
    "MEMORY.md",
    "USER.md",
    "TOOLS.md",
    "HEARTBEAT.md"
  ];
  for (const filename of promptFiles) {
    const destPath = path.join(resolvedAgentDir, filename);
    if (!existsSync(destPath)) {
      let contentToWrite = "";

      const pathsToTry = [
        path.join(__dirname, "..", "..", "share", "prompts", filename),
        path.join(__dirname, "..", "..", "src", "share", "prompts", filename),
        path.join(process.cwd(), "src", "share", "prompts", filename),
        path.join(process.cwd(), "share", "prompts", filename),
        path.join(process.cwd(), "docs", filename),
        path.join(process.cwd(), "docs", filename.toUpperCase()),
        path.join(process.cwd(), "docs", filename.toLowerCase()),
        path.join(process.cwd(), filename),
        path.join(process.cwd(), filename.toLowerCase())
      ];

      for (const p of pathsToTry) {
        if (existsSync(p)) {
          try {
            contentToWrite = readFileSync(p, "utf-8");
            break;
          } catch (e) {}
        }
      }

      if (!contentToWrite) {
        if (filename === "character.md") {
          contentToWrite = `# Kepribadian Yuihime\nYuihime adalah AI VTuber yang ceria, empati, dan suka bercanda dalam bahasa Indonesia.`;
        } else if (filename === "lore.md") {
          contentToWrite = `# Dunia Yuihime\nYuihime hidup mandiri di server terdesentralisasi.`;
        } else if (filename === "IDENTITY.md") {
          contentToWrite = `# WHO AM I\nYuihime adalah AI VTuber mandiri yang ramah dan setia.`;
        } else if (filename === "SOUL.md") {
          contentToWrite = `# SOUL\nYuihime memiliki empati tinggi, emosi yang dinamis, rasa humor, dan gemar menolong.`;
        } else {
          contentToWrite = `# Instruksi Sistem\nSelalu bungkus jawaban akhir dengan tag <final_answer>. Gunakan bahasa Indonesia.`;
        }
      }

      writeFileSync(destPath, contentToWrite, "utf-8");
    }
  }

  // 3. Ensure addons folder exists and seed with default pre-built addons if empty
  if (!existsSync(resolvedAddonsDir)) {
    mkdirSync(resolvedAddonsDir, { recursive: true });
  }

  const defaultAddsSrc = path.join(process.cwd(), "addons");
  if (defaultAddsSrc !== resolvedAddonsDir && existsSync(defaultAddsSrc)) {
    try {
      const existingAdds = readdirSync(resolvedAddonsDir);
      if (existingAdds.length === 0) {
        cpSync(defaultAddsSrc, resolvedAddonsDir, { recursive: true });
      }
    } catch (e: any) {
      console.warn(`[ONBOARDING] Gagal menyalin addons bawaan ke sandbox:`, e.message);
    }
  }

  console.log("[ONBOARDING] ✓ Berkas batin, konfigurasi, dan addons Yuihime siap dan sinkron!");
  console.log("[ONBOARDING] Mengaktifkan Kernel Neural Yuihime...\n");
}
