import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiCheck,
  FiX,
  FiAlertTriangle,
  FiEdit3,
  FiMic,
  FiUser,
  FiAward,
  FiCamera,
  FiRefreshCw,
} from 'react-icons/fi';
import { FaCoins } from 'react-icons/fa';
import {
  fetchCoinByToken,
  claimCoin,
  uploadSelfie,
  resetClaim,
} from './coinClaimSlice';

export default function GoldClaimPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { coin, coinLoading, coinError, claiming, claimResult, claimError } =
    useSelector((s) => s.coinClaim);
  const user = useSelector((s) => s.auth.user);
  const profile = useSelector((s) => s.auth.profile);

  const [shoutout, setShoutout] = useState('');
  const [photoBlob, setPhotoBlob] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (!user) {
      navigate(`/auth?next=/gold/${token}`, { replace: true });
      return;
    }
    dispatch(fetchCoinByToken(token));
    return () => dispatch(resetClaim());
  }, [dispatch, token, user, navigate]);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const wordCount = shoutout.trim() ? shoutout.trim().split(/\s+/).length : 0;
  const tooManyWords = wordCount > 15;

  // ----------------------------------------------------------
  // Camera
  // ----------------------------------------------------------
  const openCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOpen(true);
      // Wait for the video element to exist
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 50);
    } catch (err) {
      setCameraError(
        err?.name === 'NotAllowedError'
          ? 'Camera permission denied. Allow camera access and try again.'
          : err?.message || 'Could not open camera'
      );
    }
  };

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
  };

  const capturePhoto = async () => {
    const video = videoRef.current;
    if (!video) return;

    const size = Math.min(video.videoWidth, video.videoHeight) || 480;
    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');

    // Center-crop to square
    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;
    ctx.drawImage(video, sx, sy, size, size, 0, 0, 480, 480);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        setPhotoBlob(blob);
        setPhotoPreview(URL.createObjectURL(blob));
        closeCamera();
      },
      'image/jpeg',
      0.85
    );
  };

  const clearPhoto = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoBlob(null);
    setPhotoPreview(null);
  };

  // ----------------------------------------------------------
  // Submit
  // ----------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (tooManyWords) return;

    let photoUrl = null;

    if (photoBlob) {
      setUploadingPhoto(true);
      const up = await dispatch(
        uploadSelfie({ blob: photoBlob, userId: user.id })
      );
      setUploadingPhoto(false);
      if (uploadSelfie.fulfilled.match(up)) {
        photoUrl = up.payload.publicUrl;
      } else {
        // Continue without photo rather than blocking the claim
        photoUrl = null;
      }
    }

    dispatch(claimCoin({ token, shoutout, photoUrl }));
  };

  // ---------- Loading ----------
  if (coinLoading) {
    return (
      <Shell>
        <p className="text-neutral-400 text-center">Checking coin…</p>
      </Shell>
    );
  }

  // ---------- Invalid token ----------
  if (coinError === 'invalid_token') {
    return (
      <Shell>
        <div className="text-center">
          <FiAlertTriangle className="mx-auto text-5xl text-red-400 mb-4" />
          <h2 className="text-2xl font-extrabold text-white mb-2">
            Invalid coin
          </h2>
          <p className="text-white/50 text-sm">
            This QR doesn't match any coin we issued.
          </p>
        </div>
      </Shell>
    );
  }

  // ---------- Already claimed ----------
  if (coin?.claimed_by) {
    return (
      <Shell>
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/15 border border-red-500/40 mb-4">
            <FiX className="text-red-400 text-3xl" />
          </div>
          <h2 className="text-2xl font-extrabold text-white mb-2">
            Coin already used
          </h2>
          <p className="text-white/50 text-sm mb-6">
            This QR was claimed on{' '}
            {new Date(coin.claimed_at).toLocaleDateString()}. It can't be
            used again.
          </p>
          <Link
            to="/coins/leaderboard"
            className="inline-flex items-center gap-1.5 text-sm text-purple-300 hover:text-purple-200"
          >
            <FiAward />
            See the leaderboard
          </Link>
        </div>
      </Shell>
    );
  }

  // ---------- Success ----------
  if (claimResult) {
    return (
      <Shell>
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/15 border border-green-500/40 mb-4 shadow-[0_0_30px_-6px_rgba(34,197,94,0.7)]">
            <FiCheck className="text-green-400 text-3xl" />
          </div>
          <h2 className="text-2xl font-extrabold text-white mb-1">
            Coin claimed!
          </h2>
          <p className="text-white/60 text-sm mb-6">
            You now have{' '}
            <span className="text-yellow-300 font-semibold tabular-nums">
              {claimResult.new_total}
            </span>{' '}
            coin{claimResult.new_total === 1 ? '' : 's'}.
          </p>

          {photoPreview && (
            <div className="mb-4 flex justify-center">
              <img
                src={photoPreview}
                alt="Your selfie"
                className="w-24 h-24 rounded-2xl object-cover border border-white/15 shadow-[0_4px_30px_-8px_rgba(168,85,247,0.7)]"
              />
            </div>
          )}

          {shoutout && (
            <div className="mb-6 rounded-xl bg-white/[0.04] border border-white/10 p-4 text-left">
              <p className="text-[10px] uppercase tracking-[0.15em] text-white/40 mb-1">
                Your shoutout
              </p>
              <p className="text-white/90 italic">"{shoutout}"</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/coins/leaderboard"
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 font-medium text-white"
            >
              View Leaderboard
            </Link>
            <Link
              to="/shoutouts"
              className="px-5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 hover:bg-white/[0.08] font-medium text-white"
            >
              See Shoutouts
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  // ---------- Form ----------
  return (
    <Shell>
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400/20 to-amber-500/10 border border-yellow-400/30 mb-4 shadow-[0_0_24px_-6px_rgba(250,204,21,0.6)]">
          <FaCoins className="text-yellow-300 text-2xl" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">
          <span className="shimmer-text">Claim your coin</span>
        </h1>
        <p className="mt-1 text-sm text-white/50">
          {coin?.clubs?.name ? (
            <>
              At <span className="text-purple-300 font-medium">{coin.clubs.name}</span>
            </>
          ) : (
            'Write a shoutout and lock in your rank.'
          )}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Locked identity */}
        <div>
          <label className="block text-xs uppercase tracking-[0.15em] text-white/50 mb-1.5 inline-flex items-center gap-1.5">
            <FiUser />
            Claiming as
          </label>
          <div className="w-full rounded-xl bg-white/[0.03] border border-white/10
                          px-4 py-3 text-white/80 flex items-center justify-between gap-3">
            <span className="truncate">{profile?.username ?? '—'}</span>
            <span className="text-[10px] uppercase tracking-wider text-white/30 shrink-0">
              Locked
            </span>
          </div>
        </div>

        {/* Selfie */}
        <div>
          <label className="block text-xs uppercase tracking-[0.15em] text-white/50 mb-1.5 inline-flex items-center gap-1.5">
            <FiCamera />
            Selfie (optional)
          </label>

          {!cameraOpen && !photoPreview && (
            <button
              type="button"
              onClick={openCamera}
              className="w-full rounded-xl border border-dashed border-white/15
                         bg-white/[0.02] hover:bg-white/[0.05] hover:border-purple-400/40
                         py-4 text-white/60 hover:text-white/90
                         transition-all flex items-center justify-center gap-2"
            >
              <FiCamera />
              Take a selfie
            </button>
          )}

          {cameraOpen && (
            <div className="rounded-xl overflow-hidden border border-white/15 bg-black relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full aspect-square object-cover"
              />
              <div className="flex gap-2 p-3 bg-black/70 backdrop-blur">
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="flex-1 rounded-lg bg-gradient-to-r from-purple-500 to-fuchsia-500
                             py-2.5 font-semibold text-white
                             inline-flex items-center justify-center gap-1.5"
                >
                  <FiCamera />
                  Capture
                </button>
                <button
                  type="button"
                  onClick={closeCamera}
                  className="px-4 rounded-lg bg-white/[0.06] border border-white/10
                             text-white/80 hover:text-white
                             inline-flex items-center justify-center"
                  aria-label="Close camera"
                >
                  <FiX />
                </button>
              </div>
            </div>
          )}

          {photoPreview && !cameraOpen && (
            <div className="flex items-center gap-3">
              <img
                src={photoPreview}
                alt="Preview"
                className="w-20 h-20 rounded-xl object-cover border border-white/15"
              />
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={openCamera}
                  className="text-xs text-purple-300 hover:text-purple-200
                             inline-flex items-center gap-1.5"
                >
                  <FiRefreshCw />
                  Retake
                </button>
                <button
                  type="button"
                  onClick={clearPhoto}
                  className="text-xs text-white/40 hover:text-white/70
                             inline-flex items-center gap-1.5"
                >
                  <FiX />
                  Remove
                </button>
              </div>
            </div>
          )}

          {cameraError && (
            <p className="mt-2 text-red-300 text-xs bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              {cameraError}
            </p>
          )}
        </div>

        {/* Shoutout */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.15em] text-white/50">
              <FiMic />
              Shoutout (optional)
            </label>
            <span
              className={`text-[10px] tabular-nums ${
                tooManyWords ? 'text-red-400' : 'text-white/40'
              }`}
            >
              {wordCount}/15 words
            </span>
          </div>
          <textarea
            value={shoutout}
            onChange={(e) => setShoutout(e.target.value)}
            placeholder="Big up the whole crew — 15 words max"
            rows={3}
            className="w-full rounded-xl bg-white/[0.05] border border-white/10
                       px-4 py-3 text-white placeholder-white/40
                       outline-none backdrop-blur resize-none
                       transition-all duration-200
                       focus:border-purple-400/60 focus:bg-white/[0.08]
                       focus:shadow-[0_0_0_3px_rgba(168,85,247,0.2)]"
          />
        </div>

        {claimError && (
          <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
            {claimError === 'already_claimed'
              ? 'Someone already claimed this coin.'
              : claimError}
          </div>
        )}

        <button
          type="submit"
          disabled={claiming || uploadingPhoto || tooManyWords}
          className="group relative w-full overflow-hidden rounded-xl
                     bg-gradient-to-r from-purple-500 via-fuchsia-500 to-purple-500
                     bg-[length:200%_100%] animate-gradient-x
                     py-3 font-semibold text-white
                     shadow-[0_8px_30px_-8px_rgba(168,85,247,0.9)]
                     transition-all duration-300
                     hover:shadow-[0_12px_40px_-8px_rgba(217,70,239,1)]
                     hover:-translate-y-0.5
                     disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span className="relative z-10 inline-flex items-center gap-2">
            <FiEdit3 />
            {uploadingPhoto
              ? 'Uploading selfie…'
              : claiming
              ? 'Claiming…'
              : 'Claim Coin'}
          </span>
          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
        </button>
      </form>
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#08060f] flex items-center justify-center px-4 py-10">
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

      <div
        className="relative w-full max-w-md rounded-3xl p-8
                   bg-white/[0.04] backdrop-blur-2xl
                   border border-white/10
                   shadow-[0_8px_40px_0_rgba(139,92,246,0.25),inset_0_1px_0_0_rgba(255,255,255,0.15)]"
      >
        {children}
      </div>
    </div>
  );
}