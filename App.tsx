import React, { useState, useCallback, useRef, useEffect } from 'react';
import { VerificationResult, ImageFile, Badge } from './types';
import { verifyFact } from './services/geminiService';
import LoadingSpinner from './components/LoadingSpinner';
import ResultDisplay from './components/ResultDisplay';
import TrashIcon from './components/icons/TrashIcon';
import SearchIcon from './components/icons/SearchIcon';
import ShieldCheckIcon from './components/icons/ShieldCheckIcon';
import CloudUploadIcon from './components/icons/CloudUploadIcon';
import SunIcon from './components/icons/SunIcon';
import MoonIcon from './components/icons/MoonIcon';
import AwardIcon from './components/icons/AwardIcon';
import AchievementToast from './components/AchievementToast';


const App: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [image, setImage] = useState<ImageFile | null>(null);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [verificationCount, setVerificationCount] = useState<number>(() => {
    const savedCount = localStorage.getItem('verificationCount');
    return savedCount ? parseInt(savedCount, 10) : 0;
  });
  const [newlyEarnedBadge, setNewlyEarnedBadge] = useState<Badge | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const BADGE_LEVELS: Badge[] = [
    { name: 'Verificador Novato', threshold: 1, color: 'text-amber-600', bgColor: 'bg-amber-100' },
    { name: 'Detective de Hechos', threshold: 5, color: 'text-slate-600', bgColor: 'bg-slate-200' },
    { name: 'Buscador de la Verdad', threshold: 10, color: 'text-sky-600', bgColor: 'bg-sky-100' },
    { name: 'Cazador de Mitos', threshold: 25, color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
    { name: 'Guardián de la Verdad', threshold: 50, color: 'text-yellow-500', bgColor: 'bg-yellow-100' },
  ];

  const getBadgeInfo = (count: number) => {
    const currentBadge = [...BADGE_LEVELS].reverse().find(badge => count >= badge.threshold);
    const nextBadge = BADGE_LEVELS.find(badge => count < badge.threshold);

    if (!currentBadge) {
      const progress = nextBadge ? (count / nextBadge.threshold) * 100 : 0;
      return { currentBadge: null, nextBadge, progress };
    }

    if (!nextBadge) {
      return { currentBadge, nextBadge: null, progress: 100 };
    }

    const currentBadgeLevelIndex = BADGE_LEVELS.findIndex(b => b.name === currentBadge.name);
    const prevThreshold = currentBadgeLevelIndex > 0 ? BADGE_LEVELS[currentBadgeLevelIndex - 1].threshold : 0;

    const progress = ((count - prevThreshold) / (nextBadge.threshold - prevThreshold)) * 100;

    return { currentBadge, nextBadge, progress };
  };


  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const processFile = (file: File) => {
      if (file.size > 4 * 1024 * 1024) { // Limit file size to 4MB
          setError("El tamaño de la imagen no debe exceder 4MB.");
          return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage({
            file: file,
            dataUrl: reader.result as string,
            mimeType: file.type
        });
        setError(null);
      };
      reader.onerror = () => {
        setError("Error al leer la imagen.");
      };
      reader.readAsDataURL(file);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
        processFile(file);
    } else {
        setError("Por favor, suelta un archivo de imagen válido.");
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleUploadAreaClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    setImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleVerify = useCallback(async () => {
    if (!prompt && !image) {
      setError('Por favor, ingresa un texto o sube una imagen para verificar.');
      return;
    }
    setError(null);
    setIsLoading(true);
    setResult(null);

    const base64Data = image ? image.dataUrl.split(',')[1] : null;
    const mimeType = image ? image.mimeType : null;

    const apiResult = await verifyFact(prompt, base64Data, mimeType);
    
    if (apiResult.verdict.toLowerCase() !== 'error') {
      const oldCount = verificationCount;
      const newCount = oldCount + 1;
      setVerificationCount(newCount);
      localStorage.setItem('verificationCount', newCount.toString());

      const oldBadge = getBadgeInfo(oldCount).currentBadge;
      const newBadge = getBadgeInfo(newCount).currentBadge;

      if (newBadge && newBadge.name !== oldBadge?.name) {
        setNewlyEarnedBadge(newBadge);
        setTimeout(() => {
          setNewlyEarnedBadge(null);
        }, 5000); 
      }
    }
    
    setResult(apiResult);
    setIsLoading(false);
  }, [prompt, image, verificationCount]);

  const handleClear = () => {
    setPrompt('');
    setImage(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const isButtonDisabled = isLoading || (!prompt.trim() && !image);

  return (
    <div className="min-h-screen bg-neutral-light dark:bg-gray-900 flex flex-col items-center p-4 transition-colors duration-300">
      {newlyEarnedBadge && <AchievementToast badge={newlyEarnedBadge} />}
      <div className="w-full max-w-2xl mx-auto">
        <header className="flex justify-between items-start my-10">
            <div className="text-center sm:text-left">
                <div className="inline-flex items-center gap-3">
                    <ShieldCheckIcon className="w-10 h-10 text-primary" />
                    <h1 className="text-4xl md:text-5xl font-extrabold text-secondary dark:text-gray-100">Verificador de Hechos <span className="text-primary">IA</span></h1>
                </div>
                <p className="mt-3 text-neutral-dark dark:text-gray-400 text-lg font-light">Analiza textos e imágenes con la potencia de Gemini.</p>
            </div>
            <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-neutral-dark dark:text-gray-300 hover:bg-neutral dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                aria-label="Toggle theme"
            >
                {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
            </button>
        </header>

        <main className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg space-y-5">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Escribe tu frase y descubre la verdad..."
            className="w-full p-4 border border-neutral dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent transition resize-none h-28 bg-transparent dark:text-gray-200"
            disabled={isLoading}
          />

          <div className="mt-2">
            {image ? (
                <div className="flex items-center justify-between gap-2 animate-fade-in p-3 border border-neutral dark:border-gray-600 rounded-lg bg-neutral-light/50 dark:bg-gray-700/50">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <img src={image.dataUrl} alt="Vista previa" className="h-16 w-16 object-cover rounded-lg shadow-md flex-shrink-0" />
                      <div className="overflow-hidden">
                          <p className="font-semibold text-secondary dark:text-gray-200 truncate">{image.file.name}</p>
                          <p className="text-sm text-neutral-dark dark:text-gray-400">{`${(image.file.size / 1024).toFixed(1)} KB`}</p>
                      </div>
                    </div>
                    <button
                        onClick={handleRemoveImage}
                        className="p-2 rounded-full text-neutral-dark dark:text-gray-300 hover:bg-neutral-dark/10 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-50 flex-shrink-0"
                        title="Eliminar imagen"
                        aria-label="Eliminar imagen"
                        disabled={isLoading}
                    >
                        <TrashIcon className="w-5 h-5" />
                    </button>
                </div>
            ) : (
                <div
                    onClick={handleUploadAreaClick}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDragging ? 'border-primary bg-blue-50 dark:bg-blue-900/50' : 'border-neutral dark:border-gray-500 hover:border-primary/50 hover:bg-neutral-light/50 dark:hover:bg-gray-700/50'}`}
                    role="button"
                    aria-label="Zona para subir imagen"
                >
                    <CloudUploadIcon className="w-10 h-10 text-neutral-dark dark:text-gray-400 mb-3" />
                    <p className="text-secondary dark:text-gray-300 font-semibold text-center">
                        Arrastra tu imagen aquí o <span className="text-primary">haz clic para subirla</span>
                    </p>
                    <p className="text-sm text-neutral-dark dark:text-gray-500 mt-1">PNG, JPG, GIF hasta 4MB</p>
                </div>
            )}
            <input
                id="file-upload"
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
                disabled={isLoading}
            />
          </div>
          
          {error && <p className="text-red-500 text-sm mt-2 animate-fade-in">{error}</p>}

          <div className="flex flex-col sm:flex-row gap-3 pt-3">
            <button
              onClick={handleVerify}
              disabled={isButtonDisabled}
              className="w-full sm:w-2/3 flex items-center justify-center gap-2 text-white font-bold py-3 px-6 rounded-lg transition transform hover:scale-105 shadow-md disabled:shadow-none disabled:bg-neutral-dark dark:disabled:bg-gray-600 disabled:cursor-not-allowed bg-accent hover:bg-emerald-600"
            >
              <SearchIcon className="w-5 h-5" />
              {isLoading ? 'Verificando...' : 'Verificar Ahora'}
            </button>
            <button
              onClick={handleClear}
              disabled={isLoading}
              className="w-full sm:w-1/3 text-secondary dark:text-gray-200 font-bold py-3 px-6 rounded-lg transition bg-neutral dark:bg-gray-600 hover:bg-neutral-dark/30 dark:hover:bg-gray-500 disabled:opacity-50"
            >
              Limpiar
            </button>
          </div>
        </main>
        
        <section className="mt-8">
          {isLoading && <LoadingSpinner />}
          {result && <ResultDisplay result={result} />}
        </section>

        <footer className="w-full my-8 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
            <h3 className="text-xl font-bold text-secondary dark:text-gray-200 mb-4">Tu Progreso de Verificador</h3>
            {(() => {
                const { currentBadge, nextBadge, progress } = getBadgeInfo(verificationCount);
                if (!currentBadge) {
                    return (
                        <div className="text-center text-neutral-dark dark:text-gray-400">
                            <p>¡Realiza tu primera verificación para ganar una insignia!</p>
                        </div>
                    );
                }
                return (
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className={`flex-shrink-0 p-4 rounded-full ${currentBadge.bgColor}`}>
                            <AwardIcon className={`w-12 h-12 ${currentBadge.color}`} />
                        </div>
                        <div className="w-full">
                            <div className="flex justify-between items-baseline mb-1">
                                <p className="font-bold text-lg text-secondary dark:text-gray-200">{currentBadge.name}</p>
                                {nextBadge && (
                                    <p className="text-sm text-neutral-dark dark:text-gray-400">
                                        Siguiente: {nextBadge.name}
                                    </p>
                                )}
                            </div>
                            <div className="w-full bg-neutral dark:bg-gray-600 rounded-full h-4 overflow-hidden">
                                <div
                                    className={`transition-all duration-500 h-4 rounded-full ${!nextBadge ? 'bg-yellow-400' : 'bg-accent'}`}
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between items-baseline mt-1">
                                <p className="text-sm font-semibold text-secondary dark:text-gray-300">
                                  {verificationCount} Verificaciones
                                </p>
                                {nextBadge ? (
                                    <p className="text-sm text-neutral-dark dark:text-gray-400">
                                        {nextBadge.threshold} para la siguiente
                                    </p>
                                ) : (
                                  <p className="text-sm font-bold text-yellow-500">
                                      ¡Nivel Máximo!
                                  </p>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}
        </footer>
      </div>
    </div>
  );
};

export default App;
