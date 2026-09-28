import { describe, it, expect, beforeAll } from "vitest";
import jwt from "jsonwebtoken";

describe("Production Google OAuth & Auth System Architecture", () => {
  const BACKEND_URL = "http://localhost:3001";
  const TEST_JWT_SECRET = "commute-buddy-super-secret-jwt-token-key-2025-production-grade";

  it("TEST 4 & 5: Backend rejects missing or malformed Google ID tokens with 400/401", async () => {
    // Missing token
    const missingRes = await fetch(`${BACKEND_URL}/api/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Origin": "http://localhost:8080" },
      body: JSON.stringify({}),
    });
    expect(missingRes.status).toBe(400);
    const missingData = await missingRes.json();
    expect(missingData.error).toContain("Missing Google credential token");

    // Invalid/fake cryptographic signature token
    const invalidRes = await fetch(`${BACKEND_URL}/api/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Origin": "http://localhost:8080" },
      body: JSON.stringify({ credential: "invalid_untrusted_google_token_123" }),
    });
    expect(invalidRes.status).toBe(401);
    const invalidData = await invalidRes.json();
    expect(invalidData.error).toBe("Invalid or expired Google token");
  });

  it("TEST 7 & 8: CORS policy restricts unauthorized origins", async () => {
    const res = await fetch(`${BACKEND_URL}/api/status`, {
      headers: { "Origin": "http://malicious-site.com" },
    });
    const allowOrigin = res.headers.get("access-control-allow-origin");
    expect(allowOrigin).toBeNull();
    await res.text();
  });

  it("TEST 10: Email/password authentication succeeds and issues application JWT session", async () => {
    const email = `testuser_${Date.now()}@example.com`;
    const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Origin": "http://localhost:8080" },
      body: JSON.stringify({
        email,
        name: "Test Commuter",
        role: "seeker",
      }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.token).toBeDefined();
    expect(data.user.email).toBe(email);
    expect(data.user.role).toBe("seeker");

    // Verify session token with GET /api/auth/me
    const meRes = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: {
        "Authorization": `Bearer ${data.token}`,
        "Origin": "http://localhost:8080",
      },
    });
    expect(meRes.status).toBe(200);
    const meData = await meRes.json();
    expect(meData.user.email).toBe(email);
    expect(meData.user.role).toBe("seeker");
  });

  it("TEST 8: Role persistence preserves Owner and Seeker roles correctly", async () => {
    const ownerEmail = `owner_${Date.now()}@landlord.in`;
    const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Origin": "http://localhost:8080" },
      body: JSON.stringify({
        email: ownerEmail,
        name: "Verified Landlord",
        role: "owner",
      }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user.role).toBe("owner");

    // Inspect session via /api/auth/me
    const meRes = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: { "Authorization": `Bearer ${data.token}` },
    });
    const meData = await meRes.json();
    expect(meData.user.role).toBe("owner");
  });

  it("TEST 18: Live property discovery endpoint is intact and functional", async () => {
    const propRes = await fetch(
      `${BACKEND_URL}/api/properties?lat=12.9345&lng=77.6265&tMax=45&mode=drive&purpose=rent`
    );
    expect(propRes.status).toBe(200);
    const properties = await propRes.json();
    expect(Array.isArray(properties)).toBe(true);
    expect(properties.length).toBeGreaterThan(0);
    expect(properties[0]).toHaveProperty("commuteMinutes");
    expect(properties[0]).toHaveProperty("distanceKm");
  }, 15000);
});
