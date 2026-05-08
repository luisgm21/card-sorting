import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Spinner from '../components/ui/Spinner';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ field: string; message: string }[]>([]);
  const { login } = useAuth();
  const navigate = useNavigate();

  const getErrorMessage = (field: string) => {
    const error = errors.find((err) => err.field === field);
    return error ? error.message : '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setIsLoading(true);
    try {
      await login({ email, password });
      toast.success('Inicio de sesión exitoso');
      navigate('/dashboard');
    } catch (err: any) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        setErrors([]);
        toast.error(err.response?.data?.message || err.message || 'Error al iniciar sesión');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Card Sorting</h1>
          <p className="mt-2 text-gray-600">Inicia sesión para continuar</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors(errors.filter(err => err.field !== 'email')); }}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${getErrorMessage('email') ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="tu@correo.com"
              />
              {getErrorMessage('email') && (
                <p className="text-red-500 text-sm mt-1">{getErrorMessage('email')}</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors(errors.filter(err => err.field !== 'password')); }}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${getErrorMessage('password') ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="••••••••"
              />
              {getErrorMessage('password') && (
                <p className="text-red-500 text-sm mt-1">{getErrorMessage('password')}</p>
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
              {isLoading ? <Spinner size="sm" /> : 'Iniciar sesión'}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-gray-600">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
