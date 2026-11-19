// ══════════════════════════════════════════════════════════
// IntelliHire AI - Backend Server (Node.js + Express)
// MERN Stack | VTU Project 2025-26
// ══════════════════════════════════════════════════════════

const express      = require("express");
const mongoose     = require("mongoose");
const cors         = require("cors");
const bcrypt       = require("bcryptjs");
const jwt          = require("jsonwebtoken");
const multer       = require("multer");
const rateLimit    = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const { MongoMemoryServer } = require("mongodb-memory-server");
const fs           = require("fs");
const path         = require("path");
const dotenv       = require("dotenv");

const envCandidates = [
  path.resolve(__dirname, "..", ".env"),
  path.resolve(__dirname, ".env")
];
for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

const app  = express();
const PORT = Number(process.env.PORT) || 5001;
const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === "production" ? (() => { throw new Error("JWT_SECRET is required in production"); })() : "development-only-change-me");
const MONGOMS_VERSION = process.env.MONGOMS_VERSION || "7.0.14";
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: "draft-7", legacyHeaders: false, message: { error: "Too many authentication attempts. Please try again later." } });

const FALLBACK_PORTS = [5000, 5001, 5002, 5003, 5004, 5005, 5050].filter((port, index, array) => array.indexOf(port) === index);

// ── Middleware ──────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── MongoDB Connection ──────────────────────────────────
async function connectDatabase() {
  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/intellihire";

  try {
    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB connected");
    return;
  } catch (primaryErr) {
    console.warn("⚠️ Primary MongoDB connection failed, attempting memory fallback...", primaryErr.message);
  }

  try {
    const memoryServer = await MongoMemoryServer.create({
      binary: { version: MONGOMS_VERSION },
      instance: { dbName: "intellihire" }
    });
    const uri = memoryServer.getUri();
    await mongoose.connect(uri);
    console.log("✅ MongoDB memory server connected");
  } catch (memoryErr) {
    console.error("❌ MongoDB error:", memoryErr);
    throw memoryErr;
  }
}

async function startServer() {
  await connectDatabase();
  await seedDemoUser();

  const portCandidates = [PORT, ...FALLBACK_PORTS.filter(port => port !== PORT)];

  for (const port of portCandidates) {
    try {
      await new Promise((resolve, reject) => {
        const server = app.listen(port, () => {
          console.log(`🚀 IntelliHire AI Server running on http://localhost:${port}`);
          resolve();
        });

        server.on("error", error => {
          if (error.code === "EADDRINUSE") {
            reject(new Error(`Port ${port} is in use`));
            return;
          }
          reject(error);
        });
      });
      return;
    } catch (error) {
      if (error.message.includes("Port") && error.message.includes("is in use")) {
        continue;
      }
      throw error;
    }
  }

  throw new Error("Unable to start the IntelliHire server because all default ports are busy.");
}

async function seedDemoUser() {
  const demoUsers = [
    {
      name: "Student User",
      email: "student@intellihire.com",
      password: "student123",
      role: "user",
      onboarding: {
        targetRole: "",
        experienceLevel: "Fresher",
        primarySkills: [],
        placementGoal: "",
        graduationYear: undefined,
        college: "",
        careerGoal: "",
        timezone: "UTC"
      }
    },
    {
      name: "Admin User",
      email: "admin@intellihire.com",
      password: "admin123",
      role: "admin",
      onboarding: {
        targetRole: "Platform Admin",
        experienceLevel: "Experienced",
        primarySkills: ["Admin", "Operations", "Monitoring"],
        placementGoal: "Manage the platform",
        graduationYear: undefined,
        college: "",
        careerGoal: "Platform administration",
        timezone: "UTC"
      }
    }
  ];

  for (const userData of demoUsers) {
    const existing = await User.findOne({ email: userData.email }).lean();
    if (existing) {
      continue;
    }

    await User.create({
      name: userData.name,
      email: userData.email,
      password: userData.password,
      usn: "",
      role: userData.role,
      onboarding: userData.onboarding
    });

    console.log(`✅ Demo ${userData.role} account seeded: ${userData.email}`);
  }
}

startServer();

// ══════════════════════════════════════════════════════════
// SCHEMAS & MODELS
// ══════════════════════════════════════════════════════════

