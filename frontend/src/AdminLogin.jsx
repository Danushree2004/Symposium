import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Lock, Mail, ArrowRight, ShieldCheck, Activity, Terminal, Fingerprint } from "lucide-react";

const AdminLogin = () => {
    const [formData, setFormData] = useState({ email: "", password: "" });
    const [isHovered, setIsHovered] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post("http://localhost:5000/users/login", formData);
            if (res.data.user.role === "admin" || res.data.user.role === "event-admin") {
                localStorage.setItem("user", JSON.stringify(res.data.user));
                localStorage.setItem("token", res.data.token);
                window.location.href = "/admin";
            } else {
                alert("CRITICAL ERROR: Unauthorized access attempt detected.");
            }
        } catch (err) {
            alert(err.response?.data?.msg || "Authentication Failed");
        }
    };

    return (
        <div style={{ 
            minHeight: "100vh", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            background: "radial-gradient(circle at center, #0a0a0f 0%, #000 100%)",
            position: "relative",
            overflow: "hidden"
        }}>
            {/* Background Animated Elements */}
            <div style={{ position: "absolute", inset: 0, opacity: 0.1, pointerEvents: "none" }}>
                <div style={{ position: "absolute", top: "10%", left: "10%", width: "400px", height: "400px", background: "var(--accent-primary)", borderRadius: "50%", filter: "blur(180px)", animation: "pulse 8s infinite" }}></div>
                <div style={{ position: "absolute", bottom: "10%", right: "10%", width: "300px", height: "300px", background: "#7000ff", borderRadius: "50%", filter: "blur(150px)", animation: "pulse 12s infinite reverse" }}></div>
            </div>

            <div 
                className="glass-card" 
                style={{ 
                    width: "100%", 
                    maxWidth: "450px", 
                    padding: "3.5rem",
                    border: "1px solid rgba(0, 210, 255, 0.2)",
                    background: "rgba(10, 10, 15, 0.8)",
                    backdropFilter: "blur(20px)",
                    boxShadow: isHovered ? "0 0 50px rgba(0, 210, 255, 0.15)" : "0 0 30px rgba(0, 0, 0, 0.5)",
                    transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                    position: "relative"
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Decorative Terminal Header */}
                <div style={{ 
                    position: "absolute", 
                    top: 0, 
                    left: 0, 
                    right: 0, 
                    height: "30px", 
                    background: "rgba(0, 210, 255, 0.05)", 
                    borderBottom: "1px solid rgba(0, 210, 255, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    padding: "0 15px",
                    gap: "6px"
                }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ff5f56" }}></div>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ffbd2e" }}></div>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#27c93f" }}></div>
                    <span style={{ fontSize: "0.6rem", color: "rgba(0, 210, 255, 0.4)", marginLeft: "auto", letterSpacing: "2px", fontWeight: 800 }}>ORION.SEC_AUTH_V4</span>
                </div>

                <div style={{ textAlign: "center", marginBottom: "3rem" }}>
                    <div style={{ 
                        width: "70px", 
                        height: "70px", 
                        background: "rgba(0, 210, 255, 0.05)", 
                        borderRadius: "18px", 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center",
                        margin: "0 auto 1.5rem",
                        border: "1px solid rgba(0, 210, 255, 0.2)",
                        boxShadow: "0 0 20px rgba(0, 210, 255, 0.1)"
                    }}>
                        <ShieldCheck color="#00d2ff" size={38} style={{ filter: "drop-shadow(0 0 10px rgba(0, 210, 255, 0.5))" }} />
                    </div>
                    <h2 style={{ 
                        fontSize: "1.8rem", 
                        fontWeight: 900, 
                        color: "white", 
                        letterSpacing: "-0.5px",
                        margin: 0
                    }}>COMMAND CENTER</h2>
                    <p style={{ 
                        color: "rgba(0, 210, 255, 0.6)", 
                        fontSize: "0.7rem", 
                        fontWeight: 700, 
                        letterSpacing: "4px",
                        marginTop: "8px",
                        textTransform: "uppercase"
                    }}>Secure Administrator Login</p>
                </div>
                
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.8rem" }}>
                    <div style={{ position: "relative" }}>
                        <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 800, color: "rgba(255,255,255,0.4)", marginBottom: "8px", letterSpacing: "1px" }}>CREDENTIAL_ID</label>
                        <div style={{ position: "relative" }}>
                            <Mail size={16} style={{ position: "absolute", left: "18px", top: "50%", transform: "translateY(-50%)", color: "rgba(0, 210, 255, 0.4)" }} />
                            <input 
                                className="input-field" 
                                style={{ 
                                    paddingLeft: "50px", 
                                    background: "rgba(255,255,255,0.03)", 
                                    height: "55px", 
                                    border: "1px solid rgba(255,255,255,0.05)",
                                    fontSize: "0.85rem",
                                    letterSpacing: "0.5px"
                                }} 
                                type="email" 
                                placeholder="admin@orion2k27.com" 
                                onChange={(e) => setFormData({...formData, email: e.target.value})} 
                                required 
                            />
                        </div>
                    </div>

                    <div style={{ position: "relative" }}>
                        <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 800, color: "rgba(255,255,255,0.4)", marginBottom: "8px", letterSpacing: "1px" }}>AUTH_PHRASE</label>
                        <div style={{ position: "relative" }}>
                            <Lock size={16} style={{ position: "absolute", left: "18px", top: "50%", transform: "translateY(-50%)", color: "rgba(0, 210, 255, 0.4)" }} />
                            <input 
                                className="input-field" 
                                style={{ 
                                    paddingLeft: "50px", 
                                    background: "rgba(255,255,255,0.03)", 
                                    height: "55px", 
                                    border: "1px solid rgba(255,255,255,0.05)",
                                    fontSize: "0.85rem"
                                }} 
                                type="password" 
                                placeholder="••••••••••••" 
                                onChange={(e) => setFormData({...formData, password: e.target.value})} 
                                required 
                            />
                        </div>
                    </div>

                    <div style={{ marginTop: "1rem" }}>
                        <button 
                            type="submit" 
                            className="btn-primary" 
                            style={{ 
                                width: "100%", 
                                height: "60px", 
                                borderRadius: "12px",
                                display: "flex", 
                                alignItems: "center", 
                                justifyContent: "center",
                                gap: "12px",
                                background: "rgba(0, 210, 255, 0.1)",
                                border: "1px solid rgba(0, 210, 255, 0.4)",
                                color: "#00d2ff",
                                fontWeight: 800,
                                fontSize: "0.9rem",
                                letterSpacing: "2px",
                                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
                                transition: "all 0.3s"
                            }}
                        >
                            INITIATE SYSTEM ACCESS <ArrowRight size={18} />
                        </button>
                        
                        <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginTop: "2rem", opacity: 0.3 }}>
                            <Activity size={14} />
                            <Terminal size={14} />
                            <Fingerprint size={14} />
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;