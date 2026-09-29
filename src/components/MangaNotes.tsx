"use client";

import { useState, useEffect } from "react";
import { StickyNote, Save, Trash2 } from "lucide-react";

export default function MangaNotes({ mangaSlug }: { mangaSlug: string }) {
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [nRes, meRes] = await Promise.all([
          fetch(`/api/notes?slug=${encodeURIComponent(mangaSlug)}`),
          fetch("/api/auth/me"),
        ]);
        if (meRes.ok) {
          const me = (await meRes.json()) as any;
          setLoggedIn(!!me.user);
        }
        if (nRes.ok) {
          const data = (await nRes.json()) as any;
          if (data.note) {
            setNote(data.note);
            setSaved(data.note);
          }
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [mangaSlug]);

  if (!loggedIn && !loading) return null;

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mangaSlug, content: note.trim() }),
      });
      if (res.ok) setSaved(note.trim() || null);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm("Not silinsin mi?")) return;
    await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mangaSlug, content: "" }),
    });
    setNote("");
    setSaved(null);
  }

  const dirty = note.trim() !== (saved || "");

  return (
    <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden mb-8">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors">
        <div className="flex items-center gap-3">
          <StickyNote className="w-5 h-5 text-yellow-400" />
          <span className="font-bold text-white text-lg">Özel Notlarım</span>
          {saved && <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 font-bold">KAYITLI NOT VAR</span>}
        </div>
        <span className="text-gray-500 text-sm">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="px-6 pb-6 space-y-3">
          <p className="text-[11px] text-gray-500">Bu notları sadece sen görürsün. Teoriler, kaldığın yer hatırlatmaları...</p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            maxLength={2000}
            placeholder="Bu seri hakkında kendine not bırak..."
            className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-yellow-500/40 resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={!dirty || saving}
              className="px-5 py-2 rounded-xl bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 text-sm font-bold hover:scale-105 transition-transform disabled:opacity-40 flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> {saving ? "..." : "Kaydet"}
            </button>
            {saved && (
              <button onClick={remove} className="px-4 py-2 rounded-xl text-xs text-gray-500 hover:text-red-400 flex items-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5" /> Sil
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
