import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import {
  FiPlus,
  FiTrash2,
  FiUser,
  FiLink,
  FiImage,
  FiCheckCircle,
  FiGrid,
  FiHash,
  FiHome,
  FiExternalLink,
  FiClock,
} from 'react-icons/fi';
import { HiOutlineSparkles } from 'react-icons/hi';
import { supabase } from '../../lib/supabaseClient';
import {
  adminAddDj,
  adminDeleteDj,
  clearLastAdded,
} from '../djs/adminSlice';
import { fetchDjs } from '../djs/djSlice';
import { fetchClubs } from '../shoutouts/shoutoutSlice';

export default function AdminPanel() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { submitting, deleting, error, lastAdded } = useSelector((s) => s.admin);
  const { list } = useSelector((s) => s.djs);
  const { clubs } = useSelector((s) => s.shoutouts);

  const [batches, setBatches] = useState([]);

  const [form, setForm] = useState({
    stageName: '',
    musicLink: '',
    coverUrl: '',
  });

  const [batchForm, setBatchForm] = useState({ clubName: '', quantity: 25 });
  const [batchBusy, setBatchBusy] = useState(false);
  const [batchError, setBatchError] = useState(null);

  useEffect(() => {
    dispatch(fetchDjs());
    dispatch(fetchClubs());

    (async () => {
      const { data } = await supabase
        .from('coin_batches')
        .select('id, quantity, created_at, clubs(name)')
        .order('created_at', { ascending: false })
        .limit(50);
      if (data) setBatches(data);
    })();
  }, [dispatch]);

  useEffect(() => {
    if (!lastAdded) return;
    const t = setTimeout(() => dispatch(clearLastAdded()), 4000);
    return () => clearTimeout(t);
  }, [lastAdded, dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await dispatch(adminAddDj(form));
    if (adminAddDj.fulfilled.match(res)) {
      setForm({ stageName: '', musicLink: '', coverUrl: '' });
    }
  };

  const handleDelete = (dj) => {
    if (!confirm(`Remove ${dj.stage_name} from the leaderboard?`)) return;
    dispatch(adminDeleteDj({ djId: dj.id }));
  };

  const generateBatch = async () => {
    setBatchBusy(true);
    setBatchError(null);

    const clubName = batchForm.clubName.trim();
    const qty = Number(batchForm.quantity);

    if (!clubName) {
      setBatchBusy(false);
      return setBatchError('Enter a club name');
    }
    if (clubName.length > 60) {
      setBatchBusy(false);
      return setBatchError('Club name is too long (60 chars max)');
    }
    if (!Number.isInteger(qty) || qty < 1 || qty > 500) {
      setBatchBusy(false);
      return setBatchError('Quantity must be between 1 and 500');
    }

    const { data: existing, error: findErr } = await supabase
      .from('clubs')
      .select('id, name')
      .ilike('name', clubName)
      .maybeSingle();

    if (findErr) {
      setBatchBusy(false);
      return setBatchError(findErr.message);
    }

    let clubId = existing?.id;
    if (!clubId) {
      const { data: created, error: createErr } = await supabase
        .from('clubs')
        .insert({ name: clubName })
        .select('id, name')
        .single();
      if (createErr) {
        setBatchBusy(false);
        return setBatchError(createErr.message);
      }
      clubId = created.id;
    }

    const { data, error } = await supabase.rpc('generate_coin_batch', {
      p_club_id: clubId,
      p_quantity: qty,
    });

    setBatchBusy(false);

    if (error) return setBatchError(error.message);
    if (!data?.success) return setBatchError(data?.error || 'failed');

    dispatch(fetchClubs());

    const { data: refreshed } = await supabase
      .from('coin_batches')
      .select('id, quantity, created_at, clubs(name)')
      .order('created_at', { ascending: false })
      .limit(50);
    if (refreshed) setBatches(refreshed);

    navigate(`/admin/batches/${data.batch_id}`);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#08060f]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 w-[32rem] h-[32rem] rounded-full bg-purple-600/25 blur-[130px] animate-pulse-slow" />
        <div className="absolute top-1/3 -right-40 w-[30rem] h-[30rem] rounded-full bg-fuchsia-500/20 blur-[130px] animate-pulse-slower" />
        <div className="absolute bottom-0 left-1/3 w-[24rem] h-[24rem] rounded-full bg-cyan-400/15 blur-[130px] animate-float" />
      </div>

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
        }}
      />

      <div className="relative max-w-6xl mx-auto p-6">
        <div className="flex items-center gap-3 mb-8">
          <HiOutlineSparkles className="text-purple-300 text-3xl drop-shadow-[0_0_14px_rgba(168,85,247,0.7)]" />
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            <span className="shimmer-text">Admin</span>
          </h1>
        </div>

        {lastAdded && (
          <div className="mb-6 flex items-center gap-2 text-green-300 bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 backdrop-blur">
            <FiCheckCircle />
            <span className="text-sm">
              <strong>{lastAdded.stage_name}</strong> is now live on the DJ board.
            </span>
          </div>
        )}
        {error && (
          <div className="mb-6 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 backdrop-blur">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* ===================== LEFT: DJ management ===================== */}
          <section className="min-w-0">
            <form
              onSubmit={handleSubmit}
              className="rounded-3xl p-6
                         bg-white/[0.04] backdrop-blur-2xl
                         border border-white/10
                         shadow-[0_8px_40px_0_rgba(139,92,246,0.18),inset_0_1px_0_0_rgba(255,255,255,0.1)]"
            >
              <h2 className="text-lg font-semibold text-white/90 mb-5 flex items-center gap-2">
                <FiUser className="text-purple-300" />
                Add a new DJ
              </h2>

              <div className="space-y-3">
                <AdminInput
                  icon={<FiUser />}
                  placeholder="Stage name"
                  value={form.stageName}
                  onChange={(e) =>
                    setForm({ ...form, stageName: e.target.value })
                  }
                  required
                  maxLength={40}
                />
                <AdminInput
                  icon={<FiLink />}
                  placeholder="Music link"
                  value={form.musicLink}
                  onChange={(e) =>
                    setForm({ ...form, musicLink: e.target.value })
                  }
                  required
                />
                <AdminInput
                  icon={<FiImage />}
                  placeholder="Cover image URL (optional)"
                  value={form.coverUrl}
                  onChange={(e) =>
                    setForm({ ...form, coverUrl: e.target.value })
                  }
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="group relative mt-5 w-full overflow-hidden rounded-xl
                           bg-gradient-to-r from-purple-500 via-fuchsia-500 to-purple-500
                           bg-[length:200%_100%] animate-gradient-x
                           py-3 font-semibold text-white
                           shadow-[0_8px_30px_-8px_rgba(168,85,247,0.9)]
                           hover:shadow-[0_12px_40px_-8px_rgba(217,70,239,1)]
                           hover:-translate-y-0.5
                           transition-all duration-300
                           disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span className="relative z-10 inline-flex items-center gap-2">
                  <FiPlus />
                  {submitting ? 'Adding…' : 'Add DJ to Board'}
                </span>
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
              </button>
            </form>

            <div className="mt-6">
              <h2 className="text-lg font-semibold text-white/90 mb-3 flex items-center gap-2">
                <FiUser className="text-purple-300" />
                Current DJs
                <span className="text-neutral-500 font-normal text-sm">
                  ({list.length})
                </span>
              </h2>

              {list.length === 0 ? (
                <p className="text-neutral-500 text-sm px-1">
                  No DJs on the board yet.
                </p>
              ) : (
                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 rounded-2xl scroll-hide">
                  {list.map((dj) => (
                    <div
                      key={dj.id}
                      className="flex items-center gap-3 p-3 rounded-xl
                                 bg-white/[0.03] backdrop-blur border border-white/10
                                 hover:bg-white/[0.05] hover:border-white/20
                                 transition-all"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-white/90">
                          {dj.stage_name}
                        </p>
                        <a
                          href={dj.music_link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-purple-300/70 hover:text-purple-200 truncate block"
                        >
                          {dj.music_link}
                        </a>
                      </div>
                      <span className="text-xs text-neutral-500 tabular-nums shrink-0">
                        {dj.vote_counts?.total_votes ?? 0} votes
                      </span>
                      <button
                        onClick={() => handleDelete(dj)}
                        disabled={deleting}
                        title="Remove DJ"
                        className="p-2 rounded-lg text-neutral-500 hover:text-red-400
                                   hover:bg-red-500/10 transition-colors shrink-0"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* ===================== RIGHT: QR batches ===================== */}
          <section className="min-w-0">
            <div
              className="rounded-3xl p-6
                         bg-white/[0.04] backdrop-blur-2xl
                         border border-white/10
                         shadow-[0_8px_40px_0_rgba(250,204,21,0.12),inset_0_1px_0_0_rgba(255,255,255,0.1)]"
            >
              <h2 className="text-lg font-semibold text-white/90 mb-1 flex items-center gap-2">
                <FiGrid className="text-yellow-300" />
                Generate Coin QR Batch
              </h2>
              <p className="text-xs text-neutral-500 mb-5">
                Type a club name and quantity. Each QR = one physical coin.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs uppercase tracking-[0.15em] text-white/50 mb-1.5">
                    Club name
                  </label>
                  <AdminInput
                    icon={<FiHome />}
                    type="text"
                    placeholder="e.g. Main Stage, Vault Lounge"
                    value={batchForm.clubName}
                    onChange={(e) =>
                      setBatchForm({ ...batchForm, clubName: e.target.value })
                    }
                    maxLength={60}
                  />

                  {clubs.length > 0 && (
                    <div className="mt-3 flex items-center gap-2 min-w-0">
                      <span className="text-[10px] uppercase tracking-wider text-white/40 shrink-0">
                        Reuse
                      </span>
                      <div className="flex-1 min-w-0 flex gap-2 overflow-x-auto px-2 py-1.5 reuse-scroll">
                        {clubs.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() =>
                              setBatchForm({
                                ...batchForm,
                                clubName: c.name,
                              })
                            }
                            className="shrink-0 text-xs px-2.5 py-1 rounded-full
                                       bg-white/[0.05] border border-white/10
                                       text-white/70 hover:text-white hover:border-purple-400/40
                                       transition-colors whitespace-nowrap"
                          >
                            {c.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-[0.15em] text-white/50 mb-1.5">
                    Quantity{' '}
                    <span className="text-white/30 normal-case">(1–500)</span>
                  </label>
                  <AdminInput
                    icon={<FiHash />}
                    type="number"
                    min="1"
                    max="500"
                    value={batchForm.quantity}
                    onChange={(e) =>
                      setBatchForm({ ...batchForm, quantity: e.target.value })
                    }
                  />
                </div>
              </div>

              {batchError && (
                <p className="mt-3 text-red-300 text-sm bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                  {batchError}
                </p>
              )}

              <button
                onClick={generateBatch}
                disabled={
                  batchBusy || !batchForm.clubName.trim() || !batchForm.quantity
                }
                className="group relative mt-5 w-full overflow-hidden rounded-xl
                           bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400
                           bg-[length:200%_100%] animate-gradient-x
                           py-3 font-semibold text-black
                           shadow-[0_8px_30px_-8px_rgba(250,204,21,0.9)]
                           hover:shadow-[0_12px_40px_-8px_rgba(250,204,21,1)]
                           hover:-translate-y-0.5
                           transition-all duration-300
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="relative z-10 inline-flex items-center gap-2">
                  <FiGrid />
                  {batchBusy ? 'Generating…' : 'Generate Batch'}
                </span>
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
              </button>
            </div>

            <div className="mt-6">
              <h2 className="text-lg font-semibold text-white/90 mb-3 flex items-center gap-2">
                <FiClock className="text-yellow-300" />
                Recent batches
                <span className="text-neutral-500 font-normal text-sm">
                  ({batches.length})
                </span>
              </h2>

              {batches.length === 0 ? (
                <p className="text-neutral-500 text-sm px-1">
                  No batches generated yet.
                </p>
              ) : (
                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                  {batches.map((b) => (
                    <Link
                      key={b.id}
                      to={`/admin/batches/${b.id}`}
                      className="group flex items-center gap-3 p-3 rounded-xl
                                 bg-white/[0.03] backdrop-blur border border-white/10
                                 hover:bg-white/[0.05] hover:border-yellow-400/30
                                 transition-all"
                    >
                      <div className="w-9 h-9 rounded-lg bg-yellow-400/15 border border-yellow-400/30 flex items-center justify-center shrink-0">
                        <FiGrid className="text-yellow-300 text-sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-white/90">
                          {b.clubs?.name ?? '—'}
                        </p>
                        <p className="text-[10px] text-neutral-500 tabular-nums">
                          {new Date(b.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-xs text-neutral-400 tabular-nums shrink-0">
                        {b.quantity} codes
                      </span>
                      <FiExternalLink className="text-neutral-600 group-hover:text-yellow-300 transition-colors shrink-0" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function AdminInput({ icon, className = '', ...props }) {
  return (
    <div className="relative">
      {icon && (
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40">
          {icon}
        </span>
      )}
      <input
        {...props}
        className={`w-full rounded-xl bg-white/[0.05] border border-white/10
                    pl-11 pr-4 py-3 text-white placeholder-white/40
                    outline-none backdrop-blur
                    transition-all duration-200
                    focus:border-purple-400/60 focus:bg-white/[0.08]
                    focus:shadow-[0_0_0_3px_rgba(168,85,247,0.2)]
                    ${className}`}
      />
    </div>
  );
}