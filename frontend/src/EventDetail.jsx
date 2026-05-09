import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { QRCodeSVG } from "qrcode.react";
import { motion } from "framer-motion";
import { Ticket, Calendar, MapPin, Users, Upload, Send, ChevronLeft, Trophy, Plus, X, Phone, User as UserIcon, Building, CreditCard } from "lucide-react";

const EventDetail = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [userPaid, setUserPaid] = useState(false);
    const [paymentVerified, setPaymentVerified] = useState(false);
    const [settings, setSettings] = useState({ upiId: "919994645063@ybl", baseAmount: 200, qrCode: "" });
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        teamName: "",
        transactionId: "",
        // ALWAYS treat as team to collect member details, even for 1 person
        registrationType: "team" 
    });
    // Default to 1 member for single registration
    const [teamMembers, setTeamMembers] = useState([{ name: "", college: "", phone: "" }]);
    const [file, setFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [extracting, setExtracting] = useState(false);
    const [showQR, setShowQR] = useState(false);

    // Dynamic UPI URL Generation
    const feePerPerson = Number(settings.baseAmount) || 200;
    const totalAmount = userPaid ? "0.00" : (feePerPerson * (teamMembers.length || 1)).toFixed(2);
    // Use URL encoding for name and note to ensure apps like GPay/PhonePe don't get confused
    const merchantName = encodeURIComponent("ORION 2K27");
    const transactionNote = encodeURIComponent("Symposium Entry Fee");
    const upiUrl = event ? `upi://pay?pa=${settings.upiId}&pn=${merchantName}&am=${totalAmount}&cu=INR&tn=${transactionNote}` : "";

    useEffect(() => {
        const fetchEventAndUser = async () => {
            const token = localStorage.getItem("token");
            try {
                // Fetch settings
                const setRes = await axios.get("/api/admin/settings");
                if (setRes.data) setSettings(setRes.data);

                // Fetch event details
                const eventRes = await axios.get("/api/events");
                console.log("Details - Event Fetch:", eventRes.data);
                
                // Allow matches even if case differs or ID structure varies
                const selectedEvent = eventRes.data.find(e => e._id === eventId || e.id === eventId);
                
                if (!selectedEvent) {
                    console.error("Event not found in list for ID:", eventId);
                }
                
                setEvent(selectedEvent);
                
                // Fetch current user status to check if already paid
                if (token) {
                    const userRes = await axios.get("/api/users/me", {
                        headers: { "x-auth-token": token }
                    });
                    const status = userRes.data.symposiumPaymentStatus;
                    // If they have any status other than rejected or null, they've "paid" (or pending)
                    if (status && status !== 'rejected') {
                        setUserPaid(true);
                        setPaymentVerified(status === 'verified');
                        // Set dummy values for required fields if already paid
                        setFormData(prev => ({ 
                            ...prev, 
                            transactionId: userRes.data.symposiumPaymentRef || "PREVIOUSLY_PAID" 
                        }));
                    }
                }

                // Set registration type based on event type
                const initialRegType = selectedEvent.type === "team" ? "team" : "individual";
                setFormData(prev => ({
                    ...prev,
                    registrationType: initialRegType,
                    teamName: "" 
                }));
                
                setTeamMembers([{ name: "", college: "", phone: "" }]);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching details", err);
                setLoading(false);
            }
        };
        fetchEventAndUser();
    }, [eventId]);

    const addMember = () => {
        setTeamMembers([...teamMembers, { name: "", college: "", phone: "" }]);
    };

    const removeMember = (index) => {
        if (teamMembers.length > 1) {
            setTeamMembers(teamMembers.filter((_, i) => i !== index));
        } else {
            alert("At least one member is required for registration.");
        }
    };

    const updateMember = (index, field, value) => {
        const updated = [...teamMembers];
        updated[index][field] = value;
        setTeamMembers(updated);
    };

    const handleFileChange = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;
        
        setFile(selectedFile);
        
        // Auto-extract Transaction ID if it's an image
        if (selectedFile.type.startsWith('image/')) {
            setExtracting(true);
            const token = localStorage.getItem("token");
            const extractData = new FormData();
            extractData.append("paymentProof", selectedFile);
            
            try {
                const res = await axios.post("/api/events/extract-transaction", extractData, {
                    headers: { 
                        "Content-Type": "multipart/form-data",
                        "x-auth-token": token 
                    }
                });
                
                if (res.data.transactionId) {
                    setFormData(prev => ({ ...prev, transactionId: res.data.transactionId }));
                }
            } catch (err) {
                console.error("Auto-extraction failed:", err);
            } finally {
                setExtracting(false);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("token");
        if (!token) {
            alert("No session found. Please login again.");
            return navigate("/register");
        }

        // Validate Transaction ID (example: alphanumeric, 8-20 characters)
        const txnPattern = /^[a-zA-Z0-9-]{6,24}$/;
        if (!userPaid && !txnPattern.test(formData.transactionId)) {
            alert("Invalid Transaction ID. Please enter a valid 8-24 character alphanumeric ID.");
            return;
        }

        // Phone number validation pattern (10 digits)
        const phonePattern = /^[0-9]{10}$/;

        // Validation for member details
        for (let i = 0; i < teamMembers.length; i++) {
            const phone = teamMembers[i].phone ? teamMembers[i].phone.trim() : "";
            if (!teamMembers[i].name || !teamMembers[i].college || !phone) {
                alert(`Please fill all details for Member ${i + 1}`);
                return;
            }
            if (!phonePattern.test(phone)) {
                alert(`Invalid phone number for Member ${i + 1}. Please enter a 10-digit phone number.`);
                return;
            }
        }

        setSubmitting(true);
        const submitData = new FormData();
        submitData.append("eventId", eventId);
        submitData.append("registrationType", formData.registrationType);
        submitData.append("teamName", formData.teamName || "Individual");
        submitData.append("teamMembersDetails", JSON.stringify(teamMembers));

        if (!userPaid) {
            submitData.append("transactionId", formData.transactionId);
            submitData.append("paymentProof", file);
        } else {
            // For users who already paid, send placeholder values
            submitData.append("transactionId", "PAID-VERIFIED-" + Date.now());
            submitData.append("paymentProof", null);
        }

        // Send the actual registration type
        submitData.append("registrationType", formData.registrationType);
        submitData.append("teamName", formData.teamName);
        submitData.append("teamMembersDetails", JSON.stringify(teamMembers));

        try {
            const res = await axios.post("/api/events/register-participation", submitData, {
                headers: { 
                    "Content-Type": "multipart/form-data",
                    "x-auth-token": token 
                }
            });
            const regNo = res.data.participation?.rollNumber || "N/A";
            alert(`Registration successful!\n\nYOUR REGISTER NO: ${regNo}\n\nPlease keep this ID for future reference.`);
            navigate("/participant-dashboard");
        } catch (err) {
            alert(`Failed: ${err.response?.data?.msg || "Server Error"}`);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="container hero-title" style={{ marginTop: "20vh" }}>INITIALIZING CORE...</div>;
    if (!event) return <div className="container hero-title" style={{ marginTop: "20vh" }}>EVENT NOT FOUND.</div>;

    return (
        <div className="container event-detail-container" style={{ position: "relative", padding: "100px 0" }}>
            <Link to="/" style={{ textDecoration: "none", color: "var(--accent-primary)", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px", marginBottom: "3rem", fontSize: "1rem", letterSpacing: "1.5px" }}>
                <ChevronLeft size={18} /> BACK TO MATRIX
            </Link>

            <div className="event-detail-grid" style={{ display: "grid", gridTemplateColumns: "1fr auto", gridTemplateAreas: "'details form'", gap: "4rem", alignItems: "start" }}>
                {/* Event Details */}
                <div style={{ gridArea: "details" }} className="glass-card event-info-card">
                    <h1 className="hero-title event-detail-title" style={{ fontSize: "3rem", margin: "0 0 1rem 0", textAlign: "left", WebkitTextStroke: "2.5px var(--accent-primary)" }}>{event.name}</h1>
                    <div style={{ padding: "4px 16px", borderRadius: "4px", background: "var(--accent-primary)", color: "#000", display: "inline-block", fontSize: "0.75rem", fontWeight: 900, marginBottom: "2.5rem", letterSpacing: "2px" }}>
                        {event.type.toUpperCase()} MODULE
                    </div>
                    <div className="event-description" style={{ color: "var(--text-secondary)", fontSize: "1.15rem", lineHeight: "1.8", marginBottom: "4rem" }}>{event.description}</div>
                    <div className="event-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "2rem" }}>
                        <div>
                            <span style={{ opacity: 0.4, fontSize: "0.6rem", letterSpacing: "2px" }}>VENUE</span>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem" }}><MapPin size={16} /> {event.venue}</div>
                        </div>
                        <div>
                            <span style={{ opacity: 0.4, fontSize: "0.6rem", letterSpacing: "2px" }}>ENTRY FEE</span>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem" }}><Ticket size={16} /> ₹{event.registrationFee}</div>
                        </div>
                        <div>
                            <span style={{ opacity: 0.4, fontSize: "0.6rem", letterSpacing: "2px" }}>REWARD</span>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1rem", color: "#ffcc33", fontWeight: 900 }}><Trophy size={16} /> CERTIFICATE</div>
                        </div>
                    </div>
                </div>

                {/* Registration Form */}
                <div style={{ gridArea: "form" }} className="glass-card event-form-card">
                    <h3 style={{ margin: "0 0 2rem 0", letterSpacing: "3px", fontWeight: 300, fontSize: "0.9rem", color: "var(--accent-secondary)" }}>PROTOCOL REGISTRATION</h3>
                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                        {/* Show registration type selection only if event type is team */}
                        {event.type === "team" ? (
                            <div style={{ marginBottom: "1rem" }}>
                                <label style={{ fontSize: "0.7rem", opacity: 0.5, letterSpacing: "1px", display: "block", marginBottom: "0.5rem" }}>REGISTRATION TYPE</label>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            setFormData({...formData, registrationType: "individual"}); // Removed static teamName reset
                                            setTeamMembers([{ name: "", college: "", phone: "" }]);
                                        }}
                                        style={{ 
                                            padding: "0.8rem", 
                                            borderRadius: "8px", 
                                            border: formData.registrationType === "individual" ? "1px solid var(--accent-primary)" : "1px solid rgba(255,255,255,0.05)",
                                            background: formData.registrationType === "individual" ? "rgba(0,210,255,0.1)" : "rgba(0,0,0,0.2)",
                                            color: formData.registrationType === "individual" ? "var(--accent-primary)" : "white",
                                            cursor: "pointer",
                                            fontSize: "0.75rem",
                                            fontWeight: 800
                                        }}
                                    >
                                        INDIVIDUAL
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => setFormData({...formData, registrationType: "team", teamName: ""})}
                                        style={{ 
                                            padding: "0.8rem", 
                                            borderRadius: "8px", 
                                            border: formData.registrationType === "team" ? "1px solid var(--accent-primary)" : "1px solid rgba(255,255,255,0.05)",
                                            background: formData.registrationType === "team" ? "rgba(0,210,255,0.1)" : "rgba(0,0,0,0.2)",
                                            color: formData.registrationType === "team" ? "var(--accent-primary)" : "white",
                                            cursor: "pointer",
                                            fontSize: "0.75rem",
                                            fontWeight: 800
                                        }}
                                    >
                                        TEAM ENTRY
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div style={{ padding: "12px", border: "1px solid var(--accent-primary)", borderRadius: "8px", background: "rgba(0,210,255,0.05)", marginBottom: "1rem" }}>
                                <p style={{ margin: 0, fontSize: "0.7rem", color: "var(--accent-primary)", fontWeight: 700, textAlign: "center", letterSpacing: "1px" }}>INDIVIDUAL REGISTRATION MODULE</p>
                            </div>
                        )}

                        {/* Always show team name input regardless of registration type */}
                        <input 
                            className="input-cyber" 
                            type="text" 
                            required 
                            placeholder={formData.registrationType === "individual" ? "PARTICIPANT / TEAM NAME" : "TEAM NAME"} 
                            value={formData.teamName} 
                            onChange={(e) => setFormData({...formData, teamName: e.target.value})} 
                        />

                        <div style={{ border: "1px solid rgba(255,255,255,0.05)", padding: "1.2rem", borderRadius: "16px", background: "rgba(0,0,0,0.3)", boxShadow: "inset 0 0 20px rgba(0,0,0,0.5)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
                                <span style={{ fontSize: "0.7rem", opacity: 0.6, letterSpacing: "1.5px", fontWeight: 700 }}>PARTICIPANT DETAILS</span>
                                {formData.registrationType === "team" && (
                                    <button type="button" onClick={addMember} style={{ background: "var(--accent-primary)", border: "none", borderRadius: "6px", padding: "6px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "0.65rem", fontWeight: 800, color: "#000" }}>
                                        <Plus size={14} /> ADD MEMBER
                                    </button>
                                )}
                            </div>
                            
                            {teamMembers.map((member, index) => (
                                <div key={index} style={{ marginBottom: "1.5rem", padding: "1.2rem", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", position: "relative", background: "rgba(255,255,255,0.02)" }}>
                                    <div style={{ position: "absolute", top: "-10px", left: "15px", background: "#1a1a1a", padding: "0 8px", fontSize: "0.6rem", color: "var(--accent-secondary)", fontWeight: 800 }}>MEMBER #{index + 1}</div>
                                    {formData.registrationType === "team" && teamMembers.length > 1 && (
                                        <button onClick={() => removeMember(index)} style={{ position: "absolute", top: "10px", right: "10px", background: "none", border: "none", color: "#ff4080", cursor: "pointer", padding: "4px" }}><X size={16} /></button>
                                    )}
                                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                        <div style={{ position: "relative" }}>
                                            <UserIcon size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", opacity: 0.4, color: "var(--accent-primary)" }} />
                                            <input className="input-cyber" style={{ paddingLeft: "42px", fontSize: "0.85rem", height: "45px" }} placeholder="FULL NAME (FOR CERTIFICATE)" value={member.name} onChange={(e) => updateMember(index, "name", e.target.value)} required />
                                        </div>
                                        <div style={{ position: "relative" }}>
                                            <Building size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", opacity: 0.4, color: "var(--accent-primary)" }} />
                                            <input className="input-cyber" style={{ paddingLeft: "42px", fontSize: "0.85rem", height: "45px" }} placeholder="COLLEGE / INSTITUTION" value={member.college} onChange={(e) => updateMember(index, "college", e.target.value)} required />
                                        </div>
                                        <div style={{ position: "relative" }}>
                                            <Phone size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", opacity: 0.4, color: "var(--accent-primary)" }} />
                                            <input 
                                                className="input-cyber" 
                                                style={{ paddingLeft: "42px", fontSize: "0.85rem", height: "45px" }} 
                                                placeholder="10-DIGIT PHONE NUMBER" 
                                                type="tel"
                                                maxLength="10"
                                                value={member.phone} 
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/\D/g, ""); // Allow only digits
                                                    updateMember(index, "phone", val);
                                                }} 
                                                required 
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            {!userPaid ? (
                                <>
                                    <button 
                                        type="button" 
                                        onClick={() => setShowQR(!showQR)}
                                        style={{ 
                                            padding: "0.8rem", 
                                            borderRadius: "8px", 
                                            border: "1px solid var(--accent-primary)",
                                            background: "rgba(0,210,255,0.05)",
                                            color: "var(--accent-primary)",
                                            cursor: "pointer",
                                            fontSize: "0.75rem",
                                            fontWeight: 800,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: "0.5rem"
                                        }}
                                    >
                                        <CreditCard size={16} /> {showQR ? "HIDE PAYMENT QR" : "SHOW PAYMENT QR (₹200)"}
                                    </button>

                                    {showQR && (
                                        <motion.div 
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            style={{ 
                                                background: "white", 
                                                padding: "1.5rem", 
                                                borderRadius: "16px", 
                                                display: "flex", 
                                                flexDirection: "column", 
                                                alignItems: "center",{extracting ? "EXTRACTING ID..." : "TRANSACTION ID"} value={formData.transactionId} onChange={(e) => setFormData({...formData, transactionId: e.target.value})} />
                                    <div className="input-group">
                                        <label style={{ fontSize: "0.7rem", opacity: 0.5, marginBottom: "0.5rem", display: "block" }}>PAYMENT PROOF (PDF/IMAGE)</label>
                                        <input type="file" required className="input-cyber" style={{ padding: "0.6rem" }} onChange={handleFileChange
                                            }}
                                        >
                                            <div style={{ padding: "10px", background: "white", borderRadius: "8px" }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                                    <QRCodeSVG 
                                                        value={upiUrl}
                                                        size={220}
                                                        level="H"
                                                        includeMargin={true}
                                                        imageSettings={{
                                                            src: "https://www.gstatic.com/images/branding/product/2x/gpay_32dp.png",
                                                            x: undefined,
                                                            y: undefined,
                                                            height: 24,
                                                            width: 24,
                                                            excavate: true,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            <div style={{ textAlign: "center", color: "#000" }}>
                                                <div style={{ fontWeight: 900, fontSize: "1.2rem", color: "#1a1a1a" }}>₹{totalAmount}</div>
                                                <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#666", letterSpacing: "1px", marginTop: "4px" }}>ONE-TIME SYMPOSIUM FEE</div>
                                                <div style={{ fontSize: "0.5rem", color: "#999", marginTop: "8px", wordBreak: 'break-all' }}>UPI ID: {settings.upiId}</div>
                                            </div>
                                        </motion.div>
                                    )}

                                    <input className="input-cyber" type="text" required placeholder="TRANSACTION ID" value={formData.transactionId} onChange={(e) => setFormData({...formData, transactionId: e.target.value})} />
                                    <div className="input-group">
                                        <label style={{ fontSize: "0.7rem", opacity: 0.5, marginBottom: "0.5rem", display: "block" }}>PAYMENT PROOF (PDF/IMAGE)</label>
                                        <input type="file" required className="input-cyber" style={{ padding: "0.6rem" }} onChange={(e) => setFile(e.target.files[0])} />
                                    </div>
                                </>
                            ) : (
                                <div style={{ 
                                    padding: "1rem", 
                                    borderRadius: "8px", 
                                    background: "rgba(0, 255, 128, 0.1)", 
                                    border: "1px solid var(--accent-primary)",
                                    textAlign: "center",
                                    color: "var(--accent-primary)",
                                    fontSize: "0.85rem",
                                    fontWeight: 700
                                }}>
                                    {paymentVerified ? "✓ SYMPOSIUM FEE PAID & VERIFIED" : "⚠ SYMPOSIUM FEE PAYMENT PENDING"}
                                    <div style={{ fontSize: "0.65rem", opacity: 0.7, marginTop: "5px" }}>You don't need to pay for additional events.</div>
                                </div>
                            )}
                        </div>

                        <button type="submit" className="btn-glow" style={{ width: "100%", marginTop: "1rem" }} disabled={submitting}>
                            {submitting ? "UPLOADING DATA..." : "SUBMIT REGISTRATION"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EventDetail;
