import React from 'react';

export type TabType = 'scan' | 'queue' | 'reconcile' | 'import';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  pendingCount: number;
  isManager?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  pendingCount,
  isManager = false,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full z-40 pb-safe bg-white/95 backdrop-blur-xl border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(11,28,48,0.05)]">
      <div
        className={`h-14 sm:h-16 px-1.5 sm:px-2 grid items-center justify-around max-w-lg mx-auto ${
          isManager ? 'grid-cols-4' : 'grid-cols-3'
        }`}
      >
        {/* Tab 1: Quét mã */}
        <button
          type="button"
          onClick={() => onChangeTab('scan')}
          className={`flex flex-col items-center justify-center h-12 sm:h-14 rounded-xl transition-all cursor-pointer ${
            activeTab === 'scan'
              ? 'text-[#004ac6] font-bold bg-blue-50/70 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span className="material-symbols-outlined text-[20px] sm:text-[24px]">qr_code_scanner</span>
          <span className="text-[10px] sm:text-[11px] mt-0.5 tracking-tight truncate max-w-full px-0.5 text-center font-medium">
            Quét mã
          </span>
        </button>

        {/* Tab 2: Hàng chờ */}
        <button
          type="button"
          onClick={() => onChangeTab('queue')}
          className={`relative flex flex-col items-center justify-center h-12 sm:h-14 rounded-xl transition-all cursor-pointer ${
            activeTab === 'queue'
              ? 'text-[#004ac6] font-bold bg-blue-50/70 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="relative flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px] sm:text-[24px]">assignment</span>
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-2 min-w-[16px] h-3.5 sm:h-4 px-1 rounded-full bg-[#004ac6] text-white text-[9px] sm:text-[10px] flex items-center justify-center font-bold ring-2 ring-white shadow-xs">
                {pendingCount}
              </span>
            )}
          </div>
          <span className="text-[10px] sm:text-[11px] mt-0.5 tracking-tight truncate max-w-full px-0.5 text-center font-medium">
            Hàng chờ
          </span>
        </button>

        {/* Tab 3: Đối soát */}
        <button
          type="button"
          onClick={() => onChangeTab('reconcile')}
          className={`flex flex-col items-center justify-center h-12 sm:h-14 rounded-xl transition-all cursor-pointer ${
            activeTab === 'reconcile'
              ? 'text-[#004ac6] font-bold bg-blue-50/70 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span className="material-symbols-outlined text-[20px] sm:text-[24px]">verified</span>
          <span className="text-[10px] sm:text-[11px] mt-0.5 tracking-tight truncate max-w-full px-0.5 text-center font-medium">
            Đối soát
          </span>
        </button>

        {/* Tab 4: Nhập file (Chỉ hiển thị cho Quản lý kho) */}
        {isManager && (
          <button
            type="button"
            onClick={() => onChangeTab('import')}
            className={`flex flex-col items-center justify-center h-12 sm:h-14 rounded-xl transition-all cursor-pointer ${
              activeTab === 'import'
                ? 'text-[#004ac6] font-bold bg-blue-50/70 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="material-symbols-outlined text-[20px] sm:text-[24px]">upload_file</span>
            <span className="text-[10px] sm:text-[11px] mt-0.5 tracking-tight truncate max-w-full px-0.5 text-center font-medium">
              Nhập file
            </span>
          </button>
        )}
      </div>
    </nav>
  );
};
