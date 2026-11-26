"use client";

import { ModalAbrirTurno } from "./ModalAbrirTurno";
import { ModalMovimientoCaja } from "./ModalMovimientoCaja";
import { ModalCierreArqueo } from "./ModalCierreArqueo";
import type { TurnoCaja } from "@/lib/types";

interface ModalesTurnoCajaProps {
  modalTurnoAbierto: boolean;
  onCerrarTurnoModal: () => void;
  modalMovimientoAbierto: boolean;
  onCerrarMovimientoModal: () => void;
  modalCierreAbierto: boolean;
  onCerrarCierreModal: () => void;
  turno: TurnoCaja | null;
  efectivoContado: number | "";
  onCambiarEfectivoContado: (val: number | "") => void;
  notasCierre: string;
  onCambiarNotasCierre: (val: string) => void;
  efectivoEsperado: number;
  diferenciaArqueo: number | null;
  simboloMoneda: string;
}

export function ModalesTurnoCaja(props: ModalesTurnoCajaProps) {
  return (
    <>
      <ModalAbrirTurno
        abierto={props.modalTurnoAbierto}
        alCerrar={props.onCerrarTurnoModal}
        simboloMoneda={props.simboloMoneda}
      />
      <ModalMovimientoCaja
        abierto={props.modalMovimientoAbierto}
        alCerrar={props.onCerrarMovimientoModal}
        simboloMoneda={props.simboloMoneda}
      />
      <ModalCierreArqueo
        abierto={props.modalCierreAbierto}
        alCerrar={props.onCerrarCierreModal}
        turno={props.turno}
        efectivoContado={props.efectivoContado}
        onCambiarEfectivoContado={props.onCambiarEfectivoContado}
        notasCierre={props.notasCierre}
        onCambiarNotasCierre={props.onCambiarNotasCierre}
        efectivoEsperado={props.efectivoEsperado}
        diferenciaArqueo={props.diferenciaArqueo}
        simboloMoneda={props.simboloMoneda}
      />
    </>
  );
}
