const jimp = require('jimp');
const { Jimp } = jimp;
const jsQR = require('jsqr');

/**
 * Extracts Transaction ID or UPI details from a payment screenshot
 * @param {Buffer|string} fileSource - Buffer of the image or path to the image
 * @returns {Promise<{transactionId: string|null, upiId: string|null}>}
 */
async function extractTransactionDetails(fileSource) {
  try {
    // 1. Try QR Code extraction first (Highly reliable for Transaction IDs embedded in QRs)
    console.log('[DEBUG] Reading image for QR/Data extraction...');
    const image = await Jimp.read(fileSource);
    const { data, width, height } = image.bitmap;
    const code = jsQR(data, width, height);
    
    let transactionId = null;
    let extractedUpi = null;

    if (code && code.data) {
      const url = code.data;
      console.log('[DEBUG] QR Code detected:', url);

      // Handle UPI URLs: upi://pay?pa=...&tr=TRANSACTION_ID...
      if (url.startsWith('upi://')) {
        try {
            const urlParsed = new URL(url);
            const params = new URLSearchParams(urlParsed.search);
            
            // Extract UPI ID (pa)
            extractedUpi = params.get('pa');
            
            // Extract Transaction Reference ID (tr) - Extremely common in dynamic QRs
            transactionId = params.get('tr') || params.get('tid');
            
            console.log('[DEBUG] Extracted from QR UPI URL:', { extractedUpi, transactionId });
        } catch (e) {
            // Fallback for malformed URLs
            if (url.includes('tr=')) {
                transactionId = url.split('tr=')[1]?.split('&')[0];
            }
        }
      } else if (url.includes('@')) {
        extractedUpi = url.trim();
      } else if (/^[a-zA-Z0-9-]{12,32}$/.test(url)) {
        // If the QR just contains a string that looks like a Txn ID
        transactionId = url;
      }
    }

    // 2. Note: OCR (Tesseract) is disabled for Vercel stability 
    // due to WASM ENOENT errors in serverless function environments.
    // We rely on the QR data which is the primary source for modern payment apps.
    
    return {
      transactionId: transactionId,
      upiId: extractedUpi
    };
    
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