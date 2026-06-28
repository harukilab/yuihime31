import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SearchableSelect } from '../components/SearchableSelect';
import { 
  Upload, Terminal, CheckCircle2, AlertTriangle, Play, Pause, Save, FileText, Database, 
  Trash2, Layers, Search, Eye, Sparkles, ChevronLeft, ChevronRight, ChevronDown, HelpCircle,
  Download, RefreshCw, Cpu, Brain, Edit3, Plus, X, Check
} from 'lucide-react';

interface StagedEntry {
  input: string;
  output: string;
  wordCountInput: number;
  wordCountOutput: number;
}

interface TrainTabProps {
  onRefreshMemories?: () => void;
  onRefreshKnowledge?: () => void;
  onShowInfo?: (title: string, text: string) => void;
}

export const TrainTab: React.FC<TrainTabProps> = ({
  onRefreshMemories,
  onRefreshKnowledge,
  onShowInfo
}) => {
  // Navigation State
  const [activeMode, setActiveMode] = useState<'import' | 'export' | 'creator' | 'editor'>('import');

  // CRUD Editor states
  const [crudRecords, setCrudRecords] = useState<any[]>([]);
  const [isCrudLoading, setIsCrudLoading] = useState<boolean>(false);
  const [crudError, setCrudError] = useState<string | null>(null);
  const [crudSearch, setCrudSearch] = useState<string>('');
  const [crudCurrentPage, setCrudCurrentPage] = useState<number>(1);
  
  // Form states
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [formUserQuery, setFormUserQuery] = useState<string>('');
  const [formTargetSpeech, setFormTargetSpeech] = useState<string>('');
  const [formThought, setFormThought] = useState<string>('');
  const [formAnimations, setFormAnimations] = useState<string[]>(['SMILE']);
  const [formJoy, setFormJoy] = useState<number>(1);
  const [formAffection, setFormAffection] = useState<number>(0);
  const [formSadness, setFormSadness] = useState<number>(0);
  const [formAnger, setFormAnger] = useState<number>(0);
  const [formShyness, setFormShyness] = useState<number>(0);
  const [formIsSaving, setFormIsSaving] = useState<boolean>(false);

  // CRUD API functions
  const fetchCrudRecords = async () => {
    setIsCrudLoading(true);
    setCrudError(null);
    try {
      const res = await fetch("/api/cortex/synthesizer/records");
      if (res.ok) {
        const data = await res.json();
        setCrudRecords(data.records || []);
      } else {
        const err = await res.json();
        setCrudError(err.error || "Gagal memuat record SFT.");
      }
    } catch (err: any) {
      setCrudError(err.message || String(err));
    } finally {
      setIsCrudLoading(false);
    }
  };

  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUserQuery.trim() || !formTargetSpeech.trim()) {
      alert("User Query dan Target Speech wajib diisi.");
      return;
    }

    setFormIsSaving(true);
    try {
      const payload = {
        userQuery: formUserQuery,
        targetSpeech: formTargetSpeech,
        thought: formThought,
        animations: formAnimations,
        mood_impact: {
          joy: formJoy,
          affection: formAffection,
          sadness: formSadness,
          anger: formAnger,
          shyness: formShyness
        }
      };

      const url = editingRecord 
        ? `/api/cortex/synthesizer/records/${editingRecord.id}`
        : `/api/cortex/synthesizer/records`;
      
      const method = editingRecord ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        await fetchCrudRecords();
        setEditingRecord(null);
        setIsCreatingNew(false);
        resetForm();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error || "Gagal menyimpan data."}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message || String(err)}`);
    } finally {
      setFormIsSaving(false);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus hasil SFT ini secara permanen dari database?")) {
      return;
    }

    try {
      const res = await fetch(`/api/cortex/synthesizer/records/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await fetchCrudRecords();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error || "Gagal menghapus data."}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message || String(err)}`);
    }
  };

  const resetForm = () => {
    setFormUserQuery('');
    setFormTargetSpeech('');
    setFormThought('');
    setFormAnimations(['SMILE']);
    setFormJoy(1);
    setFormAffection(0);
    setFormSadness(0);
    setFormAnger(0);
    setFormShyness(0);
  };

  const startEditRecord = (rec: any) => {
    setEditingRecord(rec);
    setIsCreatingNew(false);
    setFormUserQuery(rec.userQuery || '');
    setFormTargetSpeech(rec.targetSpeech || '');
    setFormThought(rec.synthesized?.thought || '');
    setFormAnimations(rec.synthesized?.animations || ['SMILE']);
    
    const moodObj = rec.synthesized?.mood_impact || {};
    setFormJoy(moodObj.joy !== undefined ? moodObj.joy : 0);
    setFormAffection(moodObj.affection !== undefined ? moodObj.affection : 0);
    setFormSadness(moodObj.sadness !== undefined ? moodObj.sadness : 0);
    setFormAnger(moodObj.anger !== undefined ? moodObj.anger : 0);
    setFormShyness(moodObj.shyness !== undefined ? moodObj.shyness : 0);
  };

  const startCreateRecord = () => {
    setEditingRecord(null);
    setIsCreatingNew(true);
    resetForm();
  };

  useEffect(() => {
    if (activeMode === 'editor') {
      fetchCrudRecords();
      setCrudCurrentPage(1);
    }
  }, [activeMode]);

  // Synthesizer State
  const [synthConfig, setSynthConfig] = useState<{
    isEnabled: boolean;
    intervalSeconds: number;
    maxRetries: number;
    systemPrompt: string;
    thoughtTemplate: string;
    provider?: string;
    model?: string;
  } | null>(null);
  const [availableModels, setAvailableModels] = useState<{ value: string; label: string }[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState<boolean>(false);
  const [useCustomModelInput, setUseCustomModelInput] = useState<boolean>(false);
  const [synthState, setSynthState] = useState<{
    status: 'idle' | 'running' | 'paused' | 'error';
    totalRaw: number;
    synthesized: number;
    pending: number;
    retryCount: number;
    lastError: string;
    lastRunTimestamp: number;
  } | null>(null);
  const [synthLogs, setSynthLogs] = useState<string[]>([]);
  const [isSynthSaving, setIsSynthSaving] = useState(false);

  const fetchModelsForProvider = async (providerId: string) => {
    if (!providerId) return;
    setIsFetchingModels(true);
    try {
      const res = await fetch(`/api/ai/models?provider=${providerId}`);
      if (res.ok) {
        const data = await res.json();
        const models = (data.models || []).map((m: any) => {
          const id = m.name.split('/').pop() || m.name;
          return {
            label: m.displayName || id,
            value: m.name || id
          };
        });
        setAvailableModels(models);
      } else {
        setAvailableModels([]);
      }
    } catch (err) {
      console.error('Failed to fetch models for synthesizer:', err);
      setAvailableModels([]);
    } finally {
      setIsFetchingModels(false);
    }
  };

  useEffect(() => {
    if (synthConfig?.provider) {
      fetchModelsForProvider(synthConfig.provider);
    }
  }, [synthConfig?.provider]);

  const fetchSynthStatus = async () => {
    try {
      const res = await fetch("/api/cortex/synthesizer/status");
      if (res.ok) {
        const body = await res.json();
        if (body.success) {
          setSynthConfig(body.config);
          setSynthState(body.state);
          setSynthLogs(body.logs || []);
        }
      }
    } catch (err) {
      console.error("Gagal mengambil status dataset synthesizer:", err);
    }
  };

  useEffect(() => {
    fetchSynthStatus();
    const timer = setInterval(() => {
      fetchSynthStatus();
    }, 3000); // Fetch sync state every 3 seconds
    return () => clearInterval(timer);
  }, []);

  const saveSynthConfig = async (updatedFields: any) => {
    setIsSynthSaving(true);
    try {
      const res = await fetch("/api/cortex/synthesizer/configure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFields),
      });
      if (res.ok) {
        const body = await res.json();
        if (body.success) {
          setSynthConfig(body.config);
          setSynthState(body.state);
        }
      }
    } catch (err) {
      console.error("Gagal menyimpan konfigurasi synthesizer:", err);
    } finally {
      setIsSynthSaving(false);
    }
  };

  const handleSynthControl = async (action: 'start' | 'stop' | 'reset' | 'retry_pool') => {
    try {
      const res = await fetch("/api/cortex/synthesizer/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        const body = await res.json();
        if (body.success) {
          setSynthState(body.state);
          setSynthLogs(body.logs || []);
        }
      }
    } catch (err) {
      console.error(`Gagal mengirim perintah synthesizer: ${action}`, err);
    }
  };

  // Import State
  const [dragActive, setDragActive] = useState(false);
  const [fileDetails, setFileDetails] = useState<{ name: string; size: number } | null>(null);
  const [stagedEntries, setStagedEntries] = useState<StagedEntry[]>([]);
  const [importTarget, setImportTarget] = useState<'both' | 'system2' | 'system1'>('both');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedingLog, setSeedingLog] = useState<string[]>([]);
  const [seedingProgress, setSeedingProgress] = useState(0);
  const [seedResult, setSeedResult] = useState<{ success: boolean; system1Count?: number; system2Count?: number; message?: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  // Export State
  const [exportLimit, setExportLimit] = useState<number>(100);
  const [exportLimitUnlimited, setExportLimitUnlimited] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<'openai' | 'sharegpt' | 'alpaca'>('openai');
  const [exportOutputFormat, setExportOutputFormat] = useState<'json_cot' | 'raw_text'>('json_cot');
  const [exportThoughtTemplate, setExportThoughtTemplate] = useState<string>('Responding to {sender} regarding "{message}". {character} is formulating a sweet response to capture their feelings.');
  const [exportCustomRegexes, setExportCustomRegexes] = useState<string>('');
  const [exportUserFallback, setExportUserFallback] = useState<string>("Kakak, Penonton, Subscriber, Chatter, Kawan");
  const [exportAiFallback, setExportAiFallback] = useState<string>("Yui");
  const [exportRelationVerb, setExportRelationVerb] = useState<string>("berkata");
  const [exportSmartSynthesize, setExportSmartSynthesize] = useState<boolean>(false);
  const [exportOnlySynthesized, setExportOnlySynthesized] = useState<boolean>(false);
  const [viewingRawRecord, setViewingRawRecord] = useState<any | null>(null);
  const [rawTab, setRawTab] = useState<'database' | 'chatml'>('database');
  const [exportSystemPrompt, setExportSystemPrompt] = useState<string>("You are Yuihime, a protective companion digital soul running on Perfect Giftia OS. Output strictly valid JSON.");
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportResult, setExportResult] = useState<any[] | null>(null);
  const [exportLogs, setExportLogs] = useState<string[]>([]);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [exportErrorMessage, setExportErrorMessage] = useState<string | null>(null);
  const [exportSearchQuery, setExportSearchQuery] = useState<string>('');
  const [exportCurrentPage, setExportCurrentPage] = useState<number>(1);

  const entriesPerPage = 10;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag and Drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Parsing dataset files
  const handleFile = (file: File) => {
    const isJson = file.name.endsWith('.json');
    const isJsonl = file.name.endsWith('.jsonl');

    if (!isJson && !isJsonl) {
      setErrorMessage("Format file tidak didukung! Pastikan file berekstensi .json atau .jsonl.");
      return;
    }

    setErrorMessage(null);
    setSeedResult(null);
    setFileDetails({ name: file.name, size: file.size });

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        const parsed: StagedEntry[] = [];
        
        if (isJsonl) {
          // Parse JSON Lines
          const lines = text.split('\n');
          lines.forEach((line, index) => {
            const trimmed = line.trim();
            if (!trimmed) return;
            try {
              const obj = JSON.parse(trimmed);
              const extracted = extractQAFromObject(obj);
              if (extracted) parsed.push(extracted);
            } catch (err) {
              console.warn(`Gagal mem-parse baris ke-${index + 1}: ${err}`);
            }
          });
        } else {
          // Parse standar JSON
          const data = JSON.parse(text);
          if (Array.isArray(data)) {
            // Array of QAs or Array of Messages
            data.forEach((item) => {
              const extracted = extractQAFromObject(item);
              if (extracted) {
                parsed.push(extracted);
              } else if (item && (Array.isArray(item.messages) || Array.isArray(item.conversations))) {
                // Nested ShareGPT format
                const ex = extractQAFromConversations(item.messages || item.conversations);
                if (ex) parsed.push(ex);
              }
            });
          } else if (data && (Array.isArray(data.messages) || Array.isArray(data.conversations))) {
            const list = data.messages || data.conversations;
            const listExtracted = extractQAFromConversations(list);
            if (listExtracted) parsed.push(listExtracted);
          } else if (typeof data === 'object' && data !== null) {
            const extracted = extractQAFromObject(data);
            if (extracted) parsed.push(extracted);
          }
        }

        if (parsed.length === 0) {
          setErrorMessage("Tidak dapat mengekstrak percakapan dari file. Pastikan struktur JSON sesuai format pelatihan AI.");
          setStagedEntries([]);
        } else {
          setStagedEntries(parsed);
          setCurrentPage(1);
        }
      } catch (err: any) {
        setErrorMessage(`Gagal membaca file JSON: ${err.message || err}`);
        setStagedEntries([]);
      }
    };
    reader.readAsText(file);
  };

  // Helpers to extract user-assistant pairs
  const extractQAFromObject = (obj: any): StagedEntry | null => {
    if (!obj || typeof obj !== 'object') return null;

    // Format: {"input": "...", "output": "..."} or {"prompt": "...", "response": "..."}
    const inputKeys = ['input', 'prompt', 'question', 'user', 'query', 'user_input'];
    const outputKeys = ['output', 'response', 'answer', 'assistant', 'completion', 'ai_output'];

    let input = '';
    let output = '';

    for (const key of inputKeys) {
      if (obj[key] && typeof obj[key] === 'string') {
        input = obj[key];
        break;
      }
    }

    for (const key of outputKeys) {
      if (obj[key] && typeof obj[key] === 'string') {
        output = obj[key];
        break;
      }
    }

    // Checking messages array if exists: {"messages": [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]}
    if ((!input || !output) && Array.isArray(obj.messages)) {
      return extractQAFromConversations(obj.messages);
    }
    if ((!input || !output) && Array.isArray(obj.conversations)) {
      return extractQAFromConversations(obj.conversations);
    }

    if (input && output) {
      return {
        input: input.trim(),
        output: output.trim(),
        wordCountInput: input.trim().split(/\s+/).filter(Boolean).length,
        wordCountOutput: output.trim().split(/\s+/).filter(Boolean).length
      };
    }

    return null;
  };

  const extractQAFromConversations = (arr: any[]): StagedEntry | null => {
    let input = '';
    let output = '';

    // Standard ShareGPT or OpenAI schema
    for (const msg of arr) {
      if (!msg || typeof msg !== 'object') continue;
      const role = String(msg.role || msg.from || '').toLowerCase();
      const content = String(msg.content || msg.value || '');

      if (['user', 'human', 'prompter'].includes(role)) {
        input = content;
      } else if (['assistant', 'gpt', 'assistant_response', 'agent', 'yui', 'airi'].includes(role)) {
        output = content;
      }
    }

    if (input && output) {
      return {
        input: input.trim(),
        output: output.trim(),
        wordCountInput: input.trim().split(/\s+/).filter(Boolean).length,
        wordCountOutput: output.trim().split(/\s+/).filter(Boolean).length
      };
    }
    return null;
  };

  const handleClear = () => {
    setFileDetails(null);
    setStagedEntries([]);
    setErrorMessage(null);
    setSeedResult(null);
  };

  // Launching Seeding action
  const handleLaunchSeeding = async () => {
    if (stagedEntries.length === 0) return;

    setIsSeeding(true);
    setSeedingLog([]);
    setSeedingProgress(5);
    setSeedResult(null);

    const log = (msg: string) => {
      setSeedingLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    try {
      log("Menginisiasi Seeding Engine Luring Yuihime...");
      await sleep(400);
      setSeedingProgress(15);

      log("Menghubungkan ke SQLite WAL database...");
      await sleep(350);
      setSeedingProgress(30);

      log(`Melakukan komparasi dataset: mendeteksi ${stagedEntries.length} dialogue threads.`);
      await sleep(300);
      setSeedingProgress(45);

      if (importTarget === 'both' || importTarget === 'system1') {
        const system1Count = Math.min(stagedEntries.length, 150);
        log(`Mempersiapkan ${system1Count} thread untuk Episodic Memory (System 1 - Fast Recall)...`);
      }
      if (importTarget === 'both' || importTarget === 'system2') {
        log(`Mempersiapkan ${stagedEntries.length} thread untuk Long-Term Memory (System 2 - RAG Semantic Search)...`);
      }
      await sleep(400);
      setSeedingProgress(60);

      log("Mengirim paket transmisi dataset ke router batin Cortex...");
      setSeedingProgress(75);

      const res = await fetch('/api/cortex/import-dataset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entries: stagedEntries,
          target: importTarget
        })
      });

      setSeedingProgress(90);
      await sleep(400);

      if (res.ok) {
        const result = await res.json();
        setSeedingProgress(100);
        await sleep(300);

        log(`Sukses! ${result.system1Count || 0} diinjeksikan ke System 1 (Episodic Memory).`);
        log(`Sukses! ${result.system2Count || 0} diinjeksikan ke System 2 (Long-Term sqlite memories).`);
        log("Sinkronisasi memori batin selesai secara mulus.");

        setSeedResult({
          success: true,
          system1Count: result.system1Count,
          system2Count: result.system2Count,
          message: result.message
        });

        if (onRefreshMemories) onRefreshMemories();
        if (onRefreshKnowledge) onRefreshKnowledge();
      } else {
        const errData = await res.json();
        throw new Error(errData.message || errData.error || "Gagal melakukan transmisi API.");
      }
    } catch (err: any) {
      log(`🛑 ERROR: ${err.message || err}`);
      setSeedResult({
        success: false,
        message: err.message || String(err)
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleLaunchExport = async () => {
    setIsExporting(true);
    setExportLogs([]);
    setExportProgress(5);
    setExportResult(null);
    setExportErrorMessage(null);

    const log = (msg: string) => {
      setExportLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    try {
      log("Menginisiasi Eksportir Dataset Kognitif Yuihime...");
      await sleep(350);
      setExportProgress(15);

      log("Menghubungkan ke SQLite batin dan memuat tabel memories...");
      await sleep(350);
      setExportProgress(35);

      log(`Metode konversi: ${exportSmartSynthesize ? "Sintesis kognitif mendalam (Gemini)" : "Pemetaan struktur cepat luring"}`);
      await sleep(300);
      setExportProgress(55);

      log("Mengirim paket parameter kognitif ke router batin Cortex...");
      setExportProgress(75);

      const res = await fetch('/api/cortex/export-dataset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          limit: exportLimitUnlimited ? "unlimited" : exportLimit,
          smartSynthesize: exportSmartSynthesize,
          systemPrompt: exportSystemPrompt,
          userFallback: exportUserFallback,
          aiFallback: exportAiFallback,
          relationVerb: exportRelationVerb,
          format: exportFormat,
          outputFormat: exportOutputFormat,
          thoughtTemplate: exportThoughtTemplate,
          customRegexes: exportCustomRegexes.split('\n').map(line => line.trim()).filter(Boolean),
          onlySynthesized: exportOnlySynthesized
        })
      });

      setExportProgress(90);
      await sleep(300);

      if (res.ok) {
        const result = await res.json();
        setExportProgress(100);
        await sleep(300);

        if (result.entries && result.entries.length > 0) {
          log(`SUCCESS: Berhasil menyusun ${result.entries.length} data sesi latihan.`);
          setExportResult(result.entries);
          setExportErrorMessage(null);
        } else {
          log("⚠️ Database memories kosong atau tidak ada obrolan terstruktur.");
          setExportResult([]);
          setExportErrorMessage("Tidak ditemukan percakapan valid dalam database untuk diekspor.");
        }
      } else {
        const errData = await res.json();
        throw new Error(errData.error || errData.message || "Gagal melakukan query transmisi eksportir.");
      }
    } catch (err: any) {
      log(`🛑 ERROR: ${err.message || err}`);
      setExportErrorMessage(err.message || String(err));
      setExportResult([]);
    } finally {
      setIsExporting(false);
    }
  };

  const downloadDataset = (format: 'json' | 'jsonl') => {
    if (!exportResult || exportResult.length === 0) return;

    let fileContent = "";
    let fileExtension = "";

    if (format === 'json') {
      fileContent = JSON.stringify(exportResult, null, 2);
      fileExtension = "json";
    } else {
      fileContent = exportResult.map(entry => JSON.stringify(entry)).join('\n');
      fileExtension = "jsonl";
    }

    const blob = new Blob([fileContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `yuihime_sft_dataset_${Date.now()}.${fileExtension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Filters stagedEntries according to search query
  const filteredEntries = stagedEntries.filter(entry => {
    const s = searchQuery.toLowerCase();
    return entry.input.toLowerCase().includes(s) || entry.output.toLowerCase().includes(s);
  });

  const totalPages = Math.ceil(filteredEntries.length / entriesPerPage);
  const displayedEntries = filteredEntries.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage);

  // Filters exportResult according to search query
  const filteredExportEntries = (exportResult || []).filter(entry => {
    if (!exportSearchQuery) return true;
    const s = exportSearchQuery.toLowerCase();
    if (Array.isArray(entry.messages)) {
      return entry.messages.some((msg: any) => (msg.content || '').toLowerCase().includes(s));
    }
    if (Array.isArray(entry.conversations)) {
      return entry.conversations.some((msg: any) => (msg.value || '').toLowerCase().includes(s));
    }
    const inst = entry.instruction ? String(entry.instruction).toLowerCase() : '';
    const inp = entry.input ? String(entry.input).toLowerCase() : '';
    const out = entry.output ? String(entry.output).toLowerCase() : '';
    return inst.includes(s) || inp.includes(s) || out.includes(s);
  });

  const exportTotalPages = Math.ceil(filteredExportEntries.length / entriesPerPage);
  const displayedExportEntries = filteredExportEntries.slice((exportCurrentPage - 1) * entriesPerPage, exportCurrentPage * entriesPerPage);

  return (
    <div className="space-y-6 font-sans select-none text-left">
      {/* Tab Header */}
      <div className="flex justify-between items-start border-b border-white/5 pb-5">
        <div>
          <h4 className="text-[10px] uppercase font-mono tracking-widest text-[#d4d4d8]/40 mb-1.5 font-bold">Mental Refactoring & Training Data</h4>
          <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            {activeMode === 'import' ? (
              <>
                <Layers className="text-amber-500" size={18} /> Airi Training Dataset Importer
              </>
            ) : activeMode === 'export' ? (
              <>
                <Brain className="text-amber-500" size={18} /> Yui Activity Synthesizer & Exporter
              </>
            ) : activeMode === 'creator' ? (
              <>
                <Sparkles className="text-rose-500" size={18} /> Synaptic Creator Daemon
              </>
            ) : (
              <>
                <Edit3 className="text-emerald-500" size={18} /> Editor Hasil SFT (CRUD)
              </>
            )}
          </h2>
          <p className="text-zinc-400 text-xs mt-1.5 max-w-2xl leading-relaxed">
            {activeMode === 'import' ? (
              "Integrasikan dataset pelatihan Yui Airi (.json / .jsonl) ke dalam sirkuit kognitif Yuihime. Memori dapat diinjeksi ke System 1 (Episodic Memory) untuk pencocokan instan tanpa LLM, dan System 2 (RAG) untuk penjiwaan nuansa Airi di cloud."
            ) : activeMode === 'export' ? (
              "Ekstrak riwayat obrolan dan aktivitas nyata Yuihime dari sirkuit database lokal, lalu susun menjadi dataset SFT (Supervised Fine-Tuning) berformat OpenAI/ChatML kustom lengkap dengan pemetaan pikiran (CoT), emosi, bodi, dan panggilan alat."
            ) : activeMode === 'creator' ? (
              "Prosesor latar belakang otomatis untuk mensintesis data obrolan mentah menjadi representasi mental emosi kognitif yang mendalam untuk diumpankan ke model SFT."
            ) : (
              "Kelola hasil transmutasi data SFT kognitif secara langsung dengan fitur CRUD lengkap. Sunting pemikiran (thought process), animasi fisik Yuihime, serta bobot emosi dari klaster memori batin secara presisi."
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setHelpOpen(!helpOpen)}
            className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-amber-500 hover:text-amber-400 px-3 py-1.5 rounded-xl border border-white/5 transition-all text-[10px] font-mono cursor-pointer font-bold"
          >
            <HelpCircle size={13} /> Cara Kerja
          </button>
          {onShowInfo && (
            <button
              type="button"
              onClick={() => onShowInfo(
                activeMode === 'import' ? "Neuromorphic Data Injection" : "Cognitive Dataset Synthesis",
                activeMode === 'import' ? (
                  "Integrasi data latih Airi ke memori Yuihime ditenagai oleh:\\n\\n1. System 1 (Episodic Memory): Kemampuan mengingat instan berbasis Levenshtein similarity distance. Menghemat biaya API & latensi (0ms reply).\\n\\n2. System 2 (Semantic memories db): Seeding dialogue threads ke SQLite memories block agar ditarik otomatis oleh Cortex RAG Engine, membimbing LLM bertutur kata manis, manja, ketus persis Airi."
                ) : (
                  "Mengekspor aktivitas riil Yuihime menjadi draf dataset latihan (.json / .jsonl) dengan format OpenAI standard:\\n\\n1. Fast Mapping: Memetakan jawaban ucapan riil Yui ke pembungkus JSON standard secara instan dan aman.\\n\\n2. Smart AI Synthesis (Gemini): Menggunakan kekuatan penalaran Gemini server-side untuk mengulang sejarah dialog, lalu merefleksikan emosi, merumuskan alasan pikiran kognitif (thought) terdalam, dan membungkus interaksi secara autentik."
                )
              )}
              className="flex items-center gap-1 bg-white/5 hover:bg-white/10 text-cyan-400 hover:text-cyan-300 px-2.5 py-1.5 rounded-lg border border-white/5 transition-all text-[10px] font-mono cursor-pointer font-bold"
            >
              Info Detail
            </button>
          )}
        </div>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex bg-[#0a0a0f]/85 p-1 rounded-2xl border border-white/5 w-fit gap-1 overflow-x-auto max-w-full">
        <button
          type="button"
          onClick={() => setActiveMode('import')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeMode === 'import'
              ? 'bg-amber-500 text-black shadow-lg'
              : 'text-zinc-500 hover:text-white hover:bg-white/5'
          }`}
        >
          <Layers size={13} /> Airi Dataset Importer
        </button>
        <button
          type="button"
          onClick={() => setActiveMode('export')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeMode === 'export'
              ? 'bg-amber-500 text-black shadow-lg'
              : 'text-zinc-500 hover:text-white hover:bg-white/5'
          }`}
        >
          <Brain size={13} /> Yui Activity Synthesizer & Exporter
        </button>
        <button
          type="button"
          onClick={() => setActiveMode('creator')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeMode === 'creator'
              ? 'bg-[#ef4444] text-white shadow-lg shadow-rose-500/10'
              : 'text-zinc-500 hover:text-white hover:bg-white/5'
          }`}
        >
          <Sparkles size={13} /> Synaptic Creator Daemon
        </button>
        <button
          type="button"
          onClick={() => setActiveMode('editor')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeMode === 'editor'
              ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/10'
              : 'text-zinc-500 hover:text-white hover:bg-white/5'
          }`}
        >
          <Edit3 size={13} /> Editor Hasil SFT (CRUD)
        </button>
      </div>

      {/* Help Overlay Guide */}
      <AnimatePresence>
        {helpOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-amber-500/5 border border-amber-500/20 p-5 rounded-2xl space-y-3 block overflow-hidden"
          >
            {activeMode === 'import' ? (
              <>
                <h4 className="text-xs font-bold text-amber-500 flex items-center gap-2">
                  <Sparkles size={14} /> Cara Mempersiapkan & Mengimpor Dataset Airi
                </h4>
                <div className="text-zinc-300 text-xs space-y-2 leading-relaxed font-normal font-sans">
                  <p>
                    <strong>1. Format File yang Didukung:</strong> File berupa <code>.json</code> standar atau <code>.jsonl</code> (JSON Lines). Anda dapat langsung mengunggah draf data percakapan Anda.
                  </p>
                  <p>
                    <strong>2. Skema JSON yang Terbaca:</strong> Importer kami cerdas dan dapat mendeteksi beberapa skema pelatihan umum secara otomatis:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-zinc-400 font-mono text-[10.5px]">
                    <li>{"Standar Q&A: [ {\"input\": \"pertanyaan\", \"output\": \"jawaban\"} ]"}</li>
                    <li>{"Skema ShareGPT: [ {\"messages\": [{\"role\": \"user\", \"content\": \"X\"}, {\"role\": \"assistant\", \"content\": \"Y\"}]} ]"}</li>
                    <li>{"Stagnan JSONL: Baris demi baris bertipe objek di atas."}</li>
                  </ul>
                  <p>
                    <strong>3. Penentuan Target Injeksi:</strong> Pilih <strong>Injeksi Ganda</strong> agar dataset diduplikasi secara seimbang ke memori cepat luring Yuihime (System 1) serta database kontekstual batin (System 2 RAG).
                  </p>
                </div>
              </>
            ) : activeMode === 'export' ? (
              <>
                <h4 className="text-xs font-bold text-amber-500 flex items-center gap-2">
                  <Sparkles size={14} /> Cara Menyusun & Mengekspor Aktivitas Yuihime
                </h4>
                <div className="text-zinc-300 text-xs space-y-2 leading-relaxed font-normal font-sans">
                  <p>
                    <strong>1. Membaca Database lokal:</strong> Fitur ini menyisir seluruh riwayat transaksi obrolan Anda bersama Yuihime yang tersimpan aman di tabel SQLite local <code>memories</code>.
                  </p>
                  <p>
                    <strong>2. Smart AI Synthesis:</strong> Rekomendasi diaktifkan! Menggunakan LLM Gemini batin untuk menyusun ulang sejarah chat dan menghasilkan <em>Chain-of-Thought (CoT)</em> internal, emosi, draf bodi, dan tanggapan manis Yuihime yang sangat natural.
                  </p>
                  <p>
                    <strong>3. Output Siap Training:</strong> Format yang dihasilkan mengikuti ChatML standar OpenAI, yang dapat langsung disuapkan ke platform Unsloth atau Axolotl untuk meluncurkan tuning local model berukuran kecil (misal: 1B - 8B) agar persis Yuihime!
                  </p>
                </div>
              </>
            ) : activeMode === 'creator' ? (
              <>
                <h4 className="text-xs font-bold text-rose-450 flex items-center gap-2">
                  <Sparkles size={14} /> Cara Pengoperasian Daemon Pembuat Dataset Synaptic
                </h4>
                <div className="text-zinc-300 text-xs space-y-2 leading-relaxed font-normal font-sans">
                  <p>
                    <strong>1. Pekerjaan Latar Belakang (Offline Daemon):</strong> Daemon ini bekerja secara mandiri di belakang layar saat batin Yui sedang mengantuk atau beristirahat.
                  </p>
                  <p>
                    <strong>2. Transmutasi Bertahap:</strong> Data mentah yang diimpor akan diproses satu per satu secara otomatis untuk disuplai dengan representasi pikiran (CoT) mendalam.
                  </p>
                </div>
              </>
            ) : (
              <>
                <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                  <Sparkles size={14} /> Cara Menggunakan Editor Hasil SFT (CRUD)
                </h4>
                <div className="text-zinc-300 text-xs space-y-2 leading-relaxed font-normal font-sans">
                  <p>
                    <strong>1. Pencarian dan Penyaringan Cepat:</strong> Cari data hasil sintesis batin menggunakan kolom pencarian. Semua data yang cocok akan disaring secara instan.
                  </p>
                  <p>
                    <strong>2. Penyuntingan Penuh (CRUD):</strong> Klik ikon pensil untuk mengedit teks kueri user, ucapan balasan (speech), pemikiran batin (thought), ekspresi animasi wajah Yuihime, serta bobot emosi secara mendetail.
                  </p>
                  <p>
                    <strong>3. Pembuatan Data Baru (Manual Addition):</strong> Klik tombol "Tambah Data SFT Baru" untuk merancang dan memodifikasi contoh ideal obrolan batin baru buatan Anda langsung ke klaster database lokal batin Yuihime.
                  </p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Sandbox Interactive Section */}
      {activeMode === 'import' ? (
        stagedEntries.length === 0 ? (
          <div 
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={triggerFileInput}
            className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-4 ${
              dragActive 
                ? 'border-amber-500 bg-amber-500/10 scale-[0.99] shadow-[0_0_24px_rgba(245,158,11,0.1)]' 
                : 'border-white/10 bg-[#07070a]/40 hover:border-white/20 hover:bg-[#0c0c12]/50'
            }`}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileInput} 
              accept=".json,.jsonl" 
              className="hidden" 
            />
            <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-amber-500">
              <Upload size={32} className="animate-pulse" />
            </div>
            <div>
              <h3 className="text-md font-bold text-white mb-1">Unggah Dataset Pelatihan Yui Airi</h3>
              <p className="text-xs text-zinc-500 max-w-md mx-auto leading-relaxed">
              Drag & Drop file <strong>dataset.json</strong> atau <strong>dataset.jsonl</strong> di sini, atau klik untuk merambah folder fisik Anda.
            </p>
          </div>
          {errorMessage && (
            <div className="mt-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-2 rounded-xl text-xs flex items-center gap-2 max-w-md">
              <AlertTriangle size={14} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* LFT: Control panel options & active parsing parameters */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-[#0e0e14]/55 border border-white/5 p-6 rounded-3xl space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-400 font-bold">Informasi Dataset</span>
                <button 
                  type="button" 
                  onClick={handleClear}
                  className="text-zinc-500 hover:text-white transition-colors text-[9px] uppercase font-mono font-bold cursor-pointer"
                >
                  Ganti File
                </button>
              </div>

              {/* Dataset metrics displays */}
              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center bg-black/30 p-3 rounded-xl border border-white/5">
                  <span className="text-zinc-500">Nama File</span>
                  <span className="text-white font-bold truncate max-w-[160px]">{fileDetails?.name}</span>
                </div>
                <div className="flex justify-between items-center bg-black/30 p-3 rounded-xl border border-white/5">
                  <span className="text-zinc-500">Ukuran Berkas</span>
                  <span className="text-white font-bold">{(fileDetails ? (fileDetails.size / 1024).toFixed(1) : 0)} KB</span>
                </div>
                <div className="flex justify-between items-center bg-black/30 p-3 rounded-xl border border-white/5">
                  <span className="text-zinc-500">Total Dialog Threads</span>
                  <span className="text-amber-500 font-extrabold">{stagedEntries.length} Q&A Pairs</span>
                </div>
              </div>

              {/* Target Seeding Injection parameters selection */}
              <div className="space-y-3 border-t border-white/5 pt-4">
                <label className="text-[10px] uppercase font-mono tracking-widest text-zinc-400 block font-bold">Target Injeksi Sirkuit</label>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => setImportTarget('both')}
                    className={`p-3 border rounded-xl flex items-start gap-3 transition-all text-left cursor-pointer ${
                      importTarget === 'both' 
                        ? 'bg-amber-500/10 border-amber-500/50 text-amber-500' 
                        : 'bg-black/30 border-white/5 text-zinc-400 hover:border-white/10'
                    }`}
                  >
                    <Layers size={14} className="mt-0.5" />
                    <div>
                      <h5 className="text-[11px] font-bold">Injeksi Ganda (System 1 & System 2)</h5>
                      <p className="text-[9.5px] text-zinc-500 mt-0.5 leading-relaxed">Duplikasi data latih luring Yui ke Episodic memory instan (150 item pertama) & SQLite memories db.</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImportTarget('system2')}
                    className={`p-3 border rounded-xl flex items-start gap-3 transition-all text-left cursor-pointer ${
                      importTarget === 'system2' 
                        ? 'bg-amber-500/10 border-amber-500/50 text-amber-500' 
                        : 'bg-black/30 border-white/5 text-zinc-400 hover:border-white/10'
                    }`}
                  >
                    <Database size={14} className="mt-0.5" />
                    <div>
                      <h5 className="text-[11px] font-bold">Hanya System 2 (Contextual RAG memories)</h5>
                      <p className="text-[9.5px] text-zinc-500 mt-0.5 leading-relaxed">Injeksi murni ke SQLite database. Yui akan memanggil memori ini sebagai latar belakang bimbingan karakter LLM.</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImportTarget('system1')}
                    className={`p-3 border rounded-xl flex items-start gap-3 transition-all text-left cursor-pointer ${
                      importTarget === 'system1' 
                        ? 'bg-amber-500/10 border-amber-500/50 text-amber-500' 
                        : 'bg-black/30 border-white/5 text-zinc-400 hover:border-white/10'
                    }`}
                  >
                    <Terminal size={14} className="mt-0.5" />
                    <div>
                      <h5 className="text-[11px] font-bold">Hanya System 1 (Episodic Fast Memory)</h5>
                      <p className="text-[9.5px] text-zinc-500 mt-0.5 leading-relaxed">Injeksi eksklusif ke local memory cache. Maksimal 150 item pertama untuk respon instan tanpa internet.</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Action buttons triggers */}
              <div className="space-y-2 border-t border-white/5 pt-4">
                <button
                  type="button"
                  onClick={handleLaunchSeeding}
                  disabled={isSeeding || stagedEntries.length === 0}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-wider py-3.5 px-4 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(245,158,11,0.2)] hover:shadow-[0_4px_20px_rgba(245,158,11,0.3)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
                >
                  <Play size={13} fill="currentColor" /> Launch Seeding Engine
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={isSeeding}
                  className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/5 font-bold text-xs uppercase tracking-wider py-3.5 px-4 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Trash2 size={13} /> Bersihkan Data
                </button>
              </div>
            </div>
          </div>

          {/* RGT: Interactive staged dataset preview tables */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Visual Search input field & Preview Header */}
            <div className="bg-[#0e0e14]/55 border border-white/5 p-6 rounded-3xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
                <div className="flex items-center gap-2">
                  <Eye className="text-amber-500" size={16} />
                  <span className="text-sm font-bold text-white tracking-wide">Pustaka Memori Terbaca ({filteredEntries.length})</span>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-2.5 text-zinc-550" size={14} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Cari kata kunci dialog..."
                    className="w-full bg-[#07070a] border border-white/5 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50 font-mono transition-colors"
                  />
                </div>
              </div>

              {/* Stage Table Grid */}
              <div className="overflow-hidden border border-white/5 rounded-2xl divide-y divide-white/5">
                {displayedEntries.length === 0 ? (
                  <div className="p-8 text-center text-zinc-550 text-xs italic">
                    Tidak ada draf dialog yang cocok dengan kriteria filter pencarian Anda.
                  </div>
                ) : (
                  displayedEntries.map((entry, index) => {
                    const globalIdx = (currentPage - 1) * entriesPerPage + index + 1;
                    return (
                      <div key={index} className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#050508]/20 hover:bg-[#0c0c12]/40 transition-all font-sans">
                        
                        {/* INPUT STAGE: User query speech prompts */}
                        <div className="space-y-1.5 border-r border-white/[0.02] pr-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-500/10 text-zinc-400">
                              #{globalIdx} Input (User)
                            </span>
                            <span className="text-[8px] font-mono text-zinc-550">
                              {entry.wordCountInput} kata
                            </span>
                          </div>
                          <p className="text-zinc-300 text-xs italic font-mono leading-relaxed truncate md:whitespace-normal md:line-clamp-3">
                            "{entry.input}"
                          </p>
                        </div>

                        {/* OUTPUT STAGE: Airi conversational responses */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 font-bold">
                              Airi (Bot Answer)
                            </span>
                            <span className="text-[8px] font-mono text-zinc-550">
                              {entry.wordCountOutput} kata
                            </span>
                          </div>
                          <p className="text-[#f59e0b]/90 text-xs font-normal leading-relaxed truncate md:whitespace-normal md:line-clamp-3">
                            "{entry.output}"
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 text-xs font-mono">
                  <span className="text-zinc-550">Halaman {currentPage} dari {totalPages}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="p-1 px-3 bg-white/5 border border-white/5 hover:bg-white/10 rounded-lg text-white disabled:opacity-30 cursor-pointer active:scale-95 transition-all font-bold"
                    >
                      <ChevronLeft size={12} className="inline mr-0.5" /> Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="p-1 px-3 bg-white/5 border border-white/5 hover:bg-white/10 rounded-lg text-white disabled:opacity-30 cursor-pointer active:scale-95 transition-all font-bold"
                    >
                      Next <ChevronRight size={12} className="inline ml-0.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )) : activeMode === 'export' ? (
        // --- VIEW EXPORT SECTION ---
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-fade-in text-left">
          {/* LEFT: Export Control Panel */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-[#0e0e14]/55 border border-white/5 p-6 rounded-3xl space-y-6">
              <div className="border-b border-white/5 pb-3">
                <span className="text-[10px] uppercase font-mono tracking-widest text-[#d4d4d8]/40 block font-bold mb-1">Configuration</span>
                <h3 className="text-sm font-bold text-white">SFT Dataset Constructor</h3>
              </div>

              {/* Limit selector */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[11px] font-mono">
                  <span className="text-zinc-400">Limit Sesi Chat</span>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 cursor-pointer text-zinc-400 hover:text-white transition-colors">
                      <input
                        type="checkbox"
                        checked={exportLimitUnlimited}
                        onChange={(e) => setExportLimitUnlimited(e.target.checked)}
                        className="rounded border-white/10 bg-black/40 text-amber-500 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer accent-amber-500"
                      />
                      <span className="text-[10.5px]">Unlimited</span>
                    </label>
                    <span className="text-zinc-750">|</span>
                    <span className="text-amber-500 font-bold font-mono">
                      {exportLimitUnlimited ? "Tanpa Batas" : `${exportLimit} Sesi`}
                    </span>
                  </div>
                </div>
                {!exportLimitUnlimited ? (
                  <input
                    type="range"
                    min="5"
                    max="500"
                    step="5"
                    value={exportLimit}
                    onChange={(e) => setExportLimit(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer h-1.5 bg-white/5 rounded-lg appearance-none"
                  />
                ) : (
                  <div className="py-1 px-3 border border-amber-500/10 bg-amber-500/5 rounded-xl text-center text-[9px] text-amber-500 font-mono tracking-wide leading-none my-1">
                    🔄 Mengambil seluruh aktivitas batin & database Yuihime
                  </div>
                )}
                <span className="text-[9px] text-zinc-500 block leading-normal">
                  Membatasi data sesi latihan yang ditarik. Jika "Unlimited", seluruh database memori, aktivitas, serta dataset batin yang pernah diimpor akan diproses.
                </span>
              </div>

              {/* Dataset Format selector */}
              <div className="space-y-2 pt-3 border-t border-white/[0.03]">
                <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 block font-bold">Target Format</span>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-black/40 border border-white/5 rounded-2xl">
                  {(['openai', 'sharegpt', 'alpaca'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setExportFormat(fmt)}
                      className={`px-2 py-2 rounded-xl text-[9px] uppercase font-mono transition-all font-bold cursor-pointer text-center leading-none ${
                        exportFormat === fmt
                          ? 'bg-amber-500 text-black shadow-sm font-extrabold'
                          : 'text-zinc-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
                <p className="text-[8.5px] text-zinc-500 leading-tight">
                  {exportFormat === 'openai' && "Standard OpenAI: array of messages (system, user, assistant)."}
                  {exportFormat === 'sharegpt' && "vicuna / sharegpt format (from: human, value, system)."}
                  {exportFormat === 'alpaca' && "Alpaca instruction format (instruction, input, output)."}
                </p>
              </div>

              {/* Prefix & Fallback Configuration */}
              <div className="space-y-4 pt-3 border-t border-white/[0.03]">
                <span className="text-[10px] uppercase font-mono tracking-wider text-amber-500/80 block font-bold">Dynamic Name & Verb Prefix</span>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1 col-span-2 md:col-span-1">
                    <span className="text-[10px] text-zinc-400 font-mono block">User Fallback Pool (CSV)</span>
                    <input
                      type="text"
                      value={exportUserFallback}
                      onChange={(e) => setExportUserFallback(e.target.value)}
                      placeholder="e.g. Kakak, Penonton, Subscriber, Chatter"
                      className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:border-amber-500/50 outline-none transition-all"
                    />
                    <span className="text-[8.5px] text-zinc-500 block leading-tight">
                      Daftar nama cadangan jika nama asli pengirim tidak terdeteksi. Dipisahkan koma untuk memilih nama secara acak konsisten agar tidak terpaku pada 1 user.
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-400 font-mono block">AI Prefix/Name</span>
                    <input
                      type="text"
                      value={exportAiFallback}
                      onChange={(e) => setExportAiFallback(e.target.value)}
                      placeholder="e.g. Yui"
                      className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:border-amber-500/50 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-400 font-mono block">Verb Linker (Action Verb)</span>
                  <input
                    type="text"
                    value={exportRelationVerb}
                    onChange={(e) => setExportRelationVerb(e.target.value)}
                    placeholder="e.g. berkata"
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:border-amber-500/50 outline-none transition-all"
                  />
                  <span className="text-[8.5px] text-zinc-500 block leading-tight">
                    Kata kerja penghubung dinamis (e.g. "Blaze berkata...", atau "Airi mengatakan..."). Otomatis mengekstrak nama pengirim asli dari riwayat chat jika terdeteksi.
                  </span>
                </div>
              </div>

              {/* Dialogue Output format & customizable templates */}
              <div className="space-y-4 pt-3 border-t border-white/[0.03]">
                <span className="text-[10px] uppercase font-mono tracking-wider text-amber-500/80 block font-bold">SFT Structure & CoT Customization</span>

                <div className="space-y-1.5">
                  <span className="text-[10px] text-zinc-400 font-mono block">Dialogue Model Layout</span>
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-black/40 border border-white/5 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => setExportOutputFormat('json_cot')}
                      className={`px-2 py-1.5 rounded-xl text-[9px] uppercase font-mono transition-all font-bold cursor-pointer text-center leading-none ${
                        exportOutputFormat === 'json_cot'
                          ? 'bg-amber-500 text-black shadow-sm font-extrabold'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      JSON CoT
                    </button>
                    <button
                      type="button"
                      onClick={() => setExportOutputFormat('raw_text')}
                      className={`px-2 py-1.5 rounded-xl text-[9px] uppercase font-mono transition-all font-bold cursor-pointer text-center leading-none ${
                        exportOutputFormat === 'raw_text'
                          ? 'bg-amber-500 text-black shadow-sm font-extrabold'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Pure Speech
                    </button>
                  </div>
                  <span className="text-[8.5px] text-zinc-500 block leading-tight">
                    {exportOutputFormat === 'json_cot' 
                      ? "Mengekspor dalam format JSON batin dengan nalar thought process, animasi ekspresi, dan mood impact." 
                      : "Mengekspor langsung dialog teks murni VTuber agar dataset universal dan tidak terikat format JSON."}
                  </span>
                </div>

                {exportOutputFormat === 'json_cot' && (
                  <div className="space-y-1.5 animate-fade-in">
                    <span className="text-[10px] text-zinc-400 font-mono block">Thought Prompt Template</span>
                    <textarea
                      rows={3}
                      value={exportThoughtTemplate}
                      onChange={(e) => setExportThoughtTemplate(e.target.value)}
                      placeholder="Custom template: Responding to {sender} regarding '{message}'. {character} is..."
                      className="w-full bg-[#07070a] border border-white/5 rounded-xl p-2.5 text-[10px] text-zinc-300 font-mono focus:outline-none focus:border-amber-500/50 resize-none leading-relaxed"
                    />
                    <span className="text-[8.5px] text-zinc-500 block leading-tight">
                      Template kustom untuk batin asisten. Variabel pendukung: <code>{"{sender}"}</code> (pengirim), <code>{"{character}"}</code> (VTuber), <code>{"{message}"}</code> (pesan), <code>{"{time}"}</code> (jam pesan, e.g. 04:20).
                    </span>
                  </div>
                )}
              </div>

              {/* Regular Expression Overrides Sandbox */}
              <div className="space-y-3 pt-3 border-t border-white/[0.03]">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-amber-500/80 block font-bold">Custom Regex Sandbox</span>
                  <span className="text-[8px] font-mono text-zinc-550">Line-separated regex list</span>
                </div>
                <textarea
                  rows={3}
                  value={exportCustomRegexes}
                  onChange={(e) => setExportCustomRegexes(e.target.value)}
                  placeholder="e.g. /^\\[(.*)\\]\\s*(.*)/"
                  className="w-full bg-[#07070a] border border-white/5 rounded-xl p-2.5 text-[10px] text-zinc-300 font-mono focus:outline-none focus:border-amber-500/50 resize-none leading-relaxed"
                />
                <span className="text-[8.5px] text-zinc-500 block leading-none">
                  Sediakan regex kustom untuk mengekstrak username dari memori batin (Contoh: <code>/^(?:Blaze):\s*(.*)/</code>). Default presets tetap berjalan di latar belakang.
                </span>
              </div>

              {/* Only Synthesized results option */}
              <div className="space-y-3 pt-3 border-t border-white/[0.03]">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 max-w-[80%]">
                    <span className="text-[11px] font-bold text-white block">Hanya Ambil Hasil SFT Sintetis (CRUD)</span>
                    <span className="text-[9px] text-zinc-500 block leading-tight">Batasi eksportir hanya memuat baris hasil transmutasi kognitif batin kustom yang Anda buat atau sintesis di editor (tipe <code className="text-emerald-400 font-bold">airi_synthesized</code>), mengabaikan log aktivitas luring atau teks mentah lainnya.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExportOnlySynthesized(!exportOnlySynthesized)}
                    disabled={isExporting}
                    className="p-1 rounded-xl transition-all cursor-pointer"
                  >
                    {exportOnlySynthesized ? (
                      <CheckCircle2 size={24} className="text-emerald-500" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-white/20 hover:border-white/45 transition-colors" />
                    )}
                  </button>
                </div>
              </div>

              {/* Smart Synthesize toggle */}
              <div className="space-y-3 pt-3 border-t border-white/[0.03]">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 max-w-[80%]">
                    <span className="text-[11px] font-bold text-white block">Smart AI Synthesis (Gemini)</span>
                    <span className="text-[9px] text-zinc-500 block leading-tight">Gunakan model Gemini kognitif untuk memetakan pikiran (thought/CoT) Yui secara dinamis sesuai alur konteks chat.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExportSmartSynthesize(!exportSmartSynthesize)}
                    disabled={isExporting}
                    className="p-1 rounded-xl transition-all cursor-pointer"
                  >
                    {exportSmartSynthesize ? (
                      <CheckCircle2 size={24} className="text-amber-500" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-white/20 hover:border-white/45 transition-colors" />
                    )}
                  </button>
                </div>
                {exportSmartSynthesize && (
                  <div className="bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl flex items-start gap-2.5">
                    <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                    <span className="text-[9px] text-zinc-400 leading-normal"><strong>Pemberitahuan:</strong> Membutuhkan ketersediaan kredit API Gemini server-side karena sistem akan meluncurkan iterasi kognisi di latar belakang.</span>
                  </div>
                )}
              </div>

              {/* System prompt override */}
              <div className="space-y-2 pt-3 border-t border-white/[0.03]">
                <label className="text-[10px] uppercase font-mono tracking-widest text-zinc-450 block font-bold">System Instruction (ChatML format)</label>
                <textarea
                  rows={3}
                  value={exportSystemPrompt}
                  onChange={(e) => setExportSystemPrompt(e.target.value)}
                  disabled={isExporting}
                  placeholder="System prompt yang ditaruh di awal pesan..."
                  className="w-full bg-[#07070a]/80 border border-white/5 rounded-xl p-3 text-[10.5px] text-zinc-300 font-mono focus:outline-none focus:border-amber-500/50 resize-none leading-relaxed"
                />
              </div>

              {/* Action Triggers */}
              <div className="space-y-2 border-t border-white/5 pt-4">
                <button
                  type="button"
                  onClick={handleLaunchExport}
                  disabled={isExporting}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-wider py-3.5 px-4 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(245,158,11,0.2)] hover:shadow-[0_4px_20px_rgba(245,158,11,0.3)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
                >
                  <RefreshCw size={13} className={isExporting ? "animate-spin" : ""} /> Synthesize Activity Dataset
                </button>

                {exportResult && exportResult.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => downloadDataset('json')}
                      className="bg-white/5 hover:bg-white/10 text-white border border-white/5 font-bold text-[10px] uppercase tracking-wider py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Download size={11} /> Download JSON
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadDataset('jsonl')}
                      className="bg-[#d97706]/10 hover:bg-[#d97706]/20 text-amber-500 border border-amber-500/20 font-bold text-[10px] uppercase tracking-wider py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Download size={11} /> Download JSONL
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Export Hasil Preview */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#0e0e14]/55 border border-white/5 p-6 rounded-3xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
                <div className="flex items-center gap-2">
                  <Eye className="text-amber-500" size={16} />
                  <span className="text-sm font-bold text-white tracking-wide">
                    Preview Dataset Model ({exportResult ? filteredExportEntries.length : 0})
                  </span>
                </div>
                {exportResult && exportResult.length > 0 && (
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-2.5 text-zinc-550" size={14} />
                    <input
                      type="text"
                      value={exportSearchQuery}
                      onChange={(e) => {
                        setExportSearchQuery(e.target.value);
                        setExportCurrentPage(1);
                      }}
                      placeholder="Cari obrolan hasil SFT..."
                      className="w-full bg-[#07070a] border border-white/5 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50 font-mono transition-colors"
                    />
                  </div>
                )}
              </div>

              {!exportResult ? (
                <div className="p-16 text-center flex flex-col items-center justify-center gap-4 text-zinc-500">
                  <div className="p-4 bg-white/5 rounded-2xl text-zinc-400">
                    <Brain size={32} className="animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">Draf Dataset Belum Disintesis</h4>
                    <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
                      Klik tombol <strong>Synthesize Activity Dataset</strong> di samping untuk mengonversi riwayat obrolan Anda bersama Yuihime ke format SFT kognitif secara terstruktur.
                    </p>
                  </div>
                </div>
              ) : filteredExportEntries.length === 0 ? (
                <div className="p-12 text-center text-zinc-550 text-xs italic">
                  {exportErrorMessage || "Tidak ditemukan sesi obrolan hasil ekspor yang sesuai filter kata Anda."}
                </div>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                  {displayedExportEntries.map((session: any, sIdx) => {
                    const globalIdx = (exportCurrentPage - 1) * entriesPerPage + sIdx + 1;
                    
                    // Normalize dataset entries dynamically for preview purposes
                    let messagesToRender: any[] = [];
                    if (Array.isArray(session.messages)) {
                      messagesToRender = session.messages;
                    } else if (Array.isArray(session.conversations)) {
                      messagesToRender = session.conversations.map((c: any) => ({
                        role: c.from === 'human' ? 'user' : c.from === 'system' ? 'system' : 'assistant',
                        content: c.value
                      }));
                    } else if (session.instruction !== undefined || session.input !== undefined) {
                      messagesToRender = [];
                      if (session.instruction) messagesToRender.push({ role: 'system', content: session.instruction });
                      if (session.input) messagesToRender.push({ role: 'user', content: session.input });
                      if (session.output) messagesToRender.push({ role: 'assistant', content: session.output });
                    }

                    return (
                      <div key={sIdx} className="bg-black/35 border border-white/5 rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between border-b border-white/[0.03] pb-2 text-[10px] font-mono">
                          <span className="text-amber-500 font-bold uppercase">Sesi Latihan #{globalIdx}</span>
                          <span className="text-zinc-550">{messagesToRender.length} total baris pesan</span>
                        </div>

                        {/* Message bubbles in preview */}
                        <div className="space-y-3 font-mono text-[11px] leading-relaxed select-text">
                          {messagesToRender.map((item: any, mIdx: number) => {
                            if (item.role === 'system') {
                              return (
                                <div key={mIdx} className="p-3 bg-white/5 rounded-xl border border-white/5">
                                  <span className="text-[9px] uppercase font-bold text-zinc-450 block mb-1">⚙️ system Instruction:</span>
                                  <p className="text-zinc-400">{item.content}</p>
                                </div>
                              );
                            }

                            if (item.role === 'user') {
                              return (
                                <div key={mIdx} className="p-3 bg-[#0a0a0f]/40 rounded-xl border border-white/5 text-left">
                                  <span className="text-[9px] uppercase font-bold text-[#f59e0b] block mb-1">💬 user (kakak):</span>
                                  <p className="text-zinc-200">"{item.content}"</p>
                                </div>
                              );
                            }

                            // Assistant cognitive block
                            let parsedObj: any = null;
                            try {
                              parsedObj = JSON.parse(item.content);
                            } catch (_) {}

                            return (
                              <div key={mIdx} className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/10 text-left">
                                <span className="text-[9px] uppercase font-bold text-amber-500 block mb-2">🎀 assistant (yuihime kognitif):</span>
                                {parsedObj ? (
                                  <div className="space-y-2 pl-2 border-l border-amber-500/20 text-[10px]">
                                    <div>
                                      <span className="text-[9px] uppercase text-zinc-500 block"> thought process:</span>
                                      <p className="text-zinc-350 italic">"{parsedObj.thought}"</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <div>
                                        <span className="text-[9px] uppercase text-zinc-500 block"> animations:</span>
                                        <span className="bg-amber-500/15 text-amber-400 px-1.5 py-0.5 rounded font-bold text-[9px]">
                                          {parsedObj.animations?.join(', ') || "SMILE"}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-[9px] uppercase text-zinc-500 block"> mood impact:</span>
                                        <span className="text-zinc-400">
                                          {JSON.stringify(parsedObj.mood_impact || { joy: 1 })}
                                        </span>
                                      </div>
                                    </div>
                                    <div>
                                      <span className="text-[9px] uppercase text-zinc-550 block"> spoken speech:</span>
                                      <p className="text-amber-300 font-bold font-sans text-xs pt-1">
                                        "{parsedObj.tool_calls?.[0]?.args?.speech || parsedObj.speech}"
                                      </p>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-zinc-350">"{item.content}"</p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {exportResult && exportTotalPages > 1 && (
                <div className="flex items-center justify-between mt-4 text-xs font-mono border-t border-white/[0.03] pt-4">
                  <span className="text-zinc-500 text-left">Halaman {exportCurrentPage} dari {exportTotalPages}</span>
                  <div className="flex items-center gap-1.5 justify-end">
                    <button
                      type="button"
                      onClick={() => setExportCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={exportCurrentPage === 1}
                      className="p-1 px-3 bg-white/5 border border-white/5 hover:bg-white/10 rounded-lg text-white disabled:opacity-30 cursor-pointer active:scale-95 transition-all font-bold"
                    >
                      <ChevronLeft size={12} className="inline mr-0.5" /> Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setExportCurrentPage(prev => Math.min(prev + 1, exportTotalPages))}
                      disabled={exportCurrentPage === exportTotalPages}
                      className="p-1 px-3 bg-white/5 border border-white/5 hover:bg-white/10 rounded-lg text-white disabled:opacity-30 cursor-pointer active:scale-95 transition-all font-bold"
                    >
                      Next <ChevronRight size={12} className="inline mr-0.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : activeMode === 'creator' ? (
        // --- SYNAPTIC CREATOR DAEMON SECTION ---
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-fade-in text-left">
          
          {/* LFT: Control panel options & active parsing parameters */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-[#0e0e14]/55 border border-white/5 p-6 rounded-3xl space-y-6">
              <div className="border-b border-white/5 pb-3">
                <span className="text-[10px] uppercase font-mono tracking-widest text-[#d4d4d8]/40 block font-bold mb-1">Cortex Optimizer</span>
                <h3 className="text-sm font-bold text-white">Daemon Control Panel</h3>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center justify-between bg-black/30 border border-white/5 p-4 rounded-2xl">
                <div>
                  <span className="text-[10px] uppercase font-mono text-zinc-550 block">STATUS DAEMON</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`w-2 h-2 rounded-full ${synthState?.status === 'running' ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'}`} />
                    <span className="text-xs font-bold text-white uppercase font-mono">{synthState?.status || "idle"}</span>
                  </div>
                </div>
                <div className="flex gap-1.5 font-bold">
                  {synthState?.status === 'running' ? (
                    <button
                      type="button"
                      onClick={() => handleSynthControl('stop')}
                      className="flex items-center gap-1.5 px-3 py-2 bg-rose-500 text-white hover:bg-rose-600 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg shadow-rose-500/10 active:scale-95"
                    >
                      <Pause size={12} /> Pause
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSynthControl('start')}
                      className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 text-black hover:bg-emerald-450 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg shadow-emerald-500/10 active:scale-95"
                    >
                      <Play size={12} /> Resume
                    </button>
                  )}
                </div>
              </div>

              {/* Delay Throttling */}
              <div className="space-y-2">
                <label className="text-[11px] font-mono font-bold text-zinc-450 uppercase flex justify-between">
                  <span>Jeda Pacing (Pacing Delay)</span>
                  <span className="text-[#ef4444]">{synthConfig?.intervalSeconds || 15} Detik</span>
                </label>
                <div className="grid grid-cols-4 gap-1.5 bg-[#07070a] p-1 rounded-xl border border-white/5">
                  {[5, 10, 15, 30].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => saveSynthConfig({ intervalSeconds: sec })}
                      className={`py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                        synthConfig?.intervalSeconds === sec
                          ? 'bg-[#ef4444] text-white shadow-md'
                          : 'text-zinc-500 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-zinc-500 leading-relaxed font-normal">
                  Anti-Quota Exhaustion: Semburan jeda tinggi sangat direkomendasikan pada akun penyedia gratis untuk menghindari RPM limits.
                </p>
              </div>

              {/* Retry Tolerance */}
              <div className="space-y-2">
                <label className="text-[11px] font-mono font-bold text-zinc-450 uppercase flex justify-between">
                  <span>Toleransi Kegagalan (Retries)</span>
                  <span className="text-white">{synthConfig?.maxRetries || 3}x</span>
                </label>
                <div className="grid grid-cols-4 gap-1.5 bg-[#07070a] p-1 rounded-xl border border-white/5">
                  {[1, 2, 3, 5].map((tries) => (
                    <button
                      key={tries}
                      type="button"
                      onClick={() => saveSynthConfig({ maxRetries: tries })}
                      className={`py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                        synthConfig?.maxRetries === tries
                          ? 'bg-zinc-700 text-white'
                          : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                      }`}
                    >
                      {tries}x
                    </button>
                  ))}
                </div>
              </div>

              {/* LLM Provider Selection */}
              <div className="space-y-2">
                <label className="text-[11px] font-mono font-bold text-zinc-450 uppercase flex justify-between">
                  <span>Penyedia AI (LLM Provider)</span>
                </label>
                <div className="relative">
                  <select
                    value={synthConfig?.provider || "gemini"}
                    onChange={(e) => saveSynthConfig({ provider: e.target.value })}
                    className="w-full bg-[#050508] border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-200 outline-none focus:border-[#ef4444] cursor-pointer transition-all appearance-none pr-8"
                  >
                    <option value="gemini">Google Gemini</option>
                    <option value="openai">OpenAI / Compatible</option>
                    <option value="anthropic">Anthropic Claude</option>
                    <option value="openrouter">OpenRouter AI</option>
                    <option value="deepseek">DeepSeek AI</option>
                    <option value="groq">Groq Engine</option>
                    <option value="ollama">Local Ollama</option>
                    <option value="puter-neural-provider">Puter Cloud Provider</option>
                    <option value="custom">Custom Provider</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-zinc-500">
                    <ChevronDown size={12} />
                  </div>
                </div>
              </div>

              {/* LLM Model Input */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[11px] font-mono font-bold text-zinc-450 uppercase mb-1 select-none">
                  <span>Model AI (LLM Model)</span>
                  <button
                    type="button"
                    onClick={() => setUseCustomModelInput(!useCustomModelInput)}
                    className="text-[8px] font-sans text-amber-500 hover:text-amber-400 bg-white/5 border border-white/5 px-2 py-0.5 rounded transition-all cursor-pointer font-bold uppercase tracking-wider"
                  >
                    {useCustomModelInput ? 'Gunakan Daftar' : 'Ketik Manual'}
                  </button>
                </div>
                {useCustomModelInput ? (
                  <input
                    type="text"
                    value={synthConfig?.model || ""}
                    onChange={(e) => setSynthConfig(prev => prev ? { ...prev, model: e.target.value } : null)}
                    onBlur={() => saveSynthConfig({ model: synthConfig?.model })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        saveSynthConfig({ model: synthConfig?.model });
                      }
                    }}
                    placeholder="Ketik nama model... (e.g. gemini-2.5-flash)"
                    className="w-full bg-[#050508] border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-200 font-mono focus:border-[#ef4444] focus:ring-1 focus:ring-[#ef4444] outline-none transition-all placeholder-zinc-600"
                  />
                ) : (
                  <SearchableSelect
                    value={synthConfig?.model || ""}
                    onChange={(val) => {
                      setSynthConfig(prev => prev ? { ...prev, model: val } : null);
                      saveSynthConfig({ model: val });
                    }}
                    options={availableModels}
                    placeholder={
                      isFetchingModels
                        ? "Mengambil daftar model..."
                        : (availableModels.length > 0 ? "Pilih model AI..." : "Tidak ada model ditemukan untuk provider ini")
                    }
                    disabled={isFetchingModels}
                    className="w-full"
                  />
                )}
              </div>

              {/* Reset & Retry Control */}
              <div className="pt-2 border-t border-white/5 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Apakah Anda yakin ingin memindahkan seluruh antrean Retry & Fail ke barisan pending raw utama agar diproses ulang segera?")) {
                      handleSynthControl('retry_pool');
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 hover:text-amber-400 border border-amber-500/20 rounded-xl text-xs font-mono font-bold cursor-pointer transition-all active:scale-98"
                >
                  <RefreshCw size={12} className="animate-spin-reverse" /> RETRY ALL FAILURES
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Apakah Anda yakin ingin mengatur ulang hasil sintesis? Seluruh data bertipe Synthesized & Retry akan dikembalikan menjadi raw (pending).")) {
                      handleSynthControl('reset');
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 text-rose-400 hover:text-rose-300 border border-rose-500/10 hover:border-rose-500/20 rounded-xl text-xs font-mono font-bold cursor-pointer transition-all active:scale-98"
                >
                  <RefreshCw size={12} /> RESET ALL PROGRESS
                </button>
              </div>
            </div>
          </div>

          {/* MID: Metrics & Custom Prompt Editor */}
          <div className="lg:col-span-1 space-y-6">
            {/* Real-time stats */}
            <div className="bg-[#0e0e14]/55 border border-white/5 p-6 rounded-3xl space-y-4">
              <div className="border-b border-white/5 pb-3">
                <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-550 block font-bold mb-1">Metrics Analytics</span>
                <h3 className="text-sm font-bold text-white font-mono">Transmutation Pipeline</h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/25 border border-white/5 p-3 rounded-2xl text-left">
                  <span className="text-[9px] uppercase font-mono tracking-wider text-zinc-500">Synthesized (SFT Ready)</span>
                  <div className="text-xl font-black text-emerald-400 mt-1">{synthState?.synthesized || 0} items</div>
                </div>
                <div className="bg-black/25 border border-white/5 p-3 rounded-2xl text-left">
                  <span className="text-[9px] uppercase font-mono tracking-wider text-zinc-500">Pending (Raw)</span>
                  <div className="text-xl font-black text-white mt-1">{synthState?.pending || 0} items</div>
                </div>
                <div className="bg-black/25 border border-white/5 p-3 rounded-2xl text-left">
                  <span className="text-[9px] uppercase font-mono tracking-wider text-zinc-500">Retry Pool</span>
                  <div className="text-xl font-black text-amber-500 mt-1">{synthState?.retryCount || 0} items</div>
                </div>
                <div className="bg-black/25 border border-white/5 p-3 rounded-2xl text-left">
                  <span className="text-[9px] uppercase font-mono tracking-wider text-zinc-500">Total Entries</span>
                  <div className="text-xl font-black text-cyan-400 mt-1">{synthState?.totalRaw || 0} items</div>
                </div>
              </div>
            </div>

            {/* Custom Prompt Textarea */}
            <div className="bg-[#0e0e14]/55 border border-white/5 p-6 rounded-3xl space-y-4 text-left">
              <div className="border-b border-white/5 pb-2">
                <span className="text-[10px] uppercase font-mono tracking-widest text-[#d4d4d8]/40 block font-bold mb-1">PROMPT TUNING</span>
                <h3 className="text-sm font-bold text-white flex justify-between items-center font-mono">
                  <span>Synthesis Master Prompt</span>
                  {isSynthSaving && <span className="text-[10px] text-emerald-400 font-mono animate-pulse">Saving...</span>}
                </h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-zinc-550">VARIABLE PLACEHOLDERS</span>
                    <span className="text-zinc-400 font-bold">{"{user_query}"} & {"{target_speech}"}</span>
                  </div>
                  <textarea
                    rows={8}
                    value={synthConfig?.systemPrompt || ""}
                    onChange={(e) => setSynthConfig(prev => prev ? { ...prev, systemPrompt: e.target.value } : null)}
                    className="w-full bg-[#050508] border border-white/10 rounded-2xl p-4 font-mono text-[10.5px] text-zinc-200 leading-relaxed focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none resize-none"
                    placeholder="Masukkan custom prompt sintesis COGNITIVE CORTEX di sini..."
                  />
                </div>

                <button
                  type="button"
                  onClick={() => saveSynthConfig({ systemPrompt: synthConfig?.systemPrompt })}
                  disabled={isSynthSaving}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#ef4444] hover:bg-rose-600 text-white rounded-xl text-xs font-bold cursor-pointer transition-all disabled:opacity-50 font-mono"
                >
                  <Save size={13} /> SAVE CONFIGURATION
                </button>
              </div>
            </div>
          </div>

          {/* RGT: Diagnostics Live Monitoring Log Console */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-[#0e0e14]/55 border border-white/5 p-6 rounded-3xl space-y-4 flex flex-col h-[520px]">
              <div className="border-b border-white/5 pb-3">
                <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-550 block font-bold mb-1">Transmutation Terminal</span>
                <h3 className="text-sm font-bold text-white flex justify-between items-center">
                  <span>Diagnostics Console</span>
                  {synthState?.status === 'running' && (
                    <span className="flex items-center gap-1.5 text-[9px] font-mono text-emerald-400 border border-emerald-500/20 bg-emerald-500/5 px-2 py-0.5 rounded-full select-none">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> LIVE STREAMING
                    </span>
                  )}
                </h3>
              </div>

              {/* Logger display */}
              <div className="flex-1 bg-black/40 border border-white/5 p-4 rounded-2xl overflow-y-auto space-y-2 font-mono text-[10.5px] leading-6 max-h-[410px] scrollbar-hide text-zinc-400 select-text">
                {synthLogs.length === 0 ? (
                  <div className="text-zinc-650 italic text-center py-12">Belum ada logs transmisi batin yang termonitor.</div>
                ) : (
                  synthLogs.map((logLine, idx) => (
                    <div key={idx} className={`p-1.5 rounded transition-all ${
                      logLine.includes('SUCCESS') ? 'text-emerald-400 bg-emerald-500/5 border-l-2 border-emerald-500/25 pl-2' :
                      logLine.includes('ERROR') ? 'text-rose-450 bg-rose-500/5 border-l-2 border-rose-500/25 pl-2' :
                      logLine.includes('STEP') ? 'text-cyan-350' : 'text-zinc-400'
                    }`}>
                      {logLine}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      ) : (
        // --- SFT RESULTS EDITOR SECTION (CRUD) ---
        <div className="space-y-6 animate-fade-in text-left">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-[#0e0e14]/55 border border-white/5 p-4 rounded-3xl">
            {/* Search */}
            <div className="relative w-full sm:max-w-md">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Cari hasil SFT berdasarkan User Query, Speech, atau Thought..."
                value={crudSearch}
                onChange={(e) => {
                  setCrudSearch(e.target.value);
                  setCrudCurrentPage(1);
                }}
                className="w-full bg-[#07070a]/80 border border-white/5 rounded-2xl pl-11 pr-4 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 font-bold">
              <button
                type="button"
                onClick={fetchCrudRecords}
                disabled={isCrudLoading}
                className="p-2.5 bg-white/5 border border-white/5 hover:bg-white/10 text-white rounded-xl transition-all cursor-pointer disabled:opacity-50"
                title="Segarkan data"
              >
                <RefreshCw size={14} className={isCrudLoading ? "animate-spin" : ""} />
              </button>
              <button
                type="button"
                onClick={startCreateRecord}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_4px_12px_rgba(16,185,129,0.2)] hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <Plus size={14} /> Tambah Data SFT Baru
              </button>
            </div>
          </div>

          {/* Records Display list */}
          {isCrudLoading && crudRecords.length === 0 ? (
            <div className="text-center py-20 bg-black/20 rounded-3xl border border-white/[0.03]">
              <Cpu size={24} className="mx-auto text-emerald-400 animate-spin mb-3" />
              <p className="text-zinc-500 text-xs font-mono">Memuat database SFT Yuihime...</p>
            </div>
          ) : crudError ? (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-6 rounded-3xl text-center space-y-2">
              <AlertTriangle size={24} className="mx-auto" />
              <h4 className="font-bold text-sm">Gagal Sinkronisasi Database SFT</h4>
              <p className="text-xs text-zinc-400 shrink-0">{crudError}</p>
            </div>
          ) : (
            (() => {
              const query = crudSearch.toLowerCase().trim();
              const filtered = crudRecords.filter(rec => {
                const q = rec.userQuery?.toLowerCase() || "";
                const s = rec.targetSpeech?.toLowerCase() || "";
                const t = rec.synthesized?.thought?.toLowerCase() || "";
                return q.includes(query) || s.includes(query) || t.includes(query);
              });

              if (filtered.length === 0) {
                return (
                  <div className="text-center py-20 bg-[#07070a]/40 rounded-3xl border border-dashed border-white/10">
                    <Database size={24} className="mx-auto text-zinc-650 mb-3" />
                    <h4 className="text-white font-bold text-sm">Tidak Ada Dataset SFT Terdeteksi</h4>
                    <p className="text-zinc-500 text-xs max-w-sm mx-auto mt-1 leading-relaxed font-sans">
                      {crudSearch 
                        ? "Penyaringan kata kunci tidak mencocokkan baris data SFT mana pun pada klaster memori batin."
                        : "Gunakan 'Synaptic Creator Daemon' untuk melahirkan data pelatihan, atau tambahkan secara manual melalui tombol di atas."
                      }
                    </p>
                  </div>
                );
              }

              // Pagination Calculations
              const crudEntriesPerPage = 10;
              const totalCrudPages = Math.ceil(filtered.length / crudEntriesPerPage);
              const activeCrudPage = Math.min(crudCurrentPage, Math.max(1, totalCrudPages));
              const displayedCrudEntries = filtered.slice((activeCrudPage - 1) * crudEntriesPerPage, activeCrudPage * crudEntriesPerPage);

              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {displayedCrudEntries.map((rec) => (
                      <div 
                        key={rec.id} 
                        className="bg-[#0e0e14]/55 border border-white/5 p-5 rounded-3xl space-y-4 hover:border-emerald-500/25 transition-all group flex flex-col justify-between"
                      >
                        <div className="space-y-3.5">
                          {/* Title Row */}
                          <div className="flex items-start justify-between gap-4">
                            <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 px-2.5 py-1 rounded-lg">
                              id: {rec.id}
                            </span>
                            <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => {
                                  setViewingRawRecord(rec);
                                  setRawTab('database');
                                }}
                                className="px-2 py-1 bg-white/5 border border-white/5 hover:bg-zinc-800 hover:text-amber-400 text-zinc-400 text-[9.5px] font-bold font-sans rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                                title="Tampilkan Struktur JSON Mentah"
                              >
                                <Eye size={11} className="text-zinc-500" /> <span className="hidden sm:inline">Raw JSON</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => startEditRecord(rec)}
                                className="p-1.5 hover:bg-emerald-500/10 hover:text-emerald-400 text-zinc-400 rounded-lg transition-all cursor-pointer"
                                title="Sunting data SFT"
                              >
                                <Edit3 size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteRecord(rec.id)}
                                className="p-1.5 hover:bg-rose-500/10 hover:text-rose-450 text-zinc-400 rounded-lg transition-all cursor-pointer"
                                title="Hapus data SFT secara permanen"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>

                          {/* Dialogue Columns */}
                          <div className="space-y-2.5 font-sans text-xs">
                            {/* User Query */}
                            <div className="p-3 bg-white/[0.01] border border-white/[0.03] rounded-2xl">
                              <span className="text-[8px] uppercase tracking-wider font-bold text-zinc-500 block mb-1">💬 user request:</span>
                              <p className="text-zinc-350 font-medium font-mono leading-relaxed select-text">{rec.userQuery}</p>
                            </div>

                            {/* Thought Process */}
                            {rec.synthesized?.thought && (
                              <div className="p-3 bg-white/[0.01] border border-white/[0.03] rounded-2xl border-l-[3px] border-l-amber-500/30">
                                <span className="text-[8px] uppercase tracking-wider font-bold text-amber-500/70 block mb-1">🧠 thought process (cot):</span>
                                <p className="text-zinc-400 italic font-medium leading-relaxed select-text">"{rec.synthesized.thought}"</p>
                              </div>
                            )}

                            {/* Spoken Speech Response */}
                            <div className="p-3 bg-emerald-500/[0.02] border border-emerald-500/5 rounded-2xl border-l-[3px] border-l-emerald-500/30">
                              <span className="text-[8px] uppercase tracking-wider font-bold text-emerald-450 block mb-1">🎀 yui spoken speech:</span>
                              <p className="text-emerald-350 font-bold leading-relaxed select-text">"{rec.targetSpeech}"</p>
                            </div>
                          </div>
                        </div>

                        {/* Metadata Row */}
                        <div className="pt-3 border-t border-white/[0.03] mt-2 flex flex-wrap gap-x-4 gap-y-2 items-center justify-between text-[10px] font-mono">
                          <div className="flex items-center gap-1.5">
                            <span className="text-zinc-500 font-sans">Anim:</span>
                            <span className="bg-[#10b981]/10 text-emerald-400 border border-emerald-500/10 px-1.5 py-0.5 rounded text-[8.5px] font-bold">
                              {rec.synthesized?.animations?.join(', ') || "SMILE"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-500 font-sans">Impact:</span>
                            <span className="text-zinc-400 text-[9px]">
                              {JSON.stringify(rec.synthesized?.mood_impact || { joy: 1 })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination controls for SFT CRUD */}
                  {totalCrudPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5 text-xs font-mono">
                      <span className="text-zinc-450">Halaman {activeCrudPage} dari {totalCrudPages} (Total {filtered.length} baris)</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setCrudCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={activeCrudPage === 1}
                          className="p-1 px-3 bg-white/5 border border-white/5 hover:bg-white/10 rounded-lg text-white disabled:opacity-30 cursor-pointer active:scale-95 transition-all font-bold flex items-center"
                        >
                          <ChevronLeft size={12} className="inline mr-0.5" /> Back
                        </button>
                        <button
                          type="button"
                          onClick={() => setCrudCurrentPage(prev => Math.min(prev + 1, totalCrudPages))}
                          disabled={activeCrudPage === totalCrudPages}
                          className="p-1 px-3 bg-[#10b981]/15 border border-[#10b981]/25 hover:bg-[#10b981]/25 text-emerald-400 disabled:opacity-30 cursor-pointer active:scale-95 transition-all font-bold flex items-center"
                        >
                          Next <ChevronRight size={12} className="inline ml-0.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()
          )}

          {/* Form Modal (Overlay Backdrop) */}
          <AnimatePresence>
            {(isCreatingNew || !!editingRecord) && (
              <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto select-none">
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 15, scale: 0.98 }}
                  className="bg-[#09090e] border border-neutral-800 w-full max-w-2xl rounded-3xl shadow-[0_0_80px_rgba(16,185,129,0.08)] flex flex-col p-6 max-h-[90vh] overflow-hidden text-left font-sans text-zinc-300"
                >
                  {/* Title Bar */}
                  <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-4 select-none">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
                        <Edit3 size={16} />
                      </div>
                      <div>
                        <h4 className="text-[10px] uppercase font-mono text-zinc-500">SFT Synaptic Repository</h4>
                        <h3 className="text-md font-bold text-white">
                          {editingRecord ? `Edit Record SFT (${editingRecord.id})` : "Tambah Record SFT Manual"}
                        </h3>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingRecord(null);
                        setIsCreatingNew(false);
                      }}
                      className="p-1 rounded-lg hover:bg-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Form Inside Scrollable Zone */}
                  <form onSubmit={handleSaveRecord} className="flex-1 overflow-y-auto pr-1 space-y-4 scrollbar-hide select-text">
                    {/* User Request */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-zinc-400 flex items-center gap-1.5">
                        <span>💬 User Request / Query</span>
                        <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        required
                        rows={2}
                        placeholder="Masukkan kueri yang diajukan oleh Pengguna..."
                        value={formUserQuery}
                        onChange={(e) => setFormUserQuery(e.target.value)}
                        className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-xs text-zinc-250 font-mono focus:outline-none focus:border-emerald-500/50 resize-none leading-relaxed"
                      />
                    </div>

                    {/* Spoken Speech Reply */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-emerald-400 flex items-center gap-1.5">
                        <span>🎀 Yui Spoken Speech Reply</span>
                        <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        required
                        rows={3}
                        placeholder="Masukkan ucapan manis asisten kognitif Yuihime..."
                        value={formTargetSpeech}
                        onChange={(e) => setFormTargetSpeech(e.target.value)}
                        className="w-full bg-black/40 border border-emerald-500/5 rounded-xl p-3 text-xs text-emerald-300 font-sans focus:outline-none focus:border-emerald-500/50 resize-none leading-relaxed font-semibold"
                      />
                    </div>

                    {/* Thought Process */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-amber-500/80 block">
                        🧠 Thought Process / Chain-of-Thought (CoT)
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Masukkan monolog batin, analisis ekspresi visual, emosi, atau penalaran kognitif Yuihime sebelum berbicara..."
                        value={formThought}
                        onChange={(e) => setFormThought(e.target.value)}
                        className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-xs text-[#f59e0b] font-mono focus:outline-none focus:border-emerald-500/50 resize-none leading-relaxed"
                      />
                    </div>

                    {/* Picker: Facial Animations */}
                    <div className="space-y-2">
                      <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-zinc-400 block select-none">
                        🎭 Ekspresi Animasi Wajah Yuihime
                      </span>
                      <div className="flex flex-wrap gap-1.5 select-none">
                        {['SMILE', 'BLUSH', 'SAD', 'ANGRY', 'WINK', 'DOUBT', 'SHY', 'NORMAL', 'HAPPY', 'SURPRISED'].map((anim) => {
                          const isSelected = formAnimations.includes(anim);
                          return (
                            <button
                              key={anim}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setFormAnimations(prev => prev.filter(a => a !== anim));
                                } else {
                                  setFormAnimations(prev => [...prev, anim]);
                                }
                              }}
                              className={`px-3 py-1.5 rounded-xl text-[9px] uppercase font-mono font-bold border transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-extrabold'
                                  : 'bg-black/20 border-white/5 text-zinc-500 hover:text-white hover:border-white/10'
                              }`}
                            >
                              {anim}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Sliders: Mood Impact Indices */}
                    <div className="space-y-3 pt-2">
                      <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-zinc-400 block select-none">
                        📈 Bobot Dampak Emosi (Mood Impact)
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 bg-black/30 border border-white/5 p-4 rounded-2xl select-none">
                        {/* Joy */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[10px] font-mono">
                            <span className="text-zinc-550">Joy</span>
                            <span className="text-emerald-400 font-bold">{formJoy}</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="5"
                            value={formJoy}
                            onChange={(e) => setFormJoy(Number(e.target.value))}
                            className="w-full accent-emerald-500 h-1 bg-white/5 rounded-lg cursor-pointer"
                          />
                        </div>

                        {/* Affection */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[10px] font-mono">
                            <span className="text-zinc-550">Affection</span>
                            <span className="text-emerald-400 font-bold">{formAffection}</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="5"
                            value={formAffection}
                            onChange={(e) => setFormAffection(Number(e.target.value))}
                            className="w-full accent-emerald-500 h-1 bg-white/5 rounded-lg cursor-pointer"
                          />
                        </div>

                        {/* Sadness */}
                        <div className="flex flex-col space-y-1">
                          <div className="flex justify-between items-center text-[10px] font-mono">
                            <span className="text-zinc-550">Sadness</span>
                            <span className="text-rose-400 font-bold">{formSadness}</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="5"
                            value={formSadness}
                            onChange={(e) => setFormSadness(Number(e.target.value))}
                            className="w-full accent-rose-500 h-1 bg-white/5 rounded-lg cursor-pointer"
                          />
                        </div>

                        {/* Anger */}
                        <div className="flex flex-col space-y-1">
                          <div className="flex justify-between items-center text-[10px] font-mono">
                            <span className="text-zinc-550">Anger</span>
                            <span className="text-rose-450 font-bold">{formAnger}</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="5"
                            value={formAnger}
                            onChange={(e) => setFormAnger(Number(e.target.value))}
                            className="w-full accent-rose-500 h-1 bg-white/5 rounded-lg cursor-pointer"
                          />
                        </div>

                        {/* Shyness */}
                        <div className="flex flex-col space-y-1">
                          <div className="flex justify-between items-center text-[10px] font-mono">
                            <span className="text-zinc-550">Shyness</span>
                            <span className="text-purple-400 font-bold">{formShyness}</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="5"
                            value={formShyness}
                            onChange={(e) => setFormShyness(Number(e.target.value))}
                            className="w-full accent-purple-500 h-1 bg-white/5 rounded-lg cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bottom sticky modal controls */}
                    <div className="pt-4 border-t border-white/5 flex items-center justify-end gap-2.5 select-none">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingRecord(null);
                          setIsCreatingNew(false);
                        }}
                        disabled={formIsSaving}
                        className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-all border border-white/5 cursor-pointer disabled:opacity-50"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={formIsSaving}
                        className="flex items-center gap-1.5 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-450 text-black rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer shadow-[0_4px_12px_rgba(16,185,129,0.2)] disabled:opacity-50 font-sans"
                      >
                        {formIsSaving ? "Menyimpan..." : "Simpan SFT"}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Exporting Diagnostics Log Console Overlay modal */}
      <AnimatePresence>
        {isExporting && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#07070a] border border-amber-500/30 w-full max-w-lg p-6 rounded-3xl space-y-4 shadow-[0_0_50px_rgba(245,158,11,0.15)] flex flex-col max-h-[85vh] text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-500 border border-amber-500/20">
                  <Terminal size={18} className="animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs uppercase font-mono text-zinc-500">Neuromorphic Operations</h4>
                  <h3 className="text-md font-extrabold text-white">Synthesizing Dataset In Progress...</h3>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-right bg-amber-500 transition-all duration-300 rounded-full" 
                    style={{ width: `${exportProgress}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-zinc-550">
                  <span>TRANS-CORE FLUX CHANNEL: SYNTHESIZING</span>
                  <span>{exportProgress}%</span>
                </div>
              </div>

              {/* Diagnostics terminal logs area */}
              <div className="bg-[#050508] border border-white/5 p-4 rounded-2xl flex-1 overflow-y-auto space-y-1.5 font-mono text-[10px] leading-relaxed max-h-[250px] scrollbar-hide text-zinc-400 select-text">
                {exportLogs.map((line, idx) => (
                  <div key={idx} className={`${line.includes('🛑') ? 'text-rose-400' : line.includes('SUCCESS') || line.includes('Sukses') ? 'text-emerald-400' : 'text-zinc-400'}`}>
                    {line}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Seeding Diagnostics Log Console Overlay modal */}
      <AnimatePresence>
        {isSeeding && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#07070a] border border-amber-500/30 w-full max-w-lg p-6 rounded-3xl space-y-4 shadow-[0_0_50px_rgba(245,158,11,0.15)] flex flex-col max-h-[85vh]"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-500 border border-amber-500/20">
                  <Terminal size={18} className="animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs uppercase font-mono text-zinc-500">Neuromorphic Operations</h4>
                  <h3 className="text-md font-extrabold text-white">Quantum Seeding In Progress...</h3>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-right bg-amber-500 transition-all duration-300 rounded-full" 
                    style={{ width: `${seedingProgress}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-zinc-550">
                  <span>TRANS-CORE FLUX CHANNEL: SYNCING</span>
                  <span>{seedingProgress}%</span>
                </div>
              </div>

              {/* Diagnostics terminal logs area */}
              <div className="bg-[#050508] border border-white/5 p-4 rounded-2xl flex-1 overflow-y-auto space-y-1.5 font-mono text-[10px] leading-relaxed max-h-[250px] scrollbar-hide text-zinc-400 select-text">
                {seedingLog.map((line, idx) => (
                  <div key={idx} className={`${line.includes('🛑') ? 'text-rose-400' : line.includes('SUCCESS') || line.includes('Sukses') ? 'text-emerald-400' : 'text-zinc-400'}`}>
                    {line}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Final Seeding Summary Overlay Result modal */}
      <AnimatePresence>
        {seedResult && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0a0a0f] border border-white/5 w-full max-w-sm p-6 rounded-3xl space-y-4 shadow-2xl text-center"
            >
              {seedResult.success ? (
                <>
                  <div className="mx-auto w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mb-1">
                    <CheckCircle2 size={24} />
                  </div>
                  <h3 className="text-md font-bold text-white text-center">Seeding Berhasil Sempurna!</h3>
                  <p className="text-zinc-400 text-xs leading-relaxed font-sans px-2">
                    Dataset pelatihan Airi telah diinjeksikan natively dan diintegrasikan seutuhnya ke dalam kognitif batin Yuihime.
                  </p>

                  <div className="bg-black/40 border border-white/5 p-4 rounded-2xl text-left space-y-2 font-mono text-xs">
                    <div className="flex justify-between items-center pb-2 border-b border-white/[0.03]">
                      <span className="text-zinc-500 font-sans">System 1 (Episodic Cache)</span>
                      <span className="text-emerald-400 font-bold">+{seedResult.system1Count || 0} items</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500 font-sans">System 2 (RAG Memories)</span>
                      <span className="text-cyan-400 font-bold">+{seedResult.system2Count || 0} items</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSeedResult(null);
                      setStagedEntries([]);
                      setFileDetails(null);
                    }}
                    className="w-full bg-emerald-500 hover:bg-emerald-450 text-black font-extrabold text-xs uppercase py-3 rounded-xl cursor-pointer transition-all hover:scale-[1.02] active:scale-100"
                  >
                    Mantap, Yui!
                  </button>
                </>
              ) : (
                <>
                  <div className="mx-auto w-12 h-12 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mb-1">
                    <AlertTriangle size={24} />
                  </div>
                  <h3 className="text-md font-bold text-white text-center">Gagal Melakukan Seeding</h3>
                  <p className="text-zinc-400 text-xs leading-relaxed font-sans px-2">
                    Dua sirkuit tidak sejalan. Terdeteksi gangguan transmisi pada kernel database batin.
                  </p>
                  <p className="text-rose-400 font-mono text-[10px] bg-rose-500/5 p-3 rounded-xl border border-rose-500/10 overflow-x-auto truncate text-left max-w-full">
                    {seedResult.message}
                  </p>

                  <button
                    type="button"
                    onClick={() => setSeedResult(null)}
                    className="w-full bg-rose-500 hover:bg-rose-450 text-white font-extrabold text-xs uppercase py-3 rounded-xl cursor-pointer transition-all"
                  >
                    Coba Lagi
                  </button>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Raw JSON Modal */}
      <AnimatePresence>
        {viewingRawRecord && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.98 }}
              className="bg-[#09090e] border border-neutral-800 w-full max-w-2xl rounded-3xl shadow-[0_0_80px_rgba(245,158,11,0.08)] flex flex-col p-6 max-h-[90vh] overflow-hidden text-left"
            >
              {/* Header */}
              <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-4 select-none">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500 border border-amber-500/20 animate-pulse">
                    <Eye size={16} />
                  </div>
                  <div>
                    <h4 className="text-[10px] uppercase font-mono text-zinc-500">Struktur Formasi Data</h4>
                    <h3 className="text-md font-bold text-white">Inspektur Raw JSON SFT</h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingRawRecord(null)}
                  className="p-1 rounded-lg hover:bg-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Tab Switcher */}
              <div className="flex bg-[#050508] p-1 rounded-xl border border-white/5 gap-1 w-full text-xs font-bold mb-4 font-sans select-none">
                <button
                  type="button"
                  onClick={() => setRawTab('database')}
                  className={`flex-1 py-2 rounded-lg transition-all text-center cursor-pointer ${
                    rawTab === 'database'
                      ? 'bg-amber-500 text-black shadow-md'
                      : 'text-zinc-550 hover:text-zinc-300'
                  }`}
                >
                  1. DB Storage Layout
                </button>
                <button
                  type="button"
                  onClick={() => setRawTab('chatml')}
                  className={`flex-1 py-2 rounded-lg transition-all text-center cursor-pointer ${
                    rawTab === 'chatml'
                      ? 'bg-amber-500 text-black shadow-md'
                      : 'text-zinc-550 hover:text-zinc-300'
                  }`}
                >
                  2. OpenAI / ChatML Format
                </button>
              </div>

              {/* View Area */}
              <div className="flex-1 overflow-y-auto bg-black/55 border border-white/5 rounded-2xl p-4 font-mono text-[10px] text-zinc-300 leading-normal select-text space-y-4">
                {(() => {
                  let jsonString = "";
                  if (rawTab === 'database') {
                    const dbObj = {
                      id: viewingRawRecord.id,
                      userQuery: viewingRawRecord.userQuery,
                      targetSpeech: viewingRawRecord.targetSpeech,
                      synthesized: viewingRawRecord.synthesized
                    };
                    jsonString = JSON.stringify(dbObj, null, 2);
                  } else {
                    // Assemble OpenAI format row
                    const sysPrompt = "You are Yuihime, a protective companion digital soul running on Perfect Giftia OS. Output strictly valid JSON.";
                    
                    let asstContent = "";
                    if (typeof viewingRawRecord.synthesized === 'string') {
                      asstContent = viewingRawRecord.synthesized;
                    } else {
                      asstContent = JSON.stringify(viewingRawRecord.synthesized, null, 2);
                    }

                    const chatMLObj = {
                      messages: [
                        {
                          role: "system",
                          content: sysPrompt
                        },
                        {
                          role: "user",
                          content: viewingRawRecord.userQuery
                        },
                        {
                          role: "assistant",
                          content: asstContent
                        }
                      ]
                    };
                    jsonString = JSON.stringify(chatMLObj, null, 2);
                  }

                  return (
                    <div className="relative">
                      {/* Copy Helper */}
                      <div className="absolute right-2 top-2 z-10 select-none">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(jsonString);
                            alert("Berhasil disalin ke papan klip!");
                          }}
                          className="px-3 py-1.5 bg-white/5 border border-white/5 hover:bg-neutral-800 text-white rounded-lg text-[9px] font-bold font-sans transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Check size={10} /> Salin JSON
                        </button>
                      </div>
                      <pre className="whitespace-pre-wrap break-all pr-4">{jsonString}</pre>
                    </div>
                  );
                })()}
              </div>

              {/* Footnote */}
              <div className="mt-4 pt-3 border-t border-white/5 text-[9.5px] text-zinc-500 select-none font-sans flex items-start gap-2">
                <HelpCircle size={12} className="shrink-0 mt-0.5" />
                <span>
                  {rawTab === 'database' 
                    ? "Ini adalah format representasi murni yang disimpan dalam tabel memories SQLite batin. Kolom 'content' memuat blob text JSON ini agar batin Yuihime dapat memicu bypass visual instan." 
                    : "Ini adalah format standar SFT OpenAI ChatML hasil kompilasi akhir saat Anda melakukan ekspor di Tab 'Synthesizer & Exporter'. Format ini siap diumpankan ke platform fine-tuning (seperti Autotrain, Unsloth, LLaMA-Factory)."
                  }
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
