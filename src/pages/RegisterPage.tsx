import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Spinner from '../components/ui/Spinner';

const RegisterPage = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'researcher' as 'researcher' | 'participant',
    organization: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ field: string; message: string }[]>([]);
  const { register } = useAuth();
  const navigate = useNavigate();

  const getErrorMessage = (field: string) => {
    const error = errors.find((err) => err.field === field);
    return error ? error.message : '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => prev.filter((error) => error.field !== e.target.name));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setIsLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        organization: form.organization || undefined,
      });
      toast.success('Registro exitoso');
      navigate('/dashboard');
    } catch (err: any) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        setErrors([]);
        toast.error(err.response?.data?.message || err.message || 'Error al registrarse');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Crear cuenta</h1>
          <p className="mt-2 text-gray-600">Regístrate para comenzar</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre completo <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${getErrorMessage('name') ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Tu nombre"
              />
              {getErrorMessage('name') && (
                <p className="text-red-500 text-sm mt-1">{getErrorMessage('name')}</p>
              )}
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Correo electrónico <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${getErrorMessage('email') ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="tu@correo.com"
              />
              {getErrorMessage('email') && (
                <p className="text-red-500 text-sm mt-1">{getErrorMessage('email')}</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${getErrorMessage('password') ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Mínimo 6 caracteres"
              />
              {getErrorMessage('password') && (
                <p className="text-red-500 text-sm mt-1">{getErrorMessage('password')}</p>
              )}
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar contraseña <span className="text-red-500">*</span>
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${getErrorMessage('confirmPassword') ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Repite la contraseña"
              />
              {getErrorMessage('confirmPassword') && (
                <p className="text-red-500 text-sm mt-1">{getErrorMessage('confirmPassword')}</p>
              )}
            </div>
            {errors.length > 0 && errors.every(e => !e.field) && (
              <div className="text-red-500 text-sm mb-2">{errors[0].message}</div>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? <Spinner size="sm" /> : 'Registrarse'}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-gray-600">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
