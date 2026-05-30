import { createWasender } from "wasenderapi";

const pat = process.env.WASENDER_API_TOKEN;
const sessionApiKey = process.env.WASENDER_SESSION_API_KEY;

// Lazy clients — only instantiated when env vars are present at runtime
export const wasenderAdmin =
  pat || sessionApiKey
    ? createWasender(sessionApiKey, pat, undefined, undefined, { enabled: true, maxRetries: 2 })
    : null;

export const wasenderSend =
  sessionApiKey
    ? createWasender(sessionApiKey, undefined, undefined, undefined, { enabled: true, maxRetries: 2 })
    : pat
    ? createWasender(undefined, pat, undefined, undefined, { enabled: true, maxRetries: 2 })
    : null;
