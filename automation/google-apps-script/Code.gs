/**
 * ====================================================================
 * ETF Dividend Auto-Notifier + Google Sheet Sync Engine (GAS)
 * ====================================================================
 * รองรับ 2 โหมด:
 * 1. Web App API: รับข้อมูลสลีปจากหน้าเว็บมาบันทึกลง Google Sheet อัตโนมัติ
 * 2. Daily Cron: ดึงยอดหุ้นจาก Google Sheet ไปเช็คปันผลและแจ้งเตือนเข้า Discord ทุกเช้า
 * ====================================================================
 */

// ⚙️ 1. ตั้งค่า Discord Webhook URL ของคุณ (ใส่ Webhook URL จริงของคุณที่นี่)
const DISCORD_WEBHOOK_URL = "YOUR_DISCORD_WEBHOOK_URL_HERE";

// 📄 2. ใส่ Spreadsheet ID ของ Google Sheet (เอามาจาก URL ของ Google Sheet)
// เช่น URL: https://docs.google.com/spreadsheets/d/1abcXYZ_12345/edit
// SPREADSHEET_ID จะเป็น: "1abcXYZ_12345"
// (ถ้าปล่อยว่างไว้ ระบบจะสร้าง Google Sheet แผ่นใหม่ให้ใน Google Drive อัตโนมัติ!)
const SPREADSHEET_ID = "";

// อัตราแลกเปลี่ยน USD/THB ประมาณการ
const USD_THB_RATE = 36.0;

/**
 * รับคำขอ POST จากหน้าเว็บ (เมื่อผู้ใช้อัปโหลดสลีปหรือเพิ่มหุ้น)
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = getOrCreatePortfolioSheet();

    if (data.action === "sync_portfolio") {
      // data.holdings คือ Array [{ticker: 'CHPY', shares: 0.1145}, ...]
      syncHoldingsToSheet(sheet, data.holdings);
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: "ซิงค์พอร์ตลง Google Sheet สำเร็จ!" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Action ไม่ถูกต้อง" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 🧪 ฟังก์ชันสำหรับ "กดทดสอบยิงเข้า Discord ทันที" โดยไม่สนเงื่อนไขวันที่
 * เลือกฟังก์ชันนี้แล้วกด Run ใน Google Apps Script ได้เลย!
 */
function testSendDiscordNow() {
  Logger.log("กำลังทดสอบยิงเข้า Discord...");
  const sheet = getOrCreatePortfolioSheet();
  const portfolio = getHoldingsFromSheet(sheet);

  const testPayList = [
    {
      ticker: "CHPY",
      shares: portfolio.find(p => p.ticker === "CHPY")?.shares || 0.1145716,
      amount: 0.1050,
      payoutUSD: (portfolio.find(p => p.ticker === "CHPY")?.shares || 0.1145716) * 0.1050,
      payoutTHB: (portfolio.find(p => p.ticker === "CHPY")?.shares || 0.1145716) * 0.1050 * USD_THB_RATE,
      payDate: Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd")
    }
  ];

  sendDiscordNotification(testPayList, []);
  Logger.log("✅ ยิงทดสอบเข้า Discord สำเร็จเรียบร้อยแล้ว!");
}

/**
 * ฟังก์ชันหลักที่ทำงานตามเวลา Trigger ทุกวัน (อ่านหุ้นจาก Google Sheet โดยตรง)
 */
