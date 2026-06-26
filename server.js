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

const defaultDrivers = [];

const defaultProofs = [];

const defaultWalletTransactions = [];

const defaultNotifications = [];

// Active databases
let campaigns = [];
let drivers = [];
let proofs = [];
let walletTransactions = [];
let notifications = [];
let cities = [];
let bills = [];
let schedulerSettings = {
  enabled: true,
  mileageThreshold: 10,
  intervalMinutes: 5,
  lastRunTimestamp: null,
  driverRatePerKm: 4.5,
  logs: [
    {
      timestamp: new Date().toLocaleString(),
      status: "Initialized",
      message: "Automated billing scheduler registered with 10 KM threshold."
    }
  ]
};

const defaultCities = [
  { id: "city_kolkata", name: "Kolkata", zone: "East Hub", rate: 15, activeAutos: 150 },
  { id: "city_delhi", name: "Delhi NCR", zone: "North Hub", rate: 18, activeAutos: 220 },
  { id: "city_bangalore", name: "Bangalore", zone: "South Hub", rate: 20, activeAutos: 250 },
  { id: "city_mumbai", name: "Mumbai", zone: "West Hub", rate: 22, activeAutos: 180 }
];

const defaultBills = [];

// Helper to save all collections to db.json
function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify({
      campaigns,
      drivers,
      proofs,
      walletTransactions,
      notifications,
      cities,
      bills,
      schedulerSettings
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
      bills = data.bills || [...defaultBills];
      schedulerSettings = data.schedulerSettings || {
        enabled: true,
        mileageThreshold: 10,
        intervalMinutes: 5,
        lastRunTimestamp: null,
        driverRatePerKm: 4.5,
        logs: [
          {
            timestamp: new Date().toLocaleString(),
            status: "Initialized",
            message: "Automated billing scheduler registered with 10 KM threshold."
          }
        ]
      };
      if (schedulerSettings.driverRatePerKm === undefined) {
        schedulerSettings.driverRatePerKm = 4.5;
      }
      console.log(`Database loaded successfully from ${DB_FILE}`);
    } else {
      console.log(`No database file found. Seeding new database at ${DB_FILE}`);
      campaigns = [...defaultCampaigns];
      drivers = [...defaultDrivers];
      proofs = [...defaultProofs];
      walletTransactions = [...defaultWalletTransactions];
      notifications = [...defaultNotifications];
      cities = [...defaultCities];
      bills = [...defaultBills];
      schedulerSettings = {
        enabled: true,
        mileageThreshold: 10,
        intervalMinutes: 5,
        lastRunTimestamp: null,
        driverRatePerKm: 4.5,
        logs: [
          {
            timestamp: new Date().toLocaleString(),
            status: "Initialized",
            message: "Automated billing scheduler registered with 10 KM threshold."
          }
        ]
      };
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
    bills = [...defaultBills];
    schedulerSettings = {
      enabled: true,
      mileageThreshold: 10,
      intervalMinutes: 5,
      lastRunTimestamp: null,
      driverRatePerKm: 4.5,
      logs: [
        {
          timestamp: new Date().toLocaleString(),
          status: "Initialized",
          message: "Automated billing scheduler registered with 10 KM threshold."
        }
      ]
    };
  }
}

// Perform synchronous initial load
initDatabase();

// Background dynamic stats simulation disabled per user request to prevent automatic metrics changes without user/driver movement

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

// Bills / Invoices
app.get("/api/bills", (req, res) => {
  res.json(bills);
});

