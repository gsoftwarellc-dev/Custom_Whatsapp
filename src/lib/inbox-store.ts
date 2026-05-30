// In-memory store for received messages (persists for the lifetime of the server process)
// On Vercel, this resets on cold starts — wire up a real DB later if needed

export interface InboxMessage {
  id: string;
  from: string;
  pushName?: string;
  text?: string;
  mediaType?: string;
  mediaUrl?: string;
  caption?: string;
  messageType: string;
  sessionId?: number | string;
  timestamp: number;
  receivedAt: string;
  raw?: unknown;
}

// Global singleton shared across requests in the same process
declare global {
  // eslint-disable-next-line no-var
  var __inboxMessages: InboxMessage[] | undefined;
}

if (!global.__inboxMessages) {
  global.__inboxMessages = [];
}

export const inboxStore = {
  add(msg: InboxMessage) {
    global.__inboxMessages!.unshift(msg);
    // Keep latest 200 messages
    if (global.__inboxMessages!.length > 200) {
      global.__inboxMessages = global.__inboxMessages!.slice(0, 200);
    }
  },
  getAll(): InboxMessage[] {
    return global.__inboxMessages ?? [];
  },
  clear() {
    global.__inboxMessages = [];
  },
};
