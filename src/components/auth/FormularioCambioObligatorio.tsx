"use client";

import { useActionState, useState } from "react";
import { Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { cambiarPasswordObligatoriaAction } from "@/app/actions/recuperacion.actions";
import type { ResultadoAccion } from "@/app/actions/helpers";

interface FormularioCambioObligatorioProps {
  usuario: string;
}

const inicial: ResultadoAccion = null;

export function FormularioCambioObligatorio({
  usuario,
}: FormularioCambioObligatorioProps) {
  const [estado, formAction, pendiente] = useActionState(
    cambiarPasswordObligatoriaAction,
    inicial
  );
  const [mostrar, setMostrar] = useState(false);

  return (
    <form action={formAction} className="space-y-4">
      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 leading-relaxed font-semibold">
        Usuario: @{usuario} · Por seguridad, debes definir una contraseña nueva antes de operar.
      </div>

      {estado?.error && (
        <div className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
          <AlertCircle size={15} className="text-rose-600 shrink-0" />
          <span>{estado.error}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
          Nueva Contraseña Personal (mínimo 6 caracteres)
        </label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type={mostrar ? "text" : "password"}
            name="password"
            required
            minLength={6}
            placeholder="••••••••"
            className="h-10 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-10 text-xs font-semibold text-slate-900 outline-none focus:border-slate-800"
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setMostrar(!mostrar)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
          >
            {mostrar ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
          Confirmar Nueva Contraseña
        </label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type={mostrar ? "text" : "password"}
            name="confirmPassword"
            required
            minLength={6}
            placeholder="••••••••"
            className="h-10 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-10 text-xs font-semibold text-slate-900 outline-none focus:border-slate-800"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={pendiente}
        className="btn btn-amarillo w-full h-11 text-xs font-bold shadow-xs disabled:opacity-50"
      >
        {pendiente ? "Actualizando..." : "Confirmar y Continuar"}
      </button>
    </form>
  );
}
