import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

// Pages
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import RestaurantDashboard from './pages/RestaurantDashboard';
import UserMap from './pages/UserMap';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    // MOCK AUTH CHECK (Since Firebase no keys)
    const checkMockAuth = () => {
      try {
        const mockUserStr = localStorage.getItem('mockUser');
        const storedRole = localStorage.getItem('userRole');

        if (mockUserStr) {
          setUser(JSON.parse(mockUserStr));
          setUserRole(storedRole || 'user');
        } else {
          setUser(null);
          setUserRole(null);
        }
      } catch (err) {
        console.error('Failed to parse mock user:', err);
        localStorage.removeItem('mockUser');
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    };

    checkMockAuth();
  }, []);

  // Login callback — updates App state directly so routes re-render immediately
  const handleLogin = (userData, role) => {
    setUser(userData);
    setUserRole(role);
  };

  // Logout callback — clears App state so route guards kick in
  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('mockUser');
    setUser(null);
    setUserRole(null);
  };

  if (loading) {
    return <div className="h-screen flex items-center justify-center bg-gray-50 text-emerald-600 text-xl font-bold">Loading Food Rescue Map...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={!user ? <Auth onLogin={handleLogin} /> : (userRole === 'restaurant' ? <Navigate to="/dashboard" /> : <Navigate to="/map" />)} />
        <Route path="/dashboard" element={user && userRole === 'restaurant' ? <RestaurantDashboard user={user} onLogout={handleLogout} /> : <Navigate to="/auth" />} />
        <Route path="/map" element={user && userRole === 'user' ? <UserMap user={user} onLogout={handleLogout} /> : <Navigate to="/auth" />} />
      </Routes>
    </Router>
  );
}

export default App;
