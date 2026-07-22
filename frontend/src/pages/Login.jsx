import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as apiLogin } from '../api/client';

export default function Login() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    setLoading(true);
    setError('');

    const { ok, data } = await apiLogin(username.trim());

    if (ok && data.token) {
      login(data.token, username.trim());
      navigate('/');
    } else {
      setError('Login failed. Make sure the backend is running on port 8080.');
    }

    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-card card">
        <div className="login-hero">
          <div className="logo">
            <div className="logo-icon">🎫</div>
            TicketSaz
          </div>
          <p>Your gateway to live events — book seats in seconds</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">Username</label>
            <input
              id="username"
              className="form-input"
              type="text"
              placeholder="Enter your name (e.g. ali)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
          </div>

          {error && <div className="error-msg">{error}</div>}

          <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ marginTop: '0.5rem' }}>
            {loading ? <><span className="spinner" /> Signing in...</> : 'Sign In →'}
          </button>
        </form>
      </div>
    </div>
  );
}
