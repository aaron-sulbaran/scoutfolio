import { auth } from "@/auth";
import { peekLimit, type LimiterKey } from "@/lib/rate-limit";

export const runtime = "nodejs";

const SURFACE_KEYS: LimiterKey[] = [
  "extractResume",
  "extractUrl",
  "extractGithub",
  "discover",
  "generate",
  "edit",
];

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return new Response("Unauthorized", { status: 401 });
  }
  const id = session.user.email;
  const entries = await Promise.all(
    SURFACE_KEYS.map(async (key) => [key, await peekLimit(key, id)] as const)
  );
  const data = Object.fromEntries(entries);
  return Response.json(data, {
    headers: { "cache-control": "no-store" },
  });
}
