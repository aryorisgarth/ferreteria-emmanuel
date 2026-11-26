"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { altaAction, editarArticuloAction } from "@/app/actions";
import type { ProductoVista } from "@/lib/types";
import { CamposFormProducto } from "./CamposFormProducto";

interface ModalProductoProps {
  abierto: boolean;
  alCerrar: () => void;
  articuloEditando: ProductoVista | null;
  categoriasDisponibles: string[];
  marcasOpciones: string[];
  costoModal: number;
  setCostoModal: (costo: number) => void;
  precioModal: number;
  setPrecioModal: (precio: number) => void;
  esAdmin: boolean;
}

export function ModalProducto({
  abierto,
  alCerrar,
  articuloEditando,
  categoriasDisponibles,
  marcasOpciones,
  costoModal,
  setCostoModal,
  precioModal,
  setPrecioModal,
  esAdmin,
}: ModalProductoProps) {
  const { toast } = useToast();
  const [enviando, setEnviando] = useState(false);

  return (
    <Modal
      abierto={abierto}
      alCerrar={alCerrar}
      titulo={articuloEditando ? "Editar Artículo" : "Nuevo Artículo en Catálogo"}
      subtitulo={
        articuloEditando
          ? `Modificando código, precios y parámetros de ${articuloEditando.nombre}.`
          : "Registra un producto para venderlo en caja, cotizarlo y controlar existencias."
      }
      anchoMax="3xl"
    >
      <form
        action={async (formData) => {
          setEnviando(true);
          try {
            if (articuloEditando) {
              await editarArticuloAction(formData);
              toast.exito(`Cambios de "${articuloEditando.nombre}" guardados.`, "Artículo Actualizado");
            } else {
              await altaAction(formData);
              toast.exito("Nuevo artículo registrado en el catálogo.", "Artículo Creado");
            }
            alCerrar();
          } catch (err: any) {
            toast.error(err?.message || "Ocurrió un error al guardar el artículo.", "Error");
          } finally {
            setEnviando(false);
          }
        }}
        className="space-y-4"
      >
        <CamposFormProducto
          articuloEditando={articuloEditando}
          categoriasDisponibles={categoriasDisponibles}
          marcasOpciones={marcasOpciones}
          costoModal={costoModal}
          setCostoModal={setCostoModal}
          precioModal={precioModal}
          setPrecioModal={setPrecioModal}
          esAdmin={esAdmin}
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
            disabled={enviando}
            className="btn btn-amarillo h-10 px-5 text-xs font-bold shadow-xs disabled:opacity-50"
          >
            {enviando ? "Guardando..." : articuloEditando ? "Guardar Cambios" : "Dar de Alta Artículo"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
