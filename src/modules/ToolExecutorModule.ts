import { CortexModule, ModuleType } from '../include/types';
import { SystemRegistry } from '../core/registry';

/**
 * Tool Executor Module: Secure execution of tools identified by the parser.
 */
export const ToolExecutorModule: CortexModule = {
  metadata: {
    id: 'tool-executor',
    name: 'yui-tool-executor: Sandbox Unit',
    description: 'Securely dispatches and executes tool calls requested by the AI core.',
    version: '1.0.0',
    type: ModuleType.CORTEX,
    phase: 'PHASE 4: EXECUTION',
    order: 2
  },
  run: async (input: string, _state: any, context: any) => {
    const toolsToCall = context.toolsToCall || [];
    if (toolsToCall.length === 0) return context;

    console.log(`[EXECUTOR] Executing ${toolsToCall.length} tools...`);
    
    const results = [];
    for (const call of toolsToCall) {
      const toolName = call.tool || call.name;
      const toolArgs = call.args || call.arguments || {};
      
      const tool = SystemRegistry.getTool(toolName);
      if (tool) {
        try {
          const result = await tool.execute(toolArgs, context);
          results.push({ name: toolName, success: true, result });
        } catch (e: any) {
          results.push({ name: toolName, success: false, error: e.message });
        }
      } else {
        results.push({ name: toolName, success: false, error: 'Tool not found' });
      }
    }

    return {
      ...context,
      toolResults: results,
      requiresReThinking: results.some(r => r.success)
    };
  }
};
