'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatNumber } from '@/lib/utils';
import Header from '@/components/layout/Header';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import KPICard from '@/components/ui/KPICard';
import { UserCog, Plus, Pencil, Trash2, Upload, Download, Printer } from 'lucide-react';

const EMPTY_FORM = {
  nomor_urut: '',
  nama_lengkap: '',
  jabatan: '',
  no_hp: '',
  bagian: '',
};

const BAGIAN_OPTIONS = [
  { value: '', label: 'Daging Biasa / Tidak Ada' },
  { value: 'kepala_sapi', label: 'Kepala Sapi' },
  { value: 'cokor_sapi', label: 'Cokor Sapi' },
  { value: 'buntut_sapi', label: 'Buntut Sapi' },
  { value: 'siki_sapi', label: 'Siki Sapi' },
  { value: 'ati_sapi', label: 'Ati Sapi' },
  { value: 'kulit_sapi', label: 'Kulit Sapi' },
  { value: 'kepala_domba', label: 'Kepala Domba' },
  { value: 'cokor_domba', label: 'Cokor Domba' },
  { value: 'siki_domba', label: 'Siki Domba' },
  { value: 'ati_domba', label: 'Ati Domba' },
  { value: 'kulit_domba', label: 'Kulit Domba' },
];

const BAGIAN_LABELS = {
  kepala_sapi: 'Kepala Sapi',
  cokor_sapi: 'Cokor Sapi',
  buntut_sapi: 'Buntut Sapi',
  siki_sapi: 'Siki Sapi',
  ati_sapi: 'Ati Sapi',
  kulit_sapi: 'Kulit Sapi',
  kepala_domba: 'Kepala Domba',
  cokor_domba: 'Cokor Domba',
  siki_domba: 'Siki Domba',
  ati_domba: 'Ati Domba',
  kulit_domba: 'Kulit Domba',
};

// Valid bagian keys for import validation
const VALID_BAGIAN_KEYS = Object.keys(BAGIAN_LABELS);

