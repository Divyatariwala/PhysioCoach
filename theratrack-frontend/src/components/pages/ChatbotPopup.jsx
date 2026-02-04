import { useState, useEffect } from "react";
import chatbot from "../../assets/images/chatbot.png";
import styles from "../css/Chatbot.module.css";

export default function ChatbotPopup({ footerVisible }) {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [liftUp, setLiftUp] = useState(false);
    const [sessionId, setSessionId] = useState(null);

    // Lift button on scroll
    useEffect(() => {
        const handleScroll = () => setLiftUp(window.scrollY > 100);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Initial greeting
    useEffect(() => {
        if (open && messages.length === 0) {
            const greeting = "Hello! 👋 I’m TheraBot, your health assistant. How can I help you today?";
            let index = 0;
            const interval = setInterval(() => {
                setMessages([{ from: "bot", text: greeting.slice(0, index) }]);
                index++;
                if (index > greeting.length) clearInterval(interval);
            }, 35);
        }
    }, [open]);

    const sendToChatbot = async (message) => {
        try {
            const response = await fetch("http://localhost:8000/api/chat/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message, session_id: sessionId }),
            });
            const data = await response.json();
            if (data.session_id) setSessionId(data.session_id);
            return data.reply;
        } catch {
            return "Server not responding.";
        }
    };

    const spawnEmoji = (emoji) => {
        const emojiEl = document.createElement('div');
        emojiEl.className = styles.emojiFloat;
        emojiEl.style.left = Math.random() * 80 + '%';
        emojiEl.style.top = '90%';
        emojiEl.textContent = emoji;
        document.querySelector(`.${styles.chatbotBody}`)?.appendChild(emojiEl);
        setTimeout(() => emojiEl.remove(), 3000);
    };

    const handleSendMessage = async (text = null) => {
        const msgText = text || input;
        if (!msgText.trim()) return;

        setMessages(prev => [...prev, { from: "user", text: msgText }]);
        setInput("");
        setLoading(true);

        const botReply = await sendToChatbot(msgText);
        setMessages(prev => [...prev, { from: "bot", text: botReply }]);
        setLoading(false);

        ['💧', '🏃', '🥗', '🧘‍♀️', '🍎'].forEach(e => spawnEmoji(e));
    };

    return (
        <>
            {/* Floating Button */}
            <button 
                className={`${styles.btnBackground} ${liftUp ? styles.liftUp : ""} ${footerVisible ? styles.footerActive : ""}`} 
                onClick={() => setOpen(!open)}
            >
                <div className={`${styles.chatbotButton} ${footerVisible ? styles.footerActive : ""} `}>
                    <img src={chatbot} alt="Chatbot" 
                    />
                </div>
            </button>

            {/* Chat Popup */}
            {open && (
                <div className={styles.chatbotPopup}>
                    {/* Header */}
                    <div className={styles.chatbotHeader}>
                        <div className={styles.botInfo}>
                            <span className={styles.botName}>TheraBot</span>
                            <span className={styles.online}>Online</span>
                        </div>
                        <span className={styles.closeBtn} onClick={() => setOpen(false)}>✖</span>
                    </div>

                    {/* Chat Body */}
                    <div className={styles.chatbotBody}>
                        {messages.map((m, i) => (
                            <div key={i} className={`${styles.chatMsg} ${m.from === "user" ? styles.userMsg : styles.botMsg}`}>
                                {m.text}
                            </div>
                        ))}
                        {loading && <div className={`${styles.chatMsg} ${styles.botMsg} ${styles.typing}`}>🤖 TheraBot is typing...</div>}
                    </div>

                    {/* Quick Replies */}
                    <div className={styles.quickReplies}>
                        <button className={styles.quickBtn} onClick={() => handleSendMessage("Tell me a health tip")}>Health Tip</button>
                        <button className={styles.quickBtn} onClick={() => handleSendMessage("Daily exercise suggestion")}>Exercise</button>
                        <button className={styles.quickBtn} onClick={() => handleSendMessage("Motivation")}>Motivation</button>
                    </div>

                    {/* Footer Input */}
                    <div className={styles.chatbotFooter}>
                        <input
                            type="text"
                            placeholder="Ask me anything..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                            disabled={loading}
                        />
                        <button onClick={() => handleSendMessage()} disabled={loading}>➤</button>
                    </div>
                </div>
            )}
        </>
    );
}
