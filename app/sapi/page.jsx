'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { totalBungkusMuqorrib, formatNumber, convertToCSV, downloadCSV, parseCSV, downloadCSVTemplate } from '@/lib/utils';
import Header from '@/components/layout/Header';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import KPICard from '@/components/ui/KPICard';
import { Beef, Plus, Pencil, Trash2, Package, Download, Upload } from 'lucide-react';
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

export default function SapiPage() {
  const [data, setData] = useState([]);
  const [hewanList, setHewanList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filterHewan, setFilterHewan] = useState('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    // Fetch sapi hewan
    const { data: hewan } = await supabase
      .from('hewan_qurban')
      .select('*')
      .eq('jenis', 'sapi')
      .order('nomor_hewan');
    setHewanList(hewan || []);

    // Fetch muqorrib sapi
    const { data: muqorrib } = await supabase
      .from('muqorrib')
      .select('*, hewan_qurban!inner(jenis, nomor_hewan)')
      .eq('hewan_qurban.jenis', 'sapi')
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

    const payload = {
      ...form,
      nomor_urut: parseInt(form.nomor_urut) || 0,
    };

    let res;
    if (editingId) {
      res = await supabase.from('muqorrib').update(payload).eq('id', editingId);
    } else {
      res = await supabase.from('muqorrib').insert(payload);
    }

    if (res.error) {
      showError('Gagal Menyimpan!', res.error.message);
    } else {
      showSuccess('Sukses!', editingId ? 'Data muqorrib berhasil diperbarui' : 'Data muqorrib berhasil ditambahkan');
      setModalOpen(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      fetchData();
    }
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
    Swal.fire({
      title: 'Apakah Anda yakin?',
      text: "Data muqorrib ini akan dihapus secara permanen!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#374151',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
      background: '#121829',
      color: '#f3f4f6',
      customClass: {
        popup: 'border border-red-500/20 rounded-2xl font-sans',
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        const { error } = await supabase.from('muqorrib').delete().eq('id', id);
        if (error) {
          showError('Gagal Menghapus!', error.message);
        } else {
          showSuccess('Terhapus!', 'Data muqorrib berhasil dihapus.');
          fetchData();
        }
      }
    });
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
    const { error } = await supabase.from('hewan_qurban').insert([{ jenis: 'sapi', nomor_hewan: nextNo }]);
    if (error) {
      showError('Gagal Menambah Sapi!', error.message);
    } else {
      showSuccess('Sukses!', `Sapi ${nextNo} berhasil ditambahkan.`);
      fetchData();
    }
  };

  const handleDeleteHewan = async () => {
    const selectedHewan = hewanList.find((h) => h.id === filterHewan);
    if (!selectedHewan) return;
    
    Swal.fire({
      title: 'Hapus Sapi ini?',
      text: `Apakah Anda yakin ingin menghapus Sapi ${selectedHewan.nomor_hewan} beserta seluruh data muqorrib-nya?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#374151',
      confirmButtonText: 'Ya, Hapus Sapi!',
      cancelButtonText: 'Batal',
      background: '#121829',
      color: '#f3f4f6',
      customClass: {
        popup: 'border border-red-500/20 rounded-2xl font-sans',
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        const { error } = await supabase.from('hewan_qurban').delete().eq('id', filterHewan);
        if (error) {
          showError('Gagal Menghapus Sapi!', error.message);
        } else {
          showSuccess('Terhapus!', `Sapi ${selectedHewan.nomor_hewan} berhasil dihapus.`);
          setFilterHewan('all');
          fetchData();
        }
      }
    });
  };

  const handleExport = () => {
    if (data.length === 0) {
      showError('Gagal Export!', 'Tidak ada data muqorrib untuk di-export.');
      return;
    }
    const csvContent = convertToCSV(data, 'sapi');
    downloadCSV(csvContent, 'data_muqorrib_sapi.csv');
    showSuccess('Sukses Export!', 'Data muqorrib berhasil di-export ke CSV.');
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const parsedLines = parseCSV(text);

      if (parsedLines.length <= 1) {
        showError('Gagal Import!', 'File CSV kosong atau tidak valid.');
        return;
      }

      // Skip header row and filter out empty rows
      const dataRows = parsedLines.slice(1).filter(row => row.length >= 3 && row[2]?.trim() !== '');

      if (dataRows.length === 0) {
        showError('Gagal Import!', 'Tidak ada baris data muqorrib yang valid untuk di-import.');
        return;
      }

      setLoading(true);

      // Get latest hewan list mapping
      const { data: latestHewan } = await supabase
        .from('hewan_qurban')
        .select('*')
        .eq('jenis', 'sapi');
      
      const hewanMap = {};
      latestHewan?.forEach(h => {
        hewanMap[h.nomor_hewan] = h.id;
      });

      const importedMuqorribs = [];
      let lastSapiNum = 1;

      for (const row of dataRows) {
        // Extract Sapi Number, handling Excel's merged cells (empty first column)
        const sapiCol = row[0]?.trim() || '';
        let sapiNum = lastSapiNum;
        if (sapiCol) {
          sapiNum = parseInt(sapiCol.replace(/\D/g, '')) || lastSapiNum;
          lastSapiNum = sapiNum;
        }

        let hewanId = hewanMap[sapiNum];
        if (!hewanId) {
          // Create new Sapi in DB
          const { data: newSapi, error: sapiErr } = await supabase
            .from('hewan_qurban')
            .insert([{ jenis: 'sapi', nomor_hewan: sapiNum }])
            .select();
          
          if (!sapiErr && newSapi?.[0]) {
            hewanId = newSapi[0].id;
            hewanMap[sapiNum] = hewanId;
          } else {
            console.error('Failed to create Sapi ' + sapiNum, sapiErr);
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
          showError('Gagal Import!', 'Gagal meng-import data: ' + importErr.message);
        } else {
          showSuccess('Sukses Import!', `Sukses meng-import ${importedMuqorribs.length} data muqorrib sapi!`);
          fetchData();
        }
      } else {
        showError('Gagal Import!', 'Tidak ada data valid yang bisa di-import.');
        setLoading(false);
      }
    };
    reader.readAsText(file);
    // Reset file input value
    e.target.value = '';
  };

  const sapiColors = ['emerald', 'blue', 'purple'];

  const columns = [
    {
      key: 'hewan_no',
      label: 'Sapi',
      width: '70px',
      render: (_, row) => {
        const no = row.hewan_qurban?.nomor_hewan;
        const colorIdx = (no - 1) % sapiColors.length;
        const badgeClass = `badge badge-${sapiColors[colorIdx]}`;
        return <span className={badgeClass}>Sapi {no}</span>;
      },
    },
    { key: 'nomor_urut', label: 'No', width: '50px' },
    { key: 'nama_lengkap', label: 'Nama Lengkap', width: '200px' },
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
        return (
          <span className="font-mono font-bold text-emerald-400">{total}</span>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <Header title="Data Sapi" subtitle="Manajemen data muqorrib sapi qurban">
        <div className="flex gap-2 items-center flex-wrap">
          <button
            onClick={() => downloadCSVTemplate('sapi')}
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
            <Plus className="w-4 h-4" />
            Tambah Sapi
          </button>
          <button onClick={handleAdd} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Tambah Muqorrib
          </button>
        </div>
      </Header>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
          <KPICard title="Total Sapi" value={`${hewanList.length} Ekor`} icon={Beef} color="emerald" />
          <KPICard title="Total Muqorrib" value={formatNumber(filteredData.length)} icon={Beef} color="blue" />
          <KPICard title="Total Pesanan" value={`${formatNumber(totalBungkus)} Bks`} icon={Package} color="gold" />
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 flex-wrap w-full">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setFilterHewan('all')}
              className={`btn-sm ${filterHewan === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Semua
            </button>
            {hewanList.map((h) => (
              <button
                key={h.id}
                onClick={() => setFilterHewan(h.id)}
                className={`btn-sm ${filterHewan === h.id ? 'btn-primary' : 'btn-secondary'}`}
              >
                Sapi {h.nomor_hewan}
              </button>
            ))}
          </div>
          {filterHewan !== 'all' && (
            <button
              onClick={handleDeleteHewan}
              className="btn-danger btn-sm flex items-center gap-1 ml-auto"
              title="Hapus Sapi ini"
            >
              <Trash2 className="w-3.5 h-3.5" /> Hapus Sapi {hewanList.find((h) => h.id === filterHewan)?.nomor_hewan}
            </button>
          )}
        </div>

        {/* Table */}
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

      {/* Modal Form */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Muqorrib Sapi' : 'Tambah Muqorrib Sapi'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Sapi</label>
              <select
                value={form.hewan_qurban_id}
                onChange={(e) => setForm({ ...form, hewan_qurban_id: e.target.value })}
                className="form-input"
                required
              >
                <option value="">Pilih Sapi</option>
                {hewanList.map((h) => (
                  <option key={h.id} value={h.id}>Sapi {h.nomor_hewan}</option>
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
              <input type="text" value={form.pesanan} onChange={(e) => setForm({ ...form, pesanan: e.target.value })} className="form-input" placeholder="cth: 2 KG DAGING" />
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
