import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal as TerminalIcon, 
  FileCode, 
  Folder, 
  File, 
  Trash2, 
  RefreshCw, 
  Plus, 
  FolderPlus,
  Play, 
  Save, 
  Eye, 
  Cpu, 
  SquareTerminal,
  Moon,
  Database,
  Search,
  BookOpen,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';
import { StorageService } from '../drivers/storage';
import { motion, AnimatePresence } from 'motion/react';

export const SandboxTab: React.FC = () => {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [command, setCommand] = useState('');
  const [terminalOutput, setTerminalOutput] = useState<Array<{ text: string; type: 'cmd' | 'stdout' | 'stderr' | 'system' }>>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [activeEditorTab, setActiveEditorTab] = useState<'editor' | 'preview'>('editor');
  const [terminalTheme, setTerminalTheme] = useState<'amber' | 'emerald' | 'crystal'>('emerald');
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const terminalInputRef = useRef<HTMLInputElement>(null);

  const [alwaysApproveSession, setAlwaysApproveSession] = useState<boolean>(false);
  const [pendingConfirm, setPendingConfirm] = useState<{
    action: 'write' | 'delete';
    path: string;
    content?: string;
    onApprove: (always: boolean) => void;
    onCancel: () => void;
  } | null>(null);

  // Load file tree inside sandbox path
  const loadFiles = async () => {
    setLoading(true);
    const res = await StorageService.sandboxFile('list', currentPath);
    if (res.files) {
      // Sort: folders first, then files
      const sorted = [...res.files].sort((a, b) => {
        if (a.isDir && !b.isDir) return -1;
        if (!a.isDir && b.isDir) return 1;
        return a.name.localeCompare(b.name);
      });
      setFiles(sorted);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadFiles();
  }, [currentPath]);

  // Command history handling
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  useEffect(() => {
    scrollToBottom();
  }, [terminalOutput]);

  const scrollToBottom = () => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Default terminal splash screen
  useEffect(() => {
    StorageService.getSystemVersion().then(res => {
      const v = (res && res.success) ? res.version : 'v5.52';
      setTerminalOutput([
        { text: `========================================================`, type: 'system' },
        { text: `   ⚡ YUIHIME INTERACTIVE NEURAL DEVELOPMENT TERMINAL ⚡`, type: 'system' },
        { text: `   ${v}-Cortex / Physical Path: YUIHIME_USER_DATA_PATH`, type: 'system' },
        { text: `========================================================`, type: 'system' },
        { text: `System Ready. Type 'help' to see available tools & custom rules.`, type: 'system' },
        { text: `Double-click any file to edit, or use 'edit <filename>' to load it.`, type: 'system' },
        { text: `Access the SQLite core directly using node `.concat('`yuihime-query.cjs`'), type: 'system' },
        { text: ``, type: 'system' }
      ]);
    });
  }, []);

  const handleReadFile = async (name: string) => {
    const fullRelative = currentPath ? `${currentPath}/${name}` : name;
    const res = await StorageService.sandboxFile('read', fullRelative);
    if (res.content !== undefined) {
      setSelectedFile(fullRelative);
      setFileContent(res.content);
      setActiveEditorTab('editor');
      printToTerminal(`File loaded: ${name}`, 'stdout');
    }
  };

  const handleSaveFile = async () => {
    if (!selectedFile) return;
    const res = await StorageService.sandboxFile('write', selectedFile, fileContent, alwaysApproveSession);
    if (res.success) {
      printToTerminal(`File saved successfully: ${selectedFile}`, 'stdout');
      await loadFiles();
    } else if (res.error && res.error.includes("CONFIRMATION_REQUIRED")) {
      setPendingConfirm({
        action: 'write',
        path: selectedFile,
        content: fileContent,
        onApprove: async (always: boolean) => {
          if (always) {
            setAlwaysApproveSession(true);
          }
          const retryRes = await StorageService.sandboxFile('write', selectedFile, fileContent, true);
          if (retryRes.success) {
            printToTerminal(`File saved successfully${always ? ' (Always Acc enabled)' : ' (Acc)'}: ${selectedFile}`, 'stdout');
            await loadFiles();
          } else {
            printToTerminal(`Error saving file: ${retryRes.error || 'unknown issue'}`, 'stderr');
          }
          setPendingConfirm(null);
        },
        onCancel: () => {
          printToTerminal(`Save canceled by user.`, 'system');
          setPendingConfirm(null);
        }
      });
    } else {
      printToTerminal(`Error saving file: ${res.error || 'unknown issue'}`, 'stderr');
    }
  };

  const handleDelete = async (name: string) => {
    const fullRelative = currentPath ? `${currentPath}/${name}` : name;
    const res = await StorageService.sandboxFile('delete', fullRelative, undefined, alwaysApproveSession);
    if (res.success) {
      printToTerminal(`Deleted: ${name}`, 'stdout');
      if (selectedFile === fullRelative) {
        setSelectedFile(null);
        setFileContent('');
      }
      await loadFiles();
    } else if (res.error && res.error.includes("CONFIRMATION_REQUIRED")) {
      setPendingConfirm({
        action: 'delete',
        path: fullRelative,
        onApprove: async (always: boolean) => {
          if (always) {
            setAlwaysApproveSession(true);
          }
          const retryRes = await StorageService.sandboxFile('delete', fullRelative, undefined, true);
          if (retryRes.success) {
            printToTerminal(`Deleted successfully${always ? ' (Always Acc enabled)' : ' (Acc)'}: ${name}`, 'stdout');
            if (selectedFile === fullRelative) {
              setSelectedFile(null);
              setFileContent('');
            }
            await loadFiles();
          } else {
            printToTerminal(`Error deleting file: ${retryRes.error || 'unknown issue'}`, 'stderr');
          }
          setPendingConfirm(null);
        },
        onCancel: () => {
          printToTerminal(`Delete canceled by user.`, 'system');
          setPendingConfirm(null);
        }
      });
    } else {
      printToTerminal(`Error deleting file: ${res.error || 'unknown issue'}`, 'stderr');
    }
  };

  const handleCreateFile = async () => {
    const name = prompt('Nama berkas baru (contoh: test-run.cjs):');
    if (!name) return;
    const fullRelative = currentPath ? `${currentPath}/${name}` : name;
    const res = await StorageService.sandboxFile('write', fullRelative, `// New custom file\n`);
    if (res.success) {
      setSelectedFile(fullRelative);
      setFileContent(`// New custom file\n`);
      await loadFiles();
      printToTerminal(`Created file: ${name}`, 'stdout');
    }
  };

  const handleCreateFolder = async () => {
    const name = prompt('Nama folder baru:');
    if (!name) return;
    const fullRelative = currentPath ? `${currentPath}/${name}/.keep` : `${name}/.keep`;
    // Create folder by writing dummy .keep
    await StorageService.sandboxFile('write', fullRelative, '');
    await loadFiles();
    printToTerminal(`Created directory: ${name}`, 'stdout');
  };

  const printToTerminal = (text: string, type: 'cmd' | 'stdout' | 'stderr' | 'system') => {
    setTerminalOutput(prev => [...prev, { text, type }]);
  };

  // Terminal commands interpreter
  const executeTerminalCommand = async () => {
    const cleanCmd = command.trim();
    if (!cleanCmd) return;

    // Add to history
    setCmdHistory(prev => [cleanCmd, ...prev.slice(0, 50)]);
    setHistoryIndex(-1);

    printToTerminal(`yuihime@sandbox-cortex:~$ ${cleanCmd}`, 'cmd');
    setCommand('');

    const args = cleanCmd.split(' ');
    const baseCmd = args[0].toLowerCase();

    // 1. Local Clear
    if (baseCmd === 'clear') {
      setTerminalOutput([]);
      return;
    }

    // 2. Help
    if (baseCmd === 'help') {
      printToTerminal(`Available Commands inside Yuihime Terminal Space:`, 'system');
      printToTerminal(`--------------------------------------------------------`, 'system');
      printToTerminal(`  help                  : Menampilkan menu bantuan terminal ini.`, 'system');
      printToTerminal(`  clear                 : Bersihkan seluruh baris log terminal.`, 'system');
      printToTerminal(`  yuihime               : Cetak status lengkap ekosistem batin Yuihime.`, 'system');
      printToTerminal(`  ls                    : Tampilkan file/folder di sandbox saat ini.`, 'system');
      printToTerminal(`  cat <file>            : Menampilkan isi dari file kustom secara langsung.`, 'system');
      printToTerminal(`  edit <file>           : Buka file ke dalam editor panel visual.`, 'system');
      printToTerminal(`  touch <file>          : Membuat file kosong baru.`, 'system');
      printToTerminal(`  mkdir <folder>        : Membuat folder baru.`, 'system');
      printToTerminal(`  node <file.cjs>       : Eksekusi script javascript (v8 node).`, 'system');
      printToTerminal(`  [any-shell-command]   : Eksekusi perintah bash/shell langsung ke OS.`, 'system');
      printToTerminal(`--------------------------------------------------------`, 'system');
      return;
    }

    // 3. custom yuihime brand status
    if (baseCmd === 'yuihime') {
      printToTerminal(`YUIHIME QUANTUM CORTEX CORE STATE SYSTEM`, 'system');
      printToTerminal(`============================================`, 'system');
      printToTerminal(`ENVIRONMENT PATHS:`, 'system');
      printToTerminal(` - Root Dev Sandbox (YUIHIME_USER_DATA_PATH) : ./.yuihime/user_data/`, 'system');
      printToTerminal(` - Secondary Database (YUIHIME_DB_PATH)      : ./.yuihime/data/yuihime.db`, 'system');
      printToTerminal(` - Configuration Storage (YUIHIME_CONFIG)     : ./.yuihime/data/config.toml`, 'system');
      printToTerminal(` - Outer Data Folder (YUIHIME_DATA_DIR)      : ./.yuihime/data/`, 'system');
      printToTerminal(` - Personality Path (YUIHIME_AGENT_PATH)     : ./.yuihime/agent/`, 'system');
      printToTerminal(` - Multi-Addon Repo (YUIHIME_ADDONS_PATH)    : ./.yuihime/addons/`, 'system');
      printToTerminal(``, 'system');
      printToTerminal(`COGNITIVE SENSORS STATUS:`, 'system');
      printToTerminal(` - Path Jail Defense  : ACTIVE (100% Hermetic Block)`, 'system');
      printToTerminal(` - Real-time Kernel   : READY & LINKED`, 'system');
      printToTerminal(` - Sandbox Mode       : UNLOCKED DEV SHELL (CJS Supported)`, 'system');
      printToTerminal(`============================================`, 'system');
      return;
    }

    // 4. local cat intercept
    if (baseCmd === 'cat' && args.length > 1) {
      const target = args[1];
      const fullRelative = currentPath ? `${currentPath}/${target}` : target;
      const res = await StorageService.sandboxFile('read', fullRelative);
      if (res.content !== undefined) {
        printToTerminal(`--- Printing ${target} ---`, 'system');
        printToTerminal(res.content, 'stdout');
      } else {
        printToTerminal(`cat: ${target}: File not found or unreadable.`, 'stderr');
      }
      return;
    }

    // 5. local edit intercept
    if ((baseCmd === 'edit' || baseCmd === 'nano' || baseCmd === 'vim') && args.length > 1) {
      const target = args[1];
      const fullRelative = currentPath ? `${currentPath}/${target}` : target;
      const res = await StorageService.sandboxFile('read', fullRelative);
      if (res.content !== undefined) {
        setSelectedFile(fullRelative);
        setFileContent(res.content);
        setActiveEditorTab('editor');
        printToTerminal(`Opening ${target} in the visual editor code pane.`, 'stdout');
      } else {
        // Create new file then edit
        await StorageService.sandboxFile('write', fullRelative, `// Code editing: ${target}\n`);
        setSelectedFile(fullRelative);
        setFileContent(`// Code editing: ${target}\n`);
        setActiveEditorTab('editor');
        await loadFiles();
        printToTerminal(`Created and opened ${target} in the visual editor code pane.`, 'stdout');
      }
      return;
    }

    // 6. local touch intercept
    if (baseCmd === 'touch' && args.length > 1) {
      const target = args[1];
      const fullRelative = currentPath ? `${currentPath}/${target}` : target;
      const res = await StorageService.sandboxFile('write', fullRelative, '');
      if (res.success) {
        printToTerminal(`Created file: ${target}`, 'stdout');
        await loadFiles();
      } else {
        printToTerminal(`touch: Failed to create ${target}: ${res.error}`, 'stderr');
      }
      return;
    }

    // 7. local mkdir intercept
    if (baseCmd === 'mkdir' && args.length > 1) {
      const target = args[1];
      const fullRelative = currentPath ? `${currentPath}/${target}/.keep` : `${target}/.keep`;
      const res = await StorageService.sandboxFile('write', fullRelative, '');
      if (res.success) {
        printToTerminal(`Created directory: ${target}`, 'stdout');
        await loadFiles();
      } else {
        printToTerminal(`mkdir: Failed to create folder ${target}: ${res.error}`, 'stderr');
      }
      return;
    }

    // 8. Otherwise run native command in Sandbox Root
    try {
      const res = await StorageService.sandboxExec(cleanCmd);
      if (res.stdout) {
        printToTerminal(res.stdout, 'stdout');
      }
      if (res.stderr) {
        printToTerminal(res.stderr, 'stderr');
      }
      if (!res.stdout && !res.stderr && res.exitCode === 0) {
        printToTerminal(`Command completed with exit code 0.`, 'stdout');
      } else if (res.exitCode !== 0 && res.exitCode !== undefined) {
        printToTerminal(`Command failed with exit code: ${res.exitCode}`, 'stderr');
      }
    } catch (err: any) {
      printToTerminal(`Terminal execution failed: ${err.message}`, 'stderr');
    }

    await loadFiles();
  };

  const handleHistoryNav = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < cmdHistory.length - 1) {
        const nextIdx = historyIndex + 1;
        setHistoryIndex(nextIdx);
        setCommand(cmdHistory[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setCommand(cmdHistory[nextIdx]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommand('');
      }
    }
  };

  // Color scheme mappings
  const themeColors = {
    emerald: {
      text: 'text-emerald-400',
      border: 'border-emerald-500/20',
      bg: 'bg-emerald-950/20',
      accent: 'bg-emerald-500/10 text-emerald-400',
      badge: 'border-emerald-500/20 text-emerald-400 bg-emerald-500/10',
      caret: 'bg-emerald-400',
      glow: 'shadow-[0_0_15px_rgba(16,185,129,0.15)]'
    },
    amber: {
      text: 'text-amber-400',
      border: 'border-amber-500/20',
      bg: 'bg-amber-950/20',
      accent: 'bg-amber-500/10 text-amber-400',
      badge: 'border-amber-500/20 text-amber-400 bg-amber-500/10',
      caret: 'bg-amber-400',
      glow: 'shadow-[0_0_15px_rgba(245,158,11,0.15)]'
    },
    crystal: {
      text: 'text-cyan-400',
      border: 'border-cyan-500/20',
      bg: 'bg-cyan-950/20',
      accent: 'bg-cyan-500/10 text-cyan-400',
      badge: 'border-cyan-500/20 text-cyan-400 bg-cyan-500/10',
      caret: 'bg-cyan-400',
      glow: 'shadow-[0_0_15px_rgba(6,182,212,0.15)]'
    }
  };

  const clr = themeColors[terminalTheme];

  return (
    <div className="flex flex-col h-[700px] overflow-hidden rounded-2xl border border-white/5 bg-[#030303] text-gray-300 font-sans shadow-2xl">
      {/* Dynamic Terminal Sub-header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-white/5 bg-[#08080a] select-none">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <Cpu className="text-emerald-500 animate-pulse" size={18} />
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-20 animate-ping" />
          </div>
          <div>
            <div className="text-xs font-bold text-white tracking-wide flex items-center gap-2">
              Yuihime Cortex DevShell
              <span className="text-[9px] font-mono font-normal opacity-50 px-1 border border-white/10 rounded">User Workspace Sandbox</span>
            </div>
            <div className="text-[10px] font-mono text-gray-500 mt-0.5 truncate max-w-xs sm:max-w-md">
              sandbox_jail: ~{currentPath ? `/${currentPath}` : ''}
            </div>
          </div>
        </div>

        {/* Configurations, Theme Toggles & Tools */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <div className="flex items-center bg-white/5 rounded-lg border border-white/5 p-1 text-[10px] font-mono">
            <button 
              onClick={() => setTerminalTheme('emerald')} 
              className={`px-2 py-0.5 rounded transition-all ${terminalTheme === 'emerald' ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'text-gray-500 hover:text-white'}`}
            >
              Emerald
            </button>
            <button 
              onClick={() => setTerminalTheme('amber')} 
              className={`px-2 py-0.5 rounded transition-all ${terminalTheme === 'amber' ? 'bg-amber-500/20 text-amber-400 font-bold' : 'text-gray-500 hover:text-white'}`}
            >
              Amber
            </button>
            <button 
              onClick={() => setTerminalTheme('crystal')} 
              className={`px-2 py-0.5 rounded transition-all ${terminalTheme === 'crystal' ? 'bg-blue-500/20 text-cyan-400 font-bold' : 'text-gray-500 hover:text-white'}`}
            >
              Cobalt
            </button>
          </div>

          <button 
            onClick={loadFiles}
            className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white border border-white/5 transition-all"
            title="Refresh Filesystem"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Primary Split Workspace Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden h-full">
        
        {/* SIDE BAR: Retro-styled midnight-commander File Explorer (3 columns) */}
        <div className="lg:col-span-3 border-r border-white/5 bg-[#050507] flex flex-col overflow-hidden">
          <div className="p-3 border-b border-white/5 flex items-center justify-between text-[11px] font-mono bg-white/[0.01]">
            <span className="text-gray-400 uppercase tracking-widest font-bold">Workspace File Tree</span>
            <div className="flex items-center gap-1.5">
              <button 
                onClick={handleCreateFile} 
                className="p-1 text-gray-500 hover:text-emerald-400 hover:bg-white/5 rounded transition-all"
                title="Create File"
              >
                <Plus size={13} />
              </button>
              <button 
                onClick={handleCreateFolder} 
                className="p-1 text-gray-500 hover:text-amber-400 hover:bg-white/5 rounded transition-all"
                title="Create Folder"
              >
                <FolderPlus size={13} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-0.5 scrollbar-thin">
            {currentPath && (
              <div 
                onClick={() => setCurrentPath(currentPath.split('/').slice(0, -1).join('/'))}
                className="flex items-center p-1.5 hover:bg-white/[0.03] rounded-lg cursor-pointer text-gray-500 text-xs font-mono select-none"
              >
                <span className="text-emerald-500 mr-2">▲</span> .. (Parent Directory)
              </div>
            )}

            {files.map(f => (
              <div 
                key={f.name} 
                onDoubleClick={() => f.isDir ? setCurrentPath(currentPath ? `${currentPath}/${f.name}` : f.name) : handleReadFile(f.name)}
                className={`group flex items-center justify-between p-1.5 rounded-lg cursor-pointer select-none transition-all ${selectedFile === (currentPath ? `${currentPath}/${f.name}` : f.name) ? 'bg-white/5 border border-white/10' : 'hover:bg-white/[0.02]'}`}
              >
                <div 
                  className="flex items-center gap-2 truncate flex-1 min-w-0"
                  onClick={() => f.isDir ? setCurrentPath(currentPath ? `${currentPath}/${f.name}` : f.name) : handleReadFile(f.name)}
                >
                  {f.isDir ? (
                    <Folder size={14} className="text-amber-500/80 shrink-0" />
                  ) : (
                    <FileCode size={14} className="text-emerald-500/70 shrink-0" />
                  )}
                  <span className="text-xs font-mono truncate text-gray-300 group-hover:text-white">
                    {f.name}
                  </span>
                </div>

                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 shrink-0 transition-opacity">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleReadFile(f.name); }} 
                    className="p-0.5 hover:bg-white/5 text-gray-400 hover:text-emerald-400 rounded"
                    title="Open in editor"
                  >
                    <BookOpen size={11} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(f.name); }} 
                    className="p-0.5 hover:bg-white/5 text-gray-500 hover:text-red-400 rounded"
                    title="Delete"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            ))}

            {files.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center p-8 text-center text-gray-600 font-mono text-[10px]">
                <Database size={16} className="opacity-20 mb-1" />
                No files detected in active dir.
              </div>
            )}
          </div>
        </div>

        {/* PRIMARY SPLIT: Code Code Editor & Immersive Glowing Terminal (9 columns) */}
        <div className="lg:col-span-9 flex flex-col h-full overflow-hidden bg-[#020202]">
          
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-hidden h-full">
            
            {/* LEFT COMPONENT: Code editor workspace */}
            <div className="border-r border-white/5 bg-[#030304] flex flex-col overflow-hidden h-full">
              {selectedFile ? (
                <div className="flex flex-col h-full overflow-hidden">
                  <div className="flex items-center justify-between p-3 border-b border-white/5 bg-white/[0.01]">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <FileCode size={13} className="text-emerald-400" />
                      <span className="text-xs font-mono text-white truncate">{selectedFile.split('/').pop()}</span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex bg-white/5 p-0.5 rounded text-[10px] font-mono">
                        <button 
                          onClick={() => setActiveEditorTab('editor')}
                          className={`px-2 py-0.5 rounded ${activeEditorTab === 'editor' ? 'bg-white/10 text-white font-bold' : 'text-gray-500'}`}
                        >
                          Code
                        </button>
                        <button 
                          onClick={() => setActiveEditorTab('preview')}
                          className={`px-2 py-0.5 rounded ${activeEditorTab === 'preview' ? 'bg-white/10 text-white font-bold' : 'text-gray-500'}`}
                        >
                          Raw View
                        </button>
                      </div>

                      <button 
                        onClick={handleSaveFile} 
                        className="px-2 py-1 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 font-bold font-mono text-[10px] rounded flex items-center gap-1 transition-all"
                      >
                        <Save size={11} />
                        SAVE
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-hidden relative">
                    {activeEditorTab === 'editor' ? (
                      <textarea 
                        value={fileContent}
                        onChange={(e) => setFileContent(e.target.value)}
                        className="w-full h-full bg-transparent p-4 font-mono text-[11px] text-gray-300 focus:outline-none resize-none leading-relaxed"
                        placeholder="// Start hacking your node shell script..."
                        spellCheck={false}
                      />
                    ) : (
                      <pre className="w-full h-full p-4 overflow-auto font-mono text-[10px] text-gray-400 bg-[#060608]/40 select-all whitespace-pre-wrap leading-relaxed">
                        {fileContent || '// Empty file'}
                      </pre>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-[#030304]">
                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded-full mb-3 text-gray-600">
                    <SquareTerminal size={24} className="opacity-40" />
                  </div>
                  <h4 className="text-xs font-bold font-mono text-white tracking-widest uppercase">Live Core Workspace Node</h4>
                  <p className="text-[10px] font-mono text-gray-500 max-w-xs mt-1 leading-normal">
                    Pilih file dari silsilah kiri untuk melakukan suntingan visual, atau ketik <code className="text-emerald-400">edit &lt;file&gt;</code> langsung di shell batin.
                  </p>
                  
                  <div className="mt-4 flex flex-col items-stretch gap-1.5 w-full max-w-xs px-4">
                    <button 
                      onClick={() => handleReadFile('README.md')}
                      className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-lg text-[10px] font-mono text-gray-400 hover:text-white flex items-center justify-between text-left transition-all"
                    >
                      <span>💡 View README Guide</span>
                      <ArrowRight size={10} />
                    </button>
                    <button 
                      onClick={() => handleReadFile('yuihime-query.cjs')}
                      className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-lg text-[10px] font-mono text-gray-400 hover:text-white flex items-center justify-between text-left transition-all"
                    >
                      <span>⚡ View Core DB Connector Script</span>
                      <ArrowRight size={10} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COMPONENT: Immersive Retro Terminal */}
            <div className={`bg-[#020202] flex flex-col overflow-hidden h-full select-text relative border-t md:border-t-0 ${clr.glow}`}>
              <div className="p-3 border-b border-white/5 bg-white/[0.01] flex items-center justify-between text-[11px] font-mono select-none">
                <span className="text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <TerminalIcon size={12} className={clr.text} />
                  Quantum_Cortex_Stream
                </span>
                <span className="text-gray-500 text-[10px] truncate max-w-[120px] sm:max-w-none">
                  ONLINE // {terminalTheme.toUpperCase()}_PHOSPHOR
                </span>
              </div>

              {/* Logs terminal area */}
              <div 
                className="flex-1 p-4 font-mono overflow-y-auto space-y-1.5 leading-relaxed text-[11px]"
                onClick={() => terminalInputRef.current?.focus()}
              >
                {terminalOutput.map((line, i) => {
                  let textStyle = 'text-gray-300';
                  if (line.type === 'cmd') textStyle = `${clr.text} font-bold`;
                  else if (line.type === 'stderr') textStyle = 'text-red-400 font-medium';
                  else if (line.type === 'system') textStyle = 'text-blue-400/80 font-bold';
                  else textStyle = 'text-gray-300 opacity-90';

                  return (
                    <div key={i} className="whitespace-pre-wrap break-all select-text">
                      {line.text}
                    </div>
                  );
                })}
                <div ref={terminalEndRef} />
              </div>

              {/* Terminal user command prompt inside user_data space */}
              <div className="p-3 bg-[#0a0a0c] border-t border-white/5 flex items-center gap-2">
                <span className={`${clr.text} font-mono text-[11px] font-bold select-none`}>
                  $
                </span>
                <input 
                  ref={terminalInputRef}
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') executeTerminalCommand();
                    else handleHistoryNav(e);
                  }}
                  className="bg-transparent border-none outline-none focus:ring-0 focus:border-none p-0 flex-1 text-white font-mono text-[11.5px] caret-rose-500 placeholder-gray-600 leading-none h-5"
                  placeholder="Type 'help' for guidance..."
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                />
              </div>

            </div>

          </div>

        </div>

      </div>

      {pendingConfirm && (
        <div className="fixed inset-0 bg-[#07070a]/80 backdrop-blur-md flex items-center justify-center z-50 p-4 font-sans animate-fade-in">
          <div className="bg-[#0e0e14] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl relative overflow-hidden select-none text-left">
            {/* Ambient Background Glow */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl shrink-0">
                <AlertTriangle size={20} className="animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-white tracking-tight leading-none mb-2">
                  Konfirmasi Modifikasi Berkas
                </h4>
                <p className="text-[11.5px] text-zinc-300 leading-relaxed mb-1.5">
                  Aksi <strong className="text-amber-400">{pendingConfirm.action === 'write' ? 'Menulis/Mengedit' : 'Menghapus'}</strong> berkas terdeteksi di dalam ruang kerja data pengguna (<code>user_data</code>):
                </p>
                <div className="bg-black/45 border border-white/5 rounded-lg px-3 py-2 text-[10.5px] font-mono text-zinc-300 break-all mb-4">
                  {pendingConfirm.path}
                </div>
                <p className="text-[10px] text-zinc-550 leading-relaxed mb-6">
                  Silakan tentukan tingkat otorisasi akses batin Anda untuk memproses instruksi berkas ini:
                </p>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => pendingConfirm.onApprove(false)}
                    className="w-full py-2.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 text-xs font-bold border border-amber-500/20 rounded-xl transition-all cursor-pointer active:scale-[0.98] text-center"
                  >
                    Setujui Sekali (Acc)
                  </button>
                  <button
                    onClick={() => pendingConfirm.onApprove(true)}
                    className="w-full py-2.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-bold border border-emerald-500/20 rounded-xl transition-all cursor-pointer active:scale-[0.98] text-center"
                  >
                    Selalu Setujui Sesi Ini (Always Acc)
                  </button>
                  <button
                    onClick={pendingConfirm.onCancel}
                    className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-zinc-400 text-xs font-bold border border-white/5 rounded-xl transition-all cursor-pointer active:scale-[0.98] text-center"
                  >
                    Tolak Aksi (Tolak)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
