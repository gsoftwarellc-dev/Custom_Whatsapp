import { NextRequest, NextResponse } from "next/server";

const BASE = "https://www.wasenderapi.com/api";

export async function GET(req: NextRequest) {
  const pat = process.env.WASENDER_API_TOKEN;
  if (!pat) {
    return NextResponse.json({ error: "PAT not configured" }, { status: 400 });
  }

  const page = req.nextUrl.searchParams.get("page") ?? "1";

  // Fetch all sessions first to get their IDs
  const sessionsRes = await fetch(`${BASE}/whatsapp-sessions`, {
    headers: {
      Authorization: `Bearer ${pat}`,
      Accept: "application/json",
    },
  });

  if (!sessionsRes.ok) {
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }

  const sessionsData = await sessionsRes.json();
  const sessions: { id: number; name: string }[] = sessionsData.data ?? [];

  // Fetch logs for all sessions in parallel
  const logsResults = await Promise.all(
    sessions.map(async (session) => {
      const res = await fetch(
        `${BASE}/whatsapp-sessions/${session.id}/message-logs?page=${page}&per_page=20`,
        {
          headers: {
            Authorization: `Bearer ${pat}`,
            Accept: "application/json",
          },
        }
      );
      if (!res.ok) return [];
      const data = await res.json();
      return ((data.data?.data ?? []) as unknown[]).map((m) => ({
        ...(m as object),
        sessionName: session.name,
      }));
    })
  );

  type LogEntry = { created_at: string; [key: string]: unknown };
  const allLogs = (logsResults.flat() as unknown as LogEntry[]).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return NextResponse.json({ logs: allLogs });
}
