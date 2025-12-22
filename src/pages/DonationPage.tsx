import { ArrowLeft, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DonationPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/settings')}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft size={20} className="text-slate-600 dark:text-slate-300" />
            </button>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">打赏支持</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
            <Heart size={32} className="text-red-500 dark:text-red-400" />
          </div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-4">感谢您的支持！</h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            您的每一份支持都是对开发者的鼓励，让这个项目能够持续发展，为更多用户提供优质的拼音学习体验。
          </p>
        </div>

        {/* Donation Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* WeChat Pay */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 p-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
                <span className="text-green-500 dark:text-green-400 font-bold text-lg">微</span>
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">微信支付</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">使用微信扫码支付</p>
              
              <div className="flex justify-center mb-6">
                <div className="relative group">
                  <img 
                    src="https://img.sdgarden.top/blog/wechat/wechatpay.jpg" 
                    alt="微信收款码" 
                    className="w-64 h-64 object-contain rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-sm group-hover:shadow-md transition-shadow"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNTBMMTUwIDEwMEgxMDBWMTUwSDUwVjEwMEgxMDBWNTBaIiBmaWxsPSIjOUI5QjlCIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTcwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOUI5QjlCIiBmb250LXNpemU9IjEyIj7lvq7liqg8L3RleHQ+Cjwvc3ZnPgo=';
                    }}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-xl transition-all"></div>
                </div>
              </div>
              
              <div className="text-xs text-slate-400 dark:text-slate-500">
                <p>请使用微信扫一扫功能</p>
                <p>扫码完成支付</p>
              </div>
            </div>
          </div>

          {/* Alipay */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 p-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
                <span className="text-blue-500 dark:text-blue-400 font-bold text-lg">支</span>
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">支付宝</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">使用支付宝扫码支付</p>
              
              <div className="flex justify-center mb-6">
                <div className="relative group">
                  <img 
                    src="https://img.sdgarden.top/blog/wechat/alipay.jpg" 
                    alt="支付宝收款码" 
                    className="w-64 h-64 object-contain rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-sm group-hover:shadow-md transition-shadow"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iNDAiIGZpbGw9IiM5QjlCOUIiLz4KPHRleHQgeD0iMTAwIiB5PSIxNzAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5QjlCOUIiIGZvbnQtc2l6ZT0iMTIiPuWkqeepuDwvdGV4dD4KPC9zdmc+Cg==';
                    }}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-xl transition-all"></div>
                </div>
              </div>
              
              <div className="text-xs text-slate-400 dark:text-slate-500">
                <p>请使用支付宝扫一扫功能</p>
                <p>扫码完成支付</p>
              </div>
            </div>
          </div>
        </div>

        {/* Thank You Message */}
        <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-2xl p-8 text-center border border-red-100 dark:border-red-800">
          <Heart size={24} className="text-red-500 dark:text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">衷心感谢您的支持</h3>
          <p className="text-slate-600 dark:text-slate-300">
            无论金额大小，您的打赏都是对开发者最大的认可和鼓励。我们会继续努力，为您提供更好的学习体验。
          </p>
        </div>
      </div>
    </div>
  );
};