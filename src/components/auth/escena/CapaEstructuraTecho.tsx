"use client";

import { pts, TEMAS, type TemaAmbiente } from "./geometriaIso";

interface Props {
  progreso: number;
  tema?: TemaAmbiente;
}

export function CapaEstructuraTecho({ progreso, tema = "dia" }: Props) {
  if (progreso <= 0.02) return null;
  const t = TEMAS[tema];

  const opacidadCerchas = Math.min(1, progreso * 2.5);
  const perlinesVisibles = Math.floor(progreso * 7);

  return (
    <g id="capa-estructura-techo" opacity={opacidadCerchas}>
      {/* Mojinetes triangulares */}
      <polygon
        points={pts([-95, 93, 70], [0, 130, 70], [95, 93, 70])}
        fill={t.bloqueMedio}
        stroke={t.mortero}
        strokeWidth="0.8"
      />
      <polygon
        points={pts([95, 93, 70], [0, 130, 0], [95, 93, -70])}
        fill={t.bloqueOscuro}
        stroke={t.mortero}
        strokeWidth="0.8"
      />

      {/* Cerchas metálicas */}
      {[70, 0, -70].map((cerchaZ, idx) => (
        <g key={`cercha-${idx}`}>
          <line
            x1={pts([-98, 93, cerchaZ]).split(",")[0]}
            y1={pts([-98, 93, cerchaZ]).split(",")[1]}
            x2={pts([98, 93, cerchaZ]).split(",")[0]}
            y2={pts([98, 93, cerchaZ]).split(",")[1]}
            stroke={t.aceroCercha}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <line
            x1={pts([-105, 90, cerchaZ]).split(",")[0]}
            y1={pts([-105, 90, cerchaZ]).split(",")[1]}
            x2={pts([0, 132, cerchaZ]).split(",")[0]}
            y2={pts([0, 132, cerchaZ]).split(",")[1]}
            stroke={t.aceroCercha}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <line
            x1={pts([0, 132, cerchaZ]).split(",")[0]}
            y1={pts([0, 132, cerchaZ]).split(",")[1]}
            x2={pts([105, 90, cerchaZ]).split(",")[0]}
            y2={pts([105, 90, cerchaZ]).split(",")[1]}
            stroke={t.aceroCercha}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <line
            x1={pts([0, 132, cerchaZ]).split(",")[0]}
            y1={pts([0, 132, cerchaZ]).split(",")[1]}
            x2={pts([0, 93, cerchaZ]).split(",")[0]}
            y2={pts([0, 93, cerchaZ]).split(",")[1]}
            stroke={t.aceroPerlin}
            strokeWidth="1.5"
          />
          <line
            x1={pts([-50, 112, cerchaZ]).split(",")[0]}
            y1={pts([-50, 112, cerchaZ]).split(",")[1]}
            x2={pts([0, 93, cerchaZ]).split(",")[0]}
            y2={pts([0, 93, cerchaZ]).split(",")[1]}
            stroke={t.aceroPerlin}
            strokeWidth="1.5"
          />
          <line
            x1={pts([50, 112, cerchaZ]).split(",")[0]}
            y1={pts([50, 112, cerchaZ]).split(",")[1]}
            x2={pts([0, 93, cerchaZ]).split(",")[0]}
            y2={pts([0, 93, cerchaZ]).split(",")[1]}
            stroke={t.aceroPerlin}
            strokeWidth="1.5"
          />
        </g>
      ))}

      {/* Perlines galvanizados */}
      {perlinesVisibles > 0 && (
        <g id="perlines-longitudinales">
          {[
            { x: 0, y: 132 },
            { x: 28, y: 120 },
            { x: 56, y: 108 },
            { x: 84, y: 96 },
            { x: 105, y: 88 },
          ]
            .slice(0, perlinesVisibles)
            .map((p, pIdx) => (
              <line
                key={`perlin-der-${pIdx}`}
                x1={pts([p.x, p.y, -78]).split(",")[0]}
                y1={pts([p.x, p.y, -78]).split(",")[1]}
                x2={pts([p.x, p.y, 78]).split(",")[0]}
                y2={pts([p.x, p.y, 78]).split(",")[1]}
                stroke={t.aceroPerlin}
                strokeWidth="2.5"
                strokeLinecap="square"
              />
            ))}

          {[
            { x: -30, y: 120 },
            { x: -60, y: 108 },
            { x: -90, y: 96 },
            { x: -105, y: 88 },
          ]
            .slice(0, Math.max(0, perlinesVisibles - 1))
            .map((p, pIdx) => (
              <line
                key={`perlin-izq-${pIdx}`}
                x1={pts([p.x, p.y, -78]).split(",")[0]}
                y1={pts([p.x, p.y, -78]).split(",")[1]}
                x2={pts([p.x, p.y, 78]).split(",")[0]}
                y2={pts([p.x, p.y, 78]).split(",")[1]}
                stroke={t.aceroPerlin}
                strokeWidth="2"
              />
            ))}
        </g>
      )}
    </g>
  );
}
