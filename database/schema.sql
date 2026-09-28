-- =====================================================================
-- Commute Buddy: A Smart Commute-Aware Real-Estate Discovery Platform
-- Relational Database Schema (Third Normal Form - 3NF)
-- Based on Research Paper: Vallabh Shingroop, Rasika Khure, Purva Mahale, Yash Kolhe, Vedant Kharabe
-- CSE Dept, Tulsiramji Gaikwad Patil College of Engineering and Technology, Nagpur, India
-- =====================================================================

CREATE DATABASE IF NOT EXISTS commute_buddy_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE commute_buddy_db;

-- 1. USERS Entity (Seekers and Owners with Role Flag per Section VI)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    google_id VARCHAR(255) NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50) NULL,
    avatar_url TEXT NULL,
    role ENUM('seeker', 'owner', 'admin') NOT NULL DEFAULT 'seeker',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_users_email (email),
    INDEX idx_users_role (role)
) ENGINE=InnoDB;

-- 2. PROPERTIES Entity (Composite index on lat/lng for Algorithm 1 and owner/status per Section XX)
CREATE TABLE IF NOT EXISTS properties (
    id INT AUTO_INCREMENT PRIMARY KEY,
    owner_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(12,2) NOT NULL,
    property_type ENUM('apartment', 'villa', 'studio', 'penthouse', 'duplex', 'plot') NOT NULL DEFAULT 'apartment',
    purpose ENUM('rent', 'buy', 'plot') NOT NULL DEFAULT 'rent',
    bedrooms INT NOT NULL DEFAULT 1,
    bathrooms INT NOT NULL DEFAULT 1,
    sqft INT NOT NULL DEFAULT 1000,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    address VARCHAR(500) NOT NULL,
    city VARCHAR(100) NOT NULL,
    amenities JSON NULL,
    images JSON NULL,
    livability_score INT DEFAULT 80,
    pet_friendly BOOLEAN DEFAULT FALSE,
    furnished ENUM('furnished', 'semi-furnished', 'unfurnished') DEFAULT 'semi-furnished',
    source_portal VARCHAR(50) DEFAULT 'CommuteBuddy', -- '99acres', 'MagicBricks', 'Makaan', 'NoBroker'
    source_url TEXT NULL,
    status ENUM('active', 'under_review', 'sold', 'rented') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_properties_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    -- Section XX Composite Indexes:
    INDEX idx_properties_spatial (latitude, longitude),
    INDEX idx_properties_owner_status (owner_id, status),
    INDEX idx_properties_city (city),
    INDEX idx_properties_price (price)
) ENGINE=InnoDB;

-- 3. INQUIRIES Entity (Places 1:N from User to Property per Section XVIII)
CREATE TABLE IF NOT EXISTS inquiries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    property_id INT NOT NULL,
    user_id INT NOT NULL,
    seeker_name VARCHAR(255) NOT NULL,
    seeker_phone VARCHAR(50) NOT NULL,
    seeker_email VARCHAR(255) NOT NULL,
    message TEXT,
    preferred_date DATE NULL,
    preferred_time_slot VARCHAR(50) NULL,
    status ENUM('pending', 'contacted', 'scheduled', 'closed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_inquiries_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    CONSTRAINT fk_inquiries_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_inquiries_property (property_id),
    INDEX idx_inquiries_user (user_id),
    INDEX idx_inquiries_status (status)
) ENGINE=InnoDB;

-- 4. BOOKINGS Entity (Inquiries may yield a Booking per Figure 2)
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    inquiry_id INT NULL,
    property_id INT NOT NULL,
    user_id INT NOT NULL,
    booking_date DATE NOT NULL,
    time_slot VARCHAR(50) NOT NULL,
    status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bookings_inquiry FOREIGN KEY (inquiry_id) REFERENCES inquiries(id) ON DELETE SET NULL,
    CONSTRAINT fk_bookings_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    CONSTRAINT fk_bookings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_bookings_property (property_id),
    INDEX idx_bookings_user (user_id),
    INDEX idx_bookings_date (booking_date)
) ENGINE=InnoDB;

-- 5. PAYMENTS Entity (Bookings settled by Payments per Figure 2)
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    user_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    payment_method VARCHAR(50) DEFAULT 'UPI',
    payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'completed',
    transaction_id VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payments_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    CONSTRAINT fk_payments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_payments_booking (booking_id),
    INDEX idx_payments_user (user_id),
    INDEX idx_payments_status (payment_status)
) ENGINE=InnoDB;

-- 6. ANALYTICS Entity (Tracked asynchronously on write-behind basis per Section XX)
CREATE TABLE IF NOT EXISTS analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    property_id INT NOT NULL UNIQUE,
    views_count INT DEFAULT 0,
    inquiries_count INT DEFAULT 0,
    commute_discoveries JSON NULL, -- Distribution buckets: {"under10": 15, "10to20": 42, "20to30": 26, "over30": 8}
    last_viewed_at TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_analytics_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    INDEX idx_analytics_property (property_id)
) ENGINE=InnoDB;
