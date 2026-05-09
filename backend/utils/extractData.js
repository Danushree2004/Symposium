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
        // Use recognize with local core load disabled to force Tesseract to handle its own fetching
        // But since Tesseract is notoriously difficult on Vercel Node runtimes, 
        // we wrap it in a strict try-catch to allow QR backup to work if OCR fails.
        const ocrResult = await Tesseract.recognize(fileSource, 'eng');
        text = ocrResult.data.text;
        console.log('[DEBUG] OCR Text Extracted (First 100):', text.substring(0, 100));
    } catch (ocrErr) {
        console.error('[OCR ERROR] Tesseract failed, falling back to QR scan:', ocrErr.message);
        // If Tesseract crashes (like the ENOENT error), we continue to QR extraction
    }

    let transactionId = null;
    
    if (text) {
        // Pattern for common Transaction IDs (UPI/Bank)
        const txnPatterns = [
            /\b[0-9]{12}\b/g,               // 12 digit numeric (Standard UPI)
            /\b[T][0-9]{12,25}\b/g,          // T followed by numbers (PhonePe/GPay style)
            /\b[a-zA-Z0-9]{12,24}\b/g        // General alphanumeric
        ];

        for (const pattern of txnPatterns) {
            const matches = text.match(pattern);
            if (matches && matches.length > 0) {
                // Find the most likely one
                transactionId = matches[0];
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