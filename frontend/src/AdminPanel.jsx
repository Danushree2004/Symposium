import React, { useEffect, useState } from "react";
import axios from "axios";
import { CheckCircle, XCircle, FileText, User, Mail, Award, Search, Filter, RotateCcw, Plus, Trash2, Edit, Save, X, Download } from "lucide-react";
import { jsPDF } from "jspdf";

const AdminPanel = () => {
    const [participations, setParticipations] = useState([]);
    const [allEvents, setAllEvents] = useState([]); // Real event objects from DB
    const [searchTerm, setSearchTerm] = useState("");
    const [filter, setFilter] = useState("all");
    const [eventFilter, setEventFilter] = useState("all");
    const [userRole, setUserRole] = useState("");
    const [activeTab, setActiveTab] = useState("registrations");

    // Symposium Settings State
    const [settings, setSettings] = useState({ upiId: "919994645063@ybl", baseAmount: 200, qrCode: "" });
    const [settingFile, setSettingFile] = useState(null);

    // Event Management State
    const [editingEvent, setEditingEvent] = useState(null);
    const [isAddingEvent, setIsAddingEvent] = useState(false);
    const [newEventData, setNewEventData] = useState({
        name: "", description: "", type: "individual", category: "technical", 
        teamSize: 1, registrationFee: 200, date: "March 5, 2026", venue: ""
    });

    // Payment Summary Stats
    const stats = {
        totalCollected: 0,
        pendingAmount: 0,
        verifiedCount: 0,
        pendingCount: 0,
        rejectedCount: 0
    };

    participations.forEach(p => {
        const fee = p.event?.registrationFee || 0;
        if (p.paymentStatus === 'verified') {
            stats.totalCollected += fee;
            stats.verifiedCount += 1;
        } else if (p.paymentStatus === 'pending') {
            stats.pendingAmount += fee;
            stats.pendingCount += 1;
        } else if (p.paymentStatus === 'rejected') {
            stats.rejectedCount += 1;
        }
    });

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        setUserRole(user.role);

        const fetchAll = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get("/api/admin/registrations", {
                    headers: { 'x-auth-token': token }
                });
                setParticipations(res.data);
                
                // Fetch events for management
                const eventRes = await axios.get("/api/events");
                setAllEvents(eventRes.data);

                // Fetch Settings
                const settingRes = await axios.get("/api/admin/settings", {
                    headers: { 'x-auth-token': token }
                });
                if (settingRes.data) setSettings(settingRes.data);
            } catch (err) { alert("Access Required: " + (err.response?.data?.msg || "Unauthorized")); }
        };
        fetchAll();
    }, []);

    const handleSaveSettings = async () => {
        try {
            const token = localStorage.getItem("token");
            const fd = new FormData();
            fd.append("upiId", settings.upiId);
            fd.append("baseAmount", settings.baseAmount);
            if (settingFile) fd.append("qrCode", settingFile);

            const res = await axios.post("/api/admin/settings", fd, {
                headers: { 
                    'x-auth-token': token,
                    'Content-Type': 'multipart/form-data'
                }
            });
            alert("Settings Updated!");
            setSettings(res.data.settings);
            setSettingFile(null);
            // Clear input file
            const fileInput = document.querySelector('input[type="file"]');
            if (fileInput) fileInput.value = "";
        } catch (err) { alert("Failed to save settings"); }
    };

    const handleRemoveQR = async () => {
        if (!window.confirm("Are you sure you want to remove the uploaded QR image? This will revert to the generated Smart QR.")) return;
        try {
            const token = localStorage.getItem("token");
            const res = await axios.delete("/api/admin/settings/qr", {
                headers: { 'x-auth-token': token }
            });
            alert("QR Image Removed!");
            setSettings(res.data.settings);
        } catch (err) { alert("Failed to remove QR"); }
    };

    const events = [...new Set(participations.map(p => p.event?.name))].filter(Boolean);

    // MODAL STYLES (Inline)
    const modalOverlayStyle = {
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
        zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px'
    };

    const modalContentStyle = {
        background: '#111', border: '1px solid rgba(0,210,255,0.2)',
        borderRadius: '20px', width: '100%', maxWidth: '600px',
        padding: '2.5rem', boxShadow: '0 0 50px rgba(0,210,255,0.1)'
    };

    // EVENT MANAGEMENT ACTIONS
    const handleAddEvent = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.post("/api/admin/events", newEventData, {
                headers: { 'x-auth-token': token }
            });
            setAllEvents([...allEvents, res.data]);
            setIsAddingEvent(false);
            setNewEventData({ name: "", description: "", type: "individual", category: "technical", teamSize: 1, registrationFee: 200, date: "March 5, 2026", venue: "" });
        } catch (err) { alert("Failed to add event: " + (err.response?.data?.error || err.message)); }
    };

    const handleUpdateEvent = async (id, updatedData) => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.patch(`/api/admin/events/${id}`, updatedData, {
                headers: { 'x-auth-token': token }
            });
            setAllEvents(allEvents.map(e => e._id === id ? res.data : e));
            setEditingEvent(null);
        } catch (err) { alert("Update failed"); }
    };

    const handleDeleteEvent = async (id) => {
        if (!window.confirm("WARNING: Deleting an event will also REMOVE ALL current registrations for it. Continue?")) return;
        try {
            const token = localStorage.getItem("token");
            await axios.delete(`/api/admin/events/${id}`, {
                headers: { 'x-auth-token': token }
            });
            setAllEvents(allEvents.filter(e => e._id !== id));
        } catch (err) { alert("Delete failed"); }
    };

    const handleUpdateResult = async (id, shortlisted, resultStatus) => {
        try {
            const token = localStorage.getItem("token");
            await axios.patch(`/api/admin/update-result/${id}`, 
                { shortlisted, resultStatus }, 
                { headers: { 'x-auth-token': token } }
            );
            setParticipations(participations.map(p => p._id === id ? { ...p, shortlisted, resultStatus } : p));
        } catch (err) { alert("Failed to update status"); }
    };

    const handleVerify = async (id, status) => {
        try {
            const token = localStorage.getItem("token");
            console.log(`Attempting to update status for ${id} to ${status}`);
            const res = await axios.patch(`/api/admin/verify-payment/${id}`, { status }, {
                headers: { 'x-auth-token': token }
            });
            console.log('Update result:', res.data);
            setParticipations(participations.map(p => p._id === id ? { ...p, paymentStatus: status } : p));
        } catch (err) { 
            console.error('Verify Action Failed:', err.response?.data || err.message);
            alert("Action Failed: " + (err.response?.data?.msg || "Check console"));
        }
    };

    const handleExport = async (type) => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`/api/admin/export-${type}`, {
                headers: { 'x-auth-token': token },
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${type}_sheet_${new Date().toLocaleDateString()}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            alert(`Export failed: ${err.response?.data?.error || err.message}`);
        }
    };

    const generateResult = async (id, name, eventName) => {
        try {
            const token = localStorage.getItem("token");
            const doc = new jsPDF("l", "mm", "a4");
            // ... existing doc generation code ...
            doc.setFillColor(10, 10, 10);
            doc.rect(0, 0, 297, 210, "F");
            doc.setDrawColor(0, 210, 255);
            doc.setLineWidth(2);
            doc.rect(10, 10, 277, 190, "D");
            
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(50);
            doc.text("ORION 2K26", 148, 60, { align: "center" });
            
            doc.setFontSize(20);
            doc.text("CERTIFICATE OF EXCELLENCE", 148, 85, { align: "center" });
            
            doc.setFontSize(14);
            doc.text("This is to certify that", 148, 110, { align: "center" });
            
            doc.setTextColor(0, 210, 255);
            doc.setFontSize(30);
            doc.text(name.toUpperCase(), 148, 130, { align: "center" });
            
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(14);
            doc.text(`has successfully participated in the event ${eventName}`, 148, 150, { align: "center" });
            doc.text("Organized by Department of Computer Applications", 148, 160, { align: "center" });

            doc.save(`${name}_Certificate.pdf`);
            // Update this endpoint if you have a results update logic in backend
            // For now, let's keep it consistent with the others if needed
            // await axios.patch(`http://localhost:5000/admin/update-result/${id}`, { result: "Participated" }, {
            //     headers: { 'x-auth-token': token }
            // });
            // setParticipations(participations.map(p => p._id === id ? { ...p, result: "Participated" } : p));
        } catch (err) { alert("Certificate Error"); }
    };

    const filteredData = participations.filter(p => 
        (p.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
         p.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         p.user?.college?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         p.user?.phone?.includes(searchTerm) ||
         p.teamName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         p.participationId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         p.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         p.paymentRef?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         p.teamMembersDetails?.some(m => 
            m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.college?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.phone?.includes(searchTerm)
         )) &&
        (filter === "all" || p.paymentStatus === filter) &&
        (eventFilter === "all" || p.event?.name === eventFilter)
    );

    return (
        <div className="container" style={{ padding: "60px 0" }}>
            {/* Header with Navigation Tabs */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "3rem" }}>
                <div>
                    <h1 className="hero-title" style={{ textAlign: "left", margin: 0, fontSize: "3rem", letterSpacing: "-1px" }}>ORION OS</h1>
                    <p style={{ color: "#00d2ff", letterSpacing: "2px", margin: "10px 0 0 0", fontSize: "0.8rem", fontWeight: 700, opacity: 0.8 }}>
                        {userRole === "admin" ? "CENTRAL COMMAND | ALL PRIVILEGES" : `EVENT PROTOCOL: ${userRole?.toUpperCase()}`}
                    </p>
                </div>

                <div style={{ display: "flex", gap: "10px", background: "rgba(0,0,0,0.3)", padding: "8px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <button 
                        onClick={() => setActiveTab("registrations")}
                        style={{ 
                            padding: "10px 24px", borderRadius: "10px", border: "none", cursor: "pointer",
                            background: activeTab === "registrations" ? "var(--btn-gradient)" : "transparent",
                            color: activeTab === "registrations" ? "white" : "rgba(255,255,255,0.4)",
                            fontSize: "0.75rem", fontWeight: 700, transition: "all 0.3s ease"
                        }}
                    >
                        REGISTRATIONS
                    </button>
                    {userRole === "admin" && (
                        <button 
                            onClick={() => setActiveTab("events")}
                            style={{ 
                                padding: "10px 24px", borderRadius: "10px", border: "none", cursor: "pointer",
                                background: activeTab === "events" ? "var(--btn-gradient)" : "transparent",
                                color: activeTab === "events" ? "white" : "rgba(255,255,255,0.4)",
                                fontSize: "0.75rem", fontWeight: 700, transition: "all 0.3s ease"
                            }}
                        >
                            EVENT MANAGEMENT
                        </button>
                    )}
                    {userRole === "admin" && (
                        <button 
                            onClick={() => setActiveTab("settings")}
                            style={{ 
                                padding: "10px 24px", borderRadius: "10px", border: "none", cursor: "pointer",
                                background: activeTab === "settings" ? "var(--btn-gradient)" : "transparent",
                                color: activeTab === "settings" ? "white" : "rgba(255,255,255,0.4)",
                                fontSize: "0.75rem", fontWeight: 700, transition: "all 0.3s ease"
                            }}
                        >
                            SYMPOSIUM SETTINGS
                        </button>
                    )}
                </div>
            </div>

            {activeTab === "registrations" ? (
                <>
                    {/* Payment Tracker Stats Module */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.5rem", marginBottom: "2rem" }}>
                        <div className="glass-card" style={{ padding: "1.5rem", borderLeft: "4px solid #00ff80", background: "rgba(0, 255, 128, 0.03)" }}>
                            <div style={{ opacity: 0.5, fontSize: "0.65rem", letterSpacing: "2px", fontWeight: 700 }}>COLLECTED REVENUE</div>
                            <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#00ff80", marginTop: "5px" }}>₹{stats.totalCollected}</div>
                            <div style={{ fontSize: "0.6rem", opacity: 0.4, marginTop: "5px" }}>FROM {stats.verifiedCount} VERIFIED ENTRIES</div>
                        </div>
                        <div className="glass-card" style={{ padding: "1.5rem", borderLeft: "4px solid #ffcc33", background: "rgba(255, 204, 51, 0.03)" }}>
                            <div style={{ opacity: 0.5, fontSize: "0.65rem", letterSpacing: "2px", fontWeight: 700 }}>PENDING INFLOW</div>
                            <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#ffcc33", marginTop: "5px" }}>₹{stats.pendingAmount}</div>
                            <div style={{ fontSize: "0.6rem", opacity: 0.4, marginTop: "5px" }}>ACROSS {stats.pendingCount} PENDING REVIEWS</div>
                        </div>
                        <div className="glass-card" style={{ padding: "1.5rem", borderLeft: "4px solid #00d2ff", background: "rgba(0, 210, 255, 0.03)" }}>
                            <div style={{ opacity: 0.5, fontSize: "0.65rem", letterSpacing: "2px", fontWeight: 700 }}>REGISTRATION ID RANGE</div>
                            <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "#00d2ff", marginTop: "12px", letterSpacing: "1px" }}>
                                {participations.length > 0 ? `ORION27001 - ORION27${participations.length.toString().padStart(3, '0')}` : "N/A"}
                            </div>
                        </div>
                        <div className="glass-card" style={{ padding: "1.5rem", borderLeft: "4px solid #ff4080", background: "rgba(255, 64, 128, 0.03)" }}>
                            <div style={{ opacity: 0.5, fontSize: "0.65rem", letterSpacing: "2px", fontWeight: 700 }}>REJECTION RATIO</div>
                            <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#ff4080", marginTop: "5px" }}>
                                {participations.length > 0 ? `${Math.round((stats.rejectedCount / participations.length) * 100)}%` : "0%"}
                            </div>
                            <div style={{ fontSize: "0.6rem", opacity: 0.4, marginTop: "5px" }}>{stats.rejectedCount} ENTRIES REJECTED</div>
                        </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", background: "rgba(255,255,255,0.02)", padding: "1.5rem", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#00ff80", boxShadow: "0 0 10px #00ff80" }}></div>
                            <p style={{ color: "var(--text-secondary)", letterSpacing: "2px", margin: 0, fontSize: "0.7rem", fontWeight: 700 }}>{participations.length} REGISTRATIONS TRACKED</p>
                        </div>
                        
                        <div style={{ display: "flex", gap: "0.8rem", background: "rgba(0,0,0,0.2)", padding: "8px", borderRadius: "12px" }}>
                            <div style={{ position: "relative" }}>
                                <Search size={16} style={{ position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)", opacity: 0.3 }} />
                                <input 
                                    className="input-field" 
                                    style={{ paddingLeft: "42px", width: "220px", height: "45px", fontSize: "0.75rem", border: "1px solid rgba(255,255,255,0.05)", background: "#111" }} 
                                    placeholder="SEARCH NAME / EMAIL..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)} 
                                />
                            </div>

                            <div style={{ position: "relative" }}>
                                <Filter size={16} style={{ position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)", opacity: 0.3 }} />
                                <select 
                                    className="input-field" 
                                    style={{ 
                                        paddingLeft: "42px", width: "160px", height: "45px", fontSize: "0.75rem", 
                                        cursor: "pointer", appearance: "none", border: "1px solid rgba(255,255,255,0.05)", 
                                        background: "#111", color: "white" 
                                    }}
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value)}
                                >
                                    <option value="all" style={{ background: "#111", color: "white" }}>ALL STATUS</option>
                                    <option value="pending" style={{ background: "#111", color: "white" }}>PENDING</option>
                                    <option value="verified" style={{ background: "#111", color: "white" }}>VERIFIED</option>
                                    <option value="rejected" style={{ background: "#111", color: "white" }}>REJECTED</option>
                                </select>
                            </div>

                            <div style={{ position: "relative" }}>
                                <FileText size={16} style={{ position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)", opacity: 0.3 }} />
                                <select 
                                    className="input-field" 
                                    style={{ 
                                        paddingLeft: "42px", width: "180px", height: "45px", fontSize: "0.75rem", 
                                        cursor: "pointer", appearance: "none", border: "1px solid rgba(255,255,255,0.05)", 
                                        background: "#111", color: "white" 
                                    }}
                                    value={eventFilter}
                                    onChange={(e) => setEventFilter(e.target.value)}
                                >
                                    <option value="all" style={{ background: "#111", color: "white" }}>ALL EVENTS</option>
                                    {allEvents.map(ev => (
                                        <option key={ev._id} value={ev.name} style={{ background: "#111", color: "white" }}>{ev.name.toUpperCase()}</option>
                                    ))}
                                </select>
                            </div>

                            {(searchTerm || filter !== "all" || eventFilter !== "all") && (
                                <button 
                                    onClick={() => {
                                        setSearchTerm("");
                                        setFilter("all");
                                        setEventFilter("all");
                                    }}
                                    className="btn-glow"
                                    style={{ padding: "0 20px", background: "rgba(255, 64, 128, 0.15)", border: "1px solid rgba(255, 64, 128, 0.4)", borderRadius: "8px", color: "#ff4080", fontSize: "0.65rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "8px", transition: "all 0.3s ease" }}
                                >
                                    <RotateCcw size={14} /> RESET
                                </button>
                            )}

                            {/* Export Buttons */}
                            <button 
                                onClick={() => handleExport('attendance')}
                                className="btn-glow"
                                style={{ padding: "0 20px", background: "rgba(0, 255, 128, 0.1)", border: "1px solid rgba(0, 255, 128, 0.3)", borderRadius: "8px", color: "#00ff80", fontSize: "0.65rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "8px", transition: "all 0.3s ease", height: "45px" }}
                            >
                                <Download size={14} /> EXPORT ATTENDANCE
                            </button>
                            <button 
                                onClick={() => handleExport('winners')}
                                className="btn-glow"
                                style={{ padding: "0 20px", background: "rgba(255, 204, 51, 0.1)", border: "1px solid rgba(255, 204, 51, 0.3)", borderRadius: "8px", color: "#ffcc33", fontSize: "0.65rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "8px", transition: "all 0.3s ease", height: "45px" }}
                            >
                                <Award size={14} /> EXPORT WINNERS
                            </button>
                        </div>
                    </div>

                    <div className="glass-card" style={{ padding: 0, overflowX: "auto", width: "100%", WebkitOverflowScrolling: "touch" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", color: "var(--text-secondary)", minWidth: "1200px" }}>
                            <thead>
                                <tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                                    <th style={{ padding: "1.5rem", textAlign: "left", fontSize: "0.7rem", letterSpacing: "2px" }}>CANDIDATE</th>
                                    <th style={{ padding: "1.5rem", textAlign: "left", fontSize: "0.7rem", letterSpacing: "2px" }}>EVENT & DATE</th>
                                    <th style={{ padding: "1.5rem", textAlign: "left", fontSize: "0.7rem", letterSpacing: "2px" }}>PAYMENT</th>
                                    <th style={{ padding: "1.5rem", textAlign: "left", fontSize: "0.7rem", letterSpacing: "2px" }}>STATUS</th>
                                    <th style={{ padding: "1.5rem", textAlign: "right", fontSize: "0.7rem", letterSpacing: "2px" }}>OPERATIONS</th>
                                </tr>
                            </thead>
                    <tbody>
                        {filteredData.map(p => (
                            <tr key={p._id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", transition: "background 0.3s" }} onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.02)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                                <td style={{ padding: "1.5rem", minWidth: "250px" }}>
                                    <div style={{ color: "#fff", fontWeight: 700, fontSize: "0.9rem" }}>{p.user?.name}</div>
                                    <div style={{ fontSize: "0.75rem", opacity: 0.7, color: "#fff" }}>{p.user?.email}</div>
                                    <div style={{ fontSize: "0.75rem", opacity: 0.7, color: "#fff" }}>{p.user?.college}</div>
                                    {p.user?.phone && <div style={{ fontSize: "0.75rem", color: "var(--accent-secondary)", fontWeight: 700 }}>{p.user?.phone}</div>}
                                </td>
                                <td style={{ padding: "1.5rem" }}>
                                    <div style={{ color: "var(--accent-secondary)", fontSize: "0.85rem", fontWeight: 700 }}>{p.event?.name}</div>
                                    <div style={{ fontSize: "0.75rem", color: "#00ff80", fontWeight: 700, marginTop: "4px" }}>REG NO: {p.rollNumber || "N/A"}</div>
                                    <div style={{ fontSize: "0.6rem", opacity: 0.5, marginTop: "4px" }}>
                                        {p.registeredAt ? new Date(p.registeredAt).toLocaleString() : "PRE-LOG"}
                                    </div>
                                    {p.teamName && <div style={{ fontSize: "0.7rem", color: "#fff", marginTop: "4px" }}>TEAM: {p.teamName}</div>}
                                    {p.teamMembersDetails?.length > 0 && (
                                        <div style={{ marginTop: "10px", padding: "8px", background: "rgba(255,255,255,0.02)", borderRadius: "6px" }}>
                                            {p.teamMembersDetails.map((m, i) => (
                                                <div key={i} style={{ fontSize: "0.65rem", marginBottom: "4px", borderBottom: i !== p.teamMembersDetails.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none", paddingBottom: "2px" }}>
                                                    <div style={{ color: "#00d2ff" }}>{m.name} ({m.college})</div>
                                                    <div style={{ opacity: 0.5 }}>{m.phone}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </td>
                                <td style={{ padding: "1.5rem" }}>
                                    {p.paymentScreenshot ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            {/* Permanent Embedded Preview */}
                                            {p.paymentScreenshot.startsWith('data:') ? (
                                                p.paymentScreenshot.includes('application/pdf') ? (
                                                    <iframe 
                                                        src={p.paymentScreenshot} 
                                                        style={{ width: '150px', height: '100px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px' }}
                                                        title="PDF Preview"
                                                    />
                                                ) : (
                                                    <img 
                                                        src={p.paymentScreenshot} 
                                                        style={{ width: '150px', height: '100px', objectFit: 'cover', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }} 
                                                        alt="Payment Proof"
                                                    />
                                                )
                                            ) : (
                                                p.paymentScreenshot.toLowerCase().endsWith('.pdf') ? (
                                                    <iframe 
                                                        src={`/api/uploads/${p.paymentScreenshot}`} 
                                                        style={{ width: '150px', height: '100px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px' }}
                                                        title="PDF Preview"
                                                    />
                                                ) : (p.paymentScreenshot.toLowerCase().endsWith('.doc') || p.paymentScreenshot.toLowerCase().endsWith('.docx')) ? (
                                                    <div style={{ width: '150px', height: '100px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', fontSize: '0.6rem' }}>
                                                        WORD DOC
                                                    </div>
                                                ) : (
                                                    <img 
                                                        src={`/api/uploads/${p.paymentScreenshot}`} 
                                                        style={{ width: '150px', height: '100px', objectFit: 'cover', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }} 
                                                        alt="Payment Proof"
                                                        onError={(e) => e.target.style.display = 'none'}
                                                    />
                                                )
                                            )}
                                            
                                                <button 
                                                    type="button"
                                                    className="btn-glow"
                                                    onClick={() => {
                                                        const fileUrl = p.paymentScreenshot.startsWith('data:') ? p.paymentScreenshot : `/api/uploads/${p.paymentScreenshot}`;
                                                        const isDoc = !p.paymentScreenshot.startsWith('data:') && (p.paymentScreenshot.toLowerCase().endsWith('.doc') || p.paymentScreenshot.toLowerCase().endsWith('.docx'));
                                                        const finalUrl = isDoc ? `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true` : fileUrl;
                                                        window.open(finalUrl, '_blank');
                                                    }}
                                                    style={{ padding: '4px 8px', fontSize: '0.6rem', width: '150px' }}
                                                >
                                                    {p.paymentScreenshot.startsWith('data:') ? 'VIEW PROOF' : 'FULL SCREEN'}
                                                </button>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                <span style={{ fontSize: "0.65rem", opacity: 0.3 }}>NO SCREENSHOT</span>
                                                {p.paymentRef && <span style={{ fontSize: '0.6rem', color: 'var(--accent-secondary)' }}>ID: {p.paymentRef}</span>}
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ padding: "1.5rem" }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ padding: "4px 10px", borderRadius: "4px", fontSize: "0.65rem", fontWeight: 800, background: p.paymentStatus === "verified" ? "rgba(0, 255, 128, 0.1)" : p.paymentStatus === "rejected" ? "rgba(255, 64, 128, 0.1)" : "rgba(255, 255, 255, 0.05)", color: p.paymentStatus === "verified" ? "#00ff80" : p.paymentStatus === "rejected" ? "#ff4080" : "#fff" }}>
                                            {p.paymentStatus.toUpperCase()}
                                        </span>
                                        {p.paymentStatus !== "pending" && (
                                            <button 
                                                onClick={() => handleVerify(p._id, "pending")}
                                                title="Reset to Pending"
                                                style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", opacity: 0.5, transition: 'opacity 0.2s' }}
                                                onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                                                onMouseLeave={(e) => e.currentTarget.style.opacity = 0.5}
                                            >
                                                <RotateCcw size={14} />
                                            </button>
                                        )}
                                    </div>
                                    {p.paymentStatus === "verified" && (
                                        <div style={{ marginTop: "10px" }}>
                                            <select 
                                                style={{ background: "#222", color: "#fff", border: "1px solid #444", fontSize: "0.65rem", padding: "4px", borderRadius: "4px" }}
                                                value={p.resultStatus || "none"}
                                                onChange={(e) => handleUpdateResult(p._id, e.target.value !== "none", e.target.value)}
                                            >
                                                <option value="none">Set Result</option>
                                                <option value="not shortlisted">Not Shortlisted</option>
                                                <option value="shortlisted">Shortlisted</option>
                                                <option value="1st prize">1st Prize</option>
                                                <option value="2nd prize">2nd Prize</option>
                                                <option value="3rd prize">3rd Prize</option>
                                            </select>
                                        </div>
                                    )}
                                </td>
                                <td style={{ padding: "1.5rem", textAlign: "right" }}>
                                    <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap", justifyContent: "flex-end", maxWidth: "250px" }}>
                                        {p.paymentStatus === "pending" && (
                                            <>
                                                <button onClick={() => handleVerify(p._id, "verified")} className="btn-glow" style={{ padding: "8px", background: "rgba(0, 255, 128, 0.2)", border: "1px solid #00ff80" }}><CheckCircle size={16} /></button>
                                                <button onClick={() => handleVerify(p._id, "rejected")} className="btn-glow" style={{ padding: "8px", background: "rgba(255, 64, 128, 0.2)", border: "1px solid #ff4080" }}><XCircle size={16} /></button>
                                            </>
                                        )}
                                        {p.paymentStatus !== "pending" && (
                                            <button 
                                                onClick={() => handleVerify(p._id, p.paymentStatus === "verified" ? "rejected" : "verified")} 
                                                className="btn-glow" 
                                                style={{ 
                                                    padding: "8px 12px", 
                                                    fontSize: '0.6rem',
                                                    background: "rgba(255,255,255,0.05)", 
                                                    border: "1px solid rgba(255,255,255,0.1)",
                                                    color: 'var(--text-secondary)'
                                                }}
                                            >
                                                {p.paymentStatus === "verified" ? "SWITCH TO REJECTED" : "SWITCH TO VERIFIED"}
                                            </button>
                                        )}
                                        {p.paymentStatus === "verified" && (
                                            <>
                                                {/* Issue Certificate button ONLY for Not Shortlisted entries */}
                                                {p.resultStatus === "not shortlisted" && (
                                                    p.teamMembersDetails?.length > 0 ? (
                                                        p.teamMembersDetails.map((m, idx) => (
                                                            <button 
                                                                key={idx}
                                                                onClick={() => generateResult(p._id, m.name, p.event?.name)} 
                                                                className="btn-glow" 
                                                                style={{ fontSize: "0.6rem", padding: "6px 10px", display: "flex", alignItems: "center", gap: "6px", background: "rgba(0,210,255,0.1)", border: "1px solid var(--accent-primary)" }}
                                                            >
                                                                <Award size={12} /> {m.name.split(' ')[0]}
                                                            </button>
                                                        ))
                                                    ) : (
                                                        <button onClick={() => generateResult(p._id, p.user?.name, p.event?.name)} className="btn-glow" style={{ fontSize: "0.7rem", padding: "8px 15px", display: "flex", alignItems: "center", gap: "8px" }}>
                                                            <Award size={14} /> ISSUE CERT
                                                        </button>
                                                    )
                                                )}
                                                {/* Message for Winners */}
                                                {p.resultStatus && p.resultStatus.toLowerCase().includes('prize') && (
                                                    <span style={{ fontSize: '0.6rem', color: '#00ff80', opacity: 0.8 }}>WINNER: HARD COPY ONLY</span>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            </>
            ) : activeTab === "events" ? (
                <div className="glass-card" style={{ padding: "2rem", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                        <h2 style={{ color: "white", margin: 0, fontSize: "1.2rem", fontWeight: 700, letterSpacing: "1px" }}>EVENT CATALOGUE</h2>
                        <button 
                            onClick={() => setIsAddingEvent(true)}
                            className="btn-glow"
                            style={{ padding: "10px 20px", display: "flex", alignItems: "center", gap: "10px", fontSize: "0.75rem", fontWeight: 700 }}
                        >
                            <Plus size={16} /> INITIALIZE EVENT
                        </button>
                    </div>

                    <div style={{ overflowX: "auto", width: "100%", WebkitOverflowScrolling: "touch" }}>
                        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px", minWidth: "800px" }}>
                            <thead>
                                <tr style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.65rem", letterSpacing: "1.5px", textTransform: "uppercase" }}>
                                    <th style={{ textAlign: "left", padding: "12px 20px" }}>EVENT_ID / IDENTITY</th>
                                    <th style={{ textAlign: "left", padding: "12px 20px" }}>PROTOCOL_TYPE</th>
                                    <th style={{ textAlign: "left", padding: "12px 20px" }}>LOGISTICS_DATA</th>
                                    <th style={{ textAlign: "right", padding: "12px 20px" }}>COMMANDS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allEvents.map(ev => (
                                    <tr key={ev._id} style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", transition: "all 0.3s ease" }}>
                                        <td style={{ padding: "16px 20px", borderRadius: "10px 0 0 10px", border: "1px solid rgba(255,255,255,0.05)", borderRight: "none" }}>
                                            <div style={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}>{ev.name}</div>
                                            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.7rem", marginTop: "4px", maxWidth: "320px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.description}</div>
                                        </td>
                                        <td style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                            <span style={{ padding: "3px 8px", borderRadius: "4px", fontSize: "0.6rem", background: "rgba(255,255,255,0.05)", color: "var(--accent-primary)", fontWeight: 700, border: "1px solid rgba(0, 212, 255, 0.2)" }}>{ev.category?.toUpperCase()}</span>
                                            <div style={{ marginTop: "6px", fontSize: "0.75rem", color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>{ev.type === "team" ? `TEAM (${ev.teamSize} MAX)` : "INDIVIDUAL"}</div>
                                        </td>
                                        <td style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                            <div style={{ fontSize: "0.85rem", color: "#00ff80", fontWeight: 600 }}>₹{ev.registrationFee}</div>
                                            <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", marginTop: "4px" }}>{ev.date} | {ev.venue || "TBD"}</div>
                                        </td>
                                        <td style={{ padding: "16px 20px", textAlign: "right", borderRadius: "0 10px 10px 0", border: "1px solid rgba(255,255,255,0.05)", borderLeft: "none" }}>
                                            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                                                <button onClick={() => setEditingEvent(ev)} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "white", padding: "8px", borderRadius: "6px", cursor: "pointer", transition: "0.2s" }} onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent-primary)"} onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}><Edit size={14} /></button>
                                                <button onClick={() => handleDeleteEvent(ev._id)} style={{ background: "rgba(255,64,128,0.05)", border: "1px solid rgba(255,64,128,0.2)", color: "#ff4080", padding: "8px", borderRadius: "6px", cursor: "pointer", transition: "0.2s" }} onMouseEnter={e => e.currentTarget.style.borderColor = "#ff4080"} onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,64,128,0.2)"}><Trash2 size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="glass-card" style={{ padding: "3rem", border: "1px solid rgba(255,255,255,0.05)", maxWidth: "800px", margin: "0 auto" }}>
                    <h2 style={{ color: "white", marginBottom: "2rem", fontSize: "1.5rem", fontWeight: 700 }}>SYSTEM CONFIGURATION</h2>
                    
                    <div style={{ display: "grid", gap: "2rem" }}>
                        <div className="input-group">
                            <label style={{ display: "block", color: "#888", fontSize: "0.7rem", marginBottom: "8px", fontWeight: 700 }}>OFFICIAL UPI ID</label>
                            <input 
                                className="input-field" 
                                style={{ background: "#1a1a1e", border: "1px solid #333", color: "white", padding: "15px", borderRadius: "10px", width: "100%" }}
                                value={settings.upiId}
                                onChange={(e) => setSettings({...settings, upiId: e.target.value})}
                                placeholder="Auto-extracted from QR if uploaded"
                            />
                        </div>

                        <div className="input-group">
                            <label style={{ display: "block", color: "#888", fontSize: "0.7rem", marginBottom: "8px", fontWeight: 700 }}>BASE AMOUNT PER PERSON (₹)</label>
                            <input 
                                className="input-field"
                                type="number"
                                style={{ background: "#1a1a1e", border: "1px solid #333", color: "white", padding: "15px", borderRadius: "10px", width: "100%" }}
                                value={settings.baseAmount}
                                onChange={(e) => setSettings({...settings, baseAmount: e.target.value})}
                            />
                        </div>

                        <div className="input-group">
                            <label style={{ display: "block", color: "#888", fontSize: "0.7rem", marginBottom: "8px", fontWeight: 700 }}>PAYMENT QR CODE (IMAGE)</label>
                            {settings.qrCode && (
                                <div style={{ 
                                    marginBottom: "1rem", 
                                    position: "relative", 
                                    width: "fit-content",
                                    display: "inline-block"
                                }}>
                                    <p style={{ fontSize: "0.6rem", color: "var(--accent-primary)", marginBottom: "4px" }}>CURRENT QR:</p>
                                    <img 
                                        src={settings.qrCode.startsWith('data:') ? settings.qrCode : `/api/uploads/${settings.qrCode}`} 
                                        alt="Current QR" 
                                        style={{ width: "120px", height: "auto", borderRadius: "8px", border: "1px solid #333", display: "block" }} 
                                    />
                                    <button 
                                        onClick={handleRemoveQR}
                                        style={{
                                            position: "absolute",
                                            top: "15px",
                                            right: "-8px",
                                            background: "#ef4444",
                                            border: "none",
                                            color: "white",
                                            borderRadius: "50%",
                                            width: "22px",
                                            height: "22px",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                                            zIndex: 5
                                        }}
                                        title="Remove QR Image"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            )}
                            <input 
                                type="file"
                                style={{ background: "#1a1a1e", border: "1px solid #333", color: "white", padding: "15px", borderRadius: "10px", width: "100%" }}
                                onChange={(e) => setSettingFile(e.target.files[0])}
                            />
                        </div>

                        <button 
                            onClick={handleSaveSettings}
                            className="btn-glow" 
                            style={{ padding: "15px", fontWeight: 700, marginTop: "1rem" }}
                        >
                            DEPLOY CONFIGURATION
                        </button>
                    </div>
                </div>
            )}

            {/* ADD / EDIT MODAL */}
            {(isAddingEvent || editingEvent) && (
                <div style={modalOverlayStyle}>
                    <div style={{
                        ...modalContentStyle,
                        width: "100%",
                        maxWidth: "850px",
                        padding: "0",
                        overflow: "hidden",
                        backgroundColor: "#0d0d10",
                        border: "1px solid #2a2a2e",
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8)",
                        borderRadius: "12px"
                    }}>
                        {/* Header */}
                        <div style={{
                            padding: "1.25rem 2rem",
                            background: "#16161a",
                            borderBottom: "1px solid #2a2a2e",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                        }}>
                            <h2 style={{ color: "white", margin: 0, fontSize: "1.1rem", fontWeight: 700, letterSpacing: "1px" }}>
                                {isAddingEvent ? "INITIALIZE_NEW_EVENT" : "UPDATE_EVENT_RECORD"}
                            </h2>
                            <button 
                                onClick={() => { setIsAddingEvent(false); setEditingEvent(null); }} 
                                style={{ background: "none", border: "none", color: "#666", cursor: "pointer", transition: "color 0.2s" }}
                                onMouseEnter={(e) => e.currentTarget.style.color = "white"}
                                onMouseLeave={(e) => e.currentTarget.style.color = "#666"}
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div style={{ padding: "2rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2.5rem" }}>
                            {/* Left Column: Basic Info */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                                <div className="input-group">
                                    <label style={{ display: "block", color: "#888", fontSize: "0.7rem", marginBottom: "8px", fontWeight: 700, letterSpacing: "0.5px" }}>EVENT IDENTITY</label>
                                    <input 
                                        className="input-field" 
                                        placeholder="e.g. Neural Coding Challenge"
                                        style={{ background: "#1a1a1e", border: "1px solid #333", color: "white", padding: "12px", borderRadius: "8px", width: "100%" }}
                                        value={editingEvent ? editingEvent.name : newEventData.name}
                                        onChange={(e) => editingEvent ? setEditingEvent({...editingEvent, name: e.target.value}) : setNewEventData({...newEventData, name: e.target.value})}
                                    />
                                </div>

                                <div className="input-group">
                                    <label style={{ display: "block", color: "#888", fontSize: "0.7rem", marginBottom: "8px", fontWeight: 700, letterSpacing: "0.5px" }}>PROTOCOL CATEGORY</label>
                                    <select 
                                        className="input-field"
                                        style={{ background: "#1a1a1e", border: "1px solid #333", color: "white", padding: "12px", borderRadius: "8px", width: "100%", cursor: "pointer" }}
                                        value={editingEvent ? editingEvent.category : newEventData.category}
                                        onChange={(e) => editingEvent ? setEditingEvent({...editingEvent, category: e.target.value}) : setNewEventData({...newEventData, category: e.target.value})}
                                    >
                                        <option value="technical">Technical Zone</option>
                                        <option value="non-technical">Non-Technical Zone</option>
                                        <option value="cultural">Cultural Stage</option>
                                        <option value="workshop">Skill Workshop</option>
                                    </select>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                                    <div className="input-group">
                                        <label style={{ display: "block", color: "#888", fontSize: "0.7rem", marginBottom: "8px", fontWeight: 700, letterSpacing: "0.5px" }}>ENTRY FEE (₹)</label>
                                        <input 
                                            type="number" className="input-field"
                                            style={{ background: "#1a1a1e", border: "1px solid #333", color: "white", padding: "12px", borderRadius: "8px", width: "100%" }}
                                            value={editingEvent ? editingEvent.registrationFee : newEventData.registrationFee}
                                            onChange={(e) => editingEvent ? setEditingEvent({...editingEvent, registrationFee: e.target.value}) : setNewEventData({...newEventData, registrationFee: e.target.value})}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label style={{ display: "block", color: "#888", fontSize: "0.7rem", marginBottom: "8px", fontWeight: 700, letterSpacing: "0.5px" }}>PARTICIPATION</label>
                                        <select 
                                            className="input-field"
                                            style={{ background: "#1a1a1e", border: "1px solid #333", color: "white", padding: "12px", borderRadius: "8px", width: "100%", cursor: "pointer" }}
                                            value={editingEvent ? editingEvent.type : newEventData.type}
                                            onChange={(e) => editingEvent ? setEditingEvent({...editingEvent, type: e.target.value}) : setNewEventData({...newEventData, type: e.target.value})}
                                        >
                                            <option value="individual">Solo Entry</option>
                                            <option value="team">Team Entry</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label style={{ display: "block", color: "#888", fontSize: "0.7rem", marginBottom: "8px", fontWeight: 700, letterSpacing: "0.5px" }}>TEAM CAPACITY (IF APPLICABLE)</label>
                                    <input 
                                        type="number" className="input-field"
                                        disabled={(editingEvent ? editingEvent.type : newEventData.type) === "individual"}
                                        style={{ 
                                            background: "#1a1a1e", border: "1px solid #333", color: "white", padding: "12px", borderRadius: "8px", width: "100%",
                                            opacity: (editingEvent ? editingEvent.type : newEventData.type) === "individual" ? 0.3 : 1 
                                        }}
                                        value={editingEvent ? editingEvent.teamSize : newEventData.teamSize}
                                        onChange={(e) => editingEvent ? setEditingEvent({...editingEvent, teamSize: e.target.value}) : setNewEventData({...newEventData, teamSize: e.target.value})}
                                    />
                                </div>
                            </div>

                            {/* Right Column: Logistics & Meta */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                                <div className="input-group">
                                    <label style={{ display: "block", color: "#888", fontSize: "0.7rem", marginBottom: "8px", fontWeight: 700, letterSpacing: "0.5px" }}>CHRONOS (DATE)</label>
                                    <input 
                                        className="input-field" 
                                        placeholder="March 05, 2026"
                                        style={{ background: "#1a1a1e", border: "1px solid #333", color: "white", padding: "12px", borderRadius: "8px", width: "100%" }}
                                        value={editingEvent ? editingEvent.date : newEventData.date}
                                        onChange={(e) => editingEvent ? setEditingEvent({...editingEvent, date: e.target.value}) : setNewEventData({...newEventData, date: e.target.value})}
                                    />
                                </div>

                                <div className="input-group">
                                    <label style={{ display: "block", color: "#888", fontSize: "0.7rem", marginBottom: "8px", fontWeight: 700, letterSpacing: "0.5px" }}>OPERATION SECTOR (VENUE)</label>
                                    <input 
                                        className="input-field" 
                                        placeholder="e.g. Main Auditorium"
                                        style={{ background: "#1a1a1e", border: "1px solid #333", color: "white", padding: "12px", borderRadius: "8px", width: "100%" }}
                                        value={editingEvent ? (editingEvent.venue || "") : (newEventData.venue || "")}
                                        onChange={(e) => editingEvent ? setEditingEvent({...editingEvent, venue: e.target.value}) : setNewEventData({...newEventData, venue: e.target.value})}
                                    />
                                </div>

                                <div className="input-group" style={{ height: "100%" }}>
                                    <label style={{ display: "block", color: "#888", fontSize: "0.7rem", marginBottom: "8px", fontWeight: 700, letterSpacing: "0.5px" }}>MISSION BRIEFING (DESCRIPTION)</label>
                                    <textarea 
                                        className="input-field" 
                                        style={{ height: "calc(100% - 24px)", padding: "12px", resize: "none", background: "#1a1a1e", border: "1px solid #333", color: "white", borderRadius: "8px", width: "100%", minHeight: "155px" }}
                                        placeholder="Provide detailed information about the event mission and rules..."
                                        value={editingEvent ? editingEvent.description : newEventData.description}
                                        onChange={(e) => editingEvent ? setEditingEvent({...editingEvent, description: e.target.value}) : setNewEventData({...newEventData, description: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div style={{ 
                            padding: "1.5rem 2rem", 
                            background: "#16161a", 
                            borderTop: "1px solid #2a2a2e",
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: "1rem"
                        }}>
                            <button 
                                type="button"
                                onClick={() => { setIsAddingEvent(false); setEditingEvent(null); }}
                                style={{ background: "transparent", border: "1px solid #333", color: "#888", padding: "10px 24px", borderRadius: "8px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600, transition: "0.2s" }}
                                onMouseEnter={(e) => e.target.style.borderColor = "#444"}
                                onMouseLeave={(e) => e.target.style.borderColor = "#333"}
                            >
                                TERMINATE
                            </button>
                            <button 
                                type="button"
                                onClick={isAddingEvent ? handleAddEvent : () => handleUpdateEvent(editingEvent._id, editingEvent)}
                                className="btn-glow"
                                style={{ padding: "10px 32px", fontSize: "0.8rem", fontWeight: 700 }}
                            >
                                {isAddingEvent ? "COMMIT_DATA" : "SAVE_RECORD"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
