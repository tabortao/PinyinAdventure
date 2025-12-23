import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { PinyinChart, UserPinyinProgress } from '../types/types';
import { getPinyinCharts, getUserPinyinProgress, updatePinyinProgress, getPinyinReviewList, getUserQuizProgress, addPracticeScore } from '../db/api';
import { BrainCircuit, Check, X, Volume2, BookOpen, Star, Sparkles, ChevronDown, Smile, Play, LayoutGrid, ArrowLeft } from 'lucide-react';
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
  const [showLibrary, setShowLibrary] = useState(false);
  
  // State for study modes
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [studyMode, setStudyMode] = useState<'list' | 'learn' | 'test' | 'review'>('list');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  
  // Custom Modal State
  const [showNoReviewModal, setShowNoReviewModal] = useState(false);
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
  
  const [libraryTab, setLibraryTab] = useState<'initial' | 'final' | 'overall'>('initial');
  
  const [expandedSection, setExpandedSection] = useState<string>('yunmu');
  // Grouping logic for Study View
  const pinyinData = useMemo(() => {
    return {
      initials: charts.filter(c => c.category === 'initial'),
      finals: {
        simple: charts.filter(c => c.category === 'final_simple'),
        compound: charts.filter(c => c.category === 'final_compound'),
        front: charts.filter(c => c.category === 'final_front'),
        back: charts.filter(c => c.category === 'final_back'),
        all: charts.filter(c => c.category.startsWith('final')),
      },
      overall: charts.filter(c => c.category === 'overall')
    };
  }, [charts]);

  const getProgressPercentage = (items: PinyinChart[]) => {
    if (items.length === 0) return 0;
    const masteredCount = items.filter(item => 
      progress.some(p => p.pinyin_char === item.id && p.is_mastered)
    ).length;
    return Math.round((masteredCount / items.length) * 100);
  };

  // Handlers
  const startStudy = (items: PinyinChart[], mode: 'learn' | 'test', groupName: string, startIndex: number = 0) => {
    if (!items || items.length === 0) {
      alert("该分类下暂时没有内容");
      return;
    }
    
    let studyItems = [...items];
    if (mode === 'test') {
      studyItems = studyItems.sort(() => Math.random() - 0.5);
    }

    setSelectedGroup(groupName); 
    setReviewList(studyItems); 
    setStudyMode(mode);
    setCurrentCardIndex(mode === 'test' ? 0 : startIndex);
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
      await addPracticeScore(user.id, 1);
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
      <div className="max-w-md mx-auto p-4 flex flex-col h-[calc(100vh-80px)]">
        {/* Compact Header */}
        <div className="flex justify-between items-center mb-2 shrink-0">
          <button onClick={() => setStudyMode('list')} className="text-slate-400 hover:text-brand-primary font-bold text-sm flex items-center gap-1">
             <X size={20} /> 退出
          </button>
          <div className="text-brand-secondary font-bold text-base">
            {currentCardIndex + 1} / {reviewList.length}
          </div>
        </div>

        {/* Flexible Card Area */}
        <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-800 p-4 flex flex-col items-center justify-center relative overflow-hidden mb-4 min-h-0">
          
          {/* Top Hint */}
          <div className={`transition-all duration-300 flex flex-col items-center ${!showDetails ? 'opacity-0 scale-95 h-0 overflow-hidden' : 'opacity-100 scale-100 mb-4'}`}>
             <div className="text-5xl mb-2">{currentItem.emoji}</div>
             <div className="text-brand-primary/80 font-bold text-base text-center px-4">{currentItem.mnemonic}</div>
          </div>

          {/* Main Pinyin */}
          <div className="text-8xl md:text-9xl font-black text-brand-dark dark:text-brand-primary mb-6 tracking-wider leading-none select-none text-center whitespace-nowrap">
            {currentItem.pinyin}
          </div>

          {/* Action: Play Audio */}
          <button 
            onClick={(e) => { e.stopPropagation(); playAudio(currentItem.pinyin); }}
            className="mb-6 w-16 h-16 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center hover:bg-brand-primary hover:text-white transition-colors shadow-sm active:scale-95"
          >
            <Volume2 size={32} />
          </button>

          {/* Details Section (Word) */}
          <div className={`transition-all duration-300 text-center ${!showDetails ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
            <div className="text-lg text-slate-400 dark:text-slate-500 mb-1 font-bold">{currentItem.example_pinyin}</div>
            <div className="text-3xl font-bold text-slate-700 dark:text-slate-200">{currentItem.example_word}</div>
          </div>
        </div>

        {/* Compact Footer Actions */}
        <div className="h-16 shrink-0">
           {isTest && !showAnswer ? (
             <button 
               onClick={() => setShowAnswer(true)}
               className="w-full h-full bg-brand-primary text-white rounded-xl text-lg font-bold shadow-md hover:bg-brand-dark transition-colors active:scale-95"
             >
               显示答案
             </button>
           ) : isTest && showAnswer ? (
             <div className="flex gap-3 h-full">
               <button 
                 onClick={() => handleTestResult(false)}
                 className="flex-1 bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400 rounded-xl font-bold text-lg flex flex-col items-center justify-center hover:bg-red-200 active:scale-95"
               >
                 <X size={24} className="mb-0.5" />
                 需复习
               </button>
               <button 
                 onClick={() => handleTestResult(true)}
                 className="flex-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl font-bold text-lg flex flex-col items-center justify-center hover:bg-green-200 active:scale-95"
               >
                 <Check size={24} className="mb-0.5" />
                 记住了
               </button>
             </div>
           ) : (
             <div className="flex gap-3 h-full">
               <button 
                 onClick={() => currentCardIndex > 0 && setCurrentCardIndex(p => p - 1)}
                 disabled={currentCardIndex === 0}
                 className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-xl font-bold text-base disabled:opacity-50 transition-colors active:scale-95"
               >
                 上一个
               </button>
               <button 
                 onClick={handleNextCard}
                 className="flex-1 bg-brand-primary text-white rounded-xl font-bold text-lg shadow-md active:scale-95"
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

  // 3. Main Dashboard (Library View)
  if (showLibrary) {
    const renderGrid = (items: PinyinChart[], groupName: string) => (
      <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
        {items.map((chart, index) => (
          <button
            key={chart.id}
            onClick={() => {
              // Pass the CURRENT LIST (items) so prev/next works within this category
              startStudy(items, 'learn', groupName, index);
            }}
            className="aspect-square bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center p-2 hover:shadow-md hover:border-brand-primary active:scale-95 transition-all group"
          >
            <span className="text-xl font-black text-slate-700 dark:text-white mb-0.5 group-hover:text-brand-primary transition-colors">{chart.pinyin}</span>
            <span className="text-lg group-hover:scale-110 transition-transform">{chart.emoji}</span>
          </button>
        ))}
      </div>
    );

    return (
      <div className="max-w-6xl mx-auto p-4 flex flex-col h-[calc(100vh-80px)]">
        <div className="flex items-center gap-3 mb-4 pt-2">
          <button 
            onClick={() => setShowLibrary(false)} 
            className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm active:scale-95 transition-transform"
          >
            <ArrowLeft className="text-slate-600 dark:text-slate-300 w-5 h-5" />
          </button>
          <h1 className="text-xl font-black text-brand-dark dark:text-brand-primary">拼音库</h1>
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-4 shrink-0">
            {(['initial', 'final', 'overall'] as const).map(tab => (
                <button
                    key={tab}
                    onClick={() => setLibraryTab(tab)}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                        libraryTab === tab 
                        ? 'bg-white dark:bg-slate-700 text-brand-primary shadow-sm' 
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                >
                    {tab === 'initial' ? '声母' : tab === 'final' ? '韵母' : '整体认读'}
                </button>
            ))}
        </div>

        {/* Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0 pb-4">
            {libraryTab === 'initial' && (
                <div>
                    <div className="text-sm font-bold text-slate-400 mb-2">声母 (23个)</div>
                    {renderGrid(pinyinData.initials, '声母')}
                </div>
            )}
            
            {libraryTab === 'overall' && (
                <div>
                    <div className="text-sm font-bold text-slate-400 mb-2">整体认读音节 (16个)</div>
                    {renderGrid(pinyinData.overall, '整体认读')}
                </div>
            )}

            {libraryTab === 'final' && (
                <div className="space-y-6">
                    <section>
                        <div className="text-sm font-bold text-slate-400 mb-2">单韵母 (6个)</div>
                        {renderGrid(pinyinData.finals.simple, '单韵母')}
                    </section>
                    <section>
                        <div className="text-sm font-bold text-slate-400 mb-2">复韵母 (9个)</div>
                        {renderGrid(pinyinData.finals.compound, '复韵母')}
                    </section>
                    <section>
                        <div className="text-sm font-bold text-slate-400 mb-2">前鼻韵母 (5个)</div>
                        {renderGrid(pinyinData.finals.front, '前鼻韵母')}
                    </section>
                    <section>
                        <div className="text-sm font-bold text-slate-400 mb-2">后鼻韵母 (4个)</div>
                        {renderGrid(pinyinData.finals.back, '后鼻韵母')}
                    </section>
                </div>
            )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 pb-16 relative">
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
             
             <button
               onClick={() => setShowLibrary(true)}
               className="w-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-4 py-3 rounded-xl font-bold shadow-sm hover:shadow-md border border-slate-200 dark:border-slate-700 transition-all active:scale-95 flex items-center justify-center gap-2"
             >
                <LayoutGrid size={20} className="text-brand-secondary" />
                <span>拼音库</span>
             </button>

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
                {[
                  { name: '单韵母', items: pinyinData.finals.simple },
                  { name: '复韵母', items: pinyinData.finals.compound },
                  { name: '前鼻韵母', items: pinyinData.finals.front },
                  { name: '后鼻韵母', items: pinyinData.finals.back }
                ].map((group) => (
                  <div key={group.name} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700 transition-colors">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-bold text-slate-700 dark:text-slate-200 transition-colors">{group.name} <span className="text-slate-400 dark:text-slate-500 text-xs ml-1">({group.items.length})</span></span>
                      <span className="text-xs font-bold text-brand-primary">{getProgressPercentage(group.items)}%</span>
                    </div>
                    <div className="flex gap-2">
                       <button 
                         onClick={() => startStudy(group.items, 'learn', group.name)}
                         className="flex-1 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 shadow-sm transition-colors"
                       >
                         学习卡片
                       </button>
                       <button 
                         onClick={() => startStudy(group.items, 'test', group.name)}
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