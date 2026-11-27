"use client";

import React, { useEffect, useState } from "react";
import { Smartphone, Sun, Download, AlertCircle, Maximize2, Minimize2 } from "lucide-react";
import { useWakeLockContext } from "@/components/pwa/WakeLockProvider";
import { useFullscreen } from "@/components/pwa/useFullscreen";

type ModoPwa = "standalone" | "custom_tab" | "browser";

export function SeccionPantallaPWA() {
  const { soportado: wakeLockSoportado, activo, habilitado, toggleWakeLock } = useWakeLockContext();
  const { soportado: fullscreenSoportado, esFullscreen, alternarFullscreen } = useFullscreen();
  const [modo, setModo] = useState<ModoPwa>("browser");
  const [esIOS, setEsIOS] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const esStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        window.matchMedia("(display-mode: fullscreen)").matches ||
        (window.navigator as any).standalone === true;

      const esAndroid = /Android/i.test(navigator.userAgent);
      if (esStandalone) {
        setModo("standalone");
      } else if (esAndroid && document.referrer.startsWith("android-app://")) {
        setModo("custom_tab");
      } else {
        setModo("browser");
      }
      setEsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
    }
  }, []);

  return (
    <div className="rounded-lg border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Smartphone size={16} className="text-slate-600" />
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Pantalla y Experiencia PWA
          </h3>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
            modo === "standalone"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : modo === "custom_tab"
              ? "bg-amber-50 text-amber-700 border border-amber-200"
              : "bg-blue-50 text-blue-700 border border-blue-200"
          }`}
        >
          {modo === "standalone"
            ? "PWA Instalada (Standalone)"
            : modo === "custom_tab"
            ? "Chrome Custom Tab (Acceso Directo)"
            : "Navegador Web"}
        </span>
      </div>

      <div className="space-y-4">
        {/* Modo Pantalla Completa Inmersiva */}
        {fullscreenSoportado && (
          <div className="flex items-start justify-between gap-4 p-3 rounded-lg bg-slate-50 border border-slate-200/60">
            <div>
              <div className="flex items-center gap-2">
                <Maximize2 size={15} className="text-blue-600" />
                <span className="text-xs font-bold text-slate-800">
                  Modo Pantalla Completa Inmersiva (Ocultar Barras de Navegador)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Elimina las barras del navegador y títulos superiores en tablets (Galaxy Tab A9+, iPad) y computadoras POS.
              </p>
            </div>
            <button
              type="button"
              onClick={alternarFullscreen}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                esFullscreen
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-200 text-slate-700 hover:bg-slate-300"
              }`}
            >
              {esFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              <span>{esFullscreen ? "Salir de Fullscreen" : "Pantalla Completa"}</span>
            </button>
          </div>
        )}

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
            {!wakeLockSoportado && (
              <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1">
                <AlertCircle size={12} /> Función no admitida por tu navegador actual o el sistema operativo.
              </p>
            )}
          </div>
          <button
            type="button"
            disabled={!wakeLockSoportado}
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

        {/* Guía de Instalación y Diagnóstico de barra de navegador */}
        {modo !== "standalone" && (
          <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-200/60 text-xs text-blue-900 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-blue-950">
              <Download size={14} /> Cómo eliminar la barra de dirección y dominio en tablets:
            </div>
            {esIOS ? (
              <p className="text-[11px] text-blue-800">
                En Safari iOS: pulsa <strong>Compartir</strong> y selecciona <strong>«Agregar al inicio»</strong>.
              </p>
            ) : (
              <p className="text-[11px] text-blue-800">
                En Chrome (Galaxy Tab / Android): Para quitar la barra superior de Vercel, active <strong>Pantalla Completa</strong> (en la cabecera superior o aquí arriba), o instale la app desde el menú de tres puntos (⋮) con <strong>«Instalar aplicación»</strong>.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
