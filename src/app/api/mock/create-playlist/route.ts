import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const playlistName = String(body?.playlistName ?? "").trim();
  const tracks = Array.isArray(body?.tracks) ? body.tracks : [];

  if (!playlistName) {
    return NextResponse.json({ error: "Missing playlistName" }, { status: 400 });
  }
  if (tracks.length === 0) {
    return NextResponse.json({ error: "No tracks to add" }, { status: 400 });
  }

  // Fake a Spotify playlist id + URL.
  const id = `mock_${Math.random().toString(16).slice(2)}`;
  const url = `https://open.spotify.com/playlist/${id}`;

  return NextResponse.json({
    id,
    url,
    playlistName,
    trackCount: tracks.length,
  });
}
