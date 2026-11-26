import { Skeleton, SkeletonHeader, SkeletonTable } from "@/components/ui/Skeleton";

export default function InventarioLoading() {
  return (
    <article className="w-full px-4 py-6 sm:px-6 lg:px-8 max-w-[1750px] mx-auto">
      <SkeletonHeader seccion="Bodega & Mostrador" tituloAncho="w-80" />

      <div className="mt-6 space-y-6">
        {/* Pestañas de inventario */}
        <div className="flex gap-2 border-b border-slate-200 pb-2">
          <Skeleton className="h-9 w-32 rounded-lg" />
          <Skeleton className="h-9 w-36 rounded-lg" />
          <Skeleton className="h-9 w-36 rounded-lg" />
        </div>

        {/* Barra de filtros */}
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-10 w-80 rounded-lg" />
          <Skeleton className="h-10 w-44 rounded-lg" />
          <Skeleton className="h-10 w-44 rounded-lg" />
          <div className="ml-auto flex gap-2">
            <Skeleton className="h-10 w-32 rounded-lg" />
            <Skeleton className="h-10 w-36 rounded-lg" />
          </div>
        </div>

        {/* Tabla de productos */}
        <SkeletonTable columns={6} rows={8} />
      </div>
    </article>
  );
}
