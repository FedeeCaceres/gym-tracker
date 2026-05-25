import { useState, useEffect } from "react";

// ══════════════════════════════════════════════
//  SUPABASE
// ══════════════════════════════════════════════
const SB_URL = "https://rmqeyhelqyxsxqxstdju.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtcWV5aGVscXl4c3hxeHN0ZGp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3ODY5ODgsImV4cCI6MjA5MjM2Mjk4OH0.beKo6hBjlqDCG_S5Wcsq4pfoErIC9ZG62p4DaRkLHYs";
let TOKEN = null;

function hdrs(auth = true) {
  return {
    "Content-Type": "application/json",
    "apikey": SB_KEY,
    "Authorization": `Bearer ${auth && TOKEN ? TOKEN : SB_KEY}`,
  };
}
async function req(url, opts = {}) {
  try {
    const r = await fetch(url, { ...opts, headers: { ...hdrs(opts.useAuth !== false), ...(opts.headers || {}) } });
    const d = await r.json().catch(() => ({}));
    return { ok: r.ok, status: r.status, data: d };
  } catch (e) { return { ok: false, status: 0, data: {}, err: e.message }; }
}

async function sbSignUp(email, pw) { return req(`${SB_URL}/auth/v1/signup`, { method: "POST", useAuth: false, body: JSON.stringify({ email, password: pw }) }); }
async function sbSignIn(email, pw) { return req(`${SB_URL}/auth/v1/token?grant_type=password`, { method: "POST", useAuth: false, body: JSON.stringify({ email, password: pw }) }); }
async function sbRefresh(rt) { return req(`${SB_URL}/auth/v1/token?grant_type=refresh_token`, { method: "POST", useAuth: false, body: JSON.stringify({ refresh_token: rt }) }); }
async function dbGet(t, q = "") { const { ok, data } = await req(`${SB_URL}/rest/v1/${t}?${q}&order=created_at.desc`); return ok && Array.isArray(data) ? data : []; }
async function dbIns(t, row) { return req(`${SB_URL}/rest/v1/${t}`, { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(row) }); }
async function dbUpd(t, id, d) { return req(`${SB_URL}/rest/v1/${t}?id=eq.${id}`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify(d) }); }
async function dbDel(t, id) { return req(`${SB_URL}/rest/v1/${t}?id=eq.${id}`, { method: "DELETE" }); }

const SESSION_KEY = "gym_sess_v2";
const saveS = d => { try { localStorage.setItem(SESSION_KEY, JSON.stringify(d)); } catch {} };
const loadS = () => { try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; } };
const clearS = () => { try { localStorage.removeItem(SESSION_KEY); } catch {} };

// ══════════════════════════════════════════════
//  EXERCISE LIBRARY (con NUEVOS 30 ejercicios agregados)
// ══════════════════════════════════════════════
const EX = [
  { id:"bp",    name:"Press Banca con Barra",         muscle:"Pecho",   inc:2.5, compound:true },
  { id:"ibp",   name:"Press Inclinado con Barra",     muscle:"Pecho",   inc:2.5, compound:true },
  { id:"dbp",   name:"Press Plano Mancuernas",        muscle:"Pecho",   inc:2   },
  { id:"idbp",  name:"Press Inclinado Mancuernas",    muscle:"Pecho",   inc:2   },
  { id:"cfly",  name:"Aperturas en Polea Alta",       muscle:"Pecho",   inc:1.5 },
  { id:"pec",   name:"Pec Deck / Mariposa",           muscle:"Pecho",   inc:2.5 },
  { id:"dip",   name:"Fondos en Paralelas (Pecho)",   muscle:"Pecho",   inc:2.5 },
  { id:"pull",  name:"Pullover con Mancuerna",        muscle:"Pecho",   inc:2   },
  { id:"dl",    name:"Peso Muerto",                   muscle:"Espalda", inc:5,   compound:true },
  { id:"row",   name:"Remo con Barra",                muscle:"Espalda", inc:2.5, compound:true },
  { id:"rdl",   name:"Peso Muerto Rumano",            muscle:"Espalda", inc:5,   compound:true },
  { id:"pu",    name:"Dominadas",                     muscle:"Espalda", inc:0   },
  { id:"lat",   name:"Jalones al Pecho",              muscle:"Espalda", inc:2.5 },
  { id:"lrow",  name:"Remo con Mancuerna",            muscle:"Espalda", inc:2   },
  { id:"crow",  name:"Remo en Polea Baja",            muscle:"Espalda", inc:2.5 },
  { id:"tbar",  name:"Remo en T",                     muscle:"Espalda", inc:2.5 },
  { id:"shrug", name:"Encogimientos de Hombros",      muscle:"Espalda", inc:5   },
  { id:"ohp",   name:"Press Militar con Barra",       muscle:"Hombros", inc:2.5, compound:true },
  { id:"dbohp", name:"Press Mancuernas Hombros",      muscle:"Hombros", inc:2   },
  { id:"lat2",  name:"Elevaciones Laterales",         muscle:"Hombros", inc:1   },
  { id:"fron",  name:"Elevaciones Frontales",         muscle:"Hombros", inc:1   },
  { id:"arnd",  name:"Arnold Press",                  muscle:"Hombros", inc:2   },
  { id:"facep", name:"Face Pull en Polea",            muscle:"Hombros", inc:2   },
  { id:"bbcurl",name:"Curl Barra",                    muscle:"Bíceps",  inc:2.5 },
  { id:"dbcurl",name:"Curl Mancuernas",               muscle:"Bíceps",  inc:1   },
  { id:"hamm",  name:"Curl Martillo",                 muscle:"Bíceps",  inc:1   },
  { id:"zbcurl",name:"Curl Barra EZ",                 muscle:"Bíceps",  inc:2.5 },
  { id:"conc",  name:"Curl Concentrado",              muscle:"Bíceps",  inc:1   },
  { id:"tet",   name:"Extensión Polea Alta",          muscle:"Tríceps", inc:2.5 },
  { id:"cgp",   name:"Press Cerrado",                 muscle:"Tríceps", inc:2.5 },
  { id:"skul",  name:"Skull Crushers",                muscle:"Tríceps", inc:2.5 },
  { id:"copa",  name:"Copa con Mancuerna",            muscle:"Tríceps", inc:2   },
  { id:"ropes", name:"Extensión Polea Cuerda",        muscle:"Tríceps", inc:2.5 },
  { id:"sq",    name:"Sentadilla con Barra",          muscle:"Piernas", inc:5,   compound:true },
  { id:"fsq",   name:"Sentadilla Frontal",            muscle:"Piernas", inc:5,   compound:true },
  { id:"lp",    name:"Prensa de Piernas",             muscle:"Piernas", inc:5   },
  { id:"legex", name:"Extensión de Cuádriceps",       muscle:"Piernas", inc:2.5 },
  { id:"lcurl", name:"Curl Femoral",                  muscle:"Piernas", inc:2.5 },
  { id:"lunge", name:"Zancadas con Mancuernas",       muscle:"Piernas", inc:2   },
  { id:"bsq",   name:"Sentadilla Búlgara",            muscle:"Piernas", inc:2.5 },
  { id:"ht",    name:"Hip Thrust con Barra",          muscle:"Glúteos", inc:5   },
  { id:"glkick",name:"Patada de Glúteo en Polea",     muscle:"Glúteos", inc:2.5 },
  { id:"abduc", name:"Abducción de Cadera",           muscle:"Glúteos", inc:2.5 },
  { id:"sumo",  name:"Sentadilla Sumo",               muscle:"Glúteos", inc:5   },
  { id:"htdb",  name:"Hip Thrust Mancuerna",          muscle:"Glúteos", inc:2.5 },
  { id:"sccalf",name:"Elevación Talones de Pie",      muscle:"Gemelos", inc:5   },
  { id:"sscalf",name:"Elevación Talones Sentado",     muscle:"Gemelos", inc:2.5 },
  { id:"crp",   name:"Crunch en Polea",               muscle:"Core",    inc:2.5 },
  { id:"plank", name:"Plancha",                       muscle:"Core",    inc:0   },
  { id:"legr",  name:"Elevación de Piernas Colgado",  muscle:"Core",    inc:0   },
  { id:"russ",  name:"Giro Ruso con Peso",            muscle:"Core",    inc:2   },
  // ========== NUEVOS 30 EJERCICIOS (AGREGADOS SIN MODIFICAR LOS ANTERIORES) ==========
  { id:"dorianrow", name:"Remo Dorian (Máquina)",          muscle:"Espalda", inc:2.5 },
  { id:"tbarrow",   name:"Remo Barra T",                   muscle:"Espalda", inc:2.5, compound:true },
  { id:"hacksq",    name:"Sentadilla Hack",                muscle:"Piernas", inc:5,   compound:true },
  { id:"smithsq",   name:"Sentadilla en Smith",            muscle:"Piernas", inc:5 },
  { id:"smithbp",   name:"Press Banca en Smith (Plano)",   muscle:"Pecho",   inc:2.5 },
  { id:"smithibp",  name:"Press Inclinado en Smith",       muscle:"Pecho",   inc:2.5 },
  { id:"sumodl",    name:"Peso Muerto Sumo",               muscle:"Piernas", inc:5,   compound:true },
  { id:"closegplat",name:"Jalón al Pecho Agarre Cerrado",  muscle:"Espalda", inc:2.5 },
  { id:"lyingcurl", name:"Curl Femoral Acostado",          muscle:"Piernas", inc:2.5 },
  { id:"legpress",  name:"Prensa 45°",                     muscle:"Piernas", inc:5 },
  { id:"dbldl",     name:"Peso Muerto con Mancuernas",     muscle:"Espalda", inc:2.5, compound:true },
  { id:"inclinepush",name:"Fondos en Banca Inclinada",     muscle:"Pecho",   inc:2 },
  { id:"cablecrunch",name:"Crunches en Polea Alta",        muscle:"Core",    inc:2.5 },
  { id:"hangingleg", name:"Elevación de Piernas Colgado (Core)", muscle:"Core", inc:0 },
  { id:"abwheel",   name:"Rueda Abdominal",                muscle:"Core",    inc:0 },
  { id:"frontraise",name:"Elevaciones Frontales con Disco", muscle:"Hombros", inc:1 },
  { id:"revfly",    name:"Pájaro en Máquina",               muscle:"Hombros", inc:1.5 },
  { id:"french",    name:"Press Francés con Barra",         muscle:"Tríceps", inc:2.5 },
  { id:"overhead",  name:"Extensión Tríceps por Encima",    muscle:"Tríceps", inc:2 },
  { id:"preacher",  name:"Curl Predicador",                 muscle:"Bíceps",  inc:2 },
  { id:"inclinecurl",name:"Curl en Banca Inclinada",        muscle:"Bíceps",  inc:1.5 },
  { id:"hyperext",  name:"Hiperextensiones (Lumbar)",       muscle:"Espalda", inc:2.5 },
  { id:"goblet",    name:"Sentadilla Copa (Goblet)",        muscle:"Piernas", inc:2.5 },
  { id:"bulgarian", name:"Sentadilla Búlgara (Peso)",       muscle:"Piernas", inc:2 },
  { id:"donkeycalf",name:"Elevación de Gemelos en Burro",   muscle:"Gemelos", inc:5 },
  { id:"seatedcalf",name:"Gemelo Sentado",                  muscle:"Gemelos", inc:2.5 },
  { id:"cablefly",  name:"Aperturas en Polea Baja",         muscle:"Pecho",   inc:1.5 },
  { id:"pullupw",   name:"Dominadas con Lastre",            muscle:"Espalda", inc:2.5 },
];
const MUSCLES = ["Todos", ...new Set(EX.map(e => e.muscle))];
const COMPOUNDS = EX.filter(e => e.compound);
const exById = id => EX.find(e => e.id === id);

