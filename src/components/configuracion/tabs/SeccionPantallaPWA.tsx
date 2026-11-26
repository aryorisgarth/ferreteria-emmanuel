"use client";

import React, { useEffect, useState } from "react";
import { Smartphone, Monitor, Sun, Moon, ShieldCheck, Download, AlertCircle } from "lucide-react";
import { useWakeLockContext } from "@/components/pwa/WakeLockProvider";

export function SeccionPantallaPWA() {
  const { soportado, activo, habilitado, toggleWakeLock } = useWakeLockContext();
  const [instalado, setInstalado] = useState(false);
  const [esIOS, setEsIOS] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const esStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true;
      setInstalado(esStandalone);
      setEsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
    }
  }, []);

  return (
    <div className="rounded-lg border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Smartphone size={16} className="text-slate-600" />
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Pantalla y Aplicación Instalable (PWA)
          </h3>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
            instalado
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-amber-50 text-amber-700 border border-amber-200"
          }`}
        >
          {instalado ? "Modo App Instalada" : "Modo Navegador Web"}
        </span>
      </div>

      <div className="space-y-4">
        {/* Control Screen Wake Lock */}
        <div className="flex items-start justify-between gap-4 p-3 rounded-lg bg-slate-50 border border-slate-200/60">
          <div>
            <div className="flex items-center gap-2">
              <Sun size={15} className="text-amber-500" />
              <span className="text-xs font-bold text-slate-800">
                Mantener Pantalla Siempre Activa (Screen Wake Lock)
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Evita que el mostrador o tablet se apague automáticamente durante las horas de atención comercial.
            </p>
            {!soportado && (
              <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1">
                <AlertCircle size={12} /> Esta función no es admitida por tu navegador actual o el sistema operativo.
              </p>
            )}
          </div>
          <button
            type="button"
            disabled={!soportado}
            onClick={toggleWakeLock}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              habilitado && activo
                ? "bg-amber-400 text-slate-950 shadow-xs"
                : "bg-slate-200 text-slate-700 hover:bg-slate-300"
            }`}
          >
            {habilitado ? (activo ? "Activo" : "Reanudando...") : "Inactivo"}
          </button>
        </div>

        {/* Guía de Instalación según dispositivo */}
        {!instalado && (
          <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-200/60 text-xs text-blue-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-blue-950">
              <Download size={14} /> Cómo Instalar Ferretería Emmanuel:
            </div>
            {esIOS ? (
              <p className="text-[11px] text-blue-800">
                En Safari iOS: pulsa el botón <strong>Compartir</strong> (icono de cuadrado con flecha hacia arriba) y selecciona <strong>«Agregar al inicio»</strong>.
              </p>
            ) : (
              <p className="text-[11px] text-blue-800">
                En Chrome/Edge (Android/PC): pulsa el menú de tres puntos y selecciona <strong>«Instalar Ferretería Emmanuel»</strong> o pulsa el icono de instalación en la barra de direcciones.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
