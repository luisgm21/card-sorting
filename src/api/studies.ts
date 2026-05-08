import client from './client';

export interface Card {
  id: string;
  text: string;
  description?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface StudySettings {
  maxCardsPerCategory: number | null;
  minCardsPerCategory: number;
  allowUncategorized: boolean;
  timeLimit: number | null;
  shuffleCards: boolean;
}

export interface CreateStudyData {
  title: string;
  description: string;
  cards: Card[];
  predefinedCategories?: Category[];
  type: 'open' | 'closed' | 'hybrid';
  settings: StudySettings;
}

export const studiesApi = {
  create: (data: CreateStudyData) =>
    client.post('/studies', data).then((res) => res.data),

  list: (params?: { status?: string; type?: string }) =>
    client.get('/studies', { params }).then((res) => res.data),

  getById: (id: string) =>
    client.get(`/studies/${id}`).then((res) => res.data),

  update: (id: string, data: Partial<CreateStudyData>) =>
    client.put(`/studies/${id}`, data).then((res) => res.data),

  publish: (id: string) =>
    client.patch(`/studies/${id}/publish`).then((res) => res.data),

  close: (id: string) =>
    client.patch(`/studies/${id}/close`).then((res) => res.data),

  archive: (id: string) =>
    client.patch(`/studies/${id}/archive`).then((res) => res.data),

  delete: (id: string) =>
    client.delete(`/studies/${id}`).then((res) => res.data),

  getByLink: (link: string) =>
    client.get(`/studies/public/${link}`).then((res) => res.data),

  getAnalytics: (id: string) =>
    client.get(`/studies/${id}/analytics`).then((res) => res.data),
};
