import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import Anthropic from "@anthropic-ai/sdk";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import schedule from "node-schedule";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ─── MySQL Connection Pool ────────────────────────────────────────────────────
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "autoadz_db",
  waitForConnections: true,
  connectionLimit: 50,
  queueLimit: 100,
  charset: "utf8mb4",
});

async function db(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

// ─── DB migrations — add columns silently if missing ─────────────────────────
async function runMigrations() {
  const migrations = [
    "ALTER TABLE cities ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'active'",
    "ALTER TABLE cities ADD COLUMN driver_rate DECIMAL(10,2) NOT NULL DEFAULT 5.00",
    "ALTER TABLE cities ADD COLUMN brand_rate DECIMAL(10,2) NOT NULL DEFAULT 150.00",
    "ALTER TABLE cities ADD COLUMN capacity INT NOT NULL DEFAULT 100",
  ];
  for (const q of migrations) {
    try { await db(q); } catch (_) { /* column already exists — skip */ }
  }
}
runMigrations();

// ─── Claude AI Client ─────────────────────────────────────────────────────────
let claude = null;
if (process.env.ANTHROPIC_API_KEY) {
  try {
    claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  } catch (err) {
    console.error("Failed to initialize Claude client:", err);
  }
}

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));

// ─── Multer — Proof Photo Upload ─────────────────────────────────────────────
const uploadsDir = path.join(process.cwd(), "public", "uploads", "proofs");
fs.mkdirSync(uploadsDir, { recursive: true });
const proofStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `proof_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const uploadProof = multer({ storage: proofStorage, limits: { fileSize: 10 * 1024 * 1024 } });

// ─── Helper ───────────────────────────────────────────────────────────────────
function ts() {
  return new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
}

function uid(prefix = "id") {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

// ─── CAMPAIGNS ────────────────────────────────────────────────────────────────
function mapCampaign(r) {
  return {
    id: r.id, title: r.title, client: r.client, city: r.city,
    area: r.area, budget: Number(r.budget), autosCount: r.autos_count,
    creativeUrl: r.creative_url, status: r.status,
    creativeStatus: r.creative_status, creativeApproved: !!r.creative_approved,
    startDate: r.start_date, endDate: r.end_date,
    kmsCovered: Number(r.kms_covered), qrScans: r.qr_scans,
    advertiserId: r.advertiser_id || null,
  };
}

app.get("/api/campaigns", async (req, res) => {
  try {
    const { advertiser_id } = req.query;
    const rows = advertiser_id
      ? await db("SELECT * FROM campaigns WHERE advertiser_id = ? ORDER BY created_at DESC", [advertiser_id])
      : await db("SELECT * FROM campaigns ORDER BY created_at DESC");
    res.json(rows.map(mapCampaign));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/campaigns", async (req, res) => {
  try {
    const { title, client, city, area, budget, autosCount, creativeUrl, advertiser_id } = req.body;
    const id = uid("camp");
    const startDate = new Date().toISOString().split("T")[0];
    const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const safeCreativeUrl = creativeUrl || "https://images.unsplash.com/photo-1501183007986-d0d080b147f9?auto=format&fit=crop&q=80&w=800";

    await db(
      `INSERT INTO campaigns (id, title, client, city, area, budget, autos_count, creative_url, status, creative_status, creative_approved, start_date, end_date, kms_covered, qr_scans, advertiser_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending', 0, ?, ?, 0, 0, ?)`,
      [id, title || "New Campaign", client || "Independent Advertiser", city || "Bangalore",
       area || "Central Area", Number(budget) || 50000, Number(autosCount) || 10,
       safeCreativeUrl, startDate, endDate, advertiser_id || null]
    );

    // Auto wallet deduction — scoped to the advertiser who created the campaign
    await db(
      `INSERT INTO wallet_transactions (id, user_id, type, amount, status, description, timestamp) VALUES (?, ?, 'payment', ?, 'success', ?, ?)`,
      [uid("tx"), advertiser_id || "advertiser_main", Number(budget) || 50000, `Pre-payment for campaign: ${title}`, ts()]
    );

    // Notification
    await db(
      `INSERT INTO notifications (id, title, message, timestamp, unread, type) VALUES (?, 'Campaign Created', ?, ?, 1, 'campaign')`,
      [uid("notif"), `Your campaign '${title}' is pending admin approval. Ad creative status: Pending Approval.`, ts()]
    );

    const [newCamp] = await db("SELECT * FROM campaigns WHERE id = ?", [id]);
    res.status(201).json(mapCampaign(newCamp));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

app.put("/api/campaigns/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, kmsCovered, qrScans, creativeUrl, creativeStatus, creativeApproved } = req.body;

    const updates = [];
    const vals = [];
    if (status !== undefined) { updates.push("status = ?"); vals.push(status); }
    if (kmsCovered !== undefined) { updates.push("kms_covered = ?"); vals.push(Number(kmsCovered)); }
    if (qrScans !== undefined) { updates.push("qr_scans = ?"); vals.push(Number(qrScans)); }
    if (creativeUrl !== undefined) { updates.push("creative_url = ?"); vals.push(creativeUrl); }
    if (creativeStatus !== undefined) { updates.push("creative_status = ?"); vals.push(creativeStatus); }
    if (creativeApproved !== undefined) { updates.push("creative_approved = ?"); vals.push(creativeApproved ? 1 : 0); }

    if (updates.length === 0) return res.status(400).json({ error: "Nothing to update" });
    vals.push(id);
    await db(`UPDATE campaigns SET ${updates.join(", ")} WHERE id = ?`, vals);

    // Notification
    let msg = `Your campaign has been updated.`;
    if (creativeStatus !== undefined) msg = `Ad Creative has been ${creativeStatus}.`;
    else if (status !== undefined) msg = `Your campaign has been marked as ${status}.`;
    await db(
      `INSERT INTO notifications (id, title, message, timestamp, unread, type) VALUES (?, 'Campaign Updated', ?, ?, 1, 'campaign')`,
      [uid("notif"), msg, ts()]
    );

    const [updated] = await db("SELECT * FROM campaigns WHERE id = ?", [id]);
    if (!updated) return res.status(404).json({ error: "Campaign not found" });
    res.json(mapCampaign(updated));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

app.delete("/api/campaigns/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [camp] = await db("SELECT * FROM campaigns WHERE id = ?", [id]);
    if (!camp) return res.status(404).json({ error: "Campaign not found" });

    await db("DELETE FROM campaigns WHERE id = ?", [id]);
    await db("UPDATE drivers SET current_campaign_id = NULL WHERE current_campaign_id = ?", [id]);
    await db(
      `INSERT INTO notifications (id, title, message, timestamp, unread, type) VALUES (?, 'Campaign Removed', ?, ?, 1, 'admin')`,
      [uid("notif"), `Campaign '${camp.title}' has been deleted by Admin.`, ts()]
    );
    res.json({ success: true, deleted: camp });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// ─── DRIVERS ──────────────────────────────────────────────────────────────────
function mapDriver(r) {
  return {
    id: r.id, name: r.name, phone: r.phone, autoNumber: r.auto_number,
    location: r.location, state: r.state, kycVerified: !!r.kyc_verified,
    totalEarnings: Number(r.total_earnings), walletBalance: Number(r.wallet_balance),
    currentCampaignId: r.current_campaign_id, status: r.status,
    dlNumber: r.dl_number, aadhaarNumber: r.aadhaar_number,
    dlImage: r.dl_image, aadhaarImage: r.aadhaar_image,
    currentSessionKms: Number(r.current_session_kms || 0),
    currentSessionSeconds: Number(r.current_session_seconds || 0),
    trackingStartTime: r.tracking_start_time,
    lat: r.lat ? Number(r.lat) : null,
    lng: r.lng ? Number(r.lng) : null,
    locationUpdatedAt: r.location_updated_at || null,
  };
}

// ─── GPS STORE (Redis if configured, in-memory Map fallback) ─────────────────
// Redis mode: all processes share one GPS store — required for PM2 cluster.
// Fallback mode: single-process in-memory Map — works on current Cloud Hosting.
// Switch by adding REDIS_URL to .env — no other code change needed.

import { createClient } from "redis";

const GPS_HASH = "autoadz:gps";
const gpsBuffer = new Map(); // fallback store
let redisClient = null;

if (process.env.REDIS_URL) {
  redisClient = createClient({
    url: process.env.REDIS_URL,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries >= 3) {
          console.error("Redis: max retries reached — falling back to in-memory GPS store");
          redisClient = null;
          return false; // stop retrying
        }
        return retries * 1000; // wait 1s, 2s, 3s between retries
      },
    },
  });
  redisClient.on("error", (err) => {
    if (err.message.includes("WRONGPASS") || err.message.includes("ECONNREFUSED")) {
      console.error("Redis error:", err.message);
    }
  });
  redisClient.connect().then(() => console.log("✅ Redis connected — GPS store active")).catch((err) => {
    console.error("Redis connect failed — falling back to in-memory:", err.message);
    redisClient = null;
  });
}

