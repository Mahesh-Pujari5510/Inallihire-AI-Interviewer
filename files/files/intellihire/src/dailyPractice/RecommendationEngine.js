import { validQuestions } from "./questions";

const difficultyRank = { easy: 1, medium: 2, hard: 3 };
const categories = ["technical", "aptitude", "behavioral", "communication", "resume"];

export function normalizeProfile(user = {}) {
  const skills = Array.isArray(user.skills) ? user.skills : String(user.skills || user.primarySkills || "").split(",").map(item => item.trim()).filter(Boolean);
  return { name: user.name || "there", role: user.targetRole || user.role || "Software Engineer", level: user.experienceLevel || user.level || "Fresher", skills, goal: user.placementGoal || user.goal || "Get interview ready" };
}

export function getWeakTopics(performance = {}) {
  return Object.entries(performance.accuracyByTopic || {}).filter(([, value]) => Number.isFinite(value) && value < 70).sort((a, b) => a[1] - b[1]).map(([topic]) => topic);
}

function baselineTopics(profile) {
  const role = profile.role.toLowerCase();
  if (role.includes("data")) return ["SQL joins", "Percentages", "Technical explanation"];
  if (role.includes("frontend") || profile.skills.some(skill => /react|javascript|web/i.test(skill))) return ["Arrays", "Technical explanation", "STAR storytelling"];
  return ["SQL joins", "Arrays", "STAR storytelling"];
}

export function recommendQuestions({ profile: rawProfile, performance = {}, history = [], count = 5 } = {}) {
  const profile = normalizeProfile(rawProfile);
  const weakTopics = getWeakTopics(performance);
  const incorrectTopics = (performance.reviewLater || []).map(item => item.topic);
  const targetTopics = [...new Set([...incorrectTopics, ...weakTopics, ...baselineTopics(profile)])];
  const recentIds = history.slice(-8).map(item => item.questionId);
  const pool = validQuestions();
  const scored = pool.map(question => {
    let score = targetTopics.includes(question.topic) ? 20 : 0;
    if (incorrectTopics.includes(question.topic)) score += 25;
    if (profile.skills.some(skill => question.topic.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(question.topic.toLowerCase()))) score += 10;
    if (recentIds.includes(question.id)) score -= 18;
    if (question.category === "technical" && profile.role !== "Software Engineer") score -= 2;
    return { question, score };
  }).sort((a, b) => b.score - a.score);
  const chosen = [];
  const categoryLimit = Math.max(1, Math.ceil(count / categories.length));
  for (const item of scored) {
    if (chosen.length >= count) break;
    const countInCategory = chosen.filter(question => question.category === item.question.category).length;
    if (countInCategory < categoryLimit || chosen.length + 1 === count) chosen.push(item.question);
  }
  return chosen;
}

export function buildDailyPlan({ profile: rawProfile, performance = {}, history = [], date = new Date() } = {}) {
  const profile = normalizeProfile(rawProfile);
  const questions = recommendQuestions({ profile, performance, history, count: 5 });
  const firstWeak = getWeakTopics(performance)[0];
  return { date: date.toISOString().slice(0, 10), goalCount: questions.length, completedCount: 0, xpEarned: 0, tasks: questions.map((question, index) => ({ id: `task-${question.id}`, questionId: question.id, type: question.type, category: question.category, topic: question.topic, difficulty: question.difficulty, estimatedMinutes: question.type === "coding" ? 20 : question.type === "resume" ? 5 : 10, reason: firstWeak && question.topic === firstWeak ? `Your recent accuracy in ${firstWeak} is below 70%.` : index === 0 ? `A role-based baseline for ${profile.role} at ${profile.level} level.` : "Balances your weaker areas with a short, achievable practice block.", status: "not_started", xp: question.xp })) };
}

export function nextDifficulty(current, accuracy) {
  const rank = difficultyRank[current] || 1;
  if (accuracy >= 85 && rank < 3) return Object.keys(difficultyRank).find(key => difficultyRank[key] === rank + 1);
  if (accuracy < 45 && rank > 1) return Object.keys(difficultyRank).find(key => difficultyRank[key] === rank - 1);
  return current;
}