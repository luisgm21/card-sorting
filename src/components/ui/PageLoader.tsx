import Spinner from './Spinner';

const PageLoader = () => {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <Spinner size="lg" />
        <p className="mt-4 text-gray-500 text-sm">Cargando...</p>
      </div>
    </div>
  );
};

export default PageLoader;
