import fs from 'fs';
import path from 'path';
import { Pallet, WarehouseLocation, TransferCard, ShiftSession, AuditLog, WMSStoreData } from './types.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'wms_store.json');

const INITIAL_LOCATIONS: WarehouseLocation[] = [
  {
    id: 'TS-01 - K1',
    code: 'TS-01 - K1',
    name: 'Tiền soạn 1 - Kho 1',
    zone: 'Khu A • Kệ 01',
    type: 'staging',
    capacity: 20,
    currentCount: 8,
    description: 'Sắp xếp đơn lẻ xuất kho nhanh',
    qrPayload: 'LOC:WH01:STAGING:TS-01',
  },
  {
    id: 'TS-02',
    code: 'TS-02',
    name: 'Tiền soạn 2',
    zone: 'Khu B • Kệ 02',
    type: 'staging',
    capacity: 25,
    currentCount: 12,
    description: 'Dành cho lô hàng cồng kềnh',
    qrPayload: 'LOC:WH01:STAGING:TS-02',
  },
  {
    id: '80001010_Z1_D2_C1_T2_H1',
    code: '80001010_Z1_D2_C1_T2_H1',
    name: 'Rack Thường',
    zone: 'Khu vực lưu trữ tiêu chuẩn - Z1 D2 C1 T2 H1',
    type: 'rack',
    capacity: 25,
    currentCount: 8,
    description: 'Giá kệ lưu trữ pallet tiêu chuẩn',
    qrPayload: '80001010_Z1_D2_C1_T2_H1',
  },
  {
    id: 'BUFFER-IN',
    code: 'BUFFER-IN',
    name: 'Khu đệm nhập (Buffer In)',
    zone: 'Sàn đệm nhập kho IN-01',
    type: 'buffer',
    capacity: 40,
    currentCount: 14,
    description: 'Tạm lưu chờ dán nhãn SKU & phân luồng',
    qrPayload: 'LOC:WH01:BUFFER:IN-01',
  },
  {
    id: 'OUTBOUND',
    code: 'OUTBOUND',
    name: 'Khu kiểm hàng Outbound',
    zone: 'Cửa xuất hàng Gate 02',
    type: 'outbound',
    capacity: 30,
    currentCount: 18,
    description: 'Cửa xuất hàng container & xe tải',
    qrPayload: 'LOC:WH01:GATE:OUT-02',
  },
];

const INITIAL_PALLETS: Pallet[] = [
  {
    id: 'PLT-8829-HN',
    name: 'Lô linh kiện điện tử phụ trợ',
    weight: 520,
    boxes: 48,
    spec: 'Gỗ 1.2m ISO',
    packaging: '8 lớp x 6 thùng',
    category: 'Điện tử A',
    priority: 'urgent',
    currentLocation: 'Sàn bốc dỡ Gate 01',
    status: 'in_transit',
    notes: 'Ưu tiên xuất ca sớm, tránh ẩm',
  },
  {
    id: 'PLT-9104-DB',
    name: 'Vật tư đóng gói tiêu chuẩn',
    weight: 350,
    boxes: 36,
    spec: 'Pallet gỗ sồi',
    packaging: '6 lớp x 6 thùng',
    category: 'Vật tư',
    priority: 'normal',
    currentLocation: 'Khu nhập D2',
    status: 'in_transit',
    notes: 'Chờ định vị vào kệ cao',
  },
  {
    id: 'PLT-7741-SG',
    name: 'Hàng gốm sứ & thủy tinh mỹ nghệ',
    weight: 410,
    boxes: 28,
    spec: 'Pallet gỗ gia cố',
    packaging: '4 lớp có chèn bọt khí',
    category: 'Hàng dễ vỡ',
    priority: 'high',
    currentLocation: 'Sàn bốc dỡ Gate 02',
    status: 'in_transit',
    notes: 'Hàng dễ vỡ - Xe nâng di chuyển chậm',
  },
  {
    id: 'PLT-6320-QN',
    name: 'Thiết bị gia dụng lắp ráp',
    weight: 520,
    boxes: 50,
    spec: 'Nhựa đúc chịu tải',
    packaging: '10 lớp x 5 thùng',
    category: 'Tiêu chuẩn',
    priority: 'normal',
    currentLocation: 'Cửa bốc dỡ Dock 03',
    status: 'in_transit',
    notes: 'Chờ phân loại dán tem phụ',
  },
  {
    id: 'PLT-8840-HN',
    name: 'Linh kiện dây cáp quang',
    weight: 480,
    boxes: 60,
    spec: 'Gỗ 1.2m ISO',
    packaging: '10 lớp x 6 thùng',
    category: 'Điện tử',
    priority: 'normal',
    currentLocation: 'Rack B-02',
    status: 'stored',
    notes: 'Đã kiểm định',
  },
  {
    id: 'PLT-8841-HN',
    name: 'Bộ chuyển nguồn AC/DC',
    weight: 390,
    boxes: 32,
    spec: 'Gỗ tiêu chuẩn',
    packaging: '8 lớp x 4 thùng',
    category: 'Điện tử',
    priority: 'urgent',
    currentLocation: 'Tiền soạn 1',
    status: 'stored',
    notes: 'Hàng ưu tiên giao đối tác',
  },
];

