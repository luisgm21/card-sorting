import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import StudyForm from '../components/studies/StudyForm';
import { studiesApi, type CreateStudyData } from '../api/studies';
import PageLoader from '../components/ui/PageLoader';
import toast from 'react-hot-toast';

const StudyEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [initialData, setInitialData] = useState<CreateStudyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    loadStudy();
  }, [id]);

  const loadStudy = async () => {
    try {
      const res = await studiesApi.getById(id!);
      if (res.success) {
        const study = res.data;
        setInitialData({
          title: study.title,
          description: study.description,
          type: study.type,
          cards: study.cards,
          predefinedCategories: study.predefinedCategories || [],
          settings: study.settings,
        });
      }
    } catch (err: any) {
      toast.error('Error al cargar el estudio');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: CreateStudyData) => {
    setIsSubmitting(true);
    try {
      const res = await studiesApi.update(id!, data);
      if (res.success) {
        toast.success('Estudio actualizado exitosamente');
        navigate(`/studies/${id}`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al actualizar el estudio');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <PageLoader />;
  if (!initialData) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Editar Estudio</h1>
        <p className="text-gray-500 mt-1">Modifica la configuración de tu estudio</p>
      </div>
      <StudyForm
        initialData={initialData}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitLabel="Guardar Cambios"
      />
    </div>
  );
};

export default StudyEdit;
