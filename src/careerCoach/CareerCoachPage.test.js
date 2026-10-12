import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import CareerCoachPage from "./CareerCoachPage";
import { apiRequest } from "../api";

jest.mock("../api", () => ({ apiRequest: jest.fn() }));

const dashboard = { profile: { targetRole: "Frontend Developer", experienceLevel: "Fresher", primarySkills: ["React"] }, metrics: { weakSkills: ["SQL joins"], strongSkills: ["React"], resumeScore: 76, placementReadiness: 64, averageInterviewScore: 72, dailyStreak: 3, savedCompanyCount: 1 } };

beforeEach(() => { apiRequest.mockImplementation(path => { if (path === "/api/coach/conversations") return Promise.resolve({ conversations: [] }); if (path === "/api/coach/plans") return Promise.resolve({ plans: [] }); return Promise.resolve({}); }); });

test("shows personalized starter prompts and profile context", async () => {
  render(<CareerCoachPage dashboard={dashboard} nav={jest.fn()} />);
  expect(await screen.findByText(/Frontend Developer interview performance/i)).toBeInTheDocument();
  expect(screen.getByText("SQL joins")).toBeInTheDocument();
  expect(screen.getByText("64%")).toBeInTheDocument();
});

test("creates a conversation and renders structured coach response", async () => {
  let conversationCalls = 0;
  apiRequest.mockImplementation(path => {
    if (path === "/api/coach/conversations") { conversationCalls += 1; return Promise.resolve(conversationCalls === 1 ? { conversations: [] } : { conversation: { _id: "c1", title: "New career chat" } }); }
    if (path === "/api/coach/messages") return Promise.resolve({ message: { _id: "m1", role: "assistant", content: "Practice SQL joins next.", suggestedActions: [{ label: "Practice SQL", type: "daily_practice", payload: { topic: "SQL joins" } }], createdAt: new Date().toISOString() } });
    if (path === "/api/coach/plans") return Promise.resolve({ plans: [] });
    return Promise.resolve({});
  });
  render(<CareerCoachPage dashboard={dashboard} nav={jest.fn()} />);
  fireEvent.click(await screen.findByText(/Explain the SQL joins/i));
  await waitFor(() => expect(screen.getByText("Practice SQL joins next.")).toBeInTheDocument());
  expect(screen.getByText("Practice SQL")).toBeInTheDocument();
});

test("maps network and auth issues to a clear user message", async () => {
  apiRequest.mockRejectedValue({ message: "Unable to connect to the IntelliHire server." });
  render(<CareerCoachPage dashboard={dashboard} nav={jest.fn()} />);
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Unable to connect to the IntelliHire server."));
  expect(screen.getByText("Retry")).toBeInTheDocument();
});

test("shows a retryable API error", async () => {
  apiRequest.mockRejectedValue(new Error("Coach unavailable"));
  render(<CareerCoachPage dashboard={dashboard} nav={jest.fn()} />);
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("AI service is temporarily unavailable."));
  expect(screen.getByText("Retry")).toBeInTheDocument();
});
