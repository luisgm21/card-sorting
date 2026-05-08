import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { studiesApi } from '../api/studies';
import { participationsApi } from '../api/participations';
import { useAuth } from '../context/AuthContext';
import PageLoader from '../components/ui/PageLoader';
import ResultsMatrix from '../components/sorting/ResultsMatrix';
import toast from 'react-hot-toast';
import Modal from '../components/ui/Modal';

interface Study {
  _id: string;
  title: string;
  description: string;
  cards: { id: string; text: string; description?: string }[];
  predefinedCategories?: { id: string; name: string; description?: string }[];
  type: 'open' | 'closed' | 'hybrid';
  settings: {
    maxCardsPerCategory: number | null;
    minCardsPerCategory: number;
    allowUncategorized: boolean;
    timeLimit: number | null;
    shuffleCards: boolean;
  };
  status: 'draft' | 'published' | 'closed' | 'archived';
  createdBy: { _id: string; name: string; email: string };
  totalParticipants: number;
  shareableLink: string;
  createdAt: string;
}

interface Participation {
  _id: string;
  userId?: { _id: string; name: string; email: string } | null;
  anonymousId?: string;
  status: 'started' | 'completed' | 'abandoned';
  startedAt: string;
  completedAt?: string;
}

interface Analytics {
  study: { id: string; title: string; type: string; status: string; totalParticipants: number; cardsCount: number };
  participations: { total: number; completed: number; abandoned: number; completionRate: number };
}

interface StudyResults {
  studyTitle: string;
  totalResponses: number;
  averageTime: number;
  coOccurrenceMatrix: Record<string, Record<string, number>>;
  results: Participation[];
}

type Tab = 'info' | 'participations' | 'analytics' | 'results';

const statusLabels: Record<string, string> = {
  draft: 'Borrador',
  published: 'Publicado',
  closed: 'Cerrado',
  archived: 'Archivado',
};

const statusColors: Record<string, string> = {
  draft: 'bg-yellow-100 text-yellow-800',
  published: 'bg-green-100 text-green-800',
  closed: 'bg-red-100 text-red-800',
  archived: 'bg-gray-100 text-gray-800',
};

const typeLabels: Record<string, string> = {
  open: 'Abierto',
  closed: 'Cerrado',
  hybrid: 'Híbrido',
};

const StudyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isResearcher, isAdmin } = useAuth();
  const canEdit = isResearcher || isAdmin;

  const [study, setStudy] = useState<Study | null>(null);
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [results, setResults] = useState<StudyResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const [copySuccess, setCopySuccess] = useState(false);
  const [actionModal, setActionModal] = useState<{ isOpen: boolean; action: string }>({
    isOpen: false,
    action: '',
  });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (id) loadStudy();
  }, [id]);

  const loadStudy = async () => {
    setLoading(true);
    try {
      const res = await studiesApi.getById(id!);
      if (res.success) setStudy(res.data);
    } catch {
      toast.error('Error al cargar el estudio');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadParticipations = async () => {
    try {
      const res = await participationsApi.getByStudy(id!);
      if (res.success) setParticipations(res.data);
    } catch {
      toast.error('Error al cargar participaciones');
    }
  };

  const loadAnalytics = async () => {
    try {
      const res = await studiesApi.getAnalytics(id!);
      if (res.success) setAnalytics(res.data);
    } catch {
      toast.error('Error al cargar analíticas');
    }
  };

  const loadResults = async () => {
    try {
      const res = await participationsApi.getResults(id!);
      if (res.success) setResults(res.data);
    } catch {
      toast.error('Error al cargar resultados');
    }
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    if (tab === 'participations' && participations.length === 0) loadParticipations();
    if (tab === 'analytics' && !analytics) loadAnalytics();
    if (tab === 'results' && !results) loadResults();
  };

  const copyLink = () => {
    if (!study) return;
    const link = `${window.location.origin}/study/${study.shareableLink}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopySuccess(true);
      toast.success('Link copiado al portapapeles');
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const handleAction = async () => {
    if (!study) return;
    setActionLoading(true);
    try {
      const action = actionModal.action;
      if (action === 'publish') {
        await studiesApi.publish(study._id);
        toast.success('Estudio publicado');
      } else if (action === 'close') {
        await studiesApi.close(study._id);
        toast.success('Estudio cerrado');
      } else if (action === 'archive') {
        await studiesApi.archive(study._id);
        toast.success('Estudio archivado');
      }
      setActionModal({ isOpen: false, action: '' });
      loadStudy();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al cambiar estado');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !study) return <PageLoader />;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'info', label: 'Información' },
    ...(canEdit ? [{ key: 'participations' as Tab, label: 'Participaciones' }] : []),
    ...(canEdit ? [{ key: 'analytics' as Tab, label: 'Analíticas' }] : []),
    ...(canEdit ? [{ key: 'results' as Tab, label: 'Resultados' }] : []),
  ];

  const publicUrl = `${window.location.origin}/study/${study.shareableLink}`;

  const getStatusActions = () => {
    if (study.status === 'draft') {
      return (
        <>
          <Link
            to={`/studies/${study._id}/edit`}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Editar
          </Link>
          <button
            onClick={() => setActionModal({ isOpen: true, action: 'publish' })}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
          >
            Publicar
          </button>
        </>
      );
    }
    if (study.status === 'published') {
      return (
        <button
          onClick={() => setActionModal({ isOpen: true, action: 'close' })}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
        >
          Cerrar
        </button>
      );
    }
    if (study.status === 'closed') {
      return (
        <button
          onClick={() => setActionModal({ isOpen: true, action: 'archive' })}
          className="px-4 py-2 text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
        >
          Archivar
        </button>
      );
    }
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{study.title}</h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[study.status]}`}>
                {statusLabels[study.status]}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {typeLabels[study.type]}
              </span>
            </div>
            <p className="text-gray-500 mt-1">{study.description}</p>
            <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
              <span>Creado por {study.createdBy?.name}</span>
              <span>{study.totalParticipants} participantes</span>
              <span>{study.cards.length} tarjetas</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {canEdit && getStatusActions()}
          </div>
        </div>

        {/* Shareable Link */}
        {study.status === 'published' && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-blue-700">Link compartible:</span>
              <code className="flex-1 text-sm text-blue-600 bg-white px-2 py-1 rounded border border-blue-200 truncate">
                {publicUrl}
              </code>
              <button
                onClick={copyLink}
                className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors whitespace-nowrap"
              >
                {copySuccess ? '✓ Copiado' : 'Copiar'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cards */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tarjetas ({study.cards.length})</h2>
            <div className="space-y-2">
              {study.cards.map((card, idx) => (
                <div key={card.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-xs font-bold text-gray-400 mt-0.5">{idx + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{card.text}</p>
                    {card.description && (
                      <p className="text-xs text-gray-500 mt-0.5">{card.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Categories and Settings */}
          <div className="space-y-6">
            {study.predefinedCategories && study.predefinedCategories.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Categorías ({study.predefinedCategories.length})</h2>
                <div className="flex flex-wrap gap-2">
                  {study.predefinedCategories.map((cat) => (
                    <span
                      key={cat.id}
                      className="inline-flex items-center px-3 py-1.5 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-lg"
                    >
                      {cat.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuración</h2>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Barajar tarjetas</dt>
                  <dd className="font-medium">{study.settings.shuffleCards ? 'Sí' : 'No'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Permitir sin categoría</dt>
                  <dd className="font-medium">{study.settings.allowUncategorized ? 'Sí' : 'No'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Mín. por categoría</dt>
                  <dd className="font-medium">{study.settings.minCardsPerCategory}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Máx. por categoría</dt>
                  <dd className="font-medium">{study.settings.maxCardsPerCategory ?? 'Sin límite'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Límite de tiempo</dt>
                  <dd className="font-medium">{study.settings.timeLimit ? `${study.settings.timeLimit} min` : 'Sin límite'}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'participations' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {participations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No hay participaciones aún.</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Participante</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inicio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {participations.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {p.userId ? p.userId.name : p.anonymousId ? `Anónimo (${p.anonymousId.slice(0, 8)})` : 'Anónimo'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        p.status === 'completed' ? 'bg-green-100 text-green-800' :
                        p.status === 'started' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {p.status === 'completed' ? 'Completado' : p.status === 'started' ? 'Iniciado' : 'Abandonado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(p.startedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {p.completedAt ? new Date(p.completedAt).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'analytics' && analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{analytics.participations.total}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-500">Completados</p>
            <p className="text-3xl font-bold text-green-600 mt-1">{analytics.participations.completed}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-500">Abandonados</p>
            <p className="text-3xl font-bold text-red-600 mt-1">{analytics.participations.abandoned}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-500">Tasa de finalización</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">{analytics.participations.completionRate.toFixed(1)}%</p>
          </div>
        </div>
      )}

      {activeTab === 'results' && results && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Matriz de Co-ocurrencia</h2>
          <ResultsMatrix
            matrix={results.coOccurrenceMatrix}
            studyTitle={results.studyTitle}
            totalResponses={results.totalResponses}
            averageTime={results.averageTime}
          />
        </div>
      )}

      {activeTab === 'results' && !results && (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
          <p className="text-gray-500">Cargando resultados...</p>
        </div>
      )}

      {/* Action Modal */}
      <Modal
        isOpen={actionModal.isOpen}
        onClose={() => setActionModal({ isOpen: false, action: '' })}
        title={
          actionModal.action === 'publish' ? 'Publicar Estudio' :
          actionModal.action === 'close' ? 'Cerrar Estudio' : 'Archivar Estudio'
        }
        onConfirm={handleAction}
        confirmText={
          actionModal.action === 'publish' ? 'Publicar' :
          actionModal.action === 'close' ? 'Cerrar' : 'Archivar'
        }
        isLoading={actionLoading}
      >
        <p className="text-gray-600">
          {actionModal.action === 'publish' && 'Al publicar el estudio, los participantes podrán acceder mediante el link compartible.'}
          {actionModal.action === 'close' && 'Al cerrar el estudio, los participantes ya no podrán enviar sus respuestas.'}
          {actionModal.action === 'archive' && 'Al archivar el estudio, quedará oculto pero los datos se conservarán.'}
        </p>
      </Modal>
    </div>
  );
};

export default StudyDetail;
