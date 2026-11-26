import { redirect } from "next/navigation";
import { exigirSesion } from "@/lib/auth";
import { FormularioCambioObligatorio } from "@/components/auth/FormularioCambioObligatorio";
import { Logo } from "@/components/marca/Logo";

export const metadata = {
  title: "Actualización de Contraseña · Ferretería Emmanuel",
};

export default async function CambiarClaveObligatoriaPage() {
  const sesion = await exigirSesion();

  return (
    <main className="min-h-dvh flex items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center bg-[#1E293B] px-3.5 py-2 rounded-xl mb-1 shadow-xs">
            <Logo variante="dark" className="h-8 w-auto" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            Actualización Obligatoria de Contraseña
          </h1>
          <p className="text-xs text-slate-500">
            El Administrador ha restablecido tu acceso con una clave temporal. Define ahora tu contraseña personal definitiva.
          </p>
        </div>

        <FormularioCambioObligatorio usuario={sesion.usuario} />
      </div>
    </main>
  );
}
