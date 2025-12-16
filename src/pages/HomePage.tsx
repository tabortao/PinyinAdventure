import { useEffect, useState } from 'react';
import { getLevels, getUserProgress, getTotalScore } from '../db/api';
import { useAuth } from '../context/AuthContext';
import { Level, UserProgress } from '../types/types';
import { Link } from 'react-router-dom';
import { Star, Lock, Play, BrainCircuit, RefreshCcw, Filter, ChevronDown, Award } from 'lucide-react';

export const HomePage = () => {
  const { user } = useAuth();
  const [levels, setLevels] = useState<Level[]>([]);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  // Default to 1 or load from localStorage
  const [selectedGrade, setSelectedGrade] = useState<number>(() => {
    const saved = localStorage.getItem('lastSelectedGrade');
    return saved ? parseInt(saved) : 1;
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // No need to fetch totalScore here as it is in Layout now, 
        // but we still need levels and progress for cards.
        const [levelsData, progressData] = await Promise.all([
          getLevels(),
          user ? getUserProgress(user.id) : Promise.resolve([])
        ]);
        setLevels(levelsData);
        setProgress(progressData);
      } catch (error) {
        console.error('Failed to fetch data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  // Save selected grade preference
  useEffect(() => {
    localStorage.setItem('lastSelectedGrade', selectedGrade.toString());
  }, [selectedGrade]);

  // Group levels by Grade
  const levelsByGrade = levels.reduce((acc, level) => {
    if (!acc[level.grade]) acc[level.grade] = [];
    acc[level.grade].push(level);
    return acc;
  }, {} as Record<number, Level[]>);

  const displayedGrades = [selectedGrade];

  const isUnlocked = (grade: number, chapter: number) => {
    if (grade === 1 && chapter === 1) return true;
    const flatIndex = levels.findIndex(l => l.grade === grade && l.chapter === chapter);
    if (flatIndex <= 0) return true;
    
    // Previous level ID check
    // Ensure we are checking within the sorted list logic
    // Actually our getLevels returns ordered by grade, chapter.
    const prevLevel = levels[flatIndex - 1];
    
    // Special case: If prev level is from previous grade, we might want to allow start of new grade if prev grade done?
    // For simplicity: sequential unlock across all levels.
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
    <div className="max-w-4xl mx-auto pb-20 px-4 md:px-0">
      {/* Hero Banner with Filter */}
      <div className="text-center mb-8 bg-brand-primary/5 p-6 rounded-3xl relative">
        <h1 className="text-2xl md:text-4xl font-bold text-brand-dark mb-4 md:mb-2">拼音闯关大冒险</h1>
        <p className="text-slate-500 text-xs md:text-sm mb-2 md:mb-0">选择年级，开始你的拼音之旅！</p>
        
        {/* Filter Toggle - Centered on mobile, absolute top-right on desktop */}
        <div className="md:absolute md:top-6 md:right-6 flex justify-center mt-3 md:mt-0">
          <div className="relative inline-block text-left">
             <button 
               onClick={() => setIsFilterOpen(!isFilterOpen)}
               className="flex items-center gap-1 bg-white border border-brand-primary/20 text-brand-primary px-4 py-2 rounded-full text-sm font-bold shadow-sm hover:bg-brand-primary/5 transition-all"
             >
               <Filter size={14} />
               <span>Level {selectedGrade}</span>
               <ChevronDown size={14} className={`transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
             </button>
             
             {isFilterOpen && (
               <div className="absolute left-1/2 -translate-x-1/2 md:left-auto md:right-0 md:translate-x-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-slate-100 p-2 min-w-[150px] z-10 animate-in fade-in zoom-in duration-200">
                 {[1, 2, 3, 4, 5, 6].map(g => (
                   <button 
                     key={g}
                     onClick={() => { setSelectedGrade(g); setIsFilterOpen(false); }}
                     className={`w-full text-left px-3 py-2 rounded-lg text-sm font-bold hover:bg-slate-50 ${selectedGrade === g ? 'text-brand-primary bg-brand-primary/5' : 'text-slate-600'}`}
                   >
                     Level {g}
                   </button>
                 ))}
               </div>
             )}
          </div>
        </div>
      </div>

      {displayedGrades.map((grade) => {
        const gradeLevels = levelsByGrade[grade];
        if (!gradeLevels) return (
          <div key={grade} className="text-center py-10 text-slate-400">
            该等级暂无关卡，请联系管理员。
          </div>
        );

        return (
        <div key={grade} className="mb-10 animate-in slide-in-from-bottom-4 fade-in duration-500">
          <div className="flex items-center gap-2 mb-4 ml-1">
             <span className="bg-brand-secondary text-white px-3 py-1 rounded-full text-xs uppercase tracking-wider shadow-sm font-bold">
              Level {grade}
            </span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {gradeLevels.map((level) => {
              const unlocked = isUnlocked(level.grade, level.chapter);
              const stars = getStars(level.id);
              const score = getScore(level.id);

              return (
                <div key={level.id} className={`
                  relative rounded-xl overflow-hidden border transition-all duration-300 group
                  ${unlocked 
                    ? 'border-brand-primary/30 bg-white hover:shadow-lg hover:-translate-y-1 hover:border-brand-primary' 
                    : 'border-slate-200 bg-slate-50 opacity-80'
                  }
                `}>
                  <div className="p-3 md:p-4">
                    <div className="flex justify-between items-center mb-3">
                      <div className={`
                        w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-xl md:text-2xl shadow-sm
                        ${unlocked ? 'bg-brand-primary/10' : 'bg-slate-100 grayscale opacity-50'}
                      `}>
                        {level.icon || '📍'}
                      </div>
                      <div className="flex flex-col items-end">
                         {unlocked ? (
                            <div className="flex gap-0.5 mb-1">
                              {[1, 2, 3].map(i => (
                                <Star 
                                  key={i} 
                                  size={12} 
                                  className={`${i <= stars ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}`}
                                />
                              ))}
                            </div>
                         ) : (
                           <Lock size={14} className="text-slate-300" />
                         )}
                        {score > 0 && <span className="text-[10px] text-brand-secondary font-bold">+{score}分</span>}
                      </div>
                    </div>
                    
                    <div className="mb-4">
                        <span className="text-[10px] text-brand-primary/60 font-bold uppercase tracking-wide">
                            Part {level.chapter}
                        </span>
                        <h3 className="font-bold text-sm md:text-base text-slate-800 truncate leading-tight mt-0.5">
                            {level.name}
                        </h3>
                        <p className="text-[10px] md:text-xs text-slate-400 truncate mt-1">{level.description}</p>
                    </div>
                    
                    {unlocked ? (
                      <Link 
                        to={`/game/${level.id}`}
                        className="flex items-center justify-center gap-2 w-full bg-brand-primary text-white py-2 rounded-lg text-xs md:text-sm font-bold group-hover:bg-brand-dark transition-colors"
                      >
                        <Play size={14} fill="currentColor" />
                        开始
                      </Link>
                    ) : (
                      <button disabled className="flex items-center justify-center gap-2 w-full bg-slate-100 text-slate-400 py-2 rounded-lg text-xs md:text-sm font-bold cursor-not-allowed">
                        未解锁
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            
            {/* AI Review Level Card */}
            <div className="relative rounded-xl overflow-hidden border border-brand-accent/30 bg-gradient-to-br from-white to-pink-50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 hover:border-brand-accent group">
               <div className="p-3 md:p-4 h-full flex flex-col">
                  <div className="flex justify-between items-center mb-3">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-xl md:text-2xl bg-brand-accent/10 shadow-sm">
                      <BrainCircuit size={24} className="text-brand-accent" />
                    </div>
                    <div className="bg-brand-accent text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                      AI 推荐
                    </div>
                  </div>
                  
                  <div className="mb-4">
                      <span className="text-[10px] text-brand-accent/60 font-bold uppercase tracking-wide">
                          Review
                      </span>
                      <h3 className="font-bold text-sm md:text-base text-slate-800 truncate leading-tight mt-0.5">
                          AI 智能复习
                      </h3>
                      <p className="text-[10px] md:text-xs text-slate-400 truncate mt-1">定制化查漏补缺</p>
                  </div>
                  
                  <Link 
                    to={`/game/review-${grade}`}
                    className="mt-auto flex items-center justify-center gap-2 w-full bg-brand-accent text-white py-2 rounded-lg text-xs md:text-sm font-bold group-hover:bg-pink-600 transition-colors"
                  >
                    <RefreshCcw size={14} />
                    巩固练习
                  </Link>
               </div>
            </div>

          </div>
        </div>
      )})}
    </div>
  );
};