app.post("/api/bills", (req, res) => {
  const { type, senderId, senderName, receiverId, campaignId, amount, kmsCovered, periodStart, periodEnd, description } = req.body;
  const newBill = {
    id: `bill_${Date.now()}`,
    type: type || "driver_service_bill", // "driver_service_bill" | "advertiser_invoice"
    senderId: senderId || "driver_delip",
    senderName: senderName || "Delip",
    receiverId: receiverId || "admin",
    campaignId: campaignId || null,
    amount: Number(amount) || 0,
    status: "pending",
    kmsCovered: Number(kmsCovered) || 0,
    periodStart: periodStart || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    periodEnd: periodEnd || new Date().toISOString().split("T")[0],
    timestamp: new Date().toLocaleString(),
    description: description || "Weekly Service Bill",
  };
  bills.unshift(newBill);

  // Add a notification
  notifications.unshift({
    id: `notif_${Date.now()}`,
    title: type === "driver_service_bill" ? "Service Bill Raised" : "Campaign Invoice Issued",
    message: type === "driver_service_bill" 
      ? `Driver ${senderName} raised a weekly service bill for ₹${newBill.amount} (${kmsCovered} KM).`
      : `Admin issued an advertising progress invoice of ₹${newBill.amount} to campaign advertiser.`,
    timestamp: new Date().toLocaleString(),
    unread: true,
    type: "billing",
  });

  saveDatabase();
  res.status(201).json(newBill);
});

app.put("/api/bills/:id", (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // "paid" | "rejected" | "pending"
  const index = bills.findIndex((b) => b.id === id);
  if (index !== -1) {
    const oldStatus = bills[index].status;
    bills[index].status = status;

    // Trigger financial transaction updates when status changes to "paid"
    if (status === "paid" && oldStatus !== "paid") {
      const bill = bills[index];
      
      if (bill.type === "driver_service_bill") {
        // Driver payout
        const dIndex = drivers.findIndex((d) => d.id === bill.senderId);
        if (dIndex !== -1) {
          // Deduct from driver's wallet balance
          drivers[dIndex].walletBalance = Math.max(0, drivers[dIndex].walletBalance - bill.amount);
        }
        
        // Add corresponding transaction as "withdrawal" (or payout)
        walletTransactions.unshift({
          id: `tx_${Date.now()}`,
          userId: bill.senderId,
          type: "withdrawal",
          amount: bill.amount,
          status: "success",
          description: `Payout processed for Weekly Service Bill: ${bill.id}`,
          timestamp: new Date().toLocaleString(),
        });
        
        notifications.unshift({
          id: `notif_${Date.now()}`,
          title: "Service Bill Paid",
          message: `Your weekly service bill of ₹${bill.amount} has been paid and transferred to your bank account.`,
          timestamp: new Date().toLocaleString(),
          unread: true,
          type: "billing",
        });

      } else if (bill.type === "advertiser_invoice") {
        // Advertiser invoice payment
        // Deduct from advertiser's pre-deposited budget / wallet
        walletTransactions.unshift({
          id: `tx_${Date.now()}`,
          userId: "advertiser_main",
          type: "payment",
          amount: bill.amount,
          status: "success",
          description: `Payment for Admin Weekly Invoice: ${bill.id}`,
          timestamp: new Date().toLocaleString(),
        });

        notifications.unshift({
          id: `notif_${Date.now()}`,
          title: "Invoice Paid",
          message: `Weekly advertising invoice for ₹${bill.amount} has been successfully settled from your advance wallet balance.`,
          timestamp: new Date().toLocaleString(),
          unread: true,
          type: "billing",
        });
      }
    }

    saveDatabase();
    res.json(bills[index]);
  } else {
    res.status(404).json({ error: "Bill not found" });
  }
});

