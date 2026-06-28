// ═══════════════════════════════════════
// KONFIGURASI GOOGLE APPS SCRIPT WEB APP
// ═══════════════════════════════════════
const SHEET_API_URL =
    "https://script.google.com/macros/s/AKfycbxE4eMX3_TJlSkXitw2txzNv1R_AUMUarPFbatelhUgLw6V6IStSrys9C8lEZUhn-ZSgQ/exec";
const SHEET_API_URL_PESANAN =
    "https://script.google.com/macros/s/AKfycbxE4eMX3_TJlSkXitw2txzNv1R_AUMUarPFbatelhUgLw6V6IStSrys9C8lEZUhn-ZSgQ/exec";

const produkLokal = [
    { nama: "Kosan 40x40", ukuran: "40x40", harga: 110000, kategori: "Kosan",
        foto: "https://drive.google.com/uc?export=view&id=1pMZxig5hv3jU0jWBeU0aUR1-ufPwe4Cw" },
    { nama: "Kosan 35x35", ukuran: "35x35", harga: 100000, kategori: "Kosan",
        foto: "https://drive.google.com/uc?export=view&id=1pMZxig5hv3jU0jWBeU0aUR1-ufPwe4Cw" },
    { nama: "Kosan Set", ukuran: "40+35", harga: 210000, kategori: "Kosan",
        foto: "https://drive.google.com/uc?export=view&id=1pMZxig5hv3jU0jWBeU0aUR1-ufPwe4Cw" },
    { nama: "Ceper 40x40", ukuran: "40x40", harga: 100000, kategori: "Kosan Ceper",
        foto: "https://drive.google.com/uc?export=view&id=17PBCVRYZ8elCKe6O_fau1G--ov1ZQ450" },
    { nama: "Ceper 35x35", ukuran: "35x35", harga: 90000, kategori: "Kosan Ceper",
        foto: "https://drive.google.com/uc?export=view&id=17PBCVRYZ8elCKe6O_fau1G--ov1ZQ450" },
    { nama: "Ceper Set", ukuran: "40+35", harga: 190000, kategori: "Kosan Ceper",
        foto: "https://drive.google.com/uc?export=view&id=17PBCVRYZ8elCKe6O_fau1G--ov1ZQ450" },
    { nama: "Replika Besar", ukuran: "47x42", harga: 90000, kategori: "Replika",
        foto: "https://drive.google.com/uc?export=view&id=1wcjmbFHGsgGeZOXSOECKr7vjNmITzh3Q" },
    { nama: "Replika Sedang", ukuran: "42x37", harga: 80000, kategori: "Replika",
        foto: "https://drive.google.com/uc?export=view&id=1wcjmbFHGsgGeZOXSOECKr7vjNmITzh3Q" },
    { nama: "Replika Kecil", ukuran: "37x32", harga: 70000, kategori: "Replika",
        foto: "https://drive.google.com/uc?export=view&id=1wcjmbFHGsgGeZOXSOECKr7vjNmITzh3Q" },
    { nama: "Replika Set", ukuran: "1+2+3", harga: 220000, kategori: "Replika",
        foto: "https://drive.google.com/uc?export=view&id=1wcjmbFHGsgGeZOXSOECKr7vjNmITzh3Q" }
];

let produk = [...produkLokal];
let cart = [];
let currentCategory = 'all';
let searchQuery = '';

function formatRupiah(angka) { return 'Rp ' + angka.toLocaleString('id-ID'); }

function isValidSheetUrl() { return SHEET_API_URL && SHEET_API_URL.trim() !== "" && !SHEET_API_URL.includes("PASTE_YOUR_URL"); }

function buildApiUrl(action) {
    try { const url = new URL(SHEET_API_URL);
        url.searchParams.set('action', action); return url.toString(); } catch (e) { return SHEET_API_URL + (SHEET_API_URL
            .includes('?') ? '&' : '?') + 'action=' + action; }
}

