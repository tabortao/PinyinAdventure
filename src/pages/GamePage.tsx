import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuestionsByLevel, getLevelById, saveUserProgress, recordMistake, getRandomQuestionsByGrade } from '../db/api';
import { Question, Level } from '../types/types';
import { PinyinKeyboard } from '../components/game/PinyinKeyboard';
import { applyTone, checkAnswer } from '../lib/pinyinUtils';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { X, Check, ArrowRight, RefreshCcw, Home, Sparkles } from 'lucide-react';

export const GamePage = () => {
  const { levelId } = useParams();
  const { user } = useAuth();
  const { mode } = useSettings();
  const navigate = useNavigate();
  
  const [level, setLevel] = useState<Level | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState('');
  const [gameState, setGameState] = useState<'loading' | 'playing' | 'feedback' | 'finished'>('loading');
  const [lastResult, setLastResult] = useState<'correct' | 'wrong' | null>(null);
  const [score, setScore] = useState(0); // Count of correct answers
  const [mistakes, setMistakes] = useState<number[]>([]); // IDs of wrong questions
  const [isAiGenerated, setIsAiGenerated] = useState(false); // Flag for UI

  useEffect(() => {
    if (!levelId) return;
    const loadGame = async () => {
      try {
        const [lvl, qs] = await Promise.all([
          getLevelById(parseInt(levelId)),
          getQuestionsByLevel(parseInt(levelId))
        ]);
        setLevel(lvl);
        
        let targetQs: Question[] = [];

        // 1. Try to get questions from the current level matching the mode
        if (mode === 'all') {
          targetQs = qs;
        } else {
          targetQs = qs.filter(q => q.type === mode);
        }

        // 2. If no questions found (e.g. Sentence mode selected but level has no sentences),
        // Trigger "AI Generation" (Fallback to random pool from the same grade)
        if (targetQs.length === 0 && lvl) {
          setIsAiGenerated(true);
          // Wait a bit to simulate "AI Thinking"
          setGameState('loading');
          
          // Fetch fallback questions
          const fallbackQs = await getRandomQuestionsByGrade(lvl.grade, mode as any, 10);
          
          if (fallbackQs.length === 0) {
             alert('AI题库正在扩充中，请稍后尝试或切换其他模式。');
             navigate('/');
             return;
          }
          targetQs = fallbackQs;
        } else {
          setIsAiGenerated(false);
        }

        setQuestions(targetQs);
        setGameState('playing');
      } catch (e) {
        console.error(e);
        alert('加载失败');
        navigate('/');
      }
    };
    loadGame();
  }, [levelId, navigate, mode]);

  const handleInput = (char: string) => {
    setInput(prev => prev + char);
  };

  const handleDelete = () => {
    setInput(prev => prev.slice(0, -1));
  };

  const handleTone = (tone: number) => {
    setInput(prev => applyTone(prev, tone));
  };

  const handleConfirm = async () => {
    if (!input) return;
    
    const currentQ = questions[currentIndex];
    const isCorrect = checkAnswer(input, currentQ.pinyin);
    
    setGameState('feedback');
    setLastResult(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) {
      setScore(prev => prev + 1);
    } else {
      setMistakes(prev => [...prev, currentQ.id]);
      if (user) {
        await recordMistake(user.id, currentQ.id, input);
      }
    }

    // Auto advance after delay
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setInput('');
        setGameState('playing');
        setLastResult(null);
      } else {
        finishGame(isCorrect ? score + 1 : score);
      }
    }, isCorrect ? 1500 : 2500); // Longer delay for wrong answer to see correction
  };

  const finishGame = async (finalScore: number) => {
    setGameState('finished');
    if (user && levelId) {
      // Calculate stars
      const percentage = finalScore / questions.length;
      let stars = 1;
      if (percentage >= 0.9) stars = 3;
      else if (percentage >= 0.6) stars = 2;
      
      await saveUserProgress(user.id, parseInt(levelId), stars);
    }
  };

  if (gameState === 'loading') return <div className="flex h-screen items-center justify-center text-brand-primary">游戏加载中...</div>;

  if (gameState === 'finished') {
    const percentage = score / questions.length;
    let stars = 0;
    if (percentage >= 0.9) stars = 3;
    else if (percentage >= 0.6) stars = 2;
    else if (percentage > 0) stars = 1;

    return (
      <div className="min-h-screen bg-brand-background flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center border-4 border-brand-primary/20">
          <div className="text-6xl mb-4">
            {stars === 3 ? '🏆' : stars === 2 ? '🥈' : '🥉'}
          </div>
          <h2 className="text-3xl font-bold text-brand-secondary mb-2">
            {stars === 3 ? '太棒了！' : stars === 2 ? '做得好！' : '继续加油！'}
          </h2>
          <p className="text-slate-500 mb-8">
            你答对了 {score} / {questions.length} 题
          </p>

          <div className="flex justify-center gap-2 mb-8">
            {[1, 2, 3].map(i => (
              <div key={i} className={`p-2 rounded-full ${i <= stars ? 'bg-yellow-100' : 'bg-slate-100'}`}>
                <div className={`w-8 h-8 rounded-full ${i <= stars ? 'bg-yellow-400' : 'bg-slate-300'}`} />
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <button 
              onClick={() => navigate('/')} 
              className="w-full bg-brand-primary text-white py-3 rounded-xl font-bold hover:bg-brand-dark"
            >
              返回关卡列表
            </button>
            <button 
              onClick={() => window.location.reload()} 
              className="w-full bg-slate-100 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-200"
            >
              再试一次
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const progressPercent = ((currentIndex) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-brand-background flex flex-col">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm flex items-center justify-between">
        <button onClick={() => navigate('/')} className="text-slate-400 hover:text-slate-600">
          <X />
        </button>
        <div className="flex-1 mx-6">
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-brand-primary transition-all duration-500" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
        <div className="text-brand-secondary font-bold">
          {currentIndex + 1}/{questions.length}
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 relative">
        {/* Question Card */}
          {/* AI Banner */}
          {isAiGenerated && gameState !== 'feedback' && (
            <div className="absolute top-0 left-0 right-0 flex justify-center z-10 -mt-2">
              <div className="bg-brand-secondary/90 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1 shadow-sm animate-pulse">
                <Sparkles size={12} />
                AI 智能生成题目中...
              </div>
            </div>
          )}
        <div className="bg-white w-full max-w-sm aspect-square rounded-3xl shadow-lg border-b-8 border-slate-200 flex items-center justify-center mb-8 relative overflow-hidden">
          <span className="text-9xl font-bold text-slate-800 select-none">
            {currentQ.content}
          </span>
          
          {/* Feedback Overlay */}
          {gameState === 'feedback' && (
            <div className={`absolute inset-0 flex flex-col items-center justify-center bg-opacity-95 backdrop-blur-sm transition-all
              ${lastResult === 'correct' ? 'bg-green-500/90' : 'bg-red-500/90'}
            `}>
              <div className="bg-white p-4 rounded-full mb-4 shadow-lg">
                {lastResult === 'correct' ? (
                  <Check size={48} className="text-green-500" />
                ) : (
                  <X size={48} className="text-red-500" />
                )}
              </div>
              <div className="text-white text-3xl font-bold mb-2">
                {lastResult === 'correct' ? 'Great!' : 'Oops!'}
              </div>
              {lastResult === 'wrong' && (
                <div className="text-white/90 text-xl">
                  正确答案: <span className="font-mono font-bold text-2xl ml-2">{currentQ.pinyin}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Display */}
        <div className={`
          w-full max-w-sm bg-white rounded-xl p-4 text-center mb-6 shadow-sm border-2 transition-all
          ${input ? 'border-brand-primary' : 'border-slate-200'}
        `}>
          <span className="text-3xl font-mono text-slate-700 min-h-[2.5rem] block">
            {input || <span className="text-slate-300">请输入拼音</span>}
          </span>
        </div>
      </div>

      {/* Keyboard */}
      <div className="bg-white pt-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <PinyinKeyboard 
          onInput={handleInput}
          onDelete={handleDelete}
          onConfirm={handleConfirm}
          onTone={handleTone}
          disabled={gameState === 'feedback'}
        />
      </div>
    </div>
  );
};
