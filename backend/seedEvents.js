const mongoose = require('mongoose');
const Event = require('./models/Event');

async function seedData() {
  await mongoose.connect('mongodb://localhost:27017/STPD_Symposium');

  const events = [
    { name: 'Innosell', description: 'Transform your innovative product ideas into a pitch! Innosell is a product selling competition where teams showcase their marketing skills and technical innovation to a panel of judges.', type: 'team', teamSize: 3, registrationFee: 200, date: 'March 5, 2026', venue: 'MCA Block - Hall 1' },
    { name: 'Story2Screen', description: 'Unleash your creativity in digital storytelling. Create a short film or a cinematic visual narrative that captures a powerful story through the lens of a camera.', type: 'team', teamSize: 4, registrationFee: 200, date: 'March 5, 2026', venue: 'MBA Block Auditorium' },
    { name: 'Fix & Flex', description: 'A rigorous hands-on technical challenge. Participants are given complex technical problems or broken systems to diagnose and repair within a strict time limit.', type: 'individual', registrationFee: 200, date: 'March 5, 2026', venue: 'Computer Lab 3' },
    { name: 'Brain Blitz', description: 'The ultimate technical quiz. Test your knowledge across computer science, electronics, and general technical trends in this fast-paced, high-pressure quiz bowl.', type: 'individual', registrationFee: 200, date: 'March 5, 2026', venue: 'C K Prahalad Seminar Hall' },
    { name: 'Reel Rush', description: 'Fast-paced video editing and reel creation contest. Create an engaging 60-second video based on a theme provided on the spot.', type: 'individual', registrationFee: 200, date: 'March 5, 2026', venue: 'MCA Digital Lab' },
    { name: 'Reboot the Waste', description: 'Sustainable innovation challenge. Design and build a functional technical prototype or structural model using electronic waste and recycled materials.', type: 'team', teamSize: 2, registrationFee: 200, date: 'March 5, 2026', venue: 'Main Entrance Hall' },
    { name: 'Lock & Seek', description: 'Technical treasure hunt and CTF (Capture The Flag). Solve complex cryptographic puzzles and technical clues hidden across the campus network to find the final "flag".', type: 'team', teamSize: 2, registrationFee: 200, date: 'March 5, 2026', venue: 'Server Room / Online' },
    { name: 'Brandit', description: 'The branding and identity design challenge. Create a complete brand package including logo, tagline, and marketing strategy for a futuristic tech startup.', type: 'team', teamSize: 2, registrationFee: 200, date: 'March 5, 2026', venue: 'Creative Studio' }
  ];

  await Event.deleteMany({});
  await Event.insertMany(events);
  console.log('Sample Event Data Seeded!');
  process.exit();
}

seedData();