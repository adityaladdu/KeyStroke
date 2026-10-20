import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fields = {
  apiKey: "KEYSTROKE_FIREBASE_API_KEY",
  authDomain: "KEYSTROKE_FIREBASE_AUTH_DOMAIN",
  projectId: "KEYSTROKE_FIREBASE_PROJECT_ID",
  appId: "KEYSTROKE_FIREBASE_APP_ID",
};
const missing = Object.values(fields).filter(
  (name) => !process.env[name]?.trim(),
);

if (missing.length) {
  throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
}

const config = Object.fromEntries(
  Object.entries(fields).map(([field, name]) => [field, process.env[name].trim()]),
);
const source = `// Generated during the Vercel build. Do not commit this file.\nexport default ${JSON.stringify(config, null, 2)};\n`;

await writeFile(resolve(root, "firebase-config.js"), source, "utf8");
console.log("Generated firebase-config.js from the configured environment variables.");
