import React, { useState } from 'react';
import { WarehouseLocation } from '../types';

export interface ImportItem {
  palletId: string;
  destinationCode: string;
  destinationName: string;
  driver?: string;
  notes?: string;
  isValid: boolean;
  errorReason?: string;
}

interface BulkImportTabProps {
  locations?: WarehouseLocation[];
  onBatchImport: (items: Array<{
    palletId: string;
    destination: string;
    destinationCode?: string;
    driver?: string;
    notes?: string;
  }>) => Promise<void>;
  onSuccessNavigate: () => void;
}

export const BulkImportTab: React.FC<BulkImportTabProps> = ({
  locations = [],
  onBatchImport,
  onSuccessNavigate,
}) => {
  const [fileName, setFileName] = useState<string>('');
  const [items, setItems] = useState<ImportItem[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Tải tệp CSV mẫu chuẩn hóa theo Supabase Database
  const handleDownloadSample = () => {
    // Thêm UTF-8 BOM (\uFEFF) để Excel hiển thị tiếng Việt có dấu chuẩn 100% không bị lỗi font
    const csvHeader = 'Mã Pallet,Mã Vị Trí Đích,Tên Vị Trí Đích,Tài Xế,Ghi Chú\r\n';
    const sampleRows = [
      'K01,TS-01,Khu trung chuyển TS-01,Trần Minh,Lô hàng ưu tiên ca sáng',
      'K02,RK-01,Kệ hàng Zone A - RK01,Lê Hữu Hoàng,Chờ xe nâng xếp kệ cao',
      'T01,TS-02,Khu trung chuyển TS-02,Võ Quốc Anh,Kiện hàng linh kiện điện tử',
      'T02,BF-01,Đệm xuất hàng BF-01,Nguyễn Tùng,Tạm lưu chờ phân luồng',
      'K03,TS-01,Khu trung chuyển TS-01,Trần Minh,Kiện hàng xuất nhanh',
      'T03,RK-02,Kệ hàng Zone B - RK02,Lê Hữu Hoàng,Hàng đóng thùng carton',
    ].join('\r\n');

    const blob = new Blob(['\uFEFF' + csvHeader + sampleRows], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'MAU_NHAP_DIEU_CHUYEN_PALLET.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 2. Phân tích tệp CSV thực tế khi người dùng chọn file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const text = event.target?.result as string;
        if (!text) {
          setErrorMessage('Tệp tải lên rỗng!');
          setItems([]);
          return;
        }

        const lines = text
          .split(/\r?\n/)
          .map(l => l.trim())
          .filter(l => l.length > 0);

        if (lines.length <= 1) {
          setErrorMessage('Tệp CSV chỉ có dòng tiêu đề hoặc không chứa dữ liệu!');
          setItems([]);
          return;
        }

        // Tự động phát hiện dấu phân cách (dấu phẩy , hoặc chấm phẩy ; hoặc tab \t)
        const headerLine = lines[0];
        let delimiter = ',';
        if (headerLine.includes(';') && !headerLine.includes(',')) delimiter = ';';
        else if (headerLine.includes('\t')) delimiter = '\t';

        const headers = headerLine.split(delimiter).map(h => h.trim().toLowerCase().replace(/["']/g, ''));

        // Tìm chỉ số các cột
        const palletIdx = headers.findIndex(h => h.includes('pallet') || h.includes('ma'));
        const destCodeIdx = headers.findIndex(h => h.includes('ma_vi_tri') || h.includes('mã vị trí') || h.includes('dest_code') || h.includes('code'));
        const destNameIdx = headers.findIndex(h => h.includes('ten_vi_tri') || h.includes('tên vị trí') || h.includes('dich') || h.includes('đích') || h.includes('location'));
        const driverIdx = headers.findIndex(h => h.includes('tai_xe') || h.includes('tài xế') || h.includes('driver') || h.includes('nguoi'));
        const notesIdx = headers.findIndex(h => h.includes('ghi_chu') || h.includes('ghi chú') || h.includes('note'));

        const parsedItems: ImportItem[] = [];

        for (let i = 1; i < lines.length; i++) {
          const row = lines[i].split(delimiter).map(cell => cell.trim().replace(/^["']|["']$/g, ''));
          if (row.length === 0 || row.every(c => c === '')) continue;

          const rawPallet = (palletIdx >= 0 && row[palletIdx]) ? row[palletIdx] : row[0] || '';
          const palletId = rawPallet.trim().toUpperCase();

          const rawDestCode = (destCodeIdx >= 0 && row[destCodeIdx]) ? row[destCodeIdx] : (destNameIdx >= 0 ? '' : row[1] || 'TS-01');
          const rawDestName = (destNameIdx >= 0 && row[destNameIdx]) ? row[destNameIdx] : (destCodeIdx >= 0 ? '' : row[1] || 'Khu trung chuyển TS-01');
          const driver = (driverIdx >= 0 && row[driverIdx]) ? row[driverIdx] : (row[3] || 'Trần Minh');
          const notes = (notesIdx >= 0 && row[notesIdx]) ? row[notesIdx] : (row[4] || '');

          // Khớp vị trí từ danh mục Supabase nếu có
          let matchedLoc = locations.find(
            l =>
              l.code.toUpperCase() === rawDestCode.toUpperCase() ||
              l.name.toLowerCase() === rawDestName.toLowerCase() ||
              l.name.toLowerCase().includes(rawDestName.toLowerCase())
          );

          const finalDestCode = rawDestCode || (matchedLoc ? matchedLoc.code : 'TS-01');
          const finalDestName = rawDestName || (matchedLoc ? matchedLoc.name : finalDestCode);

          // Kiểm tra tính hợp lệ của mã Pallet (chuẩn K... hoặc T...)
          let isValid = true;
          let errorReason = '';

          if (!palletId) {
            isValid = false;
            errorReason = 'Thiếu mã Pallet';
          } else if (!/^[KT]\d+$/.test(palletId) && !palletId.startsWith('PLT-')) {
            isValid = false;
            errorReason = 'Mã Pallet phải bắt đầu bằng K hoặc T (VD: K01, T02)';
          }

          parsedItems.push({
            palletId,
            destinationCode: finalDestCode,
            destinationName: finalDestName,
            driver,
            notes,
            isValid,
            errorReason,
          });
        }

        if (parsedItems.length === 0) {
          setErrorMessage('Không tìm thấy dòng dữ liệu nào hợp lệ trong tệp!');
        }

        setItems(parsedItems);
      } catch (err: any) {
        setErrorMessage('Lỗi khi đọc file CSV: ' + err.message);
      }
    };

    reader.readAsText(file, 'UTF-8');
  };

  // 3. Xác nhận nạp danh sách hợp lệ vào Supabase
  const handleConfirmImport = async () => {
    const validItems = items.filter(i => i.isValid);
    if (validItems.length === 0) {
      setErrorMessage('Không có dòng nào hợp lệ để nhập vào hệ thống!');
      return;
    }

    try {
      setIsUploading(true);
      setErrorMessage(null);

      await onBatchImport(
        validItems.map(i => ({
          palletId: i.palletId,
          destination: i.destinationName,
          destinationCode: i.destinationCode,
          driver: i.driver,
          notes: i.notes,
        }))
      );

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onSuccessNavigate();
      }, 1500);
    } catch (err: any) {
      setErrorMessage('Lỗi khi nạp dữ liệu vào Supabase: ' + (err.message || 'Lỗi không xác định'));
    } finally {
      setIsUploading(false);
    }
  };

  const validCount = items.filter(i => i.isValid).length;
  const invalidCount = items.filter(i => !i.isValid).length;

  return (
    <div className="flex flex-col w-full px-3 sm:px-4 max-w-2xl mx-auto pb-14 pt-1 sm:pt-2 touch-pan-y">
      {/* Header Phân quyền Quản lý kho */}
      <div className="flex flex-col space-y-1 mt-1 sm:mt-2">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md bg-blue-50 text-[#004ac6] font-code-md text-[11px] sm:text-xs uppercase tracking-wider font-bold border border-blue-200">
            QUẢN TRỊ VIÊN // NHẬP FILE HÀNG LOẠT
          </span>
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-code-md text-[10px] sm:text-[11px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            ĐỒNG BỘ SUPABASE DB
          </span>
        </div>
        <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight pt-1">
          Nạp danh sách Pallet & Lệnh điều chuyển
        </h1>
        <p className="text-[11px] sm:text-xs text-slate-500">
          Chức năng dành cho Quản lý kho để nhập danh sách từ tệp Excel / CSV trực tiếp vào cơ sở dữ liệu Supabase.
        </p>
      </div>

      {/* Thông báo lỗi nếu có */}
      {errorMessage && (
        <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-rose-600 flex-shrink-0">
            error
          </span>
          <span className="font-medium leading-tight">{errorMessage}</span>
        </div>
      )}

      {/* Upload Dropzone */}
      <div className="relative rounded-2xl bg-white p-4 border border-slate-200 shadow-sm mt-3">
        <div className="flex flex-col items-center justify-center py-6 px-4 text-center space-y-3 rounded-xl border-2 border-dashed border-[#004ac6]/25 bg-blue-50/30 hover:bg-blue-50/50 transition-colors">
          <div className="relative w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-[#004ac6] shadow-sm border border-slate-200">
            <span className="material-symbols-outlined text-[30px]">upload_file</span>
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[10px] font-bold">check</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-sm font-bold text-slate-900 block">
              Chọn tệp bảng tính Pallet để nạp vào Database
            </span>
            <p className="text-xs text-slate-500">
              Định dạng hỗ trợ: <span className="text-[#004ac6] font-code-md font-bold bg-blue-100/60 px-1.5 py-0.5 rounded">.CSV</span>,{' '}
              <span className="text-[#004ac6] font-code-md font-bold bg-blue-100/60 px-1.5 py-0.5 rounded">.TXT</span> (Mã hóa UTF-8)
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1 w-full max-w-xs">
            <label className="flex-1 h-11 rounded-xl bg-white hover:bg-slate-50 text-[#004ac6] border border-[#004ac6]/30 shadow-xs active:scale-[0.98] text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer">
              <span className="material-symbols-outlined text-[18px]">folder_open</span>
              <span>Chọn file từ máy</span>
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={handleDownloadSample}
              className="h-11 px-3.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#004ac6] text-xs font-bold border border-blue-200 flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs"
              title="Tải file mẫu CSV tương thích Supabase"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span className="font-code-md text-[11px]">Tải file mẫu</span>
            </button>
          </div>
        </div>

        {/* Thông tin tệp vừa tải */}
        {fileName && (
          <div className="mt-3 rounded-xl bg-slate-50 border border-slate-200 p-3 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[#004ac6] flex-shrink-0 shadow-xs">
                <span className="material-symbols-outlined text-[20px]">table_view</span>
              </div>
              <div className="min-w-0">
                <div className="font-code-md text-xs font-bold text-slate-900 truncate">
                  {fileName}
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  Tổng số: {items.length} dòng • Hợp lệ: {validCount} • Lỗi: {invalidCount}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-code-md text-[11px] uppercase font-bold">
                ĐÃ PHÂN TÍCH
              </span>
              <button
                type="button"
                onClick={() => {
                  setFileName('');
                  setItems([]);
                }}
                aria-label="Xóa file"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Cấu trúc dữ liệu yêu cầu theo Supabase */}
      <div className="rounded-2xl bg-white p-4 space-y-2 border border-slate-200 shadow-sm mt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#004ac6] text-[18px]">schema</span>
            <span className="text-xs font-bold text-slate-900">
              Quy chuẩn cột dữ liệu Supabase
            </span>
          </div>
          <button
            type="button"
            onClick={handleDownloadSample}
            className="text-xs text-[#004ac6] hover:underline flex items-center gap-0.5 font-semibold cursor-pointer"
          >
            <span>Tải file mẫu (.csv)</span>
            <span className="material-symbols-outlined text-[14px]">file_download</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="font-code-md text-xs text-[#004ac6] font-bold">Mã Pallet</span>
              <span className="text-[9px] uppercase px-1 rounded bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                Bắt buộc
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">VD: K01, K02, T01</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="font-code-md text-xs text-[#004ac6] font-bold">Mã Vị Trí</span>
              <span className="text-[9px] uppercase px-1 rounded bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                Bắt buộc
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">VD: TS-01, RK-01</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="font-code-md text-xs text-[#004ac6] font-bold">Tài Xế</span>
              <span className="text-[9px] uppercase px-1 rounded bg-slate-200 text-slate-700 font-medium">
                Tùy chọn
              </span>
            </div>
            <span className="text-[11px] text-slate-500">VD: Trần Minh</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="font-code-md text-xs text-[#004ac6] font-bold">Ghi Chú</span>
              <span className="text-[9px] uppercase px-1 rounded bg-slate-200 text-slate-700 font-medium">
                Tùy chọn
              </span>
            </div>
            <span className="text-[11px] text-slate-500">Ưu tiên, hàng khô...</span>
          </div>
        </div>
      </div>

      {/* Xem trước dữ liệu */}
      {items.length > 0 && (
        <div className="rounded-2xl bg-white p-4 space-y-2.5 border border-slate-200 shadow-sm mt-3">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[19px] text-[#004ac6]">preview</span>
              <span className="text-xs font-bold text-slate-900">Xem trước danh sách ({items.length} kiện)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                {validCount} hợp lệ
              </span>
              {invalidCount > 0 && (
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                  {invalidCount} lỗi
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {items.map((item, idx) => (
              <div
                key={idx}
                className={`rounded-xl border p-3 flex flex-col space-y-1.5 shadow-xs transition-colors ${
                  item.isValid
                    ? 'bg-white border-slate-200 hover:border-[#004ac6]/40'
                    : 'bg-rose-50/50 border-rose-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-code-md text-sm text-[#004ac6] font-bold tracking-tight">
                      {item.palletId || '(Trống)'}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-semibold flex items-center gap-1 border border-slate-200">
                      <span className="material-symbols-outlined text-[13px] text-[#004ac6]">
                        location_on
                      </span>
                      {item.destinationCode} - {item.destinationName}
                    </span>
                  </div>

                  {item.isValid ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-code-md text-[10px] uppercase font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px] font-bold">check_circle</span>
                      Hợp lệ
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-code-md text-[10px] uppercase font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px] font-bold">error</span>
                      {item.errorReason}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-0.5 border-t border-slate-100">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-slate-400">person</span>
                    <span className="text-slate-800 font-medium">{item.driver || 'Chưa gán'}</span>
                  </div>
                  {item.notes && (
                    <div className="flex items-center gap-1 truncate max-w-[60%]">
                      <span className="material-symbols-outlined text-[14px]">edit_note</span>
                      <span className="truncate">{item.notes}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nút hành động */}
      <div className="pt-4">
        <button
          type="button"
          disabled={isUploading || validCount === 0}
          onClick={handleConfirmImport}
          className={`w-full min-h-[52px] rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] cursor-pointer disabled:opacity-40 disabled:pointer-events-none ${
            isSuccess ? 'bg-emerald-600 text-white' : 'neu-button text-white'
          }`}
        >
          {isUploading ? (
            <>
              <span className="material-symbols-outlined text-[22px] animate-spin">progress_activity</span>
              <span>Đang lưu {validCount} thẻ vào Supabase Database...</span>
            </>
          ) : isSuccess ? (
            <>
              <span className="material-symbols-outlined text-[22px]">check_circle</span>
              <span>Đã lưu thành công {validCount} thẻ vào Supabase!</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[22px]">cloud_upload</span>
              <span>
                {validCount > 0
                  ? `Xác nhận lưu ${validCount} thẻ vào Database Supabase`
                  : 'Vui lòng chọn tệp CSV để tiếp tục'}
              </span>
            </>
          )}
        </button>

        <div className="flex items-center justify-center gap-1.5 pt-2 text-slate-500 text-xs">
          <span className="material-symbols-outlined text-[15px] text-emerald-600">verified_user</span>
          <span>Dữ liệu được ghi trực tiếp vào các bảng pallets, transfer_cards và audit_logs</span>
        </div>
      </div>
    </div>
  );
};
