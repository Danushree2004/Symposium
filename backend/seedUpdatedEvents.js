const mongoose = require('mongoose');
const Event = require('./models/Event');
require('dotenv').config();

// Close any existing connections before starting
if (mongoose.connection.readyState !== 0) {
    mongoose.disconnect();
}

const updatedEvents = [
  { name: 'Innosell', type: 'individual', category: 'technical', description: ' National Level Paper Presentation: Showcase your innovative technical research, case studies, and groundbreaking ideas in front of a panel of experts. Focus on emerging technologies like AI, Blockchain, and IoT.', venue: 'CK Prahalad Seminar Hall', registrationFee: 200, date: 'March 5, 2026' },
  { name: 'Story2Screen', type: 'individual', category: 'technical', description: ' Use-case to UI: Transform complex technical requirements and use-cases into intuitive, high-fidelity UI/UX designs. Bridge the gap between logic and visual storytelling.', venue: 'MCA Block Lab 1', registrationFee: 200, date: 'March 5, 2026' },
  { name: 'Fix & Flex', type: 'individual', category: 'technical', description: ' Technical Debugging: Put your coding skills to the test. Identify, diagnose, and fix logical and syntax errors in codebases across multiple programming languages.', venue: 'MCA Block Lab 2', registrationFee: 200, date: 'March 5, 2026' },
  { name: 'Brain Blitz', type: 'individual', category: 'technical', description: ' Technical Quiz: A high-octane battle of wits covering everything from computer science fundamentals to the latest industry trends.', venue: 'Seminar Hall 2', registrationFee: 200, date: 'March 5, 2026' },
  { name: 'Reel Rush', type: 'team', category: 'technical', description: ' Short Film Competition: Capture the essence of technology or student life through your lens. A platform for budding filmmakers to showcase cinematography.', venue: 'MBA block Auditorium', registrationFee: 200, date: 'March 5, 2026' },
  { name: 'Reboot the Waste', type: 'team', category: 'technical', description: ' Tech-from-Trash: Innovate by repurposing electronic and industrial waste into functional prototypes or artistic technical models.', venue: 'MCA Block Lobby', registrationFee: 200, date: 'March 5, 2026' },
  { name: 'Lock & Seek', type: 'team', category: 'technical', description: ' Technical Treasure Hunt: Decode cryptic messages, solve algorithmic puzzles, and navigate through the campus using your tech knowledge.', venue: 'KEC Campus Grounds', registrationFee: 200, date: 'March 5, 2026' },
  { name: 'Brand It', type: 'team', category: 'technical', description: ' Ad Zap: Unleash your marketing genius. Strategize, create, and present a compelling brand identity or technical product advertisement on the spot.', venue: 'MCA Block Hall 3', registrationFee: 200, date: 'March 5, 2026' },
  { name: 'Dance Battle', type: 'individual', category: 'cultural', description: ' Cultural Event: Express yourself through movement. A dynamic stage for solo performers to showcase various dance styles.', venue: 'Main Auditorium', registrationFee: 200, date: 'March 5, 2026' },
  { name: 'Singing Showdown', type: 'individual', category: 'cultural', description: ' Vocal Competition: Let your voice be heard. A platform for talented singers to perform and compete across genres.', venue: 'Seminar Hall 1', registrationFee: 200, date: 'March 5, 2026' },
  { name: 'Talent Show', type: 'individual', category: 'cultural', description: ' Open Stage: Show your hidden skills! Whether it is mimicry, beatboxing, or any unique talent, the stage is yours.', venue: 'CK Prahalad Hall Stage', registrationFee: 200, date: 'March 5, 2026' }
];

mongoose.connect('mongodb://localhost:27017/stpd')
  .then(async () => {
    console.log('Connected to MongoDB...');
    await Event.deleteMany({});
    await Event.insertMany(updatedEvents);
    console.log('Matrix Rebooted: ORION 2K26 events synchronized successfully.');
    process.exit();
  })
  .catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
  });
