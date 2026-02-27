import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { calendarApi } from '../../api/calendar.api';
import type { CalendarPost, Comment } from '../../types/calendar.types';
import { PostStatus, Platform, UserRole } from '@expertmri/shared';
import { useAuth } from '../../context/AuthContext';
import { getCalendarGrid, isSameDay, formatDate, formatTime } from '../../utils/dateHelpers';
import { PLATFORM_CONFIG, STATUS_CONFIG, MONTHS } from '../../utils/constants';
import Modal from '../shared/Modal';
import CommentThread from '../comments/CommentThread';
import LoadingSpinner from '../shared/LoadingSpinner';
import { StatusBadge, PlatformBadge } from '../shared/Badge';

const YEARS = [2025, 2026];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CalendarView() {
  const { user } = useAuth();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [posts, setPosts] = useState<CalendarPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<CalendarPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await calendarApi.listPosts({ year, month: month + 1 });
      setPosts(data);
    } catch { /* ignore */ }
    setLoading(false);
  }, [year, month]);

  useEffect(() => { load(); }, [load]);

  const grid = useMemo(() => getCalendarGrid(year, month), [year, month]);

  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      if (filterPlatform !== 'all' && p.platform !== filterPlatform) return false;
      if (filterStatus !== 'all' && p.status !== filterStatus) return false;
      return true;
    });
  }, [posts, filterPlatform, filterStatus]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.values(PostStatus).forEach((s) => { counts[s] = posts.filter((p) => p.status === s).length; });
    return counts;
  }, [posts]);

  function navigate(dir: -1 | 1) {
    let m = month + dir;
    let y = year;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setMonth(m);
    setYear(y);
  }

  async function openPost(post: CalendarPost) {
    setSelectedPost(post);
    try {
      const c = await calendarApi.getComments(post._id);
      setComments(c);
    } catch { setComments([]); }
  }

  async function handleStatusChange(postId: string, status: PostStatus, comment?: string) {
    await calendarApi.changeStatus(postId, status, comment);
    await load();
    if (selectedPost?._id === postId) {
      const updated = await calendarApi.getPost(postId);
      setSelectedPost(updated);
    }
  }

  async function handleAddComment(text: string, parentId?: string) {
    if (!selectedPost) return;
    await calendarApi.addComment(selectedPost._id, text, parentId);
    const c = await calendarApi.getComments(selectedPost._id);
    setComments(c);
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-ghost text-xs px-2">◀</button>
        <h2 className="text-lg font-bold text-gray-100 min-w-[160px] text-center">
          {MONTHS[month]} {year}
        </h2>
        <button onClick={() => navigate(1)} className="btn-ghost text-xs px-2">▶</button>

        <div className="flex-1" />

        {/* Filters */}
        <select className="select text-xs w-32" value={filterPlatform} onChange={(e) => setFilterPlatform(e.target.value)}>
          <option value="all">All Platforms</option>
          {Object.values(Platform).map((p) => (
            <option key={p} value={p}>{PLATFORM_CONFIG[p].label}</option>
          ))}
        </select>
        <select className="select text-xs w-36" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">All Statuses</option>
          {Object.values(PostStatus).map((s) => (
            <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
          ))}
        </select>
      </div>

      {/* Stats Bar */}
      <div className="flex gap-2 flex-wrap">
        <span className="badge-gray">Total: {posts.length}</span>
        {Object.entries(statusCounts).filter(([, c]) => c > 0).map(([s, c]) => (
          <span key={s} className={STATUS_CONFIG[s as PostStatus].badgeClass}>{STATUS_CONFIG[s as PostStatus].label}: {c}</span>
        ))}
      </div>

      {/* Calendar Grid */}
      {loading ? <LoadingSpinner text="Loading posts..." /> : (
        <div className="card p-3">
          <div className="grid grid-cols-7 gap-px bg-slate-700/30 rounded-lg overflow-hidden">
            {WEEKDAYS.map((d) => (
              <div key={d} className="bg-slate-800 text-center py-2 text-[10px] font-semibold text-slate-400 uppercase">{d}</div>
            ))}
            {grid.flat().map((date, i) => {
              const dayPosts = date
                ? filteredPosts.filter((p) => isSameDay(new Date(p.date), date))
                : [];
              const isToday = date && isSameDay(date, now);
              return (
                <div
                  key={i}
                  className={`bg-slate-800/50 min-h-[80px] p-1.5 ${date ? 'hover:bg-slate-700/40' : 'opacity-30'} ${isToday ? 'ring-1 ring-emerald-500/50' : ''}`}
                >
                  {date && (
                    <>
                      <p className={`text-[10px] mb-1 ${isToday ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>
                        {date.getDate()}
                      </p>
                      <div className="space-y-0.5">
                        {dayPosts.slice(0, 3).map((p) => {
                          const cfg = PLATFORM_CONFIG[p.platform];
                          const statusCfg = STATUS_CONFIG[p.status as PostStatus];
                          return (
                            <button
                              key={p._id}
                              onClick={() => openPost(p)}
                              className="w-full text-left flex items-center gap-1 px-1 py-0.5 rounded text-[9px] truncate hover:bg-slate-600/40 transition-colors"
                              title={`${cfg.label}: ${p.title}`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: statusCfg.dotColor }} />
                              <span>{cfg.icon}</span>
                              <span className="truncate text-slate-300">{p.title}</span>
                            </button>
                          );
                        })}
                        {dayPosts.length > 3 && (
                          <p className="text-[9px] text-slate-500 pl-1">+{dayPosts.length - 3} more</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Post Detail Modal */}
      <Modal isOpen={!!selectedPost} onClose={() => setSelectedPost(null)} title={selectedPost?.title} wide>
        {selectedPost && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <PlatformBadge platform={selectedPost.platform} />
              <StatusBadge status={selectedPost.status as PostStatus} />
              <span className="badge-gray">{selectedPost.type}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-slate-400">Date:</span> <span className="text-gray-200">{formatDate(selectedPost.date)}</span></div>
              <div><span className="text-slate-400">Time:</span> <span className="text-gray-200">{formatTime(selectedPost.date)}</span></div>
              <div><span className="text-slate-400">Created by:</span> <span className="text-gray-200">{selectedPost.createdBy.name}</span></div>
              {selectedPost.approvedBy && (
                <div><span className="text-slate-400">Approved by:</span> <span className="text-gray-200">{selectedPost.approvedBy.name}</span></div>
              )}
            </div>

            {selectedPost.description && (
              <p className="text-sm text-slate-300 leading-relaxed bg-slate-900/50 rounded-lg p-3">{selectedPost.description}</p>
            )}

            {/* Approval Actions */}
            <ApprovalActions post={selectedPost} onStatusChange={handleStatusChange} userRole={user?.role as UserRole} />

            <hr className="border-slate-700" />

            {/* Threaded Comments */}
            <CommentThread comments={comments} onAdd={handleAddComment} />
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ── Approval Actions ── */

function ApprovalActions({
  post, onStatusChange, userRole,
}: {
  post: CalendarPost;
  onStatusChange: (id: string, status: PostStatus, comment?: string) => Promise<void>;
  userRole: UserRole;
}) {
  const [revisionComment, setRevisionComment] = useState('');
  const [acting, setActing] = useState(false);

  async function act(status: PostStatus, comment?: string) {
    setActing(true);
    try { await onStatusChange(post._id, status, comment); }
    finally { setActing(false); setRevisionComment(''); }
  }

  const s = post.status as PostStatus;
  const canSubmit = (s === PostStatus.DRAFT || s === PostStatus.REVISION) && (userRole === UserRole.CREATOR || userRole === UserRole.ADMIN);
  const canApprove = s === PostStatus.PENDING_REVIEW && (userRole === UserRole.REVIEWER || userRole === UserRole.ADMIN);
  const canSchedule = s === PostStatus.APPROVED && userRole === UserRole.ADMIN;

  return (
    <div className="flex flex-wrap gap-2 items-start">
      {canSubmit && (
        <button onClick={() => act(PostStatus.PENDING_REVIEW)} disabled={acting} className="btn-primary text-xs">
          Submit for Review
        </button>
      )}
      {canApprove && (
        <>
          <button onClick={() => act(PostStatus.APPROVED)} disabled={acting} className="btn-primary text-xs">
            ✓ Approve
          </button>
          <div className="flex gap-1 items-center">
            <input
              className="input text-xs w-48"
              placeholder="Revision reason..."
              value={revisionComment}
              onChange={(e) => setRevisionComment(e.target.value)}
            />
            <button
              onClick={() => act(PostStatus.REVISION, revisionComment)}
              disabled={acting || !revisionComment.trim()}
              className="btn-danger text-xs"
            >
              Request Revision
            </button>
          </div>
        </>
      )}
      {canSchedule && (
        <button onClick={() => act(PostStatus.SCHEDULED)} disabled={acting} className="btn-primary text-xs">
          Schedule ✓
        </button>
      )}
    </div>
  );
}
