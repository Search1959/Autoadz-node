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
// Active databases
let campaigns = [];
let drivers = [];
let proofs = [];
let walletTransactions = [];
let notifications = [];
let cities = [];

const defaultCities = [
  { id: "city_kolkata", name: "Kolkata", zone: "East Hub", rate: 15, activeAutos: 150 },
  { id: "city_delhi", name: "Delhi NCR", zone: "North Hub", rate: 18, activeAutos: 220 },
  { id: "city_bangalore", name: "Bangalore", zone: "South Hub", rate: 20, activeAutos: 250 },
  { id: "city_mumbai", name: "Mumbai", zone: "West Hub", rate: 22, activeAutos: 180 }
];

// Helper to save all collections to db.json
function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify({
      campaigns,
      drivers,
      proofs,
      walletTransactions,
      notifications,
      cities
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
      cities = data.cities || [...defaultCities];
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
          dlNumber: "DL-01-202300048",
          aadhaarNumber: "1234-5678-9012"
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
      cities = [...defaultCities];
      saveDatabase();
    }
  } catch (err) {
    console.error("Failed to initialize database, using memory fallbacks:", err);
    campaigns = [...defaultCampaigns];
    drivers = [...defaultDrivers];
    proofs = [...defaultProofs];
    walletTransactions = [...defaultWalletTransactions];
    notifications = [...defaultNotifications];
    cities = [...defaultCities];
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

  // Simulate active tracking for online/tracking drivers - removed automatic wallet increase to ensure it only increases when GPS KM increases
  // drivers = drivers.map((driver) => { ... })

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

app.delete("/api/campaigns/:id", (req, res) => {
  const { id } = req.params;
  const index = campaigns.findIndex((c) => c.id === id);
  if (index !== -1) {
    const deletedCampaign = campaigns.splice(index, 1)[0];
    
    // De-allocate any drivers assigned to this campaign
    drivers.forEach(d => {
      if (d.currentCampaignId === id) {
        d.currentCampaignId = null;
      }
    });

    notifications.unshift({
      id: `notif_${Date.now()}`,
      title: "Campaign Removed",
      message: `Campaign '${deletedCampaign.title}' has been deleted from the platform by Admin.`,
      timestamp: new Date().toLocaleString(),
      unread: true,
      type: "admin",
    });

    saveDatabase();
    res.json({ success: true, deleted: deletedCampaign });
  } else {
    res.status(404).json({ error: "Campaign not found" });
  }
});

// Drivers
app.get("/api/drivers", (req, res) => {
  res.json(drivers);
});

app.post("/api/drivers", (req, res) => {
  const { name, phone, autoNumber, location, dlNumber, aadhaarNumber, dlImage, aadhaarImage } = req.body;
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
    dlNumber: dlNumber || `DL-${Math.floor(Math.random() * 90 + 10)}-2023${Math.floor(Math.random() * 90000 + 10000)}`,
    aadhaarNumber: aadhaarNumber || `${Math.floor(Math.random() * 9000 + 1000)}-${Math.floor(Math.random() * 9000 + 1000)}-${Math.floor(Math.random() * 9000 + 1000)}`,
    dlImage: dlImage || "https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&q=80&w=400",
    aadhaarImage: aadhaarImage || "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=400",
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
  const { 
    name,
    phone,
    autoNumber,
    location,
    status, 
    kycVerified, 
    currentCampaignId, 
    state, 
    totalEarnings, 
    walletBalance,
    currentSessionKms,
    currentSessionSeconds,
    trackingStartTime,
    dlNumber,
    aadhaarNumber,
    dlImage,
    aadhaarImage
  } = req.body;
  const index = drivers.findIndex((d) => d.id === id);
  if (index !== -1) {
    if (name !== undefined) drivers[index].name = name;
    if (phone !== undefined) drivers[index].phone = phone;
    if (autoNumber !== undefined) drivers[index].autoNumber = autoNumber;
    if (location !== undefined) drivers[index].location = location;
    if (status !== undefined) drivers[index].status = status;
    if (kycVerified !== undefined) drivers[index].kycVerified = kycVerified;
    if (currentCampaignId !== undefined) drivers[index].currentCampaignId = currentCampaignId;
    if (state !== undefined) drivers[index].state = state;
    if (totalEarnings !== undefined) drivers[index].totalEarnings = Number(totalEarnings);
    if (walletBalance !== undefined) drivers[index].walletBalance = Number(walletBalance);
    if (currentSessionKms !== undefined) drivers[index].currentSessionKms = Number(currentSessionKms);
    if (currentSessionSeconds !== undefined) drivers[index].currentSessionSeconds = Number(currentSessionSeconds);
    if (trackingStartTime !== undefined) drivers[index].trackingStartTime = trackingStartTime;
    if (dlNumber !== undefined) drivers[index].dlNumber = dlNumber;
    if (aadhaarNumber !== undefined) drivers[index].aadhaarNumber = aadhaarNumber;
    if (dlImage !== undefined) drivers[index].dlImage = dlImage;
    if (aadhaarImage !== undefined) drivers[index].aadhaarImage = aadhaarImage;

    saveDatabase();

    res.json(drivers[index]);
  } else {
    res.status(404).json({ error: "Driver not found" });
  }
});

app.delete("/api/drivers/:id", (req, res) => {
  const { id } = req.params;
  const index = drivers.findIndex((d) => d.id === id);
  if (index !== -1) {
    const deletedDriver = drivers.splice(index, 1)[0];
    
    notifications.unshift({
      id: `notif_${Date.now()}`,
      title: "Driver Removed",
      message: `Driver ${deletedDriver.name} has been removed from the platform by Admin.`,
      timestamp: new Date().toLocaleString(),
      unread: true,
      type: "admin",
    });

    saveDatabase();
    res.json({ success: true, deleted: deletedDriver });
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

// Cities management API
app.get("/api/cities", (req, res) => {
  res.json(cities);
});

app.post("/api/cities", (req, res) => {
  const { name, zone, rate, activeAutos } = req.body;
  const newCity = {
    id: `city_${Date.now()}`,
    name: name || "New City",
    zone: zone || "General Zone",
    rate: Number(rate) || 15,
    activeAutos: Number(activeAutos) || 50,
  };
  cities.push(newCity);
  saveDatabase();
  res.status(201).json(newCity);
});

app.delete("/api/cities/:id", (req, res) => {
  const { id } = req.params;
  const index = cities.findIndex((c) => c.id === id);
  if (index !== -1) {
    const deleted = cities.splice(index, 1)[0];
    saveDatabase();
    res.json({ success: true, deleted });
  } else {
    res.status(404).json({ error: "City not found" });
  }
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

// AI Campaign Advisor API
app.post("/api/gemini/advisor", async (req, res) => {
  const { niche, city } = req.body;
  const targetNiche = niche || "dental clinic";
  const targetCity = city || "Kolkata";

  if (!ai) {
    // Generate realistic fallback response
    const zones = targetCity.toLowerCase().includes("kolkata") 
      ? "Gariahat Crossing, Salt Lake Sector V, Shyambazar Five-Point Crossing, Howrah Station approach road, and Tollywood Metro zone."
      : targetCity.toLowerCase().includes("delhi")
      ? "Connaught Place circles, South Extension Market, Karol Bagh commercial hub, Noida Sector 18, and Dwarka Sector 10 transit route."
      : "Central Business District, high-traffic metro hubs, primary market lanes, and dense residential connector corridors.";
      
    const autosCount = targetNiche.toLowerCase().includes("dental") || targetNiche.toLowerCase().includes("clinic") ? 30 : 45;
    const duration = 30;
    const budget = autosCount * duration * 250; // ₹250 per auto per day approx
    const impressions = autosCount * duration * 40000;

    return res.json({
      success: true,
      niche: targetNiche,
      city: targetCity,
      advisorReport: {
        niche: targetNiche,
        city: targetCity,
        recommendedAutos: autosCount,
        recommendedDuration: `${duration} Days`,
        recommendedBudget: budget,
        estimatedImpressions: impressions.toLocaleString("en-IN"),
        targetZones: zones,
        marketingTip: `For a ${targetNiche} in ${targetCity}, place highly legible contrast layouts on the auto hood and a back panel QR Code. Auto drivers standing near prominent medical hubs and commercial markets will act as stationary referral banners during peak evening hours.`
      }
    });
  }

  try {
    const prompt = `You are the AutoAdz AI Advisor. Generate a highly strategic hyperlocal transit campaign advisor report in JSON format.
Niche: ${targetNiche}
City: ${targetCity}

You must return EXACTLY a JSON object with this exact schema (no markdown, no code block backticks):
{
  "niche": "string",
  "city": "string",
  "recommendedAutos": number,
  "recommendedDuration": "string",
  "recommendedBudget": number,
  "estimatedImpressions": "string",
  "targetZones": "string",
  "marketingTip": "string"
}`;

    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const replyText = result.text || "{}";
    const reportData = JSON.parse(replyText.trim());
    res.json({ success: true, advisorReport: reportData });
  } catch (err) {
    console.error("Gemini Advisor Error:", err);
    res.status(500).json({ error: "AI Generation failed" });
  }
});

// AI Ad Creative Generator API
app.post("/api/gemini/generator", async (req, res) => {
  const { niche, creativeType } = req.body;
  const targetNiche = niche || "restaurant";
  const type = creativeType || "headline"; // headline, tagline, qr

  if (!ai) {
    // Return gorgeous fallback options
    let suggestions = [];
    if (type === "headline") {
      suggestions = [
        `Craving some tasty bite? Stop driving, start eating at ${targetNiche}!`,
        `Your neighborhood's favorite ${targetNiche} is just 2 KM away!`,
        `Hungry? Scan this Auto's back to unlock 20% off at our food counter!`,
        `Fresh, warm, and authentic. Welcome to the ultimate ${targetNiche} experience.`,
        `Don't cook tonight! We are delivering hot meals to your doorstep.`
      ];
    } else if (type === "tagline") {
      suggestions = [
        `Taste the tradition, feel the love.`,
        `Good food, great mood, quick auto rides.`,
        `Savor every second, scan for every bite.`,
        `Hyperefficient meals for hyperactive lives.`,
        `Your pocket-friendly local flavor hub.`
      ];
    } else {
      suggestions = [
        `Scan this QR to download our digital menu card & book a table in 10 seconds!`,
        `Scan to claim an instant free dessert with your first diner bill.`,
        `A GPS-tracked Auto exclusive: Scan for a personalized route-based discount code!`,
        `Scan to follow our Instagram reels page and win weekly free meals!`,
        `QR-Activated: Scan to claim standard 15% discount on checkout.`
      ];
    }

    return res.json({
      success: true,
      niche: targetNiche,
      creativeType: type,
      suggestions
    });
  }

  try {
    const prompt = `You are a professional copywriter for AutoAdz auto-rickshaw marketing.
Generate exactly 5 short, extremely catchy and high-conversion campaign ${type} concepts for a ${targetNiche} business.
Format your response as a simple JSON string array of 5 elements, with no additional commentary, markdowns or code block wrapping.
Example: ["Concept 1", "Concept 2", "Concept 3", "Concept 4", "Concept 5"]`;

    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const replyText = result.text || "[]";
    const suggestions = JSON.parse(replyText.trim());
    res.json({ success: true, niche: targetNiche, creativeType: type, suggestions });
  } catch (err) {
    console.error("Gemini Creative Gen Error:", err);
    res.status(500).json({ error: "Creative Generation failed" });
  }
});

// Proxy route to send real WhatsApp notifications via WhatsApp Cloud API
app.post("/api/whatsapp/send", async (req, res) => {
  const { token, phoneId, recipient, message } = req.body;
  if (!token || !phoneId || !recipient || !message) {
    return res.status(400).json({ error: "Missing required fields for sending WhatsApp" });
  }

  // Format recipient number (add country code if needed)
  let formattedRecipient = recipient.replace(/\D/g, "");
  if (formattedRecipient.length === 10) {
    formattedRecipient = `91${formattedRecipient}`; // Default to India country code
  }

  const url = `https://graph.facebook.com/v17.0/${phoneId}/messages`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: formattedRecipient,
        type: "text",
        text: {
          body: message
        }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("WhatsApp API error response:", data);
      let errorString = "WhatsApp API rejected the request";
      if (data.error) {
        if (typeof data.error === "string") {
          errorString = data.error;
        } else if (typeof data.error === "object" && data.error.message) {
          errorString = `${data.error.message} (Code: ${data.error.code || 'unknown'})`;
        } else {
          errorString = JSON.stringify(data.error);
        }
      }
      return res.status(response.status).json({
        success: false,
        error: errorString,
        details: data
      });
    }

    return res.json({ success: true, response: data });
  } catch (error) {
    console.error("Error calling WhatsApp Cloud API:", error);
    return res.status(500).json({ success: false, error: error.message });
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
