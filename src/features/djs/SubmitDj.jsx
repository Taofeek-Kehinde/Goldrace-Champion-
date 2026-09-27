import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { submitDj } from './djSlice';

export default function SubmitDj() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { error } = useSelector((s) => s.djs);
  const role = useSelector((s) => s.auth.profile?.role);
  const [form, setForm] = useState({ stageName: '', musicLink: '' });
  const [busy, setBusy] = useState(false);

  const alreadyDj = role === 'dj';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (alreadyDj) return;
    setBusy(true);
    const res = await dispatch(submitDj(form));
    setBusy(false);
    if (!res.error) navigate('/');
  };

  if (alreadyDj) {
    return (
      <div className="max-w-lg mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold mb-3">You're already on the leaderboard</h1>
        <p className="text-neutral-400 mb-6">
          Each account can submit one track. Head to the leaderboard to see how you're doing.
        </p>
        <button
          onClick={() => navigate('/')}
          className="bg-purple-600 hover:bg-purple-500 px-6 py-2 rounded-lg font-medium"
        >
          Go to Leaderboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Submit your track</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          placeholder="Stage name"
          value={form.stageName}
          onChange={(e) => setForm({ ...form, stageName: e.target.value })}
          className="w-full p-3 bg-neutral-900 rounded-lg border border-neutral-800 outline-none focus:border-purple-500"
          required
          maxLength={40}
        />
        <input
          type="url"
          placeholder="Music link (Spotify / SoundCloud / YouTube)"
          value={form.musicLink}
          onChange={(e) => setForm({ ...form, musicLink: e.target.value })}
          className="w-full p-3 bg-neutral-900 rounded-lg border border-neutral-800 outline-none focus:border-purple-500"
          required
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          disabled={busy}
          className="w-full bg-purple-600 hover:bg-purple-500 py-3 rounded-lg font-medium disabled:opacity-50"
        >
          {busy ? 'Submitting…' : 'Submit DJ'}
        </button>
      </form>
    </div>
  );
}