// User Schema
const userSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true },
  password:  { type: String, required: true, minlength: 6 },
  usn:       { type: String, default: "" },
  role:      { type: String, enum: ["user", "admin"], default: "user" },
  onboarding: {
    targetRole: String,
    experienceLevel: String,
    primarySkills: [String],
    placementGoal: String,
    graduationYear: Number,
    college: String,
    careerGoal: String,
    timezone: { type: String, default: "UTC" },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deletedAt: Date,
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

const User = mongoose.model("User", userSchema);

// Interview Session Schema
const interviewSchema = new mongoose.Schema({
  user:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  jobRole:    { type: String, required: true },
  level:      { type: String, default: "Fresher" },
  skills:     { type: String, default: "" },
  score:      { type: Number, default: 0 },
  questions:  [{ type: String }],
  results: [{
    question: String,
    answer:   String,
    score:    Number,
    feedback: String,
    strong:   String,
    improve:  String,
  }],
  completedAt: { type: Date, default: Date.now },
  interviewType: { type: String, default: "Mixed" },
  difficulty: { type: String, default: "Medium" },
  category: { type: String, default: "Technical" },
  status: { type: String, enum: ["in-progress", "completed", "failed"], default: "completed" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Interview = mongoose.model("Interview", interviewSchema);

// Resume Schema
const resumeSchema = new mongoose.Schema({
  user:         { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content:      { type: String, required: true },
  atsScore:     { type: Number, default: 0 },
  rating:       { type: String, default: "Good" },
  summary:      { type: String, default: "" },
  strengths:    [{ type: String }],
  improvements: [{ type: String }],
  keywords:     [{ type: String }],
  sectionsDetected: mongoose.Schema.Types.Mixed,
  scoreBreakdown: mongoose.Schema.Types.Mixed,
  extractedSkills: [{ type: String }],
  analysisStatus: { type: String, enum: ["complete", "unreliable", "failed"], default: "complete" },
  deletedAt: Date,
  analyzedAt:   { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Resume = mongoose.model("Resume", resumeSchema);

const videoInterviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  jobRole: String, level: String, questions: [mongoose.Schema.Types.Mixed], responses: [mongoose.Schema.Types.Mixed],
  transcript: String, speechMetrics: mongoose.Schema.Types.Mixed, report: mongoose.Schema.Types.Mixed,
  consent: { type: Boolean, required: true }, rawVideoStored: { type: Boolean, default: false },
  status: { type: String, enum: ["in-progress", "completed", "failed"], default: "completed" },
  completedAt: Date, createdAt: { type: Date, default: Date.now }, updatedAt: { type: Date, default: Date.now }, deletedAt: Date,
});
const VideoInterview = mongoose.model("VideoInterview", videoInterviewSchema);

const practiceSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  date: { type: String, required: true }, goalCount: Number, completedCount: Number, xpEarned: Number,
  tasks: [mongoose.Schema.Types.Mixed], timezone: String, status: { type: String, default: "active" },
  createdAt: { type: Date, default: Date.now }, updatedAt: { type: Date, default: Date.now },
});
const PracticeSession = mongoose.model("PracticeSession", practiceSessionSchema);

const practiceAnswerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  session: { type: mongoose.Schema.Types.ObjectId, ref: "PracticeSession" }, questionId: String, type: String,
  category: String, topic: String, answer: String, correct: Boolean, score: Number, xp: Number, timeSpentSeconds: Number,
  reviewLater: Boolean, createdAt: { type: Date, default: Date.now }, updatedAt: { type: Date, default: Date.now },
});
const PracticeAnswer = mongoose.model("PracticeAnswer", practiceAnswerSchema);

const streakSchema = new mongoose.Schema({ user: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true }, current: { type: Number, default: 0 }, longest: { type: Number, default: 0 }, lastGoalDate: String, xp: { type: Number, default: 0 }, timezone: String, updatedAt: { type: Date, default: Date.now } });
const UserStreak = mongoose.model("UserStreak", streakSchema);

const savedCompanySchema = new mongoose.Schema({ user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true }, companyId: String, name: String, role: String, createdAt: { type: Date, default: Date.now }, deletedAt: Date });
const SavedCompany = mongoose.model("SavedCompany", savedCompanySchema);
const companyProgressSchema = new mongoose.Schema({ user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true }, companyId: String, tasks: [mongoose.Schema.Types.Mixed], readiness: Number, metrics: mongoose.Schema.Types.Mixed, updatedAt: { type: Date, default: Date.now } });
const CompanyProgress = mongoose.model("CompanyProgress", companyProgressSchema);
const skillMetricSchema = new mongoose.Schema({ user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true }, topic: String, attempts: Number, correct: Number, accuracy: Number, lastPracticedAt: Date, updatedAt: { type: Date, default: Date.now } });
const UserSkillMetric = mongoose.model("UserSkillMetric", skillMetricSchema);
const achievementSchema = new mongoose.Schema({ user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true }, key: String, earnedAt: { type: Date, default: Date.now }, metadata: mongoose.Schema.Types.Mixed });
const Achievement = mongoose.model("Achievement", achievementSchema);
const notificationSchema = new mongoose.Schema({ user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true }, type: String, title: String, body: String, readAt: Date, createdAt: { type: Date, default: Date.now } });
const Notification = mongoose.model("Notification", notificationSchema);
const coachConversationSchema = new mongoose.Schema({ user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true }, title: { type: String, default: "New career chat" }, deletedAt: Date, createdAt: { type: Date, default: Date.now }, updatedAt: { type: Date, default: Date.now } });
const CoachConversation = mongoose.model("CoachConversation", coachConversationSchema);
const coachMessageSchema = new mongoose.Schema({ user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true }, conversation: { type: mongoose.Schema.Types.ObjectId, ref: "CoachConversation", required: true }, role: { type: String, enum: ["user", "assistant"], required: true }, content: { type: String, required: true, maxlength: 20000 }, suggestedActions: [mongoose.Schema.Types.Mixed], careerPlan: mongoose.Schema.Types.Mixed, createdAt: { type: Date, default: Date.now } });
const CoachMessage = mongoose.model("CoachMessage", coachMessageSchema);
const savedCareerPlanSchema = new mongoose.Schema({ user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true }, conversation: mongoose.Schema.Types.ObjectId, title: String, durationDays: Number, tasks: [mongoose.Schema.Types.Mixed], status: { type: String, enum: ["active", "completed", "archived"], default: "active" }, createdAt: { type: Date, default: Date.now }, updatedAt: { type: Date, default: Date.now }, deletedAt: Date });
const SavedCareerPlan = mongoose.model("SavedCareerPlan", savedCareerPlanSchema);
const userContextSummarySchema = new mongoose.Schema({ user: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true, index: true }, summary: mongoose.Schema.Types.Mixed, generatedAt: { type: Date, default: Date.now }, updatedAt: { type: Date, default: Date.now } });
const UserContextSummary = mongoose.model("UserContextSummary", userContextSummarySchema);

// ══════════════════════════════════════════════════════════
// MIDDLEWARE: Auth Guard
// ══════════════════════════════════════════════════════════
const protect = async (req, res, next) => {
  const token = req.cookies.ih_session || req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Not authenticated" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) return res.status(401).json({ error: "User not found" });
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Admin access required" });
  next();
};

