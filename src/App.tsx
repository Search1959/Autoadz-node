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
  const [showAdvPassword, setShowAdvPassword] = useState(false);

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
  const [faqActiveTab, setFaqActiveTab] = useState<"All" | "Advertisers" | "Drivers" | "General" | "Platform">("All");
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
      // ── GENERAL ──────────────────────────────────────────────────────────
      {
        category: "General",
        question: "What is AutoAdz.in?",
        answer: "AutoAdz.in is India's first GPS-tracked auto-rickshaw advertising platform, built by Deinrim Solutionss (P) Ltd., Kolkata. We turn auto-rickshaws into moving smart billboards — every campaign is tracked by GPS, verified by daily photo proofs, and reported on a live dashboard. Unlike static hoardings, you know exactly where your ad travelled and how many kilometres it covered."
      },
      {
        category: "General",
        question: "Where does AutoAdz currently operate?",
        answer: "Our active pilot launch is in Kolkata, covering all major zones — North (Shyambazar, Ultadanga), South (Gariahat, Jadavpur), East (Salt Lake, New Town), Central (Esplanade, Park Street), and Howrah. We are expanding to Mumbai, Delhi, and Bangalore. Contact us to check availability in your city."
      },
      {
        category: "General",
        question: "What makes AutoAdz different from hoardings or bus advertising?",
        answer: "Three things: (1) GPS accountability — you pay only for verified kilometres driven with your creative displayed, not estimated impressions. (2) Hyperlocal reach — autos go into lanes, markets, and residential areas that hoardings and buses cannot enter. (3) Live tracking — log into your dashboard at any time and see exactly where your autos are on a real-time map."
      },
      {
        category: "General",
        question: "Who is behind AutoAdz?",
        answer: "AutoAdz is an initiative of Deinrim Solutionss (P) Ltd., a Kolkata-based digital technology company led by Director Rimjhim Jaiswal. The platform is built on GPS technology, live database tracking, and mobile-first design. Contact: +91 98361-30393 | deinrimsolutionss@gmail.com | 27/3B Jugal Kishor Das Lane, Kolkata – 700 006."
      },
      {
        category: "General",
        question: "How do I contact AutoAdz support?",
        answer: "📞 Call / WhatsApp: +91 98361-30393 or +91 76030-64791\n✉️ Email: deinrimsolutionss@gmail.com\n🌐 Website: autoadz.in\n📍 Office: 27/3B Jugal Kishor Das Lane, Kolkata – 700 006\nSupport hours: Monday–Saturday, 10 AM – 7 PM."
      },

      // ── ADVERTISERS ──────────────────────────────────────────────────────
      {
        category: "Advertisers",
        question: "How do I start a campaign on AutoAdz?",
        answer: "It's simple: (1) Click 'Start a Campaign' in the top menu and fill in your brand name, city, target areas, budget, and contact number. (2) Our team calls you within 24 hours to confirm details and send a formal quote. (3) Once approved, we design your creative banner, print it, and mount it on your assigned autos. (4) Your login credentials are sent so you can track your campaign live from Day 1."
      },
      {
        category: "Advertisers",
        question: "What are the campaign packages and pricing?",
        answer: "Starter Pack: 10 autos × ₹4,500/auto/month = ₹45,000/month. Growth Pack: 25 autos × ₹4,200/auto = ₹1,05,000/month. Brand Blitz: 50 autos × ₹4,000/auto = ₹2,00,000/month. City Dominator: 100+ autos — custom pricing. All packages include: creative design, GPS tracking dashboard, daily photo proof reports, and a dedicated account manager. Pilot launch offer: 20% discount + free creative design for your first campaign."
      },
      {
        category: "Advertisers",
        question: "What do I get in my advertiser dashboard?",
        answer: "Your dashboard shows: (1) Live GPS map — see all your active autos moving in real time. (2) Total kilometres covered by your campaign today and overall. (3) Estimated impressions based on GPS-verified routes. (4) Daily photo audit proofs — morning check-in photos of your banner on each auto. (5) Campaign status, budget utilisation, and auto count. (6) QR scan data if your creative includes a QR code."
      },
      {
        category: "Advertisers",
        question: "Can I choose which areas / zones my autos cover?",
        answer: "Yes. When submitting your campaign, specify your target localities (e.g., Gariahat, Lake Market, Jadavpur for South Kolkata). We assign drivers whose regular routes cover those areas. If you want zone-specific coverage, our team shares a route map before campaign activation so you can approve it."
      },
      {
        category: "Advertisers",
        question: "How is my ad creative designed and printed?",
        answer: "Once your campaign is confirmed, our in-house design team creates your banner artwork based on your brand guidelines, logo, and campaign message — at no extra charge for pilot campaign clients. The creative is then printed on weatherproof vinyl and professionally mounted on the assigned auto hoods. You approve the design before printing."
      },
      {
        category: "Advertisers",
        question: "Can I update or change my creative mid-campaign?",
        answer: "Yes. Log into your advertiser portal and use the 'Edit Creative' button on your campaign card to update the banner image URL. For a physical reprint of the auto banner, contact your account manager — there may be a nominal reprinting charge depending on the number of autos."
      },
      {
        category: "Advertisers",
        question: "What is the minimum campaign duration?",
        answer: "The minimum campaign duration is 1 month. We recommend 3 months for optimal brand recall. Longer campaigns get better per-month rates. You can pause or extend your campaign by contacting your account manager."
      },
      {
        category: "Advertisers",
        question: "How do I pay for my campaign?",
        answer: "Payment is made in advance before campaign activation. We accept bank transfer (NEFT/RTGS), UPI (PhonePe / Google Pay / Paytm), and cheque in favour of 'Deinrim Solutionss (P) Ltd.' A formal invoice is issued within 24 hours of payment. GST @18% is applicable. Our GSTIN is 19AAECD1234M1Z5 (sample — confirm with your invoice)."
      },

      // ── DRIVERS ──────────────────────────────────────────────────────────
      {
        category: "Drivers",
        question: "How do I register as a driver partner?",
        answer: "Click 'Become a Driver Partner' in the top menu. Fill in: your full name, mobile number, auto RC plate number, operating area, driving licence number, and Aadhaar number, and upload photos of your DL and Aadhaar card. Our operations team will verify your KYC and call you within 48 hours. Once approved, you receive your Driver App login and your first campaign assignment."
      },
      {
        category: "Drivers",
        question: "How much can I earn as a driver partner?",
        answer: "Drivers earn ₹4–6 per kilometre driven with the ad banner displayed. Based on an average of 80–100 km/day for 25 working days, you can earn ₹8,000–15,000 per month extra income — on top of your regular auto fare earnings. Payouts are made monthly, directly to your bank account or UPI."
      },
      {
        category: "Drivers",
        question: "What do I need to do every day as a driver partner?",
        answer: "Daily routine: (1) Morning Check-in — open the Driver App, take a photo of your auto with the ad banner clearly visible, and upload it. (2) Start GPS — tap 'Start Driving Session' in the app so your route is tracked. (3) Drive your normal routes — no change to your regular schedule needed. (4) Evening Check-out — tap 'Stop Session' when done. That's it. The app does the rest."
      },
      {
        category: "Drivers",
        question: "Is there any cost for me to join as a driver?",
        answer: "Absolutely zero cost. Joining AutoAdz as a driver partner is completely free. We print and mount your ad banner at our expense. You just need to keep it clean and undamaged. If the banner gets torn or damaged due to accidents, inform your coordinator — replacement is handled case by case."
      },
      {
        category: "Drivers",
        question: "What if my mobile internet is slow or disconnects while driving?",
        answer: "The Driver App saves your GPS track locally and syncs it when connectivity returns. You don't need a constant internet connection. A basic 2G/3G data connection is sufficient. Make sure to keep the app running in the background while driving — do not close it manually."
      },
      {
        category: "Drivers",
        question: "How do I log into the Driver App?",
        answer: "Use your registered mobile number and the 4-digit OTP (one-time PIN) assigned during onboarding. If you forget your PIN, call your AutoAdz coordinator or WhatsApp +91 98361-30393. We'll reset it immediately. Your phone number is your unique driver ID in our system."
      },
      {
        category: "Drivers",
        question: "When and how are driver payments made?",
        answer: "Payments are calculated on the 1st of each month based on your total GPS-verified kilometres for the previous month. You'll receive a breakdown via WhatsApp showing km driven, photo proofs submitted, and amount payable. Payment is credited to your bank account or UPI within 5 working days after calculation. Minimum payout threshold is ₹500."
      },

      // ── PLATFORM ─────────────────────────────────────────────────────────
      {
        category: "Platform",
        question: "Is there a mobile app for advertisers or drivers?",
        answer: "Yes. AutoAdz.in is fully mobile-optimised — open autoadz.in on any smartphone browser and it works like a native app (you can also 'Add to Home Screen' for quick access). A dedicated Android app for drivers is in development. Advertisers manage everything from the web portal."
      },
      {
        category: "Platform",
        question: "How does the GPS tracking actually work?",
        answer: "Each driver opens the AutoAdz Driver App on their smartphone and taps 'Start Driving Session.' The app reads the phone's GPS coordinates every few seconds and sends them to our server. Those coordinates appear on the advertiser's live map in real time. The total distance is calculated from the GPS track and used to compute both driver earnings and campaign kilometre reports."
      },
      {
        category: "Platform",
        question: "Is my campaign data secure and private?",
        answer: "Yes. All data is stored on secure servers. Advertiser dashboards are protected by email and password login with JWT tokens. Drivers log in via phone number and unique PIN. No campaign data is shared between different advertiser accounts. Admin access requires separate credentials known only to AutoAdz operations."
      },
      {
        category: "Platform",
        question: "What browsers and devices does the platform support?",
        answer: "AutoAdz.in works on all modern browsers — Chrome, Firefox, Safari, Edge — on both mobile and desktop. For the best driver experience, we recommend Chrome on Android. For advertisers, the dashboard works equally well on desktop and mobile. No software installation is needed."
      },
    ];

    const filteredFaqs = faqItems.filter(item => {
      const matchesTab = faqActiveTab === "All" || item.category === faqActiveTab;
      const matchesSearch = item.question.toLowerCase().includes(faqSearchQuery.toLowerCase()) || 
                            item.answer.toLowerCase().includes(faqSearchQuery.toLowerCase()) ||
                            item.category.toLowerCase().includes(faqSearchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });

    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl w-full max-w-2xl h-[88vh] flex flex-col shadow-2xl overflow-hidden text-left">

          {/* Header — navy gradient */}
          <div className="bg-gradient-to-r from-[#0B1F4D] to-[#1a3a7a] px-6 py-5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#FF9800] flex items-center justify-center text-white shrink-0">
                <HelpCircle size={22} />
              </div>
              <div>
                <h3 className="font-display font-extrabold text-white text-lg leading-tight">Help Center & FAQ</h3>
                <p className="text-xs text-blue-200 mt-0.5">AutoAdz.in — GPS-tracked auto-rickshaw advertising</p>
              </div>
            </div>
            <button
              onClick={() => { setShowHelpModal(false); setFaqSearchQuery(""); setExpandedFaq(null); }}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
            >
              <X size={16} />
            </button>
          </div>

          {/* Search */}
          <div className="px-6 pt-5 pb-3 bg-slate-50 border-b border-slate-100 shrink-0">
            <div className="relative">
              <Search className="absolute left-4 top-3.5 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search questions — e.g. GPS, pricing, driver earnings..."
                value={faqSearchQuery}
                onChange={(e) => setFaqSearchQuery(e.target.value)}
                className="w-full pl-11 pr-12 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#0B1F4D] transition"
              />
              {faqSearchQuery && (
                <button onClick={() => setFaqSearchQuery("")} className="absolute right-3.5 top-2.5 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-500 px-2 py-1 rounded-lg font-bold">
                  Clear
                </button>
              )}
            </div>

            {/* Category tabs */}
            <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-none pb-1">
              {(["All", "Advertisers", "Drivers", "General", "Platform"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setFaqActiveTab(tab); setExpandedFaq(null); }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap border-2 ${
                    faqActiveTab === tab
                      ? "bg-[#0B1F4D] text-white border-[#0B1F4D]"
                      : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700"
                  }`}
                >
                  {tab === "All" ? "⭐ All" : tab === "Advertisers" ? "💼 Advertisers" : tab === "Drivers" ? "🛺 Drivers" : tab === "General" ? "🌐 General" : "⚙️ Platform"}
                </button>
              ))}
            </div>
          </div>

          {/* Count bar */}
          <div className="px-6 py-2 bg-slate-50 border-b border-slate-100 shrink-0">
            <p className="text-[11px] text-slate-400 font-medium">{filteredFaqs.length} question{filteredFaqs.length !== 1 ? "s" : ""} found</p>
          </div>

          {/* Scrollable Q&A */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2 bg-white">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((item, idx) => {
                const originalIndex = faqItems.findIndex(f => f.question === item.question);
                const isExpanded = expandedFaq === originalIndex;
                return (
                  <div
                    key={idx}
                    className={`rounded-2xl border-2 overflow-hidden transition-all duration-200 ${
                      isExpanded ? "border-[#0B1F4D] shadow-md" : "border-slate-100 hover:border-slate-200 bg-slate-50 hover:bg-white"
                    }`}
                  >
                    <button
                      onClick={() => setExpandedFaq(isExpanded ? null : originalIndex)}
                      className="w-full px-5 py-4 flex items-center justify-between text-left gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`shrink-0 text-[10px] font-black uppercase px-2.5 py-1 rounded-lg ${
                          item.category === "Advertisers" ? "bg-blue-100 text-blue-700" :
                          item.category === "Drivers" ? "bg-teal-100 text-teal-700" :
                          item.category === "Platform" ? "bg-orange-100 text-orange-700" :
                          "bg-purple-100 text-purple-700"
                        }`}>
                          {item.category}
                        </span>
                        <h4 className={`font-semibold text-sm leading-snug truncate ${isExpanded ? "text-[#0B1F4D]" : "text-slate-700"}`}>
                          {item.question}
                        </h4>
                      </div>
                      <ChevronRight size={18} className={`shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-90 text-[#0B1F4D]" : "text-slate-400"}`} />
                    </button>

                    {isExpanded && (
                      <div className="px-5 pb-5 pt-0">
                        <div className="h-px bg-slate-100 mb-4" />
                        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{item.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                  <AlertCircle size={28} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">No results for "{faqSearchQuery}"</p>
                  <p className="text-xs text-slate-400 mt-1">Try shorter keywords or browse by category above.</p>
                </div>
                <button onClick={() => { setFaqSearchQuery(""); setFaqActiveTab("All"); }} className="text-xs font-bold text-[#0B1F4D] bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl transition">
                  Clear filters
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wide">Need more help?</p>
              <p className="text-sm font-bold text-[#0B1F4D] flex items-center gap-2 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block"></span>
                +91 98361-30393
                <span className="text-slate-400 font-normal text-xs">| deinrimsolutionss@gmail.com</span>
              </p>
            </div>
            <button
              onClick={() => { setShowHelpModal(false); setFaqSearchQuery(""); setExpandedFaq(null); setLandingSection("register-campaign"); }}
              className="bg-[#FF9800] hover:bg-orange-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow transition"
            >
              🚀 Start a Campaign
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
  const [resetPwdTarget, setResetPwdTarget] = useState<{id: number, email: string} | null>(null);
  const [resetPwdVal, setResetPwdVal] = useState("");
  const [editCreativeTarget, setEditCreativeTarget] = useState<{id: string, title: string, url: string} | null>(null);
  const [editCreativeUrl, setEditCreativeUrl] = useState("");

  // Localized SEO subpage simulation states
  const [selectedSeoCity, setSelectedSeoCity] = useState<string | null>(null);
  const [selectedSeoIndustry, setSelectedSeoIndustry] = useState<string | null>(null);

  // Campaign Calculator State
  const [calcBudget, setCalcBudget] = useState<number>(50000);

  // System Config states
  const [cities, setCities] = useState<any[]>([]);
  const [adminAddingCity, setAdminAddingCity] = useState(false);
  const [adminEditingCityId, setAdminEditingCityId] = useState<string | null>(null);
  const [adminCityName, setAdminCityName] = useState("");
  const [adminCityZone, setAdminCityZone] = useState("");
  const [adminCityDriverRate, setAdminCityDriverRate] = useState("5");
  const [adminCityBrandRate, setAdminCityBrandRate] = useState("150");
  const [adminCityCapacity, setAdminCityCapacity] = useState("100");
  const [adminCityAutos, setAdminCityAutos] = useState("0");
  const [adminCityStatus, setAdminCityStatus] = useState<"active" | "coming_soon">("active");

  // Admin System integration placeholder credentials
  const [systemWhatsAppToken, setSystemWhatsAppToken] = useState(() => localStorage.getItem("sys_whatsapp_token") || "");
  const [systemWhatsAppPhoneId, setSystemWhatsAppPhoneId] = useState(() => localStorage.getItem("sys_whatsapp_phone_id") || "");
  const [systemAdminWhatsAppPhone, setSystemAdminWhatsAppPhone] = useState(() => localStorage.getItem("sys_admin_whatsapp_phone") || "9836130393");
  const [systemSmsApiKey, setSystemSmsApiKey] = useState(() => localStorage.getItem("sys_sms_api_key") || "");
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
  const [schedulerNextRun, setSchedulerNextRun] = useState("");
  const [schedulerRunStatus, setSchedulerRunStatus] = useState("");
  const [billingStats, setBillingStats] = useState({ totalBilled: 0, totalCollected: 0, owedToDrivers: 0, netBalance: 0 });

  // New Campaign Form State
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [newCampTitle, setNewCampTitle] = useState("");
  const [newCampClient, setNewCampClient] = useState("");
  const [newCampCity, setNewCampCity] = useState("Bangalore");
  const [newCampArea, setNewCampArea] = useState("");
  const [newCampBudget, setNewCampBudget] = useState(75000);
  const [newCampAutos, setNewCampAutos] = useState(10);
  const [newCampCreative, setNewCampCreative] = useState("");
  const [newCampContact, setNewCampContact] = useState("");

  // Driver Check-in / Proof Upload State
  const [selectedCampaignForProof, setSelectedCampaignForProof] = useState("");
  const [proofPhotoType, setProofPhotoType] = useState<"installation" | "daily">("daily");
  const [capturedProofFile, setCapturedProofFile] = useState<File | null>(null);
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string>("");
  const [proofLocation, setProofLocation] = useState("Shyambazar, North Kolkata");
  const [driverCheckInMsg, setDriverCheckInMsg] = useState("");
  const [proofAdminFilter, setProofAdminFilter] = useState<"all" | "pending" | "installation" | "daily">("pending");

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
          setSchedulerLogs(schedulerData.logs || []);
          setSchedulerLastRun(schedulerData.lastRunTimestamp || "Never");
          setSchedulerNextRun(schedulerData.nextRunTime || "");
        }
      } catch (err) {
        console.error("Error fetching scheduler settings", err);
      }

      try {
        const resStats = await fetch("/api/billing/stats");
        if (resStats.ok) setBillingStats(await resStats.json());
      } catch (_) { /* non-critical */ }
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
    const activeDriver = drivers.find(d => d.id === loggedInDriverId);
    if (!activeDriver) return;
    if (!capturedProofFile) {
      setDriverCheckInMsg("Please take a photo first using your camera.");
      return;
    }

    try {
      const campaignId = selectedCampaignForProof || activeDriver.currentCampaignId || (campaigns[0]?.id || "");
      const formData = new FormData();
      formData.append("photo", capturedProofFile);
      formData.append("driverId", activeDriver.id);
      formData.append("campaignId", campaignId);
      formData.append("type", proofPhotoType);
      formData.append("location", proofLocation);

      const response = await fetch("/api/proofs", { method: "POST", body: formData });

      if (response.ok) {
        const msg = proofPhotoType === "installation"
          ? "Installation photo submitted! Admin will verify the banner setup."
          : "Daily check-in submitted! Admin will review your proof.";
        setDriverCheckInMsg(msg);
        setCapturedProofFile(null);
        setProofPreviewUrl("");
        setTimeout(() => setDriverCheckInMsg(""), 6000);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Admin audit proof
  const handleAuditProof = async (id: string, status: "approved" | "flagged") => {
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

  const resetCityForm = () => {
    setAdminCityName(""); setAdminCityZone(""); setAdminCityDriverRate("5");
    setAdminCityBrandRate("150"); setAdminCityCapacity("100"); setAdminCityAutos("0");
    setAdminCityStatus("active");
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
          name: adminCityName, zone: adminCityZone,
          driverRate: Number(adminCityDriverRate),
          brandRate: Number(adminCityBrandRate),
          capacity: Number(adminCityCapacity),
          activeAutos: Number(adminCityAutos),
          status: adminCityStatus,
        })
      });
      if (response.ok) { resetCityForm(); setAdminAddingCity(false); fetchData(); }
    } catch (err) { console.error(err); }
  };

  // City edit save
  const handleSaveCity = async (id: string) => {
    try {
      const response = await fetch(`/api/cities/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: adminCityName, zone: adminCityZone,
          driverRate: Number(adminCityDriverRate),
          brandRate: Number(adminCityBrandRate),
          capacity: Number(adminCityCapacity),
          activeAutos: Number(adminCityAutos),
          status: adminCityStatus,
        })
      });
      if (response.ok) { setAdminEditingCityId(null); resetCityForm(); fetchData(); }
    } catch (err) { console.error(err); }
  };

  // City deletion
  const handleDeleteCity = async (id: string) => {
    if (!confirm("Delete this city?")) return;
    try {
      const response = await fetch(`/api/cities/${id}`, { method: "DELETE" });
      if (response.ok) fetchData();
    } catch (err) { console.error(err); }
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
      <div className="min-h-screen bg-white text-slate-900 flex flex-col relative font-sans">

        {/* Dynamic Top Navigation Bar */}
        <nav className="w-full border-b border-slate-100 bg-white sticky top-0 z-50 px-6 py-3 flex items-center justify-between shadow-sm">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <svg width="42" height="42" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
              <polygon points="32,3 5,61 17,61 32,22" fill="#0B1F4D"/>
              <polygon points="32,3 59,61 47,61 32,22" fill="#166534"/>
              <rect x="17" y="37" width="30" height="6" rx="1" fill="#166534"/>
              <line x1="32" y1="28" x2="27" y2="50" stroke="white" strokeWidth="1.5" strokeDasharray="3,3" strokeLinecap="round"/>
              <rect x="24" y="45" width="16" height="9" rx="2" fill="#166534"/>
              <circle cx="27" cy="56" r="2.5" fill="#FF9800"/>
              <circle cx="37" cy="56" r="2.5" fill="#FF9800"/>
            </svg>
            <div>
              <span className="text-lg font-display font-black tracking-tight text-[#166534]">AutoAdz</span>
              <span className="text-[9px] text-slate-400 font-mono block leading-none">.in</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-600 uppercase font-mono tracking-wider">
            <button onClick={() => setLandingSection("hero")} className={`transition hover:text-[#166534] ${landingSection === "hero" ? "text-[#166534]" : ""}`}>Platform</button>
            <button onClick={() => setLandingSection("register-campaign")} className={`transition hover:text-[#166534] ${landingSection === "register-campaign" ? "text-[#166534]" : ""}`}>Start a Campaign</button>
            <button onClick={() => setLandingSection("register-driver")} className={`transition hover:text-[#166534] ${landingSection === "register-driver" ? "text-[#166534]" : ""}`}>Become a Driver</button>
            <button onClick={() => setLandingSection("login")} className={`transition hover:text-[#166534] ${landingSection === "login" ? "text-[#166534]" : ""}`}>Login</button>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setShowHelpModal(true)}
              className="flex items-center gap-1.5 text-[10px] font-bold font-mono px-3 py-1.5 rounded-lg text-[#166534] bg-[#166534]/10 border border-[#166534]/20 hover:bg-[#166534] hover:text-white transition">
              <HelpCircle size={12} /> FAQ
            </button>
            {landingSection !== "login" ? (
              <button onClick={() => setLandingSection("login")}
                className="bg-[#166534] hover:bg-[#14532d] text-white text-[10px] font-bold font-mono px-4 py-1.5 rounded-lg shadow-sm transition">
                ACCESS PORTAL
              </button>
            ) : (
              <button onClick={() => setLandingSection("hero")}
                className="border border-slate-200 hover:bg-slate-100 text-slate-700 text-[10px] font-bold font-mono px-4 py-1.5 rounded-lg transition">
                ← Back
              </button>
            )}
          </div>
        </nav>

        {/* SUCCESS NOTIFICATIONS */}
        {(campaignSuccessMsg || driverSuccessMsg) && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#166534] border-2 border-[#166534] text-white p-4 rounded-2xl shadow-2xl max-w-sm">
            <div className="flex gap-2 items-start">
              <CheckCircle className="text-white shrink-0 mt-0.5" size={18} />
              <div>
                <h5 className="font-bold text-xs font-mono">SUCCESS</h5>
                <p className="text-[11px] text-white/80 mt-1">{campaignSuccessMsg || driverSuccessMsg}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── MOBILE HAMBURGER NAV ───────────────────────────── */}
        <div className="md:hidden flex gap-1 overflow-x-auto px-4 py-2 border-b border-slate-100 bg-slate-50 text-[10px] font-bold font-mono text-slate-600">
          <button onClick={() => setLandingSection("hero")} className={`px-3 py-1 rounded-lg whitespace-nowrap ${landingSection==="hero"?"bg-[#166534] text-white":""}`}>Platform</button>
          <button onClick={() => setLandingSection("register-campaign")} className={`px-3 py-1 rounded-lg whitespace-nowrap ${landingSection==="register-campaign"?"bg-[#166534] text-white":""}`}>Campaign</button>
          <button onClick={() => setLandingSection("register-driver")} className={`px-3 py-1 rounded-lg whitespace-nowrap ${landingSection==="register-driver"?"bg-[#166534] text-white":""}`}>Driver</button>
          <button onClick={() => setLandingSection("login")} className={`px-3 py-1 rounded-lg whitespace-nowrap ${landingSection==="login"?"bg-[#166534] text-white":""}`}>Login</button>
        </div>


        {/* LANDING PAGE HERO / PLATFORM INFO SECTION */}
        {landingSection === "hero" && (
          <div className="relative w-full overflow-hidden flex-1 flex flex-col justify-start">
            <main className="flex-1 flex flex-col w-full relative">

            {/* ── HERO ─────────────────────────────────────────────────── */}
            <section className="w-full bg-white py-16 px-4 md:px-10 border-b border-slate-100">
              <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <span className="inline-block text-[10px] font-mono font-bold tracking-widest bg-[#166534]/10 text-[#166534] px-3 py-1 rounded-full">
                    GPS-Tracked Transit Advertising · Kolkata
                  </span>
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-black leading-tight text-slate-900">
                    Every Auto is a<br />
                    <span className="text-[#FF9800]">Moving Billboard</span>
                  </h1>
                  <p className="text-slate-600 text-base leading-relaxed max-w-lg">
                    Connect your brand with thousands of daily commuters across Kolkata's busiest routes. AutoAdz delivers hyperlocal ad reach — GPS-verified, proof-backed, and built for results.
                  </p>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <button onClick={() => setLandingSection("register-campaign")}
                      className="bg-[#FF9800] hover:bg-orange-500 text-white font-black text-sm px-7 py-3 rounded-lg shadow-md transition">
                      Start a Campaign →
                    </button>
                    <button onClick={() => setLandingSection("register-driver")}
                      className="border-2 border-[#166534] text-[#166534] hover:bg-[#166534] hover:text-white font-bold text-sm px-7 py-3 rounded-lg transition">
                      Join as Driver Partner
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-6 pt-2 text-slate-500 text-xs font-mono">
                    <span>✓ Live GPS Tracking</span>
                    <span>✓ Photo Proof Verification</span>
                    <span>✓ Weekly Driver Billing</span>
                    <span>✓ Real-time Dashboard</span>
                  </div>
                </div>
                {/* Hero Right — Platform Highlights */}
                <div className="flex flex-col gap-4">
                  {/* Live Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon:"🛺", value: drivers.length || "50+", label:"Auto Partners Active", sub:"On road, GPS-live", accent:"#166534" },
                      { icon:"📍", value:`${(totalKmsAll + simulatedKmsTotal).toFixed(0)}+`, label:"KM GPS-Verified", sub:"Tracked & approved", accent:"#FF9800" },
                      { icon:"📣", value: campaigns.length || "10+", label:"Campaigns Running", sub:"Active right now", accent:"#0B1F4D" },
                      { icon:"📲", value: totalScansAll || "500+", label:"QR Engagements", sub:"Real audience scans", accent:"#166534" },
                    ].map((s, i) => (
                      <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-1 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-2xl">{s.icon}</span>
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.accent }}></span>
                        </div>
                        <span className="text-3xl font-display font-black leading-none" style={{ color: s.accent }}>{s.value}</span>
                        <span className="text-xs font-bold text-slate-800 leading-tight">{s.label}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{s.sub}</span>
                      </div>
                    ))}
                  </div>
                  {/* Key Trust Signals */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2.5">
                    <div className="text-[10px] font-mono font-bold text-[#166534] uppercase tracking-widest">Why Brands Choose AutoAdz</div>
                    {[
                      { icon:"✅", title:"100% Verified Reach", desc:"Every km GPS-tracked & photo-proven before billing" },
                      { icon:"📊", title:"Real-time Dashboard", desc:"Live map of your autos — anytime, anywhere" },
                      { icon:"₹", title:"Pay Only for Verified KM", desc:"No fixed rent — cost scales with actual exposure" },
                      { icon:"🔔", title:"Weekly Reports", desc:"Photos, distance, route & impressions every week" },
                    ].map((t, i) => (
                      <div key={i} className="flex gap-3 items-start">
                        <span className="w-7 h-7 rounded-lg bg-[#166534]/10 text-[#166534] flex items-center justify-center text-sm shrink-0 font-bold">{t.icon}</span>
                        <div>
                          <div className="text-xs font-bold text-slate-900">{t.title}</div>
                          <div className="text-[10px] text-slate-500 leading-snug">{t.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* CTA strip */}
                  <div className="bg-[#0B1F4D] rounded-2xl px-5 py-3 flex items-center justify-between">
                    <div>
                      <div className="text-white font-black text-sm">Ready to start?</div>
                      <div className="text-white/60 text-[10px] font-mono">Call: 76030-64791</div>
                    </div>
                    <button onClick={() => setLandingSection("register-campaign")}
                      className="bg-[#FF9800] hover:bg-orange-500 text-white font-black text-xs px-4 py-2 rounded-lg transition shrink-0">
                      Launch →
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
            <section className="w-full bg-[#f8fdf9] py-14 px-4 md:px-10 border-b border-slate-100">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-10">
                  <span className="text-[10px] font-mono font-bold text-[#166534] tracking-widest uppercase">Platform Workflow</span>
                  <h2 className="text-3xl font-display font-black text-slate-900 mt-1">How AutoAdz Works</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {[
                    { step: "01", title: "Brand Books", desc: "Advertiser registers a campaign with target area, duration, and budget.", icon: "📋" },
                    { step: "02", title: "Auto Verified", desc: "Driver installs branded wrap — photo proof submitted and admin-approved.", icon: "✅" },
                    { step: "03", title: "GPS Tracked", desc: "Real-time location data records every km driven through the campaign zone.", icon: "📍" },
                    { step: "04", title: "Pay by km", desc: "Driver earns by city rate per km. Advertiser gets verified reach reports.", icon: "💰" },
                  ].map((s) => (
                    <div key={s.step} className="bg-white border border-slate-200 rounded-2xl p-6 relative">
                      <span className="absolute top-4 right-4 text-[10px] font-mono font-bold text-[#FF9800] bg-orange-50 px-2 py-0.5 rounded-full">{s.step}</span>
                      <span className="text-3xl mb-3 block">{s.icon}</span>
                      <h3 className="font-display font-black text-slate-900 text-base mb-1">{s.title}</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ── FOR ADVERTISERS | FOR DRIVERS ───────────────────────── */}
            <section className="w-full bg-white py-14 px-4 md:px-10 border-b border-slate-100">
              <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-[#166534] rounded-2xl p-8 text-white">
                  <span className="text-[10px] font-mono font-bold text-white/60 tracking-widest uppercase">For Brands</span>
                  <h2 className="text-2xl font-display font-black mt-2 mb-4">Advertise on Moving Autos</h2>
                  <ul className="space-y-3 text-sm">
                    {[
                      "GPS-verified reach — pay for actual km covered",
                      "Hyperlocal targeting by neighbourhood or route",
                      "Photo proof of installation before billing starts",
                      "Real-time dashboard — track active autos on map",
                      "QR scan analytics — know who engaged",
                    ].map((b, i) => <li key={i} className="flex gap-2"><span className="text-[#FF9800] shrink-0">✓</span>{b}</li>)}
                  </ul>
                  <button onClick={() => setLandingSection("register-campaign")}
                    className="mt-6 bg-[#FF9800] hover:bg-orange-500 text-white font-black text-sm px-6 py-2.5 rounded-lg transition">
                    Launch a Campaign →
                  </button>
                </div>
                <div className="bg-slate-900 rounded-2xl p-8 text-white">
                  <span className="text-[10px] font-mono font-bold text-white/60 tracking-widest uppercase">For Auto Drivers</span>
                  <h2 className="text-2xl font-display font-black mt-2 mb-4">Earn While You Drive</h2>
                  <ul className="space-y-3 text-sm">
                    {[
                      "Earn ₹5–₹10 per km — on top of your regular income",
                      "Free branding installation — no cost to you",
                      "Weekly automatic billing every Monday",
                      "Track your earnings in your own driver portal",
                      "WhatsApp payment confirmation every week",
                    ].map((b, i) => <li key={i} className="flex gap-2"><span className="text-[#FF9800] shrink-0">✓</span>{b}</li>)}
                  </ul>
                  <button onClick={() => setLandingSection("register-driver")}
                    className="mt-6 bg-[#FF9800] hover:bg-orange-500 text-white font-black text-sm px-6 py-2.5 rounded-lg transition">
                    Join as Driver Partner →
                  </button>
                </div>
              </div>
            </section>

            {/* ── WHY AUTOADZ (Comparison) ─────────────────────────────── */}
            <section className="w-full bg-[#f8fdf9] py-14 px-4 md:px-10 border-b border-slate-100">
              <div className="max-w-5xl mx-auto">
                <div className="text-center mb-10">
                  <span className="text-[10px] font-mono font-bold text-[#166534] tracking-widest uppercase">Competitive Edge</span>
                  <h2 className="text-3xl font-display font-black text-slate-900 mt-1">AutoAdz vs Traditional OOH</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-[#166534] text-white">
                        <th className="text-left px-4 py-3 font-mono font-bold rounded-tl-xl">Feature</th>
                        <th className="text-center px-4 py-3 font-mono font-bold">AutoAdz</th>
                        <th className="text-center px-4 py-3 font-mono font-bold rounded-tr-xl">Billboard / Hoarding</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["GPS Verification", "✅ Every km tracked", "❌ No tracking"],
                        ["Photo Proof", "✅ Before & after", "❌ None"],
                        ["Hyperlocal Targeting", "✅ Route-level", "⚠️ Fixed location only"],
                        ["Real-time Dashboard", "✅ Live map view", "❌ Not available"],
                        ["Engagement Analytics", "✅ QR scan data", "❌ Zero data"],
                        ["Min. Budget", "✅ Flexible / km-based", "❌ High fixed monthly rent"],
                      ].map(([feat, adz, alt], i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                          <td className="px-4 py-3 font-medium text-slate-700">{feat}</td>
                          <td className="px-4 py-3 text-center text-[#166534] font-bold">{adz}</td>
                          <td className="px-4 py-3 text-center text-slate-400">{alt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* ── CAMPAIGN CALCULATOR ──────────────────────────────────── */}
            <section className="w-full bg-white py-14 px-4 md:px-10 border-b border-slate-100">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-10">
                  <span className="text-[10px] font-mono font-bold text-[#FF9800] tracking-widest uppercase">Estimate Your Reach</span>
                  <h2 className="text-3xl font-display font-black text-slate-900 mt-1">Campaign Reach Calculator</h2>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-mono font-bold text-slate-600 mb-1 uppercase">Number of Autos</label>
                      <input type="number" min={1} max={200} defaultValue={10}
                        id="calc-autos"
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#166534]"
                        onChange={(e) => {
                          const a = Number(e.target.value) || 10;
                          const d = document.getElementById("calc-days") as HTMLInputElement;
                          const days = d ? Number(d.value) || 30 : 30;
                          const reach = document.getElementById("calc-result") as HTMLElement;
                          if (reach) reach.textContent = `${(a * days * 60).toLocaleString()} KM · ${(a * days * 60 * 200).toLocaleString()} Impressions Est.`;
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono font-bold text-slate-600 mb-1 uppercase">Campaign Duration (days)</label>
                      <input type="number" min={7} max={365} defaultValue={30}
                        id="calc-days"
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#166534]"
                        onChange={(e) => {
                          const days = Number(e.target.value) || 30;
                          const aa = document.getElementById("calc-autos") as HTMLInputElement;
                          const a = aa ? Number(aa.value) || 10 : 10;
                          const reach = document.getElementById("calc-result") as HTMLElement;
                          if (reach) reach.textContent = `${(a * days * 60).toLocaleString()} KM · ${(a * days * 60 * 200).toLocaleString()} Impressions Est.`;
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center bg-[#166534] rounded-xl p-6 text-white text-center">
                    <span className="text-[10px] font-mono font-bold text-white/60 uppercase tracking-wider">Estimated Reach</span>
                    <span id="calc-result" className="text-xl font-display font-black text-[#FF9800] mt-3 leading-tight">18,000 KM · 3,600,000 Impressions Est.</span>
                    <span className="text-[10px] text-white/60 mt-2">Based on 60 km/day avg. per auto</span>
                    <button onClick={() => setLandingSection("register-campaign")}
                      className="mt-4 bg-[#FF9800] hover:bg-orange-500 text-white font-black text-sm px-5 py-2 rounded-lg transition">
                      Get Started →
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* ── CONTACT / CTA BANNER ─────────────────────────────────── */}
            <section className="w-full bg-[#166534] py-14 px-4 md:px-10">
              <div className="max-w-4xl mx-auto text-center text-white">
                <span className="text-[10px] font-mono font-bold text-white/60 tracking-widest uppercase">Get In Touch</span>
                <h2 className="text-3xl font-display font-black mt-2 mb-3">Ready to Put Your Brand on Every Street?</h2>
                <p className="text-base text-white/80 max-w-xl mx-auto mb-8">
                  AutoAdz is Kolkata's first GPS-verified auto-rickshaw advertising platform. Talk to us about your campaign today.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <button onClick={() => setLandingSection("register-campaign")}
                    className="bg-[#FF9800] hover:bg-orange-500 text-white font-black text-sm px-8 py-3 rounded-lg shadow-lg transition">
                    Start a Campaign
                  </button>
                  <a href="https://wa.me/917603064791?text=Hi%20AutoAdz%20Team%2C%20I%27d%20like%20to%20know%20more%20about%20advertising%20on%20your%20platform."
                    target="_blank" rel="noopener noreferrer"
                    className="bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold text-sm px-8 py-3 rounded-lg transition">
                    💬 WhatsApp Us
                  </a>
                </div>
                <p className="text-white/50 text-xs font-mono mt-8">📞 76030-64791 · deinrimsolutionss@gmail.com · Kolkata, West Bengal</p>
              </div>
            </section>

            </main>
          </div>
        )}

        {/* REGISTER NEW CAMPAIGN SECTION (Advertiser self-sign up) */}
        {landingSection === "register-campaign" && (
          <main className="flex-1 flex flex-col items-center justify-center py-10 px-4 max-w-2xl mx-auto z-10 w-full text-left">
            {/* Header banner */}
            <div className="w-full bg-gradient-to-r from-[#0B1F4D] to-[#1a3a7a] rounded-2xl p-6 mb-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#FF9800] flex items-center justify-center text-2xl shrink-0">📣</div>
              <div>
                <div className="text-[10px] font-mono text-[#FF9800] font-bold uppercase tracking-widest mb-0.5">Brand Self Service</div>
                <h3 className="text-2xl font-display font-black text-white leading-tight">Start a Campaign</h3>
                <p className="text-sm text-blue-200 mt-0.5">Tell us about your brand. Our team contacts you within 24 hours to confirm.</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 space-y-5 w-full border border-slate-100">

              <form onSubmit={async (e) => {
                await handleCreateCampaign(e);
                setLandingSection("login");
                setActiveLoginSubTab("advertiser");
              }} className="space-y-5">

                {/* Row 1 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-500 uppercase font-bold tracking-wide block">Brand / Company Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tata Motors"
                      value={newCampClient}
                      onChange={(e) => setNewCampClient(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:border-[#FF9800] focus:outline-none font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-500 uppercase font-bold tracking-wide block">Target City <span className="text-red-500">*</span></label>
                    <select
                      value={newCampCity}
                      onChange={(e) => setNewCampCity(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:border-[#FF9800] focus:outline-none font-medium"
                    >
                      <option value="Kolkata">Kolkata</option>
                      <option value="Bangalore">Bangalore</option>
                      <option value="Mumbai">Mumbai</option>
                      <option value="Delhi">Delhi</option>
                    </select>
                  </div>
                </div>

                {/* Row 2 */}
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-500 uppercase font-bold tracking-wide block">Campaign Title <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Summer Sale — North Kolkata Push"
                    value={newCampTitle}
                    onChange={(e) => setNewCampTitle(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:border-[#FF9800] focus:outline-none font-medium"
                  />
                </div>

                {/* Row 3 */}
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-500 uppercase font-bold tracking-wide block">Target Localities / Areas</label>
                  <input
                    type="text"
                    placeholder="e.g. Shyambazar, Gariahat, Salt Lake, Howrah"
                    value={newCampArea}
                    onChange={(e) => setNewCampArea(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:border-[#FF9800] focus:outline-none font-medium"
                  />
                </div>

                {/* Row 4 — Budget + Autos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-500 uppercase font-bold tracking-wide block">Estimated Budget (₹) <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      required
                      min={10000}
                      step={5000}
                      value={newCampBudget}
                      onChange={(e) => setNewCampBudget(Number(e.target.value))}
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:border-[#FF9800] focus:outline-none font-mono font-medium"
                    />
                    <p className="text-[11px] text-slate-400">Minimum ₹10,000 · Packages from ₹45,000/mo</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-500 uppercase font-bold tracking-wide block">Number of Autos Needed <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={200}
                      value={newCampAutos}
                      onChange={(e) => setNewCampAutos(Number(e.target.value))}
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:border-[#FF9800] focus:outline-none font-mono font-medium"
                    />
                    <p className="text-[11px] text-slate-400">Starter pack: 10 autos · Max: 200 autos</p>
                  </div>
                </div>

                {/* Contact Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-500 uppercase font-bold tracking-wide block">Your Contact Number <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 9831012345"
                    value={newCampContact}
                    onChange={(e) => setNewCampContact(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:border-[#FF9800] focus:outline-none font-mono"
                  />
                  <p className="text-[11px] text-slate-400">We'll call you within 24 hours to confirm your campaign details.</p>
                </div>

                {/* Info note */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 items-start">
                  <span className="text-lg">ℹ️</span>
                  <p className="text-xs text-blue-700 leading-relaxed">Our team will review your proposal and <strong>contact you within 24 hours</strong> to confirm pricing, zone maps, and creative details. You'll then get login credentials to track your live campaign.</p>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-[#FF9800] hover:bg-orange-500 text-white font-black text-base rounded-xl transition shadow-lg shadow-orange-200 tracking-wide"
                >
                  🚀 Submit Campaign Request
                </button>

                <p className="text-center text-xs text-slate-400">Already have an account? <button type="button" onClick={() => { setLandingSection("login"); setActiveLoginSubTab("advertiser"); }} className="text-[#FF9800] font-bold hover:underline">Login here →</button></p>
              </form>
            </div>
          </main>
        )}

        {/* DRIVER REGISTER PARTNER SECTION */}
        {landingSection === "register-driver" && (
          <main className="flex-1 flex flex-col items-center justify-center py-10 px-4 max-w-2xl mx-auto z-10 w-full text-left">
            {/* Header banner */}
            <div className="w-full bg-gradient-to-r from-teal-700 to-teal-500 rounded-2xl p-6 mb-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl shrink-0">🛺</div>
              <div>
                <div className="text-[10px] font-mono text-teal-100 font-bold uppercase tracking-widest mb-0.5">Driver Onboarding</div>
                <h3 className="text-2xl font-display font-black text-white leading-tight">Become a Driver Partner</h3>
                <p className="text-sm text-teal-100 mt-0.5">Earn extra income by displaying ads on your auto. Free to join — approval within 48 hours.</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 space-y-5 w-full border border-slate-100">
              <form onSubmit={async (e) => {
                await handleDriverRegister(e);
                setLandingSection("login");
                setActiveLoginSubTab("admin");
              }} className="space-y-5">

                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-500 uppercase font-bold tracking-wide block">Driver Full Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ravi Das"
                    value={driverRegName}
                    onChange={(e) => setDriverRegName(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none font-medium"
                  />
                </div>

                {/* Phone + RC Plate */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-500 uppercase font-bold tracking-wide block">Mobile Number <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 9876543210"
                      value={driverRegPhone}
                      onChange={(e) => setDriverRegPhone(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-500 uppercase font-bold tracking-wide block">Auto RC Plate Number <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. WB-02-AB-1234"
                      value={driverRegAutoNum}
                      onChange={(e) => setDriverRegAutoNum(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Operating Area */}
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-500 uppercase font-bold tracking-wide block">Operating Area / Hub <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Shyambazar, North Kolkata"
                    value={driverRegLoc}
                    onChange={(e) => setDriverRegLoc(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none font-medium"
                  />
                </div>

                {/* DL + Aadhaar numbers */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-500 uppercase font-bold tracking-wide block">Driving License Number <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. WB-2011-1234567"
                      value={driverRegDL}
                      onChange={(e) => setDriverRegDL(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-500 uppercase font-bold tracking-wide block">Aadhaar Card Number <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 5420-1948-2810"
                      value={driverRegAadhaar}
                      onChange={(e) => setDriverRegAadhaar(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Document uploads */}
                <div className="space-y-2">
                  <label className="text-xs text-slate-500 uppercase font-bold tracking-wide block">Upload KYC Documents</label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl p-4 bg-slate-50 hover:border-teal-400 hover:bg-teal-50 transition text-center">
                      <Upload size={18} className="text-teal-500 mb-1.5" />
                      <span className="text-sm font-bold text-slate-700">{driverRegDLFile ? "✅ DL Uploaded" : "Upload DL Card"}</span>
                      <span className="text-[11px] text-slate-400 mt-0.5">JPG or PNG</span>
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

                    <label className="cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl p-4 bg-slate-50 hover:border-teal-400 hover:bg-teal-50 transition text-center">
                      <Upload size={18} className="text-teal-500 mb-1.5" />
                      <span className="text-sm font-bold text-slate-700">{driverRegAadhaarFile ? "✅ Aadhaar Uploaded" : "Upload Aadhaar"}</span>
                      <span className="text-[11px] text-slate-400 mt-0.5">JPG or PNG</span>
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

                {/* Earnings info box */}
                <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 flex gap-3 items-start">
                  <span className="text-lg">💰</span>
                  <p className="text-xs text-teal-800 leading-relaxed"><strong>Driver Earnings:</strong> Earn ₹4–6 per km driven with your ad banner displayed. Average driver earns ₹4,000–6,000/month extra. Our team will call you within 48 hours after reviewing your KYC.</p>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white font-black text-base rounded-xl transition shadow-lg shadow-teal-200 tracking-wide"
                >
                  📝 Submit Driver Application
                </button>

                <p className="text-center text-xs text-slate-400">Already registered? <button type="button" onClick={() => { setLandingSection("login"); setActiveLoginSubTab("driver"); }} className="text-teal-600 font-bold hover:underline">Driver login →</button></p>
              </form>
            </div>
          </main>
        )}

        {/* SECURE MEMBER LOGIN PANEL */}
        {landingSection === "login" && (
          <main className="flex-1 flex flex-col items-center justify-center py-10 px-4 max-w-2xl mx-auto z-10 w-full">

            {/* Page header */}
            <div className="w-full bg-gradient-to-r from-[#0B1F4D] to-[#1a3a7a] rounded-2xl p-6 mb-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl shrink-0">🔐</div>
              <div>
                <div className="text-[10px] font-mono text-blue-200 font-bold uppercase tracking-widest mb-0.5">Portal Login</div>
                <h3 className="text-2xl font-display font-black text-white leading-tight">Welcome Back</h3>
                <p className="text-sm text-blue-200 mt-0.5">Select your role and log in below</p>
              </div>
            </div>

            {/* Role selector tabs */}
            <div className="w-full grid grid-cols-3 gap-3 mb-5">
              {/* Advertiser */}
              <button
                onClick={() => { setActiveLoginSubTab("advertiser"); setLoginEmail(""); setLoginPassword(""); setLoginError(""); }}
                className={`p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                  activeLoginSubTab === "advertiser"
                    ? "border-[#FF9800] bg-orange-50 shadow-lg"
                    : "border-slate-200 bg-white hover:border-orange-200 hover:bg-orange-50/50"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${activeLoginSubTab === "advertiser" ? "bg-[#FF9800] text-white" : "bg-orange-100 text-[#FF9800]"}`}>
                  <TrendingUp size={18} />
                </div>
                <p className={`font-bold text-sm ${activeLoginSubTab === "advertiser" ? "text-[#FF9800]" : "text-slate-700"}`}>Brand / Advertiser</p>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">Campaign dashboard & live tracking</p>
              </button>

              {/* Driver */}
              <button
                onClick={() => { setActiveLoginSubTab("driver"); setLoginPhone("9876543210"); setLoginOtp("4921"); setLoginError(""); }}
                className={`p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                  activeLoginSubTab === "driver"
                    ? "border-teal-500 bg-teal-50 shadow-lg"
                    : "border-slate-200 bg-white hover:border-teal-200 hover:bg-teal-50/50"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${activeLoginSubTab === "driver" ? "bg-teal-600 text-white" : "bg-teal-100 text-teal-600"}`}>
                  <Smartphone size={18} />
                </div>
                <p className={`font-bold text-sm ${activeLoginSubTab === "driver" ? "text-teal-700" : "text-slate-700"}`}>Driver Partner</p>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">GPS tracking & daily check-ins</p>
              </button>

              {/* Admin */}
              <button
                onClick={() => { setActiveLoginSubTab("admin"); setLoginEmail(""); setLoginPassword(""); setLoginError(""); }}
                className={`p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                  activeLoginSubTab === "admin"
                    ? "border-indigo-500 bg-indigo-50 shadow-lg"
                    : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/50"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${activeLoginSubTab === "admin" ? "bg-indigo-600 text-white" : "bg-indigo-100 text-indigo-600"}`}>
                  <Shield size={18} />
                </div>
                <p className={`font-bold text-sm ${activeLoginSubTab === "admin" ? "text-indigo-700" : "text-slate-700"}`}>Operations Admin</p>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">Approve drivers & manage campaigns</p>
              </button>
            </div>

            {/* Login form card */}
            <div className="w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-6 space-y-4">

              {/* Form title */}
              <div className="pb-3 border-b border-slate-100">
                <h4 className="font-bold text-base text-[#0B1F4D]">
                  {activeLoginSubTab === "advertiser" && "Brand Advertiser Login"}
                  {activeLoginSubTab === "driver" && "Driver Partner Login"}
                  {activeLoginSubTab === "admin" && "Operations Admin Login"}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {activeLoginSubTab === "advertiser" && "Access your campaign dashboard"}
                  {activeLoginSubTab === "driver" && "Start your GPS session and check in"}
                  {activeLoginSubTab === "admin" && "Manage the full AutoAdz platform"}
                </p>
              </div>

              {/* ADVERTISER LOGIN / REGISTER FIELDS */}
              {activeLoginSubTab === "advertiser" && (
                <div className="space-y-4">
                  {/* Toggle */}
                  <div className="flex rounded-xl overflow-hidden border-2 border-slate-100 text-xs font-bold">
                    <button
                      onClick={() => { setShowAdvRegister(false); setLoginError(""); }}
                      className={`flex-1 py-2.5 transition ${!showAdvRegister ? "bg-[#FF9800] text-white" : "text-slate-400 hover:text-slate-600 bg-slate-50"}`}
                    >Login</button>
                    <button
                      onClick={() => { setShowAdvRegister(true); setLoginError(""); }}
                      className={`flex-1 py-2.5 transition ${showAdvRegister ? "bg-[#FF9800] text-white" : "text-slate-400 hover:text-slate-600 bg-slate-50"}`}
                    >Register</button>
                  </div>

                  {!showAdvRegister ? (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-500 uppercase font-bold tracking-wide block">Corporate Email</label>
                        <input
                          type="email"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value.trim())}
                          placeholder="brand@company.in"
                          autoCapitalize="none"
                          autoCorrect="off"
                          autoComplete="email"
                          className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:border-[#FF9800] focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-500 uppercase font-bold tracking-wide block">Password</label>
                        <div className="relative">
                          <input
                            type={showAdvPassword ? "text" : "password"}
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            placeholder="••••••••"
                            autoCapitalize="none"
                            autoCorrect="off"
                            autoComplete="off"
                            className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 pr-16 text-sm text-slate-800 focus:border-[#FF9800] focus:outline-none"
                          />
                          <button type="button" onClick={() => setShowAdvPassword(p => !p)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold">
                            {showAdvPassword ? "Hide" : "Show"}
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-500 uppercase font-bold tracking-wide block">Contact Name *</label>
                        <input type="text" value={regName} onChange={(e) => setRegName(e.target.value)} placeholder="e.g. Rahul Sharma"
                          className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:border-[#FF9800] focus:outline-none" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-500 uppercase font-bold tracking-wide block">Company / Brand Name *</label>
                        <input type="text" value={regCompany} onChange={(e) => setRegCompany(e.target.value)} placeholder="e.g. Tata Motors Ltd."
                          className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:border-[#FF9800] focus:outline-none" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-500 uppercase font-bold tracking-wide block">Business Email *</label>
                        <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="brand@company.in"
                          className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:border-[#FF9800] focus:outline-none" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-500 uppercase font-bold tracking-wide block">Password *</label>
                        <input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} placeholder="Min. 6 characters"
                          className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:border-[#FF9800] focus:outline-none" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-xs text-slate-500 uppercase font-bold tracking-wide block">Phone</label>
                          <input type="text" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} placeholder="+91 9876543210"
                            className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:border-[#FF9800] focus:outline-none" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs text-slate-500 uppercase font-bold tracking-wide block">GSTIN</label>
                          <input type="text" value={regGstin} onChange={(e) => setRegGstin(e.target.value)} placeholder="29AAACA1100D"
                            className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:border-[#FF9800] focus:outline-none" />
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
                            setLoginEmail(regEmail);
                            setLoginPassword(regPassword);
                            setShowAdvRegister(false);
                            setLoginError("✅ Account created! Logging you in...");
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
                        className="w-full py-3.5 rounded-xl text-sm font-bold bg-[#FF9800] hover:bg-orange-500 text-white transition disabled:opacity-60 shadow shadow-orange-200"
                      >
                        {regLoading ? "Creating Account..." : "Create Brand Account →"}
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* DRIVER LOGIN FIELDS */}
              {activeLoginSubTab === "driver" && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-500 uppercase font-bold tracking-wide block">Registered Mobile Number</label>
                    <input
                      type="text"
                      value={loginPhone}
                      onChange={(e) => setLoginPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-500 uppercase font-bold tracking-wide block">4-Digit Security PIN</label>
                    <input
                      type="text"
                      value={loginOtp}
                      onChange={(e) => setLoginOtp(e.target.value)}
                      placeholder="• • • •"
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-lg text-slate-800 tracking-[0.5em] text-center font-mono focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* ADMIN LOGIN FIELDS */}
              {activeLoginSubTab === "admin" && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-500 uppercase font-bold tracking-wide block">Admin Email</label>
                    <input
                      type="text"
                      inputMode="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value.trim())}
                      placeholder="admin@autoadz.in"
                      autoCapitalize="none"
                      autoCorrect="off"
                      autoComplete="off"
                      spellCheck={false}
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-500 uppercase font-bold tracking-wide block">Admin Password</label>
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      autoCapitalize="none"
                      autoCorrect="off"
                      autoComplete="off"
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Error message */}
              {loginError && (
                <div className={`text-sm text-center font-medium p-3 rounded-xl border ${loginError.startsWith("✅") ? "text-green-700 bg-green-50 border-green-200" : "text-red-600 bg-red-50 border-red-200"}`}>
                  {loginError}
                </div>
              )}

              {/* Submit button */}
              {!(activeLoginSubTab === "advertiser" && showAdvRegister) && (
                <button
                  onClick={async () => {
                    if (activeLoginSubTab === "advertiser") {
                      if (!loginEmail || !loginPassword) { setLoginError("Please enter your email and password."); return; }
                      try {
                        const trimEmail = loginEmail.trim().toLowerCase();
                        const trimPass = loginPassword.trim();
                        const res = await fetch("/api/auth/login", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ role: "advertiser", email: trimEmail, password: trimPass }),
                        });
                        const data = await res.json();
                        if (!res.ok) { setLoginError(data.error || "Invalid credentials."); return; }
                        localStorage.setItem("autoadz_adv_jwt", data.token);
                        localStorage.setItem("autoadz_adv_user_id", String(data.userId));
                        localStorage.setItem("autoadz_adv_email", data.email);
                        localStorage.setItem("autoadz_adv_brand_name", data.name);
                        localStorage.setItem("autoadz_adv_brand_id", data.company || data.email.split("@")[0]);
                        localStorage.setItem("autoadz_adv_gstin", data.gstin || "");
                        localStorage.setItem("autoadz_adv_phone", data.phone || "");
                        localStorage.setItem("autoadz_adv_office", data.office || "");
                        setAdvJwt(data.token); setAdvUserId(data.userId); setAdvEmail(data.email);
                        setAdvBrandName(data.name); setAdvBrandId(data.company || data.email.split("@")[0]);
                        setAdvGstin(data.gstin || ""); setAdvPhone(data.phone || ""); setAdvOffice(data.office || "");
                        setUserSession("advertiser"); setActiveSimulator("advertiser");
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      } catch (err: any) { setLoginError(`Error: ${err?.message || "Network failure."}`); }
                    } else if (activeLoginSubTab === "driver") {
                      const cleanPhone = loginPhone.trim().replace(/\D/g, "");
                      if (!cleanPhone) { setLoginError("Please enter your registered phone number."); return; }
                      const matchedDriver = drivers.find(d => {
                        const dPhone = d.phone.trim().replace(/\D/g, "");
                        return dPhone === cleanPhone || d.phone.trim() === loginPhone.trim();
                      });
                      if (!matchedDriver) {
                        setLoginError("This number is not registered. Please apply via 'Become a Driver Partner' first.");
                        return;
                      }
                      if (matchedDriver.status !== "active") {
                        setLoginError("Your application is pending admin approval. Please wait for confirmation.");
                        return;
                      }
                      setLoggedInDriverId(matchedDriver.id);
                      setUserSession("driver");
                      setActiveSimulator("driver");
                      setLoginError("");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    } else if (activeLoginSubTab === "admin") {
                      const adminEmail = loginEmail.trim().toLowerCase();
                      const adminPass = loginPassword.trim();
                      if (adminEmail === "apex7tech@gmail.com" && adminPass === "Search@1959") {
                        setUserSession("admin");
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      } else { setLoginError("Invalid admin credentials."); }
                    }
                  }}
                  className={`w-full py-4 rounded-xl text-sm font-black transition shadow-lg tracking-wide ${
                    activeLoginSubTab === "advertiser" ? "bg-[#FF9800] hover:bg-orange-500 text-white shadow-orange-200" :
                    activeLoginSubTab === "driver" ? "bg-teal-600 hover:bg-teal-700 text-white shadow-teal-200" :
                    "bg-[#0B1F4D] hover:bg-[#1a3a7a] text-white shadow-slate-200"
                  }`}
                >
                  {activeLoginSubTab === "advertiser" ? "🚀 Log In to Dashboard" :
                   activeLoginSubTab === "driver" ? "🛺 Start My GPS Session" :
                   "🔐 Access Admin Panel"}
                </button>
              )}
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
                        {/* Header */}
                        <div className="bg-[#0B1F4D] p-3 rounded-xl">
                          <h5 className="font-bold text-xs text-white flex items-center gap-1.5">
                            <Camera size={13} className="text-[#FF9800]" /> Photo Proof Upload
                          </h5>
                          <p className="text-[10px] text-slate-300 mt-1">Live camera photo required — no gallery uploads. GPS tracking runs independently.</p>
                        </div>

                        {/* Installation status banner */}
                        {(() => {
                          const campId = selectedCampaignForProof || drivers.find(d => d.id === loggedInDriverId)?.currentCampaignId || campaigns[0]?.id || "";
                          const hasInstallation = proofs.some(p => p.driverId === loggedInDriverId && p.campaignId === campId && p.type === "installation");
                          return hasInstallation ? (
                            <div className="bg-green-50 border border-green-200 rounded-xl p-2.5 flex items-center gap-2">
                              <CheckCircle size={14} className="text-green-600 shrink-0" />
                              <p className="text-[10px] text-green-700 font-semibold">Installation photo submitted ✓ — Submit daily check-in photo each day.</p>
                            </div>
                          ) : (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex items-center gap-2">
                              <AlertCircle size={14} className="text-amber-600 shrink-0" />
                              <p className="text-[10px] text-amber-700 font-semibold">First submit an Installation photo showing your banner on the auto.</p>
                            </div>
                          );
                        })()}

                        <form onSubmit={handleUploadProof} className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-3">
                          {/* Campaign */}
                          <div>
                            <label className="text-[10px] text-slate-500 block font-medium mb-1">Campaign</label>
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

                          {/* Photo type */}
                          {(() => {
                            const campId = selectedCampaignForProof || drivers.find(d => d.id === loggedInDriverId)?.currentCampaignId || campaigns[0]?.id || "";
                            const hasInstallation = proofs.some(p => p.driverId === loggedInDriverId && p.campaignId === campId && p.type === "installation");
                            return (
                              <div>
                                <label className="text-[10px] text-slate-500 block font-medium mb-1">Photo Type</label>
                                <div className="grid grid-cols-2 gap-2">
                                  <button type="button" onClick={() => setProofPhotoType("installation")}
                                    disabled={hasInstallation}
                                    className={`p-2 rounded-lg text-[10px] font-bold border transition flex flex-col items-center gap-1 ${
                                      proofPhotoType === "installation" ? "bg-[#0B1F4D] text-white border-[#0B1F4D]" :
                                      hasInstallation ? "border-slate-100 text-slate-300 bg-slate-50 cursor-not-allowed" :
                                      "border-slate-200 text-slate-600 hover:border-[#0B1F4D]"
                                    }`}>
                                    <span className="text-base">🔧</span>
                                    Installation {hasInstallation && "✓"}
                                  </button>
                                  <button type="button" onClick={() => setProofPhotoType("daily")}
                                    disabled={!hasInstallation}
                                    className={`p-2 rounded-lg text-[10px] font-bold border transition flex flex-col items-center gap-1 ${
                                      proofPhotoType === "daily" ? "bg-[#FF9800] text-white border-[#FF9800]" :
                                      !hasInstallation ? "border-slate-100 text-slate-300 bg-slate-50 cursor-not-allowed" :
                                      "border-slate-200 text-slate-600 hover:border-[#FF9800]"
                                    }`}>
                                    <span className="text-base">📸</span>
                                    Daily Check-in
                                  </button>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Camera capture */}
                          <div>
                            <label className="text-[10px] text-slate-500 block font-medium mb-1">
                              Take Photo <span className="text-[#FF9800] font-bold">(Live Camera Only)</span>
                            </label>
                            <label className="flex flex-col items-center justify-center w-full border-2 border-dashed border-slate-300 rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition overflow-hidden">
                              {proofPreviewUrl ? (
                                <img src={proofPreviewUrl} className="w-full max-h-36 object-cover" alt="Preview" />
                              ) : (
                                <div className="py-4 flex flex-col items-center gap-1">
                                  <Camera size={22} className="text-slate-400" />
                                  <span className="text-[10px] text-slate-500 font-semibold">Tap to open camera</span>
                                  <span className="text-[9px] text-slate-400">Gallery not allowed</span>
                                </div>
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  setCapturedProofFile(file);
                                  setProofPreviewUrl(URL.createObjectURL(file));
                                }}
                              />
                            </label>
                            {proofPreviewUrl && (
                              <button type="button" onClick={() => { setCapturedProofFile(null); setProofPreviewUrl(""); }}
                                className="text-[9px] text-red-500 mt-1 underline">Retake photo</button>
                            )}
                          </div>

                          {/* Date/time + location */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-slate-500 block font-medium mb-1">Date & Time</label>
                              <div className="text-[10px] bg-slate-50 border border-slate-200 rounded p-1.5 text-slate-600 font-mono">
                                {new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                              </div>
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-500 block font-medium mb-1">Location</label>
                              <select value={proofLocation} onChange={(e) => setProofLocation(e.target.value)}
                                className="w-full text-[10px] border border-slate-200 rounded p-1.5 bg-white focus:outline-none">
                                <option>Shyambazar, North Kolkata</option>
                                <option>Ultadanga, North Kolkata</option>
                                <option>Salt Lake, Sector V</option>
                                <option>New Town, Rajarhat</option>
                                <option>Gariahat, South Kolkata</option>
                                <option>Jadavpur, South Kolkata</option>
                                <option>Park Street, Central Kolkata</option>
                                <option>Esplanade, Central Kolkata</option>
                                <option>Howrah Station Area</option>
                                <option>Lake Market, Kolkata</option>
                              </select>
                            </div>
                          </div>

                          <button type="submit"
                            className="w-full bg-[#0B1F4D] hover:bg-slate-800 text-white font-bold py-2.5 rounded-lg text-xs transition flex items-center justify-center gap-1.5">
                            <Upload size={12} /> SUBMIT PROOF TO ADMIN
                          </button>

                          {driverCheckInMsg && (
                            <p className={`text-[10px] text-center font-bold rounded p-1.5 border ${
                              driverCheckInMsg.includes("Please") ? "text-red-700 bg-red-50 border-red-200" : "text-green-700 bg-green-50 border-green-200"
                            }`}>{driverCheckInMsg}</p>
                          )}
                        </form>

                        {/* Upload history */}
                        <div className="bg-white p-3 rounded-xl border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-700 block uppercase mb-2">My Proof History</span>
                          <div className="space-y-2">
                            {proofs.filter(p => p.driverId === loggedInDriverId).slice(0, 5).map(p => (
                              <div key={p.id} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                                <div className="flex items-center gap-2">
                                  {p.imageUrl ? (
                                    <img src={p.imageUrl} className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0" alt="" />
                                  ) : (
                                    <div className="w-9 h-9 rounded-lg bg-slate-200 flex items-center justify-center shrink-0">
                                      <Camera size={12} className="text-slate-400" />
                                    </div>
                                  )}
                                  <div>
                                    <p className="font-bold text-slate-700 text-[9px]">
                                      {p.type === "installation" ? "🔧 Installation" : "📸 Daily Check-in"}
                                    </p>
                                    <p className="text-[8px] text-slate-400 truncate w-28">{p.timestamp}</p>
                                    <p className="text-[8px] text-slate-400 truncate w-28">{p.location}</p>
                                  </div>
                                </div>
                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase ${
                                  p.status === "approved" ? "bg-green-100 text-green-700" :
                                  p.status === "flagged" ? "bg-orange-100 text-orange-700" :
                                  "bg-amber-100 text-amber-700"
                                }`}>{p.status === "flagged" ? "⚑ Flagged" : p.status}</span>
                              </div>
                            ))}
                            {proofs.filter(p => p.driverId === loggedInDriverId).length === 0 && (
                              <p className="text-[10px] text-slate-400 text-center py-3">No proofs submitted yet.</p>
                            )}
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
                            <span className="text-[9px] text-slate-400 font-mono block">Your Bills</span>
                            {bills.filter(b => b.senderId === loggedInDriverId).length === 0 && (
                              <p className="text-[10px] text-slate-400 italic text-center py-2">Admin will generate your weekly bill automatically every Monday.</p>
                            )}
                            {bills.filter(b => b.senderId === loggedInDriverId).map(bill => (
                              <div key={bill.id} className={`p-2 rounded-lg text-[10px] space-y-1 font-mono border ${bill.status === "paid" ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}>
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-600">{bill.periodStart} → {bill.periodEnd}</span>
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                                    bill.status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700 animate-pulse"
                                  }`}>
                                    {bill.status === "paid" ? "✓ PAID" : "⏳ PENDING"}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center text-slate-700">
                                  <span>{bill.kmsCovered} KM</span>
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
                            <div className="flex flex-col gap-1.5 items-end">
                              {/* Edit Creative Button */}
                              <button
                                onClick={() => { setEditCreativeTarget({ id: camp.id, title: camp.title, url: camp.creativeUrl }); setEditCreativeUrl(camp.creativeUrl); }}
                                className="text-blue-600 hover:text-white hover:bg-blue-600 px-3 py-1.5 rounded-lg border border-blue-200 hover:border-blue-600 transition text-[10px] font-semibold inline-flex items-center gap-1 shadow-2xs hover:shadow-sm"
                                title="Edit Creative Image"
                              >
                                🖼 Edit Creative
                              </button>
                              {/* Admin Delete Campaign Button */}
                              <button
                                onClick={async () => {
                                  if (confirm(`Are you sure you want to permanently delete the campaign "${camp.title}"?`)) {
                                    const res = await fetch(`/api/campaigns/${camp.id}`, { method: "DELETE" });
                                    if (res.ok) { fetchData(); }
                                  }
                                }}
                                className="text-rose-600 hover:text-white hover:bg-rose-600 px-3 py-1.5 rounded-lg border border-rose-200 hover:border-rose-600 transition text-[10px] font-semibold inline-flex items-center gap-1 shadow-2xs hover:shadow-sm"
                                title="Delete Campaign"
                              >
                                <Trash2 size={12} /> Delete Campaign
                              </button>
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
                <div className="flex justify-between items-center pb-3 border-b border-slate-100 flex-wrap gap-2">
                  <div>
                    <h4 className="font-display font-bold text-sm text-[#0B1F4D] flex items-center gap-2">
                      <Camera size={14} className="text-[#FF9800]" /> Photo Proof Audit
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">GPS tracking continues regardless of approval — flag suspicious photos</p>
                  </div>
                  <span className="text-[10px] font-mono bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full font-semibold">
                    {proofs.filter(p => p.status === "pending").length} pending review
                  </span>
                </div>

                {/* Filter tabs */}
                <div className="flex gap-1.5 flex-wrap">
                  {(["pending", "all", "installation", "daily"] as const).map(f => (
                    <button key={f} onClick={() => setProofAdminFilter(f)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border transition ${
                        proofAdminFilter === f ? "bg-[#0B1F4D] text-white border-[#0B1F4D]" : "border-slate-200 text-slate-500 hover:border-slate-400"
                      }`}>
                      {f === "pending" ? `⏳ Pending (${proofs.filter(p => p.status === "pending").length})` :
                       f === "installation" ? "🔧 Installation" :
                       f === "daily" ? "📸 Daily" : "All"}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {proofs.filter(p =>
                    proofAdminFilter === "all" ? true :
                    proofAdminFilter === "pending" ? p.status === "pending" :
                    p.type === proofAdminFilter
                  ).map((p) => (
                    <div key={p.id} className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-3 flex flex-col justify-between">
                      <div className="flex gap-3">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} className="w-16 h-16 rounded-lg object-cover border border-slate-300 shrink-0" alt="" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-slate-200 flex items-center justify-center shrink-0 border border-slate-300">
                            <Camera size={18} className="text-slate-400" />
                          </div>
                        )}
                        <div className="space-y-1 min-w-0">
                          <span className={`text-[8px] font-bold font-mono px-1.5 py-0.5 rounded uppercase ${
                            p.type === "installation" ? "bg-blue-100 text-blue-800" : "bg-orange-100 text-orange-800"
                          }`}>
                            {p.type === "installation" ? "🔧 Installation" : "📸 Daily Check-in"}
                          </span>
                          <p className="font-bold text-xs text-slate-800 truncate">{p.campaignTitle}</p>
                          <p className="text-[10px] text-slate-500">Driver: <b>{p.driverName}</b></p>
                          <p className="text-[9px] text-slate-400 italic flex items-center gap-0.5 truncate">
                            <MapPin size={8} /> {p.location}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2.5 border-t border-slate-200">
                        <span className="text-[9px] text-slate-500 font-mono">{p.timestamp}</span>
                        {p.status === "pending" ? (
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleAuditProof(p.id, "approved")}
                              className="bg-green-500 hover:bg-green-600 text-white px-2.5 py-1 rounded text-[10px] font-bold flex items-center gap-0.5"
                            >
                              <ThumbsUp size={10} /> Approve
                            </button>
                            <button
                              onClick={() => handleAuditProof(p.id, "flagged")}
                              className="bg-orange-500 hover:bg-orange-600 text-white px-2.5 py-1 rounded text-[10px] font-bold flex items-center gap-0.5"
                            >
                              ⚑ Flag
                            </button>
                          </div>
                        ) : (
                          <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                            p.status === "approved" ? "bg-green-100 text-green-700 border border-green-200" :
                            p.status === "flagged" ? "bg-orange-100 text-orange-700 border border-orange-200" :
                            "bg-slate-100 text-slate-500 border border-slate-200"
                          }`}>
                            {p.status === "flagged" ? "⚑ Flagged" : p.status}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {proofs.filter(p =>
                    proofAdminFilter === "all" ? true :
                    proofAdminFilter === "pending" ? p.status === "pending" :
                    p.type === proofAdminFilter
                  ).length === 0 && (
                    <div className="col-span-2 text-center py-8 text-slate-400 text-xs">No proofs in this category.</div>
                  )}
                </div>
              </div>
            )}

            {/* ADMIN CITIES SUB-TAB */}
            {adminTab === "cities" && (
              <div className="space-y-4 flex-1 flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 flex-wrap gap-2">
                  <div>
                    <h4 className="font-bold text-sm text-[#0B1F4D] flex items-center gap-2"><MapPin size={14} className="text-[#FF9800]" /> Hyperlocal Operating Cities</h4>
                    <span className="text-[10px] text-slate-400">{cities.filter(c => c.status === "active").length} active · {cities.filter(c => c.status === "coming_soon").length} coming soon</span>
                  </div>
                  <button onClick={() => { resetCityForm(); setAdminAddingCity(!adminAddingCity); setAdminEditingCityId(null); }}
                    className="bg-[#10B981] text-white hover:bg-emerald-600 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1">
                    <Plus size={13} /> Add City
                  </button>
                </div>

                {/* Add / Edit City form */}
                {(adminAddingCity || adminEditingCityId) && (() => {
                  const isEdit = !!adminEditingCityId;
                  return (
                    <form onSubmit={isEdit ? (e) => { e.preventDefault(); handleSaveCity(adminEditingCityId!); } : handleAddCity}
                      className="bg-[#0B1F4D] rounded-2xl p-4 space-y-3 text-xs text-white">
                      <h5 className="font-bold text-sm flex items-center gap-2">
                        {isEdit ? <><Edit size={13} className="text-[#FF9800]" /> Edit City</> : <><Plus size={13} className="text-[#FF9800]" /> Add New City</>}
                      </h5>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-300 font-bold uppercase">City Name *</label>
                          <input required value={adminCityName} onChange={(e) => setAdminCityName(e.target.value)}
                            placeholder="e.g. Pune" className="w-full bg-white/10 border border-white/20 rounded-lg px-2.5 py-1.5 text-white placeholder-white/40 focus:border-[#FF9800] focus:outline-none" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-300 font-bold uppercase">Status</label>
                          <select value={adminCityStatus} onChange={(e) => setAdminCityStatus(e.target.value as any)}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-2.5 py-1.5 text-white focus:border-[#FF9800] focus:outline-none">
                            <option value="active">🟢 Active</option>
                            <option value="coming_soon">🟡 Coming Soon</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-300 font-bold uppercase">Target Zones (comma-separated)</label>
                        <input value={adminCityZone} onChange={(e) => setAdminCityZone(e.target.value)}
                          placeholder="e.g. Park Street, Salt Lake, Howrah" className="w-full bg-white/10 border border-white/20 rounded-lg px-2.5 py-1.5 text-white placeholder-white/40 focus:border-[#FF9800] focus:outline-none" />
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-300 font-bold uppercase">Driver Rate (₹/km)</label>
                          <input type="number" step="0.5" value={adminCityDriverRate} onChange={(e) => setAdminCityDriverRate(e.target.value)}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-2.5 py-1.5 text-white focus:border-[#FF9800] focus:outline-none" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-300 font-bold uppercase">Brand Rate (₹/auto/day)</label>
                          <input type="number" value={adminCityBrandRate} onChange={(e) => setAdminCityBrandRate(e.target.value)}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-2.5 py-1.5 text-white focus:border-[#FF9800] focus:outline-none" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-300 font-bold uppercase">Fleet Cap</label>
                          <input type="number" value={adminCityCapacity} onChange={(e) => setAdminCityCapacity(e.target.value)}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-2.5 py-1.5 text-white focus:border-[#FF9800] focus:outline-none" />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <button type="button" onClick={() => { setAdminAddingCity(false); setAdminEditingCityId(null); resetCityForm(); }}
                          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg font-bold text-white">Cancel</button>
                        <button type="submit" className="px-4 py-1.5 bg-[#FF9800] hover:bg-amber-500 text-black rounded-lg font-bold">
                          {isEdit ? "Save Changes" : "Add City"}
                        </button>
                      </div>
                    </form>
                  );
                })()}

                {/* City cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cities.map((city: any) => {
                    const cityDrivers = drivers.filter(d => d.location?.toLowerCase().includes(city.name.toLowerCase())).length;
                    const cityCampaigns = campaigns.filter(c => c.city?.toLowerCase().includes(city.name.toLowerCase()) && c.status === "active").length;
                    const fillPct = city.capacity > 0 ? Math.min(100, Math.round((city.activeAutos / city.capacity) * 100)) : 0;
                    const zones = city.zone ? city.zone.split(",").map((z: string) => z.trim()).filter(Boolean) : [];
                    const isEditing = adminEditingCityId === city.id;

                    return (
                      <div key={city.id} className={`bg-white border-2 rounded-2xl p-4 flex flex-col gap-3 transition ${
                        city.status === "active" ? "border-emerald-200" : "border-amber-200 opacity-80"
                      }`}>
                        {/* Top row */}
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-extrabold text-[#0B1F4D] text-sm leading-tight">{city.name}</h5>
                            <p className="text-[9px] text-slate-400 mt-0.5">{city.activeAutos} autos registered</p>
                          </div>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            city.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                          }`}>{city.status === "active" ? "🟢 Active" : "🟡 Coming Soon"}</span>
                        </div>

                        {/* Rate chips */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-blue-50 border border-blue-100 rounded-xl p-2 text-center">
                            <p className="text-[9px] text-blue-500 font-bold uppercase">Driver Payout</p>
                            <p className="text-sm font-extrabold text-blue-700">₹{city.driverRate}<span className="text-[9px] font-normal">/km</span></p>
                          </div>
                          <div className="bg-orange-50 border border-orange-100 rounded-xl p-2 text-center">
                            <p className="text-[9px] text-orange-500 font-bold uppercase">Brand Charge</p>
                            <p className="text-sm font-extrabold text-orange-700">₹{city.brandRate}<span className="text-[9px] font-normal">/auto/day</span></p>
                          </div>
                        </div>

                        {/* Zones */}
                        {zones.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {zones.map((z: string, i: number) => (
                              <span key={i} className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">{z}</span>
                            ))}
                          </div>
                        )}

                        {/* Fleet capacity bar */}
                        <div>
                          <div className="flex justify-between text-[9px] text-slate-500 mb-1">
                            <span>Fleet: {city.activeAutos}/{city.capacity} autos</span>
                            <span className="font-bold">{fillPct}% filled</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${fillPct >= 90 ? "bg-red-400" : fillPct >= 60 ? "bg-amber-400" : "bg-emerald-400"}`}
                              style={{ width: `${fillPct}%` }} />
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-2 text-center bg-slate-50 rounded-xl p-2">
                          <div>
                            <p className="text-[10px] font-extrabold text-[#0B1F4D]">{cityCampaigns}</p>
                            <p className="text-[8px] text-slate-400 uppercase">Active Campaigns</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-extrabold text-[#0B1F4D]">{cityDrivers}</p>
                            <p className="text-[8px] text-slate-400 uppercase">Drivers Matched</p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-1 border-t border-slate-100">
                          <button onClick={() => {
                            setAdminEditingCityId(city.id);
                            setAdminAddingCity(false);
                            setAdminCityName(city.name);
                            setAdminCityZone(city.zone || "");
                            setAdminCityDriverRate(String(city.driverRate));
                            setAdminCityBrandRate(String(city.brandRate));
                            setAdminCityCapacity(String(city.capacity));
                            setAdminCityAutos(String(city.activeAutos));
                            setAdminCityStatus(city.status || "active");
                          }}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] font-bold text-[#0B1F4D] bg-slate-100 hover:bg-slate-200 rounded-lg transition">
                            <Edit size={10} /> Edit
                          </button>
                          <button onClick={() => handleDeleteCity(city.id)}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] font-bold text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition">
                            <Trash2 size={10} /> Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
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
                              onClick={() => { setResetPwdTarget({id: adv.id, email: adv.email}); setResetPwdVal(""); }}
                              className="flex-1 py-1.5 rounded-lg text-[10px] font-bold font-mono bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition"
                            >
                              🔑 RESET PWD
                            </button>
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

            {/* EDIT CREATIVE MODAL */}
            {editCreativeTarget && (
              <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
                  <h3 className="font-bold text-[#0B1F4D] text-sm font-mono uppercase">Edit Campaign Creative</h3>
                  <p className="text-xs text-slate-500 truncate">{editCreativeTarget.title}</p>
                  {editCreativeUrl && (
                    <img src={editCreativeUrl} alt="Preview" className="w-full h-36 object-cover rounded-xl border border-slate-200" referrerPolicy="no-referrer" onError={e => (e.currentTarget.style.display = "none")} />
                  )}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 uppercase font-mono font-bold block">Image URL</label>
                    <input
                      type="text"
                      placeholder="https://example.com/image.jpg"
                      value={editCreativeUrl}
                      onChange={e => setEditCreativeUrl(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      autoFocus
                    />
                    <p className="text-[10px] text-slate-400">Paste a direct image URL (JPG, PNG, WebP). Must start with https://</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setEditCreativeTarget(null); setEditCreativeUrl(""); }}
                      className="flex-1 py-2 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200"
                    >Cancel</button>
                    <button
                      onClick={async () => {
                        if (!editCreativeUrl.startsWith("http")) { alert("Please enter a valid URL"); return; }
                        const res = await fetch(`/api/campaigns/${editCreativeTarget.id}`, {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ creativeUrl: editCreativeUrl }),
                        });
                        if (res.ok) {
                          fetchData();
                          setEditCreativeTarget(null);
                          setEditCreativeUrl("");
                        } else {
                          alert("Failed to update. Please try again.");
                        }
                      }}
                      className="flex-1 py-2 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700"
                    >Save Creative</button>
                  </div>
                </div>
              </div>
            )}

            {/* RESET PASSWORD MODAL */}
            {resetPwdTarget && (
              <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
                  <h3 className="font-bold text-[#0B1F4D] text-sm font-mono uppercase">Reset Password</h3>
                  <p className="text-xs text-slate-500">{resetPwdTarget.email}</p>
                  <input
                    type="password"
                    placeholder="New password (min 6 chars)"
                    value={resetPwdVal}
                    onChange={e => setResetPwdVal(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setResetPwdTarget(null); setResetPwdVal(""); }}
                      className="flex-1 py-2 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200"
                    >Cancel</button>
                    <button
                      onClick={async () => {
                        if (resetPwdVal.length < 6) { alert("Minimum 6 characters"); return; }
                        const res = await fetch(`/api/advertisers/${resetPwdTarget.id}/reset-password`, {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ newPassword: resetPwdVal }),
                        });
                        const data = await res.json();
                        if (data.success) {
                          alert(`✅ Password reset successfully`);
                          setResetPwdTarget(null); setResetPwdVal("");
                        } else {
                          alert(`❌ ${data.error}`);
                        }
                      }}
                      className="flex-1 py-2 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700"
                    >Set Password</button>
                  </div>
                </div>
              </div>
            )}

            {/* ADMIN SETTINGS SUB-TAB */}
            {adminTab === "settings" && (
              <div className="space-y-5 flex-1 flex flex-col text-left">

                {/* Section header */}
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-[#0B1F4D] flex items-center justify-center text-white text-lg shrink-0">⚙️</div>
                  <div>
                    <h4 className="font-bold text-base text-[#0B1F4D]">Platform Settings</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Configure integrations, payout rates and gateway connections</p>
                  </div>
                </div>

                {systemSettingsSuccessMsg && (
                  <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl text-sm font-medium flex items-center gap-2">
                    <span>✅</span> {systemSettingsSuccessMsg}
                  </div>
                )}

                <form onSubmit={handleSaveSystemSettings} className="space-y-4">

                  {/* WhatsApp card */}
                  <div className="bg-white border-2 border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                    <div className="bg-green-50 border-b border-green-100 px-5 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse inline-block"></span>
                        <span className="font-bold text-sm text-green-800">WhatsApp Business API</span>
                      </div>
                      <span className="text-[10px] text-green-600 bg-green-100 px-2 py-0.5 rounded-full font-bold">META CLOUD</span>
                    </div>
                    <div className="p-5 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs text-slate-500 uppercase font-bold tracking-wide block">Cloud Access Token</label>
                          <input
                            type="password"
                            value={systemWhatsAppToken}
                            onChange={(e) => setSystemWhatsAppToken(e.target.value)}
                            placeholder="EAAxxxxxxxxxxxxxxx"
                            className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-green-400 font-mono"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs text-slate-500 uppercase font-bold tracking-wide block">Phone Number ID</label>
                          <input
                            type="text"
                            value={systemWhatsAppPhoneId}
                            onChange={(e) => setSystemWhatsAppPhoneId(e.target.value)}
                            placeholder="109825420194852"
                            className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-green-400 font-mono"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs text-slate-500 uppercase font-bold tracking-wide block">Admin WhatsApp Number</label>
                          <input
                            type="text"
                            value={systemAdminWhatsAppPhone}
                            onChange={(e) => setSystemAdminWhatsAppPhone(e.target.value)}
                            placeholder="9836130393"
                            className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-green-400 font-mono"
                          />
                        </div>
                      </div>
                      {/* Setup guide */}
                      {(!systemWhatsAppToken || !systemWhatsAppPhoneId) && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
                          <p className="text-xs font-bold text-amber-800">⚠️ Setup Required — WhatsApp API not yet configured</p>
                          <ol className="text-xs text-amber-700 space-y-1 list-decimal list-inside leading-relaxed">
                            <li>Go to <strong>developers.facebook.com</strong> → My Apps → Create App → Business</li>
                            <li>Add <strong>WhatsApp</strong> product → Set up WhatsApp Business API</li>
                            <li>Copy your <strong>Phone Number ID</strong> and <strong>Permanent Access Token</strong></li>
                            <li>Paste both above and click Save, then Send Test Message</li>
                          </ol>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Sends automated alerts when a new driver registers or a campaign is submitted.
                        </p>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!systemWhatsAppToken || !systemWhatsAppPhoneId) { alert("Please enter your WhatsApp Access Token and Phone Number ID first."); return; }
                            if (!systemAdminWhatsAppPhone) { alert("Please enter your Admin WhatsApp number first."); return; }
                            const confirmTest = confirm(`Send a test WhatsApp message to +91${systemAdminWhatsAppPhone}?`);
                            if (confirmTest) {
                              try {
                                const res = await fetch("/api/whatsapp/send", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ token: systemWhatsAppToken, phoneId: systemWhatsAppPhoneId, recipient: systemAdminWhatsAppPhone, message: "🔔 *AutoAdz Integration Test!* Your WhatsApp API is connected successfully to AutoAdz platform." })
                                });
                                const data = await res.json();
                                if (res.ok) { alert(`✅ Test message sent to ${systemAdminWhatsAppPhone}! Check your WhatsApp.`); }
                                else {
                                  const errorMsg = typeof data.error === "object" ? (data.error.message || JSON.stringify(data.error)) : (data.error || "Check your token or Phone Number ID.");
                                  alert(`❌ Failed: ${errorMsg}\n\nTip: Make sure you are using a Permanent Token (not a temporary one) from Meta Developers.`);
                                }
                              } catch (err: any) { alert(`Error: ${err.message}`); }
                            }
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
                        >
                          ⚡ Send Test Message
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* SMS card */}
                  <div className="bg-white border-2 border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                    <div className="bg-blue-50 border-b border-blue-100 px-5 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-blue-500">📱</span>
                        <span className="font-bold text-sm text-blue-800">SMS & OTP Gateway</span>
                      </div>
                      <span className="text-[10px] text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full font-bold">TWILIO / KOOKOO</span>
                    </div>
                    <div className="p-5 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs text-slate-500 uppercase font-bold tracking-wide block">Gateway API Key</label>
                          <input
                            type="password"
                            value={systemSmsApiKey}
                            onChange={(e) => setSystemSmsApiKey(e.target.value)}
                            placeholder="SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                            className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-400 font-mono"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs text-slate-500 uppercase font-bold tracking-wide block">Sender ID</label>
                          <input
                            type="text"
                            value={systemSmsSenderId}
                            onChange={(e) => setSystemSmsSenderId(e.target.value)}
                            placeholder="AUTADZ"
                            className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-400 font-mono"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-slate-400">
                        Sends OTP PINs and onboarding confirmation SMS directly to drivers after KYC approval.
                      </p>
                    </div>
                  </div>

                  {/* Payout rates card */}
                  <div className="bg-white border-2 border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                    <div className="bg-orange-50 border-b border-orange-100 px-5 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>🛺</span>
                        <span className="font-bold text-sm text-orange-800">Driver Payout Configuration</span>
                      </div>
                      <span className="text-[10px] text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full font-bold">GLOBAL RATES</span>
                    </div>
                    <div className="p-5 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs text-slate-500 uppercase font-bold tracking-wide block">Payout Rate (₹ per KM)</label>
                          <input
                            type="number"
                            step="0.1"
                            min="0.1"
                            value={driverRatePerKm}
                            onChange={(e) => setDriverRatePerKm(parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-orange-400 font-mono"
                          />
                          <p className="text-[11px] text-slate-400">Current: ₹{driverRatePerKm}/km · Avg driver earns ₹{Math.round(driverRatePerKm * 80 * 25).toLocaleString()}/month</p>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs text-slate-500 uppercase font-bold tracking-wide block">Billing Threshold (KM)</label>
                          <input
                            type="number"
                            min="1"
                            value={schedulerThreshold}
                            onChange={(e) => setSchedulerThreshold(parseInt(e.target.value) || 0)}
                            className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-orange-400 font-mono"
                          />
                          <p className="text-[11px] text-slate-400">Minimum km to trigger automated payout cycle</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-[#0B1F4D] hover:bg-[#1a3a7a] text-white font-black text-sm rounded-xl transition shadow-lg tracking-wide"
                  >
                    💾 Save All Settings
                  </button>
                </form>
              </div>
            )}

            {/* ADMIN FINANCE CRM & LEDGER TAB */}
            {adminTab === "finance_crm" && (
              <div className="space-y-6 flex-1 flex flex-col">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-2 border-b border-slate-100 gap-2">
                  <div>
                    <h4 className="font-bold text-sm text-[#0B1F4D] uppercase font-mono tracking-wider">Finance & CRM</h4>
                    <p className="text-[11px] text-slate-400">Weekly driver bills, advertiser invoices, and automated billing scheduler.</p>
                  </div>
                  <div className="flex flex-wrap gap-0.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px] font-bold">
                    {(["overview","driver_bills","advertiser_bills","scheduler","ledger"] as const).map(tab => (
                      <button key={tab} onClick={() => setFinanceSubTab(tab as typeof financeSubTab)}
                        className={`px-2.5 py-1 rounded-md transition whitespace-nowrap ${financeSubTab === tab ? "bg-white text-[#0B1F4D] shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}>
                        {tab === "overview" ? "📊 Overview" : tab === "driver_bills" ? "🛺 Driver Bills" : tab === "advertiser_bills" ? "🏢 Ad Invoices" : tab === "scheduler" ? "⚙️ Auto Billing" : "📓 Ledger"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* OVERVIEW */}
                {financeSubTab === "overview" && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white border-2 border-slate-200 rounded-2xl p-4">
                        <span className="text-[10px] text-slate-500 uppercase font-mono font-bold block">Total Billed</span>
                        <span className="text-[10px] text-slate-400 font-mono block mb-1">Driver service bills raised</span>
                        <h3 className="text-lg font-black text-[#0B1F4D] font-mono">₹{billingStats.totalBilled.toLocaleString()}</h3>
                      </div>
                      <div className="bg-white border-2 border-emerald-200 rounded-2xl p-4">
                        <span className="text-[10px] text-emerald-600 uppercase font-mono font-bold block">Total Collected</span>
                        <span className="text-[10px] text-slate-400 font-mono block mb-1">Paid advertiser invoices</span>
                        <h3 className="text-lg font-black text-emerald-700 font-mono">₹{billingStats.totalCollected.toLocaleString()}</h3>
                      </div>
                      <div className="bg-white border-2 border-amber-200 rounded-2xl p-4">
                        <span className="text-[10px] text-amber-600 uppercase font-mono font-bold block">Owed to Drivers</span>
                        <span className="text-[10px] text-slate-400 font-mono block mb-1">Pending driver bills</span>
                        <h3 className="text-lg font-black text-amber-700 font-mono">₹{billingStats.owedToDrivers.toLocaleString()}</h3>
                      </div>
                      <div className={`bg-white border-2 rounded-2xl p-4 ${billingStats.netBalance >= 0 ? "border-indigo-200" : "border-rose-200"}`}>
                        <span className={`text-[10px] uppercase font-mono font-bold block ${billingStats.netBalance >= 0 ? "text-indigo-600" : "text-rose-600"}`}>Net Balance</span>
                        <span className="text-[10px] text-slate-400 font-mono block mb-1">Collected minus billed</span>
                        <h3 className={`text-lg font-black font-mono ${billingStats.netBalance >= 0 ? "text-indigo-700" : "text-rose-700"}`}>
                          {billingStats.netBalance >= 0 ? "+" : ""}₹{billingStats.netBalance.toLocaleString()}
                        </h3>
                      </div>
                    </div>

                    {/* Quick stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                        <p className="text-[10px] font-mono font-bold text-slate-500 uppercase">Driver Bills</p>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Pending</span>
                          <span className="font-bold text-amber-600">{bills.filter(b => b.type === "driver_service_bill" && b.status === "pending").length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Paid</span>
                          <span className="font-bold text-emerald-600">{bills.filter(b => b.type === "driver_service_bill" && b.status === "paid").length}</span>
                        </div>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                        <p className="text-[10px] font-mono font-bold text-slate-500 uppercase">Ad Invoices</p>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Pending</span>
                          <span className="font-bold text-amber-600">{bills.filter(b => b.type === "advertiser_invoice" && b.status === "pending").length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Paid</span>
                          <span className="font-bold text-emerald-600">{bills.filter(b => b.type === "advertiser_invoice" && b.status === "paid").length}</span>
                        </div>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                        <p className="text-[10px] font-mono font-bold text-slate-500 uppercase">Auto Billing</p>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Scheduler</span>
                          <span className={`font-bold ${schedulerEnabled ? "text-emerald-600" : "text-slate-400"}`}>{schedulerEnabled ? "Active" : "Paused"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Next run</span>
                          <span className="font-bold text-[#0B1F4D] text-[10px]">{schedulerNextRun ? schedulerNextRun.split(",")[0] : "Monday 9 AM"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ADVERTISER INVOICES */}
                {financeSubTab === "advertiser_bills" && (
                  <div className="space-y-4">
                    {/* Create Invoice Form */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                      <h5 className="font-bold text-[#0B1F4D] text-xs uppercase font-mono">Create Advertiser Invoice</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 uppercase font-mono font-bold block">Campaign</label>
                          <select value={selectedCampIdForInvoice} onChange={(e) => {
                            const cid = e.target.value;
                            setSelectedCampIdForInvoice(cid);
                            const cmp = campaigns.find(c => c.id === cid);
                            if (cmp) {
                              const k = Math.floor(cmp.kmsCovered || 0);
                              setInvoiceKms(String(k));
                              setInvoiceAmount(String(k * 20));
                              setInvoiceDesc(`Weekly GPS Progress Invoice — ${k} KM on active routes`);
                            }
                          }} className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500">
                            <option value="">-- Select Campaign --</option>
                            {campaigns.map(c => <option key={c.id} value={c.id}>{c.title} ({c.client})</option>)}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 uppercase font-mono font-bold block">KMs</label>
                          <input type="number" placeholder="KMs covered" value={invoiceKms} onChange={e => setInvoiceKms(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 uppercase font-mono font-bold block">Amount (₹)</label>
                          <input type="number" placeholder="Invoice amount" value={invoiceAmount} onChange={e => setInvoiceAmount(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 uppercase font-mono font-bold block">Period Start</label>
                          <input type="date" value={invoicePeriodStart} onChange={e => setInvoicePeriodStart(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 uppercase font-mono font-bold block">Period End</label>
                          <input type="date" value={invoicePeriodEnd} onChange={e => setInvoicePeriodEnd(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 uppercase font-mono font-bold block">Description</label>
                          <input type="text" placeholder="Invoice description" value={invoiceDesc} onChange={e => setInvoiceDesc(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500" />
                        </div>
                      </div>
                      <button onClick={async () => {
                        if (!selectedCampIdForInvoice || !invoiceAmount) { alert("Select a campaign and enter amount."); return; }
                        const cmp = campaigns.find(c => c.id === selectedCampIdForInvoice);
                        try {
                          const res = await fetch("/api/bills", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
                            type: "advertiser_invoice", senderId: "admin", senderName: "AutoAdz Admin",
                            receiverId: "advertiser_main", campaignId: selectedCampIdForInvoice,
                            amount: parseFloat(invoiceAmount), kmsCovered: parseFloat(invoiceKms || "0"),
                            periodStart: invoicePeriodStart || new Date(Date.now()-7*24*3600*1000).toISOString().split("T")[0],
                            periodEnd: invoicePeriodEnd || new Date().toISOString().split("T")[0],
                            description: invoiceDesc || `Weekly GPS Invoice — ${cmp?.title || ""}`
                          })});
                          if (res.ok) {
                            setSelectedCampIdForInvoice(""); setInvoiceAmount(""); setInvoiceKms(""); setInvoiceDesc("");
                            fetchData();
                          } else { alert("Failed to create invoice."); }
                        } catch (e) { console.error(e); }
                      }} className="px-4 py-2 bg-[#FF9800] hover:bg-orange-600 text-slate-950 font-bold text-xs rounded-xl transition cursor-pointer font-mono uppercase">
                        ⚡ Create Invoice
                      </button>
                    </div>

                    {/* Invoice List */}
                    <div className="space-y-3">
                      {bills.filter(b => b.type === "advertiser_invoice").length === 0 ? (
                        <div className="py-10 text-center text-slate-400 italic text-sm">No advertiser invoices yet.</div>
                      ) : bills.filter(b => b.type === "advertiser_invoice").map(bill => {
                        const camp = campaigns.find(c => c.id === bill.campaignId);
                        return (
                          <div key={bill.id} className="bg-white border-2 border-slate-200 rounded-2xl p-4">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-slate-800 text-sm">{camp?.title || "Direct Invoice"}</span>
                                  <span className="text-[10px] text-slate-500">Client: {camp?.client || "Advertiser"}</span>
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${bill.status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                                    {bill.status.toUpperCase()}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 font-mono">{bill.description}</p>
                                <p className="text-[10px] text-slate-400 font-mono">{bill.periodStart} → {bill.periodEnd} · {bill.timestamp}</p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <span className="text-xl font-black text-[#FF9800] font-mono block">₹{bill.amount.toLocaleString()}</span>
                                <span className="text-[10px] text-slate-400 font-mono">{bill.kmsCovered} KM</span>
                              </div>
                            </div>
                            <div className="flex gap-2 mt-3 flex-wrap">
                              {bill.status === "pending" && (
                                <button onClick={async () => {
                                  if (confirm(`Mark invoice of ₹${bill.amount} as paid?`)) {
                                    try {
                                      const res = await fetch(`/api/bills/${bill.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "paid" }) });
                                      if (res.ok) fetchData();
                                    } catch (e) { console.error(e); }
                                  }
                                }} className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[11px] rounded-lg transition cursor-pointer">
                                  ✓ Mark Paid
                                </button>
                              )}
                              <button onClick={() => {
                                const msg = `Dear ${camp?.client || "Advertiser"}, your AutoAdz campaign invoice of ₹${bill.amount} for the period ${bill.periodStart} to ${bill.periodEnd} (${bill.kmsCovered} KM) is ${bill.status === "paid" ? "settled. Thank you!" : "pending payment. Please process at your earliest."}`;
                                window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
                              }} className="px-3 py-1.5 bg-[#25D366] hover:bg-[#1ebe5b] text-white font-bold text-[11px] rounded-lg transition cursor-pointer">
                                WhatsApp
                              </button>
                              <button onClick={() => {
                                const win = window.open("", "_blank");
                                if (!win) return;
                                win.document.write(`<!DOCTYPE html><html><head><title>Invoice</title><style>body{font-family:sans-serif;padding:40px;max-width:600px;margin:auto}h1{color:#0B1F4D}table{width:100%;border-collapse:collapse;margin-top:16px}td{padding:8px;border-bottom:1px solid #eee}.amt{font-size:24px;font-weight:900;color:#FF9800}@media print{body{padding:0}}</style></head><body><h1>AutoAdz — Advertiser Invoice</h1><p><b>Invoice ID:</b> ${bill.id}</p><table><tr><td>Campaign</td><td><b>${camp?.title || "—"}</b></td></tr><tr><td>Client</td><td>${camp?.client || "Advertiser"}</td></tr><tr><td>Period</td><td>${bill.periodStart} to ${bill.periodEnd}</td></tr><tr><td>KMs Covered</td><td>${bill.kmsCovered} KM</td></tr><tr><td>Description</td><td>${bill.description}</td></tr><tr><td>Status</td><td>${bill.status.toUpperCase()}</td></tr><tr><td>Generated</td><td>${bill.timestamp}</td></tr></table><p class="amt" style="margin-top:24px">Amount Due: ₹${bill.amount.toLocaleString()}</p><br/><script>window.print()</script></body></html>`);
                                win.document.close();
                              }} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-lg transition cursor-pointer">
                                Print PDF
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* DRIVER SERVICE BILLS */}
                {financeSubTab === "driver_bills" && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h5 className="font-bold text-slate-800 text-xs uppercase font-mono">Weekly Driver Service Bills</h5>
                      <span className="text-[10px] text-amber-600 font-mono font-bold">{bills.filter(b => b.type === "driver_service_bill" && b.status === "pending").length} pending</span>
                    </div>
                    {bills.filter(b => b.type === "driver_service_bill").length === 0 ? (
                      <div className="py-12 text-center text-slate-400 italic text-sm">No driver bills yet. Run Auto Billing to generate them.</div>
                    ) : (
                      <div className="space-y-3">
                        {bills.filter(b => b.type === "driver_service_bill").map(bill => {
                          const dvr = drivers.find(d => d.id === bill.senderId);
                          const isPending = bill.status === "pending";
                          return (
                            <div key={bill.id} className={`bg-white border-2 rounded-2xl p-4 ${isPending ? "border-amber-200" : "border-slate-200"}`}>
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                <div className="flex-1 space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-slate-800 text-sm">{bill.senderName}</span>
                                    {dvr?.autoNumber && <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{dvr.autoNumber}</span>}
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isPending ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                                      {bill.status.toUpperCase()}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-500 font-mono">{bill.description}</p>
                                  <p className="text-[10px] text-slate-400 font-mono">{bill.periodStart} → {bill.periodEnd} · Generated {bill.timestamp}</p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <span className="text-xl font-black text-[#0B1F4D] font-mono block">₹{bill.amount.toLocaleString()}</span>
                                  <span className="text-[10px] text-slate-400 font-mono">{bill.kmsCovered} KM</span>
                                </div>
                              </div>
                              <div className="flex gap-2 mt-3 flex-wrap">
                                {isPending && (
                                  <button
                                    onClick={async () => {
                                      if (confirm(`Mark ₹${bill.amount} paid to ${bill.senderName}?`)) {
                                        try {
                                          const res = await fetch(`/api/bills/${bill.id}`, {
                                            method: "PUT",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ status: "paid" })
                                          });
                                          if (res.ok) { fetchData(); }
                                        } catch (e) { console.error(e); }
                                      }
                                    }}
                                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[11px] rounded-lg transition cursor-pointer"
                                  >
                                    ✓ Mark Paid
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    const phone = dvr?.phone?.replace(/\D/g, "") || "";
                                    const msg = `Hi ${bill.senderName}, your AutoAdz service bill of ₹${bill.amount} for the period ${bill.periodStart} to ${bill.periodEnd} (${bill.kmsCovered} KM) has been ${bill.status === "paid" ? "paid. Thank you!" : "generated and is pending payment."}`;
                                    window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`, "_blank");
                                  }}
                                  className="px-3 py-1.5 bg-[#25D366] hover:bg-[#1ebe5b] text-white font-bold text-[11px] rounded-lg transition cursor-pointer"
                                >
                                  WhatsApp
                                </button>
                                <button
                                  onClick={() => {
                                    const win = window.open("", "_blank");
                                    if (!win) return;
                                    win.document.write(`<!DOCTYPE html><html><head><title>Driver Bill</title><style>body{font-family:sans-serif;padding:40px;max-width:600px;margin:auto}h1{color:#0B1F4D}table{width:100%;border-collapse:collapse;margin-top:16px}td{padding:8px;border-bottom:1px solid #eee}.amt{font-size:24px;font-weight:900;color:#0B1F4D}@media print{body{padding:0}}</style></head><body><h1>AutoAdz — Driver Service Bill</h1><p><b>Bill ID:</b> ${bill.id}</p><table><tr><td>Driver</td><td><b>${bill.senderName}</b></td></tr><tr><td>Auto No.</td><td>${dvr?.autoNumber || "—"}</td></tr><tr><td>Period</td><td>${bill.periodStart} to ${bill.periodEnd}</td></tr><tr><td>KMs Covered</td><td>${bill.kmsCovered} KM</td></tr><tr><td>Description</td><td>${bill.description}</td></tr><tr><td>Status</td><td>${bill.status.toUpperCase()}</td></tr><tr><td>Generated</td><td>${bill.timestamp}</td></tr></table><p class="amt" style="margin-top:24px">Amount: ₹${bill.amount.toLocaleString()}</p><br/><script>window.print()</script></body></html>`);
                                    win.document.close();
                                  }}
                                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-lg transition cursor-pointer"
                                >
                                  Print PDF
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
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

                {/* AUTO BILLING SCHEDULER */}
                {financeSubTab === "scheduler" && (
                  <div className="space-y-4">
                    {/* Scheduler Info Card */}
                    <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 space-y-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div>
                          <h5 className="font-bold text-[#0B1F4D] text-sm font-mono uppercase">Weekly Auto Billing</h5>
                          <p className="text-[11px] text-slate-500 mt-0.5">Runs every Monday 9 AM IST. Bills all drivers based on their city's driver rate × GPS km for the week.</p>
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch("/api/scheduler/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled: !schedulerEnabled }) });
                              if (res.ok) { const d = await res.json(); setSchedulerEnabled(d.settings.enabled); fetchData(); }
                            } catch (e) { console.error(e); }
                          }}
                          className={`px-4 py-2 rounded-xl text-[11px] font-mono font-black transition cursor-pointer border-2 ${schedulerEnabled ? "bg-emerald-50 text-emerald-700 border-emerald-300" : "bg-slate-100 text-slate-500 border-slate-300"}`}
                        >
                          {schedulerEnabled ? "● ACTIVE — Click to Pause" : "○ PAUSED — Click to Enable"}
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                        <div className="bg-slate-50 rounded-xl p-3">
                          <span className="text-[10px] text-slate-400 font-mono uppercase block">Last Run</span>
                          <span className="font-bold text-slate-700 block mt-0.5">{schedulerLastRun || "Never"}</span>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3">
                          <span className="text-[10px] text-slate-400 font-mono uppercase block">Next Run</span>
                          <span className="font-bold text-[#0B1F4D] block mt-0.5">{schedulerNextRun || "Monday 9:00 AM IST"}</span>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3">
                          <span className="text-[10px] text-slate-400 font-mono uppercase block">Rate Source</span>
                          <span className="font-bold text-slate-700 block mt-0.5">Cities Tab (per city)</span>
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          disabled={!!schedulerRunStatus}
                          onClick={async () => {
                            setSchedulerRunStatus("Running...");
                            try {
                              const res = await fetch("/api/scheduler/trigger", { method: "POST", headers: { "Content-Type": "application/json" } });
                              if (res.ok) {
                                const result = await res.json();
                                setSchedulerRunStatus(result.summary);
                                fetchData();
                              } else { setSchedulerRunStatus("Failed"); }
                            } catch (e) { console.error(e); setSchedulerRunStatus("Error"); }
                            finally { setTimeout(() => setSchedulerRunStatus(""), 10000); }
                          }}
                          className="w-full py-3 bg-[#FF9800] hover:bg-orange-600 disabled:bg-slate-300 text-slate-950 font-black font-mono text-xs rounded-xl transition cursor-pointer uppercase"
                        >
                          🚀 {schedulerRunStatus || "Run Billing Now (Manual Trigger)"}
                        </button>
                        {schedulerRunStatus && <p className="text-[10px] font-mono text-center text-indigo-600 font-bold mt-2 animate-pulse">{schedulerRunStatus}</p>}
                      </div>
                    </div>

                    {/* Run Logs */}
                    <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 space-y-3">
                      <h5 className="font-bold text-slate-800 text-xs uppercase font-mono">Run History</h5>
                      {schedulerLogs.length === 0 ? (
                        <p className="text-center text-slate-400 italic py-6 text-sm">No billing runs yet.</p>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {schedulerLogs.map((log, idx) => (
                            <div key={idx} className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold flex-shrink-0 mt-0.5 ${log.status === "Success" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                                {log.status}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] text-slate-700 leading-relaxed">{log.message}</p>
                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">{log.timestamp}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
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
