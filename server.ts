import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { Campaign, Driver, Proof, WalletTransaction, NotificationItem } from "./src/types";

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Google GenAI if key is present
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  } catch (err) {
    console.error("Failed to initialize Gemini Client", err);
  }
}

// In-Memory Database (mocking durable state)
let campaigns: Campaign[] = [
  {
    id: "camp_1",
    title: "Tata Punch EV Launch Bangalore",
    client: "Tata Motors South",
    city: "Bangalore",
    area: "Indiranagar, Koramangala, Whitefield",
    budget: 150000,
    autosCount: 25,
    creativeUrl: "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&q=80&w=800",
    status: "active",
    startDate: "2026-06-15",
    endDate: "2026-07-15",
    kmsCovered: 14250,
    qrScans: 842,
    gpsRoute: [
      { lat: 12.9716, lng: 77.5946 },
      { lat: 12.9279, lng: 77.6271 },
      { lat: 12.9698, lng: 77.7500 },
      { lat: 12.9784, lng: 77.6408 },
    ],
  },
  {
    id: "camp_2",
    title: "Haldiram's Durga Puja Special",
    client: "Haldiram's East",
    city: "Kolkata",
    area: "North Kolkata, Salt Lake, Gariahat",
    budget: 320000,
    autosCount: 50,
    creativeUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=800",
    status: "pending",
    startDate: "2026-09-01",
    endDate: "2026-10-15",
    kmsCovered: 0,
    qrScans: 0,
    gpsRoute: [],
  },
  {
    id: "camp_3",
    title: "Swiggy Instamart Morning Delivery",
    client: "Swiggy India",
    city: "Mumbai",
    area: "Andheri West, Bandra, Juhu",
    budget: 95000,
    autosCount: 15,
    creativeUrl: "https://images.unsplash.com/photo-1526367790999-015078648c7e?auto=format&fit=crop&q=80&w=800",
    status: "completed",
    startDate: "2026-05-01",
    endDate: "2026-05-31",
    kmsCovered: 24150,
    qrScans: 1452,
    gpsRoute: [
      { lat: 19.1136, lng: 72.8697 },
      { lat: 19.0596, lng: 72.8295 },
      { lat: 19.1044, lng: 72.8268 },
    ],
  },
];

let drivers: Driver[] = [
  {
    id: "driver_1",
    name: "Rajesh Kumar",
    phone: "9876543210",
    autoNumber: "KA-03-EX-4921",
    location: "Bangalore - Indiranagar",
    state: "tracking",
    kycVerified: true,
    totalEarnings: 18450,
    walletBalance: 3250,
    currentCampaignId: "camp_1",
    status: "active",
  },
  {
    id: "driver_2",
    name: "Subir Das",
    phone: "9123456780",
    autoNumber: "WB-04-BJ-9871",
    location: "Kolkata - Salt Lake",
    state: "online",
    kycVerified: true,
    totalEarnings: 12400,
    walletBalance: 1500,
    currentCampaignId: null,
    status: "active",
  },
  {
    id: "driver_3",
    name: "Amit Shaw",
    phone: "9988776655",
    autoNumber: "WB-02-AG-5544",
    location: "Kolkata - Shyambazar",
    state: "offline",
    kycVerified: false,
    totalEarnings: 0,
    walletBalance: 0,
    currentCampaignId: null,
    status: "pending_approval",
  },
];

let proofs: Proof[] = [
  {
    id: "proof_1",
    driverId: "driver_1",
    driverName: "Rajesh Kumar",
    campaignId: "camp_1",
    campaignTitle: "Tata Punch EV Launch Bangalore",
    type: "installation",
    imageUrl: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=800",
    timestamp: "2026-06-15 09:30 AM",
    location: "Koramangala Auto Stand",
    status: "approved",
  },
  {
    id: "proof_2",
    driverId: "driver_1",
    driverName: "Rajesh Kumar",
    campaignId: "camp_1",
    campaignTitle: "Tata Punch EV Launch Bangalore",
    type: "morning",
    imageUrl: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&q=80&w=800",
    timestamp: "2026-06-24 07:15 AM",
    location: "Indiranagar Metro Station",
    status: "pending",
  },
  {
    id: "proof_3",
    driverId: "driver_2",
    driverName: "Subir Das",
    campaignId: "camp_2",
    campaignTitle: "Haldiram's Durga Puja Special",
    type: "installation",
    imageUrl: "https://images.unsplash.com/photo-1494976388531-d1058094e2bd?auto=format&fit=crop&q=80&w=800",
    timestamp: "2026-06-20 11:45 AM",
    location: "Salt Lake Sector V",
    status: "approved",
  },
];

