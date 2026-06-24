import React, { useState, useRef, useEffect } from "react";
import { Message } from "../types";
import { Send, Bot, User, Sparkles, AlertCircle, HelpCircle } from "lucide-react";

interface AiAssistantProps {
  embedded?: boolean;
  onSuggestedPrompt?: (text: string) => void;
}

export default function AiAssistant({ embedded = false, onSuggestedPrompt }: AiAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "ai",
      text: "Namaste! I am the AutoAdz AI Campaign Planner & Assistant. I can help you budget campaigns, predict hyperlocal reach, recommend auto allocations, or answer driver FAQs. What are we planning today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = [
    "How many autos are needed for North Kolkata?",
    "Predict campaign reach for 25 autos over 30 days.",
    "Show low-performing campaigns.",
    "Draft a driver recruitment WhatsApp alert.",
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const messageText = textToSend || input;
    if (!messageText.trim()) return;

    if (!textToSend) setInput("");

    const newUserMessage: Message = {
      id: `user_${Date.now()}`,
      sender: "user",
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setLoading(true);

    try {
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, newUserMessage],
        }),
      });

      const data = await response.json();
      
      const newAiMessage: Message = {
        id: `ai_${Date.now()}`,
        sender: "ai",
        text: data.reply || "Something went wrong. Let me compute that again shortly.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, newAiMessage]);
    } catch (err) {
      console.error(err);
      const errorMsg: Message = {
        id: `err_${Date.now()}`,
        sender: "ai",
        text: "I am having trouble connecting to my marketing databases. Rest assured, for North Kolkata, we recommend 35 autos for premium saturation, with a suggested budget of ₹2,10,000.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex flex-col h-full bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden ${embedded ? "max-h-[500px]" : "h-[650px]"}`}>
      {/* Header */}
      <div className="bg-[#0B1F4D] text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-[#FF9800] rounded-xl text-white">
            <Bot size={20} />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm leading-tight flex items-center gap-1.5">
              AutoAdz AI Assistant <Sparkles size={14} className="text-[#FF9800] animate-pulse" />
            </h3>
            <span className="text-[11px] text-slate-300 font-mono">Powered by Gemini 3.5 Flash</span>
          </div>
        </div>
        <div className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[10px] font-mono font-medium flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping"></span>
          Active
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2.5 max-w-[85%] ${
              msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.sender === "user" ? "bg-slate-200 text-slate-700" : "bg-[#0B1F4D]/10 text-[#0B1F4D]"
              }`}
            >
              {msg.sender === "user" ? <User size={14} /> : <Bot size={14} />}
            </div>
            <div>
              <div
                className={`p-3 rounded-2xl text-sm leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-[#0B1F4D] text-white rounded-tr-none"
                    : "bg-white text-slate-800 border border-slate-100 shadow-xs rounded-tl-none"
                }`}
              >
                <div className="whitespace-pre-line">{msg.text}</div>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block px-1 text-right font-mono">
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2.5 max-w-[85%] mr-auto">
            <div className="w-8 h-8 rounded-full bg-[#0B1F4D]/10 text-[#0B1F4D] flex items-center justify-center">
              <Bot size={14} />
            </div>
            <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none shadow-xs">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-[#0B1F4D] rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-[#0B1F4D] rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 bg-[#0B1F4D] rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-mono">Querying live telemetry & area densities...</p>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggested chips */}
      <div className="px-4 py-2 bg-slate-100/50 border-t border-slate-100 overflow-x-auto flex gap-2 scrollbar-none">
        {suggestedPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => {
              if (onSuggestedPrompt) onSuggestedPrompt(prompt);
              handleSend(prompt);
            }}
            className="text-xs bg-white border border-slate-200 hover:border-[#FF9800] hover:text-[#FF9800] transition px-3 py-1.5 rounded-full whitespace-nowrap text-slate-600 font-medium shrink-0 shadow-2xs"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-slate-100 bg-white flex gap-2 items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask AI Planner... (e.g. Budget calculator for Kolkata)"
          className="flex-1 bg-slate-50 text-sm border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#0B1F4D]"
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim()}
          className="p-2.5 bg-[#FF9800] text-white hover:bg-[#e08600] disabled:bg-slate-200 disabled:text-slate-400 transition rounded-xl"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
