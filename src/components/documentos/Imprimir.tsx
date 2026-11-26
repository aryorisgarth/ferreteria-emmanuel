"use client";

export function BotonImprimir({ children }: { children: React.ReactNode }) {
  return (
    <button type="button" className="btn btn-azul no-print" onClick={() => window.print()}>
      {children}
    </button>
  );
}