// ══════════════════════════════════════════════
//  TRAINING SPLITS (predefined programs)
// ══════════════════════════════════════════════
const SPLITS = [
  {
    id: "ppl",
    name: "Push · Pull · Legs",
    emoji: "🔄",
    description: "3 días por semana, alta frecuencia. Cada músculo se trabaja 2 veces.",
    color: "#3b82f6",
    days: [
      { name: "Push — Empuje", exercises: ["bp","idbp","dip","ohp","lat2","tet"] },
      { name: "Pull — Tirón",  exercises: ["pu","row","lat","bbcurl","hamm","facep"] },
      { name: "Legs — Piernas",exercises: ["sq","lp","legex","lcurl","ht","sccalf"] },
    ],
  },
  {
    id: "arnold",
    name: "Arnold Split",
    emoji: "💪",
    description: "6 días, alta intensidad. Clásico de Arnold Schwarzenegger.",
    color: "#f59e0b",
    days: [
      { name: "Pecho y Espalda",    exercises: ["bp","idbp","pull","row","lat","crow"] },
      { name: "Hombros y Brazos",   exercises: ["ohp","lat2","arnd","bbcurl","hamm","skul"] },
      { name: "Piernas",            exercises: ["sq","lp","legex","lcurl","sccalf","lunge"] },
    ],
  },
  {
    id: "women_lower",
    name: "Glúteos · Piernas · Torso",
    emoji: "🍑",
    description: "Diseñado para mujeres. Énfasis en glúteos, piernas y tonificación.",
    color: "#ec4899",
    days: [
      { name: "Glúteos",  exercises: ["ht","sumo","glkick","abduc","rdl","bsq"] },
      { name: "Piernas",  exercises: ["lp","legex","lcurl","lunge","bsq","sccalf"] },
      { name: "Torso",    exercises: ["idbp","lat","lrow","lat2","facep","crp"] },
    ],
  },
  {
    id: "upper_lower",
    name: "Upper · Lower",
    emoji: "🏋️",
    description: "4 días. Dividido en tren superior e inferior, ideal para fuerza.",
    color: "#22c55e",
    days: [
      { name: "Upper A — Fuerza",    exercises: ["bp","row","ohp","pu","bbcurl","tet"] },
      { name: "Lower A — Fuerza",    exercises: ["sq","rdl","legex","lcurl","sccalf","crp"] },
      { name: "Upper B — Volumen",   exercises: ["idbp","lat","arnd","lrow","hamm","skul"] },
      { name: "Lower B — Volumen",   exercises: ["lp","ht","bsq","lunge","abduc","russ"] },
    ],
  },
];

// ══════════════════════════════════════════════
//  STRENGTH PROGRAMS (5x5 / 3x3)
// ══════════════════════════════════════════════
function genSchedule(method, startW, weeks, incKg, incFreq) {
  const out = []; let w = startW, n = 0;
  const perWeek = method === "5x5" ? 3 : 2, S = method === "5x5" ? 5 : 3;
  let si = 0, bi = method === "5x5" ? 6 : 4;
  for (let wk = 1; wk <= weeks; wk++) {
    const dl = wk % 4 === 0;
    for (let s = 0; s < perWeek; s++) {
      n++;
      out.push({ n, week: wk, weight: dl ? Math.round(w*.7*2)/2 : w, sets: S, reps: S, deload: dl });
      if (!dl) {
        si++;
        if (incFreq === "session") w = Math.round((w+incKg)*2)/2;
        else if (incFreq === "week" && s === perWeek-1) w = Math.round((w+incKg)*2)/2;
        else if (incFreq === "biweek" && si >= bi) { w = Math.round((w+incKg)*2)/2; si = 0; }
      } else si = 0;
    }
  }
  return out;
}

// ══════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════
function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }
function toEmail(u) { return `${u.trim().toLowerCase().replace(/[^a-z0-9]/g,"")}@gymtracker.app`; }
function fDate(iso) { if (!iso) return ""; return new Date(iso).toLocaleDateString("es-AR",{day:"2-digit",month:"short",year:"numeric"}); }
function fShort(iso) { if (!iso) return ""; return new Date(iso).toLocaleDateString("es-AR",{day:"2-digit",month:"short"}); }

function getExerciseHistory(logs, eid) {
  const entries = [];
  for (const log of [...logs].sort((a,b) => new Date(a.date)-new Date(b.date))) {
    const sets = (log.sets||[]).filter(s => s.eid === eid && (s.weight||s.reps));
    if (sets.length) entries.push({ date: log.date, routineId: log.routine_id, sets });
  }
  return entries;
}

function getHistory(logs, rid, eid) {
  return [...logs]
    .filter(l => l.routine_id === rid && (l.sets||[]).some(s => s.eid === eid))
    .sort((a,b) => new Date(a.date)-new Date(b.date))
    .map(l => ({ date: l.date, sets: (l.sets||[]).filter(s => s.eid === eid) }));
}

function getSuggestion(logs, rid, eid, planned, inc = 2.5) {
  const h = getHistory(logs, rid, eid);
  if (!h.length) return planned?.length ? { bySet: planned, reason: "Peso planificado" } : null;
  const last = h[h.length-1].sets;
  const bySet = last.map((s,i) => {
    const w = parseFloat(s.weight)||0; if (!w) return planned?.[i]||"";
    const rir = s.rir!=null&&s.rir!==""?parseInt(s.rir):null;
    if (s.fail||rir===0) return String(Math.round((w+inc)*2)/2);
    if (rir!=null&&rir<=2) return String(w);
    if (rir!=null&&rir>=3) return String(Math.round((w+inc)*2)/2);
    return String(w);
  });
  const s0 = last[last.length-1];
  const r0 = s0?.rir!=null&&s0.rir!==""?parseInt(s0.rir):null;
  let reason = "Mismo peso";
  if (s0?.fail||r0===0) reason = `+${inc}kg — fallo alcanzado`;
  else if (r0!=null&&r0>=3) reason = `+${inc}kg — RIR alto`;
  else if (r0!=null&&r0<=2) reason = "Mismo peso — apuntá al fallo";
  return { bySet, reason };
}

function getPR(logs, eid) {
  let best = null;
  for (const log of logs) for (const s of (log.sets||[]))
    if (s.eid===eid&&s.weight&&s.reps) {
      const w=+s.weight,r=+s.reps;
      if (!best||w>best.w||(w===best.w&&r>best.r)) best={w,r,date:log.date};
    }
  return best;
}

// ══════════════════════════════════════════════
//  DESIGN TOKENS
// ══════════════════════════════════════════════
const C = {
  bg:"#080808", s1:"#101010", s2:"#171717", s3:"#1f1f1f",
  b1:"rgba(255,255,255,0.06)", b2:"rgba(255,255,255,0.10)", b3:"rgba(255,255,255,0.17)",
  white:"#fff", dim:"#707070", dimmer:"#383838",
  red:"#ff3040", redBg:"rgba(255,48,64,0.09)",
  green:"#22c55e", greenBg:"rgba(34,197,94,0.09)",
  blue:"#3b82f6", blueBg:"rgba(59,130,246,0.09)",
  yellow:"#f59e0b", pink:"#ec4899",
};
const FS = "'DM Sans','Helvetica Neue',Arial,sans-serif";
const FM = "'DM Mono','Courier New',monospace";

// ══════════════════════════════════════════════
//  UI ATOMS (sin cambios)
// ══════════════════════════════════════════════
function Btn({ onClick, children, ghost, full, disabled, style: sx={} }) {
  return (
    <button onClick={disabled?undefined:onClick} style={{
      fontFamily:FS, fontSize:14, fontWeight:600, cursor:disabled?"not-allowed":"pointer",
      background:ghost?"transparent":C.white, color:ghost?C.white:C.bg,
      border:ghost?`1px solid ${C.b2}`:"none", borderRadius:9, padding:"12px 20px",
      opacity:disabled?.4:1, ...(full?{width:"100%"}:{}), ...sx,
    }}>{children}</button>
  );
}
function Inp({ value, onChange, placeholder, type="text", style:sx={}, autoFocus }) {
  return <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} autoFocus={autoFocus}
    style={{ width:"100%", background:C.s2, border:`1px solid ${C.b1}`, borderRadius:8, color:C.white, fontFamily:FS, fontSize:14, padding:"11px 14px", boxSizing:"border-box", outline:"none", ...sx }}/>;
}
function Lbl({ children }) { return <div style={{ fontSize:10, letterSpacing:2.5, color:C.dimmer, textTransform:"uppercase", fontWeight:600, marginBottom:7 }}>{children}</div>; }
function Tag({ children, active, onClick, color }) {
  return <span onClick={onClick} style={{ display:"inline-flex", alignItems:"center", padding:"4px 12px", borderRadius:20, fontSize:10, letterSpacing:1, fontWeight:700, textTransform:"uppercase", cursor:onClick?"pointer":"default", background:active?(color||C.white):"transparent", color:active?(color?C.white:C.bg):C.dim, border:`1px solid ${active?(color||C.white):C.b1}` }}>{children}</span>;
}
function Card({ children, style:sx={}, onClick }) {
  return <div onClick={onClick} style={{ background:C.s1, border:`1px solid ${C.b1}`, borderRadius:12, padding:16, ...sx }}>{children}</div>;
}
function PH({ supra, title, action }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
      <div>
        <div style={{ fontSize:10, letterSpacing:3, color:C.dimmer, textTransform:"uppercase", fontWeight:600, marginBottom:5 }}>{supra}</div>
        <div style={{ fontSize:22, fontWeight:700, letterSpacing:-0.5 }}>{title}</div>
      </div>
      {action}
    </div>
  );
}
function Toggle({ options, value, onChange }) {
  return (
    <div style={{ display:"flex", gap:6 }}>
      {options.map(o => (
        <button key={o.value} onClick={() => onChange(o.value)} style={{
          flex:1, padding:"10px 4px", borderRadius:8, fontFamily:FS, fontWeight:600, fontSize:12, cursor:"pointer",
          background:value===o.value?C.white:C.s2, color:value===o.value?C.bg:C.dim,
          border:`1px solid ${value===o.value?C.white:C.b1}`,
        }}>{o.label}</button>
      ))}
    </div>
  );
}

