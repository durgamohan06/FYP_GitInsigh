import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let envLoaded = false;

/**
 * Loads .env variables into process.env from the backend root.
 */
export function loadProjectEnv(): void {
  if (envLoaded) return;
  if (typeof process === "undefined" || !process.cwd) return;
  envLoaded = true;

  try {
    // Resolve from both the backend working directory and the compiled module.
    // This keeps local tsx watch and production dist execution consistent.
    const candidates = [
      path.resolve(process.cwd(), ".env"),
      path.resolve(__dirname, "../../.env"),
    ];
    const envPath = candidates.find((candidate) => fs.existsSync(candidate));
    if (!envPath) return;

    const content = fs.readFileSync(envPath, "utf-8");
    const lines = content.split(/\r?\n/);

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const equalIndex = trimmed.indexOf("=");
      if (equalIndex === -1) continue;

      const key = trimmed.slice(0, equalIndex).trim();
      let value = trimmed.slice(equalIndex + 1).trim();

      // Remove surrounding quotes if present
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      // Hosting platforms inject production secrets before the app starts. A
      // developer's .env file must never replace those values.
      if (process.env[key] === undefined || process.env[key] === "") {
        process.env[key] = value;
      }
    }
  } catch (err) {
    console.error("Failed to load .env:", err);
  }
}

/**
 * Gets an environment variable, loading .env if not yet loaded.
 */
export function getEnv(key: string, defaultValue = ""): string {
  loadProjectEnv();
  return process.env[key] || defaultValue;
}

// Automatically load once when module is imported
loadProjectEnv();
