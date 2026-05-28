const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const GOOGLE_KEY = process.env.GOOGLE_PLACES_API_KEY;
const PLACES_BASE = "https://maps.googleapis.com/maps/api/place";

// ── Health check ────────────────────────────────────────────────────────────
app.get("/", (req, res) => res.json({ status: "ok", message: "GMB Finder API running" }));

// ── Text Search ─────────────────────────────────────────────────────────────
app.get("/api/search", async (req, res) => {
  const { industry, city, country, maxResults = 20 } = req.query;
  if (!industry || !city) return res.status(400).json({ error: "industry and city required" });
  if (!GOOGLE_KEY) return res.status(500).json({ error: "GOOGLE_PLACES_API_KEY not set in .env" });

  const query = `${industry} in ${city} ${country || ""}`.trim();

  try {
    const searchRes = await axios.get(`${PLACES_BASE}/textsearch/json`, {
      params: { query, key: GOOGLE_KEY },
    });

    if (searchRes.data.status !== "OK") {
      return res.status(400).json({ error: searchRes.data.status, message: searchRes.data.error_message });
    }

    const places = searchRes.data.results.slice(0, parseInt(maxResults));

    // Get details for each place
    const detailed = await Promise.all(
      places.map(async (place) => {
        try {
          const detailRes = await axios.get(`${PLACES_BASE}/details/json`, {
            params: {
              place_id: place.place_id,
              fields: [
                "name", "formatted_address", "formatted_phone_number",
                "international_phone_number", "website", "opening_hours",
                "editorial_summary", "photos", "rating", "user_ratings_total",
                "types", "url", "business_status",
              ].join(","),
              key: GOOGLE_KEY,
            },
          });
          if (detailRes.data.status === "OK") {
            return { ...place, ...detailRes.data.result };
          }
          return place;
        } catch {
          return place;
        }
      })
    );

    // Analyze each business for unclaimed signals
    const results = detailed
      .map((p) => {
        const signals = [];
        if (!p.website) signals.push("no_website");
        if (!p.formatted_phone_number && !p.international_phone_number) signals.push("no_phone");
        if (!p.opening_hours) signals.push("no_hours");
        if (!p.editorial_summary?.overview) signals.push("no_editorial_summary");
        if ((p.user_ratings_total || 0) < 5) signals.push("low_reviews");
        if (!p.photos || p.photos.length === 0) signals.push("no_photos");

        const weights = {
          no_website: 20, no_phone: 20, no_hours: 18,
          no_editorial_summary: 15, low_reviews: 12, no_photos: 10,
        };
        const confidence = Math.min(
          100,
          signals.reduce((s, k) => s + (weights[k] || 0), 0)
        );

        return {
          id: p.place_id,
          name: p.name,
          address: p.formatted_address || p.vicinity || "",
          phone: p.formatted_phone_number || p.international_phone_number || null,
          website: p.website || null,
          rating: p.rating || 0,
          reviewCount: p.user_ratings_total || 0,
          category: p.types?.[0]?.replace(/_/g, " ") || industry,
          hasHours: !!p.opening_hours,
          hours: p.opening_hours?.weekday_text?.[0] || null,
          placeId: p.place_id,
          mapsUrl: p.url || `https://www.google.com/maps/place/?q=place_id:${p.place_id}`,
          signals,
          confidence,
        };
      })
      .filter((b) => b.confidence >= 20)
      .sort((a, b) => b.confidence - a.confidence);

    res.json({ results, total: results.length });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Search failed", message: err.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ GMB Finder backend running on http://localhost:${PORT}`));