export default function PanitiaPage() {
  const router = useRouter();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: panitia } = await supabase
      .from('panitia')
      .select('*')
      .order('nomor_urut');
    setData(panitia || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      nomor_urut: parseInt(form.nomor_urut) || 0,
      nama_lengkap: form.nama_lengkap,
      jabatan: form.jabatan,
      no_hp: form.no_hp,
      bagian: form.bagian || null,
    };

    try {
      if (editingId) {
        const { error } = await supabase.from('panitia').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('panitia').insert(payload);
        if (error) throw error;
      }
      setModalOpen(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      fetchData();
    } catch (err) {
      console.error('Error saving panitia:', err);
      alert('Gagal menyimpan data panitia: ' + err.message + '\n\nTips: Pastikan kolom "bagian" sudah ditambahkan ke tabel "panitia" di Supabase SQL Editor.');
    }
  };

  const handleEdit = (row) => {
    setEditingId(row.id);
    setForm({
      nomor_urut: row.nomor_urut || '',
      nama_lengkap: row.nama_lengkap || '',
      jabatan: row.jabatan || '',
      no_hp: row.no_hp || '',
      bagian: row.bagian || '',
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Yakin hapus data ini?')) return;
    try {
      const { error } = await supabase.from('panitia').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err) {
      console.error('Error deleting panitia:', err);
      alert('Gagal menghapus data panitia: ' + err.message);
    }
  };

  const handleAdd = () => {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      nomor_urut: data.length + 1,
    });
    setModalOpen(true);
  };

  // ============== CSV EXPORT ==============
  const handleExport = () => {
    if (data.length === 0) {
      alert('Tidak ada data panitia untuk di-export.');
      return;
    }
    const headers = ['No Urut', 'Nama Lengkap', 'Jabatan', 'No HP', 'Bagian'];
    const rows = data.map(row => [
      row.nomor_urut || '',
      row.nama_lengkap || '',
      row.jabatan || '',
      row.no_hp || '',
      row.bagian || ''
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
    link.setAttribute('download', 'data_panitia.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ============== CSV TEMPLATE DOWNLOAD ==============
  const handleDownloadTemplate = () => {
    const headers = ['No Urut', 'Nama Lengkap', 'Jabatan', 'No HP', 'Bagian'];
    const sampleRows = [
      ['1', 'Ahmad Fauzi', 'Ketua', '081234567890', 'kepala_sapi'],
      ['2', 'Budi Santoso', 'Sekretaris', '082345678901', ''],
      ['3', 'Cecep Hidayat', 'Anggota', '083456789012', 'cokor_domba'],
    ];
    const bagianNote = '# Nilai kolom Bagian (opsional): ' + VALID_BAGIAN_KEYS.join(', ');
    const csvContent = [
      bagianNote,
      headers.join(';'),
      ...sampleRows.map(row => row.join(';'))
    ].join('\n');

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_panitia.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ============== CSV IMPORT ==============
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

      // Filter out comment lines (starting with #)
      const dataLines = parsedLines.filter(row => !row[0]?.trim().startsWith('#'));

      if (dataLines.length <= 1) {
        alert('File CSV kosong atau tidak valid.');
        return;
      }

      // Skip header row (first non-comment line)
      const dataRows = dataLines.slice(1).filter(row => row.length >= 2 && row[1]?.trim() !== '');

      if (dataRows.length === 0) {
        alert('Tidak ada baris data panitia yang valid untuk di-import.');
        return;
      }

      if (!confirm(`Apakah Anda yakin ingin meng-import ${dataRows.length} panitia? Data ini akan ditambahkan ke database.`)) {
        return;
      }

      setLoading(true);
      try {
        const insertPayloads = dataRows.map((row) => {
          const bagianVal = row[4]?.trim()?.toLowerCase() || '';
          return {
            nomor_urut: parseInt(row[0]) || 0,
            nama_lengkap: row[1]?.trim(),
            jabatan: row[2]?.trim() || null,
            no_hp: row[3]?.trim() || null,
            bagian: VALID_BAGIAN_KEYS.includes(bagianVal) ? bagianVal : null,
          };
        });

        const { error } = await supabase.from('panitia').insert(insertPayloads);
        if (error) throw error;

        alert(`Sukses meng-import ${insertPayloads.length} data panitia!`);
        fetchData();
      } catch (err) {
        console.error('Error importing panitia:', err);
        alert('Gagal meng-import data: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);

    // Reset the file input so user can re-import the same file if needed
    e.target.value = '';
  };

  // ============== PRINT PDF ==============
  const handlePrintPDF = () => {
    router.push('/cetak?type=panitia');
  };

  const columns = [
    { key: 'nomor_urut', label: 'No', width: '60px' },
    { key: 'nama_lengkap', label: 'Nama Lengkap', width: '220px' },
    {
      key: 'jabatan',
      label: 'Jabatan',
      width: '150px',
      render: (val) => val ? <span className="badge badge-emerald">{val}</span> : '-',
    },
    {
      key: 'bagian',
      label: 'Alokasi Bagian',
      width: '180px',
      render: (val) => {
        if (!val) return <span className="text-gray-500 text-xs font-medium">-</span>;
        const label = BAGIAN_LABELS[val] || val;
        const isSapi = val.endsWith('_sapi');
        return (
          <span className={`badge badge-${isSapi ? 'emerald' : 'gold'}`}>
            {label}
          </span>
        );
      }
    },
    { key: 'no_hp', label: 'No. HP', width: '130px' },
  ];

  return (
    <div className="flex flex-col h-full">
      <Header title="Panitia" subtitle="Data panitia pelaksana qurban">
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

          {/* Tambah Panitia */}
          <button onClick={handleAdd} className="btn-primary flex items-center gap-2 h-[38px]">
            <Plus className="w-4 h-4" /> Tambah Panitia
          </button>
        </div>
      </Header>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          <KPICard title="Total Panitia" value={formatNumber(data.length)} icon={UserCog} color="purple" />
        </div>

        <DataTable
          columns={columns}
          data={data}
          searchable
          searchKeys={['nama_lengkap', 'jabatan', 'no_hp']}
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Panitia' : 'Tambah Panitia'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">No. Urut</label>
            <input type="number" value={form.nomor_urut} onChange={(e) => setForm({ ...form, nomor_urut: e.target.value })} className="form-input" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Nama Lengkap</label>
            <input type="text" value={form.nama_lengkap} onChange={(e) => setForm({ ...form, nama_lengkap: e.target.value })} className="form-input" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Jabatan</label>
            <input type="text" value={form.jabatan} onChange={(e) => setForm({ ...form, jabatan: e.target.value })} className="form-input" placeholder="cth: Ketua, Sekretaris" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Alokasi Bagian Qurban</label>
            <select
              value={form.bagian}
              onChange={(e) => setForm({ ...form, bagian: e.target.value })}
              className="form-input text-xs"
            >
              {BAGIAN_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
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
