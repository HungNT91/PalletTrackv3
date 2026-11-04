import React, { useState } from 'react';
import { ShiftSession } from '../types';

interface ShiftLoginModalProps {
  currentShift: ShiftSession | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveShift: (updated: Partial<ShiftSession>) => Promise<void>;
  onLogout?: () => void;
}

export const ShiftLoginModal: React.FC<ShiftLoginModalProps> = ({
  currentShift,
  isOpen,
  onClose,
  onSaveShift,
  onLogout,
}) => {
  const [operatorCode, setOperatorCode] = useState(currentShift?.operatorCode || 'OP-2048');
  const [operatorName, setOperatorName] = useState(currentShift?.operatorName || 'Trần Minh');
  const [station, setStation] = useState(
    currentShift?.station || 'WH-01 • Kho A (Khu nhận diện pallet & tiền soạn)'
  );
  const [password, setPassword] = useState('••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage('Đang đồng bộ phân ca với máy chủ ERP...');

    try {
      await onSaveShift({
        operatorCode,
        operatorName,
        station,
        status: 'online',
      });
      setStatusMessage('Đã xác thực ca làm việc thành công!');
      setTimeout(() => {
        setIsLoading(false);
        setStatusMessage(null);
        onClose();
      }, 700);
    } catch {
      setIsLoading(false);
      setStatusMessage('Lỗi xác thực ca làm việc');
    }
  };

  const simulateBadgeScan = () => {
    setOperatorCode('OP-5512');
    setOperatorName('Lê Hữu Hoàng');
    setStatusMessage('Đã quét thẻ nhân viên: Lê Hữu Hoàng (OP-5512)');
    setTimeout(() => setStatusMessage(null), 2500);
  };

  const simulateBiometric = () => {
    if (navigator.vibrate) navigator.vibrate([30, 40]);
    setStatusMessage('Xác thực vân tay hợp lệ: Trần Minh (OP-2048)');
    setTimeout(() => setStatusMessage(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-3 animate-fadeIn">
      <div className="relative w-full max-w-[calc(100vw-20px)] xs:max-w-md bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-[#004ac6] flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[24px]">badge</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Đăng nhập ca làm việc
              </h2>
              <span className="text-[11px] text-slate-500 font-code-md">
                Kho vận trung tâm WH-01 • Ca sáng
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

        {statusMessage && (
          <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-emerald-600">verified</span>
            <span>{statusMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 mt-3">
          {/* Operator Name & Code */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Mã nhân viên</label>
              <input
                type="text"
                required
                value={operatorCode}
                onChange={e => setOperatorCode(e.target.value.toUpperCase())}
                placeholder="OP-2048"
                className="h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-code-md font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#004ac6]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Họ và tên</label>
              <input
                type="text"
                required
                value={operatorName}
                onChange={e => setOperatorName(e.target.value)}
                placeholder="Trần Minh"
                className="h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#004ac6]"
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">Mật khẩu PIN ca</label>
              <span className="text-[11px] text-[#004ac6] cursor-pointer hover:underline">
                Cấp lại PIN
              </span>
            </div>
            <div className="relative flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full h-11 pl-3 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#004ac6]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-slate-400 hover:text-slate-700"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {showPassword ? 'visibility' : 'visibility_off'}
                </span>
              </button>
            </div>
          </div>

          {/* Warehouse Station Selection */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>Trạm thao tác / Khu vực kho</span>
              <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Đang trực tuyến
              </span>
            </label>
            <select
              value={station}
              onChange={e => setStation(e.target.value)}
              className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#004ac6]"
            >
              <option value="WH-01 • Kho A (Khu nhận diện pallet & tiền soạn)">
                WH-01 • Kho A (Khu nhận diện pallet & tiền soạn)
              </option>
              <option value="WH-01 • Kho B (Khu giá kệ cao High-Bay 01-12)">
                WH-01 • Kho B (Khu giá kệ cao High-Bay 01-12)
              </option>
              <option value="WH-01 • Kho Lạnh & Kiểm soát nhiệt độ chuyên biệt">
                WH-01 • Kho Lạnh & Kiểm soát nhiệt độ
              </option>
              <option value="WH-02 • Dock Nhập hàng container quốc tế">
                WH-02 • Dock Nhập hàng container
              </option>
              <option value="WH-03 • Trạm Phân loại & Xuất kho nhanh Cross-dock">
                WH-03 • Trạm Phân loại Xuất kho Cross-dock
              </option>
            </select>
          </div>

          {/* Fast Access Methods for Warehouse */}
          <div className="flex flex-col gap-2 pt-1">
            <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider text-center">
              Xác thực nhanh sàn kho
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={simulateBadgeScan}
                className="h-10 px-2.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs"
              >
                <span className="material-symbols-outlined text-[18px] text-[#004ac6]">qr_code_scanner</span>
                <span>Quét thẻ PDA</span>
              </button>
              <button
                type="button"
                onClick={simulateBiometric}
                className="h-10 px-2.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs"
              >
                <span className="material-symbols-outlined text-[18px] text-emerald-600">fingerprint</span>
                <span>Vân tay 1 chạm</span>
              </button>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex flex-col gap-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl neu-button text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md active:scale-[0.99] transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
                  <span>Đang kết nối trạm...</span>
                </>
              ) : (
                <>
                  <span>Lưu & Cập nhật phiên làm việc</span>
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </>
              )}
            </button>

            {onLogout && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="w-full h-10 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-[17px]">logout</span>
                <span>Đăng xuất phiên làm việc</span>
              </button>
            )}

            <div className="text-center text-[11px] text-slate-400">
              Honeywell EDA51 • IP: {currentShift?.ipAddress || '192.168.1.104'} • Độ trễ 12ms
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
