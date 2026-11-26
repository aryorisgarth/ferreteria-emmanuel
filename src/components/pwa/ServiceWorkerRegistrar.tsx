"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

export function ServiceWorkerRegistrar() {
  const [actualizacionDisponible, setActualizacionDisponible] = useState(false);
  const [workerEsperando, setWorkerEsperando] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    // Registrar el Service Worker
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        // Comprobar si hay una versión esperando
        if (reg.waiting) {
          setWorkerEsperando(reg.waiting);
          setActualizacionDisponible(true);
        }

        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                setWorkerEsperando(newWorker);
                setActualizacionDisponible(true);
              }
            });
          }
        });
      })
      .catch((err) => {
        console.warn("[PWA] Service Worker registration failed:", err);
      });

    // Escuchar cambios de controlador para recargar limpiamente sin perder datos
    let recargando = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!recargando) {
        recargando = true;
        window.location.reload();
      }
    });
  }, []);

  const aplicarActualizacion = () => {
    if (workerEsperando) {
      workerEsperando.postMessage({ type: "SKIP_WAITING" });
    }
  };

  if (!actualizacionDisponible) return null;

  return (
    <aside
      aria-label="Aviso de actualización del sistema"
      className="fixed bottom-4 right-4 z-50 max-w-sm rounded-xl bg-slate-900 border border-amber-400/40 p-4 shadow-2xl text-white animate-in slide-in-from-bottom-5"
    >
      <div className="flex items-start gap-3">
        <RefreshCw className="shrink-0 text-amber-400 animate-spin mt-0.5" size={18} />
        <div className="space-y-1">
          <p className="text-xs font-bold text-slate-100">Nueva versión disponible</p>
          <p className="text-[11px] text-slate-400">
            Se ha publicado una actualización de Ferretería Emmanuel.
          </p>
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={aplicarActualizacion}
              className="px-2.5 py-1 rounded-md bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition cursor-pointer"
            >
              Actualizar ahora
            </button>
            <button
              type="button"
              onClick={() => setActualizacionDisponible(false)}
              className="px-2 py-1 rounded-md text-slate-400 hover:text-slate-200 text-xs transition cursor-pointer"
            >
              Más tarde
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
