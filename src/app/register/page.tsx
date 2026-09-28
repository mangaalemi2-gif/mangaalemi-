import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 glass-panel p-10 rounded-3xl border border-white/10 shadow-2xl relative">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-accent/20 blur-[50px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-primary/20 blur-[50px] rounded-full pointer-events-none" />
        
        <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-white">
            Kayıt Ol
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Aramıza katıl ve maceraya başla!
          </p>
        </div>
        <form className="mt-8 space-y-6" action="#" method="POST">
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="sr-only">Kullanıcı Adı</label>
              <input id="username" name="username" type="text" required className="appearance-none rounded-xl relative block w-full px-4 py-3 bg-surface-light border border-white/10 placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all sm:text-sm" placeholder="Kullanıcı Adı" />
            </div>
            <div>
              <label htmlFor="email" className="sr-only">Email Adresi</label>
              <input id="email" name="email" type="email" autoComplete="email" required className="appearance-none rounded-xl relative block w-full px-4 py-3 bg-surface-light border border-white/10 placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all sm:text-sm" placeholder="Email Adresi" />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Şifre</label>
              <input id="password" name="password" type="password" required className="appearance-none rounded-xl relative block w-full px-4 py-3 bg-surface-light border border-white/10 placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all sm:text-sm" placeholder="Şifre" />
            </div>
          </div>

          <div>
            <button type="submit" className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-accent hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent hover:shadow-[0_0_20px_rgba(157,0,255,0.4)] transition-all">
              Hesap Oluştur
            </button>
          </div>
        </form>
        <div className="mt-6 text-center text-sm text-gray-400">
          Zaten hesabın var mı?{' '}
          <Link href="/login" className="font-bold text-primary hover:text-primary/80 transition-colors">
            Giriş Yap
          </Link>
        </div>
      </div>
    </div>
  );
}