let walletTransactions: WalletTransaction[] = [
  {
    id: "tx_1",
    userId: "advertiser_main",
    type: "deposit",
    amount: 500000,
    status: "success",
    description: "Added funds via Razorpay",
    timestamp: "2026-06-01 10:00 AM",
  },
  {
    id: "tx_2",
    userId: "advertiser_main",
    type: "payment",
    amount: 150000,
    status: "success",
    description: "Paid for campaign: Tata Punch EV",
    timestamp: "2026-06-14 04:30 PM",
  },
  {
    id: "tx_3",
    userId: "driver_1",
    type: "earning",
    amount: 500,
    status: "success",
    description: "Daily payout - 120km covered",
    timestamp: "2026-06-23 09:00 PM",
  },
  {
    id: "tx_4",
    userId: "driver_1",
    type: "withdrawal",
    amount: 2000,
    status: "success",
    description: "Withdrew to bank account",
    timestamp: "2026-06-22 11:00 AM",
  },
];

let notifications: NotificationItem[] = [
  {
    id: "notif_1",
    title: "Campaign Approved",
    message: "Your 'Tata Punch EV Launch Bangalore' campaign is now active on 25 auto-rickshaws.",
    timestamp: "2026-06-15 10:00 AM",
    unread: false,
    type: "campaign",
  },
  {
    id: "notif_2",
    title: "New Proof Uploaded",
    message: "Driver Rajesh Kumar has uploaded a morning checklist photo for verification.",
    timestamp: "2026-06-24 07:16 AM",
    unread: true,
    type: "driver",
  },
  {
    id: "notif_3",
    title: "New Driver Awaiting Verification",
    message: "Driver Amit Shaw has submitted KYC and vehicle RC documents for approval.",
    timestamp: "2026-06-24 05:00 AM",
    unread: true,
    type: "driver",
  },
];

// Helper to update statistics in background simulation
setInterval(() => {
  // Simulate incremental kilometers and QR scans on active campaigns
  campaigns = campaigns.map((camp) => {
    if (camp.status === "active") {
      const addedKms = Math.floor(Math.random() * 3) + 1;
      const addedScans = Math.random() > 0.7 ? 1 : 0;
      return {
        ...camp,
        kmsCovered: camp.kmsCovered + addedKms,
        qrScans: camp.qrScans + addedScans,
      };
    }
    return camp;
  });

  // Simulate active tracking for online/tracking drivers
  drivers = drivers.map((driver) => {
    if (driver.state === "tracking" && driver.currentCampaignId) {
      const addedEarning = Math.floor(Math.random() * 5) + 2;
      return {
        ...driver,
        totalEarnings: driver.totalEarnings + addedEarning,
        walletBalance: driver.walletBalance + addedEarning,
      };
    }
    return driver;
  });
}, 10000); // simulation tick every 10s

// EXPRESS MIDDLEWARES
app.use(express.json({ limit: "10mb" }));

// API ROUTES
// Campaigns
app.get("/api/campaigns", (req, res) => {
  res.json(campaigns);
});

app.post("/api/campaigns", (req, res) => {
  const { title, client, city, area, budget, autosCount, creativeUrl } = req.body;
  const newCampaign: Campaign = {
    id: `camp_${Date.now()}`,
    title: title || "New Campaign",
    client: client || "Independent Advertiser",
    city: city || "Bangalore",
    area: area || "Central Area",
    budget: Number(budget) || 50000,
    autosCount: Number(autosCount) || 10,
    creativeUrl: creativeUrl || "https://images.unsplash.com/photo-1501183007986-d0d080b147f9?auto=format&fit=crop&q=80&w=800",
    status: "pending",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    kmsCovered: 0,
    qrScans: 0,
    gpsRoute: [
      { lat: 12.9716, lng: 77.5946 },
      { lat: 12.9279, lng: 77.6271 },
    ],
  };
  campaigns.unshift(newCampaign);

  // Auto-deduct from advertiser funds
  walletTransactions.unshift({
    id: `tx_${Date.now()}`,
    userId: "advertiser_main",
    type: "payment",
    amount: newCampaign.budget,
    status: "success",
    description: `Pre-payment for campaign: ${newCampaign.title}`,
    timestamp: new Date().toLocaleString(),
  });

  // Add notification
  notifications.unshift({
    id: `notif_${Date.now()}`,
    title: "Campaign Created",
    message: `Your campaign '${newCampaign.title}' is pending admin approval. ₹${newCampaign.budget.toLocaleString()} was reserved from your wallet.`,
    timestamp: new Date().toLocaleString(),
    unread: true,
    type: "campaign",
  });

  res.status(201).json(newCampaign);
});

