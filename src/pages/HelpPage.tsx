import { ArrowLeft, BookOpen, BrainCircuit, Gamepad2, Layers, Smartphone, Sparkles, Zap, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { WechatModal } from '../components/common/WechatModal';

export const HelpPage = () => {
  const navigate = useNavigate();
  const [showWechatModal, setShowWechatModal] = useState(false);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24 md:pb-6 relative text-slate-900 dark:text-slate-100 transition-colors">
      <WechatModal isOpen={showWechatModal} onClose={() => setShowWechatModal(false)} />

      <button 
        onClick={() => navigate('/settings')} 
        className="flex items-center text-slate-500 dark:text-slate-400 hover:text-brand-primary dark:hover:text-brand-primary mb-6 transition-colors font-bold text-sm"
      >
        <ArrowLeft size={18} className="mr-1" /> 返回设置
      </button>
      
      <div className="text-center mb-10">
        <h1 className="text-3xl font-black text-brand-dark dark:text-white mb-2">帮助与说明</h1>
        <div className="w-16 h-1.5 bg-brand-primary rounded-full mx-auto opacity-50"></div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Project Intro */}
        <div className="col-span-1 md:col-span-2 bg-gradient-to-br from-brand-primary/5 to-blue-50 dark:from-brand-primary/10 dark:to-blue-900/20 p-6 rounded-3xl border border-brand-primary/10 dark:border-brand-primary/20 relative overflow-hidden transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 dark:bg-brand-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
               <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl shadow-sm flex items-center justify-center text-brand-primary">
                 <BookOpen size={20} />
               </div>
               <h2 className="text-xl font-bold text-brand-dark dark:text-white">项目简介</h2>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              "智能拼音大闯关" 是一款专为小学生设计的互动式拼音学习应用。
              我们结合了游戏化教学理念，通过趣味闯关的方式，帮助孩子轻松掌握汉语拼音的声母、韵母及整体认读音节。
            </p>
          </div>
        </div>

        {/* Philosophy */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
           <div className="flex items-center gap-3 mb-4">
             <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400 transition-colors">
               <BrainCircuit size={20} />
             </div>
             <h2 className="text-lg font-bold text-slate-800 dark:text-white">设计理念</h2>
           </div>
           <ul className="space-y-3">
             {[
               { icon: <Gamepad2 size={16} />, text: '寓教于乐：游戏化闯关体验' },
               { icon: <Zap size={16} />, text: '科学记忆：艾宾浩斯智能复习' },
               { icon: <Sparkles size={16} />, text: '即时反馈：动画激励系统' },
               { icon: <BrainCircuit size={16} />, text: 'AI驱动：个性化学习路径' },
             ].map((item, i) => (
               <li key={i} className="flex items-center gap-3 text-slate-600 dark:text-slate-400 text-sm font-bold">
                 <span className="text-slate-400 dark:text-slate-600">{item.icon}</span>
                 {item.text}
               </li>
             ))}
           </ul>
        </div>

        {/* Features */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
           <div className="flex items-center gap-3 mb-4">
             <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center text-orange-600 dark:text-orange-400 transition-colors">
               <Layers size={20} />
             </div>
             <h2 className="text-lg font-bold text-slate-800 dark:text-white">功能特点</h2>
           </div>
           <ul className="space-y-3">
             <li className="flex items-start gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-brand-secondary mt-1.5 flex-shrink-0"></div>
               <span className="text-slate-600 dark:text-slate-400 text-sm"><strong className="text-slate-800 dark:text-slate-200">智能题库</strong>：涵盖人教版小学全阶段识字表。</span>
             </li>
             <li className="flex items-start gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-brand-secondary mt-1.5 flex-shrink-0"></div>
               <span className="text-slate-600 dark:text-slate-400 text-sm"><strong className="text-slate-800 dark:text-slate-200">错题本</strong>：自动记录错误，针对性强化训练。</span>
             </li>
             <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-secondary mt-1.5 flex-shrink-0"></div>
                <span className="text-slate-600 dark:text-slate-400 text-sm"><strong className="text-slate-800 dark:text-slate-200">多模式</strong>：支持单字、词语、句子挑战。</span>
             </li>
             <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-secondary mt-1.5 flex-shrink-0"></div>
                <span className="text-slate-600 dark:text-slate-400 text-sm"><strong className="text-slate-800 dark:text-slate-200">AI 助教</strong>：智能生成复习关卡，查漏补缺。</span>
             </li>
             <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-secondary mt-1.5 flex-shrink-0"></div>
                <span className="text-slate-600 dark:text-slate-400 text-sm"><strong className="text-slate-800 dark:text-slate-200">钓鱼游戏</strong>：趣味益智，手眼协调训练。</span>
             </li>
           </ul>
        </div>
      </div>

      <div className="mt-10 text-center space-y-4">
        <div className="flex flex-col items-center gap-2">
            <span className="text-slate-400 dark:text-slate-500 text-xs font-bold">作者：Tabor</span>
            <div className="inline-block px-4 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-xs font-bold font-mono transition-colors">
              v1.6.2
            </div>
        </div>
        
        <button 
          onClick={() => setShowWechatModal(true)}
          className="inline-flex items-center gap-2 text-brand-primary text-sm font-bold hover:underline"
        >
           <MessageCircle size={16} />
           微信反馈
        </button>

      </div>
    </div>
  );
};