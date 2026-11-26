import Link from "next/link";
import { RENGLONES_POR_HOJA } from "@/lib/format";
import type { EstadoSolicitud } from "@/lib/types";

export function PageDocument({
  seccion,
  titulo,
  folio: _folio,
  children,
  acciones,
  ancho = "libro",
  anchoCompleto = false,
}: {
  seccion: string;
  titulo: string;
  folio?: string;
  children: React.ReactNode;
  acciones?: React.ReactNode;
  ancho?: "libro" | "pliego";
  anchoCompleto?: boolean;
}) {
  return (
    <article
      className={`w-full px-4 py-5 sm:px-6 md:px-8 print:p-0 print:m-0 print:max-w-none ${
        anchoCompleto ? "max-w-none" : "max-w-[1750px] mx-auto"
      }`}
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3.5 print:hidden">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{seccion}</p>
          <h1 className="mt-0.5 text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{titulo}</h1>
        </div>
        {acciones ? <div className="no-print flex flex-wrap items-center gap-2">{acciones}</div> : null}
      </header>
      <div className="mt-5 print:mt-0">{children}</div>
    </article>
  );
}

export function Aviso({ tono, children }: { tono: "rojo" | "azul"; children: React.ReactNode }) {
  const clase =
    tono === "rojo"
      ? "bg-rose-50 border-rose-200 text-rose-800"
      : "bg-blue-50 border-blue-200 text-blue-900";
  return (
    <div className={`mb-4 rounded-md border px-3.5 py-2.5 text-xs font-medium flex items-center gap-2 ${clase}`}>
      {children}
    </div>
  );
}

export function Sello({ estado }: { estado: EstadoSolicitud }) {
  const texto = estado === "PENDIENTE_DE_REVISION" ? "Pendiente" : estado === "APROBADO" ? "Aprobado" : "Entregado";
  const color =
    estado === "APROBADO"
      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
      : estado === "PENDIENTE_DE_REVISION"
      ? "bg-amber-50 text-amber-800 border-amber-200"
      : "bg-slate-100 text-slate-700 border-slate-200";
  return (
    <span className={`inline-flex rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${color}`}>
      {texto}
    </span>
  );
}

export function Paginacion({
  page,
  pages,
  total,
  ruta,
  params,
  clave = "page",
}: {
  page: number;
  pages: number;
  total: number;
  ruta: string;
  params?: Record<string, string | undefined>;
  clave?: string;
}) {
  const href = (n: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params ?? {})) {
      if (v && k !== clave) sp.set(k, v);
    }
    sp.set(clave, String(n));
    return `${ruta}?${sp.toString()}`;
  };
  const desde = total === 0 ? 0 : (page - 1) * RENGLONES_POR_HOJA + 1;
  const hasta = Math.min(page * RENGLONES_POR_HOJA, total);
  return (
    <footer className="no-print mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
      <p className="font-mono">
        Mostrando <strong className="text-slate-800">{desde}–{hasta}</strong> de <strong className="text-slate-800">{total}</strong>
      </p>
      <p className="flex items-center gap-2">
        {page > 1 ? (
          <Link href={href(page - 1)} className="btn btn-linea min-h-8 px-2.5 text-xs">
            Anterior
          </Link>
        ) : null}
        <span className="font-mono px-1 font-semibold text-slate-700">
          {page}/{pages}
        </span>
        {page < pages ? (
          <Link href={href(page + 1)} className="btn btn-linea min-h-8 px-2.5 text-xs">
            Siguiente
          </Link>
        ) : null}
      </p>
    </footer>
  );
}

export function Firmas({ etiquetas }: { etiquetas: string[] }) {
  return (
    <div className="mt-12 grid grid-cols-3 gap-8">
      {etiquetas.map((etiqueta) => (
        <div key={etiqueta} className="pt-10 text-center">
          <div className="border-t border-slate-300 pt-2 text-[11px] uppercase tracking-[0.14em]">{etiqueta}</div>
        </div>
      ))}
    </div>
  );
}
