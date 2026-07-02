import React, { useState, useEffect, useRef } from "react";
// @ts-ignore
import jsQR from "jsqr";
import { 
  Campaign, 
  Driver, 
  Proof, 
  WalletTransaction, 
  NotificationItem, 
  UserRole,
  Bill
} from "./types";
import { 
  Plus, Search, MapPin, Calendar, DollarSign, CheckCircle, 
  Clock, Timer, AlertCircle, X, ChevronRight, Image as ImageIcon, 
  FileText, Wallet, Bell, User, Map, Settings, Send, Edit, Save, 
  Smartphone, Shield, Check, RotateCcw, Camera, HelpCircle, 
  TrendingUp, Award, Navigation, RefreshCw, Eye, ThumbsUp, 
  ThumbsDown, Sparkles, MessageSquare, Activity, ShieldAlert,
  Sun, Moon, Upload, Trash2, Layers, QrCode, Rocket, Truck, Building
} from "lucide-react";
import AiAssistant from "./components/AiAssistant";
import LegalModal from "./components/LegalModal";
import RouteMap from "./components/RouteMap";
import { exportCampaignPDF } from "./components/CampaignPDF";

export default function App() {
  // Simulator state
  const [activeSimulator, setActiveSimulator] = useState<"advertiser" | "driver">("advertiser");

  // User Authentication and Portal isolation state
  const [userSession, setUserSession] = useState<"advertiser" | "driver" | "admin" | null>(null);
  const [loggedInDriverId, setLoggedInDriverId] = useState<string>("driver_delip");
  const [landingSection, setLandingSection] = useState<"hero" | "register-campaign" | "register-driver" | "login">("hero");
  const [heroBgVisibility, setHeroBgVisibility] = useState<"none" | "light" | "medium" | "full">("light");
  const [campaignSuccessMsg, setCampaignSuccessMsg] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginPhone, setLoginPhone] = useState("");
  const [loginOtp, setLoginOtp] = useState("");
  const [loginError, setLoginError] = useState("");
  const [activeLoginSubTab, setActiveLoginSubTab] = useState<"advertiser" | "driver" | "admin">("advertiser");

  // Advertiser multi-tenant auth
  const [advUserId, setAdvUserId] = useState<number | null>(() => {
    const s = localStorage.getItem("autoadz_adv_user_id");
    return s ? Number(s) : null;
  });
  const [advJwt, setAdvJwt] = useState<string>(() => localStorage.getItem("autoadz_adv_jwt") || "");
  const [advEmail, setAdvEmail] = useState(() => localStorage.getItem("autoadz_adv_email") || "");
  const [showAdvRegister, setShowAdvRegister] = useState(false);
  const [regName, setRegName] = useState("");
  const [regCompany, setRegCompany] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regGstin, setRegGstin] = useState("");
  const [regLoading, setRegLoading] = useState(false);

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
  const [simulatedKmsToday, setSimulatedKmsToday] = useState<number>(0.0);
  const [simulatedKmsTotal, setSimulatedKmsTotal] = useState<number>(0);
  const [isSimulatingDrive, setIsSimulatingDrive] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [faqSearchQuery, setFaqSearchQuery] = useState("");
  const [faqActiveTab, setFaqActiveTab] = useState<"All" | "Advertisers" | "Drivers" | "General">("All");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // QR Verification Modal Overlay
  const renderQrModal = () => {
    if (!isQrModalOpen || !selectedCampaignForQr) return null;

    return (
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
        <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <div>
              <span className="text-[8px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded uppercase font-mono">
                QR Verification
              </span>
              <h4 className="font-bold text-xs text-[#0B1F4D] mt-1 line-clamp-1">
                Verify: {selectedCampaignForQr.title}
              </h4>
            </div>
            <button
              onClick={() => setIsQrModalOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-50 transition cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Verification Results Status */}
          {qrVerificationStatus !== "idle" && (
            <div className={`p-3 rounded-xl border text-xs space-y-2 ${
              qrVerificationStatus === "success" 
                ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                : "bg-red-50 border-red-200 text-red-800"
            }`}>
              <div className="flex items-center gap-2">
                {qrVerificationStatus === "success" ? (
                  <CheckCircle size={14} className="text-emerald-600 animate-bounce" />
                ) : (
                  <AlertCircle size={14} className="text-red-600 animate-pulse" />
                )}
                <span className="font-bold uppercase tracking-wide text-[10px]">
                  {qrVerificationStatus === "success" ? "Verification Passed" : "Verification Failed"}
                </span>
              </div>
              <p className="text-[10px] leading-relaxed">{qrFeedbackMessage}</p>
              {qrVerificationStatus === "success" && (
                <p className="text-[9px] text-emerald-600 font-mono italic">
                  +1 verified scan successfully logged in analytics database.
                </p>
              )}
              <button
                onClick={() => {
                  setQrScannedResult(null);
                  setQrVerificationStatus("idle");
                  setQrFeedbackMessage("");
                  setQrSimulatedInput("");
                }}
                className={`w-full py-1 rounded text-[10px] font-bold uppercase transition ${
                  qrVerificationStatus === "success"
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "bg-red-600 text-white hover:bg-red-700"
                }`}
              >
                Scan Again
              </button>
            </div>
          )}

          {/* Live Camera Scanner Box */}
          {qrVerificationStatus === "idle" && (
            <div className="space-y-3">
              <div className="relative aspect-square w-full max-w-[240px] mx-auto bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-inner">
                {/* Live video feed */}
                <video
                  ref={qrVideoRef}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />
                
                {/* Canvas used for frame capturing (hidden) */}
                <canvas ref={qrCanvasRef} className="hidden" />

                {/* Aesthetic Scanning Laser overlay */}
                <div className="absolute inset-0 border-2 border-dashed border-emerald-500/40 rounded-2xl pointer-events-none">
                  <div className="absolute top-1/2 left-4 right-4 h-[2px] bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
                </div>

                {/* Subtitle inside video overlay */}
                <div className="absolute bottom-2 inset-x-0 text-center">
                  <span className="bg-slate-950/85 text-white text-[8px] font-mono tracking-wider px-2 py-0.5 rounded uppercase">
                    📡 Point at Sticker QR Code
                  </span>
                </div>
              </div>

              <p className="text-[9px] text-center text-slate-400">
                Hold device steady. Scanning resolves instantly once QR code contains exact match <b>{selectedCampaignForQr.id}</b>.
              </p>
            </div>
          )}

          {/* Sandbox Scanner Input Simulator */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-150 space-y-2">
            <span className="text-[9px] font-bold text-slate-500 block uppercase font-mono tracking-wider">
              🛠️ Sandbox Scan Simulator
            </span>
            <p className="text-[9px] text-slate-400 leading-tight">
              Using desktop or missing physical stickers? Enter the Campaign ID (<b>{selectedCampaignForQr.id}</b>) to mock scan verification.
            </p>
            <div className="flex gap-1.5">
              <input
                type="text"
                placeholder={`Try entering "${selectedCampaignForQr.id}"`}
                value={qrSimulatedInput}
                onChange={(e) => setQrSimulatedInput(e.target.value)}
                className="flex-1 bg-white border border-slate-200 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-[#0B1F4D]"
              />
              <button
                onClick={handleSimulatedQrVerify}
                className="bg-[#0B1F4D] text-white text-[10px] font-bold px-2.5 py-1 rounded transition-colors hover:bg-slate-800"
              >
                Mock Verify
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

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
                +91 98361-30393 <span className="text-slate-400 font-normal">| apex7tech@gmail.com</span>
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
    const saved = localStorage.getItem("autoadz-dark-mode");
    return saved === "true"; // Default to light mode
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
  const [bills, setBills] = useState<Bill[]>([]);
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
  // Per-driver live positions for advertiser map — keyed by driver id
  const [driverPositions, setDriverPositions] = useState<Record<string, { lat: number; lng: number; name: string; autoNumber: string; state: string }>>({});

  // Refs for background persistent tracking
  const wasTrackingRef = useRef(false);
  const previousStateRef = useRef<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastCoordsRef = useRef<{ lat: number; lng: number; timestamp: number } | null>(null);
  const lastLocationSentRef = useRef<number>(0);
  const qrVideoRef = useRef<HTMLVideoElement | null>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

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

  // Helper to generate deterministic fleet details for a campaign so that the distance is fully accounted for and verifiable!
  const getFleetForCampaign = (camp: Campaign) => {
    // 1. Get actual real drivers assigned to this campaign
    const realDrivers = drivers.filter(d => d.currentCampaignId === camp.id);
    
    // 2. Generate deterministic mock fleet vehicles for the remainder of camp.autosCount
    const totalToGenerate = Math.max(0, camp.autosCount - realDrivers.length);
    const fleet: Array<{
      id: string;
      name: string;
      autoNumber: string;
      kms: number;
      scans: number;
      status: "tracking" | "online" | "offline";
      lastSync: string;
      location: string;
    }> = [];

    // Add the real drivers first
    realDrivers.forEach(d => {
      // Distribute a portion of campaign's total KMs and Scans to the real drivers
      const driverShareKms = camp.kmsCovered > 0 ? parseFloat((camp.kmsCovered * 0.15).toFixed(2)) : 0;
      const driverShareScans = camp.qrScans > 0 ? Math.floor(camp.qrScans * 0.15) : 0;
      
      fleet.push({
        id: d.id,
        name: d.name,
        autoNumber: d.autoNumber,
        kms: d.state === "tracking" ? parseFloat(((d.currentSessionKms || 0) + driverShareKms).toFixed(2)) : driverShareKms,
        scans: driverShareScans,
        status: d.state as "tracking" | "online" | "offline",
        lastSync: "Just now",
        location: d.location || `${camp.city} - Central`
      });
    });

    // Now fill the remainder with stable, named mock drivers
    const firstNames = ["Rajesh", "Subir", "Amit", "Sanjay", "Anil", "Vikram", "Gautam", "Rahul", "Pradeep", "Vijay", "Manoj", "Kiran", "Deepak", "Ravi"];
    const lastNames = ["Kumar", "Das", "Shaw", "Sen", "Sharma", "Prasad", "Patel", "Singh", "Nair", "Mehta", "Joshi", "Roy", "Verma"];
    const selectedState = camp.city === "Kolkata" ? "WB" : camp.city === "Bangalore" ? "KA" : camp.city === "Mumbai" ? "MH" : "DL";

    // Seed deterministic pseudo-random generator
    let seed = 0;
    for (let i = 0; i < camp.id.length; i++) {
      seed += camp.id.charCodeAt(i);
    }

    const random = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    // Calculate the remaining distance and scans to distribute among mock drivers
    const allocatedKms = fleet.reduce((sum, f) => sum + f.kms, 0);
    const allocatedScans = fleet.reduce((sum, f) => sum + f.scans, 0);
    let remainingKms = Math.max(0, camp.kmsCovered - allocatedKms);
    let remainingScans = Math.max(0, camp.qrScans - allocatedScans);

    const numMock = Math.min(totalToGenerate, 10); // show up to 10 fleet details for layout sanity
    
    for (let i = 0; i < numMock; i++) {
      const isLast = i === numMock - 1;
      let driverKms = 0;
      let driverScans = 0;

      if (isLast) {
        driverKms = parseFloat(remainingKms.toFixed(2));
        driverScans = remainingScans;
      } else {
        const pct = (0.4 + random() * 0.4) / (numMock - i);
        driverKms = parseFloat((remainingKms * pct).toFixed(2));
        driverScans = Math.floor(remainingScans * pct);
        remainingKms -= driverKms;
        remainingScans -= driverScans;
      }

      const fName = firstNames[Math.floor(random() * firstNames.length)];
      const lName = lastNames[Math.floor(random() * lastNames.length)];
      const code1 = Math.floor(10 + random() * 89);
      const code2 = ["AX", "BJ", "CG", "EX", "FT", "HZ", "DK", "MY"][Math.floor(random() * 8)];
      const code3 = Math.floor(1000 + random() * 8999);
      const plate = `${selectedState}-${code1}-${code2}-${code3}`;
      
      const randStatus = random() > 0.4 ? "tracking" : (random() > 0.5 ? "online" : "offline");
      const lastSyncMins = Math.floor(random() * 15) + 1;

      fleet.push({
        id: `fleet_mock_${camp.id}_${i}`,
        name: `${fName} ${lName}`,
        autoNumber: plate,
        kms: driverKms,
        scans: driverScans,
        status: camp.status === "active" ? randStatus as "tracking" | "online" | "offline" : "offline" as const,
        lastSync: randStatus === "tracking" ? "Just now" : `${lastSyncMins}m ago`,
        location: `${camp.city} - Ward ${Math.floor(1 + random() * 190)}`
      });
    }

    return fleet;
  };

  // Persist tracking mode choice
  useEffect(() => {
    localStorage.setItem("autoadz_tracking_mode", trackingMode);
  }, [trackingMode]);

  // Main Tracking and Sync Engine
  useEffect(() => {
    const activeDriver = drivers.find(d => d.id === loggedInDriverId);
    if (!activeDriver) return;

    const prevDriverState = previousStateRef.current;
    previousStateRef.current = activeDriver.state;

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
              if (loggedInDriver) {
                setDriverPositions(prev => ({ ...prev, [loggedInDriver.id]: { ...prev[loggedInDriver.id], lat: latitude, lng: longitude, state: "tracking" } }));
                // Push real GPS to server every 10s so advertiser map updates
                const nowMs = Date.now();
                if (nowMs - lastLocationSentRef.current > 10000) {
                  lastLocationSentRef.current = nowMs;
                  fetch(`/api/drivers/${loggedInDriver.id}/location`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ lat: latitude, lng: longitude }),
                  }).catch(() => {});
                }
              }

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

                    const finalEarnings = parseFloat((bgDistance * driverRatePerKm).toFixed(2));
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
      // ONLY process the payout if the previous state of the driver was actually "tracking" (prevents race condition restarts from triggering payout)
      if (prevDriverState === "tracking" && wasTrackingRef.current) {
        wasTrackingRef.current = false;
        
        const savedKmsStr = localStorage.getItem("autoadz_live_session_kms");
        const finalKms = savedKmsStr ? parseFloat(savedKmsStr) : liveSessionKms;
        const finalEarnings = parseFloat((finalKms * driverRatePerKm).toFixed(2));

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
  const [advertiserTab, setAdvertiserTab] = useState<"home" | "campaigns" | "tracking" | "profile" | "billing">("home");
  const [expandedFleetCampaignId, setExpandedFleetCampaignId] = useState<string | null>(null);
  const [driverTab, setDriverTab] = useState<"dashboard" | "proof" | "tracker" | "earnings" | "profile">("dashboard");
  const [adminTab, setAdminTab] = useState<"campaigns" | "drivers" | "proofs" | "analytics" | "cities" | "settings" | "finance_crm" | "advertisers">("campaigns");
  const [advertisers, setAdvertisers] = useState<any[]>([]);

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
  const [systemAdminWhatsAppPhone, setSystemAdminWhatsAppPhone] = useState(() => localStorage.getItem("sys_admin_whatsapp_phone") || "9836130393");
  const [systemSmsApiKey, setSystemSmsApiKey] = useState(() => localStorage.getItem("sys_sms_api_key") || "api_key_84a92f029a1b8c73");
  const [systemSmsSenderId, setSystemSmsSenderId] = useState(() => localStorage.getItem("sys_sms_sender_id") || "AUTADZ");
  const [systemSettingsSuccessMsg, setSystemSettingsSuccessMsg] = useState("");

  // Admin Raise Invoice Form States
  const [selectedCampIdForInvoice, setSelectedCampIdForInvoice] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [invoiceKms, setInvoiceKms] = useState("");
  const [invoiceDesc, setInvoiceDesc] = useState("");
  const [invoicePeriodStart, setInvoicePeriodStart] = useState("");
  const [invoicePeriodEnd, setInvoicePeriodEnd] = useState("");
  const [financeSubTab, setFinanceSubTab] = useState<"overview" | "advertiser_bills" | "driver_bills" | "ledger" | "scheduler">("overview");

  // Scheduler States
  const [schedulerEnabled, setSchedulerEnabled] = useState(true);
  const [schedulerThreshold, setSchedulerThreshold] = useState(10);
  const [driverRatePerKm, setDriverRatePerKm] = useState<number>(4.5);
  const [schedulerLogs, setSchedulerLogs] = useState<Array<{ timestamp: string; status: string; message: string }>>([]);
  const [schedulerLastRun, setSchedulerLastRun] = useState("");
  const [schedulerRunStatus, setSchedulerRunStatus] = useState("");

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

  // Driver QR Verification Modal State
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [selectedCampaignForQr, setSelectedCampaignForQr] = useState<Campaign | null>(null);
  const [qrScannedResult, setQrScannedResult] = useState<string | null>(null);
  const [qrVerificationStatus, setQrVerificationStatus] = useState<"idle" | "success" | "error">("idle");
  const [qrFeedbackMessage, setQrFeedbackMessage] = useState("");
  const [qrSimulatedInput, setQrSimulatedInput] = useState("");

  // Wallet State
  const [addFundsAmount, setAddFundsAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [walletSuccessMsg, setWalletSuccessMsg] = useState("");

  // Legal & Regulatory Modal State
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<"privacy" | "terms" | "support" | "deletion">("privacy");

  const renderGlobalFooter = () => {
    return (
      <footer className="w-full border-t border-slate-200 bg-white dark:bg-slate-950 dark:border-slate-800 py-8 px-6 text-xs text-slate-500 font-mono z-10 shrink-0 mt-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          
          {/* Column 1: Operator Details */}
          <div className="space-y-2">
            <h5 className="font-display font-extrabold text-[#0B1F4D] dark:text-[#FF9800] text-xs tracking-wider uppercase">
              OPERATED & DEVELOPED BY
            </h5>
            <p className="text-[11px] leading-relaxed dark:text-slate-400">
              <b>M/s Deinrim Solutionss (P) ltd.</b><br />
              Kolkata, West Bengal (WB), India<br />
              Corporate Contact: <span className="font-bold text-slate-800 dark:text-white">+91 98361-30393</span>
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              AutoAdz Secure Multi-Tenant Framework v3.1 • Dynamic telemetry data synced live with backend database nodes.
            </p>
          </div>

          {/* Column 2: Regulatory & Developer Consoles Links */}
          <div className="space-y-2">
            <h5 className="font-display font-extrabold text-[#0B1F4D] dark:text-[#FF9800] text-xs tracking-wider uppercase">
              REGULATORY COMPLIANCE
            </h5>
            <p className="text-[10.5px] leading-relaxed text-slate-400 dark:text-slate-500 font-sans">
              Important public links required to verify and publish the <b>AutoAdz</b> platform on the Google Play Console and Apple App Store Developer Tools:
            </p>
            <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[11px] font-semibold">
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0B1F4D] hover:text-[#FF9800] dark:text-slate-300 dark:hover:text-[#FF9800] underline transition cursor-pointer"
              >
                Privacy Policy
              </a>
              <span className="text-slate-300">|</span>
              <a
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0B1F4D] hover:text-[#FF9800] dark:text-slate-300 dark:hover:text-[#FF9800] underline transition cursor-pointer"
              >
                Terms of Service
              </a>
              <span className="text-slate-300">|</span>
              <a
                href="/support"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0B1F4D] hover:text-[#FF9800] dark:text-slate-300 dark:hover:text-[#FF9800] underline transition cursor-pointer"
              >
                App Support Page
              </a>
              <span className="text-slate-300">|</span>
              <a
                href="/deletion"
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 underline transition cursor-pointer"
              >
                Data Deletion request
              </a>
            </div>
          </div>

          {/* Column 3: Platform Ecosystem */}
          <div className="space-y-2">
            <h5 className="font-display font-extrabold text-[#0B1F4D] dark:text-[#FF9800] text-xs tracking-wider uppercase">
              PLATFORM VERIFICATIONS
            </h5>
            <p className="text-[11px] leading-relaxed dark:text-slate-400">
              • Background location is monitored exclusively during metered drives to secure accurate driver payout logs.<br />
              • Camera permissions are strictly utilized for physical advertisement audit proof uploads. All data is processed via secure 256-bit TLS encryption.
            </p>
          </div>
          
        </div>
      </footer>
    );
  };

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
    const safeFetchJson = async <T,>(url: string, fallback: T): Promise<T> => {
      try {
        const res = await fetch(url);
        if (!res.ok) {
          console.warn(`Fetch to ${url} returned status ${res.status}`);
          return fallback;
        }
        return await res.json() as T;
      } catch (err) {
        console.error(`Error fetching from ${url}:`, err);
        return fallback;
      }
    };

    try {
      const advId = localStorage.getItem("autoadz_adv_user_id");
      const campUrl = advId ? `/api/campaigns?advertiser_id=${advId}` : "/api/campaigns";
      const [dataCamps, dataDrivers, dataProofs, dataTxs, dataNotifs, dataCities, dataBills] = await Promise.all([
        safeFetchJson<any[]>(campUrl, []),
        safeFetchJson<any[]>("/api/drivers", []),
        safeFetchJson<any[]>("/api/proofs", []),
        safeFetchJson<any[]>("/api/wallet/transactions", []),
        safeFetchJson<any[]>("/api/notifications", []),
        safeFetchJson<any[]>("/api/cities", []),
        safeFetchJson<any[]>("/api/bills", []),
      ]);

      setCampaigns(dataCamps);
      setDrivers(dataDrivers);
      setProofs(dataProofs);
      // Seed per-driver Kolkata positions for map display
      const KOLKATA_CENTER = { lat: 22.5726, lng: 88.3639 };
      const KOL_ZONES = [
        { lat: 22.5958, lng: 88.3697 }, // Shyambazar
        { lat: 22.5195, lng: 88.3617 }, // Gariahat
        { lat: 22.5697, lng: 88.4308 }, // Salt Lake
        { lat: 22.6238, lng: 88.4338 }, // New Town
        { lat: 22.5852, lng: 88.3423 }, // Howrah Bridge
        { lat: 22.5514, lng: 88.3473 }, // Park Street
      ];
      setDriverPositions(prev => {
        const next = { ...prev };
        dataDrivers.forEach((d: any, i: number) => {
          if (!next[d.id]) {
            const base = KOL_ZONES[i % KOL_ZONES.length];
            next[d.id] = {
              lat: base.lat + (Math.random() - 0.5) * 0.008,
              lng: base.lng + (Math.random() - 0.5) * 0.008,
              name: d.name,
              autoNumber: d.autoNumber,
              state: d.state || "standby",
            };
          } else {
            next[d.id] = { ...next[d.id], name: d.name, autoNumber: d.autoNumber, state: d.state || "standby" };
          }
        });
        return next;
      });
      setTransactions(dataTxs);
      setNotifications(dataNotifs);
      setCities(dataCities);
      setBills(dataBills);

      try {
        const resScheduler = await fetch("/api/scheduler/settings");
        if (resScheduler.ok) {
          const schedulerData = await resScheduler.json();
          setSchedulerEnabled(schedulerData.enabled);
          setSchedulerThreshold(schedulerData.mileageThreshold);
          setDriverRatePerKm(schedulerData.driverRatePerKm !== undefined ? schedulerData.driverRatePerKm : 4.5);
          setSchedulerLogs(schedulerData.logs || []);
          setSchedulerLastRun(schedulerData.lastRunTimestamp || "Never");
        }
      } catch (err) {
        console.error("Error fetching scheduler settings", err);
      }
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

  // Fetch advertisers list when admin opens advertisers tab
  useEffect(() => {
    if (userSession !== "admin" || adminTab !== "advertisers") return;
    fetch("/api/advertisers").then(r => r.json()).then(data => { if (Array.isArray(data)) setAdvertisers(data); }).catch(() => {});
  }, [userSession, adminTab]);

  // Advertiser live tracking — poll server GPS positions every 8s
  useEffect(() => {
    if (userSession !== "advertiser" || advertiserTab !== "tracking") return;
    const pollLiveLocations = async () => {
      try {
        const campIds = campaigns.filter(c => c.status === "active").map(c => c.id);
        if (campIds.length === 0) return;
        const res = await fetch(`/api/drivers/live-locations?campaign_ids=${campIds.join(",")}`);
        if (!res.ok) return;
        const liveDrivers: any[] = await res.json();
        if (liveDrivers.length > 0) {
          setDriverPositions(prev => {
            const next = { ...prev };
            liveDrivers.forEach(d => {
              if (d.lat && d.lng) {
                next[d.id] = { ...next[d.id], lat: d.lat, lng: d.lng, name: d.name, autoNumber: d.autoNumber, state: d.state };
              }
            });
            return next;
          });
        }
      } catch {}
    };
    pollLiveLocations();
    const interval = setInterval(pollLiveLocations, 8000);
    return () => clearInterval(interval);
  }, [userSession, advertiserTab, campaigns]);

  // Post campaign
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newCampTitle,
          client: newCampClient || advBrandName || "My Brand Ltd",
          city: newCampCity,
          area: newCampArea || "Koramangala & HSR",
          budget: newCampBudget,
          autosCount: newCampAutos,
          creativeUrl: newCampCreative || creativeTemplates[0].url,
          advertiser_id: advUserId || null,
        })
      });

      if (response.ok) {
        setShowCreateCampaign(false);
        setCampaignSuccessMsg(`Campaign "${newCampTitle || 'New Campaign'}" registered successfully with ${newCampAutos} autos! Track it via the Brand/Advertiser Portal.`);
        
        // Trigger WhatsApp notification to Admin immediately for approval
        const adminMsg = `📢 *AutoAdz: New Campaign Registered!*\n\n*Campaign:* ${newCampTitle || 'New Campaign'}\n*Client:* ${newCampClient || "My Brand Ltd"}\n*City:* ${newCampCity}\n*Area:* ${newCampArea || "Koramangala & HSR"}\n*Budget:* ₹${Number(newCampBudget).toLocaleString()}\n*Autos Required:* ${newCampAutos}\n\nPlease review and approve this campaign in the Admin Panel immediately.`;
        sendWhatsAppNotification(adminMsg);

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
        
        // Trigger WhatsApp notification to Admin immediately for approval
        const adminMsg = `🚨 *AutoAdz: New Driver Registered!*\n\n*Name:* ${driverRegName}\n*Phone:* ${driverRegPhone}\n*Vehicle Number:* ${driverRegAutoNum || "KA-03-AA-9999"}\n*Location:* ${driverRegLoc || "Bangalore South"}\n\nPlease review and approve this driver in the Admin Panel immediately.`;
        sendWhatsAppNotification(adminMsg);

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
  const handleSaveSystemSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("sys_whatsapp_token", systemWhatsAppToken);
    localStorage.setItem("sys_whatsapp_phone_id", systemWhatsAppPhoneId);
    localStorage.setItem("sys_admin_whatsapp_phone", systemAdminWhatsAppPhone);
    localStorage.setItem("sys_sms_api_key", systemSmsApiKey);
    localStorage.setItem("sys_sms_sender_id", systemSmsSenderId);

    try {
      await fetch("/api/scheduler/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          mileageThreshold: schedulerThreshold,
          driverRatePerKm: driverRatePerKm 
        })
      });
    } catch (err) {
      console.error("Failed to sync rate settings to server", err);
    }

    setSystemSettingsSuccessMsg("SaaS Integration API gateway credentials & Driver Payout Rates successfully saved!");
    setTimeout(() => setSystemSettingsSuccessMsg(""), 5000);
  };

  // WhatsApp notification helper
  const sendWhatsAppNotification = async (message: string) => {
    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          token: systemWhatsAppToken,
          phoneId: systemWhatsAppPhoneId,
          recipient: systemAdminWhatsAppPhone,
          message
        })
      });
      const data = await res.json();
      if (!res.ok) {
        console.warn("WhatsApp notification failed:", data.error || data);
      } else {
        console.log("WhatsApp notification sent!", data);
      }
    } catch (err) {
      console.error("Failed to send WhatsApp notification:", err);
    }
  };

  // Handle QR code scanning detection
  const handleQrCodeDetected = (scannedData: string) => {
    if (!scannedData) return;
    setQrScannedResult(scannedData);
    if (selectedCampaignForQr) {
      if (scannedData.trim() === selectedCampaignForQr.id.trim()) {
        setQrVerificationStatus("success");
        setQrFeedbackMessage(`✓ Perfect Match! Scanned code matches campaign ID: "${selectedCampaignForQr.id}".`);
        
        // Let's increment the qrScans in the database so that it's a real live update
        fetch(`/api/campaigns/${selectedCampaignForQr.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ qrScans: (selectedCampaignForQr.qrScans || 0) + 1 })
        }).then(() => {
          fetchData(); // refresh app state
        }).catch(err => console.error(err));
        
      } else {
        setQrVerificationStatus("error");
        setQrFeedbackMessage(`✗ Verification Failed! Scanned QR value: "${scannedData}" does not match Campaign ID: "${selectedCampaignForQr.id}".`);
      }
    }
  };

  // Triggered when manual/simulated QR input is verified
  const handleSimulatedQrVerify = () => {
    if (!qrSimulatedInput) {
      alert("Please enter a simulated QR code value first.");
      return;
    }
    handleQrCodeDetected(qrSimulatedInput);
  };

  // QR Code camera stream effect
  useEffect(() => {
    if (!isQrModalOpen) return;
    
    let animationFrameId: number;
    let activeStream: MediaStream | null = null;
    
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }
        });
        activeStream = stream;
        if (qrVideoRef.current) {
          qrVideoRef.current.srcObject = stream;
          qrVideoRef.current.setAttribute("playsinline", "true");
          qrVideoRef.current.play().catch(err => console.warn("Video play interrupted:", err));
        }
        
        const tick = () => {
          if (qrVideoRef.current && qrVideoRef.current.readyState === qrVideoRef.current.HAVE_ENOUGH_DATA) {
            const canvas = qrCanvasRef.current || document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            if (ctx) {
              canvas.width = qrVideoRef.current.videoWidth;
              canvas.height = qrVideoRef.current.videoHeight;
              ctx.drawImage(qrVideoRef.current, 0, 0, canvas.width, canvas.height);
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              
              // Call jsQR to detect QR code from the frame
              const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
              });
              
              if (code) {
                handleQrCodeDetected(code.data);
                return; // Stop scanning once a valid QR code is found
              }
            }
          }
          animationFrameId = requestAnimationFrame(tick);
        };
        animationFrameId = requestAnimationFrame(tick);
      } catch (err) {
        console.warn("Could not access physical camera stream (standard in iframe previews). Fallback to simulated code scanner is available.", err);
      }
    };
    
    startCamera();
    
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isQrModalOpen, selectedCampaignForQr]);

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
      const addedEarnings = kmsToDrive * driverRatePerKm;
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
      <div className={`min-h-screen ${darkMode ? "dark dark-theme-active bg-[#05132f] text-slate-100" : "bg-slate-50 text-slate-900"} flex flex-col relative overflow-hidden font-sans selection:bg-[#10B981] selection:text-white`}>
        {/* Decorative background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.02)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#10B981]/5 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none animate-pulse"></div>

        {/* Dynamic Top Navigation Bar */}
        <nav className={`w-full border-b ${darkMode ? "border-white/10 bg-[#05132f]/85 text-white" : "border-slate-200 bg-white/90"} backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between shadow-3xs`}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[#10B981] rounded-xl flex items-center justify-center font-display font-black text-lg text-white shadow-md shadow-emerald-500/10">
              A
            </div>
            <span className={`text-xl font-display font-black tracking-tight ${darkMode ? "text-white" : "text-[#0B1F4D]"}`}>AutoAdz.in</span>
            <span className={`text-[10px] font-mono ${darkMode ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"} px-2 py-0.5 rounded border font-bold`}>2.0 SAAS</span>
          </div>

          <div className={`hidden md:flex items-center gap-6 text-xs font-bold ${darkMode ? "text-slate-300" : "text-slate-600"} uppercase font-mono tracking-wider`}>
            <button onClick={() => setLandingSection("hero")} className={`transition hover:text-[#10B981] ${landingSection === "hero" ? "text-[#10B981]" : ""}`}>Platform Info</button>
            <button onClick={() => setLandingSection("register-campaign")} className={`transition hover:text-[#10B981] ${landingSection === "register-campaign" ? "text-[#10B981]" : ""}`}>Launch Campaign</button>
            <button onClick={() => setLandingSection("register-driver")} className={`transition hover:text-[#10B981] ${landingSection === "register-driver" ? "text-[#10B981]" : ""}`}>Become a Driver Partner</button>
            <button onClick={() => setLandingSection("login")} className={`transition hover:text-[#10B981] ${landingSection === "login" ? "text-[#10B981]" : ""}`}>Portal Login</button>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowHelpModal(true)}
              className={`flex items-center gap-1.5 text-[10px] font-bold font-mono px-3 py-1.5 rounded-lg ${darkMode ? "text-emerald-400 bg-emerald-500/15 border-emerald-500/30" : "text-emerald-700 bg-emerald-500/10 border-emerald-500/10"} hover:bg-[#10B981] hover:text-white transition duration-200 border`}
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
                className={`border ${darkMode ? "border-white/20 hover:bg-white/10 text-white" : "border-slate-200 hover:bg-slate-100 text-slate-800"} text-[10px] font-bold font-mono px-3.5 py-1.5 rounded-lg transition`}
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
          <div className="relative w-full overflow-hidden flex-1 flex flex-col justify-start">

            <main className="flex-1 flex flex-col py-10 px-4 md:px-8 max-w-7xl mx-auto z-10 space-y-12 w-full relative">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              {/* Hero Left Intro */}
              <div className="lg:col-span-7 space-y-6 text-left">
                <span className={`inline-flex items-center gap-1.5 text-[10px] font-mono font-extrabold tracking-widest ${darkMode ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/25" : "text-emerald-800 bg-emerald-500/10 border-emerald-500/20"} rounded-full px-3 py-1 uppercase`}>
                  NEXT-GEN TRANSIT OUT-OF-HOME (OOH) SAAS
                </span>
                <h2 className={`text-4xl md:text-5xl lg:text-6xl font-display font-extrabold ${darkMode ? "text-white" : "text-[#0B1F4D]"} leading-none tracking-tight`}>
                  India's Hyperlocal <span className="text-[#10B981]">GPS-Tracked</span> Auto Advertising Platform
                </h2>
                <p className={`text-sm md:text-base ${darkMode ? "text-slate-300" : "text-slate-500"} leading-relaxed max-w-2xl`}>
                  Connect with local target audiences by pasting high-impact brand designs on auto-rickshaw backhoods. Plan campaigns, predict hyperlocal CPM impressions, track driver live locations, and verify proof of work with absolute precision.
                </p>

                {/* Database Metrics Grid - Real Database Counts! */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
                  {/* Card 1: Total Campaigns */}
                  <div className={`p-5 rounded-3xl border flex flex-col items-center justify-center text-center space-y-2.5 ${
                    darkMode ? "bg-[#0B1F4D]/40 backdrop-blur-md border-white/10 shadow-lg" : "bg-white border-slate-150 shadow-3xs"
                  }`}>
                    <Rocket className="text-emerald-400" size={22} />
                    <div className="space-y-0.5">
                      <p className={`text-3xl font-black leading-none ${darkMode ? "text-white" : "text-[#0B1F4D]"}`}>{campaigns.length}</p>
                      <p className={`text-[9px] ${darkMode ? "text-slate-300 font-medium" : "text-slate-500 font-bold"} uppercase tracking-wider`}>Total Campaigns</p>
                    </div>
                  </div>

                  {/* Card 2: Rickshaws Linked */}
                  <div className={`p-5 rounded-3xl border flex flex-col items-center justify-center text-center space-y-2.5 ${
                    darkMode ? "bg-[#0B1F4D]/40 backdrop-blur-md border-white/10 shadow-lg" : "bg-white border-slate-150 shadow-3xs"
                  }`}>
                    <Truck className="text-blue-400" size={22} />
                    <div className="space-y-0.5">
                      <p className={`text-3xl font-black leading-none ${darkMode ? "text-white" : "text-[#10B981]"}`}>{drivers.length}</p>
                      <p className={`text-[9px] ${darkMode ? "text-slate-300 font-medium" : "text-slate-500 font-bold"} uppercase tracking-wider`}>Rickshaws Linked</p>
                    </div>
                  </div>

                  {/* Card 3: Live KMs Logged */}
                  <div className={`p-5 rounded-3xl border flex flex-col items-center justify-center text-center space-y-2.5 ${
                    darkMode ? "bg-[#0B1F4D]/40 backdrop-blur-md border-white/10 shadow-lg" : "bg-white border-slate-150 shadow-3xs"
                  }`}>
                    <Activity className="text-orange-400" size={22} />
                    <div className="space-y-0.5">
                      <p className={`text-3xl font-black leading-none ${darkMode ? "text-white" : "text-indigo-600"}`}>{(totalKmsAll + simulatedKmsTotal).toLocaleString(undefined, { maximumFractionDigits: 0 })}+</p>
                      <p className={`text-[9px] ${darkMode ? "text-slate-300 font-medium" : "text-slate-500 font-bold"} uppercase tracking-wider`}>Live KMs Logged</p>
                    </div>
                  </div>

                  {/* Card 4: QR Scans Tracked */}
                  <div className={`p-5 rounded-3xl border flex flex-col items-center justify-center text-center space-y-2.5 ${
                    darkMode ? "bg-[#0B1F4D]/40 backdrop-blur-md border-white/10 shadow-lg" : "bg-white border-slate-150 shadow-3xs"
                  }`}>
                    <QrCode className="text-pink-400" size={22} />
                    <div className="space-y-0.5">
                      <p className={`text-3xl font-black leading-none ${darkMode ? "text-white" : "text-purple-600"}`}>{totalScansAll.toLocaleString()}</p>
                      <p className={`text-[9px] ${darkMode ? "text-slate-300 font-medium" : "text-slate-500 font-bold"} uppercase tracking-wider`}>QR Scans Tracked</p>
                    </div>
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
                    className={`border ${darkMode ? "border-white/10 bg-[#0B1F4D]/40 text-slate-300 hover:bg-white/10 hover:text-white" : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"} font-bold font-mono text-xs px-6 py-3.5 rounded-2xl transition flex items-center gap-2`}
                  >
                    <Smartphone size={16} /> BECOME A DRIVER PARTNER
                  </button>
                </div>
              </div>

              {/* Hero Right Interactive Display Card */}
              <div className="lg:col-span-5 relative">
                {/* Floating ambient badge */}
                <div className={`absolute -top-4 -left-4 ${darkMode ? "bg-[#0b1f4d] border-white/15 text-white" : "bg-white border-slate-150 text-[#0B1F4D]"} border p-3 rounded-2xl shadow-md flex items-center gap-2.5 z-20 font-mono animate-pulse`}>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <div className="text-left">
                    <p className={`text-[9px] font-black ${darkMode ? "text-slate-200" : "text-[#0B1F4D]"}`}>AUTO ADZ TELEMETRY</p>
                    <p className="text-[8px] text-[#10B981] font-bold">LIVE TRANSIT STREAM</p>
                  </div>
                </div>

                {/* Auto Rickshaw Billboard Mockup */}
                <div className={`${darkMode ? "bg-[#0B1F4D]/60 border-white/10" : "bg-white border-slate-150"} border p-5 rounded-4xl shadow-xl relative overflow-hidden text-left`}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl"></div>
                  
                  <div className={`flex justify-between items-center pb-3 border-b ${darkMode ? "border-white/10" : "border-slate-100"} mb-4`}>
                    <h4 className="text-[10px] font-black font-mono text-slate-400 uppercase">Interactive Transit Preview</h4>
                    <span className={`text-[8px] font-bold font-mono ${darkMode ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25" : "bg-emerald-50 text-emerald-700 border-emerald-100"} px-2 py-0.5 rounded border`}>BACK-HOOD BANNER FORMAT</span>
                  </div>

                  <div className={`rounded-2xl overflow-hidden relative border ${darkMode ? "border-white/10" : "border-slate-200"} mb-4 shadow-sm`}>
                    <img 
                      src="https://images.unsplash.com/photo-1597075687490-8f673c6c17f6?auto=format&fit=crop&q=80&w=800"
                      alt="Auto Rickshaw Media" 
                      className="w-full h-44 object-cover brightness-95"
                      referrerPolicy="no-referrer"
                    />
                    <div className={`absolute bottom-3 left-3 ${darkMode ? "bg-slate-900/90 text-white border-white/15" : "bg-white/95 text-[#0B1F4D] border-slate-150"} text-[9px] font-mono font-bold px-2.5 py-1 rounded-lg border shadow-xs`}>
                      📍 DIGITAL-READY BANNER
                    </div>
                  </div>

                  {/* Tracking Map Mockup inside Hero */}
                  <div className={`${darkMode ? "bg-slate-950/50 border-white/10" : "bg-slate-50 border-slate-150"} border rounded-2xl p-3.5 space-y-2.5 font-mono text-xs`}>
                    <div className="flex justify-between items-center">
                      <span className={`${darkMode ? "text-slate-400" : "text-slate-500"} font-bold`}>Active Campaign:</span>
                      <span className="text-[#10B981] font-black">
                        {campaigns.length > 0 ? campaigns[0].title : "Launch Campaign First"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`${darkMode ? "text-slate-400" : "text-slate-500"} font-bold`}>Fleet Size Allocation:</span>
                      <span className={`${darkMode ? "text-indigo-400" : "text-indigo-600"} font-black`}>
                        {campaigns.length > 0 ? `${campaigns[0].autosCount} Rickshaws Live` : "No Fleet Active"}
                      </span>
                    </div>
                    <div className={`h-2 ${darkMode ? "bg-slate-800" : "bg-slate-200"} rounded-full overflow-hidden`}>
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                        style={{ width: campaigns.length > 0 ? "100%" : "20%" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Campaign Calculator Section (CMP / Target slider integration) */}
            <div className={`rounded-4xl p-6 md:p-8 border space-y-6 text-left ${darkMode ? "bg-[#0b1f4d]/40 backdrop-blur-md border-white/10 text-white" : "bg-white border-slate-150 shadow-sm"}`}>
              <div>
                <span className={`text-[9px] font-mono font-black uppercase tracking-widest px-2.5 py-1 rounded border ${darkMode ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25" : "bg-emerald-50 text-emerald-700 border-emerald-100"}`}>Interactive SaaS Pricing tool</span>
                <h3 className={`text-2xl font-display font-extrabold ${darkMode ? "text-white" : "text-[#0B1F4D]"} mt-2`}>Calculate Your Campaign ROI Instantly</h3>
                <p className={`text-xs ${darkMode ? "text-slate-300" : "text-slate-400"} mt-1`}>Adjust the sliders to estimate reach, CPM impressions, and vehicle numbers for your specific business niche.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Sliders Input */}
                <div className="lg:col-span-6 space-y-5">
                  <div className="space-y-2">
                    <div className="flex justify-between font-mono text-xs">
                      <span className={`${darkMode ? "text-slate-300" : "text-slate-500"} font-bold uppercase`}>Select Operating City</span>
                      <span className="text-[#10B981] font-bold">Kolkata/Delhi/Bangalore</span>
                    </div>
                    <select
                      value={newCampCity}
                      onChange={(e) => setNewCampCity(e.target.value)}
                      className={`w-full ${darkMode ? "bg-slate-900 border-white/15 text-white" : "bg-slate-50 border-slate-200 text-[#0B1F4D]"} rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#10B981]`}
                    >
                      <option value="Kolkata">Kolkata (₹18 / auto / day)</option>
                      <option value="Delhi">Delhi NCR (₹20 / auto / day)</option>
                      <option value="Bangalore">Bangalore (₹22 / auto / day)</option>
                      <option value="Mumbai">Mumbai (₹25 / auto / day)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between font-mono text-xs">
                      <span className={`${darkMode ? "text-slate-300" : "text-slate-500"} font-bold uppercase`}>Allocated Daily Budget</span>
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
                    <div className={`flex justify-between text-[10px] ${darkMode ? "text-slate-400" : "text-slate-400"} font-mono`}>
                      <span>₹10,000 min</span>
                      <span>₹3,00,000 max</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between font-mono text-xs">
                      <span className={`${darkMode ? "text-slate-300" : "text-slate-500"} font-bold uppercase`}>Fleet Size Allocation</span>
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
                    <div className={`flex justify-between text-[10px] ${darkMode ? "text-slate-400" : "text-slate-400"} font-mono`}>
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
                <span className={`text-[9px] font-mono font-black uppercase tracking-widest px-2.5 py-1 rounded border ${darkMode ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25" : "bg-emerald-50 text-emerald-700 border-emerald-100"}`}>Localized SEO Hub</span>
                <h3 className={`text-2xl font-display font-extrabold ${darkMode ? "text-white" : "text-[#0B1F4D]"} mt-2`}>Dynamic Hyperlocal City & Niche Operating Guides</h3>
                <p className={`text-xs ${darkMode ? "text-slate-300" : "text-slate-400"} mt-1`}>Explore specific local marketing hotspots, average daily trip durations, and AI recommendations tailored to your industry.</p>
              </div>

              {/* Selection button grids */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cities */}
                <div className={`border p-5 rounded-3xl space-y-3 ${darkMode ? "bg-[#0b1f4d]/40 border-white/10 text-white" : "bg-white border-slate-150 shadow-xs"}`}>
                  <h4 className={`font-bold text-xs uppercase font-mono tracking-wider ${darkMode ? "text-slate-300" : "text-[#0B1F4D]"}`}>🏙️ SELECT LOCALIZED CITY GUIDE</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => { setSelectedSeoCity("Kolkata"); setSelectedSeoIndustry(null); }}
                      className={`p-3 border rounded-xl text-xs font-bold text-left transition ${darkMode ? "bg-slate-900/50 border-white/10 text-white hover:bg-emerald-500/10 hover:border-[#10B981]" : "bg-slate-50 hover:bg-emerald-50 border-slate-200 hover:border-[#10B981] text-slate-800"}`}
                    >
                      Kolkata Guide
                      <span className={`text-[9px] block ${darkMode ? "text-slate-400" : "text-slate-400"} font-mono font-medium mt-0.5`}>Shyambazar, Gariahat</span>
                    </button>
                    <button 
                      onClick={() => { setSelectedSeoCity("Delhi"); setSelectedSeoIndustry(null); }}
                      className={`p-3 border rounded-xl text-xs font-bold text-left transition ${darkMode ? "bg-slate-900/50 border-white/10 text-white hover:bg-emerald-500/10 hover:border-[#10B981]" : "bg-slate-50 hover:bg-emerald-50 border-slate-200 hover:border-[#10B981] text-slate-800"}`}
                    >
                      Delhi NCR Guide
                      <span className={`text-[9px] block ${darkMode ? "text-slate-400" : "text-slate-400"} font-mono font-medium mt-0.5`}>Karol Bagh, Noida Sec 62</span>
                    </button>
                  </div>
                </div>

                {/* Industries */}
                <div className={`border p-5 rounded-3xl space-y-3 ${darkMode ? "bg-[#0b1f4d]/40 border-white/10 text-white" : "bg-white border-slate-150 shadow-xs"}`}>
                  <h4 className={`font-bold text-xs uppercase font-mono tracking-wider ${darkMode ? "text-slate-300" : "text-[#0B1F4D]"}`}>🩺 SELECT INDUSTRY NICHE SPECIFIC ADV</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => { setSelectedSeoIndustry("Restaurant"); setSelectedSeoCity(null); }}
                      className={`p-3 border rounded-xl text-xs font-bold text-left transition ${darkMode ? "bg-slate-900/50 border-white/10 text-white hover:bg-emerald-500/10 hover:border-[#10B981]" : "bg-slate-50 hover:bg-emerald-50 border-slate-200 hover:border-[#10B981] text-slate-800"}`}
                    >
                      Restaurants & Cafes
                      <span className={`text-[9px] block ${darkMode ? "text-slate-400" : "text-slate-400"} font-mono font-medium mt-0.5`}>Menu hooks, QR deals</span>
                    </button>
                    <button 
                      onClick={() => { setSelectedSeoIndustry("Clinic"); setSelectedSeoCity(null); }}
                      className={`p-3 border rounded-xl text-xs font-bold text-left transition ${darkMode ? "bg-slate-900/50 border-white/10 text-white hover:bg-emerald-500/10 hover:border-[#10B981]" : "bg-slate-50 hover:bg-emerald-50 border-slate-200 hover:border-[#10B981] text-slate-800"}`}
                    >
                      Dental Clinics & Hospitals
                      <span className={`text-[9px] block ${darkMode ? "text-slate-400" : "text-slate-400"} font-mono font-medium mt-0.5`}>Check-up promos, localtrust</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Localized Guide dynamic rendering */}
              {selectedSeoCity && (
                <div className="bg-emerald-500/5 border-2 border-[#10B981]/20 rounded-3xl p-6 space-y-4 animate-fadeIn">
                  <div className={`flex justify-between items-center pb-2 border-b ${darkMode ? "border-white/10" : "border-slate-200"}`}>
                    <h4 className={`font-display font-extrabold ${darkMode ? "text-white" : "text-[#0B1F4D]"} text-base`}>🏙️ AutoAdz Hyperlocal Guide: Operating in {selectedSeoCity}</h4>
                    <button 
                      onClick={() => setSelectedSeoCity(null)}
                      className={`text-slate-400 ${darkMode ? "hover:text-white" : "hover:text-slate-800"} text-xs font-bold font-mono`}
                    >
                      Close Guide [X]
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className={`p-3 rounded-xl border space-y-1 ${darkMode ? "bg-slate-900/40 border-white/10 text-white" : "bg-white border-slate-200"}`}>
                      <strong className={`block uppercase font-mono tracking-wide text-[9px] ${darkMode ? "text-emerald-400" : "text-[#10B981]"}`}>High Traffic hotspots</strong>
                      <p className={`${darkMode ? "text-slate-300" : "text-slate-600"} leading-relaxed font-bold`}>
                        {selectedSeoCity === "Kolkata" 
                          ? "Shyambazar Crossing, Gariahat Market, Salt Lake Sector V, Howrah Station Road, Garia Crossing" 
                          : "Connaught Place Radial Roads, Karol Bagh Market, Noida Sector 62 IT Hub, Karol Bagh Metro, GK M-Block"
                        }
                      </p>
                    </div>

                    <div className={`p-3 rounded-xl border space-y-1 ${darkMode ? "bg-slate-900/40 border-white/10 text-white" : "bg-white border-slate-200"}`}>
                      <strong className={`block uppercase font-mono tracking-wide text-[9px] ${darkMode ? "text-indigo-400" : "text-indigo-600"}`}>Avg Daily Run Telemetry</strong>
                      <p className={`${darkMode ? "text-slate-300" : "text-slate-600"} leading-relaxed`}>
                        {selectedSeoCity === "Kolkata" 
                          ? "62.4 KM/day average trip distance across highly congested North and Central transit hubs." 
                          : "74.8 KM/day average trip distance crossing high-speed ring roads and sub-city sectors."
                        }
                      </p>
                    </div>

                    <div className={`p-3 rounded-xl border space-y-1 ${darkMode ? "bg-slate-900/40 border-white/10 text-white" : "bg-white border-slate-200"}`}>
                      <strong className={`block uppercase font-mono tracking-wide text-[9px] ${darkMode ? "text-orange-400" : "text-orange-600"}`}>AI campaign advice</strong>
                      <p className={`${darkMode ? "text-slate-300" : "text-slate-600"} leading-relaxed italic`}>
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
                  <div className={`flex justify-between items-center pb-2 border-b ${darkMode ? "border-white/10" : "border-slate-200"}`}>
                    <h4 className={`font-display font-extrabold ${darkMode ? "text-white" : "text-[#0B1F4D]"} text-base`}>🩺 AutoAdz Industry Guide: Transit Marketing for {selectedSeoIndustry}s</h4>
                    <button 
                      onClick={() => setSelectedSeoIndustry(null)}
                      className={`text-slate-400 ${darkMode ? "hover:text-white" : "hover:text-slate-800"} text-xs font-bold font-mono`}
                    >
                      Close Guide [X]
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className={`p-3 rounded-xl border space-y-1 ${darkMode ? "bg-slate-900/40 border-white/10 text-white" : "bg-white border-slate-200"}`}>
                      <strong className={`block uppercase font-mono tracking-wide text-[9px] ${darkMode ? "text-emerald-400" : "text-[#10B981]"}`}>High Conversion formats</strong>
                      <p className={`${darkMode ? "text-slate-300" : "text-slate-600"} leading-relaxed font-bold`}>
                        {selectedSeoIndustry === "Restaurant" 
                          ? "Back-Hood Menu Highlights + Custom QR Coupon Scans with 15% off instant billing hooks." 
                          : "Trust-building healthcare slogans + Free Check-up Campaign activation with QR Booking slots."
                        }
                      </p>
                    </div>

                    <div className={`p-3 rounded-xl border space-y-1 ${darkMode ? "bg-slate-900/40 border-white/10 text-white" : "bg-white border-slate-200"}`}>
                      <strong className={`block uppercase font-mono tracking-wide text-[9px] ${darkMode ? "text-indigo-400" : "text-indigo-600"}`}>Core Targeted Localities</strong>
                      <p className={`${darkMode ? "text-slate-300" : "text-slate-600"} leading-relaxed`}>
                        {selectedSeoIndustry === "Restaurant" 
                          ? "Deploy fleets within 3-5 KM radius of your cloud kitchens or dine-in spaces for localized food delivery surge." 
                          : "Place banners in local residential sectors, high-density residential high-rises, and near local schools/colleges."
                        }
                      </p>
                    </div>

                    <div className={`p-3 rounded-xl border space-y-1 ${darkMode ? "bg-slate-900/40 border-white/10 text-white" : "bg-white border-slate-200"}`}>
                      <strong className={`block uppercase font-mono tracking-wide text-[9px] ${darkMode ? "text-orange-400" : "text-orange-600"}`}>AI campaign hook suggestions</strong>
                      <p className={`${darkMode ? "text-slate-300" : "text-slate-600"} leading-relaxed italic font-mono`}>
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
                <span className={`text-[9px] font-mono font-black uppercase tracking-widest px-2.5 py-1 rounded border ${darkMode ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25" : "bg-emerald-50 text-emerald-700 border-emerald-100"}`}>Comprehensive format suite</span>
                <h3 className={`text-2xl font-display font-extrabold ${darkMode ? "text-white" : "text-[#0B1F4D]"} mt-2`}>Premium Transit Branding Formats</h3>
                <p className={`text-xs ${darkMode ? "text-slate-300" : "text-slate-400"} mt-1`}>Select from multiple highly durable print formats styled on thousands of active passenger auto-rickshaws.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Format 1 */}
                <div className={`border p-5 rounded-3xl space-y-3 flex flex-col justify-between ${darkMode ? "bg-[#0b1f4d]/40 border-white/10 text-white" : "bg-white border-slate-150 shadow-3xs"}`}>
                  <div className="space-y-2">
                    <div className={`w-10 h-10 ${darkMode ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-500/10 text-emerald-600"} flex items-center justify-center rounded-2xl`}>
                      <Layers size={18} />
                    </div>
                    <h4 className={`font-display font-extrabold ${darkMode ? "text-white" : "text-[#0B1F4D]"} text-sm`}>Full Back Hood Vinyl Banners</h4>
                    <p className={`text-xs ${darkMode ? "text-slate-300" : "text-slate-500"} leading-relaxed`}>
                      Our most popular transit layout. Spans the entire back hood of the auto, ensuring 100% readability for vehicles waiting behind in dense traffic signals.
                    </p>
                  </div>
                  <button onClick={() => setLandingSection("register-campaign")} className={`text-xs text-[#10B981] font-bold font-mono hover:underline flex items-center gap-1 pt-3 border-t ${darkMode ? "border-white/10" : "border-slate-100"}`}>
                    Book Back Hoods <ChevronRight size={12} />
                  </button>
                </div>

                {/* Format 2 */}
                <div className={`border p-5 rounded-3xl space-y-3 flex flex-col justify-between ${darkMode ? "bg-[#0b1f4d]/40 border-white/10 text-white" : "bg-white border-slate-150 shadow-3xs"}`}>
                  <div className="space-y-2">
                    <div className={`w-10 h-10 ${darkMode ? "bg-indigo-500/15 text-indigo-400" : "bg-indigo-500/10 text-indigo-600"} flex items-center justify-center rounded-2xl`}>
                      <Smartphone size={18} />
                    </div>
                    <h4 className={`font-display font-extrabold ${darkMode ? "text-white" : "text-[#0B1F4D]"} text-sm`}>QR Coupon Activation Stickers</h4>
                    <p className={`text-xs ${darkMode ? "text-slate-300" : "text-slate-500"} leading-relaxed`}>
                      Includes a highly readable custom QR code sticker printed alongside the brand creative. Passengers and pedestrians scan to trigger direct app downloads or coupon activation.
                    </p>
                  </div>
                  <button onClick={() => setLandingSection("register-campaign")} className={`text-xs text-[#10B981] font-bold font-mono hover:underline flex items-center gap-1 pt-3 border-t ${darkMode ? "border-white/10" : "border-slate-100"}`}>
                    Deploy QR Hooks <ChevronRight size={12} />
                  </button>
                </div>

                {/* Format 3 */}
                <div className={`border p-5 rounded-3xl space-y-3 flex flex-col justify-between ${darkMode ? "bg-[#0b1f4d]/40 border-white/10 text-white" : "bg-white border-slate-150 shadow-3xs"}`}>
                  <div className="space-y-2">
                    <div className={`w-10 h-10 ${darkMode ? "bg-orange-500/15 text-orange-400" : "bg-orange-500/10 text-orange-600"} flex items-center justify-center rounded-2xl`}>
                      <MapPin size={18} />
                    </div>
                    <h4 className={`font-display font-extrabold ${darkMode ? "text-white" : "text-[#0B1F4D]"} text-sm`}>Hyperlocal Pincode Targeting</h4>
                    <p className={`text-xs ${darkMode ? "text-slate-300" : "text-slate-500"} leading-relaxed`}>
                      Filter auto allocations down to specific pincodes, subway nodes, or local markets. Ensures zero spillover and premium conversion for localized retail outlets.
                    </p>
                  </div>
                  <button onClick={() => setLandingSection("register-campaign")} className={`text-xs text-[#10B981] font-bold font-mono hover:underline flex items-center gap-1 pt-3 border-t ${darkMode ? "border-white/10" : "border-slate-100"}`}>
                    Target Local Pincodes <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            </div>

            {/* FREQUENTLY ASKED QUESTIONS SECTION */}
            <div className={`rounded-4xl p-6 md:p-8 border space-y-6 text-left ${darkMode ? "bg-[#0b1f4d]/40 backdrop-blur-md border-white/10 text-white" : "bg-white border-slate-150 shadow-sm"}`}>
              <div>
                <span className={`text-[9px] font-mono font-black uppercase tracking-widest px-2.5 py-1 rounded border ${darkMode ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25" : "bg-emerald-50 text-emerald-700 border-emerald-100"}`}>Help center</span>
                <h3 className={`text-2xl font-display font-extrabold ${darkMode ? "text-white" : "text-[#0B1F4D]"} mt-2`}>Frequently Answered Queries</h3>
                <p className={`text-xs ${darkMode ? "text-slate-300" : "text-slate-400"} mt-1`}>Everything you need to know about setting up auto-rickshaw marketing campaigns.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-4 border rounded-2xl space-y-1 ${darkMode ? "bg-[#05132f]/60 border-white/10" : "bg-slate-50 border-slate-200"}`}>
                  <h5 className={`font-bold text-xs ${darkMode ? "text-emerald-400" : "text-[#0B1F4D]"}`}>How is the live transit mileage tracked?</h5>
                  <p className={`text-xs ${darkMode ? "text-slate-300" : "text-slate-500"} leading-relaxed`}>
                    Auto-rickshaw driver partners keep their GPS meters running via the AutoAdz Driver Partner Mobile App. Telemetry is automatically streamed back to our operations desk.
                  </p>
                </div>

                <div className={`p-4 border rounded-2xl space-y-1 ${darkMode ? "bg-[#05132f]/60 border-white/10" : "bg-slate-50 border-slate-200"}`}>
                  <h5 className={`font-bold text-xs ${darkMode ? "text-emerald-400" : "text-[#0B1F4D]"}`}>How are drivers paid and verified?</h5>
                  <p className={`text-xs ${darkMode ? "text-slate-300" : "text-slate-500"} leading-relaxed`}>
                    Drivers must upload daily check-in photos of their auto-rickshaw backhoods. Once approved by our audit team, supplementary payouts are instantly credited to their local digital wallets.
                  </p>
                </div>

                <div className={`p-4 border rounded-2xl space-y-1 ${darkMode ? "bg-[#05132f]/60 border-white/10" : "bg-slate-50 border-slate-200"}`}>
                  <h5 className={`font-bold text-xs ${darkMode ? "text-emerald-400" : "text-[#0B1F4D]"}`}>Can I choose specific areas within Kolkata or Bangalore?</h5>
                  <p className={`text-xs ${darkMode ? "text-slate-300" : "text-slate-500"} leading-relaxed`}>
                    Absolutely. Advertisers can choose specific localities (like Salt Lake in Kolkata, or Indiranagar in Bangalore) to ensure concentrated exposure in targeted high-traffic zones.
                  </p>
                </div>

                <div className={`p-4 border rounded-2xl space-y-1 ${darkMode ? "bg-[#05132f]/60 border-white/10" : "bg-slate-50 border-slate-200"}`}>
                  <h5 className={`font-bold text-xs ${darkMode ? "text-emerald-400" : "text-[#0B1F4D]"}`}>How long does a campaign take to go live?</h5>
                  <p className={`text-xs ${darkMode ? "text-slate-300" : "text-slate-500"} leading-relaxed`}>
                    Campaign printing and mounting takes 48 hours post creative design approval. Banners are mounted securely by our operations agents at regional auto hubs.
                  </p>
                </div>
              </div>
            </div>
          </main>
          </div>
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

              {/* ADVERTISER LOGIN / REGISTER FIELDS */}
              {activeLoginSubTab === "advertiser" && (
                <div className="space-y-3">
                  {/* Toggle */}
                  <div className="flex rounded-xl overflow-hidden border border-slate-700 text-[11px] font-mono font-bold">
                    <button
                      onClick={() => { setShowAdvRegister(false); setLoginError(""); }}
                      className={`flex-1 py-1.5 transition ${!showAdvRegister ? "bg-[#FF9800] text-slate-950" : "text-slate-400 hover:text-white"}`}
                    >LOGIN</button>
                    <button
                      onClick={() => { setShowAdvRegister(true); setLoginError(""); }}
                      className={`flex-1 py-1.5 transition ${showAdvRegister ? "bg-[#FF9800] text-slate-950" : "text-slate-400 hover:text-white"}`}
                    >REGISTER</button>
                  </div>

                  {!showAdvRegister ? (
                    <>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 block uppercase font-mono font-bold">Brand Corporate Email</label>
                        <input
                          type="email"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          placeholder="brand@company.in"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#FF9800] focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 block uppercase font-mono font-bold">Password</label>
                        <input
                          type="password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#FF9800] focus:outline-none"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 block uppercase font-mono font-bold">Contact Person Name *</label>
                        <input type="text" value={regName} onChange={(e) => setRegName(e.target.value)} placeholder="e.g. Rahul Sharma"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#FF9800] focus:outline-none" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 block uppercase font-mono font-bold">Company / Brand Name *</label>
                        <input type="text" value={regCompany} onChange={(e) => setRegCompany(e.target.value)} placeholder="e.g. Tata Motors Ltd."
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#FF9800] focus:outline-none" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 block uppercase font-mono font-bold">Business Email *</label>
                        <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="brand@company.in"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#FF9800] focus:outline-none" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 block uppercase font-mono font-bold">Password *</label>
                        <input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} placeholder="Min. 6 characters"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#FF9800] focus:outline-none" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 block uppercase font-mono font-bold">Phone</label>
                          <input type="text" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} placeholder="+91 9876543210"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-[#FF9800] focus:outline-none" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 block uppercase font-mono font-bold">GSTIN</label>
                          <input type="text" value={regGstin} onChange={(e) => setRegGstin(e.target.value)} placeholder="29AAACA1100D"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-[#FF9800] focus:outline-none" />
                        </div>
                      </div>
                      <button
                        disabled={regLoading}
                        onClick={async () => {
                          if (!regName || !regEmail || !regPassword) { setLoginError("Name, email and password are required."); return; }
                          if (regPassword.length < 6) { setLoginError("Password must be at least 6 characters."); return; }
                          setRegLoading(true);
                          setLoginError("");
                          try {
                            const res = await fetch("/api/auth/register", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ name: regName, email: regEmail, password: regPassword, company: regCompany, phone: regPhone, gstin: regGstin }),
                            });
                            const data = await res.json();
                            if (!res.ok) { setLoginError(data.error || "Registration failed."); return; }
                            // Switch to login with pre-filled email
                            setLoginEmail(regEmail);
                            setLoginPassword(regPassword);
                            setShowAdvRegister(false);
                            setLoginError("✅ Account created! Logging you in...");
                            // Auto login
                            const loginRes = await fetch("/api/auth/login", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ role: "advertiser", email: regEmail, password: regPassword }),
                            });
                            const loginData = await loginRes.json();
                            if (loginRes.ok) {
                              localStorage.setItem("autoadz_adv_jwt", loginData.token);
                              localStorage.setItem("autoadz_adv_user_id", String(loginData.userId));
                              localStorage.setItem("autoadz_adv_email", loginData.email);
                              localStorage.setItem("autoadz_adv_brand_name", loginData.name);
                              localStorage.setItem("autoadz_adv_brand_id", loginData.company || loginData.email.split("@")[0]);
                              localStorage.setItem("autoadz_adv_gstin", loginData.gstin || "");
                              localStorage.setItem("autoadz_adv_phone", loginData.phone || "");
                              localStorage.setItem("autoadz_adv_office", loginData.office || "");
                              setAdvJwt(loginData.token);
                              setAdvUserId(loginData.userId);
                              setAdvEmail(loginData.email);
                              setAdvBrandName(loginData.name);
                              setAdvBrandId(loginData.company || loginData.email.split("@")[0]);
                              setAdvGstin(loginData.gstin || "");
                              setAdvPhone(loginData.phone || "");
                              setAdvOffice(loginData.office || "");
                              setUserSession("advertiser");
                              setActiveSimulator("advertiser");
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }
                          } catch { setLoginError("Network error. Please try again."); }
                          finally { setRegLoading(false); }
                        }}
                        className="w-full py-2.5 rounded-xl text-xs font-bold font-mono bg-[#FF9800] hover:bg-orange-500 text-slate-950 transition disabled:opacity-60"
                      >
                        {regLoading ? "CREATING ACCOUNT..." : "CREATE BRAND ACCOUNT →"}
                      </button>
                    </>
                  )}
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
                    <label className="text-[10px] text-slate-400 block uppercase font-mono font-bold">Admin Email</label>
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="Enter admin email"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 block uppercase font-mono font-bold">Master Security Pin</label>
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {loginError && (
                <div className="text-red-400 text-xs text-center font-medium bg-red-950/40 border border-red-500/20 p-2 rounded-lg font-mono">
                  ⚠️ {loginError}
                </div>
              )}

              {/* AUTHENTICATE SUBMIT */}
              {!(activeLoginSubTab === "advertiser" && showAdvRegister) && <button
                onClick={async () => {
                  if (activeLoginSubTab === "advertiser") {
                    if (!loginEmail || !loginPassword) {
                      setLoginError("Please enter your brand email and password.");
                      return;
                    }
                    try {
                      const res = await fetch("/api/auth/login", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ role: "advertiser", email: loginEmail, password: loginPassword }),
                      });
                      const data = await res.json();
                      if (!res.ok) {
                        setLoginError(data.error || "Invalid credentials.");
                        return;
                      }
                      // Persist session
                      localStorage.setItem("autoadz_adv_jwt", data.token);
                      localStorage.setItem("autoadz_adv_user_id", String(data.userId));
                      localStorage.setItem("autoadz_adv_email", data.email);
                      localStorage.setItem("autoadz_adv_brand_name", data.name);
                      localStorage.setItem("autoadz_adv_brand_id", data.company || data.email.split("@")[0]);
                      localStorage.setItem("autoadz_adv_gstin", data.gstin || "");
                      localStorage.setItem("autoadz_adv_phone", data.phone || "");
                      localStorage.setItem("autoadz_adv_office", data.office || "");
                      // Update state
                      setAdvJwt(data.token);
                      setAdvUserId(data.userId);
                      setAdvEmail(data.email);
                      setAdvBrandName(data.name);
                      setAdvBrandId(data.company || data.email.split("@")[0]);
                      setAdvGstin(data.gstin || "");
                      setAdvPhone(data.phone || "");
                      setAdvOffice(data.office || "");
                      setUserSession("advertiser");
                      setActiveSimulator("advertiser");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    } catch {
                      setLoginError("Network error. Please try again.");
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
                      window.scrollTo({ top: 0, behavior: "smooth" });
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
                    if (loginEmail === "apex7tech@gmail.com" && loginPassword === "Search@1959") {
                      setUserSession("admin");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    } else {
                      setLoginError("Invalid admin credentials.");
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
              </button>}
            </div>
          </main>
        )}

        {/* Footer info branding */}
        {renderGlobalFooter()}

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
    <div className={`min-h-screen ${darkMode ? "dark dark-theme-active" : "bg-[#F4F7FE]"} flex flex-col font-sans`}>
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
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 hover:border-amber-400 transition rounded-lg text-xs font-mono font-bold text-slate-50 border border-white/20"
            title="Toggle Dark Mode"
            id="theme-toggle-btn"
          >
            {darkMode ? (
              <>
                <Sun size={12} className="text-amber-400 animate-pulse animate-duration-1000" />
                <span className="text-amber-400 font-bold">LIGHT VIEW</span>
              </>
            ) : (
              <>
                <Moon size={12} className="text-amber-400" />
                <span className="text-slate-50 font-bold">NIGHT MODE</span>
              </>
            )}
          </button>

          <button 
            onClick={fetchData} 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 hover:border-amber-400 transition rounded-lg text-xs font-mono font-bold text-slate-50 border border-white/20"
            id="sync-telemetry-btn"
          >
            <RefreshCw size={12} className={loading ? "animate-spin text-amber-400" : "text-amber-400"} />
            <span className="text-slate-50 font-bold">{loading ? "SYNCING..." : "SYNC TELEMETRY"}</span>
          </button>

          {/* Logout Switch Portal Button */}
          <button
            onClick={() => {
              if (userSession === "advertiser") {
                localStorage.removeItem("autoadz_adv_jwt");
                localStorage.removeItem("autoadz_adv_user_id");
                localStorage.removeItem("autoadz_adv_email");
                setAdvJwt("");
                setAdvUserId(null);
                setAdvEmail("");
              }
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
                        {/* Hero wallet card — deep navy, amber accent */}
                        <div className="bg-gradient-to-br from-[#0B1F4D] via-[#112660] to-[#0d2052] rounded-2xl p-4 text-white shadow-md relative overflow-hidden">
                          {/* decorative circles */}
                          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/5 pointer-events-none" />
                          <div className="absolute -right-2 top-8 w-14 h-14 rounded-full bg-[#FF9800]/10 pointer-events-none" />

                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-[9px] text-slate-400 font-mono uppercase tracking-widest">Campaign Wallet</p>
                              <h2 className="text-[26px] font-display font-extrabold mt-0.5 leading-none text-[#FF9800]">
                                ₹{(transactions.filter(t => t.userId === "advertiser_main" && t.status === "success").reduce((acc, curr) => curr.type === "deposit" ? acc + curr.amount : acc - curr.amount, 0)).toLocaleString()}
                              </h2>
                              <p className="text-[9px] text-slate-400 mt-1">Available balance</p>
                            </div>
                            <div className="w-8 h-8 rounded-xl bg-[#FF9800]/20 flex items-center justify-center mt-1">
                              <Wallet size={15} className="text-[#FF9800]" />
                            </div>
                          </div>

                          <div className="mt-3 pt-3 border-t border-white/10 flex gap-2">
                            <input
                              type="number"
                              placeholder="Amount (₹)"
                              value={addFundsAmount}
                              onChange={(e) => setAddFundsAmount(e.target.value)}
                              className="flex-1 min-w-0 bg-white/10 text-white placeholder-slate-500 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#FF9800]"
                            />
                            <button
                              onClick={handleAddFunds}
                              className="bg-[#FF9800] hover:bg-orange-500 text-[#0B1F4D] text-[10px] font-bold px-4 py-1.5 rounded-lg transition whitespace-nowrap"
                            >
                              + Add Funds
                            </button>
                          </div>
                          {walletSuccessMsg && (
                            <p className="text-[10px] text-green-300 mt-2 font-medium flex items-center gap-1">
                              <CheckCircle size={10} /> {walletSuccessMsg}
                            </p>
                          )}
                        </div>

                        {/* KPI strip — 4 cards */}
                        <div className="grid grid-cols-2 gap-2">
                          {/* Active Autos */}
                          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-3 flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                              <Truck size={15} className="text-green-600" />
                            </div>
                            <div>
                              <p className="text-[9px] text-slate-400 uppercase font-mono tracking-wide">Active Autos</p>
                              <p className="text-base font-extrabold text-[#0B1F4D] leading-tight">{activeAutosAll}</p>
                            </div>
                          </div>
                          {/* Distance */}
                          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-3 flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                              <Navigation size={15} className="text-blue-600" />
                            </div>
                            <div>
                              <p className="text-[9px] text-slate-400 uppercase font-mono tracking-wide">Total KM</p>
                              <p className="text-base font-extrabold text-[#0B1F4D] leading-tight">
                                {totalKmsAll.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                              </p>
                            </div>
                          </div>
                          {/* QR Scans */}
                          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-3 flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                              <QrCode size={15} className="text-[#FF9800]" />
                            </div>
                            <div>
                              <p className="text-[9px] text-slate-400 uppercase font-mono tracking-wide">QR Scans</p>
                              <p className="text-base font-extrabold text-[#0B1F4D] leading-tight">{totalScansAll.toLocaleString()}</p>
                            </div>
                          </div>
                          {/* Est. Views */}
                          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-3 flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                              <Eye size={15} className="text-purple-600" />
                            </div>
                            <div>
                              <p className="text-[9px] text-slate-400 uppercase font-mono tracking-wide">Est. Views</p>
                              <p className="text-base font-extrabold text-[#0B1F4D] leading-tight">
                                {totalKmsAll * 250 >= 1000 ? `${((totalKmsAll * 250) / 1000).toFixed(1)}K` : Math.round(totalKmsAll * 250).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Launch campaign CTA — only shown when form is hidden */}
                        {!showCreateCampaign && (
                          <button
                            onClick={() => setShowCreateCampaign(true)}
                            className="w-full bg-[#0B1F4D] hover:bg-[#152e68] text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-sm"
                          >
                            <Plus size={14} />
                            Launch New Campaign
                          </button>
                        )}

                        {/* Campaign Creation Panel */}
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

                            {/* Brand name — readonly, from logged-in profile */}
                            <div className="bg-[#0B1F4D]/5 border border-[#0B1F4D]/15 rounded-lg p-2 flex items-center gap-2">
                              <div className="w-6 h-6 bg-[#0B1F4D] text-white rounded-full flex items-center justify-center text-[9px] font-bold shrink-0">
                                {advBrandName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-[9px] text-slate-400 font-mono uppercase">Brand Account</p>
                                <p className="text-xs font-bold text-[#0B1F4D]">{advBrandName}</p>
                              </div>
                            </div>

                            <div>
                              <label className="text-[10px] text-slate-500 block font-medium">Campaign Name</label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. Summer Sale Campaign"
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
                                  <span className="text-[11px] font-bold text-[#FF9800] font-mono">
                                    {camp.kmsCovered.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })} km
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[8px] text-slate-400 block uppercase">QR Scans</span>
                                  <span className="text-[11px] font-bold text-blue-600 font-mono">
                                    {camp.qrScans.toLocaleString()}
                                  </span>
                                </div>
                              </div>

                              {/* Verified Live GPS Fleet Audit Breakdown */}
                              <div className="border border-slate-100 rounded-lg overflow-hidden bg-slate-50/50">
                                <button
                                  type="button"
                                  onClick={() => setExpandedFleetCampaignId(expandedFleetCampaignId === camp.id ? null : camp.id)}
                                  className="w-full flex justify-between items-center px-2 py-1.5 bg-slate-100 hover:bg-slate-200/80 transition text-[9px] font-bold text-slate-700 focus:outline-none"
                                >
                                  <span className="flex items-center gap-1">
                                    <Shield size={11} className="text-emerald-600" />
                                    Verify Live Fleet GPS Audit
                                  </span>
                                  <span className="text-[8px] font-mono text-slate-500 flex items-center gap-0.5">
                                    {expandedFleetCampaignId === camp.id ? "Hide Breakdown ▲" : "Show Breakdown ▼"}
                                  </span>
                                </button>

                                {expandedFleetCampaignId === camp.id && (
                                  <div className="p-2 space-y-1.5 border-t border-slate-100 bg-white max-h-48 overflow-y-auto">
                                    <div className="flex justify-between text-[7.5px] text-slate-400 font-mono font-bold uppercase pb-1 border-b border-slate-100">
                                      <span>Vehicle & Driver</span>
                                      <span>Status</span>
                                      <span className="text-right">Metrics (KMs / Scans)</span>
                                    </div>
                                    {getFleetForCampaign(camp).map((vehicle) => (
                                      <div key={vehicle.id} className="flex justify-between items-center text-[9px] py-1 border-b border-slate-50 last:border-0">
                                        <div className="space-y-0.5">
                                          <div className="flex items-center gap-1">
                                            <span className="font-bold text-slate-800">{vehicle.name}</span>
                                            <span className="text-[8px] font-mono bg-slate-100 text-slate-600 px-1 rounded">{vehicle.autoNumber}</span>
                                          </div>
                                          <div className="text-[7.5px] text-slate-400 italic font-medium">{vehicle.location}</div>
                                        </div>
                                        
                                        <div className="flex items-center gap-1">
                                          <div className={`w-1.5 h-1.5 rounded-full ${
                                            vehicle.status === "tracking" ? "bg-green-500 animate-pulse" :
                                            vehicle.status === "online" ? "bg-blue-400" : "bg-slate-300"
                                          }`} />
                                          <span className="text-[8px] font-mono uppercase text-slate-500">
                                            {vehicle.status === "tracking" ? "Active" :
                                             vehicle.status === "online" ? "Standby" : "Offline"}
                                          </span>
                                        </div>

                                        <div className="text-right">
                                          <div className="font-mono font-bold text-[#FF9800]">{vehicle.kms.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })} km</div>
                                          <div className="text-[7.5px] font-mono text-slate-400">{vehicle.scans} scans</div>
                                        </div>
                                      </div>
                                    ))}
                                    <div className="pt-1.5 text-center border-t border-slate-150">
                                      <p className="text-[8px] text-emerald-600 flex items-center justify-center gap-1 font-semibold italic">
                                        <span>✓ GPS telemetry cryptographically verified by AutoAdz Network</span>
                                      </p>
                                    </div>
                                  </div>
                                )}
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
                                  onClick={() => exportCampaignPDF(camp, drivers)}
                                  className="text-[#16A34A] hover:underline font-bold flex items-center gap-0.5 text-[9px]"
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
                          <p className="text-[10px] text-slate-400 mt-1">Live GPS positions from drivers assigned to your campaigns. Updates every 8 seconds.</p>
                        </div>

                        {/* Visual route summary for active campaign */}
                        {campaigns.filter(c => c.status === "active").map((camp) => (
                          <div key={camp.id} className="bg-white p-3 rounded-xl border border-slate-150 shadow-xs space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold text-slate-800 line-clamp-1">{camp.title}</span>
                              <span className="text-[8px] font-mono bg-green-100 text-green-700 px-1.5 rounded">LIVE</span>
                            </div>

                            {/* Live Leaflet Map — all driver positions */}
                            <RouteMap
                              allDrivers={driverPositions}
                              city={camp.city}
                              height="260px"
                            />

                            <div className="text-[9px] text-slate-500 space-y-1">
                              <p className="font-mono flex items-center gap-1 text-slate-700">
                                <Navigation size={10} className="text-[#FF9800]" /> Active Area: <span className="font-sans text-slate-800 font-medium">{camp.area}</span>
                              </p>
                              <p>Driver GPS coordinates are pushed to the server every 10 seconds and displayed here live.</p>
                            </div>
                          </div>
                        ))}

                        {/* Drivers feed */}
                        <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-[#0B1F4D] uppercase tracking-wide">Fleet Status</span>
                            <span className="text-[9px] font-mono bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
                              {drivers.filter(d => d.state === "tracking").length} transmitting
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            {drivers.map(d => {
                              const pos = driverPositions[d.id];
                              return (
                                <div key={d.id} className="flex justify-between items-center text-xs p-2 bg-slate-50 rounded-lg border border-slate-100">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full shrink-0 ${d.state === "tracking" ? "bg-green-500 animate-pulse" : "bg-slate-300"}`}></div>
                                    <div>
                                      <span className="font-semibold text-slate-800">{d.name}</span>
                                      <span className="text-[8px] text-slate-400 font-mono ml-1.5">{d.autoNumber}</span>
                                      {pos && d.state === "tracking" && (
                                        <span className="text-[8px] text-teal-500 font-mono ml-1.5">
                                          {pos.lat.toFixed(4)}, {pos.lng.toFixed(4)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${d.state === "tracking" ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-500"}`}>
                                    {d.state === "tracking" ? "🟢 LIVE" : "STANDBY"}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                      </div>
                    )}

                    {/* ADVERTISER BILLING & ADVANCE INVOICING TAB */}
                    {advertiserTab === "billing" && (
                      <div className="space-y-4 pb-4 max-h-[520px] overflow-y-auto pr-1">
                        {/* Mobile Balance Card */}
                        <div className="bg-gradient-to-r from-[#0B1F4D] to-[#163375] p-4 rounded-2xl text-white shadow-md relative overflow-hidden">
                          <span className="text-[9px] uppercase font-mono tracking-wider text-slate-300">Advance Prepaid Balance</span>
                          <h3 className="text-xl font-display font-black text-[#FF9800] mt-0.5">
                            ₹{(transactions.filter(t => t.userId === "advertiser_main" && t.status === "success").reduce((acc, curr) => curr.type === "deposit" ? acc + curr.amount : acc - curr.amount, 0)).toLocaleString()}
                          </h3>
                          <div className="mt-3 flex gap-2">
                            <input 
                              type="number"
                              placeholder="₹ Add Funds"
                              value={addFundsAmount}
                              onChange={(e) => setAddFundsAmount(e.target.value)}
                              className="bg-white/10 text-white placeholder-slate-400 rounded-lg px-2.5 py-1 text-[11px] w-28 focus:outline-none focus:ring-1 focus:ring-[#FF9800]"
                            />
                            <button 
                              onClick={async () => {
                                const val = parseFloat(addFundsAmount);
                                if (!val || val <= 0) return;
                                try {
                                  await fetch("/api/wallet/transactions", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      userId: "advertiser_main",
                                      type: "deposit",
                                      amount: val,
                                      description: "Self advance deposit through PG Gateway"
                                    })
                                  });
                                  setAddFundsAmount("");
                                  fetchData();
                                } catch (e) {
                                  console.error(e);
                                }
                              }}
                              className="bg-[#FF9800] hover:bg-[#e08600] text-slate-950 font-bold px-3 py-1 rounded-lg text-[10px] font-mono shadow-xs transition cursor-pointer"
                            >
                              DEPOSIT
                            </button>
                          </div>
                        </div>

                        {/* Unpaid Progress Invoices list */}
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-3xs space-y-3">
                          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                            <h5 className="font-bold text-[#0B1F4D] text-xs">Campaign Invoices</h5>
                            <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-mono font-bold">RECONCILIATION</span>
                          </div>

                          <div className="space-y-3">
                            {bills.filter(b => b.type === "advertiser_invoice").map(bill => (
                              <div key={bill.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 space-y-2">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <span className="text-[10px] font-bold text-slate-800 font-mono block">{bill.id}</span>
                                    <span className="text-[9px] text-slate-400 block">{bill.timestamp}</span>
                                  </div>
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold ${
                                    bill.status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700 animate-pulse"
                                  }`}>
                                    {bill.status.toUpperCase()}
                                  </span>
                                </div>
                                
                                <p className="text-[11px] text-slate-600 leading-normal">{bill.description}</p>
                                
                                <div className="flex justify-between items-center pt-1 border-t border-dashed border-slate-200 text-[10px]">
                                  <span className="font-mono text-slate-500">{bill.kmsCovered} KM covered</span>
                                  <span className="font-bold text-slate-900 font-mono text-[11px]">₹{bill.amount.toLocaleString()}</span>
                                </div>

                                {bill.status === "pending" && (
                                  <button
                                    onClick={async () => {
                                      const currentBalance = transactions.filter(t => t.userId === "advertiser_main" && t.status === "success").reduce((acc, curr) => curr.type === "deposit" ? acc + curr.amount : acc - curr.amount, 0);
                                      if (currentBalance < bill.amount) {
                                        alert("✗ Insufficient Advance Balance! Please deposit funds into your advance wallet first.");
                                        return;
                                      }
                                      if (confirm(`Approve settlement of ₹${bill.amount} from your prepaid balance?`)) {
                                        try {
                                          const res = await fetch(`/api/bills/${bill.id}`, {
                                            method: "PUT",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ status: "paid" })
                                          });
                                          if (res.ok) {
                                            alert("✓ Invoice successfully settled!");
                                            fetchData();
                                          }
                                        } catch (e) {
                                          console.error(e);
                                        }
                                      }
                                    }}
                                    className="w-full py-1.5 bg-[#FF9800] hover:bg-orange-500 text-slate-950 font-bold font-mono text-[9px] rounded-lg transition uppercase cursor-pointer"
                                  >
                                    Approve & Pay from Balance
                                  </button>
                                )}
                              </div>
                            ))}
                            {bills.filter(b => b.type === "advertiser_invoice").length === 0 && (
                              <p className="text-[10px] text-slate-400 italic text-center py-2">No invoices issued to your account.</p>
                            )}
                          </div>
                        </div>

                        {/* Payment Logs */}
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-3xs space-y-2">
                          <h5 className="font-bold text-[#0B1F4D] text-xs">Prepaid Ledger History</h5>
                          <div className="space-y-2 max-h-[160px] overflow-y-auto pr-0.5">
                            {transactions.filter(t => t.userId === "advertiser_main").map(tx => (
                              <div key={tx.id} className="flex justify-between items-center text-[10px] border-b border-slate-50 pb-1 font-mono">
                                <div>
                                  <span className="font-bold text-slate-800 block leading-tight text-[9px]">{tx.description}</span>
                                  <span className="text-[8px] text-slate-400 block">{tx.timestamp}</span>
                                </div>
                                <span className={`font-mono font-bold whitespace-nowrap text-[9px] ${tx.type === "deposit" ? "text-green-600" : "text-rose-600"}`}>
                                  {tx.type === "deposit" ? "+" : "-"} ₹{tx.amount.toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ADVERTISER AI STUDY TAB */}
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
                              {advEmail && (
                                <div className="p-3 flex justify-between items-center">
                                  <span className="text-slate-500">Login Email</span>
                                  <span className="font-mono text-slate-800 text-[11px]">{advEmail}</span>
                                </div>
                              )}
                              <div className="p-3 flex justify-between items-center">
                                <span className="text-slate-500">Business Registration</span>
                                <span className="font-mono text-slate-800">{advGstin || "—"}</span>
                              </div>
                              <div className="p-3 flex justify-between items-center">
                                <span className="text-slate-500">Phone Verified</span>
                                <span className="font-medium text-green-600">{advPhone || "—"}</span>
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
                      onClick={() => setAdvertiserTab("billing")}
                      className={`flex flex-col items-center gap-1 ${advertiserTab === "billing" ? "text-[#0B1F4D]" : "text-slate-400"}`}
                    >
                      <Wallet size={16} />
                      <span className="text-[9px] font-bold uppercase tracking-wider">Payments</span>
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
                                    <span className="text-slate-200 text-[10px] font-bold uppercase block font-mono tracking-wider">Trip Time</span>
                                    <span className="text-xs font-bold font-mono text-white block mt-0.5">
                                      {loggedInDriver?.state === "tracking" ? formatDuration(liveSessionSeconds) : "00:00"}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-slate-200 text-[10px] font-bold uppercase block font-mono tracking-wider">Trip Distance</span>
                                    <span className="text-xs font-bold font-mono text-[#FF9800] block mt-0.5">
                                      {loggedInDriver?.state === "tracking" ? liveSessionKms.toFixed(3) : "0.000"} <span className="text-[9px] font-bold text-slate-300">KM</span>
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-slate-200 text-[10px] font-bold uppercase block font-mono tracking-wider">Trip Pay</span>
                                    <span className="text-xs font-bold font-mono text-emerald-400 block mt-0.5">
                                      ₹{loggedInDriver?.state === "tracking" ? (liveSessionKms * driverRatePerKm).toFixed(2) : "0.00"}
                                    </span>
                                  </div>
                                </div>

                                {loggedInDriver?.state === "tracking" && (
                                  <div className="bg-slate-900/60 p-2 rounded-lg border border-white/5 space-y-1.5 text-center my-2">
                                    <span className="text-[8px] font-mono text-slate-400 block text-left uppercase tracking-wider font-bold">🛠️ Sandbox Developer Testing Options:</span>
                                    <div className="flex gap-1.5 justify-center">
                                      <button
                                        onClick={() => {
                                          const addKms = 2.5;
                                          setLiveSessionKms(prev => {
                                            const next = parseFloat((prev + addKms).toFixed(3));
                                            localStorage.setItem("autoadz_live_session_kms", String(next));
                                            return next;
                                          });
                                          setGpsStatus("active");
                                          setGpsSpeed(38.5);
                                          // Trigger a fake coordinates update (Kolkata)
                                          const simCoords1 = { lat: 22.5726 + (Math.random() - 0.5) * 0.02, lng: 88.3639 + (Math.random() - 0.5) * 0.02 };
                                          setLastCoords(simCoords1);
                                          if (loggedInDriver) {
                                            setDriverPositions(prev => ({ ...prev, [loggedInDriver.id]: { ...prev[loggedInDriver.id], ...simCoords1, state: "tracking" } }));
                                            fetch(`/api/drivers/${loggedInDriver.id}/location`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(simCoords1) }).catch(() => {});
                                          }
                                        }}
                                        className="py-1 px-2 bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/30 rounded text-[9px] font-bold text-emerald-400 font-mono transition cursor-pointer"
                                      >
                                        +2.5 KM (Simulate Ride)
                                      </button>
                                      <button
                                        onClick={() => {
                                          const addKms = 5.0;
                                          setLiveSessionKms(prev => {
                                            const next = parseFloat((prev + addKms).toFixed(3));
                                            localStorage.setItem("autoadz_live_session_kms", String(next));
                                            return next;
                                          });
                                          setGpsStatus("active");
                                          setGpsSpeed(45.2);
                                          // Trigger a fake coordinates update (Kolkata)
                                          const simCoords2 = { lat: 22.5726 + (Math.random() - 0.5) * 0.02, lng: 88.3639 + (Math.random() - 0.5) * 0.02 };
                                          setLastCoords(simCoords2);
                                          if (loggedInDriver) {
                                            setDriverPositions(prev => ({ ...prev, [loggedInDriver.id]: { ...prev[loggedInDriver.id], ...simCoords2, state: "tracking" } }));
                                            fetch(`/api/drivers/${loggedInDriver.id}/location`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(simCoords2) }).catch(() => {});
                                          }
                                        }}
                                        className="py-1 px-2 bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/30 rounded text-[9px] font-bold text-emerald-400 font-mono transition cursor-pointer"
                                      >
                                        +5.0 KM (Simulate Ride)
                                      </button>
                                      <button
                                        onClick={() => {
                                          setLiveSessionSeconds(prev => {
                                            const next = prev + 60;
                                            localStorage.setItem("autoadz_live_session_seconds", String(next));
                                            return next;
                                          });
                                        }}
                                        className="py-1 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/50 rounded text-[9px] font-bold text-slate-300 font-mono transition cursor-pointer"
                                      >
                                        +1 Min Time
                                      </button>
                                    </div>
                                  </div>
                                )}

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
                            <div className="space-y-2 bg-slate-950/70 p-3 rounded-xl border border-white/15">
                              <div className="flex justify-between items-center">
                                <h4 className="font-bold text-xs text-red-400">No Active Campaign Linked</h4>
                                <span className="text-[8px] font-mono bg-red-900 text-red-100 px-1.5 py-0.5 rounded font-black uppercase">Inactive</span>
                              </div>
                              <p className="text-[9px] text-white leading-tight font-medium">Choose one of the currently active advertising campaigns below to link your auto-rickshaw instantly:</p>
                              
                              <div className="space-y-1.5 pt-1">
                                <select 
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      handleAllocateCampaign(loggedInDriver.id, e.target.value);
                                    }
                                  }}
                                  className="w-full bg-slate-900 text-white text-[10px] font-mono border border-slate-600 rounded p-1.5 focus:outline-none focus:border-[#FF9800]"
                                  defaultValue=""
                                >
                                  <option value="" disabled className="text-slate-400">-- Select Campaign to Link --</option>
                                  {campaigns.filter(c => c.status === "active").map(c => (
                                    <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                                      {c.title} (₹{c.budget?.toLocaleString()})
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )}

                          <div className="pt-2 border-t border-white/20 flex justify-between items-center text-[10px]">
                            <span className="text-white font-semibold">Earnings rate: <b className="text-emerald-400 font-bold">₹{driverRatePerKm.toFixed(2)} per KM</b></span>
                            <span className="text-amber-400 font-mono font-bold">Target: 40 KM/day</span>
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
                                Session total: <span className="font-bold">{(loggedInDriver?.state === "tracking" ? liveSessionKms : 0).toFixed(2)} KM</span>
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
                                ₹{loggedInDriver?.state === "tracking" ? (liveSessionKms * driverRatePerKm).toFixed(2) : "0.00"}
                              </span>
                              <span className="text-[8px] text-slate-500 font-mono mt-1 block">
                                Session earnings: <span className="font-bold">₹{(loggedInDriver?.state === "tracking" ? liveSessionKms * driverRatePerKm : 0).toFixed(2)}</span>
                              </span>
                            </div>
                          </div>

                          {/* Wallet card — full width */}
                          <div className="col-span-2 bg-gradient-to-r from-[#0B1F4D] to-[#112660] rounded-xl p-3 flex items-center justify-between relative overflow-hidden">
                            <div className="absolute right-2 bottom-0 opacity-10"><Wallet size={52} /></div>
                            <div>
                              <p className="text-[9px] text-slate-400 uppercase font-mono tracking-wider">Driver Wallet</p>
                              <p className="text-lg font-extrabold text-[#FF9800] font-display leading-tight mt-0.5">
                                ₹{(loggedInDriver?.walletBalance ?? 0).toLocaleString()}
                              </p>
                              <p className="text-[9px] text-slate-400 mt-0.5">Available balance</p>
                            </div>
                            <button
                              onClick={() => setDriverTab("earnings")}
                              className="bg-[#FF9800]/20 hover:bg-[#FF9800]/30 text-[#FF9800] text-[9px] font-bold px-3 py-1.5 rounded-lg transition border border-[#FF9800]/30"
                            >
                              Withdraw →
                            </button>
                          </div>
                        </div>

                        {/* Driver identity card */}
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                          <div className="bg-slate-50 px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-[#0B1F4D] uppercase tracking-wide flex items-center gap-1.5">
                              <Shield size={11} className="text-[#FF9800]" /> KYC & Vehicle Status
                            </span>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              loggedInDriver?.kycVerified ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700 animate-pulse"
                            }`}>
                              {loggedInDriver?.kycVerified ? "✓ Verified" : "Pending"}
                            </span>
                          </div>
                          <div className="px-3 py-2.5 space-y-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Driver Name</span>
                              <span className="font-bold text-[#0B1F4D]">{loggedInDriver?.name || "—"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Auto Number</span>
                              <span className="font-mono font-bold text-[#0B1F4D]">{loggedInDriver?.autoNumber || "—"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Phone</span>
                              <span className="font-mono text-slate-700">{loggedInDriver?.phone || "—"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Zone</span>
                              <span className="text-slate-700">{loggedInDriver?.location || "Kolkata"}</span>
                            </div>
                          </div>
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
                              <span className="font-bold text-green-600 font-mono">₹{driverRatePerKm.toFixed(2)} INR</span>
                            </div>
                          </div>
                        </div>

                        {/* Weekly Service Bills / Invoicing */}
                        <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                          <div className="flex justify-between items-center pb-1.5 border-b border-slate-100">
                            <span className="text-[10px] font-bold text-slate-700 block uppercase">
                              🛺 Weekly Service Bills (Weekly Invoices)
                            </span>
                            <span className="text-[8px] bg-indigo-50 text-indigo-600 px-1 font-mono font-bold rounded">
                              DIRECT BANK PAYOUT
                            </span>
                          </div>

                          {/* Action Button to raise a new bill */}
                          {loggedInDriver && loggedInDriver.walletBalance > 0 ? (
                            <button
                              onClick={async () => {
                                const roundedKms = parseFloat((loggedInDriver.walletBalance / driverRatePerKm).toFixed(1));
                                try {
                                  const res = await fetch("/api/bills", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      type: "driver_service_bill",
                                      senderId: loggedInDriver.id,
                                      senderName: loggedInDriver.name,
                                      receiverId: "admin",
                                      amount: loggedInDriver.walletBalance,
                                      kmsCovered: roundedKms,
                                      periodStart: new Date(Date.now() - 7*24*3600*1000).toISOString().split("T")[0],
                                      periodEnd: new Date().toISOString().split("T")[0],
                                      description: `Weekly service billing for GPS verified mileage (${roundedKms} KMs completed at ₹${driverRatePerKm.toFixed(2)}/KM)`
                                    })
                                  });
                                  if (res.ok) {
                                    alert("✓ Weekly Service Bill successfully raised! Sent directly to Admin Ledger for bank payout.");
                                    fetchData();
                                  } else {
                                    alert("Failed to raise service bill. Try again.");
                                  }
                                } catch (e) {
                                  console.error(e);
                                }
                              }}
                              className="w-full py-1.5 bg-orange-500 hover:bg-orange-600 text-slate-950 font-bold font-mono text-[9px] rounded-lg transition uppercase flex items-center justify-center gap-1 cursor-pointer"
                            >
                              ⚡ Raise Bill for ₹{loggedInDriver.walletBalance} ({parseFloat((loggedInDriver.walletBalance / driverRatePerKm).toFixed(1))} KMs)
                            </button>
                          ) : (
                            <div className="text-center text-[10px] text-slate-400 italic py-1">
                              No outstanding balance available to raise a weekly bill.
                            </div>
                          )}

                          {/* List of raised bills */}
                          <div className="space-y-1.5 pt-1.5">
                            <span className="text-[9px] text-slate-400 font-mono block">Billing Requests Status</span>
                            {bills.filter(b => b.senderId === loggedInDriverId).map(bill => (
                              <div key={bill.id} className="p-2 bg-slate-50 border border-slate-150 rounded-lg text-[10px] space-y-1 font-mono">
                                <div className="flex justify-between items-center text-[9px]">
                                  <span className="text-slate-500 font-bold">{bill.id}</span>
                                  <span className={`px-1 rounded text-[8px] font-bold uppercase ${
                                    bill.status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700 animate-pulse"
                                  }`}>
                                    {bill.status}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center text-slate-700 text-[10px]">
                                  <span>{bill.kmsCovered} KMs completed</span>
                                  <span className="font-bold text-slate-900">₹{bill.amount}</span>
                                </div>
                              </div>
                            ))}
                            {bills.filter(b => b.senderId === loggedInDriverId).length === 0 && (
                              <p className="text-[9px] text-slate-400 italic text-center">No weekly service bills filed yet.</p>
                            )}
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

                    {/* DRIVER CAMPAIGNS TAB */}
                    {driverTab === "campaigns" && (
                      <div id="driver-app-campaigns-tab" className="space-y-3 pb-4">
                        <div className="bg-white p-3 rounded-xl border border-slate-200">
                          <h5 className="font-bold text-xs text-[#0B1F4D] flex items-center gap-1.5">
                            <QrCode size={14} className="text-[#FF9800]" /> Campaigns Hub
                          </h5>
                          <p className="text-[10px] text-slate-400 mt-1">Verify dynamic QR stickering, track ad metrics, and unlock physical mileage rewards.</p>
                        </div>

                        {/* Currently Linked Campaign block */}
                        {loggedInDriver?.currentCampaignId ? (
                          (() => {
                            const activeCamp = campaigns.find(c => c.id === loggedInDriver.currentCampaignId);
                            return (
                              <div className="bg-gradient-to-br from-[#0B1F4D] to-slate-900 text-white p-4 rounded-xl border border-slate-800 space-y-3 shadow-md">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <span className="text-[8px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.5 rounded uppercase font-mono tracking-wider">
                                      MY ACTIVE LINK
                                    </span>
                                    <h4 className="font-bold text-xs text-[#FF9800] mt-1 line-clamp-1">{activeCamp?.title || "Edge Fashion Campaign"}</h4>
                                    <p className="text-[9px] text-slate-300 font-mono mt-0.5">ID: {activeCamp?.id}</p>
                                  </div>
                                  <span className="text-right">
                                    <span className="text-[8px] text-slate-400 font-mono block">QR SCANS</span>
                                    <span className="text-xs font-black text-emerald-400 font-mono">{activeCamp?.qrScans || 0} Scans</span>
                                  </span>
                                </div>

                                <div className="p-2 bg-slate-950/60 rounded-lg border border-white/5 space-y-1.5">
                                  <p className="text-[9.5px] text-slate-200 leading-normal">
                                    Verify your physical vehicle's sticker installation QR code to ensure tracking is synchronized correctly and metrics are counted.
                                  </p>
                                  <button
                                    onClick={() => {
                                      if (activeCamp) {
                                        setSelectedCampaignForQr(activeCamp);
                                        setQrScannedResult(null);
                                        setQrVerificationStatus("idle");
                                        setQrFeedbackMessage("");
                                        setQrSimulatedInput("");
                                        setIsQrModalOpen(true);
                                      }
                                    }}
                                    className="w-full bg-[#FF9800] hover:bg-orange-500 text-[#0B1F4D] font-bold py-1.5 px-3 rounded-lg text-[10px] uppercase tracking-wide flex items-center justify-center gap-1.5 transition cursor-pointer"
                                  >
                                    <QrCode size={12} /> Verify QR Code
                                  </button>
                                </div>
                              </div>
                            );
                          })()
                        ) : (
                          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3.5 text-center space-y-1">
                            <AlertCircle size={18} className="mx-auto text-amber-500" />
                            <h5 className="font-bold text-xs">No Active Campaign Linked</h5>
                            <p className="text-[9px] leading-relaxed text-amber-700">Go to the Dashboard tab to select and link an active advertising campaign to your auto-rickshaw.</p>
                          </div>
                        )}

                        {/* List of active platform campaigns driver can participate in */}
                        <div className="space-y-2">
                          <span className="text-[9px] font-bold text-slate-500 uppercase font-mono tracking-wider block">
                            Explore Active Campaigns ({campaigns.filter(c => c.status === "active").length})
                          </span>

                          <div className="space-y-2.5">
                            {campaigns.filter(c => c.status === "active").map((camp) => (
                              <div key={camp.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs transition space-y-2">
                                <div className="flex justify-between items-start gap-1">
                                  <div>
                                    <h4 className="font-bold text-[11px] text-[#0B1F4D] line-clamp-1">{camp.title}</h4>
                                    <p className="text-[8.5px] text-slate-400 font-mono">ID: {camp.id} • {camp.city}</p>
                                  </div>
                                  <span className="bg-emerald-50 text-emerald-700 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border border-emerald-100 uppercase">
                                    ₹{camp.budget?.toLocaleString()} Budget
                                  </span>
                                </div>

                                <div className="grid grid-cols-3 gap-1.5 text-center text-[8.5px] font-mono py-1 bg-slate-50 rounded-lg">
                                  <div>
                                    <span className="text-slate-400 block uppercase text-[7.5px]">Autos</span>
                                    <span className="font-bold text-slate-800">{camp.autosCount} / {camp.allocatedDrivers?.length || 0}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block uppercase text-[7.5px]">Mileage</span>
                                    <span className="font-bold text-[#FF9800]">{camp.kmsCovered} KM</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block uppercase text-[7.5px]">QR Scans</span>
                                    <span className="font-bold text-blue-600">{camp.qrScans || 0}</span>
                                  </div>
                                </div>

                                <div className="flex gap-1.5 pt-0.5">
                                  <button
                                    onClick={() => {
                                      setSelectedCampaignForQr(camp);
                                      setQrScannedResult(null);
                                      setQrVerificationStatus("idle");
                                      setQrFeedbackMessage("");
                                      setQrSimulatedInput("");
                                      setIsQrModalOpen(true);
                                    }}
                                    className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 hover:border-[#0B1F4D]/30 text-[#0B1F4D] text-[10px] font-semibold py-1.5 rounded-lg flex items-center justify-center gap-1 transition shadow-3xs cursor-pointer"
                                  >
                                    <QrCode size={11} /> Verify QR
                                  </button>
                                  {loggedInDriver && loggedInDriver.currentCampaignId !== camp.id && (
                                    <button
                                      onClick={() => handleAllocateCampaign(loggedInDriver.id, camp.id)}
                                      className="bg-[#0B1F4D] hover:bg-slate-800 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition"
                                    >
                                      Link
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
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
                      id="driver-app-campaigns-tab"
                      onClick={() => setDriverTab("campaigns")}
                      className={`flex flex-col items-center gap-1 ${driverTab === "campaigns" ? "text-[#0B1F4D]" : "text-slate-400"}`}
                    >
                      <QrCode size={16} />
                      <span className="text-[9px] font-bold uppercase tracking-wider">Campaigns</span>
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
              <div className="lg:col-span-12 flex flex-col gap-6">
                
                {/* ── Admin Command Header ─────────────────────────────── */}
                <div className="bg-gradient-to-br from-[#0B1F4D] to-[#112660] rounded-3xl overflow-hidden shadow-lg">
                  {/* Top bar */}
                  <div className="px-6 pt-5 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#FF9800]/20 flex items-center justify-center">
                        <Shield size={20} className="text-[#FF9800]" />
                      </div>
                      <div>
                        <h3 className="font-display font-extrabold text-white text-lg leading-tight">Command Center</h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">AutoAdz Master Admin — KYC · Proofs · Payments · Config</p>
                      </div>
                    </div>
                    {/* Quick KPI strip */}
                    <div className="flex gap-3 flex-wrap">
                      {[
                        { label: "Campaigns", value: campaigns.length, color: "text-[#FF9800]" },
                        { label: "Drivers", value: drivers.length, color: "text-emerald-400" },
                        { label: "Pending Proofs", value: proofs.filter(p => p.status === "pending").length, color: "text-amber-400" },
                        { label: "Total KM", value: `${totalKmsAll.toFixed(1)}`, color: "text-sky-400" },
                      ].map((k) => (
                        <div key={k.label} className="bg-white/10 border border-white/15 rounded-xl px-4 py-2 text-center min-w-[72px]">
                          <p className={`text-lg font-extrabold font-display leading-none ${k.color}`}>{k.value}</p>
                          <p className="text-[9px] text-slate-300 mt-0.5 uppercase tracking-wide font-mono">{k.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tab nav */}
                  <div className="flex border-t border-white/10 overflow-x-auto">
                    {([
                      { key: "campaigns",   icon: <Rocket size={13} />,    label: "Campaigns",    count: campaigns.length },
                      { key: "drivers",     icon: <Truck size={13} />,     label: "Drivers KYC",  count: drivers.length },
                      { key: "proofs",      icon: <Camera size={13} />,    label: "Audit Proofs", count: proofs.length },
                      { key: "advertisers", icon: <Building size={13} />,  label: "Advertisers",  count: advertisers.length },
                      { key: "cities",      icon: <MapPin size={13} />,    label: "Cities",       count: cities.length },
                      { key: "finance_crm", icon: <DollarSign size={13} />,label: "Finance & CRM",count: bills.length },
                      { key: "settings",    icon: <Settings size={13} />,  label: "Gateway",      count: null },
                    ] as const).map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setAdminTab(tab.key)}
                        className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
                          adminTab === tab.key
                            ? "border-[#FF9800] text-[#FF9800] bg-white/8"
                            : "border-transparent text-slate-200 hover:text-white hover:bg-white/8"
                        }`}
                      >
                        {tab.icon}
                        {tab.label}
                        {tab.count !== null && (
                          <span className={`ml-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                            adminTab === tab.key ? "bg-[#FF9800]/20 text-[#FF9800]" : "bg-white/10 text-slate-400"
                          }`}>
                            {tab.count}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

          {/* Dynamic Admin Viewports */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 flex-1 min-h-[420px] flex flex-col">

            {/* ADMIN CAMPAIGNS SUB-TAB */}
            {adminTab === "campaigns" && (
              <div className="space-y-4 flex-1 flex flex-col">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <div>
                    <h4 className="font-display font-bold text-sm text-[#0B1F4D] flex items-center gap-2">
                      <Rocket size={14} className="text-[#FF9800]" /> Campaign Booking Approvals
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Funds are auto-held from advertiser wallets on booking</p>
                  </div>
                  <span className="text-[10px] font-mono bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full font-semibold">
                    {campaigns.filter(c => c.status === "pending").length} awaiting approval
                  </span>
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
                        <th className="py-2.5">Action Status</th>
                        <th className="py-2.5 text-right">Actions</th>
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
                          <td className="py-3">
                            <div className="flex flex-col gap-2">
                              {/* Campaign Status approval */}
                              <div>
                                {camp.status === "pending" ? (
                                  <div className="flex gap-1.5">
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
                              <div className="bg-slate-50 p-2 rounded-lg border border-slate-150 flex flex-col items-start gap-1 mt-1 max-w-[180px]">
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
                            </div>
                          </td>
                          <td className="py-3 text-right">
                            {/* Admin Delete Campaign Button */}
                            <button
                              onClick={async () => {
                                if (confirm(`Are you sure you want to permanently delete the campaign "${camp.title}"?`)) {
                                  const res = await fetch(`/api/campaigns/${camp.id}`, { method: "DELETE" });
                                  if (res.ok) {
                                    fetchData();
                                  }
                                }
                              }}
                              className="text-rose-600 hover:text-white hover:bg-rose-600 px-3 py-1.5 rounded-lg border border-rose-200 hover:border-rose-600 transition text-[10px] font-semibold inline-flex items-center gap-1 shadow-2xs hover:shadow-sm"
                              title="Delete Campaign"
                            >
                              <Trash2 size={12} /> Delete Campaign
                            </button>
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
                <div className="flex justify-between items-center pb-3 border-b border-slate-100 flex-wrap gap-2">
                  <div>
                    <h4 className="font-display font-bold text-sm text-[#0B1F4D] flex items-center gap-2">
                      <Truck size={14} className="text-[#FF9800]" /> Driver Registrations & KYC Vault
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {drivers.filter(d => d.status === "pending_approval").length} pending approval · {drivers.filter(d => d.status === "active").length} active carriers
                    </p>
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
                        <th className="py-2.5 text-center">Verification Status</th>
                        <th className="py-2.5 text-right">Actions</th>
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
                          <td className="py-3 text-center">
                            {/* Verification status controls */}
                            {driver.status === "pending_approval" ? (
                              <div className="flex justify-center gap-1.5">
                                <button
                                  onClick={() => handleVerifyDriver(driver.id, true)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded text-[10px] font-bold transition flex items-center gap-0.5"
                                >
                                  <Check size={10} /> Accept
                                </button>
                                <button
                                  onClick={() => handleVerifyDriver(driver.id, false)}
                                  className="bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 rounded text-[10px] font-bold transition"
                                >
                                  Decline
                                </button>
                              </div>
                            ) : (
                              <span className="text-[9px] font-mono font-bold uppercase text-green-700 bg-green-50 px-2 py-1 rounded border border-green-200">
                                {driver.status === "active" ? "ACTIVE CARRIER" : "REJECTED"}
                              </span>
                            )}
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Edit Driver details */}
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
                                className="text-slate-600 hover:text-[#0B1F4D] hover:bg-slate-50 px-2.5 py-1.5 border border-slate-200 hover:border-[#0B1F4D]/40 rounded-lg transition bg-white flex items-center gap-1 text-[10px] font-semibold"
                                title="Edit Driver Details"
                                id={`btn-edit-driver-${driver.id}`}
                              >
                                <Edit size={12} /> Edit
                              </button>
                              {/* Delete Driver */}
                              <button
                                onClick={() => handleAdminDeleteDriver(driver.id)}
                                className="text-rose-600 hover:text-white hover:bg-rose-600 px-2.5 py-1.5 border border-rose-200 hover:border-rose-600 rounded-lg transition bg-white flex items-center gap-1 text-[10px] font-semibold animate-none"
                                title="Delete Driver"
                                id={`btn-delete-driver-${driver.id}`}
                              >
                                <Trash2 size={12} /> Delete
                              </button>
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
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <div>
                    <h4 className="font-display font-bold text-sm text-[#0B1F4D] flex items-center gap-2">
                      <Camera size={14} className="text-[#FF9800]" /> Photo Proof Audit
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Verify daily vehicle display check-in uploads</p>
                  </div>
                  <span className="text-[10px] font-mono bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full font-semibold">
                    {proofs.filter(p => p.status === "pending").length} pending review
                  </span>
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
                              <ThumbsUp size={10} /> Approve Check-in
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

            {/* ADMIN ADVERTISERS TAB */}
            {adminTab === "advertisers" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">Brand Advertiser Accounts</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">{advertisers.length} registered brands</p>
                  </div>
                </div>
                {advertisers.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    <Building size={32} className="mx-auto mb-2 opacity-30" />
                    <p>No brand accounts registered yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {advertisers.map((adv: any) => {
                      const advCamps = campaigns.filter(c => c.advertiserId === adv.id);
                      return (
                        <div key={adv.id} className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-[#0B1F4D] text-white rounded-full flex items-center justify-center font-bold text-xs shrink-0">
                              {adv.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-xs text-slate-800 truncate">{adv.name}</p>
                              <p className="text-[10px] text-slate-500 truncate">{adv.company || "—"}</p>
                            </div>
                            <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 ${adv.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                              {adv.isActive ? "ACTIVE" : "DISABLED"}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-600 border-t border-slate-100 pt-2">
                            <span className="truncate">📧 {adv.email}</span>
                            <span>📱 {adv.phone || "—"}</span>
                            <span>🏢 GSTIN: {adv.gstin || "—"}</span>
                            <span>📋 Campaigns: <b>{advCamps.length}</b></span>
                          </div>
                          {advCamps.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {advCamps.map(c => (
                                <span key={c.id} className="text-[9px] bg-[#FF9800]/10 text-[#FF9800] border border-[#FF9800]/20 px-2 py-0.5 rounded-full font-mono">
                                  {c.title}
                                </span>
                              ))}
                            </div>
                          )}
                          {/* Action buttons */}
                          <div className="flex gap-2 border-t border-slate-100 pt-2">
                            <button
                              onClick={async () => {
                                const action = adv.isActive ? "disable" : "enable";
                                if (!confirm(`${action.toUpperCase()} account for ${adv.name}?`)) return;
                                await fetch(`/api/advertisers/${adv.id}/status`, {
                                  method: "PUT",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ isActive: !adv.isActive }),
                                });
                                setAdvertisers(prev => prev.map(a => a.id === adv.id ? { ...a, isActive: !adv.isActive } : a));
                              }}
                              className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold font-mono transition ${adv.isActive ? "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100" : "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"}`}
                            >
                              {adv.isActive ? "⛔ DISABLE" : "✅ ENABLE"}
                            </button>
                            <button
                              onClick={async () => {
                                if (!confirm(`PERMANENTLY DELETE account for ${adv.name} (${adv.email})? This cannot be undone.`)) return;
                                await fetch(`/api/advertisers/${adv.id}`, { method: "DELETE" });
                                setAdvertisers(prev => prev.filter(a => a.id !== adv.id));
                              }}
                              className="flex-1 py-1.5 rounded-lg text-[10px] font-bold font-mono bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition"
                            >
                              🗑 DELETE
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 uppercase font-mono font-bold block">Admin WhatsApp Phone Number</label>
                        <input
                          type="text"
                          value={systemAdminWhatsAppPhone}
                          onChange={(e) => setSystemAdminWhatsAppPhone(e.target.value)}
                          placeholder="e.g. 9836130393"
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#10B981]"
                        />
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-200">
                      <p className="text-[9px] text-slate-400 italic font-mono leading-none">
                        Sends automated WhatsApp notifications to the admin when a new driver registers or when a new campaign is created.
                      </p>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!systemAdminWhatsAppPhone) {
                            alert("Please enter your Admin WhatsApp phone number first.");
                            return;
                          }
                          const confirmTest = confirm(`Send a test WhatsApp notification to ${systemAdminWhatsAppPhone}?`);
                          if (confirmTest) {
                            try {
                              const res = await fetch("/api/whatsapp/send", {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json"
                                },
                                body: JSON.stringify({
                                  token: systemWhatsAppToken,
                                  phoneId: systemWhatsAppPhoneId,
                                  recipient: systemAdminWhatsAppPhone,
                                  message: "🔔 *AutoAdz Integration Test!* Your WhatsApp API channel is now successfully connected to AutoAdz platform."
                                })
                              });
                              const data = await res.json();
                              if (res.ok) {
                                alert(`✓ Test message successfully queued for transmission to ${systemAdminWhatsAppPhone}! Please check your WhatsApp.`);
                              } else {
                                const errorMsg = typeof data.error === "object" && data.error !== null
                                  ? (data.error.message || JSON.stringify(data.error))
                                  : (data.error || "Please check your credentials token or Phone ID.");
                                alert(`✗ Failed: ${errorMsg}`);
                              }
                            } catch (err: any) {
                              alert(`Error sending test message: ${err.message}`);
                            }
                          }
                        }}
                        className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wide transition uppercase flex items-center gap-1.5 shadow-2xs hover:shadow-sm cursor-pointer"
                      >
                        ⚡ Send Test Alert
                      </button>
                    </div>
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

                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
                    <h5 className="font-bold text-slate-800 text-xs flex items-center gap-1">
                      🛺 Global Driver Reimbursement & Payout Rates
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 uppercase font-mono font-bold block">Driver Payout Rate (₹ / KM)</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={driverRatePerKm}
                          onChange={(e) => setDriverRatePerKm(parseFloat(e.target.value) || 0)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#10B981]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 uppercase font-mono font-bold block">Mileage Billing Threshold (KM)</label>
                        <input
                          type="number"
                          min="1"
                          value={schedulerThreshold}
                          onChange={(e) => setSchedulerThreshold(parseInt(e.target.value) || 0)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#10B981]"
                        />
                      </div>
                    </div>
                    <p className="text-[9px] text-slate-400 italic font-mono leading-none">
                      Determines the payment drivers receive per GPS-verified kilometer and the milestone needed to trigger automated billing.
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#10B981] hover:bg-emerald-600 text-white font-bold font-mono text-xs rounded-xl transition shadow-xs uppercase cursor-pointer text-center"
                  >
                    💾 Save & Verify Gateway Connections
                  </button>
                </form>
              </div>
            )}

            {/* ADMIN FINANCE CRM & LEDGER TAB */}
            {adminTab === "finance_crm" && (
              <div className="space-y-6 flex-1 flex flex-col">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-2 border-b border-slate-100 gap-2">
                  <div>
                    <h4 className="font-bold text-sm text-[#0B1F4D] uppercase font-mono tracking-wider">Financial Ledger & CRM Control</h4>
                    <p className="text-[11px] text-slate-400">Reconcile advance advertiser payments, manage weekly driver invoices & service bills.</p>
                  </div>
                  
                  {/* Sub tab navigation */}
                  <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px] font-bold">
                    <button
                      onClick={() => setFinanceSubTab("overview")}
                      className={`px-2.5 py-1 rounded-md transition ${financeSubTab === "overview" ? "bg-white text-[#0B1F4D] shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}
                    >
                      📊 Overview
                    </button>
                    <button
                      onClick={() => setFinanceSubTab("advertiser_bills")}
                      className={`px-2.5 py-1 rounded-md transition ${financeSubTab === "advertiser_bills" ? "bg-white text-[#0B1F4D] shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}
                    >
                      🏢 Ad Invoices
                    </button>
                    <button
                      onClick={() => setFinanceSubTab("driver_bills")}
                      className={`px-2.5 py-1 rounded-md transition ${financeSubTab === "driver_bills" ? "bg-white text-[#0B1F4D] shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}
                    >
                      🛺 Driver Bills
                    </button>
                    <button
                      onClick={() => setFinanceSubTab("ledger")}
                      className={`px-2.5 py-1 rounded-md transition ${financeSubTab === "ledger" ? "bg-white text-[#0B1F4D] shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}
                    >
                      📓 Transaction Ledger
                    </button>
                    <button
                      onClick={() => setFinanceSubTab("scheduler")}
                      className={`px-2.5 py-1 rounded-md transition ${financeSubTab === "scheduler" ? "bg-white text-[#0B1F4D] shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}
                    >
                      ⚙️ Auto Billing
                    </button>
                  </div>
                </div>

                {/* OVERVIEW SECTION */}
                {financeSubTab === "overview" && (
                  <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {/* Income */}
                      <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-4 text-emerald-950">
                        <span className="text-[10px] text-emerald-600 uppercase font-mono font-bold tracking-wide">Deposits Recieved</span>
                        <h3 className="text-xl font-display font-black text-emerald-700 mt-1">
                          ₹{(
                            transactions
                              .filter(t => t.userId === "advertiser_main" && t.type === "deposit" && t.status === "success")
                              .reduce((acc, curr) => acc + curr.amount, 0) +
                            bills
                              .filter(b => b.type === "advertiser_invoice" && b.status === "paid")
                              .reduce((acc, curr) => acc + curr.amount, 0)
                          ).toLocaleString()}
                        </h3>
                        <p className="text-[9px] text-emerald-600 font-mono mt-0.5">Real-time campaigns revenue</p>
                      </div>

                      {/* Expenditure */}
                      <div className="bg-rose-50/70 border border-rose-100 rounded-2xl p-4 text-rose-950">
                        <span className="text-[10px] text-rose-600 uppercase font-mono font-bold tracking-wide">Payments to Drivers</span>
                        <h3 className="text-xl font-display font-black text-rose-700 mt-1">
                          ₹{(
                            bills
                              .filter(b => b.type === "driver_service_bill" && b.status === "paid")
                              .reduce((acc, curr) => acc + curr.amount, 0) +
                            drivers.length * 150
                          ).toLocaleString()}
                        </h3>
                        <p className="text-[9px] text-rose-600 font-mono mt-0.5">Paid service bills + printing stickers</p>
                      </div>

                      {/* Net Margin / Agency Spread */}
                      <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 text-indigo-950">
                        <span className="text-[10px] text-indigo-600 uppercase font-mono font-bold tracking-wide">Agency Profit Margin</span>
                        <h3 className="text-xl font-display font-black text-indigo-700 mt-1">
                          ₹{(
                            (transactions
                              .filter(t => t.userId === "advertiser_main" && t.type === "deposit" && t.status === "success")
                              .reduce((acc, curr) => acc + curr.amount, 0) +
                            bills
                              .filter(b => b.type === "advertiser_invoice" && b.status === "paid")
                              .reduce((acc, curr) => acc + curr.amount, 0)) -
                            (bills
                              .filter(b => b.type === "driver_service_bill" && b.status === "paid")
                              .reduce((acc, curr) => acc + curr.amount, 0) +
                            drivers.length * 150)
                          ).toLocaleString()}
                        </h3>
                        <p className="text-[9px] text-indigo-600 font-mono mt-0.5">Net profit spread margin</p>
                      </div>

                      {/* Liability holding */}
                      <div className="bg-amber-50/70 border border-amber-100 rounded-2xl p-4 text-amber-950">
                        <span className="text-[10px] text-amber-600 uppercase font-mono font-bold tracking-wide">Accrued Unpaid Liability</span>
                        <h3 className="text-xl font-display font-black text-amber-700 mt-1">
                          ₹{drivers.reduce((acc, curr) => acc + (curr.walletBalance || 0), 0).toLocaleString()}
                        </h3>
                        <p className="text-[9px] text-amber-600 font-mono mt-0.5">Unpaid active driver balances</p>
                      </div>
                    </div>

                    {/* Quick Raise Advertiser Bill Form */}
                    <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-4">
                      <div>
                        <h5 className="font-bold text-slate-800 text-xs flex items-center gap-1">
                          🏢 Raised Advertiser Bill Tool (Advance / Progress Invoicing)
                        </h5>
                        <p className="text-[11px] text-slate-400">Generate a custom invoice based on campaign GPS kilometers covered during the billing week.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 uppercase font-mono font-bold block">Select Target Campaign</label>
                          <select
                            value={selectedCampIdForInvoice}
                            onChange={(e) => {
                              const cid = e.target.value;
                              setSelectedCampIdForInvoice(cid);
                              const cmp = campaigns.find(c => c.id === cid);
                              if (cmp) {
                                const kCovered = Math.floor(cmp.kmsCovered || 0);
                                setInvoiceKms(String(kCovered));
                                setInvoiceAmount(String(kCovered * 20));
                                setInvoiceDesc(`Weekly Advertising Progress Mileage Invoice - Completed ${kCovered} KMs on active routes`);
                              }
                            }}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500"
                          >
                            <option value="">-- Choose Campaign --</option>
                            {campaigns.map(c => (
                              <option key={c.id} value={c.id}>{c.title} ({c.client})</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 uppercase font-mono font-bold block">Billing KMs Covered</label>
                          <input
                            type="number"
                            placeholder="e.g. 500"
                            value={invoiceKms}
                            onChange={(e) => setInvoiceKms(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 uppercase font-mono font-bold block">Invoice Amount (₹)</label>
                          <input
                            type="number"
                            placeholder="e.g. 10000"
                            value={invoiceAmount}
                            onChange={(e) => setInvoiceAmount(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 uppercase font-mono font-bold block">Period Start Date</label>
                          <input
                            type="date"
                            value={invoicePeriodStart}
                            onChange={(e) => setInvoicePeriodStart(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 uppercase font-mono font-bold block">Period End Date</label>
                          <input
                            type="date"
                            value={invoicePeriodEnd}
                            onChange={(e) => setInvoicePeriodEnd(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 uppercase font-mono font-bold block">Invoice Narrative (Description)</label>
                          <input
                            type="text"
                            placeholder="Progress Billing..."
                            value={invoiceDesc}
                            onChange={(e) => setInvoiceDesc(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500"
                          />
                        </div>
                      </div>

                      <button
                        onClick={async () => {
                          if (!selectedCampIdForInvoice || !invoiceAmount) {
                            alert("Please select a campaign and input a billing amount.");
                            return;
                          }
                          const campaignObj = campaigns.find(c => c.id === selectedCampIdForInvoice);
                          try {
                            const res = await fetch("/api/bills", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                type: "advertiser_invoice",
                                senderId: "admin",
                                senderName: "AutoAdz Admin",
                                receiverId: "advertiser_main",
                                campaignId: selectedCampIdForInvoice,
                                amount: parseFloat(invoiceAmount),
                                kmsCovered: parseFloat(invoiceKms || "0"),
                                periodStart: invoicePeriodStart || new Date(Date.now() - 7*24*3600*1000).toISOString().split("T")[0],
                                periodEnd: invoicePeriodEnd || new Date().toISOString().split("T")[0],
                                description: invoiceDesc || `Weekly Advertising Mileage Progress Invoice for campaign: ${campaignObj?.title || ""}`
                              })
                            });
                            if (res.ok) {
                              alert("✓ Campaign Invoice Raised successfully!");
                              setSelectedCampIdForInvoice("");
                              setInvoiceAmount("");
                              setInvoiceKms("");
                              setInvoiceDesc("");
                              fetchData();
                            } else {
                              alert("Failed to create campaign invoice.");
                            }
                          } catch (e) {
                            console.error(e);
                          }
                        }}
                        className="py-2.5 px-4 bg-orange-500 hover:bg-orange-600 text-slate-950 font-bold font-mono text-xs rounded-xl transition shadow-xs uppercase flex items-center gap-1.5 cursor-pointer"
                      >
                        ⚡ RAISE WEEKLY ADVANCE BILL
                      </button>
                    </div>

                    {/* Operational Expenditure Ledger Explanation */}
                    <div className="bg-slate-50/50 border border-slate-200/80 rounded-2xl p-4 text-xs space-y-2">
                      <h5 className="font-bold text-slate-800 uppercase font-mono tracking-wide text-[10px]">🏢 Real-time Operational Breakdown</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-600">
                        <div>
                          <p className="font-bold text-slate-700">Income Stream Details:</p>
                          <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px]">
                            <li>Advance Advertiser Campaign Pre-bookings</li>
                            <li>Weekly progress invoices raised for metered GPS telemetry KMs</li>
                            <li>Payment settled instantly through advertiser wallets</li>
                          </ul>
                        </div>
                        <div>
                          <p className="font-bold text-slate-700">Expenditure Stream Details:</p>
                          <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px]">
                            <li>Ricshaw driver weekly GPS service billing payouts (e.g. ₹15/KM Kolkata, ₹20/KM Bangalore)</li>
                            <li>Static Vinyl Branding print & pasting setup fees (Fixed ₹150 per rickshaw auto)</li>
                            <li>Real-time verification operations audit expense</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ADVERTISER INVOICES TAB */}
                {financeSubTab === "advertiser_bills" && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h5 className="font-bold text-slate-800 text-xs uppercase font-mono">Issued Campaign Progress Invoices</h5>
                      <span className="text-[10px] text-slate-500 font-mono">These are charged to advertiser advance budgets</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-700">
                        <thead>
                          <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase font-mono">
                            <th className="py-2.5">Bill ID / Date</th>
                            <th className="py-2.5">Campaign Title</th>
                            <th className="py-2.5">KMs Billed</th>
                            <th className="py-2.5">Amount</th>
                            <th className="py-2.5">Billing Cycle</th>
                            <th className="py-2.5">Status</th>
                            <th className="py-2.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {bills.filter(b => b.type === "advertiser_invoice").map(bill => {
                            const camp = campaigns.find(c => c.id === bill.campaignId);
                            return (
                              <tr key={bill.id} className="hover:bg-slate-50/50 transition">
                                <td className="py-3 font-mono text-[11px]">
                                  <span className="font-bold text-slate-800 block">{bill.id}</span>
                                  <span className="text-slate-400 text-[9px]">{bill.timestamp}</span>
                                </td>
                                <td className="py-3 font-medium text-slate-800">
                                  {camp?.title || "Direct Account Balance"}
                                  <span className="block text-[10px] text-slate-400 font-normal">Client: {camp?.client || "Advertiser Principal"}</span>
                                </td>
                                <td className="py-3 font-mono font-bold text-slate-600">{bill.kmsCovered} KM</td>
                                <td className="py-3 font-bold text-slate-900 font-mono">₹{bill.amount.toLocaleString()}</td>
                                <td className="py-3 font-mono text-[10px] text-slate-500">{bill.periodStart} to {bill.periodEnd}</td>
                                <td className="py-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    bill.status === "paid" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500 animate-pulse"
                                  }`}>
                                    {bill.status.toUpperCase()}
                                  </span>
                                </td>
                                <td className="py-3 text-right">
                                  {bill.status === "pending" && (
                                    <button
                                      onClick={async () => {
                                        if (confirm(`Approve settlement of ₹${bill.amount} from advertiser's pre-paid advance wallet?`)) {
                                          try {
                                            const res = await fetch(`/api/bills/${bill.id}`, {
                                              method: "PUT",
                                              headers: { "Content-Type": "application/json" },
                                              body: JSON.stringify({ status: "paid" })
                                            });
                                            if (res.ok) {
                                              alert("✓ Invoice successfully settled!");
                                              fetchData();
                                            }
                                          } catch (e) {
                                            console.error(e);
                                          }
                                        }
                                      }}
                                      className="px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white font-mono text-[10px] font-bold rounded-lg transition cursor-pointer"
                                    >
                                      Settlement via Wallet
                                    </button>
                                  )}
                                  {bill.status === "paid" && (
                                    <span className="text-[10px] font-mono text-slate-400 italic">Settled ✔</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                          {bills.filter(b => b.type === "advertiser_invoice").length === 0 && (
                            <tr>
                              <td colSpan={7} className="py-8 text-center text-slate-400 italic">No advertiser invoices created yet.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* DRIVER SERVICE BILLS TAB */}
                {financeSubTab === "driver_bills" && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h5 className="font-bold text-slate-800 text-xs uppercase font-mono">Weekly Driver Service Bills (Payout Requests)</h5>
                      <span className="text-[10px] text-slate-400">Approved driver service bills deduct their online wallet balance</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-700">
                        <thead>
                          <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase font-mono">
                            <th className="py-2.5">Bill ID / Date</th>
                            <th className="py-2.5">Driver Name</th>
                            <th className="py-2.5">KMs Metered</th>
                            <th className="py-2.5">Requested Amount</th>
                            <th className="py-2.5">Billing Cycle</th>
                            <th className="py-2.5">Status</th>
                            <th className="py-2.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {bills.filter(b => b.type === "driver_service_bill").map(bill => {
                            const dvr = drivers.find(d => d.id === bill.senderId);
                            return (
                              <tr key={bill.id} className="hover:bg-slate-50/50 transition">
                                <td className="py-3 font-mono text-[11px]">
                                  <span className="font-bold text-slate-800 block">{bill.id}</span>
                                  <span className="text-slate-400 text-[9px]">{bill.timestamp}</span>
                                </td>
                                <td className="py-3 font-medium text-slate-800">
                                  {bill.senderName}
                                  <span className="block text-[10px] text-slate-400 font-normal">Auto: {dvr?.autoNumber || "WB-01-EX-1234"}</span>
                                </td>
                                <td className="py-3 font-mono text-slate-600 font-bold">{bill.kmsCovered} KM</td>
                                <td className="py-3 font-bold text-slate-900 font-mono">₹{bill.amount.toLocaleString()}</td>
                                <td className="py-3 font-mono text-[10px] text-slate-500">{bill.periodStart} to {bill.periodEnd}</td>
                                <td className="py-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    bill.status === "paid" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500 animate-pulse"
                                  }`}>
                                    {bill.status.toUpperCase()}
                                  </span>
                                </td>
                                <td className="py-3 text-right">
                                  {bill.status === "pending" && (
                                    <button
                                      onClick={async () => {
                                        if (confirm(`Approve bank transfer payout of ₹${bill.amount} to driver ${bill.senderName}?`)) {
                                          try {
                                            const res = await fetch(`/api/bills/${bill.id}`, {
                                              method: "PUT",
                                              headers: { "Content-Type": "application/json" },
                                              body: JSON.stringify({ status: "paid" })
                                            });
                                            if (res.ok) {
                                              alert(`✓ Driver weekly bill settled successfully! Payout of ₹${bill.amount} dispatched to bank account.`);
                                              fetchData();
                                            }
                                          } catch (e) {
                                            console.error(e);
                                          }
                                        }
                                      }}
                                      className="px-2 py-1 bg-teal-500 hover:bg-teal-600 text-slate-950 font-mono text-[10px] font-bold rounded-lg transition cursor-pointer"
                                    >
                                      Disburse Payout
                                    </button>
                                  )}
                                  {bill.status === "paid" && (
                                    <span className="text-[10px] font-mono text-slate-400 italic">Disbursed ✔</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                          {bills.filter(b => b.type === "driver_service_bill").length === 0 && (
                            <tr>
                              <td colSpan={7} className="py-8 text-center text-slate-400 italic">No driver weekly service bills found.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* TRANSACTION LEDGER */}
                {financeSubTab === "ledger" && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h5 className="font-bold text-slate-800 text-xs uppercase font-mono">Consolidated Ledger Book</h5>
                      <span className="text-[10px] text-slate-400 font-mono">Reflects all real-time advertiser wallet and payout operations</span>
                    </div>

                    <div className="overflow-y-auto max-h-96">
                      <table className="w-full text-left text-xs text-slate-700">
                        <thead>
                          <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase font-mono">
                            <th className="py-2">Date / Time</th>
                            <th className="py-2">Entity ID</th>
                            <th className="py-2">Type</th>
                            <th className="py-2">Narrative</th>
                            <th className="py-2 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 font-mono">
                          {transactions.map(tx => (
                            <tr key={tx.id} className="hover:bg-slate-50/50 transition">
                              <td className="py-2.5 text-slate-400 text-[10px]">{tx.timestamp}</td>
                              <td className="py-2.5 text-slate-600 text-[11px] font-bold">{tx.userId}</td>
                              <td className="py-2.5">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                  tx.type === "deposit" || tx.type === "earning" ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                                }`}>
                                  {tx.type.toUpperCase()}
                                </span>
                              </td>
                              <td className="py-2.5 text-slate-600 text-[11px]">{tx.description}</td>
                              <td className={`py-2.5 text-right font-bold text-[11px] ${
                                tx.type === "deposit" || tx.type === "earning" ? "text-emerald-600" : "text-rose-600"
                              }`}>
                                {tx.type === "deposit" || tx.type === "earning" ? "+" : "-"} ₹{tx.amount.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* BILLING SCHEDULER CONTROLS & SETTINGS */}
                {financeSubTab === "scheduler" && (
                  <div className="space-y-6">
                    <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <h5 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 uppercase font-mono">
                            ⚙️ Automated Weekly Driver Service Bill Generator
                          </h5>
                          <p className="text-[11px] text-slate-500">
                            Configure or trigger the automated job that aggregates weekly telemetry and posts pending bills for high-mileage drivers.
                          </p>
                        </div>
                        
                        {/* Status Toggle */}
                        <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200">
                          <span className="text-[10px] font-mono font-bold uppercase text-slate-500">Scheduler Status:</span>
                          <button
                            onClick={async () => {
                              try {
                                const res = await fetch("/api/scheduler/settings", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ enabled: !schedulerEnabled })
                                });
                                if (res.ok) {
                                  const data = await res.json();
                                  setSchedulerEnabled(data.settings.enabled);
                                  fetchData();
                                }
                              } catch (e) {
                                console.error(e);
                              }
                            }}
                            className={`px-3 py-1 rounded-lg text-[10px] font-mono font-black transition cursor-pointer ${
                              schedulerEnabled 
                                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-200" 
                                : "bg-slate-200 text-slate-500 border border-slate-300"
                            }`}
                          >
                            {schedulerEnabled ? "● ACTIVE" : "○ DISABLED"}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                        {/* Configure Threshold and Driver Rate */}
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-4">
                          <div>
                            <h6 className="font-mono font-bold text-xs text-[#0B1F4D] uppercase">
                              🔧 Billing & Rate Settings
                            </h6>
                            <p className="text-[11px] text-slate-400 leading-normal">
                              Configure the conditions and rates used for automated billing schedules and driver mileage payouts.
                            </p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] text-slate-500 uppercase font-mono font-bold block">
                                Mileage Threshold (KM)
                              </label>
                              <input
                                type="number"
                                min="1"
                                placeholder="e.g. 10"
                                value={schedulerThreshold}
                                onChange={(e) => setSchedulerThreshold(parseInt(e.target.value) || 0)}
                                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] text-slate-500 uppercase font-mono font-bold block">
                                Driver Payout Rate (₹/KM)
                              </label>
                              <input
                                type="number"
                                step="0.1"
                                min="0.1"
                                placeholder="e.g. 4.5"
                                value={driverRatePerKm}
                                onChange={(e) => setDriverRatePerKm(parseFloat(e.target.value) || 0)}
                                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500"
                              />
                            </div>
                          </div>

                          <button
                            onClick={async () => {
                              try {
                                const res = await fetch("/api/scheduler/settings", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ 
                                    mileageThreshold: schedulerThreshold,
                                    driverRatePerKm: driverRatePerKm 
                                  })
                                });
                                if (res.ok) {
                                  alert("✓ Billing and rate settings successfully saved!");
                                  fetchData();
                                }
                              } catch (e) {
                                console.error(e);
                              }
                            }}
                            className="w-full py-2 bg-[#0B1F4D] hover:bg-[#163375] text-white text-[11px] font-bold rounded-lg transition font-mono uppercase cursor-pointer text-center"
                          >
                            Save Billing Settings
                          </button>
                        </div>

                        {/* Trigger Manual Job */}
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 flex flex-col justify-between">
                          <div>
                            <h6 className="font-mono font-bold text-xs text-[#0B1F4D] uppercase">
                              ⚡ Instant Run Trigger
                            </h6>
                            <p className="text-[11px] text-slate-400 leading-normal">
                              Force run the scheduler instantly to generate bills using the set threshold. Ideal for weekly reconciliation or live demos.
                            </p>
                          </div>

                          <div className="space-y-2 pt-2">
                            <button
                              disabled={!!schedulerRunStatus}
                              onClick={async () => {
                                setSchedulerRunStatus("Running checks...");
                                try {
                                  const res = await fetch("/api/scheduler/trigger", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ mileageThreshold: schedulerThreshold })
                                  });
                                  if (res.ok) {
                                    const result = await res.json();
                                    setSchedulerRunStatus(`Result: ${result.summary}`);
                                    alert(`Scheduler Result:\n${result.summary}`);
                                    fetchData();
                                  } else {
                                    setSchedulerRunStatus("Failed to execute");
                                  }
                                } catch (e) {
                                  console.error(e);
                                  setSchedulerRunStatus("Failed to execute");
                                } finally {
                                  setTimeout(() => setSchedulerRunStatus(""), 8000);
                                }
                              }}
                              className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-slate-950 font-bold font-mono text-xs rounded-xl transition shadow-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              🚀 FORCE RUN WEEKLY BILLING SCHEDULER
                            </button>
                            {schedulerRunStatus && (
                              <p className="text-[10px] font-mono text-center text-indigo-600 font-bold animate-pulse">
                                {schedulerRunStatus}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Run Logs Table */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-3xs space-y-3">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <h5 className="font-bold text-slate-900 text-sm uppercase">
                          📋 Scheduler Run History & Execution Logs
                        </h5>
                        <span className="text-xs text-slate-700 font-semibold bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                          Last run: {schedulerLastRun}
                        </span>
                      </div>

                      <div className="overflow-x-auto max-h-80 pr-1">
                        <table className="w-full text-left text-xs text-slate-800">
                          <thead>
                            <tr className="border-b border-slate-200 text-xs text-slate-800 font-bold uppercase">
                              <th className="py-3 px-1">Timestamp</th>
                              <th className="py-3 px-1">Execution Status</th>
                              <th className="py-3 px-1">Outcome / Summary Details</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-sans text-xs">
                            {schedulerLogs.map((log, idx) => (
                              <tr key={idx} className="hover:bg-slate-50 transition">
                                <td className="py-3 px-1 text-slate-700 font-semibold whitespace-nowrap">{log.timestamp}</td>
                                <td className="py-3 px-1">
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                    log.status === "Success" ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-slate-200 text-slate-700 border border-slate-300"
                                  }`}>
                                    {log.status.toUpperCase()}
                                  </span>
                                </td>
                                <td className="py-3 px-1 text-slate-900 font-medium leading-relaxed">{log.message}</td>
                              </tr>
                            ))}
                            {schedulerLogs.length === 0 && (
                              <tr>
                                <td colSpan={3} className="py-12 text-center text-slate-500 font-medium italic">
                                  No scheduler run logs captured yet.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* How it works info card */}
                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 text-xs space-y-2">
                      <h5 className="font-bold text-indigo-900 uppercase font-mono tracking-wide text-[10px]">
                        🧠 How Billing Automation Works
                      </h5>
                      <ul className="list-disc list-inside mt-1 space-y-1 text-slate-600 text-[11px]">
                        <li>
                          The background cron triggers automatically every few minutes, or can be forced instantly via the admin trigger.
                        </li>
                        <li>
                          It scans all registered rickshaw drivers and calculates their completed GPS tracking mileage for the current period.
                        </li>
                        <li>
                          If a driver exceeds the threshold (e.g. <span className="font-bold text-slate-800">{schedulerThreshold} KM</span>) and has no existing pending bills, a new weekly service bill is auto-generated.
                        </li>
                        <li>
                          The system issues notifications to both the driver and the admin dashboard immediately.
                        </li>
                        <li>
                          Generated bills sit in the <b>"Pending"</b> state under <span className="font-bold">Driver Bills</span> until audited and paid by the admin.
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}

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

              {/* Kolkata Zone Heatmap */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <div>
                  <h4 className="font-display font-extrabold text-sm text-[#0B1F4D]">Kolkata Top Zone Performance</h4>
                  <p className="text-[11px] text-slate-400">Daily average impressions coverage yield per high-traffic area</p>
                </div>
                <div className="space-y-3">
                  {[
                    { name: "Shyambazar (North Hub)",       value: 95, count: "52,000 views/day" },
                    { name: "Gariahat (South Retail)",      value: 88, count: "46,500 views/day" },
                    { name: "Salt Lake Sector V (IT Hub)",  value: 82, count: "43,000 views/day" },
                    { name: "New Town / Rajarhat (Growth)", value: 76, count: "38,000 views/day" },
                    { name: "Howrah Bridge Corridor",       value: 70, count: "34,500 views/day" },
                    { name: "Park Street / CBD",            value: 65, count: "31,000 views/day" },
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
                      <span className="text-slate-500 text-[11px]">Upload vehicle rear photograph before 9:30 AM to activate daily meter tracking.</span>
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
          {renderQrModal()}

        </div>
      </div>

      {renderGlobalFooter()}
      <LegalModal 
        isOpen={isLegalModalOpen} 
        onClose={() => setIsLegalModalOpen(false)} 
        initialTab={legalModalTab} 
      />
    </div>
  );
}