app.put("/api/campaigns/:id", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const index = campaigns.findIndex((c) => c.id === id);
  if (index !== -1) {
    campaigns[index].status = status;
    
    // Add notification
    notifications.unshift({
      id: `notif_${Date.now()}`,
      title: `Campaign Status Updated`,
      message: `Your campaign '${campaigns[index].title}' has been marked as ${status}.`,
      timestamp: new Date().toLocaleString(),
      unread: true,
      type: "campaign",
    });

    res.json(campaigns[index]);
  } else {
    res.status(404).json({ error: "Campaign not found" });
  }
});

// Drivers
app.get("/api/drivers", (req, res) => {
  res.json(drivers);
});

app.post("/api/drivers", (req, res) => {
  const { name, phone, autoNumber, location } = req.body;
  const newDriver: Driver = {
    id: `driver_${Date.now()}`,
    name: name || "Anonymous Driver",
    phone: phone || "9999999999",
    autoNumber: autoNumber || "KA-01-XX-0000",
    location: location || "Bangalore",
    state: "offline",
    kycVerified: false,
    totalEarnings: 0,
    walletBalance: 0,
    currentCampaignId: null,
    status: "pending_approval",
  };
  drivers.push(newDriver);

  notifications.unshift({
    id: `notif_${Date.now()}`,
    title: "New Driver Registered",
    message: `${newDriver.name} has signed up and is waiting for KYC verification.`,
    timestamp: new Date().toLocaleString(),
    unread: true,
    type: "driver",
  });

  res.status(201).json(newDriver);
});

app.put("/api/drivers/:id", (req, res) => {
  const { id } = req.params;
  const { status, kycVerified, currentCampaignId, state } = req.body;
  const index = drivers.findIndex((d) => d.id === id);
  if (index !== -1) {
    if (status !== undefined) drivers[index].status = status;
    if (kycVerified !== undefined) drivers[index].kycVerified = kycVerified;
    if (currentCampaignId !== undefined) drivers[index].currentCampaignId = currentCampaignId;
    if (state !== undefined) drivers[index].state = state;

    res.json(drivers[index]);
  } else {
    res.status(404).json({ error: "Driver not found" });
  }
});

// Proofs
app.get("/api/proofs", (req, res) => {
  res.json(proofs);
});

app.post("/api/proofs", (req, res) => {
  const { driverId, campaignId, type, imageUrl, location } = req.body;
  const driver = drivers.find((d) => d.id === driverId);
  const campaign = campaigns.find((c) => c.id === campaignId);

  const newProof: Proof = {
    id: `proof_${Date.now()}`,
    driverId: driverId || "driver_1",
    driverName: driver ? driver.name : "Unknown Driver",
    campaignId: campaignId || "camp_1",
    campaignTitle: campaign ? campaign.title : "Unknown Campaign",
    type: type || "installation",
    imageUrl: imageUrl || "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&q=80&w=800",
    timestamp: new Date().toLocaleTimeString() + " " + new Date().toLocaleDateString(),
    location: location || "Bangalore",
    status: "pending",
  };
  proofs.unshift(newProof);

  notifications.unshift({
    id: `notif_${Date.now()}`,
    title: "Proof Uploaded",
    message: `${newProof.driverName} uploaded ${newProof.type} proof for ${newProof.campaignTitle}.`,
    timestamp: new Date().toLocaleString(),
    unread: true,
    type: "driver",
  });

  res.status(201).json(newProof);
});

app.put("/api/proofs/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const index = proofs.findIndex((p) => p.id === id);
  if (index !== -1) {
    proofs[index].status = status;
    
    // If approved, trigger auto-payout simulation for the driver
    if (status === "approved" && proofs[index].type !== "installation") {
      const dIndex = drivers.findIndex((d) => d.id === proofs[index].driverId);
      if (dIndex !== -1) {
        const reward = 450; // ₹450 flat rate per approved proof
        drivers[dIndex].totalEarnings += reward;
        drivers[dIndex].walletBalance += reward;
        walletTransactions.unshift({
          id: `tx_${Date.now()}`,
          userId: drivers[dIndex].id,
          type: "earning",
          amount: reward,
          status: "success",
          description: `Daily Earning - Approved ${proofs[index].type} Proof`,
          timestamp: new Date().toLocaleString(),
        });
      }
    }

    res.json(proofs[index]);
  } else {
    res.status(404).json({ error: "Proof not found" });
  }
});

