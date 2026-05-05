const express = require('express');
const router = express.Router();
const Participation = require('../models/Participation');
const Event = require('../models/Event');
const User = require('../models/User');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/admin');
const eventAdminOnly = require('../middleware/eventAdmin');
const sendEmail = require('../utils/sendEmail');
const ExcelJS = require('exceljs');
const Settings = require('../models/Settings');
const multer = require('multer');
const path = require('path');
const jimp = require('jimp');
const { Jimp } = jimp;
const jsQR = require('jsqr');
const fs = require('fs');

// Configure multer for QR upload
const qrStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, 'ADMIN_QR_' + Date.now() + path.extname(file.originalname));
  }
});
const qrUpload = multer({ storage: qrStorage });

// Helper function to extract UPI ID from QR image
async function extractUpiFromQR(filePath) {
  try {
    const image = await Jimp.read(filePath);
    const { data, width, height } = image.bitmap;
    const code = jsQR(data, width, height);
    if (code && code.data) {
      console.log('[DEBUG] QR Code detected:', code.data);
      // UPI URLs look like: upi://pay?pa=id@bank&pn=Name...
      const url = code.data;
      if (url.startsWith('upi://')) {
        const urlParams = new URLSearchParams(url.split('?')[1]);
        return urlParams.get('pa'); // Get the 'pa' (Payment Address) parameter
      }
      // If it's just a raw UPI ID (some QRs are simple strings)
      if (url.includes('@')) {
        return url.trim();
      }
      return null;
    }
    console.log('[DEBUG] No QR code found in image');
    return null;
  } catch (err) {
    console.error('QR Extraction Error:', err);
    return null;
  }
}

