import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";

declare module "next-auth" {
  interface Session {
    user: {
      onboardingNarrative?: string;
      displayName?: string;
    } & DefaultSession["user"];
  }
}

type TokenWithExtras = Record<string, unknown> & {
  onboardingNarrative?: string;
  displayName?: string;
};

export const { handlers, signIn, signOut, auth, unstable_update } = NextAuth({
  providers: [Google],
  pages: {
    signIn: "/",
  },
  session: { strategy: "jwt" },
  callbacks: {
    // onboardingNarrative is the free-text the user wrote on /start.
    // displayName is an optional override for the Google profile name.
    // Both live on the JWT so any server route can read via `auth()` without a DB.
    async jwt({ token, trigger, session }) {
      const t = token as TokenWithExtras;
      if (trigger === "update" && session && typeof session === "object") {
        const patch = session as {
          onboardingNarrative?: unknown;
          displayName?: unknown;
        };
        if (typeof patch.onboardingNarrative === "string") {
          t.onboardingNarrative = patch.onboardingNarrative.slice(0, 500);
        }
        if (typeof patch.displayName === "string") {
          const trimmed = patch.displayName.trim().slice(0, 60);
          t.displayName = trimmed.length > 0 ? trimmed : undefined;
        }
      }
      return t;
    },
    async session({ session, token }) {
      const t = token as TokenWithExtras;
      if (session.user) {
        session.user.onboardingNarrative = t.onboardingNarrative;
        session.user.displayName = t.displayName;
      }
      return session;
    },
  },
});
