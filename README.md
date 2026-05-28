# 📍 Unclaimed GMB Finder

Ek Local SEO tool jo sirf **unclaimed / unmanaged Google Business Profiles** dhundta hai.

---

## 📁 Project Structure

```
gmb-finder/
├── backend/          ← Node.js API server (Google Places proxy)
│   ├── server.js
│   ├── package.json
│   └── .env.example  ← Rename to .env and add your API key
│
├── frontend/         ← React app (UI)
│   ├── src/App.js
│   ├── src/index.js
│   ├── public/index.html
│   └── package.json
│
└── README.md
```

---

## 🚀 Setup (Step by Step)

### Step 1 — Google Places API Key lein

1. https://console.cloud.google.com pe jayein
2. Naya project banayein ya existing select karein
3. **APIs & Services → Library** mein jayein
4. "**Places API**" search karein aur **Enable** karein
5. **APIs & Services → Credentials → Create Credentials → API Key**
6. API key copy kar lein

> 💡 Billing enable karni hogi (free $200 credit milta hai Google se monthly)

---

### Step 2 — Backend Setup

```bash
# Folder mein jayein
cd backend

# .env file banayein
cp .env.example .env

# .env file open karein aur apni API key daalein:
# GOOGLE_PLACES_API_KEY=AIzaSy...YOUR_KEY_HERE

# Dependencies install karein
npm install

# Server start karein
npm start
```

✅ Backend `http://localhost:4000` pe chal raha hoga

---

### Step 3 — Frontend Setup

```bash
# Naya terminal open karein
cd frontend

# Dependencies install karein
npm install

# App start karein
npm start
```

✅ Browser mein `http://localhost:3000` khul jayega

---

## 🔍 Kaise Use Karein

1. **Search page** pe City, Country, aur Industry daalein
   - Example: "Dentist" — "Miami" — "USA"
2. **Scan** button dabayein
3. Sirf unclaimed / unmanaged profiles show hongi
4. Har lead pe:
   - **Open Maps** → Google Maps pe verify karein
   - **AI Outreach** → AI se personalized message generate karein
   - **Save** → Leads save karein
   - **Export CSV** → Excel mein export karein

---

## 📊 Confidence Score Kya Hai?

| Score | Matlab |
|-------|--------|
| 70–100% | **Likely Unclaimed** — Strong signals milein |
| 40–69%  | **Possibly Unclaimed** — Kuch signals missing |
| Below 40% | Show nahi hota |

**Signals jo detect hote hain:**
- 🌐 No website
- 📞 No phone number
- 🕐 No business hours
- 📝 No business description
- ⭐ 5 se kam reviews
- 🖼️ No photos

---

## ☁️ Online Deploy Karna (Optional)

### Backend → Railway.app (Free)
1. https://railway.app pe account banayein
2. "New Project → Deploy from GitHub" select karein
3. `backend` folder upload karein
4. Environment variable mein `GOOGLE_PLACES_API_KEY` add karein
5. Deploy ho jayega — URL copy kar lein

### Frontend → Vercel (Free)
1. https://vercel.com pe account banayein
2. `frontend` folder upload karein
3. `package.json` mein `proxy` ko Railway URL se change karein:
   ```json
   "proxy": "https://your-railway-url.railway.app"
   ```
4. Deploy karein

---

## ⚠️ Important Notes

- Yeh tool **Google Places API** se real data fetch karta hai
- "Claimed/Unclaimed" status Google publicly expose nahi karta — signals se **estimate** hota hai
- Har search pe Google API charges lagte hain (~$0.017 per place detail)
- Outreach se pehle Google Maps pe manually **verify** zaroor karein

---

## 🛠️ Tech Stack

| Part | Technology |
|------|-----------|
| Frontend | React, CSS-in-JS |
| Backend | Node.js, Express |
| Data | Google Places API |
| AI Outreach | Claude AI (Anthropic) |
| Export | CSV |
