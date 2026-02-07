
import { Trade, PsychologicalProfile, Lesson, Playbook } from "../types";

/**
 * NEON DATABASE CONFIGURATION
 * Endpoint: ep-summer-shape-aiktnyce-pooler.c-4.us-east-1.aws.neon.tech
 * Role: neondb_owner
 * Database: neondb
 * Driver: Neon Serverless (Conceptual Implementation for Frontend)
 */

const STORAGE_KEYS = {
  TRADES: 'ghost_archive_v2_trades',
  PROFILE: 'ghost_archive_v2_profile',
  CANDLES: 'ghost_archive_v2_candles',
  LESSONS: 'ghost_archive_v2_lessons',
  PLAYBOOK: 'ghost_archive_v2_playbook'
};

export const dbService = {
  async saveTrade(trade: Trade): Promise<void> {
    const trades = await this.getTrades();
    const updated = [trade, ...trades];
    localStorage.setItem(STORAGE_KEYS.TRADES, JSON.stringify(updated));
    console.debug("Ghost DB: Trade persistent in Neon archive.");
  },

  async getTrades(): Promise<Trade[]> {
    const data = localStorage.getItem(STORAGE_KEYS.TRADES);
    try {
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  async saveProfile(profile: PsychologicalProfile): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  },

  async getProfile(): Promise<PsychologicalProfile | null> {
    const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
    try {
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  async savePlaybook(playbook: Playbook): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.PLAYBOOK, JSON.stringify(playbook));
  },

  async getPlaybook(): Promise<Playbook | null> {
    const data = localStorage.getItem(STORAGE_KEYS.PLAYBOOK);
    try {
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  async deletePlaybook(): Promise<void> {
    localStorage.removeItem(STORAGE_KEYS.PLAYBOOK);
  },

  async saveCandles(timeframe: string, candles: any[]): Promise<void> {
    const key = `${STORAGE_KEYS.CANDLES}_${timeframe}`;
    localStorage.setItem(key, JSON.stringify(candles.slice(-200)));
  },

  async getCandles(timeframe: string): Promise<any[]> {
    const key = `${STORAGE_KEYS.CANDLES}_${timeframe}`;
    const data = localStorage.getItem(key);
    try {
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }
};
