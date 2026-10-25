/**
 * yahoo-provider.js
 * Fetches ETF dividend data via Google Apps Script Data Bridge (Real-time 100%) or Yahoo Finance API.
 */

import { DividendCalculator } from '../portfolio/dividend-calc.js';
import { PortfolioStore } from '../portfolio/portfolio-store.js';

export class YahooFinanceProvider {
  /**
   * Fetches dividend records and current price for a ticker
   * @param {string} ticker 
   * @returns {Promise<{ticker: string, lastPrice: number, dividends: Array, estimatedAnnualPayoutPerShare: number, isFallback?: boolean}>}
   */
  static async fetchETFData(ticker) {
    const cleanTicker = ticker.trim().toUpperCase();
    const settings = PortfolioStore.getSettings();
    const gasUrl = settings.gasWebAppUrl?.trim();

    // Strategy 1: Google Apps Script Web App Bridge (ไม่มีปัญหา CORS, ดึงข้อมูลสดจากตลาด 100%)
    if (gasUrl && gasUrl.startsWith('https://script.google.com/')) {
      try {
        const bridgeUrl = `${gasUrl}${gasUrl.includes('?') ? '&' : '?'}action=market_data&ticker=${encodeURIComponent(cleanTicker)}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const resp = await fetch(bridgeUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (resp.ok) {
          const res = await resp.json();
          if (res.success && res.data && res.data.dividends?.length > 0) {
            return {
              ticker: cleanTicker,
              lastPrice: res.data.lastPrice || 0,
              currency: res.data.currency || 'USD',
              frequency: res.data.frequency || 'Standard',
              dividends: res.data.dividends,
              estimatedAnnualPayoutPerShare: res.data.estimatedAnnualPayoutPerShare || DividendCalculator.estimateAnnualRate(res.data.dividends),
              isFallback: false
            };
          }
        }
      } catch (err) {
        console.warn(`[GAS Bridge] Failed to fetch live data for ${cleanTicker}:`, err);
      }
    }

    // Strategy 2: Fast Multi-CORS Proxies to Yahoo Finance
    const yahooUrl = `https://query2.finance.yahoo.com/v8/finance/chart/${cleanTicker}?events=div&interval=1d&range=2y`;
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
          if (parsed && parsed.dividends?.length > 0) return parsed;
        }
      } catch (err) {
        // Continue to next proxy
      }
    }

    // Strategy 3: Direct Fetch (if allowed by browser environment)
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
      // Direct CORS blocked
    }

    // กรณีดึงไม่ได้จริง ๆ ให้ return ข้อมูลว่างและแจ้งเตือนตรง ๆ ไม่สร้างข้อมูล Mock ปลอม
    return {
      ticker: cleanTicker,
      currency: 'USD',
      lastPrice: 0,
      estimatedAnnualPayoutPerShare: 0,
      dividends: [],
      error: 'ไม่สามารถดึงข้อมูลสดจากตลาดได้ กรุณาตรวจสอบการเชื่อมต่อหรือ Google Apps Script URL',
      isFallback: false
    };
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
