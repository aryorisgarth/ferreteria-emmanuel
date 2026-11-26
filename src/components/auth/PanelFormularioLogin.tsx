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
  const [recordar, setRecordar] = useState(true);

  const errorMostrar = estado?.error || errorInicial;

  return (
    <div className="relative flex flex-col justify-between w-full h-full p-6 sm:p-10 bg-slate-900 border-l border-slate-800 text-white shadow-2xl overflow-y-auto">
      {/* Botón retráctil superior */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
        <Logo variante="light" className="h-9 w-auto" prioridad />
        <button
          type="button"
          onClick={onOcultar}
          title="Ocultar panel y ver maqueta"
          aria-label="Ocultar panel"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 border border-slate-700/80 transition text-xs font-semibold group cursor-pointer"
        >
          <span className="hidden sm:inline">Ver maqueta</span>
          <ChevronRight size={18} className="transition group-hover:translate-x-0.5" />
        </button>
      </div>

      {/* Formulario limpio sin demos */}
      <div className="w-full max-w-sm mx-auto my-auto py-6 space-y-6">
        <div>
          <span className="text-[11px] font-bold tracking-wider uppercase text-amber-400">Portal Corporativo</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1">Iniciar Sesión</h2>
          <p className="text-xs sm:text-sm text-slate-400">Acceso seguro para personal autorizado.</p>
        </div>

        {errorMostrar && (
          <div className="flex items-start gap-3 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3.5 text-xs text-rose-300 animate-in fade-in">
            <AlertCircle size={18} className="shrink-0 text-rose-400 mt-0.5" />
            <div className="flex-1 font-medium leading-relaxed">{errorMostrar}</div>
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="volver" value={volverUrl} />
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Usuario <span className="text-amber-400">*</span>
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
                className="h-11 w-full rounded-xl border border-slate-700 bg-slate-800/80 pl-10 pr-4 text-sm font-semibold text-white placeholder-slate-500 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Contraseña <span className="text-amber-400">*</span>
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
                className="h-11 w-full rounded-xl border border-slate-700 bg-slate-800/80 pl-10 pr-11 text-sm text-white placeholder-slate-500 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setMostrarClave(!mostrarClave)}
                aria-label={mostrarClave ? "Ocultar contraseña" : "Ver contraseña"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
              >
                {mostrarClave ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer font-medium">
              <input
                type="checkbox"
                name="recordar"
                checked={recordar}
                onChange={(e) => setRecordar(e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-amber-400 h-4 w-4"
              />
              Recordar 30 días
            </label>
            <button
              type="button"
              onClick={onAbrirRecuperacion}
              className="font-bold text-amber-400 hover:text-amber-300 hover:underline cursor-pointer"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <button
            type="submit"
            disabled={pendiente}
            className="w-full h-12 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 disabled:opacity-50 transition active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
          >
            {pendiente ? "Verificando..." : "Ingresar al Sistema"}
          </button>
        </form>
      </div>

      <div className="pt-4 border-t border-slate-800/80 text-center text-[11px] text-slate-400">
        Ferretería Emmanuel · Gestión Segura
      </div>
    </div>
  );
}
