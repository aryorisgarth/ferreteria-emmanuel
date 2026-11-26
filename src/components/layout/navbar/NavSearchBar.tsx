"use client";

import { Search } from "lucide-react";

interface NavSearchBarProps {
  onAbrirModal: () => void;
}

export function NavSearchBar({ onAbrirModal }: NavSearchBarProps) {
  return (
    <button
      type="button"
      onClick={onAbrirModal}
      title="Buscar en el sistema (/ o Ctrl+K)"
      aria-label="Abrir buscador global"
      style={{
        backgroundColor: "var(--theme-header-input-bg, #F8FAFC)",
        borderColor: "var(--theme-header-border, #E2E8F0)",
        color: "var(--theme-header-text, #0F172A)",
      }}
      className="flex h-8 items-center gap-2 rounded-md border px-2 sm:px-2.5 text-xs text-slate-500 hover:text-slate-900 transition hover:bg-slate-100/80 cursor-pointer shrink-0"
    >
      <Search size={14} style={{ color: "var(--theme-header-icon, #64748B)" }} className="shrink-0" />
      <span className="hidden xl:inline text-xs font-medium text-slate-500">Buscar...</span>
      <kbd className="hidden sm:inline rounded border border-slate-200 bg-slate-100 px-1 py-0.2 text-[9px] font-mono font-medium text-slate-500">
        /
      </kbd>
    </button>
  );
}
