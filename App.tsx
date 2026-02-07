
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, BarChart, Bar, Cell
} from 'recharts';
import { 
  TrendingUp, TrendingDown, AlertCircle, Ghost, History, LayoutDashboard, 
  BookOpen, BrainCircuit, ShieldAlert, Zap, DollarSign, Clock, CheckCircle2,
  Database, ShieldCheck, Activity, BarChart3, Fingerprint, ShieldX, Eye, ArrowRight, ChevronRight, Play, Award, Target, ZapOff, Info, Timer, Sparkles, Trash2, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createChart, ColorType, IChartApi, ISeriesApi, CrosshairMode } from 'lightweight-charts';

import { Trade, PsychologicalProfile, Lesson, MarketCondition, Playbook } from './types';
import { geminiService, InterventionEvidence } from './services/geminiService';
import { dbService } from './services/dbService';

// --- Sub-components ---

const LandingPage: React.FC<{ onLaunch: () => void }> = ({ onLaunch }) => (
  <div className="min-h-screen bg-[#020617] text-white overflow-x-hidden selection:bg-emerald-500/30">
    <nav className="fixed top-0 w-full z-50 px-8 py-6 flex justify-between items-center backdrop-blur-xl border-b border-white/5">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
          <Ghost size={24} />
        </div>
        <span className="font-black tracking-tighter text-xl uppercase italic">Ghost Coach</span>
      </div>
      <button 
        onClick={onLaunch}
        className="px-6 py-2.5 bg-emerald-500 text-black font-black text-sm rounded-full uppercase tracking-tighter hover:scale-105 transition-all shadow-lg shadow-emerald-500/20"
      >
        Launch Terminal
      </button>
    </nav>

    <section className="relative pt-40 pb-32 px-8 flex flex-col items-center text-center">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-8">
          <Zap size={12} className="fill-emerald-400" /> Neural Persistence Active
        </div>
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8 bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-transparent">
          QUIT TRADING <br /> BLIND.
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
          The only trading terminal that remembers your mistakes and stops you from making them again. Connected to Neon for high-fidelity pattern memory.
        </p>
        <div className="flex flex-col md:flex-row items-center justify-center gap-6">
          <button onClick={onLaunch} className="w-full md:w-auto px-10 py-5 bg-emerald-500 text-black font-black text-lg rounded-2xl uppercase tracking-tighter hover:scale-105 transition-all flex items-center justify-center gap-3 shadow-2xl shadow-emerald-500/30">
            Launch Terminal <Play size={20} className="fill-black" />
          </button>
          <div className="flex items-center gap-4 text-slate-500 font-bold uppercase text-[10px] tracking-widest px-8">
            <Database size={16} className="text-blue-500" /> Neon Sync Active
            <Fingerprint size={16} className="text-emerald-500" /> Edge v2.4
          </div>
        </div>
      </motion.div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-[120px] -z-10 animate-pulse" />
    </section>
  </div>
);

