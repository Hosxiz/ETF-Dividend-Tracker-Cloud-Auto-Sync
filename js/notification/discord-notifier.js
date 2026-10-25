import { DividendCalculator } from '../portfolio/dividend-calc.js';

export class DiscordNotifier {
  /**
   * Validates Discord Webhook URL format
   * @param {string} url 
   * @returns {boolean}
   */
  static isValidWebhookUrl(url) {
    if (!url) return false;
    return /^https:\/\/(?:ptb\.|canary\.)?discord(?:app)?\.com\/api\/webhooks\/\d+\/[\w-]+$/i.test(url.trim());
  }

  /**
   * Dispatches upcoming dividend notification and portfolio summary to Discord
   * @param {string} webhookUrl 
   * @param {object} summary Output of DividendCalculator.computePortfolioSummary
   * @returns {Promise<{success: boolean, message: string}>}
   */
  static async sendDividendNotification(webhookUrl, summary) {
    if (!this.isValidWebhookUrl(webhookUrl)) {
      return { success: false, message: 'Discord Webhook URL ไม่ถูกต้อง (ต้องขึ้นต้นด้วย https://discord.com/api/webhooks/...)' };
    }

    const { totalHoldings, totalWeeklyUSD, totalWeeklyTHB, totalMonthlyUSD, totalMonthlyTHB, totalAnnualUSD, totalAnnualTHB, upcomingList } = summary;

    let description = `📊 **สรุปภาพรวมพอร์ต ETF**\n` +
      `• ถือครองทั้งหมด: **${totalHoldings}** Tickers\n` +
      `• ประมาณการปันผลต่อสัปดาห์: **$${(totalWeeklyUSD || 0).toFixed(2)} USD** (≈ ฿${(totalWeeklyTHB || 0).toLocaleString('th-TH')})\n` +
      `• ประมาณการปันผลต่อเดือน: **$${(totalMonthlyUSD || 0).toFixed(2)} USD** (≈ ฿${(totalMonthlyTHB || 0).toLocaleString('th-TH')})\n` +
      `• ประมาณการปันผลทั้งปี: **$${totalAnnualUSD.toFixed(2)} USD** (≈ ฿${totalAnnualTHB.toLocaleString('th-TH')})\n\n`;

    const fields = [];

    if (upcomingList.length > 0) {
      description += `🔔 **มี ETF ที่จ่ายปันผลในอีก 30 วันข้างหน้า (${upcomingList.length} รายการ):**\n`;
      upcomingList.forEach(item => {
        fields.push({
          name: `📌 ${item.ticker} (${item.shares.toLocaleString()} หุ้น)`,
          value: `• **วันขึ้น XD:** ${DividendCalculator.formatThaiDate(item.exDate)}\n` +
                 `• **วันจ่ายปันผล:** ${DividendCalculator.formatThaiDate(item.payDate)}\n` +
                 `• **ปันผล/หุ้น:** $${item.amountPerShare.toFixed(4)}\n` +
                 `• **เงินที่จะได้รับ:** **$${item.estimatedPayoutUSD.toFixed(2)}** (≈ ฿${item.estimatedPayoutTHB.toFixed(2)})`,
          inline: true
        });
      });
    } else {
      description += `ℹ️ *ไม่มี ETF ที่มีกำหนดการขึ้น XD หรือจ่ายปันผลใน 30 วันข้างหน้า*`;
    }

    const payload = {
      username: 'ETF Dividend Bot',
      avatar_url: 'https://cdn-icons-png.flaticon.com/512/2454/2454274.png',
      embeds: [
        {
          title: '💰 รายงานการแจ้งเตือนเงินปันผล ETF',
          description,
          color: upcomingList.length > 0 ? 0x10B981 : 0x38BDF8,
          fields,
          footer: { text: 'ETF Dividend Tracker v1.4 • Dime OCR Enabled' },
          timestamp: new Date().toISOString()
        }
      ]
    };

    try {
      const response = await fetch(webhookUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok || response.status === 204) {
        return { success: true, message: 'ส่งข้อความแจ้งเตือนเข้า Discord Channel เรียบร้อยแล้ว!' };
      } else {
        const errorText = await response.text();
        return { success: false, message: `Discord ตอบกลับรหัส ${response.status}: ${errorText}` };
      }
    } catch (err) {
      return { success: false, message: `เกิดข้อผิดพลาดในการส่ง Webhook: ${err.message}` };
    }
  }
}
