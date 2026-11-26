"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  abierto: boolean;
  alCerrar: () => void;
  titulo: string;
  subtitulo?: string;
  children: React.ReactNode;
  anchoMax?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl" | "full";
  sinScrollInterno?: boolean;
}

export function Modal({
  abierto,
  alCerrar,
  titulo,
  subtitulo,
  children,
  anchoMax = "lg",
  sinScrollInterno = false,
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && abierto) {
        alCerrar();
      }
    };
    if (abierto) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [abierto, alCerrar]);

  if (!abierto) return null;

  const maxWidthClass = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
    "6xl": "max-w-6xl",
    "7xl": "max-w-7xl",
    full: "max-w-[96vw] w-[96vw]",
  }[anchoMax];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden">
      {/* Backdrop oscuro con desenfoque suave */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={alCerrar}
      />

      {/* Contenedor del Modal con altura controlada y SIN doble scroll externo */}
      <div
        className={`relative z-10 flex flex-col w-full ${maxWidthClass} max-h-[92vh] rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl transition-all overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera fija que nunca se oculta */}
        <div className="shrink-0 flex items-center justify-between border-b border-slate-100 bg-slate-50/90 px-6 py-4">
          <div className="pr-4">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-snug">
              {titulo}
            </h3>
            {subtitulo && (
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5 leading-normal">
                {subtitulo}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={alCerrar}
            className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200/80 hover:text-slate-700 transition"
            title="Cerrar modal (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Cuerpo: si sinScrollInterno es true, no agrega scroll redundante ni padding forzado */}
        {sinScrollInterno ? (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden text-slate-800">
            {children}
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 text-slate-800">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
