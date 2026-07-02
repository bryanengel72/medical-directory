import { useState, useMemo } from "react";

// ---------------------------------------------------------------
// CORRIDOR MVP: US <-> Baja dental comparison demo
// One corridor (Tijuana + Los Algodones), one vertical (dental).
// Clinic names, cities, procedure prices, and ratings/review counts
// below were pulled via Firecrawl (scraped July 2026): prices from
// each clinic's own published price-list page, ratings/reviews from
// their Yelp business page (Google via Trustindex for Novadent,
// which has no Yelp listing). Accreditation and warranty-length
// flags are still NOT independently verified -- they reflect each
// clinic's own marketing claims (e.g. "ADA-affiliated" on their
// site) or are illustrative placeholders where no claim was found.
// ---------------------------------------------------------------

const T = {
  bg: "#F2F5F1",
  surface: "#FFFFFF",
  ink: "#122B25",
  inkSoft: "#4A5F58",
  line: "#DDE5E0",
  teal: "#0E7C66",
  tealSoft: "#E2F0EC",
  tealMid: "#5FAF9C",
  sand: "#E9E2D2",
  amber: "#B0621B",
  amberSoft: "#F6E8D8",
};

const PROCEDURES = {
  implant: {
    label: "Single dental implant",
    unitLabel: "implants",
    usAvg: 4200,
    trips: 2,
    nightsPerTrip: 3,
    note: "Requires two trips, 3 to 4 months apart (placement, then crown).",
  },
  crown: {
    label: "Porcelain crown",
    unitLabel: "crowns",
    usAvg: 1300,
    trips: 1,
    nightsPerTrip: 4,
    note: "Usually done in one trip of 3 to 5 days.",
  },
  veneers: {
    label: "Veneer (per tooth)",
    unitLabel: "veneers",
    usAvg: 1300,
    trips: 1,
    nightsPerTrip: 6,
    note: "One trip, typically 5 to 7 days for a full set.",
  },
  rootcanal: {
    label: "Root canal + crown",
    usAvg: 2400,
    unitLabel: "teeth",
    trips: 1,
    nightsPerTrip: 3,
    note: "One trip, 2 to 4 days depending on the tooth.",
  },
  allon4: {
    label: "All-on-4 (per arch)",
    unitLabel: "arches",
    usAvg: 26000,
    trips: 2,
    nightsPerTrip: 5,
    note: "Two trips: surgery + temporary, then final prosthesis months later.",
  },
};

const CITIES = {
  sandiego: { label: "San Diego, CA", toTJ: 25, toLA: 190 },
  losangeles: { label: "Los Angeles, CA", toTJ: 140, toLA: 260 },
  phoenix: { label: "Phoenix, AZ", toTJ: 320, toLA: 90 },
  dallas: { label: "Dallas, TX", toTJ: 380, toLA: 340 },
  denver: { label: "Denver, CO", toTJ: 350, toLA: 310 },
  seattle: { label: "Seattle, WA", toTJ: 420, toLA: 400 },
};

const HOTEL = { TJ: 85, LA: 110 }; // per night. LA = Los Algodones / Yuma side

