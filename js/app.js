/**
 * app.js
 * Main Application Orchestrator: wires UI events, store, providers, and modules.
 */

import { PortfolioStore } from './portfolio/portfolio-store.js';
import { DividendCalculator } from './portfolio/dividend-calc.js';
import { YahooFinanceProvider } from './market-data/yahoo-provider.js';
import { OcrEngine } from './slip-parser/ocr-engine.js';
import { DimeExtractor } from './slip-parser/dime-extractor.js';
import { DiscordNotifier } from './notification/discord-notifier.js';
import { CsvExporter } from './data-export/csv-exporter.js';

class App {
  constructor() {
    this.marketDataMap = new Map();
    this.holdings = [];
    this.settings = { discordWebhookUrl: '' };
    this.init();
  }

  async init() {
    this.loadState();
    this.bindEvents();
    await this.refreshMarketData();
    this.render();
  }

  loadState() {
    this.holdings = PortfolioStore.getHoldings();
    this.settings = PortfolioStore.getSettings();
    this.updateDiscordStatus();
  }

  bindEvents() {
    // Dropzone & File upload
    const dropzone = document.getElementById('slip-dropzone');
    const fileInput = document.getElementById('slip-file-input');

    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files?.length > 0) {
        this.processSlipFile(e.dataTransfer.files[0]);
      }
    });
    fileInput.addEventListener('change', (e) => {
      if (e.target.files?.length > 0) {
        this.processSlipFile(e.target.files[0]);
      }
    });

    // Slip confirm modal
    document.getElementById('form-confirm-slip').addEventListener('submit', (e) => {
      e.preventDefault();
      const ticker = document.getElementById('slip-ticker').value.trim();
      const shares = parseFloat(document.getElementById('slip-shares').value);
      const price = parseFloat(document.getElementById('slip-price').value) || 0;

      this.holdings = PortfolioStore.upsertHolding(ticker, shares, price);
      this.closeModal('modal-slip-confirm');
      this.showToast(`บันทึก ${ticker} (${shares} หุ้น) เข้าพอร์ตเรียบร้อย!`);
      this.syncPortfolioToGoogleSheet();
      this.refreshMarketData().then(() => this.render());
    });
    document.getElementById('btn-cancel-slip').addEventListener('click', () => this.closeModal('modal-slip-confirm'));

    // Add holding modal
    document.getElementById('btn-show-add-holding').addEventListener('click', () => this.openModal('modal-add-holding'));
    document.getElementById('btn-cancel-add').addEventListener('click', () => this.closeModal('modal-add-holding'));
    document.getElementById('form-add-holding').addEventListener('submit', (e) => {
      e.preventDefault();
      const ticker = document.getElementById('add-ticker').value.trim().toUpperCase();
      const shares = parseFloat(document.getElementById('add-shares').value);
      if (ticker && !isNaN(shares)) {
        this.holdings = PortfolioStore.upsertHolding(ticker, shares);
        this.closeModal('modal-add-holding');
        this.showToast(`เพิ่ม ${ticker} เข้าพอร์ตเรียบร้อย!`);
        this.syncPortfolioToGoogleSheet();
        this.refreshMarketData().then(() => this.render());
      }
    });

    // Settings modal
    document.getElementById('btn-open-settings').addEventListener('click', () => {
      document.getElementById('setting-discord-url').value = this.settings.discordWebhookUrl || '';
      document.getElementById('setting-gas-url').value = this.settings.gasWebAppUrl || '';
      this.openModal('modal-settings');
    });
    document.getElementById('btn-cancel-settings').addEventListener('click', () => this.closeModal('modal-settings'));

    // Test Cloud Sync button
    document.getElementById('btn-test-gas-sync').addEventListener('click', async () => {
      const gasUrl = document.getElementById('setting-gas-url').value.trim();
      if (!gasUrl) {
        this.showToast('กรุณากรอก Google Apps Script Web App URL ก่อนกดทดสอบ', true);
        return;
      }

      const btn = document.getElementById('btn-test-gas-sync');
      const originalText = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span>⏳ กำลังทดสอบส่ง...</span>';

      const success = await this.syncPortfolioToGoogleSheet(gasUrl);
      btn.disabled = false;
      btn.innerHTML = originalText;

      if (success) {
        this.showToast('🚀 ส่งข้อมูลทดสอบไป Google Sheet สำเร็จเรียบร้อย!');
      } else {
        this.showToast('⚠️ ส่งข้อมูลทดสอบเรียบร้อย (กรุณาเปิด Google Drive เช็คไฟล์)', false);
      }
    });

    document.getElementById('form-settings').addEventListener('submit', (e) => {
      e.preventDefault();
      const discordUrl = document.getElementById('setting-discord-url').value.trim();
      const gasUrl = document.getElementById('setting-gas-url').value.trim();
      this.settings.discordWebhookUrl = discordUrl;
      this.settings.gasWebAppUrl = gasUrl;
      PortfolioStore.saveSettings(this.settings);
      this.updateDiscordStatus();
      this.closeModal('modal-settings');
      this.showToast('บันทึกการตั้งค่าเรียบร้อย!');
      if (gasUrl) {
        this.syncPortfolioToGoogleSheet();
      }
    });

    // Check & Notify button
    document.getElementById('btn-check-notify').addEventListener('click', () => this.handleCheckAndNotify());

    // Export CSV
    document.getElementById('btn-export-csv').addEventListener('click', () => {
      CsvExporter.exportPortfolioToCsv(this.holdings, this.marketDataMap);
      this.showToast('ดาวน์โหลดไฟล์ CSV เรียบร้อยแล้ว');
    });

    // Refresh Data button
    document.getElementById('btn-refresh-data').addEventListener('click', async () => {
      const btn = document.getElementById('btn-refresh-data');
      const originalText = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span>⏳ กำลังดึงข้อมูล...</span>';

      await this.refreshMarketData();
      this.render();

      btn.disabled = false;
      btn.innerHTML = originalText;
      this.showToast('อัปเดตข้อมูลปันผลและราคาล่าสุดเรียบร้อย!');
    });
  }

  async processSlipFile(file) {
    const progressBox = document.getElementById('ocr-progress-box');
    const progressBar = document.getElementById('ocr-progress-bar');
    const progressText = document.getElementById('ocr-progress-text');

    progressBox.style.display = 'block';
    try {
      const rawText = await OcrEngine.recognizeSlip(file, ({ status, progress }) => {
        progressBar.style.width = `${Math.round(progress * 100)}%`;
        progressText.textContent = status;
      });

      const extracted = DimeExtractor.extractFields(rawText);

      // Pre-fill confirm modal
      document.getElementById('slip-ticker').value = extracted.ticker || 'CHPY';
      document.getElementById('slip-shares').value = extracted.shares || '';
      document.getElementById('slip-price').value = extracted.priceUSD || '';
      document.getElementById('slip-date').value = extracted.orderDate || new Date().toLocaleDateString('th-TH');

      progressBox.style.display = 'none';
      this.openModal('modal-slip-confirm');
    } catch (err) {
      progressBox.style.display = 'none';
      this.showToast(`เกิดข้อผิดพลาดในการอ่านภาพ: ${err.message}`, true);
    }
  }

  async refreshMarketData() {
    const fetchPromises = this.holdings.map(async (h) => {
      const data = await YahooFinanceProvider.fetchETFData(h.ticker);
      if (data) {
        this.marketDataMap.set(h.ticker, data);
      }
    });
    await Promise.all(fetchPromises);
  }

  render() {
    const summary = DividendCalculator.computePortfolioSummary(this.holdings, this.marketDataMap);

    // KPI Banner
    document.getElementById('kpi-weekly-usd').textContent = `$${summary.totalWeeklyUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    document.getElementById('kpi-weekly-thb').textContent = `≈ ฿${summary.totalWeeklyTHB.toLocaleString('th-TH', { minimumFractionDigits: 2 })} THB / สัปดาห์`;

    document.getElementById('kpi-monthly-usd').textContent = `$${summary.totalMonthlyUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    document.getElementById('kpi-monthly-thb').textContent = `≈ ฿${summary.totalMonthlyTHB.toLocaleString('th-TH', { minimumFractionDigits: 2 })} THB / เดือน`;

    document.getElementById('kpi-annual-usd').textContent = `$${summary.totalAnnualUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    document.getElementById('kpi-annual-thb').textContent = `≈ ฿${summary.totalAnnualTHB.toLocaleString('th-TH', { minimumFractionDigits: 2 })} THB / ปี`;

    document.getElementById('kpi-upcoming-count').textContent = `${summary.upcomingCount} รอบ`;

    // Render Holdings List
    const holdingsContainer = document.getElementById('holdings-list');
    holdingsContainer.innerHTML = '';
    if (this.holdings.length === 0) {
      holdingsContainer.innerHTML = `<div style="color: var(--text-dim); padding: 12px; text-align: center;">ไม่มี Ticker ในพอร์ต</div>`;
    } else {
      this.holdings.forEach((h) => {
        const m = this.marketDataMap.get(h.ticker);
        const annualRate = m?.estimatedAnnualPayoutPerShare || 0;
        const estPayout = (h.shares * annualRate).toFixed(2);

        const el = document.createElement('div');
        el.className = 'holding-item';

        const isLive = m && m.isFallback === false;
        const statusBadge = isLive
          ? `<span style="font-size: 0.72rem; padding: 2px 7px; border-radius: 6px; background: rgba(16, 185, 129, 0.15); color: #34D399; border: 1px solid rgba(16, 185, 129, 0.3); font-weight: 600; margin-left: 8px;">🟢 Live Yahoo</span>`
          : `<span style="font-size: 0.72rem; padding: 2px 7px; border-radius: 6px; background: rgba(251, 191, 36, 0.15); color: #FBBF24; border: 1px solid rgba(251, 191, 36, 0.3); font-weight: 600; margin-left: 8px;">🟡 Offline Fallback</span>`;

        el.innerHTML = `
          <div>
            <div style="display: flex; align-items: center;">
              <span class="holding-ticker">${h.ticker}</span>
              ${statusBadge}
            </div>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 3px;">
              ราคา: $${m?.lastPrice?.toFixed(2) || '—'} | ปันผล/หุ้น/ปี: $${annualRate.toFixed(2)}
            </div>
          </div>
          <div style="text-align: right; margin-right: 12px;">
            <div class="holding-shares">${h.shares.toLocaleString()} หุ้น</div>
            <div style="font-size: 0.8rem; color: #34D399;">~$${estPayout}/ปี</div>
          </div>
          <button class="btn btn-danger" data-ticker="${h.ticker}">ลบ</button>
        `;

        el.querySelector('button').addEventListener('click', () => {
          this.holdings = PortfolioStore.removeHolding(h.ticker);
          this.marketDataMap.delete(h.ticker);
          this.render();
          this.showToast(`ลบ ${h.ticker} ออกจากพอร์ตแล้ว`);
        });

        holdingsContainer.appendChild(el);
      });
    }

    // Render Upcoming Dividends within 30 days
    const upcomingContainer = document.getElementById('upcoming-dividends-container');
    upcomingContainer.innerHTML = '';
    if (summary.upcomingList.length > 0) {
      summary.upcomingList.forEach(item => {
        const card = document.createElement('div');
        card.className = 'upcoming-banner';
        card.innerHTML = `
          <span class="upcoming-badge">🔔 ปันผลใน 30 วัน</span>
          <div style="font-size: 1.1rem; font-weight: 700; color: #fff;">${item.ticker} จ่ายปันผล $${item.amountPerShare}/หุ้น</div>
          <div style="font-size: 0.85rem; color: var(--text-main); margin-top: 4px;">
            วันขึ้น XD: <strong>${DividendCalculator.formatThaiDate(item.exDate)}</strong> • วันจ่ายจริง: <strong>${DividendCalculator.formatThaiDate(item.payDate)}</strong>
          </div>
          <div style="font-size: 0.95rem; font-weight: 600; color: #34D399; margin-top: 6px;">
            ยอดที่จะได้รับ: $${item.estimatedPayoutUSD.toFixed(2)} (≈ ฿${item.estimatedPayoutTHB.toFixed(2)} THB)
          </div>
        `;
        upcomingContainer.appendChild(card);
      });
    }

    // Render Dividend History
    const historyContainer = document.getElementById('dividend-history-list');
    historyContainer.innerHTML = '';
    let hasAnyHistory = false;

    this.holdings.forEach(h => {
      const m = this.marketDataMap.get(h.ticker);
      if (m?.dividends?.length > 0) {
        hasAnyHistory = true;
        m.dividends.slice(0, 4).forEach(div => {
          const item = document.createElement('div');
          item.className = 'div-history-card';
          item.innerHTML = `
            <div>
              <span style="font-weight: 700; font-family: var(--font-mono); color: var(--secondary-cyan);">${h.ticker}</span>
              <span style="font-size: 0.85rem; color: var(--text-muted); margin-left: 8px;">
                XD: ${DividendCalculator.formatThaiDate(div.exDate)} | จ่าย: ${DividendCalculator.formatThaiDate(div.payDate)}
              </span>
            </div>
            <div style="font-weight: 700; font-family: var(--font-mono); color: #34D399;">
              +$${div.amountPerShare.toFixed(4)}
            </div>
          `;
          historyContainer.appendChild(item);
        });
      }
    });

    if (!hasAnyHistory) {
      historyContainer.innerHTML = `<div style="color: var(--text-dim); padding: 12px; text-align: center;">ไม่มีประวัติปันผลย้อนหลัง</div>`;
    }
  }

  async handleCheckAndNotify() {
    if (!this.settings.discordWebhookUrl) {
      this.showToast('กรุณาตั้งค่า Discord Webhook URL ในเมนู Settings ก่อน', true);
      this.openModal('modal-settings');
      return;
    }

    const btn = document.getElementById('btn-check-notify');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span>⏳ กำลังตรวจสอบและส่ง...</span>';

    await this.refreshMarketData();
    const summary = DividendCalculator.computePortfolioSummary(this.holdings, this.marketDataMap);
    const result = await DiscordNotifier.sendDividendNotification(this.settings.discordWebhookUrl, summary);

    btn.disabled = false;
    btn.innerHTML = originalText;

    if (result.success) {
      this.showToast(result.message);
    } else {
      this.showToast(result.message, true);
    }
  }

  updateDiscordStatus() {
    const display = document.getElementById('discord-url-display');
    const indicator = document.getElementById('discord-indicator');
    if (this.settings.discordWebhookUrl) {
      display.textContent = 'เชื่อมต่อแล้ว (Configured)';
      display.style.color = '#34D399';
      indicator.textContent = '🟢';
    } else {
      display.textContent = 'ยังไม่ได้ตั้งค่า';
      display.style.color = 'var(--text-dim)';
      indicator.textContent = '⚪';
    }
  }

  openModal(id) {
    document.getElementById(id).style.display = 'flex';
  }

  closeModal(id) {
    document.getElementById(id).style.display = 'none';
  }

  async syncPortfolioToGoogleSheet(customUrl = null) {
    const targetUrl = customUrl || this.settings.gasWebAppUrl;
    if (!targetUrl) return false;
    try {
      await fetch(targetUrl, {
        method: 'POST',
        mode: 'no-cors', // Google Apps Script Web App redirect handling
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sync_portfolio',
          holdings: this.holdings
        })
      });
      console.log('Synced portfolio to Google Sheet Cloud.');
      return true;
    } catch (err) {
      console.warn('Failed to sync portfolio to Google Sheet:', err);
      return false;
    }
  }

  showToast(message, isError = false) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    if (isError) {
      toast.style.borderLeftColor = '#F87171';
    }
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 4000);
  }
}

// Bootstrap application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  new App();
});
