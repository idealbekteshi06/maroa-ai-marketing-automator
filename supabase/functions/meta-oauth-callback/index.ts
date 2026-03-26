import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, redirect_uri } = await req.json();

    if (!code || !redirect_uri) {
      return new Response(JSON.stringify({ error: "Missing code or redirect_uri" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const META_APP_ID = "1455056152668725";
    const META_APP_SECRET = Deno.env.get("META_APP_SECRET");
    if (!META_APP_SECRET) {
      return new Response(JSON.stringify({ error: "META_APP_SECRET not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Exchange code for access token
    const tokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(redirect_uri)}&client_secret=${META_APP_SECRET}&code=${encodeURIComponent(code)}`;
    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      console.error("Token exchange error:", tokenData.error);
      return new Response(JSON.stringify({ error: tokenData.error.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const shortLivedToken = tokenData.access_token;

    // Exchange for long-lived token
    const longLivedUrl = `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&fb_exchange_token=${shortLivedToken}`;
    const longLivedRes = await fetch(longLivedUrl);
    const longLivedData = await longLivedRes.json();

    const accessToken = longLivedData.access_token || shortLivedToken;

    // Get user's Facebook pages
    const pagesRes = await fetch(`https://graph.facebook.com/v21.0/me/accounts?access_token=${accessToken}`);
    const pagesData = await pagesRes.json();

    let pageId = null;
    let pageAccessToken = accessToken;
    let instagramAccountId = null;

    if (pagesData.data && pagesData.data.length > 0) {
      const page = pagesData.data[0]; // Use first page
      pageId = page.id;
      pageAccessToken = page.access_token || accessToken;

      // Get Instagram Business Account linked to this page
      const igRes = await fetch(
        `https://graph.facebook.com/v21.0/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`
      );
      const igData = await igRes.json();
      instagramAccountId = igData.instagram_business_account?.id || null;
    }

    return new Response(
      JSON.stringify({
        access_token: pageAccessToken,
        page_id: pageId,
        instagram_account_id: instagramAccountId,
        pages: pagesData.data || [],
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Meta OAuth error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
