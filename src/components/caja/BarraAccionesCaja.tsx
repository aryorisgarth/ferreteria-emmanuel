"use client";

import { useState } from "react";
import { ArrowDownRight, FileText, Lock, Unlock, Printer } from "lucide-react";
import type { TurnoCaja } from "@/lib/types";

interface BarraAccionesCajaProps {
  turno: TurnoCaja | null;
  onAbrirCotizaciones: () => void;
  onAbrirMovimiento: () => void;
  onAbrirCierre: () => void;
  onAbrirTurno: () => void;
}

export function BarraAccionesCaja({
  turno,
  onAbrirCotizaciones,
  onAbrirMovimiento,
  onAbrirCierre,
  onAbrirTurno,
}: BarraAccionesCajaProps) {
  const [anchoTermico, setAnchoTermico] = useState<"80mm" | "58mm">(() => {
    if (typeof window === "undefined") return "80mm";
    try {
      const p = JSON.parse(localStorage.getItem("ferreteria_hardware_prefs") || "{}");
      return p.anchoPapel === "58mm" ? "58mm" : "80mm";
    } catch {
      return "80mm";
    }
  });

  const cambiarAncho = () => {
    const nuevo = anchoTermico === "80mm" ? "58mm" : "80mm";
    setAnchoTermico(nuevo);
    try {
      const p = JSON.parse(localStorage.getItem("ferreteria_hardware_prefs") || "{}");
      p.anchoPapel = nuevo;
      p.tipoImpresora = nuevo === "58mm" ? "termica-58" : "termica-80";
      localStorage.setItem("ferreteria_hardware_prefs", JSON.stringify(p));
    } catch {}
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-200 bg-white px-3 py-1.5 shadow-2xs">
      <div className="flex items-center gap-2">
        {turno ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-mono text-emerald-800">Caja {turno.numero}</span>
            <span className="text-slate-400 font-normal">({turno.usuario})</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800">
            <Lock size={12} className="text-amber-600" />
            <span>Caja Cerrada</span>
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={cambiarAncho}
          className="btn btn-linea h-7 text-xs px-2 font-mono font-bold gap-1 text-slate-700 hover:text-slate-900 border-slate-300"
          title="Alternar ancho de ticket térmico entre 80mm y 58mm"
        >
          <Printer size={12} className="text-slate-600" />
          <span>Ticket: {anchoTermico}</span>
        </button>
        <button
          type="button"
          onClick={onAbrirCotizaciones}
          className="btn btn-linea h-7 text-xs px-2.5 font-bold gap-1 border-amber-300 text-amber-900 bg-amber-50 hover:bg-amber-100 transition"
          title="Cargar cotización autorizada (F7)"
        >
          <FileText size={12} className="text-amber-700" />
          <span>Cargar Cotización [F7]</span>
        </button>

        {turno ? (
          <>
            <button
              type="button"
              onClick={onAbrirMovimiento}
              className="btn btn-linea h-7 text-xs px-2 font-semibold gap-1"
              title="Registrar entrada o salida menor de caja"
            >
              <ArrowDownRight size={12} className="text-amber-600" />
              <span>Movimiento</span>
            </button>
            <button
              type="button"
              onClick={onAbrirCierre}
              className="btn btn-azul h-7 text-xs px-2.5 font-semibold gap-1"
              title="Cierre de turno y arqueo de gaveta"
            >
              <Lock size={12} />
              <span>Arqueo / Cierre</span>
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onAbrirTurno}
            className="btn btn-amarillo h-7 text-xs px-2.5 font-bold gap-1"
          >
            <Unlock size={12} />
            <span>Abrir Turno</span>
          </button>
        )}
      </div>
    </div>
  );
}
