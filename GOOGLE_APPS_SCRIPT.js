/**
 * GOOGLE APPS SCRIPT (GAS) WEB APP FOR TS SANGKAR KASIR POS SINKRONISASI
 * Versi Terbaru: Dilengkapi Fitur Hapus Transaksi & Pengembalian Stok Otomatis
 * 
 * PETUNJUK INSTALASI:
 * 1. Buka Google Sheet Anda (yang bertindak sebagai database).
 * 2. Klik menu "Ekstensi" (Extensions) -> "Apps Script".
 * 3. Hapus semua kode default di dalam editor Apps Script.
 * 4. Salin seluruh kode di bawah ini dan tempelkan ke editor Apps Script.
 * 5. SANGAT PENTING: Jika ID Google Sheet Anda berbeda, silakan ganti ID spreadsheet 
 *    "17xxS-jxiD2ZQLg0h3rBoutJOBktuz_dKWc8DaUHODG8" di bawah ini dengan ID Google Sheet Anda yang aktif.
 * 6. Klik tombol "Simpan" (ikon disket).
 * 7. Klik tombol "Terapkan" (Deploy) -> "Terapkan baru" (New deployment).
 * 8. Pilih jenis (Select type): Klik ikon gerigi lalu pilih "Aplikasi web" (Web app).
 * 9. Konfigurasikan:
 *    - Deskripsi: Versi Terbaru POS (Dengan Hapus Transaksi & Restorasi Stok)
 *    - Jalankan sebagai (Execute as): "Saya" (Me - email Anda)
 *    - Siapa yang memiliki akses (Who has access): "Siapa saja" (Anyone)
 * 10. Klik "Terapkan" (Deploy). Jika diminta izin akses, klik "Berikan akses" (Grant Access) dan pilih akun Google Anda.
 * 11. Salin "URL Aplikasi Web" yang dihasilkan dan masukkan ke halaman Pengaturan di aplikasi Kasir Anda.
 */

// SANGAT PENTING: Ganti ID ini dengan ID Spreadsheet Anda jika Anda membuat Sheet baru!
const SPREADSHEET_ID = "17xxS-jxiD2ZQLg0h3rBoutJOBktuz_dKWc8DaUHODG8";

