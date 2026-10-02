export interface AppSettings {
  github: { connected: boolean; username: string; repositories: { name: string; connected: boolean }[] };
  ai: { provider: string; model: string; responseStyle: "Concise" | "Balanced" | "Detailed" };
  theme: "light" | "dark" | "system";
  autoRefresh: { enabled: boolean; intervalMinutes: number };
  voice: { enabled: boolean; wakeWord: string; voice: string; speed: number; autoplay: boolean };
  notifications: { email: boolean; push: boolean; slack: boolean; events: Record<string, boolean>; quietFrom: string; quietTo: string };
  language: { interface: string; response: string };
  export: { automatic: boolean; frequency: "Daily" | "Weekly" | "Monthly"; pdf: boolean; csv: boolean; destination: string };
  profile: { displayName: string; username: string; role: string; timezone: string; email: string };
}

export const defaultSettings: AppSettings = {
  github: { connected: true, username: "durgamohan06", repositories: [{ name: "auth-module", connected: true }, { name: "dashboard-ui", connected: true }, { name: "ai-engine", connected: false }] },
  ai: { provider: "OpenAI", model: "GPT-5.6 Luna", responseStyle: "Balanced" },
  theme: "system",
  autoRefresh: { enabled: false, intervalMinutes: 60 },
  voice: { enabled: true, wakeWord: "GitInsight", voice: "Samantha", speed: 1, autoplay: false },
  notifications: { email: true, push: true, slack: true, events: { repository: true, issues: true, reviews: true, reports: true, summary: false }, quietFrom: "22:00", quietTo: "08:00" },
  language: { interface: "English (US)", response: "English" },
  export: { automatic: false, frequency: "Weekly", pdf: true, csv: true, destination: "Local download" },
  profile: { displayName: "Durga Rao", username: "durgamohan06", role: "Project Manager", timezone: "Asia/Kolkata", email: "durga@example.com" },
};

const key = "gitinsight-settings";
export function loadSettings(): AppSettings { if (typeof window === "undefined") return defaultSettings; try { const stored = JSON.parse(localStorage.getItem(key) || "{}"); return { ...defaultSettings, ...stored, autoRefresh: { ...defaultSettings.autoRefresh, ...(stored.autoRefresh || {}) } }; } catch { return defaultSettings; } }
export function saveSettings(settings: AppSettings) { if (typeof window !== "undefined") localStorage.setItem(key, JSON.stringify(settings)); }
export function applyTheme(theme: AppSettings["theme"]) {
  if (typeof document === "undefined") return;
  const dark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.dataset.theme = theme;
  window.dispatchEvent(new CustomEvent("gitinsight-theme-change", { detail: theme }));
}
export function saveTheme(theme: AppSettings["theme"]) {
  const settings = loadSettings();
  saveSettings({ ...settings, theme });
  applyTheme(theme);
}
