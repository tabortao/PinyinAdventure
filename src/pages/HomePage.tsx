import { useNavigate } from 'react-router-dom';
import { BookOpen, Gamepad2, Map, Trophy, Fish } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 pb-24 transition-colors">
       <div className="max-w-6xl mx-auto pt-2 md:pt-6">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black text-brand-dark dark:text-white mb-2 tracking-tight">
              拼音学习助手
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              快乐学习，轻松掌握汉语拼音
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
             {/* Study - Pinyin Basics */}
             <button 
               onClick={() => navigate('/study')}
               className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 p-6 rounded-3xl flex items-center gap-5 hover:border-brand-primary hover:shadow-lg transition-all group text-left relative overflow-hidden"
             >
                <div className="absolute right-0 top-0 w-24 h-24 bg-blue-500/5 rounded-bl-[100px] transition-transform group-hover:scale-150" />
                
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm relative z-10 shrink-0">
                   <BookOpen size={32} />
                </div>
                <div className="relative z-10">
                   <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1 group-hover:text-brand-primary transition-colors">拼音基础</h3>
                   <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">声母、韵母、整体认读</p>
                </div>
             </button>

             {/* Quiz Levels - Sight Reading */}
             <button 
               onClick={() => navigate('/quiz-levels')}
               className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 p-6 rounded-3xl flex items-center gap-5 hover:border-brand-primary hover:shadow-lg transition-all group text-left relative overflow-hidden"
             >
                <div className="absolute right-0 top-0 w-24 h-24 bg-purple-500/5 rounded-bl-[100px] transition-transform group-hover:scale-150" />
                
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 text-purple-500 dark:text-purple-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm relative z-10 shrink-0">
                   <Gamepad2 size={32} />
                </div>
                <div className="relative z-10">
                   <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1 group-hover:text-brand-primary transition-colors">看字识音</h3>
                   <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">挑战反应力，闯关赢积分</p>
                </div>
             </button>

             {/* Adventure - Original Game */}
             <button 
               onClick={() => navigate('/adventure')}
               className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 p-6 rounded-3xl flex items-center gap-5 hover:border-brand-primary hover:shadow-lg transition-all group text-left relative overflow-hidden"
             >
                <div className="absolute right-0 top-0 w-24 h-24 bg-orange-500/5 rounded-bl-[100px] transition-transform group-hover:scale-150" />
                
                <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 text-orange-500 dark:text-orange-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm relative z-10 shrink-0">
                   <Map size={32} />
                </div>
                <div className="relative z-10">
                   <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1 group-hover:text-brand-primary transition-colors">拼音大冒险</h3>
                   <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">循序渐进的关卡挑战</p>
                </div>
             </button>

             {/* Fishing Game (Moved) */}
             <button 
               onClick={() => navigate('/fishing')}
               className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 p-6 rounded-3xl flex items-center gap-5 hover:border-brand-primary hover:shadow-lg transition-all group text-left relative overflow-hidden"
             >
                <div className="absolute right-0 top-0 w-24 h-24 bg-cyan-500/5 rounded-bl-[100px] transition-transform group-hover:scale-150" />
                
                <div className="w-16 h-16 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-500 dark:text-cyan-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm relative z-10 shrink-0">
                   <Fish size={32} />
                </div>
                <div className="relative z-10">
                   <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1 group-hover:text-brand-primary transition-colors">钓鱼学拼音</h3>
                   <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">60关卡，满载而归！</p>
                </div>
             </button>

          </div>
       </div>
    </div>
  );
};
