/**
 * csv-exporter.js
 * Generates and downloads UTF-8 encoded CSV with BOM for ETF portfolio and dividend data.
 */

export class CsvExporter {
  /**
   * Generates CSV string and triggers browser download
   * @param {Array} holdings 
   * @param {Map<string, object>} marketDataMap 
   * @param {string} [filename='etf-dividend-portfolio.csv']
   */
  static exportPortfolioToCsv(holdings = [], marketDataMap = new Map(), filename = 'etf-dividend-portfolio.csv') {
    const headers = [
      'Ticker',
      'Shares',
      'LastPriceUSD',
      'AnnualEstPayoutUSD',
      'TotalEstAnnualUSD',
      'LatestExDate',
      'LatestPayDate',
      'LatestDivPerShareUSD',
      'LastUpdated'
    ];

    const rows = holdings.map(h => {
      const m = marketDataMap.get(h.ticker) || {};
      const latestDiv = m.dividends?.[0] || {};
      const annualPerShare = m.estimatedAnnualPayoutPerShare || 0;
      const totalAnnual = (h.shares * annualPerShare).toFixed(2);

      return [
        h.ticker,
        h.shares,
        m.lastPrice || '',
        annualPerShare,
        totalAnnual,
        latestDiv.exDate || '',
        latestDiv.payDate || '',
        latestDiv.amountPerShare || '',
        h.updatedAt || new Date().toISOString()
      ];
    });

    // Build CSV with commas and quotes
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\r\n');

    // Prepend UTF-8 BOM (\uFEFF) for Excel compatibility
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