// Wallet
app.get("/api/wallet/transactions", (req, res) => {
  res.json(walletTransactions);
});

app.post("/api/wallet/transactions", (req, res) => {
  const { userId, type, amount, description } = req.body;
  const newTx: WalletTransaction = {
    id: `tx_${Date.now()}`,
    userId: userId || "advertiser_main",
    type: type || "deposit",
    amount: Number(amount) || 0,
    status: "success",
    description: description || "Wallet transaction",
    timestamp: new Date().toLocaleString(),
  };
  walletTransactions.unshift(newTx);

  if (type === "deposit" && userId === "advertiser_main") {
    // simulated transaction
  } else if (type === "withdrawal") {
    const dIndex = drivers.findIndex((d) => d.id === userId);
    if (dIndex !== -1) {
      drivers[dIndex].walletBalance = Math.max(0, drivers[dIndex].walletBalance - Number(amount));
    }
  }

  res.status(201).json(newTx);
});

// Notifications
app.get("/api/notifications", (req, res) => {
  res.json(notifications);
});

app.post("/api/notifications/read", (req, res) => {
  notifications = notifications.map((n) => ({ ...n, unread: false }));
  res.json({ success: true });
});

// AI Assistant
app.post("/api/gemini/chat", async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages array is required" });
  }

  if (!ai) {
    return res.status(503).json({
      reply: "The Gemini AI Client is initializing. Please verify that your `GEMINI_API_KEY` is configured in the Secrets panel on the top right. Here is a simulated, helpful advice: For North Kolkata, we recommend at least 35 autos to achieve effective hyperlocal coverage (budget ₹2,20,000, expected reach 1.2 Million impressions).",
    });
  }

  try {
    const userPrompt = messages[messages.length - 1].text;

    // Create a context-rich prompt inject
    const systemInstruction = `You are the AutoAdz AI Assistant, the intelligent heart of India's leading auto-rickshaw transit advertising platform.
You are helping advertisers, drivers, and admins maximize marketing ROI and driver earnings.
Keep responses incredibly actionable, friendly, and structured. Use bullet points and simple headers where appropriate.
If asked about calculations, perform them mathematically.
Here is the current live data in the database:
- Campaigns list: ${JSON.stringify(campaigns.map(c => ({ title: c.title, status: c.status, budget: c.budget, autos: c.autosCount, city: c.city, kms: c.kmsCovered, scans: c.qrScans })))}
- Drivers summary: Total registered: ${drivers.length}. Online right now: ${drivers.filter(d => d.state !== "offline").length}. Active Campaign-linked: ${drivers.filter(d => d.currentCampaignId).length}.
- Performance: Average conversion rate from QR scans is 3.4%. Average daily travel of an auto is 85-110 KM, which generates roughly 40,000 eye-level impressions daily in dense Indian tier-1/tier-2 cities.

Capabilities to cover:
1. Suggest optimal number of autos based on target locations (e.g., "How many autos are needed for North Kolkata?"). North Kolkata is a highly congested commercial and historic hub; recommend 30-45 autos with a budget of ₹1.8L-2.5L for premium visibility.
2. Predict campaign reach. (Formula: number of autos * days * 40,000 daily impressions).
3. Analyze QR scan performance (calculate average scans per active vehicle, CTR prediction).
4. Act as support chatbot for drivers or advertisers.
Do not use markdown blocks for entire replies, just structure nicely with normal formatting. Let's make it look pristine.`;

    const chatSession = ai.chats.create({
      model: "gemini-3.5-flash",
      config: {
        systemInstruction,
      },
    });

    // Provide the short chat history
    let replyText = "";
    // Send the last message
    const result = await chatSession.sendMessage({ message: userPrompt });
    replyText = result.text || "I apologize, but I couldn't compute an answer. Please check back shortly.";

    res.json({ reply: replyText });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({
      error: "AI Generation Failed",
      reply: "My servers are feeling a bit congested right now. Here is a quick estimate: To cover North Kolkata properly, you would need roughly 35 autos running for 30 days to cover Salt Lake, Shyambazar, and Hatibagan, yielding approximately 37.8 Million impressions at a CPM of ₹5.5.",
    });
  }
});

// START EXPRESS SERVER WITH VITE INTEGRATION
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AutoAdz full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
