"use client";

import { useActionState, useState } from "react";
import { AlertCircle, ChevronRight, Eye, EyeOff, Lock, User } from "lucide-react";
import { loginAction } from "@/app/actions";
import { Logo } from "@/components/marca/Logo";

interface Props {
  volverUrl?: string;
  errorInicial?: string;
  onOcultar: () => void;
  onAbrirRecuperacion: () => void;
}

export function PanelFormularioLogin({
  volverUrl = "/inicio",
  errorInicial,
  onOcultar,
  onAbrirRecuperacion,
}: Props) {
  const [estado, formAction, pendiente] = useActionState(loginAction, null);
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [mostrarClave, setMostrarClave] = useState(false);
  const [recordar, setRecordar] = useState(false);
  const errorMostrar = estado?.error || errorInicial;

  return (
    <div className="relative flex flex-col justify-between w-full h-full bg-white border-l border-slate-200 text-slate-800 shadow-2xl overflow-y-auto">
      {/* Cabecera superior: solo flecha para ocultar */}
      <div className="flex items-center justify-between px-6 pt-[max(0.85rem,env(safe-area-inset-top,0px))] pb-3 border-b border-slate-100/90 bg-white sticky top-0 z-10">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Acceso al Sistema</span>
        <button
          type="button"
          onClick={onOcultar}
          title="Ocultar formulario y ver maqueta"
          aria-label="Ocultar formulario"
          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition cursor-pointer"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Formulario centrado con logo grande en medio */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-[460px] space-y-6">
          <div className="flex justify-center">
            <Logo variante="color" className="h-12 sm:h-14 w-auto" prioridad />
          </div>

          <div className="space-y-1 text-center">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Iniciar Sesión</h2>
            <p className="text-xs sm:text-sm text-slate-500">Ingresa tus credenciales autorizadas.</p>
          </div>

          {errorMostrar && (
            <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-800">
              <AlertCircle size={16} className="shrink-0 text-rose-600 mt-0.5" />
              <div className="flex-1 font-medium">{errorMostrar}</div>
            </div>
          )}

          <form action={formAction} className="space-y-4">
            <input type="hidden" name="volver" value={volverUrl} />
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Usuario <span className="text-amber-500">*</span>
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <input
                  type="text"
                  name="usuario"
                  required
                  autoFocus
                  autoComplete="username"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  placeholder="Ingresa tu usuario"
                  className="h-11 w-full rounded-xl border border-slate-300 bg-slate-50/60 pl-10 pr-4 text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Contraseña <span className="text-amber-500">*</span>
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <input
                  type={mostrarClave ? "text" : "password"}
                  name="clave"
                  required
                  autoComplete="current-password"
                  value={clave}
                  onChange={(e) => setClave(e.target.value)}
                  placeholder="Ingresa tu contraseña"
                  className="h-11 w-full rounded-xl border border-slate-300 bg-slate-50/60 pl-10 pr-11 text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setMostrarClave(!mostrarClave)}
                  aria-label={mostrarClave ? "Ocultar contraseña" : "Ver contraseña"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {mostrarClave ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  name="recordar"
                  checked={recordar}
                  onChange={(e) => setRecordar(e.target.checked)}
                  className="rounded border-slate-300 text-amber-500 focus:ring-amber-400 h-4 w-4"
                />
                Recordar 30 días
              </label>
              <button
                type="button"
                onClick={onAbrirRecuperacion}
                className="font-bold text-slate-700 hover:text-amber-600 hover:underline cursor-pointer"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <button
              type="submit"
              disabled={pendiente}
              className="w-full h-11 sm:h-12 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm shadow-md shadow-amber-400/20 disabled:opacity-50 transition active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
            >
              {pendiente ? "Verificando..." : "Ingresar al Sistema"}
            </button>
          </form>
        </div>
      </div>

      {/* Pie institucional */}
      <div className="py-3 px-6 border-t border-slate-100 text-center text-[11px] text-slate-400">
        Ferretería Emmanuel · Gestión Integral
      </div>
    </div>
  );
}
