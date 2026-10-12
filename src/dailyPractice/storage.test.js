import { applyCompletion, emptyPracticeState, todayKey } from "./storage";

test("streak waits for the daily minimum and respects day boundaries", () => {
  const firstDay = new Date("2026-09-01T09:00:00");
  let state = applyCompletion(emptyPracticeState, { date: firstDay, questionId: "a", topic: "Arrays", correct: true, xp: 20, dailyGoalComplete: false });
  expect(state.performance.streak).toBe(0);
  state = applyCompletion(state, { date: firstDay, questionId: "b", topic: "Arrays", correct: false, xp: 10, dailyGoalComplete: true });
  expect(state.performance.streak).toBe(1);
  state = applyCompletion(state, { date: new Date("2026-09-02T09:00:00"), questionId: "c", topic: "SQL joins", correct: true, xp: 20, dailyGoalComplete: true });
  expect(state.performance.streak).toBe(2);
  expect(todayKey(new Date("2026-09-02T23:59:59"))).toBe("2026-09-02");
});

test("incorrect answers enter review and correct answers remove them", () => {
  let state = applyCompletion(emptyPracticeState, { questionId: "q1", topic: "SQL joins", correct: false, dailyGoalComplete: false });
  expect(state.performance.reviewLater).toHaveLength(1);
  state = applyCompletion(state, { date: new Date("2026-09-02T09:00:00"), questionId: "q1", topic: "SQL joins", correct: true, dailyGoalComplete: false });
  expect(state.performance.reviewLater).toHaveLength(0);
});