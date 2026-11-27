"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useTransition,
  useCallback,
  type ReactNode,
} from "react";
import {
  TEMAS_SISTEMA,
  TEMA_PREDETERMINADO,
  aplicarTemaDocumento,
  obtenerClaveAlmacenamientoTema,
  resolverTema,
  type TemaConfig,
  type TemaId,
} from "@/lib/theme";
import { fijarTemaAction } from "@/app/actions/tema.actions";
import { useSincronizacionTema } from "./useSincronizacionTema";

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
  temaInicial?: TemaId;
}

export function ThemeProvider({
  children,
  usuarioInicial = "",
  temaInicial = TEMA_PREDETERMINADO,
}: ThemeProviderProps) {
  const [usuario, setUsuario] = useState(usuarioInicial);
  const [temaGuardadoId, setTemaGuardadoId] = useState<TemaId>(temaInicial);
  const [temaPreviewId, setTemaPreviewId] = useState<TemaId | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!usuario && typeof document !== "undefined") {
      const match = document.cookie.match(/(?:^|;\s*)fe_usuario=([^;]+)/);
      if (match?.[1]) setUsuario(decodeURIComponent(match[1]));
    }
  }, [usuario]);

  const manejarTemaRemoto = useCallback(
    (nuevoTema: TemaId) => {
      setTemaGuardadoId(nuevoTema);
      try {
        localStorage.setItem(obtenerClaveAlmacenamientoTema(usuario), nuevoTema);
      } catch {}
      if (!temaPreviewId) aplicarTemaDocumento(resolverTema(nuevoTema));
    },
    [usuario, temaPreviewId]
  );

  const { emitirTemaLocal } = useSincronizacionTema({
    usuario,
    temaGuardadoId,
    onTemaRemoto: manejarTemaRemoto,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const storageKey = obtenerClaveAlmacenamientoTema(usuario);
      const guardado = localStorage.getItem(storageKey);
      if (guardado && guardado in TEMAS_SISTEMA) {
        setTemaGuardadoId(guardado as TemaId);
        aplicarTemaDocumento(TEMAS_SISTEMA[guardado as TemaId]);
      } else {
        aplicarTemaDocumento(resolverTema(temaGuardadoId));
      }
    } catch {
      aplicarTemaDocumento(resolverTema(temaGuardadoId));
    }
  }, [usuario, temaGuardadoId]);

  const previsualizarTema = (id: TemaId) => {
    setTemaPreviewId(id);
    aplicarTemaDocumento(resolverTema(id));
  };

  const descartarVistaPrevia = () => {
    setTemaPreviewId(null);
    aplicarTemaDocumento(resolverTema(temaGuardadoId));
  };

  const guardarTema = (id: TemaId) => {
    setTemaGuardadoId(id);
    setTemaPreviewId(null);
    aplicarTemaDocumento(resolverTema(id));

    try {
      localStorage.setItem(obtenerClaveAlmacenamientoTema(usuario), id);
    } catch {}

    emitirTemaLocal(id);
    startTransition(async () => {
      await fijarTemaAction(id);
    });
  };

  const restaurarPredeterminado = () => guardarTema(TEMA_PREDETERMINADO);

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
