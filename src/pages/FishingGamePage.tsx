import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getFishingQuestions } from '../db/fishingApi';
import { recordMistake, saveUserProgress, getLevelById } from '../db/api';
import { Question, Level } from '../types/types';
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
  const { levelId } = useParams<{ levelId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Game State
  const [levelInfo, setLevelInfo] = useState<Level | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [fishes, setFishes] = useState<Fish[]>([]);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<'loading' | 'playing' | 'completed'>('loading');
  const [hookState, setHookState] = useState<'idle' | 'dropping' | 'catching' | 'retracting'>('idle');
  const [targetFishId, setTargetFishId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  // Refs for animation
  const requestRef = useRef<number | null>(null);

  // Initial Load
  useEffect(() => {
      loadLevel();
      return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
      };
  }, [levelId]);

  const loadLevel = async () => {
      if (!levelId) return;
      try {
          setGameState('loading');
          const lvlId = parseInt(levelId);
          // Fetch Level Info and Questions
          const [lvl, qs] = await Promise.all([
              getLevelById(lvlId),
              getFishingQuestions(lvlId, 10)
          ]);
          
          setLevelInfo(lvl);
          setQuestions(qs);
          
          if (qs.length > 0) {
              spawnFishes(qs);
              setGameState('playing');
              setScore(0);
              setCurrentQIndex(0);
          } else {
              console.error("No questions found for level", lvlId);
              setGameState('completed');
          }
      } catch (e) {
          console.error(e);
          setGameState('completed');
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

      let newX = fish.x + (fish.speed * 0.15); 
      
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

    // Check answer
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
               finishLevel(score + 1);
             }
          }, 1000);
        }, 500);
      } else {
        setHookState('retracting');
        setFeedback('wrong');
        playTone('wrong');
        
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

  const finishLevel = async (finalScore: number) => {
    setGameState('completed');
    if (user && levelInfo) {
      // Calculate stars
      const ratio = finalScore / questions.length;
      let stars = 1;
      if (ratio >= 0.9) stars = 3;
      else if (ratio >= 0.6) stars = 2;
      
      await saveUserProgress(user.id, levelInfo.id, stars, finalScore);
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

  if (gameState === 'loading') return <div className="flex h-screen items-center justify-center bg-cyan-100">
      <div className="animate-spin text-4xl">🐟</div>
  </div>;

  if (gameState === 'completed') {
    return (
      <div className="min-h-screen bg-cyan-400 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in">
           <div className="text-6xl mb-4">🏆</div>
           <h2 className="text-3xl font-bold text-cyan-600 mb-2">满载而归！</h2>
           <p className="text-slate-500 mb-6">你成功钓到了 {score} 条大鱼</p>
           
           <div className="flex flex-col gap-3">
             <button 
                 onClick={() => navigate(`/fishing/levels/${levelInfo?.grade}`)}
                 className="w-full bg-cyan-500 text-white py-3 rounded-xl font-bold hover:bg-cyan-600 transition-colors"
               >
                 返回海域
             </button>
             <button 
                 onClick={() => loadLevel()}
                 className="w-full bg-cyan-100 text-cyan-600 py-3 rounded-xl font-bold hover:bg-cyan-200 transition-colors"
               >
                 再玩一次
             </button>
           </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQIndex];

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-300 to-blue-500 relative overflow-hidden select-none touch-none">
       {/* Header UI */}
       <div className="absolute top-4 left-4 z-20">
         <button onClick={() => navigate(-1)} className="bg-white/20 backdrop-blur p-2 rounded-full text-white hover:bg-white/30">
           <ArrowLeft size={24} />
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
         <div className="bg-white rounded-2xl shadow-lg border-4 border-amber-300 px-8 py-4 text-center transform hover:scale-105 transition-transform min-w-[200px]">
           <div className="text-sm text-slate-400 font-bold mb-1">寻找拼音</div>
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
           transform: targetFishId !== null && hookState !== 'idle' 
             ? `translateX(${(fishes.find(f => f.id === targetFishId)?.x || 50) - 50}vw)` 
             : 'translateX(0)'
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
                 transition: 'top 0.5s, left 0.1s linear'
               }}
             >
                 <div className="relative w-24 h-16 md:w-32 md:h-24">
                     {/* CSS Fish */}
                     <div className="w-full h-full rounded-full shadow-lg flex items-center justify-center relative border-2 border-white/50"
                         style={{ backgroundColor: fish.color }}
                     >
                          {/* Text needs to be upright always. Since parent is flipped by scaleX, we flip text back */}
                         <span className="text-4xl md:text-5xl font-black text-white drop-shadow-md z-10" style={{ transform: `scaleX(${fish.direction})`, display: 'inline-block' }}>
                             {fish.char}
                         </span>
                         
                         {/* Tail */}
                         <div className="absolute -right-4 w-8 h-8 rounded-full -z-10" style={{ backgroundColor: fish.color }}></div>
                         
                         {/* Eye */}
                         <div className="absolute top-2 right-4 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                             <div className="w-2 h-2 bg-black rounded-full"></div>
                         </div>
                         
                         {/* Fin */}
                         <div className="absolute -top-3 left-1/2 w-6 h-6 rounded-full -z-10" style={{ backgroundColor: fish.color }}></div>
                     </div>
                 </div>
             </div>
           );
         })}
       </div>
       
       {/* Feedback Overlay */}
       {feedback && (
           <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
               <div className={`text-8xl font-black animate-bounce ${feedback === 'correct' ? 'text-green-400' : 'text-red-400'}`}>
                   {feedback === 'correct' ? '✓' : '✗'}
               </div>
           </div>
       )}

    </div>
  );
};
