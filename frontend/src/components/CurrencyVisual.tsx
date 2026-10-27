import React from 'react';
import type { CurrencyType } from '../types';

export interface CurrencyVisualProps {
  denomination: string | null | undefined;
  currencyType?: CurrencyType | string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showDetails?: boolean;
  className?: string;
  altText?: string;
}

export interface DenominationSpec {
  canonicalName: string;
  type: 'banknote' | 'coin' | 'uncertain';
  value: number;
  baseColorName: string;
  dimensionsMm: string;
  reverseMotif: string;
  statusLabel: string;
  isWithdrawn?: boolean;
}

export const DENOMINATION_SPECS: Record<string, DenominationSpec> = {
  '₹10': {
    canonicalName: '₹10',
    type: 'banknote',
    value: 10,
    baseColorName: 'Chocolate Brown',
    dimensionsMm: '63 × 123 mm',
    reverseMotif: 'Sun Temple, Konark',
    statusLabel: 'Active Legal Tender',
  },
  '₹20': {
    canonicalName: '₹20',
    type: 'banknote',
    value: 20,
    baseColorName: 'Greenish Yellow',
    dimensionsMm: '63 × 129 mm',
    reverseMotif: 'Ellora Caves',
    statusLabel: 'Active Legal Tender',
  },
  '₹50': {
    canonicalName: '₹50',
    type: 'banknote',
    value: 50,
    baseColorName: 'Fluorescent Blue',
    dimensionsMm: '66 × 135 mm',
    reverseMotif: 'Hampi with Chariot',
    statusLabel: 'Active Legal Tender',
  },
  '₹100': {
    canonicalName: '₹100',
    type: 'banknote',
    value: 100,
    baseColorName: 'Lavender',
    dimensionsMm: '66 × 142 mm',
    reverseMotif: 'Rani Ki Vav',
    statusLabel: 'Active Legal Tender',
  },
  '₹200': {
    canonicalName: '₹200',
    type: 'banknote',
    value: 200,
    baseColorName: 'Bright Yellow',
    dimensionsMm: '66 × 146 mm',
    reverseMotif: 'Sanchi Stupa',
    statusLabel: 'Active Legal Tender',
  },
  '₹500': {
    canonicalName: '₹500',
    type: 'banknote',
    value: 500,
    baseColorName: 'Stone Grey',
    dimensionsMm: '66 × 150 mm',
    reverseMotif: 'Red Fort, Delhi',
    statusLabel: 'Active Legal Tender',
  },
  '₹2000': {
    canonicalName: '₹2000',
    type: 'banknote',
    value: 2000,
    baseColorName: 'Magenta',
    dimensionsMm: '66 × 166 mm',
    reverseMotif: 'Mangalyaan (Mars Orbiter)',
    statusLabel: 'Withdrawn Legal Tender',
    isWithdrawn: true,
  },
  '₹1 Coin': {
    canonicalName: '₹1 Coin',
    type: 'coin',
    value: 1,
    baseColorName: 'Stainless Steel',
    dimensionsMm: '20 mm diameter',
    reverseMotif: 'Thumbs Up / Unity',
    statusLabel: 'Active Legal Tender',
  },
  '₹2 Coin': {
    canonicalName: '₹2 Coin',
    type: 'coin',
    value: 2,
    baseColorName: 'Stainless Steel',
    dimensionsMm: '25 mm diameter',
    reverseMotif: 'Two Fingers / Victory',
    statusLabel: 'Active Legal Tender',
  },
  '₹5 Coin': {
    canonicalName: '₹5 Coin',
    type: 'coin',
    value: 5,
    baseColorName: 'Nickel-Brass Gold',
    dimensionsMm: '23 mm diameter',
    reverseMotif: 'Ashoka Lion Capital',
    statusLabel: 'Active Legal Tender',
  },
  '₹10 Coin': {
    canonicalName: '₹10 Coin',
    type: 'coin',
    value: 10,
    baseColorName: 'Bimetallic (Gold Ring, Silver Core)',
    dimensionsMm: '27 mm diameter',
    reverseMotif: '10 Radiating Rays',
    statusLabel: 'Active Legal Tender',
  },
  '₹20 Coin': {
    canonicalName: '₹20 Coin',
    type: 'coin',
    value: 20,
    baseColorName: 'Bimetallic 12-sided Dodecagon',
    dimensionsMm: '27 mm diameter',
    reverseMotif: 'Grains / Agriculture Motif',
    statusLabel: 'Active Legal Tender',
  },
  '25 Paisa Coin': {
    canonicalName: '25 Paisa Coin',
    type: 'coin',
    value: 0.25,
    baseColorName: 'Cupro-Nickel',
    dimensionsMm: '19 mm diameter',
    reverseMotif: 'Indian Rhinoceros',
    statusLabel: 'Demonetized (30 June 2011)',
    isWithdrawn: true,
  },
  '50 Paisa Coin': {
    canonicalName: '50 Paisa Coin',
    type: 'coin',
    value: 0.5,
    baseColorName: 'Stainless Steel',
    dimensionsMm: '22 mm diameter',
    reverseMotif: 'Map of India & Parliament',
    statusLabel: 'Limited Legal Tender (up to ₹10)',
    isWithdrawn: true,
  },
};

