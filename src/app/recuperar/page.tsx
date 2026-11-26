import Link from "next/link";
import type { UsuarioCuenta } from "@/lib/auth";
import { validarTokenRecuperacion } from "@/lib/auth-recovery";
import { FormularioNuevaPassword } from "@/components/auth/FormularioNuevaPassword";
import { FormularioSolicitarRecuperacion } from "@/components/auth/FormularioSolicitarRecuperacion";
import { Logo } from "@/components/marca/Logo";

export const metadata = {
  title: "Recuperar Acceso · Ferretería Emmanuel",
};

export default async function RecuperarPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const sp = await searchParams;
  const token = sp.token ? sp.token.trim() : null;

  let cuentaValida: UsuarioCuenta | null = null;
  if (token) {
    cuentaValida = await validarTokenRecuperacion(token);
  }

  return (
    <main className="min-h-dvh flex items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center bg-[#1E293B] px-3.5 py-2 rounded-xl mb-1 shadow-xs">
            <Logo variante="dark" className="h-8 w-auto" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            {token ? "Restablecer Contraseña" : "Recuperación de Acceso"}
          </h1>
          <p className="text-xs text-slate-500">
            {token
              ? "Define una nueva contraseña segura para tu cuenta."
              : "Ingresa tu usuario o correo institucional para recibir un enlace temporal."}
          </p>
        </div>

        {token ? (
          cuentaValida ? (
            <FormularioNuevaPassword token={token} usuario={cuentaValida.usuario} />
          ) : (
            <div className="space-y-4 text-center py-2">
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-900 leading-relaxed">
                El enlace de recuperación es inválido o ha expirado (validez de 15 minutos).
              </div>
              <Link
                href="/recuperar"
                className="btn btn-amarillo w-full h-10 text-xs font-bold block text-center"
              >
                Solicitar Nuevo Enlace
              </Link>
            </div>
          )
        ) : (
          <FormularioSolicitarRecuperacion />
        )}

        <div className="text-center pt-2 border-t border-slate-100">
          <Link
            href="/"
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
          >
            ← Volver al Inicio de Sesión
          </Link>
        </div>
      </div>
    </main>
  );
}
