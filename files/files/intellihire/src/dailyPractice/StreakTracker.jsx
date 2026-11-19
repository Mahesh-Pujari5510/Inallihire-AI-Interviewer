import React from "react";

export default function StreakTracker({ performance, completed, goal }) {
  const weekly = Math.min(100, Math.round((completed / Math.max(goal, 1)) * 100));
  return <div className="daily-stats-grid" aria-label="Practice progress"><div><span>Current streak</span><strong>{performance.streak || 0}<small> days</small></strong></div><div><span>Longest streak</span><strong>{performance.longestStreak || 0}<small> days</small></strong></div><div><span>Weekly goal</span><strong>{weekly}%</strong></div><div><span>XP earned</span><strong>{performance.xp || 0}</strong></div></div>;
}