async function gpsSet(driverId, data) {
  if (redisClient?.isReady) {
    await redisClient.hSet(GPS_HASH, driverId, JSON.stringify(data));
  } else {
    gpsBuffer.set(driverId, data);
  }
}

async function gpsGet(driverId) {
  if (redisClient?.isReady) {
    const val = await redisClient.hGet(GPS_HASH, driverId);
    return val ? JSON.parse(val) : null;
  }
  return gpsBuffer.get(driverId) || null;
}

async function gpsGetAll() {
  if (redisClient?.isReady) {
    const all = await redisClient.hGetAll(GPS_HASH);
    return Object.entries(all).map(([id, raw]) => [id, JSON.parse(raw)]);
  }
  return [...gpsBuffer.entries()];
}

// Flush dirty GPS positions to MySQL every 5 seconds
async function flushGpsBuffer() {
  try {
    const entries = await gpsGetAll();
    const dirty = entries.filter(([, v]) => v.dirty);
    if (dirty.length === 0) return;
    await Promise.all(dirty.map(([id, v]) =>
      db("UPDATE drivers SET lat = ?, lng = ?, location_updated_at = ? WHERE id = ?",
        [v.lat, v.lng, v.updatedAt, id])
    ));
    // Mark clean
    await Promise.all(dirty.map(([id, v]) => gpsSet(id, { ...v, dirty: false })));
  } catch (err) {
    console.error("GPS flush error:", err.message);
  }
}
setInterval(flushGpsBuffer, 5000);

// Pre-warm store from DB on startup
(async () => {
  try {
    const rows = await db("SELECT id, name, auto_number, state, lat, lng, location_updated_at, current_campaign_id FROM drivers WHERE lat IS NOT NULL AND lng IS NOT NULL");
    for (const r of rows) {
      await gpsSet(r.id, { lat: Number(r.lat), lng: Number(r.lng), updatedAt: r.location_updated_at, dirty: false, campaignId: r.current_campaign_id, name: r.name, autoNumber: r.auto_number, state: r.state });
    }
    console.log(`GPS store pre-warmed with ${rows.length} drivers`);
  } catch (_) {}
})();

// ─── LIVE LOCATION ENDPOINTS ──────────────────────────────────────────────────

// Driver pushes GPS — writes to store instantly, flushed to DB every 5s
app.post("/api/drivers/:id/location", async (req, res) => {
  const { id } = req.params;
  const { lat, lng } = req.body;
  if (!lat || !lng) return res.status(400).json({ error: "lat and lng required" });
  const existing = (await gpsGet(id)) || {};
  await gpsSet(id, { ...existing, lat: Number(lat), lng: Number(lng), updatedAt: ts(), dirty: true });
  res.json({ success: true });
});

// Advertiser polls — reads from store, zero DB queries
app.get("/api/drivers/live-locations", async (req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  try {
    const { campaign_ids } = req.query;
    const ids = campaign_ids ? String(campaign_ids).split(",").filter(Boolean) : null;
    const entries = await gpsGetAll();
    const result = entries
      .filter(([, v]) => !ids || ids.includes(v.campaignId))
      .map(([driverId, v]) => ({ id: driverId, name: v.name, autoNumber: v.autoNumber, state: v.state, lat: v.lat, lng: v.lng, locationUpdatedAt: v.updatedAt, currentCampaignId: v.campaignId }));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch live locations" });
  }
});

