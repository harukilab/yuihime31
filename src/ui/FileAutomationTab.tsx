import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Trash2, 
  Save, 
  RefreshCw, 
  Clock, 
  Sparkles, 
  CheckSquare, 
  Sliders, 
  ChevronDown, 
  ChevronUp, 
  Info, 
  AlertTriangle 
} from 'lucide-react';
import { StorageService } from '../drivers/storage';

interface FileAutomationRule {
  id: string;
  name: string;
  enabled: boolean;
  triggerType: 'schedule' | 'pattern'; 
  scheduleExpr: string;
  filePattern: string;
  conditionType: 'none' | 'size' | 'content_contains' | 'age';
  conditionValue: string;
  actionType: 'none' | 'organize_by_type' | 'move' | 'copy' | 'delete' | 'edit_replace' | 'ai_summarize' | 'ai_edit';
  actionParams: string;
  lastRun?: number;
  lastStatus?: 'success' | 'failed';
  lastLog?: string;
}

interface FileAutomationLog {
  timestamp: number;
  ruleId: string;
  ruleName: string;
  status: 'success' | 'failed';
  message: string;
  filesProcessed: string[];
  actionPerformed: string;
}

export function FileAutomationTab() {
  const [rules, setRules] = useState<FileAutomationRule[]>([]);
  const [logs, setLogs] = useState<FileAutomationLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [expandedLog, setExpandedLog] = useState<number | null>(null);

  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [currentRuleId, setCurrentRuleId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formEnabled, setFormEnabled] = useState(true);
  const [formTriggerType, setFormTriggerType] = useState<'schedule' | 'pattern'>('schedule');
  const [formScheduleExpr, setFormScheduleExpr] = useState('1h');
  const [formFilePattern, setFormFilePattern] = useState('*');
  const [formConditionType, setFormConditionType] = useState<FileAutomationRule['conditionType']>('none');
  const [formConditionValue, setFormConditionValue] = useState('');
  const [formActionType, setFormActionType] = useState<FileAutomationRule['actionType']>('none');
  
  // Action Params States
  const [paramTargetPath, setParamTargetPath] = useState('');
  const [paramRegexMatch, setParamRegexMatch] = useState('');
  const [paramRegexReplace, setParamRegexReplace] = useState('');
  const [paramRegexFlags, setParamRegexFlags] = useState('g');
  const [paramSummaryPrompt, setParamSummaryPrompt] = useState('');
  const [paramEditPrompt, setParamEditPrompt] = useState('');
  const [paramOutputSuffix, setParamOutputSuffix] = useState('');
  const [paramRecursive, setParamRecursive] = useState(true);

  useEffect(() => {
    fetchRules();
    fetchLogs();
  }, []);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/file-automation/rules');
      if (res.ok) {
        const data = await res.json();
        setRules(data);
      }
    } catch (e) {
      console.error("Failed to load automation rules:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/file-automation/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.reverse()); // Show most recent first
      }
    } catch (e) {
      console.error("Failed to load execution logs:", e);
    }
  };

  const saveRulesList = async (newList: FileAutomationRule[]) => {
    try {
      setSubmitting(true);
      const res = await fetch('/api/file-automation/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newList)
      });
      if (res.ok) {
        setRules(newList);
        setIsEditing(false);
        resetForm();
        fetchRules();
        fetchLogs();
      }
    } catch (e) {
      console.error("Failed to save rules:", e);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setCurrentRuleId(null);
    setFormName('');
    setFormEnabled(true);
    setFormTriggerType('schedule');
    setFormScheduleExpr('1h');
    setFormFilePattern('*');
    setFormConditionType('none');
    setFormConditionValue('');
    setFormActionType('none');
    setParamTargetPath('');
    setParamRegexMatch('');
    setParamRegexReplace('');
    setParamRegexFlags('g');
    setParamSummaryPrompt('');
    setParamEditPrompt('');
    setParamOutputSuffix('');
    setParamRecursive(true);
  };

  const handleEditRule = (rule: FileAutomationRule) => {
    setCurrentRuleId(rule.id);
    setFormName(rule.name);
    setFormEnabled(rule.enabled);
    setFormTriggerType(rule.triggerType);
    setFormScheduleExpr(rule.scheduleExpr);
    setFormFilePattern(rule.filePattern);
    setFormConditionType(rule.conditionType);
    setFormConditionValue(rule.conditionValue);
    setFormActionType(rule.actionType);

    try {
      const params = rule.actionParams ? JSON.parse(rule.actionParams) : {};
      setParamTargetPath(params.targetPath || '');
      setParamRegexMatch(params.regexMatch || '');
      setParamRegexReplace(params.regexReplace || '');
      setParamRegexFlags(params.regexFlags || 'g');
      setParamSummaryPrompt(params.summaryPrompt || '');
      setParamEditPrompt(params.editPrompt || '');
      setParamOutputSuffix(params.outputSuffix || '');
      setParamRecursive(params.recursive !== false);
    } catch (err) {
      console.error("Error parsing rule parameters:", err);
    }
    setIsEditing(true);
  };

  const handleCreateNewClick = () => {
    resetForm();
    setIsEditing(true);
  };

  const handleSubmitRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const actionParamsObj: any = {
      recursive: paramRecursive
    };

    if (formActionType === 'organize_by_type' || formActionType === 'move' || formActionType === 'copy' || formActionType === 'ai_summarize') {
      actionParamsObj.targetPath = paramTargetPath;
    }
    if (formActionType === 'edit_replace') {
      actionParamsObj.regexMatch = paramRegexMatch;
      actionParamsObj.regexReplace = paramRegexReplace;
      actionParamsObj.regexFlags = paramRegexFlags;
    }
    if (formActionType === 'ai_summarize') {
      actionParamsObj.summaryPrompt = paramSummaryPrompt;
    }
    if (formActionType === 'ai_edit') {
      actionParamsObj.editPrompt = paramEditPrompt;
      actionParamsObj.outputSuffix = paramOutputSuffix;
    }

    const updatedRule: FileAutomationRule = {
      id: currentRuleId || `rule_${Math.random().toString(36).substr(2, 9)}`,
      name: formName.trim(),
      enabled: formEnabled,
      triggerType: formTriggerType,
      scheduleExpr: formScheduleExpr,
      filePattern: formFilePattern,
      conditionType: formConditionType,
      conditionValue: formConditionValue,
      actionType: formActionType,
      actionParams: JSON.stringify(actionParamsObj)
    };

    let updatedList = [...rules];
    if (currentRuleId) {
      updatedList = updatedList.map(r => r.id === currentRuleId ? { ...updatedRule, lastRun: r.lastRun, lastStatus: r.lastStatus, lastLog: r.lastLog } : r);
    } else {
      updatedList.push(updatedRule);
    }

    saveRulesList(updatedList);
  };

  const handleDeleteRule = (id: string) => {
    if (!window.confirm("Apakah kamu yakin ingin menghapus aturan otomatisasi berkas ini?")) return;
    const filtered = rules.filter(r => r.id !== id);
    saveRulesList(filtered);
  };

  const handleToggleRule = (rule: FileAutomationRule) => {
    const updated = rules.map(r => r.id === rule.id ? { ...r, enabled: !r.enabled } : r);
    saveRulesList(updated);
  };

  const handleRunRuleNow = async (id: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/file-automation/run/${id}`, { method: 'POST' });
      if (res.ok) {
        fetchRules();
        fetchLogs();
      }
    } catch (e) {
      console.error("Error executing rule now:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchSuggestions = async () => {
    try {
      setSuggestLoading(true);
      const res = await fetch('/api/file-automation/suggest');
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data);
        setShowSuggestions(true);
      }
    } catch (e) {
      console.error("Error generating sandbox suggestions:", e);
    } finally {
      setSuggestLoading(false);
    }
  };

  const handleAcceptSuggestion = (sug: any) => {
    const newRule: FileAutomationRule = {
      id: `rule_suggest_${Math.random().toString(36).substr(2, 9)}`,
      name: sug.name,
      enabled: true,
      triggerType: sug.triggerType,
      scheduleExpr: sug.scheduleExpr,
      filePattern: sug.filePattern,
      conditionType: sug.conditionType,
      conditionValue: sug.conditionValue,
      actionType: sug.actionType,
      actionParams: sug.actionParams
    };

    const updated = [...rules, newRule];
    saveRulesList(updated);
    setShowSuggestions(false);
  };

  const handleClearLogs = async () => {
    if (!window.confirm("Apakah kamu ingin menghapus semua catatan riwayat eksekusi berkas?")) return;
    try {
      const res = await fetch('/api/file-automation/logs/clear', { method: 'POST' });
      if (res.ok) {
        setLogs([]);
      }
    } catch (e) {
      console.error("Failed to purge logs:", e);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* TITLE SUMMARY */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h4 className="text-sm font-bold text-white tracking-wide">Yuihime File Automation Subsystem</h4>
          <p className="text-[#9ca3af] text-[11px] mt-0.5 font-sans">
            Rancang aturan pembersihan, pengorganisasian, penyalinan, serta penulisan ulang berkas berbasis AI di sandbox batinmu.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleFetchSuggestions}
            disabled={suggestLoading}
            className="px-3.5 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 text-[10px] tracking-wider uppercase rounded-xl font-mono flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Sparkles size={11} className={suggestLoading ? "animate-spin" : ""} />
            {suggestLoading ? "Menganalisis..." : "Yui's Suggestions"}
          </button>
          <button
            type="button"
            onClick={handleCreateNewClick}
            className="px-3.5 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-[10px] tracking-wider uppercase rounded-xl font-mono flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Sliders size={11} />
            Tambah Aturan
          </button>
        </div>
      </div>

      {/* AI SUGGESTIONS ZONE */}
      {showSuggestions && (
        <div className="bg-purple-950/20 border border-purple-500/20 p-5 rounded-2xl animate-fade-in space-y-4">
          <div className="flex items-center justify-between">
            <h5 className="text-[11px] font-bold text-purple-300 font-mono tracking-wider flex items-center gap-2">
              <Sparkles size={13} className="text-purple-400" />
              YUIHIME PATTERN RECOGNITION SUGGESTIONS
            </h5>
            <button
              onClick={() => setShowSuggestions(false)}
              className="text-white/40 hover:text-white text-xs font-mono font-bold"
            >
              [Tutup]
            </button>
          </div>
          <p className="text-zinc-400 text-[11px] leading-relaxed">
            Yui telah menganalisis ruang sandbox (`user_data`) kamu dan menemukan beberapa pola yang bisa diotomatisasi. Pilih rekomendasi di bawah untuk langsung menerapkannya:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestions.map((sug, idx) => (
              <div key={idx} className="bg-[#0e0e14]/65 border border-purple-500/10 p-4 rounded-xl flex flex-col justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-white font-bold text-xs">{sug.name}</div>
                  <p className="text-purple-300/80 text-[11px] italic font-sans">"Yui: {sug.comment}"</p>
                  <div className="flex flex-wrap items-center gap-2 pt-2 text-[10px] font-mono">
                    <span className="px-2 py-0.5 bg-white/5 rounded text-zinc-400">Pola: <span className="text-yellow-400">{sug.filePattern}</span></span>
                    <span className="px-2 py-0.5 bg-white/5 rounded text-zinc-400">Aksi: <span className="text-green-400">{sug.actionType}</span></span>
                    <span className="px-2 py-0.5 bg-white/5 rounded text-zinc-400">Jadwal: <span className="text-blue-400">{sug.scheduleExpr}</span></span>
                  </div>
                </div>
                <button
                  onClick={() => handleAcceptSuggestion(sug)}
                  className="px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-[10px] uppercase font-mono tracking-wider self-start cursor-pointer transition-all"
                >
                  Terapkan Aturan Ini
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RULES FORM MODAL AREA */}
      {isEditing && (
        <div className="bg-black/40 border border-white/5 p-6 rounded-2xl animate-fade-in space-y-4">
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <h5 className="text-[12px] font-bold text-white font-mono tracking-wider">
              {currentRuleId ? "SUNTING ATURAN BERKAS" : "BUAT ATURAN OTOMATISASI BARU"}
            </h5>
            <button 
              onClick={() => { setIsEditing(false); resetForm(); }}
              className="text-white/40 hover:text-white text-xs font-mono"
            >
              Batal
            </button>
          </div>

          <form onSubmit={handleSubmitRule} className="space-y-4 font-sans text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="space-y-1">
                <label className="text-zinc-400 block font-mono uppercase text-[9px] tracking-wider">Nama Aturan</label>
                <input 
                  type="text"
                  required
                  placeholder="Misal: Rapikan Laporan Harian"
                  className="w-full bg-[#050505] border border-white/10 p-2.5 rounded-xl text-white font-medium focus:border-blue-500 outline-none"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400 block font-mono uppercase text-[9px] tracking-wider">Status Default</label>
                <select
                  className="w-full bg-[#050505] border border-white/10 p-2.5 rounded-xl text-white focus:border-blue-500 outline-none"
                  value={formEnabled ? 'true' : 'false'}
                  onChange={(e) => setFormEnabled(e.target.value === 'true')}
                >
                  <option value="true">Aktif (Enabled)</option>
                  <option value="false">Nonaktif (Disabled)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400 block font-mono uppercase text-[9px] tracking-wider">Trigger Otomatisasi</label>
                <select
                  className="w-full bg-[#050505] border border-white/10 p-2.5 rounded-xl text-white focus:border-blue-500 outline-none"
                  value={formTriggerType}
                  onChange={(e) => setFormTriggerType(e.target.value as any)}
                >
                  <option value="schedule">Penjadwalan (Time Interval/Cron)</option>
                  <option value="pattern">Deteksi Pola Saja (Manual Run Only)</option>
                </select>
              </div>

              {formTriggerType === 'schedule' && (
                <div className="space-y-1">
                  <label className="text-zinc-400 block font-mono uppercase text-[9px] tracking-wider">Interval Jadwal</label>
                  <input 
                    type="text"
                    required
                    placeholder="Misal: 5m, 1h, 12h, atau ekspresi cron '0 * * * *'"
                    className="w-full bg-[#050505] border border-white/10 p-2.5 rounded-xl text-white font-mono focus:border-blue-500 outline-none"
                    value={formScheduleExpr}
                    onChange={(e) => setFormScheduleExpr(e.target.value)}
                  />
                  <span className="text-[10px] text-zinc-500">Mendukung selang interval (contoh: 30s, 10m, 2h, 1d) atau standar cron Linux.</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-zinc-400 block font-mono uppercase text-[9px] tracking-wider">Pola Berkas (Wildcard)</label>
                <input 
                  type="text"
                  required
                  placeholder="Misal: *.log, data_*.csv, *"
                  className="w-full bg-[#050505] border border-white/10 p-2.5 rounded-xl text-white font-mono focus:border-blue-500 outline-none"
                  value={formFilePattern}
                  onChange={(e) => setFormFilePattern(e.target.value)}
                />
                <span className="text-[10px] text-zinc-500">Pencocokan nama dengan karakter liar *. Gunakan * untuk meraba semua jenis berkas.</span>
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400 block font-mono uppercase text-[9px] tracking-wider">Batasan Kondisi</label>
                <select
                  className="w-full bg-[#050505] border border-white/10 p-2.5 rounded-xl text-white focus:border-blue-500 outline-none"
                  value={formConditionType}
                  onChange={(e) => setFormConditionType(e.target.value as any)}
                >
                  <option value="none">Tanpa Kondisi (Semua Target Pola Cocok)</option>
                  <option value="size">Batasan Ukuran Berkas</option>
                  <option value="age">Batasan Umur Berkas</option>
                  <option value="content_contains">Isi Berkas Mengandung Kata Kunci</option>
                </select>
              </div>

              {formConditionType !== 'none' && (
                <div className="space-y-1">
                  <label className="text-zinc-400 block font-mono uppercase text-[9px] tracking-wider">Nilai Kondisi</label>
                  <input 
                    type="text"
                    required
                    placeholder={
                      formConditionType === 'size' ? "Misal: > 1mb, < 500kb" :
                      formConditionType === 'age' ? "Misal: > 2d (hari), > 5h (jam)" : "Kata kunci teks atau ekspresi /regex/i"
                    }
                    className="w-full bg-[#050505] border border-white/10 p-2.5 rounded-xl text-white placeholder-zinc-600 focus:border-blue-500 outline-none"
                    value={formConditionValue}
                    onChange={(e) => setFormConditionValue(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-1 col-span-1 md:col-span-2">
                <label className="text-zinc-400 block font-mono uppercase text-[9px] tracking-wider">Tindakan Eksekusi (Action)</label>
                <select
                  className="w-full bg-[#050505] border border-white/10 p-2.5 rounded-xl text-white focus:border-blue-500 outline-none font-medium"
                  value={formActionType}
                  onChange={(e) => setFormActionType(e.target.value as any)}
                >
                  <option value="none">Diamkan (Tanpa Aksi/Dry Run)</option>
                  <option value="organize_by_type">Merapikan Sandbox (Organize by File Type)</option>
                  <option value="move">Pindahkan Berkas (Move)</option>
                  <option value="copy">Salin Berkas (Copy)</option>
                  <option value="delete">Hapus Permanen Berkas (Delete)</option>
                  <option value="edit_replace">Penggantian Teks Regex (Text Replace)</option>
                  <option value="ai_summarize">Tulis Ringkasan Berkas menggunakan AI (AI Summarize)</option>
                  <option value="ai_edit">Optimasi Isi / Tulis Ulang Berkas menggunakan AI (AI Edit Rebuild)</option>
                </select>
              </div>

            </div>

            {/* ACTION-SPECIFIC CONFIGURATION PARAMETERS */}
            {formActionType !== 'none' && (
              <div className="bg-[#050505] border border-white/5 p-4 rounded-xl space-y-3">
                <h6 className="text-[10px] uppercase font-mono tracking-wider font-bold text-blue-400">Konfigurasi Parameter Tindakan</h6>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Target path parameters (move, copy, organize, summarize) */}
                  {(formActionType === 'move' || formActionType === 'copy' || formActionType === 'organize_by_type' || formActionType === 'ai_summarize') && (
                    <div className="space-y-1 col-span-1 md:col-span-2">
                      <label className="text-zinc-500 block font-mono uppercase text-[8px]">Folder Tujuan (Destination Path)</label>
                      <input 
                        type="text"
                        placeholder="Misal: output, archives, processed"
                        className="w-full bg-[#09090d] border border-white/10 p-2 rounded-lg text-white font-mono placeholder-zinc-700 outline-none"
                        value={paramTargetPath}
                        onChange={(e) => setParamTargetPath(e.target.value)}
                      />
                      <span className="text-[9px] text-zinc-500">Direktori tujuan di dalam ruang sandbox. Kosongkan untuk direktori root sandbox.</span>
                    </div>
                  )}

                  {/* Regex replace params */}
                  {formActionType === 'edit_replace' && (
                    <>
                      <div className="space-y-1">
                        <label className="text-zinc-500 block font-mono uppercase text-[8px]">Ekspresi Cari (Regex/String Match)</label>
                        <input 
                          type="text"
                          required
                          placeholder="Misal: debug_token = .*"
                          className="w-full bg-[#09090d] border border-white/10 p-2 rounded-lg text-white font-mono outline-none"
                          value={paramRegexMatch}
                          onChange={(e) => setParamRegexMatch(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-zinc-500 block font-mono uppercase text-[8px]">Isi Pengganti (Replacement Content)</label>
                        <input 
                          type="text"
                          placeholder="Misal: debug_token = null"
                          className="w-full bg-[#09090d] border border-white/10 p-2 rounded-lg text-white font-mono outline-none"
                          value={paramRegexReplace}
                          onChange={(e) => setParamRegexReplace(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1 col-span-1 md:col-span-2">
                        <label className="text-zinc-500 block font-mono uppercase text-[8px]">Regex Flags</label>
                        <input 
                          type="text"
                          placeholder="g, i, gi"
                          className="w-32 bg-[#09090d] border border-white/10 p-2 rounded-lg text-white font-mono outline-none"
                          value={paramRegexFlags}
                          onChange={(e) => setParamRegexFlags(e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  {/* AI summarization custom prompt */}
                  {formActionType === 'ai_summarize' && (
                    <div className="space-y-1 col-span-1 md:col-span-2">
                      <label className="text-zinc-500 block font-mono uppercase text-[8px]">Custom Summary Prompt (AI)</label>
                      <textarea 
                        rows={2}
                        placeholder="Misal: Buat ringkasan detail poin-poin penting dalam Bahasa Indonesia"
                        className="w-full bg-[#09090d] border border-white/10 p-2 rounded-lg text-white outline-none"
                        value={paramSummaryPrompt}
                        onChange={(e) => setParamSummaryPrompt(e.target.value)}
                      />
                    </div>
                  )}

                  {/* AI content refactoring/translation */}
                  {formActionType === 'ai_edit' && (
                    <>
                      <div className="space-y-1 col-span-1 md:col-span-2">
                        <label className="text-zinc-500 block font-mono uppercase text-[8px]">Instruksi Optimasi/Tulis Ulang (AI Prompt)</label>
                        <textarea 
                          rows={3}
                          required
                          placeholder="Misal: Terjemahkan seluruh berkas ke Bahasa Inggris dan rapikan komentarnya"
                          className="w-full bg-[#09090d] border border-white/10 p-2 rounded-lg text-white outline-none"
                          value={paramEditPrompt}
                          onChange={(e) => setParamEditPrompt(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1 col-span-1 md:col-span-2">
                        <label className="text-zinc-500 block font-mono uppercase text-[8px]">Sufiks Nama Berkas Baru</label>
                        <input 
                          type="text"
                          placeholder="Kosongkan untuk overwrite, atau isi misal: _optimized, _translated"
                          className="w-64 bg-[#09090d] border border-white/10 p-2 rounded-lg text-white font-mono outline-none"
                          value={paramOutputSuffix}
                          onChange={(e) => setParamOutputSuffix(e.target.value)}
                        />
                        <span className="text-[9px] text-zinc-500 block pt-1">Jika diisi, berkas yang diubah akan disimpan terpisah. Contoh: `laporan.txt` menjadi `laporan_optimized.txt`</span>
                      </div>
                    </>
                  )}

                  {/* Recursive traverse checkbox toggle */}
                  <div className="space-y-1 flex items-center gap-2 pt-2 col-span-1 md:col-span-2">
                    <input 
                      type="checkbox"
                      id="recursiveToggle"
                      className="cursor-pointer bg-[#09090d] border-white/10 rounded w-4 h-4"
                      checked={paramRecursive}
                      onChange={(e) => setParamRecursive(e.target.checked)}
                    />
                    <label htmlFor="recursiveToggle" className="text-zinc-400 font-sans cursor-pointer">
                      Pindai Sub-directory Secara Rekursif (Traverse Folders Recurse)
                    </label>
                  </div>

                </div>
              </div>
            )}

            {/* BUTTON BAR */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-800 text-white font-mono text-[10px] uppercase tracking-wider rounded-xl cursor-pointer"
              >
                {submitting ? "Menyimpan sirkuit..." : "Simpan Aturan"}
              </button>
              <button
                type="button"
                onClick={() => { setIsEditing(false); resetForm(); }}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-mono text-[10px] uppercase tracking-wider rounded-xl cursor-pointer"
              >
                Kembali
              </button>
            </div>
          </form>
        </div>
      )}

      {/* RULES LIST */}
      <div className="space-y-3 font-sans">
        <h5 className="text-[11px] font-bold text-zinc-400 font-mono tracking-widest uppercase">
          ATURAN AKTIF ({rules.length})
        </h5>
        
        {loading && rules.length === 0 ? (
          <div className="border border-white/5 p-8 text-center text-zinc-500 text-xs">
            Meraba konstelasi sirkuit batin berkas...
          </div>
        ) : rules.length === 0 ? (
          <div className="border border-white/5 border-dashed p-10 text-center text-zinc-500 rounded-3xl space-y-4">
            <Sliders size={28} className="mx-auto text-zinc-600" />
            <div>
              <p className="text-xs">Belum ada aturan otomatisasi berkas yang terdaftar.</p>
              <p className="text-[10px] text-zinc-650 mt-1">Pilih "Yui's Suggestions" untuk otomatisasi cerdas atau buat secara manual.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rules.map((rule) => {
              const ruleParams = rule.actionParams ? JSON.parse(rule.actionParams) : {};
              return (
                <div 
                  key={rule.id} 
                  className={`border p-5 rounded-2xl flex flex-col justify-between gap-4 transition-all ${
                    rule.enabled 
                      ? "bg-[#0e0e14]/55 border-white/10" 
                      : "bg-[#0e0e14]/20 border-white/5 opacity-60"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h6 className="text-xs font-bold text-white tracking-wide">{rule.name}</h6>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${rule.enabled ? "bg-green-400 animate-pulse" : "bg-zinc-600"}`}></span>
                          <span className="text-[9px] font-mono tracking-wider text-zinc-500 uppercase">
                            {rule.enabled ? "ACTIVE SCHEDULE" : "DISABLED"}
                          </span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleToggleRule(rule)}
                        className={`px-2 py-1 text-[8px] font-mono rounded uppercase tracking-wider transition-all cursor-pointer ${
                          rule.enabled 
                            ? "bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/10" 
                            : "bg-white/5 hover:bg-white/10 text-zinc-400 border border-white/5"
                        }`}
                      >
                        {rule.enabled ? "On" : "Off"}
                      </button>
                    </div>

                    {/* Meta stats */}
                    <div className="grid grid-cols-2 gap-3 pt-2 text-[10px] font-mono bg-[#050505]/40 border border-white/5 p-3 rounded-xl">
                      <div>
                        <span className="text-zinc-500 text-[8px] block uppercase">Pola Target</span>
                        <span className="text-yellow-400 font-bold">{rule.filePattern}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 text-[8px] block uppercase">Tindakan</span>
                        <span className="text-green-400 font-bold">{rule.actionType}</span>
                      </div>
                      <div className="col-span-2 border-t border-white/5 pt-1.5">
                        <span className="text-zinc-500 text-[8px] block uppercase">Evaluasi Kondisi</span>
                        <span className="text-zinc-400">
                          {rule.conditionType === 'none' ? "Tanpa kondisi tambahan" : `${rule.conditionType}: ${rule.conditionValue}`}
                        </span>
                      </div>
                      {rule.triggerType === 'schedule' && (
                        <div className="col-span-2 border-t border-white/5 pt-1.5 flex items-center gap-1">
                          <Clock size={10} className="text-zinc-500" />
                          <span className="text-zinc-500 text-[8px] uppercase">Rutin:</span>
                          <span className="text-blue-400 font-bold">{rule.scheduleExpr}</span>
                        </div>
                      )}
                    </div>

                    {/* Status Badge */}
                    {rule.lastRun ? (
                      <div className="flex items-center gap-2 pt-1">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-mono uppercase tracking-wider font-bold ${
                          rule.lastStatus === 'success' 
                            ? "bg-green-500/10 text-green-400 border border-green-500/20" 
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}>
                          Last Status: {rule.lastStatus}
                        </span>
                        <span className="text-[9px] font-mono text-zinc-500">
                          {new Date(rule.lastRun).toLocaleTimeString()}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[9px] font-mono text-zinc-500 block pt-1 italic">Aturan belum pernah berjalan</span>
                    )}

                  </div>

                  {/* Rule Action Buttons */}
                  <div className="flex items-center gap-1.5 border-t border-white/5 pt-3">
                    <button
                      type="button"
                      onClick={() => handleRunRuleNow(rule.id)}
                      className="px-2.5 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-[9px] uppercase font-mono tracking-wider border border-blue-500/20 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <Play size={10} />
                      Run Now
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEditRule(rule)}
                      className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-zinc-300 text-[9px] uppercase font-mono tracking-wider border border-white/5 rounded-lg cursor-pointer transition-all"
                    >
                      Sunting
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteRule(rule.id)}
                      className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[9px] uppercase font-mono tracking-wider border border-red-500/20 rounded-lg shrink-0 cursor-pointer transition-all ml-auto"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* EXECUTION LOGS TRACE TIMELINE */}
      <div className="space-y-3 font-sans pt-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <h5 className="text-[11px] font-bold text-zinc-400 font-mono tracking-widest uppercase">
            CATATAN OPERASI BERKAS LATAR (RUN LOGS)
          </h5>
          {logs.length > 0 && (
            <button
              onClick={handleClearLogs}
              className="text-red-400 hover:text-red-300 font-mono text-[9px] uppercase tracking-wider cursor-pointer"
            >
              Clear Run Log
            </button>
          )}
        </div>

        {logs.length === 0 ? (
          <div className="border border-white/5 p-6 rounded-2xl text-center text-zinc-500 text-xs font-mono">
            Sirkuit sepi: tidak ada pengerjaan berkas otomatis dalam antrean memori batin baru-baru ini.
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {logs.map((log, idx) => {
              const isOpen = expandedLog === idx;
              return (
                <div 
                  key={idx} 
                  className={`border rounded-xl transition-all ${
                    log.status === 'success' 
                      ? "bg-[#0e0e14]/40 border-white/5" 
                      : "bg-red-950/5 border-red-500/10"
                  }`}
                >
                  <div 
                    onClick={() => setExpandedLog(isOpen ? null : idx)}
                    className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-white/5 select-none"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full ${log.status === 'success' ? 'bg-green-400' : 'bg-red-400'}`}></span>
                      <div>
                        <span className="font-bold text-white text-[11px] block">{log.ruleName}</span>
                        <div className="flex items-center gap-2 text-[9px] font-mono text-zinc-500 pt-0.5">
                          <span>{log.actionPerformed}</span>
                          <span>•</span>
                          <span className="text-zinc-400 font-bold">{log.filesProcessed?.length || 0} berkas affected</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-zinc-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      {isOpen ? <ChevronUp size={14} className="text-zinc-500" /> : <ChevronDown size={14} className="text-zinc-500" />}
                    </div>
                  </div>

                  {isOpen && (
                    <div className="border-t border-white/5 p-4 bg-black/40 font-mono text-[10px] text-zinc-400 space-y-2 rounded-b-xl overflow-x-auto leading-relaxed whitespace-pre-wrap">
                      <div className="text-zinc-500 font-bold pb-1 text-[9px] uppercase">Rincian Laporan Operasi:</div>
                      {log.message}
                      {log.filesProcessed && log.filesProcessed.length > 0 && (
                        <div className="pt-2 border-t border-white/5">
                          <span className="text-blue-400/80 font-bold text-[9px] uppercase">Daftar Berkas Terpengaruh:</span>
                          <ul className="list-disc pl-4 pt-1 space-y-0.5 text-zinc-400 text-[9px]">
                            {log.filesProcessed.map((file, fIdx) => (
                              <li key={fIdx}>{file}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
export default FileAutomationTab;
