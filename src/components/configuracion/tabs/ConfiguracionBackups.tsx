"use client";

import { Database, Download, RefreshCw } from "lucide-react";
import { BotonRestaurar } from "@/components/forms/BotonRestaurar";

export function ConfiguracionBackups() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 font-bold">
            <Database size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Copias de Seguridad (Backups)</h3>
            <p className="text-xs text-slate-500">Descarga y resguarda toda tu base de datos.</p>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Puedes descargar un archivo JSON completo con todos los artículos, existencias, clientes, proveedores, cotizaciones, facturas y registros de kárdex para tener tu copia local segura.
        </p>

        <a
          href="/api/respaldo"
          download
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 text-white p-3 text-xs font-bold hover:bg-slate-800 transition shadow-xs active:scale-98"
        >
          <Download size={16} className="text-brand-yellow" />
          Descargar Copia de Seguridad JSON Oficial
        </a>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 font-bold">
            <RefreshCw size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Restauración de Demostración</h3>
            <p className="text-xs text-slate-500">Reiniciar datos de prueba iniciales.</p>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Si estás realizando pruebas y deseas volver a cargar el catálogo de prueba con herramientas, fontanería y materiales preconfigurados:
        </p>

        <BotonRestaurar />
      </div>
    </div>
  );
}
