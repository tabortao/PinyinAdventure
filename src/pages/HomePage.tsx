import { useEffect, useState } from 'react';
import { getLevels, getUserProgress, getTotalScore } from '../db/api';
import { useAuth } from '../context/AuthContext';
import { Level, UserProgress } from '../types/types';
import { Link } from 'react-router-dom';
import { Star, Lock, Play, Trophy, BrainCircuit, RefreshCcw } from 'lucide-react';

export const HomePage = () => {
  const { user } = useAuth();
  const [levels, setLevels] = useState<Level[]>([]);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [levelsData, progressData, scoreData] = await Promise.all([
          getLevels(),
          user ? getUserProgress(user.id) : Promise.resolve([]),
          user ? getTotalScore(user.id) : Promise.resolve(0)
        ]);
        setLevels(levelsData);
        setProgress(progressData);
        setTotalScore(scoreData);
      } catch (error) {
        console.error('Failed to fetch data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  // Group levels by Grade
  const levelsByGrade = levels.reduce((acc, level) => {
    if (!acc[level.grade]) acc[level.grade] = [];
    acc[level.grade].push(level);
    return acc;
  }, {} as Record<number, Level[]>);

  const isUnlocked = (grade: number, chapter: number) => {
    if (grade === 1 && chapter === 1) return true;
    const flatIndex = levels.findIndex(l => l.grade === grade && l.chapter === chapter);
    if (flatIndex <= 0) return true;
    
    // Simple logic: if previous level in the database list is passed
    // But since we grouped by grade visually, let's keep it simple: 
    // Just check if the immediate previous level ID exists in progress with stars > 0
    // Or just unlock all for demo if user wants? No, let's keep gamification.
    const prevLevel = levels[flatIndex - 1];
    return progress.some(p => p.level_id === prevLevel.id && p.stars > 0);
  };

  const getStars = (levelId: number) => {
    return progress.find(p => p.level_id === levelId)?.stars || 0;
  };
  
  const getScore = (levelId: number) => {
    return progress.find(p => p.level_id === levelId)?.score || 0;
  };

  if (loading) return <div className="text-center py-20 text-brand-primary">正在加载关卡...</div>;

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="text-center mb-8 bg-brand-primary/5 p-6 rounded-3xl">
        <h1 className="text-4xl font-bold text-brand-dark mb-2">拼音闯关大冒险</h1>
        <div className="flex justify-center items-center gap-2 text-brand-secondary font-bold text-xl">
          <Trophy className="fill-brand-secondary" />
          <span>总积分: {totalScore}</span>
        </div>
        <p className="text-slate-500 mt-2 text-sm">完成关卡，收集星星，成为拼音大师！</p>
      </div>

      {Object.entries(levelsByGrade).map(([grade, gradeLevels]) => (
        <div key={grade} className="mb-10">
          <h2 className="text-xl font-bold text-brand-secondary mb-4 flex items-center gap-2 ml-1">
            <span className="bg-brand-secondary text-white px-3 py-1 rounded-full text-xs uppercase tracking-wider shadow-sm">
              Level {grade}
            </span>
            <span className="text-slate-400 text-sm font-normal">年级课程</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {gradeLevels.map((level) => {
              const unlocked = isUnlocked(level.grade, level.chapter);
              const stars = getStars(level.id);
              const score = getScore(level.id);

              return (
                <div key={level.id} className={`
                  relative rounded-xl overflow-hidden border transition-all duration-300
                  ${unlocked 
                    ? 'border-brand-primary/30 bg-white hover:shadow-lg hover:-translate-y-1 hover:border-brand-primary' 
                    : 'border-slate-200 bg-slate-50 opacity-80'
                  }
                `}>
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-3">
                      <div className={`
                        w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold
                        ${unlocked ? 'bg-brand-primary/10 text-brand-primary' : 'bg-slate-200 text-slate-400'}
                      `}>
                        {level.chapter}
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="flex gap-0.5 mb-1">
                          {[1, 2, 3].map(i => (
                            <Star 
                              key={i} 
                              size={12} 
                              className={`${i <= stars ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}`}
                            />
                          ))}
                        </div>
                        {score > 0 && <span className="text-[10px] text-brand-secondary font-bold">+{score}分</span>}
                      </div>
                    </div>
                    
                    <h3 className="font-bold text-md text-slate-800 mb-1 truncate">{level.name}</h3>
                    <p className="text-xs text-slate-500 mb-4 truncate">{level.description}</p>
                    
                    {unlocked ? (
                      <Link 
                        to={`/game/${level.id}`}
                        className="flex items-center justify-center gap-2 w-full bg-brand-primary text-white py-2 rounded-lg text-sm font-bold hover:bg-brand-dark transition-colors"
                      >
                        <Play size={14} fill="currentColor" />
                        开始
                      </Link>
                    ) : (
                      <button disabled className="flex items-center justify-center gap-2 w-full bg-slate-200 text-slate-400 py-2 rounded-lg text-sm font-bold cursor-not-allowed">
                        <Lock size={14} />
                        未解锁
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            
            {/* AI Review Level Card */}
            <div className="relative rounded-xl overflow-hidden border border-brand-accent/30 bg-gradient-to-br from-white to-pink-50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 hover:border-brand-accent">
               <div className="p-4 h-full flex flex-col">
                  <div className="flex justify-between items-center mb-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold bg-brand-accent/10 text-brand-accent">
                      <BrainCircuit size={20} />
                    </div>
                    <div className="bg-brand-accent text-white text-[10px] px-2 py-0.5 rounded-full">
                      AI 推荐
                    </div>
                  </div>
                  
                  <h3 className="font-bold text-md text-slate-800 mb-1">AI 智能复习</h3>
                  <p className="text-xs text-slate-500 mb-4">根据Level {grade} 错题定制</p>
                  
                  <Link 
                    to={`/game/review-${grade}`}
                    className="mt-auto flex items-center justify-center gap-2 w-full bg-brand-accent text-white py-2 rounded-lg text-sm font-bold hover:bg-pink-600 transition-colors"
                  >
                    <RefreshCcw size={14} />
                    巩固练习
                  </Link>
               </div>
            </div>

          </div>
        </div>
      ))}
    </div>
  );
};
