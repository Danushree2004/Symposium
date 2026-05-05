import React from "react";
import { Award, Download, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CertificatePreview = ({ isOpen, onClose, data }) => {
  if (!isOpen || !data) return null;

  const { user, event } = data;
  const purple = "#BB00DB";
  const cyan = "#00FFFF";

  const handleDownload = () => {
    const token = localStorage.getItem('token');
    const timestamp = new Date().getTime();
    const downloadUrl = `${window.location.protocol}//${window.location.hostname}:5000/certificates/download/${data._id}?token=${token}&v=${timestamp}`;
    window.open(downloadUrl, '_blank');
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.9)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          backdropFilter: "blur(10px)"
        }}
      >
        <motion.div 
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          style={{
            width: "100%",
            maxWidth: "900px",
            background: "#fff",
            borderRadius: "12px",
            overflow: "hidden",
            position: "relative",
            boxShadow: "0 25px 50px -12px rgba(187, 0, 219, 0.5)"
          }}
        >
          {/* Header Actions */}
          <div style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            display: "flex",
            gap: "10px",
            zIndex: 100
          }}>
            <button 
              onClick={handleDownload}
              style={{
                background: purple,
                border: "none",
                borderRadius: "50%",
                width: "40px",
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#fff"
              }}
              title="Download PDF"
            >
              <Download size={20} />
            </button>
            <button 
              onClick={onClose}
              style={{
                background: "#000",
                border: "none",
                borderRadius: "50%",
                width: "40px",
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#fff"
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Certificate Content - Mirroring PDFKit Logic Precisely */}
          <div style={{
            width: "100%",
            aspectRatio: "841.89 / 595.28", // A4 Landscape
            position: "relative",
            backgroundColor: "#fff",
            color: "#000",
            fontFamily: "'Courier New', Courier, monospace",
            overflow: "hidden"
          }}>
            {/* Corner Triangles Accents */}
            <div style={{ position: "absolute", top: 0, left: 0, width: "180px", height: "180px", background: `linear-gradient(135deg, ${purple} 50%, transparent 50%)`, opacity: 0.9 }} />
            <div style={{ position: "absolute", top: 0, right: 0, width: "150px", height: "150px", background: `linear-gradient(-135deg, ${purple} 50%, transparent 50%)`, opacity: 0.9 }} />
            <div style={{ position: "absolute", bottom: 0, right: 0, width: "200px", height: "200px", background: `linear-gradient(-45deg, ${purple} 50%, transparent 50%)`, opacity: 0.9 }} />
            <div style={{ position: "absolute", bottom: 0, left: 0, width: "120px", height: "120px", background: `linear-gradient(45deg, ${purple} 50%, transparent 50%)`, opacity: 0.9 }} />

            {/* Content Container */}
            <div style={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-start",
              padding: "10px 40px",
              textAlign: "center"
            }}>
              {/* Branding Header Area (Swapped and Sized) */}
              <div style={{ marginBottom: "10px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ height: "50px", width: "120px", background: "#f0f0f0", borderRadius: "5px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", color: "#666", marginBottom: "5px" }}>KEC LOGO</div>
                <div style={{ fontSize: "1.2rem", fontWeight: "bold", color: "#348017" }}>KONGU ENGINEERING COLLEGE</div>
              </div>

              {/* Department Title */}
              <div style={{ 
                color: purple, 
                fontSize: "1.2rem", 
                fontWeight: "bold", 
                marginBottom: "5px",
                textTransform: "uppercase"
              }}>
                Department of Computer Applications
              </div>

              {/* Orion Block */}
              <div style={{
                backgroundColor: "#000",
                padding: "10px 40px",
                marginBottom: "20px",
                width: "60%"
              }}>
                <h1 style={{ 
                  color: cyan, 
                  margin: 0, 
                  fontSize: "2.5rem",
                  fontWeight: "900"
                }}>ORION 2K26</h1>
              </div>

              {/* Certificate Title */}
              <div style={{ 
                fontSize: "1.8rem", 
                fontWeight: "bold", 
                color: "#D4AF37",
                marginBottom: "25px",
                fontStyle: "italic"
              }}>
                Certificate Of Participation
              </div>

              {/* Main Text */}
              <div style={{ 
                fontSize: "1.1rem", 
                lineHeight: "1.6", 
                color: "#000",
                width: "90%",
                textAlign: "justify"
              }}>
                This is to certify that Mr./Ms. <span style={{ color: purple, fontWeight: "bold" }}>{user?.name?.toUpperCase()}</span> of <span style={{ color: purple, fontWeight: "bold" }}>{user?.college?.toUpperCase()}</span> has participated in <span style={{ color: purple, fontWeight: "bold" }}>{event?.name?.toUpperCase()}</span> at the National Level Technical Symposium <span style={{ color: purple, fontWeight: "bold" }}>"ORION 2K26"</span> held on 5<sup>th</sup> March 2026, at <span style={{ color: purple, fontWeight: "bold" }}>KONGU ENGINEERING COLLEGE.</span>
              </div>

              {/* Bottom Branding & Signatures Area */}
              <div style={{
                position: "absolute",
                bottom: "30px",
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center"
              }}>
                {/* Secondary Logo area (Kongu - Swapped to bottom) */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "15px" }}>
                   <div style={{ height: "30px", width: "80px", background: "#f0f0f0", borderRadius: "3px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.5rem", color: "#666", marginBottom: "3px" }}>KONGU LOGO</div>
                   <div style={{ fontSize: "0.7rem", color: "#348017", fontWeight: "bold" }}>ASSURING THE BEST</div>
                </div>
                
                <div style={{
                  width: "80%",
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "20px",
                  padding: "0 40px"
                }}>
                  <div style={{ borderTop: "1px solid #000", paddingTop: "5px", width: "150px", fontSize: "0.7rem", fontWeight: "bold" }}>FACULTY COORDINATOR</div>
                  <div style={{ borderTop: "1px solid #000", paddingTop: "5px", width: "150px", fontSize: "0.7rem", fontWeight: "bold" }}>HOD</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer Info */}
          <div style={{
            padding: "15px",
            background: "#f8f9fa",
            fontSize: "0.8rem",
            color: "#666",
            textAlign: "center",
            borderTop: "1px solid #eee"
          }}>
            This is a digital preview. Download the PDF for the final high-quality version.
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CertificatePreview; 
