/**
 * portfolio-store.js
 * Handles LocalStorage persistence for user's ETF holdings and app settings.
 */

const STORAGE_KEYS = {
  HOLDINGS: 'etf_tracker_holdings',
  SETTINGS: 'etf_tracker_settings',
  MARKET_CACHE: 'etf_tracker_market_cache',
};

export class PortfolioStore {
  /**
   * Retrieves all user holdings
   * @returns {Array<{ticker: string, shares: number, averageCostUSD?: number, updatedAt: string}>}
   */
  static getHoldings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HOLDINGS);
      if (!data) {
        // Default seed holding as required in brief: CHPY
        return [{ ticker: 'CHPY', shares: 0.1145716, averageCostUSD: 42.50, updatedAt: new Date().toISOString() }];
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to read holdings from storage:', e);
      return [];
    }
  }

  /**
   * Saves holdings array to LocalStorage
   * @param {Array} holdings 
   */
  static saveHoldings(holdings) {
    try {
      localStorage.setItem(STORAGE_KEYS.HOLDINGS, JSON.stringify(holdings));
    } catch (e) {
      console.error('Failed to save holdings:', e);
    }
  }

  /**
   * Adds or updates a ticker holding
   * @param {string} ticker 
   * @param {number} shares 
   * @param {number} [averageCostUSD] 
   */
  static upsertHolding(ticker, shares, averageCostUSD = 0) {
    const cleanTicker = ticker.trim().toUpperCase();
    const holdings = this.getHoldings();
    const existingIndex = holdings.findIndex(h => h.ticker === cleanTicker);

    const record = {
      ticker: cleanTicker,
      shares: Number(shares) || 0,
      averageCostUSD: Number(averageCostUSD) || 0,
      updatedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      holdings[existingIndex] = record;
    } else {
      holdings.push(record);
    }

    this.saveHoldings(holdings);
    return holdings;
  }

  /**
   * Removes a ticker holding
   * @param {string} ticker 
   */
  static removeHolding(ticker) {
    const cleanTicker = ticker.trim().toUpperCase();
    const holdings = this.getHoldings().filter(h => h.ticker !== cleanTicker);
    this.saveHoldings(holdings);
    return holdings;
  }

  /**
   * Retrieves application settings (e.g. Discord webhook)
   */
  static getSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? JSON.parse(data) : { discordWebhookUrl: '', gasWebAppUrl: '' };
    } catch (e) {
      return { discordWebhookUrl: '', gasWebAppUrl: '' };
    }
  }

  /**
   * Saves settings
   * @param {object} settings 
   */
  static saveSettings(settings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }
}
