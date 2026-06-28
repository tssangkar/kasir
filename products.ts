import { Product } from '../types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: "P001",
    nama: "Sangkar Murai Batu No. 1 Premium Jati",
    ukuran: "Diameter 60 cm",
    harga: 1250000,
    kategori: "Murai",
    foto: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80",
    stok: 12,
    hargaPokok: 850000
  },
  {
    id: "P002",
    nama: "Sangkar Murai Batu No. 2 Ukiran Klasik",
    ukuran: "Diameter 57 cm",
    harga: 1100000,
    kategori: "Murai",
    foto: "https://images.unsplash.com/photo-1540553016722-983e48a2cd10?auto=format&fit=crop&w=600&q=80",
    stok: 15,
    hargaPokok: 750000
  },
  {
    id: "P003",
    nama: "Sangkar Lovebird Akrilik Decal",
    ukuran: "Standar Lb",
    harga: 350000,
    kategori: "Lovebird",
    foto: "https://images.unsplash.com/photo-1588421357574-87938a86fa28?auto=format&fit=crop&w=600&q=80",
    stok: 25,
    hargaPokok: 220000
  },
  {
    id: "P004",
    nama: "Sangkar Kenari Box Tiang Fiber",
    ukuran: "30 x 30 x 60 cm",
    harga: 275000,
    kategori: "Kenari",
    foto: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80",
    stok: 30,
    hargaPokok: 180000
  },
  {
    id: "P005",
    nama: "Sangkar Kacer Fiber Oval",
    ukuran: "No. 2 Oval",
    harga: 450000,
    kategori: "Kacer",
    foto: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80",
    stok: 8,
    hargaPokok: 310000
  },
  {
    id: "P006",
    nama: "Sangkar Pleci Kubah Jati Mini",
    ukuran: "22 x 22 x 45 cm",
    harga: 185000,
    kategori: "Pleci",
    foto: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=600&q=80",
    stok: 40,
    hargaPokok: 110000
  }
];

export const SHEET_API_URL =
  "https://script.google.com/macros/s/AKfycbxE4eMX3_TJlSkXitw2txzNv1R_AUMUarPFbatelhUgLw6V6IStSrys9C8lEZUhn-ZSgQ/exec";

export const SHEET_API_URL_PESANAN =
  "https://script.google.com/macros/s/AKfycbxE4eMX3_TJlSkXitw2txzNv1R_AUMUarPFbatelhUgLw6V6IStSrys9C8lEZUhn-ZSgQ/exec";
