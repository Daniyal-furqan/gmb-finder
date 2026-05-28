const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const GOOGLE_KEY = process.env.GOOGLE_PLACES_API_KEY;
const PLACES_BASE = "https://maps.googleapis.com/maps/api/place";

const STATE_CITIES = {
  "alabama": ["Birmingham","Montgomery","Huntsville","Mobile","Tuscaloosa"],
  "alaska": ["Anchorage","Fairbanks","Juneau","Sitka","Ketchikan"],
  "arizona": ["Phoenix","Tucson","Mesa","Chandler","Scottsdale"],
  "arkansas": ["Little Rock","Fort Smith","Fayetteville","Springdale","Jonesboro"],
  "california": ["Los Angeles","San Diego","San Jose","San Francisco","Fresno"],
  "colorado": ["Denver","Colorado Springs","Aurora","Fort Collins","Lakewood"],
  "connecticut": ["Bridgeport","New Haven","Stamford","Hartford","Waterbury"],
  "delaware": ["Wilmington","Dover","Newark","Middletown","Smyrna"],
  "florida": ["Jacksonville","Miami","Tampa","Orlando","St. Petersburg"],
  "georgia": ["Atlanta","Columbus","Augusta","Macon","Savannah"],
  "hawaii": ["Honolulu","Pearl City","Hilo","Kailua","Waipahu"],
  "idaho": ["Boise","Nampa","Meridian","Idaho Falls","Pocatello"],
  "illinois": ["Chicago","Aurora","Joliet","Naperville","Rockford"],
  "indiana": ["Indianapolis","Fort Wayne","Evansville","South Bend","Carmel"],
  "iowa": ["Des Moines","Cedar Rapids","Davenport","Sioux City","Iowa City"],
  "kansas": ["Wichita","Overland Park","Kansas City","Olathe","Topeka"],
  "kentucky": ["Louisville","Lexington","Bowling Green","Owensboro","Covington"],
  "louisiana": ["New Orleans","Baton Rouge","Shreveport","Metairie","Lafayette"],
  "maine": ["Portland","Lewiston","Bangor","South Portland","Auburn"],
  "maryland": ["Baltimore","Columbia","Germantown","Silver Spring","Waldorf"],
  "massachusetts": ["Boston","Worcester","Springfield","Lowell","Cambridge"],
  "michigan": ["Detroit","Grand Rapids","Warren","Sterling Heights","Ann Arbor"],
  "minnesota": ["Minneapolis","Saint Paul","Rochester","Duluth","Bloomington"],
  "mississippi": ["Jackson","Gulfport","Southaven","Hattiesburg","Biloxi"],
  "missouri": ["Kansas City","Saint Louis","Springfield","Independence","Columbia"],
  "montana": ["Billings","Missoula","Great Falls","Bozeman","Butte"],
  "nebraska": ["Omaha","Lincoln","Bellevue","Grand Island","Kearney"],
  "nevada": ["Las Vegas","Henderson","Reno","North Las Vegas","Sparks"],
  "new hampshire": ["Manchester","Nashua","Concord","Derry","Dover"],
  "new jersey": ["Newark","Jersey City","Paterson","Elizabeth","Edison"],
  "new mexico": ["Albuquerque","Las Cruces","Rio Rancho","Santa Fe","Roswell"],
  "new york": ["New York City","Buffalo","Rochester","Yonkers","Syracuse"],
  "north carolina": ["Charlotte","Raleigh","Greensboro","Durham","Winston-Salem"],
  "north dakota": ["Fargo","Bismarck","Grand Forks","Minot","West Fargo"],
  "ohio": ["Columbus","Cleveland","Cincinnati","Toledo","Akron"],
  "oklahoma": ["Oklahoma City","Tulsa","Norman","Broken Arrow","Lawton"],
  "oregon": ["Portland","Salem","Eugene","Gresham","Hillsboro"],
  "pennsylvania": ["Philadelphia","Pittsburgh","Allentown","Erie","Reading"],
  "rhode island": ["Providence","Cranston","Warwick","Pawtucket","East Providence"],
  "south carolina": ["Columbia","Charleston","North Charleston","Mount Pleasant","Rock Hill"],
  "south dakota": ["Sioux Falls","Rapid City","Aberdeen","Brookings","Watertown"],
  "tennessee": ["Memphis","Nashville","Knoxville","Chattanooga","Clarksville"],
  "texas": ["Houston","San Antonio","Dallas","Austin","Fort Worth"],
  "utah": ["Salt Lake City","West Valley City","Provo","West Jordan","Orem"],
  "vermont": ["Burlington","South Burlington","Rutland","Barre","Montpelier"],
  "virginia": ["Virginia Beach","Norfolk","Chesapeake","Richmond","Newport News"],
  "washington": ["Seattle","Spokane","Tacoma","Vancouver","Bellevue"],
  "west virginia": ["Charleston","Huntington","Morgantown","Parkersburg","Wheeling"],
  "wisconsin": ["Milwaukee","Madison","Green Bay","Kenosha","Racine"],
  "wyoming": ["Cheyenne","Casper","Laramie","Gillette","Rock Springs"],
  "england": ["London","Birmingham","Manchester","Leeds","Liverpool"],
  "scotland": ["Glasgow","Edinburgh","Aberdeen","Dundee","Inverness"],
  "wales": ["Cardiff","Swansea","Newport","Wrexham","Barry"],
  "northern ireland": ["Belfast","Derry","Lisburn","Newry","Armagh"],
  "ontario": ["Toronto","Ottawa","Mississauga","Brampton","Hamilton"],
  "quebec": ["Montreal","Quebec City","Laval","Gatineau","Longueuil"],
  "british columbia": ["Vancouver","Surrey","Burnaby","Richmond","Kelowna"],
  "alberta": ["Calgary","Edmonton","Red Deer","Lethbridge","St. Albert"],
  "new south wales": ["Sydney","Newcastle","Wollongong","Maitland","Wagga Wagga"],
  "victoria": ["Melbourne","Geelong","Ballarat","Bendigo","Shepparton"],
  "queensland": ["Brisbane","Gold Coast","Sunshine Coast","Townsville","Cairns"],
  "western australia": ["Perth","Mandurah","Bunbury","Rockingham","Joondalup"],
};

