import { cn } from "@/lib/utils";

const LEAF = "M60 4C78 22 88 40 88 55c0 17-12 29-28 37-16-8-28-20-28-37 0-15 10-33 28-51Z";

/**
 * Marca do Grupo Mandotti (folha + curvas de plantio + semente) com acabamento
 * volumétrico: gradientes, especular no topo-esquerda e sombra interna na base.
 * O viewBox e as proporções seguem o ícone oficial em /favicon-512.png.
 */
export function MandottiMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={cn("size-full", className)} aria-hidden="true">
      <defs>
        <linearGradient id="mm-leaf" x1="18%" y1="4%" x2="86%" y2="96%">
          <stop offset="0%" stopColor="#a8d45a" />
          <stop offset="34%" stopColor="#5fa03c" />
          <stop offset="72%" stopColor="#2e6636" />
          <stop offset="100%" stopColor="#16301a" />
        </linearGradient>

        <linearGradient id="mm-arc" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#16301a" />
          <stop offset="55%" stopColor="#285830" />
          <stop offset="100%" stopColor="#3f7d49" />
        </linearGradient>

        <radialGradient id="mm-seed" cx="34%" cy="26%" r="82%">
          <stop offset="0%" stopColor="#f7dc95" />
          <stop offset="42%" stopColor="#d9a325" />
          <stop offset="100%" stopColor="#8f6207" />
        </radialGradient>

        <linearGradient id="mm-sheen" x1="0%" y1="0%" x2="70%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>

        <clipPath id="mm-leaf-clip">
          <path d={LEAF} />
        </clipPath>

        {/* Recorte reto na base, como no ícone oficial */}
        <clipPath id="mm-ground-clip">
          <rect x="0" y="0" width="120" height="110" />
        </clipPath>

        <filter id="mm-soft" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>

      {/* Curvas de plantio */}
      <g clipPath="url(#mm-ground-clip)" fill="none" stroke="url(#mm-arc)" strokeLinecap="round">
        <g>
          <path d="M8 112C8 93 22 79 46 72" strokeWidth="12" />
          <path d="M31 112c1-14 11-25 24-30" strokeWidth="10.5" opacity="0.92" />
        </g>
        <g transform="translate(120 0) scale(-1 1)">
          <path d="M8 112C8 93 22 79 46 72" strokeWidth="12" />
          <path d="M31 112c1-14 11-25 24-30" strokeWidth="10.5" opacity="0.92" />
        </g>
      </g>

      {/* Folha */}
      <path d={LEAF} fill="url(#mm-leaf)" />
      <g clipPath="url(#mm-leaf-clip)">
        <ellipse cx="40" cy="26" rx="26" ry="34" fill="url(#mm-sheen)" filter="url(#mm-soft)" />
        <ellipse
          cx="86"
          cy="86"
          rx="30"
          ry="26"
          fill="#0d2412"
          opacity="0.45"
          filter="url(#mm-soft)"
        />
      </g>

      {/* Nervuras */}
      <g
        stroke="#f2f8ef"
        strokeLinecap="round"
        fill="none"
        opacity="0.92"
        style={{ mixBlendMode: "screen" }}
      >
        <path d="M60 17V88" strokeWidth="3" />
        <path d="M60 38 45 27M60 38l15-11" strokeWidth="2.6" />
        <path d="M60 53 47 44M60 53l13-9" strokeWidth="2.6" />
        <path d="M60 68 49 61M60 68l11-7" strokeWidth="2.4" />
      </g>

      {/* Semente */}
      <ellipse cx="60" cy="95" rx="9.5" ry="13.5" fill="url(#mm-seed)" />
      <ellipse cx="56.5" cy="89" rx="3" ry="4.4" fill="#fff6dc" opacity="0.6" />
    </svg>
  );
}
