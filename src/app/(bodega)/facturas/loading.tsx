import { Skeleton, SkeletonHeader, SkeletonTable } from "@/components/ui/Skeleton";

export default function FacturasLoading() {
  return (
    <article className="w-full px-4 py-6 sm:px-6 lg:px-8 max-w-[1750px] mx-auto">
      <SkeletonHeader seccion="Ventas & Facturación" tituloAncho="w-72" />

      <div className="mt-6 space-y-6">
        {/* Filtros de facturas */}
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-10 w-80 rounded-lg" />
          <Skeleton className="h-10 w-44 rounded-lg" />
          <Skeleton className="h-10 w-40 rounded-lg" />
        </div>

        {/* Tabla de facturas emitidas */}
        <SkeletonTable columns={7} rows={8} />
      </div>
    </article>
  );
}