function normalizeState(input) {
  return input.toLowerCase().trim().replace(/\s+/g, " ");
}

function analyzePlace(p, industry) {
  const signals = [];
  if (!p.website) signals.push("no_website");
  if (!p.formatted_phone_number && !p.international_phone_number) signals.push("no_phone");
  if (!p.opening_hours) signals.push("no_hours");
  if (!p.editorial_summary?.overview) signals.push("no_editorial_summary");
  if ((p.user_ratings_total || 0) < 5) signals.push("low_reviews");
  if (!p.photos || p.photos.length === 0) signals.push("no_photos");

  const weights = { no_website: 20, no_phone: 20, no_hours: 18, no_editorial_summary: 15, low_reviews: 12, no_photos: 10 };
  const confidence = Math.min(100, signals.reduce((s, k) => s + (weights[k] || 0), 0));

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
}

async function searchOneCity(industry, city, country) {
  const query = `${industry} in ${city} ${country}`.trim();
  try {
    const searchRes = await axios.get(`${PLACES_BASE}/textsearch/json`, {
      params: { query, key: GOOGLE_KEY },
      timeout: 8000,
    });
    if (searchRes.data.status !== "OK") return [];

    const places = searchRes.data.results.slice(0, 20);
    const detailed = await Promise.all(
      places.map(async (place) => {
        try {
          const d = await axios.get(`${PLACES_BASE}/details/json`, {
            params: {
              place_id: place.place_id,
              fields: ["name","formatted_address","formatted_phone_number","international_phone_number","website","opening_hours","editorial_summary","photos","rating","user_ratings_total","types","url"].join(","),
              key: GOOGLE_KEY,
            },
            timeout: 6000,
          });
          return d.data.status === "OK" ? { ...place, ...d.data.result } : place;
        } catch { return place; }
      })
    );

    return detailed.map((p) => analyzePlace(p, industry)).filter((b) => b.confidence >= 20);
  } catch { return []; }
}