app.get("/api/drivers", async (req, res) => {
  try {
    const rows = await db("SELECT * FROM drivers ORDER BY created_at DESC");
    res.json(rows.map(mapDriver));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/drivers", async (req, res) => {
  try {
    const { name, phone, autoNumber, location, dlNumber, aadhaarNumber, dlImage, aadhaarImage } = req.body;
    const id = uid("driver");
    await db(
      `INSERT INTO drivers (id, name, phone, auto_number, location, state, kyc_verified, total_earnings, wallet_balance, current_campaign_id, status, dl_number, aadhaar_number, dl_image, aadhaar_image)
       VALUES (?, ?, ?, ?, ?, 'offline', 0, 0, 0, NULL, 'pending_approval', ?, ?, ?, ?)`,
      [id, name || "Anonymous Driver", phone || "9999999999",
       autoNumber || "KA-01-XX-0000", location || "Bangalore",
       dlNumber || "", aadhaarNumber || "",
       dlImage || "https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&q=80&w=400",
       aadhaarImage || "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=400"]
    );
    await db(
      `INSERT INTO notifications (id, title, message, timestamp, unread, type) VALUES (?, 'New Driver Registered', ?, ?, 1, 'driver')`,
      [uid("notif"), `${name} has signed up and is waiting for KYC verification.`, ts()]
    );
    const [newDriver] = await db("SELECT * FROM drivers WHERE id = ?", [id]);
    res.status(201).json(mapDriver(newDriver));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

app.put("/api/drivers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const fields = {
      name: req.body.name, phone: req.body.phone,
      auto_number: req.body.autoNumber, location: req.body.location,
      status: req.body.status, state: req.body.state,
      kyc_verified: req.body.kycVerified !== undefined ? (req.body.kycVerified ? 1 : 0) : undefined,
      current_campaign_id: req.body.currentCampaignId,
      total_earnings: req.body.totalEarnings !== undefined ? Number(req.body.totalEarnings) : undefined,
      wallet_balance: req.body.walletBalance !== undefined ? Number(req.body.walletBalance) : undefined,
      current_session_kms: req.body.currentSessionKms !== undefined ? Number(req.body.currentSessionKms) : undefined,
      current_session_seconds: req.body.currentSessionSeconds !== undefined ? Number(req.body.currentSessionSeconds) : undefined,
      tracking_start_time: req.body.trackingStartTime,
      dl_number: req.body.dlNumber, aadhaar_number: req.body.aadhaarNumber,
      dl_image: req.body.dlImage, aadhaar_image: req.body.aadhaarImage,
    };

    const updates = [];
    const vals = [];
    for (const [col, val] of Object.entries(fields)) {
      if (val !== undefined) { updates.push(`${col} = ?`); vals.push(val); }
    }
    if (updates.length === 0) return res.status(400).json({ error: "Nothing to update" });
    vals.push(id);
    await db(`UPDATE drivers SET ${updates.join(", ")} WHERE id = ?`, vals);

    const [updated] = await db("SELECT * FROM drivers WHERE id = ?", [id]);
    if (!updated) return res.status(404).json({ error: "Driver not found" });
    res.json(mapDriver(updated));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

app.delete("/api/drivers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [driver] = await db("SELECT * FROM drivers WHERE id = ?", [id]);
    if (!driver) return res.status(404).json({ error: "Driver not found" });
    await db("DELETE FROM drivers WHERE id = ?", [id]);
    await db(
      `INSERT INTO notifications (id, title, message, timestamp, unread, type) VALUES (?, 'Driver Removed', ?, ?, 1, 'admin')`,
      [uid("notif"), `Driver ${driver.name} has been removed by Admin.`, ts()]
    );
    res.json({ success: true, deleted: mapDriver(driver) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// ─── PROOFS ───────────────────────────────────────────────────────────────────
app.get("/api/proofs", async (req, res) => {
  try {
    const rows = await db("SELECT * FROM proofs ORDER BY created_at DESC");
    res.json(rows.map(r => ({
      id: r.id, driverId: r.driver_id, driverName: r.driver_name,
      campaignId: r.campaign_id, campaignTitle: r.campaign_title,
      imageUrl: r.image_url, location: r.location,
      timestamp: r.timestamp, status: r.status, type: r.type,
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/proofs", uploadProof.single("photo"), async (req, res) => {
  try {
    const { driverId, campaignId, type, location } = req.body;
    const imageUrl = req.file
      ? `/uploads/proofs/${req.file.filename}`
      : (req.body.imageUrl || "");
    const [driver] = await db("SELECT name FROM drivers WHERE id = ?", [driverId]);
    const [campaign] = await db("SELECT title FROM campaigns WHERE id = ?", [campaignId]);
    const id = uid("proof");
    const nowTs = ts();
    const proofType = (type === "installation" || type === "daily") ? type : "daily";

    await db(
      `INSERT INTO proofs (id, driver_id, driver_name, campaign_id, campaign_title, image_url, location, timestamp, status, type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [id, driverId || "", driver ? driver.name : "Unknown Driver",
       campaignId || "", campaign ? campaign.title : "Unknown Campaign",
       imageUrl, location || "Unknown", nowTs, proofType]
    );
    await db(
      `INSERT INTO notifications (id, title, message, timestamp, unread, type) VALUES (?, 'Proof Uploaded', ?, ?, 1, 'driver')`,
      [uid("notif"), `${driver ? driver.name : "A driver"} uploaded ${proofType} proof for ${campaign ? campaign.title : "a campaign"}.`, nowTs]
    );

    const [newProof] = await db("SELECT * FROM proofs WHERE id = ?", [id]);
    res.status(201).json({
      id: newProof.id, driverId: newProof.driver_id, driverName: newProof.driver_name,
      campaignId: newProof.campaign_id, campaignTitle: newProof.campaign_title,
      imageUrl: newProof.image_url, location: newProof.location,
      timestamp: newProof.timestamp, status: newProof.status, type: newProof.type,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

app.put("/api/proofs/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ["pending", "approved", "flagged"];
    if (!allowed.includes(status)) return res.status(400).json({ error: "Invalid status" });
    await db("UPDATE proofs SET status = ? WHERE id = ?", [status, id]);
    const [updated] = await db("SELECT * FROM proofs WHERE id = ?", [id]);
    if (!updated) return res.status(404).json({ error: "Proof not found" });
    res.json({
      id: updated.id, driverId: updated.driver_id, driverName: updated.driver_name,
      campaignId: updated.campaign_id, campaignTitle: updated.campaign_title,
      imageUrl: updated.image_url, location: updated.location,
      timestamp: updated.timestamp, status: updated.status, type: updated.type,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// ─── WALLET ───────────────────────────────────────────────────────────────────
app.get("/api/wallet/transactions", async (req, res) => {
  try {
    const { user_id } = req.query;
    const rows = user_id
      ? await db("SELECT * FROM wallet_transactions WHERE user_id = ? ORDER BY created_at DESC", [user_id])
      : await db("SELECT * FROM wallet_transactions ORDER BY created_at DESC");
    res.json(rows.map(r => ({
      id: r.id, userId: r.user_id, type: r.type,
      amount: Number(r.amount), status: r.status,
      description: r.description, timestamp: r.timestamp,
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/wallet/transactions", async (req, res) => {
  try {
    const { userId, type, amount, description } = req.body;
    const id = uid("tx");
    const nowTs = ts();
    await db(
      `INSERT INTO wallet_transactions (id, user_id, type, amount, status, description, timestamp) VALUES (?, ?, ?, ?, 'success', ?, ?)`,
      [id, userId || "advertiser_main", type || "deposit", Number(amount) || 0, description || "Wallet transaction", nowTs]
    );

    if (type === "withdrawal") {
      await db("UPDATE drivers SET wallet_balance = GREATEST(0, wallet_balance - ?) WHERE id = ?", [Number(amount), userId]);
    }

    const [newTx] = await db("SELECT * FROM wallet_transactions WHERE id = ?", [id]);
    res.status(201).json({
      id: newTx.id, userId: newTx.user_id, type: newTx.type,
      amount: Number(newTx.amount), status: newTx.status,
      description: newTx.description, timestamp: newTx.timestamp,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// ─── BILLS ────────────────────────────────────────────────────────────────────
app.get("/api/bills", async (req, res) => {
  try {
    const { advertiser_id } = req.query;
    const rows = advertiser_id
      ? await db("SELECT * FROM bills WHERE receiver_id = ? OR sender_id = ? ORDER BY created_at DESC", [advertiser_id, advertiser_id])
      : await db("SELECT * FROM bills ORDER BY created_at DESC");
    res.json(rows.map(r => ({
      id: r.id, type: r.type, senderId: r.sender_id, senderName: r.sender_name,
      receiverId: r.receiver_id, campaignId: r.campaign_id,
      amount: Number(r.amount), status: r.status,
      kmsCovered: Number(r.kms_covered), periodStart: r.period_start,
      periodEnd: r.period_end, timestamp: r.timestamp, description: r.description,
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/bills", async (req, res) => {
  try {
    const { type, senderId, senderName, receiverId, campaignId, amount, kmsCovered, periodStart, periodEnd, description } = req.body;
    const id = uid("bill");
    const nowTs = ts();
    const pStart = periodStart || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const pEnd = periodEnd || new Date().toISOString().split("T")[0];

    await db(
      `INSERT INTO bills (id, type, sender_id, sender_name, receiver_id, campaign_id, amount, status, kms_covered, period_start, period_end, timestamp, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?)`,
      [id, type || "driver_service_bill", senderId || "", senderName || "",
       receiverId || "admin", campaignId || null, Number(amount) || 0,
       Number(kmsCovered) || 0, pStart, pEnd, nowTs, description || "Weekly Service Bill"]
    );

    const notifTitle = type === "driver_service_bill" ? "Service Bill Raised" : "Campaign Invoice Issued";
    const notifMsg = type === "driver_service_bill"
      ? `Driver ${senderName} raised a service bill for ₹${amount} (${kmsCovered} KM).`
      : `Admin issued an invoice of ₹${amount} to campaign advertiser.`;
    await db(
      `INSERT INTO notifications (id, title, message, timestamp, unread, type) VALUES (?, ?, ?, ?, 1, 'billing')`,
      [uid("notif"), notifTitle, notifMsg, nowTs]
    );

    const [newBill] = await db("SELECT * FROM bills WHERE id = ?", [id]);
    res.status(201).json({
      id: newBill.id, type: newBill.type, senderId: newBill.sender_id,
      senderName: newBill.sender_name, receiverId: newBill.receiver_id,
      campaignId: newBill.campaign_id, amount: Number(newBill.amount),
      status: newBill.status, kmsCovered: Number(newBill.kms_covered),
      periodStart: newBill.period_start, periodEnd: newBill.period_end,
      timestamp: newBill.timestamp, description: newBill.description,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

app.put("/api/bills/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const [bill] = await db("SELECT * FROM bills WHERE id = ?", [id]);
    if (!bill) return res.status(404).json({ error: "Bill not found" });

    const oldStatus = bill.status;
    await db("UPDATE bills SET status = ? WHERE id = ?", [status, id]);
    const nowTs = ts();

    if (status === "paid" && oldStatus !== "paid") {
      if (bill.type === "driver_service_bill") {
        await db("UPDATE drivers SET wallet_balance = GREATEST(0, wallet_balance - ?) WHERE id = ?", [bill.amount, bill.sender_id]);
        await db(
          `INSERT INTO wallet_transactions (id, user_id, type, amount, status, description, timestamp) VALUES (?, ?, 'withdrawal', ?, 'success', ?, ?)`,
          [uid("tx"), bill.sender_id, bill.amount, `Payout processed for bill: ${bill.id}`, nowTs]
        );
        await db(
          `INSERT INTO notifications (id, title, message, timestamp, unread, type) VALUES (?, 'Service Bill Paid', ?, ?, 1, 'billing')`,
          [uid("notif"), `Your service bill of ₹${bill.amount} has been paid.`, nowTs]
        );
      } else if (bill.type === "advertiser_invoice") {
        await db(
          `INSERT INTO wallet_transactions (id, user_id, type, amount, status, description, timestamp) VALUES (?, ?, 'payment', ?, 'success', ?, ?)`,
          [uid("tx"), bill.receiver_id || "advertiser_main", bill.amount, `Payment for invoice: ${bill.id}`, nowTs]
        );
        await db(
          `INSERT INTO notifications (id, title, message, timestamp, unread, type) VALUES (?, 'Invoice Paid', ?, ?, 1, 'billing')`,
          [uid("notif"), `Invoice for ₹${bill.amount} has been settled.`, nowTs]
        );
      }
    }

    const [updated] = await db("SELECT * FROM bills WHERE id = ?", [id]);
    res.json({
      id: updated.id, type: updated.type, senderId: updated.sender_id,
      senderName: updated.sender_name, receiverId: updated.receiver_id,
      campaignId: updated.campaign_id, amount: Number(updated.amount),
      status: updated.status, kmsCovered: Number(updated.kms_covered),
      periodStart: updated.period_start, periodEnd: updated.period_end,
      timestamp: updated.timestamp, description: updated.description,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// ─── BILLING SCHEDULER ────────────────────────────────────────────────────────
// Rates come from each driver's city (cities.driver_rate) — no global threshold.
async function runBillingScheduler() {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const nowTs = now.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  const periodStart = sevenDaysAgo.toISOString().split("T")[0];
  const periodEnd = now.toISOString().split("T")[0];

  const drivers = await db("SELECT * FROM drivers");
  const cities = await db("SELECT * FROM cities");
  const cityRateMap = {};
  cities.forEach(c => { cityRateMap[c.name.toLowerCase()] = Number(c.driver_rate) || 5; });

  const generatedBills = [];
  const skippedDrivers = [];

  for (const driver of drivers) {
    // Skip if a pending bill already exists for this driver
    const [pendingBill] = await db(
      "SELECT id FROM bills WHERE sender_id = ? AND type = 'driver_service_bill' AND status = 'pending' LIMIT 1",
      [driver.id]
    );
    if (pendingBill) {
      skippedDrivers.push({ id: driver.id, name: driver.name, reason: "Pending bill exists" });
      continue;
    }

    // Get city rate for this driver
    const cityName = (driver.location || "").toLowerCase();
    const cityRate = cityRateMap[cityName] || 5;

    // Calculate KMs from this week's earning transactions
    const driverTxs = await db(
      "SELECT amount, description, timestamp FROM wallet_transactions WHERE user_id = ? AND type = 'earning'",
      [driver.id]
    );
    let weekKms = 0;
    driverTxs.forEach(tx => {
      const txDate = new Date(tx.timestamp);
      if (!isNaN(txDate.getTime()) && txDate >= sevenDaysAgo) {
        const m = tx.description.match(/Completed\s+([\d.]+)\s*KM/i);
        weekKms += m ? parseFloat(m[1]) : (Number(tx.amount) / cityRate);
      }
    });

    // Fallback: use wallet balance if no KM records found
    if (weekKms === 0 && Number(driver.wallet_balance) > 0) {
      weekKms = Number(driver.wallet_balance) / cityRate;
    }
    weekKms = parseFloat(weekKms.toFixed(1));

    // Bill every driver who drove any KMs this week
    if (weekKms > 0) {
      const billAmount = parseFloat((weekKms * cityRate).toFixed(2));
      const billId = uid("bill_auto");
      await db(
        `INSERT INTO bills (id, type, sender_id, sender_name, receiver_id, campaign_id, amount, status, kms_covered, period_start, period_end, timestamp, description)
         VALUES (?, 'driver_service_bill', ?, ?, 'admin', ?, ?, 'pending', ?, ?, ?, ?, ?)`,
        [billId, driver.id, driver.name, driver.current_campaign_id || null,
         billAmount, weekKms, periodStart, periodEnd, nowTs,
         `Weekly Service Bill — ${weekKms} KM × ₹${cityRate}/KM (${driver.location || "City"})`]
      );
      await db(
        `INSERT INTO notifications (id, title, message, timestamp, unread, type) VALUES (?, 'Weekly Driver Bill', ?, ?, 1, 'billing')`,
        [uid("notif"), `Bill of ₹${billAmount} generated for ${driver.name} (${weekKms} KM).`, nowTs]
      );
      generatedBills.push({ id: driver.id, name: driver.name, kms: weekKms, amount: billAmount, city: driver.location });
    } else {
      skippedDrivers.push({ id: driver.id, name: driver.name, kms: 0, reason: "No KMs recorded this week" });
    }
  }

  await db("UPDATE scheduler_settings SET last_run_timestamp = ? WHERE id = 1", [nowTs]);

  const summaryMessage = generatedBills.length > 0
    ? `Generated ${generatedBills.length} bill(s): ${generatedBills.map(g => `${g.name} (${g.kms} KM, ₹${g.amount})`).join(", ")}`
    : `Ran — no KMs recorded for any driver this week. (${drivers.length} checked)`;

  await db(
    `INSERT INTO scheduler_logs (timestamp, status, message) VALUES (?, ?, ?)`,
    [nowTs, generatedBills.length > 0 ? "Success" : "Idle", summaryMessage]
  );

  return { success: true, generatedBills, skippedDrivers, summary: summaryMessage };
}

// ─── Next Monday 9 AM IST helper ─────────────────────────────────────────────
function nextMondayIST() {
  const now = new Date();
  // IST = UTC+5:30
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(now.getTime() + istOffset);
  const day = istNow.getUTCDay(); // 0=Sun, 1=Mon…
  const daysUntilMonday = day === 1 ? 7 : (8 - day) % 7 || 7;
  const nextMon = new Date(istNow);
  nextMon.setUTCDate(istNow.getUTCDate() + daysUntilMonday);
  nextMon.setUTCHours(9 - 5, 60 - 30, 0, 0); // 9:00 IST = 03:30 UTC
  return new Date(nextMon.getTime() - istOffset);
}

// Schedule: every Monday at 09:00 IST (03:30 UTC)
schedule.scheduleJob("30 3 * * 1", async () => {
  try {
    const [settings] = await db("SELECT * FROM scheduler_settings WHERE id = 1");
    if (!settings || !settings.enabled) return;
    console.log("[Scheduler] Running weekly billing — Monday 9 AM IST");
    await runBillingScheduler();
  } catch (err) {
    console.error("[Scheduler Error]", err.message);
  }
});

app.get("/api/scheduler/settings", async (req, res) => {
  try {
    const [settings] = await db("SELECT * FROM scheduler_settings WHERE id = 1");
    const logs = await db("SELECT * FROM scheduler_logs ORDER BY id DESC LIMIT 20");
    res.json({
      enabled: !!settings.enabled,
      lastRunTimestamp: settings.last_run_timestamp,
      nextRunTime: nextMondayIST().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      logs: logs.map(l => ({ timestamp: l.timestamp, status: l.status, message: l.message })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/scheduler/settings", async (req, res) => {
  try {
    const { enabled } = req.body;
    if (enabled !== undefined) {
      await db("UPDATE scheduler_settings SET enabled = ? WHERE id = 1", [enabled ? 1 : 0]);
    }
    const [settings] = await db("SELECT * FROM scheduler_settings WHERE id = 1");
    res.json({ success: true, settings: { enabled: !!settings.enabled } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/scheduler/trigger", async (req, res) => {
  try {
    const result = await runBillingScheduler();
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Scheduler error" });
  }
});

// ─── BILLING STATS ────────────────────────────────────────────────────────────
app.get("/api/billing/stats", async (req, res) => {
  try {
    const bills = await db("SELECT * FROM bills");
    const totalBilled = bills.filter(b => b.type === "driver_service_bill").reduce((s, b) => s + Number(b.amount), 0);
    const totalCollected = bills.filter(b => b.type === "advertiser_invoice" && b.status === "paid").reduce((s, b) => s + Number(b.amount), 0);
    const owedToDrivers = bills.filter(b => b.type === "driver_service_bill" && b.status === "pending").reduce((s, b) => s + Number(b.amount), 0);
    const netBalance = totalCollected - totalBilled;
    res.json({ totalBilled, totalCollected, owedToDrivers, netBalance });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
app.get("/api/notifications", async (req, res) => {
  try {
    const rows = await db("SELECT * FROM notifications ORDER BY created_at DESC LIMIT 100");
    res.json(rows.map(r => ({
      id: r.id, title: r.title, message: r.message,
      timestamp: r.timestamp, unread: !!r.unread, type: r.type,
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/notifications/read", async (req, res) => {
  try {
    await db("UPDATE notifications SET unread = 0");
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// ─── CITIES ───────────────────────────────────────────────────────────────────
function mapCity(r) {
  return {
    id: r.id, name: r.name, zone: r.zone || "",
    rate: Number(r.rate) || 0, activeAutos: Number(r.active_autos) || 0,
    status: r.status || "active",
    driverRate: Number(r.driver_rate) || 5,
    brandRate: Number(r.brand_rate) || 150,
    capacity: Number(r.capacity) || 100,
  };
}

app.get("/api/cities", async (req, res) => {
  try {
    const rows = await db("SELECT * FROM cities ORDER BY name ASC");
    res.json(rows.map(mapCity));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/cities", async (req, res) => {
  try {
    const { name, zone, rate, activeAutos, status, driverRate, brandRate, capacity } = req.body;
    const id = uid("city");
    await db(
      `INSERT INTO cities (id, name, zone, rate, active_autos, status, driver_rate, brand_rate, capacity)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name || "New City", zone || "", Number(rate) || 0,
       Number(activeAutos) || 0, status || "active",
       Number(driverRate) || 5, Number(brandRate) || 150, Number(capacity) || 100]
    );
    const [newCity] = await db("SELECT * FROM cities WHERE id = ?", [id]);
    res.status(201).json(mapCity(newCity));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

app.put("/api/cities/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, zone, activeAutos, status, driverRate, brandRate, capacity } = req.body;
    await db(
      `UPDATE cities SET name=?, zone=?, active_autos=?, status=?, driver_rate=?, brand_rate=?, capacity=? WHERE id=?`,
      [name, zone || "", Number(activeAutos) || 0, status || "active",
       Number(driverRate) || 5, Number(brandRate) || 150, Number(capacity) || 100, id]
    );
    const [updated] = await db("SELECT * FROM cities WHERE id = ?", [id]);
    if (!updated) return res.status(404).json({ error: "City not found" });
    res.json(mapCity(updated));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

app.delete("/api/cities/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [city] = await db("SELECT * FROM cities WHERE id = ?", [id]);
    if (!city) return res.status(404).json({ error: "City not found" });
    await db("DELETE FROM cities WHERE id = ?", [id]);
    res.json({ success: true, deleted: city });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// ─── AI ENDPOINTS (Claude) ────────────────────────────────────────────────────
const CLAUDE_MODEL = "claude-haiku-4-5-20251001";

app.post("/api/gemini/chat", async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages array is required" });
  }

  if (!claude) {
    return res.json({
      reply: "AI Assistant is initializing. Please ensure ANTHROPIC_API_KEY is set in your .env file. Quick estimate: For North Kolkata, recommend 35 autos for 30 days = ₹2,20,000 budget, ~42M impressions.",
    });
  }

  try {
    const campaigns = await db("SELECT title, status, budget, autos_count city, kms_covered, qr_scans FROM campaigns");
    const [driverStats] = await db("SELECT COUNT(*) as total, SUM(CASE WHEN state != 'offline' THEN 1 ELSE 0 END) as online, SUM(CASE WHEN current_campaign_id IS NOT NULL THEN 1 ELSE 0 END) as active FROM drivers");

    const systemPrompt = `You are the AutoAdz AI Assistant for India's leading auto-rickshaw transit advertising platform.
Help advertisers, drivers, and admins maximize ROI. Be actionable and friendly.

Current live data:
- Campaigns: ${JSON.stringify(campaigns.map(c => ({ title: c.title, status: c.status, budget: c.budget, autos: c.autos_count, city: c.city, kms: c.kms_covered, scans: c.qr_scans })))}
- Drivers: Total: ${driverStats.total}, Online: ${driverStats.online}, Campaign-linked: ${driverStats.active}
- Performance: Avg QR CTR 3.4%, avg auto travels 85-110 KM/day = ~40,000 daily impressions in tier-1 cities.

Capabilities:
1. Suggest auto counts by location (North Kolkata: 30-45 autos, ₹1.8L-2.5L)
2. Predict reach: autos × days × 40,000 impressions
3. Analyze QR scan performance
4. Support for drivers and advertisers
Keep responses concise and well-structured. No markdown code blocks.`;

    const claudeMessages = messages.map((m, i) => ({
      role: i % 2 === 0 ? "user" : "assistant",
      content: m.text || m.content || "",
    })).filter(m => m.content);

    if (claudeMessages.length === 0 || claudeMessages[claudeMessages.length - 1].role !== "user") {
      claudeMessages.push({ role: "user", content: messages[messages.length - 1]?.text || "Hello" });
    }

    const response = await claude.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: claudeMessages,
    });

    const replyText = response.content[0]?.text || "I could not generate a response. Please try again.";
    res.json({ reply: replyText });
  } catch (err) {
    console.error("Claude Chat Error:", err);
    res.status(500).json({
      error: "AI Generation Failed",
      reply: "AI is temporarily unavailable. Quick estimate: 35 autos × 30 days × 40,000 impressions = 42M total reach at ~₹5.2 CPM for North Kolkata.",
    });
  }
});

app.post("/api/gemini/advisor", async (req, res) => {
  const { niche, city } = req.body;
  const targetNiche = niche || "dental clinic";
  const targetCity = city || "Kolkata";

  if (!claude) {
    const autosCount = targetNiche.toLowerCase().includes("dental") || targetNiche.toLowerCase().includes("clinic") ? 30 : 45;
    const budget = autosCount * 30 * 250;
    return res.json({
      success: true,
      advisorReport: {
        niche: targetNiche, city: targetCity, recommendedAutos: autosCount,
        recommendedDuration: "30 Days", recommendedBudget: budget,
        estimatedImpressions: (autosCount * 30 * 40000).toLocaleString("en-IN"),
        targetZones: "Central Business District, high-traffic metro hubs, primary market lanes",
        marketingTip: `For a ${targetNiche} in ${targetCity}, use high-contrast layouts on auto hoods with QR codes.`,
      },
    });
  }

  try {
    const response = await claude.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 512,
      messages: [{
        role: "user",
        content: `You are the AutoAdz AI Advisor for India's auto-rickshaw advertising platform. Generate a hyperlocal campaign report.
Niche: ${targetNiche}
City: ${targetCity}

Return ONLY a valid JSON object with exactly these fields (no markdown, no explanation):
{
  "niche": "string",
  "city": "string",
  "recommendedAutos": number,
  "recommendedDuration": "string",
  "recommendedBudget": number,
  "estimatedImpressions": "string",
  "targetZones": "string",
  "marketingTip": "string"
}`,
      }],
    });

    const text = response.content[0]?.text || "{}";
    const reportData = JSON.parse(text.trim());
    res.json({ success: true, advisorReport: reportData });
  } catch (err) {
    console.error("Claude Advisor Error:", err);
    res.status(500).json({ error: "AI Generation failed" });
  }
});

app.post("/api/gemini/generator", async (req, res) => {
  const { niche, creativeType } = req.body;
  const targetNiche = niche || "restaurant";
  const type = creativeType || "headline";

  if (!claude) {
    const fallbacks = {
      headline: [`Your neighborhood ${targetNiche} is just 2 KM away!`, `Scan this auto for 20% off at ${targetNiche}!`, `Fresh, warm, authentic. Welcome to ${targetNiche}.`, `Don't cook tonight! Hot meals from ${targetNiche}.`, `The city's favorite ${targetNiche} — scan to discover!`],
      tagline: ["Taste the tradition, feel the love.", "Good food, great mood, quick auto rides.", "Savor every second, scan for every bite.", "Hyperefficient meals for hyperactive lives.", "Your pocket-friendly local flavor hub."],
      qr: ["Scan to download our menu & book in 10 seconds!", "Scan to claim a free dessert on your first visit!", "Scan for an exclusive auto-passenger discount code!", "Scan to follow us and win weekly free meals!", "Scan to claim 15% off at checkout."],
    };
    return res.json({ success: true, niche: targetNiche, creativeType: type, suggestions: fallbacks[type] || fallbacks.headline });
  }

  try {
    const response = await claude.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 512,
      messages: [{
        role: "user",
        content: `You are a copywriter for AutoAdz auto-rickshaw transit advertising in India.
Generate exactly 5 short, catchy, high-conversion campaign ${type} concepts for a ${targetNiche} business.
Return ONLY a JSON array of 5 strings, no markdown, no extra text.
Example: ["Concept 1", "Concept 2", "Concept 3", "Concept 4", "Concept 5"]`,
      }],
    });

    const text = response.content[0]?.text || "[]";
    const suggestions = JSON.parse(text.trim());
    res.json({ success: true, niche: targetNiche, creativeType: type, suggestions });
  } catch (err) {
    console.error("Claude Creative Error:", err);
    res.status(500).json({ error: "Creative Generation failed" });
  }
});

// ─── WHATSAPP ─────────────────────────────────────────────────────────────────
app.post("/api/whatsapp/send", async (req, res) => {
  const { token, phoneId, recipient, message } = req.body;
  if (!token || !phoneId || !recipient || !message) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  let formattedRecipient = recipient.replace(/\D/g, "");
  if (formattedRecipient.length === 10) formattedRecipient = `91${formattedRecipient}`;

  try {
    const response = await fetch(`https://graph.facebook.com/v17.0/${phoneId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp", recipient_type: "individual",
        to: formattedRecipient, type: "text", text: { body: message },
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      const errMsg = data.error?.message ? `${data.error.message} (Code: ${data.error.code})` : JSON.stringify(data.error);
      return res.status(response.status).json({ success: false, error: errMsg, details: data });
    }
    return res.json({ success: true, response: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ─── LEGAL PAGES ──────────────────────────────────────────────────────────────
function renderLegalPage(title, activeTab, contentHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - AutoAdz Legal Compliance</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>body { font-family: 'Inter', sans-serif; }</style>
</head>
<body class="bg-slate-50 text-slate-800 flex flex-col min-h-screen">
    <header class="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-30 shadow-xs">
        <div class="max-w-5xl mx-auto flex justify-between items-center">
            <div class="flex items-center gap-2">
                <div class="bg-[#0B1F4D] text-[#FF9800] p-1.5 rounded-lg font-extrabold text-sm tracking-wide">AA</div>
                <div>
                    <h1 class="font-bold text-sm text-[#0B1F4D] tracking-tight">AutoAdz Legal & Compliance Hub</h1>
                    <p class="text-[9px] text-slate-400 font-mono">Managed by M/s Deinrim Solutionss (P) ltd.</p>
                </div>
            </div>
            <div class="flex gap-4 text-xs font-semibold">
                <a href="/privacy" class="hover:text-[#FF9800] transition ${activeTab === "privacy" ? "text-[#0B1F4D] underline font-bold" : "text-slate-600"}">Privacy</a>
                <a href="/terms" class="hover:text-[#FF9800] transition ${activeTab === "terms" ? "text-[#0B1F4D] underline font-bold" : "text-slate-600"}">Terms</a>
                <a href="/support" class="hover:text-[#FF9800] transition ${activeTab === "support" ? "text-[#0B1F4D] underline font-bold" : "text-slate-600"}">Support</a>
                <a href="/deletion" class="hover:text-red-500 transition ${activeTab === "deletion" ? "text-red-600 underline font-bold" : "text-slate-600"}">Data Deletion</a>
            </div>
        </div>
    </header>
    <main class="flex-1 max-w-3xl w-full mx-auto p-6 my-8 bg-white border border-slate-200 rounded-3xl shadow-sm">${contentHtml}</main>
    <footer class="bg-[#0B1F4D] text-slate-400 py-8 px-6 text-xs font-mono mt-auto">
        <div class="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <h5 class="font-bold text-white uppercase text-[11px] mb-2 tracking-wider">OPERATOR & DEVELOPER</h5>
                <p class="leading-relaxed text-[11px]">M/s Deinrim Solutionss (P) ltd.<br>Kolkata, West Bengal (WB), India<br>Hotline: +91 98361-30393<br>Email: support@deinrimsolutions.com</p>
            </div>
            <div class="text-left md:text-right">
                <p class="text-[9px] text-slate-500 mt-2">© 2026 M/s Deinrim Solutionss (P) ltd. All rights reserved.</p>
            </div>
        </div>
    </footer>
</body>
</html>`;
}

app.get("/privacy", (req, res) => {
  res.send(renderLegalPage("Privacy Policy", "privacy", `
    <div class="space-y-4">
        <h2 class="text-xl font-extrabold text-[#0B1F4D]">Privacy Policy & Location Consent</h2>
        <p class="text-xs text-slate-500 font-mono">Last Updated: June 25, 2026</p>
        <hr class="border-slate-100 my-4" />
        <div class="space-y-4 text-xs text-slate-700 leading-relaxed">
            <p>This Privacy Policy governs the AutoAdz application operated by M/s Deinrim Solutionss (P) ltd., Kolkata, West Bengal, India.</p>
            <h3 class="font-extrabold text-sm text-[#0B1F4D] uppercase">1. Background Location Tracking</h3>
            <div class="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-900 text-xs space-y-2">
                <p class="font-bold">CRITICAL LOCATION USAGE NOTICE:</p>
                <p>AutoAdz tracks GPS coordinates of registered auto-rickshaw driver partners to allocate advertising mileage payouts. Tracking runs exclusively while the driver's telemetry meter is toggled Active, including in the background. No tracking occurs when the driver is Offline.</p>
            </div>
            <h3 class="font-extrabold text-sm text-[#0B1F4D] uppercase">2. Camera & Photos</h3>
            <p>Camera access is used solely for drivers to upload Campaign Proof of Installation photos for admin verification.</p>
            <h3 class="font-extrabold text-sm text-[#0B1F4D] uppercase">3. Contact</h3>
            <p>M/s Deinrim Solutionss (P) ltd., Kolkata, WB, India. Hotline: +91 98361-30393. Email: support@deinrimsolutions.com</p>
        </div>
    </div>`));
});

app.get("/terms", (req, res) => {
  res.send(renderLegalPage("Terms of Service", "terms", `
    <div class="space-y-4">
        <h2 class="text-xl font-extrabold text-[#0B1F4D]">Terms of Service Agreement</h2>
        <p class="text-xs text-slate-500 font-mono">Last Updated: June 25, 2026</p>
        <hr class="border-slate-100 my-4" />
        <div class="space-y-4 text-xs text-slate-700 leading-relaxed">
            <p>By registering with AutoAdz you agree to the terms set by M/s Deinrim Solutionss (P) ltd., Kolkata, WB.</p>
            <h3 class="font-extrabold text-sm text-[#0B1F4D] uppercase">1. Accurate Vehicle Details</h3>
            <p>Drivers must register legally-registered auto-rickshaws with matching plate numbers.</p>
            <h3 class="font-extrabold text-sm text-[#0B1F4D] uppercase">2. Anti-Fraud & Telemetry Integrity</h3>
            <p>GPS simulation or mock location use is strictly forbidden and results in permanent ban with wallet forfeiture.</p>
            <h3 class="font-extrabold text-sm text-[#0B1F4D] uppercase">3. Jurisdiction</h3>
            <p>Disputes are subject to exclusive jurisdiction of courts in Kolkata, West Bengal, India.</p>
        </div>
    </div>`));
});

app.get("/support", (req, res) => {
  res.send(renderLegalPage("Support", "support", `
    <div class="space-y-4">
        <h2 class="text-xl font-extrabold text-[#0B1F4D]">Developer Support & Contacts Desk</h2>
        <hr class="border-slate-100 my-4" />
        <div class="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-3">
            <h4 class="font-bold text-sm text-[#0B1F4D]">M/s Deinrim Solutionss (P) ltd.</h4>
            <p class="text-xs">📞 +91 98361-30393</p>
            <p class="text-xs">✉️ support@deinrimsolutions.com</p>
            <p class="text-xs">📍 Kolkata, West Bengal, India</p>
        </div>
    </div>`));
});

app.get("/deletion", (req, res) => {
  res.send(renderLegalPage("Data Deletion", "deletion", `
    <div class="space-y-4">
        <h2 class="text-xl font-extrabold text-[#0B1F4D]">Driver Data Deletion & Account Erasure</h2>
        <hr class="border-slate-100 my-4" />
        <div class="bg-red-50 border border-red-200 text-red-900 p-4 rounded-xl text-xs">
            <p class="font-bold">⚠️ Irreversible: Account erasure deletes all GPS logs, wallet balances, and campaign linkages.</p>
        </div>
        <div class="border border-slate-200 p-5 rounded-2xl bg-slate-50 space-y-4">
            <form id="deletion-form" class="space-y-3">
                <div class="space-y-1">
                    <label class="block text-[10px] font-bold uppercase text-slate-600">Registered Mobile Number</label>
                    <input type="tel" id="pub-phone" required placeholder="e.g. +91 98361-30393" class="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs font-mono">
                </div>
                <div class="flex items-start gap-2">
                    <input type="checkbox" id="pub-ack" required class="mt-0.5">
                    <label for="pub-ack" class="text-[10px] text-slate-500">I confirm erasure of all my data and acknowledge unpaid earnings will be forfeited.</label>
                </div>
                <button type="submit" class="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg text-xs uppercase">SUBMIT DATA PURGE REQUEST</button>
            </form>
            <div id="deletion-success" class="hidden bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-center">
                <h5 class="font-bold text-sm">✓ Erasure Request Received</h5>
                <p class="text-[11px] mt-1">Our DPO will contact you via SMS within 7 working days.</p>
            </div>
        </div>
        <script>
            document.getElementById('deletion-form').addEventListener('submit', function(e) {
                e.preventDefault();
                if(!document.getElementById('pub-phone').value) { alert('Please provide a phone number.'); return; }
                document.getElementById('deletion-form').classList.add('hidden');
                document.getElementById('deletion-success').classList.remove('hidden');
            });
        </script>
    </div>`));
});

// ─── AUTH ─────────────────────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || "autoadz_jwt_secret_2026";

// One-time admin setup — visit /api/auth/setup-admin once after DB migration
app.get("/api/auth/setup-admin", async (req, res) => {
  try {
    const [existing] = await db("SELECT id FROM users WHERE email = ?", ["admin@autoadz.in"]);
    if (existing) return res.json({ message: "Admin already exists." });
    const hash = await bcrypt.hash("Admin@2026", 10);
    await db(
      "INSERT INTO users (role, name, email, password_hash, company, phone) VALUES ('admin','AutoAdz Admin','admin@autoadz.in',?,?,?)",
      [hash, "AutoAdz Platform", "9836130393"]
    );
    res.json({ success: true, message: "Admin created. Email: admin@autoadz.in | Password: Admin@2026" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Setup failed" });
  }
});

// List all brand advertisers (admin use)
app.get("/api/advertisers", async (req, res) => {
  try {
    const rows = await db("SELECT id, name, email, company, phone, gstin, office, is_active, created_at FROM users WHERE role = 'advertiser' ORDER BY created_at DESC");
    res.json(rows.map(r => ({
      id: r.id, name: r.name, email: r.email,
      company: r.company, phone: r.phone, gstin: r.gstin, office: r.office,
      isActive: !!r.is_active, createdAt: r.created_at,
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch advertisers" });
  }
});

// Admin: reset advertiser password
app.put("/api/advertisers/:id/reset-password", async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });
    const hash = await bcrypt.hash(newPassword, 10);
    await db("UPDATE users SET password_hash = ? WHERE id = ? AND role = 'advertiser'", [hash, id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to reset password" });
  }
});

// Admin: toggle advertiser active status
app.put("/api/advertisers/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    await db("UPDATE users SET is_active = ? WHERE id = ? AND role = 'advertiser'", [isActive ? 1 : 0, id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update status" });
  }
});

// Admin: delete advertiser account
app.delete("/api/advertisers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db("DELETE FROM users WHERE id = ? AND role = 'advertiser'", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete advertiser" });
  }
});

// Advertiser self-registration
app.post("/api/auth/register", async (req, res) => {
  const { name, email, password, company, phone, gstin, office } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: "Name, email and password are required" });
  try {
    const [existing] = await db("SELECT id FROM users WHERE email = ?", [email]);
    if (existing) return res.status(409).json({ error: "Email already registered" });
    const hash = await bcrypt.hash(password, 10);
    await db(
      "INSERT INTO users (role, name, email, password_hash, company, phone, gstin, office) VALUES ('advertiser',?,?,?,?,?,?,?)",
      [name, email, hash, company || "", phone || "", gstin || "", office || ""]
    );
    res.status(201).json({ success: true, message: "Account created. Please login." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Registration failed" });
  }
});

// Login (admin + advertiser by email; driver by phone)
app.post("/api/auth/login", async (req, res) => {
  const { email, phone, password, role } = req.body;
  try {
    if (role === "driver") {
      // Driver login by phone
      const [driver] = await db("SELECT * FROM drivers WHERE phone = ?", [phone]);
      if (!driver) return res.status(401).json({ error: "Phone number not registered" });
      if (driver.status === "pending_approval") return res.status(403).json({ error: "Your account is pending admin approval" });
      if (driver.status === "rejected") return res.status(403).json({ error: "Your account has been rejected. Contact support." });
      const token = jwt.sign({ id: driver.id, role: "driver", name: driver.name }, JWT_SECRET, { expiresIn: "7d" });
      return res.json({ success: true, token, role: "driver", driverId: driver.id, name: driver.name });
    }

    // Admin / Advertiser login
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });
    const [user] = await db("SELECT * FROM users WHERE email = ?", [email]);
    if (!user) return res.status(401).json({ error: "Invalid email or password" });
    if (!user.is_active) return res.status(403).json({ error: "Account disabled. Contact support." });
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: "Invalid email or password" });
    const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: "7d" });
    res.json({
      success: true, token, role: user.role, userId: user.id,
      name: user.name, email: user.email,
      company: user.company, phone: user.phone, gstin: user.gstin, office: user.office || "",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

// Verify token
app.get("/api/auth/verify", (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return res.status(401).json({ valid: false });
  try {
    const payload = jwt.verify(auth.split(" ")[1], JWT_SECRET);
    res.json({ valid: true, user: payload });
  } catch {
    res.status(401).json({ valid: false });
  }
});

// ─── SERVER START ─────────────────────────────────────────────────────────────
async function startServer() {
  // Test DB connection
  try {
    await db("SELECT 1");
    console.log("✅ MySQL connected successfully");
  } catch (err) {
    console.error("❌ MySQL connection failed:", err.message);
    console.error("Please check your .env DB credentials and ensure the database exists.");
    process.exit(1);
  }

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    const publicPath = path.join(process.cwd(), "public");
    app.use(express.static(publicPath));
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 AutoAdz server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
