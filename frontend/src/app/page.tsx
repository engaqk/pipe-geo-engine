'use client';
// v1.0.1 - Fixed Download/Copy and Score Crash

import { useState } from 'react';
import { 
  Search, 
  ShieldCheck, 
  Zap, 
  Globe, 
  Cpu, 
  Layers, 
  Download, 
  AlertCircle,
  CheckCircle2,
  Table,
  Code,
  FileText,
  MessageSquare
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AuditData {
  chatgpt: { score: number; analysis: string };
  grok: { score: number; analysis: string; snippets: string[] };
  gemini: { score: number; analysis: string; schema_suggestion: string };
  claude: { score: number; analysis: string };
  perplexity: { score: number; analysis: string };
}

interface AssetData {
  geo_txt: string;
  json_ld: string;
  qa_snippets: string;
  comparison_table: string;
}

import { useAuth } from '@/components/AuthProvider';

import { motion, AnimatePresence } from 'framer-motion';

export const dynamic = 'force-dynamic';

export default function Home() {
  const { user, loading: authLoading, isConfigured, login, logout } = useAuth();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [report, setReport] = useState<AuditData | null>(null);
  const [assets, setAssets] = useState<AssetData | null>(null);
  const [error, setError] = useState('');

  // Production Ready Expert Note: Using relative proxy path /api_proxy to bypass CORS/ISP DNS blocks entirely
  const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  
  // Production: Use /api_proxy to bypass CORS and Cloudflare timeouts
  // Local: Use LOCALHOST if available, fallback to .env tunnel for testing "remote" behavior
  const BACKEND_URL = !isLocalhost 
    ? '/api_proxy' 
    : (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000').replace(/\/$/, '');
  
  const isBackendRemote = !isLocalhost || (!BACKEND_URL.includes('localhost'));

  const pollTaskStatus = async (taskId: string, type: 'audit' | 'generate') => {
    const startTime = Date.now();
    const timeout = 300000; // 5 minutes
    
    while (Date.now() - startTime < timeout) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      try {
        const res = await fetch(`${BACKEND_URL}/status/${taskId}`, {
          headers: {
            'Content-Type': 'application/json',
            'bypass-tunnel-reminder': 'true',
            'Cache-Control': 'no-cache'
          }
        });
        
        if (res.status === 404) {
          throw new Error('Task lost or expired on server.');
        }

        if (!res.ok) {
          console.error(`Polling error: ${res.status} ${res.statusText}`);
          // If it's a Cloudflare error (502, 504), we might want to retry a few times
          if (res.status >= 500) continue; 
          throw new Error(`Server returned error: ${res.status}`);
        }
        
        const data = await res.json();
        if (data.status === 'completed') {
          setStatus('Success!');
          return data.result;
        } else if (data.status === 'error') {
          throw new Error(data.detail || 'Task failed');
        } else {
          // Update status based on elapsed time or backend info if available
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          setStatus(`${type === 'audit' ? 'Analyzing' : 'Generating'}... (${elapsed}s)`);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }
    throw new Error('Task timed out after 5 minutes.');
  };

  const handleAudit = async () => {
    if (!url || !user) return;
    if (!url.startsWith('http')) {
      setError('Please enter a valid URL starting with http:// or https://');
      return;
    }
    setLoading(true);
    setError('');
    setStatus('Initializing Audit...');
    setReport(null);
    setAssets(null);
    try {
      setStatus('Scraping Website...');
      const res = await fetch(`${BACKEND_URL}/audit`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'bypass-tunnel-reminder': 'true'
        },
        body: JSON.stringify({ url })
      });
      if (!res.ok) throw new Error('Could not connect to AI Engine.');
      
      const { task_id } = await res.json();
      setStatus('Analyzing with LLM...');
      const reportData = await pollTaskStatus(task_id, 'audit');
      
      setReport(reportData);
    } catch (err: any) {
      setError(err.message || 'Audit failed.');
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  const handleGenerate = async () => {
    if (!url || !user) return;
    if (!url.startsWith('http')) {
      setError('Please enter a valid URL starting with http:// or https://');
      return;
    }
    setLoading(true);
    setError('');
    setStatus('Initializing Asset Generation...');
    try {
      setStatus('Crawling for assets...');
      const res = await fetch(`${BACKEND_URL}/generate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'bypass-tunnel-reminder': 'true'
        },
        body: JSON.stringify({ url })
      });
      if (!res.ok) throw new Error('Could not connect to AI Engine.');
      
      const { task_id } = await res.json();
      setStatus('Generating Optimization Files...');
      const assetsData = await pollTaskStatus(task_id, 'generate');
      
      setAssets(assetsData);
    } catch (err: any) {
      setError(err.message || 'Generation failed.');
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full" 
        />
      </div>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-gradient-to-b from-purple-600/20 to-transparent opacity-50 blur-3xl pointer-events-none" />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 max-w-md"
        >
          <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-purple-500/10">
            <ShieldCheck className="w-10 h-10 text-purple-400" />
          </div>
          <h1 className="text-4xl font-bold mb-4 tracking-tight">Premium Access Only</h1>
          <p className="text-zinc-400 mb-10 leading-relaxed text-lg">
            Sign in to access your AI Visibility Dashboard and start auditing your GEO rank.
          </p>
          <button 
            onClick={login}
            disabled={!isConfigured}
            className={cn(
              "w-full h-14 font-bold rounded-2xl transition-all flex items-center justify-center gap-3 active:scale-[0.98]",
              isConfigured 
                ? "bg-white text-black hover:bg-zinc-200" 
                : "bg-red-500/20 text-red-500 border border-red-500/50 cursor-not-allowed"
            )}
          >
            {isConfigured ? (
              <>
                <Globe className="w-5 h-5" />
                Sign in with Google
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5" />
                Auth Not Configured
              </>
            )}
          </button>
          {!isConfigured && (
            <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-left">
              <h3 className="text-red-500 font-bold text-sm mb-1">Configuration Required</h3>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Firebase keys are missing in environment variables. 
                Check your Vercel Dashboard and add <code>NEXT_PUBLIC_FIREBASE_API_KEY</code> and other required keys.
              </p>
            </div>
          )}
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#020202] text-white selection:bg-purple-500/30 font-sans">
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 h-20 flex items-center justify-between px-8 z-50 bg-[#020202]/80 backdrop-blur-md border-b border-white/5">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
            <Zap className="w-6 h-6 text-purple-500 fill-purple-500" />
            GEO ENGINE
          </div>
          {!isBackendRemote && (
            <span className="text-[9px] text-amber-500 font-bold uppercase tracking-widest mt-0.5 px-1.5 py-0.5 rounded bg-amber-500/10 w-fit">
              Local Dev Mode
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-zinc-400 hidden lg:flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {user.email}
          </div>
          <button 
            onClick={logout}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-xs font-semibold"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden pt-40 pb-20 px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[600px] bg-gradient-radial from-purple-600/10 via-transparent to-transparent opacity-60 blur-3xl pointer-events-none" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-purple-400 mb-8 tracking-widest uppercase"
          >
            <Zap className="w-3.5 h-3.5" />
            Generative Search Optimization Protocol
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-black tracking-tight mb-8 bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-transparent"
          >
            Master AI <br className="hidden md:block" /> Visibility.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            Audit your brand ranking across top LLM engines and generate production-ready 
            optimization assets in seconds. 
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col md:flex-row gap-4 max-w-3xl mx-auto p-2 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm"
          >
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-purple-400 transition-colors" />
              <input 
                type="text" 
                placeholder="Enter website URL (e.g., https://example.com)"
                className="w-full h-14 bg-transparent border-none rounded-2xl pl-12 pr-4 outline-none focus:ring-0 transition-all font-medium text-white placeholder:text-zinc-600"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAudit()}
              />
            </div>
            <button 
              onClick={handleAudit}
              disabled={loading}
              className="h-14 px-8 bg-white text-black font-bold rounded-2xl hover:bg-zinc-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95 shadow-xl shadow-white/5"
            >
              {loading && status.includes('Analyzing') ? (
                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : <Globe className="w-4 h-4" />}
              {loading && status.includes('Analyzing') ? 'Analyzing...' : 'Run Audit'}
            </button>
            <button 
              onClick={handleGenerate}
              disabled={loading || !url}
              className="h-14 px-8 bg-purple-600 text-white font-bold rounded-2xl hover:bg-purple-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95 shadow-xl shadow-purple-500/20"
            >
              {loading && status.includes('Generating') ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : <Zap className="w-4 h-4" />}
              Generate Assets
            </button>
          </motion.div>

          {status && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 text-purple-400 text-sm font-bold tracking-widest uppercase animate-pulse"
            >
              {status}
            </motion.div>
          )}

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6 flex items-center justify-center gap-2 text-red-500 text-sm font-bold px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 w-fit mx-auto"
            >
              <AlertCircle className="w-4 h-4" />
              {error}
            </motion.div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-32 space-y-20">
        <AnimatePresence mode="wait">
          {report && (
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              className="space-y-8"
            >
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold tracking-tight">Visibility Assessment</h2>
                <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ScoreCard 
                  name="ChatGPT" 
                  icon={<MessageSquare className="w-5 h-5" />}
                  score={report?.chatgpt?.score || 0}
                  analysis={report?.chatgpt?.analysis || "Analysis pending..."}
                  color="text-emerald-400"
                  delay={0.1}
                />
                <ScoreCard 
                  name="Grok" 
                  icon={<Cpu className="w-5 h-5" />}
                  score={report?.grok?.score || 0}
                  analysis={report?.grok?.analysis || "Analysis pending..."}
                  color="text-zinc-50"
                  delay={0.2}
                />
                <ScoreCard 
                  name="Gemini" 
                  icon={<ShieldCheck className="w-5 h-5" />}
                  score={report?.gemini?.score || 0}
                  analysis={report?.gemini?.analysis || "Analysis pending..."}
                  color="text-blue-400"
                  delay={0.3}
                />
                <ScoreCard 
                  name="Claude" 
                  icon={<Layers className="w-5 h-5" />}
                  score={report?.claude?.score || 0}
                  analysis={report?.claude?.analysis || "Analysis pending..."}
                  color="text-orange-400"
                  delay={0.4}
                />
                <ScoreCard 
                  name="Perplexity" 
                  icon={<Globe className="w-5 h-5" />}
                  score={report?.perplexity?.score || 0}
                  analysis={report?.perplexity?.analysis || "Analysis pending..."}
                  color="text-cyan-400"
                  delay={0.5}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {assets && (
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold tracking-tight">Optimization Assets</h2>
                <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <AssetBox title="geo.txt" icon={<FileText className="w-5 h-5 text-purple-400" />} content={assets.geo_txt} />
                <AssetBox title="JSON-LD Schema" icon={<Code className="w-5 h-5 text-blue-400" />} content={assets.json_ld} />
                <AssetBox title="Q&A Snippets" icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />} content={assets.qa_snippets} />
                <AssetBox title="Comparison Table" icon={<Table className="w-5 h-5 text-zinc-400" />} content={assets.comparison_table} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

function ScoreCard({ name, icon, score, analysis, color, delay }: any) {
  const numericScore = Number(score) || 0;
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white/[0.03] border border-white/5 rounded-[32px] p-8 hover:bg-white/[0.05] hover:border-white/10 transition-all group relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:border-purple-500/30 transition-all duration-500">
            {icon}
          </div>
          <span className="font-bold text-xl">{name}</span>
        </div>
        <div className={cn("text-3xl font-black tabular-nums tracking-tighter", color)}>
          {numericScore}%
        </div>
      </div>

      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mb-6">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${numericScore}%` }}
          transition={{ duration: 1.5, ease: "easeOut", delay: delay + 0.5 }}
          className={cn("h-full", color.replace('text', 'bg'))}
        />
      </div>

      <p className="text-zinc-400 text-sm leading-relaxed antialiased line-clamp-4 group-hover:line-clamp-none transition-all">
        {analysis}
      </p>
    </motion.div>
  );
}

function AssetBox({ title, icon, content }: any) {
  const displayContent = typeof content === 'object' ? JSON.stringify(content, null, 2) : String(content);

  const handleCopy = () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(displayContent);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = displayContent;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        textArea.remove();
      }
    } catch (e) {
      console.error('Failed to copy');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([displayContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className="bg-white/[0.03] border border-white/5 rounded-[32px] overflow-hidden flex flex-col group hover:border-white/10 transition-all"
    >
      <div className="px-8 py-6 flex items-center justify-between bg-white/[0.02] border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white/5 border border-white/10 group-hover:border-purple-500/30 transition-colors">
            {icon}
          </div>
          <span className="font-bold tracking-tight">{title}</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleCopy}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest hover:bg-white text-zinc-400 hover:text-black transition-all"
          >
            Copy
          </button>
          <button 
            onClick={handleDownload}
            className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-emerald-500 hover:border-emerald-500 group/down transition-all"
          >
            <Download className="w-4 h-4 text-zinc-400 group-hover/down:text-white" />
          </button>
        </div>
      </div>
      <div className="p-8 bg-[#030303]">
        <pre className="text-xs font-mono text-zinc-500 overflow-x-auto whitespace-pre-wrap max-h-[400px] scrollbar-hide selection:bg-purple-500/50">
          {displayContent}
        </pre>
      </div>
    </motion.div>
  );
}
