export interface Product {
  id?: string | number;
  nama: string;
  ukuran: string;
  harga: number;
  kategori: string;
  foto: string;
  stok?: number;
  hargaPokok?: number;
}

export interface CartItem extends Product {
  qty: number;
  note: string;
}

export interface TransactionData {
  noTransaksi: string;
  tanggal: string;
  jam: string;
  nama: string;
  alamat: string;
  kontak: string;
  estimasi: string;
  items: {
    nama: string;
    ukuran: string;
    qty: number;
    harga: number;
    catatan: string;
  }[];
  subtotal: number;
  diskonPct: number;
  diskonAmount: number;
  ongkir: number;
  tambahan: number;
  total: number;
  uangDiterima: number;
  change: number;
  metode: string;
}
