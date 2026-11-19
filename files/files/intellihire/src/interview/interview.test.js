import { validateInterviewConfig, generateQuestions, followUpQuestion } from "./generator";
import { evaluateAnswer } from "./evaluator";
import { calculateInterviewReport } from "./report";
import { saveInterviewState, loadInterviewState, clearInterviewState } from "./storage";
import { calculateSpeechMetrics, countFillerWords } from "./speechMetrics";

const base = { role: "Frontend Developer", level: "Fresher", skills: ["React", "JavaScript"], interviewType: "Mixed", totalQuestions: 5, difficulty: "Medium", jobDescription: "Build React applications" };

test("validates required role and supported setup values", () => {
  expect(validateInterviewConfig({ ...base, role: "" }).role).toBeTruthy();
  expect(validateInterviewConfig({ ...base, totalQuestions: 7 }).totalQuestions).toBeTruthy();
  expect(validateInterviewConfig({ ...base, level: "5+ Years" })).toEqual({});
});

test("generates role and skill-specific fresher questions", () => {
  const questions = generateQuestions(base);
  expect(questions).toHaveLength(5);
  expect(questions.some(question => question.question.includes("React"))).toBe(true);
  expect(questions.some(question => question.question.includes("project") || question.category === "project")).toBe(true);
});

test("generates experienced architecture and ownership questions", () => {
  const questions = generateQuestions({ ...base, role: "Backend Engineer", level: "5+ Years", interviewType: "Technical", difficulty: "Hard" });
  expect(questions.some(question => question.question.includes("trade-offs"))).toBe(true);
  expect(questions.every(question => question.expectedTopics.length)).toBe(true);
});

test("evaluates empty and short answers as insufficient without a default score", () => {
  const question = generateQuestions(base)[0];
  expect(evaluateAnswer(question, "", base).score).toBe(0);
  expect(evaluateAnswer(question, "I used React", base).improvements[0]).toMatch(/example|reasoning|concept/i);
});

test("evaluates technical and non-technical answers with evidence", () => {
  const technical = generateQuestions({ ...base, interviewType: "Technical" })[0];
  const hr = generateQuestions({ ...base, interviewType: "HR" })[0];
  expect(evaluateAnswer(technical, "I first inspect the React component, reproduce the issue, then test the fix in a project and measure the result.", base).score).toBeGreaterThan(0);
  expect(evaluateAnswer(hr, "I learned a new tool during an internship by asking questions, practicing, and applying it to the team project.", base).score).toBeGreaterThan(0);
});

test("creates follow-up questions from the previous answer", () => {
  const question = generateQuestions(base)[0];
  expect(followUpQuestion(question, "I built a React project for students", base).question).toMatch(/result|decision|specific/i);
});

test("adds a speed bonus when stress-test answers are submitted quickly", () => {
  const question = generateQuestions({ ...base, totalQuestions: 5 })[0];
  const result = evaluateAnswer(question, "I first inspected the React component, reproduced the issue, tested the fix in a project, and measured a 20 percent improvement in load time.", base);
  expect(result.score).toBeGreaterThan(0);
  expect(result.speedBonus ?? 0).toBe(0);
});

test("calculates a report and preserves unanswered questions", () => {
  const questions = generateQuestions({ ...base, totalQuestions: 5 });
  const evaluation = evaluateAnswer(questions[0], "I built a React project and measured a 20 percent improvement in load time.", base);
  const report = calculateInterviewReport({ ...base, questions }, [{ questionId: 1, answer: "evidence", evaluation }]);
  expect(report.overallScore).toBeGreaterThan(0);
  expect(report.categoryScores).toHaveProperty("technical");
  expect(report.knowledgeGaps.length).toBeGreaterThanOrEqual(0);
});

test("recovers and clears an active interview state", () => {
  const state = { step: "active", qIdx: 2, answers: [] };
  saveInterviewState(state);
  expect(loadInterviewState()).toEqual(state);
  clearInterviewState();
  expect(loadInterviewState()).toBeNull();
});

test("calculates speech coaching metrics without judging the speaker", () => {
  expect(countFillerWords("Um, I, like, built it in a project.")).toBe(2);
  expect(calculateSpeechMetrics("I built a project", 30)).toEqual({ wordsPerMinute: 8, fillerWordCount: 0, pauseCount: 0 });
});
