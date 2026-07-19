const express = require('express');
const app = express();
app.post('/api/v1/reservations/lock', (req, res) => res.status(200).send('Seat Locked in Redis'));
app.listen(3002, () => console.log('Reservation Engine listening on port 3002'));
