'use client';

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

export const dynamic = 'force-dynamic';

export default function Home() {
  const { user, loading: authLoading, isConfigured, login, logout } = useAuth();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<AuditData | null>(null);
  const [assets, setAssets] = useState<AssetData | null>(null);
  const [error, setError] = useState('');

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
  const isBackendRemote = BACKEND_URL.includes('trycloudflare.com') || BACKEND_URL.includes('vercel.app') || !BACKEND_URL.includes('localhost');

  const pollTaskStatus = async (taskId: string) => {
    while (true) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      const res = await fetch(`${BACKEND_URL}/status/${taskId}`, {
        headers: {
          'Content-Type': 'application/json',
          'bypass-tunnel-reminder': 'true'
        }
      });
      if (!res.ok) throw new Error('Failed to check task status');
      
      const data = await res.json();
      if (data.status === 'completed') {
        return data.result;
      } else if (data.status === 'error') {
        throw new Error(data.detail || 'Task failed');
      }
      // if processing, continue loop
    }
  };

  const handleAudit = async () => {
    if (!url || !user) return;
    setLoading(true);
    setError('');
    setReport(null);
    setAssets(null);
    try {
      const res = await fetch(`${BACKEND_URL}/audit`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'bypass-tunnel-reminder': 'true'
        },
        body: JSON.stringify({ url })
      });
      if (!res.ok) throw new Error('Task initiation failed');
      
      const { task_id } = await res.json();
      const reportData = await pollTaskStatus(task_id);
      
      setReport(reportData);
    } catch (err: any) {
      setError(err.message || 'Audit failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!url || !user) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BACKEND_URL}/generate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'bypass-tunnel-reminder': 'true'
        },
        body: JSON.stringify({ url })
      });
      if (!res.ok) throw new Error('Task initiation failed');
      
      const { task_id } = await res.json();
      const assetsData = await pollTaskStatus(task_id);
      
      setAssets(assetsData);
    } catch (err: any) {
      setError(err.message || 'Generation failed.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-gradient-to-b from-purple-600/20 to-transparent opacity-50 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-md">
          <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
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
              "w-full h-14 font-bold rounded-2xl transition-all flex items-center justify-center gap-3",
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
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-purple-500/30">
      {/* Header with Logout */}
      <nav className="absolute top-0 left-0 right-0 h-20 flex items-center justify-between px-8 z-20">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
            <Zap className="w-6 h-6 text-purple-500 fill-purple-500" />
            GEO ENGINE
          </div>
          {!isBackendRemote && (
            <span className="text-[10px] text-amber-500 font-medium uppercase tracking-widest mt-0.5">
              ⚠️ Local Backend Mode
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-zinc-400 hidden md:block">
            {user.email}
          </div>
          <button 
            onClick={logout}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-xs font-semibold"
          >
            Logout
          </button>
        </div>
      </nav>
      {/* Hero Section */}
      <div className="relative overflow-hidden pt-20 pb-16 px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[400px] bg-gradient-to-b from-purple-600/10 via-transparent to-transparent opacity-50 blur-3xl pointer-events-none" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-purple-400 mb-6 tracking-wider uppercase">
            <Zap className="w-3.5 h-3.5" />
            100% Open Source GEO Engine
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
            AI Visibility & Optimization
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Audit your brand across the Big 5 Generative Engines. 
            Optimize for citations, entity clarity, and real-time sentiment.
          </p>

          <div className="flex flex-col md:flex-row gap-4 max-w-2xl mx-auto">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-purple-400 transition-colors" />
              <input 
                type="text" 
                placeholder="Enter website URL (e.g., https://example.com)"
                className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/40 transition-all font-medium"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <button 
              onClick={handleAudit}
              disabled={loading}
              className="h-14 px-8 bg-white text-black font-semibold rounded-2xl hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Analyzing...' : 'Run Audit'}
            </button>
            <button 
              onClick={handleGenerate}
              disabled={loading || !url}
              className="h-14 px-8 bg-white/5 border border-white/10 text-white font-semibold rounded-2xl hover:bg-white/10 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              Generate Assets
            </button>
          </div>

          {error && (
            <div className="mt-6 flex items-center justify-center gap-2 text-red-400 text-sm font-medium">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-24 space-y-12">
        {/* Scoring Grid */}
        {report && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ScoreCard 
              name="ChatGPT" 
              icon={<MessageSquare className="w-5 h-5" />}
              score={report.chatgpt.score}
              analysis={report.chatgpt.analysis}
              color="text-emerald-400"
            />
            <ScoreCard 
              name="Grok" 
              icon={<Cpu className="w-5 h-5" />}
              score={report.grok.score}
              analysis={report.grok.analysis}
              color="text-zinc-50"
            />
            <ScoreCard 
              name="Gemini" 
              icon={<ShieldCheck className="w-5 h-5" />}
              score={report.gemini.score}
              analysis={report.gemini.analysis}
              color="text-blue-400"
            />
            <ScoreCard 
              name="Claude" 
              icon={<Layers className="w-5 h-5" />}
              score={report.claude.score}
              analysis={report.claude.analysis}
              color="text-orange-400"
            />
            <ScoreCard 
              name="Perplexity" 
              icon={<Globe className="w-5 h-5" />}
              score={report.perplexity.score}
              analysis={report.perplexity.analysis}
              color="text-cyan-400"
            />
          </div>
        )}

        {/* Asset Grid */}
        {assets && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-12 border-t border-white/10">
            <AssetBox title="geo.txt" icon={<FileText className="w-5 h-5" />} content={assets.geo_txt} />
            <AssetBox title="JSON-LD Schema" icon={<Code className="w-5 h-5" />} content={assets.json_ld} />
            <AssetBox title="Q&A Snippets" icon={<CheckCircle2 className="w-5 h-5" />} content={assets.qa_snippets} />
            <AssetBox title="Comparison Table" icon={<Table className="w-5 h-5" />} content={assets.comparison_table} />
          </div>
        )}
      </div>
    </main>
  );
}

function ScoreCard({ name, icon, score, analysis, color }: any) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:border-white/20 transition-all group">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white/5 border border-white/10 group-hover:scale-110 transition-transform">
            {icon}
          </div>
          <span className="font-bold text-lg">{name}</span>
        </div>
        <div className={cn("text-2xl font-black", color)}>
          {score}%
        </div>
      </div>
      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-4">
        <div 
          className={cn("h-full transition-all duration-1000", color.replace('text', 'bg'))}
          style={{ width: `${score}%` }}
        />
      </div>
      <p className="text-zinc-400 text-sm leading-relaxed antialiased">
        {analysis}
      </p>
    </div>
  );
}

function AssetBox({ title, icon, content }: any) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden flex flex-col">
      <div className="px-6 py-4 flex items-center justify-between bg-white/[0.02] border-b border-white/10">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-semibold">{title}</span>
        </div>
        <button 
          onClick={() => {
            navigator.clipboard.writeText(content);
            alert('Copied to clipboard!');
          }}
          className="text-xs font-medium text-zinc-500 hover:text-white transition-colors flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          Copy
        </button>
      </div>
      <div className="p-6">
        <pre className="text-xs font-mono text-zinc-500 overflow-x-auto whitespace-pre-wrap max-h-[300px]">
          {content}
        </pre>
      </div>
    </div>
  );
}
