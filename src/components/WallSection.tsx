"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Send, Trash2, PenLine } from "lucide-react";

interface Post {
  id: string;
  content: string;
  createdAt: any;
  authorId: string | null;
  authorName: string | null;
}

export default function WallSection({ username, profileUserId }: { username: string; profileUserId: string }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [myId, setMyId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [wRes, meRes] = await Promise.all([
        fetch(`/api/wall?user=${encodeURIComponent(username)}`),
        fetch("/api/auth/me"),
      ]);
      if (wRes.ok) {
        const data = (await wRes.json()) as any;
        setPosts(data.posts || []);
      }
      if (meRes.ok) {
        const data = (await meRes.json()) as any;
        if (data.user) {
          setMyId(data.user.id);
          setIsAdmin(data.user.role === "admin");
        }
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || sending) return;
    if (!myId) {
      window.location.href = "/login";
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/wall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileUserId, content: text.trim() }),
      });
      const data = (await res.json()) as any;
      if (!res.ok) {
        alert(data.error || "Gönderilemedi.");
        return;
      }
      setText("");
      load();
    } finally {
      setSending(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Duvar yazısı silinsin mi?")) return;
    const res = await fetch(`/api/wall?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (res.ok) setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="glass-panel rounded-3xl p-6 border border-white/10">
      <h2 className="font-bold text-white mb-4 flex items-center gap-2">
        <PenLine className="w-5 h-5 text-accent" /> Ziyaretçi Defteri
      </h2>

      {myId ? (
        <form onSubmit={submit} className="flex gap-2 mb-4">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={500}
            placeholder="Duvara bir şey yaz..."
            className="flex-1 bg-surface border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-accent/50"
          />
          <button
            type="submit"
            disabled={!text.trim() || sending}
            className="px-4 py-2.5 rounded-xl bg-accent text-white font-bold hover:scale-105 transition-transform disabled:opacity-50 keep-white"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      ) : (
        <p className="text-xs text-gray-500 mb-4">
          Yazmak için <Link href="/login" className="text-primary hover:underline">giriş yap</Link>.
        </p>
      )}

      {loading ? (
        <p className="text-gray-500 text-sm animate-pulse">Yükleniyor...</p>
      ) : posts.length === 0 ? (
        <p className="text-gray-500 text-sm">Henüz yazı yok. İlk yazan sen ol!</p>
      ) : (
        <div className="space-y-2">
          {posts.map((p) => (
            <div key={p.id} className="bg-surface-light/40 border border-white/5 rounded-xl p-3">
              <div className="flex items-center justify-between gap-2">
                {p.authorName ? (
                  <Link href={`/kullanici/${encodeURIComponent(p.authorName)}`} className="text-xs font-bold text-primary hover:underline">
                    @{p.authorName}
                  </Link>
                ) : (
                  <span className="text-xs text-gray-600">Silinmiş kullanıcı</span>
                )}
                {(myId === p.authorId || isAdmin) && (
                  <button onClick={() => remove(p.id)} className="text-gray-700 hover:text-red-400" title="Sil">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-200 mt-1">{p.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
