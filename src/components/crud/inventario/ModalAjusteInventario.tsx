"use client";

import { useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { crearAjusteInventarioAction } from "@/app/actions";
import type { ProductoVista, TipoAjusteInventario } from "@/lib/types";
import { CamposFormAjuste } from "./CamposFormAjuste";

interface ModalAjusteInventarioProps {
  abierto: boolean;
  alCerrar: () => void;
  productosIniciales: ProductoVista[];
  ajusteProductoId: string;
  setAjusteProductoId: (id: string) => void;
  ajusteTipo: TipoAjusteInventario;
  setAjusteTipo: (t: TipoAjusteInventario) => void;
  ajusteCantidad: number;
  setAjusteCantidad: (c: number) => void;
  ajusteMotivo: string;
  setAjusteMotivo: (m: string) => void;
  ajusteCostoReferencia: number;
  setAjusteCostoReferencia: (c: number) => void;
}

export function ModalAjusteInventario({
  abierto,
  alCerrar,
  productosIniciales,
  ajusteProductoId,
  setAjusteProductoId,
  ajusteTipo,
  setAjusteTipo,
  ajusteCantidad,
  setAjusteCantidad,
  ajusteMotivo,
  setAjusteMotivo,
  ajusteCostoReferencia,
  setAjusteCostoReferencia,
}: ModalAjusteInventarioProps) {
  const { toast } = useToast();
  const [enviando, setEnviando] = useState(false);
  const [ajusteSigno, setAjusteSigno] = useState<1 | -1>(1);

  const productoSeleccionado = useMemo(
    () => productosIniciales.find((p) => p.id === ajusteProductoId),
    [productosIniciales, ajusteProductoId]
  );

  const signoEfectivo = useMemo(() => {
    if (ajusteTipo === "SOBRANTE") return 1;
    if (ajusteTipo === "FALTANTE" || ajusteTipo === "DANO" || ajusteTipo === "MERMA") return -1;
    return ajusteSigno;
  }, [ajusteTipo, ajusteSigno]);

  const stockProyectado = useMemo(() => {
    if (!productoSeleccionado) return 0;
    return productoSeleccionado.stockActual + signoEfectivo * (ajusteCantidad || 0);
  }, [productoSeleccionado, signoEfectivo, ajusteCantidad]);

  return (
    <Modal
      abierto={abierto}
      alCerrar={alCerrar}
      titulo="Registrar Ajuste de Inventario"
      subtitulo="Ingreso o deducción formal de existencias por sobrante, faltante, merma, daño o corrección."
      anchoMax="2xl"
    >
      <form
        action={async (formData) => {
          setEnviando(true);
          try {
            await crearAjusteInventarioAction(formData);
            toast.exito("Ajuste de inventario aplicado correctamente al Kárdex.");
            alCerrar();
          } catch (err: any) {
            toast.error(err?.message || "Ocurrió un error al aplicar el ajuste.", "Error de Ajuste");
          } finally {
            setEnviando(false);
          }
        }}
        className="space-y-4"
      >
        <CamposFormAjuste
          productosIniciales={productosIniciales}
          ajusteProductoId={ajusteProductoId}
          setAjusteProductoId={setAjusteProductoId}
          ajusteTipo={ajusteTipo}
          setAjusteTipo={setAjusteTipo}
          ajusteSigno={ajusteSigno}
          setAjusteSigno={setAjusteSigno}
          ajusteCantidad={ajusteCantidad}
          setAjusteCantidad={setAjusteCantidad}
          ajusteMotivo={ajusteMotivo}
          setAjusteMotivo={setAjusteMotivo}
          ajusteCostoReferencia={ajusteCostoReferencia}
          setAjusteCostoReferencia={setAjusteCostoReferencia}
          productoSeleccionado={productoSeleccionado}
          stockProyectado={stockProyectado}
          signoEfectivo={signoEfectivo}
        />

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={alCerrar}
            className="h-10 rounded-lg px-4 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={enviando || !ajusteMotivo.trim() || stockProyectado < 0}
            className="btn btn-amarillo h-10 px-5 text-xs font-bold shadow-xs disabled:opacity-50"
          >
            {enviando ? "Aplicando..." : "Confirmar y Registrar Ajuste"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