// ══════════════════════════════════════════════════════════
// AI HELPER
// ══════════════════════════════════════════════════════════
function resolveGeminiApiKey() {
  return (process.env.GEMINI_API_KEY || process.env.GEMINI_KEY || process.env.GOOGLE_API_KEY || "").trim();
}

async function callGemini(prompt) {
  const API_KEY = resolveGeminiApiKey();
  if (!API_KEY || API_KEY === "replace_with_server_only_key") {
    throw new Error("GEMINI API key is not configured.");
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
      })
    }
  );

  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    throw new Error(data?.error?.message || `Gemini request failed (${res.status}).`);
  }

  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  if (!raw) {
    throw new Error("Gemini returned an empty response.");
  }

  return raw;
}

function parseJSON(raw) {
  const cleaned = String(raw || "").replace(/```json|```/gi, "").trim();

  if (!cleaned) return null;

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");

    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        return null;
      }
    }

    return null;
  }
}

function buildCoachFallbackResponse(context, question) {
  const role = context?.targetRole || "your target role";
  const weakSkills = Array.isArray(context?.interviews?.weakSkills) ? context.interviews.weakSkills : [];
  const resumeGaps = Array.isArray(context?.resume?.gaps) ? context.resume.gaps : [];

  const guidance = [
    `I’m temporarily unable to reach the live AI coach, but here’s a strong next step for ${role}.`,
    weakSkills.length
      ? `Start with ${weakSkills.slice(0, 2).join(" and ")}, because those are the clearest gaps in your recent practice.`
      : `Choose one skill area to improve this week and practice it in a mock interview or daily challenge.`,
    resumeGaps.length
      ? `Your resume feedback points to ${resumeGaps.slice(0, 2).join(" and ")}, so update those sections before applying.`
      : `If your profile is still thin, tighten your resume bullets and add evidence from projects, internships, or coursework.`,
    `For now, answer one focused question: what would make your preparation easier today—mock interview practice, resume improvement, or a roadmap for ${role}?`
  ];

  return {
    message: {
      role: "assistant",
      content: guidance.join("\n\n"),
      suggestedActions: [
        { label: "Open dashboard", type: "dashboard", payload: {} },
        { label: "Practice today", type: "daily_practice", payload: {} },
        { label: "Try a mock interview", type: "mock_interview", payload: {} },
        { label: "Improve resume", type: "resume", payload: {} }
      ],
      careerPlan: null
    }
  };
}

// ══════════════════════════════════════════════════════════
// ROUTES: AUTH
// ══════════════════════════════════════════════════════════

// Register
app.post("/api/auth/register", authLimiter, async (req, res) => {
  try {
    const { name, email, password, usn } = req.body;
    if (!name?.trim() || !email?.trim() || !password)
      return res.status(400).json({ error: "Name, email, and password are required." });
    if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 8)
      return res.status(400).json({ error: "Use a valid email and a password of at least 8 characters." });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(409).json({ error: "Email already registered" });

    const user = await User.create({ name, email, password, usn: usn || "" });
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

    res.cookie("ih_session", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role, usn: user.usn, onboarding: user.onboarding || {} }
    });
  } catch (err) {
    const status = mongoose.connection.readyState === 1 ? 500 : 503;
    res.status(status).json({ error: status === 503 ? "Authentication service is unavailable. Start MongoDB and try again." : err.message });
  }
});

// Login
app.post("/api/auth/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ error: "Invalid email or password" });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

    res.cookie("ih_session", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", ...(req.body.remember ? { maxAge: 30 * 24 * 60 * 60 * 1000 } : {}) });
    res.json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role, usn: user.usn, onboarding: user.onboarding || {} }
    });
  } catch (err) {
    const status = mongoose.connection.readyState === 1 ? 500 : 503;
    res.status(status).json({ error: status === 503 ? "Authentication service is unavailable. Start MongoDB and try again." : err.message });
  }
});

app.post("/api/auth/logout", (req, res) => { res.clearCookie("ih_session"); res.json({ success: true }); });

