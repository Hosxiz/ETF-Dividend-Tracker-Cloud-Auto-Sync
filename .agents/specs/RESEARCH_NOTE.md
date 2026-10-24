# Technical Research Note: ETF Dividend Tracker

## 1. Yahoo Finance API & CORS Strategies
- **Endpoint:** `https://query2.finance.yahoo.com/v8/finance/chart/{TICKER}?events=div&interval=1d&range=2y`
- **CORS Handling:** Browser directly calling `query2.finance.yahoo.com` triggers CORS errors.
  - Primary Strategy: Use `https://api.allorigins.win/raw?url=` as proxy wrapper.
  - Secondary Strategy: Backup proxy `https://corsproxy.io/?` or fallback to built-in seed dataset for CHPY and popular US ETFs (SPY, QQQ, SCHD, JEPI, CHPY).
  - Manual Override: Allow users to edit or input the dividend amount and pay date directly if live fetch is blocked.

## 2. Tesseract.js (v5) Browser OCR
- **CDN Sources:**
  - `https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js`
- **Language Models:**
  - Dime slips contain Thai and English ("ซื้อ", "ราคาที่ได้จริง", "จำนวนหุ้น", "วันที่ส่งคำสั่ง", Ticker symbol like "RKLB", "CHPY").
  - Worker creation: `Tesseract.createWorker(['eng', 'tha'])` or `createWorker('eng')` with custom regex fallback.
  - Optimization: Pre-crop or pass image blob directly, report progress logger callback `(m) => console.log(m.progress)`.

## 3. Dime Slip Regex Patterns (from Brief Section 5)
```javascript
// Field 1: Ticker (e.g., หลัง 'ซื้อ ' หรือ ตัวอักษรภาษาอังกฤษตัวใหญ่)
const tickerPattern = /ซื้อ\s+([A-Z0-9\.\-]+)/i;

// Field 2: Shares / จำนวนหุ้น (e.g. 0.1145716)
const sharesPattern = /จำนวนหุ้น\s*[:\s]?\s*([0-9]+(?:\.[0-9]+)?)/i;

// Field 3: Execution Price / ราคาที่ได้จริง (e.g. 51.75 USD)
const pricePattern = /ราคาที่ได้จริง\s*[:\s]?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:USD)?/i;

// Field 4: Total THB (e.g. 199.94 THB)
const totalThbPattern = /([0-9,]+(?:\.[0-9]+)?)\s*THB/i;

// Field 5: Order Date / วันที่ส่งคำสั่ง (e.g. 19 ต.ค. 69 or dd/mm/yy)
const orderDatePattern = /วันที่ส่งคำสั่ง\s*[:\s]?\s*([0-9]{1,2}\s+[^\s\d]+\s+[0-9]{2,4})/i;
```

## 4. Discord Webhook Payload Structure
```json
{
  "username": "ETF Dividend Bot",
  "avatar_url": "https://cdn-icons-png.flaticon.com/512/2454/2454274.png",
  "embeds": [
    {
      "title": "📢 แจ้งเตือนเงินปันผล ETF (30 วันข้างหน้า)",
      "color": 3447003,
      "fields": [
        { "name": "ETF Ticker", "value": "CHPY", "inline": true },
        { "name": "จำนวนหุ้น", "value": "0.1145716 หุ้น", "inline": true },
        { "name": "ปันผล/หุ้น", "value": "$0.5500", "inline": true },
        { "name": "วันขึ้น XD (Ex-Date)", "value": "2026-11-05", "inline": true },
        { "name": "วันจ่ายปันผล (Pay-Date)", "value": "2026-11-20", "inline": true },
        { "name": "ประมาณการรับเงิน", "value": "$0.06 (≈ 2.20 THB)", "inline": true }
      ],
      "footer": { "text": "ETF Dividend Tracker • Automated Check" },
      "timestamp": "2026-10-24T09:03:00.000Z"
    }
  ]
}
```

## 5. CSV Export Specification
- Fields: `Ticker,Shares,LastPriceUSD,AnnualEstPayoutUSD,ExDate,PayDate,DividendPerShareUSD,Status`
- Encoding: UTF-8 with BOM (`\uFEFF`) to ensure Excel and Thai character compatibility.
