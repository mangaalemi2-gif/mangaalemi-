"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Reply, UserPlus, Megaphone } from "lucide-react";

interface Notif {
  id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: any;
}

const ICONS: Record<string, any> = {
  reply: Reply,
  follow: UserPlus,
  announcement: Megaphone,
};

export default function NotificationsBell() {
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = (await res.json()) as any;
      setNotifs(data.notifications || []);
      setUnread(data.unread || 0);
      setLoggedIn(true);
    } catch { /* yoksay */ }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => {
      clearInterval(t);
      document.removeEventListener("mousedown", close);
    };
  }, []);

  async function markAll() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
  }

  async function openNotif(n: Notif) {
    if (!n.isRead) {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: n.id }),
      });
      setNotifs((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
      setUnread((u) => Math.max(0, u - 1));
    }
    setOpen(false);
  }

  if (!loggedIn) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-full text-gray-300 hover:text-white hover:bg-surface-light transition-all"
        title="Bildirimler"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] glass-panel rounded-2xl border border-white/10 shadow-2xl overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <span className="font-bold text-white text-sm">Bildirimler</span>
            {unread > 0 && (
              <button onClick={markAll} className="text-[11px] text-primary hover:underline flex items-center gap-1">
                <CheckCheck className="w-3.5 h-3.5" /> Tümünü okundu işaretle
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifs.length === 0 ? (
              <p className="text-center text-gray-500 text-xs py-8">Bildirimin yok. Biri yorumuna yanıt yazınca veya seni takip edince burada görürsün.</p>
            ) : (
              notifs.map((n) => {
                const Icon = ICONS[n.type] || Bell;
                const inner = (
                  <div
                    onClick={() => openNotif(n)}
                    className={`flex gap-3 px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${n.isRead ? "opacity-60" : ""}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${n.isRead ? "bg-surface-light text-gray-500" : "bg-primary/15 text-primary"}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white">{n.title}</p>
                      {n.message && <p className="text-xs text-gray-400 truncate">{n.message}</p>}
                    </div>
                    {!n.isRead && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />}
                  </div>
                );
                return n.link ? <Link key={n.id} href={n.link}>{inner}</Link> : <div key={n.id}>{inner}</div>;
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
