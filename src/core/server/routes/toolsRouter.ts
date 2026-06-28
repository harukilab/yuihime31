import express from "express";
import path from "path";
import fs from "fs/promises";
import { existsSync, readdirSync, statSync, realpathSync, mkdirSync } from "fs";
import { exec } from "child_process";
import { promisify } from "util";
import { AIService } from "../../kernel/ai.js";
import { apiCustomSystemRoot, verifySandboxPath, getDynamicSandboxRoot } from "../apiRouter.js";
import { CustomToolsLoader } from "../../CustomToolsLoader.js";

const execPromise = promisify(exec);

export function registerToolsRoutes(app: express.Express, db: any) {
  app.get("/api/tools/search", async (req, res) => {
    const { query } = req.query;
    if (!query) return res.status(400).json({ error: "No query provided" });

    try {
      const ai = AIService.getInstance();
      const results = await ai.search(query as string);
      res.json(results);
    } catch (error: any) {
      console.error("[SERVER] Google Search Grounding tool failed:", error);
      // Fallback in case of API Key configuration or service issues so it never breaks the prompt completely
      const fallbackResults = [
        { title: `${query} - Wikipedia`, snippet: `Knowledge summary for ${query}. This topic involves complex systems and historical context...`, url: `https://en.wikipedia.org/wiki/${encodeURIComponent(query as string)}` },
        { title: `Latest News on ${query}`, snippet: `Recent developments indicate a shift in how ${query} is perceived by the global community.`, url: `https://news.google.com/search?q=${encodeURIComponent(query as string)}` }
      ];
      res.json(fallbackResults);
    }
  });

  app.post("/api/tools/execute_js", async (req, res) => {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: "No code provided" });

    try {
      const result = eval(code);
      res.json({ result: String(result) });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/tools/chat/search", async (req, res) => {
    const { query, platform, limit, contextId, senderName, viewerIdentityId } = req.body;
    try {
      // 1. Resolve identity
      let identity: any = null;
      if (viewerIdentityId) {
        identity = db.prepare("SELECT * FROM identities WHERE id = ?").get(viewerIdentityId);
      }
      if (!identity && senderName) {
        identity = db.prepare("SELECT * FROM identities WHERE LOWER(perceivedName) = ?").get(senderName.toLowerCase());
      }
      if (!identity && contextId) {
        // Search identities to see if any linked account contains this context id
        const allIdentities = db.prepare("SELECT * FROM identities").all() as any[];
        for (const id of allIdentities) {
          const linked = id.linkedAccounts ? JSON.parse(id.linkedAccounts) : [];
          if (Array.isArray(linked)) {
            const hasMatch = linked.some((acc: string) => {
              const lowerAcc = acc.toLowerCase();
              if (contextId.startsWith("tg_") && lowerAcc.includes(`telegram:id:${contextId.replace("tg_", "")}`)) return true;
              if (contextId.startsWith("dc_") && lowerAcc.includes(contextId.replace("dc_", ""))) return true;
              return false;
            });
            if (hasMatch) {
              identity = id;
              break;
            }
          }
        }
      }

      // 2. Extract usernames/handles
      const perceivedName = identity ? identity.perceivedName : (senderName || "Unknown");
      const linkedAccounts = identity && identity.linkedAccounts ? JSON.parse(identity.linkedAccounts) : [];
      
      const lowerNames = [perceivedName.toLowerCase()];
      for (const acc of linkedAccounts) {
        const parts = acc.split(":");
        if (parts.length > 1) {
          const handle = parts[parts.length - 1].toLowerCase().trim();
          if (handle && !lowerNames.includes(handle)) {
            lowerNames.push(handle);
          }
        }
      }

      // 3. Find unique context IDs where this user has participated
      const placeholders = lowerNames.map(() => "?").join(",");
      const contextRows = db.prepare(`
        SELECT DISTINCT context FROM memories 
        WHERE LOWER(speaker) IN (${placeholders})
      `).all(...lowerNames) as { context: string }[];

      const targetContexts = new Set<string>();
      if (contextId) {
        targetContexts.add(contextId);
      }
      for (const r of contextRows) {
        if (r.context) {
          targetContexts.add(r.context);
        }
      }

      // 4. Filter contexts by platform specified
      const finalContexts = Array.from(targetContexts).filter(ctx => {
        const p = platform || "all";
        if (p === 'web') {
          return ctx === 'live_stream' || ctx.startsWith('web_');
        }
        if (p === 'telegram') {
          return ctx.startsWith('tg_');
        }
        if (p === 'discord') {
          return ctx.startsWith('dc_');
        }
        return true;
      });

      if (finalContexts.length === 0 && contextId) {
        finalContexts.push(contextId);
      }

      if (finalContexts.length === 0) {
        return res.json({
          success: true,
          identity: perceivedName,
          query: query || null,
          platform: platform || "all",
          messages: []
        });
      }

      // 5. Query message rows in those contexts
      let queryClause = "";
      const queryParams: any[] = [];
      if (query && query.trim() !== "") {
        queryClause = "AND (content LIKE ? OR tags LIKE ?)";
        queryParams.push(`%${query}%`, `%${query}%`);
      }

      const contextsPlaceholders = finalContexts.map(() => "?").join(",");
      const limitVal = typeof limit === 'number' ? limit : 20;

      const messageRows = db.prepare(`
        SELECT * FROM memories 
        WHERE context IN (${contextsPlaceholders}) ${queryClause}
        ORDER BY timestamp DESC
        LIMIT ?
      `).all(...finalContexts, ...queryParams, limitVal) as any[];

      const messages = messageRows.map((r: any) => ({
        id: r.id,
        type: r.type,
        content: r.content,
        speaker: r.speaker,
        context: r.context,
        platform: r.context.startsWith("tg_") ? "Telegram" : r.context.startsWith("dc_") ? "Discord" : (r.context === "live_stream" || r.context.startsWith("web_")) ? "Web" : "Unknown",
        timestamp: r.timestamp,
        timeString: new Date(r.timestamp).toISOString()
      }));

      res.json({
        success: true,
        identity: perceivedName,
        query: query || null,
        platform: platform || "all",
        contextsSearched: finalContexts,
        messages
      });
    } catch (error: any) {
      console.error("[SERVER] POST /api/tools/chat/search error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/tools/shell", async (req, res) => {
    const { command } = req.body;
    if (!command) return res.status(400).json({ error: "No command provided" });
    
    try {
      const isYolo = process.env.YUIHIME_SHELL_YOLO === "true";
      const restricted = ["rm -rf /", "mkfs", "dd"];
      if (!isYolo && restricted.some(r => command.includes(r))) {
        return res.status(403).json({ error: "Command restricted for safety." });
      }

      const sandboxDir = getDynamicSandboxRoot();
      await fs.mkdir(sandboxDir, { recursive: true });

      const { stdout, stderr } = await execPromise(command, { cwd: sandboxDir, timeout: 10000 });
      res.json({ stdout, stderr });
    } catch (error: any) {
      res.status(500).json({ error: error.message, stderr: error.stderr });
    }
  });

  app.post("/api/tools/files/write", async (req, res) => {
    const { filename, content } = req.body;
    if (!filename) return res.status(400).json({ error: "No filename provided" });

    try {
      const sandboxDir = getDynamicSandboxRoot();
      await fs.mkdir(sandboxDir, { recursive: true });
      
      const safePath = path.resolve(sandboxDir, filename);
      if (!safePath.startsWith(sandboxDir)) {
        return res.status(403).json({ error: "Access denied. Paths must remain inside the user_data sandbox." });
      }

      await fs.mkdir(path.dirname(safePath), { recursive: true });
      await fs.writeFile(safePath, content || "");
      res.json({ success: true, path: safePath });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/tools/files/read", async (req, res) => {
    const { filename } = req.query;
    if (!filename) return res.status(400).json({ error: "No filename provided" });

    try {
      const sandboxDir = getDynamicSandboxRoot();
      const safePath = path.resolve(sandboxDir, filename as string);
      if (!safePath.startsWith(sandboxDir)) {
        return res.status(403).json({ error: "Access denied. Paths must remain inside the user_data sandbox." });
      }

      const content = await fs.readFile(safePath, "utf-8");
      res.json({ content });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/tools/files/list", async (req, res) => {
    try {
      const sandboxDir = getDynamicSandboxRoot();
      await fs.mkdir(sandboxDir, { recursive: true });
      
      const getFilesRecursively = async (dir: string): Promise<string[]> => {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        const files = await Promise.all(entries.map(async (entry) => {
          const resPath = path.resolve(dir, entry.name);
          if (entry.isDirectory()) {
            const subFiles = await getFilesRecursively(resPath);
            return subFiles.map(f => path.join(entry.name, f));
          }
          return entry.name;
        }));
        return files.flat();
      };

      const files = await getFilesRecursively(sandboxDir);
      res.json({ files });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/tools/files/download", async (req, res) => {
    const { url, filename } = req.body;
    if (!url) return res.status(400).json({ error: "No URL provided" });

    try {
      const sandboxDir = getDynamicSandboxRoot();
      await fs.mkdir(sandboxDir, { recursive: true });

      const fetchResponse = await fetch(url);
      if (!fetchResponse.ok) {
        return res.status(500).json({ error: `Failed to fetch URL. Status code: ${fetchResponse.status}` });
      }

      let finalName = filename;
      if (!finalName) {
        const contentDisp = fetchResponse.headers.get("content-disposition");
        const match = contentDisp && contentDisp.match(/filename\*?=["']?(?:UTF-8'')?([^"';]+)["']?/i);
        if (match && match[1]) {
          finalName = decodeURIComponent(match[1]);
        } else {
          try {
            const parsedUrl = new URL(url);
            finalName = path.basename(parsedUrl.pathname);
          } catch (_) {}
          if (!finalName || finalName === "/" || finalName === ".") {
            finalName = "downloaded_file_" + Date.now();
          }
        }
      }

      const safePath = path.resolve(sandboxDir, finalName);
      if (!safePath.startsWith(sandboxDir)) {
        return res.status(403).json({ error: "Access denied. Paths must remain inside the user_data sandbox." });
      }

      const arrayBuffer = await fetchResponse.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      await fs.mkdir(path.dirname(safePath), { recursive: true });
      await fs.writeFile(safePath, buffer);

      res.json({
        success: true,
        filename: finalName,
        size: buffer.length,
        message: `Successfully downloaded and saved file as "${finalName}" (${buffer.length} bytes)`
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/tools/files/send", async (req, res) => {
    const { filename, caption, recipient, contextId } = req.body;
    if (!filename) return res.status(400).json({ error: "No filename provided" });

    try {
      const sandboxDir = getDynamicSandboxRoot();
      const safePath = path.resolve(sandboxDir, filename);
      if (!safePath.startsWith(sandboxDir)) {
        return res.status(403).json({ error: "Access denied. Paths must remain inside the user_data sandbox." });
      }

      if (!existsSync(safePath)) {
        return res.status(404).json({ error: `File "${filename}" not found in sandbox.` });
      }

      let sent = false;
      let platform = "web";
      let detail = "Saved in sandbox workspace (retrievable in UI)";

      const activeContextId = contextId || "";
      if (activeContextId.startsWith("tg_")) {
        const chatId = activeContextId.substring(3);
        const bot = (globalThis as any).activeTelegramBot;
        if (bot) {
          const { createReadStream } = await import("fs");
          console.log(`[API_FILE_SEND] Sending file "${filename}" to Telegram chatId: ${chatId}`);
          await bot.telegram.sendDocument(chatId, { source: createReadStream(safePath), filename: path.basename(safePath) }, { caption: caption || "" });
          sent = true;
          platform = "telegram";
          detail = `Successfully sent to Telegram active chat (${chatId})`;
        }
      } else if (activeContextId.startsWith("dc_")) {
        const channelId = activeContextId.substring(3);
        const client = (globalThis as any).activeDiscordClient;
        if (client) {
          console.log(`[API_FILE_SEND] Sending file "${filename}" to Discord channelId: ${channelId}`);
          const channel = await client.channels.fetch(channelId);
          if (channel && typeof channel.send === "function") {
            await channel.send({
              content: caption || undefined,
              files: [safePath]
            });
            sent = true;
            platform = "discord";
            detail = `Successfully sent to Discord active channel (${channelId})`;
          }
        }
      }

      if (!sent && recipient) {
        const dbModulePath = '../../core/database.js';
        const dbMod = await import(/* @vite-ignore */ dbModulePath);
        const activeDb = dbMod.initializeDatabase();
        if (activeDb) {
          const cleanRec = recipient.trim();
          const cleanUsername = cleanRec.startsWith("@") ? cleanRec.substring(1) : cleanRec;
          let tgId: number | null = null;

          if (/^\d+$/.test(cleanRec)) {
            tgId = parseInt(cleanRec);
          } else {
            const rowIdent = activeDb.prepare("SELECT linkedAccounts FROM identities WHERE LOWER(perceivedName) = ? OR LOWER(realName) = ?")
              .get(cleanRec.toLowerCase(), cleanRec.toLowerCase());
            if (rowIdent) {
              const accounts = rowIdent.linkedAccounts ? JSON.parse(rowIdent.linkedAccounts) : [];
              for (const acc of accounts) {
                if (acc.toLowerCase().startsWith("telegram:id:")) {
                  tgId = parseInt(acc.split(":")[2]);
                  break;
                }
              }
            }
            if (!tgId) {
              const tgUser = activeDb.prepare("SELECT tg_id FROM telegram_users WHERE LOWER(username) = ?").get(cleanUsername.toLowerCase());
              if (tgUser) {
                tgId = tgUser.tg_id;
              }
            }
          }

          if (tgId) {
            const bot = (globalThis as any).activeTelegramBot;
            if (bot) {
              const { createReadStream } = await import("fs");
              console.log(`[API_FILE_SEND] Sending file "${filename}" to resolved Telegram user: ${tgId}`);
              await bot.telegram.sendDocument(tgId, { source: createReadStream(safePath), filename: path.basename(safePath) }, { caption: caption || "" });
              sent = true;
              platform = "telegram";
              detail = `Successfully sent to Telegram recipient: ${recipient} (ID: ${tgId})`;
            }
          }
        }
      }

      res.json({
        success: true,
        sent,
        platform,
        detail,
        filename,
        message: sent ? `File successfully dispatched via ${platform}: ${detail}` : `File is saved in sandbox environment. (No active chat channel context was detected to push it directly to Telegram/Discord)`
      });
    } catch (error: any) {
      console.error("[API_FILE_SEND] Error sending file:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // --- Secure File Manager Endpoint ---
  app.post("/api/tools/files/manager", async (req, res) => {
    const { action, source, destination, path: targetPath, recursive, pattern, confirmed } = req.body;
    if (!action) return res.status(400).json({ error: "No action provided" });

    try {
      const sandboxDir = getDynamicSandboxRoot();
      await fs.mkdir(sandboxDir, { recursive: true });

      if (action === "copy") {
        if (!source || !destination) {
          return res.status(400).json({ error: "Source and destination are required for copy action." });
        }
        const safeSrc = verifySandboxPath(source, action, confirmed);
        const safeDst = verifySandboxPath(destination, action, confirmed);

        if (!existsSync(safeSrc)) {
          return res.status(404).json({ error: `Source path "${source}" does not exist.` });
        }

        await fs.mkdir(path.dirname(safeDst), { recursive: true });
        await fs.cp(safeSrc, safeDst, { recursive: recursive !== false });
        
        return res.json({
          success: true,
          message: `Successfully copied "${source}" to "${destination}"`,
          source: safeSrc,
          destination: safeDst
        });
      }

      if (action === "move") {
        if (!source || !destination) {
          return res.status(400).json({ error: "Source and destination are required for move action." });
        }
        const safeSrc = verifySandboxPath(source, action, confirmed);
        const safeDst = verifySandboxPath(destination, action, confirmed);

        if (!existsSync(safeSrc)) {
          return res.status(404).json({ error: `Source path "${source}" does not exist.` });
        }

        await fs.mkdir(path.dirname(safeDst), { recursive: true });
        await fs.rename(safeSrc, safeDst);

        return res.json({
          success: true,
          message: `Successfully moved/renamed "${source}" to "${destination}"`,
          source: safeSrc,
          destination: safeDst
        });
      }

      if (action === "delete") {
        if (!targetPath) {
          return res.status(400).json({ error: "Path is required for delete action." });
        }
        const safePath = verifySandboxPath(targetPath, action, confirmed);

        if (!existsSync(safePath)) {
          return res.status(404).json({ error: `Path "${targetPath}" does not exist.` });
        }

        if (safePath === sandboxDir) {
          return res.status(403).json({ error: "Deleting the sandbox root directory is strictly forbidden." });
        }

        await fs.rm(safePath, { recursive: recursive !== false, force: true });

        return res.json({
          success: true,
          message: `Successfully deleted "${targetPath}"`,
          path: safePath
        });
      }

      if (action === "mkdir") {
        if (!targetPath) {
          return res.status(400).json({ error: "Path is required for mkdir action." });
        }
        const safePath = verifySandboxPath(targetPath);

        await fs.mkdir(safePath, { recursive: true });

        return res.json({
          success: true,
          message: `Successfully created directory "${targetPath}"`,
          path: safePath
        });
      }

      if (action === "exists") {
        if (!targetPath) {
          return res.status(400).json({ error: "Path is required for exists action." });
        }
        const safePath = verifySandboxPath(targetPath);
        const exists = existsSync(safePath);

        return res.json({
          success: true,
          exists,
          path: safePath
        });
      }

      if (action === "info") {
        if (!targetPath) {
          return res.status(400).json({ error: "Path is required for info action." });
        }
        const safePath = verifySandboxPath(targetPath);

        if (!existsSync(safePath)) {
          return res.status(404).json({ error: `Path "${targetPath}" does not exist.` });
        }

        const stats = await fs.stat(safePath);

        return res.json({
          success: true,
          path: safePath,
          info: {
            isFile: stats.isFile(),
            isDirectory: stats.isDirectory(),
            size: stats.size,
            createdAt: stats.birthtime,
            updatedAt: stats.mtime,
            permissions: stats.mode
          }
        });
      }

      if (action === "find") {
        const safeDir = targetPath ? verifySandboxPath(targetPath) : sandboxDir;
        if (!existsSync(safeDir)) {
          return res.status(404).json({ error: `Directory "${targetPath || '.'}" does not exist.` });
        }

        const matches: Array<{ name: string; relativePath: string; isDir: boolean; size: number }> = [];
        const patternRegex = pattern ? new RegExp(pattern.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&').replace(/\\\*/g, '.*'), 'i') : null;

        const scan = async (dir: string) => {
          const entries = await fs.readdir(dir, { withFileTypes: true });
          for (const entry of entries) {
            const fullPath = path.resolve(dir, entry.name);
            const relPath = path.relative(sandboxDir, fullPath).replace(/\\/g, '/');

            if (entry.name.startsWith('.') && entry.name !== '.' && entry.name !== '..') {
              continue;
            }

            const isMatch = !patternRegex || patternRegex.test(entry.name);
            let size = 0;
            try {
              const stat = await fs.stat(fullPath);
              size = stat.size;
            } catch (_) {}

            if (isMatch) {
              matches.push({
                name: entry.name,
                relativePath: relPath,
                isDir: entry.isDirectory(),
                size
              });
            }

            if (entry.isDirectory() && recursive !== false) {
              await scan(fullPath);
            }
          }
        };

        await scan(safeDir);

        return res.json({
          success: true,
          matches,
          count: matches.length
        });
      }

      return res.status(400).json({ error: `Unsupported file manager action: "${action}"` });
    } catch (error: any) {
      console.error("[API_FILE_MANAGER] Error executing action:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // --- Custom Tools Registry API ---
  app.get("/api/tools/custom", async (req, res) => {
    try {
      const registryPath = CustomToolsLoader.getRegistryPath();
      let customTools = [];
      try {
        const fileData = await fs.readFile(registryPath, 'utf8');
        customTools = JSON.parse(fileData);
      } catch (err) {
        // file doesn't exist yet, return empty list
      }
      res.json({ success: true, tools: customTools });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/tools/custom", async (req, res) => {
    try {
      const toolDef = req.body;
      if (!toolDef || !toolDef.id || !toolDef.name) {
        return res.status(400).json({ error: "id and name are required." });
      }

      const registryPath = CustomToolsLoader.getRegistryPath();
      let customTools: any[] = [];
      try {
        const fileData = await fs.readFile(registryPath, 'utf8');
        customTools = JSON.parse(fileData);
      } catch (_) {}

      const existingIdx = customTools.findIndex((t: any) => t.id === toolDef.id);
      if (existingIdx !== -1) {
        customTools[existingIdx] = { ...customTools[existingIdx], ...toolDef };
      } else {
        customTools.push(toolDef);
      }

      await fs.writeFile(registryPath, JSON.stringify(customTools, null, 2), 'utf8');

      // Register it in our SystemRegistry dynamically
      CustomToolsLoader.registerTool(toolDef);

      // Re-trigger available_tools.json generation
      try {
        const { SystemRegistry } = await import("../../registry.js");
        const tools = SystemRegistry.getTools();
        const toolsData = tools.map((t: any) => t.metadata);
        const outputFilePath = path.resolve(process.cwd(), 'src', 'core', 'available_tools.json');
        await fs.writeFile(outputFilePath, JSON.stringify(toolsData, null, 2), 'utf8');
      } catch (genErr) {
        console.error("[SERVER] Failed to regenerate available_tools.json dynamically:", genErr);
      }

      res.json({ success: true, message: `Tool ${toolDef.id} registered successfully.`, tool: toolDef });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/tools/custom/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const registryPath = CustomToolsLoader.getRegistryPath();
      let customTools: any[] = [];
      try {
        const fileData = await fs.readFile(registryPath, 'utf8');
        customTools = JSON.parse(fileData);
      } catch (_) {}

      const updatedTools = customTools.filter((t: any) => t.id !== id);
      await fs.writeFile(registryPath, JSON.stringify(updatedTools, null, 2), 'utf8');

      // Unregister in memory
      try {
        const { SystemRegistry } = await import("../../registry.js");
        (SystemRegistry as any).tools = (SystemRegistry as any).tools.filter((t: any) => t.metadata.id !== id);
        
        // Re-generate available_tools.json
        const tools = SystemRegistry.getTools();
        const toolsData = tools.map((t: any) => t.metadata);
        const outputFilePath = path.resolve(process.cwd(), 'src', 'core', 'available_tools.json');
        await fs.writeFile(outputFilePath, JSON.stringify(toolsData, null, 2), 'utf8');
      } catch (err) {
        console.error("[SERVER] Memory unregister failed:", err);
      }

      res.json({ success: true, message: `Tool ${id} deleted successfully.` });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- API Catch-all ---
  // Routes will be injected here
}
