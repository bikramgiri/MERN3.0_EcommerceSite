import React, { ReactNode } from "react";

interface CardDataStatsProps {
  title: string;
  total: string;
  subtitle?: string;
  badge?: string;
  badgeBg?: string;
  badgeColor?: string;
  rate?: string;
  levelUp?: boolean;
  levelDown?: boolean;
  children: ReactNode;
  iconBg?: string;
  iconColor?: string;
  onClick?: () => void;
}

const CardDataStats: React.FC<CardDataStatsProps> = ({
  title,
  total,
  subtitle,
  badge,
  badgeBg,
  badgeColor,
  rate,
  levelUp,
  levelDown,
  children,
  iconBg = "bg-[#E6540B]/10",
  iconColor = "text-[#E6540B]",
  onClick,
}) => {
  const resolvedBadgeBg = badgeBg || iconBg;
  const resolvedBadgeColor = badgeColor || iconColor;

  return (
    <div
      onClick={onClick}
      className={`group relative flex flex-col justify-between w-full rounded-2xl border border-[#1A1613]/8 bg-[#FFFDF8] p-4.5 sm:p-5
                 shadow-[0_2px_12px_-4px_rgba(26,22,19,0.04)]
                 transition-all duration-200
                 hover:shadow-[0_8px_24px_-6px_rgba(26,22,19,0.09)] hover:-translate-y-0.5
                 ${onClick ? "cursor-pointer" : ""}`}
    >
      <div>
        {/* Row 1: Icon on left, Status Badge on right */}
        <div className="flex items-center justify-between">
          <div
            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${iconBg} ${iconColor} 
                        transition-transform duration-200 group-hover:scale-105 shadow-xs`}
          >
            {children}
          </div>

          {badge && (
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide ${resolvedBadgeBg} ${resolvedBadgeColor} whitespace-nowrap`}
            >
              {badge}
            </span>
          )}
        </div>

        {/* Row 2: Title (Full width, no truncation) */}
        <div className="mt-3.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#1A1613]/55 block">
            {title}
          </span>
        </div>

        {/* Row 3: Total Metric */}
        <div className="mt-1">
          <h4 className="text-2xl font-extrabold tracking-tight text-[#1A1613] sm:text-[26px]">
            {total}
          </h4>
        </div>
      </div>

      {/* Row 4: Subtitle footer (Full width, clean formatting without truncation) */}
      {(subtitle || rate) && (
        <div className="mt-3 border-t border-[#1A1613]/6 pt-2.5">
          <div className="flex items-center justify-between gap-1">
            {subtitle && (
              <p className="text-xs text-[#1A1613]/60 leading-relaxed font-normal">
                {subtitle}
              </p>
            )}
            {rate && (
              <span
                className={`inline-flex items-center text-xs font-medium ${
                  levelUp ? "text-emerald-600" : levelDown ? "text-rose-600" : "text-[#1A1613]/60"
                }`}
              >
                {rate}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CardDataStats;