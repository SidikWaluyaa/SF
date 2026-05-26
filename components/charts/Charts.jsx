'use client';

import dynamic from 'next/dynamic';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

export function DonutChart({ sapiCount, dombaCount }) {
  const option = {
    backgroundColor: 'transparent',
    textStyle: { fontFamily: 'Outfit, sans-serif' },
    tooltip: {
      trigger: 'item',
      backgroundColor: '#1C2540',
      borderColor: '#374151',
      textStyle: { color: '#e5e7eb', fontSize: 12, fontFamily: 'Outfit' },
      formatter: (params) => {
        return `<div style="font-weight:600;margin-bottom:4px;font-family:Outfit">${params.name}</div><div style="font-family:JetBrains Mono;font-size:13px">${params.value} Ekor (${params.percent}%)</div>`;
      },
    },
    legend: {
      bottom: 0,
      textStyle: { color: '#9ca3af', fontSize: 11, fontFamily: 'Outfit' },
      itemWidth: 10,
      itemHeight: 10,
      itemGap: 20,
    },
    series: [
      {
        type: 'pie',
        radius: ['48%', '72%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#0A0E17',
          borderWidth: 3,
        },
        label: {
          show: true,
          position: 'center',
          formatter: () => `{total|${sapiCount + dombaCount}}\n{label|Total Ekor}`,
          rich: {
            total: { fontSize: 28, fontWeight: 800, color: '#F3F4F6', fontFamily: 'JetBrains Mono', lineHeight: 36 },
            label: { fontSize: 11, color: '#6B7280', fontFamily: 'Outfit', lineHeight: 18 },
          },
        },
        emphasis: {
          focus: 'self',
          itemStyle: {
            shadowBlur: 20,
            shadowOffsetX: 0,
            shadowColor: 'rgba(16, 185, 129, 0.3)',
          },
        },
        data: [
          { value: sapiCount, name: 'Sapi', itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 1, colorStops: [{ offset: 0, color: '#10B981' }, { offset: 1, color: '#059669' }] } } },
          { value: dombaCount, name: 'Domba', itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 1, colorStops: [{ offset: 0, color: '#F59E0B' }, { offset: 1, color: '#D97706' }] } } },
        ],
      },
    ],
  };

  return (
    <div className="glass-card p-5 h-full flex flex-col">
      <h3 className="text-sm font-bold text-white mb-1">Proporsi Hewan Qurban</h3>
      <p className="text-[11px] text-gray-500 mb-3">Perbandingan jumlah sapi dan domba</p>
      <div className="flex-grow min-h-0">
        <ReactECharts option={option} style={{ height: '100%', width: '100%' }} opts={{ renderer: 'svg' }} />
      </div>
    </div>
  );
}

export function MustahiqBarChart({ data }) {
  const names = data.map((d) => d.nama_kelompok);
  const values = data.map((d) => d.jiwa_kk);

  const option = {
    backgroundColor: 'transparent',
    textStyle: { fontFamily: 'Outfit, sans-serif' },
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1C2540',
      borderColor: '#374151',
      textStyle: { color: '#e5e7eb', fontSize: 11 },
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        const p = params[0];
        return `<div style="font-weight:600;margin-bottom:4px">${p.name}</div><div style="font-family:JetBrains Mono">${p.value} Jiwa/KK</div>`;
      },
    },
    grid: { left: '3%', right: '5%', bottom: '3%', top: '4%', containLabel: true },
    xAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#1f2937', type: 'dashed' } },
      axisLabel: { color: '#6B7280', fontSize: 10 },
    },
    yAxis: {
      type: 'category',
      data: names,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#9CA3AF', fontSize: 10, width: 100, overflow: 'truncate' },
    },
    series: [
      {
        type: 'bar',
        data: values.map((v, i) => ({
          value: v,
          itemStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
              colorStops: [
                { offset: 0, color: 'rgba(6, 182, 212, 0.8)' },
                { offset: 1, color: 'rgba(16, 185, 129, 0.8)' },
              ],
            },
            borderRadius: [0, 4, 4, 0],
          },
        })),
        barWidth: '60%',
        emphasis: {
          focus: 'series',
          itemStyle: {
            shadowBlur: 12,
            shadowColor: 'rgba(16, 185, 129, 0.4)',
          },
        },
      },
    ],
  };

  return (
    <div className="glass-card p-5 h-full flex flex-col">
      <h3 className="text-sm font-bold text-white mb-1">Distribusi Mustahiq</h3>
      <p className="text-[11px] text-gray-500 mb-3">Jumlah jiwa/KK per kelompok penerima</p>
      <div className="flex-grow min-h-0">
        <ReactECharts option={option} style={{ height: '100%', width: '100%' }} opts={{ renderer: 'svg' }} />
      </div>
    </div>
  );
}

