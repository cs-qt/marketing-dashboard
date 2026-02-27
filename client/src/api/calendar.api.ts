import api, { unwrap } from './client';
import type { CalendarPost, Comment } from '../types/calendar.types';
import type { PostStatus, Platform } from '@expertmri/shared';

export interface CalendarQuery {
  month?: number;
  year?: number;
  platform?: Platform;
  status?: PostStatus;
}

export const calendarApi = {
  listPosts: (q?: CalendarQuery) =>
    api.get('/calendar/posts', { params: q }).then(unwrap<CalendarPost[]>),

  getPost: (id: string) =>
    api.get(`/calendar/posts/${id}`).then(unwrap<CalendarPost>),

  createPost: (data: {
    date: string; platform: Platform; title: string; description?: string;
    type: string; mediaUrls?: string[];
  }) => api.post('/calendar/posts', data).then(unwrap<CalendarPost>),

  updatePost: (id: string, data: Partial<CalendarPost>) =>
    api.put(`/calendar/posts/${id}`, data).then(unwrap<CalendarPost>),

  deletePost: (id: string) =>
    api.delete(`/calendar/posts/${id}`).then(unwrap),

  changeStatus: (id: string, status: PostStatus, comment?: string) =>
    api.patch(`/calendar/posts/${id}/status`, { status, comment }).then(unwrap<CalendarPost>),

  /* Comments */
  getComments: (postId: string) =>
    api.get(`/comments/calendar_post/${postId}`).then(unwrap<Comment[]>),

  addComment: (postId: string, text: string, parentCommentId?: string) =>
    api.post(`/comments/calendar_post/${postId}`, { text, parentCommentId }).then(unwrap<Comment>),
};
