import { useEffect, useState } from 'react';
import { getMistakes, reviewMistakeSuccess, recordMistake, getPinyinReviewList } from '../db/api';
import { Mistake, PinyinChart, Question } from '../types/types';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { generateReviewQuestions } from '../lib/ai';
import { PinyinKeyboard } from '../components/game/PinyinKeyboard';
import { applyTone, checkAnswer } from '../lib/pinyinUtils';
import { Check, X, RefreshCw, Calendar, Trophy, BookOpen } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const MistakesPage = () => {
  const { user } = useAuth();
  const { aiConfig } = useSettings();
  const navigate = useNavigate();
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [pinyinMistakes, setPinyinMistakes] = useState<PinyinChart[]>([]);
  
  // Review Queue State
  type ReviewItem = { type: 'mistake', data: Mistake } | { type: 'ai', data: Question };
  const [reviewQueue, setReviewQueue] = useState<ReviewItem[]>([]);
  
  const [activeTab, setActiveTab] = useState<'questions' | 'pinyin'>('questions');
  const [loading, setLoading] = useState(true);
  const [reviewMode, setReviewMode] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong'>('none');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  useEffect(() => {
    fetchMistakes();
  }, [user]);

  const fetchMistakes = async () => {
    if (!user) return;
    try {
      const [data, pinyinData] = await Promise.all([
        getMistakes(user.id),
        getPinyinReviewList(user.id)
      ]);
      setMistakes(data);
      setPinyinMistakes(pinyinData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const startReview = async () => {
    if (mistakes.length === 0) return;
    
    setReviewMode(true);
    setIsGeneratingAI(true);
    
    // Base queue: all mistakes
    let queue: ReviewItem[] = mistakes.map(m => ({ type: 'mistake', data: m }));
    
    // Try AI generation
    if (aiConfig.apiKey) {
       try {
          // Pass top 5 mistakes to AI for generation
          const contextMistakes = mistakes.slice(0, 5).map(m => ({
              question: m.question!,
              wrong_pinyin: m.wrong_pinyin
          }));
          
          const aiQuestions = await generateReviewQuestions(contextMistakes, aiConfig, 3);
          
          if (aiQuestions && aiQuestions.length > 0) {
             // Add AI questions to the end
             queue = [...queue, ...aiQuestions.map(q => ({ type: 'ai' as const, data: q }))];
          }
       } catch (e) {
          console.error("AI Review Generation Failed:", e);
       }
    }
    
    setReviewQueue(queue);
    setIsGeneratingAI(false);
    setCurrentIndex(0);
    setInput('');
    setFeedback('none');
  };

  const handleInput = (char: string) => setInput(prev => prev + char);
  const handleDelete = () => setInput(prev => prev.slice(0, -1));
  const handleTone = (tone: number) => setInput(prev => applyTone(prev, tone));

  const handleConfirm = async () => {
    if (!input || !user) return;
    
    const currentItem = reviewQueue[currentIndex];
    let correctPinyin = '';
    
    if (currentItem.type === 'mistake') {
        correctPinyin = currentItem.data.question?.pinyin || '';
    } else {
        correctPinyin = currentItem.data.pinyin;
    }
    
    const isCorrect = checkAnswer(input, correctPinyin);
    
    setFeedback(isCorrect ? 'correct' : 'wrong');

    if (currentItem.type === 'mistake') {
        if (isCorrect) {
          await reviewMistakeSuccess(currentItem.data.id, currentItem.data.review_stage);
        } else {
          await recordMistake(user.id, currentItem.data.question_id, input);
        }
    } else {
        // AI Question Logic
        if (!isCorrect) {
            // If user gets AI question wrong, record it as a new mistake!
            // But we need a valid question_id. 
            // Since AI question is virtual, we can't record it to `mistakes` table unless we save the question first.
            // For now, let's just show feedback.
        }
    }

    setTimeout(() => {
      if (currentIndex < reviewQueue.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setInput('');
        setFeedback('none');
      } else {
        // Finished session
        setReviewMode(false);
        fetchMistakes(); // Refresh list
      }
    }, isCorrect ? 1000 : 2500);
  };

  if (loading) return <div className="p-8 text-center">加载中...</div>;

  if (isGeneratingAI) {
      return (
          <div className="flex h-screen items-center justify-center flex-col">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mb-4"></div>
              <p className="text-slate-500">AI 正在为你准备强化训练...</p>
          </div>
      );
  }

  // Review Interface (Similar to GamePage but simpler)
  if (reviewMode && reviewQueue.length > 0) {
    const currentItem = reviewQueue[currentIndex];
    
    // Extract content/pinyin safely
    let content = '';
    let pinyin = '';
    
    if (currentItem.type === 'mistake') {
        content = currentItem.data.question?.content || '';
        pinyin = currentItem.data.question?.pinyin || '';
    } else {
        content = currentItem.data.content;
        pinyin = currentItem.data.pinyin;
    }
    
    return (
      <div className="flex flex-col h-[calc(100vh-64px)]">
        <div className="flex-1 flex flex-col items-center justify-center p-4 relative">
          <div className="mb-4 text-slate-400 font-medium flex items-center gap-2">
            <span>复习进度: {currentIndex + 1} / {reviewQueue.length}</span>
            {currentItem.type === 'ai' && (
                <span className="bg-violet-100 text-violet-600 px-2 py-0.5 rounded text-xs font-bold">AI 强化</span>
            )}
          </div>
          
          <div className={`
             bg-white dark:bg-slate-800 w-48 h-48 md:w-64 md:h-64 rounded-3xl shadow-lg border-b-8 flex items-center justify-center mb-8 text-6xl md:text-8xl font-bold text-slate-800 dark:text-white relative overflow-hidden transition-colors
             ${currentItem.type === 'ai' ? 'border-violet-500' : 'border-brand-accent'}
          `}>
            {content}
            
            {feedback !== 'none' && (
               <div className={`absolute inset-0 flex flex-col items-center justify-center bg-opacity-90 backdrop-blur-sm transition-all
                 ${feedback === 'correct' ? 'bg-green-500/90' : 'bg-red-500/90'}
               `}>
                 {feedback === 'correct' ? <Check size={48} className="text-white" /> : <X size={48} className="text-white" />}
                 {feedback === 'wrong' && (
                   <div className="text-white mt-2 font-mono text-xl">{pinyin}</div>
                 )}
               </div>
            )}
          </div>

          <div className={`
            w-full max-w-sm bg-white dark:bg-slate-800 rounded-xl p-4 text-center mb-6 shadow-sm border-2 transition-all
            ${input ? 'border-brand-primary' : 'border-slate-200 dark:border-slate-700'}
          `}>
            <span className="text-3xl font-mono text-slate-700 dark:text-slate-200 min-h-[2.5rem] block">
              {input || <span className="text-slate-300 dark:text-slate-600">请输入拼音</span>}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 shadow-md transition-colors">
          <PinyinKeyboard 
            onInput={handleInput}
            onDelete={handleDelete}
            onConfirm={handleConfirm}
            onTone={handleTone}
            disabled={feedback !== 'none'}
          />
        </div>
      </div>
    );
  }

  // List Interface
  return (
    <div className="max-w-4xl mx-auto px-4 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 mt-6">
        <div>
          <h1 className="text-3xl font-black text-brand-dark dark:text-brand-primary mb-2 transition-colors">错音本</h1>
          <p className="text-slate-500 dark:text-slate-400 transition-colors">
            {activeTab === 'questions' 
              ? `基于艾宾浩斯记忆曲线，今日需复习 ${mistakes.length} 个难点。`
              : `有 ${pinyinMistakes.length} 个基础拼音需要加强记忆。`
            }
          </p>
        </div>
        
        {/* Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
           <button
             onClick={() => setActiveTab('questions')}
             className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'questions' ? 'bg-white dark:bg-slate-700 text-brand-primary shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
           >
             汉字/词语 ({mistakes.length})
           </button>
           <button
             onClick={() => setActiveTab('pinyin')}
             className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'pinyin' ? 'bg-white dark:bg-slate-700 text-brand-primary shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
           >
             基础拼音 ({pinyinMistakes.length})
           </button>
        </div>
      </div>

      {activeTab === 'questions' ? (
        <>
          {mistakes.length > 0 ? (
             <div className="mb-8 flex justify-end">
               <button 
                onClick={startReview}
                className="bg-brand-secondary hover:bg-orange-500 text-white px-6 py-2 rounded-lg font-bold shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-2 text-sm"
              >
                <RefreshCw /> 开始复习
              </button>
             </div>
          ) : (
            <div className="mb-8">
               <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-6 py-2 rounded-lg flex items-center gap-2 transition-colors inline-block">
                <Trophy size={18} />
                目前没有需要复习的汉字！
              </div>
            </div>
          )}

          {mistakes.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {mistakes.map((m) => (
                <div key={m.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
                  <div className="text-4xl font-bold text-center mb-2 text-slate-700 dark:text-white transition-colors">{m.question?.content}</div>
                  <div className="text-xs text-center text-slate-400 dark:text-slate-500 flex justify-center items-center gap-1 transition-colors">
                    <Calendar size={12} />
                    Stage: {m.review_stage}
                  </div>
                </div>
              ))}
            </div>
          ) : (
             <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 transition-colors">
              <div className="text-6xl mb-4 animate-bounce">🌟</div>
              <h3 className="text-xl font-bold text-slate-600 dark:text-slate-300 mb-2 transition-colors">汉字复习完成！</h3>
              <p className="text-slate-400 dark:text-slate-500 mb-6 transition-colors">你已经完成了所有的汉字复习任务。</p>
              <Link to="/" className="text-brand-primary font-bold hover:underline">去闯关挑战更多汉字 &rarr;</Link>
            </div>
          )}
        </>
      ) : (
        /* Pinyin Tab */
        <>
           {pinyinMistakes.length > 0 ? (
             <div className="mb-8 flex justify-end">
               <button 
                onClick={() => navigate('/study')}
                className="bg-brand-primary hover:bg-brand-secondary text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center gap-2"
              >
                <BookOpen size={20} />
                前往拼音复习
              </button>
             </div>
           ) : (
             <div className="mb-8">
               <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-6 py-2 rounded-lg flex items-center gap-2 transition-colors inline-block">
                <Trophy size={18} />
                目前没有需要复习的基础拼音！
              </div>
            </div>
           )}

           {pinyinMistakes.length > 0 ? (
             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
               {pinyinMistakes.map((p) => (
                 <div key={p.id} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col items-center">
                   <div className="text-4xl font-black text-brand-dark dark:text-white mb-2 transition-colors">{p.pinyin}</div>
                   <div className="text-2xl mb-2">{p.emoji}</div>
                   <div className="text-xs text-center text-slate-400 dark:text-slate-500 font-bold">
                     {p.category === 'initial' ? '声母' : p.category === 'final' ? '韵母' : '整体认读'}
                   </div>
                 </div>
               ))}
             </div>
           ) : (
            <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 transition-colors">
              <div className="text-6xl mb-4 animate-bounce">✨</div>
              <h3 className="text-xl font-bold text-slate-600 dark:text-slate-300 mb-2 transition-colors">基础拼音掌握得很好！</h3>
              <p className="text-slate-400 dark:text-slate-500 mb-6 transition-colors">继续保持，去学习新的内容吧。</p>
              <button onClick={() => navigate('/study')} className="text-brand-primary font-bold hover:underline">去拼音基础学习 &rarr;</button>
            </div>
           )}
        </>
      )}
    </div>
  );
};
