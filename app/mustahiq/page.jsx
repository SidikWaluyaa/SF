'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatNumber } from '@/lib/utils';
import Header from '@/components/layout/Header';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import KPICard from '@/components/ui/KPICard';
import { Users, Plus, Pencil, Trash2, Upload, Download, Printer } from 'lucide-react';

const EMPTY_FORM = {
  nomor_urut: '',
  nama_kelompok: '',
  jiwa_kk: '',
};

export default function MustahiqPage() {
  const router = useRouter();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: mustahiq } = await supabase
      .from('mustahiq')
      .select('*')
      .order('nomor_urut');
    setData(mustahiq || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalJiwa = data.reduce((sum, m) => sum + (m.jiwa_kk || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      nomor_urut: parseInt(form.nomor_urut) || 0,
      nama_kelompok: form.nama_kelompok,
      jiwa_kk: parseInt(form.jiwa_kk) || 0,
    };

    if (editingId) {
      await supabase.from('mustahiq').update(payload).eq('id', editingId);
    } else {
      await supabase.from('mustahiq').insert(payload);
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
      nama_kelompok: row.nama_kelompok || '',
      jiwa_kk: row.jiwa_kk || '',
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Yakin hapus data ini?')) return;
    await supabase.from('mustahiq').delete().eq('id', id);
    fetchData();
  };

  const handleAdd = () => {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      nomor_urut: data.length + 1,
    });
    setModalOpen(true);
  };

  const handleExport = () => {
    if (data.length === 0) {
      alert('Tidak ada data mustahiq untuk di-export.');
      return;
    }
    const headers = ['No Urut', 'Nama Kelompok', 'Jiwa KK'];
    const rows = data.map(row => [
      row.nomor_urut || '',
      row.nama_kelompok || '',
      row.jiwa_kk || '0'
    ]);
    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.map(val => {
        const text = String(val).replace(/"/g, '""');
        return text.includes(',') || text.includes(';') || text.includes('\n') || text.includes('"') ? `"${text}"` : text;
      }).join(';'))
    ].join('\n');

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'data_mustahiq.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadTemplate = () => {
    const headers = ['No Urut', 'Nama Kelompok', 'Jiwa KK'];
    const sampleRow = ['1', 'WARGA RT. 02', '67'];
    const csvContent = [
      headers.join(';'),
      sampleRow.join(';')
    ].join('\n');

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_mustahiq.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      
      const parseCSVLocal = (csvText) => {
        const firstLine = csvText.split(/\r?\n/)[0] || '';
        const semicolonCount = (firstLine.match(/;/g) || []).length;
        const delimiter = semicolonCount > 0 ? ';' : ',';

        const lines = [];
        let row = [""];
        let inQuotes = false;

        for (let i = 0; i < csvText.length; i++) {
          const c = csvText[i];
          const next = csvText[i + 1];

          if (c === '"') {
            if (inQuotes && next === '"') {
              row[row.length - 1] += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (c === delimiter && !inQuotes) {
            row.push("");
          } else if ((c === '\r' || c === '\n') && !inQuotes) {
            if (c === '\r' && next === '\n') {
              i++;
            }
            lines.push(row);
            row = [""];
          } else {
            row[row.length - 1] += c;
          }
        }
        if (row.length > 1 || row[0] !== "") {
          lines.push(row);
        }
        return lines;
      };

      const parsedLines = parseCSVLocal(text);

      if (parsedLines.length <= 1) {
        alert('File CSV kosong atau tidak valid.');
        return;
      }

      const dataRows = parsedLines.slice(1).filter(row => row.length >= 2 && row[1]?.trim() !== '');

      if (dataRows.length === 0) {
        alert('Tidak ada baris data mustahiq yang valid untuk di-import.');
        return;
      }

      if (!confirm(`Apakah Anda yakin ingin meng-import ${dataRows.length} kelompok mustahiq? Data ini akan ditambahkan ke database.`)) {
        return;
      }

      setLoading(true);
      try {
        const insertPayloads = dataRows.map((row) => ({
          nomor_urut: parseInt(row[0]) || 0,
          nama_kelompok: row[1]?.trim(),
          jiwa_kk: parseInt(row[2]) || 0
        }));

        const { error } = await supabase.from('mustahiq').insert(insertPayloads);
        if (error) throw error;

        alert(`Sukses meng-import ${insertPayloads.length} data mustahiq!`);
        fetchData();
      } catch (err) {
        console.error('Error importing mustahiq:', err);
        alert('Gagal meng-import data: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const handlePrintPDF = () => {
    router.push('/cetak?type=mustahiq');
  };

  const columns = [
    { key: 'nomor_urut', label: 'No', width: '60px' },
    { key: 'nama_kelompok', label: 'Daftar Mustahiq', width: '300px' },
    {
      key: 'jiwa_kk',
      label: 'Jiwa / KK',
      width: '120px',
      render: (val) => (
        <span className="font-mono font-bold text-cyan-400">{formatNumber(val)}</span>
      ),
    },
    {
      key: 'persentase',
      label: 'Persentase',
      width: '150px',
      render: (_, row) => {
        const pct = totalJiwa > 0 ? ((row.jiwa_kk || 0) / totalJiwa) * 100 : 0;
        return (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-[rgba(55,65,81,0.3)] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[11px] font-mono text-gray-400 w-12 text-right">
              {pct.toFixed(1)}%
            </span>
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <Header title="Mustahiq" subtitle="Daftar penerima daging qurban">
        <div className="flex flex-wrap items-center gap-3">
          {/* Cetak PDF */}
          <button 
            onClick={handlePrintPDF} 
            className="btn-secondary flex items-center gap-2 text-xs font-semibold h-[38px] border-[rgba(55,65,81,0.5)]"
          >
            <Printer className="w-4 h-4 text-cyan-400" /> Cetak PDF
          </button>

          {/* Download Template */}
          <button 
            onClick={handleDownloadTemplate} 
            className="btn-secondary flex items-center gap-2 text-xs font-semibold h-[38px] border-[rgba(55,65,81,0.5)]"
          >
            <Download className="w-4 h-4 text-emerald-400" /> Template CSV
          </button>

          {/* Import CSV */}
          <label className="btn-secondary flex items-center gap-2 text-xs font-semibold h-[38px] border-[rgba(55,65,81,0.5)] cursor-pointer">
            <Upload className="w-4 h-4 text-amber-400" /> Import CSV
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleImport} 
              className="hidden" 
            />
          </label>

          {/* Export CSV */}
          <button 
            onClick={handleExport} 
            className="btn-secondary flex items-center gap-2 text-xs font-semibold h-[38px] border-[rgba(55,65,81,0.5)]"
          >
            <Download className="w-4 h-4 text-purple-400" /> Export CSV
          </button>

          {/* Tambah Kelompok */}
          <button onClick={handleAdd} className="btn-primary flex items-center gap-2 h-[38px]">
            <Plus className="w-4 h-4" /> Tambah Kelompok
          </button>
        </div>
      </Header>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 stagger-children print:hidden no-print">
          <KPICard title="Total Kelompok" value={formatNumber(data.length)} icon={Users} color="cyan" />
          <KPICard title="Total Jiwa/KK" value={formatNumber(totalJiwa)} icon={Users} color="emerald" />
        </div>

        <DataTable
          columns={columns}
          data={data}
          searchable
          searchKeys={['nama_kelompok']}
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Mustahiq' : 'Tambah Mustahiq'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">No. Urut</label>
            <input type="number" value={form.nomor_urut} onChange={(e) => setForm({ ...form, nomor_urut: e.target.value })} className="form-input" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Nama Kelompok / Mustahiq</label>
            <input type="text" value={form.nama_kelompok} onChange={(e) => setForm({ ...form, nama_kelompok: e.target.value })} className="form-input" required placeholder="cth: Warga RT. 02" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Jumlah Jiwa / KK</label>
            <input type="number" value={form.jiwa_kk} onChange={(e) => setForm({ ...form, jiwa_kk: e.target.value })} className="form-input" required />
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
