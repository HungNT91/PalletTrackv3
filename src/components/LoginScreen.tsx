import React, { useState } from 'react';
import { ShiftSession } from '../types';
import { wmsApi } from '../api/wmsApi';

interface LoginScreenProps {
  onLogin: (session: ShiftSession) => Promise<void> | void;
  initialOperatorCode?: string;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  initialOperatorCode = '',
}) => {
  const [operatorCode, setOperatorCode] = useState(initialOperatorCode);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = operatorCode.trim().toUpperCase();

    if (!cleanCode) {
      setErrorMessage('Vui lòng nhập mã nhân viên');
      return;
    }

    if (!password) {
      setErrorMessage('Vui lòng nhập mật khẩu');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      // Xác thực đăng nhập qua Supabase Database / LocalStore
      const emp = await wmsApi.loginEmployee(cleanCode, password);
      if (!emp) {
        setErrorMessage('Mã nhân viên hoặc mật khẩu không chính xác!');
        setIsSubmitting(false);
        return;
      }

      const now = new Date();
      const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

      const session: ShiftSession = {
        operatorCode: emp.code,
        operatorName: emp.name,
        station: `WH-01 • Kho A (${emp.role})`,
        deviceId: 'Thiết bị cầm tay PDA WMS',
        shiftName: 'Ca làm việc tiêu chuẩn',
        loginTime: timeStr,
        status: 'online',
        ipAddress: '192.168.1.104',
        pingMs: 12,
      };

      await onLogin(session);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Lỗi khi đăng nhập vào hệ thống');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center px-4 py-8 relative select-none">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Login Card */}
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 relative z-10">
        {/* Logo & Title */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#004ac6] to-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-900/20 mb-3">
            <span className="material-symbols-outlined text-[32px]">pallet</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            PalletTrack <span className="text-[#004ac6]">WMS</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Đăng nhập hệ thống điều phối & đối soát pallet
          </p>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="mb-4 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-rose-600">error</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Streamlined Form: Only Operator Code and Password */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Mã nhân viên */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">Mã nhân viên</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[19px]">
                badge
              </span>
              <input
                type="text"
                required
                autoFocus
                value={operatorCode}
                onChange={e => {
                  setOperatorCode(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Nhập mã nhân viên..."
                className="w-full h-11 pl-10 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-code-md font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#004ac6] transition-all uppercase"
              />
            </div>
          </div>

          {/* Mật khẩu */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">Mật khẩu</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[19px]">
                lock
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Nhập mật khẩu"
                className="w-full h-11 pl-10 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs font-code-md text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#004ac6] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                tabIndex={-1}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 rounded-xl neu-button text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all disabled:opacity-50 mt-1 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">
                  progress_activity
                </span>
                <span>Đang đăng nhập...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">login</span>
                <span>Đăng nhập</span>
              </>
            )}
          </button>
        </form>

        {/* Small footer note */}
        <div className="mt-5 pt-4 border-t border-slate-100 text-center">
          <span className="text-[11px] text-slate-400">
            Hệ thống tự động duy trì phiên làm việc trên thiết bị này
          </span>
        </div>
      </div>
    </div>
  );
};
