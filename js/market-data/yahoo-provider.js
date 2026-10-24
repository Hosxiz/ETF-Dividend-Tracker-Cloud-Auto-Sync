/**
 * yahoo-provider.js
 * Fetches ETF dividend data via Yahoo Finance v8 chart API with CORS Proxy and Mock fallback.
 */

import { MOCK_ETF_DATA } from './mock-provider.js';
import { DividendCalculator } from '../portfolio/dividend-calc.js';

export class YahooFinanceProvider {
  /**
   * Fetches dividend records and current price for a ticker
   * @param {string} ticker 
   * @returns {Promise<{ticker: string, lastPrice: number, dividends: Array, estimatedAnnualPayoutPerShare: number, isFallback?: boolean}>}
   */
  static async fetchETFData(ticker) {
    const cleanTicker = ticker.trim().toUpperCase();
    const yahooUrl = `https://query2.finance.yahoo.com/v8/finance/chart/${cleanTicker}?events=div&interval=1d&range=2y`;

    // Strategy 1: Fast CORS Proxies
    const proxies = [
      `https://api.allorigins.win/raw?url=${encodeURIComponent(yahooUrl)}`,
      `https://corsproxy.io/?url=${encodeURIComponent(yahooUrl)}`
    ];

    for (const proxyUrl of proxies) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4500);
        const resp = await fetch(proxyUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (resp.ok) {
          const json = await resp.json();
          const parsed = this._parseYahooResponse(cleanTicker, json);
          if (parsed && parsed.dividends) return parsed;
        }
      } catch (err) {
        // Continue to next proxy
      }
    }

    // Attempt 2: Direct Fetch (works if browser allows or extension installed)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const directResp = await fetch(yahooUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (directResp.ok) {
        const json = await directResp.json();
        const parsed = this._parseYahooResponse(cleanTicker, json);
        if (parsed) return parsed;
      }
    } catch (e) {
      // Direct CORS blocked, proceed to fallback
    }

    // Fallback: Built-in Mock or Generative Fallback
    return this._getFallbackData(cleanTicker);
  }

  static _parseYahooResponse(ticker, data) {
    try {
      const result = data?.chart?.result?.[0];
      if (!result) return null;

      const meta = result.meta || {};
      const regularMarketPrice = meta.regularMarketPrice || 0;
      const rawDivs = result.events?.dividends || {};

      const dividends = Object.values(rawDivs)
        .map(d => {
          const dateObj = new Date(d.date * 1000);
          const payDateObj = new Date((d.date + 15 * 86400) * 1000); // Approximate paydate ~15d if missing
          return {
            exDate: dateObj.toISOString().split('T')[0],
            payDate: payDateObj.toISOString().split('T')[0],
            amountPerShare: parseFloat(d.amount.toFixed(4))
          };
        })
        .sort((a, b) => new Date(b.exDate) - new Date(a.exDate))
        .slice(0, 8); // Keep last 8 records

      const annualRate = DividendCalculator.estimateAnnualRate(dividends);

      return {
        ticker,
        lastPrice: regularMarketPrice,
        currency: meta.currency || 'USD',
        dividends,
        estimatedAnnualPayoutPerShare: annualRate,
        isFallback: false
      };
    } catch (e) {
      console.error('Failed to parse Yahoo response:', e);
      return null;
    }
  }

  static _getFallbackData(ticker) {
    if (MOCK_ETF_DATA[ticker]) {
      return { ...MOCK_ETF_DATA[ticker], isFallback: true };
    }

    // Generic fallback if unknown ticker
    const today = new Date();
    const nextMonth = new Date(today.getTime() + 14 * 86400000);
    const payDate = new Date(today.getTime() + 28 * 86400000);

    return {
      ticker,
      currency: 'USD',
      lastPrice: 50.00,
      estimatedAnnualPayoutPerShare: 2.00,
      isFallback: true,
      dividends: [
        {
          exDate: nextMonth.toISOString().split('T')[0],
          payDate: payDate.toISOString().split('T')[0],
          amountPerShare: 0.50
        }
      ]
    };
  }
}
