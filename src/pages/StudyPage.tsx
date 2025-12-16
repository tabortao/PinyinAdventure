import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { PinyinChart, UserPinyinProgress } from '../types/types';
import { getPinyinCharts, getUserPinyinProgress, updatePinyinProgress, getPinyinReviewList } from '../db/api';
import { BrainCircuit, Check, X, Volume2, RotateCcw, BookOpen, Star, Sparkles } from 'lucide-react';
import { playCorrectSound, playWrongSound } from '../lib/audio';

export const StudyPage = () => {
  const { user } = useAuth();
  const [charts, setCharts] = useState<PinyinChart[]>([]);
  const [progress, setProgress] = useState<UserPinyinProgress[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for study modes
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [studyMode, setStudyMode] = useState<'browse' | 'test' | 'review'>('browse');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  
  // Review specific state
  const [reviewList, setReviewList] = useState<(PinyinChart & { progress_id: string })[]>([]);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    const [c, p] = await Promise.all([
      getPinyinCharts(),
      getUserPinyinProgress(user.id)
    ]);
    setCharts(c);
    setProgress(p);
    setLoading(false);
  };

  // Grouping logic
  const groups = useMemo(() => {
    const g: Record<string, PinyinChart[]> = {};
    charts.forEach(c => {
      if (!g[c.group_name]) g[c.group_name] = [];
      g[c.group_name].push(c);
    });
    return g;
  }, [charts]);

  const groupNames = Object.keys(groups);

  // Computed progress per group
  const getGroupProgress = (groupName: string) => {
    const items = groups[groupName] || [];
    if (items.length === 0) return 0;
    const masteredCount = items.filter(item => 
      progress.some(p => p.pinyin_char === item.id && p.is_mastered)
    ).length;
    return Math.round((masteredCount / items.length) * 100);
  };

  // Handlers
  const startStudy = (groupName: string, mode: 'browse' | 'test') => {
    setSelectedGroup(groupName);
    setStudyMode(mode);
    setCurrentCardIndex(0);
    setShowAnswer(false);
    setTestCompleted(false);
  };

  const startReview = async () => {
    if (!user) return;
    setLoading(true);
    const list = await getPinyinReviewList(user.id);
    if (list.length === 0) {
      alert("太棒了！暂时没有需要复习的拼音。");
      setLoading(false);
      return;
    }
    setReviewList(list);
    setStudyMode('review');
    setCurrentCardIndex(0);
    setShowAnswer(false);
    setTestCompleted(false);
    setLoading(false);
  };

  const handleNextCard = () => {
    const list = studyMode === 'review' ? reviewList : (selectedGroup ? groups[selectedGroup] : []);
    if (currentCardIndex < list.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
      setShowAnswer(false);
    } else {
      setTestCompleted(true);
    }
  };

  const handleTestResult = async (isRemembered: boolean) => {
    if (!user) return;
    
    // Play sound
    if (isRemembered) {
      playCorrectSound();
    } else {
      playWrongSound();
    }

    const list = studyMode === 'review' ? reviewList : (selectedGroup ? groups[selectedGroup] : []);
    const currentItem = list[currentCardIndex];
    
    // Optimistic update
    await updatePinyinProgress(user.id, currentItem.id, isRemembered);
    
    // Refresh background progress
    getUserPinyinProgress(user.id).then(setProgress);

    handleNextCard();
  };

  const playAudio = (text: string) => {
    // Uses browser native TTS for demo simplicity. Ideally should use recorded audio files.
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  // Render Logic
  if (loading) return <div className="text-center py-20 text-brand-primary">加载学习数据...</div>;

  // 1. Study/Test/Review Mode UI
  if (studyMode !== 'browse' && !testCompleted && (selectedGroup || studyMode === 'review')) {
    const list = studyMode === 'review' ? reviewList : groups[selectedGroup!];
    const currentItem = list[currentCardIndex];
    const isTest = studyMode === 'test' || studyMode === 'review';

    return (
      <div className="max-w-md mx-auto p-4 flex flex-col h-[calc(100vh-140px)]">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => setStudyMode('browse')} className="text-slate-400 hover:text-brand-primary font-bold text-sm flex items-center gap-1">
             <X size={18} /> 退出
          </button>
          <div className="text-brand-secondary font-bold">
            {currentCardIndex + 1} / {list.length}
          </div>
        </div>

        {/* Card */}
        <div className="flex-1 bg-white rounded-3xl shadow-xl border border-slate-100 p-6 flex flex-col items-center justify-center relative overflow-hidden">
          
          {/* Top Hint (Hidden in test mode until revealed) */}
          <div className={`transition-opacity duration-300 flex flex-col items-center ${isTest && !showAnswer ? 'opacity-0' : 'opacity-100'}`}>
             <div className="text-6xl mb-4">{currentItem.emoji}</div>
             <div className="text-brand-primary/80 font-bold text-lg mb-8 text-center">{currentItem.mnemonic}</div>
          </div>

          {/* Main Pinyin */}
          <div className="text-8xl font-black text-brand-dark mb-8 tracking-wider">
            {currentItem.pinyin}
          </div>

          {/* Action: Play Audio */}
          <button 
            onClick={() => playAudio(currentItem.pinyin)}
            className="mb-8 w-14 h-14 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center hover:bg-brand-primary hover:text-white transition-all shadow-sm"
          >
            <Volume2 size={28} />
          </button>

          {/* Example Word (Hidden in test mode until revealed) */}
          <div className={`transition-all duration-300 text-center ${isTest && !showAnswer ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
            <div className="text-sm text-slate-400 mb-1 font-bold">{currentItem.example_pinyin}</div>
            <div className="text-2xl font-bold text-slate-700">{currentItem.example_word}</div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 h-20">
           {isTest && !showAnswer ? (
             <button 
               onClick={() => setShowAnswer(true)}
               className="w-full h-full bg-brand-primary text-white rounded-2xl text-xl font-bold shadow-lg hover:bg-brand-dark transition-colors"
             >
               显示答案
             </button>
           ) : isTest && showAnswer ? (
             <div className="flex gap-4 h-full">
               <button 
                 onClick={() => handleTestResult(false)}
                 className="flex-1 bg-red-100 text-red-500 rounded-2xl font-bold text-lg flex flex-col items-center justify-center hover:bg-red-200 transition-colors"
               >
                 <X size={24} className="mb-1" />
                 需复习
               </button>
               <button 
                 onClick={() => handleTestResult(true)}
                 className="flex-1 bg-green-100 text-green-600 rounded-2xl font-bold text-lg flex flex-col items-center justify-center hover:bg-green-200 transition-colors"
               >
                 <Check size={24} className="mb-1" />
                 记住了
               </button>
             </div>
           ) : (
             <div className="flex gap-4 h-full">
               <button 
                 onClick={() => currentCardIndex > 0 && setCurrentCardIndex(p => p - 1)}
                 disabled={currentCardIndex === 0}
                 className="flex-1 bg-slate-100 text-slate-400 rounded-2xl font-bold disabled:opacity-50"
               >
                 上一个
               </button>
               <button 
                 onClick={handleNextCard}
                 className="flex-1 bg-brand-primary text-white rounded-2xl font-bold text-lg shadow-md"
               >
                 下一个
               </button>
             </div>
           )}
        </div>
      </div>
    );
  }

  // 2. Completion Screen
  if (testCompleted) {
    return (
      <div className="max-w-md mx-auto p-8 flex flex-col items-center justify-center h-[80vh] text-center">
        <div className="w-24 h-24 bg-yellow-100 text-yellow-500 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <Star size={48} fill="currentColor" />
        </div>
        <h2 className="text-3xl font-bold text-slate-800 mb-2">学习完成！</h2>
        <p className="text-slate-500 mb-8">坚持学习，每天进步一点点！</p>
        <button 
          onClick={() => setStudyMode('browse')}
          className="bg-brand-primary text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:scale-105 transition-transform"
        >
          返回学习列表
        </button>
      </div>
    );
  }

  // 3. Category List (Home of Study Page)
  return (
    <div className="max-w-4xl mx-auto p-4 pb-24">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">拼音学习库</h1>
          <p className="text-slate-500 text-sm mt-1">掌握基础，轻松闯关</p>
        </div>
        
        {/* AI Review Button */}
        <button 
          onClick={startReview}
          className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-2 rounded-xl font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
        >
          <BrainCircuit size={18} />
          <span>智能复习</span>
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {groupNames.map(group => {
           const percent = getGroupProgress(group);
           const total = groups[group].length;
           const isComplete = percent === 100;

           return (
             <div key={group} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:border-brand-primary/30 transition-colors">
               <div className="flex justify-between items-start mb-4">
                 <div className="flex items-center gap-3">
                   <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${isComplete ? 'bg-green-100 text-green-600' : 'bg-brand-primary/10 text-brand-primary'}`}>
                      {groups[group][0].emoji}
                   </div>
                   <div>
                     <h3 className="font-bold text-lg text-slate-800">{group}</h3>
                     <p className="text-xs text-slate-400 font-bold">{total} 个拼音</p>
                   </div>
                 </div>
                 {isComplete && <Star size={20} className="text-yellow-400 fill-yellow-400" />}
               </div>

               {/* Progress Bar */}
               <div className="mb-4">
                 <div className="flex justify-between text-xs mb-1.5 font-bold">
                   <span className="text-slate-400">掌握程度</span>
                   <span className="text-brand-primary">{percent}%</span>
                 </div>
                 <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                   <div className="h-full bg-brand-primary transition-all duration-500" style={{ width: `${percent}%` }} />
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-3">
                 <button 
                   onClick={() => startStudy(group, 'browse')}
                   className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-slate-50 text-slate-600 font-bold text-sm hover:bg-slate-100 transition-colors"
                 >
                   <BookOpen size={16} /> 学习
                 </button>
                 <button 
                   onClick={() => startStudy(group, 'test')}
                   className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-brand-primary/10 text-brand-primary font-bold text-sm hover:bg-brand-primary hover:text-white transition-colors"
                 >
                   <Sparkles size={16} /> 测试
                 </button>
               </div>
             </div>
           );
        })}
      </div>
    </div>
  );
};