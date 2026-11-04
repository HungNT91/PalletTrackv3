import { Pallet, WarehouseLocation, TransferCard, ShiftSession, AuditLog, WMSStats } from '../types';
import {
  INITIAL_LOCATIONS,
  INITIAL_PALLETS,
  INITIAL_CARDS,
  INITIAL_SHIFT,
  INITIAL_AUDIT_LOGS,
} from '../data/initialData';

const CLIENT_STORAGE_KEY = 'pallettrack_wms_client_store';

interface LocalStoreData {
  pallets: Pallet[];
  locations: WarehouseLocation[];
  cards: TransferCard[];
  shift: ShiftSession;
  auditLogs: AuditLog[];
}

function getLocalStore(): LocalStoreData {
  try {
    const raw = localStorage.getItem(CLIENT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed?.pallets) && Array.isArray(parsed?.cards)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading local store', e);
  }
  const initial: LocalStoreData = {
    pallets: [...INITIAL_PALLETS],
    locations: [...INITIAL_LOCATIONS],
    cards: [...INITIAL_CARDS],
    shift: { ...INITIAL_SHIFT },
    auditLogs: [...INITIAL_AUDIT_LOGS],
  };
  try {
    localStorage.setItem(CLIENT_STORAGE_KEY, JSON.stringify(initial));
  } catch {}
  return initial;
}

