import { Logo, MarcaAguaImpresion } from "@/components/marca/Logo";
import { INSTITUCION } from "@/lib/nav";

interface EmpresaInfo {
  nombre?: string;
  bodega?: string;
  ruc?: string;
  direccion?: string;
  telefono?: string;
  correo?: string;
}

export function Membrete({
  titulo,
  correlativo,
  children,
  variante = "quote",
  empresa,
}: {
  titulo: string;
  correlativo: string;
  children: React.ReactNode;
  variante?: "quote" | "invoice";
  empresa?: EmpresaInfo;
}) {
  const datos = {
    nombre: empresa?.nombre || INSTITUCION.nombre,
    ruc: empresa?.ruc || INSTITUCION.ruc,
    direccion: empresa?.direccion || INSTITUCION.direccion,
    telefono: empresa?.telefono || INSTITUCION.telefono,
    correo: empresa?.correo || INSTITUCION.correo,
  };

  return (
    <section className="papel hoja-vertical relative rounded-[6px] border border-slate-200 bg-white p-6 shadow-2xs sm:p-8 overflow-hidden print:p-0 print:m-0 print:border-none print:shadow-none print:rounded-none print:overflow-visible">
      {/* Marca de agua institucional semitransparente activa en pantalla e impresión */}
      <MarcaAguaImpresion orientacion="vertical" />
      <div className="relative z-10 w-full">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-3 print:pb-2.5">
          <div>
            <Logo variante="color" stacked={variante === "invoice"} compacto />
            <div className="mt-2 text-xs leading-snug text-slate-500 print:text-[11px] print:leading-tight">
              <p className="font-bold text-slate-900 text-sm print:text-xs">{datos.nombre}</p>
              {datos.ruc && <p className="font-mono font-semibold text-slate-700">RUC: {datos.ruc}</p>}
              <p>{datos.direccion}</p>
              <p>Tel: {datos.telefono} · Correo: {datos.correo}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 print:text-[10px]">{titulo}</p>
            <p className="mt-0.5 text-2xl font-extrabold tracking-tight font-mono text-slate-900 print:text-xl">{correlativo}</p>
          </div>
        </div>
        <div className="pt-3 print:pt-2.5">{children}</div>
      </div>
    </section>
  );
}
