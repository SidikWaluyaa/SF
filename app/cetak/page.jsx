'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/layout/Header';
import { Settings, Printer, Beef, Rabbit, FileText, CheckSquare, Sparkles } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

export default function CetakPage() {
  const [docType, setDocType] = useState('daftar'); // 'daftar' | 'label' | 'tanda_terima' | 'ringkasan' | 'mustahiq' | 'panitia'
  const [animalType, setAnimalType] = useState('sapi'); // 'sapi' | 'domba'
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [mustahiqList, setMustahiqList] = useState([]);
  const [panitiaList, setPanitiaList] = useState([]);
  
  // Kop Surat & Form Settings
  const [dkmName, setDkmName] = useState('DKM SABILUL FITROH');
  const [year, setYear] = useState('1446 H./2025 M.');
  const [address, setAddress] = useState('Jl. Sriwijaya RW.10 Kel. Cigereleng-Kec. Regol Kota Bandung');
  const [chairmanName, setChairmanName] = useState('Ihsanudin Suhanda');

  const fetchData = useCallback(async () => {
    setLoading(true);
    // Fetch muqorrib
    const { data: muqorrib, error } = await supabase
      .from('muqorrib')
      .select('*, hewan_qurban!inner(jenis, nomor_hewan)')
      .eq('hewan_qurban.jenis', animalType);

    if (!error && muqorrib) {
      // Sort client-side by nomor_hewan (asc) then nomor_urut (asc) to guarantee absolute ordering
      const sorted = [...muqorrib].sort((a, b) => {
        const aNo = a.hewan_qurban?.nomor_hewan || 0;
        const bNo = b.hewan_qurban?.nomor_hewan || 0;
        if (aNo !== bNo) return aNo - bNo;
        return (a.nomor_urut || 0) - (b.nomor_urut || 0);
      });
      setData(sorted);
    }


    // Fetch mustahiq
    const { data: mustahiq } = await supabase
      .from('mustahiq')
      .select('*')
      .order('nomor_urut');
    setMustahiqList(mustahiq || []);

    // Fetch panitia
    const { data: panitias } = await supabase
      .from('panitia')
      .select('*')
      .order('nomor_urut');
    setPanitiaList(panitias || []);

    setLoading(false);
  }, [animalType]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const typeParam = params.get('type');
    if (typeParam && ['daftar', 'label', 'tanda_terima', 'ringkasan', 'mustahiq', 'panitia'].includes(typeParam)) {
      setDocType(typeParam);
    }
  }, []);

  const handlePrint = () => {
    window.print();
  };

  // Group data by animal number for merged cell rendering
  const groupedData = data.reduce((acc, curr) => {
    const key = curr.hewan_qurban?.nomor_hewan || 0;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(curr);
    return acc;
  }, {});

  // Document 1: Daftar Para Muqorrib Renderer
  const renderDaftarMuqorrib = () => {
    return (
      <div className="bg-white text-black p-8 font-sans border border-gray-200 shadow-sm print:shadow-none print:p-[15mm] print:border-none w-full max-w-[210mm] mx-auto min-h-[297mm]">
        {/* Kop Surat */}
        <div className="flex items-center gap-6 border-b border-black pb-2 mb-1">
          {/* Logo / Silhouette of Mosque */}
          <div className="w-16 h-16 flex items-center justify-center shrink-0">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h2 className="text-base font-bold uppercase tracking-wide leading-tight">Panitia Idul Adha {year}</h2>
            <h1 className="text-xl font-extrabold uppercase tracking-wider leading-none my-1">{dkmName}</h1>
            <p className="text-[10px] italic text-gray-700 leading-snug">{address}</p>
          </div>
        </div>
        {/* Double underline decoration */}
        <div className="border-b-4 border-double border-black pb-1 mb-6"></div>

        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-lg font-black uppercase tracking-widest border-b border-black inline-block px-4 pb-1">
            Daftar Para Muqarrib {animalType}
          </h1>
        </div>

        {/* Table */}
        <table className="w-full border-collapse border-2 border-black text-[12px]">
          <thead>
            <tr>
              <th className="border border-black bg-gray-100 py-2.5 px-3 uppercase tracking-wider text-left font-bold w-[30%]">
                Hewan Qurban
              </th>
              <th className="border border-black bg-gray-100 py-2.5 px-3 uppercase tracking-wider text-center font-bold w-[10%]">
                No
              </th>
              <th className="border border-black bg-gray-100 py-2.5 px-3 uppercase tracking-wider text-left font-bold w-[60%]">
                Nama Muqorrib
              </th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(groupedData).map((hewanNo) => {
              const rows = groupedData[hewanNo];
              return rows.map((item, index) => {
                const showMergeCell = index === 0;
                return (
                  <tr key={item.id} className="border-b border-black page-break-inside-avoid">
                    {showMergeCell && (
                      <td
                        rowSpan={rows.length}
                        className="border border-black py-4 px-4 font-bold text-sm text-center uppercase align-middle bg-white w-[30%] select-none font-mono"
                      >
                        {animalType.toUpperCase()} NO. {hewanNo}
                      </td>
                    )}
                    <td className="border border-black py-2 px-3 text-center font-bold font-mono w-[10%]">
                      {item.nomor_urut}
                    </td>
                    <td className="border border-black py-2 px-3 uppercase font-semibold text-left tracking-wide w-[60%]">
                      {item.nama_lengkap}
                    </td>
                  </tr>
                );
              });
            })}
            {data.length === 0 && (
              <tr>
                <td colSpan="3" className="border border-black text-center py-8 text-gray-500 font-medium">
                  Belum ada data muqorrib {animalType}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  // Document 2: Label Pesanan Para Muqorrib (Grid of cards)
  const renderLabelPesanan = () => {
    return (
      <div className="bg-white text-black p-6 print:p-[12mm] w-full max-w-[210mm] mx-auto min-h-[297mm]">
        <div className="grid grid-cols-2 gap-4 print:grid-cols-2 print:gap-3.5">
          {data.map((item, index) => {
            const displayOrderText = item.pesanan || 'BAGIAN KELUARGA';

            return (
              <div
                key={item.id}
                className="border-2 border-dashed border-[#2E4C6D]/45 rounded-2xl p-6 flex flex-col justify-between bg-white break-inside-avoid relative overflow-hidden shadow-sm hover:shadow-md transition-shadow aspect-[1.5/1] min-h-[175px] print:min-h-[170px]"
              >
                {/* Faint Mosque Logo Watermark Perfectly Centered */}
                <img 
                  src="/logo.png" 
                  alt="Watermark" 
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 opacity-[0.05] object-contain pointer-events-none select-none" 
                />

                {/* Top Right Badge: Animal Category, Nomor Hewan & Nomor Urut */}
                <div className="absolute top-5 right-5 bg-[#0D1E30] text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full font-mono">
                  {animalType.toUpperCase()} {item.hewan_qurban?.nomor_hewan} ({item.nomor_urut})
                </div>

                {/* Top Left: Muqorrib Info */}
                <div className="flex-grow flex flex-col justify-start text-left">
                  <h2 className="text-[18px] font-black uppercase tracking-wide leading-tight text-[#0D1E30] pr-20 break-words whitespace-normal font-sans">
                    {item.nama_pendek || item.nama_lengkap}
                  </h2>
                  <p className="text-[11px] text-gray-500 font-bold uppercase mt-2 tracking-wider leading-snug font-sans">
                    {item.alamat || 'ALAMAT BELUM DIISI'}
                  </p>
                </div>

                {/* Divider Line */}
                <div className="w-full border-b border-gray-200 my-3"></div>

                {/* Bottom: Order Details */}
                <div className="w-full flex flex-col items-center justify-center text-center pb-0.5">
                  <span className="text-[9px] font-bold text-gray-400 tracking-widest uppercase mb-1">
                    Pesanan Utama
                  </span>
                  <h3 className="text-[19px] font-black text-[#0D1E30] uppercase tracking-wide leading-none">
                    {displayOrderText}
                  </h3>
                </div>
              </div>
            );
          })}
          {data.length === 0 && (
            <div className="col-span-full border-2 border-dashed border-gray-300 rounded-2xl p-16 text-center text-gray-400 font-medium font-sans">
              Belum ada data muqorrib {animalType} untuk dicetak labelnya.
            </div>
          )}
        </div>
      </div>
    );
  };

  // Document 3: Tanda Terima Pesanan
  const renderTandaTerima = () => {
    if (data.length === 0) {
      return (
        <div className="bg-white text-black p-8 font-sans border border-gray-200 shadow-sm print:shadow-none print:p-[15mm] print:border-none w-full max-w-[210mm] mx-auto min-h-[297mm] flex flex-col justify-center items-center">
          <p className="text-gray-500 font-medium">Belum ada data muqorrib {animalType}</p>
        </div>
      );
    }

    if (animalType === 'sapi') {
      const hewanNos = Object.keys(groupedData).sort((a, b) => Number(a) - Number(b));
      
      return (
        <div className="space-y-8 print:space-y-0 print:bg-white w-full flex flex-col items-center">
          {hewanNos.map((hewanNo, sheetIdx) => {
            const groupMembers = groupedData[hewanNo] || [];
            const isLastSheet = sheetIdx === hewanNos.length - 1;

            return (
              <div 
                key={hewanNo} 
                className="bg-white text-black p-8 font-sans border border-gray-200 shadow-sm print:shadow-none print:p-[15mm] print:border-none w-full max-w-[210mm] mx-auto h-[297mm] flex flex-col justify-between overflow-hidden relative"
                style={{ pageBreakAfter: isLastSheet ? 'auto' : 'always', boxSizing: 'border-box' }}
              >
                <div>
                  {/* Header Title */}
                  <div className="text-center border-b border-black pb-2 mb-6">
                    <h1 className="text-base font-extrabold uppercase tracking-widest mb-1">Tanda Terima Pesanan Qaribun</h1>
                    <h2 className="text-sm font-bold uppercase tracking-wider mb-1">Qurban Tahun {year}</h2>
                    <h3 className="text-xs font-bold uppercase tracking-widest border-b-2 border-black inline-block px-6 pb-0.5">
                      SAPI NO. {hewanNo}
                    </h3>
                  </div>

                  {/* Table */}
                  <table className="w-full border-collapse border-2 border-black text-[11px]">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-black py-2.5 px-2 font-bold text-center w-[6%]">No</th>
                        <th className="border border-black py-2.5 px-3 font-bold text-left w-[32%]">Nama Qaribun</th>
                        <th className="border border-black py-2.5 px-3 font-bold text-left w-[24%]">Pesanan</th>
                        <th className="border border-black py-2.5 px-3 font-bold text-left w-[24%]">Alamat</th>
                        <th className="border border-black py-2.5 px-3 font-bold text-center w-[14%]">Tanda Tangan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupMembers.map((item, idx) => {
                        const displayOrderText = item.pesanan || 'BAGIAN KELUARGA';

                        return (
                          <tr key={item.id} className="border-b border-black">
                            <td className="border border-black py-2.5 px-2 text-center font-bold font-mono">
                              {idx + 1}
                            </td>
                            <td className="border border-black py-2.5 px-3 uppercase font-semibold text-left tracking-wide leading-tight">
                              {item.nama_lengkap}
                            </td>
                            <td className="border border-black py-2.5 px-3 uppercase text-left font-mono font-medium text-[10px] leading-tight">
                              {displayOrderText}
                            </td>
                            <td className="border border-black py-2.5 px-3 text-left leading-tight text-gray-700">
                              {item.alamat || '-'}
                            </td>
                            <td className="border border-black py-2.5 px-2 text-left relative min-h-[36px]">
                              <span className="text-[9px] font-mono text-gray-400 absolute top-1 left-1.5">{idx + 1}.</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Tanda Tangan Para Muqorrib */}
                <div className="mt-8 border-t border-black pt-4">
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-center mb-6">
                    TANDA TANGAN PARA MUQARRIB (SAPI NO. {hewanNo})
                  </span>
                  <div className="grid grid-cols-4 gap-y-8 gap-x-4 text-center text-[10px]">
                    {groupMembers.map((member, mIdx) => (
                      <div key={member.id} className="flex flex-col justify-between min-h-[65px] items-center">
                        <span className="font-semibold text-gray-500 uppercase">Muqorrib {mIdx + 1}</span>
                        <div className="my-2 border-b border-dashed border-gray-400 w-[110px]"></div>
                        <span className="font-bold uppercase text-[#0D1E30] truncate max-w-[120px]">{member.nama_pendek || member.nama_lengkap}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    // Default for Domba
    return (
      <div className="bg-white text-black p-8 font-sans border border-gray-200 shadow-sm print:shadow-none print:p-[15mm] print:border-none w-full max-w-[210mm] mx-auto min-h-[297mm] flex flex-col justify-between">
        <div>
          {/* Header Title */}
          <div className="text-center border-b border-black pb-2 mb-6">
            <h1 className="text-base font-extrabold uppercase tracking-widest mb-1">Tanda Terima Pesanan Qaribun</h1>
            <h2 className="text-sm font-bold uppercase tracking-wider mb-1">Qurban Tahun {year}</h2>
            <h3 className="text-xs font-bold uppercase tracking-widest border-b-2 border-black inline-block px-6 pb-0.5">
              {animalType.toUpperCase()}
            </h3>
          </div>

          {/* Table */}
          <table className="w-full border-collapse border-2 border-black text-[11px] page-break-inside-avoid">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black py-2.5 px-2 font-bold text-center w-[6%]">No</th>
                <th className="border border-black py-2.5 px-3 font-bold text-left w-[32%]">Nama Qaribun</th>
                <th className="border border-black py-2.5 px-3 font-bold text-left w-[24%]">Pesanan</th>
                <th className="border border-black py-2.5 px-3 font-bold text-left w-[24%]">Alamat</th>
                <th className="border border-black py-2.5 px-3 font-bold text-center w-[14%]">Tanda Tangan</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, idx) => {
                const displayOrderText = item.pesanan || 'BAGIAN KELUARGA';

                return (
                  <tr key={item.id} className="border-b border-black page-break-inside-avoid">
                    <td className="border border-black py-2.5 px-2 text-center font-bold font-mono">
                      {idx + 1}
                    </td>
                    <td className="border border-black py-2.5 px-3 uppercase font-semibold text-left tracking-wide leading-tight">
                      {item.nama_lengkap}
                    </td>
                    <td className="border border-black py-2.5 px-3 uppercase text-left font-mono font-medium text-[10px] leading-tight">
                      {displayOrderText}
                    </td>
                    <td className="border border-black py-2.5 px-3 text-left leading-tight text-gray-700">
                      {item.alamat || '-'}
                    </td>
                    <td className="border border-black py-2.5 px-2 text-left relative min-h-[36px]">
                      <span className="text-[9px] font-mono text-gray-400 absolute top-1 left-1.5">{idx + 1}.</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer & Tanda Tangan */}
        <div className="mt-12 page-break-inside-avoid">
          <div className="flex justify-between text-xs px-8">
            <div className="text-center w-[200px] flex flex-col justify-between min-h-[100px]">
              <span className="font-semibold">Ketua PANITIA</span>
              <span className="font-bold underline uppercase">{chairmanName}</span>
            </div>
            <div className="text-center w-[200px] flex flex-col justify-between min-h-[100px]">
              <span className="font-semibold">Petugas Lapangan</span>
              <div className="border-b border-black w-[150px] mx-auto mb-0.5"></div>
            </div>
          </div>
          <div className="text-right text-[8px] italic text-gray-500 mt-10 px-8">
            * Lembar bukti serah terima resmi DKM Sabilul Fitroh
          </div>
        </div>
      </div>
    );
  };

  // Document 4: Data Muqorrib Checklist
  const renderDataMuqorrib = () => {
    if (data.length === 0) {
      return (
        <div className="bg-white text-black p-8 font-sans border border-gray-200 shadow-sm print:shadow-none print:p-[15mm] print:border-none w-full max-w-[210mm] mx-auto min-h-[297mm] flex flex-col justify-center items-center">
          <p className="text-gray-500 font-medium">Belum ada data muqorrib {animalType}</p>
        </div>
      );
    }

    if (animalType === 'sapi') {
      const hewanNos = Object.keys(groupedData).sort((a, b) => Number(a) - Number(b));
      
      return (
        <div className="space-y-8 print:space-y-0 print:bg-white w-full flex flex-col items-center">
          {hewanNos.map((hewanNo, sheetIdx) => {
            const groupMembers = groupedData[hewanNo] || [];
            const isLastSheet = sheetIdx === hewanNos.length - 1;

            return (
              <div 
                key={hewanNo} 
                className="bg-white text-black p-8 font-sans border border-gray-200 shadow-sm print:shadow-none print:p-[15mm] print:border-none w-full max-w-[210mm] mx-auto h-[297mm] flex flex-col justify-between overflow-hidden relative"
                style={{ pageBreakAfter: isLastSheet ? 'auto' : 'always', boxSizing: 'border-box' }}
              >
                <div>
                  {/* Simple Document Header */}
                  <div className="text-center mb-6 border-b-2 border-black pb-3">
                    <h1 className="text-lg font-black uppercase tracking-wider">Lembar Checklist Data Muqorrib</h1>
                    <p className="text-xs uppercase tracking-widest text-gray-600 font-medium">Panitia Idul Adha {year}</p>
                    <h3 className="text-xs font-bold uppercase tracking-widest border-b-2 border-black inline-block px-6 pb-0.5 mt-2">
                      SAPI NO. {hewanNo}
                    </h3>
                  </div>

                  {/* Grouped Table */}
                  <table className="w-full border-collapse border-2 border-black text-[12px]">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-black py-2.5 px-3 uppercase tracking-wider text-center font-bold w-[15%]">
                          No
                        </th>
                        <th className="border border-black py-2.5 px-3 uppercase tracking-wider text-left font-bold w-[65%]">
                          Nama Muqorrib
                        </th>
                        <th className="border border-black py-2.5 px-3 uppercase tracking-wider text-center font-bold w-[20%]">
                          Checklist
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupMembers.map((item, idx) => {
                        return (
                          <tr key={item.id} className="border-b border-black page-break-inside-avoid">
                            <td className="border border-black py-2.5 px-3 text-center font-bold font-mono">
                              {idx + 1}
                            </td>
                            <td className="border border-black py-2.5 px-3 uppercase font-semibold text-left tracking-wide">
                              {item.nama_lengkap}
                            </td>
                            <td className="border border-black py-2.5 px-3 text-center">
                              <div className="w-4 h-4 border border-black mx-auto rounded-sm"></div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Tanda Tangan Para Muqorrib */}
                <div className="mt-8 border-t border-black pt-4">
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-center mb-6">
                    TANDA TANGAN PARA MUQARRIB (SAPI NO. {hewanNo})
                  </span>
                  <div className="grid grid-cols-4 gap-y-8 gap-x-4 text-center text-[10px]">
                    {groupMembers.map((member, mIdx) => (
                      <div key={member.id} className="flex flex-col justify-between min-h-[65px] items-center">
                        <span className="font-semibold text-gray-500 uppercase">Muqorrib {mIdx + 1}</span>
                        <div className="my-2 border-b border-dashed border-gray-400 w-[110px]"></div>
                        <span className="font-bold uppercase text-[#0D1E30] truncate max-w-[120px]">{member.nama_pendek || member.nama_lengkap}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    // Default for Domba
    return (
      <div className="bg-white text-black p-8 font-sans border border-gray-200 shadow-sm print:shadow-none print:p-[15mm] print:border-none w-full max-w-[210mm] mx-auto min-h-[297mm] flex flex-col justify-between">
        <div>
          {/* Simple Document Header */}
          <div className="text-center mb-6 border-b-2 border-black pb-3">
            <h1 className="text-lg font-black uppercase tracking-wider">Lembar Checklist Data Muqorrib {animalType}</h1>
            <p className="text-xs uppercase tracking-widest text-gray-600 font-medium">Panitia Idul Adha {year}</p>
          </div>

          {/* Grouped Table */}
          <table className="w-full border-collapse border-2 border-black text-[12px]">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black py-2.5 px-3 uppercase tracking-wider text-left font-bold w-[30%]">
                  Hewan Qurban
                </th>
                <th className="border border-black py-2.5 px-3 uppercase tracking-wider text-center font-bold w-[10%]">
                  No
                </th>
                <th className="border border-black py-2.5 px-3 uppercase tracking-wider text-left font-bold w-[45%]">
                  Nama Muqorrib
                </th>
                <th className="border border-black py-2.5 px-3 uppercase tracking-wider text-center font-bold w-[15%]">
                  Checklist
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, idx) => {
                return (
                  <tr key={item.id} className="border-b border-black page-break-inside-avoid">
                    <td className="border border-black py-4 px-4 font-bold text-sm text-center uppercase align-middle bg-white w-[30%] font-mono">
                      {animalType.toUpperCase()} NO. {item.hewan_qurban?.nomor_hewan}
                    </td>
                    <td className="border border-black py-2 px-3 text-center font-bold font-mono w-[10%]">
                      {idx + 1}
                    </td>
                    <td className="border border-black py-2 px-3 uppercase font-semibold text-left tracking-wide w-[45%]">
                      {item.nama_lengkap}
                    </td>
                    <td className="border border-black py-2 px-3 text-center w-[15%]">
                      <div className="w-4 h-4 border border-black mx-auto rounded-sm"></div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer & Tanda Tangan */}
        <div className="mt-12 page-break-inside-avoid">
          <div className="flex justify-between text-xs px-8">
            <div className="text-center w-[200px] flex flex-col justify-between min-h-[100px]">
              <span className="font-semibold">Ketua PANITIA</span>
              <span className="font-bold underline uppercase">{chairmanName}</span>
            </div>
            <div className="text-center w-[200px] flex flex-col justify-between min-h-[100px]">
              <span className="font-semibold">Petugas Lapangan</span>
              <div className="border-b border-black w-[150px] mx-auto mb-0.5"></div>
            </div>
          </div>
          <div className="text-right text-[8px] italic text-gray-500 mt-10 px-8">
            * Lembar bukti checklist resmi DKM Sabilul Fitroh
          </div>
        </div>
      </div>
    );
  };

  // Document 5: Daftar Kelompok Mustahiq
  const renderDaftarMustahiq = () => {
    const totalJiwa = mustahiqList.reduce((sum, m) => sum + (m.jiwa_kk || 0), 0);
    return (
      <div className="bg-white text-black p-8 font-sans border border-gray-200 shadow-sm print:shadow-none print:p-[15mm] print:border-none w-full max-w-[210mm] mx-auto min-h-[297mm] flex flex-col justify-between">
        <div>
          {/* Kop Surat */}
          <div className="flex items-center gap-6 border-b border-black pb-2 mb-1">
            <div className="w-16 h-16 flex items-center justify-center shrink-0">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="text-base font-bold uppercase tracking-wide leading-tight">Panitia Idul Adha {year}</h2>
              <h1 className="text-xl font-extrabold uppercase tracking-wider leading-none my-1">{dkmName}</h1>
              <p className="text-[10px] italic text-gray-700 leading-snug">{address}</p>
            </div>
          </div>
          {/* Double underline decoration */}
          <div className="border-b-4 border-double border-black pb-1 mb-6"></div>

          {/* Title */}
          <div className="text-center mb-6">
            <h1 className="text-lg font-black uppercase tracking-widest border-b border-black inline-block px-4 pb-1">
              Daftar Kelompok Mustahiq
            </h1>
          </div>

          {/* Table */}
          <table className="w-full border-collapse border-2 border-black text-[12px] page-break-inside-avoid">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black py-2.5 px-3 font-bold text-center w-[15%]">No Urut</th>
                <th className="border border-black py-2.5 px-3 font-bold text-left w-[60%]">Nama Kelompok / Penerima</th>
                <th className="border border-black py-2.5 px-3 font-bold text-center w-[25%]">Jumlah Jiwa / KK</th>
              </tr>
            </thead>
            <tbody>
              {mustahiqList.map((item) => (
                <tr key={item.id} className="border-b border-black page-break-inside-avoid">
                  <td className="border border-black py-2 px-3 text-center font-bold font-mono">
                    {item.nomor_urut}
                  </td>
                  <td className="border border-black py-2 px-3 uppercase font-semibold text-left tracking-wide">
                    {item.nama_kelompok}
                  </td>
                  <td className="border border-black py-2 px-3 text-center font-bold font-mono text-[13px]">
                    {formatNumber(item.jiwa_kk)}
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-extrabold text-[13px]">
                <td colSpan="2" className="border border-black py-3 px-4 text-right uppercase tracking-wider">
                  TOTAL JIWA / KK
                </td>
                <td className="border border-black py-3 px-3 text-center font-mono bg-emerald-50 text-emerald-800">
                  {formatNumber(totalJiwa)}
                </td>
              </tr>
              {mustahiqList.length === 0 && (
                <tr>
                  <td colSpan="3" className="border border-black text-center py-8 text-gray-500">
                    Belum ada data mustahiq
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer & Tanda Terima */}
        <div className="mt-12 page-break-inside-avoid">
          <div className="flex justify-between text-xs px-8">
            <div className="text-center w-[200px] flex flex-col justify-between min-h-[100px]">
              <span className="font-semibold">Ketua PANITIA</span>
              <span className="font-bold underline uppercase">{chairmanName}</span>
            </div>
            <div className="text-center w-[200px] flex flex-col justify-between min-h-[100px]">
              <span className="font-semibold">Petugas Distribusi</span>
              <div className="border-b border-black w-full mx-auto mb-0.5"></div>
            </div>
          </div>
          <div className="text-right text-[8px] italic text-gray-500 mt-10 px-8">
            Dokumen Resmi Panitia Distribusi Daging Qurban
          </div>
        </div>
      </div>
    );
  };

  // Document 6: Daftar Panitia Pelaksana
  const BAGIAN_LABELS_PRINT = {
    kepala_sapi: 'Kepala Sapi', cokor_sapi: 'Cokor Sapi', buntut_sapi: 'Buntut Sapi',
    siki_sapi: 'Siki Sapi', ati_sapi: 'Ati Sapi', kulit_sapi: 'Kulit Sapi',
    kepala_domba: 'Kepala Domba', cokor_domba: 'Cokor Domba',
    siki_domba: 'Siki Domba', ati_domba: 'Ati Domba', kulit_domba: 'Kulit Domba',
  };

  const renderDaftarPanitia = () => {
    return (
      <div className="bg-white text-black p-8 font-sans border border-gray-200 shadow-sm print:shadow-none print:p-[15mm] print:border-none w-full max-w-[210mm] mx-auto min-h-[297mm] flex flex-col justify-between">
        <div>
          {/* Kop Surat */}
          <div className="flex items-center gap-6 border-b border-black pb-2 mb-1">
            <div className="w-16 h-16 flex items-center justify-center shrink-0">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="text-base font-bold uppercase tracking-wide leading-tight">Panitia Idul Adha {year}</h2>
              <h1 className="text-xl font-extrabold uppercase tracking-wider leading-none my-1">{dkmName}</h1>
              <p className="text-[10px] italic text-gray-700 leading-snug">{address}</p>
            </div>
          </div>
          <div className="border-b-4 border-double border-black pb-1 mb-6"></div>

          {/* Title */}
          <div className="text-center mb-6">
            <h1 className="text-lg font-black uppercase tracking-widest border-b border-black inline-block px-4 pb-1">
              Daftar Panitia Pelaksana Qurban
            </h1>
          </div>

          {/* Table */}
          <table className="w-full border-collapse border-2 border-black text-[12px] page-break-inside-avoid">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black py-2.5 px-2 font-bold text-center w-[8%]">No</th>
                <th className="border border-black py-2.5 px-3 font-bold text-left w-[35%]">Nama Lengkap</th>
                <th className="border border-black py-2.5 px-3 font-bold text-left w-[22%]">Jabatan</th>
                <th className="border border-black py-2.5 px-3 font-bold text-center w-[20%]">Alokasi Bagian</th>
                <th className="border border-black py-2.5 px-3 font-bold text-center w-[15%]">No. HP</th>
              </tr>
            </thead>
            <tbody>
              {panitiaList.map((item) => (
                <tr key={item.id} className="border-b border-black page-break-inside-avoid">
                  <td className="border border-black py-2 px-2 text-center font-bold font-mono">
                    {item.nomor_urut}
                  </td>
                  <td className="border border-black py-2 px-3 uppercase font-semibold text-left tracking-wide">
                    {item.nama_lengkap}
                  </td>
                  <td className="border border-black py-2 px-3 text-left">
                    {item.jabatan || '-'}
                  </td>
                  <td className="border border-black py-2 px-3 text-center font-mono text-[11px]">
                    {item.bagian ? (BAGIAN_LABELS_PRINT[item.bagian] || item.bagian) : ''}
                  </td>
                  <td className="border border-black py-2 px-3 text-center font-mono text-[11px]">
                    {item.no_hp || '-'}
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-extrabold text-[13px]">
                <td colSpan="5" className="border border-black py-3 px-4 text-center uppercase tracking-wider">
                  Total Panitia: {formatNumber(panitiaList.length)} Orang
                </td>
              </tr>
              {panitiaList.length === 0 && (
                <tr>
                  <td colSpan="5" className="border border-black text-center py-8 text-gray-500">
                    Belum ada data panitia
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer & Tanda Tangan */}
        <div className="mt-12 page-break-inside-avoid">
          <div className="flex justify-between text-xs px-8">
            <div className="text-center w-[200px] flex flex-col justify-between min-h-[100px]">
              <span className="font-semibold">Ketua PANITIA</span>
              <span className="font-bold underline uppercase">{chairmanName}</span>
            </div>
            <div className="text-center w-[200px] flex flex-col justify-between min-h-[100px]">
              <span className="font-semibold">Sekretaris</span>
              <div className="border-b border-black w-full mx-auto mb-0.5"></div>
            </div>
          </div>
          <div className="text-right text-[8px] italic text-gray-500 mt-10 px-8">
            Dokumen Resmi Susunan Panitia Qurban
          </div>
        </div>
      </div>
    );
  };


  const renderActiveDocument = () => {
    switch (docType) {
      case 'daftar':
        return renderDaftarMuqorrib();
      case 'label':
        return renderLabelPesanan();
      case 'tanda_terima':
        return renderTandaTerima();
      case 'ringkasan':
        return renderDataMuqorrib();
      case 'mustahiq':
        return renderDaftarMustahiq();
      case 'panitia':
        return renderDaftarPanitia();

      default:
        return renderDaftarMuqorrib();
    }
  };

  return (
    <div className="flex flex-col h-full print:block print:h-auto print:p-0">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 portrait !important;
            margin: 0 !important;
          }
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}} />
      <div className="print:hidden no-print shrink-0">
        <Header
          title="Print & Document Center"
          subtitle="Cetak lembar operasional lapangan & PDF tanda terima resmi beresolusi tinggi"
        >
          <button onClick={handlePrint} className="btn-primary flex items-center gap-2 px-6">
            <Printer className="w-4 h-4" />
            Cetak Dokumen (PDF)
          </button>
        </Header>
      </div>

      <div className="flex-grow flex gap-6 overflow-hidden p-6 print:block print:p-0 print:overflow-visible">
        <div className="w-[320px] shrink-0 glass-card p-5 flex flex-col gap-5 overflow-y-auto print:hidden no-print animate-slide-in-left">
          <div className="flex items-center gap-2 border-b border-[rgba(55,65,81,0.3)] pb-3">
            <Settings className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white tracking-wide uppercase">Konfigurasi Dokumen</h3>
          </div>

          <div className="space-y-4 flex-grow">
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Jenis Dokumen
              </label>
              <div className="relative">
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="form-input text-xs font-semibold"
                >
                  <option value="daftar">1. Daftar Muqorrib (Kop)</option>
                  <option value="label">2. Label Pesanan Muqorrib</option>
                  <option value="tanda_terima">3. Lembar Tanda Terima</option>
                  <option value="ringkasan">4. Checklist Data Muqorrib</option>
                  <option value="mustahiq">5. Daftar Penerima Daging (Mustahiq)</option>
                  <option value="panitia">6. Daftar Panitia Pelaksana</option>

                </select>
              </div>
            </div>

            {/* Animal Category Toggle Buttons */}
            {docType !== 'mustahiq' && docType !== 'panitia' && (
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Jenis Hewan Qurban
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setAnimalType('sapi')}
                    className={`btn-sm font-semibold flex items-center justify-center gap-1.5 border h-[38px] ${
                      animalType === 'sapi'
                        ? 'btn-primary border-emerald-500/30'
                        : 'btn-secondary border-[rgba(55,65,81,0.5)]'
                    }`}
                  >
                    <Beef className="w-3.5 h-3.5" />
                    Sapi
                  </button>
                  <button
                    onClick={() => setAnimalType('domba')}
                    className={`btn-sm font-semibold flex items-center justify-center gap-1.5 border h-[38px] ${
                      animalType === 'domba'
                        ? 'btn-primary border-amber-500/30'
                        : 'btn-secondary border-[rgba(55,65,81,0.5)]'
                    }`}
                  >
                    <Rabbit className="w-3.5 h-3.5" />
                    Domba
                  </button>
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-[rgba(55,65,81,0.2)] my-3" />

            {/* Kop Surat Header Details */}
            {docType !== 'label' && (
              <>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Nama DKM / Organisasi
                  </label>
                  <input
                    type="text"
                    value={dkmName}
                    onChange={(e) => setDkmName(e.target.value)}
                    className="form-input text-xs"
                    placeholder="Contoh: DKM SABILUL FITROH"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Tahun Qurban
                  </label>
                  <input
                    type="text"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="form-input text-xs"
                    placeholder="Contoh: 1446 H./2025 M."
                  />
                </div>

                {(docType === 'daftar' || docType === 'papan_puzzle') && (
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                      Alamat DKM
                    </label>
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="form-input text-xs h-16 resize-none"
                      placeholder="Masukkan alamat lengkap..."
                    />
                  </div>
                )}

                {(docType === 'tanda_terima' || docType === 'papan_puzzle') && (
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                      Nama Ketua Panitia
                    </label>
                    <input
                      type="text"
                      value={chairmanName}
                      onChange={(e) => setChairmanName(e.target.value)}
                      className="form-input text-xs"
                      placeholder="Contoh: Ihsanudin Suhanda"
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Trigger Print Button inside the panel */}
          <button
            onClick={handlePrint}
            className="w-full btn-primary flex items-center justify-center gap-2 h-10 shadow-lg shadow-emerald-500/20"
          >
            <Printer className="w-4 h-4" />
            Cetak Sekarang
          </button>
        </div>

        {/* Right Live Print Preview Frame */}
        <div className="flex-1 bg-[rgba(17,24,39,0.5)] border border-[rgba(55,65,81,0.4)] rounded-2xl p-6 overflow-y-auto flex justify-center items-start print:block print:w-full print:h-auto print:p-0 print:border-none print:bg-white print:overflow-visible animate-fade-in shadow-inner">
          <div className="w-full flex justify-center print:w-full print:block">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-16 text-gray-400 gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin"></div>
                <span className="text-xs font-semibold tracking-wider font-mono">Mengunduh data qurban...</span>
              </div>
            ) : (
              <div className="print:w-full print:block">
                {renderActiveDocument()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