app.put("/api/auth/onboarding", protect, async (req, res) => {
  try {
    const { targetRole, experienceLevel, primarySkills, placementGoal, graduationYear, college, careerGoal, timezone } = req.body || {};
    const skills = Array.isArray(primarySkills) ? primarySkills : String(primarySkills || "").split(",");
    const onboarding = { targetRole: String(targetRole || "").trim().slice(0, 120), experienceLevel: String(experienceLevel || "").slice(0, 40), primarySkills: skills.map(skill => String(skill).trim().slice(0, 50)).filter(Boolean).slice(0, 20), placementGoal: String(placementGoal || careerGoal || "").slice(0, 120), graduationYear: graduationYear ? Number(graduationYear) : undefined, college: String(college || "").trim().slice(0, 160), careerGoal: String(careerGoal || placementGoal || "").trim().slice(0, 160), timezone: String(timezone || "UTC").slice(0, 80) };
    const user = await User.findByIdAndUpdate(req.user._id, { onboarding, updatedAt: new Date() }, { new: true, runValidators: true }).select("-password");
    res.json({ user });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.put("/api/profile", protect, async (req, res) => {
  try {
    const input = req.body || {};
    const skills = Array.isArray(input.primarySkills) ? input.primarySkills : String(input.primarySkills || "").split(",");
    const onboarding = { targetRole: String(input.targetRole || "").trim().slice(0, 120), experienceLevel: String(input.experienceLevel || "").slice(0, 40), primarySkills: skills.map(skill => String(skill).trim().slice(0, 50)).filter(Boolean).slice(0, 20), placementGoal: String(input.placementGoal || input.careerGoal || "").slice(0, 120), graduationYear: input.graduationYear ? Number(input.graduationYear) : undefined, college: String(input.college || "").trim().slice(0, 160), careerGoal: String(input.careerGoal || input.placementGoal || "").trim().slice(0, 160), timezone: String(input.timezone || "UTC").slice(0, 80) };
    const user = await User.findByIdAndUpdate(req.user._id, { name: String(input.name || req.user.name).trim().slice(0, 120), onboarding, updatedAt: new Date() }, { new: true, runValidators: true }).select("-password");
    res.json({ user });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.post("/api/auth/forgot-password", authLimiter, async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    if (email && /^\S+@\S+\.\S+$/.test(email)) {
      await User.findOne({ email });
    }
    res.json({ message: "If an account matches this email, reset instructions will be sent shortly." });
  } catch (err) {
    const status = mongoose.connection.readyState === 1 ? 500 : 503;
    res.status(status).json({ error: status === 503 ? "Authentication service is unavailable. Start MongoDB and try again." : err.message });
  }
});

// Get profile
app.get("/api/auth/me", protect, (req, res) => {
  res.json({ user: req.user });
});

// ══════════════════════════════════════════════════════════
// ROUTES: INTERVIEW
// ══════════════════════════════════════════════════════════

// Generate interview questions
app.post("/api/interview/generate", protect, async (req, res) => {
  try {
    const { jobRole, level, skills, interviewType, totalQuestions, difficulty, jobDescription } = req.body;
    if (!jobRole) return res.status(400).json({ error: "Job role is required" });

    const prompt = `Generate exactly ${totalQuestions || 5} structured interview questions for a ${level || "Fresher"} applying as a ${jobRole}. Interview type: ${interviewType || "Mixed"}. Difficulty: ${difficulty || "Medium"}. Skills: ${(skills || []).join(", ") || "role fundamentals"}. Job description: ${jobDescription || "none"}. Return JSON only: {"questions":[{"id":1,"category":"technical|behavioral|scenario|project|hr","question":"...","expectedTopics":["..."],"followUpRules":["..."]}]}. Freshers need fundamentals, projects, internships, learning ability, and problem solving. Experienced candidates need architecture, debugging, ownership, impact, and leadership where relevant.`;

    const raw = await callGemini(prompt);
    const questions = parseJSON(raw);

    if (!questions || !Array.isArray(questions.questions)) return res.status(502).json({ error: "Question generation returned invalid structured data." });
    res.json({ questions: questions.questions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Evaluate a single answer
app.post("/api/interview/evaluate", protect, async (req, res) => {
  try {
    const { question, answer, jobRole, level } = req.body;
    if (!question || !answer) return res.status(400).json({ error: "Question and answer required" });

    const prompt = `You are evaluating an interview answer.
    Role: ${jobRole || "Software Engineer"} (${level || "Fresher"})
    Question: "${question}"
    Candidate's Answer: "${answer}"
    
    Evaluate this answer strictly and fairly. Return JSON only:
    {"score":<0-12>,"relevance":<0-2>,"technicalCorrectness":<0-2>,"clarity":<0-2>,"depth":<0-2>,"practicalExamples":<0-2>,"communicationQuality":<0-2>,"strengths":[],"improvements":[],"strongerAnswerOutline":[],"idealAnswer":""}. Never use a default score. If the answer is empty or too short, score 0 and explain what evidence is missing.`;

    const raw = await callGemini(prompt);
    const result = parseJSON(raw);

    if (!result) return res.status(502).json({ error: "Answer evaluation returned invalid structured data." });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save completed interview session
app.post("/api/interview/save", protect, async (req, res) => {
  try {
    const { jobRole, level, skills, score, questions, results } = req.body;
    const session = await Interview.create({
      user: req.user._id, jobRole, level, skills, score, questions, results
    });
    res.status(201).json({ session });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user's interview history
app.get("/api/interview/history", protect, async (req, res) => {
  try {
    const sessions = await Interview.find({ user: req.user._id }).sort({ completedAt: -1 }).limit(20);
    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════
// ROUTES: RESUME
// ══════════════════════════════════════════════════════════

// Analyze resume
app.post("/api/resume/analyze", protect, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: "Resume content is required" });

    const prompt = `Analyze this resume for ATS compatibility and quality.
    Return JSON only (no markdown):
    {
      "atsScore": <integer 0-100>,
      "overallRating": "Excellent|Good|Average|Needs Work",
      "summary": "<2 specific sentences about this resume>",
      "strengths": ["<item>", "<item>", "<item>"],
      "improvements": ["<item>", "<item>", "<item>", "<item>"],
      "keywords": ["<keyword>", "<keyword>", "<keyword>", "<keyword>", "<keyword>"]
    }
    
    Resume:
    ${content}`;

    const raw = await callGemini(prompt);
    const analysis = parseJSON(raw);

    if (!analysis) return res.status(502).json({ error: "Resume analysis did not return valid structured data." });
    const resume = await Resume.create({ user: req.user._id, content, atsScore: Number.isFinite(Number(analysis.atsScore)) ? Number(analysis.atsScore) : undefined, rating: analysis.overallRating || "", summary: analysis.summary || "", strengths: Array.isArray(analysis.strengths) ? analysis.strengths : [], improvements: Array.isArray(analysis.improvements) ? analysis.improvements : [], keywords: Array.isArray(analysis.keywords) ? analysis.keywords : [], sectionsDetected: analysis.sections || {}, scoreBreakdown: analysis.scores || {}, extractedSkills: Array.isArray(analysis.extractedSkills) ? analysis.extractedSkills : [], analysisStatus: "complete" });
    res.status(201).json({ ...analysis, id: resume._id, analyzedAt: resume.analyzedAt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/resume/save-analysis", protect, async (req, res) => {
  try {
    const input = req.body || {};
    if (!input.analysis || typeof input.analysis !== "object") return res.status(400).json({ error: "Analysis data is required." });
    const analysis = input.analysis;
    const resume = await Resume.create({ user: req.user._id, content: String(input.content || "").slice(0, 200000), atsScore: Number.isFinite(Number(analysis.atsScore || analysis.scores?.overall)) ? Number(analysis.atsScore || analysis.scores.overall) : undefined, rating: analysis.overallRating || "", summary: analysis.summary || "", strengths: analysis.strengths || [], improvements: analysis.improvements || [], keywords: Array.isArray(analysis.keywords) ? analysis.keywords : analysis.keywords?.found || [], sectionsDetected: analysis.sections || {}, scoreBreakdown: analysis.scores || {}, extractedSkills: analysis.extractedSkills || analysis.parsedData?.skills || [], analysisStatus: analysis.analysisStatus === "unreliable" ? "unreliable" : "complete" });
    res.status(201).json({ resume });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Get user's resume history
app.get("/api/resume/history", protect, async (req, res) => {
  try {
    const resumes = await Resume.find({ user: req.user._id })
      .select("-content")
      .sort({ analyzedAt: -1 })
      .limit(10);
    res.json({ resumes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════
// ROUTES: ANALYTICS
// ══════════════════════════════════════════════════════════
app.get("/api/analytics", protect, async (req, res) => {
  try { res.json(await getDashboardData(req.user)); } catch (err) { res.status(500).json({ error: err.message }); }
});

function localDateKey(date = new Date(), timezone = "UTC") {
  try { return new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date); } catch { return date.toISOString().slice(0, 10); }
}
function percent(values) { return values.length ? Math.round(values.reduce((sum, value) => sum + Number(value || 0), 0) / values.length) : null; }

async function getDashboardData(user) {
  const userId = user._id;
  const [interviews, videos, resumes, answers, streak, savedCompanies, companyProgress] = await Promise.all([
    Interview.find({ user: userId, status: "completed", deletedAt: { $exists: false } }).sort({ completedAt: 1 }).lean(),
    VideoInterview.find({ user: userId, status: "completed", deletedAt: { $exists: false } }).sort({ completedAt: 1 }).lean(),
    Resume.find({ user: userId, deletedAt: { $exists: false } }).sort({ analyzedAt: -1 }).limit(10).lean(),
    PracticeAnswer.find({ user: userId }).sort({ createdAt: 1 }).lean(),
    UserStreak.findOne({ user: userId }).lean(),
    SavedCompany.find({ user: userId, deletedAt: { $exists: false } }).lean(),
    CompanyProgress.find({ user: userId }).lean(),
  ]);
  const sessions = [...interviews.map(item => ({ ...item, type: "Mock Interview", date: item.completedAt })), ...videos.map(item => ({ ...item, type: "Video Interview", score: item.report?.overallScore ?? null, date: item.completedAt }))].filter(item => Number.isFinite(Number(item.score))).sort((a, b) => new Date(a.date) - new Date(b.date));
  const scores = sessions.map(item => item.score);
  const topicStats = {};
  answers.forEach(answer => { if (!topicStats[answer.topic]) topicStats[answer.topic] = { attempts: 0, correct: 0 }; topicStats[answer.topic].attempts += 1; if (answer.correct) topicStats[answer.topic].correct += 1; });
  const topicAccuracy = Object.fromEntries(Object.entries(topicStats).map(([topic, value]) => [topic, Math.round(value.correct / value.attempts * 100)]));
  const latestResume = resumes[0] || null;
  const interviewAverage = percent(scores);
  const practiceAverage = answers.length ? percent(answers.map(answer => answer.correct ? 100 : 0)) : null;
  const readinessInputs = [interviewAverage, latestResume?.atsScore ?? null, practiceAverage].filter(value => value !== null);
  const readiness = readinessInputs.length >= 2 ? percent(readinessInputs) : null;
  const trend = days => sessions.filter(item => new Date(item.date) >= new Date(Date.now() - days * 86400000)).map(item => ({ date: item.date, score: item.score }));
  return { profile: { name: user.name, email: user.email, ...(user.onboarding || {}) }, metrics: { totalInterviews: interviews.length, averageInterviewScore: interviewAverage, bestInterviewScore: scores.length ? Math.max(...scores) : null, placementReadiness: readiness, skillsCovered: [...new Set(interviews.flatMap(item => Array.isArray(item.skills) ? item.skills : String(item.skills || "").split(",").map(skill => skill.trim()).filter(Boolean)))], weakSkills: Object.entries(topicAccuracy).filter(([, score]) => score < 70).sort((a, b) => a[1] - b[1]).map(([topic]) => topic), strongSkills: Object.entries(topicAccuracy).filter(([, score]) => score >= 80).map(([topic]) => topic), dailyStreak: streak?.current || 0, longestStreak: streak?.longest || 0, xp: streak?.xp || 0, resumeScore: latestResume?.atsScore ?? null, resumeStatus: latestResume?.analysisStatus || "not_started", savedCompanyCount: savedCompanies.length }, trends: { 7: trend(7), 30: trend(30), 90: trend(90) }, recentSessions: sessions.slice(-10).reverse(), topicAccuracy, resume: latestResume, savedCompanies, companyProgress, today: localDateKey(new Date(), user.onboarding?.timezone || "UTC") };
}

app.get("/api/dashboard", protect, async (req, res) => { try { res.json(await getDashboardData(req.user)); } catch (err) { res.status(500).json({ error: err.message }); } });

app.post("/api/video-interviews", protect, async (req, res) => {
  try {
    const input = req.body || {};
    if (!input.consent) return res.status(400).json({ error: "Consent is required before saving transcripts or metrics." });
    const video = await VideoInterview.create({ user: req.user._id, jobRole: input.jobRole, level: input.level, questions: input.questions || [], responses: input.responses || [], transcript: input.transcript || "", speechMetrics: input.speechMetrics || {}, report: input.report || {}, consent: true, rawVideoStored: false, status: "completed", completedAt: new Date() });
    res.status(201).json({ video });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.post("/api/practice/sessions", protect, async (req, res) => {
  try {
    const input = req.body || {};
    if (!Array.isArray(input.tasks) || !input.tasks.length) return res.status(400).json({ error: "A non-empty practice plan is required." });
    const date = String(input.date || localDateKey(new Date(), req.user.onboarding?.timezone || "UTC"));
    const session = await PracticeSession.findOneAndUpdate({ user: req.user._id, date }, { $set: { goalCount: input.goalCount || input.tasks.length, tasks: input.tasks, timezone: input.timezone || req.user.onboarding?.timezone || "UTC", updatedAt: new Date() } }, { upsert: true, new: true, setDefaultsOnInsert: true });
    res.status(201).json({ session });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.get("/api/practice/plan", protect, async (req, res) => {
  try {
    const dashboard = await getDashboardData(req.user);
    const prompt = `Create a personalized daily placement practice plan. Return JSON only with {"tasks":[...]}. Create 3 to 5 tasks. Each task must contain id, type (mcq|coding|aptitude|behavioral|short_answer|resume), category, topic, difficulty (easy|medium|hard), estimatedMinutes, reason, xp, prompt, options (only for mcq/aptitude), correctAnswer (only for mcq/aptitude), explanation, wrongOptionExplanations (only for mcq/aptitude), and concept. User profile: ${JSON.stringify({ targetRole: dashboard.profile.targetRole, experienceLevel: dashboard.profile.experienceLevel, primarySkills: dashboard.profile.primarySkills, careerGoal: dashboard.profile.careerGoal })}. Evidence: ${JSON.stringify({ weakSkills: dashboard.metrics.weakSkills, strongSkills: dashboard.metrics.strongSkills, topicAccuracy: dashboard.topicAccuracy, resumeGaps: dashboard.resume?.improvements || [], recentSessions: dashboard.recentSessions.slice(0, 5).map(item => ({ type: item.type, score: item.score, role: item.jobRole })) })}. Include a role-based baseline when evidence is empty. Do not invent user scores or feedback. Make every MCQ answer one of its options and provide an explanation for every question.`;
    const parsed = parseJSON(await callGemini(prompt));
    if (!parsed?.tasks?.length || parsed.tasks.some(task => !task.id || !task.type || !task.topic || !task.prompt || !task.explanation || ((task.type === "mcq" || task.type === "aptitude") && (!Array.isArray(task.options) || !task.options.includes(task.correctAnswer))))) return res.status(502).json({ error: "Daily plan generation returned invalid structured data." });
    res.json({ date: localDateKey(new Date(), req.user.onboarding?.timezone || "UTC"), goalCount: parsed.tasks.length, completedCount: 0, xpEarned: 0, tasks: parsed.tasks.slice(0, 5) });
  } catch (err) { res.status(503).json({ error: "Daily plan generation is temporarily unavailable." }); }
});

app.post("/api/practice/answers", protect, async (req, res) => {
  try {
    const input = req.body || {};
    if (!input.sessionId || !input.questionId || !input.topic) return res.status(400).json({ error: "Session, question, and topic are required." });
    const answer = await PracticeAnswer.create({ user: req.user._id, session: input.sessionId, questionId: String(input.questionId), type: input.type, category: input.category, topic: String(input.topic), answer: String(input.answer || "").slice(0, 20000), correct: Boolean(input.correct), score: Number.isFinite(Number(input.score)) ? Number(input.score) : (input.correct ? 100 : 0), xp: Math.max(0, Number(input.xp) || 0), timeSpentSeconds: Math.max(0, Number(input.timeSpentSeconds) || 0), reviewLater: !input.correct });
    const allAnswers = await PracticeAnswer.find({ user: req.user._id, session: input.sessionId }).lean();
    await PracticeSession.findOneAndUpdate({ _id: input.sessionId, user: req.user._id }, { completedCount: allAnswers.length, xpEarned: allAnswers.reduce((sum, item) => sum + item.xp, 0), updatedAt: new Date() });
    const timezone = req.user.onboarding?.timezone || "UTC";
    if (input.dailyGoalComplete) {
      const date = localDateKey(new Date(), timezone); const previousDate = localDateKey(new Date(Date.now() - 86400000), timezone); const streak = await UserStreak.findOne({ user: req.user._id }) || new UserStreak({ user: req.user._id, timezone });
      streak.current = streak.lastGoalDate === previousDate ? streak.current + 1 : streak.lastGoalDate === date ? streak.current : 1; streak.longest = Math.max(streak.longest, streak.current); streak.lastGoalDate = date; streak.xp += answer.xp; streak.updatedAt = new Date(); await streak.save();
    } else await UserStreak.findOneAndUpdate({ user: req.user._id }, { $inc: { xp: answer.xp }, $set: { timezone, updatedAt: new Date() } }, { upsert: true });
    res.status(201).json({ answer });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.get("/api/companies/saved", protect, async (req, res) => { res.json({ companies: await SavedCompany.find({ user: req.user._id, deletedAt: { $exists: false } }).lean() }); });
app.post("/api/companies/saved", protect, async (req, res) => { const company = await SavedCompany.findOneAndUpdate({ user: req.user._id, companyId: String(req.body?.companyId || "") }, { ...req.body, user: req.user._id, deletedAt: undefined }, { upsert: true, new: true, setDefaultsOnInsert: true }); res.status(201).json({ company }); });
app.delete("/api/companies/saved/:companyId", protect, async (req, res) => { await SavedCompany.findOneAndUpdate({ user: req.user._id, companyId: req.params.companyId }, { deletedAt: new Date() }); res.json({ success: true }); });
app.put("/api/companies/:companyId/progress", protect, async (req, res) => { const progress = await CompanyProgress.findOneAndUpdate({ user: req.user._id, companyId: req.params.companyId }, { ...req.body, user: req.user._id, companyId: req.params.companyId, updatedAt: new Date() }, { upsert: true, new: true, setDefaultsOnInsert: true }); res.json({ progress }); });

app.get("/api/users/export", protect, async (req, res) => { const [user, interviews, resumes, videos, answers, companies, progress] = await Promise.all([User.findById(req.user._id).select("-password").lean(), Interview.find({ user: req.user._id }).lean(), Resume.find({ user: req.user._id }).select("-content").lean(), VideoInterview.find({ user: req.user._id }).select("-transcript").lean(), PracticeAnswer.find({ user: req.user._id }).lean(), SavedCompany.find({ user: req.user._id }).lean(), CompanyProgress.find({ user: req.user._id }).lean()]); res.json({ user, interviews, resumes, videos, answers, companies, progress }); });
app.delete("/api/users/me", protect, async (req, res) => { const userId = req.user._id; await Promise.all([Interview.deleteMany({ user: userId }), Resume.deleteMany({ user: userId }), VideoInterview.deleteMany({ user: userId }), PracticeSession.deleteMany({ user: userId }), PracticeAnswer.deleteMany({ user: userId }), UserStreak.deleteMany({ user: userId }), SavedCompany.deleteMany({ user: userId }), CompanyProgress.deleteMany({ user: userId }), UserSkillMetric.deleteMany({ user: userId }), Achievement.deleteMany({ user: userId }), Notification.deleteMany({ user: userId }), CoachConversation.deleteMany({ user: userId }), CoachMessage.deleteMany({ user: userId }), SavedCareerPlan.deleteMany({ user: userId }), UserContextSummary.deleteMany({ user: userId }), User.findByIdAndDelete(userId)]); res.clearCookie("ih_session"); res.json({ success: true }); });

function coachContext(dashboard) { return { targetRole: dashboard.profile.targetRole || null, experienceLevel: dashboard.profile.experienceLevel || null, skills: dashboard.profile.primarySkills || [], goal: dashboard.profile.careerGoal || dashboard.profile.placementGoal || null, resume: dashboard.resume ? { score: dashboard.metrics.resumeScore, gaps: dashboard.resume.improvements || [], strengths: dashboard.resume.strengths || [] } : null, interviews: { total: dashboard.metrics.totalInterviews, average: dashboard.metrics.averageInterviewScore, weakSkills: dashboard.metrics.weakSkills, recent: dashboard.recentSessions.slice(0, 5).map(item => ({ type: item.type, score: item.score, role: item.jobRole })) }, practice: { topicAccuracy: dashboard.topicAccuracy, streak: dashboard.metrics.dailyStreak, xp: dashboard.metrics.xp }, companies: dashboard.companyProgress.map(item => ({ companyId: item.companyId, readiness: item.readiness })) }; }

app.get("/api/coach/conversations", protect, async (req, res) => { try { const conversations = await CoachConversation.find({ user: req.user._id, deletedAt: { $exists: false } }).sort({ updatedAt: -1 }).lean(); res.json({ conversations }); } catch (err) { res.status(500).json({ error: err.message }); } });
app.post("/api/coach/conversations", protect, async (req, res) => { try { const conversation = await CoachConversation.create({ user: req.user._id, title: String(req.body?.title || "New career chat").trim().slice(0, 120) || "New career chat" }); res.status(201).json({ conversation }); } catch (err) { res.status(400).json({ error: err.message }); } });
app.get("/api/coach/conversations/:id/messages", protect, async (req, res) => { try { const conversation = await CoachConversation.findOne({ _id: req.params.id, user: req.user._id, deletedAt: { $exists: false } }).lean(); if (!conversation) return res.status(404).json({ error: "Conversation not found." }); const messages = await CoachMessage.find({ conversation: conversation._id, user: req.user._id }).sort({ createdAt: 1 }).lean(); res.json({ conversation, messages }); } catch (err) { res.status(404).json({ error: "Conversation not found." }); } });
app.patch("/api/coach/conversations/:id", protect, async (req, res) => { try { const conversation = await CoachConversation.findOneAndUpdate({ _id: req.params.id, user: req.user._id, deletedAt: { $exists: false } }, { title: String(req.body?.title || "New career chat").trim().slice(0, 120) || "New career chat", updatedAt: new Date() }, { new: true }); if (!conversation) return res.status(404).json({ error: "Conversation not found." }); res.json({ conversation }); } catch (err) { res.status(404).json({ error: "Conversation not found." }); } });
app.delete("/api/coach/conversations/:id", protect, async (req, res) => { try { const conversation = await CoachConversation.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { deletedAt: new Date(), updatedAt: new Date() }); if (!conversation) return res.status(404).json({ error: "Conversation not found." }); await CoachMessage.deleteMany({ conversation: conversation._id, user: req.user._id }); res.json({ success: true }); } catch (err) { res.status(404).json({ error: "Conversation not found." }); } });

app.post("/api/coach/messages", protect, async (req, res) => {
  try {
    const conversation = await CoachConversation.findOne({ _id: req.body?.conversationId, user: req.user._id, deletedAt: { $exists: false } });
    const question = String(req.body?.message || "").trim().slice(0, 4000);
    if (!conversation || !question) return res.status(400).json({ error: "Conversation and message are required." });

    const dashboard = await getDashboardData(req.user);
    const context = coachContext(dashboard);
    const previous = await CoachMessage.find({ conversation: conversation._id, user: req.user._id }).sort({ createdAt: -1 }).limit(10).lean();
    await CoachMessage.create({ user: req.user._id, conversation: conversation._id, role: "user", content: question });

    let assistant;
    const prompt = `You are IntelliHire's private AI career coach. Give concise, practical educational guidance. Use only the summarized context below. Never invent scores, skills, projects, sessions, company facts, or hiring outcomes. If key context is missing, ask one concise clarifying question or recommend onboarding. Do not use protected characteristics. Mention when advice is based on the student's data. Return JSON only: {"message":"safe markdown text","suggestedActions":[{"label":"...","type":"dashboard|mock_interview|daily_practice|resume|company_prep|coach","payload":{}}],"careerPlan":null|{"title":"...","durationDays":7,"tasks":[{"day":1,"title":"...","estimatedMinutes":30,"priority":"high|medium|low","reason":"...","actionType":"daily_practice|mock_interview|resume|company_prep|analytics","status":"not_started"}]}}. Context: ${JSON.stringify(context)} Conversation: ${JSON.stringify(previous.reverse().map(item => ({ role: item.role, content: item.content })))} New question: ${question}`;

    try {
      const parsed = parseJSON(await callGemini(prompt));
      if (!parsed?.message) {
        throw new Error("Gemini returned an invalid JSON payload.");
      }

      assistant = await CoachMessage.create({
        user: req.user._id,
        conversation: conversation._id,
        role: "assistant",
        content: String(parsed.message).slice(0, 20000),
        suggestedActions: Array.isArray(parsed.suggestedActions) ? parsed.suggestedActions.slice(0, 5) : [],
        careerPlan: parsed.careerPlan || null
      });
    } catch {
      const fallback = buildCoachFallbackResponse(context, question);
      assistant = await CoachMessage.create({
        user: req.user._id,
        conversation: conversation._id,
        role: "assistant",
        content: String(fallback.message.content).slice(0, 20000),
        suggestedActions: fallback.message.suggestedActions,
        careerPlan: null
      });
    }

    const title = conversation.title === "New career chat" ? question.slice(0, 60) : conversation.title;
    await CoachConversation.updateOne({ _id: conversation._id, user: req.user._id }, { title, updatedAt: new Date() });
    res.status(201).json({ message: assistant, context: { metrics: dashboard.metrics, profile: dashboard.profile } });
  } catch (err) {
    res.status(503).json({ error: "The coach is temporarily unavailable. Please retry." });
  }
});

app.get("/api/coach/plans", protect, async (req, res) => { const plans = await SavedCareerPlan.find({ user: req.user._id, deletedAt: { $exists: false } }).sort({ updatedAt: -1 }).lean(); res.json({ plans }); });
app.post("/api/coach/plans", protect, async (req, res) => { try { const input = req.body || {}; if (!input.title || !Array.isArray(input.tasks) || !input.tasks.length) return res.status(400).json({ error: "A plan title and tasks are required." }); const plan = await SavedCareerPlan.create({ user: req.user._id, conversation: input.conversationId, title: String(input.title).slice(0, 160), durationDays: Math.max(1, Number(input.durationDays) || 7), tasks: input.tasks.slice(0, 60) }); res.status(201).json({ plan }); } catch (err) { res.status(400).json({ error: err.message }); } });
app.patch("/api/coach/plans/:id", protect, async (req, res) => { const plan = await SavedCareerPlan.findOneAndUpdate({ _id: req.params.id, user: req.user._id, deletedAt: { $exists: false } }, { tasks: req.body?.tasks, status: req.body?.status, updatedAt: new Date() }, { new: true }); if (!plan) return res.status(404).json({ error: "Plan not found." }); res.json({ plan }); });
app.delete("/api/coach/plans/:id", protect, async (req, res) => { await SavedCareerPlan.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { deletedAt: new Date(), status: "archived" }); res.json({ success: true }); });

// ══════════════════════════════════════════════════════════
// ROUTES: ADMIN
// ══════════════════════════════════════════════════════════
app.get("/api/admin/users", protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    const usersWithStats = await Promise.all(users.map(async u => {
      const interviewCount = await Interview.countDocuments({ user: u._id });
      const avgScore = interviewCount
        ? Math.round((await Interview.aggregate([
            { $match: { user: u._id } },
            { $group: { _id: null, avg: { $avg: "$score" } } }
          ]))[0]?.avg || 0)
        : 0;
      return { ...u.toObject(), interviewCount, avgScore };
    }));
    res.json({ users: usersWithStats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/admin/stats", protect, adminOnly, async (req, res) => {
  try {
    const totalUsers      = await User.countDocuments({ role: "user" });
    const totalInterviews = await Interview.countDocuments();
    const totalResumes    = await Resume.countDocuments();
    const avgScoreResult  = await Interview.aggregate([{ $group: { _id: null, avg: { $avg: "$score" } } }]);
    const avgScore        = Math.round(avgScoreResult[0]?.avg || 0);

    res.json({ totalUsers, totalInterviews, totalResumes, avgScore });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/admin/users/:id", protect, adminOnly, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    await Interview.deleteMany({ user: req.params.id });
    await Resume.deleteMany({ user: req.params.id });
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Health check ────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ message: "IntelliHire AI API is running 🚀", version: "1.0.0" });
});

// ── Production frontend ─────────────────────────────────
const frontendBuild = path.resolve(__dirname, "intellihire", "build");
if (fs.existsSync(frontendBuild)) {
  app.use(express.static(frontendBuild));
  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendBuild, "index.html"));
  });
}

