import { useState, useEffect } from "react";

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

const INITIAL_PLAN = {
  trip: { name: "Costa Rica & Orlando 2026", dates: "4 – 24 August 2026", party: "2 families · 3 adults · 5 children" },
  legs: [
    { id: "miami", icon: "✈️", label: "Miami Stopover", dates: "4 Aug", nights: 1, location: "Miami, Florida", status: "todo", booked: false, notes: "Arrive 14:30 BA0207. 1 night to recover. Need hotel near MIA.", tasks: [{ id: "m1", text: "Book 1-night hotel near Miami airport", done: false }, { id: "m2", text: "Book onward flight MIA → San José (5 Aug)", done: false }], options: [] },
    { id: "guanacaste", icon: "🏖️", label: "Guanacaste / Santa Teresa", dates: "5 – 11 Aug", nights: 7, location: "Nicoya Peninsula, Costa Rica", status: "todo", booked: false, notes: "Private villa, pool, 4–5 beds, sleeps 8. Best Pacific option in August — veranillo mini dry season. Beach, surf, wildlife.", tasks: [{ id: "g1", text: "Find & book villa (pool, 4-5 beds, sleeps 8)", done: false }, { id: "g2", text: "Arrange transfer from San José to villa", done: false }, { id: "g3", text: "Research activities: surf lessons, wildlife tours, ATV", done: false }], options: [] },
    { id: "arenal", icon: "🌋", label: "Arenal / La Fortuna", dates: "12 – 17 Aug", nights: 6, location: "La Fortuna, Costa Rica", status: "todo", booked: false, notes: "Jungle villa with pool. Volcano, hot springs, zip-lining, waterfalls. More rain but activities are weather-proof.", tasks: [{ id: "a1", text: "Find & book jungle villa (pool, 4-5 beds, sleeps 8)", done: false }, { id: "a2", text: "Book transfer Guanacaste → Arenal (12 Aug)", done: false }, { id: "a3", text: "Book hot springs visit", done: false }, { id: "a4", text: "Book zip-lining / hanging bridges tour", done: false }, { id: "a5", text: "Book La Fortuna waterfall hike", done: false }, { id: "a6", text: "Book transfer Arenal → San José → Orlando (18 Aug)", done: false }], options: [] },
    { id: "orlando", icon: "🎢", label: "Orlando", dates: "18 – 23 Aug", nights: 5, location: "Orlando, Florida", status: "partial", booked: true, notes: "Hotel already booked but was too long — now 5 nights. Need to amend booking. Drive to Miami 24 Aug for BA0206 17:00.", tasks: [{ id: "o1", text: "Amend hotel booking to 5 nights (18–23 Aug)", done: false }, { id: "o2", text: "Book Universal / Disney park tickets", done: false }, { id: "o3", text: "Arrange drive/transfer Orlando → Miami (24 Aug)", done: false }], options: [] }
  ],
  flights: [
    { id: "f1", label: "LHR → Miami", detail: "BA0207 · 4 Aug · Departs 09:55 · Arrives 14:30", booked: true },
    { id: "f2", label: "Miami → London", detail: "BA0206 · 24 Aug · Departs 17:00", booked: true },
    { id: "f3", label: "Miami → San José", detail: "5 Aug · To book", booked: false },
    { id: "f4", label: "Costa Rica → Orlando", detail: "18 Aug · To book", booked: false }
  ],
  budget: { total: "£5,000 – £8,000", items: [{ label: "Guanacaste villa (7 nights)", estimate: "£2,000–£3,000" }, { label: "Arenal villa (6 nights)", estimate: "£1,500–£2,500" }, { label: "Internal flights & transfers", estimate: "£800–£1,500" }, { label: "Miami hotel (1 night)", estimate: "£150–£250" }] },
  comments: [],
  votes: {}
};

const STATUS_CONFIG = {
  booked: { label: "Booked", color: "#4ade80", bg: "rgba(74,222,128,0.12)" },
  partial: { label: "Partial", color: "#fbbf24", bg: "rgba(251,191,36,0.12)" },
  todo: { label: "To Book", color: "#f87171", bg: "rgba(248,113,113,0.12)" }
};

