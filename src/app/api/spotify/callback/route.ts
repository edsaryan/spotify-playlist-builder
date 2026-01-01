import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * Handles Spotify OAuth callback
 * Exchanges authorization code for access token
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`/?error=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    return NextResponse.redirect("/?error=missing_code_or_state");
  }

  const cookieStore = await cookies();
  const storedState = cookieStore.get("spotify_oauth_state")?.value;
  const callbackUrl = cookieStore.get("spotify_oauth_callback")?.value || "/";

  if (!storedState || state !== storedState) {
    return NextResponse.redirect("/?error=invalid_state");
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI || `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/spotify/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect("/?error=server_config_error");
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error("Spotify token error:", errorData);
      return NextResponse.redirect("/?error=token_exchange_failed");
    }

    const tokenData = await tokenResponse.json();

    // Get user profile to display name
    const profileResponse = await fetch("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    let userProfile = null;
    if (profileResponse.ok) {
      userProfile = await profileResponse.json();
    }

    // Store tokens in cookies (in production, use httpOnly cookies and refresh token properly)
    const response = NextResponse.redirect(callbackUrl);
    
    // Store access token and user info
    // In production, you'd want to store these more securely (httpOnly cookies, encrypted)
    response.cookies.set("spotify_access_token", tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: tokenData.expires_in || 3600,
    });

    if (tokenData.refresh_token) {
      response.cookies.set("spotify_refresh_token", tokenData.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365, // 1 year
      });
    }

    if (userProfile) {
      response.cookies.set("spotify_user", JSON.stringify({
        id: userProfile.id,
        display_name: userProfile.display_name,
        email: userProfile.email,
      }), {
        httpOnly: false, // We need this on client for display
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }

    // Clean up OAuth state cookies
    response.cookies.delete("spotify_oauth_state");
    response.cookies.delete("spotify_oauth_callback");

    return response;
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect("/?error=callback_error");
  }
}

