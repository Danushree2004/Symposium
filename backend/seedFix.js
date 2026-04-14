const mongoose = require('mongoose');
const Event = require('./models/Event');
require('dotenv').config();

const updatedEvents = [
  { name: 'Innosell', type: 'individual', description: 'National Level Paper Presentation: Showcase your innovative technical research, case studies, and groundbreaking ideas in front of a panel of experts. Focus on emerging technologies like AI, Blockchain, and IoT.', venue: 'CK Prahalad Seminar Hall', registrationFee: 200, date: 'March 5, 2026' },
  { name: 'Story2Screen', type: 'individual', description: 'Use-case to UI: Transform complex technical requirements and use-cases into intuitive, high-fidelity UI/UX designs. Bridge the gap between logic and visual storytelling.', venue: 'MCA Block Lab 1', registrationFee: 200, date: 'March 5, 2026' },
  { name: 'Fix & Flex', type: 'individual', description: 'Technical Debugging: Put your coding skills to the test. Identify, diagnose, and fix logical and syntax errors in complex codebases across multiple programming languages.', venue: 'MCA Block Lab 2', registrationFee: 200, date: 'March 5, 2026' },
  { name: 'Brain Blitz', type: 'individual', description: 'Technical Quiz: A high-octane battle of wits covering everything from computer science fundamentals to the latest industry trends. Speed and accuracy are your only allies.', venue: 'Seminar Hall 2', registrationFee: 200, date: 'March 5, 2026' },
  { name: 'Reel Rush', type: 'team', description: 'Short Film Competition: Capture the essence of technology or student life through your lens. A platform for budding filmmakers to showcase cinematography and storytelling.', venue: 'MBA block Auditorium', registrationFee: 200, date: 'March 5, 2026' },
  { name: 'Reboot the Waste', type: 'team', description: 'Tech-from-Trash: Innovate by repurposing electronic and industrial waste into functional prototypes or artistic technical models. Sustainability meets Engineering.', venue: 'MCA Block Lobby', registrationFee: 200, date: 'March 5, 2026' },
  { name: 'Lock & Seek', type: 'team', description: 'Technical Treasure Hunt: Decode cryptic messages, solve algorithmic puzzles, and navigate through the campus using your tech knowledge to find the ultimate prize.', venue: 'KEC Campus Grounds', registrationFee: 200, date: 'March 5, 2026' },
  { name: 'Brand It', type: 'team', description: 'Ad Zap: Unleash your marketing genius. Strategize, create, and present a compelling brand identity or technical product advertisement on the spot.', venue: 'MCA Block Hall 3', registrationFee: 200, date: 'March 5, 2026' },
  { name: 'Dance Battle', type: 'individual', description: 'Cultural Event: Express yourself through movement. A dynamic stage for solo performers to showcase various dance styles from classical to contemporary.', venue: 'Main Auditorium', registrationFee: 200, date: 'March 5, 2026', type: 'cultural' },
  { name: 'Singing Showdown', type: 'individual', description: 'Vocal Competition: Let your voice be heard. A platform for talented singers to perform and compete across multiple musical genres.', venue: 'Seminar Hall 1', registrationFee: 200, date: 'March 5, 2026', type: 'cultural' },
  { name: 'Talent Show', type: 'individual', description: 'Open Stage: Show your hidden skills! Whether it is mimicry, beatboxing, or any unique talent, the stage is yours to own.', venue: 'CK Prahalad Hall Stage', registrationFee: 200, date: 'March 5, 2026', type: 'cultural' }
];

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/STPD_Symposium')
  .then(async () => {
    console.log('Connected to MongoDB...');
    await Event.deleteMany({});
    // Map cultural type specifically
    const mappedEvents = updatedEvents.map(e => ({
        ...e,
        type: (e.name === 'Dance Battle' || e.name === 'Singing Showdown' || e.name === 'Talent Show') ? 'individual' : e.type,
        category: (e.name === 'Dance Battle' || e.name === 'Singing Showdown' || e.name === 'Talent Show') ? 'cultural' : 'technical'
    }));
    await Event.insertMany(mappedEvents);
    console.log('Matrix Rebooted: ORION 2K26 events synchronized successfully.');
    process.exit();
  })
  .catch(err => {
    console.error('Seeding error:', err);
    process.exit(1);
  });
