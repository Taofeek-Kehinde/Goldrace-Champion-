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
  FiLogIn,
  FiLock,
} from 'react-icons/fi';
import { FaCoins } from 'react-icons/fa';
import {
  fetchCoinByToken,
  claimCoin,
  uploadSelfie,
  resetClaim,
} from './coinClaimSlice';

export default function GoldClaimPage() {
  const { id } = useParams();
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

  // Fetch the coin as soon as the page loads — regardless of auth state
  useEffect(() => {
    if (id) dispatch(fetchCoinByToken(id));
    return () => dispatch(resetClaim());
  }, [dispatch, id]);

  // Stop camera stream on unmount
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
    if (tooManyWords || !user) return;

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
        photoUrl = null;
      }
    }

    dispatch(claimCoin({ token: id, shoutout, photoUrl }));
  };

  const goToAuth = () => {
    navigate(`/auth?next=/gold/${id}`);
  };

  // ----------------------------------------------------------
  // Loading
  // ----------------------------------------------------------
  if (coinLoading) {
    return (
      <Shell>
        <p className="text-[var(--ink-subtle)] text-center">Checking coin…</p>
      </Shell>
    );
  }

  // ----------------------------------------------------------
  // Invalid token
  // ----------------------------------------------------------
  if (coinError === 'invalid_token' || (!coin && !coinLoading)) {
    return (
      <Shell>
        <div className="text-center">
          <FiAlertTriangle className="mx-auto text-4xl text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-[var(--ink)] mb-2">
            Invalid coin
          </h2>
          <p className="text-[var(--ink-subtle)] text-sm mb-6">
            This QR doesn't match any coin we issued.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm
                       text-[var(--ink-muted)] hover:text-[var(--ink)]"
          >
            <FiAward />
            Back to leaderboard
          </Link>
        </div>
      </Shell>
    );
  }

  // ----------------------------------------------------------
  // Already claimed
  // ----------------------------------------------------------
  if (coin?.claimed_by) {
    return (
      <Shell>
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full
                          bg-red-500/10 border border-red-500/30 mb-4">
            <FiX className="text-red-500 text-2xl" />
          </div>
          <h2 className="text-xl font-semibold text-[var(--ink)] mb-2">
            Coin already used
          </h2>
          <p className="text-[var(--ink-subtle)] text-sm mb-6">
            This QR was claimed on{' '}
            {new Date(coin.claimed_at).toLocaleDateString()}. It can't be used again.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm
                       text-[var(--ink-muted)] hover:text-[var(--ink)]"
          >
            <FiAward />
            See the leaderboard
          </Link>
        </div>
      </Shell>
    );
  }

  // ----------------------------------------------------------
  // Success state
  // ----------------------------------------------------------
  if (claimResult) {
    return (
      <Shell>
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full
                          bg-green-500/10 border border-green-500/30 mb-4">
            <FiCheck className="text-green-500 text-2xl" />
          </div>
          <h2 className="text-xl font-semibold text-[var(--ink)] mb-1">
            Coin claimed!
          </h2>
          <p className="text-[var(--ink-muted)] text-sm mb-6">
            You now have{' '}
            <span className="text-yellow-600 dark:text-yellow-400 font-semibold tabular-nums">
              {claimResult.new_total}
            </span>{' '}
            coin{claimResult.new_total === 1 ? '' : 's'}.
          </p>

          {photoPreview && (
            <div className="mb-4 flex justify-center">
              <img
                src={photoPreview}
                alt="Your selfie"
                className="w-24 h-24 rounded-2xl object-cover
                           border border-[var(--hairline)]"
              />
            </div>
          )}

          {shoutout && (
            <div className="mb-6 rounded-xl p-4 text-left
                            bg-[var(--surface)] border border-[var(--hairline)]">
              <p className="text-[10px] uppercase tracking-[0.15em] text-[var(--ink-subtle)] mb-1">
                Your shoutout
              </p>
              <p className="text-[var(--ink-muted)] italic">"{shoutout}"</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/"
              className="px-5 py-2.5 rounded-xl text-sm font-medium
                         bg-[var(--ink)] text-[var(--canvas)]
                         hover:opacity-90 transition-opacity"
            >
              View Leaderboard
            </Link>
            <Link
              to="/shoutouts"
              className="px-5 py-2.5 rounded-xl text-sm font-medium
                         bg-[var(--surface)] border border-[var(--hairline)]
                         text-[var(--ink-muted)] hover:text-[var(--ink)]
                         hover:bg-[var(--surface-hover)] transition-colors"
            >
              See Shoutouts
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  // ----------------------------------------------------------
  // Not logged in — show sign-in prompt instead of the form
  // ----------------------------------------------------------
  if (!user) {
    return (
      <Shell>
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl
                          bg-[var(--surface)] border border-[var(--hairline)] mb-4">
            <FaCoins className="text-yellow-500 text-2xl" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--ink)]">
            A coin is waiting for you
          </h1>
          <p className="mt-1.5 text-sm text-[var(--ink-subtle)]">
            {coin?.clubs?.name ? (
              <>
                At{' '}
                <span className="text-[var(--ink-muted)] font-medium">
                  {coin.clubs.name}
                </span>
              </>
            ) : (
              'Sign in to claim it and add your point to the leaderboard.'
            )}
          </p>
        </div>

        <div className="rounded-2xl p-4 mb-5 text-center
                        bg-[var(--surface)] border border-[var(--hairline)]">
          <div className="inline-flex items-center gap-2 text-xs
                          text-[var(--ink-subtle)]">
            <FiLock className="text-[11px]" />
            <span>Claiming requires an account</span>
          </div>
        </div>

        <button
          type="button"
          onClick={goToAuth}
          className="w-full rounded-xl py-3 text-sm font-medium
                     bg-[var(--ink)] text-[var(--canvas)]
                     hover:opacity-90 active:scale-[0.99]
                     transition-all
                     inline-flex items-center justify-center gap-2"
        >
          <FiLogIn />
          Sign in to claim
        </button>

        <p className="mt-4 text-center text-xs text-[var(--ink-subtle)]">
          New here?{' '}
          <button
            type="button"
            onClick={goToAuth}
            className="text-[var(--ink-muted)] hover:text-[var(--ink)] underline-offset-2 hover:underline"
          >
            Create an account
          </button>
        </p>
      </Shell>
    );
  }

  // ----------------------------------------------------------
  // Logged in — show the claim form
  // ----------------------------------------------------------
  return (
    <Shell>
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl
                        bg-[var(--surface)] border border-[var(--hairline)] mb-4">
          <FaCoins className="text-yellow-500 text-2xl" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-[var(--ink)]">
          Claim your coin
        </h1>
        <p className="mt-1.5 text-sm text-[var(--ink-subtle)]">
          {coin?.clubs?.name ? (
            <>
              At{' '}
              <span className="text-[var(--ink-muted)] font-medium">
                {coin.clubs.name}
              </span>
            </>
          ) : (
            'Write a shoutout and lock in your rank.'
          )}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Claiming as */}
        <div>
          <label className="text-xs uppercase tracking-[0.15em] text-[var(--ink-subtle)] mb-1.5 inline-flex items-center gap-1.5">
            <FiUser />
            Claiming as
          </label>
          <div className="w-full rounded-xl px-4 py-3 flex items-center justify-between gap-3
                          bg-[var(--surface)] border border-[var(--hairline)]">
            <span className="truncate text-[var(--ink)]">
              {profile?.username ?? '—'}
            </span>
            <span className="text-[10px] uppercase tracking-wider
                             text-[var(--ink-subtle)] shrink-0">
              Locked
            </span>
          </div>
        </div>

        {/* Selfie */}
        <div>
          <label className="text-xs uppercase tracking-[0.15em] text-[var(--ink-subtle)] mb-1.5 inline-flex items-center gap-1.5">
            <FiCamera />
            Selfie (optional)
          </label>

          {!cameraOpen && !photoPreview && (
            <button
              type="button"
              onClick={openCamera}
              className="w-full rounded-xl py-4 text-sm
                         border border-dashed border-[var(--hairline)]
                         bg-[var(--surface)] hover:bg-[var(--surface-hover)]
                         text-[var(--ink-muted)] hover:text-[var(--ink)]
                         transition-colors
                         flex items-center justify-center gap-2"
            >
              <FiCamera />
              Take a selfie
            </button>
          )}

          {cameraOpen && (
            <div className="rounded-xl overflow-hidden border border-[var(--hairline)] bg-black relative">
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
                  className="flex-1 rounded-lg py-2.5 text-sm font-medium
                             bg-[var(--ink)] text-[var(--canvas)]
                             inline-flex items-center justify-center gap-1.5
                             hover:opacity-90 transition-opacity"
                >
                  <FiCamera />
                  Capture
                </button>
                <button
                  type="button"
                  onClick={closeCamera}
                  className="px-4 rounded-lg
                             bg-[var(--surface)] border border-[var(--hairline)]
                             text-[var(--ink-muted)] hover:text-[var(--ink)]
                             inline-flex items-center justify-center transition-colors"
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
                className="w-20 h-20 rounded-xl object-cover border border-[var(--hairline)]"
              />
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={openCamera}
                  className="text-xs text-[var(--ink-muted)] hover:text-[var(--ink)]
                             inline-flex items-center gap-1.5"
                >
                  <FiRefreshCw />
                  Retake
                </button>
                <button
                  type="button"
                  onClick={clearPhoto}
                  className="text-xs text-[var(--ink-subtle)] hover:text-[var(--ink)]
                             inline-flex items-center gap-1.5"
                >
                  <FiX />
                  Remove
                </button>
              </div>
            </div>
          )}

          {cameraError && (
            <p className="mt-2 text-xs text-red-500 dark:text-red-300/90
                          bg-red-500/[0.08] border border-red-500/20
                          rounded-lg px-3 py-2">
              {cameraError}
            </p>
          )}
        </div>

        {/* Shoutout */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.15em] text-[var(--ink-subtle)]">
              <FiMic />
              Shoutout (optional)
            </label>
            <span
              className={`text-[10px] tabular-nums ${
                tooManyWords ? 'text-red-500' : 'text-[var(--ink-subtle)]'
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
            className="w-full rounded-xl px-4 py-3 text-sm
                       bg-[var(--surface)] border border-[var(--hairline)]
                       text-[var(--ink)] placeholder-[var(--ink-subtle)]
                       outline-none resize-none
                       transition-all duration-200
                       focus:border-[var(--ink-subtle)] focus:bg-[var(--surface-hover)]"
          />
        </div>

        {claimError && (
          <div className="text-sm text-red-500 dark:text-red-300/90
                          bg-red-500/[0.08] border border-red-500/20
                          rounded-xl px-4 py-3">
            {claimError === 'already_claimed'
              ? 'Someone already claimed this coin.'
              : claimError}
          </div>
        )}

        <button
          type="submit"
          disabled={claiming || uploadingPhoto || tooManyWords}
          className="w-full rounded-xl py-3 text-sm font-medium
                     bg-[var(--ink)] text-[var(--canvas)]
                     hover:opacity-90 active:scale-[0.99]
                     transition-all
                     disabled:opacity-50 disabled:cursor-not-allowed
                     inline-flex items-center justify-center gap-2"
        >
          <FiEdit3 />
          {uploadingPhoto
            ? 'Uploading selfie…'
            : claiming
            ? 'Claiming…'
            : 'Claim Coin'}
        </button>
      </form>
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--canvas)]
                    flex items-center justify-center px-4 py-10">
      {/* Soft glow — dark mode only */}
      <div className="pointer-events-none absolute inset-0 hidden dark:block">
        <div className="absolute -top-40 -left-40 w-[32rem] h-[32rem] rounded-full bg-purple-600/15 blur-[130px] animate-pulse-slow" />
        <div className="absolute top-1/3 -right-40 w-[30rem] h-[30rem] rounded-full bg-fuchsia-500/10 blur-[130px] animate-pulse-slower" />
      </div>

      <div className="relative w-full max-w-md rounded-2xl p-7 sm:p-8
                      bg-[var(--surface)] backdrop-blur-xl
                      border border-[var(--hairline)]
                      shadow-[0_20px_60px_-20px_rgba(0,0,0,0.5)]">
        {children}
      </div>
    </div>
  );
}