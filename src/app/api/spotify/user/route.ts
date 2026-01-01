import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * Gets current Spotify user info
 */
export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("spotify_access_token")?.value;
  const userCookie = cookieStore.get("spotify_user")?.value;

  if (!accessToken) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }

  try {
    // Verify token is still valid by fetching user profile
    const profileResponse = await fetch("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!profileResponse.ok) {
      // Token might be expired
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    const profile = await profileResponse.json();
    const user = userCookie ? JSON.parse(userCookie) : null;

    return NextResponse.json({
      authenticated: true,
      user: {
        id: profile.id,
        display_name: profile.display_name || profile.id,
        email: profile.email,
        image: profile.images?.[0]?.url,
      },
      cachedUser: user,
    });
  } catch (error) {
    console.error("Error fetching Spotify user:", error);
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
}

