// seedAdmin.js
const User = require('./models/User');

User.findOne({ email: 'admin@tradexora.com' }, (err, existingAdmin) => {
    if (existingAdmin) {
        console.log('--- Admin User Already Exists ---');
        console.log('Admin ID:', existingAdmin._id);
        return;
    }

    const newAdmin = {
        username: 'SuperAdmin',
        email: 'admin@tradexora.com',
        password: 'securepassword123',
        role: 'admin',
        wallet: { realBalance: 5000.00, demoBalance: 50000.00 },
        createdAt: new Date()
    };

    User.insert(newAdmin, (err, doc) => {
        if (err) {
            console.error('Error creating admin:', err);
            return;
        }
        console.log('--- Admin User Created Successfully ---');
        console.log('Admin ID:', doc._id);
    });
});