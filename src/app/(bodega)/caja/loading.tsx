import { Skeleton } from "@/components/ui/Skeleton";

export default function CajaLoading() {
  return (
    <div className="flex h-[calc(100vh-4rem)] w-full flex-col lg:flex-row overflow-hidden bg-slate-100/70">
      {/* Panel Izquierdo: Catálogo y Búsqueda */}
      <section className="flex flex-1 flex-col overflow-hidden border-r border-slate-200 bg-white p-4 lg:p-6 space-y-4">
        {/* Barra superior de búsqueda */}
        <div className="flex items-center gap-3">
          <Skeleton className="h-11 flex-1 rounded-lg" />
          <Skeleton className="h-11 w-36 rounded-lg" />
          <Skeleton className="h-11 w-28 rounded-lg" />
        </div>

        {/* Categorías pill selector */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24 shrink-0 rounded-full" />
          ))}
        </div>

        {/* Grid de productos */}
        <div className="grid flex-1 grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-2.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-full" />
              <div className="flex items-center justify-between pt-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-7 w-7 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Panel Derecho: Carrito y Totales de Cobro */}
      <section className="flex w-full flex-col border-t lg:border-t-0 lg:w-[420px] xl:w-[460px] bg-white p-4 lg:p-6 space-y-4">
        {/* Selector de Cliente */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>

        {/* Líneas del Carrito */}
        <div className="flex-1 space-y-3 overflow-y-auto rounded-lg border border-slate-100 p-3 min-h-[200px]">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="space-y-1">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-24" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-7 w-16 rounded" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          ))}
        </div>

        {/* Totales y Desglose */}
        <div className="space-y-2 border-t border-slate-200 pt-3">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-7 w-32" />
          </div>
        </div>

        {/* Botón de Cobrar */}
        <Skeleton className="h-14 w-full rounded-xl" />
      </section>
    </div>
  );
}
