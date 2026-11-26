"use client";

import { useToast } from "@/components/ui/Toast";
import { activarArticuloAction, borrarArticuloAction } from "@/app/actions";
import type { ProductoVista } from "@/lib/types";

export function useAccionesArticulo() {
  const { toast, confirmar } = useToast();

  const onActivarDesactivar = (p: ProductoVista) => {
    const estaActivo = p.activo !== false;
    confirmar({
      titulo: estaActivo ? `¿Desactivar "${p.nombre}"?` : `¿Reactivar "${p.nombre}"?`,
      mensaje: estaActivo
        ? "El artículo dejará de aparecer para ventas y cotizaciones nuevas, pero mantendrá su historial íntegro."
        : "El artículo volverá a estar disponible para cotizaciones y ventas en mostrador.",
      textoConfirmar: estaActivo ? "Desactivar" : "Reactivar",
      tono: estaActivo ? "peligro" : "azul",
      onConfirmar: async () => {
        const formData = new FormData();
        formData.append("id", p.id);
        formData.append("activo", (!estaActivo).toString());
        await activarArticuloAction(formData);
        toast.exito(estaActivo ? `Artículo "${p.nombre}" desactivado.` : `Artículo "${p.nombre}" activado.`);
      },
    });
  };

  const onEliminar = (p: ProductoVista) => {
    confirmar({
      titulo: `¿Eliminar "${p.nombre}"?`,
      mensaje: "Esta acción retirará el artículo del catálogo comercial siempre que no tenga movimientos en Kárdex ni documentos.",
      textoConfirmar: "Eliminar Artículo",
      tono: "peligro",
      onConfirmar: async () => {
        const formData = new FormData();
        formData.append("id", p.id);
        await borrarArticuloAction(formData);
        toast.exito(`Artículo "${p.nombre}" eliminado del catálogo.`);
      },
    });
  };

  return { onActivarDesactivar, onEliminar };
}
