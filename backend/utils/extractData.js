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
    const image = await Jimp.read(fileSource);
    const { data, width, height } = image.bitmap;
    
    // 1. Try to find a QR Code (sometimes users screenshot the QR they paid to)
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

    // 2. OCR-like Transaction ID extraction
    // Since we don't have a full OCR engine like Tesseract, we search for common patterns
    // in the image or wait for future implementation. 
    // However, many users use the "Scan & Pay" screenshot which has the Txn ID.
    
    // For now, we mainly support QR-based extraction and basic pattern matching if possible.
    // In a real production app, we would use Tesseract.js here.
    
    return {
      transactionId: null, // Placeholder for OCR
      upiId: extractedUpi
    };
  } catch (err) {
    console.error('Extraction Error:', err);
    return { transactionId: null, upiId: null };
  }
}

module.exports = { extractTransactionDetails };