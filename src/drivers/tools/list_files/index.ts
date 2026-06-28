import { ToolModule } from '../../../include/types';
import manifest from './manifest.json';

export const FileListTool: ToolModule = {
  metadata: manifest as any,
  execute: async () => {
    const res = await fetch('/api/tools/files/list');
    return res.json();
  }
};
