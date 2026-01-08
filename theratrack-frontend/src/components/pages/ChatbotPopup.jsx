import { useState, useEffect } from "react";
import "../css/chatbot.css";

export default function ChatbotPopup() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    // Default bot greeting with typing effect
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
            const response = await fetch("http://127.0.0.1:8000/api/chat/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message }),
            });
            if (!response.ok) return `Server error: ${response.status}`;
            const data = await response.json();
            return data.reply;
        } catch {
            return "Server not responding.";
        }
    };

    const spawnEmoji = (emoji) => {
        const emojiEl = document.createElement('div');
        emojiEl.className = 'emoji-float';
        emojiEl.style.left = Math.random() * 80 + '%';
        emojiEl.style.top = '90%';
        emojiEl.textContent = emoji;
        document.querySelector('.chatbot-body').appendChild(emojiEl);
        setTimeout(() => emojiEl.remove(), 3000);
    }

    const handleSendMessage = async (text = null) => {
        const msgText = text || input;
        if (!msgText.trim()) return;

        const userMsg = { from: "user", text: msgText };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        const botReply = await sendToChatbot(msgText);
        setMessages((prev) => [...prev, { from: "bot", text: botReply }]);
        setLoading(false);

        // Spawn emojis randomly for fun
        ['💧', '🏃', '🥗', '🧘‍♀️', '🍎'].forEach(e => spawnEmoji(e));
    };

    return (
        <>
            <button className="chatbot-button" onClick={() => setOpen(!open)}>💬</button>

            {open && (
                <div className="chatbot-popup">
                    <div className="chatbot-header">
                        <span className="bot-avatar">🤖</span>
                        <div className="bot-info">
                            <span className="bot-name">TheraBot</span>
                            <span className="online">Online</span>
                        </div>
                        <span className="close-btn" onClick={() => setOpen(false)}>✖</span>
                    </div>

                    <div className="chatbot-body">
                        {messages.map((m, i) => (
                            <div key={i} className={`chat-msg ${m.from === "user" ? "user-msg" : "bot-msg"}`}>
                                {m.text}
                            </div>
                        ))}
                        {loading && <div className="chat-msg bot-msg typing">🤖 TheraBot is typing...</div>}
                    </div>

                    <div className="quick-replies">
                        <button className="quick-btn" onClick={() => handleSendMessage("Tell me a health tip")}>Health Tip</button>
                        <button className="quick-btn" onClick={() => handleSendMessage("Daily exercise suggestion")}>Exercise</button>
                        <button className="quick-btn" onClick={() => handleSendMessage("Motivation")}>Motivation</button>
                    </div>

                    <div className="chatbot-footer">
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
