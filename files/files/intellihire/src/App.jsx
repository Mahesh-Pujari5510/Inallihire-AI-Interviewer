import { useState, useRef, useEffect, useCallback } from "react";
import { Brain, FileText, BarChart3, Users, LogOut, Send, TrendingUp, Shield, Home, Loader2, Plus, Video, MessageSquare, Calendar, Building2, Timer, RefreshCw, Search, Download, X, Eye, CalendarDays, ArrowLeft, ArrowRight } from "lucide-react";
import { LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { extractResumeText } from "./resumeAnalyzer/extraction";
import { parseResume } from "./resumeAnalyzer/parser";
import { scoreResume } from "./resumeAnalyzer/scorer";
import { validateInterviewConfig, generateQuestions, followUpQuestion } from "./interview/generator";
import { evaluateAnswer } from "./interview/evaluator";
import { calculateInterviewReport } from "./interview/report";
import { saveInterviewState, loadInterviewState, clearInterviewState } from "./interview/storage";
import { calculateDashboardMetrics, readinessLabel, trendForRange } from "./dashboard/metrics";
import AuthPage from "./auth/AuthPage";
import VideoInterviewExperience from "./interview/VideoInterviewPage";
import DailyPracticeExperience from "./dailyPractice/DailyPracticePage";
import { apiRequest } from "./api";
import CareerCoachPage from "./careerCoach/CareerCoachPage";

const C = { 
  cyan: "#00F5FF", 
  purple: "#B366FF", 
  green: "#00FF88", 
  amber: "#FFD700", 
  red: "#FF0055", 
  pink: "#FF1493", 
  blue: "#00BFFF",
  violet: "#DA70D6",
  lime: "#32FF32",
  bg: "#0A0E27", 
  card: "rgba(15,25,50,.92)", 
  border: "rgba(0,245,255,.15)", 
  text: "#F0F4FF", 
  muted: "#8495B8",
  accent: "#FF6B9D"
};
const glow = (col, r = 20) => `0 0 ${r}px ${col}66, 0 0 ${r * 2}px ${col}33, inset 0 0 ${r}px ${col}22`;
const gridBg = { 
  backgroundImage: "linear-gradient(rgba(0,245,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(168,85,247,.03) 1px,transparent 1px)", 
  backgroundSize: "50px 50px", 
  backgroundColor: "#0A0E27" 
};


const COMPANIES = [
  {
    id: "tcs",
    name: "TCS",
    role: "Software Engineer",
    type: "Service-based",
    difficulty: "Medium",
    matchScore: 88,
    userProgress: 72,
    lastUpdated: "2026-08-22",
    keySkills: ["Java", "DBMS", "Aptitude", "Communication"],
    stages: ["Aptitude / NQT", "Technical", "Managerial", "HR"],
    color: "#00BFFF",
    source: { type: "community-reported", url: "https://www.tcs.com/careers", verifiedDate: "2026-08-22" },
    recommendationReason: "Strong match: Your Java, SQL, and aptitude scores align with this preparation path.",
    description: "Large-scale digital transformation hiring with a strong focus on aptitude, communication, and fundamentals.",
    skillStatus: { DSA: "strong", DBMS: "strong", OOP: "strong", SQL: "strong", Aptitude: "strong", Communication: "medium" },
    process: [
      { round: "Aptitude / NQT", type: "community-reported", note: "Quantitative, verbal, and reasoning basics." },
      { round: "Technical round", type: "community-reported", note: "Core Java, OOP, DBMS, and problem-solving." },
      { round: "Managerial round", type: "community-reported", note: "Project discussions and communication clarity." },
      { round: "HR round", type: "official", note: "Core profile, motivation, and culture fit." }
    ],
    roadmap: [
      { day: 1, title: "Quantitative aptitude", duration: "30 min", priority: "High", status: "done" },
      { day: 2, title: "DBMS and SQL fundamentals", duration: "45 min", priority: "High", status: "doing" },
      { day: 3, title: "Java OOP questions", duration: "45 min", priority: "High", status: "todo" },
      { day: 4, title: "Company-specific mock interview", duration: "30 min", priority: "Medium", status: "todo" },
      { day: 5, title: "Communication and resume alignment", duration: "20 min", priority: "Medium", status: "todo" }
    ],
    practiceQuestions: [
      { topic: "Java OOP", difficulty: "Medium", question: "Explain method overloading and overriding with a small example.", hint: "Compare signature, compile-time vs runtime resolution." },
      { topic: "DBMS", difficulty: "Medium", question: "What is the difference between inner join and left join?", hint: "Think about unmatched rows." },
      { topic: "Aptitude", difficulty: "Easy", question: "A train crosses a platform in 30 sec; calculate the speed if the length is known.", hint: "Use total distance covered divided by total time." }
    ],
    readinessFactors: [
      { label: "Skill coverage", value: 32, evidence: "Strong in Java, SQL, and aptitude fundamentals." },
      { label: "Practice completion", value: 18, evidence: "4 of 5 plan items completed." },
      { label: "Mock interview", value: 16, evidence: "Recent mock score above 78%." },
      { label: "Resume match", value: 12, evidence: "Resume aligns with Java and backend themes." },
      { label: "Aptitude practice", value: 10, evidence: "Quant reasoning sessions are consistent." },
      { label: "Recent activity", value: 5, evidence: "Prepared in the last 7 days." }
    ]
  },
  {
    id: "infosys",
    name: "Infosys",
    role: "Software Engineer",
    type: "Service-based",
    difficulty: "Medium",
    matchScore: 82,
    userProgress: 58,
    lastUpdated: "2026-08-24",
    keySkills: ["Logical Reasoning", "DSA", "Basic Java", "Communication"],
    stages: ["InfyTQ", "Technical", "HR"],
    color: "#00B9FF",
    source: { type: "community-reported", url: "https://www.infosys.com/careers", verifiedDate: "2026-08-24" },
    recommendationReason: "Good fit if you improve DSA and DBMS before attempting this path.",
    description: "Strong aptitude and communication emphasis with a standard technical evaluation pattern.",
    skillStatus: { DSA: "medium", DBMS: "medium", OOP: "strong", SQL: "medium", Aptitude: "strong", Communication: "strong" },
    process: [
      { round: "InfyTQ or aptitude round", type: "community-reported", note: "Logical reasoning and general aptitude." },
      { round: "Technical round", type: "community-reported", note: "Java/Python basics and coding fundamentals." },
      { round: "HR round", type: "official", note: "Communication, motivation, and role fit." }
    ],
    roadmap: [
      { day: 1, title: "Reasoning drills", duration: "30 min", priority: "High", status: "done" },
      { day: 2, title: "Arrays and strings review", duration: "45 min", priority: "High", status: "done" },
      { day: 3, title: "SQL basics", duration: "40 min", priority: "High", status: "doing" },
      { day: 4, title: "Mock interview", duration: "30 min", priority: "Medium", status: "todo" }
    ],
    practiceQuestions: [
      { topic: "Arrays", difficulty: "Easy", question: "Find the second largest element in an array without sorting.", hint: "Track two variables in one pass." },
      { topic: "SQL", difficulty: "Medium", question: "Write a query to fetch the second highest salary.", hint: "Use ORDER BY DESC and LIMIT / subquery." }
    ],
    readinessFactors: [
      { label: "Skill coverage", value: 25, evidence: "Good grounding in coding fundamentals." },
      { label: "Practice completion", value: 16, evidence: "3 of 4 tasks completed." },
      { label: "Mock interview", value: 12, evidence: "Recent communication and technical score is moderate." },
      { label: "Resume match", value: 11, evidence: "Resume is aligned with core engineering basics." },
      { label: "Aptitude practice", value: 10, evidence: "Practice log is recent and consistent." },
      { label: "Recent activity", value: 5, evidence: "Last activity was 5 days ago." }
    ]
  },
  {
    id: "amazon",
    name: "Amazon",
    role: "Software Engineer",
    type: "Product-based",
    difficulty: "Hard",
    matchScore: 76,
    userProgress: 41,
    lastUpdated: "2026-08-18",
    keySkills: ["DSA", "System Design", "Leadership", "Problem Solving"],
    stages: ["Online Assessment", "Phone Screen", "Onsite"],
    color: "#FF9900",
    source: { type: "community-reported", url: "https://amazon.jobs", verifiedDate: "2026-08-18" },
    recommendationReason: "Needs preparation: improve DSA and DBMS before attempting this path.",
    description: "High rigor in problem-solving, system thinking, and behavioral clarity. Strong preparation is essential.",
    skillStatus: { DSA: "weak", DBMS: "medium", OOP: "medium", SQL: "medium", Aptitude: "weak", Communication: "medium" },
    process: [
      { round: "Online assessment", type: "community-reported", note: "Two coding questions and aptitude-style logic checks." },
      { round: "Phone screen", type: "community-reported", note: "DSA and behavioral story-based discussion." },
      { round: "Onsite / loop", type: "community-reported", note: "System design and leadership principle alignment." }
    ],
    roadmap: [
      { day: 1, title: "Array and graph revision", duration: "60 min", priority: "High", status: "doing" },
      { day: 2, title: "SQL and DBMS recap", duration: "45 min", priority: "High", status: "todo" },
      { day: 3, title: "System design basics", duration: "50 min", priority: "High", status: "todo" },
      { day: 4, title: "Leadership principle drill", duration: "30 min", priority: "Medium", status: "todo" }
    ],
    practiceQuestions: [
      { topic: "DSA", difficulty: "Hard", question: "Design an efficient top-k stream processor.", hint: "Think heap and sliding state." },
      { topic: "System Design", difficulty: "Hard", question: "Design a URL shortener with global scale and constraints.", hint: "Focus on APIs, storage, and cache strategy." }
    ],
    readinessFactors: [
      { label: "Skill coverage", value: 22, evidence: "DSA and system design need stronger coverage." },
      { label: "Practice completion", value: 14, evidence: "Only 1 of 4 preparation tasks is in progress." },
      { label: "Mock interview", value: 10, evidence: "Insufficient mock interview activity yet." },
      { label: "Resume match", value: 8, evidence: "Need stronger project and impact evidence." },
      { label: "Aptitude practice", value: 6, evidence: "Assessment practice is inconsistent." },
      { label: "Recent activity", value: 4, evidence: "No recent preparation streak recorded." }
    ]
  },
  {
    id: "google",
    name: "Google",
    role: "Software Engineer",
    type: "Product-based",
    difficulty: "Very Hard",
    matchScore: 69,
    userProgress: 33,
    lastUpdated: "2026-08-12",
    keySkills: ["Algorithms", "Graphs", "System Design", "Communication"],
    stages: ["Resume Screen", "Phone Screen", "Onsite"],
    color: "#4285F4",
    source: { type: "community-reported", url: "https://careers.google.com/", verifiedDate: "2026-08-12" },
    recommendationReason: "This is a stretch path right now; focus on algorithm mastery and structured explanations.",
    description: "Very high standards for algorithmic depth, communication, and end-to-end system reasoning.",
    skillStatus: { DSA: "weak", DBMS: "low", OOP: "medium", SQL: "low", Aptitude: "low", Communication: "medium" },
    process: [
      { round: "Resume screen", type: "official", note: "Role fit and project impact review." },
      { round: "Phone screen", type: "community-reported", note: "Two coding problems and technical discussion." },
      { round: "Onsite loop", type: "community-reported", note: "Algorithms, system design, leadership, and behavioral conversations." }
    ],
    roadmap: [
      { day: 1, title: "Graph and tree drills", duration: "60 min", priority: "High", status: "todo" },
      { day: 2, title: "Two-pointer and heap practice", duration: "50 min", priority: "High", status: "todo" },
      { day: 3, title: "System design basics", duration: "45 min", priority: "High", status: "todo" },
      { day: 4, title: "Behavioral storytelling", duration: "30 min", priority: "Medium", status: "todo" }
    ],
    practiceQuestions: [
      { topic: "Graph", difficulty: "Hard", question: "Find the shortest path in a weighted graph with constraints.", hint: "Use Dijkstra or optimized BFS depending on weight conditions." },
      { topic: "Behavioral", difficulty: "Medium", question: "Tell me about a time you solved an ambiguous engineering problem.", hint: "Use STAR and highlight tradeoffs." }
    ],
    readinessFactors: [
      { label: "Skill coverage", value: 18, evidence: "Algorithmic depth remains a major gap." },
      { label: "Practice completion", value: 10, evidence: "Preparation plan is only starting." },
      { label: "Mock interview", value: 8, evidence: "Not enough interview data to assess readiness." },
      { label: "Resume match", value: 10, evidence: "Projects need stronger measurable impact." },
      { label: "Aptitude practice", value: 5, evidence: "Aptitude not yet a focus." },
      { label: "Recent activity", value: 4, evidence: "No recent company-specific preparation yet." }
    ]
  },
  {
    id: "microsoft",
    name: "Microsoft",
    role: "Software Engineer",
    type: "Product-based",
    difficulty: "Hard",
    matchScore: 74,
    userProgress: 49,
    lastUpdated: "2026-08-19",
    keySkills: ["DSA", "OOP", "System Design", "Communication"],
    stages: ["Assessment", "Coding Round", "Manager Round"],
    color: "#09A3FF",
    source: { type: "community-reported", url: "https://careers.microsoft.com", verifiedDate: "2026-08-19" },
    recommendationReason: "Strong fit if you improve clarity in coding explanations and system design communication.",
    description: "Values clear reasoning, debugging depth, and practical engineering judgment.",
    skillStatus: { DSA: "medium", DBMS: "medium", OOP: "strong", SQL: "medium", Aptitude: "medium", Communication: "strong" },
    process: [
      { round: "Assessment", type: "community-reported", note: "Problem-solving and coding fundamentals." },
      { round: "Coding round", type: "community-reported", note: "Clear thought process and efficient solutions." },
      { round: "Manager round", type: "community-reported", note: "Project impact, ownership, and behavioral clarity." }
    ],
    roadmap: [
      { day: 1, title: "Explain-aloud coding practice", duration: "35 min", priority: "High", status: "done" },
      { day: 2, title: "Two-pointer and hash map review", duration: "45 min", priority: "High", status: "doing" },
      { day: 3, title: "System design overview", duration: "50 min", priority: "High", status: "todo" },
      { day: 4, title: "Project storytelling", duration: "30 min", priority: "Medium", status: "todo" }
    ],
    practiceQuestions: [
      { topic: "Coding", difficulty: "Medium", question: "Given a list of integers, find the best pair under constraints.", hint: "Use two-pointer or hash map for efficient checks." },
      { topic: "Behavioral", difficulty: "Medium", question: "Describe a project where you had to adapt to changing requirements.", hint: "Focus on tradeoff and ownership." }
    ],
    readinessFactors: [
      { label: "Skill coverage", value: 28, evidence: "Strong fundamentals but needs consistent challenge practice." },
      { label: "Practice completion", value: 15, evidence: "3 of 4 plan tasks are active." },
      { label: "Mock interview", value: 13, evidence: "Communication is a strength in recent mocks." },
      { label: "Resume match", value: 10, evidence: "Resume already aligns with core engineering work." },
      { label: "Aptitude practice", value: 8, evidence: "Aptitude is not the main gap." },
      { label: "Recent activity", value: 5, evidence: "Recent preparation is visible and steady." }
    ]
  }
];

function getLB() { try { return JSON.parse(localStorage.getItem("ih_lb") || "[]"); } catch { return []; } }

function CyberCard({ children, style = {}, gc = null, className = "", p = "p-5" }) {
  return <div className={`${p} ${className} transition-all hover:shadow-2xl`} style={{ background: gc ? `linear-gradient(135deg, ${gc}08, rgba(15,25,50,.9))` : C.card, borderRadius: 16, backdropFilter: "blur(14px)", border: `2px solid ${gc ? gc + "44" : C.border}`, boxShadow: gc ? glow(gc, 24) : "0 8px 32px rgba(0,0,0,.4)", ...style }}>{children}</div>;
}
function NeonBtn({ children, onClick, disabled = false, color = C.cyan, full = false, style = {}, className = "" }) {
  return <button onClick={onClick} disabled={disabled} className={`flex items-center justify-center gap-2 text-sm font-bold transition-all disabled:opacity-50 hover:scale-105 ${full ? "w-full" : ""} ${className}`} style={{ background: `linear-gradient(135deg,${color}33,${color}15)`, border: `2px solid ${color}66`, color, borderRadius: 14, padding: "12px 22px", cursor: disabled ? "not-allowed" : "pointer", boxShadow: disabled ? "none" : glow(color, 15), fontWeight: 700, ...style }}>{children}</button>;
}

function ScoreBadge({ score }) { const c = score >= 85 ? C.green : score >= 70 ? C.amber : C.red; return <span style={{ background: `linear-gradient(135deg, ${c}33, ${c}15)`, color: c, border: `2px solid ${c}55`, padding: "5px 12px", borderRadius: 999, fontSize: 12, fontWeight: 800, whiteSpace: "nowrap", boxShadow: glow(c, 12), textShadow: `0 0 8px ${c}88` }}>{score}%</span>; }
function NL({ children, color = C.cyan }) { return <span style={{ color, fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em" }}>{children}</span>; }
function StatCard({ label, value, icon: Icon, color }) {
  return <CyberCard gc={color} p="p-4"><div className="flex items-start justify-between"><div><p style={{ color: C.muted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.8 }}>{label}</p><p style={{ color: C.text, fontSize: 28, fontWeight: 900, marginTop: 8, background: `linear-gradient(135deg, ${color}, ${C.cyan})`, backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{value}</p></div><div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg, ${color}33, ${color}15)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: glow(color, 12) }}><Icon size={20} style={{ color }} /></div></div></CyberCard>;
}

function Sidebar({ page, nav, user, logout }) {
  const items = [{ id: "dashboard", Icon: Home, label: "Dashboard" }, { id: "interview", Icon: Brain, label: "Mock Interview" }, { id: "stress", Icon: Timer, label: "Stress Test ⚡" }, { id: "video", Icon: Video, label: "AI Video Interview" }, { id: "resume", Icon: FileText, label: "Resume Analyzer" }, { id: "chatbot", Icon: MessageSquare, label: "AI Career Coach" }, { id: "daily", Icon: Calendar, label: "Daily Practice" }, { id: "company", Icon: Building2, label: "Company Prep" }, { id: "history", Icon: CalendarDays, label: "History" }, { id: "analytics", Icon: BarChart3, label: "Analytics" }, { id: "profile", Icon: Users, label: "Profile" }, ...(user.role === "admin" ? [{ id: "admin", Icon: Shield, label: "Admin Panel" }] : [])];
  return (
    <div className="flex flex-col h-full" style={{ background: "rgba(3,7,18,.98)", borderRight: `1px solid ${C.border}` }}>
      <div style={{ padding: "18px 14px 14px", borderBottom: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-2.5">
          <div style={{ width: 36, height: 36, borderRadius: 11, background: `linear-gradient(135deg,${C.cyan},${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: glow(C.cyan, 15) }}><Brain size={19} color="#030712" /></div>
          <div><p style={{ color: C.cyan, fontWeight: 900, fontSize: 14, textShadow: `0 0 10px ${C.cyan}88` }}>IntelliHire</p><p style={{ color: C.purple, fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" }}>AI PLATFORM</p></div>
        </div>
      </div>
      <nav className="flex-1 p-2" style={{ overflowY: "auto" }}>
        {items.map(({ id, Icon, label }) => (
          <button key={id} onClick={() => nav(id)} className="w-full flex items-center gap-2 text-xs font-semibold transition-all" style={{ padding: "8px 10px", borderRadius: 8, marginBottom: 1, textAlign: "left", background: page === id ? `linear-gradient(90deg,${C.cyan}15,${C.purple}08)` : "transparent", border: page === id ? `1px solid ${C.cyan}28` : "1px solid transparent", color: page === id ? C.cyan : C.muted }}>
            <Icon size={14} />{label}
          </button>
        ))}
      </nav>
      <div style={{ padding: 10, borderTop: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-2" style={{ background: "rgba(0,245,255,.04)", border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 10px" }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg,${C.cyan},${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#030712", fontWeight: 800, fontSize: 12, flexShrink: 0 }}>{user.name[0]}</div>
          <div className="flex-1 min-w-0"><p style={{ color: C.text, fontSize: 11, fontWeight: 600 }} className="truncate">{user.name}</p><p style={{ color: C.muted, fontSize: 9 }}>{user.role === "admin" ? "Administrator" : "Student"}</p></div>
          <button onClick={logout}><LogOut size={13} style={{ color: C.muted }} /></button>
        </div>
      </div>
    </div>
  );
}

function DashboardPage({ user, sessions, nav, dashboard }) {
  const calculatedMetrics = calculateDashboardMetrics(sessions);
  const metrics = dashboard ? { ...calculatedMetrics, total: dashboard.metrics.totalInterviews, readiness: dashboard.metrics.placementReadiness, skills: [...(dashboard.metrics.strongSkills || []), ...(dashboard.metrics.weakSkills || [])].map(name => ({ name, score: dashboard.topicAccuracy?.[name] ?? null })), recent: dashboard.recentSessions || [], change: null } : calculatedMetrics;
  const [range, setRange] = useState(7);
  const [filter, setFilter] = useState("All");
  const [tasks, setTasks] = useState(() => { try { return JSON.parse(localStorage.getItem("ih_dashboard_tasks") || "{}"); } catch { return {}; } });
  const trend = trendForRange(sessions, range);
  const actions = [{ label: "Start Mock Interview", detail: "Practice role-specific questions", icon: Brain, page: "interview", color: C.cyan }, { label: "Analyze Resume", detail: "Find ATS gaps and strengths", icon: FileText, page: "resume", color: C.purple }, { label: "Take Stress Test", detail: "Build speed under pressure", icon: Timer, page: "stress", color: C.amber }, { label: "Practice Today", detail: "Keep your preparation moving", icon: Calendar, page: "daily", color: C.green }, { label: "AI Career Coach", detail: "Get a focused answer", icon: MessageSquare, page: "chatbot", color: C.pink }, { label: "Company Preparation", detail: "Target your next employer", icon: Building2, page: "company", color: C.blue }];
  const toggleTask = id => setTasks(current => { const next = { ...current, [id]: !current[id] }; localStorage.setItem("ih_dashboard_tasks", JSON.stringify(next)); return next; });
  const plan = metrics.skills.length ? metrics.skills.slice(-3).map((skill, index) => ({ id: `skill-${skill.name}`, title: `Practice ${skill.name}`, detail: `Strengthen evidence from your ${skill.name} activity`, time: `${10 + index * 5} min` })) : [{ id: "resume", title: "Upload your resume", detail: "Get personalized ATS improvement tasks", time: "10 min" }, { id: "role", title: "Choose a target role", detail: "Focus questions and practice topics", time: "5 min" }, { id: "interview", title: "Take your first mock interview", detail: "Create a baseline readiness score", time: "20 min" }];
  const filtered = metrics.recent.filter(session => filter === "All" || session.type === filter);
  const readiness = metrics.readiness;
  return <div className="p-4 md:p-6 space-y-5 max-w-6xl mx-auto" style={{ paddingBottom: 40 }}>
    <header className="flex flex-wrap items-center gap-3 justify-between"><div><h1 style={{ color: C.text, fontSize: 24, fontWeight: 900 }}>Welcome back, {user.name.split(" ")[0]}</h1><p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })} · Keep building your placement edge.</p></div><div className="flex gap-2"><button aria-label="Notifications" title="Notifications" style={{ color: C.muted, border: `1px solid ${C.border}`, borderRadius: 10, padding: 10 }}><span aria-hidden="true">●</span></button><button aria-label="Profile" title="Profile" style={{ color: C.cyan, border: `1px solid ${C.cyan}44`, borderRadius: 10, padding: "8px 12px" }}>{user.name[0]}</button><NeonBtn onClick={() => nav("interview")} color={C.cyan} style={{ padding: "9px 13px", fontSize: 11 }}><PlayIcon />Continue Practice</NeonBtn></div></header>
    <section aria-labelledby="readiness-heading" style={{ background: "linear-gradient(115deg, rgba(0,245,255,.11), rgba(15,25,50,.94) 56%, rgba(179,102,255,.09))", border: `1px solid ${C.cyan}44`, borderRadius: 18, padding: 22 }}><div className="flex flex-wrap items-center gap-6"><div><NL color={C.cyan}>Placement readiness</NL><h2 id="readiness-heading" style={{ color: C.text, fontSize: 44, fontWeight: 900, marginTop: 5 }}>{readiness === null ? "--" : readiness}<span style={{ color: C.cyan, fontSize: 18 }}>/100</span></h2><p style={{ color: readiness === null ? C.muted : C.green, fontSize: 13, fontWeight: 700 }}>{readinessLabel(readiness)} {metrics.change !== null && ` · ${metrics.change >= 0 ? "+" : ""}${metrics.change} points this week`}</p></div><div aria-label={readiness === null ? "No readiness score yet" : `${readiness} out of 100`} role="img" style={{ width: 100, height: 100, borderRadius: "50%", display: "grid", placeItems: "center", background: `conic-gradient(${C.cyan} ${readiness || 0}%, rgba(255,255,255,.08) 0)`, position: "relative" }}><div style={{ width: 76, height: 76, borderRadius: "50%", background: C.bg, display: "grid", placeItems: "center", color: C.text, fontSize: 12 }}>{readiness === null ? "Start" : "Ready"}</div></div><div style={{ flex: 1, minWidth: 220 }}><p style={{ color: C.muted, fontSize: 12, lineHeight: 1.7 }}>{readiness === null ? "Complete your first activity to unlock a readiness score and personalized plan." : `Your current baseline is based on ${metrics.total} completed activit${metrics.total === 1 ? "y" : "ies"}. Focus on the plan below to turn practice into progress.`}</p><NeonBtn onClick={() => nav(readiness === null ? "interview" : "analytics")} color={C.cyan} style={{ padding: "9px 13px", marginTop: 12, fontSize: 11 }}>{readiness === null ? "Start baseline" : "View improvement plan"}</NeonBtn></div></div></section>
    <section><div className="flex items-center justify-between mb-3"><NL>Quick actions</NL></div><div className="grid grid-cols-2 md:grid-cols-3 gap-3">{actions.map(action => <button key={action.page} onClick={() => nav(action.page)} className="text-left transition-all hover:translate-y-[-2px]" style={{ background: C.card, border: `1px solid ${action.color}33`, borderRadius: 12, padding: 14, color: C.text }}><action.icon size={19} style={{ color: action.color }} /><p style={{ fontSize: 12, fontWeight: 800, marginTop: 10 }}>{action.label}</p><p style={{ color: C.muted, fontSize: 10, marginTop: 4 }}>{action.detail}</p></button>)}</div></section>
    <div className="grid lg:grid-cols-5 gap-4"><CyberCard p="p-4 lg:col-span-3"><div className="flex items-center justify-between mb-3"><NL>Score trend</NL><select aria-label="Trend date range" value={range} onChange={event => setRange(Number(event.target.value))} style={{ background: "#0F1932", color: C.muted, border: `1px solid ${C.border}`, borderRadius: 7, padding: "5px 8px", fontSize: 10 }}><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option></select></div>{trend.length ? <ResponsiveContainer width="100%" height={190}><LineChart data={trend}><CartesianGrid stroke="rgba(255,255,255,.06)" /><XAxis dataKey="date" tick={{ fill: C.muted, fontSize: 10 }} /><YAxis domain={[0, 100]} tick={{ fill: C.muted, fontSize: 10 }} /><Tooltip contentStyle={{ background: "#0F1932", border: `1px solid ${C.border}`, color: C.text }} /><Line type="monotone" dataKey="score" stroke={C.cyan} strokeWidth={2} dot={{ fill: C.cyan }} /></LineChart></ResponsiveContainer> : <EmptyDashboard text="Complete an activity to see your score trend." />}</CyberCard><CyberCard p="p-4 lg:col-span-2"><NL>Today&apos;s plan</NL><div className="space-y-2 mt-3">{plan.map((task, index) => <div key={task.id} className="flex items-start gap-2" style={{ padding: 10, border: `1px solid ${C.border}`, borderRadius: 9, opacity: tasks[task.id] ? .55 : 1 }}><input type="checkbox" aria-label={`Complete ${task.title}`} checked={Boolean(tasks[task.id])} onChange={() => toggleTask(task.id)} /><div className="flex-1"><p style={{ color: C.text, fontSize: 11, fontWeight: 700 }}>{task.title}</p><p style={{ color: C.muted, fontSize: 10, marginTop: 3 }}>{task.detail}</p><p style={{ color: C.amber, fontSize: 10, marginTop: 4 }}>{task.time} · {index === 0 ? "Priority" : "Next"}</p></div><button onClick={() => nav(index === 0 ? "interview" : "resume")} style={{ color: C.cyan, fontSize: 10, fontWeight: 700 }}>Start</button></div>)}</div></CyberCard></div>
    <div className="grid lg:grid-cols-2 gap-4"><CyberCard p="p-4"><div className="flex justify-between items-center mb-3"><NL>Recent activity</NL><select aria-label="Activity filter" value={filter} onChange={event => setFilter(event.target.value)} style={{ background: "#0F1932", color: C.muted, border: `1px solid ${C.border}`, borderRadius: 7, padding: "5px 8px", fontSize: 10 }}>{["All", "Mock Interview", "Resume Analysis", "Stress Test", "Video Interview"].map(value => <option key={value}>{value}</option>)}</select></div>{filtered.length ? <div className="space-y-2">{filtered.slice(0, 5).map(session => <button key={session.id} onClick={() => nav(session.page || "analytics")} className="w-full flex items-center justify-between text-left" style={{ padding: 10, border: `1px solid ${C.border}`, borderRadius: 9, color: C.text }}><span><b style={{ fontSize: 11 }}>{session.type || "Mock Interview"}</b><small style={{ display: "block", color: C.muted, fontSize: 10, marginTop: 3 }}>{session.role} · {new Date(session.completedAt || session.date).toLocaleDateString()}</small></span><ScoreBadge score={session.score} /></button>)}</div> : <EmptyDashboard text="Your completed activities will appear here." />}</CyberCard><div className="space-y-4"><CyberCard p="p-4"><NL color={C.green}>Strongest skills</NL><p style={{ color: C.muted, fontSize: 11, marginTop: 9 }}>{metrics.skills.length ? metrics.skills.slice(0, 3).map(skill => `${skill.name} (${skill.score})`).join(" · ") : "Complete activities with skills to see evidence-based strengths."}</p></CyberCard><CyberCard p="p-4"><NL color={C.amber}>Focus areas</NL><p style={{ color: C.muted, fontSize: 11, marginTop: 9 }}>{metrics.skills.length ? metrics.skills.slice(-3).map(skill => `${skill.name}: ${skill.score < 60 ? "needs practice" : "add stronger evidence"}`).join(" · ") : "Your first results will reveal focused practice areas."}</p></CyberCard></div></div>
    <div className="flex flex-wrap gap-3"><CyberCard p="p-3" style={{ flex: 1, minWidth: 180 }}><NL color={C.amber}>Practice streak</NL><p style={{ color: C.text, fontSize: 20, fontWeight: 900, marginTop: 5 }}>{metrics.total ? `${Math.min(metrics.total, 7)} day${metrics.total === 1 ? "" : "s"}` : "Not started"}</p></CyberCard><CyberCard p="p-3" style={{ flex: 1, minWidth: 180 }}><NL color={C.green}>Milestone</NL><p style={{ color: C.text, fontSize: 12, fontWeight: 700, marginTop: 8 }}>{metrics.total ? `${metrics.total} completed activit${metrics.total === 1 ? "y" : "ies"}` : "Your first activity unlocks progress"}</p></CyberCard></div>
  </div>;
}

function EmptyDashboard({ text }) { return <div style={{ minHeight: 130, display: "grid", placeItems: "center", color: C.muted, fontSize: 11, textAlign: "center", padding: 16 }}>{text}</div>; }
function PlayIcon() { return <span aria-hidden="true">▶</span>; }

function HistoryPage({ sessions }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("Newest");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const pageSize = 8;
  const records = sessions.map((session, index) => ({ ...session, id: session.id || `${session.date}-${index}`, timestamp: session.completedAt || session.date }));
  const filtered = [...records].filter(record => `${record.type || "Mock Interview"} ${record.role || ""}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => {
    if (sort === "Highest score") return Number(b.score || 0) - Number(a.score || 0);
    if (sort === "Oldest") return String(a.timestamp).localeCompare(String(b.timestamp));
    return String(b.timestamp).localeCompare(String(a.timestamp));
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  const average = records.length ? Math.round(records.reduce((sum, item) => sum + Number(item.score || 0), 0) / records.length) : null;
  const formatDate = value => { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : date.toLocaleString(undefined, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); };
  const exportCsv = () => { const csv = ["Type,Role,Score,Completed At", ...filtered.map(item => [item.type || "Mock Interview", item.role || "-", `${item.score || 0}%`, formatDate(item.timestamp)].map(value => `"${String(value).replaceAll('"', '""')}"`).join(","))].join("\n"); const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); link.download = "intellihire-history.csv"; link.click(); URL.revokeObjectURL(link.href); };
  const update = setter => event => { setter(event.target.value); setPage(1); };
  return <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 style={{ color: C.cyan, fontSize: 22, fontWeight: 900, textShadow: `0 0 12px ${C.cyan}88` }}>Interview History</h1><p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Review your completed practice sessions and scores</p></div><NeonBtn onClick={exportCsv} color={C.cyan} style={{ padding: "8px 12px", fontSize: 11 }}><Download size={14} />Export CSV</NeonBtn></div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[{ label: "Total sessions", value: records.length, color: C.cyan }, { label: "Average score", value: average === null ? "—" : `${average}%`, color: C.purple }, { label: "Best score", value: records.length ? `${Math.max(...records.map(item => Number(item.score || 0)))}%` : "—", color: C.green }, { label: "Latest activity", value: records.length ? formatDate(records[records.length - 1].timestamp).split(",")[0] : "—", color: C.amber }].map(item => <CyberCard key={item.label} gc={item.color} p="p-4"><p style={{ color: C.muted, fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>{item.label}</p><p style={{ color: item.color, fontSize: 21, fontWeight: 900, marginTop: 6 }}>{item.value}</p></CyberCard>)}</div>
    <CyberCard p="p-4"><div className="flex flex-wrap gap-2"><label className="history-dark-search"><Search size={15} /><input value={query} onChange={update(setQuery)} placeholder="Search roles or session types" /></label><select aria-label="Sort history" value={sort} onChange={update(setSort)} className="history-dark-select"><option>Newest</option><option>Oldest</option><option>Highest score</option></select><button aria-label="Refresh history" title="Refresh history" onClick={() => setPage(1)} className="history-dark-icon"><RefreshCw size={15} /></button></div></CyberCard>
    <CyberCard p="p-4"><div className="flex items-center justify-between mb-3"><p style={{ color: C.cyan, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>Completed sessions</p><span style={{ color: C.muted, fontSize: 10 }}>{filtered.length} result{filtered.length === 1 ? "" : "s"}</span></div>{visible.length ? <div className="space-y-2">{visible.map((item, index) => <button key={item.id} onClick={() => setSelected(item)} className="history-session-row"><span className="history-session-number">{(page - 1) * pageSize + index + 1}</span><span className="flex-1 min-w-0 text-left"><strong>{item.type || "Mock Interview"}</strong><small>{item.role || "General practice"} · {formatDate(item.timestamp)}{item.q ? ` · ${item.q} questions` : ""}</small></span><ScoreBadge score={item.score || 0} /><Eye size={14} style={{ color: C.muted }} /></button>)}</div> : <EmptyDashboard text={records.length ? "No sessions match your search." : "Complete an interview to create your history."} />}<div className="history-dark-pagination"><span>Showing {filtered.length ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}</span><div className="flex items-center gap-2"><button disabled={page === 1} onClick={() => setPage(current => current - 1)}><ArrowLeft size={13} /></button><b>{page}</b><button disabled={page >= totalPages} onClick={() => setPage(current => current + 1)}><ArrowRight size={13} /></button></div></div></CyberCard>
    {selected && <div className="history-dark-modal-backdrop" onClick={() => setSelected(null)}><article className="history-dark-modal" onClick={event => event.stopPropagation()}><button aria-label="Close" onClick={() => setSelected(null)} className="history-dark-close"><X size={17} /></button><p style={{ color: C.cyan, fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>Session details</p><h2 style={{ color: C.text, fontSize: 20, fontWeight: 900, marginTop: 6 }}>{selected.type || "Mock Interview"}</h2><div className="grid grid-cols-2 gap-3 mt-5"><div><small>Role</small><strong>{selected.role || "-"}</strong></div><div><small>Score</small><strong style={{ color: C.cyan }}>{selected.score || 0}%</strong></div><div><small>Completed</small><strong>{formatDate(selected.timestamp)}</strong></div><div><small>Questions</small><strong>{selected.q || selected.questions?.length || "-"}</strong></div></div><button className="history-dark-done" onClick={() => setSelected(null)}>Close</button></article></div>}
  </div>;
}

function InterviewCore({ title, subtitle, accentColor = C.cyan, timeLimit = null, hardMode = false, onComplete, profile = null }) {
  const saved = loadInterviewState();
  const profileData = profile?.onboarding || profile || {};
  const seededInterview = {
    role: profileData.targetRole || "",
    level: profileData.experienceLevel || "Fresher",
    skills: Array.isArray(profileData.primarySkills)
      ? profileData.primarySkills
      : typeof profileData.primarySkills === "string"
        ? profileData.primarySkills.split(",").map(skill => skill.trim()).filter(Boolean)
        : [],
    interviewType: "Mixed",
    totalQuestions: 5,
    difficulty: hardMode ? "Hard" : "Medium",
    jobDescription: profileData.careerGoal || profileData.placementGoal || ""
  };
  const [step, setStep] = useState(saved?.step || "setup");
  const [config, setConfig] = useState(saved?.interview || seededInterview);
  const [skillInput, setSkillInput] = useState("");
  const [questions, setQuestions] = useState(saved?.questions || []);
  const [answers, setAnswers] = useState(saved?.answers || []);
  const [qIdx, setQIdx] = useState(saved?.qIdx || 0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(saved?.answers?.[saved?.qIdx] || null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const timerRef = useRef(null);
  const question = questions[qIdx] || null;
  const submit = useCallback((submittedAnswer) => {
    const finalAnswer = submittedAnswer ?? answer;
    if (busy || !question) {
      setStep("setup");
      setError("The current question is unavailable. Please restart the interview.");
      return;
    }
    clearInterval(timerRef.current);
    const elapsedSeconds = timeLimit ? Math.max(0, Math.min(timeLimit, timeLimit - timeLeft)) : 0;
    const speedThresholdSeconds = hardMode ? 15 : 30;
    const baseEvaluation = evaluateAnswer(question, finalAnswer, config);
    const speedBonus = timeLimit && elapsedSeconds <= speedThresholdSeconds ? 5 : 0;
    const evaluation = {
      ...baseEvaluation,
      score: Math.min(12, Number(baseEvaluation.score || 0) + speedBonus),
      speedBonus,
      answerDelaySeconds: elapsedSeconds
    };
    const item = { questionId: question.id, answer: finalAnswer, evaluation };
    setAnswers(current => [...current.filter(existing => existing.questionId !== question.id), item]);
    setFeedback(item);
    setBusy(false);
    setStep("feedback");
  }, [answer, busy, config, hardMode, question, timeLeft, timeLimit]);
  useEffect(() => { if (step === "active" || step === "feedback") saveInterviewState({ step, interview: config, questions, answers, qIdx }); else if (step === "setup") clearInterviewState(); }, [step, config, questions, answers, qIdx]);
  useEffect(() => () => clearInterval(timerRef.current), []);
  useEffect(() => { if (step !== "active" || !timeLimit) return undefined; setTimeLeft(timeLimit); timerRef.current = setInterval(() => setTimeLeft(value => { if (value <= 1) { clearInterval(timerRef.current); submit("(No answer submitted before the timer expired.)"); return 0; } return value - 1; }), 1000); return () => clearInterval(timerRef.current); }, [step, qIdx, timeLimit, submit]);
  const addSkill = () => { const value = skillInput.trim().replace(/,$/, ""); if (value && !config.skills.includes(value)) setConfig(current => ({ ...current, skills: [...current.skills, value] })); setSkillInput(""); };
  const start = () => { const errors = validateInterviewConfig(config); if (Object.keys(errors).length) { setError(Object.values(errors)[0]); return; } setBusy(true); setError(""); setTimeout(() => { const generated = generateQuestions(config); if (!generated.length) { setBusy(false); setError("No questions could be generated for this setup."); return; } setQuestions(generated); setAnswers([]); setQIdx(0); setFeedback(null); setAnswer(""); setBusy(false); setStep("active"); }, 250); };
  const next = () => { const activeFeedback = feedback || answers[qIdx] || null; if (!question && !activeFeedback) { setStep("setup"); setFeedback(null); return; } const canFollowUp = activeFeedback?.answer?.trim().split(/\s+/).filter(Boolean).length >= 8; if (canFollowUp && question && qIdx + 1 < Number(config.totalQuestions)) { const followUp = { ...followUpQuestion(question, activeFeedback.answer, config), id: `${question.id}-follow-up` }; setQuestions(current => [...current.slice(0, qIdx + 1), followUp, ...current.slice(qIdx + 1)]); } if (qIdx + 1 >= questions.length || qIdx + 1 >= Number(config.totalQuestions)) { const finalAnswers = [...answers.filter(item => item.questionId !== activeFeedback?.questionId), ...(activeFeedback ? [activeFeedback] : [])]; const finalReport = calculateInterviewReport({ ...config, questions }, finalAnswers); onComplete({ role: config.role, level: config.level, score: finalReport.overallScore, questions: questions.map(item => item.question), results: finalAnswers.map(item => ({ questionId: item.questionId, question: questions.find(itemQuestion => itemQuestion.id === item.questionId)?.question, answer: item.answer, score: item.evaluation.score, feedback: item.evaluation.improvements?.join(" "), strong: item.evaluation.strengths?.join(" "), improve: item.evaluation.improvements?.join(" ") })), type: title, skills: config.skills, interviewType: config.interviewType, difficulty: config.difficulty, completedAt: new Date().toISOString(), status: "completed", page: "analytics" }); setStep("complete"); clearInterviewState(); return; } setQIdx(value => value + 1); setAnswer(""); setFeedback(null); setStep("active"); };
  const skip = () => { if (window.confirm("Skip this question? It will be recorded as unanswered.")) submit(""); };
  const report = calculateInterviewReport({ ...config, questions }, answers);
  const download = () => window.print();
  if (step === "setup") return <div className="p-6 max-w-xl mx-auto space-y-5"><div><h1 style={{ color: accentColor, fontSize: 22, fontWeight: 900 }}>{title}</h1><p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>{subtitle}</p></div>{saved && <CyberCard gc={C.amber} p="p-4"><p style={{ color: C.amber, fontSize: 12 }}>An unfinished interview was found.</p><NeonBtn onClick={() => setStep(saved.step)} color={C.amber} style={{ marginTop: 10, padding: "8px 12px", fontSize: 11 }}>Resume interview</NeonBtn></CyberCard>}<CyberCard gc={accentColor} p="p-5 space-y-4"><div><NL>Job Role *</NL><input aria-label="Job role" value={config.role} onChange={event => setConfig({ ...config, role: event.target.value })} placeholder="Frontend Developer" style={{ width: "100%", marginTop: 6, background: "rgba(0,0,0,.3)", border: `1px solid ${C.border}`, borderRadius: 10, padding: 11, color: C.text }} /></div><div><NL>Experience Level</NL><div className="grid grid-cols-2 gap-2 mt-2">{["Fresher", "1-2 Years", "3-5 Years", "5+ Years"].map(level => <button type="button" key={level} onClick={() => setConfig({ ...config, level })} style={{ padding: 10, borderRadius: 9, border: `1px solid ${config.level === level ? accentColor : C.border}`, background: config.level === level ? `${accentColor}18` : "transparent", color: config.level === level ? accentColor : C.muted }}>{level}</button>)}</div></div><div><NL>Skills</NL><div className="flex gap-2 mt-2"><input aria-label="Add skill" value={skillInput} onChange={event => setSkillInput(event.target.value)} onKeyDown={event => event.key === "Enter" && addSkill()} placeholder="Add a skill" style={{ flex: 1, background: "rgba(0,0,0,.3)", border: `1px solid ${C.border}`, borderRadius: 10, padding: 10, color: C.text }} /><button type="button" onClick={addSkill} style={{ color: accentColor, border: `1px solid ${accentColor}66`, borderRadius: 9, padding: "0 12px" }}>Add</button></div><div className="flex flex-wrap gap-2 mt-2">{config.skills.map(skill => <button type="button" key={skill} onClick={() => setConfig({ ...config, skills: config.skills.filter(item => item !== skill) })} style={{ color: accentColor, background: `${accentColor}15`, border: `1px solid ${accentColor}44`, borderRadius: 999, padding: "4px 9px", fontSize: 11 }}>{skill} ×</button>)}</div></div><div className="grid grid-cols-2 gap-3">{[["Interview Type", "interviewType", ["Technical", "HR", "Behavioral", "Mixed"]], ["Questions", "totalQuestions", [5, 10, 15]], ["Difficulty", "difficulty", ["Easy", "Medium", "Hard"]]].map(([label, key, options]) => <label key={key} style={{ color: C.muted, fontSize: 10 }}>{label}<select aria-label={label} value={config[key]} onChange={event => setConfig({ ...config, [key]: event.target.value })} style={{ display: "block", width: "100%", marginTop: 5, background: "#0F1932", border: `1px solid ${C.border}`, borderRadius: 8, padding: 9, color: C.text }}>{options.map(option => <option key={option}>{option}</option>)}</select></label>)}</div><textarea aria-label="Job description" rows={4} value={config.jobDescription} onChange={event => setConfig({ ...config, jobDescription: event.target.value })} placeholder="Optional job description" style={{ width: "100%", background: "rgba(0,0,0,.3)", border: `1px solid ${C.border}`, borderRadius: 10, padding: 10, color: C.text }} />{error && <p role="alert" style={{ color: C.red, fontSize: 12 }}>{error}</p>}<NeonBtn onClick={start} disabled={busy} color={accentColor} full><Brain size={16} />{busy ? "Generating questions..." : `Start ${title}`}</NeonBtn></CyberCard></div>;
  if (step === "loading") return <div />;
  if (step === "active" || step === "feedback") return <div className="p-5 max-w-2xl mx-auto space-y-4"><div className="flex justify-between"><div><p style={{ color: accentColor, fontWeight: 800 }}>{config.role}</p><p style={{ color: C.muted, fontSize: 11 }}>{config.level} · Question {qIdx + 1} of {Math.min(questions.length, Number(config.totalQuestions))}</p></div>{timeLimit && <span style={{ color: timeLeft < 10 ? C.red : C.amber }}>{timeLeft}s</span>}</div><div style={{ height: 6, background: `${accentColor}18`, borderRadius: 4 }}><div style={{ width: `${((qIdx + (step === "feedback" ? 1 : 0)) / Number(config.totalQuestions)) * 100}%`, height: "100%", background: accentColor, borderRadius: 4 }} /></div><CyberCard gc={accentColor} p="p-5"><NL color={accentColor}>{question.category}</NL><p style={{ color: C.text, fontSize: 16, lineHeight: 1.7, marginTop: 12 }}>{question.question}</p></CyberCard>{step === "active" ? <><textarea aria-label="Your answer" autoFocus rows={7} value={answer} onChange={event => setAnswer(event.target.value)} placeholder="Type your answer with reasoning and an example..." style={{ width: "100%", background: "rgba(0,0,0,.3)", border: `1px solid ${C.border}`, borderRadius: 12, padding: 13, color: C.text, lineHeight: 1.7 }} /><div className="flex gap-2"><NeonBtn onClick={skip} color={C.muted} style={{ padding: "10px 14px" }}>Skip</NeonBtn><NeonBtn onClick={() => submit(answer)} disabled={busy} color={accentColor} full><Send size={15} />Submit answer</NeonBtn></div></> : <CyberCard gc={feedback.evaluation.score < 6 ? C.amber : C.green} p="p-5"><p style={{ color: C.text, fontSize: 20, fontWeight: 900 }}>{feedback.evaluation.score}/12</p><p style={{ color: C.green, fontSize: 12, marginTop: 10 }}>What went well</p><ul style={{ color: C.muted, fontSize: 11 }}>{feedback.evaluation.strengths.map(item => <li key={item}>• {item}</li>)}</ul><p style={{ color: C.amber, fontSize: 12, marginTop: 10 }}>What to improve</p><ul style={{ color: C.muted, fontSize: 11 }}>{feedback.evaluation.improvements.map(item => <li key={item}>• {item}</li>)}</ul><p style={{ color: C.purple, fontSize: 12, marginTop: 10 }}>Stronger answer outline</p><p style={{ color: C.muted, fontSize: 11 }}>{feedback.evaluation.strongerAnswerOutline.join(" → ")}</p><NeonBtn onClick={next} color={accentColor} full style={{ marginTop: 16 }}>Continue</NeonBtn></CyberCard>}</div>;
  return <div className="p-5 max-w-3xl mx-auto space-y-4"><div className="flex justify-between items-center"><div><h2 style={{ color: accentColor, fontSize: 22, fontWeight: 900 }}>Interview Report</h2><p style={{ color: C.muted, fontSize: 12 }}>{config.role} · {config.level}</p></div><NeonBtn onClick={download} color={C.green} style={{ padding: "8px 12px", fontSize: 11 }}>Download JSON</NeonBtn></div><CyberCard gc={accentColor} p="p-5"><NL>Overall score</NL><p style={{ color: C.text, fontSize: 54, fontWeight: 900 }}>{report.overallScore}<span style={{ color: accentColor, fontSize: 20 }}>/100</span></p></CyberCard><CyberCard p="p-4"><NL>Category scores</NL><div className="grid grid-cols-2 gap-3 mt-3">{Object.entries(report.categoryScores).map(([key, value]) => <div key={key} style={{ color: C.muted, fontSize: 11 }}>{key}: <b style={{ color: C.cyan }}>{value}/100</b></div>)}</div></CyberCard><CyberCard p="p-4"><NL>Strengths and knowledge gaps</NL><p style={{ color: C.green, fontSize: 11, marginTop: 10 }}>{report.strengths.join(" · ") || "No strengths could be established from the submitted evidence."}</p><p style={{ color: C.amber, fontSize: 11, marginTop: 10 }}>{report.knowledgeGaps.join(" · ") || "No additional gaps detected."}</p></CyberCard><CyberCard p="p-4"><NL>Practice topics and next step</NL><p style={{ color: C.muted, fontSize: 11, marginTop: 10 }}>{report.recommendedPracticeTopics.join(", ")}</p><p style={{ color: C.text, fontSize: 11, marginTop: 10 }}>{report.recommendedNextLevel}</p></CyberCard><CyberCard p="p-4"><NL>Full transcript</NL>{answers.map(item => <div key={item.questionId} style={{ borderTop: `1px solid ${C.border}`, padding: "12px 0" }}><p style={{ color: C.text, fontSize: 11 }}>Q{item.questionId}: {questions.find(questionItem => questionItem.id === item.questionId)?.question}</p><p style={{ color: C.muted, fontSize: 11, marginTop: 5 }}>A: {item.answer || "Skipped"}</p><p style={{ color: C.cyan, fontSize: 11, marginTop: 5 }}>Score: {item.evaluation.score}/12</p></div>)}</CyberCard><div className="flex gap-2"><NeonBtn onClick={() => { setStep("setup"); setAnswers([]); setQuestions([]); }} color={C.amber} full>Retry Interview</NeonBtn><NeonBtn onClick={() => { setStep("setup"); setConfig({ ...config, role: "", skills: [] }); setAnswers([]); setQuestions([]); }} color={accentColor} full>Start New Interview</NeonBtn></div></div>;
}

function InterviewPage({ onComplete, profile }) { return <InterviewCore title="Mock Interview" subtitle="Role-specific practice with evidence-based feedback" onComplete={onComplete} profile={profile} />; }

function StressTestPage({ onComplete, profile }) {
  const [hard, setHard] = useState(false);
  const [started, setStarted] = useState(false);
  if (!started) return (
    <div className="p-6 max-w-xl mx-auto space-y-5">
      <div><h1 style={{ color: C.amber, fontSize: 22, fontWeight: 900, textShadow: `0 0 15px ${C.amber}88` }}>⚡ Stress Test Mode</h1><p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Beat the clock — answer under pressure like a real interview!</p></div>
      <CyberCard gc={C.amber} p="p-5 space-y-4">
        <div style={{ background: `${C.amber}0a`, border: `1px solid ${C.amber}30`, borderRadius: 12, padding: 16 }}>
          <p style={{ color: C.amber, fontSize: 13, fontWeight: 700, marginBottom: 10 }}>⚠️ Stress Test Rules</p>
          <ul style={{ color: "#94A3B8", fontSize: 12, lineHeight: 2 }}>
            <li>• Each question has a <strong style={{ color: C.amber }}>{hard ? 30 : 60}-second</strong> countdown timer</li>
            <li>• Timer <strong style={{ color: C.red }}>auto-submits</strong> on timeout</li>
            <li>• Answer within <strong style={{ color: C.green }}>{hard ? 15 : 30}s</strong> for a +5% speed bonus</li>
            <li>• Uses your saved role, skills, and goals to make prompts more relevant</li>
          </ul>
        </div>
        <div className="flex items-center justify-between" style={{ background: "rgba(0,0,0,.3)", border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px" }}>
          <div><p style={{ color: C.text, fontSize: 13, fontWeight: 700 }}>Hard Mode</p><p style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>30s instead of 60s per question</p></div>
          <button onClick={() => setHard(h => !h)} style={{ width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer", position: "relative", background: hard ? `linear-gradient(90deg,${C.amber},${C.red})` : "rgba(100,116,139,.3)", transition: "background .3s" }}><div style={{ width: 18, height: 18, borderRadius: "50%", background: "white", position: "absolute", top: 3, left: hard ? 23 : 3, transition: "left .3s" }} /></button>
        </div>
        <NeonBtn onClick={() => setStarted(true)} color={C.amber} full style={{ padding: "13px" }}><Timer size={17} />Start Stress Test ({hard ? 30 : 60}s mode)</NeonBtn>
      </CyberCard>
    </div>
  );
  return <InterviewCore title="⚡ Stress Test" subtitle={`${hard ? 30 : 60}s per question — auto-submits on timeout`} accentColor={C.amber} timeLimit={hard ? 30 : 60} hardMode={hard} onComplete={r => { setStarted(false); onComplete(r); }} profile={profile} />;
}

function ResumeAnalyzerPage() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [rawText, setRawText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("Choose a resume to begin");
  const inputRef = useRef(null);

  const handleFileSelection = selectedFile => {
    if (!selectedFile) return;
    const fileName = (selectedFile.name || "").toLowerCase();
    const fileExt = fileName.includes(".") ? fileName.split(".").pop() : "";
    const isImage = Boolean(selectedFile.type?.startsWith("image/")) || ["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(fileExt);
    const isPdf = selectedFile.type === "application/pdf" || fileExt === "pdf";
    const isDocx = selectedFile.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || fileExt === "docx";

    if (!isImage && !isPdf && !isDocx) {
      setError("Unsupported file type. Please upload a PDF, DOCX, JPG, JPEG, or PNG.");
      return;
    }

    setFile(selectedFile);
    setError("");
    setResult(null);
  };
  const analyze = async () => {
    if (!file) return;
    setBusy(true); setError(""); setResult(null); setProgress("Extracting text...");
    try { const extracted = await extractResumeText(file, value => setProgress(`OCR in progress... ${value}%`)); const parsed = parseResume(extracted.text); const scored = scoreResume(parsed, extracted.confidence, jobDescription); setRawText(extracted.text); setResult(scored); await apiRequest("/api/resume/save-analysis", { method: "POST", body: JSON.stringify({ content: extracted.text, analysis: scored }) }); }
    catch (cause) { setError(cause.message); }
    setBusy(false);
  };
  const analyzeEdited = async () => { const parsed = parseResume(rawText); const scored = scoreResume(parsed, result.extraction.confidence, jobDescription); setResult(scored); try { await apiRequest("/api/resume/save-analysis", { method: "POST", body: JSON.stringify({ content: rawText, analysis: scored }) }); } catch (cause) { setError(cause.message); } };
  const download = () => { const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "intellihire-resume-report.json"; link.click(); URL.revokeObjectURL(url); };
  if (!result) return <div className="p-6 max-w-2xl mx-auto space-y-5"><div><h1 style={{ color: C.cyan, fontSize: 22, fontWeight: 900 }}>Resume Analyzer</h1><p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Private, evidence-based extraction and ATS scoring</p></div><CyberCard gc={C.cyan} p="p-5 space-y-4"><button type="button" onClick={() => inputRef.current?.click()} style={{ width: "100%", border: `2px dashed ${file ? C.green : C.cyan}66`, borderRadius: 16, padding: 36, background: `${C.cyan}05`, color: C.text, cursor: "pointer" }}><FileText size={28} style={{ color: file ? C.green : C.cyan, margin: "0 auto 10px" }} /><strong>{file ? file.name : "Choose PDF, DOCX, JPG, JPEG, or PNG"}</strong><p style={{ color: C.muted, fontSize: 11, marginTop: 7 }}>{file ? `${(file.size / 1024).toFixed(1)} KB selected` : "Text PDFs are parsed directly; scanned files use OCR"}</p></button><input ref={inputRef} type="file" accept=".pdf,.docx,.jpg,.jpeg,.png" hidden onChange={event => handleFileSelection(event.target.files?.[0] || null)} /><textarea aria-label="Target job description" rows={4} value={jobDescription} onChange={event => setJobDescription(event.target.value)} placeholder="Optional target job description (used only for separate keyword matching)" style={{ width: "100%", background: "rgba(0,0,0,.3)", border: `1px solid ${C.border}`, borderRadius: 10, padding: 10, color: C.text, fontSize: 11 }} />{error && <p role="alert" style={{ color: C.red, fontSize: 12 }}>{error}</p>}<p style={{ color: C.muted, fontSize: 11 }}>{busy ? progress : "Each completed analysis is saved to your private profile."}</p><NeonBtn onClick={analyze} disabled={!file || busy} color={C.cyan} full><FileText size={15} />{busy ? progress : "Analyze resume"}</NeonBtn></CyberCard></div>;
  const labels = { contact: "Contact", summary: "Summary", skills: "Skills", experience: "Experience", education: "Education", projects: "Projects", certifications: "Certifications" };
  return <div className="p-6 max-w-3xl mx-auto space-y-4"><div className="flex items-center gap-3"><div className="flex-1"><h1 style={{ color: C.cyan, fontSize: 18, fontWeight: 900 }}>Resume Analysis Report</h1><p style={{ color: C.muted, fontSize: 12 }}>Candidate: <b style={{ color: C.text }}>{result.candidate.name || "Name not confidently detected"}</b></p></div><NeonBtn onClick={() => { setResult(null); setFile(null); }} color={C.muted} style={{ padding: "7px 10px", fontSize: 10 }}><Plus size={12} />Analyze another</NeonBtn><NeonBtn onClick={download} color={C.green} style={{ padding: "7px 10px", fontSize: 10 }}><FileText size={12} />Download</NeonBtn></div><CyberCard gc={C.cyan} p="p-5"><div className="flex items-center justify-between"><div><NL>Overall ATS score</NL><p style={{ color: C.text, fontSize: 50, fontWeight: 900 }}>{result.scores.overall}<span style={{ color: C.cyan, fontSize: 20 }}>/100</span></p></div><div style={{ textAlign: "right" }}><NL color={C.amber}>Extraction confidence</NL><p style={{ color: C.amber, fontSize: 26, fontWeight: 900 }}>{result.extraction.confidence}%</p></div></div>{result.extraction.confidence < 60 && <p role="alert" style={{ color: C.amber, fontSize: 11, marginTop: 10 }}>Text quality is too poor for reliable analysis. Review and correct the extracted text below.</p>}</CyberCard><CyberCard p="p-4"><NL>Detected sections</NL><div className="grid grid-cols-3 gap-2 mt-3">{Object.entries(result.sections).map(([key, found]) => <div key={key} style={{ color: found ? C.green : C.muted, fontSize: 11 }}>{found ? "✓" : "-"} {labels[key] || key}</div>)}</div></CyberCard><CyberCard p="p-4"><NL>Score breakdown</NL>{Object.entries(result.scores).filter(([key]) => key !== "overall").map(([key, item]) => <div key={key} style={{ marginTop: 12 }}><div className="flex justify-between"><span style={{ color: C.text, fontSize: 11 }}>{key}</span><b style={{ color: C.cyan, fontSize: 11 }}>{item.earned}/{item.max}</b></div><p style={{ color: C.muted, fontSize: 10, marginTop: 3 }}>{item.reason}</p></div>)}</CyberCard><div className="grid grid-cols-2 gap-3"><CyberCard gc={C.green} p="p-4"><NL color={C.green}>Strengths</NL><ul style={{ color: C.muted, fontSize: 11, lineHeight: 1.7, marginTop: 8 }}>{result.strengths.map(item => <li key={item}>• {item}</li>)}</ul></CyberCard><CyberCard gc={C.amber} p="p-4"><NL color={C.amber}>Specific improvements</NL><ul style={{ color: C.muted, fontSize: 11, lineHeight: 1.7, marginTop: 8 }}>{result.improvements.map(item => <li key={item}>• {item}</li>)}</ul></CyberCard></div><CyberCard p="p-4"><NL>Keywords found</NL><p style={{ color: C.text, fontSize: 11, lineHeight: 1.8, marginTop: 8 }}>{result.keywords.found.join(", ") || "No keywords confidently detected"}</p>{jobDescription && <><NL color={C.red}>Missing from supplied job description</NL><p style={{ color: C.red, fontSize: 11, marginTop: 8 }}>{result.keywords.missingForJobDescription.join(", ") || "No missing terms detected"}</p></>}</CyberCard><CyberCard p="p-4"><div className="flex justify-between items-center"><NL>Parsed resume preview</NL><NeonBtn onClick={analyzeEdited} color={C.cyan} style={{ padding: "6px 9px", fontSize: 10 }}>Reanalyze correction</NeonBtn></div><textarea aria-label="Parsed resume text" value={rawText} onChange={event => setRawText(event.target.value)} rows={12} style={{ width: "100%", marginTop: 10, background: "rgba(0,0,0,.3)", border: `1px solid ${C.border}`, borderRadius: 10, padding: 10, color: C.text, fontSize: 11, lineHeight: 1.6 }} /></CyberCard></div>;
}

function CompanyPrepPage({ onStartInterview, dashboard }) {
  const [sel, setSel] = useState(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ difficulty: "All", type: "All", sortBy: "Best match" });
  const [savedCompanies, setSavedCompanies] = useState(() => (dashboard?.savedCompanies || []).map(company => company.companyId));
  const [roadmapState, setRoadmapState] = useState({});

  useEffect(() => { if (dashboard?.savedCompanies) setSavedCompanies(dashboard.savedCompanies.map(company => company.companyId)); }, [dashboard]);

  const userProfile = {
    role: "Software Engineer",
    skills: ["Java", "SQL", "DSA", "DBMS", "Communication"]
  };

  const toggleSaved = (companyId) => {
    const isSaved = savedCompanies.includes(companyId);
    setSavedCompanies(current => isSaved ? current.filter(id => id !== companyId) : [...current, companyId]);
    apiRequest(isSaved ? `/api/companies/saved/${companyId}` : "/api/companies/saved", { method: isSaved ? "DELETE" : "POST", body: isSaved ? undefined : JSON.stringify({ companyId, name: COMPANIES.find(company => company.id === companyId)?.name, role: COMPANIES.find(company => company.id === companyId)?.role }) }).catch(() => null);
  };

  const toggleTask = (companyId, day) => {
    setRoadmapState((current) => {
      const companyPath = current[companyId] || {};
      const currentValue = companyPath[day];
      return {
        ...current,
        [companyId]: {
          ...companyPath,
          [day]: currentValue === "done" ? "todo" : "done"
        }
      };
    });
    const companyPath = roadmapState[companyId] || {};
    apiRequest(`/api/companies/${companyId}/progress`, { method: "PUT", body: JSON.stringify({ tasks: { ...companyPath, [day]: companyPath[day] === "done" ? "todo" : "done" } }) }).catch(() => null);
  };

  const filteredCompanies = COMPANIES.filter((company) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [company.name, company.role, company.type, company.keySkills.join(" ")].join(" ").toLowerCase().includes(query);
    const matchesDifficulty = filters.difficulty === "All" || company.difficulty === filters.difficulty;
    const matchesType = filters.type === "All" || company.type === filters.type;
    return matchesSearch && matchesDifficulty && matchesType;
  }).sort((a, b) => {
    if (filters.sortBy === "Difficulty") {
      const difficultyRank = { Easy: 1, Medium: 2, Hard: 3, "Very Hard": 4 };
      return difficultyRank[a.difficulty] - difficultyRank[b.difficulty];
    }
    if (filters.sortBy === "Recently updated") {
      return new Date(b.lastUpdated) - new Date(a.lastUpdated);
    }
    if (filters.sortBy === "Readiness gap") {
      return (100 - a.matchScore) - (100 - b.matchScore);
    }
    return b.matchScore - a.matchScore;
  });

  const recommended = filteredCompanies.slice(0, 3);

  if (sel) {
    const company = COMPANIES.find((item) => item.id === sel);
    if (!company) return null;

    const progressRecord = dashboard?.companyProgress?.find(item => item.companyId === company.id);
    const readiness = Number.isFinite(Number(progressRecord?.readiness)) ? Number(progressRecord.readiness) : null;
    const readinessFactors = Array.isArray(progressRecord?.metrics?.factors) ? progressRecord.metrics.factors : [];
    const roadmap = company.roadmap.map((task) => ({
      ...task,
      status: roadmapState[company.id]?.[task.day] || task.status
    }));

    return (
      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-5">
        <div style={{ background: "linear-gradient(120deg, rgba(0,245,255,.1), rgba(15,25,50,.95) 40%, rgba(179,102,255,.06))", border: `1px solid ${company.color}33`, borderRadius: 20, padding: 20 }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button onClick={() => setSel(null)} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 12px", color: C.text, fontWeight: 700 }}>← Back</button>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: `linear-gradient(135deg, ${company.color}, rgba(255,255,255,0.1))`, display: "grid", placeItems: "center", fontWeight: 900, color: "#08111d" }}>{company.name.slice(0, 2).toUpperCase()}</div>
              <div>
                <p style={{ color: C.text, fontSize: 20, fontWeight: 900 }}>{company.name}</p>
                <p style={{ color: C.muted, fontSize: 11 }}>{company.role} · {company.type}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => toggleSaved(company.id)} style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px", color: savedCompanies.includes(company.id) ? C.amber : C.text, background: savedCompanies.includes(company.id) ? `${C.amber}12` : "rgba(255,255,255,0.04)", fontWeight: 700 }}>
                {savedCompanies.includes(company.id) ? "Saved" : "Save Company"}
              </button>
              <button onClick={onStartInterview} style={{ background: `linear-gradient(135deg, ${company.color}, #00E5FF)`, color: "#08111d", borderRadius: 10, padding: "10px 14px", fontWeight: 900 }}>
                Start Company Mock Interview
              </button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-4 mt-5">
            {[
              { label: "Readiness", value: readiness === null ? "Not enough data" : `${readiness}%`, color: readiness === null ? C.muted : C.green },
              { label: "Match", value: `${company.matchScore}%`, color: C.cyan },
              { label: "Difficulty", value: company.difficulty, color: C.amber },
              { label: "Updated", value: company.lastUpdated, color: C.purple }
            ].map((item) => (
              <div key={item.label} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, borderRadius: 12, padding: 12 }}>
                <p style={{ color: C.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>{item.label}</p>
                <p style={{ color: item.color, fontSize: 18, fontWeight: 900, marginTop: 6 }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.2fr,0.8fr]">
          <div className="space-y-5">
            <div style={{ background: "rgba(15,25,50,.9)", border: `1px solid ${C.border}`, borderRadius: 18, padding: 18 }}>
              <p style={{ color: C.cyan, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>Interview process</p>
              <div className="space-y-3">
                {company.process.map((step, index) => (
                  <div key={step.round} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ width: 28, height: 28, display: "grid", placeItems: "center", borderRadius: "50%", background: `${C.cyan}18`, border: `1px solid ${C.cyan}44`, color: C.cyan, fontWeight: 800, fontSize: 11 }}>{index + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p style={{ color: C.text, fontWeight: 700 }}>{step.round}</p>
                        <span style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, color: C.muted, borderRadius: 999, fontSize: 9, padding: "3px 7px" }}>{step.type}</span>
                      </div>
                      <p style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>{step.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: "rgba(15,25,50,.9)", border: `1px solid ${C.border}`, borderRadius: 18, padding: 18 }}>
              <p style={{ color: C.green, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>Preparation roadmap</p>
              <div className="space-y-3">
                {roadmap.map((task) => (
                  <div key={task.day} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, borderRadius: 12, padding: 12 }}>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={task.status === "done"} onChange={() => toggleTask(company.id, task.day)} aria-label={`Mark ${task.title} complete`} />
                      <div>
                        <p style={{ color: C.text, fontWeight: 700, fontSize: 12 }}>Day {task.day}: {task.title}</p>
                        <p style={{ color: C.muted, fontSize: 10 }}>{task.duration} · {task.priority} priority</p>
                      </div>
                    </div>
                    <button style={{ color: C.cyan, fontWeight: 700, fontSize: 10 }}>Start</button>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: "rgba(15,25,50,.9)", border: `1px solid ${C.border}`, borderRadius: 18, padding: 18 }}>
              <p style={{ color: C.purple, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>Skill gap analysis</p>
              <div className="space-y-3">
                {Object.entries(company.skillStatus).map(([skill, level]) => (
                  <div key={skill}>
                    <div className="flex items-center justify-between">
                      <p style={{ color: C.text, fontSize: 12, fontWeight: 600 }}>{skill}</p>
                      <span style={{ color: level === "strong" ? C.green : level === "medium" ? C.amber : C.red, fontSize: 10, fontWeight: 700 }}>{level}</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 999, background: "rgba(255,255,255,0.06)", overflow: "hidden", marginTop: 6 }}>
                      <div style={{ width: `${level === "strong" ? 85 : level === "medium" ? 60 : 35}%`, height: "100%", background: level === "strong" ? `linear-gradient(90deg, ${C.green}, ${C.cyan})` : level === "medium" ? `linear-gradient(90deg, ${C.amber}, ${C.purple})` : `linear-gradient(90deg, ${C.red}, ${C.amber})` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div style={{ background: "rgba(15,25,50,.9)", border: `1px solid ${C.border}`, borderRadius: 18, padding: 18 }}>
              <p style={{ color: C.amber, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>Company readiness score</p>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p style={{ color: C.text, fontSize: 24, fontWeight: 900 }}>{readiness === null ? "—" : readiness}</p>
                  <p style={{ color: C.muted, fontSize: 11 }}>0–100 readiness for practice</p>
                </div>
                <div style={{ width: 110, height: 110, borderRadius: "50%", background: readiness === null ? "rgba(255,255,255,0.08)" : `conic-gradient(${C.green} ${readiness}%, rgba(255,255,255,0.08) 0)`, display: "grid", placeItems: "center" }}>
                  <div style={{ width: 82, height: 82, borderRadius: "50%", display: "grid", placeItems: "center", background: "#08111d", color: C.text, fontWeight: 900 }}>{readiness === null ? "—" : readiness}</div>
                </div>
              </div>
              {readiness === null ? <p style={{ color: C.muted, fontSize: 11, marginTop: 16 }}>Complete company tasks and a company mock interview to calculate readiness from your activity.</p> : <div className="space-y-3 mt-4">
                {readinessFactors.map((factor) => (
                  <div key={factor.label}>
                    <div className="flex items-center justify-between">
                      <p style={{ color: C.text, fontSize: 11, fontWeight: 700 }}>{factor.label}</p>
                      <span style={{ color: C.cyan, fontSize: 10 }}>{factor.value}</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 999, background: "rgba(255,255,255,0.06)", overflow: "hidden", marginTop: 6 }}>
                      <div style={{ width: `${factor.value}%`, height: "100%", background: `linear-gradient(90deg, ${C.cyan}, ${C.green})` }} />
                    </div>
                    <p style={{ color: C.muted, fontSize: 10, marginTop: 6 }}>{factor.evidence}</p>
                  </div>
                ))}
              </div>}
            </div>

            <div style={{ background: "rgba(15,25,50,.9)", border: `1px solid ${C.border}`, borderRadius: 18, padding: 18 }}>
              <p style={{ color: C.cyan, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>Practice question bank</p>
              <div className="space-y-3">
                {company.practiceQuestions.map((item, index) => (
                  <div key={`${item.topic}-${index}`} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, borderRadius: 12, padding: 12 }}>
                    <div className="flex items-center justify-between gap-3">
                      <span style={{ background: `${C.cyan}12`, color: C.cyan, border: `1px solid ${C.cyan}33`, borderRadius: 999, fontSize: 9, padding: "4px 8px" }}>{item.topic}</span>
                      <span style={{ color: item.difficulty === "Hard" ? C.amber : C.green, fontSize: 9, fontWeight: 700 }}>{item.difficulty}</span>
                    </div>
                    <p style={{ color: C.text, fontSize: 12, lineHeight: 1.6, marginTop: 10 }}>{item.question}</p>
                    <p style={{ color: C.muted, fontSize: 10, marginTop: 8 }}>Hint: {item.hint}</p>
                  </div>
                ))}
              </div>
              <button onClick={onStartInterview} style={{ width: "100%", marginTop: 14, background: `linear-gradient(135deg, ${C.cyan}, ${C.purple})`, color: "#08111d", borderRadius: 10, padding: "12px 16px", fontWeight: 900 }}>
                Launch company mock interview
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">
      <div>
        <h1 style={{ color: C.text, fontSize: 28, fontWeight: 900 }}>Company Prep</h1>
        <p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Choose a target path, identify your gaps, and prepare with company-specific practice.</p>
      </div>

      <div style={{ background: "linear-gradient(120deg, rgba(0,245,255,.08), rgba(15,25,50,.94) 45%, rgba(179,102,255,.08))", border: `1px solid ${C.border}`, borderRadius: 20, padding: 18 }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p style={{ color: C.cyan, fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>Recommended for you</p>
            <h2 style={{ color: C.text, fontSize: 22, fontWeight: 900, marginTop: 6 }}>Personalized company paths</h2>
          </div>
          <button style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", color: C.text, fontWeight: 700 }}>
            {userProfile.skills.join(" · ")}
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-3 mt-4">
          {recommended.map((company) => (
            <div key={company.id} style={{ background: "rgba(15,25,50,.9)", border: `1px solid ${company.color}33`, borderRadius: 16, padding: 16 }}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg, ${company.color}, rgba(255,255,255,0.08))`, display: "grid", placeItems: "center", fontWeight: 900, color: "#08111d" }}>{company.name.slice(0, 2).toUpperCase()}</div>
                  <div>
                    <p style={{ color: C.text, fontWeight: 800 }}>{company.name}</p>
                    <p style={{ color: C.muted, fontSize: 10 }}>{company.role}</p>
                  </div>
                </div>
                <span style={{ color: C.green, fontWeight: 800, fontSize: 12 }}>{company.matchScore}%</span>
              </div>
              <p style={{ color: C.text, fontSize: 12, lineHeight: 1.6, marginTop: 12 }}>{company.recommendationReason}</p>
              <button onClick={() => setSel(company.id)} style={{ width: "100%", marginTop: 12, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, color: C.text, borderRadius: 10, padding: "10px 12px", fontWeight: 700 }}>
                Explore path
              </button>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: "rgba(15,25,50,.9)", border: `1px solid ${C.border}`, borderRadius: 20, padding: 18 }}>
        <div className="space-y-4">
          <div style={{ position: "relative" }}>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search companies, roles, or skills"
              style={{ width: "100%", background: "rgba(10,14,30,0.8)", border: `1px solid ${C.border}`, borderRadius: 12, color: C.text, padding: "14px 16px 14px 42px", fontSize: 13, outline: "none", boxSizing: "border-box" }}
            />
            <span style={{ position: "absolute", left: 14, top: 13, color: C.muted }}>⌕</span>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {[
              { key: "difficulty", label: "Difficulty", options: ["All", "Easy", "Medium", "Hard", "Very Hard"] },
              { key: "type", label: "Company type", options: ["All", "Service-based", "Product-based", "Startup"] },
              { key: "sortBy", label: "Sort by", options: ["Best match", "Difficulty", "Readiness gap", "Recently updated"] }
            ].map((config) => (
              <label key={config.key} style={{ display: "block", color: C.muted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {config.label}
                <select
                  value={filters[config.key] || (config.key === "sortBy" ? "Best match" : "All")}
                  onChange={(event) => setFilters((current) => ({ ...current, [config.key]: event.target.value }))}
                  style={{ width: "100%", marginTop: 6, background: "rgba(10,14,30,0.8)", border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, padding: "10px 12px", fontSize: 12, outline: "none" }}
                >
                  {config.options.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {filteredCompanies.length ? (
          filteredCompanies.map((company) => {
            const difficultyColor = company.difficulty === "Very Hard" ? C.red : company.difficulty === "Hard" ? C.amber : C.cyan;
            const initials = company.name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();

            return (
              <div key={company.id} style={{ background: "rgba(15,25,50,.94)", border: `1px solid ${company.color}33`, borderRadius: 18, padding: 18, boxShadow: `0 0 18px ${company.color}12` }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div style={{ width: 46, height: 46, borderRadius: 14, background: `linear-gradient(135deg, ${company.color}, rgba(255,255,255,0.1))`, display: "grid", placeItems: "center", fontWeight: 900, color: "#08111d" }}>{initials}</div>
                    <div>
                      <p style={{ color: C.text, fontSize: 16, fontWeight: 800 }}>{company.name}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                        <span style={{ color: difficultyColor, fontSize: 10, fontWeight: 700 }}>{company.difficulty}</span>
                        <span style={{ color: C.muted, fontSize: 10 }}>{company.type}</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => toggleSaved(company.id)} style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "6px 8px", background: savedCompanies.includes(company.id) ? `${C.amber}22` : "transparent", color: savedCompanies.includes(company.id) ? C.amber : C.muted, fontSize: 10, fontWeight: 700 }}>
                    {savedCompanies.includes(company.id) ? "Saved" : "Save"}
                  </button>
                </div>

                <div className="flex items-center justify-between my-4">
                  <div>
                    <p style={{ color: C.muted, fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>Match</p>
                    <p style={{ color: C.green, fontSize: 24, fontWeight: 900 }}>{company.matchScore}%</p>
                  </div>
                  <div style={{ width: 110 }}>
                    <div style={{ height: 8, borderRadius: 99, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${company.matchScore}%`, background: `linear-gradient(90deg, ${C.green}, ${C.cyan})` }} />
                    </div>
                    <p style={{ color: C.muted, fontSize: 10, marginTop: 6, textAlign: "right" }}>{company.userProgress}% prepared</p>
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <p style={{ color: C.muted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Typical stages</p>
                  <div className="flex flex-wrap gap-2">
                    {company.stages.map((stage) => (
                      <span key={stage} style={{ background: "rgba(255,255,255,0.04)", color: C.text, border: `1px solid ${C.border}`, borderRadius: 999, fontSize: 10, padding: "4px 8px" }}>{stage}</span>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <p style={{ color: C.muted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Key skills</p>
                  <div className="flex flex-wrap gap-2">
                    {company.keySkills.map((skill) => (
                      <span key={skill} style={{ background: `${company.color}12`, color: C.text, border: `1px solid ${company.color}22`, borderRadius: 8, fontSize: 10, padding: "4px 7px" }}>{skill}</span>
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16, color: C.muted, fontSize: 10 }}>
                  <span>Updated {company.lastUpdated}</span>
                  <span style={{ color: C.amber }}>{company.source.type}</span>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setSel(company.id)} style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, color: C.text, borderRadius: 10, padding: "10px 12px", fontWeight: 700 }}>
                    View Details
                  </button>
                  <button onClick={onStartInterview} style={{ flex: 1, background: `linear-gradient(135deg, ${company.color}, #00E5FF)`, color: "#09111d", borderRadius: 10, padding: "10px 12px", fontWeight: 900 }}>
                    Start Preparation
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ gridColumn: "1 / -1", background: "rgba(15,25,50,.9)", border: `1px solid ${C.border}`, borderRadius: 18, padding: 30, textAlign: "center" }}>
            <p style={{ color: C.text, fontSize: 18, fontWeight: 800 }}>No companies match this filter set.</p>
            <p style={{ color: C.muted, marginTop: 8 }}>Try a wider search or reset your filters.</p>
          </div>
        )}
      </div>

      <div style={{ background: "rgba(15,25,50,.9)", border: `1px solid ${C.border}`, borderRadius: 20, padding: 18 }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <p style={{ color: C.cyan, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>My Company Paths</p>
          <span style={{ color: C.muted, fontSize: 10 }}>{savedCompanies.length} saved</span>
        </div>

        <div className="grid md:grid-cols-2 gap-3 mt-4">
          {savedCompanies.length ? (
            savedCompanies.map((id) => {
              const company = COMPANIES.find((item) => item.id === id);
              if (!company) return null;
              return (
                <div key={company.id} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, borderRadius: 12, padding: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ color: C.text, fontWeight: 700 }}>{company.name}</p>
                    <p style={{ color: C.muted, fontSize: 10 }}>{company.userProgress}% prepared</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setSel(company.id)} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, padding: "8px 10px" }}>Open</button>
                    <button onClick={() => toggleSaved(company.id)} style={{ background: "rgba(255,0,85,0.08)", border: "1px solid rgba(255,0,85,0.3)", borderRadius: 8, color: C.red, padding: "8px 10px" }}>Remove</button>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ gridColumn: "1 / -1", color: C.muted, fontSize: 12, padding: "8px 0" }}>Save a company to build your personal preparation path.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function LeaderboardPage() {
  const [lb, setLb] = useState(getLB());
  const medals = ["🥇", "🥈", "🥉"];
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between"><div><h1 style={{ color: C.amber, fontSize: 22, fontWeight: 900, textShadow: `0 0 12px ${C.amber}88` }}>🏆 Leaderboard</h1><p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Top performers — updates after every session</p></div><NeonBtn onClick={() => setLb(getLB())} color={C.muted} style={{ padding: "8px 12px", fontSize: 11 }}><RefreshCw size={13} />Refresh</NeonBtn></div>
      {lb.length === 0 ? (<CyberCard gc={C.amber} p="p-10 text-center"><div style={{ fontSize: 52, marginBottom: 12 }}>🏆</div><p style={{ color: C.text, fontSize: 14, fontWeight: 700 }}>No entries yet!</p><p style={{ color: C.muted, fontSize: 12, marginTop: 6 }}>Complete an interview to appear here.</p></CyberCard>)
        : (<CyberCard gc={C.amber} p="p-5"><div className="space-y-2">{lb.slice(0, 10).map((entry, i) => <div key={i} className="flex items-center gap-3" style={{ padding: "12px 14px", background: i < 3 ? `${C.amber}08` : "rgba(255,255,255,.02)", border: `1px solid ${i < 3 ? C.amber + "33" : C.border}`, borderRadius: 12 }}><div style={{ width: 28, textAlign: "center", fontSize: i < 3 ? 18 : 12, fontWeight: 900, color: i < 3 ? C.amber : C.muted, flexShrink: 0 }}>{i < 3 ? medals[i] : i + 1}</div><div style={{ flex: 1 }}><p style={{ color: C.text, fontSize: 13, fontWeight: 700 }}>{entry.name}</p><p style={{ color: C.muted, fontSize: 10, marginTop: 2 }}>{entry.role} · {entry.date}</p></div><ScoreBadge score={entry.score} /></div>)}</div></CyberCard>)}
      <CyberCard p="p-4 text-center"><p style={{ color: C.muted, fontSize: 11, lineHeight: 1.8 }}>🎯 Rankings save locally on your device.<br />Complete interviews to climb the leaderboard!</p></CyberCard>
    </div>
  );
}

function AnalyticsPage({ sessions, dashboard }) {
  const avg = dashboard?.metrics?.averageInterviewScore ?? (sessions.length ? Math.round(sessions.reduce((a, s) => a + s.score, 0) / sessions.length) : null);
  const delta = sessions.length >= 2 ? sessions[sessions.length - 1].score - sessions[0].score : null;
  const radarData = Object.entries(dashboard?.topicAccuracy || {}).map(([s, score]) => ({ s, score }));
  const trend = dashboard?.trends?.[30] || sessions;
  return (
    <div className="p-6 space-y-5 max-w-4xl mx-auto">
      <div><h1 style={{ color: C.cyan, fontSize: 22, fontWeight: 900, textShadow: `0 0 12px ${C.cyan}88` }}>Performance Analytics</h1><p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Track your interview preparation progress</p></div>
      <div className="grid grid-cols-3 gap-4">{[{ label: "Total Sessions", value: dashboard?.metrics?.totalInterviews ?? sessions.length, color: C.cyan }, { label: "Average Score", value: avg === null ? "—" : `${avg}%`, color: C.purple }, { label: "Progress", value: delta === null ? "—" : `${delta >= 0 ? "+" : ""}${delta}%`, color: delta === null ? C.muted : delta >= 0 ? C.green : C.red }].map(({ label, value, color }) => <CyberCard key={label} gc={color} p="p-4 text-center"><p style={{ color: C.muted, fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>{label}</p><p style={{ color, fontSize: 22, fontWeight: 900, marginTop: 6 }}>{value}</p></CyberCard>)}</div>
      <CyberCard p="p-5"><p style={{ color: C.cyan, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>Score Progression</p>{trend.length ? <ResponsiveContainer width="100%" height={190}><LineChart data={trend}><CartesianGrid strokeDasharray="3 3" stroke="rgba(0,245,255,.05)" /><XAxis dataKey="date" stroke="#475569" tick={{ fontSize: 10, fill: "#475569" }} /><YAxis domain={[0, 100]} stroke="#475569" tick={{ fontSize: 10, fill: "#475569" }} /><Tooltip contentStyle={{ background: "#0F172A", border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 11 }} /><Line type="monotone" dataKey="score" stroke={C.cyan} strokeWidth={2.5} dot={{ fill: C.cyan, r: 4 }} activeDot={{ r: 6 }} /></LineChart></ResponsiveContainer> : <EmptyDashboard text="Complete an interview to create your score trend." />}</CyberCard>
      <CyberCard p="p-5"><p style={{ color: C.purple, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>Skill Assessment Radar</p>{radarData.length ? <ResponsiveContainer width="100%" height={220}><RadarChart data={radarData}><PolarGrid stroke="rgba(0,245,255,.08)" /><PolarAngleAxis dataKey="s" tick={{ fill: "#94A3B8", fontSize: 11 }} /><PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#475569", fontSize: 9 }} /><Radar dataKey="score" stroke={C.purple} fill={C.purple} fillOpacity={0.2} strokeWidth={2} /></RadarChart></ResponsiveContainer> : <EmptyDashboard text="Answer practice questions to establish topic accuracy." />}</CyberCard>
      <CyberCard p="p-5"><p style={{ color: C.cyan, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>All Sessions</p><div className="space-y-2">{[...sessions].reverse().map((s, i) => <div key={s.id} className="flex items-center justify-between" style={{ padding: "10px 14px", background: "rgba(0,245,255,.03)", border: `1px solid ${C.border}`, borderRadius: 10 }}><div className="flex items-center gap-3"><span style={{ color: C.muted, fontSize: 11, fontFamily: "monospace", width: 20 }}>{sessions.length - i}</span><div><p style={{ color: C.text, fontSize: 12, fontWeight: 600 }}>{s.role}</p><p style={{ color: C.muted, fontSize: 10 }}>{s.date}</p></div></div><ScoreBadge score={s.score} /></div>)}</div></CyberCard>
    </div>
  );
}

function AdminPage() {
  const [users, setUsers] = useState([]); const [stats, setStats] = useState(null); const [error, setError] = useState("");
  useEffect(() => { Promise.all([apiRequest("/api/admin/users"), apiRequest("/api/admin/stats")]).then(([userData, statData]) => { setUsers(userData.users || []); setStats(statData); }).catch(cause => setError(cause.message)); }, []);
  return (
    <div className="p-6 space-y-5 max-w-4xl mx-auto">
      <div><h1 style={{ color: C.red, fontSize: 22, fontWeight: 900, textShadow: `0 0 12px ${C.red}88` }}>🛡️ Admin Panel</h1><p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Platform overview and student management</p></div>
      {error && <p role="alert" style={{ color: C.red }}>{error}</p>}
      <div className="grid grid-cols-3 gap-4"><StatCard label="Students" value={stats?.totalUsers ?? "—"} icon={Users} color={C.cyan} /><StatCard label="Interviews" value={stats?.totalInterviews ?? "—"} icon={Brain} color={C.purple} /><StatCard label="Avg Score" value={stats?.avgScore == null ? "—" : `${stats.avgScore}%`} icon={TrendingUp} color={C.green} /></div>
      <CyberCard gc={C.red} p="p-5"><p style={{ color: C.red, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>Registered Students</p>{users.length ? <div className="space-y-2">{users.map(u => <div key={u._id} className="flex items-center gap-3" style={{ padding: "12px 14px", background: "rgba(255,0,85,.04)", border: `1px solid rgba(255,0,85,.12)`, borderRadius: 12 }}><div style={{ width: 38, height: 38, borderRadius: "50%", background: `linear-gradient(135deg,${C.cyan},${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#030712", fontWeight: 800, fontSize: 14, flexShrink: 0 }}>{u.name[0]}</div><div className="flex-1"><p style={{ color: C.text, fontSize: 13, fontWeight: 700 }}>{u.name}</p><p style={{ color: C.muted, fontSize: 10 }}>{u.email}</p></div><div className="text-right"><p style={{ color: C.text, fontSize: 12, fontWeight: 600 }}>{u.interviewCount} interviews</p><p style={{ color: C.muted, fontSize: 10 }}>Avg: {u.avgScore == null ? "—" : `${u.avgScore}%`}</p></div></div>)}</div> : <EmptyDashboard text="No student records available." />}</CyberCard>
    </div>
  );
}

function ProfilePage({ user, onSaved }) {
  const initial = { name: user.name || "", targetRole: user.onboarding?.targetRole || "", experienceLevel: user.onboarding?.experienceLevel || "Fresher", graduationYear: user.onboarding?.graduationYear || "", college: user.onboarding?.college || "", primarySkills: (user.onboarding?.primarySkills || []).join(", "), careerGoal: user.onboarding?.careerGoal || user.onboarding?.placementGoal || "", timezone: user.onboarding?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone };
  const [form, setForm] = useState(initial); const [status, setStatus] = useState(""); const [error, setError] = useState(""); const update = key => event => setForm(current => ({ ...current, [key]: event.target.value }));
  const saveProfile = async event => { event.preventDefault(); setStatus(""); setError(""); try { const data = await apiRequest("/api/profile", { method: "PUT", body: JSON.stringify({ ...form, primarySkills: form.primarySkills.split(",") }) }); onSaved(data.user); setStatus("Profile updated."); } catch (cause) { setError(cause.message); } };
  return <div className="p-6 max-w-2xl mx-auto space-y-5"><div><h1 style={{ color: C.cyan, fontSize: 22, fontWeight: 900 }}>Your profile</h1><p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>These details shape recommendations across IntelliHire.</p></div><CyberCard gc={C.cyan} p="p-5"><form onSubmit={saveProfile} className="space-y-4">{[["Full name", "name"], ["Target job role", "targetRole"], ["College", "college"], ["Primary skills", "primarySkills"], ["Career goal", "careerGoal"]].map(([label, key]) => <label key={key} style={{ display: "block", color: C.muted, fontSize: 11, fontWeight: 700 }}>{label}<input value={form[key]} onChange={update(key)} style={{ width: "100%", marginTop: 6, boxSizing: "border-box", background: "rgba(0,0,0,.3)", border: `1px solid ${C.border}`, borderRadius: 9, padding: 11, color: C.text }} /></label>)}<div className="grid grid-cols-2 gap-3"><label style={{ color: C.muted, fontSize: 11, fontWeight: 700 }}>Experience level<select value={form.experienceLevel} onChange={update("experienceLevel")} style={{ width: "100%", marginTop: 6, background: "#0F1932", border: `1px solid ${C.border}`, borderRadius: 9, padding: 11, color: C.text }}>{["Fresher", "1-2 Years", "3-5 Years", "5+ Years"].map(item => <option key={item}>{item}</option>)}</select></label><label style={{ color: C.muted, fontSize: 11, fontWeight: 700 }}>Graduation year<input type="number" min="1950" max="2100" value={form.graduationYear} onChange={update("graduationYear")} style={{ width: "100%", marginTop: 6, boxSizing: "border-box", background: "rgba(0,0,0,.3)", border: `1px solid ${C.border}`, borderRadius: 9, padding: 11, color: C.text }} /></label></div>{error && <p role="alert" style={{ color: C.red, fontSize: 12 }}>{error}</p>}{status && <p role="status" style={{ color: C.green, fontSize: 12 }}>{status}</p>}<NeonBtn type="submit" color={C.cyan} full>Save profile</NeonBtn></form></CyberCard></div>;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [page, setPage] = useState("dashboard");
  const [sessions, setSessions] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [mob, setMob] = useState(false);
  useEffect(() => { const s = document.createElement('style'); s.textContent = `::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-track{background:#030712}::-webkit-scrollbar-thumb{background:rgba(0,245,255,.3);border-radius:2px}input::placeholder,textarea::placeholder{color:#475569}select option{background:#0F172A;color:#E2E8F0}`; document.head.appendChild(s); return () => document.head.removeChild(s); }, []);
  const apiBase = process.env.REACT_APP_API_URL || window.location.origin;
  useEffect(() => { fetch(`${apiBase}/api/auth/me`, { credentials: "include" }).then(response => response.ok ? response.json() : Promise.reject(new Error("expired"))).then(data => { setUser(data.user); return fetch(`${apiBase}/api/dashboard`, { credentials: "include" }); }).then(response => response?.ok ? response.json() : null).then(data => { if (data) { setDashboard(data); setSessions(data.recentSessions || []); } }).catch(() => null).finally(() => setAuthLoading(false)); }, [apiBase]);
  const login = u => { setUser(u); setPage("dashboard"); };
  const logout = () => { fetch(`${apiBase}/api/auth/logout`, { method: "POST", credentials: "include" }).catch(() => null); setUser(null); };
  const save = async activity => { try { if (activity.type === "AI Video Interview") await apiRequest("/api/video-interviews", { method: "POST", body: JSON.stringify({ ...activity, consent: activity.recordingConsent, jobRole: activity.role, report: activity.report, responses: activity.responses, questions: activity.questions, transcript: activity.transcript, speechMetrics: activity.speechMetrics }) }); else await apiRequest("/api/interview/save", { method: "POST", body: JSON.stringify({ jobRole: activity.role, level: activity.level, skills: activity.skills, score: activity.score, questions: activity.questions, results: activity.results, category: activity.category, interviewType: activity.type, difficulty: activity.difficulty }) }); const next = await apiRequest("/api/dashboard"); setDashboard(next); setSessions(next.recentSessions || []); } catch { setSessions(previous => [...previous, { id: Date.now(), ...activity }]); } };
  if (authLoading) return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#070d22", color: C.cyan }}><Loader2 size={24} className="animate-spin" aria-label="Loading authentication" /></div>;
  if (!user) return <AuthPage onLogin={login} />;
  return (
    <div className="flex h-screen overflow-hidden" style={gridBg}>
      <div className="hidden md:block w-52 shrink-0 h-full"><Sidebar page={page} nav={setPage} user={user} logout={logout} /></div>
      {mob && (<div className="md:hidden fixed inset-0 z-50 flex"><div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.8)" }} onClick={() => setMob(false)} /><div className="relative w-52 h-full"><Sidebar page={page} nav={p => { setPage(p); setMob(false); }} user={user} logout={logout} /></div></div>)}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="md:hidden flex items-center justify-between px-4 h-14 shrink-0" style={{ background: "rgba(3,7,18,.98)", borderBottom: `1px solid ${C.border}` }}>
          <button onClick={() => setMob(true)} style={{ color: C.muted, padding: 4 }}><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg></button>
          <div className="flex items-center gap-2"><div style={{ width: 26, height: 26, borderRadius: 8, background: `linear-gradient(135deg,${C.cyan},${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center" }}><Brain size={14} color="#030712" /></div><span style={{ color: C.cyan, fontWeight: 900, fontSize: 13 }}>IntelliHire AI</span></div>
          <div style={{ width: 26, height: 26, borderRadius: "50%", background: `linear-gradient(135deg,${C.cyan},${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#030712", fontWeight: 800, fontSize: 11 }}>{user.name[0]}</div>
        </header>
        <main className="flex-1 overflow-y-auto">
          {page === "dashboard" && <DashboardPage user={user} sessions={sessions} nav={setPage} dashboard={dashboard} />}
          {page === "interview" && <InterviewPage onComplete={save} profile={user} />}
          {page === "stress" && <StressTestPage onComplete={save} profile={user} />}
          {page === "video" && <VideoInterviewExperience onComplete={save} profile={user} />}
          {page === "resume" && <ResumeAnalyzerPage />}
          {page === "chatbot" && <CareerCoachPage dashboard={dashboard} nav={setPage} />}
          {page === "daily" && <DailyPracticeExperience user={user} sessions={sessions} />}
          {page === "company" && <CompanyPrepPage dashboard={dashboard} onStartInterview={() => setPage("interview")} />}
          {page === "history" && <HistoryPage sessions={sessions} />}
          {page === "leaderboard" && <LeaderboardPage />}
          {page === "analytics" && <AnalyticsPage sessions={sessions} dashboard={dashboard} />}
          {page === "profile" && <ProfilePage user={user} onSaved={updatedUser => { setUser(updatedUser); setDashboard(null); }} />}
          {page === "admin" && user.role === "admin" && <AdminPage />}
        </main>
      </div>
    </div>
  );
}
