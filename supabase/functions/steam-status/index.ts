const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  const apiKey = Deno.env.get("STEAM_API_KEY");
  if (!apiKey) return new Response(JSON.stringify({ error: "Steam API is not configured" }), { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  try {
    const body = await req.json();
    const ids = Array.isArray(body?.steamids) ? [...new Set(body.steamids.map(String).filter((x: string) => /^\d{17}$/.test(x)))].slice(0, 100) : [];
    if (!ids.length) return new Response(JSON.stringify({ players: [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const url = new URL("https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/");
    url.searchParams.set("key", apiKey);
    url.searchParams.set("steamids", ids.join(","));
    const upstream = await fetch(url);
    if (!upstream.ok) throw new Error(`Steam API returned ${upstream.status}`);
    const result = await upstream.json();
    return new Response(JSON.stringify({ players: result?.response?.players ?? [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (_error) {
    return new Response(JSON.stringify({ error: "Unable to retrieve Steam status" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
