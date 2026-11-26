import { Skeleton, SkeletonHeader, SkeletonTable } from "@/components/ui/Skeleton";

export default function CotizacionesLoading() {
  return (
    <article className="w-full px-4 py-6 sm:px-6 lg:px-8 max-w-[1750px] mx-auto">
      <SkeletonHeader seccion="Ventas" tituloAncho="w-64" />

      <div className="mt-6 space-y-6">
        {/* Filtros de estado y búsqueda */}
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-10 w-80 rounded-lg" />
          <Skeleton className="h-10 w-44 rounded-lg" />
          <div className="ml-auto flex gap-2">
            <Skeleton className="h-10 w-44 rounded-lg" />
          </div>
        </div>

        {/* Tabla de cotizaciones con versionado */}
        <SkeletonTable columns={6} rows={7} />
      </div>
    </article>
  );
}
