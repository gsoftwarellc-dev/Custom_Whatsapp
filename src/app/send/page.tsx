"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, CheckCircle, XCircle, Info, Key } from "lucide-react";

interface Session {
  id: number;
  name: string;
  phone_number: string;
  status: string;
}

interface SentMessage {
  id: string;
  to: string;
  text: string;
  sessionName: string;
  status: "sent" | "error";
  error?: string;
  sentAt: string;
}

export default function SendPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [sessionApiKey, setSessionApiKey] = useState("");
  const [hasEnvKey, setHasEnvKey] = useState(false);
  const [to, setTo] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);
  const [log, setLog] = useState<SentMessage[]>([]);

  useEffect(() => {
    // Check if env session key is configured
    fetch("/api/config")
      .then((r) => r.json())
      .then((d) => setHasEnvKey(d.hasSessionKey));

    // Load connected sessions
    fetch("/api/sessions")
      .then((r) => r.json())
      .then((d) => {
        const all: Session[] = d.sessions ?? [];
        const connected = all.filter((s) => s.status === "connected");
        setSessions(connected);
        if (connected.length >= 1) setSelectedSession(connected[0]);
      });

    // Load message log from localStorage
    const stored = localStorage.getItem("wa_message_log");
    if (stored) {
      try { setLog(JSON.parse(stored)); } catch { /* ignore */ }
    }

    // Restore saved session API key
    const savedKey = localStorage.getItem("wa_session_api_key");
    if (savedKey) setSessionApiKey(savedKey);
  }, []);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!to || !text) return;

    setSending(true);
    setResult(null);

    // Save key to localStorage if manually entered
    if (sessionApiKey) {
      localStorage.setItem("wa_session_api_key", sessionApiKey);
    }

    const sessionName = selectedSession?.name ?? "Default Session";

    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionApiKey: sessionApiKey || undefined,
          to,
          text,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setResult({ success: true, message: "Message sent successfully!" });
        const entry: SentMessage = {
          id: Date.now().toString(),
          to,
          text,
          sessionName,
          status: "sent",
          sentAt: new Date().toISOString(),
        };
        const newLog = [entry, ...log].slice(0, 50);
        setLog(newLog);
        localStorage.setItem("wa_message_log", JSON.stringify(newLog));
        const count = Number(localStorage.getItem("wa_sent_count") ?? "0") + 1;
        localStorage.setItem("wa_sent_count", String(count));
        setText("");
        setTo("");
      } else {
        setResult({ success: false, error: data.error ?? "Unknown error" });
        const entry: SentMessage = {
          id: Date.now().toString(),
          to,
          text,
          sessionName,
          status: "error",
          error: data.error,
          sentAt: new Date().toISOString(),
        };
        setLog((prev) => [entry, ...prev].slice(0, 50));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error";
      setResult({ success: false, error: msg });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Send Message</h1>
        <p className="text-gray-400 mt-1">Send a WhatsApp message to any number</p>
      </div>

      {/* Key status */}
      {hasEnvKey ? (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/20">
          <Key className="w-4 h-4 text-green-400 shrink-0" />
          <p className="text-sm text-green-300">
            Session API key loaded from environment. Ready to send.
          </p>
        </div>
      ) : (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
          <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
          <p className="text-sm text-blue-300">
            Enter your <strong>Session API Key</strong> below. Find it in your{" "}
            WaSenderAPI dashboard → Sessions → [your session] → API Key. It&apos;s saved locally.
          </p>
        </div>
      )}

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white text-base">Compose Message</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSend} className="space-y-5">
            {/* Session selector */}
            {sessions.length > 0 && (
              <div className="space-y-2">
                <Label className="text-gray-300">WhatsApp Session</Label>
                <div className="flex flex-wrap gap-2">
                  {sessions.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedSession(s)}
                      className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                        selectedSession?.id === s.id
                          ? "border-green-500 bg-green-500/10 text-green-400"
                          : "border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600"
                      }`}
                    >
                      <span className="font-medium">{s.name}</span>
                      {s.phone_number && (
                        <span className="ml-2 text-xs opacity-60">{s.phone_number}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Session API Key (only show if env key not set) */}
            {!hasEnvKey && (
              <div className="space-y-2">
                <Label htmlFor="sessionKey" className="text-gray-300">
                  Session API Key
                </Label>
                <Input
                  id="sessionKey"
                  type="password"
                  value={sessionApiKey}
                  onChange={(e) => setSessionApiKey(e.target.value)}
                  placeholder="Paste your session API key here"
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>
            )}

            {/* Phone number */}
            <div className="space-y-2">
              <Label htmlFor="to" className="text-gray-300">
                Recipient Phone Number
              </Label>
              <Input
                id="to"
                type="tel"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="+1234567890 (with country code)"
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                required
              />
              <p className="text-xs text-gray-500">E.164 format — e.g. +447700900000 or +19175551234</p>
            </div>

            {/* Message text */}
            <div className="space-y-2">
              <Label htmlFor="text" className="text-gray-300">
                Message
              </Label>
              <Textarea
                id="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type your message here…"
                rows={4}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 resize-none"
                required
              />
              <p className="text-xs text-gray-500">{text.length} characters</p>
            </div>

            <Button
              type="submit"
              disabled={sending || !to || !text || (!hasEnvKey && !sessionApiKey)}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              {sending ? (
                <>Sending…</>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </form>

          {/* Result */}
          {result && (
            <div
              className={`mt-4 flex items-center gap-3 p-3 rounded-lg border ${
                result.success
                  ? "bg-green-500/10 border-green-500/30 text-green-400"
                  : "bg-red-500/10 border-red-500/30 text-red-400"
              }`}
            >
              {result.success ? (
                <CheckCircle className="w-4 h-4 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 shrink-0" />
              )}
              <p className="text-sm">{result.success ? result.message : result.error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent sends */}
      {log.length > 0 && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white text-base">Recent Sends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {log.slice(0, 5).map((entry) => (
                <div key={entry.id} className="flex items-start justify-between p-3 rounded-lg bg-gray-800">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-mono text-white">{entry.to}</p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{entry.text}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(entry.sentAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      entry.status === "sent"
                        ? "border-green-500/40 text-green-400 ml-3 shrink-0"
                        : "border-red-500/40 text-red-400 ml-3 shrink-0"
                    }
                  >
                    {entry.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