const INITIAL_CARDS: TransferCard[] = [
  {
    id: 'TX-9024',
    palletId: 'PLT-8829-HN',
    pallet: INITIAL_PALLETS[0],
    originLocation: 'Sàn bốc dỡ Gate 01',
    destinationLocation: 'Tiền soạn 1 (TS-01)',
    destinationCode: 'TS-01',
    status: 'pending',
    statusLabel: 'Chờ Nhập',
    driver: 'Trần Minh',
    priority: 'urgent',
    createdAt: '5 phút trước',
    notes: 'Lệnh bốc dỡ thời gian thực trạm WH-01',
  },
  {
    id: 'TX-9025',
    palletId: 'PLT-9104-DB',
    pallet: INITIAL_PALLETS[1],
    originLocation: 'Khu nhập D2',
    destinationLocation: 'Rack A-04 (Tầng 2)',
    destinationCode: 'RACK-A04',
    status: 'pending',
    statusLabel: 'Chờ định vị',
    driver: 'Lê Hữu Hoàng',
    priority: 'normal',
    createdAt: '12 phút trước',
    notes: 'Cần nâng lên tầng 2 rack A',
  },
  {
    id: 'TX-9026',
    palletId: 'PLT-7741-SG',
    pallet: INITIAL_PALLETS[2],
    originLocation: 'Sàn bốc dỡ Gate 02',
    destinationLocation: 'Tiền soạn 2 (TS-02)',
    destinationCode: 'TS-02',
    status: 'pending',
    statusLabel: 'Hàng dễ vỡ',
    driver: 'Võ Quốc Anh',
    priority: 'high',
    createdAt: '20 phút trước',
    notes: 'Cảnh báo hàng dễ vỡ - Đã gán xe nâng 03',
  },
  {
    id: 'TX-9027',
    palletId: 'PLT-6320-QN',
    pallet: INITIAL_PALLETS[3],
    originLocation: 'Cửa bốc dỡ Dock 03',
    destinationLocation: 'Khu đệm nhập (BUFFER-IN)',
    destinationCode: 'BUFFER-IN',
    status: 'pending',
    statusLabel: 'Chờ xử lý',
    driver: 'Nguyễn Tùng',
    priority: 'normal',
    createdAt: '35 phút trước',
    notes: 'Chuyển về sàn đệm phân luồng',
  },
  {
    id: 'TX-8991',
    palletId: 'PLT-8840-HN',
    pallet: INITIAL_PALLETS[4],
    originLocation: 'Sàn bốc dỡ Gate 01',
    destinationLocation: 'Rack B-02',
    destinationCode: 'RACK-B02',
    status: 'completed',
    statusLabel: 'Đã hoàn tất',
    driver: 'Trần Minh',
    priority: 'normal',
    createdAt: '1 giờ trước',
    completedAt: '45 phút trước',
    reconciledBy: 'Trần Minh (OP-2048)',
    notes: 'Đã đối soát quét QR thành công',
  },
  {
    id: 'TX-8992',
    palletId: 'PLT-8841-HN',
    pallet: INITIAL_PALLETS[5],
    originLocation: 'Khu đệm nhập',
    destinationLocation: 'Tiền soạn 1 (TS-01)',
    destinationCode: 'TS-01',
    status: 'completed',
    statusLabel: 'Đã hoàn tất',
    driver: 'Lê Hữu Hoàng',
    priority: 'urgent',
    createdAt: '2 giờ trước',
    completedAt: '1 giờ trước',
    reconciledBy: 'Lê Hữu Hoàng (OP-2049)',
    notes: 'Đã giao trạm tiền soạn',
  },
];

