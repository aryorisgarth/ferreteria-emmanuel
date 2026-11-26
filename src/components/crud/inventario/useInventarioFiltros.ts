"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce";
import type { InventarioCrudProps, TabInventario } from "./tipos";

export function useInventarioFiltros(props: InventarioCrudProps, tab: TabInventario) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const esPaginacionServidor = props.paginacionServidor !== undefined;

  const [q, setQ] = useState(props.filtrosServidor?.q ?? "");
  const debouncedQ = useDebounce(q, 300);
  const [categoriaSel, setCategoriaSel] = useState(props.filtrosServidor?.categoria ?? "TODAS");
  const [marcaSel, setMarcaSel] = useState(props.filtrosServidor?.marca ?? "TODAS");
  const [estadoSel, setEstadoSel] = useState<"TODOS" | "ACTIVOS" | "INACTIVOS">(
    props.filtrosServidor?.estado ?? "TODOS"
  );
  const [soloStockBajo, setSoloStockBajo] = useState(props.filtrosServidor?.soloStockBajo ?? false);
  const [paginaActualLocal, setPaginaActualLocal] = useState(1);
  const ITEMS_POR_PAGINA = 50;

  const actualizarFiltrosUrl = (nuevos: {
    q?: string;
    categoria?: string;
    marca?: string;
    estado?: "TODOS" | "ACTIVOS" | "INACTIVOS";
    soloStockBajo?: boolean;
    page?: number;
  }) => {
    if (!esPaginacionServidor) return;
    const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
    const qVal = nuevos.q !== undefined ? nuevos.q : q;
    const catVal = nuevos.categoria !== undefined ? nuevos.categoria : categoriaSel;
    const marVal = nuevos.marca !== undefined ? nuevos.marca : marcaSel;
    const estVal = nuevos.estado !== undefined ? nuevos.estado : estadoSel;
    const bajoVal = nuevos.soloStockBajo !== undefined ? nuevos.soloStockBajo : soloStockBajo;
    const pagVal = nuevos.page !== undefined ? nuevos.page : 1;

    if (qVal.trim()) params.set("q", qVal.trim()); else params.delete("q");
    if (catVal && catVal !== "TODAS") params.set("categoria", catVal); else params.delete("categoria");
    if (marVal && marVal !== "TODAS") params.set("marca", marVal); else params.delete("marca");
    if (estVal && estVal !== "TODOS") params.set("estado", estVal); else params.delete("estado");
    if (bajoVal) params.set("stockBajo", "true"); else params.delete("stockBajo");
    if (pagVal > 1) params.set("page", String(pagVal)); else params.delete("page");

    params.set("tab", tab);
    router.push(`${pathname}?${params.toString()}`);
  };

  useEffect(() => {
    if (esPaginacionServidor && debouncedQ !== (props.filtrosServidor?.q ?? "")) {
      actualizarFiltrosUrl({ q: debouncedQ, page: 1 });
    }
  }, [debouncedQ, esPaginacionServidor, props.filtrosServidor?.q]);

  const marcasOpciones = useMemo(() => {
    if (props.marcasDisponibles && props.marcasDisponibles.length > 0) return props.marcasDisponibles;
    const s = new Set<string>();
    props.productosIniciales.forEach((p) => { if (p.marca) s.add(p.marca); });
    return Array.from(s).sort();
  }, [props.marcasDisponibles, props.productosIniciales]);

  const totalArticulos = props.metricasServidor?.totalArticulos ?? props.productosIniciales.length;
  const stockBajoCount =
    props.metricasServidor?.stockBajoCount ??
    props.productosIniciales.filter((p) => p.stockActual <= p.stockMinimo).length;
  const valorInventario =
    props.metricasServidor?.valorInventario ??
    props.productosIniciales.reduce((sum, p) => sum + p.stockActual * (p.costo || p.precio * 0.7), 0);

  const filtrados = useMemo(() => {
    if (esPaginacionServidor) return props.productosIniciales;
    const t = debouncedQ.trim().toLowerCase();
    return props.productosIniciales.filter((p) => {
      const matchTexto =
        !t ||
        p.codigo.toLowerCase().includes(t) ||
        (p.codigoBarras && p.codigoBarras.toLowerCase().includes(t)) ||
        p.nombre.toLowerCase().includes(t) ||
        p.categoria.toLowerCase().includes(t) ||
        (p.marca && p.marca.toLowerCase().includes(t));
      const matchCat = categoriaSel === "TODAS" || p.categoria === categoriaSel;
      const matchMarca = marcaSel === "TODAS" || (p.marca || "Genérica") === marcaSel;
      const matchEstado =
        estadoSel === "TODOS" ||
        (estadoSel === "ACTIVOS" && p.activo !== false) ||
        (estadoSel === "INACTIVOS" && p.activo === false);
      const matchBajo = !soloStockBajo || p.stockActual <= p.stockMinimo;
      return matchTexto && matchCat && matchMarca && matchEstado && matchBajo;
    });
  }, [props.productosIniciales, debouncedQ, categoriaSel, marcaSel, estadoSel, soloStockBajo, esPaginacionServidor]);

  useEffect(() => {
    if (!esPaginacionServidor) setPaginaActualLocal(1);
  }, [debouncedQ, categoriaSel, marcaSel, estadoSel, soloStockBajo, esPaginacionServidor]);

  const totalPaginasLocal = Math.max(1, Math.ceil(filtrados.length / ITEMS_POR_PAGINA));
  const paginaValidaLocal = Math.min(Math.max(1, paginaActualLocal), totalPaginasLocal);
  const inicioPaginacionLocal = (paginaValidaLocal - 1) * ITEMS_POR_PAGINA;
  const productosPaginadosLocal = useMemo(
    () => filtrados.slice(inicioPaginacionLocal, inicioPaginacionLocal + ITEMS_POR_PAGINA),
    [filtrados, inicioPaginacionLocal, ITEMS_POR_PAGINA]
  );

  const productosVisibles = esPaginacionServidor ? props.productosIniciales : productosPaginadosLocal;
  const totalArticulosFiltrados = esPaginacionServidor
    ? (props.paginacionServidor?.total ?? props.productosIniciales.length)
    : filtrados.length;
  const totalPaginas = esPaginacionServidor ? (props.paginacionServidor?.totalPaginas ?? 1) : totalPaginasLocal;
  const paginaActual = esPaginacionServidor ? (props.paginacionServidor?.paginaActual ?? 1) : paginaValidaLocal;
  const inicioPaginacion = (paginaActual - 1) * ITEMS_POR_PAGINA;

  return {
    q, setQ, categoriaSel, setCategoriaSel, marcaSel, setMarcaSel, estadoSel, setEstadoSel,
    soloStockBajo, setSoloStockBajo, paginaActualLocal, setPaginaActualLocal, actualizarFiltrosUrl,
    marcasOpciones, totalArticulos, stockBajoCount, valorInventario, productosVisibles,
    totalArticulosFiltrados, totalPaginas, paginaActual, inicioPaginacion, ITEMS_POR_PAGINA,
    esPaginacionServidor,
  };
}
