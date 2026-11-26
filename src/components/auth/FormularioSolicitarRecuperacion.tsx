"use client";

import { useActionState } from "react";
import { Mail, CheckCircle2 } from "lucide-react";
import {
  solicitarRecuperacionWebAction,
  type ResultadoRecuperacion,
} from "@/app/actions/recuperacion.actions";

const inicial: ResultadoRecuperacion = null;

export function FormularioSolicitarRecuperacion() {
  const [estado, formAction, pendiente] = useActionState(
    solicitarRecuperacionWebAction,
    inicial
  );

  if (estado?.ok) {
    return (
      <div className="space-y-4 text-center py-2 animate-in fade-in">
        <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
          <CheckCircle2 size={24} />
        </div>
        <p className="text-xs text-slate-700 leading-relaxed font-medium">
          {estado.mensaje}
        </p>
        <p className="text-[11px] text-slate-400">
          Por seguridad, el enlace temporal caduca en 15 minutos y es de un solo uso.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
          Usuario o Correo Institucional
        </label>
        <div className="relative">
          <Mail
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            size={16}
          />
          <input
            type="text"
            name="usuarioOEmail"
            required
            autoFocus
            placeholder="cajero o caja@ferreteriaemmanuel.com.ni"
            className="h-10 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-xs font-semibold text-slate-900 outline-none focus:border-slate-800"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={pendiente}
        className="btn btn-amarillo w-full h-11 text-xs font-bold shadow-xs disabled:opacity-50"
      >
        {pendiente ? "Verificando..." : "Enviar Enlace de Recuperación"}
      </button>
    </form>
  );
}
