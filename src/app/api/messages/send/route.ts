import { NextRequest, NextResponse } from "next/server";
import { createWasender } from "wasenderapi";

export async function POST(req: NextRequest) {
  try {
    const { sessionApiKey, to, text } = await req.json();

    // Use provided key, or fall back to env session key
    const keyToUse = sessionApiKey || process.env.WASENDER_SESSION_API_KEY;

    if (!keyToUse || !to || !text) {
      return NextResponse.json(
        { error: "sessionApiKey (or WASENDER_SESSION_API_KEY env), to, and text are required" },
        { status: 400 }
      );
    }

    const client = createWasender(keyToUse, undefined, undefined, undefined, {
      enabled: true,
      maxRetries: 2,
    });

    const result = await client.sendText({ to, text });

    return NextResponse.json({
      success: true,
      message: result.response.message,
      rateLimit: result.rateLimit,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to send message";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
