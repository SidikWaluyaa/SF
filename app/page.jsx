'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { totalBungkusMuqorrib, formatNumber, formatDecimal } from '@/lib/utils';
import Header from '@/components/layout/Header';
import KPICard from '@/components/ui/KPICard';
import { DonutChart, MustahiqBarChart, PerolehanStackedChart, PesananBarChart, KuotaSapiWidget, RealisasiDistribusiChart } from '@/components/charts/Charts';
import { Beef, Rabbit, Package, Users, Scale, UserCheck } from 'lucide-react';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    sapiCount: 0,
    dombaCount: 0,
    muqorribSapiCount: 0,
    muqorribDombaCount: 0,
    pesananSapiTotal: 0,
    pesananDombaTotal: 0,
    dagingBersih: 0,
    totalMustahiq: 0,
    rasioDaging: 0,
  });
  const [mustahiqData, setMustahiqData] = useState([]);
  const [perolehanSapi, setPerolehanSapi] = useState([0, 0, 0, 0, 0, 0]);
  const [perolehanDomba, setPerolehanDomba] = useState([0, 0, 0, 0, 0, 0]);
  const [sapiGroups, setSapiGroups] = useState([]);
  const [realisasiDistribusi, setRealisasiDistribusi] = useState([]);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      // Fetch hewan qurban counts
      const { data: hewanData } = await supabase.from('hewan_qurban').select('*');
      const sapiCount = hewanData?.filter((h) => h.jenis === 'sapi').length || 0;
      const dombaCount = hewanData?.filter((h) => h.jenis === 'domba').length || 0;

      // Fetch muqorrib data
      const { data: muqorribData } = await supabase
        .from('muqorrib')
        .select('*, hewan_qurban!inner(jenis)');

      const sapiMuqorrib = muqorribData?.filter((m) => m.hewan_qurban?.jenis === 'sapi') || [];
      const dombaMuqorrib = muqorribData?.filter((m) => m.hewan_qurban?.jenis === 'domba') || [];

      const pesananSapiTotal = sapiMuqorrib.reduce((sum, m) => sum + totalBungkusMuqorrib(m), 0);
      const pesananDombaTotal = dombaMuqorrib.reduce((sum, m) => sum + totalBungkusMuqorrib(m), 0);

      // Fetch panitia data
      const { data: panitiaData } = await supabase.from('panitia').select('*');

      // Fetch daging summary
      const { data: dagingData } = await supabase.from('daging_summary').select('*');
      const dagingBersih = dagingData?.reduce((sum, d) => sum + (d.total_daging_bersih_kg || 0), 0) || 0;

      // Fetch mustahiq
      const { data: mustahiq } = await supabase.from('mustahiq').select('*').order('nomor_urut');
      const totalMustahiq = mustahiq?.reduce((sum, m) => sum + (m.jiwa_kk || 0), 0) || 0;

      // Fetch perolehan
      const { data: perolehanData } = await supabase
        .from('perolehan')
        .select('*, hewan_qurban!inner(jenis)');

      const parsePartFromText = (text, bagian) => {
        if (!text) return 0;
        const t = text.toLowerCase();
        
        const keywords = {
          kepala: [/kepala/i],
          cokor: [/cokor/i, /kaki/i],
          buntut: [/buntut/i, /ekor/i],
          siki: [/siki/i, /torpedo/i],
          ati: [/ati/i, /hati/i],
          kulit: [/kulit/i],
        };
        
        const patterns = keywords[bagian] || [];
        for (const pattern of patterns) {
          if (pattern.test(t)) {
            const numMatch = t.match(new RegExp(`(\\d+)\\s*(?:bks|kg)?\\s*${pattern.source}`, 'i'));
            if (numMatch) {
              return parseInt(numMatch[1]) || 1;
            }
            
            const numMatchAfter = t.match(new RegExp(`${pattern.source}\\s*(\\d+)`, 'i'));
            if (numMatchAfter) {
              return parseInt(numMatchAfter[1]) || 1;
            }
            
            return 1;
          }
        }
        return 0;
      };

      const getMuqorribAllocation = (hewanId, bagian) => {
        const items = muqorribData?.filter((m) => m.hewan_qurban_id === hewanId) || [];
        return items.reduce((sum, item) => {
          const mainVal = (item.pesanan_1 || item.pesanan_2)
            ? (parsePartFromText(item.pesanan_1, bagian) + parsePartFromText(item.pesanan_2, bagian))
            : parsePartFromText(item.pesanan, bagian);

          const pVal = mainVal + parsePartFromText(item.pesanan_tambahan, bagian);
          return sum + pVal;
        }, 0);
      };

      const getPanitiaAllocation = (hewanId, jenis, bagian) => {
        const totalAllocated = panitiaData?.filter((p) => p.bagian === `${bagian}_${jenis}`).length || 0;
        if (totalAllocated === 0) return 0;

        const typeHewans = hewanData?.filter((h) => h.jenis === jenis).sort((a, b) => a.nomor_hewan - b.nomor_hewan) || [];
        let remaining = totalAllocated;
        const maxCapacity = bagian === 'cokor' ? 4 : 1;

        for (const h of typeHewans) {
          const allocatedToH = Math.min(remaining, maxCapacity);
          if (h.id === hewanId) {
            return allocatedToH;
          }
          remaining -= allocatedToH;
          if (remaining <= 0) break;
        }
        return 0;
      };

      const bagianOrder = ['kepala', 'cokor', 'buntut', 'siki', 'ati', 'kulit'];
      const sapiPerolehan = bagianOrder.map((bagian) => {
        const items = perolehanData?.filter(
          (p) => p.hewan_qurban?.jenis === 'sapi' && p.bagian === bagian
        ) || [];
        return items.reduce((sum, i) => sum + (i.jumlah_ada || 0), 0);
      });
      const dombaPerolehan = bagianOrder.map((bagian) => {
        const items = perolehanData?.filter(
          (p) => p.hewan_qurban?.jenis === 'domba' && p.bagian === bagian
        ) || [];
        return items.reduce((sum, i) => sum + (i.jumlah_ada || 0), 0);
      });

      // Calculate new metrics
      const groups = hewanData
        ?.filter((h) => h.jenis === 'sapi')
        .map((h) => {
          const members = muqorribData?.filter((m) => m.hewan_qurban_id === h.id) || [];
          return {
            id: h.id,
            nomor_hewan: h.nomor_hewan,
            count: members.length,
            names: members.map((m) => m.nama_pendek || m.nama_lengkap),
          };
        })
        .sort((a, b) => a.nomor_hewan - b.nomor_hewan) || [];

      const realisasi = bagianOrder.map((bagian) => {
        const items = perolehanData?.filter((p) => p.bagian === bagian) || [];
        
        let diambil = 0;
        let sisa = 0;

        items.forEach((item) => {
          const jenis = item.hewan_qurban?.jenis || 'sapi';
          const defaultAda = item.bagian === 'cokor' ? 4 : 1;
          const ada = item.jumlah_ada !== undefined ? item.jumlah_ada : defaultAda;

          const mqVal = getMuqorribAllocation(item.hewan_qurban_id, item.bagian);
          const pnVal = getPanitiaAllocation(item.hewan_qurban_id, jenis, item.bagian);

          const itemDiambil = mqVal + pnVal;
          const itemSisa = ada - itemDiambil;

          diambil += itemDiambil;
          sisa += itemSisa;
        });

        return {
          bagian: bagian.charAt(0).toUpperCase() + bagian.slice(1),
          diambil,
          sisa,
        };
      });

      const rasioDaging = totalMustahiq > 0 ? (dagingBersih / totalMustahiq) : 0;

      setStats({
        sapiCount,
        dombaCount,
        muqorribSapiCount: sapiMuqorrib.length,
        muqorribDombaCount: dombaMuqorrib.length,
        pesananSapiTotal,
        pesananDombaTotal,
        dagingBersih,
        totalMustahiq,
        rasioDaging,
      });
      setMustahiqData(mustahiq || []);
      setPerolehanSapi(sapiPerolehan);
      setPerolehanDomba(dombaPerolehan);
      setSapiGroups(groups);
      setRealisasiDistribusi(realisasi);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Dashboard" subtitle="Ringkasan data qurban" />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Memuat data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Dashboard" subtitle="Ringkasan data qurban" />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 stagger-children">
          <KPICard
            title="Hewan Sapi"
            value={`${stats.sapiCount} Ekor`}
            subtitle={`${stats.muqorribSapiCount} muqorrib`}
            icon={Beef}
            color="emerald"
            delay={0.05}
          />
          <KPICard
            title="Hewan Domba"
            value={`${stats.dombaCount} Ekor`}
            subtitle={`${stats.muqorribDombaCount} muqorrib`}
            icon={Rabbit}
            color="gold"
            delay={0.1}
          />
          <KPICard
            title="Pesanan Sapi"
            value={`${formatNumber(stats.pesananSapiTotal)} Bks`}
            subtitle="Total bungkus"
            icon={Package}
            color="blue"
            delay={0.15}
          />
          <KPICard
            title="Pesanan Domba"
            value={`${formatNumber(stats.pesananDombaTotal)} Bks`}
            subtitle="Total bungkus"
            icon={Package}
            color="purple"
            delay={0.2}
          />
          <KPICard
            title="Daging Bersih"
            value={`${formatNumber(stats.dagingBersih)} Kg`}
            subtitle="Total daging"
            icon={Scale}
            color="cyan"
            delay={0.25}
          />
          <KPICard
            title="Total Mustahiq"
            value={`${formatNumber(stats.totalMustahiq)}`}
            subtitle="Jiwa penerima"
            icon={Users}
            color="rose"
            delay={0.3}
          />
          <KPICard
            title="Rasio Daging"
            value={`${stats.rasioDaging.toFixed(2)} Kg`}
            subtitle="Rata-rata per Mustahiq"
            icon={UserCheck}
            color="indigo"
            delay={0.35}
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ minHeight: '320px' }}>
          <DonutChart sapiCount={stats.sapiCount} dombaCount={stats.dombaCount} />
          <PesananBarChart sapiTotal={stats.pesananSapiTotal} dombaTotal={stats.pesananDombaTotal} />
          <PerolehanStackedChart sapiData={perolehanSapi} dombaData={perolehanDomba} />
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ minHeight: '340px' }}>
          <KuotaSapiWidget groups={sapiGroups} />
          <RealisasiDistribusiChart data={realisasiDistribusi} />
        </div>

        {/* Charts Row 3 */}
        <div className="grid grid-cols-1 gap-4" style={{ minHeight: '360px' }}>
          <MustahiqBarChart data={mustahiqData} />
        </div>
      </div>
    </div>
  );
}
