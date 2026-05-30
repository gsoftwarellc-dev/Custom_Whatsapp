import { NextRequest, NextResponse } from "next/server";
import { createWasender } from "wasenderapi";
import { outreachStore } from "@/lib/outreach-store";

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("clear") === "1") {
    outreachStore.clear();
    return NextResponse.json({ cleared: true });
  }
  return NextResponse.json({
    log: outreachStore.getAll().slice(0, 100),
    dailyCount: outreachStore.getDailyCount(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const { numbers, message, dailyLimit, minDelay, maxDelay, campaignId, skipContacted } =
      await req.json();

    const sessionApiKey =
      process.env.WASENDER_SESSION_API_KEY ?? process.env.WASENDER_API_TOKEN;

    if (!sessionApiKey) {
      return NextResponse.json({ error: "No session API key configured" }, { status: 400 });
    }
    if (!numbers?.length || !message) {
      return NextResponse.json({ error: "numbers and message required" }, { status: 400 });
    }

    const dailyCount = outreachStore.getDailyCount();
    if (dailyCount >= dailyLimit) {
      return NextResponse.json(
        { error: `Daily limit of ${dailyLimit} messages reached. Resume tomorrow.` },
        { status: 429 }
      );
    }

    const client = createWasender(sessionApiKey, undefined, undefined, undefined, {
      enabled: true,
      maxRetries: 1,
    });

    const results: { to: string; status: string; error?: string }[] = [];
    let sent = 0;
    const remaining = dailyLimit - dailyCount;

    for (const rawNumber of numbers) {
      const to = rawNumber.trim();
      if (!to) continue;

      // Stop if daily limit hit mid-campaign
      if (sent >= remaining) {
        results.push({ to, status: "skipped", error: "Daily limit reached" });
        outreachStore.addRecord({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          to,
          message,
          status: "skipped",
          error: "Daily limit reached",
          sentAt: new Date().toISOString(),
          campaignId,
        });
        continue;
      }

      // Skip already contacted numbers if requested
      if (skipContacted && outreachStore.alreadyContacted(to)) {
        results.push({ to, status: "skipped", error: "Already contacted" });
        outreachStore.addRecord({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          to,
          message,
          status: "skipped",
          error: "Already contacted",
          sentAt: new Date().toISOString(),
          campaignId,
        });
        continue;
      }

      try {
        await client.sendText({ to, text: message });

        outreachStore.addRecord({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          to,
          message,
          status: "sent",
          sentAt: new Date().toISOString(),
          campaignId,
        });
        outreachStore.incrementDaily();
        results.push({ to, status: "sent" });
        sent++;

        // Random delay between messages (server-side enforced)
        if (sent < numbers.length) {
          const delay =
            Math.floor(Math.random() * (maxDelay - minDelay + 1) + minDelay) * 1000;
          await new Promise((r) => setTimeout(r, delay));
        }
      } catch (err: unknown) {
        const error = err instanceof Error ? err.message : "Failed to send";
        outreachStore.addRecord({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          to,
          message,
          status: "failed",
          error,
          sentAt: new Date().toISOString(),
          campaignId,
        });
        results.push({ to, status: "failed", error });
      }
    }

    return NextResponse.json({
      results,
      sent,
      dailyTotal: outreachStore.getDailyCount(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
