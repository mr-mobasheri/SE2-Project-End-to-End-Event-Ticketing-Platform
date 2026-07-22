// services/catalog-service/app.js
const express = require('express');
const { Pool } = require('pg');

const app = express();

// PostgreSQL Client Connection Pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres_admin:TicketingSecurePass123@postgres:5432/ticketing'
});

function buildSeatMap(eventId) {
    const sectors = [
        { name: 'VIP', prefix: 'VIP', rows: 4, cols: 6, price: 45 },
        { name: 'Premium', prefix: 'PRM', rows: 5, cols: 8, price: 30 },
        { name: 'Standard', prefix: 'STD', rows: 6, cols: 10, price: 15 }
    ];

    const seats = [];
    for (const sector of sectors) {
        for (let row = 1; row <= sector.rows; row++) {
            for (let col = 1; col <= sector.cols; col++) {
                seats.push({
                    seat_id: `${sector.prefix}_${row}_${col}`,
                    sector: sector.name,
                    row,
                    col,
                    price: sector.price,
                    event_id: eventId
                });
            }
        }
    }
    return seats;
}

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

app.get('/api/v1/events/:eventId/seats', (req, res) => {
    const { eventId } = req.params;
    const seats = buildSeatMap(eventId);
    return res.status(200).json({ event_id: eventId, seats });
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => console.log(`Catalog Service listening on port ${PORT}`));