import React, { useState, useEffect, useRef, useCallback } from 'react';
import jsQR from 'jsqr';
import { Pallet } from '../types';

interface ScanEntryTabProps {
  onOpenDestinationModal: (pallet: Pallet) => void;
  onNavigateToImport?: () => void;
  recentPallets?: Pallet[];
}

// Hàm phát âm thanh Beep khi quét mã QR/Barcode thành công
function playBeepSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch {}
}

// Bóc tách mã pallet từ chuỗi quét (hỗ trợ cả JSON, URL, chuỗi thường)
function extractPalletCode(raw: string): string {
  const trimmed = raw.trim();
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed.id) return String(parsed.id).trim().toUpperCase();
    if (parsed.palletId) return String(parsed.palletId).trim().toUpperCase();
  } catch {}

  if (trimmed.includes('/')) {
    const parts = trimmed.split('/');
    const last = parts[parts.length - 1];
    if (/^[KT]\d+$/i.test(last)) return last.toUpperCase();
  }

  return trimmed.toUpperCase();
}

export const ScanEntryTab: React.FC<ScanEntryTabProps> = ({
  onOpenDestinationModal,
}) => {
  const [mode, setMode] = useState<'scan' | 'manual'>('scan');
  const [palletCode, setPalletCode] = useState<string>('');
  const [detectedPallet, setDetectedPallet] = useState<Pallet | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Camera states
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [torchActive, setTorchActive] = useState<boolean>(false);
  const [torchSupported, setTorchSupported] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isScanSuccessAnim, setIsScanSuccessAnim] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const lastScannedTimeRef = useRef<number>(0);

  // Validate QR code format: Starts with K or T, followed by digits (e.g. K01, T01, K11, T02...)
  const validateAndSetCode = useCallback((rawVal: string) => {
    const formatted = extractPalletCode(rawVal);
    setPalletCode(formatted);

    if (!formatted) {
      setValidationError(null);
      setDetectedPallet(null);
      return;
    }

    if (!formatted.startsWith('K') && !formatted.startsWith('T')) {
      setValidationError('Mã pallet phải bắt đầu bằng chữ "K" hoặc "T" (Ví dụ: K01, T01)');
      setDetectedPallet(null);
      return;
    }

    if (formatted.length === 1) {
      setValidationError('Vui lòng nhập thêm số pallet (Ví dụ: K01, T01)');
      setDetectedPallet(null);
      return;
    }

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
        currentLocation: 'Kho WH-01 Sàn bốc dỡ',
        status: 'PENDING',
      });
    } else {
      setValidationError('Sau chữ cái K hoặc T phải là các chữ số (Ví dụ: K01, T01)');
      setDetectedPallet(null);
    }
  }, []);

  // Xử lý khi camera phát hiện mã
  const handleDetectedCode = useCallback((code: string) => {
    const now = Date.now();
    // Giảm tần suất quét lặp lại (ít nhất 1.2s giữa 2 lần nhận diện)
    if (now - lastScannedTimeRef.current < 1200) {
      return;
    }
    lastScannedTimeRef.current = now;

    const formatted = extractPalletCode(code);
    if (!formatted) return;

    // Phát âm thanh và rung
    playBeepSound();
    if (navigator.vibrate) {
      navigator.vibrate([60, 40, 60]);
    }

    // Hiệu ứng flash viền xanh thành công
    setIsScanSuccessAnim(true);
    setTimeout(() => setIsScanSuccessAnim(false), 800);

    validateAndSetCode(formatted);
  }, [validateAndSetCode]);

  // Khởi động Camera stream
  const startCamera = useCallback(async () => {
    // Dừng stream cũ nếu có
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    setCameraError(null);
    setCameraActive(false);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Trình duyệt không hỗ trợ truy cập máy ảnh');
      }

      let stream: MediaStream;
      try {
        // Thử camera sau (environment)
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch {
        // Fallback camera bất kỳ nếu facingMode không được hỗ trợ
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setCameraActive(true);
      }

      // Kiểm tra hỗ trợ đèn flash
      const track = stream.getVideoTracks()[0];
      if (track) {
        const capabilities = (track.getCapabilities?.() || {}) as any;
        setTorchSupported(Boolean(capabilities?.torch));
      }
    } catch (err: any) {
      console.warn('Lỗi mở Camera:', err);
      setCameraActive(false);
      setCameraError(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Quyền truy cập Camera bị từ chối. Vui lòng cho phép quyền máy ảnh trong cài đặt trình duyệt.'
          : 'Không thể kết nối với máy ảnh. Bạn có thể chuyển sang tab Nhập tay.'
      );
    }
  }, [facingMode]);

  // Vòng lặp giải mã khung hình QR / Barcode liên tục từ Video
  useEffect(() => {
    if (mode !== 'scan') {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      setCameraActive(false);
      return;
    }

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [mode, startCamera]);

  // Quét từng frame khi camera đã active
  useEffect(() => {
    if (!cameraActive || mode !== 'scan') return;

    let isScanning = true;

    const scanFrame = async () => {
      if (!isScanning) return;

      const video = videoRef.current;
      if (video && video.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
        if (!canvasRef.current) {
          canvasRef.current = document.createElement('canvas');
        }
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          let detectedValue: string | null = null;

          // 1. Thử BarcodeDetector native nếu trình duyệt hỗ trợ (siêu nhanh)
          if ('BarcodeDetector' in window) {
            try {
              const detector = new (window as any).BarcodeDetector({
                formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8', 'data_matrix'],
              });
              const barcodes = await detector.detect(canvas);
              if (barcodes.length > 0 && barcodes[0].rawValue) {
                detectedValue = barcodes[0].rawValue;
              }
            } catch {}
          }

          // 2. Dùng thư viện jsQR giải mã ảnh
          if (!detectedValue) {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'dontInvert',
            });
            if (qrCode && qrCode.data) {
              detectedValue = qrCode.data;
            }
          }

          if (detectedValue) {
            handleDetectedCode(detectedValue);
          }
        }
      }

      if (isScanning) {
        animFrameIdRef.current = requestAnimationFrame(scanFrame);
      }
    };

    animFrameIdRef.current = requestAnimationFrame(scanFrame);

    return () => {
      isScanning = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [cameraActive, mode, handleDetectedCode]);

  // Bật/tắt đèn Flash (Torch)
  const toggleTorch = async () => {
    try {
      const track = streamRef.current?.getVideoTracks()[0];
      if (!track) return;
      const next = !torchActive;
      await (track as any).applyConstraints?.({ advanced: [{ torch: next }] });
      setTorchActive(next);
    } catch (e) {
      console.warn('Thiết bị không hỗ trợ bật đèn pin:', e);
    }
  };

  // Đổi camera Trước / Sau
  const toggleFacingMode = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
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
    } catch {}
  };

  const handleContinue = () => {
    if (detectedPallet && /^[KT]\d+$/.test(detectedPallet.id)) {
      onOpenDestinationModal(detectedPallet);
    }
  };

  return (
    <div className="flex flex-col w-full px-3 sm:px-4 max-w-2xl mx-auto pb-8 pt-1 sm:pt-2 touch-pan-y">
      {/* Top Header */}
      <div className="pt-1 sm:pt-2 pb-1.5 sm:pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-[#004ac6] font-bold font-code-md truncate">
              Khu Vực Nhập Kho • WH-01
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
          Đưa mã QR hoặc Barcode vào tâm camera để nhận diện tự động và lập lệnh điều chuyển.
        </p>
      </div>

      {/* Segmented Mode Switcher */}
      <div className="my-2.5">
        <div className="p-1 rounded-xl bg-slate-100 flex items-center shadow-inner border border-slate-200/60">
          <button
            type="button"
            onClick={() => setMode('scan')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
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
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
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
          <div className="relative w-full rounded-2xl overflow-hidden bg-slate-950 shadow-xl flex flex-col items-center justify-center min-h-[340px] sm:min-h-[380px]">
            {/* Live Video Element */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                cameraActive ? 'opacity-100' : 'opacity-0'
              }`}
            />

            {/* Camera error banner or loading */}
            {!cameraActive && (
              <div className="relative z-20 flex flex-col items-center justify-center p-6 text-center text-white max-w-sm">
                {cameraError ? (
                  <>
                    <span className="material-symbols-outlined text-4xl text-amber-400 mb-2">
                      videocam_off
                    </span>
                    <p className="text-xs text-slate-300 mb-4">{cameraError}</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={startCamera}
                        className="px-3 py-1.5 rounded-xl bg-[#004ac6] hover:bg-blue-600 text-white text-xs font-bold transition-all flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[16px]">refresh</span>
                        <span>Thử lại</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setMode('manual')}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all"
                      >
                        Chuyển Nhập tay
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-4xl text-blue-400 mb-2 animate-spin">
                      progress_activity
                    </span>
                    <p className="text-xs text-slate-300 font-medium">Đang khởi động Camera máy quét...</p>
                  </>
                )}
              </div>
            )}

            {/* Gradient Scrim */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-transparent to-slate-950/80 pointer-events-none" />

            {/* Top HUD Controls */}
            <div className="absolute top-3 inset-x-3 flex items-center justify-between z-20">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md text-white shadow-md border border-white/10">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span className="text-[11px] uppercase font-bold tracking-wider font-code-md">
                  QR & Barcode Live
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Đổi Camera Trước / Sau */}
                <button
                  type="button"
                  onClick={toggleFacingMode}
                  title="Đổi camera trước/sau"
                  className="w-9 h-9 rounded-full bg-slate-900/80 backdrop-blur-md flex items-center justify-center text-white transition-all shadow-md hover:bg-slate-800 border border-white/10 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">flip_camera_ios</span>
                </button>

                {/* Đèn pin / Flash */}
                {torchSupported && (
                  <button
                    type="button"
                    onClick={toggleTorch}
                    title="Bật/Tắt đèn Flash"
                    className={`w-9 h-9 rounded-full backdrop-blur-md flex items-center justify-center transition-all shadow-md cursor-pointer ${
                      torchActive
                        ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300'
                        : 'bg-slate-900/80 text-white border border-white/10'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {torchActive ? 'flashlight_off' : 'flash_on'}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Reticle Box with Animated Scanning Laser */}
            <div
              className={`relative w-64 h-52 sm:w-72 sm:h-60 z-10 flex items-center justify-center pointer-events-none transition-all duration-300 ${
                isScanSuccessAnim ? 'scale-105' : 'scale-100'
              }`}
            >
              {/* 4 Góc ngắm */}
              <div
                className={`absolute top-0 left-0 w-8 h-8 rounded-tl-xl border-t-4 border-l-4 transition-colors duration-300 ${
                  isScanSuccessAnim
                    ? 'border-emerald-400 shadow-[0_0_16px_rgba(16,185,129,0.9)]'
                    : 'border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.6)]'
                }`}
              ></div>
              <div
                className={`absolute top-0 right-0 w-8 h-8 rounded-tr-xl border-t-4 border-r-4 transition-colors duration-300 ${
                  isScanSuccessAnim
                    ? 'border-emerald-400 shadow-[0_0_16px_rgba(16,185,129,0.9)]'
                    : 'border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.6)]'
                }`}
              ></div>
              <div
                className={`absolute bottom-0 left-0 w-8 h-8 rounded-bl-xl border-b-4 border-l-4 transition-colors duration-300 ${
                  isScanSuccessAnim
                    ? 'border-emerald-400 shadow-[0_0_16px_rgba(16,185,129,0.9)]'
                    : 'border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.6)]'
                }`}
              ></div>
              <div
                className={`absolute bottom-0 right-0 w-8 h-8 rounded-br-xl border-b-4 border-r-4 transition-colors duration-300 ${
                  isScanSuccessAnim
                    ? 'border-emerald-400 shadow-[0_0_16px_rgba(16,185,129,0.9)]'
                    : 'border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.6)]'
                }`}
              ></div>

              {/* Tia Laser Quét chuyển động */}
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_12px_#38bdf8] animate-pulse"></div>

              {/* Hướng dẫn ở giữa */}
              {!detectedPallet && (
                <div className="absolute inset-8 rounded-xl bg-slate-950/20 backdrop-blur-xs flex items-center justify-center p-2 opacity-75">
                  <div className="flex flex-col items-center justify-center text-white gap-1 text-center">
                    <span className="material-symbols-outlined text-[32px] text-blue-300">
                      qr_code_scanner
                    </span>
                    <span className="text-[11px] text-slate-200">
                      Hướng camera vào tem nhãn QR hoặc Barcode
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Scanner Status */}
            <div className="absolute bottom-3 inset-x-4 flex flex-col items-center gap-1 z-20">
              <span className="text-xs text-white bg-slate-950/85 backdrop-blur-md px-3 py-1 rounded-full shadow border border-white/10 font-medium">
                Mã hợp lệ: Bắt đầu bằng K hoặc T (Ví dụ: K01, K11, T01, T02...)
              </span>
            </div>
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
                  className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#004ac6] text-xs font-bold flex items-center gap-1 transition-colors border border-blue-200 cursor-pointer"
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
        <div className="mt-3 p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs flex-shrink-0">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-code-md text-sm font-bold text-slate-900 truncate">
                Đã nhận diện: {detectedPallet.id}
              </span>
              <span className="text-[11px] text-slate-600 truncate">
                Sẵn sàng chọn vị trí đích điều chuyển
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold uppercase flex-shrink-0">
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
          className="w-full h-13 rounded-2xl bg-[#004ac6] hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(0,74,198,0.28)] transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
        >
          <span className="material-symbols-outlined text-[22px]">near_me</span>
          <span>Chọn vị trí đích điều chuyển</span>
          <span className="material-symbols-outlined text-[20px] ml-0.5">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};
