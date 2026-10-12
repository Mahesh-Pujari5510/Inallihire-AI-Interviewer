import { useState } from "react";
import {
  Brain, FileText, BarChart3, Users, LogOut, Send, TrendingUp,
  CheckCircle, Shield, Zap, Target, Award, BookOpen, Home,
  Loader2, X, Plus
} from "lucide-react";
import {
  AreaChart, Area, LineChart, Line, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

// ══════════════════════════════════════════════════════════
// CONSTANTS & MOCK DATA
// ══════════════════════════════════════════════════════════
const DEMO_USER  = { id: 1, name: "Mahesh K",  email: "demo@intellihire.com",  role: "user"  };
const ADMIN_USER = { id: 0, name: "Admin",      email: "admin@intellihire.com", role: "admin" };

const INIT_SESSIONS = [
  { id: 1, date: "Jun 1",  role: "Frontend Dev",      score: 85, q: 5 },
  { id: 2, date: "Jun 3",  role: "Backend Dev",       score: 78, q: 5 },
  { id: 3, date: "Jun 5",  role: "Full Stack Dev",    score: 90, q: 5 },
  { id: 4, date: "Jun 8",  role: "Data Analyst",      score: 72, q: 5 },
  { id: 5, date: "Jun 10", role: "Software Engineer", score: 88, q: 5 },
];

const RADAR_DATA = [
  { subject: "DSA",      score: 75 },
  { subject: "DBMS",     score: 82 },
  { subject: "OS",       score: 68 },
  { subject: "Networks", score: 71 },
  { subject: "OOP",      score: 88 },
  { subject: "Web Dev",  score: 90 },
];

const MOCK_USERS = [
  { id: 1, name: "Mahesh",   usn: "2VL23CS009", interviews: 5, avg: 84 },
  { id: 2, name: "Fayaz",    usn: "2VL23CS007", interviews: 3, avg: 76 },
  { id: 3, name: "Abhishek", usn: "2VL23CC001", interviews: 7, avg: 88 },
  { id: 4, name: "Yaseen",   usn: "2VL23CS011", interviews: 4, avg: 79 },
];

// ══════════════════════════════════════════════════════════
// AI HELPER
// ══════════════════════════════════════════════════════════
async function askAI(messages, system = "") {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, system, messages }),
  });
  const d = await res.json();
  return d.content?.[0]?.text ?? "";
}

function parseJSON(raw) {
  try { return JSON.parse(raw.replace(/```json|```/g, "").trim()); }
  catch { return null; }
}

