import React, { useState } from 'react';
import { ShiftSession } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  shift: ShiftSession | null;
  onOpenShiftModal: () => void;
  onOpenNotifications: () => void;
  onOpenSync: () => void;
  onLogout?: () => void;
  unreadCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  shift,
  onOpenShiftModal,
  onOpenNotifications,
  onOpenSync,
  onLogout,
  unreadCount,
}) => {
  const [flashlightOn, setFlashlightOn] = useState(false);

  const toggleFlashlight = () => {
    setFlashlightOn(prev => !prev);
    // Visual feedback
    if (navigator.vibrate) navigator.vibrate(30);
  };

  return (
    <>
      {/* Screen Flash simulation when flashlight active */}
      {flashlightOn && (
        <div
          className="fixed inset-0 z-50 bg-white/30 backdrop-blur-[0.5px] pointer-events-none transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      <header className="fixed top-0 left-0 right-0 w-full z-40 pt-safe bg-white/95 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_2px_12px_rgba(11,28,48,0.04)]">
        <div className="h-14 sm:h-16 px-3 sm:px-4 flex items-center justify-between gap-1.5 sm:gap-2 max-w-7xl mx-auto">
          {/* Logo & Warehouse Station */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-[#004ac6] to-[#2563eb] flex items-center justify-center text-white flex-shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[18px] sm:text-[20px]">pallet</span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="font-code-md text-xs sm:text-sm text-[#004ac6] font-bold tracking-tight truncate">
                  PalletTrack
                </span>
                <span className="px-1 py-0.2 sm:px-1.5 sm:py-0.5 rounded bg-blue-50 border border-blue-200/80 text-[#004ac6] font-code-md text-[9px] sm:text-[10px] uppercase font-bold tracking-wider">
                  WH-01
                </span>
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse flex-shrink-0"></span>
                <span className="text-[10px] sm:text-[11px] text-emerald-700 truncate font-semibold uppercase tracking-wider">
                  Online • {shift?.pingMs || 12}ms
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* PWA Install Button */}
            <PWAInstallButton />

            {/* Quick Sync Button */}
            <button
              type="button"
              onClick={onOpenSync}
              title="Đồng bộ dữ liệu sàn kho"
              className="hidden md:flex items-center gap-1.5 h-8 sm:h-9 px-2 sm:px-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 active:scale-95 text-[#004ac6] border border-slate-200/80 text-xs font-semibold transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px] sm:text-[17px] text-[#004ac6]">sync</span>
              <span>Đồng bộ</span>
            </button>

            {/* Flashlight toggle */}
            <button
              type="button"
              aria-label="Bật tắt đèn pin"
              onClick={toggleFlashlight}
              className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl transition-all border shadow-sm ${
                flashlightOn
                  ? 'bg-amber-400 text-slate-900 border-amber-500 shadow-md ring-2 ring-amber-300'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200/70'
              }`}
            >
              <span className="material-symbols-outlined text-[18px] sm:text-[20px]">
                {flashlightOn ? 'flashlight_off' : 'flashlight_on'}
              </span>
            </button>

            {/* Notification Center button */}
            <button
              type="button"
              aria-label="Thông báo và nhật ký"
              onClick={onOpenNotifications}
              className="relative w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 active:bg-blue-50 text-slate-600 border border-slate-200/70 transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px] sm:text-[20px]">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#004ac6] ring-2 ring-white"></span>
              )}
            </button>

            {/* Operator Shift Profile */}
            <button
              type="button"
              onClick={onOpenShiftModal}
              title="Thông tin ca và nhân viên"
              className="flex items-center gap-1 sm:gap-1.5 p-1 sm:pl-1.5 sm:pr-2.5 h-8 sm:h-9 rounded-xl bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200/80 text-[#004ac6] transition-all shadow-sm active:scale-95"
            >
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gradient-to-tr from-[#004ac6] to-blue-500 flex items-center justify-center text-white text-xs font-bold shadow-xs flex-shrink-0">
                <span className="material-symbols-outlined text-[15px] sm:text-[17px]">person</span>
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-800 leading-tight">
                  {shift?.operatorName || 'Trần Minh'}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {shift?.operatorCode || 'OP-2048'}
                </span>
              </div>
            </button>

            {/* Quick Logout Button */}
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                title="Đăng xuất ca làm việc"
                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200/70 transition-all shadow-sm active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px] sm:text-[20px]">logout</span>
              </button>
            )}
          </div>
        </div>
      </header>
    </>
  );
};
