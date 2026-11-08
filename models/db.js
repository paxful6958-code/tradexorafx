const Datastore = require('nedb');
const path = require('path');

// This automatically creates a local file named 'tradexora.db' in your project
const db = new Datastore({
    filename: path.join(__dirname, '../tradexora.db'),
    autoload: true
});

module.exports = db;