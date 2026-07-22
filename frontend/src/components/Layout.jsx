import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children, showSteps }) {
  const { isAuthenticated, username, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!showSteps) {
    return <>{children}</>;
  }

  return (
    <div className="app-layout">
      <header className="app-header">
        <Link to="/" className="logo">
          <div className="logo-icon">🎫</div>
          TicketSaz
        </Link>
        {isAuthenticated && (
          <div className="header-user">
            <span>👤 {username}</span>
            <button className="btn btn-ghost" onClick={handleLogout} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
              Logout
            </button>
          </div>
        )}
      </header>
      <main className="app-main">
        {children}
      </main>
    </div>
  );
}
