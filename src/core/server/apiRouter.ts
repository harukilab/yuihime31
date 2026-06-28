import express from "express";
import { WebSocket } from "ws";
import path from "path";
import fs from "fs/promises";
import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync, statSync, rmSync, unlinkSync, realpathSync, renameSync } from "fs";
import { exec } from "child_process";
import { promisify } from "util";
import * as toml from "smol-toml";

import { AIService } from "../kernel/ai.js";
import { SettingsManager } from "../kernel/settings.js";
import { PuterService } from "../kernel/PuterService.js";
import { CronModule } from "../kernel/cron.js";
import { NeuralInterface } from "../kernel/NeuralInterface.js";
import { MultiChannelQueue } from "../kernel/MultiChannelQueue.js";
import { eventBus } from "../kernel/event-bus.js";
import { initializeBot, getActiveTelegramBot } from "./telegram.js";
import { Cortex } from "../cortex.js";
import { Soul } from "../soul.js";
import { deduplicateAndMergeIdentities } from "../database.js";
import { APIService } from "../../services/api.js";
import { datasetSynthesizer } from "./datasetSynthesizer.js";
import { registerStorageRoutes } from "./routes/storageRouter.js";
import { registerSandboxRoutes } from "./routes/sandboxRouter.js";
import { registerTelegramRoutes } from "./routes/telegramRouter.js";
import { registerSynthesizerRoutes } from "./routes/synthesizerRouter.js";
import { registerToolsRoutes } from "./routes/toolsRouter.js";
import { registerIdentitiesRoutes } from "./routes/identitiesRouter.js";
import { registerAiRoutes } from "./routes/aiRouter.js";
import { registerCortexRoutes } from "./routes/cortexRouter.js";
import { registerDatasetRoutes } from "./routes/datasetRouter.js";
import { registerSystemRoutes } from "./routes/systemRouter.js";

const execPromise = promisify(exec);

export const activeWSConnections: Set<WebSocket> = new Set();
export const activeStreamClients: any[] = [];

export const broadcastToWS = (payload: any) => {
  const wsChunk = JSON.stringify(payload);
  activeWSConnections.forEach(client => {
    try {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(wsChunk);
      }
    } catch (err) {
      console.warn(`[WS_GATEWAY] Gagal mengirim ke client WS:`, err);
    }
  });

  const sseChunk = `data: ${wsChunk}\n\n`;
  activeStreamClients.forEach(c => {
    try {
      if (c && c.res) {
        c.res.write(sseChunk);
      }
    } catch (err) {
      console.warn(`[STREAM_GATEWAY] Gagal mengirim paket ke overlay ${c.id}:`, err);
    }
  });
};

