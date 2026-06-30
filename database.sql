-- AutoAdz MySQL Database Schema
-- Run this once in your Hostinger phpMyAdmin to set up the database

-- NOTE: On Hostinger, select your database in phpMyAdmin before importing (do not run CREATE DATABASE)

-- Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
  id VARCHAR(100) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  client VARCHAR(255),
  city VARCHAR(100),
  area VARCHAR(255),
  budget DECIMAL(12,2) DEFAULT 0,
  autos_count INT DEFAULT 0,
  creative_url TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  creative_status VARCHAR(50) DEFAULT 'pending',
  creative_approved TINYINT(1) DEFAULT 0,
  start_date DATE,
  end_date DATE,
  kms_covered DECIMAL(10,2) DEFAULT 0,
  qr_scans INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Drivers
CREATE TABLE IF NOT EXISTS drivers (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  auto_number VARCHAR(50),
  location VARCHAR(100),
  state VARCHAR(20) DEFAULT 'offline',
  kyc_verified TINYINT(1) DEFAULT 0,
  total_earnings DECIMAL(12,2) DEFAULT 0,
  wallet_balance DECIMAL(12,2) DEFAULT 0,
  current_campaign_id VARCHAR(100) DEFAULT NULL,
  status VARCHAR(50) DEFAULT 'pending_approval',
  dl_number VARCHAR(100),
  aadhaar_number VARCHAR(20),
  dl_image TEXT,
  aadhaar_image TEXT,
  current_session_kms DECIMAL(10,4) DEFAULT 0,
  current_session_seconds INT DEFAULT 0,
  tracking_start_time VARCHAR(50) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Proofs of installation
CREATE TABLE IF NOT EXISTS proofs (
  id VARCHAR(100) PRIMARY KEY,
  driver_id VARCHAR(100),
  driver_name VARCHAR(255),
  campaign_id VARCHAR(100),
  campaign_title VARCHAR(255),
  image_url TEXT,
  location VARCHAR(255),
  timestamp VARCHAR(50),
  status VARCHAR(50) DEFAULT 'pending',
  type VARCHAR(50) DEFAULT 'installation',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Wallet transactions
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(100),
  type VARCHAR(50),
  amount DECIMAL(12,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'success',
  description TEXT,
  timestamp VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(100) PRIMARY KEY,
  title VARCHAR(255),
  message TEXT,
  timestamp VARCHAR(50),
  unread TINYINT(1) DEFAULT 1,
  type VARCHAR(50) DEFAULT 'general',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bills and invoices
CREATE TABLE IF NOT EXISTS bills (
  id VARCHAR(100) PRIMARY KEY,
  type VARCHAR(50) DEFAULT 'driver_service_bill',
  sender_id VARCHAR(100),
  sender_name VARCHAR(255),
  receiver_id VARCHAR(100),
  campaign_id VARCHAR(100) DEFAULT NULL,
  amount DECIMAL(12,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending',
  kms_covered DECIMAL(10,2) DEFAULT 0,
  period_start DATE,
  period_end DATE,
  timestamp VARCHAR(50),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cities
CREATE TABLE IF NOT EXISTS cities (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(100),
  zone VARCHAR(100),
  rate DECIMAL(8,2) DEFAULT 15,
  active_autos INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Scheduler settings (single row)
CREATE TABLE IF NOT EXISTS scheduler_settings (
  id INT PRIMARY KEY DEFAULT 1,
  enabled TINYINT(1) DEFAULT 1,
  mileage_threshold DECIMAL(8,2) DEFAULT 10,
  interval_minutes INT DEFAULT 5,
  last_run_timestamp VARCHAR(50) DEFAULT NULL,
  driver_rate_per_km DECIMAL(8,2) DEFAULT 4.5
);

-- Scheduler logs
CREATE TABLE IF NOT EXISTS scheduler_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  timestamp VARCHAR(50),
  status VARCHAR(50),
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================
-- SEED DEFAULT DATA
-- =====================

INSERT IGNORE INTO cities (id, name, zone, rate, active_autos) VALUES
  ('city_kolkata', 'Kolkata', 'East Hub', 15, 150),
  ('city_delhi', 'Delhi NCR', 'North Hub', 18, 220),
  ('city_bangalore', 'Bangalore', 'South Hub', 20, 250),
  ('city_mumbai', 'Mumbai', 'West Hub', 22, 180);

INSERT IGNORE INTO scheduler_settings (id, enabled, mileage_threshold, interval_minutes, driver_rate_per_km)
  VALUES (1, 1, 10, 5, 4.5);

INSERT IGNORE INTO campaigns (id, title, client, city, area, budget, autos_count, creative_url, status, creative_status, creative_approved, start_date, end_date, kms_covered, qr_scans) VALUES
  ('camp_bengaluru_metro', 'Edge Fashion - Summer Launch Bengaluru', 'Edge Retail Ltd.', 'Bangalore', 'Indiranagar, Koramangala', 150000, 25, 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=800', 'active', 'approved', 1, '2026-06-01', '2026-07-01', 1240.50, 84),
  ('camp_kolkata_pujo', 'Pujo Carnival Festive Offer', 'Senco Jewellers', 'Kolkata', 'Gariahat, Salt Lake', 75000, 15, 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&q=80&w=800', 'pending', 'pending', 0, '2026-09-15', '2026-10-15', 0, 0);

INSERT IGNORE INTO drivers (id, name, phone, auto_number, location, state, kyc_verified, total_earnings, wallet_balance, current_campaign_id, status, dl_number, aadhaar_number, dl_image, aadhaar_image) VALUES
  ('driver_delip', 'Delip Kumar', '+91 98450-12345', 'KA-03-AA-4921', 'Bangalore', 'online', 1, 14250.00, 1850.00, 'camp_bengaluru_metro', 'active', 'DL-0420230004921', '4512-8923-3039', 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&q=80&w=400', 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=400'),
  ('driver_rajesh', 'Rajesh Gowda', '+91 91220-44932', 'KA-01-MJ-8831', 'Bangalore', 'online', 1, 9800.00, 1250.00, 'camp_bengaluru_metro', 'active', 'DL-1220220008831', '8841-2033-9125', 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&q=80&w=400', 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=400');

INSERT IGNORE INTO proofs (id, driver_id, driver_name, campaign_id, campaign_title, image_url, location, timestamp, status, type) VALUES
  ('proof_1', 'driver_delip', 'Delip Kumar', 'camp_bengaluru_metro', 'Edge Fashion - Summer Launch Bengaluru', 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&q=80&w=600', 'Indiranagar, Bangalore', '6/28/2026, 4:32:00 PM', 'approved', 'morning_checkin');

INSERT IGNORE INTO wallet_transactions (id, user_id, type, amount, status, description, timestamp) VALUES
  ('tx_1', 'driver_delip', 'earning', 250.00, 'success', 'GPS Telematics Payout - Koramangala Run', '6/28/2026, 6:15:00 PM'),
  ('tx_2', 'driver_delip', 'payout', 1500.00, 'success', 'Weekly bank settlement payout', '6/27/2026, 11:00:00 AM'),
  ('tx_adv_1', 'advertiser_main', 'deposit', 25000.00, 'success', 'Wallet pre-funding credit card deposit', '6/25/2026, 2:30:00 PM');

INSERT IGNORE INTO notifications (id, title, message, timestamp, unread, type) VALUES
  ('notif_1', 'Weekly Payout Credited', 'Your weekly settlement invoice was approved. ₹1,500 has been transferred to HDFC Bank ****3039.', '6/27/2026, 11:00:00 AM', 1, 'payment'),
  ('notif_2', 'Campaign Assignment Approved', 'Congratulations! You have been linked to Edge Fashion - Summer Launch Bengaluru.', '6/26/2026, 10:15:00 AM', 0, 'campaign');

INSERT IGNORE INTO bills (id, type, sender_id, sender_name, receiver_id, campaign_id, amount, status, kms_covered, period_start, period_end, timestamp, description) VALUES
  ('bill_past_1', 'driver_service_bill', 'driver_delip', 'Delip Kumar', 'admin', 'camp_bengaluru_metro', 1500, 'paid', 333.33, '2026-06-15', '2026-06-22', '6/22/2026, 11:00:00 AM', 'Weekly auto transit transit-ad service fee'),
  ('bill_past_2', 'driver_service_bill', 'driver_delip', 'Delip Kumar', 'admin', 'camp_bengaluru_metro', 850, 'pending', 188.88, '2026-06-22', '2026-06-29', '6/29/2026, 11:00:00 AM', 'Weekly auto transit transit-ad service fee'),
  ('bill_past_adv_1', 'advertiser_invoice', 'admin', 'AutoAdz Admin', 'advertiser_main', 'camp_bengaluru_metro', 25000, 'paid', 1240.50, '2026-06-01', '2026-06-29', '6/29/2026, 12:00:00 PM', 'Mid-campaign progress billing invoice');

INSERT IGNORE INTO scheduler_logs (timestamp, status, message) VALUES
  (NOW(), 'Initialized', 'AutoAdz billing scheduler initialized with 10 KM threshold.');