async function fetchProdukDariSheet() {
    if (!isValidSheetUrl()) { produk = [...produkLokal];
        renderProduk(); return; }
    showLoading();
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const response = await fetch(buildApiUrl('getProducts'), { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error("Gagal fetch produk");
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
            produk = data.map(item => ({
                nama: item.nama_produk,
                ukuran: item.ukuran,
                harga: Number(item.harga),
                kategori: item.kategori,
                foto: item.foto_url || ""
            }));
            console.log("✅ Produk berhasil dimuat dari Google Sheet");
        } else throw new Error("Data kosong");
    } catch (error) {
        console.error("Gagal mengambil produk dari sheet, menggunakan data lokal:", error);
        produk = [...produkLokal];
    } finally { hideLoading();
        renderProduk(); }
}

function showLoading() { document.getElementById('loadingIndicator').style.display = 'block';
    document.getElementById('productList').innerHTML = ''; }

function hideLoading() { document.getElementById('loadingIndicator').style.display = 'none'; }

async function simpanPesanan(dataPesanan) {
    if (!SHEET_API_URL_PESANAN || SHEET_API_URL_PESANAN.trim() === "" || SHEET_API_URL_PESANAN.includes("PASTE_YOUR_URL")) {
        console.warn("URL penyimpanan pesanan belum diatur."); return false;
    }
    try {
        await fetch(SHEET_API_URL_PESANAN, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "saveTransaction", data: dataPesanan })
        });
        console.log("✅ Data pesanan dikirim ke sheet.");
        return true;
    } catch (error) { console.error("Error simpan pesanan:", error); return false; }
}

function renderProduk() {
    const el = document.getElementById("productList");
    let filtered = produk;
    if (currentCategory !== 'all') filtered = filtered.filter(p => p.kategori === currentCategory);
    if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(p => p.nama.toLowerCase().includes(q) || p.kategori.toLowerCase()
            .includes(q) || p.ukuran.toLowerCase().includes(q));
    }
    if (filtered.length === 0) { el.innerHTML =
            '<div class="no-results"><i class="fas fa-search"></i> Tidak ada produk ditemukan</div>'; return; }
    el.innerHTML = filtered.map((p) => {
        const originalIndex = produk.indexOf(p);
        return `
        <div class="card" onclick="addCart(${originalIndex})" title="Klik untuk tambah ke keranjang">
            <span class="badge">${p.kategori}</span>
            <img src="${p.foto}" alt="${p.nama}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1626331307374-ba220ae10793?auto=format&fit=crop&q=80&w=300'">
            <div class="name">${p.nama}</div>
            <div class="size-tag"><i class="fas fa-ruler-combined"></i> ${p.ukuran}</div>
            <div class="price">${formatRupiah(p.harga)}</div>
        </div>`;
    }).join('');
}

function addCart(index) {
    const existing = cart.find(c => c.nama === produk[index].nama && c.ukuran === produk[index].ukuran);
    if (existing) existing.qty += 1;
    else cart.push({ ...produk[index], qty: 1, note: "" });
    renderCart();
}

function removeCart(i) { if (confirm('Hapus item ini dari keranjang?')) { cart.splice(i, 1);
        renderCart(); } }

function clearCart() { if (cart.length === 0) return; if (confirm('Kosongkan seluruh keranjang?')) { cart = [];
        renderCart(); } }

function updateQty(i, val) { cart[i].qty = isNaN(parseInt(val)) || parseInt(val) < 1 ? 1 : parseInt(val);
    renderCart(); }

function updateNote(i, val) { cart[i].note = val; }

function getSubtotal() { return cart.reduce((sum, c) => sum + (c.qty * c.harga), 0); }

function getDiskonAmount() {
    const diskonPct = parseFloat(document.getElementById("diskon").value) || 0;
    return Math.round(getSubtotal() * Math.min(100, Math.max(0, diskonPct)) / 100);
}

function getTotal() {
    const ongkir = parseInt(document.getElementById("ongkir").value) || 0;
    const tambahan = parseInt(document.getElementById("tambahan").value) || 0;
    return getSubtotal() - getDiskonAmount() + ongkir + tambahan;
}

function getUangDiterima() {
    const metode = document.getElementById("metodeBayar").value;
    if (metode === 'DP') {
        return parseInt(document.getElementById("dpDiterima").value) || 0;
    }
    return parseInt(document.getElementById("uangDiterima").value) || 0;
}

