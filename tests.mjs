import { test } from 'node:test';
import assert from 'node:assert';
import { DividendCalculator } from './js/portfolio/dividend-calc.js';
import { DimeExtractor } from './js/slip-parser/dime-extractor.js';
import { DiscordNotifier } from './js/notification/discord-notifier.js';

test('DividendCalculator.calculatePayout handles fractional shares correctly', () => {
  const payout = DividendCalculator.calculatePayout(0.1145716, 0.55);
  assert.strictEqual(payout, 0.063);
});

test('DividendCalculator.isWithinDays checks 30-day window accurately', () => {
  const today = new Date();
  const in10Days = new Date(today.getTime() + 10 * 86400000).toISOString().split('T')[0];
  const in60Days = new Date(today.getTime() + 60 * 86400000).toISOString().split('T')[0];

  assert.strictEqual(DividendCalculator.isWithinDays(in10Days, 30), true);
  assert.strictEqual(DividendCalculator.isWithinDays(in60Days, 30), false);
});

test('DimeExtractor accurately parses Dime slip OCR patterns', () => {
  const sampleDimeOcr = `
    Dime!
    ซื้อ RKLB
    NASDAQ
    199.94 THB
    ราคาที่ได้จริง 51.75 USD
    จำนวนหุ้น 0.1145716
    วันที่ส่งคำสั่ง 19 ต.ค. 69
  `;

  const parsed = DimeExtractor.extractFields(sampleDimeOcr);
  assert.strictEqual(parsed.ticker, 'RKLB');
  assert.strictEqual(parsed.priceUSD, 51.75);
  assert.strictEqual(parsed.shares, 0.1145716);
  assert.strictEqual(parsed.totalTHB, 199.94);
  assert.strictEqual(parsed.orderDate, '19 ต.ค. 69');
});

test('DiscordNotifier validates webhook URL schema', () => {
  const validUrl = 'https://discord.com/api/webhooks/123456789/abcdef-token_123';
  const invalidUrl = 'https://example.com/api/webhooks/fake';

  assert.strictEqual(DiscordNotifier.isValidWebhookUrl(validUrl), true);
  assert.strictEqual(DiscordNotifier.isValidWebhookUrl(invalidUrl), false);
});
