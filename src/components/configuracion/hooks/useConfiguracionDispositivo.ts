"use client";

import { useState, useEffect } from "react";
import type { ConfiguracionDispositivoLocal } from "../types";

const CLAVE_LOCAL = "ferreteria_emmanuel_dispositivo_v1";

const CONFIG_DISPOSITIVO_DEFAULT: ConfiguracionDispositivoLocal = {
  formatoTicket: "80mm",
  impresionAutomatica: true,
  lectorCodigoBarrasActivo: true,
  densidadInterfaz: "comoda",
  sonidoLectura: true,
};

export function useConfiguracionDispositivo() {
  const [configLocal, setConfigLocal] = useState<ConfiguracionDispositivoLocal>(
    CONFIG_DISPOSITIVO_DEFAULT
  );
  const [cargado, setCargado] = useState(false);
  const [guardadoExitoso, setGuardadoExitoso] = useState(false);

  useEffect(() => {
    try {
      const guardado = localStorage.getItem(CLAVE_LOCAL);
      if (guardado) {
        setConfigLocal({
          ...CONFIG_DISPOSITIVO_DEFAULT,
          ...JSON.parse(guardado),
        });
      }
    } catch {
      // Si localStorage no está disponible, usar default
    } finally {
      setCargado(true);
    }
  }, []);

  const actualizarDispositivo = (
    cambios: Partial<ConfiguracionDispositivoLocal>
  ) => {
    const actualizada = { ...configLocal, ...cambios };
    setConfigLocal(actualizada);
    try {
      localStorage.setItem(CLAVE_LOCAL, JSON.stringify(actualizada));
      setGuardadoExitoso(true);
      setTimeout(() => setGuardadoExitoso(false), 2500);
    } catch {
      console.warn("No se pudo persistir en localStorage");
    }
  };

  const restaurarDispositivo = () => {
    setConfigLocal(CONFIG_DISPOSITIVO_DEFAULT);
    try {
      localStorage.setItem(
        CLAVE_LOCAL,
        JSON.stringify(CONFIG_DISPOSITIVO_DEFAULT)
      );
      setGuardadoExitoso(true);
      setTimeout(() => setGuardadoExitoso(false), 2500);
    } catch {}
  };

  return {
    configDispositivo: configLocal,
    cargado,
    guardadoExitoso,
    actualizarDispositivo,
    restaurarDispositivo,
  };
}
