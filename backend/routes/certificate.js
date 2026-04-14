const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const path = require('path');
const Participation = require('../models/Participation');
const User = require('../models/User');
const Event = require('../models/Event');
const PDFDocument = require('pdfkit');

// Custom auth middleware that accepts token from header or query param
const certAuth = (req, res, next) => {
  let token = req.header('x-auth-token');
  
  // If no header token, check query parameter
  if (!token) {
    token = req.query.token;
  }

  console.log('[CERT-AUTH] Token received:', token ? 'YES' : 'NO');

  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    console.log('[CERT-AUTH] Decoded Token:', decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('[CERT-AUTH] Token verification failed:', err.message);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

// Generate and download certificate
router.get('/download/:participationId', certAuth, async (req, res) => {
  try {
    const participation = await Participation.findById(req.params.participationId)
      .populate('event')
      .populate('user');

    if (!participation) {
      return res.status(404).json({ msg: 'Participation record not found' });
    }

    // Verify user owns this participation record
    if (participation.user._id.toString() !== req.user.userId) {
      return res.status(403).json({ msg: 'Unauthorized to access this certificate' });
    }

    // Only allow "Not Shortlisted" participants to download
    if (participation.resultStatus !== 'not shortlisted') {
      return res.status(400).json({ msg: 'Certificates are only available for non-shortlisted participants. Awarded participants will receive hard copies.' });
    }

    const user = participation.user;
    const event = participation.event;

    // Create PDF document
    // Explicitly using [841.89, 595.28] which is A4 Landscape in points
    const doc = new PDFDocument({
      size: [841.89, 595.28],
      margin: 0
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Certificate_${user.name.replace(/\s+/g, '_')}_${event.name.replace(/\s+/g, '_')}.pdf"`);

    // Pipe to response
    doc.pipe(res);

    // Paths to logos
    const logoTopPath = path.join(__dirname, '../../frontend/src/assets/WhatsApp_Image_2025-12-17_at_6.27.15_PM-removebg-preview (1).png');
    const logoBottomPath = path.join(__dirname, '../../frontend/src/assets/WhatsApp_Image_2025-12-17_at_6.27.16_PM-removebg-preview (1) (1).png');

    // Page dimensions (Landscape)
    const pageWidth = 841.89;
    const pageHeight = 595.28;

    const purple = '#A100FF';
    
    // 1. TOP RIGHT TRIANGLE (LANDSCAPE POSITION)
    doc.fillColor(purple)
       .moveTo(pageWidth, 0)
       .lineTo(pageWidth - 250, 0)
       .lineTo(pageWidth, 250)
       .fill();
    
    // 2. BOTTOM LEFT TRIANGLE (LANDSCAPE POSITION)
    doc.fillColor(purple)
       .moveTo(0, pageHeight)
       .lineTo(250, pageHeight)
       .lineTo(0, pageHeight - 250)
       .fill();

    // 3. LOGOS
    try {
      // Top Center KEC Logo (Centered on horizontal width)
      doc.image(logoTopPath, (pageWidth / 2) - 110, 25, { width: 220 });
      // Bottom Center Kongu Logo
      doc.image(logoBottomPath, (pageWidth / 2) - 60, pageHeight - 100, { width: 120 });
    } catch (err) {
      console.error('Logo missing:', err.message);
    }

    // 4. TITLES
    doc.fontSize(22)
      .font('Helvetica-Bold')
      .fill(purple)
      .text('Department of Computer Applications', 0, 175, { align: 'center', width: pageWidth });

    // ORION 2K26 GLOW BLOCK
    doc.rect((pageWidth / 2) - 250, 215, 500, 70).fill('#000');
    doc.fontSize(50)
      .font('Helvetica-Bold')
      .fill('#00FFFF')
      .text('ORION 2K26', 0, 230, { align: 'center', width: pageWidth });

    // Certificate Title
    doc.fontSize(42)
      .font('Helvetica-Bold')
      .fill('#000')
      .text('Certificate Of Participation', 0, 315, { align: 'center', width: pageWidth });

    // 5. MAIN CONTENT (Landscape alignment)
    const textX = 80;
    
    doc.fontSize(20)
      .font('Helvetica')
      .fill('#000')
      .text('This is to certify that Mr./ Ms. ', textX, 400, { continued: true })
      .font('Helvetica-Bold').text('   ' + user.name.toUpperCase(), { continued: false });
    
    // Line for Name
    doc.moveTo(330, 420).lineTo(pageWidth - 80, 420).stroke('#000');

    doc.fontSize(20).font('Helvetica').text('of ', textX, 445, { continued: true })
      .font('Helvetica-Bold').text('   ' + user.college, { continued: true })
      .font('Helvetica').text(' has participated in', { continued: false });

    // Line for College
    doc.moveTo(110, 465).lineTo(pageWidth - 280, 465).stroke('#000');

    doc.fontSize(20)
      .font('Helvetica')
      .text('the National Level Technical Symposium ', textX, 490, { continued: true })
      .fill(purple).font('Helvetica-Bold').text('“ORION 2K26”', { continued: true })
      .fill('#000').font('Helvetica').text(' held on ', { continued: true })
      .font('Helvetica-Bold').text('5th March 2026', { continued: true })
      .font('Helvetica').text(', at ', { continued: true })
      .fill(purple).font('Helvetica-Bold').text('KONGU ENGINEERING COLLEGE.', { continued: false });

    // 6. SIGNATURES (Spread horizontally)
    const sigY = 545;
    doc.fontSize(14)
      .font('Helvetica-Bold')
      .fill('#000');

    // Left Signature
    doc.moveTo(150, sigY).lineTo(350, sigY).stroke('#000');
    doc.text('FACULTY COORDINATOR', 150, sigY + 10, { width: 200, align: 'center' });

    // Right Signature
    doc.moveTo(pageWidth - 350, sigY).lineTo(pageWidth - 150, sigY).stroke('#000');
    doc.text('HOD', pageWidth - 350, sigY + 10, { width: 200, align: 'center' });

    doc.end();
  } catch (err) {
    console.error('[CERTIFICATE] Error:', err.message);
    res.status(500).json({ error: 'Certificate generation failed: ' + err.message });
  }
});

module.exports = router;
