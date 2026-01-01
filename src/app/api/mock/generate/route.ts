import { NextResponse } from "next/server";

type Track = { id: string; title: string; artist: string };

const POOLS: Record<string, Track[]> = {
  rock: [
    { id: "r1", title: "Amp Bloom", artist: "Glass Riffs" },
    { id: "r2", title: "Neon Garage", artist: "The Backline" },
    { id: "r3", title: "Nightdrive Anthem", artist: "Chrome & Ash" },
    { id: "r4", title: "Razor Chorus", artist: "Static Hearts" },
    { id: "r5", title: "Wide Open Sky", artist: "Midwest Moon" },
  ],
  electronic: [
    { id: "e1", title: "Midnight Circuit", artist: "Neon Static" },
    { id: "e2", title: "Soft Focus", artist: "Ambient Avenue" },
    { id: "e3", title: "Voltage Drift", artist: "Low Key Logic" },
    { id: "e4", title: "Rain on Glass", artist: "Nocturne Dept." },
    { id: "e5", title: "Late Compile", artist: "Sine & Coffee" },
  ],
  hiphop: [
    { id: "h1", title: "Lo-Fi Ledger", artist: "Sidechain Poets" },
    { id: "h2", title: "Corner Lights", artist: "Kinetic Verse" },
    { id: "h3", title: "Afterhours Loop", artist: "Basement Bloom" },
    { id: "h4", title: "Backbeat Blueprint", artist: "Metro Ink" },
    { id: "h5", title: "Coffee & Concrete", artist: "Night Shift" },
  ],
  pop: [
    { id: "p1", title: "City Spark", artist: "Weekend Color" },
    { id: "p2", title: "Golden Hour Texts", artist: "Paper Satellites" },
    { id: "p3", title: "Runway Lights", artist: "Velvet Neon" },
    { id: "p4", title: "Heartbeat Emoji", artist: "Stereo Summer" },
    { id: "p5", title: "Stay Up Late", artist: "Candy Static" },
  ],
};

function pickPool(prompt: string): Track[] {
  const p = prompt.toLowerCase();

  if (p.includes("rock") || p.includes("guitar") || p.includes("indie")) return POOLS.rock;
  if (p.includes("edm") || p.includes("electronic") || p.includes("ambient") || p.includes("techno"))
    return POOLS.electronic;
  if (p.includes("hip hop") || p.includes("hiphop") || p.includes("rap") || p.includes("lofi"))
    return POOLS.hiphop;
  if (p.includes("pop") || p.includes("dance") || p.includes("radio")) return POOLS.pop;

  // default
  return POOLS.electronic;
}

function makePlaylistName(prompt: string) {
  const trimmed = prompt.replace(/["']/g, "").trim();
  const short = trimmed.length > 0 ? trimmed.slice(0, 40) : "Custom Mix";
  return `AI Set: ${short}${trimmed.length > 40 ? "…" : ""}`;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const prompt = String(body?.prompt ?? "").trim();
  if (!prompt) return NextResponse.json({ error: "Missing prompt" }, { status: 400 });

  const pool = pickPool(prompt);
  const count = Math.max(5, Math.min(10, Math.floor(prompt.length / 10)));
  const tracks = shuffle(pool).slice(0, Math.min(count, pool.length));

  return NextResponse.json({
    prompt,
    playlistName: makePlaylistName(prompt),
    tracks,
  });
}