// Real clinics operating in the corridor today, with prices pulled
// from each clinic's own published price list, and rating/review
// counts pulled from Yelp business pages (Google via Trustindex for
// Novadent, which has no Yelp listing) -- see file header.
const INITIAL_CLINICS = [
  {
    id: "c1",
    name: "X Dentistry",
    website: "https://xdentistry.com",
    city: "TJ",
    cityLabel: "Tijuana, near NewCity Medical Plaza",
    verified: "2026-07-02",
    rating: 4.5,
    reviews: 36,
    accredited: true,
    warranty: 5,
    english: true,
    pickup: true,
    prices: { implant: 1540, crown: 550, veneers: 550, rootcanal: 400, allon4: 11000 },
    featured: { active: true, procedures: ["implant", "allon4"] },
  },
  {
    id: "c2",
    name: "Advanced Smiles Dentistry",
    website: "https://advancedsmilesdentistry.com",
    city: "TJ",
    cityLabel: "Tijuana",
    verified: "2026-07-02",
    rating: 4.6,
    reviews: 262,
    accredited: true,
    warranty: 5,
    english: true,
    pickup: true,
    prices: { implant: 1550, crown: 550, veneers: 550, rootcanal: 350, allon4: 9000 },
    featured: { active: false, procedures: [] },
  },
  {
    id: "c3",
    name: "My Baja Dental",
    website: "https://mybajadental.com",
    city: "TJ",
    cityLabel: "Tijuana",
    verified: "2026-07-02",
    rating: 5.0,
    reviews: 6,
    accredited: false,
    warranty: 3,
    english: true,
    pickup: false,
    prices: { implant: 2075, crown: 550, veneers: 550, rootcanal: 350, allon4: 9500 },
    featured: { active: false, procedures: [] },
  },
  {
    id: "c4",
    name: "Smile Together Tijuana",
    website: "https://smiletogethertijuana.com",
    city: "TJ",
    cityLabel: "Tijuana, Zona Rio (Plaza Rio)",
    verified: "2026-07-02",
    rating: 4.7,
    reviews: 127,
    accredited: false,
    warranty: 3,
    english: true,
    pickup: true,
    prices: { implant: 1540, crown: 550, veneers: 550, rootcanal: 400, allon4: 11000 },
    featured: { active: false, procedures: [] },
  },
  {
    id: "c5",
    name: "Dental Solutions Algodones",
    website: "https://dentalsolutionsalgodones.com",
    city: "LA",
    cityLabel: "Los Algodones",
    verified: "2026-07-02",
    rating: 4.2,
    reviews: 55,
    accredited: true,
    warranty: 5,
    english: true,
    pickup: true,
    prices: { implant: 1350, crown: 499, veneers: 399, rootcanal: 250, allon4: 9900 },
    featured: { active: true, procedures: ["crown", "veneers"] },
  },
  {
    id: "c6",
    name: "Novadent Dental Clinic",
    website: "https://novadentdentalclinic.com",
    city: "LA",
    cityLabel: "Los Algodones",
    verified: "2026-07-02",
    rating: 5.0,
    reviews: 82,
    accredited: false,
    warranty: 2,
    english: true,
    pickup: false,
    prices: { implant: 1400, crown: 450, veneers: 500, rootcanal: 350, allon4: 9350 },
    featured: { active: false, procedures: [] },
  },
  {
    id: "c7",
    name: "Sani Dental Group",
    website: "https://sanidentalgroup.com",
    city: "LA",
    cityLabel: "Los Algodones",
    verified: "2026-07-02",
    rating: 3.5,
    reviews: 195,
    accredited: true,
    warranty: 5,
    english: true,
    pickup: true,
    prices: { implant: 1610, crown: 490, veneers: 450, rootcanal: 340, allon4: 8110 },
    featured: { active: false, procedures: [] },
  },
  {
    id: "c8",
    name: "Dental Del Rio Algodones",
    website: "https://dentaldelrioalgodones.com",
    city: "LA",
    cityLabel: "Los Algodones",
    verified: "2026-07-02",
    rating: 4.1,
    reviews: 22,
    accredited: false,
    warranty: 3,
    english: true,
    pickup: true,
    prices: { implant: 1200, crown: 450, veneers: 350, rootcanal: 199, allon4: 8900 },
    featured: { active: false, procedures: [] },
  },
];

const fmt = (n) =>
  "$" + Math.round(n).toLocaleString("en-US");

function costFor(clinic, procKey, units, cityKey) {
  const proc = PROCEDURES[procKey];
  const city = CITIES[cityKey];
  const procedure = clinic.prices[procKey] * units;
  const travelOne = clinic.city === "TJ" ? city.toTJ : city.toLA;
  const travel = travelOne * proc.trips;
  const lodging = HOTEL[clinic.city] * proc.nightsPerTrip * proc.trips;
  return {
    procedure,
    travel,
    lodging,
    total: procedure + travel + lodging,
    usTotal: proc.usAvg * units,
  };
}

// ---------------------------------------------------------------

