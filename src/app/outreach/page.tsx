"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Shield, Send, AlertTriangle, CheckCircle, XCircle,
  Clock, Users, TrendingUp, SkipForward, RefreshCw, Trash2
} from "lucide-react";

interface OutreachRecord {
  id: string;
  to: string;
  message: string;
  status: "sent" | "failed" | "skipped";
  error?: string;
  sentAt: string;
  campaignId: string;
}

interface SendResult {
  to: string;
  status: string;
  error?: string;
}

// Warm-up schedule: day range → recommended daily max
const WARMUP_SCHEDULE = [
  { days: "Days 1–7", limit: 10, label: "Warm-up phase" },
  { days: "Days 8–14", limit: 20, label: "Building trust" },
  { days: "Days 15–21", limit: 35, label: "Scaling up" },
  { days: "Days 22+", limit: 50, label: "Steady state" },
];

export default function OutreachPage() {
  const [numbers, setNumbers] = useState("");
  const [message, setMessage] = useState("");
  const [dailyLimit, setDailyLimit] = useState(10);
  const [minDelay, setMinDelay] = useState(15);
  const [maxDelay, setMaxDelay] = useState(30);
  const [skipContacted, setSkipContacted] = useState(true);
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<SendResult[]>([]);
  const [log, setLog] = useState<OutreachRecord[]>([]);
  const [dailyCount, setDailyCount] = useState(0);
  const [campaignDone, setCampaignDone] = useState(false);
  const abortRef = useRef(false);

  useEffect(() => {
    fetchLog();
  }, []);

  async function fetchLog() {
    const res = await fetch("/api/outreach");
    const data = await res.json();
    setLog(data.log ?? []);
    setDailyCount(data.dailyCount ?? 0);
  }

  const parsedNumbers = numbers
    .split(/[\n,]/)
    .map((n) => n.trim())
    .filter((n) => n.length > 5);

  const dailyRemaining = Math.max(0, dailyLimit - dailyCount);
  const willSend = Math.min(parsedNumbers.length, dailyRemaining);
  const estimatedMinutes = Math.ceil((willSend * ((minDelay + maxDelay) / 2)) / 60);

  async function handleSend() {
    if (!parsedNumbers.length || !message.trim()) return;
    setSending(true);
    setCampaignDone(false);
    setResults([]);
    abortRef.current = false;

    const campaignId = `camp_${Date.now()}`;

    try {
      const res = await fetch("/api/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numbers: parsedNumbers,
          message: message.trim(),
          dailyLimit,
          minDelay,
          maxDelay,
          campaignId,
          skipContacted,
        }),
      });
      const data = await res.json();

      if (data.error) {
        setResults([{ to: "—", status: "failed", error: data.error }]);
      } else {
        setResults(data.results ?? []);
        setDailyCount(data.dailyTotal ?? dailyCount);
        setCampaignDone(true);
      }
    } finally {
      setSending(false);
      fetchLog();
    }
  }

  async function clearLog() {
    await fetch("/api/outreach?clear=1");
    setLog([]);
    setDailyCount(0);
  }

  const sentToday = log.filter(
    (r) => r.status === "sent" && r.sentAt.startsWith(new Date().toISOString().slice(0, 10))
  ).length;

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Safe Outreach</h1>
        <p className="text-gray-400 mt-1">Send marketing messages with built-in delays and daily limits to protect your number</p>
      </div>

      {/* Safety status bar */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400">Sent today</span>
              <Users className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white">{sentToday}</div>
            <div className="mt-2 h-1.5 rounded-full bg-gray-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-500 transition-all"
                style={{ width: `${Math.min(100, (sentToday / dailyLimit) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">{dailyRemaining} remaining today</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400">Total reached</span>
              <TrendingUp className="w-3.5 h-3.5 text-green-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {log.filter((r) => r.status === "sent").length}
            </div>
            <p className="text-xs text-gray-500 mt-1">unique contacts messaged</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400">Delay range</span>
              <Clock className="w-3.5 h-3.5 text-yellow-400" />
            </div>
            <div className="text-2xl font-bold text-white">{minDelay}–{maxDelay}s</div>
            <p className="text-xs text-gray-500 mt-1">between each message</p>
          </CardContent>
        </Card>
      </div>

      {/* Safety notice */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
        <Shield className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-yellow-300">Safety rules active</p>
          <p className="text-xs text-yellow-300/70 mt-0.5">
            Random delay {minDelay}–{maxDelay}s between messages · Daily cap {dailyLimit} msgs ·
            {skipContacted ? " Skipping already-contacted numbers" : " Re-contacting allowed"} ·
            Account Protection should be ON in WaSenderAPI dashboard
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compose */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white text-base">Campaign Message</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Phone numbers */}
            <div className="space-y-1.5">
              <Label className="text-gray-300 text-sm">Phone Numbers</Label>
              <Textarea
                value={numbers}
                onChange={(e) => setNumbers(e.target.value)}
                placeholder={"+8801711000001\n+8801711000002\n+8801711000003"}
                rows={6}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-600 resize-none font-mono text-sm"
              />
              <p className="text-xs text-gray-500">
                {parsedNumbers.length} numbers detected · one per line or comma-separated · include country code
              </p>
            </div>

            {/* Message */}
            <div className="space-y-1.5">
              <Label className="text-gray-300 text-sm">Message</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={"Hi! I noticed your business and thought you might benefit from our marketing services. We help local businesses grow their customer base. Would you be open to a quick chat?"}
                rows={5}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-600 resize-none text-sm"
              />
              <p className="text-xs text-gray-500">{message.length} characters · keep it personal and short</p>
            </div>
          </CardContent>
        </Card>

        {/* Safety settings */}
        <div className="space-y-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-400" /> Safety Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Daily limit */}
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <Label className="text-gray-300 text-sm">Daily message limit</Label>
                  <span className="text-green-400 font-mono text-sm font-bold">{dailyLimit}</span>
                </div>
                <input
                  type="range" min={5} max={50} step={5}
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(Number(e.target.value))}
                  className="w-full accent-green-500"
                />
                <div className="flex justify-between text-xs text-gray-600">
                  <span>5 (safest)</span><span>50 (max)</span>
                </div>
              </div>

              {/* Min delay */}
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <Label className="text-gray-300 text-sm">Min delay between messages</Label>
                  <span className="text-yellow-400 font-mono text-sm font-bold">{minDelay}s</span>
                </div>
                <input
                  type="range" min={10} max={60} step={5}
                  value={minDelay}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setMinDelay(v);
                    if (maxDelay < v + 5) setMaxDelay(v + 5);
                  }}
                  className="w-full accent-yellow-500"
                />
              </div>

              {/* Max delay */}
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <Label className="text-gray-300 text-sm">Max delay between messages</Label>
                  <span className="text-yellow-400 font-mono text-sm font-bold">{maxDelay}s</span>
                </div>
                <input
                  type="range" min={15} max={120} step={5}
                  value={maxDelay}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setMaxDelay(v);
                    if (minDelay > v - 5) setMinDelay(Math.max(10, v - 5));
                  }}
                  className="w-full accent-yellow-500"
                />
              </div>

              {/* Skip contacted */}
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setSkipContacted(!skipContacted)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${skipContacted ? "bg-green-500" : "bg-gray-700"}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${skipContacted ? "left-5" : "left-0.5"}`} />
                </div>
                <span className="text-sm text-gray-300">Skip already-contacted numbers</span>
              </label>
            </CardContent>
          </Card>

          {/* Estimate + Send */}
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="pt-5 space-y-3">
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>Numbers to process</span>
                  <span className="text-white font-medium">{parsedNumbers.length}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Will send today</span>
                  <span className="text-green-400 font-medium">{willSend}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Estimated time</span>
                  <span className="text-white font-medium">~{estimatedMinutes} min</span>
                </div>
              </div>

              {dailyRemaining === 0 && (
                <div className="flex items-center gap-2 p-2 rounded bg-red-500/10 border border-red-500/20">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                  <p className="text-xs text-red-400">Daily limit reached. Resume tomorrow.</p>
                </div>
              )}

              <Button
                onClick={handleSend}
                disabled={sending || !parsedNumbers.length || !message.trim() || dailyRemaining === 0}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium"
              >
                {sending ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Sending with delays… please wait
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    Start Safe Campaign
                  </span>
                )}
              </Button>
              {sending && (
                <p className="text-xs text-center text-gray-500">
                  Do not close this tab. Sending {willSend} messages with {minDelay}–{maxDelay}s delays.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Live results */}
      {results.length > 0 && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base flex items-center gap-2">
              {campaignDone ? <CheckCircle className="w-4 h-4 text-green-400" /> : <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />}
              Campaign {campaignDone ? "Complete" : "Running"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4 text-sm">
              <span className="text-green-400">{results.filter(r => r.status === "sent").length} sent</span>
              <span className="text-red-400">{results.filter(r => r.status === "failed").length} failed</span>
              <span className="text-gray-400">{results.filter(r => r.status === "skipped").length} skipped</span>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {results.map((r, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 px-3 rounded bg-gray-800 text-sm">
                  <span className="font-mono text-gray-300">{r.to}</span>
                  <div className="flex items-center gap-1.5">
                    {r.status === "sent" && <CheckCircle className="w-3.5 h-3.5 text-green-400" />}
                    {r.status === "failed" && <XCircle className="w-3.5 h-3.5 text-red-400" />}
                    {r.status === "skipped" && <SkipForward className="w-3.5 h-3.5 text-gray-400" />}
                    <Badge variant="outline" className={
                      r.status === "sent" ? "border-green-500/40 text-green-400 text-xs" :
                      r.status === "failed" ? "border-red-500/40 text-red-400 text-xs" :
                      "border-gray-600 text-gray-400 text-xs"
                    }>
                      {r.status}{r.error ? `: ${r.error}` : ""}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warm-up schedule */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" /> Recommended Warm-up Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {WARMUP_SCHEDULE.map((phase, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg border text-center ${
                  dailyLimit <= phase.limit && (i === 0 || dailyLimit > WARMUP_SCHEDULE[i - 1].limit)
                    ? "border-green-500/40 bg-green-500/5"
                    : "border-gray-800 bg-gray-800/50"
                }`}
              >
                <p className="text-xs text-gray-500">{phase.days}</p>
                <p className="text-xl font-bold text-white mt-1">{phase.limit}</p>
                <p className="text-xs text-gray-400">msgs/day</p>
                <p className="text-xs text-gray-500 mt-1">{phase.label}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Start at 10/day and increase gradually. Never jump more than +15/day per week.
          </p>
        </CardContent>
      </Card>

      {/* Outreach log */}
      {log.length > 0 && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-base">Outreach History</CardTitle>
              <Button
                variant="outline" size="sm"
                onClick={clearLog}
                className="border-red-500/40 text-red-400 hover:bg-red-500/10 h-7 text-xs"
              >
                <Trash2 className="w-3 h-3 mr-1" /> Clear
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-800 max-h-64 overflow-y-auto">
              {log.slice(0, 50).map((r) => (
                <div key={r.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-800/50">
                  <div>
                    <p className="text-sm font-mono text-white">{r.to}</p>
                    <p className="text-xs text-gray-500">{new Date(r.sentAt).toLocaleString()}</p>
                  </div>
                  <Badge variant="outline" className={
                    r.status === "sent" ? "border-green-500/40 text-green-400 bg-green-500/10 text-xs" :
                    r.status === "failed" ? "border-red-500/40 text-red-400 bg-red-500/10 text-xs" :
                    "border-gray-600 text-gray-400 text-xs"
                  }>
                    {r.status}
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