const INITIAL_SHIFT: ShiftSession = {
  operatorCode: 'OP-2048',
  operatorName: 'Trần Minh',
  station: 'WH-01 • Kho A (Khu nhận diện pallet & tiền soạn)',
  deviceId: 'Honeywell EDA51 (#ZBR-049)',
  shiftName: 'Ca sáng: 06:00 - 14:00',
  loginTime: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
  status: 'online',
  ipAddress: '192.168.1.104',
  pingMs: 12,
};

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'LOG-001',
    timestamp: 'Vừa xong',
    action: 'ĐỒNG BỘ CA LÀM VIỆC',
    details: 'Nhân viên Trần Minh (OP-2048) kết nối thiết bị Honeywell EDA51 tại trạm WH-01 Kho A',
    operator: 'Trần Minh',
    type: 'info',
  },
  {
    id: 'LOG-002',
    timestamp: '15 phút trước',
    action: 'ĐỐI SOÁT HOÀN TẤT',
    details: 'Hoàn tất điều chuyển pallet PLT-8840-HN sang vị trí Rack B-02',
    operator: 'Trần Minh',
    type: 'success',
  },
  {
    id: 'LOG-003',
    timestamp: '40 phút trước',
    action: 'TẠO THẺ ĐIỀU CHUYỂN',
    details: 'Phát sinh lệnh TX-9024 cho pallet PLT-8829-HN điều chuyển sang Tiền soạn 1',
    operator: 'Hệ thống tự động',
    type: 'info',
  },
];

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
    const pendingCards = this.data.cards.filter(c => c.status === 'pending');
    const completedCards = this.data.cards.filter(c => c.status === 'completed');
    const totalTonnage = pendingCards.reduce((acc, c) => acc + (c.pallet.weight || 0), 0) / 1000;

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
      if (c.status === 'pending' && (c.statusLabel === 'Chờ xe nâng' || !c.statusLabel)) {
        return { ...c, statusLabel: 'Chờ Nhập' };
      }
      return c;
    });

    if (filter?.status && filter.status !== 'all') {
      result = result.filter(c => c.status === filter.status);
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
        c.driver.toLowerCase().includes(q) ||
        c.destinationLocation.toLowerCase().includes(q) ||
        c.statusLabel.toLowerCase().includes(q)
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
      // create pallet if it doesn't exist
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
        status: 'in_transit',
        notes: cardData.notes || 'Tạo mới qua máy quét',
      };
      this.addPallet(pallet);
    } else {
      pallet.status = 'in_transit';
    }

    const cardId = `TX-${Math.floor(1000 + Math.random() * 9000)}`;
    const newCard: TransferCard = {
      id: cardId,
      palletId: pallet.id,
      pallet,
      originLocation: cardData.originLocation || pallet.currentLocation || 'Sàn bốc dỡ WH-01',
      destinationLocation: cardData.destinationLocation,
      destinationCode: cardData.destinationCode || cardData.destinationLocation.split(' ')[0],
      status: 'pending',
      statusLabel: cardData.statusLabel || (pallet.priority === 'urgent' ? 'Ưu tiên 1' : 'Chờ Nhập'),
      driver: cardData.driver || this.data.shift.operatorName || 'Trần Minh',
      priority: cardData.priority || pallet.priority || 'normal',
      createdAt: 'Vừa xong',
      notes: cardData.notes || '',
    };

    this.data.cards.unshift(newCard);

    this.logAudit({
      action: 'TẠO THẺ ĐIỀU CHUYỂN',
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
          status: 'in_transit',
          notes: item.notes || 'Nhập từ file Excel',
        };
        this.addPallet(pallet);
      }

      const cardId = `TX-${Math.floor(1000 + Math.random() * 9000)}`;
      const card: TransferCard = {
        id: cardId,
        palletId: pallet.id,
        pallet,
        originLocation: 'Khu bốc dỡ trung tâm',
        destinationLocation: item.destination,
        destinationCode: item.destination.split(' ')[0],
        status: 'pending',
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
      action: 'NẠP FILE HÀNG LOẠT',
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

    card.status = 'completed';
    card.statusLabel = 'ĐÃ HOÀN TẤT ĐIỀU CHUYỂN';
    card.completedAt = 'Vừa xong';
    card.reconciledBy = operatorName || this.data.shift.operatorName || 'Trần Minh (OP-2048)';

    // Update pallet location and status
    const pallet = this.getPalletById(card.palletId);
    if (pallet) {
      pallet.currentLocation = card.destinationLocation;
      pallet.status = 'stored';
    }

    this.logAudit({
      action: 'ĐỐI SOÁT HOÀN TẤT',
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
