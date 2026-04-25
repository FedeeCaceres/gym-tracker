import { useState, useEffect } from "react";

// ══════════════════════════════════════════════
//  CONFIGURACIÓN SUPABASE
// ══════════════════════════════════════════════
const SB_URL = "https://rmqeyhelqyxsxqxstdju.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtcWV5aGVscXl4c3hxeHN0ZGp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3ODY5ODgsImV4cCI6MjA5MjM2Mjk4OH0.beKo6hBjlqDCG_S5Wcsq4pfoErIC9ZG62p4DaRkLHYs";

// ── Supabase client ───────────────────────────
let ACCESS_TOKEN = null;

function getHeaders(auth = true) {
  return {
    "Content-Type": "application/json",
    "apikey": SB_KEY,
    "Authorization": `Bearer ${auth && ACCESS_TOKEN ? ACCESS_TOKEN : SB_KEY}`,
  };
}

async function sbFetch(url, options = {}) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

// Auth
async function signUp(email, password) {
  return sbFetch(`${SB_URL}/auth/v1/signup`, {
    method: "POST",
    headers: getHeaders(false),
    body: JSON.stringify({ email, password }),
  });
}

async function signIn(email, password) {
  return sbFetch(`${SB_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: getHeaders(false),
    body: JSON.stringify({ email, password }),
  });
}

async function refreshToken(rt) {
  return sbFetch(`${SB_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: getHeaders(false),
    body: JSON.stringify({ refresh_token: rt }),
  });
}

// DB
async function dbGet(table, query = "") {
  const { ok, data } = await sbFetch(
    `${SB_URL}/rest/v1/${table}?${query}&order=created_at.desc`,
    { headers: getHeaders() }
  );
  return ok && Array.isArray(data) ? data : [];
}

async function dbInsert(table, row) {
  return sbFetch(`${SB_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: { ...getHeaders(), "Prefer": "return=representation" },
    body: JSON.stringify(row),
  });
}

async function dbUpdate(table, id, data) {
  return sbFetch(`${SB_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: "PATCH",
    headers: { ...getHeaders(), "Prefer": "return=representation" },
    body: JSON.stringify(data),
  });
}

