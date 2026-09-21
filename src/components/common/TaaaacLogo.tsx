import React from "react";

interface TaaaacLogoProps {
  className?: string;
  showBadge?: boolean;
  badgeText?: string;
  iconSize?: number;
  textSize?: string;
}

export function TaaaacLogo({
  className = "",
  showBadge = true,
  badgeText = "Vendoly",
  iconSize = 24,
  textSize = "text-lg",
}: TaaaacLogoProps) {
  return (
    <div className={`flex items-center gap-2 font-bold tracking-tight select-none ${className}`}>
      {/* Icona Saetta Taaaac */}
      <div
        className="rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black shrink-0 shadow-xs"
        style={{ width: iconSize + 6, height: iconSize + 6 }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ width: iconSize - 6, height: iconSize - 6 }}
        >
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor" />
        </svg>
      </div>

      {/* Testo Logo Taaaac */}
      <div className="flex items-center gap-1.5 leading-none">
        <span className={`font-black ${textSize} tracking-tight`}>
          <span className="text-white">Taaa</span>
          <span className="text-emerald-400">ac</span>
        </span>

        {/* Badge Modulo */}
        {showBadge && (
          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-800 text-emerald-200 border border-emerald-700 tracking-normal uppercase">
            {badgeText}
          </span>
        )}
      </div>
    </div>
  );
}
