"use client";

import { pts, TEMAS, type TemaAmbiente } from "./geometriaIso";

interface Props {
  progreso: number;
  tema?: TemaAmbiente;
}

export function CapaCimientosAcero({ progreso, tema = "dia" }: Props) {
  const t = TEMAS[tema];
  const opacidadPlataforma = Math.min(1, progreso * 3.5);
  const elevacionCimiento = Math.min(18, progreso * 70);
  const escalaAcero = Math.max(0, Math.min(1, (progreso - 0.3) * 2.5));

  if (progreso <= 0.02) return null;

  return (
    <g id="capa-cimientos" opacity={opacidadPlataforma}>
      {/* Terreno nivelado */}
      <polygon
        points={pts([-130, -5, -95], [130, -5, -95], [130, -5, 95], [-130, -5, 95])}
        fill={t.terreno}
        stroke={t.terrenoBorde}
        strokeWidth="1.5"
      />
      <polygon
        points={pts([-130, -5, 95], [130, -5, 95], [130, -18, 95], [-130, -18, 95])}
        fill="#0f172a"
      />
      <polygon
        points={pts([130, -5, -95], [130, -5, 95], [130, -18, 95], [130, -18, -95])}
        fill="#020617"
      />

      {/* Cimiento corrido de concreto */}
      {elevacionCimiento > 2 && (
        <g id="cimiento-concreto">
          <polygon
            points={pts([-105, elevacionCimiento, 75], [105, elevacionCimiento, 75], [105, 0, 75], [-105, 0, 75])}
            fill={t.concretoFront}
            stroke={t.terrenoBorde}
            strokeWidth="0.8"
          />
          <polygon
            points={pts([105, elevacionCimiento, -75], [105, elevacionCimiento, 75], [105, 0, 75], [105, 0, -75])}
            fill={t.concretoSide}
            stroke="#1e293b"
            strokeWidth="0.8"
          />
          <polygon
            points={pts([-105, elevacionCimiento, -75], [105, elevacionCimiento, -75], [105, elevacionCimiento, 75], [-105, elevacionCimiento, 75])}
            fill={t.concretoTop}
            stroke={t.concretoFront}
            strokeWidth="0.8"
          />
        </g>
      )}

      {/* Acero estructural con estribos */}
      {escalaAcero > 0.05 && (
        <g id="armadura-acero" opacity={escalaAcero}>
          {[
            [-100, 70],
            [100, 70],
            [-100, -70],
            [100, -70],
            [0, 70],
            [0, -70],
          ].map(([colX, colZ], idx) => {
            const h = 80 * escalaAcero;
            return (
              <g key={`varillas-${idx}`}>
                <line
                  x1={pts([colX - 3, 18, colZ - 3]).split(",")[0]}
                  y1={pts([colX - 3, 18, colZ - 3]).split(",")[1]}
                  x2={pts([colX - 3, 18 + h, colZ - 3]).split(",")[0]}
                  y2={pts([colX - 3, 18 + h, colZ - 3]).split(",")[1]}
                  stroke="#f59e0b"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <line
                  x1={pts([colX + 3, 18, colZ + 3]).split(",")[0]}
                  y1={pts([colX + 3, 18, colZ + 3]).split(",")[1]}
                  x2={pts([colX + 3, 18 + h, colZ + 3]).split(",")[0]}
                  y2={pts([colX + 3, 18 + h, colZ + 3]).split(",")[1]}
                  stroke="#f59e0b"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                {[25, 45, 65, 85].filter((estH) => estH <= 18 + h).map((estH) => (
                  <polygon
                    key={`estribo-${estH}`}
                    points={pts(
                      [colX - 4, estH, colZ - 4],
                      [colX + 4, estH, colZ - 4],
                      [colX + 4, estH, colZ + 4],
                      [colX - 4, estH, colZ + 4]
                    )}
                    fill="none"
                    stroke="#d97706"
                    strokeWidth="1.2"
                  />
                ))}
              </g>
            );
          })}
        </g>
      )}
    </g>
  );
}
