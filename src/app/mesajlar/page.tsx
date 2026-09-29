"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Send, ArrowLeft, User } from "lucide-react";

interface Conv {
  id: string;
  other: { id: string; username: string; avatarUrl: string | null } | null;
  lastMessage: { content: string; senderId: string; createdAt: any } | null;
  unread: number;
}

interface Msg {
  id: string;
  senderId: string;
  content: string;
  createdAt: any;
}

export default function MesajlarPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center text-gray-400 animate-pulse">Yükleniyor...</div>}>
      <MesajlarInner />
    </Suspense>
  );
}

function MesajlarInner() {
  const [convs, setConvs] = useState<Conv[]>([]);
  const [active, setActive] = useState<string | null>(null); // other user id
  const [activeName, setActiveName] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [myId, setMyId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();

  async function loadConvs() {
    try {
      const [cRes, meRes] = await Promise.all([fetch("/api/messages?list=1"), fetch("/api/auth/me")]);
      if (cRes.ok) {
        const data = (await cRes.json()) as any;
        setConvs(data.conversations || []);
      }
      if (meRes.ok) {
        const data = (await meRes.json()) as any;
        if (data.user) setMyId(data.user.id);
        else window.location.href = "/login";
      } else {
        window.location.href = "/login";
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadMsgs(userId: string, name: string) {
    setActive(userId);
    setActiveName(name);
    try {
      const res = await fetch(`/api/messages?with=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const data = (await res.json()) as any;
        setMsgs(data.messages || []);
      }
    } finally {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
    loadConvs();
  }

  useEffect(() => {
    loadConvs();
    const to = searchParams.get("to");
    const name = searchParams.get("name");
    if (to) loadMsgs(to, name || "Sohbet");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Aktif sohbeti periyodik yenile
  useEffect(() => {
    if (!active) return;
    const t = setInterval(async () => {
      try {
        const res = await fetch(`/api/messages?with=${encodeURIComponent(active)}`);
        if (res.ok) {
          const data = (await res.json()) as any;
          setMsgs(data.messages || []);
        }
      } catch { /* yoksay */ }
    }, 5000);
    return () => clearInterval(t);
  }, [active]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView();
  }, [msgs]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !active || sending) return;
    setSending(true);
    const content = text.trim();
    setText("");
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toUserId: active, content }),
      });
      if (res.ok) {
        const data = (await res.json()) as any;
        setMsgs((prev) => [...prev, { id: data.id, senderId: myId || "", content, createdAt: Date.now() / 1000 }]);
        loadConvs();
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }
    } finally {
      setSending(false);
    }
  }

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-gray-400 animate-pulse">Yükleniyor...</div>;

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500">
      <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden flex flex-col md:flex-row min-h-[70vh]">
        {/* Konuşma listesi */}
        <div className={`w-full md:w-80 border-b md:border-b-0 md:border-r border-white/5 flex flex-col ${active ? "hidden md:flex" : "flex"}`}>
          <div className="p-4 border-b border-white/5 flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            <h1 className="font-bold text-white">Mesajlar</h1>
          </div>
          <div className="flex-1 overflow-y-auto">
            {convs.length === 0 ? (
              <p className="text-gray-500 text-xs p-4">Henüz konuşman yok. Birinin profiline gidip mesaj gönderebilirsin.</p>
            ) : (
              convs.map((c) => (
                <button
                  key={c.id}
                  onClick={() => c.other && loadMsgs(c.other.id, c.other.username)}
                  className={`w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors flex items-center gap-3 ${active === c.other?.id ? "bg-white/5" : ""}`}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/40 to-accent/40 flex items-center justify-center font-bold text-white flex-shrink-0">
                    {(c.other?.username || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-white truncate">{c.other?.username || "?"}</span>
                      {c.unread > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary text-black font-bold">{c.unread}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{c.lastMessage?.content || "Henüz mesaj yok"}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Sohbet penceresi */}
        <div className={`flex-1 flex-col min-h-[60vh] ${active ? "flex" : "hidden md:flex"}`}>
          {!active ? (
            <div className="flex-1 flex items-center justify-center text-gray-600 text-sm p-8 text-center">
              Soldan bir konuşma seç veya bir profil üzerinden yeni mesaj başlat.
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-white/5 flex items-center gap-2">
                <button onClick={() => setActive(null)} className="md:hidden text-gray-400 hover:text-white">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <User className="w-4 h-4 text-gray-500" />
                <Link href={`/kullanici/${encodeURIComponent(activeName)}`} className="font-bold text-white text-sm hover:text-primary">
                  {activeName}
                </Link>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[50vh]">
                {msgs.map((m) => {
                  const mine = m.senderId === myId;
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm leading-relaxed break-words ${
                          mine ? "bg-primary/20 border border-primary/30 text-white rounded-br-md" : "bg-surface-light border border-white/10 text-gray-200 rounded-bl-md"
                        }`}
                      >
                        {m.content}
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
              <form onSubmit={send} className="p-3 border-t border-white/5 flex gap-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  maxLength={2000}
                  placeholder="Mesajını yaz..."
                  className="flex-1 bg-surface border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/50"
                />
                <button
                  type="submit"
                  disabled={!text.trim() || sending}
                  className="px-4 py-2.5 rounded-xl bg-primary text-black font-bold hover:scale-105 transition-transform disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
