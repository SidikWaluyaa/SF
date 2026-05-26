# SHOE WORKSHOP - DASHBOARD DESIGN SYSTEM & ARCHITECTURE REFERENSI (TAILWIND + ECHARTS)

Dokumen ini berisi rangkuman teknis lengkap mengenai arsitektur sistem desain, gaya visual, animasi, dan manajemen performa yang digunakan pada **`project dashboard`** (DashboardSW). Dokumen ini dibuat agar dapat menjadi **acuan utama (referensi)** saat Anda memperbaiki project `Dashboard Marketing` yang memiliki tampilan visual dan INP yang kurang optimal.

---

## 1. STACK TEKNOLOGI UTAMA & DEPENDENSI

Untuk menghasilkan performa interaksi super lancar (INP ~0ms) dan desain visual premium, project ini menggunakan:
*   **CSS Framework:** Tailwind CSS (efisien, tanpa file CSS kustom raksasa).
*   **Chart Engine:** Apache ECharts (`echarts-for-react`) dengan opsi render `SVG` (jauh lebih ringan dari SVG Recharts biasa).
*   **Icon Library:** Lucide React (`lucide-react`).
*   **Date Operations:** date-fns (`date-fns` - library manipulasi tanggal teringan dan tercepat).

---

## 2. PANDUAN WARNA & TATA LETAK TAILWIND

Project ini menggunakan tema ruang angkasa gelap mewah (*Luxury Dark Theme*) dengan detail bercahaya neon.

### 2.1 Skema Warna Kunci
*   **Background Utama:** `#0b0c10` (Deep obsidian dark)
*   **Card Background:** `#1a1b23` (Grafit arang gelap dengan aksen abu)
*   **Borders:** `border-gray-800/80` atau `border-gray-700`
*   **Warna Neon Aksen:**
    *   Teal / Brand Primary: `#2EC4B6` (Neon Mint)
    *   Orange / Warning / Pending: `#E8A838` (Amber Gold)
    *   Red / Overdue / Alert: `#FF6B6B` (Coral Rose)

### 2.2 Struktur Layout Viewport Sizing (`App.jsx`)
Dashboard menerapkan model **Single-Screen Constrained Viewport** (`h-screen w-screen overflow-hidden`) untuk memastikan aplikasi sepenuhnya pas dalam layar tanpa memicu scroll halaman body.

```jsx
// Template struktur tata letak dasar
<div className="flex h-screen w-screen bg-[#0f1117] overflow-hidden font-inter text-gray-200">
    {/* Sidebar Terkunci di Sisi Kiri */}
    <Sidebar />
    
    {/* Area Konten Utama yang Terkunci Ketinggiannya */}
    <div className="flex-1 min-w-0 overflow-hidden relative bg-[#0b0c10]">
        <InvoiceDashboard />
    </div>
</div>
```

---

## 3. DESAIN GLASSMORPHISM & NEON GLOW DECORATIONS

Kartu-kartu KPI dan Chart menggunakan border bergradasi menyala (*Neon Glowing Borders*) dan bayangan lembut di atas warna latar gelap:

```jsx
// Kerangka Card Premium dengan Border Neon Gradasi Sebelah Kiri
<div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-3 gap-2 bg-gradient-to-r from-[#1a1b23] via-[#1c1e2b] to-[#1a1b23] p-3 rounded-xl border border-gray-800/80 shadow-lg shadow-black/30 relative shrink-0">
    {/* Bar Garis Menyala Sebelah Kiri */}
    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-teal-400 via-cyan-400 to-blue-500 rounded-l-xl"></div>
    {/* Glow Overlay Lembut di Dalam Card */}
    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-teal-500/5 via-transparent to-blue-500/5 pointer-events-none"></div>
    
    {/* Konten Anda */}
</div>
```

---

## 4. INTEGRASI APACHE ECHARTS (RAHASIA ANGLING INP ~0ms)

Mengapa ECharts jauh lebih cepat dibanding Recharts?
1.  **Dua Renderer Pilihan:** ECharts mendukung render menggunakan Canvas atau SVG. Untuk grafik kompleks, opsi Canvas atau SVG ECharts memproses manipulasi objek secara langsung tanpa menyentuh *Virtual DOM React*, sehingga *main-thread* CPU tidak terbebani proses rekonsiliasi komponen React.
2.  **Tooltip Lepas dari Render React:** Pembuatan tooltip, crosshair pointer, dan hover warna area ditangani langsung di level Javascript Engine ECharts lewat fungsi kustom, memangkas Presentation Delay.

