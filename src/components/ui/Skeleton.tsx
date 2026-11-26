import React from "react";

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-slate-200/80 ${className}`} />;
}

export function SkeletonHeader({
  seccion = "Cargando Módulo...",
  tituloAncho = "w-64",
}: {
  seccion?: string;
  tituloAncho?: string;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200/80 pb-4">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-yellow/60">{seccion}</p>
        <div className={`mt-2 h-8 ${tituloAncho} animate-pulse rounded-lg bg-slate-200/80`} />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 w-28 rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
    </header>
  );
}

export function SkeletonCardsGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-3 w-40" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({
  columns = 5,
  rows = 6,
}: {
  columns?: number;
  rows?: number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
        <Skeleton className="h-10 w-72 rounded-lg" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="p-3.5">
                  <Skeleton className="h-4 w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r} className="hover:bg-slate-50/30">
                {Array.from({ length: columns }).map((_, c) => (
                  <td key={c} className="p-3.5">
                    <Skeleton className={`h-4 ${c === 0 ? "w-28" : c === 1 ? "w-44" : "w-16"}`} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-4 border-t border-slate-100 flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-48 rounded-lg" />
      </div>
    </div>
  );
}
