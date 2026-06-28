import { TransactionData } from '../types';

interface ReceiptProps {
  data: TransactionData;
}

export default function Receipt({ data }: ReceiptProps) {
  // Read customized store details dynamically from localStorage with offline fallback
  let storeName = 'KASIR PINTAR';
  let storeSlogan = 'Menyediakan Berbagai Kebutuhan Berkualitas';
  let storeDetailAlamat = '🌐 santridev.github.io | 📞 0812-3456-7890';
  let storeLogo = 'store.png';

  try {
    const configStr = typeof window !== 'undefined' ? localStorage.getItem('ts_sangkar_store_config') : null;
    if (configStr) {
      const config = JSON.parse(configStr);
      if (config.namaToko) storeName = config.namaToko;
      if (config.sloganToko) storeSlogan = config.sloganToko;
      if (config.alamatToko) storeDetailAlamat = config.alamatToko;
      if (config.logoToko) storeLogo = config.logoToko;
    }
  } catch (e) {
    console.error('Failed to parse store config from localStorage', e);
  }

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
    metode,
  } = data;

  const isDP = metode === 'DP';
  const isBelumDibayar = metode === 'Belum Dibayar';
  const showPaymentDetail = uangDiterima > 0 || isDP;

  const formatRupiah = (angka: number) => {
    return 'Rp ' + angka.toLocaleString('id-ID');
  };

  const estimasiFormatted = estimasi
    ? new Date(estimasi).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  const metodeLabelMap: Record<string, string> = {
    'Tunai': '💵 Tunai',
    'Transfer': '📱 Transfer',
    'QRIS': '📲 QRIS',
    'Kartu Debit': '💳 Kartu Debit',
    'Kartu Kredit': '💎 Kartu Kredit',
    'DP': '🏷️ DP (Uang Muka)',
    'Belum Dibayar': '⏳ Belum Dibayar',
  };
  const metodeLabel = metodeLabelMap[metode] || metode;

  return (
    <div
      style={{
        fontFamily: "'Segoe UI', Arial, sans-serif",
        width: '460px',
        margin: '0 auto',
        background: '#ffffff',
        color: '#1a1a1a',
        padding: '24px',
        boxShadow: '0 4px 6px -1px rgb(0px 0px 0px / 0.1), 0 2px 4px -2px rgb(0px 0px 0px / 0.1)',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
      }}
    >
      {/* HEADER */}
      <div style={{ textAlign: 'center', paddingBottom: '16px', borderBottom: '2px dashed #e5e7eb' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '8px' }}>
          <img
            src={storeLogo}
            alt="Logo"
            onError={(e) => {
              // If image fails, provide fallback logo visual
              (e.currentTarget as HTMLImageElement).style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent && !parent.querySelector('.fallback-emblem')) {
                const dummy = document.createElement('div');
                dummy.className = 'fallback-emblem';
                dummy.style.width = '55px';
                dummy.style.height = '55px';
                dummy.style.borderRadius = '50%';
                dummy.style.background = '#49496a';
                dummy.style.color = '#ffffff';
                dummy.style.display = 'flex';
                dummy.style.alignItems = 'center';
                dummy.style.justifyContent = 'center';
                dummy.style.fontSize = '20px';
                dummy.style.fontWeight = 'bold';
                dummy.style.marginBottom = '6px';
                dummy.textContent = storeName.substring(0, 2).toUpperCase();
                parent.appendChild(dummy);
              }
            }}
            style={{ width: '85px', height: 'auto', objectFit: 'contain' }}
          />
        </div>
        <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#1a1a2e', letterSpacing: '0.5px' }}>
          {storeName}
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#6b7280', letterSpacing: '0.4px' }}>
          {storeSlogan}
        </p>
      </div>

      {/* METADATA */}
      <div style={{ padding: '12px 0', fontSize: '11px', borderBottom: '1px solid #f3f4f6' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '2px 0', color: '#4b5563' }}>📅 {tanggal}</td>
              <td style={{ textAlign: 'right', fontWeight: 700, color: '#1f2937' }}>🕐 {jam}</td>
            </tr>
            <tr>
              <td colSpan={2} style={{ padding: '4px 0 0', fontWeight: 700, fontSize: '13px', color: '#111827', letterSpacing: '0.5px' }}>
                No: {noTransaksi}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* CUSTOMER INFO */}
      <div style={{ padding: '12px 0', fontSize: '12px', lineHeight: '1.6', color: '#1f2937', borderBottom: '1px solid #f3f4f6' }}>
        <div>
          <span style={{ color: '#6b7280' }}>👤 Pelanggan:</span>{' '}
          <strong style={{ color: '#111827' }}>{nama}</strong>
        </div>
        <div style={{ wordBreak: 'break-word' }}>
          <span style={{ color: '#6b7280' }}>📍 Alamat:</span> {alamat}
        </div>
        <div>
          <span style={{ color: '#6b7280' }}>📞 Kontak:</span> {kontak}
        </div>
        {estimasi ? (
          <div style={{ marginTop: '2px' }}>
            <span style={{ color: '#6b7280' }}>📅 Estimasi Pre-order:</span>{' '}
            <strong style={{ color: '#111827' }}>{estimasiFormatted}</strong>
          </div>
        ) : null}
      </div>

      {/* ITEM TABLE */}
      <div style={{ padding: '12px 0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
              <th style={{ padding: '8px 4px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#4b5563', textAlign: 'left', fontWeight: 'bold' }}>
                Produk
              </th>
              <th style={{ padding: '8px 4px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#4b5563', textAlign: 'center', fontWeight: 'bold' }}>
                Var
              </th>
              <th style={{ padding: '8px 4px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#4b5563', textAlign: 'center', fontWeight: 'bold' }}>
                Qty
              </th>
              <th style={{ padding: '8px 4px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#4b5563', textAlign: 'right', fontWeight: 'bold' }}>
                Harga
              </th>
              <th style={{ padding: '8px 4px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#4b5563', textAlign: 'right', fontWeight: 'bold' }}>
                Subtotal
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '8px 4px', fontSize: '12px', color: '#111827' }}>
                  {item.nama}
                  {item.catatan ? (
                    <div style={{ color: '#6b7280', fontSize: '10px', marginTop: '2px' }}>
                      📝 {item.catatan}
                    </div>
                  ) : null}
                </td>
                <td style={{ padding: '8px 4px', fontSize: '11px', color: '#4b5563', textAlign: 'center' }}>
                  {item.ukuran}
                </td>
                <td style={{ padding: '8px 4px', fontSize: '12px', textAlign: 'center', fontWeight: 600 }}>
                  {item.qty}
                </td>
                <td style={{ padding: '8px 4px', fontSize: '12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {formatRupiah(item.harga)}
                </td>
                <td style={{ padding: '8px 4px', fontSize: '12px', textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {formatRupiah(item.qty * item.harga)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* TOTAL BAR */}
      <div style={{ padding: '8px 4px', fontSize: '11px', color: '#1f2937' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '4px 0', color: '#4b5563' }}>Subtotal</td>
              <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatRupiah(subtotal)}</td>
            </tr>
            {diskonPct > 0 ? (
              <tr>
                <td style={{ padding: '4px 0', color: '#dc2626' }}>Diskon ({diskonPct}%)</td>
                <td style={{ textAlign: 'right', color: '#dc2626', fontWeight: 600 }}>
                  -{formatRupiah(diskonAmount)}
                </td>
              </tr>
            ) : null}
            <tr>
              <td style={{ padding: '4px 0', color: '#4b5563' }}>Ongkir</td>
              <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatRupiah(ongkir)}</td>
            </tr>
            <tr>
              <td style={{ padding: '4px 0', color: '#4b5563' }}>Biaya Tambahan</td>
              <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatRupiah(tambahan)}</td>
            </tr>
          </tbody>
        </table>

        <div style={{ borderTop: '2px solid #111827', margin: '8px 0 4px' }}></div>
        <div style={{ fontSize: '17px', fontWeight: 800, textAlign: 'right', color: '#111827', letterSpacing: '0.5px' }}>
          TOTAL: {formatRupiah(total)}
        </div>

        <div style={{ marginTop: '8px', fontSize: '11px', color: '#4b5563' }}>
          💳 Metode: <strong>{metodeLabel}</strong>
        </div>

        {showPaymentDetail && !isBelumDibayar ? (
          <div style={{ marginTop: '3px', fontSize: '11px', color: '#4b5563' }}>
            {isDP ? '💵 DP Diterima' : '💵 Uang Diterima'}: <strong>{formatRupiah(uangDiterima)}</strong>
          </div>
        ) : null}

        {showPaymentDetail && change >= 0 && uangDiterima > 0 && !isBelumDibayar ? (
          <div
            style={{
              marginTop: '6px',
              padding: '6px 10px',
              background: '#f0fdf4',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '12px',
              color: '#16a34a',
              textAlign: 'center',
              border: '1px solid #bbf7d0',
            }}
          >
            {isDP ? '📋 Sisa Tagihan' : '💰 Kembalian'}:{' '}
            {change === 0 ? (isDP ? 'Rp 0 (Lunas)' : 'Rp 0 (Pas)') : formatRupiah(change)}
          </div>
        ) : null}

        {showPaymentDetail && change < 0 && uangDiterima > 0 && !isBelumDibayar ? (
          <div
            style={{
              marginTop: '6px',
              padding: '6px 10px',
              background: '#fef2f2',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '12px',
              color: '#dc2626',
              textAlign: 'center',
              border: '1px solid #fecaca',
            }}
          >
            ⚠️ {isDP ? 'Sisa Tagihan' : 'Kurang'}: {formatRupiah(Math.abs(change))}
          </div>
        ) : null}

        {isBelumDibayar ? (
          <div
            style={{
              marginTop: '8px',
              padding: '8px 10px',
              background: '#fffbeb',
              borderRadius: '6px',
              fontSize: '10px',
              color: '#b45309',
              textAlign: 'center',
              border: '1px solid #fef3c7',
            }}
          >
            ⏳ Pembayaran dilakukan saat pengambilan barang.
          </div>
        ) : null}

        {isDP && change > 0 ? (
          <div
            style={{
              marginTop: '6px',
              padding: '6px 10px',
              background: '#fffbeb',
              borderRadius: '6px',
              fontSize: '10px',
              color: '#b45309',
              textAlign: 'center',
              border: '1px solid #fef3c7',
            }}
          >
            📝 Sisa pembayaran <strong>{formatRupiah(change)}</strong> dilunasi saat pengambilan barang.
          </div>
        ) : null}
      </div>

      {/* FOOTER */}
      <div style={{ textAlign: 'center', marginTop: '16px', paddingTop: '12px', fontSize: '9px', color: '#6b7280', borderTop: '2px dashed #e5e7eb' }}>
        <p style={{ margin: '2px 0' }}>🙏 Terima kasih atas kepercayaan Anda</p>
        <p style={{ margin: '2px 0', fontWeight: 600, color: '#374151', fontSize: '10px' }}>· {storeName} ·</p>
        <p style={{ margin: '2px 0' }}>{storeDetailAlamat}</p>
        <p style={{ margin: '6px 0 0', fontSize: '8px', color: '#9ca3af' }}>
          Dicetak: {tanggal} {jam} · No: {noTransaksi}
        </p>
      </div>
    </div>
  );
}
