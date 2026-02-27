import React, { useState, useEffect, useCallback } from 'react';
import { mediaApi } from '../../api/media.api';
import type { MonthData, MonthMedia, MediaVersion } from '../../types/media.types';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '@expertmri/shared';
import { formatDate, formatRelative } from '../../utils/dateHelpers';
import { formatBytes } from '../../utils/formatters';
import { MONTHS } from '../../utils/constants';
import Modal from '../shared/Modal';
import LoadingSpinner from '../shared/LoadingSpinner';
import { ErrorState } from '../shared/ErrorState';
import CommentThread from '../comments/CommentThread';
import api, { unwrap } from '../../api/client';
import type { Comment } from '../../types/calendar.types';

export default function MediaGallery() {
  const { user } = useAuth();
  const [months, setMonths] = useState<MonthData[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<MonthData | null>(null);
  const [media, setMedia] = useState<MonthMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateMonth, setShowCreateMonth] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MonthMedia | null>(null);
  const [versions, setVersions] = useState<MediaVersion[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());

  const loadMonths = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await mediaApi.listMonths(yearFilter);
      setMonths(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [yearFilter]);

  useEffect(() => { loadMonths(); }, [loadMonths]);

  async function openMonth(month: MonthData) {
    setSelectedMonth(month);
    setMediaLoading(true);
    try {
      const items = await mediaApi.listMedia(month._id);
      setMedia(items);
    } catch { setMedia([]); }
    setMediaLoading(false);
  }

  async function openMediaDetail(item: MonthMedia) {
    setSelectedMedia(item);
    try {
      const [v, c] = await Promise.all([
        mediaApi.listVersions(item._id),
        api.get(`/comments/month/${selectedMonth!._id}`).then(unwrap<Comment[]>).catch(() => []),
      ]);
      setVersions(v);
      setComments(c);
    } catch {
      setVersions([]);
      setComments([]);
    }
  }

  async function handleUpload() {
    if (!selectedMonth) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*';
    input.multiple = false;
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const mediaType = file.type.startsWith('video') ? 'video' : 'image';
      try {
        await mediaApi.uploadMedia(selectedMonth._id, file, {
          mediaType,
          title: file.name,
        });
        const items = await mediaApi.listMedia(selectedMonth._id);
        setMedia(items);
      } catch (err: any) {
        alert(err.message || 'Upload failed');
      }
    };
    input.click();
  }

  async function handleNewVersion(mediaId: string) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const notes = prompt('Version notes (optional):') || '';
      try {
        await mediaApi.uploadNewVersion(mediaId, file, 'original', notes);
        const [v, items] = await Promise.all([
          mediaApi.listVersions(mediaId),
          mediaApi.listMedia(selectedMonth!._id),
        ]);
        setVersions(v);
        setMedia(items);
        const updated = items.find((m) => m._id === mediaId);
        if (updated) setSelectedMedia(updated);
      } catch (err: any) {
        alert(err.message || 'Upload failed');
      }
    };
    input.click();
  }

  async function handleSwitchVersion(mediaId: string, versionId: string) {
    try {
      await mediaApi.switchActiveVersion(mediaId, versionId);
      const [v, items] = await Promise.all([
        mediaApi.listVersions(mediaId),
        mediaApi.listMedia(selectedMonth!._id),
      ]);
      setVersions(v);
      setMedia(items);
      const updated = items.find((m) => m._id === mediaId);
      if (updated) setSelectedMedia(updated);
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleDownload(versionId: string) {
    const { url } = await mediaApi.getDownloadUrl(versionId);
    window.open(url, '_blank');
  }

  async function handleAddComment(text: string, parentId?: string) {
    if (!selectedMonth) return;
    await api.post(`/comments/month/${selectedMonth._id}`, { text, parentCommentId: parentId });
    const c = await api.get(`/comments/month/${selectedMonth._id}`).then(unwrap<Comment[]>).catch(() => []);
    setComments(c);
  }

  const isAdmin = user?.role === UserRole.ADMIN;
  const canUpload = user?.role === UserRole.CREATOR || isAdmin;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-bold text-gray-100">Media Library</h2>
        <div className="flex-1" />
        <select
          className="select text-xs w-28"
          value={yearFilter}
          onChange={(e) => setYearFilter(Number(e.target.value))}
        >
          {[2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        {isAdmin && (
          <button onClick={() => setShowCreateMonth(true)} className="btn-primary text-xs">
            + New Month
          </button>
        )}
      </div>

      {loading ? <LoadingSpinner text="Loading months..." /> : error ? <ErrorState message={error} onRetry={loadMonths} /> : (
        <>
          {/* Month Cards */}
          {!selectedMonth ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {months.map((m) => (
                <div key={m._id} className="card-hover text-center" onClick={() => openMonth(m)}>
                  <p className="text-2xl mb-1">📁</p>
                  <p className="text-sm font-semibold text-gray-200">{m.monthName}</p>
                  <p className="text-xs text-slate-400">{m.year}</p>
                  {m.title && <p className="text-[10px] text-slate-500 mt-1 truncate">{m.title}</p>}
                </div>
              ))}
              {months.length === 0 && (
                <div className="col-span-full text-center py-12 text-sm text-slate-400">
                  No months found for {yearFilter}. {isAdmin && 'Create one to get started.'}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Month Detail View */}
              <div className="flex items-center gap-3">
                <button onClick={() => { setSelectedMonth(null); setMedia([]); }} className="btn-ghost text-xs">
                  ← Back
                </button>
                <h3 className="text-lg font-bold text-gray-100">{selectedMonth.monthName} {selectedMonth.year}</h3>
                {selectedMonth.title && (
                  <span className="text-sm text-slate-400">— {selectedMonth.title}</span>
                )}
                <div className="flex-1" />
                {canUpload && (
                  <button onClick={handleUpload} className="btn-primary text-xs">
                    + Upload Media
                  </button>
                )}
              </div>

              {selectedMonth.description && (
                <p className="text-sm text-slate-300 bg-slate-900/50 rounded-lg p-3">{selectedMonth.description}</p>
              )}

              {/* Media Grid */}
              {mediaLoading ? <LoadingSpinner text="Loading media..." /> : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {media.map((item) => {
                    const ver = item.activeVersionId as MediaVersion | null;
                    const isImage = item.mediaType === 'image';
                    return (
                      <div key={item._id} className="card-hover p-2" onClick={() => openMediaDetail(item)}>
                        <div className="aspect-square bg-slate-900 rounded-lg flex items-center justify-center overflow-hidden mb-2">
                          {ver && isImage ? (
                            <img src={ver.url} alt={item.title} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-3xl">{isImage ? '🖼️' : '🎬'}</span>
                          )}
                        </div>
                        <p className="text-xs font-medium text-gray-200 truncate">{item.title}</p>
                        <p className="text-[10px] text-slate-400">
                          {item.mediaType} • v{(ver as any)?.versionNumber || 1}
                        </p>
                      </div>
                    );
                  })}
                  {media.length === 0 && (
                    <div className="col-span-full text-center py-12 text-sm text-slate-400">
                      No media yet. {canUpload && 'Upload files to get started.'}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Media Detail Modal */}
      <Modal isOpen={!!selectedMedia} onClose={() => setSelectedMedia(null)} title={selectedMedia?.title} wide>
        {selectedMedia && (
          <div className="space-y-4">
            {/* Preview */}
            <div className="bg-slate-900 rounded-lg p-4 flex items-center justify-center min-h-[200px]">
              {selectedMedia.mediaType === 'image' && selectedMedia.activeVersionId ? (
                <img
                  src={(selectedMedia.activeVersionId as MediaVersion).url}
                  alt={selectedMedia.title}
                  className="max-h-[400px] rounded-lg object-contain"
                />
              ) : (
                <span className="text-5xl">{selectedMedia.mediaType === 'image' ? '🖼️' : '🎬'}</span>
              )}
            </div>

            {/* Info */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-slate-400">Type:</span> <span className="text-gray-200 capitalize">{selectedMedia.mediaType}</span></div>
              <div><span className="text-slate-400">Created:</span> <span className="text-gray-200">{formatDate(selectedMedia.createdAt)}</span></div>
              <div><span className="text-slate-400">Created by:</span> <span className="text-gray-200">{selectedMedia.createdBy?.name || '—'}</span></div>
              <div><span className="text-slate-400">Versions:</span> <span className="text-gray-200">{versions.length}</span></div>
            </div>

            {selectedMedia.description && (
              <p className="text-sm text-slate-300 bg-slate-900/50 rounded-lg p-3">{selectedMedia.description}</p>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              {canUpload && (
                <button onClick={() => handleNewVersion(selectedMedia._id)} className="btn-primary text-xs">
                  Upload New Version
                </button>
              )}
              {selectedMedia.activeVersionId && (
                <button
                  onClick={() => handleDownload((selectedMedia.activeVersionId as MediaVersion)._id)}
                  className="btn-secondary text-xs"
                >
                  Download Current
                </button>
              )}
            </div>

            {/* Version History */}
            {versions.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Version History</h4>
                <div className="space-y-1.5">
                  {versions.map((v) => (
                    <div
                      key={v._id}
                      className={`flex items-center justify-between p-2.5 rounded-lg ${
                        v.isActive ? 'bg-emerald-900/20 border border-emerald-800/30' : 'bg-slate-900/50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-200">v{v.versionNumber}</span>
                          {v.isActive && <span className="badge-green text-[9px]">Active</span>}
                          <span className="text-[10px] text-slate-400">{v.resolution}</span>
                        </div>
                        <p className="text-[10px] text-slate-500">
                          {formatBytes(v.fileSize)} • {v.fileType} • {formatRelative(v.uploadedAt)}
                        </p>
                        {v.notes && <p className="text-[10px] text-slate-400 mt-0.5">{v.notes}</p>}
                      </div>
                      <div className="flex gap-1">
                        {!v.isActive && canUpload && (
                          <button
                            onClick={() => handleSwitchVersion(selectedMedia._id, v._id)}
                            className="btn-ghost text-[10px] px-2"
                          >
                            Set Active
                          </button>
                        )}
                        <button onClick={() => handleDownload(v._id)} className="btn-ghost text-[10px] px-2">
                          ↓
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <hr className="border-slate-700" />

            {/* Comments on the month */}
            <CommentThread comments={comments} onAdd={handleAddComment} />
          </div>
        )}
      </Modal>

      {/* Create Month Modal */}
      <Modal isOpen={showCreateMonth} onClose={() => setShowCreateMonth(false)} title="Create Month">
        <CreateMonthForm onCreated={() => { setShowCreateMonth(false); loadMonths(); }} />
      </Modal>
    </div>
  );
}

/* ── Create Month Form ── */

function CreateMonthForm({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState({ monthName: MONTHS[new Date().getMonth()], year: new Date().getFullYear(), title: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await mediaApi.createMonth(form);
      onCreated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Month</label>
          <select className="select" value={form.monthName} onChange={(e) => setForm(f => ({ ...f, monthName: e.target.value }))}>
            {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Year</label>
          <input type="number" className="input" value={form.year} onChange={(e) => setForm(f => ({ ...f, year: Number(e.target.value) }))} min={2020} max={2100} />
        </div>
      </div>
      <div>
        <label className="label">Title</label>
        <input className="input" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Optional title..." />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea className="input min-h-[80px]" value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description..." />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <button type="submit" disabled={submitting} className="btn-primary w-full">
        {submitting ? 'Creating...' : 'Create Month'}
      </button>
    </form>
  );
}
