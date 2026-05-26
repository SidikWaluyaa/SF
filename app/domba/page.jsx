'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { totalBungkusMuqorrib, formatNumber, convertToCSV, downloadCSV, parseCSV, downloadCSVTemplate } from '@/lib/utils';
import Header from '@/components/layout/Header';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import KPICard from '@/components/ui/KPICard';
import { Rabbit, Plus, Pencil, Trash2, Package, Download, Upload } from 'lucide-react';

const EMPTY_FORM = {
  nomor_urut: '',
  nama_lengkap: '',
  nama_pendek: '',
  alamat: '',
  pesanan: '',
  pesanan_tambahan: '',
  pesanan_1: '',
  pesanan_2: '',
  no_hp: '',
  hewan_qurban_id: '',
};

export default function DombaPage() {
  const [data, setData] = useState([]);
  const [hewanList, setHewanList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filterHewan, setFilterHewan] = useState('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: hewan } = await supabase
      .from('hewan_qurban')
      .select('*')
      .eq('jenis', 'domba')
      .order('nomor_hewan');
    setHewanList(hewan || []);

    const { data: muqorrib } = await supabase
      .from('muqorrib')
      .select('*, hewan_qurban!inner(jenis, nomor_hewan)')
      .eq('hewan_qurban.jenis', 'domba')
      .order('nomor_urut');
    setData(muqorrib || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredData = filterHewan === 'all'
    ? data
    : data.filter((d) => d.hewan_qurban_id === filterHewan);

  const totalBungkus = filteredData.reduce((sum, m) => sum + totalBungkusMuqorrib(m), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Auto combine pesanan_1 and pesanan_2 into pesanan if they are filled
    let combinedPesanan = form.pesanan;
    if (form.pesanan_1 || form.pesanan_2) {
      combinedPesanan = [form.pesanan_1, form.pesanan_2].map(s => s.trim()).filter(Boolean).join(' + ');
    }

    const payload = {
      ...form,
      pesanan: combinedPesanan,
      nomor_urut: parseInt(form.nomor_urut) || 0,
    };

    if (editingId) {
      await supabase.from('muqorrib').update(payload).eq('id', editingId);
    } else {
      await supabase.from('muqorrib').insert(payload);
    }
    setModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    fetchData();
  };

  const handleEdit = (row) => {
    setEditingId(row.id);
    setForm({
      nomor_urut: row.nomor_urut || '',
      nama_lengkap: row.nama_lengkap || '',
      nama_pendek: row.nama_pendek || '',
      alamat: row.alamat || '',
      pesanan: row.pesanan || '',
      pesanan_tambahan: row.pesanan_tambahan || '',
      pesanan_1: row.pesanan_1 || '',
      pesanan_2: row.pesanan_2 || '',
      no_hp: row.no_hp || '',
      hewan_qurban_id: row.hewan_qurban_id || '',
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Yakin hapus data ini?')) return;
    await supabase.from('muqorrib').delete().eq('id', id);
    fetchData();
  };

  const handleAdd = () => {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      hewan_qurban_id: hewanList[0]?.id || '',
    });
    setModalOpen(true);
  };

  const handleAddHewan = async () => {
    const nextNo = hewanList.length > 0 ? Math.max(...hewanList.map((h) => h.nomor_hewan)) + 1 : 1;
    const { error } = await supabase.from('hewan_qurban').insert([{ jenis: 'domba', nomor_hewan: nextNo }]);
    if (error) {
      alert('Gagal menambah domba: ' + error.message);
    } else {
      fetchData();
    }
  };

  const handleDeleteHewan = async () => {
    const selectedHewan = hewanList.find((h) => h.id === filterHewan);
    if (!selectedHewan) return;
    if (!confirm(`Yakin ingin menghapus Domba ${selectedHewan.nomor_hewan} beserta seluruh data muqorrib-nya?`)) return;

    const { error } = await supabase.from('hewan_qurban').delete().eq('id', filterHewan);
    if (error) {
      alert('Gagal menghapus domba: ' + error.message);
    } else {
      setFilterHewan('all');
      fetchData();
    }
  };

  const handleExport = () => {
    if (data.length === 0) {
      alert('Tidak ada data muqorrib untuk di-export.');
      return;
    }
    const csvContent = convertToCSV(data, 'domba');
    downloadCSV(csvContent, 'data_muqorrib_domba.csv');
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const parsedLines = parseCSV(text);

      if (parsedLines.length <= 1) {
        alert('File CSV kosong atau tidak valid.');
        return;
      }

      // Skip header row and filter out empty rows
      const dataRows = parsedLines.slice(1).filter(row => row.length >= 3 && row[2]?.trim() !== '');

      if (dataRows.length === 0) {
        alert('Tidak ada baris data muqorrib yang valid untuk di-import.');
        return;
      }

      setLoading(true);

      // Get latest hewan list mapping
      const { data: latestHewan } = await supabase
        .from('hewan_qurban')
        .select('*')
        .eq('jenis', 'domba');
      
      const hewanMap = {};
      latestHewan?.forEach(h => {
        hewanMap[h.nomor_hewan] = h.id;
      });

      const importedMuqorribs = [];
      let lastDombaNum = 1;

      for (const row of dataRows) {
        // Extract Domba Number, handling Excel's merged cells (empty first column)
        const dombaCol = row[0]?.trim() || '';
        let dombaNum = lastDombaNum;
        if (dombaCol) {
          dombaNum = parseInt(dombaCol.replace(/\D/g, '')) || lastDombaNum;
          lastDombaNum = dombaNum;
        }

        let hewanId = hewanMap[dombaNum];
        if (!hewanId) {
          // Create new Domba in DB
          const { data: newDomba, error: dombaErr } = await supabase
            .from('hewan_qurban')
            .insert([{ jenis: 'domba', nomor_hewan: dombaNum }])
            .select();
          
          if (!dombaErr && newDomba?.[0]) {
            hewanId = newDomba[0].id;
            hewanMap[dombaNum] = hewanId;
          } else {
            console.error('Failed to create Domba ' + dombaNum, dombaErr);
            continue; // Skip this row if animal cannot be mapped or created
          }
        }

        let rawPesanan = row[5]?.trim() || '';
        let p1 = row[7]?.trim() || '';
        let p2 = row[8]?.trim() || '';

        // Case A: CSV has a combined 'Pesanan' column (e.g. "2 KG DAGING + 10 BKS")
        if (rawPesanan.includes('+')) {
          const parts = rawPesanan.split('+').map(s => s.trim()).filter(Boolean);
          p1 = parts[0] || '';
          p2 = parts[1] || '';
        } 
        // Case B: CSV has single 'Pesanan' but also has 'Pesanan 1' or 'Pesanan 2'
        else if (p1 || p2) {
          rawPesanan = [p1, p2].filter(Boolean).join(' + ');
        }
        // Case C: CSV only has a single 'Pesanan' (e.g. "2 KG DAGING"), map it to Pesanan 1 too for consistency
        else if (rawPesanan) {
          p1 = rawPesanan;
        }

        importedMuqorribs.push({
          hewan_qurban_id: hewanId,
          nomor_urut: parseInt(row[1]) || 0,
          nama_lengkap: row[2]?.trim() || null,
          nama_pendek: row[3]?.trim() || null,
          alamat: row[4]?.trim() || null,
          pesanan: rawPesanan || null,
          pesanan_tambahan: row[6]?.trim() || null,
          pesanan_1: p1 || null,
          pesanan_2: p2 || null,
          no_hp: row[9]?.trim() || null,
        });
      }

      if (importedMuqorribs.length > 0) {
        const { error: importErr } = await supabase
          .from('muqorrib')
          .insert(importedMuqorribs);
        
        if (importErr) {
          alert('Gagal meng-import data: ' + importErr.message);
        } else {
          alert(`Sukses meng-import ${importedMuqorribs.length} data muqorrib domba!`);
          fetchData();
        }
      } else {
        alert('Tidak ada data valid yang bisa di-import.');
        setLoading(false);
      }
    };
    reader.readAsText(file);
    // Reset file input value
    e.target.value = '';
  };

  const dombaColors = ['gold', 'emerald', 'blue', 'purple', 'cyan', 'rose'];

  const columns = [
    {
      key: 'hewan_no',
      label: 'Domba',
      width: '80px',
      render: (_, row) => {
        const no = row.hewan_qurban?.nomor_hewan;
        const colorIdx = (no - 1) % dombaColors.length;
        return <span className={`badge badge-${dombaColors[colorIdx]}`}>Domba {no}</span>;
      },
    },
    { key: 'nomor_urut', label: 'No', width: '50px' },
    { key: 'nama_lengkap', label: 'Nama Lengkap', width: '220px' },
    { key: 'nama_pendek', label: 'Nama Pendek', width: '120px' },
    { key: 'alamat', label: 'Alamat', width: '200px' },
    { key: 'pesanan', label: 'Pesanan', width: '160px' },
    { key: 'pesanan_tambahan', label: 'Pesanan Tambahan', width: '160px' },
    { key: 'pesanan_1', label: 'Pesanan 1', width: '120px' },
    { key: 'pesanan_2', label: 'Pesanan 2', width: '120px' },
    { key: 'no_hp', label: 'No. HP', width: '130px' },
    {
      key: 'total_bungkus',
      label: 'Bungkus',
      width: '80px',
      render: (_, row) => {
        const total = totalBungkusMuqorrib(row);
        return <span className="font-mono font-bold text-amber-400">{total}</span>;
      },
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <Header title="Data Domba" subtitle="Manajemen data muqorrib domba qurban">
        <div className="flex gap-2 items-center flex-wrap">
          <button
            onClick={() => downloadCSVTemplate('domba')}
            className="btn-secondary btn-sm flex items-center gap-1.5 h-[38px] px-4 rounded-xl font-semibold text-xs text-cyan-400 hover:text-cyan-300"
          >
            <Download className="w-3.5 h-3.5" />
            Template CSV
          </button>
          <input
            type="file"
            id="import-csv"
            accept=".csv"
            onChange={handleImport}
            className="hidden"
          />
          <label
            htmlFor="import-csv"
            className="btn-secondary btn-sm flex items-center gap-1.5 cursor-pointer h-[38px] px-4 rounded-xl font-semibold text-xs transition-all hover:bg-[rgba(55,65,81,0.6)]"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            Import CSV
          </label>
          <button
            onClick={handleExport}
            className="btn-secondary btn-sm flex items-center gap-1.5 h-[38px] px-4 rounded-xl font-semibold text-xs"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            Export CSV
          </button>
          <div className="w-[1px] h-6 bg-[rgba(55,65,81,0.5)] mx-1" />
          <button onClick={handleAddHewan} className="btn-secondary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Tambah Domba
          </button>
          <button onClick={handleAdd} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Tambah Muqorrib
          </button>
        </div>
      </Header>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
          <KPICard title="Total Domba" value={`${hewanList.length} Ekor`} icon={Rabbit} color="gold" />
          <KPICard title="Total Muqorrib" value={formatNumber(filteredData.length)} icon={Rabbit} color="emerald" />
          <KPICard title="Total Pesanan" value={`${formatNumber(totalBungkus)} Bks`} icon={Package} color="blue" />
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full">
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setFilterHewan('all')} className={`btn-sm ${filterHewan === 'all' ? 'btn-primary' : 'btn-secondary'}`}>
              Semua
            </button>
            {hewanList.map((h) => (
              <button key={h.id} onClick={() => setFilterHewan(h.id)} className={`btn-sm ${filterHewan === h.id ? 'btn-primary' : 'btn-secondary'}`}>
                Domba {h.nomor_hewan}
              </button>
            ))}
          </div>
          {filterHewan !== 'all' && (
            <button
              onClick={handleDeleteHewan}
              className="btn-danger btn-sm flex items-center gap-1 ml-auto"
              title="Hapus Domba ini"
            >
              <Trash2 className="w-3.5 h-3.5" /> Hapus Domba {hewanList.find((h) => h.id === filterHewan)?.nomor_hewan}
            </button>
          )}
        </div>

        <DataTable
          columns={columns}
          data={filteredData}
          searchable
          searchKeys={['nama_lengkap', 'nama_pendek', 'alamat', 'no_hp']}
          actions={(row) => (
            <>
              <button onClick={() => handleEdit(row)} className="btn-secondary btn-sm flex items-center gap-1">
                <Pencil className="w-3 h-3" /> Edit
              </button>
              <button onClick={() => handleDelete(row.id)} className="btn-danger btn-sm flex items-center gap-1">
                <Trash2 className="w-3 h-3" /> Hapus
              </button>
            </>
          )}
        />
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Muqorrib Domba' : 'Tambah Muqorrib Domba'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Domba</label>
              <select value={form.hewan_qurban_id} onChange={(e) => setForm({ ...form, hewan_qurban_id: e.target.value })} className="form-input" required>
                <option value="">Pilih Domba</option>
                {hewanList.map((h) => (
                  <option key={h.id} value={h.id}>Domba {h.nomor_hewan}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">No. Urut</label>
              <input type="number" value={form.nomor_urut} onChange={(e) => setForm({ ...form, nomor_urut: e.target.value })} className="form-input" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Nama Lengkap</label>
              <input type="text" value={form.nama_lengkap} onChange={(e) => setForm({ ...form, nama_lengkap: e.target.value })} className="form-input" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Nama Pendek</label>
              <input type="text" value={form.nama_pendek} onChange={(e) => setForm({ ...form, nama_pendek: e.target.value })} className="form-input" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Alamat</label>
            <input type="text" value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} className="form-input" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Pesanan</label>
              <input type="text" value={form.pesanan} onChange={(e) => setForm({ ...form, pesanan: e.target.value })} className="form-input" placeholder="cth: PAHA DEPAN" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Pesanan Tambahan</label>
              <input type="text" value={form.pesanan_tambahan} onChange={(e) => setForm({ ...form, pesanan_tambahan: e.target.value })} className="form-input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Pesanan 1</label>
              <input type="text" value={form.pesanan_1} onChange={(e) => setForm({ ...form, pesanan_1: e.target.value })} className="form-input" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Pesanan 2</label>
              <input type="text" value={form.pesanan_2} onChange={(e) => setForm({ ...form, pesanan_2: e.target.value })} className="form-input" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">No. HP</label>
            <input type="text" value={form.no_hp} onChange={(e) => setForm({ ...form, no_hp: e.target.value })} className="form-input" />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-[rgba(55,65,81,0.3)]">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Batal</button>
            <button type="submit" className="btn-primary">{editingId ? 'Simpan Perubahan' : 'Tambah Data'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
