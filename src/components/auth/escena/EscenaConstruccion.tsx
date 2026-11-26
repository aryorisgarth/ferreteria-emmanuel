"use client";

import { useState, useEffect } from "react";
import { CasaSvgIsometrica } from "./CasaSvgIsometrica";
import { HerramientasSvgAnimadas } from "./HerramientasSvgAnimadas";

const ETAPAS = [
  { id: 1, nombre: "Cimientos y Terreno", detalle: "Trazado, excavación y base nivelada" },
  { id: 2, nombre: "Levantamiento de Paredes", detalle: "Bloques estructurados y dinteles" },
  { id: 3, nombre: "Estructura del Techo", detalle: "Cerchas de acero y tijeras" },
  { id: 4, nombre: "Puertas y Ventanas", detalle: "Carpintería y vidrios reflectivos" },
  { id: 5, nombre: "Acabados e Iluminación", detalle: "Pintura, detalles dorados y energía" },
];

interface Props {
  className?: string;
  onInteraccion?: () => void;
}

export function EscenaConstruccion({ className = "", onInteraccion }: Props) {
  const [etapa, setEtapa] = useState<number>(1);
  const [animando, setAnimando] = useState<boolean>(true);

  // Ciclo automático de construcción progresiva (cada 4.2 segundos cambia de etapa)
  useEffect(() => {
    // Si el usuario prefiere movimiento reducido, dejamos la casa terminada
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      setEtapa(5);
      setAnimando(false);
      return;
    }

    if (!animando) return;

    const intervalo = setInterval(() => {
      setEtapa((prev) => (prev >= 5 ? 1 : prev + 1));
    }, 4200);

    return () => clearInterval(intervalo);
  }, [animando]);

  const seleccionarEtapa = (id: number) => {
    setEtapa(id);
    setAnimando(false);
    onInteraccion?.();
  };

  return (
    <div className={`relative flex flex-col items-center justify-between overflow-hidden select-none ${className}`}>
      {/* Fondo técnico / Cuadrícula isométrica blueprint */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      {/* Indicador superior de etapa arquitectónica */}
      <div className="relative z-10 w-full pt-6 px-6 flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/80 backdrop-blur-md shadow-lg">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-xs font-semibold tracking-wider uppercase text-amber-400">
            Etapa {etapa}/5: {ETAPAS[etapa - 1].nombre}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1 font-mono tracking-tight text-center">
          {ETAPAS[etapa - 1].detalle}
        </p>
      </div>

      {/* Escena SVG Central */}
      <div className="relative z-10 flex-1 w-full flex items-center justify-center p-4">
        <div className="w-full max-w-[560px] aspect-[4/3] relative flex items-center justify-center">
          <svg
            viewBox="0 0 600 460"
            className="w-full h-full drop-shadow-[0_20px_40px_rgba(0,0,0,0.6)] transition-transform duration-700 hover:scale-[1.02]"
            aria-label={`Visualización isométrica: ${ETAPAS[etapa - 1].nombre}`}
          >
            {/* Suelo base isométrico y reflejos */}
            <defs>
              <radialGradient id="baseGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#facc15" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#facc15" stopOpacity="0" />
              </radialGradient>
            </defs>
            <ellipse cx="300" cy="340" rx="260" ry="90" fill="url(#baseGlow)" />

            {/* Casa Isométrica */}
            <CasaSvgIsometrica etapa={etapa} />

            {/* Herramientas de Ferretería */}
            <HerramientasSvgAnimadas etapa={etapa} />
          </svg>
        </div>
      </div>

      {/* Barra de progreso interactiva inferior */}
      <div className="relative z-10 w-full pb-6 px-6 max-w-lg">
        <div className="flex items-center justify-between gap-2 bg-slate-900/70 p-1.5 rounded-2xl border border-slate-800/80 backdrop-blur-md shadow-xl">
          {ETAPAS.map((e) => {
            const activa = etapa === e.id;
            const completada = etapa > e.id;
            return (
              <button
                key={e.id}
                onClick={() => seleccionarEtapa(e.id)}
                title={e.nombre}
                className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all ${
                  activa
                    ? "bg-amber-400 text-slate-950 shadow-md scale-105"
                    : completada
                    ? "bg-slate-800 text-amber-300 hover:bg-slate-700"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                }`}
              >
                Paso {e.id}
              </button>
            );
          })}
        </div>
        <div className="flex justify-between items-center mt-2 px-1 text-[10px] text-slate-400 font-medium">
          <span>Construcción de Obra Isométrica</span>
          <button
            onClick={() => setAnimando(!animando)}
            className="hover:text-amber-400 transition"
          >
            {animando ? "Pausar animación" : "Reanudar animación"}
          </button>
        </div>
      </div>
    </div>
  );
}
