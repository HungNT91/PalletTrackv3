-- =========================================================
-- PalletTrack WMS
-- Schema tong hop sau khi tinh gon (kem bang Nhan vien dang nhap)
-- PostgreSQL / Supabase
-- =========================================================

-- Bật extension tạo UUID (nếu chưa có)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================
-- 1. Danh muc vi tri kho
-- Chi luu ten vi tri va ma vi tri.
-- =========================================================
CREATE TABLE IF NOT EXISTS public.warehouse_locations (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL
);

-- =========================================================
-- 2. Danh muc pallet
-- PENDING   = Cho
-- COMPLETED = Hoan tat
-- =========================================================
CREATE TABLE IF NOT EXISTS public.pallets (
    id TEXT PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'COMPLETED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- 3. The dieu chuyen
-- destination_code tham chieu ma vi tri trong warehouse_locations.
-- completed_at duoc dien khi status chuyen sang COMPLETED.
-- =========================================================
CREATE TABLE IF NOT EXISTS public.transfer_cards (
    id TEXT PRIMARY KEY,
    pallet_id TEXT NOT NULL
        REFERENCES public.pallets(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    destination_location TEXT NOT NULL,
    destination_code TEXT NOT NULL
        REFERENCES public.warehouse_locations(code)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'COMPLETED')),
    driver TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    reconciled_by TEXT,
    notes TEXT,
    CONSTRAINT transfer_cards_completion_time_check CHECK (
        (status = 'PENDING' AND completed_at IS NULL)
        OR
        (status = 'COMPLETED' AND completed_at IS NOT NULL)
    )
);

