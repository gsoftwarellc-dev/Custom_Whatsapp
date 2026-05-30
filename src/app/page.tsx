"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Send, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";

interface Session {
  id: number;
  name: string;
  phone_number: string;
  status: string;
}

export default function DashboardPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [sentCount, setSentCount] = useState<number>(0);

  useEffect(() => {
    fetch("/api/sessions")
      .then((r) => r.json())
      .then((d) => {
        setSessions(d.sessions ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    const stored = localStorage.getItem("wa_sent_count");
    if (stored) setSentCount(Number(stored));
  }, []);

  const connected = sessions.filter((s) => s.status === "connected").length;
  const total = sessions.length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">Overview of your WhatsApp sessions and activity</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Connected Sessions</CardTitle>
            <Smartphone className="w-4 h-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{loading ? "…" : connected}</div>
            <p className="text-xs text-gray-500 mt-1">{total} total sessions</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Messages Sent</CardTitle>
            <Send className="w-4 h-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{sentCount}</div>
            <p className="text-xs text-gray-500 mt-1">This session</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Plan Capacity</CardTitle>
            <CheckCircle className="w-4 h-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">3</div>
            <p className="text-xs text-gray-500 mt-1">Max WhatsApp sessions</p>
          </CardContent>
        </Card>
      </div>

      {/* Sessions quick view */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Active Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-gray-400 text-sm">Loading sessions…</p>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No sessions found.</p>
              <Link href="/sessions" className="text-green-400 text-sm hover:underline mt-1 inline-block">
                Go to Sessions →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-800">
                  <div>
                    <p className="text-sm font-medium text-white">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.phone_number || "No phone linked"}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      s.status === "connected"
                        ? "border-green-500/40 text-green-400 bg-green-500/10"
                        : s.status === "need_scan"
                        ? "border-yellow-500/40 text-yellow-400 bg-yellow-500/10"
                        : "border-gray-600 text-gray-400"
                    }
                  >
                    {s.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/send">
          <Card className="bg-gray-900 border-gray-800 hover:border-green-500/40 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Send className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="font-medium text-white">Send a Message</p>
                <p className="text-sm text-gray-400">Send WhatsApp to any number</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/sessions">
          <Card className="bg-gray-900 border-gray-800 hover:border-green-500/40 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-white">Manage Sessions</p>
                <p className="text-sm text-gray-400">Connect or add WhatsApp numbers</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
