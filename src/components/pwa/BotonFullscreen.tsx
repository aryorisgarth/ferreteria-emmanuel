"use client";

import { useFullscreen } from "./useFullscreen";
import { Maximize2, Minimize2 } from "lucide-react";

interface Props {
  className?: string;
}

export function BotonFullscreen({ className = "" }: Props) {
  const { soportado, esFullscreen, alternarFullscreen } = useFullscreen();

  if (!soportado) return null;

  return (
    <button
      type="button"
      onClick={alternarFullscreen}
      title={esFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
      aria-label={esFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
      className={`inline-flex items-center justify-center p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-amber-400 border border-slate-700/80 backdrop-blur-md shadow-md transition active:scale-95 cursor-pointer ${className}`}
    >
      {esFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
    </button>
  );
}
