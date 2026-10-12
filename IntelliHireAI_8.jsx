import { useState, useRef, useEffect } from "react";
import {
  Brain, FileText, BarChart3, Users, LogOut, Send, TrendingUp,
  CheckCircle, Shield, Zap, Target, Award, BookOpen, Home,
  Loader2, X, Plus, Video, Mic, MicOff, PhoneOff, Volume2, VideoOff
} from "lucide-react";
import {
  AreaChart, Area, LineChart, Line, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

// ══════════════════════════════════════════════════════════
// CONSTANTS & MOCK DATA
// ══════════════════════════════════════════════════════════
const DEMO_USER = { id: 1, name: "MR.Pujari", email: "demo@intellihire.com", role: "user" };
const ADMIN_USER = { id: 0, name: "Admin", email: "admin@intellihire.com", role: "admin" };

const INIT_SESSIONS = [
  { id: 1, date: "Jun 1", role: "Frontend Dev", score: 85, q: 5 },
  { id: 2, date: "Jun 3", role: "Backend Dev", score: 78, q: 5 },
  { id: 3, date: "Jun 5", role: "Full Stack Dev", score: 90, q: 5 },
  { id: 4, date: "Jun 8", role: "Data Analyst", score: 72, q: 5 },
  { id: 5, date: "Jun 10", role: "Software Engineer", score: 88, q: 5 },
];

const RADAR_DATA = [
  { subject: "DSA", score: 75 },
  { subject: "DBMS", score: 82 },
  { subject: "OS", score: 68 },
  { subject: "Networks", score: 71 },
  { subject: "OOP", score: 88 },
  { subject: "Web Dev", score: 90 },
];

const MOCK_USERS = [
  { id: 1, name: "Mahesh", usn: "2VL23CS009", interviews: 5, avg: 84 },
  { id: 2, name: "Fayaz", usn: "2VL23CS007", interviews: 3, avg: 76 },
  { id: 3, name: "Abhishek", usn: "2VL23CC001", interviews: 7, avg: 88 },
  { id: 4, name: "Yaseen", usn: "2VL23CS011", interviews: 4, avg: 79 },
];

// ══════════════════════════════════════════════════════════
// AI HELPER
// ══════════════════════════════════════════════════════════
const GEMINI_KEY = (
  process.env.REACT_APP_GEMINI_API_KEY ||
  process.env.REACT_APP_GEMINI_KEY ||
  process.env.REACT_APP_GOOGLE_API_KEY ||
  ""
).trim();

async function askAI(messages, system = "") {
  const prompt = (system ? system + "\n\n" : "") + (messages?.[0]?.content || "");
  if (!GEMINI_KEY || GEMINI_KEY === "paste_your_key_here") return "";
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.6, maxOutputTokens: 1024 },
        }),
      }
    );
    const d = await res.json();
    if (d.error) { console.error("Gemini error:", d.error.message); return ""; }
    return d.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  } catch (err) {
    console.error("AI call failed:", err);
    return "";
  }
}

function parseJSON(raw) {
  try { return JSON.parse(raw.replace(/```json|```/g, "").trim()); }
  catch { return null; }
}

// ── LOCAL SCORING ENGINE (runs when Gemini API is unavailable) ──
// Scores answers honestly based on length, detail, and keywords
function localScore(question, answer) {
  const a = answer.trim().toLowerCase();
  const words = a.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // Base score purely from answer effort/length
  let score;
  if (wordCount <= 3) score = 12;   // "idk", "yes", "no"
  else if (wordCount <= 8) score = 22;   // very short
  else if (wordCount <= 15) score = 38;   // short
  else if (wordCount <= 30) score = 52;   // moderate
  else if (wordCount <= 60) score = 66;   // decent
  else if (wordCount <= 100) score = 76;  // good
  else score = 84;  // detailed

  // Boost for technical keywords relevant to software engineering
  const techKeywords = [
    "algorithm", "complexity", "database", "api", "rest", "function", "class", "object",
    "inheritance", "polymorphism", "encapsulation", "array", "loop", "recursion", "stack",
    "queue", "tree", "graph", "sorting", "searching", "framework", "library", "module",
    "component", "state", "props", "async", "promise", "callback", "error", "exception",
    "testing", "debug", "deploy", "server", "client", "http", "sql", "nosql", "index",
    "cache", "memory", "process", "thread", "performance", "security", "authentication",
    "token", "hash", "encrypt", "interface", "abstract", "design pattern", "solid",
    "agile", "scrum", "git", "version", "refactor", "scalable", "responsive"
  ];
  const matched = techKeywords.filter(k => a.includes(k)).length;
  score = Math.min(97, score + matched * 3);

  // Penalise nonsense (repeating same word, random chars)
  const uniqueWords = new Set(words).size;
  if (wordCount > 5 && uniqueWords / wordCount < 0.4) score = Math.max(10, score - 15);

  score = Math.round(score);

  // Generate honest feedback based on score
  let feedback, strong, improve;
  if (score < 25) {
    feedback = "This answer is too brief to evaluate properly. A good interview answer needs specific details, examples, or explanation of concepts.";
    strong = "You attempted the question";
    improve = "Provide a detailed, structured answer with at least 2-3 sentences";
  } else if (score < 45) {
    feedback = "The answer is too short and lacks technical depth. Interviewers expect you to explain your thought process and give examples.";
    strong = "You addressed the question topic";
    improve = "Add specific examples, technical terms, and explain your reasoning step by step";
  } else if (score < 62) {
    feedback = "A reasonable attempt, but the answer needs more detail and technical clarity. Try to structure your response with a clear explanation followed by an example.";
    strong = "Basic understanding is shown";
    improve = "Include real examples from your projects or studies to support your answer";
  } else if (score < 78) {
    feedback = "Good answer with decent coverage. You've shown understanding of the topic. Adding more technical specifics and a concrete example would make it stronger.";
    strong = "Clear explanation with reasonable depth";
    improve = "Quantify your experience and mention specific tools, technologies, or approaches you used";
  } else if (score < 90) {
    feedback = "Strong, well-structured answer. You demonstrated solid technical knowledge. Minor improvement: connect your answer more explicitly to real-world impact.";
    strong = "Technical depth and clarity are both good";
    improve = "Mention trade-offs or alternative approaches to show deeper expertise";
  } else {
    feedback = "Excellent and comprehensive answer. You clearly articulated the concept, gave examples, and showed strong technical reasoning. Well done!";
    strong = "Outstanding depth, clarity, and technical accuracy";
    improve = "Practice articulating answers slightly faster under time pressure";
  }

  return { score, feedback, strong, improve, source: "local" };
}


