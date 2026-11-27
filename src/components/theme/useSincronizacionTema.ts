"use client";

import { useEffect, useRef, useCallback } from "react";
import type { TemaId } from "@/lib/theme";

interface SincronizacionProps {
  usuario: string;
  temaGuardadoId: TemaId;
  onTemaRemoto: (nuevoTema: TemaId) => void;
}

const CANAL_TEMA_SYNC = "fe_tema_sync";
const INTERVALO_SONDEO_MS = 25000;

export function useSincronizacionTema({
  usuario,
  temaGuardadoId,
  onTemaRemoto,
}: SincronizacionProps) {
  const canalRef = useRef<BroadcastChannel | null>(null);
  const temaRef = useRef<TemaId>(temaGuardadoId);
  temaRef.current = temaGuardadoId;

  const consultarTemaServidor = useCallback(async () => {
    if (typeof document !== "undefined" && document.hidden) return;
    try {
      const res = await fetch("/api/usuario/tema", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.tema && data.tema !== temaRef.current) {
        onTemaRemoto(data.tema as TemaId);
      }
    } catch {
      // Fallo silencioso de red sin interrumpir la experiencia
    }
  }, [onTemaRemoto]);

  // Canal de difusión multi-pestaña
  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;

    const canal = new BroadcastChannel(CANAL_TEMA_SYNC);
    canalRef.current = canal;

    canal.onmessage = (event) => {
      const { tipo, temaId, usuarioMsg } = event.data || {};
      if (tipo === "CAMBIO_TEMA" && temaId) {
        if (!usuarioMsg || !usuario || usuarioMsg === usuario) {
          onTemaRemoto(temaId as TemaId);
        }
      }
    };

    return () => {
      canal.close();
      canalRef.current = null;
    };
  }, [usuario, onTemaRemoto]);

  // Sincronización pasiva servidor (focus, visibility y sondeo suave)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const onVisibilidad = () => {
      if (!document.hidden) {
        consultarTemaServidor();
      }
    };

    window.addEventListener("focus", onVisibilidad);
    document.addEventListener("visibilitychange", onVisibilidad);
    const timer = setInterval(consultarTemaServidor, INTERVALO_SONDEO_MS);

    return () => {
      window.removeEventListener("focus", onVisibilidad);
      document.removeEventListener("visibilitychange", onVisibilidad);
      clearInterval(timer);
    };
  }, [consultarTemaServidor]);

  const emitirTemaLocal = useCallback(
    (temaId: TemaId) => {
      try {
        canalRef.current?.postMessage({
          tipo: "CAMBIO_TEMA",
          temaId,
          usuarioMsg: usuario,
        });
      } catch {
        // BroadcastChannel no disponible o error silencioso
      }
    },
    [usuario]
  );

  return { emitirTemaLocal, consultarTemaServidor };
}
