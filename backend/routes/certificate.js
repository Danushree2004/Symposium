const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const path = require('path');
const Participation = require('../models/Participation');
const User = require('../models/User');
const Event = require('../models/Event');
const PDFDocument = require('pdfkit');

// Custom auth middleware
const certAuth = (req, res, next) => {
    let token = req.header('x-auth-token') || req.query.token;
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

router.get('/download/:participationId', certAuth, async (req, res) => {
    try {
        const participation = await Participation.findById(req.params.participationId)
            .populate('event')
            .populate('user');

        if (!participation) return res.status(404).json({ msg: 'Participation record not found' });
        if (participation.user._id.toString() !== req.user.userId) return res.status(403).json({ msg: 'Unauthorized' });

        const { user, event } = participation;

        const doc = new PDFDocument({
            size: [841.89, 595.28], // A4 Landscape
            margin: 0
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Certificate_${user.name.replace(/\s+/g, '_')}.pdf"`);
        doc.pipe(res);

        const logoBottomPath = path.join(__dirname, '../../frontend/src/assets/WhatsApp_Image_2025-12-17_at_6.27.15_PM-removebg-preview (1).png');
        const logoTopPath = path.join(__dirname, '../../frontend/src/assets/WhatsApp_Image_2025-12-17_at_6.27.16_PM-removebg-preview (1) (1).png');

        const pageWidth = 841.89;
        const pageHeight = 595.28;
        const purple = '#B519D4'; 

        // --- 1. BACKGROUND DESIGN ---
        doc.fillColor(purple).moveTo(0, 0).lineTo(230, 0).lineTo(0, 230).fill(); 
        doc.fillColor(purple).circle(pageWidth - 40, 40, 7).fill(); 
        doc.circle(pageWidth - 75, 40, 7).fill(); 
        doc.fillColor(purple).moveTo(pageWidth, pageHeight).lineTo(pageWidth - 220, pageHeight).lineTo(pageWidth, pageHeight - 220).fill(); 
        doc.fillColor(purple).moveTo(0, pageHeight).lineTo(180, pageHeight).lineTo(0, pageHeight - 180).fill(); 

        // --- 2. LOGO TOP (Moved even higher and kept large) ---
        try {
            // y: 10 pushes it to the very top edge
            doc.image(logoTopPath, (pageWidth / 2) - 130, -80, { width: 340 });
        } catch (e) { console.log("Logo Error"); }

        // --- 3. TITLES (Adjusted Y-coordinates to remove overlap) ---
        // Department Name - Pushed further down to y: 155 and font size slightly optimized
        doc.fontSize(22)
            .font('Times-Italic')
            .fillColor(purple)
            .text('Department of Computer Applications', 30, 170, { align: 'center', width: pageWidth });

        // ORION 2K26 Banner - Pushed to y: 200
        const boxW = 420;
        doc.fillColor('#050510').rect((pageWidth - boxW) / 1.8, 215, boxW, 60).fill();
        doc.fontSize(55)
            .font('Helvetica-Bold')
            .fillColor('#AEEFFF')
            .text('ORION 2K26', 30, 220, { align: 'center', width: pageWidth });

        // Certificate Ribbon - Pushed to y: 300
        doc.fillColor('#FFF4BD').rect((pageWidth - 420) / 2, 300, 420, 45).fill();
        doc.fontSize(28)
            .font('Times-Italic')
            .fillColor('#333')
            .text('Certificate Of Participation', 10, 308, { align: 'center', width: pageWidth });

        // --- 4. MAIN CONTENT (Justified) ---
        const contentY = 385;
        const lineMargin = 110;
        const textWidth = pageWidth - (lineMargin * 2);

        doc.fillColor('#000')
            .fontSize(20)
            .font('Courier') 
            .text('This is to certify that Mr./ Ms. ', lineMargin, contentY, { 
                align: 'justify', 
                width: textWidth, 
                continued: true,
                lineGap: 10 
            })
            .font('Helvetica-Bold').text(`${user.name.toUpperCase()} `, { continued: true })
            .font('Courier').text('of ', { continued: true })
            .font('Helvetica-Bold').text(`${user.college.toUpperCase()} `, { continued: true })
            .font('Courier').text('has participated in ', { continued: true })
            .font('Helvetica-Bold').text(`${event.name.toUpperCase()} `, { continued: true })
            .font('Courier').text('at the National Level Technical Symposium ', { continued: true })
            .fillColor(purple).font('Helvetica-Bold').text('"ORION 2K26" ', { continued: true })
            .fillColor('#000').font('Courier').text('held on 5th March 2026, at ', { continued: true })
            .fillColor(purple).font('Helvetica-Bold').text('KONGU ENGINEERING COLLEGE.', { continued: false });

        // --- 5. SIGNATURES & BOTTOM LOGO ---
        const sigY = pageHeight - 55;

        try {
            doc.image(logoBottomPath, (pageWidth / 2) - 50, sigY - 45, { width: 100 });
        } catch(e) {}

        doc.fontSize(12).font('Helvetica-Bold').fillColor('#000');
        
        doc.text('-----------------------------------', 180, sigY);
        doc.text('FACULTY COORDINATOR', 150, sigY + 15, { width: 200, align: 'center' });

        doc.text('----------------------------', pageWidth - 310, sigY);
        doc.text('HOD', pageWidth - 350, sigY + 15, { width: 200, align: 'center' });

        doc.end();
    } catch (err) {
        res.status(500).json({ error: 'Generation failed: ' + err.message });
    }
});

module.exports = router;