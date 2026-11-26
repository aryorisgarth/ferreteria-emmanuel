"use client";

import { useState } from "react";

export function useModalesCaja(ticketExitosoInicial: any) {
  const [modalCategorias, setModalCategorias] = useState(false);
  const [modalCotizaciones, setModalCotizaciones] = useState(false);
  const [modalCobro, setModalCobro] = useState(false);
  const [modalTicket, setModalTicket] = useState(Boolean(ticketExitosoInicial));
  const [modalTurno, setModalTurno] = useState(false);
  const [modalCierre, setModalCierre] = useState(false);
  const [modalMovimiento, setModalMovimiento] = useState(false);
  const [efectivoContado, setEfectivoContado] = useState<number | "">("");
  const [notasCierre, setNotasCierre] = useState("");
  const [telefonoWhatsApp, setTelefonoWhatsApp] = useState("");

  const abrirCierre = () => {
    setEfectivoContado("");
    setNotasCierre("");
    setModalCierre(true);
  };

  return {
    modalCategorias, setModalCategorias,
    modalCotizaciones, setModalCotizaciones,
    modalCobro, setModalCobro,
    modalTicket, setModalTicket,
    modalTurno, setModalTurno,
    modalCierre, setModalCierre,
    modalMovimiento, setModalMovimiento,
    efectivoContado, setEfectivoContado,
    notasCierre, setNotasCierre,
    telefonoWhatsApp, setTelefonoWhatsApp,
    abrirCierre,
  };
}
