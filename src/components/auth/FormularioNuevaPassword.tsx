"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import {
  restablecerPasswordTokenAction,
  type ResultadoRecuperacion,
} from "@/app/actions/recuperacion.actions";

interface FormularioNuevaPasswordProps {
  token: string;
  usuario: string;
}

const inicial: ResultadoRecuperacion = null;

export function FormularioNuevaPassword({
  token,
  usuario,
}: FormularioNuevaPasswordProps) {
  const [estado, formAction, pendiente] = useActionState(
    restablecerPasswordTokenAction,
    inicial
  );
  const [mostrar, setMostrar] = useState(false);

  if (estado?.ok) {
    return (
      <div className="space-y-4 text-center py-2 animate-in fade-in">
        <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
          <CheckCircle2 size={24} />
        </div>
        <p className="text-xs text-slate-700 leading-relaxed font-semibold">
          {estado.mensaje}
        </p>
        <Link
          href="/"
          className="btn btn-amarillo w-full h-10 text-xs font-bold block text-center"
        >
          Iniciar Sesión Ahora
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />

      <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-600">
        Restableciendo acceso para: <span className="font-mono font-bold text-slate-900">@{usuario}</span>
      </div>

      {estado?.error && (
        <div className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
          <AlertCircle size={15} className="text-rose-600 shrink-0" />
          <span>{estado.error}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
          Nueva Contraseña (mínimo 6 caracteres)
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
        {pendiente ? "Actualizando..." : "Guardar Nueva Contraseña"}
      </button>
    </form>
  );
}