// --- Server-Side Cron Action Builder ---
export const getCronAction = (id: string, name: string, repeating: boolean, db: any) => async () => {
  console.log(`[CRON] Executing Task: ${name} (${id})`);
  
  // CUSTOM OVERRIDES FOR BUILT-IN SYSTEM TASKS
  if (id === 'memory-consolidation') {
    try {
      const { SystemRegistry } = await import('../registry.js');
      const consolidator = SystemRegistry.getModule('memory-consolidation');
      if (consolidator) {
         await consolidator.run('CONSOLIDATE_MEMORIES', {}, { db });
      } else {
         console.warn("[CRON] Memory Consolidator module not found in registry.");
      }
    } catch (e: any) {
      console.error("[CRON] Memory consolidation trigger failed:", e.message || e);
    }
    
    if (repeating) {
      db.prepare("UPDATE cron_tasks SET lastRun = ? WHERE id = ?").run(Date.now(), id);
    } else {
      db.prepare("DELETE FROM cron_tasks WHERE id = ?").run(id);
      CronModule.getInstance().stopTask(id);
    }
    return;
  }

  if (id === 'puter-hourly-check') {
    try {
      const response = await fetch('http://127.0.0.1:3000/api/puter/heartbeat');
      const data = await response.json();
      console.log('[CRON] Puter status:', data.status);
    } catch (e: any) {
      console.error('[CRON] Puter check failed:', e.message || e);
    }
    
    if (repeating) {
      db.prepare("UPDATE cron_tasks SET lastRun = ? WHERE id = ?").run(Date.now(), id);
    } else {
      db.prepare("DELETE FROM cron_tasks WHERE id = ?").run(id);
      CronModule.getInstance().stopTask(id);
    }
    return;
  }
  
  let contextId = 'live_stream';
  let chatType = 'Live Chat';
  let senderName = 'System';
  try {
    const task: any = db.prepare("SELECT context_id, chat_type, sender_name FROM cron_tasks WHERE id = ?").get(id);
    if (task) {
      contextId = task.context_id || contextId;
      chatType = task.chat_type || chatType;
      senderName = task.sender_name || senderName;
    }
  } catch (e: any) {
    console.error("[CRON_ERROR] Failed to fetch task info:", e);
  }

  // Add memory of the trigger
  const memoryId = Math.random().toString(36).substr(2, 9);
  db.prepare(`
    INSERT INTO memories (id, type, content, importance, speaker, context, timestamp)
    VALUES (?, 'system', ?, 0.8, 'System', ?, ?)
  `).run(memoryId, `[SYSTEM_SIGNAL]: ${name} triggered.`, contextId, Date.now());

  if (repeating) {
    db.prepare("UPDATE cron_tasks SET lastRun = ? WHERE id = ?").run(Date.now(), id);
  } else {
    db.prepare("DELETE FROM cron_tasks WHERE id = ?").run(id);
    CronModule.getInstance().stopTask(id);
  }

  // Process thinking and dispatch response on the server side
  try {
    console.log(`[CRON_THINK] Running neural processor for cron task: ${name} on channel: ${chatType}:${contextId}`);
    
    const prompt = `[CRON_SIGNAL]: ${name}. Please process this scheduled request now.`;
    
    const reply = await NeuralInterface.processNeuralInput(
       prompt,
       senderName,
       contextId,
       chatType
    );

    if (reply && reply.trim()) {
      console.log(`[CRON_DISPATCH] Generated reply: ${reply}`);

      // Broadcast to WebView & OBS Overlays (animations, subtitle, state)
      const replyPayload = {
        type: "state_update",
        data: {
          state: { status: "talking" },
          activeSubtitle: reply,
          typedSubtitle: reply,
          isSubtitleTyping: false,
          animations: ["TALK", "SMILE"]
        }
      };

      try {
        broadcastToWS(replyPayload);
      } catch (wsErr) {}

      // Dispatch specifically based on channel (e.g., Telegram)
      if (contextId.startsWith("tg_")) {
        const chatId = contextId.replace("tg_", "");
        try {
          const bot = getActiveTelegramBot();
          if (bot) {
            await bot.telegram.sendMessage(chatId, reply);
            console.log(`[CRON_DISPATCH] Sent response to Telegram chat ${chatId}`);
          } else {
            console.warn("[CRON_DISPATCH] Telegram bot is not active/available.");
          }
        } catch (tgErr: any) {
          console.error("[CRON_DISPATCH] Failed to send message to Telegram:", tgErr.message);
        }
      }
    }
  } catch (neuralErr: any) {
    console.error("[CRON_THINK] Neural processing failed for cron task:", neuralErr);
  }
};

// --- Configuration & Sandbox Settings ---
const apiRootEnvStr = process.env.YUIHIME_SYSTEM_ROOT || process.env.YUIHIME_ROOT || ".yuihime";
export const apiCustomSystemRoot = path.isAbsolute(apiRootEnvStr) ? apiRootEnvStr : path.join(process.cwd(), apiRootEnvStr);

