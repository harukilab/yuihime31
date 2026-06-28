import { ToolModule } from '../../../include/types';
import manifest from './manifest.json';

export const CronTool: ToolModule = {
  metadata: manifest as any,
  execute: async (args: any, context?: any) => {
    const hostPort = process.env.PORT || "3000";
    const localFetch = async (path: string, options?: RequestInit) => {
      return fetch(`http://127.0.0.1:${hostPort}${path}`, options);
    };

    // Helper to resolve taskId by ID or Name
    const resolveTaskId = async (inputQuery: string): Promise<string | null> => {
      if (!inputQuery) return null;
      try {
        const tasksRes = await localFetch('/api/cron');
        const tasks = await tasksRes.json();
        
        // 1. Direct exact ID match
        const exactId = tasks.find((t: any) => t.id === inputQuery);
        if (exactId) return exactId.id;
        
        // 2. Exact name match (case insensitive)
        const exactName = tasks.find((t: any) => t.name?.toLowerCase() === inputQuery.toLowerCase());
        if (exactName) return exactName.id;
        
        // 3. Fuzzy name match (includes query, case insensitive)
        const fuzzyName = tasks.find((t: any) => t.name?.toLowerCase().includes(inputQuery.toLowerCase()));
        if (fuzzyName) return fuzzyName.id;
        
        // 4. Default to raw inputQuery
        return inputQuery;
      } catch (e) {
        return inputQuery;
      }
    };

    if (args.action === 'list') {
      const res = await localFetch('/api/cron');
      return res.json();
    }
    
    if (args.action === 'add' || args.action === 'edit') {
      let id = args.taskId;
      
      if (args.action === 'edit') {
        const resolved = await resolveTaskId(args.taskId);
        if (!resolved) return { error: "taskId (or task name) is required for 'edit'" };
        id = resolved;
      } else {
        // action === 'add'
        if (!id) {
          if (args.taskName) {
            const slug = args.taskName.toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '');
            id = slug ? `task_${slug}_${Date.now().toString().slice(-4)}` : `task_${Date.now()}`;
          } else {
            id = `task_${Date.now()}`;
          }
        }
      }
      
      const res = await localFetch('/api/cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          name: args.taskName,
          schedule: args.schedule || '5m',
          enabled: true,
          repeating: args.repeating ?? false,
          context_id: context?.contextId || 'live_stream',
          chat_type: args.targetChannel || context?.chatType || 'Live Chat',
          sender_name: context?.userName || 'Penonton'
        })
      });
      return res.json();
    }
    
    if (args.action === 'toggle') {
      const resolvedId = await resolveTaskId(args.taskId);
      if (!resolvedId) return { error: "taskId (or task name) is required for 'toggle'" };

      const tasksRes = await localFetch('/api/cron');
      const tasks = await tasksRes.json();
      const task = tasks.find((t: any) => t.id === resolvedId);
      if (!task) return { error: `Task '${args.taskId}' not found` };
      
      const res = await localFetch('/api/cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...task, enabled: !task.enabled })
      });
      return res.json();
    }

    if (args.action === 'delete') {
      const resolvedId = await resolveTaskId(args.taskId);
      if (!resolvedId) return { error: "taskId (or task name) is required for 'delete'" };
      
      const res = await localFetch(`/api/cron/${resolvedId}`, {
        method: 'DELETE'
      });
      return res.json();
    }
    
    return { error: "Invalid action" };
  }
};
