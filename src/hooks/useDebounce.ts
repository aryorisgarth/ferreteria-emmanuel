"use client";

import { useEffect, useState } from "react";

/**
 * Hook reutilizable para retrasar actualizaciones de texto y evitar
 * ejecuciones masivas en inputs de búsqueda o filtros pesados.
 *
 * @param valor El valor a retrasar (típicamente texto de búsqueda)
 * @param retrasoMs Tiempo de espera en milisegundos (por defecto 300 ms)
 */
export function useDebounce<T>(valor: T, retrasoMs: number = 300): T {
  const [valorDebounce, setValorDebounce] = useState<T>(valor);

  useEffect(() => {
    const temporizador = setTimeout(() => {
      setValorDebounce(valor);
    }, retrasoMs);

    return () => {
      clearTimeout(temporizador);
    };
  }, [valor, retrasoMs]);

  return valorDebounce;
}
