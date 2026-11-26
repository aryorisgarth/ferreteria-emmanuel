"use client";

import { useEffect, useState, useCallback } from "react";

export function useFullscreen() {
  const [esFullscreen, setEsFullscreen] = useState(false);
  const [soportado, setSoportado] = useState(false);

  useEffect(() => {
    if (typeof document !== "undefined") {
      const doc = document as any;
      setSoportado(
        Boolean(
          doc.fullscreenEnabled ||
          doc.webkitFullscreenEnabled ||
          doc.mozFullScreenEnabled ||
          doc.msFullscreenEnabled
        )
      );

      const handleFullscreenChange = () => {
        setEsFullscreen(
          Boolean(
            document.fullscreenElement ||
            doc.webkitFullscreenElement ||
            doc.mozFullScreenElement ||
            doc.msFullscreenElement
          )
        );
      };

      document.addEventListener("fullscreenchange", handleFullscreenChange);
      document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
      return () => {
        document.removeEventListener("fullscreenchange", handleFullscreenChange);
        document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      };
    }
  }, []);

  const alternarFullscreen = useCallback(async () => {
    if (typeof document === "undefined") return;
    const doc = document as any;
    const elem = document.documentElement as any;

    try {
      if (!esFullscreen) {
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
          await elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
          await elem.msRequestFullscreen();
        }
      } else {
        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        } else if (doc.msExitFullscreen) {
          await doc.msExitFullscreen();
        }
      }
    } catch (err) {
      console.warn("[PWA] Error al alternar pantalla completa:", err);
    }
  }, [esFullscreen]);

  return {
    soportado,
    esFullscreen,
    alternarFullscreen,
  };
}
