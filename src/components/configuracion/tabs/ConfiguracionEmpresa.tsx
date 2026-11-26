"use client";

import { Save } from "lucide-react";
import { HouseMark } from "@/components/marca/Logo";
import { guardarConfiguracionGeneralAction } from "@/app/actions";
import type { ConfiguracionSistema } from "@/lib/config";

interface ConfiguracionEmpresaProps {
  empresa: ConfiguracionSistema["empresa"];
}

export function ConfiguracionEmpresa({ empresa }: ConfiguracionEmpresaProps) {
  return (
    <form action={guardarConfiguracionGeneralAction} className="space-y-6">
      <input type="hidden" name="seccion" value="empresa" />

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h3 className="text-base font-bold text-slate-900">Identidad Comercial y Fiscal</h3>
            <p className="text-xs text-slate-500">
              Aparece en el encabezado de facturas, cotizaciones y comprobantes impresos.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800">
            <HouseMark variante={empresa.logoVariante || "light"} className="h-8 w-auto" />
            <div className="text-left leading-none">
              <p className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">FERRETERÍA</p>
              <p className="text-sm font-extrabold text-brand-bright tracking-wide">EMMANUEL</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Nombre Comercial del Negocio <span className="text-amber-500">*</span>
            </label>
            <input type="text" name="nombre" required defaultValue={empresa.nombre} className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm font-bold text-slate-800 outline-none focus:border-brand-yellow focus:bg-white" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Bodega / Sucursal Principal
            </label>
            <input type="text" name="bodega" defaultValue={empresa.bodega} className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm font-semibold text-slate-800 outline-none focus:border-brand-yellow focus:bg-white" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              R.U.C. (Nicaragua) <span className="text-amber-500">*</span>
            </label>
            <input type="text" name="ruc" required defaultValue={empresa.ruc} placeholder="Ej. J0310000000000" className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm font-mono font-bold text-slate-800 outline-none focus:border-brand-yellow focus:bg-white" />
            <span className="text-[10px] text-slate-400 mt-0.5 block">Registro Único del Contribuyente para facturación legal</span>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Lema / Eslogan Comercial
            </label>
            <input type="text" name="lema" defaultValue={empresa.lema} placeholder="Ej. Materiales de Calidad y Confianza" className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm text-slate-800 outline-none focus:border-brand-yellow focus:bg-white" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Teléfono(s) / WhatsApp de Mostrador
            </label>
            <input type="text" name="telefono" defaultValue={empresa.telefono} placeholder="+505 8888-9999 / 2222-3333" className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm font-mono text-slate-800 outline-none focus:border-brand-yellow focus:bg-white" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Correo Electrónico de Facturación
            </label>
            <input type="email" name="correo" defaultValue={empresa.correo} placeholder="ventas@ferreteria.com" className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm text-slate-800 outline-none focus:border-brand-yellow focus:bg-white" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
            Dirección Física Completa (Ciudad y Departamento)
          </label>
          <input
            type="text"
            name="direccion"
            defaultValue={empresa.direccion}
            placeholder="Ej. Managua, Nicaragua - Pista Jean Paul Genie 1c. al lago"
            className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm text-slate-800 outline-none focus:border-brand-yellow focus:bg-white"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
            Leyenda al Pie de Facturas, Tickets y Términos de Garantía
          </label>
          <textarea
            name="pieFactura"
            rows={2}
            defaultValue={empresa.pieFactura}
            placeholder="¡Gracias por su compra! Revise su mercadería antes de salir..."
            className="w-full rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm text-slate-800 outline-none focus:border-brand-yellow focus:bg-white"
          />
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <span className="text-xs text-slate-400 font-medium">
            Los cambios se reflejarán inmediatamente en las impresiones.
          </span>
          <button type="submit" className="btn btn-amarillo h-10 px-5 text-xs font-bold gap-2 shadow-xs">
            <Save size={16} />
            Guardar Datos de Empresa
          </button>
        </div>
      </div>
    </form>
  );
}
