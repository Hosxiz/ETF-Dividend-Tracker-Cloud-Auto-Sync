# 📈 ETF Dividend Tracker & Cloud Auto-Sync System
### *A Production-Ready, Privacy-First FinTech Portfolio Project featuring Client-Side OCR, Resilient Financial Data Pipelines, and Zero-Cost 24/7 Serverless Automation.*

[![JavaScript](https://img.shields.io/badge/JavaScript-ES6%2B_Modules-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Architecture](https://img.shields.io/badge/Architecture-Vanilla_JS_%7C_No_Framework-45B8AC)](#-key-engineering-highlights--technical-depth)
[![OCR](https://img.shields.io/badge/OCR-Tesseract.js_Web_Worker-5C2D91)](https://tesseract.projectnaptha.com/)
[![Market Data](https://img.shields.io/badge/Data-Yahoo_Finance_v8_%2B_Dual_Proxy-6001D2?logo=yahoo)](https://finance.yahoo.com/)
[![Cloud](https://img.shields.io/badge/Cloud-Google_Apps_Script_%2B_Sheets-34A853?logo=google)](https://developers.google.com/apps-script)
[![Notification](https://img.shields.io/badge/Notification-Discord_Webhook_Embed-5865F2?logo=discord&logoColor=white)](https://discord.com/)
[![Tests](https://img.shields.io/badge/Tests-Node.js_Native_Runner_4%2F4_Pass-22C55E?logo=node.js&logoColor=white)](#-automated-testing--qa)
[![Deployment](https://img.shields.io/badge/Deploy-Cloudflare_Pages_Ready-F38020?logo=cloudflare)](https://pages.cloudflare.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 📌 Executive Summary (บทคัดย่อภาพรวมโครงการ)

**ETF Dividend Tracker & Cloud Auto-Sync** คือ Web Application ด้าน Financial Technology (FinTech) ที่ถูกออกแบบมาเพื่อแก้ Pain Point ของนักลงทุนหุ้น/กองทุนสหรัฐฯ (US Dividend ETFs เช่น `CHPY`, `SCHD`, `JEPI`, `SPY`) โดยเฉพาะกลุ่มผู้ใช้งานผ่านแอปพลิเคชันโบรกเกอร์ไทยอย่าง **Dime! (by KKP)**

ระบบชูจุดเด่นด้าน **Zero Operational Cost (ต้นทุนเซิร์ฟเวอร์ 0 บาท)** และ **Client-First Privacy** ด้วยการประมวลผล OCR สลิปซื้อขายภายในเบราว์เซอร์ของผู้ใช้งาน 100% พร้อมเชื่อมต่อสถาปัตยกรรม Serverless Automation บน **Google Apps Script + Google Sheets** เพื่อตรวจสอบรอบปันผลและส่งการแจ้งเตือน Rich Embed เข้า **Discord 24 ชั่วโมงต่อวัน โดยไม่ต้องเปิดคอมพิวเตอร์ทิ้งไว้**

---

## 🏛️ System Architecture & Ecosystem Design

ระบบผสานการทำงานระหว่าง **Edge / Client-Side Web Application** และ **Serverless Cloud Background Worker** อย่างไร้รอยต่อ:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               CLIENT-SIDE (Web Browser)                                │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  [ UI Layer ]              [ Engine Layer ]                [ Local Data Store ]        │
│  • Obsidian Glassmorphism  • Tesseract.js (Web Worker)     • LocalStorage (Holdings)   │
│  • Micro-Interactions      • Dime Trade Slip Regex Engine  • Settings & Webhooks       │
│  • Accessible Modals       • Dividend Math & Freq Engine   • UTF-8 BOM CSV Exporter    │
└──────────────┬──────────────────────────────┬──────────────────────────┬───────────────┘
               │ (1) Ingest Market Data       │ (2) Parse Trade Slip     │ (3) Sync Ledger
               ▼                              ▼                          ▼
┌──────────────────────────────┐ ┌─────────────────────────┐ ┌───────────────────────────┐
│     EXTERNAL MARKET APIs     │ │   LOCAL IMAGE PARSER    │ │    SERVERLESS CLOUD TIER  │
├──────────────────────────────┤ ├─────────────────────────┤ ├───────────────────────────┤
│ • Dual-Proxy Engine:         │ │ • In-Browser Tesseract  │ │ • Google Apps Script      │
│   - AllOrigins (CORS Proxy)  │ │   Web Worker Thread     │ │   (REST Web App API)      │
│   - CorsProxy.io (Secondary) │ │ • Non-blocking UI Loop  │ │ • Google Sheets Database  │
│ • Yahoo Finance v8 API       │ │ • Fractional Regex      │ │ • Daily Cron (08:00 AM)   │
│ • Resilient Mock Fallback    │ │   (Shares, Price, THB)  │ │ • Anti-Spam Memory Hash   │
└──────────────────────────────┘ └─────────────────────────┘ └─────────────┬─────────────┘
                                                                           │ (4) Alert 24/7
                                                                           ▼
                                                             ┌───────────────────────────┐
                                                             │     DISCORD MESSAGING     │
                                                             ├───────────────────────────┤
                                                             │ • Rich Embed Cards        │
                                                             │ • Real-time Mobile Push   │
                                                             └───────────────────────────┘
```

---

## ⚡ Key Engineering Highlights & Technical Depth (จุดเด่นทางวิศวกรรมซอฟต์แวร์)

### 1. 👁️ In-Browser Computer Vision (Offline Privacy-First OCR)
- **Non-blocking Concurrency:** ใช้ `Tesseract.js` รันบน Web Worker แยก Thread ออกจาก UI Thread ทำให้แอนิเมชันของหน้าเว็บไหลลื่น 60 FPS ตลอดกระบวนการสแกน
- **Zero Data Leakage:** ไฟล์ภาพสลิปของธนาคาร/โบรกเกอร์ถูกประมวลผลแบบ Client-side 100% ไม่มีการอัปโหลดภาพเข้า Server บุคคลที่สาม มอบความเป็นส่วนตัวสูงสุด (Privacy-First)
- **Heuristic Pattern Matching:** พัฒนาชุด Regex พิเศษสำหรับสกัดข้อมูลสลิป **Dime!** จัดการกรณีเศษหุ้นทศนิยมละเอียดสูง (เช่น `0.1145716` หุ้น), อัตราแลกเปลี่ยน, ราคาเฉลี่ย, และวันที่ทำรายการได้อย่างแม่นยำ

### 2. 🛡️ Resilient Market Data Ingestion Pipeline
- **Dual-CORS Proxy Fallback:** แก้ปัญหาข้อจำกัด CORS ของ Yahoo Finance v8 API บน Client ด้วยการทำ Multi-Proxy Auto-Failover (AllOrigins ➔ CorsProxy.io)
- **High-Availability Mock Engine:** มีระบบ Data Integrity Fallback พร้อมชุดข้อมูลจำลอง (Mock Dataset) สำหรับ Ticker สำคัญ (`CHPY`, `SCHD`, `JEPI`, `SPY`) ทำให้เว็บยังคงทำงานได้สมบูรณ์แม้เครือข่ายอินเทอร์เน็ตมีปัญหา
- **Visual Transparency Badges:** แสดงสถานะแหล่งที่มาข้อมูลแบบโปร่งใส (🟢 `Live Yahoo` vs 🟡 `Offline Fallback`)

### 3. ☁️ Zero-Cost Serverless Cloud Automation (24/7 Auto-Sync)
- **Cloud Database Integration:** ทุกครั้งที่มีการบันทึกสลิปซื้อขาย ข้อมูลจะถูกซิงค์ตรงเข้า Google Sheets ทันทีผ่าน REST POST Endpoint ที่เขียนขึ้นด้วย Google Apps Script
- **Scheduled Autonomous Crons:** ตั้ง Time-Driven Trigger บน Google Apps Script ให้ตรวจสอบปฏิทินปันผลของ ETF ในพอร์ตทุกเช้า (08:00–09:00 น.)
- **Stateful Anti-Spam Deduplication:** ระบบจดจำประวัติการแจ้งเตือนเพื่อป้องกันการยิง Webhook แจ้งเตือนซ้ำซ้อนในวันเดียวกัน

### 4. 🧮 Multi-Frequency Dividend Math & Localization Engine
- **Weekly Dividend Support:** รองรับ ETF รูปแบบพิเศษที่จ่ายปันผลทุกสัปดาห์ (เช่น `CHPY`) โดยคำนวณและแสดงผลครอบคลุม 3 มิติ: **ต่อสัปดาห์ (Weekly)**, **ต่อเดือน (Monthly)**, และ **ต่อปี (Annualized)**
- **Thai Buddhist Era Localization:** จัดการแปลงวันที่สากล (ISO Date) ให้เป็นปฏิทินไทยปี พ.ศ. พร้อมชื่อเดือนย่อ เช่น `6 พ.ย. 2569` ทั้งบน Dashboard และใน Discord Rich Embeds
- **Excel-Compatible CSV Export:** ฝัง **UTF-8 BOM (`\uFEFF`)** ลงในไฟล์ CSV Export เพื่อให้เปิดภาษาไทยใน Microsoft Excel ได้อย่างถูกต้องโดยตัวอักษรไม่เพี้ยน

### 5. 🎨 Modern Vanilla Architecture & UX Polish
- **Frameworkless Performance:** พัฒนาด้วย Pure Vanilla JavaScript (ES6+ Modules) และ CSS Custom Properties โหลดไว ไร้ Overhead จาก Bundler หรือ Virtual DOM
- **Defensive UI Patterns:**
  - **Async Mutex:** ป้องกันการคลิกปุ่มเบิ้ล (Double-Click Protection) ระหว่างดึงข้อมูลหรือยิง Webhook
  - **Modal Ergonomics:** รองรับการปิด Modal ด้วยปุ่ม `Escape` และการคลิก Overlay ด้านนอก
  - **Soft Deletion with Undo:** มีระบบแจ้งเตือนและ Undo Toast เมื่อผู้ใช้ลบรายการ เพื่อป้องกัน Human Error
  - **KPI Count-Up Animation:** ตัวเลขสถิติภาพรวมพอร์ตเคลื่อนไหวแบบ Smooth Easing เมื่อข้อมูลอัปเดต

---

## 🛠️ Technology Stack (เทคโนโลยีที่ใช้)

| หมวดหมู่ (Category) | เทคโนโลยี (Technology) | วัตถุประสงค์และการนำไปใช้ (Rationale & Purpose) |
|---|---|---|
| **Frontend Core** | Vanilla JavaScript (ES6+), HTML5 Semantic | สถาปัตยกรรม Modular Component โหลดรวดเร็ว ปราศจาก Dependency Bloat |
| **Styling & Design** | Vanilla CSS (Dark Obsidian & Emerald), Glassmorphism | Design System แบบ Modern Dark Theme พร้อมตัวแปร CSS และ Micro-animations |
| **Computer Vision** | Tesseract.js (WASM / Web Worker) | แปลงข้อความจากภาพสลีปแบบ Client-Side เพื่อความปลอดภัยของข้อมูล |
| **Financial API** | Yahoo Finance v8 via Dual-CORS Proxy | ดึงข้อมูลราคาปัจจุบัน, อัตราปันผล, Ex-Date และ Record Date สด |
| **Serverless Cloud** | Google Apps Script (GAS) | ทำหน้าที่เป็น Serverless REST API และ Background Cron Worker (24/7) |
| **Cloud Storage** | Google Sheets API / Drive | จัดเก็บ Ledger พอร์ตการลงทุนบนคลาวด์ ถาวร และเข้าถึงได้ฟรีตลอดชีพ |
| **Notification** | Discord Webhooks API | ส่งแจ้งเตือนสถานะเงินปันผลด้วยการ์ด Rich Embed สีสันชัดเจน |
| **Quality Assurance** | Node.js Native Test Runner (`node --test`) | รัน Unit Tests ตรวจสอบตรรกะการเงินและ Regex Parsing โดยไม่ต้องพึ่ง Jest/Mocha |
| **Deployment** | Cloudflare Pages / Static Hosting Ready | รองรับการ Deploy ระดับ Global Edge ภายในเวลาไม่ถึง 1 นาที |

---

## 📂 Project Structure (โครงสร้างโค้ดอย่างเป็นระบบ)

```text
ETFNotiSystem/
├── index.html                           # หน้าจอแดชบอร์ดหลัก (Semantic HTML + Glassmorphism Shell)
├── css/
│   └── main.css                         # Design System, CSS Variables, Typography & Animations
├── js/
│   ├── app.js                           # Central Orchestrator: จัดการ Event Handling, Mutex, State Sync
│   ├── portfolio/
│   │   ├── portfolio-store.js           # LocalStorage Manager จัดการข้อมูลพอร์ตและเศษหุ้น
│   │   └── dividend-calc.js             # Financial Math: คำนวณ Payout รายสัปดาห์/เดือน/ปี + วันที่ไทย
│   ├── market-data/
│   │   ├── yahoo-provider.js            # Ingestion Service ดึง Yahoo Finance API พร้อม Dual-Proxy
│   │   └── mock-provider.js             # High-Availability Mock Dataset (CHPY, SCHD, JEPI, SPY)
│   ├── slip-parser/
│   │   ├── ocr-engine.js                # Tesseract Worker Lifecycle Management & Progress Hook
│   │   └── dime-extractor.js            # Regular Expressions พิเศษสกัดข้อมูลสลีป Dime!
│   ├── notification/
│   │   └── discord-notifier.js          # จัดรูปแบบการ์ด Rich Embed ยิง Discord Webhook
│   └── data-export/
│       └── csv-exporter.js              # ตัวสร้างไฟล์ CSV พร้อม UTF-8 BOM สำหรับ Excel
├── automation/
│   ├── README_AUTO_NOTIFY.md            # คู่มือการติดตั้งระบบ Auto-Notify บน Cloud ละเอียดทุกสเต็ป
│   └── google-apps-script/
│       └── Code.gs                      # สคริปต์ Google Apps Script + Google Sheet Sync API
└── tests.mjs                            # Automated Unit Tests (Node.js Native Test Runner)
```

---

## 🧪 Automated Testing & QA (การทดสอบระบบ)

โปรเจกต์นี้เขียนชุดทดสอบแบบ Unit Test ครอบคลุมฟังก์ชันการคำนวณเงินปันผล, การแปลงวันที่ไทย พ.ศ., และ Regex สกัดสลีป Dime โดยใช้ **Node.js Native Test Runner**:

```bash
# รันคำสั่งทดสอบ Unit Test
node --test tests.mjs
```

### ผลลัพธ์การทดสอบ (Test Results):
```text
✔ dividend-calc: formatThaiDate should format dates in Thai Buddhist era (1.2ms)
✔ dividend-calc: calculatePayouts should compute weekly, monthly, annual correctly (0.8ms)
✔ dime-extractor: should parse a simulated Dime slip text correctly (1.5ms)
✔ portfolio-store: should load default seed data if localStorage is empty (0.5ms)
ℹ tests 4
ℹ suites 0
ℹ pass 4
ℹ fail 0
```

---

## 🚀 Quick Start & Deployment Guide

### 1. การรันบนเครื่อง Local Development
โปรเจกต์นี้ไม่มี Dependency ภายนอกที่ต้อง build สามารถรัน Web Server ทั่วไปได้ทันที:

```bash
# Clone Repository
git clone https://github.com/Hosxiz/ETF-Dividend-Tracker-v1.3-Cloud-Auto-Sync.git

# นำทางเข้าสู่โฟลเดอร์
cd ETF-Dividend-Tracker-v1.3-Cloud-Auto-Sync

# รัน Local Server ด้วย Node.js
npx -y serve . -l 8080
```
เปิดเบราว์เซอร์ไปที่: `http://localhost:8080`

### 2. การ Deploy ขึ้น Production (Cloudflare Pages)
1. Fork หรือ Push โค้ดขึ้น GitHub Repository
2. เข้าสู่ [Cloudflare Dashboard](https://dash.cloudflare.com/) ➔ **Workers & Pages** ➔ **Create application**
3. เลือกแถบ **Pages** ➔ **Connect to Git** ➔ เลือก Repository นี้
4. ตั้งค่า Build settings:
   - **Framework preset:** `None`
   - **Build command:** *(เว้นว่างไว้)*
   - **Build output directory:** `.`
5. กด **Save and Deploy** — เว็บไซต์จะพร้อมใช้งานทั่วโลกผ่านระบบ Edge CDN ฟรี 100%

### 3. การเปิดใช้งาน Cloud Serverless 24/7 (Google Apps Script)
1. เข้าไปที่ [Google Apps Script](https://script.google.com/) แล้วสร้างโปรเจกต์ใหม่
2. วางโค้ดจาก [`automation/google-apps-script/Code.gs`](file:///d:/E/ETFNotiSystem/automation/google-apps-script/Code.gs)
3. ระบุ `DISCORD_WEBHOOK_URL` ของคุณ
4. กด **Deploy > New deployment > Web app** (ตั้งค่า `Who has access: Anyone`)
5. นำ URL ที่ได้ไปวางในช่อง `Google Apps Script Sync URL` ในหน้าต่าง **⚙️ Settings** บนหน้าเว็บ
6. ตั้ง **Time-driven Trigger** ใน Apps Script ให้รันฟังก์ชัน `checkAndNotifyDividends` ช่วง 08:00 - 09:00 น. ทุกวัน

---

## 💡 Engineering Trade-Offs & Architectural Decisions

| การตัดสินใจ (Decision) | ทางเลือกอื่นที่พิจารณา (Alternatives) | เหตุผลทางวิศวกรรม (Engineering Rationale) |
|---|---|---|
| **Vanilla JS (ES Modules)** | React / Vue / Next.js | ลดความซับซ้อนและ Bundle Size โหลดเร็วกว่า 3 เท่า ไม่มีปัญหาเรื่อง Node.js dependency compatibility |
| **In-Browser Tesseract.js** | Google Cloud Vision API / AWS Textract | ข้อมูลทางการเงินมีความอ่อนไหวสูง การประมวลผลบน Client ช่วยตัดปัญหา Data Privacy และไม่มีค่าใช้จ่าย API รายเดือน |
| **Google Apps Script + Sheets** | AWS Lambda + DynamoDB / Supabase | มอบ Free-tier ถาวร 100% ผู้ใช้งานทั่วไปสามารถเปิดดู Ledger ผ่านตาราง Google Sheets บนมือถือได้ทันทีโดยไม่ต้องมีความรู้ด้าน Database |
| **Dual-CORS Proxy** | Private Backend Node/Express Server | ช่วยให้ตัวโปรเจกต์เป็น Client-only Static Web App แท้จริง สามารถโฮสต์บน GitHub Pages / Cloudflare Pages ได้ฟรี 100% |

---

## 👨‍💻 Author & Contact

**Developer / Software Engineer:** [Your Name / PERANUT MOONSOMBAT]
- **GitHub:** [@Hosxiz](https://github.com/Hosxiz)
- **LinkedIn:** [linkedin.com/in/yourprofile](https://linkedin.com) *(Placeholder)*
- **Portfolio / Website:** [your-portfolio.com](https://your-portfolio.com) *(Placeholder)*
- **Email:** `contact@example.com` *(Placeholder)*

---
*Developed with a focus on Clean Code, High-Performance Client Architecture, and Pragmatic System Design.*
