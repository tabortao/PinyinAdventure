import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Play, Lock, Star, Ship } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getLevels, getUserProgress } from '../db/api';
import { Level, UserProgress } from '../types/types';
import { cn } from '../lib/utils';

export const FishingLevelSelectPage = () => {
  const { stageId } = useParams<{ stageId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [levels, setLevels] = useState<Level[]>([]);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);

  // Map stageId (11, 12, 13) to title
  const stageInfo = {
      '11': { title: '简单水域', bg: 'bg-cyan-50 dark:bg-slate-950' },
      '12': { title: '中级深海', bg: 'bg-blue-50 dark:bg-slate-950' },
      '13': { title: '困难远洋', bg: 'bg-indigo-50 dark:bg-slate-950' }
  }[stageId || '11'] || { title: '未知海域', bg: 'bg-slate-50' };

  useEffect(() => {
    const fetchData = async () => {
      if (!stageId) return;
      try {
        setLoading(true);
        const grade = parseInt(stageId);
        
        // Fetch levels for this "grade" (difficulty)
        // Note: Our generated data uses grades 11, 12, 13
        const [lvlData, progData] = await Promise.all([
             getLevels(grade),
             user ? getUserProgress(user.id) : Promise.resolve([])
        ]);
        
        setLevels(lvlData.sort((a,b) => a.chapter - b.chapter));
        setProgress(progData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [stageId, user]);

  const isUnlocked = (levelId: number, index: number) => {
      if (index === 0) return true;
      // Check if previous level is completed
      // Since levels are sorted by chapter
      const prevLevel = levels[index - 1];
      if (!prevLevel) return true;
      
      const prevProg = progress.find(p => p.level_id === prevLevel.id);
      return prevProg && (prevProg.score > 0 || prevProg.stars > 0);
  };

  const getLevelProgress = (levelId: number) => {
      return progress.find(p => p.level_id === levelId);
  };

  if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-cyan-50 dark:bg-slate-950">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
        </div>
      );
  }

  return (
    <div className={`min-h-screen ${stageInfo.bg} transition-colors pb-16`}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-4 shadow-sm transition-colors">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => navigate('/fishing')}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <ArrowLeft className="text-slate-600 dark:text-slate-300" />
          </button>
          <h1 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
             {stageInfo.title}
          </h1>
          <div className="w-10" /> 
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-6">
          {levels.length === 0 ? (
              <div className="text-center py-20 text-slate-400">
                  <Ship size={64} className="mx-auto mb-4 opacity-50" />
                  <p>该海域暂未发现岛屿 (No levels found)</p>
                  <p className="text-xs mt-2">ID: {stageId}</p>
              </div>
          ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {levels.map((level, index) => {
                      const unlocked = isUnlocked(level.id, index);
                      const prog = getLevelProgress(level.id);
                      const stars = prog?.stars || 0;

                      return (
                          <button
                            key={level.id}
                            disabled={!unlocked}
                            onClick={() => navigate(`/fishing/game/${level.id}`)}
                            className={cn(
                                "relative aspect-square rounded-2xl p-4 flex flex-col items-center justify-between transition-all duration-300 border-2",
                                unlocked 
                                  ? "bg-white dark:bg-slate-800 border-cyan-100 dark:border-slate-700 hover:border-cyan-400 hover:shadow-lg hover:-translate-y-1" 
                                  : "bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60 cursor-not-allowed"
                            )}
                          >
                             {/* Level Badge */}
                             <div className={cn(
                                 "w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-inner",
                                 unlocked ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300" : "bg-slate-200 text-slate-400 dark:bg-slate-800"
                             )}>
                                 {level.chapter}
                             </div>

                             {/* Content */}
                             <div className="flex-1 flex flex-col items-center justify-center w-full">
                                 {unlocked ? (
                                     <>
                                        <div className="text-center mb-1">
                                            <div className="font-bold text-slate-800 dark:text-white text-sm md:text-base line-clamp-1">{level.name}</div>
                                            {/* <div className="text-[10px] text-slate-400 hidden md:block">{level.description}</div> */}
                                        </div>
                                        <div className="flex gap-0.5 mt-1">
                                            {[1,2,3].map(s => (
                                                <Star key={s} size={12} className={s <= stars ? "fill-yellow-400 text-yellow-400" : "text-slate-200 dark:text-slate-700"} />
                                            ))}
                                        </div>
                                     </>
                                 ) : (
                                     <Lock className="text-slate-300 dark:text-slate-600" />
                                 )}
                             </div>

                             {/* Action Text */}
                             <div className="w-full text-center">
                                 <span className={cn(
                                     "text-xs font-bold uppercase",
                                     unlocked ? "text-cyan-600" : "text-slate-400"
                                 )}>
                                     {unlocked ? "开始" : "未解锁"}
                                 </span>
                             </div>
                          </button>
                      );
                  })}
              </div>
          )}
      </div>
    </div>
  );
};
