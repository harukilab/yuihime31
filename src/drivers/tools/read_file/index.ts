import { ToolModule } from '../../../include/types';
import manifest from './manifest.json';

export const FileReadTool: ToolModule = {
  metadata: manifest as any,
  execute: async (args: any) => {
    const hostPort = process.env.PORT || "3000";
    const res = await fetch(`http://127.0.0.1:${hostPort}/api/tools/files/read?filename=${encodeURIComponent(args.filename)}`);
    return res.json();
  }
};
