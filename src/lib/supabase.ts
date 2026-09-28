// =====================================================================
// Commute Buddy: Supabase Database Client & Helpers
// Replaces local storage with live PostgreSQL database via Supabase
// =====================================================================

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { UserProfile, UserRole, Property } from "@/context/SearchContext";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.includes("supabase.co") &&
  !supabaseUrl.includes("your-project-id")
);

if (!isSupabaseConfigured) {
  console.info(
    "💡 [Supabase] Running with smart local adapter. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env to connect your live Supabase cloud PostgreSQL database."
  );
}

// Initialize real Supabase client or a safe fallback
export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (createClient(
      supabaseUrl || "https://placeholder-project.supabase.co",
      supabaseAnonKey || "placeholder-anon-key"
    ) as SupabaseClient);

// =====================================================================
// 1. PROFILES DATABASE OPERATIONS
// =====================================================================
export const supabaseProfiles = {
  // Upsert user profile (created on Google OAuth / login)
  async upsertProfile(profile: UserProfile): Promise<void> {
    if (!profile.email) return;

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from("profiles").upsert(
          {
            email: profile.email,
            name: profile.name,
            avatar_url: profile.avatar,
            role: profile.role,
            auth_provider: profile.authProvider || "google",
            google_id: profile.googleId || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "email" }
        );
        if (error) console.warn("[Supabase] upsertProfile warning:", error.message);
      } catch (err: any) {
        console.warn("[Supabase] upsertProfile error:", err.message);
      }
    } else {
      // Local fallback
      try {
        localStorage.setItem("cb_user_profile", JSON.stringify(profile));
      } catch {}
    }
  },

  // Get user profile by email
  async getProfileByEmail(email: string): Promise<UserProfile | null> {
    if (!email) return null;

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("email", email)
          .single();

        if (error || !data) return null;

        return {
          name: data.name,
          email: data.email,
          avatar: data.avatar_url || "",
          role: (data.role as UserRole) || "seeker",
          isLoggedIn: true,
          authProvider: data.auth_provider,
          googleId: data.google_id,
        };
      } catch {
        return null;
      }
    }

    try {
      const saved = localStorage.getItem("cb_user_profile");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.email === email) return parsed;
      }
    } catch {}
    return null;
  },
};