export const normalizeDenominationKey = (denom: string | null | undefined): string => {
  if (!denom) return 'uncertain';
  const clean = denom.trim();
  const lower = clean.toLowerCase();

  if (
    lower.includes('uncertain') ||
    lower.includes('non-currency') ||
    lower.includes('unknown') ||
    lower.includes('rejected') ||
    clean === '-'
  ) {
    return 'uncertain';
  }

  // Exact match
  if (DENOMINATION_SPECS[clean]) return clean;

  // Approximate matches
  if (clean.includes('2000')) return '₹2000';
  if (clean.includes('500')) return '₹500';
  if (clean.includes('200')) return '₹200';
  if (clean.includes('100')) return '₹100';
  if (clean.includes('50') && !clean.includes('Paisa')) return '₹50';
  if (clean.includes('20') && clean.includes('Coin')) return '₹20 Coin';
  if (clean.includes('20') && !clean.includes('Coin')) return '₹20';
  if (clean.includes('10') && clean.includes('Coin')) return '₹10 Coin';
  if (clean.includes('10') && !clean.includes('Coin')) return '₹10';
  if (clean.includes('5') && clean.includes('Coin')) return '₹5 Coin';
  if (clean.includes('2') && clean.includes('Coin')) return '₹2 Coin';
  if (clean.includes('1') && clean.includes('Coin')) return '₹1 Coin';
  if (clean.includes('25') && clean.includes('Paisa')) return '25 Paisa Coin';
  if (clean.includes('50') && clean.includes('Paisa')) return '50 Paisa Coin';

  return 'uncertain';
};

