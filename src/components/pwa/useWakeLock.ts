"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export function useWakeLock() {
  const [soportado, setSoportado] = useState(false);
  const [activo, setActivo] = useState(false);
  const sentinelRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "wakeLock" in navigator) {
      setSoportado(true);
    }
  }, []);

  const solicitarWakeLock = useCallback(async () => {
    if (typeof window === "undefined" || !("wakeLock" in navigator)) return false;
    try {
      if (sentinelRef.current) return true;
      const sentinel = await navigator.wakeLock.request("screen");
      sentinelRef.current = sentinel;
      setActivo(true);

      sentinel.addEventListener("release", () => {
        sentinelRef.current = null;
        setActivo(false);
      });
      return true;
    } catch (err) {
      console.warn("[WakeLock] No se pudo activar Screen Wake Lock:", err);
      setActivo(false);
      return false;
    }
  }, []);

  const liberarWakeLock = useCallback(async () => {
    if (sentinelRef.current) {
      await sentinelRef.current.release();
      sentinelRef.current = null;
      setActivo(false);
    }
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const habilitado = localStorage.getItem("fe_wake_lock_enabled") === "true";
      if (document.visibilityState === "visible" && habilitado && !sentinelRef.current) {
        solicitarWakeLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      liberarWakeLock();
    };
  }, [solicitarWakeLock, liberarWakeLock]);

  return {
    soportado,
    activo,
    solicitarWakeLock,
    liberarWakeLock,
  };
}
