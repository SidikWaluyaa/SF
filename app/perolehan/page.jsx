'use client';

import React from 'react';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { formatNumber, formatDecimal } from '@/lib/utils';
import Header from '@/components/layout/Header';
import KPICard from '@/components/ui/KPICard';
import { BarChart3, Scale, Users, Save } from 'lucide-react';
import Swal from 'sweetalert2';

const showSuccess = (title, text) => {
  Swal.fire({
    title,
    text,
    icon: 'success',
    confirmButtonColor: '#10B981',
    background: '#121829',
    color: '#f3f4f6',
    customClass: {
      popup: 'border border-emerald-500/20 rounded-2xl font-sans',
    }
  });
};

const showError = (title, text) => {
  Swal.fire({
    title,
    text,
    icon: 'error',
    confirmButtonColor: '#EF4444',
    background: '#121829',
    color: '#f3f4f6',
    customClass: {
      popup: 'border border-red-500/20 rounded-2xl font-sans',
    }
  });
};

const BAGIAN_LIST_SAPI = ['kepala', 'cokor', 'buntut', 'siki', 'ati', 'kulit'];
const BAGIAN_LIST_DOMBA = ['kepala', 'cokor', 'siki', 'ati', 'kulit'];

const BAGIAN_LABELS = {
  kepala: 'Kepala',
  cokor: 'Cokor',
  buntut: 'Buntut',
  siki: 'Siki',
  ati: 'Ati',
  kulit: 'Kulit',
};