function renderCart() {
    const el = document.getElementById("cartList");
    const totalItems = cart.reduce((sum, c) => sum + c.qty, 0);
    document.getElementById("cartCount").textContent = totalItems;
    document.getElementById("cartBadge").textContent = totalItems;
    if (cart.length === 0) {
        el.innerHTML =
            `<div class="cart-empty"><div class="icon"><i class="fas fa-cart-plus"></i></div><p>Keranjang masih kosong</p><small>Klik produk untuk menambahkan</small></div>`;
    } else {
        el.innerHTML = cart.map((c, i) => {
            const sub = c.qty * c.harga;
            return `
            <div class="cart-item">
                <div class="item-header">
                    <div>
                        <div class="item-name">${c.nama}</div>
                        <div class="item-size"><i class="fas fa-ruler-combined"></i> ${c.ukuran}</div>
                    </div>
                    <button class="btn-remove" onclick="removeCart(${i})"><i class="fas fa-times"></i></button>
                </div>
                <div class="item-body">
                    <div class="qty-group">
                        <button onclick="updateQty(${i}, ${c.qty - 1})">−</button>
                        <input type="number" value="${c.qty}" min="1" onchange="updateQty(${i}, this.value)">
                        <button onclick="updateQty(${i}, ${c.qty + 1})">+</button>
                    </div>
                    <span class="item-price">× ${formatRupiah(c.harga)}</span>
                    <span class="item-subtotal">${formatRupiah(sub)}</span>
                </div>
                <input class="item-note" placeholder="📝 Catatan (opsional)" value="${c.note || ''}" oninput="updateNote(${i}, this.value)">
            </div>`;
        }).join('');
    }
    updateSummaryDisplay();
}

function updateSummaryDisplay() {
    document.getElementById("totalDisplay").textContent = formatRupiah(getTotal());
    updateChange();
}

function updateChange() {
    const metode = document.getElementById("metodeBayar").value;
    const uang = getUangDiterima();
    const total = getTotal();
    const change = uang - total;
    const display = document.getElementById("changeDisplay");
    const amountEl = document.getElementById("changeAmount");

    if (metode === 'DP') {
        if (uang > 0 && change >= 0) {
            display.classList.add('show', 'dp-mode');
            display.style.background = '#fffbeb';
            display.style.borderColor = '#fde68a';
            display.style.color = '#92400e';
            display.innerHTML =
                '<i class="fas fa-file-invoice-dollar"></i> Sisa Tagihan: <b id="changeAmount">' + (change === 0 ?
                    'Rp 0 (Lunas)' : formatRupiah(change)) + '</b>';
        } else if (uang > 0 && change < 0) {
            display.classList.add('show', 'dp-mode');
            display.style.background = '#fffbeb';
            display.style.borderColor = '#fde68a';
            display.style.color = '#92400e';
            display.innerHTML =
                '<i class="fas fa-file-invoice-dollar"></i> Sisa Tagihan: <b id="changeAmount">' + formatRupiah(Math
                    .abs(change)) + '</b>';
        } else {
            display.classList.remove('show', 'dp-mode');
        }
    } else if (metode === 'Belum Dibayar') {
        display.classList.remove('show');
    } else {
        display.classList.remove('dp-mode');
        if (uang > 0 && change >= 0) {
            display.classList.add('show');
            display.style.background = '#f0fdf4';
            display.style.borderColor = '#bbf7d0';
            display.style.color = '#27ae60';
            display.innerHTML = '<i class="fas fa-coins"></i> Kembalian: <b id="changeAmount">' + (change === 0 ?
                'Rp 0 (Pas)' : formatRupiah(change)) + '</b>';
        } else if (uang > 0 && change < 0) {
            display.classList.add('show');
            display.style.background = '#fef2f2';
            display.style.borderColor = '#fecaca';
            display.style.color = '#e74c3c';
            display.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Kurang: <b id="changeAmount">' +
                formatRupiah(Math.abs(change)) + '</b>';
        } else {
            display.classList.remove('show');
        }
    }
}

document.getElementById("metodeBayar").addEventListener('change', function() {
    const dpField = document.getElementById("dpField");
    const uangDiterimaEl = document.getElementById("uangDiterima");
    if (this.value === 'DP') {
        dpField.classList.add('show');
        uangDiterimaEl.style.display = 'none';
        if (uangDiterimaEl.previousElementSibling && uangDiterimaEl.previousElementSibling.tagName === 'LABEL') {
            uangDiterimaEl.previousElementSibling.style.display = 'none';
        }
    } else {
        dpField.classList.remove('show');
        uangDiterimaEl.style.display = '';
        if (uangDiterimaEl.previousElementSibling && uangDiterimaEl.previousElementSibling.tagName === 'LABEL') {
            uangDiterimaEl.previousElementSibling.style.display = '';
        }
    }
    updateChange();
    updateSummaryDisplay();
});

