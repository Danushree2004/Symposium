const jimp = require('jimp');
const { Jimp } = jimp;
const jsQR = require('jsqr');
const Tesseract = require('tesseract.js');

/**
 * Extracts Transaction ID or UPI details from a payment screenshot
 * Optimized for Vercel to avoid 504 Gateway Timeouts
 */
async function extractTransactionDetails(fileSource) {
  try {
    // 1. OCR Extraction - Use a higher-level API for speed
    console.log('[DEBUG] Starting OCR Extraction...');
    
    // Explicitly configure for Vercel/Node environment
    const { createWorker } = Tesseract;
    const worker = await createWorker('eng', 1, {
      logger: m => console.log(m.status),
      errorHandler: e => console.error(e),
      // Prevent Tesseract from trying to cache data in read-only Vercel folders
      cacheMethod: 'none', 
    });

    const ocrResult = await worker.recognize(fileSource);
    await worker.terminate();
    
    const text = ocrResult.data.text;
    console.log('[DEBUG] OCR Text Extracted (First 150):', text.substring(0, 150).replace(/\n/g, ' '));

    let transactionId = null;
    
    // Broadened patterns to catch symbols quickly
    const txnPatterns = [
        /\bT[0-9]{15,25}\b/g,          
        /\b[0-9]{12}\b/g,               
        /Transaction ID\s*[:\s]*([a-zA-Z0-9]+)/i, 
        /UTR\s*[:\s]*([0-9]{12})/i,
        /Google Pay Transaction ID\s+([a-zA-Z0-9.-]{6,32})/i
    ];

    if (text) {
        for (const pattern of txnPatterns) {
            const matches = text.match(pattern);
            if (matches) {
                const candidate = Array.isArray(matches) ? (matches[1] || matches[0]) : matches;
                transactionId = candidate.toString().replace(/Transaction ID|UTR|[:\s]/gi, '').trim();
                console.log('[DEBUG] Found Txn ID match:', transactionId);
                break;
            }
        }
    }

    // 2. Parallel QR Scan Check (Very Fast)
    const image = await Jimp.read(fileSource);
    const { data: bitmapData, width, height } = image.bitmap;
    const code = jsQR(bitmapData, width, height);
    
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
    // Return empty results rather than crashing to avoid 504/500
    return { transactionId: null, upiId: null };
  }
}

module.exports = { extractTransactionDetails };

module.exports = { extractTransactionDetails };