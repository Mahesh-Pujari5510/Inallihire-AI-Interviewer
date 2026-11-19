import { buildDailyPlan, nextDifficulty, recommendQuestions } from "./RecommendationEngine";

test("new users receive a role-based baseline without invented performance", () => {
  const plan = buildDailyPlan({ profile: { name: "Asha", role: "Frontend Developer", level: "Fresher", skills: ["React"] }, performance: {}, history: [] });
  expect(plan.goalCount).toBeGreaterThanOrEqual(3);
  expect(plan.completedCount).toBe(0);
  expect(plan.tasks.some(task => task.topic === "Arrays" || task.topic === "Technical explanation")).toBe(true);
});

test("recommendations prioritize review topics and avoid recent repeats", () => {
  const questions = recommendQuestions({ profile: { role: "Backend Engineer", skills: ["SQL"] }, performance: { accuracyByTopic: { "SQL joins": 40 }, reviewLater: [{ questionId: "sql-joins-1", topic: "SQL joins" }] }, history: [{ questionId: "sql-joins-1" }] });
  expect(questions[0].topic).toBe("SQL joins");
  expect(questions.filter(question => question.id === "sql-joins-1")).toHaveLength(0);
});

test("difficulty changes only at sustained-looking thresholds", () => {
  expect(nextDifficulty("medium", 90)).toBe("hard");
  expect(nextDifficulty("medium", 40)).toBe("easy");
  expect(nextDifficulty("medium", 70)).toBe("medium");
});