// users.js
const bcrypt = require('bcryptjs');

// This would be replaced with a real database later!
const users = [
  {
    id: 1,
    username: "shinemiles",
    // Store hashed password (hash of "@S1h9i8n5esharon")
    password: bcrypt.hashSync("@S1h9i8n5esharon", 10),
  }
];

module.exports = users;
