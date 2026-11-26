"use client";

import { CheckCircle2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { aplicarConteoFisicoAction } from "@/app/actions";
import { numero } from "@/lib/format";
import type { ConteoFisico, ProductoVista } from "@/lib/types";

interface ModalDetalleConteoProps {
  conteo: ConteoFisico | null;
  alCerrar: () => void;
  productosIniciales: ProductoVista[];
}

export function ModalDetalleConteo({
  conteo,
  alCerrar,
  productosIniciales,
}: ModalDetalleConteoProps) {
  const { toast, confirmar } = useToast();

  if (!conteo) return null;

  return (
    <Modal
      abierto={Boolean(conteo)}
      alCerrar={alCerrar}
      titulo={`Detalle de Conteo Físico: ${conteo.numero}`}
      subtitulo={`Levantado por ${conteo.usuario} el ${conteo.fecha}. Estado: ${conteo.estado}`}
      anchoMax="4xl"
    >
      <div className="space-y-4">
        {conteo.notas && (
          <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <strong>Notas:</strong> {conteo.notas}
          </p>
        )}

        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
          <div>
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="sticky top-0 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Artículo</th>
                  <th className="py-2.5 px-3 text-center">Stock Sistema</th>
                  <th className="py-2.5 px-3 text-center">Conteo Físico</th>
                  <th className="py-2.5 px-3 text-center">Diferencia</th>
                  <th className="py-2.5 px-3">Observación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {conteo.items.map((it) => {
                  const prod = productosIniciales.find((p) => p.id === it.productoId);
                  return (
                    <tr key={it.productoId} className="hover:bg-slate-50/70">
                      <td className="py-2 px-3">
                        <span className="font-mono text-slate-400 text-[11px] block">{prod?.codigo ?? "—"}</span>
                        <span className="text-slate-900 font-semibold">{prod?.nombre ?? "Artículo"}</span>
                      </td>
                      <td className="py-2 px-3 text-center font-mono text-slate-500 font-bold">
                        {numero(it.stockSistema)}
                      </td>
                      <td className="py-2 px-3 text-center font-mono text-slate-900 font-bold">
                        {numero(it.conteoFisico)}
                      </td>
                      <td className="py-2 px-3 text-center font-mono font-bold">
                        {Math.abs(it.diferencia) < 0.0001 ? (
                          <span className="text-slate-400">0</span>
                        ) : it.diferencia > 0 ? (
                          <span className="text-emerald-600">+{numero(it.diferencia)} (Sobrante)</span>
                        ) : (
                          <span className="text-rose-600">{numero(it.diferencia)} (Faltante)</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-slate-500">{it.observacion || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          <span className="text-xs text-slate-500">
            Total Renglones: <strong className="text-slate-800">{conteo.items.length}</strong>
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={alCerrar}
              className="h-10 rounded-lg px-4 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Cerrar
            </button>

            {conteo.estado === "BORRADOR" && (
              <button
                type="button"
                onClick={() => {
                  confirmar({
                    titulo: `¿Aplicar Conteo Físico ${conteo.numero}?`,
                    mensaje:
                      "Esta acción generará automáticamente los ajustes de sobrante y faltante en Kárdex para conciliar el inventario al stock físico real.",
                    textoConfirmar: "Aplicar y Conciliar Stock",
                    tono: "azul",
                    onConfirmar: async () => {
                      const formData = new FormData();
                      formData.append("conteoId", conteo.id);
                      await aplicarConteoFisicoAction(formData);
                      toast.exito(`Conteo ${conteo.numero} aplicado y conciliado exitosamente.`);
                      alCerrar();
                    },
                  });
                }}
                className="btn btn-amarillo h-10 px-5 text-xs font-bold shadow-xs gap-1.5"
              >
                <CheckCircle2 size={15} /> Aplicar Conteo Ahora
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