async function dbDelete(table, id) {
  return sbFetch(`${SB_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
}

// ── Session localStorage ──────────────────────
const SESSION_KEY = "gym_session";
function saveSession(data) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(data)); } catch {}
}
function loadSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; }
}
function clearSession() {
  try { localStorage.removeItem(SESSION_KEY); } catch {}
}

// ── Utils ─────────────────────────────────────
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}
function toEmail(username) {
  return `${username.trim().toLowerCase().replace(/[^a-z0-9]/g, "")}@gymtracker.app`;
}
function fDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
}
function fShort(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
}

// ── Exercise Library ──────────────────────────
const EX = [
  // Pecho
  { id:"bp",    name:"Press Banca con Barra",         muscle:"Pecho",   inc:2.5, compound:true },
  { id:"ibp",   name:"Press Inclinado con Barra",     muscle:"Pecho",   inc:2.5, compound:true },
  { id:"dbp",   name:"Press Plano Mancuernas",        muscle:"Pecho",   inc:2   },
  { id:"idbp",  name:"Press Inclinado Mancuernas",    muscle:"Pecho",   inc:2   },
  { id:"cfly",  name:"Aperturas en Polea Alta",       muscle:"Pecho",   inc:1.5 },
  { id:"pec",   name:"Pec Deck / Mariposa",           muscle:"Pecho",   inc:2.5 },
  { id:"dip",   name:"Fondos en Paralelas (Pecho)",   muscle:"Pecho",   inc:2.5 },
  { id:"pull",  name:"Pullover con Mancuerna",        muscle:"Pecho",   inc:2   },
  // Espalda
  { id:"dl",    name:"Peso Muerto",                   muscle:"Espalda", inc:5,   compound:true },
  { id:"row",   name:"Remo con Barra",                muscle:"Espalda", inc:2.5, compound:true },
  { id:"rdl",   name:"Peso Muerto Rumano",            muscle:"Espalda", inc:5,   compound:true },
  { id:"pu",    name:"Dominadas",                     muscle:"Espalda", inc:0   },
  { id:"lat",   name:"Jalones al Pecho",              muscle:"Espalda", inc:2.5 },
  { id:"lrow",  name:"Remo con Mancuerna",            muscle:"Espalda", inc:2   },
  { id:"crow",  name:"Remo en Polea Baja",            muscle:"Espalda", inc:2.5 },
  { id:"tbar",  name:"Remo en T",                     muscle:"Espalda", inc:2.5 },
  { id:"shrug", name:"Encogimientos de Hombros",      muscle:"Espalda", inc:5   },
  // Hombros
  { id:"ohp",   name:"Press Militar con Barra",       muscle:"Hombros", inc:2.5, compound:true },
  { id:"dbohp", name:"Press Mancuernas Hombros",      muscle:"Hombros", inc:2   },
  { id:"lat2",  name:"Elevaciones Laterales",         muscle:"Hombros", inc:1   },
  { id:"fron",  name:"Elevaciones Frontales",         muscle:"Hombros", inc:1   },
  { id:"arnd",  name:"Arnold Press",                  muscle:"Hombros", inc:2   },
  { id:"facep", name:"Face Pull en Polea",            muscle:"Hombros", inc:2   },
  // Bíceps
  { id:"bbcurl",name:"Curl Barra",                    muscle:"Bíceps",  inc:2.5 },
  { id:"dbcurl",name:"Curl Mancuernas",               muscle:"Bíceps",  inc:1   },
  { id:"hamm",  name:"Curl Martillo",                 muscle:"Bíceps",  inc:1   },
  { id:"zbcurl",name:"Curl Barra EZ",                 muscle:"Bíceps",  inc:2.5 },
  { id:"conc",  name:"Curl Concentrado",              muscle:"Bíceps",  inc:1   },
  // Tríceps
  { id:"tet",   name:"Extensión Polea Alta",          muscle:"Tríceps", inc:2.5 },
  { id:"cgp",   name:"Press Cerrado",                 muscle:"Tríceps", inc:2.5 },
  { id:"skul",  name:"Skull Crushers",                muscle:"Tríceps", inc:2.5 },
  { id:"copa",  name:"Copa con Mancuerna",            muscle:"Tríceps", inc:2   },
  { id:"ropes", name:"Extensión Polea Cuerda",        muscle:"Tríceps", inc:2.5 },
  // Piernas
  { id:"sq",    name:"Sentadilla con Barra",          muscle:"Piernas", inc:5,   compound:true },
  { id:"fsq",   name:"Sentadilla Frontal",            muscle:"Piernas", inc:5,   compound:true },
  { id:"lp",    name:"Prensa de Piernas",             muscle:"Piernas", inc:5   },
  { id:"legex", name:"Extensión de Cuádriceps",       muscle:"Piernas", inc:2.5 },
  { id:"lcurl", name:"Curl Femoral",                  muscle:"Piernas", inc:2.5 },
  { id:"lunge", name:"Zancadas con Mancuernas",       muscle:"Piernas", inc:2   },
  { id:"bsq",   name:"Sentadilla Búlgara",            muscle:"Piernas", inc:2.5 },
  // Glúteos
  { id:"ht",    name:"Hip Thrust con Barra",          muscle:"Glúteos", inc:5   },
  { id:"glkick",name:"Patada de Glúteo en Polea",     muscle:"Glúteos", inc:2.5 },
  { id:"abduc", name:"Abducción de Cadera",           muscle:"Glúteos", inc:2.5 },
  { id:"sumo",  name:"Sentadilla Sumo",               muscle:"Glúteos", inc:5   },
  // Gemelos
  { id:"sccalf",name:"Elevación Talones de Pie",      muscle:"Gemelos", inc:5   },
  { id:"sscalf",name:"Elevación Talones Sentado",     muscle:"Gemelos", inc:2.5 },
  // Core
  { id:"crp",   name:"Crunch en Polea",               muscle:"Core",    inc:2.5 },
  { id:"plank", name:"Plancha",                       muscle:"Core",    inc:0   },
  { id:"legr",  name:"Elevación de Piernas Colgado",  muscle:"Core",    inc:0   },
  { id:"russ",  name:"Giro Ruso con Peso",            muscle:"Core",    inc:2   },
];
const MUSCLES = ["Todos", ...new Set(EX.map(e => e.muscle))];
const COMPOUNDS = EX.filter(e => e.compound);

// ── Progression ───────────────────────────────
function genSchedule(method, startW, weeks, incKg, incFreq) {
  const out = []; let w = startW, n = 0;
  const perWeek = method === "5x5" ? 3 : 2;
  const S = method === "5x5" ? 5 : 3;
  let si = 0, bi = method === "5x5" ? 6 : 4;
  for (let wk = 1; wk <= weeks; wk++) {
    const dl = wk % 4 === 0;
    for (let s = 0; s < perWeek; s++) {
      n++;
      out.push({ n, week: wk, weight: dl ? Math.round(w * .7 * 2) / 2 : w, sets: S, reps: S, deload: dl });
      if (!dl) {
        si++;
        if (incFreq === "session") w = Math.round((w + incKg) * 2) / 2;
        else if (incFreq === "week" && s === perWeek - 1) w = Math.round((w + incKg) * 2) / 2;
        else if (incFreq === "biweek" && si >= bi) { w = Math.round((w + incKg) * 2) / 2; si = 0; }
      } else si = 0;
    }
  }
  return out;
}

function getHistory(logs, rid, eid) {
  return [...logs]
    .filter(l => l.routine_id === rid && (l.sets || []).some(s => s.eid === eid))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(l => ({ date: l.date, sets: (l.sets || []).filter(s => s.eid === eid) }));
}

function getSuggestion(logs, rid, eid, planned, inc = 2.5) {
  const hist = getHistory(logs, rid, eid);
  if (!hist.length) return planned?.length ? { bySet: planned, reason: "Peso planificado" } : null;
  const last = hist[hist.length - 1].sets;
  const bySet = last.map((s, i) => {
    const w = parseFloat(s.weight) || 0;
    if (!w) return planned?.[i] || "";
    const rir = s.rir != null && s.rir !== "" ? parseInt(s.rir) : null;
    if (s.fail || rir === 0) return String(Math.round((w + inc) * 2) / 2);
    if (rir != null && rir <= 2) return String(w);
    if (rir != null && rir >= 3) return String(Math.round((w + inc) * 2) / 2);
    return String(w);
  });
  const s0 = last[last.length - 1];
  const r0 = s0?.rir != null && s0.rir !== "" ? parseInt(s0.rir) : null;
  let reason = "Mismo peso";
  if (s0?.fail || r0 === 0) reason = `+${inc}kg — llegaste al fallo`;
  else if (r0 != null && r0 >= 3) reason = `+${inc}kg — RIR alto`;
  else if (r0 != null && r0 <= 2) reason = "Mismo peso — apuntá al fallo";
  return { bySet, reason };
}

function getPR(logs, eid) {
  let best = null;
  for (const log of logs)
    for (const s of (log.sets || []))
      if (s.eid === eid && s.weight && s.reps) {
        const w = +s.weight, r = +s.reps;
        if (!best || w > best.w || (w === best.w && r > best.r)) best = { w, r, date: log.date };
      }
  return best;
}

// ── Design tokens ─────────────────────────────
const C = {
  bg: "#080808", s1: "#101010", s2: "#171717", s3: "#1f1f1f",
  b1: "rgba(255,255,255,0.06)", b2: "rgba(255,255,255,0.10)", b3: "rgba(255,255,255,0.17)",
  white: "#fff", dim: "#707070", dimmer: "#383838",
  red: "#ff3040", redBg: "rgba(255,48,64,0.09)",
  green: "#22c55e", greenBg: "rgba(34,197,94,0.09)",
  blue: "#3b82f6", blueBg: "rgba(59,130,246,0.09)",
  yellow: "#f59e0b",
};
const FS = "'DM Sans','Helvetica Neue',Arial,sans-serif";
const FM = "'DM Mono','Courier New',monospace";

// ── Shared UI ─────────────────────────────────
function Btn({ onClick, children, ghost, danger, full, disabled, style: sx = {} }) {
  const bg = danger ? C.red : ghost ? "transparent" : C.white;
  const color = ghost ? C.white : C.bg;
  const border = ghost ? `1px solid ${C.b2}` : "none";
  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{
        fontFamily: FS, fontSize: 14, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
        background: bg, color, border, borderRadius: 9, padding: "12px 20px",
        opacity: disabled ? 0.4 : 1, ...(full ? { width: "100%" } : {}), ...sx,
      }}
    >
      {children}
    </button>
  );
}

function Input({ value, onChange, placeholder, type = "text", style: sx = {}, autoFocus }) {
  return (
    <input
      type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} autoFocus={autoFocus}
      style={{
        width: "100%", background: C.s2, border: `1px solid ${C.b1}`, borderRadius: 8,
        color: C.white, fontFamily: FS, fontSize: 14, padding: "11px 14px",
        boxSizing: "border-box", outline: "none", ...sx,
      }}
    />
  );
}

function Label({ children }) {
  return <div style={{ fontSize: 10, letterSpacing: 2.5, color: C.dimmer, textTransform: "uppercase", fontWeight: 600, marginBottom: 7 }}>{children}</div>;
}

function Tag({ children, active, onClick, color }) {
  return (
    <span onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", padding: "4px 12px", borderRadius: 20,
      fontSize: 10, letterSpacing: 1, fontWeight: 700, textTransform: "uppercase",
      cursor: onClick ? "pointer" : "default",
      background: active ? (color || C.white) : "transparent",
      color: active ? (color ? C.white : C.bg) : C.dim,
      border: `1px solid ${active ? (color || C.white) : C.b1}`,
    }}>{children}</span>
  );
}

function Card({ children, style: sx = {}, onClick }) {
  return (
    <div onClick={onClick} style={{ background: C.s1, border: `1px solid ${C.b1}`, borderRadius: 12, padding: 16, ...sx }}>
      {children}
    </div>
  );
}

function PageHeader({ supra, title, action }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
      <div>
        <div style={{ fontSize: 10, letterSpacing: 3, color: C.dimmer, textTransform: "uppercase", fontWeight: 600, marginBottom: 5 }}>{supra}</div>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>{title}</div>
      </div>
      {action}
    </div>
  );
}

function Toggle({ options, value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {options.map(o => (
        <button key={o.value} onClick={() => onChange(o.value)} style={{
          flex: 1, padding: "10px 4px", borderRadius: 8, fontFamily: FS, fontWeight: 600, fontSize: 12,
          cursor: "pointer", textAlign: "center", border: `1px solid ${value === o.value ? C.white : C.b1}`,
          background: value === o.value ? C.white : C.s2, color: value === o.value ? C.bg : C.dim,
        }}>{o.label}</button>
      ))}
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, fontFamily: FS, color: C.white }}>
      <div style={{ width: 28, height: 28, border: `1.5px solid ${C.dimmer}`, borderTop: `1.5px solid ${C.white}`, borderRadius: "50%", animation: "spin .8s linear infinite" }} />
      <div style={{ fontSize: 11, color: C.dimmer, letterSpacing: 2, textTransform: "uppercase" }}>Cargando...</div>
    </div>
  );
}

// ══════════════════════════════════════════════
//  MAIN APP
// ══════════════════════════════════════════════
export default function App() {
  const [status, setStatus] = useState("loading"); // loading | anon | authed
  const [user, setUser] = useState(null);
  const [view, setView] = useState("dashboard");
  const [activeSession, setActiveSession] = useState(null);
  const [toast, setToast] = useState(null);

  // DB state
  const [routines, setRoutines] = useState([]);
  const [logs, setLogs] = useState([]);
  const [programs, setPrograms] = useState([]);

  // Boot: restore session
  useEffect(() => {
    (async () => {
      const saved = loadSession();
      if (!saved?.refreshToken) { setStatus("anon"); return; }
      try {
        const { ok, data } = await refreshToken(saved.refreshToken);
        if (!ok || !data.access_token) { clearSession(); setStatus("anon"); return; }
        ACCESS_TOKEN = data.access_token;
        saveSession({ ...saved, refreshToken: data.refresh_token });
        setUser({ id: saved.userId, username: saved.username });
        await loadAll(saved.userId);
        setStatus("authed");
      } catch { clearSession(); setStatus("anon"); }
    })();
  }, []);

  async function loadAll(uid) {
    const [r, l, p] = await Promise.all([
      dbGet("routines", `user_id=eq.${uid}`),
      dbGet("logs", `user_id=eq.${uid}&order=date.desc`),
      dbGet("programs", `user_id=eq.${uid}`),
    ]);
    setRoutines(r); setLogs(l); setPrograms(p);
  }

  function showToast(msg, type = "ok") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleAuth(username, password, isRegister) {
    const email = toEmail(username);
    const { ok, data } = isRegister
      ? await signUp(email, password)
      : await signIn(email, password);

    if (!ok || !data.access_token) {
      const msg = data.error_description || data.message || "Error al conectar";
      if (msg.includes("already registered")) return showToast("Ese usuario ya existe", "err");
      if (msg.includes("Invalid login") || msg.includes("invalid_grant")) return showToast("Usuario o contraseña incorrectos", "err");
      if (msg.includes("Email not confirmed")) return showToast("Desactivá 'Confirm email' en Supabase Auth", "err");
      return showToast(msg, "err");
    }

    ACCESS_TOKEN = data.access_token;
    const uid = data.user?.id;
    const uname = username.trim();
    saveSession({ refreshToken: data.refresh_token, userId: uid, username: uname });
    setUser({ id: uid, username: uname });
    await loadAll(uid);
    setStatus("authed");
    showToast(isRegister ? `¡Bienvenido, ${uname}!` : `Hola, ${uname}!`);
  }

  async function handleLogout() {
    ACCESS_TOKEN = null;
    clearSession();
    setUser(null); setRoutines([]); setLogs([]); setPrograms([]);
    setActiveSession(null); setView("dashboard"); setStatus("anon");
  }

  // CRUD
  const db = {
    routines, logs, programs,
    addRoutine: async (data) => {
      const row = { ...data, id: genId(), user_id: user.id, created_at: new Date().toISOString() };
      const { ok } = await dbInsert("routines", row);
      if (ok) { setRoutines(p => [row, ...p]); showToast("Rutina creada ✓"); }
      else showToast("Error al guardar", "err");
    },
    updateRoutine: async (id, data) => {
      await dbUpdate("routines", id, data);
      setRoutines(p => p.map(r => r.id === id ? { ...r, ...data } : r));
      showToast("Rutina actualizada ✓");
    },
    deleteRoutine: async (id) => {
      await dbDelete("routines", id);
      setRoutines(p => p.filter(r => r.id !== id));
      showToast("Rutina eliminada");
    },
    saveLog: async (data) => {
      const row = { ...data, id: genId(), user_id: user.id, date: new Date().toISOString() };
      await dbInsert("logs", row);
      setLogs(p => [row, ...p]);
    },
    deleteLog: async (id) => {
      await dbDelete("logs", id);
      setLogs(p => p.filter(l => l.id !== id));
      showToast("Sesión eliminada");
    },
    addProgram: async (data) => {
      const row = { ...data, id: genId(), user_id: user.id, start_date: new Date().toISOString() };
      await dbInsert("programs", row);
      setPrograms(p => [row, ...p]);
      showToast("Programa creado ✓");
    },
    deleteProgram: async (id) => {
      await dbDelete("programs", id);
      setPrograms(p => p.filter(x => x.id !== id));
    },
  };

  const NAV = [
    { id: "dashboard", label: "Inicio",    icon: "🏠" },
    { id: "programs",  label: "Programas", icon: "📈" },
    { id: "routines",  label: "Rutinas",   icon: "📋" },
    { id: "history",   label: "Historial", icon: "🕐" },
    { id: "records",   label: "Records",   icon: "⭐" },
    { id: "settings",  label: "Perfil",    icon: "👤" },
  ];

  const currentView = activeSession ? "session" : view;

  if (status === "loading") return <Spinner />;
  if (status === "anon") return <AuthScreen onAuth={handleAuth} />;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: FS, color: C.white, display: "flex", flexDirection: "column" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
        input[type=number] { -moz-appearance: textfield; }
        textarea { font-family: ${FS}; color: ${C.white}; background: ${C.s2}; border: 1px solid ${C.b1}; border-radius: 8px; padding: 11px 14px; width: 100%; resize: vertical; outline: none; font-size: 14px; }
        select { background: ${C.s2}; border: 1px solid ${C.b1}; border-radius: 8px; color: ${C.white}; font-family: ${FS}; font-size: 14px; padding: 11px 14px; outline: none; width: 100%; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${C.dimmer}; border-radius: 2px; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Header */}
      <div style={{ padding: "14px 18px 12px", borderBottom: `1px solid ${C.b1}`, position: "sticky", top: 0, background: "rgba(8,8,8,0.96)", backdropFilter: "blur(20px)", zIndex: 100, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 3, color: C.dimmer, textTransform: "uppercase", fontWeight: 600 }}>Gym Tracker</div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{user?.username}</div>
        </div>
        {activeSession && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 11px", background: C.redBg, border: `1px solid ${C.red}`, borderRadius: 20 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.red }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: C.red, letterSpacing: 1 }}>SESIÓN ACTIVA</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: "20px 16px", paddingBottom: 80, maxWidth: 520, margin: "0 auto", width: "100%" }}>
        {currentView === "dashboard" && <DashboardView db={db} user={user} setView={setView} setActiveSession={setActiveSession} />}
        {currentView === "programs"  && <ProgramsView  db={db} showToast={showToast} />}
        {currentView === "routines"  && <RoutinesView  db={db} showToast={showToast} />}
        {currentView === "history"   && <HistoryView   db={db} showToast={showToast} />}
        {currentView === "records"   && <RecordsView   db={db} />}
        {currentView === "session"   && <SessionView   db={db} session={activeSession} setSession={setActiveSession} setView={setView} showToast={showToast} />}
        {currentView === "settings"  && <SettingsView  user={user} onLogout={handleLogout} />}
      </div>

      {/* Bottom Nav */}
      {!activeSession && (
        <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(8,8,8,0.96)", backdropFilter: "blur(20px)", borderTop: `1px solid ${C.b1}`, display: "flex", zIndex: 100 }}>
          {NAV.map(({ id, label, icon }) => (
            <button key={id} onClick={() => setView(id)} style={{
              flex: 1, padding: "9px 4px 7px", background: "none", border: "none",
              color: view === id ? C.white : C.dimmer, fontFamily: FS, fontSize: 8.5,
              letterSpacing: 1, textTransform: "uppercase", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              fontWeight: view === id ? 600 : 400,
            }}>
              <span style={{ fontSize: 18 }}>{icon}</span>
              {label}
              <div style={{ width: 3, height: 3, borderRadius: "50%", background: view === id ? C.white : "transparent" }} />
            </button>
          ))}
        </nav>
      )}

      {toast && (
        <div style={{
          position: "fixed", bottom: 86, left: "50%", transform: "translateX(-50%)",
          background: toast.type === "err" ? C.red : C.white,
          color: toast.type === "err" ? C.white : C.bg,
          padding: "10px 22px", borderRadius: 20, fontFamily: FS, fontSize: 13, fontWeight: 600,
          zIndex: 999, boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
          maxWidth: "90vw", textAlign: "center",
        }}>{toast.msg}</div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════
//  AUTH SCREEN
// ══════════════════════════════════════════════
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
    if (tab === "register" && password.length < 6) { setError("Mínimo 6 caracteres"); return; }
    if (tab === "register" && password !== confirm) { setError("Las contraseñas no coinciden"); return; }
    setLoading(true);
    await onAuth(username, password, tab === "register");
    setLoading(false);
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: FS, color: C.white }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,600;9..40,700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input { outline: none; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏋️</div>
          <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: -1 }}>Gym Tracker</div>
          <div style={{ fontSize: 13, color: C.dim, marginTop: 8 }}>Registrá tu progreso. Superá tus marcas.</div>
        </div>

        <div style={{ display: "flex", background: C.s1, borderRadius: 10, padding: 4, marginBottom: 18 }}>
          {[["login", "Ingresar"], ["register", "Registrarse"]].map(([t, l]) => (
            <button key={t} onClick={() => { setTab(t); setError(""); }} style={{
              flex: 1, padding: 10, background: tab === t ? C.white : "transparent",
              color: tab === t ? C.bg : C.dim, border: "none", borderRadius: 8,
              fontFamily: FS, fontSize: 14, fontWeight: 600, cursor: "pointer",
            }}>{l}</button>
          ))}
        </div>

        <Card>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <Label>Usuario</Label>
              <Input value={username} onChange={setUsername} placeholder="tunombre" autoFocus />
            </div>
            <div>
              <Label>Contraseña</Label>
              <Input value={password} onChange={setPassword} placeholder="••••••••" type="password" />
            </div>
            {tab === "register" && (
              <div>
                <Label>Confirmar contraseña</Label>
                <Input value={confirm} onChange={setConfirm} placeholder="••••••••" type="password" />
              </div>
            )}
            {error && (
              <div style={{ fontSize: 12, color: C.red, fontWeight: 500, padding: "8px 12px", background: C.redBg, borderRadius: 7 }}>
                {error}
              </div>
            )}
            <Btn onClick={submit} disabled={loading} full style={{ marginTop: 4 }}>
              {loading ? "Conectando..." : tab === "login" ? "Ingresar" : "Crear cuenta"}
            </Btn>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
//  DASHBOARD
// ══════════════════════════════════════════════
function DashboardView({ db, user, setView, setActiveSession }) {
  function startSession(rid) {
    const r = db.routines.find(x => x.id === rid);
    if (!r) return;
    const sets = (r.exercises || []).flatMap(ex => {
      const libEx = EX.find(l => l.id === ex.libId);
      const planned = ex.plannedWeights || [];
      const sg = getSuggestion(db.logs, rid, ex.libId, planned, libEx?.inc);
      return Array.from({ length: ex.sets }, (_, i) => ({
        eid: ex.libId, setNum: i + 1,
        weight: sg?.bySet?.[i] || planned?.[i] || "",
        suggestedWeight: sg?.bySet?.[i] || "",
        progressionReason: i === 0 ? sg?.reason : "",
        reps: "", rir: "", fail: false,
      }));
    });
    setActiveSession({ rid, sets, note: "" });
    setView("session");
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, letterSpacing: 3, color: C.dimmer, textTransform: "uppercase", fontWeight: 600, marginBottom: 5 }}>Dashboard</div>
        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: -1 }}>Hola, {user?.username} 👋</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8, marginBottom: 24 }}>
        {[{ v: db.logs.length, l: "Sesiones" }, { v: db.routines.length, l: "Rutinas" }, { v: db.programs.length, l: "Programas" }, { v: EX.length, l: "Ejercicios" }].map(({ v, l }) => (
          <Card key={l} style={{ textAlign: "center", padding: "14px 8px" }}>
            <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: -1, fontFamily: FM }}>{v}</div>
            <div style={{ fontSize: 10, letterSpacing: 2, color: C.dimmer, textTransform: "uppercase", fontWeight: 600, marginTop: 4 }}>{l}</div>
          </Card>
        ))}
      </div>

      {db.programs.filter(p => p.active).map(p => {
        const done = db.logs.filter(l => l.program_id === p.id).length;
        const total = (p.schedule || []).length;
        const pct = total ? Math.round(done / total * 100) : 0;
        const next = (p.schedule || [])[done];
        return (
          <Card key={p.id} style={{ marginBottom: 10, borderColor: "rgba(59,130,246,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <div>
                <div style={{ fontWeight: 600 }}>{p.exercise_name}</div>
                <div style={{ fontSize: 11, color: C.dim, marginTop: 3 }}>{p.method} · +{p.inc_kg}kg/{p.inc_freq === "session" ? "sesión" : p.inc_freq === "week" ? "semana" : "15 días"}</div>
              </div>
              <Tag active color={C.blue}>{p.method}</Tag>
            </div>
            <div style={{ background: C.s3, borderRadius: 3, height: 3, marginBottom: 8 }}>
              <div style={{ background: C.blue, borderRadius: 3, height: 3, width: `${pct}%` }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <span style={{ color: C.dim }}>{done}/{total} · {pct}%</span>
              {next && <span style={{ fontFamily: FM, fontWeight: 700 }}>→ {next.weight}kg × {next.sets}×{next.reps}</span>}
            </div>
          </Card>
        );
      })}

      {db.logs[0] && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 10, letterSpacing: 3, color: C.dimmer, textTransform: "uppercase", fontWeight: 600, marginBottom: 12 }}>Última sesión</div>
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 600 }}>{db.routines.find(r => r.id === db.logs[0].routine_id)?.name || "—"}</div>
                <div style={{ fontSize: 11, color: C.dim, marginTop: 4 }}>{fDate(db.logs[0].date)}</div>
              </div>
              <div style={{ fontSize: 20, color: C.dimmer }}>✓</div>
            </div>
          </Card>
        </div>
      )}

      {db.routines.length > 0 ? (
        <div>
          <div style={{ fontSize: 10, letterSpacing: 3, color: C.dimmer, textTransform: "uppercase", fontWeight: 600, marginBottom: 12 }}>Comenzar sesión</div>
          {db.routines.map(r => {
            const last = db.logs.find(l => l.routine_id === r.id);
            return (
              <Card key={r.id} onClick={() => startSession(r.id)} style={{ cursor: "pointer", marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: C.dim, marginTop: 4 }}>{(r.exercises || []).length} ejercicios{last ? ` · ${fDate(last.date)}` : ""}</div>
                  </div>
                  <span style={{ color: C.dimmer, fontSize: 20 }}>›</span>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🏋️</div>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Empezá acá</div>
          <div style={{ fontSize: 13, color: C.dim, marginBottom: 20 }}>Creá tu primera rutina para empezar a entrenar</div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <Btn onClick={() => setView("routines")}>Crear rutina</Btn>
            <Btn ghost onClick={() => setView("programs")}>Programas</Btn>
          </div>
        </Card>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════
//  ROUTINES
// ══════════════════════════════════════════════
function ExerciseConfig({ ex, logs, rid, onRemove, onSetCount, onSetWeight }) {
  const libEx = EX.find(l => l.id === ex.libId);
  const hist = getHistory(logs, rid, ex.libId);
  const [open, setOpen] = useState(false);

  return (
    <Card style={{ background: C.s2, borderColor: C.b2, marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: open ? 12 : 0 }}>
        <div style={{ flex: 1, cursor: "pointer" }} onClick={() => setOpen(p => !p)}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{libEx?.name}</div>
          <div style={{ fontSize: 11, color: C.dim, marginTop: 3 }}>{libEx?.muscle}{libEx?.compound ? " · ★" : ""} · {ex.sets} serie{ex.sets > 1 ? "s" : ""}</div>
          {!open && (ex.plannedWeights || []).some(w => w) && (
            <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
              {Array.from({ length: ex.sets }, (_, i) => (
                <span key={i} style={{ fontSize: 11, background: C.s3, borderRadius: 5, padding: "2px 7px", fontFamily: FM, color: (ex.plannedWeights || [])[i] ? C.green : C.dimmer }}>
                  S{i + 1}:{(ex.plannedWeights || [])[i] || "—"}kg
                </span>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginLeft: 8 }}>
          <button onClick={() => setOpen(p => !p)} style={{ background: "none", border: "none", color: C.dim, cursor: "pointer", fontSize: 18, transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }}>⌄</button>
          <button onClick={onRemove} style={{ background: "none", border: "none", color: C.dimmer, cursor: "pointer", fontSize: 20 }}>×</button>
        </div>
      </div>

      {open && (
        <div>
          <Label>Series</Label>
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} onClick={() => onSetCount(n)} style={{
                width: 38, height: 38, borderRadius: 8, fontFamily: FM, fontWeight: 700, fontSize: 15, cursor: "pointer",
                background: ex.sets === n ? C.white : C.s3, color: ex.sets === n ? C.bg : C.dim,
                border: `1px solid ${ex.sets === n ? C.white : C.b1}`,
              }}>{n}</button>
            ))}
          </div>

          <Label>Peso planificado por serie (kg)</Label>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${ex.sets},1fr)`, gap: 8, marginBottom: 10 }}>
            {Array.from({ length: ex.sets }, (_, i) => (
              <div key={i}>
                <div style={{ fontSize: 10, letterSpacing: 1.5, color: C.dimmer, textTransform: "uppercase", fontWeight: 600, marginBottom: 5, textAlign: "center" }}>S{i + 1}</div>
                <input
                  type="number"
                  placeholder="—"
                  value={(ex.plannedWeights || [])[i] || ""}
                  onChange={e => onSetWeight(i, e.target.value)}
                  style={{
                    width: "100%", borderRadius: 7, fontFamily: FM, fontSize: 16, fontWeight: 700,
                    padding: "8px 4px", textAlign: "center", outline: "none",
                    background: (ex.plannedWeights || [])[i] ? C.greenBg : C.s3,
                    border: `1px solid ${(ex.plannedWeights || [])[i] ? "rgba(34,197,94,0.3)" : C.b1}`,
                    color: (ex.plannedWeights || [])[i] ? C.green : C.white,
                  }}
                />
              </div>
            ))}
          </div>

          {ex.sets > 1 && (ex.plannedWeights || [])[0] && !(ex.plannedWeights || [])[1] && (
            <button onClick={() => { const w = (ex.plannedWeights || [])[0]; for (let i = 1; i < ex.sets; i++) onSetWeight(i, w); }}
              style={{ background: "none", border: `1px solid ${C.b1}`, borderRadius: 7, color: C.dim, fontFamily: FS, fontSize: 12, padding: "6px 12px", cursor: "pointer", marginBottom: 10, width: "100%" }}>
              Copiar S1 a todas las series
            </button>
          )}

          {hist.length > 0 && (
            <div>
              <Label>Historial en esta rutina</Label>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 120, overflowY: "auto" }}>
                {[...hist].reverse().slice(0, 5).map((h, i) => (
                  <div key={i} style={{ background: C.s3, borderRadius: 7, padding: "7px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 11, color: C.dim }}>{fShort(h.date)}</div>
                    <div style={{ display: "flex", gap: 5 }}>
                      {h.sets.map((s, j) => (
                        <span key={j} style={{ fontFamily: FM, fontSize: 12, color: s.fail ? C.red : C.white }}>
                          S{j + 1}:{s.weight || "?"}×{s.reps || "?"}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function RoutinesView({ db, showToast }) {
  const [building, setBuilding] = useState(null);
  const [muscleFilter, setMuscleFilter] = useState("Todos");
  const [search, setSearch] = useState("");

  function startBuild(r = null) {
    setBuilding(r ? { ...r, exercises: [...(r.exercises || [])] } : { name: "", exercises: [] });
  }

  function toggleExercise(libId) {
    const has = building.exercises.find(e => e.libId === libId);
    setBuilding(p => ({
      ...p, exercises: has
        ? p.exercises.filter(e => e.libId !== libId)
        : [...p.exercises, { libId, sets: 3, plannedWeights: ["", "", ""] }],
    }));
  }

  function updateSets(libId, n) {
    setBuilding(p => ({
      ...p, exercises: p.exercises.map(e => {
        if (e.libId !== libId) return e;
        const pw = [...(e.plannedWeights || [])];
        while (pw.length < n) pw.push(""); pw.length = n;
        return { ...e, sets: n, plannedWeights: pw };
      }),
    }));
  }

  function updateWeight(libId, i, v) {
    setBuilding(p => ({
      ...p, exercises: p.exercises.map(e => {
        if (e.libId !== libId) return e;
        const pw = [...(e.plannedWeights || [])];
        while (pw.length <= i) pw.push(""); pw[i] = v;
        return { ...e, plannedWeights: pw };
      }),
    }));
  }

  async function saveRoutine() {
    if (!building.name.trim()) { showToast("Poné un nombre", "err"); return; }
    if (!building.exercises.length) { showToast("Agregá al menos 1 ejercicio", "err"); return; }
    if (building.id) await db.updateRoutine(building.id, { name: building.name, exercises: building.exercises });
    else await db.addRoutine({ name: building.name, exercises: building.exercises });
    setBuilding(null);
  }

  const filteredLib = EX.filter(e =>
    (muscleFilter === "Todos" || e.muscle === muscleFilter) &&
    (!search || e.name.toLowerCase().includes(search.toLowerCase()))
  );

  if (building) return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <button onClick={() => setBuilding(null)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: C.dim, cursor: "pointer", fontFamily: FS, fontSize: 13, padding: 0 }}>
          ‹ Volver
        </button>
        <Btn onClick={saveRoutine}>Guardar rutina</Btn>
      </div>

      <Label>Nombre de la rutina</Label>
      <Input value={building.name} onChange={v => setBuilding(p => ({ ...p, name: v }))} placeholder="Ej: Push / Pull / Piernas" style={{ marginBottom: 20 }} />

      {building.exercises.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <Label>Ejercicios seleccionados — tocá para configurar pesos</Label>
          {building.exercises.map(ex => (
            <ExerciseConfig
              key={ex.libId} ex={ex} logs={db.logs} rid={building.id || "new"}
              onRemove={() => toggleExercise(ex.libId)}
              onSetCount={n => updateSets(ex.libId, n)}
              onSetWeight={(i, v) => updateWeight(ex.libId, i, v)}
            />
          ))}
        </div>
      )}

      <Label>Agregar ejercicios</Label>
      <Input value={search} onChange={setSearch} placeholder="Buscar ejercicio..." style={{ marginBottom: 10 }} />
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        {MUSCLES.map(m => <Tag key={m} active={muscleFilter === m} onClick={() => setMuscleFilter(m)}>{m}</Tag>)}
      </div>
      <div style={{ fontSize: 11, color: C.dimmer, marginBottom: 8 }}>{filteredLib.length} ejercicios</div>

      {filteredLib.map(libEx => {
        const sel = building.exercises.some(e => e.libId === libEx.id);
        return (
          <div key={libEx.id} onClick={() => toggleExercise(libEx.id)} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "11px 14px", marginBottom: 5, cursor: "pointer", borderRadius: 10,
            background: sel ? "rgba(255,255,255,0.05)" : C.s1,
            border: `1px solid ${sel ? C.b3 : C.b1}`,
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{libEx.name}</div>
              <div style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>{libEx.muscle}{libEx.compound ? " · ★" : ""}</div>
            </div>
            <div style={{
              width: 22, height: 22, borderRadius: 6, flexShrink: 0,
              background: sel ? C.white : "transparent",
              border: `1.5px solid ${sel ? C.white : C.dimmer}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {sel && <span style={{ fontSize: 12, fontWeight: 700, color: C.bg }}>✓</span>}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div>
      <PageHeader supra="Rutinas" title="Mis Rutinas" action={<Btn onClick={() => startBuild()}>+ Nueva</Btn>} />
      {db.routines.length === 0 && <Card style={{ textAlign: "center", padding: 48 }}><div style={{ fontSize: 11, color: C.dimmer, letterSpacing: 2, textTransform: "uppercase" }}>Sin rutinas — creá la primera</div></Card>}
      {db.routines.map(r => {
        const last = db.logs.find(l => l.routine_id === r.id);
        return (
          <Card key={r.id} style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{r.name}</div>
              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={() => startBuild(r)} style={{ background: "none", border: "none", color: C.dim, cursor: "pointer", fontFamily: FS, fontSize: 12, fontWeight: 500 }}>Editar</button>
                <button onClick={() => db.deleteRoutine(r.id)} style={{ background: "none", border: "none", color: C.dimmer, cursor: "pointer", fontSize: 20, lineHeight: 1 }}>×</button>
              </div>
            </div>
            {(r.exercises || []).map(ex => {
              const libEx = EX.find(l => l.id === ex.libId);
              const hist = getHistory(db.logs, r.id, ex.libId);
              const lastH = hist[hist.length - 1];
              return (
                <div key={ex.libId} style={{ padding: "8px 0", borderTop: `1px solid ${C.b1}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{libEx?.name}</div>
                      <div style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>{ex.sets} series</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      {(ex.plannedWeights || []).some(w => w) && (
                        <div style={{ display: "flex", gap: 4, justifyContent: "flex-end", flexWrap: "wrap" }}>
                          {(ex.plannedWeights || []).map((w, i) => (
                            <span key={i} style={{ fontSize: 11, fontFamily: FM, color: w ? C.green : C.dimmer, background: C.s2, borderRadius: 4, padding: "2px 6px" }}>{w || "—"}kg</span>
                          ))}
                        </div>
                      )}
                      {lastH && <div style={{ fontSize: 10, color: C.dim, marginTop: 4 }}>{lastH.sets.map(s => `${s.weight || "?"}×${s.reps || "?"}`).join(" | ")}</div>}
                    </div>
                  </div>
                </div>
              );
            })}
            {last && <div style={{ fontSize: 10, color: C.dimmer, marginTop: 8 }}>Última sesión: {fDate(last.date)}</div>}
          </Card>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════
//  SESSION
// ══════════════════════════════════════════════
function SessionView({ db, session, setSession, setView, showToast }) {
  if (!session) return null;
  const routine = db.routines.find(r => r.id === session.rid);
  if (!routine) return null;

  function updateSet(eid, setNum, field, value) {
    setSession(p => ({ ...p, sets: p.sets.map(s => s.eid === eid && s.setNum === setNum ? { ...s, [field]: value } : s) }));
  }

  function copyDown(eid, fromSetNum, weight) {
    setSession(p => ({ ...p, sets: p.sets.map(s => s.eid === eid && s.setNum >= fromSetNum ? { ...s, weight } : s) }));
  }

  async function saveSession() {
    await db.saveLog({ routine_id: session.rid, program_id: session.programId || null, sets: session.sets, note: session.note });
    setSession(null); setView("dashboard"); showToast("Sesión guardada ✓");
  }

  const byExercise = (routine.exercises || []).map(ex => ({
    ex, libEx: EX.find(l => l.id === ex.libId),
    sets: session.sets.filter(s => s.eid === ex.libId),
    hist: getHistory(db.logs, session.rid, ex.libId),
  }));

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10, letterSpacing: 3, color: C.dimmer, textTransform: "uppercase", fontWeight: 600 }}>Sesión activa</div>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.5, marginTop: 4 }}>{routine.name}</div>
        <div style={{ fontSize: 11, color: C.dim, marginTop: 4 }}>{new Date().toLocaleDateString("es-AR", { weekday: "long", day: "2-digit", month: "long" })}</div>
      </div>

      {byExercise.map(({ ex, libEx, sets, hist }) => {
        const pr = getPR(db.logs, ex.libId);
        const first = sets[0];
        const lastHist = hist[hist.length - 1];
        return (
          <Card key={ex.libId} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{libEx?.name}</div>
                <div style={{ fontSize: 11, color: C.dim, marginTop: 3 }}>{libEx?.muscle}{libEx?.compound ? " · ★" : ""}</div>
              </div>
              {pr && (
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 9, letterSpacing: 2, color: C.dimmer, textTransform: "uppercase", fontWeight: 600 }}>PR</div>
                  <div style={{ fontFamily: FM, fontSize: 13, fontWeight: 600 }}>{pr.w}kg×{pr.r}</div>
                </div>
              )}
            </div>

            {lastHist && (
              <div style={{ background: C.s2, borderRadius: 7, padding: "7px 10px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 10, color: C.dimmer }}>Anterior · {fShort(lastHist.date)}</div>
                <div style={{ display: "flex", gap: 5 }}>
                  {lastHist.sets.map((s, i) => <span key={i} style={{ fontFamily: FM, fontSize: 12, color: s.fail ? C.red : C.dim }}>S{i + 1}:{s.weight || "?"}×{s.reps || "?"}</span>)}
                </div>
              </div>
            )}

            {first?.suggestedWeight && first?.progressionReason && (
              <div style={{ background: C.greenBg, border: "1px solid rgba(34,197,94,0.18)", borderRadius: 8, padding: "8px 12px", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 11, color: C.green }}>↑ {first.progressionReason}</div>
                <div style={{ fontFamily: FM, fontSize: 14, fontWeight: 700, color: C.green }}>{first.suggestedWeight}kg</div>
              </div>
            )}

            {/* Column headers */}
            <div style={{ display: "grid", gridTemplateColumns: "20px 1fr 50px 40px 30px", gap: 6, marginBottom: 6, alignItems: "center" }}>
              <div />
              {["Peso kg", "Reps", "RIR", "✓"].map((h, i) => (
                <div key={i} style={{ fontSize: 9, letterSpacing: 2, color: C.dimmer, textTransform: "uppercase", fontWeight: 600, textAlign: "center" }}>{h}</div>
              ))}
            </div>

            {sets.map((set, idx) => (
              <div key={set.setNum} style={{ display: "grid", gridTemplateColumns: "20px 1fr 50px 40px 30px", gap: 6, marginBottom: 6, alignItems: "center" }}>
                <div style={{ fontFamily: FM, fontSize: 10, color: C.dim, textAlign: "center", fontWeight: 700 }}>S{set.setNum}</div>
                <div style={{ position: "relative" }}>
                  <input
                    type="number" placeholder="kg" value={set.weight}
                    onChange={e => updateSet(ex.libId, set.setNum, "weight", e.target.value)}
                    style={{ width: "100%", background: set.weight ? C.s2 : C.blueBg, border: `1px solid ${set.weight ? C.b2 : "rgba(59,130,246,0.2)"}`, borderRadius: 7, color: C.white, fontFamily: FM, fontSize: 17, fontWeight: 700, padding: "9px 26px 9px 8px", textAlign: "center", outline: "none" }}
                  />
                  {set.weight && idx < sets.length - 1 && (
                    <button onClick={() => copyDown(ex.libId, set.setNum + 1, set.weight)}
                      style={{ position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: C.dimmer, cursor: "pointer", fontSize: 13 }}>↓</button>
                  )}
                </div>
                <input type="number" placeholder="—" value={set.reps} onChange={e => updateSet(ex.libId, set.setNum, "reps", e.target.value)}
                  style={{ background: C.s2, border: `1px solid ${C.b1}`, borderRadius: 7, color: C.white, fontFamily: FM, fontSize: 16, fontWeight: 600, padding: "9px 4px", textAlign: "center", outline: "none", width: "100%" }} />
                <input type="number" placeholder="—" value={set.rir} onChange={e => updateSet(ex.libId, set.setNum, "rir", e.target.value)}
                  style={{ background: C.s2, border: `1px solid ${C.b1}`, borderRadius: 7, color: C.dim, fontFamily: FM, fontSize: 16, fontWeight: 600, padding: "9px 4px", textAlign: "center", outline: "none", width: "100%" }} />
                <div onClick={() => updateSet(ex.libId, set.setNum, "fail", !set.fail)} style={{ display: "flex", justifyContent: "center", cursor: "pointer" }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: set.fail ? C.red : "transparent", border: `1.5px solid ${set.fail ? C.red : C.dimmer}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {set.fail && <span style={{ color: C.white, fontSize: 14 }}>✓</span>}
                  </div>
                </div>
              </div>
            ))}

            {sets.some(s => s.weight && s.reps) && (
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.b1}`, display: "flex", gap: 5, flexWrap: "wrap" }}>
                {sets.filter(s => s.weight && s.reps).map(s => (
                  <div key={s.setNum} style={{ fontSize: 11, background: s.fail ? C.redBg : C.s2, border: `1px solid ${s.fail ? "rgba(255,48,64,0.25)" : C.b1}`, padding: "3px 8px", borderRadius: 5, fontFamily: FM, color: s.fail ? C.red : C.dim }}>
                    S{s.setNum}:{s.weight}×{s.reps}{s.fail ? " ✗" : ""}
                  </div>
                ))}
              </div>
            )}
          </Card>
        );
      })}

      <Card style={{ marginBottom: 16 }}>
        <Label>Notas de la sesión</Label>
        <textarea placeholder="Sensaciones, energía..." value={session.note} onChange={e => setSession(p => ({ ...p, note: e.target.value }))} style={{ minHeight: 60 }} />
      </Card>
      <Btn onClick={saveSession} full style={{ marginBottom: 8 }}>Guardar sesión</Btn>
      <Btn ghost onClick={() => { setSession(null); setView("dashboard"); }} full>Cancelar</Btn>
    </div>
  );
}

// ══════════════════════════════════════════════
//  PROGRAMS
// ══════════════════════════════════════════════
function ProgramsView({ db, showToast }) {
  const DEFAULTS = { exerciseId: "sq", method: "5x5", startWeight: "", weeks: 16, incKg: 2.5, incFreq: "session" };
  const [form, setForm] = useState(DEFAULTS);
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState(null);
  const F = v => setForm(p => ({ ...p, ...v }));

  async function createProgram() {
    if (!form.startWeight) { showToast("Ingresá el peso inicial", "err"); return; }
    const libEx = EX.find(e => e.id === form.exerciseId);
    const schedule = genSchedule(form.method, parseFloat(form.startWeight), parseInt(form.weeks), parseFloat(form.incKg), form.incFreq);
    await db.addProgram({ exercise_id: form.exerciseId, exercise_name: libEx.name, method: form.method, start_weight: parseFloat(form.startWeight), weeks: parseInt(form.weeks), inc_kg: parseFloat(form.incKg), inc_freq: form.incFreq, schedule, active: true });
    setCreating(false); setForm(DEFAULTS);
  }

  if (viewing) {
    const done = db.logs.filter(l => l.program_id === viewing.id).length;
    const weeks = [...new Set((viewing.schedule || []).map(s => s.week))];
    const pct = Math.round(done / (viewing.schedule || []).length * 100) || 0;
    return (
      <div>
        <button onClick={() => setViewing(null)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: C.dim, cursor: "pointer", fontFamily: FS, fontSize: 13, marginBottom: 20, padding: 0 }}>
          ‹ Volver
        </button>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{viewing.exercise_name}</div>
        <div style={{ fontSize: 13, color: C.dim, marginBottom: 20 }}>
          {viewing.method} · {viewing.weeks}sem · +{viewing.inc_kg}kg/{viewing.inc_freq === "session" ? "sesión" : viewing.inc_freq === "week" ? "semana" : "15 días"}
        </div>
        <Card style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontWeight: 600 }}>Progreso</span>
            <span style={{ fontFamily: FM, color: C.blue }}>{done}/{(viewing.schedule || []).length}</span>
          </div>
          <div style={{ background: C.s3, borderRadius: 4, height: 6 }}>
            <div style={{ background: C.blue, borderRadius: 4, height: 6, width: `${pct}%` }} />
          </div>
        </Card>
        <Label>Semana por semana</Label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {weeks.map(wk => {
            const wkSessions = (viewing.schedule || []).filter(s => s.week === wk);
            const first = wkSessions[0];
            const si = (viewing.schedule || []).findIndex(s => s.week === wk);
            const comp = si < done;
            return (
              <Card key={wk} style={{ borderColor: comp ? "rgba(34,197,94,0.2)" : first?.deload ? "rgba(245,158,11,0.2)" : C.b1, background: comp ? "rgba(34,197,94,0.04)" : C.s1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ fontSize: 10, letterSpacing: 2, color: C.dimmer, textTransform: "uppercase", fontWeight: 600 }}>Sem {wk}</div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {first?.deload && <Tag active color={C.yellow}>Deload</Tag>}
                    {comp && <span style={{ color: C.green }}>✓</span>}
                  </div>
                </div>
                <div style={{ fontFamily: FM, fontWeight: 700, fontSize: 16 }}>{first?.weight}kg</div>
                <div style={{ fontSize: 11, color: C.dim, marginTop: 3 }}>{first?.sets}×{first?.reps} · {wkSessions.length}ses</div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader supra="Programas" title="Progresión de Fuerza" action={!creating && <Btn onClick={() => setCreating(true)}>+ Nuevo</Btn>} />

      {!creating && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
          {[{ m: "5x5", col: C.blue, desc: "5×5 reps, 3 días/semana. Fuerza e hipertrofia." }, { m: "3x3", col: C.yellow, desc: "3×3 reps, 2 días/semana. Fuerza máxima." }].map(({ m, col, desc }) => (
            <Card key={m} style={{ borderColor: `${col}30` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ fontWeight: 700 }}>{m}</div>
                <Tag active color={col}>{m}</Tag>
              </div>
              <div style={{ fontSize: 12, color: C.dim, lineHeight: 1.5 }}>{desc}</div>
            </Card>
          ))}
        </div>
      )}

      {creating && (
        <Card style={{ marginBottom: 20, borderColor: C.b2 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Configurar programa</div>
          <Label>Ejercicio básico</Label>
          <select value={form.exerciseId} onChange={e => F({ exerciseId: e.target.value })} style={{ marginBottom: 14 }}>
            {COMPOUNDS.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <Label>Método</Label>
          <div style={{ marginBottom: 14 }}><Toggle options={[{ value: "5x5", label: "5×5" }, { value: "3x3", label: "3×3" }]} value={form.method} onChange={v => F({ method: v, incKg: v === "5x5" ? 2.5 : 5 })} /></div>
          <Label>Peso inicial (kg)</Label>
          <Input type="number" value={form.startWeight} onChange={v => F({ startWeight: v })} placeholder="Ej: 60" style={{ marginBottom: 14 }} />
          <Label>Incremento</Label>
          <div style={{ marginBottom: 14 }}><Toggle options={[{ value: 2.5, label: "+2.5kg" }, { value: 5, label: "+5kg" }, { value: 10, label: "+10kg" }]} value={form.incKg} onChange={v => F({ incKg: v })} /></div>
          <Label>Frecuencia del incremento</Label>
          <div style={{ marginBottom: 14 }}><Toggle options={[{ value: "session", label: "Cada sesión" }, { value: "week", label: "Cada semana" }, { value: "biweek", label: "Cada 15 días" }]} value={form.incFreq} onChange={v => F({ incFreq: v })} /></div>
          <Label>Duración</Label>
          <div style={{ marginBottom: 14 }}><Toggle options={[{ value: 8, label: "8 sem" }, { value: 12, label: "12 sem" }, { value: 16, label: "16 sem" }]} value={form.weeks} onChange={v => F({ weeks: v })} /></div>
          {form.startWeight && (() => {
            const sched = genSchedule(form.method, parseFloat(form.startWeight), form.weeks, parseFloat(form.incKg), form.incFreq);
            const maxW = sched.filter(x => !x.deload).slice(-1)[0]?.weight;
            return (
              <Card style={{ background: C.s2, borderColor: C.b2, marginBottom: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, textAlign: "center" }}>
                  {[{ v: `${form.startWeight}kg`, l: "Semana 1" }, { v: sched.length, l: "Sesiones" }, { v: `${maxW}kg`, l: `Sem ${form.weeks}` }].map(({ v, l }) => (
                    <div key={l}><div style={{ fontFamily: FM, fontWeight: 700, fontSize: 17 }}>{v}</div><div style={{ fontSize: 10, color: C.dim, marginTop: 3 }}>{l}</div></div>
                  ))}
                </div>
              </Card>
            );
          })()}
          <div style={{ display: "flex", gap: 8 }}>
            <Btn onClick={createProgram} full>Crear programa</Btn>
            <Btn ghost onClick={() => setCreating(false)} full>Cancelar</Btn>
          </div>
        </Card>
      )}

      {db.programs.map(p => {
        const done = db.logs.filter(l => l.program_id === p.id).length;
        const total = (p.schedule || []).length;
        const next = (p.schedule || [])[done];
        const pct = total ? Math.round(done / total * 100) : 0;
        return (
          <Card key={p.id} onClick={() => setViewing(p)} style={{ cursor: "pointer", marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <div>
                <div style={{ fontWeight: 600 }}>{p.exercise_name}</div>
                <div style={{ fontSize: 11, color: C.dim, marginTop: 3 }}>+{p.inc_kg}kg/{p.inc_freq === "session" ? "sesión" : p.inc_freq === "week" ? "semana" : "15 días"} · {p.weeks}sem</div>
              </div>
              <Tag active color={p.method === "5x5" ? C.blue : C.yellow}>{p.method}</Tag>
            </div>
            <div style={{ background: C.s3, borderRadius: 3, height: 3, marginBottom: 8 }}>
              <div style={{ background: p.method === "5x5" ? C.blue : C.yellow, borderRadius: 3, height: 3, width: `${pct}%` }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <span style={{ color: C.dim }}>{done}/{total} · {pct}%</span>
              {next && <span style={{ fontFamily: FM, fontWeight: 700 }}>→ {next.weight}kg × {next.sets}×{next.reps}</span>}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
              <button onClick={e => { e.stopPropagation(); db.deleteProgram(p.id); }} style={{ background: "none", border: "none", color: C.dimmer, cursor: "pointer", fontSize: 18 }}>×</button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════
//  HISTORY
// ══════════════════════════════════════════════
function HistoryView({ db, showToast }) {
  const [filter, setFilter] = useState(null);
  const filtered = filter ? db.logs.filter(l => l.routine_id === filter) : db.logs;

  return (
    <div>
      <PageHeader supra="Historial" title={`${db.logs.length} sesiones`} />
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        <Tag active={!filter} onClick={() => setFilter(null)}>Todas</Tag>
        {db.routines.map(r => <Tag key={r.id} active={filter === r.id} onClick={() => setFilter(r.id)}>{r.name}</Tag>)}
      </div>

      {filtered.length === 0 && <Card style={{ textAlign: "center", padding: 48 }}><div style={{ fontSize: 11, color: C.dimmer, letterSpacing: 2, textTransform: "uppercase" }}>Sin sesiones</div></Card>}

      {filtered.map(log => {
        const rut = db.routines.find(r => r.id === log.routine_id);
        const fails = (log.sets || []).filter(s => s.fail).length;
        const exIds = [...new Set((log.sets || []).map(s => s.eid))];
        return (
          <Card key={log.id} style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 600 }}>{rut?.name || "—"}</div>
                <div style={{ fontSize: 11, color: C.dim, marginTop: 4 }}>{fDate(log.date)}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {fails > 0 && <span style={{ fontSize: 10, color: C.red, fontWeight: 700 }}>{fails} FALLO{fails > 1 ? "S" : ""}</span>}
                <button onClick={() => db.deleteLog(log.id)} style={{ background: "none", border: "none", color: C.dimmer, cursor: "pointer", fontSize: 20, lineHeight: 1 }}>×</button>
              </div>
            </div>
            {exIds.map(eid => {
              const libEx = EX.find(e => e.id === eid);
              const sets = (log.sets || []).filter(s => s.eid === eid && (s.weight || s.reps));
              if (!sets.length) return null;
              return (
                <div key={eid} style={{ padding: "8px 0", borderTop: `1px solid ${C.b1}` }}>
                  <div style={{ fontSize: 12, color: C.dim, fontWeight: 500, marginBottom: 6 }}>{libEx?.name || eid}</div>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    {sets.map(s => (
                      <div key={s.setNum} style={{ display: "flex", alignItems: "center", gap: 4, background: s.fail ? C.redBg : C.s2, border: `1px solid ${s.fail ? "rgba(255,48,64,0.25)" : C.b1}`, borderRadius: 6, padding: "3px 9px" }}>
                        <span style={{ fontFamily: FM, fontSize: 12 }}>S{s.setNum} {s.weight}kg×{s.reps}</span>
                        {s.rir != null && s.rir !== "" && <span style={{ fontSize: 9, color: C.dimmer }}>R{s.rir}</span>}
                        {s.fail && <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.red }} />}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {log.note && <div style={{ marginTop: 10, fontSize: 12, color: C.dimmer, fontStyle: "italic" }}>"{log.note}"</div>}
          </Card>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════
//  RECORDS
// ══════════════════════════════════════════════
function RecordsView({ db }) {
  const ids = [...new Set(db.logs.flatMap(l => (l.sets || []).map(s => s.eid)))];
  return (
    <div>
      <PageHeader supra="Records" title="Records Personales" />
      {ids.length === 0 && <Card style={{ textAlign: "center", padding: 48 }}><div style={{ fontSize: 11, color: C.dimmer, letterSpacing: 2, textTransform: "uppercase" }}>Completá sesiones para ver tus PRs</div></Card>}
      {ids.map(eid => {
        const libEx = EX.find(e => e.id === eid);
        const pr = getPR(db.logs, eid);
        return (
          <Card key={eid} style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 600 }}>{libEx?.name || eid}</div>
                <div style={{ fontSize: 11, color: C.dim, marginTop: 3 }}>{libEx?.muscle}</div>
              </div>
              {pr ? (
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: FM, fontSize: 20, fontWeight: 700 }}>{pr.w}kg × {pr.r}</div>
                  <div style={{ fontSize: 10, color: C.dimmer, marginTop: 2 }}>{fDate(pr.date)}</div>
                </div>
              ) : <div style={{ fontSize: 11, color: C.dimmer }}>—</div>}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════
//  SETTINGS
// ══════════════════════════════════════════════
function SettingsView({ user, onLogout }) {
  return (
    <div>
      <PageHeader supra="Perfil" title={user?.username} />
      <Card style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 50, height: 50, borderRadius: "50%", background: C.s3, border: `1px solid ${C.b2}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700 }}>
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17 }}>{user?.username}</div>
            <div style={{ fontSize: 11, color: C.dim, marginTop: 3 }}>Gym Tracker · Supabase ☁</div>
          </div>
        </div>
      </Card>
      <Card style={{ marginBottom: 12, background: C.s2 }}>
        <div style={{ fontSize: 12, color: C.dim, lineHeight: 1.6 }}>
          Tus datos están guardados en la nube. Podés acceder desde cualquier dispositivo con tu usuario y contraseña.
        </div>
      </Card>
      <Btn ghost onClick={onLogout} full>Cerrar sesión</Btn>
    </div>
  );
}
