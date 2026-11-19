import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AuthPage from "./AuthPage";

beforeEach(() => { global.fetch = jest.fn(); });

test("validates email and preserves it after a failed login", async () => {
  render(<AuthPage onLogin={jest.fn()} />);
  fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "invalid" } });
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
  expect(screen.getByRole("alert")).toHaveTextContent("valid email");
  expect(screen.getByLabelText("Email address")).toHaveValue("invalid");
});

test("toggles password visibility and shows loading state", async () => {
  global.fetch.mockReturnValue(new Promise(() => {}));
  render(<AuthPage onLogin={jest.fn()} />);
  const password = screen.getByLabelText("Password");
  fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "person@example.com" } });
  fireEvent.change(password, { target: { value: "password123" } });
  fireEvent.click(screen.getByRole("button", { name: "Show password" }));
  expect(password).toHaveAttribute("type", "text");
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
  await waitFor(() => expect(screen.getAllByRole("button").find(button => button.type === "submit")).toBeDisabled());
});

test("forgot password uses an enumeration-safe confirmation", async () => {
  global.fetch.mockResolvedValue({ ok: true, json: async () => ({}) });
  render(<AuthPage onLogin={jest.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "Forgot password?" }));
  fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "person@example.com" } });
  fireEvent.click(screen.getByRole("button", { name: "Send recovery email" }));
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("If an account matches"));
});

test("uses the demo account when the backend returns a 401", async () => {
  const onLogin = jest.fn();
  global.fetch.mockResolvedValue({
    ok: false,
    status: 401,
    json: async () => ({ error: "Invalid email or password" }),
  });

  render(<AuthPage onLogin={onLogin} />);
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

  await waitFor(() => expect(onLogin).toHaveBeenCalledWith(expect.objectContaining({ email: "student@intellihire.com", role: "student" })));
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

test("uses the demo account when the backend is unreachable", async () => {
  const onLogin = jest.fn();
  global.fetch.mockRejectedValue(new TypeError("Failed to fetch"));

  render(<AuthPage onLogin={onLogin} />);
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

  await waitFor(() => expect(onLogin).toHaveBeenCalledWith(expect.objectContaining({ email: "student@intellihire.com", role: "student" })));
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

test("shows a backend error when authentication service is unreachable", async () => {
  const onLogin = jest.fn();
  global.fetch.mockRejectedValue(new TypeError("Failed to fetch"));

  render(<AuthPage onLogin={onLogin} />);
  fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "person@example.com" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Backend is offline"));
  expect(onLogin).not.toHaveBeenCalled();
});
