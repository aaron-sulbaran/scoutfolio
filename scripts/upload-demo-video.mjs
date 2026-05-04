// Upload the demo walkthrough to Vercel Blob as a PUBLIC file and print the URL.
// Usage:
//   pnpm upload-demo-video [path]
// Default path: public/demo/ScoutFolio-Walkthrough.mov
//
// Requires BLOB_READ_WRITE_TOKEN in .env.local (already set in this project).

import { createReadStream, statSync } from "node:fs";
import { basename, resolve } from "node:path";
import { put } from "@vercel/blob";

async function loadEnv() {
  try {
    const fs = await import("node:fs/promises");
    const txt = await fs.readFile(".env.local", "utf8");
    for (const line of txt.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (!m) continue;
      const key = m[1];
      let val = m[2];
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // ignore — token may already be in env
  }
}

await loadEnv();

// Prefer a public-store token if provided, fall back to default token.
const token =
  process.env.DEMO_BLOB_READ_WRITE_TOKEN ||
  process.env.BLOB_READ_WRITE_TOKEN_PUBLIC ||
  process.env.BLOB_READ_WRITE_TOKEN;

if (!token) {
  console.error(
    "Missing token. Run `vercel env pull .env.local` first, or set DEMO_BLOB_READ_WRITE_TOKEN."
  );
  process.exit(1);
}

const inputPath = resolve(
  process.argv[2] ?? "public/demo/ScoutFolio-Walkthrough.mov"
);
const stats = statSync(inputPath);
const sizeMb = (stats.size / (1024 * 1024)).toFixed(1);
const ext = inputPath.toLowerCase().endsWith(".mp4")
  ? "mp4"
  : inputPath.toLowerCase().endsWith(".webm")
    ? "webm"
    : "mov";
const contentType =
  ext === "mp4" ? "video/mp4" : ext === "webm" ? "video/webm" : "video/quicktime";

console.log(`Uploading ${basename(inputPath)} (${sizeMb} MB) as ${contentType}...`);

const stream = createReadStream(inputPath);
const blob = await put(`demo/${basename(inputPath)}`, stream, {
  access: "public",
  contentType,
  addRandomSuffix: true,
  multipart: true,
  token,
});

console.log("\nDone. Public URL:");
console.log(blob.url);
console.log("\nNext steps:");
console.log(
  "  1) vercel env add NEXT_PUBLIC_DEMO_WALKTHROUGH_URL production"
);
console.log("     (paste the URL above when prompted)");
console.log("  2) repeat for `preview` and `development` if you want it there too");
console.log("  3) vercel deploy --prod --yes");
