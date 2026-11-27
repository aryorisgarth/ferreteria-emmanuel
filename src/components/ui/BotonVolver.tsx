"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface Props {
  rutaPorDefecto?: string;
  className?: string;
}

export function BotonVolver({
  rutaPorDefecto = "/inicio",
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
      title="Regresar"
      aria-label="Regresar"
      className={`h-9 w-9 rounded-xl border border-slate-200/90 bg-white/95 hover:bg-slate-100 hover:border-slate-300 text-slate-700 hover:text-slate-900 shadow-2xs flex items-center justify-center transition-all duration-150 active:scale-[0.94] cursor-pointer shrink-0 select-none ${className}`}
    >
      <ArrowLeft size={18} className="shrink-0" />
    </button>
  );
}
