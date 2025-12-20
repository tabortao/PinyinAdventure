import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuestionsByLevel, getLevelById, saveUserProgress, recordMistake, getRandomQuestionsByGrade, getMistakes } from '../db/api';
import { Question, Level } from '../types/types';
import { PinyinKeyboard } from '../components/game/PinyinKeyboard';
import { applyTone, checkAnswer } from '../lib/pinyinUtils';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { generateReviewQuestions } from '../lib/ai';
import { X, Check, ArrowRight, RefreshCcw, Home, Sparkles, BrainCircuit, Trophy, HelpCircle, Hand, AlertTriangle } from 'lucide-react';

const POSITIVE_FEEDBACK_EN = ['Awesome!', 'Fantastic!', 'Perfect!', 'Unstoppable!', 'Brilliant!'];
const POSITIVE_FEEDBACK_CN = ['太棒了！', '真厉害！', '全对！', '势不可挡！', '天才！'];
const ENCOURAGE_FEEDBACK_CN = ['没关系，下次一定行', '加油，再试一次', '失败是成功之母', '再接再厉', '看清拼音哦'];

export const GamePage = () => {
  const { levelId } = useParams();
  const { user } = useAuth();
  const { mode, aiConfig } = useSettings();
  const navigate = useNavigate();
  
  const [level, setLevel] = useState<Level | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState('');
  const [gameState, setGameState] = useState<'loading' | 'playing' | 'feedback' | 'finished'>('loading');
  const [lastResult, setLastResult] = useState<'correct' | 'wrong' | null>(null);
  const [score, setScore] = useState(0); 
  const [mistakes, setMistakes] = useState<number[]>([]); 
  const [isAiGenerated, setIsAiGenerated] = useState(false); 
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [combo, setCombo] = useState(0);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    if (!levelId) return;

    const loadGame = async () => {
      try {
        setGameState('loading');
        
        // ... (AI Review Logic kept same)
        if (levelId.startsWith('review-')) {
          setIsReviewMode(true);
          const grade = parseInt(levelId.split('-')[1]);
          if (!user) { navigate('/login'); return; }

          setGameState('loading');
          
          let targetQs: Question[] = [];
          
          try {
             const allMistakes = await getMistakes(user.id);
             const validMistakes = allMistakes.filter(m => !!m.question) as any[];

             // 1. Try AI Generation
             if (validMistakes.length > 0 && aiConfig.apiKey) {
                 const topMistakes = validMistakes.slice(0, 5); 
                 const generated = await generateReviewQuestions(topMistakes, aiConfig, 5);
                 if (generated.length > 0) {
                     targetQs = generated;
                     setIsAiGenerated(true);
                 }
             }
             
             // 2. Fallback to existing mistakes
             if (targetQs.length === 0 && validMistakes.length > 0) {
                 targetQs = validMistakes.map(m => m.question);
                 targetQs = targetQs.sort(() => 0.5 - Math.random()).slice(0, 10);
                 setIsAiGenerated(false);
             }
          } catch (err) {
             console.error("Review loading error", err);
          }
          
          // 3. Last fallback: Random questions
          if (targetQs.length === 0) {
             targetQs = await getRandomQuestionsByGrade(grade, mode as any, 10);
             setIsAiGenerated(false);
          }
          
          setLevel({ id: -1, grade, chapter: 99, name: 'AI 智能复习', description: '基于艾宾浩斯曲线为您定制' });
          setQuestions(targetQs);
          setGameState('playing');
          return;
        }

        const [lvl, qs] = await Promise.all([
          getLevelById(parseInt(levelId)),
          getQuestionsByLevel(parseInt(levelId))
        ]);
        setLevel(lvl);
        
        let targetQs: Question[] = [];
        if (mode === 'all') targetQs = qs;
        else targetQs = qs.filter(q => q.type === mode);

        if (targetQs.length === 0 && lvl) {
          setIsAiGenerated(true);
          setGameState('loading');
          const fallbackQs = await getRandomQuestionsByGrade(lvl.grade, mode as any, 10);
          if (fallbackQs.length === 0) {
             alert('AI题库正在扩充中，请稍后尝试或切换其他模式。');
             navigate('/');
             return;
          }
          targetQs = fallbackQs;
        } else {
          setIsAiGenerated(false);
          // Limit to 10 questions if standard level
          targetQs = targetQs.slice(0, 10);
        }

        setQuestions(targetQs);
        setGameState('playing');

        // Show tutorial only for Level 1, Chapter 1, Question 1
        if (lvl && lvl.grade === 1 && lvl.chapter === 1) {
            setShowTutorial(true);
        }

      } catch (e) {
        console.error(e);
        alert('加载失败');
        navigate('/');
      }
    };
    loadGame();
  }, [levelId, navigate, mode, user]);

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
    
    // Hide tutorial if showing
    if (showTutorial) setShowTutorial(false);

    const currentQ = questions[currentIndex];
    const isCorrect = checkAnswer(input, currentQ.pinyin);
    
    setGameState('feedback');
    setLastResult(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) {
      setScore(prev => prev + 1);
      setCombo(prev => prev + 1);
      // Random English praise
      setFeedbackMsg(POSITIVE_FEEDBACK_EN[Math.floor(Math.random() * POSITIVE_FEEDBACK_EN.length)]);
    } else {
      setCombo(0);
      setMistakes(prev => [...prev, currentQ.id]);
      // Random Chinese encouragement
      setFeedbackMsg(ENCOURAGE_FEEDBACK_CN[Math.floor(Math.random() * ENCOURAGE_FEEDBACK_CN.length)]);
      if (user) {
        // Record mistake in background, don't block gameplay
        recordMistake(user.id, currentQ.id, input).catch(e => console.error("Failed to record mistake:", e));
      }
    }

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setInput('');
        setGameState('playing');
        setLastResult(null);
        setFeedbackMsg('');
      } else {
        finishGame(isCorrect ? score + 1 : score);
      }
    }, isCorrect ? 1500 : 2500); 
  };

  const finishGame = async (finalScore: number) => {
    setGameState('finished');
    if (user && levelId && !isReviewMode) {
      const percentage = finalScore / questions.length;
      let stars = 1;
      if (percentage >= 0.9) stars = 3;
      else if (percentage >= 0.6) stars = 2;
      
      await saveUserProgress(user.id, parseInt(levelId), stars, finalScore);
    }
  };

  if (gameState === 'loading') return <div className="flex h-screen items-center justify-center text-brand-primary">加载中...</div>;

  if (gameState === 'finished') {
    const percentage = score / questions.length;
    let stars = 0;
    if (percentage >= 0.9) stars = 3;
    else if (percentage >= 0.6) stars = 2;
    else if (percentage > 0) stars = 1;

    return (
      <div className="min-h-screen bg-brand-background dark:bg-slate-950 flex items-center justify-center p-4 transition-colors">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-8 max-w-md w-full text-center border-4 border-brand-primary/20 dark:border-brand-primary/30 animate-in fade-in zoom-in duration-300 transition-colors">
          <div className="text-6xl mb-4 animate-bounce">
            {stars === 3 ? '🏆' : stars === 2 ? '🥈' : '🥉'}
          </div>
          <h2 className="text-3xl font-bold text-brand-secondary mb-2">
            {stars === 3 ? '太棒了！' : stars === 2 ? '做得好！' : '继续加油！'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-2 transition-colors">
            你答对了 {score} / {questions.length} 题
          </p>
          <div className="text-2xl font-bold text-brand-primary mb-8">
            +{score} 积分
          </div>

          <div className="flex justify-center gap-2 mb-8">
            {[1, 2, 3].map(i => (
              <div key={i} className={`p-2 rounded-full transition-colors ${i <= stars ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-slate-100 dark:bg-slate-800'}`}>
                <div className={`w-8 h-8 rounded-full transition-colors ${i <= stars ? 'bg-yellow-400' : 'bg-slate-300 dark:bg-slate-600'}`} />
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <button 
              onClick={() => navigate('/')} 
              className="w-full bg-brand-primary text-white py-3 rounded-xl font-bold hover:bg-brand-dark transition-transform active:scale-95"
            >
              返回关卡列表
            </button>
            <button 
              onClick={() => window.location.reload()} 
              className="w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-3 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
            >
              再试一次
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  
  if (!currentQ) {
    return (
      <div className="min-h-screen bg-brand-background dark:bg-slate-950 flex flex-col items-center justify-center p-4 transition-colors">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl text-center max-w-sm w-full border border-slate-100 dark:border-slate-800">
           <AlertTriangle size={48} className="text-yellow-500 mx-auto mb-4" />
           <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">题目加载异常</h2>
           <p className="text-slate-500 dark:text-slate-400 mb-6">没有找到合适的题目，可能是因为：<br/>1. 错音本为空<br/>2. 网络连接问题<br/>3. AI 服务异常</p>
           <button onClick={() => navigate('/')} className="w-full bg-brand-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-dark transition-colors">
             返回首页
           </button>
        </div>
      </div>
    );
  }

  const progressPercent = ((currentIndex) / questions.length) * 100;
  
  const getContentSize = (text: string) => {
    if (text.length > 8) return 'text-3xl md:text-5xl';
    if (text.length > 4) return 'text-4xl md:text-6xl';
    return 'text-6xl md:text-8xl';
  };

  return (
    <div className="min-h-screen bg-brand-background dark:bg-slate-950 flex flex-col overflow-hidden relative transition-colors">
      {/* Tutorial Overlay */}
      {showTutorial && currentIndex === 0 && (
          <div className="absolute inset-0 z-50 bg-black/60 flex flex-col items-center justify-center animate-in fade-in duration-500" onClick={() => setShowTutorial(false)}>
             <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl max-w-sm mx-4 text-center shadow-2xl border-4 border-brand-secondary animate-bounce transition-colors">
                <div className="text-5xl mb-4">👆</div>
                <h3 className="text-2xl font-bold text-brand-secondary mb-2">新手引导</h3>
                <p className="text-slate-600 dark:text-slate-300 mb-4 transition-colors">
                   看着上面的汉字 <br/>
                   点击下方的 <b>拼音键盘</b> <br/>
                   输入正确的拼音并按下 <b>确定</b>
                </p>
                <button className="bg-brand-primary text-white px-6 py-2 rounded-full font-bold animate-pulse">
                  知道了
                </button>
             </div>
          </div>
      )}

      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-3 md:p-4 shadow-sm flex items-center justify-between z-20 transition-colors">
        <button onClick={() => navigate('/')} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-2 transition-colors">
          <X />
        </button>
        <div className="flex-1 mx-2 md:mx-6 flex flex-col justify-center">
          <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mb-1 transition-colors">
             <span className="flex items-center gap-1">
               {combo > 1 && <span className="text-orange-500 font-bold animate-pulse">🔥 {combo} 连击</span>}
             </span>
             <span className="font-bold text-brand-secondary">得分: {score}</span>
          </div>
          <div className="h-2 md:h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden transition-colors">
            <div 
              className="h-full bg-brand-primary transition-all duration-500" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
        <div className="text-slate-400 dark:text-slate-500 text-sm font-medium w-10 text-right transition-colors">
          {currentIndex + 1}/{questions.length}
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-2 md:p-4 relative w-full max-w-5xl mx-auto">
        {/* Question Card */}
          {(isAiGenerated || isReviewMode) && gameState !== 'feedback' && (
            <div className="absolute top-0 left-0 right-0 flex justify-center z-10 -mt-2">
              <div className="bg-brand-secondary/90 text-white text-[10px] md:text-xs px-3 py-1 rounded-full flex items-center gap-1 shadow-sm animate-pulse">
                {isReviewMode ? <BrainCircuit size={12} /> : <Sparkles size={12} />}
                {isReviewMode ? 'AI 智能复习关卡' : 'AI 智能生成题目中...'}
              </div>
            </div>
          )}
        <div className="bg-white dark:bg-slate-900 w-full max-w-sm aspect-square md:aspect-[4/3] rounded-3xl shadow-lg border-b-8 border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center mb-4 md:mb-8 relative overflow-hidden transition-all mx-4">
          
          {/* Hint Emoji Display for Level 1 early stages */}
          {currentQ.hint_emoji && gameState === 'playing' && (
             <div className="mb-4 text-4xl md:text-6xl animate-in zoom-in duration-300">
                {currentQ.hint_emoji}
             </div>
          )}

          <span className={`${getContentSize(currentQ.content)} font-bold text-slate-800 dark:text-white select-none transition-all px-4 text-center break-words leading-tight`}>
            {currentQ.content}
          </span>
          
          {/* Feedback Overlay */}
          {gameState === 'feedback' && (
            <div className={`absolute inset-0 flex flex-col items-center justify-center bg-opacity-95 backdrop-blur-sm transition-all z-20 animate-in fade-in zoom-in duration-200
              ${lastResult === 'correct' ? 'bg-green-500/90' : 'bg-red-500/90'}
            `}>
              <div className="bg-white p-4 rounded-full mb-4 shadow-lg animate-bounce">
                {lastResult === 'correct' ? (
                  <Check size={48} className="text-green-500" />
                ) : (
                  <X size={48} className="text-red-500" />
                )}
              </div>
              <div className="text-white text-3xl font-bold mb-2 text-center px-4">
                {feedbackMsg}
              </div>
              {lastResult === 'wrong' && (
                <div className="text-white/90 text-xl text-center px-4 animate-in slide-in-from-bottom-4 fade-in duration-500">
                  正确答案: <br/>
                  <span className="font-mono font-bold text-2xl bg-black/20 px-3 py-1 rounded-lg mt-2 inline-block shadow-inner">
                    {currentQ.pinyin}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Display */}
        <div className={`
          w-full max-w-sm bg-white dark:bg-slate-900 rounded-xl p-3 md:p-4 text-center mb-2 md:mb-6 shadow-sm border-2 transition-all mx-4
          ${input ? 'border-brand-primary' : 'border-slate-200 dark:border-slate-700'}
        `}>
          <span className="text-2xl md:text-3xl font-mono text-slate-700 dark:text-white min-h-[2rem] md:min-h-[2.5rem] block break-all transition-colors">
            {input || <span className="text-slate-300 dark:text-slate-600 text-base md:text-xl transition-colors">请输入拼音 (空格隔开)</span>}
          </span>
        </div>
      </div>

      {/* Keyboard */}
      <div className="bg-white dark:bg-slate-900 pt-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-30 pb-safe transition-colors">
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
