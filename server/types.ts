export interface Pallet {
  id: string; // e.g. PLT-8829-HN
  name: string;
  weight: number; // in kg
  boxes: number;
  spec: string; // e.g. "Gỗ 1.2m ISO"
  packaging: string; // e.g. "8 lớp x 6 thùng"
  category: string; // e.g. "Điện tử A"
  priority: 'urgent' | 'high' | 'normal';
  currentLocation: string;
  status: 'available' | 'in_transit' | 'stored';
  notes?: string;
}

export interface WarehouseLocation {
  id: string; // e.g. TS-01
  name: string; // e.g. Tiền soạn 1
  code: string;
  zone: string; // e.g. Khu A • Kệ 01
  type: 'staging' | 'rack' | 'buffer' | 'outbound';
  capacity: number;
  currentCount: number;
  description: string;
  qrPayload: string;
}

export interface TransferCard {
  id: string; // e.g. TX-9024
  palletId: string;
  pallet: Pallet;
  originLocation: string;
  destinationLocation: string;
  destinationCode: string;
  status: 'pending' | 'in_transit' | 'completed' | 'cancelled';
  statusLabel: string;
  driver: string;
  priority: 'urgent' | 'high' | 'normal';
  createdAt: string;
  completedAt?: string;
  reconciledBy?: string;
  notes?: string;
}

export interface ShiftSession {
  operatorCode: string;
  operatorName: string;
  station: string;
  deviceId: string;
  shiftName: string;
  loginTime: string;
  status: 'online' | 'offline';
  ipAddress: string;
  pingMs: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  operator: string;
  type: 'info' | 'success' | 'warning';
}

export interface WMSStoreData {
  pallets: Pallet[];
  locations: WarehouseLocation[];
  cards: TransferCard[];
  shift: ShiftSession;
  auditLogs: AuditLog[];
}
