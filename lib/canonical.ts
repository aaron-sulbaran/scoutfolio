// Pure URL canonicalization helper. Lives outside lib/workspace so client
// components can import it without pulling the Upstash client into the
// browser bundle. The rule is: lowercase host, drop www., strip trailing
// slash, drop tracking query params, drop hash. Used to dedupe user-submitted
// URLs both client-side (before adding a slot) and server-side (in upsert).

export function canonicalizeUrl(input: string): string {
  try {
    const u = new URL(input);
    u.hostname = u.hostname.toLowerCase().replace(/^www\./, "");
    u.protocol = u.protocol.toLowerCase();
    if (u.pathname.length > 1 && u.pathname.endsWith("/")) {
      u.pathname = u.pathname.replace(/\/+$/, "");
    }
    const drop = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "ref",
      "ref_src",
      "fbclid",
      "gclid",
    ];
    drop.forEach((k) => u.searchParams.delete(k));
    u.hash = "";
    return u.toString();
  } catch {
    return input.trim().toLowerCase();
  }
}
