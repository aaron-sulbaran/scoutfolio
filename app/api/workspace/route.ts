import { auth } from "@/auth";
import {
  getWorkspace,
  removeGithub,
  removeResume,
  removeUrl,
} from "@/lib/workspace";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return new Response("Unauthorized", { status: 401 });
  }
  const ws = await getWorkspace(session.user.email);
  return Response.json(ws);
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return new Response("Unauthorized", { status: 401 });
  }
  const url = new URL(req.url);
  const source = url.searchParams.get("source");
  const id = url.searchParams.get("id");

  let ws;
  if (source === "resume") {
    ws = await removeResume(session.user.email);
  } else if (source === "github") {
    ws = await removeGithub(session.user.email);
  } else if (source === "url") {
    if (!id) return new Response("Missing id", { status: 400 });
    ws = await removeUrl(session.user.email, id);
  } else {
    return new Response("Invalid source", { status: 400 });
  }
  return Response.json(ws);
}