export default function PerolehanPage() {
  const [hewanList, setHewanList] = useState([]);
  const [perolehan, setPerolehan] = useState([]);
  const [dagingSummary, setDagingSummary] = useState([]);
  const [totalPenerima, setTotalPenerima] = useState(0);
  const [dagingSapiInput, setDagingSapiInput] = useState('0');
  const [dagingDombaInput, setDagingDombaInput] = useState('0');
  const [muqorribList, setMuqorribList] = useState([]);
  const [panitiaList, setPanitiaList] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const isInitializingRef = React.useRef(false);

  const fetchData = useCallback(async () => {
    if (isInitializingRef.current) return;
    isInitializingRef.current = true;
    setLoading(true);
    try {
      // 1. Fetch hewan list
      const { data: hewan } = await supabase.from('hewan_qurban').select('*').order('jenis').order('nomor_hewan');
      const activeHewan = hewan || [];
      setHewanList(activeHewan);

      // 2. Fetch existing perolehan
      const { data: peroleh } = await supabase.from('perolehan').select('*, hewan_qurban(jenis, nomor_hewan)');
      let activePerolehan = peroleh || [];

      // 3. Fetch muqorribs and panitias
      const { data: muqorribs } = await supabase.from('muqorrib').select('*');
      setMuqorribList(muqorribs || []);

      const { data: panitias } = await supabase.from('panitia').select('*');
      setPanitiaList(panitias || []);

      // 4. Inisialisasi default biologis untuk kombinasi hewan & bagian yang belum ada di database
      if (activeHewan.length > 0) {
        const missingInserts = [];
        
        for (const h of activeHewan) {
          const partsList = h.jenis === 'sapi' ? BAGIAN_LIST_SAPI : BAGIAN_LIST_DOMBA;
          for (const bagian of partsList) {
            const exists = activePerolehan.some(
              (p) => p.hewan_qurban_id === h.id && p.bagian === bagian
            );
            if (!exists) {
              const defaultAda = bagian === 'cokor' ? 4 : 1;
              missingInserts.push({
                hewan_qurban_id: h.id,
                bagian,
                jumlah_ada: defaultAda,
                jumlah_diambil: 0,
                jumlah_sisa: defaultAda,
                jumlah_kurang: 0,
              });
            }
          }
        }
        
        if (missingInserts.length > 0) {
          // Masukkan default biologis secara bulk
          const { error: insertErr } = await supabase.from('perolehan').insert(missingInserts);
          if (!insertErr) {
            // Re-fetch untuk menyinkronkan ID dari database
            const { data: refreshedPeroleh } = await supabase.from('perolehan').select('*, hewan_qurban(jenis, nomor_hewan)');
            activePerolehan = refreshedPeroleh || [];
          }
        }
      }
      setPerolehan(activePerolehan);

      // 5. Fetch daging summary
      const { data: daging } = await supabase.from('daging_summary').select('*');
      setDagingSummary(daging || []);

      const sapiVal = daging?.find((d) => d.jenis === 'sapi')?.daging_kg || 0;
      const dombaVal = daging?.find((d) => d.jenis === 'domba')?.daging_kg || 0;
      setDagingSapiInput(sapiVal.toString());
      setDagingDombaInput(dombaVal.toString());

      const { data: mustahiq } = await supabase.from('mustahiq').select('jiwa_kk');
      const total = mustahiq?.reduce((sum, m) => sum + (m.jiwa_kk || 0), 0) || 0;
      setTotalPenerima(total);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
      isInitializingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Parser Cerdas untuk mengekstrak jumlah bagian hewan dari teks pesanan Muqorrib
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

  // Menghitung total pesanan Muqorrib untuk bagian hewan tertentu secara real-time
  const getMuqorribAllocation = (hewanId, bagian) => {
    const items = muqorribList.filter((m) => m.hewan_qurban_id === hewanId);
    return items.reduce((sum, item) => {
      const mainVal = (item.pesanan_1 || item.pesanan_2)
        ? (parsePartFromText(item.pesanan_1, bagian) + parsePartFromText(item.pesanan_2, bagian))
        : parsePartFromText(item.pesanan, bagian);

      const pVal = mainVal + parsePartFromText(item.pesanan_tambahan, bagian);
      return sum + pVal;
    }, 0);
  };

  // Menghitung alokasi bagian panitia menggunakan alokasi sequential FIFO
  const getPanitiaAllocation = (hewanId, jenis, bagian) => {
    const totalAllocated = panitiaList.filter((p) => p.bagian === `${bagian}_${jenis}`).length;
    if (totalAllocated === 0) return 0;

    const typeHewans = hewanList.filter((h) => h.jenis === jenis).sort((a, b) => a.nomor_hewan - b.nomor_hewan);
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

  // Mendapatkan daftar nama Panitia yang dialokasikan ke bagian tertentu pada hewan tertentu
  const getPanitiaAllocatedNames = (hewanId, jenis, bagian) => {
    const allocatedPanitia = panitiaList
      .filter((p) => p.bagian === `${bagian}_${jenis}`)
      .sort((a, b) => a.nomor_urut - b.nomor_urut);
    if (allocatedPanitia.length === 0) return [];

    const typeHewans = hewanList.filter((h) => h.jenis === jenis).sort((a, b) => a.nomor_hewan - b.nomor_hewan);
    let remainingIndex = 0;
    const maxCapacity = bagian === 'cokor' ? 4 : 1;

    for (const h of typeHewans) {
      const takeCount = Math.min(allocatedPanitia.length - remainingIndex, maxCapacity);
      
      if (h.id === hewanId) {
        if (takeCount <= 0) return [];
        return allocatedPanitia.slice(remainingIndex, remainingIndex + takeCount).map(p => p.nama_lengkap);
      }
      remainingIndex += takeCount;
      if (remainingIndex >= allocatedPanitia.length) break;
    }
    return [];
  };

  // Mendapatkan daftar nama Muqorrib yang memesan bagian tertentu pada hewan tertentu
  const getMuqorribAllocatedNames = (hewanId, bagian) => {
    const items = muqorribList.filter((m) => m.hewan_qurban_id === hewanId);
    const matched = [];
    for (const item of items) {
      const mainVal = (item.pesanan_1 || item.pesanan_2)
        ? (parsePartFromText(item.pesanan_1, bagian) + parsePartFromText(item.pesanan_2, bagian))
        : parsePartFromText(item.pesanan, bagian);

      const pVal = mainVal + parsePartFromText(item.pesanan_tambahan, bagian);
      if (pVal > 0) {
        matched.push({
          nama: item.nama_lengkap,
          jumlah: pVal
        });
      }
    }
    return matched;
  };

  const getPerolehanValue = (hewanId, bagian, field, jenis = 'sapi') => {
    const item = perolehan.find((p) => p.hewan_qurban_id === hewanId && p.bagian === bagian);
    const defaultAda = bagian === 'cokor' ? 4 : 1;
    const ada = item ? (item.jumlah_ada !== undefined ? item.jumlah_ada : defaultAda) : defaultAda;

    if (field === 'jumlah_ada') return ada;

    // Hitung alokasi muqorrib & panitia secara real-time
    const mqVal = getMuqorribAllocation(hewanId, bagian);
    const pnVal = getPanitiaAllocation(hewanId, jenis, bagian);

    if (field === 'muqorrib') return mqVal;
    if (field === 'panitia') return pnVal;

    const totalDiambil = mqVal + pnVal;
    if (field === 'jumlah_diambil') return totalDiambil;

    const sisa = ada - totalDiambil;
    if (field === 'jumlah_sisa') return sisa;
    if (field === 'jumlah_kurang') return sisa < 0 ? Math.abs(sisa) : 0;

    return 0;
  };

  const handlePerolehanChange = (hewanId, bagian, field, value) => {
    setPerolehan((prev) => {
      const idx = prev.findIndex((p) => p.hewan_qurban_id === hewanId && p.bagian === bagian);
      const numVal = parseInt(value) || 0;

      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], [field]: numVal };
        return updated;
      }
      
      const newEntry = {
        hewan_qurban_id: hewanId,
        bagian,
        jumlah_ada: numVal,
        jumlah_diambil: 0,
        jumlah_sisa: numVal,
        jumlah_kurang: 0,
        _isNew: true,
      };
      return [...prev, newEntry];
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. Simpan perolehan bagian hewan beserta kalkulasi terintegrasi
      for (const item of perolehan) {
        const h = hewanList.find(x => x.id === item.hewan_qurban_id);
        const jenis = h ? h.jenis : 'sapi';
        
        const ada = item.jumlah_ada !== undefined ? item.jumlah_ada : (item.bagian === 'cokor' ? 4 : 1);
        const mq = getMuqorribAllocation(item.hewan_qurban_id, item.bagian);
        const pn = getPanitiaAllocation(item.hewan_qurban_id, jenis, item.bagian);
        const diambil = mq + pn;
        const sisa = ada - diambil;
        const kurang = sisa < 0 ? Math.abs(sisa) : 0;

        if (item.id) {
          await supabase.from('perolehan').update({
            jumlah_ada: ada,
            jumlah_diambil: diambil,
            jumlah_sisa: sisa,
            jumlah_kurang: kurang,
          }).eq('id', item.id);
        } else {
          await supabase.from('perolehan').insert({
            hewan_qurban_id: item.hewan_qurban_id,
            bagian: item.bagian,
            jumlah_ada: ada,
            jumlah_diambil: diambil,
            jumlah_sisa: sisa,
            jumlah_kurang: kurang,
          });
        }
      }

      // 2. Simpan jumlah berat daging
      const kinds = ['sapi', 'domba'];
      for (const jenis of kinds) {
        const actualVal = jenis === 'sapi' ? dagingSapi : dagingDomba;
        const existing = dagingSummary.find(d => d.jenis === jenis);
        
        if (existing) {
          await supabase.from('daging_summary').update({
            daging_kg: actualVal,
            total_daging_bersih_kg: actualVal
          }).eq('jenis', jenis);
        } else {
          await supabase.from('daging_summary').insert({
            jenis,
            daging_kg: actualVal,
            total_daging_bersih_kg: actualVal
          });
        }
      }

      showSuccess('Sukses Menyimpan!', 'Seluruh data perolehan terintegrasi dan jumlah daging berhasil disimpan!');
      fetchData();
    } catch (err) {
      console.error('Error saving:', err);
      showError('Gagal Menyimpan!', 'Gagal menyimpan data: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const parseInputValue = (val) => {
    if (!val) return 0;
    const cleaned = val.replace(',', '.');
    return parseFloat(cleaned) || 0;
  };

  const dagingSapi = parseInputValue(dagingSapiInput);
  const dagingDomba = parseInputValue(dagingDombaInput);
  const totalDaging = dagingSapi + dagingDomba;
  const beratPerOrang = totalPenerima > 0 ? totalDaging / totalPenerima : 0;

  const getBagianTotal = (hewanItems, bagian, field, jenis = 'sapi') => {
    return hewanItems.reduce((sum, h) => sum + getPerolehanValue(h.id, bagian, field, jenis), 0);
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Perolehan" subtitle="Hasil pemotongan hewan qurban" />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const sapiHewan = hewanList.filter((h) => h.jenis === 'sapi');
  const dombaHewan = hewanList.filter((h) => h.jenis === 'domba');

  return (
    <div className="flex flex-col h-full">
      <Header title="Perolehan" subtitle="Hasil pemotongan hewan qurban">
        <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
          <Save className="w-4 h-4" />
          {saving ? 'Menyimpan...' : 'Simpan'}
        </button>
      </Header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* KPI */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 stagger-children">
          <KPICard 
            title="Daging Sapi" 
            value={
              <div className="flex items-center gap-1 w-full">
                <input
                  type="text"
                  className="w-full bg-transparent border-b border-[rgba(16,185,129,0.3)] hover:border-emerald-400 focus:border-emerald-400 focus:outline-none text-xl lg:text-2xl font-extrabold text-emerald-400 font-mono transition-colors"
                  value={dagingSapiInput}
                  onChange={(e) => setDagingSapiInput(e.target.value)}
                />
                <span className="text-sm font-semibold text-gray-500 font-sans">Kg</span>
              </div>
            } 
            icon={Scale} 
            color="emerald" 
          />
          <KPICard 
            title="Daging Domba" 
            value={
              <div className="flex items-center gap-1 w-full">
                <input
                  type="text"
                  className="w-full bg-transparent border-b border-[rgba(245,158,11,0.3)] hover:border-amber-400 focus:border-amber-400 focus:outline-none text-xl lg:text-2xl font-extrabold text-amber-400 font-mono transition-colors"
                  value={dagingDombaInput}
                  onChange={(e) => setDagingDombaInput(e.target.value)}
                />
                <span className="text-sm font-semibold text-gray-500 font-sans">Kg</span>
              </div>
            } 
            icon={Scale} 
            color="gold" 
          />
          <KPICard title="Total Daging" value={`${formatNumber(totalDaging)} Kg`} icon={Scale} color="cyan" />
          <KPICard title="Total Penerima" value={`${formatNumber(totalPenerima)} Org`} icon={Users} color="blue" />
          <KPICard title="Berat/Orang" value={`${formatDecimal(beratPerOrang, 4)} Kg`} icon={BarChart3} color="purple" />
        </div>

        {/* Tabel Perolehan per Hewan */}
        {[
          { label: 'SAPI', hewanItems: sapiHewan, color: 'emerald', partsList: BAGIAN_LIST_SAPI },
          { label: 'DOMBA', hewanItems: dombaHewan, color: 'gold', partsList: BAGIAN_LIST_DOMBA },
        ].map(({ label, hewanItems, color, partsList }) => (
          <div key={label} className="glass-card overflow-hidden">
            <div className="px-5 py-3 border-b border-[rgba(55,65,81,0.3)] flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full bg-${color === 'emerald' ? 'emerald' : 'amber'}-400`} />
              <h3 className="text-sm font-bold text-white">{label}</h3>
              <span className="text-xs text-gray-500">({hewanItems.length} ekor)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Hewan</th>
                    {partsList.map((b) => (
                      <th key={b} colSpan={5} className="text-center border-l border-[rgba(55,65,81,0.3)]">
                        {BAGIAN_LABELS[b]}
                      </th>
                    ))}
                  </tr>
                  <tr>
                    <th></th>
                    {partsList.map((b) => (
                      <React.Fragment key={`sub-${b}`}>
                        <th className="border-l border-[rgba(55,65,81,0.3)] text-[10px]">Ada</th>
                        <th className="text-[10px] text-emerald-400 font-semibold">Muqorrib</th>
                        <th className="text-[10px] text-amber-400 font-semibold">Panitia</th>
                        <th className="text-[10px] text-cyan-400 font-semibold">Sisa</th>
                        <th className="text-[10px] text-rose-400 font-semibold">Kurang</th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {hewanItems.map((hewan) => (
                    <tr key={hewan.id} className={
                      partsList.some(b => getPerolehanValue(hewan.id, b, 'jumlah_sisa', color === 'emerald' ? 'sapi' : 'domba') < 0)
                        ? "bg-[rgba(244,63,94,0.08)] border-l-4 border-rose-500 transition-colors"
                        : "transition-colors"
                    }>
                      <td className="font-semibold text-xs">
                        <span className={`badge badge-${color}`}>
                          {label} {hewan.nomor_hewan}
                        </span>
                      </td>
                      {partsList.map((bagian) => {
                        const sisa = getPerolehanValue(hewan.id, bagian, 'jumlah_sisa', color === 'emerald' ? 'sapi' : 'domba');
                        const kurang = getPerolehanValue(hewan.id, bagian, 'jumlah_kurang', color === 'emerald' ? 'sapi' : 'domba');
                        return (
                          <React.Fragment key={`${hewan.id}-${bagian}`}>
                            {/* ADA (EDITABLE INPUT) */}
                            <td className="border-l border-[rgba(55,65,81,0.15)]">
                              <input
                                type="number"
                                className="w-12 bg-[rgba(10,14,23,0.4)] border border-[rgba(55,65,81,0.3)] rounded px-2 py-1 text-xs text-center focus:border-emerald-500 focus:outline-none text-white"
                                value={getPerolehanValue(hewan.id, bagian, 'jumlah_ada', color === 'emerald' ? 'sapi' : 'domba')}
                                onChange={(e) => handlePerolehanChange(hewan.id, bagian, 'jumlah_ada', e.target.value)}
                              />
                            </td>
                            {/* MUQORRIB (AUTO READ-ONLY) */}
                            <td className="text-center font-semibold font-mono text-xs text-emerald-400">
                              {getPerolehanValue(hewan.id, bagian, 'muqorrib', color === 'emerald' ? 'sapi' : 'domba') || '-'}
                            </td>
                            {/* PANITIA (AUTO READ-ONLY) */}
                            <td className="text-center font-semibold font-mono text-xs text-amber-400">
                              {getPerolehanValue(hewan.id, bagian, 'panitia', color === 'emerald' ? 'sapi' : 'domba') || '-'}
                            </td>
                            {/* SISA (AUTO READ-ONLY) */}
                            <td className="text-center font-bold font-mono text-xs text-cyan-400">
                              {sisa}
                            </td>
                            {/* KURANG (AUTO READ-ONLY) */}
                            <td className={`text-center font-bold font-mono text-xs ${kurang > 0 ? 'text-rose-400 font-black' : 'text-gray-600'}`}>
                              {kurang > 0 ? kurang : '-'}
                            </td>
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-[rgba(17,24,39,0.45)] border-t border-[rgba(55,65,81,0.5)] font-bold text-xs">
                    <td className="py-3 px-4 text-white text-center font-extrabold uppercase tracking-wider">
                      TOTAL
                    </td>
                    {partsList.map((bagian) => {
                      const totalAda = getBagianTotal(hewanItems, bagian, 'jumlah_ada', color === 'emerald' ? 'sapi' : 'domba');
                      const totalMuqorrib = getBagianTotal(hewanItems, bagian, 'muqorrib', color === 'emerald' ? 'sapi' : 'domba');
                      const totalPanitia = getBagianTotal(hewanItems, bagian, 'panitia', color === 'emerald' ? 'sapi' : 'domba');
                      const totalSisa = getBagianTotal(hewanItems, bagian, 'jumlah_sisa', color === 'emerald' ? 'sapi' : 'domba');
                      const totalKurang = getBagianTotal(hewanItems, bagian, 'jumlah_kurang', color === 'emerald' ? 'sapi' : 'domba');

                      return (
                        <React.Fragment key={`total-${bagian}`}>
                          <td className="border-l border-[rgba(55,65,81,0.25)] text-center text-white font-mono py-3 font-extrabold text-[13px]">
                            {totalAda}
                          </td>
                          <td className="text-center text-emerald-400 font-mono py-3 font-extrabold text-[13px]">
                            {totalMuqorrib}
                          </td>
                          <td className="text-center text-amber-400 font-mono py-3 font-extrabold text-[13px]">
                            {totalPanitia}
                          </td>
                          <td className="text-center text-cyan-400 font-mono py-3 font-extrabold text-[13px]">
                            {totalSisa}
                          </td>
                          <td className={`text-center font-mono py-3 font-extrabold text-[13px] ${totalKurang > 0 ? 'text-rose-400 font-black' : 'text-gray-500 font-normal'}`}>
                            {totalKurang > 0 ? totalKurang : '-'}
                          </td>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ))}

        {/* Rincian Distribusi Bagian Spesial */}
        <div className="glass-card p-6 space-y-6">
          <div className="border-b border-[rgba(55,65,81,0.3)] pb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              Rincian Distribusi Bagian Spesial (Real-time Audit)
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Audit transparansi penerima bagian biologis (kepala, cokor, siki, ati, kulit) secara real-time berdasarkan pesanan Muqorrib dan alokasi FIFO Panitia.
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Rincian Sapi */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[rgba(16,185,129,0.08)] border border-[rgba(16,185,129,0.2)] w-fit">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider">Rincian Alokasi Sapi</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sapiHewan.map((hewan) => {
                  const hasAllocations = BAGIAN_LIST_SAPI.some(b => {
                    const mq = getMuqorribAllocatedNames(hewan.id, b);
                    const pn = getPanitiaAllocatedNames(hewan.id, 'sapi', b);
                    return mq.length > 0 || pn.length > 0;
                  });

                  return (
                    <div key={hewan.id} className="bg-[rgba(17,24,39,0.4)] border border-[rgba(55,65,81,0.2)] rounded-xl p-4 space-y-3">
                      <div className="flex justify-between items-center border-b border-[rgba(55,65,81,0.2)] pb-2">
                        <span className="text-xs font-extrabold text-white tracking-wide uppercase font-mono">
                          🐄 Sapi {hewan.nomor_hewan}
                        </span>
                        <span className="text-[10px] text-gray-500 font-medium">
                          {hasAllocations ? 'Terdistribusi' : 'Utuh / Belum Teralokasi'}
                        </span>
                      </div>

                      {hasAllocations ? (
                        <div className="space-y-3 divide-y divide-[rgba(55,65,81,0.15)]">
                          {BAGIAN_LIST_SAPI.map((bagian) => {
                            const mqAlloc = getMuqorribAllocatedNames(hewan.id, bagian);
                            const pnAlloc = getPanitiaAllocatedNames(hewan.id, 'sapi', bagian);

                            if (mqAlloc.length === 0 && pnAlloc.length === 0) return null;

                            return (
                              <div key={bagian} className="pt-2.5 first:pt-0 space-y-1.5">
                                <span className="text-[11px] font-bold text-gray-400 capitalize bg-[rgba(255,255,255,0.03)] px-1.5 py-0.5 rounded">
                                  {BAGIAN_LABELS[bagian]}
                                </span>
                                
                                {mqAlloc.length > 0 && (
                                  <div className="pl-2 space-y-1">
                                    {mqAlloc.map((item, idx) => (
                                      <div key={idx} className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/30" />
                                        <span>Muqorrib:</span>
                                        <span className="text-white font-semibold font-sans">{item.nama}</span>
                                        <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 px-1 rounded font-mono">
                                          {item.jumlah} Pkt
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {pnAlloc.length > 0 && (
                                  <div className="pl-2 space-y-1">
                                    {pnAlloc.map((name, idx) => (
                                      <div key={idx} className="flex items-center gap-1.5 text-[10px] text-amber-400 font-medium">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500/30" />
                                        <span>Panitia FIFO:</span>
                                        <span className="text-white font-semibold font-sans">{name}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-[10px] text-gray-500 italic py-2 text-center">Semua bagian utuh</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rincian Domba */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.2)] w-fit">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-xs font-extrabold text-amber-400 uppercase tracking-wider">Rincian Alokasi Domba</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dombaHewan.map((hewan) => {
                  const hasAllocations = BAGIAN_LIST_DOMBA.some(b => {
                    const mq = getMuqorribAllocatedNames(hewan.id, b);
                    const pn = getPanitiaAllocatedNames(hewan.id, 'domba', b);
                    return mq.length > 0 || pn.length > 0;
                  });

                  return (
                    <div key={hewan.id} className="bg-[rgba(17,24,39,0.4)] border border-[rgba(55,65,81,0.2)] rounded-xl p-4 space-y-3">
                      <div className="flex justify-between items-center border-b border-[rgba(55,65,81,0.2)] pb-2">
                        <span className="text-xs font-extrabold text-white tracking-wide uppercase font-mono">
                          🐑 Domba {hewan.nomor_hewan}
                        </span>
                        <span className="text-[10px] text-gray-500 font-medium">
                          {hasAllocations ? 'Terdistribusi' : 'Utuh / Belum Teralokasi'}
                        </span>
                      </div>

                      {hasAllocations ? (
                        <div className="space-y-3 divide-y divide-[rgba(55,65,81,0.15)]">
                          {BAGIAN_LIST_DOMBA.map((bagian) => {
                            const mqAlloc = getMuqorribAllocatedNames(hewan.id, bagian);
                            const pnAlloc = getPanitiaAllocatedNames(hewan.id, 'domba', bagian);

                            if (mqAlloc.length === 0 && pnAlloc.length === 0) return null;

                            return (
                              <div key={bagian} className="pt-2.5 first:pt-0 space-y-1.5">
                                <span className="text-[11px] font-bold text-gray-400 capitalize bg-[rgba(255,255,255,0.03)] px-1.5 py-0.5 rounded">
                                  {BAGIAN_LABELS[bagian]}
                                </span>
                                
                                {mqAlloc.length > 0 && (
                                  <div className="pl-2 space-y-1">
                                    {mqAlloc.map((item, idx) => (
                                      <div key={idx} className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/30" />
                                        <span>Muqorrib:</span>
                                        <span className="text-white font-semibold font-sans">{item.nama}</span>
                                        <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 px-1 rounded font-mono">
                                          {item.jumlah} Pkt
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {pnAlloc.length > 0 && (
                                  <div className="pl-2 space-y-1">
                                    {pnAlloc.map((name, idx) => (
                                      <div key={idx} className="flex items-center gap-1.5 text-[10px] text-amber-400 font-medium">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500/30" />
                                        <span>Panitia FIFO:</span>
                                        <span className="text-white font-semibold font-sans">{name}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-[10px] text-gray-500 italic py-2 text-center">Semua bagian utuh</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
