"use client";

import { useEffect, useRef, useCallback } from "react";
import type { TemaId } from "@/lib/theme";

interface SincronizacionProps {
  usuario: string;
  temaGuardadoId: TemaId;
  enVistaPrevia: boolean;
  onTemaRemoto: (nuevoTema: TemaId) => void;
}

const CANAL_TEMA_SYNC = "fe_tema_sync";
const INTERVALO_SONDEO_MS = 25000;

export function useSincronizacionTema({
  usuario,
  temaGuardadoId,
  enVistaPrevia,
  onTemaRemoto,
}: SincronizacionProps) {
  const canalRef = useRef<BroadcastChannel | null>(null);
  const temaRef = useRef<TemaId>(temaGuardadoId);
  temaRef.current = temaGuardadoId;

  const enVistaPreviaRef = useRef<boolean>(enVistaPrevia);
  enVistaPreviaRef.current = enVistaPrevia;

  const ultimoGuardadoLocalRef = useRef<number>(0);

  const consultarTemaServidor = useCallback(async () => {
    if (typeof document !== "undefined" && document.hidden) return;
    // Si hay una previsualización activa en este dispositivo, nunca interrumpirla
    if (enVistaPreviaRef.current) return;
    // Evitar que respuestas en vuelo atrasadas sobrescriban una selección recién fijada
    if (Date.now() - ultimoGuardadoLocalRef.current < 4000) return;

    try {
      const res = await fetch("/api/usuario/tema", {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (
        data?.tema &&
        data.tema !== temaRef.current &&
        !enVistaPreviaRef.current &&
        Date.now() - ultimoGuardadoLocalRef.current >= 4000
      ) {
        onTemaRemoto(data.tema as TemaId);
      }
    } catch {}
  }, [onTemaRemoto]);

  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;

    const canal = new BroadcastChannel(CANAL_TEMA_SYNC);
    canalRef.current = canal;

    canal.onmessage = (event) => {
      const { tipo, temaId, usuarioMsg } = event.data || {};
      if (tipo === "CAMBIO_TEMA" && temaId && !enVistaPreviaRef.current) {
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

  useEffect(() => {
    if (typeof window === "undefined") return;

    consultarTemaServidor();

    const onVisibilidad = () => {
      if (!document.hidden && !enVistaPreviaRef.current) {
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
      ultimoGuardadoLocalRef.current = Date.now();
      try {
        canalRef.current?.postMessage({
          tipo: "CAMBIO_TEMA",
          temaId,
          usuarioMsg: usuario,
        });
      } catch {}
    },
    [usuario]
  );

  return { emitirTemaLocal, consultarTemaServidor };
}
