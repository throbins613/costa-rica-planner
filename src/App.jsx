import { useState, useEffect, useRef } from "react";

const TRIP_CONTEXT = `Family holiday Costa Rica & Orlando, August 2026.
Party: 2 families, 3 adults, 5 children (ages roughly 4-12).
Budget: £5,000-£8,000 total for accommodation and internal travel.
Requirements for Costa Rica villas: private pool, 4-5 bedrooms, sleeps 8+, luxurious but value-conscious.
August is green season - sunny mornings, afternoon showers. Guanacaste benefits from veranillo (mini dry season).`;

const RESEARCH_PROMPTS = {
  miami: `${TRIP_CONTEXT}\n\nResearch: Best 1-night hotel options near Miami Airport (MIA) for a family of 3 adults + 5 children arriving 14:30 on 4 Aug 2026. They need easy access, pool ideally, and a good night's rest before an early onward flight. Return exactly 3 options as JSON array: [{id, name, tagline, price, pros, cons, bookingTip, rating}]. Only JSON, no other text.`,
  guanacaste: `${TRIP_CONTEXT}\n\nResearch: Best private villa options in the Guanacaste / Santa Teresa / Nosara area of Costa Rica for 7 nights (5-12 Aug 2026). Must have private pool, 4-5 bedrooms, sleeps 8+. Luxury feel but budget-conscious. Return exactly 3 options as JSON array: [{id, name, tagline, price, pros, cons, bookingTip, rating}]. Only JSON, no other text.`,
  arenal: `${TRIP_CONTEXT}\n\nResearch: Best private villa or lodge options near Arenal / La Fortuna, Costa Rica for 6 nights (12-17 Aug 2026). Must have private pool, 4-5 bedrooms, sleeps 8+, jungle/volcano setting. Return exactly 3 options as JSON array: [{id, name, tagline, price, pros, cons, bookingTip, rating}]. Only JSON, no other text.`,
  orlando: `${TRIP_CONTEXT}\n\nResearch: Best theme park strategy for Orlando with 5 children (mixed ages 4-12) over 5 days (18-23 Aug 2026). Which parks, in what order, key tips. Return exactly 3 options/strategies as JSON array: [{id, name, tagline, price, pros, cons, bookingTip, rating}]. Only JSON, no other text.`
};

const FLIGHT_RESEARCH_PROMPTS = {
  "miami-sanjose": `${TRIP_CONTEXT}\n\nResearch: Best flights Miami to San Jose Costa Rica on 5 Aug 2026 for 3 adults + 5 children. Include airlines, departure times, prices per person, total family cost, and any tips. Return exactly 3 options as JSON array: [{id, name, tagline, price, pros, cons, bookingTip, rating}]. Only JSON, no other text.`,
  "costarica-orlando": `${TRIP_CONTEXT}\n\nResearch: Best flights San Jose Costa Rica to Orlando on 18 Aug 2026 for 3 adults + 5 children. Include airlines, departure times, prices per person, total family cost, and any tips. Return exactly 3 options as JSON array: [{id, name, tagline, price, pros, cons, bookingTip, rating}]. Only JSON, no other text.`
};

const INITIAL_PLAN = {
  trip: { name: "Costa Rica & Orlando 2026", dates: "4 - 24 August 2026", party: "2 families . 3 adults . 5 children" },
  legs: [
    { id: "miami", icon: "\u2708\uFE0F", label: "Miami Stopover", dates: "4 Aug", nights: 1, location: "Miami, Florida", status: "todo", booked: false, notes: "Arrive 14:30 BA0207. 1 night to recover. Need hotel near MIA.", tasks: [{ id: "m1", text: "Book 1-night hotel near Miami airport", done: false }, { id: "m2", text: "Book onward flight MIA \u2192 San Jose (5 Aug)", done: false }], options: [], startDate: "2026-08-04", endDate: "2026-08-04" },
    { id: "guanacaste", icon: "\uD83C\uDFD6\uFE0F", label: "Guanacaste / Santa Teresa", dates: "5 - 11 Aug", nights: 7, location: "Nicoya Peninsula, Costa Rica", status: "todo", booked: false, notes: "Private villa, pool, 4-5 beds, sleeps 8. Best Pacific option in August - veranillo mini dry season. Beach, surf, wildlife.", tasks: [{ id: "g1", text: "Find & book villa (pool, 4-5 beds, sleeps 8)", done: false }, { id: "g2", text: "Arrange transfer from San Jose to villa", done: false }, { id: "g3", text: "Research activities: surf lessons, wildlife tours, ATV", done: false }], options: [], startDate: "2026-08-05", endDate: "2026-08-11" },
    { id: "arenal", icon: "\uD83C\uDF0B", label: "Arenal / La Fortuna", dates: "12 - 17 Aug", nights: 6, location: "La Fortuna, Costa Rica", status: "todo", booked: false, notes: "Jungle villa with pool. Volcano, hot springs, zip-lining, waterfalls. More rain but activities are weather-proof.", tasks: [{ id: "a1", text: "Find & book jungle villa (pool, 4-5 beds, sleeps 8)", done: false }, { id: "a2", text: "Book transfer Guanacaste \u2192 Arenal (12 Aug)", done: false }, { id: "a3", text: "Book hot springs visit", done: false }, { id: "a4", text: "Book zip-lining / hanging bridges tour", done: false }, { id: "a5", text: "Book La Fortuna waterfall hike", done: false }, { id: "a6", text: "Book transfer Arenal \u2192 San Jose \u2192 Orlando (18 Aug)", done: false }], options: [], startDate: "2026-08-12", endDate: "2026-08-17" },
    { id: "orlando", icon: "\uD83C\uDFA2", label: "Orlando", dates: "18 - 23 Aug", nights: 5, location: "Orlando, Florida", status: "partial", booked: true, notes: "Hotel already booked but was too long - now 5 nights. Need to amend booking. Drive to Miami 24 Aug for BA0206 17:00.", tasks: [{ id: "o1", text: "Amend hotel booking to 5 nights (18-23 Aug)", done: false }, { id: "o2", text: "Book Universal / Disney park tickets", done: false }, { id: "o3", text: "Arrange drive/transfer Orlando \u2192 Miami (24 Aug)", done: false }], options: [], startDate: "2026-08-18", endDate: "2026-08-23" }
  ],
  flights: [
    { id: "f1", label: "LHR \u2192 Miami", detail: "BA0207 . 4 Aug . Departs 09:55 . Arrives 14:30", booked: true },
    { id: "f2", label: "Miami \u2192 London", detail: "BA0206 . 24 Aug . Departs 17:00", booked: true },
    { id: "f3", label: "Miami \u2192 San Jose", detail: "5 Aug . To book", booked: false },
    { id: "f4", label: "Costa Rica \u2192 Orlando", detail: "18 Aug . To book", booked: false }
  ],
  budget: { total: "\u00A35,000 - \u00A38,000", items: [{ label: "Guanacaste villa (7 nights)", estimate: "\u00A32,000-\u00A33,000" }, { label: "Arenal villa (6 nights)", estimate: "\u00A31,500-\u00A32,500" }, { label: "Internal flights & transfers", estimate: "\u00A3800-\u00A31,500" }, { label: "Miami hotel (1 night)", estimate: "\u00A3150-\u00A3250" }] },
  comments: [],
  votes: {},
  dayNotes: {
    "2026-08-04": "Arrive Miami 14:30. Hotel check-in, rest & pool",
    "2026-08-05": "Fly to San Jose. Transfer to Guanacaste villa",
    "2026-08-06": "Beach days, surf lessons, wildlife tours",
    "2026-08-07": "Beach days, surf lessons, wildlife tours",
    "2026-08-08": "Beach days, surf lessons, wildlife tours",
    "2026-08-09": "Beach days, surf lessons, wildlife tours",
    "2026-08-10": "Beach days, surf lessons, wildlife tours",
    "2026-08-11": "Beach days, surf lessons, wildlife tours",
    "2026-08-12": "Transfer Guanacaste \u2192 Arenal",
    "2026-08-13": "Volcano, hot springs, zip-lining, waterfalls",
    "2026-08-14": "Volcano, hot springs, zip-lining, waterfalls",
    "2026-08-15": "Volcano, hot springs, zip-lining, waterfalls",
    "2026-08-16": "Volcano, hot springs, zip-lining, waterfalls",
    "2026-08-17": "Volcano, hot springs, zip-lining, waterfalls",
    "2026-08-18": "Fly to Orlando. Hotel check-in",
    "2026-08-19": "Theme parks - Disney, Universal, rest day",
    "2026-08-20": "Theme parks - Disney, Universal, rest day",
    "2026-08-21": "Theme parks - Disney, Universal, rest day",
    "2026-08-22": "Theme parks - Disney, Universal, rest day",
    "2026-08-23": "Theme parks - Disney, Universal, rest day",
    "2026-08-24": "Drive to Miami. BA0206 home 17:00"
  },
  flightOptions: {},
  replanHistory: []
};

