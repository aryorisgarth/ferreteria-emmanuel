import { Skeleton, SkeletonHeader, SkeletonCardsGrid } from "@/components/ui/Skeleton";

export default function ReportesLoading() {
  return (
    <article className="w-full px-4 py-6 sm:px-6 lg:px-8 max-w-[1750px] mx-auto">
      <SkeletonHeader seccion="Inteligencia de Negocio" tituloAncho="w-72" />

      <div className="mt-6 space-y-6">
        {/* Filtros de fechas */}
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-10 w-44 rounded-lg" />
          <Skeleton className="h-10 w-44 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>

        {/* Resumen numérico */}
        <SkeletonCardsGrid count={4} />

        {/* Gráficos de tendencias y top artículos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </article>
  );
}
