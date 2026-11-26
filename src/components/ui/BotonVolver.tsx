"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface Props {
  rutaPorDefecto?: string;
  texto?: string;
  className?: string;
}

export function BotonVolver({
  rutaPorDefecto = "/inicio",
  texto = "Volver",
  className = "",
}: Props) {
  const router = useRouter();

  const handleVolver = () => {
    if (typeof window !== "undefined" && window.history.length > 2) {
      router.back();
    } else {
      router.push(rutaPorDefecto);
    }
  };

  return (
    <button
      type="button"
      onClick={handleVolver}
      title="Regresar a la pantalla anterior"
      aria-label="Regresar"
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer select-none ${className}`}
    >
      <ArrowLeft size={15} className="shrink-0" />
      <span className="hidden sm:inline">{texto}</span>
    </button>
  );
}
