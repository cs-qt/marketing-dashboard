import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { productionApi } from '../../api/production.api';
import type { ProductionProject, Comment } from '../../types/calendar.types';
import { PostStatus, ProjectCategory, UserRole } from '@expertmri/shared';
import { useAuth } from '../../context/AuthContext';
import { formatDate, formatRelative } from '../../utils/dateHelpers';
import { formatBytes } from '../../utils/formatters';
import { STATUS_CONFIG, CATEGORY_CONFIG } from '../../utils/constants';
import Modal from '../shared/Modal';
import CommentThread from '../comments/CommentThread';
import LoadingSpinner from '../shared/LoadingSpinner';
import { StatusBadge } from '../shared/Badge';

export default function ProductionView() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProductionProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selected, setSelected] = useState<ProductionProject | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q: any = {};
      if (category !== 'all') q.category = category;
      if (statusFilter !== 'all') q.status = statusFilter;
      const data = await productionApi.listProjects(q);
      setProjects(data);
    } catch { /* ignore */ }
    setLoading(false);
  }, [category, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => {
    const c = { total: projects.length, print: 0, video: 0 };
    projects.forEach((p) => { if (p.category === ProjectCategory.PRINT) c.print++; else c.video++; });
    return c;
  }, [projects]);

  async function openProject(project: ProductionProject) {
    setSelected(project);
    try {
      const c = await productionApi.getComments(project._id);
      setComments(c);
    } catch { setComments([]); }
  }

  async function handleStatusChange(projectId: string, status: PostStatus, comment?: string) {
    await productionApi.changeStatus(projectId, status, comment);
    await load();
    if (selected?._id === projectId) {
      const updated = await productionApi.getProject(projectId);
      setSelected(updated);
    }
  }

  async function handleAddComment(text: string, parentId?: string) {
    if (!selected) return;
    await productionApi.addComment(selected._id, text, parentId);
    const c = await productionApi.getComments(selected._id);
    setComments(c);
  }

  async function handlePrintReadyUpload(projectId: string) {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      await productionApi.uploadPrintReadyFile(projectId, file);
      await load();
      const updated = await productionApi.getProject(projectId);
      setSelected(updated);
    };
    input.click();
  }

  async function handleDownload(projectId: string) {
    const { url } = await productionApi.getDownloadUrl(projectId);
    window.open(url, '_blank');
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-bold text-gray-100">Print & Video Production</h2>
        <div className="flex-1" />

        {/* Category Toggle */}
        <div className="flex bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          {[{ id: 'all', label: 'All' }, { id: 'print', label: '🖨️ Print' }, { id: 'video', label: '🎬 Video' }].map((opt) => (
            <button
              key={opt.id}
              onClick={() => setCategory(opt.id)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${category === opt.id ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-gray-200'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <select className="select text-xs w-36" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          {Object.values(PostStatus).map((s) => (
            <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
          ))}
        </select>

        {(user?.role === UserRole.CREATOR || user?.role === UserRole.ADMIN) && (
          <button onClick={() => setShowCreate(true)} className="btn-primary text-xs">+ New Project</button>
        )}
      </div>

      {/* Stats */}
      <div className="flex gap-2">
        <span className="badge-gray">Total: {counts.total}</span>
        <span className="badge-purple">Print: {counts.print}</span>
        <span className="badge-blue">Video: {counts.video}</span>
      </div>

      {/* Project Grid */}
      {loading ? <LoadingSpinner text="Loading projects..." /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <div key={p._id} className="card-hover" onClick={() => openProject(p)}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="text-xs text-slate-400">{CATEGORY_CONFIG[p.category as ProjectCategory]?.icon} {p.category}</span>
                  <h3 className="text-sm font-semibold text-gray-200">{p.projectName}</h3>
                </div>
                <StatusBadge status={p.status as PostStatus} />
              </div>
              <p className="text-xs text-slate-400 mb-2">{p.type} • {p.subject || 'No subject'}</p>
              {p.monthKey && <span className="badge-gray text-[10px]">{p.monthKey}</span>}
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-700/50">
                <span className="text-[10px] text-slate-500">{formatRelative(p.createdAt)}</span>
                <div className="flex gap-1.5">
                  {p.commentCount ? <span className="text-[10px] text-slate-400">💬 {p.commentCount}</span> : null}
                  {p.printReadyFile && <span className="text-[10px] text-emerald-400">📎 File</span>}
                </div>
              </div>
            </div>
          ))}
          {projects.length === 0 && (
            <div className="col-span-full text-center py-12 text-sm text-slate-400">
              No projects found. {user?.role !== UserRole.REVIEWER && 'Create one to get started.'}
            </div>
          )}
        </div>
      )}

      {/* Project Detail Modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={selected?.projectName} wide>
        {selected && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className="badge-purple">{CATEGORY_CONFIG[selected.category as ProjectCategory]?.label}</span>
              <StatusBadge status={selected.status as PostStatus} />
              <span className="badge-gray">{selected.type}</span>
              {selected.monthKey && <span className="badge-gray">{selected.monthKey}</span>}
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-slate-400">Subject:</span> <span className="text-gray-200">{selected.subject || '—'}</span></div>
              <div><span className="text-slate-400">Created by:</span> <span className="text-gray-200">{selected.createdBy.name}</span></div>
              <div><span className="text-slate-400">Created:</span> <span className="text-gray-200">{formatDate(selected.createdAt)}</span></div>
              {selected.approvedBy && (
                <div><span className="text-slate-400">Approved by:</span> <span className="text-gray-200">{selected.approvedBy.name}</span></div>
              )}
            </div>

            {selected.description && (
              <p className="text-sm text-slate-300 bg-slate-900/50 rounded-lg p-3">{selected.description}</p>
            )}

            {selected.link && (
              <a href={selected.link} target="_blank" rel="noreferrer" className="btn-secondary text-xs inline-flex">
                Open External Link →
              </a>
            )}

            {/* Print-Ready File Section */}
            {selected.printReadyFile ? (
              <div className="bg-emerald-900/20 border border-emerald-800/30 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-400">📎 Print Ready File</p>
                  <p className="text-xs text-slate-400">{selected.printReadyFile.fileName} • {formatBytes(selected.printReadyFile.fileSize)}</p>
                </div>
                <button onClick={() => handleDownload(selected._id)} className="btn-primary text-xs">
                  Download Print Ready File
                </button>
              </div>
            ) : (
              selected.status === PostStatus.APPROVED && user?.role === UserRole.ADMIN && (
                <button onClick={() => handlePrintReadyUpload(selected._id)} className="btn-primary text-xs">
                  Upload Print Ready File
                </button>
              )
            )}

            {/* Approval Actions */}
            <ProductionApproval
              project={selected}
              onStatusChange={handleStatusChange}
              userRole={user?.role as UserRole}
            />

            <hr className="border-slate-700" />

            {/* Threaded Comments */}
            <CommentThread comments={comments} onAdd={handleAddComment} />
          </div>
        )}
      </Modal>

      {/* Create Project Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Project">
        <CreateProjectForm onCreated={() => { setShowCreate(false); load(); }} />
      </Modal>
    </div>
  );
}

/* ── Approval Actions ── */

function ProductionApproval({
  project, onStatusChange, userRole,
}: {
  project: ProductionProject;
  onStatusChange: (id: string, status: PostStatus, comment?: string) => Promise<void>;
  userRole: UserRole;
}) {
  const [revisionComment, setRevisionComment] = useState('');
  const [acting, setActing] = useState(false);

  async function act(status: PostStatus, comment?: string) {
    setActing(true);
    try { await onStatusChange(project._id, status, comment); }
    finally { setActing(false); setRevisionComment(''); }
  }

  const s = project.status as PostStatus;
  const canSubmit = (s === PostStatus.DRAFT || s === PostStatus.REVISION) && (userRole === UserRole.CREATOR || userRole === UserRole.ADMIN);
  const canApprove = s === PostStatus.PENDING_REVIEW && (userRole === UserRole.REVIEWER || userRole === UserRole.ADMIN);
  const canSchedule = s === PostStatus.APPROVED && userRole === UserRole.ADMIN;

  return (
    <div className="flex flex-wrap gap-2 items-start">
      {canSubmit && (
        <button onClick={() => act(PostStatus.PENDING_REVIEW)} disabled={acting} className="btn-primary text-xs">Submit for Review</button>
      )}
      {canApprove && (
        <>
          <button onClick={() => act(PostStatus.APPROVED)} disabled={acting} className="btn-primary text-xs">✓ Approve</button>
          <div className="flex gap-1 items-center">
            <input className="input text-xs w-48" placeholder="Revision reason..." value={revisionComment} onChange={(e) => setRevisionComment(e.target.value)} />
            <button onClick={() => act(PostStatus.REVISION, revisionComment)} disabled={acting || !revisionComment.trim()} className="btn-danger text-xs">Request Revision</button>
          </div>
        </>
      )}
      {canSchedule && (
        <button onClick={() => act(PostStatus.SCHEDULED)} disabled={acting} className="btn-primary text-xs">Schedule ✓</button>
      )}
    </div>
  );
}

/* ── Create Project Form ── */

function CreateProjectForm({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState({
    category: ProjectCategory.PRINT as string,
    projectName: '', type: '', subject: '', description: '', link: '', monthKey: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.projectName.trim() || !form.type.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await productionApi.createProject({
        category: form.category as ProjectCategory,
        projectName: form.projectName,
        type: form.type,
        subject: form.subject || undefined,
        description: form.description || undefined,
        link: form.link || undefined,
        monthKey: form.monthKey || undefined,
      });
      onCreated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function set(key: string, val: string) { setForm((f) => ({ ...f, [key]: val })); }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="label">Category</label>
        <select className="select" value={form.category} onChange={(e) => set('category', e.target.value)}>
          <option value="print">Print & Design</option>
          <option value="video">Video Production</option>
        </select>
      </div>
      <div>
        <label className="label">Project Name *</label>
        <input className="input" value={form.projectName} onChange={(e) => set('projectName', e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Type *</label>
          <input className="input" placeholder="brochure, poster, ad..." value={form.type} onChange={(e) => set('type', e.target.value)} required />
        </div>
        <div>
          <label className="label">Month Key</label>
          <input className="input" placeholder="2026-03" value={form.monthKey} onChange={(e) => set('monthKey', e.target.value)} />
        </div>
      </div>
      <div>
        <label className="label">Subject</label>
        <input className="input" value={form.subject} onChange={(e) => set('subject', e.target.value)} />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea className="input min-h-[80px]" value={form.description} onChange={(e) => set('description', e.target.value)} />
      </div>
      <div>
        <label className="label">External Link</label>
        <input className="input" placeholder="https://..." value={form.link} onChange={(e) => set('link', e.target.value)} />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <button type="submit" disabled={submitting} className="btn-primary w-full">
        {submitting ? 'Creating...' : 'Create Project'}
      </button>
    </form>
  );
}
