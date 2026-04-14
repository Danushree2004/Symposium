const mongoose = require('mongoose');
const User = require('./models/User');

const emails = [
    'innosell.admin@gmail.com',
    'story2screen.admin@gmail.com',
    'fixflex.admin@gmail.com',
    'brainblitz.admin@gmail.com',
    'reelrush.admin@gmail.com',
    'rebootwaste.admin@gmail.com',
    'lockseek.admin@gmail.com',
    'brandit.admin@gmail.com',
    'dance.admin@gmail.com',
    'singing.admin@gmail.com',
    'talent.admin@gmail.com'
];

const eventIds = [
    '69b4478bbc97829869fefc58', // Innosell
    '69b4478bbc97829869fefc59', // Story2Screen
    '69b4478bbc97829869fefc5a', // Fix & Flex
    '69b4478bbc97829869fefc5b', // Brain Blitz
    '69b4478bbc97829869fefc5c', // Reel Rush
    '69b4478bbc97829869fefc5d', // Reboot the Waste
    '69b4478bbc97829869fefc5e', // Lock & Seek
    '69b4478bbc97829869fefc5f', // Brand It
    '69b4478bbc97829869fefc60', // Dance Battle
    '69b4478bbc97829869fefc61', // Singing Showdown
    '69b4478bbc97829869fefc62'  // Talent Show
];

const names = [
    'Innosell Admin',
    'Story2Screen Admin',
    'Fix & Flex Admin',
    'Brain Blitz Admin',
    'Reel Rush Admin',
    'Reboot Admin',
    'Lock Seek Admin',
    'Brand It Admin',
    'Dance Admin',
    'Singing Admin',
    'Talent Admin'
];

const seedEventAdmins = async () => {
    try {
        const bcrypt = require('bcryptjs');
        await mongoose.connect('mongodb://127.0.0.1:27017/STPD_Symposium');
        console.log('Connected to DB');

        for (let i = 0; i < emails.length; i++) {
            let user = await User.findOne({ email: emails[i] });
            if (!user) {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash('admin123', salt);
                
                user = new User({
                    name: names[i],
                    email: emails[i],
                    password: hashedPassword,
                    college: 'Kongu Engineering College',
                    role: 'event-admin',
                    managedEvent: eventIds[i]
                });
                await user.save();
                console.log(`Created ${names[i]} (${emails[i]})`);
            } else {
                user.role = 'event-admin';
                user.managedEvent = eventIds[i];
                await user.save();
                console.log(`Updated ${names[i]} (${emails[i]})`);
            }
        }

        console.log('Done seeding event admins.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedEventAdmins();
