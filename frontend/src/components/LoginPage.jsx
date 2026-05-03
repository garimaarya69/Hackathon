import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LoginPage = ({ onLogin }) => {
  const [view, setView] = useState('choice'); // 'choice', 'login'
  const [role, setRole] = useState('admin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role }),
      });
      const data = await res.json();
      if (res.ok) {
        onLogin(data);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Cannot connect to server');
    } finally {
      setLoading(false);
    }
  };

  const selectRole = (selectedRole) => {
    setRole(selectedRole);
    setView('login');
    setError('');
  };

  return (
    <div className="login-page">
      {/* Dynamic Warm Background */}
      <div className="bg-blobs">
        <div className="blob" style={{ background: 'var(--accent-amber)', top: '-10%', left: '-10%', width: '60vw', height: '60vw' }} />
        <div className="blob" style={{ background: 'var(--accent-sage)', bottom: '-10%', right: '-10%', width: '50vw', height: '50vw' }} />
      </div>

      <AnimatePresence mode="wait">
        {view === 'choice' ? (
          <motion.div
            key="choice"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="choice-container"
          >
            <h1 className="brand-title">EcoPlate</h1>
            <p className="brand-subtitle">Smart Sustainability Solutions</p>

            <div className="role-choices">
              <div className="role-card" onClick={() => selectRole('admin')}>
                <div className="role-icon">🛡️</div>
                <h3>Admin Console</h3>
                <p>Manage mess systems and student performance metrics.</p>
              </div>
              <div className="role-card" onClick={() => selectRole('student')}>
                <div className="role-icon">🎓</div>
                <h3>Student Portal</h3>
                <p>Track your EcoPoints, streaks, and monthly bonuses.</p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="login"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="login-container"
          >
            <button className="back-btn" onClick={() => setView('choice')}>
              ← Back to roles
            </button>

            <div className="login-header">
              <div className={`role-badge ${role}`}>
                {role === 'admin' ? 'Administrator' : 'Student'}
              </div>
              <h2>Sign In</h2>
              <p>Enter your credentials to access your dashboard</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="input-group">
                <label>{role === 'admin' ? 'Username' : 'Student ID'}</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={role === 'admin' ? 'admin' : 'S001'}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Password</label>
                <div className="input-wrapper">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {error && <div style={{color:'var(--accent-terra)', fontSize:'0.85rem', marginBottom:'1rem', fontWeight:600}}>{error}</div>}

              <button type="submit" className={`submit-btn ${role}`} disabled={loading}>
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LoginPage;
