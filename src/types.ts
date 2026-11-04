export interface Pallet {
  id: string;
  name: string;
  weight: number;
  boxes: number;
  spec: string;
  packaging: string;
  category: string;
  priority: 'urgent' | 'high' | 'normal';
  currentLocation: string;
  status: 'available' | 'in_transit' | 'stored';
  notes?: string;
}

export interface WarehouseLocation {
  id: string;
  code: string;
  name: string;
  zone: string;
  type: 'staging' | 'rack' | 'buffer' | 'outbound';
  capacity: number;
  currentCount: number;
  description: string;
  qrPayload: string;
}

export interface TransferCard {
  id: string;
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

export interface WMSStats {
  pendingCount: number;
  completedCount: number;
  totalTonnage: number;
  totalPallets: number;
  locationsCount: number;
  shift: ShiftSession;
}