// ══════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ══════════════════════════════════════════════════════════
function ScoreBadge({ score }) {
  const c = score >= 85
    ? { bg: "rgba(16,185,129,.15)", color: "#10B981" }
    : score >= 70
      ? { bg: "rgba(245,158,11,.15)", color: "#F59E0B" }
      : { bg: "rgba(239,68,68,.15)", color: "#EF4444" };
  return (
    <span style={{
      background: c.bg, color: c.color, padding: "3px 10px",
      borderRadius: 999, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap"
    }}>
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
    { id: "dashboard", Icon: Home, label: "Dashboard" },
    { id: "interview", Icon: Brain, label: "Mock Interview" },
    { id: "video-interview", Icon: Video, label: "AI Video Interview" },
    { id: "resume", Icon: FileText, label: "Resume Analyzer" },
    { id: "analytics", Icon: BarChart3, label: "Analytics" },
    ...(user.role === "admin" ? [{ id: "admin", Icon: Shield, label: "Admin Panel" }] : []),
  ];

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800">
      {/* Brand */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div style={{
            background: "linear-gradient(135deg,#3B82F6,#06B6D4)",
            borderRadius: 12, width: 36, height: 36,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 12px rgba(59,130,246,.3)"
          }}>
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
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg,#3B82F6,#06B6D4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", fontWeight: 700, fontSize: 13, flexShrink: 0
          }}>
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
          <div style={{
            width: 72, height: 72, borderRadius: 22,
            background: "linear-gradient(135deg,#3B82F6,#06B6D4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px", boxShadow: "0 12px 32px rgba(59,130,246,.35)"
          }}>
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
            <div style={{
              background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.25)",
              borderRadius: 12, padding: "10px 14px", color: "#F87171", fontSize: 13, marginTop: 16
            }}>
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
  const avg = sessions.length ? Math.round(sessions.reduce((a, s) => a + s.score, 0) / sessions.length) : 0;
  const best = sessions.length ? Math.max(...sessions.map(s => s.score)) : 0;

  const stats = [
    { label: "Total Interviews", value: sessions.length, Icon: Brain, color: "#3B82F6" },
    { label: "Average Score", value: `${avg}%`, Icon: Target, color: "#06B6D4" },
    { label: "Best Score", value: `${best}%`, Icon: Award, color: "#10B981" },
    { label: "Skills Covered", value: "12", Icon: BookOpen, color: "#A855F7" },
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
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: `${color}22`, display: "flex",
                alignItems: "center", justifyContent: "center"
              }}>
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
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
            <XAxis dataKey="date" stroke="#475569" tick={{ fontSize: 11, fill: "#475569" }} />
            <YAxis domain={[50, 100]} stroke="#475569" tick={{ fontSize: 11, fill: "#475569" }} />
            <Tooltip contentStyle={{
              background: "#0F172A", border: "1px solid #1E293B",
              borderRadius: 10, color: "#F8FAFC", fontSize: 12
            }} />
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
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: "rgba(59,130,246,.15)", display: "flex",
                  alignItems: "center", justifyContent: "center"
                }}>
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
  const [step, setStep] = useState("setup");
  const [config, setConfig] = useState({ role: "", level: "Fresher", skills: "" });
  const [questions, setQs] = useState([]);
  const [qIdx, setQIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);

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

  const [scoringMode, setScoringMode] = useState(""); // "ai" | "local"

  const submitAnswer = async () => {
    if (!answer.trim() || busy) return;
    setBusy(true);

    // Start with local scoring as the honest baseline
    let r = {
      question: questions[qIdx], answer,
      ...localScore(questions[qIdx], answer),
    };

    // Try Gemini AI scoring — replaces local if successful
    try {
      const raw = await askAI(
        [{ role: "user", content: `Interview context: ${config.role} (${config.level})\nQuestion: "${questions[qIdx]}"\nCandidate's answer: "${answer}"\n\nEvaluate strictly and honestly. Short/wrong answers score below 30. Detailed/correct answers score 80+.\nReturn JSON only:\n{"score":<integer 0-100>,"feedback":"<2-3 specific sentences>","strong":"<one concrete strength>","improve":"<one concrete improvement>","idealAnswer":"<a model answer of 4-6 sentences that a top candidate would give — be specific, technical, and clear>"}` }],
        "You are a strict technical interviewer. Be HONEST — do NOT inflate scores. Always include a detailed idealAnswer. Return only valid JSON."
      );
      const p = parseJSON(raw);
      if (p && typeof p.score === "number") {
        r = { ...r, ...p, source: "ai" };
        setScoringMode("ai");
      } else {
        setScoringMode("local");
      }
    } catch {
      setScoringMode("local");
    }

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
          { Icon: Zap, label: "AI Questions", sub: "Dynamically generated" },
          { Icon: Target, label: "Live Scoring", sub: "Evaluated instantly" },
          { Icon: Award, label: "Full Report", sub: "Detailed feedback" },
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
        <div style={{
          width: 72, height: 72, borderRadius: 22,
          background: "linear-gradient(135deg,#3B82F6,#06B6D4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 24px", boxShadow: "0 12px 32px rgba(59,130,246,.35)"
        }}>
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
      <div style={{
        background: "rgba(59,130,246,.08)", border: "1px solid rgba(59,130,246,.2)",
        borderRadius: 16, padding: 24
      }}>
        <div className="flex items-center gap-2 mb-3">
          <div style={{
            width: 24, height: 24, borderRadius: "50%", background: "#3B82F6",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", fontSize: 11, fontWeight: 700, flexShrink: 0
          }}>
            {qIdx + 1}
          </div>
          <span style={{
            color: "#60A5FA", fontSize: 11, fontWeight: 700,
            textTransform: "uppercase", letterSpacing: "0.05em"
          }}>
            Question {qIdx + 1}
          </span>
        </div>
        <p className="text-white text-base leading-relaxed">{questions[qIdx]}</p>
      </div>

      {/* Previous feedback */}
      {qIdx > 0 && results[qIdx - 1] && (
        <div style={{
          background: "rgba(16,185,129,.08)", border: "1px solid rgba(16,185,129,.2)",
          borderRadius: 12, padding: "12px 16px"
        }}>
          <p style={{ color: "#10B981", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
            Previous answer scored: {results[qIdx - 1].score}%
          </p>
          <p className="text-slate-300 text-sm">{results[qIdx - 1].feedback}</p>
        </div>
      )}

      {/* Answer area */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Your Answer</label>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
            background: GEMINI_KEY && GEMINI_KEY !== "paste_your_key_here"
              ? "rgba(16,185,129,.15)" : "rgba(245,158,11,.15)",
            color: GEMINI_KEY && GEMINI_KEY !== "paste_your_key_here"
              ? "#10B981" : "#F59E0B"
          }}>
            {GEMINI_KEY && GEMINI_KEY !== "paste_your_key_here"
              ? "🤖 Gemini AI Scoring" : "📊 Smart Local Scoring"}
          </span>
        </div>
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
        style={{
          background: "rgba(59,130,246,.08)", border: "1px solid rgba(59,130,246,.2)",
          borderRadius: 20, padding: 36
        }}>
        <div style={{
          width: 80, height: 80, borderRadius: "50%",
          background: "linear-gradient(135deg,#3B82F6,#06B6D4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px", boxShadow: "0 12px 32px rgba(59,130,246,.35)"
        }}>
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
              <div style={{
                flex: 1, background: "rgba(16,185,129,.08)", border: "1px solid rgba(16,185,129,.2)",
                borderRadius: 8, padding: "8px 12px", color: "#10B981", fontSize: 12
              }}>
                ✓ {r.strong}
              </div>
              <div style={{
                flex: 1, background: "rgba(245,158,11,.08)", border: "1px solid rgba(245,158,11,.2)",
                borderRadius: 8, padding: "8px 12px", color: "#F59E0B", fontSize: 12
              }}>
                ↑ {r.improve}
              </div>
            </div>
            {r.idealAnswer && (
              <div style={{
                background: "rgba(139,92,246,.08)", border: "1px solid rgba(139,92,246,.25)",
                borderRadius: 10, padding: "12px 14px", marginTop: 10
              }}>
                <p style={{
                  color: "#A78BFA", fontSize: 11, fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6
                }}>
                  💡 Ideal Answer
                </p>
                <p className="text-slate-300 text-xs leading-relaxed">{r.idealAnswer}</p>
              </div>
            )}
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
// AI VIDEO INTERVIEW PAGE (Webcam + Voice AI Interviewer)
// ══════════════════════════════════════════════════════════
function VideoInterviewPage({ onComplete }) {
  const [step, setStep] = useState("setup");   // setup | connecting | active | result
  const [config, setConfig] = useState({ role: "", level: "Fresher", skills: "" });
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [questions, setQs] = useState([]);
  const [qIdx, setQIdx] = useState(0);
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);
  const [camOn, setCamOn] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [camError, setCamError] = useState("");
  const [voiceSupported, setVoiceSupported] = useState(true);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);
  const listeningRef = useRef(false);

  const FALLBACK = role => [
    `Tell me a little about yourself and why you want this ${role} role.`,
    "Walk me through how you'd approach solving a difficult technical problem.",
    "Explain Object-Oriented Programming concepts with a real example.",
    "Describe a project you're proud of and the challenges you faced.",
    "Where do you see yourself professionally in the next few years?",
  ];

  // ── Cleanup camera/mic on unmount ──
  useEffect(() => {
    return () => stopMedia();
  }, []);

  // ── Re-attach camera stream once the <video> element actually mounts ──
  useEffect(() => {
    if (step === "active" && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play?.().catch(() => { });
    }
  }, [step]);

  // ── Load available TTS voices (browsers load these async) ──
  useEffect(() => {
    if (!window.speechSynthesis) return;
    const loadVoices = () => {
      const all = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith("en"));
      setVoices(all);
      if (all.length && !selectedVoice) {
        const preferred = all.find(v => /female|zira|aria|jenny/i.test(v.name)) || all[0];
        setSelectedVoice(preferred);
      }
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  function stopMedia() {
    streamRef.current?.getTracks().forEach(t => t.stop());
    try { recognitionRef.current?.stop(); } catch { }
    window.speechSynthesis?.cancel();
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCamError("");
    } catch {
      setCamError("Camera access denied or unavailable. You can still continue with voice/text only.");
    }
  }

  function toggleCamera() {
    const tracks = streamRef.current?.getVideoTracks() || [];
    tracks.forEach(t => (t.enabled = !camOn));
    setCamOn(c => !c);
  }

  function speak(text, onEnd) {
    if (!window.speechSynthesis) { onEnd?.(); return; }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.97; utter.pitch = 1.02;
    if (selectedVoice) utter.voice = selectedVoice;
    utter.onstart = () => setIsSpeaking(true);
    utter.onend = () => { setIsSpeaking(false); onEnd?.(); };
    window.speechSynthesis.speak(utter);
  }

  function setupRecognition() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setVoiceSupported(false); return null; }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    rec.onresult = (e) => {
      let final = "", live = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript + " ";
        else live += e.results[i][0].transcript;
      }
      if (final) setTranscript(prev => (prev + " " + final).trim());
      setInterim(live);
    };
    rec.onerror = () => { };
    rec.onend = () => { if (listeningRef.current) { try { rec.start(); } catch { } } };
    return rec;
  }

  function toggleListening() {
    if (!recognitionRef.current) recognitionRef.current = setupRecognition();
    if (!recognitionRef.current) return;
    if (isListening) {
      listeningRef.current = false;
      setIsListening(false);
      try { recognitionRef.current.stop(); } catch { }
    } else {
      listeningRef.current = true;
      setIsListening(true);
      try { recognitionRef.current.start(); } catch { }
    }
  }

  const startInterview = async () => {
    if (!config.role.trim()) return;
    setStep("connecting"); setBusy(true);
    await startCamera();
    try {
      const raw = await askAI(
        [{ role: "user", content: `Generate 5 interview questions for a ${config.level} applying for ${config.role}. Skills focus: ${config.skills || "general CS fundamentals"}. Mix: 3 technical + 2 behavioral. Return a JSON array of exactly 5 question strings. No explanation, no preamble.` }],
        "You are a senior technical interviewer at a top tech company conducting a live video interview. Return only a valid JSON array of strings."
      );
      const qs = parseJSON(raw);
      setQs(Array.isArray(qs) ? qs.slice(0, 5) : FALLBACK(config.role));
    } catch {
      setQs(FALLBACK(config.role));
    }
    setQIdx(0); setResults([]); setTranscript(""); setInterim("");
    setBusy(false); setStep("active");
  };

  // Speak each question aloud whenever it becomes active
  useEffect(() => {
    if (step === "active" && questions[qIdx]) {
      setTranscript(""); setInterim("");
      const t = setTimeout(() => speak(questions[qIdx]), 400);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line
  }, [step, qIdx, questions]);

  const submitAnswer = async () => {
    const finalAnswer = (transcript + " " + interim).trim();
    if (!finalAnswer || busy) return;
    if (isListening) toggleListening();
    setBusy(true);

    // Always start with honest local scoring
    let r = {
      question: questions[qIdx], answer: finalAnswer,
      ...localScore(questions[qIdx], finalAnswer),
    };

    // Try Gemini AI — replaces local if it works
    try {
      const raw = await askAI(
        [{ role: "user", content: `Video interview for ${config.role} (${config.level})\nQuestion: "${questions[qIdx]}"\nSpoken answer: "${finalAnswer}"\n\nEvaluate strictly. Short/vague answers must score below 30. Detailed correct answers score 80+. Return JSON only: {"score":<integer 0-100>,"feedback":"<2-3 specific sentences>","strong":"<one concrete strength>","improve":"<one concrete improvement>"}` }],
        "You are a strict technical interviewer. Be HONEST — do NOT inflate scores. Return only valid JSON."
      );
      const p = parseJSON(raw);
      if (p && typeof p.score === "number") r = { ...r, ...p, source: "ai" };
    } catch { }

    const newResults = [...results, r];
    setResults(newResults);
    setBusy(false);

    if (qIdx + 1 >= questions.length) {
      stopMedia();
      const avg = Math.round(newResults.reduce((a, x) => a + x.score, 0) / newResults.length);
      onComplete({ role: `${config.role} (Video)`, score: avg, questions: questions.length });
      setStep("result");
    } else {
      setQIdx(i => i + 1);
    }
  };

  const endCall = () => {
    stopMedia();
    setStep("setup");
  };

  const finalScore = results.length
    ? Math.round(results.reduce((a, r) => a + r.score, 0) / results.length)
    : 0;

  // ── SETUP SCREEN ──
  if (step === "setup") return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-white text-2xl font-bold flex items-center gap-2">
          <Video size={22} style={{ color: "#3B82F6" }} /> AI Video Interview
        </h1>
        <p className="text-slate-400 text-sm mt-1">Live webcam + voice-powered AI interviewer — the closest thing to a real interview</p>
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

        <div>
          <label className="text-slate-300 text-xs font-semibold uppercase tracking-wider block mb-2">
            AI Interviewer Voice
          </label>
          <div className="flex gap-2">
            <select
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
              value={selectedVoice?.name || ""}
              onChange={e => setSelectedVoice(voices.find(v => v.name === e.target.value) || null)}>
              {voices.length === 0 && <option>Loading voices…</option>}
              {voices.map(v => (
                <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => speak("Hi, I'm your AI interviewer. Let's get started with the interview.")}
              className="px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 text-sm font-medium">
              <Volume2 size={15} /> Test
            </button>
          </div>
          <p className="text-slate-600 text-xs mt-1.5">
            Voice options come from your browser/OS. Click "Test" to preview before starting.
          </p>
        </div>

        <button
          onClick={startInterview}
          disabled={!config.role.trim()}
          className="w-full py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2 transition-opacity"
          style={{ background: "linear-gradient(90deg,#3B82F6,#06B6D4)", boxShadow: "0 4px 20px rgba(59,130,246,.25)" }}>
          <Video size={17} /> Start Video Interview
        </button>

        <p className="text-slate-500 text-xs text-center">
          🎥 Requires camera & microphone access. Works best in Chrome.
        </p>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        {[
          { Icon: Volume2, label: "AI Speaks", sub: "Asks questions aloud" },
          { Icon: Mic, label: "You Talk", sub: "Voice-to-text capture" },
          { Icon: Award, label: "Live Score", sub: "Instant AI feedback" },
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

  // ── CONNECTING SCREEN ──
  if (step === "connecting") return (
    <div className="flex items-center justify-center p-6 min-h-96">
      <div className="text-center">
        <div style={{
          width: 72, height: 72, borderRadius: 22,
          background: "linear-gradient(135deg,#3B82F6,#06B6D4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 24px", boxShadow: "0 12px 32px rgba(59,130,246,.35)",
          animation: "pulse 1.5s infinite"
        }}>
          <Video size={32} color="white" />
        </div>
        <p className="text-white font-semibold text-lg">Connecting to your camera…</p>
        <p className="text-slate-400 text-sm mt-1">Setting up {config.role} interview</p>
      </div>
    </div>
  );

  // ── ACTIVE VIDEO INTERVIEW ──
  if (step === "active") return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white font-bold">{config.role} · Live Interview</p>
          <p className="text-slate-400 text-xs">Question {qIdx + 1} of {questions.length}</p>
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

      {/* Video call grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* AI Interviewer panel */}
        <Card style={{
          aspectRatio: "4/3", position: "relative", overflow: "hidden",
          background: "linear-gradient(160deg,#0F172A,#1E293B)"
        }}>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div style={{ position: "relative", width: 96, height: 96 }}>
              {isSpeaking && (
                <>
                  <div style={{
                    position: "absolute", inset: -8, borderRadius: "50%",
                    border: "2px solid rgba(59,130,246,.4)", animation: "ping 1.4s infinite"
                  }} />
                  <div style={{
                    position: "absolute", inset: -16, borderRadius: "50%",
                    border: "2px solid rgba(59,130,246,.2)", animation: "ping 1.4s infinite .3s"
                  }} />
                </>
              )}
              <div style={{
                width: 96, height: 96, borderRadius: "50%",
                background: "linear-gradient(135deg,#3B82F6,#06B6D4)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 8px 24px rgba(59,130,246,.4)", position: "relative", zIndex: 1
              }}>
                <Brain size={42} color="white" />
              </div>
            </div>
            <p className="text-white text-sm font-semibold mt-4">AI Interviewer</p>
            {isSpeaking ? (
              <div className="flex items-center gap-1 mt-2">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} style={{
                    width: 3, background: "#3B82F6", borderRadius: 2,
                    height: 12, animation: `bounce 0.8s infinite ${i * 0.1}s`
                  }} />
                ))}
                <span className="text-blue-400 text-xs ml-2">Speaking…</span>
              </div>
            ) : (
              <span className="text-slate-500 text-xs mt-2">Listening to your answer</span>
            )}
          </div>
          <span style={{
            position: "absolute", top: 10, left: 10, background: "rgba(0,0,0,.5)",
            color: "white", fontSize: 10, padding: "3px 8px", borderRadius: 6
          }}>AI Interviewer</span>
        </Card>

        {/* User webcam panel */}
        <Card style={{ aspectRatio: "4/3", position: "relative", overflow: "hidden", background: "#000" }}>
          {camError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
              <VideoOff size={28} style={{ color: "#475569" }} />
              <p className="text-slate-500 text-xs mt-2">{camError}</p>
            </div>
          ) : (
            <video ref={videoRef} autoPlay muted playsInline
              style={{
                width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)",
                display: camOn ? "block" : "none"
              }} />
          )}
          {!camOn && !camError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <VideoOff size={28} style={{ color: "#475569" }} />
              <p className="text-slate-500 text-xs mt-2">Camera off</p>
            </div>
          )}
          <span style={{
            position: "absolute", top: 10, left: 10, background: "rgba(0,0,0,.5)",
            color: "white", fontSize: 10, padding: "3px 8px", borderRadius: 6
          }}>You</span>
          {isListening && (
            <span style={{
              position: "absolute", top: 10, right: 10, background: "rgba(239,68,68,.85)",
              color: "white", fontSize: 10, padding: "3px 8px", borderRadius: 6,
              display: "flex", alignItems: "center", gap: 4
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "white" }} /> REC
            </span>
          )}
        </Card>
      </div>

      {/* Current question */}
      <div style={{
        background: "rgba(59,130,246,.08)", border: "1px solid rgba(59,130,246,.2)",
        borderRadius: 16, padding: 20
      }}>
        <span style={{
          color: "#60A5FA", fontSize: 11, fontWeight: 700,
          textTransform: "uppercase", letterSpacing: "0.05em"
        }}>Question {qIdx + 1}</span>
        <p className="text-white text-base leading-relaxed mt-2">{questions[qIdx]}</p>
      </div>

      {/* Live transcript */}
      <div>
        <label className="text-slate-300 text-xs font-semibold uppercase tracking-wider block mb-2">
          Your Answer {voiceSupported ? "(speak or type)" : "(type — voice not supported in this browser)"}
        </label>
        <textarea
          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors resize-none leading-relaxed"
          rows={4}
          placeholder={isListening ? "Listening… start speaking" : "Click the mic to speak, or type your answer here…"}
          value={transcript + (interim ? " " + interim : "")}
          onChange={e => setTranscript(e.target.value)} />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        {voiceSupported && (
          <button
            onClick={toggleListening}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-colors"
            style={isListening
              ? { background: "rgba(239,68,68,.15)", border: "1px solid rgba(239,68,68,.3)", color: "#F87171" }
              : { background: "#1E293B", border: "1px solid #334155", color: "#94A3B8" }}>
            {isListening ? <Mic size={16} /> : <MicOff size={16} />}
            {isListening ? "Stop Mic" : "Start Mic"}
          </button>
        )}

        <button
          onClick={toggleCamera}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium bg-slate-800 border border-slate-700 text-slate-300 transition-colors">
          {camOn ? <Video size={16} /> : <VideoOff size={16} />}
        </button>

        <button
          onClick={submitAnswer}
          disabled={!(transcript + interim).trim() || busy}
          className="flex-1 py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2 transition-opacity"
          style={{ background: "linear-gradient(90deg,#3B82F6,#06B6D4)", boxShadow: "0 4px 20px rgba(59,130,246,.25)" }}>
          {busy
            ? <><Loader2 size={16} className="animate-spin" /> Evaluating…</>
            : <><Send size={15} /> {qIdx + 1 === questions.length ? "Finish Interview" : "Submit Answer"}</>}
        </button>

        <button
          onClick={endCall}
          className="flex items-center justify-center px-4 py-3 rounded-xl text-white transition-colors"
          style={{ background: "#EF4444" }}>
          <PhoneOff size={16} />
        </button>
      </div>

      <style>{`
        @keyframes ping { 0% { transform: scale(1); opacity: 1; } 75%,100% { transform: scale(1.4); opacity: 0; } }
        @keyframes bounce { 0%,100% { height: 6px; } 50% { height: 18px; } }
      `}</style>
    </div>
  );

  // ── RESULT SCREEN ──
  if (step === "result") return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      <div className="text-center"
        style={{
          background: "rgba(59,130,246,.08)", border: "1px solid rgba(59,130,246,.2)",
          borderRadius: 20, padding: 36
        }}>
        <div style={{
          width: 80, height: 80, borderRadius: "50%",
          background: "linear-gradient(135deg,#3B82F6,#06B6D4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px", boxShadow: "0 12px 32px rgba(59,130,246,.35)"
        }}>
          <Video size={38} color="white" />
        </div>
        <h2 className="text-white text-2xl font-bold">Video Interview Complete!</h2>
        <p className="text-slate-400 text-sm mt-1">{config.role} · {config.level}</p>
        <p className="text-white font-bold mt-4" style={{ fontSize: 56, lineHeight: 1 }}>
          {finalScore}<span style={{ color: "#3B82F6", fontSize: 28 }}>%</span>
        </p>
        <p className="mt-3 text-sm font-semibold" style={{
          color: finalScore >= 85 ? "#10B981" : finalScore >= 70 ? "#F59E0B" : "#EF4444"
        }}>
          {finalScore >= 85 ? "🎉 Excellent Performance!" : finalScore >= 70 ? "👍 Good Performance" : "📚 Needs More Practice"}
        </p>
      </div>

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
              <div style={{
                flex: 1, background: "rgba(16,185,129,.08)", border: "1px solid rgba(16,185,129,.2)",
                borderRadius: 8, padding: "8px 12px", color: "#10B981", fontSize: 12
              }}>
                ✓ {r.strong}
              </div>
              <div style={{
                flex: 1, background: "rgba(245,158,11,.08)", border: "1px solid rgba(245,158,11,.2)",
                borderRadius: 8, padding: "8px 12px", color: "#F59E0B", fontSize: 12
              }}>
                ↑ {r.improve}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <button
        onClick={() => setStep("setup")}
        className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
        <Plus size={15} /> Start New Video Interview
      </button>
    </div>
  );

  return null;
}

