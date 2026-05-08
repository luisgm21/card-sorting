import client from './client';

export interface StartParticipationData {
  studyLink: string;
  consentGiven: boolean;
}

export interface CompleteParticipationData {
  assignments: Record<string, string>;
  customCategories?: { id: string; name: string; description?: string }[];
  timeSpent?: number;
  cardOrder?: string[];
  comments?: string;
  difficulty?: number;
}

export const participationsApi = {
  start: (data: StartParticipationData) =>
    client.post('/participations/start', data).then((res) => res.data),

  getById: (id: string) =>
    client.get(`/participations/${id}`).then((res) => res.data),

  complete: (id: string, data: CompleteParticipationData) =>
    client.put(`/participations/${id}/complete`, data).then((res) => res.data),

  abandon: (id: string) =>
    client.patch(`/participations/${id}/abandon`).then((res) => res.data),

  getByStudy: (studyId: string, params?: { status?: string }) =>
    client.get(`/participations/studies/${studyId}/participations`, { params }).then((res) => res.data),

  getResults: (studyId: string) =>
    client.get(`/participations/studies/${studyId}/results`).then((res) => res.data),
};
