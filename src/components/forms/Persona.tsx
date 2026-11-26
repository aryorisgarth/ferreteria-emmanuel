"use client";

import { useActionState } from "react";
import { guardarClienteAction, guardarProveedorAction } from "@/app/actions";
import type { ResultadoAccion } from "@/app/actions/helpers";
import { Aviso } from "@/components/documentos/Pieza";
import type { Persona } from "@/lib/types";

const inicial: ResultadoAccion = null;

export function FormularioPersona({
  persona,
  tipo,
}: {
  persona?: Persona;
  tipo: "cliente" | "proveedor";
}) {
  const accionBase = tipo === "cliente" ? guardarClienteAction : guardarProveedorAction;
  const [estado, accion, pendiente] = useActionState(accionBase, inicial);

  return (
    <form action={accion} className="space-y-4">
      {persona ? <input type="hidden" name="id" value={persona.id} /> : null}
      {estado?.error ? <Aviso tono="rojo">{estado.error}</Aviso> : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            {tipo === "cliente" ? "Nombre o Razón Social *" : "Empresa o Distribuidora *"}
          </label>
          <input
            className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-800 outline-none focus:border-brand-yellow"
            name="nombre"
            defaultValue={persona?.nombre}
            required
            placeholder={tipo === "cliente" ? "Ej. Constructora San José" : "Ej. Distribuidora Holcim Nicaragua"}
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            R.U.C. o Cédula (Nicaragua)
          </label>
          <input
            className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs text-slate-800 outline-none focus:border-brand-yellow font-mono"
            name="identificacion"
            defaultValue={persona?.identificacion || persona?.notas || ""}
            placeholder="J0310000000000"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Teléfono / WhatsApp
          </label>
          <input
            className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs text-slate-800 outline-none focus:border-brand-yellow font-mono"
            name="telefono"
            defaultValue={persona?.telefono}
            inputMode="tel"
            placeholder="+505 8888-0000"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Correo Electrónico
          </label>
          <input
            className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs text-slate-800 outline-none focus:border-brand-yellow"
            type="email"
            name="email"
            defaultValue={persona?.email}
            placeholder="contacto@empresa.com.ni"
          />
        </div>
      </div>

      {tipo === "cliente" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Tipo de Cliente
            </label>
            <select
              name="tipo"
              defaultValue={persona?.tipo || "PARTICULAR"}
              className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-800 outline-none focus:border-brand-yellow bg-white"
            >
              <option value="PARTICULAR">Particular / Persona Natural</option>
              <option value="EMPRESA">Empresa / Contratista Jurídico</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Límite de Crédito (C$)
            </label>
            <input
              type="number"
              step="any"
              min="0"
              name="limiteCredito"
              defaultValue={persona?.limiteCredito || ""}
              placeholder="0.00"
              className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs text-slate-800 outline-none focus:border-brand-yellow font-mono"
            />
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Persona de Contacto / Agente de Ventas
            </label>
            <input
              className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs text-slate-800 outline-none focus:border-brand-yellow"
              name="contacto"
              defaultValue={persona?.contacto}
              placeholder="Ej. Ing. Roberto Mendoza"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Días de Crédito Concedidos
            </label>
            <input
              type="number"
              min="0"
              name="diasCredito"
              defaultValue={persona?.diasCredito || ""}
              placeholder="Ej. 15, 30 o 45 días"
              className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs text-slate-800 outline-none focus:border-brand-yellow font-mono"
            />
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
          Dirección de Entrega o Fiscal
        </label>
        <input
          className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs text-slate-800 outline-none focus:border-brand-yellow"
          name="direccion"
          defaultValue={persona?.direccion}
          placeholder="Ej. Managua, de la Rotonda El Periodista 2c. al sur"
        />
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
          Observaciones / Términos Especiales
        </label>
        <textarea
          rows={2}
          className="w-full rounded-lg border border-slate-300 p-3 text-xs text-slate-800 outline-none focus:border-brand-yellow"
          name="notas"
          defaultValue={persona?.notas}
          placeholder="Notas internas, condiciones comerciales acordadas, etc."
        />
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          className="btn btn-amarillo h-10 px-6 text-xs font-bold shadow-xs disabled:opacity-50"
          disabled={pendiente}
        >
          {pendiente ? "Guardando..." : "Guardar Cambios"}
        </button>
      </div>
    </form>
  );
}
