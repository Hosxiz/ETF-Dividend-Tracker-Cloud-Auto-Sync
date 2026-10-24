/**
 * dime-extractor.js
 * Regex parser tailored specifically for Dime brokerage trade slips based on Project Brief Section 5.
 */

export class DimeExtractor {
  /**
   * Extracts trade slip fields from raw OCR text
   * @param {string} rawText 
   * @returns {{ticker: string|null, shares: number|null, priceUSD: number|null, totalTHB: number|null, orderDate: string|null, rawText: string}}
   */
  static extractFields(rawText = '') {
    const text = rawText.replace(/\r\n/g, '\n');

    // 1. Ticker: หลัง 'ซื้อ' หรือ หลัง 'Buy' หรือ ตัวอักษรย่อหุ้นพิมพ์ใหญ่ 2-5 ตัว
    let ticker = null;
    const tickerMatch = text.match(/(?:ซื้อ|Buy)\s+([A-Z0-9\.\-]{2,6})/i);
    if (tickerMatch) {
      ticker = tickerMatch[1].trim().toUpperCase();
    } else {
      // Fallback: มองหา Ticker จาก badge ตลาด เช่น NASDAQ / NYSE
      const marketMatch = text.match(/([A-Z]{2,5})\s*(?:NASDAQ|NYSE|AMEX)/i);
      if (marketMatch) {
        ticker = marketMatch[1].trim().toUpperCase();
      }
    }

    // 2. ราคา (USD): หลัง 'ราคาที่ได้จริง'
    let priceUSD = null;
    const priceMatch = text.match(/ราคาที่ได้จริง\s*[:\s]?\s*([0-9,]+(?:\.[0-9]+)?)/i);
    if (priceMatch) {
      priceUSD = parseFloat(priceMatch[1].replace(/,/g, ''));
    }

    // 3. จำนวนหุ้น: หลัง 'จำนวนหุ้น' (รองรับเศษทศนิยม เช่น 0.1145716)
    let shares = null;
    const sharesMatch = text.match(/จำนวนหุ้น\s*[:\s]?\s*([0-9]+(?:\.[0-9]+)?)/i);
    if (sharesMatch) {
      shares = parseFloat(sharesMatch[1]);
    } else {
      // Fallback: ค้นหาทศนิยมหลายตำแหน่ง เช่น 0.1145716
      const decimalMatch = text.match(/\b([0-9]+\.[0-9]{4,7})\b/);
      if (decimalMatch) {
        shares = parseFloat(decimalMatch[1]);
      }
    }

    // 4. มูลค่ารวม (THB): ตัวเลขก่อนหรือหลัง THB
    let totalTHB = null;
    const thbMatch = text.match(/([0-9,]+(?:\.[0-9]+)?)\s*(?:THB|บาท)/i);
    if (thbMatch) {
      totalTHB = parseFloat(thbMatch[1].replace(/,/g, ''));
    }

    // 5. วันที่: หลัง 'วันที่ส่งคำสั่ง'
    let orderDate = null;
    const dateMatch = text.match(/วันที่ส่งคำสั่ง\s*[:\s]?\s*([0-9]{1,2}\s+[^\s\d\n]+\s+[0-9]{2,4})/i);
    if (dateMatch) {
      orderDate = dateMatch[1].trim();
    }

    return {
      ticker,
      shares,
      priceUSD,
      totalTHB,
      orderDate,
      rawText
    };
  }
}
