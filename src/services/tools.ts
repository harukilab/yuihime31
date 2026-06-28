export interface ToolResponse {
  stdout?: string;
  stderr?: string;
  content?: string;
  success?: boolean;
  error?: string;
  files?: string[];
}

export type ToolExecuteCallback = (toolName: string, success: boolean, result: ToolResponse) => void;

export class ToolService {
  private static executeCallbacks: ToolExecuteCallback[] = [];

  static onExecute(callback: ToolExecuteCallback) {
    this.executeCallbacks.push(callback);
  }

  private static triggerExecute(toolName: string, success: boolean, result: ToolResponse) {
    for (const cb of this.executeCallbacks) {
      try {
        cb(toolName, success, result);
      } catch (err) {
        console.error('[ToolService Callback Error]', err);
      }
    }
  }

  static async execShell(command: string): Promise<ToolResponse> {
    const res = await fetch('/api/tools/shell', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command })
    });
    const data = await res.json();
    const success = data.success !== false && !data.error;
    this.triggerExecute('execShell', success, data);
    return data;
  }

  static async writeFile(filename: string, content: string): Promise<ToolResponse> {
    const res = await fetch('/api/tools/files/write', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, content })
    });
    const data = await res.json();
    const success = data.success !== false && !data.error;
    this.triggerExecute('writeFile', success, data);
    return data;
  }

  static async readFile(filename: string): Promise<ToolResponse> {
    const res = await fetch(`/api/tools/files/read?filename=${encodeURIComponent(filename)}`);
    const data = await res.json();
    const success = data.success !== false && !data.error;
    this.triggerExecute('readFile', success, data);
    return data;
  }

  static async listFiles(): Promise<ToolResponse> {
    const res = await fetch('/api/tools/files/list');
    const data = await res.json();
    const success = data.success !== false && !data.error;
    this.triggerExecute('listFiles', success, data);
    return data;
  }
}
