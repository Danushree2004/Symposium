const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/STPD_Symposium';

mongoose.connect(mongoURI)
  .then(async () => {
    console.log('Connected to DB');
    const res = await User.updateMany({}, { $set: { isVerified: true } });
    console.log('Update result:', res);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
