import { useNavigate } from 'react-router';
import StudyForm from '../components/studies/StudyForm';
import { studiesApi, type CreateStudyData } from '../api/studies';
import toast from 'react-hot-toast';
import { useState } from 'react';

const StudyCreate = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ field: string; message: string }[]>([]);

  const handleSubmit = async (data: CreateStudyData) => {
    setIsSubmitting(true);
    setErrors([]);
    try {
      const res = await studiesApi.create(data);
      if (res.success) {
        toast.success('Estudio creado exitosamente');
        navigate(`/studies/${res.data._id}`);
      }
    } catch (err: any) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        setErrors([]);
        toast.error(err.response?.data?.message || 'Error al crear el estudio');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Nuevo Estudio</h1>
        <p className="text-gray-500 mt-1">Configura tu estudio de card sorting</p>
      </div>
      <StudyForm onSubmit={handleSubmit} isSubmitting={isSubmitting} submitLabel="Crear Estudio" errors={errors} setErrors={setErrors} />
    </div>
  );
};

export default StudyCreate;
