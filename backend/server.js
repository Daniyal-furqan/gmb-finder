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
  "alabama": ["Birmingham","Montgomery","Huntsville","Mobile","Tuscaloosa","Hoover","Dothan","Auburn","Decatur","Madison"],
  "alaska": ["Anchorage","Fairbanks","Juneau","Sitka","Ketchikan","Wasilla","Kenai","Kodiak","Bethel","Palmer"],
  "arizona": ["Phoenix","Tucson","Mesa","Chandler","Scottsdale","Glendale","Gilbert","Tempe","Peoria","Surprise"],
  "arkansas": ["Little Rock","Fort Smith","Fayetteville","Springdale","Jonesboro","North Little Rock","Conway","Rogers","Bentonville","Pine Bluff"],
  "california": ["Los Angeles","San Diego","San Jose","San Francisco","Fresno","Sacramento","Long Beach","Oakland","Bakersfield","Anaheim","Santa Ana","Riverside","Stockton","Irvine","Chula Vista","Fremont","San Bernardino","Modesto","Fontana","Moreno Valley"],
  "colorado": ["Denver","Colorado Springs","Aurora","Fort Collins","Lakewood","Thornton","Arvada","Westminster","Pueblo","Centennial"],
  "connecticut": ["Bridgeport","New Haven","Stamford","Hartford","Waterbury","Norwalk","Danbury","New Britain","West Hartford","Greenwich"],
  "delaware": ["Wilmington","Dover","Newark","Middletown","Smyrna","Milford","Seaford","Georgetown","Elsmere","New Castle"],
  "florida": ["Jacksonville","Miami","Tampa","Orlando","St. Petersburg","Hialeah","Port St. Lucie","Cape Coral","Tallahassee","Fort Lauderdale","Pembroke Pines","Hollywood","Gainesville","Miramar","Coral Springs","Clearwater","Palm Bay","Lakeland","West Palm Beach","Pompano Beach"],
  "georgia": ["Atlanta","Columbus","Augusta","Macon","Savannah","Athens","Sandy Springs","Roswell","Johns Creek","Albany"],
  "hawaii": ["Honolulu","East Honolulu","Pearl City","Hilo","Kailua","Waipahu","Kaneohe","Mililani Town","Kahului","Ewa Gentry"],
  "idaho": ["Boise","Nampa","Meridian","Idaho Falls","Pocatello","Caldwell","Coeur d'Alene","Twin Falls","Lewiston","Post Falls"],
  "illinois": ["Chicago","Aurora","Joliet","Naperville","Rockford","Springfield","Elgin","Peoria","Champaign","Waukegan"],
  "indiana": ["Indianapolis","Fort Wayne","Evansville","South Bend","Carmel","Fishers","Bloomington","Hammond","Gary","Lafayette"],
  "iowa": ["Des Moines","Cedar Rapids","Davenport","Sioux City","Iowa City","Waterloo","Council Bluffs","Ames","West Des Moines","Dubuque"],
  "kansas": ["Wichita","Overland Park","Kansas City","Olathe","Topeka","Lawrence","Shawnee","Manhattan","Lenexa","Salina"],
  "kentucky": ["Louisville","Lexington","Bowling Green","Owensboro","Covington","Hopkinsville","Richmond","Florence","Georgetown","Henderson"],
  "louisiana": ["New Orleans","Baton Rouge","Shreveport","Metairie","Lafayette","Lake Charles","Kenner","Bossier City","Monroe","Alexandria"],
  "maine": ["Portland","Lewiston","Bangor","South Portland","Auburn","Biddeford","Sanford","Saco","Westbrook","Augusta"],
  "maryland": ["Baltimore","Columbia","Germantown","Silver Spring","Waldorf","Glen Burnie","Frederick","Ellicott City","Dundalk","Rockville"],
  "massachusetts": ["Boston","Worcester","Springfield","Lowell","Cambridge","New Bedford","Brockton","Quincy","Lynn","Fall River"],
  "michigan": ["Detroit","Grand Rapids","Warren","Sterling Heights","Ann Arbor","Lansing","Flint","Dearborn","Livonia","Westland"],
  "minnesota": ["Minneapolis","Saint Paul","Rochester","Duluth","Bloomington","Brooklyn Park","Plymouth","Saint Cloud","Eagan","Woodbury"],
  "mississippi": ["Jackson","Gulfport","Southaven","Hattiesburg","Biloxi","Meridian","Tupelo","Greenville","Olive Branch","Horn Lake"],
  "missouri": ["Kansas City","Saint Louis","Springfield","Independence","Columbia","Lee's Summit","O'Fallon","St. Joseph","St. Charles","Blue Springs"],
  "montana": ["Billings","Missoula","Great Falls","Bozeman","Butte","Helena","Kalispell","Havre","Anaconda","Miles City"],
  "nebraska": ["Omaha","Lincoln","Bellevue","Grand Island","Kearney","Fremont","Hastings","Norfolk","North Platte","Columbus"],
  "nevada": ["Las Vegas","Henderson","Reno","North Las Vegas","Sparks","Carson City","Fernley","Elko","Mesquite","Boulder City"],
  "new hampshire": ["Manchester","Nashua","Concord","Derry","Dover","Rochester","Salem","Merrimack","Hudson","Londonderry"],
  "new jersey": ["Newark","Jersey City","Paterson","Elizabeth","Edison","Woodbridge","Lakewood","Toms River","Hamilton","Trenton"],
  "new mexico": ["Albuquerque","Las Cruces","Rio Rancho","Santa Fe","Roswell","Farmington","Clovis","Hobbs","Alamogordo","Carlsbad"],
  "new york": ["New York City","Buffalo","Rochester","Yonkers","Syracuse","Albany","New Rochelle","Mount Vernon","Schenectady","Utica"],
  "north carolina": ["Charlotte","Raleigh","Greensboro","Durham","Winston-Salem","Fayetteville","Cary","Wilmington","High Point","Concord"],
  "north dakota": ["Fargo","Bismarck","Grand Forks","Minot","West Fargo","Williston","Dickinson","Mandan","Jamestown","Wahpeton"],
  "ohio": ["Columbus","Cleveland","Cincinnati","Toledo","Akron","Dayton","Parma","Canton","Youngstown","Lorain"],
  "oklahoma": ["Oklahoma City","Tulsa","Norman","Broken Arrow","Lawton","Edmond","Moore","Midwest City","Enid","Stillwater"],
  "oregon": ["Portland","Salem","Eugene","Gresham","Hillsboro","Beaverton","Bend","Medford","Springfield","Corvallis"],
  "pennsylvania": ["Philadelphia","Pittsburgh","Allentown","Erie","Reading","Scranton","Bethlehem","Lancaster","Harrisburg","Altoona"],
  "rhode island": ["Providence","Cranston","Warwick","Pawtucket","East Providence","Woonsocket","Coventry","Cumberland","North Providence","West Warwick"],
  "south carolina": ["Columbia","Charleston","North Charleston","Mount Pleasant","Rock Hill","Greenville","Summerville","Sumter","Goose Creek","Hilton Head Island"],
  "south dakota": ["Sioux Falls","Rapid City","Aberdeen","Brookings","Watertown","Mitchell","Yankton","Pierre","Huron","Spearfish"],
  "tennessee": ["Memphis","Nashville","Knoxville","Chattanooga","Clarksville","Murfreesboro","Franklin","Jackson","Johnson City","Bartlett"],
  "texas": ["Houston","San Antonio","Dallas","Austin","Fort Worth","El Paso","Arlington","Corpus Christi","Plano","Laredo","Lubbock","Garland","Irving","Amarillo","Grand Prairie","McKinney","Frisco","Brownsville","Pasadena","Mesquite"],
  "utah": ["Salt Lake City","West Valley City","Provo","West Jordan","Orem","Sandy","Ogden","St. George","Layton","Millcreek"],
  "vermont": ["Burlington","South Burlington","Rutland","Barre","Montpelier","Winooski","St. Albans","Newport","Vergennes","Middlebury"],
  "virginia": ["Virginia Beach","Norfolk","Chesapeake","Richmond","Newport News","Alexandria","Hampton","Roanoke","Portsmouth","Suffolk"],
  "washington": ["Seattle","Spokane","Tacoma","Vancouver","Bellevue","Kent","Everett","Renton","Spokane Valley","Kirkland"],
  "west virginia": ["Charleston","Huntington","Morgantown","Parkersburg","Wheeling","Weirton","Fairmont","Martinsburg","Beckley","Clarksburg"],
  "wisconsin": ["Milwaukee","Madison","Green Bay","Kenosha","Racine","Appleton","Waukesha","Oshkosh","Eau Claire","Janesville"],
  "wyoming": ["Cheyenne","Casper","Laramie","Gillette","Rock Springs","Sheridan","Green River","Evanston","Riverton","Jackson"],
  "england": ["London","Birmingham","Manchester","Leeds","Liverpool","Sheffield","Bristol","Newcastle","Nottingham","Leicester","Southampton","Coventry","Bradford","Stoke-on-Trent","Derby","Plymouth","Reading","Wolverhampton","Sunderland","Exeter"],
  "scotland": ["Glasgow","Edinburgh","Aberdeen","Dundee","Inverness","Perth","Stirling","Paisley","East Kilbride","Livingston"],
  "wales": ["Cardiff","Swansea","Newport","Bangor","St Davids","Wrexham","Barry","Neath","Llanelli","Caerphilly"],
  "northern ireland": ["Belfast","Derry","Armagh","Lisburn","Newry","Omagh","Enniskillen","Coleraine","Ballymena","Bangor"],
  "ontario": ["Toronto","Ottawa","Mississauga","Brampton","Hamilton","London","Markham","Vaughan","Kitchener","Windsor"],
  "quebec": ["Montreal","Quebec City","Laval","Gatineau","Longueuil","Sherbrooke","Saguenay","Levis","Trois-Rivieres","Terrebonne"],
  "british columbia": ["Vancouver","Surrey","Burnaby","Richmond","Kelowna","Abbotsford","Coquitlam","Langley","Saanich","Delta"],
  "alberta": ["Calgary","Edmonton","Red Deer","Lethbridge","St. Albert","Medicine Hat","Grande Prairie","Airdrie","Spruce Grove","Leduc"],
  "new south wales": ["Sydney","Newcastle","Wollongong","Maitland","Cessnock","Broken Hill","Wagga Wagga","Albury","Tamworth","Orange"],
  "victoria": ["Melbourne","Geelong","Ballarat","Bendigo","Shepparton","Melton","Mildura","Wodonga","Warrnambool","Sunbury"],
  "queensland": ["Brisbane","Gold Coast","Sunshine Coast","Townsville","Cairns","Toowoomba","Mackay","Rockhampton","Bundaberg","Hervey Bay"],
  "western australia": ["Perth","Mandurah","Bunbury","Rockingham","Joondalup","Fremantle","Armadale","Kalgoorlie","Albany","Geraldton"],
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

  const weights = {
    no_website: 20, no_phone: 20, no_hours: 18,
    no_editorial_summary: 15, low_reviews: 12, no_photos: 10,
  };
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
      timeout: 10000,
    });
    if (searchRes.data.status !== "OK") return [];

    const places = searchRes.data.results.slice(0, 20);
    const detailed = await Promise.all(
      places.map(async (place) => {
        try {
          const detailRes = await axios.get(`${PLACES_BASE}/details/json`, {
            params: {
              place_id: place.place_id,
              fields: ["name","formatted_address","formatted_phone_number","international_phone_number","website","opening_hours","editorial_summary","photos","rating","user_ratings_total","types","url"].join(","),
              key: GOOGLE_KEY,
            },
            timeout: 8000,
          });
          return detailRes.data.status === "OK"
            ? { ...place, ...detailRes.data.result }
            : place;
        } catch { return place; }
      })
    );

    return detailed
      .map((p) => analyzePlace(p, industry))
      .filter((b) => b.confidence >= 30);
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
      return res.status(400).json({
        error: searchRes.data.status,
        message: searchRes.data.error_message,
      });
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
      .filter((b) => b.confidence >= 30)
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
      availableStates: Object.keys(STATE_CITIES),
    });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  send({ type: "start", totalCities: cities.length, state, industry });

  const allResults = [];
  const seenIds = new Set();
  const BATCH = 3;

  for (let i = 0; i < cities.length; i += BATCH) {
    const batch = cities.slice(i, i + BATCH);
    const batchResults = await Promise.all(
      batch.map((city) => searchOneCity(industry, city, country))
    );

    batchResults.forEach((cityResults, idx) => {
      const city = batch[idx];
      let newCount = 0;
      cityResults.forEach((biz) => {
        if (!seenIds.has(biz.id)) {
          seenIds.add(biz.id);
          allResults.push(biz);
          newCount++;
        }
      });
      send({
        type: "cityDone",
        city,
        found: newCount,
        totalSoFar: allResults.length,
        citiesScanned: i + idx + 1,
        totalCities: cities.length,
      });
    });

    if (i + BATCH < cities.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  const sorted = allResults.sort((a, b) => b.confidence - a.confidence);
  send({
    type: "complete",
    results: sorted,
    total: sorted.length,
    likely: sorted.filter((b) => b.confidence >= 70).length,
    possible: sorted.filter((b) => b.confidence >= 40 && b.confidence < 70).length,
  });

  res.end();
});

app.get("/api/states", (req, res) => {
  res.json({
    states: Object.keys(STATE_CITIES).map(
      (s) => s.charAt(0).toUpperCase() + s.slice(1)
    ),
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`GMB Finder backend running on http://localhost:${PORT}`)
);
