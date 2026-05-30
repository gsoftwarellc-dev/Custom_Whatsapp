"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Send, XCircle, Search, RefreshCw } from "lucide-react";

interface ServerLog {
  id: number;
  to: string;
  content: { text?: string; [key: string]: unknown };
  status: string;
  failed_reason: string | null;
  created_at: string;
  sessionName?: string;
}

interface LocalLog {
  id: string;
  to: string;
  text: string;
  sessionName: string;
  status: "sent" | "error";
  error?: string;
  sentAt: string;
}

type DisplayLog = {
  key: string;
  to: string;
  text: string;
  sessionName: string;
  status: string;
  error?: string | null;
  sentAt: string;
  source: "server" | "local";
};

export default function MessagesPage() {
  const [logs, setLogs] = useState<DisplayLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      // Try server-side logs first (WaSenderAPI message-logs endpoint)
      const res = await fetch("/api/messages/logs");
      if (res.ok) {
        const data = await res.json();
        const serverLogs: ServerLog[] = data.logs ?? [];
        const mapped: DisplayLog[] = serverLogs.map((l) => ({
          key: String(l.id),
          to: l.to,
          text: l.content?.text ?? JSON.stringify(l.content),
          sessionName: l.sessionName ?? "—",
          status: l.status,
          error: l.failed_reason,
          sentAt: l.created_at,
          source: "server",
        }));
        setLogs(mapped);
        return;
      }
    } catch { /* fall through to local */ }

    // Fallback: local storage log
    const stored = localStorage.getItem("wa_message_log");
    if (stored) {
      try {
        const local: LocalLog[] = JSON.parse(stored);
        setLogs(local.map((l) => ({
          key: l.id,
          to: l.to,
          text: l.text,
          sessionName: l.sessionName,
          status: l.status,
          error: l.error,
          sentAt: l.sentAt,
          source: "local",
        })));
      } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filtered = logs.filter(
    (m) =>
      m.to.includes(search) ||
      m.text.toLowerCase().includes(search.toLowerCase()) ||
      m.sessionName.toLowerCase().includes(search.toLowerCase())
  );

  const sentCount = logs.filter((m) => m.status === "sent").length;
  const failedCount = logs.filter((m) => m.status !== "sent").length;
  const isServer = logs.length > 0 && logs[0].source === "server";

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Message Log</h1>
          <p className="text-gray-400 mt-1">
            {isServer ? "Live data from WaSenderAPI" : "Local session history"}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchLogs}
          disabled={loading}
          className="border-gray-700 text-gray-300 hover:bg-gray-800"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-white">{logs.length}</div>
            <p className="text-sm text-gray-400 mt-1">Total messages</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-400">{sentCount}</div>
            <p className="text-sm text-gray-400 mt-1">Successfully sent</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-400">{failedCount}</div>
            <p className="text-sm text-gray-400 mt-1">Failed</p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-14 rounded-lg bg-gray-800 animate-pulse" />)}
        </div>
      ) : logs.length === 0 ? (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="flex flex-col items-center py-16">
            <Send className="w-10 h-10 text-gray-600 mb-3" />
            <p className="text-gray-400">No messages sent yet.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <div className="flex items-center gap-3">
              <CardTitle className="text-white text-base flex-1">All Sent Messages</CardTitle>
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
            <Table>
              <TableHeader>
                <TableRow className="border-gray-800 hover:bg-transparent">
                  <TableHead className="text-gray-400">Recipient</TableHead>
                  <TableHead className="text-gray-400">Message</TableHead>
                  <TableHead className="text-gray-400">Session</TableHead>
                  <TableHead className="text-gray-400">Time</TableHead>
                  <TableHead className="text-gray-400">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                      No results for &quot;{search}&quot;
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((m) => (
                    <TableRow key={m.key} className="border-gray-800 hover:bg-gray-800/50">
                      <TableCell className="font-mono text-sm text-white">{m.to}</TableCell>
                      <TableCell className="text-gray-300 max-w-xs">
                        <p className="truncate text-sm">{m.text}</p>
                        {m.error && (
                          <p className="text-xs text-red-400 mt-0.5 flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> {m.error}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-400 text-sm">{m.sessionName}</TableCell>
                      <TableCell className="text-gray-500 text-xs whitespace-nowrap">
                        {new Date(m.sentAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            m.status === "sent"
                              ? "border-green-500/40 text-green-400 bg-green-500/10"
                              : "border-red-500/40 text-red-400 bg-red-500/10"
                          }
                        >
                          {m.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
