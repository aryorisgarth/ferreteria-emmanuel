"use client";

import React, { useState } from "react";
import { Sliders } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export function TemaPersonalizado() {
  const [colorHex, setColorHex] = useState("#2563EB");
  const { toast } = useToast();

  const handleProbar = () => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.style.setProperty("--theme-primary", colorHex);
      root.style.setProperty("--theme-ring", `${colorHex}44`);
      toast.info(`Probando tono libre ${colorHex}.`, "Vista Previa");
    }
  };

  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/70 p-4 space-y-2.5">
      <div className="flex items-center gap-2">
        <Sliders size={16} className="text-slate-500" />
        <h4 className="text-xs font-bold text-slate-800">
          Personalización Adicional: Tono Hexadecimal Libre
        </h4>
      </div>
      <p className="text-[11px] text-slate-500 leading-relaxed">
        El motor de interfaz opera con tokens semánticos CSS (
        <code>--theme-primary</code>). Puede previsualizar un tono institucional
        específico para pruebas de contraste.
      </p>

      <div className="flex flex-wrap items-center gap-2.5 pt-1">
        <div className="flex items-center gap-2 rounded-md bg-white border border-slate-200 px-2 py-1 shadow-2xs">
          <input
            type="color"
            value={colorHex}
            onChange={(e) => setColorHex(e.target.value)}
            className="h-6 w-7 rounded border-0 cursor-pointer p-0 bg-transparent"
            title="Selector de color"
          />
          <span className="font-mono text-xs font-bold text-slate-700">
            {colorHex}
          </span>
        </div>

        <button
          type="button"
          onClick={handleProbar}
          className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
        >
          Probar Tono Libre
        </button>
      </div>
    </div>
  );
}