app.get("/", (req, res) => res.json({ status: "ok", message: "GMB Finder API running" }));

app.get("/api/search", async (req, res) => {
  const { industry, city, country = "", maxResults = 20 } = req.query;
  if (!industry || !city) return res.status(400).json({ error: "industry and city required" });
  if (!GOOGLE_KEY) return res.status(500).json({ error: "GOOGLE_PLACES_API_KEY not set" });

  try {
    const query = `${industry} in ${city} ${country}`.trim();
    const searchRes = await axios.get(`${PLACES_BASE}/textsearch/json`, {
      params: { query, key: GOOGLE_KEY },
    });

    if (searchRes.data.status !== "OK") {
      return res.status(400).json({ error: searchRes.data.status, message: searchRes.data.error_message });
    }

    const places = searchRes.data.results.slice(0, parseInt(maxResults));
    const detailed = await Promise.all(
      places.map(async (place) => {
        try {
          const d = await axios.get(`${PLACES_BASE}/details/json`, {
            params: {
              place_id: place.place_id,
              fields: ["name","formatted_address","formatted_phone_number","international_phone_number","website","opening_hours","editorial_summary","photos","rating","user_ratings_total","types","url"].join(","),
              key: GOOGLE_KEY,
            },
          });
          return d.data.status === "OK" ? { ...place, ...d.data.result } : place;
        } catch { return place; }
      })
    );

    const results = detailed
      .map((p) => analyzePlace(p, industry))
      .filter((b) => b.confidence >= 20)
      .sort((a, b) => b.confidence - a.confidence);

    res.json({ results, total: results.length });
  } catch (err) {
    res.status(500).json({ error: "Search failed", message: err.message });
  }
});

app.get("/api/search-state", async (req, res) => {
  const { industry, state, country = "USA" } = req.query;
  if (!industry || !state) return res.status(400).json({ error: "industry and state required" });
  if (!GOOGLE_KEY) return res.status(500).json({ error: "GOOGLE_PLACES_API_KEY not set" });

  const normalized = normalizeState(state);
  const cities = STATE_CITIES[normalized];

  if (!cities) {
    return res.status(400).json({
      error: "State not found",
      message: `"${state}" nahi mili. Likhen: Florida, Texas, California, England etc.`,
    });
  }

  const citiesToScan = cities.slice(0, 5);
  const allResults = [];
  const seenIds = new Set();

  for (let i = 0; i < citiesToScan.length; i += 2) {
    const batch = citiesToScan.slice(i, i + 2);
    const batchResults = await Promise.all(
      batch.map((city) => searchOneCity(industry, city, country))
    );
    batchResults.forEach((cityResults) => {
      cityResults.forEach((biz) => {
        if (!seenIds.has(biz.id)) {
          seenIds.add(biz.id);
          allResults.push(biz);
        }
      });
    });
  }

  const sorted = allResults.sort((a, b) => b.confidence - a.confidence);

  res.json({
    results: sorted,
    total: sorted.length,
    citiesScanned: citiesToScan.length,
    totalCities: cities.length,
    likely: sorted.filter((b) => b.confidence >= 70).length,
    possible: sorted.filter((b) => b.confidence >= 40 && b.confidence < 70).length,
  });
});

app.get("/api/states", (req, res) => {
  res.json({ states: Object.keys(STATE_CITIES).map((s) => s.charAt(0).toUpperCase() + s.slice(1)) });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`GMB Finder backend running on http://localhost:${PORT}`));
