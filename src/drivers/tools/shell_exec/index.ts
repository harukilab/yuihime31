import { ToolModule } from '../../../include/types';
import manifest from './manifest.json';

export const ShellTool: ToolModule = {
  metadata: manifest as any,
  execute: async (args: any) => {
    const res = await fetch('/api/tools/shell', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: args.command })
    });
    return res.json();
  }
};
