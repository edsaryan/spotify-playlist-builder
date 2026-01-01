import { NextResponse } from "next/server";

/**
 * Initiates Spotify OAuth flow
 * Redirects user to Spotify authorization page
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const callbackUrl = searchParams.get("callback") || "/";

  // Spotify OAuth configuration
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI || `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/spotify/callback`;
  
  if (!clientId) {
    return NextResponse.json(
      { error: "Spotify Client ID not configured. Please add SPOTIFY_CLIENT_ID to your environment variables." },
      { status: 500 }
    );
  }

  // Generate state for CSRF protection
  const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  
  // Store state in a cookie (in production, use a proper session store)
  const response = NextResponse.redirect(
    `https://accounts.spotify.com/authorize?` +
    `client_id=${encodeURIComponent(clientId)}&` +
    `response_type=code&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `scope=${encodeURIComponent("user-read-private user-read-email playlist-modify-public playlist-modify-private user-top-read")}&` +
    `state=${state}&` +
    `show_dialog=false`
  );
  
  // Store state and callback URL in cookies
  response.cookies.set("spotify_oauth_state", state, { httpOnly: true, maxAge: 600 });
  response.cookies.set("spotify_oauth_callback", callbackUrl, { httpOnly: true, maxAge: 600 });
  
  return response;
}

