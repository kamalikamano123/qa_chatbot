import { useState, useRef, useEffect } from "react";
import axios from "axios";

function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [marks, setMarks] = useState(5);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { text: input, sender: "user" };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/chat",
        { question: input, marks: marks }
      );

      const botMessage = {
        text: res.data.answer || res.data.error,
        sender: "bot"
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        { text: "Server error.", sender: "bot" }
      ]);
    } finally {
      setLoading(false);
      setInput("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="message bot" style={{ alignSelf: 'center', marginTop: '20px', background: 'transparent', border: 'none', color: '#14b8a6', opacity: 0.8 }}>
            Upload a PDF or paste a YouTube link to get started!
          </div>
        )}
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message ${msg.sender === "user" ? "user" : "bot"}`}
            style={{ whiteSpace: 'pre-wrap' }}
          >
            {msg.text}
          </div>
        ))}
        {loading && (
          <div className="message bot" style={{ opacity: 0.6 }}>
            QA Study Buddy is thinking...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-controls">
        <select
          className="marks-select"
          value={marks}
          onChange={(e) => setMarks(Number(e.target.value))}
          title="Detail level (Marks)"
        >
          <option value={2}>2 Marks (Concise)</option>
          <option value={5}>5 Marks (Explained)</option>
          <option value={10}>10 Marks (Detailed)</option>
        </select>

        <div className="chat-input">
          <input
            type="text"
            placeholder="Ask a question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <button className="send-btn" onClick={sendMessage} disabled={loading}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default Chat;