export let systemConfig: any = {
  sandbox: {
    sandboxRoot: 'sandbox',
    commandBlacklist: ["rm -rf /", "mkfs", "dd", "reboot", "shutdown", "chmod 777 /"],
    execTimeoutMs: 10000
  },
  agent: {
    dreamThreshold: 5,
    learningThreshold: 10,
    pulseIntervalMs: 30000,
    minEnergyForProactiveLogic: 20
  }
};

try {
  const configPath = path.join(process.cwd(), 'system.config.json');
  if (existsSync(configPath)) {
    systemConfig = JSON.parse(readFileSync(configPath, 'utf-8'));
  }
} catch (e) {
  console.warn("Failed to load system.config.json, using defaults:", e);
}

export const sandboxCfg: any = systemConfig.sandbox || systemConfig;

export const getDynamicSandboxRoot = () => {
  let rawPath = process.env.YUIHIME_USER_DATA_PATH;
  if (!rawPath) {
    try {
      const settings = SettingsManager.getInstance().getAll();
      rawPath = settings.sandbox_paths?.user_data_path;
    } catch (e) {
      console.warn("Failed to retrieve sandbox_paths.user_data_path from SettingsManager:", e);
    }
  }

  if (rawPath) {
    if (path.isAbsolute(rawPath)) {
      return path.resolve(rawPath);
    }
    if (rawPath.startsWith('./.yuihime') || rawPath.startsWith('.yuihime')) {
      return path.resolve(process.cwd(), rawPath);
    }
    return path.resolve(apiCustomSystemRoot, rawPath);
  }

  return path.resolve(path.join(apiCustomSystemRoot, "user_data"));
};

export const SANDBOX_ROOT = getDynamicSandboxRoot();
if (!existsSync(SANDBOX_ROOT)) {
  try {
    mkdirSync(SANDBOX_ROOT, { recursive: true });
  } catch (_) {}
}

export const verifySandboxPath = (targetPath: string, action?: string, confirmed?: boolean) => {
  if (targetPath.includes('\0')) {
    throw new Error("SECURITY_ALERT: Null Byte injection detected.");
  }

  const isYolo = process.env.YUIHIME_SANDBOX_YOLO === "true" || process.env.YUIHIME_SHELL_YOLO === "true";
  if (isYolo) {
    // Stage 2 when YOLO is ON: allow everything "all in os" - resolve relative to system cwd
    return path.resolve(process.cwd(), targetPath);
  }

  const normalized = targetPath.replace(/\\/g, '/').toLowerCase();
  const parts = normalized.split('/');
  if (parts.some(part => part.startsWith('.') && part !== '.' && part !== '..')) {
    throw new Error("SECURITY_ALERT: Interacting with sensitive dotfiles or system configuration directories is forbidden.");
  }

  const dynamicSandboxRoot = getDynamicSandboxRoot();

  // Stage 1 (Primary / Utama Prioritas): Jail within .yuihime or dynamicSandboxRoot
  let resolvedPath: string;
  if (path.isAbsolute(targetPath)) {
    resolvedPath = path.resolve(targetPath);
  } else if (targetPath.startsWith('user_data/') || targetPath.startsWith('./user_data/')) {
    const cleanRel = targetPath.startsWith('./') ? targetPath.substring(2) : targetPath;
    const subPath = cleanRel.substring('user_data/'.length);
    resolvedPath = path.resolve(dynamicSandboxRoot, subPath);
  } else {
    resolvedPath = path.resolve(apiCustomSystemRoot, targetPath);
  }

  if (!resolvedPath.startsWith(apiCustomSystemRoot) && !resolvedPath.startsWith(dynamicSandboxRoot)) {
    throw new Error("SECURITY_ALERT: Unauthorized path access attempted outside .yuihime system root.");
  }

  try {
    if (existsSync(resolvedPath)) {
      const realResolved = realpathSync(resolvedPath);
      if (!realResolved.startsWith(apiCustomSystemRoot) && !realResolved.startsWith(dynamicSandboxRoot)) {
        throw new Error("SECURITY_ALERT: Symlink escape bypass detected.");
      }
    }
  } catch (_) {}

  // Stage 2 (Secondary Users Data): Inside user_data (dynamicSandboxRoot). Write/Edit or Delete actions require explicit confirmation.
  const isInsideUserData = resolvedPath.startsWith(dynamicSandboxRoot);
  if (isInsideUserData && (action === 'write' || action === 'delete' || action === 'move' || action === 'copy')) {
    const fileExists = existsSync(resolvedPath);
    const isEditOrDelete = (action === 'write' && fileExists) || action === 'delete' || action === 'move' || action === 'copy';

    const settings = SettingsManager.getInstance().getAll();
    const autoAcc = settings.sandbox_paths?.auto_acc_user_data === true;

    if (isEditOrDelete && confirmed !== true && !autoAcc) {
      throw new Error(`CONFIRMATION_REQUIRED: Action '${action}' on user_data file/folder requires explicit confirmation.`);
    }
  }

  return resolvedPath;
};

