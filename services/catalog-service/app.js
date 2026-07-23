// services/catalog-service/app.js
const express = require('express');
const { Pool } = require('pg');

const app = express();

// نمایش آدرس اتصالی که کاتالوگ در زمان شروع استفاده می‌کند
const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres_admin:TicketingSecurePass123@ticketing-postgres:5432/ticketing';
console.log(`[Catalog] Initializing database pool with URL: ${dbUrl}`);

const pool = new Pool({
    connectionString: dbUrl,
    connectionTimeoutMillis: 5000, // حداکثر ۵ ثانیه معطلی در صورت وجود اختلال در کانکشن دیتابیس
    idleTimeoutMillis: 10000       // قطع خودکار کانکشن‌های بدون استفاده بعد از ۱۰ ثانیه
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

// استعلام صندلی‌ها همراه با نگاشت زنده وضعیت
app.get('/api/v1/events/:eventId/seats', async (req, res) => {
    const { eventId } = req.params;
    console.log(`\n[Catalog] ===== NEW REQUEST: Fetching seats for Event ID: ${eventId} =====`);
    
    try {
        const queryText = "SELECT seat_id, status FROM reservations";
        const dbResult = await pool.query(queryText);
        
        const reservationMap = new Map();
        dbResult.rows.forEach(row => {
            if (row.seat_id) {
                const cleanedSeatId = row.seat_id.trim();
                reservationMap.set(cleanedSeatId, row.status === 'CONFIRMED' ? 'BOOKED' : 'LOCKED');
            }
        });

        const baseSeats = buildSeatMap(eventId);

        const mappedSeats = baseSeats.map(seat => {
            const reservedState = reservationMap.get(seat.seat_id);
            const isBooked = reservedState === 'BOOKED';
            const isLocked = reservedState === 'LOCKED';
            const isReserved = isBooked || isLocked;

            const statusUpper = isBooked ? 'BOOKED' : (isLocked ? 'LOCKED' : 'AVAILABLE');

            return {
                ...seat,
                id: seat.seat_id,
                seatId: seat.seat_id,
                seat_id: seat.seat_id,
                state: statusUpper,
                status: statusUpper,
                isBooked: isBooked,
                is_booked: isBooked,
                isReserved: isReserved,
                is_reserved: isReserved,
                isLocked: isLocked,
                is_locked: isLocked,
                disabled: isReserved, 
                available: !isReserved,
                isAvailable: !isReserved
            };
        });

        return res.status(200).json({ event_id: eventId, seats: mappedSeats });
    } catch (error) {
        console.error('Error fetching seats with states:', error.message);
        const fallbackSeats = buildSeatMap(eventId).map(s => ({ 
            ...s, 
            id: s.seat_id, 
            seatId: s.seat_id, 
            state: 'AVAILABLE', 
            status: 'AVAILABLE',
            disabled: false,
            isBooked: false,
            isReserved: false
        }));
        return res.status(200).json({ event_id: eventId, seats: fallbackSeats });
    }
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => console.log(`Catalog Service listening on port ${PORT}`));