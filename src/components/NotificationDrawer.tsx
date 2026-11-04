import React from 'react';
import { AuditLog } from '../types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  logs: AuditLog[];
  onResetData: () => Promise<void>;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  logs,
  onResetData,
}) => {
  if (!isOpen) return null;

  const handleReset = async () => {
    if (window.confirm('Khôi phục toàn bộ dữ liệu mẫu ban đầu của kho WH-01?')) {
      await onResetData();
      onClose();
    }
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'success':
        return 'check_circle';
      case 'warning':
        return 'warning';
      default:
        return 'info';
    }
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'warning':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      default:
        return 'text-[#004ac6] bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-end animate-fadeIn">
      <div className="w-full max-w-[88vw] sm:max-w-sm bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#004ac6] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">notifications</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Nhật ký vận hành & Thông báo</h3>
              <span className="text-[11px] text-slate-500 font-code-md">
                Cập nhật tập trung thời gian thực
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Logs list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {logs.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              Chưa có nhật ký ghi nhận
            </div>
          ) : (
            logs.map(log => (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-1 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border flex items-center gap-1 ${getLogColor(
                      log.type
                    )}`}
                  >
                    <span className="material-symbols-outlined text-[12px]">
                      {getLogIcon(log.type)}
                    </span>
                    {log.action}
                  </span>
                  <span className="text-[10px] text-slate-400 font-code-md">{log.timestamp}</span>
                </div>
                <p className="text-slate-700 font-medium leading-relaxed pt-0.5">{log.details}</p>
                <div className="text-[10px] text-slate-400 flex items-center gap-1 pt-1 border-t border-slate-200/60 mt-1">
                  <span className="material-symbols-outlined text-[13px]">person</span>
                  <span>{log.operator}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="w-full h-10 px-3 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px]">restart_alt</span>
            <span>Khôi phục dữ liệu mẫu ban đầu</span>
          </button>
          <div className="text-center text-[11px] text-slate-400">
            PalletTrack WMS v2.4.12 • Node VN-SGN-02
          </div>
        </div>
      </div>
    </div>
  );
};
