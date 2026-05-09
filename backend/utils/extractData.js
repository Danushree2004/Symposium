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
    
    // Configure worker options for serverless/Vercel environments using recognize() directly
    // node-tesseract fails with remote worker paths due to cross-origin worker restrictions in Node environment
    const ocrResult = await Tesseract.recognize(fileSource, 'eng');
    const text = ocrResult.data.text;

    console.log('[DEBUG] OCR Text Extracted:', text.substring(0, 100) + '...');

    let transactionId = null;
    
    // Pattern for common Transaction IDs (UPI/Bank)
    // - UPI/Google Pay/PhonePe often use 12-digit numbers
    // - Bank IDs often start with T or have alphanumeric 12-22 chars
    const txnPatterns = [
        /\b[0-9]{12}\b/g,               // 12 digit numeric (Standard UPI)
        /\b[T][0-9]{12,25}\b/g,          // T followed by numbers (PhonePe/GPay style)
        /\b[a-zA-Z0-9]{12,24}\b/g        // General alphanumeric
    ];

    for (const pattern of txnPatterns) {
        const matches = text.match(pattern);
        if (matches && matches.length > 0) {
            // Find the most likely one (usually the one not in a date/time)
            transactionId = matches[0];
            console.log('[DEBUG] Potential Txn ID match:', transactionId);
            break;
        }
    }

    // 2. Try QR Code extraction as a backup
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