import { Aviso, PageDocument } from "@/components/documentos/Pieza";
import { InventarioCrud } from "@/components/crud/InventarioCrud";
import * as api from "@/lib/inventory/api";
import { obtenerSesionActual } from "@/lib/auth";

export const metadata = { title: "Inventario" };

export default async function Inventario({
  searchParams,
}: {
  searchParams: Promise<{
    aviso?: string;
    error?: string;
    tab?: string;
    page?: string;
    q?: string;
    categoria?: string;
    marca?: string;
    estado?: "TODOS" | "ACTIVOS" | "INACTIVOS";
    stockBajo?: string;
  }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page || 1));
  const q = sp.q || "";
  const categoria = sp.categoria || "TODAS";
  const marca = sp.marca || "TODAS";
  const estado = sp.estado || "TODOS";
  const soloStockBajo = sp.stockBajo === "true";
  const tab = sp.tab || "productos";

  const [hojaInventario, categorias, marcas, ajustesRes, conteosRes, sesionRes] = await Promise.all([
    api.inventarioPaginado({
      page,
      limit: 50,
      q,
      categoria,
      marca,
      estado,
      soloStockBajo,
    }),
    api.categorias().catch(() => [
      "Ferretería General",
      "Herramientas",
      "Fontanería",
      "Material Eléctrico",
      "Pinturas y Adhesivos",
      "Construcción",
      "Tornillería y Fijaciones",
    ]),
    api.marcas().catch(() => [
      "Truper",
      "Pretul",
      "Stanley",
      "DeWalt",
      "Makita",
      "Bosch",
      "Amanco",
      "Durman",
      "Holcim",
      "Cemento Canal",
      "Sur Química",
      "Corona",
      "Sika",
      "Bellota",
      "Bticino",
      "Genérica",
    ]),
    api.ajustes().catch(() => ({ rows: [] })),
    api.conteos().catch(() => ({ rows: [] })),
    obtenerSesionActual(),
  ]);

  const sesion = sesionRes;
  const esAdmin = sesion?.rol === "ADMINISTRADOR";

  // Privacidad Comercial: Sanitize data for non-administrators
  const productosSeguros = esAdmin
    ? hojaInventario.rows
    : hojaInventario.rows.map((p) => ({
        ...p,
        costo: 0,
      }));

  const metricasSeguras = hojaInventario.metricas
    ? {
        ...hojaInventario.metricas,
        valorInventario: esAdmin ? hojaInventario.metricas.valorInventario : 0,
      }
    : undefined;

  return (
    <PageDocument seccion="Bodega & Mostrador" titulo="Catálogo e Inventario de Mercadería" anchoCompleto={true}>
      {sp.aviso ? <Aviso tono="azul">{sp.aviso}</Aviso> : null}
      {sp.error ? <Aviso tono="rojo">{sp.error}</Aviso> : null}
      <InventarioCrud
        productosIniciales={productosSeguros}
        paginacionServidor={{
          total: hojaInventario.total,
          totalPaginas: hojaInventario.pages,
          paginaActual: hojaInventario.page,
        }}
        metricasServidor={metricasSeguras}
        filtrosServidor={{
          q,
          categoria,
          marca,
          estado,
          soloStockBajo,
        }}
        categoriasDisponibles={categorias}
        marcasDisponibles={marcas}
        ajustesIniciales={ajustesRes.rows}
        conteosIniciales={conteosRes.rows}
        tabInicial={tab}
        esAdmin={esAdmin}
      />
    </PageDocument>
  );
}
