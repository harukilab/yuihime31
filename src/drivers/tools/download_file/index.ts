import { ToolModule } from '../../../include/types';
import manifest from './manifest.json';

export const DownloadFileTool: ToolModule = {
  metadata: manifest as any,
  execute: async (args: any) => {
    try {
      const res = await fetch('/api/tools/files/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: args.url, filename: args.filename })
      });
      return res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }
};
