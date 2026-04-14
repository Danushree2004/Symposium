import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { User, Mail, Lock, Building, ArrowRight } from "lucide-react";

const Register = () => {
    const [formData, setFormData] = useState({ name: "", email: "", password: "", college: "" });
    const [isLogin, setIsLogin] = useState(false);
    const [loading, setLoading] = useState(false);
    const [statusMsg, setStatusMsg] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatusMsg(isLogin ? "Authenticating..." : "Creating profile & sending verification email...");
        try {
            const url = isLogin ? "http://localhost:5000/users/login" : "http://localhost:5000/users/register";
            const res = await axios.post(url, formData);
            if (isLogin) {
                setStatusMsg("Success! Redirecting...");
                // IMPORTANT: Ensure the structure matches what App.jsx expects
                const userData = res.data.user;
                localStorage.setItem("user", JSON.stringify(userData));
                localStorage.setItem("token", res.data.token);
                
                // Force a page reload to ensure App.jsx picks up the new localStorage state
                setTimeout(() => {
                    window.location.href = "/";
                }, 1000);
            } else {
                setStatusMsg(res.data.msg || "Account created! Please check your email.");
                alert(res.data.msg || "Account created! Please check your email to verify your account.");
                setIsLogin(true);
                setLoading(false);
            }
        } catch (err) {
            const errorMsg = err.response?.data?.msg || err.response?.data?.message || "Auth Error";
            setStatusMsg(`Error: ${errorMsg}`);
            alert(errorMsg);
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", background: "radial-gradient(circle at center, #0a0a0a 0%, #000 100%)", position: "relative", overflow: "hidden" }}>
            {/* Animated Background Elements */}
            <div style={{ position: "absolute", top: "10%", left: "5%", width: "300px", height: "300px", background: "rgba(0, 210, 255, 0.03)", filter: "blur(80px)", borderRadius: "50%", animation: "pulse 8s infinite alternate" }}></div>
            <div style={{ position: "absolute", bottom: "10%", right: "5%", width: "400px", height: "400px", background: "rgba(255, 64, 128, 0.03)", filter: "blur(100px)", borderRadius: "50%", animation: "pulse 10s infinite alternate-reverse" }}></div>

            <div className="glass-card" style={{ 
                width: "100%", 
                maxWidth: "480px", 
                padding: "3.5rem 2.5rem", 
                position: "relative", 
                border: "1px solid rgba(0, 210, 255, 0.1)",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 210, 255, 0.05)",
                background: "rgba(10, 10, 10, 0.7)",
                backdropFilter: "blur(20px)",
                borderRadius: "24px"
            }}>
                {/* Cyberpunk Decorative Corner */}
                <div style={{ position: "absolute", top: 0, left: 0, width: "40px", height: "40px", borderLeft: "3px solid var(--accent-primary)", borderTop: "3px solid var(--accent-primary)", borderTopLeftRadius: "24px" }}></div>
                
                <div style={{ textAlign: "center", marginBottom: "3rem" }}>
                    <div style={{ 
                        display: "inline-flex", 
                        padding: "12px", 
                        borderRadius: "16px", 
                        background: "rgba(0, 210, 255, 0.1)", 
                        color: "var(--accent-primary)",
                        marginBottom: "1.5rem",
                        boxShadow: "0 0 15px rgba(0, 210, 255, 0.2)"
                    }}>
                        <Lock size={32} />
                    </div>
                    <h2 className="hero-title" style={{ 
                        fontSize: "2.5rem", 
                        margin: 0, 
                        letterSpacing: "-1px",
                        WebkitTextStroke: "1px rgba(0, 210, 255, 0.5)",
                        textShadow: "0 0 20px rgba(0, 210, 255, 0.3)"
                    }}>
                        {isLogin ? "IDENTITY GATEWAY" : "CORE UPLOAD"}
                    </h2>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem", marginTop: "10px", letterSpacing: "3px", fontWeight: "900", opacity: 0.6 }}>
                        {isLogin ? "PROTOCOL: AUTH_REQUIRED" : "PROTOCOL: NEW_NEURAL_LINK"}
                    </p>
                    {statusMsg && (
                        <div style={{ 
                            marginTop: "1.5rem", 
                            padding: "10px", 
                            background: statusMsg.startsWith("Error") ? "rgba(255, 64, 128, 0.1)" : "rgba(0, 210, 255, 0.1)", 
                            border: `1px solid ${statusMsg.startsWith("Error") ? "var(--accent-secondary)" : "var(--accent-primary)"}`,
                            borderRadius: "8px",
                            fontSize: "0.8rem",
                            color: statusMsg.startsWith("Error") ? "#ff4080" : "var(--accent-primary)",
                            fontWeight: "bold",
                            animation: "pulse 2s infinite"
                        }}>
                            {statusMsg.toUpperCase()}
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                    {!isLogin && (
                        <div style={{ position: "relative" }}>
                            <User size={18} style={{ position: "absolute", left: "18px", top: "50%", transform: "translateY(-50%)", color: "var(--accent-primary)", opacity: 0.6, zIndex: 1 }} />
                            <input 
                                className="input-cyber" 
                                style={{ paddingLeft: "52px", height: "55px", fontSize: "0.9rem", background: "rgba(0,0,0,0.4)" }} 
                                placeholder="FULL NAME (FOR CERTIFICATE)" 
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                                required 
                            />
                        </div>
                    )}
                    
                    <div style={{ position: "relative" }}>
                        <Mail size={18} style={{ position: "absolute", left: "18px", top: "50%", transform: "translateY(-50%)", color: "var(--accent-primary)", opacity: 0.6, zIndex: 1 }} />
                        <input 
                            className="input-cyber" 
                            style={{ paddingLeft: "52px", height: "55px", fontSize: "0.9rem", background: "rgba(0,0,0,0.4)" }} 
                            type="email" 
                            placeholder="EMAIL ADDRESS" 
                            value={formData.email} 
                            onChange={(e) => setFormData({...formData, email: e.target.value})} 
                            required 
                        />
                    </div>

                    {!isLogin && (
                        <div style={{ position: "relative" }}>
                            <Building size={18} style={{ position: "absolute", left: "18px", top: "50%", transform: "translateY(-50%)", color: "var(--accent-primary)", opacity: 0.6, zIndex: 1 }} />
                            <input 
                                className="input-cyber" 
                                style={{ paddingLeft: "52px", height: "55px", fontSize: "0.9rem", background: "rgba(0,0,0,0.4)" }} 
                                placeholder="COLLEGE / INSTITUTION" 
                                value={formData.college} 
                                onChange={(e) => setFormData({...formData, college: e.target.value})} 
                                required 
                            />
                        </div>
                    )}

                    <div style={{ position: "relative" }}>
                        <Lock size={18} style={{ position: "absolute", left: "18px", top: "50%", transform: "translateY(-50%)", color: "var(--accent-primary)", opacity: 0.6, zIndex: 1 }} />
                        <input 
                            className="input-cyber" 
                            style={{ paddingLeft: "52px", height: "55px", fontSize: "0.9rem", background: "rgba(0,0,0,0.4)" }} 
                            type="password" 
                            placeholder="SECURITY KEY (PASSWORD)" 
                            value={formData.password} 
                            onChange={(e) => setFormData({...formData, password: e.target.value})} 
                            required 
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="btn-glow" 
                        style={{ 
                            width: "100%", 
                            marginTop: "1.5rem", 
                            height: "55px",
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "center", 
                            gap: "12px",
                            fontSize: "1rem",
                            fontWeight: 900,
                            letterSpacing: "2px",
                            background: loading ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg, var(--accent-primary) 0%, #3a7bd5 100%)",
                            color: "#000",
                            border: "none",
                            cursor: loading ? "not-allowed" : "pointer",
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? "PROCESSING..." : (isLogin ? "INITIATE ACCESS" : "GENERATE PROFILE")} <ArrowRight size={20} />
                    </button>
                </form>

                <div style={{ marginTop: "3rem", textAlign: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1.5rem" }}>
                        <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.05)" }}></div>
                        <span style={{ fontSize: "0.65rem", opacity: 0.4, letterSpacing: "2px" }}>OR</span>
                        <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.05)" }}></div>
                    </div>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: 0 }}>
                        {isLogin ? "LACKING NEURAL IDENTITY?" : "IDENTITY ALREADY STORED?"} {" "}
                        <span 
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setFormData({ name: "", email: "", password: "", college: "" });
                            }} 
                            style={{ 
                                color: "var(--accent-primary)", 
                                cursor: "pointer", 
                                fontWeight: "900", 
                                textDecoration: "none",
                                marginLeft: "5px",
                                borderBottom: "1px solid var(--accent-primary)",
                                paddingBottom: "2px"
                            }}
                        >
                            {isLogin ? "INITIALIZE NOW" : "LOGIN PORTAL"}
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
