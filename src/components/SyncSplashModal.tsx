import React, { useState, useEffect } from 'react';

interface SyncSplashModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingCount: number;
}

export const SyncSplashModal: React.FC<SyncSplashModalProps> = ({
  isOpen,
  onClose,
  pendingCount,
}) => {
  const [progress, setProgress] = useState(78);
  const [step3Done, setStep3Done] = useState(false);
  const [step4Done, setStep4Done] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setProgress(78);
    setStep3Done(false);
    setStep4Done(false);

    const timer1 = setTimeout(() => {
      setProgress(90);
      setStep3Done(true);
    }, 800);

    const timer2 = setTimeout(() => {
      setProgress(100);
      setStep4Done(true);
    }, 1500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const totalCircumference = 125.6;
  const strokeOffset = totalCircumference - (totalCircumference * progress) / 100;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-3 animate-fadeIn">
      <div className="relative w-full max-w-[calc(100vw-20px)] xs:max-w-sm bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl border border-slate-100 flex flex-col select-none max-h-[92vh] overflow-y-auto">
        {/* Close Button top-right */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all z-10"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>

        {/* Top Header */}
        <div className="flex items-center justify-between w-full mb-3">
          <div className="flex items-center space-x-1.5 bg-blue-50 px-3 py-1 rounded-full border border-blue-200/80">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-[11px] font-bold text-[#004ac6] tracking-wider uppercase font-code-md">
              Cổng Dữ Liệu Vận Hành
            </span>
          </div>
          <div className="flex items-center space-x-1 text-slate-500 font-code-md text-xs pr-6">
            <span className="material-symbols-outlined text-sm text-emerald-600">wifi</span>
            <span>12ms</span>
          </div>
        </div>

        {/* Brand Icon */}
        <div className="flex flex-col items-center justify-center text-center my-2">
          <div className="relative flex items-center justify-center w-20 h-20 mb-2">
            <div className="absolute inset-0 rounded-full bg-blue-400/20 blur-xl animate-pulse"></div>
            <div className="relative w-18 h-18 rounded-2xl bg-white shadow-md flex items-center justify-center border border-slate-200">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-[#004ac6]">
                <span className="material-symbols-outlined text-3xl">pallet</span>
              </div>
            </div>
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">PalletTrack WMS</h2>
          <p className="text-xs text-slate-500 max-w-xs mt-0.5">
            Hệ Thống Quản Lý & Điều Phối Pallet Thông Minh
          </p>
        </div>

        {/* Bento Progress Card */}
        <div className="w-full bg-slate-50 rounded-2xl p-4 border border-slate-200 my-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-500">Tiến trình đồng bộ</span>
              <div className="flex items-baseline space-x-1">
                <span className="text-2xl font-bold text-[#004ac6] tracking-tight font-code-md">
                  {progress}%
                </span>
                <span className="text-xs text-slate-500">hoàn tất</span>
              </div>
            </div>

            <div className="relative w-12 h-12 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
                <circle
                  className="text-slate-200"
                  cx="24"
                  cy="24"
                  fill="none"
                  r="20"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <circle
                  className="text-[#004ac6] transition-all duration-500 ease-out"
                  cx="24"
                  cy="24"
                  fill="none"
                  r="20"
                  stroke="currentColor"
                  strokeDasharray="125.6"
                  strokeDashoffset={strokeOffset}
                  strokeLinecap="round"
                  strokeWidth="4"
                ></circle>
              </svg>
              <span className="absolute material-symbols-outlined text-[#004ac6] text-sm animate-spin">
                sync
              </span>
            </div>
          </div>

          {/* Linear Bar */}
          <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden mb-3">
            <div
              className="h-full bg-[#004ac6] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          {/* Status Message */}
          <div className="flex items-center space-x-2 py-1 px-2.5 rounded-lg bg-blue-50/80 mb-3 border border-blue-200/60">
            <span className="material-symbols-outlined text-sm text-[#004ac6] animate-pulse">
              cloud_sync
            </span>
            <span className="font-code-md text-[11px] text-slate-800 font-semibold truncate">
              {progress < 100
                ? 'Đang đồng bộ dữ liệu kho thời gian thực...'
                : 'Đã hoàn tất đồng bộ toàn sàn kho!'}
            </span>
          </div>

          {/* 4 Steps Checklist */}
          <div className="flex flex-col space-y-1.5">
            {/* Step 1 */}
            <div className="flex items-center justify-between p-1.5 rounded-lg bg-white border border-slate-200/60">
              <div className="flex items-center space-x-2 min-w-0">
                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                  <span className="material-symbols-outlined text-[13px] font-bold">check</span>
                </div>
                <span className="text-xs text-slate-800 truncate">
                  Xác thực phiên làm việc & phân quyền ca
                </span>
              </div>
              <span className="text-[10px] text-emerald-700 font-semibold shrink-0 ml-1">Đã xong</span>
            </div>

            {/* Step 2 */}
            <div className="flex items-center justify-between p-1.5 rounded-lg bg-white border border-slate-200/60">
              <div className="flex items-center space-x-2 min-w-0">
                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                  <span className="material-symbols-outlined text-[13px] font-bold">check</span>
                </div>
                <span className="text-xs text-slate-800 truncate">
                  Tải sơ đồ kệ vị trí & khu đệm (WH-01)
                </span>
              </div>
              <span className="text-[10px] text-emerald-700 font-semibold shrink-0 ml-1">Đã xong</span>
            </div>

            {/* Step 3 */}
            <div
              className={`flex items-center justify-between p-1.5 rounded-lg border transition-all ${
                step3Done ? 'bg-white border-slate-200/60' : 'bg-blue-50/80 border-blue-200'
              }`}
            >
              <div className="flex items-center space-x-2 min-w-0">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                    step3Done
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-blue-100 text-[#004ac6]'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[13px] ${
                      step3Done ? 'font-bold' : 'animate-spin'
                    }`}
                  >
                    {step3Done ? 'check' : 'progress_activity'}
                  </span>
                </div>
                <span className="text-xs text-slate-800 truncate font-medium">
                  Nạp danh sách thẻ pallet ({pendingCount} kiện)
                </span>
              </div>
              <span
                className={`text-[10px] font-semibold shrink-0 ml-1 ${
                  step3Done ? 'text-emerald-700' : 'text-[#004ac6] animate-pulse'
                }`}
              >
                {step3Done ? 'Đã xong' : 'Đang nạp'}
              </span>
            </div>

            {/* Step 4 */}
            <div
              className={`flex items-center justify-between p-1.5 rounded-lg border transition-all ${
                step4Done ? 'bg-white border-slate-200/60' : 'bg-slate-100 border-slate-200 opacity-70'
              }`}
            >
              <div className="flex items-center space-x-2 min-w-0">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                    step4Done
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[13px] ${
                      step4Done ? 'font-bold' : ''
                    }`}
                  >
                    {step4Done ? 'check' : 'sensors'}
                  </span>
                </div>
                <span className="text-xs text-slate-800 truncate">
                  Khởi tạo máy quét Honeywell EDA51
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-semibold shrink-0 ml-1">
                {step4Done ? 'Sẵn sàng' : 'Chờ'}
              </span>
            </div>
          </div>
        </div>

        {/* Action button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full h-11 rounded-xl neu-button text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all mt-2"
        >
          <span className="material-symbols-outlined text-[18px]">verified</span>
          <span>Vào bảng điều khiển kho</span>
        </button>
      </div>
    </div>
  );
};
