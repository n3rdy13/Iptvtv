import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Radio, FileText, Loader2 } from 'lucide-react';
import { useApp } from '../components/AppProvider';
import { isSafeFetchUrl, isInsecureHttpUrl } from '../lib/url';

type TabType = 'xtream' | 'm3u';

const URL_HINT = 'must be a valid http:// or https:// web address.';

export default function AddPlaylist() {
  const navigate = useNavigate();
  const { playlists } = useApp();

  const [activeTab, setActiveTab] = useState<TabType>('xtream');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Xtream fields
  const [xName, setXName] = useState('');
  const [xServer, setXServer] = useState('');
  const [xUsername, setXUsername] = useState('');
  const [xPassword, setXPassword] = useState('');

  // M3U fields
  const [mName, setMName] = useState('');
  const [mUrl, setMUrl] = useState('');
  const [mEpgUrl, setMEpgUrl] = useState('');

  // The address the user is currently entering, if it would be sent unencrypted.
  const insecureUrl =
    activeTab === 'xtream'
      ? isInsecureHttpUrl(xServer)
      : isInsecureHttpUrl(mUrl) || isInsecureHttpUrl(mEpgUrl);

  /** Returns an app-authored message describing the first problem, or null. */
  const validate = (): string | null => {
    if (activeTab === 'xtream') {
      if (!xName.trim() || !xServer.trim() || !xUsername.trim() || !xPassword.trim()) {
        return 'All fields are required';
      }
      if (!isSafeFetchUrl(xServer)) return `Server URL ${URL_HINT}`;
      return null;
    }
    if (!mName.trim() || !mUrl.trim()) return 'Name and M3U URL are required';
    if (!isSafeFetchUrl(mUrl)) return `M3U URL ${URL_HINT}`;
    if (mEpgUrl.trim() && !isSafeFetchUrl(mEpgUrl)) return `EPG URL ${URL_HINT}`;
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate locally first, so the only messages we echo verbatim are our own.
    const problem = validate();
    if (problem) {
      setError(problem);
      setLoading(false);
      return;
    }

    try {
      if (activeTab === 'xtream') {
        await playlists.addXtreamPlaylist(xName.trim(), xServer.trim(), xUsername.trim(), xPassword.trim());
      } else {
        await playlists.addM3UPlaylist(mName.trim(), mUrl.trim(), mEpgUrl.trim() || undefined);
      }
      navigate(-1);
    } catch (err) {
      // Never render the raw error: its text can be chosen by the remote server.
      console.error('Failed to add playlist:', err);
      setError('Could not add this playlist. Check the address and your login details, then try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full px-4 py-3 rounded-xl bg-[var(--color-bg-input)] text-[var(--color-txt)] border border-[var(--color-border-light)] placeholder:text-[var(--color-txt-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors';

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-txt)]">
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-[var(--color-bg-elevated)] transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">Add Playlist</h1>
        </div>

        {/* Tab Toggle */}
        <div className="flex rounded-xl bg-[var(--color-bg-elevated)] p-1 mb-6">
          <button
            onClick={() => { setActiveTab('xtream'); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'xtream'
                ? 'bg-[var(--color-primary)] text-[var(--color-txt-on-primary)]'
                : 'text-[var(--color-txt-secondary)] hover:text-[var(--color-txt)]'
            }`}
          >
            <Radio size={16} />
            Xtream Codes
          </button>
          <button
            onClick={() => { setActiveTab('m3u'); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'm3u'
                ? 'bg-[var(--color-primary)] text-[var(--color-txt-on-primary)]'
                : 'text-[var(--color-txt-secondary)] hover:text-[var(--color-txt)]'
            }`}
          >
            <FileText size={16} />
            M3U Playlist
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 text-[var(--color-error)] text-sm">
            {error}
          </div>
        )}

        {/* Unencrypted connection warning */}
        {insecureUrl && (
          <div className="mb-4 p-3 rounded-xl bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/30 text-[var(--color-warning)] text-sm">
            This address starts with http://, so your username and password will be sent
            unencrypted and can be read by others on your network. Use https:// if your
            provider supports it.
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === 'xtream' ? (
            <>
              <div>
                <label className="block text-sm text-[var(--color-txt-secondary)] mb-1.5">Playlist Name</label>
                <input
                  type="text"
                  value={xName}
                  onChange={(e) => setXName(e.target.value)}
                  placeholder="My IPTV"
                  className={inputClass}
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--color-txt-secondary)] mb-1.5">Server URL</label>
                <input
                  type="url"
                  value={xServer}
                  onChange={(e) => setXServer(e.target.value)}
                  placeholder="http://example.com:8080"
                  className={inputClass}
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--color-txt-secondary)] mb-1.5">Username</label>
                <input
                  type="text"
                  value={xUsername}
                  onChange={(e) => setXUsername(e.target.value)}
                  placeholder="username"
                  className={inputClass}
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--color-txt-secondary)] mb-1.5">Password</label>
                <input
                  type="password"
                  value={xPassword}
                  onChange={(e) => setXPassword(e.target.value)}
                  placeholder="password"
                  className={inputClass}
                  disabled={loading}
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm text-[var(--color-txt-secondary)] mb-1.5">Playlist Name</label>
                <input
                  type="text"
                  value={mName}
                  onChange={(e) => setMName(e.target.value)}
                  placeholder="My M3U Playlist"
                  className={inputClass}
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--color-txt-secondary)] mb-1.5">M3U URL</label>
                <input
                  type="url"
                  value={mUrl}
                  onChange={(e) => setMUrl(e.target.value)}
                  placeholder="http://example.com/playlist.m3u"
                  className={inputClass}
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--color-txt-secondary)] mb-1.5">
                  EPG URL <span className="text-[var(--color-txt-muted)]">(optional)</span>
                </label>
                <input
                  type="url"
                  value={mEpgUrl}
                  onChange={(e) => setMEpgUrl(e.target.value)}
                  placeholder="http://example.com/epg.xml"
                  className={inputClass}
                  disabled={loading}
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--color-primary)] text-[var(--color-txt-on-primary)] font-semibold hover:bg-[var(--color-primary-dark)] disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Connecting...
              </>
            ) : (
              'Add Playlist'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
