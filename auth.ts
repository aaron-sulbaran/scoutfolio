import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { getProfile, patchProfile } from "@/lib/profiles";

declare module "next-auth" {
  interface Session {
    user: {
      onboardingNarrative?: string;
      displayName?: string;
      githubToken?: string;
      githubLogin?: string;
    } & DefaultSession["user"];
  }
}

type TokenWithExtras = Record<string, unknown> & {
  onboardingNarrative?: string;
  displayName?: string;
  githubToken?: string;
  githubLogin?: string;
};

export const { handlers, signIn, signOut, auth, unstable_update } = NextAuth({
  providers: [
    Google,
    GitHub({
      authorization: {
        params: { scope: "read:user public_repo" },
      },
    }),
  ],
  pages: {
    signIn: "/",
  },
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user, trigger, session, account, profile }) {
      const t = token as TokenWithExtras;

      // On initial sign-in, hydrate persisted profile from Upstash so that a
      // returning user keeps their narrative and display-name preferences
      // across sign-out / sign-in cycles. The `user` param is only present
      // on the very first jwt() call after authentication.
      if (user) {
        const email = (user.email ?? (token.email as string | undefined)) ?? "";
        if (email) {
          const stored = await getProfile(email);
          if (stored) {
            if (stored.onboardingNarrative && !t.onboardingNarrative) {
              t.onboardingNarrative = stored.onboardingNarrative;
            }
            if (stored.displayName && !t.displayName) {
              t.displayName = stored.displayName;
            }
            if (stored.githubLogin && !t.githubLogin) {
              t.githubLogin = stored.githubLogin;
            }
          }
        }
      }

      if (account?.provider === "github" && account.access_token) {
        t.githubToken = account.access_token;
        const ghProfile = profile as { login?: string } | undefined;
        if (ghProfile?.login) {
          t.githubLogin = ghProfile.login;
          // Persist the GitHub handle so future sign-ins remember it even
          // after the user signs out (the access token itself stays JWT-only).
          const persistEmail =
            (user?.email ?? (token.email as string | undefined)) ?? "";
          if (persistEmail) {
            await patchProfile(persistEmail, { githubLogin: ghProfile.login });
          }
        }
      }

      if (trigger === "update" && session && typeof session === "object") {
        const patch = session as {
          onboardingNarrative?: unknown;
          displayName?: unknown;
          githubToken?: unknown;
          githubLogin?: unknown;
        };
        if (typeof patch.onboardingNarrative === "string") {
          t.onboardingNarrative = patch.onboardingNarrative.slice(0, 500);
        }
        if (typeof patch.displayName === "string") {
          const trimmed = patch.displayName.trim().slice(0, 60);
          t.displayName = trimmed.length > 0 ? trimmed : undefined;
        }
        if ("githubToken" in patch) {
          const v = patch.githubToken;
          t.githubToken = typeof v === "string" && v.length > 0 ? v : undefined;
          if (!t.githubToken) t.githubLogin = undefined;
        }
        if ("githubLogin" in patch) {
          const v = patch.githubLogin;
          t.githubLogin = typeof v === "string" && v.length > 0 ? v : undefined;
        }
      }
      return t;
    },
    async session({ session, token }) {
      const t = token as TokenWithExtras;
      if (session.user) {
        session.user.onboardingNarrative = t.onboardingNarrative;
        session.user.displayName = t.displayName;
        session.user.githubToken = t.githubToken;
        session.user.githubLogin = t.githubLogin;
      }
      return session;
    },
    // Allow GitHub to link to an existing Google session: the JWT strategy
    // keeps the original `sub` (Google) on each sign-in attempt; we only
    // need the GitHub access_token onto the same JWT, which the jwt
    // callback above handles. Permit the sign-in unconditionally for
    // GitHub so we don't bounce out of the existing session.
    async signIn({ account }) {
      if (account?.provider === "github") return true;
      return true;
    },
  },
});
