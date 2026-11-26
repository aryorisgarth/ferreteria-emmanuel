import { Skeleton, SkeletonHeader, SkeletonCardsGrid, SkeletonTable } from "@/components/ui/Skeleton";

export default function CobranzaLoading() {
  return (
    <article className="w-full px-4 py-6 sm:px-6 lg:px-8 max-w-[1750px] mx-auto">
      <SkeletonHeader seccion="Finanzas & Cartera" tituloAncho="w-96" />

      <div className="mt-6 space-y-6">
        {/* Métricas de Cartera */}
        <SkeletonCardsGrid count={3} />

        {/* Pestañas: Transferencias / Cuentas por Cobrar */}
        <div className="flex gap-2 border-b border-slate-200 pb-2">
          <Skeleton className="h-10 w-48 rounded-lg" />
          <Skeleton className="h-10 w-48 rounded-lg" />
        </div>

        {/* Tabla de operaciones bancarias o cartera */}
        <SkeletonTable columns={6} rows={6} />
      </div>
    </article>
  );
}
