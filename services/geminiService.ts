
import { GoogleGenAI, Type } from "@google/genai";
import { Trade, PsychologicalProfile, Lesson, Playbook } from "../types";

// Always use process.env.API_KEY directly in the constructor.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface InterventionEvidence {
  tradeId: string;
  pnl: number;
  date: string;
  reason: string;
}

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
      
      In your response, if interventionRequired is true, pick 1-2 SPECIFIC trade IDs from the history that match this bad behavior.
      Calculate estimatedRiskAmount based on the provided trade size and volatility.
      
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
      return { interventionRequired: false, reason: "", estimatedRiskAmount: 0 };
    }
  },

  async generatePostTradeMirror(trade: Trade, marketContext: any[]): Promise<string> {
    const slippageInfo = trade.executionSlippage && trade.executionSlippage !== 0 
      ? `NOTE: The system caused a slippage of $${trade.executionSlippage.toFixed(2)} between the user's intent and actual entry.`
      : "";

    const prompt = `
      Perform a "Brutal Mirror" analysis on this completed trade.
      Trade Type: ${trade.type}
      Size: ${trade.size}
      User intent price: $${trade.intentPrice.toFixed(2)}
      Actual entry price: $${trade.entryPrice.toFixed(2)}
      User reasoning was: "${trade.reasoning}"
      Outcome: ${trade.pnl && trade.pnl > 0 ? 'WIN' : 'LOSS'} ($${trade.pnl?.toFixed(2)})
      ${slippageInfo}
      
      Task: Explain the gap between the user's expectation and what actually happened. 
      IMPORTANT: If the user's idea was correct at their intent price, but the system's analysis delay or intervention caused them to enter at a worse price leading to a loss, ACKNOWLEDGE that this was an "Execution Cost" and defend the user's logic while explaining why the intervention (if any) was still psychologically valuable.
      Limit to 2-3 piercing sentences.
    `;
    
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
    const prompt = `
      As GHOST, analyze this trader's complete history: ${JSON.stringify(tradeHistory)}.
      Profile Context: ${JSON.stringify(profile)}.
      
      TASK: Synthesize a "Personalized Master Strategy Course". 
      Focus on their specific strategies, behavioral biases (FOMO score: ${profile.fomoScore}), and recurring technical errors.
      
      Structure the response as a Playbook object with exactly 4 modules:
      1. PRINCIPLE: A foundational rule they MUST follow.
      2. MISTAKE: A deep analysis of their most frequent error.
      3. PATTERN: A behavioral pattern recognition guide.
      4. PROTOCOL: A step-by-step execution protocol for their edge.

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
              title: { type: Type.STRING },
              summary: { type: Type.STRING },
              modules: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    content: { type: Type.STRING },
                    type: { type: Type.STRING, enum: ['principle', 'mistake', 'pattern', 'protocol'] },
                    visualAidType: { type: Type.STRING, enum: ['bar', 'list', 'warning'] }
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
    if (tradeHistory.length === 0) return [];
    const prompt = `
      Analyze this specific trader's history: ${JSON.stringify(tradeHistory.slice(-15))}.
      TASK: Generate a high-quality "Personalized Trading Playbook" entry.
      Structure: Title, Content (Symptom, Root Cause, Protocol), Category ('Risk', 'Psychology', or 'Technical').
      Return an array containing one new comprehensive lesson.
    `;
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                content: { type: Type.STRING },
                category: { type: Type.STRING },
                relevantTradeIds: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ['id', 'title', 'content', 'category', 'relevantTradeIds']
            }
          }
        }
      });
      return JSON.parse(response.text || '[]');
    } catch (e) {
      console.error("Lesson generation failed", e);
      return [];
    }
  }
};
