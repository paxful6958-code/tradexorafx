// models/User.js
const Datastore = require('@seald-io/nedb');
const path = require('path');

const db = new Datastore({
    filename: path.join(__dirname, '../tradexora.db'),
    autoload: true
});

db.ensureIndex({ fieldName: 'email', unique: true }, (err) => {
    if (err) console.error('Index error:', err);
});

module.exports = db;