const TimeframeControls: React.FC<{ current: string, onChange: (tf: string) => void }> = ({ current, onChange }) => (
  <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 backdrop-blur-md">
    {['1m', '5m', '15m', '1h'].map((tf) => (
      <button key={tf} onClick={() => onChange(tf)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${current === tf ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-slate-500 hover:text-slate-300'}`}>{tf}</button>
    ))}
  </div>
);

const GhostHUD: React.FC<{ riskScore: number, bias: string }> = ({ riskScore, bias }) => (
  <div className="flex items-center gap-6 px-6 py-4 glass rounded-2xl border-white/5 mb-6">
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${riskScore > 70 ? 'bg-red-500/20 text-red-500 pulse-red' : 'bg-emerald-500/20 text-emerald-400'}`}><Fingerprint size={20} /></div>
      <div>
        <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Risk Index</div>
        <div className="text-sm font-bold text-white">{riskScore}% Alert</div>
      </div>
    </div>
    <div className="h-8 w-px bg-white/10" />
    <div className="flex items-center gap-3">
      <div className="p-2 bg-white/5 rounded-lg text-blue-400"><Database size={20} /></div>
      <div>
        <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest">DB Status</div>
        <div className="text-sm font-bold text-emerald-500 flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Sync
        </div>
      </div>
    </div>
  </div>
);

const GhostOverlay: React.FC<{ 
  reason: string; 
  riskAmount: number;
  evidenceTrades?: InterventionEvidence[];
  onClose: (proceed: boolean) => void; 
}> = ({ reason, riskAmount, evidenceTrades, onClose }) => {
  const [countdown, setCountdown] = useState(10);
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-2xl p-4">
      <motion.div initial={{ scale: 0.8, rotateX: 20 }} animate={{ scale: 1, rotateX: 0 }} className="max-w-3xl w-full glass border-red-500/40 p-10 rounded-[2.5rem] shadow-[0_0_100px_rgba(239,68,68,0.2)] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5"><Ghost size={200} /></div>
        <div className="flex items-center gap-6 mb-10">
          <div className="p-5 bg-red-500/20 rounded-3xl text-red-500 pulse-red"><ShieldX size={48} /></div>
          <div>
            <h2 className="text-4xl font-black text-red-500 uppercase tracking-tighter leading-none">INTERVENTION</h2>
            <p className="text-red-400/60 text-sm font-bold mt-1 uppercase tracking-widest">Behavioral Match Detected</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div className="space-y-6">
            <div className="bg-red-500/5 border-l-4 border-red-500 p-6 rounded-r-2xl">
              <h3 className="text-red-300 font-black mb-2 flex items-center gap-2 text-xs uppercase tracking-widest">The "Ghost" Verdict:</h3>
              <p className="text-lg text-red-100 font-medium leading-tight">"{reason}"</p>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
              <History size={14} /> Similar Traps:
            </h3>
            {evidenceTrades && evidenceTrades.length > 0 ? (
              evidenceTrades.map((t, idx) => (
                <div key={idx} className="bg-red-500/5 p-4 rounded-2xl border border-red-500/10">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-mono text-red-400/60">{t.date}</span>
                    <span className="text-xs font-black text-red-400">-${Math.abs(t.pnl).toFixed(2)}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 italic line-clamp-2">"{t.reason}"</p>
                </div>
              ))
            ) : (
              <div className="bg-white/5 p-6 rounded-2xl text-center text-slate-600 text-[10px] font-black uppercase">
                Pattern Unstable - Avoid Bias
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col items-center gap-6">
          <div className="text-6xl font-black mono text-red-500 animate-pulse">{countdown}</div>
          <div className="flex w-full gap-6">
            <button onClick={() => onClose(false)} className="flex-1 py-6 px-6 bg-white/5 hover:bg-white/10 text-white rounded-3xl font-black text-lg transition-all border border-white/5 uppercase">SAVE CAPITAL</button>
            <button disabled={countdown > 0} onClick={() => onClose(true)} className={`flex-1 py-6 px-6 rounded-3xl font-black text-lg transition-all uppercase ${countdown > 0 ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-red-600 hover:bg-red-500 text-white shadow-2xl shadow-red-900/50'}`}>CONTINUE TO ERROR</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const LoadingOverlay: React.FC<{ message: string }> = ({ message }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center">
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        <div className="w-24 h-24 border-4 border-emerald-500/20 rounded-full animate-ping" />
        <div className="absolute inset-0 flex items-center justify-center">
          <BrainCircuit className="text-emerald-500 animate-pulse" size={40} />
        </div>
      </div>
      <div className="text-emerald-400 font-black uppercase tracking-[0.3em] text-xs animate-pulse text-center">{message}</div>
    </div>
  </motion.div>
);

const CandlestickChart: React.FC<{ data: any[], symbol: string, interval: string }> = ({ data, symbol, interval }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const smaRef = useRef<ISeriesApi<'Line'> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;
    chartRef.current = createChart(chartContainerRef.current, {
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: '#9ca3af', fontSize: 10 },
      grid: { vertLines: { color: 'rgba(255, 255, 255, 0.02)' }, horzLines: { color: 'rgba(255, 255, 255, 0.02)' } },
      crosshair: { mode: CrosshairMode.Normal, vertLine: { labelBackgroundColor: '#10b981', style: 2 }, horzLine: { labelBackgroundColor: '#10b981', style: 2 } },
      width: chartContainerRef.current.clientWidth, height: 450,
      timeScale: { borderColor: 'rgba(255, 255, 255, 0.05)', timeVisible: true, secondsVisible: false },
      rightPriceScale: { borderColor: 'rgba(255, 255, 255, 0.05)', scaleMargins: { top: 0.1, bottom: 0.2 } },
    });
    seriesRef.current = chartRef.current.addCandlestickSeries({ upColor: '#10b981', downColor: '#ef4444', borderVisible: false, wickUpColor: '#10b981', wickDownColor: '#ef4444' });
    smaRef.current = chartRef.current.addLineSeries({ color: 'rgba(59, 130, 246, 0.3)', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
    const handleResize = () => chartRef.current?.applyOptions({ width: chartContainerRef.current?.clientWidth || 0 });
    window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('resize', handleResize); if (chartRef.current) chartRef.current.remove(); };
  }, []);

  useEffect(() => {
    if (seriesRef.current && data.length > 0) {
      seriesRef.current.setData(data);
      const smaData = data.map((d, i) => {
          if (i < 20) return null;
          const subset = data.slice(i - 19, i + 1);
          const avg = subset.reduce((acc, curr) => acc + curr.close, 0) / 20;
          return { time: d.time, value: avg };
      }).filter(d => d !== null);
      if (smaRef.current) smaRef.current.setData(smaData as any);
      chartRef.current?.timeScale().fitContent();
    }
  }, [data]);

  return <div ref={chartContainerRef} className="w-full h-full" />;
};

// --- Main App ---

export default function GhostTradingCoach() {
  const [view, setView] = useState<'landing' | 'app'>('landing');
  const [activeTab, setActiveTab] = useState<'terminal' | 'dashboard' | 'history' | 'lessons'>('terminal');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [timeframe, setTimeframe] = useState('1m');
  const [lotSize, setLotSize] = useState(0.1);
  const [profile, setProfile] = useState<PsychologicalProfile>({
    topBias: 'None Detected', riskTolerance: 'Medium', streakCount: 0, fomoScore: 0, revengeTradeLikelihood: 0,
    capitalPreserved: 0, lastAnalysisTimestamp: Date.now(), summary: 'Starting audit...'
  });
  
  const [marketPrice, setMarketPrice] = useState(0);
  const [candleData, setCandleData] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [intervention, setIntervention] = useState<{ show: boolean, reason: string, riskAmount: number, evidenceTrades?: InterventionEvidence[], pendingTrade?: any } | null>(null);
  const [openTrade, setOpenTrade] = useState<Trade | null>(null);
  const [tradeReasoning, setTradeReasoning] = useState('');
  const [playbook, setPlaybook] = useState<Playbook | null>(null);
  const [mirrorResult, setMirrorResult] = useState<string | null>(null);

  // Initial Fetch from Neon (Local Storage Sync)
  useEffect(() => {
    const init = async () => {
      const savedTrades = await dbService.getTrades();
      const savedProfile = await dbService.getProfile();
      const savedPlaybook = await dbService.getPlaybook();
      setTrades(savedTrades);
      setPlaybook(savedPlaybook);
      if (savedProfile) setProfile(savedProfile);
    };
    init();
  }, [activeTab]);

  // Price Stream
  useEffect(() => {
    let ws: WebSocket;
    if (view !== 'app') return;
    const fetchHistory = async () => {
        const resp = await fetch(`https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=${timeframe}&limit=100`);
        const history = await resp.json();
        const formatted = history.map((k: any) => ({ time: k[0] / 1000, open: parseFloat(k[1]), high: parseFloat(k[2]), low: parseFloat(k[3]), close: parseFloat(k[4]) }));
        setCandleData(formatted);
    };
    fetchHistory();
    ws = new WebSocket(`wss://stream.binance.com:9443/ws/btcusdt@kline_${timeframe}`);
    ws.onopen = () => setIsWsConnected(true);
    ws.onmessage = (event) => {
        const k = JSON.parse(event.data).k;
        const price = parseFloat(k.c);
        setMarketPrice(price);
        if (k.x) {
          setCandleData(prev => [...prev.slice(-199), { time: k.t / 1000, open: parseFloat(k.o), high: parseFloat(k.h), low: parseFloat(k.l), close: price }]);
        }
    };
    return () => ws?.close();
  }, [timeframe, view]);

  const handleTradeIntent = async (type: 'BUY' | 'SELL') => {
    if (!tradeReasoning.trim()) return alert("Ghost requires reasoning to protect you.");
    setIsAnalyzing(true);
    const intentPrice = marketPrice;
    const intentTimestamp = Date.now();

    const result = await geminiService.analyzeTradeIntent(
      { type, price: intentPrice, reasoning: tradeReasoning, size: lotSize },
      candleData,
      trades,
      profile
    );
    setIsAnalyzing(false);
    if (result.interventionRequired) {
      setIntervention({ 
        show: true, reason: result.reason, riskAmount: result.estimatedRiskAmount, 
        evidenceTrades: result.evidenceTrades,
        pendingTrade: { type, intentPrice, intentTimestamp, reasoning: tradeReasoning, size: lotSize } 
      });
    } else {
      executeTrade(type, intentPrice, intentTimestamp, tradeReasoning, false, lotSize);
    }
  };

  const handleInterventionClose = async (proceed: boolean) => {
    if (proceed && intervention?.pendingTrade) {
      executeTrade(intervention.pendingTrade.type, intervention.pendingTrade.intentPrice, intervention.pendingTrade.intentTimestamp, intervention.pendingTrade.reasoning, true, intervention.pendingTrade.size);
    } else if (!proceed && intervention) {
      const updatedProfile = { ...profile, capitalPreserved: profile.capitalPreserved + intervention.riskAmount };
      setProfile(updatedProfile);
      await dbService.saveProfile(updatedProfile);
    }
    setIntervention(null);
  };

  const executeTrade = async (type: 'BUY' | 'SELL', intentPrice: number, intentTimestamp: number, reasoning: string, wasIntervened: boolean, size: number) => {
    const entryPrice = marketPrice;
    const slippage = type === 'BUY' ? entryPrice - intentPrice : intentPrice - entryPrice;

    setOpenTrade({ 
      id: Math.random().toString(36).substr(2, 9), 
      symbol: 'BTC/USDT', type, intentPrice, entryPrice, size, 
      timestamp: Date.now(), intentTimestamp, condition: MarketCondition.VOLATILE, 
      reasoning, wasIntervened, executionSlippage: slippage
    });
    setTradeReasoning('');
  };

  const closeTrade = async () => {
    if (!openTrade) return;
    setIsAnalyzing(true);
    const pnl = openTrade.type === 'BUY' 
      ? (marketPrice - openTrade.entryPrice) * openTrade.size 
      : (openTrade.entryPrice - marketPrice) * openTrade.size;
    
    const closed = { ...openTrade, exitPrice: marketPrice, exitTimestamp: Date.now(), pnl };
    
    const mirror = await geminiService.generatePostTradeMirror(closed, candleData);
    setMirrorResult(mirror);
    
    const updated = [closed, ...trades];
    setTrades(updated);
    await dbService.saveTrade(closed);
    setOpenTrade(null);
    setIsAnalyzing(false);
  };

  const generatePlaybook = async () => {
    if (trades.length === 0) return alert("Execute at least one trade to build your course.");
    setIsAnalyzing(true);
    try {
      const newPlaybook = await geminiService.generateFullPlaybook(trades, profile);
      setPlaybook(newPlaybook);
      await dbService.savePlaybook(newPlaybook);
    } catch (e) {
      alert("Neural synthesis failed.");
    }
    setIsAnalyzing(false);
  };

  const deletePlaybook = async () => {
    if (confirm("Reset Playbook?")) {
      setPlaybook(null);
      await dbService.deletePlaybook();
    }
  };

  const calculateLivePnl = () => {
    if (!openTrade) return 0;
    return openTrade.type === 'BUY' 
      ? (marketPrice - openTrade.entryPrice) * openTrade.size 
      : (openTrade.entryPrice - marketPrice) * openTrade.size;
  };

  // Helper for Dashboard Charts
  const chartData = trades.slice().reverse().map((t, idx) => ({
    name: idx,
    pnl: trades.slice(0, idx + 1).reduce((acc, curr) => acc + (curr.pnl || 0), 0)
  }));

  const biasData = [
    { name: 'FOMO', value: profile.fomoScore, color: '#ef4444' },
    { name: 'Revenge', value: profile.revengeTradeLikelihood * 100, color: '#f59e0b' },
    { name: 'Streak', value: profile.streakCount * 10, color: '#10b981' }
  ];

  if (view === 'landing') return <LandingPage onLaunch={() => setView('app')} />;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#020617] text-slate-100 overflow-hidden">
      <AnimatePresence>
        {isAnalyzing && <LoadingOverlay message="Auditing Logic..." />}
        {intervention?.show && <GhostOverlay reason={intervention.reason} riskAmount={intervention.riskAmount} evidenceTrades={intervention.evidenceTrades} onClose={handleInterventionClose} />}
      </AnimatePresence>

      <nav className="w-full md:w-24 bg-black/40 border-r border-white/5 flex flex-col items-center py-10 gap-12 backdrop-blur-xl">
        <div onClick={() => setView('landing')} className="p-4 bg-emerald-500/10 text-emerald-400 rounded-3xl cursor-pointer hover:scale-110 transition-transform"><Ghost size={32} /></div>
        <div className="flex flex-col gap-6 items-center">
          {[
            { id: 'terminal', icon: Zap },
            { id: 'dashboard', icon: LayoutDashboard },
            { id: 'history', icon: History },
            { id: 'lessons', icon: BookOpen }
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`p-4 rounded-2xl transition-all ${activeTab === tab.id ? 'bg-white/10 text-emerald-400' : 'text-slate-600 hover:text-slate-300'}`}><tab.icon size={24} /></button>
          ))}
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto p-6 md:p-12">
        <div className="max-w-7xl mx-auto space-y-8">
          {activeTab === 'terminal' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-8">
                <header className="flex justify-between items-center">
                  <div>
                    <h1 className="text-4xl font-black text-white tracking-tighter uppercase">BTC / USDT</h1>
                    <GhostHUD riskScore={profile.fomoScore} bias={profile.topBias} />
                  </div>
                  <div className="text-right">
                    <div className={`text-5xl font-black mono ${marketPrice > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>${marketPrice.toLocaleString()}</div>
                  </div>
                </header>
                <div className="glass rounded-[2rem] p-6 h-[400px] border-white/5 shadow-2xl overflow-hidden relative">
                   <CandlestickChart data={candleData} symbol="BTCUSDT" interval={timeframe} />
                </div>
                <div className="grid grid-cols-3 gap-6">
                   <div className="glass p-6 rounded-3xl border-white/5"><div className="text-[10px] uppercase font-black text-slate-500 mb-1">Timeframe</div><TimeframeControls current={timeframe} onChange={setTimeframe} /></div>
                   <div className="glass p-6 rounded-3xl border-white/5"><div className="text-[10px] uppercase font-black text-slate-500 mb-2">Lot Size</div>
                    <div className="flex gap-2">
                       {[0.01, 0.1, 1.0].map(s => <button key={s} onClick={() => setLotSize(s)} className={`flex-1 py-1 rounded-lg text-[10px] font-bold border ${lotSize === s ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'border-white/5 text-slate-600'}`}>{s}</button>)}
                    </div>
                   </div>
                   <div className="glass p-6 rounded-3xl border-white/5"><div className="text-[10px] uppercase font-black text-slate-500 mb-1">Total Saved</div><div className="text-xl font-black text-emerald-400">${profile.capitalPreserved.toFixed(2)}</div></div>
                </div>
              </div>

              <div className="lg:col-span-4 flex flex-col gap-6">
                <div className="glass rounded-[2rem] p-8 border-white/10 flex flex-col flex-1 shadow-2xl relative">
                  <h2 className="text-xl font-black mb-6 uppercase flex items-center gap-2"><Zap className="text-emerald-400" size={20} /> Order Engine</h2>
                  {mirrorResult && <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-xs italic text-blue-200">"{mirrorResult}"</div>}
                  {openTrade ? (
                    <div className="space-y-6 flex-1 flex flex-col justify-between">
                      <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                        <div className="flex justify-between items-center mb-4"><span className={`text-[10px] font-black uppercase ${openTrade.type === 'BUY' ? 'text-emerald-400' : 'text-rose-500'}`}>{openTrade.type} ACTIVE</span><span className="text-xs font-bold">{openTrade.size} BTC</span></div>
                        <div className="flex justify-between items-end">
                          <div><div className="text-[10px] text-slate-500 uppercase font-black">Entry</div><div className="text-lg font-bold">${openTrade.entryPrice.toFixed(2)}</div></div>
                          <div className="text-right"><div className="text-[10px] text-slate-500 uppercase font-black">PnL</div><div className={`text-3xl font-black ${calculateLivePnl() >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>${calculateLivePnl().toFixed(2)}</div></div>
                        </div>
                      </div>
                      <button onClick={closeTrade} className="w-full py-6 bg-rose-600 hover:bg-rose-500 rounded-3xl font-black text-xl uppercase tracking-widest shadow-xl shadow-rose-900/40">Liquidate Pos</button>
                    </div>
                  ) : (
                    <div className="space-y-6 flex-1 flex flex-col justify-between">
                      <textarea value={tradeReasoning} onChange={(e) => setTradeReasoning(e.target.value)} placeholder="Log intent reasoning..." className="w-full flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:border-emerald-500/50 outline-none resize-none" />
                      <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => handleTradeIntent('BUY')} className="py-6 bg-emerald-600 hover:bg-emerald-700 rounded-2xl font-black text-white uppercase text-sm shadow-xl shadow-emerald-900/20">Buy (Long)</button>
                        <button onClick={() => handleTradeIntent('SELL')} className="py-6 bg-rose-600 hover:bg-rose-700 rounded-2xl font-black text-white uppercase text-sm shadow-xl shadow-rose-900/20">Sell (Short)</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <header className="flex justify-between items-end">
                 <div>
                    <h2 className="text-4xl font-black uppercase tracking-tighter">Behavioral Audit</h2>
                    <p className="text-slate-500 mt-1">Real-time performance metrics and emotional risk levels.</p>
                 </div>
                 <div className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/5 px-4 py-2 rounded-xl border border-emerald-500/20 flex items-center gap-2">
                    <Activity size={14} /> Pattern Monitoring Active
                 </div>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                 {[
                   { label: 'Saved Capital', val: `$${profile.capitalPreserved.toFixed(2)}`, color: 'text-emerald-400', icon: ShieldCheck, sub: 'Losses Prevented' },
                   { label: 'Session PnL', val: `$${trades.reduce((acc, t) => acc + (t.pnl || 0), 0).toFixed(2)}`, color: 'text-white', icon: DollarSign, sub: 'Net Performance' },
                   { label: 'FOMO Index', val: `${profile.fomoScore}%`, color: 'text-rose-400', icon: ShieldAlert, sub: 'Impulse Level' },
                   { label: 'Dominant Bias', val: profile.topBias, color: 'text-blue-400', icon: BrainCircuit, sub: 'Ghost Verdict' }
                 ].map((stat, i) => (
                   <div key={i} className="glass p-8 rounded-[2rem] border-white/5 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><stat.icon size={80} /></div>
                      <div className="flex items-center gap-3 mb-6">
                        <div className={`p-2 bg-white/5 rounded-xl ${stat.color}`}><stat.icon size={18} /></div>
                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{stat.sub}</span>
                      </div>
                      <div className="text-xs text-slate-400 font-bold uppercase mb-1">{stat.label}</div>
                      <div className={`text-3xl font-black ${stat.color} tracking-tighter truncate`}>{stat.val}</div>
                   </div>
                 ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 glass p-10 rounded-[2.5rem] border-white/5 h-[400px]">
                   <h3 className="text-lg font-black uppercase mb-8 flex items-center gap-3"><TrendingUp size={20} className="text-emerald-400" /> Equity & Persistence Curve</h3>
                   <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                        <XAxis dataKey="name" hide />
                        <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                        <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '12px', fontSize: '10px' }} />
                        <Area type="monotone" dataKey="pnl" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorPnl)" />
                      </AreaChart>
                    </ResponsiveContainer>
                   </div>
                </div>

                <div className="glass p-10 rounded-[2.5rem] border-white/5 flex flex-col">
                   <h3 className="text-lg font-black uppercase mb-8 flex items-center gap-3"><ShieldAlert size={20} className="text-rose-500" /> Pattern Breakdown</h3>
                   <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={biasData} layout="vertical">
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} width={60} />
                        <RechartsTooltip cursor={{ fill: '#ffffff05' }} contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '10px' }} />
                        <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={24}>
                          {biasData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                   </div>
                   <div className="mt-8 p-6 bg-white/5 rounded-3xl text-center">
                      <div className="text-[10px] font-black uppercase text-slate-500 mb-2">Overall Resilience</div>
                      <div className="text-2xl font-black text-white">{Math.max(0, 100 - profile.fomoScore).toFixed(0)}%</div>
                   </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'history' && (
            <div className="glass rounded-[2rem] overflow-hidden border-white/5">
              <div className="p-8 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                <h2 className="text-2xl font-black uppercase tracking-tighter">Session Archive</h2>
                <div className="text-[10px] font-black uppercase text-slate-500 bg-white/5 px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
                  <Database size={12} className="text-emerald-400" /> Synced to Neon
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                   <thead><tr className="bg-white/5"><th className="px-8 py-4 font-black text-[10px] uppercase text-slate-500">Asset / Direction</th><th className="px-8 py-4 font-black text-[10px] uppercase text-slate-500">Result</th><th className="px-8 py-4 font-black text-[10px] uppercase text-slate-500">Lot</th><th className="px-8 py-4 font-black text-[10px] uppercase text-slate-500">Reasoning</th><th className="px-8 py-4 font-black text-[10px] uppercase text-slate-500 text-right">Timestamp</th></tr></thead>
                   <tbody className="divide-y divide-white/5">
                    {trades.length > 0 ? trades.map((t) => (
                      <tr key={t.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-8 py-6 font-bold">BTC/USDT <span className={t.type === 'BUY' ? 'text-emerald-500' : 'text-rose-500'}>{t.type}</span></td>
                        <td className={`px-8 py-6 font-black ${t.pnl && t.pnl >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>${t.pnl?.toFixed(2)}</td>
                        <td className="px-8 py-6 text-slate-400">{t.size}</td>
                        <td className="px-8 py-6 text-xs text-slate-500 truncate max-w-xs">{t.reasoning}</td>
                        <td className="px-8 py-6 text-right text-[10px] mono text-slate-600">{new Date(t.timestamp).toLocaleString()}</td>
                      </tr>
                    )) : <tr><td colSpan={5} className="p-20 text-center text-slate-600 uppercase font-black">Archive Empty</td></tr>}
                   </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'lessons' && (
            <div className="space-y-8">
              <header className="flex justify-between items-end">
                <div><h2 className="text-4xl font-black uppercase tracking-tighter">Brain Archive</h2><p className="text-slate-500 mt-1">Personalized Course Synthesized from Neon Archives.</p></div>
                <div className="flex gap-4">
                  {playbook && <button onClick={deletePlaybook} className="px-6 py-3 bg-rose-500/10 text-rose-500 rounded-2xl font-black uppercase text-[10px] border border-rose-500/20"><Trash2 size={16} /></button>}
                  <button onClick={generatePlaybook} className="px-8 py-3 bg-emerald-500 text-black rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-emerald-500/20">{playbook ? 'Update Course' : 'Synthesize Playbook'}</button>
                </div>
              </header>
              {playbook ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   {playbook.modules.map((m, i) => (
                     <div key={i} className="glass p-8 rounded-[2rem] border-white/5 hover:border-emerald-500/20 transition-all">
                       <div className="flex justify-between items-start mb-6"><div className="px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase border border-emerald-500/10">{m.type}</div></div>
                       <h3 className="text-2xl font-black mb-4 uppercase tracking-tighter">{m.title}</h3>
                       <p className="text-slate-400 text-sm leading-relaxed">{m.content}</p>
                     </div>
                   ))}
                </div>
              ) : (
                <div className="glass p-24 rounded-[3rem] border-dashed border-white/10 text-center flex flex-col items-center">
                   <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-8 text-slate-600"><BookOpen size={40} /></div>
                   <h3 className="text-2xl font-black mb-4">No Active Playbook</h3>
                   <p className="text-slate-500 max-w-md">The Brain Archive is empty.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
