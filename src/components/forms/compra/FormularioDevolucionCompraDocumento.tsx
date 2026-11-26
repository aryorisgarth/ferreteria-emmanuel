"use client";

import { useActionState, useState } from "react";
import { Undo2 } from "lucide-react";
import { Logo } from "@/components/marca/Logo";
import { crearDevolucionProveedorAction } from "@/app/actions";
import type { ResultadoAccion } from "@/app/actions/helpers";
import { Aviso } from "@/components/documentos/Pieza";
import { TablaArticulosDevolucionDocumento } from "./TablaArticulosDevolucionDocumento";

const inicial: ResultadoAccion = null;

export function FormularioDevolucionCompraDocumento({
  compras,
  compraInicialId = "",
  simbolo = "C$",
  fecha,
}: {
  compras: any[];
  compraInicialId?: string;
  simbolo?: string;
  fecha: string;
}) {
  const [estado, accion, pendiente] = useActionState(crearDevolucionProveedorAction, inicial);
  const [compraId, setCompraId] = useState(compraInicialId || (compras[0]?.id || ""));

  const compraActual = compras.find((c) => c.id === compraId || c.compra?.id === compraId);
  const compraObj = compraActual?.compra || compraActual;
  const items = compraObj?.items || [];

  return (
    <form action={accion} className="space-y-4">
      {estado?.error ? <Aviso tono="rojo">{estado.error}</Aviso> : null}

      <div className="bg-white rounded border border-slate-300 p-6 md:p-8 space-y-4 shadow-2xs">
        {/* Encabezado Institucional */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-3.5">
          <Logo variante="color" className="h-8 sm:h-9 w-auto shrink-0" />
          <div className="text-center flex-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#dc2626]">
              FERRETERÍA EMMANUEL · GESTIÓN DE COMPRAS Y GARANTÍAS
            </div>
            <h1 className="text-sm sm:text-base font-bold text-[#1e40af] tracking-wide uppercase">
              Nota Oficial de Devolución de Mercancía a Proveedor
            </h1>
          </div>
          <div className="font-mono text-xs font-bold text-slate-900 whitespace-nowrap">FECHA: {fecha}</div>
        </div>

        {/* Datos de la Devolución */}
        <div className="space-y-2 text-xs">
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            <span className="font-bold text-slate-900 whitespace-nowrap">Factura / Compra Origen:</span>
            <div className="flex-1 border-b border-slate-300 pb-0.5">
              <select
                name="compraId"
                value={compraId}
                onChange={(e) => setCompraId(e.target.value)}
                required
                className="w-full bg-transparent font-medium text-slate-800 outline-none text-xs cursor-pointer"
              >
                {compras.map((c) => {
                  const item = c.compra || c;
                  return (
                    <option key={item.id} value={item.id}>
                      {item.numero} · {item.proveedor} ({item.fecha}) {item.facturaProveedor ? `· Fact: ${item.facturaProveedor}` : ""}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="flex items-center gap-2 border-b border-slate-300 pb-0.5">
              <span className="font-bold text-slate-900 whitespace-nowrap">Motivo de Devolución:</span>
              <input
                name="motivo"
                required
                placeholder="Ej. Producto defectuoso, empaque roto, garantía..."
                className="flex-1 bg-transparent text-slate-800 outline-none text-xs"
              />
            </div>
            <div className="flex items-center gap-2 border-b border-slate-300 pb-0.5">
              <span className="font-bold text-slate-900 whitespace-nowrap">No. Nota de Crédito:</span>
              <input
                name="notaCreditoProveedor"
                placeholder="Ej. NC-00912 / Remisión Proveedor"
                className="flex-1 bg-transparent text-slate-800 outline-none text-xs font-mono"
              />
            </div>
          </div>
          <input type="hidden" name="fecha" value={fecha} />
        </div>

        {/* Tabla Cuadriculada de Artículos */}
        <div className="pt-2">
          <TablaArticulosDevolucionDocumento items={items} simbolo={simbolo} />
        </div>

        {/* Firmas de Entrega y Devolución */}
        <div className="pt-8 pb-2 grid grid-cols-1 sm:grid-cols-2 gap-8 text-center text-xs">
          <div>
            <div className="border-t border-slate-800 w-52 mx-auto pt-1 font-bold text-slate-900">
              Entregado por Bodeguero
            </div>
            <div className="text-[10px] text-slate-500">Despacho & Descargo de Kárdex</div>
          </div>
          <div>
            <div className="border-t border-slate-800 w-52 mx-auto pt-1 font-bold text-slate-900">
              Recibido por Proveedor / Transportista
            </div>
            <div className="text-[10px] text-slate-500">Firma y Sello de Devolución</div>
          </div>
        </div>
      </div>

      {/* Botón de Confirmación */}
      <div className="flex justify-end gap-2">
        <button
          type="submit"
          disabled={pendiente}
          className="bg-[#dc2626] hover:bg-[#b91c1c] text-white h-10 px-6 text-xs font-bold rounded flex items-center gap-1.5 transition shadow-xs disabled:opacity-50"
        >
          <Undo2 size={15} />
          <span>{pendiente ? "Registrando Devolución..." : "Efectuar Devolución y Descargar Stock"}</span>
        </button>
      </div>
    </form>
  );
}
