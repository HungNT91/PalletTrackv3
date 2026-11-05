/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Pallet, WarehouseLocation, TransferCard, ShiftSession, AuditLog, WMSStats } from './types';
import { wmsApi } from './api/wmsApi';
import { Header } from './components/Header';
import { BottomNav, TabType } from './components/BottomNav';
import { ScanEntryTab } from './components/ScanEntryTab';
import { TaskQueueTab } from './components/TaskQueueTab';
import { ReconciliationModal } from './components/ReconciliationModal';
import { DestinationModal } from './components/DestinationModal';
import { BulkImportTab } from './components/BulkImportTab';
import { ShiftLoginModal } from './components/ShiftLoginModal';
import { SyncSplashModal } from './components/SyncSplashModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import { Toast, ToastData } from './components/Toast';
import { OfflineIndicator } from './components/OfflineIndicator';
import { LoginScreen } from './components/LoginScreen';

const LOCAL_STORAGE_SESSION_KEY = 'pallettrack_operator_session';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('scan');
  const [cards, setCards] = useState<TransferCard[]>([]);
  const [pallets, setPallets] = useState<Pallet[]>([]);
  const [locations, setLocations] = useState<WarehouseLocation[]>([]);
  const [stats, setStats] = useState<WMSStats | null>(null);

  // Persistent shift session from localStorage
  const [shift, setShift] = useState<ShiftSession | null>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.operatorName && parsed?.operatorCode) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading session from localStorage:', e);
    }
    return null;
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return Boolean(parsed?.operatorName && parsed?.operatorCode);
      }
    } catch {
      return false;
    }
    return false;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Modals state
  const [selectedCardForReconcile, setSelectedCardForReconcile] = useState<TransferCard | null>(null);
  const [isReconcileModalOpen, setIsReconcileModalOpen] = useState<boolean>(false);
  const [selectedPalletForDest, setSelectedPalletForDest] = useState<Pallet | null>(null);
  const [isDestModalOpen, setIsDestModalOpen] = useState<boolean>(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);

  // Toast feedback
  const [toast, setToast] = useState<ToastData | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success', icon?: string) => {
    setToast({ message, type, icon });
    setTimeout(() => {
      setToast(null);
    }, 2800);
  }, []);

  // Fetch all centralized warehouse data
  const fetchData = useCallback(async () => {
    try {
      const [cardsData, palletsData, locationsData, statsData, shiftData, logsData] = await Promise.all([
        wmsApi.getCards(),
        wmsApi.getPallets(),
        wmsApi.getLocations(),
        wmsApi.getStats(),
        wmsApi.getShift(),
        wmsApi.getAuditLogs(),
      ]);

      setCards(cardsData);
      setPallets(palletsData);
      setLocations(locationsData);
      setStats(statsData);
      setAuditLogs(logsData);

      // Verify localStorage operator session to maintain login
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.operatorName && parsed?.operatorCode) {
            setShift(parsed);
            setIsLoggedIn(true);
            return;
          }
        }
      } catch (e) {
        console.warn('Error reading session from localStorage:', e);
      }

      // If no session found in localStorage, require login
      setIsLoggedIn(false);
      setShift(null);
    } catch (err) {
      console.error('Error fetching WMS data:', err);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Login and persist to localStorage
  const handleLogin = async (newSession: ShiftSession) => {
    try {
      // 1. Save locally in localStorage to persist login in work session
      localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(newSession));
      setShift(newSession);
      setIsLoggedIn(true);
      setActiveTab('scan');

      // 2. Synchronize with central WMS server
      try {
        const serverSession = await wmsApi.updateShift(newSession);
        if (serverSession) {
          setShift(serverSession);
          localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(serverSession));
        }
      } catch (e) {
        console.warn('Background sync with WMS server failed, running with local session:', e);
      }

      showToast(
        `Đăng nhập thành công! Chào mừng ${newSession.operatorName} (${newSession.operatorCode})`,
        'success',
        'badge'
      );

      await fetchData();
    } catch (err: any) {
      showToast(err.message || 'Lỗi đăng nhập', 'error');
    }
  };

  // Handle Logout and clear localStorage
  const handleLogout = () => {
    try {
      localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
    } catch (e) {
      console.warn('Error clearing localStorage session:', e);
    }
    setIsLoggedIn(false);
    setShift(null);
    setIsShiftModalOpen(false);
    showToast('Đã đăng xuất phiên làm việc an toàn.', 'info', 'logout');
  };

  // When user clicks a card in queue or direct reconciliation
  const handleOpenReconcile = (card: TransferCard) => {
    setSelectedCardForReconcile(card);
    setIsReconcileModalOpen(true);
  };

  // Reconcile and complete pallet transfer
  const handleReconcile = async (cardId: string) => {
    try {
      const updatedCard = await wmsApi.reconcileCard(cardId, shift?.operatorName);
      showToast(`Đã đối soát hoàn tất kiện ${updatedCard.palletId} sang ${updatedCard.destinationLocation}!`, 'success', 'verified');
      setIsReconcileModalOpen(false);
      setSelectedCardForReconcile(null);
      await fetchData();
    } catch (err: any) {
      showToast(err.message || 'Lỗi đối soát', 'error');
    }
  };

  // Initiate destination location modal from scan tab
  const handleOpenDestModal = (pallet: Pallet) => {
    setSelectedPalletForDest(pallet);
    setIsDestModalOpen(true);
  };

  // Confirm creating a new transfer card in central queue
  const handleConfirmDestination = async (
    destinationLocation: string,
    destinationCode: string,
    driver: string
  ) => {
    if (!selectedPalletForDest) return;

    try {
      const newCard = await wmsApi.createCard({
        palletId: selectedPalletForDest.id,
        destinationLocation,
        destinationCode,
        driver,
        priority: selectedPalletForDest.priority,
        pallet: selectedPalletForDest,
      });

      showToast(`Đã tạo lệnh #${newCard.id} điều chuyển tới ${destinationLocation}!`, 'success', 'done_all');
      await fetchData();
      setActiveTab('queue');
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi tạo thẻ điều chuyển', 'error');
    }
  };

  // Handle batch import from spreadsheet
  const handleBatchImport = async (
    items: Array<{ palletId: string; destination: string; quantity: number; notes: string }>
  ) => {
    try {
      const created = await wmsApi.batchCreateCards(items);
      showToast(`Đã nạp thành công ${created.length} thẻ chờ vào máy chủ WMS!`, 'success', 'cloud_done');
      await fetchData();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi import hàng loạt', 'error');
    }
  };

  // Handle update operator shift
  const handleSaveShift = async (updated: Partial<ShiftSession>) => {
    try {
      const newShift = await wmsApi.updateShift(updated);
      setShift(newShift);
      try {
        localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(newShift));
      } catch (e) {
        console.warn('Error saving updated session to localStorage:', e);
      }
      showToast(`Đã xác thực phiên làm việc: ${newShift.operatorName} (${newShift.operatorCode})`, 'success');
      await fetchData();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi cập nhật ca', 'error');
    }
  };

  // Handle reset data to initial defaults
  const handleResetData = async () => {
    try {
      await wmsApi.resetData();
      showToast('Đã khôi phục toàn bộ dữ liệu mẫu ban đầu!', 'info', 'restart_alt');
      await fetchData();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi đặt lại dữ liệu', 'error');
    }
  };

  // Get current card for the dedicated "Chi tiết thẻ" tab
  const pendingCards = cards.filter(c => c.status === 'PENDING');
  const primaryPendingCard = pendingCards[0] || cards[0] || null;

  // If operator is not logged in, show dedicated LoginScreen
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-900 font-sans antialiased">
        <Toast toast={toast} onClose={() => setToast(null)} />
        <LoginScreen
          onLogin={handleLogin}
          initialOperatorCode={shift?.operatorCode || 'OP-2048'}
        />
        <OfflineIndicator />
      </div>
    );
  }

  return (
    <div className="bg-[#f8f9ff] text-slate-900 min-h-screen flex flex-col antialiased selection:bg-blue-100 selection:text-[#004ac6] touch-pan-y w-full">
      {/* Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Top Header */}
      <Header
        shift={shift}
        unreadCount={auditLogs.length > 0 ? 1 : 0}
        onOpenShiftModal={() => setIsShiftModalOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenSync={() => setIsSyncModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content View with responsive safe paddings and fluid vertical touch-scrolling */}
      <main className="flex-1 w-full pt-15 sm:pt-18 pb-28 sm:pb-32 touch-pan-y">
        {/* Tab 1: Quét / Nhập (Scan & Manual Entry) */}
        {activeTab === 'scan' && (
          <ScanEntryTab
            recentPallets={pallets}
            onOpenDestinationModal={handleOpenDestModal}
            onNavigateToImport={() => setActiveTab('import')}
          />
        )}

        {/* Tab 2: Thẻ chờ (Task Queue) */}
        {activeTab === 'queue' && (
          <TaskQueueTab
            cards={cards}
            stats={stats}
            onSelectCard={handleOpenReconcile}
            onRefresh={fetchData}
          />
        )}

        {/* Tab 3: Chi tiết thẻ (Dedicated Card Detail & Reconciliation View) */}
        {activeTab === 'reconcile' && (
          <div className="flex flex-col w-full px-3 sm:px-4 max-w-2xl mx-auto pb-12 pt-1 sm:pt-2 touch-pan-y">
            <div className="flex items-center justify-between py-1.5 sm:py-2 gap-2">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#004ac6] flex-shrink-0"></span>
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight truncate">
                  Đối soát & Chi tiết thẻ
                </h1>
              </div>
              <span className="text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-blue-50 text-[#004ac6] border border-blue-200 font-code-md font-bold flex-shrink-0">
                WH-01 SÀN ĐỐI SOÁT
              </span>
            </div>

            {primaryPendingCard ? (
              <div className="space-y-4 mt-2">
                {/* Active Card Card Trigger */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                        Lệnh đang chờ đối soát ưu tiên
                      </span>
                      <span className="font-code-md text-xl font-bold text-[#004ac6]">
                        {primaryPendingCard.palletId}
                      </span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold uppercase">
                      {primaryPendingCard.statusLabel || 'Chờ đối soát'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                        Vị trí đích
                      </span>
                      <span className="font-bold text-slate-800 mt-0.5 block truncate">
                        {primaryPendingCard.destinationLocation}
                      </span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                        Trạng thái
                      </span>
                      <span className="font-bold text-slate-800 mt-0.5 block truncate">
                        {primaryPendingCard.status === 'COMPLETED' ? 'Đã hoàn tất' : 'Chờ Nhập'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenReconcile(primaryPendingCard)}
                    className="w-full h-12 rounded-xl neu-button text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-[20px]">qr_code_2</span>
                    <span>Mở màn hình đối soát 2 mã QR</span>
                  </button>
                </div>

                {/* List of other cards for quick switching */}
                <div className="flex flex-col gap-2">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Các thẻ khác trong ca làm việc ({cards.length})
                  </h3>
                  {cards.map(card => (
                    <div
                      key={card.id}
                      onClick={() => handleOpenReconcile(card)}
                      className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer transition-all shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold ${
                            card.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-blue-50 text-[#004ac6] border border-blue-200'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            {card.status === 'COMPLETED' ? 'verified' : 'qr_code'}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-code-md text-xs font-bold text-slate-900">
                              {card.palletId}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              #{card.id}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500">
                            Đích: {card.destinationLocation}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#004ac6]">
                        <span>{card.status === 'COMPLETED' ? 'Đã xong' : 'Đối soát'}</span>
                        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center mt-4">
                <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">
                  verified
                </span>
                <p className="text-xs text-slate-500">Chưa có thẻ nào cần đối soát.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Import (Bulk Ingest) */}
        {activeTab === 'import' && (
          <BulkImportTab
            onBatchImport={handleBatchImport}
            onSuccessNavigate={() => setActiveTab('queue')}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        pendingCount={pendingCards.length}
      />

      {/* Destination Location Modal */}
      <DestinationModal
        isOpen={isDestModalOpen}
        pallet={selectedPalletForDest}
        locations={locations}
        currentDriver={shift?.operatorName}
        operatorCode={shift?.operatorCode}
        onClose={() => setIsDestModalOpen(false)}
        onConfirm={handleConfirmDestination}
      />

      {/* Dual QR Code Reconciliation Modal */}
      <ReconciliationModal
        isOpen={isReconcileModalOpen}
        card={selectedCardForReconcile}
        onClose={() => setIsReconcileModalOpen(false)}
        onReconcile={handleReconcile}
      />

      {/* Shift Login & Station Modal */}
      <ShiftLoginModal
        isOpen={isShiftModalOpen}
        currentShift={shift}
        onClose={() => setIsShiftModalOpen(false)}
        onSaveShift={handleSaveShift}
        onLogout={handleLogout}
      />

      {/* Real-time Data Sync Splash Modal */}
      <SyncSplashModal
        isOpen={isSyncModalOpen}
        pendingCount={pendingCards.length}
        onClose={() => setIsSyncModalOpen(false)}
      />

      {/* Central Notification and Audit Drawer */}
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        logs={auditLogs}
        onClose={() => setIsNotificationsOpen(false)}
        onResetData={handleResetData}
      />

      {/* Real-time Offline Connectivity Status */}
      <OfflineIndicator />
    </div>
  );
}
