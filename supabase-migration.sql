-- ============================================
-- MUQORRIB QURBAN - Database Schema
-- Jalankan SQL ini di Supabase SQL Editor
-- ============================================

-- ENUM types
CREATE TYPE jenis_hewan AS ENUM ('sapi', 'domba');
CREATE TYPE bagian_hewan AS ENUM ('kepala', 'cokor', 'buntut', 'siki', 'ati', 'kulit');

-- Tabel Hewan Qurban
CREATE TABLE hewan_qurban (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jenis jenis_hewan NOT NULL,
    nomor_hewan INT NOT NULL,
    berat_kg DECIMAL(10,2),
    catatan TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel Muqorrib (Pemesan Qurban)
CREATE TABLE muqorrib (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hewan_qurban_id UUID REFERENCES hewan_qurban(id) ON DELETE CASCADE,
    nomor_urut INT NOT NULL,
    nama_lengkap TEXT NOT NULL,
    nama_pendek TEXT,
    alamat TEXT,
    pesanan TEXT,
    pesanan_tambahan TEXT,
    pesanan_1 TEXT,
    pesanan_2 TEXT,
    no_hp TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel Perolehan (Hasil Pemotongan)
CREATE TABLE perolehan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hewan_qurban_id UUID REFERENCES hewan_qurban(id) ON DELETE CASCADE,
    bagian bagian_hewan NOT NULL,
    jumlah_ada INT DEFAULT 0,
    jumlah_diambil INT DEFAULT 0,
    jumlah_sisa INT DEFAULT 0,
    jumlah_kurang INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel Ringkasan Daging
CREATE TABLE daging_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jenis jenis_hewan NOT NULL,
    daging_kg DECIMAL(10,2) DEFAULT 0,
    total_daging_bersih_kg DECIMAL(10,2) DEFAULT 0,
    total_penerima INT DEFAULT 0,
    total_berat_per_orang_kg DECIMAL(10,6) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel Mustahiq (Penerima Daging)
CREATE TABLE mustahiq (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nomor_urut INT NOT NULL,
    nama_kelompok TEXT NOT NULL,
    jiwa_kk INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel Panitia
CREATE TABLE panitia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nomor_urut INT NOT NULL,
    nama_lengkap TEXT NOT NULL,
    jabatan TEXT,
    no_hp TEXT,
    bagian TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_muqorrib_hewan ON muqorrib(hewan_qurban_id);
CREATE INDEX idx_perolehan_hewan ON perolehan(hewan_qurban_id);
CREATE INDEX idx_muqorrib_nama ON muqorrib(nama_lengkap);

-- Row Level Security (allow all for now - no auth)
ALTER TABLE hewan_qurban ENABLE ROW LEVEL SECURITY;
ALTER TABLE muqorrib ENABLE ROW LEVEL SECURITY;
ALTER TABLE perolehan ENABLE ROW LEVEL SECURITY;
ALTER TABLE daging_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE mustahiq ENABLE ROW LEVEL SECURITY;
ALTER TABLE panitia ENABLE ROW LEVEL SECURITY;

-- Public access policies (no auth)
CREATE POLICY "Allow all on hewan_qurban" ON hewan_qurban FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on muqorrib" ON muqorrib FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on perolehan" ON perolehan FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on daging_summary" ON daging_summary FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on mustahiq" ON mustahiq FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on panitia" ON panitia FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- SEED DATA (Sample Data dari Spreadsheet)
-- ============================================

-- Hewan Qurban - Sapi (3 ekor)
INSERT INTO hewan_qurban (jenis, nomor_hewan) VALUES
  ('sapi', 1),
  ('sapi', 2),
  ('sapi', 3);

-- Hewan Qurban - Domba (8 ekor)
INSERT INTO hewan_qurban (jenis, nomor_hewan) VALUES
  ('domba', 1),
  ('domba', 2),
  ('domba', 3),
  ('domba', 4),
  ('domba', 5),
  ('domba', 6),
  ('domba', 7),
  ('domba', 8);

-- Daging Summary
INSERT INTO daging_summary (jenis, daging_kg, total_daging_bersih_kg, total_penerima) VALUES
  ('sapi', 300, 300, 650);

-- Mustahiq
INSERT INTO mustahiq (nomor_urut, nama_kelompok, jiwa_kk) VALUES
  (1, 'WARGA RT. 02', 67),
  (2, 'WARGA RT. 03', 60),
  (3, 'WARGA RT. 04', 145),
  (4, 'WARGA RT. 05', 180),
  (5, 'IBU2 YG MASAK', 7),
  (6, 'PANITIA INTI', 34),
  (7, 'PANITIA SUSULAN', 18),
  (8, 'PKK', 10),
  (9, 'DTA', 12),
  (10, 'KELURAHAN', 10),
  (11, 'PENAGIH IURAN', 4),
  (12, 'PETUGAS SAMPAH', 3),
  (13, 'BABINKATIBMAS', 1),
  (14, 'BABINSA', 1),
  (15, 'LINMAS RW', 5),
  (16, 'PESANAN MUQORRIB', 58),
  (17, 'KEBERSIHAN', 35);