export function PerolehanStackedChart({ sapiData, dombaData }) {
  const bagianList = ['Kepala', 'Cokor', 'Buntut', 'Siki', 'Ati', 'Kulit'];

  const option = {
    backgroundColor: 'transparent',
    textStyle: { fontFamily: 'Outfit, sans-serif' },
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1C2540',
      borderColor: '#374151',
      textStyle: { color: '#e5e7eb', fontSize: 11, fontFamily: 'Outfit' },
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        let html = `<div style="font-weight:600;margin-bottom:6px;font-family:Outfit">${params[0].name}</div>`;
        params.forEach(p => {
          const color = p.seriesName === 'Sapi' ? '#10B981' : '#F59E0B';
          html += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:2px;font-family:JetBrains Mono;font-size:12px">
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color}"></span>
            <span style="color:#9ca3af;font-family:Outfit">${p.seriesName}:</span>
            <span style="color:#f3f4f6;font-weight:600">${p.value} Bagian</span>
          </div>`;
        });
        return html;
      }
    },
    legend: {
      data: ['Sapi', 'Domba'],
      textStyle: { color: '#9ca3af', fontSize: 11 },
      top: 0,
      itemWidth: 10,
      itemHeight: 10,
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '14%', containLabel: true },
    xAxis: {
      type: 'category',
      data: bagianList,
      axisLine: { lineStyle: { color: '#374151' } },
      axisLabel: { color: '#9CA3AF', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#1f2937', type: 'dashed' } },
      axisLabel: { color: '#6B7280', fontSize: 10 },
    },
    series: [
      {
        name: 'Sapi',
        type: 'bar',
        stack: 'total',
        data: sapiData,
        itemStyle: {
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#10B981' }, { offset: 1, color: '#059669' }] },
          borderRadius: [0, 0, 0, 0],
        },
        barWidth: '40%',
        emphasis: {
          focus: 'series'
        }
      },
      {
        name: 'Domba',
        type: 'bar',
        stack: 'total',
        data: dombaData,
        itemStyle: {
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#F59E0B' }, { offset: 1, color: '#D97706' }] },
          borderRadius: [4, 4, 0, 0],
        },
        barWidth: '40%',
        emphasis: {
          focus: 'series'
        }
      },
    ],
  };

  return (
    <div className="glass-card p-5 h-full flex flex-col">
      <h3 className="text-sm font-bold text-white mb-1">Perolehan Bagian Hewan</h3>
      <p className="text-[11px] text-gray-500 mb-3">Jumlah per bagian (kepala, cokor, dll)</p>
      <div className="flex-grow min-h-0">
        <ReactECharts option={option} style={{ height: '100%', width: '100%' }} opts={{ renderer: 'svg' }} />
      </div>
    </div>
  );
}

export function PesananBarChart({ sapiTotal, dombaTotal }) {
  const option = {
    backgroundColor: 'transparent',
    textStyle: { fontFamily: 'Outfit, sans-serif' },
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1C2540',
      borderColor: '#374151',
      textStyle: { color: '#e5e7eb', fontSize: 12 },
      formatter: (params) => {
        const p = params[0];
        return `<div style="font-weight:600">${p.name}</div><div style="font-family:JetBrains Mono;font-size:14px;margin-top:4px">${p.value} Bungkus</div>`;
      },
    },
    grid: { left: '3%', right: '5%', bottom: '3%', top: '8%', containLabel: true },
    xAxis: {
      type: 'category',
      data: ['Sapi', 'Domba'],
      axisLine: { lineStyle: { color: '#374151' } },
      axisLabel: { color: '#9CA3AF', fontSize: 12, fontWeight: 600 },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#1f2937', type: 'dashed' } },
      axisLabel: { color: '#6B7280', fontSize: 10 },
    },
    series: [
      {
        type: 'bar',
        data: [
          { value: sapiTotal, itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#10B981' }, { offset: 1, color: '#047857' }] }, borderRadius: [6, 6, 0, 0] } },
          { value: dombaTotal, itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#F59E0B' }, { offset: 1, color: '#B45309' }] }, borderRadius: [6, 6, 0, 0] } },
        ],
        barWidth: '45%',
        emphasis: {
          focus: 'self',
          itemStyle: { shadowBlur: 12, shadowColor: 'rgba(16, 185, 129, 0.4)' },
        },
        label: {
          show: true,
          position: 'top',
          color: '#F3F4F6',
          fontFamily: 'JetBrains Mono',
          fontSize: 13,
          fontWeight: 700,
          formatter: '{c}',
        },
      },
    ],
  };

  return (
    <div className="glass-card p-5 h-full flex flex-col">
      <h3 className="text-sm font-bold text-white mb-1">Total Pesanan</h3>
      <p className="text-[11px] text-gray-500 mb-3">Perbandingan bungkus pesanan sapi vs domba</p>
      <div className="flex-grow min-h-0">
        <ReactECharts option={option} style={{ height: '100%', width: '100%' }} opts={{ renderer: 'svg' }} />
      </div>
    </div>
  );
}

export function KuotaSapiWidget({ groups }) {
  return (
    <div className="glass-card p-5 h-full flex flex-col">
      <h3 className="text-sm font-bold text-white mb-1">Keterisian Patungan Sapi</h3>
      <p className="text-[11px] text-gray-500 mb-4">Kuota patungan kelompok (maksimal 7 orang per sapi)</p>
      
      <div className="flex-grow overflow-y-auto space-y-4 pr-1 scrollbar-thin max-h-[300px]">
        {groups.map((group) => {
          const pct = Math.min((group.count / 7) * 100, 100);
          const isFull = group.count >= 7;
          
          return (
            <div key={group.id} className="relative group/item bg-[#0F1424]/50 border border-gray-800/40 rounded-lg p-3 transition duration-200 hover:border-emerald-500/30">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isFull ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <span className="text-xs font-bold text-gray-200">Sapi Kelompok {group.nomor_hewan}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                    isFull ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {isFull ? 'Lengkap' : `Sisa ${7 - group.count}`}
                  </span>
                  <span className="text-xs font-mono font-bold text-gray-300">{group.count}/7</span>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-800/50 rounded-full h-1.5 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    isFull 
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500' 
                      : 'bg-gradient-to-r from-amber-500 to-orange-500'
                  }`} 
                  style={{ width: `${pct}%` }} 
                />
              </div>

              {/* Muqorrib Names Mini Tags */}
              <div className="mt-2 text-[10px] text-gray-500 flex flex-wrap gap-1.5 items-center">
                {group.names.length > 0 ? (
                  group.names.map((name, i) => (
                    <span key={i} className="bg-gray-850 border border-gray-800/80 px-1.5 py-0.5 rounded text-gray-400 text-[10px] font-medium truncate max-w-[100px]" title={name}>
                      {name}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-600 italic text-[10px]">Belum ada muqorrib</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function RealisasiDistribusiChart({ data }) {
  const parts = data.map((d) => d.bagian);
  const diambilValues = data.map((d) => d.diambil);
  const sisaValues = data.map((d) => d.sisa);

  const option = {
    backgroundColor: 'transparent',
    textStyle: { fontFamily: 'Outfit, sans-serif' },
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1C2540',
      borderColor: '#374151',
      textStyle: { color: '#e5e7eb', fontSize: 11, fontFamily: 'Outfit' },
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        let html = `<div style="font-weight:600;margin-bottom:6px;font-family:Outfit">${params[0].name}</div>`;
        params.forEach((p) => {
          const color = p.seriesName === 'Terdistribusi' ? '#10B981' : '#F59E0B';
          html += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:2px;font-family:JetBrains Mono;font-size:12px">
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color}"></span>
            <span style="color:#9ca3af;font-family:Outfit">${p.seriesName}:</span>
            <span style="color:#f3f4f6;font-weight:600">${p.value} Bagian</span>
          </div>`;
        });
        return html;
      },
    },
    legend: {
      data: ['Terdistribusi', 'Sisa di Gudang'],
      textStyle: { color: '#9ca3af', fontSize: 11 },
      top: 0,
      itemWidth: 10,
      itemHeight: 10,
    },
    grid: { left: '3%', right: '5%', bottom: '3%', top: '14%', containLabel: true },
    xAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#1f2937', type: 'dashed' } },
      axisLabel: { color: '#6B7280', fontSize: 10 },
    },
    yAxis: {
      type: 'category',
      data: parts,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#9CA3AF', fontSize: 11 },
    },
    series: [
      {
        name: 'Terdistribusi',
        type: 'bar',
        stack: 'total_realisasi',
        data: diambilValues,
        itemStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: '#10B981' },
              { offset: 1, color: '#059669' },
            ],
          },
        },
        emphasis: { focus: 'series' },
      },
      {
        name: 'Sisa di Gudang',
        type: 'bar',
        stack: 'total_realisasi',
        data: sisaValues,
        itemStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: '#F59E0B' },
              { offset: 1, color: '#D97706' },
            ],
          },
          borderRadius: [0, 4, 4, 0],
        },
        emphasis: { focus: 'series' },
      },
    ],
  };

  return (
    <div className="glass-card p-5 h-full flex flex-col">
      <h3 className="text-sm font-bold text-white mb-1">Realisasi Distribusi Bagian</h3>
      <p className="text-[11px] text-gray-500 mb-3">Realisasi pembagian bagian tubuh hewan (diambil vs sisa)</p>
      <div className="flex-grow min-h-0">
        <ReactECharts option={option} style={{ height: '100%', width: '100%' }} opts={{ renderer: 'svg' }} />
      </div>
    </div>
  );
}

