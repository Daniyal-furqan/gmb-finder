import { useState } from "react";

// ─── Constants ─────────────────────────────────────────────────────────────
const SIGNAL_LABELS = {
  no_website:           "No website listed",
  no_phone:             "No phone number",
  no_hours:             "Missing business hours",
  no_editorial_summary: "No business description",
  low_reviews:          "Very few reviews (under 5)",
  no_photos:            "No photos on profile",
};
const SIGNAL_ICONS = {
  no_website: "🌐", no_phone: "📞", no_hours: "🕐",
  no_editorial_summary: "📝", low_reviews: "⭐", no_photos: "🖼️",
};

// ─── API Call ───────────────────────────────────────────────────────────────
async function fetchLeads(query) {
  const params = new URLSearchParams({
    industry:   query.industry,
    city:       query.city,
    country:    query.country,
    maxResults: query.maxResults,
  });
  const res = await fetch(`/api/search?${params}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.error || "Search failed");
  return data.results;
}

// ─── AI Outreach via Claude ─────────────────────────────────────────────────
async function generateOutreach(biz) {
  const missing = biz.signals.map((s) => SIGNAL_LABELS[s]).join(", ");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      messages: [{
        role: "user",
        content: `Write a short friendly cold outreach message (3-4 sentences) for a Local SEO agency contacting the owner of "${biz.name}" (${biz.category}) at "${biz.address}". Their Google Business Profile is missing: ${missing}. Mention specific missing items. Soft call-to-action at end. Return message text only.`,
      }],
    }),
  });
  const data = await res.json();
  return data.content?.find((b) => b.type === "text")?.text || "";
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const S = {
  inp: {
    width: "100%", border: "1.5px solid #D8E8F4", borderRadius: 10,
    padding: "10px 14px", fontSize: 14, color: "#1F2937",
    background: "#F8FBFF", fontFamily: "inherit", boxSizing: "border-box",
    outline: "none",
  },
  btn: (active) => ({
    background: active ? "#0091D1" : "#F3F4F6",
    color: active ? "#fff" : "#6B7280",
    border: "none", borderRadius: 8, padding: "7px 14px",
    fontSize: 12, fontWeight: 700, cursor: "pointer",
  }),
  card: {
    background: "#fff", borderRadius: 14,
    border: "1.5px solid #E5EDF5",
    boxShadow: "0 2px 12px rgba(0,80,140,0.05)",
    marginBottom: 12, overflow: "hidden",
  },
};

// ─── Components ─────────────────────────────────────────────────────────────
function Badge({ score }) {
  const ok = score >= 70;
  return (
    <span style={{
      background: ok ? "#E6F4EA" : "#FFF8E6",
      color:      ok ? "#1B7A3E" : "#92610A",
      border:     `1px solid ${ok ? "#A8D5B5" : "#F5D78A"}`,
      borderRadius: 20, padding: "3px 11px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
    }}>
      {score}% — {ok ? "Likely Unclaimed" : "Possibly Unclaimed"}
    </span>
  );
}

function Stars({ r }) {
  return (
    <span style={{ display: "flex", gap: 2, alignItems: "center" }}>
      {[1,2,3,4,5].map((i) => (
        <svg key={i} width="11" height="11" viewBox="0 0 24 24"
          fill={i <= Math.round(r || 0) ? "#FBBF24" : "#E5E7EB"}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
      <span style={{ fontSize: 12, color: "#6B7280", marginLeft: 3 }}>
        {(r || 0).toFixed(1)}
      </span>
    </span>
  );
}

function OutreachModal({ biz, onClose }) {
  const [msg, setMsg]       = useState("");
  const [busy, setBusy]     = useState(false);
  const [done, setDone]     = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setBusy(true); setDone(false);
    try { setMsg(await generateOutreach(biz)); }
    catch { setMsg(`Hi, I noticed "${biz.name}"'s Google Business Profile appears to be missing ${biz.signals.length > 0 ? biz.signals.slice(0,2).map(s=>SIGNAL_LABELS[s]).join(" and ") : "key information"}. Claiming and completing your profile can greatly improve your visibility on Google Maps and bring in more customers. I'd love to help — would you be open to a quick call?`); }
    setBusy(false); setDone(true);
  };

  useState(() => { generate(); }, []);

  const copy = () => { navigator.clipboard.writeText(msg); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.32)", zIndex:999, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background:"#fff", borderRadius:16, padding:28, width:500, maxWidth:"92vw", boxShadow:"0 20px 60px rgba(0,80,140,0.18)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}>
          <div>
            <div style={{ fontSize:10, fontWeight:800, color:"#0091D1", letterSpacing:1, textTransform:"uppercase" }}>✨ AI Outreach Message</div>
            <div style={{ fontSize:17, fontWeight:800, color:"#1F2937", marginTop:3 }}>{biz.name}</div>
            <div style={{ fontSize:12, color:"#9CA3AF", marginTop:2 }}>{biz.address}</div>
          </div>
          <button onClick={onClose} style={{ background:"#F3F4F6", border:"none", borderRadius:8, padding:"5px 10px", cursor:"pointer", color:"#6B7280", fontSize:16 }}>✕</button>
        </div>

        {busy ? (
          <div style={{ textAlign:"center", padding:"36px 0" }}>
            <div style={{ width:30, height:30, border:"3px solid #E8F4F8", borderTop:"3px solid #0091D1", borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 10px" }} />
            <div style={{ color:"#9CA3AF", fontSize:13 }}>Generating personalized message…</div>
          </div>
        ) : (
          <>
            <textarea value={msg} onChange={(e) => setMsg(e.target.value)}
              style={{ ...S.inp, minHeight:130, resize:"vertical" }} />
            <div style={{ display:"flex", gap:8, marginTop:12 }}>
              <button onClick={copy} style={{ flex:1, background: copied ? "#1B7A3E" : "#0091D1", color:"#fff", border:"none", borderRadius:8, padding:"10px 0", fontWeight:700, fontSize:13, cursor:"pointer" }}>
                {copied ? "✓ Copied!" : "📋 Copy Message"}
              </button>
              <button onClick={generate} style={{ background:"#E8F4F8", color:"#0091D1", border:"1px solid #D1E8F5", borderRadius:8, padding:"10px 16px", fontWeight:700, fontSize:13, cursor:"pointer" }}>
                ↺ Redo
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function LeadCard({ biz, saved, contacted, note, onSave, onContact, onOutreach, onNote }) {
  const [expanded, setExpanded]   = useState(false);
  const [editNote, setEditNote]   = useState(false);
  const [localNote, setLocalNote] = useState(note || "");

  return (
    <div style={S.card}>
      <div style={{ padding:"18px 22px" }}>
        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8, alignItems:"center" }}>
              <span style={{ fontSize:16, fontWeight:800, color:"#1F2937" }}>{biz.name}</span>
              <span style={{ background:"#E8F4F8", color:"#0091D1", borderRadius:6, padding:"2px 8px", fontSize:11, fontWeight:700, textTransform:"capitalize" }}>
                {biz.category}
              </span>
              {contacted && (
                <span style={{ background:"#E6F4EA", color:"#1B7A3E", borderRadius:6, padding:"2px 8px", fontSize:11, fontWeight:700 }}>
                  ✓ Contacted
                </span>
              )}
            </div>
            <div style={{ color:"#6B7280", fontSize:13, marginTop:5 }}>📍 {biz.address}</div>
            <div style={{ marginTop:6, display:"flex", alignItems:"center", gap:8 }}>
              <Stars r={biz.rating} />
              <span style={{ fontSize:12, color:"#9CA3AF" }}>({biz.reviewCount} reviews)</span>
            </div>
          </div>
          <Badge score={biz.confidence} />
        </div>

        {/* Info row */}
        <div style={{ display:"flex", flexWrap:"wrap", gap:16, marginTop:12 }}>
          {biz.phone
            ? <span style={{ fontSize:13, color:"#374151", display:"flex", gap:5, alignItems:"center" }}>
                📞 {biz.phone}
                <button onClick={() => navigator.clipboard.writeText(biz.phone)}
                  style={{ background:"none", border:"none", color:"#0091D1", fontSize:11, fontWeight:700, cursor:"pointer" }}>
                  Copy
                </button>
              </span>
            : <span style={{ fontSize:13, color:"#EF4444" }}>📞 No phone</span>
          }
          {biz.website
            ? <a href={biz.website} target="_blank" rel="noreferrer" style={{ fontSize:13, color:"#0091D1" }}>🌐 Website</a>
            : <span style={{ fontSize:13, color:"#EF4444" }}>🌐 No website</span>
          }
          {biz.hasHours
            ? <span style={{ fontSize:13, color:"#374151" }}>🕐 Hours listed</span>
            : <span style={{ fontSize:13, color:"#EF4444" }}>🕐 No hours</span>
          }
        </div>

        {/* Signal chips */}
        <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:10 }}>
          {biz.signals.map((s) => (
            <span key={s} style={{ background:"#FFF5F5", border:"1px solid #FED7D7", color:"#C53030", borderRadius:6, padding:"2px 8px", fontSize:11, fontWeight:600 }}>
              {SIGNAL_ICONS[s]} {SIGNAL_LABELS[s]}
            </span>
          ))}
        </div>

        {/* Note */}
        {editNote ? (
          <div style={{ marginTop:10 }}>
            <textarea value={localNote} onChange={(e) => setLocalNote(e.target.value)}
              placeholder="Add a note…"
              style={{ ...S.inp, minHeight:60, resize:"vertical" }} />
            <button
              onClick={() => { onNote(biz.id, localNote); setEditNote(false); }}
              style={{ background:"#0091D1", color:"#fff", border:"none", borderRadius:6, padding:"5px 14px", fontSize:12, fontWeight:700, cursor:"pointer", marginTop:6 }}>
              Save Note
            </button>
          </div>
        ) : note ? (
          <div onClick={() => setEditNote(true)}
            style={{ marginTop:9, background:"#F8FBFF", borderRadius:8, padding:"7px 12px", fontSize:13, color:"#374151", border:"1px solid #E0EEF8", cursor:"pointer" }}>
            📝 {note}
          </div>
        ) : null}

        {/* Actions */}
        <div style={{ display:"flex", flexWrap:"wrap", gap:7, marginTop:13 }}>
          <a href={biz.mapsUrl} target="_blank" rel="noreferrer"
            style={{ ...S.btn(false), textDecoration:"none", display:"inline-block", background:"#E8F4F8", color:"#0091D1" }}>
            🗺 Open Maps
          </a>
          <button onClick={() => onSave(biz.id)} style={S.btn(saved)}>
            {saved ? "✓ Saved" : "💾 Save"}
          </button>
          <button onClick={() => onContact(biz.id)}
            style={{ ...S.btn(false), background: contacted ? "#FFF8E6" : "#F3F4F6", color: contacted ? "#92610A" : "#6B7280" }}>
            {contacted ? "✓ Contacted" : "✉ Mark Contacted"}
          </button>
          <button onClick={() => onOutreach(biz)}
            style={{ background:"#0091D1", color:"#fff", border:"none", borderRadius:8, padding:"7px 14px", fontSize:12, fontWeight:700, cursor:"pointer" }}>
            ✨ AI Outreach
          </button>
          <button onClick={() => setEditNote(true)} style={S.btn(false)}>📝 Note</button>
          <button onClick={() => setExpanded(!expanded)} style={S.btn(false)}>
            {expanded ? "▲ Less" : "▼ Details"}
          </button>
        </div>

        {/* Expanded */}
        {expanded && (
          <div style={{ marginTop:14, background:"#F8FBFF", borderRadius:10, padding:"14px 16px", border:"1px solid #E0EEF8" }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px 20px", fontSize:12 }}>
              {[["Place ID", biz.placeId],["Rating", biz.rating],["Reviews", biz.reviewCount],["Confidence",biz.confidence+"%"],["Signals Detected", biz.signals.length]].map(([k,v]) => (
                <div key={k}>
                  <span style={{ color:"#9CA3AF", fontSize:10, fontWeight:800, textTransform:"uppercase" }}>{k}</span>
                  <div style={{ color:"#374151", marginTop:2, fontFamily: k==="Place ID" ? "monospace":"inherit", wordBreak:"break-all" }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop:10, color:"#9CA3AF", fontSize:11, lineHeight:1.6 }}>
              ⚠️ Claimed status is inferred from missing profile data via Google Places API. Not a confirmed status — always verify before client outreach.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Pages ──────────────────────────────────────────────────────────────────
function SearchPage({ onSearch }) {
  const [form, setForm] = useState({ country:"USA", city:"", industry:"", maxResults:"20" });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const ready = form.city && form.industry;

  const EXAMPLES = [
    ["Dentist","Miami","USA"],["Plumber","Dallas","USA"],["Roofer","London","UK"],
    ["Restaurant","Toronto","Canada"],["Electrician","Sydney","Australia"],["HVAC","Chicago","USA"],
  ];

  return (
    <div style={{ maxWidth:680, margin:"0 auto", padding:"48px 24px" }}>
      <div style={{ textAlign:"center", marginBottom:44 }}>
        <div style={{ display:"inline-flex", background:"#E8F4F8", borderRadius:50, padding:"5px 18px", marginBottom:18 }}>
          <span style={{ fontSize:13, color:"#0091D1", fontWeight:700 }}>🔍 Real Google Places Data · AI Analysis</span>
        </div>
        <h1 style={{ fontSize:38, fontWeight:900, color:"#1F2937", lineHeight:1.15, letterSpacing:-1, margin:0 }}>
          Find Unclaimed<br />
          <span style={{ color:"#0091D1" }}>Google Business Profiles</span>
        </h1>
        <p style={{ color:"#6B7280", fontSize:15, marginTop:14, lineHeight:1.7 }}>
          Scans real Google Maps listings · Detects missing profile signals<br />
          AI scores each lead · Only unclaimed profiles shown
        </p>
      </div>

      <div style={{ background:"#fff", borderRadius:20, border:"1.5px solid #E5EDF5", boxShadow:"0 8px 40px rgba(0,80,140,0.07)", padding:28 }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
          <div>
            <label style={{ fontSize:10, fontWeight:800, color:"#9CA3AF", letterSpacing:1, textTransform:"uppercase", display:"block", marginBottom:5 }}>Country</label>
            <select value={form.country} onChange={set("country")} style={S.inp}>
              {["USA","UK","Canada","Australia","Germany","France","UAE","Pakistan","India","New Zealand"].map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize:10, fontWeight:800, color:"#9CA3AF", letterSpacing:1, textTransform:"uppercase", display:"block", marginBottom:5 }}>City *</label>
            <input value={form.city} onChange={set("city")} placeholder="e.g. Miami, London, Karachi" style={S.inp} />
          </div>
          <div>
            <label style={{ fontSize:10, fontWeight:800, color:"#9CA3AF", letterSpacing:1, textTransform:"uppercase", display:"block", marginBottom:5 }}>Business Category *</label>
            <input value={form.industry} onChange={set("industry")} placeholder="e.g. Dentist, Plumber, HVAC…" style={S.inp} />
          </div>
          <div>
            <label style={{ fontSize:10, fontWeight:800, color:"#9CA3AF", letterSpacing:1, textTransform:"uppercase", display:"block", marginBottom:5 }}>Max Results</label>
            <select value={form.maxResults} onChange={set("maxResults")} style={S.inp}>
              {["10","20","30","50"].map((n) => <option key={n}>{n}</option>)}
            </select>
          </div>
        </div>
        <button onClick={() => ready && onSearch(form)} disabled={!ready}
          style={{ width:"100%", background: ready ? "#0091D1":"#C8DDE8", color:"#fff", border:"none", borderRadius:12, padding:"15px 0", fontSize:15, fontWeight:800, cursor: ready?"pointer":"default", letterSpacing:0.2, boxShadow: ready ? "0 4px 18px rgba(0,145,209,0.3)" : "none" }}>
          🔍 Scan Unclaimed Profiles
        </button>
      </div>

      <div style={{ marginTop:24 }}>
        <div style={{ fontSize:11, color:"#9CA3AF", fontWeight:800, letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>Quick examples</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
          {EXAMPLES.map(([ind,ct,cn]) => (
            <button key={ind+ct} onClick={() => setForm(f=>({...f,industry:ind,city:ct,country:cn}))}
              style={{ background:"#F8FBFF", border:"1.5px solid #D1E8F5", borderRadius:8, padding:"5px 13px", fontSize:12, fontWeight:600, color:"#0091D1", cursor:"pointer" }}>
              {ind}s in {ct}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ResultsPage({ query, results, saved, contacted, notes, onSave, onContact, onOutreach, onNote, onBack }) {
  const [minConf, setMinConf] = useState(40);
  const [sort, setSort]       = useState("confidence");

  const filtered = [...results]
    .filter((b) => b.confidence >= minConf)
    .sort((a, b) => sort === "confidence" ? b.confidence - a.confidence : b.reviewCount - a.reviewCount);

  const exportCSV = () => {
    const H = ["Name","Address","Phone","Website","Rating","Reviews","Category","Has Hours","Place ID","Maps URL","Confidence","Signals"];
    const rows = filtered.map((b) => [b.name,b.address,b.phone||"",b.website||"",b.rating,b.reviewCount,b.category,b.hasHours?"Yes":"No",b.placeId,b.mapsUrl,b.confidence+"%",b.signals.join("; ")]);
    const csv = [H,...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    a.download = `unclaimed-${query.city}-${query.industry}.csv`;
    a.click();
  };

  const likely   = filtered.filter((b) => b.confidence >= 70).length;
  const possible = filtered.filter((b) => b.confidence >= 40 && b.confidence < 70).length;

  return (
    <div style={{ maxWidth:820, margin:"0 auto", padding:"28px 24px" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:22, flexWrap:"wrap" }}>
        <button onClick={onBack} style={{ background:"#F3F4F6", border:"none", borderRadius:8, padding:"7px 13px", cursor:"pointer", color:"#6B7280", fontSize:13, fontWeight:700 }}>← Back</button>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:20, fontWeight:800, color:"#1F2937" }}>{query.industry}s in {query.city}, {query.country}</div>
          <div style={{ color:"#6B7280", fontSize:13, marginTop:2 }}>{filtered.length} leads found</div>
        </div>
        <button onClick={exportCSV} style={{ background:"#0091D1", color:"#fff", border:"none", borderRadius:8, padding:"9px 18px", fontSize:13, fontWeight:700, cursor:"pointer" }}>
          ⬇ Export CSV
        </button>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:20 }}>
        {[
          { label:"Total Leads",       val:filtered.length, bg:"#E8F4F8", color:"#0091D1" },
          { label:"Likely Unclaimed",  val:likely,          bg:"#E6F4EA", color:"#1B7A3E" },
          { label:"Possibly Unclaimed",val:possible,        bg:"#FFF8E6", color:"#92610A" },
        ].map((s) => (
          <div key={s.label} style={{ background:s.bg, borderRadius:12, padding:"14px 18px" }}>
            <div style={{ fontSize:26, fontWeight:900, color:s.color }}>{s.val}</div>
            <div style={{ fontSize:11, color:s.color, fontWeight:700, marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:"flex", gap:10, marginBottom:18, alignItems:"center", flexWrap:"wrap" }}>
        <span style={{ fontSize:11, color:"#9CA3AF", fontWeight:800 }}>SORT:</span>
        {[["confidence","Confidence"],["reviews","Reviews"]].map(([v,l]) => (
          <button key={v} onClick={() => setSort(v)} style={S.btn(sort===v)}>{l}</button>
        ))}
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:7 }}>
          <span style={{ fontSize:11, color:"#9CA3AF", fontWeight:800 }}>MIN:</span>
          <select value={minConf} onChange={(e) => setMinConf(+e.target.value)}
            style={{ ...S.inp, width:"auto", padding:"4px 10px", fontSize:12 }}>
            <option value={40}>40%+</option>
            <option value={60}>60%+</option>
            <option value={70}>70%+</option>
            <option value={80}>80%+</option>
          </select>
        </div>
      </div>

      {filtered.length === 0
        ? <div style={{ textAlign:"center", padding:"60px 0", color:"#9CA3AF" }}>
            <div style={{ fontSize:40 }}>🔍</div>
            <div style={{ fontWeight:700, marginTop:12 }}>No leads match your filter</div>
            <div style={{ fontSize:13, marginTop:6 }}>Lower the minimum confidence to see more results</div>
          </div>
        : filtered.map((biz) => (
            <LeadCard key={biz.id} biz={biz}
              saved={saved.includes(biz.id)}
              contacted={contacted.includes(biz.id)}
              note={notes[biz.id] || ""}
              onSave={onSave} onContact={onContact}
              onOutreach={onOutreach} onNote={onNote} />
          ))
      }
    </div>
  );
}

function SavedPage({ allResults, savedIds, contacted, notes, onSave, onContact, onOutreach, onNote }) {
  const list = allResults.filter((b) => savedIds.includes(b.id));
  return (
    <div style={{ maxWidth:820, margin:"0 auto", padding:"28px 24px" }}>
      <h2 style={{ fontSize:20, fontWeight:800, color:"#1F2937", marginBottom:20 }}>
        💾 Saved Leads <span style={{ color:"#9CA3AF", fontWeight:600 }}>({list.length})</span>
      </h2>
      {list.length === 0
        ? <div style={{ textAlign:"center", padding:"60px 0", color:"#9CA3AF" }}>
            <div style={{ fontSize:40 }}>📋</div>
            <div style={{ fontWeight:700, marginTop:12 }}>No saved leads yet</div>
            <div style={{ fontSize:13, marginTop:6 }}>Search and click Save on any lead</div>
          </div>
        : list.map((biz) => (
            <LeadCard key={biz.id} biz={biz}
              saved contacted={contacted.includes(biz.id)}
              note={notes[biz.id] || ""}
              onSave={onSave} onContact={onContact}
              onOutreach={onOutreach} onNote={onNote} />
          ))
      }
    </div>
  );
}

function SetupPage() {
  return (
    <div style={{ maxWidth:600, margin:"0 auto", padding:"40px 24px" }}>
      <h2 style={{ fontSize:22, fontWeight:800, color:"#1F2937", marginBottom:6 }}>⚙️ Setup Guide</h2>
      <p style={{ color:"#6B7280", fontSize:14, marginBottom:28 }}>Follow these steps to get the tool running.</p>

      {[
        {
          step:"1", title:"Get Google Places API Key",
          content: <>Go to <a href="https://console.cloud.google.com/apis/library/places-backend.googleapis.com" target="_blank" rel="noreferrer" style={{ color:"#0091D1" }}>Google Cloud Console</a> → Enable <strong>Places API</strong> → Create credentials → Copy your API key.</>,
        },
        {
          step:"2", title:"Add API Key to Backend",
          content: <><code style={{ background:"#F3F4F6", padding:"2px 6px", borderRadius:4 }}>backend/.env.example</code> ko copy karein aur <code style={{ background:"#F3F4F6", padding:"2px 6px", borderRadius:4 }}>.env</code> banayein. API key daalein.</>,
        },
        {
          step:"3", title:"Start Backend Server",
          content: <><code style={{ background:"#1F2937", color:"#A8D5B5", padding:"6px 12px", borderRadius:6, display:"block", marginTop:6, fontFamily:"monospace", fontSize:13 }}>cd backend && npm install && npm start</code></>,
        },
        {
          step:"4", title:"Start Frontend",
          content: <><code style={{ background:"#1F2937", color:"#A8D5B5", padding:"6px 12px", borderRadius:6, display:"block", marginTop:6, fontFamily:"monospace", fontSize:13 }}>cd frontend && npm install && npm start</code></>,
        },
      ].map((item) => (
        <div key={item.step} style={{ display:"flex", gap:16, marginBottom:22 }}>
          <div style={{ width:32, height:32, background:"#0091D1", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:900, fontSize:14, flexShrink:0 }}>{item.step}</div>
          <div>
            <div style={{ fontWeight:700, color:"#1F2937", fontSize:15 }}>{item.title}</div>
            <div style={{ color:"#6B7280", fontSize:13, marginTop:4, lineHeight:1.7 }}>{item.content}</div>
          </div>
        </div>
      ))}

      <div style={{ background:"#FFF8E6", border:"1.5px solid #F5D78A", borderRadius:12, padding:"16px 18px", fontSize:13, color:"#92610A", lineHeight:1.7, marginTop:8 }}>
        <strong>⚠️ Important:</strong> Google Places API charges per request (~$0.017/call). For 20 results, roughly $0.35/search. Use billing alerts in Google Cloud Console.
      </div>
    </div>
  );
}

// ─── App Shell ───────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage]           = useState("search");
  const [query, setQuery]         = useState(null);
  const [results, setResults]     = useState([]);
  const [allResults, setAllResults] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [saved, setSaved]         = useState([]);
  const [contacted, setContacted] = useState([]);
  const [notes, setNotes]         = useState({});
  const [outreachBiz, setOutreach] = useState(null);

  const handleSearch = async (q) => {
    setQuery(q); setError(""); setLoading(true); setPage("results");
    try {
      const res = await fetchLeads(q);
      setResults(res);
      setAllResults((prev) => {
        const ids = new Set(prev.map((b) => b.id));
        return [...prev, ...res.filter((b) => !ids.has(b.id))];
      });
    } catch (e) {
      setError(e.message);
      setPage("search");
    }
    setLoading(false);
  };

  const toggleSave    = (id) => setSaved((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const toggleContact = (id) => setContacted((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const setNote       = (id, n) => setNotes((p) => ({ ...p, [id]: n }));

  const NAV = [
    { id:"search",  label:"🔍 Search" },
    { id:"results", label:"📊 Results", disabled: results.length === 0 && !loading },
    { id:"saved",   label:`💾 Saved${saved.length ? ` (${saved.length})` : ""}` },
    { id:"setup",   label:"⚙️ Setup" },
  ];

  return (
    <div style={{ fontFamily:"'DM Sans','Segoe UI',sans-serif", background:"#F9FBFD", minHeight:"100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800;900&display=swap');
        * { box-sizing:border-box; }
        @keyframes spin { to { transform:rotate(360deg); } }
        button:active { transform:scale(0.97); }
        input:focus, select:focus, textarea:focus { outline:2px solid #0091D1 !important; }
        a { transition: opacity 0.15s; }
        a:hover { opacity: 0.8; }
      `}</style>

      {/* Nav */}
      <nav style={{ background:"#fff", borderBottom:"1.5px solid #E5EDF5", padding:"0 28px", height:58, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100, boxShadow:"0 1px 8px rgba(0,80,140,0.05)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:9 }}>
          <div style={{ background:"#0091D1", borderRadius:8, width:28, height:28, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>📍</div>
          <span style={{ fontWeight:900, fontSize:15, color:"#1F2937", letterSpacing:-0.3 }}>Unclaimed GMB Finder</span>
        </div>
        <div style={{ display:"flex", gap:3 }}>
          {NAV.map((n) => (
            <button key={n.id} onClick={() => !n.disabled && setPage(n.id)} disabled={n.disabled}
              style={{ background: page===n.id?"#E8F4F8":"none", color: page===n.id?"#0091D1":n.disabled?"#D1D5DB":"#6B7280", border:"none", borderRadius:7, padding:"6px 13px", fontSize:12, fontWeight: page===n.id?800:600, cursor: n.disabled?"default":"pointer" }}>
              {n.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Error banner */}
      {error && (
        <div style={{ background:"#FFF5F5", borderBottom:"1px solid #FED7D7", color:"#C53030", padding:"11px 28px", fontSize:13, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          ⚠️ {error}
          <button onClick={() => setError("")} style={{ background:"none", border:"none", color:"#C53030", cursor:"pointer", fontSize:16 }}>✕</button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"70vh" }}>
          <div style={{ width:44, height:44, border:"4px solid #E8F4F8", borderTop:"4px solid #0091D1", borderRadius:"50%", animation:"spin 0.9s linear infinite", marginBottom:18 }} />
          <div style={{ fontSize:17, fontWeight:700, color:"#1F2937" }}>Scanning Google Business Profiles…</div>
          <div style={{ color:"#9CA3AF", marginTop:7, fontSize:13 }}>Fetching details · Detecting unclaimed signals</div>
        </div>
      ) : page === "search"  ? <SearchPage onSearch={handleSearch} />
        : page === "results" ? <ResultsPage query={query} results={results} saved={saved} contacted={contacted} notes={notes} onSave={toggleSave} onContact={toggleContact} onOutreach={setOutreach} onNote={setNote} onBack={() => setPage("search")} />
        : page === "saved"   ? <SavedPage allResults={allResults} savedIds={saved} contacted={contacted} notes={notes} onSave={toggleSave} onContact={toggleContact} onOutreach={setOutreach} onNote={setNote} />
        :                      <SetupPage />
      }

      {outreachBiz && <OutreachModal biz={outreachBiz} onClose={() => setOutreach(null)} />}
    </div>
  );
}
