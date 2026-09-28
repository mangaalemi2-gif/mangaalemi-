import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 glass-panel p-10 rounded-3xl border border-white/10 shadow-2xl relative">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 blur-[50px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-accent/20 blur-[50px] rounded-full pointer-events-none" />
        
        <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-white">
            Giriş Yap
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            MangaAlemi'ne hoş geldin!
          </p>
        </div>
        <form className="mt-8 space-y-6" action="#" method="POST">
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">Email Adresi</label>
              <input id="email" name="email" type="email" autoComplete="email" required className="appearance-none rounded-xl relative block w-full px-4 py-3 bg-surface-light border border-white/10 placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all sm:text-sm" placeholder="Email Adresi" />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Şifre</label>
              <input id="password" name="password" type="password" autoComplete="current-password" required className="appearance-none rounded-xl relative block w-full px-4 py-3 bg-surface-light border border-white/10 placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all sm:text-sm" placeholder="Şifre" />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded bg-surface-light" />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-400">
                Beni Hatırla
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-primary hover:text-primary/80 transition-colors">
                Şifremi Unuttum
              </a>
            </div>
          </div>

          <div>
            <button type="submit" className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-black bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary hover:shadow-[0_0_20px_rgba(57,255,20,0.4)] transition-all">
              Giriş Yap
            </button>
          </div>
        </form>
        <div className="mt-6 text-center text-sm text-gray-400">
          Hesabın yok mu?{' '}
          <Link href="/register" className="font-bold text-accent hover:text-accent/80 transition-colors">
            Kayıt Ol
          </Link>
        </div>
      </div>
    </div>
  );
}
