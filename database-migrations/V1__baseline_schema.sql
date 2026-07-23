-- database-migrations/V1__baseline_schema.sql

CREATE TABLE venues (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    total_capacity INT NOT NULL,
    address TEXT
);

CREATE TABLE events (
    id UUID PRIMARY KEY,
    venue_id UUID REFERENCES venues(id),
    title VARCHAR(255) NOT NULL,
    event_date TIMESTAMP NOT NULL
);

CREATE TABLE seats (
    id VARCHAR(255) PRIMARY KEY, -- تغییر به VARCHAR برای پشتیبانی از شناسه‌های متنی فرانت‌آند
    venue_id UUID REFERENCES venues(id),
    sector_name VARCHAR(50),
    seat_number INT NOT NULL,
    state VARCHAR(20) DEFAULT 'AVAILABLE'
);

CREATE TABLE reservations (
    id UUID PRIMARY KEY,
    seat_id VARCHAR(255) NOT NULL, -- تغییر به VARCHAR بدون کلید خارجی جهت هماهنگی کامل با فرانت‌آند
    user_id VARCHAR(255) NOT NULL, -- تغییر به VARCHAR برای پذیرش نام‌های کاربری فرانت‌آند
    status VARCHAR(20) DEFAULT 'PENDING',
    expires_at TIMESTAMP NOT NULL
);