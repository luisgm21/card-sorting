import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersApi } from '../api/users';
import { authApi } from '../api/auth';
import Spinner from '../components/ui/Spinner';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [organization, setOrganization] = useState(user?.organization || '');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ field: string; message: string }[]>([]);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<{ field: string; message: string }[]>([]);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setOrganization(user.organization || '');
    }
  }, [user]);

  const getErrorMessage = (field: string) => {
    const error = errors.find((err) => err.field === field);
    return error ? error.message : '';
  };
  const getPasswordErrorMessage = (field: string) => {
    const error = passwordErrors.find((err) => err.field === field);
    return error ? error.message : '';
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setSaving(true);
    try {
      const res = await usersApi.updateProfile({ name, organization: organization || undefined });
      if (res.success) {
        localStorage.setItem('user', JSON.stringify(res.data));
        toast.success('Perfil actualizado');
      }
    } catch (err: any) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        setErrors([]);
        toast.error(err.response?.data?.message || 'Error al actualizar perfil');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrors([]);
    setChangingPassword(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      toast.success('Contraseña cambiada exitosamente');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      if (err.response?.data?.errors) {
        setPasswordErrors(err.response.data.errors);
      } else {
        setPasswordErrors([]);
        toast.error(err.response?.data?.message || 'Error al cambiar la contraseña');
      }
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Mi Perfil</h1>
      <div className="space-y-6">
        {/* Profile Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-blue-600">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{user?.name}</h2>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                {user?.role === 'admin' ? 'Administrador' : user?.role === 'researcher' ? 'Investigador' : 'Participante'}
              </span>
            </div>
          </div>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setErrors(errors.filter(err => err.field !== 'name')); }}
                className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${getErrorMessage('name') ? 'border-red-500' : ''}`}
              />
              {getErrorMessage('name') && (
                <p className="text-red-500 text-sm mt-1">{getErrorMessage('name')}</p>
              )}
            </div>
            <div>
              <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-1">
                Organización
              </label>
              <input
                id="organization"
                type="text"
                value={organization}
                onChange={(e) => { setOrganization(e.target.value); setErrors(errors.filter(err => err.field !== 'organization')); }}
                className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${getErrorMessage('organization') ? 'border-red-500' : ''}`}
                placeholder="Opcional"
              />
              {getErrorMessage('organization') && (
                <p className="text-red-500 text-sm mt-1">{getErrorMessage('organization')}</p>
              )}
            </div>
            {errors.length > 0 && errors.every(e => !e.field) && (
              <div className="text-red-500 text-sm mb-2">{errors[0].message}</div>
            )}
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? <Spinner size="sm" /> : 'Guardar cambios'}
            </button>
          </form>
        </div>
        {/* Password Change */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Cambiar contraseña</h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña actual
              </label>
              <input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => { setCurrentPassword(e.target.value); setPasswordErrors(passwordErrors.filter(err => err.field !== 'currentPassword')); }}
                className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${getPasswordErrorMessage('currentPassword') ? 'border-red-500' : ''}`}
              />
              {getPasswordErrorMessage('currentPassword') && (
                <p className="text-red-500 text-sm mt-1">{getPasswordErrorMessage('currentPassword')}</p>
              )}
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Nueva contraseña
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setPasswordErrors(passwordErrors.filter(err => err.field !== 'newPassword')); }}
                className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${getPasswordErrorMessage('newPassword') ? 'border-red-500' : ''}`}
              />
              {getPasswordErrorMessage('newPassword') && (
                <p className="text-red-500 text-sm mt-1">{getPasswordErrorMessage('newPassword')}</p>
              )}
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar nueva contraseña
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setPasswordErrors(passwordErrors.filter(err => err.field !== 'confirmPassword')); }}
                className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${getPasswordErrorMessage('confirmPassword') ? 'border-red-500' : ''}`}
              />
              {getPasswordErrorMessage('confirmPassword') && (
                <p className="text-red-500 text-sm mt-1">{getPasswordErrorMessage('confirmPassword')}</p>
              )}
            </div>
            {passwordErrors.length > 0 && passwordErrors.every(e => !e.field) && (
              <div className="text-red-500 text-sm mb-2">{passwordErrors[0].message}</div>
            )}
            <button
              type="submit"
              disabled={changingPassword}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {changingPassword ? <Spinner size="sm" /> : 'Cambiar contraseña'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
