const jimp = require('jimp');
const { Jimp } = jimp;
const jsQR = require('jsqr');
const Tesseract = require('tesseract.js');

// Function to clean up the Tesseract object if it gets stuck
async function extractTransactionDetails(fileSource) {
  try {
    const image = await Jimp.read(fileSource);
    const { data, width, height } = image.bitmap;
    
    // 1. Try QR Code extraction FIRST (Reliable even if OCR fails)
    console.log('[DEBUG] Checking for QR Code...');
    const code = jsQR(data, width, height);
    
    let extractedUpi = null;
    if (code && code.data) {
      console.log('[DEBUG] QR Code found:', code.data);
      const url = code.data;
      if (url.startsWith('upi://')) {
        const urlParams = new URLSearchParams(url.split('?')[1]);
        extractedUpi = urlParams.get('pa');
      } else if (url.includes('@')) {
        extractedUpi = url.trim();
      }
    }

    // 2. OCR Extraction with a strict timeout/cleanup logic for Vercel
    console.log('[DEBUG] Starting OCR Extraction...');
    let text = "";
    try {
        // Tesseract.recognize is the standard entry point
        // On Vercel, it sometimes fails to find workers.
        const ocrResult = await Tesseract.recognize(fileSource, 'eng');
        text = ocrResult.data.text;
        console.log('[DEBUG] OCR Text Extracted (First 150):', text.substring(0, 150));
    } catch (ocrErr) {
        console.warn('[OCR WARNING] Tesseract failed:', ocrErr.message);
        // We continue anyway to use the regex on the backup buffer if possible
    }

    let transactionId = null;
    
    // Improved patterns for ID extraction
    const txnPatterns = [
        /\b[T][0-9]{18,25}\b/g,          // PhonePe/GPay specific (T + 22 digits)
        /\b[0-9]{12}\b/g,               // 12 digit UTR/UPI Transaction ID
        /Transaction ID\s+([a-zA-Z0-9]+)/i, 
        /UTR\s*[:]\s*([0-9]{12})/i,
        /Google Pay Transaction ID\s+([a-zA-Z0-9.-]{12,})/i
    ];

    if (text) {
        for (const pattern of txnPatterns) {
            const matches = text.match(pattern);
            if (matches) {
                transactionId = matches[0];
                // Clean up the match if it has labels
                transactionId = transactionId.replace(/Transaction ID|UTR|[:\s]/gi, '').trim();
                console.log('[DEBUG] Potential Txn ID match:', transactionId);
                break;
            }
        }
    }

    return {
      transactionId: transactionId,
      upiId: extractedUpi
    };
  } catch (err) {
    console.error('Final Extraction Error:', err);
    return { transactionId: null, upiId: null };
  }
}

module.exports = { extractTransactionDetails };