import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { PinyinChart, UserPinyinProgress } from '../types/types';
import { getPinyinCharts, getUserPinyinProgress, updatePinyinProgress, getPinyinReviewList, getUserQuizProgress } from '../db/api';
import { BrainCircuit, Check, X, Volume2, BookOpen, Star, Sparkles, ChevronDown, Smile, Play } from 'lucide-react';
import { playCorrectSound, playWrongSound } from '../lib/audio';
import { getPinyinTTS } from '../lib/pinyinTTS';

import { useNavigate } from 'react-router-dom';

export const StudyPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate(); // Hook must be at top level of component
  const [charts, setCharts] = useState<PinyinChart[]>([]);
  const [progress, setProgress] = useState<UserPinyinProgress[]>([]);
  const [quizLevel, setQuizLevel] = useState(1);
  const [loading, setLoading] = useState(true);
  
  // State for study modes
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [studyMode, setStudyMode] = useState<'list' | 'learn' | 'test' | 'review'>('list');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  
  // Custom Modal State
  const [showNoReviewModal, setShowNoReviewModal] = useState(false);
  
  // UI State for sections
  const [expandedSection, setExpandedSection] = useState<string>('yunmu'); // default expand yunmu as it has subcategories
  
  // Review specific state
  const [reviewList, setReviewList] = useState<(PinyinChart & { progress_id?: string })[]>([]);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    const [c, p, qp] = await Promise.all([
      getPinyinCharts(),
      getUserPinyinProgress(user.id),
      getUserQuizProgress(user.id)
    ]);
    setCharts(c);
    setProgress(p);

    if (qp && qp.length > 0) {
      const maxLevel = Math.max(...qp.map(i => i.level_id));
      setQuizLevel(maxLevel + 1);
    }

    setLoading(false);
  };

  // Grouping logic for Study View
  const pinyinData = useMemo(() => {
    const data = {
      initials: charts.filter(c => c.category === 'initial'),
      finals: {
        all: charts.filter(c => c.category === 'final'),
        groups: {} as Record<string, PinyinChart[]>
      },
      overall: charts.filter(c => c.category === 'overall')
    };

    // Group finals by group_name
    data.finals.all.forEach(c => {
      if (!data.finals.groups[c.group_name]) {
        data.finals.groups[c.group_name] = [];
      }
      data.finals.groups[c.group_name].push(c);
    });

    return data;
  }, [charts]);

  const getProgressPercentage = (items: PinyinChart[]) => {
    if (items.length === 0) return 0;
    const masteredCount = items.filter(item => 
      progress.some(p => p.pinyin_char === item.id && p.is_mastered)
    ).length;
    return Math.round((masteredCount / items.length) * 100);
  };

  // Handlers
  const startStudy = (items: PinyinChart[], mode: 'learn' | 'test', groupName: string) => {
    if (!items || items.length === 0) {
      alert("该分类下暂时没有内容");
      return;
    }
    setSelectedGroup(groupName); // Just for title/tracking
    setReviewList(items); // Using reviewList for generic study
    setStudyMode(mode);
    setCurrentCardIndex(0);
    setShowAnswer(false);
    setTestCompleted(false);
  };

  const startReview = async () => {
    if (!user) return;
    setLoading(true);
    const list = await getPinyinReviewList(user.id);
    setLoading(false);
    
    if (list.length === 0) {
      setShowNoReviewModal(true);
      return;
    }
    setReviewList(list);
    setStudyMode('review');
    setCurrentCardIndex(0);
    setShowAnswer(false);
    setTestCompleted(false);
  };

  const startRandomTest = () => {
    if (charts.length === 0) return;
    const shuffled = [...charts].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 30);
    setReviewList(selected);
    setStudyMode('test');
    setCurrentCardIndex(0);
    setShowAnswer(false);
    setTestCompleted(false);
  };

  const handleNextCard = () => {
    if (currentCardIndex < reviewList.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
      setShowAnswer(false);
    } else {
      setTestCompleted(true);
    }
  };

  const handleTestResult = async (isRemembered: boolean) => {
    if (!user) return;
    
    if (isRemembered) {
      playCorrectSound();
    } else {
      playWrongSound();
    }

    const currentItem = reviewList[currentCardIndex];
    
    // Optimistic update
    await updatePinyinProgress(user.id, currentItem.id, isRemembered);
    
    // Refresh background progress
    getUserPinyinProgress(user.id).then(setProgress);

    handleNextCard();
  };

  const playAudio = (text: string) => {
    const textToSpeak = getPinyinTTS(text);
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  // 1. Study/Test/Review Mode UI
  if (studyMode !== 'list' && !testCompleted && reviewList.length > 0) {
    const currentItem = reviewList[currentCardIndex];
    const isTest = studyMode === 'test' || studyMode === 'review';
    // For learn mode, always show details. For test modes, check showAnswer state.
    const showDetails = studyMode === 'learn' || showAnswer;

    return (
      <div className="max-w-md mx-auto p-4 flex flex-col h-[calc(100vh-80px)] md:h-[calc(100vh-140px)]">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => setStudyMode('list')} className="text-slate-400 hover:text-brand-primary font-bold text-sm flex items-center gap-1 transition-colors">
             <X size={24} /> 退出
          </button>
          <div className="text-brand-secondary font-bold text-lg">
            {currentCardIndex + 1} / {reviewList.length}
          </div>
        </div>

        {/* Card */}
        <div className="flex-1 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 p-6 flex flex-col items-center justify-center relative overflow-hidden mb-6 transition-colors duration-300">
          
          {/* Top Hint */}
          <div className={`transition-all duration-300 flex flex-col items-center ${!showDetails ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
             <div className="text-6xl mb-4 animate-in zoom-in">{currentItem.emoji}</div>
             <div className="text-brand-primary/80 font-bold text-xl mb-6 text-center">{currentItem.mnemonic}</div>
          </div>

          {/* Main Pinyin - BIGGER FONT */}
          <div className="text-8xl md:text-9xl font-black text-brand-dark dark:text-brand-primary mb-4 tracking-wider leading-none select-none text-center whitespace-nowrap max-w-full transition-colors duration-300">
            {currentItem.pinyin}
          </div>

          {/* Action: Play Audio */}
          <button 
            onClick={(e) => { e.stopPropagation(); playAudio(currentItem.pinyin); }}
            className="mb-8 w-20 h-20 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center hover:bg-brand-primary hover:text-white transition-all shadow-sm active:scale-95"
          >
            <Volume2 size={40} />
          </button>

          {/* Example Word */}
          <div className={`transition-all duration-300 text-center ${!showDetails ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
            <div className="text-xl text-slate-400 dark:text-slate-500 mb-2 font-bold">{currentItem.example_pinyin}</div>
            <div className="text-4xl font-bold text-slate-700 dark:text-slate-200">{currentItem.example_word}</div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="h-24">
           {isTest && !showAnswer ? (
             <button 
               onClick={() => setShowAnswer(true)}
               className="w-full h-full bg-brand-primary text-white rounded-2xl text-2xl font-bold shadow-lg hover:bg-brand-dark transition-colors active:scale-95 transform duration-100"
             >
               显示答案
             </button>
           ) : isTest && showAnswer ? (
             <div className="flex gap-4 h-full">
               <button 
                 onClick={() => handleTestResult(false)}
                 className="flex-1 bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400 rounded-2xl font-bold text-xl flex flex-col items-center justify-center hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors active:scale-95"
               >
                 <X size={32} className="mb-1" />
                 需复习
               </button>
               <button 
                 onClick={() => handleTestResult(true)}
                 className="flex-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-2xl font-bold text-xl flex flex-col items-center justify-center hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors active:scale-95"
               >
                 <Check size={32} className="mb-1" />
                 记住了
               </button>
             </div>
           ) : (
             <div className="flex gap-4 h-full">
               <button 
                 onClick={() => currentCardIndex > 0 && setCurrentCardIndex(p => p - 1)}
                 disabled={currentCardIndex === 0}
                 className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-2xl font-bold text-lg disabled:opacity-50 transition-colors"
               >
                 上一个
               </button>
               <button 
                 onClick={handleNextCard}
                 className="flex-1 bg-brand-primary text-white rounded-2xl font-bold text-xl shadow-md active:scale-95"
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
      <div className="max-w-md mx-auto p-8 flex flex-col items-center justify-center h-[80vh] text-center animate-in zoom-in duration-300">
        <div className="w-28 h-28 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-500 dark:text-yellow-400 rounded-full flex items-center justify-center mb-8 animate-bounce transition-colors">
          <Star size={56} fill="currentColor" />
        </div>
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-4 transition-colors">学习完成！</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-10 text-lg transition-colors">坚持学习，每天进步一点点！</p>
        <button 
          onClick={() => {
            setStudyMode('list');
            setTestCompleted(false);
          }}
          className="w-full bg-brand-primary text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-lg hover:scale-105 transition-transform"
        >
          返回学习列表
        </button>
      </div>
    );
  }

  // 3. Main Dashboard
  return (
    <div className="max-w-4xl mx-auto p-4 pb-24 relative">
      {/* Custom Modal for No Reviews */}
      {showNoReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center scale-100 animate-in zoom-in-95 duration-200 transition-colors">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-500 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-6 transition-colors">
              <Smile size={48} />
            </div>
            <h3 className="text-2xl font-black text-brand-dark dark:text-brand-primary mb-3 transition-colors">太棒了！</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium transition-colors">暂时没有需要复习的拼音。<br/>休息一下，稍后再来吧！</p>
            <button 
              onClick={() => setShowNoReviewModal(false)}
              className="w-full bg-brand-primary text-white py-3.5 rounded-xl font-bold text-lg hover:bg-brand-dark transition-colors"
            >
              我知道了
            </button>
          </div>
        </div>
      )}

      {/* Header Area */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 mb-8 shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden transition-colors">
        <div className="relative z-10">
          <h1 className="text-2xl font-black text-brand-dark dark:text-brand-primary mb-2 transition-colors">拼音基础</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-6 transition-colors">掌握 {charts.length} 个基础拼音，轻松闯关</p>
          
          <div className="flex flex-col gap-3">
             <div className="flex gap-3">
               <button 
                 onClick={startReview}
                 className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-3 rounded-xl font-bold shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
               >
                 <BrainCircuit size={20} />
                 <span>智能复习</span>
               </button>
               <button 
                  onClick={startRandomTest}
                  className="flex-1 bg-gradient-to-r from-violet-500 to-purple-500 text-white px-4 py-3 rounded-xl font-bold shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Sparkles size={20} />
                  <span>随机测试</span>
                </button>
             </div>

             <div className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between px-4 py-3 transition-colors">
                <span className="text-sm text-slate-400 dark:text-slate-500 font-bold transition-colors">已掌握基础拼音</span>
                <span className="text-xl font-black text-brand-primary">
                  {progress.filter(p => p.is_mastered).length} <span className="text-sm text-slate-300 dark:text-slate-600">/ {charts.length}</span>
                </span>
             </div>
          </div>
        </div>
        {/* Decor */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 dark:bg-brand-primary/10 rounded-full -translate-y-1/2 translate-x-1/2 transition-colors" />
      </div>

      <div className="space-y-6">
        
        {/* 1. Initial Consonants (声母) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors">
           <div 
             className="p-5 flex items-center justify-between cursor-pointer active:bg-slate-50 dark:active:bg-slate-800 transition-colors"
             onClick={() => setExpandedSection(expandedSection === 'shengmu' ? '' : 'shengmu')}
           >
             <div className="flex items-center gap-3">
               <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center font-bold text-2xl transition-colors">🅱️</div>
               <div>
                 <h3 className="font-bold text-lg text-slate-800 dark:text-white transition-colors">声母</h3>
                 <p className="text-xs text-slate-400 dark:text-slate-500 font-bold transition-colors">{pinyinData.initials.length} 个拼音</p>
               </div>
             </div>
             <ChevronDown size={20} className={`text-slate-300 dark:text-slate-600 transition-transform ${expandedSection === 'shengmu' ? 'rotate-180' : ''}`} />
           </div>
           
           {expandedSection === 'shengmu' && (
             <div className="px-5 pb-5 animate-in slide-in-from-top-2">
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1.5 font-bold">
                    <span className="text-slate-400 dark:text-slate-500 transition-colors">掌握进度</span>
                    <span className="text-brand-primary">{getProgressPercentage(pinyinData.initials)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden transition-colors">
                    <div className="h-full bg-brand-primary transition-all duration-500" style={{ width: `${getProgressPercentage(pinyinData.initials)}%` }} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                   <button 
                     onClick={() => startStudy(pinyinData.initials, 'learn', '声母')}
                     className="py-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center gap-2 transition-colors"
                   >
                     <BookOpen size={18} /> 学习卡片
                   </button>
                   <button 
                     onClick={() => startStudy(pinyinData.initials, 'test', '声母')}
                     className="py-3 rounded-xl bg-brand-primary/10 dark:bg-brand-primary/20 text-brand-primary font-bold text-sm hover:bg-brand-primary hover:text-white transition-colors flex items-center justify-center gap-2"
                   >
                     <Sparkles size={18} /> 记忆测试
                   </button>
                </div>
             </div>
           )}
        </div>

        {/* 2. Finals (韵母) - Has Subgroups */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors">
           <div 
             className="p-5 flex items-center justify-between cursor-pointer active:bg-slate-50 dark:active:bg-slate-800 transition-colors"
             onClick={() => setExpandedSection(expandedSection === 'yunmu' ? '' : 'yunmu')}
           >
             <div className="flex items-center gap-3">
               <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center font-bold text-2xl transition-colors">🅰️</div>
               <div>
                 <h3 className="font-bold text-lg text-slate-800 dark:text-white transition-colors">韵母</h3>
                 <p className="text-xs text-slate-400 dark:text-slate-500 font-bold transition-colors">{pinyinData.finals.all.length} 个拼音</p>
               </div>
             </div>
             <ChevronDown size={20} className={`text-slate-300 dark:text-slate-600 transition-transform ${expandedSection === 'yunmu' ? 'rotate-180' : ''}`} />
           </div>
           
           {expandedSection === 'yunmu' && (
             <div className="px-5 pb-5 space-y-4 animate-in slide-in-from-top-2">
                {/* Subgroups Loop */}
                {Object.entries(pinyinData.finals.groups).map(([groupName, items]) => (
                  <div key={groupName} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700 transition-colors">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-bold text-slate-700 dark:text-slate-200 transition-colors">{groupName} <span className="text-slate-400 dark:text-slate-500 text-xs ml-1">({items.length})</span></span>
                      <span className="text-xs font-bold text-brand-primary">{getProgressPercentage(items)}%</span>
                    </div>
                    <div className="flex gap-2">
                       <button 
                         onClick={() => startStudy(items, 'learn', groupName)}
                         className="flex-1 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 shadow-sm transition-colors"
                       >
                         学习卡片
                       </button>
                       <button 
                         onClick={() => startStudy(items, 'test', groupName)}
                         className="flex-1 py-2 bg-white dark:bg-slate-700 border border-brand-primary/20 dark:border-brand-primary/40 text-brand-primary rounded-lg text-xs font-bold shadow-sm transition-colors"
                       >
                         记忆测试
                       </button>
                    </div>
                  </div>
                ))}
             </div>
           )}
        </div>

        {/* 3. Overall Recognition (整体认读) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors">
           <div 
             className="p-5 flex items-center justify-between cursor-pointer active:bg-slate-50 dark:active:bg-slate-800 transition-colors"
             onClick={() => setExpandedSection(expandedSection === 'zhengti' ? '' : 'zhengti')}
           >
             <div className="flex items-center gap-3">
               <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center font-bold text-2xl transition-colors">🇨🇳</div>
               <div>
                 <h3 className="font-bold text-lg text-slate-800 dark:text-white transition-colors">整体认读</h3>
                 <p className="text-xs text-slate-400 dark:text-slate-500 font-bold transition-colors">{pinyinData.overall.length} 个拼音</p>
               </div>
             </div>
             <ChevronDown size={20} className={`text-slate-300 dark:text-slate-600 transition-transform ${expandedSection === 'zhengti' ? 'rotate-180' : ''}`} />
           </div>
           
           {expandedSection === 'zhengti' && (
             <div className="px-5 pb-5 animate-in slide-in-from-top-2">
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1.5 font-bold">
                    <span className="text-slate-400 dark:text-slate-500 transition-colors">掌握进度</span>
                    <span className="text-brand-primary">{getProgressPercentage(pinyinData.overall)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden transition-colors">
                    <div className="h-full bg-brand-primary transition-all duration-500" style={{ width: `${getProgressPercentage(pinyinData.overall)}%` }} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                   <button 
                     onClick={() => startStudy(pinyinData.overall, 'learn', '整体认读')}
                     className="py-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center gap-2 transition-colors"
                   >
                     <BookOpen size={18} /> 学习卡片
                   </button>
                   <button 
                     onClick={() => startStudy(pinyinData.overall, 'test', '整体认读')}
                     className="py-3 rounded-xl bg-brand-primary/10 dark:bg-brand-primary/20 text-brand-primary font-bold text-sm hover:bg-brand-primary hover:text-white transition-colors flex items-center justify-center gap-2"
                   >
                     <Sparkles size={18} /> 记忆测试
                   </button>
                </div>
             </div>
           )}
        </div>



      </div>
    </div>
  );
};