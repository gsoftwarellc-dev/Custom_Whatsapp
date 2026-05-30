"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Smartphone, RefreshCw, Wifi, WifiOff, QrCode, AlertCircle } from "lucide-react";

interface Session {
  id: number;
  name: string;
  phone_number: string;
  status: string;
  webhook_url: string | null;
  created_at: string;
}

interface QRModal {
  sessionId: number;
  sessionName: string;
  qrCode: string | null;
  loading: boolean;
}

function statusColor(status: string) {
  switch (status) {
    case "connected":
      return "border-green-500/40 text-green-400 bg-green-500/10";
    case "need_scan":
      return "border-yellow-500/40 text-yellow-400 bg-yellow-500/10";
    case "connecting":
      return "border-blue-500/40 text-blue-400 bg-blue-500/10";
    default:
      return "border-gray-600 text-gray-400 bg-gray-800";
  }
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<number | null>(null);
  const [qrModal, setQrModal] = useState<QRModal | null>(null);
  const [hasPAT, setHasPAT] = useState(false);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sessions");
      const data = await res.json();
      setSessions(data.sessions ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch("/api/config").then((r) => r.json()).then((d) => setHasPAT(d.hasPAT));
    fetchSessions();
  }, [fetchSessions]);

  async function handleConnect(session: Session) {
    setConnecting(session.id);
    try {
      const res = await fetch("/api/sessions/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id }),
      });
      const data = await res.json();

      if (data.data?.qrCode) {
        setQrModal({
          sessionId: session.id,
          sessionName: session.name,
          qrCode: data.data.qrCode,
          loading: false,
        });
      } else {
        await fetchSessions();
      }
    } finally {
      setConnecting(null);
    }
  }

  async function handleShowQR(session: Session) {
    setQrModal({ sessionId: session.id, sessionName: session.name, qrCode: null, loading: true });
    try {
      const res = await fetch(`/api/sessions/qr?sessionId=${session.id}`);
      const data = await res.json();
      setQrModal((prev) => prev ? { ...prev, qrCode: data.qrCode, loading: false } : null);
    } catch {
      setQrModal((prev) => prev ? { ...prev, loading: false } : null);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Sessions</h1>
          <p className="text-gray-400 mt-1">Manage your connected WhatsApp numbers</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchSessions}
          disabled={loading}
          className="border-gray-700 text-gray-300 hover:bg-gray-800"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* PAT warning */}
      {!hasPAT && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
          <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm text-yellow-300 font-medium">Personal Access Token not configured</p>
            <p className="text-xs text-yellow-300/70 mt-0.5">
              Add <code className="bg-yellow-500/10 px-1 rounded">WASENDER_API_TOKEN</code> to your{" "}
              <code className="bg-yellow-500/10 px-1 rounded">.env.local</code> to list all sessions and use QR code
              scanning. Get it from: WaSenderAPI dashboard → Settings → Personal Access Token.
            </p>
          </div>
        </div>
      )}

      {/* Plan indicator */}
      <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/5 border border-green-500/20">
        <Smartphone className="w-4 h-4 text-green-400" />
        <p className="text-sm text-green-300">
          Your plan supports <strong>3 WhatsApp sessions</strong>. You have {sessions.length}/3 sessions.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 rounded-lg bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="flex flex-col items-center py-16">
            <WifiOff className="w-10 h-10 text-gray-600 mb-3" />
            <p className="text-gray-400">No sessions found. Add a session in your WaSenderAPI dashboard first.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sessions.map((s) => (
            <Card key={s.id} className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-green-500/10 flex items-center justify-center">
                      <Smartphone className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                      <CardTitle className="text-base text-white">{s.name}</CardTitle>
                      <p className="text-xs text-gray-400">{s.phone_number || "Phone not linked"}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={statusColor(s.status)}>
                    {s.status === "connected" && <Wifi className="w-3 h-3 mr-1" />}
                    {s.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    ID: {s.id} · Created {new Date(s.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex gap-2">
                    {s.status === "need_scan" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleShowQR(s)}
                        className="border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10"
                      >
                        <QrCode className="w-3.5 h-3.5 mr-1.5" />
                        Show QR
                      </Button>
                    )}
                    {s.status !== "connected" && (
                      <Button
                        size="sm"
                        onClick={() => handleConnect(s)}
                        disabled={connecting === s.id}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {connecting === s.id ? (
                          <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        ) : (
                          <Wifi className="w-3.5 h-3.5 mr-1.5" />
                        )}
                        Connect
                      </Button>
                    )}
                    {s.status === "connected" && (
                      <span className="text-xs text-green-400 flex items-center gap-1">
                        <Wifi className="w-3.5 h-3.5" /> Ready to send
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* QR Modal */}
      {qrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl">
            <h2 className="text-lg font-semibold text-white mb-1">Scan QR Code</h2>
            <p className="text-sm text-gray-400 mb-6">
              Open WhatsApp on your phone → Linked Devices → Scan this code
            </p>
            {qrModal.loading ? (
              <div className="w-64 h-64 mx-auto rounded-lg bg-gray-800 animate-pulse flex items-center justify-center">
                <p className="text-gray-500 text-sm">Loading QR…</p>
              </div>
            ) : qrModal.qrCode ? (
              <img
                src={qrModal.qrCode}
                alt="QR Code"
                className="w-64 h-64 mx-auto rounded-lg border border-gray-700 bg-white p-2"
              />
            ) : (
              <p className="text-red-400 text-sm text-center py-8">Failed to load QR code.</p>
            )}
            <Button
              className="w-full mt-6 bg-gray-800 hover:bg-gray-700 text-white"
              onClick={() => {
                setQrModal(null);
                fetchSessions();
              }}
            >
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
