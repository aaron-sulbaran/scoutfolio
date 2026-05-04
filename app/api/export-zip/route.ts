import { auth } from "@/auth";
import JSZip from "jszip";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 30;

const FileSchema = z.object({
  path: z.string(),
  content: z.string(),
});

const RequestSchema = z.object({
  files: z.array(FileSchema),
  projectName: z.string(),
});

function safeName(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "portfolio"
  );
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return new Response("Unauthorized", { status: 401 });
  }

  let parsed;
  try {
    parsed = RequestSchema.parse(await req.json());
  } catch (err) {
    return new Response(
      `Invalid request: ${err instanceof Error ? err.message : String(err)}`,
      { status: 400 }
    );
  }

  const projectName = safeName(parsed.projectName);
  const zip = new JSZip();
  for (const file of parsed.files) {
    if (file.path.includes("..")) continue;
    zip.file(`${projectName}/${file.path}`, file.content);
  }
  // Empty public dir for parity with the layout described in the PRD.
  zip.folder(`${projectName}/public`);

  const buffer = await zip.generateAsync({ type: "nodebuffer" });

  return new Response(new Uint8Array(buffer), {
    headers: {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename="${projectName}.zip"`,
      "cache-control": "no-store",
    },
  });
}
