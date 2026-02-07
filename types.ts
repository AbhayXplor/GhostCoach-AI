
export enum MarketCondition {
  TRENDING_UP = 'Trending Up',
  TRENDING_DOWN = 'Trending Down',
  RANGING = 'Ranging',
  VOLATILE = 'High Volatility',
}

export interface Trade {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  intentPrice: number;
  entryPrice: number;
  exitPrice?: number;
  size: number;
  pnl?: number;
  timestamp: number;
  intentTimestamp: number;
  exitTimestamp?: number;
  condition: MarketCondition;
  reasoning: string;
  biasDetected?: string[];
  wasIntervened: boolean;
  capitalSaved?: number; 
  executionSlippage?: number;
}

export interface PsychologicalProfile {
  topBias: string;
  riskTolerance: 'Low' | 'Medium' | 'High';
  streakCount: number;
  fomoScore: number;
  revengeTradeLikelihood: number;
  capitalPreserved: number; 
  lastAnalysisTimestamp: number;
  summary: string;
}

export interface PlaybookModule {
  title: string;
  content: string;
  type: 'principle' | 'mistake' | 'pattern' | 'protocol';
  visualAidType?: 'bar' | 'list' | 'warning'; // Meta-info for UI rendering
}

export interface Playbook {
  id: string;
  title: string;
  summary: string;
  modules: PlaybookModule[];
  generatedAt: number;
  tradeCount: number;
}

export interface Lesson {
  id: string;
  title: string;
  content: string;
  category: 'Risk' | 'Psychology' | 'Technical';
  relevantTradeIds: string[];
}