function checkAndNotifyDividends() {
  if (!DISCORD_WEBHOOK_URL || DISCORD_WEBHOOK_URL.indexOf("http") !== 0) {
    Logger.log("กรุณากรอก DISCORD_WEBHOOK_URL ก่อนเริ่มใช้งาน");
    return;
  }

  const sheet = getOrCreatePortfolioSheet();
  const portfolio = getHoldingsFromSheet(sheet);

  if (portfolio.length === 0) {
    Logger.log("ไม่พบรายการหุ้นใน Google Sheet");
    return;
  }

  const props = PropertiesService.getScriptProperties();
  const todayStr = Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd");

  const todayPayList = [];
  const upcomingXdList = [];

  portfolio.forEach(item => {
    const data = fetchYahooDividendData(item.ticker);
    if (!data || !data.dividends || data.dividends.length === 0) return;

    data.dividends.forEach(div => {
      const payoutUSD = item.shares * div.amount;
      const payoutTHB = payoutUSD * USD_THB_RATE;

      // 1. วันนี้เป็นวันจ่ายจริง (Pay-Date)
      if (div.payDate === todayStr) {
        const notifiedKey = `PAID_${item.ticker}_${div.payDate}`;
        if (!props.getProperty(notifiedKey)) {
          todayPayList.push({
            ticker: item.ticker,
            shares: item.shares,
            amount: div.amount,
            payoutUSD: payoutUSD,
            payoutTHB: payoutTHB,
            payDate: div.payDate
          });
          props.setProperty(notifiedKey, "true");
        }
      }

      // 2. มีวันขึ้น XD ในอีก 3 วันข้างหน้า
      const diffDays = getDaysDifference(todayStr, div.exDate);
      if (diffDays >= 0 && diffDays <= 3) {
        const xdKey = `XD_${item.ticker}_${div.exDate}`;
        if (!props.getProperty(xdKey)) {
          upcomingXdList.push({
            ticker: item.ticker,
            shares: item.shares,
            amount: div.amount,
            exDate: div.exDate,
            payDate: div.payDate,
            payoutUSD: payoutUSD,
            payoutTHB: payoutTHB
          });
          props.setProperty(xdKey, "true");
        }
      }
    });
  });

  if (todayPayList.length > 0 || upcomingXdList.length > 0) {
    sendDiscordNotification(todayPayList, upcomingXdList);
  } else {
    Logger.log("วันนี้ไม่มีกำหนดจ่ายปันผลหรือวันขึ้น XD ใหม่");
  }
}

/**
 * จัดการ Google Sheet: สร้างหรือเปิด Sheet
 */
function getOrCreatePortfolioSheet() {
  let ss;
  if (SPREADSHEET_ID && SPREADSHEET_ID.trim() !== "") {
    ss = SpreadsheetApp.openById(SPREADSHEET_ID.trim());
  } else {
    const props = PropertiesService.getScriptProperties();
    let savedId = props.getProperty("AUTO_SPREADSHEET_ID");
    if (savedId) {
      try {
        ss = SpreadsheetApp.openById(savedId);
      } catch (e) {
        ss = null;
      }
    }
    if (!ss) {
      ss = SpreadsheetApp.create("ETF Dividend Tracker Portfolio");
      props.setProperty("AUTO_SPREADSHEET_ID", ss.getId());
      Logger.log("สร้าง Google Sheet ใหม่แล้ว URL: " + ss.getUrl());
    }
  }

  let sheet = ss.getSheetByName("Holdings");
  if (!sheet) {
    sheet = ss.insertSheet("Holdings");
    sheet.appendRow(["Ticker", "Shares", "AverageCostUSD", "LastUpdated"]);
    sheet.getRange("A1:D1").setFontWeight("bold").setBackground("#10B981").setFontColor("#ffffff");
    // Seed initial row
    sheet.appendRow(["CHPY", 0.1145716, 19.85, new Date().toISOString()]);
    sheet.appendRow(["SCHD", 10, 83.10, new Date().toISOString()]);
    sheet.appendRow(["JEPI", 5, 56.40, new Date().toISOString()]);
  }
  return sheet;
}

/**
 * ดึงรายการหุ้นจาก Google Sheet
 */
function getHoldingsFromSheet(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const holdings = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0]) {
      holdings.push({
        ticker: String(row[0]).trim().toUpperCase(),
        shares: parseFloat(row[1]) || 0,
        averageCostUSD: parseFloat(row[2]) || 0,
        updatedAt: row[3] || ""
      });
    }
  }
  return holdings;
}

/**
 * ซิงค์รายการหุ้นจากหน้าเว็บลง Google Sheet
 */