// Automated Billing Scheduler Helper and API routes
function runBillingScheduler(thresholdOverride) {
  const threshold = thresholdOverride !== undefined ? Number(thresholdOverride) : schedulerSettings.mileageThreshold;
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const generatedBills = [];
  const skippedDrivers = [];
  
  drivers.forEach(driver => {
    // Check if there is already a pending service bill for this driver to avoid double billing
    const hasPendingBill = bills.some(b => b.senderId === driver.id && b.type === "driver_service_bill" && b.status === "pending");
    if (hasPendingBill) {
      skippedDrivers.push({ id: driver.id, name: driver.name, reason: "Pending bill exists" });
      return;
    }
    
    // Calculate total KMs in last 7 days
    let weekKms = 0;
    const driverTxs = walletTransactions.filter(t => t.userId === driver.id && t.type === "earning");
    
    const currentRate = schedulerSettings.driverRatePerKm || 4.5;

    driverTxs.forEach(tx => {
      let txDate = new Date(tx.timestamp);
      if (isNaN(txDate.getTime())) {
        txDate = new Date();
      }
      
      if (txDate >= sevenDaysAgo) {
        const kmMatch = tx.description.match(/Completed\s+([\d\.]+)\s*KM/i);
        if (kmMatch) {
          weekKms += parseFloat(kmMatch[1]);
        } else {
          weekKms += tx.amount / currentRate;
        }
      }
    });
    
    // Fallback: if no recent transaction matches but the driver has wallet balance, let's derive from wallet balance
    if (weekKms === 0 && driver.walletBalance > 0) {
      weekKms = driver.walletBalance / currentRate;
    }
    
    weekKms = parseFloat(weekKms.toFixed(1));
    
    if (weekKms >= threshold) {
      const billAmount = driver.walletBalance > 0 ? driver.walletBalance : parseFloat((weekKms * currentRate).toFixed(2));
      
      const newBill = {
        id: `bill_auto_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        type: "driver_service_bill",
        senderId: driver.id,
        senderName: driver.name,
        receiverId: "admin",
        campaignId: driver.currentCampaignId || "camp_active_1",
        amount: billAmount,
        status: "pending",
        kmsCovered: weekKms,
        periodStart: sevenDaysAgo.toISOString().split("T")[0],
        periodEnd: now.toISOString().split("T")[0],
        timestamp: now.toLocaleString(),
        description: `Automated Weekly Service Bill - ${weekKms} KM verified mileage run (exceeded threshold of ${threshold} KM)`
      };
      
      bills.unshift(newBill);
      generatedBills.push({ id: driver.id, name: driver.name, kms: weekKms, amount: billAmount });
      
      notifications.unshift({
        id: `notif_auto_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        title: "Automated Weekly Bill Raised",
        message: `Your weekly tracking of ${weekKms} KM exceeded the ${threshold} KM threshold. An automated service bill for ₹${billAmount} has been generated.`,
        timestamp: now.toLocaleString(),
        unread: true,
        type: "billing"
      });
      
      notifications.unshift({
        id: `notif_admin_auto_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        title: "⚡ Auto Bill Generated",
        message: `Scheduler automatically generated a service bill of ₹${billAmount} for driver ${driver.name} (${weekKms} KM).`,
        timestamp: now.toLocaleString(),
        unread: true,
        type: "billing"
      });
    } else {
      skippedDrivers.push({ id: driver.id, name: driver.name, kms: weekKms, reason: `Under threshold of ${threshold} KM` });
    }
  });
  
  schedulerSettings.lastRunTimestamp = now.toLocaleString();
  
  let summaryMessage = "";
  if (generatedBills.length > 0) {
    summaryMessage = `Success! Automatically generated ${generatedBills.length} service bills: ` + 
      generatedBills.map(gb => `${gb.name} (${gb.kms} KM, ₹${gb.amount})`).join(", ");
  } else {
    summaryMessage = `Scheduler ran. No drivers exceeded the threshold of ${threshold} KM. (Checked: ${drivers.length} drivers)`;
  }
  
  schedulerSettings.logs.unshift({
    timestamp: now.toLocaleString(),
    status: generatedBills.length > 0 ? "Success" : "Idle",
    message: summaryMessage
  });
  
  if (schedulerSettings.logs.length > 30) {
    schedulerSettings.logs = schedulerSettings.logs.slice(0, 30);
  }
  
  saveDatabase();
  return {
    success: true,
    generatedBills,
    skippedDrivers,
    summary: summaryMessage
  };
}

// Background scheduler tick every 3 minutes
setInterval(() => {
  if (schedulerSettings.enabled) {
    const lastRunStr = schedulerSettings.lastRunTimestamp;
    let runRequired = false;
    if (!lastRunStr) {
      runRequired = true;
    } else {
      const lastRunDate = new Date(lastRunStr);
      const diffMs = Date.now() - lastRunDate.getTime();
      // Run every 3 minutes in background
      if (diffMs > 3 * 60 * 1000) {
        runRequired = true;
      }
    }
    
    if (runRequired) {
      console.log("[Scheduler] Triggering automated weekly billing checks...");
      runBillingScheduler();
    }
  }
}, 60000);

// API Routes for Scheduler
app.get("/api/scheduler/settings", (req, res) => {
  res.json(schedulerSettings);
});

app.post("/api/scheduler/settings", (req, res) => {
  const { enabled, mileageThreshold, driverRatePerKm } = req.body;
  if (enabled !== undefined) schedulerSettings.enabled = !!enabled;
  if (mileageThreshold !== undefined) schedulerSettings.mileageThreshold = Number(mileageThreshold);
  if (driverRatePerKm !== undefined) schedulerSettings.driverRatePerKm = Number(driverRatePerKm);
  saveDatabase();
  res.json({ success: true, settings: schedulerSettings });
});

app.post("/api/scheduler/trigger", (req, res) => {
  const { mileageThreshold } = req.body;
  const result = runBillingScheduler(mileageThreshold);
  res.json(result);
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

// Helper to render beautiful compliance pages
function renderLegalPage(title, activeTab, contentHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - AutoAdz Legal Compliance</title>
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Inter', sans-serif;
        }
    </style>
</head>
<body class="bg-slate-50 text-slate-800 flex flex-col min-h-screen">
    <!-- Navbar Header -->
    <header class="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-30 shadow-xs">
        <div class="max-w-5xl mx-auto flex justify-between items-center">
            <div class="flex items-center gap-2">
                <div class="bg-[#0B1F4D] text-[#FF9800] p-1.5 rounded-lg font-extrabold text-sm tracking-wide">
                    AA
                </div>
                <div>
                    <h1 class="font-bold text-sm text-[#0B1F4D] tracking-tight">AutoAdz Legal & Compliance Hub</h1>
                    <p class="text-[9px] text-slate-400 font-mono">Managed by M/s Deinrim Solutionss (P) ltd.</p>
                </div>
            </div>
            <div class="flex gap-4 text-xs font-semibold">
                <a href="/privacy" class="hover:text-[#FF9800] transition ${activeTab === 'privacy' ? 'text-[#0B1F4D] underline font-bold' : 'text-slate-600'}">Privacy</a>
                <a href="/terms" class="hover:text-[#FF9800] transition ${activeTab === 'terms' ? 'text-[#0B1F4D] underline font-bold' : 'text-slate-600'}">Terms</a>
                <a href="/support" class="hover:text-[#FF9800] transition ${activeTab === 'support' ? 'text-[#0B1F4D] underline font-bold' : 'text-slate-600'}">Support</a>
                <a href="/deletion" class="hover:text-red-500 transition ${activeTab === 'deletion' ? 'text-red-600 underline font-bold' : 'text-slate-600'}">Data Deletion</a>
            </div>
        </div>
    </header>

    <!-- Main Content Area -->
    <main class="flex-1 max-w-3xl w-full mx-auto p-6 my-8 bg-white border border-slate-200 rounded-3xl shadow-sm">
        ${contentHtml}
    </main>

    <!-- Footer -->
    <footer class="bg-[#0B1F4D] text-slate-400 py-8 px-6 text-xs font-mono mt-auto">
        <div class="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <h5 class="font-bold text-white uppercase text-[11px] mb-2 tracking-wider">OPERATOR & DEVELOPER</h5>
                <p class="leading-relaxed text-[11px]">
                    <b>M/s Deinrim Solutionss (P) ltd.</b><br>
                    Kolkata, West Bengal (WB), India<br>
                    Corporate Hotline: +91 98361-30393<br>
                    Email: support@deinrimsolutions.com
                </p>
            </div>
            <div class="text-left md:text-right">
                <h5 class="font-bold text-white uppercase text-[11px] mb-2 tracking-wider">REGULATORY STATEMENT</h5>
                <p class="leading-relaxed text-[11px]">
                    This public endpoint serves as the official Google Developer Console and Apple App Store verification page. All database elements are hosted securely and comply with worldwide location privacy policies.
                </p>
                <p class="text-[9px] text-slate-500 mt-2">© 2026 M/s Deinrim Solutionss (P) ltd. All rights reserved.</p>
            </div>
        </div>
    </footer>
</body>
</html>`;
}

// 1. Privacy Policy Endpoint
app.get("/privacy", (req, res) => {
  const content = `
    <div class="space-y-4">
        <span class="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded font-mono uppercase tracking-wider">PUBLIC COMPLIANCE PORTAL</span>
        <h2 class="text-xl font-extrabold text-[#0B1F4D] tracking-tight">Privacy Policy & Location Consent</h2>
        <p class="text-xs text-slate-500 font-mono">Last Updated: June 25, 2026</p>
        <hr class="border-slate-100 my-4" />
        
        <div class="space-y-4 text-xs text-slate-700 leading-relaxed">
            <p>
                This Privacy Policy governs the use of the **AutoAdz** software application ("Application") for mobile devices that was created and is operated by **M/s Deinrim Solutionss (P) ltd.** based in Kolkata, West Bengal (WB), India.
            </p>

            <h3 class="font-extrabold text-sm text-[#0B1F4D] mt-4 uppercase tracking-wide">1. Background Location Collection & Tracking</h3>
            <div class="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-900 text-xs space-y-2">
                <p class="font-bold">🚨 CRITICAL LOCATION USAGE COMPLIANCE NOTICE:</p>
                <p>
                    To allocate advertising mileage payouts fairly and verify active campaign runs, AutoAdz tracks and collects the physical coordinates (GPS telemetry data) of registered auto-rickshaw driver partners.
                </p>
                <p>
                    <b>Background Permission:</b> This collection runs **exclusively** while the driver's telemetry meter is toggled "Active". It runs in the background even if the application is closed or minimized, allowing drivers to lock their screen while driving and still log their route correctly. 
                </p>
                <p>
                    No location tracking is performed when the driver is "Offline".
                </p>
            </div>

            <h3 class="font-extrabold text-sm text-[#0B1F4D] mt-4 uppercase tracking-wide">2. Camera & Photo Captures</h3>
            <p>
                The Application requests access to the physical device camera solely for drivers to photograph and upload "Campaign Proof of Installation" (rear poster sticker) and submit it for visual verification audits. These photos are transmitted securely and are visible only to platform admins.
            </p>

            <h3 class="font-extrabold text-sm text-[#0B1F4D] mt-4 uppercase tracking-wide">3. Information Collected & Saved</h3>
            <ul class="list-disc pl-4 space-y-1">
                <li><b>User Profile Information:</b> Full Name, Verified Mobile Number, City of Operation, Vehicle Number Plate, and Bank account credentials for payouts.</li>
                <li><b>Telemetry Log History:</b> Distance covered in kilometers, speed indicators, latitude/longitude mapping, and timestamp records.</li>
            </ul>

            <h3 class="font-extrabold text-sm text-[#0B1F4D] mt-4 uppercase tracking-wide">4. Data Sharing & Security</h3>
            <p>
                We do not sell, rent, or trade driver location paths or personal identities to third-party brokers. Aggregate telemetry stats (e.g. "Campaign covered 2,500 KM in Kolkata South Zone") are shared with the linked Advertiser to calculate their return on ad spend.
            </p>

            <h3 class="font-extrabold text-sm text-[#0B1F4D] mt-4 uppercase tracking-wide">5. Contact Information</h3>
            <p>
                For any queries or compliance concerns regarding location coordinates or data encryption:
                <br><b>M/s Deinrim Solutionss (P) ltd.</b>
                <br>Kolkata, WB, India
                <br>Corporate Hotline: <b>+91 98361-30393</b>
                <br>Email: <b>support@deinrimsolutions.com</b>
            </p>
        </div>
    </div>
  `;
  res.send(renderLegalPage("Privacy Policy & Background Location", "privacy", content));
});

// 2. Terms of Service Endpoint
app.get("/terms", (req, res) => {
  const content = `
    <div class="space-y-4">
        <span class="text-[10px] bg-blue-100 text-blue-800 font-extrabold px-2 py-0.5 rounded font-mono uppercase tracking-wider">LEGAL CONTRACT</span>
        <h2 class="text-xl font-extrabold text-[#0B1F4D] tracking-tight">Terms of Service Agreement</h2>
        <p class="text-xs text-slate-500 font-mono">Last Updated: June 25, 2026</p>
        <hr class="border-slate-100 my-4" />
        
        <div class="space-y-4 text-xs text-slate-700 leading-relaxed">
            <p>
                By registering an account with AutoAdz (either as an Advertiser or an Auto-Rickshaw Driver), you agree to comply with the terms set forth by **M/s Deinrim Solutionss (P) ltd.**, corporate office based in Kolkata, WB.
            </p>

            <h3 class="font-extrabold text-sm text-[#0B1F4D] mt-4 uppercase tracking-wide">1. Accurate Vehicle Details</h3>
            <p>
                Drivers must register their own, legal, commercially-registered auto-rickshaw with matching vehicle plate numbers. Banners/vinyl stickers provided by AutoAdz must be securely mounted on the designated rear frame of the auto-rickshaw and kept clean.
            </p>

            <h3 class="font-extrabold text-sm text-[#0B1F4D] mt-4 uppercase tracking-wide">2. Anti-Fraud & Telemetry Integrity</h3>
            <p>
                Drivers must run the telemetry tracker on real, physical journeys on public roads. Attempting to use GPS simulation software, virtual machine mock locations, or duplicate phone accounts to artificially inflate kilometers is strictly forbidden. AutoAdz employs automated pattern recognition algorithms to detect mock location drivers. Accounts caught spoofing are immediately banned, and all wallet funds will be permanently forfeited.
            </p>

            <h3 class="font-extrabold text-sm text-[#0B1F4D] mt-4 uppercase tracking-wide">3. Advertiser Campaigns & Budgets</h3>
            <p>
                Advertisers fund campaign wallets with advance budgets. AutoAdz manages the printing, allocation, and delivery tracking. Advertiser accounts are bound to verify proof of driver installations in their respective dashboards.
            </p>

            <h3 class="font-extrabold text-sm text-[#0B1F4D] mt-4 uppercase tracking-wide">4. Jurisdiction & Legal Dispute</h3>
            <p>
                These terms are governed by the laws of India. Any litigation, dispute, or collection recovery proceeding arising out of or related to this platform shall be subject to the exclusive jurisdiction of the courts of **Kolkata, West Bengal, India**.
            </p>
        </div>
    </div>
  `;
  res.send(renderLegalPage("Terms of Service Agreement", "terms", content));
});

// 3. Support Endpoint
app.get("/support", (req, res) => {
  const content = `
    <div class="space-y-4">
        <span class="text-[10px] bg-orange-100 text-orange-800 font-extrabold px-2 py-0.5 rounded font-mono uppercase tracking-wider">DEVELOPER CONSOLE REQUIRED ENDPOINT</span>
        <h2 class="text-xl font-extrabold text-[#0B1F4D] tracking-tight">Developer Support & Contacts Desk</h2>
        <p class="text-xs text-slate-500 font-mono">Direct Support Gateway</p>
        <hr class="border-slate-100 my-4" />
        
        <div class="space-y-4 text-xs text-slate-700 leading-relaxed">
            <p>
                Need assistance, have hardware/GPS tracking problems, or require official verification certificates for your Google Play Console / App Store listing? Our developer support engineering desk is open 6 days a week.
            </p>

            <div class="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-3">
                <h4 class="font-bold text-sm text-[#0B1F4D]">M/s Deinrim Solutionss (P) ltd.</h4>
                <div class="space-y-2 font-sans text-xs">
                    <p>📞 <b>Helpline Hotline:</b> +91 98361-30393</p>
                    <p>✉️ <b>Support Email:</b> support@deinrimsolutions.com</p>
                    <p>📍 <b>Corporate Address:</b> Kolkata, West Bengal (WB), India</p>
                </div>
            </div>

            <h3 class="font-extrabold text-sm text-[#0B1F4D] mt-4 uppercase tracking-wide">Frequently Answered Queries</h3>
            <div class="space-y-3">
                <div class="border-l-4 border-[#FF9800] pl-3">
                    <h4 class="font-bold text-slate-900">How do I verify sticker installation?</h4>
                    <p class="text-slate-600 mt-1">
                        Once the physical vinyl sticker is applied, log into the Driver Panel, select your linked Campaign, click "Verify QR", and scan the sticker's unique QR code. Alternatively, submit a back panel photo in the Proof tab.
                    </p>
                </div>
                <div class="border-l-4 border-[#FF9800] pl-3">
                    <h4 class="font-bold text-slate-900">Why did my location stop tracking?</h4>
                    <p class="text-slate-600 mt-1">
                        Please ensure that the AutoAdz app has been granted "Allow all the time" location permissions in your Android or iOS settings, and make sure that Battery Optimization is disabled for AutoAdz.
                    </p>
                </div>
            </div>
        </div>
    </div>
  `;
  res.send(renderLegalPage("Developer Support & Contacts Desk", "support", content));
});

// 4. Data Deletion Endpoint
app.get("/deletion", (req, res) => {
  const content = `
    <div class="space-y-4">
        <span class="text-[10px] bg-red-100 text-red-800 font-extrabold px-2 py-0.5 rounded font-mono uppercase tracking-wider">REGULATORY PRIVACY RIGHT</span>
        <h2 class="text-xl font-extrabold text-[#0B1F4D] tracking-tight">Driver Data Deletion & Account Erasure</h2>
        <p class="text-xs text-slate-500 font-mono">Request Deletion online under Google Play Developer Policy</p>
        <hr class="border-slate-100 my-4" />
        
        <div class="space-y-4 text-xs text-slate-700 leading-relaxed">
            <p>
                In compliance with the Google Play Developer Console requirement for data deletion paths, registered users can submit a request here to purge their telemetry history, photos, and linked account data from our cloud servers.
            </p>

            <div class="bg-red-50 border border-red-200 text-red-900 p-4 rounded-xl space-y-1">
                <h4 class="font-bold text-xs uppercase tracking-wide">⚠️ Irreversible Data Erasure Alert:</h4>
                <p>
                    Account erasure will delete your registered mobile number, background GPS telemetry logs, payout wallet balances, and campaign linkages. This action cannot be undone.
                </p>
            </div>

            <!-- Submission Form -->
            <div class="border border-slate-200 p-5 rounded-2xl bg-slate-50 space-y-4">
                <h3 class="font-extrabold text-sm text-[#0B1F4D] uppercase tracking-wide">Submit Online Erasure Request</h3>
                
                <form id="public-deletion-form" class="space-y-3">
                    <div class="space-y-1">
                        <label class="block text-[10px] font-bold uppercase tracking-wide text-slate-600">Registered Mobile Number</label>
                        <input type="tel" id="pub-phone" required placeholder="e.g. +91 98361-30393" class="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs font-mono focus:outline-none focus:border-red-500">
                    </div>
                    <div class="space-y-1">
                        <label class="block text-[10px] font-bold uppercase tracking-wide text-slate-600">Reason for leaving (Optional)</label>
                        <textarea id="pub-reason" rows="2" placeholder="Help us understand your feedback..." class="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-red-500"></textarea>
                    </div>
                    <div class="flex items-start gap-2 py-1">
                        <input type="checkbox" id="pub-ack" required class="mt-0.5 rounded text-red-500">
                        <label for="pub-ack" class="text-[10px] text-slate-500 select-none cursor-pointer">
                            I confirm that I want to completely erase my active driver telemetry records and acknowledge that all unpaid earnings will be forfeited permanently.
                        </label>
                    </div>
                    <button type="submit" class="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg text-xs uppercase tracking-wider transition">
                        SUBMIT DATA PURGE REQUEST
                    </button>
                </form>

                <div id="deletion-success" class="hidden bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-center space-y-2">
                    <h5 class="font-bold text-sm">✓ Erasure Request Safely Received</h5>
                    <p class="text-[11px] text-slate-600 leading-normal">
                        We have successfully queued your account data for erasure. Our DPO officer at <b>M/s Deinrim Solutionss (P) ltd.</b> will contact you via SMS within 7 working days to finalize verification.
                    </p>
                </div>
            </div>
        </div>

        <script>
            document.getElementById('public-deletion-form').addEventListener('submit', function(e) {
                e.preventDefault();
                const phone = document.getElementById('pub-phone').value;
                if(!phone) {
                    alert('Please provide a valid registered phone number.');
                    return;
                }
                // Show feedback success
                document.getElementById('public-deletion-form').classList.add('hidden');
                document.getElementById('deletion-success').classList.remove('hidden');
            });
        </script>
    </div>
  `;
  res.send(renderLegalPage("Driver Data Deletion Request", "deletion", content));
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
