import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs"; // ensure this runs on Node (not Edge)

// Lazy initialization - only create client when needed at runtime
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY environment variable");
  }
  return new OpenAI({ apiKey });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const prompt = String(body?.prompt ?? "").trim();
  if (!prompt) return NextResponse.json({ error: "Missing prompt" }, { status: 400 });

  // Check for API key at runtime
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OpenAI API key not configured. Please set OPENAI_API_KEY environment variable." },
      { status: 500 }
    );
  }

  const client = getOpenAIClient();

  const system = `You generate playlist plans. Return STRICT JSON ONLY:
{
  "playlistName": string,
  "vibes": string[],   // 3-6 short tags
  "description": string // <= 180 chars
}
No markdown. No extra keys.`;

  // Using Chat Completions API with JSON output format
  const resp = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.9,
    messages: [
      { role: "system", content: system },
      { role: "user", content: `User prompt: ${prompt}` },
    ],
    response_format: { type: "json_object" },
  });

  const text = resp.choices[0]?.message?.content ?? "{}";

  type PlaylistPlan = {
    playlistName?: string;
    vibes?: string[];
    description?: string;
  };

  let plan: PlaylistPlan;
  try {
    plan = JSON.parse(text) as PlaylistPlan;
  } catch {
    return NextResponse.json({ error: "AI returned invalid JSON", raw: text }, { status: 500 });
  }

  if (!plan.playlistName || !Array.isArray(plan.vibes) || !plan.description) {
    return NextResponse.json({ error: "AI returned incomplete plan", plan }, { status: 500 });
  }

  return NextResponse.json(plan);
}
