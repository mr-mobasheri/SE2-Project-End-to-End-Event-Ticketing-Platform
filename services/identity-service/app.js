const express = require('express');
const app = express();
app.post('/api/v1/auth/login', (req, res) => res.status(200).json({ token: "jwt_token_here" }));
app.listen(3001, () => console.log('Identity Service listening on port 3001'));
