import React, { useState } from 'react';

interface ImportItem {
  palletId: string;
  destination: string;
  quantity: number;
  notes: string;
  isValid: boolean;
}

const DEFAULT_PREVIEW_ITEMS: ImportItem[] = [
  {
    palletId: 'PLT-8840',
    destination: 'Rack B-02',
    quantity: 60,
    notes: 'Đã kiểm định',
    isValid: true,
  },
  {
    palletId: 'PLT-8841',
    destination: 'Tiền soạn 1',
    quantity: 32,
    notes: 'Hàng ưu tiên',
    isValid: true,
  },
  {
    palletId: 'PLT-8842',
    destination: 'Tiền soạn 2',
    quantity: 40,
    notes: 'Hàng khô',
    isValid: true,
  },
  {
    palletId: 'PLT-8843',
    destination: 'Rack A-11',
    quantity: 18,
    notes: 'Cần xe nâng cao',
    isValid: true,
  },
  {
    palletId: 'PLT-8844',
    destination: 'Tiền soạn 1',
    quantity: 45,
    notes: 'Lô gia dụng',
    isValid: true,
  },
  {
    palletId: 'PLT-8845',
    destination: 'Khu đệm nhập',
    quantity: 24,
    notes: 'Chờ dán tem phụ',
    isValid: true,
  },
];

interface BulkImportTabProps {
  onBatchImport: (items: Array<{ palletId: string; destination: string; quantity: number; notes: string }>) => Promise<void>;
  onSuccessNavigate: () => void;
}

