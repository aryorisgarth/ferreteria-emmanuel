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
    <div className="min-h-screen min-h-dvh bg-[#F8FAFC] flex flex-col w-full max-w-full overflow-x-hidden">
      {/* Barra de Navegación Superior Profesional Oficial */}
      <Navbar usuario={usuario} alertas={alertas} />

      {/* Área Principal a Ancho Completo con reserva para BottomNav */}
      <main className="flex-1 w-full pb-[calc(4.75rem+env(safe-area-inset-bottom,0px))] lg:pb-12">
        {children}
      </main>

      {/* Navegación móvil inferior sólo en pantallas pequeñas */}
      <BottomNav />
    </div>
  );
}
