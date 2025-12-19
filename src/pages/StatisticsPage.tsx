import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserStats } from '../db/api';
import { exportData, importData } from '../db/localDB';
import { format, subDays, startOfWeek, startOfMonth, isSameDay, parseISO, eachDayOfInterval } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { BarChart2, Download, Upload, Calendar, TrendingUp, Clock, Target, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type DailyStat = {
  date: string;
  correct_count: number;
  total_count: number;
  study_duration: number;
};

export const StatisticsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DailyStat[]>([]);
  const [range, setRange] = useState<'week' | 'month'>('week');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    if (!user) return;
    try {
      const data = await getUserStats(user.id);
      setStats(data);
    } catch (e) {
      console.error('Failed to load stats', e);
    } finally {
      setLoading(false);
    }
  };

  const getChartData = () => {
    const end = new Date();
    const start = range === 'week' ? subDays(end, 6) : subDays(end, 29);
    
    const days = eachDayOfInterval({ start, end });
    
    return days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const stat = stats.find(s => s.date === dateStr) || { correct_count: 0, total_count: 0, study_duration: 0 };
      return {
        date: dateStr,
        label: format(day, 'MM-dd'),
        ...stat
      };
    });
  };

  const chartData = getChartData();
  const maxCount = Math.max(...chartData.map(d => d.total_count), 5); // Minimum 5 for scale

  // Calculate Summary
  const totalQuestions = stats.reduce((acc, curr) => acc + curr.total_count, 0);
  const totalCorrect = stats.reduce((acc, curr) => acc + curr.correct_count, 0);
  const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const totalDuration = stats.reduce((acc, curr) => acc + (curr.study_duration || 0), 0); // seconds

  const handleExport = async () => {
    if (!user) return;
    try {
      const json = await exportData(user.id);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pinyin-stats-${format(new Date(), 'yyyyMMdd')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
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
        await importData(json, user.id);
        alert('导入成功');
        loadStats();
      } catch (e) {
        alert('导入失败');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 pb-24 transition-colors">
      <div className="max-w-4xl mx-auto pt-6">
        <div className="flex items-center gap-4 mb-8">
           <button onClick={() => navigate(-1)} className="p-2 bg-white dark:bg-slate-900 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
             <ArrowLeft size={24} className="text-slate-600 dark:text-slate-400" />
           </button>
           <h1 className="text-2xl font-bold text-slate-800 dark:text-white">学习统计</h1>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-slate-500 dark:text-slate-400 text-sm font-bold">
               <Target size={16} className="text-blue-500" />
               总做题数
            </div>
            <div className="text-2xl font-black text-slate-800 dark:text-white">
              {totalQuestions}
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
             <div className="flex items-center gap-2 mb-2 text-slate-500 dark:text-slate-400 text-sm font-bold">
               <TrendingUp size={16} className="text-green-500" />
               正确率
            </div>
            <div className="text-2xl font-black text-slate-800 dark:text-white">
              {accuracy}%
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
             <div className="flex items-center gap-2 mb-2 text-slate-500 dark:text-slate-400 text-sm font-bold">
               <Clock size={16} className="text-orange-500" />
               总时长
            </div>
            <div className="text-2xl font-black text-slate-800 dark:text-white">
              {Math.round(totalDuration / 60)}<span className="text-sm font-normal text-slate-400 ml-1">分</span>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-6">
             <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
               <BarChart2 className="text-brand-primary" />
               做题趋势
             </h2>
             <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                <button 
                  onClick={() => setRange('week')}
                  className={`px-3 py-1 text-sm font-bold rounded-md transition-all ${range === 'week' ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-primary' : 'text-slate-500 dark:text-slate-400'}`}
                >
                  本周
                </button>
                <button 
                  onClick={() => setRange('month')}
                  className={`px-3 py-1 text-sm font-bold rounded-md transition-all ${range === 'month' ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-primary' : 'text-slate-500 dark:text-slate-400'}`}
                >
                  本月
                </button>
             </div>
          </div>

          {/* Bar Chart */}
          <div className="h-64 w-full flex items-end justify-between gap-2 md:gap-4">
             {chartData.map((d) => (
               <div key={d.date} className="flex-1 flex flex-col items-center gap-2 group relative">
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 bg-slate-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    {d.date}: {d.correct_count}/{d.total_count}
                  </div>
                  
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-lg relative overflow-hidden group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors" style={{ height: '100%' }}>
                     <div 
                       className="absolute bottom-0 w-full bg-brand-primary/30 transition-all duration-500"
                       style={{ height: `${(d.total_count / maxCount) * 100}%` }}
                     />
                     <div 
                       className="absolute bottom-0 w-full bg-brand-primary transition-all duration-500"
                       style={{ height: `${(d.correct_count / maxCount) * 100}%` }}
                     />
                  </div>
                  <span className="text-[10px] md:text-xs text-slate-400 font-medium rotate-0 truncate w-full text-center">
                    {d.label}
                  </span>
               </div>
             ))}
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-4">
           <button 
             onClick={handleExport}
             className="flex items-center justify-center gap-2 py-4 bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-100 dark:border-slate-800 hover:border-blue-500 hover:text-blue-500 transition-all font-bold text-slate-600 dark:text-slate-400"
           >
             <Download size={20} />
             导出数据
           </button>
           
           <button 
             onClick={() => fileInputRef.current?.click()}
             className="flex items-center justify-center gap-2 py-4 bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-100 dark:border-slate-800 hover:border-green-500 hover:text-green-500 transition-all font-bold text-slate-600 dark:text-slate-400"
           >
             <Upload size={20} />
             导入数据
           </button>
           <input 
             type="file" 
             ref={fileInputRef} 
             onChange={handleImport} 
             accept=".json" 
             className="hidden" 
           />
        </div>
      </div>
    </div>
  );
};
