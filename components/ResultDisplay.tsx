import React from 'react';
import { VerificationResult } from '../types';
import CheckCircleIcon from './icons/CheckCircleIcon';
import LinkIcon from './icons/LinkIcon';
import XCircleIcon from './icons/XCircleIcon';
import ExclamationTriangleIcon from './icons/ExclamationTriangleIcon';


interface ResultDisplayProps {
  result: VerificationResult;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result }) => {
  // Simple markdown-like formatting for bold text
  const formatText = (text: string) => {
    return text.split('**').map((part, index) =>
      index % 2 === 1 ? <strong key={index}>{part}</strong> : part
    );
  };

  const getVerdictStyles = () => {
    const verdict = result.verdict.toLowerCase();
    switch (verdict) {
      case 'verdadero':
        return {
          card: 'bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-700',
          iconColor: 'text-green-500 dark:text-green-400',
          Icon: CheckCircleIcon,
          title: 'Información Verificada'
        };
      case 'falso':
        return {
          card: 'bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-700',
          iconColor: 'text-red-500 dark:text-red-400',
          Icon: XCircleIcon,
          title: 'Información Falsa'
        };
      case 'engañoso':
      case 'mixto':
        return {
          card: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-700',
          iconColor: 'text-yellow-500 dark:text-yellow-400',
          Icon: ExclamationTriangleIcon,
          title: 'Posible Desinformación'
        };
      default: // Sin Evidencia, Sin Veredicto, Error
        return {
          card: 'bg-gray-100 border-gray-200 dark:bg-gray-700 dark:border-gray-600',
          iconColor: 'text-gray-500 dark:text-gray-400',
          Icon: CheckCircleIcon,
          title: 'Análisis de IA'
        };
    }
  };

  const { card, iconColor, Icon, title } = getVerdictStyles();
  
  return (
    <div className={`w-full animate-fade-in rounded-xl shadow-lg border p-6 space-y-6 ${card}`}>
      <div>
        <div className="flex items-center gap-3 mb-3">
          <Icon className={`w-7 h-7 ${iconColor}`} />
          <h2 className="text-xl font-bold text-secondary dark:text-gray-100">{title}</h2>
        </div>
         <p className="italic text-neutral-dark dark:text-gray-400 mb-4 text-sm">
          Hicimos el trabajo duro por ti: esto es lo que encontramos.
        </p>
        <div className="text-neutral-dark dark:text-gray-300 prose prose-sm max-w-none whitespace-pre-wrap">
          {formatText(result.analysis)}
        </div>
      </div>
      
      {result.sources && result.sources.length > 0 && (
        <div>
           <div className="border-t border-gray-200 dark:border-gray-600 my-4"></div>
          <div className="flex items-center gap-3 mb-3">
            <LinkIcon className="w-6 h-6 text-primary" />
            <h3 className="text-lg font-bold text-secondary dark:text-gray-200">Fuentes Consultadas</h3>
          </div>
          <ul className="space-y-2 list-none p-0">
            {result.sources.map((source, index) => (
              <li key={index} className="flex items-start">
                <a
                  href={source.web.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline transition-colors duration-200 text-sm"
                >
                  {source.web.title || source.web.uri}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ResultDisplay;
