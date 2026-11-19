const API_URL = process.env.REACT_APP_API_URL || window.location.origin;

function normalizeApiError(error) {
  const message = error?.message || "";

  if (message.includes("Unable to connect") || message.includes("Failed to fetch") || message.includes("NetworkError") || /fetch/i.test(message)) {
    return "Unable to connect to the IntelliHire server.";
  }

  if (message.includes("Not authenticated") || message.includes("Invalid token") || message.includes("expired") || message.includes("Please sign in again")) {
    return "Your session has expired. Please log in again.";
  }

  if (message.includes("GEMINI API key") || message.includes("Gemini API is not configured") || message.includes("Gemini API")) {
    return "Gemini API is not configured.";
  }

  if (message.includes("Too many requests") || message.includes("rate limit")) {
    return "Too many requests. Please wait a moment and try again.";
  }

  if (message.includes("temporarily unavailable") || message.includes("503") || /5\d\d/.test(message)) {
    return "AI service is temporarily unavailable.";
  }

  if (message.includes("Forbidden") || message.includes("Admin access required") || message.includes("not allowed")) {
    return "You do not have permission to do that.";
  }

  if (message.includes("not found") || /4\d\d/.test(message)) {
    return message;
  }

  return "AI service is temporarily unavailable.";
}

export async function apiRequest(path, options = {}) {
  const requestHeaders = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  try {
    const response = await fetch(`${API_URL}${path}`, {
      credentials: "include",
      headers: requestHeaders,
      ...options,
    });

    let data = {};
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      const message = data?.error || `Request failed (${response.status})`;
      throw new Error(normalizeApiError(new Error(message)));
    }

    return data;
  } catch (error) {
    const friendlyMessage = normalizeApiError(error);
    throw new Error(friendlyMessage);
  }
}

export const apiUrl = API_URL;
