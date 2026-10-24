# System Architecture Specification: ETF Dividend Tracker

## 1. Overview & Objective
- **Problem Statement:** US ETF holders (1–3 tickers, e.g., CHPY) lack an automated, frictionless way to know dividend payment dates, historical yields, and expected payouts without manually checking brokerage screens.
- **Target Outcome:** Client-side Web Application that manages portfolios, fetches ETF dividend records via Yahoo Finance (with CORS fallback and manual adjustments), calculates upcoming & estimated annual payouts, delivers Discord webhook alerts for dividends within 30 days, parses Dime trade slips via offline client OCR (Tesseract.js) + Regex, and exports to CSV.

## 2. System Topology & Bounded Contexts
- **Architecture Style:** Pure Modular Client-Side SPA (HTML5 + Vanilla CSS + ES Modules).
- **Module Structure (No generic utils/helpers):**
```text
ETFNotiSystem/
├── index.html                  # Main Application Shell
├── css/
│   └── main.css                # Premium Glassmorphic Dark UI & Tokens
├── js/
│   ├── app.js                  # Application Bootstrapper & Event Orchestrator
│   ├── portfolio/
│   │   ├── portfolio-store.js  # LocalStorage persistence & portfolio CRUD
│   │   └── dividend-calc.js    # Annual and periodic payout calculators
│   ├── market-data/
│   │   ├── yahoo-provider.js   # Yahoo Finance v8/chart dividend API + CORS Proxy
│   │   └── mock-provider.js    # Fallback dividend historical data (CHPY, etc.)
│   ├── slip-parser/
│   │   ├── ocr-engine.js       # Tesseract.js worker initialization & execution
│   │   └── dime-extractor.js   # Regex extraction for Dime trade slips
│   ├── notification/
│   │   └── discord-notifier.js # Webhook payload constructor & dispatcher
│   └── data-export/
│       └── csv-exporter.js     # Client CSV blob generator & downloader
└── .agents/specs/
```
- **File Size Budget:** Max 200 lines per file; max 50 lines per function.

## 3. Data Models & Interface Contracts
```typescript
interface PortfolioHolding {
  ticker: string;             // e.g. "CHPY"
  shares: number;             // e.g. 0.1145716
  averageCostUSD?: number;    // e.g. 51.75
  updatedAt: string;          // ISO String
}

interface DividendRecord {
  exDate: string;             // YYYY-MM-DD
  payDate: string;            // YYYY-MM-DD
  amountPerShare: number;     // USD
}

interface ETFMarketData {
  ticker: string;
  currency: string;
  lastPrice: number;
  dividends: DividendRecord[]; // Last 4-8 records
  estimatedAnnualPayoutPerShare: number;
  lastFetchedAt: string;
}

interface DimeParsedSlip {
  ticker: string | null;
  shares: number | null;
  priceUSD: number | null;
  totalTHB: number | null;
  orderDate: string | null;
  rawText: string;
}

interface AppSettings {
  discordWebhookUrl: string;
}
```

## 4. Error Handling & Resilience Strategy
- **CORS/Network Failure in Yahoo Finance:** If the direct query2.finance.yahoo.com call is blocked by CORS, automatically fallback to a public CORS proxy (`https://api.allorigins.win/raw?url=`). If still unreachable, prompt the user with pre-filled mock/manual dividend entry.
- **OCR Engine Resilience:** Run Tesseract.js with `eng+tha` (or `eng` with fallback). Provide a manual confirmation and edit modal showing extracted fields before committing to `localStorage`.
- **Discord Webhook:** Validate URL format before sending; report HTTP status and error toasts if invalid or rate-limited.

## 5. Non-Negotiable Architectural Constraints
- [x] Zero business logic embedded in DOM listeners; separated into domain modules.
- [x] Zero generic dumping ground files (`utils.js`, `helpers.js`).
- [x] All module files budgeted <= 200 lines of code.
- [x] Fully functional client-side without requiring Node.js runtime or build tools.
