import { NextResponse } from "next/server";
import { wasenderAdmin, wasenderSend } from "@/lib/wasender";

export async function GET() {
  if (process.env.WASENDER_API_TOKEN && wasenderAdmin) {
    try {
      const result = await wasenderAdmin.getAllWhatsAppSessions();
      return NextResponse.json({ sessions: result.response.data ?? [], source: "pat" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to fetch sessions";
      return NextResponse.json({ error: msg, patRequired: true }, { status: 500 });
    }
  }

  if (process.env.WASENDER_SESSION_API_KEY && wasenderSend) {
    try {
      const result = await wasenderSend.getSessionStatus();
      return NextResponse.json({
        sessions: [
          {
            id: 1,
            name: "My WhatsApp",
            phone_number: "",
            status: result.response.status,
            webhook_url: null,
            created_at: new Date().toISOString(),
          },
        ],
        source: "session_key",
        patRequired: true,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to get session status";
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "No API token configured" }, { status: 500 });
}
