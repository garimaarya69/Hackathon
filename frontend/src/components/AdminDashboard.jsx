import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

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

function AdminDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState({ records: [], alerts: [], ai_recommendation: '' });
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [snacks, setSnacks] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [redemptionStatus, setRedemptionStatus] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Input State for Manual Waste Entry
  const [manualFood, setManualFood] = useState('Rice');
  const [manualWeight, setManualWeight] = useState('');
  const [inputStatus, setInputStatus] = useState(null);

  const initialMenu = {
    Monday: { lunch: "Rice & Dal", dinner: "Chapati & Paneer" },
    Tuesday: { lunch: "Rice & Paneer", dinner: "Chapati & Dal" },
    Wednesday: { lunch: "Rice & Dal", dinner: "Chapati & Paneer" },
    Thursday: { lunch: "Rice & Paneer", dinner: "Chapati & Dal" },
    Friday: { lunch: "Rice & Dal", dinner: "Chapati & Paneer" },
    Saturday: { lunch: "Rice & Paneer", dinner: "Chapati & Dal" },
    Sunday: { lunch: "Rice & Dal", dinner: "Chapati & Paneer" }
  };

  const fetchData = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/dashboard-data');
      setData(response.data);
      setLoading(false);
    } catch (error) { console.error(error); }
  };

  const fetchRewardsData = async () => {
    try {
      const [stuRes, snackRes] = await Promise.all([
        axios.get('http://localhost:5001/api/rewards/students'),
        axios.get('http://localhost:5001/api/rewards/snacks')
      ]);
      setStudents(stuRes.data);
      setSnacks(snackRes.data);
    } catch (error) { console.error(error); }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualWeight) return;
    try {
      await axios.post('http://localhost:5001/api/waste', {
        weight_grams: parseFloat(manualWeight),
        classified_food: manualFood
      });
      setInputStatus({ type: 'success', message: `Logged ${manualWeight}g of ${manualFood}!` });
      setManualWeight('');
      fetchData();
      setTimeout(() => setInputStatus(null), 3000);
    } catch (err) {
      setInputStatus({ type: 'error', message: 'Failed to log waste' });
    }
  };

  const handleRedeem = async (snackId) => {
    if (!selectedStudent) return;
    try {
      await axios.post('http://localhost:5001/api/rewards/redeem', {
        student_id: selectedStudent,
        snack_id: snackId
      });
      setRedemptionStatus({ type: 'success', message: `Success!` });
      fetchRewardsData();
      setTimeout(() => setRedemptionStatus(null), 3000);
    } catch (error) {
      setRedemptionStatus({ type: 'error', message: 'Redemption failed' });
      setTimeout(() => setRedemptionStatus(null), 3000);
    }
  };

  useEffect(() => {
    fetchData();
    fetchRewardsData();
    const interval = setInterval(() => { fetchData(); fetchRewardsData(); }, 5000);
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => { clearInterval(interval); clearInterval(clockInterval); };
  }, []);

  const analyzeWastePatterns = () => {
    const coreItems = ["Rice", "Dal", "Chapati", "Paneer"];
    const wasteByFood = { "Rice": {t:0,c:0}, "Dal": {t:0,c:0}, "Chapati": {t:0,c:0}, "Paneer": {t:0,c:0} };
    data.records.forEach(r => {
      coreItems.forEach(item => {
        if (r.classified_food.toLowerCase().includes(item.toLowerCase())) {
          wasteByFood[item].t += r.weight_grams;
          wasteByFood[item].c += 1;
        }
      });
    });
    return coreItems.map(item => ({
      name: item,
      avgWaste: wasteByFood[item].c > 0 ? wasteByFood[item].t / wasteByFood[item].c : 0
    })).sort((a, b) => b.avgWaste - a.avgWaste);
  };

  const patterns = analyzeWastePatterns();
  const topWasteItem = patterns[0];
  const chartData = data.records.map((r, i) => ({ name: i + 1, weight: r.weight_grams })).slice(-15);
  const totalWaste = data.records.reduce((acc, curr) => acc + curr.weight_grams, 0);

  return (
    <div className="dash-wrapper">
      <aside className="dash-sidebar">
        <div className="sidebar-logo"><span>🌿</span> <span>EcoPlate Admin</span></div>
        <nav className="sidebar-nav">
          <div className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}><span>📊</span> <span>Overview</span></div>
          <div className={`nav-item ${activeTab === 'mess' ? 'active' : ''}`} onClick={() => setActiveTab('mess')}><span>🍴</span> <span>Mess Monitoring</span></div>
          <div className={`nav-item ${activeTab === 'planner' ? 'active' : ''}`} onClick={() => setActiveTab('planner')}><span>📅</span> <span>Menu Planner</span></div>
          <div className={`nav-item ${activeTab === 'rewards' ? 'active' : ''}`} onClick={() => setActiveTab('rewards')}><span>🎁</span> <span>Student Rewards</span></div>
          <div className={`nav-item ${activeTab === 'config' ? 'active' : ''}`} onClick={() => setActiveTab('config')}><span>⚙️</span> <span>System Config</span></div>
        </nav>
        <div className="nav-item" onClick={onLogout} style={{marginTop: 'auto', color: 'var(--danger)'}}><span>🚪</span> <span>Sign Out</span></div>
      </aside>

      <main className="dash-main">
        <header className="dash-topbar">
          <div className="topbar-search"><span className="user-badge-box">🔍 Live Data Entry: Enabled</span></div>
          <div className="topbar-user"><div className="user-badge-box"><span>Administrator</span><span style={{color: 'var(--success)', fontSize: '0.7rem'}}>● LIVE</span></div></div>
        </header>

        <div className="dash-view">
          <AnimatePresence mode="wait">
            
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <motion.div key="overview" initial={{opacity:0, x:-10}} animate={{opacity:1, x:0}} exit={{opacity:0, x:10}}>
                <div className="kpi-row">
                  <div className="premium-kpi"><span className="kpi-label">Total Mess Waste</span><div className="kpi-val"><AnimatedNumber value={totalWaste / 1000} decimals={2} suffix=" kg" /></div></div>
                  <div className="premium-kpi"><span className="kpi-label">Captured Readings</span><div className="kpi-val"><AnimatedNumber value={data.records.length} /></div></div>
                  <div className="premium-kpi"><span className="kpi-label">System Alerts</span><div className="kpi-val"><AnimatedNumber value={data.alerts.length} /></div></div>
                </div>
                <div className="content-grid">
                  <div style={{display:'flex', flexDirection:'column', gap:'2.5rem'}}>
                    <div className="p-card" style={{borderLeft:'6px solid var(--primary)'}}>
                      <div className="p-card-title">✨ AI Advisor</div>
                      <div style={{marginTop:'1rem', padding:'1.5rem', border:'2px solid var(--border-light)', borderRadius:12, background:'#fffcf5'}}>
                        <p style={{fontWeight:600}}>{data.ai_recommendation || "Analyzing data..."}</p>
                      </div>
                    </div>
                    <div className="p-card">
                      <div className="p-card-title">📈 Waste Trend</div>
                      <div className="chart-box-outline">
                        <div style={{height:300, width:'100%'}}>
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                              <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2}/><stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/></linearGradient></defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip />
                              <Area type="monotone" dataKey="weight" stroke="var(--primary)" fill="url(#g)" strokeWidth={3} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-card">
                    <div className="p-card-title">🔔 Activity</div>
                    <div style={{maxHeight:'500px', overflowY:'auto'}}>
                      {data.alerts.slice(-5).reverse().map((a, i) => (
                        <div key={i} className="p-alert"><p style={{fontWeight:700}}>{a.message}</p></div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* MESS MONITORING TAB - Now with Input Form */}
            {activeTab === 'mess' && (
              <motion.div key="mess" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{display:'flex', flexDirection:'column', gap:'2.5rem'}}>
                {/* Manual Data Entry Box */}
                <div className="p-card" style={{borderBottom: '4px solid var(--primary)'}}>
                  <div className="p-card-title">✍️ Manual Waste Input</div>
                  <form onSubmit={handleManualSubmit} style={{display: 'flex', gap: '2rem', alignItems: 'flex-end'}}>
                    <div style={{flex: 1}}>
                      <label style={{display:'block', fontSize:'0.7rem', fontWeight:800, marginBottom:'0.5rem'}}>SELECT STAPLE</label>
                      <select className="p-select" style={{marginBottom: 0}} value={manualFood} onChange={(e)=>setManualFood(e.target.value)}>
                        <option value="Rice">Rice</option>
                        <option value="Dal">Dal</option>
                        <option value="Chapati">Chapati</option>
                        <option value="Paneer">Paneer</option>
                      </select>
                    </div>
                    <div style={{flex: 1}}>
                      <label style={{display:'block', fontSize:'0.7rem', fontWeight:800, marginBottom:'0.5rem'}}>WASTE WEIGHT (GRAMS)</label>
                      <input 
                        className="p-select" 
                        style={{marginBottom: 0}} 
                        type="number" 
                        placeholder="e.g. 250" 
                        value={manualWeight}
                        onChange={(e)=>setManualWeight(e.target.value)}
                        required
                      />
                    </div>
                    <button type="submit" className="redeem-btn active" style={{height:'50px', padding:'0 2rem'}}>LOG WASTE ENTRY</button>
                  </form>
                  {inputStatus && <div style={{marginTop:'1rem', color: inputStatus.type === 'success' ? 'var(--success)' : 'var(--danger)', fontWeight:800}}>{inputStatus.message}</div>}
                </div>

                <div className="p-card">
                  <div className="p-card-title">🍴 Live Food Logs</div>
                  <div style={{border:'2px solid var(--border-light)', borderRadius:12, overflow:'hidden'}}>
                    <table className="p-table" style={{margin:0}}>
                      <thead><tr style={{background:'#f8fafc'}}><th>TIME</th><th>FOOD</th><th>WEIGHT</th><th>STATUS</th></tr></thead>
                      <tbody>
                        {data.records.slice().reverse().map((r, i) => (
                          <tr key={i}><td>{new Date(r.timestamp).toLocaleTimeString()}</td><td>{r.classified_food}</td><td>{r.weight_grams}g</td><td>{r.weight_grams > 300 ? '🔴 HIGH' : '🟢 OK'}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* MENU PLANNER TAB */}
            {activeTab === 'planner' && (
              <motion.div key="planner" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{display:'flex', flexDirection:'column', gap:'2.5rem'}}>
                <div className="p-card" style={{borderLeft:'8px solid var(--primary)', background:'#fffef5'}}>
                  <div className="p-card-title">🤖 AI Optimization</div>
                  <p style={{fontSize:'1.1rem', fontWeight:700, color:'var(--primary-border)'}}>"Highest waste: <strong>{topWasteItem?.name}</strong>. Adjust portions accordingly."</p>
                </div>
                <div style={{display:'grid', gridTemplateColumns:'7fr 5fr', gap:'2.5rem'}}>
                   <div className="p-card">
                      <div className="p-card-title">🗓️ Core Menu</div>
                      <div style={{border:'2px solid var(--border-strong)', borderRadius:12, overflow:'hidden'}}>
                         <table className="p-table" style={{margin:0}}>
                            <thead><tr style={{background:'var(--border-strong)', color:'white'}}><th>DAY</th><th>LUNCH</th><th>DINNER</th><th>ACTION</th></tr></thead>
                            <tbody>
                               {Object.keys(initialMenu).map((day, i) => (
                                 <tr key={i}><td>{day.substring(0,3)}</td><td>{initialMenu[day].lunch}</td><td>{initialMenu[day].dinner}</td><td>{topWasteItem?.name === 'Rice' && initialMenu[day].lunch.includes('Rice') ? 'REDUCE' : 'OPTIMAL'}</td></tr>
                               ))}
                            </tbody>
                         </table>
                      </div>
                   </div>
                   <div className="p-card">
                      <div className="p-card-title">📊 Waste Heatmap</div>
                      <div style={{height:300}}><ResponsiveContainer width="100%" height="100%"><BarChart data={patterns}><XAxis dataKey="name" /><YAxis /><Bar dataKey="avgWaste" fill="var(--primary)" radius={[6,6,0,0]} /></BarChart></ResponsiveContainer></div>
                   </div>
                </div>
              </motion.div>
            )}

            {/* REWARDS TAB */}
            {activeTab === 'rewards' && (
              <motion.div key="rewards" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'2.5rem'}}>
                <div className="p-card">
                  <div className="p-card-title">🏆 Leaderboard</div>
                  <table className="p-table">
                    <thead><tr><th>RANK</th><th>NAME</th><th>PTS</th></tr></thead>
                    <tbody>
                      {students.sort((a,b) => b.points - a.points).slice(0, 8).map((s, i) => (
                        <tr key={s.id}><td>#{i+1}</td><td>{s.name}</td><td>{s.points}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-card">
                  <div className="p-card-title">🎁 Redemption</div>
                  <select className="p-select" value={selectedStudent} onChange={(e)=>setSelectedStudent(e.target.value)}>
                    <option value="">Select Student...</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.points}p)</option>)}
                  </select>
                  <div className="redemption-grid">
                    {snacks.map(snack => {
                      const s = students.find(x => x.id === selectedStudent);
                      const can = s && s.points >= snack.cost_in_points;
                      return <button key={snack.id} disabled={!can} onClick={()=>handleRedeem(snack.id)} className="redeem-btn">{snack.name}</button>;
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* CONFIG TAB */}
            {activeTab === 'config' && (
              <motion.div key="config" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="p-card" style={{textAlign:'center', padding:'5rem'}}>
                <div style={{fontSize:'3rem', marginBottom:'1rem'}}>⚙️</div>
                <h3 style={{fontWeight:800}}>System Settings</h3>
                <p style={{color:'var(--text-muted)'}}>Restricted to Root Admin.</p>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;
