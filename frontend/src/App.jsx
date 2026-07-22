import { Navigate, Routes, Route, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import StepIndicator from './components/StepIndicator';
import Login from './pages/Login';
import Events from './pages/Events';
import SeatSelection from './pages/SeatSelection';
import Checkout from './pages/Checkout';
import Ticket from './pages/Ticket';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  const location = useLocation();
  const showSteps = !location.pathname.includes('/login');

  return (
    <Layout showSteps={showSteps}>
      {showSteps && <StepIndicator />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Events /></ProtectedRoute>} />
        <Route path="/events/:eventId/seats" element={<ProtectedRoute><SeatSelection /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="/ticket" element={<ProtectedRoute><Ticket /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return <AppRoutes />;
}
