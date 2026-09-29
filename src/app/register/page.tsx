"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Kayıt başarısız.");
        setLoading(false);
        return;
      }

      router.push("/profile");
      router.refresh();
    } catch (err) {
      setError("Bir hata oluştu. Tekrar deneyin.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 glass-panel p-10 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-accent/20 blur-[50px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-primary/20 blur-[50px] rounded-full pointer-events-none" />

        <div className="relative z-10">
          <h2 className="mt-2 text-center text-3xl font-extrabold text-white">
            Kayıt Ol
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Aramıza katıl ve maceraya başla!
          </p>
        </div>

        {error && (
          <div className="relative z-10 bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6 relative z-10" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="sr-only">Kullanıcı Adı</label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="appearance-none rounded-xl relative block w-full px-4 py-3 bg-surface-light border border-white/10 placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all sm:text-sm"
                placeholder="Kullanıcı Adı"
              />
            </div>
            <div>
              <label htmlFor="email" className="sr-only">Email Adresi</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-xl relative block w-full px-4 py-3 bg-surface-light border border-white/10 placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all sm:text-sm"
                placeholder="Email Adresi"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Şifre</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-xl relative block w-full px-4 py-3 bg-surface-light border border-white/10 placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all sm:text-sm"
                placeholder="Şifre (min. 6 karakter)"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-accent hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent hover:shadow-[0_0_20px_rgba(157,0,255,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Hesap oluşturuluyor..." : "Hesap Oluştur"}
            </button>
          </div>
        </form>
        <div className="mt-6 text-center text-sm text-gray-400 relative z-10">
          Zaten hesabın var mı?{" "}
          <Link href="/login" className="font-bold text-primary hover:text-primary/80 transition-colors">
            Giriş Yap
          </Link>
        </div>
      </div>
    </div>
  );
}