function syncHoldingsToSheet(sheet, holdings) {
  sheet.clearContents();
  sheet.appendRow(["Ticker", "Shares", "AverageCostUSD", "LastUpdated"]);
  sheet.getRange("A1:D1").setFontWeight("bold").setBackground("#10B981").setFontColor("#ffffff");

  holdings.forEach(h => {
    sheet.appendRow([h.ticker, h.shares, h.averageCostUSD || 0, h.updatedAt || new Date().toISOString()]);
  });
}

/**
 * ดึงข้อมูลเงินปันผลจาก Yahoo Finance API
 */
function fetchYahooDividendData(ticker) {
  const url = `https://query2.finance.yahoo.com/v8/finance/chart/${ticker}?events=div&interval=1d&range=1y`;
  try {
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    if (response.getResponseCode() !== 200) return null;

    const json = JSON.parse(response.getContentText());
    const result = json.chart && json.chart.result && json.chart.result[0];
    if (!result) return null;

    const rawDivs = (result.events && result.events.dividends) || {};
    const dividends = Object.values(rawDivs).map(d => {
      const exDateObj = new Date(d.date * 1000);
      const payDateObj = new Date((d.date + 7 * 86400) * 1000);
      return {
        amount: d.amount,
        exDate: Utilities.formatDate(exDateObj, "Asia/Bangkok", "yyyy-MM-dd"),
        payDate: Utilities.formatDate(payDateObj, "Asia/Bangkok", "yyyy-MM-dd")
      };
    });

    return { ticker, dividends };
  } catch (e) {
    Logger.log("Fetch error for " + ticker + ": " + e.message);
    return null;
  }
}

/**
 * ยิงข้อความเข้า Discord Webhook
 */
function sendDiscordNotification(todayPayList, upcomingXdList) {
  const fields = [];

  if (todayPayList.length > 0) {
    todayPayList.forEach(item => {
      fields.push({
        name: `🎉 เงินปันผลเข้าวันนี้! [${item.ticker}]`,
        value: `• **จำนวนหุ้น:** ${item.shares.toLocaleString()} หุ้น\n` +
               `• **ปันผล:** $${item.amount.toFixed(4)}/หุ้น\n` +
               `• **ยอดเงินที่จะได้รับ:** **$${item.payoutUSD.toFixed(2)} USD** (≈ ฿${item.payoutTHB.toFixed(2)} THB)\n` +
               `• **วันจ่าย:** ${formatThaiDate(item.payDate)}`,
        inline: false
      });
    });
  }

  if (upcomingXdList.length > 0) {
    upcomingXdList.forEach(item => {
      fields.push({
        name: `⏳ แจ้งเตือนวันขึ้น XD ใกล้ถึง! [${item.ticker}]`,
        value: `• **วันขึ้น XD:** ${formatThaiDate(item.exDate)}\n` +
               `• **วันจ่ายจริง:** ${formatThaiDate(item.payDate)}\n` +
               `• **ประมาณการยอดเงิน:** **$${item.payoutUSD.toFixed(2)} USD** (≈ ฿${item.payoutTHB.toFixed(2)} THB)`,
        inline: false
      });
    });
  }

  const payload = {
    username: "ETF Dividend Auto-Alert",
    avatar_url: "https://cdn-icons-png.flaticon.com/512/2454/2454274.png",
    embeds: [
      {
        title: "🔔 แจ้งเตือนเงินปันผล ETF ประจำวัน (Auto)",
        color: todayPayList.length > 0 ? 0x10B981 : 0x38BDF8,
        fields: fields,
        footer: { text: "Cloud Automation • Google Sheet Synced" },
        timestamp: new Date().toISOString()
      }
    ]
  };

  UrlFetchApp.fetch(DISCORD_WEBHOOK_URL, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload)
  });
}

function getDaysDifference(dateStr1, dateStr2) {
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
}

function formatThaiDate(dateStr) {
  if (!dateStr) return "-";
  const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const p = dateStr.split("-");
  const y = parseInt(p[0]) + 543;
  const m = months[parseInt(p[1]) - 1];
  const d = parseInt(p[2]);
  return `${d} ${m} ${y}`;
}
