import { NextRequest, NextResponse } from "next/server";
import { wasenderAdmin } from "@/lib/wasender";

export async function POST(req: NextRequest) {
  if (!process.env.WASENDER_API_TOKEN || !wasenderAdmin) {
    return NextResponse.json(
      { error: "Personal Access Token (WASENDER_API_TOKEN) is required to connect sessions." },
      { status: 400 }
    );
  }
  try {
    const { sessionId } = await req.json();
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }
    const result = await wasenderAdmin.connectWhatsAppSession(Number(sessionId), true);
    return NextResponse.json({ data: result.response.data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to connect session";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
