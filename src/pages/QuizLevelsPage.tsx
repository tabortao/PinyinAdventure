import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getLevels, getUserQuizProgress } from '../db/api';
import { Level, UserQuizProgress } from '../types/types';
import { ArrowLeft, Star, Lock, Play, Trophy } from 'lucide-react';
import { cn } from '../lib/utils';

export const QuizLevelsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [levels, setLevels] = useState<Level[]>([]);
  const [progress, setProgress] = useState<UserQuizProgress[]>([]);
  const [selectedGrade, setSelectedGrade] = useState(1);
  const [loading, setLoading] = useState(true);

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
    // Level 1 is always unlocked
    if (levelId === 1) return { status: 'unlocked', score: 0 };

    const p = progress.find(item => item.level_id === levelId);
    if (p) return { status: 'completed', score: p.score };

    // Check previous level
    // This assumes sequential IDs which might not be robust if we have gaps or other level sets.
    // Better logic: Find the level before this one in the SAME grade list?
    // Or just check if levelId - 1 is completed.
    // Given my seed data is sequential:
    const prevLevelProgress = progress.find(item => item.level_id === levelId - 1);
    if (prevLevelProgress || levelId === 1) { // Redundant levelId=1 check but safe
       return { status: 'unlocked', score: 0 };
    }
    
    return { status: 'locked', score: 0 };
  };

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
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => navigate('/study')}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <ArrowLeft className="text-slate-600 dark:text-slate-300" />
          </button>
          <h1 className="text-xl font-black text-slate-800 dark:text-white">看字识音闯关</h1>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        
        {/* Grade Tabs */}
        <div className="flex overflow-x-auto gap-2 py-4 mb-4 no-scrollbar">
          {[1, 2, 3, 4, 5, 6].map(grade => (
            <button
              key={grade}
              onClick={() => setSelectedGrade(grade)}
              className={cn(
                "flex-none px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-sm whitespace-nowrap",
                selectedGrade === grade 
                  ? "bg-brand-primary text-white scale-105 shadow-md ring-2 ring-brand-primary/20" 
                  : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
              )}
            >
              {grade}年级
            </button>
          ))}
        </div>

        {/* Level Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {currentGradeLevels.length > 0 ? (
             currentGradeLevels.sort((a,b) => a.id - b.id).map((level) => {
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
                    {/* Level Number */}
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner mb-2",
                      isLocked 
                        ? "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600" 
                        : "bg-brand-primary/10 text-brand-primary"
                    )}>
                      {level.chapter}
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
                        Level {level.chapter}
                      </div>
                    </div>
                 </button>
               );
             })
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