const STATUS_CONFIG = {
  booked: { label: "Booked", color: "#4ade80", bg: "rgba(74,222,128,0.12)" },
  partial: { label: "Partial", color: "#fbbf24", bg: "rgba(251,191,36,0.12)" },
  todo: { label: "To Book", color: "#f87171", bg: "rgba(248,113,113,0.12)" }
};

const VOTER_COLORS = ["#e2c97e", "#4ade80", "#38bdf8", "#f472b6", "#a78bfa"];

// Timeline data: each block with proportional width and flight connectors
const TIMELINE_LEGS = [
  { id: "miami", icon: "\u2708\uFE0F", label: "Miami", days: 1, status: "todo" },
  { id: "_flight_mia_sj", type: "flight", label: "MIA\u2192SJ", status: "todo" },
  { id: "guanacaste", icon: "\uD83C\uDFD6\uFE0F", label: "Guanacaste", days: 7, status: "todo" },
  { id: "_flight_transfer", type: "transfer", label: "\u2192 Arenal", status: "todo" },
  { id: "arenal", icon: "\uD83C\uDF0B", label: "Arenal", days: 6, status: "todo" },
  { id: "_flight_sj_orl", type: "flight", label: "SJ\u2192ORL", status: "todo" },
  { id: "orlando", icon: "\uD83C\uDFA2", label: "Orlando", days: 5, status: "partial" },
  { id: "_flight_home", type: "transfer", label: "\u2192 MIA", status: "booked" }
];

// Generate all dates from Aug 4 to Aug 24
function generateTripDates() {
  const dates = [];
  for (let d = 4; d <= 24; d++) {
    const date = new Date(2026, 7, d); // month is 0-indexed
    const dayName = date.toLocaleDateString("en-GB", { weekday: "short" });
    const dateStr = `2026-08-${String(d).padStart(2, "0")}`;
    dates.push({ day: d, dayName, dateStr, date });
  }
  return dates;
}

function getLegForDate(dateStr, legs) {
  for (const leg of legs) {
    if (!leg.startDate || !leg.endDate) continue;
    if (dateStr >= leg.startDate && dateStr <= leg.endDate) return leg;
  }
  // Aug 24 is travel day home - belongs to no leg specifically
  return null;
}

function getFlightForDate(dateStr, flights) {
  const flightDates = {
    "2026-08-04": { label: "LHR\u2192MIA", detail: "BA0207" },
    "2026-08-05": { label: "MIA\u2192SJ", detail: "To book" },
    "2026-08-18": { label: "SJ\u2192ORL", detail: "To book" },
    "2026-08-24": { label: "ORL\u2192MIA\u2192LHR", detail: "BA0206" }
  };
  return flightDates[dateStr] || null;
}

const TRIP_DATES = generateTripDates();

// --- Replan diff helpers ---
function diffLegs(oldLegs, newLegs) {
  const changes = [];
  const oldIds = new Set(oldLegs.map(l => l.id));
  const newIds = new Set(newLegs.map(l => l.id));

  for (const nl of newLegs) {
    if (!oldIds.has(nl.id)) {
      changes.push({ type: "added", leg: nl });
    } else {
      const ol = oldLegs.find(l => l.id === nl.id);
      const diffs = [];
      if (ol.dates !== nl.dates) diffs.push(`Dates: ${ol.dates} -> ${nl.dates}`);
      if (ol.nights !== nl.nights) diffs.push(`Nights: ${ol.nights} -> ${nl.nights}`);
      if (ol.location !== nl.location) diffs.push(`Location: ${ol.location} -> ${nl.location}`);
      if (ol.label !== nl.label) diffs.push(`Label: ${ol.label} -> ${nl.label}`);
      // Check order change
      const oldIdx = oldLegs.findIndex(l => l.id === nl.id);
      const newIdx = newLegs.findIndex(l => l.id === nl.id);
      if (oldIdx !== newIdx) diffs.push(`Reordered: position ${oldIdx + 1} -> ${newIdx + 1}`);
      if (diffs.length > 0) {
        changes.push({ type: "modified", leg: nl, diffs });
      }
    }
  }

  for (const ol of oldLegs) {
    if (!newIds.has(ol.id)) {
      changes.push({ type: "removed", leg: ol });
    }
  }

  return changes;
}

function diffFlights(oldFlights, newFlights) {
  const changes = [];
  const oldIds = new Set(oldFlights.map(f => f.id));
  const newIds = new Set(newFlights.map(f => f.id));

  for (const nf of newFlights) {
    if (!oldIds.has(nf.id)) {
      changes.push({ type: "added", flight: nf });
    } else {
      const of_ = oldFlights.find(f => f.id === nf.id);
      if (of_.label !== nf.label || of_.detail !== nf.detail) {
        changes.push({ type: "modified", flight: nf, old: of_ });
      }
    }
  }

  for (const of_ of oldFlights) {
    if (!newIds.has(of_.id)) {
      changes.push({ type: "removed", flight: of_ });
    }
  }

  return changes;
}

