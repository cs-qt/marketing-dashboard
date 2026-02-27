import React, { useState } from 'react';
import type { Comment } from '../../types/calendar.types';
import { formatRelative } from '../../utils/dateHelpers';
import { useAuth } from '../../context/AuthContext';

interface CommentThreadProps {
  comments: Comment[];
  onAdd: (text: string, parentId?: string) => Promise<void>;
  loading?: boolean;
}

export default function CommentThread({ comments, onAdd, loading }: CommentThreadProps) {
  const [newText, setNewText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newText.trim()) return;
    setSubmitting(true);
    try {
      await onAdd(newText.trim());
      setNewText('');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Comments</h4>

      {comments.length === 0 && !loading && (
        <p className="text-xs text-slate-500 py-2">No comments yet</p>
      )}

      {comments.map((c) => (
        <CommentItem key={c._id} comment={c} onReply={onAdd} />
      ))}

      <form onSubmit={handleSubmit} className="flex gap-2 mt-2">
        <input
          type="text"
          className="input text-xs flex-1"
          placeholder="Add a comment..."
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
        />
        <button type="submit" disabled={submitting || !newText.trim()} className="btn-primary text-xs px-3">
          {submitting ? '...' : 'Send'}
        </button>
      </form>
    </div>
  );
}

function CommentItem({ comment, onReply, depth = 0 }: { comment: Comment; onReply: (text: string, parentId?: string) => Promise<void>; depth?: number }) {
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      await onReply(replyText.trim(), comment._id);
      setReplyText('');
      setReplying(false);
    } finally {
      setSubmitting(false);
    }
  }

  const isRevision = comment.text.startsWith('[Revision Request]');

  return (
    <div className={`${depth > 0 ? 'ml-6 border-l border-slate-700 pl-3' : ''}`}>
      <div className={`rounded-lg p-2.5 ${isRevision ? 'bg-red-900/20 border border-red-900/30' : 'bg-slate-900/50'}`}>
        <div className="flex items-center gap-2 mb-1">
          {comment.author.picture ? (
            <img src={comment.author.picture} className="w-5 h-5 rounded-full" alt="" />
          ) : (
            <div className="w-5 h-5 rounded-full bg-slate-600 flex items-center justify-center text-[9px] font-bold">
              {comment.author.name.charAt(0)}
            </div>
          )}
          <span className="text-xs font-medium text-gray-200">{comment.author.name}</span>
          <span className="text-[10px] text-slate-500">{formatRelative(comment.createdAt)}</span>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">
          {isRevision ? comment.text.replace('[Revision Request] ', '') : comment.text}
          {isRevision && <span className="badge-red ml-2 text-[9px]">Revision</span>}
        </p>
        {depth < 3 && (
          <button
            onClick={() => setReplying(!replying)}
            className="text-[10px] text-slate-400 hover:text-emerald-400 mt-1"
          >
            Reply
          </button>
        )}
      </div>

      {replying && (
        <form onSubmit={handleReply} className="flex gap-2 mt-1 ml-6">
          <input
            type="text"
            className="input text-xs flex-1"
            placeholder="Write a reply..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            autoFocus
          />
          <button type="submit" disabled={submitting} className="btn-primary text-xs px-2">
            {submitting ? '...' : 'Reply'}
          </button>
          <button type="button" onClick={() => setReplying(false)} className="btn-ghost text-xs px-2">Cancel</button>
        </form>
      )}

      {comment.replies?.map((r) => (
        <CommentItem key={r._id} comment={r} onReply={onReply} depth={depth + 1} />
      ))}
    </div>
  );
}
