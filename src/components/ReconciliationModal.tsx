import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { TransferCard } from '../types';

interface ReconciliationModalProps {
  card: TransferCard | null;
  isOpen: boolean;
  onClose: () => void;
  onReconcile: (cardId: string) => Promise<void>;
}

export const ReconciliationModal: React.FC<ReconciliationModalProps> = ({
  card,
  isOpen,
  onClose,
  onReconcile,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [copiedField, setCopiedField] = useState<'pallet' | 'dest' | null>(null);

  // High-contrast real scannable QR Data URLs
  const [palletQrUrl, setPalletQrUrl] = useState<string>('');
  const [destQrUrl, setDestQrUrl] = useState<string>('');

  // Extract destination name and standard code format
  const getDestinationDisplay = (c: TransferCard) => {
    const rawName = c.destinationLocation || 'Rack Thường';
    // Clean name if previously stored with parens e.g. "Rack A-04 (RACK-A04)"
    const name = rawName.includes('(') ? rawName.split('(')[0].trim() : rawName;

    let code = c.destinationCode;
    if (!code || code === 'RACK-A04' || name.toLowerCase().includes('rack')) {
      code = '80001010_Z1_D2_C1_T2_H1';
    }

    return {
      name: name.toLowerCase().includes('rack') ? 'Rack Thường' : name,
      code: code || '80001010_Z1_D2_C1_T2_H1',
    };
  };

  const { name: destinationName, code: destinationCode } = card
    ? getDestinationDisplay(card)
    : { name: 'Rack Thường', code: '80001010_Z1_D2_C1_T2_H1' };

  useEffect(() => {
    if (!isOpen || !card) {
      setIsCompleted(false);
      setCopiedField(null);
      return;
    }

    setIsCompleted(card.status === 'completed');
    setCopiedField(null);

    // Generate real scannable QR Code for Pallet
    QRCode.toDataURL(card.palletId, {
      width: 180,
      margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    })
      .then(url => setPalletQrUrl(url))
      .catch(err => console.error('Error generating pallet QR:', err));

    // Generate real scannable QR Code for Destination
    QRCode.toDataURL(destinationCode, {
      width: 180,
      margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    })
      .then(url => setDestQrUrl(url))
      .catch(err => console.error('Error generating dest QR:', err));
  }, [isOpen, card, destinationCode]);

  if (!isOpen || !card) return null;

  // Quick copy helper with feedback
  const handleCopy = (text: string, field: 'pallet' | 'dest', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedField(field);
      if (navigator.vibrate) {
        navigator.vibrate(30);
      }
      setTimeout(() => {
        setCopiedField(null);
      }, 2000);
    } catch (err) {
      console.warn('Clipboard copy failed:', err);
    }
  };

  const handleConfirm = async () => {
    if (isCompleted || card.status === 'completed') {
      onClose();
      return;
    }

    try {
      setIsProcessing(true);
      if (navigator.vibrate) {
        navigator.vibrate([40, 60, 100]);
      }
      await onReconcile(card.id);
      setIsCompleted(true);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const alreadyCompleted = isCompleted || card.status === 'completed';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4 animate-fadeIn">
      <div className="relative w-full max-w-[calc(100vw-20px)] xs:max-w-[380px] sm:max-w-[400px] mx-auto bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-2xl border border-slate-100 flex flex-col gap-2.5 sm:gap-3 transition-all duration-300 max-h-[92dvh] overflow-y-auto">
        {/* 1. Header Modal */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 sm:pb-2.5">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-blue-50 border border-blue-200/70 flex items-center justify-center text-[#004ac6] flex-shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[19px] sm:text-[22px]">swap_horizontal_circle</span>
            </div>
            <div className="min-w-0">
              <h2 className="text-[14px] sm:text-[15px] font-bold text-slate-900 tracking-tight truncate leading-tight">
                Chi tiết điều chuyển Pallet
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5 text-[10px] sm:text-[11px]">
                <span className="text-slate-500 font-medium uppercase tracking-wide">MÃ THẺ:</span>
                <span className="font-code-md text-[#004ac6] font-bold">#{card.id}</span>
                <span className="text-slate-400">•</span>
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    alreadyCompleted ? 'bg-emerald-500' : 'bg-emerald-500 animate-pulse'
                  }`}
                ></span>
                <span className={`font-semibold ${alreadyCompleted ? 'text-emerald-700' : 'text-emerald-600'}`}>
                  {alreadyCompleted ? 'Đã hoàn tất' : card.status === 'pending' ? 'Chờ Nhập' : card.statusLabel || 'Đang xử lý'}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng màn hình đối soát"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[16px] sm:text-[18px]">close</span>
          </button>
        </div>

        {/* 2. Two QR codes side by side */}
        <div className="relative grid grid-cols-2 gap-2 sm:gap-2.5 items-stretch pt-0.5">
          {/* Left Card: Pallet QR */}
          <div className="bg-blue-50/50 rounded-xl sm:rounded-2xl p-2 sm:p-2.5 border border-blue-100 flex flex-col items-center text-center relative min-w-0">
            <span className="text-[9px] sm:text-[10px] font-bold text-[#004ac6] uppercase tracking-wide h-4 flex items-center justify-center mb-1.5">
              QR PALLET
            </span>

            {/* Pallet Code with Quick Copy - Centered */}
            <div className="w-full bg-white/95 rounded-lg px-2 h-[32px] sm:h-[36px] mb-2 border border-blue-100 shadow-2xs flex items-center justify-center relative">
              <div className="flex items-center justify-center gap-1 min-w-0 max-w-[calc(100%-28px)] mx-auto">
                <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium flex-shrink-0">Mã:</span>
                <span className="font-code-md text-[10px] sm:text-[11px] font-bold text-slate-900 truncate text-center" title={card.palletId}>
                  {card.palletId}
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => handleCopy(card.palletId, 'pallet', e)}
                title="Sao chép nhanh mã Pallet"
                className={`absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded active:scale-90 transition-all flex items-center justify-center flex-shrink-0 ${
                  copiedField === 'pallet'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'hover:bg-blue-100 active:bg-blue-200 text-[#004ac6]'
                }`}
              >
                <span className="material-symbols-outlined text-[13px] sm:text-[14px]">
                  {copiedField === 'pallet' ? 'check' : 'content_copy'}
                </span>
              </button>
              {copiedField === 'pallet' && (
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 z-20 px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[8px] sm:text-[9px] font-bold shadow-sm whitespace-nowrap animate-fadeIn pointer-events-none">
                  ✓ Đã chép
                </span>
              )}
            </div>

            {/* High Contrast Scalable Scannable QR Code */}
            <div className="w-[88px] h-[88px] xs:w-[98px] xs:h-[98px] sm:w-[108px] sm:h-[108px] p-1.5 bg-white rounded-xl border border-blue-200/80 shadow-sm flex items-center justify-center">
              {palletQrUrl ? (
                <img
                  src={palletQrUrl}
                  alt={`Mã QR Pallet ${card.palletId}`}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <span className="material-symbols-outlined text-xl sm:text-2xl animate-spin">sync</span>
                </div>
              )}
            </div>

            {/* Bottom Status Box with matching height to Right Card */}
            <div className="w-full bg-white/95 rounded-lg px-2 h-[32px] sm:h-[36px] mt-2 border border-blue-100 shadow-2xs flex items-center justify-center">
              <div className="flex items-center justify-center gap-1 text-[10px] sm:text-[11px] font-semibold text-[#004ac6] truncate">
                <span className="material-symbols-outlined text-[14px] sm:text-[15px] text-emerald-600 flex-shrink-0">verified</span>
                <span className="truncate">Mã kiện hợp lệ</span>
              </div>
            </div>
          </div>

          {/* Middle arrow indicator pointing right */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white border border-blue-200 shadow-md flex items-center justify-center text-[#004ac6]">
              <span className="material-symbols-outlined text-[14px] sm:text-[16px] font-bold">arrow_forward</span>
            </div>
          </div>

          {/* Right Card: Destination QR with Name at top & Code at bottom */}
          <div className="bg-indigo-50/50 rounded-xl sm:rounded-2xl p-2 sm:p-2.5 border border-indigo-100 flex flex-col items-center text-center relative min-w-0">
            <span className="text-[9px] sm:text-[10px] font-bold text-indigo-700 uppercase tracking-wide h-4 flex items-center justify-center mb-1.5">
              QR VỊ TRÍ ĐÍCH
            </span>

            {/* Destination Name Info - Centered */}
            <div className="w-full bg-white/95 rounded-lg px-2 h-[32px] sm:h-[36px] mb-2 border border-indigo-100 shadow-2xs flex items-center justify-center relative">
              <div className="flex items-center justify-center gap-1 min-w-0 max-w-[calc(100%-12px)] mx-auto">
                <span className="text-slate-400 text-[9px] sm:text-[10px] font-medium flex-shrink-0">Tên:</span>
                <span className="font-bold text-slate-900 text-[10px] sm:text-[11px] truncate text-center" title={destinationName}>
                  {destinationName}
                </span>
              </div>
            </div>

            {/* High Contrast Scalable Scannable QR Code */}
            <div className="w-[88px] h-[88px] xs:w-[98px] xs:h-[98px] sm:w-[108px] sm:h-[108px] p-1.5 bg-white rounded-xl border border-indigo-200/80 shadow-sm flex items-center justify-center">
              {destQrUrl ? (
                <img
                  src={destQrUrl}
                  alt={`Mã QR ${destinationCode}`}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <span className="material-symbols-outlined text-xl sm:text-2xl animate-spin">sync</span>
                </div>
              )}
            </div>

            {/* Destination Code with Quick Copy - Centered */}
            <div className="w-full bg-white/95 rounded-lg px-2 h-[32px] sm:h-[36px] mt-2 border border-indigo-100 shadow-2xs flex items-center justify-center relative">
              <div className="flex items-center justify-center gap-1 min-w-0 max-w-[calc(100%-28px)] mx-auto">
                <span className="text-slate-400 text-[9px] sm:text-[10px] font-medium flex-shrink-0">Mã:</span>
                <span
                  className="font-code-md text-[8.5px] xs:text-[9.5px] font-bold text-indigo-700 truncate text-center"
                  title={destinationCode}
                >
                  {destinationCode}
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => handleCopy(destinationCode, 'dest', e)}
                title="Sao chép nhanh mã vị trí đích"
                className={`absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded active:scale-90 transition-all flex items-center justify-center flex-shrink-0 ${
                  copiedField === 'dest'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'hover:bg-indigo-100 active:bg-indigo-200 text-indigo-600'
                }`}
              >
                <span className="material-symbols-outlined text-[13px] sm:text-[14px]">
                  {copiedField === 'dest' ? 'check' : 'content_copy'}
                </span>
              </button>
              {copiedField === 'dest' && (
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 z-20 px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[8px] sm:text-[9px] font-bold shadow-sm whitespace-nowrap animate-fadeIn pointer-events-none">
                  ✓ Đã chép
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 3. Verification hint banner */}
        <div className="bg-blue-50/80 rounded-xl px-2.5 sm:px-3 py-1.5 sm:py-2 border border-blue-100 flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] sm:text-[18px] text-[#004ac6] flex-shrink-0">info</span>
          <p className="text-[10px] sm:text-[11px] text-slate-700 font-medium leading-tight">
            Đối soát pallet và vị trí đích trước khi chốt lưu kho
          </p>
        </div>

        {/* 4. Large primary action button with tactile state (Reverted to previous version) */}
        <button
          type="button"
          disabled={isProcessing}
          onClick={handleConfirm}
          className={`w-full h-11 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.99] transition-all shadow-md ${
            alreadyCompleted
              ? 'bg-emerald-600 text-white cursor-default'
              : 'neu-button text-white'
          }`}
        >
          {isProcessing ? (
            <>
              <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
              <span>Đang xác nhận đối soát...</span>
            </>
          ) : alreadyCompleted ? (
            <>
              <span className="material-symbols-outlined text-[20px]">verified</span>
              <span>ĐÃ HOÀN TẤT ĐIỀU CHUYỂN</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
              <span>Xác nhận hoàn tất điều chuyển</span>
            </>
          )}
        </button>

        {/* 5. Secondary dismiss button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full text-center py-1 text-xs font-semibold text-slate-500 hover:text-slate-800 active:opacity-70 transition-all"
        >
          Đóng cửa sổ đối soát
        </button>
      </div>
    </div>
  );
};
