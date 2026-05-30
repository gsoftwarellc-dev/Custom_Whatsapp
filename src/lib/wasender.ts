import { createWasender } from "wasenderapi";

// PAT is used for session management (listing sessions, getting QR codes, etc.)
// Session API key is used for sending messages — either env or provided per-request
const pat = process.env.WASENDER_API_TOKEN;
const sessionApiKey = process.env.WASENDER_SESSION_API_KEY;

if (!pat && !sessionApiKey) {
  throw new Error("Set at least WASENDER_API_TOKEN or WASENDER_SESSION_API_KEY in .env.local");
}

// Client for session management (PAT required)
export const wasenderAdmin = createWasender(
  sessionApiKey,
  pat,
  undefined,
  undefined,
  { enabled: true, maxRetries: 2 }
);

// Client for sending messages using the default session key
export const wasenderSend = createWasender(
  sessionApiKey,
  undefined,
  undefined,
  undefined,
  { enabled: true, maxRetries: 2 }
);
