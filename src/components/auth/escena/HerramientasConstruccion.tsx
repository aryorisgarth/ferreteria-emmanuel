"use client";

import { pts, iso } from "./geometriaIso";

interface Props {
  tiempo: number;
}

export function HerramientasConstruccion({ tiempo }: Props) {
  const activaAlbanil = tiempo >= 0.05 && tiempo <= 0.22;
  const activaBloques = tiempo > 0.22 && tiempo <= 0.44;
  const activaTaladro = tiempo > 0.44 && tiempo <= 0.65;
  const activaAcabados = tiempo > 0.65 && tiempo <= 0.94;

  return (
    <g id="herramientas-construccion">
      {/* 1. Cuchara de albañil */}
      {activaAlbanil && (
        <g id="herramienta-cuchara">
          {(() => {
            const pos = iso(-40, 25, 75);
            const osc = Math.sin(tiempo * 50) * 8;
            return (
              <g transform={`translate(${pos[0] + osc}, ${pos[1] - 10 + osc * 0.5}) rotate(${-15 + osc})`}>
                <path d="M 0 0 L 22 -12 L 20 6 Z" fill="#94a3b8" stroke="#475569" strokeWidth="1" />
                <path d="M 0 0 L -8 6 L -18 12" stroke="#b45309" strokeWidth="3" strokeLinecap="round" />
                <circle cx="12" cy="-3" r="3" fill="#cbd5e1" opacity="0.8" />
              </g>
            );
          })()}
        </g>
      )}

      {/* 2. Martillo */}
      {activaBloques && (
        <g id="herramienta-martillo">
          {(() => {
            const pos = iso(40, 60, 75);
            const rot = -25 + Math.abs(Math.sin(tiempo * 40)) * 35;
            return (
              <g transform={`translate(${pos[0]}, ${pos[1] - 15}) rotate(${rot})`}>
                <rect x="-3" y="0" width="6" height="34" rx="2" fill="#d97706" stroke="#78350f" strokeWidth="1" />
                <path d="M -12 -8 L 14 -8 L 14 0 L -12 0 Z" fill="#475569" stroke="#1e293b" strokeWidth="1" />
                <path d="M -12 -8 Q -18 -4 -16 4" stroke="#475569" strokeWidth="2.5" fill="none" />
              </g>
            );
          })()}
        </g>
      )}

      {/* 3. Taladro perlinero */}
      {activaTaladro && (
        <g id="herramienta-taladro">
          {(() => {
            const pos = iso(50, 115, 0);
            const vib = Math.sin(tiempo * 80) * 1.5;
            return (
              <g transform={`translate(${pos[0] + vib}, ${pos[1] - 10})`}>
                <rect x="0" y="0" width="22" height="13" rx="3" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />
                <rect x="3" y="13" width="7" height="15" rx="2" fill="#1e293b" />
                <rect x="1" y="27" width="11" height="6" rx="1.5" fill="#0f172a" />
                <rect x="22" y="4" width="7" height="5" fill="#64748b" />
                <line x1="29" y1="6.5" x2="38" y2="6.5" stroke="#cbd5e1" strokeWidth="1.8" />
              </g>
            );
          })()}
        </g>
      )}

      {/* 4. Fase de Acabados: Cinta métrica original + Latas en pared lateral + Brocha pintando la mitad */}
      {activaAcabados && (
        <g id="herramienta-acabados-pintura">
          {/* Cinta métrica en su posición exacta en fachada */}
          {(() => {
            const posCinta = iso(-60, 40, 75);
            return (
              <g transform={`translate(${posCinta[0]}, ${posCinta[1]})`}>
                <rect x="-10" y="-10" width="20" height="20" rx="5" fill="#facc15" stroke="#0f172a" strokeWidth="1.5" />
                <circle cx="0" cy="0" r="5" fill="#1e293b" />
                <line x1="10" y1="2" x2="45" y2="2" stroke="#fef08a" strokeWidth="3" />
                <line x1="20" y1="0" x2="20" y2="4" stroke="#0f172a" strokeWidth="1" />
                <line x1="30" y1="0" x2="30" y2="4" stroke="#0f172a" strokeWidth="1" />
                <line x1="40" y1="0" x2="40" y2="4" stroke="#0f172a" strokeWidth="1" />
              </g>
            );
          })()}

          {/* Latas de pintura al pie de la pared lateral derecha (X=98, Z entre 10 y -20) */}
          {(() => {
            const posLatas = iso(98, 18, 5);
            return (
              <g transform={`translate(${posLatas[0]}, ${posLatas[1]})`}>
                {/* Lata 1: Azul Institucional Emmanuel con tapa y asa */}
                <g transform="translate(-10, 0)">
                  <rect x="0" y="0" width="12" height="15" rx="1.5" fill="#1e3a8a" stroke="#0f172a" strokeWidth="0.8" />
                  <ellipse cx="6" cy="0" rx="6" ry="2.2" fill="#3b82f6" />
                  <path d="M 0 0 Q 6 -6 12 0" fill="none" stroke="#94a3b8" strokeWidth="0.8" />
                </g>
                {/* Lata 2: Amarillo Oro Emmanuel con pintura fresca */}
                <g transform="translate(6, 4)">
                  <rect x="0" y="0" width="13" height="16" rx="1.5" fill="#facc15" stroke="#ca8a04" strokeWidth="0.8" />
                  <ellipse cx="6.5" cy="0" rx="6.5" ry="2.5" fill="#fef08a" />
                  <path d="M 0 0 Q 6.5 -7 13 0" fill="none" stroke="#94a3b8" strokeWidth="0.8" />
                </g>
              </g>
            );
          })()}

          {/* Brocha activa en la pared lateral derecha pintando hacia la mitad con trazo realista */}
          {(() => {
            const posBrocha = iso(96, 52, 10);
            const barrido = Math.sin(tiempo * 50) * 14;
            return (
              <g transform={`translate(${posBrocha[0] + barrido * 0.8}, ${posBrocha[1] + barrido * 0.4}) rotate(-25)`}>
                <rect x="-2" y="0" width="4" height="24" rx="1" fill="#b45309" stroke="#78350f" strokeWidth="0.8" />
                <rect x="-5" y="24" width="10" height="6" fill="#cbd5e1" stroke="#64748b" strokeWidth="0.8" />
                <path d="M -5 30 L -5 38 L 5 38 L 5 30 Z" fill="#3b82f6" />
                <path d="M -2 33 L -2 38 L 2 38 L 2 33 Z" fill="#facc15" />
              </g>
            );
          })()}
        </g>
      )}
    </g>
  );
}
