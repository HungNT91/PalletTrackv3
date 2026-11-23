/**
 * Tiện ích nhận diện và phân loại Hộc Rack (Warehouse Rack Slot)
 * Phân biệt chính xác giữa:
 * 1. Các khu vực kho thông thường (Dán Tem, Kho Tạm, Tiền Soạn 1, Tiền Soạn 2, Kho Khuyến Mãi...)
 * 2. 6.241 vị trí hộc giá kệ (Rack Thường - D2..D9 kho 80001010, Rack Cắt Liều - D1 kho 80001030)
 */

/**
 * Danh sách từ khóa các khu vực KHÔNG PHẢI là hộc rack
 */
const NON_RACK_NAME_KEYWORDS = [
  'dán tem',
  'dan tem',
  'kho tạm',
  'kho tam',
  'tiền soạn',
  'tien soan',
  'kho khuyến mãi',
  'khuyến mãi',
  'khuyen mai',
  'khu đệm',
  'khu dem',
  'buffer',
  'sàn bốc dỡ',
  'san boc do',
  'staging',
  'outbound',
];

/**
 * Kiểm tra xem một vị trí có phải là Hộc Rack hay không.
 *
 * @param code Mã vị trí (ví dụ: '80001010_Z1_R1_D2_C1_T3_H1' hoặc '80001001_Z1_R2_D1_C1_T1_H1')
 * @param locationName Tên vị trí (ví dụ: 'Rack Thường', 'Dán Tem', 'Tiền soạn 1 - Kho 1'...)
 */
export const isRackSlotCode = (code?: string | null, locationName?: string | null): boolean => {
  // 1. Kiểm tra theo tên vị trí đích nếu có
  if (locationName) {
    const locLower = locationName.trim().toLowerCase();
    // Nếu tên vị trí thuộc các khu vực chuyên biệt (Dán tem, Kho tạm, Tiền soạn...) => Dứt khoát KHÔNG phải Hộc Rack
    if (NON_RACK_NAME_KEYWORDS.some(kw => locLower.includes(kw))) {
      return false;
    }
    // Nếu tên vị trí chứa từ "rack" (như 'Rack Thường', 'Rack Cắt Liều', 'Hộc Rack'...) => Là Hộc Rack
    if (locLower.includes('rack')) {
      return true;
    }
  }

  if (!code) return false;
  const cleanCode = code.trim().toUpperCase();

  // 2. Loại trừ theo mã kho đặc biệt:
  // - 80001001: Khu vực Dán Tem
  // - 80001020: Khu vực Kho Khuyến Mãi
  if (cleanCode.startsWith('80001001') || cleanCode.startsWith('80001020')) {
    return false;
  }

  // 3. Loại trừ theo Zone phi-rack:
  // - Z2, Z3, Z4, Z5 là các tầng Tiền Soạn của kho 1 & kho 2
  if (/_Z[2-9]_/.test(cleanCode)) {
    return false;
  }

  // 4. Loại trừ Dãy D10 trở lên ở kho 80001010 (D10 là Kho Tạm)
  if (cleanCode.startsWith('80001010') && /_D10_/.test(cleanCode)) {
    return false;
  }

  // 5. Khớp chính xác 6.241 vị trí hộc giá kệ lưu kho:
  // - Nhóm 1: Kho 80001030, Zone 1, Dãy 1 (Rack Cắt Liều)
  const isRackCatLieu =
    cleanCode.startsWith('80001030') && cleanCode.includes('_Z1_') && cleanCode.includes('_D1_');
  if (isRackCatLieu && /_T\d+_H\d+/i.test(cleanCode)) {
    return true;
  }

  // - Nhóm 2: Kho 80001010, Zone 1, Dãy D2 đến D9 (Rack Thường)
  const isRackThuong =
    cleanCode.startsWith('80001010') && cleanCode.includes('_Z1_') && /_D[2-9]_/.test(cleanCode);
  if (isRackThuong && /_T\d+_H\d+/i.test(cleanCode)) {
    return true;
  }

  // - Nhóm 3: Mã có chứa tiền tố/hậu tố RACK rõ ràng
  if (cleanCode.includes('RACK') && /_T\d+_H\d+/i.test(cleanCode)) {
    return true;
  }

  return false;
};

/**
 * Phân loại tên nhóm khu vực cha của hộc rack:
 * - Kho 80001030 hoặc Dãy 1 (D1) => 'Rack Cắt Liều'
 * - Kho 80001010 hoặc Dãy 2..9 (D2..D9) => 'Rack Thường'
 * - Mặc định => 'Hộc Rack'
 */
export const getRackCategoryName = (code?: string | null, locationName?: string | null): string => {
  if (locationName && !locationName.toUpperCase().includes('800010')) {
    const locLower = locationName.trim().toLowerCase();
    if (locLower.includes('cắt liều') || locLower.includes('cat lieu')) return 'Rack Cắt Liều';
    if (locLower.includes('thường') || locLower.includes('thuong')) return 'Rack Thường';
    if (locLower.includes('rack')) return locationName;
  }

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
