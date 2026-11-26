"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

export type TipoToast = "exito" | "error" | "aviso" | "info";

export interface ToastItem {
  id: string;
  tipo: TipoToast;
  mensaje: string;
  titulo?: string;
  duracionMs?: number;
}

interface ConfirmacionConfig {
  titulo: string;
  mensaje: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  tono?: "peligro" | "amarillo" | "azul";
  onConfirmar: () => void | Promise<void>;
}

interface ToastContextValue {
  toast: {
    exito: (mensaje: string, titulo?: string, duracionMs?: number) => void;
    error: (mensaje: string, titulo?: string, duracionMs?: number) => void;
    aviso: (mensaje: string, titulo?: string, duracionMs?: number) => void;
    info: (mensaje: string, titulo?: string, duracionMs?: number) => void;
  };
  confirmar: (config: ConfirmacionConfig) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast debe ser utilizado dentro de un ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmacion, setConfirmacion] = useState<ConfirmacionConfig | null>(null);
  const [procesandoConfirmacion, setProcesandoConfirmacion] = useState(false);

  const removerToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const agregarToast = useCallback(
    (tipo: TipoToast, mensaje: string, titulo?: string, duracionMs = 3500) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const nuevo: ToastItem = { id, tipo, mensaje, titulo, duracionMs };

      setToasts((prev) => [...prev, nuevo]);

      if (duracionMs > 0) {
        setTimeout(() => {
          removerToast(id);
        }, duracionMs);
      }
    },
    [removerToast],
  );

  const toast = {
    exito: (mensaje: string, titulo?: string, duracionMs?: number) =>
      agregarToast("exito", mensaje, titulo, duracionMs),
    error: (mensaje: string, titulo?: string, duracionMs?: number) =>
      agregarToast("error", mensaje, titulo, duracionMs),
    aviso: (mensaje: string, titulo?: string, duracionMs?: number) =>
      agregarToast("aviso", mensaje, titulo, duracionMs),
    info: (mensaje: string, titulo?: string, duracionMs?: number) =>
      agregarToast("info", mensaje, titulo, duracionMs),
  };

  const confirmar = useCallback((config: ConfirmacionConfig) => {
    setConfirmacion(config);
  }, []);

  const ejecutarConfirmacion = async () => {
    if (!confirmacion) return;
    setProcesandoConfirmacion(true);
    try {
      await confirmacion.onConfirmar();
    } finally {
      setProcesandoConfirmacion(false);
      setConfirmacion(null);
    }
  };

  return (
    <ToastContext.Provider value={{ toast, confirmar }}>
      {children}

      {/* Contenedor Flotante de Toasts */}
      <aside
        aria-live="polite"
        className="fixed bottom-4 right-4 z-[9999] flex max-w-sm w-full flex-col gap-2.5 pointer-events-none p-2 sm:p-0"
      >
        {toasts.map((t) => {
          const estilos = {
            exito: {
              borde: "border-emerald-300 bg-white text-emerald-950 shadow-emerald-500/10",
              icono: <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={18} />,
              colorBarra: "bg-emerald-500",
            },
            error: {
              borde: "border-rose-300 bg-white text-rose-950 shadow-rose-500/10",
              icono: <AlertCircle className="text-rose-600 shrink-0 mt-0.5" size={18} />,
              colorBarra: "bg-rose-500",
            },
            aviso: {
              borde: "border-amber-300 bg-white text-amber-950 shadow-amber-500/10",
              icono: <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />,
              colorBarra: "bg-amber-500",
            },
            info: {
              borde: "border-blue-300 bg-white text-blue-950 shadow-blue-500/10",
              icono: <Info className="text-blue-600 shrink-0 mt-0.5" size={18} />,
              colorBarra: "bg-blue-500",
            },
          }[t.tipo];

          return (
            <div
              key={t.id}
              role="alert"
              className={`pointer-events-auto relative overflow-hidden rounded-xl border p-3.5 shadow-lg transition-all animate-in slide-in-from-bottom-2 fade-in duration-200 ${estilos.borde}`}
            >
              <div className="flex items-start gap-3">
                {estilos.icono}
                <div className="flex-1 pr-2">
                  {t.titulo && (
                    <p className="text-xs font-bold uppercase tracking-wider mb-0.5">
                      {t.titulo}
                    </p>
                  )}
                  <p className="text-xs font-medium leading-relaxed">{t.mensaje}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removerToast(t.id)}
                  className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                  aria-label="Cerrar notificación"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </aside>

      {/* Modal de Confirmación Elegante (Reemplazo de confirm nativo) */}
      {confirmacion && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3.5">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                  confirmacion.tono === "peligro"
                    ? "bg-rose-100 text-rose-600"
                    : confirmacion.tono === "amarillo"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                <AlertTriangle size={22} />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  {confirmacion.titulo}
                </h3>
                <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                  {confirmacion.mensaje}
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={procesandoConfirmacion}
                onClick={() => setConfirmacion(null)}
                className="h-10 rounded-xl px-4 text-xs font-bold text-slate-700 hover:bg-slate-100 transition disabled:opacity-50"
              >
                {confirmacion.textoCancelar || "Cancelar"}
              </button>
              <button
                type="button"
                disabled={procesandoConfirmacion}
                onClick={ejecutarConfirmacion}
                className={`h-10 rounded-xl px-5 text-xs font-bold shadow-xs transition disabled:opacity-50 ${
                  confirmacion.tono === "peligro"
                    ? "bg-rose-600 text-white hover:bg-rose-700 active:scale-98"
                    : confirmacion.tono === "amarillo"
                    ? "bg-brand-yellow text-slate-950 hover:bg-amber-400 active:scale-98"
                    : "bg-slate-900 text-white hover:bg-slate-800 active:scale-98"
                }`}
              >
                {procesandoConfirmacion
                  ? "Procesando..."
                  : confirmacion.textoConfirmar || "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

