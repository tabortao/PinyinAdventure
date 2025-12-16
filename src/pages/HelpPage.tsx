import { ArrowLeft, BookOpen, BrainCircuit, Gamepad2, Layers, Smartphone, Sparkles, Zap, MessageCircle, Copy, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export const HelpPage = () => {
  const navigate = useNavigate();
  const [showWechatModal, setShowWechatModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText('tabor2024');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24 md:pb-6 relative">
      {/* Wechat Modal */}
      {showWechatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowWechatModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X size={24} />
            </button>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">交流反馈</h3>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                添加作者微信，交流反馈或建议。<br/>
                微信号：<span className="font-bold text-slate-700 select-all">tabor2024</span>
              </p>
              
              <button 
                onClick={handleCopy}
                className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                  copied 
                    ? 'bg-green-500 text-white' 
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {copied ? (
                  <>
                    <Check size={20} />
                    已复制
                  </>
                ) : (
                  <>
                    <Copy size={20} />
                    复制微信号
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <button 
        onClick={() => navigate('/settings')} 
        className="flex items-center text-slate-500 hover:text-brand-primary mb-6 transition-colors font-bold text-sm"
      >
        <ArrowLeft size={18} className="mr-1" /> 返回设置
      </button>
      
      <div className="text-center mb-10">
        <h1 className="text-3xl font-black text-brand-dark mb-2">帮助与说明</h1>
        <div className="w-16 h-1.5 bg-brand-primary rounded-full mx-auto opacity-50"></div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Project Intro */}
        <div className="col-span-1 md:col-span-2 bg-gradient-to-br from-brand-primary/5 to-blue-50 p-6 rounded-3xl border border-brand-primary/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
               <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-brand-primary">
                 <BookOpen size={20} />
               </div>
               <h2 className="text-xl font-bold text-brand-dark">项目简介</h2>
            </div>
            <p className="text-slate-600 leading-relaxed font-medium">
              "智能拼音大闯关" 是一款专为小学生设计的互动式拼音学习应用。
              我们结合了游戏化教学理念，通过趣味闯关的方式，帮助孩子轻松掌握汉语拼音的声母、韵母及整体认读音节。
            </p>
          </div>
        </div>

        {/* Philosophy */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
           <div className="flex items-center gap-3 mb-4">
             <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
               <BrainCircuit size={20} />
             </div>
             <h2 className="text-lg font-bold text-slate-800">设计理念</h2>
           </div>
           <ul className="space-y-3">
             {[
               { icon: <Gamepad2 size={16} />, text: '寓教于乐：游戏化闯关体验' },
               { icon: <Zap size={16} />, text: '科学记忆：艾宾浩斯智能复习' },
               { icon: <Sparkles size={16} />, text: '即时反馈：动画激励系统' },
               { icon: <Smartphone size={16} />, text: '多端同步：手机电脑无缝切换' },
             ].map((item, i) => (
               <li key={i} className="flex items-center gap-3 text-slate-600 text-sm font-bold">
                 <span className="text-slate-400">{item.icon}</span>
                 {item.text}
               </li>
             ))}
           </ul>
        </div>

        {/* Features */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
           <div className="flex items-center gap-3 mb-4">
             <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
               <Layers size={20} />
             </div>
             <h2 className="text-lg font-bold text-slate-800">功能特点</h2>
           </div>
           <ul className="space-y-3">
             <li className="flex items-start gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-brand-secondary mt-1.5"></div>
               <span className="text-slate-600 text-sm"><strong className="text-slate-800">智能题库</strong>：涵盖人教版小学全阶段识字表。</span>
             </li>
             <li className="flex items-start gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-brand-secondary mt-1.5"></div>
               <span className="text-slate-600 text-sm"><strong className="text-slate-800">错题本</strong>：自动记录错误，针对性强化训练。</span>
             </li>
             <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-secondary mt-1.5"></div>
                <span className="text-slate-600 text-sm"><strong className="text-slate-800">多模式</strong>：支持单字、词语、句子挑战。</span>
             </li>
             <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-secondary mt-1.5"></div>
                <span className="text-slate-600 text-sm"><strong className="text-slate-800">AI 助教</strong>：智能生成复习关卡，查漏补缺。</span>
             </li>
           </ul>
        </div>
      </div>

      <div className="mt-10 text-center space-y-4">
        <div className="flex flex-col items-center gap-2">
            <span className="text-slate-400 text-xs font-bold">作者：Tabor</span>
            <div className="inline-block px-4 py-1 rounded-full bg-slate-100 text-slate-400 text-xs font-bold font-mono">
              v1.6.0
            </div>
        </div>
        
        <button 
          onClick={() => setShowWechatModal(true)}
          className="inline-flex items-center gap-2 text-brand-primary text-sm font-bold hover:underline"
        >
           <MessageCircle size={16} />
           微信反馈
        </button>

        <p className="text-slate-300 text-xs">© 2025 智能拼音大闯关 Team</p>
      </div>
    </div>
  );
};