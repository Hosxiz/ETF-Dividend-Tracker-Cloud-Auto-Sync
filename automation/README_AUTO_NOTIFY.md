# คู่มือการติดตั้งระบบแจ้งเตือนอัตโนมัติบน Cloud (Auto Notify 24/7)

ระบบนี้จะทำงานบน Cloud ตลอด 24 ชั่วโมง โดยที่คุณ**ไม่จำเป็นต้องเปิดคอมพิวเตอร์ทิ้งไว้** และจะแจ้งเตือนเข้า Discord อัตโนมัติเมื่อ:
1. **ถึงวันจ่ายเงินปันผลจริงในวันนั้น (Pay-Date)**
2. **มีวันขึ้น XD ในอีก 3 วันข้างหน้า (เตือนล่วงหน้า)**

---

## ⚡ วิธีที่แนะนำและง่ายที่สุด: ติดตั้งผ่าน Google Apps Script (ฟรีตลอดชีพ 100%)

ไฟล์โค้ดพร้อมใช้งานอยู่ที่: [`automation/google-apps-script/Code.gs`](file:///d:/E/ETFNotiSystem/automation/google-apps-script/Code.gs)

### ขั้นตอนการติดตั้ง (ใช้เวลา 2 นาที):

1. **เปิดหน้า Google Apps Script:**
   - เข้าไปที่เว็บไซต์: [https://script.google.com](https://script.google.com) (ล็อกอินด้วยบัญชี Gmail ของคุณ)
   - กดปุ่ม **`+ New project`** (หรือ โครงการใหม่)

2. **คัดลอกโค้ดไปวาง:**
   - ลบโค้ดเริ่มต้นในไฟล์ `Code.gs` ออกให้หมด
   - เปิดไฟล์ [`automation/google-apps-script/Code.gs`](file:///d:/E/ETFNotiSystem/automation/google-apps-script/Code.gs) ในโฟลเดอร์นี้ แล้วคัดลอกโค้ดทั้งหมดไปวางในหน้าเว็บ Google Apps Script

3. **แก้ไขข้อมูลของคุณ:**
   - บรรทัดที่ 20: ใส่ **`DISCORD_WEBHOOK_URL`** ของคุณ
   ```javascript
   const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/xxxx/yyyy";
   ```
   - บรรทัดที่ 23: ใส่รายการหุ้นและจำนวนหุ้นที่คุณถือ เช่น
   ```javascript
   const MY_PORTFOLIO = [
     { ticker: "CHPY", shares: 0.1145716 },
     // { ticker: "SCHD", shares: 10 }
   ];
   ```
   - กดปุ่ม **Save (รูปแผ่นดิสก์ หรือ Ctrl + S)**

4. **ทดสอบรันครั้งแรก:**
   - ด้านบนจะมีแถบเลือกฟังก์ชัน ให้เลือกเป็น **`checkAndNotifyDividends`**
   - กดปุ่ม **`Run` (เรียกใช้)**
   - *(หากมีหน้าต่างถามสิทธิ์ ให้กด Advanced / ขั้นสูง -> ไปที่ Untitled project -> กดยอมรับ Allow)*

5. **ตั้งเวลาให้ทำงานอัตโนมัติทุกวัน (Triggers):**
   - แถบเมนูด้านซ้าย กดที่ไอคอนรูปนาฬิกา **`Triggers` (ทริกเกอร์)**
   - กดปุ่มน้ำเงิน **`+ Add Trigger` (เพิ่มทริกเกอร์)** มุมขวาล่าง
   - ตั้งค่าดังนี้:
     - **Choose which function to run:** `checkAndNotifyDividends`
     - **Select event source:** `Time-driven` (ตามเวลา)
     - **Select type of time based trigger:** `Day timer` (ตัวจับเวลาวัน)
     - **Select time of day:** `8am to 9am` (ช่วงเวลา 08:00 - 09:00 น.)
   - กด **Save (บันทึก)** เป็นอันเสร็จสิ้น!

---

### 🎉 ผลลัพธ์:
ทุกเช้าเวลา 08:00 - 09:00 น. ระบบ Google Apps Script จะยิงตรวจสอบข้อมูลรอบปันผลของ Ticker (เช่น CHPY) จากเซิร์ฟเวอร์โดยตรง และหากพบว่า **วันนี้เป็นวันจ่ายปันผล** ระบบจะยิงการ์ดแจ้งเตือนเข้า Discord Channel ทันที โดยที่บอทจะไม่ส่งซ้ำซ้อนในวันเดียวกันครับ!
