import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { studiesApi } from '../api/studies';
import { useAuth } from '../context/AuthContext';
import PageLoader from '../components/ui/PageLoader';
import toast from 'react-hot-toast';
import Modal from '../components/ui/Modal';

interface Study {
  _id: string;
  title: string;
  description: string;
  type: 'open' | 'closed' | 'hybrid';
  status: 'draft' | 'published' | 'closed' | 'archived';
  totalParticipants: number;
  createdAt: string;
  createdBy: { _id: string; name: string; email: string };
  shareableLink: string;
}

const statusColors: Record<string, string> = {
  draft: 'bg-yellow-100 text-yellow-800',
  published: 'bg-green-100 text-green-800',
  closed: 'bg-red-100 text-red-800',
  archived: 'bg-gray-100 text-gray-800',
};

const statusLabels: Record<string, string> = {
  draft: 'Borrador',
  published: 'Publicado',
  closed: 'Cerrado',
  archived: 'Archivado',
};

const typeLabels: Record<string, string> = {
  open: 'Abierto',
  closed: 'Cerrado',
  hybrid: 'Híbrido',
};

const Dashboard = () => {
  const [studies, setStudies] = useState<Study[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; studyId: string; studyTitle: string }>({
    isOpen: false,
    studyId: '',
    studyTitle: '',
  });
  const [deleting, setDeleting] = useState(false);
  const { user, isResearcher } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadStudies();
  }, [filterStatus, filterType]);

  const loadStudies = async () => {
    setLoading(true);
    try {
      const params: { status?: string; type?: string } = {};
      if (filterStatus) params.status = filterStatus;
      if (filterType) params.type = filterType;
      const res = await studiesApi.list(params);
      if (res.success) {
        setStudies(res.studies);
      }
    } catch (err: any) {
      toast.error('Error al cargar estudios');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await studiesApi.delete(deleteModal.studyId);
      toast.success('Estudio eliminado');
      setDeleteModal({ isOpen: false, studyId: '', studyTitle: '' });
      loadStudies();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al eliminar');
    } finally {
      setDeleting(false);
    }
  };

  const handleStatusChange = async (id: string, action: 'publish' | 'close' | 'archive') => {
    try {
      const actionLabels = { publish: 'publicado', close: 'cerrado', archive: 'archivado' };
      if (action === 'publish') await studiesApi.publish(id);
      else if (action === 'close') await studiesApi.close(id);
      else await studiesApi.archive(id);
      toast.success(`Estudio ${actionLabels[action]}`);
      loadStudies();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al cambiar estado');
    }
  };

  const safeStudies = studies || [];
  const totalParticipants = safeStudies.reduce((sum, s) => sum + s.totalParticipants, 0);
  const completedStudies = safeStudies.filter((s) => s.status === 'published' || s.status === 'closed').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Bienvenido, {user?.name}</p>
        </div>
        {isResearcher && (
          <Link
            to="/studies/new"
            className="mt-4 sm:mt-0 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Estudio
          </Link>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-500">Total Estudios</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{safeStudies.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-500">Participantes Totales</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{totalParticipants}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-500">Estudios Activos</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{completedStudies}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div>
            <label htmlFor="filterStatus" className="block text-xs font-medium text-gray-500 mb-1">Estado</label>
            <select
              id="filterStatus"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">Todos</option>
              <option value="draft">Borrador</option>
              <option value="published">Publicado</option>
              <option value="closed">Cerrado</option>
              <option value="archived">Archivado</option>
            </select>
          </div>
          <div>
            <label htmlFor="filterType" className="block text-xs font-medium text-gray-500 mb-1">Tipo</label>
            <select
              id="filterType"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">Todos</option>
              <option value="open">Abierto</option>
              <option value="closed">Cerrado</option>
              <option value="hybrid">Híbrido</option>
            </select>
          </div>
        </div>
      </div>

      {/* Studies List */}
      {loading ? (
        <PageLoader />
      ) : safeStudies.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No hay estudios</h3>
          <p className="mt-1 text-gray-500">Crea tu primer estudio para comenzar.</p>
          {isResearcher && (
            <Link
              to="/studies/new"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Crear Estudio
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {safeStudies.map((study) => (
            <div
              key={study._id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">{study.title}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[study.status]}`}>
                      {statusLabels[study.status]}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {typeLabels[study.type]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-2">{study.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>{study.totalParticipants} participantes</span>
                    <span>Creado {new Date(study.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to={`/studies/${study._id}`}
                    className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    Detalle
                  </Link>
                  {isResearcher && study.status === 'draft' && (
                    <>
                      <Link
                        to={`/studies/${study._id}/edit`}
                        className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        Editar
                      </Link>
                      <button
                        onClick={() => handleStatusChange(study._id, 'publish')}
                        className="px-3 py-1.5 text-sm font-medium text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      >
                        Publicar
                      </button>
                      <button
                        onClick={() => setDeleteModal({ isOpen: true, studyId: study._id, studyTitle: study.title })}
                        className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        Eliminar
                      </button>
                    </>
                  )}
                  {isResearcher && study.status === 'published' && (
                    <button
                      onClick={() => handleStatusChange(study._id, 'close')}
                      className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Cerrar
                    </button>
                  )}
                  {isResearcher && study.status === 'closed' && (
                    <button
                      onClick={() => handleStatusChange(study._id, 'archive')}
                      className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Archivar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, studyId: '', studyTitle: '' })}
        title="Eliminar Estudio"
        onConfirm={handleDelete}
        confirmText="Eliminar"
        confirmVariant="danger"
        isLoading={deleting}
      >
        <p className="text-gray-600">
          ¿Estás seguro de que deseas eliminar el estudio <strong>"{deleteModal.studyTitle}"</strong>? Esta acción no se puede deshacer.
        </p>
      </Modal>
    </div>
  );
};

export default Dashboard;
