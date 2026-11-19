import { parseResume } from "./parser";
import { scoreResume } from "./scorer";

const studentResume = `Asha Rao\nasha@example.com | +91 9876543210 | linkedin.com/in/asharao\n\nPROFESSIONAL SUMMARY\nComputer science student focused on frontend development.\n\nTECHNICAL SKILLS\nReact, JavaScript, HTML, CSS, Git\n\nACADEMIC BACKGROUND\nB.Tech Computer Science, VTU, 2025\n\nPROJECTS\nCampusConnect | 2024 - 2025\nBuilt a React portal used by 300 students and reduced search time by 40%.`;

const experiencedResume = `Ravi Kumar\nravi@example.com | +1 555 555 5555 | github.com/ravik\n\nPROFILE\nBackend engineer with 6 years building scalable APIs.\n\nEMPLOYMENT HISTORY\nSenior Software Engineer at Acme | 2021 - Present\nLed Node.js services for 2M users and reduced latency by 35%.\nSoftware Engineer at Beta | 2018 - 2021\nImplemented REST APIs and automated 12 deployments.\n\nEDUCATION\nB.E. Computer Science, 2018\n\nCERTIFICATIONS\nAWS Certified Developer`;

test("parses a real student resume and scores project evidence", () => {
  const result = scoreResume(parseResume(studentResume), 98);
  expect(result.candidate.name).toBe("Asha Rao");
  expect(result.parsedData.skills).toEqual(expect.arrayContaining(["React", "JavaScript"]));
  expect(result.sections.projects).toBe(true);
  expect(result.scores.overall).not.toBe(70);
  expect(result.scores.experience.earned).toBeGreaterThan(0);
});

test("parses experienced work history, dates, titles, and companies", () => {
  const result = scoreResume(parseResume(experiencedResume), 95);
  expect(result.sections.experience).toBe(true);
  expect(result.parsedData.experience[0].dates).toMatch(/2021/);
  expect(result.parsedData.experience[0].company).toMatch(/Acme/);
  expect(result.scores.achievements.earned).toBe(10);
});

test("does not invent missing contact details", () => {
  const parsed = parseResume("Jordan Lee\n\nPROJECTS\nBuilt a Python tool.");
  const result = scoreResume(parsed, 90);
  expect(result.candidate.email).toBeNull();
  expect(result.candidate.phone).toBeNull();
  expect(result.candidate.links).toEqual([]);
  expect(result.scores.contact.earned).toBe(0);
});

test("does not claim job keyword relevance without a job description", () => {
  const result = scoreResume(parseResume(studentResume), 98);
  expect(result.keywords.missingForJobDescription).toEqual([]);
});

test("separates missing job keywords when a description is supplied", () => {
  const result = scoreResume(parseResume(studentResume), 98, "React Kubernetes platform engineer");
  expect(result.keywords.missingForJobDescription).toContain("kubernetes");
});

test("unreliable OCR confidence is visible and never produces a default score", () => {
  const result = scoreResume(parseResume("Unreadable fragments"), 10);
  expect(result.extraction.confidence).toBe(10);
  expect(result.analysisStatus).toBe("unreliable");
  expect(result.scores.overall).not.toBe(70);
});
