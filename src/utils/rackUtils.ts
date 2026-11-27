import { WarehouseLocation } from '../types';

/**
 * Tiện ích nhận diện vị trí kho đích và phân loại Hộc Rack:
 * "Các vị trí đích không thuộc các kho đích có trong bảng warehouse_locations
 * thì sẽ được đưa vào hộc rack"
 */

/**
 * Danh sách mã của các kho đích cố định trong bảng warehouse_locations
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
  '80001010_Z1_R1_D2_C1_T2_H1', // Rack Thường
  '80001030_Z1_R1_D1_C1_T2_H1', // Rack Cắt Liều
  'RACK-01',
  'RACK-02',
  'TS-01',
  'TS-02',
  'BUFFER-01',
];

/**
 * Danh sách tên không dấu của các kho đích trong bảng warehouse_locations
 */
export const MASTER_LOCATION_NAMES_NO_TONE = [
  'rack thuong',
  'rack cat lieu',
  'dan tem',
  'kho tam',
  'tien soan 1 - kho 1',
  'tien soan 1 - kho 1 - t4',
  'tien soan 1 - kho 2',
  'tien soan 1 - kho 2 - t4',
  'tien soan 2 - kho 1',
  'tien soan 2 - kho 2',
  'tien soan 1 - kho 2 - cl',
  'tien soan 2 - kho 2 - cl',
  'kho khuyen mai',
  'khu dem',
  'buffer',
  'san boc do',
  'staging',
  'outbound',
];

/**
 * Xóa dấu tiếng Việt và chuẩn hóa chữ thường để so sánh an toàn mọi bảng mã (NFC / NFD)
 */
export const removeVietnameseTones = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
};

/**
 * Kiểm tra xem một vị trí có thuộc danh mục kho đích (warehouse_locations) hay không.
 *
 * Nguyên tắc:
 * 1. Nếu có mã vị trí (code):
 *    - Nếu mã khớp với một trong các kho đích trong bảng warehouse_locations (hoặc MASTER_LOCATION_CODES)
 *      => Là kho đích master (không phải hộc rack).
 *    - Nếu mã KHÔNG khớp với kho đích nào trong warehouse_locations (ví dụ 6.241 toạ độ hộc giá kệ)
 *      => KHÔNG PHẢI kho đích master (được xếp vào Hộc Rack).
 * 2. Nếu không có mã, chỉ có tên (name):
 *    - Nếu tên khớp với kho đích trong bảng warehouse_locations (và không phải "Hộc Rack")
 *      => Là kho đích master.
 *    - Ngược lại => Xếp vào Hộc Rack.
 */
export const isMasterWarehouseLocation = (
  code?: string | null,
  name?: string | null,
  knownLocations?: WarehouseLocation[]
): boolean => {
  const cleanCode = (code || '').trim().toUpperCase();
  const cleanName = (name || '').trim();
  const nameNoTone = removeVietnameseTones(cleanName);

  // Nếu tên ghi rõ là "Hộc Rack" => Chắc chắn không phải master warehouse location
  if (nameNoTone === 'hoc rack') {
    return false;
  }

  // Danh sách các mã master tổng hợp (từ knownLocations và constants)
  const masterCodes = new Set<string>(MASTER_LOCATION_CODES.map(c => c.toUpperCase()));
  if (knownLocations && knownLocations.length > 0) {
    knownLocations.forEach(loc => {
      if (loc.code) {
        masterCodes.add(loc.code.trim().toUpperCase());
      }
    });
  }

  // 1. Nếu có mã (code):
  if (cleanCode) {
    // Nếu mã nằm trong danh mục master => ĐÚNG là master warehouse location
    if (masterCodes.has(cleanCode)) {
      return true;
    }
    // Nếu mã có giá trị nhưng KHÔNG nằm trong masterCodes => Đây là hộc rack chi tiết!
    return false;
  }

  // 2. Nếu không có mã, chỉ có tên (name):
  if (nameNoTone) {
    // Kiểm tra trong knownLocations từ DB
    if (knownLocations && knownLocations.length > 0) {
      const matchDb = knownLocations.some(loc => {
        const lNameNoTone = removeVietnameseTones(loc.name || '');
        return lNameNoTone && (lNameNoTone === nameNoTone || cleanName.toLowerCase() === (loc.name || '').toLowerCase());
      });
      if (matchDb) return true;
    }

    // Kiểm tra danh mục tên master cố định
    if (MASTER_LOCATION_NAMES_NO_TONE.some(n => nameNoTone === n || nameNoTone.includes(n))) {
      return true;
    }
  }

  return false;
};

/**
 * Quy tắc: Các vị trí đích KHÔNG thuộc các kho đích có trong bảng warehouse_locations
 * thì sẽ được đưa vào "Hộc Rack".
 *
 * @param code Mã vị trí đích
 * @param locationName Tên vị trí đích
 * @param knownLocations Danh mục kho đích lấy từ bảng warehouse_locations (tuỳ chọn)
 */
export const isRackSlotCode = (
  code?: string | null,
  locationName?: string | null,
  knownLocations?: WarehouseLocation[]
): boolean => {
  // Nếu vị trí đích thuộc các kho đích có trong bảng warehouse_locations => KHÔNG PHẢI Hộc Rack
  if (isMasterWarehouseLocation(code, locationName, knownLocations)) {
    return false;
  }

  // Nếu vị trí đích không thuộc các kho đích trên => ĐƯỢC ĐƯA VÀO HỘC RACK!
  if (code || locationName) {
    return true;
  }

  return false;
};

/**
 * Lấy tên hiển thị mặc định cho vị trí hộc rack khi import:
 * Nếu không thuộc warehouse_locations thì mặc định là "Hộc Rack".
 */
export const getRackCategoryName = (
  code?: string | null,
  locationName?: string | null,
  knownLocations?: WarehouseLocation[]
): string => {
  if (locationName && isMasterWarehouseLocation(code, locationName, knownLocations)) {
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
