"use client";

import Link from "next/link";
import { Barcode, BookOpen, Edit2, Power, Trash2 } from "lucide-react";
import { dinero, etiquetaUnidad, numero } from "@/lib/format";
import type { ProductoVista } from "@/lib/types";

interface FilaProductoProps {
  p: ProductoVista;
  esAdmin: boolean;
  onEditar: (p: ProductoVista) => void;
  onActivarDesactivar: (p: ProductoVista) => void;
  onEliminar: (p: ProductoVista) => void;
}

export function FilaProducto({
  p,
  esAdmin,
  onEditar,
  onActivarDesactivar,
  onEliminar,
}: FilaProductoProps) {
  const esCritico = p.stockActual <= p.stockMinimo;
  const esAgotado = p.stockActual <= 0;
  const estaActivo = p.activo !== false;

  return (
    <tr className={`hover:bg-slate-50/80 transition-colors ${!estaActivo ? "opacity-60 bg-slate-50/40" : ""}`}>
      {/* 1. Artículo y Metadatos Lineales sin cajas */}
      <td className="py-3 px-5 sm:px-6">
        <div className="flex flex-col gap-0.5">
          <Link
            href={`/inventario/${p.id}`}
            className="font-bold text-slate-900 hover:text-amber-600 transition text-sm leading-snug"
            title="Ver detalle del artículo"
          >
            {p.nombre}
          </Link>

          {/* Fila lineal sin fondos raros: Código · Categoría · Marca · Barras */}
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-0.5 flex-wrap">
            <span className="font-mono font-bold text-slate-800">{p.codigo}</span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-700 font-semibold">{p.categoria || "General"}</span>
            {p.marca && (
              <>
                <span className="text-slate-300">·</span>
                <span className="text-slate-800 font-bold uppercase tracking-wide text-[11px]">
                  {p.marca}
                </span>
              </>
            )}
            {p.codigoBarras && (
              <>
                <span className="text-slate-300">·</span>
                <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-500">
                  <Barcode size={13} className="text-slate-400" />
                  {p.codigoBarras}
                </span>
              </>
            )}
          </div>
        </div>
      </td>

      {/* 2. Precio de Venta y Costo CPP */}
      <td className="py-3 px-4 text-right">
        <div className="font-mono font-bold text-sm text-slate-900">{dinero(p.precio)}</div>
        {esAdmin && p.costo && p.costo > 0 ? (
          <div className="text-[11px] font-mono text-slate-400 mt-0.5">
            CPP: <span className="text-slate-600">{dinero(p.costo)}</span>
          </div>
        ) : null}
      </td>

      {/* 3. Stock Disponible (Limpio, sin textos redundantes debajo) */}
      <td className="py-3 px-4 text-center">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold font-mono shadow-2xs ${
            esAgotado
              ? "bg-rose-100 text-rose-700 ring-1 ring-rose-300"
              : esCritico
              ? "bg-amber-100 text-amber-900 ring-1 ring-amber-300"
              : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${esAgotado ? "bg-rose-500" : esCritico ? "bg-amber-500" : "bg-emerald-500"}`} />
          {numero(p.stockActual)} {etiquetaUnidad(p.unidadMedida)}
        </span>
      </td>

      {/* 4. Estado */}
      <td className="py-3 px-4 text-center">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
            estaActivo ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
          }`}
        >
          {estaActivo ? "Activo" : "Inactivo"}
        </span>
      </td>

      {/* 5. Acciones con Identidad Cromática */}
      <td className="py-3 px-5 sm:px-6 text-right">
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => onEditar(p)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-400 hover:text-slate-950 transition shadow-2xs"
            title="Editar artículo"
          >
            <Edit2 size={14} />
          </button>
          <Link
            href={`/kardex?q=${encodeURIComponent(p.codigo)}`}
            title="Ver kárdex de movimientos"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-600 hover:text-white transition shadow-2xs"
          >
            <BookOpen size={14} />
          </Link>
          <button
            type="button"
            onClick={() => onActivarDesactivar(p)}
            title={estaActivo ? "Desactivar / Apagar artículo" : "Activar artículo"}
            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition shadow-2xs ${
              estaActivo
                ? "border-orange-300 bg-orange-50 text-orange-800 hover:bg-orange-500 hover:text-white"
                : "border-slate-300 bg-slate-100 text-slate-500 hover:bg-slate-700 hover:text-white"
            }`}
          >
            <Power size={14} />
          </button>
          <button
            type="button"
            onClick={() => onEliminar(p)}
            title="Eliminar del catálogo"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white transition shadow-2xs"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}
