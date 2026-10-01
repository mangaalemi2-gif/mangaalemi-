"use client";

import { useState, useEffect } from "react";
import { Gift, Copy, Check, Users } from "lucide-react";

export default function ReferralPanel() {
  const [code, setCode] = useState("");
  const [invites, setInvites] = useState(0);
  const [earned, setEarned] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/referral");
        if (res.ok) {
          const data = (await res.json()) as any;
          setCode(data.code || "");
          setInvites(data.invites || 0);
          setEarned(data.earned || 0);
        }
      } catch { /* yoksay */ }
    }
    load();
  }, []);

  if (!code) return null;

  const link = typeof window !== "undefined" ? `${window.location.origin}/register?ref=${code}` : "";

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* yoksay */ }
  }

  return (
    <div className="glass-panel rounded-2xl p-6 border border-accent/25">
      <h3 className="font-bold text-white mb-1 flex items-center gap-2">
        <Gift className="w-5 h-5 text-accent" /> Davet Et, XP Kazan
      </h3>
      <p className="text-xs text-gray-500 mb-3">
        Linkinle kaydolana <b className="text-gray-300">+100 XP</b>, onun yorum/bölüm/anket/başarım kazancının <b className="text-gray-300">%20'si</b> sana eklenir.
      </p>
      <div className="flex gap-2 mb-3">
        <input
          readOnly
          value={link}
          onClick={(e) => (e.target as HTMLInputElement).select()}
          className="flex-1 bg-surface border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none"
        />
        <button onClick={copy} className="px-3 py-2 rounded-xl bg-accent text-white text-xs font-bold hover:scale-105 transition-transform flex items-center gap-1 keep-white">
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Kopyalandı" : "Kopyala"}
        </button>
      </div>
      <div className="flex items-center gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {invites} davet</span>
        <span className="font-bold text-primary">+{earned} XP kazandın</span>
      </div>
    </div>
  );
}
