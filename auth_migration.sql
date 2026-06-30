-- AutoAdz Auth Migration
-- Run this ONCE in phpMyAdmin on u114296063_autoadzdb

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role ENUM('admin','advertiser') NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  company VARCHAR(255) DEFAULT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  gstin VARCHAR(30) DEFAULT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- After running this, visit https://autoadz.in/api/auth/setup-admin once
-- to create the default admin account (admin@autoadz.in / Admin@2026)
