import { auth } from "@/auth";
import { put } from "@vercel/blob";
import {
  enforceLimit,
  rateLimitedResponse,
  rateLimitMessage,
} from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 30;

// Server-side upload: client POSTs multipart/form-data with the PDF, we
// upload to Vercel Blob via put() and return the URL. Simpler than the
// client SDK + signed-token flow and easier to debug locally.
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return new Response("Unauthorized", { status: 401 });
  }

  const limit = await enforceLimit("upload", session.user.email);
  if (!limit.ok) {
    return rateLimitedResponse(
      limit,
      rateLimitMessage("upload", limit.resetMs)
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (err) {
    console.error("[blob-upload] formData parse failed:", err);
    return new Response("Invalid form data", { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return new Response("Missing file", { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return new Response(`Unsupported file type: ${file.type}`, { status: 415 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return new Response("File too large (max 5 MB)", { status: 413 });
  }

  try {
    const blob = await put(file.name, file, {
      access: "private",
      addRandomSuffix: true,
      contentType: "application/pdf",
    });
    return Response.json(
      { url: blob.url, pathname: blob.pathname },
      { headers: limit.headers }
    );
  } catch (err) {
    console.error("[blob-upload] put() failed:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
