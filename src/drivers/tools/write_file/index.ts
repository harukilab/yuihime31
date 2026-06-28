import { ToolModule } from '../../../include/types';
import manifest from './manifest.json';

export const FileWriteTool: ToolModule = {
  metadata: manifest as any,
  execute: async (args: any) => {
    const res = await fetch('/api/tools/files/write', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: args.filename, content: args.content })
    });
    return res.json();
  }
};