### 4.1 Implementasi Cashflow Trend (Area Chart)
Konfigurasi gradasi area menyala dan rendering SVG ECharts yang digunakan pada [ChartGroup1.jsx](file:///d:/project%20dashboard/src/components/ChartGroup1.jsx#L7-L102):

```javascript
import ReactECharts from 'echarts-for-react';

export const CashflowChart = ({ data }) => {
    const options = {
        backgroundColor: 'transparent',
        textStyle: { fontFamily: 'Inter, sans-serif' },
        tooltip: {
            trigger: 'axis',
            backgroundColor: '#1f212a',
            borderColor: '#374151',
            textStyle: { color: '#e5e7eb' },
            axisPointer: { type: 'cross', label: { backgroundColor: '#374151' } }
        },
        legend: {
            data: ['Total Tagihan', 'Total Terbayar'],
            textStyle: { color: '#9ca3af', fontSize: 10 },
            top: 0
        },
        grid: { left: '2%', right: '3%', bottom: '0%', top: '12%', containLabel: true },
        xAxis: [{
            type: 'category',
            boundaryGap: false,
            data: data.dates,
            axisLine: { lineStyle: { color: '#374151' } },
            axisLabel: { color: '#9ca3af', fontSize: 10 }
        }],
        yAxis: [{
            type: 'value',
            splitLine: { lineStyle: { color: '#1f2937', type: 'dashed' } },
            axisLabel: {
                color: '#9ca3af',
                fontSize: 10,
                formatter: (value) => `Rp ${(value / 1000000).toFixed(1)}M`
            }
        }],
        series: [
            {
                name: 'Total Tagihan',
                type: 'line',
                smooth: true,
                lineStyle: { width: 2, color: '#2EC4B6' },
                areaStyle: {
                    opacity: 0.3,
                    color: {
                        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [{ offset: 0, color: '#2EC4B6' }, { offset: 1, color: 'rgba(46, 196, 182, 0.01)' }]
                    }
                },
                data: data.totalBill
            },
            {
                name: 'Total Terbayar',
                type: 'line',
                smooth: true,
                lineStyle: { width: 2, color: '#E8A838' },
                areaStyle: {
                    opacity: 0.3,
                    color: {
                        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [{ offset: 0, color: '#E8A838' }, { offset: 1, color: 'rgba(232, 168, 56, 0.01)' }]
                    }
                },
                data: data.amountPaid
            }
        ]
    };

    return (
        <div className="bg-[#1a1b23] rounded-xl p-3 shadow-lg border border-gray-800 h-full flex flex-col">
            <h3 className="text-white font-semibold text-xs mb-1">Tren Arus Kas</h3>
            <div className="flex-grow min-h-0">
                {/* renderer: 'svg' membuat chart sangat tajam dan hemat memori pada layar resolusi tinggi */}
                <ReactECharts option={options} style={{ height: '100%', width: '100%' }} opts={{ renderer: 'svg' }} />
            </div>
        </div>
    );
};
```

### 4.2 Implementasi Tooltip Custom Delta PoP (Period-over-Period)
Logika pembuatan indikator delta persentase interaktif (positif hijau, negatif merah) langsung pada kursor hover ECharts ([ChartGroup2.jsx:L80-L106](file:///d:/project%20dashboard/src/components/ChartGroup2.jsx#L80-L106)):

```javascript
tooltip: {
    trigger: 'axis',
    backgroundColor: '#1f212a',
    borderColor: '#374151',
    textStyle: { color: '#e5e7eb', fontSize: 10 },
    formatter: function (params) {
        let res = `<div class="font-bold mb-1 text-[10px]">${params[0].axisValue}</div>`;
        let currVal = null;
        let prevVal = null;

        params.forEach(p => {
            res += `<div class="text-[10px]">${p.marker} ${p.seriesName}: <b>Rp ${(p.data / 1000).toLocaleString('id-ID')}K</b></div>`;
            if (p.seriesIndex === 0) currVal = p.data;
            else if (p.seriesIndex === 1) prevVal = p.data;
        });

        // Hitung selisih delta
        if (currVal !== null && prevVal !== null && prevVal > 0) {
            const delta = ((currVal - prevVal) / prevVal) * 100;
            const color = delta > 0 ? '#10B981' : delta < 0 ? '#F43F5E' : '#9CA3AF';
            const sign = delta > 0 ? '+' : '';
            res += `<div class="mt-1 pt-1 border-t border-gray-700 text-[10px]" style="color:${color}">Δ ${sign}${delta.toFixed(1)}%</div>`;
        }
        return res;
    }
}
```

---

## 5. MANAJEMEN DATA & KOMPUTASI IN-MEMORY REAKTIF (`utils/dataUtils.js`)

Semua manipulasi, pemfilteran tanggal menggunakan `date-fns`, dan kalkulasi KPI dikelompokkan di berkas utilitas terpisah, bukan di dalam komponen render. 
*   **Pre-processing terpusat:** Memungkinkan fungsi filter dan map dipanggil sekali per perubahan state filter, menghindarkan rendering ulang yang tidak perlu saat kursor berpindah.
*   **Gunakan date-fns:** `startOfDay`, `endOfDay`, `isWithinInterval` jauh lebih cepat dan andal dibandingkan kalkulasi objek `new Date()` manual bawaan Javascript yang sering memicu kebocoran memori.
