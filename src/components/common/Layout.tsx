import { useAuth } from '../../context/AuthContext';
import { Link, Outlet, useLocation } from 'react-router-dom';

export const Layout = () => {
  const { profile, signOut } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path ? 'text-brand-secondary font-bold' : 'text-white hover:text-brand-secondary';

  return (
    <div className="min-h-screen bg-brand-background font-sans text-slate-800">
      <header className="bg-brand-primary text-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold flex items-center gap-2">
            🐼 智能拼音大闯关
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className={isActive('/')}>闯关地图</Link>
            <Link to="/mistakes" className={isActive('/mistakes')}>错音本</Link>
            <Link to="/settings" className={isActive('/settings')}>设置</Link>
          </nav>

          <div className="flex items-center gap-4">
            {profile ? (
              <>
                <span className="text-sm font-medium bg-brand-dark/20 px-3 py-1 rounded-full">
                  🎓 {profile.username}
                </span>
                <button 
                  onClick={() => signOut()}
                  className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded text-sm transition-colors"
                >
                  退出
                </button>
              </>
            ) : (
              <Link to="/login" className="bg-white text-brand-primary px-4 py-2 rounded-full font-bold shadow hover:bg-gray-100 transition-colors">
                登录 / 注册
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>

      <footer className="text-center py-6 text-slate-400 text-sm">
        © 2025 智能拼音大闯关
      </footer>
    </div>
  );
};
