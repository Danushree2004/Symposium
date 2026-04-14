const mongoose = require('mongoose');
const Participation = require('./models/Participation');

const fixRollNumbers = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/orion'); // Adjust if your DB name is different
        console.log('Connected to DB');

        const participations = await Participation.find({ 
            $or: [
                { rollNumber: { $exists: false } },
                { rollNumber: null },
                { rollNumber: "" }
            ]
        });

        console.log(`Found ${participations.length} registrations without Roll Numbers.`);

        for (let i = 0; i < participations.length; i++) {
            const lastPart = await Participation.findOne({ rollNumber: /^ORION27/ })
                .sort({ rollNumber: -1 });

            let nextNum = 1;
            if (lastPart && lastPart.rollNumber) {
                const match = lastPart.rollNumber.match(/ORION27(\d+)/);
                if (match) {
                    nextNum = parseInt(match[1]) + 1;
                }
            }

            const rollNumber = `ORION27${nextNum.toString().padStart(3, '0')}`;
            participations[i].rollNumber = rollNumber;
            await participations[i].save();
            console.log(`Assigned ${rollNumber} to ${participations[i]._id}`);
        }

        console.log('Done fixing Roll Numbers.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

fixRollNumbers();