// Get Symposium Settings
router.get('/settings', async (req, res) => {
  try {
    let settings = await Settings.findOne({ key: 'symposium_config' });
    if (!settings) {
      settings = new Settings({ key: 'symposium_config', value: { upiId: '919994645063@ybl', baseAmount: 200 } });
      await settings.save();
    }
    res.json(settings.value);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Symposium Settings (including QR)
router.post('/settings', auth, adminOnly, qrUpload.single('qrCode'), async (req, res) => {
  try {
    console.log('[DEBUG] Setting Update Body:', req.body);
    console.log('[DEBUG] Setting Update File:', req.file);
    let { upiId, baseAmount } = req.body;
    let settings = await Settings.findOne({ key: 'symposium_config' });
    
    if (!settings) {
      settings = new Settings({ key: 'symposium_config', value: { upiId: '919994645063@ybl', baseAmount: 200 } });
    }

    // If a file was uploaded, try to extract the UPI ID
    if (req.file) {
      settings.value.qrCode = req.file.filename;
      const extractedUpi = await extractUpiFromQR(path.join(__dirname, '../uploads/', req.file.filename));
      if (extractedUpi) {
        console.log('[DEBUG] Auto-extracted UPI ID:', extractedUpi);
        upiId = extractedUpi; // Override the provided UPI ID with the extracted one
      }
    }

    if (upiId) settings.value.upiId = upiId;
    if (baseAmount) settings.value.baseAmount = Number(baseAmount);

    settings.markModified('value'); // Crucial for Mixed types/Subdocuments
    settings.updatedAt = Date.now();
    await settings.save();
    console.log('[DEBUG] Settings saved:', settings.value);
    res.json({ msg: 'Settings updated successfully', settings: settings.value });
  } catch (err) {
    console.error('[DEBUG] Settings Save Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Remove QR Code image from settings
router.delete('/settings/qr', auth, adminOnly, async (req, res) => {
  try {
    let settings = await Settings.findOne({ key: 'symposium_config' });
    if (!settings) return res.status(404).json({ msg: 'Settings not found' });

    // Optionally delete file from disk if you want to be thorough
    if (settings.value.qrCode) {
      const filePath = path.join(__dirname, '../uploads/', settings.value.qrCode);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    settings.value.qrCode = ""; // Clear the reference
    settings.markModified('value');
    await settings.save();
    
    res.json({ msg: 'QR Code removed successfully', settings: settings.value });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all participations for admin or assigned event admins
router.get('/registrations', auth, eventAdminOnly, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'event-admin') {
      const user = await User.findById(req.user.userId);
      if (user && user.managedEvent) {
        query = { event: user.managedEvent };
      } else {
        return res.status(403).json({ msg: 'No event assigned to this admin.' });
      }
    }
    const list = await Participation.find(query)
      .populate('user')
      .populate('event')
      .sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export Attendance Sheet
router.get('/export-attendance', auth, eventAdminOnly, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'event-admin') {
      const user = await User.findById(req.user.userId);
      if (user && user.managedEvent) {
        query = { event: user.managedEvent };
      } else {
        return res.status(403).json({ msg: 'No event assigned to this admin.' });
      }
    }
    const participations = await Participation.find(query)
      .populate('user')
      .populate('event')
      .sort({ 'event.name': 1, 'user.name': 1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Attendance Sheet', {
      pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
    });

    // Add Main Headers
    worksheet.mergeCells('A1:H1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'KONGU ENGINEERING COLLEGE';
    titleCell.font = { name: 'Times New Roman', size: 16, bold: true };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    worksheet.mergeCells('A2:H2');
    const deptCell = worksheet.getCell('A2');
    deptCell.value = 'DEPARTMENT OF COMPUTER APPLICATION';
    deptCell.font = { name: 'Times New Roman', size: 14, bold: true };
    deptCell.alignment = { vertical: 'middle', horizontal: 'center' };

    worksheet.mergeCells('A3:H3');
    const eventNameCell = worksheet.getCell('A3');
    eventNameCell.value = 'ORION 2K27';
    eventNameCell.font = { name: 'Times New Roman', size: 14, bold: true };
    eventNameCell.alignment = { vertical: 'middle', horizontal: 'center' };

    worksheet.mergeCells('A4:H4');
    const subTitleCell = worksheet.getCell('A4');
    subTitleCell.value = 'ATTENDANCE SHEET';
    subTitleCell.font = { name: 'Times New Roman', size: 12, bold: true, underline: true };
    subTitleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    worksheet.addRow([]); // Blank row

    const headerRow = worksheet.addRow(['Event', 'Participant Name', 'Email', 'College', 'Roll Number', 'Team Name', 'Payment Status', 'Signature']);
    headerRow.font = { name: 'Times New Roman', bold: true };
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    worksheet.columns = [
      { key: 'event', width: 20 },
      { key: 'name', width: 20 },
      { key: 'email', width: 25 },
      { key: 'college', width: 20 },
      { key: 'roll', width: 12 },
      { key: 'team', width: 15 },
      { key: 'payment', width: 12 },
      { key: 'signature', width: 15 }
    ];

    participations.forEach(p => {
      const row = worksheet.addRow({
        event: p.event?.name || 'N/A',
        name: p.user?.name || 'N/A',
        email: p.user?.email || 'N/A',
        college: p.user?.college || 'N/A',
        roll: p.rollNumber || p.user?.rollNumber || 'N/A',
        team: p.teamName || 'Individual',
        payment: p.paymentStatus,
        signature: ''
      });
      row.eachCell((cell) => {
        cell.font = { name: 'Times New Roman' };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });
    });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=attendance_sheet.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export Winners List
router.get('/export-winners', auth, eventAdminOnly, async (req, res) => {
  try {
    let query = { resultStatus: { $in: ['1st prize', '2nd prize', '3rd prize'] } };
    if (req.user.role === 'event-admin') {
      const user = await User.findById(req.user.userId);
      if (user && user.managedEvent) {
        query.event = user.managedEvent;
      } else {
        return res.status(403).json({ msg: 'No event assigned to this admin.' });
      }
    }
    const winners = await Participation.find(query)
      .populate('user')
      .populate('event')
      .sort({ 'event.name': 1, 'resultStatus': 1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Winners List', {
      pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
    });

    // Add Main Headers
    worksheet.mergeCells('A1:G1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'KONGU ENGINEERING COLLEGE';
    titleCell.font = { name: 'Times New Roman', size: 16, bold: true };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    worksheet.mergeCells('A2:G2');
    const deptCell = worksheet.getCell('A2');
    deptCell.value = 'DEPARTMENT OF COMPUTER APPLICATION';
    deptCell.font = { name: 'Times New Roman', size: 14, bold: true };
    deptCell.alignment = { vertical: 'middle', horizontal: 'center' };

    worksheet.mergeCells('A3:G3');
    const eventNameCell = worksheet.getCell('A3');
    eventNameCell.value = 'ORION 2K27';
    eventNameCell.font = { name: 'Times New Roman', size: 14, bold: true };
    eventNameCell.alignment = { vertical: 'middle', horizontal: 'center' };

    worksheet.mergeCells('A4:G4');
    const subTitleCell = worksheet.getCell('A4');
    subTitleCell.value = 'WINNERS LIST';
    subTitleCell.font = { name: 'Times New Roman', size: 12, bold: true, underline: true };
    subTitleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    worksheet.addRow([]); // Blank row

    const headerRow = worksheet.addRow(['Event', 'Rank', 'Winner Name', 'Email', 'College', 'Roll Number', 'Team Name']);
    headerRow.font = { name: 'Times New Roman', bold: true };
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    worksheet.columns = [
      { key: 'event', width: 20 },
      { key: 'rank', width: 12 },
      { key: 'name', width: 20 },
      { key: 'email', width: 25 },
      { key: 'college', width: 20 },
      { key: 'roll', width: 12 },
      { key: 'team', width: 15 }
    ];

    winners.forEach(w => {
      const row = worksheet.addRow({
        event: w.event?.name || 'N/A',
        rank: w.resultStatus,
        name: w.user?.name || 'N/A',
        email: w.user?.email || 'N/A',
        college: w.user?.college || 'N/A',
        roll: w.rollNumber || w.user?.rollNumber || 'N/A',
        team: w.teamName || 'Individual'
      });
      row.eachCell((cell) => {
        cell.font = { name: 'Times New Roman' };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });
    });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=winners_list.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update shortlisting or results status
router.patch('/update-result/:participationId', auth, eventAdminOnly, async (req, res) => {
  try {
    const { shortlisted, resultStatus } = req.body;
    if (req.user.role === 'event-admin') {
      const user = await User.findById(req.user.userId);
      const participation = await Participation.findById(req.params.participationId);
      if (participation.event.toString() !== user.managedEvent.toString()) {
        return res.status(403).json({ msg: 'Unauthorized to manage this event.' });
      }
    }
    const updated = await Participation.findByIdAndUpdate(
      req.params.participationId,
      { shortlisted, resultStatus },
      { new: true }
    ).populate('user').populate('event');

    if (updated.user && updated.user.email) {
      const eventName = updated.event?.name || 'the event';
      const emailHtml = `<h2>Update for ${eventName}</h2><p>Result: ${resultStatus}</p>`;
      try { await sendEmail(updated.user.email, `Update for ${eventName}`, emailHtml); } catch (err) {}
    }
    res.json({ msg: 'Result status updated', updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify payment status
router.patch('/verify-payment/:participationId', auth, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    
    // 1. Update the participation record
    const registration = await Participation.findByIdAndUpdate(
      req.params.participationId,
      { paymentStatus: status },
      { new: true }
    ).populate('user').populate('event');

    if (registration.user) {
      // 2. Sync status to the User model
      await User.findByIdAndUpdate(registration.user._id, {
        symposiumPaymentStatus: status,
        symposiumPaid: status === 'verified'
      });

      // 3. Sync status to ALL other participations for this user
      await Participation.updateMany(
        { user: registration.user._id },
        { paymentStatus: status }
      );

      // 4. Send email notification
      if (registration.user.email) {
        const eventName = registration.event?.name || 'the event';
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #2c3e50; text-align: center;">Payment ${status === 'verified' ? 'Verified' : 'Status Update'}</h2>
            <p>Dear ${registration.user.name},</p>
            <p>Your payment for <strong>STPD ORION'27</strong> has been <strong>${status}</strong>.</p>
            ${status === 'verified' ? '<p>This payment covers your registration for all events in the symposium. You do not need to pay again for subsequent event registrations.</p>' : ''}
            <p>Best regards,<br><strong>Team STPD ORION'27</strong></p>
          </div>
        `;
        try { 
          await sendEmail(registration.user.email, `Payment Status: ${status}`, emailHtml); 
        } catch (err) {
          console.error('Email notification failed:', err.message);
        }
      }
    }
    
    res.json({ msg: 'Payment status updated across all records', registration });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// EVENT MANAGEMENT
router.post('/events', auth, adminOnly, async (req, res) => {
  try {
    const newEvent = new Event(req.body);
    const saved = await newEvent.save();
    res.json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/events/:id', auth, adminOnly, async (req, res) => {
  try {
    const updated = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/events/:id', auth, adminOnly, async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    await Participation.deleteMany({ event: req.params.id });
    res.json({ msg: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
