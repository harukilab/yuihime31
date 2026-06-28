/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Activity, Cpu, Database, Play, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { KnowledgeGraph } from '../KnowledgeGraph';
import { AdaptiveMatrix } from '../AdaptiveMatrix';
import { ReflectTab } from '../ReflectTab';

export interface MatrixSectionTabProps {
  activeAgiTab: string;
  setActiveAgiTab: (val: any) => void;
  state: any;
  NEURAL_CORES: any[];
  activePersonaId?: string;
  isThinking: boolean;
  animations: string[];
  setAnimations: (val: any) => void;
  memories: any[];
  knowledge: any[];
  yuihimeVersionInfo: any;
  settings: any;
  dreams: any[];
  handleReflect?: () => void;
  status?: string;
  logs: any[];
}

export const MatrixSectionTab: React.FC<MatrixSectionTabProps> = ({
  activeAgiTab,
  setActiveAgiTab,
  state,
  NEURAL_CORES,
  activePersonaId,
  isThinking,
  animations,
  setAnimations,
  memories,
  knowledge,
  yuihimeVersionInfo,
  settings,
  dreams,
  handleReflect,
  status,
  logs
}) => {
  return (
    <div className="space-y-6">
      {/* Unified Sub-Navigation Tabs */}
      <div className="flex border-b border-white/5 pb-2 gap-2">
        <button
          onClick={() => setActiveAgiTab('telemetry')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold tracking-wide transition-all uppercase cursor-pointer ${
            activeAgiTab === 'telemetry'
              ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg'
              : 'text-zinc-500 hover:text-white hover:bg-white/5'
          }`}
        >
          Neural Telemetry
        </button>
        <button
          onClick={() => setActiveAgiTab('lattice')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold tracking-wide transition-all uppercase cursor-pointer ${
            activeAgiTab === 'lattice'
              ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg'
              : 'text-zinc-500 hover:text-white hover:bg-white/5'
          }`}
        >
          Synaptic Lattice
        </button>
        <button
          onClick={() => setActiveAgiTab('reflect')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold tracking-wide transition-all uppercase cursor-pointer ${
            activeAgiTab === 'reflect'
              ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg'
              : 'text-zinc-500 hover:text-white hover:bg-white/5'
          }`}
        >
          Cognitive Reflection
        </button>
      </div>

      {activeAgiTab === 'telemetry' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#0e0e14]/55 border border-white/5 p-6 rounded-3xl space-y-4">
              <h4 className="text-[10px] uppercase font-mono tracking-widest text-[#d4d4d8]/40 mb-2 font-bold flex items-center gap-2">
                <Activity size={14} className="text-emerald-400" /> Live System Telemetry
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                  <div className="text-white/30 text-[9px] uppercase font-mono tracking-wider mb-1">SYSTEM STATE</div>
                  <div className={`font-mono text-sm font-bold uppercase tracking-wide ${state?.status === 'idle' ? 'text-green-400' : 'text-amber-400 animate-pulse'}`}>
                    {state?.status || 'IDLE'}
                  </div>
                </div>
                <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                  <div className="text-white/30 text-[9px] uppercase font-mono tracking-wider mb-1">COGNITIVE EMOTION</div>
                  <div className="font-mono text-sm font-semibold text-white/90 truncate uppercase tracking-widest">
                    {state?.mood?.anger > 40 ? 'IRRITATED' : state?.mood?.sadness > 40 ? 'MELANCHOLY' : state?.mood?.joy > 40 ? 'JOYFUL' : 'STABLE'}
                  </div>
                </div>
                <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                  <div className="text-white/30 text-[9px] uppercase font-mono tracking-wider mb-1">ACTIVE PERSONA</div>
                  <div className="font-mono text-sm font-semibold text-cyan-400 truncate uppercase tracking-widest">
                    {(NEURAL_CORES?.find((c: any) => c.id === activePersonaId)?.name || 'YUI').toUpperCase()}
                  </div>
                </div>
                <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                  <div className="text-white/30 text-[9px] uppercase font-mono tracking-wider mb-1">COGNITION LATENCY</div>
                  <div className="font-mono text-sm font-bold text-white/80 flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${isThinking ? 'bg-amber-400 animate-ping' : 'bg-emerald-500'}`} />
                    {isThinking ? 'THINKING...' : 'SYNCHRONIZED'}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#0e0e14]/55 border border-white/5 p-6 rounded-3xl space-y-4">
              <h4 className="text-[10px] uppercase font-mono tracking-widest text-[#d4d4d8]/40 flex items-center gap-2">
                <Zap size={14} className="text-amber-400" /> LLM Motion Buffer
              </h4>
              <div className="bg-black/40 rounded-2xl p-4 border border-white/5 min-h-[110px] flex flex-col justify-between">
                <AnimatePresence mode="popLayout">
                  {animations.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 max-h-[80px] overflow-y-auto pr-1">
                      {animations.map((anim, i) => (
                        <motion.span
                          key={`${anim}-${i}`}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          className="px-2 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-lg text-[9px] font-bold font-mono tracking-wide"
                        >
                          {anim}
                        </motion.span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-white/20 italic font-mono text-[10px] text-center my-auto">No motion buffer logs in storage...</div>
                  )}
                </AnimatePresence>
                <div className="text-[8.5px] font-mono text-zinc-500 text-right mt-2">
                  PULSE LOG BUFFER: STABLE
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            <div className="bg-[#0e0e14]/55 border border-white/5 p-6 rounded-3xl space-y-4">
              <h4 className="text-[10px] uppercase font-mono tracking-widest text-[#d4d4d8]/45 font-bold flex items-center gap-2">
                <Cpu size={14} className="text-pink-400" /> Endocrine Hormonal Vector
              </h4>
              <div className="space-y-3 bg-black/20 p-4 sm:p-6 rounded-2xl border border-white/5">
                {[
                  { label: 'JOY', val: typeof state?.mood?.joy === 'number' && !isNaN(state.mood.joy) ? state.mood.joy : 50, color: 'bg-amber-400 text-amber-400' },
                  { label: 'STRESS', val: typeof state?.mood?.stress === 'number' && !isNaN(state.mood.stress) ? state.mood.stress : 0, color: 'bg-indigo-400 text-indigo-400' },
                  { label: 'SADNESS', val: typeof state?.mood?.sadness === 'number' && !isNaN(state.mood.sadness) ? state.mood.sadness : 0, color: 'bg-blue-400 text-blue-400' },
                  { label: 'ANGER', val: typeof state?.mood?.anger === 'number' && !isNaN(state.mood.anger) ? state.mood.anger : 0, color: 'bg-red-400 text-red-400' },
                  { label: 'FOCUS', val: typeof state?.emotion?.focus === 'number' && !isNaN(state.emotion.focus) ? state.emotion.focus : 50, color: 'bg-cyan-400 text-cyan-400' },
                  { label: 'DOPAMINE (DOP)', val: typeof state?.mood?.dopamine === 'number' && !isNaN(state.mood.dopamine) ? state.mood.dopamine : 15, color: 'bg-pink-400 text-pink-400' },
                  { label: 'SEROTONIN (SER)', val: typeof state?.mood?.serotonin === 'number' && !isNaN(state.mood.serotonin) ? state.mood.serotonin : 50, color: 'bg-emerald-400 text-emerald-400' },
                  { label: 'OXYTOCIN (OXT)', val: typeof state?.mood?.oxytocin === 'number' && !isNaN(state.mood.oxytocin) ? state.mood.oxytocin : 30, color: 'bg-fuchsia-400 text-fuchsia-400' },
                  { label: 'NORADRENALINE (NOR)', val: typeof state?.mood?.noradrenaline === 'number' && !isNaN(state.mood.noradrenaline) ? state.mood.noradrenaline : 10, color: 'bg-rose-500 text-rose-500' },
                ].map(m => (
                  <div key={m.label} className="space-y-1.5">
                    <div className="flex justify-between text-[9px] font-mono tracking-wider">
                      <span className="text-white/60 font-medium">{m.label}</span>
                      <span className={`font-bold ${m.color.split(' ')[1]}`}>{m.val}%</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        animate={{ width: `${m.val}%` }}
                        className={`h-full ${m.color.split(' ')[0]} shadow-[0_0_8px_rgba(255,255,255,0.1)]`} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#0e0e14]/55 border border-white/5 p-6 rounded-3xl space-y-4 text-left">
              <h4 className="text-[10px] uppercase font-mono tracking-widest text-[#d4d4d8]/45 font-bold flex items-center gap-2">
                <Database size={14} className="text-amber-500" /> Core Trace & Storage Stats
              </h4>
              
              <div className="bg-black/20 p-4 sm:p-6 rounded-2xl border border-white/5 space-y-3.5 leading-normal">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500">Total Episodic Memories</span>
                  <span className="font-mono bg-white/5 px-2 py-0.5 rounded text-white font-bold">{memories.length} records</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500">Total Semantic Facts</span>
                  <span className="font-mono bg-white/5 px-2 py-0.5 rounded text-zinc-300 font-bold">{knowledge.length} concepts</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500">Registry System Version</span>
                  <span className="font-mono bg-white/10 px-2 py-0.5 rounded text-white font-bold">{yuihimeVersionInfo?.version || 'v5.52'} ({yuihimeVersionInfo?.turn || 'Turn 120'})</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500">Registry System Release Date</span>
                  <span className="font-mono bg-white/5 px-2 py-0.5 rounded text-zinc-300">{yuihimeVersionInfo?.date || '2026-05-26'}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500">Primary Model Source</span>
                  <span className="font-mono truncate max-w-[175px] text-zinc-300 tracking-wider text-[11px] align-middle">{settings?.provider || 'gemini'}</span>
                </div>
                
                <div className="border-t border-white/5 pt-3.5 grid grid-cols-2 gap-2 text-left">
                  <div>
                    <div className="text-[8px] uppercase font-mono text-zinc-500">Node Entry Point</div>
                    <div className="text-[10.5px] font-mono font-bold text-white tracking-wide mt-0.5">dist/server.cjs</div>
                  </div>
                  <div>
                    <div className="text-[8px] uppercase font-mono text-zinc-500">Vite Dev Server</div>
                    <div className="text-[10.5px] font-mono font-bold text-cyan-400 tracking-wide mt-0.5">Host 0.0.0.0</div>
                  </div>
                  <div>
                    <div className="text-[8px] uppercase font-mono text-zinc-500">Container Port</div>
                    <div className="text-[10.5px] font-mono font-bold text-amber-500 tracking-wide mt-0.5">Port {settings?.port || 3000}</div>
                  </div>
                  <div>
                    <div className="text-[8px] uppercase font-mono text-zinc-500">Active Subsystems</div>
                    <div className="text-[10.5px] font-mono font-bold text-purple-400 tracking-wide mt-0.5">9 Registered</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#0e0e14]/55 border border-white/5 p-6 rounded-3xl space-y-4">
            <h4 className="text-[10px] uppercase font-mono tracking-widest text-[#d4d4d8]/40 flex items-center gap-2">
              <Play size={14} className="text-violet-400" /> Manual Pulse Override Triggers
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {[
                'NOD', 'SHAKE', 'WAVE', 'SMILE', 'LAUGH', 'SURPRISE', 'BLUSH', 'SAD', 'ANGRY', 'THINK',
                'LOOK_LEFT', 'LOOK_RIGHT', 'LOOK_UP', 'LOOK_DOWN', 'BLINK', 'WINK'
              ].map(anim => (
                <button
                  key={anim}
                  type="button"
                  onClick={() => {
                    setAnimations((prev: string[]) => {
                      const updated = [...prev, anim];
                      return updated.slice(-15);
                    });
                  }}
                  className="p-3 bg-white/[0.02] hover:bg-white/[0.06] active:bg-white/10 hover:border-violet-500/20 border border-white/5 rounded-2xl text-[9px] font-bold text-white/60 hover:text-white transition-all uppercase truncate font-mono text-center cursor-pointer"
                >
                  {anim}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeAgiTab === 'lattice' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-[#0e0e14]/55 border border-white/5 p-6 rounded-3xl space-y-4">
            <h4 className="text-[10px] uppercase font-mono tracking-widest text-[#d4d4d8]/40 mb-2">Synaptic Lattice Graph</h4>
            <div className="h-[400px] md:h-[500px] relative overflow-hidden bg-[#080808] border border-white/5 rounded-3xl">
              <KnowledgeGraph memories={memories} dreams={dreams} knowledge={knowledge} />
            </div>
          </div>
          <div className="bg-[#0e0e14]/55 border border-white/5 p-6 rounded-3xl font-sans">
            <h4 className="text-[10px] uppercase font-mono tracking-widest text-[#d4d4d8]/40 mb-4">Affinity & Relationship State Vector</h4>
            <AdaptiveMatrix />
          </div>
        </div>
      )}

      {activeAgiTab === 'reflect' && (
        <div className="space-y-6 animate-fade-in font-sans">
          <ReflectTab 
            handleReflect={handleReflect} 
            isThinking={isThinking} 
            status={status} 
            logs={logs} 
            state={state}
          />
        </div>
      )}
    </div>
  );
};
