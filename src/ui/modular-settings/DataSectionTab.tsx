/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface DataSectionTabProps {
  settings: any;
  setSettings: (val: any) => void;
}

export const DataSectionTab: React.FC<DataSectionTabProps> = ({ settings, setSettings }) => {
  return (
    <div className="space-y-6">
      {/* Chat Sessions Card Segment */}
      <div className="bg-[#0e0e14]/55 border border-white/5 p-6 rounded-2xl space-y-4">
        <div>
          <h5 className="text-sm font-bold text-white tracking-wide">Chat sessions</h5>
          <p className="text-[11px] text-zinc-500">Export or import saved chat sessions.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            type="button"
            onClick={async () => {
              try {
                const [historyRes, memoriesRes] = await Promise.all([
                  fetch('/api/storage/history'),
                  fetch('/api/storage/memories')
                ]);
                const history = await historyRes.json();
                const memories = await memoriesRes.json();
                
                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ history, memories }, null, 2));
                const downloadAnchor = document.createElement('a');
                downloadAnchor.setAttribute("href", dataStr);
                downloadAnchor.setAttribute("download", `yuihime_chat_export_${Date.now()}.json`);
                document.body.appendChild(downloadAnchor);
                downloadAnchor.click();
                downloadAnchor.remove();
              } catch (err: any) {
                alert(`Gagal mengekspor chat: ${err.message}`);
              }
            }}
            className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white/80 text-xs font-bold uppercase tracking-wider rounded-xl border border-white/5 transition-all text-center cursor-pointer font-sans"
          >
            Export chats
          </button>
          <button 
            type="button"
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.json';
              input.onchange = async (e: any) => {
                const file = e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = async (evt: any) => {
                  try {
                    const parsed = JSON.parse(evt.target.result);
                    if (!parsed.history && !parsed.memories) {
                      alert("Format file tidak valid. Berkas JSON harus berupa ekspor cadangan yang berisi 'history' atau 'memories'.");
                      return;
                    }

                    const res = await fetch('/api/storage/import', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        history: parsed.history || [],
                        memories: parsed.memories || []
                      })
                    });
                    const data = await res.json();
                    if (data.success) {
                      alert(`Data batin berhasil diimpor!\n\nHistori pesan: ${data.importedHistory}\nMemori/Fakta: ${data.importedMemories}`);
                      window.location.reload();
                    } else {
                      alert(`Gagal mengimpor data: ${data.error || 'Unknown error'}`);
                    }
                  } catch (err: any) {
                    alert(`Gagal membaca file JSON: ${err.message}`);
                  }
                };
                reader.readAsText(file);
              };
              input.click();
            }}
            className="flex-1 py-3 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 text-xs font-bold uppercase tracking-wider rounded-xl border border-teal-500/20 transition-all text-center cursor-pointer font-sans"
          >
            Import chats
          </button>
          <button 
            type="button"
            onClick={async () => {
              if (confirm("SEVERE ALERT: Are you absolutely sure you wish to permanently erase ALL stored chat histories and memories from database?")) {
                try {
                  const res = await fetch('/api/storage/purge', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ mode: 'soft' })
                  });
                  const data = await res.json();
                  if (data.success) {
                    alert("Seluruh riwayat obrolan dan log pesan batin telah dinetralkan (purged).");
                    window.location.reload();
                  } else {
                    alert(`Gagal menghapus: ${data.error}`);
                  }
                } catch (err: any) {
                  alert(`Terjadi kesalahan koneksi: ${err.message}`);
                }
              }
            }}
            className="py-3 px-5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-wider rounded-xl border border-rose-500/20 transition-all text-center cursor-pointer font-sans"
          >
            Delete all chat sessions
          </button>
        </div>
      </div>

      {/* Models Card Segment */}
      <div className="bg-[#0e0e14]/55 border border-white/5 p-6 rounded-2xl space-y-4">
        <div>
          <h5 className="text-sm font-bold text-white tracking-wide">Models</h5>
          <p className="text-[11px] text-zinc-500">Remove imported Live2D/VRM models.</p>
        </div>
        <button 
          type="button"
          onClick={() => {
            if (confirm("Remove models list registry mappings from localStorage web-cache?")) {
              localStorage.removeItem('yuihime_cached_models_v2');
              window.location.reload();
            }
          }}
          className="w-full sm:w-auto py-3 px-6 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-wider rounded-xl border border-rose-500/20 transition-all cursor-pointer font-sans"
        >
          Delete all models
        </button>
      </div>

      {/* Modules Card Segment */}
      <div className="bg-[#0e0e14]/55 border border-white/5 p-6 rounded-2xl space-y-4">
        <div>
          <h5 className="text-sm font-bold text-white tracking-wide">Modules</h5>
          <p className="text-[11px] text-zinc-500">Reset module preferences and credentials.</p>
        </div>
        <button 
          type="button"
          onClick={async () => {
            if (confirm("Reset dynamic neural routing and modular weights settings back to default configurations?")) {
              try {
                const preservedSettings = {
                  official_chat: settings.official_chat,
                  openrouter: settings.openrouter,
                  aihubmix: settings.aihubmix,
                  gemini: settings.gemini,
                  openai: settings.openai,
                  anthropic: settings.anthropic,
                  elevenlabs: settings.elevenlabs,
                  groq: settings.groq,
                  ollama: settings.ollama,
                  lmstudio: settings.lmstudio,
                };
                
                const res = await fetch('/api/settings', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(preservedSettings)
                });
                await res.json();
                alert("Modular settings reset back to clean defaults.");
                window.location.reload();
              } catch (err: any) {
                alert(`Gagal merestet setelan modular: ${err.message}`);
              }
            }
          }}
          className="w-full sm:w-auto py-3 px-6 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 text-xs font-bold uppercase tracking-wider rounded-xl border border-amber-500/20 transition-all cursor-pointer font-sans"
        >
          Reset module settings
        </button>
      </div>

      {/* DANGER ZONE RED BORDERED BLOCK */}
      <div className="border border-rose-500/30 bg-rose-500/[0.02] p-6 rounded-2xl space-y-5 animate-fade-in">
        <div className="border-b border-rose-500/10 pb-2">
          <h4 className="text-sm font-bold text-rose-400 tracking-wide flex items-center gap-2 font-sans">
            <ShieldAlert size={16} /> Danger zone
          </h4>
          <p className="text-[11px] text-zinc-500 mt-0.5 font-sans">Irreversible actions. Export what you need before continuing.</p>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/5 pb-4">
          <div>
            <h5 className="text-xs font-bold text-white tracking-wide font-sans">Providers</h5>
            <p className="text-[10px] text-zinc-500 mt-1 font-sans">Reset all provider settings and credentials.</p>
          </div>
          <button 
            type="button"
            onClick={() => {
              if (confirm("IRREVERSIBLE ALERT: Wipe all stored credentials, API Keys, and customized models settings?")) {
                setSettings({});
                alert("All provider configuration maps deleted.");
              }
            }}
            className="py-2.5 px-5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] uppercase font-mono tracking-widest rounded-xl transition-all cursor-pointer font-bold shrink-0 shadow-lg"
          >
            Reset provider settings
          </button>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h5 className="text-xs font-bold text-white tracking-wide font-sans">Delete all data</h5>
            <p className="text-[10px] text-zinc-500 mt-1 font-sans">Wipe every local setting, provider config, and model.</p>
          </div>
          <button 
            type="button"
            onClick={() => {
              if (confirm("TOTAL DESTRUCTION: This will completely clean all localStorage and indexDB registers. Wipe clean now?")) {
                localStorage.clear();
                window.location.reload();
              }
            }}
            className="py-2.5 px-5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] uppercase font-mono tracking-widest rounded-xl transition-all cursor-pointer font-bold shrink-0 shadow-lg"
          >
            Delete all data
          </button>
        </div>
      </div>
    </div>
  );
};
