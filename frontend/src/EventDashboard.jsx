import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, MapPin, Calendar, Info, Users, Upload, Send, Trophy, X, ChevronRight } from 'lucide-react';

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
            <nav className="fixed top-0 w-full px-4 md:px-8 py-4 z-[100] flex flex-col md:flex-row justify-between items-center bg-[rgba(5,7,10,0.8)] backdrop-blur-md border-b border-[var(--card-border)]">
                <div className="text-xl md:text-2xl font-black text-[var(--accent-primary)] tracking-widest mb-4 md:mb-0">ORION 2K26</div>
                <div className="flex flex-wrap justify-center gap-4 md:gap-8">
                    <button onClick={() => navigate('/register')} className="bg-none border-none text-[var(--text-secondary)] text-[10px] md:text-xs font-semibold cursor-pointer tracking-widest uppercase">LOGIN / SYNC</button>
                    <button className="bg-none border-none text-[var(--text-primary)] text-[10px] md:text-xs font-semibold cursor-pointer tracking-widest uppercase" onClick={() => document.getElementById('events').scrollIntoView({ behavior: 'smooth' })}>PROTOCOLS</button>
                    <button onClick={() => navigate('/admin-login')} className="border border-[var(--accent-secondary)] px-4 py-1.5 rounded-lg text-[var(--accent-secondary)] text-[10px] md:text-xs font-extrabold cursor-pointer uppercase">ADMIN ACCESS</button>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="min-h-[90vh] md:h-[80vh] flex flex-col justify-center items-center relative overflow-hidden px-4 text-center">
                <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] z-[-1] bg-[radial-gradient(circle_at_center,rgba(0,210,255,0.05)_0%,transparent_70%)]"></div>
                <h2 className="text-white text-sm md:text-xl lg:text-2xl font-black uppercase tracking-[2px] md:tracking-[5px] mb-2 drop-shadow-[0_0_20px_rgba(0,210,255,0.4)]">
                    KONGU ENGINEERING COLLEGE
                </h2>
                <h3 className="text-[var(--accent-primary)] text-xs md:text-lg font-extrabold uppercase tracking-[1px] md:tracking-[3px] mb-6 md:mb-10 bg-[rgba(0,210,255,0.1)] px-4 md:px-6 py-2 rounded-md border border-[rgba(0,210,255,0.2)]">
                    DEPARTMENT OF COMPUTER APPLICATIONS (MCA)
                </h3>
                <h1 className="text-5xl md:text-7xl lg:text-9xl font-black mb-4 tracking-tighter bg-gradient-to-br from-[#00d2ff] to-[#3a7bd5] bg-clip-text text-transparent drop-shadow-2xl">ORION 2K26</h1>
                <p className="text-[var(--text-secondary)] text-sm md:text-xl lg:text-2xl font-light tracking-[4px] md:tracking-[8px] mb-6 md:mb-4 uppercase">
                    TRANSFORM YOURSELF
                </p>
                
                {/* Running Clock */}
                <div className="text-white text-2xl md:text-4xl font-bold tracking-[2px] md:tracking-[4px] mb-4 font-mono drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                    {currentTime.toLocaleTimeString([], { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>

                {/* Days to Go */}
                {daysRemaining > 0 && (
                    <div className="bg-gradient-to-r from-[#00d2ff] to-[#3a7bd5] px-6 md:px-8 py-2 md:py-3 rounded-full text-white font-black text-sm md:text-lg tracking-widest mb-8 shadow-[0_10px_30px_rgba(0,210,255,0.3)] uppercase">
                        {daysRemaining} DAYS TO GO
                    </div>
                )}

                <div className="flex items-center gap-4 md:gap-6">
                  <div className="h-[1px] w-8 md:w-12 bg-[var(--accent-primary)]"></div>
                  <span className="text-sm md:text-lg tracking-[2px] md:tracking-[4px] font-semibold text-white">MARCH 5, 2027</span>
                  <div className="h-[1px] w-8 md:w-12 bg-[var(--accent-primary)]"></div>
                </div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1, duration: 1, repeat: Infinity, repeatType: "reverse" }}
                    className="absolute bottom-8 flex flex-col items-center gap-2 cursor-pointer"
                    onClick={() => document.getElementById('events').scrollIntoView({ behavior: 'smooth' })}
                >
                    <span className="text-[10px] text-[var(--text-secondary)] tracking-widest uppercase">SCROLL TO EXPLORE</span>
                    <div className="w-[2px] h-10 bg-gradient-to-b from-[var(--accent-primary)] to-transparent"></div>
                </motion.div>
            </div>

            {/* Content Section */}
            <div className="container mx-auto px-4 py-16" id="events">
                
                {/* General Protocols Section */}
                <div className="mb-20 bg-[rgba(255,255,255,0.02)] p-6 md:p-12 rounded-[32px] border border-[rgba(255,255,255,0.08)] shadow-2xl">
                    <div className="flex items-center justify-center gap-4 mb-12">
                        <div className="hidden md:block h-[2px] w-16 bg-gradient-to-l from-[var(--accent-primary)] to-transparent"></div>
                        <h2 className="text-[var(--accent-primary)] text-xl md:text-3xl font-black tracking-[4px] md:tracking-[8px] text-center uppercase">GENERAL PROTOCOLS</h2>
                        <div className="hidden md:block h-[2px] w-16 bg-gradient-to-r from-[var(--accent-primary)] to-transparent"></div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10">
                        <div className="p-6 rounded-2xl border border-white/5 bg-white/5 text-center flex flex-col items-center">
                            <div className="text-[var(--accent-primary)] mb-4"><Users size={32} /></div>
                            <h4 className="text-white mb-2 font-bold text-sm tracking-wider uppercase">IDENTIFICATION</h4>
                            <p className="text-[var(--text-secondary)] text-xs leading-relaxed">Valid College ID Card is mandatory for base entry.</p>
                        </div>
                        <div className="p-6 rounded-2xl border border-white/5 bg-white/5 text-center flex flex-col items-center">
                            <div className="text-[var(--accent-primary)] mb-4"><Trophy size={32} /></div>
                            <h4 className="text-white mb-2 font-bold text-sm tracking-wider uppercase">DRESS CODE</h4>
                            <p className="text-[var(--text-secondary)] text-xs leading-relaxed">Formal attire is required for all operatives.</p>
                        </div>
                        <div className="p-6 rounded-2xl border border-white/5 bg-white/5 text-center flex flex-col items-center">
                            <div className="text-[var(--accent-primary)] mb-4"><Info size={32} /></div>
                            <h4 className="text-white mb-2 font-bold text-sm tracking-wider uppercase">JUDGEMENT</h4>
                            <p className="text-[var(--text-secondary)] text-xs leading-relaxed">The council's (Judges) decision is final and binding.</p>
                        </div>
                        <div className="p-6 rounded-2xl border border-white/5 bg-white/5 text-center flex flex-col items-center">
                            <div className="text-[var(--accent-primary)] mb-4"><Send size={32} /></div>
                            <h4 className="text-white mb-2 font-bold text-sm tracking-wider uppercase">DEVICE CONTROL</h4>
                            <p className="text-[var(--text-secondary)] text-xs leading-relaxed">Mobile usage restricted during technical operations.</p>
                        </div>
                    </div>

                    <div className="mt-12 p-4 md:p-6 rounded-2xl bg-[rgba(255,64,128,0.08)] border border-[rgba(255,64,128,0.3)] flex flex-col md:flex-row items-center gap-4 md:gap-6">
                        <div className="bg-[#ff4080] text-white px-4 py-2 rounded-lg text-xs font-black uppercase text-center">Limit Notice</div>
                        <p className="text-[#ffecf1] font-semibold text-sm md:text-base m-0 tracking-wide text-center md:text-left">
                            One operative can participate in a <span className="text-[#ff4080] font-black underline">MAXIMUM of 2</span> events.
                        </p>
                    </div>
                </div>

                <div className="flex justify-center mb-12">
                    <div className="px-8 py-3 rounded-full border border-[var(--accent-primary)] bg-[var(--accent-primary)]/10">
                        <span className="text-white text-sm md:text-lg font-black tracking-[4px] uppercase">TECHNICAL COMPETITIONS</span>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-40">
                    {events.filter(e => e.category === 'technical' || !e.category).length > 0 ? (
                        events.filter(e => e.category === 'technical' || !e.category).map((event, index) => (
                            <motion.div 
                                key={event._id} 
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1, duration: 0.5 }}
                                className="bg-[#161b22]/95 border border-[rgba(255,255,255,0.1)] p-6 rounded-3xl hover:border-[rgba(0,210,255,0.4)] transition-all shadow-xl flex flex-col h-full"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <h2 className="text-[var(--accent-primary)] text-2xl font-bold m-0 leading-tight">{event.name}</h2>
                                    <span className="px-3 py-1 rounded-lg border border-[var(--accent-secondary)] text-[10px] font-extrabold text-white uppercase whitespace-nowrap ml-2">
                                        {event.type.toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex-grow mb-6">
                                    <p className="text-[var(--text-secondary)] text-sm leading-relaxed text-justify line-clamp-4 m-0">
                                        {event.description}
                                    </p>
                                    <button 
                                        onClick={() => navigate(`/event/${event._id}`)}
                                        className="bg-none border-none text-[var(--accent-primary)] p-0 mt-4 cursor-pointer text-xs font-bold flex items-center gap-1 hover:underline"
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

                <div className="event-grid">
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