"use client";

import { useState } from "react";
import { etiquetaUnidad } from "@/lib/format";
import type { UnidadMedida } from "@/lib/types";

export interface OpcionProducto {
  id: string;
  codigo: string;
  nombre: string;
  unidadMedida: UnidadMedida;
  stockActual: number;
}

export function CapturaLineas({ catalogo }: { catalogo: OpcionProducto[] }) {
  const [filas, setFilas] = useState([{ productoId: catalogo[0]?.id ?? "", cantidad: "1", observacion: "" }]);
  const payload = filas
    .filter((fila) => fila.productoId && Number(fila.cantidad) > 0)
    .map((fila) => ({ productoId: fila.productoId, cantidad: Number(fila.cantidad), observacion: fila.observacion }));

  return (
    <div className="space-y-3">
      <input type="hidden" name="items" value={JSON.stringify(payload)} />
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="tabla w-full min-w-[500px]">
          <thead>
            <tr>
              <th>Artículo</th>
              <th>Unidad</th>
              <th>Cantidad</th>
              <th>Observación</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filas.map((fila, indice) => {
              const producto = catalogo.find((item) => item.id === fila.productoId);
              return (
                <tr key={indice}>
                  <td>
                    <select
                      className="campo"
                      value={fila.productoId}
                      onChange={(event) => actualizar(indice, { productoId: event.target.value })}
                    >
                      {catalogo.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.codigo} · {item.nombre}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>{producto ? etiquetaUnidad(producto.unidadMedida) : "—"}</td>
                  <td>
                    <input
                      className="campo w-24"
                      inputMode="decimal"
                      value={fila.cantidad}
                      onChange={(event) => actualizar(indice, { cantidad: event.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      className="campo"
                      value={fila.observacion}
                      onChange={(event) => actualizar(indice, { observacion: event.target.value })}
                    />
                  </td>
                  <td>
                    {filas.length > 1 ? (
                      <button type="button" className="font-body text-xs uppercase tracking-wider underline text-rose-600" onClick={() => quitar(indice)}>
                        Quitar
                      </button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        className="btn btn-linea mt-3"
        onClick={() => setFilas((actual) => [...actual, { productoId: catalogo[0]?.id ?? "", cantidad: "1", observacion: "" }])}
      >
        Agregar renglón
      </button>
    </div>
  );

  function actualizar(indice: number, cambio: Partial<(typeof filas)[number]>) {
    setFilas((actual) => actual.map((fila, i) => (i === indice ? { ...fila, ...cambio } : fila)));
  }

  function quitar(indice: number) {
    setFilas((actual) => actual.filter((_, i) => i !== indice));
  }
}
