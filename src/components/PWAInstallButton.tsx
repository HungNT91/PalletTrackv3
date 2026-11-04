import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // If already running standalone on phone home screen, hide button
  if (isInstalled) {
    return null;
  }

  const showQuickToast = (msg: string) => {
    setToastMessage(msg);
    if (navigator.vibrate) navigator.vibrate(40);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const handleDirectInstall = async () => {
    // 1. If native installation prompt is ready, trigger it directly
    if (isInstallable) {
      const outcome = await install();
      if (outcome === 'accepted') {
        showQuickToast('✓ Đã thêm PalletTrack vào màn hình điện thoại!');
      }
      return;
    }

    // 2. If running on iOS (WebKit doesn't allow programmatic beforeinstallprompt)
    if (isIOS) {
      showQuickToast('Nhấn biểu tượng Chia sẻ (Share) ⎋ rồi chọn "Thêm vào MH chính"');
      return;
    }

    // 3. Fallback for browsers / iframes
    showQuickToast('Hãy mở ứng dụng bằng trình duyệt Chrome trên điện thoại để thêm tự động!');
  };

  return (
    <>
      <button
        type="button"
        onClick={handleDirectInstall}
        title="Thêm PalletTrack vào màn hình điện thoại"
        aria-label="Cài đặt PalletTrack"
        className={`flex items-center gap-1 sm:gap-1.5 h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl bg-gradient-to-r from-[#004ac6] to-blue-600 hover:from-[#003ea8] hover:to-blue-700 text-white text-xs font-bold transition-all shadow-sm active:scale-95 flex-shrink-0 ${className}`}
      >
        <span className="material-symbols-outlined text-[16px] sm:text-[18px]">add_to_home_screen</span>
        <span>Cài đặt</span>
      </button>

      {/* Lightweight non-intrusive notification without any modal */}
      {toastMessage && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-50 px-3.5 py-2 rounded-2xl bg-slate-900/95 text-white text-xs font-semibold shadow-xl border border-slate-700/80 backdrop-blur-md animate-fadeIn flex items-center gap-2 max-w-[90vw] text-center">
          <span className="material-symbols-outlined text-[16px] text-emerald-400 flex-shrink-0">
            install_mobile
          </span>
          <span className="truncate">{toastMessage}</span>
        </div>
      )}
    </>
  );
};
