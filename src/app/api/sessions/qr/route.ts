import { NextRequest, NextResponse } from "next/server";
import { wasenderAdmin } from "@/lib/wasender";

export async function GET(req: NextRequest) {
  if (!process.env.WASENDER_API_TOKEN || !wasenderAdmin) {
    return NextResponse.json(
      { error: "Personal Access Token required to fetch QR codes." },
      { status: 400 }
    );
  }
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }
  try {
    const result = await wasenderAdmin.getWhatsAppSessionQRCode(Number(sessionId));
    return NextResponse.json({ qrCode: result.response.data.qrCode });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to get QR code";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
