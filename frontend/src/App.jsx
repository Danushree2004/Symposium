import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Register from './Register';
import EventDashboard from './EventDashboard';
import EventDetail from './EventDetail';
import AdminPanel from './AdminPanel';
import AdminLogin from './AdminLogin';
import ParticipantDashboard from './ParticipantDashboard';
import './App.css';
import { useNavigate } from 'react-router-dom';

const App = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    const checkTouch = () => {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkTouch();
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
    window.location.reload(); 
  };

  return (
    <div className="min-h-screen" style={{ width: '100%', overflowX: 'hidden' }}>
      {/* Project-wide Custom Mouse Pointer - HIDDEN ON TOUCH DEVICES */}
      {!isTouchDevice && (
        <>
          <motion.div 
              animate={{ x: mousePos.x - 10, y: mousePos.y - 10 }}
              transition={{ type: "spring", damping: 30, stiffness: 200, mass: 0.5 }}
              style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  width: '20px',
                  height: '20px',
                  background: 'radial-gradient(circle, var(--accent-primary) 0%, transparent 80%)',
                  borderRadius: '50%',
                  pointerEvents: 'none',
                  zIndex: 9999,
                  boxShadow: '0 0 15px var(--accent-primary)',
                  filter: 'blur(1px)'
              }}
          />
          <motion.div 
              animate={{ x: mousePos.x - 30, y: mousePos.y - 30 }}
              transition={{ type: "spring", damping: 20, stiffness: 100, mass: 0.8 }}
              style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  width: '60px',
                  height: '60px',
                  background: 'radial-gradient(circle, rgba(0, 210, 255, 0.1) 0%, transparent 70%)',
                  border: '1px solid rgba(0, 210, 255, 0.3)',
                  borderRadius: '50%',
                  pointerEvents: 'none',
                  zIndex: 9998,
                  filter: 'blur(2px)'
              }}
          />
        </>
      )}
      
      <nav style={{ padding: '0.8rem 0', background: 'rgba(13, 17, 23, 0.8)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'sticky', top: 0, zIndex: 1000 }}>
        <div className="container nav-container">
          <Link to="/" style={{ fontSize: '1.4rem', fontWeight: 800, background: 'linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textDecoration: 'none', letterSpacing: '-1px' }}>ORION 2K26</Link>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <Link to="/" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Dashboard</Link>
            
            {user ? (
              <>
                <Link to="/participant-dashboard" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>My Profile</Link>
                {(user.role === 'admin' || user.role === 'event-admin') && (
                  <Link to="/admin" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Admin Panel</Link>
                )}
                <button 
                  onClick={handleLogout}
                  style={{ 
                    background: 'rgba(255, 64, 128, 0.1)', 
                    border: '1px solid rgba(255, 64, 128, 0.3)', 
                    color: '#ff4080', 
                    padding: '6px 14px', 
                    borderRadius: '8px', 
                    fontSize: '0.65rem', 
                    fontWeight: 800, 
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/register" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Join Now</Link>
                <Link to="/admin-login" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Admin</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main style={{ padding: '2rem 1rem' }}>
        <Routes>
          <Route path="/" element={<EventDashboard />} />
          <Route path="/register" element={<Register />} />
          <Route path="/event/:eventId" element={<EventDetail />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/participant-dashboard" element={<ParticipantDashboard />} />
        </Routes>
      </main>
    </div>
  );
};

const AppWrapper = () => (
  <Router>
    <App />
  </Router>
);

export default AppWrapper;

