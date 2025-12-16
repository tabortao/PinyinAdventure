import { useEffect, useState } from 'react';
import { getMistakes, reviewMistakeSuccess, recordMistake } from '../db/api';
import { Mistake } from '../types/types';
import { useAuth } from '../context/AuthContext';
import { PinyinKeyboard } from '../components/game/PinyinKeyboard';
import { applyTone, checkAnswer } from '../lib/pinyinUtils';
import { Check, X, RefreshCw, Calendar, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';

export const MistakesPage = () => {
  const { user } = useAuth();
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewMode, setReviewMode] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong'>('none');

  useEffect(() => {
    fetchMistakes();
  }, [user]);

  const fetchMistakes = async () => {
    if (!user) return;
    try {
      const data = await getMistakes(user.id);
      setMistakes(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const startReview = () => {
    if (mistakes.length === 0) return;
    setReviewMode(true);
    setCurrentIndex(0);
    setInput('');
    setFeedback('none');
  };

  const handleInput = (char: string) => setInput(prev => prev + char);
  const handleDelete = () => setInput(prev => prev.slice(0, -1));
  const handleTone = (tone: number) => setInput(prev => applyTone(prev, tone));

  const handleConfirm = async () => {
    if (!input || !user) return;
    
    const currentMistake = mistakes[currentIndex];
    const correctPinyin = currentMistake.question?.pinyin || '';
    
    const isCorrect = checkAnswer(input, correctPinyin);
    
    setFeedback(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) {
      await reviewMistakeSuccess(currentMistake.id, currentMistake.review_stage);
    } else {
      await recordMistake(user.id, currentMistake.question_id, input);
    }

    setTimeout(() => {
      if (currentIndex < mistakes.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setInput('');
        setFeedback('none');
      } else {
        // Finished session
        setReviewMode(false);
        fetchMistakes(); // Refresh list
      }
    }, isCorrect ? 1000 : 2000);
  };

  if (loading) return <div className="p-8 text-center">加载中...</div>;

  // Review Interface (Similar to GamePage but simpler)
  if (reviewMode) {
    const currentMistake = mistakes[currentIndex];
    
    return (
      <div className="flex flex-col h-[calc(100vh-64px)]">
        <div className="flex-1 flex flex-col items-center justify-center p-4 relative">
          <div className="mb-4 text-slate-400 font-medium">
            复习进度: {currentIndex + 1} / {mistakes.length}
          </div>
          
          <div className="bg-white w-48 h-48 md:w-64 md:h-64 rounded-3xl shadow-lg border-b-8 border-brand-accent flex items-center justify-center mb-8 text-6xl md:text-8xl font-bold text-slate-800 relative overflow-hidden">
            {currentMistake.question?.content}
            
            {feedback !== 'none' && (
               <div className={`absolute inset-0 flex flex-col items-center justify-center bg-opacity-90 backdrop-blur-sm transition-all
                 ${feedback === 'correct' ? 'bg-green-500/90' : 'bg-red-500/90'}
               `}>
                 {feedback === 'correct' ? <Check size={48} className="text-white" /> : <X size={48} className="text-white" />}
                 {feedback === 'wrong' && (
                   <div className="text-white mt-2 font-mono text-xl">{currentMistake.question?.pinyin}</div>
                 )}
               </div>
            )}
          </div>

          <div className={`
            w-full max-w-sm bg-white rounded-xl p-4 text-center mb-6 shadow-sm border-2 transition-all
            ${input ? 'border-brand-primary' : 'border-slate-200'}
          `}>
            <span className="text-3xl font-mono text-slate-700 min-h-[2.5rem] block">
              {input || <span className="text-slate-300">请输入拼音</span>}
            </span>
          </div>
        </div>

        <div className="bg-white shadow-md">
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
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-dark dark:text-brand-primary mb-2 transition-colors">错音本 (智能复习)</h1>
          <p className="text-slate-500 dark:text-slate-400 transition-colors">基于艾宾浩斯记忆曲线，今日需复习 {mistakes.length} 个难点。</p>
        </div>
        
        {mistakes.length > 0 ? (
          <button 
            onClick={startReview}
            className="bg-brand-secondary hover:bg-orange-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center gap-2"
          >
            <RefreshCw /> 开始复习
          </button>
        ) : (
          <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-6 py-2 rounded-lg flex items-center gap-2 transition-colors">
            <Trophy size={18} />
            目前没有需要复习的内容！
          </div>
        )}
      </div>

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
          <h3 className="text-xl font-bold text-slate-600 dark:text-slate-300 mb-2 transition-colors">太棒了！</h3>
          <p className="text-slate-400 dark:text-slate-500 mb-6 transition-colors">你已经完成了所有的复习任务。</p>
          <Link to="/" className="text-brand-primary font-bold hover:underline">去闯关挑战更多汉字 &rarr;</Link>
        </div>
      )}
    </div>
  );
};
