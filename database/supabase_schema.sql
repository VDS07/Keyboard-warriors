-- =====================================================================
-- Commute Buddy: Supabase Database Schema
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- =====================================================================

-- 1. PROFILES Table (User Accounts, Google OAuth 2.0 & Roles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'seeker' CHECK (role IN ('seeker', 'owner', 'admin')),
    auth_provider TEXT DEFAULT 'google',
    google_id TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index on email & role
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 2. SAVED_PROPERTIES Table (User Bookmark / Favorites)
CREATE TABLE IF NOT EXISTS public.saved_properties (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_email TEXT NOT NULL,
    property_id INT NOT NULL,
    property_data JSONB,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_property UNIQUE (user_email, property_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_properties_user ON public.saved_properties(user_email);
CREATE INDEX IF NOT EXISTS idx_saved_properties_prop ON public.saved_properties(property_id);

-- 3. PROPERTIES Table (Owner Registered Listings)
CREATE TABLE IF NOT EXISTS public.properties (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    owner_email TEXT NOT NULL,
    owner_name TEXT,
    owner_phone TEXT,
    title TEXT NOT NULL,
    description TEXT,
    price NUMERIC(12, 2) NOT NULL,
    recommended_price NUMERIC(12, 2),
    property_type TEXT DEFAULT 'apartment' CHECK (property_type IN ('apartment', 'villa', 'studio', 'penthouse', 'duplex', 'plot')),
    purpose TEXT DEFAULT 'rent' CHECK (purpose IN ('rent', 'buy', 'plot')),
    bedrooms INT DEFAULT 1,
    bathrooms INT DEFAULT 1,
    sqft INT DEFAULT 1000,
    carpet_area INT,
    super_area INT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    society_name TEXT,
    rera_id TEXT,
    amenities JSONB DEFAULT '[]'::jsonb,
    images JSONB DEFAULT '[]'::jsonb,
    image TEXT,
    livability_score INT DEFAULT 85,
    pet_friendly BOOLEAN DEFAULT false,
    furnished TEXT DEFAULT 'semi-furnished' CHECK (furnished IN ('furnished', 'semi-furnished', 'unfurnished')),
    floor TEXT,
    facing TEXT,
    security_deposit TEXT,
    maintenance TEXT,
    availability TEXT DEFAULT 'Ready to Move',
    property_age TEXT,
    water_supply TEXT,
    power_backup TEXT,
    gated_community BOOLEAN DEFAULT true,
    verified_badge TEXT,
    broker_type TEXT DEFAULT 'Direct Owner',
    source_portal TEXT DEFAULT 'CommuteBuddy Direct',
    source_url TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'under_review', 'sold', 'rented')),
    views INT DEFAULT 0,
    inquiries INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_properties_spatial ON public.properties(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_properties_city ON public.properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_owner ON public.properties(owner_email);

-- 4. INQUIRIES & TOUR BOOKINGS Table
CREATE TABLE IF NOT EXISTS public.inquiries (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    property_id INT NOT NULL,
    property_title TEXT,
    user_email TEXT NOT NULL,
    seeker_name TEXT NOT NULL,
    seeker_phone TEXT,
    message TEXT,
    preferred_date DATE,
    time_slot TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'scheduled', 'closed')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_inquiries_property ON public.inquiries(property_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_user ON public.inquiries(user_email);

-- =====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Ensures data can be read/written by frontend clients securely
-- =====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- Allow public / anon read and write access for development demo
CREATE POLICY "Public profiles access" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public saved_properties access" ON public.saved_properties FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public properties access" ON public.properties FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public inquiries access" ON public.inquiries FOR ALL USING (true) WITH CHECK (true);

-- Insert Sample Demo Profiles
INSERT INTO public.profiles (email, name, role, avatar_url, auth_provider)
VALUES 
    ('alex.morgan@gmail.com', 'Alex Morgan', 'seeker', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200', 'google'),
    ('rajesh.mehta@gmail.com', 'Rajesh Mehta', 'owner', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200', 'google')
ON CONFLICT (email) DO NOTHING;
