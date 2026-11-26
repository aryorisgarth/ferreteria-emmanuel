import { Skeleton, SkeletonHeader, SkeletonTable } from "@/components/ui/Skeleton";

export default function ClientesLoading() {
  return (
    <article className="w-full px-4 py-6 sm:px-6 lg:px-8 max-w-[1750px] mx-auto">
      <SkeletonHeader seccion="Ventas" tituloAncho="w-64" />

      <div className="mt-6 space-y-6">
        {/* Barra de búsqueda y acciones */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Skeleton className="h-10 w-80 rounded-lg" />
          <Skeleton className="h-10 w-36 rounded-lg" />
        </div>

        {/* Directorio de Clientes */}
        <SkeletonTable columns={5} rows={7} />
      </div>
    </article>
  );
}
