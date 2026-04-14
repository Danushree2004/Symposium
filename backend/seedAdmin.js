const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/STPD_Symposium');
    console.log('Connected to MongoDB for Admin Seeding...');

    const adminEmail = 'admin@orion.com';
    const adminPassword = 'adminpassword123';

    // Check if admin exists
    let admin = await User.findOne({ email: adminEmail });
    
    if (admin) {
      console.log('Admin already exists. Updating password and role...');
    } else {
      admin = new User({
        name: 'System Admin',
        email: adminEmail,
        college: 'Internal'
      });
    }

    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(adminPassword, salt);
    admin.role = 'admin';

    await admin.save();
    console.log('-------------------------------');
    console.log('ADMIN ACCOUNT CREATED/UPDATED');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log('-------------------------------');
    
    process.exit();
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seedAdmin();