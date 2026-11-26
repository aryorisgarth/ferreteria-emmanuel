"use client";

import { pts, TEMAS, type TemaAmbiente } from "./geometriaIso";

interface Props {
  progreso: number;
  tema?: TemaAmbiente;
}

export function CapaTechoZinc({ progreso, tema = "dia" }: Props) {
  if (progreso <= 0.02) return null;
  const t = TEMAS[tema];

  const zMax = -82 + progreso * 164;

  return (
    <g id="capa-techo-zinc">
      {/* Aguada derecha de zinc */}
      <polygon
        points={pts([0, 134, -80], [112, 86, -80], [112, 86, zMax], [0, 134, zMax])}
        fill={t.zincMedio}
        stroke={t.lineaZinc}
        strokeWidth="0.8"
      />

      {/* Corrugado */}
      {Array.from({ length: 8 }).map((_, oIdx) => {
        const canalX = 12 + oIdx * 12;
        const canalY = 134 - (canalX / 112) * 48;
        return (
          <line
            key={`canal-zinc-${oIdx}`}
            x1={pts([canalX, canalY, -80]).split(",")[0]}
            y1={pts([canalX, canalY, -80]).split(",")[1]}
            x2={pts([canalX, canalY, zMax]).split(",")[0]}
            y2={pts([canalX, canalY, zMax]).split(",")[1]}
            stroke={t.lineaZinc}
            strokeWidth="0.7"
          />
        );
      })}

      {/* Aguada izquierda */}
      <polygon
        points={pts([-112, 86, -80], [0, 134, -80], [0, 134, zMax], [-112, 86, zMax])}
        fill={t.zincSombra}
        stroke={t.lineaZinc}
        strokeWidth="0.8"
      />

      {/* Fascia frontal */}
      <polygon
        points={pts([112, 86, zMax], [112, 80, zMax], [0, 128, zMax], [0, 134, zMax])}
        fill={t.cumbrera}
        stroke={t.lineaZinc}
        strokeWidth="0.6"
      />
      <polygon
        points={pts([-112, 86, zMax], [-112, 80, zMax], [0, 128, zMax], [0, 134, zMax])}
        fill={t.zincSombra}
        stroke={t.lineaZinc}
        strokeWidth="0.6"
      />

      {/* Cumbrera de zinc */}
      {progreso > 0.3 && (
        <g id="cumbrera-zinc">
          <polygon
            points={pts([0, 135, -82], [14, 128, -82], [14, 128, zMax], [0, 135, zMax])}
            fill={t.cumbrera}
            stroke={t.lineaZinc}
            strokeWidth="0.6"
          />
          <polygon
            points={pts([-14, 128, -82], [0, 135, -82], [0, 135, zMax], [-14, 128, zMax])}
            fill={t.zincSombra}
            stroke={t.lineaZinc}
            strokeWidth="0.6"
          />
        </g>
      )}

      {/* Reflejo metálico */}
      {progreso > 0.85 && (
        <polygon
          points={pts([10, 130, -70], [80, 98, -70], [90, 94, 20], [20, 126, 20])}
          fill="url(#reflejoZinc)"
          opacity={Math.min(0.6, (progreso - 0.85) * 4)}
        />
      )}
    </g>
  );
}
