"use client";

interface CasaSvgProps {
  etapa: number; // 1: Cimientos, 2: Paredes, 3: Techo, 4: Cerramientos, 5: Acabados
}

export function CasaSvgIsometrica({ etapa }: CasaSvgProps) {
  return (
    <g className="casa-isometrica" transform="translate(0, 0)">
      {/* ====================================================================
          ETAPA 1: TERRENO, CUADRÍCULA TOPOGRÁFICA Y CIMIENTOS
          ==================================================================== */}
      <g className="capa-cimientos transition-all duration-700">
        {/* Plataforma base de terreno nivelado */}
        <polygon points="400,190 650,330 400,470 150,330" fill="#0f172a" stroke="#1e293b" strokeWidth="1.5" />
        {/* Espesor del terreno */}
        <polygon points="150,330 400,470 400,490 150,350" fill="#090d16" />
        <polygon points="400,470 650,330 650,350 400,490" fill="#020617" />

        {/* Losa de cimentación de concreto armado con marcas isométricas */}
        {etapa >= 1 && (
          <g className="animate-in fade-in zoom-in-95 duration-500">
            <polygon points="400,210 610,330 400,450 190,330" fill="#334155" stroke="#475569" strokeWidth="1.5" />
            <polygon points="190,330 400,450 400,465 190,345" fill="#1e293b" />
            <polygon points="400,450 610,330 610,345 400,465" fill="#0f172a" />
            {/* Ejes y guías de replanteo en color azul técnico */}
            <line x1="295" y1="270" x2="505" y2="390" stroke="#38bdf8" strokeWidth="1" strokeDasharray="4 3" opacity="0.6" />
            <line x1="505" y1="270" x2="295" y2="390" stroke="#38bdf8" strokeWidth="1" strokeDasharray="4 3" opacity="0.6" />
          </g>
        )}
      </g>

      {/* ====================================================================
          ETAPA 2: LEVANTAMIENTO DE PAREDES Y COLUMNAS DE CARGA
          ==================================================================== */}
      {etapa >= 2 && (
        <g className="capa-paredes animate-in fade-in slide-in-from-bottom-3 duration-600">
          {/* Pared Lateral Izquierda */}
          <polygon points="210,318 400,428 400,268 210,158" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
          {/* Textura de bloques y juntas horizontales */}
          <line x1="210" y1="195" x2="400" y2="305" stroke="#334155" strokeWidth="1" opacity="0.6" />
          <line x1="210" y1="235" x2="400" y2="345" stroke="#334155" strokeWidth="1" opacity="0.6" />
          <line x1="210" y1="275" x2="400" y2="385" stroke="#334155" strokeWidth="1" opacity="0.6" />

          {/* Pared Frontal Derecha */}
          <polygon points="400,428 590,318 590,158 400,268" fill="#0f172a" stroke="#1e293b" strokeWidth="1.5" />
          {/* Textura de hiladas */}
          <line x1="400" y1="305" x2="590" y2="195" stroke="#1e293b" strokeWidth="1" opacity="0.8" />
          <line x1="400" y1="345" x2="590" y2="235" stroke="#1e293b" strokeWidth="1" opacity="0.8" />
          <line x1="400" y1="385" x2="590" y2="275" stroke="#1e293b" strokeWidth="1" opacity="0.8" />

          {/* Columnas estructurales reforzadas en esquinas */}
          <polygon points="208,320 216,325 216,155 208,150" fill="#475569" />
          <polygon points="396,432 404,432 404,268 396,268" fill="#64748b" />
          <polygon points="584,325 592,320 592,150 584,155" fill="#334155" />
        </g>
      )}

      {/* ====================================================================
          ETAPA 4: COLOCACIÓN DE PUERTAS, VENTANAS Y CERRAMIENTOS
          ==================================================================== */}
      {etapa >= 4 && (
        <g className="capa-aberturas animate-in fade-in duration-500">
          {/* Puerta principal en fachada frontal derecha */}
          <polygon points="435,395 475,372 475,275 435,298" fill="#1e293b" stroke="#facc15" strokeWidth="1.5" />
          <polygon points="440,390 470,373 470,282 440,300" fill="#090d16" />
          {/* Manija metálica dorada */}
          <circle cx="445" cy="345" r="2.5" fill="#facc15" />

          {/* Ventana moderna en fachada izquierda con reflejos */}
          <polygon points="250,285 330,331 330,225 250,179" fill="#090d16" stroke="#475569" strokeWidth="1.5" />
          {/* Vidrio arquitectónico celeste con reflejo */}
          <polygon points="255,282 325,322 325,230 255,188" fill="#0284c7" opacity="0.35" />
          <line x1="290" y1="305" x2="290" y2="208" stroke="#64748b" strokeWidth="1.5" />
          <line x1="255" y1="235" x2="325" y2="276" stroke="#64748b" strokeWidth="1.5" />
        </g>
      )}

      {/* ====================================================================
          ETAPA 3: ESTRUCTURA DEL TECHO, TIJERAS Y PENDIENTES
          ==================================================================== */}
      {etapa >= 3 && (
        <g className="capa-techo animate-in fade-in slide-in-from-top-4 duration-700">
          {/* Frontón triangular (mojinete) */}
          <polygon points="400,268 210,158 305,103" fill="#334155" stroke="#475569" strokeWidth="1" />
          <polygon points="400,268 590,158 495,103" fill="#1e293b" stroke="#334155" strokeWidth="1" />

          {/* Cubierta a dos aguas con alero */}
          {/* Faldón izquierdo iluminado */}
          <polygon points="305,95 400,150 200,265 105,210" fill="#1e40af" stroke="#3b82f6" strokeWidth="1.5" opacity="0.95" />
          {/* Faldón frontal derecho en sombra proyectada */}
          <polygon points="305,95 495,205 400,260 210,150" fill="#1e3a8a" stroke="#1d4ed8" strokeWidth="1.5" opacity="0.9" />

          {/* Línea de cumbrera superior */}
          <line x1="305" y1="95" x2="495" y2="205" stroke="#93c5fd" strokeWidth="2.5" />
        </g>
      )}

      {/* ====================================================================
          ETAPA 5: ACABADOS FINALES, DETALLES INSTITUCIONALES Y LUZ
          ==================================================================== */}
      {etapa >= 5 && (
        <g className="capa-acabados animate-in fade-in zoom-in-95 duration-700">
          {/* Placa metálica institucional dorada "Ferretería Emmanuel" */}
          <polygon points="505,340 555,311 555,295 505,324" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />
          <polygon points="510,336 550,313 550,301 510,324" fill="#0f172a" />
          {/* Isotipo 'E' en miniatura en la placa */}
          <circle cx="530" cy="318" r="3" fill="#facc15" />

          {/* Lámpara de porche exterior encendida */}
          <circle cx="423" cy="285" r="4" fill="#facc15" />
          <polygon points="423,285 410,335 440,320" fill="#facc15" opacity="0.18" />

          {/* Remates de cumbrera y chimenea de ventilación */}
          <polygon points="440,140 455,149 455,120 440,111" fill="#475569" stroke="#64748b" strokeWidth="1" />
          <polygon points="455,149 465,143 465,114 455,120" fill="#334155" />
        </g>
      )}
    </g>
  );
}
