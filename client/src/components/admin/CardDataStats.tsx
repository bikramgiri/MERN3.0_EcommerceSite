import React, { ReactNode } from 'react';

interface CardDataStatsProps {
  title: string;
  total: string;
  rate?: string;
  levelUp?: boolean;
  levelDown?: boolean;
  children: ReactNode;
}

const CardDataStats: React.FC<CardDataStatsProps> = ({
  title,
  total,
  children,
}) => {
  return (
    <div
      className="w-full rounded-md border border-[#1A1613]/10 bg-[#FFFDF8] p-4
                 shadow-[0_2px_14px_-6px_rgba(26,22,19,0.08)]
                 transition-shadow duration-200
                 hover:shadow-[0_4px_20px_-6px_rgba(26,22,19,0.14)]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="text-2xl font-bold text-[#1A1613] sm:text-3xl">
            {total}
          </h4>
          <span className="text-sm font-medium text-[#1A1613]/55">{title}</span>
        </div>

        <div className="flex h-11.5 w-11.5 flex-shrink-0 items-center justify-center rounded-lg bg-[#E6540B]/10 text-[#E6540B]">
          {children}
        </div>
      </div>
    </div>
  );
};

export default CardDataStats;