document.getElementById("ongkir").addEventListener('input', updateSummaryDisplay);
document.getElementById("tambahan").addEventListener('input', updateSummaryDisplay);
document.getElementById("diskon").addEventListener('input', updateSummaryDisplay);
document.getElementById("uangDiterima").addEventListener('input', () => { updateChange(); updateSummaryDisplay(); });
document.getElementById("dpDiterima").addEventListener('input', () => { updateChange(); updateSummaryDisplay(); });
document.getElementById("searchInput").addEventListener('input', (e) => { searchQuery = e.target.value; renderProduk(); });
document.getElementById("categoryTabs").addEventListener('click', (e) => {
    const tab = e.target.closest('.category-tab');
    if (!tab) return;
    document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentCategory = tab.dataset.cat;
    renderProduk();
});

function generateReceiptHTML(data) {
    const {
        noTransaksi,
        tanggal,
        jam,
        nama,
        alamat,
        kontak,
        estimasi,
        items,
        subtotal,
        diskonPct,
        diskonAmount,
        ongkir,
        tambahan,
        total,
        uangDiterima,
        change,
        metode
    } = data;

    const isDP = metode === 'DP';
    const isBelumDibayar = metode === 'Belum Dibayar';
    const showPaymentDetail = uangDiterima > 0 || isDP;
    const estimasiFormatted = estimasi ? new Date(estimasi).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

    let itemsHTML = items.map(item => {
        const sub = item.qty * item.harga;
        const noteHTML = item.catatan ? `<br><span style="color:#888;font-size:10px;">📝 ${item.catatan}</span>` : '';
        return `
        <tr style="border-bottom:1px solid #e8e8e8;">
            <td style="padding:7px 10px;font-size:12px;color:#222;">${item.nama}${noteHTML}</td>
            <td style="padding:7px 6px;font-size:11px;color:#555;text-align:center;">${item.ukuran}</td>
            <td style="padding:7px 6px;font-size:12px;text-align:center;font-weight:600;">${item.qty}</td>
            <td style="padding:7px 8px;font-size:12px;text-align:right;white-space:nowrap;">${formatRupiah(item.harga)}</td>
            <td style="padding:7px 10px;font-size:12px;text-align:right;font-weight:600;white-space:nowrap;">${formatRupiah(sub)}</td>
        </tr>`;
    }).join('');

    return `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:440px;margin:0 auto;background:#fff;color:#1a1a1a;padding:20px;border:1px solid #eee;border-radius:8px;">
        <div style="text-align:center;padding-bottom:12px;border-bottom:2px dashed #ddd;">
            <h2 style="margin:0;font-size:20px;font-weight:800;color:#1a1a2e;letter-spacing:0.5px;">TS SANGKAR</h2>
            <p style="margin:3px 0 0;font-size:10px;color:#777;">Ahlinya Sangkar Burung Mentah Berkualitas</p>
        </div>
        <div style="padding:10px 0;font-size:11px;border-bottom:1px solid #eee;">
            <table style="width:100%;border-collapse:collapse;">
                <tr>
                    <td style="color:#555;">📅 ${tanggal}</td>
                    <td style="text-align:right;font-weight:700;color:#333;">🕐 ${jam}</td>
                </tr>
                <tr>
                    <td colSpan="2" style="font-weight:700;font-size:12px;color:#1a1a2e;">No: ${noTransaksi}</td>
                </tr>
            </table>
        </div>
        <div style="padding:10px 0;font-size:11px;line-height:1.6;color:#333;border-bottom:1px solid #eee;">
            <div>👤 Pelanggan: <strong>${nama}</strong></div>
            <div>📍 Alamat: ${alamat}</div>
            <div>📞 Kontak: ${kontak}</div>
            ${estimasi ? `<div style="margin-top:2px;">📅 Estimasi PO: <strong>${estimasiFormatted}</strong></div>` : ''}
        </div>
        <div style="padding:8px 0;">
            <table style="width:100%;border-collapse:collapse;">
                <thead>
                    <tr style="background:#f5f5f5;border-bottom:2px solid #ccc;">
                        <th style="padding:6px;font-size:10px;text-align:left;">Produk</th>
                        <th style="padding:6px;font-size:10px;text-align:center;">Ukr</th>
                        <th style="padding:6px;font-size:10px;text-align:center;">Qty</th>
                        <th style="padding:6px;font-size:10px;text-align:right;">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHTML}
                </tbody>
            </table>
        </div>
        <div style="padding:6px 0;font-size:11px;">
            <table style="width:100%;">
                <tr><td>Subtotal</td><td style="text-align:right;">${formatRupiah(subtotal)}</td></tr>
                ${diskonPct > 0 ? `<tr><td style="color:#e74c3c;">Diskon (${diskonPct}%)</td><td style="text-align:right;color:#e74c3c;">-${formatRupiah(diskonAmount)}</td></tr>` : ''}
                <tr><td>Ongkir</td><td style="text-align:right;">${formatRupiah(ongkir)}</td></tr>
                <tr><td>Biaya Tambahan</td><td style="text-align:right;">${formatRupiah(tambahan)}</td></tr>
            </table>
            <div style="border-top:2px solid #1a1a2e;margin:6px 0;"></div>
            <div style="font-size:15px;font-weight:800;text-align:right;color:#1a1a2e;">TOTAL: ${formatRupiah(total)}</div>
            <div style="margin-top:6px;">💳 Metode: <strong>${metode}</strong></div>
            ${showPaymentDetail && !isBelumDibayar ? `<div style="margin-top:2px;">💵 Uang Masuk: <strong>${formatRupiah(uangDiterima)}</strong></div>` : ''}
            ${showPaymentDetail && change >= 0 && uangDiterima > 0 && !isBelumDibayar ? `
            <div style="margin-top:4px;padding:6px;background:#f0fdf4;border-radius:5px;font-weight:700;color:#27ae60;text-align:center;border:1px solid #bbf7d0;">
                ${isDP ? '📋 Sisa Tagihan' : '💰 Kembalian'}: ${formatRupiah(change)}
            </div>` : ''}
            ${showPaymentDetail && change < 0 && uangDiterima > 0 && !isBelumDibayar ? `
            <div style="margin-top:4px;padding:6px;background:#fef2f2;border-radius:5px;font-weight:700;color:#e74c3c;text-align:center;border:1px solid #fecaca;">
                ⚠️ ${isDP ? 'Sisa Tagihan' : 'Kurang'}: ${formatRupiah(Math.abs(change))}
            </div>` : ''}
            ${isBelumDibayar ? `<div style="margin-top:4px;padding:6px;background:#fffbeb;font-size:10px;color:#92400e;text-align:center;border:1px solid #fde68a;">⏳ Pembayaran dilakukan saat pengambilan barang.</div>` : ''}
        </div>
        <div style="text-align:center;margin-top:14px;padding-top:10px;border-top:2px dashed #ddd;font-size:9px;color:#888;">
            <p>🙏 Terima kasih atas kepercayaan Anda</p>
            <p style="font-weight:600;color:#555;">· TS SANGKAR ·</p>
        </div>
    </div>`;
}