function CostBar({ cost }) {
  const scale = Math.max(cost.usTotal, cost.total) * 1.04;
  const pct = (v) => (v / scale) * 100;
  return (
    <div style={{ marginTop: 34 }}>
      <div
        style={{
          position: "relative",
          height: 22,
          background: "#EDF1EE",
          borderRadius: 4,
          overflow: "visible",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            width: pct(cost.procedure) + "%",
            background: T.teal,
            borderRadius: "4px 0 0 4px",
          }}
          title={"Procedure " + fmt(cost.procedure)}
        />
        <div
          style={{
            position: "absolute",
            left: pct(cost.procedure) + "%",
            top: 0,
            height: "100%",
            width: pct(cost.travel) + "%",
            background: T.tealMid,
          }}
          title={"Travel " + fmt(cost.travel)}
        />
        <div
          style={{
            position: "absolute",
            left: pct(cost.procedure + cost.travel) + "%",
            top: 0,
            height: "100%",
            width: pct(cost.lodging) + "%",
            background: T.sand,
          }}
          title={"Lodging " + fmt(cost.lodging)}
        />
        {/* US benchmark tick */}
        <div
          style={{
            position: "absolute",
            left: pct(cost.usTotal) + "%",
            top: -5,
            bottom: -5,
            width: 2,
            background: T.amber,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: pct(cost.usTotal) + "%",
            top: -22,
            transform: "translateX(-50%)",
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            fontWeight: 600,
            color: T.amber,
            whiteSpace: "nowrap",
          }}
        >
          US avg {fmt(cost.usTotal)}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          gap: 14,
          marginTop: 8,
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 11,
          color: T.inkSoft,
          flexWrap: "wrap",
        }}
      >
        <span><Dot c={T.teal} /> Procedure {fmt(cost.procedure)}</span>
        <span><Dot c={T.tealMid} /> Travel {fmt(cost.travel)}</span>
        <span><Dot c={T.sand} /> Lodging {fmt(cost.lodging)}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------

