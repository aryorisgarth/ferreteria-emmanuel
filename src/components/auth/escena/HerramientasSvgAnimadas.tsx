"use client";

/**
 * Herramientas de ferretería en estética arquitectónica vectorial:
 * - Martillo de carpintero / encofrador
 * - Llave inglesa ajustable
 * - Taladro percutor inalámbrico
 * - Cinta métrica extendible
 */
export function HerramientasSvgAnimadas({ etapa }: { etapa: number }) {
  return (
    <g className="herramientas-construccion transition-all duration-700">
      {/* 1. Cinta métrica arquitectónica (Activa en cimientos) */}
      <g
        className={`transition-opacity duration-500 ${
          etapa >= 1 ? "opacity-90" : "opacity-0"
        }`}
        transform="translate(240, 480)"
      >
        {/* Cuerpo de la cinta métrica */}
        <rect x="0" y="0" width="34" height="26" rx="5" fill="#facc15" stroke="#ca8a04" strokeWidth="1.5" />
        <rect x="5" y="5" width="24" height="16" rx="3" fill="#1e293b" />
        <circle cx="17" cy="13" r="5" fill="#facc15" />
        {/* Cinta metálica extendida sobre el cimiento con marcas milimétricas */}
        <line x1="34" y1="20" x2="280" y2="78" stroke="#cbd5e1" strokeWidth="3" strokeDasharray="6 2" />
        <line x1="34" y1="22" x2="280" y2="80" stroke="#facc15" strokeWidth="1" strokeDasharray="3 3" />
        {/* Gancho final */}
        <rect x="278" y="74" width="4" height="8" rx="1" fill="#475569" transform="rotate(20 280 78)" />
      </g>

      {/* 2. Martillo de construcción (Animación en levantamiento de paredes y estructura) */}
      <g
        className={`transition-all duration-700 ${
          etapa >= 2 && etapa <= 4 ? "opacity-100" : "opacity-30"
        }`}
        style={{
          transform: etapa === 2 || etapa === 3 ? "translate(490px, 180px) rotate(-15deg)" : "translate(540px, 440px) rotate(45deg)",
          transition: "transform 0.8s ease-in-out, opacity 0.5s ease",
        }}
      >
        {/* Mango ergonómico bimaterial */}
        <rect x="18" y="10" width="8" height="62" rx="3" fill="#0f172a" />
        <rect x="18" y="42" width="8" height="28" rx="2" fill="#facc15" />
        {/* Cabeza de acero templado */}
        <path d="M8 8 L36 8 L34 22 L10 22 Z" fill="#64748b" stroke="#334155" strokeWidth="1.2" />
        {/* Uña sacaclavos */}
        <path d="M8 10 Q2 12 0 18 Q5 17 10 18 Z" fill="#475569" />
        {/* Boca de golpe */}
        <rect x="34" y="9" width="5" height="12" rx="1" fill="#94a3b8" />
      </g>

      {/* 3. Taladro percutor / atornillador profesional */}
      <g
        className={`transition-all duration-700 ${
          etapa >= 3 ? "opacity-95" : "opacity-20"
        }`}
        style={{
          transform: etapa === 3 ? "translate(210px, 220px) rotate(10deg)" : "translate(160px, 420px) rotate(-20deg)",
          transition: "transform 0.8s ease-in-out, opacity 0.5s ease",
        }}
      >
        {/* Carcasa en amarillo industrial y negro */}
        <path d="M10 20 L42 20 L45 32 L34 36 L28 54 L16 54 L20 36 L10 32 Z" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
        <path d="M14 22 L38 22 L40 30 L16 30 Z" fill="#facc15" />
        {/* Batería en la base */}
        <rect x="12" y="52" width="20" height="10" rx="2" fill="#334155" />
        {/* Portabrocas y broca para concreto */}
        <rect x="44" y="23" width="10" height="6" rx="1" fill="#475569" />
        <line x1="54" y1="26" x2="72" y2="26" stroke="#e2e8f0" strokeWidth="2.5" strokeDasharray="3 1" />
      </g>

      {/* 4. Llave ajustable francesa / cromada */}
      <g
        className={`transition-all duration-500 ${
          etapa >= 4 ? "opacity-90" : "opacity-25"
        }`}
        style={{
          transform: etapa === 4 || etapa === 5 ? "translate(380px, 480px) rotate(-55deg)" : "translate(420px, 510px) rotate(-35deg)",
          transition: "transform 0.7s ease-in-out",
        }}
      >
        <rect x="12" y="15" width="6" height="52" rx="3" fill="#64748b" stroke="#334155" strokeWidth="1" />
        {/* Cabezal de mordaza ajustable */}
        <path d="M6 10 C6 5 24 5 24 10 L24 20 L18 20 L18 14 L12 14 L12 20 L6 20 Z" fill="#94a3b8" stroke="#475569" strokeWidth="1" />
        {/* Husillo roscado dorado */}
        <rect x="12" y="16" width="6" height="4" fill="#ca8a04" />
      </g>
    </g>
  );
}
