"use client";

import { useState } from "react";

interface Props {
  targetType: "user" | "comment";
  targetId: string;
  targetLabel?: string;
  onClose: () => void;
  onDone?: () => void;
}

const REASONS = [
  "Spam / Reklam",
  "Hakaret / Küfür",
  "Nefret söylemi",
  "Cinsel içerik",
  "Telif ihlali",
  "Yanlış bilgi",
  "Diğer",
];

export default function ReportModal({ targetType, targetId, targetLabel, onClose, onDone }: Props) {
  const [reason, setReason] = useState(REASONS[0]);
  const [detail, setDetail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId, reason, detail }),
      });
      const data = (await res.json()) as any;
      if (!res.ok) {
        setError(data.error || "Bildirim gönderilemedi.");
        setLoading(false);
        return;
      }
      setSuccess(true);
      setTimeout(() => {
        onDone?.();
        onClose();
      }, 1200);
    } catch {
      setError("Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md glass-panel rounded-2xl border border-white/10 p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-white mb-1">Bildir</h3>
        <p className="text-xs text-gray-400 mb-4">
          {targetType === "comment" ? "Yorum" : "Kullanıcı"} bildiriliyor{targetLabel ? `: ${targetLabel}` : ""}. İnceleme sonrası gerekli işlem yapılır.
        </p>
        {success ? (
          <div className="text-center py-6">
            <p className="text-primary font-bold">✓ Bildirimin alındı. Teşekkürler!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 font-medium">Sebep</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-1 w-full bg-surface border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-red-500/50"
              >
                {REASONS.map((r) => (
                  <option key={r} value={r} className="bg-surface">{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 font-medium">Detay (opsiyonel)</label>
              <textarea
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Ek açıklama yaz..."
                className="mt-1 w-full bg-surface border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-red-500/50 resize-none"
              />
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl bg-surface-light border border-white/10 text-gray-300 text-sm font-medium hover:text-white transition-colors"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-sm font-bold hover:bg-red-500/30 transition-colors disabled:opacity-50"
              >
                {loading ? "Gönderiliyor..." : "Bildir"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
