import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User, Trophy, Menu, X, Settings, Gamepad2, BookX, HelpCircle, BookOpen, Home, Map } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getTotalScore } from '../../db/api';

export const Layout = () => {
  const { profile, signOut, user } = useAuth();
  const location = useLocation();
  const [totalScore, setTotalScore] = useState(0);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Fetch score
  useEffect(() => {
    if (user) {
      getTotalScore(user.id).then(setTotalScore);
      const interval = setInterval(() => {
        getTotalScore(user.id).then(setTotalScore);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [user, location.pathname]); 

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { name: '首页', path: '/', icon: <Home size={24} /> },
    { name: '拼音', path: '/study', icon: <BookOpen size={24} /> },
    { name: '大冒险', path: '/adventure', icon: <Map size={24} /> },
    { name: '错音本', path: '/mistakes', icon: <BookX size={24} /> },
    { name: '设置', path: '/settings', icon: <Settings size={24} /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans transition-colors duration-300">
      {/* Top Navbar */}
      <nav className="bg-brand-primary dark:bg-slate-900 text-white shadow-lg sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-4 h-14 md:h-16 flex items-center justify-between">
          
          {/* Left: Brand + Desktop Nav */}
          <div className="flex items-center gap-6">
             <Link to="/" className="text-lg md:text-2xl font-bold tracking-tight flex items-center gap-2">
               <span>智能拼音大闯关</span>
             </Link>

             {/* Desktop Nav Links */}
             <div className="hidden md:flex items-center gap-6 ml-4">
               {navItems.map(item => (
                 <Link 
                   key={item.path} 
                   to={item.path}
                   className={`flex items-center gap-2 text-sm font-bold transition-colors ${isActive(item.path) ? 'text-white' : 'text-white/70 hover:text-white'}`}
                 >
                   {item.name}
                 </Link>
               ))}
             </div>
          </div>

          {/* Right: Score + User */}
          <div className="flex items-center gap-3 md:gap-4">
            {user && (
              <div className="flex items-center gap-1.5 bg-black/20 px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-bold shadow-inner">
                <Trophy size={14} className="text-yellow-300 fill-yellow-300 md:w-4 md:h-4" />
                <span>{totalScore}</span>
              </div>
            )}

            {!user && (
              <Link to="/login" className="text-sm font-bold hover:underline">登录</Link>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 relative pb-20 md:pb-0 dark:bg-slate-950 transition-colors duration-300">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 dark:border-slate-800 border-t border-slate-200 flex justify-around items-center h-16 z-50 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] transition-colors duration-300">
        {navItems.map((item) => (
          <Link 
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center w-full h-full transition-colors ${isActive(item.path) ? 'text-brand-primary dark:text-brand-primary' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400'}`}
          >
            <div className={`transition-transform duration-200 ${isActive(item.path) ? 'scale-110' : 'scale-100'}`}>
               {item.icon}
            </div>
            <span className="text-[10px] font-bold mt-1">{item.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};