function getReceiptData() {
    const nama = document.getElementById("nama").value || 'Pelanggan Umum';
    const alamat = document.getElementById("alamat").value || '-';
    const kontak = document.getElementById("kontak").value || '-';
    const estimasi = document.getElementById("estimasi").value || '';
    const ongkir = parseInt(document.getElementById("ongkir").value) || 0;
    const tambahan = parseInt(document.getElementById("tambahan").value) || 0;
    const diskonPct = parseFloat(document.getElementById("diskon").value) || 0;
    const diskonAmount = getDiskonAmount();
    const total = getTotal();
    const metode = document.getElementById("metodeBayar").value;
    const uangDiterima = getUangDiterima();
    const change = uangDiterima - total;
    const now = new Date();
    const tanggal = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const jam = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const noTransaksi = 'INV-' + now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate())
        .padStart(2, '0') + '-' + String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0') +
        String(now.getSeconds()).padStart(2, '0');

    return {
        noTransaksi,
        tanggal,
        jam,
        nama,
        alamat,
        kontak,
        estimasi,
        items: cart.map(c => ({ nama: c.nama, ukuran: c.ukuran, qty: c.qty, harga: c.harga, catatan: c.note || "" })),
        subtotal: getSubtotal(),
        diskonPct,
        diskonAmount,
        ongkir,
        tambahan,
        total,
        uangDiterima,
        change,
        metode
    };
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => { toast.classList.remove('show'); }, 2800);
}