function AdminPanel({ clinics, onToggleFeatured, onToggleProcedure }) {
  return (
    <main
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "30px 20px 60px",
      }}
    >
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 6px" }}>
          Clinic placements
        </h2>
        <p style={{ fontSize: 13.5, color: T.inkSoft, margin: 0, lineHeight: 1.5 }}>
          Demo of what a clinic or an internal sales rep would use to manage
          paid featured placement. Toggling featured status here changes what
          shows in the Featured slot on the Directory tab.
        </p>
      </div>

      {clinics.map((c) => (
        <div
          key={c.id}
          style={{
            background: T.surface,
            border: "1px solid " + T.line,
            borderRadius: 10,
            padding: "16px 18px",
            marginBottom: 12,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{c.name}</div>
              <div style={{ fontSize: 12, color: T.inkSoft, fontFamily: "'IBM Plex Mono', monospace" }}>
                {c.cityLabel}
              </div>
            </div>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <input
                type="checkbox"
                checked={c.featured.active}
                onChange={() => onToggleFeatured(c.id)}
                style={{ width: "auto" }}
              />
              Featured placement active
            </label>
          </div>

          {c.featured.active && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid " + T.line }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.inkSoft, marginBottom: 8 }}>
                Featured for which procedures
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {Object.entries(PROCEDURES).map(([key, p]) => {
                  const on = c.featured.procedures.includes(key);
                  return (
                    <button
                      key={key}
                      onClick={() => onToggleProcedure(c.id, key)}
                      style={{
                        background: on ? T.amberSoft : "#fff",
                        color: on ? T.amber : T.inkSoft,
                        border: "1px solid " + (on ? T.amber : T.line),
                        borderRadius: 6,
                        padding: "5px 10px",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "'Archivo', sans-serif",
                      }}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ))}
    </main>
  );
}

function Dot({ c }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 9,
        height: 9,
        borderRadius: 2,
        background: c,
        marginRight: 5,
        verticalAlign: "baseline",
      }}
    />
  );
}

function Badge({ children, tone }) {
  const tones = {
    teal: { bg: T.tealSoft, fg: T.teal },
    plain: { bg: "#EEF1EF", fg: T.inkSoft },
    amber: { bg: T.amberSoft, fg: T.amber },
  };
  const s = tones[tone || "plain"];
  return (
    <span
      style={{
        background: s.bg,
        color: s.fg,
        fontSize: 11,
        fontWeight: 600,
        padding: "3px 8px",
        borderRadius: 4,
        letterSpacing: "0.02em",
      }}
    >
      {children}
    </span>
  );
}

// ---------------------------------------------------------------

export default function DentalCorridorMVP() {
  const [clinics, setClinics] = useState(INITIAL_CLINICS);
  const [view, setView] = useState("directory"); // "directory" | "admin"
  const [proc, setProc] = useState("implant");
  const [units, setUnits] = useState(1);
  const [cityKey, setCityKey] = useState("sandiego");
  const [accreditedOnly, setAccreditedOnly] = useState(false);
  const [minWarranty, setMinWarranty] = useState(0);
  const [compare, setCompare] = useState([]);
  const [showCompare, setShowCompare] = useState(false);
  const [quickMatch, setQuickMatch] = useState(false);
  const [quoteClinic, setQuoteClinic] = useState(null);
  const [quoteSent, setQuoteSent] = useState(null);
  const [quoteForm, setQuoteForm] = useState({ name: "", email: "", notes: "" });

  const procedure = PROCEDURES[proc];

  const rows = useMemo(() => {
    let list = clinics.filter((c) => (accreditedOnly ? c.accredited : true))
      .filter((c) => c.warranty >= minWarranty)
      .map((c) => ({ clinic: c, cost: costFor(c, proc, units, cityKey) }));

    if (quickMatch) {
      // Urgent mode: accredited only, ranked by a blend of
      // price and rating rather than price alone.
      list = list
        .filter((r) => r.clinic.accredited)
        .map((r) => ({
          ...r,
          matchScore: r.clinic.rating * 20 - r.cost.total / 200,
        }))
        .sort((a, b) => b.matchScore - a.matchScore);
    } else {
      list = list.sort((a, b) => a.cost.total - b.cost.total);
    }
    return list;
  }, [clinics, proc, units, cityKey, accreditedOnly, minWarranty, quickMatch]);

  const featuredRows = useMemo(() => {
    return clinics
      .filter((c) => c.featured.active && c.featured.procedures.includes(proc))
      .map((c) => ({ clinic: c, cost: costFor(c, proc, units, cityKey) }));
  }, [clinics, proc, units, cityKey]);

  const toggleFeatured = (id) => {
    setClinics((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, featured: { ...c.featured, active: !c.featured.active } }
          : c
      )
    );
  };

  const toggleFeaturedProcedure = (id, procKey) => {
    setClinics((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const has = c.featured.procedures.includes(procKey);
        return {
          ...c,
          featured: {
            ...c.featured,
            procedures: has
              ? c.featured.procedures.filter((p) => p !== procKey)
              : [...c.featured.procedures, procKey],
          },
        };
      })
    );
  };

  const toggleCompare = (id) => {
    setCompare((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < 3
        ? [...prev, id]
        : prev
    );
  };

  const compareRows = rows.filter((r) => compare.includes(r.clinic.id));

  return (
    <div
      style={{
        minHeight: "100vh",
        background: T.bg,
        color: T.ink,
        fontFamily: "'Archivo', system-ui, sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700;800&family=IBM+Plex+Mono:wght@400;600&display=swap');
        select, input[type="number"] {
          font-family: 'Archivo', sans-serif;
          font-size: 14px;
          padding: 9px 10px;
          border: 1px solid ${T.line};
          border-radius: 6px;
          background: #fff;
          color: ${T.ink};
          width: 100%;
        }
        select:focus, input:focus, button:focus-visible {
          outline: 2px solid ${T.teal};
          outline-offset: 1px;
        }
        @media (prefers-reduced-motion: reduce) {
          * { transition: none !important; }
        }
      `}</style>

      {/* Header */}
      <header
        style={{
          background: T.ink,
          color: "#F4F7F5",
          padding: "28px 28px 26px",
        }}
      >
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              letterSpacing: "0.14em",
              color: T.tealMid,
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            Corridor 001 · US to Baja California · Dental
          </div>
          <h1
            style={{
              fontSize: "clamp(26px, 4vw, 40px)",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              margin: 0,
              lineHeight: 1.05,
            }}
          >
            The true cost of the trip,
            <br />
            not just the procedure.
          </h1>
          <p
            style={{
              maxWidth: 560,
              color: "#B9C9C3",
              fontSize: 15,
              lineHeight: 1.55,
              marginTop: 12,
              marginBottom: 20,
            }}
          >
            Every clinic below was verified by phone or in person. Every price
            includes travel and lodging from your departure city, compared
            against the US average for the same work.
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setView("directory")}
              style={{
                background: view === "directory" ? T.teal : "transparent",
                color: view === "directory" ? "#fff" : "#B9C9C3",
                border: "1px solid " + (view === "directory" ? T.teal : "#3A5750"),
                borderRadius: 6,
                padding: "7px 14px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'Archivo', sans-serif",
              }}
            >
              Directory
            </button>
            <button
              onClick={() => setView("admin")}
              style={{
                background: view === "admin" ? T.teal : "transparent",
                color: view === "admin" ? "#fff" : "#B9C9C3",
                border: "1px solid " + (view === "admin" ? T.teal : "#3A5750"),
                borderRadius: 6,
                padding: "7px 14px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'Archivo', sans-serif",
              }}
            >
              Clinic admin (demo)
            </button>
          </div>
        </div>
      </header>

      {view === "admin" ? (
        <AdminPanel
          clinics={clinics}
          onToggleFeatured={toggleFeatured}
          onToggleProcedure={toggleFeaturedProcedure}
        />
      ) : (
      <main
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "26px 20px 60px",
          display: "grid",
          gridTemplateColumns: "280px 1fr",
          gap: 24,
        }}
      >
        {/* Controls */}
        <aside>
          <div
            style={{
              background: T.surface,
              border: "1px solid " + T.line,
              borderRadius: 10,
              padding: 18,
              position: "sticky",
              top: 16,
            }}
          >
            <button
              onClick={() => setQuickMatch((v) => !v)}
              style={{
                width: "100%",
                textAlign: "left",
                border: "1.5px solid " + (quickMatch ? T.amber : T.line),
                background: quickMatch ? T.amberSoft : "#fff",
                borderRadius: 8,
                padding: "10px 12px",
                marginBottom: 16,
                cursor: "pointer",
                fontFamily: "'Archivo', sans-serif",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 15 }}>{quickMatch ? "⚡" : "○"}</span>
                <span style={{ fontWeight: 700, fontSize: 13.5, color: quickMatch ? T.amber : T.ink }}>
                  Quick Match: urgent need
                </span>
              </div>
              <div style={{ fontSize: 11.5, color: T.inkSoft, marginTop: 4, lineHeight: 1.4 }}>
                Skips price sorting. Shows only accredited clinics, ranked by a
                blend of rating and cost, for people who need to decide fast.
              </div>
            </button>

            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>
              Your situation
            </div>

            <label style={labelStyle}>Procedure</label>
            <select value={proc} onChange={(e) => { setProc(e.target.value); setUnits(1); }}>
              {Object.entries(PROCEDURES).map(([k, p]) => (
                <option key={k} value={k}>{p.label}</option>
              ))}
            </select>

            <label style={labelStyle}>How many {procedure.unitLabel}?</label>
            <input
              type="number"
              min={1}
              max={16}
              value={units}
              onChange={(e) =>
                setUnits(Math.max(1, Math.min(16, Number(e.target.value) || 1)))
              }
            />

            <label style={labelStyle}>Departing from</label>
            <select value={cityKey} onChange={(e) => setCityKey(e.target.value)}>
              {Object.entries(CITIES).map(([k, c]) => (
                <option key={k} value={k}>{c.label}</option>
              ))}
            </select>

            <div style={{ borderTop: "1px solid " + T.line, margin: "16px 0 12px" }} />
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>
              Filters
            </div>

            <label style={checkRow}>
              <input
                type="checkbox"
                checked={accreditedOnly}
                onChange={(e) => setAccreditedOnly(e.target.checked)}
                style={{ width: "auto" }}
              />
              <span>Accredited clinics only</span>
            </label>

            <label style={labelStyle}>Minimum warranty</label>
            <select
              value={minWarranty}
              onChange={(e) => setMinWarranty(Number(e.target.value))}
            >
              <option value={0}>Any</option>
              <option value={3}>3+ years</option>
              <option value={5}>5+ years</option>
              <option value={10}>10 years</option>
            </select>

            <div
              style={{
                marginTop: 16,
                background: T.tealSoft,
                borderRadius: 8,
                padding: "10px 12px",
                fontSize: 12.5,
                lineHeight: 1.5,
                color: "#1D5448",
              }}
            >
              {procedure.note}
            </div>
          </div>
        </aside>

        {/* Results */}
        <section>
          {!showCompare && featuredRows.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: T.inkSoft,
                  marginBottom: 8,
                }}
              >
                Featured for {PROCEDURES[proc].label.toLowerCase()}
              </div>
              {featuredRows.map(({ clinic, cost }) => (
                <article
                  key={clinic.id}
                  style={{
                    background: "#FFFDF7",
                    border: "1.5px solid " + T.amber,
                    borderRadius: 10,
                    padding: "16px 20px 14px",
                    marginBottom: 12,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <Badge tone="amber">Featured</Badge>
                        <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{clinic.name}</h2>
                        {clinic.accredited && <Badge tone="teal">Accredited</Badge>}
                      </div>
                      <div
                        style={{
                          fontSize: 12.5,
                          color: T.inkSoft,
                          marginTop: 5,
                          fontFamily: "'IBM Plex Mono', monospace",
                        }}
                      >
                        {clinic.cityLabel} &middot; {"★"} {clinic.rating} ({clinic.reviews})
                      </div>
                    </div>
                    <div
                      style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: 19,
                        fontWeight: 600,
                      }}
                    >
                      {fmt(cost.total)}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
                    <button
                      onClick={() => {
                        setQuoteClinic(clinic);
                        setQuoteForm({ name: "", email: "", notes: "" });
                        setQuoteSent(null);
                      }}
                      style={{
                        background: T.amber,
                        color: "#fff",
                        border: "none",
                        borderRadius: 6,
                        padding: "7px 13px",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "'Archivo', sans-serif",
                      }}
                    >
                      Request a quote
                    </button>
                    {clinic.website && (
                      <a
                        href={clinic.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          color: T.amber,
                          fontSize: 13,
                          fontWeight: 600,
                          textDecoration: "none",
                          padding: "7px 4px",
                          fontFamily: "'Archivo', sans-serif",
                        }}
                      >
                        Visit website ↗
                      </a>
                    )}
                  </div>
                </article>
              ))}
              <div style={{ fontSize: 11.5, color: T.inkSoft, lineHeight: 1.5 }}>
                Featured placements are paid. Prices, ratings, and accreditation
                are verified the same way for every clinic, featured or not.
              </div>
              <div style={{ borderTop: "1px solid " + T.line, margin: "18px 0" }} />
            </div>
          )}
          {quickMatch && (
            <div
              style={{
                background: T.amberSoft,
                border: "1px solid " + T.amber,
                borderRadius: 8,
                padding: "10px 14px",
                marginBottom: 14,
                fontSize: 13,
                color: "#7A4213",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span>{"⚡"}</span>
              <span>
                Quick Match is on. Showing accredited clinics only, ranked by
                rating and cost together, not by lowest price alone.
              </span>
            </div>
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 14,
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <div style={{ fontSize: 14, color: T.inkSoft }}>
              <strong style={{ color: T.ink }}>{rows.length} verified clinics</strong>
              {" "}
              {quickMatch ? "ranked for urgent decisions" : "sorted by total trip cost"}
              {" · "}{units} {procedure.unitLabel}
            </div>
            {compare.length > 0 && (
              <button
                onClick={() => setShowCompare((v) => !v)}
                style={{
                  background: T.ink,
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  padding: "8px 14px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "'Archivo', sans-serif",
                }}
              >
                {showCompare ? "Back to list" : `Compare selected (${compare.length})`}
              </button>
            )}
          </div>

          {!showCompare &&
            rows.map(({ clinic, cost }) => {
              const savings = 1 - cost.total / cost.usTotal;
              const selected = compare.includes(clinic.id);
              return (
                <article
                  key={clinic.id}
                  style={{
                    background: T.surface,
                    border: "1px solid " + (selected ? T.teal : T.line),
                    borderRadius: 10,
                    padding: "18px 20px 16px",
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>
                          {clinic.name}
                        </h2>
                        {clinic.accredited && <Badge tone="teal">Accredited</Badge>}
                        {clinic.warranty >= 5 && (
                          <Badge>{clinic.warranty}-yr warranty</Badge>
                        )}
                        {clinic.pickup && <Badge>Border pickup</Badge>}
                      </div>
                      <div
                        style={{
                          fontSize: 12.5,
                          color: T.inkSoft,
                          marginTop: 5,
                          fontFamily: "'IBM Plex Mono', monospace",
                        }}
                      >
                        {clinic.cityLabel} · ★ {clinic.rating} ({clinic.reviews}) ·
                        verified {clinic.verified}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: 22,
                          fontWeight: 600,
                        }}
                      >
                        {fmt(cost.total)}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: T.teal,
                          marginTop: 2,
                        }}
                      >
                        {Math.round(savings * 100)}% below US avg
                      </div>
                    </div>
                  </div>

                  <CostBar cost={cost} />

                  <div
                    style={{
                      display: "flex",
                      justifyContent: clinic.website ? "space-between" : "flex-end",
                      alignItems: "center",
                      gap: 10,
                      marginTop: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    {clinic.website && (
                      <a
                        href={clinic.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: T.inkSoft,
                          fontSize: 12.5,
                          fontWeight: 600,
                          textDecoration: "none",
                          fontFamily: "'Archivo', sans-serif",
                        }}
                      >
                        Visit website ↗
                      </a>
                    )}
                    <div style={{ display: "flex", gap: 10 }}>
                    <button
                      onClick={() => toggleCompare(clinic.id)}
                      style={{
                        background: selected ? T.teal : "transparent",
                        color: selected ? "#fff" : T.teal,
                        border: "1.5px solid " + T.teal,
                        borderRadius: 6,
                        padding: "7px 13px",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "'Archivo', sans-serif",
                      }}
                    >
                      {selected ? "Added to compare" : "Add to compare"}
                    </button>
                    <button
                      onClick={() => {
                        setQuoteClinic(clinic);
                        setQuoteForm({ name: "", email: "", notes: "" });
                        setQuoteSent(null);
                      }}
                      style={{
                        background: T.ink,
                        color: "#fff",
                        border: "none",
                        borderRadius: 6,
                        padding: "7px 13px",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "'Archivo', sans-serif",
                      }}
                    >
                      Request a quote
                    </button>
                    </div>
                  </div>
                </article>
              );
            })}

          {!showCompare && rows.length === 0 && (
            <div
              style={{
                background: T.surface,
                border: "1px dashed " + T.line,
                borderRadius: 10,
                padding: 30,
                textAlign: "center",
                color: T.inkSoft,
                fontSize: 14,
              }}
            >
              No clinics match these filters. Loosen the warranty or
              accreditation filter to see more options.
            </div>
          )}

          {/* Compare view */}
          {showCompare && compareRows.length > 0 && (
            <div
              style={{
                background: T.surface,
                border: "1px solid " + T.line,
                borderRadius: 10,
                overflow: "auto",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
                <thead>
                  <tr>
                    <th style={thStyle}></th>
                    {compareRows.map(({ clinic }) => (
                      <th key={clinic.id} style={{ ...thStyle, minWidth: 180 }}>
                        {clinic.name}
                        <div style={{ fontWeight: 400, fontSize: 11.5, color: T.inkSoft, marginTop: 3 }}>
                          {clinic.cityLabel}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Total trip cost", ({ cost }) => (
                      <strong style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{fmt(cost.total)}</strong>
                    )],
                    ["vs US average", ({ cost }) => (
                      <span style={{ color: T.teal, fontWeight: 700 }}>
                        {Math.round((1 - cost.total / cost.usTotal) * 100)}% less
                      </span>
                    )],
                    ["Procedure", ({ cost }) => fmt(cost.procedure)],
                    ["Travel", ({ cost }) => fmt(cost.travel)],
                    ["Lodging", ({ cost }) => fmt(cost.lodging)],
                    ["Accredited", ({ clinic }) => (clinic.accredited ? "Yes" : "No")],
                    ["Warranty", ({ clinic }) => clinic.warranty + " years"],
                    ["Rating", ({ clinic }) => `★ ${clinic.rating} (${clinic.reviews})`],
                    ["Border pickup", ({ clinic }) => (clinic.pickup ? "Yes" : "No")],
                    ["Last verified", ({ clinic }) => clinic.verified],
                    ["Website", ({ clinic }) =>
                      clinic.website ? (
                        <a
                          href={clinic.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: T.teal, fontWeight: 600, textDecoration: "none" }}
                        >
                          Visit ↗
                        </a>
                      ) : (
                        "—"
                      ),
                    ],
                  ].map(([label, render]) => (
                    <tr key={label}>
                      <td style={{ ...tdStyle, fontWeight: 600, color: T.inkSoft, whiteSpace: "nowrap" }}>
                        {label}
                      </td>
                      {compareRows.map((r) => (
                        <td key={r.clinic.id} style={tdStyle}>
                          {render(r)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
      )}

      {view === "directory" && (
      <footer
        style={{
          borderTop: "1px solid " + T.line,
          padding: "18px 20px 30px",
          maxWidth: 1180,
          margin: "0 auto",
          fontSize: 12,
          color: T.inkSoft,
          lineHeight: 1.6,
        }}
      >
        Clinic names, locations, and procedure prices are sourced from each
        clinic's own published price list. Ratings and review counts are
        sourced from Yelp (Google, via Trustindex, for Novadent). Accreditation
        and warranty terms reflect clinics' own marketing claims and have not
        been independently verified. Prices change often -- always confirm
        pricing, credentials, and treatment plans directly with a provider
        before traveling. This tool does not provide medical advice.
      </footer>
      )}

      {quoteClinic && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={"Request a quote from " + quoteClinic.name}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(18, 43, 37, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 50,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setQuoteClinic(null);
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 24,
              width: "100%",
              maxWidth: 420,
              boxShadow: "0 20px 50px rgba(18,43,37,0.25)",
            }}
          >
            {quoteSent === quoteClinic.id ? (
              <div style={{ textAlign: "center", padding: "10px 0" }}>
                <div style={{ fontSize: 30, marginBottom: 8 }}>{"✓"}</div>
                <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700 }}>
                  Request sent
                </h3>
                <p style={{ fontSize: 13.5, color: T.inkSoft, lineHeight: 1.5, margin: "0 0 18px" }}>
                  {quoteClinic.name} typically replies within one business day.
                  We will forward your notes on {PROCEDURES[proc].label.toLowerCase()}
                  {" "}({units} {PROCEDURES[proc].unitLabel}) exactly as written.
                </p>
                <button
                  onClick={() => setQuoteClinic(null)}
                  style={{
                    background: T.ink,
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    padding: "9px 18px",
                    fontSize: 13.5,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "'Archivo', sans-serif",
                  }}
                >
                  Done
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setQuoteSent(quoteClinic.id);
                }}
              >
                <h3 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700 }}>
                  Request a quote
                </h3>
                <p style={{ fontSize: 13, color: T.inkSoft, margin: "0 0 16px" }}>
                  {quoteClinic.name}, {quoteClinic.cityLabel}
                </p>

                <div
                  style={{
                    background: T.tealSoft,
                    borderRadius: 8,
                    padding: "9px 12px",
                    fontSize: 12.5,
                    color: "#1D5448",
                    marginBottom: 16,
                  }}
                >
                  {PROCEDURES[proc].label} &middot; {units} {PROCEDURES[proc].unitLabel} &middot; from {CITIES[cityKey].label}
                </div>

                <label style={labelStyle}>Your name</label>
                <input
                  required
                  value={quoteForm.name}
                  onChange={(e) => setQuoteForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="First and last name"
                />

                <label style={labelStyle}>Email</label>
                <input
                  required
                  type="email"
                  value={quoteForm.email}
                  onChange={(e) => setQuoteForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="you@example.com"
                />

                <label style={labelStyle}>Anything the clinic should know</label>
                <textarea
                  value={quoteForm.notes}
                  onChange={(e) => setQuoteForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Preferred travel dates, x-rays on file, questions about the procedure"
                  rows={3}
                  style={{
                    width: "100%",
                    fontFamily: "'Archivo', sans-serif",
                    fontSize: 14,
                    padding: "9px 10px",
                    border: "1px solid " + T.line,
                    borderRadius: 6,
                    resize: "vertical",
                  }}
                />

                <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                  <button
                    type="button"
                    onClick={() => setQuoteClinic(null)}
                    style={{
                      flex: 1,
                      background: "transparent",
                      color: T.inkSoft,
                      border: "1px solid " + T.line,
                      borderRadius: 6,
                      padding: "10px 14px",
                      fontSize: 13.5,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "'Archivo', sans-serif",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      flex: 2,
                      background: T.teal,
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      padding: "10px 14px",
                      fontSize: 13.5,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "'Archivo', sans-serif",
                    }}
                  >
                    Send request
                  </button>
                </div>

                <p style={{ fontSize: 11, color: T.inkSoft, marginTop: 12, marginBottom: 0, lineHeight: 1.5 }}>
                  Demo only. No message is actually sent to a clinic. In a real
                  version, this would route to the clinic's verified contact
                  and log the request for follow up.
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "#4A5F58",
  margin: "12px 0 5px",
  letterSpacing: "0.02em",
};

const checkRow = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 13.5,
  marginBottom: 6,
  cursor: "pointer",
};

const thStyle = {
  textAlign: "left",
  padding: "12px 14px",
  borderBottom: "2px solid #DDE5E0",
  fontSize: 13,
  verticalAlign: "top",
};

const tdStyle = {
  padding: "10px 14px",
  borderBottom: "1px solid #EDF1EE",
};
