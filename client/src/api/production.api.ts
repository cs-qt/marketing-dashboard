import api, { unwrap } from './client';
import type { ProductionProject, Comment } from '../types/calendar.types';
import type { PostStatus, ProjectCategory } from '@expertmri/shared';

export interface ProductionQuery {
  category?: ProjectCategory;
  status?: PostStatus;
  monthKey?: string;
}

export const productionApi = {
  listProjects: (q?: ProductionQuery) =>
    api.get('/production/projects', { params: q }).then(unwrap<ProductionProject[]>),

  getProject: (id: string) =>
    api.get(`/production/projects/${id}`).then(unwrap<ProductionProject>),

  createProject: (data: {
    category: ProjectCategory; projectName: string; type: string;
    subject?: string; description?: string; link?: string; monthKey?: string;
  }) => api.post('/production/projects', data).then(unwrap<ProductionProject>),

  updateProject: (id: string, data: Partial<ProductionProject>) =>
    api.put(`/production/projects/${id}`, data).then(unwrap<ProductionProject>),

  deleteProject: (id: string) =>
    api.delete(`/production/projects/${id}`).then(unwrap),

  changeStatus: (id: string, status: PostStatus, comment?: string) =>
    api.patch(`/production/projects/${id}/status`, { status, comment }).then(unwrap<ProductionProject>),

  uploadPrintReadyFile: (id: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/production/projects/${id}/print-ready-file`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(unwrap<ProductionProject>);
  },

  deletePrintReadyFile: (id: string) =>
    api.delete(`/production/projects/${id}/print-ready-file`).then(unwrap),

  getDownloadUrl: (id: string) =>
    api.get(`/production/projects/${id}/download`).then(unwrap<{ url: string; fileName: string }>),

  getApproved: (category?: string) =>
    api.get('/production/approved', { params: { category } }).then(unwrap<Record<string, ProductionProject[]>>),

  /* Comments */
  getComments: (projectId: string) =>
    api.get(`/comments/production_project/${projectId}`).then(unwrap<Comment[]>),

  addComment: (projectId: string, text: string, parentCommentId?: string) =>
    api.post(`/comments/production_project/${projectId}`, { text, parentCommentId }).then(unwrap<Comment>),
};
