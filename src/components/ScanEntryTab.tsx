import React, { useState, useEffect, useRef } from 'react';
import { Pallet } from '../types';

interface ScanEntryTabProps {
  onOpenDestinationModal: (pallet: Pallet) => void;
  onNavigateToImport?: () => void;
  recentPallets?: Pallet[];
}

export const ScanEntryTab: React.FC<ScanEntryTabProps> = ({
  onOpenDestinationModal,
}) => {
  const [mode, setMode] = useState<'scan' | 'manual'>('scan');
  const [palletCode, setPalletCode] = useState<string>('');
  const [detectedPallet, setDetectedPallet] = useState<Pallet | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [torchActive, setTorchActive] = useState<boolean>(false);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Setup actual camera if user allows
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (mode === 'scan') {
      navigator.mediaDevices
        ?.getUserMedia({ video: { facingMode: 'environment' } })
        .then(s => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            setCameraActive(true);
          }
        })
        .catch(() => {
          // Fallback to simulated high-tech camera feed
          setCameraActive(false);
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [mode]);

  // Validate QR code format: Starts with K or T, followed by digits (e.g. K01, T01, K111, T111, K1024)
  const validateAndSetCode = (rawVal: string) => {
    const formatted = rawVal.trim().toUpperCase();
    setPalletCode(formatted);

    if (!formatted) {
      setValidationError(null);
      setDetectedPallet(null);
      return;
    }

    // Check first character must be K or T
    if (!formatted.startsWith('K') && !formatted.startsWith('T')) {
      setValidationError('Mã pallet phải bắt đầu bằng chữ "K" hoặc "T" (Ví dụ: K01, T01)');
      setDetectedPallet(null);
      return;
    }

    // If only K or T has been entered
    if (formatted.length === 1) {
      setValidationError('Vui lòng nhập thêm số pallet (Ví dụ: K01, T01)');
      setDetectedPallet(null);
      return;
    }

    // Format: K or T followed by 1 or more digits
    const isValidFormat = /^[KT]\d+$/.test(formatted);

    if (isValidFormat) {
      setValidationError(null);
      setDetectedPallet({
        id: formatted,
        name: `Kiện ${formatted}`,
        weight: 0,
        boxes: 0,
        spec: 'Tiêu chuẩn',
        packaging: 'Tiêu chuẩn',
        category: formatted.startsWith('K') ? 'Kiện lưu kho' : 'Thùng hàng',
        priority: 'normal',
        currentLocation: 'Kho WH-01 Sàn bốc',
        status: 'available',
      });
    } else {
      setValidationError('Sau chữ cái K hoặc T phải là các chữ số (Ví dụ: K01, T01)');
      setDetectedPallet(null);
    }
  };

  const handleClear = () => {
    setPalletCode('');
    setValidationError(null);
    setDetectedPallet(null);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        validateAndSetCode(text.trim());
      }
    } catch {
      // no-op if paste fails
    }
  };

  const handleContinue = () => {
    if (detectedPallet && /^[KT]\d+$/.test(detectedPallet.id)) {
      onOpenDestinationModal(detectedPallet);
    }
  };

  return (
    <div className="flex flex-col w-full px-3 sm:px-4 max-w-2xl mx-auto pb-8 pt-1 sm:pt-2 touch-pan-y">
      {/* Top Hero & Warehouse Zone Meta */}
      <div className="pt-1 sm:pt-2 pb-1.5 sm:pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-[#004ac6] font-bold font-code-md truncate">
              Khu Vực Nhập Kho A2 • WH-01
            </span>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight truncate">
              Nhận diện kiện Pallet
            </h1>
          </div>
          <div className="flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] sm:text-xs font-semibold border border-emerald-200 flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span>Chờ điều chuyển</span>
          </div>
        </div>
        <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
          Quét mã phản quang hoặc gõ mã Pallet để lập lệnh điều chuyển vị trí lưu kho.
        </p>
      </div>

      {/* Segmented Mode Switcher */}
      <div className="my-2.5">
        <div className="p-1 rounded-xl bg-slate-100 flex items-center shadow-inner border border-slate-200/60">
          <button
            type="button"
            onClick={() => setMode('scan')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              mode === 'scan'
                ? 'bg-white text-[#004ac6] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
            <span>Quét Camera</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('manual')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              mode === 'manual'
                ? 'bg-white text-[#004ac6] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">keyboard</span>
            <span>Nhập tay</span>
          </button>
        </div>
      </div>

      {/* CAMERA SCANNER VIEW */}
      {mode === 'scan' ? (
        <div className="flex flex-col gap-3">
          <div className="relative w-full rounded-2xl overflow-hidden bg-slate-900 shadow-xl flex flex-col items-center justify-center min-h-[300px]">
            {/* Real or Simulated Camera View */}
            {cameraActive ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div
                className="absolute inset-0 bg-cover bg-center opacity-45 mix-blend-luminosity scale-105"
                style={{
                  backgroundImage:
                    "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCXeJqCNrHK8XnYSKEBeUaMTmgYJ0SGMDzF8weokJovGXak2pnu85-SLjTr-XvdGUqTbO-DyvyEty_nxeyiIu3J8Lq8O96lW3jpADCI2QlguvT63l67KAJDf1ZJuSyccLJQatF7KZwxZdDtDqDtvIzGDA0GUhVDvxuA5xBJoZNoSXxpMyAZ-p-NKDrs93hrhL0xE9lmE8RdyTWDhggXyIIcwO4e5A79FwzWwwdfw-GA')",
                }}
              />
            )}

            {/* Gradient Scrim */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-transparent to-slate-950/90 pointer-events-none" />

            {/* Top HUD Controls */}
            <div className="absolute top-3 inset-x-3 flex items-center justify-between z-20">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/75 backdrop-blur-md text-white shadow-md border border-white/10">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span className="text-[11px] uppercase font-bold tracking-wider font-code-md">
                  AI Barcode Engine v3
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTorchActive(!torchActive)}
                  title="Bật đèn Flash"
                  className={`w-9 h-9 rounded-full backdrop-blur-md flex items-center justify-center transition-all shadow-md ${
                    torchActive ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300' : 'bg-slate-900/70 text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {torchActive ? 'flashlight_off' : 'flash_on'}
                  </span>
                </button>
              </div>
            </div>

            {/* Reticle Box with Animated Scanning Laser */}
            <div className="relative w-56 h-48 sm:w-64 sm:h-56 z-10 flex items-center justify-center pointer-events-none">
              <div className="absolute top-0 left-0 w-8 h-8 rounded-tl-xl border-t-4 border-l-4 border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.6)]"></div>
              <div className="absolute top-0 right-0 w-8 h-8 rounded-tr-xl border-t-4 border-r-4 border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.6)]"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 rounded-bl-xl border-b-4 border-l-4 border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.6)]"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 rounded-br-xl border-b-4 border-r-4 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.6)]"></div>

              {/* Animated Laser Line Sweep */}
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_12px_#38bdf8] animate-pulse"></div>

              {/* Center Barcode Graphic Target */}
              <div className="absolute inset-8 rounded-xl bg-slate-950/20 backdrop-blur-xs flex items-center justify-center p-2 opacity-75">
                <div className="flex flex-col items-center justify-center text-white gap-1 text-center">
                  <span className="material-symbols-outlined text-[36px] text-blue-300">
                    qr_code_2
                  </span>
                  <span className="text-[11px] text-slate-200">
                    Hướng vào tem nhãn Pallet (Ví dụ: K01, T01)
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Scanner Status */}
            <div className="absolute bottom-3 inset-x-4 flex flex-col items-center gap-1 z-20">
              <span className="text-xs text-white bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full shadow border border-white/10 font-medium">
                Hỗ trợ định dạng: K... hoặc T... (Ví dụ: K01, T01)
              </span>
            </div>
          </div>

          {/* Bluetooth Scanner Connected */}
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-[#004ac6]">
                <span className="material-symbols-outlined text-[20px]">sensors</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-900">
                  Đầu đọc Bluetooth / Súng quét
                </span>
                <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Súng Honeywell EDA51 kết nối
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-code-md text-xs font-semibold border border-slate-200">
              Chờ quét mã
            </span>
          </div>
        </div>
      ) : (
        /* MANUAL ENTRY VIEW */
        <div className="flex flex-col gap-3">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="pallet-code-input"
                className="text-xs font-bold uppercase text-slate-700 flex items-center gap-1.5 truncate"
              >
                <span className="material-symbols-outlined text-[#004ac6] text-[18px] flex-shrink-0">pin</span>
                <span>Nhập mã QR kiện</span>
              </label>
              <span className="text-[10px] sm:text-[11px] text-[#004ac6] font-bold font-code-md bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/80 flex-shrink-0">
                K... / T...
              </span>
            </div>

            <div
              className={`relative flex items-center rounded-xl bg-slate-50 border p-1 shadow-inner focus-within:bg-white transition-all ${
                validationError
                  ? 'border-rose-400 focus-within:border-rose-500 focus-within:ring-2 focus-within:ring-rose-100'
                  : 'border-slate-200 focus-within:border-[#004ac6] focus-within:ring-2 focus-within:ring-blue-100'
              }`}
            >
              <div className="pl-3 pr-2 text-slate-400">
                <span className="material-symbols-outlined text-[22px]">inventory_2</span>
              </div>
              <input
                id="pallet-code-input"
                type="text"
                maxLength={12}
                value={palletCode}
                onChange={e => validateAndSetCode(e.target.value)}
                placeholder="Ví dụ: K01 hoặc T01"
                className="w-full bg-transparent py-2.5 text-slate-900 font-code-md text-base font-bold tracking-wider placeholder:text-slate-400 focus:outline-none uppercase"
              />
              <div className="flex items-center gap-1 pr-1">
                {palletCode && (
                  <button
                    type="button"
                    onClick={handleClear}
                    title="Xóa mã"
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">cancel</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handlePaste}
                  title="Dán từ bộ nhớ tạm"
                  className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#004ac6] text-xs font-bold flex items-center gap-1 transition-colors border border-blue-200"
                >
                  <span className="material-symbols-outlined text-[16px]">content_paste</span>
                  <span>Dán</span>
                </button>
              </div>
            </div>

            {/* Validation Feedback Banner */}
            {validationError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-fadeIn">
                <span className="material-symbols-outlined text-[18px] text-rose-600 flex-shrink-0">
                  block
                </span>
                <span className="font-medium leading-tight">{validationError}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Streamlined Active Pallet Indicator */}
      {detectedPallet && (
        <div className="mt-3 p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#004ac6] text-white flex items-center justify-center shadow-xs flex-shrink-0">
              <span className="material-symbols-outlined text-[18px]">verified</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-code-md text-sm font-bold text-slate-900 truncate">
                Mã QR: {detectedPallet.id}
              </span>
              <span className="text-[11px] text-slate-500 truncate">
                Sẵn sàng chọn vị trí đích điều chuyển
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold uppercase flex-shrink-0">
            Hợp lệ
          </span>
        </div>
      )}

      {/* Primary Dispatch Action Button */}
      <div className="mt-3">
        <button
          type="button"
          disabled={!detectedPallet || !!validationError}
          onClick={handleContinue}
          className="w-full h-13 rounded-2xl bg-[#004ac6] hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(0,74,198,0.28)] transition-all disabled:opacity-40 disabled:pointer-events-none"
        >
          <span className="material-symbols-outlined text-[22px]">near_me</span>
          <span>Chọn vị trí đích điều chuyển</span>
          <span className="material-symbols-outlined text-[20px] ml-0.5">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};
