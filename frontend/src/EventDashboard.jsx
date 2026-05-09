import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, MapPin, Calendar, Info, Users, Upload, Send, Trophy, X, ChevronRight, Cpu, Zap, Shield } from 'lucide-react';

const EventDashboard = () => {
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [daysRemaining, setDaysRemaining] = useState(0);
    const [formData, setFormData] = useState({
        teamName: "",
        teamMembers: "",
        transactionId: ""
    });

    useEffect(() => {
        const calculateDays = () => {
            const eventDate = new Date('2027-03-05');
            const diff = eventDate.getTime() - new Date().getTime();
            const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
            setDaysRemaining(days > 0 ? days : 0);
        };
        calculateDays();

        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const [file, setFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchEvents = async () => {
            const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
            try {
                // Use a relative path to leverage Vercel's rewrites correctly
                const res = await axios.get("/api/events");
                console.log("Raw events from server:", res.data);
                if (Array.isArray(res.data)) {
                    setEvents(res.data);
                } else {
                    console.error("Expected array but got:", typeof res.data);
                    setEvents([]);
                }
            } catch (err) {
                console.error("Fetch error:", err);
                setEvents([]);
            }
        };
        fetchEvents();
    }, []);

    const handleRegister = async (e) => {
        e.preventDefault();
        const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const token = localStorage.getItem("token");
        if (!token) {
            alert("Please login first to register for an event.");
            return navigate("/register");
        }

        setSubmitting(true);
        const submitData = new FormData();
        submitData.append("eventId", selectedEvent._id);
        submitData.append("teamName", formData.teamName);
        submitData.append("teamMembers", formData.teamMembers);
        submitData.append("transactionId", formData.transactionId);
        if (file) submitData.append("paymentProof", file);

        try {
            await axios.post(`${API_BASE}/api/events/register-participation`, submitData, {
                headers: { 
                    "Content-Type": "multipart/form-data",
                    "x-auth-token": token
                }
            });
            alert("Registration request submitted successfully!");
            setSelectedEvent(null);
            setFormData({ teamName: "", teamMembers: "", transactionId: "" });
            setFile(null);
        } catch (err) {
            console.error("Registration error:", err.response?.data || err.message);
            alert(`Failed: ${err.response?.data?.msg || "Server Error"}`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ position: 'relative' }}>
            {/* Dashboard Navigation */}
            <nav style={{ position: 'fixed', top: 0, width: '100%', padding: '1.5rem 2rem', zIndex: 100, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(5, 7, 10, 0.8)', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--card-border)' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-primary)', letterSpacing: '2px' }}>ORION 2K26</div>
                {/* <div style={{ display: 'flex', gap: '2rem' }}>
                   <button onClick={() => navigate('/register')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', letterSpacing: '1px' }}>LOGIN / SYNC</button>
                    <button style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', letterSpacing: '1px' }} onClick={() => document.getElementById('events').scrollIntoView({ behavior: 'smooth' })}>PROTOCOLS</button>
                    <button onClick={() => navigate('/admin-login')} style={{ border: '1px solid var(--accent-secondary)', padding: '0.4rem 1rem', borderRadius: '8px', color: 'var(--accent-secondary)', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}>ADMIN ACCESS</button>
                </div>  */}
            </nav>

            {/* Hero Section */}
            <div style={{ height: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '120%', height: '120%', zIndex: -1, background: 'radial-gradient(circle at center, rgba(0, 210, 255, 0.05) 0%, transparent 70%)' }}></div>
                <h2 style={{ 
                    color: '#fff', 
                    fontSize: '1.4rem', 
                    fontWeight: 900, 
                    textTransform: 'uppercase', 
                    letterSpacing: '5px', 
                    marginBottom: '0.5rem',
                    textShadow: '0 0 20px rgba(0, 210, 255, 0.4)'
                }}>
                    KONGU ENGINEERING COLLEGE
                </h2>
                <h3 style={{ 
                    color: 'var(--accent-primary)', 
                    fontSize: '1.1rem', 
                    fontWeight: 800, 
                    textTransform: 'uppercase', 
                    letterSpacing: '3px', 
                    marginBottom: '2.5rem',
                    background: 'rgba(0, 210, 255, 0.1)',
                    padding: '5px 20px',
                    borderRadius: '4px',
                    border: '1px solid rgba(0, 210, 255, 0.2)'
                }}>
                    DEPARTMENT OF COMPUTER APPLICATIONS (MCA)
                </h3>
                <h1 className="hero-title">ORION 2K26</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.5rem', fontWeight: 300, letterSpacing: '8px', marginBottom: '1rem' }}>
                    TRANSFORM YOURSELF
                </p>
                
                {/* Running Clock */}
                <div style={{ 
                    color: 'white', 
                    fontSize: '2rem', 
                    fontWeight: 800, 
                    letterSpacing: '4px', 
                    marginBottom: '1rem',
                    fontFamily: 'monospace',
                    textShadow: '0 0 15px rgba(255, 255, 255, 0.3)'
                }}>
                    {currentTime.toLocaleTimeString([], { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>

                {/* Days to Go */}
                {daysRemaining > 0 && (
                    <div style={{ 
                        background: 'linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)', 
                        padding: '10px 25px', 
                        borderRadius: '50px', 
                        color: 'white', 
                        fontWeight: 900, 
                        fontSize: '1rem', 
                        letterSpacing: '2px', 
                        marginBottom: '2rem',
                        boxShadow: '0 10px 30px rgba(0, 210, 255, 0.3)',
                        textTransform: 'uppercase'
                    }}>
                        {daysRemaining} DAYS TO GO
                    </div>
                )}

                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                  <div style={{ height: '1px', width: '50px', background: 'var(--accent-primary)' }}></div>
                  <span style={{ fontSize: '1.1rem', letterSpacing: '2px', fontWeight: 600 }}>MARCH 5, 2027</span>
                  <div style={{ height: '1px', width: '50px', background: 'var(--accent-primary)' }}></div>
                </div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1, duration: 1, repeat: Infinity, repeatType: "reverse" }}
                    style={{ position: 'absolute', bottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
                    onClick={() => document.getElementById('events').scrollIntoView({ behavior: 'smooth' })}
                >
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', letterSpacing: '2px' }}>SCROLL TO EXPLORE</span>
                    <div style={{ width: '2px', height: '40px', background: 'linear-gradient(to bottom, var(--accent-primary), transparent)' }}></div>
                </motion.div>
            </div>

            {/* Content Section */}
            <div className="container" id="events" style={{ minHeight: '100vh', paddingBottom: '100px' }}>
                
                {/* About Orion Section */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    style={{ marginBottom: '5rem', background: 'rgba(255, 255, 255, 0.02)', padding: '4rem 3rem', borderRadius: '32px', border: '1px solid rgba(255, 255, 255, 0.08)', position: 'relative', overflow: 'hidden' }}
                >
                    <div style={{ position: 'absolute', top: 0, right: 0, padding: '1rem', background: 'var(--accent-primary)', color: 'black', fontSize: '0.7rem', fontWeight: 900, borderBottomLeftRadius: '20px', letterSpacing: '2px' }}>ESTD. 2027</div>
                    
                    {/* Animated Background Glow */}
                    <motion.div 
                        animate={{ 
                            opacity: [0.1, 0.3, 0.1],
                            scale: [1, 1.2, 1]
                        }}
                        transition={{ duration: 8, repeat: Infinity }}
                        style={{ position: 'absolute', top: '-20%', left: '-10%', width: '40%', height: '80%', background: 'radial-gradient(circle, var(--accent-primary) 0%, transparent 70%)', filter: 'blur(80px)', zIndex: -1 }}
                    />

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3rem', alignItems: 'center' }}>
                        <div style={{ flex: '1 1 400px' }}>
                            <motion.h2 
                                initial={{ x: -50, opacity: 0 }}
                                whileInView={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                style={{ color: 'white', fontSize: '2.5rem', fontWeight: 900, marginBottom: '1.5rem', letterSpacing: '2px' }}
                            >
                                ABOUT <span style={{ color: 'var(--accent-primary)' }}>ORION 2027</span>
                            </motion.h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: '1.8', marginBottom: '2rem', textAlign: 'justify' }}>
                                ORION is the flagship technical symposium organized by the Department of Computer Applications (MCA) at Kongu Engineering College. 
                                Designed as a battlefield for technology enthusiasts, Orion 2027 brings together the brightest minds to compete, collaborate, and innovate. 
                            </p>
                            <div style={{ display: 'flex', gap: '2rem' }}>
                                {[
                                    { label: 'Technical Events', value: '15+' },
                                    { label: 'Operatives', value: '1000+' },
                                    { label: 'Prize Pool', value: '₹50K+' }
                                ].map((stat, i) => (
                                    <React.Fragment key={i}>
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.4 + (i * 0.1) }}
                                        >
                                            <div style={{ color: 'var(--accent-primary)', fontSize: '1.8rem', fontWeight: 900 }}>{stat.value}</div>
                                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{stat.label}</div>
                                        </motion.div>
                                        {i < 2 && <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }}></div>}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                        
                        <div style={{ flex: '1 1 300px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            {[
                                { icon: <Trophy size={24} />, label: 'EXCELLENCE', color: 'var(--accent-primary)' },
                                { icon: <Cpu size={24} />, label: 'INNOVATION', color: '#ff4080' },
                                { icon: <Zap size={24} />, label: 'SPEED', color: 'white' },
                                { icon: <Shield size={24} />, label: 'INTEGRITY', color: 'var(--accent-primary)' }
                            ].map((card, i) => (
                                <motion.div 
                                    key={i}
                                    className="glass-card" 
                                    whileHover={{ scale: 1.05, y: -5, boxShadow: `0 10px 30px rgba(0, 210, 255, 0.2)` }}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.6 + (i * 0.1) }}
                                    style={{ padding: '1.5rem', textAlign: 'center', border: `1px solid ${card.color}33`, cursor: 'pointer' }}
                                >
                                    <div style={{ color: card.color, marginBottom: '0.5rem' }}>{card.icon}</div>
                                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'white' }}>{card.label}</div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* General Protocols Section */}
                <div style={{ marginBottom: '5rem', background: 'rgba(255, 255, 255, 0.02)', padding: '4rem 3rem', borderRadius: '32px', border: '1px solid rgba(255, 255, 255, 0.08)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '3rem' }}>
                        <div style={{ height: '2px', width: '60px', background: 'linear-gradient(to left, var(--accent-primary), transparent)' }}></div>
                        <h2 style={{ color: 'var(--accent-primary)', fontSize: '1.8rem', fontWeight: 800, letterSpacing: '6px', margin: 0, textAlign: 'center', textTransform: 'uppercase' }}>GENERAL PROTOCOLS</h2>
                        <div style={{ height: '2px', width: '60px', background: 'linear-gradient(to right, var(--accent-primary), transparent)' }}></div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2.5rem' }}>
                        <div className="glass-card" style={{ padding: '1.5rem', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                            <div style={{ color: 'var(--accent-primary)', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}><Users size={32} /></div>
                            <h4 style={{ color: 'white', marginBottom: '0.8rem', fontWeight: 700, fontSize: '0.9rem', letterSpacing: '1px' }}>INITIALIZE</h4>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: '1.5' }}>Create your Neural Profile (Account) to access all event registration modules.</p>
                        </div>
                        <div className="glass-card" style={{ padding: '1.5rem', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                            <div style={{ color: 'var(--accent-primary)', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}><Ticket size={32} /></div>
                            <h4 style={{ color: 'white', marginBottom: '0.8rem', fontWeight: 700, fontSize: '0.9rem', letterSpacing: '1px' }}>BASE FEE</h4>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: '1.5' }}>Pay a one-time ₹200 fee for the first event; all subsequent events are FREE.</p>
                        </div>
                        <div className="glass-card" style={{ padding: '1.5rem', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                            <div style={{ color: 'var(--accent-primary)', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}><Upload size={32} /></div>
                            <h4 style={{ color: 'white', marginBottom: '0.8rem', fontWeight: 700, fontSize: '0.9rem', letterSpacing: '1px' }}>AUTO SCAN</h4>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: '1.5' }}>Upload your payment screenshot; our AI extracts the Transaction ID instantly.</p>
                        </div>
                        <div className="glass-card" style={{ padding: '1.5rem', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                            <div style={{ color: 'var(--accent-primary)', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}><Trophy size={32} /></div>
                            <h4 style={{ color: 'white', marginBottom: '0.8rem', fontWeight: 700, fontSize: '0.9rem', letterSpacing: '1px' }}>CERTIFICATION</h4>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: '1.5' }}>Download your participation certificate from the Vault (Dashboard) after the event.</p>
                        </div>
                    </div>

                    <div style={{ marginTop: '3rem', padding: '1.5rem 2rem', borderRadius: '16px', background: 'rgba(255, 64, 128, 0.08)', border: '1px solid rgba(255, 64, 128, 0.3)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            <div style={{ background: '#ff4080', color: 'white', padding: '8px 16px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase' }}>Limit Notice</div>
                            <p style={{ color: '#ffecf1', fontWeight: 600, fontSize: '0.95rem', margin: 0, letterSpacing: '0.5px' }}>
                                One operative can participate in a <span style={{ color: '#ff4080', fontWeight: 900, textDecoration: 'underline' }}>MAXIMUM of 2</span> events.
                            </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            <div style={{ background: 'var(--accent-primary)', color: 'black', padding: '8px 16px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase' }}>Attention</div>
                            <p style={{ color: 'white', fontWeight: 600, fontSize: '0.95rem', margin: 0, letterSpacing: '0.5px' }}>
                                Constantly check your <span style={{ color: 'var(--accent-primary)' }}>Mail ID</span> and <span style={{ color: 'var(--accent-primary)' }}>Account Profile</span> for status updates and event credentials.
                            </p>
                        </div>
                    </div>
                </div>

                <pre style={{ color: 'white', fontSize: '0.6rem' }}>DEBUG: Found {events.length} total events</pre>
                {/* Technical Events Section */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '5rem' }}>
                    <div className="glass-card" style={{ padding: '0.8rem 2rem', borderRadius: '50px', border: '1px solid var(--accent-primary)' }}>
                        <span style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '4px' }}>TECHNICAL COMPETITIONS</span>
                    </div>
                </div>
                
                <div className="event-grid" style={{ 
                    marginBottom: '10rem',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))',
                    gap: '2rem',
                    padding: '0 10px'
                }}>
                    {events.filter(e => e.category === 'technical' || !e.category).length > 0 ? (
                        events.filter(e => e.category === 'technical' || !e.category).map((event, index) => (
                            <motion.div 
                                key={event._id} 
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1, duration: 0.5 }}
                                whileHover={{ 
                                    scale: 1.05, 
                                    y: -10,
                                    rotateX: 2,
                                    rotateY: -2,
                                    boxShadow: '0 25px 50px -12px rgba(0, 210, 255, 0.4)'
                                }}
                                whileTap={{ scale: 0.98 }}
                                className="glass-card event-card" 
                                style={{ 
                                    transition: 'all 0.1s ease', 
                                    perspective: '1000px',
                                    transformStyle: 'preserve-3d'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>

                                    <h2 style={{ color: 'var(--accent-primary)', margin: 0, fontSize: '1.8rem', fontWeight: 700 }}>{event.name}</h2>
                                    <span style={{ padding: '4px 12px', borderRadius: '8px', border: '1px solid var(--accent-secondary)', fontSize: '0.7rem', fontWeight: 800, color: '#fff' }}>
                                        {event.type.toUpperCase()}
                                    </span>
                                </div>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <p className="line-clamp-4" style={{ color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0, textAlign: 'justify' }}>
                                        {event.description}
                                    </p>
                                    <button 
                                        onClick={() => navigate(`/event/${event._id}`)}
                                        style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', padding: 0, marginTop: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                                    >
                                        READ MORE <ChevronRight size={14} />
                                    </button>
                                </div>
                                
                                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                                        <MapPin size={16} color="var(--accent-secondary)" /> {event.venue}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                                        <Ticket size={16} color="var(--accent-secondary)" /> ₹{event.registrationFee}
                                    </div>
                                </div>

                                <motion.button 
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => navigate(`/event/${event._id}`)} 
                                    className="btn-glow" 
                                    style={{ width: '100%', textAlign: 'center', cursor: 'pointer', border: 'none', display: 'block', padding: '0.8rem' }}
                                >
                                    GET STARTED
                                </motion.button>
                            </motion.div>
                        ))
                    ) : (
                        <div style={{ textAlign: 'center', gridColumn: '1/-1', opacity: 0.5 }}>
                            Initializing technical matrix...
                        </div>
                    )}
                </div>

                {/* Cultural Events Section */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '5rem' }}>
                    <div className="glass-card" style={{ padding: '0.8rem 2rem', borderRadius: '50px', border: '1px solid #ff007f' }}>
                        <span style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '4px', color: '#ff007f' }}>NON-TECHNICAL / CULTURAL</span>
                    </div>
                </div>

                <div className="event-grid" style={{ 
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))',
                    gap: '2rem',
                    padding: '0 10px'
                }}>
                    {events.filter(e => e.category === 'cultural').length > 0 ? (
                        events.filter(e => e.category === 'cultural').map((event, index) => (
                            <motion.div 
                                key={event._id} 
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
                                whileHover={{ 
                                    scale: 1.05, 
                                    boxShadow: '0 25px 50px -12px rgba(255, 0, 127, 0.4)',
                                    skewX: -1
                                }}
                                whileTap={{ scale: 0.98 }}
                                className="glass-card event-card" 
                                style={{ transition: 'all 0.1s ease' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>

                                    <h2 style={{ color: '#ff007f', margin: 0, fontSize: '1.8rem', fontWeight: 700 }}>{event.name}</h2>
                                    <span style={{ padding: '4px 12px', borderRadius: '8px', border: '1px solid #ff007f', fontSize: '0.7rem', fontWeight: 800 }}>
                                        CULTURAL
                                    </span>
                                </div>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <p className="line-clamp-4" style={{ color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0, textAlign: 'justify' }}>
                                        {event.description}
                                    </p>
                                    <button 
                                        onClick={() => navigate(`/event/${event._id}`)}
                                        style={{ background: 'none', border: 'none', color: '#ff007f', padding: 0, marginTop: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                                    >
                                        READ MORE <ChevronRight size={14} />
                                    </button>
                                </div>
                                
                                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                                        <MapPin size={16} color="#ff007f" /> {event.venue}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                                        <Ticket size={16} color="#ff007f" /> ₹{event.registrationFee}
                                    </div>
                                </div>

                                <motion.button 
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => navigate(`/event/${event._id}`)} 
                                    className="btn-glow" 
                                    style={{ width: '100%', textAlign: 'center', cursor: 'pointer', border: 'none', display: 'block', padding: '0.8rem', background: 'linear-gradient(135deg, #ff007f 0%, #3a7bd5 100%)' }}
                                >
                                    GET STARTED
                                </motion.button>
                            </motion.div>
                        ))
                    ) : (
                        <div style={{ textAlign: 'center', gridColumn: '1/-1', opacity: 0.5 }}>
                            Initializing cultural matrix...
                        </div>
                    )}
                </div>
            </div>

            {/* Registration Overlay Modal */}
            {selectedEvent && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
                    <div className="glass-card" style={{ maxWidth: '1000px', width: '100%', position: 'relative', display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(300px, 0.8fr)', gap: '2rem', padding: '3rem', maxHeight: '90vh', overflowY: 'auto' }}>
                        <button onClick={() => setSelectedEvent(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer' }}><X size={24}/></button>
                        
                        <div>
                            <h1 className="hero-title" style={{ fontSize: '2.5rem', marginBottom: '1rem', textAlign: 'left', WebkitTextStroke: '1.5px var(--accent-primary)' }}>{selectedEvent.name}</h1>
                            <div style={{ padding: '4px 12px', borderRadius: '4px', background: 'var(--accent-primary)', color: '#000', display: 'inline-block', fontSize: '0.7rem', fontWeight: 900, marginBottom: '2rem', letterSpacing: '2px' }}>
                                {selectedEvent.type.toUpperCase()} MODULE
                            </div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: '1.7', marginBottom: '2rem' }}>{selectedEvent.description}</p>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                    <span style={{ opacity: 0.4, fontSize: '0.6rem', letterSpacing: '1px' }}>VENUE</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}><MapPin size={14} /> {selectedEvent.venue}</div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                    <span style={{ opacity: 0.4, fontSize: '0.6rem', letterSpacing: '1px' }}>ENTRY FEE</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}><Ticket size={14} /> ₹{selectedEvent.registrationFee}</div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                    <span style={{ opacity: 0.4, fontSize: '0.6rem', letterSpacing: '1px' }}>REWARD</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#ffcc33' }}><Trophy size={14} /> CERTIFICATE</div>
                                </div>
                            </div>
                        </div>

                        <div style={{ borderLeft: '2px solid rgba(0, 210, 255, 0.2)', paddingLeft: '2.5rem' }}>
                            <h3 style={{ margin: '0 0 1.5rem 0', letterSpacing: '4px', fontWeight: 800, fontSize: '1rem', color: 'var(--accent-primary)', textTransform: 'uppercase' }}>REGISTRATION</h3>
                            
                            <div style={{ 
                                background: 'linear-gradient(135deg, rgba(255, 64, 128, 0.1) 0%, rgba(255, 64, 128, 0.02) 100%)', 
                                padding: '1.5rem', 
                                borderRadius: '16px', 
                                marginBottom: '2rem', 
                                border: '1px solid rgba(255, 64, 128, 0.3)',
                                boxShadow: '0 10px 20px rgba(0,0,0,0.3)'
                            }}>
                                <p style={{ color: 'var(--accent-secondary)', fontSize: '0.75rem', fontWeight: 700, margin: '0 0 1rem 0', textTransform: 'uppercase', letterSpacing: '2px', borderBottom: '1px solid rgba(255, 64, 128, 0.2)', paddingBottom: '0.5rem' }}>
                                    📢 CORE INSTRUCTIONS
                                </p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                    <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-start' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff4080', marginTop: '4px' }}></div>
                                        <p style={{ color: '#ffecf1', fontSize: '0.75rem', margin: 0, lineHeight: '1.4' }}>
                                            <strong style={{ color: 'white' }}>TEAM LEADER:</strong> Only the team leader must register for the entire squad.
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-start' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff4080', marginTop: '4px' }}></div>
                                        <p style={{ color: '#ffecf1', fontSize: '0.75rem', margin: 0, lineHeight: '1.4' }}>
                                            <strong style={{ color: 'white' }}>FEE STRUCTURE:</strong> ₹200 per person. (Example: 3 members = <span style={{ color: '#ff4080', fontWeight: 900 }}>₹600</span>).
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-start' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff4080', marginTop: '4px' }}></div>
                                        <p style={{ color: '#ffecf1', fontSize: '0.75rem', margin: 0, lineHeight: '1.4' }}>
                                            <strong style={{ color: 'white' }}>MAX 2 EVENTS:</strong> Participation limited to 2 modules per person.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {selectedEvent.type === "team" && (
                                    <>
                                        <div>
                                            <label style={{ fontSize: "0.6rem", opacity: 0.5, marginBottom: "0.4rem", display: "block", letterSpacing: "1px" }}>TEAM NAME</label>
                                            <input className="input-cyber" style={{ padding: '0.6rem' }} type="text" required placeholder="OMEGA SQUAD" onChange={(e) => setFormData({...formData, teamName: e.target.value})} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: "0.6rem", opacity: 0.5, marginBottom: "0.4rem", display: "block", letterSpacing: "1px" }}>TEAM MEMBERS</label>
                                            <textarea className="input-cyber" style={{ padding: '0.6rem' }} rows="2" placeholder="Alice, Bob..." onChange={(e) => setFormData({...formData, teamMembers: e.target.value})} />
                                        </div>
                                    </>
                                )}
                                <div>
                                    <label style={{ fontSize: "0.6rem", opacity: 0.5, marginBottom: "0.4rem", display: "block", letterSpacing: "1px" }}>TRANSACTION ID</label>
                                    <input className="input-cyber" style={{ padding: '0.6rem' }} type="text" required placeholder="TXN123..." onChange={(e) => setFormData({...formData, transactionId: e.target.value})} />
                                </div>
                                <div>
                                    <label style={{ fontSize: "0.6rem", opacity: 0.5, marginBottom: "0.4rem", display: "block", letterSpacing: "1px" }}>PAYMENT PROOF (SCREENSHOT)</label>
                                    <input type="file" required className="input-cyber" style={{ padding: "0.4rem", fontSize: '0.7rem' }} onChange={(e) => setFile(e.target.files[0])} />
                                </div>
                                <button type="submit" className="btn-glow" style={{ width: "100%", marginTop: "0.5rem", padding: '1rem', borderRadius: '12px' }} disabled={submitting}>
                                    {submitting ? "UPLOADING PROTOCOL..." : "COMPLETE REGISTRATION"}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            
            <footer style={{ padding: '6rem 0', textAlign: 'center', background: 'linear-gradient(to top, #000, transparent)' }}>
                <p style={{ color: 'var(--accent-primary)', letterSpacing: '8px', fontSize: '0.8rem', fontWeight: 800, marginBottom: '1rem' }}>SYSTEM ONLINE</p>
                <p style={{ color: 'var(--text-secondary)', letterSpacing: '2px', fontSize: '0.7rem' }}>© 2026 KONGU ENGINEERING COLLEGE - MCA | ORION 2K26</p>
            </footer>
        </div>
    );
};

export default EventDashboard;