import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getFishingQuestions } from '../db/fishingApi';
import { recordMistake, saveUserProgress, getLevelById, updateDailyStats } from '../db/api';
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
  scale: number;
  opacity: number;
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
  
  // Hook Animation State
  // idle: default position
  // dropping: moving down to catch fish
  // catching: paused at fish location
  // retracting: moving up with fish
  // delivering: moving to basket
  // depositing: dropping fish in basket
  const [hookState, setHookState] = useState<'idle' | 'dropping' | 'catching' | 'retracting' | 'delivering' | 'depositing'>('idle');
  
  // Hook Position (Percent)
  const [hookPos, setHookPos] = useState({ x: 50, y: 15 });
  const [targetFishId, setTargetFishId] = useState<number | null>(null);
  const [caughtFish, setCaughtFish] = useState<Fish | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  // Constants
  const BASKET_POS = { x: 90, y: 10 }; // Top rightish
  const IDLE_POS = { x: 50, y: 15 };

  // Refs for animation loop
  const requestRef = useRef<number | null>(null);
  const hookAnimRef = useRef<number | null>(null);
  const hookPosRef = useRef(hookPos);
  const fishContainerRef = useRef<HTMLDivElement>(null);

  // Sync ref
  useEffect(() => { hookPosRef.current = hookPos; }, [hookPos]);

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
      y: Math.random() * 50 + 30, // 30-80% depth (deeper)
      speed: (Math.random() * 0.05 + 0.02) * (Math.random() > 0.5 ? 1 : -1), // Very slow speed for kids
      direction: Math.random() > 0.5 ? 1 : -1,
      color: FISH_COLORS[Math.floor(Math.random() * FISH_COLORS.length)],
      isCaught: false,
      scale: 1,
      opacity: 1
    }));
    setFishes(newFishes);
  };

  // Animation Loop
  const animate = useCallback(() => {
    if (gameState !== 'playing') return;

    setFishes(prev => prev.map(fish => {
      // If caught, stop swimming logic
      if (fish.isCaught) return fish;

      // Swim Logic
      let newX = fish.x + fish.speed;
      if (newX <= 5 || newX >= 95) {
        fish.speed *= -1;
        fish.direction *= -1;
        newX = Math.max(5, Math.min(95, newX));
      }
      return { ...fish, x: newX, speed: fish.speed, direction: fish.direction };
    }));
    
    requestRef.current = requestAnimationFrame(animate);
  }, [gameState]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        if (hookAnimRef.current) cancelAnimationFrame(hookAnimRef.current);
    }
  }, [animate]);


  // JS Animation for Hook
  const moveHook = (target: {x: number, y: number}, duration: number) => {
    return new Promise<void>(resolve => {
        if (hookAnimRef.current) cancelAnimationFrame(hookAnimRef.current);
        
        const start = hookPosRef.current;
        const startTime = performance.now();
        
        const loop = (time: number) => {
            const elapsed = time - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease in out quad
            const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
            
            const current = {
                x: start.x + (target.x - start.x) * ease,
                y: start.y + (target.y - start.y) * ease
            };
            
            // Sync immediately for loop
            hookPosRef.current = current;
            setHookPos(current);
            
            if (progress < 1) {
                hookAnimRef.current = requestAnimationFrame(loop);
            } else {
                resolve();
            }
        };
        hookAnimRef.current = requestAnimationFrame(loop);
    });
  };

  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleCastHook = async (fish: Fish) => {
    if (hookState !== 'idle' || feedback !== null) return;
    
    const currentQ = questions[currentQIndex];
    if (!currentQ) return;

    // 1. Aim & Drop
    setTargetFishId(fish.id);
    setHookState('dropping');
    
    // Move to fish initial pos
    await moveHook({ x: fish.x, y: fish.y }, 600);

    // Check answer
    const isCorrect = fish.pinyin === currentQ.pinyin;

    if (isCorrect) {
        playTone('catch');
        setHookState('catching');
        
        // VISUAL TRICK: Hide swimming fish, Show attached fish
        setFishes(prev => prev.map(f => f.id === fish.id ? { ...f, isCaught: true, opacity: 0 } : f));
        setCaughtFish({ ...fish, isCaught: true });
        setFeedback('correct');

        await wait(300);

        // 2. Retract (Pull up)
        setHookState('retracting');
        // We move hook to surface. Caught fish will follow automatically via UI rendering
        await moveHook({ x: fish.x, y: 15 }, 600);

        // 3. Deliver to Basket
        setHookState('delivering');
        await moveHook(BASKET_POS, 800);

        // 4. Deposit
        setHookState('depositing');
        playTone('splash');
        
        // Fish disappears into basket
        setCaughtFish(null); // Remove from hook
        setScore(s => s + 1);

        await wait(500);

        // 5. Return to Idle
        setHookState('idle');
        setFeedback(null);
        setTargetFishId(null);
        
        await moveHook(IDLE_POS, 500);
        
        // Next question
        if (currentQIndex < questions.length - 1) {
            setCurrentQIndex(prev => prev + 1);
        } else {
            finishLevel(score + 1);
        }

    } else {
        // WRONG ANSWER
        playTone('wrong');
        setHookState('catching');
        setFeedback('wrong');

        if (user) {
            recordMistake(user.id, currentQ.id, fish.pinyin);
        }
        if (navigator.vibrate) navigator.vibrate(200);

        await wait(1000); // Longer wait to see the error

        // Retract
        setHookState('retracting');
        await moveHook({ x: fish.x, y: 15 }, 500);
        
        // Return
        setHookState('idle');
        setFeedback(null);
        setTargetFishId(null);
        await moveHook(IDLE_POS, 500);
    }
  };

  const finishLevel = async (finalScore: number) => {
    setGameState('completed');
    if (user && levelInfo) {
      const ratio = finalScore / questions.length;
      let stars = 1;
      if (ratio >= 0.9) stars = 3;
      else if (ratio >= 0.6) stars = 2;
      
      await saveUserProgress(user.id, levelInfo.id, stars, finalScore);
      await updateDailyStats(user.id, finalScore, questions.length);
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
    } else if (type === 'splash') {
       // Simple splash simulation
       const noise = new Tone.Noise("pink").start();
       const env = new Tone.AmplitudeEnvelope({
           attack: 0.01,
           decay: 0.1,
           sustain: 0,
           release: 0.1
       }).toDestination();
       noise.connect(env);
       env.triggerAttackRelease("16n");
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
       {/* Background Decor */}
       <div className="absolute bottom-0 left-0 w-full h-32 bg-blue-600/20 backdrop-blur-sm z-0 skew-y-2 origin-bottom-left"></div>
       <div className="absolute bottom-10 right-0 w-full h-32 bg-blue-700/10 backdrop-blur-sm z-0 -skew-y-2 origin-bottom-right"></div>

       {/* Header UI */}
       <div className="absolute top-4 left-4 z-20">
         <button onClick={() => navigate(-1)} className="bg-white/20 backdrop-blur p-2 rounded-full text-white hover:bg-white/30 transition-colors">
           <ArrowLeft size={24} />
         </button>
       </div>
       
       <div className="absolute top-20 right-4 z-20 flex flex-col items-end">
          {/* Score & Basket Area */}
          <div className="flex flex-col items-end gap-6">
              <div className="bg-white/20 backdrop-blur px-4 py-2 rounded-xl text-white font-bold flex items-center gap-2 mb-2 shadow-sm border border-white/20">
                <span>⭐</span>
                <span>{score} / {questions.length}</span>
              </div>
              
              {/* Fish Basket */}
              <div className="relative w-16 h-16 md:w-20 md:h-20 bg-amber-800/80 rounded-b-2xl rounded-t-lg border-4 border-amber-900 flex items-center justify-center shadow-lg"
                 style={{ 
                     backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(0,0,0,0.1) 5px, rgba(0,0,0,0.1) 10px)' 
                 }}
              >
                  {/* Handle */}
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-8 border-t-4 border-l-4 border-r-4 border-amber-900 rounded-t-full"></div>
                  <div className="text-2xl md:text-3xl">🧺</div>
                  
                  {/* Fish Count Badge */}
                  <div className="absolute -bottom-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white">
                      {score}
                  </div>
              </div>
          </div>
       </div>

       {/* Target Board */}
       <div className="absolute top-20 left-4 z-20">
         <div className="bg-white/95 backdrop-blur rounded-2xl shadow-xl border-4 border-amber-300 px-8 py-4 text-center transform hover:scale-105 transition-transform min-w-[200px]">
           <div className="text-sm text-slate-400 font-bold mb-1 uppercase tracking-widest">目标拼音</div>
           <div className="text-6xl font-black text-blue-600 font-mono tracking-wider drop-shadow-sm">
             {currentQ?.pinyin}
           </div>
         </div>
       </div>

       {/* Hook & Line */}
       {/* Calculate line path dynamically */}
       <svg className="absolute inset-0 pointer-events-none z-10 w-full h-full overflow-visible">
           {/* Fishing Line: From Top Center (50%, 0%) to HookPos */}
           <line 
             x1="50%" 
             y1="0" 
             x2={`${hookPos.x}%`} 
             y2={`${hookPos.y + 4}%`} 
             stroke="#e2e8f0" 
             strokeWidth="2"
             strokeDasharray="4 2"
           />
       </svg>

       {/* Hook Component */}
       <div 
         className="absolute z-30"
         style={{ 
           left: `${hookPos.x}%`, 
           top: `${hookPos.y}%`,
           transform: 'translate(-50%, 0)'
         }}
       >
           {/* The Hook Graphic */}
           <div className="w-10 h-16 -translate-y-1 filter drop-shadow-lg">
             <svg viewBox="0 0 40 60" className="w-full h-full">
               <defs>
                 <linearGradient id="hookGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                   <stop offset="0%" stopColor="#94a3b8" />
                   <stop offset="50%" stopColor="#cbd5e1" />
                   <stop offset="100%" stopColor="#94a3b8" />
                 </linearGradient>
               </defs>
               {/* Eyelet */}
               <circle cx="20" cy="4" r="3" stroke="url(#hookGrad)" strokeWidth="2" fill="none" />
               {/* Shank */}
               <path d="M20 7 L20 40" stroke="url(#hookGrad)" strokeWidth="3" />
               {/* Bend & Point */}
               <path d="M20 40 Q20 55 32 45 L35 40" stroke="url(#hookGrad)" strokeWidth="3" fill="none" strokeLinecap="round" />
               {/* Barb */}
               <path d="M35 40 L30 43" stroke="url(#hookGrad)" strokeWidth="2" strokeLinecap="round" />
             </svg>
           </div>
            {caughtFish && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-4 w-24 h-16 pointer-events-none origin-top transition-transform animate-in zoom-in duration-300">
                  <svg viewBox="0 0 100 60" className="w-full h-full drop-shadow-lg" style={{ transform: 'rotate(90deg)' }}> 
                      <defs>
                          <linearGradient id="caughtFishGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor={caughtFish.color} />
                              <stop offset="100%" stopColor="white" stopOpacity="0.5" />
                          </linearGradient>
                      </defs>
                      <path 
                          d="M80,30 Q60,5 30,30 Q60,55 80,30 M80,30 L95,15 L95,45 Z" 
                          fill={caughtFish.color}
                          stroke="white" 
                          strokeWidth="2"
                      />
                      <path d="M50,15 Q60,5 70,15" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
                      <circle cx="25" cy="25" r="3" fill="white" />
                      <circle cx="26" cy="25" r="1.5" fill="black" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center pb-1 pl-4" style={{ transform: 'rotate(90deg)' }}>
                      <span className="text-xl font-black text-white drop-shadow-md">
                           {caughtFish.char}
                      </span>
                  </div>
              </div>
            )}
       </div>

       {/* Fishes */}
       <div className="absolute inset-0 z-0 pt-32 pb-10" ref={fishContainerRef}>
         {fishes.map((fish) => {
           // Skip rendering if fully deposited (optional, or use opacity)
           if (fish.opacity === 0) return null;

           return (
             <div
               key={fish.id}
               onClick={() => !fish.isCaught && handleCastHook(fish)}
               className={`absolute cursor-pointer transition-transform duration-300`}
               style={{
                 left: `${fish.x}%`,
                 top: `${fish.y}%`,
                 transform: `translate(-50%, -50%) scaleX(${fish.direction}) scale(${fish.scale})`,
                 opacity: fish.opacity,
                 transition: fish.isCaught ? 'all 0.5s ease-in-out' : 'transform 0.1s linear, opacity 0.3s', // Smooth transition when caught
                 zIndex: fish.isCaught ? 40 : 10
               }}
             >
                 <div className="relative w-24 h-16 md:w-32 md:h-24 group">
                     {/* SVG Fish Body */}
                     <svg viewBox="0 0 100 60" className="w-full h-full drop-shadow-lg transition-transform group-hover:scale-105">
                        <defs>
                            <linearGradient id={`fishGrad-${fish.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor={fish.color} />
                                <stop offset="100%" stopColor="white" stopOpacity="0.5" />
                            </linearGradient>
                        </defs>
                        {/* Body */}
                        <path 
                            d="M80,30 Q60,5 30,30 Q60,55 80,30 M80,30 L95,15 L95,45 Z" 
                            fill={fish.color}
                            stroke="white" 
                            strokeWidth="2"
                        />
                        {/* Fin */}
                        <path d="M50,15 Q60,5 70,15" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
                        {/* Eye */}
                        <circle cx="25" cy="25" r="3" fill="white" />
                        <circle cx="26" cy="25" r="1.5" fill="black" />
                     </svg>
                     
                     {/* Text - Centered and upright - Smaller for kids - Closer to tail (Right) */}
                     <div className="absolute inset-0 flex items-center justify-center pb-1 pl-4">
                        <span 
                            className="text-lg md:text-xl font-black text-white drop-shadow-md z-10" 
                            style={{ 
                                transform: `scaleX(${fish.direction})`, // Flip text back
                                display: 'inline-block' 
                            }}
                        >
                             {fish.char}
                        </span>
                     </div>
                 </div>
             </div>
           );
         })}
       </div>
       
       {/* Feedback Overlay */}
       {feedback && (
           <div className="absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-none bg-black/10 backdrop-blur-[2px]">
               <div className={`text-8xl md:text-9xl font-black animate-bounce filter drop-shadow-2xl ${feedback === 'correct' ? 'text-green-500' : 'text-red-500'}`}>
                   {feedback === 'correct' ? '✓' : '✗'}
               </div>
               
               {feedback === 'wrong' && (
                   <div className="mt-8 bg-red-500 text-white px-8 py-4 rounded-full text-2xl md:text-3xl font-black animate-pulse shadow-2xl border-4 border-white transform rotate-2">
                       鱼竿钓鱼失败！
                   </div>
               )}
               
               {feedback === 'correct' && (
                   <div className="mt-8 bg-green-500 text-white px-8 py-4 rounded-full text-2xl md:text-3xl font-black animate-bounce shadow-2xl border-4 border-white transform -rotate-2">
                       太棒了！
                   </div>
               )}
           </div>
       )}

    </div>
  );
};
