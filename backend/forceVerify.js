const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const emailToVerify = 'krupans.25mca@kongu.edu';

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/STPD_Symposium')
  .then(async () => {
    const res = await User.updateOne(
      { email: emailToVerify }, 
      { $set: { isVerified: true, verificationToken: null } }
    );
    if (res.matchedCount === 0) {
      console.log(`No user found with email: ${emailToVerify}`);
    } else {
      console.log(`STRICT SUCCESS! ${emailToVerify} is now definitely verified.`, res);
    }
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
