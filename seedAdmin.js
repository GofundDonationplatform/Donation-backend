const mongoose = require('mongoose');
const Admin = require('./models/Admin');

// Replace with your actual MongoDB URI
const MONGO_URI = 'mongodb+srv://Shinemiles:%40S1h9i8n5esharon@cluster0.mongodb.net/yourDatabaseName?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    const admin = new Admin({
      username: 'shinemiles',
      password: '$2b$10$OOeRJzto2HI28Ryljo/KbumxAhC3ddUkBJXSzRE.WMEc.MWFzo2ku'
    });
    await admin.save();
    console.log('Admin user created!');
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('Error:', err);
    mongoose.disconnect();
  });
