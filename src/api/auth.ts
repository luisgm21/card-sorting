import client from './client';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: 'admin' | 'researcher' | 'participant';
  organization?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export const authApi = {
  login: (data: LoginData) =>
    client.post('/auth/login', data).then((res) => res.data),

  register: (data: RegisterData) =>
    client.post('/auth/register', data).then((res) => res.data),

  changePassword: (data: ChangePasswordData) =>
    client.put('/auth/change-password', data).then((res) => res.data),
};