// --- API Router Registration ---
export function registerAPIRoutes(app: express.Express, db: any) {
  console.log("[SERVER_ROUTE_INIT] registerAPIRoutes started!");
  // Sync file automation rules schedules to Cron Module at startup
  try {
    import("./fileAutomation.js").then((mod) => {
      mod.syncFileAutomationRulesAndSchedules(db);
    }).catch(err => {
      console.error("[SERVER] Failed to load syncFileAutomationRulesAndSchedules on boot:", err);
    });
  } catch (err) {
    console.error("[SERVER] File automation rules boot init failed:", err);
  }

  // --- Yui Airi dataset neuromorphic training importer ---
  console.log("[SERVER_ROUTE_INIT] Registering storage routes...");
  registerStorageRoutes(app, db);
  console.log("[SERVER_ROUTE_INIT] Registering sandbox routes...");
  registerSandboxRoutes(app, db);
  console.log("[SERVER_ROUTE_INIT] Registering telegram routes...");
  registerTelegramRoutes(app, db);
  console.log("[SERVER_ROUTE_INIT] Registering synthesizer routes...");
  registerSynthesizerRoutes(app, db);
  console.log("[SERVER_ROUTE_INIT] Registering tools routes...");
  registerToolsRoutes(app, db);
  console.log("[SERVER_ROUTE_INIT] Registering identities routes...");
  registerIdentitiesRoutes(app, db);
  console.log("[SERVER_ROUTE_INIT] Registering system routes...");
  registerSystemRoutes(app, db);
  console.log("[SERVER_ROUTE_INIT] Registering dataset routes...");
  registerDatasetRoutes(app, db);
  console.log("[SERVER_ROUTE_INIT] Registering AI routes...");
  registerAiRoutes(app, db);
  console.log("[SERVER_ROUTE_INIT] Registering cortex routes...");
  registerCortexRoutes(app, db);
  console.log("[SERVER_ROUTE_INIT] All API routes registered successfully!");

  // Log all registered routes for debugging purposes
  try {
    if (app._router && app._router.stack) {
      const routes: string[] = [];
      app._router.stack.forEach((middleware: any) => {
        if (middleware.route) { // routes registered directly on the app
          routes.push(`${Object.keys(middleware.route.methods).join(",").toUpperCase()} ${middleware.route.path}`);
        } else if (middleware.name === "router" && middleware.handle.stack) { // router middleware
          middleware.handle.stack.forEach((handler: any) => {
            if (handler.route) {
              routes.push(`${Object.keys(handler.route.methods).join(",").toUpperCase()} ${handler.route.path}`);
            }
          });
        }
      });
      console.log("[SERVER_ROUTE_INIT] Current express routing table:\n" + routes.join("\n"));
    }
  } catch (err: any) {
    console.warn("[SERVER_ROUTE_INIT] Failed to print routing table:", err.message);
  }

  app.all("/api/*", (req, res) => {
    res.status(404).json({ 
      error: "Neural API Endpoint Not Found", 
      path: req.url,
      method: req.method
    });
  });
}
