import { useSettings, Theme } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Check, ChevronRight, HelpCircle, MessageCircle, Moon, Sun, Monitor, LogOut, Database, Download, Upload, Brain, Wifi, Loader2, Server } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useRef } from 'react';
import { exportData, importData } from '../db/localDB';
import { AI_PROVIDERS, testConnection } from '../lib/ai';

export const SettingsPage = () => {
  const { mode, setMode, theme, setTheme, aiConfig, setAiConfig } = useSettings();
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean, message: string} | null>(null);

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const providerId = e.target.value;
    const provider = AI_PROVIDERS.find(p => p.id === providerId);
    if (provider) {
      setAiConfig({
        ...aiConfig,
        provider: providerId,
        host: provider.host,
        model: provider.model
      });
    } else {
      setAiConfig({ ...aiConfig, provider: providerId });
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testConnection(aiConfig);
      setTestResult(result);
    } catch (e) {
      setTestResult({ success: false, message: '测试出错' });
    } finally {
      setTesting(false);
    }
  };

  const handleExport = async () => {
    if (!user) return;
    try {
      const json = await exportData(user.id);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pinyin-game-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export failed', e);
      alert('导出失败');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = event.target?.result as string;
        const success = await importData(json, user.id);
        if (success) {
          alert('导入成功，即将刷新页面');
          window.location.reload();
        } else {
          alert('导入失败，请检查文件格式');
        }
      } catch (e) {
        console.error('Import error', e);
        alert('导入出错');
      }
    };
    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

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
    <div className="max-w-5xl mx-auto py-8 px-4">
      
      <h1 className="text-3xl font-bold text-brand-dark dark:text-brand-primary mb-8 transition-colors">设置</h1>
      
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

      {/* AI Config */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden mb-6 transition-colors">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="text-brand-primary" size={24} />
            <h2 className="text-xl font-bold text-slate-800 dark:text-white transition-colors">AI 模型配置</h2>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm transition-colors">配置 AI 以启用智能复习功能。支持多种服务商。</p>
        </div>
        
        <div className="p-6 space-y-4">
           {/* Provider Select */}
           <div>
             <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
               <Server size={14} />
               服务商
             </label>
             <select
               value={aiConfig.provider || 'custom'}
               onChange={handleProviderChange}
               className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all appearance-none"
             >
               {AI_PROVIDERS.map(p => (
                 <option key={p.id} value={p.id}>{p.name}</option>
               ))}
             </select>
           </div>

           {/* Host */}
           <div>
             <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">API Host</label>
             <input 
               type="text" 
               value={aiConfig.host}
               onChange={(e) => setAiConfig({...aiConfig, host: e.target.value})}
               placeholder="https://api.openai.com/v1"
               className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all"
             />
           </div>
           
           {/* Key */}
           <div>
             <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">API Key</label>
             <input 
               type="password" 
               value={aiConfig.apiKey}
               onChange={(e) => setAiConfig({...aiConfig, apiKey: e.target.value})}
               placeholder="sk-..."
               className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all"
             />
           </div>

           {/* Model */}
           <div>
             <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Model Name</label>
             <input 
               type="text" 
               value={aiConfig.model}
               onChange={(e) => setAiConfig({...aiConfig, model: e.target.value})}
               placeholder="gpt-3.5-turbo"
               className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all"
             />
           </div>

           {/* Test Connection */}
           <div className="pt-2">
             <button
               onClick={handleTestConnection}
               disabled={testing || !aiConfig.apiKey}
               className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all
                 ${testing ? 'bg-slate-100 dark:bg-slate-800 text-slate-400' : 'bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20'}
               `}
             >
               {testing ? <Loader2 size={18} className="animate-spin" /> : <Wifi size={18} />}
               {testing ? '测试中...' : '测试连接'}
             </button>
             
             {testResult && (
                <div className={`mt-3 p-3 rounded-lg text-sm flex items-start gap-2 ${testResult.success ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}>
                   {testResult.success ? <Check size={16} className="mt-0.5" /> : <Wifi size={16} className="mt-0.5" />}
                   <span>{testResult.message}</span>
                </div>
             )}
           </div>
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

      {/* Data Management */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden mb-6 transition-colors">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2 transition-colors">数据管理</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm transition-colors">备份或恢复您的学习进度。</p>
        </div>
        
        <div className="grid grid-cols-2 divide-x divide-slate-100 dark:divide-slate-800">
           <button
             onClick={handleExport}
             className="flex flex-col items-center justify-center py-6 gap-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
           >
             <Download size={24} className="text-blue-500" />
             <span className="text-sm font-bold">导出备份</span>
           </button>
           
           <button
             onClick={() => fileInputRef.current?.click()}
             className="flex flex-col items-center justify-center py-6 gap-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
           >
             <Upload size={24} className="text-green-500" />
             <span className="text-sm font-bold">导入备份</span>
             <input 
               type="file" 
               ref={fileInputRef} 
               onChange={handleImport} 
               accept=".json" 
               className="hidden" 
             />
           </button>
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
           onClick={() => window.open('https://img.sdgarden.top/blog/wechat/zuoyejianeice.jpg', '_blank')}
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


    </div>
  );
};
