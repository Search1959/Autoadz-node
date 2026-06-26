import React, { useState, useEffect, useRef } from "react";
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
  Clock, Timer, AlertCircle, X, ChevronRight, Image as ImageIcon, 
  FileText, Wallet, Bell, User, Map, Settings, Send, Edit, Save, 
  Smartphone, Shield, Check, RotateCcw, Camera, HelpCircle, 
  TrendingUp, Award, Navigation, RefreshCw, Eye, ThumbsUp, 
  ThumbsDown, Sparkles, MessageSquare, Activity, ShieldAlert,
  Sun, Moon, Upload, Trash2, Layers
} from "lucide-react";
import AiAssistant from "./components/AiAssistant";

export default function App() {
  // Simulator state
  const [activeSimulator, setActiveSimulator] = useState<"advertiser" | "driver">("advertiser");

  // User Authentication and Portal isolation state
  const [userSession, setUserSession] = useState<"advertiser" | "driver" | "admin" | null>(null);
  const [loggedInDriverId, setLoggedInDriverId] = useState<string>("driver_delip");
  const [landingSection, setLandingSection] = useState<"hero" | "register-campaign" | "register-driver" | "login">("hero");
  const [campaignSuccessMsg, setCampaignSuccessMsg] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginPhone, setLoginPhone] = useState("");
  const [loginOtp, setLoginOtp] = useState("");
  const [loginError, setLoginError] = useState("");
  const [activeLoginSubTab, setActiveLoginSubTab] = useState<"advertiser" | "driver" | "admin">("advertiser");

  // Advertiser Reach Calculator States
  const [calcVehicles, setCalcVehicles] = useState<number>(25);
  const [calcDays, setCalcDays] = useState<number>(30);

  // Advertiser Profile State (persisted to localStorage)
  const [advBrandName, setAdvBrandName] = useState(() => localStorage.getItem("autoadz_adv_brand_name") || "John Doe Advertisers");
  const [advBrandId, setAdvBrandId] = useState(() => localStorage.getItem("autoadz_adv_brand_id") || "ad_8492021");
  const [advGstin, setAdvGstin] = useState(() => localStorage.getItem("autoadz_adv_gstin") || "GSTIN-29AAACA1100D");
  const [advPhone, setAdvPhone] = useState(() => localStorage.getItem("autoadz_adv_phone") || "+91 999 888 7777");
  const [advOffice, setAdvOffice] = useState(() => localStorage.getItem("autoadz_adv_office") || "Indiranagar Double Road, Bangalore");
  const [isEditingAdvProfile, setIsEditingAdvProfile] = useState(false);

  // Temporary states for editing profile
  const [tempBrandName, setTempBrandName] = useState("");
  const [tempBrandId, setTempBrandId] = useState("");
  const [tempGstin, setTempGstin] = useState("");
  const [tempPhone, setTempPhone] = useState("");
  const [tempOffice, setTempOffice] = useState("");

  const startEditingProfile = () => {
    setTempBrandName(advBrandName);
    setTempBrandId(advBrandId);
    setTempGstin(advGstin);
    setTempPhone(advPhone);
    setTempOffice(advOffice);
    setIsEditingAdvProfile(true);
  };

  const saveProfileChanges = () => {
    localStorage.setItem("autoadz_adv_brand_name", tempBrandName);
    localStorage.setItem("autoadz_adv_brand_id", tempBrandId);
    localStorage.setItem("autoadz_adv_gstin", tempGstin);
    localStorage.setItem("autoadz_adv_phone", tempPhone);
    localStorage.setItem("autoadz_adv_office", tempOffice);

    setAdvBrandName(tempBrandName);
    setAdvBrandId(tempBrandId);
    setAdvGstin(tempGstin);
    setAdvPhone(tempPhone);
    setAdvOffice(tempOffice);
    setIsEditingAdvProfile(false);
  };

  const getBrandInitials = (name: string) => {
    if (!name) return "AD";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Admin Driver Management states
  const [adminEditingDriver, setAdminEditingDriver] = useState<Driver | null>(null);
  const [adminAddingDriver, setAdminAddingDriver] = useState<boolean>(false);
  const [adminDriverFormName, setAdminDriverFormName] = useState("");
  const [adminDriverFormPhone, setAdminDriverFormPhone] = useState("");
  const [adminDriverFormAuto, setAdminDriverFormAuto] = useState("");
  const [adminDriverFormLoc, setAdminDriverFormLoc] = useState("");
  const [adminDriverFormKyc, setAdminDriverFormKyc] = useState<boolean>(false);
  const [adminDriverFormStatus, setAdminDriverFormStatus] = useState<"pending_approval" | "active" | "rejected">("pending_approval");

  // Telematics Ride Simulator
  const [simulatedKmsToday, setSimulatedKmsToday] = useState<number>(42.0);
  const [simulatedKmsTotal, setSimulatedKmsTotal] = useState<number>(14250);
  const [isSimulatingDrive, setIsSimulatingDrive] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [faqSearchQuery, setFaqSearchQuery] = useState("");
  const [faqActiveTab, setFaqActiveTab] = useState<"All" | "Advertisers" | "Drivers" | "General">("All");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Unified Help Center & FAQ Modal
  const renderHelpModal = () => {
    if (!showHelpModal) return null;

    const faqItems = [
      {
        category: "General",
        question: "What is AutoAdz.in?",
        answer: "AutoAdz.in is India's leading database-driven, GPS-tracked auto-rickshaw out-of-home (OOH) transit advertising platform. We turn thousands of high-mileage auto-rickshaws into moving smart billboards, allowing brands to broadcast their messages with full geographic tracking and verified visual campaign proof."
      },
      {
        category: "Advertisers",
        question: "How do we track our campaign performance in real-time?",
        answer: "Unlike traditional static billboards, AutoAdz.in offers a dynamic advertiser dashboard with actual telemetry tracking. Every driver is linked to our real-time GPS tracking application. You can view live active drivers, route maps, total kilometers travelled, calculated local ad impressions, heatmaps of high-reach areas, and historic daily check-in logs with verified photos."
      },
      {
        category: "Advertisers",
        question: "Can I upload custom brand creatives?",
        answer: "Yes! While launching a campaign, you can select from our professionally curated, high-conversion graphic templates (like Edge Fashion or Vogue Essentials) or easily upload your own custom banner artwork (via direct image file upload or by pasting a public image URL) to fit our premium auto hood dimension standards."
      },
      {
        category: "Advertisers",
        question: "What areas and cities can I target?",
        answer: "We cover major metros including Bangalore, Mumbai, Delhi NCR, and Hyderabad. During campaign registration, you can specify your city and target high-density business/residential areas (e.g., Koramangala, Indiranagar, HSR Layout, or Whitefield in Bangalore) for hyper-local impact."
      },
      {
        category: "Drivers",
        question: "How do auto-rickshaw drivers register and earn?",
        answer: "Drivers can register directly via the 'Become a Driver Partner' section by providing their phone number, auto rickshaw vehicle number, and preferred driving region. They log in to their driver partner portal, start live GPS sessions during hours of operation, and earn direct payouts calculated based on verified kilometers driven, daily campaign photo check-ins, and consistent uptime."
      },
      {
        category: "Drivers",
        question: "How is visual display verification managed?",
        answer: "To keep campaigns fully transparent, drivers are required to submit live photos showing the correct brand graphic clearly mounted on the back or hood of their auto-rickshaw (e.g., Morning and Evening Installation check-ins). These uploads are cross-referenced with date-stamps and geofencing to protect brand integrity."
      },
      {
        category: "General",
        question: "What is the Campaign Simulator?",
        answer: "The built-in sandbox simulator allows you to experience both sides of our ecosystem! You can toggle between being an 'Advertiser' (launching campaigns, visualizing telemetry maps, verifying driver proofs) and a 'Driver' (simulating active driving sessions, mock-generating GPS coordinates, and uploading daily installation check-in proof photos)."
      }
    ];

    const filteredFaqs = faqItems.filter(item => {
      const matchesTab = faqActiveTab === "All" || item.category === faqActiveTab;
      const matchesSearch = item.question.toLowerCase().includes(faqSearchQuery.toLowerCase()) || 
                            item.answer.toLowerCase().includes(faqSearchQuery.toLowerCase()) ||
                            item.category.toLowerCase().includes(faqSearchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });

    return (
      <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[100] flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl h-[85vh] flex flex-col shadow-2xl relative overflow-hidden text-left">
          
          {/* Decorative Radial Accents */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF9800]/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl pointer-events-none"></div>

          {/* Header */}
          <div className="p-6 border-b border-slate-800/80 flex items-center justify-between shrink-0 bg-slate-950/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500/10 text-[#FF9800] rounded-2xl flex items-center justify-center border border-orange-500/20">
                <HelpCircle size={20} />
              </div>
              <div>
                <h3 className="font-display font-extrabold text-white text-base">AutoAdz.in Help Center & FAQ</h3>
                <p className="text-[11px] text-slate-400 font-sans">Everything you need to know about GPS-tracked Transit Out-of-Home (OOH) advertising</p>
              </div>
            </div>
            <button 
              onClick={() => {
                setShowHelpModal(false);
                setFaqSearchQuery("");
                setExpandedFaq(null);
              }}
              className="p-2 hover:bg-slate-850 text-slate-400 hover:text-white rounded-xl transition duration-200"
            >
              <X size={18} />
            </button>
          </div>

          {/* Search and Category Filter Section */}
          <div className="p-6 pb-2 border-b border-slate-850 bg-slate-950/20 shrink-0 space-y-4">
            {/* Live Filter Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
              <input 
                type="text"
                placeholder="Search frequently asked questions (e.g., GPS, creatives, driver payout...)"
                value={faqSearchQuery}
                onChange={(e) => setFaqSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF9800] focus:ring-1 focus:ring-[#FF9800] transition font-medium"
              />
              {faqSearchQuery && (
                <button 
                  onClick={() => setFaqSearchQuery("")}
                  className="absolute right-3.5 top-3 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Category Filter Tabs */}
            <div className="flex gap-2 border-b border-slate-850 pb-2 overflow-x-auto scrollbar-none">
              {(["All", "Advertisers", "Drivers", "General"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setFaqActiveTab(tab);
                    setExpandedFaq(null);
                  }}
                  className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition whitespace-nowrap ${
                    faqActiveTab === tab 
                      ? "bg-[#FF9800] text-slate-950" 
                      : "bg-slate-950/40 text-slate-400 border border-slate-800/60 hover:text-white hover:border-slate-700"
                  }`}
                >
                  {tab === "All" ? "⭐ ALL QUESTIONS" : tab === "Advertisers" ? "💼 FOR ADVERTISERS" : tab === "Drivers" ? "🛺 FOR DRIVERS" : "🌐 GENERAL INFO"}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable Q&A Accordion List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-slate-950/10">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((item, idx) => {
                const originalIndex = faqItems.findIndex(f => f.question === item.question);
                const isExpanded = expandedFaq === originalIndex;
                return (
                  <div 
                    key={idx}
                    className={`border rounded-2xl transition duration-200 overflow-hidden ${
                      isExpanded 
                        ? "border-[#FF9800]/50 bg-slate-850/60 shadow-lg shadow-orange-500/5" 
                        : "border-slate-800/80 bg-slate-900 hover:bg-slate-850/30 hover:border-slate-700"
                    }`}
                  >
                    {/* Accordion Trigger Head */}
                    <button
                      onClick={() => setExpandedFaq(isExpanded ? null : originalIndex)}
                      className="w-full p-4 flex items-center justify-between text-left gap-4 font-sans"
                    >
                      <div className="space-y-1">
                        <span className={`text-[8px] font-mono font-black uppercase px-2 py-0.5 rounded ${
                          item.category === "Advertisers" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                          item.category === "Drivers" ? "bg-teal-500/10 text-teal-400 border border-teal-500/20" :
                          "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                        }`}>
                          {item.category}
                        </span>
                        <h4 className="font-bold text-xs text-white tracking-tight pt-1 font-sans">
                          {item.question}
                        </h4>
                      </div>
                      <span className={`text-slate-500 shrink-0 transform transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}>
                        <ChevronRight size={16} className={isExpanded ? "text-[#FF9800]" : "text-slate-500"} />
                      </span>
                    </button>

                    {/* Accordion Body Content */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 border-t border-slate-800/60 bg-slate-950/40 text-xs text-slate-300 leading-relaxed font-sans">
                        {item.answer}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-3 font-sans">
                <div className="p-4 bg-slate-900 border border-slate-800 text-slate-500 rounded-2xl">
                  <AlertCircle size={28} />
                </div>
                <div>
                  <p className="text-xs text-white font-bold">No answers found</p>
                  <p className="text-[10px] text-slate-400 max-w-xs mt-1">We couldn't find matching articles for "{faqSearchQuery}". Try using simpler search terms or select another category tab above.</p>
                </div>
                <button 
                  onClick={() => {
                    setFaqSearchQuery("");
                    setFaqActiveTab("All");
                  }}
                  className="text-[10px] font-mono font-bold text-[#FF9800] bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-lg hover:bg-orange-500/20 transition"
                >
                  RESET FILTERS
                </button>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-5 border-t border-slate-800 bg-slate-950/90 text-center shrink-0 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="text-left font-sans">
              <p className="text-[9px] text-slate-500 uppercase font-mono font-bold">CUSTOMER SUPPORT LINE</p>
              <p className="text-xs text-white font-bold flex items-center gap-1.5 font-sans">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                +91 99999-99999 <span className="text-slate-400 font-normal">| support@autoadz.in</span>
              </p>
            </div>
            <button
              onClick={() => {
                setShowHelpModal(false);
                setFaqSearchQuery("");
                setExpandedFaq(null);
                setLandingSection("register-campaign");
              }}
              className="bg-[#FF9800] hover:bg-orange-500 text-slate-950 text-[10px] font-mono font-extrabold px-4 py-2 rounded-xl shadow-lg transition"
            >
              🚀 LAUNCH A CAMPAIGN NOW
            </button>
          </div>

        </div>
      </div>
    );
  };

  // Real-time clock for status bars and dynamic ride metering cards
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const clockTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(clockTimer);
  }, []);

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

  // Live real-time driver tracking session states
  const [liveSessionKms, setLiveSessionKms] = useState<number>(() => {
    const saved = localStorage.getItem("autoadz_live_session_kms");
    return saved ? parseFloat(saved) : 0;
  });
  const [liveSessionSeconds, setLiveSessionSeconds] = useState<number>(() => {
    const saved = localStorage.getItem("autoadz_live_session_seconds");
    return saved ? parseInt(saved, 10) : 0;
  });

  // Tracking Mode: Enforced to "gps" (real hardware GPS tracking) as requested
  const [trackingMode, setTrackingMode] = useState<"gps" | "simulated">("gps");

  // GPS detailed states
  const [gpsStatus, setGpsStatus] = useState<"idle" | "searching" | "active" | "stationary" | "error">("idle");
  const [gpsSpeed, setGpsSpeed] = useState<number>(0); // speed in km/h
  const [gpsErrorMsg, setGpsErrorMsg] = useState<string>("");
  const [lastCoords, setLastCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Refs for background persistent tracking
  const wasTrackingRef = useRef(false);
  const watchIdRef = useRef<number | null>(null);
  const lastCoordsRef = useRef<{ lat: number; lng: number; timestamp: number } | null>(null);

  // Helper to calculate distance between coordinates (Haversine formula)
  const getHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    ;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  // Persist tracking mode choice
  useEffect(() => {
    localStorage.setItem("autoadz_tracking_mode", trackingMode);
  }, [trackingMode]);

  // Main Tracking and Sync Engine
  useEffect(() => {
    const activeDriver = drivers.find(d => d.id === loggedInDriverId);
    if (!activeDriver) return;

    let timerInterval: NodeJS.Timeout | null = null;
    const isActiveTracker = localStorage.getItem("autoadz_is_active_tracker") === "true";

    if (activeDriver.state === "tracking") {
      setGpsErrorMsg("");
      
      if (!isActiveTracker) {
        // Desktop/viewer passive mode: mirror server state
        setLiveSessionKms(activeDriver.currentSessionKms || 0);
        setLiveSessionSeconds(activeDriver.currentSessionSeconds || 0);
        setGpsStatus("active");
        return () => {};
      }

      // Active Tracker Device Logic
      if (!wasTrackingRef.current) {
        // We just started tracking or restored from a previous active session
        const savedStart = localStorage.getItem("autoadz_tracking_start_time");
        if (!savedStart) {
          // New session!
          const now = Date.now();
          localStorage.setItem("autoadz_tracking_start_time", String(now));
          localStorage.setItem("autoadz_live_session_kms", "0");
          localStorage.setItem("autoadz_live_session_seconds", "0");
          localStorage.removeItem("autoadz_last_coords");
          setLiveSessionSeconds(0);
          setLiveSessionKms(0);
          lastCoordsRef.current = null;
          setLastCoords(null);
        } else {
          // Restore existing session after app refresh or wakeup
          const savedKms = localStorage.getItem("autoadz_live_session_kms");
          const savedSecs = localStorage.getItem("autoadz_live_session_seconds");
          const savedCoords = localStorage.getItem("autoadz_last_coords");
          
          if (savedKms) setLiveSessionKms(parseFloat(savedKms));
          if (savedSecs) {
            const elapsedSinceStart = Math.floor((Date.now() - parseInt(savedStart, 10)) / 1000);
            setLiveSessionSeconds(Math.max(parseInt(savedSecs, 10), elapsedSinceStart));
          }
          if (savedCoords) {
            try {
              const parsed = JSON.parse(savedCoords);
              lastCoordsRef.current = parsed;
              setLastCoords({ lat: parsed.lat, lng: parsed.lng });
            } catch (e) {
              lastCoordsRef.current = null;
            }
          }
        }
        wasTrackingRef.current = true;
        setGpsStatus("searching");
      }

      // Start the live clock ticker (runs in both GPS and Sim modes to increment timer)
      timerInterval = setInterval(() => {
        let currentSecs = 0;
        setLiveSessionSeconds(prev => {
          const next = prev + 1;
          localStorage.setItem("autoadz_live_session_seconds", String(next));
          currentSecs = next;
          return next;
        });

        let currentKms = 0;
        // If in simulated mode, also increment KMs artificially every second
        if (trackingMode === "simulated") {
          setGpsStatus("active");
          // Random realistic speed of ~30-60 km/h: 0.008 to 0.016 km per second
          const inc = 0.008 + Math.random() * 0.008;
          setGpsSpeed(Math.round(inc * 3600)); // speed in km/h
          setLiveSessionKms(prevKms => {
            const nextKms = parseFloat((prevKms + inc).toFixed(4));
            localStorage.setItem("autoadz_live_session_kms", String(nextKms));
            currentKms = nextKms;
            return nextKms;
          });
        } else {
          const savedKmsStr = localStorage.getItem("autoadz_live_session_kms");
          currentKms = savedKmsStr ? parseFloat(savedKmsStr) : liveSessionKms;
        }

        // Periodic sync of current session stats to server every 4 seconds
        if (currentSecs % 4 === 0) {
          (async () => {
            try {
              await fetch(`/api/drivers/${activeDriver.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  currentSessionKms: currentKms,
                  currentSessionSeconds: currentSecs
                })
              });
            } catch (e) {
              console.error("Failed to sync live session stats to server", e);
            }
          })();
        }
      }, 1000);

      // If we are in GPS mode, listen to real hardware Geolocation
      if (trackingMode === "gps") {
        if ("geolocation" in navigator) {
          setGpsStatus("searching");
          
          watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
              const { latitude, longitude, speed } = position.coords;
              const timestamp = position.timestamp || Date.now();
              const newPos = { lat: latitude, lng: longitude, timestamp };
              const accuracy = position.coords.accuracy || 0;
              
              setLastCoords({ lat: latitude, lng: longitude });

              if (lastCoordsRef.current === null) {
                // First coordinate acquired!
                lastCoordsRef.current = newPos;
                localStorage.setItem("autoadz_last_coords", JSON.stringify(newPos));
                setGpsStatus("active");
                setGpsSpeed(speed ? Math.round(speed * 3.6) : 0);
              } else {
                // Calculate distance from previous coordinate
                const distance = getHaversineDistance(
                  lastCoordsRef.current.lat,
                  lastCoordsRef.current.lng,
                  latitude,
                  longitude
                );

                const timeHours = (timestamp - lastCoordsRef.current.timestamp) / 3600000;
                const calcSpeed = timeHours > 0 ? (distance / timeHours) : 0;

                // High-fidelity slow-walk and transport-friendly GPS movement conditions:
                // 1. Minimum distance from stable anchor of 4 meters (0.004 km) to filter micro GPS jump noise.
                // 2. Minimum speed of 0.5 km/h to confirm it's physical human/vehicle movement and not idle drift.
                // 3. Reasonable coordinate accuracy (under 40m) to reject wild cellular/IP jumps.
                const isLegitimateMovement = distance >= 0.004 && calcSpeed >= 0.5 && (accuracy === 0 || accuracy < 40);

                if (isLegitimateMovement) {
                  if (calcSpeed > 140) {
                    // Ignore sudden impossible GPS jumps (e.g. teleporting over 140km/h due to IP change)
                    console.warn("GPS Jitter ignored. Speed was: ", calcSpeed);
                  } else {
                    // Actual legitimate movement!
                    setGpsStatus("active");
                    setGpsSpeed(speed !== null && speed !== undefined ? Math.round(speed * 3.6) : Math.round(calcSpeed));
                    
                    setLiveSessionKms(prevKms => {
                      const nextKms = parseFloat((prevKms + distance).toFixed(4));
                      localStorage.setItem("autoadz_live_session_kms", String(nextKms));
                      return nextKms;
                    });

                    lastCoordsRef.current = newPos;
                    localStorage.setItem("autoadz_last_coords", JSON.stringify(newPos));
                  }
                } else {
                  // Device is stationary or changes are within GPS jitter margin.
                  setGpsSpeed(0);
                  setGpsStatus("stationary");

                  if (accuracy > 40) {
                    setGpsStatus("searching"); // signal is too weak/inaccurate
                  }
                }
              }
            },
            (error) => {
              console.error("GPS tracking error:", error);
              setGpsStatus("error");
              setGpsSpeed(0);
              let msg = "Location permission denied.";
              if (error.code === error.POSITION_UNAVAILABLE) msg = "GPS signal lost.";
              if (error.code === error.TIMEOUT) msg = "GPS response timeout.";
              setGpsErrorMsg(msg);
            },
            {
              enableHighAccuracy: true,
              maximumAge: 0,
              timeout: 15000
            }
          );
        } else {
          setGpsStatus("error");
          setGpsErrorMsg("HTML5 Geolocation not supported in this browser.");
        }
      }

      // Background Restore / App Re-focus Sync Handler
      const handleVisibilityChange = () => {
        if (document.visibilityState === "visible" && trackingMode === "gps") {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const { latitude, longitude } = pos.coords;
              const timestamp = pos.timestamp || Date.now();
              
              const savedCoordsStr = localStorage.getItem("autoadz_last_coords");
              const savedStartStr = localStorage.getItem("autoadz_tracking_start_time");
              
              if (savedCoordsStr && savedStartStr) {
                try {
                  const savedCoords = JSON.parse(savedCoordsStr);
                  const bgDistance = getHaversineDistance(
                    savedCoords.lat,
                    savedCoords.lng,
                    latitude,
                    longitude
                  );

                  const bgHours = (timestamp - savedCoords.timestamp) / 3600000;
                  const bgSpeed = bgHours > 0 ? (bgDistance / bgHours) : 0;

                  if (bgDistance > 0.005 && bgSpeed >= 0.5 && bgSpeed < 140) {
                    setLiveSessionKms(prev => {
                      const next = parseFloat((prev + bgDistance).toFixed(4));
                      localStorage.setItem("autoadz_live_session_kms", String(next));
                      return next;
                    });

                    const newPosObj = { lat: latitude, lng: longitude, timestamp };
                    lastCoordsRef.current = newPosObj;
                    localStorage.setItem("autoadz_last_coords", JSON.stringify(newPosObj));
                    setLastCoords({ lat: latitude, lng: longitude });

                    const finalEarnings = parseFloat((bgDistance * 4.5).toFixed(2));
                    notifications.unshift({
                      id: `notif_bg_${Date.now()}`,
                      title: "Background Miles Recorded! 🛰️",
                      message: `Successfully tracked +${bgDistance.toFixed(2)} KM and earned ₹${finalEarnings} while working in the background!`,
                      timestamp: new Date().toLocaleString(),
                      unread: true,
                      type: "payment"
                    });
                  } else {
                    const newPosObj = { lat: latitude, lng: longitude, timestamp };
                    lastCoordsRef.current = newPosObj;
                    localStorage.setItem("autoadz_last_coords", JSON.stringify(newPosObj));
                    setLastCoords({ lat: latitude, lng: longitude });
                  }
                  
                  const elapsedSeconds = Math.floor((Date.now() - parseInt(savedStartStr, 10)) / 1000);
                  setLiveSessionSeconds(elapsedSeconds);
                  localStorage.setItem("autoadz_live_session_seconds", String(elapsedSeconds));
                } catch (e) {
                  console.error("Failed to parsed stored coordinates", e);
                }
              }
            },
            (err) => console.warn("Background geolocation refresh failed:", err),
            { enableHighAccuracy: true, timeout: 5000 }
          );
        }
      };

      document.addEventListener("visibilitychange", handleVisibilityChange);

      return () => {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
      };
    } else {
      // Not tracking. Did we just stop tracking? Save stats to database!
      if (wasTrackingRef.current) {
        wasTrackingRef.current = false;
        
        const savedKmsStr = localStorage.getItem("autoadz_live_session_kms");
        const finalKms = savedKmsStr ? parseFloat(savedKmsStr) : liveSessionKms;
        const finalEarnings = parseFloat((finalKms * 4.5).toFixed(2));

        localStorage.removeItem("autoadz_is_active_tracker");
        localStorage.removeItem("autoadz_tracking_start_time");
        localStorage.removeItem("autoadz_live_session_kms");
        localStorage.removeItem("autoadz_live_session_seconds");
        localStorage.removeItem("autoadz_last_coords");

        lastCoordsRef.current = null;
        setLastCoords(null);
        setGpsStatus("idle");
        setGpsSpeed(0);

        if (finalKms > 0.01) {
          (async () => {
            try {
              const nextTotalEarnings = parseFloat(((activeDriver.totalEarnings || 0) + finalEarnings).toFixed(2));
              const nextWalletBalance = parseFloat(((activeDriver.walletBalance || 0) + finalEarnings).toFixed(2));

              // 1. Update the driver profile
              await fetch(`/api/drivers/${activeDriver.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  totalEarnings: nextTotalEarnings,
                  walletBalance: nextWalletBalance,
                  state: "online",
                  currentSessionKms: 0,
                  currentSessionSeconds: 0,
                  trackingStartTime: null
                })
              });

              // 2. Add wallet transaction
              await fetch("/api/wallet/transactions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  userId: activeDriver.id,
                  type: "earning",
                  amount: finalEarnings,
                  description: `Live Ride Metered - Completed ${finalKms.toFixed(2)} KM trip`
                })
              });

              // 3. Update campaign KMs
              const activeCamp = campaigns.find(c => c.id === activeDriver.currentCampaignId) || campaigns.find(c => c.status === "active");
              if (activeCamp) {
                await fetch(`/api/campaigns/${activeCamp.id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    kmsCovered: parseFloat(((activeCamp.kmsCovered || 0) + finalKms).toFixed(2)),
                    qrScans: (activeCamp.qrScans || 0) + (Math.random() > 0.7 ? 1 : 0)
                  })
                });
              }

              // 4. Send dynamic notification
              notifications.unshift({
                id: `notif_sim_${Date.now()}`,
                title: "Live GPS Trip Recorded",
                message: `Completed a live tracking run of ${finalKms.toFixed(2)} KM. Credited ₹${finalEarnings.toLocaleString()} into your wallet.`,
                timestamp: new Date().toLocaleString(),
                unread: true,
                type: "payment"
              });

              fetchData();
            } catch (err) {
              console.error("Failed to auto-save live telemetry", err);
            }
          })();
        } else {
          (async () => {
            try {
              await fetch(`/api/drivers/${activeDriver.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  state: "online",
                  currentSessionKms: 0,
                  currentSessionSeconds: 0,
                  trackingStartTime: null
                })
              });
              fetchData();
            } catch (err) {
              console.error("Failed to clear tracking session state", err);
            }
          })();
        }
      }
    }

    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [drivers, loggedInDriverId, trackingMode]);

  // App UI Navigation States
  const [advertiserTab, setAdvertiserTab] = useState<"home" | "campaigns" | "tracking" | "ai" | "profile">("home");
  const [driverTab, setDriverTab] = useState<"dashboard" | "proof" | "tracker" | "earnings" | "profile">("dashboard");
  const [adminTab, setAdminTab] = useState<"campaigns" | "drivers" | "proofs" | "analytics" | "cities" | "settings">("campaigns");

  // Localized SEO subpage simulation states
  const [selectedSeoCity, setSelectedSeoCity] = useState<string | null>(null);
  const [selectedSeoIndustry, setSelectedSeoIndustry] = useState<string | null>(null);

  // Campaign Calculator State
  const [calcBudget, setCalcBudget] = useState<number>(50000);

  // System Config states
  const [cities, setCities] = useState<any[]>([]);
  const [adminAddingCity, setAdminAddingCity] = useState(false);
  const [adminCityName, setAdminCityName] = useState("");
  const [adminCityZone, setAdminCityZone] = useState("");
  const [adminCityRate, setAdminCityRate] = useState("18");
  const [adminCityAutos, setAdminCityAutos] = useState("100");

  // Admin System integration placeholder credentials
  const [systemWhatsAppToken, setSystemWhatsAppToken] = useState(() => localStorage.getItem("sys_whatsapp_token") || "EAAG3yH8V9G0BAOBF90h3yPsd88...");
  const [systemWhatsAppPhoneId, setSystemWhatsAppPhoneId] = useState(() => localStorage.getItem("sys_whatsapp_phone_id") || "109825420194852");
  const [systemSmsApiKey, setSystemSmsApiKey] = useState(() => localStorage.getItem("sys_sms_api_key") || "api_key_84a92f029a1b8c73");
  const [systemSmsSenderId, setSystemSmsSenderId] = useState(() => localStorage.getItem("sys_sms_sender_id") || "AUTADZ");
  const [systemSettingsSuccessMsg, setSystemSettingsSuccessMsg] = useState("");

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
  const [driverRegDL, setDriverRegDL] = useState("");
  const [driverRegAadhaar, setDriverRegAadhaar] = useState("");
  const [driverRegDLFile, setDriverRegDLFile] = useState("");
  const [driverRegAadhaarFile, setDriverRegAadhaarFile] = useState("");
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
    { name: "Edge Fashion", url: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=800" },
    { name: "Urban Trendsetters", url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=800" },
    { name: "Vogue Essentials", url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=800" },
    { name: "Aura Styles", url: "https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&q=80&w=800" }
  ];

  // Fetch all state from API
  const fetchData = async () => {
    try {
      const [resCamps, resDrivers, resProofs, resTxs, resNotifs, resCities] = await Promise.all([
        fetch("/api/campaigns"),
        fetch("/api/drivers"),
        fetch("/api/proofs"),
        fetch("/api/wallet/transactions"),
        fetch("/api/notifications"),
        fetch("/api/cities"),
      ]);

      const dataCamps = await resCamps.json();
      const dataDrivers = await resDrivers.json();
      const dataProofs = await resProofs.json();
      const dataTxs = await resTxs.json();
      const dataNotifs = await resNotifs.json();
      const dataCities = await resCities.json();

      setCampaigns(dataCamps);
      setDrivers(dataDrivers);
      setProofs(dataProofs);
      setTransactions(dataTxs);
      setNotifications(dataNotifs);
      setCities(dataCities);
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
        setCampaignSuccessMsg(`Campaign "${newCampTitle || 'New Campaign'}" registered successfully with ${newCampAutos} autos! Track it via the Brand/Advertiser Portal.`);
        // Reset fields
        setNewCampTitle("");
        setNewCampClient("");
        setNewCampArea("");
        setNewCampCreative("");
        fetchData();
        setTimeout(() => setCampaignSuccessMsg(""), 7000);
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
          location: driverRegLoc || "Bangalore South",
          dlNumber: driverRegDL || `DL-${Math.floor(Math.random() * 90 + 10)}-2023${Math.floor(Math.random() * 90000 + 10000)}`,
          aadhaarNumber: driverRegAadhaar || `${Math.floor(Math.random() * 9000 + 1000)}-${Math.floor(Math.random() * 9000 + 1000)}-${Math.floor(Math.random() * 9000 + 1000)}`,
          dlImage: driverRegDLFile || "https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&q=80&w=400",
          aadhaarImage: driverRegAadhaarFile || "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=400",
        })
      });

      if (response.ok) {
        setDriverSuccessMsg("Registration submitted successfully! Admin will verify KYC within 5 minutes.");
        setDriverRegName("");
        setDriverRegPhone("");
        setDriverRegAutoNum("");
        setDriverRegLoc("");
        setDriverRegDL("");
        setDriverRegAadhaar("");
        setDriverRegDLFile("");
        setDriverRegAadhaarFile("");
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
    const activeDriver = drivers.find(d => d.id === loggedInDriverId); // Dynamic active driver simulator
    if (!activeDriver) return;

    try {
      const response = await fetch("/api/proofs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driverId: activeDriver.id,
          campaignId: selectedCampaignForProof || activeDriver.currentCampaignId || (campaigns[0]?.id || "camp_1"),
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
          currentCampaignId: approve ? (campaigns[0]?.id || null) : null // Assign to active campaign for quick demo
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

  // Admin allocate campaign to driver
  const handleAllocateCampaign = async (driverId: string, campaignId: string | null) => {
    try {
      const response = await fetch(`/api/drivers/${driverId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentCampaignId: campaignId })
      });
      if (response.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // City addition
  const handleAddCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminCityName.trim()) return;
    try {
      const response = await fetch("/api/cities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: adminCityName,
          zones: adminCityZone || "High Traffic Zones",
          priceRate: Number(adminCityRate) || 18,
          activeAutos: Number(adminCityAutos) || 100,
        })
      });
      if (response.ok) {
        setAdminCityName("");
        setAdminCityZone("");
        setAdminAddingCity(false);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // City deletion
  const handleDeleteCity = async (name: string) => {
    try {
      const response = await fetch("/api/cities", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });
      if (response.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save Settings
  const handleSaveSystemSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("sys_whatsapp_token", systemWhatsAppToken);
    localStorage.setItem("sys_whatsapp_phone_id", systemWhatsAppPhoneId);
    localStorage.setItem("sys_sms_api_key", systemSmsApiKey);
    localStorage.setItem("sys_sms_sender_id", systemSmsSenderId);
    setSystemSettingsSuccessMsg("SaaS Integration API gateway credentials successfully verified & saved!");
    setTimeout(() => setSystemSettingsSuccessMsg(""), 5000);
  };

  // Admin Add Driver
  const handleAdminAddDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminDriverFormName || !adminDriverFormPhone || !adminDriverFormAuto) {
      alert("Please fill in Name, Phone and Auto Plate Number.");
      return;
    }
    try {
      const createRes = await fetch("/api/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: adminDriverFormName,
          phone: adminDriverFormPhone,
          autoNumber: adminDriverFormAuto,
          location: adminDriverFormLoc || "Bangalore"
        })
      });
      if (createRes.ok) {
        const newDriver = await createRes.json();
        if (adminDriverFormKyc || adminDriverFormStatus !== "pending_approval") {
          await fetch(`/api/drivers/${newDriver.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              kycVerified: adminDriverFormKyc,
              status: adminDriverFormStatus,
              currentCampaignId: adminDriverFormStatus === "active" ? (campaigns[0]?.id || null) : null
            })
          });
        }
        setAdminAddingDriver(false);
        setAdminDriverFormName("");
        setAdminDriverFormPhone("");
        setAdminDriverFormAuto("");
        setAdminDriverFormLoc("");
        setAdminDriverFormKyc(false);
        setAdminDriverFormStatus("pending_approval");
        fetchData();
      }
    } catch (err) {
      console.error("Error creating driver:", err);
    }
  };

  // Admin Save Edited Driver
  const handleAdminSaveEditDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEditingDriver) return;
    if (!adminDriverFormName || !adminDriverFormPhone || !adminDriverFormAuto) {
      alert("Name, Phone, and Auto Plate are required.");
      return;
    }
    try {
      const response = await fetch(`/api/drivers/${adminEditingDriver.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: adminDriverFormName,
          phone: adminDriverFormPhone,
          autoNumber: adminDriverFormAuto,
          location: adminDriverFormLoc,
          kycVerified: adminDriverFormKyc,
          status: adminDriverFormStatus,
          currentCampaignId: adminDriverFormStatus === "active" ? (adminEditingDriver.currentCampaignId || campaigns[0]?.id || null) : null
        })
      });
      if (response.ok) {
        setAdminEditingDriver(null);
        fetchData();
      }
    } catch (err) {
      console.error("Error updating driver:", err);
    }
  };

  // Admin Delete Driver
  const handleAdminDeleteDriver = async (driverId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this driver? This action cannot be undone.")) {
      return;
    }
    try {
      const response = await fetch(`/api/drivers/${driverId}`, {
        method: "DELETE"
      });
      if (response.ok) {
        fetchData();
      }
    } catch (err) {
      console.error("Error deleting driver:", err);
    }
  };

  // Advertiser upload custom ad creative
  const handleUpdateCreative = async (campaignId: string, creativeUrl: string) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creativeUrl,
          creativeStatus: "pending",
          creativeApproved: false
        })
      });
      if (response.ok) {
        fetchData();
      }
    } catch (err) {
      console.error("Error updating ad creative:", err);
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
          userId: loggedInDriverId,
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

  // Toggle Live Tracking simulation for active logged-in driver
  const toggleDriverTracking = async () => {
    const mainDriver = drivers.find(d => d.id === loggedInDriverId);
    if (!mainDriver) return;
    const nextState = mainDriver.state === "tracking" ? "online" : "tracking";

    if (nextState === "tracking") {
      localStorage.setItem("autoadz_is_active_tracker", "true");
      localStorage.setItem("autoadz_tracking_start_time", String(Date.now()));
      localStorage.setItem("autoadz_live_session_kms", "0");
      localStorage.setItem("autoadz_live_session_seconds", "0");
      localStorage.removeItem("autoadz_last_coords");
      
      setLiveSessionSeconds(0);
      setLiveSessionKms(0);
      setGpsStatus("searching");
      setGpsSpeed(0);
      wasTrackingRef.current = true;

      try {
        await fetch(`/api/drivers/${mainDriver.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            state: "tracking",
            currentSessionKms: 0,
            currentSessionSeconds: 0,
            trackingStartTime: Date.now()
          })
        });
        fetchData();
      } catch (err) {
        console.error(err);
      }
    } else {
      try {
        await fetch(`/api/drivers/${mainDriver.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ state: "online" })
        });
        fetchData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Simulate active driving route mileage & earnings increase
  const handleSimulateDrive = async (kmsToDrive: number) => {
    if (isSimulatingDrive) return;
    setIsSimulatingDrive(true);
    
    // Increment local simulated stats immediately
    setSimulatedKmsToday(prev => prev + kmsToDrive);
    setSimulatedKmsTotal(prev => prev + kmsToDrive);

    // Update logged-in driver's real wallet balance and earnings on server
    const driverRajesh = drivers.find(d => d.id === loggedInDriverId);
    if (driverRajesh) {
      const addedEarnings = kmsToDrive * 4.5;
      const nextTotalEarnings = (driverRajesh.totalEarnings || 0) + addedEarnings;
      const nextWalletBalance = (driverRajesh.walletBalance || 0) + addedEarnings;

      try {
        // Update driver on backend
        await fetch(`/api/drivers/${driverRajesh.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            totalEarnings: nextTotalEarnings,
            walletBalance: nextWalletBalance,
            state: "tracking"
          })
        });

        // Also add an earning transaction in the wallet transactions log
        await fetch("/api/wallet/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: driverRajesh.id,
            type: "earning",
            amount: addedEarnings,
            description: `Simulated Trip - Completed ${kmsToDrive} KM tracking run`
          })
        });

        // Increment kmsCovered on the active campaign of the driver
        const activeCamp = campaigns.find(c => c.id === driverRajesh.currentCampaignId) || campaigns.find(c => c.status === "active");
        if (activeCamp) {
          await fetch(`/api/campaigns/${activeCamp.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              kmsCovered: (activeCamp.kmsCovered || 0) + kmsToDrive,
              qrScans: (activeCamp.qrScans || 0) + (Math.random() > 0.6 ? 1 : 0)
            })
          });
        }

        // Add simulated notification
        notifications.unshift({
          id: `notif_sim_${Date.now()}`,
          title: "Trip Completed",
          message: `Driver ${driverRajesh.name} covered ${kmsToDrive} KM. ₹${addedEarnings.toLocaleString()} credited to driver wallet.`,
          timestamp: new Date().toLocaleString(),
          unread: true,
          type: "payment"
        });

        fetchData();
      } catch (err) {
        console.error("Simulation error:", err);
      }
    }

    setTimeout(() => {
      setIsSimulatingDrive(false);
    }, 1500);
  };

  // Calculate high level stats
  const activeCampaignsCount = campaigns.filter(c => c.status === "active").length;
  const totalKmsAll = campaigns.reduce((sum, c) => sum + c.kmsCovered, 0);
  const totalScansAll = campaigns.reduce((sum, c) => sum + c.qrScans, 0);
  const activeAutosAll = campaigns.filter(c => c.status === "active").reduce((sum, c) => sum + c.autosCount, 0);

  // Early return for secure login screen if no user is authenticated
  if (userSession === null) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col relative overflow-hidden font-sans selection:bg-[#10B981] selection:text-white">
        {/* Decorative background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.02)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#10B981]/5 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none animate-pulse"></div>

        {/* Dynamic Top Navigation Bar */}
        <nav className="w-full border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between shadow-3xs">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[#10B981] rounded-xl flex items-center justify-center font-display font-black text-lg text-white shadow-md shadow-emerald-500/10">
              A
            </div>
            <span className="text-xl font-display font-black tracking-tight text-[#0B1F4D]">AutoAdz.in</span>
            <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-700 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">2.0 SAAS</span>
          </div>

          <div className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-600 uppercase font-mono tracking-wider">
            <button onClick={() => setLandingSection("hero")} className={`transition hover:text-[#10B981] ${landingSection === "hero" ? "text-[#10B981]" : ""}`}>Platform Info</button>
            <button onClick={() => setLandingSection("register-campaign")} className={`transition hover:text-[#10B981] ${landingSection === "register-campaign" ? "text-[#10B981]" : ""}`}>Launch Campaign</button>
            <button onClick={() => setLandingSection("register-driver")} className={`transition hover:text-[#10B981] ${landingSection === "register-driver" ? "text-[#10B981]" : ""}`}>Become a Driver Partner</button>
            <button onClick={() => setLandingSection("login")} className={`transition hover:text-[#10B981] ${landingSection === "login" ? "text-[#10B981]" : ""}`}>Portal Login</button>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowHelpModal(true)}
              className="flex items-center gap-1.5 text-[10px] font-bold font-mono px-3 py-1.5 rounded-lg text-emerald-700 bg-emerald-500/10 hover:bg-[#10B981] hover:text-white transition duration-200 border border-emerald-500/10"
            >
              <HelpCircle size={12} />
              HELP & FAQ
            </button>

            {landingSection !== "login" ? (
              <button 
                onClick={() => setLandingSection("login")}
                className="bg-[#10B981] hover:bg-emerald-600 text-white text-[10px] font-bold font-mono px-3.5 py-1.5 rounded-lg shadow-sm transition"
              >
                ACCESS PORTALS
              </button>
            ) : (
              <button 
                onClick={() => setLandingSection("hero")}
                className="border border-slate-200 hover:bg-slate-100 text-[10px] font-bold font-mono px-3.5 py-1.5 rounded-lg transition"
              >
                BACK TO INFO
              </button>
            )}
          </div>
        </nav>

        {/* SUCCESS NOTIFICATIONS (Floating Toast) */}
        {(campaignSuccessMsg || driverSuccessMsg) && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border-2 border-[#10B981]/30 text-white p-4 rounded-2xl shadow-2xl max-w-sm animate-bounce">
            <div className="flex gap-2 items-start">
              <CheckCircle className="text-[#10B981] shrink-0 mt-0.5" size={18} />
              <div>
                <h5 className="font-bold text-xs text-emerald-400 font-mono">ACTION SUCCESSFUL</h5>
                <p className="text-[11px] text-slate-300 mt-1">{campaignSuccessMsg || driverSuccessMsg}</p>
              </div>
            </div>
          </div>
        )}

        {/* LANDING PAGE HERO / PLATFORM INFO SECTION */}
        {landingSection === "hero" && (
          <main className="flex-1 flex flex-col py-10 px-4 md:px-8 max-w-7xl mx-auto z-10 space-y-12 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              {/* Hero Left Intro */}
              <div className="lg:col-span-7 space-y-6 text-left">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-extrabold tracking-widest text-emerald-800 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1">
                  ⚡ NEXT-GEN TRANSIT OUT-OF-HOME (OOH) SAAS
                </span>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-extrabold text-[#0B1F4D] leading-none tracking-tight">
                  India's Hyperlocal <span className="text-[#10B981]">GPS-Tracked</span> Auto Advertising Platform
                </h2>
                <p className="text-sm md:text-base text-slate-500 leading-relaxed max-w-2xl">
                  Connect with local target audiences by pasting high-impact brand designs on auto-rickshaw backhoods. Plan campaigns, predict hyperlocal CPM impressions, track driver live locations, and verify proof of work with absolute precision.
                </p>

                {/* Database Metrics Grid - Real Database Counts! */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white border border-slate-150 p-5 rounded-3xl shadow-3xs font-mono">
                  <div className="space-y-1">
                    <p className="text-2xl font-black text-[#0B1F4D]">{campaigns.length}</p>
                    <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Total Campaigns</p>
                  </div>
                  <div className="space-y-1 border-l border-slate-100 pl-4">
                    <p className="text-2xl font-black text-[#10B981]">{drivers.length}</p>
                    <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Rickshaws Linked</p>
                  </div>
                  <div className="space-y-1 border-l border-slate-100 pl-4">
                    <p className="text-2xl font-black text-indigo-600">{(totalKmsAll + simulatedKmsTotal).toLocaleString()}+</p>
                    <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold font-sans">Live KMs Logged</p>
                  </div>
                  <div className="space-y-1 border-l border-slate-100 pl-4">
                    <p className="text-2xl font-black text-purple-600">{totalScansAll.toLocaleString()}</p>
                    <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">QR Scans Tracked</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3.5 pt-2">
                  <button 
                    onClick={() => setLandingSection("register-campaign")} 
                    className="bg-[#10B981] hover:bg-emerald-600 text-white font-bold font-mono text-xs px-6 py-3.5 rounded-2xl shadow-md transition flex items-center gap-2"
                  >
                    <Plus size={16} /> LAUNCH BRAND CAMPAIGN
                  </button>
                  <button 
                    onClick={() => setLandingSection("register-driver")} 
                    className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold font-mono text-xs px-6 py-3.5 rounded-2xl transition flex items-center gap-2"
                  >
                    <Smartphone size={16} /> BECOME A DRIVER PARTNER
                  </button>
                </div>
              </div>

              {/* Hero Right Interactive Display Card */}
              <div className="lg:col-span-5 relative">
                {/* Floating ambient badge */}
                <div className="absolute -top-4 -left-4 bg-white border border-slate-150 p-3 rounded-2xl shadow-md flex items-center gap-2.5 z-20 font-mono animate-pulse">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <div className="text-left">
                    <p className="text-[9px] font-black text-[#0B1F4D]">AUTO ADZ TELEMETRY</p>
                    <p className="text-[8px] text-[#10B981] font-bold">LIVE TRANSIT STREAM</p>
                  </div>
                </div>

                {/* Auto Rickshaw Billboard Mockup */}
                <div className="bg-white border border-slate-150 p-5 rounded-4xl shadow-xl relative overflow-hidden text-left">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl"></div>
                  
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
                    <h4 className="text-[10px] font-black font-mono text-slate-400 uppercase">Interactive Transit Preview</h4>
                    <span className="text-[8px] font-bold font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100">BACK-HOOD BANNER FORMAT</span>
                  </div>

                  <div className="rounded-2xl overflow-hidden relative border border-slate-200 mb-4 shadow-sm">
                    <img 
                      src="https://images.unsplash.com/photo-1597075687490-8f673c6c17f6?auto=format&fit=crop&q=80&w=800"
                      alt="Auto Rickshaw Media" 
                      className="w-full h-44 object-cover brightness-95"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute bottom-3 left-3 bg-white/95 text-[#0B1F4D] text-[9px] font-mono font-bold px-2.5 py-1 rounded-lg border border-slate-150 shadow-xs">
                      📍 DIGITAL-READY BANNER BANNER
                    </div>
                  </div>

                  {/* Tracking Map Mockup inside Hero */}
                  <div className="bg-slate-50 border border-slate-150 rounded-2xl p-3.5 space-y-2.5 font-mono text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-bold">Active Campaign:</span>
                      <span className="text-[#10B981] font-black">Dental Hub Hyperlocal Promo</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-bold">Fleet Size Allocation:</span>
                      <span className="text-indigo-600 font-black">45 Rickshaws Live</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full w-4/5 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Campaign Calculator Section (CMP / Target slider integration) */}
            <div className="bg-white border border-slate-150 rounded-4xl p-6 md:p-8 shadow-sm space-y-6 text-left">
              <div>
                <span className="text-[9px] font-mono text-emerald-700 font-black uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded border border-emerald-100">Interactive SaaS Pricing tool</span>
                <h3 className="text-2xl font-display font-extrabold text-[#0B1F4D] mt-2">Calculate Your Campaign ROI Instantly</h3>
                <p className="text-xs text-slate-400 mt-1">Adjust the sliders to estimate reach, CPM impressions, and vehicle numbers for your specific business niche.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Sliders Input */}
                <div className="lg:col-span-6 space-y-5">
                  <div className="space-y-2">
                    <div className="flex justify-between font-mono text-xs">
                      <span className="text-slate-500 font-bold uppercase">Select Operating City</span>
                      <span className="text-[#10B981] font-bold">Kolkata/Delhi/Bangalore</span>
                    </div>
                    <select
                      value={newCampCity}
                      onChange={(e) => setNewCampCity(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-[#0B1F4D] font-bold focus:outline-none focus:ring-1 focus:ring-[#10B981]"
                    >
                      <option value="Kolkata">Kolkata (₹18 / auto / day)</option>
                      <option value="Delhi">Delhi NCR (₹20 / auto / day)</option>
                      <option value="Bangalore">Bangalore (₹22 / auto / day)</option>
                      <option value="Mumbai">Mumbai (₹25 / auto / day)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between font-mono text-xs">
                      <span className="text-slate-500 font-bold uppercase">Allocated Daily Budget</span>
                      <span className="text-[#10B981] font-extrabold">₹{calcBudget.toLocaleString()}</span>
                    </div>
                    <input 
                      type="range"
                      min={10000}
                      max={300000}
                      step={5000}
                      value={calcBudget}
                      onChange={(e) => setCalcBudget(Number(e.target.value))}
                      className="w-full accent-[#10B981]"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>₹10,000 min</span>
                      <span>₹3,00,000 max</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between font-mono text-xs">
                      <span className="text-slate-500 font-bold uppercase">Fleet Size Allocation</span>
                      <span className="text-[#10B981] font-extrabold">{calcVehicles} Autos</span>
                    </div>
                    <input 
                      type="range"
                      min={5}
                      max={150}
                      step={5}
                      value={calcVehicles}
                      onChange={(e) => setCalcVehicles(Number(e.target.value))}
                      className="w-full accent-[#10B981]"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>5 Autos min</span>
                      <span>150 Autos max</span>
                    </div>
                  </div>
                </div>

                {/* KPI Estimates output card */}
                <div className="lg:col-span-6 bg-[#0B1F4D] text-white rounded-3xl p-6 flex flex-col justify-between space-y-5">
                  <div className="space-y-1.5 pb-2 border-b border-white/10">
                    <h5 className="font-mono text-[9px] text-emerald-300 font-black tracking-widest uppercase">Estimated Output Outcomes</h5>
                    <p className="text-xs text-slate-300">Based on verified hyperlocal CPM databases across operating hotspots.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-white/5 rounded-2xl">
                      <span className="text-[9px] text-emerald-300 font-mono block font-bold">TOTAL ESTIMATED REACH</span>
                      <strong className="text-xl font-display font-extrabold">{(calcVehicles * 8800).toLocaleString()}+ Views / Day</strong>
                    </div>

                    <div className="p-3 bg-white/5 rounded-2xl">
                      <span className="text-[9px] text-emerald-300 font-mono block font-bold">MONTHLY ESTIMATED IMPRESSIONS</span>
                      <strong className="text-xl font-display font-extrabold">{(calcVehicles * 8800 * 30 / 100000).toFixed(1)} Lakhs / Mo</strong>
                    </div>

                    <div className="p-3 bg-white/5 rounded-2xl">
                      <span className="text-[9px] text-emerald-300 font-mono block font-bold font-sans">DAILY OPERATING COST</span>
                      <strong className="text-xl font-display font-extrabold">₹{(calcVehicles * (newCampCity === "Mumbai" ? 25 : newCampCity === "Bangalore" ? 22 : newCampCity === "Delhi" ? 20 : 18)).toLocaleString()}</strong>
                    </div>

                    <div className="p-3 bg-white/5 rounded-2xl">
                      <span className="text-[9px] text-emerald-300 font-mono block font-bold">ESTIMATED RUN DAYS COVERED</span>
                      <strong className="text-xl font-display font-extrabold">
                        {Math.floor(calcBudget / (calcVehicles * (newCampCity === "Mumbai" ? 25 : newCampCity === "Bangalore" ? 22 : newCampCity === "Delhi" ? 20 : 18)))} Days
                      </strong>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button 
                      onClick={() => {
                        setNewCampCity(newCampCity);
                        setNewCampAutos(calcVehicles);
                        setNewCampBudget(calcBudget);
                        setLandingSection("register-campaign");
                      }}
                      className="w-full bg-[#10B981] hover:bg-emerald-600 text-white py-2.5 rounded-xl text-xs font-mono font-black tracking-wider transition uppercase"
                    >
                      🚀 LOCK IN THese SPECIFICATIONS & SUBMIT
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* SEO HYPERLOCAL OPERATING CITIES AND NICHE SUBPAGES */}
            <div className="space-y-6 text-left">
              <div>
                <span className="text-[9px] font-mono text-emerald-700 font-black uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded border border-emerald-100">Localized SEO Hub</span>
                <h3 className="text-2xl font-display font-extrabold text-[#0B1F4D] mt-2">Dynamic Hyperlocal City & Niche Operating Guides</h3>
                <p className="text-xs text-slate-400 mt-1">Explore specific local marketing hotspots, average daily trip durations, and AI recommendations tailored to your industry.</p>
              </div>

              {/* Selection button grids */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cities */}
                <div className="bg-white border border-slate-150 p-5 rounded-3xl space-y-3">
                  <h4 className="font-bold text-xs text-[#0B1F4D] uppercase font-mono tracking-wider">🏙️ SELECT LOCALIZED CITY GUIDE</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => { setSelectedSeoCity("Kolkata"); setSelectedSeoIndustry(null); }}
                      className="p-3 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-[#10B981] rounded-xl text-xs font-bold text-slate-800 text-left transition"
                    >
                      Kolkata Guide
                      <span className="text-[9px] block text-slate-400 font-mono font-medium mt-0.5">Shyambazar, Gariahat</span>
                    </button>
                    <button 
                      onClick={() => { setSelectedSeoCity("Delhi"); setSelectedSeoIndustry(null); }}
                      className="p-3 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-[#10B981] rounded-xl text-xs font-bold text-slate-800 text-left transition"
                    >
                      Delhi NCR Guide
                      <span className="text-[9px] block text-slate-400 font-mono font-medium mt-0.5">Karol Bagh, Noida Sec 62</span>
                    </button>
                  </div>
                </div>

                {/* Industries */}
                <div className="bg-white border border-slate-150 p-5 rounded-3xl space-y-3">
                  <h4 className="font-bold text-xs text-[#0B1F4D] uppercase font-mono tracking-wider">🩺 SELECT INDUSTRY NICHE SPECIFIC ADV</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => { setSelectedSeoIndustry("Restaurant"); setSelectedSeoCity(null); }}
                      className="p-3 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-[#10B981] rounded-xl text-xs font-bold text-slate-800 text-left transition"
                    >
                      Restaurants & Cafes
                      <span className="text-[9px] block text-slate-400 font-mono font-medium mt-0.5">Menu hooks, QR deals</span>
                    </button>
                    <button 
                      onClick={() => { setSelectedSeoIndustry("Clinic"); setSelectedSeoCity(null); }}
                      className="p-3 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-[#10B981] rounded-xl text-xs font-bold text-slate-800 text-left transition"
                    >
                      Dental Clinics & Hospitals
                      <span className="text-[9px] block text-slate-400 font-mono font-medium mt-0.5">Check-up promos, localtrust</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Localized Guide dynamic rendering */}
              {selectedSeoCity && (
                <div className="bg-emerald-500/5 border-2 border-[#10B981]/20 rounded-3xl p-6 space-y-4 animate-fadeIn">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <h4 className="font-display font-extrabold text-[#0B1F4D] text-base">🏙️ AutoAdz Hyperlocal Guide: Operating in {selectedSeoCity}</h4>
                    <button 
                      onClick={() => setSelectedSeoCity(null)}
                      className="text-slate-400 hover:text-slate-800 text-xs font-bold"
                    >
                      Close Guide [X]
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                      <strong className="text-slate-800 block uppercase font-mono tracking-wide text-[9px] text-[#10B981]">High Traffic hotspots</strong>
                      <p className="text-slate-600 leading-relaxed font-bold">
                        {selectedSeoCity === "Kolkata" 
                          ? "Shyambazar Crossing, Gariahat Market, Salt Lake Sector V, Howrah Station Road, Garia Crossing" 
                          : "Connaught Place Radial Roads, Karol Bagh Market, Noida Sector 62 IT Hub, Karol Bagh Metro, GK M-Block"
                        }
                      </p>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                      <strong className="text-slate-800 block uppercase font-mono tracking-wide text-[9px] text-indigo-600">Avg Daily Run Telemetry</strong>
                      <p className="text-slate-600 leading-relaxed">
                        {selectedSeoCity === "Kolkata" 
                          ? "62.4 KM/day average trip distance across highly congested North and Central transit hubs." 
                          : "74.8 KM/day average trip distance crossing high-speed ring roads and sub-city sectors."
                        }
                      </p>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                      <strong className="text-slate-800 block uppercase font-mono tracking-wide text-[9px] text-orange-600">AI campaign advice</strong>
                      <p className="text-slate-600 leading-relaxed italic">
                        {selectedSeoCity === "Kolkata" 
                          ? "High saturation of 25-35 autos delivers maximum visibility in crowded local markets. Perfect for local sweet shops, jewellery brands, and coaching institutions." 
                          : "Deploy 40+ auto banners to cover the wider NCR geographical grid. High conversion rates for real-estate launches, medical diagnostics, and food delivery deals."
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedSeoIndustry && (
                <div className="bg-emerald-500/5 border-2 border-[#10B981]/20 rounded-3xl p-6 space-y-4 animate-fadeIn">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <h4 className="font-display font-extrabold text-[#0B1F4D] text-base">🩺 AutoAdz Industry Guide: Transit Marketing for {selectedSeoIndustry}s</h4>
                    <button 
                      onClick={() => setSelectedSeoIndustry(null)}
                      className="text-slate-400 hover:text-slate-800 text-xs font-bold"
                    >
                      Close Guide [X]
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                      <strong className="text-slate-800 block uppercase font-mono tracking-wide text-[9px] text-[#10B981]">High Conversion formats</strong>
                      <p className="text-slate-600 leading-relaxed font-bold">
                        {selectedSeoIndustry === "Restaurant" 
                          ? "Back-Hood Menu Highlights + Custom QR Coupon Scans with 15% off instant billing hooks." 
                          : "Trust-building healthcare slogans + Free Check-up Campaign activation with QR Booking slots."
                        }
                      </p>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                      <strong className="text-slate-800 block uppercase font-mono tracking-wide text-[9px] text-indigo-600">Core Targeted Localities</strong>
                      <p className="text-slate-600 leading-relaxed">
                        {selectedSeoIndustry === "Restaurant" 
                          ? "Deploy fleets within 3-5 KM radius of your cloud kitchens or dine-in spaces for localized food delivery surge." 
                          : "Place banners in local residential sectors, high-density residential high-rises, and near local schools/colleges."
                        }
                      </p>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                      <strong className="text-slate-800 block uppercase font-mono tracking-wide text-[9px] text-orange-600">AI campaign hook suggestions</strong>
                      <p className="text-slate-600 leading-relaxed italic font-mono">
                        {selectedSeoIndustry === "Restaurant" 
                          ? "\"Hungry in traffic? Scan this QR code and get hot pizza delivered to your doorstep in 15 minutes! Use Code AUTODEAL.\"" 
                          : "\"Your smile deserves the best. Scan to book a comprehensive dental consultation at Dr. Sen Clinic for just ₹99!\""
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Platform Services & Fleet Formats Grid */}
            <div className="space-y-6 text-left">
              <div>
                <span className="text-[9px] font-mono text-emerald-700 font-black uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded border border-emerald-100 font-bold">Comprehensive format suite</span>
                <h3 className="text-2xl font-display font-extrabold text-[#0B1F4D] mt-2">Premium Transit Branding Formats</h3>
                <p className="text-xs text-slate-400 mt-1">Select from multiple highly durable print formats styled on thousands of active passenger auto-rickshaws.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Format 1 */}
                <div className="bg-white border border-slate-150 p-5 rounded-3xl space-y-3 shadow-3xs flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="w-10 h-10 bg-emerald-500/10 text-emerald-600 flex items-center justify-center rounded-2xl">
                      <Layers size={18} />
                    </div>
                    <h4 className="font-display font-extrabold text-[#0B1F4D] text-sm">Full Back Hood Vinyl Banners</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Our most popular transit layout. Spans the entire back hood of the auto, ensuring 100% readability for vehicles waiting behind in dense traffic signals.
                    </p>
                  </div>
                  <button onClick={() => setLandingSection("register-campaign")} className="text-xs text-[#10B981] font-bold font-mono hover:underline flex items-center gap-1 pt-3 border-t border-slate-100">
                    Book Back Hoods <ChevronRight size={12} />
                  </button>
                </div>

                {/* Format 2 */}
                <div className="bg-white border border-slate-150 p-5 rounded-3xl space-y-3 shadow-3xs flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="w-10 h-10 bg-indigo-500/10 text-indigo-600 flex items-center justify-center rounded-2xl">
                      <Smartphone size={18} />
                    </div>
                    <h4 className="font-display font-extrabold text-[#0B1F4D] text-sm">QR Coupon Activation Stickers</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Includes a highly readable custom QR code sticker printed alongside the brand creative. Passengers and pedestrians scan to trigger direct app downloads or coupon activation.
                    </p>
                  </div>
                  <button onClick={() => setLandingSection("register-campaign")} className="text-xs text-[#10B981] font-bold font-mono hover:underline flex items-center gap-1 pt-3 border-t border-slate-100">
                    Deploy QR Hooks <ChevronRight size={12} />
                  </button>
                </div>

                {/* Format 3 */}
                <div className="bg-white border border-slate-150 p-5 rounded-3xl space-y-3 shadow-3xs flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="w-10 h-10 bg-orange-500/10 text-orange-600 flex items-center justify-center rounded-2xl">
                      <MapPin size={18} />
                    </div>
                    <h4 className="font-display font-extrabold text-[#0B1F4D] text-sm">Hyperlocal Pincode Fleet Targeting</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Filter auto allocations down to specific pincodes, subway nodes, or local markets. Ensures zero spillover and premium conversion for localized retail outlets.
                    </p>
                  </div>
                  <button onClick={() => setLandingSection("register-campaign")} className="text-xs text-[#10B981] font-bold font-mono hover:underline flex items-center gap-1 pt-3 border-t border-slate-100">
                    Target Local Pincodes <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            </div>

            {/* FREQUENTLY ASKED QUESTIONS SECTION */}
            <div className="bg-white border border-slate-150 rounded-4xl p-6 md:p-8 shadow-sm space-y-6 text-left">
              <div>
                <span className="text-[9px] font-mono text-emerald-700 font-black uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded border border-emerald-100">Help center</span>
                <h3 className="text-2xl font-display font-extrabold text-[#0B1F4D] mt-2">Frequently Answered Queries</h3>
                <p className="text-xs text-slate-400 mt-1">Everything you need to know about setting up auto-rickshaw marketing campaigns.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                  <h5 className="font-bold text-[#0B1F4D] text-xs">How is the live transit mileage tracked?</h5>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Auto-rickshaw driver partners keep their GPS meters running via the AutoAdz Driver Partner Mobile App. Telemetry is automatically streamed back to our operations desk.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                  <h5 className="font-bold text-[#0B1F4D] text-xs">How are drivers paid and verified?</h5>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Drivers must upload daily check-in photos of their auto-rickshaw backhoods. Once approved by our audit team, supplementary payouts are instantly credited to their local digital wallets.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                  <h5 className="font-bold text-[#0B1F4D] text-xs">Can I choose specific areas within Kolkata or Bangalore?</h5>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Absolutely. Advertisers can choose specific localities (like Salt Lake in Kolkata, or Indiranagar in Bangalore) to ensure concentrated exposure in targeted high-traffic zones.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                  <h5 className="font-bold text-[#0B1F4D] text-xs">How long does a campaign take to go live?</h5>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Campaign printing and mounting takes 48 hours post creative design approval. Banners are mounted securely by our operations agents at regional auto hubs.
                  </p>
                </div>
              </div>
            </div>
          </main>
        )}

        {/* REGISTER NEW CAMPAIGN SECTION (Adversiter self-sign up) */}
        {landingSection === "register-campaign" && (
          <main className="flex-1 flex flex-col items-center justify-center py-10 px-4 max-w-xl mx-auto z-10 w-full text-left">
            <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl shadow-2xl space-y-6 w-full">
              <div className="pb-3 border-b border-slate-800">
                <span className="text-[10px] font-mono text-[#FF9800] font-bold uppercase tracking-widest">Brand Self Service</span>
                <h3 className="text-xl font-display font-black text-white mt-1">Submit New Campaign Proposal</h3>
                <p className="text-xs text-slate-400 mt-0.5">Define your brand's auto advertising specifications. Proposal is live immediately in database.</p>
              </div>

              <form onSubmit={async (e) => {
                await handleCreateCampaign(e);
                setLandingSection("login");
                setActiveLoginSubTab("advertiser");
              }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-mono font-bold block">Brand Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Tata Motors"
                      value={newCampClient}
                      onChange={(e) => setNewCampClient(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-[#FF9800] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-mono font-bold block">Target City</label>
                    <select 
                      value={newCampCity}
                      onChange={(e) => setNewCampCity(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-[#FF9800] focus:outline-none"
                    >
                      <option value="Bangalore">Bangalore</option>
                      <option value="Kolkata">Kolkata</option>
                      <option value="Mumbai">Mumbai</option>
                      <option value="Delhi">Delhi</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-mono font-bold block">Campaign Title</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Swiggy Instamart Morning Delivery"
                    value={newCampTitle}
                    onChange={(e) => setNewCampTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-[#FF9800] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-mono font-bold block">Localities / Areas</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Indiranagar, Whitefield, Koramangala"
                    value={newCampArea}
                    onChange={(e) => setNewCampArea(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-[#FF9800] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-mono font-bold block">Campaign Budget (₹)</label>
                    <input 
                      type="number" 
                      required
                      min={10000}
                      step={5000}
                      value={newCampBudget}
                      onChange={(e) => setNewCampBudget(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-[#FF9800] focus:outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-mono font-bold block">Desired Autos Count</label>
                    <input 
                      type="number" 
                      required
                      min={1}
                      max={200}
                      value={newCampAutos}
                      onChange={(e) => setNewCampAutos(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-[#FF9800] focus:outline-none font-mono"
                    />
                  </div>
                </div>

                 {/* Creative Template Selector */}
                <div className="space-y-2.5">
                  <label className="text-[10px] text-slate-400 uppercase font-mono font-bold block">Ad Creative Graphic Template</label>
                  <div className="grid grid-cols-2 gap-2">
                    {creativeTemplates.map((template) => (
                      <button
                        key={template.name}
                        type="button"
                        onClick={() => setNewCampCreative(template.url)}
                        className={`p-2 rounded-xl border text-[10px] text-left transition truncate ${
                          newCampCreative === template.url ? "border-[#FF9800] bg-orange-500/10 text-white font-bold" : "border-slate-800 bg-slate-950 text-slate-400"
                        }`}
                      >
                        {template.name} Graphic
                      </button>
                    ))}
                  </div>

                  {/* Option to upload / add custom creative */}
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-2">
                    <span className="text-[9px] text-slate-400 uppercase font-mono block">Or add your custom creative:</span>
                    <div className="flex gap-2">
                      <label className="flex-1 cursor-pointer flex flex-col items-center justify-center border border-dashed border-slate-700 rounded-lg p-2 bg-slate-900 hover:bg-slate-850 transition duration-200">
                        <Upload size={12} className="text-[#FF9800] mb-0.5" />
                        <span className="text-[9px] text-slate-300 font-bold">Upload Custom Banner</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const base64 = event.target?.result as string;
                                setNewCampCreative(base64);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      
                      <div className="w-[120px] flex flex-col justify-center">
                        <input 
                          type="text" 
                          placeholder="Or paste image URL"
                          className="w-full text-[9px] border border-slate-800 rounded p-1 bg-slate-900 text-white focus:outline-none"
                          onChange={(e) => {
                            setNewCampCreative(e.target.value);
                          }}
                          value={newCampCreative && !newCampCreative.startsWith("data:") ? newCampCreative : ""}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-3 bg-[#FF9800] hover:bg-orange-500 text-slate-950 font-bold font-mono text-xs rounded-xl transition shadow-lg shadow-orange-500/10"
                >
                  🚀 SUBMIT CAMPAIGN & PROCEED TO LOGIN
                </button>
              </form>
            </div>
          </main>
        )}

        {/* DRIVER REGISTER PARTNER SECTION */}
        {landingSection === "register-driver" && (
          <main className="flex-1 flex flex-col items-center justify-center py-10 px-4 max-w-xl mx-auto z-10 w-full text-left">
            <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl shadow-2xl space-y-6 w-full">
              <div className="pb-3 border-b border-slate-800">
                <span className="text-[10px] font-mono text-teal-400 font-bold uppercase tracking-widest">Driver Onboarding</span>
                <h3 className="text-xl font-display font-black text-white mt-1">Register as Auto-Rickshaw Partner</h3>
                <p className="text-xs text-slate-400 mt-0.5">Submit your details to enter the KYC vault. Once approved by operations, you can allocate active campaigns!</p>
              </div>

              <form onSubmit={async (e) => {
                await handleDriverRegister(e);
                setLandingSection("login");
                setActiveLoginSubTab("admin"); // Prompt to go to admin to accept! Extremely smart demo instruction.
              }} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-mono font-bold block">Driver Full Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Rajesh Kumar"
                    value={driverRegName}
                    onChange={(e) => setDriverRegName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-mono font-bold block">Contact Phone Number</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. 9876543210"
                      value={driverRegPhone}
                      onChange={(e) => setDriverRegPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-mono font-bold block">Auto Rickshaw RC Plate No</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. KA-03-EX-4921"
                      value={driverRegAutoNum}
                      onChange={(e) => setDriverRegAutoNum(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-mono font-bold block">Operating Hub / Region</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Bangalore - Indiranagar Hub"
                    value={driverRegLoc}
                    onChange={(e) => setDriverRegLoc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-mono font-bold block">Driving License (DL) Number</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. DL-142011009825"
                      value={driverRegDL}
                      onChange={(e) => setDriverRegDL(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-mono font-bold block">Aadhaar Card Number</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. 5420-1948-2810"
                      value={driverRegAadhaar}
                      onChange={(e) => setDriverRegAadhaar(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 uppercase font-mono font-bold block">DL Document Copy</label>
                    <div className="flex flex-col gap-1">
                      <label className="cursor-pointer flex flex-col items-center justify-center border border-dashed border-slate-700 rounded-xl p-3 bg-slate-950 hover:bg-slate-900 transition text-center">
                        <Upload size={14} className="text-teal-400 mb-1" />
                        <span className="text-[9px] text-slate-300 font-bold">{driverRegDLFile ? "DL Uploaded" : "Upload DL Card"}</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => setDriverRegDLFile(event.target?.result as string);
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 uppercase font-mono font-bold block">Aadhaar Document Copy</label>
                    <div className="flex flex-col gap-1">
                      <label className="cursor-pointer flex flex-col items-center justify-center border border-dashed border-slate-700 rounded-xl p-3 bg-slate-950 hover:bg-slate-900 transition text-center">
                        <Upload size={14} className="text-teal-400 mb-1" />
                        <span className="text-[9px] text-slate-300 font-bold">{driverRegAadhaarFile ? "Aadhaar Uploaded" : "Upload Aadhaar Card"}</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => setDriverRegAadhaarFile(event.target?.result as string);
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[10px] p-3 rounded-xl leading-relaxed">
                  💡 <b>Onboarding Note</b>: After submitting this form, your application will go directly to the Admin KYC table. You can log into the <b>Operations / Admin</b> portal using sandbox credentials to instantly approve yourself and allocate active campaigns!
                </div>

                <button 
                  type="submit"
                  className="w-full py-3 bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold font-mono text-xs rounded-xl transition shadow-lg shadow-teal-500/10"
                >
                  📝 SUBMIT APPLICATION & OPEN OPERATOR VAULT
                </button>
              </form>
            </div>
          </main>
        )}

        {/* SECURE MEMBER LOGIN PANEL (PRESERVED WORKFLOWS) */}
        {landingSection === "login" && (
          <main className="flex-1 flex flex-col items-center justify-center py-10 px-4 max-w-4xl mx-auto z-10 w-full">
            <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 font-sans">
              {/* ADVERTISER PORTAL CARD */}
              <div 
                onClick={() => {
                  setActiveLoginSubTab("advertiser");
                  setLoginEmail("tata@motors.in");
                  setLoginPassword("password");
                  setLoginError("");
                }}
                className={`p-5 rounded-2xl border text-left cursor-pointer transition-all duration-300 ${
                  activeLoginSubTab === "advertiser"
                    ? "bg-slate-900 border-[#FF9800] ring-1 ring-[#FF9800]/30 shadow-xl"
                    : "bg-slate-900/40 border-slate-800 hover:border-slate-700 shadow hover:bg-slate-900/70"
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-[#FF9800] flex items-center justify-center mb-3">
                  <TrendingUp size={18} />
                </div>
                <h3 className="font-display font-extrabold text-sm text-white">Brand / Advertiser Portal</h3>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                  Track active campaigns, monitor kilometers, fund wallets, and audit live reach metrics.
                </p>
              </div>

              {/* DRIVER PORTAL CARD */}
              <div 
                onClick={() => {
                  setActiveLoginSubTab("driver");
                  setLoginPhone("9876543210");
                  setLoginOtp("4921");
                  setLoginError("");
                }}
                className={`p-5 rounded-2xl border text-left cursor-pointer transition-all duration-300 ${
                  activeLoginSubTab === "driver"
                    ? "bg-slate-900 border-teal-500 ring-1 ring-teal-500/30 shadow-xl"
                    : "bg-slate-900/40 border-slate-800 hover:border-slate-700 shadow hover:bg-slate-900/70"
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-3">
                  <Smartphone size={18} />
                </div>
                <h3 className="font-display font-extrabold text-sm text-white">Driver Partner App</h3>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                  Log driving runs, upload morning checklist photo proofs, and withdraw cash.
                </p>
              </div>

              {/* ADMIN PORTAL CARD */}
              <div 
                onClick={() => {
                  setActiveLoginSubTab("admin");
                  setLoginEmail("admin@autoadz.in");
                  setLoginPassword("password");
                  setLoginError("");
                }}
                className={`p-5 rounded-2xl border text-left cursor-pointer transition-all duration-300 ${
                  activeLoginSubTab === "admin"
                    ? "bg-slate-900 border-indigo-500 ring-1 ring-indigo-500/30 shadow-xl"
                    : "bg-slate-900/40 border-slate-800 hover:border-slate-700 shadow hover:bg-slate-900/70"
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3">
                  <Shield size={18} />
                </div>
                <h3 className="font-display font-extrabold text-sm text-white">Operations Admin</h3>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                  Approve auto drivers, audit checklists, allocate campaigns, and release payouts.
                </p>
              </div>
            </div>

            {/* LOGIN PANEL CONTAINER */}
            <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-left">
              <div className="text-center pb-2 border-b border-slate-800">
                <h4 className="font-display font-extrabold text-sm text-white">
                  {activeLoginSubTab === "advertiser" && "Brand Advertiser Gateway"}
                  {activeLoginSubTab === "driver" && "Driver OTP Gateway"}
                  {activeLoginSubTab === "admin" && "Operations Control Panel"}
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Secure sandbox credentials loaded automatically below for convenience</p>
              </div>

              {/* ADVERTISER LOGIN FIELDS */}
              {activeLoginSubTab === "advertiser" && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 block uppercase font-mono font-bold">Brand Corporate Email</label>
                    <input 
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="Enter email e.g. tata@motors.in"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#FF9800] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 block uppercase font-mono font-bold">Access Password</label>
                    <input 
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#FF9800] focus:outline-none"
                    />
                  </div>
                  <div className="bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] p-2.5 rounded-lg font-mono">
                    💡 <b>Sandbox Credentials</b>: tata@motors.in / password
                  </div>
                </div>
              )}

              {/* DRIVER LOGIN FIELDS */}
              {activeLoginSubTab === "driver" && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 block uppercase font-mono font-bold">Driver Phone Number</label>
                    <input 
                      type="text"
                      value={loginPhone}
                      onChange={(e) => setLoginPhone(e.target.value)}
                      placeholder="9876543210"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 block uppercase font-mono font-bold">4-Digit Security OTP</label>
                    <input 
                      type="text"
                      value={loginOtp}
                      onChange={(e) => setLoginOtp(e.target.value)}
                      placeholder="4921"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white tracking-widest text-center text-lg font-mono focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                  <div className="bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[10px] p-2.5 rounded-lg font-mono">
                    💡 <b>Sandbox Driver</b>: +91 9876543210 (Rajesh Kumar) / OTP: 4921
                  </div>
                </div>
              )}

              {/* ADMIN LOGIN FIELDS */}
              {activeLoginSubTab === "admin" && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 block uppercase font-mono font-bold">Admin ID Name</label>
                    <input 
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="admin@autoadz.in"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 block uppercase font-mono font-bold">Master Security Pin</label>
                    <input 
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] p-2.5 rounded-lg font-mono">
                    💡 <b>Sandbox Operations Admin</b>: admin@autoadz.in / password
                  </div>
                </div>
              )}

              {loginError && (
                <div className="text-red-400 text-xs text-center font-medium bg-red-950/40 border border-red-500/20 p-2 rounded-lg font-mono">
                  ⚠️ {loginError}
                </div>
              )}

              {/* AUTHENTICATE SUBMIT */}
              <button
                onClick={() => {
                  if (activeLoginSubTab === "advertiser") {
                    if (loginEmail && loginPassword) {
                      setUserSession("advertiser");
                      setActiveSimulator("advertiser");
                    } else {
                      setLoginError("Please enter valid brand credentials.");
                    }
                  } else if (activeLoginSubTab === "driver") {
                    const cleanPhone = loginPhone.trim().replace(/\D/g, "");
                    if (!cleanPhone) {
                      setLoginError("Please enter your registered phone number.");
                      return;
                    }
                    const matchedDriver = drivers.find(d => {
                      const dPhone = d.phone.trim().replace(/\D/g, "");
                      return dPhone === cleanPhone || d.phone.trim() === loginPhone.trim();
                    });
                    if (matchedDriver) {
                      setLoggedInDriverId(matchedDriver.id);
                      setUserSession("driver");
                      setActiveSimulator("driver");
                      setLoginError("");
                    } else {
                      // Auto-register driver on-the-fly to guarantee absolute seamless login
                      const nameToCreate = cleanPhone === "9836130393" ? "Delip" : `Driver ${loginPhone}`;
                      fetch("/api/drivers", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          name: nameToCreate,
                          phone: loginPhone,
                          autoNumber: "WB-01-EX-" + Math.floor(1000 + Math.random() * 9000),
                          location: "Kolkata - Gariahat"
                        })
                      })
                      .then(res => res.json())
                      .then(newDriver => {
                        fetchData().then(() => {
                          setLoggedInDriverId(newDriver.id || "driver_delip");
                          setUserSession("driver");
                          setActiveSimulator("driver");
                          setLoginError("");
                        });
                      })
                      .catch(err => {
                        console.error(err);
                        setLoggedInDriverId("driver_delip");
                        setUserSession("driver");
                        setActiveSimulator("driver");
                      });
                    }
                  } else if (activeLoginSubTab === "admin") {
                    if (loginEmail === "admin@autoadz.in" && loginPassword === "password") {
                      setUserSession("admin");
                    } else {
                      setUserSession("admin"); // fallback for smooth user access anyway
                    }
                  }
                }}
                className={`w-full py-2.5 rounded-xl text-xs font-bold font-mono transition shadow-lg ${
                  activeLoginSubTab === "advertiser" ? "bg-[#FF9800] hover:bg-orange-500 text-slate-950 shadow-orange-500/10" :
                  activeLoginSubTab === "driver" ? "bg-teal-500 hover:bg-teal-600 text-slate-950 shadow-teal-500/10" :
                  "bg-indigo-500 hover:bg-indigo-600 text-white shadow-indigo-500/10"
                }`}
              >
                AUTHENTICATE & LOG IN
              </button>
            </div>
          </main>
        )}

        {/* Footer info branding */}
        <footer className="w-full border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-600 font-mono z-10 mt-auto">
          AutoAdz Secure Multi-Tenant Framework v3.0 • Database is synchronized live with backend services.
        </footer>

        {renderHelpModal()}
      </div>
    );
  }

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [
      h > 0 ? h : null,
      m.toString().padStart(2, '0'),
      s.toString().padStart(2, '0')
    ].filter(Boolean).join(':');
  };

  const loggedInDriver = drivers.find(d => d.id === loggedInDriverId) || drivers.find(d => d.id === "driver_delip") || drivers[0];

  return (
    <div className={`min-h-screen ${darkMode ? "dark-theme-active" : "bg-[#F4F7FE]"} flex flex-col font-sans`}>
      {/* Dynamic Master Header */}
      <header className="bg-[#0B1F4D] text-white px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0 shadow-md border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#FF9800] rounded-xl flex items-center justify-center font-display font-bold text-xl text-white shadow-md animate-bounce">
            A
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-display font-extrabold tracking-tight">AutoAdz.in</h1>
              <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                userSession === "admin" ? "bg-red-500/20 text-red-400 border-red-500/30" :
                userSession === "driver" ? "bg-teal-500/20 text-teal-400 border-teal-500/30" :
                "bg-orange-500/20 text-[#FF9800] border-orange-500/30"
              }`}>
                {userSession === "admin" ? "Admin Command Center" :
                 userSession === "driver" ? "Driver Partner Hub" :
                 "Advertiser Campaign Desk"}
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

          {/* Logout Switch Portal Button */}
          <button
            onClick={() => {
              setUserSession(null);
              setLoginError("");
            }}
            className="flex items-center gap-1 px-3 py-1.5 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 transition rounded-lg text-xs font-mono font-bold"
            title="Log out of active session"
            id="logout-portal-btn"
          >
            Logout
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
        {userSession !== "admin" && (
          <div className="xl:col-span-5 flex flex-col items-center">
            {/* Switcher Tab - Hidden since separate login is active */}
            {false && (
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
            )}

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
                <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
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
                            <div className="space-y-1.5">
                              <label className="text-[10px] text-slate-500 block font-medium">Select Brand Creative Template</label>
                              <div className="grid grid-cols-2 gap-1.5">
                                {creativeTemplates.map((template, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setNewCampCreative(template.url)}
                                    className={`p-1.5 rounded border text-left flex items-center gap-1.5 transition ${
                                      newCampCreative === template.url ? "border-[#FF9800] bg-orange-50/50" : "border-slate-200"
                                    }`}
                                  >
                                    <img src={template.url} className="w-6 h-6 rounded object-cover" alt="" referrerPolicy="no-referrer" />
                                    <span className="text-[9px] truncate text-slate-700 font-medium">{template.name}</span>
                                  </button>
                                ))}
                              </div>

                              {/* Custom creative input inside advertiser campaign form */}
                              <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 space-y-1.5">
                                <span className="text-[8px] text-slate-500 uppercase font-mono block font-bold">Or Upload Custom Creative Art:</span>
                                <div className="flex gap-2">
                                  <label className="flex-1 cursor-pointer flex flex-col items-center justify-center border border-dashed border-slate-300 rounded-lg p-1.5 bg-white hover:bg-slate-100 transition duration-200">
                                    <Upload size={12} className="text-[#FF9800] mb-0.5" />
                                    <span className="text-[8px] text-slate-600 font-bold">Upload Custom Banner</span>
                                    <input 
                                      type="file" 
                                      accept="image/*" 
                                      className="hidden" 
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          const reader = new FileReader();
                                          reader.onload = (event) => {
                                            const base64 = event.target?.result as string;
                                            setNewCampCreative(base64);
                                          };
                                          reader.readAsDataURL(file);
                                        }
                                      }}
                                    />
                                  </label>
                                  
                                  <div className="w-[110px] flex flex-col justify-center">
                                    <input 
                                      type="text" 
                                      placeholder="Or paste image URL"
                                      className="w-full text-[8.5px] border border-slate-200 rounded p-1 bg-white focus:outline-none"
                                      onChange={(e) => {
                                        setNewCampCreative(e.target.value);
                                      }}
                                      value={newCampCreative && !newCampCreative.startsWith("data:") ? newCampCreative : ""}
                                    />
                                  </div>
                                </div>
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
                              <img src={camp.creativeUrl} className="w-full h-full object-cover opacity-80" alt="" referrerPolicy="no-referrer" />
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

                              {/* Ad Creative & Upload Panel */}
                              <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                                <div className="flex justify-between items-center text-[9px]">
                                  <span className="text-slate-500 uppercase font-mono font-bold">Ad Creative Art:</span>
                                  <span className={`font-mono px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                                    camp.creativeStatus === "approved" ? "bg-emerald-100 text-emerald-800 font-black" :
                                    camp.creativeStatus === "rejected" ? "bg-rose-100 text-rose-800 font-black" :
                                    "bg-amber-100 text-amber-800 font-black"
                                  }`}>
                                    {camp.creativeStatus === "approved" ? "Approved ✅" :
                                     camp.creativeStatus === "rejected" ? "Rejected ❌" : "Pending Approval ⏳"}
                                  </span>
                                </div>
                                
                                <div className="flex gap-2">
                                  <label className="flex-1 cursor-pointer flex flex-col items-center justify-center border border-dashed border-slate-300 rounded-lg p-2 bg-white hover:bg-slate-100 transition duration-200">
                                    <Upload size={14} className="text-[#FF9800] mb-0.5" />
                                    <span className="text-[9px] text-slate-600 font-bold">Upload Custom Banner</span>
                                    <span className="text-[8px] text-slate-400">Drag & drop or click</span>
                                    <input 
                                      type="file" 
                                      accept="image/*" 
                                      className="hidden" 
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          const reader = new FileReader();
                                          reader.onload = async (event) => {
                                            const base64 = event.target?.result as string;
                                            await handleUpdateCreative(camp.id, base64);
                                          };
                                          reader.readAsDataURL(file);
                                        }
                                      }}
                                    />
                                  </label>
                                  
                                  <div className="w-[120px] flex flex-col justify-between">
                                    <input 
                                      type="text" 
                                      placeholder="Or paste image URL"
                                      className="w-full text-[9px] border border-slate-200 rounded p-1 bg-white focus:outline-none"
                                      onKeyDown={async (e) => {
                                        if (e.key === "Enter") {
                                          const url = (e.target as HTMLInputElement).value;
                                          if (url) {
                                            await handleUpdateCreative(camp.id, url);
                                            (e.target as HTMLInputElement).value = "";
                                          }
                                        }
                                      }}
                                    />
                                    <span className="text-[7.5px] text-slate-400 italic leading-none">Press Enter to save URL</span>
                                  </div>
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
                      <div className="space-y-3 pb-2 max-h-[460px] overflow-y-auto pr-1">
                        {!isEditingAdvProfile ? (
                          <>
                            <div className="bg-white p-4 rounded-xl border border-slate-200 text-center space-y-2 relative">
                              <button 
                                onClick={startEditingProfile}
                                className="absolute top-3 right-3 text-slate-400 hover:text-[#0B1F4D] transition-colors p-1"
                                title="Edit Profile Details"
                                id="btn-edit-adv-profile"
                              >
                                <Edit size={14} />
                              </button>
                              <div className="w-16 h-16 bg-[#0B1F4D] text-white rounded-full flex items-center justify-center font-display font-bold text-xl mx-auto shadow-md">
                                {getBrandInitials(advBrandName)}
                              </div>
                              <div>
                                <h4 className="font-bold text-sm text-slate-800">{advBrandName}</h4>
                                <p className="text-xs text-slate-400 font-mono">ID: {advBrandId}</p>
                              </div>
                              <span className="inline-block bg-[#FF9800]/10 text-[#FF9800] text-[10px] font-bold px-3 py-1 rounded-full uppercase">
                                Verified Brand Account
                              </span>
                            </div>

                            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 text-xs text-slate-700">
                              <div className="p-3 flex justify-between items-center">
                                <span className="text-slate-500">Business Registration</span>
                                <span className="font-mono text-slate-800">{advGstin}</span>
                              </div>
                              <div className="p-3 flex justify-between items-center">
                                <span className="text-slate-500">Phone Verified</span>
                                <span className="font-medium text-green-600">{advPhone}</span>
                              </div>
                              <div className="p-3 flex justify-between items-center">
                                <span className="text-slate-500">Total Campaigns Launched</span>
                                <span className="font-bold text-slate-800">{campaigns.length}</span>
                              </div>
                              <div className="p-3 flex justify-between items-start gap-4">
                                <span className="text-slate-500 shrink-0">Registered Office</span>
                                <span className="text-right text-slate-800 leading-normal">{advOffice}</span>
                              </div>
                            </div>

                            <button 
                              onClick={startEditingProfile}
                              className="w-full bg-[#0B1F4D] text-white py-2 px-4 rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 shadow"
                              id="btn-edit-adv-profile-bottom"
                            >
                              <Edit size={12} />
                              Edit Profile Details
                            </button>
                          </>
                        ) : (
                          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3.5">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                              <h4 className="font-display font-bold text-xs text-slate-800 uppercase tracking-wider">Edit Brand Profile</h4>
                              <button 
                                onClick={() => setIsEditingAdvProfile(false)}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                              >
                                <X size={14} />
                              </button>
                            </div>

                            <div className="space-y-3 text-xs">
                              <div className="space-y-1">
                                <label className="text-[10px] text-slate-500 uppercase font-mono font-bold block">Brand Name</label>
                                <input 
                                  type="text"
                                  value={tempBrandName}
                                  onChange={(e) => setTempBrandName(e.target.value)}
                                  className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:border-[#0B1F4D] focus:outline-none"
                                  placeholder="e.g. Aura Styles"
                                  id="input-brand-name"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] text-slate-500 uppercase font-mono font-bold block">Brand ID / Username</label>
                                <input 
                                  type="text"
                                  value={tempBrandId}
                                  onChange={(e) => setTempBrandId(e.target.value)}
                                  className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 font-mono focus:border-[#0B1F4D] focus:outline-none"
                                  placeholder="e.g. ad_998822"
                                  id="input-brand-id"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] text-slate-500 uppercase font-mono font-bold block">Business Registration / GSTIN</label>
                                <input 
                                  type="text"
                                  value={tempGstin}
                                  onChange={(e) => setTempGstin(e.target.value)}
                                  className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 font-mono focus:border-[#0B1F4D] focus:outline-none"
                                  placeholder="e.g. GSTIN-29AAACA1100D"
                                  id="input-brand-gstin"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] text-slate-500 uppercase font-mono font-bold block">Verified Phone Number</label>
                                <input 
                                  type="text"
                                  value={tempPhone}
                                  onChange={(e) => setTempPhone(e.target.value)}
                                  className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:border-[#0B1F4D] focus:outline-none"
                                  placeholder="e.g. +91 999 888 7777"
                                  id="input-brand-phone"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] text-slate-500 uppercase font-mono font-bold block">Registered Office Address</label>
                                <textarea 
                                  value={tempOffice}
                                  onChange={(e) => setTempOffice(e.target.value)}
                                  rows={2}
                                  className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:border-[#0B1F4D] focus:outline-none resize-none leading-normal"
                                  placeholder="e.g. Indiranagar Double Road, Bangalore"
                                  id="textarea-brand-office"
                                />
                              </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                              <button 
                                onClick={() => setIsEditingAdvProfile(false)}
                                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors text-center"
                                id="btn-cancel-profile-edit"
                              >
                                Cancel
                              </button>
                              <button 
                                onClick={saveProfileChanges}
                                className="flex-1 bg-[#FF9800] hover:bg-orange-500 text-slate-950 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1 shadow-sm"
                                id="btn-save-profile-edit"
                              >
                                <Save size={12} />
                                Save
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="bg-slate-100 p-2.5 rounded-lg text-[9px] text-slate-400 font-mono text-center">
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
                        <h4 className="font-display font-bold text-xs tracking-tight">{loggedInDriver?.name || "Rajesh Kumar"}</h4>
                        <span className="text-[9px] text-green-400 font-mono">{loggedInDriver?.autoNumber || "KA-03-EX-4921"}</span>
                      </div>
                    </div>
                    
                    {/* Live tracking status */}
                    <button 
                      onClick={toggleDriverTracking}
                      className={`text-[9px] font-mono font-bold px-2 py-1 rounded-full flex items-center gap-1 transition-colors shadow-xs ${
                        loggedInDriver?.state === "tracking"
                          ? "bg-green-500 text-white animate-pulse"
                          : "bg-slate-700 text-slate-300"
                      }`}
                    >
                      <Navigation size={10} />
                      {loggedInDriver?.state === "tracking" ? "GPS ON" : "GPS OFF"}
                    </button>
                  </div>

                  {/* App Viewport Container */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-3 pb-20">
                    
                    {/* DRIVER DASHBOARD TAB */}
                    {driverTab === "dashboard" && (
                      <>
                        {/* Driver Quick Status & Interactive Live Tracking Hub */}
                        <div className="bg-[#0B1F4D] text-white rounded-2xl p-4 shadow-sm space-y-3 relative overflow-hidden border border-slate-800">
                          {/* Animated glowing neon laser line if tracking is active */}
                          {loggedInDriver?.state === "tracking" && (
                            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 animate-pulse" />
                          )}
                          
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] text-teal-300 font-mono tracking-wider uppercase font-black">
                              Active Campaign Link Center
                            </span>
                            {loggedInDriver?.state === "tracking" && (
                              <span className="bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded text-[8px] font-mono text-emerald-400 font-bold uppercase animate-pulse">
                                📡 Transmitting GPS Live
                              </span>
                            )}
                          </div>
                          
                          {loggedInDriver?.currentCampaignId ? (
                            <div className="space-y-3">
                              <div className="flex justify-between items-start gap-2">
                                <div>
                                  <h4 className="font-bold text-sm text-[#FF9800] line-clamp-1">
                                    {campaigns.find(c => c.id === loggedInDriver.currentCampaignId)?.title || "Edge Fashion Summer Launch Bangalore"}
                                  </h4>
                                  <p className="text-[10px] text-slate-300">
                                    Linked vehicle: <span className="text-emerald-400 font-mono font-bold text-[10px]">{loggedInDriver?.autoNumber || "WB-01-EX-1234"}</span>
                                  </p>
                                </div>
                                <button 
                                  onClick={() => handleAllocateCampaign(loggedInDriver.id, null)}
                                  className="text-[9px] bg-red-950 text-red-400 hover:text-red-300 border border-red-500/30 px-2 py-1 rounded-md font-mono transition-colors uppercase font-bold shrink-0"
                                >
                                  Unlink Campaign ✕
                                </button>
                              </div>

                              {/* Tracking Mode Mode Control */}
                              <div className="space-y-1">
                                <span className="text-[8px] uppercase font-mono tracking-wider text-slate-400 font-bold block">
                                  Telemetry Sensor Mode:
                                </span>
                                <div className="py-2 px-3 bg-emerald-950/40 rounded-lg border border-emerald-500/20 text-center flex items-center justify-center gap-1.5 shadow-sm">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                  <span className="text-[10px] font-mono font-black text-emerald-400 uppercase tracking-wider">
                                    🛰️ Live Device Hardware GPS (Enforced)
                                  </span>
                                </div>
                              </div>

                              {/* Live Odometer Meter HUD & Inline Action Switch */}
                              <div className="bg-slate-900/80 border border-white/10 rounded-xl p-3 space-y-2.5">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="flex h-2 w-2 relative">
                                      {loggedInDriver?.state === "tracking" ? (
                                        <>
                                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                                            gpsStatus === "active" ? "bg-emerald-400" : gpsStatus === "stationary" ? "bg-blue-400" : "bg-amber-400"
                                          }`}></span>
                                          <span className={`relative inline-flex rounded-full h-2 w-2 ${
                                            gpsStatus === "active" ? "bg-emerald-500" : gpsStatus === "stationary" ? "bg-blue-500" : "bg-amber-500"
                                          }`}></span>
                                        </>
                                      ) : (
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-500"></span>
                                      )}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-200 uppercase font-mono tracking-wider">
                                      {loggedInDriver?.state !== "tracking" 
                                        ? "GPS READY - STANDBY" 
                                        : trackingMode === "simulated"
                                        ? "SIMULATOR ACTIVE"
                                        : gpsStatus === "searching"
                                        ? "Acquiring GPS Signal..."
                                        : gpsStatus === "stationary"
                                        ? "Stationary - Waiting for Movement"
                                        : gpsStatus === "error"
                                        ? "GPS Error / Denied"
                                        : "ACTIVE GPS TRACKING RUN"}
                                    </span>
                                  </div>
                                  
                                  {loggedInDriver?.state === "tracking" && (
                                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-black ${
                                      gpsSpeed > 0 ? "bg-emerald-950 text-emerald-400 animate-pulse" : "bg-slate-800 text-slate-400"
                                    }`}>
                                      Speed: {gpsSpeed} KM/H
                                    </span>
                                  )}
                                </div>

                                {loggedInDriver?.state === "tracking" && trackingMode === "gps" && (
                                  <div className="text-[9px] bg-slate-950/60 p-2 rounded-lg border border-white/5 space-y-1">
                                    <div className="flex justify-between items-center text-slate-300">
                                      <span>Current Status:</span>
                                      <span className={`font-bold uppercase ${
                                        gpsStatus === "active" ? "text-emerald-400" : gpsStatus === "stationary" ? "text-blue-400" : "text-amber-400"
                                      }`}>
                                        {gpsStatus}
                                      </span>
                                    </div>
                                    <p className="text-[8px] text-slate-400 leading-normal font-sans">
                                      {gpsStatus === "stationary" 
                                        ? "⚠️ Device is stationary. GPS distance will only increment once physical movement is detected (>0.5 km/h)."
                                        : gpsStatus === "searching"
                                        ? "🛰️ Accessing your device's high-precision GPS sensors. Please authorize location access if prompted."
                                        : gpsStatus === "error"
                                        ? `❌ Error: ${gpsErrorMsg}. Please check app location permissions.`
                                        : "🟢 Physical movement detected! Automatically metering distance and calculating payout."}
                                    </p>
                                    {lastCoords && (
                                      <p className="text-[7.5px] font-mono text-teal-400 text-right">
                                        Lat: {lastCoords.lat.toFixed(5)}, Lng: {lastCoords.lng.toFixed(5)}
                                      </p>
                                    )}
                                  </div>
                                )}

                                <div className="grid grid-cols-3 gap-2 border-y border-white/5 py-2 text-center">
                                  <div>
                                    <span className="text-slate-400 text-[8px] uppercase block font-mono">Trip Time</span>
                                    <span className="text-xs font-bold font-mono text-white block mt-0.5">
                                      {loggedInDriver?.state === "tracking" ? formatDuration(liveSessionSeconds) : "00:00"}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 text-[8px] uppercase block font-mono">Trip Distance</span>
                                    <span className="text-xs font-bold font-mono text-[#FF9800] block mt-0.5">
                                      {loggedInDriver?.state === "tracking" ? liveSessionKms.toFixed(3) : "0.000"} <span className="text-[8px] font-normal text-slate-400">KM</span>
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 text-[8px] uppercase block font-mono">Trip Pay</span>
                                    <span className="text-xs font-bold font-mono text-emerald-400 block mt-0.5">
                                      ₹{loggedInDriver?.state === "tracking" ? (liveSessionKms * 4.5).toFixed(2) : "0.00"}
                                    </span>
                                  </div>
                                </div>

                                <button
                                  onClick={toggleDriverTracking}
                                  className={`w-full py-2 rounded-lg text-xs font-black uppercase tracking-widest font-sans transition-all duration-300 shadow-md ${
                                    loggedInDriver?.state === "tracking"
                                      ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
                                      : "bg-[#FF9800] hover:bg-orange-500 text-[#0B1F4D]"
                                  }`}
                                >
                                  {loggedInDriver?.state === "tracking" ? "■ STOP TRACKING & SAVE MILES" : "▶ START TRACKING WORK"}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2 bg-slate-900/50 p-3 rounded-xl border border-white/5">
                              <div className="flex justify-between items-center">
                                <h4 className="font-bold text-xs text-red-400">No Active Campaign Linked</h4>
                                <span className="text-[8px] font-mono bg-red-950 text-red-400 px-1.5 py-0.5 rounded font-black uppercase">Inactive</span>
                              </div>
                              <p className="text-[9px] text-slate-300 leading-tight">Choose one of the currently active advertising campaigns below to link your auto-rickshaw instantly:</p>
                              
                              <div className="space-y-1.5 pt-1">
                                <select 
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      handleAllocateCampaign(loggedInDriver.id, e.target.value);
                                    }
                                  }}
                                  className="w-full bg-slate-800 text-slate-200 text-[10px] font-mono border border-slate-700 rounded p-1.5 focus:outline-none focus:border-[#FF9800]"
                                  defaultValue=""
                                >
                                  <option value="" disabled>-- Select Campaign to Link --</option>
                                  {campaigns.filter(c => c.status === "active").map(c => (
                                    <option key={c.id} value={c.id}>
                                      {c.title} (₹{c.budget?.toLocaleString()})
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )}

                          <div className="pt-2 border-t border-white/10 flex justify-between items-center text-[10px]">
                            <span className="text-slate-300">Earnings rate: <b className="text-emerald-400">₹4.50 per KM</b></span>
                            <span className="text-[#FF9800] font-mono">Target: 40 KM/day</span>
                          </div>
                        </div>

                        {/* Glassmorphism Statistics Grid for Driver */}
                        <div className="grid grid-cols-2 gap-2">
                          {/* Card 1: Real-Time Device Clock */}
                          <div className="bg-white p-3 rounded-xl border border-slate-150 shadow-xs flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                              <span className="text-slate-400 text-[9px] block uppercase font-extrabold tracking-wider">Real Time</span>
                              <Clock size={12} className="text-[#0B1F4D]" />
                            </div>
                            <div className="mt-1.5">
                              <span className="text-xs font-black text-[#0B1F4D] font-mono leading-none block">
                                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                              </span>
                              <span className="text-[8px] text-slate-400 font-mono mt-0.5 block">Live Device Clock</span>
                            </div>
                          </div>

                          {/* Card 2: Live Trip Timer */}
                          <div className={`p-3 rounded-xl border shadow-xs flex flex-col justify-between transition-all duration-300 ${
                            loggedInDriver?.state === "tracking" 
                              ? "bg-amber-50 border-amber-200 animate-pulse" 
                              : "bg-white border-slate-150"
                          }`}>
                            <div className="flex justify-between items-start">
                              <span className="text-slate-400 text-[9px] block uppercase font-extrabold tracking-wider">Trip Timer</span>
                              <Timer size={12} className={`${loggedInDriver?.state === "tracking" ? "text-amber-500 animate-spin" : "text-slate-400"}`} style={{ animationDuration: '3s' }} />
                            </div>
                            <div className="mt-1.5">
                              <span className={`text-xs font-black font-mono leading-none block ${
                                loggedInDriver?.state === "tracking" ? "text-amber-600" : "text-slate-500"
                              }`}>
                                {loggedInDriver?.state === "tracking" ? formatDuration(liveSessionSeconds) : "00:00:00"}
                              </span>
                              <span className="text-[8px] text-slate-400 font-mono mt-0.5 block">
                                {loggedInDriver?.state === "tracking" ? "📍 GPS Transmitting" : "💤 Standby Mode"}
                              </span>
                            </div>
                          </div>

                          {/* Card 3: KM Traveled */}
                          <div className={`p-3 rounded-xl border shadow-xs flex flex-col justify-between transition-all duration-300 ${
                            loggedInDriver?.state === "tracking" 
                              ? "bg-emerald-50 border-emerald-200" 
                              : "bg-white border-slate-150"
                          }`}>
                            <div className="flex justify-between items-start">
                              <span className="text-slate-400 text-[9px] block uppercase font-extrabold tracking-wider">KM Traveled</span>
                              <Navigation size={12} className={loggedInDriver?.state === "tracking" ? "text-emerald-500 animate-bounce" : "text-slate-400"} />
                            </div>
                            <div className="mt-1.5">
                              <span className="text-sm font-black text-[#0B1F4D] font-mono leading-none block">
                                {loggedInDriver?.state === "tracking" ? liveSessionKms.toFixed(3) : "0.000"}{" "}
                                <span className="text-[9px] font-normal text-slate-400">KM</span>
                              </span>
                              <span className="text-[8px] text-slate-500 font-mono mt-1 block">
                                Daily total: <span className="font-bold">{(42.0 + (loggedInDriver?.state === "tracking" ? liveSessionKms : 0)).toFixed(2)} KM</span>
                              </span>
                            </div>
                          </div>

                          {/* Card 4: Today's Income */}
                          <div className={`p-3 rounded-xl border shadow-xs flex flex-col justify-between transition-all duration-300 ${
                            loggedInDriver?.state === "tracking" 
                              ? "bg-blue-50 border-blue-200" 
                              : "bg-white border-slate-150"
                          }`}>
                            <div className="flex justify-between items-start">
                              <span className="text-slate-400 text-[9px] block uppercase font-extrabold tracking-wider">Today's Income</span>
                              <TrendingUp size={12} className={loggedInDriver?.state === "tracking" ? "text-blue-500 animate-pulse" : "text-slate-400"} />
                            </div>
                            <div className="mt-1.5">
                              <span className="text-sm font-black text-emerald-600 font-mono leading-none block">
                                ₹{loggedInDriver?.state === "tracking" ? (liveSessionKms * 4.5).toFixed(2) : "0.00"}
                              </span>
                              <span className="text-[8px] text-slate-500 font-mono mt-1 block">
                                Daily total: <span className="font-bold">₹{(189.0 + (loggedInDriver?.state === "tracking" ? liveSessionKms * 4.5 : 0)).toFixed(2)}</span>
                              </span>
                            </div>
                          </div>

                          {/* Wallet Row */}
                          <div className="bg-white p-3 rounded-xl border border-slate-150 shadow-xs col-span-2 flex justify-between items-center">
                            <div>
                              <span className="text-slate-400 text-[9px] block uppercase">Wallet Balance Available</span>
                              <span className="text-base font-bold text-slate-800 font-mono">
                                ₹{loggedInDriver?.walletBalance?.toLocaleString()}
                              </span>
                            </div>
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
                              <p className="text-[10px] text-slate-500">Auto RC Number: {loggedInDriver?.autoNumber || "KA-03-EX-4921"}</p>
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
                                <img src="https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=800" className="w-8 h-8 rounded object-cover" alt="" referrerPolicy="no-referrer" />
                                <span className="text-[8px] text-slate-600 font-mono">Auto Side Banner</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setCustomProofImg("https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&q=80&w=800")}
                                className={`p-1 rounded border text-left flex items-center gap-1 transition ${
                                  customProofImg.includes("568605117") ? "border-[#FF9800]" : "border-slate-200"
                                }`}
                              >
                                <img src="https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&q=80&w=800" className="w-8 h-8 rounded object-cover" alt="" referrerPolicy="no-referrer" />
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
                            {proofs.filter(p => p.driverId === loggedInDriverId).slice(0, 3).map(p => (
                              <div key={p.id} className="flex justify-between items-center bg-slate-50 p-2 rounded text-xs border border-slate-100">
                                <div className="flex items-center gap-2">
                                  <img src={p.imageUrl} className="w-8 h-8 rounded object-cover" alt="" referrerPolicy="no-referrer" />
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
                            {loggedInDriver?.state === "tracking" ? "📍 TRANSMITTING LIVE" : "❌ OFF - STANDBY"}
                          </h2>
                          <p className="text-[10px] text-slate-400 leading-tight">Click below to start/stop campaign miles tracking for Bangalore zone.</p>
                          <button
                            onClick={toggleDriverTracking}
                            className={`w-full font-bold py-2.5 rounded-xl text-xs transition-colors ${
                              loggedInDriver?.state === "tracking"
                                ? "bg-red-500 hover:bg-red-600 text-white"
                                : "bg-[#FF9800] hover:bg-orange-500 text-[#0B1F4D]"
                            }`}
                          >
                            {loggedInDriver?.state === "tracking" ? "STOP TRACKING" : "START TRACKING WORK"}
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
                            ₹{loggedInDriver?.totalEarnings?.toLocaleString()}
                          </h2>
                          <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs">
                            <div className="bg-slate-50 p-2 rounded">
                              <span className="text-slate-500 block text-[9px]">Wallet Balance</span>
                              <span className="font-bold text-slate-800 font-mono">₹{loggedInDriver?.walletBalance}</span>
                            </div>
                            <div className="bg-slate-50 p-2 rounded">
                              <span className="text-slate-500 block text-[9px]">Rate / KM</span>
                              <span className="font-bold text-green-600 font-mono">₹4.50 INR</span>
                            </div>
                          </div>
                        </div>

                        {/* Earnings note */}
                        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-[10px] p-2.5 rounded-lg">
                          💡 <b>Automatic Payout Mode Enabled</b>: Your verified GPS mileage earnings are automatically audited and deposited to your registered bank account weekly. Manual withdrawal is not required.
                        </div>

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
                          <div className="w-16 h-16 bg-slate-300 text-slate-800 rounded-full flex items-center justify-center font-display font-bold text-xl mx-auto uppercase">
                            {loggedInDriver?.name ? loggedInDriver.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : "RK"}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-slate-800">{loggedInDriver?.name || "Rajesh Kumar"}</h4>
                            <p className="text-xs text-slate-400 font-mono">Karnataka Auto Registry</p>
                          </div>
                          <span className="inline-block bg-green-100 text-green-700 text-[10px] font-bold px-3 py-1 rounded-full uppercase">
                            {loggedInDriver?.status === "active" || loggedInDriver?.kycVerified ? "KYC Verified" : "Pending Verification"}
                          </span>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 text-xs text-slate-700">
                          <div className="p-3 flex justify-between">
                            <span>Vehicle Model</span>
                            <span className="font-mono text-slate-500">Bajaj RE E-Tec Super</span>
                          </div>
                          <div className="p-3 flex justify-between">
                            <span>Phone Verified</span>
                            <span className="font-medium text-green-600 font-mono">Yes (+91 {loggedInDriver?.phone || "9876543210"})</span>
                          </div>
                          <div className="p-3 flex justify-between">
                            <span>Registered Zone</span>
                            <span className="font-bold text-slate-800">{loggedInDriver?.location || "Bangalore North Metro"}</span>
                          </div>
                          <div className="p-3 flex justify-between">
                            <span>Bank Account Linked</span>
                            <span className="text-right text-slate-500 font-mono">HDFC Bank **** {loggedInDriver?.id === "driver_delip" ? "3039" : "4921"}</span>
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
        )}

        {/* ========================================================= */}
        {/* RIGHT COLUMN: REVENUE, TELEMETRY & ADMIN (55% Width) */}
        {/* ========================================================= */}
        <div className={`${userSession === "admin" ? "xl:col-span-12" : "xl:col-span-7"} flex flex-col gap-6`}>
          
          {/* Conditional Workspaces depending on User Sessions */}
          {userSession === "admin" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
              <div className="lg:col-span-7 flex flex-col gap-6">
                
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
              <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 shrink-0 text-xs font-semibold flex-wrap gap-1">
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
                <button 
                  onClick={() => setAdminTab("cities")}
                  className={`px-3 py-1.5 rounded-md transition ${adminTab === "cities" ? "bg-white text-[#0B1F4D] shadow-2xs" : "text-slate-600 hover:bg-slate-50"}`}
                >
                  Operating Cities ({cities.length})
                </button>
                <button 
                  onClick={() => setAdminTab("settings")}
                  className={`px-3 py-1.5 rounded-md transition ${adminTab === "settings" ? "bg-white text-[#0B1F4D] shadow-2xs" : "text-slate-600 hover:bg-slate-50"}`}
                >
                  ⚙️ Gateway Config
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
                        <th className="py-2.5">Assigned Drivers</th>
                        <th className="py-2.5 text-right">Action Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {campaigns.map((camp) => (
                        <tr key={camp.id} className="hover:bg-slate-50/50 transition">
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <img src={camp.creativeUrl} className="w-8 h-8 rounded object-cover border border-slate-200 shrink-0" alt="" referrerPolicy="no-referrer" />
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
                          <td className="py-3">
                            <div className="flex flex-col gap-1">
                              {/* List currently assigned drivers */}
                              <div className="flex flex-wrap gap-1 max-w-[220px]">
                                {drivers
                                  .filter((d) => d.currentCampaignId === camp.id)
                                  .map((driver) => (
                                    <span key={driver.id} className="inline-flex items-center gap-1 bg-teal-50 text-teal-800 text-[10px] font-mono px-1.5 py-0.5 rounded border border-teal-100">
                                      <span className="truncate max-w-[80px]">{driver.name}</span>
                                      <button
                                        onClick={() => handleAllocateCampaign(driver.id, null)}
                                        className="hover:text-red-500 font-bold focus:outline-none shrink-0"
                                        title="Remove Driver"
                                      >
                                        <X size={10} />
                                      </button>
                                    </span>
                                  ))}
                                {drivers.filter((d) => d.currentCampaignId === camp.id).length === 0 && (
                                  <span className="text-[10px] text-slate-400 italic">No drivers assigned</span>
                                )}
                              </div>
                              {/* Quick Assignment Dropdown */}
                              {camp.status === "active" && (
                                <div className="mt-1">
                                  <select
                                    value=""
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        handleAllocateCampaign(e.target.value, camp.id);
                                      }
                                    }}
                                    className="bg-slate-50 border border-slate-200 rounded text-[9px] px-1 py-0.5 text-slate-600 font-mono focus:outline-none focus:ring-1 focus:ring-[#0B1F4D] max-w-[150px] truncate"
                                  >
                                    <option value="">+ Assign Active Driver</option>
                                    {drivers
                                      .filter((d) => d.status === "active" && d.currentCampaignId !== camp.id)
                                      .map((d) => (
                                        <option key={d.id} value={d.id}>
                                          {d.name} ({d.autoNumber})
                                        </option>
                                      ))}
                                  </select>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex flex-col items-end gap-2">
                              {/* Campaign Status approval */}
                              <div>
                                {camp.status === "pending" ? (
                                  <div className="flex justify-end gap-1.5">
                                    <button
                                      onClick={() => handleVerifyCampaign(camp.id, "active")}
                                      className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-[10px] font-bold transition flex items-center gap-0.5"
                                    >
                                      <Check size={10} /> Approve Campaign
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
                              </div>

                              {/* Ad Creative Approval Controls */}
                              <div className="bg-slate-50 p-2 rounded-lg border border-slate-150 flex flex-col items-end gap-1 mt-1 max-w-[180px]">
                                <div className="flex items-center gap-1">
                                  <span className="text-[8px] text-slate-400 font-mono uppercase">Art Status:</span>
                                  <span className={`text-[8px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                                    camp.creativeStatus === "approved" ? "bg-emerald-100 text-emerald-800" :
                                    camp.creativeStatus === "rejected" ? "bg-rose-100 text-rose-800" :
                                    "bg-amber-100 text-amber-800"
                                  }`}>
                                    {camp.creativeStatus || "pending"}
                                  </span>
                                </div>
                                {camp.creativeStatus !== "approved" && (
                                  <div className="flex gap-1 mt-1">
                                    <button
                                      onClick={async () => {
                                        await fetch(`/api/campaigns/${camp.id}`, {
                                          method: "PUT",
                                          headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({ creativeStatus: "approved", creativeApproved: true })
                                        });
                                        fetchData();
                                      }}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-1.5 py-0.5 rounded text-[8px] font-bold transition"
                                    >
                                      Approve Art
                                    </button>
                                    <button
                                      onClick={async () => {
                                        await fetch(`/api/campaigns/${camp.id}`, {
                                          method: "PUT",
                                          headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({ creativeStatus: "rejected", creativeApproved: false })
                                        });
                                        fetchData();
                                      }}
                                      className="bg-rose-600 hover:bg-rose-700 text-white px-1.5 py-0.5 rounded text-[8px] font-bold transition"
                                    >
                                      Reject Art
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* Admin Delete Campaign Button */}
                              <div className="mt-2 flex justify-end">
                                <button
                                  onClick={async () => {
                                    if (confirm(`Are you sure you want to delete the campaign "${camp.title}"?`)) {
                                      const res = await fetch(`/api/campaigns/${camp.id}`, { method: "DELETE" });
                                      if (res.ok) {
                                        fetchData();
                                      }
                                    }
                                  }}
                                  className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded border border-rose-200 transition text-[10px] font-mono flex items-center gap-1"
                                  title="Delete Campaign"
                                >
                                  <Trash2 size={10} /> Delete Campaign
                                </button>
                              </div>
                            </div>
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
              <div className="space-y-4 flex-1 flex flex-col relative">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 flex-wrap gap-2">
                  <div>
                    <h4 className="font-bold text-sm text-[#0B1F4D] uppercase font-mono tracking-wider">Driver Registrations & KYC Vault</h4>
                    <span className="text-xs text-slate-400">Approval links driver to active local campaigns</span>
                  </div>
                  <button
                    onClick={() => {
                      setAdminAddingDriver(true);
                      setAdminDriverFormName("");
                      setAdminDriverFormPhone("");
                      setAdminDriverFormAuto("");
                      setAdminDriverFormLoc("");
                      setAdminDriverFormKyc(false);
                      setAdminDriverFormStatus("pending_approval");
                    }}
                    className="bg-orange-500 hover:bg-orange-600 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm"
                    id="btn-admin-add-driver-trigger"
                  >
                    <Plus size={13} /> Add Driver Partner
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase font-mono">
                        <th className="py-2.5">Driver Info</th>
                        <th className="py-2.5">Auto Plate</th>
                        <th className="py-2.5">Location</th>
                        <th className="py-2.5 text-center">License KYC</th>
                        <th className="py-2.5">Assigned Campaign</th>
                        <th className="py-2.5 text-right">Verification & Actions</th>
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
                          <td className="py-3">
                            {driver.status === "active" ? (
                              <div className="flex items-center gap-1">
                                <select
                                  value={driver.currentCampaignId || ""}
                                  onChange={(e) => handleAllocateCampaign(driver.id, e.target.value || null)}
                                  className="bg-white border border-slate-200 rounded text-[10px] px-1.5 py-1 text-slate-700 font-mono focus:outline-none focus:ring-1 focus:ring-[#0B1F4D] max-w-[150px] truncate"
                                >
                                  <option value="">-- No Campaign --</option>
                                  {campaigns.map((camp) => (
                                    <option key={camp.id} value={camp.id}>
                                      {camp.title} ({camp.city})
                                    </option>
                                  ))}
                                </select>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">Verify first</span>
                            )}
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex flex-col items-end gap-1.5">
                              {/* Verification status controls */}
                              {driver.status === "pending_approval" ? (
                                <div className="flex justify-end gap-1">
                                  <button
                                    onClick={() => handleVerifyDriver(driver.id, true)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-0.5 rounded text-[10px] font-semibold transition flex items-center gap-0.5"
                                  >
                                    <Check size={10} /> Accept
                                  </button>
                                  <button
                                    onClick={() => handleVerifyDriver(driver.id, false)}
                                    className="bg-rose-600 hover:bg-rose-700 text-white px-2 py-0.5 rounded text-[10px] font-semibold transition"
                                  >
                                    Decline
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[9px] font-mono font-bold uppercase text-green-700 bg-green-50 px-1.5 py-0.5 rounded border border-green-150">
                                  {driver.status === "active" ? "ACTIVE CARRIER" : "REJECTED"}
                                </span>
                              )}

                              {/* CRUD action buttons */}
                              <div className="flex items-center gap-1 mt-0.5">
                                <button
                                  onClick={() => {
                                    setAdminEditingDriver(driver);
                                    setAdminDriverFormName(driver.name);
                                    setAdminDriverFormPhone(driver.phone);
                                    setAdminDriverFormAuto(driver.autoNumber);
                                    setAdminDriverFormLoc(driver.location || "Bangalore");
                                    setAdminDriverFormKyc(driver.kycVerified || false);
                                    setAdminDriverFormStatus(driver.status || "pending_approval");
                                  }}
                                  className="text-slate-500 hover:text-[#0B1F4D] p-1 border border-slate-200 hover:border-[#0B1F4D]/40 rounded transition bg-white flex items-center justify-center"
                                  title="Edit Driver Details"
                                  id={`btn-edit-driver-${driver.id}`}
                                >
                                  <Edit size={10} />
                                </button>
                                <button
                                  onClick={() => handleAdminDeleteDriver(driver.id)}
                                  className="text-rose-500 hover:text-rose-700 p-1 border border-slate-200 hover:border-rose-300 rounded transition bg-white flex items-center justify-center"
                                  title="Delete Driver"
                                  id={`btn-delete-driver-${driver.id}`}
                                >
                                  <Trash2 size={10} />
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* ADD DRIVER MODAL OVERLAY */}
                {adminAddingDriver && (
                  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-150">
                      <div className="bg-[#0B1F4D] p-4 text-white flex justify-between items-center">
                        <h4 className="font-display font-bold text-sm tracking-wide uppercase flex items-center gap-1.5">
                          <Plus size={16} className="text-orange-400" /> Register New Driver Partner
                        </h4>
                        <button 
                          onClick={() => setAdminAddingDriver(false)}
                          className="text-slate-400 hover:text-white transition animate-none"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      <form onSubmit={handleAdminAddDriver} className="p-5 space-y-4 text-xs text-slate-700">
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 uppercase font-mono font-bold block">Full Name</label>
                          <input 
                            type="text"
                            required
                            value={adminDriverFormName}
                            onChange={(e) => setAdminDriverFormName(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 focus:border-[#0B1F4D] focus:outline-none text-slate-800"
                            placeholder="e.g. Rajesh Kumar"
                            id="admin-new-driver-name"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 uppercase font-mono font-bold block">Phone Number</label>
                          <input 
                            type="tel"
                            required
                            value={adminDriverFormPhone}
                            onChange={(e) => setAdminDriverFormPhone(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 focus:border-[#0B1F4D] focus:outline-none text-slate-800"
                            placeholder="e.g. 9876543210"
                            id="admin-new-driver-phone"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 uppercase font-mono font-bold block">Auto Plate / Registration Number</label>
                          <input 
                            type="text"
                            required
                            value={adminDriverFormAuto}
                            onChange={(e) => setAdminDriverFormAuto(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 focus:border-[#0B1F4D] focus:outline-none font-mono uppercase text-slate-800"
                            placeholder="e.g. KA-03-EX-4921"
                            id="admin-new-driver-auto"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 uppercase font-mono font-bold block">Operating City / Region</label>
                          <input 
                            type="text"
                            value={adminDriverFormLoc}
                            onChange={(e) => setAdminDriverFormLoc(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 focus:border-[#0B1F4D] focus:outline-none text-slate-800"
                            placeholder="e.g. Bangalore - Indiranagar"
                            id="admin-new-driver-loc"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-1">
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 uppercase font-mono font-bold block">KYC Verification Status</label>
                            <div className="flex items-center gap-2 mt-2">
                              <input 
                                type="checkbox"
                                id="admin-new-driver-kyc"
                                checked={adminDriverFormKyc}
                                onChange={(e) => setAdminDriverFormKyc(e.target.checked)}
                                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                              />
                              <label htmlFor="admin-new-driver-kyc" className="font-semibold text-slate-800 cursor-pointer">Approved (Verified)</label>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 uppercase font-mono font-bold block">Carrier Status</label>
                            <select
                              value={adminDriverFormStatus}
                              onChange={(e) => setAdminDriverFormStatus(e.target.value as any)}
                              className="w-full border border-slate-300 rounded-lg px-2 py-1.5 focus:border-[#0B1F4D] focus:outline-none text-slate-800"
                            >
                              <option value="pending_approval">Pending Approval</option>
                              <option value="active">Active Carrier</option>
                              <option value="rejected">Rejected / Disabled</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-3 border-t border-slate-100">
                          <button 
                            type="button"
                            onClick={() => setAdminAddingDriver(false)}
                            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-xl font-bold transition text-center"
                          >
                            Cancel
                          </button>
                          <button 
                            type="submit"
                            className="flex-1 bg-[#0B1F4D] hover:bg-slate-800 text-white py-2 rounded-xl font-bold transition text-center shadow-md"
                          >
                            Add Partner
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* EDIT DRIVER MODAL OVERLAY */}
                {adminEditingDriver && (
                  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-150">
                      <div className="bg-[#0B1F4D] p-4 text-white flex justify-between items-center">
                        <h4 className="font-display font-bold text-sm tracking-wide uppercase flex items-center gap-1.5">
                          <Edit size={16} className="text-orange-400" /> Edit Driver Profile
                        </h4>
                        <button 
                          onClick={() => setAdminEditingDriver(null)}
                          className="text-slate-400 hover:text-white transition animate-none"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      <form onSubmit={handleAdminSaveEditDriver} className="p-5 space-y-4 text-xs text-slate-700">
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 uppercase font-mono font-bold block">Full Name</label>
                          <input 
                            type="text"
                            required
                            value={adminDriverFormName}
                            onChange={(e) => setAdminDriverFormName(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 focus:border-[#0B1F4D] focus:outline-none text-slate-800"
                            placeholder="e.g. Rajesh Kumar"
                            id="admin-edit-driver-name"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 uppercase font-mono font-bold block">Phone Number</label>
                          <input 
                            type="tel"
                            required
                            value={adminDriverFormPhone}
                            onChange={(e) => setAdminDriverFormPhone(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 focus:border-[#0B1F4D] focus:outline-none text-slate-800"
                            placeholder="e.g. 9876543210"
                            id="admin-edit-driver-phone"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 uppercase font-mono font-bold block">Auto Plate / Registration Number</label>
                          <input 
                            type="text"
                            required
                            value={adminDriverFormAuto}
                            onChange={(e) => setAdminDriverFormAuto(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 focus:border-[#0B1F4D] focus:outline-none font-mono uppercase text-slate-800"
                            placeholder="e.g. KA-03-EX-4921"
                            id="admin-edit-driver-auto"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 uppercase font-mono font-bold block">Operating City / Region</label>
                          <input 
                            type="text"
                            value={adminDriverFormLoc}
                            onChange={(e) => setAdminDriverFormLoc(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 focus:border-[#0B1F4D] focus:outline-none text-slate-800"
                            placeholder="e.g. Bangalore - Indiranagar"
                            id="admin-edit-driver-loc"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-1">
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 uppercase font-mono font-bold block">KYC Verification Status</label>
                            <div className="flex items-center gap-2 mt-2">
                              <input 
                                type="checkbox"
                                id="admin-edit-driver-kyc"
                                checked={adminDriverFormKyc}
                                onChange={(e) => setAdminDriverFormKyc(e.target.checked)}
                                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                              />
                              <label htmlFor="admin-edit-driver-kyc" className="font-semibold text-slate-800 cursor-pointer">Approved (Verified)</label>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 uppercase font-mono font-bold block">Carrier Status</label>
                            <select
                              value={adminDriverFormStatus}
                              onChange={(e) => setAdminDriverFormStatus(e.target.value as any)}
                              className="w-full border border-slate-300 rounded-lg px-2 py-1.5 focus:border-[#0B1F4D] focus:outline-none text-slate-800"
                            >
                              <option value="pending_approval">Pending Approval</option>
                              <option value="active">Active Carrier</option>
                              <option value="rejected">Rejected / Disabled</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-3 border-t border-slate-100">
                          <button 
                            type="button"
                            onClick={() => setAdminEditingDriver(null)}
                            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-xl font-bold transition text-center"
                          >
                            Cancel
                          </button>
                          <button 
                            type="submit"
                            className="flex-1 bg-[#FF9800] hover:bg-orange-500 text-slate-950 py-2 rounded-xl font-bold transition text-center shadow-md"
                          >
                            Save Changes
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
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
                        <img src={p.imageUrl} className="w-16 h-16 rounded-lg object-cover border border-slate-300 shrink-0" alt="" referrerPolicy="no-referrer" />
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

            {/* ADMIN CITIES SUB-TAB */}
            {adminTab === "cities" && (
              <div className="space-y-4 flex-1 flex flex-col">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 flex-wrap gap-2">
                  <div>
                    <h4 className="font-bold text-sm text-[#0B1F4D] uppercase font-mono tracking-wider">Hyperlocal Operating Cities</h4>
                    <span className="text-xs text-slate-400">Configure regional transit rates and active vehicle caps</span>
                  </div>
                  <button
                    onClick={() => setAdminAddingCity(!adminAddingCity)}
                    className="bg-[#10B981] text-white hover:bg-emerald-600 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs"
                  >
                    <Plus size={13} /> Add Operating City
                  </button>
                </div>

                {/* Inline Add City form */}
                {adminAddingCity && (
                  <form onSubmit={handleAddCity} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs text-slate-700">
                    <h5 className="font-bold text-[#0B1F4D] text-xs font-mono uppercase">Provision New Territory</h5>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-500 font-bold uppercase font-mono">City Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Pune"
                          value={adminCityName}
                          onChange={(e) => setAdminCityName(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:border-[#10B981] focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-500 font-bold uppercase font-mono">Hotspot Zones (comma-separated)</label>
                        <input
                          type="text"
                          placeholder="e.g. Koregaon Park, Shivaji Nagar"
                          value={adminCityZone}
                          onChange={(e) => setAdminCityZone(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:border-[#10B981] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-500 font-bold uppercase font-mono">Ad Rate (₹ per Auto / Day)</label>
                        <input
                          type="number"
                          value={adminCityRate}
                          onChange={(e) => setAdminCityRate(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:border-[#10B981] focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-500 font-bold uppercase font-mono">Registered Auto Fleet Cap</label>
                        <input
                          type="number"
                          value={adminCityAutos}
                          onChange={(e) => setAdminCityAutos(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:border-[#10B981] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setAdminAddingCity(false)}
                        className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-[#10B981] hover:bg-emerald-600 text-white rounded-lg font-bold"
                      >
                        Save Territory
                      </button>
                    </div>
                  </form>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cities.map((city: any, idx: number) => (
                    <div key={idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                      <div className="space-y-1.5 text-left">
                        <div className="flex justify-between items-center">
                          <h5 className="font-extrabold text-[#0B1F4D] text-sm">{city.name}</h5>
                          <span className="text-[9px] font-bold font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                            ₹{city.priceRate}/day rate
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono"><b>Target Zones:</b> {city.zones}</p>
                        <p className="text-[10px] text-slate-500 font-mono"><b>Active Auto Capacity:</b> {city.activeAutos} Rickshaws</p>
                      </div>

                      <div className="flex justify-end pt-2 border-t border-slate-100">
                        <button
                          onClick={() => handleDeleteCity(city.name)}
                          className="text-red-500 hover:text-red-600 font-bold font-mono text-[10px] transition"
                        >
                          DELETE TERRITORY
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ADMIN SETTINGS SUB-TAB */}
            {adminTab === "settings" && (
              <div className="space-y-4 flex-1 flex flex-col text-left">
                <div>
                  <h4 className="font-bold text-sm text-[#0B1F4D] uppercase font-mono tracking-wider">Operations & SaaS Integration Gateways</h4>
                  <span className="text-xs text-slate-400">Manage real-world WhatsApp broadcast configurations & SMS alerts</span>
                </div>

                {systemSettingsSuccessMsg && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-bold font-mono">
                    ✓ {systemSettingsSuccessMsg}
                  </div>
                )}

                <form onSubmit={handleSaveSystemSettings} className="space-y-4">
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
                    <h5 className="font-bold text-slate-800 text-xs flex items-center gap-1">
                      🟢 WhatsApp Business API Integration
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 uppercase font-mono font-bold block">WhatsApp Cloud Access Token</label>
                        <input
                          type="password"
                          value={systemWhatsAppToken}
                          onChange={(e) => setSystemWhatsAppToken(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#10B981]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 uppercase font-mono font-bold block">Phone Number ID</label>
                        <input
                          type="text"
                          value={systemWhatsAppPhoneId}
                          onChange={(e) => setSystemWhatsAppPhoneId(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#10B981]"
                        />
                      </div>
                    </div>
                    <p className="text-[9px] text-slate-400 italic font-mono leading-none">
                      Sends automated campaigns activation & driver payment receipt alerts via WhatsApp Cloud APIs.
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
                    <h5 className="font-bold text-slate-800 text-xs flex items-center gap-1">
                      📱 SMS Alert & OTP Gateway (Twilio/Kookoo)
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 uppercase font-mono font-bold block">Gateway API Key</label>
                        <input
                          type="password"
                          value={systemSmsApiKey}
                          onChange={(e) => setSystemSmsApiKey(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#10B981]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 uppercase font-mono font-bold block">SMS Sender Header (Sender ID)</label>
                        <input
                          type="text"
                          value={systemSmsSenderId}
                          onChange={(e) => setSystemSmsSenderId(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#10B981]"
                        />
                      </div>
                    </div>
                    <p className="text-[9px] text-slate-400 italic font-mono leading-none">
                      Provides transaction validation OTPs and onboarding text confirmation receipts directly to rickshaw drivers.
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#10B981] hover:bg-emerald-600 text-white font-bold font-mono text-xs rounded-xl transition shadow-xs uppercase"
                  >
                    💾 Save & Verify Gateway Connections
                  </button>
                </form>
              </div>
            )}

          </div>

              </div>

              {/* Right Column of nested grid: Map & Operational Activity Logs (col-span-5) */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                
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
          )}

          {/* ========================================================= */}
          {/* ADVERTISER COMPANION PANEL (60% Width)                   */}
          {/* ========================================================= */}
          {userSession === "advertiser" && (
            <div className="space-y-6">
              {/* Campaign Calculator */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                  <div className="p-2 bg-orange-500/10 text-[#FF9800] rounded-xl">
                    <TrendingUp size={18} />
                  </div>
                  <div>
                    <h4 className="font-display font-extrabold text-[#0B1F4D] text-sm">Campaign Saturation & Reach Planner</h4>
                    <p className="text-[11px] text-slate-500">Calculate budget, impressions, and target QR conversions</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span>Vehicles Allocated</span>
                        <span className="text-[#FF9800] font-mono">{calcVehicles} Autos</span>
                      </div>
                      <input 
                        type="range" 
                        min="5" 
                        max="150" 
                        value={calcVehicles}
                        onChange={(e) => setCalcVehicles(Number(e.target.value))}
                        className="w-full accent-[#FF9800] h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span>Campaign Duration</span>
                        <span className="text-[#FF9800] font-mono">{calcDays} Days</span>
                      </div>
                      <input 
                        type="range" 
                        min="7" 
                        max="180" 
                        value={calcDays}
                        onChange={(e) => setCalcDays(Number(e.target.value))}
                        className="w-full accent-[#FF9800] h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 grid grid-cols-2 gap-3 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-mono font-bold">Est. Cost (INR)</span>
                      <span className="text-sm font-extrabold text-[#0B1F4D] font-mono">₹{(calcVehicles * calcDays * 250).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-mono font-bold">Est. Views (CPM)</span>
                      <span className="text-sm font-extrabold text-[#0B1F4D] font-mono">{(calcVehicles * calcDays * 4200).toLocaleString()}+</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-mono font-bold">CPM Rate</span>
                      <span className="text-sm font-extrabold text-[#0B1F4D] font-mono">₹59.52</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-mono font-bold">Est. QR Scans</span>
                      <span className="text-sm font-extrabold text-[#FF9800] font-mono">{Math.floor(calcVehicles * calcDays * 0.95)} Scans</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* City Zone Heatmap */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <div>
                  <h4 className="font-display font-extrabold text-sm text-[#0B1F4D]">Bangalore Density Performance</h4>
                  <p className="text-[11px] text-slate-400">Daily average impressions coverage yield per administrative ward</p>
                </div>
                <div className="space-y-3">
                  {[
                    { name: "Koramangala (High Saturation)", value: 92, count: "48,000 views/day" },
                    { name: "Indiranagar (Retail Hub)", value: 85, count: "44,500 views/day" },
                    { name: "Whitefield (Tech Hub)", value: 78, count: "39,000 views/day" },
                    { name: "MG Road (Central CBD)", value: 65, count: "31,000 views/day" },
                  ].map((zone, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-700">{zone.name}</span>
                        <span className="text-slate-500 font-mono text-[10px]">{zone.count}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#FF9800] rounded-full" style={{ width: `${zone.value}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Embedded AI Campaign Planner */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden h-[480px]">
                <AiAssistant embedded />
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* DRIVER COMPANION PANEL (60% Width)                     */}
          {/* ========================================================= */}
          {userSession === "driver" && (
            <div className="space-y-6">
              {/* Guidelines checklist */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <div>
                  <h4 className="font-display font-extrabold text-sm text-[#0B1F4D]">Driver Guidelines & Active Duties</h4>
                  <p className="text-[11px] text-slate-400">Complete checks to unlock standard incentives and daily streak levels</p>
                </div>
                <div className="space-y-3 text-xs text-slate-700">
                  <div className="flex items-start gap-3">
                    <input type="checkbox" defaultChecked className="mt-0.5 rounded text-teal-500" />
                    <div>
                      <span className="font-bold text-slate-800 block">Morning Photo Proof Check-in</span>
                      <span className="text-slate-500 text-[11px]">Upload vehicle rear photograph before 9:30 AM to activate daily meter (Earn ₹450 reward).</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <input type="checkbox" defaultChecked className="mt-0.5 rounded text-teal-500" />
                    <div>
                      <span className="font-bold text-slate-800 block">Maintain Active GPS Meter</span>
                      <span className="text-slate-500 text-[11px]">Keep phone mounted securely and tracker toggled "ON" during passenger duty.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Driver support helpline */}
              <div className="bg-slate-900 text-white p-5 rounded-3xl border border-slate-800 shadow-xs space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-display font-extrabold text-sm text-white">Logistics Support Desk</h4>
                    <p className="text-[10px] text-slate-400 font-mono">Emergency physical Hub manager contacts</p>
                  </div>
                  <span className="px-2.5 py-0.5 bg-green-500/20 text-green-400 rounded text-[10px] font-mono">ONLINE</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Need hardware assistance or replacement banners? Visit the Koramangala Hub or call +91 94812-48210.
                </p>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* HELP CENTER & FAQ MODAL OVERLAY (Q&A System)            */}
          {/* ========================================================= */}
          {renderHelpModal()}

        </div>
      </div>
    </div>
  );
}