export const BulkImportTab: React.FC<BulkImportTabProps> = ({
  onBatchImport,
  onSuccessNavigate,
}) => {
  const [fileName, setFileName] = useState<string>('PALLET_SHIFT_A_20241026.xlsx');
  const [items, setItems] = useState<ImportItem[]>(DEFAULT_PREVIEW_ITEMS);
  const [autoCreateQueue, setAutoCreateQueue] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const handleDownloadSample = () => {
    // Generate CSV template for the user
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Ma_Pallet,Vi_Tri_Dich,So_Luong,Ghi_Chu\n' +
      'PLT-8840,Rack B-02,60,Đã kiểm định\n' +
      'PLT-8841,Tiền soạn 1,32,Hàng ưu tiên\n' +
      'PLT-8842,Tiền soạn 2,40,Hàng khô\n' +
      'PLT-8843,Rack A-11,18,Cần xe nâng cao\n' +
      'PLT-8844,Tiền soạn 1,45,Lô gia dụng\n' +
      'PLT-8845,Khu đệm nhập,24,Chờ dán tem phụ';

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'MAU_DIEU_CHUYEN_PALLET_WH01.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      // Generate parsed preview
      const simulatedItems: ImportItem[] = [
        {
          palletId: `PLT-${Math.floor(1000 + Math.random() * 9000)}`,
          destination: 'Tiền soạn 1',
          quantity: 48,
          notes: 'Nạp từ ' + file.name,
          isValid: true,
        },
        {
          palletId: `PLT-${Math.floor(1000 + Math.random() * 9000)}`,
          destination: 'Rack A-04',
          quantity: 36,
          notes: 'Ưu tiên xuất ca sớm',
          isValid: true,
        },
        {
          palletId: `PLT-${Math.floor(1000 + Math.random() * 9000)}`,
          destination: 'Tiền soạn 2',
          quantity: 50,
          notes: 'Hàng linh kiện',
          isValid: true,
        },
        {
          palletId: `PLT-${Math.floor(1000 + Math.random() * 9000)}`,
          destination: 'Khu đệm nhập',
          quantity: 20,
          notes: 'Phân luồng kiểm đếm',
          isValid: true,
        },
      ];
      setItems(simulatedItems);
    }
  };

  const handleConfirmImport = async () => {
    try {
      setIsUploading(true);
      await onBatchImport(
        items.map(i => ({
          palletId: i.palletId,
          destination: i.destination,
          quantity: i.quantity,
          notes: i.notes,
        }))
      );
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onSuccessNavigate();
      }, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col w-full px-3 sm:px-4 max-w-2xl mx-auto pb-14 pt-1 sm:pt-2 touch-pan-y">
      {/* Operational Header Badge */}
      <div className="flex flex-col space-y-1 mt-1 sm:mt-2">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md bg-blue-50 text-[#004ac6] font-code-md text-[11px] sm:text-xs uppercase tracking-wider font-bold border border-blue-200">
            MODULE // BULK-INGEST
          </span>
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-code-md text-[10px] sm:text-[11px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            SẴN SÀNG ĐỌC FILE
          </span>
        </div>
        <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight pt-1">
          Tải lên danh sách Pallet & Vị trí đích
        </h1>
        <p className="text-[11px] sm:text-xs text-slate-500">
          Nạp nhanh tệp điều phối lưu kho vào hàng đợi trung tâm để tự động phân luồng xe nâng.
        </p>
      </div>

      {/* Neumorphic Upload Dropzone */}
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
              Chạm để tải tệp hoặc kéo thả
            </span>
            <p className="text-xs text-slate-500">
              Định dạng <span className="text-[#004ac6] font-code-md font-bold bg-blue-100/60 px-1.5 py-0.5 rounded">.XLSX</span>,{' '}
              <span className="text-[#004ac6] font-code-md font-bold bg-blue-100/60 px-1.5 py-0.5 rounded">.CSV</span> (Tối đa 15MB)
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1 w-full max-w-xs">
            <label className="flex-1 h-11 rounded-xl bg-white hover:bg-slate-50 text-[#004ac6] border border-[#004ac6]/30 shadow-xs active:scale-[0.98] text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer">
              <span className="material-symbols-outlined text-[18px]">folder_open</span>
              <span>Chọn file từ máy</span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={handleDownloadSample}
              className="h-11 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-200 flex items-center justify-center gap-1 transition-all"
              title="Tải file mẫu Excel"
            >
              <span className="material-symbols-outlined text-[18px] text-[#004ac6]">download</span>
              <span className="font-code-md text-[11px] font-bold">Mẫu .CSV</span>
            </button>
          </div>
        </div>

        {/* Active Loaded File Pill */}
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
                  42.8 KB • {items.length} hàng hợp lệ
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-code-md text-[11px] uppercase font-bold">
                ĐÃ NẠP
              </span>
              <button
                type="button"
                onClick={() => setFileName('')}
                aria-label="Xóa file"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Specification Schema Hint Card */}
      <div className="rounded-2xl bg-white p-4 space-y-2 border border-slate-200 shadow-sm mt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#004ac6] text-[18px]">schema</span>
            <span className="text-xs font-bold text-slate-900">
              Cấu trúc 4 cột dữ liệu yêu cầu
            </span>
          </div>
          <button
            type="button"
            onClick={handleDownloadSample}
            className="text-xs text-[#004ac6] hover:underline flex items-center gap-0.5 font-semibold"
          >
            <span>Tải file mẫu Excel (.csv)</span>
            <span className="material-symbols-outlined text-[14px]">file_download</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="font-code-md text-xs text-[#004ac6] font-bold">[Mã Pallet]</span>
              <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200 font-code-md font-bold">
                Bắt buộc
              </span>
            </div>
            <span className="text-[11px] text-slate-500">VD: PLT-8840 (Text)</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="font-code-md text-xs text-[#004ac6] font-bold">[Vị trí đích]</span>
              <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200 font-code-md font-bold">
                Bắt buộc
              </span>
            </div>
            <span className="text-[11px] text-slate-500">VD: Rack B-02 / Tiền soạn</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="font-code-md text-xs text-[#004ac6] font-bold">[Số lượng]</span>
              <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-blue-50 text-[#004ac6] border border-blue-200 font-code-md font-bold">
                Số kiện
              </span>
            </div>
            <span className="text-[11px] text-slate-500">VD: 60 (Số nguyên &gt; 0)</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="font-code-md text-xs text-[#004ac6] font-bold">[Ghi chú]</span>
              <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-code-md font-semibold">
                Tùy chọn
              </span>
            </div>
            <span className="text-[11px] text-slate-500">Ưu tiên, hàng dễ vỡ...</span>
          </div>
        </div>
      </div>

      {/* Data Preview Section */}
      <div className="rounded-2xl bg-white p-4 space-y-2.5 border border-slate-200 shadow-sm mt-3">
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[19px] text-[#004ac6]">preview</span>
            <span className="text-xs font-bold text-slate-900">Xem trước dữ liệu</span>
          </div>
          <span className="text-xs text-slate-600 font-code-md bg-slate-100 px-2 py-0.5 rounded-md font-medium">
            Hiển thị {items.length} hàng hợp lệ
          </span>
        </div>

        <div className="space-y-2">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="rounded-xl bg-white border border-slate-200 p-3 flex flex-col space-y-2 shadow-xs hover:border-[#004ac6]/40 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-code-md text-sm text-[#004ac6] font-bold tracking-tight">
                    {item.palletId}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-semibold flex items-center gap-1 border border-slate-200">
                    <span className="material-symbols-outlined text-[13px] text-[#004ac6]">
                      location_on
                    </span>
                    {item.destination}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-code-md text-[11px] uppercase font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px] font-bold">check_circle</span>
                  Hợp lệ
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-0.5 border-t border-slate-100">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-slate-400">inventory_2</span>
                  <span className="text-slate-800 font-bold">{item.quantity}</span> thùng
                </div>
                <div className="flex items-center gap-1 truncate max-w-[55%]">
                  <span className="material-symbols-outlined text-[14px]">edit_note</span>
                  <span className="truncate">{item.notes}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Operational Configuration Toggle */}
      <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-sm mt-3">
        <label className="flex items-center justify-between cursor-pointer select-none">
          <div className="flex items-center gap-3 pr-2 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#004ac6] flex-shrink-0 shadow-xs">
              <span className="material-symbols-outlined text-[22px]">auto_mode</span>
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-900 block leading-tight">
                Tự động tạo thẻ ở trạng thái chờ
              </span>
              <span className="text-[11px] text-slate-500 block leading-snug pt-0.5">
                Phát sinh task điều phối ngay sau khi hoàn tất nạp dữ liệu
              </span>
            </div>
          </div>

          <div className="relative flex-shrink-0">
            <input
              type="checkbox"
              checked={autoCreateQueue}
              onChange={e => setAutoCreateQueue(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-12 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-xs peer-checked:bg-[#004ac6]"></div>
          </div>
        </label>
      </div>

      {/* Prime Action Button */}
      <div className="pt-3">
        <button
          type="button"
          disabled={isUploading}
          onClick={handleConfirmImport}
          className={`w-full min-h-[52px] rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] ${
            isSuccess
              ? 'bg-emerald-600 text-white'
              : 'neu-button text-white'
          }`}
        >
          {isUploading ? (
            <>
              <span className="material-symbols-outlined text-[22px] animate-spin">progress_activity</span>
              <span>Đang tạo {items.length} thẻ chờ vào hệ thống...</span>
            </>
          ) : isSuccess ? (
            <>
              <span className="material-symbols-outlined text-[22px]">check_circle</span>
              <span>Đã nạp {items.length} thẻ thành công vào máy chủ!</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[22px]">cloud_sync</span>
              <span>Xác nhận tạo {items.length} thẻ chờ từ file</span>
            </>
          )}
        </button>

        <div className="flex items-center justify-center gap-1.5 pt-2 text-slate-500 text-xs">
          <span className="material-symbols-outlined text-[15px] text-emerald-600">security</span>
          <span>Đã kiểm tra đối soát trùng lặp mã Barcode trên hệ thống</span>
        </div>
      </div>
    </div>
  );
};