-- =========================================================
-- 4. Nhat ky thao tac
-- Chi ghi nhan hanh dong, nguoi thuc hien va thoi diem.
-- =========================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_card_id TEXT
        REFERENCES public.transfer_cards(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    action TEXT NOT NULL
        CHECK (action IN (
            'CREATE_TRANSFER_CARD',
            'ASSIGN_DRIVER',
            'CHANGE_DRIVER',
            'COMPLETE_TRANSFER',
            'UPDATE_PALLET_STATUS'
        )),
    operator TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- 5. Danh muc nhan vien dang nhap he thong
-- Quan ly thong tin dang nhap: ma, ten, mat khau, chuc danh
-- =========================================================
CREATE TABLE IF NOT EXISTS public.employees (
    code TEXT PRIMARY KEY,                       -- Ma nhan vien (VD: 'OP-2048')
    name TEXT NOT NULL,                          -- Ten nhan vien (VD: 'Tran Minh')
    password TEXT NOT NULL,                      -- Mat khau dang nhap (VD: '123456')
    role TEXT NOT NULL DEFAULT 'Nhân viên vận hành', -- Chuc danh: 'Nhân viên vận hành', 'Tài xế xe nâng', 'Quản lý kho',...
    is_active BOOLEAN NOT NULL DEFAULT true,     -- Trang thai tai khoan (true = hoat dong)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- Function va trigger tu dong cap nhat updated_at
-- =========================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pallets_updated_at ON public.pallets;
CREATE TRIGGER trg_pallets_updated_at
BEFORE UPDATE ON public.pallets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_employees_updated_at ON public.employees;
CREATE TRIGGER trg_employees_updated_at
BEFORE UPDATE ON public.employees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- Ham RPC ho tro xac thuc dang nhap nhan vien an toan
-- =========================================================
CREATE OR REPLACE FUNCTION public.verify_employee_login(
    p_code TEXT,
    p_password TEXT
)
RETURNS TABLE (
    code TEXT,
    name TEXT,
    role TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT e.code, e.name, e.role
    FROM public.employees e
    WHERE UPPER(e.code) = UPPER(p_code)
      AND e.password = p_password
      AND e.is_active = true;
END;
$$;

-- =========================================================
-- Index phuc vu cac truy van thuong gap
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_pallets_status
    ON public.pallets(status);

CREATE INDEX IF NOT EXISTS idx_transfer_cards_pallet
    ON public.transfer_cards(pallet_id);

CREATE INDEX IF NOT EXISTS idx_transfer_cards_status
    ON public.transfer_cards(status);

CREATE INDEX IF NOT EXISTS idx_transfer_cards_destination_code
    ON public.transfer_cards(destination_code);

CREATE INDEX IF NOT EXISTS idx_audit_logs_transfer_card
    ON public.audit_logs(transfer_card_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
    ON public.audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_employees_code
    ON public.employees(code);

-- =========================================================
-- Cap quyen truy cap (GRANT) cho cac role cua Supabase
-- =========================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- =========================================================
-- Row Level Security (RLS) - GIU BAT RLS MA VAN GHI DUOC DU LIEU
-- =========================================================
ALTER TABLE public.warehouse_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Xoa cac policy cu neu co de tranh xung dot
DROP POLICY IF EXISTS "warehouse_locations_select" ON public.warehouse_locations;
DROP POLICY IF EXISTS "warehouse_locations_insert" ON public.warehouse_locations;
DROP POLICY IF EXISTS "warehouse_locations_update" ON public.warehouse_locations;
DROP POLICY IF EXISTS "warehouse_locations_delete" ON public.warehouse_locations;
DROP POLICY IF EXISTS "Allow public read-write warehouse_locations" ON public.warehouse_locations;

DROP POLICY IF EXISTS "pallets_select" ON public.pallets;
DROP POLICY IF EXISTS "pallets_insert" ON public.pallets;
DROP POLICY IF EXISTS "pallets_update" ON public.pallets;
DROP POLICY IF EXISTS "pallets_delete" ON public.pallets;
DROP POLICY IF EXISTS "Allow public read-write pallets" ON public.pallets;

DROP POLICY IF EXISTS "transfer_cards_select" ON public.transfer_cards;
DROP POLICY IF EXISTS "transfer_cards_insert" ON public.transfer_cards;
DROP POLICY IF EXISTS "transfer_cards_update" ON public.transfer_cards;
DROP POLICY IF EXISTS "transfer_cards_delete" ON public.transfer_cards;
DROP POLICY IF EXISTS "Allow public read-write transfer_cards" ON public.transfer_cards;

DROP POLICY IF EXISTS "audit_logs_select" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_update" ON public.audit_logs;
DROP POLICY IF EXISTS "Allow public read-write audit_logs" ON public.audit_logs;

DROP POLICY IF EXISTS "employees_select" ON public.employees;
DROP POLICY IF EXISTS "employees_insert" ON public.employees;
DROP POLICY IF EXISTS "employees_update" ON public.employees;
DROP POLICY IF EXISTS "Allow public read-write employees" ON public.employees;

-- 1. Bảng warehouse_locations
CREATE POLICY "warehouse_locations_select" ON public.warehouse_locations FOR SELECT TO anon, authenticated, service_role USING (true);
CREATE POLICY "warehouse_locations_insert" ON public.warehouse_locations FOR INSERT TO anon, authenticated, service_role WITH CHECK (true);
CREATE POLICY "warehouse_locations_update" ON public.warehouse_locations FOR UPDATE TO anon, authenticated, service_role USING (true) WITH CHECK (true);
CREATE POLICY "warehouse_locations_delete" ON public.warehouse_locations FOR DELETE TO anon, authenticated, service_role USING (true);

-- 2. Bảng pallets (Cho phep ca SELECT, INSERT, UPDATE de lenh upsert hoat dong)
CREATE POLICY "pallets_select" ON public.pallets FOR SELECT TO anon, authenticated, service_role USING (true);
CREATE POLICY "pallets_insert" ON public.pallets FOR INSERT TO anon, authenticated, service_role WITH CHECK (true);
CREATE POLICY "pallets_update" ON public.pallets FOR UPDATE TO anon, authenticated, service_role USING (true) WITH CHECK (true);
CREATE POLICY "pallets_delete" ON public.pallets FOR DELETE TO anon, authenticated, service_role USING (true);

-- 3. Bảng transfer_cards (Cho phep tao the va cap nhat doi soat)
CREATE POLICY "transfer_cards_select" ON public.transfer_cards FOR SELECT TO anon, authenticated, service_role USING (true);
CREATE POLICY "transfer_cards_insert" ON public.transfer_cards FOR INSERT TO anon, authenticated, service_role WITH CHECK (true);
CREATE POLICY "transfer_cards_update" ON public.transfer_cards FOR UPDATE TO anon, authenticated, service_role USING (true) WITH CHECK (true);
CREATE POLICY "transfer_cards_delete" ON public.transfer_cards FOR DELETE TO anon, authenticated, service_role USING (true);

-- 4. Bảng audit_logs (Ghi log va doc log)
CREATE POLICY "audit_logs_select" ON public.audit_logs FOR SELECT TO anon, authenticated, service_role USING (true);
CREATE POLICY "audit_logs_insert" ON public.audit_logs FOR INSERT TO anon, authenticated, service_role WITH CHECK (true);
CREATE POLICY "audit_logs_update" ON public.audit_logs FOR UPDATE TO anon, authenticated, service_role USING (true) WITH CHECK (true);

-- 5. Bảng employees (Dang nhap nhan vien)
CREATE POLICY "employees_select" ON public.employees FOR SELECT TO anon, authenticated, service_role USING (true);
CREATE POLICY "employees_insert" ON public.employees FOR INSERT TO anon, authenticated, service_role WITH CHECK (true);
CREATE POLICY "employees_update" ON public.employees FOR UPDATE TO anon, authenticated, service_role USING (true) WITH CHECK (true);

-- =========================================================
-- Du lieu mau ban dau (Seed Data)
-- =========================================================
INSERT INTO public.warehouse_locations (code, name)
VALUES
('TS-01', 'Tiền soạn 1 - Kho 1'),
('TS-02', 'Tiền soạn 2 - Kho 1'),
('TS-03', 'Tiền soạn 1 - Kho 2'),
('TS-04', 'Tiền soạn 2 - Kho 2'),
('RACK-01', 'Rack Thường'),
('RACK-02', 'Rack Cắt Liều'),
('BUFFER-01', 'Khu đệm nhập (Buffer In)')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO public.pallets (id, status)
VALUES
('K01', 'PENDING'),
('K02', 'PENDING'),
('T01', 'PENDING'),
('T02', 'COMPLETED')
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

INSERT INTO public.transfer_cards (id, pallet_id, destination_location, destination_code, status, driver, created_at, completed_at, reconciled_by, notes)
VALUES
('TX-9024', 'K01', 'Tiền soạn 1 - Kho 1', 'TS-01', 'PENDING', 'Trần Minh', NOW() - INTERVAL '10 minutes', NULL, NULL, 'Lệnh bốc dỡ ca sáng'),
('TX-9025', 'K02', 'Rack Thường', 'RACK-01', 'PENDING', 'Lê Hữu Hoàng', NOW() - INTERVAL '25 minutes', NULL, NULL, 'Chờ nâng lên rack A'),
('TX-9026', 'T01', 'Tiền soạn 2 - Kho 1', 'TS-02', 'PENDING', 'Võ Quốc Anh', NOW() - INTERVAL '40 minutes', NULL, NULL, 'Hàng linh kiện điện tử'),
('TX-9027', 'T02', 'Khu đệm nhập (Buffer In)', 'BUFFER-01', 'COMPLETED', 'Nguyễn Tùng', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '15 minutes', 'Trần Minh', 'Đã đối soát quét QR')
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

INSERT INTO public.audit_logs (transfer_card_id, action, operator, created_at)
VALUES
('TX-9024', 'CREATE_TRANSFER_CARD', 'Trần Minh', NOW() - INTERVAL '10 minutes'),
('TX-9025', 'ASSIGN_DRIVER', 'Lê Hữu Hoàng', NOW() - INTERVAL '20 minutes'),
('TX-9027', 'COMPLETE_TRANSFER', 'Trần Minh', NOW() - INTERVAL '15 minutes');

-- Du lieu mau danh sach nhan vien kho
INSERT INTO public.employees (code, name, password, role)
VALUES
('OP-2048', 'Trần Minh', '123456', 'Nhân viên vận hành'),
('OP-5512', 'Lê Hữu Hoàng', '123456', 'Tài xế xe nâng'),
('OP-3104', 'Nguyễn Văn Đức', '123456', 'Nhân viên kiểm kê'),
('QL-001', 'Nguyễn Quản Lý', '123456', 'Quản lý kho')
ON CONFLICT (code) DO UPDATE 
SET name = EXCLUDED.name,
    password = EXCLUDED.password,
    role = EXCLUDED.role;
