// services/identity-service/app.js
const express = require('express');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'ticketing_super_secret_key_123';

// Endpoint to generate actual signed JWT
app.post('/api/v1/auth/login', (req, res) => {
    const { username } = req.body;
    
    // Generate real cryptographic JWT
    const payload = {
        user: username || 'ali_nourbakhsh',
        role: 'BUYER'
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

    console.log(`[Identity] Real JWT token generated for user: ${payload.user}`);
    return res.status(200).json({ token });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Identity Service listening on port ${PORT}`));