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
    // 1. Load image using Jimp
    console.log('[DEBUG] Reading image for QR extraction...');
    const image = await Jimp.read(fileSource);
    const { data, width, height } = image.bitmap;
    
    // 2. Try QR Code extraction (Always reliable in Node)
    const code = jsQR(data, width, height);
    
    let extractedUpi = null;
    let transactionId = null;

    if (code && code.data) {
      console.log('[DEBUG] QR Code found:', code.data);
      const url = code.data;
      if (url.startsWith('upi://')) {
        const urlParams = new URLSearchParams(url.split('?')[1]);
        extractedUpi = urlParams.get('pa');
        // Often transaction IDs are embedded in the UPI URL if it's a dynamic QR
        transactionId = urlParams.get('tr') || urlParams.get('tid');
      } else if (url.includes('@')) {
        extractedUpi = url.trim();
      }
    }

    // 3. Fallback: Check Admin Settings for default UPI if none found in QR
    // This part is handled by the frontend, but we ensure we don't crash here.
    
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