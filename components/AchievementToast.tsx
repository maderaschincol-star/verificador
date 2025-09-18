import React, { useEffect, useState } from 'react';
import { Badge } from '../types';
import AwardIcon from './icons/AwardIcon';

interface AchievementToastProps {
  badge: Badge;
}

const AchievementToast: React.FC<AchievementToastProps> = ({ badge }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100); // Delay to ensure transition is applied
    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
        className={`fixed bottom-5 right-5 md:bottom-10 md:right-10 flex items-center gap-4 w-auto max-w-sm p-4 rounded-xl shadow-2xl transition-all duration-500 transform z-50 border ${badge.bgColor} ${visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
        role="alert"
    >
        <AwardIcon className={`w-12 h-12 flex-shrink-0 ${badge.color}`} />
        <div>
            <p className="font-bold text-lg text-secondary">¡Insignia Desbloqueada!</p>
            <p className="text-md text-neutral-dark">{badge.name}</p>
        </div>
    </div>
  );
};

export default AchievementToast;
