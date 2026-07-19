const express = require('express');
const app = express();
app.get('/api/v1/events', (req, res) => res.status(200).json([{ id: 1, name: "Concert" }]));
app.listen(3003, () => console.log('Catalog Service listening on port 3003'));
