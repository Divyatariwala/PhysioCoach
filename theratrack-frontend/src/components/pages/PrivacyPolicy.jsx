import React, { useEffect } from "react";
import "../css/PrivacyPolicy.css";
import { FaUserShield, FaLock, FaDatabase, FaCookieBite, FaChild, FaEnvelope } from "react-icons/fa";

const sections = [
  { id: "intro", title: "Introduction", content: "This Privacy and Data Protection Policy describes how TheraTrack collects, processes, and protects participant information in compliance with the UK Data Protection Act 2018, GDPR 2018, and University of Westminster ethical standards. TheraTrack is an academic project exploring AI-driven posture detection to improve exercise performance and safety.", icon: <FaUserShield /> },
  { id: "purpose", title: "Purpose of Data Collection", content: "Data is collected strictly for academic research to evaluate posture and exercise detection accuracy, AI feedback effectiveness, and system usability. Data will never be sold, shared, or used for marketing purposes.", icon: <FaLock /> },
  { id: "data", title: "Data Collected", content: "Posture metrics, session details, and system-generated feedback are collected. No video, audio, or identifiable images are stored. No personal identifiers are recorded beyond login or consent.", icon: <FaDatabase /> },
  { id: "cookies", title: "Cookies and Session Data", content: "TheraTrack uses only essential cookies and temporary session data for secure login and smooth operation. No tracking, advertising, or third-party cookies are used.", icon: <FaCookieBite /> },
  { id: "children", title: "Children’s Privacy", content: "Only adults (18+) may participate. Data from minors is immediately deleted, ensuring compliance with UK GDPR.", icon: <FaChild /> },
  { id: "contact", title: "Contact Information", content: "Researcher: w2036107@westminster.ac.uk | Supervisor: E.Majeed@westminster.ac.uk | School of Computer Science and Engineering, University of Westminster, London, UK", icon: <FaEnvelope /> },
];

const PrivacyPolicy = () => {
  useEffect(() => {
    const reveal = () => {
      const items = document.querySelectorAll(".policy-card");
      const windowHeight = window.innerHeight;
      items.forEach(item => {
        const top = item.getBoundingClientRect().top;
        if (top < windowHeight - 50) {
          item.classList.add("active");
        }
      });
    };
    window.addEventListener("scroll", reveal);
    reveal();
    return () => window.removeEventListener("scroll", reveal);
  }, []);

  return (
    <div className="privacy-page" style={{ background: "#e0f1e7", minHeight: "100vh", padding: "4rem 2rem" }}>
      <div className="privacy-container">
        {/* Sidebar */}
        <aside className="sidebar">
          <ul>
            {sections.map((sec) => (
              <li key={sec.id}>
                <a href={`#${sec.id}`} className="scroll-link">
                  <span className="link-icon">{sec.icon}</span>
                  {sec.title}
                </a>
              </li>
            ))}
          </ul>
        </aside>

        {/* Main Content */}
        <main className="content">
          {sections.map((sec, idx) => (
            <div className="policy-card" id={sec.id} key={idx}>
              <div className="card-icon">{sec.icon}</div>
              <h2>{sec.title}</h2>
              <p>{sec.content}</p>
            </div>
          ))}
        </main>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
