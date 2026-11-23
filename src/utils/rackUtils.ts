/**
 * Tiện ích nhận diện và phân loại Hộc Rack (Warehouse Rack Slot)
 * Hỗ trợ nhận diện tự động 6.241+ vị trí hộc rack lưu kho:
 * Ví dụ định dạng:
 * - 80001030_Z1_R1_D1_C1_T3_H1 (Rack Cắt Liều)
 * - 80001010_Z1_R1_D2_C1_T3_H1 (Rack Thường)
 * - 80001010_Z1_D2_C1_T2_H1 (Rack Thường rút gọn)
 */

/**
 * Kiểm tra xem một mã vị trí có phải là mã hộc rack chi tiết hay không.
 * Tiêu chí:
 * - Chứa toạ độ Tầng & Hộc dạng _T{số}_H{số} ở cuối hoặc giữa chuỗi
 * - Hoặc chứa toạ độ Dãy - Cột - Tầng - Hộc: _D{số}_C{số}_T{số}_H{số}
 */
export const isRackSlotCode = (code?: string | null): boolean => {
  if (!code) return false;
  const cleanCode = code.trim().toUpperCase();

  return (
    /_T\d+_H\d+$/i.test(cleanCode) ||
    /_D\d+_C\d+_T\d+_H\d+/i.test(cleanCode) ||
    /^(80001010|80001030|[A-Z0-9]+)_Z\d+.*_T\d+_H\d+$/i.test(cleanCode)
  );
};

/**
 * Phân loại tên nhóm khu vực cha của hộc rack dựa trên mã kho hoặc dãy:
 * - Kho 80001030 hoặc Dãy 1 (D1) => 'Rack Cắt Liều'
 * - Kho 80001010 hoặc Dãy 2..9 (D2..D9) => 'Rack Thường'
 * - Mặc định => 'Hộc Rack'
 */
export const getRackCategoryName = (code?: string | null): string => {
  if (!code) return 'Hộc Rack';
  const cleanCode = code.trim().toUpperCase();

  if (cleanCode.startsWith('80001030') || cleanCode.includes('_D1_')) {
    return 'Rack Cắt Liều';
  }

  if (cleanCode.startsWith('80001010') || /_D[2-9]_/.test(cleanCode)) {
    return 'Rack Thường';
  }

  return 'Hộc Rack';
};

/**
 * Trích xuất toạ độ ngắn gọn để hiển thị trực quan cho nhân viên:
 * Ví dụ: "80001010_Z1_R1_D2_C1_T3_H1" => "D2-C1-T3-H1"
 */
export const extractRackCoordinates = (code?: string | null): string => {
  if (!code) return '';
  const match = code.match(/D(\d+)_C(\d+)_T(\d+)_H(\d+)/i);
  if (match) {
    const [, d, c, t, h] = match;
    return `D${d}-C${c}-T${t}-H${h}`;
  }
  return code;
};
