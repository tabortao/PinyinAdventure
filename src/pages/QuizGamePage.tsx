import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Volume2, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getQuizQuestions, saveUserQuizProgress, recordMistake } from '../db/api';
import { Question } from '../types/types';
import * as Tone from 'tone';

interface QuizQuestion extends Question {
  options: string[];
}

export const QuizGamePage = () => {
  const { levelId } = useParams<{ levelId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  
  // Game state
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [timeLeft, setTimeLeft] = useState(10);
  const [totalTime, setTotalTime] = useState(0); // Cumulative time in seconds
  
  const timerRef = useRef<any>(null);
  const gameTimerRef = useRef<any>(null);

  useEffect(() => {
    if (levelId) {
      loadQuestions();
    }
  }, [levelId]);

  useEffect(() => {
    if (!loading && !isFinished && questions.length > 0) {
      startTimer();
      // Global game timer for total duration tracking (optional based on requirement)
      // "总时长100秒" - this might be the sum of time limits or a hard cap.
      // Usually "10 questions, 10s each" implies 100s total possible time.
      // We will enforce 10s per question.
    }
    return () => stopTimer();
  }, [currentIndex, loading, isFinished]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const data = await getQuizQuestions(Number(levelId), 10);
      setQuestions(data);
    } catch (error) {
      console.error('Failed to load quiz questions', error);
    } finally {
      setLoading(false);
    }
  };

  const startTimer = () => {
    stopTimer();
    setTimeLeft(10);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const playSound = async (success: boolean) => {
    await Tone.start();
    const synth = new Tone.Synth().toDestination();
    if (success) {
      synth.triggerAttackRelease("C5", "8n");
      setTimeout(() => synth.triggerAttackRelease("E5", "8n"), 100);
    } else {
      synth.triggerAttackRelease("A3", "4n");
    }
  };

  const handleTimeOut = () => {
    stopTimer();
    handleAnswer(null, true);
  };

  const handleAnswer = async (option: string | null, isTimeout: boolean = false) => {
    if (selectedOption !== null && !isTimeout) return; // Prevent double click

    const currentQuestion = questions[currentIndex];
    const correct = currentQuestion.pinyin;
    
    let correctGuess = false;
    
    if (isTimeout) {
      setSelectedOption('');
      setIsCorrect(false);
    } else {
      setSelectedOption(option);
      correctGuess = option === correct;
      setIsCorrect(correctGuess);
    }

    // Sound
    if (!isTimeout) {
      playSound(correctGuess);
    } else {
      playSound(false);
    }

    // Logic
    if (correctGuess) {
      setScore(s => s + 1);
    } else {
      // Record mistake
      if (user) {
        await recordMistake(user.id, currentQuestion.id, option || 'timeout');
      }
    }

    // Delay next
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setSelectedOption(null);
        setIsCorrect(null);
      } else {
        finishGame();
      }
    }, 1500);
  };

  const finishGame = async () => {
    setIsFinished(true);
    stopTimer();
    // Save score
    if (user && levelId) {
      // Calculate final score based on correct count
      // Current logic: score is correct count
      // We might want to pass 'score' variable, but closure might be stale?
      // Use functional update or ref if needed. 
      // But here `score` is state. React guarantees state consistency in render cycle but inside async function?
      // Better rely on the latest value if we were inside an effect, but here we call it from timeout.
      // Let's assume `score` is correct. Wait, `score` in `finishGame` closure is from the render where `handleAnswer` was defined?
      // Actually `setTimeout` closure will capture `score` at the time of scheduling?
      // No, `finishGame` is called.
      // To be safe, calculate score from tracking correct answers or just trust the state update if we trigger finish in effect.
      // Let's trigger finish in effect when index reaches end?
      // Actually `handleAnswer` calls `finishGame`.
      // The `score` state might not be updated yet inside the `setTimeout` callback of `handleAnswer`.
      // FIX: pass the final score to `finishGame` or calculate it.
    }
  };

  // Effect to save score when finished
  useEffect(() => {
    if (isFinished && user && levelId) {
      saveUserQuizProgress(user.id, Number(levelId), score).then(() => {
        console.log('Quiz progress saved');
      });
    }
  }, [isFinished, user, levelId, score]);

  const nextLevel = () => {
    // Logic to find next level
    // For now, just levelId + 1
    const nextId = Number(levelId) + 1;
    // Check max level? We'll let the user try, if empty questions, handle it.
    navigate(`/quiz-game/${nextId}`);
    // Reset state
    setScore(0);
    setCurrentIndex(0);
    setIsFinished(false);
    setSelectedOption(null);
    setIsCorrect(null);
    setLoading(true);
    // levelId changes -> useEffect triggers loadQuestions
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 transition-colors">
        <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">暂无题目</h2>
        <button 
          onClick={() => navigate('/study')}
          className="px-6 py-3 bg-brand-primary text-white rounded-xl font-bold hover:bg-brand-secondary transition-colors shadow-sm"
        >
          返回学习
        </button>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="min-h-screen bg-brand-primary flex flex-col items-center justify-center p-4 relative overflow-hidden transition-colors">
        {/* Background Patterns */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-10 left-10 text-9xl text-white">A</div>
          <div className="absolute bottom-20 right-20 text-9xl text-white">O</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl w-full max-w-md text-center z-10 animate-in zoom-in duration-300 border border-slate-100 dark:border-slate-800 transition-colors">
          <h2 className="text-3xl font-bold text-brand-dark dark:text-white mb-2 transition-colors">挑战完成!</h2>
          <div className="text-6xl font-black text-brand-primary mb-6">{score} <span className="text-2xl text-slate-400 dark:text-slate-500">/ 10</span></div>
          
          <div className="space-y-4">
            <button 
              onClick={nextLevel}
              className="w-full py-4 text-lg font-bold rounded-2xl shadow-lg bg-brand-primary hover:bg-brand-secondary text-white transition-all active:scale-95"
            >
              下一关
            </button>
            <button 
              onClick={() => navigate('/study')}
              className="w-full py-4 text-lg font-bold rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors active:scale-95"
            >
              返回学习
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-4 shadow-sm flex items-center justify-between">
        <button onClick={() => navigate('/study')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
          <ArrowLeft className="text-slate-600 dark:text-slate-300" />
        </button>
        <div className="font-bold text-slate-700 dark:text-white">第 {levelId} 关</div>
        <div className="flex items-center gap-2">
           <div className={`px-3 py-1 rounded-full font-mono font-bold ${timeLeft <= 3 ? 'bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400'}`}>
             {timeLeft}s
           </div>
           <div className="font-bold text-brand-primary">{score}分</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-slate-200 dark:bg-slate-800 w-full">
        <div 
          className="h-full bg-brand-primary transition-all duration-300 ease-out"
          style={{ width: `${((currentIndex) / questions.length) * 100}%` }}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-md mx-auto w-full">
        
        {/* Character Card */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg p-12 mb-12 w-full aspect-square flex items-center justify-center border-4 border-slate-100 dark:border-slate-700">
          <span className="text-9xl font-black text-slate-800 dark:text-white select-none">
            {currentQuestion.content}
          </span>
        </div>

        {/* Options */}
        <div className="grid grid-cols-2 gap-4 w-full">
          {currentQuestion.options.map((opt, idx) => {
            let stateClass = "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700";
            
            if (selectedOption) {
              if (opt === currentQuestion.pinyin) {
                stateClass = "bg-green-500 text-white border-green-600 ring-4 ring-green-200 dark:ring-green-900";
              } else if (opt === selectedOption) {
                stateClass = "bg-red-500 text-white border-red-600 ring-4 ring-red-200 dark:ring-red-900";
              } else {
                stateClass = "opacity-50 bg-slate-100 dark:bg-slate-900 text-slate-400";
              }
            }

            return (
              <button
                key={idx}
                disabled={selectedOption !== null}
                onClick={() => handleAnswer(opt)}
                className={`
                  p-6 rounded-2xl text-2xl font-bold border-b-4 transition-all duration-200
                  ${stateClass}
                  ${selectedOption === null ? 'active:scale-95' : ''}
                `}
              >
                {opt}
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
};
