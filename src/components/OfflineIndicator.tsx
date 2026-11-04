import React, { useState, useEffect } from 'react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-slate-900/90 text-white backdrop-blur-md px-3.5 py-1.5 text-xs font-semibold shadow-lg border border-slate-700/60 animate-fadeIn">
      <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
      <span>Đang chạy ngoại tuyến (Offline) — Dữ liệu đã lưu tạm</span>
    </div>
  );
};