function doGet(e) {
  try {
    const action = e && e.parameter && e.parameter.action;
    if (action === "getProducts") {
      const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      let sheet = ss.getSheetByName("Produk");
      if (!sheet) {
        sheet = ss.insertSheet("Produk");
        sheet.appendRow(["ID", "Kategori", "Nama Produk", "Ukuran", "Tipe", "Harga", "Foto URL", "Stok", "Harga Pokok"]);
      }
      const data = sheet.getDataRange().getValues();
      if (data.length <= 1) {
        return ContentService.createTextOutput(JSON.stringify([]))
          .setMimeType(ContentService.MimeType.JSON);
      }
      const rows = data.slice(1);
      const result = rows.map((row) => ({
        id: row[0],
        kategori: row[1],
        nama_produk: row[2],
        ukuran: row[3],
        tipe: row[4],
        harga: safeCleanNumber(row[5]),
        foto_url: row[6],
        stok: row[7] !== undefined && row[7] !== "" ? safeCleanNumber(row[7]) : 100,
        harga_pokok: row[8] !== undefined && row[8] !== "" ? safeCleanNumber(row[8]) : 0 // Membaca kolom ke-9 secara presisi
      }));
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "GAS Aktif" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Helper untuk membersihkan angka dari format rupiah/format lokal yang salah tafsir
function safeCleanNumber(val) {
  if (val === undefined || val === null || val === "") return 0;
  if (typeof val === "number") return val;
  
  var cleaned = String(val).trim();
  cleaned = cleaned.replace(/^(Rp\.?\s*|IDR\s*|\$)/gi, ""); // Bersihkan Rp
  
  // Jika ada pemisah ribuan titik khas Indonesia seperti 10.000 atau 150.000
  if (cleaned.indexOf(".") !== -1 && cleaned.indexOf(",") === -1) {
    var parts = cleaned.split(".");
    if (parts.length > 1 && parts[parts.length - 1].length === 3) {
      cleaned = cleaned.replace(/\./g, ""); // Hapus titik pemisah ribuan
    }
  }
  
  var parsed = Number(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

// Helper untuk mencari baris produk berdasarkan ID atau Nama & Ukuran
function findProductRow(sheet, data, targetId, targetNama, targetUkuran) {
  const normTargetId = targetId ? String(targetId).trim().toLowerCase() : "";
  const normNama = targetNama ? String(targetNama).trim().toLowerCase() : "";
  const normUkuran = targetUkuran ? String(targetUkuran).trim().toLowerCase() : "";

  console.log("findProductRow - Pencarian: ID_Target='" + normTargetId + "', Nama_Target='" + normNama + "', Ukuran_Target='" + normUkuran + "'");

  const numTargetId = (targetId && !isNaN(Number(targetId))) ? Number(targetId) : null;

  for (let i = 1; i < data.length; i++) {
    const cellVal = data[i][0];
    if (cellVal !== undefined && cellVal !== null && cellVal !== "") {
      const dbIdStr = String(cellVal).trim().toLowerCase();
      if (dbIdStr === normTargetId && normTargetId !== "" && !normTargetId.startsWith("temp-")) {
        return i + 1;
      }
      const numDbId = Number(cellVal);
      if (numTargetId !== null && !isNaN(numDbId) && numDbId === numTargetId && normTargetId !== "" && !normTargetId.startsWith("temp-")) {
        return i + 1;
      }
    }

    const dbNama = String(data[i][2] || "").trim().toLowerCase();
    const dbUkuran = String(data[i][3] || "").trim().toLowerCase();
    
    if (normNama !== "" && normUkuran !== "" && dbNama === normNama && dbUkuran === normUkuran) {
      return i + 1;
    }
  }
  return -1;
}

// Helper pintar untuk mencari indeks kolom berdasarkan nama header (jika belum ada, akan dibuat otomatis)
function getOrCreateColumnIndex(sheet, columnName) {
  const lastCol = Math.max(1, sheet.getLastColumn());
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  for (let i = 0; i < headers.length; i++) {
    if (headers[i] && headers[i].toString().trim().toLowerCase() === columnName.toLowerCase()) {
      return i + 1; // Mengembalikan indeks kolom (1-based)
    }
  }
  // Jika kolom belum ada, buat kolom baru di ujung kanan
  const nextCol = sheet.getLastColumn() + 1;
  sheet.getRange(1, nextCol).setValue(columnName);
  return nextCol;
}

// Helper untuk mengisi data satu baris berdasarkan nama header (sangat aman & dinamis)
function setRowValuesByHeader(sheet, rowIndex, dataMap) {
  for (let colName in dataMap) {
    const colIndex = getOrCreateColumnIndex(sheet, colName);
    sheet.getRange(rowIndex, colIndex).setValue(dataMap[colName]);
  }
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "No post data received" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const body = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const action = body.action;
    
    // --- 1. SIMPAN PESANAN DAN POTONG STOK ---
    if (action === "saveTransaction") {
      let sheet = ss.getSheetByName("Pesanan");
      if (!sheet) {
        sheet = ss.insertSheet("Pesanan");
        sheet.appendRow(["noTransaksi", "tanggal", "nama", "alamat", "kontak", "estimasi", "items", "subtotal", "diskonPct", "diskonAmount", "ongkir", "tambahan", "total", "uangDiterima", "change", "metode", "WAKTU", "status"]);
      }
      
      const d = body.data;
      const nextRow = sheet.getLastRow() + 1;
      
      // Mengemas data pesanan baru
      const rowData = {
        "noTransaksi": d.noTransaksi || "",
        "tanggal": d.tanggal || "",
        "nama": d.nama || "",
        "alamat": d.alamat || "",
        "kontak": d.kontak || "",
        "estimasi": d.estimasi || "",
        "items": JSON.stringify(d.items || []),
        "subtotal": d.subtotal || 0,
        "diskonPct": d.diskonPct || 0,
        "diskonAmount": d.diskonAmount || 0,
        "ongkir": d.ongkir || 0,
        "tambahan": d.tambahan || 0,
        "total": d.total || 0,
        "uangDiterima": d.uangDiterima || 0,
        "change": d.change || 0,
        "metode": d.metode || "Tunai",
        "WAKTU": new Date().toLocaleString('id-ID'),
        "status": d.status || "Sedang Proses" // Status awal pesanan baru
      };
      
      // Simpan pesanan dengan presisi kolom
      setRowValuesByHeader(sheet, nextRow, rowData);

      // Potong stok produk di tab "Produk"
      try {
        const sheetProduk = ss.getSheetByName("Produk");
        if (sheetProduk) {
          const prodData = sheetProduk.getDataRange().getValues();
          const items = d.items || [];
          
          items.forEach(function(item) {
            const itemNama = String(item.nama || "").trim().toLowerCase();
            const itemUkuran = String(item.ukuran || "").trim().toLowerCase();
            
            for (let i = 1; i < prodData.length; i++) {
              const dbNama = String(prodData[i][2] || "").trim().toLowerCase();
              const dbUkuran = String(prodData[i][3] || "").trim().toLowerCase();
              
              if (dbNama === itemNama && dbUkuran === itemUkuran) {
                let currentStock = Number(prodData[i][7]);
                if (isNaN(currentStock)) currentStock = 100;
                const newStock = Math.max(0, currentStock - Number(item.qty || 1));
                sheetProduk.getRange(i + 1, 8).setValue(newStock); 
                break;
              }
            }
          });
        }
      } catch (stkErr) {
        console.log("Error reducing stok:", stkErr);
      }

      return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // --- 1B. EDIT TRANSAKSI (PESANAN) & KALKULASI ULANG STOK ---
    if (action === "editTransaction") {
      const sheet = ss.getSheetByName("Pesanan");
      if (!sheet) {
        return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Tab Pesanan tidak ditemukan" }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      const d = body.data;
      const targetNo = String(d.noTransaksi || "").trim();
      const data = sheet.getDataRange().getValues();
      
      // Temukan baris transaksi
      let foundRowIndex = -1;
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] && String(data[i][0]).trim() === targetNo) {
          foundRowIndex = i + 1;
          break;
        }
      }
      
      if (foundRowIndex === -1) {
        return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Transaksi tidak ditemukan" }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      // LANGKAH A: Kembalikan (Restore) stok barang dari rincian lama terlebih dahulu
      try {
        const sheetProduk = ss.getSheetByName("Produk");
        if (sheetProduk) {
          const itemsColIdx = getOrCreateColumnIndex(sheet, "items");
          const oldItemsRaw = sheet.getRange(foundRowIndex, itemsColIdx).getValue();
          let oldItems = [];
          if (oldItemsRaw && String(oldItemsRaw).trim().startsWith("[")) {
            oldItems = JSON.parse(oldItemsRaw);
          }
          
          const prodData = sheetProduk.getDataRange().getValues();
          oldItems.forEach(function(item) {
            const itemNama = String(item.nama || "").trim().toLowerCase();
            const itemUkuran = String(item.ukuran || "").trim().toLowerCase();
            
            for (let i = 1; i < prodData.length; i++) {
              const dbNama = String(prodData[i][2] || "").trim().toLowerCase();
              const dbUkuran = String(prodData[i][3] || "").trim().toLowerCase();
              
              if (dbNama === itemNama && dbUkuran === itemUkuran) {
                let currentStock = Number(prodData[i][7]);
                if (isNaN(currentStock)) currentStock = 100;
                sheetProduk.getRange(i + 1, 8).setValue(currentStock + Number(item.qty || 1));
                break;
              }
            }
          });
        }
      } catch (stkErr) {
        console.log("Error restoring stock on edit:", stkErr);
      }
      
      // LANGKAH B: Perbarui Baris Transaksi dengan data yang baru
      const rowData = {
        "noTransaksi": d.noTransaksi || "",
        "tanggal": d.tanggal || "",
        "nama": d.nama || "",
        "alamat": d.alamat || "",
        "kontak": d.kontak || "",
        "estimasi": d.estimasi || "",
        "items": JSON.stringify(d.items || []),
        "subtotal": d.subtotal || 0,
        "diskonPct": d.diskonPct || 0,
        "diskonAmount": d.diskonAmount || 0,
        "ongkir": d.ongkir || 0,
        "tambahan": d.tambahan || 0,
        "total": d.total || 0,
        "uangDiterima": d.uangDiterima || 0,
        "change": d.change || 0,
        "metode": d.metode || "Tunai",
        "WAKTU": new Date().toLocaleString('id-ID')
      };
      if (d.status) {
        rowData["status"] = d.status;
      }
      
      setRowValuesByHeader(sheet, foundRowIndex, rowData);
      
      // LANGKAH C: Kurangi stok berdasarkan rincian barang yang baru
      try {
        const sheetProduk = ss.getSheetByName("Produk");
        if (sheetProduk) {
          const prodData = sheetProduk.getDataRange().getValues(); // Refresh daftar stok produk
          const items = d.items || [];
          
          items.forEach(function(item) {
            const itemNama = String(item.nama || "").trim().toLowerCase();
            const itemUkuran = String(item.ukuran || "").trim().toLowerCase();
            
            for (let i = 1; i < prodData.length; i++) {
              const dbNama = String(prodData[i][2] || "").trim().toLowerCase();
              const dbUkuran = String(prodData[i][3] || "").trim().toLowerCase();
              
              if (dbNama === itemNama && dbUkuran === itemUkuran) {
                let currentStock = Number(prodData[i][7]);
                if (isNaN(currentStock)) currentStock = 100;
                const newStock = Math.max(0, currentStock - Number(item.qty || 1));
                sheetProduk.getRange(i + 1, 8).setValue(newStock); 
                break;
              }
            }
          });
        }
      } catch (stkErr) {
        console.log("Error reducing stock on edit:", stkErr);
      }
      
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Pesanan berhasil diedit & stok diperbarui" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // --- 1C. UPDATE STATUS TRANSAKSI (SELESAI / SEDANG PROSES) ---
    if (action === "updateTransactionStatus") {
      const sheet = ss.getSheetByName("Pesanan");
      if (!sheet) {
        return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Tab Pesanan tidak ditemukan" }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      const d = body.data;
      const targetNo = String(d.noTransaksi || "").trim();
      const status = d.status || "Sedang Proses";
      const data = sheet.getDataRange().getValues();
      
      // Temukan baris transaksi berdasarkan Nomor Transaksi
      let foundRowIndex = -1;
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] && String(data[i][0]).trim() === targetNo) {
          foundRowIndex = i + 1;
          break;
        }
      }
      
      if (foundRowIndex === -1) {
        return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Transaksi tidak ditemukan" }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      // Temukan atau buat kolom status lalu simpan status baru
      const statusColIndex = getOrCreateColumnIndex(sheet, "status");
      sheet.getRange(foundRowIndex, statusColIndex).setValue(status);
      
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Status pesanan berhasil diperbarui" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // --- 1D. HAPUS TRANSAKSI (PESANAN) & KEMBALIKAN (RESTORE) STOK ---
    if (action === "deleteTransaction") {
      const sheet = ss.getSheetByName("Pesanan");
      if (!sheet) {
        return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Tab Pesanan tidak ditemukan" }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      const d = body.data;
      const targetNo = String(d.noTransaksi || "").trim();
      const data = sheet.getDataRange().getValues();
      
      // Temukan baris transaksi
      let foundRowIndex = -1;
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] && String(data[i][0]).trim() === targetNo) {
          foundRowIndex = i + 1;
          break;
        }
      }
      
      if (foundRowIndex === -1) {
        return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Transaksi tidak ditemukan" }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      // Kembalikan (Restore) stok barang dari rincian sebelum dihapus
      try {
        const sheetProduk = ss.getSheetByName("Produk");
        if (sheetProduk) {
          const itemsColIdx = getOrCreateColumnIndex(sheet, "items");
          const oldItemsRaw = sheet.getRange(foundRowIndex, itemsColIdx).getValue();
          let oldItems = [];
          if (oldItemsRaw && String(oldItemsRaw).trim().startsWith("[")) {
            oldItems = JSON.parse(oldItemsRaw);
          }
          
          const prodData = sheetProduk.getDataRange().getValues();
          oldItems.forEach(function(item) {
            const itemNama = String(item.nama || "").trim().toLowerCase();
            const itemUkuran = String(item.ukuran || "").trim().toLowerCase();
            
            for (let i = 1; i < prodData.length; i++) {
              const dbNama = String(prodData[i][2] || "").trim().toLowerCase();
              const dbUkuran = String(prodData[i][3] || "").trim().toLowerCase();
              
              if (dbNama === itemNama && dbUkuran === itemUkuran) {
                let currentStock = Number(prodData[i][7]);
                if (isNaN(currentStock)) currentStock = 100;
                sheetProduk.getRange(i + 1, 8).setValue(currentStock + Number(item.qty || 1));
                break;
              }
            }
          });
        }
      } catch (stkErr) {
        console.log("Error restoring stock on delete:", stkErr);
      }
      
      // Hapus baris pesanan tersebut
      sheet.deleteRow(foundRowIndex);
      
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Transaksi " + targetNo + " berhasil dihapus dan stok dikembalikan!" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // --- 2. TAMBAH PRODUK BARU ---
    if (action === "addProduct") {
      let sheet = ss.getSheetByName("Produk");
      if (!sheet) {
        sheet = ss.insertSheet("Produk");
        sheet.appendRow(["ID", "Kategori", "Nama Produk", "Ukuran", "Tipe", "Harga", "Foto URL", "Stok", "Harga Pokok"]);
      }
      
      const newP = body.data;
      let newId = "";
      if (newP.id && String(newP.id).trim() !== "") {
        newId = String(newP.id).trim();
      } else {
        const randStr = Math.random().toString(36).substring(2, 6).toUpperCase();
        newId = "PRD-" + randStr;
      }
      
      sheet.appendRow([
        newId,
        newP.kategori || "",
        newP.nama_produk || "",
        newP.ukuran || "",
        newP.tipe || "Mentah",
        safeCleanNumber(newP.harga),
        newP.foto_url || "",
        newP.stok !== undefined ? safeCleanNumber(newP.stok) : 100,
        newP.harga_pokok !== undefined ? safeCleanNumber(newP.harga_pokok) : 0
      ]);

      return ContentService.createTextOutput(JSON.stringify({ status: "success", id: newId }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // --- 3. EDIT PRODUK ---
    if (action === "editProduct") {
      const sheet = ss.getSheetByName("Produk");
      if (!sheet) {
        return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Tab Produk tidak ditemukan" }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      const data = sheet.getDataRange().getValues();
      const targetId = String(body.data.id || "").trim();
      const targetNama = String(body.data.nama_produk || "").trim().toLowerCase();
      const targetUkuran = String(body.data.ukuran || "").trim().toLowerCase();
      
      const foundRow = findProductRow(sheet, data, targetId, targetNama, targetUkuran);
      
      if (foundRow !== -1) {
        if (foundRow < 2) {
          return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Gagal: Berusaha mengedit baris header utama." }))
            .setMimeType(ContentService.MimeType.JSON);
        }
        const u = body.data;
        sheet.getRange(foundRow, 2).setValue(u.kategori || "");
        sheet.getRange(foundRow, 3).setValue(u.nama_produk || "");
        sheet.getRange(foundRow, 4).setValue(u.ukuran || "");
        sheet.getRange(foundRow, 5).setValue(u.tipe || "Mentah");
        sheet.getRange(foundRow, 6).setValue(safeCleanNumber(u.harga));
        sheet.getRange(foundRow, 7).setValue(u.foto_url || "");
        sheet.getRange(foundRow, 8).setValue(u.stok !== undefined ? safeCleanNumber(u.stok) : 100);
        sheet.getRange(foundRow, 9).setValue(u.harga_pokok !== undefined ? safeCleanNumber(u.harga_pokok) : 0); // Perbaiki update Harga Pokok di kolom 9
        
        return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Produk berhasil diperbarui pada baris " + foundRow }))
          .setMimeType(ContentService.MimeType.JSON);
      } else {
        return ContentService.createTextOutput(JSON.stringify({ 
          status: "error", 
          message: "Produk tidak ditemukan di database." 
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // --- 4. HAPUS PRODUK ---
    if (action === "deleteProduct") {
      const sheet = ss.getSheetByName("Produk");
      if (!sheet) {
        return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Tab Produk tidak ditemukan" }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      const data = sheet.getDataRange().getValues();
      const targetId = String(body.data.id || "").trim();
      const targetNama = String(body.data.nama_produk || "").trim().toLowerCase();
      const targetUkuran = String(body.data.ukuran || "").trim().toLowerCase();
      
      const foundRow = findProductRow(sheet, data, targetId, targetNama, targetUkuran);
      
      if (foundRow !== -1) {
        if (foundRow < 2) {
          return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Gagal: Berusaha menghapus baris header utama." }))
            .setMimeType(ContentService.MimeType.JSON);
        }
        sheet.deleteRow(foundRow);
        return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Produk berhasil dihapus" }))
          .setMimeType(ContentService.MimeType.JSON);
      } else {
        return ContentService.createTextOutput(JSON.stringify({ 
          status: "error", 
          message: "Produk tidak ditemukan di database." 
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Action not found: " + action }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
