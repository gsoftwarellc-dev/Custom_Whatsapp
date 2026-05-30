"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Smartphone, Send, BarChart3, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Dashboard", icon: BarChart3 },
  { href: "/sessions", label: "Sessions", icon: Smartphone },
  { href: "/send", label: "Send Message", icon: Send },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/messages", label: "Message Log", icon: MessageSquare },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-semibold text-white text-sm">WaSender</p>
            <p className="text-xs text-gray-400">WhatsApp Dashboard</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              pathname === href
                ? "bg-green-500/10 text-green-400 border border-green-500/20"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <p className="text-xs text-gray-500">Powered by WaSenderAPI</p>
      </div>
    </aside>
  );
}
