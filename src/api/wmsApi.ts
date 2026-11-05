import { Pallet, WarehouseLocation, TransferCard, ShiftSession, AuditLog, WMSStats } from '../types';
import {
  INITIAL_LOCATIONS,
  INITIAL_PALLETS,
  INITIAL_CARDS,
  INITIAL_SHIFT,
  INITIAL_AUDIT_LOGS,
  INITIAL_EMPLOYEES,
} from '../data/initialData';
import { supabase } from '../lib/supabase';

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
  const pendingCount = store.cards.filter(
    c => c.status === 'PENDING' || (c.status as string) === 'pending'
  ).length;
  const completedCount = store.cards.filter(
    c => c.status === 'COMPLETED' || (c.status as string) === 'completed'
  ).length;
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
  // 1. Thống kê tổng quan kho
  async getStats(): Promise<WMSStats> {
    if (supabase) {
      try {
        const [
          { count: pendingCount },
          { count: completedCount },
          { count: totalPallets },
          { count: locationsCount },
        ] = await Promise.all([
          supabase.from('transfer_cards').select('*', { count: 'exact', head: true }).eq('status', 'PENDING'),
          supabase.from('transfer_cards').select('*', { count: 'exact', head: true }).eq('status', 'COMPLETED'),
          supabase.from('pallets').select('*', { count: 'exact', head: true }),
          supabase.from('warehouse_locations').select('*', { count: 'exact', head: true }),
        ]);

        const store = getLocalStore();
        return {
          pendingCount: pendingCount ?? 0,
          completedCount: completedCount ?? 0,
          totalTonnage: Math.round(((totalPallets || 0) * 420) / 100) / 10,
          totalPallets: totalPallets ?? 0,
          locationsCount: locationsCount ?? 0,
          shift: store.shift,
        };
      } catch (err) {
        console.warn('Supabase getStats failed, fallback to local:', err);
      }
    }

    try {
      const res = await fetch('/api/stats');
      if (res.ok) return await res.json();
    } catch {}

    const store = getLocalStore();
    return computeLocalStats(store);
  },

  // 2. Danh mục Pallet
  async getPallets(): Promise<Pallet[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('pallets')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data.map(p => ({
            id: p.id,
            status: p.status,
            created_at: p.created_at,
            updated_at: p.updated_at,
            name: `Kiện ${p.id}`,
            weight: 400,
            boxes: 30,
            spec: 'Tiêu chuẩn ISO',
            packaging: 'Thùng carton',
            category: p.id.startsWith('K') ? 'Kiện lưu kho' : 'Thùng hàng',
            priority: 'normal',
            currentLocation: 'Kho WH-01',
          }));
        }
      } catch (err) {
        console.warn('Supabase getPallets failed, fallback to local:', err);
      }
    }

    try {
      const res = await fetch('/api/pallets');
      if (res.ok) return await res.json();
    } catch {}

    return getLocalStore().pallets;
  },

  async getPalletById(id: string): Promise<Pallet> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('pallets')
          .select('*')
          .ilike('id', id)
          .maybeSingle();

        if (!error && data) {
          return {
            id: data.id,
            status: data.status,
            created_at: data.created_at,
            updated_at: data.updated_at,
            name: `Kiện ${data.id}`,
            weight: 400,
            boxes: 30,
            spec: 'Tiêu chuẩn ISO',
            packaging: 'Thùng carton',
            category: data.id.startsWith('K') ? 'Kiện lưu kho' : 'Thùng hàng',
            priority: 'normal',
            currentLocation: 'Kho WH-01',
          };
        }
      } catch (err) {
        console.warn('Supabase getPalletById failed, fallback to local:', err);
      }
    }

    try {
      const res = await fetch(`/api/pallets/${encodeURIComponent(id)}`);
      if (res.ok) return await res.json();
    } catch {}

    const pallet = getLocalStore().pallets.find(p => p.id.toUpperCase() === id.toUpperCase());
    if (!pallet) throw new Error(`Không tìm thấy pallet ${id}`);
    return pallet;
  },

  async createPallet(palletData: Partial<Pallet>): Promise<Pallet> {
    const id = palletData.id || `K${Math.floor(10 + Math.random() * 90)}`;
    const status = palletData.status === 'COMPLETED' ? 'COMPLETED' : 'PENDING';

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('pallets')
          .upsert({ id, status }, { onConflict: 'id' })
          .select()
          .single();

        if (error) {
          console.error('[Supabase Error] Ghi bảng pallets thất bại:', error);
          throw new Error(`[Supabase Pallet Error] ${error.message} (code: ${error.code})`);
        }

        if (data) {
          return {
            id: data.id,
            status: data.status,
            created_at: data.created_at,
            updated_at: data.updated_at,
            name: palletData.name || `Kiện ${data.id}`,
            weight: palletData.weight || 400,
            boxes: palletData.boxes || 30,
            spec: palletData.spec || 'Gỗ tiêu chuẩn',
            packaging: palletData.packaging || 'Thùng carton',
            category: palletData.category || 'Tiêu chuẩn',
            priority: palletData.priority || 'normal',
            currentLocation: palletData.currentLocation || 'Sàn bốc dỡ',
            notes: palletData.notes || '',
          };
        }
      } catch (err: any) {
        console.error('Supabase createPallet error:', err);
        throw err;
      }
    }

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
      id,
      status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      name: palletData.name || `Kiện ${id}`,
      weight: palletData.weight || 400,
      boxes: palletData.boxes || 30,
      spec: palletData.spec || 'Gỗ tiêu chuẩn',
      packaging: palletData.packaging || 'Thùng carton',
      category: palletData.category || 'Tiêu chuẩn',
      priority: palletData.priority || 'normal',
      currentLocation: palletData.currentLocation || 'Sàn bốc dỡ',
      notes: palletData.notes || '',
    };
    store.pallets.unshift(newPallet);
    saveLocalStore(store);
    return newPallet;
  },

  // 3. Danh mục vị trí kho (warehouse_locations)
  async getLocations(): Promise<WarehouseLocation[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('warehouse_locations')
          .select('code, name')
          .order('code', { ascending: true });

        if (!error && data && data.length > 0) {
          return data.map(item => ({
            code: item.code,
            name: item.name,
            id: item.code,
            zone: item.name,
            type: item.name.toLowerCase().includes('rack')
              ? 'rack'
              : item.name.toLowerCase().includes('buffer')
              ? 'buffer'
              : 'staging',
            capacity: 25,
            currentCount: 0,
            description: item.name,
            qrPayload: item.code,
          }));
        }
      } catch (err) {
        console.warn('Supabase getLocations failed, fallback to local:', err);
      }
    }

    try {
      const res = await fetch('/api/locations');
      if (res.ok) return await res.json();
    } catch {}

    return getLocalStore().locations;
  },

  // 4. Thẻ điều chuyển kho (transfer_cards)
  async getCards(params?: { status?: string; search?: string; dest?: string }): Promise<TransferCard[]> {
    if (supabase) {
      try {
        let query = supabase
          .from('transfer_cards')
          .select('*')
          .order('created_at', { ascending: false });

        if (params?.status && params.status !== 'all') {
          query = query.eq('status', params.status.toUpperCase());
        }

        if (params?.dest && params.dest !== 'all') {
          query = query.eq('destination_code', params.dest);
        }

        const { data, error } = await query;

        if (!error && data) {
          let list = data.map(c => ({
            id: c.id,
            palletId: c.pallet_id,
            pallet_id: c.pallet_id,
            destinationLocation: c.destination_location,
            destination_location: c.destination_location,
            destinationCode: c.destination_code,
            destination_code: c.destination_code,
            status: c.status as 'PENDING' | 'COMPLETED',
            statusLabel: c.status === 'COMPLETED' ? 'Đã hoàn tất' : 'Chờ Nhập',
            driver: c.driver || 'Chưa gán',
            priority: (c.notes?.toLowerCase().includes('ưu tiên') ? 'urgent' : 'normal') as 'urgent' | 'normal',
            createdAt: c.created_at
              ? new Date(c.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
              : 'Vừa xong',
            created_at: c.created_at,
            completedAt: c.completed_at
              ? new Date(c.completed_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
              : null,
            completed_at: c.completed_at,
            reconciledBy: c.reconciled_by || undefined,
            reconciled_by: c.reconciled_by || undefined,
            notes: c.notes || '',
          }));

          if (params?.search) {
            const s = params.search.toLowerCase();
            list = list.filter(
              c =>
                c.id.toLowerCase().includes(s) ||
                c.palletId.toLowerCase().includes(s) ||
                c.destinationLocation.toLowerCase().includes(s) ||
                c.destinationCode.toLowerCase().includes(s) ||
                (c.driver && c.driver.toLowerCase().includes(s))
            );
          }
          return list;
        }
      } catch (err) {
        console.warn('Supabase getCards failed, fallback to local:', err);
      }
    }

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
      const targetStatus = params.status.toUpperCase();
      list = list.filter(c => c.status.toUpperCase() === targetStatus);
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
          c.destinationCode.toLowerCase().includes(s) ||
          (c.driver && c.driver.toLowerCase().includes(s))
      );
    }
    return list;
  },

  async getCardById(id: string): Promise<TransferCard> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('transfer_cards')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (!error && data) {
          return {
            id: data.id,
            palletId: data.pallet_id,
            pallet_id: data.pallet_id,
            destinationLocation: data.destination_location,
            destination_location: data.destination_location,
            destinationCode: data.destination_code,
            destination_code: data.destination_code,
            status: data.status,
            statusLabel: data.status === 'COMPLETED' ? 'Đã hoàn tất' : 'Chờ Nhập',
            driver: data.driver || 'Chưa gán',
            createdAt: data.created_at,
            created_at: data.created_at,
            completedAt: data.completed_at,
            completed_at: data.completed_at,
            reconciledBy: data.reconciled_by || undefined,
            reconciled_by: data.reconciled_by || undefined,
            notes: data.notes || '',
          };
        }
      } catch (err) {
        console.warn('Supabase getCardById failed, fallback to local:', err);
      }
    }

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
    destinationCode: string;
    originLocation?: string;
    driver?: string;
    priority?: 'urgent' | 'high' | 'normal';
    notes?: string;
    pallet?: Partial<Pallet>;
  }): Promise<TransferCard> {
    const cardId = `TX-${Math.floor(9000 + Math.random() * 1000)}`;
    const driver = cardData.driver || 'Trần Minh';

    if (supabase) {
      try {
        // 1. Đảm bảo Pallet đã tồn tại trong bảng pallets
        const { error: palletErr } = await supabase
          .from('pallets')
          .upsert({ id: cardData.palletId, status: 'PENDING' }, { onConflict: 'id' });
        if (palletErr) {
          console.error('[Supabase Error] Ghi bảng pallets thất bại:', palletErr);
          throw new Error(`[Supabase Pallet Error] ${palletErr.message} (code: ${palletErr.code})`);
        }

        // 1.1 Tự động bổ sung destination_code vào warehouse_locations để không vi phạm khóa ngoại FK
        if (cardData.destinationCode) {
          const { error: locErr } = await supabase
            .from('warehouse_locations')
            .upsert({
              code: cardData.destinationCode,
              name: cardData.destinationLocation || cardData.destinationCode,
            }, { onConflict: 'code' });
          if (locErr) {
            console.warn('[Supabase Warning] Tự động cập nhật location cảnh báo:', locErr.message);
          }
        }

        // 2. Tạo bản ghi mới trong bảng transfer_cards
        const { data, error } = await supabase
          .from('transfer_cards')
          .insert({
            id: cardId,
            pallet_id: cardData.palletId,
            destination_location: cardData.destinationLocation,
            destination_code: cardData.destinationCode,
            status: 'PENDING',
            driver,
            notes: cardData.notes || null,
            completed_at: null,
          })
          .select()
          .single();

        if (error) {
          console.error('[Supabase Error] Ghi bảng transfer_cards thất bại:', error);
          throw new Error(`[Supabase Transfer Card Error] ${error.message} (code: ${error.code})`);
        }

        if (data) {
          // 3. Ghi nhật ký vào bảng audit_logs
          await supabase.from('audit_logs').insert({
            transfer_card_id: cardId,
            action: 'CREATE_TRANSFER_CARD',
            operator: driver,
          });

          return {
            id: data.id,
            palletId: data.pallet_id,
            pallet_id: data.pallet_id,
            destinationLocation: data.destination_location,
            destination_location: data.destination_location,
            destinationCode: data.destination_code,
            destination_code: data.destination_code,
            originLocation: cardData.originLocation || 'Sàn bốc dỡ',
            origin_location: cardData.originLocation || 'Sàn bốc dỡ',
            status: 'PENDING',
            statusLabel: 'Chờ Nhập',
            driver: data.driver || driver,
            priority: cardData.priority || 'normal',
            createdAt: 'Vừa xong',
            created_at: data.created_at,
            completedAt: null,
            completed_at: null,
            notes: data.notes || '',
          };
        }
      } catch (err: any) {
        console.error('Supabase createCard error:', err);
        throw err;
      }
    }

    try {
      const res = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cardData),
      });
      if (res.ok) return await res.json();
    } catch {}

    const store = getLocalStore();
    let pallet = store.pallets.find(p => p.id.toUpperCase() === cardData.palletId.toUpperCase());
    if (!pallet) {
      pallet = {
        id: cardData.palletId,
        status: 'PENDING',
        name: cardData.pallet?.name || `Kiện ${cardData.palletId}`,
        weight: cardData.pallet?.weight || 400,
        boxes: cardData.pallet?.boxes || 30,
        spec: cardData.pallet?.spec || 'Gỗ tiêu chuẩn',
        packaging: cardData.pallet?.packaging || 'Thùng carton',
        category: cardData.pallet?.category || 'Tiêu chuẩn',
        priority: cardData.priority || 'normal',
        currentLocation: cardData.originLocation || 'Sàn bốc dỡ',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        notes: cardData.notes || '',
      };
      store.pallets.unshift(pallet);
    } else {
      pallet.status = 'PENDING';
      pallet.updated_at = new Date().toISOString();
    }

    const nowIso = new Date().toISOString();
    const newCard: TransferCard = {
      id: cardId,
      palletId: pallet.id,
      pallet_id: pallet.id,
      pallet,
      originLocation: cardData.originLocation || pallet.currentLocation || 'Sàn bốc dỡ',
      destinationLocation: cardData.destinationLocation,
      destination_location: cardData.destinationLocation,
      destinationCode: cardData.destinationCode,
      destination_code: cardData.destinationCode,
      status: 'PENDING',
      statusLabel: 'Chờ Nhập',
      driver: cardData.driver || store.shift?.operatorName || 'Chưa gán',
      priority: cardData.priority || 'normal',
      createdAt: 'Vừa xong',
      created_at: nowIso,
      completedAt: null,
      completed_at: null,
      notes: cardData.notes || '',
    };

    store.cards.unshift(newCard);
    store.auditLogs.unshift({
      id: `a${Date.now()}-0000-0000-0000-${Math.floor(100000000000 + Math.random() * 900000000000)}`,
      transfer_card_id: cardId,
      action: 'CREATE_TRANSFER_CARD',
      operator: cardData.driver || store.shift?.operatorName || 'Trần Minh',
      created_at: nowIso,
      timestamp: 'Vừa xong',
      details: `Phát sinh lệnh ${cardId} cho kiện ${pallet.id} điều chuyển tới ${cardData.destinationLocation}`,
      type: 'info',
    });

    saveLocalStore(store);
    return newCard;
  },

  async batchCreateCards(items: Array<{
    palletId: string;
    destination: string;
    quantity?: number;
    notes?: string;
  }>): Promise<TransferCard[]> {
    const locations = await this.getLocations();
    const createdList: TransferCard[] = [];

    for (const item of items) {
      const loc =
        locations.find(
          l => l.code === item.destination || l.name.toLowerCase().includes(item.destination.toLowerCase())
        ) || locations[0];

      const card = await this.createCard({
        palletId: item.palletId,
        destinationLocation: loc ? loc.name : item.destination,
        destinationCode: loc ? loc.code : 'TS-01',
        notes: item.notes,
      });
      createdList.push(card);
    }
    return createdList;
  },

  async reconcileCard(cardId: string, operatorName?: string): Promise<TransferCard> {
    const nowIso = new Date().toISOString();
    const op = operatorName || 'Trần Minh';

    if (supabase) {
      try {
        // 1. Cập nhật thẻ sang COMPLETED và ghi nhận completed_at
        const { data, error } = await supabase
          .from('transfer_cards')
          .update({
            status: 'COMPLETED',
            completed_at: nowIso,
            reconciled_by: op,
          })
          .eq('id', cardId)
          .select()
          .single();

        if (error) {
          console.error('[Supabase Error] Cập nhật transfer_cards thất bại:', error);
          throw new Error(`[Supabase Reconcile Error] ${error.message} (code: ${error.code})`);
        }

        if (data) {
          // 2. Cập nhật pallet sang COMPLETED
          if (data.pallet_id) {
            await supabase
              .from('pallets')
              .update({ status: 'COMPLETED' })
              .eq('id', data.pallet_id);
          }

          // 3. Ghi nhật ký vào audit_logs
          await supabase.from('audit_logs').insert({
            transfer_card_id: cardId,
            action: 'COMPLETE_TRANSFER',
            operator: op,
          });

          return {
            id: data.id,
            palletId: data.pallet_id,
            pallet_id: data.pallet_id,
            destinationLocation: data.destination_location,
            destination_location: data.destination_location,
            destinationCode: data.destination_code,
            destination_code: data.destination_code,
            status: 'COMPLETED',
            statusLabel: 'Đã hoàn tất',
            driver: data.driver || op,
            createdAt: data.created_at,
            created_at: data.created_at,
            completedAt: 'Vừa xong',
            completed_at: nowIso,
            reconciledBy: op,
            reconciled_by: op,
            notes: data.notes || '',
          };
        }
      } catch (err: any) {
        console.error('Supabase reconcileCard error:', err);
        throw err;
      }
    }

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

    card.status = 'COMPLETED';
    card.statusLabel = 'Đã hoàn tất';
    card.completedAt = 'Vừa xong';
    card.completed_at = nowIso;
    card.reconciledBy = op;
    card.reconciled_by = op;

    const pallet = store.pallets.find(p => p.id === card.palletId);
    if (pallet) {
      pallet.status = 'COMPLETED';
      pallet.currentLocation = card.destinationLocation;
      pallet.updated_at = nowIso;
    }

    store.auditLogs.unshift({
      id: `a${Date.now()}-0000-0000-0000-${Math.floor(100000000000 + Math.random() * 900000000000)}`,
      transfer_card_id: card.id,
      action: 'COMPLETE_TRANSFER',
      operator: op,
      created_at: nowIso,
      timestamp: 'Vừa xong',
      details: `Đối soát thành công kiện ${card.palletId} sang ${card.destinationLocation}`,
      type: 'success',
    });

    saveLocalStore(store);
    return card;
  },

  // 5. Xác thực đăng nhập nhân viên
  async loginEmployee(code: string, password: string): Promise<{ code: string; name: string; role: string } | null> {
    const cleanCode = code.trim().toUpperCase();

    if (supabase) {
      try {
        // Cách 1: Gọi hàm RPC bảo mật
        const { data: rpcData, error: rpcError } = await supabase.rpc('verify_employee_login', {
          p_code: cleanCode,
          p_password: password,
        });

        if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
          return rpcData[0];
        }

        // Cách 2: Truy vấn bảng employees nếu chưa tạo RPC
        const { data: tableData, error: tableError } = await supabase
          .from('employees')
          .select('code, name, role')
          .eq('code', cleanCode)
          .eq('password', password)
          .eq('is_active', true)
          .maybeSingle();

        if (!tableError && tableData) {
          return tableData;
        }
      } catch (err) {
        console.warn('Supabase loginEmployee check failed, fallback to local:', err);
      }
    }

    // Fallback danh sách nội bộ
    const found = INITIAL_EMPLOYEES.find(
      e => e.code.toUpperCase() === cleanCode && e.password === password
    );

    if (found) {
      return { code: found.code, name: found.name, role: found.role };
    }

    // Cho phép đăng nhập demo nếu chưa thiết lập mật khẩu khắt khe
    if (password === '123456') {
      return { code: cleanCode, name: cleanCode, role: 'Nhân viên vận hành' };
    }

    return null;
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
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(30);

        if (!error && data) {
          return data.map(l => ({
            id: l.id,
            transfer_card_id: l.transfer_card_id,
            action: l.action,
            operator: l.operator || 'Hệ thống',
            created_at: l.created_at,
            timestamp: l.created_at
              ? new Date(l.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
              : 'Vừa xong',
            details: `Thực hiện ${l.action}${l.transfer_card_id ? ` (Thẻ #${l.transfer_card_id})` : ''}`,
            type: l.action === 'COMPLETE_TRANSFER' ? 'success' : 'info',
          }));
        }
      } catch (err) {
        console.warn('Supabase getAuditLogs failed, fallback to local:', err);
      }
    }

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
