import { calculateDashboardMetrics, readinessLabel, trendForRange } from "./metrics";

test("returns an intentional new-user state", () => {
  expect(calculateDashboardMetrics([])).toMatchObject({ total: 0, average: null, best: null, readiness: null });
  expect(readinessLabel(null)).toBe("Not started");
});

test("calculates real returning-user metrics and supported skills", () => {
  const sessions = [{ score: 80, skills: ["React"], completedAt: new Date().toISOString() }, { score: 60, skills: ["SQL"], completedAt: new Date().toISOString() }];
  const metrics = calculateDashboardMetrics(sessions);
  expect(metrics.average).toBe(70);
  expect(metrics.best).toBe(80);
  expect(metrics.skills.map(skill => skill.name)).toEqual(expect.arrayContaining(["React", "SQL"]));
  expect(trendForRange(sessions, 30)).toHaveLength(2);
});

test("maps readiness labels without fabricated score values", () => {
  expect(readinessLabel(40)).toBe("Beginner");
  expect(readinessLabel(75)).toBe("Interview Ready");
  expect(readinessLabel(90)).toBe("Strong Candidate");
});
