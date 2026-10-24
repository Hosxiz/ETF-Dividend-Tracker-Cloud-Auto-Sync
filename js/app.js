/**
 * app.js
 * Main Application Orchestrator: wires UI events, store, providers, and modules.
 * 
 * Improvements implemented:
 * C1: Double-click protection via async mutex
 * C2: Modal close on overlay click + Escape key
 * C4: Toast fade-out animation
 * I1: Loading overlay on startup
 * I2: Improved empty states
 * I4: Edit holding (click-to-edit)
 * I5: Delete confirmation inline
 * N1: KPI count-up animation
 * N3: Staggered fade-in (via CSS)
 * N4: Footer last-updated timestamp
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
    this._busyLock = new Set(); // C1: Async mutex for button operations
    this._editingTicker = null;  // I4: Currently editing ticker
    this.init();
  }

  async init() {
    this.loadState();
    this.bindEvents();
    this.bindModalOverlays(); // C2
    this.bindEscapeKey();     // C2
    this.renderSkeletonKPIs(); // I1: Show skeleton while loading

    await this.refreshMarketData();

    this.hideLoadingOverlay(); // I1
    this.render();
    this.updateFooterTimestamp(); // N4
  }

  loadState() {
    this.holdings = PortfolioStore.getHoldings();
    this.settings = PortfolioStore.getSettings();
    this.updateDiscordStatus();
  }

  // ========================================
  // C1: Async Mutex — prevents double-click
  // ========================================
  _isLocked(key) {
    return this._busyLock.has(key);
  }

  _lock(key) {
    this._busyLock.add(key);
  }

  _unlock(key) {
    this._busyLock.delete(key);
  }

  // ========================================
  // I1: Loading Overlay
  // ========================================
  hideLoadingOverlay() {
    const overlay = document.getElementById('app-loading');
    if (overlay) {
      overlay.classList.add('hidden');
      setTimeout(() => overlay.remove(), 500);
    }
  }

  renderSkeletonKPIs() {
    const kpiIds = ['kpi-weekly-usd', 'kpi-monthly-usd', 'kpi-annual-usd', 'kpi-upcoming-count'];
    kpiIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.add('skeleton');
    });
  }

  clearSkeletonKPIs() {
    const kpiIds = ['kpi-weekly-usd', 'kpi-monthly-usd', 'kpi-annual-usd', 'kpi-upcoming-count'];
    kpiIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('skeleton');
    });
  }

  // ========================================
  // C2: Modal Overlay Click + Escape
  // ========================================
  bindModalOverlays() {
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(modal => {
      modal.addEventListener('click', (e) => {
        // Only close if clicking the overlay itself, not the modal content
        if (e.target === modal) {
          this.closeModal(modal.id);
        }
      });
    });
  }

  bindEscapeKey() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const activeModal = document.querySelector('.modal-overlay[style*="display: flex"], .modal-overlay.active');
        if (activeModal) {
          this.closeModal(activeModal.id);
        }
      }
    });
  }

  // ========================================
  // Event Bindings
  // ========================================
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
    document.getElementById('btn-show-add-holding').addEventListener('click', () => {
      this._editingTicker = null; // I4: Reset edit mode
      document.getElementById('modal-add-holding-title').textContent = '➕ เพิ่ม Ticker ใหม่เข้าพอร์ต';
      document.getElementById('add-ticker').value = '';
      document.getElementById('add-ticker').disabled = false;
      document.getElementById('add-shares').value = '';
      this.openModal('modal-add-holding');
    });
    document.getElementById('btn-cancel-add').addEventListener('click', () => this.closeModal('modal-add-holding'));
    document.getElementById('form-add-holding').addEventListener('submit', (e) => {
      e.preventDefault();
      const ticker = document.getElementById('add-ticker').value.trim().toUpperCase();
      const shares = parseFloat(document.getElementById('add-shares').value);
      if (ticker && !isNaN(shares)) {
        this.holdings = PortfolioStore.upsertHolding(ticker, shares);
        this.closeModal('modal-add-holding');
        const action = this._editingTicker ? 'อัปเดต' : 'เพิ่ม';
        this.showToast(`${action} ${ticker} (${shares} หุ้น) เรียบร้อย!`);
        this._editingTicker = null;
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
      if (this._isLocked('gas-sync')) return; // C1
      const gasUrl = document.getElementById('setting-gas-url').value.trim();
      if (!gasUrl) {
        this.showToast('กรุณากรอก Google Apps Script Web App URL ก่อนกดทดสอบ', true);
        return;
      }

      const btn = document.getElementById('btn-test-gas-sync');
      this._lock('gas-sync'); // C1
      const originalText = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span>⏳ กำลังทดสอบส่ง...</span>';

      const success = await this.syncPortfolioToGoogleSheet(gasUrl);
      btn.disabled = false;
      btn.innerHTML = originalText;
      this._unlock('gas-sync'); // C1

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

    // Check & Notify button — C1: with mutex
    document.getElementById('btn-check-notify').addEventListener('click', () => this.handleCheckAndNotify());

    // Export CSV
    document.getElementById('btn-export-csv').addEventListener('click', () => {
      CsvExporter.exportPortfolioToCsv(this.holdings, this.marketDataMap);
      this.showToast('ดาวน์โหลดไฟล์ CSV เรียบร้อยแล้ว');
    });

    // Refresh Data button — C1: with mutex
    document.getElementById('btn-refresh-data').addEventListener('click', async () => {
      if (this._isLocked('refresh')) return; // C1
      this._lock('refresh');

      const btn = document.getElementById('btn-refresh-data');
      const originalText = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span>⏳ กำลังดึงข้อมูล...</span>';

      await this.refreshMarketData();
      this.render();
      this.updateFooterTimestamp(); // N4

      btn.disabled = false;
      btn.innerHTML = originalText;
      this._unlock('refresh'); // C1
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

  // ========================================
  // N1: Count-Up Animation for KPI values
  // ========================================
  animateValue(element, startVal, endVal, prefix = '$', suffix = '', duration = 600) {
    const startTime = performance.now();
    const diff = endVal - startVal;

    const step = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = startVal + diff * easeOut;

      element.textContent = `${prefix}${current.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${suffix}`;

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }

  render() {
    this.clearSkeletonKPIs(); // I1: Remove skeletons

    const summary = DividendCalculator.computePortfolioSummary(this.holdings, this.marketDataMap);

    // N1: KPI Banner with count-up animation
    const weeklyEl = document.getElementById('kpi-weekly-usd');
    const monthlyEl = document.getElementById('kpi-monthly-usd');
    const annualEl = document.getElementById('kpi-annual-usd');

    this.animateValue(weeklyEl, 0, summary.totalWeeklyUSD, '$');
    this.animateValue(monthlyEl, 0, summary.totalMonthlyUSD, '$');
    this.animateValue(annualEl, 0, summary.totalAnnualUSD, '$');

    document.getElementById('kpi-weekly-thb').textContent = `≈ ฿${summary.totalWeeklyTHB.toLocaleString('th-TH', { minimumFractionDigits: 2 })} THB / สัปดาห์`;
    document.getElementById('kpi-monthly-thb').textContent = `≈ ฿${summary.totalMonthlyTHB.toLocaleString('th-TH', { minimumFractionDigits: 2 })} THB / เดือน`;
    document.getElementById('kpi-annual-thb').textContent = `≈ ฿${summary.totalAnnualTHB.toLocaleString('th-TH', { minimumFractionDigits: 2 })} THB / ปี`;

    document.getElementById('kpi-upcoming-count').textContent = `${summary.upcomingCount} รอบ`;

    // Render Holdings List
    this.renderHoldingsList();

    // Render Upcoming Dividends within 30 days
    this.renderUpcomingDividends(summary);

    // Render Dividend History
    this.renderDividendHistory();
  }

  // ========================================
  // I2: Improved Holdings List with Edit (I4) & Delete Confirmation (I5)
  // ========================================
  renderHoldingsList() {
    const holdingsContainer = document.getElementById('holdings-list');
    holdingsContainer.innerHTML = '';

    if (this.holdings.length === 0) {
      // I2: Rich empty state
      holdingsContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📂</div>
          <div class="empty-state-title">ยังไม่มีหุ้นในพอร์ต</div>
          <div class="empty-state-text">กดปุ่ม "+ เพิ่มหุ้น" ด้านบน หรือลากรูปสลีป Dime มาวางเพื่อเริ่มติดตามเงินปันผล</div>
        </div>`;
      return;
    }

    this.holdings.forEach((h) => {
      const m = this.marketDataMap.get(h.ticker);
      const annualRate = m?.estimatedAnnualPayoutPerShare || 0;
      const estPayout = (h.shares * annualRate).toFixed(2);

      const el = document.createElement('div');
      el.className = 'holding-item';

      const isLive = m && m.isFallback === false;
      const statusBadge = isLive
        ? `<span style="font-size: 0.72rem; padding: 2px 7px; border-radius: 6px; background: rgba(16, 185, 129, 0.15); color: #34D399; border: 1px solid rgba(16, 185, 129, 0.3); font-weight: 600; margin-left: 8px;">🟢 ข้อมูลสดตลาดจริง</span>`
        : `<span style="font-size: 0.72rem; padding: 2px 7px; border-radius: 6px; background: rgba(251, 191, 36, 0.15); color: #FBBF24; border: 1px solid rgba(251, 191, 36, 0.3); font-weight: 600; margin-left: 8px;">🟡 ข้อมูลสำรองในเครื่อง</span>`;

      el.innerHTML = `
        <div style="flex: 1; min-width: 0;">
          <div style="display: flex; align-items: center; flex-wrap: wrap; gap: 4px;">
            <span class="holding-ticker">${h.ticker}</span>
            ${statusBadge}
          </div>
          <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 3px;">
            ราคาหุ้น: $${m?.lastPrice?.toFixed(2) || '—'} | ปันผล: $${annualRate.toFixed(2)}/หุ้น/ปี
          </div>
        </div>
        <div style="text-align: right; margin-right: 12px; flex-shrink: 0;">
          <div class="holding-shares">${h.shares.toLocaleString()} หุ้น</div>
          <div style="font-size: 0.8rem; color: #34D399;">รับประมาณ ~$${estPayout}/ปี</div>
        </div>
        <div class="holding-actions">
          <button class="btn btn-edit" data-action="edit" title="แก้ไขจำนวนหุ้น">✏️</button>
          <button class="btn btn-danger" data-action="delete" title="ลบออกจากพอร์ต">🗑️</button>
        </div>
      `;

      // I4: Edit button handler
      el.querySelector('[data-action="edit"]').addEventListener('click', () => {
        this._editingTicker = h.ticker;
        document.getElementById('modal-add-holding-title').textContent = `✏️ แก้ไขจำนวนหุ้น ${h.ticker}`;
        document.getElementById('add-ticker').value = h.ticker;
        document.getElementById('add-ticker').disabled = true; // Lock ticker during edit
        document.getElementById('add-shares').value = h.shares;
        this.openModal('modal-add-holding');
      });

      // I5: Delete button with confirmation
      el.querySelector('[data-action="delete"]').addEventListener('click', (e) => {
        const deleteBtn = e.currentTarget;
        // Check if confirmation bar already exists
        if (el.querySelector('.confirm-delete-bar')) return;

        const confirmBar = document.createElement('div');
        confirmBar.className = 'confirm-delete-bar';
        confirmBar.innerHTML = `
          <span>ลบ <strong>${h.ticker}</strong> ออกจากพอร์ต?</span>
          <button class="btn btn-danger" style="padding: 4px 10px; font-size: 0.78rem;">ยืนยันลบ</button>
          <button class="btn btn-secondary" style="padding: 4px 10px; font-size: 0.78rem;">ยกเลิก</button>
        `;

        // Confirm delete
        confirmBar.querySelectorAll('button')[0].addEventListener('click', () => {
          const removedHolding = { ...h }; // Save for undo
          this.holdings = PortfolioStore.removeHolding(h.ticker);
          this.marketDataMap.delete(h.ticker);
          this.render();
          this.showToastWithUndo(
            `ลบ ${h.ticker} ออกจากพอร์ตแล้ว`,
            () => {
              // Undo: re-add the holding
              this.holdings = PortfolioStore.upsertHolding(removedHolding.ticker, removedHolding.shares, removedHolding.averageCostUSD);
              this.refreshMarketData().then(() => this.render());
              this.showToast(`กู้คืน ${removedHolding.ticker} เรียบร้อยแล้ว`);
            }
          );
        });

        // Cancel delete
        confirmBar.querySelectorAll('button')[1].addEventListener('click', () => {
          confirmBar.remove();
        });

        el.appendChild(confirmBar);

        // Auto-remove confirmation bar after 5s
        setTimeout(() => {
          if (el.contains(confirmBar)) confirmBar.remove();
        }, 5000);
      });

      holdingsContainer.appendChild(el);
    });
  }

  renderUpcomingDividends(summary) {
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
  }

  renderDividendHistory() {
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
      historyContainer.innerHTML = `
        <div class="empty-state" style="padding: 20px;">
          <div class="empty-state-icon" style="font-size: 2rem;">📊</div>
          <div class="empty-state-text">ยังไม่มีประวัติปันผลย้อนหลัง — กดปุ่ม "รีเฟรชข้อมูล" เพื่อดึงข้อมูลจากตลาด</div>
        </div>`;
    }
  }

  // ========================================
  // Discord Notification — C1: with mutex
  // ========================================
  async handleCheckAndNotify() {
    if (this._isLocked('notify')) return; // C1

    if (!this.settings.discordWebhookUrl) {
      this.showToast('กรุณาตั้งค่า Discord Webhook URL ในเมนู Settings ก่อน', true);
      this.openModal('modal-settings');
      return;
    }

    this._lock('notify'); // C1
    const btn = document.getElementById('btn-check-notify');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span>⏳ กำลังตรวจสอบและส่ง...</span>';

    await this.refreshMarketData();
    const summary = DividendCalculator.computePortfolioSummary(this.holdings, this.marketDataMap);
    const result = await DiscordNotifier.sendDividendNotification(this.settings.discordWebhookUrl, summary);

    btn.disabled = false;
    btn.innerHTML = originalText;
    this._unlock('notify'); // C1

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

  // ========================================
  // Modal Helpers
  // ========================================
  openModal(id) {
    document.getElementById(id).style.display = 'flex';
  }

  closeModal(id) {
    document.getElementById(id).style.display = 'none';
  }

  // ========================================
  // Google Sheet Sync
  // ========================================
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

  // ========================================
  // C4: Toast with Fade-Out Animation
  // ========================================
  showToast(message, isError = false) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    if (isError) {
      toast.style.borderLeftColor = '#F87171';
    }
    toast.textContent = message;
    container.appendChild(toast);

    // C4: Fade-out before removal
    setTimeout(() => {
      toast.classList.add('toast-leaving');
      setTimeout(() => toast.remove(), 400);
    }, 3600);
  }

  // I5: Toast with Undo action
  showToastWithUndo(message, undoCallback) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';

    const textSpan = document.createElement('span');
    textSpan.textContent = message;

    const undoLink = document.createElement('span');
    undoLink.className = 'toast-undo';
    undoLink.textContent = 'กู้คืน';
    undoLink.addEventListener('click', () => {
      undoCallback();
      toast.classList.add('toast-leaving');
      setTimeout(() => toast.remove(), 400);
    });

    toast.appendChild(textSpan);
    toast.appendChild(undoLink);
    container.appendChild(toast);

    // Auto-dismiss after 6s (longer for undo toasts)
    setTimeout(() => {
      toast.classList.add('toast-leaving');
      setTimeout(() => toast.remove(), 400);
    }, 6000);
  }

  // ========================================
  // N4: Footer Last Updated Timestamp
  // ========================================
  updateFooterTimestamp() {
    const el = document.getElementById('footer-last-updated');
    if (el) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
      const dateStr = DividendCalculator.formatThaiDate(now.toISOString());
      el.textContent = `อัปเดตล่าสุด: ${dateStr} เวลา ${timeStr}`;
    }
  }
}

// Bootstrap application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  new App();
});
