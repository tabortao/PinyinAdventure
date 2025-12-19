import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCcw, Trophy, Volume2, Settings, HelpCircle, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getFishingQuestions, recordMistake, saveUserProgress, getUserProgress } from '../db/api';
import { Question } from '../types/types';
import * as Tone from 'tone';

interface Fish {
  id: number;
  questionId: number;
  char: string;
  pinyin: string;
  x: number;
  y: number;
  speed: number;
  direction: 1 | -1;
  color: string;
  isCaught: boolean;
}

const FISH_COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#FF9F1C', '#95E1D3', '#F38181', '#A8D8EA', '#AA96DA'];

export const FishingGamePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Game State
  const [level, setLevel] = useState<number>(0); // 0 = menu, 1, 2, 3
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [fishes, setFishes] = useState<Fish[]>([]);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'completed'>('menu');
  const [hookState, setHookState] = useState<'idle' | 'dropping' | 'catching' | 'retracting'>('idle');
  const [hookPos, setHookPos] = useState({ x: 50, y: 10 }); // Percentages
  const [targetFishId, setTargetFishId] = useState<number | null>(null);
  const [unlockedLevels, setUnlockedLevels] = useState<number[]>([1]);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  // Refs for animation
  const requestRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load Unlocked Levels
  useEffect(() => {
    if (user) {
      getUserProgress(user.id).then(prog => {
        const unlocked = [1];
        if (prog.find(p => p.level_id === 1001 && p.stars > 0)) unlocked.push(2);
        if (prog.find(p => p.level_id === 1002 && p.stars > 0)) unlocked.push(3);
        setUnlockedLevels(unlocked);
      });
    }
  }, [user]);

  // Start Level
  const startLevel = async (lvl: number) => {
    setLevel(lvl);
    setScore(0);
    setCurrentQIndex(0);
    setGameState('playing');
    setHookState('idle');
    setFeedback(null);
    
    try {
      // Get 10 questions for this level
      const qs = await getFishingQuestions(lvl, 10);
      setQuestions(qs);
      
      // Initialize Fishes (include current target + distractors from other questions or just all 10?)
      // Design: "Hanzi randomly scattered". "Hook hook updates next pinyin".
      // Let's spawn all 10 fishes at once, or spawn them in waves?
      // "Randomly scattered in small fish images".
      // Let's spawn all 10. If screen is too crowded, maybe 5 at a time.
      // 10 is fine for desktop, maybe crowded for mobile. Let's try 10.
      spawnFishes(qs);
    } catch (e) {
      console.error(e);
      alert("加载题目失败");
      setGameState('menu');
    }
  };

  const spawnFishes = (qs: Question[]) => {
    const newFishes: Fish[] = qs.map((q, idx) => ({
      id: idx,
      questionId: q.id,
      char: q.content,
      pinyin: q.pinyin,
      x: Math.random() * 80 + 10, // 10-90%
      y: Math.random() * 60 + 20, // 20-80% depth
      speed: (Math.random() * 0.5 + 0.2) * (Math.random() > 0.5 ? 1 : -1), // Speed & Direction
      direction: Math.random() > 0.5 ? 1 : -1,
      color: FISH_COLORS[Math.floor(Math.random() * FISH_COLORS.length)],
      isCaught: false
    }));
    setFishes(newFishes);
  };

  // Game Loop
  const animate = useCallback(() => {
    setFishes(prev => prev.map(fish => {
      if (fish.isCaught) return fish;

      let newX = fish.x + (fish.speed * 0.2); // Adjust speed factor
      
      // Bounce off walls
      if (newX <= 5 || newX >= 95) {
        fish.speed *= -1;
        fish.direction *= -1;
        newX = Math.max(5, Math.min(95, newX));
      }

      return { ...fish, x: newX, speed: fish.speed, direction: fish.direction };
    }));
    
    requestRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    if (gameState === 'playing') {
      requestRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState, animate]);

  // Handle Click (Cast Hook)
  const handleCastHook = async (fish: Fish) => {
    if (hookState !== 'idle' || feedback !== null) return;
    
    const currentQ = questions[currentQIndex];
    if (!currentQ) return;

    setHookState('dropping');
    setTargetFishId(fish.id);

    // Animate hook moving to fish
    // Simple logic: instant check, then animation
    const isCorrect = fish.pinyin === currentQ.pinyin;
    
    // Simulate drop time
    setTimeout(async () => {
      if (isCorrect) {
        setHookState('catching');
        playTone('catch');
        
        // Wait for catch animation
        setTimeout(() => {
          setFishes(prev => prev.map(f => f.id === fish.id ? { ...f, isCaught: true } : f));
          setScore(s => s + 1);
          setHookState('retracting');
          setFeedback('correct');
          
          // Next question
          setTimeout(() => {
             setHookState('idle');
             setFeedback(null);
             setTargetFishId(null);
             
             if (currentQIndex < questions.length - 1) {
               setCurrentQIndex(prev => prev + 1);
             } else {
               finishLevel();
             }
          }, 1000);
        }, 500);
      } else {
        setHookState('retracting');
        setFeedback('wrong');
        playTone('wrong');
        
        // Vibration
        if (navigator.vibrate) {
            navigator.vibrate(200);
        }
        
        // Record mistake
        if (user) {
          recordMistake(user.id, currentQ.id, fish.pinyin);
        }
        
        setTimeout(() => {
          setHookState('idle');
          setFeedback(null);
          setTargetFishId(null);
        }, 1000);
      }
    }, 500);
  };

  const finishLevel = async () => {
    setGameState('completed');
    if (user && level > 0) {
      await saveUserProgress(user.id, 1000 + level, 3, score + 1); // Save as special level ID
      // Refresh unlocked levels
      const prog = await getUserProgress(user.id);
      const unlocked = [1];
      if (prog.find(p => p.level_id === 1001 && p.stars > 0)) unlocked.push(2);
      if (prog.find(p => p.level_id === 1002 && p.stars > 0)) unlocked.push(3);
      setUnlockedLevels(unlocked);
    }
  };

  const playTone = (type: 'catch' | 'wrong' | 'splash') => {
    Tone.start();
    const synth = new Tone.Synth().toDestination();
    if (type === 'catch') {
      synth.triggerAttackRelease("C5", "8n");
      setTimeout(() => synth.triggerAttackRelease("E5", "8n"), 100);
    } else if (type === 'wrong') {
       synth.triggerAttackRelease("A2", "8n");
       setTimeout(() => synth.triggerAttackRelease("G2", "8n"), 100);
    }
  };

  // UI Components
  if (gameState === 'menu') {
    return (
      <div className="min-h-screen bg-blue-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute inset-0 bg-blue-100/50 dark:bg-blue-900/20 pointer-events-none"></div>
        <div className="absolute top-10 left-10 text-6xl opacity-20">🐟</div>
        <div className="absolute bottom-20 right-10 text-6xl opacity-20">🐠</div>
        
        <div className="z-10 w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl text-center border-4 border-blue-200 dark:border-blue-800">
           <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
             🎣
           </div>
           <h1 className="text-3xl font-black text-blue-600 dark:text-blue-400 mb-2">钓鱼学拼音</h1>
           <p className="text-slate-500 mb-8">选个难度开始钓鱼吧！</p>
           
           <div className="space-y-4">
             {[1, 2, 3].map(lvl => {
               const locked = !unlockedLevels.includes(lvl);
               const titles = ['简单 (Level 1)', '中级 (Level 2)', '困难 (Level 3)'];
               const descs = ['单韵母、声母基础', '复韵母、前鼻韵母', '后鼻韵母、整体认读'];
               
               return (
                 <button
                   key={lvl}
                   disabled={locked}
                   onClick={() => startLevel(lvl)}
                   className={`w-full p-4 rounded-xl border-2 flex items-center justify-between transition-all
                     ${locked 
                       ? 'bg-slate-100 border-slate-200 text-slate-400 grayscale cursor-not-allowed' 
                       : 'bg-white border-blue-200 text-blue-800 hover:bg-blue-50 hover:border-blue-400 hover:shadow-md'
                     }
                   `}
                 >
                   <div className="text-left">
                     <div className="font-bold text-lg">{titles[lvl-1]}</div>
                     <div className="text-xs opacity-70">{descs[lvl-1]}</div>
                   </div>
                   {locked ? <Settings size={20} /> : <PlayIcon />}
                 </button>
               )
             })}
           </div>
           
           <button onClick={() => navigate('/')} className="mt-8 text-slate-400 hover:text-slate-600 text-sm font-bold flex items-center justify-center gap-1">
             <ArrowLeft size={16} /> 返回首页
           </button>
        </div>
      </div>
    );
  }

  if (gameState === 'completed') {
    return (
      <div className="min-h-screen bg-blue-400 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in">
           <div className="text-6xl mb-4">🏆</div>
           <h2 className="text-3xl font-bold text-blue-600 mb-2">满载而归！</h2>
           <p className="text-slate-500 mb-6">你成功钓到了 {score} 条大鱼</p>
           
           <div className="flex flex-col gap-3">
             {level < 3 && (
               <button 
                 onClick={() => startLevel(level + 1)}
                 className="w-full bg-blue-500 text-white py-3 rounded-xl font-bold hover:bg-blue-600 transition-colors"
               >
                 下一关
               </button>
             )}
             <button 
                 onClick={() => startLevel(level)}
                 className="w-full bg-blue-100 text-blue-600 py-3 rounded-xl font-bold hover:bg-blue-200 transition-colors"
               >
                 再玩一次
             </button>
             <button 
                 onClick={() => setGameState('menu')}
                 className="w-full border-2 border-slate-100 text-slate-500 py-3 rounded-xl font-bold hover:bg-slate-50 transition-colors"
               >
                 返回菜单
             </button>
           </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQIndex];

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-300 to-blue-500 relative overflow-hidden select-none">
       {/* Header UI */}
       <div className="absolute top-4 left-4 z-20">
         <button onClick={() => setGameState('menu')} className="bg-white/20 backdrop-blur p-2 rounded-full text-white hover:bg-white/30">
           <X size={24} />
         </button>
       </div>
       
       <div className="absolute top-4 right-4 z-20 flex flex-col items-end">
          <div className="bg-white/20 backdrop-blur px-4 py-2 rounded-xl text-white font-bold flex items-center gap-2 mb-2">
            <span>🐟</span>
            <span>{score} / {questions.length}</span>
          </div>
       </div>

       {/* Target Board */}
       <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20">
         <div className="bg-white rounded-2xl shadow-lg border-4 border-amber-300 px-8 py-4 text-center transform hover:scale-105 transition-transform">
           <div className="text-sm text-slate-400 font-bold mb-1">目标拼音</div>
           <div className="text-5xl font-black text-blue-600 font-mono tracking-wider">
             {currentQ?.pinyin}
           </div>
         </div>
       </div>

       {/* Fishing Line & Hook */}
       <div 
         className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none z-10 transition-all duration-500 ease-in-out"
         style={{ 
           height: hookState === 'dropping' || hookState === 'catching' ? '70%' : '15%',
           width: '2px',
           transform: targetFishId && hookState !== 'idle' ? `translateX(${(fishes.find(f => f.id === targetFishId)?.x || 50) - 50}vw)` : 'translateX(0)'
         }}
       >
         {/* Line */}
         <div className="w-full h-full bg-slate-700 mx-auto"></div>
         {/* Hook */}
         <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full text-4xl">
           🪝
         </div>
       </div>

       {/* Fishes */}
       <div className="absolute inset-0 z-0 pt-32 pb-10">
         {fishes.map((fish) => {
           if (fish.isCaught) return null;
           
           return (
             <div
               key={fish.id}
               onClick={() => handleCastHook(fish)}
               className={`absolute cursor-pointer transition-transform hover:scale-110 active:scale-95`}
               style={{
                 left: `${fish.x}%`,
                 top: `${fish.y}%`,
                 transform: `scaleX(${fish.direction})`,
                 transition: 'top 0.5s, left 0.1s linear' // Smooth out tick updates? No, linear is better for requestAnimationFrame
               }}
             >
                <div className="relative">
                   {/* Fish Body */}
                   <svg width="80" height="60" viewBox="0 0 100 80" className="drop-shadow-lg">
                     <path
                       d="M80,40 Q60,10 30,40 Q60,70 80,40 M80,40 L95,25 L95,55 Z"
                       fill={fish.color}
                       stroke="white"
                       strokeWidth="2"
                     />
                     <circle cx="40" cy="35" r="3" fill="white" />
                     <circle cx="40" cy="35" r="1.5" fill="black" />
                   </svg>
                   {/* Character on Fish - adjust position to not flip with scaleX */}
                   <div 
                     className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl font-black text-white pointer-events-none"
                     style={{ transform: `translate(-50%, -50%) scaleX(${fish.direction})` }} // Counter-flip text
                   >
                     {fish.char}
                   </div>
                </div>
             </div>
           );
         })}
       </div>

       {/* Feedback Overlay */}
       {feedback && (
         <div className={`absolute inset-0 z-30 flex items-center justify-center pointer-events-none ${feedback === 'wrong' ? 'animate-shake bg-red-500/10' : 'bg-green-500/10'}`}>
            <div className={`text-8xl font-black ${feedback === 'correct' ? 'text-green-500 animate-bounce' : 'text-red-500'}`}>
              {feedback === 'correct' ? '✓' : '✗'}
            </div>
         </div>
       )}

    </div>
  );
};

const PlayIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 3 19 12 5 21 5 3"></polygon>
  </svg>
);
