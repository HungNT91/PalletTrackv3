import { Pallet, WarehouseLocation, TransferCard, ShiftSession, AuditLog, Employee } from '../types';

// Hệ thống sử dụng 100% cơ sở dữ liệu Supabase thực tế.
// Dữ liệu khởi tạo mặc định là rỗng (không dùng mockup/dữ liệu giả).
export const INITIAL_EMPLOYEES: Employee[] = [];
export const INITIAL_LOCATIONS: WarehouseLocation[] = [];
export const INITIAL_PALLETS: Pallet[] = [];
export const INITIAL_CARDS: TransferCard[] = [];
export const INITIAL_AUDIT_LOGS: AuditLog[] = [];

export const INITIAL_SHIFT: ShiftSession = {
  operatorCode: '',
  operatorName: '',
  station: 'WH-01',
  deviceId: 'Thiết bị cầm tay PDA',
  shiftName: 'Ca làm việc tiêu chuẩn',
  loginTime: '',
  status: 'offline',
  ipAddress: '192.168.1.1',
  pingMs: 12,
};
