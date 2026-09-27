import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  FiPrinter,
  FiArrowLeft,
  FiMapPin,
  FiHash,
  FiCalendar,
  FiDownload,
} from 'react-icons/fi';
import { FaCoins } from 'react-icons/fa';
import { supabase } from '../../lib/supabaseClient';

export default function BatchPrintPage() {
  const { id } = useParams();
  const [coins, setCoins] = useState([]);
  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [batchRes, coinsRes] = await Promise.all([
        supabase
          .from('coin_batches')
          .select('id, quantity, created_at, clubs(name)')
          .eq('id', id)
          .single(),
        supabase
          .from('coins')
          .select('id, token')
          .eq('batch_id', id)
          .order('created_at'),
      ]);
      if (!batchRes.error) setBatch(batchRes.data);
      if (!coinsRes.error) setCoins(coinsRes.data || []);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--canvas)] flex items-center justify-center">
        <p className="text-[var(--ink-subtle)]">Loading batch…</p>
      </div>
    );
  }

  const origin = window.location.origin;
  const clubName = batch?.clubs?.name ?? 'Party';
  const createdAt = batch?.created_at
    ? new Date(batch.created_at).toLocaleDateString()
    : '';

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink)]">
      {/* ---------- Screen-only toolbar ---------- */}
      <div className="print:hidden sticky top-0 z-10
                      border-b border-[var(--hairline)]
                      bg-[var(--canvas)]/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 text-sm
                       text-[var(--ink-muted)] hover:text-[var(--ink)]
                       transition-colors"
          >
            <FiArrowLeft />
            Back to Admin
          </Link>

          <div className="flex items-center gap-3 text-sm flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full
                             bg-[var(--surface)] border border-[var(--hairline)]
                             text-[var(--ink-muted)]">
              <FiMapPin className="text-xs" />
              {clubName}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full
                             bg-[var(--surface)] border border-[var(--hairline)]
                             text-[var(--ink-muted)]">
              <FiHash className="text-xs" />
              {coins.length} codes
            </span>
            {createdAt && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full
                               bg-[var(--surface)] border border-[var(--hairline)]
                               text-[var(--ink-subtle)]">
                <FiCalendar className="text-xs" />
                {createdAt}
              </span>
            )}
          </div>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl
                       bg-[var(--ink)] text-[var(--canvas)]
                       px-5 py-2.5 font-medium text-sm
                       transition-all
                       hover:opacity-90 active:scale-[0.99]"
          >
            <FiPrinter />
            Print Sheet
          </button>
        </div>
      </div>

      {/* ---------- Printable area ---------- */}
      <div className="print-area max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8 flex items-center justify-between
                        border-b border-[var(--hairline)] print:border-black/20
                        pb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl
                            bg-[var(--surface)] border border-[var(--hairline)]
                            flex items-center justify-center
                            print:bg-transparent print:border-black/40">
              <FaCoins className="text-yellow-500 print:text-black text-lg" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em]
                            text-[var(--ink-subtle)] print:text-black/60">
                Coin Batch
              </p>
              <p className="font-semibold text-lg text-[var(--ink)] print:text-black">
                {clubName}
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.2em]
                          text-[var(--ink-subtle)] print:text-black/60">
              Total
            </p>
            <p className="font-semibold text-lg tabular-nums
                          text-[var(--ink)] print:text-black">
              {coins.length} {coins.length === 1 ? 'coin' : 'coins'}
            </p>
          </div>
        </div>

        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5
                        print:grid-cols-4 print:gap-3">
          {coins.map((c, idx) => (
            <CoinCard
              key={c.id}
              index={idx + 1}
              token={c.token}
              url={`${origin}/gold/${c.token}`}
              clubName={clubName}
            />
          ))}
        </div>

        <div className="mt-10 pt-4 border-t border-[var(--hairline)] print:border-black/20
                        flex items-center justify-between text-xs
                        text-[var(--ink-subtle)] print:text-black/60
                        flex-wrap gap-2">
          <span>
            Each QR scans once. First scan opens the claim form; later scans
            show "Coin already used".
          </span>
          <span className="font-mono">
            Batch {id?.slice(0, 8)} • {createdAt}
          </span>
        </div>
      </div>
    </div>
  );
}

function CoinCard({ index, token, url, clubName }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDownloading(true);
    try {
      await downloadQrPng(
        url,
        `coin-${String(index).padStart(3, '0')}-${clubName}-${token}.png`,
        512
      );
    } catch (err) {
      console.error('QR download failed:', err);
      alert('Could not download this QR.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className="coin-card group relative rounded-2xl p-4 overflow-hidden
                 bg-[var(--surface)] border border-[var(--hairline)]
                 transition-colors hover:bg-[var(--surface-hover)]
                 break-inside-avoid
                 print:bg-white print:border-black/30 print:hover:bg-white"
    >
      {/* Download button — appears on hover (screen only) */}
      <button
        type="button"
        onClick={handleDownload}
        disabled={downloading}
        title="Download QR as PNG"
        aria-label="Download QR code"
        className="
          print:hidden
          absolute top-3 right-3 z-10
          w-8 h-8 rounded-lg
          flex items-center justify-center
          bg-[var(--canvas)]/90 backdrop-blur
          border border-[var(--hairline)]
          text-[var(--ink-muted)] hover:text-[var(--ink)]
          opacity-0 scale-90
          group-hover:opacity-100 group-hover:scale-100
          focus-visible:opacity-100 focus-visible:scale-100
          transition-all duration-200 ease-out
          disabled:opacity-60 disabled:cursor-wait
        "
      >
        {downloading ? (
          <span className="w-3.5 h-3.5 rounded-full border-2 border-[var(--ink-subtle)] border-t-[var(--ink)] animate-spin" />
        ) : (
          <FiDownload size={14} />
        )}
      </button>

      {/* Card header — club name + coin index */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 min-w-0">
          <FaCoins className="text-yellow-500 print:text-black text-xs shrink-0" />
          <span className="text-[10px] uppercase tracking-[0.15em]
                           text-[var(--ink-muted)] print:text-black/70 truncate">
            {clubName}
          </span>
        </div>
        <span className="text-[10px] font-mono tabular-nums shrink-0
                         text-[var(--ink-subtle)] print:text-black/60">
          #{String(index).padStart(3, '0')}
        </span>
      </div>

      {/* QR — always white bg so it scans */}
      <div className="flex justify-center mb-3">
        <div className="p-2 rounded-xl bg-white">
          <QRCodeSVG
            value={url}
            size={150}
            bgColor="#ffffff"
            fgColor="#000000"
            level="M"
          />
        </div>
      </div>

      {/* Token */}
      <p className="text-center font-mono text-[10px] truncate
                    text-[var(--ink-subtle)] print:text-black/70">
        {token}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------
// Regenerate the QR at a fixed size and trigger a PNG download.
// We use the `qrcode` package (not qrcode.react) because it can
// produce a raster PNG at any resolution, independent of what's
// rendered on screen.
// ---------------------------------------------------------------
async function downloadQrPng(url, filename, size = 512) {
  const QRCode = (await import('qrcode')).default;

  const dataUrl = await QRCode.toDataURL(url, {
    width: size,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: { dark: '#000000', light: '#ffffff' },
  });

  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}