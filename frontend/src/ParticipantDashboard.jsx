import React, { useEffect, useState } from "react";
import axios from "axios";
import { Ticket, Calendar, CheckCircle, XCircle, Award, User, Building, Phone, Eye } from "lucide-react";
import CertificatePreview from "./CertificatePreview";

const ParticipantDashboard = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [previewData, setPreviewData] = useState(null);

    const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000"; // Centralized API address


    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    setLoading(false);
                    return;
                }
                const url = '/api/users/profile';
                console.log('FETCHING FROM: ' + url);
                const res = await axios.get(url, {
                    headers: { 'x-auth-token': token }
                });
                console.log("Profile data received:", res.data);
                setProfile(res.data);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching profile", err);
                setFetchError(err.response?.data?.msg || err.message);
                setProfile(null);
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    if (loading) return <div className="container hero-title" style={{ marginTop: "20vh" }}>LOADING PROFILE...</div>;

    if (!profile || !profile.user) return (
        <div className="container" style={{ textAlign: "center", padding: "100px 0" }}>
            <h1 className="hero-title">PROTOCOL ERROR</h1>
            <p style={{ color: "var(--text-secondary)" }}>{fetchError || "PLEASE LOGIN TO VIEW YOUR DASHBOARD"}</p>
            
            {/* Extended Debug Information */}
            <div style={{ padding: '20px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)', marginBottom: '20px', borderRadius: '12px', fontSize: '0.8rem', opacity: 0.8, color: '#aaa', textAlign: 'left', maxWidth: '500px', margin: '20px auto' }}>
                <b style={{color: 'var(--accent-primary)'}}>Diagnostics:</b><br/>
                • User Object: <code style={{color: '#fff'}}>{localStorage.getItem("user") || "NULL"}</code><br/>
                • Token State: <code style={{color: '#fff'}}>{localStorage.getItem("token") ? "STAGED" : "MISSING"}</code><br/>
                • Fetch Status: <code style={{color: '#fff'}}>{fetchError ? `Error: ${fetchError}` : "Empty Response"}</code>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button className="btn-glow" onClick={() => {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    window.location.href='/register';
                }} style={{ marginTop: "2rem" }}>BACK TO LOGIN</button>
            </div>
        </div>
    );

    return (
        <div className="container" style={{ padding: "60px 0" }}>
            <h1 className="hero-title" style={{ fontSize: "3.5rem", marginBottom: "3rem" }}>USER DASHBOARD</h1>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "2rem" }}>
                {/* Profile Info */}
                <div className="glass-card" style={{ height: "fit-content" }}>
                    <h3 style={{ color: "var(--accent-primary)", marginBottom: "1.5rem", letterSpacing: "2px" }}>PROFILE</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        <div>
                            <span style={{ opacity: 0.4, fontSize: "0.6rem" }}>NAME</span>
                            <div style={{ fontSize: "1.1rem", fontWeight: 700 }}>{profile?.user?.name}</div>
                        </div>
                        <div>
                            <span style={{ opacity: 0.4, fontSize: "0.6rem" }}>COLLEGE</span>
                            <div style={{ fontSize: "0.9rem" }}>{profile?.user?.college}</div>
                        </div>
                        <div>
                            <span style={{ opacity: 0.4, fontSize: "0.6rem" }}>EMAIL</span>
                            <div style={{ fontSize: "0.9rem" }}>{profile?.user?.email}</div>
                        </div>
                        {profile?.user?.rollNumber && (
                            <div style={{ marginTop: "1rem", padding: "12px", background: "rgba(0, 210, 255, 0.05)", border: "1px solid var(--accent-primary)", borderRadius: "8px", textAlign: "center" }}>
                                <span style={{ opacity: 0.4, fontSize: "0.6rem", letterSpacing: "2px", display: "block", marginBottom: "4px" }}>OFFICIAL REGISTER NUMBER</span>
                                <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "var(--accent-primary)", letterSpacing: "1px" }}>{profile.user.rollNumber}</div>
                            </div>
                        )}
                        {profile?.registeredEvents?.length > 0 && (
                            <div style={{ marginTop: "1.5rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
                                    <span style={{ opacity: 0.4, fontSize: "0.6rem", letterSpacing: "1px" }}>ACTIVE REGISTRATIONS</span>
                                    <span style={{ fontSize: "0.7rem", color: "#ffcc33", fontWeight: 900 }}>
                                        ₹{profile.registeredEvents.reduce((acc, curr) => acc + (curr.event?.registrationFee || 0), 0)} PAID
                                    </span>
                                </div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>
                                    {profile.registeredEvents.map(p => (
                                        <div key={p._id} style={{ background: "rgba(0,210,255,0.1)", border: "1px solid var(--accent-primary)", padding: "4px 8px", borderRadius: "4px", fontSize: "0.65rem", fontWeight: 800, color: "var(--accent-primary)" }}>
                                            {p.rollNumber || "ID-PENDING"}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Registered Events */}
                <div className="glass-card">
                    <h3 style={{ color: "var(--accent-primary)", marginBottom: "1.5rem", letterSpacing: "2px" }}>MY EVENTS & RESULTS</h3>
                    {profile?.registeredEvents?.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "3rem", opacity: 0.5 }}>NO EVENTS REGISTERED YET.</div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                            {profile.registeredEvents.map((p) => (
                                <div key={p._id} style={{ border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", padding: "1.5rem", background: "rgba(255,255,255,0.02)" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1rem" }}>
                                        <div>
                                            <div style={{ color: "var(--accent-primary)", fontWeight: 800, fontSize: "1.2rem" }}>{p.event?.name}</div>
                                            <div style={{ fontSize: "0.75rem", color: "var(--accent-secondary)", fontWeight: 700, marginTop: "4px" }}>REGISTER NO: {p.rollNumber || "N/A"}</div>
                                            <div style={{ fontSize: "0.7rem", opacity: 0.6 }}>ID: {p._id.slice(-8).toUpperCase()}</div>
                                        </div>
                                        <div style={{ 
                                            padding: "6px 12px", 
                                            borderRadius: "6px", 
                                            fontSize: "0.65rem", 
                                            fontWeight: 900, 
                                            background: p.paymentStatus === 'verified' ? "rgba(0,255,128,0.1)" : "rgba(255,64,128,0.1)",
                                            color: p.paymentStatus === 'verified' ? "#00ff80" : "#ff4080",
                                            border: `1px solid ${p.paymentStatus === 'verified' ? "#00ff80" : "#ff4080"}`
                                        }}>
                                            {p.paymentStatus.toUpperCase()}
                                        </div>
                                    </div>

                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                                        <div>
                                            <span style={{ opacity: 0.4, fontSize: "0.6rem", display: "block" }}>TEAM/DETAILS</span>
                                            <div style={{ fontSize: "0.85rem", color: "#fff" }}>{p.teamName || "Individual Participant"}</div>
                                            {p.teamMembersDetails?.length > 0 && (
                                                <div style={{ marginTop: "5px", fontSize: "0.75rem", opacity: 0.7 }}>
                                                    {p.teamMembersDetails.map(m => m.name).join(", ")}
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ textAlign: "right", padding: "10px", borderRadius: "8px", background: "rgba(0,0,0,0.3)" }}>
                                            <span style={{ opacity: 0.4, fontSize: "0.6rem", display: "block", marginBottom: "4px" }}>RESULT STATUS</span>
                                            {p.resultStatus !== "none" ? (
                                                <div>
                                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px", color: p.resultStatus.toLowerCase().includes('prize') ? "#00ff80" : "#ffcc33", fontWeight: 800, marginBottom: "8px" }}>
                                                        <Award size={18} /> {p.resultStatus.toUpperCase()}
                                                    </div>
                                                    {p.resultStatus === 'not shortlisted' && (
                                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '10px' }}>
                                                             <button
                                                                onClick={() => {
                                                                    setPreviewData({
                                                                        ...p,
                                                                        user: profile.user,
                                                                        event: p.event
                                                                    });
                                                                    setShowPreview(true);
                                                                }}
                                                                style={{
                                                                    background: "rgba(255,255,255,0.1)",
                                                                    color: "white",
                                                                    border: "1px solid rgba(255,255,255,0.2)",
                                                                    padding: "6px 10px",
                                                                    borderRadius: "6px",
                                                                    fontSize: "0.7rem",
                                                                    fontWeight: 700,
                                                                    cursor: "pointer",
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    gap: "5px"
                                                                }}
                                                            >
                                                                <Eye size={14} /> View
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    const token = localStorage.getItem('token');
                                                                    const timestamp = new Date().getTime();
                                                                    const downloadUrl = `${window.location.protocol}//${window.location.hostname}:5000/certificates/download/${p._id}?token=${token}&v=${timestamp}`;
                                                                    console.log('Attempting download from:', downloadUrl);
                                                                    window.open(downloadUrl, '_blank');
                                                                }}
                                                                style={{
                                                                    background: "linear-gradient(135deg, #BB00DB 0%, #3a7bd5 100%)",
                                                                    color: "white",
                                                                    border: "none",
                                                                    padding: "6px 12px",
                                                                    borderRadius: "6px",
                                                                    fontSize: "0.7rem",
                                                                    fontWeight: 700,
                                                                    cursor: "pointer",
                                                                    textTransform: "uppercase"
                                                                }}
                                                            >
                                                                Download
                                                            </button>
                                                        </div>
                                                    )}

                                                    {p.resultStatus.toLowerCase().includes('prize') && (
                                                        <div style={{ fontSize: '0.65rem', opacity: 0.6, color: '#00ff80' }}>
                                                            HARD COPY WILL BE PROVIDED
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div style={{ opacity: 0.3, fontSize: "0.8rem" }}>Pending</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            
            <CertificatePreview 
                isOpen={showPreview} 
                onClose={() => setShowPreview(false)} 
                data={previewData} 
            />
        </div>
    );
};


export default ParticipantDashboard;