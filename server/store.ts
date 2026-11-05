import fs from 'fs';
import path from 'path';
import { Pallet, WarehouseLocation, TransferCard, ShiftSession, AuditLog, WMSStoreData } from './types.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'wms_store.json');

const INITIAL_LOCATIONS: WarehouseLocation[] = [];
const INITIAL_PALLETS: Pallet[] = [];
const INITIAL_CARDS: TransferCard[] = [];

const INITIAL_SHIFT: ShiftSession = {
  operatorCode: '',
  operatorName: '',
  station: 'WH-01',
  deviceId: 'Thiết bị PDA',
  shiftName: 'Ca làm việc',
  loginTime: '',
  status: 'offline',
  ipAddress: '192.168.1.1',
  pingMs: 12,
};

const INITIAL_AUDIT_LOGS: AuditLog[] = [];

export class WMSStore {
  private data: WMSStoreData;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): WMSStoreData {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Failed to load store from disk, initializing defaults:', e);
    }

    const defaultData: WMSStoreData = {
      pallets: INITIAL_PALLETS,
      locations: INITIAL_LOCATIONS,
      cards: INITIAL_CARDS,
      shift: INITIAL_SHIFT,
      auditLogs: INITIAL_AUDIT_LOGS,
    };

    this.saveData(defaultData);
    return defaultData;
  }

  private saveData(dataToSave?: WMSStoreData) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(dataToSave || this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to persist store to disk:', e);
    }
  }

  public resetToDefaults(): WMSStoreData {
    this.data = {
      pallets: JSON.parse(JSON.stringify(INITIAL_PALLETS)),
      locations: JSON.parse(JSON.stringify(INITIAL_LOCATIONS)),
      cards: JSON.parse(JSON.stringify(INITIAL_CARDS)),
      shift: JSON.parse(JSON.stringify(INITIAL_SHIFT)),
      auditLogs: [
        {
          id: `LOG-${Date.now()}`,
          timestamp: 'Vừa xong',
          action: 'KHÔI PHỤC DỮ LIỆU GỐC',
          details: 'Đặt lại toàn bộ dữ liệu mẫu sàn kho vận theo chuẩn thiết kế PalletTrack WMS',
          operator: this.data.shift.operatorName,
          type: 'warning',
        },
        ...INITIAL_AUDIT_LOGS,
      ],
    };
    this.saveData();
    return this.data;
  }

  public getStats() {
    const pendingCards = this.data.cards.filter(c => c.status === 'PENDING' || (c.status as string) === 'pending');
    const completedCards = this.data.cards.filter(c => c.status === 'COMPLETED' || (c.status as string) === 'completed');
    const totalTonnage = pendingCards.reduce((acc, c) => acc + (c.pallet?.weight || 0), 0) / 1000;

    return {
      pendingCount: pendingCards.length,
      completedCount: completedCards.length,
      totalTonnage: parseFloat(totalTonnage.toFixed(2)),
      totalPallets: this.data.pallets.length,
      locationsCount: this.data.locations.length,
      shift: this.data.shift,
    };
  }

  public getPallets(): Pallet[] {
    return this.data.pallets;
  }

  public getPalletById(id: string): Pallet | undefined {
    return this.data.pallets.find(p => p.id.toUpperCase() === id.toUpperCase());
  }

  public addPallet(pallet: Pallet): Pallet {
    const existingIndex = this.data.pallets.findIndex(p => p.id.toUpperCase() === pallet.id.toUpperCase());
    if (existingIndex >= 0) {
      this.data.pallets[existingIndex] = { ...this.data.pallets[existingIndex], ...pallet };
    } else {
      this.data.pallets.unshift(pallet);
    }
    this.saveData();
    return pallet;
  }

  public getLocations(): WarehouseLocation[] {
    return this.data.locations;
  }

  public getCards(filter?: { status?: string; search?: string; dest?: string }): TransferCard[] {
    let result = this.data.cards.map(c => {
      if (c.status === 'PENDING' && (c.statusLabel === 'Chờ xe nâng' || !c.statusLabel)) {
        return { ...c, statusLabel: 'Chờ Nhập' };
      }
      return c;
    });

    if (filter?.status && filter.status !== 'all') {
      const target = filter.status.toUpperCase();
      result = result.filter(c => c.status.toUpperCase() === target);
    }

    if (filter?.dest && filter.dest !== 'all') {
      result = result.filter(c =>
        c.destinationLocation.toLowerCase().includes(filter.dest!.toLowerCase()) ||
        c.destinationCode.toLowerCase().includes(filter.dest!.toLowerCase())
      );
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase().trim();
      result = result.filter(c =>
        c.id.toLowerCase().includes(q) ||
        c.palletId.toLowerCase().includes(q) ||
        (c.driver && c.driver.toLowerCase().includes(q)) ||
        c.destinationLocation.toLowerCase().includes(q) ||
        (c.statusLabel && c.statusLabel.toLowerCase().includes(q))
      );
    }

    return result;
  }

  public getCardById(id: string): TransferCard | undefined {
    return this.data.cards.find(c => c.id === id || c.palletId === id);
  }

  public createCard(cardData: Partial<TransferCard> & { palletId: string; destinationLocation: string }): TransferCard {
    let pallet = this.getPalletById(cardData.palletId);
    if (!pallet) {
      pallet = {
        id: cardData.palletId,
        name: `Kiện ${cardData.palletId}`,
        weight: cardData.pallet?.weight || 450,
        boxes: cardData.pallet?.boxes || 36,
        spec: cardData.pallet?.spec || 'Tiêu chuẩn ISO',
        packaging: cardData.pallet?.packaging || '6 lớp x 6 thùng',
        category: cardData.pallet?.category || 'Hàng lưu kho',
        priority: cardData.priority || 'normal',
        currentLocation: 'Sàn bốc dỡ',
        status: 'PENDING',
        notes: cardData.notes || 'Tạo mới qua máy quét',
      };
      this.addPallet(pallet);
    } else {
      pallet.status = 'PENDING';
    }

    const cardId = `TX-${Math.floor(1000 + Math.random() * 9000)}`;
    const newCard: TransferCard = {
      id: cardId,
      palletId: pallet.id,
      pallet,
      originLocation: cardData.originLocation || pallet.currentLocation || 'Sàn bốc dỡ WH-01',
      destinationLocation: cardData.destinationLocation,
      destinationCode: cardData.destinationCode || cardData.destinationLocation.split(' ')[0],
      status: 'PENDING',
      statusLabel: cardData.statusLabel || (pallet.priority === 'urgent' ? 'Ưu tiên 1' : 'Chờ Nhập'),
      driver: cardData.driver || this.data.shift.operatorName || 'Trần Minh',
      priority: cardData.priority || pallet.priority || 'normal',
      createdAt: 'Vừa xong',
      created_at: new Date().toISOString(),
      completedAt: null,
      completed_at: null,
      notes: cardData.notes || '',
    };

    this.data.cards.unshift(newCard);

    this.logAudit({
      action: 'CREATE_TRANSFER_CARD',
      details: `Phát sinh lệnh ${cardId} cho kiện ${pallet.id} điều chuyển tới ${newCard.destinationLocation}`,
      operator: newCard.driver,
      type: 'info',
    });

    this.saveData();
    return newCard;
  }

  public batchCreateCards(items: Array<{
    palletId: string;
    destination: string;
    quantity?: number;
    notes?: string;
  }>): TransferCard[] {
    const created: TransferCard[] = [];

    for (const item of items) {
      let pallet = this.getPalletById(item.palletId);
      if (!pallet) {
        pallet = {
          id: item.palletId,
          name: `Kiện ${item.palletId}`,
          weight: (item.quantity || 40) * 10,
          boxes: item.quantity || 40,
          spec: 'Gỗ 1.2m tiêu chuẩn',
          packaging: `${Math.ceil((item.quantity || 40) / 6)} lớp x 6 thùng`,
          category: 'Hàng nạp file',
          priority: item.notes?.toLowerCase().includes('ưu tiên') ? 'urgent' : 'normal',
          currentLocation: 'Khu bốc dỡ trung tâm',
          status: 'PENDING',
          notes: item.notes || 'Nhập từ file Excel',
        };
        this.addPallet(pallet);
      } else {
        pallet.status = 'PENDING';
      }

      const cardId = `TX-${Math.floor(1000 + Math.random() * 9000)}`;
      const card: TransferCard = {
        id: cardId,
        palletId: pallet.id,
        pallet,
        originLocation: 'Khu bốc dỡ trung tâm',
        destinationLocation: item.destination,
        destinationCode: item.destination.split(' ')[0],
        status: 'PENDING',
        completedAt: null,
        completed_at: null,
        statusLabel: pallet.priority === 'urgent' ? 'Ưu tiên 1' : 'Chờ Nhập',
        driver: this.data.shift.operatorName || 'Trần Minh',
        priority: pallet.priority,
        createdAt: 'Vừa xong',
        notes: item.notes || 'Nhập theo lô từ file Excel',
      };

      this.data.cards.unshift(card);
      created.push(card);
    }

    this.logAudit({
      action: 'CREATE_TRANSFER_CARD',
      details: `Nạp thành công ${created.length} lệnh điều chuyển từ tệp bảng tính`,
      operator: this.data.shift.operatorName,
      type: 'success',
    });

    this.saveData();
    return created;
  }

  public reconcileCard(cardId: string, operatorName?: string): TransferCard | null {
    const card = this.data.cards.find(c => c.id === cardId || c.palletId === cardId);
    if (!card) return null;

    const nowIso = new Date().toISOString();
    card.status = 'COMPLETED';
    card.statusLabel = 'ĐÃ HOÀN TẤT ĐIỀU CHUYỂN';
    card.completedAt = 'Vừa xong';
    card.completed_at = nowIso;
    card.reconciledBy = operatorName || this.data.shift.operatorName || 'Trần Minh (OP-2048)';

    // Update pallet location and status
    const pallet = this.getPalletById(card.palletId);
    if (pallet) {
      pallet.currentLocation = card.destinationLocation;
      pallet.status = 'COMPLETED';
    }

    this.logAudit({
      action: 'COMPLETE_TRANSFER',
      details: `Đã đối soát QR Pallet ${card.palletId} khớp QR Đích ${card.destinationLocation}. Lệnh ${card.id} đóng.`,
      operator: card.reconciledBy,
      type: 'success',
    });

    this.saveData();
    return card;
  }

  public updateShift(session: Partial<ShiftSession>): ShiftSession {
    this.data.shift = {
      ...this.data.shift,
      ...session,
      loginTime: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    this.logAudit({
      action: 'CẬP NHẬT PHIÊN LÀM VIỆC',
      details: `Nhân viên ${this.data.shift.operatorName} (${this.data.shift.operatorCode}) đăng nhập tại trạm ${this.data.shift.station}`,
      operator: this.data.shift.operatorName,
      type: 'info',
    });

    this.saveData();
    return this.data.shift;
  }

  public getShift(): ShiftSession {
    return this.data.shift;
  }

  public getAuditLogs(): AuditLog[] {
    return this.data.auditLogs;
  }

  public logAudit(entry: Omit<AuditLog, 'id' | 'timestamp'>) {
    const newLog: AuditLog = {
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: 'Vừa xong',
      ...entry,
    };
    this.data.auditLogs.unshift(newLog);
    if (this.data.auditLogs.length > 50) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 50);
    }
  }
}

export const wmsStore = new WMSStore();
