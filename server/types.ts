export interface Pallet {
  id: string; // e.g. K01, PLT-8829-HN
  status: 'PENDING' | 'COMPLETED';
  name?: string;
  weight?: number; // in kg
  boxes?: number;
  spec?: string;
  packaging?: string;
  category?: string;
  priority?: 'urgent' | 'high' | 'normal';
  currentLocation?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
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
  id: string; // e.g. TX-9024
  palletId: string;
  pallet_id?: string;
  pallet?: Pallet;
  originLocation?: string;
  origin_location?: string;
  destinationLocation: string;
  destination_location?: string;
  destinationCode: string;
  destination_code?: string;
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
  transfer_card_id?: string | null;
  action: string;
  details?: string;
  operator?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  timestamp?: string;
  created_at?: string;
}

export interface WMSStoreData {
  pallets: Pallet[];
  locations: WarehouseLocation[];
  cards: TransferCard[];
  shift: ShiftSession;
  auditLogs: AuditLog[];
}
