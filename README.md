# ETF Dividend Tracker v1.3 + Cloud Auto-Sync

Web Application สำหรับติดตามวันจ่ายเงินปันผล US ETF (เช่น CHPY, SCHD, JEPI, SPY) พร้อมระบบอ่านสลีปซื้อหุ้นจากโบรกเกอร์ **Dime** ด้วย Offline OCR (Tesseract.js) + Regex และส่งแจ้งเตือนสรุปผ่าน **Discord Webhook** ได้ทั้งแบบกดส่งเอง และแบบ **Cloud Auto-Notify 24/7 (Google Apps Script + Google Sheet)** โดยไม่ต้องเปิดคอมพิวเตอร์ทิ้งไว้

---

## 🏗️ โครงสร้างการทำงานของระบบ (System Ecosystem)

ระบบแบ่งออกเป็น 2 ส่วนหลักที่เชื่อมโยงกันอย่างไร้รอยต่อ:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   1. หน้าเว็บ Web Application (Local / Client)         │
├────────────────────────────────────────────────────────────────────────┤
│ • Portfolio Management : จัดการ Ticker (CHPY, SCHD ฯลฯ) + เศษหุ้น      │
│ • Dime Slip OCR        : ลากรูปสลีป Dime ➔ สกัด Ticker, หุ้น, ราคา     │
│ • Live Yahoo Finance   : ดึงราคา + รอบปันผลสด (มี Badge เขียว/เหลือง)  │
│ • Thai Date & Weekly   : แสดงวันที่ไทย (เช่น 6 พ.ย. 2569) + แยกยอดวีค  │
│ • Export CSV           : ดาวน์โหลดเป็น Excel (UTF-8 BOM ภาษาไทย)       │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │  (ซิงค์ข้อมูลสลีปอัตโนมัติเมื่อกดบันทึก)
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│               2. ระบบ Cloud 24/7 (Google Apps Script + Sheet)          │
├────────────────────────────────────────────────────────────────────────┤
│ • Google Sheet Database: เก็บยอดพอร์ตล่าสุดบน Drive ปิดคอมก็ไม่หาย     │
│ • Daily Trigger        : เช็คปันผลอัตโนมัติทุกเช้า 08:00 - 09:00 น.    │
│ • Smart Notification   : ตรวจจับ "วันจ่ายเงินจริง" หรือ "XD ใน 3 วัน"   │
│ • Anti-Spam Memory     : บันทึกประวัติ ไม่ส่งซ้ำซ้อนในวันเดียวกัน      │
│ • Discord Webhook      : ยิงการ์ด Rich Embed สรุปเงินที่จะได้รับเข้ามือถือ│
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🌟 ฟีเจอร์เด่น (Core Features)

1. **Portfolio Management (F1)**:
   - เพิ่ม/ลบ ETF ด้วย Ticker Symbol (ค่าเริ่มต้นตั้งไว้ที่ `CHPY`)
   - รองรับการระบุจำนวนหุ้นแบบทศนิยม (Fractional shares เช่น `0.1145716`)
   - บันทึกและจดจำข้อมูลอัตโนมัติบน `localStorage` และซิงค์ตรงเข้า Google Sheet

2. **Dividend Data & Smart Frequency (F2)**:
   - ดึงข้อมูลรอบเงินปันผล (Ex-Date, Pay-Date, ปันผล/หุ้น) จาก Yahoo Finance v8 API ผ่าน Dual-Proxy & Fallback
   - **รองรับ ETF ปันผลรายสัปดาห์ (Weekly) เช่น CHPY:** สรุปยอดเงิน 3 มิติ: **ต่อสัปดาห์ (Weekly)**, **ต่อเดือน (Monthly)**, และ **ทั้งปี (Annual)**
   - แสดงประวัติเงินปันผลย้อนหลัง 4–8 ครั้ง

3. **Data Transparency & Controls**:
   - ป้ายสถานะกำกับข้อมูลชัดเจน:
     - 🟢 **`Live Yahoo`** : ดึงข้อมูลสดจริงจาก Yahoo Finance สำเร็จ
     - 🟡 **`Offline Fallback`** : ใช้ชุดข้อมูลสำรองล่าสุดเมื่อเน็ตเวิร์กมีปัญหา
   - ปุ่ม **`🔄 Refresh Data`** สำหรับดึงข้อมูลปันผลและราคาสดใหม่ได้ตลอดเวลา

4. **UX & Thai Localization**:
   - จัดรูปแบบวันที่ภาษาไทยปี พ.ศ. เช่น **`6 พ.ย. 2569`** อ่านง่ายทั้งบนเว็บและในการ์ด Discord

5. **Discord Notification (F4)**:
   - ปุ่ม **'Check & Notify'** ตรวจสอบหุ้นที่จะจ่ายปันผลในอีก 30 วันข้างหน้า
   - จัดรูปแบบข้อความ Rich Embed สีสันสวยงามสรุปภาพรวมส่งเข้า Discord Channel

