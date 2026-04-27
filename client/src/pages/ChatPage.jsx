import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { Send, Mic, Loader2, Bot, User, Sparkles } from "lucide-react";
import { getChatHistory, deleteChatHistory, sendMessage } from "../apis"; // adjust path

function ChatPage() {
  const navigate = useNavigate();
  const bottomRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [listening, setListening] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);

  const userId = localStorage.getItem("userId") || "1";

  // Speech recognition setup (unchanged)
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

  // Load history using API utility
  const loadHistory = async () => {
    try {
      const data = await getChatHistory(userId);
      const messagesList = Array.isArray(data) ? data : data.messages || [];
      if (messagesList.length > 0) {
        setMessages(messagesList.map((m) => ({ text: m.message, bot: m.is_bot })));
      } else {
        setMessages([{
          text: "Hi 👋 I'm your civic assistant. How can I help you?",
          bot: true,
          options: ["Report", "Track", "Map", "My Complaints"],
        }]);
      }
    } catch (err) {
      console.error("Load history failed:", err);
      setMessages([{
        text: "Hi 👋 I'm your civic assistant. How can I help you?",
        bot: true,
        options: ["Report", "Track", "Map", "My Complaints"],
      }]);
    }
  };

  // Send message using API utility
  const sendUserMessage = async (text) => {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { text: text.trim(), bot: false }]);
    setInput("");
    setTyping(true);

    try {
      const data = await sendMessage({ userId, message: text });
      setTimeout(() => {
        setTyping(false);
        speak(data.reply);
        setMessages((prev) => [
          ...prev,
          {
            text: data.reply,
            bot: true,
            route: data.route,
            options: ["Report", "Track", "Map", "My Complaints"],
          },
        ]);
      }, 500);
    } catch (err) {
      console.error("Send message failed:", err);
      setTyping(false);
      setMessages((prev) => [
        ...prev,
        { text: "⚠️ Sorry, I'm having trouble. Please try again later.", bot: true },
      ]);
    }
  };

  // Clear chat using API utility
  const clearChat = async () => {
    setClearLoading(true);
    try {
      await deleteChatHistory(userId);
      setMessages([{
        text: "Chat cleared. How can I help you?",
        bot: true,
        options: ["Report", "Track", "Map", "My Complaints"],
      }]);
    } catch (err) {
      console.error("Clear chat failed:", err);
    } finally {
      setClearLoading(false);
    }
  };

  useEffect(() => {
    if (messages.length === 0) loadHistory();
    else bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startListening = () => {
    if (!recognition) return alert("Voice not supported");
    setListening(true);
    recognition.start();
  };

  const handleKeyPress = (e) => e.key === "Enter" && sendUserMessage(input);
  const handleNavigate = (route) => route && navigate(route);

  // The JSX remains exactly the same (no visual changes)
  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-70px)] bg-gradient-to-br from-slate-900/80 via-indigo-900/20 to-slate-900 backdrop-blur-sm">
        {/* Header */}
        <div className="border-b border-white/10 bg-white/5 backdrop-blur-md px-6 py-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg">
                <Bot className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
                  AI Assistant
                </h1>
                <p className="text-white/60 text-sm flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Your 24/7 civic companion
                </p>
              </div>
            </div>
            <button
              onClick={clearChat}
              disabled={clearLoading}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 transition flex items-center gap-2 text-sm backdrop-blur-sm"
            >
              {clearLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "🧹"}
              Clear chat
            </button>
          </div>
        </div>

        {/* Messages (unchanged) */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 custom-scroll">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex animate-fade-in-up ${msg.bot ? "justify-start" : "justify-end"}`}
            >
              <div className={`flex max-w-[85%] gap-3 ${msg.bot ? "flex-row" : "flex-row-reverse"}`}>
                <div className="flex-shrink-0">
                  {msg.bot ? (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center shadow-md">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-sm">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                <div
                  className={`relative rounded-2xl px-5 py-3 shadow-md ${
                    msg.bot
                      ? "bg-white/10 backdrop-blur-md border border-white/20 text-white/90"
                      : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  {msg.route && (
                    <button
                      onClick={() => handleNavigate(msg.route)}
                      className="mt-3 flex items-center gap-1 text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-full hover:bg-indigo-700 transition shadow-md"
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
                          className="text-xs bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-full transition"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {typing && (
            <div className="flex justify-start animate-fade-in">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center shadow-md">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-3 flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150"></span>
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-300"></span>
                  </div>
                  <span className="text-sm text-white/70">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input (unchanged) */}
        <div className="border-t border-white/10 bg-white/5 backdrop-blur-lg p-4 shadow-inner">
          <div className="max-w-5xl mx-auto flex gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask me anything about civic issues..."
              rows={1}
              className="flex-1 resize-none rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
            <button
              onClick={startListening}
              className={`px-4 rounded-xl transition ${
                listening
                  ? "bg-red-500 text-white animate-pulse"
                  : "bg-white/20 hover:bg-white/30 text-white"
              }`}
            >
              <Mic className="w-5 h-5" />
            </button>
            <button
              onClick={() => sendUserMessage(input)}
              disabled={!input.trim()}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
            >
              <Send className="w-4 h-4" /> Send
            </button>
          </div>
          <p className="text-xs text-white/40 text-center mt-2">
            ✨ Powered by advanced AI – your personal civic companion
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in-up { animation: fade-in-up 0.3s ease-out; }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
        .custom-scroll::-webkit-scrollbar { width: 5px; }
        .custom-scroll::-webkit-scrollbar-track { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.3); border-radius: 10px; }
      `}</style>
    </Layout>
  );
}

export default ChatPage;