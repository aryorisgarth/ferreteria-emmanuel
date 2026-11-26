"use client";

import { pts, TEMAS, type TemaAmbiente } from "./geometriaIso";

interface Props {
  aberturasProgreso: number;
  acabadosProgreso: number;
  lucesEncendidas: boolean;
  aperturaVentanas?: number; // 0.0 cerrada a 1.0 abierta deslizándose lateralmente
  tema?: TemaAmbiente;
}

export function CapaAberturasYAcabados({
  aberturasProgreso,
  acabadosProgreso,
  lucesEncendidas,
  aperturaVentanas = 0,
  tema = "dia",
}: Props) {
  if (aberturasProgreso <= 0.02) return null;

  // Desplazamiento corredizo de la hoja derecha de la ventana (avanza hasta 22 unidades hacia la izquierda)
  const desplazamientoHoja = aperturaVentanas * 22;

  return (
    <g id="capa-aberturas-acabados">
      {/* Puerta principal de madera */}
      <g id="puerta-principal" opacity={Math.min(1, aberturasProgreso * 2)}>
        <polygon points={pts([-35, 72, 71], [15, 72, 71], [15, 18, 71], [-35, 18, 71])} fill="#78350f" />
        <polygon points={pts([-32, 70, 71.5], [12, 70, 71.5], [12, 19, 71.5], [-32, 19, 71.5])} fill="#b45309" stroke="#78350f" strokeWidth="0.8" />
        <polygon points={pts([-28, 65, 72], [-12, 65, 72], [-12, 45, 72], [-28, 45, 72])} fill="#92400e" />
        <polygon points={pts([-8, 65, 72], [8, 65, 72], [8, 45, 72], [-8, 45, 72])} fill="#92400e" />
        <circle cx={pts([-9, 42, 72.5]).split(",")[0]} cy={pts([-9, 42, 72.5]).split(",")[1]} r="2" fill="#facc15" stroke="#b45309" strokeWidth="0.5" />
      </g>

      {/* Ventana con hojas corredizas que se abren animadamente */}
      <g id="ventana-frontal" opacity={Math.min(1, aberturasProgreso * 2)}>
        {/* Marco perimetral blanco de aluminio */}
        <polygon points={pts([25, 72, 71], [85, 72, 71], [85, 36, 71], [25, 36, 71])} fill="#f8fafc" stroke="#94a3b8" strokeWidth="0.8" />
        
        {/* Interior oscuro de la habitación visible cuando la ventana se abre */}
        <polygon points={pts([28, 69, 70.8], [82, 69, 70.8], [82, 39, 70.8], [28, 39, 70.8])} fill="#090d16" />

        {/* Hoja izquierda fija de vidrio */}
        <polygon points={pts([28, 69, 71.3], [55, 69, 71.3], [55, 39, 71.3], [28, 39, 71.3])} fill="#38bdf8" stroke="#0284c7" strokeWidth="0.6" />
        <polygon points={pts([32, 69, 71.4], [40, 69, 71.4], [50, 39, 71.4], [42, 39, 71.4])} fill="rgba(255,255,255,0.7)" opacity="0.6" />

        {/* Hoja derecha corrediza que se desplaza suavemente hacia la izquierda al abrirse */}
        <g id="hoja-corrediza">
          <polygon
            points={pts([55 - desplazamientoHoja, 69, 71.6], [82 - desplazamientoHoja, 69, 71.6], [82 - desplazamientoHoja, 39, 71.6], [55 - desplazamientoHoja, 39, 71.6])}
            fill="#38bdf8"
            stroke="#f8fafc"
            strokeWidth="0.8"
          />
          <polygon
            points={pts([60 - desplazamientoHoja, 69, 71.7], [68 - desplazamientoHoja, 69, 71.7], [78 - desplazamientoHoja, 39, 71.7], [70 - desplazamientoHoja, 39, 71.7])}
            fill="rgba(255,255,255,0.7)"
            opacity="0.6"
          />
        </g>
      </g>

      {/* Zócalo institucional */}
      {acabadosProgreso > 0.2 && (
        <g id="zocalo-decorativo" opacity={Math.min(1, acabadosProgreso * 3)}>
          <polygon points={pts([-95, 26, 71], [95, 26, 71], [95, 18, 71], [-95, 18, 71])} fill="#1e3a8a" />
          <polygon points={pts([-95, 27, 71.2], [95, 27, 71.2], [95, 25, 71.2], [-95, 25, 71.2])} fill="#facc15" />
        </g>
      )}

      {/* Farol exterior */}
      {acabadosProgreso > 0.6 && (
        <g id="farol-iluminacion">
          <line x1={pts([-10, 80, 71]).split(",")[0]} y1={pts([-10, 80, 71]).split(",")[1]} x2={pts([-10, 80, 77]).split(",")[0]} y2={pts([-10, 80, 77]).split(",")[1]} stroke="#1e293b" strokeWidth="2.5" />
          <circle cx={pts([-10, 77, 77]).split(",")[0]} cy={pts([-10, 77, 77]).split(",")[1]} r="4" fill={lucesEncendidas ? "#fef08a" : "#475569"} stroke="#0f172a" strokeWidth="1" />
          {lucesEncendidas && (
            <g id="luz-resplandor" className="animate-pulse">
              <ellipse cx={pts([-10, 77, 77]).split(",")[0]} cy={pts([-10, 77, 77]).split(",")[1]} rx="24" ry="18" fill="url(#resplandorLuz)" opacity="0.8" />
              <polygon points={pts([-10, 77, 77], [-45, 18, 85], [25, 18, 85])} fill="url(#conoLuz)" opacity="0.35" />
            </g>
          )}
        </g>
      )}
    </g>
  );
}
