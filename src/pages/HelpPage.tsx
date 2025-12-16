import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const HelpPage = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-0">
      <button 
        onClick={() => navigate('/settings')} 
        className="flex items-center text-slate-500 hover:text-brand-primary mb-6 transition-colors"
      >
        <ArrowLeft size={20} className="mr-1" /> 返回设置
      </button>
      
      <h1 className="text-3xl font-bold text-brand-dark mb-8">帮助与说明</h1>
      
      <div className="space-y-6">
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold text-brand-secondary mb-3">项目简介</h2>
          <p className="text-slate-600 leading-relaxed">
            "智能拼音大闯关" 是一款专为小学生设计的互动式拼音学习应用。
            我们结合了游戏化教学理念，通过趣味闯关的方式，帮助孩子轻松掌握汉语拼音的声母、韵母及整体认读音节。
          </p>
        </section>

        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold text-brand-secondary mb-3">设计理念</h2>
          <ul className="list-disc list-inside text-slate-600 space-y-2">
            <li><strong>寓教于乐</strong>：将枯燥的拼音练习转化为生动的闯关游戏。</li>
            <li><strong>科学记忆</strong>：基于艾宾浩斯遗忘曲线，智能安排复习计划。</li>
            <li><strong>即时反馈</strong>：通过音效、动画和连击系统，提供正向激励。</li>
            <li><strong>全平台适配</strong>：无论手机、平板还是电脑，都能获得最佳体验。</li>
          </ul>
        </section>

        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold text-brand-secondary mb-3">功能特点</h2>
           <ul className="list-disc list-inside text-slate-600 space-y-2">
            <li><strong>智能题库</strong>：涵盖人教版小学全阶段识字表。</li>
            <li><strong>错题本</strong>：自动记录错误，针对性强化训练。</li>
            <li><strong>多模式练习</strong>：支持单字、词语、句子多种挑战模式。</li>
            <li><strong>AI 助教</strong>：智能生成复习关卡，查漏补缺。</li>
          </ul>
        </section>

        <section className="text-center text-slate-400 text-sm pt-4">
          <p>当前版本: v1.5.0</p>
          <p>© 2025 智能拼音大闯关 Team</p>
        </section>
      </div>
    </div>
  );
};