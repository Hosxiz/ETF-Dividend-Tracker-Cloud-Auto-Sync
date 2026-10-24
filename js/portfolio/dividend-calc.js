/**
 * dividend-calc.js
 * Calculation domain logic for payouts, annual estimates, and 30-day upcoming schedules.
 */

export class DividendCalculator {
  /**
   * Formats a date string (YYYY-MM-DD or ISO) into readable Thai format (เช่น 1 ต.ค. 2569)
   * @param {string|Date} dateInput 
   * @returns {string}
   */
  static formatThaiDate(dateInput) {
    if (!dateInput) return '—';
    try {
      const d = new Date(dateInput);
      if (isNaN(d.getTime())) return String(dateInput);

      const thaiMonths = [
        'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
        'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
      ];

      const day = d.getDate();
      const month = thaiMonths[d.getMonth()];
      const thaiYear = d.getFullYear() + 543;

      return `${day} ${month} ${thaiYear}`;
    } catch (e) {
      return String(dateInput);
    }
  }

  /**
   * Calculates estimated payout for a given shares count and rate
   * @param {number} shares 
   * @param {number} amountPerShare 
   * @returns {number}
   */
  static calculatePayout(shares, amountPerShare) {
    const s = Number(shares) || 0;
    const rate = Number(amountPerShare) || 0;
    return parseFloat((s * rate).toFixed(4));
  }

  /**
   * Estimates annual dividend based on historical interval (Weekly: x52, Monthly: x12, Quarterly: x4)
   * @param {Array<{amountPerShare: number, exDate?: string}>} recentDividends 
   * @returns {number}
   */
  static estimateAnnualRate(recentDividends = []) {
    if (!recentDividends || recentDividends.length === 0) return 0;
    
    // Sort descending by date
    const sorted = [...recentDividends].sort((a, b) => new Date(b.exDate || 0) - new Date(a.exDate || 0));
    const sliceCount = Math.min(sorted.length, 6);
    const avgAmount = sorted.slice(0, sliceCount).reduce((acc, d) => acc + (d.amountPerShare || 0), 0) / sliceCount;

    // Detect frequency from average days between payments
    let multiplier = 4; // Default quarterly
    if (sorted.length >= 2 && sorted[0].exDate && sorted[1].exDate) {
      const diffDays = Math.abs((new Date(sorted[0].exDate) - new Date(sorted[1].exDate)) / 86400000);
      if (diffDays <= 12) {
        multiplier = 52; // Weekly (เช่น CHPY)
      } else if (diffDays <= 45) {
        multiplier = 12; // Monthly (เช่น JEPI, JEPQ)
      } else {
        multiplier = 4;  // Quarterly (เช่น SCHD, SPY)
      }
    }

    const annualized = avgAmount * multiplier;
    return parseFloat(annualized.toFixed(4));
  }

  /**
   * Checks if an event date falls within the next N days
   * @param {string} dateString YYYY-MM-DD
   * @param {number} [daysAhead=30] 
   * @returns {boolean}
   */
  static isWithinDays(dateString, daysAhead = 30) {
    if (!dateString) return false;
    const targetDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const futureLimit = new Date();
    futureLimit.setDate(today.getDate() + daysAhead);
    futureLimit.setHours(23, 59, 59, 999);

    return targetDate >= today && targetDate <= futureLimit;
  }

  /**
   * Computes portfolio aggregate summary
   * @param {Array} holdings 
   * @param {Map<string, object>} marketDataMap 
   * @param {number} [usdThbRate=36.0] 
   */
  static computePortfolioSummary(holdings = [], marketDataMap = new Map(), usdThbRate = 36.0) {
    let totalAnnualUSD = 0;
    let upcomingCount = 0;
    const upcomingList = [];

    holdings.forEach(h => {
      const mData = marketDataMap.get(h.ticker);
      const annualRate = mData?.estimatedAnnualPayoutPerShare || 0;
      const annualPayout = this.calculatePayout(h.shares, annualRate);
      totalAnnualUSD += annualPayout;

      // Scan dividends for upcoming within 30 days
      if (mData?.dividends) {
        mData.dividends.forEach(d => {
          if (this.isWithinDays(d.payDate, 30) || this.isWithinDays(d.exDate, 30)) {
            upcomingCount += 1;
            upcomingList.push({
              ticker: h.ticker,
              shares: h.shares,
              exDate: d.exDate,
              payDate: d.payDate,
              amountPerShare: d.amountPerShare,
              estimatedPayoutUSD: this.calculatePayout(h.shares, d.amountPerShare),
              estimatedPayoutTHB: parseFloat((this.calculatePayout(h.shares, d.amountPerShare) * usdThbRate).toFixed(2))
            });
          }
        });
      }
    });

    return {
      totalHoldings: holdings.length,
      totalAnnualUSD: parseFloat(totalAnnualUSD.toFixed(2)),
      totalAnnualTHB: parseFloat((totalAnnualUSD * usdThbRate).toFixed(2)),
      totalMonthlyUSD: parseFloat((totalAnnualUSD / 12).toFixed(2)),
      totalMonthlyTHB: parseFloat(((totalAnnualUSD * usdThbRate) / 12).toFixed(2)),
      totalWeeklyUSD: parseFloat((totalAnnualUSD / 52).toFixed(2)),
      totalWeeklyTHB: parseFloat(((totalAnnualUSD * usdThbRate) / 52).toFixed(2)),
      upcomingCount,
      upcomingList
    };
  }
}
