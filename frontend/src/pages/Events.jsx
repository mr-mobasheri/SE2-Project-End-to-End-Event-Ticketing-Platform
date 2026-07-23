import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getEvents, releaseSeat } from '../api/client';

function formatDate(dateStr) {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Date TBA';
  }
}

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token, username, selectedSeat, reservation, setSelectedEvent, resetBooking } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      if (reservation && selectedSeat && token && username) {
        await releaseSeat(token, {
          seat_id: selectedSeat.seat_id,
          user_id: username
        }).catch(() => {});
      }
      resetBooking();
      if (cancelled) return;

      getEvents().then(({ ok, data }) => {
        if (cancelled) return;
        if (ok && Array.isArray(data)) {
          setEvents(data);
        } else {
          setError('Could not load events. Is the backend running?');
        }
        setLoading(false);
      });
    };

    init();
    return () => {
      cancelled = true;
    };
    // Run once on mount; reservation/seat captured from navigation into Events
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetBooking]);

  const handleSelect = (event) => {
    setSelectedEvent(event);
    navigate(`/events/${event.id}/seats`);
  };

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner" />
        <span>Loading events...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="error-msg">{error}</div>
        <button className="btn btn-primary" onClick={() => window.location.reload()} style={{ marginTop: '1rem' }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="card-title">Upcoming Events</h1>
      <p className="card-subtitle">Select an event to choose your seat</p>

      {events.length === 0 ? (
        <div className="empty-state">No events available at the moment.</div>
      ) : (
        <div className="events-grid">
          {events.map((event) => (
            <div key={event.id} className="event-card" onClick={() => handleSelect(event)}>
              <div className="event-date">{formatDate(event.event_date)}</div>
              <div className="event-title">{event.title}</div>
              <div className="event-meta">Tap to select seats →</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