// ══════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ══════════════════════════════════════════════════════════
function ScoreBadge({ score }) {
  const c = score >= 85
    ? { bg: "rgba(16,185,129,.15)", color: "#10B981" }
    : score >= 70
    ? { bg: "rgba(245,158,11,.15)", color: "#F59E0B" }
    : { bg: "rgba(239,68,68,.15)",  color: "#EF4444" };
  return (
    <span style={{ background: c.bg, color: c.color, padding: "3px 10px",
      borderRadius: 999, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>
      {score}%
    </span>
  );
}

function Card({ children, style = {}, className = "" }) {
  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-2xl ${className}`} style={style}>
      {children}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// SIDEBAR
// ══════════════════════════════════════════════════════════
function Sidebar({ page, nav, user, logout }) {
  const items = [
    { id: "dashboard", Icon: Home,      label: "Dashboard"       },
    { id: "interview", Icon: Brain,     label: "Mock Interview"  },
    { id: "resume",    Icon: FileText,  label: "Resume Analyzer" },
    { id: "analytics", Icon: BarChart3, label: "Analytics"       },
    ...(user.role === "admin" ? [{ id: "admin", Icon: Shield, label: "Admin Panel" }] : []),
  ];

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800">
      {/* Brand */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div style={{ background: "linear-gradient(135deg,#3B82F6,#06B6D4)",
            borderRadius: 12, width: 36, height: 36,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 12px rgba(59,130,246,.3)" }}>
            <Brain size={18} color="white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">IntelliHire</p>
            <p style={{ color: "#06B6D4", fontSize: 11, fontWeight: 600, marginTop: 2 }}>AI Platform</p>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-3 space-y-1">
        {items.map(({ id, Icon, label }) => (
          <button
            key={id}
            onClick={() => nav(id)}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={page === id
              ? { background: "rgba(59,130,246,.12)", border: "1px solid rgba(59,130,246,.25)", color: "#60A5FA" }
              : { color: "#94A3B8" }}>
            <Icon size={16} />
            {label}
          </button>
        ))}
      </nav>

      {/* User profile */}
      <div className="p-3 border-t border-slate-800">
        <div className="flex items-center gap-3 px-3 py-2.5 bg-slate-800 rounded-xl">
          <div style={{ width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg,#3B82F6,#06B6D4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
            {user.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user.name}</p>
            <p className="text-slate-400 text-xs">{user.role === "admin" ? "Administrator" : "Student"}</p>
          </div>
          <button onClick={logout} className="text-slate-500 hover:text-red-400 transition-colors">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// AUTH PAGE
// ══════════════════════════════════════════════════════════
function AuthPage({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const f = key => e => setForm(p => ({ ...p, [key]: e.target.value }));

  const submit = async () => {
    setError(""); setLoading(true);
    await new Promise(r => setTimeout(r, 700));
    if (isLogin) {
      if (form.email === DEMO_USER.email && form.password === "demo123") onLogin(DEMO_USER);
      else if (form.email === ADMIN_USER.email && form.password === "admin123") onLogin(ADMIN_USER);
      else setError("Invalid credentials. Use the demo credentials below.");
    } else {
      if (!form.name || !form.email || !form.password) setError("All fields are required.");
      else onLogin({ id: Date.now(), name: form.name, email: form.email, role: "user" });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div style={{ width: 72, height: 72, borderRadius: 22,
            background: "linear-gradient(135deg,#3B82F6,#06B6D4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px", boxShadow: "0 12px 32px rgba(59,130,246,.35)" }}>
            <Brain size={34} color="white" />
          </div>
          <h1 className="text-white text-3xl font-bold tracking-tight">IntelliHire AI</h1>
          <p className="text-slate-400 text-sm mt-2">AI-Powered Interview Preparation Platform</p>
          <p className="text-slate-600 text-xs mt-1">BASAV Engineering School of Technology · VTU</p>
        </div>

        {/* Card */}
        <Card className="p-8">
          <h2 className="text-white text-lg font-semibold mb-6">
            {isLogin ? "Sign In to Your Account" : "Create New Account"}
          </h2>

          <div className="space-y-4">
            {!isLogin && (
              <div>
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-1.5">Full Name</label>
                <input
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Your full name"
                  value={form.name} onChange={f("name")} />
              </div>
            )}
            <div>
              <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-1.5">Email Address</label>
              <input
                type="email"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="you@example.com"
                value={form.email} onChange={f("email")} />
            </div>
            <div>
              <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-1.5">Password</label>
              <input
                type="password"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="••••••••"
                value={form.password} onChange={f("password")}
                onKeyDown={e => e.key === "Enter" && submit()} />
            </div>
          </div>

          {error && (
            <div style={{ background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.25)",
              borderRadius: 12, padding: "10px 14px", color: "#F87171", fontSize: 13, marginTop: 16 }}>
              {error}
            </div>
          )}

          <button onClick={submit} disabled={loading}
            className="mt-6 w-full py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2 transition-opacity"
            style={{ background: "linear-gradient(90deg,#3B82F6,#06B6D4)", boxShadow: "0 4px 20px rgba(59,130,246,.3)" }}>
            {loading && <Loader2 size={16} className="animate-spin" />}
            {isLogin ? "Sign In" : "Create Account"}
          </button>

          <p className="text-center text-slate-500 text-sm mt-5">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => { setIsLogin(!isLogin); setError(""); }}
              style={{ color: "#60A5FA" }} className="font-medium">
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>

          {isLogin && (
            <div className="mt-4 bg-slate-800 rounded-xl p-3 text-xs text-slate-500 text-center leading-6">
              <span className="text-slate-400 font-medium">Demo:</span> demo@intellihire.com / demo123<br />
              <span className="text-slate-400 font-medium">Admin:</span> admin@intellihire.com / admin123
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// DASHBOARD PAGE
// ══════════════════════════════════════════════════════════
function DashboardPage({ user, sessions }) {
  const avg  = sessions.length ? Math.round(sessions.reduce((a, s) => a + s.score, 0) / sessions.length) : 0;
  const best = sessions.length ? Math.max(...sessions.map(s => s.score)) : 0;

  const stats = [
    { label: "Total Interviews", value: sessions.length, Icon: Brain,    color: "#3B82F6" },
    { label: "Average Score",    value: `${avg}%`,        Icon: Target,   color: "#06B6D4" },
    { label: "Best Score",       value: `${best}%`,       Icon: Award,    color: "#10B981" },
    { label: "Skills Covered",   value: "12",             Icon: BookOpen, color: "#A855F7" },
  ];

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-white text-2xl font-bold">
          Welcome back, {user.name.split(" ")[0]} 👋
        </h1>
        <p className="text-slate-400 text-sm mt-1">Continue your campus placement preparation journey</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        {stats.map(({ label, value, Icon, color }) => (
          <Card key={label} className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wider">{label}</p>
                <p className="text-white text-2xl font-bold mt-1.5">{value}</p>
              </div>
              <div style={{ width: 36, height: 36, borderRadius: 10,
                background: `${color}22`, display: "flex",
                alignItems: "center", justifyContent: "center" }}>
                <Icon size={17} style={{ color }} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card className="p-5">
        <p className="text-white text-sm font-semibold mb-4">Score Trend</p>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={sessions}>
            <defs>
              <linearGradient id="grd" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}    />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
            <XAxis dataKey="date"  stroke="#475569" tick={{ fontSize: 11, fill: "#475569" }} />
            <YAxis domain={[50,100]} stroke="#475569" tick={{ fontSize: 11, fill: "#475569" }} />
            <Tooltip contentStyle={{ background: "#0F172A", border: "1px solid #1E293B",
              borderRadius: 10, color: "#F8FAFC", fontSize: 12 }} />
            <Area type="monotone" dataKey="score" stroke="#3B82F6" strokeWidth={2} fill="url(#grd)" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Recent sessions */}
      <Card className="p-5">
        <p className="text-white text-sm font-semibold mb-4">Recent Sessions</p>
        <div className="space-y-2">
          {[...sessions].reverse().slice(0, 4).map(s => (
            <div key={s.id} className="flex items-center justify-between px-4 py-3 bg-slate-800 rounded-xl">
              <div className="flex items-center gap-3">
                <div style={{ width: 32, height: 32, borderRadius: 8,
                  background: "rgba(59,130,246,.15)", display: "flex",
                  alignItems: "center", justifyContent: "center" }}>
                  <Brain size={14} style={{ color: "#3B82F6" }} />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{s.role}</p>
                  <p className="text-slate-500 text-xs">{s.date} · {s.q || s.questions} questions</p>
                </div>
              </div>
              <ScoreBadge score={s.score} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// MOCK INTERVIEW PAGE
// ══════════════════════════════════════════════════════════
function InterviewPage({ onComplete }) {
  const [step,      setStep]    = useState("setup");
  const [config,    setConfig]  = useState({ role: "", level: "Fresher", skills: "" });
  const [questions, setQs]      = useState([]);
  const [qIdx,      setQIdx]    = useState(0);
  const [answer,    setAnswer]  = useState("");
  const [results,   setResults] = useState([]);
  const [busy,      setBusy]    = useState(false);

  const FALLBACK = role => [
    `Introduce yourself and explain why you're interested in the ${role} role.`,
    "Explain the concepts of Object-Oriented Programming with real examples.",
    "How do you handle errors and edge cases in your code? Describe your approach.",
    "Describe a challenging technical project you've worked on and how you solved problems.",
    `What are your key technical strengths relevant to a ${role} position?`,
  ];

  const startInterview = async () => {
    if (!config.role.trim()) return;
    setBusy(true); setStep("loading");
    try {
      const raw = await askAI(
        [{ role: "user", content: `Generate 5 interview questions for a ${config.level} applying for ${config.role}. Skills focus: ${config.skills || "general CS fundamentals"}. Mix: 3 technical + 2 behavioral. Return a JSON array of exactly 5 question strings. No explanation, no preamble.` }],
        "You are a senior technical interviewer at a top tech company. Return only a valid JSON array of strings."
      );
      const qs = parseJSON(raw);
      setQs(Array.isArray(qs) ? qs.slice(0, 5) : FALLBACK(config.role));
    } catch {
      setQs(FALLBACK(config.role));
    }
    setQIdx(0); setResults([]); setAnswer(""); setBusy(false); setStep("active");
  };

  const submitAnswer = async () => {
    if (!answer.trim() || busy) return;
    setBusy(true);
    let r = {
      question: questions[qIdx], answer,
      score: 72, feedback: "Good attempt! Keep practicing.",
      strong: "Clear communication", improve: "Add more technical depth"
    };
    try {
      const raw = await askAI(
        [{ role: "user", content: `Interview context: ${config.role} (${config.level})\nQuestion: "${questions[qIdx]}"\nCandidate's answer: "${answer}"\n\nEvaluate this answer critically. Return JSON only: {"score":<integer 0-100>,"feedback":"<2-3 specific sentences>","strong":"<one concrete strength>","improve":"<one concrete improvement>"}` }],
        "You are a strict but fair technical interviewer. Score honestly. Return only valid JSON."
      );
      const p = parseJSON(raw);
      if (p && typeof p.score === "number") r = { ...r, ...p };
    } catch {}

    const newResults = [...results, r];
    setResults(newResults);
    setAnswer("");
    setBusy(false);

    if (qIdx + 1 >= questions.length) {
      const avg = Math.round(newResults.reduce((a, x) => a + x.score, 0) / newResults.length);
      onComplete({ role: config.role, score: avg, questions: questions.length });
      setStep("result");
    } else {
      setQIdx(i => i + 1);
    }
  };

  const finalScore = results.length
    ? Math.round(results.reduce((a, r) => a + r.score, 0) / results.length)
    : 0;

  // ── SETUP SCREEN ──
  if (step === "setup") return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-white text-2xl font-bold">Mock Interview</h1>
        <p className="text-slate-400 text-sm mt-1">Set up your AI-powered practice session</p>
      </div>

      <Card className="p-6 space-y-5">
        <div>
          <label className="text-slate-300 text-xs font-semibold uppercase tracking-wider block mb-2">Job Role *</label>
          <input
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
            placeholder="e.g., Frontend Developer, Java Backend, Data Scientist"
            value={config.role}
            onChange={e => setConfig(c => ({ ...c, role: e.target.value }))} />
        </div>

        <div>
          <label className="text-slate-300 text-xs font-semibold uppercase tracking-wider block mb-2">Experience Level</label>
          <div className="flex gap-2">
            {["Fresher", "1-2 Years", "3-5 Years"].map(l => (
              <button key={l}
                onClick={() => setConfig(c => ({ ...c, level: l }))}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all"
                style={config.level === l
                  ? { background: "rgba(59,130,246,.15)", borderColor: "#3B82F6", color: "#60A5FA" }
                  : { background: "#1E293B", borderColor: "#334155", color: "#94A3B8" }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-slate-300 text-xs font-semibold uppercase tracking-wider block mb-2">
            Skills / Topics <span className="text-slate-500 normal-case font-normal">(optional)</span>
          </label>
          <input
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
            placeholder="e.g., React, DBMS, DSA, OOP, Node.js"
            value={config.skills}
            onChange={e => setConfig(c => ({ ...c, skills: e.target.value }))} />
        </div>

        <button
          onClick={startInterview}
          disabled={!config.role.trim()}
          className="w-full py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2 transition-opacity"
          style={{ background: "linear-gradient(90deg,#3B82F6,#06B6D4)", boxShadow: "0 4px 20px rgba(59,130,246,.25)" }}>
          <Brain size={17} /> Start Interview Session
        </button>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        {[
          { Icon: Zap,    label: "AI Questions",  sub: "Dynamically generated"   },
          { Icon: Target, label: "Live Scoring",  sub: "Evaluated instantly"      },
          { Icon: Award,  label: "Full Report",   sub: "Detailed feedback"        },
        ].map(({ Icon, label, sub }) => (
          <Card key={label} className="p-4 text-center">
            <Icon size={20} style={{ color: "#3B82F6", margin: "0 auto 8px" }} />
            <p className="text-white text-xs font-semibold">{label}</p>
            <p className="text-slate-500 text-xs mt-0.5">{sub}</p>
          </Card>
        ))}
      </div>
    </div>
  );

  // ── LOADING SCREEN ──
  if (step === "loading") return (
    <div className="flex items-center justify-center p-6 min-h-96">
      <div className="text-center">
        <div style={{ width: 72, height: 72, borderRadius: 22,
          background: "linear-gradient(135deg,#3B82F6,#06B6D4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 24px", boxShadow: "0 12px 32px rgba(59,130,246,.35)" }}>
          <Brain size={32} color="white" />
        </div>
        <p className="text-white font-semibold text-lg">Preparing your interview…</p>
        <p className="text-slate-400 text-sm mt-1">{config.role} · {config.level}</p>
        <div className="flex justify-center gap-2 mt-5">
          {[0, 1, 2].map(i => (
            <div key={i}
              className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    </div>
  );

  // ── ACTIVE INTERVIEW ──
  if (step === "active") return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white font-bold">{config.role}</p>
          <p className="text-slate-400 text-xs">{config.level} · Question {qIdx + 1} of {questions.length}</p>
        </div>
        <div className="flex gap-1.5">
          {questions.map((_, i) => (
            <div key={i} style={{
              width: 28, height: 6, borderRadius: 99,
              background: i < qIdx ? "#10B981" : i === qIdx ? "#3B82F6" : "#1E293B",
              transition: "background .3s"
            }} />
          ))}
        </div>
      </div>

      {/* Question */}
      <div style={{ background: "rgba(59,130,246,.08)", border: "1px solid rgba(59,130,246,.2)",
        borderRadius: 16, padding: 24 }}>
        <div className="flex items-center gap-2 mb-3">
          <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#3B82F6",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
            {qIdx + 1}
          </div>
          <span style={{ color: "#60A5FA", fontSize: 11, fontWeight: 700,
            textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Question {qIdx + 1}
          </span>
        </div>
        <p className="text-white text-base leading-relaxed">{questions[qIdx]}</p>
      </div>

      {/* Previous feedback */}
      {qIdx > 0 && results[qIdx - 1] && (
        <div style={{ background: "rgba(16,185,129,.08)", border: "1px solid rgba(16,185,129,.2)",
          borderRadius: 12, padding: "12px 16px" }}>
          <p style={{ color: "#10B981", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
            Previous answer scored: {results[qIdx - 1].score}%
          </p>
          <p className="text-slate-300 text-sm">{results[qIdx - 1].feedback}</p>
        </div>
      )}

      {/* Answer area */}
      <div>
        <label className="text-slate-300 text-xs font-semibold uppercase tracking-wider block mb-2">Your Answer</label>
        <textarea
          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors resize-none leading-relaxed"
          rows={6}
          placeholder="Type your answer here…"
          value={answer}
          onChange={e => setAnswer(e.target.value)} />
      </div>

      <button
        onClick={submitAnswer}
        disabled={!answer.trim() || busy}
        className="w-full py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2 transition-opacity"
        style={{ background: "linear-gradient(90deg,#3B82F6,#06B6D4)", boxShadow: "0 4px 20px rgba(59,130,246,.25)" }}>
        {busy
          ? <><Loader2 size={16} className="animate-spin" /> Evaluating…</>
          : <><Send size={15} /> {qIdx + 1 === questions.length ? "Submit & Finish" : "Submit Answer"}</>}
      </button>
    </div>
  );

  // ── RESULT SCREEN ──
  if (step === "result") return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      {/* Score card */}
      <div className="text-center"
        style={{ background: "rgba(59,130,246,.08)", border: "1px solid rgba(59,130,246,.2)",
          borderRadius: 20, padding: 36 }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%",
          background: "linear-gradient(135deg,#3B82F6,#06B6D4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px", boxShadow: "0 12px 32px rgba(59,130,246,.35)" }}>
          <Award size={40} color="white" />
        </div>
        <h2 className="text-white text-2xl font-bold">Interview Complete!</h2>
        <p className="text-slate-400 text-sm mt-1">{config.role} · {config.level}</p>
        <p className="text-white font-bold mt-4" style={{ fontSize: 56, lineHeight: 1 }}>
          {finalScore}
          <span style={{ color: "#3B82F6", fontSize: 28 }}>%</span>
        </p>
        <p className="mt-3 text-sm font-semibold" style={{
          color: finalScore >= 85 ? "#10B981" : finalScore >= 70 ? "#F59E0B" : "#EF4444"
        }}>
          {finalScore >= 85 ? "🎉 Excellent Performance!" : finalScore >= 70 ? "👍 Good Performance" : "📚 Needs More Practice"}
        </p>
      </div>

      {/* Per-question breakdown */}
      <div className="space-y-3">
        {results.map((r, i) => (
          <Card key={i} className="p-5">
            <div className="flex items-start justify-between gap-3 mb-2">
              <p className="text-white text-sm font-medium flex-1">{r.question}</p>
              <ScoreBadge score={r.score} />
            </div>
            <p className="text-slate-500 text-xs italic mb-3">
              "{r.answer.slice(0, 120)}{r.answer.length > 120 ? "…" : ""}"
            </p>
            <p className="text-slate-300 text-sm leading-relaxed">{r.feedback}</p>
            <div className="flex gap-2 mt-3">
              <div style={{ flex: 1, background: "rgba(16,185,129,.08)", border: "1px solid rgba(16,185,129,.2)",
                borderRadius: 8, padding: "8px 12px", color: "#10B981", fontSize: 12 }}>
                ✓ {r.strong}
              </div>
              <div style={{ flex: 1, background: "rgba(245,158,11,.08)", border: "1px solid rgba(245,158,11,.2)",
                borderRadius: 8, padding: "8px 12px", color: "#F59E0B", fontSize: 12 }}>
                ↑ {r.improve}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <button
        onClick={() => setStep("setup")}
        className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
        <Plus size={15} /> Start New Interview Session
      </button>
    </div>
  );

  return null;
}

// ══════════════════════════════════════════════════════════
// RESUME ANALYZER PAGE
// ══════════════════════════════════════════════════════════
function ResumeAnalyzerPage() {
  const [text,   setText]   = useState("");
  const [result, setResult] = useState(null);
  const [busy,   setBusy]   = useState(false);

  const analyze = async () => {
    if (!text.trim()) return;
    setBusy(true); setResult(null);
    try {
      const raw = await askAI(
        [{ role: "user", content: `Analyze this resume for ATS compatibility and quality. Return JSON only: {"atsScore":<integer 0-100>,"overallRating":"Excellent|Good|Average|Needs Work","summary":"<2 specific sentences about this resume>","strengths":["<specific item>","<specific item>","<specific item>"],"improvements":["<specific item>","<specific item>","<specific item>","<specific item>"],"keywords":["<keyword>","<keyword>","<keyword>","<keyword>","<keyword>"]}\n\nResume content:\n${text}` }],
        "You are an expert ATS resume reviewer with 10 years experience. Analyze specifically. Return only valid JSON."
      );
      const parsed = parseJSON(raw);
      setResult(parsed || {
        atsScore: 70, overallRating: "Good",
        summary: "Your resume shows solid technical skills with good project coverage. Formatting and keyword optimization can be improved.",
        strengths: ["Technical skills clearly listed", "Project experience included", "Education section is complete"],
        improvements: ["Quantify achievements with numbers", "Add GitHub and LinkedIn profile links", "Use stronger action verbs", "Include relevant certifications"],
        keywords: ["React", "Node.js", "MongoDB", "REST API", "OOP"],
      });
    } catch {
      setResult({
        atsScore: 68, overallRating: "Good",
        summary: "Solid resume with good foundational elements. Several improvements can boost ATS ranking significantly.",
        strengths: ["Core technical skills present", "Academic background is clear"],
        improvements: ["Add measurable impact to projects", "Include online portfolio links", "Use bullet points consistently"],
        keywords: ["Java", "Python", "SQL", "DSA", "DBMS"],
      });
    }
    setBusy(false);
  };

  if (!result) return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-white text-2xl font-bold">Resume Analyzer</h1>
        <p className="text-slate-400 text-sm mt-1">AI-powered ATS compatibility and quality analysis</p>
      </div>

      <Card className="p-6 space-y-4">
        <div>
          <label className="text-slate-300 text-xs font-semibold uppercase tracking-wider block mb-2">Paste Your Resume</label>
          <textarea
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors resize-none font-mono leading-relaxed"
            rows={14}
            placeholder={"Paste your resume text here…\n\nTip: Include all sections:\n• Contact Info & Links\n• Education\n• Technical Skills\n• Projects\n• Work Experience\n• Certifications"}
            value={text}
            onChange={e => setText(e.target.value)} />
          <p className="text-slate-600 text-xs mt-1.5 text-right">{text.length} characters</p>
        </div>

        <button
          onClick={analyze}
          disabled={!text.trim() || busy}
          className="w-full py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2 transition-opacity"
          style={{ background: "linear-gradient(90deg,#3B82F6,#06B6D4)", boxShadow: "0 4px 20px rgba(59,130,246,.25)" }}>
          {busy
            ? <><Loader2 size={16} className="animate-spin" /> Analyzing Resume…</>
            : <><FileText size={16} /> Analyze Resume</>}
        </button>
      </Card>
    </div>
  );

  const ratingStyle =
    result.overallRating === "Excellent" ? { bg: "rgba(16,185,129,.15)", color: "#10B981", border: "rgba(16,185,129,.3)" } :
    result.overallRating === "Good"      ? { bg: "rgba(59,130,246,.15)",  color: "#60A5FA", border: "rgba(59,130,246,.3)"  } :
    result.overallRating === "Average"   ? { bg: "rgba(245,158,11,.15)", color: "#F59E0B", border: "rgba(245,158,11,.3)" } :
                                           { bg: "rgba(239,68,68,.15)",  color: "#F87171", border: "rgba(239,68,68,.3)"  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <h1 className="text-white text-xl font-bold flex-1">Resume Analysis Report</h1>
        <button
          onClick={() => { setResult(null); setText(""); }}
          className="text-slate-500 hover:text-white flex items-center gap-1.5 text-sm transition-colors">
          <X size={14} /> Analyze New
        </button>
      </div>

      {/* ATS Score card */}
      <div style={{ background: "rgba(59,130,246,.08)", border: "1px solid rgba(59,130,246,.2)",
        borderRadius: 20, padding: 28 }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-wider">ATS Compatibility Score</p>
            <p className="text-white font-bold mt-1" style={{ fontSize: 52, lineHeight: 1.1 }}>
              {result.atsScore}
              <span style={{ color: "#3B82F6", fontSize: 26 }}>%</span>
            </p>
            <span style={{ ...ratingStyle, padding: "4px 14px", borderRadius: 999, fontSize: 12,
              fontWeight: 700, display: "inline-block", marginTop: 10, border: `1px solid ${ratingStyle.border}` }}>
              {result.overallRating}
            </span>
          </div>
          <div style={{ width: 76, height: 76, borderRadius: "50%",
            border: "2px solid rgba(59,130,246,.25)",
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FileText size={30} style={{ color: "#3B82F6" }} />
          </div>
        </div>
        <p className="text-slate-300 text-sm mt-4 leading-relaxed">{result.summary}</p>
      </div>

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-2 gap-4">
        <div style={{ background: "rgba(16,185,129,.08)", border: "1px solid rgba(16,185,129,.2)",
          borderRadius: 16, padding: 16 }}>
          <p style={{ color: "#10B981", fontSize: 11, fontWeight: 700,
            textTransform: "uppercase", letterSpacing: "0.05em",
            display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <CheckCircle size={13} /> Strengths
          </p>
          <ul className="space-y-2.5">
            {result.strengths?.map((s, i) => (
              <li key={i} className="flex items-start gap-2">
                <span style={{ color: "#10B981", flexShrink: 0, marginTop: 1, fontSize: 14 }}>•</span>
                <span className="text-slate-300 text-xs leading-relaxed">{s}</span>
              </li>
            ))}
          </ul>
        </div>

        <div style={{ background: "rgba(245,158,11,.08)", border: "1px solid rgba(245,158,11,.2)",
          borderRadius: 16, padding: 16 }}>
          <p style={{ color: "#F59E0B", fontSize: 11, fontWeight: 700,
            textTransform: "uppercase", letterSpacing: "0.05em",
            display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <TrendingUp size={13} /> Improvements
          </p>
          <ul className="space-y-2.5">
            {result.improvements?.map((s, i) => (
              <li key={i} className="flex items-start gap-2">
                <span style={{ color: "#F59E0B", flexShrink: 0, marginTop: 1 }}>↑</span>
                <span className="text-slate-300 text-xs leading-relaxed">{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Keywords */}
      <Card className="p-4">
        <p className="text-white text-xs font-semibold uppercase tracking-wider mb-3">Detected Keywords</p>
        <div className="flex flex-wrap gap-2">
          {result.keywords?.map((k, i) => (
            <span key={i} style={{ background: "rgba(59,130,246,.12)", border: "1px solid rgba(59,130,246,.2)",
              color: "#93C5FD", padding: "4px 12px", borderRadius: 999, fontSize: 12 }}>
              {k}
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ANALYTICS PAGE
// ══════════════════════════════════════════════════════════
function AnalyticsPage({ sessions }) {
  const avg   = sessions.length ? Math.round(sessions.reduce((a, s) => a + s.score, 0) / sessions.length) : 0;
  const delta = sessions.length >= 2 ? sessions[sessions.length - 1].score - sessions[0].score : 0;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-white text-2xl font-bold">Performance Analytics</h1>
        <p className="text-slate-400 text-sm mt-1">Track your interview preparation progress</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Sessions", value: sessions.length, color: "#3B82F6" },
          { label: "Average Score",  value: `${avg}%`,        color: "#06B6D4" },
          { label: "Progress",       value: `${delta >= 0 ? "+" : ""}${delta}%`, color: delta >= 0 ? "#10B981" : "#EF4444" },
        ].map(({ label, value, color }) => (
          <Card key={label} className="p-4 text-center">
            <p className="text-slate-400 text-xs uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold mt-1.5" style={{ color }}>{value}</p>
          </Card>
        ))}
      </div>

      {/* Score line chart */}
      <Card className="p-5">
        <p className="text-white text-sm font-semibold mb-4">Score Progression</p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={sessions}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
            <XAxis dataKey="date" stroke="#475569" tick={{ fontSize: 11, fill: "#475569" }} />
            <YAxis domain={[50, 100]} stroke="#475569" tick={{ fontSize: 11, fill: "#475569" }} />
            <Tooltip contentStyle={{ background: "#0F172A", border: "1px solid #1E293B",
              borderRadius: 10, color: "#F8FAFC", fontSize: 12 }} />
            <Line type="monotone" dataKey="score" stroke="#06B6D4" strokeWidth={2.5}
              dot={{ fill: "#06B6D4", r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Radar chart */}
      <Card className="p-5">
        <p className="text-white text-sm font-semibold mb-4">Skill Assessment Radar</p>
        <ResponsiveContainer width="100%" height={240}>
          <RadarChart data={RADAR_DATA}>
            <PolarGrid stroke="#1E293B" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: "#94A3B8", fontSize: 11 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#475569", fontSize: 9 }} />
            <Radar dataKey="score" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.2} strokeWidth={2} />
          </RadarChart>
        </ResponsiveContainer>
      </Card>

      {/* Session history */}
      <Card className="p-5">
        <p className="text-white text-sm font-semibold mb-4">All Sessions</p>
        <div className="space-y-2">
          {[...sessions].reverse().map((s, i) => (
            <div key={s.id} className="flex items-center justify-between px-4 py-3 bg-slate-800 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="text-slate-600 text-xs font-mono w-5 text-center">{sessions.length - i}</span>
                <div>
                  <p className="text-white text-sm font-medium">{s.role}</p>
                  <p className="text-slate-500 text-xs">{s.date} · {s.q || s.questions} questions</p>
                </div>
              </div>
              <ScoreBadge score={s.score} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ADMIN PAGE
// ══════════════════════════════════════════════════════════
function AdminPage() {
  const totalInterviews = MOCK_USERS.reduce((a, u) => a + u.interviews, 0);
  const platformAvg = Math.round(MOCK_USERS.reduce((a, u) => a + u.avg, 0) / MOCK_USERS.length);

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-white text-2xl font-bold">Admin Panel</h1>
        <p className="text-slate-400 text-sm mt-1">Platform overview and student management</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Students",     value: MOCK_USERS.length, Icon: Users,      color: "#3B82F6" },
          { label: "Interviews",   value: totalInterviews,   Icon: Brain,      color: "#06B6D4" },
          { label: "Platform Avg", value: `${platformAvg}%`, Icon: TrendingUp, color: "#10B981" },
        ].map(({ label, value, Icon, color }) => (
          <Card key={label} className="p-5">
            <div className="flex items-center gap-3">
              <div style={{ width: 38, height: 38, borderRadius: 10,
                background: `${color}22`, display: "flex",
                alignItems: "center", justifyContent: "center" }}>
                <Icon size={18} style={{ color }} />
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wider">{label}</p>
                <p className="text-white text-2xl font-bold">{value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <p className="text-white text-sm font-semibold mb-4">Registered Students</p>
        <div className="space-y-2">
          {MOCK_USERS.map(u => (
            <div key={u.id} className="flex items-center gap-4 px-4 py-3.5 bg-slate-800 rounded-xl">
              <div style={{ width: 40, height: 40, borderRadius: "50%",
                background: "linear-gradient(135deg,#3B82F6,#06B6D4)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "white", fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
                {u.name[0]}
              </div>
              <div className="flex-1">
                <p className="text-white text-sm font-semibold">{u.name}</p>
                <p className="text-slate-400 text-xs">{u.usn}</p>
              </div>
              <div className="text-right">
                <p className="text-white text-sm font-medium">{u.interviews} interviews</p>
                <p className="text-slate-400 text-xs">Avg: {u.avg}%</p>
              </div>
              <span style={{ background: "rgba(16,185,129,.15)", color: "#10B981",
                padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600 }}>
                Active
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ROOT APP
// ══════════════════════════════════════════════════════════
export default function App() {
  const [user,     setUser]     = useState(null);
  const [page,     setPage]     = useState("dashboard");
  const [sessions, setSessions] = useState(INIT_SESSIONS);
  const [mobNav,   setMobNav]   = useState(false);

  const login  = u  => { setUser(u); setPage("dashboard"); };
  const logout = () => setUser(null);

  const saveSession = ({ role, score, questions }) => {
    const M = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const d = new Date();
    setSessions(p => [...p, {
      id: Date.now(),
      date: `${M[d.getMonth()]} ${d.getDate()}`,
      role, score, q: questions
    }]);
  };

  if (!user) return <AuthPage onLogin={login} />;

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">

      {/* Desktop sidebar */}
      <div className="hidden md:block w-64 shrink-0 h-full">
        <Sidebar page={page} nav={setPage} user={user} logout={logout} />
      </div>

      {/* Mobile drawer */}
      {mobNav && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.65)" }}
            onClick={() => setMobNav(false)} />
          <div className="relative w-64 h-full">
            <Sidebar page={page}
              nav={p => { setPage(p); setMobNav(false); }}
              user={user} logout={logout} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 h-14 border-b border-slate-800 bg-slate-900 shrink-0">
          <button onClick={() => setMobNav(true)} className="text-slate-400 p-1">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div style={{ width: 28, height: 28, borderRadius: 8,
              background: "linear-gradient(135deg,#3B82F6,#06B6D4)",
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Brain size={15} color="white" />
            </div>
            <span className="text-white font-bold text-sm">IntelliHire AI</span>
          </div>
          <div style={{ width: 28, height: 28, borderRadius: "50%",
            background: "linear-gradient(135deg,#3B82F6,#06B6D4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", fontWeight: 700, fontSize: 12 }}>
            {user.name[0]}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {page === "dashboard" && <DashboardPage user={user} sessions={sessions} />}
          {page === "interview" && <InterviewPage onComplete={saveSession} />}
          {page === "resume"    && <ResumeAnalyzerPage />}
          {page === "analytics" && <AnalyticsPage sessions={sessions} />}
          {page === "admin" && user.role === "admin" && <AdminPage />}
        </main>
      </div>
    </div>
  );
}
