import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getEventSeats, lockSeat } from '../api/client';
import SeatMap from '../components/SeatMap';

export default function SeatSelection() {
  const { eventId } = useParams();
  const { token, username, selectedEvent, setSelectedSeat, setReservation } = useAuth();
  const navigate = useNavigate();

  const [seats, setSeats] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locking, setLocking] = useState(false);
  const [error, setError] = useState('');

  const loadSeats = async () => {
    const { ok, data } = await getEventSeats(eventId);
    if (ok && data.seats) {
      setSeats(data.seats);
    } else {
      setError('Failed to load seat map.');
    }
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    loadSeats();
  }, [eventId]);

  useEffect(() => {
    const refreshOnFocus = () => {
      if (document.visibilityState === 'visible') {
        getEventSeats(eventId).then(({ ok, data }) => {
          if (ok && data.seats) setSeats(data.seats);
        });
      }
    };

    document.addEventListener('visibilitychange', refreshOnFocus);
    return () => document.removeEventListener('visibilitychange', refreshOnFocus);
  }, [eventId]);

  const handleSelect = (seat) => {
    setSelected(seat);
    setError('');
  };

  const handleLock = async () => {
    if (!selected) {
      setError('Please select a seat first.');
      return;
    }

    setLocking(true);
    setError('');

    const { ok, status, data } = await lockSeat(token, {
      seat_id: selected.seat_id,
      user_id: username,
      event_id: eventId
    });

    if (ok) {
      setSelectedSeat(selected);
      setReservation({
        seat_id: selected.seat_id,
        expires_in_seconds: data.expires_in_seconds,
        locked_at: Date.now()
      });
      navigate('/checkout');
    } else if (status === 409) {
      setError(`Seat ${selected.seat_id} is already taken. Please choose another.`);
      setSelected(null);
    } else {
      setError(data.error || 'Failed to lock seat. Please try again.');
    }

    setLocking(false);
  };

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner" />
        <span>Loading seat map...</span>
      </div>
    );
  }

  const eventTitle = selectedEvent?.title || 'Event';

  return (
    <div>
      <h1 className="card-title">{eventTitle}</h1>
      <p className="card-subtitle">Pick your seat — it will be held for 10 minutes once locked</p>

      <div className="card">
        <SeatMap
          seats={seats}
          selectedSeatId={selected?.seat_id}
          onSelect={handleSelect}
        />

        {selected && (
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(124, 58, 237, 0.1)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(124, 58, 237, 0.2)' }}>
            <strong>{selected.seat_id}</strong> — {selected.sector} · ${selected.price}
          </div>
        )}

        {error && <div className="error-msg">{error}</div>}

        <div className="page-actions">
          <button className="btn btn-ghost" onClick={() => navigate('/')}>
            ← Back
          </button>
          <button className="btn btn-primary" onClick={handleLock} disabled={!selected || locking}>
            {locking ? <><span className="spinner" /> Locking...</> : 'Lock Seat & Continue →'}
          </button>
        </div>
      </div>
    </div>
  );
}
