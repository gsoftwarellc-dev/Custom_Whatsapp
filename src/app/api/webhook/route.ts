import { NextRequest, NextResponse } from "next/server";
import { inboxStore, type InboxMessage } from "@/lib/inbox-store";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = body as Record<string, unknown>;
  const eventType = event.event as string | undefined;

  // Handle personal, group, and generic received message events
  const isIncoming =
    eventType === "messages-personal.received" ||
    eventType === "messages-group.received" ||
    eventType === "messages.received" ||
    eventType === "messages.upsert";

  if (!isIncoming) {
    // Acknowledge other events (delivery updates, session status, etc.)
    return NextResponse.json({ received: true });
  }

  const data = (event.data ?? event) as Record<string, unknown>;
  const message = (data.message ?? data) as Record<string, unknown>;
  const key = (message.key ?? {}) as Record<string, unknown>;
  const msgContent = (message.message ?? {}) as Record<string, unknown>;

  const from =
    (key.remoteJid as string) ??
    (data.from as string) ??
    (message.from as string) ??
    "unknown";

  const pushName =
    (message.pushName as string) ??
    (data.pushName as string) ??
    undefined;

  // Extract text from various message content types
  let text: string | undefined;
  let mediaType: string | undefined;
  let caption: string | undefined;

  if (msgContent.conversation) {
    text = msgContent.conversation as string;
  } else if ((msgContent.extendedTextMessage as Record<string, unknown>)?.text) {
    text = ((msgContent.extendedTextMessage as Record<string, unknown>).text as string);
  } else if (msgContent.imageMessage) {
    mediaType = "image";
    caption = ((msgContent.imageMessage as Record<string, unknown>).caption as string) ?? undefined;
  } else if (msgContent.videoMessage) {
    mediaType = "video";
    caption = ((msgContent.videoMessage as Record<string, unknown>).caption as string) ?? undefined;
  } else if (msgContent.audioMessage) {
    mediaType = "audio";
  } else if (msgContent.documentMessage) {
    mediaType = "document";
    caption = ((msgContent.documentMessage as Record<string, unknown>).title as string) ?? undefined;
  } else if (msgContent.stickerMessage) {
    mediaType = "sticker";
  }

  const timestamp = (message.messageTimestamp as number) ?? Math.floor(Date.now() / 1000);

  const inboxMsg: InboxMessage = {
    id: `${from}-${timestamp}-${Math.random().toString(36).slice(2, 7)}`,
    from: from.replace(/@s\.whatsapp\.net$/, "").replace(/@g\.us$/, " (group)"),
    pushName,
    text,
    mediaType,
    caption,
    messageType: Object.keys(msgContent)[0] ?? "unknown",
    sessionId: (event.session_id ?? event.sessionId) as string | number | undefined,
    timestamp,
    receivedAt: new Date().toISOString(),
    raw: body,
  };

  inboxStore.add(inboxMsg);

  return NextResponse.json({ received: true });
}
