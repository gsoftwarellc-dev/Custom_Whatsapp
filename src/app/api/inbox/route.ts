import { NextRequest, NextResponse } from "next/server";
import { inboxStore } from "@/lib/inbox-store";

export async function GET(req: NextRequest) {
  const clear = req.nextUrl.searchParams.get("clear");
  if (clear === "1") {
    inboxStore.clear();
    return NextResponse.json({ cleared: true });
  }
  return NextResponse.json({ messages: inboxStore.getAll() });
}
