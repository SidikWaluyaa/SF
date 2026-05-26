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
    const bksMatch = part.match(/(\d+)\s*BKS/i);
    if (bksMatch) {
      total += parseInt(bksMatch[1], 10);
    } else if (part.length > 0) {
      total += 1;
    }
  }
  return total;
}

/**
 * Total bungkus dari semua kolom pesanan seorang muqorrib.
 */
export function totalBungkusMuqorrib(row) {
  return (
    hitungBungkus(row.pesanan) +
    hitungBungkus(row.pesanan_tambahan) +
    hitungBungkus(row.pesanan_1) +
    hitungBungkus(row.pesanan_2)
  );
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
