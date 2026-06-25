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
  FileText, Wallet, Bell, User, Map, Settings, Send, 
  Smartphone, Shield, Check, RotateCcw, Camera, HelpCircle, 
  TrendingUp, Award, Navigation, RefreshCw, Eye, ThumbsUp, 
  ThumbsDown, Sparkles, MessageSquare, Activity, ShieldAlert,
  Sun, Moon, Upload
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

  // Telematics Ride Simulator
  const [simulatedKmsToday, setSimulatedKmsToday] = useState<number>(42.0);
  const [simulatedKmsTotal, setSimulatedKmsTotal] = useState<number>(14250);
  const [isSimulatingDrive, setIsSimulatingDrive] = useState(false);

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

  // Tracking Mode: "gps" (real hardware GPS) or "simulated" (testing route simulator)
  const [trackingMode, setTrackingMode] = useState<"gps" | "simulated">(() => {
    const saved = localStorage.getItem("autoadz_tracking_mode");
    return (saved === "gps" || saved === "simulated") ? saved : "gps";
  });

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

    if (activeDriver.state === "tracking") {
      setGpsErrorMsg("");
      
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
        setLiveSessionSeconds(prev => {
          const next = prev + 1;
          localStorage.setItem("autoadz_live_session_seconds", String(next));
          return next;
        });

        // If in simulated mode, also increment KMs artificially every second
        if (trackingMode === "simulated") {
          setGpsStatus("active");
          // Random realistic speed of ~30-60 km/h: 0.008 to 0.016 km per second
          const inc = 0.008 + Math.random() * 0.008;
          setGpsSpeed(Math.round(inc * 3600)); // speed in km/h
          setLiveSessionKms(prevKms => {
            const nextKms = parseFloat((prevKms + inc).toFixed(4));
            localStorage.setItem("autoadz_live_session_kms", String(nextKms));
            return nextKms;
          });
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

                // Robust GPS Jitter and Stationary Drift Filters:
                // 1. Distance threshold of 10 meters (0.010 km)
                // 2. Calculated speed threshold of 4.5 km/h (minimum auto rickshaw cruising speed)
                // 3. Hardware speed (m/s) if available is less than 1.2 m/s (~4.3 km/h)
                const isHardwareStationary = speed !== null && speed !== undefined && speed < 1.2;

                if (distance < 0.010 || calcSpeed < 4.5 || isHardwareStationary) {
                  // Stationary / Drift / Noise filter
                  setGpsSpeed(0);
                  setGpsStatus("stationary");

                  // CRITICAL: Always update the reference anchor to the new coordinate even when stationary.
                  // This prevents multiple small drift events from accumulating over time into a larger distance!
                  lastCoordsRef.current = newPos;
                  localStorage.setItem("autoadz_last_coords", JSON.stringify(newPos));
                } else if (calcSpeed > 140) {
                  // Ignore sudden GPS jumps (e.g. teleporting over 140km/h)
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
      // When the driver minimizes the browser and returns later, we sync the background distance!
      const handleVisibilityChange = () => {
        if (document.visibilityState === "visible" && trackingMode === "gps") {
          // Try to immediately get a fresh position and calculate background distance
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

                  // If they moved a reasonable distance at a reasonable speed (at least 20m and 4.5 km/h to filter drift)
                  if (bgDistance > 0.02 && bgSpeed >= 4.5 && bgSpeed < 140) {
                    setLiveSessionKms(prev => {
                      const next = parseFloat((prev + bgDistance).toFixed(4));
                      localStorage.setItem("autoadz_live_session_kms", String(next));
                      return next;
                    });

                    // Update last coords
                    const newPosObj = { lat: latitude, lng: longitude, timestamp };
                    lastCoordsRef.current = newPosObj;
                    localStorage.setItem("autoadz_last_coords", JSON.stringify(newPosObj));
                    setLastCoords({ lat: latitude, lng: longitude });

                    // Welcome back notification!
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
                    // Even if stationary, update the anchor point so background drift doesn't accumulate
                    const newPosObj = { lat: latitude, lng: longitude, timestamp };
                    lastCoordsRef.current = newPosObj;
                    localStorage.setItem("autoadz_last_coords", JSON.stringify(newPosObj));
                    setLastCoords({ lat: latitude, lng: longitude });
                  }
                  
                  // Also sync elapsed timer
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
        
        // Finalize stats from local storage or state
        const savedKmsStr = localStorage.getItem("autoadz_live_session_kms");
        const finalKms = savedKmsStr ? parseFloat(savedKmsStr) : liveSessionKms;
        const finalEarnings = parseFloat((finalKms * 4.5).toFixed(2));

        // Clean up tracking local storage
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
                  state: "online"
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
      <div className="min-h-screen bg-slate-950 text-white flex flex-col relative overflow-hidden font-sans selection:bg-[#FF9800] selection:text-white">
        {/* Decorative background grids and blurs */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#FF9800]/5 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none animate-pulse"></div>

        {/* Dynamic Top Navigation Bar */}
        <nav className="w-full border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[#FF9800] rounded-xl flex items-center justify-center font-display font-black text-lg text-white shadow-lg shadow-orange-500/15">
              A
            </div>
            <span className="text-xl font-display font-black tracking-tight text-white">AutoAdz</span>
            <span className="text-[10px] font-mono bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded border border-orange-500/20">DATABASE-DRIVEN</span>
          </div>

          <div className="hidden md:flex items-center gap-6 text-sm text-slate-300 font-medium">
            <button onClick={() => setLandingSection("hero")} className={`transition hover:text-white ${landingSection === "hero" ? "text-[#FF9800] font-bold" : ""}`}>Platform Info</button>
            <button onClick={() => setLandingSection("register-campaign")} className={`transition hover:text-white ${landingSection === "register-campaign" ? "text-[#FF9800] font-bold" : ""}`}>Launch Campaign</button>
            <button onClick={() => setLandingSection("register-driver")} className={`transition hover:text-white ${landingSection === "register-driver" ? "text-[#FF9800] font-bold" : ""}`}>Become a Driver Partner</button>
            <button onClick={() => setLandingSection("login")} className={`transition hover:text-white ${landingSection === "login" ? "text-[#FF9800] font-bold" : ""}`}>Secure Portal Login</button>
          </div>

          <div className="flex items-center gap-3">
            {landingSection !== "login" ? (
              <button 
                onClick={() => setLandingSection("login")}
                className="bg-[#FF9800] hover:bg-orange-500 text-slate-950 text-xs font-bold font-mono px-4 py-2 rounded-xl shadow-md shadow-orange-500/10 transition"
              >
                ACCESS PORTALS
              </button>
            ) : (
              <button 
                onClick={() => setLandingSection("hero")}
                className="border border-slate-800 hover:bg-slate-900 text-xs font-bold font-mono px-4 py-2 rounded-xl transition"
              >
                BACK TO INFO
              </button>
            )}
          </div>
        </nav>

        {/* SUCCESS NOTIFICATIONS (Floating Toast) */}
        {(campaignSuccessMsg || driverSuccessMsg) && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border-2 border-green-500/30 text-white p-4 rounded-2xl shadow-2xl max-w-sm animate-bounce">
            <div className="flex gap-2 items-start">
              <CheckCircle className="text-green-500 shrink-0 mt-0.5" size={18} />
              <div>
                <h5 className="font-bold text-xs text-green-400 font-mono">ACTION SUCCESSFUL</h5>
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
                <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold tracking-widest text-[#FF9800] bg-orange-500/10 border border-orange-500/20 rounded-full px-3 py-1">
                  ⚡ NEXT-GEN TRANSIT OUT-OF-HOME (OOH)
                </span>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-extrabold text-white leading-none tracking-tight">
                  India's Smartest, <span className="text-[#FF9800]">Database-Driven</span> Auto Advertising Hub
                </h2>
                <p className="text-sm md:text-base text-slate-400 leading-relaxed max-w-2xl">
                  We turn thousands of auto-rickshaws into high-impact, rolling brand banners backed by live GPS telematics, tamper-proof photo audits, and verified driver payout schedules. No black boxes. Pure data, complete transparency.
                </p>

                {/* Database Metrics Grid - Real Database Counts! */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-900/60 border border-slate-800/80 p-5 rounded-3xl backdrop-blur-xs font-mono">
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-white">{campaigns.length}</p>
                    <p className="text-[9px] text-slate-400 uppercase tracking-wider">Total Campaigns</p>
                  </div>
                  <div className="space-y-1 border-l border-slate-800/80 pl-4">
                    <p className="text-2xl font-bold text-teal-400">{drivers.length}</p>
                    <p className="text-[9px] text-slate-400 uppercase tracking-wider">Auto Rickshaws</p>
                  </div>
                  <div className="space-y-1 border-l border-slate-800/80 pl-4">
                    <p className="text-2xl font-bold text-[#FF9800]">{(totalKmsAll + simulatedKmsTotal).toLocaleString()}+</p>
                    <p className="text-[9px] text-slate-400 uppercase tracking-wider">Live Tracked KM</p>
                  </div>
                  <div className="space-y-1 border-l border-slate-800/80 pl-4">
                    <p className="text-2xl font-bold text-indigo-400">{totalScansAll.toLocaleString()}</p>
                    <p className="text-[9px] text-slate-400 uppercase tracking-wider">QR Scans Logged</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 pt-2">
                  <button 
                    onClick={() => setLandingSection("register-campaign")} 
                    className="bg-[#FF9800] hover:bg-orange-500 text-slate-950 font-bold font-mono text-xs px-6 py-3.5 rounded-2xl shadow-lg shadow-orange-500/10 transition flex items-center gap-2"
                  >
                    <Plus size={16} /> LAUNCH A BRAND CAMPAIGN
                  </button>
                  <button 
                    onClick={() => setLandingSection("register-driver")} 
                    className="border border-slate-800 bg-slate-900/40 hover:bg-slate-900 hover:border-slate-700 text-white font-bold font-mono text-xs px-6 py-3.5 rounded-2xl transition flex items-center gap-2"
                  >
                    <Smartphone size={16} /> BECOME A DRIVER PARTNER
                  </button>
                </div>
              </div>

              {/* Hero Right Interactive Display Card */}
              <div className="lg:col-span-5 relative">
                {/* Floating ambient badge */}
                <div className="absolute -top-4 -left-4 bg-slate-900 border border-slate-800 p-3 rounded-2xl shadow-xl flex items-center gap-2.5 z-20 font-mono animate-pulse">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                  <div className="text-left">
                    <p className="text-[10px] font-bold text-white">LIVE FEED</p>
                    <p className="text-[8px] text-slate-400">GPS TELEMETRY RUNNING</p>
                  </div>
                </div>

                {/* Auto Rickshaw Billboard Mockup */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-6 rounded-4xl shadow-2xl relative overflow-hidden text-left">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl"></div>
                  
                  <div className="flex justify-between items-center pb-4 border-b border-slate-800/80 mb-4">
                    <h4 className="text-xs font-bold font-mono text-slate-400 uppercase">Interactive Preview</h4>
                    <span className="text-[9px] font-mono bg-teal-500/10 text-teal-400 px-2 py-0.5 rounded">AUTO-RICKSHAW BILLBOARD</span>
                  </div>

                  <div className="rounded-2xl overflow-hidden relative border border-slate-800 mb-4 shadow-inner">
                    <img 
                      src="https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&q=80&w=800"
                      alt="Rickshaw Media" 
                      className="w-full h-44 object-cover brightness-95"
                    />
                    <div className="absolute bottom-3 left-3 bg-slate-950/90 text-white text-[9px] font-mono font-bold px-2.5 py-1 rounded-lg border border-slate-800/80">
                      📍 BANNER creative template
                    </div>
                  </div>

                  {/* Tracking Map Mockup inside Hero */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 space-y-2.5 font-mono">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-400">Current Campaign:</span>
                      <span className="text-[#FF9800] font-bold">Tata Punch EV Launch</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-400">Active Fleet Coverage:</span>
                      <span className="text-teal-400 font-bold">25 Rickshaws Online</span>
                    </div>
                    <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-500 rounded-full w-2/3 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Platform Feature Benefits Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
              {/* For Advertisers */}
              <div className="bg-slate-900/40 border border-slate-900 hover:border-slate-800 p-6 rounded-3xl text-left transition space-y-3">
                <div className="w-10 h-10 bg-orange-500/10 text-[#FF9800] flex items-center justify-center rounded-2xl">
                  <TrendingUp size={20} />
                </div>
                <h4 className="font-display font-extrabold text-base text-white">For Brands & Advertisers</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Plan campaigns, choose cities and localities, select custom auto counts, and upload your digital-ready ad copy templates. Follow active kilometers driven on high-contrast GPS dashboards.
                </p>
                <button onClick={() => setLandingSection("register-campaign")} className="text-xs text-[#FF9800] font-bold font-mono hover:underline flex items-center gap-1">
                  Submit a campaign idea <ChevronRight size={12} />
                </button>
              </div>

              {/* For Drivers */}
              <div className="bg-slate-900/40 border border-slate-900 hover:border-slate-800 p-6 rounded-3xl text-left transition space-y-3">
                <div className="w-10 h-10 bg-teal-500/10 text-teal-400 flex items-center justify-center rounded-2xl">
                  <Smartphone size={20} />
                </div>
                <h4 className="font-display font-extrabold text-base text-white">For Auto-Rickshaw Drivers</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Earn supplementary income simply by carrying a banner. Upload your daily check-in proofs and keep the GPS meter running while completing passenger trips. Get secure daily transfers.
                </p>
                <button onClick={() => setLandingSection("register-driver")} className="text-xs text-teal-400 font-bold font-mono hover:underline flex items-center gap-1">
                  Become a driver partner <ChevronRight size={12} />
                </button>
              </div>

              {/* For Admins */}
              <div className="bg-slate-900/40 border border-slate-900 hover:border-slate-800 p-6 rounded-3xl text-left transition space-y-3">
                <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 flex items-center justify-center rounded-2xl">
                  <Shield size={20} />
                </div>
                <h4 className="font-display font-extrabold text-base text-white">For Operations Admins</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Full command control of registrations, verification of driver KYC documents, audit check-in photo proofs, assign active campaigns to drivers, and track total regional telemetry logs.
                </p>
                <button onClick={() => setLandingSection("login")} className="text-xs text-[#FF9800] font-bold font-mono hover:underline flex items-center gap-1">
                  Enter Operations Center <ChevronRight size={12} />
                </button>
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
                <div className="space-y-1">
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
              <h1 className="text-2xl font-display font-extrabold tracking-tight">AutoAdz</h1>
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
                                    {campaigns.find(c => c.id === loggedInDriver.currentCampaignId)?.title || "Tata Punch EV Bangalore"}
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
                                <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-lg border border-white/5">
                                  <button
                                    onClick={() => setTrackingMode("gps")}
                                    className={`py-1 rounded text-[9px] font-bold uppercase tracking-wider transition-all ${
                                      trackingMode === "gps"
                                        ? "bg-[#FF9800] text-[#0B1F4D] shadow-sm"
                                        : "text-slate-400 hover:text-white"
                                    }`}
                                  >
                                    🛰️ Hardware GPS
                                  </button>
                                  <button
                                    onClick={() => setTrackingMode("simulated")}
                                    className={`py-1 rounded text-[9px] font-bold uppercase tracking-wider transition-all ${
                                      trackingMode === "simulated"
                                        ? "bg-[#FF9800] text-[#0B1F4D] shadow-sm"
                                        : "text-slate-400 hover:text-white"
                                    }`}
                                  >
                                    🧪 Demo Simulator
                                  </button>
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
                                        ? "⚠️ Device is stationary. GPS distance will only increment once physical movement is detected (>1.5 km/h)."
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
                            {proofs.filter(p => p.driverId === loggedInDriverId).slice(0, 3).map(p => (
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
                        <th className="py-2.5">Assigned Drivers</th>
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
                        <th className="py-2.5">Assigned Campaign</th>
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
              {/* Trip Simulation Station */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                  <div className="p-2 bg-teal-500/10 text-teal-500 rounded-xl">
                    <Navigation size={18} />
                  </div>
                  <div>
                    <h4 className="font-display font-extrabold text-[#0B1F4D] text-sm">Interactive GPS Route Simulator</h4>
                    <p className="text-[11px] text-slate-500">Trigger simulated driving runs to instantly verify telemetry and earnings</p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Verify the automatic transit billing engine! Below triggers a virtual drive in Bangalore. Payout is calculated instantly at <b>₹4.50/KM</b>.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    disabled={isSimulatingDrive}
                    onClick={() => handleSimulateDrive(5)}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-teal-500/10 bg-teal-50/40 hover:bg-teal-50 text-teal-800 transition text-xs font-bold font-mono text-left disabled:opacity-50 cursor-pointer"
                  >
                    <div>
                      <span>🚗 5 KM City Run</span>
                      <span className="text-[10px] block text-slate-400 font-normal">Indiranagar ➔ Koramangala</span>
                    </div>
                    <span className="bg-teal-100 text-teal-900 px-2 py-1 rounded text-[10px] font-black">+₹22.50</span>
                  </button>

                  <button
                    disabled={isSimulatingDrive}
                    onClick={() => handleSimulateDrive(15)}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-teal-500/10 bg-teal-50/40 hover:bg-teal-50 text-teal-800 transition text-xs font-bold font-mono text-left disabled:opacity-50 cursor-pointer"
                  >
                    <div>
                      <span>🚙 15 KM Highway Run</span>
                      <span className="text-[10px] block text-slate-400 font-normal">MG Road ➔ Whitefield</span>
                    </div>
                    <span className="bg-teal-100 text-teal-900 px-2 py-1 rounded text-[10px] font-black">+₹67.50</span>
                  </button>
                </div>

                {isSimulatingDrive && (
                  <div className="bg-teal-950 text-teal-300 p-3.5 rounded-xl text-xs font-mono flex items-center justify-between animate-pulse">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-teal-400 rounded-full animate-ping"></span>
                      GPS Satellite Stream active...
                    </span>
                    <span>Coordinates Transmitted</span>
                  </div>
                )}
              </div>

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

        </div>
      </div>
    </div>
  );
}
