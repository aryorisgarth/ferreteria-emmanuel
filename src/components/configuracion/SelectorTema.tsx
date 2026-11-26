"use client";

import React from "react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { LISTA_TEMAS, type TemaId } from "@/lib/theme";
import { useToast } from "@/components/ui/Toast";
import { TemaHeader } from "./tema/TemaHeader";
import { TemaBannerPreview } from "./tema/TemaBannerPreview";
import { TemaGrid } from "./tema/TemaGrid";
import { TemaShowcase } from "./tema/TemaShowcase";
import { TemaPersonalizado } from "./tema/TemaPersonalizado";

interface SelectorTemaProps {
  usuarioNombre?: string;
  usuarioRol?: string;
}

export function SelectorTema({ usuarioNombre }: SelectorTemaProps) {
  const {
    temaActual,
    temaPreview,
    enVistaPrevia,
    previsualizarTema,
    guardarTema,
    descartarVistaPrevia,
    restaurarPredeterminado,
    usuarioActivo,
  } = useTheme();

  const { toast } = useToast();
  const usuarioDisplay = usuarioNombre || usuarioActivo;

  const handleSeleccionar = (id: TemaId) => {
    previsualizarTema(id);
  };

  const handleGuardar = (id: TemaId) => {
    guardarTema(id);
    const nom = LISTA_TEMAS.find((t) => t.id === id)?.nombre;
    toast.exito(
      `Tema "${nom}" fijado para ${usuarioDisplay}.`,
      "Apariencia Guardada"
    );
  };

  const handleRestaurar = () => {
    restaurarPredeterminado();
    toast.aviso(
      "Se ha restablecido la apariencia institucional predeterminada.",
      "Tema Restablecido"
    );
  };

  const handleDescartar = () => {
    descartarVistaPrevia();
    toast.info("Se canceló la vista previa.", "Sin Cambios");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <TemaHeader
        temaActual={temaActual}
        usuarioDisplay={usuarioDisplay}
      />

      {enVistaPrevia && temaPreview && (
        <TemaBannerPreview
          temaPreview={temaPreview}
          usuarioDisplay={usuarioDisplay}
          onDescartar={handleDescartar}
          onGuardar={handleGuardar}
        />
      )}

      <TemaGrid
        temaActual={temaActual}
        enVistaPrevia={enVistaPrevia}
        onSeleccionar={handleSeleccionar}
        onGuardar={handleGuardar}
        onRestaurar={handleRestaurar}
      />

      <TemaShowcase temaActual={temaActual} />

      <TemaPersonalizado />
    </div>
  );
}
