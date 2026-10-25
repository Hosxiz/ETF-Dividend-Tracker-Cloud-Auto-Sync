/**
 * mock-provider.js
 * High-quality seed & fallback dividend data for popular ETFs and CHPY.
 */

export const MOCK_ETF_DATA = {
  CHPY: {
    ticker: 'CHPY',
    currency: 'USD',
    lastPrice: 19.85,
    estimatedAnnualPayoutPerShare: 27.40, // ~$0.5268/week * 52 weeks
    frequency: 'Weekly',
    dividends: [
      { exDate: '2026-10-21', payDate: '2026-10-22', amountPerShare: 0.4702 },
      { exDate: '2026-10-14', payDate: '2026-10-15', amountPerShare: 0.5140 },
      { exDate: '2026-10-07', payDate: '2026-10-08', amountPerShare: 0.5847 },
      { exDate: '2026-09-30', payDate: '2026-10-01', amountPerShare: 0.5385 }
    ]
  },
  SCHD: {
    ticker: 'SCHD',
    currency: 'USD',
    lastPrice: 83.10,
    estimatedAnnualPayoutPerShare: 2.85,
    dividends: [
      { exDate: '2026-11-12', payDate: '2026-11-28', amountPerShare: 0.72 },
      { exDate: '2026-09-20', payDate: '2026-09-27', amountPerShare: 0.75 },
      { exDate: '2026-06-21', payDate: '2026-06-28', amountPerShare: 0.69 },
      { exDate: '2026-03-22', payDate: '2026-03-29', amountPerShare: 0.68 }
    ]
  },
  JEPI: {
    ticker: 'JEPI',
    currency: 'USD',
    lastPrice: 56.40,
    estimatedAnnualPayoutPerShare: 4.35,
    dividends: [
      { exDate: '2026-11-02', payDate: '2026-11-07', amountPerShare: 0.36 },
      { exDate: '2026-10-01', payDate: '2026-10-06', amountPerShare: 0.38 },
      { exDate: '2026-09-02', payDate: '2026-09-08', amountPerShare: 0.35 },
      { exDate: '2026-08-01', payDate: '2026-08-06', amountPerShare: 0.37 }
    ]
  },
  SPY: {
    ticker: 'SPY',
    currency: 'USD',
    lastPrice: 585.00,
    estimatedAnnualPayoutPerShare: 7.20,
    dividends: [
      { exDate: '2026-12-18', payDate: '2027-01-31', amountPerShare: 1.85 },
      { exDate: '2026-09-19', payDate: '2026-10-31', amountPerShare: 1.78 },
      { exDate: '2026-06-20', payDate: '2026-07-31', amountPerShare: 1.74 },
      { exDate: '2026-03-21', payDate: '2026-04-30', amountPerShare: 1.83 }
    ]
  }
};
