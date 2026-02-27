import api, { unwrap } from './client';
import type { MonthData, MonthMedia, MediaVersion } from '../types/media.types';

export const mediaApi = {
  /* ── Months ── */
  listMonths: (year?: number) =>
    api.get('/months', { params: year ? { year } : {} }).then(unwrap<MonthData[]>),

  getMonth: (id: string) =>
    api.get(`/months/${id}`).then(unwrap<MonthData>),

  createMonth: (data: { monthName: string; year: number; title?: string; description?: string }) =>
    api.post('/months', data).then(unwrap<MonthData>),

  updateMonth: (id: string, data: { title?: string; description?: string }) =>
    api.put(`/months/${id}`, data).then(unwrap<MonthData>),

  deleteMonth: (id: string) =>
    api.delete(`/months/${id}`).then(unwrap),

  /* ── Month Media ── */
  listMedia: (monthId: string) =>
    api.get(`/media/${monthId}`).then(unwrap<MonthMedia[]>),

  uploadMedia: (monthId: string, file: File, meta: { mediaType: string; title?: string; description?: string }) => {
    const form = new FormData();
    form.append('file', file);
    form.append('mediaType', meta.mediaType);
    if (meta.title) form.append('title', meta.title);
    if (meta.description) form.append('description', meta.description);
    return api.post(`/media/${monthId}/upload`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(unwrap<MonthMedia>);
  },

  uploadNewVersion: (mediaId: string, file: File, resolution?: string, notes?: string) => {
    const form = new FormData();
    form.append('file', file);
    if (resolution) form.append('resolution', resolution);
    if (notes) form.append('notes', notes);
    return api.post(`/media/${mediaId}/version`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(unwrap<MonthMedia>);
  },

  switchActiveVersion: (mediaId: string, versionId: string) =>
    api.patch(`/media/${mediaId}/active-version`, { versionId }).then(unwrap<MonthMedia>),

  listVersions: (mediaId: string) =>
    api.get(`/media/${mediaId}/versions`).then(unwrap<MediaVersion[]>),

  getDownloadUrl: (versionId: string) =>
    api.get(`/media/version/${versionId}/download`).then(unwrap<{ url: string; fileName: string; fileType: string; fileSize: number }>),

  updateMedia: (mediaId: string, data: { title?: string; description?: string }) =>
    api.put(`/media/${mediaId}/meta`, data).then(unwrap<MonthMedia>),

  deleteMedia: (mediaId: string) =>
    api.delete(`/media/${mediaId}`).then(unwrap),
};