function saveLocalStore(data: LocalStoreData) {
  try {
    localStorage.setItem(CLIENT_STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

function computeLocalStats(store: LocalStoreData): WMSStats {
  const pendingCount = store.cards.filter(c => c.status === 'pending').length;
  const completedCount = store.cards.filter(c => c.status === 'completed').length;
  const totalTonnage = Math.round(store.pallets.reduce((acc, p) => acc + (p.weight || 0), 0) / 100) / 10;
  return {
    pendingCount,
    completedCount,
    totalTonnage,
    totalPallets: store.pallets.length,
    locationsCount: store.locations.length,
    shift: store.shift,
  };
}

export const wmsApi = {
  async getStats(): Promise<WMSStats> {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) return await res.json();
    } catch {}
    const store = getLocalStore();
    return computeLocalStats(store);
  },

  async getPallets(): Promise<Pallet[]> {
    try {
      const res = await fetch('/api/pallets');
      if (res.ok) return await res.json();
    } catch {}
    return getLocalStore().pallets;
  },

  async getPalletById(id: string): Promise<Pallet> {
    try {
      const res = await fetch(`/api/pallets/${encodeURIComponent(id)}`);
      if (res.ok) return await res.json();
    } catch {}
    const pallet = getLocalStore().pallets.find(p => p.id === id);
    if (!pallet) throw new Error(`Không tìm thấy pallet ${id}`);
    return pallet;
  },

  async createPallet(palletData: Partial<Pallet>): Promise<Pallet> {
    try {
      const res = await fetch('/api/pallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(palletData),
      });
      if (res.ok) return await res.json();
    } catch {}
    const store = getLocalStore();
    const newPallet: Pallet = {
      id: palletData.id || `PLT-${Math.floor(1000 + Math.random() * 9000)}-VN`,
      name: palletData.name || 'Pallet mới',
      weight: palletData.weight || 400,
      boxes: palletData.boxes || 30,
      spec: palletData.spec || 'Gỗ tiêu chuẩn',
      packaging: palletData.packaging || 'Thùng carton',
      category: palletData.category || 'Tiêu chuẩn',
      priority: palletData.priority || 'normal',
      currentLocation: palletData.currentLocation || 'Sàn bốc dỡ',
      status: palletData.status || 'in_transit',
      notes: palletData.notes || '',
    };
    store.pallets.unshift(newPallet);
    saveLocalStore(store);
    return newPallet;
  },

  async getLocations(): Promise<WarehouseLocation[]> {
    try {
      const res = await fetch('/api/locations');
      if (res.ok) return await res.json();
    } catch {}
    return getLocalStore().locations;
  },

  async getCards(params?: { status?: string; search?: string; dest?: string }): Promise<TransferCard[]> {
    try {
      const query = new URLSearchParams();
      if (params?.status) query.set('status', params.status);
      if (params?.search) query.set('search', params.search);
      if (params?.dest) query.set('dest', params.dest);
      const res = await fetch(`/api/cards?${query.toString()}`);
      if (res.ok) return await res.json();
    } catch {}
    let list = getLocalStore().cards;
    if (params?.status && params.status !== 'all') {
      list = list.filter(c => c.status === params.status);
    }
    if (params?.dest && params.dest !== 'all') {
      list = list.filter(c => c.destinationCode === params.dest || c.destinationLocation.includes(params.dest!));
    }
    if (params?.search) {
      const s = params.search.toLowerCase();
      list = list.filter(
        c =>
          c.id.toLowerCase().includes(s) ||
          c.palletId.toLowerCase().includes(s) ||
          c.destinationLocation.toLowerCase().includes(s) ||
          c.pallet?.name.toLowerCase().includes(s)
      );
    }
    return list;
  },

  async getCardById(id: string): Promise<TransferCard> {
    try {
      const res = await fetch(`/api/cards/${encodeURIComponent(id)}`);
      if (res.ok) return await res.json();
    } catch {}
    const card = getLocalStore().cards.find(c => c.id === id);
    if (!card) throw new Error(`Không tìm thấy thẻ ${id}`);
    return card;
  },

  async createCard(cardData: {
    palletId: string;
    destinationLocation: string;
    destinationCode?: string;
    originLocation?: string;
    driver?: string;
    priority?: 'urgent' | 'high' | 'normal';
    notes?: string;
    pallet?: Partial<Pallet>;
  }): Promise<TransferCard> {
    try {
      const res = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cardData),
      });
      if (res.ok) return await res.json();
    } catch {}
    const store = getLocalStore();
    let pallet = store.pallets.find(p => p.id === cardData.palletId);
    if (!pallet) {
      pallet = {
        id: cardData.palletId,
        name: cardData.pallet?.name || `Kiện ${cardData.palletId}`,
        weight: cardData.pallet?.weight || 400,
        boxes: cardData.pallet?.boxes || 30,
        spec: cardData.pallet?.spec || 'Gỗ tiêu chuẩn',
        packaging: cardData.pallet?.packaging || 'Thùng carton',
        category: cardData.pallet?.category || 'Tiêu chuẩn',
        priority: cardData.priority || 'normal',
        currentLocation: cardData.originLocation || 'Sàn bốc dỡ',
        status: 'in_transit',
        notes: cardData.notes || '',
      };
      store.pallets.unshift(pallet);
    }
    const newCard: TransferCard = {
      id: `TX-${Math.floor(9000 + Math.random() * 1000)}`,
      palletId: pallet.id,
      pallet,
      originLocation: cardData.originLocation || pallet.currentLocation || 'Sàn bốc dỡ',
      destinationLocation: cardData.destinationLocation,
      destinationCode: cardData.destinationCode || cardData.destinationLocation,
      status: 'pending',
      statusLabel: 'Chờ Nhập',
      driver: cardData.driver || store.shift?.operatorName || 'Chưa gán',
      priority: cardData.priority || 'normal',
      createdAt: 'Vừa xong',
      notes: cardData.notes || '',
    };
    store.cards.unshift(newCard);
    saveLocalStore(store);
    return newCard;
  },

  async batchCreateCards(items: Array<{
    palletId: string;
    destination: string;
    quantity?: number;
    notes?: string;
  }>): Promise<TransferCard[]> {
    try {
      const res = await fetch('/api/cards/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      if (res.ok) return await res.json();
    } catch {}
    const createdList: TransferCard[] = [];
    for (const item of items) {
      const card = await this.createCard({
        palletId: item.palletId,
        destinationLocation: item.destination,
        destinationCode: item.destination,
        notes: item.notes,
      });
      createdList.push(card);
    }
    return createdList;
  },

  async reconcileCard(cardId: string, operatorName?: string): Promise<TransferCard> {
    try {
      const res = await fetch(`/api/cards/${encodeURIComponent(cardId)}/reconcile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operatorName }),
      });
      if (res.ok) return await res.json();
    } catch {}
    const store = getLocalStore();
    const card = store.cards.find(c => c.id === cardId);
    if (!card) throw new Error('Không tìm thấy thẻ điều chuyển');
    card.status = 'completed';
    card.statusLabel = 'Đã hoàn tất';
    card.completedAt = 'Vừa xong';
    card.reconciledBy = operatorName || store.shift?.operatorName || 'Nhân viên kho';
    const pallet = store.pallets.find(p => p.id === card.palletId);
    if (pallet) {
      pallet.currentLocation = card.destinationLocation;
      pallet.status = 'stored';
    }
    store.auditLogs.unshift({
      id: `LOG-${Date.now()}`,
      timestamp: 'Vừa xong',
      action: 'ĐỐI SOÁT HOÀN TẤT',
      details: `Đối soát thành công pallet ${card.palletId} về ${card.destinationLocation}`,
      operator: operatorName || store.shift?.operatorName || 'Nhân viên kho',
      type: 'success',
    });
    saveLocalStore(store);
    return card;
  },

  async getShift(): Promise<ShiftSession> {
    try {
      const res = await fetch('/api/shift');
      if (res.ok) return await res.json();
    } catch {}
    return getLocalStore().shift;
  },

  async updateShift(session: Partial<ShiftSession>): Promise<ShiftSession> {
    try {
      const res = await fetch('/api/shift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(session),
      });
      if (res.ok) return await res.json();
    } catch {}
    const store = getLocalStore();
    store.shift = { ...store.shift, ...session };
    saveLocalStore(store);
    return store.shift;
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    try {
      const res = await fetch('/api/audit-logs');
      if (res.ok) return await res.json();
    } catch {}
    return getLocalStore().auditLogs;
  },

  async resetData(): Promise<{ message: string }> {
    try {
      const res = await fetch('/api/reset-data', { method: 'POST' });
      if (res.ok) return await res.json();
    } catch {}
    localStorage.removeItem(CLIENT_STORAGE_KEY);
    getLocalStore();
    return { message: 'Dữ liệu đã được đặt lại về mặc định' };
  },
};