const VOTER_COLORS = ["#e2c97e", "#4ade80", "#38bdf8", "#f472b6", "#a78bfa"];

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

  useEffect(() => { loadPlan(); }, []);

  const showNotification = (msg) => { setNotification(msg); setTimeout(() => setNotification(null), 2500); };

  const loadPlan = async () => {
    try {
      const saved = localStorage.getItem("cr2026-plan-v3");
      setPlan(saved ? JSON.parse(saved) : INITIAL_PLAN);
    } catch { setPlan(INITIAL_PLAN); }
    setLoading(false);
  };

  const savePlan = async (updated) => {
    setSaving(true);
    try { localStorage.setItem("cr2026-plan-v3", JSON.stringify(updated)); } catch {}
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
    setPlan(updated); savePlan(updated); setNewComment(""); showNotification("Comment added ✓");
  };

  const castVote = (legId, optionId) => {
    if (!voterName.trim()) { showNotification("Enter your name to vote"); return; }
    const updated = { ...plan, votes: { ...plan.votes, [legId]: { ...(plan.votes[legId] || {}), [voterName]: optionId } } };
    setPlan(updated); savePlan(updated); showNotification("Vote cast ✓");
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
      setPlan(updated); savePlan(updated); showNotification("Options found ✓");
    } catch { showNotification("Research failed — try again"); }
    setResearching(r => ({ ...r, [leg.id]: false }));
  };

  const clearOptions = (legId) => {
    const updated = { ...plan, legs: plan.legs.map(l => l.id === legId ? { ...l, options: [] } : l), votes: { ...plan.votes, [legId]: {} } };
    setPlan(updated); savePlan(updated);
  };

  const resetPlan = async () => { setPlan(INITIAL_PLAN); await savePlan(INITIAL_PLAN); showNotification("Plan reset ✓"); };

  if (loading) return <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:"#0a1628", color:"#e2c97e", fontFamily:"Georgia,serif", fontSize:18 }}>Loading…</div>;

  const bookedCount = plan.legs.filter(l => l.booked).length;
  const totalTasks = plan.legs.reduce((a, l) => a + l.tasks.length, 0);
  const doneTasks = plan.legs.reduce((a, l) => a + l.tasks.filter(t => t.done).length, 0);

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(160deg,#0a1628 0%,#0d2137 50%,#0a1e1a 100%)", fontFamily:"Georgia,serif", color:"#e8dcc8" }}>
      {notification && <div style={{ position:"fixed", top:16, right:16, zIndex:100, background:"#e2c97e", color:"#0a1628", padding:"10px 18px", borderRadius:8, fontWeight:"bold", fontSize:13 }}>{notification}</div>}
      <div style={{ padding:"24px 16px 16px", borderBottom:"1px solid rgba(226,201,126,0.15)" }}>
        <div style={{ fontSize:10, letterSpacing:4, color:"#e2c97e", opacity:0.6, marginBottom:5, textTransform:"uppercase" }}>Family Holiday Planner</div>
        <h1 style={{ margin:0, fontSize:"clamp(18px,5vw,26px)", fontWeight:"normal", color:"#e2c97e" }}>{plan.trip.name}</h1>
        <div style={{ marginTop:5, fontSize:12, opacity:0.6, display:"flex", gap:12, flexWrap:"wrap" }}><span>{plan.trip.dates}</span><span>{plan.trip.party}</span></div>
        <div style={{ marginTop:14, display:"flex", gap:12 }}>
          {[{label:"Legs booked",val:bookedCount,total:plan.legs.length,grad:"linear-gradient(90deg,#e2c97e,#4ade80)"},{label:"Tasks done",val:doneTasks,total:totalTasks,grad:"linear-gradient(90deg,#4ade80,#38bdf8)"}].map(b=>(
            <div key={b.label} style={{ flex:1 }}>
              <div style={{ fontSize:9, letterSpacing:1, opacity:0.45, marginBottom:4, textTransform:"uppercase" }}>{b.label}</div>
              <div style={{ height:4, background:"rgba(255,255,255,0.08)", borderRadius:2, overflow:"hidden" }}><div style={{ height:"100%", width:`${(b.val/b.total)*100}%`, background:b.grad, borderRadius:2, transition:"width 0.4s" }}/></div>
              <div style={{ fontSize:10, marginTop:3, opacity:0.5 }}>{b.val} of {b.total}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display:"flex", borderBottom:"1px solid rgba(226,201,126,0.1)", background:"rgba(0,0,0,0.2)" }}>
        {["itinerary","flights","budget","notes"].map(tab=>(
          <button key={tab} onClick={()=>setActiveTab(tab)} style={{ flex:1, padding:"12px 4px", border:"none", background:"transparent", color:activeTab===tab?"#e2c97e":"rgba(232,220,200,0.35)", fontSize:"clamp(9px,2.5vw,12px)", letterSpacing:1, textTransform:"uppercase", cursor:"pointer", borderBottom:activeTab===tab?"2px solid #e2c97e":"2px solid transparent" }}>{tab}</button>
        ))}
      </div>
      <div style={{ padding:"14px 14px 90px", maxWidth:640, margin:"0 auto" }}>
        {activeTab==="itinerary" && plan.legs.map(leg=>{
          const sc=STATUS_CONFIG[leg.status], isExp=expandedLeg===leg.id, winner=getWinner(leg.id,leg.options), totalLegVotes=Object.keys(getVotesForLeg(leg.id)).length, doneLegTasks=leg.tasks.filter(t=>t.done).length;
          return (
            <div key={leg.id} style={{ marginBottom:12, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(226,201,126,0.12)", borderRadius:14, overflow:"hidden" }}>
              <div style={{ padding:"14px 14px 0" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
                  <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                    <span style={{ fontSize:22 }}>{leg.icon}</span>
                    <div>
                      <div style={{ fontSize:15, fontWeight:"bold", color:"#e2c97e" }}>{leg.label}</div>
                      <div style={{ fontSize:11, opacity:0.5, marginTop:2 }}>{leg.dates} · {leg.nights}n · {leg.location}</div>
                    </div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4, flexShrink:0 }}>
                    <div style={{ fontSize:10, padding:"3px 9px", borderRadius:20, background:sc.bg, color:sc.color }}>{sc.label}</div>
                    {winner&&<div style={{ fontSize:9, padding:"2px 7px", borderRadius:20, background:"rgba(226,201,126,0.1)", color:"#e2c97e" }}>{winner.name}</div>}
                  </div>
                </div>
                <div style={{ marginTop:8, fontSize:12, opacity:0.55, lineHeight:1.5, fontStyle:"italic" }}>{leg.notes}</div>
              </div>
              <div style={{ padding:"10px 14px 14px", display:"flex", gap:8, flexWrap:"wrap" }}>
                <button onClick={()=>setExpandedLeg(isExp?null:leg.id)} style={{ fontSize:12, padding:"7px 14px", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(226,201,126,0.2)", borderRadius:8, color:"rgba(226,201,126,0.8)", cursor:"pointer", fontFamily:"Georgia,serif" }}>
                  {isExp?"▲ Hide tasks":`▼ Tasks (${doneLegTasks}/${leg.tasks.length})`}
                </button>
                <button onClick={()=>{setExpandedLeg(leg.id);researchLeg(leg);}} disabled={researching[leg.id]} style={{ fontSize:12, padding:"7px 14px", background:researching[leg.id]?"rgba(226,201,126,0.05)":"linear-gradient(135deg,rgba(226,201,126,0.2),rgba(226,201,126,0.08))", border:"1px solid rgba(226,201,126,0.4)", borderRadius:8, color:researching[leg.id]?"rgba(226,201,126,0.4)":"#e2c97e", cursor:researching[leg.id]?"default":"pointer", fontFamily:"Georgia,serif", fontWeight:"bold" }}>
                  {researching[leg.id]?"Searching…":leg.options?.length>0?`Re-search (${leg.options.length})`:"Find options"}
                </button>
              </div>
              {isExp&&(
                <div style={{ borderTop:"1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ padding:"12px 14px" }}>
                    <div style={{ fontSize:9, letterSpacing:1.5, opacity:0.4, marginBottom:8, textTransform:"uppercase" }}>Tasks</div>
                    {leg.tasks.map(task=>(
                      <div key={task.id} onClick={()=>toggleTask(leg.id,task.id)} style={{ display:"flex", alignItems:"flex-start", gap:9, padding:"7px 0", cursor:"pointer", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                        <div style={{ width:16, height:16, borderRadius:3, flexShrink:0, marginTop:1, border:task.done?"none":"1px solid rgba(226,201,126,0.3)", background:task.done?"#4ade80":"transparent", display:"flex", alignItems:"center", justifyContent:"center" }}>
                          {task.done&&<span style={{ fontSize:10, color:"#0a1628", fontWeight:"bold" }}>✓</span>}
                        </div>
                        <span style={{ fontSize:12, opacity:task.done?0.35:0.8, textDecoration:task.done?"line-through":"none", lineHeight:1.4 }}>{task.text}</span>
                      </div>
                    ))}
                    <button onClick={()=>toggleLegBooked(leg.id)} style={{ marginTop:10, fontSize:11, padding:"5px 12px", background:leg.booked?"rgba(74,222,128,0.1)":"transparent", border:`1px solid ${leg.booked?"#4ade80":"rgba(226,201,126,0.2)"}`, borderRadius:6, color:leg.booked?"#4ade80":"rgba(226,201,126,0.6)", cursor:"pointer", fontFamily:"Georgia,serif" }}>
                      {leg.booked?"✓ Marked booked":"Mark as booked"}
                    </button>
                  </div>
                  {leg.options?.length>0&&(
                    <div style={{ borderTop:"1px solid rgba(255,255,255,0.06)", padding:"12px 14px" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                        <div style={{ fontSize:9, letterSpacing:1.5, opacity:0.4, textTransform:"uppercase" }}>{leg.options.length} options · {totalLegVotes} vote{totalLegVotes!==1?"s":""}</div>
                        <button onClick={()=>clearOptions(leg.id)} style={{ fontSize:10, padding:"3px 8px", background:"transparent", border:"1px solid rgba(248,113,113,0.3)", borderRadius:5, color:"rgba(248,113,113,0.6)", cursor:"pointer", fontFamily:"Georgia,serif" }}>Clear</button>
                      </div>
                      <input value={voterName} onChange={e=>setVoterName(e.target.value)} placeholder="Your name to vote…" style={{ width:"100%", boxSizing:"border-box", padding:"8px 10px", marginBottom:10, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(226,201,126,0.15)", borderRadius:7, color:"#e8dcc8", fontSize:12, fontFamily:"Georgia,serif", outline:"none" }}/>
                      {leg.options.map(opt=>{
                        const optVoters=getVotesForOption(leg.id,opt.id), myVote=voterName&&getVotesForLeg(leg.id)[voterName]===opt.id, isWin=winner?.id===opt.id&&optVoters.length>0, pct=totalLegVotes>0?Math.round((optVoters.length/totalLegVotes)*100):0, isExpOpt=expandedOption===`${leg.id}-${opt.id}`;
                        return (
                          <div key={opt.id} style={{ marginBottom:9, background:isWin?"rgba(226,201,126,0.05)":"rgba(255,255,255,0.02)", border:`1px solid ${isWin?"rgba(226,201,126,0.35)":myVote?"rgba(74,222,128,0.2)":"rgba(255,255,255,0.07)"}`, borderRadius:10, overflow:"hidden" }}>
                            <div style={{ padding:"11px 12px" }}>
                              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
                                <div style={{ flex:1 }}>
                                  <div style={{ fontSize:13, color:"#e2c97e", fontWeight:"bold" }}>{isWin?"🏆 ":""}{opt.name}</div>
                                  <div style={{ fontSize:11, opacity:0.5, marginTop:2, fontStyle:"italic" }}>{opt.tagline}</div>
                                  <div style={{ fontSize:11, color:"#4ade80", marginTop:4 }}>{opt.price}</div>
                                </div>
                                <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:5 }}>
                                  <div style={{ fontSize:11, color:"#e2c97e" }}>{"★".repeat(Math.round(opt.rating||4))}{"☆".repeat(5-Math.round(opt.rating||4))}</div>
                                  <button onClick={()=>castVote(leg.id,opt.id)} style={{ fontSize:11, padding:"5px 12px", background:myVote?"rgba(74,222,128,0.15)":"rgba(226,201,126,0.1)", border:`1px solid ${myVote?"#4ade80":"rgba(226,201,126,0.3)"}`, borderRadius:6, color:myVote?"#4ade80":"#e2c97e", cursor:"pointer", fontFamily:"Georgia,serif", fontWeight:"bold" }}>
                                    {myVote?"✓ Voted":"Vote"}
                                  </button>
                                </div>
                              </div>
                              {totalLegVotes>0&&(<div style={{ marginTop:8 }}><div style={{ height:3, background:"rgba(255,255,255,0.07)", borderRadius:2, overflow:"hidden" }}><div style={{ height:"100%", width:`${pct}%`, background:isWin?"#e2c97e":"#4ade80", borderRadius:2, transition:"width 0.4s" }}/></div><div style={{ fontSize:10, opacity:0.45, marginTop:3 }}>{optVoters.length} vote{optVoters.length!==1?"s":""} · {pct}%</div></div>)}
                              {optVoters.length>0&&(<div style={{ display:"flex", gap:4, marginTop:6, flexWrap:"wrap" }}>{optVoters.map((name,vi)=>(<div key={name} style={{ fontSize:10, padding:"2px 7px", borderRadius:10, background:`${VOTER_COLORS[vi%VOTER_COLORS.length]}18`, border:`1px solid ${VOTER_COLORS[vi%VOTER_COLORS.length]}40`, color:VOTER_COLORS[vi%VOTER_COLORS.length] }}>{name}</div>))}</div>)}
                              <button onClick={()=>setExpandedOption(isExpOpt?null:`${leg.id}-${opt.id}`)} style={{ marginTop:7, fontSize:10, padding:"3px 8px", background:"transparent", border:"1px solid rgba(255,255,255,0.1)", borderRadius:4, color:"rgba(232,220,200,0.4)", cursor:"pointer", fontFamily:"Georgia,serif" }}>{isExpOpt?"▲ Less":"▼ Pros, cons & tip"}</button>
                            </div>
                            {isExpOpt&&(<div style={{ padding:"0 12px 12px", borderTop:"1px solid rgba(255,255,255,0.05)" }}><div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:10 }}><div><div style={{ fontSize:9, letterSpacing:1, opacity:0.4, textTransform:"uppercase", marginBottom:5 }}>Pros</div>{(opt.pros||[]).map((p,pi)=><div key={pi} style={{ fontSize:11, opacity:0.75, marginBottom:3, lineHeight:1.4 }}>✓ {p}</div>)}</div><div><div style={{ fontSize:9, letterSpacing:1, opacity:0.4, textTransform:"uppercase", marginBottom:5 }}>Cons</div>{(opt.cons||[]).map((c,ci)=><div key={ci} style={{ fontSize:11, opacity:0.75, marginBottom:3, lineHeight:1.4 }}>✗ {c}</div>)}</div></div>{opt.bookingTip&&<div style={{ marginTop:10, padding:"8px 10px", background:"rgba(226,201,126,0.06)", borderRadius:6, fontSize:11, opacity:0.8, lineHeight:1.5 }}>💡 {opt.bookingTip}</div>}</div>)}
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
        {activeTab==="flights"&&(<div>{plan.flights.map(f=>(<div key={f.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"13px 14px", marginBottom:9, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(226,201,126,0.1)", borderRadius:10 }}><div><div style={{ fontSize:14, color:"#e2c97e" }}>{f.label}</div><div style={{ fontSize:11, opacity:0.5, marginTop:3 }}>{f.detail}</div></div><div style={{ fontSize:10, padding:"3px 9px", borderRadius:20, background:f.booked?"rgba(74,222,128,0.12)":"rgba(248,113,113,0.12)", color:f.booked?"#4ade80":"#f87171" }}>{f.booked?"Booked":"To book"}</div></div>))}</div>)}
        {activeTab==="budget"&&(<div><div style={{ padding:"18px", marginBottom:14, background:"rgba(226,201,126,0.06)", border:"1px solid rgba(226,201,126,0.2)", borderRadius:12, textAlign:"center" }}><div style={{ fontSize:9, letterSpacing:2, opacity:0.5, textTransform:"uppercase", marginBottom:6 }}>Total budget</div><div style={{ fontSize:26, color:"#e2c97e" }}>{plan.budget.total}</div><div style={{ fontSize:11, opacity:0.4, marginTop:4 }}>Accommodation & internal travel · Flights separate</div></div>{plan.budget.items.map((item,i)=>(<div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"13px 14px", marginBottom:7, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(226,201,126,0.08)", borderRadius:10 }}><div style={{ fontSize:13, opacity:0.8 }}>{item.label}</div><div style={{ fontSize:13, color:"#e2c97e" }}>{item.estimate}</div></div>))}</div>)}
        {activeTab==="notes"&&(<div>{plan.comments.length===0&&<div style={{ textAlign:"center", opacity:0.4, padding:"40px 0", fontSize:13, fontStyle:"italic" }}>No comments yet.</div>}{plan.comments.map(c=>(<div key={c.id} style={{ padding:"12px 14px", marginBottom:9, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(226,201,126,0.1)", borderRadius:10 }}><div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}><span style={{ fontSize:13, color:"#e2c97e", fontWeight:"bold" }}>{c.author}</span><span style={{ fontSize:10, opacity:0.4 }}>{c.time}</span></div><div style={{ fontSize:13, opacity:0.8, lineHeight:1.5 }}>{c.text}</div></div>))}<div style={{ marginTop:12, padding:"14px", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(226,201,126,0.15)", borderRadius:12 }}><input value={commenterName} onChange={e=>setCommenterName(e.target.value)} placeholder="Your name" style={{ width:"100%", boxSizing:"border-box", padding:"9px 11px", marginBottom:9, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(226,201,126,0.15)", borderRadius:7, color:"#e8dcc8", fontSize:13, fontFamily:"Georgia,serif", outline:"none" }}/><textarea value={newComment} onChange={e=>setNewComment(e.target.value)} placeholder="Comment, question or suggestion…" rows={3} style={{ width:"100%", boxSizing:"border-box", padding:"9px 11px", marginBottom:10, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(226,201,126,0.15)", borderRadius:7, color:"#e8dcc8", fontSize:13, fontFamily:"Georgia,serif", resize:"vertical", outline:"none" }}/><button onClick={addComment} style={{ width:"100%", padding:"11px", background:"linear-gradient(135deg,#e2c97e,#c9a84c)", border:"none", borderRadius:7, color:"#0a1628", fontFamily:"Georgia,serif", fontSize:13, fontWeight:"bold", cursor:"pointer" }}>Add Comment</button></div></div>)}
      </div>
      <div style={{ position:"fixed", bottom:0, left:0, right:0, padding:"9px 14px", background:"rgba(10,22,40,0.96)", borderTop:"1px solid rgba(226,201,126,0.1)", display:"flex", justifyContent:"space-between", alignItems:"center", backdropFilter:"blur(10px)" }}>
        <div style={{ fontSize:10, opacity:0.4 }}>{saving?"Saving…":"Saved locally"}</div>
        <button onClick={resetPlan} style={{ fontSize:10, padding:"4px 10px", background:"transparent", border:"1px solid rgba(248,113,113,0.3)", borderRadius:5, color:"rgba(248,113,113,0.6)", cursor:"pointer", fontFamily:"Georgia,serif" }}>Reset</button>
      </div>
      <style>{`*{-webkit-tap-highlight-color:transparent}input::placeholder,textarea::placeholder{color:rgba(232,220,200,0.3)}`}</style>
    </div>
  );
}
