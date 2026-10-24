/**
 * mock-provider.js
 * High-quality seed & fallback dividend data for popular ETFs and CHPY.
 */

export const MOCK_ETF_DATA = {
  CHPY: {
    ticker: 'CHPY',
    currency: 'USD',
    lastPrice: 19.85,
    estimatedAnnualPayoutPerShare: 5.20, // ~0.10/week * 52 weeks
    frequency: 'Weekly',
    dividends: [
      { exDate: '2026-10-30', payDate: '2026-11-06', amountPerShare: 0.1050 },
      { exDate: '2026-10-23', payDate: '2026-10-30', amountPerShare: 0.1025 },
      { exDate: '2026-10-16', payDate: '2026-10-23', amountPerShare: 0.0980 },
      { exDate: '2026-10-09', payDate: '2026-10-16', amountPerShare: 0.1040 },
      { exDate: '2026-10-02', payDate: '2026-10-09', amountPerShare: 0.1010 },
      { exDate: '2026-09-25', payDate: '2026-10-02', amountPerShare: 0.0995 },
      { exDate: '2026-09-18', payDate: '2026-09-25', amountPerShare: 0.1030 },
      { exDate: '2026-09-11', payDate: '2026-09-18', amountPerShare: 0.1000 }
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