async function downloadNotaJPG() {
    if (cart.length === 0) { showToast('⚠️ Keranjang masih kosong!'); return; }
    const data = getReceiptData();
    const receiptHTML = generateReceiptHTML(data);
    const captureContainer = document.getElementById('receiptCaptureContainer');
    captureContainer.innerHTML = receiptHTML;
    captureContainer.style.display = 'block';
    await new Promise(resolve => setTimeout(resolve, 300));
    try {
        const canvas = await html2canvas(captureContainer, { backgroundColor: '#ffffff', scale: 2, useCORS: true });
        canvas.toBlob(function(blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Nota_${data.noTransaksi}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('✅ Nota berhasil diunduh!');
        }, 'image/jpeg', 0.95);
    } catch (error) { showToast('❌ Gagal membuat nota gambar'); }
    finally { captureContainer.innerHTML = ''; captureContainer.style.display = 'none'; }
}

async function shareNota() {
    if (cart.length === 0) { showToast('⚠️ Keranjang masih kosong!'); return; }
    const data = getReceiptData();
    const receiptHTML = generateReceiptHTML(data);
    const captureContainer = document.getElementById('receiptCaptureContainer');
    captureContainer.innerHTML = receiptHTML;
    captureContainer.style.display = 'block';
    await new Promise(resolve => setTimeout(resolve, 300));
    try {
        const canvas = await html2canvas(captureContainer, { backgroundColor: '#ffffff', scale: 2, useCORS: true });
        canvas.toBlob(async function(blob) {
            const file = new File([blob], `Nota_${data.noTransaksi}.jpg`, { type: 'image/jpeg' });
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({ title: `Nota`, text: `Nota tagihan TS SANGKAR`, files: [file] });
                } catch (shareError) {
                    downloadNotaJPG();
                }
            } else {
                downloadNotaJPG();
            }
        }, 'image/jpeg', 0.95);
    } catch (error) { showToast('❌ Gagal membagikan gambar'); }
    finally { captureContainer.innerHTML = ''; captureContainer.style.display = 'none'; }
}

async function checkout() {
    if (cart.length === 0) { alert('⚠️ Keranjang masih kosong!'); return; }
    const data = getReceiptData();
    simpanPesanan(data);
    const receiptHTML = generateReceiptHTML(data);
    const htmlFull = `<!DOCTYPE html><html><head><title>Nota TS SANGKAR</title></head><body>${receiptHTML}<script>window.onload=function(){window.print();}<\/script></body></html>`;
    const w = window.open("", "_blank", "width=480,height=750");
    w.document.write(htmlFull);
    w.document.close();
}

function resetAll() {
    if (cart.length > 0 && !confirm('Reset seluruh transaksi?')) return;
    cart = [];
    ['nama', 'alamat', 'kontak', 'estimasi', 'ongkir', 'tambahan', 'diskon', 'uangDiterima', 'dpDiterima'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = id === 'ongkir' || id === 'tambahan' || id === 'diskon' || id === 'uangDiterima' || id === 'dpDiterima' ? '0' : '';
    });
    document.getElementById("metodeBayar").value = 'Tunai';
    document.getElementById("dpField").classList.remove('show');
    document.getElementById("uangDiterima").style.display = '';
    searchQuery = '';
    currentCategory = 'all';
    document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
    document.querySelector('[data-cat="all"]').classList.add('active');
    document.getElementById("changeDisplay").classList.remove('show');
    renderCart();
    renderProduk();
}

function updateClock() {
    const now = new Date();
    document.getElementById("clock").textContent = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    document.getElementById("dateDisplay").textContent = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}
setInterval(updateClock, 1000);
updateClock();

renderCart();
fetchProdukDariSheet();
updateSummaryDisplay();
