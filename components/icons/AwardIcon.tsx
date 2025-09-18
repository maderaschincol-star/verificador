import React from 'react';

const AwardIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6.002 6.002 0 00-5.18 0m5.18 0a6.002 6.002 0 01-5.18 0m5.18 0l2.09 5.18-5.18-2.09-5.18 2.09 2.09-5.18" />
    </svg>
);

export default AwardIcon;
