const KEY = "intellihire.activeInterview";
export function saveInterviewState(state) { localStorage.setItem(KEY, JSON.stringify(state)); }
export function loadInterviewState() { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } }
export function clearInterviewState() { localStorage.removeItem(KEY); }
