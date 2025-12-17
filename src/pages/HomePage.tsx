import { useNavigate } from 'react-router-dom';
import { BookOpen, Gamepad2, Map, Trophy, BookX, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 pb-24 transition-colors">
       <div className="max-w-md mx-auto pt-6 md:pt-10">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black text-brand-dark dark:text-white mb-2 tracking-tight">
              拼音学习助手
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              快乐学习，轻松掌握汉语拼音
            </p>
          </div>
          
          <div className="space-y-4">
             {/* Study - Pinyin Basics */}
             <button 
               onClick={() => navigate('/study')}
               className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 p-6 rounded-3xl flex items-center gap-5 hover:border-brand-primary hover:shadow-lg transition-all group text-left relative overflow-hidden"
             >
                <div className="absolute right-0 top-0 w-24 h-24 bg-blue-500/5 rounded-bl-[100px] transition-transform group-hover:scale-150" />
                
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm relative z-10">
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
                
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 text-purple-500 dark:text-purple-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm relative z-10">
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
                
                <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 text-orange-500 dark:text-orange-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm relative z-10">
                   <Map size={32} />
                </div>
                <div className="relative z-10">
                   <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1 group-hover:text-brand-primary transition-colors">拼音大冒险</h3>
                   <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">循序渐进的关卡挑战</p>
                </div>
             </button>

             {/* Extra Grid for Mistakes / Settings */}
             <div className="grid grid-cols-2 gap-4">
               <button 
                 onClick={() => navigate('/mistakes')}
                 className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 p-4 rounded-3xl flex flex-col items-center gap-3 hover:border-brand-primary hover:shadow-lg transition-all group relative overflow-hidden"
               >
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                     <BookX size={24} />
                  </div>
                  <span className="font-bold text-slate-700 dark:text-slate-200">错音本</span>
               </button>

               <button 
                 onClick={() => navigate('/settings')}
                 className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 p-4 rounded-3xl flex flex-col items-center gap-3 hover:border-brand-primary hover:shadow-lg transition-all group relative overflow-hidden"
               >
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                     <Settings size={24} />
                  </div>
                  <span className="font-bold text-slate-700 dark:text-slate-200">设置</span>
               </button>
             </div>

          </div>
       </div>
    </div>
  );
};
