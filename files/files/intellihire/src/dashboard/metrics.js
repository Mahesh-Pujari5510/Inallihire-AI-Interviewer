export function calculateDashboardMetrics(sessions = []) {
  const completed = sessions.filter(session => Number.isFinite(Number(session.score)) && session.status !== "in-progress");
  const scores = completed.map(session => Number(session.score));
  const average = scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : null;
  const best = scores.length ? Math.max(...scores) : null;
  const readiness = average;
  const recent = completed.filter(session => Date.now() - new Date(session.completedAt || session.date).getTime() <= 7 * 86400000);
  const previous = completed.filter(session => { const age = Date.now() - new Date(session.completedAt || session.date).getTime(); return age > 7 * 86400000 && age <= 14 * 86400000; });
  const change = recent.length && previous.length ? Math.round(recent.reduce((a, s) => a + Number(s.score), 0) / recent.length - previous.reduce((a, s) => a + Number(s.score), 0) / previous.length) : null;
  const skillScores = {};
  completed.forEach(session => (session.skills || []).forEach(skill => { skillScores[skill] = skillScores[skill] || []; skillScores[skill].push(Number(session.score)); }));
  const skills = Object.entries(skillScores).map(([name, values]) => ({ name, score: Math.round(values.reduce((a, b) => a + b, 0) / values.length), count: values.length })).sort((a, b) => b.score - a.score);
  return { total: completed.length, average, best, readiness, change, skills, recent: completed.slice().sort((a, b) => new Date(b.completedAt || b.date) - new Date(a.completedAt || a.date)) };
}

export function trendForRange(sessions = [], days = 7) {
  const cutoff = Date.now() - days * 86400000;
  return sessions.filter(session => new Date(session.completedAt || session.date).getTime() >= cutoff && Number.isFinite(Number(session.score))).sort((a, b) => new Date(a.completedAt || a.date) - new Date(b.completedAt || b.date)).map(session => ({ date: new Date(session.completedAt || session.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }), score: Number(session.score) }));
}

export function readinessLabel(score) {
  if (score === null) return "Not started";
  if (score < 45) return "Beginner";
  if (score < 70) return "Building";
  if (score < 85) return "Interview Ready";
  return "Strong Candidate";
}
