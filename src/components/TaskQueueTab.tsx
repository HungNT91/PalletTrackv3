import React, { useState, useMemo } from 'react';
import { TransferCard, WMSStats } from '../types';
import { isRackSlotCode, getRackCategoryName } from '../utils/rackUtils';

interface TaskQueueTabProps {
  cards: TransferCard[];
  stats: WMSStats | null;
  onSelectCard: (card: TransferCard) => void;
  onRefresh: () => void;
}

export const TaskQueueTab: React.FC<TaskQueueTabProps> = ({
  cards,
  stats,
  onSelectCard,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Filter chips options
  const filterChips = [
    { id: 'all', label: 'Tất cả', icon: 'apps' },
    { id: 'Hộc Rack', label: 'Hộc Rack', color: 'bg-indigo-500' },
    { id: 'Rack Thường', label: 'Rack Thường', color: 'bg-blue-500' },
    { id: 'Rack Cắt Liều', label: 'Rack Cắt Liều', color: 'bg-blue-500' },
    { id: 'Tiền soạn 1 - Kho 1', label: 'Tiền soạn 1 - Kho 1', color: 'bg-amber-500' },
    { id: 'Tiền soạn 2 - Kho 1', label: 'Tiền soạn 2 - Kho 1', color: 'bg-emerald-500' },
    { id: 'Tiền soạn 1 - Kho 2', label: 'Tiền soạn 1 - Kho 2', color: 'bg-emerald-500' },
    { id: 'Tiền soạn 2 - Kho 2', label: 'Tiền soạn 2 - Kho 2', color: 'bg-emerald-500' },
    { id: 'Tiền soạn 1 - Kho 1 - T4', label: 'Tiền soạn 1 - Kho 1 - T4', color: 'bg-emerald-500' },
    { id: 'Kho Khuyến Mãi', label: 'Kho Khuyến Mãi', color: 'bg-emerald-500' },
    { id: 'Kho Tạm', label: 'Kho Tạm', color: 'bg-blue-500' },
    { id: 'Dán Tem', label: 'Dán Tem', color: 'bg-blue-500' },
  ];

  // Kiểm tra thẻ có được tạo trước ngày hôm nay hay không (thẻ tồn từ ngày hôm trước)
  const isCreatedBeforeToday = (dateStr?: string): boolean => {
    if (!dateStr) return false;
    const cardDate = new Date(dateStr);
    if (isNaN(cardDate.getTime())) return false;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return cardDate.getTime() < startOfToday.getTime();
  };

  // Định dạng thời gian hiển thị: Nếu là ngày trước thì hiển thị Ngày/Tháng hoặc "Hôm qua"
  const formatDisplayTime = (dateStr?: string, fallbackCreatedAt?: string): string => {
    if (!dateStr) return fallbackCreatedAt || 'Vừa xong';
    const cardDate = new Date(dateStr);
    if (isNaN(cardDate.getTime())) return fallbackCreatedAt || 'Vừa xong';

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const timeStr = cardDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    if (cardDate.getTime() < startOfToday.getTime()) {
      const yesterday = new Date(startOfToday);
      yesterday.setDate(yesterday.getDate() - 1);
      if (cardDate.getTime() >= yesterday.getTime()) {
        return `Hôm qua ${timeStr}`;
      }
      const day = String(cardDate.getDate()).padStart(2, '0');
      const month = String(cardDate.getMonth() + 1).padStart(2, '0');
      return `${day}/${month} ${timeStr}`;
    }

    return `Hôm nay ${timeStr}`;
  };

  // Sắp xếp FIFO: Thẻ cũ nhất tạo trước xếp lên đầu để xử lý trước tránh tồn đọng
  const pendingList = useMemo(() => {
    const list = cards.filter(c => c.status === 'PENDING' || (c.status as string) === 'pending');
    return list.sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeA - timeB;
    });
  }, [cards]);

  // Tab hoàn tất: Thẻ hoàn thành gần nhất xem trước (mới nhất xếp trên cùng)
  const completedList = useMemo(() => {
    const list = cards.filter(c => c.status === 'COMPLETED' || (c.status as string) === 'completed');
    return list.sort((a, b) => {
      const timeA = (a.completed_at || a.created_at) ? new Date(a.completed_at || a.created_at!).getTime() : 0;
      const timeB = (b.completed_at || b.created_at) ? new Date(b.completed_at || b.created_at!).getTime() : 0;
      return timeB - timeA;
    });
  }, [cards]);

  // Đếm số lượng pallet tồn từ ngày hôm trước cần xử lý gấp
  const overduePendingCount = useMemo(() => {
    return pendingList.filter(c => isCreatedBeforeToday(c.created_at)).length;
  }, [pendingList]);

  const currentList = activeTab === 'pending' ? pendingList : completedList;

  // Filter by search query and chip filter
  const filteredCards = useMemo(() => {
    return currentList.filter(card => {
      const matchSearch =
        searchQuery === '' ||
        card.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.palletId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (card.driver && card.driver.toLowerCase().includes(searchQuery.toLowerCase())) ||
        card.destinationLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (card.destinationCode && card.destinationCode.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchChip = selectedFilter === 'all';
      if (!matchChip) {
        const destLoc = (card.destinationLocation || '').toLowerCase();
        const destCode = (card.destinationCode || '').toLowerCase();
        const isSlot = isRackSlotCode(card.destinationCode);

        if (selectedFilter === 'Hộc Rack') {
          // Lọc toàn bộ 6.241 thẻ điều chuyển về hộc rack hoặc vị trí có từ khoá Rack
          matchChip = isSlot || destLoc.includes('hộc rack') || destLoc.includes('rack');
        } else if (selectedFilter === 'Rack Thường') {
          matchChip =
            destLoc.includes('rack thường') ||
            (isSlot && getRackCategoryName(card.destinationCode) === 'Rack Thường');
        } else if (selectedFilter === 'Rack Cắt Liều') {
          matchChip =
            destLoc.includes('rack cắt liều') ||
            (isSlot && getRackCategoryName(card.destinationCode) === 'Rack Cắt Liều');
        } else {
          matchChip =
            destLoc.includes(selectedFilter.toLowerCase()) ||
            destCode.includes(selectedFilter.toLowerCase());
        }
      }

      return matchSearch && matchChip;
    });
  }, [currentList, searchQuery, selectedFilter]);

  const getBorderColor = (card: TransferCard) => {
    if (card.priority === 'urgent' || (card.statusLabel && card.statusLabel.includes('Ưu tiên'))) return 'bg-amber-500';
    if (card.priority === 'high' || (card.statusLabel && card.statusLabel.includes('Dễ vỡ'))) return 'bg-emerald-500';
    if (card.destinationLocation.includes('Rack')) return 'bg-blue-500';
    return 'bg-slate-400';
  };

  const getDestinationIcon = (dest: string) => {
    if (dest.includes('Rack')) return 'shelves';
    if (dest.includes('Tiền soạn')) return 'near_me';
    if (dest.includes('Buffer') || dest.includes('đệm')) return 'move_to_inbox';
    if (dest.includes('Outbound') || dest.includes('xuất')) return 'output';
    return 'near_me';
  };

  return (
    <div className="flex flex-col w-full px-3 sm:px-4 max-w-2xl mx-auto pb-12 pt-1 sm:pt-2 touch-pan-y">
      {/* Title & Refresh Button */}
      <div className="flex items-center justify-between py-1.5 sm:py-2">
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#004ac6] animate-pulse"></span>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Hàng chờ điều chuyển
            </h1>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
            Lệnh bốc dỡ thời gian thực trạm WH-01
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          aria-label="Làm mới hàng chờ"
          className="h-8 sm:h-9 px-2.5 sm:px-3 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200/90 rounded-xl flex items-center gap-1 sm:gap-1.5 text-[#004ac6] text-xs font-semibold shadow-sm active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[16px] sm:text-[17px]">sync</span>
          <span className="hidden xs:inline">Đồng bộ</span>
        </button>
      </div>

      {/* Modern Soft SaaS Status Summary Cards */}
      <div className="w-full bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl my-1.5 sm:my-2 flex items-center justify-between shadow-sm border border-slate-200/80">
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/70 flex items-center justify-center text-[#004ac6] shadow-xs flex-shrink-0">
            <span className="material-symbols-outlined text-[20px] sm:text-[24px]">forklift</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5 sm:gap-2">
              <span className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-code-md">
                {String(stats?.pendingCount || pendingList.length).padStart(2, '0')}
              </span>
              <span className="px-1.5 py-0.2 sm:px-2 sm:py-0.5 rounded-full bg-blue-50 text-[#004ac6] text-[10px] sm:text-[11px] font-semibold tracking-wide border border-blue-100 flex-shrink-0">
                Thẻ chờ
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 font-medium truncate">
              {pendingList.length} pallet trên sàn
            </p>
          </div>
        </div>

        <div className="h-8 sm:h-10 w-[1px] bg-slate-200 mx-2 flex-shrink-0"></div>

        <div className="text-right min-w-0 flex-shrink-0">
          <div className="flex items-baseline justify-end gap-1.5">
            <span className="text-xl sm:text-2xl font-bold text-emerald-600 tracking-tight font-code-md">
              {String(stats?.completedCount || completedList.length).padStart(2, '0')}
            </span>
            <span className="px-1.5 py-0.2 sm:px-2 sm:py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] sm:text-[11px] font-semibold border border-emerald-100 flex-shrink-0">
              Đã xong
            </span>
          </div>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 font-medium truncate">
            Đã hoàn tất
          </p>
        </div>
      </div>

      {/* Sticky Filter & Action Controls Panel */}
      <div className="sticky-under-header z-30 bg-[#f8f9ff]/95 backdrop-blur-md -mx-3 px-3 sm:-mx-4 sm:px-4 pt-1.5 pb-2.5 mb-3 border-b border-slate-200/80 shadow-xs transition-all">
        {/* Sleek Segmented Pill Control */}
        <div className="grid grid-cols-2 gap-1.5 bg-slate-100/90 p-1 rounded-xl mb-2 border border-slate-200/70">
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`h-9 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition-all ${activeTab === 'pending'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
              }`}
          >
            <span>Chờ chuyển</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${activeTab === 'pending'
                ? 'bg-[#004ac6] text-white shadow-xs'
                : 'bg-slate-200 text-slate-700'
                }`}
            >
              {pendingList.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('completed')}
            className={`h-9 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition-all ${activeTab === 'completed'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
              }`}
          >
            <span>Đã hoàn tất</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${activeTab === 'completed'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-200 text-slate-700'
                }`}
            >
              {completedList.length}
            </span>
          </button>
        </div>

        {/* Search and Filter Chips */}
        <div className="flex flex-col gap-2">
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm theo mã PLT, tài xế, đích..."
              className="w-full h-9.5 pl-9 pr-9 bg-white border border-slate-200/90 text-slate-900 placeholder:text-slate-400 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#004ac6]/20 focus:border-[#004ac6] transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[17px]"
              >
                cancel
              </button>
            )}
          </div>

          {/* Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar touch-pan-x">
            {filterChips.map(chip => {
              const isSelected = selectedFilter === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setSelectedFilter(chip.id)}
                  className={`whitespace-nowrap h-7.5 px-2.5 sm:px-3 rounded-lg text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 flex-shrink-0 transition-all ${isSelected
                    ? 'bg-[#004ac6] text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-xs'
                    }`}
                >
                  {chip.icon ? (
                    <span className="material-symbols-outlined text-[14px]">{chip.icon}</span>
                  ) : (
                    <span className={`w-2 h-2 rounded-full ${chip.color}`}></span>
                  )}
                  <span>
                    {chip.label}
                    {chip.id === 'all' ? ` (${currentList.length})` : ''}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Task Cards Container */}
      <div className="flex flex-col gap-3">
        {/* Banner cảnh báo thẻ tồn đọng từ ngày hôm trước cần ưu tiên xử lý (FIFO) */}
        {activeTab === 'pending' && overduePendingCount > 0 && (
          <div className="bg-rose-50 border border-rose-200/90 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-2 shadow-2xs animate-fadeIn">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[19px]">priority_high</span>
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-rose-900 tracking-tight flex items-center gap-1.5 flex-wrap">
                  <span>Ưu tiên xuất thẻ tồn</span>
                  <span className="px-1.5 py-0.2 rounded bg-rose-200/80 text-rose-800 text-[10px] font-bold">
                    FIFO
                  </span>
                </div>
                <p className="text-[11px] text-rose-700 mt-0.5 truncate">
                  Có <b className="font-extrabold text-rose-900">{overduePendingCount}</b> pallet từ ngày trước (đổi nền đỏ nhạt) cần xử lý trước.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-code-md font-bold text-rose-700 bg-white/80 border border-rose-200 px-2 py-1 rounded-lg flex-shrink-0">
              {overduePendingCount}/{pendingList.length} tồn
            </span>
          </div>
        )}

        {filteredCards.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center my-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#004ac6] flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-[32px]">assignment_turned_in</span>
            </div>
            <h3 className="text-base font-bold text-slate-800">Không có thẻ nào</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              {activeTab === 'pending'
                ? 'Không có pallet nào đang chờ điều chuyển. Bạn có thể quét mã hoặc nạp file Excel.'
                : 'Chưa có thẻ nào được hoàn tất trong ca này.'}
            </p>
          </div>
        ) : (
          filteredCards.map(card => {
            const isDone = card.status === 'COMPLETED' || (card.status as string) === 'completed';
            const isOverduePending = !isDone && isCreatedBeforeToday(card.created_at);
            const displayTime = formatDisplayTime(card.created_at, card.createdAt);

            return (
              <div
                key={card.id}
                onClick={() => onSelectCard(card)}
                className={`relative rounded-2xl p-4 shadow-sm hover:shadow-md active:scale-[0.99] transition-all cursor-pointer overflow-hidden border ${isOverduePending
                  ? 'bg-rose-50/75 border-rose-300 ring-1 ring-rose-200/90 shadow-[0_2px_12px_rgba(244,63,94,0.08)]'
                  : 'bg-white border-slate-200/90'
                  }`}
              >
                {/* Left accent strip */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1.5 ${isDone
                    ? 'bg-emerald-500'
                    : isOverduePending
                      ? 'bg-rose-500'
                      : getBorderColor(card)
                    }`}
                />

                <div className="flex items-start justify-between gap-2 pl-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-code-md text-base text-slate-900 tracking-wide font-bold">
                        {card.palletId}
                      </span>
                      {/* Badge cảnh báo thẻ tồn ngày trước cần xử lý trước theo rule FIFO */}
                      {isOverduePending && (
                        <span className="px-2 py-0.5 rounded-md text-[10.5px] font-bold uppercase border bg-rose-100 text-rose-800 border-rose-300 flex items-center gap-1 shadow-2xs">
                          <span className="material-symbols-outlined text-[13px] text-rose-600">history</span>
                          Tồn ngày trước (FIFO)
                        </span>
                      )}
                      {card.priority === 'urgent' && (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold uppercase border bg-amber-50 text-amber-800 border-amber-200">
                          Ưu tiên 1
                        </span>
                      )}
                      {card.priority === 'high' && (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold uppercase border bg-rose-50 text-rose-700 border-rose-200">
                          Dễ vỡ
                        </span>
                      )}
                      <span className="font-code-md text-[11px] text-slate-400">
                        #{card.id}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                      <span className={`material-symbols-outlined text-[15px] ${isOverduePending ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>
                        {isOverduePending ? 'history' : 'schedule'}
                      </span>
                      <span className={isOverduePending ? 'font-bold text-rose-700' : ''}>
                        {displayTime}
                      </span>
                      <span className="mx-0.5 text-slate-300">•</span>
                      <span className="material-symbols-outlined text-[15px] text-slate-400">
                        person
                      </span>
                      <span className="text-slate-700 font-medium">{card.driver}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end flex-shrink-0">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border ${isDone
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : isOverduePending
                          ? 'bg-rose-100 text-rose-900 border-rose-300 font-bold'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${isDone
                          ? 'bg-emerald-500'
                          : isOverduePending
                            ? 'bg-rose-600 animate-pulse'
                            : 'bg-amber-500'
                          }`}
                      ></span>
                      {isDone ? 'Đã hoàn tất' : isOverduePending ? 'Ưu tiên FIFO' : 'Chờ Nhập'}
                    </span>
                  </div>
                </div>

                {/* Destination banner */}
                <div className={`my-3 pl-3 pr-3.5 py-2.5 rounded-xl flex items-center justify-between border ${isOverduePending
                  ? 'bg-white/90 border-rose-200/90 shadow-2xs'
                  : 'bg-slate-50 border-slate-100'
                  }`}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isOverduePending ? 'bg-rose-100 text-rose-700' : 'bg-blue-50 text-[#004ac6]'}`}>
                      <span className="material-symbols-outlined text-[18px]">
                        {getDestinationIcon(card.destinationLocation)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider flex items-center gap-1.5">
                        <span>Vị trí đích</span>
                        {isRackSlotCode(card.destinationCode) && (
                          <span className="px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700 text-[9px] font-bold">
                            Hộc Rack
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-bold text-slate-800 truncate" title={card.destinationCode ? `${card.destinationLocation} (${card.destinationCode})` : card.destinationLocation}>
                        <span>{card.destinationLocation}</span>
                        {isRackSlotCode(card.destinationCode) && (
                          <span className="font-code-md text-[11px] font-semibold text-indigo-700 ml-1.5">
                            • {card.destinationCode}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-slate-400 text-[18px] flex-shrink-0">
                    arrow_forward
                  </span>
                </div>

                {/* Card footer actions */}
                <div className="pl-1 sm:pl-2 pt-0.5 flex items-center justify-between gap-1.5 sm:gap-2">
                  <div className="flex items-center gap-1 text-slate-500 text-[11px] sm:text-xs min-w-0">
                    <span className={`material-symbols-outlined text-[15px] sm:text-[16px] flex-shrink-0 ${isOverduePending ? 'text-rose-600' : 'text-[#004ac6]'}`}>
                      touch_app
                    </span>
                    <span className={`truncate ${isOverduePending ? 'text-rose-700 font-semibold' : ''}`}>
                      {isOverduePending ? 'Chạm để xử lý ngay' : 'Chạm để mở đối soát QR'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      onSelectCard(card);
                    }}
                    className={`h-8 sm:h-9 px-2.5 sm:px-3.5 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1 sm:gap-1.5 active:scale-95 transition-all flex-shrink-0 ${isDone
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      : isOverduePending
                        ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200'
                        : 'bg-[#004ac6] hover:bg-blue-700 text-white'
                      }`}
                  >
                    <span className="material-symbols-outlined text-[15px] sm:text-[17px]">
                      {isDone ? 'visibility' : 'qr_code_2'}
                    </span>
                    <span>{isDone ? 'Xem chi tiết' : isOverduePending ? 'Xử lý FIFO' : 'Đối soát'}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
