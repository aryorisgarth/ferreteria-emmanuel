"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface UseNavbarKeyboardProps {
  pathname: string;
  setGrupoAbierto: (val: string | null) => void;
  setMenuUsuarioAbierto: (val: boolean) => void;
  setMenuMovilAbierto: (val: boolean) => void;
}

export function useNavbarKeyboard({
  pathname,
  setGrupoAbierto,
  setMenuUsuarioAbierto,
  setMenuMovilAbierto,
}: UseNavbarKeyboardProps) {
  const router = useRouter();
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setGrupoAbierto(null);
    setMenuUsuarioAbierto(false);
    setMenuMovilAbierto(false);
  }, [pathname, setGrupoAbierto, setMenuUsuarioAbierto, setMenuMovilAbierto]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setGrupoAbierto(null);
        setMenuUsuarioAbierto(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setGrupoAbierto, setMenuUsuarioAbierto]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (
        (e.key === "k" && (e.metaKey || e.ctrlKey)) ||
        (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA")
      ) {
        e.preventDefault();
        document.getElementById("top-search-input")?.focus();
      } else if (e.key === "F1") {
        e.preventDefault();
        router.push("/caja");
      } else if (e.key === "Escape") {
        setGrupoAbierto(null);
        setMenuUsuarioAbierto(false);
        setMenuMovilAbierto(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [router, setGrupoAbierto, setMenuUsuarioAbierto, setMenuMovilAbierto]);

  return { navRef, router };
}