// =====================================================================
// 2. SAVED PROPERTIES (BOOKMARKS / FAVORITES)
// =====================================================================
export const supabaseSavedProperties = {
  // Fetch all saved property IDs for a user
  async getSavedPropertyIds(userEmail: string): Promise<number[]> {
    if (!userEmail) return [];

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from("saved_properties")
          .select("property_id")
          .eq("user_email", userEmail);

        if (error || !data) return [];
        return data.map((item) => Number(item.property_id));
      } catch (err: any) {
        console.warn("[Supabase] getSavedPropertyIds error:", err.message);
        return [];
      }
    }

    try {
      const saved = localStorage.getItem(`cb_saved_properties_${userEmail}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  },

  // Save / Bookmark a property
  async saveProperty(userEmail: string, propertyId: number, propertyData?: any): Promise<void> {
    if (!userEmail || !propertyId) return;

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from("saved_properties").upsert(
          {
            user_email: userEmail,
            property_id: propertyId,
            property_data: propertyData || null,
            created_at: new Date().toISOString(),
          },
          { onConflict: "user_email,property_id" }
        );
        if (error) console.warn("[Supabase] saveProperty warning:", error.message);
      } catch (err: any) {
        console.warn("[Supabase] saveProperty error:", err.message);
      }
    } else {
      try {
        const key = `cb_saved_properties_${userEmail}`;
        const current: number[] = JSON.parse(localStorage.getItem(key) || "[]");
        if (!current.includes(propertyId)) {
          localStorage.setItem(key, JSON.stringify([...current, propertyId]));
        }
      } catch {}
    }
  },

  // Unsave / Remove Bookmark
  async unsaveProperty(userEmail: string, propertyId: number): Promise<void> {
    if (!userEmail || !propertyId) return;

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from("saved_properties")
          .delete()
          .match({ user_email: userEmail, property_id: propertyId });
        if (error) console.warn("[Supabase] unsaveProperty warning:", error.message);
      } catch (err: any) {
        console.warn("[Supabase] unsaveProperty error:", err.message);
      }
    } else {
      try {
        const key = `cb_saved_properties_${userEmail}`;
        const current: number[] = JSON.parse(localStorage.getItem(key) || "[]");
        localStorage.setItem(key, JSON.stringify(current.filter((id) => id !== propertyId)));
      } catch {}
    }
  },
};

// =====================================================================
// 3. OWNER PROPERTIES REGISTRATION & DELETION
// =====================================================================
export const supabaseProperties = {
  // Fetch properties registered by owner
  async getOwnerProperties(ownerEmail: string): Promise<Property[]> {
    if (!ownerEmail) return [];

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from("properties")
          .select("*")
          .eq("owner_email", ownerEmail)
          .order("created_at", { ascending: false });

        if (error || !data) return [];

        return data.map((p: any) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          price: Number(p.price),
          recommendedPrice: p.recommended_price ? Number(p.recommended_price) : undefined,
          type: p.property_type || "apartment",
          purpose: p.purpose || "rent",
          bedrooms: p.bedrooms || 1,
          bathrooms: p.bathrooms || 1,
          sqft: p.sqft || 1000,
          lat: p.latitude,
          lng: p.longitude,
          address: p.address,
          city: p.city,
          amenities: Array.isArray(p.amenities) ? p.amenities : [],
          images: Array.isArray(p.images) ? p.images : [p.image || ""],
          image: p.image || (Array.isArray(p.images) ? p.images[0] : ""),
          livabilityScore: p.livability_score || 85,
          petFriendly: Boolean(p.pet_friendly),
          furnished: p.furnished || "semi-furnished",
          societyName: p.society_name,
          reraId: p.rera_id,
          carpetSqft: p.carpet_area,
          superSqft: p.super_area,
          floor: p.floor,
          facing: p.facing,
          securityDeposit: p.security_deposit,
          maintenance: p.maintenance,
          availability: p.availability,
          propertyAge: p.property_age,
          waterSupply: p.water_supply,
          powerBackup: p.power_backup,
          gatedCommunity: Boolean(p.gated_community),
          verifiedBadge: p.verified_badge,
          brokerSource: p.source_portal || "CommuteBuddy Direct",
          brokerType: p.broker_type || "Direct Owner",
          contactName: p.owner_name,
          contactPhone: p.owner_phone,
        }));
      } catch (err: any) {
        console.warn("[Supabase] getOwnerProperties error:", err.message);
        return [];
      }
    }

    try {
      const saved = localStorage.getItem(`cb_owner_properties_${ownerEmail}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  },

  // Register new property in Supabase
  async createProperty(property: Omit<Property, "id">, ownerEmail: string): Promise<Property> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from("properties")
          .insert({
            owner_email: ownerEmail,
            owner_name: property.contactName || "Property Owner",
            owner_phone: property.contactPhone || "+91-9876543210",
            title: property.title,
            description: property.description,
            price: property.price,
            recommended_price: property.recommendedPrice || null,
            property_type: property.type || "apartment",
            purpose: property.purpose || "rent",
            bedrooms: property.bedrooms || 1,
            bathrooms: property.bathrooms || 1,
            sqft: property.sqft || 1000,
            carpet_area: property.carpetSqft || Math.round((property.sqft || 1000) * 0.78),
            super_area: property.superSqft || property.sqft || 1000,
            latitude: property.lat,
            longitude: property.lng,
            address: property.address || "",
            city: property.city || "Bengaluru",
            society_name: property.societyName || "",
            rera_id: property.reraId || null,
            amenities: property.amenities || [],
            images: property.images || (property.image ? [property.image] : []),
            image: property.image || (property.images && property.images[0]) || "",
            livability_score: property.livabilityScore || 85,
            pet_friendly: property.petFriendly || false,
            furnished: property.furnished || "semi-furnished",
            floor: property.floor || "3 of 10",
            facing: property.facing || "East Facing",
            security_deposit: property.securityDeposit || `₹${(property.price * 2).toLocaleString("en-IN")}`,
            maintenance: property.maintenance || "₹2,500/mo",
            availability: property.availability || "Ready to Move",
            property_age: property.propertyAge || "1-3 Years",
            water_supply: property.waterSupply || "24 Hours Supply",
            power_backup: property.powerBackup || "100% Full Power Backup",
            gated_community: property.gatedCommunity !== undefined ? property.gatedCommunity : true,
            verified_badge: property.verifiedBadge || "Owner Verified",
            broker_type: property.brokerType || "Direct Owner",
            source_portal: "CommuteBuddy Direct",
            status: "active",
          })
          .select()
          .single();

        if (!error && data) {
          return {
            ...property,
            id: Number(data.id),
          };
        }
      } catch (err: any) {
        console.warn("[Supabase] createProperty error:", err.message);
      }
    }

    // Local fallback ID
    const randomId = Math.floor(10000 + Math.random() * 90000);
    const localProp: Property = { ...property, id: randomId };
    try {
      const key = `cb_owner_properties_${ownerEmail}`;
      const existing: Property[] = JSON.parse(localStorage.getItem(key) || "[]");
      localStorage.setItem(key, JSON.stringify([localProp, ...existing]));
    } catch {}
    return localProp;
  },

  // Delete property from Supabase
  async deleteProperty(propertyId: number): Promise<void> {
    if (!propertyId) return;

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from("properties").delete().eq("id", propertyId);
        if (error) console.warn("[Supabase] deleteProperty warning:", error.message);
      } catch (err: any) {
        console.warn("[Supabase] deleteProperty error:", err.message);
      }
    }
  },
};

// =====================================================================
// 4. INQUIRIES & SITE VISIT BOOKINGS
// =====================================================================
export const supabaseInquiries = {
  async createInquiry(inquiry: {
    propertyId: number;
    propertyTitle: string;
    userEmail: string;
    seekerName: string;
    seekerPhone: string;
    message?: string;
    preferredDate?: string;
    timeSlot?: string;
  }): Promise<boolean> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from("inquiries").insert({
          property_id: inquiry.propertyId,
          property_title: inquiry.propertyTitle,
          user_email: inquiry.userEmail,
          seeker_name: inquiry.seekerName,
          seeker_phone: inquiry.seekerPhone,
          message: inquiry.message || "",
          preferred_date: inquiry.preferredDate || null,
          time_slot: inquiry.timeSlot || null,
          status: "pending",
        });
        if (error) {
          console.warn("[Supabase] createInquiry warning:", error.message);
          return false;
        }
        return true;
      } catch (err: any) {
        console.warn("[Supabase] createInquiry error:", err.message);
        return false;
      }
    }
    return true;
  },
};
