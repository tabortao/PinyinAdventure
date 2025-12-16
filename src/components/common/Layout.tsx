import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User, Trophy, Menu, X, Settings, Gamepad2, BookX } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getTotalScore } from '../../db/api';

export const Layout = () => {
  const { profile, signOut, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [totalScore, setTotalScore] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Fetch score in layout to keep it updated globally (or fetch on mount/interval)
  useEffect(() => {
    if (user) {
      getTotalScore(user.id).then(setTotalScore);
      // Optional: Polling or Subscription
      const interval = setInterval(() => {
        getTotalScore(user.id).then(setTotalScore);
      }, 5000); // Update every 5s for quick feedback
      return () => clearInterval(interval);
    }
  }, [user, location.pathname]); 

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { name: '闯关地图', path: '/', icon: <Gamepad2 size={20} /> },
    { name: '错音本', path: '/mistakes', icon: <BookX size={20} /> },
    { name: '设置', path: '/settings', icon: <Settings size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Navbar */}
      <nav className="bg-brand-primary text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-14 md:h-16 flex items-center justify-between">
          
          {/* Left: Hamburger (Mobile) + Brand */}
          <div className="flex items-center gap-3">
             <button 
               className="md:hidden p-1 hover:bg-white/10 rounded-lg transition-colors"
               onClick={() => setIsSidebarOpen(true)}
             >
               <Menu size={24} />
             </button>
             <Link to="/" className="text-lg md:text-2xl font-bold tracking-tight flex items-center gap-2">
               <span className="hidden md:inline">智能拼音大闯关</span>
               <span className="md:hidden">拼音大闯关</span>
             </Link>
          </div>

          {/* Right: Score + User */}
          <div className="flex items-center gap-3 md:gap-4">
            {user && (
              <div className="flex items-center gap-1.5 bg-black/20 px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-bold shadow-inner">
                <Trophy size={14} className="text-yellow-300 fill-yellow-300 md:w-4 md:h-4" />
                <span>{totalScore}</span>
              </div>
            )}

            {user ? (
              <div className="relative">
                <button 
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 hover:bg-white/10 px-2 py-1 rounded-lg transition-colors"
                >
                  <div className="w-7 h-7 md:w-8 md:h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <User size={16} className="md:w-[18px] md:h-[18px]" />
                  </div>
                  <span className="hidden md:inline text-sm font-bold truncate max-w-[100px]">
                    {profile?.username || '学员'}
                  </span>
                </button>

                {/* User Dropdown */}
                {isUserMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setIsUserMenuOpen(false)} 
                    />
                    <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl shadow-xl border border-slate-100 py-1 text-slate-700 z-20 animate-in fade-in zoom-in duration-200 origin-top-right">
                       <div className="px-4 py-2 border-b border-slate-100 text-xs text-slate-400 font-bold md:hidden">
                         {profile?.username}
                       </div>
                       <button 
                         onClick={() => { signOut(); setIsUserMenuOpen(false); }}
                         className="w-full text-left px-4 py-3 text-sm font-bold hover:bg-red-50 hover:text-red-500 flex items-center gap-2 transition-colors"
                       >
                         <LogOut size={16} />
                         退出登录
                       </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link to="/login" className="text-sm font-bold hover:underline">登录</Link>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar Overlay */}
      <div 
        className={`fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-300 md:hidden ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsSidebarOpen(false)}
      >
        <div 
          className={`absolute left-0 top-0 bottom-0 w-64 bg-white shadow-2xl transition-transform duration-300 flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
          onClick={e => e.stopPropagation()}
        >
          <div className="p-4 border-b flex justify-between items-center bg-brand-primary text-white h-14">
            <h2 className="font-bold text-lg">菜单</h2>
            <button onClick={() => setIsSidebarOpen(false)}>
              <X size={24} />
            </button>
          </div>
          <div className="flex-1 p-4 space-y-2">
            {navItems.map((item) => (
              <Link 
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isActive(item.path) ? 'bg-brand-primary text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </div>
          <div className="p-4 border-t text-xs text-center text-slate-400">
            v1.3.0 • 2025
          </div>
        </div>
      </div>

      {/* Desktop Sub-nav */}
      <div className="hidden md:flex justify-center bg-white border-b border-slate-200 shadow-sm">
         <div className="flex gap-8">
           {navItems.map((item) => (
              <Link 
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 py-3 border-b-2 font-bold transition-all text-sm ${isActive(item.path) ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                {item.icon}
                {item.name}
              </Link>
           ))}
         </div>
      </div>

      <main className="flex-1 relative">
        <Outlet />
      </main>
    </div>
  );
};
