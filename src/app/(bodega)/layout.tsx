import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BottomNav } from "@/components/layout/BottomNav";
import { Navbar } from "@/components/layout/Navbar";
import * as api from "@/lib/inventory/api";

export const dynamic = "force-dynamic";

export default async function BodegaLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const usuario = jar.get("fe_usuario")?.value;
  if (!usuario) redirect("/");

  let alertas = { stockBajo: 0, porCobrar: 0 };
  try {
    const res = await api.resumen();
    alertas = {
      stockBajo: res.stockBajo?.length ?? 0,
      porCobrar: res.porCobrar ?? 0,
    };
  } catch {
    // Si falla el resumen, mantenemos valores por defecto
  }

  return (
    <div className="h-dvh max-h-dvh w-full max-w-full grid grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden bg-[#F8FAFC]">
      {/* 1. HEADER: permanente, siempre visible */}
      <Navbar usuario={usuario} alertas={alertas} />

      {/* 2. MAIN: único contenedor principal con desplazamiento vertical */}
      <main className="min-h-0 min-w-0 w-full overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]">
        {children}
      </main>

      {/* 3. BOTTOM NAV: permanente en móviles, siempre visible */}
      <BottomNav />
    </div>
  );
}
