// services/catalog-service/app.js
const express = require('express');
const { Pool } = require('pg');

const app = express();

// PostgreSQL Client Connection Pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres_admin:TicketingSecurePass123@postgres:5432/ticketing'
});

// Fetch events dynamically from PostgreSQL container
app.get('/api/v1/events', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM events');
        
        // Fallback mock array if DB has no events inserted yet
        if (result.rows.length === 0) {
            return res.status(200).json([
                { id: "e1", title: "Concert (PostgreSQL Dynamic Check)", event_date: new Date() }
            ]);
        }
        
        return res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching events from PostgreSQL:', error);
        return res.status(500).json({ error: 'Database connection failed' });
    }
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => console.log(`Catalog Service listening on port ${PORT}`));