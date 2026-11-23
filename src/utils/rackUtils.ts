/**
 * Tiện ích nhận diện và phân loại Hộc Rack (Warehouse Rack Slot)
 * Phân biệt chính xác giữa:
 * 1. Các vị trí tổng cố định trong warehouse_locations:
 *    - Dán Tem, Kho Tạm, Tiền Soạn 1, Tiền Soạn 2, Kho Khuyến Mãi
 *    - RACK THƯỜNG (80001010_Z1_R1_D2_C1_T2_H1)
 *    - RACK CẮT LIỀU (80001030_Z1_R1_D1_C1_T2_H1)
 * 2. 6.241 vị trí toạ độ hộc giá kệ chi tiết (Hộc Rack)
 */

/**
 * Danh sách mã của các vị trí tổng cố định trong warehouse_locations.
 * Không vị trí nào trong danh sách này là "Hộc Rack".
 */
export const MASTER_LOCATION_CODES = [
  '80001001_Z1_R2_D1_C1_T1_H1', // Dán Tem
  '80001010_Z1_R1_D10_C1_T1_H1', // Kho Tạm
  '80001010_Z2_R1_D1_C1_T1_H1', // Tiền soạn 1 - Kho 1
  '80001010_Z2_R1_D8_C2_T1_H1', // Tiền Soạn 1 - Kho 1 - T4
  '80001010_Z3_R1_D1_C1_T1_H1', // Tiền soạn 1 - Kho 2
  '80001010_Z3_R1_D10_C1_T1_H1', // Tiền Soạn 1 - Kho 2 - T4
  '80001010_Z4_R1_D1_C2_T1_H1', // Tiền soạn 2 - Kho 1
  '80001010_Z5_R1_D1_C1_T1_H1', // Tiền soạn 2 - Kho 2
  '80001020_Z1_R1_D1_C1_T1_H5', // Kho Khuyến Mãi
  '80001030_Z2_R1_D1_C10_T1_H1', // Tiền Soạn 1 - Kho 2 - CL
  '80001030_Z3_R1_D17_C2_T1_H1', // Tiền Soạn 2  - Kho 2 - CL
  '80001010_Z1_R1_D2_C1_T2_H1', // Rack Thường (Vị trí tổng cố định - KHÔNG phải hộc rack)
  '80001030_Z1_R1_D1_C1_T2_H1', // Rack Cắt Liều (Vị trí tổng cố định - KHÔNG phải hộc rack)
  'RACK-01',
  'RACK-02',
  'TS-01',
  'TS-02',
];

/**
 * Xóa dấu tiếng Việt và chuẩn hóa chữ thường để so sánh an toàn mọi bảng mã (NFC / NFD)
 */
const removeVietnameseTones = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
};

/**
 * Kiểm tra xem một vị trí có phải là Hộc Rack hay không.
 *
 * @param code Mã vị trí
 * @param locationName Tên vị trí
 */
export const isRackSlotCode = (code?: string | null, locationName?: string | null): boolean => {
  // 1. Kiểm tra theo tên vị trí:
  if (locationName) {
    const locClean = removeVietnameseTones(locationName);
    // Tuyệt đối loại trừ các vị trí tổng cố định:
    if (
      locClean.includes('rack thuong') ||
      locClean.includes('rack cat lieu') ||
      locClean.includes('dan tem') ||
      locClean.includes('kho tam') ||
      locClean.includes('tien soan') ||
      locClean.includes('khuyen mai') ||
      locClean.includes('khu dem') ||
      locClean.includes('buffer') ||
      locClean.includes('san boc do') ||
      locClean.includes('staging') ||
      locClean.includes('outbound')
    ) {
      return false;
    }
    // Nếu tên vị trí ghi rõ là "Hộc Rack" => Là Hộc Rack
    if (locClean === 'hoc rack') {
      return true;
    }
  }

  if (!code) return false;
  const cleanCode = code.trim().toUpperCase();

  // 2. Tuyệt đối loại trừ theo mã của các vị trí tổng cố định trong DB:
  if (
    cleanCode === '80001010_Z1_R1_D2_C1_T2_H1' || // Mã Rack Thường
    cleanCode === '80001030_Z1_R1_D1_C1_T2_H1' || // Mã Rack Cắt Liều
    cleanCode === 'RACK-01' ||
    cleanCode === 'RACK-02' ||
    MASTER_LOCATION_CODES.includes(cleanCode)
  ) {
    return false;
  }

  // 3. Loại trừ các mã kho chức năng:
  // - 80001001: Dán Tem
  // - 80001020: Kho Khuyến Mãi
  if (cleanCode.startsWith('80001001') || cleanCode.startsWith('80001020')) {
    return false;
  }

  // 4. Loại trừ các Zone tiền soạn: Z2, Z3, Z4, Z5
  if (/_Z[2-9]_/.test(cleanCode)) {
    return false;
  }

  // 5. Loại trừ Dãy D10 trở lên ở kho 80001010 (D10 là Kho Tạm)
  if (cleanCode.startsWith('80001010') && /_D10_/.test(cleanCode)) {
    return false;
  }

  // 6. Nhận diện các toạ độ hộc giá kệ chi tiết (6.241 vị trí):
  // - Nhóm 1: Kho 80001030, Zone 1, Dãy 1 (Rack Cắt Liều - hộc lẻ)
  const isRackCatLieuSlot =
    cleanCode.startsWith('80001030') &&
    cleanCode.includes('_Z1_') &&
    cleanCode.includes('_D1_') &&
    /_T\d+_H\d+/i.test(cleanCode) &&
    cleanCode !== '80001030_Z1_R1_D1_C1_T2_H1';

  if (isRackCatLieuSlot) {
    return true;
  }

  // - Nhóm 2: Kho 80001010, Zone 1, Dãy D2 đến D9 (Rack Thường - hộc lẻ)
  const isRackThuongSlot =
    cleanCode.startsWith('80001010') &&
    cleanCode.includes('_Z1_') &&
    /_D[2-9]_/.test(cleanCode) &&
    /_T\d+_H\d+/i.test(cleanCode) &&
    cleanCode !== '80001010_Z1_R1_D2_C1_T2_H1';

  if (isRackThuongSlot) {
    return true;
  }

  return false;
};

/**
 * Lấy tên hiển thị mặc định cho vị trí hộc rack khi import:
 * Mặc định trả về "Hộc Rack" cho các vị trí này.
 */
export const getRackCategoryName = (code?: string | null, locationName?: string | null): string => {
  if (locationName && !locationName.toUpperCase().includes('800010')) {
    return locationName;
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