// ══════════════════════════════════════════════════════════
// RESUME ANALYZER PAGE
// ══════════════════════════════════════════════════════════
function ResumeAnalyzerPage() {
  const [file, setFile] = useState(null);   // File object
  const [preview, setPreview] = useState(null);   // img preview URL
  const [fileType, setFileType] = useState("");     // "image" | "pdf"
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [busyMsg, setBusyMsg] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const MSGS = [
    "Reading your resume…",
    "Extracting content with AI Vision…",
    "Running ATS analysis…",
    "Scoring keywords and structure…",
    "Generating your report…",
  ];

  const handleFile = (f) => {
    if (!f) return;
    const fileName = (f.name || "").toLowerCase();
    const fileExt = fileName.includes(".") ? fileName.split(".").pop() : "";
    const isImg = Boolean(f.type?.startsWith("image/")) || ["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(fileExt);
    const isPDF = f.type === "application/pdf" || fileExt === "pdf";

    if (!isImg && !isPDF) { alert("Please upload a PDF or image file (JPG, PNG, etc.)"); return; }
    setFile(f);
    setFileType(isImg ? "image" : "pdf");
    setResult(null);
    if (isImg) setPreview(URL.createObjectURL(f));
    else setPreview(null);
  };

  const onDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const toBase64 = (f) => new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result.split(",")[1]);
    r.onerror = rej;
    r.readAsDataURL(f);
  });

  const analyze = async () => {
    if (!file || !GEMINI_KEY || GEMINI_KEY === "paste_your_key_here") {
      if (!GEMINI_KEY || GEMINI_KEY === "paste_your_key_here") {
        alert("Please add your Gemini API key in the .env file first!");
      }
      return;
    }
    setBusy(true); setResult(null);

    // Cycle through loading messages
    let msgIdx = 0;
    setBusyMsg(MSGS[0]);
    const msgTimer = setInterval(() => {
      msgIdx = (msgIdx + 1) % MSGS.length;
      setBusyMsg(MSGS[msgIdx]);
    }, 1800);

    try {
      const base64 = await toBase64(file);
      const mimeType = file.type;

      const prompt = `You are an expert resume reviewer and ATS specialist with 10+ years of experience.

Carefully analyze this resume (uploaded as ${fileType === "pdf" ? "a PDF document" : "an image"}).

Extract ALL content visible — name, contact, education, skills, projects, experience, certifications.

Then provide a thorough, SPECIFIC analysis. Return ONLY this JSON (no markdown, no explanation):
{
  "name": "<candidate name if visible, else 'Not found'>",
  "atsScore": <integer 0-100>,
  "overallRating": "Excellent|Good|Average|Needs Work",
  "summary": "<3 specific sentences about THIS resume's actual content>",
  "strengths": [
    "<specific strength from this resume>",
    "<specific strength from this resume>",
    "<specific strength from this resume>"
  ],
  "improvements": [
    "<specific, actionable improvement for this resume>",
    "<specific, actionable improvement for this resume>",
    "<specific, actionable improvement for this resume>",
    "<specific, actionable improvement for this resume>"
  ],
  "keywords": ["<keyword found>","<keyword found>","<keyword found>","<keyword found>","<keyword found>","<keyword found>"],
  "missingKeywords": ["<important missing keyword>","<important missing keyword>","<important missing keyword>"],
  "sections": {
    "contactInfo": true|false,
    "education": true|false,
    "skills": true|false,
    "projects": true|false,
    "experience": true|false,
    "certifications": true|false
  }
}`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [
                { inlineData: { mimeType, data: base64 } },
                { text: prompt }
              ]
            }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
          }),
        }
      );
      const d = await res.json();
      if (d.error) throw new Error(d.error.message);
      const raw = d.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      const parsed = parseJSON(raw);
      setResult(parsed || {
        atsScore: 70, overallRating: "Good", name: "Not detected",
        summary: "Resume analyzed. Detailed breakdown below.",
        strengths: ["Resume uploaded successfully", "Content detected"],
        improvements: ["Ensure text is clearly readable", "Use standard fonts"],
        keywords: [], missingKeywords: [],
        sections: { contactInfo: true, education: true, skills: true, projects: true, experience: false, certifications: false }
      });
    } catch (err) {
      alert("Analysis failed: " + err.message + "\n\nMake sure your Gemini API key is valid.");
    }
    clearInterval(msgTimer);
    setBusy(false); setBusyMsg("");
  };

  if (!result) return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-white text-2xl font-bold">Resume Analyzer</h1>
        <p className="text-slate-400 text-sm mt-1">Upload your resume — AI reads and analyzes it like a real recruiter</p>
      </div>

      <Card className="p-6 space-y-5">
        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? "#3B82F6" : file ? "#10B981" : "#334155"}`,
            borderRadius: 16, padding: "40px 24px", textAlign: "center", cursor: "pointer",
            background: dragOver ? "rgba(59,130,246,.06)" : file ? "rgba(16,185,129,.06)" : "rgba(30,41,59,.5)",
            transition: "all .2s"
          }}>
          <input ref={fileInputRef} type="file" accept=".pdf,image/*"
            style={{ display: "none" }}
            onChange={e => handleFile(e.target.files?.[0])} />

          {file ? (
            <div>
              {preview && (
                <img src={preview} alt="Resume preview"
                  style={{
                    maxHeight: 180, margin: "0 auto 16px", borderRadius: 8,
                    border: "1px solid #334155", objectFit: "contain"
                  }} />
              )}
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: "rgba(16,185,129,.15)", display: "flex", alignItems: "center",
                justifyContent: "center", margin: preview ? "0 auto 12px" : "0 auto 12px"
              }}>
                <FileText size={24} style={{ color: "#10B981" }} />
              </div>
              <p className="text-white font-semibold text-sm">{file.name}</p>
              <p className="text-slate-400 text-xs mt-1">
                {fileType.toUpperCase()} · {(file.size / 1024).toFixed(1)} KB
              </p>
              <p style={{ color: "#10B981", fontSize: 12, marginTop: 8 }}>✓ Ready to analyze — click to change file</p>
            </div>
          ) : (
            <div>
              <div style={{
                width: 56, height: 56, borderRadius: 14,
                background: "rgba(59,130,246,.1)", display: "flex", alignItems: "center",
                justifyContent: "center", margin: "0 auto 16px"
              }}>
                <Plus size={28} style={{ color: "#3B82F6" }} />
              </div>
              <p className="text-white font-semibold">Drop your resume here</p>
              <p className="text-slate-400 text-sm mt-1">or click to browse files</p>
              <p className="text-slate-600 text-xs mt-3">Supports: PDF, JPG, PNG · Max 10MB</p>
            </div>
          )}
        </div>

        {/* Format tips */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "📄 PDF File", sub: "Best quality — text perfectly extracted" },
            { label: "🖼️ Photo/Scan", sub: "Take a photo of your printed resume" },
          ].map(({ label, sub }) => (
            <div key={label} style={{
              background: "#1E293B", border: "1px solid #334155",
              borderRadius: 12, padding: "10px 14px"
            }}>
              <p className="text-white text-xs font-semibold">{label}</p>
              <p className="text-slate-500 text-xs mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        <button
          onClick={analyze}
          disabled={!file || busy}
          className="w-full py-3.5 rounded-xl text-white text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2 transition-opacity"
          style={{ background: "linear-gradient(90deg,#3B82F6,#06B6D4)", boxShadow: "0 4px 20px rgba(59,130,246,.25)" }}>
          {busy
            ? <><Loader2 size={16} className="animate-spin" />{busyMsg || "Analyzing…"}</>
            : <><FileText size={16} /> Analyze My Resume</>}
        </button>
      </Card>
    </div>
  );

  const ratingStyle =
    result.overallRating === "Excellent" ? { bg: "rgba(16,185,129,.15)", color: "#10B981", border: "rgba(16,185,129,.3)" } :
      result.overallRating === "Good" ? { bg: "rgba(59,130,246,.15)", color: "#60A5FA", border: "rgba(59,130,246,.3)" } :
        result.overallRating === "Average" ? { bg: "rgba(245,158,11,.15)", color: "#F59E0B", border: "rgba(245,158,11,.3)" } :
          { bg: "rgba(239,68,68,.15)", color: "#F87171", border: "rgba(239,68,68,.3)" };

  const sectionLabels = {
    contactInfo: "Contact Info", education: "Education", skills: "Skills",
    projects: "Projects", experience: "Work Experience", certifications: "Certifications"
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <h1 className="text-white text-xl font-bold">Resume Analysis Report</h1>
          {result.name && result.name !== "Not found" && (
            <p className="text-slate-400 text-sm mt-0.5">Candidate: <span className="text-white font-medium">{result.name}</span></p>
          )}
        </div>
        <button
          onClick={() => { setResult(null); setFile(null); setPreview(null); }}
          className="text-slate-500 hover:text-white flex items-center gap-1.5 text-sm transition-colors">
          <X size={14} /> Analyze New
        </button>
      </div>

      {/* ATS Score card */}
      <div style={{
        background: "rgba(59,130,246,.08)", border: "1px solid rgba(59,130,246,.2)",
        borderRadius: 20, padding: 28
      }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-wider">ATS Compatibility Score</p>
            <p className="text-white font-bold mt-1" style={{ fontSize: 52, lineHeight: 1.1 }}>
              {result.atsScore}
              <span style={{ color: "#3B82F6", fontSize: 26 }}>%</span>
            </p>
            <span style={{
              ...ratingStyle, padding: "4px 14px", borderRadius: 999, fontSize: 12,
              fontWeight: 700, display: "inline-block", marginTop: 10, border: `1px solid ${ratingStyle.border}`
            }}>
              {result.overallRating}
            </span>
          </div>
          <div style={{
            width: 76, height: 76, borderRadius: "50%",
            border: "2px solid rgba(59,130,246,.25)",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <FileText size={30} style={{ color: "#3B82F6" }} />
          </div>
        </div>
        <p className="text-slate-300 text-sm mt-4 leading-relaxed">{result.summary}</p>
      </div>

      {/* Sections checklist */}
      {result.sections && (
        <Card className="p-4">
          <p className="text-white text-xs font-semibold uppercase tracking-wider mb-3">Resume Sections Detected</p>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(result.sections).map(([key, found]) => (
              <div key={key} className="flex items-center gap-2"
                style={{
                  background: found ? "rgba(16,185,129,.08)" : "rgba(239,68,68,.08)",
                  border: `1px solid ${found ? "rgba(16,185,129,.2)" : "rgba(239,68,68,.2)"}`,
                  borderRadius: 8, padding: "6px 10px"
                }}>
                <span style={{ fontSize: 12 }}>{found ? "✅" : "❌"}</span>
                <span style={{ color: found ? "#10B981" : "#F87171", fontSize: 11, fontWeight: 600 }}>
                  {sectionLabels[key] || key}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-2 gap-4">
        <div style={{
          background: "rgba(16,185,129,.08)", border: "1px solid rgba(16,185,129,.2)",
          borderRadius: 16, padding: 16
        }}>
          <p style={{
            color: "#10B981", fontSize: 11, fontWeight: 700,
            textTransform: "uppercase", letterSpacing: "0.05em",
            display: "flex", alignItems: "center", gap: 6, marginBottom: 12
          }}>
            <CheckCircle size={13} /> Strengths
          </p>
          <ul className="space-y-2.5">
            {result.strengths?.map((s, i) => (
              <li key={i} className="flex items-start gap-2">
                <span style={{ color: "#10B981", flexShrink: 0, marginTop: 1 }}>•</span>
                <span className="text-slate-300 text-xs leading-relaxed">{s}</span>
              </li>
            ))}
          </ul>
        </div>

        <div style={{
          background: "rgba(245,158,11,.08)", border: "1px solid rgba(245,158,11,.2)",
          borderRadius: 16, padding: 16
        }}>
          <p style={{
            color: "#F59E0B", fontSize: 11, fontWeight: 700,
            textTransform: "uppercase", letterSpacing: "0.05em",
            display: "flex", alignItems: "center", gap: 6, marginBottom: 12
          }}>
            <TrendingUp size={13} /> Improvements Needed
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
      <Card className="p-4 space-y-3">
        <div>
          <p className="text-white text-xs font-semibold uppercase tracking-wider mb-2">✅ Keywords Found</p>
          <div className="flex flex-wrap gap-2">
            {result.keywords?.map((k, i) => (
              <span key={i} style={{
                background: "rgba(59,130,246,.12)", border: "1px solid rgba(59,130,246,.2)",
                color: "#93C5FD", padding: "4px 12px", borderRadius: 999, fontSize: 12
              }}>{k}</span>
            ))}
            {!result.keywords?.length && <span className="text-slate-500 text-xs">None detected</span>}
          </div>
        </div>
        {result.missingKeywords?.length > 0 && (
          <div>
            <p className="text-white text-xs font-semibold uppercase tracking-wider mb-2">❌ Important Missing Keywords</p>
            <div className="flex flex-wrap gap-2">
              {result.missingKeywords.map((k, i) => (
                <span key={i} style={{
                  background: "rgba(239,68,68,.12)", border: "1px solid rgba(239,68,68,.2)",
                  color: "#F87171", padding: "4px 12px", borderRadius: 999, fontSize: 12
                }}>{k}</span>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ANALYTICS PAGE
// ══════════════════════════════════════════════════════════
function AnalyticsPage({ sessions }) {
  const avg = sessions.length ? Math.round(sessions.reduce((a, s) => a + s.score, 0) / sessions.length) : 0;
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
          { label: "Average Score", value: `${avg}%`, color: "#06B6D4" },
          { label: "Progress", value: `${delta >= 0 ? "+" : ""}${delta}%`, color: delta >= 0 ? "#10B981" : "#EF4444" },
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
            <Tooltip contentStyle={{
              background: "#0F172A", border: "1px solid #1E293B",
              borderRadius: 10, color: "#F8FAFC", fontSize: 12
            }} />
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
          { label: "Students", value: MOCK_USERS.length, Icon: Users, color: "#3B82F6" },
          { label: "Interviews", value: totalInterviews, Icon: Brain, color: "#06B6D4" },
          { label: "Platform Avg", value: `${platformAvg}%`, Icon: TrendingUp, color: "#10B981" },
        ].map(({ label, value, Icon, color }) => (
          <Card key={label} className="p-5">
            <div className="flex items-center gap-3">
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: `${color}22`, display: "flex",
                alignItems: "center", justifyContent: "center"
              }}>
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
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                background: "linear-gradient(135deg,#3B82F6,#06B6D4)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "white", fontWeight: 700, fontSize: 15, flexShrink: 0
              }}>
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
              <span style={{
                background: "rgba(16,185,129,.15)", color: "#10B981",
                padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600
              }}>
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
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [sessions, setSessions] = useState(INIT_SESSIONS);
  const [mobNav, setMobNav] = useState(false);

  const login = u => { setUser(u); setPage("dashboard"); };
  const logout = () => setUser(null);

  const saveSession = ({ role, score, questions }) => {
    const M = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
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
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: "linear-gradient(135deg,#3B82F6,#06B6D4)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <Brain size={15} color="white" />
            </div>
            <span className="text-white font-bold text-sm">IntelliHire AI</span>
          </div>
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: "linear-gradient(135deg,#3B82F6,#06B6D4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", fontWeight: 700, fontSize: 12
          }}>
            {user.name[0]}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {page === "dashboard" && <DashboardPage user={user} sessions={sessions} />}
          {page === "interview" && <InterviewPage onComplete={saveSession} />}
          {page === "video-interview" && <VideoInterviewPage onComplete={saveSession} />}
          {page === "resume" && <ResumeAnalyzerPage />}
          {page === "analytics" && <AnalyticsPage sessions={sessions} />}
          {page === "admin" && user.role === "admin" && <AdminPage />}
        </main>
      </div>
    </div>
  );
}
