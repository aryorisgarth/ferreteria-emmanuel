"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
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
  guardarTema: (id: TemaId) => Promise<{ ok: boolean; error?: string }>;
  descartarVistaPrevia: () => void;
  restaurarPredeterminado: () => Promise<{ ok: boolean; error?: string }>;
  usuarioActivo: string;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({
  children,
  usuarioInicial = "",
  temaInicial = TEMA_PREDETERMINADO,
}: {
  children: ReactNode;
  usuarioInicial?: string;
  temaInicial?: TemaId;
}) {
  const [usuario, setUsuario] = useState(usuarioInicial);
  const [temaGuardadoId, setTemaGuardadoId] = useState<TemaId>(temaInicial);
  const [temaPreviewId, setTemaPreviewId] = useState<TemaId | null>(null);

  useEffect(() => {
    if (!usuario && typeof document !== "undefined") {
      const match = document.cookie.match(/(?:^|;\s*)fe_usuario=([^;]+)/);
      if (match?.[1]) setUsuario(decodeURIComponent(match[1]));
    }
  }, [usuario]);

  const manejarTemaRemoto = useCallback((nuevoTema: TemaId) => {
    setTemaGuardadoId(nuevoTema);
    try {
      localStorage.setItem(obtenerClaveAlmacenamientoTema(usuario), nuevoTema);
      document.cookie = `fe_tema=${encodeURIComponent(nuevoTema)}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {}
    if (!temaPreviewId) aplicarTemaDocumento(resolverTema(nuevoTema));
  }, [usuario, temaPreviewId]);

  const { emitirTemaLocal } = useSincronizacionTema({
    usuario,
    temaGuardadoId,
    enVistaPrevia: Boolean(temaPreviewId),
    onTemaRemoto: manejarTemaRemoto,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const guardado = localStorage.getItem(obtenerClaveAlmacenamientoTema(usuario));
      if (guardado && guardado in TEMAS_SISTEMA) {
        setTemaGuardadoId(guardado as TemaId);
        if (!temaPreviewId) aplicarTemaDocumento(TEMAS_SISTEMA[guardado as TemaId]);
      } else if (!temaPreviewId) {
        aplicarTemaDocumento(resolverTema(temaGuardadoId));
      }
    } catch {
      if (!temaPreviewId) aplicarTemaDocumento(resolverTema(temaGuardadoId));
    }
  }, [usuario, temaGuardadoId, temaPreviewId]);

  const previsualizarTema = (id: TemaId) => {
    setTemaPreviewId(id);
    aplicarTemaDocumento(resolverTema(id));
  };

  const descartarVistaPrevia = () => {
    setTemaPreviewId(null);
    aplicarTemaDocumento(resolverTema(temaGuardadoId));
  };

  const guardarTema = async (id: TemaId): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await fijarTemaAction(id);
      if (!res.ok) {
        aplicarTemaDocumento(resolverTema(temaGuardadoId));
        return { ok: false, error: res.error || "No se pudo guardar la preferencia en PostgreSQL." };
      }
      setTemaGuardadoId(id);
      setTemaPreviewId(null);
      aplicarTemaDocumento(resolverTema(id));
      try {
        localStorage.setItem(obtenerClaveAlmacenamientoTema(usuario), id);
        document.cookie = `fe_tema=${encodeURIComponent(id)}; path=/; max-age=31536000; SameSite=Lax`;
      } catch {}
      emitirTemaLocal(id);
      return { ok: true };
    } catch (err: any) {
      aplicarTemaDocumento(resolverTema(temaGuardadoId));
      return { ok: false, error: err?.message || "Error al conectar con el servidor." };
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        temaActual: resolverTema(temaPreviewId || temaGuardadoId),
        temaPreview: temaPreviewId ? resolverTema(temaPreviewId) : null,
        enVistaPrevia: Boolean(temaPreviewId),
        previsualizarTema,
        guardarTema,
        descartarVistaPrevia,
        restaurarPredeterminado: () => guardarTema(TEMA_PREDETERMINADO),
        usuarioActivo: usuario || "general",
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme debe ser utilizado dentro de un ThemeProvider");
  return ctx;
}
