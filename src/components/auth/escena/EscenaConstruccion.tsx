"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, Sun, Sunset, Moon } from "lucide-react";
import { CapaCimientosAcero } from "./CapaCimientosAcero";
import { CapaParedesBloques } from "./CapaParedesBloques";
import { CapaEstructuraTecho } from "./CapaEstructuraTecho";
import { CapaTechoZinc } from "./CapaTechoZinc";
import { CapaAberturasYAcabados } from "./CapaAberturasYAcabados";
import { HerramientasConstruccion } from "./HerramientasConstruccion";
import { TEMAS, type TemaAmbiente } from "./geometriaIso";

const DURACION_CICLO_MS = 25000;
const TEMA_KEY = "fe_login_tema_ambiente";

export function EscenaConstruccion({ className = "" }: { className?: string }) {
  const [tiempoRelativo, setTiempoRelativo] = useState<number>(0);
  const [pausado, setPausado] = useState<boolean>(false);
  const [tema, setTema] = useState<TemaAmbiente>("dia");
  const animFrameRef = useRef<number | null>(null);
  const pausaOffsetRef = useRef<number>(0);

  useEffect(() => {
    // Cargar y persistir tema elegido por el usuario (no se reinicia nunca al acabar el ciclo)
    const temaGuardado = localStorage.getItem(TEMA_KEY) as TemaAmbiente;
    if (temaGuardado && (temaGuardado === "dia" || temaGuardado === "atardecer" || temaGuardado === "noche")) {
      setTema(temaGuardado);
    }
  }, []);

  const cambiarTema = (nuevoTema: TemaAmbiente) => {
    setTema(nuevoTema);
    localStorage.setItem(TEMA_KEY, nuevoTema);
  };

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) { setTiempoRelativo(0.95); return; }

    let inicio = performance.now() - pausaOffsetRef.current;
    const actualizar = (ahora: number) => {
      if (!pausado) {
        const transcurrido = ahora - inicio;
        setTiempoRelativo((transcurrido % DURACION_CICLO_MS) / DURACION_CICLO_MS);
        pausaOffsetRef.current = transcurrido % DURACION_CICLO_MS;
      }
      animFrameRef.current = requestAnimationFrame(actualizar);
    };
    animFrameRef.current = requestAnimationFrame(actualizar);
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [pausado]);

  const t = TEMAS[tema];
  const fCimientos = Math.min(1, Math.max(0, tiempoRelativo / 0.25));
  const fParedes = Math.min(1, Math.max(0, (tiempoRelativo - 0.18) / 0.28));
  const fTechoEstructura = Math.min(1, Math.max(0, (tiempoRelativo - 0.4) / 0.26));
  const fTechoZinc = Math.min(1, Math.max(0, (tiempoRelativo - 0.58) / 0.24));
  const fAberturas = Math.min(1, Math.max(0, (tiempoRelativo - 0.68) / 0.18));
  const fAcabados = Math.min(1, Math.max(0, (tiempoRelativo - 0.76) / 0.16));
  // Ventanas abriéndose tras ser colocadas y consolidarse la casa (de 0.85 a 1.0)
  const aperturaVentanas = Math.min(1, Math.max(0, (tiempoRelativo - 0.85) / 0.12));
  const fLuces = tiempoRelativo > 0.86 || t.farolLuz;

  return (
    <div
      className={`relative flex items-center justify-center w-full h-full overflow-hidden select-none transition-colors duration-700 ${t.cielo} ${className}`}
      style={{ background: t.fondoGradiente }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <svg
        viewBox="0 0 600 480"
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full max-h-[82vh] max-w-[820px] drop-shadow-2xl"
        aria-label="Vivienda en construcción isométrica"
      >
        <defs>
          <linearGradient id="reflejoZinc" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" /><stop offset="100%" stopColor="#94a3b8" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="resplandorLuz" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fef08a" stopOpacity="0.9" /><stop offset="100%" stopColor="#facc15" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="conoLuz" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" stopOpacity="0.6" /><stop offset="100%" stopColor="#facc15" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="sombraPiso" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.8" /><stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
        </defs>

        <ellipse cx="300" cy="350" rx="240" ry="85" fill="url(#sombraPiso)" />
        <CapaCimientosAcero progreso={fCimientos} tema={tema} />
        <CapaParedesBloques progreso={fParedes} repelloProgreso={fAcabados} tema={tema} />
        <CapaEstructuraTecho progreso={fTechoEstructura} tema={tema} />
        <CapaTechoZinc progreso={fTechoZinc} tema={tema} />
        <CapaAberturasYAcabados
          aberturasProgreso={fAberturas}
          acabadosProgreso={fAcabados}
          lucesEncendidas={fLuces}
          aperturaVentanas={aperturaVentanas}
          tema={tema}
        />
        <HerramientasConstruccion tiempo={tiempoRelativo} />
      </svg>

      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setPausado(!pausado)}
          title={pausado ? "Reanudar" : "Pausar"}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-amber-400 border border-slate-800 text-[11px] backdrop-blur-sm cursor-pointer"
        >
          {pausado ? <Play size={13} /> : <Pause size={13} />}
          <span className="hidden sm:inline">{pausado ? "Reanudar" : "Pausar"}</span>
        </button>

        <div className="flex items-center bg-slate-900/80 p-0.5 rounded-lg border border-slate-800 backdrop-blur-sm">
          {(["dia", "atardecer", "noche"] as TemaAmbiente[]).map((tm) => {
            const Icono = tm === "dia" ? Sun : tm === "atardecer" ? Sunset : Moon;
            return (
              <button
                key={tm}
                type="button"
                onClick={() => cambiarTema(tm)}
                title={TEMAS[tm].nombre}
                className={`p-1.5 rounded-md cursor-pointer ${tema === tm ? "bg-amber-400 text-slate-950 shadow-sm" : "text-slate-400 hover:text-slate-200"}`}
              >
                <Icono size={13} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
