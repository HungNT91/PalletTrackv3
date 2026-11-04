import React from 'react';

export interface ToastData {
  message: string;
  type?: 'success' | 'error' | 'info';
  icon?: string;
}

interface ToastProps {
  toast: ToastData | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast }) => {
  if (!toast) return null;

  const isError = toast.type === 'error';
  const icon = toast.icon || (isError ? 'error' : 'verified');

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 animate-slideDown max-w-sm w-[90%] pointer-events-none">
      <div
        className={`px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border ${
          isError
            ? 'bg-rose-600 text-white border-rose-700'
            : 'bg-white text-slate-900 border-slate-200/90 shadow-[0_8px_30px_rgba(0,0,0,0.12)]'
        }`}
      >
        <span
          className={`material-symbols-outlined text-[24px] ${
            isError ? 'text-white' : 'text-emerald-600'
          }`}
        >
          {icon}
        </span>
        <div className="text-xs font-bold leading-tight">{toast.message}</div>
      </div>
    </div>
  );
};
