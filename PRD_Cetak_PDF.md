# 📄 PRD: Print & Document Center (Cetak & Export PDF) — Muqorrib Qurban

**Dokumen Spesifikasi Produk (PRD) — Standar Big 4 Tech & FAANG**  
**Status:** `PROPOSED` | **Owner:** System Analyst & Senior UI/UX Architect  
**Target Rilis:** Q2 2026  

---

## 1. Executive Summary & Objective

Selama hari raya Idul Adha, koordinasi lapangan sangat bergantung pada **dokumen cetak fisik** yang tahan air, mudah dibaca di bawah sinar matahari langsung, dan siap dibagikan ke panitia penyembelihan, pengemasan, dan kurir distribusi. 

Fitur **Print & Document Center** bertujuan untuk mendigitalisasi pembuatan 4 dokumen operasional krusial langsung dari web aplikasi **Muqorrib Qurban** ke format cetak fisik (kertas A4) dan file PDF vektor beresolusi tinggi tanpa lag pemrosesan.

### Dokumen yang Didukung:
1. **Daftar Muqorrib Sapi & Domba:** Tabel formal pengelompokan muqorrib per nomor hewan (dengan sel tergabung secara vertikal) untuk ditempel di papan pengumuman/dinding kandang.
2. **Label Pesanan Muqorrib:** Grid kartu label potong (cut-out labels) yang disematkan langsung pada kantong plastik daging muqorrib untuk meminimalisir kesalahan distribusi.
3. **Tanda Terima Pesanan:** Lembar tanda tangan serah terima daging muqorrib formal yang mencantumkan nama, alamat, rincian pesanan, dan kolom tanda tangan penerima serta tanda tangan DKM/Ketua Panitia.
4. **Data Ringkasan Muqorrib:** Lembar pengecekan cepat (checklist) per kelompok muqorrib hewan.

---

## 2. User Persona & Pain Points (Analisis Kebutuhan)

| Persona | Kebutuhan Utama | Hambatan Utama (Pain Points) | Solusi Sistem Baru |
|---------|-----------------|------------------------------|--------------------|
| **Ketua Panitia** (DKM) | Menandatangani berkas pertanggungjawaban formal & laporan muqorrib. | Layout cetakan Excel berantakan saat dicetak, kolom terpotong margin kertas. | Dokumen A4 berstandar resmi, presisi, dengan header kop surat DKM otomatis. |
| **Tim Pengemasan** (Jagal/Plastik) | Menempelkan label pesanan ke kantong daging secara cepat & akurat. | Bingung membedakan plastik muqorrib yang memiliki pesanan khusus (misal "Paha Depan", "30 BKS"). | Label pesanan berbentuk grid kartu berukuran besar yang siap digunting dan ditempel. |
| **Tim Distribusi/Logistik** | Melakukan serah terima daging ke perwakilan muqorrib secara tercatat. | Kehilangan bukti serah-terima fisik, memicu komplain muqorrib yang merasa belum menerima daging. | Lembar Tanda Terima Pesanan formal per muqorrib dengan kolom tanda tangan fisik terintegrasi. |

---

## 3. Core Features & Functional Specifications

Modul ini akan diakses melalui menu sidebar baru bernama **`Cetak Dokumen` (`/cetak`)**. Modul ini menyediakan antarmuka interaktif di mana panitia dapat mempratinjau dokumen (*live preview*), menyesuaikan parameter secara dinamis, dan melakukan cetak langsung (*print/save to PDF*).

### 3.1 Dokumen 1: Daftar Muqorrib Sapi & Domba (Kop Surat Resmi)
* **Layout:** Potret A4 dengan Kop Surat DKM Sabilul Fitroh di bagian atas.
* **Fitur Utama:**
  * Penggabungan baris vertikal (*vertical row merging*) untuk kolom **Hewan Qurban** (contoh: "SAPI NO. 1" menggabungkan 7 baris muqorrib di dalamnya).
  * Desain garis ganda (*double underline border*) di bawah kop surat untuk estetika formal keagamaan klasik.
  * Teks menggunakan kombinasi font sans-serif tebal untuk judul dan JetBrains Mono untuk keterbacaan nomor hewan.

### 3.2 Dokumen 2: Label Pesanan Muqorrib (Grid Label Siap Gunting)
* **Layout:** Grid multi-kolom (2x4 atau 3x5) yang dioptimalkan untuk meminimalkan sisa kertas kosong saat dipotong.
* **Fitur Utama:**
  * Kartu bergaris tegas (*high-contrast borders*) agar mudah digunting secara manual oleh panitia.
  * Teks **Nama Pendek Muqorrib** dicetak berukuran ekstra besar (Bold, >18px) di bagian atas kartu.
  * Rincian pesanan khusus (seperti "2 KG DAGING + 10 BKS" atau "PAHA DEPAN") dicetak tepat di bawah nama untuk panduan instan tim pengemasan daging.

