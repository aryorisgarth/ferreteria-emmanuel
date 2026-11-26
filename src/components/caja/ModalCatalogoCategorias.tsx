"use client";

import { useMemo, useState } from "react";
import { Search, ShoppingCart, Tag, X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { FilaCatalogoModal } from "./FilaCatalogoModal";
import type { ProductoVista } from "@/lib/types";

interface ModalCatalogoCategoriasProps {
  abierto: boolean;
  alCerrar: () => void;
  catalogo: ProductoVista[];
  categoriaSeleccionada: string;
  simboloMoneda: string;
  onAgregarProducto: (producto: ProductoVista, cantidad: number) => void;
  onCambiarCategoria: (categoria: string) => void;
  categorias: string[];
}

export function ModalCatalogoCategorias({
  abierto,
  alCerrar,
  catalogo,
  categoriaSeleccionada,
  simboloMoneda,
  onAgregarProducto,
  onCambiarCategoria,
  categorias,
}: ModalCatalogoCategoriasProps) {
  const [busqueda, setBusqueda] = useState("");
  const [cantidades, setCantidades] = useState<Record<string, number>>({});

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return catalogo
      .filter((p) => p.activo)
      .filter((p) => {
        if (categoriaSeleccionada && categoriaSeleccionada !== "TODAS" && p.categoria !== categoriaSeleccionada) return false;
        if (!q) return true;
        return (
          p.codigo.toLowerCase().includes(q) ||
          p.nombre.toLowerCase().includes(q) ||
          (p.codigoBarras && p.codigoBarras.toLowerCase().includes(q)) ||
          (p.marca && p.marca.toLowerCase().includes(q))
        );
      });
  }, [catalogo, categoriaSeleccionada, busqueda]);

  const setCant = (id: string, val: number) => setCantidades((prev) => ({ ...prev, [id]: Math.max(1, val) }));

  return (
    <Modal
      abierto={abierto}
      alCerrar={alCerrar}
      titulo="Catálogo Maestro de Artículos"
      subtitulo="Busque o filtre por categoría para agregar artículos a la venta. Formato de lista amplia de alta legibilidad."
      anchoMax="7xl"
      sinScrollInterno={true}
    >
      {/* 1. SECCIÓN FIJA SUPERIOR: Buscador y Filtros */}
      <div className="shrink-0 p-4 bg-white border-b border-slate-200 space-y-2.5">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por código, nombre, marca o código de barras..."
            className="h-11 w-full rounded-xl border border-slate-300 bg-slate-50 pl-11 pr-11 text-sm font-semibold text-slate-900 outline-none focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-200/50 transition-all"
            autoFocus
          />
          {busqueda && (
            <button type="button" onClick={() => setBusqueda("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <button
            type="button"
            onClick={() => onCambiarCategoria("TODAS")}
            className={`h-8 px-3.5 rounded-lg text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
              categoriaSeleccionada === "TODAS" ? "bg-slate-950 text-amber-400 shadow-xs" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Tag size={13} />
            <span>Todas las Categorías</span>
          </button>
          {categorias.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => onCambiarCategoria(cat)}
              className={`h-8 px-3.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                categoriaSeleccionada === cat ? "bg-amber-400 text-slate-950 shadow-xs font-black" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 2. SECCIÓN CENTRAL: ÚNICO CONTENEDOR DE SCROLL */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-slate-50/40">
        {filtrados.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <ShoppingCart size={40} className="mx-auto mb-2 opacity-25" />
            <p className="font-bold text-sm text-slate-700">No se encontraron artículos</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse bg-white">
            <thead className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-xs border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-600 shadow-2xs">
              <tr>
                <th className="py-2.5 px-4">Código / Barras</th>
                <th className="py-2.5 px-4">Artículo y Marca</th>
                <th className="py-2.5 px-4">Categoría</th>
                <th className="py-2.5 px-4">Existencias</th>
                <th className="py-2.5 px-4">Precio Venta</th>
                <th className="py-2.5 px-4">Cantidad</th>
                <th className="py-2.5 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtrados.map((p) => (
                <FilaCatalogoModal
                  key={p.id}
                  producto={p}
                  simboloMoneda={simboloMoneda}
                  cantidad={cantidades[p.id] || 1}
                  onCambiarCantidad={(c) => setCant(p.id, c)}
                  onAgregar={onAgregarProducto}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 3. SECCIÓN FIJA INFERIOR */}
      <div className="shrink-0 flex justify-between items-center px-5 py-3.5 bg-slate-50 border-t border-slate-200 text-xs">
        <span className="text-slate-600 font-medium">Mostrando <b>{filtrados.length}</b> artículos.</span>
        <button type="button" onClick={alCerrar} className="h-9 px-5 rounded-lg border border-slate-300 bg-white font-bold text-slate-800 hover:bg-slate-100 shadow-2xs">
          Listo / Volver a Caja
        </button>
      </div>
    </Modal>
  );
}
