import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, animate, AnimatePresence } from 'framer-motion';

const AnimatedNumber = ({ value, decimals = 0, suffix = '' }) => {
  const [displayValue, setDisplayValue] = useState(0);
  useEffect(() => {
    let start = displayValue;
    const end = value;
    if (start === end) return;
    let totalFrames = 30;
    let frame = 0;
    const timer = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      setDisplayValue(start + (end - start) * progress);
      if (frame === totalFrames) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{displayValue.toFixed(decimals)}{suffix}</span>;
};

const StudentPortal = ({ user, onLogout }) => {
  const [student, setStudent] = useState(null);
  const [snacks, setSnacks] = useState([]);
  const [redemptionStatus, setRedemptionStatus] = useState(null);
  const [allStudents, setAllStudents] = useState([]);
  const [activeTab, setActiveTab] = useState('rewards');

  const fetchData = async () => {
    try {
      const [stuRes, snackRes, allStuRes] = await Promise.all([
        axios.get(`http://localhost:5001/api/student/${user.student_id}/dashboard`),
        axios.get('http://localhost:5001/api/rewards/snacks'),
        axios.get('http://localhost:5001/api/rewards/students'),
      ]);
      setStudent(stuRes.data);
      setSnacks(snackRes.data);
      setAllStudents(allStuRes.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRedeem = async (snackId) => {
    try {
      await axios.post('http://localhost:5001/api/rewards/redeem', {
        student_id: user.student_id,
        snack_id: snackId,
      });
      setRedemptionStatus({ type: 'success', message: `Successfully redeemed!` });
      fetchData();
      setTimeout(() => setRedemptionStatus(null), 3000);
    } catch (error) {
      setRedemptionStatus({ type: 'error', message: 'Not enough points' });
      setTimeout(() => setRedemptionStatus(null), 3000);
    }
  };

  if (!student) return <div className="portal-wrapper">Loading...</div>;

  const monthlyGoal = 500;
  const monthlyProgress = Math.min((student.points / monthlyGoal) * 100, 100);

  return (
    <div className="portal-wrapper">
      <header className="portal-header">
        <div className="header-left">
          <h1 style={{fontSize:'1.5rem', fontWeight:800}}>🌿 EcoPlate</h1>
          <span style={{fontSize:'0.75rem', fontWeight:700, color:'var(--accent-sage)', textTransform:'uppercase'}}>Student Portal</span>
        </div>
        <div className="header-right" style={{display:'flex', alignItems:'center', gap:'1.5rem'}}>
          <div style={{textAlign:'right'}}>
            <div style={{fontWeight:700, fontSize:'0.9rem'}}>{student.name}</div>
            <div style={{fontSize:'0.75rem', color:'var(--text-muted)'}}>{student.id}</div>
          </div>
          <button onClick={onLogout} className="warm-logout-btn">Sign Out</button>
        </div>
      </header>

      <main style={{maxWidth:'1200px', margin:'0 auto'}}>
        <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="portal-hero-card">
          <div className="hero-content">
            <label style={{fontSize:'0.8rem', fontWeight:700, color:'var(--accent-sage)', textTransform:'uppercase'}}>Your Wallet</label>
            <div className="main-stat">
              <span className="value"><AnimatedNumber value={student.points} /></span>
              <span style={{fontSize:'1.5rem', color:'var(--text-muted)', marginLeft:'0.5rem', fontWeight:600}}>pts</span>
            </div>
            <div style={{display:'flex', gap:'2rem', marginTop:'2rem'}}>
              <div>
                <span style={{display:'block', fontSize:'0.75rem', fontWeight:700, color:'var(--text-muted)'}}>STREAK</span>
                <span style={{fontSize:'1.25rem', fontWeight:800}}>🔥 {student.streak} Days</span>
              </div>
              <div>
                <span style={{display:'block', fontSize:'0.75rem', fontWeight:700, color:'var(--text-muted)'}}>RANK</span>
                <span style={{fontSize:'1.25rem', fontWeight:800}}>🏆 Top 10%</span>
              </div>
            </div>
          </div>
          <div className="hero-bonus-mini" style={{width:'300px'}}>
            <div className="portal-card" style={{padding:'1.5rem'}}>
              <h4 style={{fontSize:'0.85rem', marginBottom:'1rem'}}>Monthly Bonus</h4>
              <div style={{height:'10px', background:'var(--warm-bg)', borderRadius:'5px', overflow:'hidden', marginBottom:'0.5rem'}}>
                <div style={{width: `${monthlyProgress}%`, height:'100%', background:'var(--accent-sage)'}} />
              </div>
              <span style={{fontSize:'0.75rem', fontWeight:600}}>{student.points} / {monthlyGoal} pts to bonus</span>
            </div>
          </div>
        </motion.div>

        <div className="portal-tabs">
          <button className={`tab-btn ${activeTab === 'rewards' ? 'active' : ''}`} onClick={() => setActiveTab('rewards')}>Rewards</button>
          <button className={`tab-btn ${activeTab === 'achievements' ? 'active' : ''}`} onClick={() => setActiveTab('achievements')}>Achievements</button>
        </div>

        <div style={{marginTop:'2rem'}}>
          {activeTab === 'rewards' ? (
            <div className="snack-grid">
              {snacks.map(snack => {
                const canAfford = student.points >= snack.cost_in_points;
                return (
                  <div key={snack.id} className={`snack-card-alt ${canAfford ? 'can-buy' : ''}`}>
                    <div style={{fontSize:'2.5rem', marginBottom:'1rem'}}>{snack.name === 'Apple' ? '🍎' : '🍪'}</div>
                    <h4 style={{fontWeight:700}}>{snack.name}</h4>
                    <div style={{fontSize:'0.85rem', color:'var(--accent-amber)', fontWeight:800, margin:'0.5rem 0'}}>{snack.cost_in_points} pts</div>
                    <button className="buy-btn" disabled={!canAfford} onClick={() => handleRedeem(snack.id)}>
                      {canAfford ? 'Redeem' : 'Insufficient'}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{display:'grid', gap:'1rem'}}>
              <div className="achievement-item unlocked">
                <span style={{fontSize:'1.5rem'}}>🌱</span>
                <div>
                  <div style={{fontWeight:700}}>Clean Plate Club</div>
                  <div style={{fontSize:'0.8rem', color:'var(--text-muted)'}}>Complete 5 clean plates in a row</div>
                </div>
              </div>
              <div className="achievement-item">
                <span style={{fontSize:'1.5rem'}}>⚡</span>
                <div>
                  <div style={{fontWeight:700}}>Early Bird</div>
                  <div style={{fontSize:'0.8rem', color:'var(--text-muted)'}}>Finish breakfast before 8:00 AM</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {redemptionStatus && <div className="toast-notification success">{redemptionStatus.message}</div>}
    </div>
  );
};

export default StudentPortal;
