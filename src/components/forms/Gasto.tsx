"use client";

import { useActionState } from "react";
import { guardarGastoAction } from "@/app/actions";
import type { ResultadoAccion } from "@/app/actions/helpers";
import { Aviso } from "@/components/documentos/Pieza";
import type { Gasto } from "@/lib/types";

const inicial: ResultadoAccion = null;

export function FormularioGasto({ gasto, fecha }: { gasto?: Gasto; fecha: string }) {
  const [estado, accion, pendiente] = useActionState(guardarGastoAction, inicial);
  return (
    <form action={accion} className="card space-y-4 p-5">
      {gasto ? <input type="hidden" name="id" value={gasto.id} /> : null}
      {estado?.error ? <Aviso tono="rojo">{estado.error}</Aviso> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="etiqueta">Concepto</span>
          <input className="campo" name="concepto" defaultValue={gasto?.concepto} placeholder="Luz, flete, almuerzo…" required />
        </label>
        <label>
          <span className="etiqueta">Monto</span>
          <input className="campo" name="monto" inputMode="decimal" defaultValue={gasto?.monto ?? ""} required />
        </label>
        <label>
          <span className="etiqueta">Fecha</span>
          <input className="campo" type="date" name="fecha" defaultValue={gasto?.fecha ?? fecha} required />
        </label>
        <label>
          <span className="etiqueta">Rubro</span>
          <input className="campo" name="categoria" list="gastos-cat" defaultValue={gasto?.categoria ?? "General"} />
          <datalist id="gastos-cat">
            <option value="Servicios" />
            <option value="Transporte" />
            <option value="Planilla" />
            <option value="Alquiler" />
            <option value="General" />
          </datalist>
        </label>
      </div>
      <label>
        <span className="etiqueta">Notas</span>
        <input className="campo" name="notas" defaultValue={gasto?.notas} />
      </label>
      <button className="btn btn-navy" disabled={pendiente}>
        {pendiente ? "Guardando…" : "Registrar gasto"}
      </button>
    </form>
  );
}
