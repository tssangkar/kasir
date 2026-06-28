import { useState, useEffect, useRef } from 'react';
import {
  Clock,
  Calendar,
  ShoppingCart,
  ShoppingBag,
  Trash2,
  Search,
  Plus,
  Minus,
  User,
  MapPin,
  Phone,
  CalendarDays,
  Tag,
  Coins,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Download,
  Share2,
  RotateCcw,
  X,
  PlusCircle,
  TrendingUp,
  Settings,
  BarChart3,
  Menu,
  Camera,
  Briefcase,
  Award,
  Package,
  Banknote,
  Truck,
  Percent,
  Eye,
  Printer,
  Edit3,
  Check,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { Html5Qrcode } from 'html5-qrcode';
import { INITIAL_PRODUCTS, SHEET_API_URL, SHEET_API_URL_PESANAN } from './data/products';
import { Product, CartItem, TransactionData } from './types';
import Receipt from './components/Receipt';

// Helper function to convert Google Drive URL to high-performance Thumbnail URL
const getGoogleDriveThumbnailUrl = (url: string): string => {
  if (!url) return '';
  
  // If it's already a thumbnail URL, keep it
  if (url.includes('drive.google.com/thumbnail')) {
    return url;
  }

  let fileId = '';
  
  if (url.includes('drive.google.com')) {
    // Matches /file/d/ID/view or similar paths
    const fileDMatch = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
    if (fileDMatch && fileDMatch[1]) {
      fileId = fileDMatch[1];
    } else {
      // Matches ?id=ID or &id=ID
      const idMatch = url.match(/[?&]id=([a-zA-Z0-9-_]+)/);
      if (idMatch && idMatch[1]) {
        fileId = idMatch[1];
      }
    }
  }
  
  if (fileId) {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w300`;
  }
  
  return url;
};

export default function App() {
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('ts_sangkar_local_products');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load local products:', e);
    }
    return INITIAL_PRODUCTS.map(p => ({
      ...p,
      foto: getGoogleDriveThumbnailUrl(p.foto)
    }));
  });
  const productsRef = useRef<Product[]>(products);
  useEffect(() => {
    productsRef.current = products;
    try {
      localStorage.setItem('ts_sangkar_local_products', JSON.stringify(products));
    } catch (e) {
      console.error('Failed to save products to localStorage:', e);
    }
  }, [products]);
  const [loading, setLoading] = useState<boolean>(false);

  const [gasUrlState, setGasUrlState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('ts_sangkar_gas_url');
      return saved || SHEET_API_URL || '';
    } catch (e) {
      return SHEET_API_URL || '';
    }
  });

  const [sheetIdState, setSheetIdState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('ts_sangkar_sheet_id');
      return saved || '19981hn179EkrhmnlGCBPl5ZVhx84O1KMaglrq9RKVCI';
    } catch (e) {
      return '19981hn179EkrhmnlGCBPl5ZVhx84O1KMaglrq9RKVCI';
    }
  });
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Customer Form states
  const [nama, setNama] = useState<string>('');
  const [alamat, setAlamat] = useState<string>('');
  const [kontak, setKontak] = useState<string>('');
  const [estimasi, setEstimasi] = useState<string>('');
  const [ongkir, setOngkir] = useState<number>(0);
  const [tambahan, setTambahan] = useState<number>(0);
  const [diskon, setDiskon] = useState<number>(0);
  const [metode, setMetode] = useState<string>('Tunai');
  const [uangDiterima, setUangDiterima] = useState<number>(0);
  const [dpDiterima, setDpDiterima] = useState<number>(0);

  // Theme states
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('ts_sangkar_theme');
      return saved === 'dark';
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('ts_sangkar_theme', isDarkMode ? 'dark' : 'light');
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {
      console.error(e);
    }
  }, [isDarkMode]);

  // PWA states & listeners
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showManualInstall, setShowManualInstall] = useState<boolean>(false);
  const [showInstallBanner, setShowInstallBanner] = useState<boolean>(() => {
    try {
      // Don't show if user previously dismissed it
      const dismissed = localStorage.getItem('ts_sangkar_pwa_dismissed');
      return dismissed !== 'true';
    } catch (e) {
      return true;
    }
  });

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent default browser prompt
      e.preventDefault();
      // Save event so we can trigger it later
      setDeferredPrompt(e);
      // Only show banner if not previously dismissed
      const dismissed = localStorage.getItem('ts_sangkar_pwa_dismissed');
      if (dismissed !== 'true') {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Also support checking if app is already running in standalone (installed) mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallBanner(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) {
      // Fallback show beautiful install helper modal
      setShowManualInstall(true);
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the PWA install prompt');
      setShowInstallBanner(false);
    } else {
      console.log('User dismissed the PWA install prompt');
    }
    setDeferredPrompt(null);
  };

  const handleDismissInstallBanner = () => {
    try {
      localStorage.setItem('ts_sangkar_pwa_dismissed', 'true');
    } catch (e) {
      console.error(e);
    }
    setShowInstallBanner(false);
  };

  // Time & date states
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  // Toast notifications states
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastType, setToastType] = useState<'success' | 'warning' | 'error' | 'info'>('success');
  const [showToast, setShowToast] = useState<boolean>(false);

  // Hidden Capture Container ref
  const captureRef = useRef<HTMLDivElement>(null);

  // Clock ticks
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      setCurrentDate(
        now.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch products from Google Apps Script Web App
  const loadProducts = async (quiet = false) => {
    if (!gasUrlState || gasUrlState.trim() === '' || gasUrlState.includes('PASTE_YOUR_URL')) {
      return;
    }
    if (!quiet) setLoading(true);
    try {
      const urlWithAction = `${gasUrlState}${gasUrlState.includes('?') ? '&' : '?'}action=getProducts`;
      const response = await fetch(urlWithAction);
      if (!response.ok) throw new Error('Gagal mengambil produk');
      const data = await response.json();
      
      // Pembantu konversi nomor kuat pencegah bug format mata uang lokal (Indonesian format 10.000 atau Rp. 10.000)
      const safeParseNumber = (val: any): number => {
        if (val === undefined || val === null || val === '') return 0;
        if (typeof val === 'number') return val;
        
        let cleaned = String(val).trim();
        // Bersihkan simbol mata uang rupiah dan asing
        cleaned = cleaned.replace(/^(Rp\.?\s*|IDR\s*|\$)/gi, '');
        
        // Cek jika string mengandung titik dan koma (misal: 1.250,50 atau 1,250.50)
        if (cleaned.includes('.') && cleaned.includes(',')) {
          const lastDot = cleaned.lastIndexOf('.');
          const lastComma = cleaned.lastIndexOf(',');
          if (lastDot > lastComma) {
            // Gaya US: Koma ribuan, Titik desimal
            cleaned = cleaned.replace(/,/g, '');
          } else {
            // Gaya ID: Titik ribuan, Koma desimal
            cleaned = cleaned.replace(/\./g, '').replace(/,/g, '.');
          }
        } else if (cleaned.includes('.')) {
          // Hanya ada titik. Jika diikuti 3 digit desimal, itu pemisah ribuan Rupiah
          const parts = cleaned.split('.');
          if (parts.length > 1 && parts[parts.length - 1].length === 3) {
            cleaned = cleaned.replace(/\./g, '');
          }
        } else if (cleaned.includes(',')) {
          // Hanya ada koma. Jika diikuti 3 desimal, perlakukan sebagai pemisah ribuan
          const parts = cleaned.split(',');
          if (parts.length > 1 && parts[parts.length - 1].length === 3) {
            cleaned = cleaned.replace(/,/g, '');
          } else {
            cleaned = cleaned.replace(/,/g, '.');
          }
        }
        
        const parsed = Number(cleaned);
        return isNaN(parsed) ? 0 : parsed;
      };

      if (Array.isArray(data)) {
        const mapped: Product[] = data.map((item: any) => ({
          id: item.id !== undefined && item.id !== null ? String(item.id) : '',
          nama: item.nama_produk !== undefined && item.nama_produk !== null ? String(item.nama_produk) : '',
          ukuran: item.ukuran !== undefined && item.ukuran !== null ? String(item.ukuran) : '',
          harga: safeParseNumber(item.harga),
          kategori: item.kategori !== undefined && item.kategori !== null ? String(item.kategori) : '',
          foto: getGoogleDriveThumbnailUrl(item.foto_url || ''),
          stok: item.stok !== undefined && item.stok !== '' ? safeParseNumber(item.stok) : 100,
          hargaPokok: item.harga_pokok !== undefined && item.harga_pokok !== null ? safeParseNumber(item.harga_pokok) : 0,
        }));
        setProducts(mapped);
        if (!quiet) triggerToast('Katalog produk disinkronkan dari Google Sheets!', 'success');
      }
    } catch (err) {
      console.error('Fetch products failed:', err);
      if (!quiet) triggerToast('Gagal memuat produk. Menampilkan data lokal offline.', 'warning');
    } finally {
      if (!quiet) setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts(true);
  }, [gasUrlState]);

  // CRUD implementation for products
  const addProductToSheet = async (newProd: Product) => {
    setLoading(true);
    try {
      // Local backup addition first so user sees immediate results
      const localId = newProd.id || 'temp-' + Date.now();
      const localAdd: Product = { ...newProd, id: localId };
      setProducts(prev => [...prev, localAdd]);

      if (!gasUrlState || gasUrlState.trim() === '' || gasUrlState.includes('PASTE_YOUR_URL')) {
        triggerToast('Produk disimpan lokal (Konfigurasi GAS belum aktif!)', 'info');
        setLoading(false);
        return true;
      }

      // We send simple request bypasses CORS preflight in GAS Web Apps
      const response = await fetch(gasUrlState, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify({
          action: 'addProduct',
          data: {
            id: newProd.id || undefined, // Send specified ID if entered manually
            kategori: newProd.kategori,
            nama_produk: newProd.nama,
            ukuran: newProd.ukuran,
            tipe: 'Mentah', 
            harga: newProd.harga,
            foto_url: newProd.foto,
            stok: newProd.stok !== undefined ? newProd.stok : 100,
            harga_pokok: newProd.hargaPokok || 0
          }
        })
      });

      // Attempt parsing response
      try {
        const resText = await response.text();
        const resData = JSON.parse(resText);
        if (resData.status === 'success') {
          if (resData.id) {
            setProducts(prev => prev.map(p => p.id === localId ? { ...p, id: resData.id } : p));
          }
          triggerToast('Produk baru berhasil disimpan ke Google Sheets!', 'success');
        } else {
          console.warn('API warning:', resData.message);
        }
      } catch (e) {
        // Simple fallback
        triggerToast('Menambahkan produk...', 'info');
      }
      
      // Refresh to get official values
      await loadProducts(true);
      return true;
    } catch (err) {
      console.error('Add product failed:', err);
      triggerToast('Gagal menyimpan produk ke cloud', 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const editProductInSheet = async (editedProd: Product) => {
    setLoading(true);
    try {
      // Local edit update first
      setProducts(prev => prev.map(p => {
        const isMatch = (p.id && editedProd.id && String(p.id) === String(editedProd.id)) || (p.nama === editedProd.nama && p.ukuran === editedProd.ukuran);
        return isMatch ? editedProd : p;
      }));

      if (!gasUrlState || gasUrlState.trim() === '' || gasUrlState.includes('PASTE_YOUR_URL')) {
        triggerToast('Perubahan disimpan lokal (GAS belum aktif)', 'info');
        setLoading(false);
        return true;
      }

      const response = await fetch(gasUrlState, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify({
          action: 'editProduct',
          data: {
            id: editedProd.id,
            kategori: editedProd.kategori,
            nama_produk: editedProd.nama,
            ukuran: editedProd.ukuran,
            tipe: 'Mentah',
            harga: editedProd.harga,
            foto_url: editedProd.foto,
            stok: editedProd.stok !== undefined ? editedProd.stok : 100,
            harga_pokok: editedProd.hargaPokok || 0
          }
        })
      });

      try {
        const resText = await response.text();
        const resData = JSON.parse(resText);
        if (resData.status === 'success') {
          triggerToast('Produk diperbarui di Google Sheets!', 'success');
        }
      } catch (e) {
        triggerToast('Menyimpan perubahan produk...', 'info');
      }

      await loadProducts(true);
      return true;
    } catch (err) {
      console.error('Edit product failed:', err);
      triggerToast('Gagal merubah produk ke cloud', 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteProductFromSheet = (prod: Product) => {
    // Membuka modal konfirmasi kustom yang aman dari sandbox iframe
    setDeleteConfirmProduct(prod);
  };

  const executeDeleteProduct = async (prod: Product) => {
    setDeleteConfirmProduct(null);
    setLoading(true);
    try {
      // Local filter first (Hanya fokus pada ID saja)
      setProducts(prev => prev.filter(p => {
        const isMatch = p.id && prod.id && String(p.id) === String(prod.id);
        return !isMatch;
      }));

      if (!gasUrlState || gasUrlState.trim() === '' || gasUrlState.includes('PASTE_YOUR_URL')) {
        triggerToast('Produk dihapus lokal', 'info');
        setLoading(false);
        return true;
      }

      const response = await fetch(gasUrlState, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify({
          action: 'deleteProduct',
          data: {
            id: prod.id
          }
        })
      });

      const resText = await response.text();
      let resData: any;
      try {
        resData = JSON.parse(resText);
      } catch (e) {
        setDeleteDebugHeader('DEBUG INFO');
        setDeleteDebugLog(`Request hapus dikirim ke Google Sheets, tetapi gagal mengurai response JSON.\n\nRaw Response dari Server:\n${resText}\n\nHarap periksa spreadsheet Anda.`);
        triggerToast('Menghapus produk dari Sheet...', 'info');
        await loadProducts(true);
        return true;
      }

      if (resData.status === 'success') {
        triggerToast('Produk berhasil dihapus dari Google Sheets!', 'success');
      } else {
        setDeleteDebugHeader('DEBUG GAGAL CLOUD');
        setDeleteDebugLog(`Gagal menghapus produk dari Cloud!\n\nDetail Pesan Error:\n${resData.message || 'Error tidak dikenal'}\n\nResponse Server:\n${JSON.stringify(resData, null, 2)}`);
        triggerToast('Gagal menghapus produk: ' + (resData.message || 'Error tidak dikenal'), 'error');
      }

      await loadProducts(true);
      return true;
    } catch (err: any) {
      console.error('Delete product failed:', err);
      setDeleteDebugHeader('DEBUG ERROR NETWORK');
      setDeleteDebugLog(`Terjadi kesalahan koneksi / jaringan:\n\n${err.message || err.toString()}`);
      triggerToast('Gagal menghapus produk dari cloud', 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Show customized toasts
  const triggerToast = (msg: string, type: 'success' | 'warning' | 'error' | 'info') => {
    setToastMessage(msg);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  // Filter products by searching and category selection
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.kategori === selectedCategory;
    const matchesKeyword =
      p.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.kategori.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.ukuran.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.id !== undefined && p.id !== null && String(p.id).toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesKeyword;
  });

  // Basket calculations
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);

  const getSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.qty * item.harga, 0);
  };

  const getDiskonAmount = () => {
    const checkedPct = Math.min(100, Math.max(0, diskon));
    return Math.round((getSubtotal() * checkedPct) / 100);
  };

  const getTotal = () => {
    return getSubtotal() - getDiskonAmount() + ongkir + tambahan;
  };

  const currentUangDiterima = metode === 'DP' ? dpDiterima : uangDiterima;
  const netChangeOrDue = currentUangDiterima - getTotal();

  // Handle adding products to cart
  const addToCart = (p: Product) => {
    let message = '';
    let msgType: 'success' | 'warning' | 'error' | 'info' = 'success';

    setCart((prevCart) => {
      const productStock = p.stok !== undefined ? p.stok : 100;
      const existingIndex = prevCart.findIndex((item) => item.nama === p.nama && item.ukuran === p.ukuran);
      
      if (existingIndex > -1) {
        const currentQty = prevCart[existingIndex].qty;
        if (currentQty >= productStock) {
          message = `Stok tidak mencukupi! Hanya ada ${productStock} unit tersisa.`;
          msgType = 'warning';
          return prevCart;
        }
        const updated = [...prevCart];
        updated[existingIndex] = {
          ...updated[existingIndex],
          qty: updated[existingIndex].qty + 1
        };
        message = `Ditambahkan: ${p.nama}`;
        msgType = 'success';
        return updated;
      } else {
        if (productStock <= 0) {
          message = `Stok produk "${p.nama}" sedang kosong!`;
          msgType = 'warning';
          return prevCart;
        }
        message = `Ditambahkan: ${p.nama}`;
        msgType = 'success';
        return [...prevCart, { ...p, qty: 1, note: '' }];
      }
    });

    if (message) {
      setTimeout(() => triggerToast(message, msgType), 10);
    }
  };

  // Adjust product quantities in cart
  const updateQty = (index: number, val: number) => {
    const item = cart[index];
    const originalProduct = products.find(p => p.nama === item.nama && p.ukuran === item.ukuran);
    const productStock = originalProduct && originalProduct.stok !== undefined ? originalProduct.stok : 100;

    let n = Math.max(1, isNaN(val) ? 1 : val);
    if (n > productStock) {
      triggerToast(`Batas stok tercapai! Hanya ada ${productStock} unit tersedia.`, 'warning');
      n = productStock;
    }

    const updated = [...cart];
    updated[index].qty = n;
    setCart(updated);
  };

  // Remove individual items
  const removeCartItem = (index: number) => {
    const updated = [...cart];
    updated.splice(index, 1);
    setCart(updated);
  };

  const clearCart = () => {
    if (cart.length === 0) return;
    setShowConfirmClearCart(true);
  };

  const executeClearCart = () => {
    setCart([]);
    triggerToast('Keranjang dikosongkan', 'info');
    setShowConfirmClearCart(false);
  };

  // Prepare transaction parameters object
  const getTransactionData = (): TransactionData => {
    const now = new Date();
    const formattedDate = now.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const formattedTime = now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const invoiceId = editingTransactionId || `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
      now.getDate()
    ).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(
      now.getMinutes()
    ).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;

    return {
      noTransaksi: invoiceId,
      tanggal: formattedDate,
      jam: formattedTime,
      nama: nama || 'Common Customer',
      alamat: alamat || 'Alamat Toko / Ambil Sendiri',
      kontak: kontak || '-',
      estimasi: estimasi || '',
      items: cart.map((c) => ({
        nama: c.nama,
        ukuran: c.ukuran,
        qty: c.qty,
        harga: c.harga,
        catatan: c.note || '',
        hargaPokok: c.hargaPokok || 0,
      })),
      subtotal: getSubtotal(),
      diskonPct: diskon,
      diskonAmount: getDiskonAmount(),
      ongkir: ongkir,
      tambahan: tambahan,
      total: getTotal(),
      uangDiterima: currentUangDiterima,
      change: netChangeOrDue,
      metode: metode,
    };
  };

  // Submit process to sheet (Google Apps Script API endpoint) and launch print layout output
  const checkout = async () => {
    if (cart.length === 0) {
      triggerToast('Pilih beberapa produk terlebih dahulu!', 'warning');
      return;
    }

    if (!nama.trim()) {
      triggerToast('Nama pelanggan wajib diisi sebelum checkout!', 'warning');
      return;
    }

    const totalBayar = getTotal();
    if (metode === 'Tunai' || metode === 'Transfer' || metode === 'QRIS' || metode === 'Kartu Debit' || metode === 'Kartu Kredit') {
      if (!uangDiterima || uangDiterima <= 0) {
        triggerToast('Jumlah uang diterima wajib diisi!', 'warning');
        return;
      }
      if (uangDiterima < totalBayar) {
        triggerToast(`Uang diterima (Rp ${uangDiterima.toLocaleString('id-ID')}) kurang dari total tagihan (Rp ${totalBayar.toLocaleString('id-ID')})!`, 'warning');
        return;
      }
    } else if (metode === 'DP') {
      if (!dpDiterima || dpDiterima <= 0) {
        triggerToast('Uang DP diterima wajib diisi!', 'warning');
        return;
      }
      if (dpDiterima >= totalBayar) {
        triggerToast(`Uang DP tidak boleh lebih besar atau sama dengan total tagihan! Silakan gunakan metode pembayaran Lunas (Tunai/Transfer).`, 'warning');
        return;
      }
    }

    const receiptData = getTransactionData();
    triggerToast('Menyimpan transaksi ke cloud...', 'info');

    // Submit back in a fire-and-forget/no-cors design to sheet
    if (
      gasUrlState &&
      gasUrlState.trim() !== '' &&
      !gasUrlState.includes('PASTE_YOUR_URL')
    ) {
      try {
        await fetch(gasUrlState, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: editingTransactionId ? 'editTransaction' : 'saveTransaction', data: receiptData }),
        });
      } catch (err) {
        console.error('Submitting transaction data failed:', err);
      }
    }

    // Render print window containing custom iframe output
    const receiptHTMLString = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Nota ${storeNameState} - ${receiptData.noTransaksi}</title>
          <style>
            body { margin: 0; background: #ffffff; padding: 20px; display: flex; justify-content: center; }
            @media print {
              body { padding: 0; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          <div id="receipt-root"></div>
          <script>
            // We transfer the metadata dynamically for perfect printing in separate print window
            const root = document.getElementById('receipt-root');
            root.innerHTML = \`
              <div style="font-family:'Segoe UI',Arial,sans-serif;width:400px;background:#fff;color:#1a1a1a;padding:5px;">
                <div style="text-align:center;padding-bottom:12px;border-bottom:2px dashed #ddd;">
                  <img src="${storeLogoState}" alt="Logo" style="width:75px;height:auto;margin-bottom:6px;border-radius:50%;" onerror="this.style.display='none'" />
                  <h2 style="margin:0;font-size:20px;font-weight:800;color:#1a1a2e;text-transform:uppercase;">${storeNameState}</h2>
                  <p style="margin:3px 0 0;font-size:10px;color:#777;">${storeSloganState}</p>
                </div>
                <div style="padding:10px 0;font-size:11px;border-bottom:1px solid #eee;">
                  <table style="width:100%;border-collapse:collapse;">
                    <tr>
                      <td>📅 ${receiptData.tanggal}</td>
                      <td style="text-align:right;">📅 ${receiptData.jam}</td>
                    </tr>
                    <tr>
                      <td colspan="2" style="font-weight:700;font-size:12px;margin-top:4px;">No: ${receiptData.noTransaksi}</td>
                    </tr>
                  </table>
                </div>
                <div style="padding:10px 0;font-size:11px;line-height:1.6;border-bottom:1px solid #eee;">
                  <div><strong>Pelanggan:</strong> ${receiptData.nama}</div>
                  <div><strong>Alamat:</strong> ${receiptData.alamat}</div>
                  <div><strong>Kontak:</strong> ${receiptData.kontak}</div>
                  \${"${receiptData.estimasi}" ? "<div><strong>Estimasi PO:</strong> " + new Date("${receiptData.estimasi}").toLocaleDateString('id-ID', {day:'numeric',month:'long',year:'numeric'}) + "</div>" : ""}
                </div>
                <div style="padding:10px 0;">
                  <table style="width:100%;border-collapse:collapse;font-size:11px;">
                    <thead>
                      <tr style="border-bottom:2px solid #ccc;background:#f9f9f9;">
                        <th style="text-align:left;padding:4px;">Produk</th>
                        <th style="text-align:center;padding:4px;">Qty</th>
                        <th style="text-align:right;padding:4px;">Harga</th>
                        <th style="text-align:right;padding:4px;">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      \${JSON.parse(\`${JSON.stringify(receiptData.items)}\`).map(item => \`
                        <tr style="border-bottom:1px solid #eee;">
                          <td style="padding:6px 4px;">
                            \${item.nama} <span style="font-size:9;color:#777;">(\${item.ukuran})</span>
                            \${item.catatan ? '<div style="font-size:9px;color:#888;">Catatan: ' + item.catatan + '</div>' : ''}
                          </td>
                          <td style="text-align:center;padding:6px 4px;">\${item.qty}</td>
                          <td style="text-align:right;padding:6px 4px;">Rp \${item.harga.toLocaleString('id-ID')}</td>
                          <td style="text-align:right;padding:6px 4px;font-weight:600;">Rp \${(item.qty * item.harga).toLocaleString('id-ID')}</td>
                        </tr>
                      \`).join('')}
                    </tbody>
                  </table>
                </div>
                <div style="font-size:11px;line-height:1.6;">
                  <div style="display:flex;justify-content:space-between;"><span>Subtotal:</span><strong>Rp ${receiptData.subtotal.toLocaleString('id-ID')}</strong></div>
                  \${${receiptData.diskonAmount} > 0 ? \`<div style="display:flex;justify-content:space-between;color:red;"><span>Diskon (${receiptData.diskonPct}%):</span><strong>-Rp ${receiptData.diskonAmount.toLocaleString('id-ID')}</strong></div>\` : ''}
                  <div style="display:flex;justify-content:space-between;"><span>Ongkir:</span><strong>Rp ${receiptData.ongkir.toLocaleString('id-ID')}</strong></div>
                  <div style="display:flex;justify-content:space-between;"><span>Biaya Tambahan:</span><strong>Rp ${receiptData.tambahan.toLocaleString('id-ID')}</strong></div>
                  <div style="border-top:1px solid #111;margin:6px 0;"></div>
                  <div style="display:flex;justify-content:space-between;font-size:14px;font-weight:800;"><span>TOTAL:</span><span>Rp ${receiptData.total.toLocaleString('id-ID')}</span></div>
                  <div style="margin-top:6px;">Metode: <strong>${receiptData.metode === 'DP' ? 'DP (Uang Muka)' : receiptData.metode}</strong></div>
                  ${
                    receiptData.metode === 'Belum Dibayar'
                      ? `<div style="margin-top:6px;padding:6px;background:#fff9eb;border:1px solid #fde68a;text-align:center;">Bayar saat barang diambil</div>`
                      : `
                    <div style="display:flex;justify-content:space-between;margin-top:3px;"><span>Uang Masuk:</span><strong>Rp ${receiptData.uangDiterima.toLocaleString('id-ID')}</strong></div>
                    <div style="display:flex;justify-content:space-between;font-weight:700;\${${receiptData.change} >=0 ? 'color:green' : 'color:red'}">
                      <span>\${"${receiptData.metode}" === "DP" ? "Sisa Tagihan:" : "Kembalian:"}</span>
                      <span>Rp \${Math.abs(${receiptData.change}).toLocaleString('id-ID')}</span>
                    </div>
                  `
                  }
                </div>
                <div style="text-align:center;margin-top:20px;padding-top:10px;border-top:2px dashed #ddd;font-size:9px;color:#777;">
                  <p style="margin:2px 0;">Terima kasih atas kepercayaan Anda</p>
                  <p style="margin:2px 0;font-weight:600;text-transform:uppercase;">· ${storeNameState} ·</p>
                  <p style="margin:2px 0;">${storeAlamatState}</p>
                  ${storeKontakState ? `<p style="margin:2px 0;font-weight:500;">${storeKontakState}</p>` : ''}
                </div>
              </div>
            \`;
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=500,height=750');
    if (printWindow) {
      printWindow.document.write(receiptHTMLString);
      printWindow.document.close();
      triggerToast('Membuka dialog pencetakan nota...', 'success');
    } else {
      triggerToast('Gagal membuka dialog cetak (pembatas popup aktif)', 'error');
    }

    if (editingTransactionId) {
      setEditingTransactionId(null);
      resetAll();
    }
  };

  // Capture html2canvas helper with proper loading triggers
  const executeCaptureOfData = async (receiptData: any): Promise<{ blob: Blob; filename: string } | null> => {
    triggerToast('Sedang memproses tangkapan nota...', 'info');

    // Create a rendering target that exists but is off-screen using proper styles
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '-9999px';
    container.style.width = '400px';
    container.style.background = '#ffffff';
    container.style.boxSizing = 'border-box';
    document.body.appendChild(container);

    try {
      // Inline dynamic import representation
      const rootDiv = document.createElement('div');
      rootDiv.style.width = '400px';
      rootDiv.style.boxSizing = 'border-box';
      rootDiv.style.background = '#ffffff';
      container.appendChild(rootDiv);

      // Render custom receipt template dynamically to match html2canvas layout specs
      const elementHtml = `
        <div style="font-family:'Segoe UI',Arial,sans-serif;width:400px;background:#ffffff;color:#111827;padding:24px;box-sizing:border-box;">
          <div style="text-align:center;padding-bottom:14px;border-bottom:2px dashed #d1d5db;width:100%;box-sizing:border-box;">
            ${storeLogoState && storeLogoState !== 'ts.png' ? `
              <div style="text-align:center;margin:0 auto 10px auto;width:100%;display:block;box-sizing:border-box;">
                <img src="${storeLogoState}" style="width:70px;height:70px;border-radius:50%;object-fit:cover;display:inline-block;margin:0 auto;" onerror="this.style.display='none'" />
              </div>` : ''}
            <div style="font-size:20px;font-weight:800;letter-spacing:1px;color:#1e1b4b;margin-bottom:3px;text-transform:uppercase;text-align:center;width:100%;">${storeNameState}</div>
            <div style="font-size:11px;color:#4b5563;text-align:center;width:100%;">${storeSloganState}</div>
          </div>
          <div style="padding:10px 0;font-size:11px;border-bottom:1px solid #f3f4f6;">
            <table style="width:100%;">
              <tr>
                <td style="color:#4b5563;">📅 ${receiptData.tanggal}</td>
                <td style="text-align:right;font-weight:700;">🕐 ${receiptData.jam}</td>
              </tr>
              <tr>
                <td colspan="2" style="font-weight:700;font-size:12px;color:#111827;padding-top:4px;">No: ${receiptData.noTransaksi}</td>
              </tr>
            </table>
          </div>
          <div style="padding:10px 0;font-size:11px;line-height:1.6;border-bottom:1px solid #f3f4f6;color:#1f2937;">
            <div>👤 Pelanggan: <strong>${receiptData.nama}</strong></div>
            <div>📍 Alamat: ${receiptData.alamat}</div>
            <div>📞 Kontak: ${receiptData.kontak}</div>
            ${receiptData.estimasi ? `<div>📅 Estimasi PO: <strong>${new Date(receiptData.estimasi).toLocaleDateString('id-ID', {day:'numeric',month:'long',year:'numeric'})}</strong></div>` : ''}
          </div>
          <div style="padding:10px 0;">
            <table style="width:100%;border-collapse:collapse;font-size:11px;">
              <thead>
                <tr style="background:#f9fafb;border-bottom:2px solid #e5e7eb;">
                  <th style="padding:6px;text-align:left;">Produk</th>
                  <th style="padding:6px;text-align:center;">Qty</th>
                  <th style="padding:6px;text-align:right;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${receiptData.items
                  .map(
                    (item: any) => `
                  <tr style="border-bottom:1px solid #f3f4f6;">
                    <td style="padding:6px;">
                      ${item.nama} <span style="font-size:9px;color:#6b7280;">(${item.ukuran})</span>
                      ${(item.catatan || item.note) ? `<div style="font-size:9px;color:#888;">Catatan: ${item.catatan || item.note}</div>` : ''}
                    </td>
                    <td style="padding:6px;text-align:center;">${item.qty}</td>
                    <td style="padding:6px;text-align:right;font-weight:600;">Rp ${(item.qty * item.harga).toLocaleString('id-ID')}</td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
          <div style="font-size:11px;line-height:1.6;color:#1f2937;">
            <div style="display:flex;justify-content:space-between;"><span>Subtotal:</span><span>Rp ${receiptData.subtotal.toLocaleString('id-ID')}</span></div>
            ${receiptData.diskonAmount > 0 ? `<div style="display:flex;justify-content:space-between;color:#dc2626;"><span>Diskon (${receiptData.diskonPct}%):</span><span>-Rp ${receiptData.diskonAmount.toLocaleString('id-ID')}</span></div>` : ''}
            <div style="display:flex;justify-content:space-between;"><span>Ongkir:</span><span>Rp ${receiptData.ongkir.toLocaleString('id-ID')}</span></div>
            <div style="display:flex;justify-content:space-between;"><span>Biaya Tambahan:</span><span>Rp ${receiptData.tambahan.toLocaleString('id-ID')}</span></div>
            <div style="border-top:1.5px solid #111827;margin:6px 0;"></div>
            <div style="display:flex;justify-content:space-between;font-size:15px;font-weight:800;color:#111827;"><span>TOTAL TAGIHAN:</span><span>Rp ${receiptData.total.toLocaleString('id-ID')}</span></div>
            <div style="margin-top:6px;color:#4b5563;">Metode: <strong>${receiptData.metode === 'DP' ? 'DP (Uang Muka)' : receiptData.metode}</strong></div>
            ${
              receiptData.metode === 'Belum Dibayar'
                ? `<div style="margin-top:6px;padding:6px;background:#fffbeb;border:1px solid #fef3c7;border-radius:4px;color:#b45309;text-align:center;">Pembayaran saat pengambilan</div>`
                : `
              <div style="display:flex;justify-content:space-between;margin-top:4px;"><span>Uang Diterima:</span><span>Rp ${receiptData.uangDiterima.toLocaleString('id-ID')}</span></div>
              <div style="display:flex;justify-content:space-between;font-weight:700;margin-top:2px;">
                <span>${receiptData.metode === 'DP' ? 'Sisa Tagihan:' : 'Kembalian:'}</span>
                <span style="color:${receiptData.change >= 0 ? '#16a34a' : '#dc2626'}">Rp ${Math.abs(receiptData.change).toLocaleString('id-ID')}</span>
              </div>
            `
            }
          </div>
          <div style="text-align:center;margin-top:20px;padding-top:12px;border-top:1.5px dashed #d1d5db;font-size:9px;color:#6b7280;">
            <p style="margin:2px 0;">Terima kasih atas kepercayaan Anda</p>
            <p style="margin:2px 0;font-weight:600;color:#374151;text-transform:uppercase;">· ${storeNameState} ·</p>
            <p style="margin:2px 0;">${storeAlamatState}</p>
            ${storeKontakState ? `<p style="margin:2px 0;font-weight:550;">${storeKontakState}</p>` : ''}
          </div>
        </div>
      `;
      rootDiv.innerHTML = elementHtml;

      // Allow image loading sequences
      await new Promise((resolve) => setTimeout(resolve, 500));

      const canvas = await html2canvas(rootDiv, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });

      return new Promise((resolve) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({
                blob,
                filename: `Nota_${storeNameState.replace(/\s+/g, '_')}_${receiptData.noTransaksi}.jpg`,
              });
            } else {
              resolve(null);
            }
          },
          'image/jpeg',
          0.95
        );
      });
    } catch (e) {
      console.error('Canvas capture failed:', e);
      return null;
    } finally {
      document.body.removeChild(container);
    }
  };

  const executeCapture = async (): Promise<{ blob: Blob; filename: string } | null> => {
    if (cart.length === 0) {
      triggerToast('Keranjang belanja kosong!', 'warning');
      return null;
    }
    const receiptData = getTransactionData();
    return executeCaptureOfData(receiptData);
  };

  const downloadNotaJPG = async () => {
    const result = await executeCapture();
    if (!result) {
      triggerToast('Gagal memproses nota!', 'error');
      return;
    }
    const { blob, filename } = result;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    triggerToast('Nota sukses diunduh sebagai gambar!', 'success');
  };

  const shareNota = async () => {
    const result = await executeCapture();
    if (!result) {
      triggerToast('Gagal memproses nota!', 'error');
      return;
    }
    const { blob, filename } = result;
    const file = new File([blob], filename, { type: 'image/jpeg' });

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: `Nota ${storeNameState}`,
          text: `Berikut adalah nota transaksi ${storeNameState}.`,
          files: [file],
        });
        triggerToast('Nota dibagikan!', 'success');
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          // Fallback download if user canceled share menu but supported otherwise
          downloadNotaJPG();
        }
      }
    } else {
      // Direct fallback to downloder
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      triggerToast('Berbagi tidak didukung browser ini. Mengunduh JPG...', 'info');
    }
  };

  // Reset workstates to defaults
  const resetAll = () => {
    if (cart.length > 0 || nama || alamat || kontak || estimasi || ongkir > 0 || tambahan > 0 || diskon > 0 || uangDiterima > 0) {
      setShowConfirmReset(true);
    } else {
      executeResetAll();
    }
  };

  const executeResetAll = () => {
    setCart([]);
    setNama('');
    setAlamat('');
    setKontak('');
    setEstimasi('');
    setOngkir(0);
    setTambahan(0);
    setDiskon(0);
    setMetode('Tunai');
    setUangDiterima(0);
    setDpDiterima(0);
    setSearchQuery('');
    setSelectedCategory('all');
    triggerToast('Seluruh kolom disetel ulang!', 'success');
    setShowConfirmReset(false);
  };

  // ==================== CUSTOM STORE CONFIGURATION ====================
  const [activeTab, setActiveTab ] = useState<'pos' | 'products' | 'reports' | 'settings'>('pos');
  const [storeNameState, setStoreNameState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('ts_sangkar_store_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.namaToko || 'KASIR PINTAR';
      }
    } catch {}
    return 'KASIR PINTAR';
  });
  const [storeSloganState, setStoreSloganState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('ts_sangkar_store_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.sloganToko || 'Sistem Kasir Fleksibel Multi-Fungsi';
      }
    } catch {}
    return 'Sistem Kasir Fleksibel Multi-Fungsi';
  });
  const [storeAlamatState, setStoreAlamatState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('ts_sangkar_store_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.alamatToko !== undefined ? parsed.alamatToko : '🌐 Yogyakarta, Indonesia';
      }
    } catch {}
    return '🌐 Yogyakarta, Indonesia';
  });
  const [storeKontakState, setStoreKontakState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('ts_sangkar_store_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.kontakToko !== undefined ? parsed.kontakToko : '📞 0812-3456-7890';
      }
    } catch {}
    return '📞 0812-3456-7890';
  });
  const [storeLogoState, setStoreLogoState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('ts_sangkar_store_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.logoToko || 'store.png';
      }
    } catch {}
    return 'store.png';
  });

  // Product CRUD states
  const [showProductForm, setShowProductForm] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodFormNama, setProdFormNama] = useState<string>('');
  const [prodFormUkuran, setProdFormUkuran] = useState<string>('');
  const [prodFormKategori, setProdFormKategori] = useState<string>('Umum');
  const [prodFormHarga, setProdFormHarga] = useState<number>(0);
  const [prodFormHargaPokok, setProdFormHargaPokok] = useState<number>(0);
  const [prodFormFoto, setProdFormFoto] = useState<string>('');
  const [prodFormStok, setProdFormStok ] = useState<number>(100);
  const [prodFormId, setProdFormId] = useState<string>('');

  // Barcode Camera Scanner States & Refs
  const [isScannerOpen, setIsScannerOpen ] = useState<boolean>(false);
  const [scannerPurpose, setScannerPurpose ] = useState<'productId' | 'posSearch'>('productId');
  const [lastScannedItem, setLastScannedItem ] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scanCooldownRef = useRef<{ [code: string]: number }>({});

  // Mobile Hamburger Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen ] = useState<boolean>(false);

  // Cashier beep sound using Web Audio API (highly standard and interactive)
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime); // High pitch professional cashier beep
      gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime); 
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.12); // Beep duration 120ms
    } catch (e) {
      console.warn("Audio Context blocked or not supported:", e);
    }
  };

  // Start Barcode Scanner using camera
  const startScanner = async (purpose: 'productId' | 'posSearch') => {
    setScannerPurpose(purpose);
    setIsScannerOpen(true);
    setLastScannedItem(null);
    
    // Allow React to mount the HTML div #barcode-scanner-viewport
    setTimeout(async () => {
      try {
        if (scannerRef.current) {
          await stopScanner();
        }
        const scanner = new Html5Qrcode("barcode-scanner-viewport");
        scannerRef.current = scanner;
        
        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 24,
            qrbox: (width, height) => {
              // Standard wide box perfect for one-dimensional barcode capture
              const boxWidth = Math.min(width * 0.9, 320);
              const boxHeight = Math.min(height * 0.55, 150);
              return { width: boxWidth, height: boxHeight };
            },
            aspectRatio: 1.7777778,
            experimentalFeatures: {
              useBarCodeDetectorIfSupported: true
            }
          } as any,
          (decodedText) => {
            handleScanSuccess(decodedText);
          },
          () => {
            // Quietly ignore scan interval misses
          }
        );
      } catch (err) {
        console.error("Scanner start error:", err);
        triggerToast("Gagal mengakses kamera. Pastikan izin kamera telah diberikan.", "error");
        setIsScannerOpen(false);
      }
    }, 350);
  };

  // Stop Barcode Scanner camera connection
  const stopScanner = async () => {
    if (scannerRef.current) {
      if (scannerRef.current.isScanning) {
        try {
          await scannerRef.current.stop();
        } catch (e) {
          console.error("Error stopping camera:", e);
        }
      }
      scannerRef.current = null;
    }
  };

  // Handle successful barcode/QR code scan
  const handleScanSuccess = (decodedText: string) => {
    const code = decodedText.trim();
    if (!code) return;

    // Cooldown mechanism to prevent multiple redundant scans within 1.5s
    const now = Date.now();
    const lastTime = scanCooldownRef.current[code] || 0;
    if (now - lastTime < 1505) {
      return; 
    }
    scanCooldownRef.current[code] = now;

    if (scannerPurpose === 'productId') {
      playBeep();
      setProdFormId(code);
      triggerToast(`Barcode Kode Barang terpindai: ${code}`, 'success');
      setIsScannerOpen(false);
      stopScanner();
    } else if (scannerPurpose === 'posSearch') {
      // Find matching product in catalog (case insensitive)
      const found = productsRef.current.find(p => (p.id !== undefined && p.id !== null && String(p.id).toLowerCase() === code.toLowerCase()) || p.nama.toLowerCase() === code.toLowerCase());
      if (found) {
        playBeep();
        addToCart(found);
        setLastScannedItem(found.nama);
        // Clean feedback overlay after 1.5s so user can scan next barcode
        setTimeout(() => {
          setLastScannedItem(null);
        }, 1500);
      } else {
        triggerToast(`Kode barang "${code}" tidak terdaftar di katalog!`, 'warning');
      }
    }
  };

  // Ensure scanner camera is stopped if component unmounts
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  // Custom IFrame-safe Dialog Modals for deletion and debug alert logging
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState<Product | null>(null);
  const [deleteConfirmTransaction, setDeleteConfirmTransaction] = useState<any | null>(null);
  const [showConfirmClearCart, setShowConfirmClearCart] = useState<boolean>(false);
  const [showConfirmReset, setShowConfirmReset] = useState<boolean>(false);
  const [deleteDebugHeader, setDeleteDebugHeader] = useState<string>('');
  const [deleteDebugLog, setDeleteDebugLog] = useState<string | null>(null);

  // Custom states for interactive reports charts
  const [chartHoverIdx, setChartHoverIdx] = useState<number | null>(null);

  // Form states for Settings page
  const [tempName, setTempName] = useState<string>('KASIR PINTAR');
  const [tempSlogan, setTempSlogan] = useState<string>('Sistem Kasir Fleksibel Multi-Fungsi');
  const [tempAlamat, setTempAlamat] = useState<string>('🌐 Yogyakarta, Indonesia');
  const [tempKontak, setTempKontak] = useState<string>('📞 0812-3456-7890');
  const [tempLogo, setTempLogo] = useState<string>('store.png');
  const [tempGasUrl, setTempGasUrl] = useState<string>('');
  const [tempSheetId, setTempSheetId] = useState<string>('');

  // Sync temp variables with saved states on first load or changes
  useEffect(() => {
    setTempName(storeNameState);
    setTempSlogan(storeSloganState);
    setTempAlamat(storeAlamatState);
    setTempKontak(storeKontakState);
    setTempLogo(storeLogoState);
    setTempGasUrl(gasUrlState);
    setTempSheetId(sheetIdState);
  }, [storeNameState, storeSloganState, storeAlamatState, storeKontakState, storeLogoState, gasUrlState, sheetIdState]);

  useEffect(() => {
    try {
      const configStr = localStorage.getItem('ts_sangkar_store_config');
      if (configStr) {
        const config = JSON.parse(configStr);
        if (config.namaToko) setStoreNameState(config.namaToko);
        if (config.sloganToko) setStoreSloganState(config.sloganToko);
        if (config.alamatToko) setStoreAlamatState(config.alamatToko);
        if (config.kontakToko) setStoreKontakState(config.kontakToko);
        if (config.logoToko) setStoreLogoState(config.logoToko);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleSaveStoreConfig = (name: string, slogan: string, alamat: string, kontak: string, logo: string, gasUrl: string, sheetId: string) => {
    try {
      const config = { 
        namaToko: name, 
        sloganToko: slogan, 
        alamatToko: alamat, 
        kontakToko: kontak, 
        logoToko: logo 
      };
      localStorage.setItem('ts_sangkar_store_config', JSON.stringify(config));
      localStorage.setItem('ts_sangkar_gas_url', gasUrl.trim());
      localStorage.setItem('ts_sangkar_sheet_id', sheetId.trim());

      setStoreNameState(name);
      setStoreSloganState(slogan);
      setStoreAlamatState(alamat);
      setStoreKontakState(kontak);
      setStoreLogoState(logo);
      setGasUrlState(gasUrl.trim());
      setSheetIdState(sheetId.trim());

      triggerToast('Pengaturan toko & database berhasil disimpan!', 'success');
    } catch (e) {
      triggerToast('Gagal menyimpan pengaturan', 'error');
    }
  };

  // ==================== GOOGLE SHEET REPORT SYSTEM ====================
  const [sheetRows, setSheetRows] = useState<any[]>([]);
  const [reportsLoading, setReportsLoading] = useState<boolean>(false);
  const [reportsError, setReportsError] = useState<string>('');
  const [reportsSearchQuery, setReportsSearchQuery] = useState<string>('');
  const [selectedReportRow, setSelectedReportRow] = useState<any | null>(null);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);

  const parseCSV = (csvText: string) => {
    const lines: string[] = [];
    let currentLine = '';
    let insideQuote = false;

    for (let i = 0; i < csvText.length; i++) {
      const char = csvText[i];
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === '\n' && !insideQuote) {
        lines.push(currentLine);
        currentLine = '';
      } else if (char === '\r' && !insideQuote) {
        // ignore
      } else {
        currentLine += char;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }

    if (lines.length === 0) return [];

    const parseRow = (lineStr: string) => {
      const fields: string[] = [];
      let currentField = '';
      let inQuote = false;
      for (let i = 0; i < lineStr.length; i++) {
        const char = lineStr[i];
        if (char === '"') {
          inQuote = !inQuote;
        } else if (char === ',' && !inQuote) {
          fields.push(currentField);
          currentField = '';
        } else {
          currentField += char;
        }
      }
      fields.push(currentField);
      return fields;
    };

    const headers = parseRow(lines[0]).map(h => h.trim().toLowerCase());
    
    const parsedRows = [];
    for (let i = 1; i < lines.length; i++) {
      const fields = parseRow(lines[i]);
      if (fields.length < headers.length) continue;
      
      const rowObj: Record<string, string> = {};
      headers.forEach((header, idx) => {
        rowObj[header] = fields[idx]?.trim() || '';
      });
      parsedRows.push(rowObj);
    }
    return parsedRows;
  };

  const fetchGoogleSheetReports = async () => {
    setReportsLoading(true);
    setReportsError('');
    try {
      const spreadsheetId = sheetIdState || '19981hn179EkrhmnlGCBPl5ZVhx84O1KMaglrq9RKVCI';
      const range = "'Pesanan'!A1:Z10000";
      const apiKey = 'AIzaSyA8x0yI8zCPUgZktmGNvQVTzhm1fdZ0K74';
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?key=${apiKey}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Gagal mengunduh data (Status: ${response.status}). Hubungi administrator atau periksa visibilitas file Spreadsheet.`);
      }
      
      const data = await response.json();
      if (!data.values || data.values.length === 0) {
        setSheetRows([]);
        triggerToast('Data Google Sheet kosong!', 'info');
        return;
      }
      
      const headers = data.values[0].map((h: any) => String(h).trim().toLowerCase());
      const parsedRows = [];
      
      for (let i = 1; i < data.values.length; i++) {
        const rowValues = data.values[i];
        if (!rowValues || rowValues.length === 0) continue;
        const rowObj: Record<string, string> = {};
        headers.forEach((header: string, idx: number) => {
          rowObj[header] = rowValues[idx] !== undefined ? String(rowValues[idx]).trim() : '';
        });
        parsedRows.push(rowObj);
      }
      
      setSheetRows(parsedRows);
      triggerToast('Sinkronisasi data Google Sheets berhasil!', 'success');
    } catch (err: any) {
      console.error('Failed to load sheets report via API:', err);
      setReportsError(err.message || 'Gagal sinkronisasi data via Google Sheets v4 API.');
      triggerToast('Gagal memuat laporan transaksi', 'error');
    } finally {
      setReportsLoading(false);
    }
  };

  const handleUpdateTransactionStatus = async (noTransaksi: string, newStatus: string) => {
    // Update local state immediately
    setSheetRows(prev => prev.map(row => {
      if (getNoTransaksi(row) === noTransaksi) {
        return { ...row, status: newStatus };
      }
      return row;
    }));

    // Update selectedReportRow state if it is currently open
    setSelectedReportRow((prev: any) => {
      if (prev && getNoTransaksi(prev) === noTransaksi) {
        return { ...prev, status: newStatus };
      }
      return prev;
    });

    triggerToast(`Memperbarui status pesanan menjadi: ${newStatus}...`, 'info');

    if (gasUrlState && gasUrlState.trim() !== '' && !gasUrlState.includes('PASTE_YOUR_URL')) {
      try {
        await fetch(gasUrlState, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'updateTransactionStatus',
            data: { noTransaksi, status: newStatus }
          })
        });
        triggerToast(`Status pesanan ${noTransaksi} berhasil diperbarui di Cloud!`, 'success');
        setTimeout(() => {
          fetchGoogleSheetReports();
        }, 2000);
      } catch (err) {
        console.error('Failed to update transaction status:', err);
        triggerToast('Gagal memperbarui status ke Cloud Google Sheets', 'error');
      }
    } else {
      triggerToast('Status disimpan secara lokal. Sambungkan Google Apps Script untuk sinkronisasi cloud.', 'warning');
    }
  };

  const handleDeleteTransaction = (row: any) => {
    setDeleteConfirmTransaction(row);
  };

  const executeDeleteTransaction = async (row: any) => {
    setDeleteConfirmTransaction(null);
    setSelectedReportRow(null); // Tutup drawer rincian jika sedang terbuka
    setLoading(true);
    const noTransaksi = getNoTransaksi(row);
    try {
      // Hapus data lokal terlebih dahulu agar UI responsif
      setSheetRows(prev => prev.filter(r => getNoTransaksi(r) !== noTransaksi));
      triggerToast(`Menghapus transaksi ${noTransaksi}...`, 'info');

      if (gasUrlState && gasUrlState.trim() !== '' && !gasUrlState.includes('PASTE_YOUR_URL')) {
        const response = await fetch(gasUrlState, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8'
          },
          body: JSON.stringify({
            action: 'deleteTransaction',
            data: { noTransaksi }
          })
        });

        const resText = await response.text();
        let resData: any;
        try {
          resData = JSON.parse(resText);
        } catch {
          resData = { status: 'success' };
        }

        if (resData.status === 'success') {
          triggerToast(`Transaksi ${noTransaksi} berhasil dihapus dari Cloud!`, 'success');
          // Refresh reports and products (karena stok dikembalikan)
          setTimeout(() => {
            fetchGoogleSheetReports();
            loadProducts(true);
          }, 1500);
        } else {
          throw new Error(resData.message || 'Gagal menghapus di Cloud');
        }
      } else {
        triggerToast(`Transaksi ${noTransaksi} berhasil dihapus lokal!`, 'success');
      }
    } catch (err: any) {
      console.error('Failed to delete transaction:', err);
      triggerToast('Gagal menghapus transaksi: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTransaction = (row: any) => {
    try {
      const transactionNo = getNoTransaksi(row);
      const itemsRaw = getItems(row);
      let parsedItems: any[] = [];
      if (itemsRaw) {
        const trimmed = itemsRaw.trim();
        if (trimmed.startsWith('[')) {
          parsedItems = JSON.parse(trimmed);
        }
      }

      // Convert items to cart format
      const cartItems = parsedItems.map((item: any, idx: number) => {
        const existingProd = products.find(p => p.nama === item.nama && p.ukuran === item.ukuran);
        return {
          id: existingProd?.id || `temp-${Date.now()}-${idx}`,
          nama: item.nama || item.name || '',
          ukuran: item.ukuran || '',
          qty: Number(item.qty || 1),
          harga: Number(item.harga || 0),
          note: item.catatan || item.note || '',
          kategori: existingProd?.kategori || 'Umum',
          foto_url: existingProd?.foto_url || '',
          stok: existingProd?.stok !== undefined ? existingProd.stok : 100,
          hargaPokok: existingProd?.harga_pokok || 0,
        };
      });

      // Load into POS state
      setCart(cartItems);
      setNama(getNama(row));
      setAlamat(getAlamat(row));
      setKontak(getKontak(row));
      setEstimasi(getEstimasi(row));
      setOngkir(Number(getOngkirVal(row) || 0));
      setTambahan(Number(getTambahanVal(row) || 0));
      setDiskon(Number(getDiskonPctVal(row) || 0));
      setMetode(getMetode(row) as any || 'Tunai');
      setUangDiterima(Number(getUangDiterimaVal(row) || 0));
      setDpDiterima(Number(getUangDiterimaVal(row) || 0)); // if method is DP
      
      // Set editing transaction ID
      setEditingTransactionId(transactionNo);
      
      // Close detail modal
      setSelectedReportRow(null);
      
      // Switch active tab to POS
      setActiveTab('pos');
      
      triggerToast(`Pesanan ${transactionNo} dimuat ke Kasir untuk diubah!`, 'success');
    } catch (err) {
      console.error('Error editing transaction:', err);
      triggerToast('Gagal memuat detail pesanan untuk diedit', 'error');
    }
  };

  const handlePrintReceiptOfRow = (row: any) => {
    try {
      const itemsRaw = getItems(row);
      let parsedItems: any[] = [];
      if (itemsRaw) {
        const trimmed = itemsRaw.trim();
        if (trimmed.startsWith('[')) {
          parsedItems = JSON.parse(trimmed);
        }
      }

      const receiptData = {
        noTransaksi: getNoTransaksi(row),
        tanggal: getTanggal(row),
        jam: getWaktu(row) || '',
        nama: getNama(row) || 'Common Customer',
        alamat: getAlamat(row) || 'Alamat Toko / Ambil Sendiri',
        kontak: getKontak(row) || '-',
        estimasi: getEstimasi(row) || '',
        items: parsedItems,
        subtotal: Number(getSubtotalVal(row) || 0),
        diskonPct: Number(getDiskonPctVal(row) || 0),
        diskonAmount: Number(getDiskonAmountVal(row) || 0),
        ongkir: Number(getOngkirVal(row) || 0),
        tambahan: Number(getTambahanVal(row) || 0),
        total: Number(getTotalVal(row) || 0),
        uangDiterima: Number(getUangDiterimaVal(row) || 0),
        change: Number(getChangeVal(row) || 0),
        metode: getMetode(row) || 'Tunai',
      };

      const receiptHTMLString = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Nota ${storeNameState} - ${receiptData.noTransaksi}</title>
            <style>
              body { margin: 0; background: #ffffff; padding: 20px; display: flex; justify-content: center; }
              @media print {
                body { padding: 0; }
                .no-print { display: none !important; }
              }
            </style>
          </head>
          <body>
            <div id="receipt-root"></div>
            <script>
              const root = document.getElementById('receipt-root');
              root.innerHTML = \`
                <div style="font-family:'Segoe UI',Arial,sans-serif;width:400px;background:#fff;color:#1a1a1a;padding:5px;">
                  <div style="text-align:center;padding-bottom:12px;border-bottom:2px dashed #ddd;">
                    <img src="${storeLogoState}" alt="Logo" style="width:75px;height:75px;margin-bottom:6px;border-radius:50%;object-fit:cover;" onerror="this.style.display='none'" />
                    <h2 style="margin:0;font-size:20px;font-weight:800;color:#1a1a2e;text-transform:uppercase;">${storeNameState}</h2>
                    <p style="margin:3px 0 0;font-size:10px;color:#777;">${storeSloganState}</p>
                  </div>
                  <div style="padding:10px 0;font-size:11px;border-bottom:1px solid #eee;">
                    <table style="width:100%;border-collapse:collapse;">
                      <tr>
                        <td>📅 \${"${receiptData.tanggal}"}</td>
                        <td style="text-align:right;">🕐 \${"${receiptData.jam}"}</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="font-weight:700;font-size:12px;margin-top:4px;">No: \${"${receiptData.noTransaksi}"}</td>
                      </tr>
                    </table>
                  </div>
                  <div style="padding:10px 0;font-size:11px;line-height:1.6;border-bottom:1px solid #eee;">
                    <div><strong>Pelanggan:</strong> \${"${receiptData.nama}"}</div>
                    <div><strong>Alamat:</strong> \${"${receiptData.alamat}"}</div>
                    <div><strong>Kontak:</strong> \${"${receiptData.kontak}"}</div>
                    \${"${receiptData.estimasi}" ? "<div><strong>Estimasi PO:</strong> " + new Date("${receiptData.estimasi}").toLocaleDateString('id-ID', {day:'numeric',month:'long',year:'numeric'}) + "</div>" : ""}
                  </div>
                  <div style="padding:10px 0;">
                    <table style="width:100%;border-collapse:collapse;font-size:11px;">
                      <thead>
                        <tr style="border-bottom:2px solid #ccc;background:#f9f9f9;">
                          <th style="text-align:left;padding:4px;">Produk</th>
                          <th style="text-align:center;padding:4px;">Qty</th>
                          <th style="text-align:right;padding:4px;">Harga</th>
                          <th style="text-align:right;padding:4px;">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        \${JSON.parse(\`${JSON.stringify(receiptData.items)}\`).map(item => \`
                          <tr style="border-bottom:1px solid #eee;">
                            <td style="padding:6px 4px;">
                              \${item.nama} <span style="font-size:9px;color:#777;">(\${item.ukuran})</span>
                              \${item.catatan || item.note ? '<div style="font-size:9px;color:#888;">Catatan: ' + (item.catatan || item.note) + '</div>' : ''}
                            </td>
                            <td style="text-align:center;padding:6px 4px;">\${item.qty}</td>
                            <td style="text-align:right;padding:6px 4px;">Rp \${item.harga.toLocaleString('id-ID')}</td>
                            <td style="text-align:right;padding:6px 4px;font-weight:600;">Rp \${(item.qty * item.harga).toLocaleString('id-ID')}</td>
                          </tr>
                        \`).join('')}
                      </tbody>
                    </table>
                  </div>
                  <div style="font-size:11px;line-height:1.6;">
                    <div style="display:flex;justify-content:space-between;"><span>Subtotal:</span><strong>Rp \${Number("${receiptData.subtotal}").toLocaleString('id-ID')}</strong></div>
                    \${Number("${receiptData.diskonAmount}") > 0 ? \`<div style="display:flex;justify-content:space-between;color:red;"><span>Diskon (${receiptData.diskonPct}%):</span><strong>-Rp \${Number("${receiptData.diskonAmount}").toLocaleString('id-ID')}</strong></div>\` : ''}
                    <div style="display:flex;justify-content:space-between;"><span>Ongkir:</span><strong>Rp \${Number("${receiptData.ongkir}").toLocaleString('id-ID')}</strong></div>
                    <div style="display:flex;justify-content:space-between;"><span>Biaya Tambahan:</span><strong>Rp \${Number("${receiptData.tambahan}").toLocaleString('id-ID')}</strong></div>
                    <div style="border-top:1px solid #111;margin:6px 0;"></div>
                    <div style="display:flex;justify-content:space-between;font-size:14px;font-weight:800;"><span>TOTAL:</span><span>Rp \${Number("${receiptData.total}").toLocaleString('id-ID')}</span></div>
                    <div style="margin-top:6px;">Metode: <strong>\${"${receiptData.metode}" === "DP" ? "DP (Uang Muka)" : "${receiptData.metode}"}</strong></div>
                    \${"${receiptData.metode}" === "Belum Dibayar"
                        ? \`<div style="margin-top:6px;padding:6px;background:#fff9eb;border:1px solid #fde68a;text-align:center;">Bayar saat barang diambil</div>\`
                        : \`
                      <div style="display:flex;justify-content:space-between;margin-top:3px;"><span>Uang Masuk:</span><strong>Rp \${Number("${receiptData.uangDiterima}").toLocaleString('id-ID')}</strong></div>
                      <div style="display:flex;justify-content:space-between;font-weight:700;\${Number("${receiptData.change}") >= 0 ? 'color:green' : 'color:red'}">
                        <span>\${"${receiptData.metode}" === "DP" ? "Sisa Tagihan:" : "Kembalian:"}</span>
                        <span>Rp \${Math.abs(Number("${receiptData.change}")).toLocaleString('id-ID')}</span>
                      </div>
                    \`}
                  </div>
                  <div style="text-align:center;margin-top:20px;padding-top:10px;border-top:2px dashed #ddd;font-size:9px;color:#777;">
                    <p style="margin:2px 0;">Terima kasih atas kepercayaan Anda</p>
                    <p style="margin:2px 0;font-weight:600;text-transform:uppercase;">· ${storeNameState} ·</p>
                    <p style="margin:2px 0;">${storeAlamatState}</p>
                    ${storeKontakState ? `<p style="margin:2px 0;font-weight:500;">${storeKontakState}</p>` : ''}
                  </div>
                </div>
              \`;
              window.onload = function() {
                window.print();
              };
            </script>
          </body>
        </html>
      `;

      const printWindow = window.open('', '_blank', 'width=500,height=750');
      if (printWindow) {
        printWindow.document.write(receiptHTMLString);
        printWindow.document.close();
        triggerToast('Membuka dialog pencetakan nota...', 'success');
      } else {
        triggerToast('Gagal membuka dialog cetak (pembatas popup aktif)', 'error');
      }
    } catch (e: any) {
      console.error('Error printing receipt:', e);
      triggerToast('Gagal mencetak nota: ' + e.message, 'error');
    }
  };

  const downloadNotaJPGOfRow = async (row: any) => {
    try {
      const itemsRaw = getItems(row);
      let parsedItems: any[] = [];
      if (itemsRaw) {
        const trimmed = itemsRaw.trim();
        if (trimmed.startsWith('[')) {
          parsedItems = JSON.parse(trimmed);
        }
      }

      const receiptData = {
        noTransaksi: getNoTransaksi(row),
        tanggal: getTanggal(row),
        jam: getWaktu(row) || '',
        nama: getNama(row) || 'Common Customer',
        alamat: getAlamat(row) || 'Alamat Toko / Ambil Sendiri',
        kontak: getKontak(row) || '-',
        estimasi: getEstimasi(row) || '',
        items: parsedItems,
        subtotal: Number(getSubtotalVal(row) || 0),
        diskonPct: Number(getDiskonPctVal(row) || 0),
        diskonAmount: Number(getDiskonAmountVal(row) || 0),
        ongkir: Number(getOngkirVal(row) || 0),
        tambahan: Number(getTambahanVal(row) || 0),
        total: Number(getTotalVal(row) || 0),
        uangDiterima: Number(getUangDiterimaVal(row) || 0),
        change: Number(getChangeVal(row) || 0),
        metode: getMetode(row) || 'Tunai',
      };

      const result = await executeCaptureOfData(receiptData);
      if (!result) {
        triggerToast('Gagal memproses nota!', 'error');
        return;
      }
      const { blob, filename } = result;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      triggerToast('Nota sukses diunduh sebagai gambar!', 'success');
    } catch (err: any) {
      console.error('Error downloading row JPG:', err);
      triggerToast('Gagal memproses unduhan gambar: ' + err.message, 'error');
    }
  };

  // Fetch report on tab switch
  useEffect(() => {
    if (activeTab === 'reports') {
      fetchGoogleSheetReports();
    }
  }, [activeTab]);

  const parseCurrency = (val: any): number => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    const cleaned = String(val).replace(/[^0-9]/g, '');
    return parseInt(cleaned, 10) || 0;
  };

  // Smart column value resolver with priority: Exact case-insensitive match > Fallback keywords
  const getSheetColValue = (row: any, columnName: string, fallbackKeywords: string[] = []): string => {
    if (!row) return '';
    const lowerCol = columnName.toLowerCase();
    const keys = Object.keys(row);
    
    // 1. Exact case-insensitive check
    const exactKey = keys.find(k => k.toLowerCase() === lowerCol);
    if (exactKey) {
      return String(row[exactKey]);
    }
    
    // 2. Extra word match checks with underscores (e.g. _total)
    const underscoreKey = keys.find(k => {
      const lk = k.toLowerCase();
      return lk === `_${lowerCol}` || lk === `${lowerCol}_` || lk === `_${lowerCol}_`;
    });
    if (underscoreKey) {
      return String(row[underscoreKey]);
    }

    // 3. Fallback keywords checking, but explicitly safeguarding 'subtotal' matching 'total'
    for (const kw of fallbackKeywords) {
      const lowerKw = kw.toLowerCase();
      const matchedKey = keys.find(k => {
        const lk = k.toLowerCase();
        // Skip matching 'subtotal' if the keyword we look for is 'total'
        if (lowerKw === 'total' && lk.includes('subtotal')) {
          return false;
        }
        return lk.includes(lowerKw);
      });
      if (matchedKey) return String(row[matchedKey]);
    }

    return '';
  };

  // Dedicated Google Sheet column getters
  const getNoTransaksi = (row: any) => getSheetColValue(row, 'noTransaksi', ['transaksi', 'invoice', 'id_pesanan', 'no']);
  const getTanggal = (row: any) => getSheetColValue(row, 'tanggal', ['date', 'tgl']);
  const getNama = (row: any) => getSheetColValue(row, 'nama', ['pelanggan', 'customer']);
  const getAlamat = (row: any) => getSheetColValue(row, 'alamat');
  const getKontak = (row: any) => getSheetColValue(row, 'kontak');
  const getEstimasi = (row: any) => getSheetColValue(row, 'estimasi');
  const getItems = (row: any) => getSheetColValue(row, 'items', ['item', 'produk', 'barang']);
  const getSubtotalVal = (row: any) => getSheetColValue(row, 'subtotal');
  const getDiskonPctVal = (row: any) => getSheetColValue(row, 'diskonPct', ['diskonpct']);
  const getDiskonAmountVal = (row: any) => getSheetColValue(row, 'diskonAmount', ['diskonamount']);
  const getOngkirVal = (row: any) => getSheetColValue(row, 'ongkir');
  const getTambahanVal = (row: any) => getSheetColValue(row, 'tambahan');
  const getTotalVal = (row: any) => getSheetColValue(row, 'total');
  const getUangDiterimaVal = (row: any) => getSheetColValue(row, 'uangDiterima', ['uangditerima']);
  const getChangeVal = (row: any) => getSheetColValue(row, 'change');
  const getMetode = (row: any) => getSheetColValue(row, 'metode', ['pembayaran', 'payment']);
  const getWaktu = (row: any) => getSheetColValue(row, 'waktu', ['timestamp']);
  const getStatus = (row: any) => getSheetColValue(row, 'status') || 'Sedang Proses';

  // Format JSON array or string of list of items cleanly
  const formatItemsList = (itemsRaw: string): string => {
    if (!itemsRaw) return '';
    try {
      const trimmed = itemsRaw.trim();
      if (trimmed.startsWith('[')) {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map((it: any) => `${it.nama || it.name || ''} (${it.qty || 1}x)`).join(', ');
        }
      }
    } catch (e) {
      // Just return raw if fail
    }
    return itemsRaw;
  };

  // Parse Indonesian and English dates to absolute numbers for sorting
  const parseDateToComparable = (dateStr: string): number => {
    try {
      if (!dateStr || dateStr === 'Unknown') return 0;
      const monthsMap: Record<string, number> = {
        jan: 1, januari: 1, january: 1,
        feb: 2, februari: 2, february: 2,
        mar: 3, maret: 3, march: 3,
        apr: 4, april: 4, ifor: 4,
        mei: 5, may: 5,
        jun: 6, juni: 6, june: 6,
        jul: 7, juli: 7, july: 7,
        agu: 8, agustus: 8, august: 8, ags: 8,
        sep: 9, september: 9,
        okt: 10, oktober: 10, october: 10,
        nov: 11, november: 11,
        des: 12, desember: 12, december: 12
      };

      const parts = dateStr.trim().split(/\s+/);
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10) || 1;
        const monthStr = parts[1].toLowerCase().replace(/[^a-z]/g, '');
        const month = monthsMap[monthStr] || 1;
        const year = parseInt(parts[2], 10) || 2026;
        return year * 10000 + month * 100 + day;
      }

      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
      }
    } catch (e) {
      // Ignore
    }
    return 0;
  };

  // Calculation of sheet reports statistics
  const getReportsStats = () => {
    let totalSales = 0;
    let totalModal = 0;
    const transactionCount = sheetRows.length;
    const paymentMethodsMap: Record<string, number> = {};
    const dateSalesMap: Record<string, number> = {};
    const dateModalMap: Record<string, number> = {};
    const productSalesMap: Record<string, { name: string; count: number; revenue: number; modal: number; profit: number }> = {};

    sheetRows.forEach((row) => {
      const totalStr = getTotalVal(row);
      const totalNum = parseCurrency(totalStr);
      totalSales += totalNum;

      const methodStr = getMetode(row) || 'Tunai';
      paymentMethodsMap[methodStr] = (paymentMethodsMap[methodStr] || 0) + 1;

      const dateStr = getTanggal(row) || 'Unknown';
      dateSalesMap[dateStr] = (dateSalesMap[dateStr] || 0) + totalNum;

      // Hubungkan data item / produk dari list JSON untuk menghitung yang terlaris dan modalnya
      const itemsRaw = getItems(row);
      let rowModal = 0;
      if (itemsRaw) {
        try {
          const trimmed = itemsRaw.trim();
          if (trimmed.startsWith('[')) {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
              parsed.forEach((it: any) => {
                const pName = String(it.nama || it.name || '').trim();
                if (pName) {
                  const q = Number(it.qty) || 1;
                  const h = Number(it.harga || it.price) || 0;
                  
                  // Look up cost price: from item JSON first, otherwise from current active catalog
                  let singleCost = Number(it.hargaPokok) || 0;
                  if (!singleCost) {
                    const matchedP = products.find(prod => String(prod.nama).toLowerCase() === pName.toLowerCase());
                    singleCost = matchedP && matchedP.hargaPokok ? matchedP.hargaPokok : 0;
                  }
                  
                  const itemModal = singleCost * q;
                  rowModal += itemModal;

                  if (!productSalesMap[pName]) {
                    productSalesMap[pName] = { name: pName, count: 0, revenue: 0, modal: 0, profit: 0 };
                  }
                  productSalesMap[pName].count += q;
                  productSalesMap[pName].revenue += (h * q);
                  productSalesMap[pName].modal += itemModal;
                  productSalesMap[pName].profit += ((h - singleCost) * q);
                }
              });
            }
          }
        } catch (e) {
          // Gagal uraikan JSON, abaikan
        }
      }
      totalModal += rowModal;
      dateModalMap[dateStr] = (dateModalMap[dateStr] || 0) + rowModal;
    });

    const totalProfit = totalSales - totalModal;
    const averageOrder = transactionCount > 0 ? Math.round(totalSales / transactionCount) : 0;

    const paymentStats = Object.keys(paymentMethodsMap).map((method) => ({
      method,
      count: paymentMethodsMap[method],
    })).sort((a, b) => b.count - a.count);

    const productStats = Object.keys(productSalesMap).map((name) => ({
      name,
      count: productSalesMap[name].count,
      revenue: productSalesMap[name].revenue,
      modal: productSalesMap[name].modal,
      profit: productSalesMap[name].profit,
    })).sort((a, b) => b.count - a.count).slice(0, 10);

    const dailyTrends = Object.keys(dateSalesMap).map((date) => {
      const sales = dateSalesMap[date];
      const modal = dateModalMap[date] || 0;
      return {
        date,
        sales,
        modal,
        profit: sales - modal,
      };
    }).sort((a, b) => {
      return parseDateToComparable(b.date) - parseDateToComparable(a.date);
    }).slice(0, 10);

    return {
      totalSales,
      totalModal,
      totalProfit,
      transactionCount,
      averageOrder,
      paymentStats,
      productStats,
      dailyTrends,
    };
  };

  const stats = getReportsStats();

  // Reverse so newest entries display first, then filter by search query
  const filteredSheetRows = [...sheetRows].reverse().filter((row) => {
    const q = reportsSearchQuery.toLowerCase();
    if (!q) return true;
    return Object.values(row).some((val) => 
      String(val).toLowerCase().includes(q)
    );
  });

  return (
    <div className={`min-h-screen flex flex-col bg-panel-bg text-slate-800 font-sans selection:bg-accent/25 selection:text-slate-900 ${isDarkMode ? 'dark' : ''}`}>
      {/* HEADER SECTION */}
      <header className="bg-gradient-to-br from-primary to-secondary text-white shadow-md sticky top-0 z-40 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {storeLogoState && storeLogoState !== 'ts.png' && storeLogoState.startsWith('data:') ? (
              <img
                src={storeLogoState}
                alt="Logo"
                className="w-10 h-10 rounded-full object-cover shadow-md border border-white/10 bg-white"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center font-bold text-lg font-display tracking-tight shadow-md">
                {storeNameState.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="font-display font-bold text-lg md:text-xl tracking-wide leading-none select-none text-transparent bg-clip-text bg-gradient-to-r from-white via-accent-light to-accent uppercase">
                {storeNameState}
              </h1>
              <span className="text-[10px] text-slate-300 tracking-wider uppercase font-semibold block mt-1 select-none opacity-85 text-ellipsis overflow-hidden max-w-[150px] md:max-w-none whitespace-nowrap">
                {storeSloganState}
              </span>
            </div>
          </div>

          {/* Navigation Tabs (Desktop only) */}
          <div className="hidden md:flex items-center gap-1 bg-white/10 p-1 rounded-full border border-white/5 backdrop-blur-xs text-xs">
            <button
              onClick={() => setActiveTab('pos')}
              className={`flex items-center gap-1 md:gap-1.5 px-3.5 py-1.5 rounded-full font-semibold transition-all duration-200 cursor-pointer ${
                activeTab === 'pos'
                  ? 'bg-accent text-white shadow-xs'
                  : 'text-slate-205 hover:text-white hover:bg-white/5'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Kasir</span>
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-1 md:gap-1.5 px-3.5 py-1.5 rounded-full font-semibold transition-all duration-200 cursor-pointer ${
                activeTab === 'products'
                  ? 'bg-accent text-white shadow-xs'
                  : 'text-slate-205 hover:text-white hover:bg-white/5'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Produk &amp; Stok</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('reports');
                fetchGoogleSheetReports(); // Auto sync report data on click!
              }}
              className={`flex items-center gap-1 md:gap-1.5 px-3.5 py-1.5 rounded-full font-semibold transition-all duration-200 cursor-pointer ${
                activeTab === 'reports'
                  ? 'bg-accent text-white shadow-xs'
                  : 'text-slate-205 hover:text-white hover:bg-white/5'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Laporan</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-1 md:gap-1.5 px-3.5 py-1.5 rounded-full font-semibold transition-all duration-200 cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-accent text-white shadow-xs'
                  : 'text-slate-205 hover:text-white hover:bg-white/5'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Pengaturan</span>
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/5 shadow-sm text-slate-200">
              <Clock className="w-3.5 h-3.5 text-accent-light" />
              <span className="font-mono font-medium tracking-wide">{currentTime || '--:--:--'}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/5 shadow-sm text-slate-200">
              <Calendar className="w-3.5 h-3.5 text-accent-light" />
              <span>{currentDate || 'Tanggal'}</span>
            </div>
          </div>

          {/* Mobile Hamburger Burger Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 mr-1 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white cursor-pointer flex items-center justify-center border border-white/5"
              title="Menu Navigasi"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 text-accent-light" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE NAV DROPDOWN PANEL */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white shadow-xl sticky top-[64px] z-50 select-none animate-fadeIn">
          <div className="p-3 space-y-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
            <button
              onClick={() => {
                setActiveTab('pos');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-xs transition-all duration-150 cursor-pointer ${
                activeTab === 'pos'
                  ? 'bg-accent text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ShoppingCart className="w-4 h-4 text-accent" />
              <span>Kasir (POS)</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('products');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-xs transition-all duration-150 cursor-pointer ${
                activeTab === 'products'
                  ? 'bg-accent text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-accent" />
              <span>Produk &amp; Stok</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('reports');
                fetchGoogleSheetReports();
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-xs transition-all duration-150 cursor-pointer ${
                activeTab === 'reports'
                  ? 'bg-accent text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-accent" />
              <span>Laporan Transaksi</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('settings');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-xs transition-all duration-150 cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-accent text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4 text-accent" />
              <span>Pengaturan Toko</span>
            </button>
          </div>
        </div>
      )}

      {showInstallBanner && (
        <div className="max-w-7xl w-full mx-auto px-4 md:px-6 pt-4 animate-fadeIn">
          <div className="bg-gradient-to-r from-primary to-secondary text-white rounded-2xl p-5 border border-white/10 shadow-lg relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-5">
            {/* Ambient glows */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/15 rounded-full filter blur-3xl pointer-events-none -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-sky-500/10 rounded-full filter blur-2xl pointer-events-none -ml-16 -mb-16"></div>

            <div className="flex items-center gap-4.5 z-10">
              <div className="flex-shrink-0 w-14 h-14 bg-white/10 rounded-xl p-1 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-md">
                <img
                  src="/logo_rizquna.png"
                  alt="Rizquna Logo"
                  className="w-12 h-12 rounded-lg object-cover"
                  onError={(e) => {
                    // Fallback to stylized text if it fails
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <div>
                <h3 className="font-display font-bold text-base md:text-lg tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-accent-light to-accent">
                  Instal Aplikasi Rizquna - Kasir Pintar
                </h3>
                <p className="text-xs text-slate-205 mt-1 max-w-2xl leading-relaxed">
                  Akses instan langsung dari layar utama HP atau komputer Anda. Aplikasi berjalan lebih cepat, aman, dan mendukung pengerjaan transaksi secara offline.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto z-10 justify-end">
              <button
                type="button"
                onClick={handleInstallPWA}
                className="w-full md:w-auto px-5 py-2.5 bg-accent hover:bg-accent-hover text-slate-950 text-xs font-bold rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Instal Aplikasi</span>
              </button>
              <button
                type="button"
                onClick={handleDismissInstallBanner}
                className="px-3.5 py-2.5 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold rounded-xl transition-all border border-white/5 flex items-center justify-center gap-1.5 cursor-pointer"
                title="Sembunyikan pesan ini"
              >
                <X className="w-4 h-4" />
                <span className="md:hidden">Sembunyikan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CORE FRAME CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 overflow-hidden">
        {activeTab === 'pos' && (
          <div className="space-y-4 w-full">
            {editingTransactionId && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between shadow-sm animate-fadeIn">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-xs text-amber-800">
                    Mode Edit: Anda sedang mengubah pesanan <strong className="font-bold">{editingTransactionId}</strong>.
                  </span>
                </div>
                <button
                  onClick={() => {
                    setEditingTransactionId(null);
                    resetAll();
                    triggerToast('Edit pesanan dibatalkan.', 'info');
                  }}
                  className="px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                >
                  Batal Edit & Reset
                </button>
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN: PRODUCTS CATALOG (5/12 widths) */}
        <section className="lg:col-span-5 flex flex-col bg-white rounded-2xl border border-slate-250 shadow-sm overflow-hidden min-h-[500px] max-h-[850px]">
          {/* CATALOG HEADER WITH FILTERS */}
          <div className="p-4 md:p-5 border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-slate-900 tracking-tight text-base flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary" />
                Katalog Produk Kami
              </h3>
              <span className="text-xs text-slate-400 font-mono font-semibold">
                {filteredProducts.length} Item
              </span>
            </div>

            {/* SEARCHING */}
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama, kode/ID, atau varian..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-2.5 pl-10 pr-18 bg-slate-50 border border-slate-200 rounded-full text-xs transition-all focus:outline-none focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/15 placeholder:text-slate-400 text-slate-700 font-medium"
              />
              <div className="absolute right-2 flex items-center gap-0.5">
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200/50 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => startScanner('posSearch')}
                  title="Scan Barcode Kode Barang"
                  className="p-1.5 text-primary hover:text-secondary hover:bg-primary/10 rounded-full transition-all cursor-pointer flex items-center justify-center"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* CATEGORY SELECTOR CHIPS */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none scroll-smooth">
              {[{ key: 'all', label: 'Semua' }, ...Array.from(new Set(products.map(p => p.kategori).filter(Boolean))).map(cat => ({ key: cat, label: cat }))].map((category) => (
                <button
                  key={category.key}
                  onClick={() => setSelectedCategory(category.key)}
                  className={`text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-all duration-250 cursor-pointer whitespace-nowrap active:scale-95 ${
                    selectedCategory === category.key
                      ? 'bg-accent text-white border-accent shadow-sm font-bold'
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>

          {/* DYNAMIC PRODUCTS GRID (with scroll boundaries) */}
          <div className="flex-1 overflow-y-auto p-4 md:p-5 bg-slate-50/50">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-2 gap-3.5 animate-pulse">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white rounded-xl border border-slate-100 p-3 flex flex-col gap-3">
                    <div className="relative aspect-square w-full rounded-lg bg-slate-100" />
                    <div className="space-y-2">
                      <div className="h-3.5 bg-slate-150 rounded-sm w-3/4" />
                      <div className="h-2.5 bg-slate-100 rounded-sm w-1/2" />
                      <div className="flex justify-between items-center pt-2">
                        <div className="h-4 bg-slate-150 rounded-sm w-5/12" />
                        <div className="h-6 bg-slate-100 rounded-lg w-5/12" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-slate-400 text-sm p-4 text-center">
                <Search className="w-10 h-10 mb-2 opacity-30 text-slate-400" />
                <span className="font-semibold">Produk tidak ditemukan</span>
                <span className="text-xs text-slate-400">Coba ubah filter pencarian Anda</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-2 gap-3.5">
                {filteredProducts.map((p, idx) => (
                  <div
                     key={idx}
                     onClick={() => addToCart(p)}
                     className="group bg-white rounded-xl border border-slate-200 p-3 flex flex-col cursor-pointer transition-all duration-300 hover:shadow-md hover:border-accent active:scale-95"
                  >
                    <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-slate-50 mb-3 border border-slate-100">
                      <span className="absolute top-1.5 left-1.5 text-[9px] bg-slate-950/80 text-white font-bold tracking-wider uppercase px-2 py-0.5 rounded-full backdrop-blur-sm z-10 font-sans shadow-sm select-none">
                        {p.kategori}
                      </span>
                      <span className={`absolute top-1.5 right-1.5 text-[9px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm z-10 font-sans shadow-sm select-none ${
                        p.stok !== undefined && p.stok <= 0
                          ? 'bg-rose-600 text-white font-black'
                          : p.stok !== undefined && p.stok < 10
                          ? 'bg-amber-550 text-white font-black'
                          : 'bg-emerald-600/90 text-white'
                      }`}>
                        {p.stok !== undefined ? (p.stok <= 0 ? 'HABIS' : `Stok: ${p.stok}`) : 'Stok: 99+'}
                      </span>
                      <img
                        src={p.foto || 'https://images.unsplash.com/photo-1626331307374-ba220ae10793?auto=format&fit=crop&q=80&w=300'}
                        alt={p.nama}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          // Clean fallback for broken image URLs
                          (e.currentTarget as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1626331307374-ba220ae10793?auto=format&fit=crop&q=80&w=300';
                        }}
                        className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${p.stok !== undefined && p.stok <= 0 ? 'grayscale opacity-50' : ''}`}
                      />
                    </div>
                    <div className="flex-1 flex flex-col">
                      <h4 className="font-bold text-slate-800 text-xs md:text-sm group-hover:text-accent transition-colors leading-tight line-clamp-2">
                        {p.nama}
                      </h4>
                      {p.id && (
                        <span className="text-[9px] font-mono text-slate-400 bg-slate-105 px-1 py-0.5 rounded self-start mt-1">
                          Kode: {p.id}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 font-medium mt-1 inline-flex items-center gap-1 select-none">
                        📐 Varian: {p.ukuran}
                      </span>
                      <div className="mt-auto pt-2 flex items-center justify-between">
                        <span className="font-extrabold text-xs md:text-sm text-emerald-600">
                          Rp {p.harga.toLocaleString('id-ID')}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md transition-colors ${
                          p.stok !== undefined && p.stok <= 0
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white'
                        }`}>
                          {p.stok !== undefined && p.stok <= 0 ? 'Habis' : 'Tambah'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* MIDDLE COLUMN: BASKET CART LIST (3/12 widths) */}
        <section className="lg:col-span-3 flex flex-col bg-white rounded-2xl border border-slate-250 shadow-sm overflow-hidden min-h-[400px] max-h-[850px]">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10 shadow-3xs">
            <h3 className="font-display font-bold text-slate-900 tracking-tight text-sm flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-primary" />
              Keranjang Belanja
            </h3>
            <button
              onClick={clearCart}
              className="text-[11px] text-slate-400 hover:text-rose-600 font-semibold px-2.5 py-1 rounded-full border border-slate-205 hover:border-rose-200 hover:bg-rose-50/50 transition-colors"
            >
              Kosongkan
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/20">
            {cart.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-slate-400 text-xs gap-1.5 text-center p-4">
                <ShoppingCart className="w-8 h-8 opacity-20 text-slate-400" />
                <span className="font-semibold">Keranjang Kosong</span>
                <span className="text-slate-400 select-none">Klik produk sebelah kiri untuk menambahkan barang</span>
              </div>
            ) : (
              cart.map((item, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl border border-slate-200 p-3 space-y-2 text-xs relative hover:shadow-xs transition-shadow"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h5 className="font-extrabold text-slate-800 leading-tight">{item.nama}</h5>
                      <span className="text-[10px] text-slate-400 block mt-0.5 select-none font-medium">
                        Varian: {item.ukuran}
                      </span>
                    </div>
                    <button
                      onClick={() => removeCartItem(index)}
                      className="text-slate-300 hover:text-rose-600 hover:bg-slate-100/50 p-1 rounded-full transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* QTY TRIGGER & INDIVIDUAL PRICE */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    {/* BUTTON GROUP */}
                    <div className="inline-flex items-center border border-slate-200 rounded-lg overflow-hidden h-8">
                      <button
                        onClick={() => updateQty(index, item.qty - 1)}
                        className="px-2 bg-slate-50 text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors h-full"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => updateQty(index, parseInt(e.target.value))}
                        className="w-10 text-center font-bold text-slate-800 text-xs border-none focus:outline-none focus:ring-0 bg-white h-full"
                      />
                      <button
                        onClick={() => updateQty(index, item.qty + 1)}
                        className="px-2 bg-slate-50 text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors h-full"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block line-clamp-1">
                        @{item.harga.toLocaleString('id-ID')}
                      </span>
                      <strong className="text-emerald-600 text-[13px]">
                        Rp {(item.qty * item.harga).toLocaleString('id-ID')}
                      </strong>
                    </div>
                  </div>

                  {/* USER NOTE INSERTION */}
                  <input
                    type="text"
                    placeholder="Tambah catatan untuk item ini... (opsional)"
                    value={item.note}
                    onChange={(e) => {
                      const updated = [...cart];
                      updated[index].note = e.target.value;
                      setCart(updated);
                    }}
                    className="w-full text-[11px] px-2 py-1 bg-slate-50 border border-slate-150 rounded-md focus:outline-none focus:border-accent focus:bg-white text-slate-700 placeholder:text-slate-400 transition-all font-sans"
                  />
                </div>
              ))
            )}
          </div>
        </section>

        {/* RIGHT COLUMN: CASHIER WORKSPACE / FORM (4/12 widths) */}
        <section className="lg:col-span-4 bg-white rounded-2xl border border-slate-250 shadow-sm p-4 md:p-5 flex flex-col gap-4 overflow-y-auto min-h-[500px] max-h-[850px]">
          <h3 className="font-display font-bold text-slate-900 tracking-tight text-base flex items-center gap-2 border-b border-slate-100 pb-3">
            <Coins className="w-5 h-5 text-primary" />
            Detail Transaksi
          </h3>

          {/* CUSTOMER PROFILE FIELDS */}
          <div className="space-y-3.5">
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1 select-none">
                <User className="w-3 h-3 text-slate-400" /> Nama Pelanggan <span className="text-rose-500 font-bold ml-0.5 animate-pulse">*</span>
              </label>
              <input
                type="text"
                placeholder="Masukkan nama pelanggan..."
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="text-xs w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-accent focus:bg-white transition-all text-slate-700 font-sans"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1 select-none">
                <MapPin className="w-3 h-3 text-slate-400" /> Alamat Pengiriman
              </label>
              <textarea
                placeholder="Masukkan alamat lengkap..."
                rows={1.5}
                value={alamat}
                onChange={(e) => setAlamat(e.target.value)}
                className="text-xs w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-accent focus:bg-white transition-all text-slate-700 resize-none h-14 font-sans"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1 select-none">
                  <Phone className="w-3 h-3 text-slate-400" /> Kontak / HP
                </label>
                <input
                  type="text"
                  placeholder="No. HP / WA"
                  value={kontak}
                  onChange={(e) => setKontak(e.target.value)}
                  className="text-xs w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-accent focus:bg-white transition-all text-slate-700 font-sans"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1 select-none">
                  <CalendarDays className="w-3 h-3 text-slate-400" /> Estimasi PO
                </label>
                <input
                  type="date"
                  value={estimasi}
                  onChange={(e) => setEstimasi(e.target.value)}
                  className="text-xs w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-accent focus:bg-white transition-all text-slate-700 block-calendar font-sans"
                />
              </div>
            </div>

            {/* ADDTIONAL BILLING */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1 select-none">
                  <Truck className="w-3 h-3 text-slate-400" /> Ongkir
                </label>
                <input
                  type="number"
                  min="0"
                  value={ongkir || ''}
                  onChange={(e) => setOngkir(Math.max(0, parseInt(e.target.value) || 0))}
                  className="text-xs w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-accent focus:bg-white text-slate-700 font-sans"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1 select-none">
                  <Plus className="w-3 h-3 text-slate-400" /> Tambahan
                </label>
                <input
                  type="number"
                  min="0"
                  value={tambahan || ''}
                  onChange={(e) => setTambahan(Math.max(0, parseInt(e.target.value) || 0))}
                  className="text-xs w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-accent focus:bg-white text-slate-700 font-sans"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1 select-none">
                  <Percent className="w-3 h-3 text-slate-400" /> Diskon (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={diskon || ''}
                  onChange={(e) => setDiskon(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="text-xs w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-accent focus:bg-white text-slate-700 font-sans"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-dashed border-slate-200 my-1"></div>

          {/* NET PRICE LARGE DISPLAY BLOCK */}
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-4 rounded-xl flex flex-col items-center justify-center text-center shadow-xs">
            <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-widest select-none">
              Total Tagihan Pembayaran
            </span>
            <span className="text-2xl font-black font-display text-amber-900 dark:text-amber-450 mt-1">
              Rp {getTotal().toLocaleString('id-ID')}
            </span>
          </div>

          {/* INCOMING PAYMENT INPUTS */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 items-center">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1 select-none">
                  <CreditCard className="w-3 h-3 text-slate-400" /> Metode Bayar
                </label>
                <select
                  value={metode}
                  onChange={(e) => {
                    setMetode(e.target.value);
                    setUangDiterima(0);
                    setDpDiterima(0);
                  }}
                  className="text-xs w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-accent focus:bg-white transition-all text-slate-700 font-sans"
                >
                  <option value="Tunai">Tunai</option>
                  <option value="Transfer">Transfer</option>
                  <option value="QRIS">QRIS (Digital)</option>
                  <option value="Kartu Debit">Kartu Debit</option>
                  <option value="Kartu Kredit">Kartu Kredit</option>
                  <option value="DP">DP (Uang Muka)</option>
                  <option value="Belum Dibayar">Belum Dibayar</option>
                </select>
              </div>

              {metode !== 'Belum Dibayar' && (
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1 select-none">
                    <Coins className="w-3 h-3 text-slate-400" /> {metode === 'DP' ? 'Jumlah DP Diterima' : 'Uang Diterima'} <span className="text-rose-500 font-bold ml-0.5 animate-pulse">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Nilai uang received..."
                    value={metode === 'DP' ? dpDiterima || '' : uangDiterima || ''}
                    onChange={(e) => {
                      const v = Math.max(0, parseInt(e.target.value) || 0);
                      if (metode === 'DP') setDpDiterima(v);
                      else setUangDiterima(v);
                    }}
                    className="text-xs w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-accent focus:bg-white text-slate-700 font-sans"
                  />
                </div>
              )}
            </div>

            {/* REACTIVE CHANGE & STATUS TAGS DISPLAY */}
            {metode !== 'Belum Dibayar' && currentUangDiterima > 0 && (
              <div
                className={`py-2.5 px-3 border rounded-xl text-center font-bold text-xs flex items-center justify-center gap-2 transform transition-all duration-300 ${
                  netChangeOrDue >= 0
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-rose-50 border-rose-200 text-rose-700'
                }`}
              >
                {netChangeOrDue >= 0 ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>
                      {metode === 'DP' ? 'Sisa Tagihan Lunas (Kembalian Pas):' : 'Kembalian:'}{' '}
                      <b className="font-mono text-sm">Rp {netChangeOrDue.toLocaleString('id-ID')}</b>
                    </span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>
                      {metode === 'DP' ? 'Sisa Pembayaran Pre-Order:' : 'Kurang Berbayar:'}{' '}
                      <b className="font-mono text-sm">Rp {Math.abs(netChangeOrDue).toLocaleString('id-ID')}</b>
                    </span>
                  </>
                )}
              </div>
            )}

            {metode === 'Belum Dibayar' && (
              <div className="py-2.5 px-3 border border-indigo-100 bg-indigo-50/50 rounded-xl text-indigo-700 text-center font-semibold text-xs flex items-center justify-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-500" />
                <span>Pelunasan dilakukan saat pengambilan barang / pesanan selesai</span>
              </div>
            )}
          </div>

          <div className="space-y-2 mt-2">
            {/* ACTION CHECKOUT */}
            <button
              onClick={checkout}
              className="w-full py-3 bg-[#10b981] hover:bg-[#10b981]/90 text-white rounded-full text-xs md:text-sm font-bold shadow-md cursor-pointer tracking-wider transition-all uppercase flex items-center justify-center gap-2 active:scale-98"
            >
              <ShoppingCart className="w-4 h-4" />
              Selesaikan &amp; Cetak Nota
            </button>

            {/* ACCESSIBLE EXTRAS ROW */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={downloadNotaJPG}
                className="py-2.5 bg-white border-2 border-[#2563eb] hover:bg-slate-50 text-[#2563eb] font-bold text-xs rounded-full shadow-3xs cursor-pointer transition-colors flex items-center justify-center gap-1.5 active:scale-98"
              >
                <Download className="w-3.5 h-3.5" />
                Download JPG
              </button>
              <button
                onClick={shareNota}
                className="py-2.5 bg-white border-2 border-[#7c3aed] hover:bg-slate-50 text-[#7c3aed] font-bold text-xs rounded-full shadow-3xs cursor-pointer transition-colors flex items-center justify-center gap-1.5 active:scale-98"
              >
                <Share2 className="w-3.5 h-3.5" />
                Share WA/Nota
              </button>
            </div>

            {/* RESET BUTTON */}
            <button
              onClick={resetAll}
              className="w-full py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 font-semibold text-xs rounded-full cursor-pointer transition-colors flex items-center justify-center gap-1.5 active:scale-98"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Transaksi Baru
            </button>
          </div>
        </section>
        </div>
      </div>
    )}

        {activeTab === 'products' && (
          <div className="animate-fadeIn pb-12 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-display font-bold text-slate-900 tracking-tight text-lg flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-primary animate-pulse" />
                  Manajemen Produk &amp; Stok Gudang
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Tambahkan, edit, dan hapus rincian produk serta stok fisik langsung terpantul ke Google Sheets.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => loadProducts(false)}
                  disabled={loading}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-full flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer select-none"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  Segarkan Data
                </button>
                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setProdFormId('');
                    setProdFormNama('');
                    setProdFormUkuran('');
                    setProdFormKategori('Umum');
                    setProdFormHarga(0);
                    setProdFormHargaPokok(0);
                    setProdFormFoto('');
                    setProdFormStok(100);
                    setShowProductForm(true);
                  }}
                  className="py-2.5 px-5 bg-primary hover:bg-secondary text-white font-bold text-xs rounded-full flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer select-none"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah Produk Baru
                </button>
              </div>
            </div>

            {/* PRODUCT FORM CARD */}
            {showProductForm && (
              <div className="bg-slate-50 rounded-2xl border-2 border-primary/20 p-5 shadow-xs animate-fadeIn space-y-4">
                <div className="flex justify-between items-center pb-2 border-b">
                  <h4 className="font-display font-semibold text-slate-950 text-sm flex items-center gap-1.5">
                    {editingProduct ? 'Edit Data Produk' : 'Tambah Katalog Produk'}
                  </h4>
                  <button 
                    onClick={() => {
                      setShowProductForm(false);
                      setEditingProduct(null);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-650 rounded-full hover:bg-slate-150 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {/* Kode Barang (ID) */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider block flex justify-between items-center">
                      <span>Kode Barang / ID</span>
                      <span className="text-[9px] text-slate-400 font-normal">Kosongkan untuk otomatis</span>
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        placeholder="Contoh: PRD-A89B, 8923180..."
                        value={prodFormId}
                        onChange={(e) => setProdFormId(e.target.value)}
                        className="w-full text-xs p-2.5 pr-10 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-accent font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => startScanner('productId')}
                        title="Scan Barcode dengan Kamera"
                        className="absolute right-2 flex items-center justify-center p-1.5 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Nama */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider block">Nama Produk</label>
                    <input
                      type="text"
                      placeholder="Contoh: Replika Besar, Kosan Bulat..."
                      value={prodFormNama}
                      onChange={(e) => setProdFormNama(e.target.value)}
                      className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-accent"
                    />
                  </div>
                  {/* Ukuran */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider block">Spesifikasi Varian</label>
                    <input
                      type="text"
                      placeholder="Contoh: 40x40, Set, 47x42..."
                      value={prodFormUkuran}
                      onChange={(e) => setProdFormUkuran(e.target.value)}
                      className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-accent"
                    />
                  </div>
                  {/* Kategori */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider block">Kategori</label>
                    <input
                      type="text"
                      list="category-suggestions"
                      placeholder="Contoh: Makanan, Minuman, Pakaian, dll..."
                      value={prodFormKategori}
                      onChange={(e) => setProdFormKategori(e.target.value)}
                      className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-accent font-semibold text-slate-800"
                    />
                    <datalist id="category-suggestions">
                      {Array.from(new Set([
                        ...products.map(p => p.kategori).filter(Boolean),
                        'Makanan', 'Minuman', 'Pakaian', 'Aksesoris', 'Elektronik', 'Jasa'
                      ])).map((cat, i) => (
                        <option key={i} value={cat} />
                      ))}
                    </datalist>
                  </div>
                  {/* Harga Pokok */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider block">Harga Pokok / Modal (Rp)</label>
                    <input
                      type="number"
                      placeholder="Contoh: 75000"
                      value={prodFormHargaPokok || ''}
                      onChange={(e) => setProdFormHargaPokok(Number(e.target.value))}
                      className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-accent"
                    />
                  </div>
                  {/* Harga */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider block">Harga Jual (Rp)</label>
                    <input
                      type="number"
                      placeholder="Contoh: 90000"
                      value={prodFormHarga || ''}
                      onChange={(e) => setProdFormHarga(Number(e.target.value))}
                      className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-accent"
                    />
                  </div>
                  {/* Stok */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider block">Stok Gudang (Pcs)</label>
                    <input
                      type="number"
                      placeholder="Contoh: 50"
                      value={prodFormStok !== undefined ? prodFormStok : ''}
                      onChange={(e) => setProdFormStok(Number(e.target.value))}
                      className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-accent"
                    />
                  </div>
                  {/* Link Foto */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider block">URL Tautan Gambar</label>
                    <input
                      type="text"
                      placeholder="Contoh: https://drive.google.com/uc?export=view&id=..."
                      value={prodFormFoto}
                      onChange={(e) => setProdFormFoto(e.target.value)}
                      className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t">
                  <button
                    onClick={() => {
                      setShowProductForm(false);
                      setEditingProduct(null);
                    }}
                    className="py-1.5 px-4 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-500 hover:bg-slate-50 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    onClick={async () => {
                      const namaVal = String(prodFormNama || '').trim();
                      const ukuranVal = String(prodFormUkuran || '').trim();
                      if (!namaVal || !ukuranVal) {
                        triggerToast('Nama produk & varian wajib diisi!', 'warning');
                        return;
                      }
                      const payload = {
                        nama: namaVal,
                        ukuran: ukuranVal,
                        kategori: String(prodFormKategori || ''),
                        harga: Number(prodFormHarga),
                        hargaPokok: Number(prodFormHargaPokok),
                        foto: prodFormFoto || 'https://images.unsplash.com/photo-1582139329536-e7284fece509?q=80&w=300',
                        stok: Number(prodFormStok),
                      };

                      let success = false;
                      if (editingProduct) {
                        success = await editProductInSheet({
                          ...editingProduct,
                          id: prodFormId.trim() || editingProduct.id,
                          ...payload
                        });
                      } else {
                        success = await addProductToSheet({
                          id: prodFormId.trim() || undefined,
                          ...payload
                        });
                      }

                      if (success) {
                        setShowProductForm(false);
                        setEditingProduct(null);
                      }
                    }}
                    className="py-1.5 px-5 bg-primary text-white font-bold rounded-full text-xs hover:bg-secondary active:scale-95 transition-all cursor-pointer"
                  >
                    {editingProduct ? 'Perbarui Produk' : 'Simpan Produk'}
                  </button>
                </div>
              </div>
            )}

            {/* DATA TABLE */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 bg-slate-50/50 border-b flex justify-between items-center">
                <span className="font-semibold text-slate-800 text-xs">Total Data Katalog: {products.length} Items</span>
                {(!gasUrlState || gasUrlState.trim() === '' || gasUrlState.includes('PASTE_YOUR_URL')) && (
                  <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-100 font-bold px-2 py-0.5 rounded-full uppercase">
                    Model Offline / Lokal
                  </span>
                )}
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/50 text-slate-500 font-bold border-b select-none whitespace-nowrap">
                      <th className="p-3 text-center w-14">Preview</th>
                      <th className="p-3">Nama Produk</th>
                      <th className="p-3">Kategori</th>
                      <th className="p-3">Varian</th>
                      <th className="p-3 text-right">Harga Jual</th>
                      <th className="p-3 text-right">Harga Pokok (Modal)</th>
                      <th className="p-3 text-center">Stok Fisik</th>
                      <th className="p-3 text-center">Aksi Operasi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400">
                          Tidak ada produk di sini. Daftarkan produk baru atau beralih ke Mode Excel.
                        </td>
                      </tr>
                    ) : (
                      products.map((p, index) => (
                        <tr key={index} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 border-b text-slate-700 dark:text-slate-200">
                          <td className="p-3 text-center">
                            <img
                              src={p.foto || 'https://images.unsplash.com/photo-1582139329536-e7284fece509?q=80&w=300'}
                              alt={p.nama}
                              className="w-9 h-9 object-cover rounded-lg border inline bg-slate-50"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1582139329536-e7284fece509?q=80&w=300';
                              }}
                            />
                          </td>
                          <td className="p-3 font-semibold text-slate-900">
                            <div>{p.nama}</div>
                            {p.id && (
                              <p className="text-[10px] text-slate-400 font-mono font-medium mt-0.5 select-all">
                                ID: {p.id}
                              </p>
                            )}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border text-[10px] font-sans font-medium">
                              {p.kategori}
                            </span>
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-500">{p.ukuran}</td>
                          <td className="p-3 text-right font-bold text-emerald-500 font-mono">
                            Rp {p.harga.toLocaleString('id-ID')}
                          </td>
                          <td className="p-3 text-right font-medium text-slate-550 font-mono">
                            Rp {(p.hargaPokok || 0).toLocaleString('id-ID')}
                          </td>
                          <td className="p-3 text-center font-bold">
                            <span className={`px-2.5 py-1 rounded-md text-[11px] font-mono leading-none inline-block ${
                              p.stok !== undefined && p.stok <= 0
                                ? 'bg-rose-50 text-rose-700 border border-rose-100'
                                : p.stok !== undefined && p.stok < 10
                                ? 'bg-amber-50 text-amber-700 border border-amber-100 animate-pulse'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            }`}>
                              {p.stok !== undefined ? `${p.stok} Pcs` : '100 Pcs'}
                            </span>
                          </td>
                          <td className="p-3 text-center space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => {
                                setEditingProduct(p);
                                setProdFormId(p.id !== undefined && p.id !== null ? String(p.id) : '');
                                setProdFormNama(p.nama !== undefined && p.nama !== null ? String(p.nama) : '');
                                setProdFormUkuran(p.ukuran !== undefined && p.ukuran !== null ? String(p.ukuran) : '');
                                setProdFormKategori(p.kategori !== undefined && p.kategori !== null ? String(p.kategori) : 'Umum');
                                setProdFormHarga(p.harga !== undefined && p.harga !== null ? Number(p.harga) : 0);
                                setProdFormHargaPokok(p.hargaPokok !== undefined && p.hargaPokok !== null ? Number(p.hargaPokok) : 0);
                                setProdFormFoto(p.foto !== undefined && p.foto !== null ? String(p.foto) : '');
                                setProdFormStok(p.stok !== undefined && p.stok !== null ? Number(p.stok) : 100);
                                setShowProductForm(true);
                              }}
                              className="px-2.5 py-1 rounded-full border border-amber-250 text-amber-750 bg-amber-50 hover:bg-amber-100 cursor-pointer inline-flex items-center text-[10px] font-bold active:scale-95 transition-all"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteProductFromSheet(p)}
                              className="px-2.5 py-1 rounded-full border border-rose-250 text-rose-750 bg-rose-50 hover:bg-rose-100 cursor-pointer inline-flex items-center text-[10px] font-bold active:scale-95 transition-all"
                            >
                              Hapus
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="animate-fadeIn pb-12 space-y-6">
            {/* Header / Actions Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-display font-bold text-slate-900 tracking-tight text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Laporan &amp; Analisis Real-Time Google Sheets
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Data disinkronisasikan langsung dari tautan lembar sebar publik Google Sheets Anda.
                </p>
              </div>
              <button
                onClick={fetchGoogleSheetReports}
                disabled={reportsLoading}
                className="py-2.5 px-5 bg-primary hover:bg-secondary text-white font-bold text-xs rounded-full flex items-center justify-center gap-2 active:scale-95 transition-all self-start md:self-auto cursor-pointer"
              >
                {reportsLoading ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <RotateCcw className="w-3.5 h-3.5" />
                )}
                Sinkronkan Laporan
              </button>
            </div>

            {reportsLoading && sheetRows.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm gap-2 bg-white rounded-2xl border border-slate-200 shadow-3xs">
                <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                <span>Mengunduh data Google Sheet...</span>
              </div>
            ) : reportsError && sheetRows.length === 0 ? (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-6 text-center space-y-3">
                <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto animate-bounce" />
                <h4 className="font-bold text-sm">Gagal Sinkronisasi</h4>
                <p className="text-xs max-w-md mx-auto">{reportsError}</p>
                <div className="text-[11px] text-slate-500">
                  Pastikan tautan Google Sheet Anda sudah diatur ke Publik (File &gt; Bagikan &gt; Siapa saja dapat melihat dengan link).
                </div>
              </div>
            ) : (
              <>
                {/* METRICS Bento Grid Block */}
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                  {/* Total Sales (Omset) */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-3xs flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shadow-xs flex-shrink-0">
                      <Banknote className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block select-none">Omset Jual</span>
                      <span className="text-sm font-black font-display text-slate-900 leading-tight block">
                        Rp {stats.totalSales.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  {/* Total Modal (Capital) */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-3xs flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shadow-xs flex-shrink-0">
                      <Briefcase className="w-5 h-5 text-slate-500" />
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block select-none">Total Modal</span>
                      <span className="text-sm font-black font-display text-slate-900 leading-tight block">
                        Rp {stats.totalModal.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  {/* Keuntungan Bersih (Profit) */}
                  <div className="bg-gradient-to-br from-emerald-500 to-teal-650 rounded-2xl p-4 shadow-3xs flex items-center gap-3 text-white border border-emerald-600">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shadow-xs flex-shrink-0">
                      <Coins className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-white/85 uppercase tracking-widest block select-none">Untung Bersih</span>
                      <span className="text-sm font-black font-display text-white leading-tight block">
                        Rp {stats.totalProfit.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  {/* Transaction Counts */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-3xs flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shadow-xs flex-shrink-0">
                      <Package className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block select-none">Transaksi</span>
                      <span className="text-sm font-black font-display text-slate-900 leading-tight block">
                        {stats.transactionCount} Trans
                      </span>
                    </div>
                  </div>

                  {/* Avg Order Values */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-3xs flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shadow-xs flex-shrink-0">
                      <TrendingUp className="w-5 h-5 text-amber-650" />
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block select-none">Rerata Nota</span>
                      <span className="text-sm font-black font-display text-slate-900 leading-tight block">
                        Rp {stats.averageOrder.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  {/* Produk Terlaris Stats Card */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-3xs flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shadow-xs flex-shrink-0">
                      <Award className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block select-none">Bestseller</span>
                      <span className="text-xs font-black font-display text-slate-900 truncate block" title={stats.productStats[0]?.name}>
                        {stats.productStats[0]?.name || '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* CHARTS CONTAINER GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Sales trend chart using interactive and beautiful pure SVGs */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                    <h4 className="font-display font-bold text-slate-900 text-sm flex items-center justify-between border-b border-slate-50 pb-2">
                      <span className="flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-emerald-550" />
                        Tren Penjualan Harian (Line Chart)
                      </span>
                      {chartHoverIdx !== null && stats.dailyTrends.length > 0 && (
                        <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-150 animate-fadeIn">
                          { [...stats.dailyTrends].reverse()[chartHoverIdx]?.date }: <b>Omset Rp { (([...stats.dailyTrends].reverse()[chartHoverIdx]?.sales) || 0).toLocaleString('id-ID') } | Untung Rp { (([...stats.dailyTrends].reverse()[chartHoverIdx]?.profit) || 0).toLocaleString('id-ID') }</b>
                        </span>
                      )}
                    </h4>
                    {reportsLoading || stats.dailyTrends.length === 0 ? (
                      <div className="pt-2 relative animate-pulse">
                        <div className="w-full h-56 relative flex items-center justify-center">
                          <div className="absolute inset-0 flex flex-col justify-between py-4 pr-2">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <div key={i} className="flex items-center gap-2 w-full">
                                <div className="h-2 w-10 bg-slate-50 rounded"></div>
                                <div className="h-[1px] bg-slate-100 flex-1 border-dashed border-b"></div>
                              </div>
                            ))}
                          </div>
                          
                          <svg viewBox="0 0 500 220" className="w-full h-full opacity-60 relative z-10 select-none">
                            <defs>
                              <linearGradient id="skeletonGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
                                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                              </linearGradient>
                            </defs>
                            <path 
                              d="M 60 160 Q 150 110 250 140 T 440 100" 
                              fill="url(#skeletonGradient)" 
                              stroke="#cbd5e1" 
                              strokeWidth="3" 
                              strokeLinecap="round" 
                              className="transition-all duration-1000"
                            />
                            <circle cx="250" cy="140" r="7" className="fill-emerald-400/25 animate-ping" />
                            <circle cx="250" cy="140" r="4.5" className="fill-emerald-500" />
                          </svg>

                          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-white/30 gap-2 backdrop-blur-[0.5px]">
                            <TrendingUp className="w-8 h-8 text-emerald-500/50 animate-bounce" />
                            <span className="text-xs font-semibold text-slate-400 bg-slate-50 shadow-xs px-3.5 py-1.5 rounded-full border border-slate-150">
                              {reportsLoading ? 'Mengunduh & Memetakan Tren Harian...' : 'Belum Ada Data Tren Penjualan'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-2 relative">
                        {/* Interactive Responsive SVG Line Chart */}
                        <div className="w-full h-56">
                          {(() => {
                            const chronTrends = [...stats.dailyTrends].reverse();
                            const maxSalesVal = Math.max(...chronTrends.map(t => t.sales)) || 10000;
                            const yAxisMax = Math.ceil((maxSalesVal * 1.15) / 10000) * 10000 || 10000;
                            
                            const paddingLeft = 60;
                            const paddingRight = 15;
                            const paddingTop = 15;
                            const paddingBottom = 40;
                            const innerWidth = 500 - paddingLeft - paddingRight;
                            const innerHeight = 220 - paddingTop - paddingBottom;

                            const points = chronTrends.map((trend, idx) => {
                              const x = paddingLeft + (idx / (chronTrends.length - 1 || 1)) * innerWidth;
                              const y = paddingTop + innerHeight - (trend.sales / yAxisMax) * innerHeight;
                              return { x, y, date: trend.date, sales: trend.sales };
                            });

                            const linePathD = points.length > 0
                              ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
                              : '';
                            
                            const areaPathD = points.length > 0
                              ? `${linePathD} L ${points[points.length - 1].x} ${paddingTop + innerHeight} L ${points[0].x} ${paddingTop + innerHeight} Z`
                              : '';

                            const gridLevels = [0, 0.25, 0.5, 0.75, 1];

                            return (
                              <svg viewBox="0 0 500 220" className="w-full h-full overflow-visible select-none" style={{ minHeight: '220px' }}>
                                <defs>
                                  <linearGradient id="salesTrendGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.32" />
                                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                                  </linearGradient>
                                </defs>

                                {/* Gridlines and Y-Axis Labels */}
                                {gridLevels.map((lvl, index) => {
                                  const gridY = paddingTop + innerHeight - lvl * innerHeight;
                                  const gridVal = lvl * yAxisMax;
                                  let formattedVal = '';
                                  if (gridVal >= 1000000) {
                                    formattedVal = `${(gridVal / 1000000).toFixed(1).replace('.0', '')}jt`;
                                  } else if (gridVal >= 1000) {
                                    formattedVal = `${(gridVal / 1000).toFixed(0)}rb`;
                                  } else {
                                    formattedVal = `${gridVal}`;
                                  }
                                  
                                  return (
                                    <g key={index}>
                                      <line 
                                        x1={paddingLeft} 
                                        y1={gridY} 
                                        x2={500 - paddingRight} 
                                        y2={gridY} 
                                        stroke={isDarkMode ? '#1e2c45' : '#f1f5f9'} 
                                        strokeWidth="1.5"
                                        strokeDasharray={index === 0 ? "none" : "3 3"}
                                      />
                                      <text 
                                        x={paddingLeft - 8} 
                                        y={gridY + 3.5} 
                                        textAnchor="end" 
                                        className="fill-slate-400 font-mono text-[9px] font-medium"
                                      >
                                        Rp {formattedVal}
                                      </text>
                                    </g>
                                  );
                                })}

                                {/* Area Fill */}
                                {areaPathD && (
                                  <path d={areaPathD} fill="url(#salesTrendGradient)" className="transition-all duration-300" />
                                )}

                                {/* Line Path */}
                                {linePathD && (
                                  <path 
                                    d={linePathD} 
                                    fill="none" 
                                    stroke="#10b981" 
                                    strokeWidth="2.5" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round"
                                    className="transition-all duration-300"
                                  />
                                )}

                                {/* X-Axis date labels */}
                                {chronTrends.map((trend, idx) => {
                                  const x = paddingLeft + (idx / (chronTrends.length - 1 || 1)) * innerWidth;
                                  const y = paddingTop + innerHeight;
                                  const labelText = trend.date.split(/\s+/).slice(0, 2).join(' '); // simplify tag, e.g. "23 Mei"
                                  return (
                                    <g key={idx}>
                                      <line x1={x} y1={y} x2={x} y2={y + 4} stroke={isDarkMode ? '#212e47' : '#e2e8f0'} strokeWidth="1.5" />
                                      <text 
                                        x={x} 
                                        y={y + 12} 
                                        textAnchor="middle" 
                                        className="fill-slate-500 font-sans text-[8px] font-semibold"
                                        transform={`rotate(-28, ${x}, ${y + 12})`}
                                      >
                                        {labelText}
                                      </text>
                                    </g>
                                  );
                                })}

                                {/* Interactive Hovers */}
                                {points.map((pt, idx) => {
                                  const isCurrentlyHovered = chartHoverIdx === idx;
                                  return (
                                    <g 
                                      key={idx}
                                      onMouseEnter={() => setChartHoverIdx(idx)}
                                      onMouseLeave={() => setChartHoverIdx(null)}
                                      className="cursor-pointer"
                                    >
                                      {isCurrentlyHovered && (
                                        <>
                                          {/* Vertical projection guideline */}
                                          <line 
                                            x1={pt.x} 
                                            y1={paddingTop} 
                                            x2={pt.x} 
                                            y2={paddingTop + innerHeight} 
                                            stroke="#10b981" 
                                            strokeOpacity="0.25"
                                            strokeWidth="1" 
                                            strokeDasharray="2 2"
                                          />
                                          {/* Active pulse aura */}
                                          <circle cx={pt.x} cy={pt.y} r="8" className="fill-emerald-400/25 transition-all duration-150" />
                                        </>
                                      )}
                                      {/* Point Marker */}
                                      <circle 
                                        cx={pt.x} 
                                        cy={pt.y} 
                                        r={isCurrentlyHovered ? "5" : "3.5"} 
                                        className="fill-white dark:fill-[#111724] stroke-emerald-500 stroke-2 transition-all duration-150" 
                                      />
                                      {/* Broad invisible touch/hover hit box */}
                                      <circle cx={pt.x} cy={pt.y} r="14" className="fill-transparent stroke-none" />
                                    </g>
                                  );
                                })}
                              </svg>
                            );
                          })()}
                        </div>
                        <div className="flex justify-center gap-4 text-[10px] text-slate-400 font-semibold select-none pt-2.5">
                          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Sumbu Vertikal: Omset (Rupiah)</span>
                          <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 bg-emerald-500 inline-block border-t border-dashed" /> Sorot titik untuk melihat nilai detail</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Popular items distribution using visual statistics rails */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                    <h4 className="font-display font-bold text-slate-900 text-sm flex items-center gap-1.5 border-b border-slate-50 pb-2">
                      <ShoppingBag className="w-4 h-4 text-primary" />
                      Produk Terlaris & Populer
                    </h4>
                    {reportsLoading || stats.productStats.length === 0 ? (
                      <div className="h-56 flex flex-col justify-center space-y-4 pt-2 animate-pulse">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="space-y-1.5">
                            <div className="flex justify-between">
                              <div className="h-3 w-32 bg-slate-100 rounded"></div>
                              <div className="h-3 w-10 bg-slate-100 rounded"></div>
                            </div>
                            <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                              <div className="bg-slate-200 h-full rounded-full" style={{ width: i === 1 ? '70%' : i === 2 ? '45%' : i === 3 ? '30%' : '15%' }}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4 pt-1 max-h-[250px] overflow-y-auto pr-1">
                        {stats.productStats.map((item, index) => {
                          const maxCount = Math.max(...stats.productStats.map(p => p.count)) || 1;
                          const percentage = (item.count / maxCount) * 100;
                          return (
                            <div key={index} className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs font-semibold">
                                <div className="flex items-center gap-2">
                                  <span className="w-4 h-4 rounded-full bg-slate-100 border border-slate-200 text-[10px] text-slate-600 flex items-center justify-center font-bold">{index + 1}</span>
                                  <span className="text-slate-800 font-bold truncate max-w-[190px]" title={item.name}>{item.name}</span>
                                </div>
                                <span className="text-primary font-black flex-shrink-0 text-right">
                                  {item.count} pcs <span className="text-slate-400 text-[10px] font-medium ml-1.5">(Omset Rp {item.revenue.toLocaleString('id-ID')} | Untung Rp {(item.profit || 0).toLocaleString('id-ID')})</span>
                                </span>
                              </div>
                              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                <div 
                                  className="bg-primary h-full rounded-full transition-all duration-1000" 
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* HISTORICAL TRANSACTIONS TABLE GRID */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                  {/* Table title with clean search option */}
                  <div className="p-4 md:p-5 border-b border-slate-100 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="font-display font-bold text-slate-900 tracking-tight text-sm flex items-center gap-2">
                      <Search className="w-4 h-4 text-primary animate-pulse" />
                      Rincian Transaksi Tersimpan ({filteredSheetRows.length} Baris)
                    </h3>
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Cari transaksi, pelanggan, dll..."
                        value={reportsSearchQuery}
                        onChange={(e) => setReportsSearchQuery(e.target.value)}
                        className="w-full py-1.5 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-full text-xs transition-colors focus:outline-none focus:border-accent focus:bg-white focus:ring-1 focus:ring-accent font-sans"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-55 border-b border-slate-200 text-slate-500 font-bold select-none whitespace-nowrap">
                          <th className="p-3">No Transaksi</th>
                          <th className="p-3">Tanggal</th>
                          <th className="p-3">Nama Pelanggan</th>
                          <th className="p-3">Metode</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Items / Produk</th>
                          <th className="p-3 text-right">Total Tagihan</th>
                          <th className="p-3 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSheetRows.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="p-6 text-center text-slate-400">Tidak ada transaksi yang ditemukan</td>
                          </tr>
                        ) : (
                          filteredSheetRows.map((row, index) => {
                            const transactionNo = getNoTransaksi(row);
                            const tgl = getTanggal(row);
                            const customerName = getNama(row);
                            const payMethod = getMetode(row);
                            const status = getStatus(row);
                            const totalVal = getTotalVal(row);
                            const productsList = getItems(row);
                            const formattedItems = formatItemsList(productsList);

                            return (
                              <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 border-b border-slate-100 text-slate-705 dark:text-slate-200">
                                <td className="p-3 font-mono font-bold text-primary">{transactionNo || `-`}</td>
                                <td className="p-3 font-mono">{tgl}</td>
                                <td className="p-3 font-bold text-slate-800">{customerName || `-`}</td>
                                <td className="p-3">
                                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                                    {payMethod || `Tunai`}
                                  </span>
                                </td>
                                <td className="p-3">
                                  {status === 'Selesai' ? (
                                    <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                                      Selesai
                                    </span>
                                  ) : (
                                    <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                                      Sedang Proses
                                    </span>
                                  )}
                                </td>
                                <td className="p-3 max-w-[200px] truncate" title={formattedItems}>
                                  {formattedItems || `-`}
                                </td>
                                <td className="p-3 text-right font-black text-slate-900 font-mono">
                                  Rp {parseCurrency(totalVal).toLocaleString('id-ID')}
                                </td>
                                <td className="p-3 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    {/* 1. Rincian */}
                                    <button
                                      onClick={() => setSelectedReportRow(row)}
                                      className="px-2 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white dark:bg-slate-850 dark:hover:bg-slate-700 dark:text-slate-200 rounded-lg text-[10px] font-bold transition-all inline-flex items-center gap-1 cursor-pointer active:scale-95"
                                      title="Rincian Transaksi"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>Rincian</span>
                                    </button>

                                    {/* 2. Cetak PDF */}
                                    <button
                                      onClick={() => handlePrintReceiptOfRow(row)}
                                      className="p-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white dark:bg-blue-950/40 dark:hover:bg-blue-900 dark:text-blue-300 rounded-lg transition-all inline-flex items-center cursor-pointer active:scale-95"
                                      title="Cetak PDF / Print"
                                    >
                                      <Printer className="w-3.5 h-3.5" />
                                    </button>

                                    {/* 3. Unduh JPG */}
                                    <button
                                      onClick={() => downloadNotaJPGOfRow(row)}
                                      className="p-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white dark:bg-emerald-950/40 dark:hover:bg-emerald-900 dark:text-emerald-300 rounded-lg transition-all inline-flex items-center cursor-pointer active:scale-95"
                                      title="Unduh Nota JPG"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                    </button>

                                    {/* 4. Hapus Transaksi */}
                                    <button
                                      onClick={() => handleDeleteTransaction(row)}
                                      className="p-1.5 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white dark:bg-rose-950/40 dark:hover:bg-rose-900 dark:text-rose-300 rounded-lg transition-all inline-flex items-center cursor-pointer active:scale-95"
                                      title="Hapus Transaksi"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="animate-fadeIn pb-12">
            <div className="max-w-xl mx-auto bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="font-display font-bold text-slate-900 tracking-tight text-lg flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary" />
                  Kustomisasi Toko & Database Backend
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Atur identitas fisik toko Anda dan konfigurasikan endpoint cloud Google Apps Script / Google Sheets Anda secara dinamis tanpa mengubah baris kode program secara manual.
                </p>
              </div>

              <div className="space-y-5">
                {/* --- SEKSI 1: IDENTITAS VISUAL --- */}
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-4">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">1. Profil Toko</h4>
                  
                  {/* Logo Toko */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-2 font-sans select-none">Logo Toko</label>
                    <div className="flex items-center gap-4">
                      {tempLogo && tempLogo !== 'store.png' ? (
                        <img src={tempLogo} alt="Logo" className="w-16 h-16 rounded-full object-cover border border-slate-200 shadow-sm bg-white" />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xl border border-slate-200 font-sans select-none shadow-sm">{tempName.substring(0, 2).toUpperCase()}</div>
                      )}
                      <div className="flex-1">
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setTempLogo(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[11px] file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Format gambar JPG, PNG. Maksimal 1MB.</p>
                      </div>
                    </div>
                  </div>

                  {/* Nama Toko */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Nama Toko</label>
                    <input
                      type="text"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      className="w-full text-xs p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-accent text-slate-800 font-bold uppercase transition-all"
                      placeholder="Contoh: KASIR PINTAR"
                    />
                  </div>

                  {/* Slogan Toko */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Slogan / Keterangan Nota</label>
                    <input
                      type="text"
                      value={tempSlogan}
                      onChange={(e) => setTempSlogan(e.target.value)}
                      className="w-full text-xs p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-accent text-slate-700 font-medium transition-all"
                      placeholder="Contoh: Menyediakan Berbagai Kebutuhan Berkualitas"
                    />
                  </div>
                </div>

                {/* --- SEKSI 2: INFORMASI ALAMAT DAN ASOSIASI KONTAK --- */}
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-4">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">2. Alamat & Kontak Fisik</h4>
                  
                  {/* Alamat Fisik Toko */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Alamat Fisik Toko (Kolom Luas)</label>
                    <textarea
                      rows={3}
                      value={tempAlamat}
                      onChange={(e) => setTempAlamat(e.target.value)}
                      className="w-full text-xs p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-accent text-slate-700 font-medium transition-all resize-none"
                      placeholder="Masukkan alamat lengkap fisik toko Anda yang akan dicetak di kertas struk..."
                    />
                  </div>

                  {/* Kontak Telepon Toko */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Nomor Kontak / Telepon Toko</label>
                    <input
                      type="text"
                      value={tempKontak}
                      onChange={(e) => setTempKontak(e.target.value)}
                      className="w-full text-xs p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-accent text-slate-700 font-medium transition-all"
                      placeholder="Contoh: 📞 0851-1960-6906"
                    />
                  </div>
                </div>

                {/* --- SEKSI 3: TAMPILAN & TEMA APLIKASI --- */}
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-4">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">3. Tema & Tampilan</h4>
                  <p className="text-[11px] text-slate-500">
                    Pilih tema tampilan kasir yang paling nyaman untuk mata Anda. Mode Gelap direkomendasikan untuk mengurangi radiasi cahaya dan kelelahan mata di malam hari.
                  </p>

                  <div className="grid grid-cols-2 gap-4 font-sans">
                    {/* Light Theme Card */}
                    <button
                      type="button"
                      onClick={() => setIsDarkMode(false)}
                      className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                        !isDarkMode
                          ? 'border-accent bg-white shadow-xs'
                          : 'border-slate-200 bg-slate-100 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-800">Tema Terang</span>
                        <div className={`w-4.5 h-4.5 rounded-full flex items-center justify-center border ${
                          !isDarkMode ? 'border-accent bg-accent text-white' : 'border-slate-300'
                        }`}>
                          {!isDarkMode && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>
                      </div>
                      <div className="h-10 bg-slate-100 rounded-lg p-1.5 space-y-1 block select-none">
                        <div className="h-2 w-2/3 bg-slate-300 rounded" />
                        <div className="grid grid-cols-3 gap-1">
                          <div className="h-4 bg-white rounded border border-slate-200" />
                          <div className="h-4 bg-white rounded border border-slate-200" />
                          <div className="h-4 bg-white rounded border border-slate-200" />
                        </div>
                      </div>
                    </button>

                    {/* Dark Theme Card */}
                    <button
                      type="button"
                      onClick={() => setIsDarkMode(true)}
                      className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                        isDarkMode
                          ? 'border-accent bg-slate-900 shadow-xs'
                          : 'border-slate-200 bg-slate-100 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-800">Tema Gelap</span>
                        <div className={`w-4.5 h-4.5 rounded-full flex items-center justify-center border ${
                          isDarkMode ? 'border-accent bg-accent text-white' : 'border-slate-300'
                        }`}>
                          {isDarkMode && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>
                      </div>
                      <div className="h-10 bg-slate-850 rounded-lg p-1.5 space-y-1 block select-none">
                        <div className="h-2 w-2/3 bg-slate-600 rounded" />
                        <div className="grid grid-cols-3 gap-1">
                          <div className="h-4 bg-slate-700 rounded border border-slate-600" />
                          <div className="h-4 bg-slate-700 rounded border border-slate-600" />
                          <div className="h-4 bg-slate-700 rounded border border-slate-600" />
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* --- SEKSI 4: INSTALASI APLIKASI (PWA) --- */}
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-4">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">4. Instalasi Aplikasi (PWA)</h4>
                  <p className="text-[11px] text-slate-500">
                    Instal Rizquna langsung di perangkat mobile, tablet, atau desktop Anda untuk akses cepat, stabil, tanpa batas, dan dapat dibuka secara luring (offline) tanpa kuota internet tanpa melalui App Store / Play Store.
                  </p>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white/80 rounded-2xl border border-slate-205">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-accent/10 border border-accent/20 rounded-xl flex items-center justify-center text-accent">
                        <Download className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">Status Instalasi</span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {deferredPrompt ? 'Siap Diinstal!' : 'Telah Terinstal / Berjalan di Peramban'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleInstallPWA}
                      className="w-full sm:w-auto px-4 py-2 bg-accent hover:bg-accent-hover text-slate-950 font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Download className="w-4 h-4" />
                      <span>Instal Rizquna</span>
                    </button>
                  </div>
                </div>

                {/* --- SEKSI 5: INTEGRASI GOOGLE BACKEND --- */}
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-4">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">5. Integrasi Spreadsheet Cloud</h4>

                  {/* URL Google Apps Script */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">URL Google Apps Script (GAS) Web App</label>
                    <input
                      type="text"
                      value={tempGasUrl}
                      onChange={(e) => setTempGasUrl(e.target.value)}
                      className="w-full text-xs p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-accent text-slate-700 font-mono transition-all"
                      placeholder="https://script.google.com/macros/s/.../exec"
                    />
                    <p className="text-[10px] text-slate-400 mt-1 font-sans">
                      URL Web App hasil deployment script Google Apps Script Anda. Seluruh transaksi dan sinkronisasi produk akan langsung terhubung ke alamat GAS ini.
                    </p>
                  </div>

                  {/* Link / ID Google Sheet */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Link URL atau ID Google Sheet (Database)</label>
                    <input
                      type="text"
                      value={tempSheetId}
                      onChange={(e) => setTempSheetId(e.target.value)}
                      className="w-full text-xs p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-accent text-slate-700 font-mono transition-all"
                      placeholder="Masukkan Link URL Google Sheet atau ID Spreadsheet saja..."
                    />
                    <p className="text-[10px] text-slate-400 mt-1 font-sans">
                      Pasted URL lengkap ataupun hanya text ID Google Spreadsheet Anda yang bertindak sebagai database.
                    </p>
                  </div>

                  {/* Tombol Database dan Download Google Sheet */}
                  <div className="pt-2">
                    <label className="text-xs font-semibold text-slate-600 block mb-2">Aksi Pengelolaan Database Spreadsheet:</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => {
                          if (!tempSheetId.trim()) {
                            triggerToast('Harap masukkan Link atau ID Google Sheet terlebih dahulu!', 'warning');
                            return;
                          }
                          // Extract spreadsheet ID if full URL was pasted
                          let finalId = tempSheetId.trim();
                          if (finalId.includes('/d/')) {
                            const match = finalId.match(/\/d\/([a-zA-Z0-9-_]{25,110})/);
                            if (match) {
                              finalId = match[1];
                            }
                          }
                          const url = finalId.startsWith('http') ? finalId : `https://docs.google.com/spreadsheets/d/${finalId}/edit`;
                          window.open(url, '_blank');
                        }}
                        className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        DATABASE
                      </button>

                      <button
                        onClick={() => {
                          if (!tempSheetId.trim()) {
                            triggerToast('Harap masukkan Link atau ID Google Sheet terlebih dahulu untuk mengunduh!', 'warning');
                            return;
                          }
                          // Extract spreadsheet ID
                          let finalId = tempSheetId.trim();
                          if (finalId.includes('/d/')) {
                            const match = finalId.match(/\/d\/([a-zA-Z0-9-_]{25,110})/);
                            if (match) {
                              finalId = match[1];
                            }
                          }
                          const downloadUrl = `https://docs.google.com/spreadsheets/d/${finalId}/export?format=xlsx`;
                          window.open(downloadUrl, '_blank');
                          triggerToast('Mengunduh spreadsheet database...', 'info');
                        }}
                        className="py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        DOWNLOAD SHEET
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tombol Simpan Semuanya */}
              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  onClick={() => {
                    // Smart extraction of sheetID from pasted URL
                    let extractedId = tempSheetId.trim();
                    if (extractedId.includes('/d/')) {
                      const match = extractedId.match(/\/d\/([a-zA-Z0-9-_]{25,110})/);
                      if (match) {
                        extractedId = match[1];
                      }
                    }
                    handleSaveStoreConfig(
                      tempName, 
                      tempSlogan, 
                      tempAlamat, 
                      tempKontak, 
                      tempLogo, 
                      tempGasUrl, 
                      extractedId
                    );
                  }}
                  className="flex-1 py-3 bg-accent hover:bg-accent/90 text-white font-bold text-xs rounded-full transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer hover:shadow-md"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Simpan Semua Pengaturan
                </button>
                <button
                  onClick={() => {
                    setTempName('KASIR PINTAR');
                    setTempSlogan('Sistem Kasir Fleksibel Multi-Fungsi');
                    setTempAlamat('🌐 Yogyakarta, Indonesia');
                    setTempKontak('📞 0812-3456-7890');
                    setTempLogo('store.png');
                    setTempGasUrl('https://script.google.com/macros/s/AKfycbxE4eMX3_TJlSkXitw2txzNv1R_AUMUarPFbatelhUgLw6V6IStSrys9C8lEZUhn-ZSgQ/exec');
                    setTempSheetId('19981hn179EkrhmnlGCBPl5ZVhx84O1KMaglrq9RKVCI');
                    
                    handleSaveStoreConfig(
                      'KASIR PINTAR', 
                      'Sistem Kasir Fleksibel Multi-Fungsi', 
                      '🌐 Yogyakarta, Indonesia', 
                      '📞 0812-3456-7890', 
                      'store.png',
                      'https://script.google.com/macros/s/AKfycbxE4eMX3_TJlSkXitw2txzNv1R_AUMUarPFbatelhUgLw6V6IStSrys9C8lEZUhn-ZSgQ/exec',
                      '19981hn179EkrhmnlGCBPl5ZVhx84O1KMaglrq9RKVCI'
                    );
                  }}
                  className="py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-full transition-all cursor-pointer font-sans"
                >
                  Set Default
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 py-6 text-center text-xs border-t border-slate-200 dark:border-slate-850 select-none">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="font-semibold text-slate-600 dark:text-slate-400">Copyright &copy; 2026 {storeNameState}. All rights reserved.</p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">Sistem POS Kasir Pintar · Developed by Teguh Sulistyawan</p>
        </div>
      </footer>

      {/* TOAST SYSTEM */}
      {showToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white py-3 px-5 rounded-full shadow-xl flex items-center gap-2 text-xs font-semibold animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-accent" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MODAL KONFIRMASI KOSONGKAN KERANJANG */}
      {showConfirmClearCart && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-5">
            <div className="flex items-center gap-3.5 pb-2 border-b border-rose-100">
              <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                <Trash2 className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="font-display font-bold text-slate-900 text-sm">
                  Kosongkan Keranjang Belanja?
                </h3>
                <p className="text-[11px] text-slate-450 mt-0.5">
                  Tindakan ini akan menghapus semua barang dari daftar keranjang.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-semibold">
              Apakah Anda yakin ingin mengosongkan seluruh item yang ada di dalam keranjang belanja saat ini?
            </p>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowConfirmClearCart(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-full transition-all cursor-pointer active:scale-95"
              >
                Batal
              </button>
              <button
                onClick={executeClearCart}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-full transition-all flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md cursor-pointer active:scale-95"
              >
                Ya, Kosongkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI RESET TRANSAKSI */}
      {showConfirmReset && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-5">
            <div className="flex items-center gap-3.5 pb-2 border-b border-amber-100">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                <RotateCcw className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="font-display font-bold text-slate-900 text-sm">
                  Reset Seluruh Transaksi?
                </h3>
                <p className="text-[11px] text-slate-450 mt-0.5">
                  Tindakan ini akan mengosongkan keranjang dan semua data input kasir.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-semibold">
              Apakah Anda yakin ingin memulai transaksi baru dan menghapus semua catatan formulir kasir yang aktif?
            </p>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowConfirmReset(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-full transition-all cursor-pointer active:scale-95"
              >
                Batal
              </button>
              <button
                onClick={executeResetAll}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-full transition-all flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md cursor-pointer active:scale-95"
              >
                Ya, Reset Baru
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETAIL DAN TINDAKAN TRANSAKSI */}
      {selectedReportRow && (() => {
        const transactionNo = getNoTransaksi(selectedReportRow);
        const tgl = getTanggal(selectedReportRow);
        const jam = getWaktu(selectedReportRow) || '';
        const customerName = getNama(selectedReportRow) || 'Umum';
        const address = getAlamat(selectedReportRow) || '-';
        const contact = getKontak(selectedReportRow) || '-';
        const estimasiPO = getEstimasi(selectedReportRow);
        const payMethod = getMetode(selectedReportRow) || 'Tunai';
        const status = getStatus(selectedReportRow);
        const subtotal = Number(getSubtotalVal(selectedReportRow) || 0);
        const diskonPct = Number(getDiskonPctVal(selectedReportRow) || 0);
        const diskonAmount = Number(getDiskonAmountVal(selectedReportRow) || 0);
        const ongkir = Number(getOngkirVal(selectedReportRow) || 0);
        const tambahan = Number(getTambahanVal(selectedReportRow) || 0);
        const total = Number(getTotalVal(selectedReportRow) || 0);
        const uangDiterima = Number(getUangDiterimaVal(selectedReportRow) || 0);
        const change = Number(getChangeVal(selectedReportRow) || 0);
        const itemsRaw = getItems(selectedReportRow);
        
        let itemsList: any[] = [];
        try {
          if (itemsRaw && itemsRaw.trim().startsWith('[')) {
            itemsList = JSON.parse(itemsRaw.trim());
          }
        } catch (e) {
          console.error(e);
        }

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 border border-slate-200 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
              {/* MODAL HEADER */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-150">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 text-primary rounded-xl">
                    <Eye className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-slate-900 text-sm">
                      Detail &amp; Rincian Transaksi
                    </h3>
                    <p className="text-[10px] font-mono font-bold text-slate-400">
                      {transactionNo}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedReportRow(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* TWO-COLUMN INFO METADATA */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <h4 className="font-bold text-slate-900 text-[10px] uppercase tracking-wider text-primary">Informasi Pelanggan</h4>
                  <div className="grid grid-cols-3 gap-y-1 text-slate-600">
                    <span className="font-medium text-slate-400">Nama:</span>
                    <span className="col-span-2 font-bold text-slate-800">{customerName}</span>
                    <span className="font-medium text-slate-400">Kontak:</span>
                    <span className="col-span-2 font-mono">{contact}</span>
                    <span className="font-medium text-slate-400">Alamat:</span>
                    <span className="col-span-2">{address}</span>
                    {estimasiPO && (
                      <>
                        <span className="font-medium text-slate-400 text-rose-600 font-semibold">PO Estimasi:</span>
                        <span className="col-span-2 font-semibold text-rose-600">
                          {new Date(estimasiPO).toLocaleDateString('id-ID', {day:'numeric',month:'long',year:'numeric'})}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <h4 className="font-bold text-slate-900 text-[10px] uppercase tracking-wider text-primary">Status &amp; Pembayaran</h4>
                  <div className="grid grid-cols-3 gap-y-1.5 text-slate-600 items-center">
                    <span className="font-medium text-slate-400">Waktu:</span>
                    <span className="col-span-2 font-mono font-semibold">{tgl} {jam}</span>
                    <span className="font-medium text-slate-400">Metode:</span>
                    <span className="col-span-2">
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                        {payMethod}
                      </span>
                    </span>
                    <span className="font-medium text-slate-400">Status:</span>
                    <span className="col-span-2">
                      {status === 'Selesai' ? (
                        <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase inline-flex items-center gap-1">
                          <Check className="w-3 h-3" /> Selesai
                        </span>
                      ) : (
                        <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase inline-flex items-center gap-1 animate-pulse">
                          Sedang Proses
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* LIST ITEMS ORDERED */}
              <div className="border border-slate-150 rounded-2xl overflow-hidden bg-white">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-150 font-bold text-slate-500 whitespace-nowrap">
                      <th className="p-3">Nama Produk</th>
                      <th className="p-3">Varian</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Harga Satuan</th>
                      <th className="p-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemsList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-slate-400">Tidak ada produk dalam daftar ini</td>
                      </tr>
                    ) : (
                      itemsList.map((item, idx) => (
                        <tr key={idx} className="border-b border-slate-100 text-slate-700 dark:text-slate-200 hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="p-3 font-semibold text-slate-900">
                            {item.nama}
                            {item.catatan || item.note ? (
                              <div className="text-[10px] text-slate-400 font-normal italic mt-0.5">Catatan: {item.catatan || item.note}</div>
                            ) : null}
                          </td>
                          <td className="p-3 font-mono text-[11px] text-slate-500">{item.ukuran || item.varian || '-'}</td>
                          <td className="p-3 text-center font-bold">{item.qty}</td>
                          <td className="p-3 text-right font-mono">Rp {Number(item.harga || 0).toLocaleString('id-ID')}</td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900">Rp {Number((item.qty || 1) * (item.harga || 0)).toLocaleString('id-ID')}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* PRICING BREAKDOWN */}
              <div className="flex flex-col items-end text-xs space-y-1.5 border-t border-slate-100 pt-4 font-sans font-medium">
                <div className="flex justify-between w-64 text-slate-500">
                  <span>Subtotal Produk:</span>
                  <span className="font-mono font-semibold text-slate-800">Rp {subtotal.toLocaleString('id-ID')}</span>
                </div>
                {diskonAmount > 0 && (
                  <div className="flex justify-between w-64 text-rose-600">
                    <span>Diskon ({diskonPct}%):</span>
                    <span className="font-mono font-semibold">-Rp {diskonAmount.toLocaleString('id-ID')}</span>
                  </div>
                )}
                {ongkir > 0 && (
                  <div className="flex justify-between w-64 text-slate-500">
                    <span>Ongkos Kirim:</span>
                    <span className="font-mono font-semibold text-slate-800">Rp {ongkir.toLocaleString('id-ID')}</span>
                  </div>
                )}
                {tambahan > 0 && (
                  <div className="flex justify-between w-64 text-slate-500">
                    <span>Biaya Tambahan:</span>
                    <span className="font-mono font-semibold text-slate-800">Rp {tambahan.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="flex justify-between w-64 text-sm font-black text-slate-900 pt-2 border-t border-slate-100">
                  <span>TOTAL TAGIHAN:</span>
                  <span className="font-mono text-primary text-base">Rp {total.toLocaleString('id-ID')}</span>
                </div>

                {payMethod !== 'Belum Dibayar' && (
                  <>
                    <div className="flex justify-between w-64 text-slate-500 pt-2">
                      <span>Uang Masuk / DP:</span>
                      <span className="font-mono font-semibold text-slate-800">Rp {uangDiterima.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between w-64 text-sm font-bold pt-1">
                      <span className={change >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                        {payMethod === 'DP' ? 'Sisa Tagihan:' : 'Kembalian:'}
                      </span>
                      <span className={`font-mono ${change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        Rp {Math.abs(change).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* THREE MAIN ACTION BUTTONS AS REQUESTED */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-150">
                {/* 1. EDIT PESANAN */}
                <button
                  onClick={() => handleEditTransaction(selectedReportRow)}
                  className="flex-1 py-3 px-4 border border-amber-600 bg-amber-500 hover:bg-amber-600 text-white dark:text-amber-200 dark:bg-amber-950/20 dark:border-amber-900 rounded-full font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-sm"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Pesanan
                </button>

                {/* 2. CETAK NOTA (Print / PDF) */}
                <button
                  onClick={() => handlePrintReceiptOfRow(selectedReportRow)}
                  className="flex-1 py-3 px-4 border border-blue-700 bg-blue-600 hover:bg-blue-700 text-white dark:text-blue-200 dark:bg-blue-950/20 dark:border-blue-900 rounded-full font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  Cetak (Print/PDF)
                </button>

                {/* 3. UNDUH NOTA JPG */}
                <button
                  onClick={() => downloadNotaJPGOfRow(selectedReportRow)}
                  className="flex-1 py-3 px-4 border border-emerald-700 bg-emerald-600 hover:bg-emerald-700 text-white dark:text-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900 rounded-full font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  Unduh JPG
                </button>

                {/* 4. HAPUS TRANSAKSI */}
                <button
                  onClick={() => handleDeleteTransaction(selectedReportRow)}
                  className="flex-1 py-3 px-4 border border-rose-700 bg-rose-600 hover:bg-rose-700 text-white dark:text-rose-200 dark:bg-rose-950/20 dark:border-rose-900 rounded-full font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Hapus Transaksi
                </button>

                {/* 5. TRANSAKSI SELESAI */}
                {status === 'Selesai' ? (
                  <button
                    onClick={() => handleUpdateTransactionStatus(transactionNo, 'Sedang Proses')}
                    className="flex-1 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-sm hover:shadow-md"
                  >
                    <Check className="w-4 h-4 text-emerald-400" />
                    Buka Kembali Pesanan
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpdateTransactionStatus(transactionNo, 'Selesai')}
                    className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-md hover:shadow-lg"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Transaksi Selesai
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL KONFIRMASI HAPUS PRODUK (AMAN DARI IFRAME SANDBOX) */}
      {deleteConfirmProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-5">
            <div className="flex items-center gap-3.5 pb-2 border-b border-rose-100">
              <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="font-display font-bold text-slate-900 text-sm">
                  Konfirmasi Hapus Produk
                </h3>
                <p className="text-[11px] text-slate-450 mt-0.5">
                  Tindakan ini tidak dapat dibatalkan di Google Sheets.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 text-xs space-y-2 font-medium">
              <div className="flex justify-between">
                <span className="text-slate-400">ID Produk:</span>
                <span className="font-mono font-bold text-slate-800">{deleteConfirmProduct.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Nama Produk:</span>
                <span className="font-bold text-slate-800">{deleteConfirmProduct.nama}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Spesifikasi Varian:</span>
                <span className="font-semibold text-slate-705">{deleteConfirmProduct.ukuran || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Kategori:</span>
                <span className="font-semibold text-slate-705">{deleteConfirmProduct.kategori || '-'}</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Apakah Anda yakin ingin menghapus produk ini secara permanen dari database?
            </p>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => {
                  setDeleteConfirmProduct(null);
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-full transition-all cursor-pointer active:scale-95"
              >
                Batal
              </button>
              <button
                onClick={() => executeDeleteProduct(deleteConfirmProduct)}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-full transition-all flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md cursor-pointer active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Ya, Hapus Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS TRANSAKSI (AMAN DARI IFRAME SANDBOX) */}
      {deleteConfirmTransaction && (() => {
        const transactionNo = getNoTransaksi(deleteConfirmTransaction);
        const customerName = getNama(deleteConfirmTransaction) || 'Umum';
        const total = getTotalVal(deleteConfirmTransaction);
        const tgl = getTanggal(deleteConfirmTransaction);
        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
              <div className="flex items-center gap-3.5 pb-2 border-b border-rose-100 dark:border-rose-950">
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-xl">
                  <AlertTriangle className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-slate-900 dark:text-slate-100 text-sm">
                    Konfirmasi Hapus Transaksi
                  </h3>
                  <p className="text-[11px] text-slate-450 mt-0.5">
                    Stok barang dalam rincian pesanan ini akan dikembalikan.
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-150 dark:border-slate-800 text-xs space-y-2 font-medium font-sans">
                <div className="flex justify-between">
                  <span className="text-slate-400">No. Transaksi:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{transactionNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Pelanggan:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tanggal:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{tgl}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Transaksi:</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">Rp {Number(total || 0).toLocaleString('id-ID')}</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                Apakah Anda yakin ingin menghapus pesanan ini secara permanen dari database Google Sheets? Tindakan ini akan mengembalikan stok produk yang bersangkutan.
              </p>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => {
                    setDeleteConfirmTransaction(null);
                  }}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 font-bold text-xs rounded-full transition-all cursor-pointer active:scale-95"
                >
                  Batal
                </button>
                <button
                  onClick={() => executeDeleteTransaction(deleteConfirmTransaction)}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-full transition-all flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md cursor-pointer active:scale-95"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Ya, Hapus Sekarang
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL DIALOG PREVIEW DEBUGGING ALERT (GANTI WINDOW.ALERT DI IFRAME) */}
      {deleteDebugLog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-150">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg text-[10px] font-bold leading-none ${
                  deleteDebugHeader.includes('SUKSES') 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                    : deleteDebugHeader.includes('BATAL')
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {deleteDebugHeader}
                </div>
                <h3 className="font-display font-bold text-slate-900 text-sm">
                  Log Informasi Aktivitas
                </h3>
              </div>
              <button
                onClick={() => setDeleteDebugLog(null)}
                className="p-1 text-slate-400 hover:text-slate-650 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Metode Debug Tracker:</p>
              <pre className="bg-slate-950 text-slate-100 text-[10px] p-4 rounded-xl border border-slate-800 overflow-x-auto whitespace-pre-wrap font-mono max-h-72 leading-relaxed shadow-inner">
                {deleteDebugLog}
              </pre>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setDeleteDebugLog(null)}
                className="py-2 px-6 bg-slate-900 hover:bg-slate-850 text-white font-bold text-xs rounded-full transition-all cursor-pointer active:scale-95"
              >
                Tutup Debug
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROFESSIONAL CAMERA BARCODE SCANNER OVERLAY */}
      {isScannerOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-slate-205 overflow-hidden animate-scaleIn select-none">
            <div className="bg-gradient-to-r from-primary to-secondary text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <Camera className="w-4 h-4 text-accent-light" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-xs">Pindai Kode Barang</h3>
                  <p className="text-[9px] text-slate-200">
                    {scannerPurpose === 'productId' ? 'Mengisi Kode Barang Baru' : 'Mencari & Menambah Produk Kasir'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsScannerOpen(false);
                  stopScanner();
                }}
                className="p-1 rounded-full bg-white/10 hover:bg-white/20 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 flex flex-col items-center">
              {/* VIEWPORT BOX */}
              <div className="relative w-full aspect-[4/3] max-w-[280px] rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-950 flex items-center justify-center shadow-inner">
                {/* Custom pulsing scanner reticle/line */}
                <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-0.5 bg-rose-500 animate-pulse z-20 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                <div className="absolute top-4 left-4 w-5 h-5 border-t-4 border-l-4 border-accent z-10 rounded-tl" />
                <div className="absolute top-4 right-4 w-5 h-5 border-t-4 border-r-4 border-accent z-10 rounded-tr" />
                <div className="absolute bottom-4 left-4 w-5 h-5 border-b-4 border-l-4 border-accent z-10 rounded-bl" />
                <div className="absolute bottom-4 right-4 w-5 h-5 border-b-4 border-r-4 border-accent z-10 rounded-br" />
                
                {/* HTML5 QR Code Mount Node */}
                <div id="barcode-scanner-viewport" className="w-full h-full object-cover animate-pulse" />

                {/* Scanned Transient Success Indicator Overlay */}
                {lastScannedItem && (
                  <div className="absolute inset-0 bg-emerald-500/90 backdrop-blur-xs flex flex-col items-center justify-center text-white p-3 text-center z-30 animate-fadeIn duration-200">
                    <CheckCircle2 className="w-10 h-10 mb-2 animate-bounce" />
                    <p className="font-bold text-xs leading-none">Terpindai Sukses!</p>
                    <p className="text-[10px] font-semibold opacity-95 truncate max-w-[200px] mt-1">{lastScannedItem}</p>
                    <p className="text-[9px] opacity-80 mt-0.5">+1 Keranjang</p>
                  </div>
                )}
              </div>

              <div className="text-center space-y-1">
                <p className="text-[11px] font-bold text-slate-705">Arahkan Kamera ke Kode Batang (Barcode / QR)</p>
                <p className="text-[9px] text-slate-400">Kasir profesional otomatis menambahkan item ke keranjang.</p>
              </div>

              <div className="w-full pt-1">
                <button
                  onClick={() => {
                    setIsScannerOpen(false);
                    stopScanner();
                  }}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-full cursor-pointer text-center active:scale-95 transition-all"
                >
                  Selesai / Tutup Kamera
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PWA MANUAL INSTALL INSTRUCTIONS MODAL (MENDUKUNG IOS & ANDROID IFRAME SANDBOX) */}
      {showManualInstall && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-slate-850 shadow-2xl animate-scaleIn">
            <div className="bg-gradient-to-r from-primary to-secondary text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl p-0.5 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-md">
                  <img src="/logo_rizquna.png" alt="Rizquna" className="w-8 h-8 rounded-lg object-cover" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm tracking-tight">Pasang Aplikasi Rizquna</h3>
                  <p className="text-[10px] text-slate-200">Panduan Pemasangan Mudah &amp; Cepat</p>
                </div>
              </div>
              <button
                onClick={() => setShowManualInstall(false)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-all cursor-pointer text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto font-sans text-slate-700 dark:text-slate-300">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                Simpan <strong>Rizquna Kasir Pintar</strong> langsung di Layar Utama HP, Tablet, atau Desktop Anda. Aplikasi akan berjalan layaknya aplikasi mobile yang sempurna: sangat ringan, hemat kuota data, dan mendukung akses offline cepat.
              </p>

              {/* IOS / SAFARI INSTRUCTIONS */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-primary dark:text-amber-450 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                  <span className="px-2 py-0.5 bg-primary/10 text-primary dark:bg-amber-950/40 dark:text-amber-400 rounded-md text-[10px]">iOS</span>
                  Pengguna Apple Safari (iPhone / iPad)
                </h4>
                <ol className="space-y-2.5 text-xs text-slate-650 dark:text-slate-250 font-medium">
                  <li className="flex items-start gap-2.5">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-800 dark:text-slate-200">1</span>
                    <span>Ketuk tombol <strong className="text-primary dark:text-accent-light font-bold">Bagikan (Share)</strong> <Share2 className="w-3.5 h-3.5 inline mx-0.5 mb-1" /> pada bar navigasi Safari (di bagian bawah layar iPhone, atau bagian atas layar iPad).</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-800 dark:text-slate-200">2</span>
                    <span>Gulir menu ke bawah lalu pilih opsi <strong className="font-bold text-slate-800 dark:text-white">"Tambahkan ke Layar Utama" (Add to Home Screen)</strong>.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-800 dark:text-slate-200">3</span>
                    <span>Beri nama <strong className="font-bold text-primary">Rizquna</strong> dan ketuk <strong className="text-emerald-600 dark:text-emerald-450 font-bold">"Tambah" (Add)</strong> di kanan atas.</span>
                  </li>
                </ol>
              </div>

              {/* ANDROID / CHROME / PC INSTRUCTIONS */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-primary dark:text-amber-450 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                  <span className="px-2 py-0.5 bg-primary/10 text-primary dark:bg-amber-950/40 dark:text-amber-400 rounded-md text-[10px]">Android / PC</span>
                  Pengguna Google Chrome / Edge / Opera
                </h4>
                <ol className="space-y-2.5 text-xs text-slate-650 dark:text-slate-250 font-medium">
                  <li className="flex items-start gap-2.5">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-800 dark:text-slate-200">1</span>
                    <span>Ketuk ikon <strong className="font-bold text-slate-800 dark:text-white">Menu Tiga Titik</strong> di pojok kanan atas browser Anda.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-800 dark:text-slate-200">2</span>
                    <span>Pilih menu <strong className="font-bold text-slate-800 dark:text-white">"Instal Aplikasi"</strong> atau <strong className="font-bold text-slate-800 dark:text-white">"Tambahkan ke Layar Utama"</strong>.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-800 dark:text-slate-200">3</span>
                    <span>Konfirmasi pemasangan, ikon aplikasi <strong className="font-bold text-primary">Rizquna</strong> akan segera terpasang di layar utama perangkat Anda!</span>
                  </li>
                </ol>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 px-6 py-4 flex justify-end gap-3 border-t border-slate-150 dark:border-slate-850">
              <button
                onClick={() => setShowManualInstall(false)}
                className="py-2.5 px-6 bg-slate-900 hover:bg-slate-850 text-white dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full font-bold text-xs transition-all cursor-pointer active:scale-95"
              >
                Selesai &amp; Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
