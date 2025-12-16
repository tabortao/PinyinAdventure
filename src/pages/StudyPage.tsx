import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { PinyinChart, UserPinyinProgress } from '../types/types';
import { getPinyinCharts, getUserPinyinProgress, updatePinyinProgress, getPinyinReviewList } from '../db/api';
import { BrainCircuit, Check, X, Volume2, BookOpen, Star, Sparkles, ChevronDown } from 'lucide-react';
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
  
  // UI State for sections
  const [expandedSection, setExpandedSection] = useState<string>('yunmu'); // default expand yunmu as it has subcategories
  
  // Review specific state
  const [reviewList, setReviewList] = useState<PinyinChart[]>([]);

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
  const startStudy = (items: PinyinChart[], mode: 'browse' | 'test', groupName: string) => {
    if (items.length === 0) return;
    setSelectedGroup(groupName);
    setReviewList(items); 
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
    // Transform review items to PinyinChart type for the view
    setReviewList(list);
    setStudyMode('review');
    setCurrentCardIndex(0);
    setShowAnswer(false);
    setTestCompleted(false);
    setLoading(false);
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
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  // 1. Study/Test/Review Mode UI
  if (studyMode !== 'browse' && !testCompleted && reviewList.length > 0) {
    const currentItem = reviewList[currentCardIndex];
    const isTest = studyMode === 'test' || studyMode === 'review';

    return (
      <div className="max-w-md mx-auto p-4 flex flex-col h-[calc(100vh-80px)] md:h-[calc(100vh-140px)]">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => setStudyMode('browse')} className="text-slate-400 hover:text-brand-primary font-bold text-sm flex items-center gap-1">
             <X size={24} /> 退出
          </button>
          <div className="text-brand-secondary font-bold text-lg">
            {currentCardIndex + 1} / {reviewList.length}
          </div>
        </div>

        {/* Card */}
        <div className="flex-1 bg-white rounded-3xl shadow-xl border border-slate-100 p-6 flex flex-col items-center justify-center relative overflow-hidden mb-6">
          
          {/* Top Hint */}
          <div className={`transition-all duration-300 flex flex-col items-center ${isTest && !showAnswer ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
             <div className="text-6xl mb-4 animate-in zoom-in">{currentItem.emoji}</div>
             <div className="text-brand-primary/80 font-bold text-xl mb-6 text-center">{currentItem.mnemonic}</div>
          </div>

          {/* Main Pinyin */}
          <div className="text-9xl font-black text-brand-dark mb-8 tracking-wider">
            {currentItem.pinyin}
          </div>

          {/* Action: Play Audio */}
          <button 
            onClick={(e) => { e.stopPropagation(); playAudio(currentItem.pinyin); }}
            className="mb-8 w-16 h-16 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center hover:bg-brand-primary hover:text-white transition-all shadow-sm active:scale-95"
          >
            <Volume2 size={32} />
          </button>

          {/* Example Word */}
          <div className={`transition-all duration-300 text-center ${isTest && !showAnswer ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
            <div className="text-lg text-slate-400 mb-1 font-bold">{currentItem.example_pinyin}</div>
            <div className="text-3xl font-bold text-slate-700">{currentItem.example_word}</div>
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
                 className="flex-1 bg-red-100 text-red-500 rounded-2xl font-bold text-xl flex flex-col items-center justify-center hover:bg-red-200 transition-colors active:scale-95"
               >
                 <X size={32} className="mb-1" />
                 需复习
               </button>
               <button 
                 onClick={() => handleTestResult(true)}
                 className="flex-1 bg-green-100 text-green-600 rounded-2xl font-bold text-xl flex flex-col items-center justify-center hover:bg-green-200 transition-colors active:scale-95"
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
                 className="flex-1 bg-slate-100 text-slate-400 rounded-2xl font-bold text-lg disabled:opacity-50"
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
        <div className="w-28 h-28 bg-yellow-100 text-yellow-500 rounded-full flex items-center justify-center mb-8 animate-bounce">
          <Star size={56} fill="currentColor" />
        </div>
        <h2 className="text-3xl font-bold text-slate-800 mb-4">学习完成！</h2>
        <p className="text-slate-500 mb-10 text-lg">坚持学习，每天进步一点点！</p>
        <button 
          onClick={() => setStudyMode('browse')}
          className="w-full bg-brand-primary text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-lg hover:scale-105 transition-transform"
        >
          返回学习列表
        </button>
      </div>
    );
  }

  // 3. Main Dashboard
  return (
    <div className="max-w-4xl mx-auto p-4 pb-24">
      {/* Header Area */}
      <div className="bg-white rounded-3xl p-6 mb-8 shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl font-black text-brand-dark mb-2">拼音学习中心</h1>
          <p className="text-slate-500 mb-6">掌握 {charts.length} 个基础拼音，轻松闯关</p>
          
          <div className="flex gap-3">
             <button 
               onClick={startReview}
               className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-3 rounded-xl font-bold shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
             >
               <BrainCircuit size={20} />
               <span>智能复习</span>
             </button>
             <div className="flex-1 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center justify-center p-2">
                <span className="text-xs text-slate-400 font-bold">已掌握</span>
                <span className="text-xl font-black text-brand-primary">
                  {progress.filter(p => p.is_mastered).length} <span className="text-sm text-slate-300">/ {charts.length}</span>
                </span>
             </div>
          </div>
        </div>
        {/* Decor */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      </div>

      <div className="space-y-6">
        
        {/* 1. Initial Consonants (声母) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
           <div 
             className="p-5 flex items-center justify-between cursor-pointer active:bg-slate-50"
             onClick={() => setExpandedSection(expandedSection === 'shengmu' ? '' : 'shengmu')}
           >
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-bold">b</div>
               <div>
                 <h3 className="font-bold text-lg text-slate-800">声母</h3>
                 <p className="text-xs text-slate-400 font-bold">{pinyinData.initials.length} 个拼音</p>
               </div>
             </div>
             <ChevronDown size={20} className={`text-slate-300 transition-transform ${expandedSection === 'shengmu' ? 'rotate-180' : ''}`} />
           </div>
           
           {expandedSection === 'shengmu' && (
             <div className="px-5 pb-5 animate-in slide-in-from-top-2">
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1.5 font-bold">
                    <span className="text-slate-400">掌握进度</span>
                    <span className="text-brand-primary">{getProgressPercentage(pinyinData.initials)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-primary transition-all duration-500" style={{ width: `${getProgressPercentage(pinyinData.initials)}%` }} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                   <button 
                     onClick={() => startStudy(pinyinData.initials, 'browse', '声母')}
                     className="py-3 rounded-xl bg-slate-50 text-slate-600 font-bold text-sm hover:bg-slate-100 flex items-center justify-center gap-2"
                   >
                     <BookOpen size={18} /> 学习卡片
                   </button>
                   <button 
                     onClick={() => startStudy(pinyinData.initials, 'test', '声母')}
                     className="py-3 rounded-xl bg-brand-primary/10 text-brand-primary font-bold text-sm hover:bg-brand-primary hover:text-white transition-colors flex items-center justify-center gap-2"
                   >
                     <Sparkles size={18} /> 记忆测试
                   </button>
                </div>
             </div>
           )}
        </div>

        {/* 2. Finals (韵母) - Has Subgroups */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
           <div 
             className="p-5 flex items-center justify-between cursor-pointer active:bg-slate-50"
             onClick={() => setExpandedSection(expandedSection === 'yunmu' ? '' : 'yunmu')}
           >
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center font-bold">a</div>
               <div>
                 <h3 className="font-bold text-lg text-slate-800">韵母</h3>
                 <p className="text-xs text-slate-400 font-bold">{pinyinData.finals.all.length} 个拼音</p>
               </div>
             </div>
             <ChevronDown size={20} className={`text-slate-300 transition-transform ${expandedSection === 'yunmu' ? 'rotate-180' : ''}`} />
           </div>
           
           {expandedSection === 'yunmu' && (
             <div className="px-5 pb-5 space-y-4 animate-in slide-in-from-top-2">
                {/* Subgroups Loop */}
                {Object.entries(pinyinData.finals.groups).map(([groupName, items]) => (
                  <div key={groupName} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-bold text-slate-700">{groupName} <span className="text-slate-400 text-xs ml-1">({items.length})</span></span>
                      <span className="text-xs font-bold text-brand-primary">{getProgressPercentage(items)}%</span>
                    </div>
                    <div className="flex gap-2">
                       <button 
                         onClick={() => startStudy(items, 'browse', groupName)}
                         className="flex-1 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 shadow-sm"
                       >
                         学习
                       </button>
                       <button 
                         onClick={() => startStudy(items, 'test', groupName)}
                         className="flex-1 py-2 bg-white border border-brand-primary/20 text-brand-primary rounded-lg text-xs font-bold shadow-sm"
                       >
                         测试
                       </button>
                    </div>
                  </div>
                ))}
             </div>
           )}
        </div>

        {/* 3. Overall Recognition (整体认读) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
           <div 
             className="p-5 flex items-center justify-between cursor-pointer active:bg-slate-50"
             onClick={() => setExpandedSection(expandedSection === 'zhengti' ? '' : 'zhengti')}
           >
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center font-bold">zi</div>
               <div>
                 <h3 className="font-bold text-lg text-slate-800">整体认读音节</h3>
                 <p className="text-xs text-slate-400 font-bold">{pinyinData.overall.length} 个拼音</p>
               </div>
             </div>
             <ChevronDown size={20} className={`text-slate-300 transition-transform ${expandedSection === 'zhengti' ? 'rotate-180' : ''}`} />
           </div>
           
           {expandedSection === 'zhengti' && (
             <div className="px-5 pb-5 animate-in slide-in-from-top-2">
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1.5 font-bold">
                    <span className="text-slate-400">掌握进度</span>
                    <span className="text-brand-primary">{getProgressPercentage(pinyinData.overall)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-primary transition-all duration-500" style={{ width: `${getProgressPercentage(pinyinData.overall)}%` }} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                   <button 
                     onClick={() => startStudy(pinyinData.overall, 'browse', '整体认读')}
                     className="py-3 rounded-xl bg-slate-50 text-slate-600 font-bold text-sm hover:bg-slate-100 flex items-center justify-center gap-2"
                   >
                     <BookOpen size={18} /> 学习卡片
                   </button>
                   <button 
                     onClick={() => startStudy(pinyinData.overall, 'test', '整体认读')}
                     className="py-3 rounded-xl bg-brand-primary/10 text-brand-primary font-bold text-sm hover:bg-brand-primary hover:text-white transition-colors flex items-center justify-center gap-2"
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