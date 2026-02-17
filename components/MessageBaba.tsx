"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Send, MessageSquare, X } from "lucide-react";

export default function MessageBaba() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
    }
  }, [isOpen]);

  useEffect(scrollToBottom, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/messages");
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error("Failed to fetch messages");
    }
  };

  const handleSend = async (isBooking = false) => {
    if (!input.trim() && !isBooking) return;

    const content = isBooking ? "I would like to book a private session with Baba Virtuehearts." : input;
    setLoading(true);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, isBooking }),
      });

      if (res.ok) {
        const newMessage = await res.json();
        setMessages(prev => [...prev, newMessage]);
        if (!isBooking) setInput("");
      }
    } catch (err) {
      console.error("Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 text-foreground-muted hover:text-accent transition-colors"
      >
        <MessageSquare size={20} />
        <span>Message Baba</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center px-3 pb-4 pt-20 sm:px-4 sm:pt-24 bg-black/60 backdrop-blur-sm">
          <div className="bg-background-alt border border-primary/20 rounded-3xl w-full max-w-lg max-h-[calc(100vh-6rem)] flex flex-col shadow-2xl animate-in zoom-in-95 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-primary/10 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-xl font-serif text-accent">Message Baba Virtuehearts</h3>
                <p className="text-xs text-foreground-muted">Direct communication with your guide</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close message window"
                className="h-9 w-9 rounded-full border border-primary/20 flex items-center justify-center text-foreground-muted hover:text-accent hover:border-accent/40 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-grow min-h-0 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-8 text-foreground-muted italic text-sm">
                  No messages yet. Send your first message or a booking request below.
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.senderId === session?.user?.id ? 'justify-end' : 'justify-start'}`}>
                   <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                     msg.isBooking ? 'bg-accent/20 border border-accent/30' :
                     'bg-primary/20 border border-primary/10'
                   }`}>
                     {msg.isBooking && <p className="text-[10px] uppercase tracking-tighter text-accent font-bold mb-1">Booking Request</p>}
                     <p>{msg.content}</p>
                     <p className="text-[10px] text-foreground-muted mt-1 text-right">
                       {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                     </p>
                   </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-6 border-t border-primary/10 space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type your message..."
                  className="flex-grow bg-background border border-primary/20 rounded-full py-2 px-4 text-sm focus:outline-none focus:border-accent"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={loading}
                  className="p-2 bg-accent text-background rounded-full hover:scale-105 transition-all disabled:opacity-50"
                >
                  <Send size={18} />
                </button>
              </div>
              <button
                onClick={() => handleSend(true)}
                disabled={loading}
                className="w-full py-2 border border-accent/40 text-accent rounded-full text-xs font-bold hover:bg-accent/10 transition-colors"
              >
                Request Private Booking Session
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
