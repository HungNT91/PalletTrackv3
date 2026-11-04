import { Pallet, WarehouseLocation, TransferCard, ShiftSession, AuditLog, WMSStats } from '../types';

export const wmsApi = {
  async getStats(): Promise<WMSStats> {
    const res = await fetch('/api/stats');
    if (!res.ok) throw new Error('Không thể tải thông tin thống kê');
    return res.json();
  },

  async getPallets(): Promise<Pallet[]> {
    const res = await fetch('/api/pallets');
    if (!res.ok) throw new Error('Không thể tải danh sách pallet');
    return res.json();
  },

  async getPalletById(id: string): Promise<Pallet> {
    const res = await fetch(`/api/pallets/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error(`Không tìm thấy pallet ${id}`);
    return res.json();
  },

  async createPallet(pallet: Partial<Pallet>): Promise<Pallet> {
    const res = await fetch('/api/pallets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pallet),
    });
    if (!res.ok) throw new Error('Không thể lưu pallet');
    return res.json();
  },

  async getLocations(): Promise<WarehouseLocation[]> {
    const res = await fetch('/api/locations');
    if (!res.ok) throw new Error('Không thể tải danh sách vị trí kho');
    return res.json();
  },

  async getCards(params?: { status?: string; search?: string; dest?: string }): Promise<TransferCard[]> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    if (params?.dest) query.set('dest', params.dest);

    const res = await fetch(`/api/cards?${query.toString()}`);
    if (!res.ok) throw new Error('Không thể tải danh sách thẻ chờ điều chuyển');
    return res.json();
  },

  async getCardById(id: string): Promise<TransferCard> {
    const res = await fetch(`/api/cards/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error(`Không tìm thấy thẻ ${id}`);
    return res.json();
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
    const res = await fetch('/api/cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cardData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Lỗi khi tạo thẻ điều chuyển');
    }
    return res.json();
  },

  async batchCreateCards(items: Array<{
    palletId: string;
    destination: string;
    quantity?: number;
    notes?: string;
  }>): Promise<TransferCard[]> {
    const res = await fetch('/api/cards/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Lỗi khi nhập hàng loạt thẻ');
    }
    return res.json();
  },

  async reconcileCard(cardId: string, operatorName?: string): Promise<TransferCard> {
    const res = await fetch(`/api/cards/${encodeURIComponent(cardId)}/reconcile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operatorName }),
    });
    if (!res.ok) throw new Error('Không thể đối soát thẻ điều chuyển');
    return res.json();
  },

  async getShift(): Promise<ShiftSession> {
    const res = await fetch('/api/shift');
    if (!res.ok) throw new Error('Không thể tải thông tin ca làm việc');
    return res.json();
  },

  async updateShift(session: Partial<ShiftSession>): Promise<ShiftSession> {
    const res = await fetch('/api/shift', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session),
    });
    if (!res.ok) throw new Error('Không thể cập nhật ca');
    return res.json();
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    const res = await fetch('/api/audit-logs');
    if (!res.ok) throw new Error('Không thể tải nhật ký vận hành');
    return res.json();
  },

  async resetData(): Promise<{ message: string }> {
    const res = await fetch('/api/reset-data', { method: 'POST' });
    if (!res.ok) throw new Error('Không thể đặt lại dữ liệu');
    return res.json();
  },
};
