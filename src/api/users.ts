import client from './client';

export interface UpdateProfileData {
  name?: string;
  organization?: string;
}

export const usersApi = {
  getProfile: () =>
    client.get('/users/profile').then((res) => res.data),

  updateProfile: (data: UpdateProfileData) =>
    client.put('/users/profile', data).then((res) => res.data),

  getAll: (params?: { role?: string; isActive?: boolean }) =>
    client.get('/users', { params }).then((res) => res.data),

  getById: (id: string) =>
    client.get(`/users/${id}`).then((res) => res.data),

  deactivate: (id: string) =>
    client.patch(`/users/${id}/deactivate`).then((res) => res.data),

  delete: (id: string) =>
    client.delete(`/users/${id}`).then((res) => res.data),
};
