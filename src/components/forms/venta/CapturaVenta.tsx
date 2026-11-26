"use client";

import { useState } from "react";
import { dinero, etiquetaUnidad } from "@/lib/format";
import type { OpcionVenta } from "./tipos";

export function CapturaVenta({ catalogo }: { catalogo: OpcionVenta[] }) {
  const primero = catalogo[0];
  const [filas, setFilas] = useState([
    { productoId: primero?.id ?? "", cantidad: 1, precio: primero?.precio ?? 0, observacion: "" },
  ]);

  const payload = filas
    .filter((fila) => fila.productoId && fila.cantidad > 0)
    .map((fila) => ({
      productoId: fila.productoId,
      cantidad: fila.cantidad,
      precio: fila.precio,
      observacion: fila.observacion,
    }));

  return (
    <div className="space-y-3">
      <input type="hidden" name="items" value={JSON.stringify(payload)} />
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="tabla w-full min-w-[500px]">
          <thead>
            <tr>
              <th>Artículo</th>
              <th>Stock</th>
              <th>Cantidad</th>
              <th>Costo Unit.</th>
              <th>Importe</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filas.map((fila, indice) => {
              const producto = catalogo.find((item) => item.id === fila.productoId);
              const importe = fila.cantidad * fila.precio;
              return (
                <tr key={indice}>
                  <td>
                    <select
                      className="campo"
                      value={fila.productoId}
                      onChange={(event) => {
                        const elegido = catalogo.find((item) => item.id === event.target.value);
                        setFilas((prev) =>
                          prev.map((f, i) =>
                            i === indice
                              ? { ...f, productoId: event.target.value, precio: elegido?.precio ?? 0 }
                              : f
                          )
                        );
                      }}
                    >
                      {catalogo.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.codigo} · {item.nombre}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-neutral-500">
                      {producto ? etiquetaUnidad(producto.unidadMedida) : ""}
                    </p>
                  </td>
                  <td>{producto ? producto.stockActual : "—"}</td>
                  <td>
                    <input
                      className="campo w-24"
                      type="number"
                      step="any"
                      min="1"
                      value={fila.cantidad}
                      onChange={(event) =>
                        setFilas((prev) =>
                          prev.map((f, i) =>
                            i === indice ? { ...f, cantidad: Number(event.target.value) } : f
                          )
                        )
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="campo w-28"
                      type="number"
                      step="any"
                      value={fila.precio}
                      onChange={(event) =>
                        setFilas((prev) =>
                          prev.map((f, i) =>
                            i === indice ? { ...f, precio: Number(event.target.value) } : f
                          )
                        )
                      }
                    />
                  </td>
                  <td className="font-mono font-bold text-slate-800">
                    {Number.isFinite(importe) ? dinero(importe) : "—"}
                  </td>
                  <td>
                    {filas.length > 1 && (
                      <button
                        type="button"
                        className="text-xs font-semibold text-rose-600 hover:underline"
                        onClick={() => setFilas((prev) => prev.filter((_, i) => i !== indice))}
                      >
                        Quitar
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        className="btn btn-linea text-xs"
        onClick={() =>
          setFilas((actual) => [
            ...actual,
            { productoId: catalogo[0]?.id ?? "", cantidad: 1, precio: catalogo[0]?.precio ?? 0, observacion: "" },
          ])
        }
      >
        + Agregar renglón
      </button>
    </div>
  );
}
