import { useState, useEffect } from 'react';
import { usersApi } from '../api/users';
import PageLoader from '../components/ui/PageLoader';
import Modal from '../components/ui/Modal';
import toast from 'react-hot-toast';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'researcher' | 'participant';
  organization?: string;
  isActive: boolean;
  createdAt: string;
}

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  researcher: 'Investigador',
  participant: 'Participante',
};

const roleColors: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-800',
  researcher: 'bg-blue-100 text-blue-800',
  participant: 'bg-green-100 text-green-800',
};

const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('');
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    userId: string;
    userName: string;
    action: 'deactivate' | 'delete';
  }>({ isOpen: false, userId: '', userName: '', action: 'deactivate' });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [filterRole]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params: { role?: string } = {};
      if (filterRole) params.role = filterRole;
      const res = await usersApi.getAll(params);
      if (res.success) setUsers(res.data);
    } catch {
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    setActionLoading(true);
    try {
      await usersApi.deactivate(confirmModal.userId);
      toast.success('Usuario desactivado');
      setConfirmModal({ isOpen: false, userId: '', userName: '', action: 'deactivate' });
      loadUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al desactivar usuario');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await usersApi.delete(confirmModal.userId);
      toast.success('Usuario eliminado');
      setConfirmModal({ isOpen: false, userId: '', userName: '', action: 'delete' });
      loadUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al eliminar usuario');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-500 mt-1">Administra los usuarios del sistema</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="">Todos los roles</option>
            <option value="admin">Administrador</option>
            <option value="researcher">Investigador</option>
            <option value="participant">Participante</option>
          </select>
        </div>
      </div>

      {loading ? (
        <PageLoader />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Organización</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registro</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{u.name}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[u.role]}`}>
                      {roleLabels[u.role]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {u.organization || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      u.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {u.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {u.isActive && (
                        <button
                          onClick={() =>
                            setConfirmModal({
                              isOpen: true,
                              userId: u._id,
                              userName: u.name,
                              action: 'deactivate',
                            })
                          }
                          className="px-3 py-1.5 text-sm font-medium text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                        >
                          Desactivar
                        </button>
                      )}
                      <button
                        onClick={() =>
                          setConfirmModal({
                            isOpen: true,
                            userId: u._id,
                            userName: u.name,
                            action: 'delete',
                          })
                        }
                        className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No se encontraron usuarios
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, userId: '', userName: '', action: 'deactivate' })}
        title={confirmModal.action === 'deactivate' ? 'Desactivar Usuario' : 'Eliminar Usuario'}
        onConfirm={confirmModal.action === 'deactivate' ? handleDeactivate : handleDelete}
        confirmText={confirmModal.action === 'deactivate' ? 'Desactivar' : 'Eliminar'}
        confirmVariant="danger"
        isLoading={actionLoading}
      >
        <p className="text-gray-600">
          {confirmModal.action === 'deactivate'
            ? `¿Estás seguro de desactivar al usuario "${confirmModal.userName}"? Podrás reactivarlo después.`
            : `¿Estás seguro de eliminar al usuario "${confirmModal.userName}"? Esta acción no se puede deshacer.`}
        </p>
      </Modal>
    </div>
  );
};

export default AdminUsers;
