import React, { useState, useEffect } from "react";
import { 
  Campaign, 
  Driver, 
  Proof, 
  WalletTransaction, 
  NotificationItem, 
  UserRole 
} from "./types";
import { 
  Plus, Search, MapPin, Calendar, DollarSign, CheckCircle, 
  Clock, AlertCircle, X, ChevronRight, Image as ImageIcon, 
  FileText, Wallet, Bell, User, Map, Settings, Send, 
  Smartphone, Shield, Check, RotateCcw, Camera, HelpCircle, 
  TrendingUp, Award, Navigation, RefreshCw, Eye, ThumbsUp, 
  ThumbsDown, Sparkles, MessageSquare, Activity, ShieldAlert,
  Sun, Moon
} from "lucide-react";
import AiAssistant from "./components/AiAssistant";

export default function App() {
  // Simulator state
  const [activeSimulator, setActiveSimulator] = useState<"advertiser" | "driver">("advertiser");

  // Persistent Dark Mode Theme State
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("autoadz-dark-mode") === "true";
  });

  useEffect(() => {
    localStorage.setItem("autoadz-dark-mode", String(darkMode));
  }, [darkMode]);
  
  // Real Database State (fetched from backend)
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  // App UI Navigation States
  const [advertiserTab, setAdvertiserTab] = useState<"home" | "campaigns" | "tracking" | "ai" | "profile">("home");
  const [driverTab, setDriverTab] = useState<"dashboard" | "proof" | "tracker" | "earnings" | "profile">("dashboard");
  const [adminTab, setAdminTab] = useState<"campaigns" | "drivers" | "proofs" | "analytics">("campaigns");

  // New Campaign Form State
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [newCampTitle, setNewCampTitle] = useState("");
  const [newCampClient, setNewCampClient] = useState("");
  const [newCampCity, setNewCampCity] = useState("Bangalore");
  const [newCampArea, setNewCampArea] = useState("");
  const [newCampBudget, setNewCampBudget] = useState(75000);
  const [newCampAutos, setNewCampAutos] = useState(10);
  const [newCampCreative, setNewCampCreative] = useState("");

  // Driver Check-in / Proof Upload State
  const [selectedCampaignForProof, setSelectedCampaignForProof] = useState("");
  const [selectedProofType, setSelectedProofType] = useState<"installation" | "morning" | "evening">("morning");
  const [customProofImg, setCustomProofImg] = useState("");
  const [proofLocation, setProofLocation] = useState("Indiranagar Metro Station, Bangalore");
  const [driverCheckInMsg, setDriverCheckInMsg] = useState("");

  // Driver Registration Form
  const [driverRegName, setDriverRegName] = useState("");
  const [driverRegPhone, setDriverRegPhone] = useState("");
  const [driverRegAutoNum, setDriverRegAutoNum] = useState("");
  const [driverRegLoc, setDriverRegLoc] = useState("");
  const [driverSuccessMsg, setDriverSuccessMsg] = useState("");

  // Wallet State
  const [addFundsAmount, setAddFundsAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [walletSuccessMsg, setWalletSuccessMsg] = useState("");

  // Driver Support Chat State
  const [driverMessages, setDriverMessages] = useState<Array<{sender: 'driver' | 'support', text: string, time: string}>>([
    { sender: 'support', text: 'Hello! Welcome to AutoAdz Driver Care. Need help with installation proof or GPS tracking?', time: '09:00 AM' }
  ]);
  const [driverChatInput, setDriverChatInput] = useState("");

  // Auto-fill template creative URLs
  const creativeTemplates = [
    { name: "Tata Punch EV", url: "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&q=80&w=800" },
    { name: "Swiggy Instamart", url: "https://images.unsplash.com/photo-1526367790999-015078648c7e?auto=format&fit=crop&q=80&w=800" },
    { name: "Haldiram's Sweets", url: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=800" },
    { name: "Zomato Gold", url: "https://images.unsplash.com/photo-1501183007986-d0d080b147f9?auto=format&fit=crop&q=80&w=800" }
  ];

  // Fetch all state from API
  const fetchData = async () => {
    try {
      const [resCamps, resDrivers, resProofs, resTxs, resNotifs] = await Promise.all([
        fetch("/api/campaigns"),
        fetch("/api/drivers"),
        fetch("/api/proofs"),
        fetch("/api/wallet/transactions"),
        fetch("/api/notifications"),
      ]);

      const dataCamps = await resCamps.json();
      const dataDrivers = await resDrivers.json();
      const dataProofs = await resProofs.json();
      const dataTxs = await resTxs.json();
      const dataNotifs = await resNotifs.json();

      setCampaigns(dataCamps);
      setDrivers(dataDrivers);
      setProofs(dataProofs);
      setTransactions(dataTxs);
      setNotifications(dataNotifs);
    } catch (err) {
      console.error("Error fetching telemetry database", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000); // Poll every 8 seconds for dynamic simulated kms
    return () => clearInterval(interval);
  }, []);

  // Post campaign
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newCampTitle,
          client: newCampClient || "My Brand Ltd",
          city: newCampCity,
          area: newCampArea || "Koramangala & HSR",
          budget: newCampBudget,
          autosCount: newCampAutos,
          creativeUrl: newCampCreative || creativeTemplates[0].url
        })
      });

      if (response.ok) {
        setShowCreateCampaign(false);
        // Reset fields
        setNewCampTitle("");
        setNewCampClient("");
        setNewCampArea("");
        setNewCampCreative("");
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Driver self register
  const handleDriverRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverRegName || !driverRegPhone) return;
    try {
      const response = await fetch("/api/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: driverRegName,
          phone: driverRegPhone,
          autoNumber: driverRegAutoNum || "KA-03-AA-9999",
          location: driverRegLoc || "Bangalore South"
        })
      });

      if (response.ok) {
        setDriverSuccessMsg("Registration submitted successfully! Admin will verify KYC within 5 minutes.");
        setDriverRegName("");
        setDriverRegPhone("");
        setDriverRegAutoNum("");
        setDriverRegLoc("");
        setTimeout(() => setDriverSuccessMsg(""), 5000);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit check-in proof
  const handleUploadProof = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeDriver = drivers.find(d => d.id === "driver_1"); // Rajesh Kumar simulator
    if (!activeDriver) return;

    try {
      const response = await fetch("/api/proofs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driverId: activeDriver.id,
          campaignId: selectedCampaignForProof || activeDriver.currentCampaignId || "camp_1",
          type: selectedProofType,
          imageUrl: customProofImg || "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&q=80&w=800",
          location: proofLocation
        })
      });

      if (response.ok) {
        setDriverCheckInMsg("Proof uploaded successfully! Awaiting Admin audit.");
        setCustomProofImg("");
        setTimeout(() => setDriverCheckInMsg(""), 5000);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Admin audit proof
  const handleAuditProof = async (id: string, status: "approved" | "rejected") => {
    try {
      const response = await fetch(`/api/proofs/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Admin approve driver KYC
  const handleVerifyDriver = async (id: string, approve: boolean) => {
    try {
      const response = await fetch(`/api/drivers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: approve ? "active" : "rejected",
          kycVerified: approve,
          currentCampaignId: approve ? "camp_1" : null // Assign to active Bangalore campaign for quick demo
        })
      });
      if (response.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Admin approve campaign
  const handleVerifyCampaign = async (id: string, status: "active" | "completed" | "pending") => {
    try {
      const response = await fetch(`/api/campaigns/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Advertiser add funds via Simulated Razorpay
  const handleAddFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(addFundsAmount);
    if (!amt || amt <= 0) return;

    try {
      const response = await fetch("/api/wallet/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "advertiser_main",
          type: "deposit",
          amount: amt,
          description: "Razorpay Checkout - ID: rzp_live_9a2bC"
        })
      });

      if (response.ok) {
        setWalletSuccessMsg(`₹${amt.toLocaleString()} added successfully via Razorpay Secured Payment!`);
        setAddFundsAmount("");
        setTimeout(() => setWalletSuccessMsg(""), 4000);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Driver Request Withdrawal
  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(withdrawAmount);
    if (!amt || amt <= 0) return;

    try {
      const response = await fetch("/api/wallet/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "driver_1",
          type: "withdrawal",
          amount: amt,
          description: "IMPS Payout - Requested"
        })
      });

      if (response.ok) {
        setWalletSuccessMsg(`Withdrawal of ₹${amt.toLocaleString()} processed to registered Bank Account!`);
        setWithdrawAmount("");
        setTimeout(() => setWalletSuccessMsg(""), 4000);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Driver Chat reply simulation
  const handleDriverSendMsg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverChatInput.trim()) return;

    const userMsg = {
      sender: 'driver' as const,
      text: driverChatInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setDriverMessages(prev => [...prev, userMsg]);
    setDriverChatInput("");

    // Simulate instant AI support reply
    setTimeout(() => {
      let replyText = "Understood. Our regional coordinator at Bangalore Hub will get back to you regarding your payout query within 15 minutes.";
      if (driverChatInput.toLowerCase().includes("proof") || driverChatInput.toLowerCase().includes("photo")) {
        replyText = "Remember to keep your vehicle license plate visible when uploading installation proofs. Morning check-in must be submitted between 6:00 AM and 10:00 AM!";
      } else if (driverChatInput.toLowerCase().includes("gps") || driverChatInput.toLowerCase().includes("track")) {
        replyText = "If GPS is not tracking, please verify that 'Always Allow' location permission is enabled in your Android settings.";
      }

      setDriverMessages(prev => [...prev, {
        sender: 'support',
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 1200);
  };

  // Toggle Live Tracking simulation for Driver Rajesh Kumar
  const toggleDriverTracking = async () => {
    const mainDriver = drivers.find(d => d.id === "driver_1");
    if (!mainDriver) return;
    const nextState = mainDriver.state === "tracking" ? "online" : "tracking";

    try {
      await fetch(`/api/drivers/${mainDriver.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: nextState })
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Calculate high level stats
  const activeCampaignsCount = campaigns.filter(c => c.status === "active").length;
  const totalKmsAll = campaigns.reduce((sum, c) => sum + c.kmsCovered, 0);
  const totalScansAll = campaigns.reduce((sum, c) => sum + c.qrScans, 0);
  const activeAutosAll = campaigns.filter(c => c.status === "active").reduce((sum, c) => sum + c.autosCount, 0);

  return (
    <div className={`min-h-screen ${darkMode ? "dark-theme-active" : "bg-[#F4F7FE]"} flex flex-col font-sans selection:bg-[#FF9800] selection:text-white transition-all duration-300`}>
      {/* Dynamic Master Header */}
      <header className="bg-[#0B1F4D] text-white px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0 shadow-md border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#FF9800] rounded-xl flex items-center justify-center font-display font-bold text-xl text-white shadow-md animate-bounce">
            A
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-display font-extrabold tracking-tight">AutoAdz</h1>
              <span className="bg-orange-500/20 text-[#FF9800] text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-orange-500/30">
                PROTOTYPE HUB
              </span>
            </div>
            <p className="text-xs text-slate-300 font-mono">India's measurable auto-rickshaw advertising with GPS proof</p>
          </div>
        </div>

        {/* Sync Status Button */}
        <div className="flex items-center gap-4">
          {/* Persistent Dark Mode Theme Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 hover:border-[#FF9800]/50 transition rounded-lg text-xs font-mono font-medium text-slate-300 border border-slate-700/60"
            title="Toggle Dark Mode"
            id="theme-toggle-btn"
          >
            {darkMode ? (
              <>
                <Sun size={12} className="text-amber-400 animate-pulse" />
                <span className="text-amber-400">LIGHT VIEW</span>
              </>
            ) : (
              <>
                <Moon size={12} className="text-[#FF9800]" />
                <span>NIGHT MODE</span>
              </>
            )}
          </button>

          <button 
            onClick={fetchData} 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 transition rounded-lg text-xs font-mono font-medium text-slate-300 border border-slate-700/60"
            id="sync-telemetry-btn"
          >
            <RefreshCw size={12} className={loading ? "animate-spin text-[#FF9800]" : "text-slate-400"} />
            {loading ? "SYNCING..." : "SYNC TELEMETRY"}
          </button>

          {/* Quick Stats Pill */}
          <div className="hidden lg:flex items-center gap-4 bg-slate-900/60 px-4 py-2 rounded-xl border border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 block text-[9px] uppercase font-mono font-bold">Autos Linked</span>
              <span className="font-bold text-green-400 font-mono text-sm">{drivers.length} Vehicles</span>
            </div>
            <div className="h-6 w-px bg-slate-800"></div>
            <div>
              <span className="text-slate-400 block text-[9px] uppercase font-mono font-bold">Total KMs Tracker</span>
              <span className="font-bold text-[#FF9800] font-mono text-sm">{(totalKmsAll).toLocaleString()} KM</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid: Left is simulated App, Right is Admin / Monitoring dashboard */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-6 p-4 md:p-6">
        
        {/* ========================================================= */}
        {/* LEFT COLUMN: DUAL MOBILE DEVICE SIMULATOR (45% Width) */}
        {/* ========================================================= */}
        <div className="xl:col-span-5 flex flex-col items-center">
          
          {/* Switcher Tab */}
          <div className="w-full max-w-[420px] bg-white p-1 rounded-xl shadow-xs border border-slate-200 flex mb-4">
            <button
              onClick={() => setActiveSimulator("advertiser")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 ${
                activeSimulator === "advertiser"
                  ? "bg-[#0B1F4D] text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Smartphone size={14} />
              Advertiser App
            </button>
            <button
              onClick={() => setActiveSimulator("driver")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 ${
                activeSimulator === "driver"
                  ? "bg-[#0B1F4D] text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Award size={14} />
              Driver App
            </button>
          </div>

          {/* SMARTPHONE FRAME MOCKUP */}
          <div className="w-full max-w-[420px] bg-slate-950 p-3.5 rounded-[40px] shadow-2xl border-4 border-slate-800 relative ring-12 ring-slate-900/10">
            {/* Phone Notch/Speaker */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-32 h-4 bg-slate-950 rounded-full z-30 flex items-center justify-center">
              <div className="w-12 h-1 bg-slate-800 rounded-full"></div>
            </div>

            {/* Inner Phone Screen Content */}
            <div className="bg-slate-50 rounded-[30px] overflow-hidden aspect-[9/18.5] flex flex-col relative text-slate-800 h-[720px]">
              
              {/* Fake Phone Status Bar */}
              <div className="bg-[#0B1F4D] text-white text-[11px] px-6 pt-3 pb-1 flex justify-between items-center font-mono select-none z-20 shrink-0">
                <span>09:41 AM</span>
                <div className="flex items-center gap-1.5">
                  <Activity size={10} className="text-[#FF9800] animate-pulse" />
                  <span>5G</span>
                  <div className="w-5 h-2.5 border border-white/60 rounded-xs p-0.5 flex items-center">
                    <div className="w-full h-full bg-green-400 rounded-2xs"></div>
                  </div>
                </div>
              </div>

              {/* ========================================== */}
              {/* INTERACTIVE ADVERTISER MOBILE APP VIEW */}
              {/* ========================================== */}
              {activeSimulator === "advertiser" && (
                <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
                  {/* App Header */}
                  <div className="bg-[#0B1F4D] text-white px-4 py-3 shrink-0 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-[#FF9800] rounded-lg flex items-center justify-center font-display font-bold text-xs">
                        AD
                      </div>
                      <div>
                        <h4 className="font-display font-bold text-xs tracking-tight">AutoAdz Client</h4>
                        <span className="text-[9px] text-green-400 font-mono">Premium Account</span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => {
                        setAdvertiserTab("home");
                        setShowCreateCampaign(true);
                      }}
                      className="bg-[#FF9800] hover:bg-[#e08600] text-[#0B1F4D] text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm transition-all"
                    >
                      <Plus size={11} />
                      NEW CAMPAIGN
                    </button>
                  </div>

                  {/* App Viewport Container */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-3 pb-20">
                    
                    {/* ADVERTISER HOME TAB */}
                    {advertiserTab === "home" && (
                      <>
                        {/* Elegant App Balance Banner */}
                        <div className="bg-gradient-to-r from-[#0B1F4D] to-[#1e3b7a] rounded-2xl p-4 text-white shadow-sm relative overflow-hidden">
                          <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4">
                            <TrendingUp size={120} />
                          </div>
                          <span className="text-[10px] text-slate-300 font-mono tracking-wider uppercase">Active Wallet Balance</span>
                          <h2 className="text-2xl font-display font-extrabold mt-0.5 text-[#FF9800]">
                            ₹{(transactions.filter(t => t.userId === "advertiser_main" && t.status === "success").reduce((acc, curr) => curr.type === "deposit" ? acc + curr.amount : acc - curr.amount, 0)).toLocaleString()}
                          </h2>
                          <div className="mt-3 flex gap-2">
                            <input 
                              type="number"
                              placeholder="₹ Add Funds"
                              value={addFundsAmount}
                              onChange={(e) => setAddFundsAmount(e.target.value)}
                              className="bg-white/10 text-white placeholder-slate-400 rounded-lg px-2.5 py-1 text-xs w-28 focus:outline-none focus:ring-1 focus:ring-[#FF9800]"
                            />
                            <button 
                              onClick={handleAddFunds}
                              className="bg-[#FF9800] hover:bg-orange-500 text-[#0B1F4D] text-[10px] font-bold px-3 py-1 rounded-lg transition"
                            >
                              Add
                            </button>
                          </div>
                          {walletSuccessMsg && (
                            <p className="text-[10px] text-green-300 mt-2 font-medium">{walletSuccessMsg}</p>
                          )}
                        </div>

                        {/* Quick Stats Grid */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-white p-3 rounded-xl border border-slate-150 shadow-xs">
                            <span className="text-slate-400 text-[9px] font-mono block uppercase">Active Autos</span>
                            <div className="flex items-baseline gap-1 mt-1">
                              <span className="text-lg font-bold text-[#0B1F4D]">{activeAutosAll}</span>
                              <span className="text-green-500 text-[9px] font-medium font-mono">Vehicles</span>
                            </div>
                          </div>
                          <div className="bg-white p-3 rounded-xl border border-slate-150 shadow-xs">
                            <span className="text-slate-400 text-[9px] font-mono block uppercase">Total Distance</span>
                            <div className="flex items-baseline gap-1 mt-1">
                              <span className="text-lg font-bold text-[#0B1F4D]">{totalKmsAll}</span>
                              <span className="text-blue-500 text-[9px] font-medium font-mono">KM</span>
                            </div>
                          </div>
                          <div className="bg-white p-3 rounded-xl border border-slate-150 shadow-xs">
                            <span className="text-slate-400 text-[9px] font-mono block uppercase">QR Code Scans</span>
                            <div className="flex items-baseline gap-1 mt-1">
                              <span className="text-lg font-bold text-[#0B1F4D]">{totalScansAll}</span>
                              <span className="text-orange-500 text-[9px] font-medium font-mono">Clicks</span>
                            </div>
                          </div>
                          <div className="bg-white p-3 rounded-xl border border-slate-150 shadow-xs">
                            <span className="text-slate-400 text-[9px] font-mono block uppercase">Campaigns</span>
                            <div className="flex items-baseline gap-1 mt-1">
                              <span className="text-lg font-bold text-[#FF9800]">{campaigns.length}</span>
                              <span className="text-slate-500 text-[9px] font-medium font-mono">Total</span>
                            </div>
                          </div>
                        </div>

                        {/* Campaign Creation Quick Panel */}
                        {showCreateCampaign ? (
                          <form onSubmit={handleCreateCampaign} className="bg-white p-4 rounded-xl border border-orange-200 shadow-sm space-y-2.5">
                            <div className="flex justify-between items-center pb-1 border-b border-slate-100">
                              <h5 className="font-bold text-xs text-[#0B1F4D] flex items-center gap-1">
                                <Plus size={12} className="text-[#FF9800]" /> Create Auto Campaign
                              </h5>
                              <button type="button" onClick={() => setShowCreateCampaign(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={14} />
                              </button>
                            </div>

                            <div>
                              <label className="text-[10px] text-slate-500 block font-medium">Campaign Name</label>
                              <input 
                                type="text"
                                required
                                placeholder="e.g. Swiggy Free Delivery"
                                value={newCampTitle}
                                onChange={(e) => setNewCampTitle(e.target.value)}
                                className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-[#0B1F4D]"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] text-slate-500 block font-medium">City</label>
                                <select 
                                  value={newCampCity}
                                  onChange={(e) => setNewCampCity(e.target.value)}
                                  className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-slate-50"
                                >
                                  <option value="Bangalore">Bangalore</option>
                                  <option value="Kolkata">Kolkata</option>
                                  <option value="Mumbai">Mumbai</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-500 block font-medium">Target Area</label>
                                <input 
                                  type="text"
                                  placeholder="e.g. Salt Lake / Indiranagar"
                                  value={newCampArea}
                                  onChange={(e) => setNewCampArea(e.target.value)}
                                  className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-[#0B1F4D]"
                                />
                              </div>
                            </div>

                            {/* Budget Estimator / Calculator */}
                            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1.5">
                              <span className="text-[9px] text-slate-400 block font-mono font-semibold uppercase">Real-Time Budget Calculator</span>
                              <div className="flex gap-2 text-xs">
                                <div className="flex-1">
                                  <label className="text-[9px] text-slate-500 block">Number of Autos</label>
                                  <input 
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={newCampAutos}
                                    onChange={(e) => {
                                      const autos = Number(e.target.value);
                                      setNewCampAutos(autos);
                                      setNewCampBudget(autos * 6000); // flat ₹6000 per auto per month estimation
                                    }}
                                    className="w-full border border-slate-200 rounded p-1 text-center font-mono font-bold"
                                  />
                                </div>
                                <div className="flex-1">
                                  <label className="text-[9px] text-slate-500 block">Calculated Budget</label>
                                  <div className="bg-white border border-slate-200 p-1 text-center font-mono font-bold text-[#FF9800]">
                                    ₹{(newCampAutos * 6000).toLocaleString()}
                                  </div>
                                </div>
                              </div>
                              <p className="text-[9px] text-slate-400">Includes auto driver payout, printing, mounting & QR setup.</p>
                            </div>

                            {/* Creative upload */}
                            <div>
                              <label className="text-[10px] text-slate-500 block font-medium">Select Brand Creative Template</label>
                              <div className="grid grid-cols-2 gap-1.5 mt-1">
                                {creativeTemplates.map((template, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setNewCampCreative(template.url)}
                                    className={`p-1.5 rounded border text-left flex items-center gap-1.5 transition ${
                                      newCampCreative === template.url ? "border-[#FF9800] bg-orange-50/50" : "border-slate-200"
                                    }`}
                                  >
                                    <img src={template.url} className="w-6 h-6 rounded object-cover" alt="" />
                                    <span className="text-[9px] truncate text-slate-700 font-medium">{template.name}</span>
                                  </button>
                                ))}
                              </div>
                            </div>

                            <button 
                              type="submit"
                              className="w-full bg-[#0B1F4D] hover:bg-[#152e68] text-white font-bold py-2 rounded-lg text-xs transition"
                            >
                              BOOK CAMPAIGN (₹{(newCampAutos * 6000).toLocaleString()})
                            </button>
                          </form>
                        ) : null}

                        {/* Recent Alerts / Push notifications inside App */}
                        <div className="bg-white p-3 rounded-xl border border-slate-150 shadow-xs space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-[#0B1F4D] flex items-center gap-1">
                              <Bell size={12} className="text-[#FF9800]" /> Recent Activity Alerts
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono">Live Sync</span>
                          </div>
                          <div className="space-y-1.5">
                            {notifications.slice(0, 2).map(n => (
                              <div key={n.id} className="p-2 bg-slate-50 rounded-lg text-[10px] border-l-2 border-[#FF9800] space-y-0.5">
                                <p className="font-bold text-slate-700">{n.title}</p>
                                <p className="text-slate-500 leading-tight">{n.message}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* ADVERTISER CAMPAIGNS TAB */}
                    {advertiserTab === "campaigns" && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-bold text-[#0B1F4D]">My AutoAdz Campaigns</h4>
                          <span className="text-[9px] font-mono bg-slate-200 px-2 py-0.5 rounded text-slate-600">
                            {campaigns.length} total
                          </span>
                        </div>

                        {campaigns.map((camp) => (
                          <div key={camp.id} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                            <div className="relative h-20 bg-slate-900">
                              <img src={camp.creativeUrl} className="w-full h-full object-cover opacity-80" alt="" />
                              <div className="absolute top-2 right-2">
                                <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full uppercase font-mono ${
                                  camp.status === "active" ? "bg-green-500 text-white" :
                                  camp.status === "pending" ? "bg-amber-500 text-white" : "bg-slate-500 text-white"
                                }`}>
                                  {camp.status}
                                </span>
                              </div>
                              <div className="absolute bottom-1 left-2">
                                <span className="bg-[#0B1F4D] text-white text-[8px] font-mono px-1.5 py-0.5 rounded">
                                  {camp.city}
                                </span>
                              </div>
                            </div>
                            <div className="p-3 space-y-2">
                              <div>
                                <h5 className="font-bold text-xs text-slate-800 line-clamp-1">{camp.title}</h5>
                                <p className="text-[9px] text-slate-400 font-mono">Client: {camp.client}</p>
                              </div>
                              
                              <div className="grid grid-cols-3 gap-1 bg-slate-50 p-1.5 rounded-lg text-center">
                                <div>
                                  <span className="text-[8px] text-slate-400 block uppercase">Autos</span>
                                  <span className="text-[11px] font-bold text-slate-700 font-mono">{camp.autosCount}</span>
                                </div>
                                <div>
                                  <span className="text-[8px] text-slate-400 block uppercase">Distance</span>
                                  <span className="text-[11px] font-bold text-[#FF9800] font-mono">{camp.kmsCovered} km</span>
                                </div>
                                <div>
                                  <span className="text-[8px] text-slate-400 block uppercase">QR Scans</span>
                                  <span className="text-[11px] font-bold text-blue-600 font-mono">{camp.qrScans}</span>
                                </div>
                              </div>

                              <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-[10px]">
                                <span className="text-slate-500 font-mono">Budget: <b>₹{camp.budget.toLocaleString()}</b></span>
                                <button 
                                  onClick={() => {
                                    alert(`Mock Campaign Report downloaded for: ${camp.title}\nTotal Autos: ${camp.autosCount}\nSimulated KMs: ${camp.kmsCovered} km\nTotal Impressions: ${(camp.kmsCovered * 380).toLocaleString()} Eye-level exposures.`);
                                  }}
                                  className="text-[#FF9800] hover:underline font-bold flex items-center gap-0.5 text-[9px]"
                                >
                                  <FileText size={10} /> Report PDF
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* ADVERTISER LIVE TRACKING TAB */}
                    {advertiserTab === "tracking" && (
                      <div className="space-y-3">
                        <div className="bg-white p-3 rounded-xl border border-slate-200">
                          <h5 className="font-bold text-xs text-[#0B1F4D] flex items-center gap-1">
                            <MapPin size={12} className="text-[#FF9800]" /> Real-time Transit Tracking
                          </h5>
                          <p className="text-[10px] text-slate-400 mt-1">Live simulation map matches drivers checked-in in Bangalore/Kolkata.</p>
                        </div>

                        {/* Visual route summary for active campaign */}
                        {campaigns.filter(c => c.status === "active").map((camp) => (
                          <div key={camp.id} className="bg-white p-3 rounded-xl border border-slate-150 shadow-xs space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold text-slate-800 line-clamp-1">{camp.title}</span>
                              <span className="text-[8px] font-mono bg-green-100 text-green-700 px-1.5 rounded">LIVE</span>
                            </div>

                            {/* Mini Vector Map Mockup with route coordinates list */}
                            <div className="h-28 bg-slate-900 rounded-lg relative overflow-hidden flex items-center justify-center">
                              {/* Background grids */}
                              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:14px_14px]"></div>
                              <div className="absolute w-12 h-12 rounded-full border border-[#FF9800]/30 animate-ping"></div>
                              <div className="absolute w-24 h-24 rounded-full border border-green-500/20 animate-pulse"></div>

                              {/* Target pins */}
                              <div className="absolute top-4 left-6 w-2.5 h-2.5 bg-[#FF9800] rounded-full ring-2 ring-white"></div>
                              <div className="absolute bottom-6 right-12 w-2.5 h-2.5 bg-[#FF9800] rounded-full ring-2 ring-white"></div>
                              <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-green-500 rounded-full ring-4 ring-green-500/30"></div>

                              <div className="absolute bottom-2 left-2 bg-slate-950/80 p-1 rounded text-[8px] text-white font-mono">
                                {camp.city} Grid: {camp.autosCount} Autos Running
                              </div>
                            </div>

                            <div className="text-[9px] text-slate-500 space-y-1">
                              <p className="font-mono flex items-center gap-1 text-slate-700">
                                <Navigation size={10} className="text-[#FF9800]" /> Active Area: <span className="font-sans text-slate-800 font-medium">{camp.area}</span>
                              </p>
                              <p>Drivers send telemetry packets every 30 seconds via the AutoAdz Mobile GPS ping system.</p>
                            </div>
                          </div>
                        ))}

                        {/* Drivers currently Online and moving */}
                        <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                          <span className="text-[10px] font-bold text-slate-700 block uppercase">Online Drivers Feed</span>
                          <div className="space-y-1.5">
                            {drivers.map(d => (
                              <div key={d.id} className="flex justify-between items-center text-xs p-2 bg-slate-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${d.state === "tracking" ? "bg-green-500 animate-pulse" : d.state === "online" ? "bg-blue-500" : "bg-slate-300"}`}></div>
                                  <div>
                                    <span className="font-medium text-slate-800">{d.name}</span>
                                    <span className="text-[8px] text-slate-400 font-mono ml-1.5">({d.autoNumber})</span>
                                  </div>
                                </div>
                                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${d.state === "tracking" ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"}`}>
                                  {d.state === "tracking" ? "TRANSMITTING" : "STANDBY"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>
                    )}

                    {/* ADVERTISER AI STUDY TAB */}
                    {advertiserTab === "ai" && (
                      <div className="h-[520px]">
                        <AiAssistant embedded={true} />
                      </div>
                    )}

                    {/* ADVERTISER PROFILE TAB */}
                    {advertiserTab === "profile" && (
                      <div className="space-y-3">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 text-center space-y-2">
                          <div className="w-16 h-16 bg-[#0B1F4D] text-white rounded-full flex items-center justify-center font-display font-bold text-xl mx-auto shadow-md">
                            JD
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-slate-800">John Doe Advertisers</h4>
                            <p className="text-xs text-slate-400 font-mono">ID: ad_8492021</p>
                          </div>
                          <span className="inline-block bg-[#FF9800]/10 text-[#FF9800] text-[10px] font-bold px-3 py-1 rounded-full uppercase">
                            Verified Brand Account
                          </span>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 text-xs text-slate-700">
                          <div className="p-3 flex justify-between">
                            <span>Business Registration</span>
                            <span className="font-mono text-slate-500">GSTIN-29AAACA1100D</span>
                          </div>
                          <div className="p-3 flex justify-between">
                            <span>Phone Verified</span>
                            <span className="font-medium text-green-600">Yes (+91 999 888 7777)</span>
                          </div>
                          <div className="p-3 flex justify-between">
                            <span>Total Campaigns Launched</span>
                            <span className="font-bold text-slate-800">{campaigns.length}</span>
                          </div>
                          <div className="p-3 flex justify-between">
                            <span>Registered Office</span>
                            <span className="text-right text-slate-500">Indiranagar Double Road, Bangalore</span>
                          </div>
                        </div>

                        <div className="bg-slate-100 p-3 rounded-lg text-[10px] text-slate-400 font-mono text-center">
                          AutoAdz App Client v3.4.1 (Production Sandbox)
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Advertiser Bottom Navigation */}
                  <div className="absolute bottom-0 inset-x-0 h-16 bg-white border-t border-slate-200 flex items-center justify-around px-2 z-20 shrink-0 shadow-lg">
                    <button 
                      onClick={() => setAdvertiserTab("home")}
                      className={`flex flex-col items-center gap-1 ${advertiserTab === "home" ? "text-[#0B1F4D]" : "text-slate-400"}`}
                    >
                      <Smartphone size={16} />
                      <span className="text-[9px] font-bold uppercase tracking-wider">Home</span>
                    </button>
                    <button 
                      onClick={() => setAdvertiserTab("campaigns")}
                      className={`flex flex-col items-center gap-1 ${advertiserTab === "campaigns" ? "text-[#0B1F4D]" : "text-slate-400"}`}
                    >
                      <TrendingUp size={16} />
                      <span className="text-[9px] font-bold uppercase tracking-wider">Campaigns</span>
                    </button>
                    <button 
                      onClick={() => setAdvertiserTab("tracking")}
                      className={`flex flex-col items-center gap-1 ${advertiserTab === "tracking" ? "text-[#0B1F4D]" : "text-slate-400"}`}
                    >
                      <Map size={16} />
                      <span className="text-[9px] font-bold uppercase tracking-wider">Tracking</span>
                    </button>
                    <button 
                      onClick={() => setAdvertiserTab("ai")}
                      className={`flex flex-col items-center gap-1 ${advertiserTab === "ai" ? "text-[#0B1F4D] text-[#FF9800]" : "text-slate-400"}`}
                    >
                      <Sparkles size={16} />
                      <span className="text-[9px] font-bold uppercase tracking-wider">Planner AI</span>
                    </button>
                    <button 
                      onClick={() => setAdvertiserTab("profile")}
                      className={`flex flex-col items-center gap-1 ${advertiserTab === "profile" ? "text-[#0B1F4D]" : "text-slate-400"}`}
                    >
                      <User size={16} />
                      <span className="text-[9px] font-bold uppercase tracking-wider">Profile</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================== */}
              {/* INTERACTIVE DRIVER MOBILE APP VIEW */}
              {/* ========================================== */}
              {activeSimulator === "driver" && (
                <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
                  {/* App Header */}
                  <div className="bg-[#0B1F4D] text-white px-4 py-3 shrink-0 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-[#FF9800] rounded-lg flex items-center justify-center font-display font-bold text-xs text-white">
                        🚕
                      </div>
                      <div>
                        <h4 className="font-display font-bold text-xs tracking-tight">Rajesh Kumar</h4>
                        <span className="text-[9px] text-green-400 font-mono">KA-03-EX-4921</span>
                      </div>
                    </div>
                    
                    {/* Live tracking status */}
                    <button 
                      onClick={toggleDriverTracking}
                      className={`text-[9px] font-mono font-bold px-2 py-1 rounded-full flex items-center gap-1 transition-colors shadow-xs ${
                        drivers.find(d => d.id === "driver_1")?.state === "tracking"
                          ? "bg-green-500 text-white animate-pulse"
                          : "bg-slate-700 text-slate-300"
                      }`}
                    >
                      <Navigation size={10} />
                      {drivers.find(d => d.id === "driver_1")?.state === "tracking" ? "GPS ON" : "GPS OFF"}
                    </button>
                  </div>

                  {/* App Viewport Container */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-3 pb-20">
                    
                    {/* DRIVER DASHBOARD TAB */}
                    {driverTab === "dashboard" && (
                      <>
                        {/* Driver Quick Status Info */}
                        <div className="bg-gradient-to-r from-teal-900 to-[#0B1F4D] text-white rounded-2xl p-4 shadow-sm space-y-3 relative overflow-hidden">
                          <span className="text-[9px] text-teal-300 font-mono tracking-wider uppercase">Active Campaign Assigned</span>
                          
                          {drivers.find(d => d.id === "driver_1")?.currentCampaignId ? (
                            <div className="space-y-1">
                              <h4 className="font-bold text-xs text-[#FF9800] line-clamp-1">
                                {campaigns.find(c => c.id === drivers.find(d => d.id === "driver_1")?.currentCampaignId)?.title || "Tata Punch EV Bangalore"}
                              </h4>
                              <p className="text-[10px] text-slate-300">
                                Status: <span className="text-green-400 font-bold uppercase font-mono text-[9px]">Active Tracking</span>
                              </p>
                              <p className="text-[9px] text-slate-400 leading-tight">Cover daily kilometers to trigger payout calculations.</p>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <h4 className="font-bold text-xs text-red-400">No Campaign Linked</h4>
                              <p className="text-[9px] text-slate-300">Admin needs to verify your uploaded KYC/Documents before you can start.</p>
                            </div>
                          )}

                          <div className="pt-2 border-t border-white/10 flex justify-between items-center text-[10px]">
                            <span className="text-slate-300">Earnings rate: <b>₹4.50 per KM</b></span>
                            <span className="text-[#FF9800] font-mono">Target: 40 KM/day</span>
                          </div>
                        </div>

                        {/* Glassmorphism Statistics Grid for Driver */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-white p-3 rounded-xl border border-slate-150 shadow-xs">
                            <span className="text-slate-400 text-[9px] block uppercase">Today's KM</span>
                            <div className="flex items-baseline gap-1 mt-1">
                              <span className="text-lg font-bold text-[#0B1F4D] font-mono">
                                {drivers.find(d => d.id === "driver_1")?.state === "tracking" ? "84.2" : "42.0"}
                              </span>
                              <span className="text-green-500 text-[9px] font-medium font-mono">KM</span>
                            </div>
                          </div>
                          <div className="bg-white p-3 rounded-xl border border-slate-150 shadow-xs">
                            <span className="text-slate-400 text-[9px] block uppercase">Today's Income</span>
                            <div className="flex items-baseline gap-1 mt-1">
                              <span className="text-lg font-bold text-[#0B1F4D] font-mono">
                                ₹{drivers.find(d => d.id === "driver_1")?.state === "tracking" ? "378" : "189"}
                              </span>
                              <span className="text-blue-500 text-[9px] font-medium">Earned</span>
                            </div>
                          </div>
                          <div className="bg-white p-3 rounded-xl border border-slate-150 shadow-xs col-span-2 flex justify-between items-center">
                            <div>
                              <span className="text-slate-400 text-[9px] block uppercase">Wallet Balance Available</span>
                              <span className="text-base font-bold text-slate-800 font-mono">
                                ₹{drivers.find(d => d.id === "driver_1")?.walletBalance?.toLocaleString()}
                              </span>
                            </div>
                            <button 
                              onClick={() => setDriverTab("earnings")}
                              className="text-xs text-[#FF9800] hover:underline font-bold"
                            >
                              Withdraw Bank &gt;
                            </button>
                          </div>
                        </div>

                        {/* Driver KYC Registration Status Container */}
                        <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                          <span className="text-[10px] font-bold text-slate-700 block uppercase">KYC & Vehicle Documents Status</span>
                          <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-150 text-xs">
                            <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                              <CheckCircle size={16} />
                            </div>
                            <div>
                              <p className="font-bold text-slate-800">Driving License Verified</p>
                              <p className="text-[10px] text-slate-500">Auto RC Number: KA-03-EX-4921</p>
                            </div>
                          </div>
                        </div>

                        {/* Driver Registration Quick Form for demo other drivers */}
                        <div className="bg-slate-100 p-3.5 rounded-xl border border-slate-200 space-y-2">
                          <div className="flex justify-between items-center">
                            <h5 className="font-bold text-xs text-[#0B1F4D] flex items-center gap-1">
                              ✨ Sign Up Another Auto-Rickshaw
                            </h5>
                          </div>
                          <p className="text-[9px] text-slate-500">Demo registering a secondary driver. Then approve them instantly in the Admin Dashboard on the right!</p>

                          <form onSubmit={handleDriverRegister} className="space-y-1.5">
                            <input 
                              type="text"
                              required
                              placeholder="Driver Full Name"
                              value={driverRegName}
                              onChange={(e) => setDriverRegName(e.target.value)}
                              className="w-full text-[11px] bg-white border border-slate-200 rounded p-1.5 focus:outline-none"
                            />
                            <div className="grid grid-cols-2 gap-1.5">
                              <input 
                                type="text"
                                required
                                placeholder="Phone Number"
                                value={driverRegPhone}
                                onChange={(e) => setDriverRegPhone(e.target.value)}
                                className="w-full text-[11px] bg-white border border-slate-200 rounded p-1.5 focus:outline-none"
                              />
                              <input 
                                type="text"
                                placeholder="Auto No (e.g. KA-03-A-1234)"
                                value={driverRegAutoNum}
                                onChange={(e) => setDriverRegAutoNum(e.target.value)}
                                className="w-full text-[11px] bg-white border border-slate-200 rounded p-1.5 focus:outline-none"
                              />
                            </div>
                            <button 
                              type="submit"
                              className="w-full bg-[#FF9800] hover:bg-orange-600 text-[#0B1F4D] text-[10px] font-bold py-1.5 rounded transition"
                            >
                              SUBMIT KYC APPLICATION
                            </button>
                          </form>
                          {driverSuccessMsg && (
                            <p className="text-[10px] text-green-700 font-medium text-center mt-1">{driverSuccessMsg}</p>
                          )}
                        </div>
                      </>
                    )}

                    {/* DRIVER PHOTO PROOF TAB */}
                    {driverTab === "proof" && (
                      <div className="space-y-3">
                        <div className="bg-white p-3 rounded-xl border border-slate-200">
                          <h5 className="font-bold text-xs text-[#0B1F4D] flex items-center gap-1">
                            <Camera size={12} className="text-[#FF9800]" /> Check-In Photo Proof Upload
                          </h5>
                          <p className="text-[10px] text-slate-400 mt-1">Submit visual check-ins to unlock daily payouts. Admin audits images in real-time.</p>
                        </div>

                        <form onSubmit={handleUploadProof} className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                          <div>
                            <label className="text-[10px] text-slate-500 block font-medium">Select Campaign</label>
                            <select 
                              value={selectedCampaignForProof}
                              onChange={(e) => setSelectedCampaignForProof(e.target.value)}
                              className="w-full text-xs border border-slate-200 rounded p-1.5 bg-slate-50"
                            >
                              {campaigns.map(c => (
                                <option key={c.id} value={c.id}>{c.title}</option>
                              ))}
                            </select>
                          </div>

                          <div className="grid grid-cols-3 gap-1.5 text-center">
                            <button
                              type="button"
                              onClick={() => setSelectedProofType("installation")}
                              className={`p-1.5 rounded text-[10px] font-bold border transition ${
                                selectedProofType === "installation" ? "bg-[#0B1F4D] text-white border-[#0B1F4D]" : "border-slate-200 text-slate-600"
                              }`}
                            >
                              Installation
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedProofType("morning")}
                              className={`p-1.5 rounded text-[10px] font-bold border transition ${
                                selectedProofType === "morning" ? "bg-[#0B1F4D] text-white border-[#0B1F4D]" : "border-slate-200 text-slate-600"
                              }`}
                            >
                              Morning Check
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedProofType("evening")}
                              className={`p-1.5 rounded text-[10px] font-bold border transition ${
                                selectedProofType === "evening" ? "bg-[#0B1F4D] text-white border-[#0B1F4D]" : "border-slate-200 text-slate-600"
                              }`}
                            >
                              Evening Check
                            </button>
                          </div>

                          <div>
                            <label className="text-[10px] text-slate-500 block font-medium">Simulation Photo Template</label>
                            <div className="grid grid-cols-2 gap-2 mt-1">
                              <button
                                type="button"
                                onClick={() => setCustomProofImg("https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=800")}
                                className={`p-1 rounded border text-left flex items-center gap-1 transition ${
                                  customProofImg.includes("558981806") ? "border-[#FF9800]" : "border-slate-200"
                                }`}
                              >
                                <img src="https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=800" className="w-8 h-8 rounded object-cover" alt="" />
                                <span className="text-[8px] text-slate-600 font-mono">Auto Side Banner</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setCustomProofImg("https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&q=80&w=800")}
                                className={`p-1 rounded border text-left flex items-center gap-1 transition ${
                                  customProofImg.includes("568605117") ? "border-[#FF9800]" : "border-slate-200"
                                }`}
                              >
                                <img src="https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&q=80&w=800" className="w-8 h-8 rounded object-cover" alt="" />
                                <span className="text-[8px] text-slate-600 font-mono">Auto Rear Hood</span>
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] text-slate-500 block font-medium font-mono">Simulated GPS Coordinates Pin</label>
                            <input 
                              type="text"
                              value={proofLocation}
                              onChange={(e) => setProofLocation(e.target.value)}
                              className="w-full text-[11px] border border-slate-200 rounded p-1.5 focus:outline-none"
                            />
                          </div>

                          <button 
                            type="submit"
                            className="w-full bg-[#0B1F4D] hover:bg-slate-800 text-white font-bold py-2 rounded text-xs transition"
                          >
                            UPLOAD PROOF TO ADMIN
                          </button>

                          {driverCheckInMsg && (
                            <p className="text-[10px] text-center text-green-700 font-bold bg-green-50 rounded p-1.5 border border-green-200">{driverCheckInMsg}</p>
                          )}
                        </form>

                        <div className="bg-white p-3 rounded-xl border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-700 block uppercase mb-1.5">My Upload History</span>
                          <div className="space-y-1.5">
                            {proofs.filter(p => p.driverId === "driver_1").slice(0, 3).map(p => (
                              <div key={p.id} className="flex justify-between items-center bg-slate-50 p-2 rounded text-xs border border-slate-100">
                                <div className="flex items-center gap-2">
                                  <img src={p.imageUrl} className="w-8 h-8 rounded object-cover" alt="" />
                                  <div>
                                    <p className="font-bold text-slate-800 uppercase text-[9px]">{p.type}</p>
                                    <p className="text-[8px] text-slate-400 truncate w-32">{p.location}</p>
                                  </div>
                                </div>
                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                  p.status === "approved" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                                }`}>
                                  {p.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* DRIVER KM TRACKER TAB */}
                    {driverTab === "tracker" && (
                      <div className="space-y-3">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 text-center space-y-2">
                          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                            <Navigation className="animate-pulse" size={24} />
                          </div>
                          <div>
                            <h4 className="font-bold text-xs text-slate-800">Dynamic GPS Telematics Link</h4>
                            <p className="text-[10px] text-slate-400">Your smartphone transmits precise location coordinates to the advertiser client dashboard.</p>
                          </div>
                        </div>

                        {/* Interactive toggle block */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 text-center space-y-3">
                          <span className="text-[10px] font-bold text-slate-500 block uppercase">Tracking Toggle Status</span>
                          <h2 className="text-2xl font-mono font-black text-[#0B1F4D]">
                            {drivers.find(d => d.id === "driver_1")?.state === "tracking" ? "📍 TRANSMITTING LIVE" : "❌ OFF - STANDBY"}
                          </h2>
                          <p className="text-[10px] text-slate-400 leading-tight">Click below to start/stop campaign miles tracking for Bangalore zone.</p>
                          <button
                            onClick={toggleDriverTracking}
                            className={`w-full font-bold py-2.5 rounded-xl text-xs transition-colors ${
                              drivers.find(d => d.id === "driver_1")?.state === "tracking"
                                ? "bg-red-500 hover:bg-red-600 text-white"
                                : "bg-[#FF9800] hover:bg-orange-500 text-[#0B1F4D]"
                            }`}
                          >
                            {drivers.find(d => d.id === "driver_1")?.state === "tracking" ? "STOP TRACKING" : "START TRACKING WORK"}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* DRIVER WALLET & EARNINGS TAB */}
                    {driverTab === "earnings" && (
                      <div className="space-y-3">
                        <div className="bg-white p-3 rounded-xl border border-slate-200">
                          <span className="text-[9px] text-slate-400 block uppercase">Accumulated Lifetime Earnings</span>
                          <h2 className="text-3xl font-display font-extrabold text-[#0B1F4D] mt-1 text-center">
                            ₹{drivers.find(d => d.id === "driver_1")?.totalEarnings?.toLocaleString()}
                          </h2>
                          <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs">
                            <div className="bg-slate-50 p-2 rounded">
                              <span className="text-slate-500 block text-[9px]">Wallet Balance</span>
                              <span className="font-bold text-slate-800 font-mono">₹{drivers.find(d => d.id === "driver_1")?.walletBalance}</span>
                            </div>
                            <div className="bg-slate-50 p-2 rounded">
                              <span className="text-slate-500 block text-[9px]">Rate / KM</span>
                              <span className="font-bold text-green-600 font-mono">₹4.50 INR</span>
                            </div>
                          </div>
                        </div>

                        {/* Withdrawal Request Panel */}
                        <form onSubmit={handleWithdrawal} className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                          <span className="text-[10px] font-bold text-slate-700 block uppercase">Withdraw to Registered Bank</span>
                          <p className="text-[9px] text-slate-400">Instant payout via IMPS. Minimum withdrawal: ₹500.</p>
                          <div className="flex gap-2">
                            <input 
                              type="number"
                              required
                              placeholder="Enter amount (e.g. 1000)"
                              value={withdrawAmount}
                              onChange={(e) => setWithdrawAmount(e.target.value)}
                              className="flex-1 text-xs border border-slate-200 rounded p-1.5 focus:outline-none"
                            />
                            <button 
                              type="submit"
                              className="bg-[#0B1F4D] hover:bg-slate-800 text-white font-bold px-3 py-1 rounded text-xs transition"
                            >
                              WITHDRAW
                            </button>
                          </div>
                          {walletSuccessMsg && (
                            <p className="text-[10px] text-green-700 font-medium text-center">{walletSuccessMsg}</p>
                          )}
                        </form>

                        {/* Support chat block */}
                        <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                          <span className="text-[10px] font-bold text-slate-700 block uppercase flex items-center gap-1">
                            <HelpCircle size={12} className="text-[#FF9800]" /> Help & Support Chat
                          </span>
                          
                          <div className="h-28 overflow-y-auto bg-slate-50 border border-slate-100 rounded-lg p-2 space-y-2 text-[10px] scrollbar-none">
                            {driverMessages.map((msg, idx) => (
                              <div key={idx} className={`flex flex-col max-w-[85%] ${msg.sender === "driver" ? "ml-auto text-right" : "mr-auto"}`}>
                                <div className={`p-2 rounded-lg leading-snug ${msg.sender === 'driver' ? 'bg-[#0B1F4D] text-white rounded-tr-none' : 'bg-white text-slate-800 border rounded-tl-none'}`}>
                                  {msg.text}
                                </div>
                                <span className="text-[8px] text-slate-400 mt-0.5 font-mono">{msg.time}</span>
                              </div>
                            ))}
                          </div>

                          <form onSubmit={handleDriverSendMsg} className="flex gap-1.5">
                            <input 
                              type="text"
                              placeholder="Ask driver care..."
                              value={driverChatInput}
                              onChange={(e) => setDriverChatInput(e.target.value)}
                              className="flex-1 text-[11px] border border-slate-200 rounded px-2 py-1 focus:outline-none"
                            />
                            <button type="submit" className="bg-[#FF9800] text-[#0B1F4D] px-2.5 py-1 rounded text-[11px] font-bold">
                              Send
                            </button>
                          </form>
                        </div>
                      </div>
                    )}

                    {/* DRIVER PROFILE TAB */}
                    {driverTab === "profile" && (
                      <div className="space-y-3">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 text-center space-y-2">
                          <div className="w-16 h-16 bg-slate-300 text-slate-800 rounded-full flex items-center justify-center font-display font-bold text-xl mx-auto">
                            RK
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-slate-800">Rajesh Kumar</h4>
                            <p className="text-xs text-slate-400 font-mono">Karnataka Auto Registry</p>
                          </div>
                          <span className="inline-block bg-green-100 text-green-700 text-[10px] font-bold px-3 py-1 rounded-full uppercase">
                            KYC Verified
                          </span>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 text-xs text-slate-700">
                          <div className="p-3 flex justify-between">
                            <span>Vehicle Model</span>
                            <span className="font-mono text-slate-500">Bajaj RE E-Tec Super</span>
                          </div>
                          <div className="p-3 flex justify-between">
                            <span>Phone Verified</span>
                            <span className="font-medium text-green-600">Yes (+91 9876543210)</span>
                          </div>
                          <div className="p-3 flex justify-between">
                            <span>Registered Zone</span>
                            <span className="font-bold text-slate-800">Bangalore North Metro</span>
                          </div>
                          <div className="p-3 flex justify-between">
                            <span>Bank Account Linked</span>
                            <span className="text-right text-slate-500 font-mono">HDFC Bank **** 4921</span>
                          </div>
                        </div>

                        <div className="bg-slate-100 p-3 rounded-lg text-[10px] text-slate-400 font-mono text-center">
                          AutoAdz Driver v2.8.2 (Sandbox Secure)
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Driver Bottom Navigation */}
                  <div className="absolute bottom-0 inset-x-0 h-16 bg-white border-t border-slate-200 flex items-center justify-around px-2 z-20 shrink-0 shadow-lg">
                    <button 
                      onClick={() => setDriverTab("dashboard")}
                      className={`flex flex-col items-center gap-1 ${driverTab === "dashboard" ? "text-[#0B1F4D]" : "text-slate-400"}`}
                    >
                      <Smartphone size={16} />
                      <span className="text-[9px] font-bold uppercase tracking-wider">Dashboard</span>
                    </button>
                    <button 
                      onClick={() => setDriverTab("proof")}
                      className={`flex flex-col items-center gap-1 ${driverTab === "proof" ? "text-[#0B1F4D]" : "text-slate-400"}`}
                    >
                      <Camera size={16} />
                      <span className="text-[9px] font-bold uppercase tracking-wider">Upload Proof</span>
                    </button>
                    <button 
                      onClick={() => setDriverTab("tracker")}
                      className={`flex flex-col items-center gap-1 ${driverTab === "tracker" ? "text-[#0B1F4D]" : "text-slate-400"}`}
                    >
                      <Navigation size={16} />
                      <span className="text-[9px] font-bold uppercase tracking-wider">KM Tracker</span>
                    </button>
                    <button 
                      onClick={() => setDriverTab("earnings")}
                      className={`flex flex-col items-center gap-1 ${driverTab === "earnings" ? "text-[#0B1F4D]" : "text-slate-400"}`}
                    >
                      <Wallet size={16} />
                      <span className="text-[9px] font-bold uppercase tracking-wider">Earnings</span>
                    </button>
                    <button 
                      onClick={() => setDriverTab("profile")}
                      className={`flex flex-col items-center gap-1 ${driverTab === "profile" ? "text-[#0B1F4D]" : "text-slate-400"}`}
                    >
                      <User size={16} />
                      <span className="text-[9px] font-bold uppercase tracking-wider">Profile</span>
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: REVENUE, TELEMETRY & ADMIN (55% Width) */}
        {/* ========================================================= */}
        <div className="xl:col-span-7 flex flex-col gap-6">
          
          {/* Admin Control Header */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="font-display font-extrabold text-[#0B1F4D] text-lg flex items-center gap-2">
                  <Shield size={20} className="text-[#FF9800]" />
                  AutoAdz Master Admin Panel
                </h3>
                <p className="text-xs text-slate-500 font-mono">Verify KYC, Audit image uploads, approve payments, view telemetry mapping.</p>
              </div>

              {/* Admin Selector Navigation */}
              <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 shrink-0 text-xs font-semibold">
                <button 
                  onClick={() => setAdminTab("campaigns")}
                  className={`px-3 py-1.5 rounded-md transition ${adminTab === "campaigns" ? "bg-white text-[#0B1F4D] shadow-2xs" : "text-slate-600 hover:bg-slate-50"}`}
                >
                  Campaigns ({campaigns.length})
                </button>
                <button 
                  onClick={() => setAdminTab("drivers")}
                  className={`px-3 py-1.5 rounded-md transition ${adminTab === "drivers" ? "bg-white text-[#0B1F4D] shadow-2xs" : "text-slate-600 hover:bg-slate-50"}`}
                >
                  Drivers KYC ({drivers.length})
                </button>
                <button 
                  onClick={() => setAdminTab("proofs")}
                  className={`px-3 py-1.5 rounded-md transition ${adminTab === "proofs" ? "bg-white text-[#0B1F4D] shadow-2xs" : "text-slate-600 hover:bg-slate-50"}`}
                >
                  Audit Proofs ({proofs.length})
                </button>
              </div>
            </div>
          </div>

          {/* Dynamic Admin Viewports */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 flex-1 min-h-[420px] flex flex-col">
            
            {/* ADMIN CAMPAIGNS SUB-TAB */}
            {adminTab === "campaigns" && (
              <div className="space-y-4 flex-1 flex flex-col">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <h4 className="font-bold text-sm text-[#0B1F4D] uppercase font-mono tracking-wider">Campaign Booking Approvals</h4>
                  <span className="text-xs text-slate-400">Funds are auto-held from advertiser wallets</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase font-mono">
                        <th className="py-2.5">Campaign Info</th>
                        <th className="py-2.5">Zone/City</th>
                        <th className="py-2.5">Autos</th>
                        <th className="py-2.5">Budget</th>
                        <th className="py-2.5 text-right">Action Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {campaigns.map((camp) => (
                        <tr key={camp.id} className="hover:bg-slate-50/50 transition">
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <img src={camp.creativeUrl} className="w-8 h-8 rounded object-cover border border-slate-200 shrink-0" alt="" />
                              <div>
                                <p className="font-bold text-slate-800">{camp.title}</p>
                                <p className="text-[10px] text-slate-400">Client: {camp.client}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3">
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono text-[10px] font-bold">
                              {camp.city}
                            </span>
                            <span className="text-[10px] text-slate-500 block">{camp.area}</span>
                          </td>
                          <td className="py-3 font-mono font-bold">{camp.autosCount} Autos</td>
                          <td className="py-3 font-mono font-bold text-[#FF9800]">₹{camp.budget.toLocaleString()}</td>
                          <td className="py-3 text-right">
                            {camp.status === "pending" ? (
                              <div className="flex justify-end gap-1.5">
                                <button
                                  onClick={() => handleVerifyCampaign(camp.id, "active")}
                                  className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-[10px] font-bold transition flex items-center gap-0.5"
                                >
                                  <Check size={10} /> Approve
                                </button>
                                <button
                                  onClick={() => handleVerifyCampaign(camp.id, "completed")}
                                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-1 rounded text-[10px] font-bold transition"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className={`text-[10px] font-mono font-bold uppercase px-2 py-1 rounded-full ${
                                camp.status === "active" ? "bg-green-100 text-green-700 border border-green-200" :
                                "bg-slate-100 text-slate-500 border border-slate-200"
                              }`}>
                                {camp.status}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ADMIN DRIVERS KYC SUB-TAB */}
            {adminTab === "drivers" && (
              <div className="space-y-4 flex-1 flex flex-col">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <h4 className="font-bold text-sm text-[#0B1F4D] uppercase font-mono tracking-wider">Driver Registrations & KYC Vault</h4>
                  <span className="text-xs text-slate-400">Approval links driver to active local campaigns</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase font-mono">
                        <th className="py-2.5">Driver Info</th>
                        <th className="py-2.5">Auto Plate</th>
                        <th className="py-2.5">Location</th>
                        <th className="py-2.5 text-center">License KYC</th>
                        <th className="py-2.5 text-right">Verification Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {drivers.map((driver) => (
                        <tr key={driver.id} className="hover:bg-slate-50/50 transition">
                          <td className="py-3">
                            <div>
                              <p className="font-bold text-slate-800">{driver.name}</p>
                              <p className="text-[10px] text-slate-400">Tel: {driver.phone}</p>
                            </div>
                          </td>
                          <td className="py-3 font-mono font-bold text-[#0B1F4D]">{driver.autoNumber}</td>
                          <td className="py-3">{driver.location}</td>
                          <td className="py-3 text-center">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              driver.kycVerified ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700 animate-pulse"
                            }`}>
                              {driver.kycVerified ? "APPROVED" : "PENDING AUDIT"}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            {driver.status === "pending_approval" ? (
                              <div className="flex justify-end gap-1.5">
                                <button
                                  onClick={() => handleVerifyDriver(driver.id, true)}
                                  className="bg-[#0B1F4D] hover:bg-slate-800 text-white px-2 py-1 rounded text-[10px] font-bold transition flex items-center gap-0.5"
                                >
                                  <Check size={10} /> Accept & Link
                                </button>
                                <button
                                  onClick={() => handleVerifyDriver(driver.id, false)}
                                  className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-[10px] font-bold transition"
                                >
                                  Decline
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] font-mono font-bold uppercase text-green-700 bg-green-50 px-2 py-1 rounded border border-green-150">
                                ACTIVE CARRIER
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ADMIN AUDIT PROOFS SUB-TAB */}
            {adminTab === "proofs" && (
              <div className="space-y-4 flex-1 flex flex-col">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <h4 className="font-bold text-sm text-[#0B1F4D] uppercase font-mono tracking-wider">Photo Proof Checklist Auditing</h4>
                  <span className="text-xs text-slate-400">Approving check-ins triggers auto-payout of ₹450 to drivers</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {proofs.map((p) => (
                    <div key={p.id} className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-3 flex flex-col justify-between">
                      <div className="flex gap-3">
                        <img src={p.imageUrl} className="w-16 h-16 rounded-lg object-cover border border-slate-300 shrink-0" alt="" />
                        <div className="space-y-1 min-w-0">
                          <span className="bg-orange-100 text-orange-800 text-[8px] font-bold font-mono px-1.5 py-0.5 rounded uppercase">
                            {p.type} Proof
                          </span>
                          <p className="font-bold text-xs text-slate-800 truncate">{p.campaignTitle}</p>
                          <p className="text-[10px] text-slate-500">Driver: <b>{p.driverName}</b></p>
                          <p className="text-[9px] text-slate-400 italic flex items-center gap-0.5 truncate">
                            <MapPin size={8} /> {p.location}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2.5 border-t border-slate-200">
                        <span className="text-[9px] text-slate-400 font-mono">{p.timestamp}</span>
                        {p.status === "pending" ? (
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleAuditProof(p.id, "approved")}
                              className="bg-green-500 hover:bg-green-600 text-white px-2.5 py-1 rounded text-[10px] font-bold flex items-center gap-0.5"
                            >
                              <ThumbsUp size={10} /> Approve & Payout
                            </button>
                            <button
                              onClick={() => handleAuditProof(p.id, "rejected")}
                              className="bg-red-500 hover:bg-red-600 text-white px-2.5 py-1 rounded text-[10px] font-bold"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                            p.status === "approved" ? "bg-green-100 text-green-700 border border-green-200" :
                            "bg-red-100 text-red-700 border border-red-200"
                          }`}>
                            {p.status}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* SIMULATED MAP TELEMATICS CARD */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h4 className="font-display font-bold text-sm text-[#0B1F4D] flex items-center gap-2">
                <MapPin size={16} className="text-[#FF9800] animate-bounce" />
                Live campaign GPS tracking simulator
              </h4>
              <div className="bg-green-500/10 text-green-600 text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></span>
                ACTIVE FEED
              </div>
            </div>

            {/* Map Rendering Container */}
            <div className="h-64 bg-slate-900 rounded-2xl relative overflow-hidden shadow-inner border border-slate-800">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:16px_16px]"></div>
              
              {/* Fake Bangalore Roads SVG grid overlay */}
              <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
                <path d="M 0 100 Q 150 150 300 100 T 600 200" fill="none" stroke="white" strokeWidth="2" strokeDasharray="5,5" />
                <path d="M 100 0 Q 250 250 400 600" fill="none" stroke="white" strokeWidth="1.5" />
                <path d="M 0 350 H 600" fill="none" stroke="white" strokeWidth="3" />
                <circle cx="280" cy="180" r="120" fill="none" stroke="white" strokeWidth="1" strokeDasharray="3,6" />
              </svg>

              {/* Live active drivers pin mapping */}
              {drivers.map((driver, idx) => {
                // Seed different locations for visual variance
                const mapCoords = [
                  { top: "35%", left: "40%" },
                  { top: "60%", left: "70%" },
                  { top: "25%", left: "80%" },
                  { top: "75%", left: "20%" },
                ];
                const pos = mapCoords[idx % mapCoords.length];

                return (
                  <div 
                    key={driver.id} 
                    className="absolute"
                    style={{ top: pos.top, left: pos.left }}
                  >
                    {/* Pulsing radar */}
                    {driver.state === "tracking" && (
                      <span className="absolute -inset-2.5 rounded-full bg-orange-500/30 animate-ping"></span>
                    )}

                    <div className="relative group cursor-pointer">
                      <div className={`w-3.5 h-3.5 rounded-full border-2 border-white shadow-md transition-colors ${
                        driver.state === "tracking" ? "bg-[#FF9800]" : driver.state === "online" ? "bg-blue-500" : "bg-slate-400"
                      }`}></div>
                      
                      {/* Driver Tooltip Label */}
                      <div className="absolute top-5 left-1/2 transform -translate-x-1/2 bg-slate-950/95 text-white text-[9px] font-mono p-1 rounded whitespace-nowrap opacity-100 shadow-lg border border-slate-800">
                        <p className="font-bold">{driver.name}</p>
                        <p className="text-slate-400">No: {driver.autoNumber}</p>
                        <p className={`font-semibold ${driver.state === "tracking" ? "text-green-400" : "text-slate-300"}`}>
                          {driver.state === "tracking" ? "📍 TRACKING KM" : "STANDBY"}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Map UI Control overlays */}
              <div className="absolute bottom-3 left-3 bg-slate-950/90 text-white p-3 rounded-lg border border-slate-800 text-[10px] space-y-1 z-10 font-mono">
                <p className="font-bold text-[#FF9800]">📡 SATELLITE TELEMETRY</p>
                <p>Zone: Bangalore Central</p>
                <p>Ping Rate: 0.8s (Adaptive)</p>
                <div className="flex gap-2.5 pt-1 text-[9px]">
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-[#FF9800] rounded-full"></span> Tracking</span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> Standby</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