### 3.3 Dokumen 3: Lembar Tanda Terima Pesanan (Formulir Serah Terima Formal)
* **Layout:** Potret A4 dengan tabel formal.
* **Kolom Tabel:** `No` (Nomor), `Nama Qaribun`, `Pesanan`, `Alamat`, dan `Tanda Tangan` (kolom kosong berukuran lebar untuk paraf fisik).
* **Bagian Bawah (Sign-off Section):**
  * Tanda tangan sebelah kiri: **Ketua Panitia** (Nama dinamis diambil dari konfigurasi panel settings, cth: *Ihsanudin Suhanda*).
  * Tanda tangan sebelah kanan: **Petugas Lapangan** (garis kosong).
  * Catatan kaki (*footer*) di pojok kanan bawah: *"Tertib Administrasi 2025 - Panitia"*.

### 3.4 Dokumen 4: Ringkasan Data Muqorrib
* **Layout:** Versi ringkas dari daftar muqorrib untuk check-sheet cepat panitia penerima hewan hidup.

---

## 4. 🎛️ Control Panel Interaktif (Premium UI/UX)

Untuk mencapai standar **Big 4 Tech Company**, halaman pratinjau dokumen tidak boleh kaku. Kita akan membangun **Interactive Document Dashboard** yang terbagi menjadi dua kolom:

```
┌──────────────────────────────────────┐┌──────────────────────────────────────┐
│                                      ││                                      │
│   PANEL SETTINGS DINAMIS (Kiri)       ││   LIVE PRINT PREVIEW (Kanan)         │
│                                      ││                                      │
│   1. Pilih Jenis Dokumen             ││   ┌──────────────────────────────┐   │
│      [ Daftar / Label / Tanda Terima]││   │       KOP SURAT DKM          │   │
│   2. Pilih Jenis Hewan [Sapi / Domba]││   │  ==========================  │   │
│   3. Kop Surat & Pengaturan Konten   ││   │                              │   │
│      - Nama DKM: [DKM Sabilul Fitroh]││   │    DAFTAR PARA MUQARRIB      │   │
│      - Tahun: [1446 H. / 2025 M.]    ││   │  ┌───────┬──────┬─────────┐  │   │
│      - Nama Ketua: [Ihsanudin S.]    ││   │  │ Hewan │ No   │ Nama    │  │   │
│   4. Tombol Aksi                     ││   │  ├───────┼──────┼─────────┤  │   │
│      [ CETAK DOKUMEN (PDF) ]         ││   │  │       │ 1    │ Hj. Isb │  │   │
│                                      ││   └──┴───────┴──────┴─────────┘  │   │
└──────────────────────────────────────┘└──────────────────────────────────────┘
```

### Opsi Kustomisasi Real-Time pada Sidebar Panel:
1. **Pilihan Dokumen:** Dropdown interaktif untuk memilih di antara 4 tipe dokumen.
2. **Pilihan Kategori:** Tombol toggle bergaya kapsul untuk memilih data **Sapi** atau **Domba**.
3. **Kop Surat Customizer:** Input teks langsung untuk mengubah Nama DKM, Tahun Hijriah/Masehi, Alamat Kop Surat, dan Nama Ketua Panitia untuk tanda tangan tanda terima.
4. **Tombol "Cetak / Simpan ke PDF":** Tombol aksen hijau berpendar (*neon emerald green trigger*) yang akan mengeksekusi fungsi print.

---

## 5. Technical Architecture & Best Practices

Berdasarkan rekomendasi **`INP.md`**, kami menghindari penggunaan library PDF client-side yang sangat berat (seperti `jspdf` atau `html2pdf`) karena:
1. **Performance Overhead:** Mengunduh modul generator PDF berukuran >3MB memperlambat waktu muat halaman awal web (LCP memburuk).
2. **Text Quality Issues:** `html2canvas` merender teks menjadi gambar beresolusi rendah, sehingga tulisan pecah saat dicetak di atas kertas fisik A4.
3. **Zero React DOM Over-rendering:** Kami menggunakan **Native Browser Print Engine via CSS `@media print`**.

### Strategi Rekayasa Teknis:
* **Vector Quality Output:** Menggunakan cetak browser asli (`window.print()`). Menghasilkan file PDF vektor asli di mana teks tetap berupa font digital yang tajam, sangat jelas dibaca di printer resolusi rendah sekalipun, dan ukuran file sangat kecil (<100KB).
* **Print Stylesheet (`@media print`):**
  * Secara otomatis menyembunyikan sidebar navigasi, header UI web, dan panel control setting di sebelah kiri (`display: none`).
  * Mengatur margin halaman cetak secara presisi (`@page { size: A4; margin: 15mm; }`).
  * Mengabaikan latar belakang gelap (* luxury dark mode*) pada web dan mengubah seluruh teks menjadi hitam pekat di atas latar belakang putih bersih (`background: white !important; color: black !important;`) untuk menghemat tinta printer operasional panitia.
  * Menghindari pemotongan baris di tengah tabel menggunakan aturan CSS `page-break-inside: avoid;`.

---

## 6. Uji Kelayakan & Metrik Keberhasilan (KPI)

1. **Waktu Respons Interaksi (INP):** Mengubah konfigurasi setting di panel kiri harus meng-update preview di sebelah kanan secara instan (<50ms).
2. **Kesesuaian Halaman A4:** Dokumen Daftar Muqorrib dan Tanda Terima harus muat pas dalam halaman A4 tanpa kolom yang terpotong di bagian kanan atau footer yang meluber ke halaman kosong kedua secara tidak sengaja.
3. **Kemudahan Pengoperasian:** Panitia dapat mencetak dokumen cukup dengan 2 kali klik dari dasbor.
