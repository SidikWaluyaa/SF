'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/layout/Header';
import { Printer } from 'lucide-react';

export default function PuzzlePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allMuqorribList, setAllMuqorribList] = useState([]);
  const [mustahiqList, setMustahiqList] = useState([]);
  
  // Settings / Control Panel States
  const heightPages = 3; // Fixed at 3 pages vertically for perfect 90cm height
  const [printSapi, setPrintSapi] = useState(true);
  const [printDomba, setPrintDomba] = useState(true);
  const [printMustahiq, setPrintMustahiq] = useState(true);
  const [dkmName, setDkmName] = useState('DKM SABILUL FITROH');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all muqorribs (sapi + domba)
      const { data: allMuqorrib, error: err1 } = await supabase
        .from('muqorrib')
        .select('*, hewan_qurban(jenis, nomor_hewan)');

      if (err1) {
        console.error('Error fetching muqorribs:', err1);
        setError(`Gagal memuat data Muqorrib: ${err1.message}`);
      } else if (allMuqorrib) {
        const sorted = [...allMuqorrib].sort((a, b) => {
          if (a.hewan_qurban?.jenis !== b.hewan_qurban?.jenis) {
            return a.hewan_qurban?.jenis === 'sapi' ? -1 : 1;
          }
          const aNo = a.hewan_qurban?.nomor_hewan || 0;
          const bNo = b.hewan_qurban?.nomor_hewan || 0;
          if (aNo !== bNo) return aNo - bNo;
          return (a.nomor_urut || 0) - (b.nomor_urut || 0);
        });
        setAllMuqorribList(sorted);
      }

      // Fetch mustahiq
      const { data: mustahiq, error: err2 } = await supabase
        .from('mustahiq')
        .select('*')
        .order('nomor_urut');
      
      if (err2) {
        console.error('Error fetching mustahiq:', err2);
        setError(`Gagal memuat data Mustahiq: ${err2.message}`);
      } else {
        setMustahiqList(mustahiq || []);
      }
    } catch (e) {
      console.error('Unhandled error in fetchData:', e);
      setError(`Terjadi kesalahan sistem: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Group data by type
  const sapiMuqorribs = allMuqorribList.filter((m) => m.hewan_qurban?.jenis === 'sapi');
  const dombaMuqorribs = allMuqorribList.filter((m) => m.hewan_qurban?.jenis === 'domba');

  // Algorithm to distribute rows across exactly 3 pages (where Page 1 gets slightly fewer due to header)
  const distributeRows = (rows, numPages = 3) => {
    const result = Array.from({ length: numPages }, () => []);
    if (rows.length === 0) return result;

    if (rows.length <= numPages) {
      for (let i = 0; i < rows.length; i++) {
        result[i].push(rows[i]);
      }
      return result;
    }

    // Page 1 gets a slightly smaller share due to the tall header
    const p1Count = Math.max(1, Math.min(7, Math.floor(rows.length / 3.5)));
    const remainingCount = rows.length - p1Count;
    const remainingPages = numPages - 1; // 2 pages

    const base = Math.floor(remainingCount / remainingPages);
    const extra = remainingCount % remainingPages;

    const pageSizes = [
      p1Count,
      base + (extra > 0 ? 1 : 0),
      base
    ];

    let currentIndex = 0;
    for (let p = 0; p < numPages; p++) {
      const size = pageSizes[p];
      result[p] = rows.slice(currentIndex, currentIndex + size);
      currentIndex += size;
    }

    return result;
  };

  // Distribute data across the 3 pages
  const sapiPagesData = distributeRows(sapiMuqorribs, heightPages);
  const dombaPagesData = distributeRows(dombaMuqorribs, heightPages);
  const mustahiqPagesData = distributeRows(mustahiqList, heightPages);

  // Helper to render columns inside a page
  const renderColumnContent = (colType, pageIndex, isMini = false) => {
    let title = '';
    let subtitle = '';
    let rows = [];

    if (colType === 'sapi-nama') {
      title = 'NAMA MUQARRIB';
      rows = sapiPagesData[pageIndex] || [];
    } else if (colType === 'sapi-pesanan') {
      title = 'SAPI';
      subtitle = 'PESANAN';
      rows = sapiPagesData[pageIndex] || [];
    } else if (colType === 'domba-nama') {
      title = 'NAMA MUQARRIB';
      rows = dombaPagesData[pageIndex] || [];
    } else if (colType === 'domba-pesanan') {
      title = 'DOMBA';
      subtitle = 'PESANAN';
      rows = dombaPagesData[pageIndex] || [];
    } else if (colType === 'mustahiq-nama') {
      title = 'NAMA KELOMPOK';
      rows = mustahiqPagesData[pageIndex] || [];
    } else if (colType === 'mustahiq-jiwa') {
      title = 'MUSTAHIQ';
      subtitle = 'JIWA/KK';
      rows = mustahiqPagesData[pageIndex] || [];
    }

    const isHeaderPage = pageIndex === 0;

    return (
      <div className={`w-full h-full flex flex-col justify-start border-[3px] border-black bg-white`} style={{ height: '100%' }}>
        {/* Header Block */}
        {isHeaderPage && (
          <div className="border-b-[3px] border-black flex flex-col shrink-0">
            {subtitle ? (
              // Merged main title + subtitle layout
              <>
                <div 
                  className={`bg-white font-extrabold text-black flex items-center justify-center border-b-[3px] border-black select-none`}
                  style={{ height: isMini ? '16px' : '25mm', fontSize: isMini ? '8px' : '28pt' }}
                >
                  {title}
                </div>
                <div 
                  className={`bg-white font-bold text-black flex items-center justify-center select-none`}
                  style={{ height: isMini ? '12px' : '20mm', fontSize: isMini ? '6px' : '20pt' }}
                >
                  {subtitle}
                </div>
              </>
            ) : (
              // Simple tall title block
              <div 
                className={`bg-white font-bold text-black flex items-center justify-center select-none text-center`}
                style={{ height: isMini ? '28px' : '45mm', fontSize: isMini ? '6px' : '20pt', padding: isMini ? '0 2px' : '0 10mm' }}
              >
                {title}
              </div>
            )}
          </div>
        )}

        {/* Rows Block */}
        <div className="flex-grow flex flex-col justify-between">
          {rows.length > 0 ? (
            rows.map((row, idx) => {
              let displayVal = '';
              let isSpecialVal = false;

              if (colType === 'sapi-nama' || colType === 'domba-nama') {
                displayVal = row.nama_pendek || row.nama_lengkap || '';
              } else if (colType === 'sapi-pesanan' || colType === 'domba-pesanan') {
                displayVal = row.pesanan || 'BAGIAN KELUARGA';
                isSpecialVal = true;
              } else if (colType === 'mustahiq-nama') {
                displayVal = `${row.nomor_urut}. ${row.nama_kelompok}`;
              } else if (colType === 'mustahiq-jiwa') {
                displayVal = `${row.jiwa_kk} JIWA / KK`;
                isSpecialVal = true;
              }

              return (
                <div 
                  key={idx}
                  className={`border-b-[2px] border-black flex items-center pl-4 font-black uppercase select-none ${
                    isSpecialVal ? 'text-gray-700' : 'text-black'
                  }`}
                  style={{ 
                    height: isMini 
                      ? `${100 / rows.length}%` 
                      : `${(isHeaderPage ? 200 : 245) / rows.length}mm`, 
                    fontSize: isMini ? '4px' : (colType.includes('pesanan') || colType.includes('jiwa') ? '18pt' : '22pt'),
                    borderBottomWidth: idx === rows.length - 1 ? '0px' : '2px'
                  }}
                >
                  {displayVal}
                </div>
              );
            })
          ) : (
            <div className="flex-grow flex items-center justify-center text-gray-300 font-mono" style={{ fontSize: isMini ? '4px' : '14pt' }}>
              KOSONG
            </div>
          )}
        </div>
      </div>
    );
  };

  // Main puzzle A4 Portrait Page Renderer
  const renderPuzzlePage = (colType, pageIndex, pageNum, totalPages, isMini = false, keyVal = null) => {
    let colName = '';
    if (colType.includes('sapi')) colName = 'SAPI';
    else if (colType.includes('domba')) colName = 'DOMBA';
    else colName = 'MUSTAHIQ';

    const colNum = colType.includes('nama') ? 1 : 2;

    return (
      <div 
        key={keyVal}
        className={isMini 
          ? 'w-full aspect-[210/297] p-1.5 rounded-sm border-gray-400 bg-white text-black border-[1px] border-black relative flex flex-col justify-between overflow-hidden shadow-sm' 
          : 'puzzle-page bg-white text-black p-[8mm] print:p-[8mm]'
        }
        style={{ boxSizing: 'border-box' }}
      >
        {/* Outer Frame Border inside the page */}
        <div className={`border-[3px] border-black h-full w-full flex flex-col justify-between p-[8mm] ${isMini ? 'p-1 border-[1.5px]' : ''}`} style={{ boxSizing: 'border-box' }}>
          
          {/* Header coordinate info */}
          <div className={`font-mono text-gray-500 font-extrabold flex justify-between select-none ${isMini ? 'text-[3px]' : 'text-[9pt]'}`}>
            <span>[KOLOM {colName} - BAGIAN {colNum}]</span>
            <span>BARIS {pageIndex + 1} / {heightPages}</span>
          </div>

          {/* Actual column content block */}
          <div className="flex-grow flex items-stretch mt-2 mb-2 overflow-hidden" style={{ height: isMini ? 'auto' : '245mm' }}>
            {renderColumnContent(colType, pageIndex, isMini)}
          </div>

          {/* Assembly Footnote line */}
          <div className={`border-t-[1.5px] border-black pt-1 flex justify-between items-center font-mono text-black font-bold select-none ${isMini ? 'text-[3px] pt-0.5' : 'text-[9pt]'}`}>
            <span className="tracking-wide">PANITIA QURBAN {dkmName}</span>
            <span className="bg-black text-white px-2 py-0.5 rounded-sm">HALAMAN {pageNum} DARI {totalPages}</span>
          </div>

        </div>
      </div>
    );
  };

  // Compile active columns to print
  const activeCols = [];
  if (printSapi) {
    activeCols.push({ id: 'sapi-nama', name: 'SAPI: NAMA MUQARRIB' });
    activeCols.push({ id: 'sapi-pesanan', name: 'SAPI: PESANAN' });
  }
  if (printDomba) {
    activeCols.push({ id: 'domba-nama', name: 'DOMBA: NAMA MUQARRIB' });
    activeCols.push({ id: 'domba-pesanan', name: 'DOMBA: PESANAN' });
  }
  if (printMustahiq) {
    activeCols.push({ id: 'mustahiq-nama', name: 'MUSTAHIQ: KELOMPOK' });
    activeCols.push({ id: 'mustahiq-jiwa', name: 'MUSTAHIQ: JIWA/KK' });
  }

  const totalPagesToPrint = activeCols.length * heightPages;

  // Render miniature live preview grid
  const renderMiniatureGrid = () => {
    if (activeCols.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500 font-mono text-sm">
          Silakan pilih minimal satu kategori kolom untuk ditampilkan
        </div>
      );
    }

    return (
      <div 
        className="grid gap-2 p-4 bg-gray-950/60 border border-[rgba(55,65,81,0.4)] rounded-xl w-full"
        style={{ gridTemplateColumns: `repeat(${activeCols.length}, minmax(0, 1fr))` }}
      >
        {/* Column Names Headers */}
        {activeCols.map((col) => (
          <div key={col.id} className="text-center font-extrabold text-[10px] tracking-wider text-emerald-400 select-none pb-1 border-b border-gray-800">
            {col.name}
          </div>
        ))}

        {/* Row-by-Row puzzle page preview blocks */}
        {Array.from({ length: heightPages }).map((_, rIdx) => (
          activeCols.map((col, cIdx) => {
            const pageNum = cIdx * heightPages + rIdx + 1;
            return (
              <div key={`${col.id}-${rIdx}`} className="transition-all hover:scale-[1.05] hover:z-20 duration-300 relative group cursor-pointer shadow-lg">
                {renderPuzzlePage(col.id, rIdx, pageNum, totalPagesToPrint, true, `${col.id}-${rIdx}-mini`)}
                <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-sm">
                  <span className="text-[7px] font-mono text-white font-extrabold px-1.5 py-0.5 bg-emerald-500 rounded-sm">
                    HALAMAN {pageNum}
                  </span>
                </div>
              </div>
            );
          })
        ))}
      </div>
    );
  };

  return (
    <div className="h-full print:block">
      {/* Dynamic Native Print CSS Injector for absolute Portrait A4 */}
      <style dangerouslySetInnerHTML={{ __html: `
        .print-only-view {
          display: none !important;
        }
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
          .print-only-view {
            display: block !important;
          }
        }
      `}} />

      {/* 1. Web UI View (Hidden in Print) */}
      <div className="flex flex-col h-full print:hidden no-print">
        {/* Web UI Header - Hidden during print */}
        <div className="shrink-0">
          <Header
            title="Papan Monitoring Puzzle (POTRET A4)"
            subtitle="Cetak lembar A4 Portrait secara hemat & rapi untuk dirakit menjadi papan dinding 90×120 cm (18 Halaman)"
          >
            <div className="flex items-center gap-3">
              <button 
                onClick={() => window.print()} 
                className="btn-primary flex items-center gap-2 px-6"
                disabled={loading || activeCols.length === 0}
              >
                <Printer className="w-4 h-4" />
                Cetak {totalPagesToPrint} Halaman (PDF)
              </button>
            </div>
          </Header>
        </div>

        {/* Main Content Area */}
        <div className="flex-grow overflow-y-auto p-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 p-4 rounded-xl text-center font-bold max-w-[1000px] w-full mb-6 select-none animate-slide-in-top">
              ⚠️ Terjadi Kesalahan: {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center space-y-3">
                <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto" />
                <p className="text-sm text-gray-400">Menghubungkan ke Supabase...</p>
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center gap-6">
              
              {/* Interactive Control Dashboard Panel */}
              <div className="w-full max-w-[1000px] grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-in-top">
                
                {/* Category Select Panel */}
                <div className="glass-card p-4 rounded-xl border border-[rgba(55,65,81,0.3)] space-y-3">
                  <p className="text-xs font-bold text-emerald-400 tracking-wider">🎯 PILIH KOLOM PUZZLE</p>
                  <div className="grid grid-cols-3 gap-3">
                    <label className="flex items-center gap-3 cursor-pointer text-gray-300 text-sm font-bold">
                      <input 
                        type="checkbox" 
                        checked={printSapi} 
                        onChange={(e) => setPrintSapi(e.target.checked)}
                        className="checkbox-emerald w-4 h-4 rounded" 
                      />
                      <span>SAPI ({sapiMuqorribs.length})</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer text-gray-300 text-sm font-bold">
                      <input 
                        type="checkbox" 
                        checked={printDomba} 
                        onChange={(e) => setPrintDomba(e.target.checked)}
                        className="checkbox-emerald w-4 h-4 rounded" 
                      />
                      <span>DOMBA ({dombaMuqorribs.length})</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer text-gray-300 text-sm font-bold">
                      <input 
                        type="checkbox" 
                        checked={printMustahiq} 
                        onChange={(e) => setPrintMustahiq(e.target.checked)}
                        className="checkbox-emerald w-4 h-4 rounded" 
                      />
                      <span>MUSTAHIQ ({mustahiqList.length})</span>
                    </label>
                  </div>
                </div>

                {/* DKM Config Panel */}
                <div className="glass-card p-4 rounded-xl border border-[rgba(55,65,81,0.3)] space-y-3">
                  <p className="text-xs font-bold text-emerald-400 tracking-wider">🏢 NAMA DKIM / KAKI CETAKAN</p>
                  <div className="space-y-1">
                    <input 
                      type="text" 
                      value={dkmName} 
                      onChange={(e) => setDkmName(e.target.value.toUpperCase())}
                      className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono uppercase focus:outline-none focus:border-emerald-500" 
                    />
                  </div>
                </div>

              </div>

              {/* Miniature Preview Panel */}
              <div className="w-full max-w-[1000px] flex flex-col items-center gap-4 bg-[rgba(10,14,23,0.7)] p-6 rounded-2xl border border-[rgba(55,65,81,0.3)] backdrop-blur-xl animate-slide-in-top">
                <div className="text-center space-y-1">
                  <span className="badge badge-emerald uppercase tracking-widest text-[9px] px-3 py-1 font-bold">✨ MINIATURE LIVE PREVIEW</span>
                  <h2 className="text-sm font-extrabold text-white">Pratinjau Assembled Papan Puzzle Monitoring (Potret A4)</h2>
                  <p className="text-xs text-gray-400 max-w-lg mx-auto">
                    Model dinding rakitan Anda. Dicetak berurutan sebanyak <strong>{totalPagesToPrint} halaman A4 Portrait (Grid {activeCols.length}×3)</strong>. Rekatkan dari atas ke bawah untuk membentuk kolom tabel raksasa.
                  </p>
                </div>

                {/* Grid renders columns */}
                {renderMiniatureGrid()}

                {/* Assembly Instructions box */}
                <div className="w-full mt-2 bg-gray-900/40 rounded-xl p-4 border border-gray-800/40">
                  <p className="text-[11px] font-bold text-white mb-2">📋 Petunjuk Perakitan Super Hemat:</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[10px] text-gray-400">
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">1.</span>
                      <span>Cetak semua {totalPagesToPrint} lembar dalam format **Portrait / Tegak**.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">2.</span>
                      <span>Tumpuk/sambungkan kertas secara vertikal (Halaman 1 s/d 3) ke bawah.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">3.</span>
                      <span>Sejajarkan kolom samping Nama dengan kolom Pesanan. Sangat minim pemotongan sisa kertas!</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* 2. Print View: Full-scale output for printer */}
      <div className="print-only-view bg-white text-black p-0 m-0">
        {activeCols.map((col, cIdx) => (
          Array.from({ length: heightPages }).map((_, rIdx) => {
            const pageNum = cIdx * heightPages + rIdx + 1;
            const keyVal = `${col.id}-${rIdx}-print`;
            return renderPuzzlePage(col.id, rIdx, pageNum, totalPagesToPrint, false, keyVal);
          })
        ))}
      </div>

    </div>
  );
}
