/**
 * ocr-engine.js
 * Manages Tesseract.js worker lifecycle, progress callbacks, and image-to-text processing.
 */

export class OcrEngine {
  /**
   * Recognizes text from image blob or URL
   * @param {File|Blob|string} imageSource 
   * @param {function} [onProgress] Progress status listener (pct, status)
   * @returns {Promise<string>} Extracted raw text
   */
  static async recognizeSlip(imageSource, onProgress = () => {}) {
    if (typeof window.Tesseract === 'undefined') {
      throw new Error('Tesseract.js library not loaded. Please check network connection.');
    }

    try {
      onProgress({ status: 'กำลังเตรียมโมเดล OCR (Thai + English)...', progress: 0.1 });

      const worker = await window.Tesseract.createWorker('eng+tha', 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            const p = 0.2 + (m.progress || 0) * 0.75;
            onProgress({ status: `กำลังอ่านข้อความในสลีป (${Math.round((m.progress || 0) * 100)}%)...`, progress: p });
          } else {
            onProgress({ status: m.status, progress: 0.2 });
          }
        }
      });

      const ret = await worker.recognize(imageSource);
      await worker.terminate();

      onProgress({ status: 'ประมวลผลข้อความเสร็จสิ้น', progress: 1.0 });
      return ret.data.text || '';
    } catch (err) {
      console.warn('Multilingual OCR worker failed, falling back to eng worker:', err);
      // Fallback to eng-only if tha language pack download fails
      const fallbackWorker = await window.Tesseract.createWorker('eng', 1);
      const fallbackRet = await fallbackWorker.recognize(imageSource);
      await fallbackWorker.terminate();
      return fallbackRet.data.text || '';
    }
  }
}
