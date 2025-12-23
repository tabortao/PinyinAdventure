import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Fish, Waves, Star, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getLevels, getUserProgress } from '../db/api';
import { Level, UserProgress } from '../types/types';

export const FishingStagesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stages, setStages] = useState<{ id: number; title: string; range: string; minLevel: number; maxLevel: number; color: string }[]>([
    { id: 11, title: '简单水域', range: 'Level 1-20', minLevel: 1, maxLevel: 20, color: 'from-cyan-400 to-blue-500' },
    { id: 12, title: '中级深海', range: 'Level 21-40', minLevel: 21, maxLevel: 40, color: 'from-blue-500 to-indigo-600' },
    { id: 13, title: '困难远洋', range: 'Level 41-60', minLevel: 41, maxLevel: 60, color: 'from-indigo-600 to-violet-800' }
  ]);
  
  // We can add unlock logic here later
  
  return (
    <div className="min-h-screen bg-cyan-50 dark:bg-slate-950 transition-colors pb-16 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 opacity-10 animate-pulse text-cyan-600 dark:text-cyan-400"><Fish size={64} /></div>
          <div className="absolute bottom-20 right-10 opacity-10 animate-bounce text-blue-600 dark:text-blue-400 delay-1000"><Fish size={48} /></div>
          <div className="absolute top-1/2 left-1/2 opacity-5 -translate-x-1/2 -translate-y-1/2 text-cyan-800"><Waves size={300} /></div>
      </div>

      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-cyan-100 dark:border-slate-800 p-4 shadow-sm transition-colors">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => navigate('/')}
            className="p-2 hover:bg-cyan-50 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <ArrowLeft className="text-cyan-700 dark:text-cyan-300" />
          </button>
          <h1 className="text-xl font-black text-cyan-900 dark:text-white flex items-center gap-2">
             <Fish className="text-cyan-500" /> 钓鱼学拼音
          </h1>
          <div className="w-10" /> 
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 flex flex-col items-center gap-8 mt-4 relative z-10">
         <div className="text-center mb-4">
             <h2 className="text-3xl font-black text-cyan-900 dark:text-white mb-2">选择挑战海域</h2>
             <p className="text-cyan-600 dark:text-cyan-400">不同的海域有不同的挑战在等着你！</p>
         </div>

         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full">
            {stages.map((stage) => (
                <button
                    key={stage.id}
                    onClick={() => navigate(`/fishing/levels/${stage.id}`)}
                    className={`
                        relative group overflow-hidden rounded-3xl p-6 aspect-[3/4] md:aspect-[4/5] flex flex-col items-center justify-between text-white shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 bg-gradient-to-b ${stage.color}
                    `}
                >
                    <div className="absolute top-0 left-0 w-full h-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                    
                    <div className="mt-4 text-center">
                        <div className="bg-white/20 backdrop-blur-md rounded-full px-4 py-1 text-sm font-bold mb-4 inline-block shadow-inner">
                            {stage.range}
                        </div>
                        <h3 className="text-3xl font-black mb-1 shadow-black/10 drop-shadow-md">{stage.title}</h3>
                    </div>

                    <div className="flex-1 flex items-center justify-center w-full">
                        <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform border-4 border-white/10">
                            {stage.id === 11 ? <Fish size={48} /> : stage.id === 12 ? <Waves size={48} /> : <span className="text-4xl">⚓</span>}
                        </div>
                    </div>

                    <div className="w-full">
                        <div className="bg-white text-cyan-900 w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg group-hover:bg-cyan-50 transition-colors">
                            <Play size={18} fill="currentColor" /> 进入海域
                        </div>
                    </div>
                </button>
            ))}
         </div>
      </div>
    </div>
  );
};
