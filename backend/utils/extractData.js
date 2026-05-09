const jimp = require('jimp');
const { Jimp } = jimp;
const jsQR = require('jsqr');
const Tesseract = require('tesseract.js');

/**
 * Extracts Transaction ID or UPI details from a payment screenshot
 * @param {Buffer|string} fileSource - Buffer of the image or path to the image
 * @returns {Promise<{transactionId: string|null, upiId: string|null}>}
 */
async function extractTransactionDetails(fileSource) {
  try {
    // 1. Try OCR first to find Transaction ID patterns
    console.log('[DEBUG] Starting OCR Extraction...');
    
    let text = "";
    try {
        // Force Tesseract to use a remote WASM core to bypass Vercel's missing local binaries
        const worker = await Tesseract.createWorker('eng', 1, {
            workerPath: 'https://unpkg.com/tesseract.js@5.1.1/dist/worker.min.js',
            corePath: 'https://unpkg.com/tesseract.js-core@5.1.0/tesseract-core-simd.wasm.js',
            cachePath: '/tmp'
        });
        const { data } = await worker.recognize(fileSource);
        text = data.text;
        await worker.terminate();
        console.log('[DEBUG] OCR Text Extracted (First 150):', text.substring(0, 150));
    } catch (ocrErr) {
        console.error('[OCR ERROR] Tesseract failed, falling back to manual regex on buffer:', ocrErr.message);
        // If Tesseract crashes, we can't do much for OCR, but we ensure we don't crash
    }

    let transactionId = null;
    
    // Pattern for common Transaction IDs (PhonePe, GPay, Paytm)
    // T followed by 20+ digits is common for PhonePe/GPay
    // 12 digit numeric (UTR) is common for all UPI
    const txnPatterns = [
        /\b[T][0-9]{15,25}\b/g,          // PhonePe/GPay specific (T + 22 digits)
        /\b[0-9]{12}\b/g,               // 12 digit UTR/UPI ID
        /\bUTR[:\s]+([0-9]{12})\b/i,    // UTR: 1234...
        /\bTransaction ID[:\s]+([a-zA-Z0-9]+)\b/i // Generic Transaction ID label
    ];

    if (text) {
        for (const pattern of txnPatterns) {
            const matches = text.match(pattern);
            if (matches && matches.length > 0) {
                // If it's a captured group (like UTR: 123...), take index 1
                transactionId = Array.isArray(matches[0]) ? matches[0] : matches[0].replace(/Transaction ID|UTR|[:\s]/gi, '');
                console.log('[DEBUG] Potential Txn ID match:', transactionId);
                break;
            }
        }
    }

    // 2. Try QR Code extraction as a backup
    console.log('[DEBUG] Checking for QR Code...');
    const image = await Jimp.read(fileSource);
    const { data, width, height } = image.bitmap;
    const code = jsQR(data, width, height);
    
    let extractedUpi = null;
    if (code && code.data) {
      const url = code.data;
      if (url.startsWith('upi://')) {
        const urlParams = new URLSearchParams(url.split('?')[1]);
        extractedUpi = urlParams.get('pa');
      } else if (url.includes('@')) {
        extractedUpi = url.trim();
      }
    }
    
    return {
      transactionId: transactionId,
      upiId: extractedUpi
    };
  } catch (err) {
    console.error('Extraction Error:', err);
    return { transactionId: null, upiId: null };
  }
}

module.exports = { extractTransactionDetails };