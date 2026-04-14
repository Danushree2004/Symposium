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
    const registration = await Participation.findByIdAndUpdate(
      req.params.participationId,
      { paymentStatus: status },
      { new: true }
    ).populate('user').populate('event');

    if (registration.user && registration.user.email) {
      const eventName = registration.event?.name || 'the event';
      const emailHtml = `<h2>Payment Update: ${eventName}</h2><p>Status: ${status}</p>`;
      try { await sendEmail(registration.user.email, `Payment Update: ${eventName}`, emailHtml); } catch (err) {}
    }
    res.json({ msg: 'Payment status updated', registration });
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