export default function App() {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("itinerary");
  const [newComment, setNewComment] = useState("");
  const [commenterName, setCommenterName] = useState("");
  const [voterName, setVoterName] = useState("");
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);
  const [researching, setResearching] = useState({});
  const [expandedLeg, setExpandedLeg] = useState(null);
  const [expandedOption, setExpandedOption] = useState(null);
  const [editingDay, setEditingDay] = useState(null);
  const [editDayText, setEditDayText] = useState("");
  const [researchingFlights, setResearchingFlights] = useState({});
  const legRefs = useRef({});
  const timelineRef = useRef(null);

  // Replan state
  const [replanRequest, setReplanRequest] = useState("");
  const [replanning, setReplanning] = useState(false);
  const [proposedPlan, setProposedPlan] = useState(null);
  const [replanDiff, setReplanDiff] = useState(null);

  useEffect(() => { loadPlan(); }, []);

  const showNotification = (msg) => { setNotification(msg); setTimeout(() => setNotification(null), 2500); };

  const mergePlanDefaults = (parsed) => {
    if (!parsed.dayNotes) parsed.dayNotes = INITIAL_PLAN.dayNotes;
    if (!parsed.flightOptions) parsed.flightOptions = {};
    if (!parsed.replanHistory) parsed.replanHistory = [];
    parsed.legs = parsed.legs.map((leg, i) => ({
      ...INITIAL_PLAN.legs[i],
      ...leg,
      startDate: leg.startDate || INITIAL_PLAN.legs[i]?.startDate,
      endDate: leg.endDate || INITIAL_PLAN.legs[i]?.endDate
    }));
    return parsed;
  };

  const loadPlan = async () => {
    try {
      // Try cloud first
      const res = await fetch("/api/plan");
      const { plan: cloudPlan } = await res.json();
      if (cloudPlan) {
        setPlan(mergePlanDefaults(cloudPlan));
        setLoading(false);
        return;
      }
      // Fall back to localStorage
      const saved = localStorage.getItem("cr2026-plan-v3");
      if (saved) {
        const parsed = mergePlanDefaults(JSON.parse(saved));
        setPlan(parsed);
        // Migrate localStorage data to cloud
        fetch("/api/plan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan: parsed }) }).catch(() => {});
      } else {
        setPlan(INITIAL_PLAN);
      }
    } catch { setPlan(INITIAL_PLAN); }
    setLoading(false);
  };

  const savePlan = async (updated) => {
    setSaving(true);
    try { localStorage.setItem("cr2026-plan-v3", JSON.stringify(updated)); } catch {}
    // Save to cloud
    try { await fetch("/api/plan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan: updated }) }); } catch {}
    setSaving(false);
  };

  const toggleTask = (legId, taskId) => {
    const updated = { ...plan, legs: plan.legs.map(leg => leg.id === legId ? { ...leg, tasks: leg.tasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t) } : leg) };
    setPlan(updated); savePlan(updated);
  };

  const toggleLegBooked = (legId) => {
    const updated = { ...plan, legs: plan.legs.map(leg => { if (leg.id !== legId) return leg; const nb = !leg.booked; return { ...leg, booked: nb, status: nb ? "booked" : "todo" }; }) };
    setPlan(updated); savePlan(updated);
  };

  const addComment = () => {
    if (!newComment.trim() || !commenterName.trim()) return;
    const updated = { ...plan, comments: [...plan.comments, { id: Date.now().toString(), author: commenterName, text: newComment, time: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) }] };
    setPlan(updated); savePlan(updated); setNewComment(""); showNotification("Comment added");
  };

  const castVote = (legId, optionId) => {
    if (!voterName.trim()) { showNotification("Enter your name to vote"); return; }
    const updated = { ...plan, votes: { ...plan.votes, [legId]: { ...(plan.votes[legId] || {}), [voterName]: optionId } } };
    setPlan(updated); savePlan(updated); showNotification("Vote cast");
  };

  const getVotesForLeg = (legId) => plan.votes?.[legId] || {};
  const getVotesForOption = (legId, optionId) => Object.entries(getVotesForLeg(legId)).filter(([, v]) => v === optionId).map(([name]) => name);
  const getWinner = (legId, options) => {
    if (!options?.length) return null;
    const counts = options.map(o => ({ id: o.id, name: o.name, count: getVotesForOption(legId, o.id).length }));
    const max = Math.max(...counts.map(c => c.count));
    if (max === 0) return null;
    return counts.find(c => c.count === max);
  };

  const researchLeg = async (leg) => {
    setResearching(r => ({ ...r, [leg.id]: true }));
    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system: "You are a luxury family travel expert. Return ONLY valid JSON arrays, no markdown, no explanation.", messages: [{ role: "user", content: RESEARCH_PROMPTS[leg.id] }] })
      });
      const data = await response.json();
      const text = data.content?.find(b => b.type === "text")?.text || "[]";
      const options = JSON.parse(text.replace(/```json|```/g, "").trim());
      const updated = { ...plan, legs: plan.legs.map(l => l.id === leg.id ? { ...l, options } : l) };
      setPlan(updated); savePlan(updated); showNotification("Options found");
    } catch { showNotification("Research failed - try again"); }
    setResearching(r => ({ ...r, [leg.id]: false }));
  };

  const researchFlights = async (flightKey) => {
    setResearchingFlights(r => ({ ...r, [flightKey]: true }));
    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system: "You are a luxury family travel expert specializing in flights. Return ONLY valid JSON arrays, no markdown, no explanation.", messages: [{ role: "user", content: FLIGHT_RESEARCH_PROMPTS[flightKey] }] })
      });
      const data = await response.json();
      const text = data.content?.find(b => b.type === "text")?.text || "[]";
      const options = JSON.parse(text.replace(/```json|```/g, "").trim());
      const updated = { ...plan, flightOptions: { ...plan.flightOptions, [flightKey]: options } };
      setPlan(updated); savePlan(updated); showNotification("Flight options found");
    } catch { showNotification("Flight research failed - try again"); }
    setResearchingFlights(r => ({ ...r, [flightKey]: false }));
  };

  const clearOptions = (legId) => {
    const updated = { ...plan, legs: plan.legs.map(l => l.id === legId ? { ...l, options: [] } : l), votes: { ...plan.votes, [legId]: {} } };
    setPlan(updated); savePlan(updated);
  };

  const updateDayNote = (dateStr, text) => {
    const updated = { ...plan, dayNotes: { ...plan.dayNotes, [dateStr]: text } };
    setPlan(updated); savePlan(updated);
  };

  const scrollToLeg = (legId) => {
    setActiveTab("itinerary");
    setExpandedLeg(legId);
    setTimeout(() => {
      const el = legRefs.current[legId];
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const resetPlan = async () => { setPlan(INITIAL_PLAN); await savePlan(INITIAL_PLAN); showNotification("Plan reset"); };

  // --- AI Replan ---
  const submitReplan = async () => {
    if (!replanRequest.trim()) return;
    setReplanning(true);
    setProposedPlan(null);
    setReplanDiff(null);

    const currentPlanSummary = JSON.stringify({
      legs: plan.legs.map(l => ({ id: l.id, label: l.label, dates: l.dates, nights: l.nights, location: l.location, startDate: l.startDate, endDate: l.endDate })),
      flights: plan.flights.map(f => ({ id: f.id, label: f.label, detail: f.detail, booked: f.booked })),
      budget: plan.budget,
      dayNotes: plan.dayNotes
    }, null, 2);

    const replanPrompt = `${TRIP_CONTEXT}

Here is the current trip plan:
${currentPlanSummary}

User's change request: "${replanRequest}"

Restructure this trip plan based on the request. Keep the same JSON structure. For each leg include: id (lowercase kebab-case), icon (emoji), label, dates (e.g. "5 - 11 Aug"), nights, location, status ("todo"), booked (false), notes, tasks (array of {id, text, done}), options (empty array []), startDate (YYYY-MM-DD), endDate (YYYY-MM-DD).

For flights include: id, label, detail, booked (keep existing booked flights as booked if still relevant).

For budget include: total and items array with label and estimate.

For dayNotes include a key for each date (YYYY-MM-DD format) with a short description.

The trip must still start 4 Aug 2026 and the return flight from Miami is booked for 24 Aug 2026 (BA0206 17:00). LHR to Miami is booked for 4 Aug (BA0207 09:55, arrives 14:30).

Return ONLY valid JSON with this exact structure, no markdown, no explanation:
{"legs": [...], "flights": [...], "budget": {...}, "dayNotes": {...}}`;

    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          system: "You are a luxury family travel expert and trip planner. Return ONLY valid JSON, no markdown, no explanation.",
          messages: [{ role: "user", content: replanPrompt }]
        })
      });
      const data = await response.json();
      const text = data.content?.find(b => b.type === "text")?.text || "{}";
      const cleaned = text.replace(/```json|```/g, "").trim();
      const newPlanData = JSON.parse(cleaned);

      // Build proposed plan by merging with current structure
      const proposed = {
        ...plan,
        legs: newPlanData.legs || plan.legs,
        flights: newPlanData.flights || plan.flights,
        budget: newPlanData.budget || plan.budget,
        dayNotes: newPlanData.dayNotes || plan.dayNotes
      };

      // Compute diff
      const legChanges = diffLegs(plan.legs, proposed.legs);
      const flightChanges = diffFlights(plan.flights, proposed.flights);
      const budgetChanged = JSON.stringify(plan.budget) !== JSON.stringify(proposed.budget);

      setProposedPlan(proposed);
      setReplanDiff({ legChanges, flightChanges, budgetChanged });
    } catch (err) {
      console.error("Replan failed:", err);
      showNotification("Replan failed - try again");
    }
    setReplanning(false);
  };

  const acceptReplan = () => {
    if (!proposedPlan) return;

    // Preserve existing votes, comments, options, and flightOptions from old plan
    const merged = {
      ...proposedPlan,
      comments: plan.comments,
      votes: plan.votes,
      flightOptions: plan.flightOptions,
      replanHistory: [
        ...(plan.replanHistory || []),
        {
          timestamp: new Date().toISOString(),
          request: replanRequest,
          previousPlan: {
            legs: plan.legs,
            flights: plan.flights,
            budget: plan.budget,
            dayNotes: plan.dayNotes
          }
        }
      ]
    };

    // Preserve options for legs that still exist
    merged.legs = merged.legs.map(newLeg => {
      const oldLeg = plan.legs.find(ol => ol.id === newLeg.id);
      if (oldLeg) {
        return {
          ...newLeg,
          options: oldLeg.options || [],
          booked: oldLeg.booked,
          status: oldLeg.status,
          tasks: newLeg.tasks.map(nt => {
            const oldTask = oldLeg.tasks.find(ot => ot.id === nt.id);
            return oldTask ? { ...nt, done: oldTask.done } : nt;
          })
        };
      }
      return newLeg;
    });

    setPlan(merged);
    savePlan(merged);
    setProposedPlan(null);
    setReplanDiff(null);
    setReplanRequest("");
    showNotification("Plan updated with new itinerary");
  };

  const rejectReplan = () => {
    setProposedPlan(null);
    setReplanDiff(null);
    showNotification("Kept current plan");
  };

  const undoLastReplan = () => {
    if (!plan.replanHistory || plan.replanHistory.length === 0) return;
    const history = [...plan.replanHistory];
    const last = history.pop();
    const restored = {
      ...plan,
      legs: last.previousPlan.legs,
      flights: last.previousPlan.flights,
      budget: last.previousPlan.budget,
      dayNotes: last.previousPlan.dayNotes,
      replanHistory: history
    };
    setPlan(restored);
    savePlan(restored);
    showNotification("Reverted to previous plan");
  };

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0a1628", color: "#e2c97e", fontFamily: "Georgia,serif", fontSize: 18 }}>Loading...</div>;

  const bookedCount = plan.legs.filter(l => l.booked).length;
  const totalTasks = plan.legs.reduce((a, l) => a + l.tasks.length, 0);
  const doneTasks = plan.legs.reduce((a, l) => a + l.tasks.filter(t => t.done).length, 0);

  // Build timeline statuses from current plan
  const timelineData = TIMELINE_LEGS.map(tl => {
    if (tl.type === "flight" || tl.type === "transfer") return tl;
    const leg = plan.legs.find(l => l.id === tl.id);
    return { ...tl, status: leg?.status || tl.status };
  });

  const flightLegMap = {
    miami: "miami-sanjose",
    guanacaste: null,
    arenal: "costarica-orlando",
    orlando: null
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#0a1628 0%,#0d2137 50%,#0a1e1a 100%)", fontFamily: "Georgia,serif", color: "#e8dcc8" }}>
      {notification && <div style={{ position: "fixed", top: 16, right: 16, zIndex: 100, background: "#e2c97e", color: "#0a1628", padding: "10px 18px", borderRadius: 8, fontWeight: "bold", fontSize: 13 }}>{notification}</div>}

      {/* REPLAN COMPARISON MODAL */}
      {proposedPlan && replanDiff && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ width: "100%", maxWidth: 560, maxHeight: "85vh", overflow: "auto", background: "#0d2137", border: "2px solid #e2c97e", borderRadius: 16, padding: "20px 18px" }}>
            <h2 style={{ margin: "0 0 4px", fontSize: 18, color: "#e2c97e", fontWeight: "normal" }}>Proposed Changes</h2>
            <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 16, fontStyle: "italic" }}>"{replanRequest}"</div>

            {/* Leg changes */}
            {replanDiff.legChanges.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 9, letterSpacing: 2, opacity: 0.4, textTransform: "uppercase", marginBottom: 8 }}>Itinerary changes</div>
                {replanDiff.legChanges.map((ch, i) => (
                  <div key={i} style={{
                    padding: "10px 12px",
                    marginBottom: 6,
                    borderRadius: 8,
                    border: `1px solid ${ch.type === "added" ? "rgba(74,222,128,0.4)" : ch.type === "removed" ? "rgba(248,113,113,0.4)" : "rgba(226,201,126,0.3)"}`,
                    background: ch.type === "added" ? "rgba(74,222,128,0.06)" : ch.type === "removed" ? "rgba(248,113,113,0.06)" : "rgba(226,201,126,0.04)"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{
                        fontSize: 9, padding: "2px 7px", borderRadius: 10, fontWeight: "bold", letterSpacing: 1, textTransform: "uppercase",
                        background: ch.type === "added" ? "rgba(74,222,128,0.15)" : ch.type === "removed" ? "rgba(248,113,113,0.15)" : "rgba(226,201,126,0.1)",
                        color: ch.type === "added" ? "#4ade80" : ch.type === "removed" ? "#f87171" : "#e2c97e"
                      }}>
                        {ch.type === "added" ? "+ Added" : ch.type === "removed" ? "- Removed" : "~ Changed"}
                      </span>
                      <span style={{ fontSize: 13, color: "#e2c97e" }}>{ch.leg.icon} {ch.leg.label}</span>
                    </div>
                    {ch.type === "modified" && ch.diffs && (
                      <div style={{ marginTop: 6, paddingLeft: 4 }}>
                        {ch.diffs.map((d, di) => (
                          <div key={di} style={{ fontSize: 11, opacity: 0.7, marginBottom: 2 }}>{d}</div>
                        ))}
                      </div>
                    )}
                    {ch.type !== "modified" && (
                      <div style={{ marginTop: 4, fontSize: 11, opacity: 0.6 }}>
                        {ch.leg.dates} . {ch.leg.nights}n . {ch.leg.location}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Flight changes */}
            {replanDiff.flightChanges.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 9, letterSpacing: 2, opacity: 0.4, textTransform: "uppercase", marginBottom: 8 }}>Flight changes</div>
                {replanDiff.flightChanges.map((ch, i) => (
                  <div key={i} style={{
                    padding: "8px 12px",
                    marginBottom: 6,
                    borderRadius: 8,
                    border: `1px solid ${ch.type === "added" ? "rgba(74,222,128,0.3)" : ch.type === "removed" ? "rgba(248,113,113,0.3)" : "rgba(56,189,248,0.3)"}`,
                    background: ch.type === "added" ? "rgba(74,222,128,0.06)" : ch.type === "removed" ? "rgba(248,113,113,0.06)" : "rgba(56,189,248,0.04)"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{
                        fontSize: 9, padding: "2px 7px", borderRadius: 10, fontWeight: "bold", letterSpacing: 1, textTransform: "uppercase",
                        background: ch.type === "added" ? "rgba(74,222,128,0.15)" : ch.type === "removed" ? "rgba(248,113,113,0.15)" : "rgba(56,189,248,0.1)",
                        color: ch.type === "added" ? "#4ade80" : ch.type === "removed" ? "#f87171" : "#38bdf8"
                      }}>
                        {ch.type === "added" ? "+ Added" : ch.type === "removed" ? "- Removed" : "~ Changed"}
                      </span>
                      <span style={{ fontSize: 12, color: "#38bdf8" }}>{ch.flight.label}</span>
                    </div>
                    <div style={{ fontSize: 11, opacity: 0.6, marginTop: 3 }}>{ch.flight.detail}</div>
                    {ch.type === "modified" && ch.old && (
                      <div style={{ fontSize: 10, opacity: 0.4, marginTop: 2, textDecoration: "line-through" }}>Was: {ch.old.label} - {ch.old.detail}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Budget change notice */}
            {replanDiff.budgetChanged && (
              <div style={{ marginBottom: 14, padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(226,201,126,0.3)", background: "rgba(226,201,126,0.04)" }}>
                <div style={{ fontSize: 9, letterSpacing: 2, opacity: 0.4, textTransform: "uppercase", marginBottom: 6 }}>Budget updated</div>
                <div style={{ fontSize: 14, color: "#e2c97e" }}>{proposedPlan.budget.total}</div>
                {proposedPlan.budget.items.map((item, i) => (
                  <div key={i} style={{ fontSize: 11, opacity: 0.6, marginTop: 3 }}>{item.label}: {item.estimate}</div>
                ))}
              </div>
            )}

            {replanDiff.legChanges.length === 0 && replanDiff.flightChanges.length === 0 && !replanDiff.budgetChanged && (
              <div style={{ padding: "20px 0", textAlign: "center", opacity: 0.5, fontStyle: "italic", fontSize: 13 }}>No structural changes detected. The AI may have made minor adjustments to notes or day plans.</div>
            )}

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button onClick={acceptReplan} style={{ flex: 1, padding: "12px", background: "linear-gradient(135deg,#4ade80,#22c55e)", border: "none", borderRadius: 8, color: "#0a1628", fontFamily: "Georgia,serif", fontSize: 13, fontWeight: "bold", cursor: "pointer" }}>
                Accept new plan
              </button>
              <button onClick={rejectReplan} style={{ flex: 1, padding: "12px", background: "transparent", border: "1px solid rgba(248,113,113,0.4)", borderRadius: 8, color: "#f87171", fontFamily: "Georgia,serif", fontSize: 13, cursor: "pointer" }}>
                Keep current
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div style={{ padding: "24px 16px 16px", borderBottom: "1px solid rgba(226,201,126,0.15)" }}>
        <div style={{ fontSize: 10, letterSpacing: 4, color: "#e2c97e", opacity: 0.6, marginBottom: 5, textTransform: "uppercase" }}>Family Holiday Planner</div>
        <h1 style={{ margin: 0, fontSize: "clamp(18px,5vw,26px)", fontWeight: "normal", color: "#e2c97e" }}>{plan.trip.name}</h1>
        <div style={{ marginTop: 5, fontSize: 12, opacity: 0.6, display: "flex", gap: 12, flexWrap: "wrap" }}><span>{plan.trip.dates}</span><span>{plan.trip.party}</span></div>
        <div style={{ marginTop: 14, display: "flex", gap: 12 }}>
          {[{ label: "Legs booked", val: bookedCount, total: plan.legs.length, grad: "linear-gradient(90deg,#e2c97e,#4ade80)" }, { label: "Tasks done", val: doneTasks, total: totalTasks, grad: "linear-gradient(90deg,#4ade80,#38bdf8)" }].map(b => (
            <div key={b.label} style={{ flex: 1 }}>
              <div style={{ fontSize: 9, letterSpacing: 1, opacity: 0.45, marginBottom: 4, textTransform: "uppercase" }}>{b.label}</div>
              <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" }}><div style={{ height: "100%", width: `${(b.val / b.total) * 100}%`, background: b.grad, borderRadius: 2, transition: "width 0.4s" }} /></div>
              <div style={{ fontSize: 10, marginTop: 3, opacity: 0.5 }}>{b.val} of {b.total}</div>
            </div>
          ))}
        </div>
      </div>

      {/* VISUAL TIMELINE */}
      <div style={{ borderBottom: "1px solid rgba(226,201,126,0.1)", background: "rgba(0,0,0,0.15)", padding: "14px 0 10px" }}>
        <div style={{ fontSize: 9, letterSpacing: 2, opacity: 0.4, textTransform: "uppercase", padding: "0 16px", marginBottom: 10 }}>Aug 4 - 24 Timeline</div>
        <div ref={timelineRef} style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", padding: "0 16px 6px", scrollbarWidth: "thin" }}>
          <div style={{ display: "flex", alignItems: "center", minWidth: 580, gap: 0 }}>
            {timelineData.map((block) => {
              if (block.type === "flight" || block.type === "transfer") {
                return (
                  <div key={block.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "0 3px", flexShrink: 0, width: 40 }}>
                    <div style={{ fontSize: 14, lineHeight: 1 }}>{block.type === "flight" ? "\u2708\uFE0F" : "\u{1F698}"}</div>
                    <div style={{ fontSize: 8, opacity: 0.4, marginTop: 2, whiteSpace: "nowrap" }}>{block.label}</div>
                    <div style={{ width: 20, height: 2, background: "rgba(226,201,126,0.3)", marginTop: 4, borderRadius: 1 }} />
                  </div>
                );
              }
              const statusColor = block.status === "booked" ? "#4ade80" : block.status === "partial" ? "#fbbf24" : "#f87171";
              const bgColor = block.status === "booked" ? "rgba(74,222,128,0.12)" : block.status === "partial" ? "rgba(251,191,36,0.12)" : "rgba(248,113,113,0.08)";
              const widthPx = Math.max(block.days * 48, 48);
              return (
                <div
                  key={block.id}
                  onClick={() => scrollToLeg(block.id)}
                  style={{
                    width: widthPx,
                    flexShrink: 0,
                    background: bgColor,
                    border: `1px solid ${statusColor}40`,
                    borderRadius: 8,
                    padding: "8px 6px",
                    cursor: "pointer",
                    textAlign: "center",
                    transition: "transform 0.15s",
                    position: "relative"
                  }}
                >
                  <div style={{ fontSize: 16, lineHeight: 1 }}>{block.icon}</div>
                  <div style={{ fontSize: 9, color: "#e2c97e", marginTop: 3, fontWeight: "bold", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{block.label}</div>
                  <div style={{ fontSize: 8, opacity: 0.4, marginTop: 2 }}>{block.days}n</div>
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, borderRadius: "0 0 7px 7px", background: statusColor }} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* TAB BAR */}
      <div style={{ display: "flex", borderBottom: "1px solid rgba(226,201,126,0.1)", background: "rgba(0,0,0,0.2)" }}>
        {["itinerary", "calendar", "flights", "budget", "notes"].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ flex: 1, padding: "12px 4px", border: "none", background: "transparent", color: activeTab === tab ? "#e2c97e" : "rgba(232,220,200,0.35)", fontSize: "clamp(9px,2.5vw,11px)", letterSpacing: 1, textTransform: "uppercase", cursor: "pointer", borderBottom: activeTab === tab ? "2px solid #e2c97e" : "2px solid transparent" }}>{tab}</button>
        ))}
      </div>

      {/* CONTENT */}
      <div style={{ padding: "14px 14px 90px", maxWidth: 640, margin: "0 auto" }}>

        {/* ITINERARY TAB */}
        {activeTab === "itinerary" && (
          <>
            {/* AI REPLAN SECTION */}
            <div style={{
              marginBottom: 16,
              padding: "16px",
              background: "rgba(226,201,126,0.04)",
              border: "2px solid rgba(226,201,126,0.35)",
              borderRadius: 14
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 13, color: "#e2c97e", fontWeight: "bold" }}>AI Replan</div>
                  <div style={{ fontSize: 10, opacity: 0.45, marginTop: 2 }}>Describe changes in plain English</div>
                </div>
                {plan.replanHistory && plan.replanHistory.length > 0 && (
                  <button onClick={undoLastReplan} style={{
                    fontSize: 10, padding: "4px 10px", background: "transparent",
                    border: "1px solid rgba(226,201,126,0.25)", borderRadius: 6,
                    color: "rgba(226,201,126,0.6)", cursor: "pointer", fontFamily: "Georgia,serif"
                  }}>
                    Undo last replan ({plan.replanHistory.length})
                  </button>
                )}
              </div>
              <textarea
                value={replanRequest}
                onChange={e => setReplanRequest(e.target.value)}
                placeholder="Describe how you'd like to change the trip..."
                rows={2}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitReplan(); } }}
                style={{
                  width: "100%", boxSizing: "border-box", padding: "10px 12px",
                  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(226,201,126,0.25)",
                  borderRadius: 8, color: "#e8dcc8", fontSize: 12, fontFamily: "Georgia,serif",
                  resize: "vertical", outline: "none", lineHeight: 1.5
                }}
              />
              <button
                onClick={submitReplan}
                disabled={replanning || !replanRequest.trim()}
                style={{
                  marginTop: 8, width: "100%", padding: "11px",
                  background: replanning
                    ? "rgba(226,201,126,0.08)"
                    : replanRequest.trim()
                      ? "linear-gradient(135deg,#e2c97e,#c9a84c)"
                      : "rgba(226,201,126,0.08)",
                  border: replanning ? "1px solid rgba(226,201,126,0.2)" : "none",
                  borderRadius: 8,
                  color: replanning ? "rgba(226,201,126,0.5)" : replanRequest.trim() ? "#0a1628" : "rgba(226,201,126,0.3)",
                  fontFamily: "Georgia,serif", fontSize: 13, fontWeight: "bold",
                  cursor: replanning || !replanRequest.trim() ? "default" : "pointer",
                  position: "relative", overflow: "hidden"
                }}
              >
                {replanning ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid rgba(226,201,126,0.3)", borderTopColor: "#e2c97e", borderRadius: "50%", animation: "replanSpin 0.8s linear infinite" }} />
                    Replanning...
                  </span>
                ) : "Replan with AI"}
              </button>
            </div>

            {/* LEG CARDS */}
            {plan.legs.map(leg => {
              const sc = STATUS_CONFIG[leg.status], isExp = expandedLeg === leg.id, winner = getWinner(leg.id, leg.options), totalLegVotes = Object.keys(getVotesForLeg(leg.id)).length, doneLegTasks = leg.tasks.filter(t => t.done).length;
              const flightKey = flightLegMap[leg.id];
              const flightOpts = flightKey ? (plan.flightOptions?.[flightKey] || []) : [];
              return (
                <div key={leg.id} ref={el => legRefs.current[leg.id] = el} style={{ marginBottom: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(226,201,126,0.12)", borderRadius: 14, overflow: "hidden" }}>
                  <div style={{ padding: "14px 14px 0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <span style={{ fontSize: 22 }}>{leg.icon}</span>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: "bold", color: "#e2c97e" }}>{leg.label}</div>
                          <div style={{ fontSize: 11, opacity: 0.5, marginTop: 2 }}>{leg.dates} . {leg.nights}n . {leg.location}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                        <div style={{ fontSize: 10, padding: "3px 9px", borderRadius: 20, background: sc.bg, color: sc.color }}>{sc.label}</div>
                        {winner && <div style={{ fontSize: 9, padding: "2px 7px", borderRadius: 20, background: "rgba(226,201,126,0.1)", color: "#e2c97e" }}>{winner.name}</div>}
                      </div>
                    </div>
                    <div style={{ marginTop: 8, fontSize: 12, opacity: 0.55, lineHeight: 1.5, fontStyle: "italic" }}>{leg.notes}</div>
                  </div>
                  <div style={{ padding: "10px 14px 14px", display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button onClick={() => setExpandedLeg(isExp ? null : leg.id)} style={{ fontSize: 12, padding: "7px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(226,201,126,0.2)", borderRadius: 8, color: "rgba(226,201,126,0.8)", cursor: "pointer", fontFamily: "Georgia,serif" }}>
                      {isExp ? "\u25B2 Hide tasks" : `\u25BC Tasks (${doneLegTasks}/${leg.tasks.length})`}
                    </button>
                    <button onClick={() => { setExpandedLeg(leg.id); researchLeg(leg); }} disabled={researching[leg.id]} style={{ fontSize: 12, padding: "7px 14px", background: researching[leg.id] ? "rgba(226,201,126,0.05)" : "linear-gradient(135deg,rgba(226,201,126,0.2),rgba(226,201,126,0.08))", border: "1px solid rgba(226,201,126,0.4)", borderRadius: 8, color: researching[leg.id] ? "rgba(226,201,126,0.4)" : "#e2c97e", cursor: researching[leg.id] ? "default" : "pointer", fontFamily: "Georgia,serif", fontWeight: "bold" }}>
                      {researching[leg.id] ? "Searching..." : leg.options?.length > 0 ? `Re-search (${leg.options.length})` : "Find options"}
                    </button>
                  </div>
                  {isExp && (
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ padding: "12px 14px" }}>
                        <div style={{ fontSize: 9, letterSpacing: 1.5, opacity: 0.4, marginBottom: 8, textTransform: "uppercase" }}>Tasks</div>
                        {leg.tasks.map(task => (
                          <div key={task.id} onClick={() => toggleTask(leg.id, task.id)} style={{ display: "flex", alignItems: "flex-start", gap: 9, padding: "7px 0", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                            <div style={{ width: 16, height: 16, borderRadius: 3, flexShrink: 0, marginTop: 1, border: task.done ? "none" : "1px solid rgba(226,201,126,0.3)", background: task.done ? "#4ade80" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              {task.done && <span style={{ fontSize: 10, color: "#0a1628", fontWeight: "bold" }}>&#10003;</span>}
                            </div>
                            <span style={{ fontSize: 12, opacity: task.done ? 0.35 : 0.8, textDecoration: task.done ? "line-through" : "none", lineHeight: 1.4 }}>{task.text}</span>
                          </div>
                        ))}
                        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                          <button onClick={() => toggleLegBooked(leg.id)} style={{ fontSize: 11, padding: "5px 12px", background: leg.booked ? "rgba(74,222,128,0.1)" : "transparent", border: `1px solid ${leg.booked ? "#4ade80" : "rgba(226,201,126,0.2)"}`, borderRadius: 6, color: leg.booked ? "#4ade80" : "rgba(226,201,126,0.6)", cursor: "pointer", fontFamily: "Georgia,serif" }}>
                            {leg.booked ? "\u2713 Marked booked" : "Mark as booked"}
                          </button>
                          {flightKey && (
                            <button
                              onClick={() => researchFlights(flightKey)}
                              disabled={researchingFlights[flightKey]}
                              style={{
                                fontSize: 11,
                                padding: "5px 12px",
                                background: researchingFlights[flightKey] ? "rgba(226,201,126,0.05)" : "linear-gradient(135deg,rgba(56,189,248,0.2),rgba(56,189,248,0.08))",
                                border: "1px solid rgba(56,189,248,0.4)",
                                borderRadius: 6,
                                color: researchingFlights[flightKey] ? "rgba(56,189,248,0.4)" : "#38bdf8",
                                cursor: researchingFlights[flightKey] ? "default" : "pointer",
                                fontFamily: "Georgia,serif",
                                fontWeight: "bold"
                              }}
                            >
                              {researchingFlights[flightKey] ? "Searching flights..." : flightOpts.length > 0 ? `\u2708\uFE0F Re-search flights (${flightOpts.length})` : "\u2708\uFE0F Research flights"}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Flight options display */}
                      {flightKey && flightOpts.length > 0 && (
                        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "12px 14px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                            <div style={{ fontSize: 9, letterSpacing: 1.5, opacity: 0.4, textTransform: "uppercase" }}>\u2708\uFE0F {flightOpts.length} flight options</div>
                            <button onClick={() => { const updated = { ...plan, flightOptions: { ...plan.flightOptions, [flightKey]: [] } }; setPlan(updated); savePlan(updated); }} style={{ fontSize: 10, padding: "3px 8px", background: "transparent", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 5, color: "rgba(248,113,113,0.6)", cursor: "pointer", fontFamily: "Georgia,serif" }}>Clear</button>
                          </div>
                          {flightOpts.map(opt => (
                            <div key={opt.id} style={{ marginBottom: 8, padding: "10px 12px", background: "rgba(56,189,248,0.04)", border: "1px solid rgba(56,189,248,0.15)", borderRadius: 10 }}>
                              <div style={{ fontSize: 13, color: "#38bdf8", fontWeight: "bold" }}>{opt.name}</div>
                              <div style={{ fontSize: 11, opacity: 0.5, marginTop: 2, fontStyle: "italic" }}>{opt.tagline}</div>
                              <div style={{ fontSize: 11, color: "#4ade80", marginTop: 4 }}>{opt.price}</div>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
                                <div>
                                  <div style={{ fontSize: 9, letterSpacing: 1, opacity: 0.4, textTransform: "uppercase", marginBottom: 4 }}>Pros</div>
                                  {(opt.pros || []).map((p, pi) => <div key={pi} style={{ fontSize: 10, opacity: 0.75, marginBottom: 2, lineHeight: 1.4 }}>{p}</div>)}
                                </div>
                                <div>
                                  <div style={{ fontSize: 9, letterSpacing: 1, opacity: 0.4, textTransform: "uppercase", marginBottom: 4 }}>Cons</div>
                                  {(opt.cons || []).map((c, ci) => <div key={ci} style={{ fontSize: 10, opacity: 0.75, marginBottom: 2, lineHeight: 1.4 }}>{c}</div>)}
                                </div>
                              </div>
                              {opt.bookingTip && <div style={{ marginTop: 8, padding: "6px 8px", background: "rgba(56,189,248,0.06)", borderRadius: 5, fontSize: 10, opacity: 0.8, lineHeight: 1.4 }}>{opt.bookingTip}</div>}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Accommodation options */}
                      {leg.options?.length > 0 && (
                        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "12px 14px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                            <div style={{ fontSize: 9, letterSpacing: 1.5, opacity: 0.4, textTransform: "uppercase" }}>{leg.options.length} options . {totalLegVotes} vote{totalLegVotes !== 1 ? "s" : ""}</div>
                            <button onClick={() => clearOptions(leg.id)} style={{ fontSize: 10, padding: "3px 8px", background: "transparent", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 5, color: "rgba(248,113,113,0.6)", cursor: "pointer", fontFamily: "Georgia,serif" }}>Clear</button>
                          </div>
                          <input value={voterName} onChange={e => setVoterName(e.target.value)} placeholder="Your name to vote..." style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", marginBottom: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(226,201,126,0.15)", borderRadius: 7, color: "#e8dcc8", fontSize: 12, fontFamily: "Georgia,serif", outline: "none" }} />
                          {leg.options.map(opt => {
                            const optVoters = getVotesForOption(leg.id, opt.id), myVote = voterName && getVotesForLeg(leg.id)[voterName] === opt.id, isWin = winner?.id === opt.id && optVoters.length > 0, pct = totalLegVotes > 0 ? Math.round((optVoters.length / totalLegVotes) * 100) : 0, isExpOpt = expandedOption === `${leg.id}-${opt.id}`;
                            return (
                              <div key={opt.id} style={{ marginBottom: 9, background: isWin ? "rgba(226,201,126,0.05)" : "rgba(255,255,255,0.02)", border: `1px solid ${isWin ? "rgba(226,201,126,0.35)" : myVote ? "rgba(74,222,128,0.2)" : "rgba(255,255,255,0.07)"}`, borderRadius: 10, overflow: "hidden" }}>
                                <div style={{ padding: "11px 12px" }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                                    <div style={{ flex: 1 }}>
                                      <div style={{ fontSize: 13, color: "#e2c97e", fontWeight: "bold" }}>{isWin ? "\uD83C\uDFC6 " : ""}{opt.name}</div>
                                      <div style={{ fontSize: 11, opacity: 0.5, marginTop: 2, fontStyle: "italic" }}>{opt.tagline}</div>
                                      <div style={{ fontSize: 11, color: "#4ade80", marginTop: 4 }}>{opt.price}</div>
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5 }}>
                                      <div style={{ fontSize: 11, color: "#e2c97e" }}>{"★".repeat(Math.round(opt.rating || 4))}{"☆".repeat(5 - Math.round(opt.rating || 4))}</div>
                                      <button onClick={() => castVote(leg.id, opt.id)} style={{ fontSize: 11, padding: "5px 12px", background: myVote ? "rgba(74,222,128,0.15)" : "rgba(226,201,126,0.1)", border: `1px solid ${myVote ? "#4ade80" : "rgba(226,201,126,0.3)"}`, borderRadius: 6, color: myVote ? "#4ade80" : "#e2c97e", cursor: "pointer", fontFamily: "Georgia,serif", fontWeight: "bold" }}>
                                        {myVote ? "\u2713 Voted" : "Vote"}
                                      </button>
                                    </div>
                                  </div>
                                  {totalLegVotes > 0 && (<div style={{ marginTop: 8 }}><div style={{ height: 3, background: "rgba(255,255,255,0.07)", borderRadius: 2, overflow: "hidden" }}><div style={{ height: "100%", width: `${pct}%`, background: isWin ? "#e2c97e" : "#4ade80", borderRadius: 2, transition: "width 0.4s" }} /></div><div style={{ fontSize: 10, opacity: 0.45, marginTop: 3 }}>{optVoters.length} vote{optVoters.length !== 1 ? "s" : ""} . {pct}%</div></div>)}
                                  {optVoters.length > 0 && (<div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>{optVoters.map((name, vi) => (<div key={name} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 10, background: `${VOTER_COLORS[vi % VOTER_COLORS.length]}18`, border: `1px solid ${VOTER_COLORS[vi % VOTER_COLORS.length]}40`, color: VOTER_COLORS[vi % VOTER_COLORS.length] }}>{name}</div>))}</div>)}
                                  <button onClick={() => setExpandedOption(isExpOpt ? null : `${leg.id}-${opt.id}`)} style={{ marginTop: 7, fontSize: 10, padding: "3px 8px", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, color: "rgba(232,220,200,0.4)", cursor: "pointer", fontFamily: "Georgia,serif" }}>{isExpOpt ? "\u25B2 Less" : "\u25BC Pros, cons & tip"}</button>
                                </div>
                                {isExpOpt && (<div style={{ padding: "0 12px 12px", borderTop: "1px solid rgba(255,255,255,0.05)" }}><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}><div><div style={{ fontSize: 9, letterSpacing: 1, opacity: 0.4, textTransform: "uppercase", marginBottom: 5 }}>Pros</div>{(opt.pros || []).map((p, pi) => <div key={pi} style={{ fontSize: 11, opacity: 0.75, marginBottom: 3, lineHeight: 1.4 }}>{p}</div>)}</div><div><div style={{ fontSize: 9, letterSpacing: 1, opacity: 0.4, textTransform: "uppercase", marginBottom: 5 }}>Cons</div>{(opt.cons || []).map((c, ci) => <div key={ci} style={{ fontSize: 11, opacity: 0.75, marginBottom: 3, lineHeight: 1.4 }}>{c}</div>)}</div></div>{opt.bookingTip && <div style={{ marginTop: 10, padding: "8px 10px", background: "rgba(226,201,126,0.06)", borderRadius: 6, fontSize: 11, opacity: 0.8, lineHeight: 1.5 }}>{opt.bookingTip}</div>}</div>)}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}

        {/* CALENDAR TAB */}
        {activeTab === "calendar" && (
          <div>
            <div style={{ fontSize: 9, letterSpacing: 2, opacity: 0.4, textTransform: "uppercase", marginBottom: 12 }}>Day-by-day planner . Aug 4-24</div>
            {TRIP_DATES.map(({ day, dayName, dateStr }) => {
              const leg = getLegForDate(dateStr, plan.legs);
              const flight = getFlightForDate(dateStr);
              const note = plan.dayNotes?.[dateStr] || "";
              const isEditing = editingDay === dateStr;
              const statusColor = leg ? (STATUS_CONFIG[leg.status]?.color || "#f87171") : "rgba(226,201,126,0.3)";
              const statusBg = leg ? (STATUS_CONFIG[leg.status]?.bg || "rgba(248,113,113,0.08)") : "rgba(255,255,255,0.02)";

              return (
                <div
                  key={dateStr}
                  style={{
                    marginBottom: 6,
                    background: statusBg,
                    border: "1px solid rgba(226,201,126,0.1)",
                    borderLeft: `4px solid ${statusColor}`,
                    borderRadius: "0 10px 10px 0",
                    padding: "10px 12px",
                    cursor: "pointer",
                    transition: "background 0.15s"
                  }}
                  onClick={() => {
                    if (!isEditing) {
                      setEditingDay(dateStr);
                      setEditDayText(note);
                    }
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", minWidth: 0 }}>
                      <div style={{ width: 44, flexShrink: 0 }}>
                        <div style={{ fontSize: 10, opacity: 0.4, lineHeight: 1 }}>{dayName}</div>
                        <div style={{ fontSize: 18, color: "#e2c97e", fontWeight: "bold", lineHeight: 1.2 }}>{day}</div>
                      </div>
                      {leg && <span style={{ fontSize: 16, flexShrink: 0 }}>{leg.icon}</span>}
                      <div style={{ minWidth: 0, flex: 1 }}>
                        {leg && <div style={{ fontSize: 10, color: "#e2c97e", opacity: 0.7, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{leg.label}</div>}
                        {!leg && dateStr === "2026-08-24" && <div style={{ fontSize: 10, color: "#e2c97e", opacity: 0.7, marginBottom: 2 }}>Travel home</div>}
                        {isEditing ? (
                          <div style={{ display: "flex", gap: 6, alignItems: "center" }} onClick={e => e.stopPropagation()}>
                            <input
                              autoFocus
                              value={editDayText}
                              onChange={e => setEditDayText(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === "Enter") { updateDayNote(dateStr, editDayText); setEditingDay(null); }
                                if (e.key === "Escape") setEditingDay(null);
                              }}
                              onBlur={() => { updateDayNote(dateStr, editDayText); setEditingDay(null); }}
                              style={{ flex: 1, padding: "4px 8px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(226,201,126,0.3)", borderRadius: 5, color: "#e8dcc8", fontSize: 11, fontFamily: "Georgia,serif", outline: "none" }}
                            />
                          </div>
                        ) : (
                          <div style={{ fontSize: 11, opacity: note ? 0.7 : 0.3, lineHeight: 1.4, fontStyle: note ? "normal" : "italic" }}>
                            {note || "Tap to add note..."}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, flexShrink: 0 }}>
                      {flight && (
                        <div style={{ fontSize: 10, padding: "2px 7px", borderRadius: 12, background: "rgba(56,189,248,0.12)", color: "#38bdf8", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 3 }}>
                          <span>\u2708\uFE0F</span>
                          <span>{flight.label}</span>
                        </div>
                      )}
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor, flexShrink: 0 }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* FLIGHTS TAB */}
        {activeTab === "flights" && (
          <div>
            {plan.flights.map(f => (
              <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 14px", marginBottom: 9, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(226,201,126,0.1)", borderRadius: 10 }}>
                <div>
                  <div style={{ fontSize: 14, color: "#e2c97e" }}>{f.label}</div>
                  <div style={{ fontSize: 11, opacity: 0.5, marginTop: 3 }}>{f.detail}</div>
                </div>
                <div style={{ fontSize: 10, padding: "3px 9px", borderRadius: 20, background: f.booked ? "rgba(74,222,128,0.12)" : "rgba(248,113,113,0.12)", color: f.booked ? "#4ade80" : "#f87171" }}>{f.booked ? "Booked" : "To book"}</div>
              </div>
            ))}

            {/* Flight research section */}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 9, letterSpacing: 2, opacity: 0.4, textTransform: "uppercase", marginBottom: 10 }}>Research unbooked flights</div>
              {Object.entries(FLIGHT_RESEARCH_PROMPTS).map(([key, _]) => {
                const flightOpts = plan.flightOptions?.[key] || [];
                const label = key === "miami-sanjose" ? "Miami \u2192 San Jose (5 Aug)" : "San Jose \u2192 Orlando (18 Aug)";
                return (
                  <div key={key} style={{ marginBottom: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(56,189,248,0.15)", borderRadius: 12, padding: "12px 14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: flightOpts.length > 0 ? 10 : 0 }}>
                      <div style={{ fontSize: 13, color: "#38bdf8" }}>\u2708\uFE0F {label}</div>
                      <button
                        onClick={() => researchFlights(key)}
                        disabled={researchingFlights[key]}
                        style={{
                          fontSize: 11,
                          padding: "6px 14px",
                          background: researchingFlights[key] ? "rgba(56,189,248,0.05)" : "linear-gradient(135deg,rgba(56,189,248,0.2),rgba(56,189,248,0.08))",
                          border: "1px solid rgba(56,189,248,0.4)",
                          borderRadius: 7,
                          color: researchingFlights[key] ? "rgba(56,189,248,0.4)" : "#38bdf8",
                          cursor: researchingFlights[key] ? "default" : "pointer",
                          fontFamily: "Georgia,serif",
                          fontWeight: "bold"
                        }}
                      >
                        {researchingFlights[key] ? "Searching..." : flightOpts.length > 0 ? "Re-search" : "Find flights"}
                      </button>
                    </div>
                    {flightOpts.length > 0 && (
                      <div>
                        {flightOpts.map(opt => (
                          <div key={opt.id} style={{ marginBottom: 8, padding: "10px 12px", background: "rgba(56,189,248,0.04)", border: "1px solid rgba(56,189,248,0.1)", borderRadius: 8 }}>
                            <div style={{ fontSize: 13, color: "#38bdf8", fontWeight: "bold" }}>{opt.name}</div>
                            <div style={{ fontSize: 11, opacity: 0.5, marginTop: 2, fontStyle: "italic" }}>{opt.tagline}</div>
                            <div style={{ fontSize: 11, color: "#4ade80", marginTop: 4 }}>{opt.price}</div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
                              <div>
                                <div style={{ fontSize: 9, letterSpacing: 1, opacity: 0.4, textTransform: "uppercase", marginBottom: 4 }}>Pros</div>
                                {(opt.pros || []).map((p, pi) => <div key={pi} style={{ fontSize: 10, opacity: 0.75, marginBottom: 2, lineHeight: 1.4 }}>{p}</div>)}
                              </div>
                              <div>
                                <div style={{ fontSize: 9, letterSpacing: 1, opacity: 0.4, textTransform: "uppercase", marginBottom: 4 }}>Cons</div>
                                {(opt.cons || []).map((c, ci) => <div key={ci} style={{ fontSize: 10, opacity: 0.75, marginBottom: 2, lineHeight: 1.4 }}>{c}</div>)}
                              </div>
                            </div>
                            {opt.bookingTip && <div style={{ marginTop: 8, padding: "6px 8px", background: "rgba(56,189,248,0.06)", borderRadius: 5, fontSize: 10, opacity: 0.8, lineHeight: 1.4 }}>{opt.bookingTip}</div>}
                          </div>
                        ))}
                        <button
                          onClick={() => { const updated = { ...plan, flightOptions: { ...plan.flightOptions, [key]: [] } }; setPlan(updated); savePlan(updated); }}
                          style={{ fontSize: 10, padding: "3px 8px", background: "transparent", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 5, color: "rgba(248,113,113,0.6)", cursor: "pointer", fontFamily: "Georgia,serif" }}
                        >Clear results</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* BUDGET TAB */}
        {activeTab === "budget" && (
          <div>
            <div style={{ padding: "18px", marginBottom: 14, background: "rgba(226,201,126,0.06)", border: "1px solid rgba(226,201,126,0.2)", borderRadius: 12, textAlign: "center" }}>
              <div style={{ fontSize: 9, letterSpacing: 2, opacity: 0.5, textTransform: "uppercase", marginBottom: 6 }}>Total budget</div>
              <div style={{ fontSize: 26, color: "#e2c97e" }}>{plan.budget.total}</div>
              <div style={{ fontSize: 11, opacity: 0.4, marginTop: 4 }}>Accommodation & internal travel . Flights separate</div>
            </div>
            {plan.budget.items.map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 14px", marginBottom: 7, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(226,201,126,0.08)", borderRadius: 10 }}>
                <div style={{ fontSize: 13, opacity: 0.8 }}>{item.label}</div>
                <div style={{ fontSize: 13, color: "#e2c97e" }}>{item.estimate}</div>
              </div>
            ))}
          </div>
        )}

        {/* NOTES TAB */}
        {activeTab === "notes" && (
          <div>
            {plan.comments.length === 0 && <div style={{ textAlign: "center", opacity: 0.4, padding: "40px 0", fontSize: 13, fontStyle: "italic" }}>No comments yet.</div>}
            {plan.comments.map(c => (
              <div key={c.id} style={{ padding: "12px 14px", marginBottom: 9, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(226,201,126,0.1)", borderRadius: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 13, color: "#e2c97e", fontWeight: "bold" }}>{c.author}</span>
                  <span style={{ fontSize: 10, opacity: 0.4 }}>{c.time}</span>
                </div>
                <div style={{ fontSize: 13, opacity: 0.8, lineHeight: 1.5 }}>{c.text}</div>
              </div>
            ))}
            <div style={{ marginTop: 12, padding: "14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(226,201,126,0.15)", borderRadius: 12 }}>
              <input value={commenterName} onChange={e => setCommenterName(e.target.value)} placeholder="Your name" style={{ width: "100%", boxSizing: "border-box", padding: "9px 11px", marginBottom: 9, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(226,201,126,0.15)", borderRadius: 7, color: "#e8dcc8", fontSize: 13, fontFamily: "Georgia,serif", outline: "none" }} />
              <textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Comment, question or suggestion..." rows={3} style={{ width: "100%", boxSizing: "border-box", padding: "9px 11px", marginBottom: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(226,201,126,0.15)", borderRadius: 7, color: "#e8dcc8", fontSize: 13, fontFamily: "Georgia,serif", resize: "vertical", outline: "none" }} />
              <button onClick={addComment} style={{ width: "100%", padding: "11px", background: "linear-gradient(135deg,#e2c97e,#c9a84c)", border: "none", borderRadius: 7, color: "#0a1628", fontFamily: "Georgia,serif", fontSize: 13, fontWeight: "bold", cursor: "pointer" }}>Add Comment</button>
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM BAR */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "9px 14px", background: "rgba(10,22,40,0.96)", borderTop: "1px solid rgba(226,201,126,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center", backdropFilter: "blur(10px)" }}>
        <div style={{ fontSize: 10, opacity: 0.4 }}>{saving ? "Saving..." : "Saved locally"}</div>
        <button onClick={resetPlan} style={{ fontSize: 10, padding: "4px 10px", background: "transparent", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 5, color: "rgba(248,113,113,0.6)", cursor: "pointer", fontFamily: "Georgia,serif" }}>Reset</button>
      </div>
      <style>{`*{-webkit-tap-highlight-color:transparent}input::placeholder,textarea::placeholder{color:rgba(232,220,200,0.3)}::-webkit-scrollbar{height:4px}::-webkit-scrollbar-track{background:rgba(255,255,255,0.05)}::-webkit-scrollbar-thumb{background:rgba(226,201,126,0.3);border-radius:2px}@keyframes replanSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
