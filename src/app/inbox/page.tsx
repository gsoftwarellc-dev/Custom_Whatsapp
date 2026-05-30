"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Inbox,
  RefreshCw,
  Trash2,
  Search,
  Image as ImageIcon,
  FileText,
  Mic,
  Video,
  Smile,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

interface InboxMessage {
  id: string;
  from: string;
  pushName?: string;
  text?: string;
  mediaType?: string;
  caption?: string;
  messageType: string;
  sessionId?: number | string;
  timestamp: number;
  receivedAt: string;
}

function mediaIcon(type?: string) {
  switch (type) {
    case "image": return <ImageIcon className="w-3.5 h-3.5 text-blue-400" />;
    case "video": return <Video className="w-3.5 h-3.5 text-purple-400" />;
    case "audio": return <Mic className="w-3.5 h-3.5 text-green-400" />;
    case "document": return <FileText className="w-3.5 h-3.5 text-yellow-400" />;
    case "sticker": return <Smile className="w-3.5 h-3.5 text-pink-400" />;
    default: return null;
  }
}

function formatPhone(from: string) {
  return from.replace("@s.whatsapp.net", "").replace("@g.us", "");
}

export default function InboxPage() {
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [webhookConfigured, setWebhookConfigured] = useState(false);

  const fetchInbox = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/inbox");
      const data = await res.json();
      setMessages(data.messages ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInbox();

    // Check if webhook is already configured on any session
    fetch("/api/sessions")
      .then((r) => r.json())
      .then((d) => {
        const sessions = d.sessions ?? [];
        const hasWebhook = sessions.some(
          (s: { webhook_enabled: boolean; webhook_url: string }) =>
            s.webhook_enabled && s.webhook_url
        );
        setWebhookConfigured(hasWebhook);
      });

    // Poll every 10 seconds for new messages
    const interval = setInterval(fetchInbox, 10000);
    return () => clearInterval(interval);
  }, [fetchInbox]);

  async function clearInbox() {
    await fetch("/api/inbox?clear=1");
    setMessages([]);
  }

  const filtered = messages.filter(
    (m) =>
      m.from.includes(search) ||
      (m.pushName?.toLowerCase().includes(search.toLowerCase())) ||
      (m.text?.toLowerCase().includes(search.toLowerCase())) ||
      (m.caption?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Inbox</h1>
          <p className="text-gray-400 mt-1">Incoming WhatsApp messages received via webhook</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchInbox}
            disabled={loading}
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {messages.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearInbox}
              className="border-red-500/40 text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Webhook status banner */}
      {webhookConfigured ? (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/20">
          <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
          <p className="text-sm text-green-300">
            Webhook active — incoming messages will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
          <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
          <div className="space-y-1 min-w-0">
            <p className="text-sm text-yellow-300 font-medium">Webhook setup required to receive messages</p>
            <p className="text-xs text-yellow-300/70">
              Go to <strong>WaSenderAPI dashboard → Sessions → [your session] → Webhook</strong> and set the URL to:
            </p>
            <code className="block text-xs text-yellow-200 bg-yellow-500/10 px-2 py-1 rounded font-mono break-all">
              https://custom-whatsapp.vercel.app/api/webhook
            </code>
            <p className="text-xs text-yellow-300/70 mt-1">
              Enable events: <strong>messages.received</strong>, <strong>messages-personal.received</strong>
            </p>
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-white">{messages.length}</div>
            <p className="text-sm text-gray-400 mt-1">Total received</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-400">
              {messages.filter((m) => !m.mediaType).length}
            </div>
            <p className="text-sm text-gray-400 mt-1">Text messages</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-400">
              {messages.filter((m) => !!m.mediaType).length}
            </div>
            <p className="text-sm text-gray-400 mt-1">Media messages</p>
          </CardContent>
        </Card>
      </div>

      {/* Message list */}
      {messages.length === 0 ? (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="flex flex-col items-center py-16">
            <Inbox className="w-10 h-10 text-gray-600 mb-3" />
            <p className="text-gray-400">No messages received yet.</p>
            <p className="text-sm text-gray-500 mt-1">
              Set up the webhook above and messages will appear here automatically.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <div className="flex items-center gap-3">
              <CardTitle className="text-white text-base flex-1">
                Messages <span className="text-gray-500 font-normal">({filtered.length})</span>
              </CardTitle>
              <div className="relative w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search…"
                  className="pl-9 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 h-8 text-sm"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-800">
              {filtered.map((msg) => (
                <div key={msg.id} className="flex items-start gap-4 p-4 hover:bg-gray-800/50 transition-colors">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                    <span className="text-green-400 font-semibold text-sm">
                      {(msg.pushName ?? msg.from)[0]?.toUpperCase() ?? "?"}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      {msg.pushName && (
                        <span className="text-sm font-medium text-white">{msg.pushName}</span>
                      )}
                      <span className="text-xs font-mono text-gray-400">
                        {formatPhone(msg.from)}
                      </span>
                      {msg.from.includes("group") && (
                        <Badge variant="outline" className="text-xs border-blue-500/40 text-blue-400 bg-blue-500/10">
                          group
                        </Badge>
                      )}
                    </div>

                    {/* Message body */}
                    {msg.text ? (
                      <p className="text-sm text-gray-300 break-words">{msg.text}</p>
                    ) : msg.mediaType ? (
                      <div className="flex items-center gap-1.5 text-sm text-gray-400">
                        {mediaIcon(msg.mediaType)}
                        <span className="capitalize">{msg.mediaType}</span>
                        {msg.caption && (
                          <span className="text-gray-500 truncate">— {msg.caption}</span>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">Unsupported message type</p>
                    )}

                    <p className="text-xs text-gray-600 mt-1">
                      {new Date(msg.receivedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
