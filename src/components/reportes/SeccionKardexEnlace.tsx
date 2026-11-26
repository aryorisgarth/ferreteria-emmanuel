"use client";

import Link from "next/link";
import { BookOpen, Printer } from "lucide-react";

export function SeccionKardexEnlace() {
  return (
    <div className="p-8 text-center space-y-4">
      <BookOpen size={36} className="mx-auto text-slate-400" />
      <h3 className="text-base font-bold text-slate-900">Libro Mayor Kárdex Oficial</h3>
      <p className="text-xs text-slate-500 max-w-md mx-auto">
        El Kárdex utiliza formato formal apaisado de 12 columnas oficiales con cálculo de saldo continuo y trazabilidad de comprobantes.
      </p>
      <div className="flex justify-center gap-2">
        <Link href="/kardex" className="btn btn-linea h-9 px-4 text-xs font-bold">
          Consultar Kárdex en Pantalla
        </Link>
        <Link href="/kardex/imprimir" className="btn btn-azul h-9 px-4 text-xs font-bold gap-1.5">
          <Printer size={14} /> Imprimir Kárdex Horizontal
        </Link>
      </div>
    </div>
  );
}
