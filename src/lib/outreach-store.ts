export interface OutreachRecord {
  id: string;
  to: string;
  message: string;
  status: "sent" | "failed" | "skipped";
  error?: string;
  sentAt: string;
  campaignId: string;
}

declare global {
  // eslint-disable-next-line no-var
  var __outreachLog: OutreachRecord[] | undefined;
  // eslint-disable-next-line no-var
  var __dailyCount: { date: string; count: number } | undefined;
}

if (!global.__outreachLog) global.__outreachLog = [];
if (!global.__dailyCount) global.__dailyCount = { date: "", count: 0 };

export const outreachStore = {
  addRecord(record: OutreachRecord) {
    global.__outreachLog!.unshift(record);
    if (global.__outreachLog!.length > 500) {
      global.__outreachLog = global.__outreachLog!.slice(0, 500);
    }
  },

  getAll(): OutreachRecord[] {
    return global.__outreachLog ?? [];
  },

  // Returns how many messages were sent today
  getDailyCount(): number {
    const today = new Date().toISOString().slice(0, 10);
    if (global.__dailyCount!.date !== today) {
      // New day — recount from log
      const todayRecords = (global.__outreachLog ?? []).filter(
        (r) => r.sentAt.startsWith(today) && r.status === "sent"
      );
      global.__dailyCount = { date: today, count: todayRecords.length };
    }
    return global.__dailyCount!.count;
  },

  incrementDaily() {
    const today = new Date().toISOString().slice(0, 10);
    if (global.__dailyCount!.date !== today) {
      global.__dailyCount = { date: today, count: 0 };
    }
    global.__dailyCount!.count += 1;
  },

  // Check if a number was already contacted
  alreadyContacted(phone: string): boolean {
    return (global.__outreachLog ?? []).some((r) => r.to === phone && r.status === "sent");
  },

  clear() {
    global.__outreachLog = [];
    global.__dailyCount = { date: "", count: 0 };
  },
};
