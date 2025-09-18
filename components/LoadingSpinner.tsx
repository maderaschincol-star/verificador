import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-secondary dark:text-gray-200 font-semibold">Verificando con IA...</p>
        <p className="text-sm text-neutral-dark dark:text-gray-400 mt-1">Esto puede tardar unos segundos.</p>
    </div>
  );
};

export default LoadingSpinner;
