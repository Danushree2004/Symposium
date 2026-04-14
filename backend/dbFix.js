const mongoose = require('mongoose');
const Participation = require('./models/Participation');
const Event = require('./models/Event');
require('dotenv').config();

const fixExistingPaths = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/STPD_Symposium');
        console.log('Connected to MongoDB for Database Repair...');

        const records = await Participation.find({});
        console.log(`Analyzing ${records.length} records...`);

        const firstEvent = await Event.findOne({});
        if (!firstEvent) {
          console.error("No events found in DB! Seed events first.");
          process.exit(1);
        }

        for (let record of records) {
            let changed = false;
            
            // 1. Fix broken Event References
            const eventExists = await Event.findById(record.event);
            if (!eventExists) {
                console.log(`Fixing broken event ID for registration ${record._id}. Linking to ${firstEvent.name}`);
                record.event = firstEvent._id; // Fallback to first available event for revenue data
                changed = true;
            }

            // 2. Fix Screenshot paths (remove 'backend\uploads\' or 'uploads\')
            if (record.paymentScreenshot && (record.paymentScreenshot.includes('\\') || record.paymentScreenshot.includes('/'))) {
                const filename = record.paymentScreenshot.split(/[\\/]/).pop();
                console.log(`Fixing path: ${record.paymentScreenshot} -> ${filename}`);
                record.paymentScreenshot = filename;
                changed = true;
            }

            // 2. Fix status enum misalignments
            if (record.paymentStatus === 'failed') {
                record.paymentStatus = 'rejected';
                changed = true;
            }

            if (changed) {
                await record.save();
            }
        }

        console.log('Database repair complete. Newest 5 entries:');
        const latest = await Participation.find().sort({ createdAt: -1 }).limit(5);
        latest.forEach(p => console.log(`- ${p.paymentStatus}: ${p.paymentScreenshot || 'No Image'}`));

        process.exit(0);
    } catch (err) {
        console.error('Repair error:', err);
        process.exit(1);
    }
};

fixExistingPaths();