export const CurrencyVisual: React.FC<CurrencyVisualProps> = ({
  denomination,
  size = 'md',
  showDetails = false,
  className = '',
  altText,
}) => {
  const key = normalizeDenominationKey(denomination);
  const spec = DENOMINATION_SPECS[key];
  const isUncertain = key === 'uncertain' || !spec;

  const sizeClasses = {
    xs: 'w-12 h-7 text-[9px]',
    sm: 'w-16 h-10 text-[10px]',
    md: 'w-24 h-14 text-xs',
    lg: 'w-36 h-20 text-sm',
    xl: 'w-56 h-32 text-base',
  }[size];

  const coinSizeClasses = {
    xs: 'w-7 h-7 text-[8px]',
    sm: 'w-10 h-10 text-[10px]',
    md: 'w-14 h-14 text-xs',
    lg: 'w-20 h-20 text-sm',
    xl: 'w-32 h-32 text-lg',
  }[size];

  const defaultAlt = isUncertain
    ? 'Uncertain or Non-Currency Input'
    : `${spec.canonicalName} (${spec.baseColorName}) ${spec.type} illustration with ${spec.reverseMotif}`;

  // 1. UNCERTAIN / NON-CURRENCY VISUAL
  if (isUncertain) {
    return (
      <div
        role="img"
        aria-label={altText || defaultAlt}
        className={`relative inline-flex items-center justify-center rounded-xl bg-[#1C2127] border border-red-500/40 text-red-400 select-none overflow-hidden shrink-0 ${sizeClasses} ${className}`}
      >
        <svg
          viewBox="0 0 160 90"
          className="w-full h-full p-2"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Subtle warning cross reticle */}
          <rect x="4" y="4" width="152" height="82" rx="8" stroke="#EF4444" strokeWidth="2" strokeDasharray="4 4" opacity="0.6" />
          <circle cx="80" cy="45" r="24" fill="#7F1D1D" fillOpacity="0.4" stroke="#EF4444" strokeWidth="2.5" />
          <path d="M72 37 L88 53 M88 37 L72 53" stroke="#FCA5A5" strokeWidth="3" strokeLinecap="round" />
          <text x="80" y="78" textAnchor="middle" fill="#FCA5A5" fontSize="10" fontWeight="bold" fontFamily="sans-serif">
            NON-CURRENCY
          </text>
        </svg>
      </div>
    );
  }

  // 2. COIN VISUALS
  if (spec.type === 'coin') {
    return (
      <div className={`inline-flex flex-col items-center gap-1.5 select-none ${className}`}>
        <div
          role="img"
          aria-label={altText || defaultAlt}
          className={`relative inline-flex items-center justify-center rounded-full shadow-md select-none shrink-0 ${coinSizeClasses}`}
        >
          {/* ₹10 Bimetallic Coin */}
          {key === '₹10 Coin' && (
            <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient id="goldRing" cx="50%" cy="50%" r="50%">
                  <stop offset="65%" stopColor="#C5A059" />
                  <stop offset="85%" stopColor="#E5C158" />
                  <stop offset="100%" stopColor="#9A7B38" />
                </radialGradient>
                <radialGradient id="silverCore" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="70%" stopColor="#CFD8DC" />
                  <stop offset="100%" stopColor="#90A4AE" />
                </radialGradient>
              </defs>
              <circle cx="50" cy="50" r="48" fill="url(#goldRing)" stroke="#8D6E63" strokeWidth="1.5" />
              <circle cx="50" cy="50" r="45" stroke="#FFFFFF" strokeWidth="0.8" strokeDasharray="2 2" opacity="0.5" />
              <circle cx="50" cy="50" r="30" fill="url(#silverCore)" stroke="#B0BEC5" strokeWidth="1" />
              <g stroke="#C5A059" strokeWidth="1.2" opacity="0.8">
                {[...Array(10)].map((_, i) => (
                  <line
                    key={i}
                    x1="50"
                    y1="23"
                    x2="50"
                    y2="20"
                    transform={`rotate(${i * 36} 50 50)`}
                  />
                ))}
              </g>
              <text x="50" y="55" textAnchor="middle" fill="#37474F" fontSize="18" fontWeight="900" fontFamily="sans-serif">
                10
              </text>
              <text x="50" y="40" textAnchor="middle" fill="#546E7A" fontSize="10" fontWeight="bold" fontFamily="sans-serif">
                ₹
              </text>
              <text x="50" y="88" textAnchor="middle" fill="#3E2723" fontSize="6.5" fontWeight="bold" fontFamily="sans-serif">
                RUPEES
              </text>
            </svg>
          )}

          {/* ₹20 12-Sided Dodecagon Bimetallic Coin */}
          {key === '₹20 Coin' && (
            <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient id="brassOuter" cx="50%" cy="50%" r="50%">
                  <stop offset="60%" stopColor="#B388FF" stopOpacity="0" />
                  <stop offset="65%" stopColor="#D4AF37" />
                  <stop offset="100%" stopColor="#A67C1E" />
                </radialGradient>
                <radialGradient id="nickelCenter" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="80%" stopColor="#ECEFF1" />
                  <stop offset="100%" stopColor="#B0BEC5" />
                </radialGradient>
              </defs>
              <polygon
                points="50,2 74,8 92,26 98,50 92,74 74,92 50,98 26,92 8,74 2,50 8,26 26,8"
                fill="#C5A059"
                stroke="#8D6E63"
                strokeWidth="2"
              />
              <polygon
                points="50,6 71,11 87,27 92,50 87,71 71,87 50,92 29,87 13,71 8,50 13,27 29,11"
                fill="#D4AF37"
              />
              <circle cx="50" cy="50" r="28" fill="url(#nickelCenter)" stroke="#78909C" strokeWidth="1" />
              <text x="50" y="55" textAnchor="middle" fill="#263238" fontSize="18" fontWeight="900" fontFamily="sans-serif">
                20
              </text>
              <text x="50" y="40" textAnchor="middle" fill="#455A64" fontSize="10" fontWeight="bold" fontFamily="sans-serif">
                ₹
              </text>
              <text x="50" y="86" textAnchor="middle" fill="#3E2723" fontSize="6.5" fontWeight="bold" fontFamily="sans-serif">
                RUPEES
              </text>
            </svg>
          )}

          {/* ₹5 Coin (Nickel-Brass Golden) */}
          {key === '₹5 Coin' && (
            <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient id="brassSolid" cx="45%" cy="40%" r="60%">
                  <stop offset="0%" stopColor="#FFF9C4" />
                  <stop offset="60%" stopColor="#D4AF37" />
                  <stop offset="100%" stopColor="#8D6E63" />
                </radialGradient>
              </defs>
              <circle cx="50" cy="50" r="48" fill="url(#brassSolid)" stroke="#6D4C41" strokeWidth="1.5" />
              <circle cx="50" cy="50" r="43" stroke="#FFF8E1" strokeWidth="0.8" strokeDasharray="3 2" opacity="0.6" />
              <text x="50" y="57" textAnchor="middle" fill="#3E2723" fontSize="26" fontWeight="900" fontFamily="sans-serif">
                5
              </text>
              <text x="50" y="36" textAnchor="middle" fill="#4E342E" fontSize="12" fontWeight="bold" fontFamily="sans-serif">
                ₹
              </text>
              <text x="50" y="78" textAnchor="middle" fill="#3E2723" fontSize="7.5" fontWeight="bold" fontFamily="sans-serif">
                RUPEES
              </text>
            </svg>
          )}

          {/* ₹1 / ₹2 / 25P / 50P (Stainless Steel Metallic Silver Coins) */}
          {(key === '₹1 Coin' || key === '₹2 Coin' || key === '25 Paisa Coin' || key === '50 Paisa Coin') && (
            <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient id="steelGrad" cx="45%" cy="40%" r="60%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="60%" stopColor="#CFD8DC" />
                  <stop offset="100%" stopColor="#78909C" />
                </radialGradient>
              </defs>
              <circle cx="50" cy="50" r="48" fill="url(#steelGrad)" stroke="#546E7A" strokeWidth="1.5" />
              <circle cx="50" cy="50" r="44" stroke="#ECEFF1" strokeWidth="0.8" strokeDasharray="2.5 1.5" opacity="0.7" />
              {key === '₹1 Coin' && (
                <>
                  <text x="50" y="58" textAnchor="middle" fill="#263238" fontSize="28" fontWeight="900" fontFamily="sans-serif">
                    1
                  </text>
                  <text x="50" y="36" textAnchor="middle" fill="#37474F" fontSize="12" fontWeight="bold" fontFamily="sans-serif">
                    ₹
                  </text>
                  <text x="50" y="78" textAnchor="middle" fill="#37474F" fontSize="7" fontWeight="bold" fontFamily="sans-serif">
                    RUPEE
                  </text>
                </>
              )}
              {key === '₹2 Coin' && (
                <>
                  <text x="50" y="58" textAnchor="middle" fill="#263238" fontSize="28" fontWeight="900" fontFamily="sans-serif">
                    2
                  </text>
                  <text x="50" y="36" textAnchor="middle" fill="#37474F" fontSize="12" fontWeight="bold" fontFamily="sans-serif">
                    ₹
                  </text>
                  <text x="50" y="78" textAnchor="middle" fill="#37474F" fontSize="7" fontWeight="bold" fontFamily="sans-serif">
                    RUPEES
                  </text>
                </>
              )}
              {key === '25 Paisa Coin' && (
                <>
                  <text x="50" y="54" textAnchor="middle" fill="#263238" fontSize="22" fontWeight="900" fontFamily="sans-serif">
                    25
                  </text>
                  <text x="50" y="70" textAnchor="middle" fill="#455A64" fontSize="7.5" fontWeight="bold" fontFamily="sans-serif">
                    PAISA
                  </text>
                </>
              )}
              {key === '50 Paisa Coin' && (
                <>
                  <text x="50" y="54" textAnchor="middle" fill="#263238" fontSize="22" fontWeight="900" fontFamily="sans-serif">
                    50
                  </text>
                  <text x="50" y="70" textAnchor="middle" fill="#455A64" fontSize="7.5" fontWeight="bold" fontFamily="sans-serif">
                    PAISA
                  </text>
                </>
              )}
            </svg>
          )}

          {spec.isWithdrawn && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[8px] font-black uppercase tracking-tight bg-amber-500 text-black border border-amber-300 shadow-xs">
              Legacy
            </span>
          )}
        </div>
        {showDetails && (
          <div className="text-center leading-tight">
            <span className="font-bold text-xs text-[#0F1E28] block">{spec.canonicalName}</span>
            <span className="text-[10px] text-[#64748B] block">{spec.dimensionsMm}</span>
          </div>
        )}
      </div>
    );
  }

  // 3. BANKNOTE VISUALS
  const notePalettes: Record<
    string,
    { gradStart: string; gradEnd: string; border: string; accentText: string; highlight: string }
  > = {
    '₹10': {
      gradStart: '#6D4C41',
      gradEnd: '#4E342E',
      border: '#8D6E63',
      accentText: '#D7CCC8',
      highlight: '#BCAAA4',
    },
    '₹20': {
      gradStart: '#9E9D24',
      gradEnd: '#827717',
      border: '#AFB42B',
      accentText: '#F0F4C3',
      highlight: '#E6EE9C',
    },
    '₹50': {
      gradStart: '#00ACC1',
      gradEnd: '#00838F',
      border: '#26C6DA',
      accentText: '#E0F7FA',
      highlight: '#80DEEA',
    },
    '₹100': {
      gradStart: '#7E57C2',
      gradEnd: '#5E35B1',
      border: '#9575CD',
      accentText: '#EDE7F6',
      highlight: '#D1C4E9',
    },
    '₹200': {
      gradStart: '#FFA000',
      gradEnd: '#FF8F00',
      border: '#FFB300',
      accentText: '#FFF8E1',
      highlight: '#FFE082',
    },
    '₹500': {
      gradStart: '#78909C',
      gradEnd: '#455A64',
      border: '#90A4AE',
      accentText: '#ECEFF1',
      highlight: '#CFD8DC',
    },
    '₹2000': {
      gradStart: '#C2185B',
      gradEnd: '#880E4F',
      border: '#D81B60',
      accentText: '#FCE4EC',
      highlight: '#F8BBD0',
    },
  };

  const palette = notePalettes[key] || notePalettes['₹500'];

  return (
    <div className={`inline-flex flex-col gap-1.5 select-none ${className}`}>
      <div
        role="img"
        aria-label={altText || defaultAlt}
        className={`relative inline-flex items-center justify-center rounded-xl shadow-md border overflow-hidden shrink-0 aspect-[1.95/1] ${sizeClasses}`}
        style={{
          background: `linear-gradient(135deg, ${palette.gradStart} 0%, ${palette.gradEnd} 100%)`,
          borderColor: palette.border,
        }}
      >
        <svg
          viewBox="0 0 195 100"
          className="w-full h-full pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Subtle Guilloche border */}
          <rect
            x="4"
            y="4"
            width="187"
            height="92"
            rx="6"
            fill="none"
            stroke={palette.highlight}
            strokeWidth="0.8"
            opacity="0.4"
          />
          <rect
            x="7"
            y="7"
            width="181"
            height="86"
            rx="5"
            fill="none"
            stroke={palette.highlight}
            strokeWidth="0.5"
            strokeDasharray="3 2"
            opacity="0.3"
          />

          {/* Left Watermark Oval Window */}
          <ellipse
            cx="32"
            cy="50"
            rx="18"
            ry="28"
            fill="#FFFFFF"
            fillOpacity="0.08"
            stroke={palette.highlight}
            strokeWidth="0.8"
            opacity="0.5"
          />
          <text
            x="32"
            y="54"
            textAnchor="middle"
            fill={palette.accentText}
            fontSize="10"
            fontWeight="bold"
            opacity="0.4"
            fontFamily="sans-serif"
          >
            RBI
          </text>

          {/* Security Thread line */}
          <line
            x1="76"
            y1="4"
            x2="76"
            y2="96"
            stroke="#D4AF37"
            strokeWidth="1.2"
            strokeDasharray="8 4"
            opacity="0.75"
          />

          {/* Central / Right Denomination Display */}
          <text
            x="126"
            y="58"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="26"
            fontWeight="900"
            fontFamily="'Outfit', sans-serif"
            style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
          >
            {spec.canonicalName}
          </text>

          {/* Header Reserve Bank of India */}
          <text
            x="126"
            y="26"
            textAnchor="middle"
            fill={palette.accentText}
            fontSize="7"
            fontWeight="bold"
            letterSpacing="0.8"
            fontFamily="sans-serif"
            opacity="0.9"
          >
            RESERVE BANK OF INDIA
          </text>

          {/* Reverse Motif Label at Bottom */}
          <text
            x="126"
            y="82"
            textAnchor="middle"
            fill={palette.highlight}
            fontSize="6"
            fontWeight="600"
            letterSpacing="0.4"
            fontFamily="sans-serif"
            opacity="0.85"
          >
            {spec.reverseMotif}
          </text>
        </svg>

        {/* Withdrawn Legal Tender Banner for ₹2000 */}
        {spec.isWithdrawn && (
          <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-amber-400 text-black font-black text-[8px] uppercase tracking-tight shadow-xs">
            Withdrawn
          </div>
        )}
      </div>

      {showDetails && (
        <div className="text-left leading-tight pl-0.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-[#0F1E28]">{spec.canonicalName}</span>
            <span className="text-[10px] text-[#64748B]">{spec.baseColorName}</span>
          </div>
          <span className="text-[10px] text-[#64748B] block truncate">{spec.reverseMotif}</span>
        </div>
      )}
    </div>
  );
};
