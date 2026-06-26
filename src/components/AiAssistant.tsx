import React, { useState, useRef, useEffect } from "react";
import { Message } from "../types";
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  AlertCircle, 
  HelpCircle, 
  FileText, 
  Clipboard, 
  Check, 
  MapPin, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Lightbulb, 
  Layout, 
  QrCode 
} from "lucide-react";

interface AiAssistantProps {
  embedded?: boolean;
  onSuggestedPrompt?: (text: string) => void;
}

export default function AiAssistant({ embedded = false, onSuggestedPrompt }: AiAssistantProps) {
  // Navigation: "chat" | "advisor" | "generator"
  const [activeSubTab, setActiveSubTab] = useState<"chat" | "advisor" | "generator">("chat");

  // Original Chat State
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

  // AI Campaign Advisor State
  const [advisorNiche, setAdvisorNiche] = useState("Dental Clinic");
  const [advisorCity, setAdvisorCity] = useState("Kolkata");
  const [advisorLoading, setAdvisorLoading] = useState(false);
  const [advisorReport, setAdvisorReport] = useState<any>(null);

  // AI Creative Copy State
  const [genNiche, setGenNiche] = useState("Burger & Shake Restaurant");
  const [genType, setGenType] = useState<"headline" | "tagline" | "qr">("headline");
  const [genLoading, setGenLoading] = useState(false);
  const [generatedSuggestions, setGeneratedSuggestions] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

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

  // Handle AI Campaign Advisor generation
  const handleGenerateAdvisor = async () => {
    if (!advisorNiche.trim()) return;
    setAdvisorLoading(true);
    setAdvisorReport(null);

    try {
      const response = await fetch("/api/gemini/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche: advisorNiche, city: advisorCity })
      });
      const data = await response.json();
      if (data.success && data.advisorReport) {
        setAdvisorReport(data.advisorReport);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAdvisorLoading(false);
    }
  };

  // Handle Creative Generation
  const handleGenerateCreative = async () => {
    if (!genNiche.trim()) return;
    setGenLoading(true);
    setGeneratedSuggestions([]);
    setCopiedIndex(null);

    try {
      const response = await fetch("/api/gemini/generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche: genNiche, creativeType: genType })
      });
      const data = await response.json();
      if (data.success && data.suggestions) {
        setGeneratedSuggestions(data.suggestions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGenLoading(false);
    }
  };

  const handleCopyText = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className={`flex flex-col h-full bg-white rounded-2xl border border-slate-150 shadow-xs overflow-hidden ${embedded ? "max-h-[620px]" : "h-[700px]"}`}>
      {/* Dynamic Selector Header */}
      <div className="bg-[#10B981] text-white p-4 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white/20 rounded-xl text-white">
              <Bot size={18} />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-sm leading-tight flex items-center gap-1">
                AutoAdz AI Suite <Sparkles size={13} className="text-emerald-100 animate-pulse" />
              </h3>
              <span className="text-[10px] text-emerald-100 font-mono">Gemini-Powered Intelligence</span>
            </div>
          </div>
          <div className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[9px] font-mono font-medium flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-white animate-ping"></span>
            ACTIVE
          </div>
        </div>

        {/* Triple subtabs */}
        <div className="grid grid-cols-3 gap-1 bg-black/10 p-1 rounded-lg text-xs font-medium">
          <button 
            onClick={() => setActiveSubTab("chat")}
            className={`py-1 rounded-md text-center transition ${activeSubTab === "chat" ? "bg-white text-slate-900 shadow-xs" : "text-white/80 hover:text-white"}`}
          >
            💬 Chat Care
          </button>
          <button 
            onClick={() => setActiveSubTab("advisor")}
            className={`py-1 rounded-md text-center transition ${activeSubTab === "advisor" ? "bg-white text-slate-900 shadow-xs" : "text-white/80 hover:text-white"}`}
          >
            🎯 Campaign Advisor
          </button>
          <button 
            onClick={() => setActiveSubTab("generator")}
            className={`py-1 rounded-md text-center transition ${activeSubTab === "generator" ? "bg-white text-slate-900 shadow-xs" : "text-white/80 hover:text-white"}`}
          >
            ✨ Ad Generator
          </button>
        </div>
      </div>

      {/* SUBVIEW CONTENT */}
      <div className="flex-1 overflow-y-auto bg-slate-50 flex flex-col">
        {/* ======================= TAB 1: CHAT CARE ======================= */}
        {activeSubTab === "chat" && (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2 max-w-[85%] ${
                    msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                      msg.sender === "user" ? "bg-slate-200 text-slate-700" : "bg-emerald-500/10 text-emerald-600"
                    }`}
                  >
                    {msg.sender === "user" ? <User size={13} /> : <Bot size={13} />}
                  </div>
                  <div>
                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed ${
                        msg.sender === "user"
                          ? "bg-[#10B981] text-white rounded-tr-none"
                          : "bg-white text-slate-800 border border-slate-100 shadow-3xs rounded-tl-none"
                      }`}
                    >
                      <div className="whitespace-pre-line">{msg.text}</div>
                    </div>
                    <span className="text-[9px] text-slate-400 mt-0.5 block px-1 text-right font-mono">
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex gap-2 max-w-[85%] mr-auto">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                    <Bot size={13} />
                  </div>
                  <div className="bg-white border border-slate-100 p-3 rounded-2xl rounded-tl-none shadow-3xs">
                    <div className="flex items-center gap-1 mb-1">
                      <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono">Simulating ROI routes...</p>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Suggested chips */}
            <div className="px-4 py-1.5 bg-slate-100 overflow-x-auto flex gap-1.5 shrink-0 scrollbar-none">
              {suggestedPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (onSuggestedPrompt) onSuggestedPrompt(prompt);
                    handleSend(prompt);
                  }}
                  className="text-[10px] bg-white border border-slate-200 hover:border-[#10B981] hover:text-[#10B981] transition px-2.5 py-1 rounded-full whitespace-nowrap text-slate-600 font-bold shrink-0 shadow-3xs"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="p-2.5 border-t border-slate-100 bg-white flex gap-2 items-center shrink-0">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type here..."
                className="flex-1 bg-slate-50 text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#10B981]"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim()}
                className="p-2 bg-[#10B981] text-white hover:bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 transition rounded-xl shrink-0"
              >
                <Send size={15} />
              </button>
            </div>
          </>
        )}

        {/* ======================= TAB 2: CAMPAIGN ADVISOR ======================= */}
        {activeSubTab === "advisor" && (
          <div className="p-4 space-y-4 flex-1">
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3 flex gap-2.5 items-start">
              <Sparkles size={16} className="text-emerald-600 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <h4 className="text-xs font-bold text-emerald-900">AutoAdz AI Smart Campaign Planner</h4>
                <p className="text-[10px] text-emerald-700 leading-relaxed mt-0.5">
                  Input your business type and operating city to receive dynamic auto-allocation advice, recommended budget, and key marketing zones instantly!
                </p>
              </div>
            </div>

            {/* Planner Form */}
            <div className="bg-white rounded-2xl p-4 border border-slate-150 space-y-3 shadow-3xs">
              <div className="space-y-1">
                <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono">Business Category / Niche</label>
                <input 
                  type="text"
                  placeholder="e.g. Dental Clinic, Gym, Veg Restaurant"
                  value={advisorNiche}
                  onChange={(e) => setAdvisorNiche(e.target.value)}
                  className="w-full bg-slate-50 text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#10B981]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono">Target City</label>
                  <select 
                    value={advisorCity}
                    onChange={(e) => setAdvisorCity(e.target.value)}
                    className="w-full bg-slate-50 text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#10B981]"
                  >
                    <option value="Kolkata">Kolkata</option>
                    <option value="Delhi">Delhi NCR</option>
                    <option value="Bangalore">Bangalore</option>
                    <option value="Mumbai">Mumbai</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button 
                    onClick={handleGenerateAdvisor}
                    disabled={advisorLoading || !advisorNiche.trim()}
                    className="w-full py-2 bg-[#10B981] hover:bg-emerald-600 disabled:bg-slate-200 text-white text-xs font-bold font-mono rounded-xl transition flex items-center justify-center gap-1 shadow-3xs"
                  >
                    {advisorLoading ? (
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <>🎯 ADVISE ME</>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Advisor Report Output */}
            {advisorReport && (
              <div className="bg-white rounded-2xl p-4 border border-slate-150 shadow-3xs space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h4 className="text-xs font-black text-slate-800 font-display uppercase tracking-tight">AI Strategy Proposal</h4>
                  <span className="text-[9px] font-bold font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">RECOMMENDED</span>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="p-3 bg-slate-50 rounded-xl flex items-center gap-2.5">
                    <div className="p-1.5 bg-emerald-500/10 text-[#10B981] rounded-lg">
                      <TrendingUp size={14} />
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-mono block">ALLOCATE AUTOS</span>
                      <strong className="text-xs text-slate-800">{advisorReport.recommendedAutos} Vehicles</strong>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl flex items-center gap-2.5">
                    <div className="p-1.5 bg-indigo-500/10 text-indigo-500 rounded-lg">
                      <Clock size={14} />
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-mono block">MIN DURATION</span>
                      <strong className="text-xs text-slate-800">{advisorReport.recommendedDuration}</strong>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl flex items-center gap-2.5">
                    <div className="p-1.5 bg-orange-500/10 text-orange-500 rounded-lg">
                      <DollarSign size={14} />
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-mono block">SUGGESTED BUDGET</span>
                      <strong className="text-xs text-slate-800">₹{advisorReport.recommendedBudget?.toLocaleString("en-IN")}</strong>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl flex items-center gap-2.5">
                    <div className="p-1.5 bg-rose-500/10 text-rose-500 rounded-lg">
                      <Sparkles size={14} />
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-mono block">EXPECTED REACH</span>
                      <strong className="text-xs text-slate-800">{advisorReport.estimatedImpressions} Views</strong>
                    </div>
                  </div>
                </div>

                {/* Hyperlocal Hotspots */}
                <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl space-y-1">
                  <span className="text-[9px] font-bold text-[#10B981] uppercase font-mono tracking-wider flex items-center gap-1">
                    <MapPin size={11} /> High Density Target Zones
                  </span>
                  <p className="text-xs text-emerald-950 font-medium leading-relaxed">
                    {advisorReport.targetZones}
                  </p>
                </div>

                {/* Marketing Creative Strategy */}
                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <span className="text-[9px] font-bold text-slate-500 uppercase font-mono tracking-wider flex items-center gap-1">
                    <Lightbulb size={11} className="text-orange-400" /> Branding Advisory Concept
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed font-sans">
                    {advisorReport.marketingTip}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================= TAB 3: AD COPY GENERATOR ======================= */}
        {activeSubTab === "generator" && (
          <div className="p-4 space-y-4 flex-1">
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3 flex gap-2.5 items-start">
              <Sparkles size={16} className="text-emerald-600 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <h4 className="text-xs font-bold text-emerald-900">AI Ad Copywriter & QR Campaign Builder</h4>
                <p className="text-[10px] text-emerald-700 leading-relaxed mt-0.5">
                  Generate eye-catching, memorable headlines, taglines, or custom QR coupon campaign activations tailored specifically to auto back-hood formats!
                </p>
              </div>
            </div>

            {/* Generator Form */}
            <div className="bg-white rounded-2xl p-4 border border-slate-150 space-y-3 shadow-3xs">
              <div className="space-y-1">
                <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono">Brand Name / Service Niche</label>
                <input 
                  type="text"
                  placeholder="e.g. Edge Fashion, Dr. Sen Dental Care, Chai Tapri"
                  value={genNiche}
                  onChange={(e) => setGenNiche(e.target.value)}
                  className="w-full bg-slate-50 text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#10B981]"
                />
              </div>

              {/* Selector button group */}
              <div className="space-y-1">
                <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono block">Format to Write</label>
                <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg">
                  <button
                    onClick={() => setGenType("headline")}
                    className={`py-1 text-[10px] font-bold rounded-md text-center transition ${genType === "headline" ? "bg-white text-slate-800 shadow-3xs" : "text-slate-500"}`}
                  >
                    📛 Headline
                  </button>
                  <button
                    onClick={() => setGenType("tagline")}
                    className={`py-1 text-[10px] font-bold rounded-md text-center transition ${genType === "tagline" ? "bg-white text-slate-800 shadow-3xs" : "text-slate-500"}`}
                  >
                    🏷️ Tagline
                  </button>
                  <button
                    onClick={() => setGenType("qr")}
                    className={`py-1 text-[10px] font-bold rounded-md text-center transition ${genType === "qr" ? "bg-white text-slate-800 shadow-3xs" : "text-slate-500"}`}
                  >
                    🔗 QR Hook
                  </button>
                </div>
              </div>

              <button 
                onClick={handleGenerateCreative}
                disabled={genLoading || !genNiche.trim()}
                className="w-full py-2 bg-[#10B981] hover:bg-emerald-600 disabled:bg-slate-200 text-white text-xs font-bold font-mono rounded-xl transition flex items-center justify-center gap-1 shadow-3xs"
              >
                {genLoading ? (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>✨ GENERATE COPYWRITING</>
                )}
              </button>
            </div>

            {/* Generated Outputs list */}
            {generatedSuggestions.length > 0 && (
              <div className="space-y-2 animate-fadeIn">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase font-mono">Suggested Creative Hooks</span>
                  <span className="text-[9px] text-slate-400 font-mono">Click to Copy</span>
                </div>

                <div className="space-y-2">
                  {generatedSuggestions.map((item, index) => (
                    <div 
                      key={index} 
                      onClick={() => handleCopyText(item, index)}
                      className="bg-white hover:bg-emerald-500/5 hover:border-emerald-500/20 active:bg-emerald-500/10 cursor-pointer p-3 border border-slate-150 rounded-xl flex items-start gap-2.5 justify-between transition group shadow-3xs"
                    >
                      <div className="flex gap-2.5 items-start">
                        <span className="w-5 h-5 bg-slate-100 text-slate-500 text-[10px] font-bold flex items-center justify-center rounded-full shrink-0 group-hover:bg-emerald-100 group-hover:text-emerald-700 font-mono">
                          {index + 1}
                        </span>
                        <p className="text-xs text-slate-700 group-hover:text-slate-900 font-medium leading-relaxed pt-0.5">
                          {item}
                        </p>
                      </div>
                      <button className="text-slate-400 hover:text-emerald-600 p-1 shrink-0">
                        {copiedIndex === index ? (
                          <Check size={14} className="text-[#10B981]" />
                        ) : (
                          <Clipboard size={14} className="opacity-60 group-hover:opacity-100 transition" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
