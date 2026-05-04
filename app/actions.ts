"use server";

import { redirect } from "next/navigation";
import { signIn, signOut, unstable_update, auth } from "@/auth";
import { patchProfile } from "@/lib/profiles";
import { removeGithub } from "@/lib/workspace";

export async function signInWithGoogle() {
  await signIn("google", { redirectTo: "/start" });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

async function currentEmail(): Promise<string | null> {
  const session = await auth();
  return session?.user?.email ?? null;
}

export async function saveNarrative(formData: FormData) {
  const raw = formData.get("narrative");
  const onboardingNarrative =
    typeof raw === "string" ? raw.trim().slice(0, 500) : "";
  if (!onboardingNarrative) {
    redirect("/start?error=empty");
  }
  await unstable_update({
    onboardingNarrative,
  } as unknown as Parameters<typeof unstable_update>[0]);
  const email = await currentEmail();
  if (email) await patchProfile(email, { onboardingNarrative });
  redirect("/connect");
}

export async function updateNarrative(formData: FormData) {
  const raw = formData.get("narrative");
  const onboardingNarrative =
    typeof raw === "string" ? raw.trim().slice(0, 500) : "";
  if (!onboardingNarrative) {
    redirect("/settings?error=narrative-empty");
  }
  await unstable_update({
    onboardingNarrative,
  } as unknown as Parameters<typeof unstable_update>[0]);
  const email = await currentEmail();
  if (email) await patchProfile(email, { onboardingNarrative });
  redirect("/settings?saved=narrative");
}

export async function updateDisplayName(formData: FormData) {
  const raw = formData.get("displayName");
  const displayName = typeof raw === "string" ? raw.trim().slice(0, 60) : "";
  await unstable_update({
    displayName,
  } as unknown as Parameters<typeof unstable_update>[0]);
  const email = await currentEmail();
  if (email) await patchProfile(email, { displayName });
  redirect(displayName ? "/settings?saved=name" : "/settings?saved=name-cleared");
}

export async function connectGitHub() {
  if (!process.env.AUTH_GITHUB_ID || !process.env.AUTH_GITHUB_SECRET) {
    redirect("/connect?error=github-not-configured");
  }
  await signIn("github", { redirectTo: "/connect" });
}

export async function disconnectGitHub() {
  // Wipe everything: live OAuth token on the JWT, persisted login in the
  // profile, and any saved github findings in the workspace. This is the
  // user's "forget about my GitHub entirely" affordance.
  await unstable_update({
    githubToken: "",
    githubLogin: "",
  } as unknown as Parameters<typeof unstable_update>[0]);
  const email = await currentEmail();
  if (email) {
    await Promise.all([
      patchProfile(email, { githubLogin: "" }),
      removeGithub(email),
    ]);
  }
  redirect("/connect");
}
