const express = require('express');
const app = express();
app.get('/health', (req, res) => res.status(200).send('API Gateway is running'));
app.listen(8080, () => console.log('API Gateway listening on port 8080'));
