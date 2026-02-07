import { GoogleGenAI, Type } from "@google/genai";
import { Trade, PsychologicalProfile, Lesson, Playbook } from "../types";

export interface InterventionEvidence {
  tradeId: string;
  pnl: number;
  date: string;
  reason: string;
}

// Function to get a fresh instance of AI with the latest API key
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const geminiService = {
  async analyzeTradeIntent(
    currentIntent: { type: 'BUY' | 'SELL', price: number, reasoning: string, size: number },
    recentCandles: any[],
    tradeHistory: Trade[],
    profile: PsychologicalProfile
  ): Promise<{ 
    interventionRequired: boolean, 
    reason: string, 
    evidenceSummary?: string,
    evidenceTrades?: InterventionEvidence[],
    estimatedRiskAmount: number 
  }> {
    const ai = getAI();
    const losingTrades = tradeHistory.filter(t => (t.pnl || 0) < 0).slice(0, 5);
    
    const prompt = `
      As GHOST, a high-stakes behavioral trading coach, analyze this intent.
      
      TRADER INTENT:
      - Action: ${currentIntent.type}
      - Size: ${currentIntent.size} BTC
      - Intent Price: $${currentIntent.price}
      - Reasoning: "${currentIntent.reasoning}"
      
      MARKET CONTEXT (Recent 10 Candles):
      ${JSON.stringify(recentCandles.slice(-10))}
      
      Losing Trade History (Context for pattern matching):
      ${JSON.stringify(losingTrades.map(t => ({ id: t.id, pnl: t.pnl, reasoning: t.reasoning, date: new Date(t.timestamp).toLocaleDateString() })))}
      
      TASK:
      Perform deep reasoning. Check if this trade matches a recurring losing pattern (e.g. FOMO, Revenge, Ignoring Trend).
      If the user's reasoning is weak or contradicts the candles, intervention is REQUIRED.
      
      Respond in JSON.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              interventionRequired: { type: Type.BOOLEAN },
              reason: { type: Type.STRING },
              evidenceSummary: { type: Type.STRING },
              evidenceTrades: { 
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    tradeId: { type: Type.STRING },
                    pnl: { type: Type.NUMBER },
                    date: { type: Type.STRING },
                    reason: { type: Type.STRING }
                  },
                  required: ['tradeId', 'pnl', 'date', 'reason']
                }
              },
              estimatedRiskAmount: { type: Type.NUMBER }
            },
            required: ['interventionRequired', 'reason', 'estimatedRiskAmount']
          }
        }
      });
      return JSON.parse(response.text || '{}');
    } catch (e) {
      console.error("Gemini Analysis Failed", e);
      return { interventionRequired: false, reason: "Analysis Error", estimatedRiskAmount: 0 };
    }
  },

  async generatePostTradeMirror(trade: Trade, marketContext: any[]): Promise<string> {
    const ai = getAI();
    const prompt = `Perform a brutal mirror analysis on this trade: ${JSON.stringify(trade)}. Explain the gap between intent and outcome in 2 sentences.`;
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });
      return response.text || "Analysis complete.";
    } catch (e) {
      return "Mirror unavailable.";
    }
  },

  async generateFullPlaybook(tradeHistory: Trade[], profile: PsychologicalProfile): Promise<Playbook> {
    const ai = getAI();
    const prompt = `Synthesize a personalized trading playbook for a user with these trades: ${JSON.stringify(tradeHistory)}. Respond in JSON with modules: principle, mistake, pattern, protocol.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              summary: { type: Type.STRING },
              modules: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    content: { type: Type.STRING },
                    type: { type: Type.STRING, enum: ['principle', 'mistake', 'pattern', 'protocol'] }
                  },
                  required: ['title', 'content', 'type']
                }
              }
            },
            required: ['title', 'summary', 'modules']
          }
        }
      });
      const data = JSON.parse(response.text || '{}');
      return {
        ...data,
        id: Math.random().toString(36).substr(2, 9),
        generatedAt: Date.now(),
        tradeCount: tradeHistory.length
      };
    } catch (e) {
      console.error("Playbook synthesis failed", e);
      throw e;
    }
  },

  async generatePersonalizedLessons(tradeHistory: Trade[]): Promise<Lesson[]> {
    const ai = getAI();
    if (tradeHistory.length === 0) return [];
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: "Generate 1 specific trading lesson based on history.",
        config: { responseMimeType: 'application/json' }
      });
      return JSON.parse(response.text || '[]');
    } catch (e) {
      return [];
    }
  }
};