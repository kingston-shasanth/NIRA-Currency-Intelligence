import React from 'react';
import niraEmblem from '../assets/nira-emblem.png';

interface NiraLogoProps {
  variant?: 'light' | 'dark' | 'gold';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
  iconOnly?: boolean;
}

export const NiraLogo: React.FC<NiraLogoProps> = ({
  variant = 'light',
  size = 'md',
  showSubtitle = true,
  className = '',
  iconOnly = false,
}) => {
  const dimensions = {
    sm: { icon: 28, font: 'text-sm', subFont: 'text-[9px]' },
    md: { icon: 38, font: 'text-xl', subFont: 'text-[10px]' },
    lg: { icon: 54, font: 'text-2xl', subFont: 'text-xs' },
    xl: { icon: 84, font: 'text-4xl', subFont: 'text-sm' },
  }[size];

  // Official Brand Typography Colors
  const colors = {
    light: {
      text: 'text-[#0F1E28]',
      subtitle: 'text-[#64748B]',
    },
    dark: {
      text: 'text-[#F5EFEB]',
      subtitle: 'text-[#A0AAB5]',
    },
    gold: {
      text: 'text-[#F5EFEB]',
      subtitle: 'text-[#D4AF37]',
    },
  }[variant];

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Master NIRA Luxury Navy & Gold Rupee N Emblem */}
      <img
        src={niraEmblem}
        alt="NIRA Emblem"
        width={dimensions.icon}
        height={dimensions.icon}
        className="shrink-0 transition-transform hover:scale-105 duration-200 object-contain drop-shadow-xs"
        style={{ width: `${dimensions.icon}px`, height: `${dimensions.icon}px` }}
      />

      {!iconOnly && (
        <div className="flex flex-col leading-tight">
          <span
            className={`font-black tracking-[0.2em] font-['Outfit'] ${dimensions.font} ${colors.text}`}
          >
            NIRA
          </span>
          {showSubtitle && (
            <span
              className={`font-semibold tracking-wider uppercase ${dimensions.subFont} ${colors.subtitle} mt-0.5`}
            >
              Accessible Currency Intelligence
            </span>
          )}
        </div>
      )}
    </div>
  );
};
