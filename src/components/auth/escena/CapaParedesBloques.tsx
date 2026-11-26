"use client";

import { pts, TEMAS, type TemaAmbiente } from "./geometriaIso";

interface Props {
  progreso: number;
  repelloProgreso: number;
  tema?: TemaAmbiente;
}

export function CapaParedesBloques({ progreso, repelloProgreso, tema = "dia" }: Props) {
  if (progreso <= 0.02) return null;
  const t = TEMAS[tema];

  const maxH = 75;
  const alturaActual = Math.min(maxH, progreso * maxH * 1.1);
  const totalHiladas = 8;
  const hiladasVisibles = Math.floor((alturaActual / maxH) * totalHiladas);
  const columnasColadas = progreso > 0.6;

  // Pintura en la pared lateral: celeste vibrante (#38bdf8 / #0284c7)
  const pintandoLateral = repelloProgreso > 0.15;
  const zPintado = Math.max(0, 70 - repelloProgreso * 95);

  return (
    <g id="capa-paredes-mamposteria">
      {/* Pared frontal de bloques */}
      <g id="pared-bloques-frontal">
        {Array.from({ length: Math.min(totalHiladas, hiladasVisibles) }).map((_, hIdx) => {
          const yBase = 18 + hIdx * 9;
          const yTop = yBase + 8.5;
          const colorBloque = repelloProgreso > 0.4 ? t.repelloLuz : hIdx % 2 === 0 ? t.bloqueClaro : t.bloqueMedio;

          return (
            <g key={`hilada-front-${hIdx}`}>
              <polygon points={pts([-95, yTop, 70], [-35, yTop, 70], [-35, yBase, 70], [-95, yBase, 70])} fill={colorBloque} stroke={t.mortero} strokeWidth="0.6" />
              {hIdx >= 5 && (
                <polygon points={pts([-35, yTop, 70], [15, yTop, 70], [15, yBase, 70], [-35, yBase, 70])} fill={repelloProgreso > 0.4 ? t.repelloLuz : t.bloqueMedio} stroke={t.mortero} strokeWidth="0.6" />
              )}
              {(hIdx <= 1 || hIdx >= 5) && (
                <polygon points={pts([25, yTop, 70], [85, yTop, 70], [85, yBase, 70], [25, yBase, 70])} fill={repelloProgreso > 0.4 ? t.repelloLuz : t.bloqueClaro} stroke={t.mortero} strokeWidth="0.6" />
              )}
              <polygon points={pts([85, yTop, 70], [95, yTop, 70], [95, yBase, 70], [85, yBase, 70])} fill={colorBloque} stroke={t.mortero} strokeWidth="0.6" />
            </g>
          );
        })}
      </g>

      {/* Muro lateral derecho (X=95, Z: 70 a -70) con bloques y pintura celeste dispersa */}
      <g id="pared-bloques-lateral">
        {Array.from({ length: Math.min(totalHiladas, hiladasVisibles) }).map((_, hIdx) => {
          const yBase = 18 + hIdx * 9;
          const yTop = yBase + 8.5;
          return (
            <polygon
              key={`hilada-lat-${hIdx}`}
              points={pts([95, yTop, -70], [95, yTop, 70], [95, yBase, 70], [95, yBase, -70])}
              fill={hIdx % 2 === 0 ? t.bloqueMedio : t.bloqueOscuro}
              stroke={t.mortero}
              strokeWidth="0.6"
            />
          );
        })}

        {/* Capa de pintura celeste viva con borde irregular y degradé natural */}
        {pintandoLateral && (
          <g id="pintura-celeste-lateral">
            <polygon
              points={pts(
                [95.2, 93, zPintado + 5],
                [95.2, 93, 70],
                [95.2, 18, 70],
                [95.2, 18, zPintado - 3],
                [95.2, 40, zPintado + 8],
                [95.2, 65, zPintado - 6]
              )}
              fill="#38bdf8"
              opacity="0.9"
            />

            {/* Gotas de pintura celeste y salpicaduras dispersas realistas */}
            <ellipse cx={pts([95.4, 25, zPintado - 8]).split(",")[0]} cy={pts([95.4, 25, zPintado - 8]).split(",")[1]} rx="2.5" ry="3.5" fill="#0284c7" />
            <ellipse cx={pts([95.4, 48, zPintado - 12]).split(",")[0]} cy={pts([95.4, 48, zPintado - 12]).split(",")[1]} rx="1.8" ry="2.2" fill="#38bdf8" />
            <ellipse cx={pts([95.4, 70, zPintado - 10]).split(",")[0]} cy={pts([95.4, 70, zPintado - 10]).split(",")[1]} rx="2" ry="2.8" fill="#0284c7" />
            <ellipse cx={pts([95.4, 15, zPintado - 15]).split(",")[0]} cy={pts([95.4, 15, zPintado - 15]).split(",")[1]} rx="1.5" ry="1.8" fill="#38bdf8" />
          </g>
        )}
      </g>

      {/* Columnas de concreto colado */}
      {columnasColadas && (
        <g id="columnas-concreto" opacity={Math.min(1, (progreso - 0.5) * 2.5)}>
          {[[-98, 70], [95, 70], [95, -70], [-36, 70], [17, 70]].map(([cX, cZ], idx) => (
            <g key={`col-colada-${idx}`}>
              <polygon points={pts([cX - 4, 18 + alturaActual, cZ + 4], [cX + 4, 18 + alturaActual, cZ + 4], [cX + 4, 18, cZ + 4], [cX - 4, 18, cZ + 4])} fill={t.concretoTop} stroke="#64748b" strokeWidth="0.6" />
              <polygon points={pts([cX + 4, 18 + alturaActual, cZ - 4], [cX + 4, 18 + alturaActual, cZ + 4], [cX + 4, 18, cZ + 4], [cX + 4, 18, cZ - 4])} fill={t.concretoFront} stroke="#475569" strokeWidth="0.6" />
            </g>
          ))}
        </g>
      )}

      {/* Viga corona sísmica */}
      {progreso > 0.85 && (
        <g id="viga-corona" opacity={Math.min(1, (progreso - 0.85) * 6)}>
          <polygon points={pts([-100, 93, 72], [100, 93, 72], [100, 87, 72], [-100, 87, 72])} fill={t.concretoTop} stroke={t.concretoFront} strokeWidth="0.8" />
          <polygon points={pts([100, 93, -72], [100, 93, 72], [100, 87, 72], [100, 87, -72])} fill={t.concretoFront} stroke={t.concretoSide} strokeWidth="0.8" />
        </g>
      )}
    </g>
  );
}
