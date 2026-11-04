import React, { useState } from 'react';
import { Pallet, WarehouseLocation } from '../types';

interface DestinationModalProps {
  pallet: Pallet | null;
  locations: WarehouseLocation[];
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (destinationLocation: string, destinationCode: string, driver: string) => Promise<void>;
  currentDriver?: string;
  operatorCode?: string;
}

export const DestinationModal: React.FC<DestinationModalProps> = ({
  pallet,
  locations,
  isOpen,
  onClose,
  onConfirm,
  currentDriver = 'Trần Minh',
  operatorCode,
}) => {
  const [selectedLocId, setSelectedLocId] = useState<string>('TS-01');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Default to active shift employee, fixed and not selectable
  const operatingEmployee = currentDriver || 'Trần Minh';

  if (!isOpen || !pallet) return null;

  const handleSave = async () => {
    const loc = locations.find(l => l.id === selectedLocId) || locations[0];
    if (!loc) return;

    try {
      setIsSubmitting(true);
      await onConfirm(loc.name, loc.code, operatingEmployee);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'rack':
        return 'shelves';
      case 'staging':
        return 'near_me';
      case 'buffer':
        return 'move_to_inbox';
      case 'outbound':
        return 'output';
      default:
        return 'warehouse';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/60 backdrop-blur-sm transition-all animate-fadeIn">
      <div className="w-full max-w-lg mx-auto max-h-[88vh] bg-white rounded-t-3xl border-t border-slate-200/90 shadow-2xl flex flex-col overflow-hidden">
        {/* Drag handle */}
        <div className="flex items-center justify-center pt-3 pb-1">
          <div className="w-12 h-1 rounded-full bg-slate-300"></div>
        </div>

        {/* Modal Header */}
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#004ac6] text-[22px]">near_me</span>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Chọn vị trí đích điều chuyển
              </h3>
            </div>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="text-xs text-slate-500">Áp dụng cho mã:</span>
              <span className="font-code-md text-xs font-bold text-[#004ac6] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                {pallet.id}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng modal"
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-90 flex items-center justify-center text-slate-500 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Locations List */}
        <div className="p-4 overflow-y-auto flex flex-col gap-2.5 max-h-[46vh]">
          {locations.map(loc => {
            const isSelected = selectedLocId === loc.id;
            return (
              <label
                key={loc.id}
                onClick={() => setSelectedLocId(loc.id)}
                className={`relative flex items-center justify-between p-3.5 rounded-2xl cursor-pointer select-none transition-all active:scale-[0.99] border ${
                  isSelected
                    ? 'bg-blue-50/70 border-blue-300 shadow-[0_4px_16px_rgba(0,74,198,0.1)] ring-1 ring-[#004ac6]/30'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-[#004ac6] text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {getLocationIcon(loc.type)}
                    </span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 truncate">
                        {loc.name}
                      </span>
                      <span className="font-code-md text-[10px] font-semibold text-[#004ac6] bg-blue-100/70 px-1.5 py-0.2 rounded border border-blue-200/60">
                        {loc.code}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 truncate mt-0.5">
                      {loc.description || loc.zone}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <span className="text-[11px] text-slate-400 font-code-md hidden sm:inline">
                    {loc.currentCount}/{loc.capacity}
                  </span>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-[#004ac6] text-white shadow-sm ring-2 ring-blue-100'
                        : 'bg-slate-100 border border-slate-300 text-transparent'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px] font-bold">check</span>
                  </div>
                </div>
              </label>
            );
          })}
        </div>

        {/* Assigned Operating Staff (Cố định theo ca làm việc đang thao tác, không cho phép thay đổi/lựa chọn) */}
        <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 whitespace-nowrap">
            <span className="material-symbols-outlined text-[18px] text-[#004ac6]">person</span>
            <span>Nhân viên thực hiện:</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 animate-pulse"></span>
            <span className="text-xs font-bold text-slate-800">
              {operatingEmployee}
            </span>
            {operatorCode && (
              <span className="text-[10px] font-code-md text-slate-400 font-semibold">
                ({operatorCode})
              </span>
            )}
            <span
              className="material-symbols-outlined text-[14px] text-slate-400 ml-0.5 flex-shrink-0"
              title="Cố định theo nhân viên đang đăng nhập ca làm việc"
            >
              lock
            </span>
          </div>
        </div>

        {/* Modal Actions with mobile safe area */}
        <div className="p-4 pt-3 pb-safe bg-white border-t border-slate-200/80 flex flex-col gap-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSave}
            className="w-full h-11 sm:h-12 rounded-xl neu-button text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                <span>Đang lưu vào hàng đợi trung tâm...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">done_all</span>
                <span>Xác nhận & Lưu thẻ chờ</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-1.5 text-center text-slate-500 hover:text-slate-800 text-xs font-semibold"
          >
            Hủy bỏ
          </button>
        </div>
      </div>
    </div>
  );
};
