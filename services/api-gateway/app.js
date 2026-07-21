// services/api-gateway/app.js
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Health Check
app.get('/health', (req, res) => res.status(200).send('API Gateway is running'));

// Dynamic Routing to Internal Microservices
app.use('/api/v1/auth', createProxyMiddleware({ target: 'http://identity-service:3001', changeOrigin: true }));
app.use('/api/v1/reservations', createProxyMiddleware({ target: 'http://reservation-engine:3002', changeOrigin: true }));
app.use('/api/v1/events', createProxyMiddleware({ target: 'http://catalog-service:3003', changeOrigin: true }));
app.use('/api/v1/payments', createProxyMiddleware({ target: 'http://billing-service:3004', changeOrigin: true }));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`API Gateway listening on port ${PORT}`));