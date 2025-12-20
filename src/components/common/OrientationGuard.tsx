import { useEffect, useState } from 'react';
import { Smartphone } from 'lucide-react';

export const OrientationGuard = () => {
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      // Check if device is in "Tablet" width range (min 768px) but not Desktop (max 1024px usually, but let's go up to 1366 for iPad Pro)
      // And if height > width (Portrait)
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // iPad Standard: 768x1024 (Portrait)
      // iPad Pro 12.9: 1024x1366 (Portrait) -> 1024 is > 768, so it falls into Desktop grid usually, but it is Portrait.
      // We want to force landscape on Tablets.
      
      const isTabletRange = width >= 700 && width <= 1366;
      const isPortrait = height > width;

      // Note: Mobile phones (width < 700) are usually fine in portrait. 
      // User specifically asked "iPad need to show as computer page mode, and not allow portrait".
      
      if (isTabletRange && isPortrait) {
        setShowWarning(true);
      } else {
        setShowWarning(false);
      }
    };

    // Initial check
    checkOrientation();

    // Listen
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900 flex flex-col items-center justify-center text-white p-8 text-center animate-in fade-in duration-300">
      <div className="mb-8 animate-pulse">
        <Smartphone size={64} className="rotate-90" />
      </div>
      <h2 className="text-3xl font-bold mb-4">请旋转设备</h2>
      <p className="text-xl text-slate-300 max-w-md">
        为了获得最佳体验，请将您的 iPad 横屏使用。
      </p>
    </div>
  );
};
