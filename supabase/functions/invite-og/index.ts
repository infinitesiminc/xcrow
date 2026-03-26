import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SITE = "https://xcrow.ai";
const OG_IMAGE = `${SITE}/og-invite.jpg`;

serve((req) => {
  const url = new URL(req.url);
  const ref = url.searchParams.get("ref") || "";
  const ctx = url.searchParams.get("ctx") || "";

  const title = ctx
    ? `I just ${ctx} on Xcrow.ai — join my squad! 🏰`
    : "Join my squad on Xcrow.ai — the AI career game 🏰";
  const desc =
    "183 future skills. Boss battles. Territory quests. Sign up and we both get a free Champion month.";
  const authUrl = `${SITE}/auth${ref ? `?ref=${encodeURIComponent(ref)}` : ""}`;

  const html = `<!DOCTYPE html><html><head>
<meta charset="utf-8">
<title>${esc(title)}</title>
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(authUrl)}">
<meta property="og:site_name" content="Xcrow.ai">
<meta property="og:image" content="${OG_IMAGE}">
<meta property="og:image:secure_url" content="${OG_IMAGE}">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@xcrowai">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${OG_IMAGE}">
<meta http-equiv="refresh" content="0;url=${esc(authUrl)}">
</head><body><p>Redirecting to <a href="${esc(authUrl)}">Xcrow.ai</a>…</p></body></html>`;

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
});

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
