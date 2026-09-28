// =====================================================================
// Commute Buddy - Scraper Ingestion & Integration Service
// Integrates 99acres and Multi-Site (MagicBricks, Makaan) Real Estate Scrapers
// =====================================================================

export class ScraperService {
  /**
   * Normalizes a scraped property item into Commute Buddy 3NF Property Entity
   */
  static normalizeScrapedItem(item, source = "99acres") {
    // Extract coordinates safely
    let lat = null;
    let lng = null;

    if (item.location && typeof item.location === "object") {
      lat = parseFloat(item.location.latitude || item.location.lat);
      lng = parseFloat(item.location.longitude || item.location.lng || item.location.lon);
    } else if (item.latitude && item.longitude) {
      lat = parseFloat(item.latitude);
      lng = parseFloat(item.longitude);
    } else if (item.lat && item.lng) {
      lat = parseFloat(item.lat);
      lng = parseFloat(item.lng);
    }

    // Extract price
    let price = 0;
    if (typeof item.price === "number") {
      price = item.price;
    } else if (typeof item.price === "object" && item.price !== null) {
      price = parseFloat(item.price.value || item.price.amount || 0);
    } else if (typeof item.price === "string") {
      const cleaned = item.price.replace(/[^0-9.]/g, "");
      price = parseFloat(cleaned) || 0;
      if (item.price.toLowerCase().includes("cr")) price *= 10000000;
      else if (item.price.toLowerCase().includes("lac") || item.price.toLowerCase().includes("lakh")) price *= 100000;
      else if (item.price.toLowerCase().includes("k")) price *= 1000;
    }

    // Extract sqft / area
    let sqft = 1000;
    if (item.area && typeof item.area === "object") {
      sqft = parseInt(item.area.superArea || item.area.carpetArea || item.area.builtUpArea || 1000, 10);
    } else if (item.area_sqft || item.sqft) {
      sqft = parseInt(item.area_sqft || item.sqft, 10);
    }

    // Bedrooms & Bathrooms
    const bedrooms = parseInt(item.bedrooms || item.beds || 2, 10);
    const bathrooms = parseInt(item.bathrooms || item.baths || bedrooms || 2, 10);

    // Title & Address
    const title = item.title || item.propertyTitle || `${bedrooms} BHK ${item.propertyType || "Apartment"} in ${item.city || "Nagpur"}`;
    const address = item.address || (item.location && item.location.address) || `${item.city || "Nagpur"}`;
    const city = item.city || (typeof item.location === "object" && item.location.city) || "Nagpur";

    // Amenities
    let amenities = [];
    if (Array.isArray(item.amenities)) {
      amenities = item.amenities.map(a => (typeof a === "string" ? a : a.name || ""));
    } else if (typeof item.amenities === "string") {
      amenities = item.amenities.split(",").map(a => a.trim());
    } else {
      amenities = ["Lift", "Security", "Parking", "Water Storage", "Power Backup"];
    }

    // Images
    let images = [];
    if (Array.isArray(item.photos || item.images)) {
      images = (item.photos || item.images).map(img => (typeof img === "string" ? img : img.url || ""));
    }
    if (images.length === 0) {
      images = [
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600",
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600"
      ];
    }

    // Property Type
    let propertyType = "apartment";
    const rawType = (item.propertyType || item.type || "").toLowerCase();
    if (rawType.includes("villa") || rawType.includes("house")) propertyType = "villa";
    else if (rawType.includes("studio")) propertyType = "studio";
    else if (rawType.includes("penthouse")) propertyType = "penthouse";
    else if (rawType.includes("duplex")) propertyType = "duplex";
    else if (rawType.includes("plot") || rawType.includes("land")) propertyType = "plot";

    return {
      title,
      description: item.description || `Verified listing scraped from ${source}. ${bedrooms} BHK spacious property with top connectivity.`,
      price: price > 0 ? price : 25000,
      property_type: propertyType,
      purpose: (item.purpose || item.transactionType || "rent").toLowerCase().includes("buy") || (item.purpose || "").toLowerCase().includes("sale") ? "buy" : "rent",
      bedrooms,
      bathrooms,
      sqft: sqft > 0 ? sqft : 1100,
      latitude: lat || 21.1458,
      longitude: lng || 79.0882,
      address,
      city,
      amenities,
      images,
      livability_score: Math.min(98, Math.max(70, 75 + (bedrooms * 5))),
      pet_friendly: !!item.petFriendly || true,
      furnished: item.furnished || "semi-furnished",
      source_portal: source,
      source_url: item.propertyUrl || item.url || null,
      status: "active",
      owner: item.contactName || item.owner || "Verified Seller",
      phone: item.contactPhone || item.phone || "+91-9876543210"
    };
  }

  /**
   * Parse a batch of JSON scraped records from 99acres or Multi-Site Scraper
   */
  static parseScrapedBatch(data, source = "99acres") {
    const list = Array.isArray(data) ? data : data.properties || data.items || data.results || [];
    return list.map(item => this.normalizeScrapedItem(item, source));
  }
}