6. **CSV Export (F5)**:
   - ส่งออกข้อมูลพอร์ตและข้อมูลเงินปันผลเป็นไฟล์ CSV (เข้ารหัส UTF-8 BOM รองรับภาษาไทยและเปิดใน Excel ได้ทันที)

7. **Dime Slip Parser (F6)**:
   - ลากหรืออัปโหลดภาพสลีป Dime ➔ Tesseract.js (Offline OCR) + Regex สกัด Ticker, ราคาที่ได้จริง, จำนวนหุ้น, ยอดเงิน THB และวันที่ทำรายการ
   - มี Modal ให้ตรวจสอบความถูกต้องและกดยืนยันบันทึกเข้าพอร์ต

8. **Cloud Automation & Google Sheet Sync**:
   - อัปโหลดสลีปในหน้าเว็บ ➔ ยอดหุ้นใหม่ถูกส่งไปอัปเดตใน Google Sheet บน Cloud อัตโนมัติ
   - บอท Google Apps Script อ่านยอดล่าสุดจาก Google Sheet แล้วแจ้งเตือนเข้า Discord ทุกเช้า ไม่ต้องเปิดคอมทิ้งไว้

---

## 🛠️ โครงสร้างไฟล์ในโปรเจกต์ (Architecture)

```text
ETFNotiSystem/
├── index.html                           # หน้าเว็บหลัก Dashboard (Dark Glassmorphic)
├── css/
│   └── main.css                         # สไตล์ Dark Obsidian & Emerald Accent
├── js/
│   ├── app.js                           # ตัวประสานงานหลัก (Event Listener & Sync Trigger)
│   ├── portfolio/
│   │   ├── portfolio-store.js           # จัดการ LocalStorage สำหรับ Holdings & Settings
│   │   └── dividend-calc.js             # ตัวคำนวณ Payout, วันที่ไทย, และความถี่รายสัปดาห์/เดือน/ปี
│   ├── market-data/
│   │   ├── yahoo-provider.js            # ดึงข้อมูลจาก Yahoo Finance API + Multi-CORS Proxy
│   │   └── mock-provider.js             # ชุดข้อมูลสำรอง (CHPY Weekly, SCHD, JEPI, SPY)
│   ├── slip-parser/
│   │   ├── ocr-engine.js                # Tesseract.js worker lifecycle & progress monitoring
│   │   └── dime-extractor.js            # Regex สกัดข้อมูลสลีป Dime ตาม Pattern
│   ├── notification/
│   │   └── discord-notifier.js          # ตัวจัดรูปแบบ Rich Embed ยิง Discord Webhook
│   └── data-export/
│       └── csv-exporter.js              # ตัวสร้างไฟล์ CSV (UTF-8 BOM)
├── automation/
│   ├── README_AUTO_NOTIFY.md            # คู่มือการติดตั้งระบบ Auto-Notify บน Cloud 24/7
│   └── google-apps-script/
│       └── Code.gs                      # สคริปต์ Google Apps Script + Google Sheet Sync API
├── .agents/specs/                       # เอกสารสเปกตามขั้นตอน Agent Team Pipeline
└── tests.mjs                            # Automated Unit Tests (Node.js Native Test Runner)
```

---

## 🚀 วิธีการเปิดใช้งาน (How to Run)

### 1. ใช้งานหน้าเว็บในเครื่อง (Web Application)
รันคำสั่ง Local Server ผ่าน Node.js (ไม่ต้องติดตั้งอะไรเพิ่ม):
```powershell
npx -y serve . -l 8080
```
แล้วเปิดเบราว์เซอร์ไปที่: 👉 **`http://localhost:8080`**

### 2. ตั้งค่าระบบแจ้งเตือนอัตโนมัติบน Cloud (Auto Notify 24/7)
1. เปิดเว็บไซต์ [https://script.google.com](https://script.google.com) แล้วกด **New project**
2. คัดลอกโค้ดใน [automation/google-apps-script/Code.gs](file:///d:/E/ETFNotiSystem/automation/google-apps-script/Code.gs) ไปวาง
3. ใส่ `DISCORD_WEBHOOK_URL` ของคุณ
4. กด **Deploy > New deployment > Web app** (ตั้งค่า Access: Anyone) เพื่อรับ Web App URL
5. นำ Web App URL มาใส่ในเมนู `⚙️ Settings` บนหน้าเว็บ เพื่อเปิดใช้งานระบบ Auto-Sync สลีป Dime ตรงเข้า Google Sheet
6. ตั้ง Trigger ใน Google Apps Script: เลือกฟังก์ชัน `checkAndNotifyDividends` ➔ Time-driven ➔ Day timer (ช่วง 8am to 9am)

---

## 🧪 การทดสอบระบบ (Automated Tests)
รันคำสั่งทดสอบโมดูลคำนวณ, วันที่ไทย, และ Regex สลีป Dime:
```powershell
node --test tests.mjs
```
*(ผลการทดสอบ: 4/4 Passed 100%)*
