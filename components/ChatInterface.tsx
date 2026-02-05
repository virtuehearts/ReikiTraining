"use client";

import { useState, useRef, useEffect } from "react";
import { Send, User, Sparkles } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(scrollToBottom, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/chat");
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          setMessages(data);
        } else {
          setMessages([{ role: "assistant", content: "Greetings, seeker. I am Mya. How may I assist your spirit today?" }]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch messages");
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (res.ok) {
        const reply = await res.json();
        setMessages(prev => [...prev, reply]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: "I'm sorry, I lost my connection to the energy flow. Please try again. Blessings." }]);
      }
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[70vh] max-w-4xl mx-auto bg-background-alt/30 backdrop-blur-xl rounded-3xl border border-primary/20 shadow-2xl overflow-hidden">
      {/* Messages */}
      <div className="flex-grow overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
            <div className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'assistant' ? 'bg-primary/40 border border-accent/30' : 'bg-accent/20 border border-accent/10'}`}>
                {msg.role === 'assistant' ? <Sparkles size={16} className="text-accent" /> : <User size={16} className="text-foreground-muted" />}
              </div>
              <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                msg.role === 'assistant'
                  ? 'bg-primary/20 text-foreground border border-primary/10 rounded-tl-none'
                  : 'bg-accent/10 text-foreground border border-accent/10 rounded-tr-none'
              }`}>
                {msg.content}
                {msg.role === 'assistant' && msg.content.includes("Blessings") && (
                   <p className="mt-4 font-script text-xl text-accent">Blessings, Mya</p>
                )}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start animate-pulse">
            <div className="bg-primary/10 p-4 rounded-2xl text-accent italic text-xs">Mya is reflecting on the energy...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-6 bg-background-alt/50 border-t border-primary/10">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message to Mya..."
            className="w-full bg-background border border-primary/20 rounded-full py-4 px-6 pr-14 text-foreground focus:outline-none focus:border-accent transition-all placeholder:text-foreground-muted/40"
          />
          <button
            onClick={handleSend}
            disabled={loading}
            className="absolute right-2 p-3 bg-gradient-to-r from-primary to-primary-light text-white rounded-full hover:scale-105 transition-all shadow-lg disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
