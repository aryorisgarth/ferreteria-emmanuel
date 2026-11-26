"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useWakeLock } from "./useWakeLock";

interface WakeLockContextType {
  soportado: boolean;
  activo: boolean;
  habilitado: boolean;
  toggleWakeLock: () => void;
}

const WakeLockContext = createContext<WakeLockContextType>({
  soportado: false,
  activo: false,
  habilitado: false,
  toggleWakeLock: () => {},
});

export function WakeLockProvider({ children }: { children: React.ReactNode }) {
  const { soportado, activo, solicitarWakeLock, liberarWakeLock } = useWakeLock();
  const [habilitado, setHabilitado] = useState(false);

  useEffect(() => {
    const guardado = localStorage.getItem("fe_wake_lock_enabled") === "true";
    setHabilitado(guardado);
    if (guardado) {
      solicitarWakeLock();
    }
  }, [solicitarWakeLock]);

  const toggleWakeLock = () => {
    const nuevoEstado = !habilitado;
    setHabilitado(nuevoEstado);
    localStorage.setItem("fe_wake_lock_enabled", String(nuevoEstado));
    if (nuevoEstado) {
      solicitarWakeLock();
    } else {
      liberarWakeLock();
    }
  };

  return (
    <WakeLockContext.Provider
      value={{
        soportado,
        activo,
        habilitado,
        toggleWakeLock,
      }}
    >
      {children}
    </WakeLockContext.Provider>
  );
}

export const useWakeLockContext = () => useContext(WakeLockContext);
