"use client";

import { useEffect, useRef } from "react";

interface UseAtajosPosProps {
  onBuscarFocus: () => void;
  onAbrirCotizaciones: () => void;
  onCobrar: () => void;
  onEscape: () => void;
  onEscaneo: (codigo: string) => void;
}

export function useAtajosPos({
  onBuscarFocus,
  onAbrirCotizaciones,
  onCobrar,
  onEscape,
  onEscaneo,
}: UseAtajosPosProps) {
  const ultimaTeclaRef = useRef<number>(Date.now());
  const bufferRef = useRef<string>("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F2 o Ctrl+K / Ctrl+F: Foco al buscador
      if (e.key === "F2" || (e.ctrlKey && (e.key.toLowerCase() === "f" || e.key.toLowerCase() === "k"))) {
        e.preventDefault();
        onBuscarFocus();
        return;
      }

      // F7: Cargar Cotizaciones
      if (e.key === "F7" || (e.altKey && e.key.toLowerCase() === "c")) {
        e.preventDefault();
        onAbrirCotizaciones();
        return;
      }

      // F12, F9 o Ctrl+Enter: Cobrar
      if (e.key === "F12" || e.key === "F9" || (e.ctrlKey && e.key === "Enter")) {
        e.preventDefault();
        onCobrar();
        return;
      }

      // Escape
      if (e.key === "Escape") {
        e.preventDefault();
        onEscape();
        return;
      }

      // Pistola lectora de códigos de barra (ráfaga < 150ms)
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "TEXTAREA" ||
          (target.tagName === "INPUT" &&
            (target as HTMLInputElement).type !== "search" &&
            (target as HTMLInputElement).name !== "q"))
      ) {
        return;
      }

      const ahora = Date.now();
      const delta = ahora - ultimaTeclaRef.current;
      ultimaTeclaRef.current = ahora;

      if (e.key === "Enter") {
        if (bufferRef.current.length >= 2) {
          e.preventDefault();
          onEscaneo(bufferRef.current);
          bufferRef.current = "";
        }
      } else if (e.key.length === 1) {
        if (delta > 150) {
          bufferRef.current = "";
        }
        bufferRef.current += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onBuscarFocus, onAbrirCotizaciones, onCobrar, onEscape, onEscaneo]);
}
