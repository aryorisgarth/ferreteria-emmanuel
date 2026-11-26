"use client";

import { useActionState, useMemo, useState } from "react";
import { Logo } from "@/components/marca/Logo";
import { crearSolicitudAction } from "@/app/actions";
import type { ResultadoAccion } from "@/app/actions/helpers";
import { Aviso } from "@/components/documentos/Pieza";
import type { Oficina } from "@/lib/types";
import type { OpcionProducto } from "@/components/forms/CapturaLineas";
import { TablaArticulosSolicitudDocumento } from "./TablaArticulosSolicitudDocumento";
import type { FilaSolicitudDoc } from "./FilaArticuloSolicitudDocumento";
import { FirmasSolicitudDocumento } from "./FirmasSolicitudDocumento";

const inicial: ResultadoAccion = null;

export function FormularioSolicitudDocumento({
  catalogo,
  oficinas,
  fecha,
}: {
  catalogo: OpcionProducto[];
  oficinas: Oficina[];
  fecha: string;
}) {
  const [estado, accion, pendiente] = useActionState(crearSolicitudAction, inicial);
  const [filas, setFilas] = useState<FilaSolicitudDoc[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [desplegable, setDesplegable] = useState(false);

  const resultadosBusqueda = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return [];
    return catalogo
      .filter((p) => p.codigo.toLowerCase().includes(q) || p.nombre.toLowerCase().includes(q))
      .slice(0, 8);
  }, [catalogo, busqueda]);

  const agregarArticulo = (art: OpcionProducto) => {
    setFilas((prev) => {
      const existe = prev.find((f) => f.productoId === art.id);
      if (existe) {
        return prev.map((f) => (f.productoId === art.id ? { ...f, cantidad: f.cantidad + 1 } : f));
      }
      return [...prev, { productoId: art.id, cantidad: 1, observacion: "" }];
    });
    setBusqueda("");
    setDesplegable(false);
  };

  const actualizarFila = (i: number, delta: Partial<FilaSolicitudDoc>) => {
    setFilas((prev) => prev.map((f, idx) => (idx === i ? { ...f, ...delta } : f)));
  };

  const quitarFila = (i: number) => setFilas((prev) => prev.filter((_, idx) => idx !== i));

  const payload = filas.map((f) => ({ productoId: f.productoId, cantidad: f.cantidad, observacion: f.observacion }));

  return (
    <form action={accion} className="space-y-4">
      <input type="hidden" name="items" value={JSON.stringify(payload)} />
      <input type="hidden" name="fecha" value={fecha} />
      {estado?.error ? <Aviso tono="rojo">{estado.error}</Aviso> : null}

      <div className="bg-white rounded border border-slate-300 p-6 md:p-8 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-3.5">
          <Logo variante="color" className="h-8 sm:h-9 w-auto shrink-0" />
          <h1 className="text-sm sm:text-base font-bold text-[#1e40af] tracking-wide uppercase text-center flex-1">
            Solicitud y Entrega de Materiales
          </h1>
          <div className="font-mono text-xs font-bold text-slate-900 whitespace-nowrap">FECHA: {fecha}</div>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            <span className="font-bold text-slate-900 whitespace-nowrap">Área / Dependencia:</span>
            <select
              name="oficinaId"
              required
              className="flex-1 bg-transparent border-b border-slate-300 pb-0.5 text-xs font-bold uppercase text-slate-900 outline-none"
            >
              {oficinas.map((of) => (
                <option key={of.id} value={of.id}>
                  {of.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            <span className="font-bold text-slate-900 whitespace-nowrap">Destino:</span>
            <input
              name="destinatario"
              placeholder="Ej. Managua, Masaya, Granada o dirección de entrega / obra"
              className="flex-1 bg-transparent border-b border-slate-300 pb-0.5 text-xs text-slate-700 outline-none"
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 border-b border-slate-300 pb-2">
            <span className="font-bold text-slate-900 whitespace-nowrap">Solicitante:</span>
            <input
              name="solicitante"
              required
              placeholder="Nombre del responsable o personal que requiere..."
              className="flex-1 bg-transparent text-xs text-slate-800 font-medium outline-none"
            />
          </div>
        </div>

        <TablaArticulosSolicitudDocumento
          catalogo={catalogo}
          filas={filas}
          busqueda={busqueda}
          setBusqueda={setBusqueda}
          desplegable={desplegable}
          setDesplegable={setDesplegable}
          resultadosBusqueda={resultadosBusqueda}
          onAgregarArticulo={agregarArticulo}
          onActualizarFila={actualizarFila}
          onQuitarFila={quitarFila}
        />

        <FirmasSolicitudDocumento fecha={fecha} />

        <div className="flex justify-end pt-4 border-t border-slate-200">
          <button
            type="submit"
            disabled={pendiente || filas.length === 0}
            className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white px-7 py-2.5 rounded text-xs font-bold transition shadow-sm disabled:opacity-50"
          >
            {pendiente ? "Generando solicitud..." : "Generar y guardar solicitud"}
          </button>
        </div>
      </div>
    </form>
  );
}
