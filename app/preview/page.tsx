import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PreviewClient } from "@/components/preview/preview-client";

export default async function PreviewPage() {
  const session = await auth();
  if (!session) {
    redirect("/");
  }

  return <PreviewClient />;
}
