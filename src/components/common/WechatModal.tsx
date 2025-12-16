import { X, MessageCircle, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface WechatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WechatModal = ({ isOpen, onClose }: WechatModalProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText('tabor2024');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative animate-in zoom-in-95 duration-200 transition-colors">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          <X size={24} />
        </button>
        
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors">
            <MessageCircle size={32} />
          </div>
          <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2 transition-colors">交流反馈</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed transition-colors">
            添加作者微信，交流反馈或建议。<br/>
            微信号：<span className="font-bold text-slate-700 dark:text-slate-200 select-all transition-colors">tabor2024</span>
          </p>
          
          <button 
            onClick={handleCopy}
            className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
              copied 
                ? 'bg-green-500 text-white' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
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
  );
};
