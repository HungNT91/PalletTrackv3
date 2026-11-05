export interface Employee {
  code: string;
  name: string;
  password?: string;
  role: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Pallet {
  id: string; // e.g. K01, PLT-8829-HN
  status: 'PENDING' | 'COMPLETED';
  created_at?: string;
  updated_at?: string;
  name?: string;
  weight?: number;
  boxes?: number;
  spec?: string;
  packaging?: string;
  category?: string;
  priority?: 'urgent' | 'high' | 'normal';
  currentLocation?: string;
  notes?: string;
}

export interface WarehouseLocation {
  code: string;
  name: string;
  id?: string;
  zone?: string;
  type?: string;
  capacity?: number;
  currentCount?: number;
  description?: string;
  qrPayload?: string;
}

export interface TransferCard {
  id: string;
  palletId: string;
  pallet_id?: string;
  destinationLocation: string;
  destination_location?: string;
  destinationCode: string;
  destination_code?: string;
  originLocation?: string;
  origin_location?: string;
  status: 'PENDING' | 'COMPLETED';
  statusLabel?: string;
  driver: string;
  priority?: 'urgent' | 'high' | 'normal';
  createdAt?: string;
  created_at?: string;
  completedAt?: string | null;
  completed_at?: string | null;
  reconciledBy?: string;
  reconciled_by?: string;
  notes?: string;
  pallet?: Pallet;
}

export type AuditAction =
  | 'CREATE_TRANSFER_CARD'
  | 'ASSIGN_DRIVER'
  | 'CHANGE_DRIVER'
  | 'COMPLETE_TRANSFER'
  | 'UPDATE_PALLET_STATUS';

export interface AuditLog {
  id: string;
  transfer_card_id?: string | null;
  action: AuditAction | string;
  operator?: string;
  created_at?: string;
  timestamp?: string;
  details?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}

export interface ShiftSession {
  operatorCode: string;
  operatorName: string;
  role?: string;
  station: string;
  deviceId: string;
  shiftName: string;
  loginTime: string;
  status: 'online' | 'offline';
  ipAddress: string;
  pingMs: number;
}

export interface WMSStats {
  pendingCount: number;
  completedCount: number;
  totalTonnage: number;
  totalPallets: number;
  locationsCount: number;
  shift: ShiftSession;
}
