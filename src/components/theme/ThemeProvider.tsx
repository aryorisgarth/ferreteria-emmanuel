"use client";

import { createContext, useContext, useEffect, useState, useTransition, type ReactNode } from "react";
import {
  TEMAS_SISTEMA,
  TEMA_PREDETERMINADO,
  aplicarTemaDocumento,
  obtenerClaveAlmacenamientoTema,
  resolverTema,
  type TemaConfig,
  type TemaId,
} from "@/lib/theme";

interface ThemeContextType {
  temaActual: TemaConfig;
  temaPreview: TemaConfig | null;
  enVistaPrevia: boolean;
  previsualizarTema: (id: TemaId) => void;
  guardarTema: (id: TemaId) => void;
  descartarVistaPrevia: () => void;
  restaurarPredeterminado: () => void;
  usuarioActivo: string;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

interface ThemeProviderProps {
  children: ReactNode;
  usuarioInicial?: string;
}

export function ThemeProvider({ children, usuarioInicial = "" }: ThemeProviderProps) {
  const [usuario, setUsuario] = useState(usuarioInicial);
  const [temaGuardadoId, setTemaGuardadoId] = useState<TemaId>(TEMA_PREDETERMINADO);
  const [temaPreviewId, setTemaPreviewId] = useState<TemaId | null>(null);
  const [, startTransition] = useTransition();

  // Detectar usuario desde cookies o props si no se pasó inicialmente
  useEffect(() => {
    if (!usuario && typeof document !== "undefined") {
      const match = document.cookie.match(/(?:^|;\s*)fe_usuario=([^;]+)/);
      if (match && match[1]) {
        setUsuario(decodeURIComponent(match[1]));
      }
    }
  }, [usuario]);

  // Cargar tema persistido para este usuario específico
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const storageKey = obtenerClaveAlmacenamientoTema(usuario);
      const guardado = localStorage.getItem(storageKey);
      if (guardado && guardado in TEMAS_SISTEMA) {
        setTemaGuardadoId(guardado as TemaId);
        aplicarTemaDocumento(TEMAS_SISTEMA[guardado as TemaId]);
      } else {
        setTemaGuardadoId(TEMA_PREDETERMINADO);
        aplicarTemaDocumento(TEMAS_SISTEMA[TEMA_PREDETERMINADO]);
      }
    } catch {
      aplicarTemaDocumento(TEMAS_SISTEMA[TEMA_PREDETERMINADO]);
    }
  }, [usuario]);

  const previsualizarTema = (id: TemaId) => {
    setTemaPreviewId(id);
    const cfg = resolverTema(id);
    aplicarTemaDocumento(cfg);
  };

  const descartarVistaPrevia = () => {
    setTemaPreviewId(null);
    const cfg = resolverTema(temaGuardadoId);
    aplicarTemaDocumento(cfg);
  };

  const guardarTema = (id: TemaId) => {
    startTransition(() => {
      setTemaGuardadoId(id);
      setTemaPreviewId(null);
      const cfg = resolverTema(id);
      aplicarTemaDocumento(cfg);

      try {
        const storageKey = obtenerClaveAlmacenamientoTema(usuario);
        localStorage.setItem(storageKey, id);
      } catch (err) {
        console.error("No se pudo persistir el tema en localStorage:", err);
      }
    });
  };

  const restaurarPredeterminado = () => {
    guardarTema(TEMA_PREDETERMINADO);
  };

  const temaActual = resolverTema(temaPreviewId || temaGuardadoId);
  const temaPreview = temaPreviewId ? resolverTema(temaPreviewId) : null;

  return (
    <ThemeContext.Provider
      value={{
        temaActual,
        temaPreview,
        enVistaPrevia: Boolean(temaPreviewId),
        previsualizarTema,
        guardarTema,
        descartarVistaPrevia,
        restaurarPredeterminado,
        usuarioActivo: usuario || "general",
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme debe ser utilizado dentro de un ThemeProvider");
  }
  return ctx;
}
