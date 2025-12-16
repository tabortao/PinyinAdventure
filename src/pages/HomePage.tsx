import { useEffect, useState } from 'react';
import { getLevels, getUserProgress } from '../db/api';
import { useAuth } from '../context/AuthContext';
import { Level, UserProgress } from '../types/types';
import { Link } from 'react-router-dom';
import { Star, Lock, Play } from 'lucide-react';

export const HomePage = () => {
  const { user } = useAuth();
  const [levels, setLevels] = useState<Level[]>([]);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
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

  // Group levels by Grade
  const levelsByGrade = levels.reduce((acc, level) => {
    if (!acc[level.grade]) acc[level.grade] = [];
    acc[level.grade].push(level);
    return acc;
  }, {} as Record<number, Level[]>);

  const isUnlocked = (grade: number, chapter: number) => {
    if (grade === 1 && chapter === 1) return true; // First level always open
    // TODO: Implement logic based on previous level completion
    // For now, unlock all if logged in, or check strict sequential
    // Simple logic: Check if previous level (by index in flat list) is completed
    const flatIndex = levels.findIndex(l => l.grade === grade && l.chapter === chapter);
    if (flatIndex <= 0) return true;
    
    const prevLevel = levels[flatIndex - 1];
    return progress.some(p => p.level_id === prevLevel.id);
  };

  const getStars = (levelId: number) => {
    return progress.find(p => p.level_id === levelId)?.stars || 0;
  };

  if (loading) return <div className="text-center py-20 text-brand-primary">正在加载关卡...</div>;

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-brand-dark mb-4">拼音闯关大冒险</h1>
        <p className="text-slate-600">完成关卡，收集星星，成为拼音大师！</p>
      </div>

      {Object.entries(levelsByGrade).map(([grade, gradeLevels]) => (
        <div key={grade} className="mb-12">
          <h2 className="text-2xl font-bold text-brand-secondary mb-6 flex items-center gap-2">
            <span className="bg-brand-secondary text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">
              {grade}
            </span>
            {grade} 年级
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gradeLevels.map((level) => {
              const unlocked = isUnlocked(level.grade, level.chapter);
              const stars = getStars(level.id);

              return (
                <div key={level.id} className={`
                  relative rounded-2xl overflow-hidden border-2 transition-all duration-300
                  ${unlocked 
                    ? 'border-brand-primary/30 bg-white hover:shadow-xl hover:-translate-y-1 hover:border-brand-primary' 
                    : 'border-slate-200 bg-slate-50 opacity-80'
                  }
                `}>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`
                        w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold
                        ${unlocked ? 'bg-brand-primary/10 text-brand-primary' : 'bg-slate-200 text-slate-400'}
                      `}>
                        {level.chapter}
                      </div>
                      <div className="flex gap-1">
                        {[1, 2, 3].map(i => (
                          <Star 
                            key={i} 
                            size={16} 
                            className={`${i <= stars ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}`}
                          />
                        ))}
                      </div>
                    </div>
                    
                    <h3 className="font-bold text-lg text-slate-800 mb-2">{level.name}</h3>
                    <p className="text-sm text-slate-500 mb-6">{level.description}</p>
                    
                    {unlocked ? (
                      <Link 
                        to={`/game/${level.id}`}
                        className="flex items-center justify-center gap-2 w-full bg-brand-primary text-white py-3 rounded-xl font-bold hover:bg-brand-dark transition-colors"
                      >
                        <Play size={18} fill="currentColor" />
                        开始挑战
                      </Link>
                    ) : (
                      <button disabled className="flex items-center justify-center gap-2 w-full bg-slate-200 text-slate-400 py-3 rounded-xl font-bold cursor-not-allowed">
                        <Lock size={18} />
                        未解锁
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
