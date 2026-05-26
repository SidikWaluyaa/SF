/**
 * Menghitung jumlah bungkus dari teks pesanan.
 * 
 * Aturan:
 * - "X KG DAGING", "PAHA DEPAN", dsb → 1 bungkus
 * - "30 BKS", "5 BKS (1 KG / BKS)" → angka di depan BKS
 * - Gabungan "2 KG DAGING + 10 BKS" → 1 + 10 = 11
 */
export function hitungBungkus(pesananText) {
  if (!pesananText || pesananText.trim() === '') return 0;
  let total = 0;
  const parts = pesananText.split('+').map(s => s.trim()).filter(Boolean);
  for (const part of parts) {
    // 1. Cocokkan pola angka desimal/integer diikuti BKS atau BUNGKUS (misal: "2,5 BKS", "10 BUNGKUS")
    const bksMatch = part.match(/([\d.,]+)\s*(?:BKS|BUNGKUS)/i);
    if (bksMatch) {
      const valStr = bksMatch[1].replace(',', '.');
      total += parseFloat(valStr) || 0;
      continue;
    }
    
    // 2. Cocokkan jika hanya berisi angka murni desimal/integer (misal: "2,5", "3")
    const pureNumMatch = part.match(/^([\d.,]+)$/);
    if (pureNumMatch) {
      const valStr = pureNumMatch[1].replace(',', '.');
      total += parseFloat(valStr) || 0;
      continue;
    }
    
    // 3. Lainnya (misal: "2 KG DAGING", "PAHA DEPAN") dihitung 1 bungkus
    if (part.length > 0) {
      total += 1;
    }
  }
  return total;
}

/**
 * Total bungkus dari semua kolom pesanan seorang muqorrib.
 */
export function totalBungkusMuqorrib(row) {
  // Jika pesanan_1 atau pesanan_2 terisi, hitung gabungannya. 
  // Jika kosong, gunakan fallback ke kolom pesanan utama.
  const mainPesanan = (row.pesanan_1 || row.pesanan_2)
    ? (hitungBungkus(row.pesanan_1) + hitungBungkus(row.pesanan_2))
    : hitungBungkus(row.pesanan);

  return mainPesanan + hitungBungkus(row.pesanan_tambahan);
}

/**
 * Format angka ke locale Indonesia
 */
export function formatNumber(num) {
  if (num === null || num === undefined) return '0';
  return new Intl.NumberFormat('id-ID').format(num);
}

/**
 * Format desimal
 */
export function formatDecimal(num, digits = 2) {
  if (num === null || num === undefined) return '0';
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(num);
}

/**
 * Classnames helper (simple)
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

/**
 * Mengonversi data muqorrib ke string CSV dengan wrapping tanda kutip
 */
export function convertToCSV(data, type) {
  const headers = [
    type === 'sapi' ? 'Sapi' : 'Domba',
    'No Urut',
    'Nama Lengkap',
    'Nama Pendek',
    'Alamat',
    'Pesanan',
    'Pesanan Tambahan',
    'Pesanan 1',
    'Pesanan 2',
    'No HP'
  ];

  const rows = data.map(row => {
    const animalNo = row.hewan_qurban?.nomor_hewan || '';
    return [
      animalNo,
      row.nomor_urut || '',
      row.nama_lengkap || '',
      row.nama_pendek || '',
      row.alamat || '',
      row.pesanan || '',
      row.pesanan_tambahan || '',
      row.pesanan_1 || '',
      row.pesanan_2 || '',
      row.no_hp || ''
    ];
  });

  const csvContent = [
    headers.join(';'),
    ...rows.map(row => row.map(val => {
      const text = String(val).replace(/"/g, '""');
      return text.includes(',') || text.includes(';') || text.includes('\n') || text.includes('"') ? `"${text}"` : text;
    }).join(';'))
  ].join('\n');

  return csvContent;
}

/**
 * Mengunduh file CSV dengan UTF-8 BOM untuk kompatibilitas Excel
 */
export function downloadCSV(csvContent, filename) {
  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Parser CSV tangguh yang mendukung pemisah koma/titik-koma dan baris baru terenkapsulasi kutip
 */
export function parseCSV(csvText) {
  const firstLine = csvText.split(/\r?\n/)[0] || '';
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  
  // Jika ada titik koma di header, asumsikan itu adalah pemisah (standard regional Indonesia)
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
        i++; // skip next quote
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
}

/**
 * Membuat dan mengunduh file template CSV dengan header yang benar dan baris sampel data muqorrib
 */
export function downloadCSVTemplate(type) {
  const headers = [
    type === 'sapi' ? 'Sapi' : 'Domba',
    'No Urut',
    'Nama Lengkap',
    'Nama Pendek',
    'Alamat',
    'Pesanan',
    'Pesanan Tambahan',
    'Pesanan 1',
    'Pesanan 2',
    'No HP'
  ];

  const sampleRow = [
    '1',
    '1',
    type === 'sapi' ? 'HJ. ISBAT BINTI H. ACE ANWAR' : 'BAYU ADIPUTRA',
    type === 'sapi' ? 'HJ. ISBAT' : 'BAYU',
    'Jl. Kembar VII No. 9',
    type === 'sapi' ? '2 KG DAGING' : 'PAHA DEPAN',
    '1 BKS ATI',
    '',
    '',
    '08123456789'
  ];

  const csvContent = [
    headers.join(';'),
    sampleRow.map(val => {
      const text = String(val).replace(/"/g, '""');
      return text.includes(',') || text.includes(';') || text.includes('\n') || text.includes('"') ? `"${text}"` : text;
    }).join(';')
  ].join('\n');

  downloadCSV(csvContent, `template_muqorrib_${type}.csv`);
}


