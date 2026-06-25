import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Google GenAI if key is present
let ai = null;
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

import fs from "fs";

// Path to persistent JSON database file
const DB_FILE = path.join(process.cwd(), "db.json");

// Default initial datasets (fallback seeds)
const defaultCampaigns = [];

const defaultDrivers = [
  {
    id: "driver_delip",
    name: "Delip",
    phone: "9836130393",
    autoNumber: "WB-01-EX-1234",
    location: "Kolkata - Gariahat",
    state: "offline",
    kycVerified: true,
    totalEarnings: 0,
    walletBalance: 0,
    currentCampaignId: null,
    status: "active",
  },
];

const defaultProofs = [];

const defaultWalletTransactions = [
  {
    id: "tx_initial_advertiser",
    userId: "advertiser_main",
    type: "deposit",
    amount: 500000,
    status: "success",
    description: "Initial Demo Deposited Balance",
    timestamp: "2026-06-25 12:00 PM",
  },
];

const defaultNotifications = [];

// Active databases
let campaigns = [];
let drivers = [];
let proofs = [];
let walletTransactions = [];
let notifications = [];

// Helper to save all collections to db.json
function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify({
      campaigns,
      drivers,
      proofs,
      walletTransactions,
      notifications
    }, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save JSON database to disk:", err);
  }
}

// Load databases on startup
function initDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
      campaigns = data.campaigns || [];
      drivers = data.drivers || [];
      proofs = data.proofs || [];
      walletTransactions = data.walletTransactions || [];
      notifications = data.notifications || [];
      console.log(`Database loaded successfully from ${DB_FILE}`);
      
      // Ensure "delip" exists even in loaded databases
      if (!drivers.some(d => d.phone === "9836130393" || d.id === "driver_delip")) {
        drivers.push({
          id: "driver_delip",
          name: "Delip",
          phone: "9836130393",
          autoNumber: "WB-01-EX-1234",
          location: "Kolkata - Gariahat",
          state: "offline",
          kycVerified: true,
          totalEarnings: 0,
          walletBalance: 0,
          currentCampaignId: null,
          status: "active",
        });
        saveDatabase();
      }
    } else {
      console.log(`No database file found. Seeding new database at ${DB_FILE}`);
      campaigns = [...defaultCampaigns];
      drivers = [...defaultDrivers];
      proofs = [...defaultProofs];
      walletTransactions = [...defaultWalletTransactions];
      notifications = [...defaultNotifications];
      saveDatabase();
    }
  } catch (err) {
    console.error("Failed to initialize database, using memory fallbacks:", err);
    campaigns = [...defaultCampaigns];
    drivers = [...defaultDrivers];
    proofs = [...defaultProofs];
    walletTransactions = [...defaultWalletTransactions];
    notifications = [...defaultNotifications];
  }
}

// Perform synchronous initial load
initDatabase();

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

  saveDatabase();
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
  const newCampaign = {
    id: `camp_${Date.now()}`,
    title: title || "New Campaign",
    client: client || "Independent Advertiser",
    city: city || "Bangalore",
    area: area || "Central Area",
    budget: Number(budget) || 50000,
    autosCount: Number(autosCount) || 10,
    creativeUrl: creativeUrl || "https://images.unsplash.com/photo-1501183007986-d0d080b147f9?auto=format&fit=crop&q=80&w=800",
    status: "pending",
    creativeStatus: "pending",
    creativeApproved: false,
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
    message: `Your campaign '${newCampaign.title}' is pending admin approval. Ad creative status: Pending Approval.`,
    timestamp: new Date().toLocaleString(),
    unread: true,
    type: "campaign",
  });

  saveDatabase();

  res.status(201).json(newCampaign);
});

app.put("/api/campaigns/:id", (req, res) => {
  const { id } = req.params;
  const { status, kmsCovered, qrScans, creativeUrl, creativeStatus, creativeApproved } = req.body;
  const index = campaigns.findIndex((c) => c.id === id);
  if (index !== -1) {
    if (status !== undefined) campaigns[index].status = status;
    if (kmsCovered !== undefined) campaigns[index].kmsCovered = Number(kmsCovered);
    if (qrScans !== undefined) campaigns[index].qrScans = Number(qrScans);
    if (creativeUrl !== undefined) campaigns[index].creativeUrl = creativeUrl;
    if (creativeStatus !== undefined) campaigns[index].creativeStatus = creativeStatus;
    if (creativeApproved !== undefined) campaigns[index].creativeApproved = creativeApproved;
    
    // Add notification
    let msg = `Your campaign '${campaigns[index].title}' has been updated.`;
    if (creativeStatus !== undefined) {
      msg = `Ad Creative for '${campaigns[index].title}' has been ${creativeStatus}.`;
    } else if (status !== undefined) {
      msg = `Your campaign '${campaigns[index].title}' has been marked as ${status}.`;
    }

    notifications.unshift({
      id: `notif_${Date.now()}`,
      title: `Campaign Updated`,
      message: msg,
      timestamp: new Date().toLocaleString(),
      unread: true,
      type: "campaign",
    });

    saveDatabase();

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
  const newDriver = {
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

  saveDatabase();

  res.status(201).json(newDriver);
});

app.put("/api/drivers/:id", (req, res) => {
  const { id } = req.params;
  const { status, kycVerified, currentCampaignId, state, totalEarnings, walletBalance } = req.body;
  const index = drivers.findIndex((d) => d.id === id);
  if (index !== -1) {
    if (status !== undefined) drivers[index].status = status;
    if (kycVerified !== undefined) drivers[index].kycVerified = kycVerified;
    if (currentCampaignId !== undefined) drivers[index].currentCampaignId = currentCampaignId;
    if (state !== undefined) drivers[index].state = state;
    if (totalEarnings !== undefined) drivers[index].totalEarnings = Number(totalEarnings);
    if (walletBalance !== undefined) drivers[index].walletBalance = Number(walletBalance);

    saveDatabase();

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

  const newProof = {
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

  saveDatabase();

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

    saveDatabase();

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
  const newTx = {
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

  saveDatabase();

  res.status(201).json(newTx);
});

// Notifications
app.get("/api/notifications", (req, res) => {
  res.json(notifications);
});

app.post("/api/notifications/read", (req, res) => {
  notifications = notifications.map((n) => ({ ...n, unread: false }));
  saveDatabase();
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

    // Send the last message
    const result = await chatSession.sendMessage({ message: userPrompt });
    const replyText = result.text || "I apologize, but I couldn't compute an answer. Please check back shortly.";

    res.json({ reply: replyText });
  } catch (error) {
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
