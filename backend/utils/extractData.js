const jimp = require('jimp');
const { Jimp } = jimp;
const jsQR = require('jsqr');
// Re-added to satisfy dependency checks on Vercel deployment, 
// though actual weight is now handled on frontend.
const Tesseract = require('tesseract.js'); 

/**
 * Extracts Transaction ID or UPI details from a payment screenshot
 * Optimized for Vercel: OCR now happens on the CLIENT side to avoid timeouts and crashes.
 */
async function extractTransactionDetails(fileSource) {
  try {
    // OCR is now handled on the frontend. Backend only provides QR scanning as a fallback.
    console.log('[DEBUG] Starting Backend QR Scan fallback...');
    
    let transactionId = null;
    let extractedUpi = null;

    // 1. QR Scan Check (Very Fast)
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