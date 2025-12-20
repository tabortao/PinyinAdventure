import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getLevels, getUserQuizProgress } from '../db/api';
import { Level, UserQuizProgress } from '../types/types';
import { ArrowLeft, Star, Lock, Play, Trophy, Filter, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';

export const QuizLevelsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [levels, setLevels] = useState<Level[]>([]);
  const [progress, setProgress] = useState<UserQuizProgress[]>([]);
  const [selectedGrade, setSelectedGrade] = useState(() => {
    const saved = localStorage.getItem('lastSelectedQuizGrade');
    return saved ? parseInt(saved) : 1;
  });
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('lastSelectedQuizGrade', selectedGrade.toString());
  }, [selectedGrade]);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    const [allLevels, userProgress] = await Promise.all([
      getLevels(),
      getUserQuizProgress(user.id)
    ]);
    setLevels(allLevels);
    setProgress(userProgress);
    setLoading(false);
  };

  // Group levels by grade
  const levelsByGrade = levels.reduce((acc, level) => {
    const g = level.grade || 1;
    if (!acc[g]) acc[g] = [];
    acc[g].push(level);
    return acc;
  }, {} as Record<number, Level[]>);

  // Helper to check status
  const getLevelStatus = (levelId: number) => {
    const level = levels.find(l => l.id === levelId);
    // Level 1 or Chapter 1 of any grade is always unlocked
    if (levelId === 1 || (level && level.chapter === 1)) return { status: 'unlocked', score: 0 };

    const p = progress.find(item => item.level_id === levelId);
    if (p) return { status: 'completed', score: p.score };

    // Check previous level
    const prevLevelProgress = progress.find(item => item.level_id === levelId - 1);
    if (prevLevelProgress) { 
       return { status: 'unlocked', score: 0 };
    }
    
    return { status: 'locked', score: 0 };
  };

  const EMOJIS = ['🍎', '🍊', '🍇', '🍉', '🍌', '🍍', '🍑', '🍒', '🍓', '🥝'];

  const currentGradeLevels = levelsByGrade[selectedGrade] || [];

  if (loading) {
     return (
       <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
       </div>
     );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 transition-colors">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-4 shadow-sm transition-colors">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => navigate('/')}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <ArrowLeft className="text-slate-600 dark:text-slate-300" />
          </button>
          <h1 className="text-xl font-black text-slate-800 dark:text-white">看字识音闯关</h1>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        
        {/* Hero Banner with Filter */}
        <div className="text-center mb-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl relative transition-colors shadow-sm">
           <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white mb-2 transition-colors">看字识音闯关</h1>
           <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm mb-4 md:mb-0 transition-colors">挑战你的汉字识音能力！</p>
           
           {/* Filter Toggle */}
           <div className="md:absolute md:top-6 md:right-6 flex justify-center mt-3 md:mt-0">
             <div className="relative inline-block text-left">
                <button 
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-full text-sm font-bold shadow-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                >
                  <Filter size={14} />
                  <span>Level {selectedGrade}</span>
                  <ChevronDown size={14} className={`transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isFilterOpen && (
                  <div className="absolute left-1/2 -translate-x-1/2 md:left-auto md:right-0 md:translate-x-0 top-full mt-2 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 p-2 min-w-[150px] z-10 animate-in fade-in zoom-in duration-200">
                    {[1, 2, 3, 4, 5, 6].map(g => (
                      <button 
                        key={g}
                        onClick={() => { setSelectedGrade(g); setIsFilterOpen(false); }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 ${selectedGrade === g ? 'text-brand-primary bg-brand-primary/5 dark:bg-brand-primary/10' : 'text-slate-600 dark:text-slate-300'}`}
                      >
                        Level {g}
                      </button>
                    ))}
                  </div>
                )}
             </div>
           </div>
        </div>

        {/* Level Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {currentGradeLevels.length > 0 ? (
             <>
               {currentGradeLevels.sort((a,b) => a.id - b.id).map((level) => {
                 const { status, score } = getLevelStatus(level.id);
                 const isLocked = status === 'locked';
                 
                 return (
                   <button
                     key={level.id}
                     disabled={isLocked}
                     onClick={() => navigate(`/quiz-game/${level.id}`)}
                     className={cn(
                       "relative group aspect-[4/5] rounded-3xl p-4 flex flex-col items-center justify-between transition-all duration-300 border-2",
                       isLocked 
                         ? "bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-80 cursor-not-allowed" 
                         : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-brand-primary/50 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
                     )}
                   >
                      {/* Level Number/Emoji */}
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-2xl shadow-inner mb-2",
                        isLocked 
                          ? "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 grayscale" 
                          : "bg-brand-primary/10 text-brand-primary"
                      )}>
                        {EMOJIS[(level.chapter - 1) % EMOJIS.length]}
                      </div>

                      {/* Status Icon */}
                      <div className="flex-1 flex items-center justify-center">
                         {isLocked ? (
                           <Lock size={40} className="text-slate-300 dark:text-slate-700" />
                         ) : status === 'completed' ? (
                           <div className="text-center">
                              <div className="text-4xl mb-2">🏆</div>
                              <div className="text-brand-primary font-bold text-lg">{score}分</div>
                           </div>
                         ) : (
                           <div className="w-16 h-16 rounded-full bg-brand-primary text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                              <Play size={32} fill="currentColor" />
                           </div>
                         )}
                      </div>

                      {/* Footer */}
                      <div className="w-full text-center">
                        <div className={cn(
                          "text-xs font-bold uppercase tracking-wider",
                          isLocked ? "text-slate-400 dark:text-slate-600" : "text-slate-500 dark:text-slate-400"
                        )}>
                          PART {level.chapter}
                        </div>
                      </div>
                   </button>
                 );
               })}
               
               {/* AI Challenge Card (Last Item) */}
               <button
                 onClick={() => navigate('/quiz-game/ai')}
                 className="relative group aspect-[4/5] rounded-3xl p-4 flex flex-col items-center justify-between transition-all duration-300 border-2 border-violet-200 dark:border-violet-900 bg-gradient-to-br from-violet-50 to-white dark:from-slate-900 dark:to-violet-950/20 hover:border-violet-400 hover:shadow-xl hover:-translate-y-1 cursor-pointer overflow-hidden"
               >
                  {/* Decorative Background */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full translate-x-10 -translate-y-10 blur-xl"></div>
                  
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-2xl shadow-inner mb-2 bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-300 relative z-10">
                    🤖
                  </div>

                  {/* Status Icon */}
                  <div className="flex-1 flex items-center justify-center relative z-10">
                    <div className="text-center">
                       <div className="w-16 h-16 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform mb-2 mx-auto">
                          <Play size={32} fill="currentColor" />
                       </div>
                       <div className="text-violet-500 dark:text-violet-300 font-bold text-sm">
                         智能特训
                       </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="w-full text-center relative z-10">
                    <div className="text-xs font-bold uppercase tracking-wider text-violet-400 dark:text-violet-500">
                      AI CHALLENGE
                    </div>
                  </div>
               </button>
             </>
          ) : (
            <div className="col-span-full py-20 text-center text-slate-400 dark:text-slate-500">
               <p>该年级暂无关卡数据</p>
               <p className="text-xs mt-2 opacity-50">请尝试刷新或重置数据库</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
