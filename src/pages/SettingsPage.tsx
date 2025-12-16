import { useSettings } from '../context/SettingsContext';
import { ArrowLeft, Check, ChevronRight, HelpCircle, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { WechatModal } from '../components/common/WechatModal';

export const SettingsPage = () => {
  const { mode, setMode } = useSettings();
  const navigate = useNavigate();
  const [showWechatModal, setShowWechatModal] = useState(false);

  const modes = [
    { id: 'all', label: '混合模式 (默认)', desc: '包含所有类型的题目' },
    { id: 'character', label: '汉字模式', desc: '只练习单个汉字的拼音' },
    { id: 'word', label: '词语模式', desc: '练习双字或多字词语' },
    { id: 'sentence', label: '句子模式', desc: '挑战长句拼读' },
  ];

  return (
    <div className="max-w-2xl mx-auto py-8">
      <WechatModal isOpen={showWechatModal} onClose={() => setShowWechatModal(false)} />
      
      <h1 className="text-3xl font-bold text-brand-dark mb-8">游戏设置</h1>
      
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 mb-2">练习模式</h2>
          <p className="text-slate-500 text-sm">选择在闯关中出现的题目类型。注意：如果没有对应类型的题目，关卡可能会显示为空。</p>
        </div>
        
        <div className="divide-y divide-slate-100">
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id as any)}
              className={`w-full text-left p-6 flex items-center justify-between transition-colors hover:bg-slate-50
                ${mode === m.id ? 'bg-brand-primary/5' : ''}
              `}
            >
              <div>
                <div className={`font-bold text-lg mb-1 ${mode === m.id ? 'text-brand-primary' : 'text-slate-700'}`}>
                  {m.label}
                </div>
                <div className="text-slate-500 text-sm">{m.desc}</div>
              </div>
              
              {mode === m.id && (
                <div className="bg-brand-primary text-white p-1 rounded-full">
                  <Check size={20} />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden divide-y divide-slate-100">
         <button
           onClick={() => navigate('/help')}
           className="w-full text-left p-6 flex items-center justify-between transition-colors hover:bg-slate-50 group"
         >
           <div className="flex items-center gap-4">
             <div className="bg-blue-100 text-blue-500 p-2 rounded-lg">
                <HelpCircle size={24} />
             </div>
             <div>
               <div className="font-bold text-lg text-slate-700 mb-1 group-hover:text-brand-primary transition-colors">帮助与说明</div>
               <div className="text-slate-500 text-sm">了解项目简介、设计理念与版本信息</div>
             </div>
           </div>
           <div className="text-slate-300 group-hover:text-brand-primary transition-colors">
              <ChevronRight size={24} />
           </div>
         </button>

         <button
           onClick={() => setShowWechatModal(true)}
           className="w-full text-left p-6 flex items-center justify-between transition-colors hover:bg-slate-50 group"
         >
           <div className="flex items-center gap-4">
             <div className="bg-green-100 text-green-500 p-2 rounded-lg">
                <MessageCircle size={24} />
             </div>
             <div>
               <div className="font-bold text-lg text-slate-700 mb-1 group-hover:text-brand-primary transition-colors">微信反馈</div>
               <div className="text-slate-500 text-sm">联系作者，提出宝贵建议</div>
             </div>
           </div>
           <div className="text-slate-300 group-hover:text-brand-primary transition-colors">
              <ChevronRight size={24} />
           </div>
         </button>
      </div>
    </div>
  );
};
