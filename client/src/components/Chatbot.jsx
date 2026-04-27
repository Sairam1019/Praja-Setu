import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getChatHistory, deleteChatHistory, sendMessage } from "../apis";

export default function Chatbot() {
  const navigate = useNavigate();
  const bottomRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [listening, setListening] = useState(false);

  const userId = localStorage.getItem("userId") || "1";

  // Speech Recognition
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = SpeechRecognition ? new SpeechRecognition() : null;

  if (recognition) {
    recognition.continuous = false;
    recognition.lang = "en-US";
    recognition.onresult = (e) => {
      const text = e.results[0][0].transcript;
      sendUserMessage(text);
      setListening(false);
    };
    recognition.onerror = () => setListening(false);
  }

  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
  };

  /* ===========================
     LOAD HISTORY
  =========================== */
  const loadHistory = async () => {
    try {
      const data = await getChatHistory(userId);
      const messagesList = Array.isArray(data) ? data : data.messages || [];

      if (messagesList.length > 0) {
        setMessages(
          messagesList.map((m) => ({
            text: m.message,
            bot: m.is_bot,
          }))
        );
      } else {
        setMessages([
          {
            text: "Hi 👋 I'm your civic assistant. How can I help you?",
            bot: true,
            options: ["Report", "Track", "Map", "My Complaints"],
          },
        ]);
      }
    } catch (err) {
      console.error("Load history failed:", err);
      setMessages([
        {
          text: "Hi 👋 I'm your civic assistant. How can I help you?",
          bot: true,
          options: ["Report", "Track", "Map", "My Complaints"],
        },
      ]);
    }
  };

  /* ===========================
     SEND MESSAGE (FIXED – includes userId)
  =========================== */
  const sendUserMessage = async (text) => {
    if (!text.trim()) return;

    setMessages((prev) => [...prev, { text: text.trim(), bot: false }]);
    setInput("");
    setTyping(true);

    console.log("📤 Sending payload:", { message: text, userId });

    try {
      // ✅ Include userId in the payload (backend expects it)
      const data = await sendMessage({ message: text, userId });

      setTimeout(() => {
        setTyping(false);
        const replyText = data.reply || "I didn't understand that. Please try again.";
        speak(replyText);

        setMessages((prev) => [
          ...prev,
          {
            text: replyText,
            bot: true,
            route: data.route,
            options: ["Report", "Track", "Map", "My Complaints"],
          },
        ]);
      }, 500);
    } catch (err) {
      console.error("Send message failed:", err);
      setTyping(false);

      // Try to extract server error message if available
      let errorMessage = "Sorry, I'm having trouble. Please try again later.";
      if (err.message && err.message !== "Something went wrong") {
        errorMessage = err.message;
      } else if (err.response && err.response.data && err.response.data.message) {
        errorMessage = err.response.data.message;
      }

      setMessages((prev) => [
        ...prev,
        {
          text: errorMessage,
          bot: true,
        },
      ]);
    }
  };

  /* ===========================
     CLEAR CHAT
  =========================== */
  const clearChat = async () => {
    try {
      await deleteChatHistory(userId);
      setMessages([
        {
          text: "Chat cleared. How can I help you?",
          bot: true,
          options: ["Report", "Track", "Map", "My Complaints"],
        },
      ]);
    } catch (err) {
      console.error("Clear chat failed:", err);
    }
  };

  useEffect(() => {
    if (isOpen && !isMinimized)
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen, isMinimized]);

  useEffect(() => {
    if (isOpen && !isMinimized && messages.length === 0) loadHistory();
  }, [isOpen, isMinimized]);

  const startListening = () => {
    if (!recognition) return alert("Voice not supported");
    setListening(true);
    recognition.start();
  };

  const handleKeyPress = (e) => e.key === "Enter" && sendUserMessage(input);
  const handleNavigate = (route) => route && navigate(route);

  return (
    <>
      {/* 🤖 FLOAT BUTTON */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-5 right-5 z-50 w-16 h-16 rounded-full bg-gradient-to-r from-[#1e2a47] via-[#243a63] to-[#0f172a] text-white shadow-2xl hover:scale-110 transition-all duration-300 flex items-center justify-center"
      >
        <span className="text-3xl">🤖</span>
      </button>

      {/* CHAT PANEL */}
      {isOpen && (
        <div
          className={`fixed bottom-24 right-5 z-50 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
            isMinimized
              ? "w-72 h-14"
              : "w-[calc(100%-2rem)] sm:w-96 h-[600px] max-h-[85vh]"
          }`}
        >
          {/* HEADER */}
          <div className="bg-gradient-to-r from-[#1e2a47] via-[#243a63] to-[#0f172a] text-white p-3 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-xl">🤖</span>
              <span className="font-semibold tracking-wide">
                Civic Assistant
              </span>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setIsMinimized(!isMinimized)} className="hover:bg-white/10 px-2 rounded">
                {isMinimized ? "🗖" : "🗕"}
              </button>
              <button onClick={clearChat} className="hover:bg-white/10 px-2 rounded">
                🧹
              </button>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 px-2 rounded">
                ✕
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* CHAT BODY */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white custom-scroll">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${
                      msg.bot ? "justify-start" : "justify-end"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-2xl shadow-sm transition-all ${
                        msg.bot
                          ? "bg-gray-100 text-gray-800 rounded-tl-none"
                          : "bg-gradient-to-r from-[#1e2a47] to-[#243a63] text-white rounded-tr-none shadow-md"
                      }`}
                    >
                      <div className="flex gap-2 items-start">
                        {msg.bot ? <span>🤖</span> : <span>🧑</span>}
                        <p className="text-sm">{msg.text}</p>
                      </div>

                      {msg.route && (
                        <button
                          onClick={() => handleNavigate(msg.route)}
                          className="mt-3 flex items-center gap-1 text-xs bg-indigo-600 text-white px-3 py-1 rounded-full hover:bg-indigo-700 transition"
                        >
                          🚀 Go to page
                        </button>
                      )}

                      {msg.options && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {msg.options.map((opt) => (
                            <button
                              key={opt}
                              onClick={() => sendUserMessage(opt)}
                              className="text-xs bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded-full transition"
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {typing && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 p-3 rounded-xl">
                      <span className="flex gap-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-300"></span>
                      </span>
                    </div>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              {/* INPUT */}
              <div className="p-3 border-t bg-white flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <button
                  onClick={startListening}
                  className={`px-3 rounded ${
                    listening
                      ? "bg-red-500 text-white animate-pulse"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                >
                  🎤
                </button>

                <button
                  onClick={() => sendUserMessage(input)}
                  className="bg-gradient-to-r from-[#1e2a47] to-[#243a63] text-white px-4 rounded hover:opacity-90 transition"
                >
                  ➤
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <style>{`
        .custom-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.2);
          border-radius: 10px;
        }
      `}</style>
    </>
  );
}