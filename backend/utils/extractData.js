const jimp = require('jimp');
const { Jimp } = jimp;
const jsQR = require('jsqr');
const Tesseract = require('tesseract.js');

/**
 * Extracts Transaction ID or UPI details from a payment screenshot
 */
async function extractTransactionDetails(fileSource) {
  try {
    // 1. OCR Extraction using a faster, pre-configured approach
    console.log('[DEBUG] Starting OCR Extraction...');
    let text = "";
    
    // Use worker to have more control and potentially better speed on Vercel
    const worker = await Tesseract.createWorker('eng');
    const { data } = await worker.recognize(fileSource);
    text = data.text;
    await worker.terminate();
    
    console.log('[DEBUG] OCR Text Extracted (First 200):', text.substring(0, 200).replace(/\n/g, ' '));

    let transactionId = null;
    
    // Pattern for common Transaction IDs (PhonePe, GPay, Paytm)
    // T followed by 15-25 digits is common for PhonePe/GPay (T2605...)
    // 12 digit numeric (UTR) is common for all UPI
    const txnPatterns = [
        /\bT[0-9]{15,25}\b/g,           // PhonePe/GPay specific (T + 22 digits)
        /\b[0-9]{12}\b/g,                // 12 digit UTR/UPI ID
        /Transaction ID\s*[:\s]*([a-zA-Z0-9]+)/i, 
        /UTR\s*[:\s]*([0-9]{12})/i,
        /Ref No\.?\s*[:\s]*([0-9]{12})/i
    ];

    if (text) {
        for (const pattern of txnPatterns) {
            const matches = text.match(pattern);
            if (matches) {
                // If it's a match with a group (captured ID)
                const candidate = matches[1] || matches[0];
                transactionId = candidate.replace(/Transaction ID|UTR|Ref No|[:\s]/gi, '').trim();
                console.log('[DEBUG] Found Txn ID match:', transactionId);
                break;
            }
        }
    }

    // 2. Try QR Code extraction as a backup/UPI fetch
    console.log('[DEBUG] Checking for QR Code...');
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
    return { transactionId: null, upiId: null };
  }
}

module.exports = { extractTransactionDetails };

module.exports = { extractTransactionDetails };