// Modal overlay
function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:200, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
      <div style={{ background:C.s1, border:`1px solid ${C.b2}`, borderRadius:"16px 16px 0 0", width:"100%", maxWidth:520, maxHeight:"80vh", overflowY:"auto", padding:20 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <div style={{ fontSize:16, fontWeight:700 }}>{title}</div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:C.dim, fontSize:24, cursor:"pointer", lineHeight:1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
//  EXERCISE AGENDA MODAL (sin cambios)
// ══════════════════════════════════════════════
function ExerciseAgendaModal({ open, onClose, exercise, logs, routines }) {
  if (!open || !exercise) return null;
  const libEx = exById(exercise.libId);
  const history = getExerciseHistory(logs, exercise.libId);
  const pr = getPR(logs, exercise.libId);

  return (
    <Modal open={open} onClose={onClose} title={libEx?.name || ""}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div style={{ display:"flex", gap:8 }}>
          <Tag active>{libEx?.muscle}</Tag>
          {libEx?.compound && <Tag active color={C.yellow}>★ Básico</Tag>}
        </div>
        {pr && (
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:9, letterSpacing:2, color:C.dimmer, textTransform:"uppercase", fontWeight:600 }}>Mejor marca</div>
            <div style={{ fontFamily:FM, fontSize:16, fontWeight:700, color:C.green }}>{pr.w}kg × {pr.r} reps</div>
            <div style={{ fontSize:10, color:C.dim }}>{fDate(pr.date)}</div>
          </div>
        )}
      </div>
      {libEx?.inc > 0 && (
        <div style={{ background:C.s2, border:`1px solid ${C.b1}`, borderRadius:8, padding:"10px 14px", marginBottom:16 }}>
          <div style={{ fontSize:12, color:C.dim }}>Incremento sugerido: <strong style={{ color:C.white }}>+{libEx.inc}kg</strong> por sesión al llegar al fallo</div>
        </div>
      )}
      <Lbl>Historial — Agenda de pesos</Lbl>
      {history.length === 0 ? (
        <div style={{ textAlign:"center", padding:"24px 0", color:C.dimmer, fontSize:13 }}>
          Aún no hay registros para este ejercicio.<br />
          <span style={{ fontSize:11 }}>Completá una sesión para ver el historial.</span>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {[...history].reverse().map((entry, i) => {
            const routine = routines.find(r => r.id === entry.routineId);
            const isFirst = i === 0;
            return (
              <div key={i} style={{ background:isFirst?C.greenBg:C.s2, border:`1px solid ${isFirst?"rgba(34,197,94,0.2)":C.b1}`, borderRadius:10, padding:"12px 14px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:isFirst?C.green:C.white }}>{fDate(entry.date)}</div>
                    {routine && <div style={{ fontSize:10, color:C.dim, marginTop:2 }}>{routine.name}</div>}
                  </div>
                  {isFirst && <Tag active color={C.green}>Última</Tag>}
                </div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {entry.sets.map((s, j) => (
                    <div key={j} style={{ background:s.fail?C.redBg:C.s3, border:`1px solid ${s.fail?"rgba(255,48,64,0.25)":C.b1}`, borderRadius:7, padding:"5px 10px", textAlign:"center" }}>
                      <div style={{ fontSize:9, color:C.dimmer, letterSpacing:1, textTransform:"uppercase" }}>S{j+1}</div>
                      <div style={{ fontFamily:FM, fontSize:14, fontWeight:700, color:s.fail?C.red:C.white }}>{s.weight||"—"}kg</div>
                      <div style={{ fontSize:10, color:C.dim }}>{s.reps||"—"} rep{s.reps!=="1"?"s":""}</div>
                      {s.rir!=null&&s.rir!==""&&<div style={{ fontSize:9, color:C.dimmer }}>RIR {s.rir}</div>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {history.length > 1 && (() => {
        const weights = history.map(h => Math.max(...h.sets.map(s => parseFloat(s.weight)||0)));
        const first = weights[0], last = weights[weights.length-1];
        const diff = last - first;
        return (
          <div style={{ marginTop:16, background:C.s2, borderRadius:10, padding:"12px 14px" }}>
            <Lbl>Progresión total</Lbl>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontFamily:FM, fontSize:18, fontWeight:700 }}>{first}kg</div>
                <div style={{ fontSize:10, color:C.dim }}>Inicio</div>
              </div>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontFamily:FM, fontSize:22, fontWeight:700, color:diff>=0?C.green:C.red }}>{diff>=0?"+":""}{diff}kg</div>
                <div style={{ fontSize:10, color:C.dim }}>{history.length} sesiones</div>
              </div>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontFamily:FM, fontSize:18, fontWeight:700 }}>{last}kg</div>
                <div style={{ fontSize:10, color:C.dim }}>Actual</div>
              </div>
            </div>
          </div>
        );
      })()}
    </Modal>
  );
}

// ══════════════════════════════════════════════
//  EXERCISE CONFIGURATOR (sin cambios)
// ══════════════════════════════════════════════
function ExConfig({ ex, logs, rid, routines, onRemove, onSetCount, onSetWeight }) {
  const libEx = exById(ex.libId);
  const hist = getHistory(logs, rid, ex.libId);
  const [open, setOpen] = useState(false);
  const [showAgenda, setShowAgenda] = useState(false);

  return (
    <>
      <ExerciseAgendaModal open={showAgenda} onClose={() => setShowAgenda(false)} exercise={ex} logs={logs} routines={routines} />
      <Card style={{ background:C.s2, borderColor:C.b2, marginBottom:10 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:open?12:0 }}>
          <div style={{ flex:1, cursor:"pointer" }} onClick={() => setOpen(p=>!p)}>
            <div style={{ fontWeight:600, fontSize:14 }}>{libEx?.name}</div>
            <div style={{ fontSize:11, color:C.dim, marginTop:3 }}>{libEx?.muscle}{libEx?.compound?" · ★":""} · {ex.sets} serie{ex.sets>1?"s":""}</div>
            {!open && (ex.plannedWeights||[]).some(w=>w) && (
              <div style={{ display:"flex", gap:4, marginTop:6, flexWrap:"wrap" }}>
                {Array.from({length:ex.sets},(_,i) => (
                  <span key={i} style={{ fontSize:11, background:C.s3, borderRadius:5, padding:"2px 7px", fontFamily:FM, color:(ex.plannedWeights||[])[i]?C.green:C.dimmer }}>
                    S{i+1}:{(ex.plannedWeights||[])[i]||"—"}kg
                  </span>
                ))}
              </div>
            )}
          </div>
          <div style={{ display:"flex", gap:6, alignItems:"center", marginLeft:8, flexShrink:0 }}>
            <button onClick={() => setShowAgenda(true)} title="Ver historial" style={{ background:"none", border:`1px solid ${C.b1}`, borderRadius:7, color:C.dim, cursor:"pointer", fontSize:13, padding:"4px 9px" }}>📅</button>
            <button onClick={() => setOpen(p=>!p)} style={{ background:"none", border:"none", color:C.dim, cursor:"pointer", fontSize:18, transform:open?"rotate(180deg)":"none", transition:"transform .2s" }}>⌄</button>
            <button onClick={onRemove} style={{ background:"none", border:"none", color:C.dimmer, cursor:"pointer", fontSize:20, lineHeight:1 }}>×</button>
          </div>
        </div>

        {open && (
          <div>
            <Lbl>Series</Lbl>
            <div style={{ display:"flex", gap:6, marginBottom:14 }}>
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => onSetCount(n)} style={{ width:38, height:38, borderRadius:8, fontFamily:FM, fontWeight:700, fontSize:15, cursor:"pointer", background:ex.sets===n?C.white:C.s3, color:ex.sets===n?C.bg:C.dim, border:`1px solid ${ex.sets===n?C.white:C.b1}` }}>{n}</button>
              ))}
            </div>

            <Lbl>Peso planificado por serie (kg)</Lbl>
            <div style={{ display:"grid", gridTemplateColumns:`repeat(${ex.sets},1fr)`, gap:8, marginBottom:10 }}>
              {Array.from({length:ex.sets},(_,i) => (
                <div key={i}>
                  <div style={{ fontSize:10, letterSpacing:1.5, color:C.dimmer, textTransform:"uppercase", fontWeight:600, marginBottom:5, textAlign:"center" }}>S{i+1}</div>
                  <input type="number" placeholder="—" value={(ex.plannedWeights||[])[i]||""} onChange={e => onSetWeight(i,e.target.value)}
                    style={{ width:"100%", borderRadius:7, fontFamily:FM, fontSize:16, fontWeight:700, padding:"8px 4px", textAlign:"center", outline:"none", background:(ex.plannedWeights||[])[i]?C.greenBg:C.s3, border:`1px solid ${(ex.plannedWeights||[])[i]?"rgba(34,197,94,0.3)":C.b1}`, color:(ex.plannedWeights||[])[i]?C.green:C.white }} />
                </div>
              ))}
            </div>

            {ex.sets>1 && (ex.plannedWeights||[])[0] && !(ex.plannedWeights||[])[1] && (
              <button onClick={() => { const w=(ex.plannedWeights||[])[0]; for(let i=1;i<ex.sets;i++) onSetWeight(i,w); }}
                style={{ background:"none", border:`1px solid ${C.b1}`, borderRadius:7, color:C.dim, fontFamily:FS, fontSize:12, padding:"6px 12px", cursor:"pointer", marginBottom:10, width:"100%" }}>
                Copiar S1 a todas las series
              </button>
            )}

            {hist.length > 0 && (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                  <Lbl>Historial reciente</Lbl>
                  <button onClick={() => setShowAgenda(true)} style={{ background:"none", border:"none", color:C.blue, cursor:"pointer", fontFamily:FS, fontSize:12, padding:0 }}>Ver todo →</button>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:4, maxHeight:110, overflowY:"auto" }}>
                  {[...hist].reverse().slice(0,3).map((h,i) => (
                    <div key={i} style={{ background:C.s3, borderRadius:7, padding:"7px 10px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div style={{ fontSize:11, color:C.dim }}>{fShort(h.date)}</div>
                      <div style={{ display:"flex", gap:5 }}>
                        {h.sets.map((s,j) => <span key={j} style={{ fontFamily:FM, fontSize:12, color:s.fail?C.red:C.white }}>S{j+1}:{s.weight||"?"}×{s.reps||"?"}</span>)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </>
  );
}

// ══════════════════════════════════════════════
//  MAIN APP (sin cambios)
// ══════════════════════════════════════════════
export default function App() {
  const [status, setStatus] = useState("loading");
  const [user, setUser] = useState(null);
  const [view, setView] = useState("dashboard");
  const [activeSess, setActiveSess] = useState(null);
  const [toast, setToast] = useState(null);
  const [routines, setRoutines] = useState([]);
  const [logs, setLogs] = useState([]);
  const [programs, setPrograms] = useState([]);

  useEffect(() => {
    (async () => {
      const saved = loadS();
      if (!saved?.rt) { setStatus("anon"); return; }
      try {
        const { ok, data } = await sbRefresh(saved.rt);
        if (!ok||!data.access_token) { clearS(); setStatus("anon"); return; }
        TOKEN = data.access_token;
        saveS({ ...saved, rt: data.refresh_token });
        setUser({ id:saved.uid, username:saved.un });
        await loadAll(saved.uid);
        setStatus("authed");
      } catch { clearS(); setStatus("anon"); }
    })();
  }, []);

  async function loadAll(uid) {
    const [r,l,p] = await Promise.all([
      dbGet("routines",`user_id=eq.${uid}`),
      dbGet("logs",`user_id=eq.${uid}&order=date.desc`),
      dbGet("programs",`user_id=eq.${uid}`),
    ]);
    setRoutines(r); setLogs(l); setPrograms(p);
  }

  function showToast(msg, type="ok") { setToast({msg,type}); setTimeout(()=>setToast(null),3000); }

  async function handleAuth(username, password, isReg) {
    const email = toEmail(username);
    const { ok, data } = isReg ? await sbSignUp(email,password) : await sbSignIn(email,password);
    if (!ok||!data.access_token) {
      const msg = data.error_description||data.message||"Error al conectar";
      if (msg.includes("already registered")) return showToast("Ese usuario ya existe","err");
      if (msg.includes("Invalid login")||msg.includes("invalid_grant")) return showToast("Usuario o contraseña incorrectos","err");
      if (msg.includes("Email not confirmed")) return showToast("Desactivá 'Confirm email' en Supabase Auth","err");
      return showToast(msg,"err");
    }
    TOKEN = data.access_token;
    const uid = data.user?.id;
    const uname = username.trim();
    saveS({ rt:data.refresh_token, uid, un:uname });
    setUser({ id:uid, username:uname });
    await loadAll(uid);
    setStatus("authed");
    showToast(isReg?`¡Bienvenido, ${uname}!`:`Hola, ${uname}!`);
  }

  async function handleLogout() {
    TOKEN=null; clearS();
    setUser(null); setRoutines([]); setLogs([]); setPrograms([]);
    setActiveSess(null); setView("dashboard"); setStatus("anon");
  }

  const db = {
    routines, logs, programs,
    addRoutine: async d => {
      const row = { ...d, id:genId(), user_id:user.id, created_at:new Date().toISOString() };
      const { ok } = await dbIns("routines", row);
      if (ok) { setRoutines(p=>[row,...p]); showToast("Rutina creada ✓"); return row; }
      else { showToast("Error al guardar","err"); return null; }
    },
    addRoutineSilent: async d => {
      const row = { ...d, id:genId(), user_id:user.id, created_at:new Date().toISOString() };
      await dbIns("routines", row);
      setRoutines(p=>[row,...p]);
      return row;
    },
    updateRoutine: async (id,d) => {
      await dbUpd("routines",id,d);
      setRoutines(p=>p.map(r=>r.id===id?{...r,...d}:r));
      showToast("Rutina actualizada ✓");
    },
    deleteRoutine: async id => {
      await dbDel("routines",id);
      setRoutines(p=>p.filter(r=>r.id!==id));
      showToast("Rutina eliminada");
    },
    saveLog: async d => {
      const row = { ...d, id:genId(), user_id:user.id, date:new Date().toISOString() };
      await dbIns("logs", row);
      setLogs(p=>[row,...p]);
    },
    deleteLog: async id => {
      await dbDel("logs",id);
      setLogs(p=>p.filter(l=>l.id!==id));
      showToast("Sesión eliminada");
    },
    addProgram: async d => {
      const row = { ...d, id:genId(), user_id:user.id, start_date:new Date().toISOString() };
      await dbIns("programs",row);
      setPrograms(p=>[row,...p]);
      showToast("Programa creado ✓");
    },
    deleteProgram: async id => {
      await dbDel("programs",id);
      setPrograms(p=>p.filter(x=>x.id!==id));
    },
  };

  const NAV = [
    { id:"dashboard", label:"Inicio",    icon:"🏠" },
    { id:"programs",  label:"Programas", icon:"📈" },
    { id:"routines",  label:"Rutinas",   icon:"📋" },
    { id:"history",   label:"Historial", icon:"🕐" },
    { id:"records",   label:"Records",   icon:"⭐" },
    { id:"settings",  label:"Perfil",    icon:"👤" },
  ];

  const cv = activeSess ? "session" : view;

  if (status==="loading") return <Loader />;
  if (status==="anon") return <AuthScreen onAuth={handleAuth} />;

  return (
    <div style={{ background:C.bg, minHeight:"100vh", fontFamily:FS, color:C.white, display:"flex", flexDirection:"column" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
        input[type=number]{-moz-appearance:textfield}
        textarea{font-family:${FS};color:${C.white};background:${C.s2};border:1px solid ${C.b1};border-radius:8px;padding:11px 14px;width:100%;resize:vertical;outline:none;font-size:14px}
        select{background:${C.s2};border:1px solid ${C.b1};border-radius:8px;color:${C.white};font-family:${FS};font-size:14px;padding:11px 14px;outline:none;width:100%}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:${C.dimmer};border-radius:2px}
        @keyframes spin{to{transform:rotate(360deg)}}
        
        /* ========== MEJORAS VISUALES INTERACTIVAS ========== */
        div[style*="background: #101010"], .card-glass {
          transition: all 0.25s ease;
        }
        div[style*="background: #101010"]:hover {
          background: #181818 !important;
          border-color: rgba(255,255,255,0.15) !important;
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(0,0,0,0.3);
        }
        button:active {
          transform: scale(0.97);
        }
        button {
          transition: all 0.15s ease;
        }
        .gradient-title {
          background: linear-gradient(135deg, #fff, #a855f7, #3b82f6);
          background-clip: text;
          -webkit-background-clip: text;
          color: transparent;
          animation: shimmer 3s infinite;
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        div[style*="border-radius: 12px"] {
          animation: fadeSlideUp 0.3s ease-out;
        }
        input:focus, select:focus, textarea:focus {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 2px rgba(59,130,246,0.2);
        }
        nav {
          backdrop-filter: blur(16px);
          background: rgba(8,8,8,0.85) !important;
          transition: backdrop-filter 0.2s;
        }
        [onClick] {
          cursor: pointer;
        }
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-track {
          background: #1a1a1a;
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #3b82f6, #a855f7);
          border-radius: 3px;
        }
        span[style*="border-radius: 20px"] {
          transition: all 0.2s;
        }
        span[style*="border-radius: 20px"]:hover {
          transform: scale(1.02);
          filter: brightness(1.1);
        }
        @keyframes pulse-glow {
          0% { opacity: 0.4; text-shadow: 0 0 0px #fff; }
          50% { opacity: 1; text-shadow: 0 0 8px #3b82f6; }
          100% { opacity: 0.4; text-shadow: 0 0 0px #fff; }
        }
      `}</style>

      {/* Header */}
      <div style={{ padding:"14px 18px 12px", borderBottom:`1px solid ${C.b1}`, position:"sticky", top:0, background:"rgba(8,8,8,0.96)", backdropFilter:"blur(20px)", zIndex:100, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ fontSize:10, letterSpacing:3, color:C.dimmer, textTransform:"uppercase", fontWeight:600 }}>Gym Tracker</div>
          <div style={{ fontSize:16, fontWeight:700, background: "linear-gradient(135deg, #fff, #a855f7)", backgroundClip: "text", WebkitBackgroundClip: "text", color: "transparent" }}>{user?.username}</div>
        </div>
        {activeSess && (
          <div style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 11px", background:C.redBg, border:`1px solid ${C.red}`, borderRadius:20 }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:C.red, animation: "pulse-glow 1.2s infinite" }}/>
            <span style={{ fontSize:10, fontWeight:700, color:C.red, letterSpacing:1 }}>SESIÓN</span>
          </div>
        )}
      </div>

      <div style={{ flex:1, padding:"20px 16px", paddingBottom:80, maxWidth:560, margin:"0 auto", width:"100%" }}>
        {cv==="dashboard" && <DashboardView db={db} user={user} setView={setView} setActiveSess={setActiveSess}/>}
        {cv==="programs"  && <ProgramsView  db={db} showToast={showToast} setView={setView}/>}
        {cv==="routines"  && <RoutinesView  db={db} showToast={showToast}/>}
        {cv==="history"   && <HistoryView   db={db} showToast={showToast}/>}
        {cv==="records"   && <RecordsView   db={db}/>}
        {cv==="session"   && <SessionView   db={db} session={activeSess} setSession={setActiveSess} setView={setView} showToast={showToast}/>}
        {cv==="settings"  && <SettingsView  user={user} onLogout={handleLogout}/>}
      </div>

      {!activeSess && (
        <nav style={{ position:"fixed", bottom:0, left:0, right:0, background:"rgba(8,8,8,0.96)", backdropFilter:"blur(20px)", borderTop:`1px solid ${C.b1}`, display:"flex", zIndex:100 }}>
          {NAV.map(({id,label,icon}) => (
            <button key={id} onClick={()=>setView(id)} style={{ flex:1, padding:"9px 4px 7px", background:"none", border:"none", color:view===id?C.white:C.dimmer, fontFamily:FS, fontSize:8.5, letterSpacing:1, textTransform:"uppercase", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:3, fontWeight:view===id?600:400 }}>
              <span style={{ fontSize:18 }}>{icon}</span>{label}
              <div style={{ width:3, height:3, borderRadius:"50%", background:view===id?C.white:"transparent" }}/>
            </button>
          ))}
        </nav>
      )}

      {toast && <div style={{ position:"fixed", bottom:84, left:"50%", transform:"translateX(-50%)", background:toast.type==="err"?C.red:C.white, color:toast.type==="err"?C.white:C.bg, padding:"10px 22px", borderRadius:20, fontFamily:FS, fontSize:13, fontWeight:600, zIndex:999, boxShadow:"0 4px 24px rgba(0,0,0,0.5)", maxWidth:"90vw", textAlign:"center" }}>{toast.msg}</div>}
    </div>
  );
}

// ══════════════════════════════════════════════
//  AUTH
// ══════════════════════════════════════════════
function Loader() {
  return (
    <div style={{ background:C.bg, minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:14, fontFamily:FS }}>
      <div style={{ width:28, height:28, border:`1.5px solid ${C.dimmer}`, borderTop:`1.5px solid ${C.white}`, borderRadius:"50%", animation:"spin .8s linear infinite" }}/>
      <div style={{ fontSize:11, color:C.dimmer, letterSpacing:2, textTransform:"uppercase" }}>Cargando...</div>
    </div>
  );
}

function AuthScreen({ onAuth }) {
  const [tab, setTab] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError("");
    if (!username.trim()) { setError("Ingresá un nombre de usuario"); return; }
    if (!password) { setError("Ingresá una contraseña"); return; }
    if (tab==="register"&&password.length<6) { setError("Mínimo 6 caracteres"); return; }
    if (tab==="register"&&password!==confirm) { setError("Las contraseñas no coinciden"); return; }
    setLoading(true);
    await onAuth(username, password, tab==="register");
    setLoading(false);
  }

  return (
    <div style={{ background:C.bg, minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:24, fontFamily:FS, color:C.white }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,600;9..40,700&display=swap');*{box-sizing:border-box;margin:0;padding:0}input{outline:none}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width:"100%", maxWidth:380 }}>
        <div style={{ textAlign:"center", marginBottom:36 }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🏋️</div>
          <div style={{ fontSize:32, fontWeight:700, letterSpacing:-1, background: "linear-gradient(135deg, #fff, #a855f7)", backgroundClip: "text", WebkitBackgroundClip: "text", color: "transparent" }}>Gym Tracker</div>
          <div style={{ fontSize:13, color:C.dim, marginTop:8 }}>Registrá tu progreso. Superá tus marcas.</div>
        </div>
        <div style={{ display:"flex", background:C.s1, borderRadius:10, padding:4, marginBottom:18 }}>
          {[["login","Ingresar"],["register","Registrarse"]].map(([t,l]) => (
            <button key={t} onClick={()=>{setTab(t);setError("");}} style={{ flex:1, padding:10, background:tab===t?C.white:"transparent", color:tab===t?C.bg:C.dim, border:"none", borderRadius:8, fontFamily:FS, fontSize:14, fontWeight:600, cursor:"pointer" }}>{l}</button>
          ))}
        </div>
        <Card>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div><Lbl>Usuario</Lbl><Inp value={username} onChange={setUsername} placeholder="tunombre" autoFocus/></div>
            <div><Lbl>Contraseña</Lbl><Inp value={password} onChange={setPassword} placeholder="••••••••" type="password"/></div>
            {tab==="register" && <div><Lbl>Confirmar contraseña</Lbl><Inp value={confirm} onChange={setConfirm} placeholder="••••••••" type="password"/></div>}
            {error && <div style={{ fontSize:12, color:C.red, fontWeight:500, padding:"8px 12px", background:C.redBg, borderRadius:7 }}>{error}</div>}
            <Btn onClick={submit} disabled={loading} full style={{ marginTop:4 }}>
              {loading?"Conectando...":tab==="login"?"Ingresar":"Crear cuenta"}
            </Btn>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
//  DASHBOARD (sin cambios)
// ══════════════════════════════════════════════
function DashboardView({ db, user, setView, setActiveSess }) {
  function startSession(rid) {
    const r = db.routines.find(x=>x.id===rid); if (!r) return;
    const sets = (r.exercises||[]).flatMap(ex => {
      const libEx = exById(ex.libId);
      const planned = ex.plannedWeights||[];
      const sg = getSuggestion(db.logs, rid, ex.libId, planned, libEx?.inc);
      return Array.from({length:ex.sets},(_,i) => ({
        eid:ex.libId, setNum:i+1,
        weight:sg?.bySet?.[i]||planned?.[i]||"",
        suggestedWeight:sg?.bySet?.[i]||"",
        progressionReason:i===0?sg?.reason:"",
        reps:"", rir:"", fail:false,
      }));
    });
    setActiveSess({ rid, sets, note:"" });
    setView("session");
  }

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:10, letterSpacing:3, color:C.dimmer, textTransform:"uppercase", fontWeight:600 }}>Dashboard</div>
        <div style={{ fontSize:24, fontWeight:700, letterSpacing:-1, background: "linear-gradient(135deg, #fff, #a855f7)", backgroundClip: "text", WebkitBackgroundClip: "text", color: "transparent" }}>Hola, {user?.username} 👋</div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:8, marginBottom:24 }}>
        {[{v:db.logs.length,l:"Sesiones"},{v:db.routines.length,l:"Rutinas"},{v:db.programs.length,l:"Programas"},{v:EX.length,l:"Ejercicios"}].map(({v,l}) => (
          <Card key={l} style={{ textAlign:"center", padding:"14px 8px" }}>
            <div style={{ fontSize:30, fontWeight:700, letterSpacing:-1, fontFamily:FM }}>{v}</div>
            <div style={{ fontSize:10, letterSpacing:2, color:C.dimmer, textTransform:"uppercase", fontWeight:600, marginTop:4 }}>{l}</div>
          </Card>
        ))}
      </div>

      {db.programs.filter(p=>p.active).slice(0,2).map(p => {
        const done = db.logs.filter(l=>l.program_id===p.id).length;
        const total = (p.schedule||[]).length;
        const pct = total?Math.round(done/total*100):0;
        const next = (p.schedule||[])[done];
        return (
          <Card key={p.id} style={{ marginBottom:8, borderColor:"rgba(59,130,246,0.2)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
              <div><div style={{ fontWeight:600 }}>{p.exercise_name}</div><div style={{ fontSize:11, color:C.dim, marginTop:3 }}>{p.method} · +{p.inc_kg}kg/sesión</div></div>
              <Tag active color={C.blue}>{p.method}</Tag>
            </div>
            <div style={{ background:C.s3, borderRadius:3, height:3, marginBottom:8 }}><div style={{ background:C.blue, borderRadius:3, height:3, width:`${pct}%` }}/></div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:12 }}>
              <span style={{ color:C.dim }}>{done}/{total} · {pct}%</span>
              {next && <span style={{ fontFamily:FM, fontWeight:700 }}>→ {next.weight}kg × {next.sets}×{next.reps}</span>}
            </div>
          </Card>
        );
      })}

      {db.logs[0] && (
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:10, letterSpacing:3, color:C.dimmer, textTransform:"uppercase", fontWeight:600, marginBottom:12 }}>Última sesión</div>
          <Card>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div><div style={{ fontWeight:600 }}>{db.routines.find(r=>r.id===db.logs[0].routine_id)?.name||"—"}</div><div style={{ fontSize:11, color:C.dim, marginTop:4 }}>{fDate(db.logs[0].date)}</div></div>
              <div style={{ fontSize:20, color:C.dimmer }}>✓</div>
            </div>
          </Card>
        </div>
      )}

      {db.routines.length>0 ? (
        <div>
          <div style={{ fontSize:10, letterSpacing:3, color:C.dimmer, textTransform:"uppercase", fontWeight:600, marginBottom:12 }}>Comenzar sesión</div>
          {db.routines.map(r => {
            const last = db.logs.find(l=>l.routine_id===r.id);
            return (
              <Card key={r.id} onClick={()=>startSession(r.id)} style={{ cursor:"pointer", marginBottom:8 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div><div style={{ fontWeight:600 }}>{r.name}</div><div style={{ fontSize:11, color:C.dim, marginTop:4 }}>{(r.exercises||[]).length} ejercicios{last?` · ${fDate(last.date)}`:""}</div></div>
                  <span style={{ color:C.dimmer, fontSize:20 }}>›</span>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card style={{ textAlign:"center", padding:40 }}>
          <div style={{ fontSize:32, marginBottom:12 }}>🏋️</div>
          <div style={{ fontWeight:600, marginBottom:8 }}>Empezá acá</div>
          <div style={{ fontSize:13, color:C.dim, marginBottom:20 }}>Elegí un programa o creá tu primera rutina</div>
          <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
            <Btn onClick={()=>setView("programs")}>Ver programas</Btn>
            <Btn ghost onClick={()=>setView("routines")}>Crear rutina</Btn>
          </div>
        </Card>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════
//  PROGRAMS (sin cambios)
// ══════════════════════════════════════════════
function ProgramsView({ db, showToast, setView }) {
  const [tab, setTab] = useState("splits"); // splits | strength
  const SDEF = { exerciseId:"sq", method:"5x5", startWeight:"", weeks:16, incKg:2.5, incFreq:"session" };
  const [sForm, setSForm] = useState(SDEF);
  const [creating, setCreating] = useState(false);
  const [viewingStrength, setViewingStrength] = useState(null);
  const [importingId, setImportingId] = useState(null);
  const F = v => setSForm(p=>({...p,...v}));

  async function importSplit(split) {
    setImportingId(split.id);
    try {
      for (const day of split.days) {
        const exercises = day.exercises.map(eid => ({
          libId: eid,
          sets: 3,
          plannedWeights: ["","",""],
        }));
        await db.addRoutineSilent({ name: day.name, exercises });
      }
      showToast(`✓ ${split.days.length} rutinas de "${split.name}" agregadas`);
      setView("routines");
    } catch { showToast("Error al importar","err"); }
    setImportingId(null);
  }

  async function createStrength() {
    if (!sForm.startWeight) { showToast("Ingresá el peso inicial","err"); return; }
    const libEx = COMPOUNDS.find(e=>e.id===sForm.exerciseId);
    const schedule = genSchedule(sForm.method, parseFloat(sForm.startWeight), parseInt(sForm.weeks), parseFloat(sForm.incKg), sForm.incFreq);
    await db.addProgram({ exercise_id:sForm.exerciseId, exercise_name:libEx.name, method:sForm.method, start_weight:parseFloat(sForm.startWeight), weeks:parseInt(sForm.weeks), inc_kg:parseFloat(sForm.incKg), inc_freq:sForm.incFreq, schedule, active:true });
    setCreating(false); setSForm(SDEF);
  }

  return (
    <div>
      <PH supra="Programas" title="Programas de Entrenamiento"/>
      <div style={{ display:"flex", background:C.s1, borderRadius:10, padding:4, marginBottom:20 }}>
        {[["splits","Splits de Entrenamiento"],["strength","Progresión de Fuerza"]].map(([t,l]) => (
          <button key={t} onClick={()=>setTab(t)} style={{ flex:1, padding:"10px 8px", background:tab===t?C.white:"transparent", color:tab===t?C.bg:C.dim, border:"none", borderRadius:8, fontFamily:FS, fontSize:13, fontWeight:600, cursor:"pointer" }}>{l}</button>
        ))}
      </div>

      {tab==="splits" && (
        <div>
          <div style={{ fontSize:13, color:C.dim, marginBottom:20, lineHeight:1.6 }}>
            Elegí un programa para importar sus rutinas automáticamente. Cada día del programa se convierte en una rutina.
          </div>
          {SPLITS.map(split => (
            <Card key={split.id} style={{ marginBottom:12, borderColor:`${split.color}30` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                    <span style={{ fontSize:22 }}>{split.emoji}</span>
                    <div style={{ fontWeight:700, fontSize:16 }}>{split.name}</div>
                  </div>
                  <div style={{ fontSize:12, color:C.dim, lineHeight:1.5 }}>{split.description}</div>
                </div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:14 }}>
                {split.days.map((day, i) => (
                  <div key={i} style={{ background:C.s2, borderRadius:8, padding:"10px 12px" }}>
                    <div style={{ fontWeight:600, fontSize:13, marginBottom:6 }}>{day.name}</div>
                    <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                      {day.exercises.map(eid => {
                        const le = exById(eid);
                        return <span key={eid} style={{ fontSize:10, background:C.s3, borderRadius:4, padding:"2px 8px", color:C.dim }}>{le?.name||eid}</span>;
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <Btn onClick={() => importSplit(split)} disabled={importingId === split.id} full style={{ background: split.color, color:"#fff" }}>
                {importingId===split.id ? "Importando..." : `Importar ${split.name} → Mis Rutinas`}
              </Btn>
            </Card>
          ))}
        </div>
      )}

      {tab==="strength" && (
        <div>
          {viewingStrength ? (
            <div>
              <button onClick={()=>setViewingStrength(null)} style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none", color:C.dim, cursor:"pointer", fontFamily:FS, fontSize:13, marginBottom:20, padding:0 }}>‹ Volver</button>
              <div style={{ fontSize:20, fontWeight:700, marginBottom:4 }}>{viewingStrength.exercise_name}</div>
              <div style={{ fontSize:13, color:C.dim, marginBottom:20 }}>{viewingStrength.method} · {viewingStrength.weeks}sem · +{viewingStrength.inc_kg}kg/{viewingStrength.inc_freq==="session"?"sesión":"semana"}</div>
              {(() => {
                const done = db.logs.filter(l=>l.program_id===viewingStrength.id).length;
                const total = (viewingStrength.schedule||[]).length;
                const pct = Math.round(done/total*100)||0;
                const weeks = [...new Set((viewingStrength.schedule||[]).map(s=>s.week))];
                return (
                  <>
                    <Card style={{ marginBottom:20 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}><span style={{ fontWeight:600 }}>Progreso</span><span style={{ fontFamily:FM, color:C.blue }}>{done}/{total}</span></div>
                      <div style={{ background:C.s3, borderRadius:4, height:6 }}><div style={{ background:C.blue, borderRadius:4, height:6, width:`${pct}%` }}/></div>
                    </Card>
                    <Lbl>Semana por semana</Lbl>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                      {weeks.map(wk => {
                        const wkS = (viewingStrength.schedule||[]).filter(s=>s.week===wk);
                        const first = wkS[0];
                        const si = (viewingStrength.schedule||[]).findIndex(s=>s.week===wk);
                        const comp = si<done;
                        return (
                          <Card key={wk} style={{ borderColor:comp?"rgba(34,197,94,0.2)":first?.deload?"rgba(245,158,11,0.2)":C.b1, background:comp?"rgba(34,197,94,0.04)":C.s1 }}>
                            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                              <div style={{ fontSize:10, letterSpacing:2, color:C.dimmer, textTransform:"uppercase", fontWeight:600 }}>Sem {wk}</div>
                              <div style={{ display:"flex", gap:4 }}>{first?.deload&&<Tag active color={C.yellow}>Deload</Tag>}{comp&&<span style={{ color:C.green }}>✓</span>}</div>
                            </div>
                            <div style={{ fontFamily:FM, fontWeight:700, fontSize:16 }}>{first?.weight}kg</div>
                            <div style={{ fontSize:11, color:C.dim, marginTop:3 }}>{first?.sets}×{first?.reps} · {wkS.length}ses</div>
                          </Card>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </div>
          ) : (
            <>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:20 }}>
                {[{m:"5x5",col:C.blue,desc:"5×5 reps, 3 días/semana."},{m:"3x3",col:C.yellow,desc:"3×3 reps, 2 días/semana."}].map(({m,col,desc})=>(
                  <Card key={m} style={{ borderColor:`${col}30` }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}><div style={{ fontWeight:700 }}>{m}</div><Tag active color={col}>{m}</Tag></div>
                    <div style={{ fontSize:12, color:C.dim, lineHeight:1.5 }}>{desc}</div>
                  </Card>
                ))}
              </div>
              {!creating && <Btn onClick={()=>setCreating(true)} full style={{ marginBottom:16 }}>+ Nuevo programa de fuerza</Btn>}
              {creating && (
                <Card style={{ marginBottom:16, borderColor:C.b2 }}>
                  <div style={{ fontWeight:700, fontSize:15, marginBottom:16 }}>Configurar programa</div>
                  <Lbl>Ejercicio básico</Lbl>
                  <select value={sForm.exerciseId} onChange={e=>F({exerciseId:e.target.value})} style={{ marginBottom:14 }}>{COMPOUNDS.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select>
                  <Lbl>Método</Lbl>
                  <div style={{ marginBottom:14 }}><Toggle options={[{value:"5x5",label:"5×5"},{value:"3x3",label:"3×3"}]} value={sForm.method} onChange={v=>F({method:v,incKg:v==="5x5"?2.5:5})}/></div>
                  <Lbl>Peso inicial (kg)</Lbl>
                  <Inp type="number" value={sForm.startWeight} onChange={v=>F({startWeight:v})} placeholder="Ej: 60" style={{ marginBottom:14 }}/>
                  <Lbl>Incremento</Lbl>
                  <div style={{ marginBottom:14 }}><Toggle options={[{value:2.5,label:"+2.5kg"},{value:5,label:"+5kg"},{value:10,label:"+10kg"}]} value={sForm.incKg} onChange={v=>F({incKg:v})}/></div>
                  <Lbl>Frecuencia del incremento</Lbl>
                  <div style={{ marginBottom:14 }}><Toggle options={[{value:"session",label:"Cada sesión"},{value:"week",label:"Cada semana"},{value:"biweek",label:"Cada 15 días"}]} value={sForm.incFreq} onChange={v=>F({incFreq:v})}/></div>
                  <Lbl>Duración</Lbl>
                  <div style={{ marginBottom:14 }}><Toggle options={[{value:8,label:"8 sem"},{value:12,label:"12 sem"},{value:16,label:"16 sem"}]} value={sForm.weeks} onChange={v=>F({weeks:v})}/></div>
                  {sForm.startWeight && (() => {
                    const s = genSchedule(sForm.method,parseFloat(sForm.startWeight),sForm.weeks,parseFloat(sForm.incKg),sForm.incFreq);
                    const mW = s.filter(x=>!x.deload).slice(-1)[0]?.weight;
                    return (
                      <Card style={{ background:C.s2, marginBottom:14 }}>
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, textAlign:"center" }}>
                          {[{v:`${sForm.startWeight}kg`,l:"Semana 1"},{v:s.length,l:"Sesiones"},{v:`${mW}kg`,l:`Sem ${sForm.weeks}`}].map(({v,l})=>(
                            <div key={l}><div style={{ fontFamily:FM, fontWeight:700, fontSize:17 }}>{v}</div><div style={{ fontSize:10, color:C.dim, marginTop:3 }}>{l}</div></div>
                          ))}
                        </div>
                      </Card>
                    );
                  })()}
                  <div style={{ display:"flex", gap:8 }}><Btn onClick={createStrength} full>Crear</Btn><Btn ghost onClick={()=>setCreating(false)} full>Cancelar</Btn></div>
                </Card>
              )}
              {db.programs.map(p => {
                const done = db.logs.filter(l=>l.program_id===p.id).length;
                const total = (p.schedule||[]).length;
                const next = (p.schedule||[])[done];
                const pct = total?Math.round(done/total*100):0;
                return (
                  <Card key={p.id} onClick={()=>setViewingStrength(p)} style={{ cursor:"pointer", marginBottom:8 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                      <div><div style={{ fontWeight:600 }}>{p.exercise_name}</div><div style={{ fontSize:11, color:C.dim, marginTop:3 }}>+{p.inc_kg}kg · {p.weeks}sem</div></div>
                      <Tag active color={p.method==="5x5"?C.blue:C.yellow}>{p.method}</Tag>
                    </div>
                    <div style={{ background:C.s3, borderRadius:3, height:3, marginBottom:8 }}><div style={{ background:p.method==="5x5"?C.blue:C.yellow, borderRadius:3, height:3, width:`${pct}%` }}/></div>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:12 }}>
                      <span style={{ color:C.dim }}>{done}/{total} · {pct}%</span>
                      {next && <span style={{ fontFamily:FM, fontWeight:700 }}>→ {next.weight}kg × {next.sets}×{next.reps}</span>}
                    </div>
                    <div style={{ display:"flex", justifyContent:"flex-end", marginTop:8 }}>
                      <button onClick={e=>{e.stopPropagation();db.deleteProgram(p.id);}} style={{ background:"none", border:"none", color:C.dimmer, cursor:"pointer", fontSize:18 }}>×</button>
                    </div>
                  </Card>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════
//  ROUTINES (sin cambios)
// ══════════════════════════════════════════════
function RoutinesView({ db, showToast }) {
  const [building, setBuilding] = useState(null);
  const [mFilter, setMFilter] = useState("Todos");
  const [search, setSearch] = useState("");
  const [agendaEx, setAgendaEx] = useState(null);

  function startBuild(r=null) { setBuilding(r?{...r,exercises:[...(r.exercises||[])]}:{name:"",exercises:[]}); }
  function toggleEx(libId) {
    const has = building.exercises.find(e=>e.libId===libId);
    setBuilding(p=>({...p,exercises:has?p.exercises.filter(e=>e.libId!==libId):[...p.exercises,{libId,sets:3,plannedWeights:["","",""]}]}));
  }
  function updSets(libId,n) {
    setBuilding(p=>({...p,exercises:p.exercises.map(e=>{if(e.libId!==libId)return e;const pw=[...(e.plannedWeights||[])];while(pw.length<n)pw.push("");pw.length=n;return {...e,sets:n,plannedWeights:pw};})}));
  }
  function updWeight(libId,i,v) {
    setBuilding(p=>({...p,exercises:p.exercises.map(e=>{if(e.libId!==libId)return e;const pw=[...(e.plannedWeights||[])];while(pw.length<=i)pw.push("");pw[i]=v;return {...e,plannedWeights:pw};})}));
  }
  async function saveRoutine() {
    if (!building.name.trim()) { showToast("Poné un nombre","err"); return; }
    if (!building.exercises.length) { showToast("Agregá al menos 1 ejercicio","err"); return; }
    if (building.id) await db.updateRoutine(building.id,{name:building.name,exercises:building.exercises});
    else await db.addRoutine({name:building.name,exercises:building.exercises});
    setBuilding(null);
  }

  const filtLib = EX.filter(e=>(mFilter==="Todos"||e.muscle===mFilter)&&(!search||e.name.toLowerCase().includes(search.toLowerCase())));

  if (building) return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <button onClick={()=>setBuilding(null)} style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none", color:C.dim, cursor:"pointer", fontFamily:FS, fontSize:13, padding:0 }}>‹ Volver</button>
        <Btn onClick={saveRoutine}>Guardar rutina</Btn>
      </div>
      <Lbl>Nombre de la rutina</Lbl>
      <Inp value={building.name} onChange={v=>setBuilding(p=>({...p,name:v}))} placeholder="Ej: Push / Pull / Piernas" style={{ marginBottom:20 }}/>
      {building.exercises.length>0 && (
        <div style={{ marginBottom:20 }}>
          <Lbl>Ejercicios — tocá 📅 para ver historial de pesos</Lbl>
          {building.exercises.map(ex => (
            <ExConfig key={ex.libId} ex={ex} logs={db.logs} rid={building.id||"new"} routines={db.routines}
              onRemove={()=>toggleEx(ex.libId)}
              onSetCount={n=>updSets(ex.libId,n)}
              onSetWeight={(i,v)=>updWeight(ex.libId,i,v)}/>
          ))}
        </div>
      )}
      <Lbl>Agregar ejercicios</Lbl>
      <Inp value={search} onChange={setSearch} placeholder="Buscar ejercicio..." style={{ marginBottom:10 }}/>
      <div style={{ display:"flex", gap:6, marginBottom:12, flexWrap:"wrap" }}>{MUSCLES.map(m=><Tag key={m} active={mFilter===m} onClick={()=>setMFilter(m)}>{m}</Tag>)}</div>
      <div style={{ fontSize:11, color:C.dimmer, marginBottom:8 }}>{filtLib.length} ejercicios disponibles</div>
      {filtLib.map(le => {
        const sel = building.exercises.some(e=>e.libId===le.id);
        return (
          <div key={le.id} onClick={()=>toggleEx(le.id)} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"11px 14px", marginBottom:5, cursor:"pointer", borderRadius:10, background:sel?"rgba(255,255,255,0.05)":C.s1, border:`1px solid ${sel?C.b3:C.b1}` }}>
            <div><div style={{ fontSize:13, fontWeight:500 }}>{le.name}</div><div style={{ fontSize:10, color:C.dim, marginTop:2 }}>{le.muscle}{le.compound?" · ★":""}</div></div>
            <div style={{ width:22, height:22, borderRadius:6, flexShrink:0, background:sel?C.white:"transparent", border:`1.5px solid ${sel?C.white:C.dimmer}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
              {sel && <span style={{ fontSize:12, fontWeight:700, color:C.bg }}>✓</span>}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div>
      {agendaEx && <ExerciseAgendaModal open={!!agendaEx} onClose={()=>setAgendaEx(null)} exercise={agendaEx} logs={db.logs} routines={db.routines}/>}
      <PH supra="Rutinas" title="Mis Rutinas" action={<Btn onClick={()=>startBuild()}>+ Nueva</Btn>}/>
      {db.routines.length===0 && (
        <Card style={{ textAlign:"center", padding:48 }}>
          <div style={{ fontSize:32, marginBottom:12 }}>📋</div>
          <div style={{ fontWeight:600, marginBottom:8 }}>Sin rutinas aún</div>
          <div style={{ fontSize:13, color:C.dim }}>Creá una rutina o importá un programa</div>
        </Card>
      )}
      {db.routines.map(r => {
        const last = db.logs.find(l=>l.routine_id===r.id);
        return (
          <Card key={r.id} style={{ marginBottom:10 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
              <div style={{ fontWeight:600, fontSize:15 }}>{r.name}</div>
              <div style={{ display:"flex", gap:12 }}>
                <button onClick={()=>startBuild(r)} style={{ background:"none", border:"none", color:C.dim, cursor:"pointer", fontFamily:FS, fontSize:12, fontWeight:500 }}>Editar</button>
                <button onClick={()=>db.deleteRoutine(r.id)} style={{ background:"none", border:"none", color:C.dimmer, cursor:"pointer", fontSize:20, lineHeight:1 }}>×</button>
              </div>
            </div>
            {(r.exercises||[]).map(ex => {
              const le = exById(ex.libId);
              const hist = getHistory(db.logs, r.id, ex.libId);
              const lastH = hist[hist.length-1];
              return (
                <div key={ex.libId} style={{ padding:"9px 0", borderTop:`1px solid ${C.b1}` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div style={{ fontSize:13, fontWeight:500, cursor:"pointer", textDecoration:"underline", textDecorationColor:C.b2 }} onClick={()=>setAgendaEx({libId:ex.libId})}>{le?.name}</div>
                        <button onClick={()=>setAgendaEx({libId:ex.libId})} style={{ background:"none", border:"none", color:C.dim, cursor:"pointer", fontSize:13, lineHeight:1, padding:0 }} title="Ver historial">📅</button>
                      </div>
                      <div style={{ fontSize:10, color:C.dim, marginTop:2 }}>{ex.sets} series</div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      {(ex.plannedWeights||[]).some(w=>w) && (
                        <div style={{ display:"flex", gap:4, justifyContent:"flex-end", flexWrap:"wrap" }}>
                          {(ex.plannedWeights||[]).map((w,i) => <span key={i} style={{ fontSize:11, fontFamily:FM, color:w?C.green:C.dimmer, background:C.s2, borderRadius:4, padding:"2px 6px" }}>{w||"—"}kg</span>)}
                        </div>
                      )}
                      {lastH && <div style={{ fontSize:10, color:C.dim, marginTop:4 }}>{lastH.sets.map(s=>`${s.weight||"?"}×${s.reps||"?"}`).join(" | ")}</div>}
                    </div>
                  </div>
                </div>
              );
            })}
            {last && <div style={{ fontSize:10, color:C.dimmer, marginTop:8 }}>Última sesión: {fDate(last.date)}</div>}
          </Card>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════
//  SESSION (sin cambios)
// ══════════════════════════════════════════════
function SessionView({ db, session, setSession, setView, showToast }) {
  if (!session) return null;
  const routine = db.routines.find(r=>r.id===session.rid); if (!routine) return null;

  function upd(eid,n,f,v) { setSession(p=>({...p,sets:p.sets.map(s=>s.eid===eid&&s.setNum===n?{...s,[f]:v}:s)})); }
  function cpD(eid,from,w) { setSession(p=>({...p,sets:p.sets.map(s=>s.eid===eid&&s.setNum>=from?{...s,weight:w}:s)})); }
  async function save() {
    await db.saveLog({ routine_id:session.rid, program_id:session.programId||null, sets:session.sets, note:session.note });
    setSession(null); setView("dashboard"); showToast("Sesión guardada ✓");
  }

  const byEx = (routine.exercises||[]).map(ex => ({
    ex, le:exById(ex.libId),
    sets:session.sets.filter(s=>s.eid===ex.libId),
    hist:getHistory(db.logs,session.rid,ex.libId),
  }));

  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:10, letterSpacing:3, color:C.dimmer, textTransform:"uppercase", fontWeight:600 }}>Sesión activa</div>
        <div style={{ fontSize:20, fontWeight:700, letterSpacing:-0.5, marginTop:4 }}>{routine.name}</div>
        <div style={{ fontSize:11, color:C.dim, marginTop:4 }}>{new Date().toLocaleDateString("es-AR",{weekday:"long",day:"2-digit",month:"long"})}</div>
      </div>

      {byEx.map(({ex,le,sets,hist}) => {
        const pr = getPR(db.logs,ex.libId);
        const first = sets[0];
        const lastHist = hist[hist.length-1];
        return (
          <Card key={ex.libId} style={{ marginBottom:12 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
              <div><div style={{ fontWeight:600, fontSize:15 }}>{le?.name}</div><div style={{ fontSize:11, color:C.dim, marginTop:3 }}>{le?.muscle}{le?.compound?" · ★":""}</div></div>
              {pr && <div style={{ textAlign:"right" }}><div style={{ fontSize:9, letterSpacing:2, color:C.dimmer, textTransform:"uppercase", fontWeight:600 }}>PR</div><div style={{ fontFamily:FM, fontSize:13, fontWeight:600 }}>{pr.w}kg×{pr.r}</div></div>}
            </div>
            {lastHist && (
              <div style={{ background:C.s2, borderRadius:7, padding:"7px 10px", marginBottom:8, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ fontSize:10, color:C.dimmer }}>Anterior · {fShort(lastHist.date)}</div>
                <div style={{ display:"flex", gap:5 }}>{lastHist.sets.map((s,i)=><span key={i} style={{ fontFamily:FM, fontSize:12, color:s.fail?C.red:C.dim }}>S{i+1}:{s.weight||"?"}×{s.reps||"?"}</span>)}</div>
              </div>
            )}
            {first?.suggestedWeight&&first?.progressionReason && (
              <div style={{ background:C.greenBg, border:"1px solid rgba(34,197,94,0.18)", borderRadius:8, padding:"8px 12px", marginBottom:10, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ fontSize:11, color:C.green }}>↑ {first.progressionReason}</div>
                <div style={{ fontFamily:FM, fontSize:14, fontWeight:700, color:C.green }}>{first.suggestedWeight}kg</div>
              </div>
            )}
            <div style={{ display:"grid", gridTemplateColumns:"20px 1fr 50px 40px 30px", gap:6, marginBottom:6, alignItems:"center" }}>
              <div/>{["Peso kg","Reps","RIR","✓"].map((h,i)=><div key={i} style={{ fontSize:9, letterSpacing:2, color:C.dimmer, textTransform:"uppercase", fontWeight:600, textAlign:"center" }}>{h}</div>)}
            </div>
            {sets.map((set,idx) => (
              <div key={set.setNum} style={{ display:"grid", gridTemplateColumns:"20px 1fr 50px 40px 30px", gap:6, marginBottom:6, alignItems:"center" }}>
                <div style={{ fontFamily:FM, fontSize:10, color:C.dim, textAlign:"center", fontWeight:700 }}>S{set.setNum}</div>
                <div style={{ position:"relative" }}>
                  <input type="number" placeholder="kg" value={set.weight} onChange={e=>upd(ex.libId,set.setNum,"weight",e.target.value)}
                    style={{ width:"100%", background:set.weight?C.s2:C.blueBg, border:`1px solid ${set.weight?C.b2:"rgba(59,130,246,0.2)"}`, borderRadius:7, color:C.white, fontFamily:FM, fontSize:17, fontWeight:700, padding:"9px 26px 9px 8px", textAlign:"center", outline:"none" }}/>
                  {set.weight&&idx<sets.length-1&&<button onClick={()=>cpD(ex.libId,set.setNum+1,set.weight)} style={{ position:"absolute", right:4, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:C.dimmer, cursor:"pointer", fontSize:13 }}>↓</button>}
                </div>
                <input type="number" placeholder="—" value={set.reps} onChange={e=>upd(ex.libId,set.setNum,"reps",e.target.value)} style={{ background:C.s2, border:`1px solid ${C.b1}`, borderRadius:7, color:C.white, fontFamily:FM, fontSize:16, fontWeight:600, padding:"9px 4px", textAlign:"center", outline:"none", width:"100%" }}/>
                <input type="number" placeholder="—" value={set.rir} onChange={e=>upd(ex.libId,set.setNum,"rir",e.target.value)} style={{ background:C.s2, border:`1px solid ${C.b1}`, borderRadius:7, color:C.dim, fontFamily:FM, fontSize:16, fontWeight:600, padding:"9px 4px", textAlign:"center", outline:"none", width:"100%" }}/>
                <div onClick={()=>upd(ex.libId,set.setNum,"fail",!set.fail)} style={{ display:"flex", justifyContent:"center", cursor:"pointer" }}>
                  <div style={{ width:28, height:28, borderRadius:7, background:set.fail?C.red:"transparent", border:`1.5px solid ${set.fail?C.red:C.dimmer}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {set.fail&&<span style={{ color:C.white, fontSize:14 }}>✓</span>}
                  </div>
                </div>
              </div>
            ))}
            {sets.some(s=>s.weight&&s.reps) && (
              <div style={{ marginTop:8, paddingTop:8, borderTop:`1px solid ${C.b1}`, display:"flex", gap:5, flexWrap:"wrap" }}>
                {sets.filter(s=>s.weight&&s.reps).map(s=><div key={s.setNum} style={{ fontSize:11, background:s.fail?C.redBg:C.s2, border:`1px solid ${s.fail?"rgba(255,48,64,0.25)":C.b1}`, padding:"3px 8px", borderRadius:5, fontFamily:FM, color:s.fail?C.red:C.dim }}>S{s.setNum}:{s.weight}×{s.reps}{s.fail?" ✗":""}</div>)}
              </div>
            )}
          </Card>
        );
      })}

      <Card style={{ marginBottom:16 }}><Lbl>Notas de la sesión</Lbl><textarea placeholder="Sensaciones, energía..." value={session.note} onChange={e=>setSession(p=>({...p,note:e.target.value}))} style={{ minHeight:60 }}/></Card>
      <Btn onClick={save} full style={{ marginBottom:8 }}>Guardar sesión</Btn>
      <Btn ghost onClick={()=>{setSession(null);setView("dashboard");}} full>Cancelar</Btn>
    </div>
  );
}

// ══════════════════════════════════════════════
//  HISTORY (sin cambios)
// ══════════════════════════════════════════════
function HistoryView({ db, showToast }) {
  const [filter, setFilter] = useState(null);
  const filtered = filter?db.logs.filter(l=>l.routine_id===filter):db.logs;
  return (
    <div>
      <PH supra="Historial" title={`${db.logs.length} sesiones`}/>
      <div style={{ display:"flex", gap:6, marginBottom:16, flexWrap:"wrap" }}>
        <Tag active={!filter} onClick={()=>setFilter(null)}>Todas</Tag>
        {db.routines.map(r=><Tag key={r.id} active={filter===r.id} onClick={()=>setFilter(r.id)}>{r.name}</Tag>)}
      </div>
      {filtered.length===0&&<Card style={{ textAlign:"center", padding:48 }}><div style={{ fontSize:11, color:C.dimmer, letterSpacing:2, textTransform:"uppercase" }}>Sin sesiones</div></Card>}
      {filtered.map(log => {
        const rut = db.routines.find(r=>r.id===log.routine_id);
        const fails = (log.sets||[]).filter(s=>s.fail).length;
        const exIds = [...new Set((log.sets||[]).map(s=>s.eid))];
        return (
          <Card key={log.id} style={{ marginBottom:8 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
              <div><div style={{ fontWeight:600 }}>{rut?.name||"—"}</div><div style={{ fontSize:11, color:C.dim, marginTop:4 }}>{fDate(log.date)}</div></div>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                {fails>0&&<span style={{ fontSize:10, color:C.red, fontWeight:700 }}>{fails} FALLO{fails>1?"S":""}</span>}
                <button onClick={()=>db.deleteLog(log.id)} style={{ background:"none", border:"none", color:C.dimmer, cursor:"pointer", fontSize:20, lineHeight:1 }}>×</button>
              </div>
            </div>
            {exIds.map(eid => {
              const le = exById(eid);
              const sets = (log.sets||[]).filter(s=>s.eid===eid&&(s.weight||s.reps));
              if (!sets.length) return null;
              return (
                <div key={eid} style={{ padding:"8px 0", borderTop:`1px solid ${C.b1}` }}>
                  <div style={{ fontSize:12, color:C.dim, fontWeight:500, marginBottom:6 }}>{le?.name||eid}</div>
                  <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                    {sets.map(s=>(
                      <div key={s.setNum} style={{ background:s.fail?C.redBg:C.s2, border:`1px solid ${s.fail?"rgba(255,48,64,0.25)":C.b1}`, borderRadius:6, padding:"3px 9px" }}>
                        <span style={{ fontFamily:FM, fontSize:12 }}>S{s.setNum} {s.weight}kg×{s.reps}</span>
                        {s.rir!=null&&s.rir!==""&&<span style={{ fontSize:9, color:C.dimmer }}> R{s.rir}</span>}
                        {s.fail&&<span style={{ fontSize:9, color:C.red }}> ✗</span>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {log.note&&<div style={{ marginTop:10, fontSize:12, color:C.dimmer, fontStyle:"italic" }}>"{log.note}"</div>}
          </Card>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════
//  RECORDS (sin cambios)
// ══════════════════════════════════════════════
function RecordsView({ db }) {
  const [selectedEx, setSelectedEx] = useState(null);
  const usedIds = [...new Set(db.logs.flatMap(l=>(l.sets||[]).map(s=>s.eid)))];

  if (selectedEx) {
    const history = getExerciseHistory(db.logs, selectedEx);
    const le = exById(selectedEx);
    const pr = getPR(db.logs, selectedEx);
    return (
      <div>
        <button onClick={()=>setSelectedEx(null)} style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none", color:C.dim, cursor:"pointer", fontFamily:FS, fontSize:13, marginBottom:20, padding:0 }}>‹ Volver</button>
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:20, fontWeight:700 }}>{le?.name}</div>
          <div style={{ display:"flex", gap:8, marginTop:8 }}>
            <Tag active>{le?.muscle}</Tag>
            {le?.compound&&<Tag active color={C.yellow}>★ Básico</Tag>}
          </div>
        </div>
        {pr && (
          <Card style={{ marginBottom:16, borderColor:"rgba(34,197,94,0.3)", background:"rgba(34,197,94,0.06)" }}>
            <div style={{ fontSize:10, letterSpacing:2, color:C.green, textTransform:"uppercase", fontWeight:600, marginBottom:6 }}>🏆 Record Personal</div>
            <div style={{ fontFamily:FM, fontSize:28, fontWeight:700, color:C.green }}>{pr.w}kg × {pr.r} reps</div>
            <div style={{ fontSize:11, color:C.dim, marginTop:4 }}>{fDate(pr.date)}</div>
          </Card>
        )}
        {history.length>1 && (() => {
          const weights = history.map(h=>Math.max(...h.sets.map(s=>parseFloat(s.weight)||0)));
          const diff = weights[weights.length-1]-weights[0];
          return (
            <Card style={{ marginBottom:16 }}>
              <Lbl>Progresión total</Lbl>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, textAlign:"center" }}>
                <div><div style={{ fontFamily:FM, fontSize:18, fontWeight:700 }}>{weights[0]}kg</div><div style={{ fontSize:10, color:C.dim, marginTop:3 }}>Primera vez</div></div>
                <div><div style={{ fontFamily:FM, fontSize:22, fontWeight:700, color:diff>=0?C.green:C.red }}>{diff>=0?"+":""}{diff}kg</div><div style={{ fontSize:10, color:C.dim, marginTop:3 }}>{history.length} sesiones</div></div>
                <div><div style={{ fontFamily:FM, fontSize:18, fontWeight:700 }}>{weights[weights.length-1]}kg</div><div style={{ fontSize:10, color:C.dim, marginTop:3 }}>Última</div></div>
              </div>
            </Card>
          );
        })()}
        <Lbl>Agenda — Todos los registros</Lbl>
        {history.length===0 ? (
          <Card style={{ textAlign:"center", padding:32 }}><div style={{ fontSize:13, color:C.dimmer }}>Sin registros aún</div></Card>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {[...history].reverse().map((entry,i) => {
              const routine = db.routines.find(r=>r.id===entry.routineId);
              const isFirst = i===0;
              return (
                <Card key={i} style={{ borderColor:isFirst?"rgba(34,197,94,0.2)":C.b1, background:isFirst?C.greenBg:C.s1 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                    <div>
                      <div style={{ fontWeight:600, color:isFirst?C.green:C.white }}>{fDate(entry.date)}</div>
                      {routine&&<div style={{ fontSize:11, color:C.dim, marginTop:2 }}>{routine.name}</div>}
                    </div>
                    {isFirst&&<Tag active color={C.green}>Última sesión</Tag>}
                  </div>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    {entry.sets.map((s,j) => (
                      <div key={j} style={{ background:s.fail?C.redBg:C.s2, border:`1px solid ${s.fail?"rgba(255,48,64,0.25)":C.b1}`, borderRadius:8, padding:"8px 12px", textAlign:"center", minWidth:60 }}>
                        <div style={{ fontSize:9, color:C.dimmer, letterSpacing:1, textTransform:"uppercase" }}>S{j+1}</div>
                        <div style={{ fontFamily:FM, fontSize:16, fontWeight:700, color:s.fail?C.red:C.white }}>{s.weight||"—"}kg</div>
                        <div style={{ fontSize:11, color:C.dim }}>{s.reps||"—"} reps</div>
                        {s.rir!=null&&s.rir!==""&&<div style={{ fontSize:9, color:C.dimmer }}>RIR {s.rir}</div>}
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <PH supra="Records" title="Records Personales"/>
      <div style={{ fontSize:13, color:C.dim, marginBottom:16 }}>Tocá un ejercicio para ver toda la agenda de pesos.</div>
      {usedIds.length===0 && <Card style={{ textAlign:"center", padding:48 }}><div style={{ fontSize:11, color:C.dimmer, letterSpacing:2, textTransform:"uppercase" }}>Completá sesiones para ver tus PRs</div></Card>}
      {usedIds.map(eid => {
        const le = exById(eid);
        const pr = getPR(db.logs, eid);
        const hist = getExerciseHistory(db.logs, eid);
        return (
          <Card key={eid} onClick={()=>setSelectedEx(eid)} style={{ marginBottom:8, cursor:"pointer" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontWeight:600 }}>{le?.name||eid}</div>
                <div style={{ fontSize:11, color:C.dim, marginTop:3 }}>{le?.muscle} · {hist.length} sesión{hist.length!==1?"es":""}</div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                {pr ? (
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontFamily:FM, fontSize:18, fontWeight:700, color:C.green }}>{pr.w}kg × {pr.r}</div>
                    <div style={{ fontSize:10, color:C.dimmer }}>{fShort(pr.date)}</div>
                  </div>
                ) : <div style={{ fontSize:11, color:C.dimmer }}>—</div>}
                <span style={{ color:C.dimmer, fontSize:20 }}>›</span>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════
//  SETTINGS (sin cambios)
// ══════════════════════════════════════════════
function SettingsView({ user, onLogout }) {
  return (
    <div>
      <PH supra="Perfil" title={user?.username}/>
      <Card style={{ marginBottom:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ width:50, height:50, borderRadius:"50%", background:C.s3, border:`1px solid ${C.b2}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:700 }}>{user?.username?.[0]?.toUpperCase()}</div>
          <div><div style={{ fontWeight:700, fontSize:17 }}>{user?.username}</div><div style={{ fontSize:11, color:C.dim, marginTop:3 }}>Gym Tracker · Supabase ☁</div></div>
        </div>
      </Card>
      <Card style={{ marginBottom:12, background:C.s2 }}>
        <div style={{ fontSize:12, color:C.dim, lineHeight:1.6 }}>Tus datos están guardados en la nube. Accedé desde cualquier dispositivo con tu usuario y contraseña.</div>
      </Card>
      <Btn ghost onClick={onLogout} full>Cerrar sesión</Btn>
    </div>
  );
}
