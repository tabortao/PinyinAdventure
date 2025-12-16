import { useSettings, Theme } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Check, ChevronRight, HelpCircle, MessageCircle, Moon, Sun, Monitor, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { WechatModal } from '../components/common/WechatModal';

export const SettingsPage = () => {
  const { mode, setMode, theme, setTheme } = useSettings();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showWechatModal, setShowWechatModal] = useState(false);

  const modes = [
    { id: 'all', label: '混合模式 (默认)', desc: '包含所有类型的题目' },
    { id: 'character', label: '汉字模式', desc: '只练习单个汉字的拼音' },
    { id: 'word', label: '词语模式', desc: '练习双字或多字词语' },
    { id: 'sentence', label: '句子模式', desc: '挑战长句拼读' },
  ];

  const themes: { id: Theme; label: string; icon: React.ReactNode }[] = [
    { id: 'system', label: '跟随系统', icon: <Monitor size={20} /> },
    { id: 'light', label: '浅色模式', icon: <Sun size={20} /> },
    { id: 'dark', label: '深色模式', icon: <Moon size={20} /> },
  ];

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <WechatModal isOpen={showWechatModal} onClose={() => setShowWechatModal(false)} />
      
      <h1 className="text-3xl font-bold text-brand-dark dark:text-brand-primary mb-8 transition-colors">游戏设置</h1>
      
      {/* Theme Settings */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden mb-6 transition-colors">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2 transition-colors">主题外观</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm transition-colors">自定义应用的主题颜色模式。</p>
        </div>
        
        <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`flex flex-col items-center justify-center py-6 gap-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800
                ${theme === t.id ? 'text-brand-primary bg-brand-primary/5 dark:bg-brand-primary/10' : 'text-slate-500 dark:text-slate-400'}
              `}
            >
              {t.icon}
              <span className="text-sm font-bold">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Game Mode Settings */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden mb-6 transition-colors">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2 transition-colors">练习模式</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm transition-colors">选择在闯关中出现的题目类型。注意：如果没有对应类型的题目，关卡可能会显示为空。</p>
        </div>
        
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id as any)}
              className={`w-full text-left p-6 flex items-center justify-between transition-colors hover:bg-slate-50 dark:hover:bg-slate-800
                ${mode === m.id ? 'bg-brand-primary/5 dark:bg-brand-primary/10' : ''}
              `}
            >
              <div>
                <div className={`font-bold text-lg mb-1 transition-colors ${mode === m.id ? 'text-brand-primary' : 'text-slate-700 dark:text-slate-200'}`}>
                  {m.label}
                </div>
                <div className="text-slate-500 dark:text-slate-400 text-sm transition-colors">{m.desc}</div>
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

      {/* Other Actions */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 transition-colors mb-8">
         <button
           onClick={() => navigate('/help')}
           className="w-full text-left p-6 flex items-center justify-between transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 group"
         >
           <div className="flex items-center gap-4">
             <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400 p-2 rounded-lg transition-colors">
                <HelpCircle size={24} />
             </div>
             <div>
               <div className="font-bold text-lg text-slate-700 dark:text-slate-200 mb-1 group-hover:text-brand-primary transition-colors">帮助与说明</div>
               <div className="text-slate-500 dark:text-slate-400 text-sm transition-colors">了解项目简介、设计理念与版本信息</div>
             </div>
           </div>
           <div className="text-slate-300 dark:text-slate-600 group-hover:text-brand-primary transition-colors">
              <ChevronRight size={24} />
           </div>
         </button>

         <button
           onClick={() => setShowWechatModal(true)}
           className="w-full text-left p-6 flex items-center justify-between transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 group"
         >
           <div className="flex items-center gap-4">
             <div className="bg-green-100 dark:bg-green-900/30 text-green-500 dark:text-green-400 p-2 rounded-lg transition-colors">
                <MessageCircle size={24} />
             </div>
             <div>
               <div className="font-bold text-lg text-slate-700 dark:text-slate-200 mb-1 group-hover:text-brand-primary transition-colors">微信反馈</div>
               <div className="text-slate-500 dark:text-slate-400 text-sm transition-colors">联系作者，提出宝贵建议</div>
             </div>
           </div>
           <div className="text-slate-300 dark:text-slate-600 group-hover:text-brand-primary transition-colors">
              <ChevronRight size={24} />
           </div>
         </button>
      </div>

      {/* Logout Button */}
      {user && (
        <button
          onClick={signOut}
          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-red-500 p-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shadow-sm"
        >
          <LogOut size={20} />
          退出登录
        </button>
      )}
    </div>
  );
};
