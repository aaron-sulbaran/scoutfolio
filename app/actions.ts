"use server";

import { redirect } from "next/navigation";
import { signIn, signOut, unstable_update } from "@/auth";

export async function signInWithGoogle() {
  await signIn("google", { redirectTo: "/start" });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
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
  redirect("/settings?saved=narrative");
}

export async function updateDisplayName(formData: FormData) {
  const raw = formData.get("displayName");
  const displayName = typeof raw === "string" ? raw.trim().slice(0, 60) : "";
  await unstable_update({
    displayName,
  } as unknown as Parameters<typeof unstable_update>[0]);
  redirect(displayName ? "/settings?saved=name" : "/settings?saved=name-cleared");
}

export async function connectGitHub() {
  if (!process.env.AUTH_GITHUB_ID || !process.env.AUTH_GITHUB_SECRET) {
    redirect("/connect?error=github-not-configured");
  }
  await signIn("github", { redirectTo: "/connect" });
}

export async function disconnectGitHub() {
  await unstable_update({
    githubToken: "",
    githubLogin: "",
  } as unknown as Parameters<typeof unstable_update>[0]);
  redirect("/connect");
}
